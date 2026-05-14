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

export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "CANCELLED" | "PAID";

export type Order = {
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

export type OrderItem = {
  id: string;
  menuId: string;
  menuName: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  createdAt: string;
};

export type OrderDetail = Order & {
  items: OrderItem[];
};

export type UpdateOrderStatusRequest = {
  status: "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";
};

export type CreateQrOrderRequest = {
  items: Array<{
    menuId: string;
    quantity: number;
  }>;
};

export type ListOrdersResponse = {
  orders: Order[];
};

export type OrderResponse = {
  order: OrderDetail;
};

export type Menu = {
  id: string;
  tenantId: string;
  name: string;
  price: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MenuFormRequest = {
  name: string;
  price: string;
  imageUrl?: string | null;
  isActive: boolean;
};

export type CreateMenuRequest = {
  name: string;
  price: string;
  imageUrl?: string | null;
  isActive?: boolean;
};

export type ListMenusResponse = {
  menus: Menu[];
};

export type MenuResponse = {
  menu: Menu;
};

export type UploadImageRequest = {
  fileName: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  dataBase64: string;
};

export type UploadImage = {
  url: string;
  key: string;
  sizeBytes: number;
};

export type UploadImageResponse = {
  upload: UploadImage;
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
