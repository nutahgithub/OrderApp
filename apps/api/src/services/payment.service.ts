import { Prisma } from "@prisma/client";
import type { PaymentRecord } from "../repositories/payment.repository.js";
import { createCompletedPayment, findPaymentByTenantOrder } from "../repositories/payment.repository.js";
import { findOrderByTenant, updateOrderStatusByTenant } from "../repositories/order.repository.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
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

export const confirmTenantOrderPayment = async (
  tenantId: string,
  orderId: string,
  input: ConfirmPaymentInput
): Promise<ConfirmPaymentResultDto> => {
  const amount = new Prisma.Decimal(input.amount);

  const result = await prisma.$transaction(async (tx) => {
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

  const dto = {
    order: toOrderDetailDto(result.order),
    payment: toPaymentDto(result.payment)
  };

  logger.info("payment_completed", {
    tenantId,
    branchId: dto.order.branchId,
    orderId: dto.order.id,
    paymentId: dto.payment.id
  });

  emitPaymentCompleted(dto);

  return dto;
};
