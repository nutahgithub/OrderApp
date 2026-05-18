import { httpRequest } from "../../lib/api/http";
import type { DashboardReportResponse } from "../../lib/api/types";

export type DashboardFilters = {
  startDate: string;
  endDate: string;
  branchId?: string;
};

export const dashboardApi = {
  getReport: (token: string, input: DashboardFilters) => {
    const params = new URLSearchParams({
      startDate: input.startDate,
      endDate: input.endDate
    });

    if (input.branchId) {
      params.set("branchId", input.branchId);
    }

    return httpRequest<DashboardReportResponse>(`/admin/reports/dashboard?${params.toString()}`, { token });
  }
};
