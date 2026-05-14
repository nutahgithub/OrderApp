import type { OrderStatus } from "@prisma/client";

export type CreateCustomerOrderInput = {
  items: Array<{
    menuId: string;
    quantity: number;
  }>;
};

export type OrderItemDto = {
  id: string;
  menuId: string;
  name: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

export type OrderSummaryDto = {
  id: string;
  tenantId: string;
  branchId: string;
  tableId: string;
  status: OrderStatus;
  total: string;
  createdAt: string;
  updatedAt: string;
  branch: {
    id: string;
    name: string;
  };
  table: {
    id: string;
    name: string;
  };
  items: OrderItemDto[];
};
