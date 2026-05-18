import type { PaymentMethod, PaymentStatus } from "@prisma/client";
import type { OrderDetailDto } from "./order.types.js";

export type ConfirmPaymentInput = {
  amount: string;
  method: PaymentMethod;
};

export type PaymentDto = {
  id: string;
  tenantId: string;
  branchId: string;
  orderId: string;
  method: PaymentMethod;
  amount: string;
  status: PaymentStatus;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ConfirmPaymentResultDto = {
  order: OrderDetailDto;
  payment: PaymentDto;
};
