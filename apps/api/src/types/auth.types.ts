import type { AdminRole } from "@prisma/client";

export type AdminSession = {
  userId: string;
  tenantId: string;
  role: AdminRole;
};

export type AdminProfile = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: AdminRole;
  tenant: {
    id: string;
    name: string;
  };
};

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult = {
  token: string;
  admin: AdminProfile;
};

