import type { AuditAction, AuditResourceType, OrderStatus } from "../api/types";

export const queryKeys = {
  branches: () => ["branches"] as const,
  tables: (branchId: string) => ["tables", branchId] as const,
  menus: () => ["menus"] as const,
  dashboard: (filters: { startDate: string; endDate: string; branchId?: string }) =>
    ["dashboard", filters.startDate, filters.endDate, filters.branchId ?? "ALL"] as const,
  auditLogs: (filters: { action?: AuditAction; resourceType?: AuditResourceType; page?: number; pageSize?: number }) =>
    ["audit-logs", filters.action ?? "ALL", filters.resourceType ?? "ALL", filters.page ?? 1, filters.pageSize ?? 25] as const,
  orders: (
    branchId: string,
    status?: OrderStatus,
    filters: { startDate?: string; endDate?: string; page?: number; pageSize?: number } = {}
  ) =>
    ["orders", branchId, status ?? "ALL", filters.startDate ?? "", filters.endDate ?? "", filters.page ?? 1, filters.pageSize ?? 10] as const,
  order: (orderId: string) => ["order", orderId] as const,
  qrEntry: (tenantId: string, branchId: string, tableId: string) => ["qr-entry", tenantId, branchId, tableId] as const,
  qrMenus: (tenantId: string, branchId: string, tableId: string) => ["qr-menus", tenantId, branchId, tableId] as const,
  qrOrder: (tenantId: string, branchId: string, tableId: string, orderId: string) =>
    ["qr-order", tenantId, branchId, tableId, orderId] as const
};
