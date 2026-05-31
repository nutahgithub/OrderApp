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

export type AdminUser = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdminUserRequest = {
  email: string;
  name: string;
  password: string;
  role: AdminRole;
};

export type UpdateAdminUserRequest = {
  email?: string;
  name?: string;
  role?: AdminRole;
  isActive?: boolean;
};

export type ResetAdminPasswordRequest = {
  password: string;
};

export type ListAdminUsersResponse = {
  adminUsers: AdminUser[];
};

export type AdminUserResponse = {
  adminUser: AdminUser;
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

export type PaymentMethod = "CASH";

export type PaymentStatus = "COMPLETED";

export type Payment = {
  id: string;
  tenantId: string;
  branchId: string;
  orderId: string;
  method: PaymentMethod;
  amount: string;
  status: PaymentStatus;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ConfirmPaymentRequest = {
  amount: string;
  method: PaymentMethod;
};

export type CreateQrOrderRequest = {
  items: Array<{
    menuId: string;
    quantity: number;
  }>;
};

export type UpdateOrderItemsRequest = CreateQrOrderRequest;

export type ListOrdersResponse = {
  orders: Order[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type OrderResponse = {
  order: OrderDetail;
};

export type PaymentResponse = {
  order: OrderDetail;
  payment: Payment;
};

export type AuditAction =
  | "ADMIN_LOGIN"
  | "ADMIN_USER_CREATED"
  | "ADMIN_USER_UPDATED"
  | "ADMIN_USER_DISABLED"
  | "ADMIN_USER_PASSWORD_RESET"
  | "BRANCH_CREATED"
  | "BRANCH_UPDATED"
  | "BRANCH_DELETED"
  | "TABLE_CREATED"
  | "TABLE_UPDATED"
  | "MENU_CREATED"
  | "MENU_UPDATED"
  | "MENU_DELETED"
  | "ORDER_STATUS_UPDATED"
  | "PAYMENT_CONFIRMED"
  | "MENU_IMAGE_UPLOADED";

export type AuditResourceType = "ADMIN_USER" | "BRANCH" | "TABLE" | "MENU" | "ORDER" | "PAYMENT" | "UPLOAD";

export type AuditLog = {
  id: string;
  tenantId: string;
  actorAdminId: string | null;
  actorAdminName: string | null;
  actorAdminEmail: string | null;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  metadata: unknown;
  createdAt: string;
};

export type ListAuditLogsResponse = {
  enabled: boolean;
  auditLogs: AuditLog[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type TopMenuItem = {
  menuId: string;
  menuName: string;
  quantity: number;
  revenue: string;
};

export type OrderStatusSummary = {
  status: OrderStatus;
  count: number;
};

export type ReportDashboard = {
  filters: {
    startDate: string;
    endDate: string;
    branchId: string | null;
  };
  revenue: {
    total: string;
  };
  orders: {
    total: number;
    processing: number;
  };
  topMenuItems: TopMenuItem[];
  orderStatusSummary: OrderStatusSummary[];
};

export type DashboardReportResponse = {
  dashboard: ReportDashboard;
};

export type Menu = {
  id: string;
  tenantId: string;
  categoryId: string | null;
  categoryName: string | null;
  categorySortOrder: number | null;
  name: string;
  price: string;
  imageUrl: string | null;
  isActive: boolean;
  isOutOfStock: boolean;
  isFeatured: boolean;
  isNew: boolean;
  sortOrder: number;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MenuCategory = {
  id: string;
  tenantId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type MenuFormRequest = {
  name: string;
  price: string;
  imageUrl?: string | null;
  categoryId?: string | null;
  isActive: boolean;
  isOutOfStock: boolean;
  isFeatured: boolean;
  isNew: boolean;
  sortOrder: number;
};

export type CreateMenuRequest = {
  name: string;
  price: string;
  imageUrl?: string | null;
  categoryId?: string | null;
  isActive?: boolean;
  isOutOfStock?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  sortOrder?: number;
};

export type ListMenusResponse = {
  menus: Menu[];
  categories?: MenuCategory[];
};

export type MenuResponse = {
  menu: Menu;
};

export type MenuCategoryFormRequest = {
  name: string;
  sortOrder: number;
};

export type CreateMenuCategoryRequest = {
  name: string;
  sortOrder?: number;
};

export type ListMenuCategoriesResponse = {
  categories: MenuCategory[];
};

export type MenuCategoryResponse = {
  category: MenuCategory;
};

export type DeleteMenuResponse = {
  deleted: boolean;
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
