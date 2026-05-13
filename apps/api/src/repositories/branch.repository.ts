import type { Branch } from "@prisma/client";
import type { DbClient } from "../shared/prisma/types.js";

export const listBranchesByTenant = async (db: DbClient, tenantId: string): Promise<Branch[]> => {
  return db.branch.findMany({
    where: {
      tenantId
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};

export const findBranchByTenant = async (
  db: DbClient,
  input: {
    branchId: string;
    tenantId: string;
  }
): Promise<Branch | null> => {
  return db.branch.findFirst({
    where: {
      id: input.branchId,
      tenantId: input.tenantId
    }
  });
};

export const createBranch = async (
  db: DbClient,
  input: {
    tenantId: string;
    name: string;
  }
): Promise<Branch> => {
  return db.branch.create({
    data: {
      tenantId: input.tenantId,
      name: input.name
    }
  });
};

export const updateBranchByTenant = async (
  db: DbClient,
  input: {
    branchId: string;
    tenantId: string;
    name: string;
  }
): Promise<Branch | null> => {
  const result = await db.branch.updateMany({
    where: {
      id: input.branchId,
      tenantId: input.tenantId
    },
    data: {
      name: input.name
    }
  });

  if (result.count === 0) {
    return null;
  }

  return db.branch.findFirst({
    where: {
      id: input.branchId,
      tenantId: input.tenantId
    }
  });
};
