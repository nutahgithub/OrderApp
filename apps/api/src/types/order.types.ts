import type { OrderStatus } from "@prisma/client";

export type OrderItemDto = {
  id: string;
  menuId: string;
  menuName: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  createdAt: string;
};

export type OrderDto = {
  id: string;
  tenantId: string;
  branchId: string;
  branchName: string;
  tableId: string;
  tableName: string;
  status: OrderStatus;
  total: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderDetailDto = OrderDto & {
  items: OrderItemDto[];
};

export type CreateQrOrderInput = {
  items: Array<{
    menuId: string;
    quantity: number;
  }>;
};

export type ListOrdersInput = {
  branchId: string;
  status?: OrderStatus;
};

export type UpdateOrderStatusInput = {
  status: Exclude<OrderStatus, "PENDING" | "PAID">;
};
