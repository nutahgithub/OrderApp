import type { Branch, RestaurantTable, TableStatus } from "@prisma/client";
import type { DbClient } from "../shared/prisma/types.js";

export type QrEntryRecord = RestaurantTable & {
  branch: Pick<Branch, "id" | "name">;
};

export const listTablesByTenantBranch = async (
  db: DbClient,
  input: {
    tenantId: string;
    branchId: string;
  }
): Promise<RestaurantTable[]> => {
  return db.restaurantTable.findMany({
    where: {
      tenantId: input.tenantId,
      branchId: input.branchId
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};

export const createTable = async (
  db: DbClient,
  input: {
    tenantId: string;
    branchId: string;
    name: string;
    status?: TableStatus;
  }
): Promise<RestaurantTable> => {
  return db.restaurantTable.create({
    data: {
      tenantId: input.tenantId,
      branchId: input.branchId,
      name: input.name,
      ...(input.status ? { status: input.status } : {})
    }
  });
};

export const updateTableByTenant = async (
  db: DbClient,
  input: {
    tenantId: string;
    tableId: string;
    name: string;
    status: TableStatus;
  }
): Promise<RestaurantTable | null> => {
  const result = await db.restaurantTable.updateMany({
    where: {
      id: input.tableId,
      tenantId: input.tenantId
    },
    data: {
      name: input.name,
      status: input.status
    }
  });

  if (result.count === 0) {
    return null;
  }

  return db.restaurantTable.findFirst({
    where: {
      id: input.tableId,
      tenantId: input.tenantId
    }
  });
};

export const findTableQrEntry = async (
  db: DbClient,
  input: {
    tenantId: string;
    branchId: string;
    tableId: string;
  }
): Promise<QrEntryRecord | null> => {
  return db.restaurantTable.findFirst({
    where: {
      id: input.tableId,
      tenantId: input.tenantId,
      branchId: input.branchId
    },
    include: {
      branch: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
};
