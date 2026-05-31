import type { AdminRole, AdminUser } from "@prisma/client";
import type { DbClient } from "../shared/prisma/types.js";

export const listAdminUsersByTenant = async (db: DbClient, tenantId: string): Promise<AdminUser[]> => {
  return db.adminUser.findMany({
    where: {
      tenantId
    },
    orderBy: [
      {
        role: "asc"
      },
      {
        createdAt: "desc"
      }
    ]
  });
};

export const findAdminUserByTenant = async (
  db: DbClient,
  input: {
    tenantId: string;
    adminId: string;
  }
): Promise<AdminUser | null> => {
  return db.adminUser.findFirst({
    where: {
      tenantId: input.tenantId,
      id: input.adminId
    }
  });
};

export const findAdminUserByTenantEmail = async (
  db: DbClient,
  input: {
    tenantId: string;
    email: string;
  }
): Promise<AdminUser | null> => {
  return db.adminUser.findFirst({
    where: {
      tenantId: input.tenantId,
      email: input.email
    }
  });
};

export const createAdminUser = async (
  db: DbClient,
  input: {
    tenantId: string;
    email: string;
    name: string;
    passwordHash: string;
    role: AdminRole;
  }
): Promise<AdminUser> => {
  return db.adminUser.create({
    data: {
      tenantId: input.tenantId,
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash,
      role: input.role
    }
  });
};

export const updateAdminUserByTenant = async (
  db: DbClient,
  input: {
    tenantId: string;
    adminId: string;
    data: {
      email?: string;
      name?: string;
      role?: AdminRole;
      isActive?: boolean;
    };
  }
): Promise<AdminUser | null> => {
  const result = await db.adminUser.updateMany({
    where: {
      tenantId: input.tenantId,
      id: input.adminId
    },
    data: input.data
  });

  if (result.count === 0) {
    return null;
  }

  return findAdminUserByTenant(db, {
    tenantId: input.tenantId,
    adminId: input.adminId
  });
};

export const updateAdminUserPasswordByTenant = async (
  db: DbClient,
  input: {
    tenantId: string;
    adminId: string;
    passwordHash: string;
  }
): Promise<AdminUser | null> => {
  const result = await db.adminUser.updateMany({
    where: {
      tenantId: input.tenantId,
      id: input.adminId
    },
    data: {
      passwordHash: input.passwordHash
    }
  });

  if (result.count === 0) {
    return null;
  }

  return findAdminUserByTenant(db, {
    tenantId: input.tenantId,
    adminId: input.adminId
  });
};
