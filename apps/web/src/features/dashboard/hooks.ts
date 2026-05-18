import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query/query-keys";
import { dashboardApi } from "./api";
import type { DashboardFilters } from "./api";

export const useDashboardQuery = (token: string | null, filters: DashboardFilters) => {
  return useQuery({
    queryKey: queryKeys.dashboard(filters),
    queryFn: () => dashboardApi.getReport(token ?? "", filters),
    enabled: Boolean(token && filters.startDate && filters.endDate)
  });
};
