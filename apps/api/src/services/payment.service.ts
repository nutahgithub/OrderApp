import { Prisma } from "@prisma/client";
import { IdempotencyAction } from "@prisma/client";
import {
  attachIdempotencyResource,
  createIdempotencyKey,
  findIdempotencyKey
} from "../repositories/idempotency.repository.js";
import type { PaymentRecord } from "../repositories/payment.repository.js";
import { createCompletedPayment, findPaymentByTenantOrder } from "../repositories/payment.repository.js";
import { findOrderByTenant, updateOrderStatusByTenant } from "../repositories/order.repository.js";
import type { OrderRecord } from "../repositories/order.repository.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { hashIdempotencyPayload } from "../shared/http/idempotency.js";
import { logger } from "../shared/logger/logger.js";
import { prisma } from "../shared/prisma/client.js";
import { emitPaymentCompleted } from "../shared/realtime/socket.js";
import type { ConfirmPaymentInput, ConfirmPaymentResultDto, PaymentDto } from "../types/payment.types.js";
import { toOrderDetailDto } from "./order.service.js";

const toMoney = (value: Prisma.Decimal): string => {
  return value.toFixed(2);
};

const toPaymentDto = (payment: PaymentRecord): PaymentDto => {
  return {
    id: payment.id,
    tenantId: payment.tenantId,
    branchId: payment.branchId,
    orderId: payment.orderId,
    method: payment.method,
    amount: toMoney(payment.amount),
    status: payment.status,
    paidAt: payment.paidAt.toISOString(),
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString()
  };
};

const normalizePaymentAmount = (amount: string): string => {
  return new Prisma.Decimal(amount).toFixed(2);
};

const buildConfirmPaymentIdempotencyHash = (orderId: string, input: ConfirmPaymentInput): string => {
  return hashIdempotencyPayload({
    orderId,
    amount: normalizePaymentAmount(input.amount),
    method: input.method
  });
};

const loadIdempotentPaymentResult = async (
  db: Parameters<typeof findOrderByTenant>[0],
  input: {
    tenantId: string;
    orderId: string;
    idempotencyKey: string;
    requestHash: string;
  }
): Promise<{ order: OrderRecord; payment: PaymentRecord } | null> => {
  const existingKey = await findIdempotencyKey(db, {
    tenantId: input.tenantId,
    action: IdempotencyAction.CONFIRM_PAYMENT,
    key: input.idempotencyKey
  });

  if (!existingKey) {
    return null;
  }

  if (existingKey.requestHash !== input.requestHash || !existingKey.resourceId) {
    throw new AppError(ErrorCode.IdempotencyKeyConflict);
  }

  const [order, payment] = await Promise.all([
    findOrderByTenant(db, {
      tenantId: input.tenantId,
      orderId: input.orderId
    }),
    findPaymentByTenantOrder(db, {
      tenantId: input.tenantId,
      orderId: input.orderId
    })
  ]);

  if (!order || !payment || payment.id !== existingKey.resourceId) {
    throw new AppError(ErrorCode.IdempotencyKeyConflict);
  }

  return {
    order,
    payment
  };
};

export const confirmTenantOrderPayment = async (
  tenantId: string,
  orderId: string,
  input: ConfirmPaymentInput,
  idempotencyKey: string
): Promise<ConfirmPaymentResultDto> => {
  const amount = new Prisma.Decimal(input.amount);
  const requestHash = buildConfirmPaymentIdempotencyHash(orderId, input);
  let isReplay = false;
  let result: { order: OrderRecord; payment: PaymentRecord };

  try {
    result = await prisma.$transaction(async (tx) => {
      const existingResult = await loadIdempotentPaymentResult(tx, {
        tenantId,
        orderId,
        idempotencyKey,
        requestHash
      });

      if (existingResult) {
        isReplay = true;
        return existingResult;
      }

      const keyRecord = await createIdempotencyKey(tx, {
        tenantId,
        action: IdempotencyAction.CONFIRM_PAYMENT,
        key: idempotencyKey,
        requestHash
      });

      const order = await findOrderByTenant(tx, {
        tenantId,
        orderId
      });

      if (!order) {
        throw new AppError(ErrorCode.OrderNotFound);
      }

      if (order.status === "CANCELLED") {
        throw new AppError(ErrorCode.OrderCannotBePaid);
      }

      if (order.status === "PAID") {
        throw new AppError(ErrorCode.OrderAlreadyPaid);
      }

      if (!amount.equals(order.total)) {
        throw new AppError(ErrorCode.PaymentAmountMismatch);
      }

      const existingPayment = await findPaymentByTenantOrder(tx, {
        tenantId,
        orderId
      });

      if (existingPayment) {
        throw new AppError(ErrorCode.OrderAlreadyPaid);
      }

      try {
        const payment = await createCompletedPayment(tx, {
          tenantId,
          branchId: order.branchId,
          orderId: order.id,
          method: input.method,
          amount
        });

        await attachIdempotencyResource(tx, {
          id: keyRecord.id,
          resourceId: payment.id
        });

        const paidOrder = await updateOrderStatusByTenant(tx, {
          tenantId,
          orderId,
          status: "PAID"
        });

        if (!paidOrder) {
          throw new AppError(ErrorCode.OrderNotFound);
        }

        return {
          order: paidOrder,
          payment
        };
      } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          throw new AppError(ErrorCode.OrderAlreadyPaid);
        }

        throw error;
      }
    });
  } catch (error: unknown) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }

    const existingResult = await prisma.$transaction((tx) =>
      loadIdempotentPaymentResult(tx, {
        tenantId,
        orderId,
        idempotencyKey,
        requestHash
      })
    );

    if (!existingResult) {
      throw error;
    }

    isReplay = true;
    result = existingResult;
  }

  const dto = {
    order: toOrderDetailDto(result.order),
    payment: toPaymentDto(result.payment)
  };

  if (isReplay) {
    return dto;
  }

  logger.info("payment_completed", {
    tenantId,
    branchId: dto.order.branchId,
    orderId: dto.order.id,
    paymentId: dto.payment.id
  });

  emitPaymentCompleted(dto);

  return dto;
};
