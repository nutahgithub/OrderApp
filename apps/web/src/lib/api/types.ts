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

export type TableStatus = "AVAILABLE" | "OCCUPIED" | "DISABLED";

export type RestaurantTable = {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  status: TableStatus;
  qrUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type TableFormRequest = {
  branchId?: string;
  name: string;
  status: TableStatus;
};

export type CreateTableRequest = {
  branchId: string;
  name: string;
  status?: TableStatus;
};

export type ListTablesResponse = {
  tables: RestaurantTable[];
};

export type TableResponse = {
  table: RestaurantTable;
};

export type QrEntry = {
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

export type QrEntryResponse = {
  qrEntry: QrEntry;
};
