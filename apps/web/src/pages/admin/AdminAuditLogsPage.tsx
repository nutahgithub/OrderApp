import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { Panel } from "../../components/ui/Panel";
import { SelectField } from "../../components/ui/SelectField";
import { StateMessage } from "../../components/ui/StateMessage";
import { StatusPill } from "../../components/ui/StatusPill";
import { useAuditLogsQuery } from "../../features/audit-logs/hooks";
import { useAuth } from "../../features/auth/AuthContext";
import type { AuditAction, AuditResourceType } from "../../lib/api/types";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";

const auditActions: AuditAction[] = [
  "ADMIN_LOGIN",
  "ADMIN_USER_CREATED",
  "ADMIN_USER_UPDATED",
  "ADMIN_USER_DISABLED",
  "ADMIN_USER_PASSWORD_RESET",
  "BRANCH_CREATED",
  "BRANCH_UPDATED",
  "BRANCH_DELETED",
  "TABLE_CREATED",
  "TABLE_UPDATED",
  "MENU_CREATED",
  "MENU_UPDATED",
  "MENU_DELETED",
  "ORDER_STATUS_UPDATED",
  "PAYMENT_CONFIRMED",
  "MENU_IMAGE_UPLOADED"
];

const auditResourceTypes: AuditResourceType[] = ["ADMIN_USER", "BRANCH", "TABLE", "MENU", "ORDER", "PAYMENT", "UPLOAD"];

const formatAuditLabel = (value: string): string => {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
};

const formatAuditTime = (value: string, locale: string): string => {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
};

export const AdminAuditLogsPage = () => {
  const { token } = useAuth();
  const { locale, t } = useI18n();
  const [action, setAction] = useState<AuditAction | "ALL">("ALL");
  const [resourceType, setResourceType] = useState<AuditResourceType | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const auditLogsQuery = useAuditLogsQuery(token, {
    action: action === "ALL" ? undefined : action,
    resourceType: resourceType === "ALL" ? undefined : resourceType,
    page,
    pageSize: 25
  });
  const auditLogs = auditLogsQuery.data?.auditLogs ?? [];
  const auditEnabled = auditLogsQuery.data?.enabled ?? true;
  const pagination = auditLogsQuery.data?.pagination ?? { page, pageSize: 25, total: 0, totalPages: 1 };

  const handleActionChange = (value: string) => {
    setAction(value as AuditAction | "ALL");
    setPage(1);
  };

  const handleResourceTypeChange = (value: string) => {
    setResourceType(value as AuditResourceType | "ALL");
    setPage(1);
  };

  return (
    <section className="grid gap-5">
      <PageHeader
        eyebrow={t(MessageKey.AuditLogsEyebrow)}
        title={t(MessageKey.AuditLogsTitle)}
        subtitle={t(MessageKey.AuditLogsSubtitle)}
      />

      <Panel className="grid gap-4">
        <div className="grid grid-cols-[minmax(0,280px)_minmax(0,240px)_auto] items-end gap-3 max-[780px]:grid-cols-1 max-[780px]:items-stretch">
          <SelectField
            label={t(MessageKey.AuditLogsAction)}
            options={[
              { label: t(MessageKey.AuditLogsAllActions), value: "ALL" },
              ...auditActions.map((item) => ({ label: formatAuditLabel(item), value: item }))
            ]}
            value={action}
            onValueChange={handleActionChange}
          />
          <SelectField
            label={t(MessageKey.AuditLogsResource)}
            options={[
              { label: t(MessageKey.AuditLogsAllResources), value: "ALL" },
              ...auditResourceTypes.map((item) => ({ label: formatAuditLabel(item), value: item }))
            ]}
            value={resourceType}
            onValueChange={handleResourceTypeChange}
          />
          <Button type="button" className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent" onClick={() => void auditLogsQuery.refetch()}>
            {t(MessageKey.Refresh)}
          </Button>
        </div>
      </Panel>

      {auditLogsQuery.isLoading ? <StateMessage title={t(MessageKey.AuditLogsLoading)} /> : null}
      {auditLogsQuery.error ? (
        <StateMessage
          title={t(MessageKey.AuditLogsUnableToLoad)}
          description={getUserErrorMessage(auditLogsQuery.error, MessageKey.RequestFailed, locale)}
          tone="error"
        />
      ) : null}

      {!auditLogsQuery.isLoading && !auditLogsQuery.error && !auditEnabled ? (
        <StateMessage
          title={t(MessageKey.AuditLogsDisabledTitle)}
          description={t(MessageKey.AuditLogsDisabledDescription)}
        />
      ) : null}

      {!auditLogsQuery.isLoading && !auditLogsQuery.error && auditEnabled ? (
        <Panel>
          <div className="mb-4 flex items-center justify-between gap-3 max-[780px]:grid">
            <h2>{t(MessageKey.AuditLogsTotal, { count: pagination.total })}</h2>
            <span className="text-sm font-bold text-muted-foreground">
              {t(MessageKey.AuditLogsPageSummary, { page: pagination.page, totalPages: pagination.totalPages })}
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <StateMessage
              title={t(MessageKey.AuditLogsEmptyTitle)}
              description={t(MessageKey.AuditLogsEmptyDescription)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                    <th className="px-3 py-2">{t(MessageKey.AuditLogsTime)}</th>
                    <th className="px-3 py-2">{t(MessageKey.AuditLogsAction)}</th>
                    <th className="px-3 py-2">{t(MessageKey.AuditLogsActor)}</th>
                    <th className="px-3 py-2">{t(MessageKey.AuditLogsResource)}</th>
                    <th className="px-3 py-2">{t(MessageKey.AuditLogsResourceId)}</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((auditLog) => (
                    <tr className="border-b border-border last:border-b-0" key={auditLog.id}>
                      <td className="whitespace-nowrap px-3 py-3 font-semibold text-primary">
                        {formatAuditTime(auditLog.createdAt, locale)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill>{formatAuditLabel(auditLog.action)}</StatusPill>
                      </td>
                      <td className="px-3 py-3">
                        <div className="grid gap-0.5">
                          <strong>{auditLog.actorAdminName ?? t(MessageKey.AuditLogsSystemActor)}</strong>
                          {auditLog.actorAdminEmail ? (
                            <span className="text-xs text-muted-foreground">{auditLog.actorAdminEmail}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-semibold">{formatAuditLabel(auditLog.resourceType)}</td>
                      <td className="max-w-[260px] break-all px-3 py-3 font-mono text-xs text-muted-foreground">
                        {auditLog.resourceId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              className="mt-0 bg-secondary text-secondary-foreground hover:bg-accent"
              disabled={pagination.page <= 1}
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            >
              {t(MessageKey.AuditLogsPreviousPage)}
            </Button>
            <Button
              type="button"
              className="mt-0 bg-secondary text-secondary-foreground hover:bg-accent"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((currentPage) => currentPage + 1)}
            >
              {t(MessageKey.AuditLogsNextPage)}
            </Button>
          </div>
        </Panel>
      ) : null}
    </section>
  );
};
