import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { DateField } from "../../components/ui/DateField";
import { MetricCard } from "../../components/ui/MetricCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { Panel } from "../../components/ui/Panel";
import { SelectField } from "../../components/ui/SelectField";
import { StateMessage } from "../../components/ui/StateMessage";
import { StatusPill } from "../../components/ui/StatusPill";
import { useAuth } from "../../features/auth/AuthContext";
import { useBranchesQuery } from "../../features/branches/hooks";
import { useDashboardQuery } from "../../features/dashboard/hooks";
import { dashboardFilterSchema } from "../../features/dashboard/schemas";
import type { DashboardFilterValues } from "../../features/dashboard/schemas";
import { getOrderStatusLabelKey } from "../../features/shared/labels";
import type { OrderStatus } from "../../lib/api/types";
import { addDays, formatDate, toDateInputValue } from "../../lib/format/date";
import { formatCurrency } from "../../lib/format/currency";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";
import { getOrderStatusClassName } from "../../lib/theme/status-colors";

const statusOrder: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "CANCELLED", "PAID"];

export const AdminDashboardPage = () => {
  const { admin, token, logout } = useAuth();
  const { locale, t } = useI18n();
  const form = useForm<DashboardFilterValues>({
    resolver: zodResolver(dashboardFilterSchema),
    defaultValues: {
      startDate: toDateInputValue(addDays(new Date(), -6)),
      endDate: toDateInputValue(new Date()),
      branchId: "ALL"
    }
  });
  const filters = form.watch();
  const branchesQuery = useBranchesQuery(token);
  const dashboardQuery = useDashboardQuery(token, {
    startDate: filters.startDate,
    endDate: filters.endDate,
    branchId: filters.branchId === "ALL" ? undefined : filters.branchId
  });

  const branches = branchesQuery.data?.branches ?? [];
  const dashboard = dashboardQuery.data?.dashboard ?? null;

  const selectedBranchName = useMemo(() => {
    if (filters.branchId === "ALL") {
      return t(MessageKey.DashboardAllBranches);
    }

    return branches.find((branch) => branch.id === filters.branchId)?.name ?? t(MessageKey.Branch);
  }, [branches, filters.branchId, t]);

  const getOrderStatusLabel = (status: OrderStatus): string => {
    return t(getOrderStatusLabelKey(status));
  };

  useEffect(() => {
    if (!token) {
      logout();
    }
  }, [logout, token]);

  const totalStatusCount =
    dashboard?.orderStatusSummary.reduce((sum, item) => {
      return sum + item.count;
    }, 0) ?? 0;

  return (
    <section className="grid gap-5">
      <PageHeader
        eyebrow={t(MessageKey.DashboardEyebrow)}
        title={t(MessageKey.DashboardTitle)}
        subtitle={admin ? t(MessageKey.DashboardSignedInAs, { email: admin.email }) : undefined}
      />

      <Panel className="grid gap-4">
        <div className="flex items-start justify-between gap-4 max-[780px]:grid">
          <div className="min-w-0">
            <h2 className="m-0 text-base">{selectedBranchName}</h2>
            <p className="mt-1 text-[13px] leading-normal text-muted-foreground">
              {formatDate(filters.startDate)} - {formatDate(filters.endDate)}
            </p>
          </div>
          {dashboardQuery.isFetching ? (
            <span className="inline-flex min-h-8 items-center rounded-full bg-secondary px-3 py-1 text-xs font-extrabold text-secondary-foreground">
              {t(MessageKey.DashboardLoadingReport)}
            </span>
          ) : null}
        </div>
        <form
          className="grid grid-cols-[minmax(0,180px)_minmax(0,180px)_minmax(0,280px)_auto] items-end gap-3 max-[780px]:grid-cols-1 max-[780px]:items-stretch"
          onSubmit={form.handleSubmit(() => void dashboardQuery.refetch())}
        >
          <DateField
            label={t(MessageKey.DashboardStartDate)}
            max={filters.endDate}
            value={filters.startDate}
            onValueChange={(value) => form.setValue("startDate", value, { shouldDirty: true, shouldValidate: true })}
          />
          <DateField
            label={t(MessageKey.DashboardEndDate)}
            min={filters.startDate}
            value={filters.endDate}
            onValueChange={(value) => form.setValue("endDate", value, { shouldDirty: true, shouldValidate: true })}
          />
          <SelectField
            label={t(MessageKey.Branch)}
            options={[
              { label: t(MessageKey.DashboardAllBranches), value: "ALL" },
              ...branches.map((branch) => ({ label: branch.name, value: branch.id }))
            ]}
            value={filters.branchId}
            onValueChange={(value) => form.setValue("branchId", value, { shouldDirty: true, shouldValidate: true })}
          />
          <Button type="submit" className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent">
            {t(MessageKey.Refresh)}
          </Button>
        </form>
      </Panel>

      {form.formState.errors.endDate ? <StateMessage title={t(MessageKey.ValidationFailed)} tone="error" /> : null}
      {branchesQuery.isLoading ? <StateMessage title={t(MessageKey.DashboardLoadingBranches)} /> : null}
      {branchesQuery.error ? (
        <StateMessage
          title={t(MessageKey.DashboardUnableToLoadBranches)}
          description={getUserErrorMessage(branchesQuery.error, MessageKey.RequestFailed, locale)}
          tone="error"
        />
      ) : null}

      {dashboardQuery.isLoading ? <StateMessage title={t(MessageKey.DashboardLoadingReport)} /> : null}
      {dashboardQuery.error ? (
        <StateMessage
          title={t(MessageKey.DashboardUnableToLoadReport)}
          description={getUserErrorMessage(dashboardQuery.error, MessageKey.RequestFailed, locale)}
          tone="error"
        />
      ) : null}

      {dashboard ? (
        <>
          <div className="grid grid-cols-[repeat(4,minmax(0,1fr))] gap-4 max-[1180px]:grid-cols-2 max-[780px]:grid-cols-1">
            <MetricCard
              label={t(MessageKey.DashboardRevenueTotal)}
              value={formatCurrency(dashboard.revenue.total, locale)}
              supportingText={selectedBranchName}
              accent="success"
            />
            <MetricCard
              label={t(MessageKey.DashboardOrderTotal)}
              value={dashboard.orders.total}
              supportingText={
                <>
                  {formatDate(dashboard.filters.startDate)} - {formatDate(dashboard.filters.endDate)}
                </>
              }
              accent="info"
            />
            <MetricCard
              label={t(MessageKey.DashboardProcessingOrders)}
              value={dashboard.orders.processing}
              supportingText={t(MessageKey.DashboardProcessingHint)}
              accent="warning"
            />
            <MetricCard
              label={t(MessageKey.DashboardBestSeller)}
              value={dashboard.topMenuItems[0]?.menuName ?? t(MessageKey.DashboardNoBestSeller)}
              supportingText={
                dashboard.topMenuItems[0]
                  ? t(MessageKey.DashboardItemsSold, { count: dashboard.topMenuItems[0].quantity })
                  : t(MessageKey.DashboardNoSalesInRange)
              }
            />
          </div>

          <section className="grid grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] items-start gap-4 max-[980px]:grid-cols-1">
            <Panel>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2>{t(MessageKey.DashboardTopMenuTitle)}</h2>
                  <p className="mt-1 text-[13px] leading-normal text-muted-foreground">{t(MessageKey.DashboardTopMenuSubtitle)}</p>
                </div>
              </div>
              {dashboard.topMenuItems.length === 0 ? (
                <StateMessage
                  title={t(MessageKey.DashboardNoTopMenuTitle)}
                  description={t(MessageKey.DashboardNoTopMenuDescription)}
                />
              ) : (
                <div className="grid gap-3">
                  {dashboard.topMenuItems.map((item, index) => (
                    <div className="grid grid-cols-[32px_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-md border border-border bg-muted/45 p-3 max-[780px]:grid-cols-[32px_minmax(0,1fr)]" key={item.menuId}>
                      <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-secondary text-xs font-extrabold text-secondary-foreground">{index + 1}</span>
                      <strong className="break-words">{item.menuName}</strong>
                      <span className="text-[13px] font-bold text-muted-foreground">{t(MessageKey.DashboardItemsSold, { count: item.quantity })}</span>
                      <b className="whitespace-nowrap text-primary max-[780px]:whitespace-normal">{formatCurrency(item.revenue, locale)}</b>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2>{t(MessageKey.DashboardStatusTitle)}</h2>
                  <p className="mt-1 text-[13px] leading-normal text-muted-foreground">{t(MessageKey.DashboardStatusSubtitle)}</p>
                </div>
              </div>
              {totalStatusCount === 0 ? (
                <StateMessage
                  title={t(MessageKey.DashboardNoStatusTitle)}
                  description={t(MessageKey.DashboardNoStatusDescription)}
                />
              ) : (
                <div className="grid gap-3">
                  {statusOrder.map((status) => {
                    const count = dashboard.orderStatusSummary.find((item) => item.status === status)?.count ?? 0;

                    return (
                      <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0" key={status}>
                        <StatusPill className={getOrderStatusClassName(status)}>
                          {getOrderStatusLabel(status)}
                        </StatusPill>
                        <strong className="text-lg text-primary">{count}</strong>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </section>
        </>
      ) : null}
    </section>
  );
};
