import type { OrderStatus } from "@prisma/client";

export type ReportDashboardInput = {
  startDate?: string;
  endDate?: string;
  branchId?: string;
};

export type ReportDateRange = {
  startDate: Date;
  endDateExclusive: Date;
};

export type ReportQueryFilters = ReportDateRange & {
  tenantId: string;
  branchId?: string;
};

export type TopMenuItemDto = {
  menuId: string;
  menuName: string;
  quantity: number;
  revenue: string;
};

export type OrderStatusSummaryDto = {
  status: OrderStatus;
  count: number;
};

export type ReportDashboardDto = {
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
  topMenuItems: TopMenuItemDto[];
  orderStatusSummary: OrderStatusSummaryDto[];
};
