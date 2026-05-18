import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { StateMessage } from "../../components/ui/StateMessage";
import { useAuth } from "../../features/auth/AuthContext";
import { useBranchesQuery } from "../../features/branches/hooks";
import { useDashboardQuery } from "../../features/dashboard/hooks";
import { dashboardFilterSchema } from "../../features/dashboard/schemas";
import type { DashboardFilterValues } from "../../features/dashboard/schemas";
import { getOrderStatusLabelKey } from "../../features/shared/labels";
import type { OrderStatus } from "../../lib/api/types";
import { addDays, toDateInputValue } from "../../lib/format/date";
import { formatCurrency } from "../../lib/format/currency";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";
import { getOrderStatusClassName, statusPillClassName } from "../../lib/theme/status-colors";
import { cn } from "../../lib/utils/cn";

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
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="mb-1.5 mt-0 text-xs font-bold uppercase text-muted-foreground">{t(MessageKey.DashboardEyebrow)}</p>
          <h1 className="m-0 text-[28px] leading-tight">{t(MessageKey.DashboardTitle)}</h1>
          {admin ? (
            <p className="mb-0 mt-2 text-muted-foreground">{t(MessageKey.DashboardSignedInAs, { email: admin.email })}</p>
          ) : null}
        </div>
      </header>

      <form
        className="grid grid-cols-[minmax(0,180px)_minmax(0,180px)_minmax(0,280px)_auto] items-end gap-3 rounded-md border border-border bg-card p-[18px] text-card-foreground shadow-panel max-[780px]:grid-cols-1 max-[780px]:items-stretch"
        onSubmit={form.handleSubmit(() => void dashboardQuery.refetch())}
      >
        <label className="grid gap-1.5 text-sm font-semibold text-foreground">
          {t(MessageKey.DashboardStartDate)}
          <input className="min-h-[42px] w-full rounded-md border border-input bg-card px-2.5 py-2 text-foreground" type="date" max={filters.endDate} {...form.register("startDate")} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-foreground">
          {t(MessageKey.DashboardEndDate)}
          <input className="min-h-[42px] w-full rounded-md border border-input bg-card px-2.5 py-2 text-foreground" type="date" min={filters.startDate} {...form.register("endDate")} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-foreground">
          {t(MessageKey.Branch)}
          <select className="min-h-[42px] w-full rounded-md border border-input bg-card px-2.5 py-2 text-foreground" {...form.register("branchId")}>
            <option value="ALL">{t(MessageKey.DashboardAllBranches)}</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent">
          {t(MessageKey.Refresh)}
        </Button>
      </form>

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
          <div className="grid grid-cols-4 gap-4 max-[780px]:grid-cols-1">
            <section className="grid min-h-[132px] gap-2 rounded-md border border-border bg-card p-[18px] text-card-foreground shadow-panel">
              <span className="text-xs font-extrabold uppercase text-muted-foreground">{t(MessageKey.DashboardRevenueTotal)}</span>
              <strong className="break-words text-[26px] leading-tight text-primary">{formatCurrency(dashboard.revenue.total, locale)}</strong>
              <small className="self-end text-[13px] leading-normal text-muted-foreground">{selectedBranchName}</small>
            </section>
            <section className="grid min-h-[132px] gap-2 rounded-md border border-border bg-card p-[18px] text-card-foreground shadow-panel">
              <span className="text-xs font-extrabold uppercase text-muted-foreground">{t(MessageKey.DashboardOrderTotal)}</span>
              <strong className="break-words text-[26px] leading-tight text-primary">{dashboard.orders.total}</strong>
              <small className="self-end text-[13px] leading-normal text-muted-foreground">
                {dashboard.filters.startDate} - {dashboard.filters.endDate}
              </small>
            </section>
            <section className="grid min-h-[132px] gap-2 rounded-md border border-border bg-card p-[18px] text-card-foreground shadow-panel">
              <span className="text-xs font-extrabold uppercase text-muted-foreground">{t(MessageKey.DashboardProcessingOrders)}</span>
              <strong className="break-words text-[26px] leading-tight text-primary">{dashboard.orders.processing}</strong>
              <small className="self-end text-[13px] leading-normal text-muted-foreground">{t(MessageKey.DashboardProcessingHint)}</small>
            </section>
            <section className="grid min-h-[132px] gap-2 rounded-md border border-border bg-card p-[18px] text-card-foreground shadow-panel">
              <span className="text-xs font-extrabold uppercase text-muted-foreground">{t(MessageKey.DashboardBestSeller)}</span>
              <strong className="break-words text-[26px] leading-tight text-primary">{dashboard.topMenuItems[0]?.menuName ?? t(MessageKey.DashboardNoBestSeller)}</strong>
              <small className="self-end text-[13px] leading-normal text-muted-foreground">
                {dashboard.topMenuItems[0]
                  ? t(MessageKey.DashboardItemsSold, { count: dashboard.topMenuItems[0].quantity })
                  : t(MessageKey.DashboardNoSalesInRange)}
              </small>
            </section>
          </div>

          <section className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start gap-4 max-[780px]:grid-cols-1">
            <section className="rounded-md border border-border bg-card p-[18px] text-card-foreground shadow-panel">
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
            </section>

            <section className="rounded-md border border-border bg-card p-[18px] text-card-foreground shadow-panel">
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
                        <span className={cn(statusPillClassName, getOrderStatusClassName(status))}>
                          {getOrderStatusLabel(status)}
                        </span>
                        <strong className="text-lg text-primary">{count}</strong>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </section>
        </>
      ) : null}
    </section>
  );
};
