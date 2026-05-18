import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/Button";
import { StateMessage } from "../../components/ui/StateMessage";
import { useAuth } from "../../features/auth/AuthContext";
import { apiClient } from "../../lib/api/client";
import type { Branch, OrderStatus, ReportDashboard } from "../../lib/api/types";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";

type BranchesState =
  | { status: "loading" }
  | { status: "success"; branches: Branch[] }
  | { status: "error"; message: string };

type DashboardState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; dashboard: ReportDashboard }
  | { status: "error"; message: string };

const statusOrder: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "CANCELLED", "PAID"];

const toDateInputValue = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const AdminDashboardPage = () => {
  const { admin, token, logout } = useAuth();
  const { locale, t } = useI18n();
  const [branchesState, setBranchesState] = useState<BranchesState>({ status: "loading" });
  const [dashboardState, setDashboardState] = useState<DashboardState>({ status: "idle" });
  const [startDate, setStartDate] = useState(() => toDateInputValue(addDays(new Date(), -6)));
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));
  const [selectedBranchId, setSelectedBranchId] = useState("ALL");

  const branches = branchesState.status === "success" ? branchesState.branches : [];
  const dashboard = dashboardState.status === "success" ? dashboardState.dashboard : null;

  const selectedBranchName = useMemo(() => {
    if (selectedBranchId === "ALL") {
      return t(MessageKey.DashboardAllBranches);
    }

    return branches.find((branch) => branch.id === selectedBranchId)?.name ?? t(MessageKey.Branch);
  }, [branches, selectedBranchId, t]);

  const formatCurrency = useCallback(
    (value: string): string => {
      return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 2
      }).format(Number(value));
    },
    [locale]
  );

  const getOrderStatusLabel = (status: OrderStatus): string => {
    const labelByStatus: Record<OrderStatus, string> = {
      PENDING: t(MessageKey.OrderStatusPending),
      CONFIRMED: t(MessageKey.OrderStatusConfirmed),
      PREPARING: t(MessageKey.OrderStatusPreparing),
      READY: t(MessageKey.OrderStatusReady),
      SERVED: t(MessageKey.OrderStatusServed),
      CANCELLED: t(MessageKey.OrderStatusCancelled),
      PAID: t(MessageKey.OrderStatusPaid)
    };

    return labelByStatus[status];
  };

  const loadBranches = useCallback(async () => {
    if (!token) {
      setBranchesState({ status: "error", message: t(MessageKey.AuthSessionExpired) });
      logout();
      return;
    }

    setBranchesState({ status: "loading" });

    try {
      const response = await apiClient.listBranches(token);
      setBranchesState({ status: "success", branches: response.branches });
    } catch (error: unknown) {
      setBranchesState({ status: "error", message: getUserErrorMessage(error, MessageKey.RequestFailed, locale) });
    }
  }, [locale, logout, t, token]);

  const loadDashboard = useCallback(async () => {
    if (!token) {
      setDashboardState({ status: "error", message: t(MessageKey.AuthSessionExpired) });
      logout();
      return;
    }

    setDashboardState({ status: "loading" });

    try {
      const response = await apiClient.getDashboardReport(token, {
        startDate,
        endDate,
        branchId: selectedBranchId === "ALL" ? undefined : selectedBranchId
      });
      setDashboardState({ status: "success", dashboard: response.dashboard });
    } catch (error: unknown) {
      setDashboardState({ status: "error", message: getUserErrorMessage(error, MessageKey.RequestFailed, locale) });
    }
  }, [endDate, locale, logout, selectedBranchId, startDate, t, token]);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const totalStatusCount =
    dashboard?.orderStatusSummary.reduce((sum, item) => {
      return sum + item.count;
    }, 0) ?? 0;

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t(MessageKey.DashboardEyebrow)}</p>
          <h1>{t(MessageKey.DashboardTitle)}</h1>
          {admin ? <p className="page-subtitle">{t(MessageKey.DashboardSignedInAs, { email: admin.email })}</p> : null}
        </div>
      </header>

      <section className="panel dashboard-toolbar">
        <label className="field">
          {t(MessageKey.DashboardStartDate)}
          <input type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label className="field">
          {t(MessageKey.DashboardEndDate)}
          <input type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
        <label className="field">
          {t(MessageKey.Branch)}
          <select value={selectedBranchId} onChange={(event) => setSelectedBranchId(event.target.value)}>
            <option value="ALL">{t(MessageKey.DashboardAllBranches)}</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
        <Button type="button" className="button--secondary button--inline" onClick={() => void loadDashboard()}>
          {t(MessageKey.Refresh)}
        </Button>
      </section>

      {branchesState.status === "loading" ? <StateMessage title={t(MessageKey.DashboardLoadingBranches)} /> : null}
      {branchesState.status === "error" ? (
        <StateMessage
          title={t(MessageKey.DashboardUnableToLoadBranches)}
          description={branchesState.message}
          tone="error"
        />
      ) : null}

      {dashboardState.status === "loading" ? <StateMessage title={t(MessageKey.DashboardLoadingReport)} /> : null}
      {dashboardState.status === "error" ? (
        <StateMessage title={t(MessageKey.DashboardUnableToLoadReport)} description={dashboardState.message} tone="error" />
      ) : null}

      {dashboard ? (
        <>
          <div className="metric-grid">
            <section className="metric-card">
              <span>{t(MessageKey.DashboardRevenueTotal)}</span>
              <strong>{formatCurrency(dashboard.revenue.total)}</strong>
              <small>{selectedBranchName}</small>
            </section>
            <section className="metric-card">
              <span>{t(MessageKey.DashboardOrderTotal)}</span>
              <strong>{dashboard.orders.total}</strong>
              <small>
                {dashboard.filters.startDate} - {dashboard.filters.endDate}
              </small>
            </section>
            <section className="metric-card">
              <span>{t(MessageKey.DashboardProcessingOrders)}</span>
              <strong>{dashboard.orders.processing}</strong>
              <small>{t(MessageKey.DashboardProcessingHint)}</small>
            </section>
            <section className="metric-card">
              <span>{t(MessageKey.DashboardBestSeller)}</span>
              <strong>{dashboard.topMenuItems[0]?.menuName ?? t(MessageKey.DashboardNoBestSeller)}</strong>
              <small>
                {dashboard.topMenuItems[0]
                  ? t(MessageKey.DashboardItemsSold, { count: dashboard.topMenuItems[0].quantity })
                  : t(MessageKey.DashboardNoSalesInRange)}
              </small>
            </section>
          </div>

          <section className="dashboard-report-grid">
            <section className="panel">
              <div className="section-header">
                <div>
                  <h2>{t(MessageKey.DashboardTopMenuTitle)}</h2>
                  <p className="section-subtitle">{t(MessageKey.DashboardTopMenuSubtitle)}</p>
                </div>
              </div>
              {dashboard.topMenuItems.length === 0 ? (
                <StateMessage
                  title={t(MessageKey.DashboardNoTopMenuTitle)}
                  description={t(MessageKey.DashboardNoTopMenuDescription)}
                />
              ) : (
                <div className="report-table">
                  {dashboard.topMenuItems.map((item, index) => (
                    <div className="report-row" key={item.menuId}>
                      <span>{index + 1}</span>
                      <strong>{item.menuName}</strong>
                      <span>{t(MessageKey.DashboardItemsSold, { count: item.quantity })}</span>
                      <b>{formatCurrency(item.revenue)}</b>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel">
              <div className="section-header">
                <div>
                  <h2>{t(MessageKey.DashboardStatusTitle)}</h2>
                  <p className="section-subtitle">{t(MessageKey.DashboardStatusSubtitle)}</p>
                </div>
              </div>
              {totalStatusCount === 0 ? (
                <StateMessage
                  title={t(MessageKey.DashboardNoStatusTitle)}
                  description={t(MessageKey.DashboardNoStatusDescription)}
                />
              ) : (
                <div className="status-summary-list">
                  {statusOrder.map((status) => {
                    const count = dashboard.orderStatusSummary.find((item) => item.status === status)?.count ?? 0;

                    return (
                      <div className="status-summary-row" key={status}>
                        <span className={`status-pill status-pill--order-${status.toLowerCase()}`}>
                          {getOrderStatusLabel(status)}
                        </span>
                        <strong>{count}</strong>
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
