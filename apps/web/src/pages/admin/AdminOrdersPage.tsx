import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/Button";
import { StateMessage } from "../../components/ui/StateMessage";
import { useAuth } from "../../features/auth/AuthContext";
import { apiClient } from "../../lib/api/client";
import type { Branch, Order, OrderDetail, OrderStatus, UpdateOrderStatusRequest } from "../../lib/api/types";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";

type BranchesState =
  | { status: "loading" }
  | { status: "success"; branches: Branch[] }
  | { status: "error"; message: string };

type OrdersState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; orders: Order[] }
  | { status: "error"; message: string };

type OrderDetailState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; order: OrderDetail }
  | { status: "error"; message: string };

const allStatusOptions: Array<OrderStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SERVED",
  "CANCELLED",
  "PAID"
];

const operationStatusOptions: UpdateOrderStatusRequest["status"][] = [
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SERVED",
  "CANCELLED"
];

export const AdminOrdersPage = () => {
  const { token, logout } = useAuth();
  const { locale, t } = useI18n();
  const [branchesState, setBranchesState] = useState<BranchesState>({ status: "loading" });
  const [ordersState, setOrdersState] = useState<OrdersState>({ status: "idle" });
  const [orderDetailState, setOrderDetailState] = useState<OrderDetailState>({ status: "idle" });
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "ALL">("ALL");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<UpdateOrderStatusRequest["status"] | null>(null);

  const branches = branchesState.status === "success" ? branchesState.branches : [];
  const orders = ordersState.status === "success" ? ordersState.orders : [];

  const selectedBranch = useMemo(() => {
    return branches.find((branch) => branch.id === selectedBranchId) ?? null;
  }, [branches, selectedBranchId]);

  const formatCurrency = (price: string): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 2
    }).format(Number(price));
  };

  const getOrderStatusLabel = (status: OrderStatus | "ALL"): string => {
    const labelByStatus: Record<OrderStatus | "ALL", string> = {
      ALL: t(MessageKey.OrdersStatusAll),
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
      setSelectedBranchId((currentBranchId) => currentBranchId || response.branches[0]?.id || "");
    } catch (error: unknown) {
      setBranchesState({ status: "error", message: getUserErrorMessage(error, MessageKey.RequestFailed, locale) });
    }
  }, [locale, logout, t, token]);

  const loadOrderDetail = useCallback(
    async (orderId: string) => {
      if (!token) {
        setOrderDetailState({ status: "error", message: t(MessageKey.AuthSessionExpired) });
        logout();
        return;
      }

      if (!orderId) {
        setOrderDetailState({ status: "idle" });
        return;
      }

      setOrderDetailState({ status: "loading" });

      try {
        const response = await apiClient.getOrder(token, orderId);
        setOrderDetailState({ status: "success", order: response.order });
      } catch (error: unknown) {
        setOrderDetailState({ status: "error", message: getUserErrorMessage(error, MessageKey.RequestFailed, locale) });
      }
    },
    [locale, logout, t, token]
  );

  const loadOrders = useCallback(
    async (branchId: string, status: OrderStatus | "ALL") => {
      if (!token) {
        setOrdersState({ status: "error", message: t(MessageKey.AuthSessionExpired) });
        logout();
        return;
      }

      if (!branchId) {
        setOrdersState({ status: "idle" });
        setSelectedOrderId("");
        setOrderDetailState({ status: "idle" });
        return;
      }

      setOrdersState({ status: "loading" });

      try {
        const response = await apiClient.listOrders(token, branchId, status === "ALL" ? undefined : status);
        setOrdersState({ status: "success", orders: response.orders });
        setSelectedOrderId((currentOrderId) => {
          if (response.orders.some((order) => order.id === currentOrderId)) {
            return currentOrderId;
          }

          return response.orders[0]?.id || "";
        });
      } catch (error: unknown) {
        setOrdersState({ status: "error", message: getUserErrorMessage(error, MessageKey.RequestFailed, locale) });
      }
    },
    [locale, logout, t, token]
  );

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    void loadOrders(selectedBranchId, selectedStatus);
  }, [loadOrders, selectedBranchId, selectedStatus]);

  useEffect(() => {
    void loadOrderDetail(selectedOrderId);
  }, [loadOrderDetail, selectedOrderId]);

  const handleStatusUpdate = async (status: UpdateOrderStatusRequest["status"]) => {
    if (!token || !selectedOrderId) {
      logout();
      return;
    }

    setSuccessMessage(null);
    setUpdateError(null);
    setUpdatingStatus(status);

    try {
      const response = await apiClient.updateOrderStatus(token, selectedOrderId, { status });
      setOrderDetailState({ status: "success", order: response.order });
      await loadOrders(selectedBranchId, selectedStatus);
      setSelectedOrderId(response.order.id);
      setSuccessMessage(t(MessageKey.OrdersStatusUpdated));
    } catch (error: unknown) {
      setUpdateError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t(MessageKey.OrdersEyebrow)}</p>
          <h1>{t(MessageKey.OrdersTitle)}</h1>
          <p className="page-subtitle">{t(MessageKey.OrdersSubtitle)}</p>
        </div>
      </header>

      <section className="panel order-toolbar">
        <label className="field">
          {t(MessageKey.Branch)}
          <select
            value={selectedBranchId}
            onChange={(event) => {
              setSelectedBranchId(event.target.value);
              setSelectedOrderId("");
              setSuccessMessage(null);
              setUpdateError(null);
            }}
            disabled={branches.length === 0}
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          {t(MessageKey.Status)}
          <select
            value={selectedStatus}
            onChange={(event) => {
              setSelectedStatus(event.target.value as OrderStatus | "ALL");
              setSelectedOrderId("");
              setSuccessMessage(null);
              setUpdateError(null);
            }}
          >
            {allStatusOptions.map((status) => (
              <option key={status} value={status}>
                {getOrderStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          className="button--secondary button--inline"
          disabled={!selectedBranchId}
          onClick={() => void loadOrders(selectedBranchId, selectedStatus)}
        >
          {t(MessageKey.Refresh)}
        </Button>
      </section>

      {branchesState.status === "loading" ? <StateMessage title={t(MessageKey.OrdersLoadingBranches)} /> : null}
      {branchesState.status === "error" ? (
        <StateMessage title={t(MessageKey.OrdersUnableToLoadBranches)} description={branchesState.message} tone="error" />
      ) : null}
      {branchesState.status === "success" && branches.length === 0 ? (
        <StateMessage
          title={t(MessageKey.OrdersNoBranchesTitle)}
          description={t(MessageKey.OrdersNoBranchesDescription)}
        />
      ) : null}

      {selectedBranch ? (
        <section className="orders-workspace">
          <section className="panel">
            <div className="section-header">
              <div>
                <h2>{t(MessageKey.OrdersListTitle)}</h2>
                {orders.length > 0 ? (
                  <p className="section-subtitle">{t(MessageKey.OrdersTotal, { count: orders.length })}</p>
                ) : null}
              </div>
            </div>

            {ordersState.status === "idle" ? <StateMessage title={t(MessageKey.OrdersSelectBranch)} /> : null}
            {ordersState.status === "loading" ? <StateMessage title={t(MessageKey.OrdersLoading)} /> : null}
            {ordersState.status === "error" ? (
              <StateMessage title={t(MessageKey.OrdersUnableToLoad)} description={ordersState.message} tone="error" />
            ) : null}
            {ordersState.status === "success" && orders.length === 0 ? (
              <StateMessage title={t(MessageKey.OrdersEmptyTitle)} description={t(MessageKey.OrdersEmptyDescription)} />
            ) : null}
            {orders.length > 0 ? (
              <div className="order-list">
                {orders.map((order) => (
                  <button
                    type="button"
                    className={`order-row${order.id === selectedOrderId ? " order-row--active" : ""}`}
                    key={order.id}
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setSuccessMessage(null);
                      setUpdateError(null);
                    }}
                  >
                    <span>
                      <strong>{order.tableName}</strong>
                      <small>{new Date(order.createdAt).toLocaleString(locale)}</small>
                    </span>
                    <span className={`status-pill status-pill--order-${order.status.toLowerCase()}`}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                    <b>{formatCurrency(order.total)}</b>
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <section className="panel order-detail-panel">
            {orderDetailState.status === "idle" ? <StateMessage title={t(MessageKey.OrdersSelectOrder)} /> : null}
            {orderDetailState.status === "loading" ? <StateMessage title={t(MessageKey.OrdersLoadingDetail)} /> : null}
            {orderDetailState.status === "error" ? (
              <StateMessage title={t(MessageKey.OrdersUnableToLoadDetail)} description={orderDetailState.message} tone="error" />
            ) : null}
            {orderDetailState.status === "success" ? (
              <>
                <div className="section-header">
                  <div>
                    <h2>{t(MessageKey.OrdersDetailTitle, { tableName: orderDetailState.order.tableName })}</h2>
                    <p className="section-subtitle">
                      {orderDetailState.order.branchName} &middot;{" "}
                      {new Date(orderDetailState.order.createdAt).toLocaleString(locale)}
                    </p>
                  </div>
                  <span className={`status-pill status-pill--order-${orderDetailState.order.status.toLowerCase()}`}>
                    {getOrderStatusLabel(orderDetailState.order.status)}
                  </span>
                </div>

                <div className="order-items">
                  {orderDetailState.order.items.map((item) => (
                    <div className="order-item-row" key={item.id}>
                      <div>
                        <strong>{item.menuName}</strong>
                        <span>
                          {item.quantity} &times; {formatCurrency(item.unitPrice)}
                        </span>
                      </div>
                      <b>{formatCurrency(item.lineTotal)}</b>
                    </div>
                  ))}
                </div>

                <div className="order-total-row">
                  <span>{t(MessageKey.OrdersTotalAmount)}</span>
                  <strong>{formatCurrency(orderDetailState.order.total)}</strong>
                </div>

                <div className="order-actions">
                  {operationStatusOptions.map((status) => (
                    <Button
                      type="button"
                      className="button--secondary button--inline"
                      disabled={updatingStatus !== null || orderDetailState.order.status === status}
                      key={status}
                      onClick={() => void handleStatusUpdate(status)}
                    >
                      {updatingStatus === status ? t(MessageKey.Saving) : getOrderStatusLabel(status)}
                    </Button>
                  ))}
                </div>
                {successMessage ? <StateMessage title={successMessage} tone="success" /> : null}
                {updateError ? (
                  <StateMessage title={t(MessageKey.OrdersUnableToUpdateStatus)} description={updateError} tone="error" />
                ) : null}
              </>
            ) : null}
          </section>
        </section>
      ) : null}
    </section>
  );
};
