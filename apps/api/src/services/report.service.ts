import { OrderStatus } from "@prisma/client";
import { findBranchByTenant } from "../repositories/branch.repository.js";
import {
  countOrders,
  countProcessingOrders,
  groupOrdersByStatus,
  listTopMenuItems,
  sumCompletedRevenue
} from "../repositories/report.repository.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import { prisma } from "../shared/prisma/client.js";
import type { ReportDashboardDto, ReportDashboardInput, ReportQueryFilters } from "../types/report.types.js";

const allOrderStatuses: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.SERVED,
  OrderStatus.CANCELLED,
  OrderStatus.PAID
];

const dateOnly = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

const startOfUtcDay = (dateOnlyValue: string): Date => {
  return new Date(`${dateOnlyValue}T00:00:00.000Z`);
};

const addUtcDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const resolveDateRange = (input: ReportDashboardInput) => {
  const today = dateOnly(new Date());
  const startDateValue = input.startDate ?? today;
  const endDateValue = input.endDate ?? startDateValue;
  const startDate = startOfUtcDay(startDateValue);
  const endDate = startOfUtcDay(endDateValue);

  return {
    startDate,
    endDateExclusive: addUtcDays(endDate, 1),
    startDateValue,
    endDateValue
  };
};

const toMoney = (value: { toFixed: (decimalPlaces: number) => string }): string => {
  return value.toFixed(2);
};

export const getReportDashboard = async (
  tenantId: string,
  input: ReportDashboardInput
): Promise<ReportDashboardDto> => {
  if (input.branchId) {
    const branch = await findBranchByTenant(prisma, {
      tenantId,
      branchId: input.branchId
    });

    if (!branch) {
      throw new AppError(ErrorCode.BranchNotFound);
    }
  }

  const range = resolveDateRange(input);
  const filters: ReportQueryFilters = {
    tenantId,
    branchId: input.branchId,
    startDate: range.startDate,
    endDateExclusive: range.endDateExclusive
  };

  const [revenue, totalOrders, processingOrders, statusRows, topMenuItems] = await Promise.all([
    sumCompletedRevenue(prisma, filters),
    countOrders(prisma, filters),
    countProcessingOrders(prisma, filters),
    groupOrdersByStatus(prisma, filters),
    listTopMenuItems(prisma, filters, 5)
  ]);
  const countByStatus = new Map(statusRows.map((row) => [row.status, row.count]));

  return {
    filters: {
      startDate: range.startDateValue,
      endDate: range.endDateValue,
      branchId: input.branchId ?? null
    },
    revenue: {
      total: toMoney(revenue)
    },
    orders: {
      total: totalOrders,
      processing: processingOrders
    },
    topMenuItems: topMenuItems.map((item) => ({
      menuId: item.menuId,
      menuName: item.menuName,
      quantity: item.quantity,
      revenue: toMoney(item.revenue)
    })),
    orderStatusSummary: allOrderStatuses.map((status) => ({
      status,
      count: countByStatus.get(status) ?? 0
    }))
  };
};
