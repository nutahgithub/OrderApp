import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query/query-keys";
import { auditLogsApi } from "./api";
import type { ListAuditLogsParams } from "./api";

export const useAuditLogsQuery = (token: string | null, filters: ListAuditLogsParams) => {
  return useQuery({
    queryKey: queryKeys.auditLogs(filters),
    queryFn: () => auditLogsApi.list(token ?? "", filters),
    enabled: Boolean(token)
  });
};
