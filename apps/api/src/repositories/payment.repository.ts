import type { Payment, PaymentMethod, Prisma } from "@prisma/client";
import type { DbClient } from "../shared/prisma/types.js";

export type PaymentRecord = Payment;

export const findPaymentByTenantOrder = async (
  db: DbClient,
  input: {
    tenantId: string;
    orderId: string;
  }
): Promise<PaymentRecord | null> => {
  return db.payment.findFirst({
    where: {
      tenantId: input.tenantId,
      orderId: input.orderId
    }
  });
};

export const createCompletedPayment = async (
  db: DbClient,
  input: {
    tenantId: string;
    branchId: string;
    orderId: string;
    method: PaymentMethod;
    amount: Prisma.Decimal;
  }
): Promise<PaymentRecord> => {
  return db.payment.create({
    data: {
      tenantId: input.tenantId,
      branchId: input.branchId,
      orderId: input.orderId,
      method: input.method,
      amount: input.amount,
      status: "COMPLETED"
    }
  });
};
