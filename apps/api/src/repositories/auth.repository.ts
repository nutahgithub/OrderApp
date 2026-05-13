import type { AdminRole } from "@prisma/client";
import type { DbClient } from "../shared/prisma/types.js";

export type AdminWithTenant = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  passwordHash: string;
  role: AdminRole;
  tenant: {
    id: string;
    name: string;
  };
};

const adminWithTenantInclude = {
  tenant: {
    select: {
      id: true,
      name: true
    }
  }
} as const;

export const findAdminByEmail = async (db: DbClient, email: string): Promise<AdminWithTenant | null> => {
  return db.adminUser.findFirst({
    where: {
      email
    },
    include: adminWithTenantInclude
  });
};

export const findAdminByIdAndTenant = async (
  db: DbClient,
  userId: string,
  tenantId: string
): Promise<AdminWithTenant | null> => {
  return db.adminUser.findFirst({
    where: {
      id: userId,
      tenantId
    },
    include: adminWithTenantInclude
  });
};
