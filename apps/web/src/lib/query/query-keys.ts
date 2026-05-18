import type { OrderStatus } from "../api/types";

export const queryKeys = {
  branches: () => ["branches"] as const,
  tables: (branchId: string) => ["tables", branchId] as const,
  menus: () => ["menus"] as const,
  dashboard: (filters: { startDate: string; endDate: string; branchId?: string }) =>
    ["dashboard", filters.startDate, filters.endDate, filters.branchId ?? "ALL"] as const,
  orders: (branchId: string, status?: OrderStatus) => ["orders", branchId, status ?? "ALL"] as const,
  order: (orderId: string) => ["order", orderId] as const,
  qrEntry: (tenantId: string, branchId: string, tableId: string) => ["qr-entry", tenantId, branchId, tableId] as const,
  qrMenus: (tenantId: string, branchId: string, tableId: string) => ["qr-menus", tenantId, branchId, tableId] as const,
  qrOrder: (tenantId: string, branchId: string, tableId: string, orderId: string) =>
    ["qr-order", tenantId, branchId, tableId, orderId] as const
};
