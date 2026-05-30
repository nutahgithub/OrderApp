import { httpRequest } from "../../lib/api/http";
import type { AuditAction, AuditResourceType, ListAuditLogsResponse } from "../../lib/api/types";

export type ListAuditLogsParams = {
  action?: AuditAction;
  resourceType?: AuditResourceType;
  page?: number;
  pageSize?: number;
};

export const auditLogsApi = {
  list: (token: string, input: ListAuditLogsParams = {}) => {
    const params = new URLSearchParams();

    if (input.action) {
      params.set("action", input.action);
    }

    if (input.resourceType) {
      params.set("resourceType", input.resourceType);
    }

    if (input.page) {
      params.set("page", String(input.page));
    }

    if (input.pageSize) {
      params.set("pageSize", String(input.pageSize));
    }

    const query = params.toString();

    return httpRequest<ListAuditLogsResponse>(`/admin/audit-logs${query ? `?${query}` : ""}`, { token });
  }
};
