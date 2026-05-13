export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiSuccessBody<TData> = {
  data: TData;
  meta?: unknown;
};

export type HealthResponse = {
  status: "ok";
  service: string;
};

export type AdminRole = "OWNER" | "MANAGER" | "STAFF";

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

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  admin: AdminProfile;
};

export type CurrentAdminResponse = {
  admin: AdminProfile;
};

export type Branch = {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type BranchFormRequest = {
  name: string;
};

export type ListBranchesResponse = {
  branches: Branch[];
};

export type BranchResponse = {
  branch: Branch;
};
