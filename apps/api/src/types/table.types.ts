import type { TableStatus } from "@prisma/client";

export type TableDto = {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  status: TableStatus;
  qrUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type QrEntryDto = {
  tenantId: string;
  branch: {
    id: string;
    name: string;
  };
  table: {
    id: string;
    name: string;
    status: TableStatus;
  };
};

export type CreateTableInput = {
  branchId: string;
  name: string;
  status?: TableStatus;
};

export type UpdateTableInput = {
  name: string;
  status: TableStatus;
};
