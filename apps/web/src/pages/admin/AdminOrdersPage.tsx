import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/Button";
import { StateMessage } from "../../components/ui/StateMessage";
import { useAuth } from "../../features/auth/AuthContext";
import { useConfirmPaymentMutation, useUpdateOrderStatusMutation } from "../../features/orders/hooks";
import { apiClient } from "../../lib/api/client";
import type { Branch, Order, OrderDetail, OrderStatus, UpdateOrderStatusRequest } from "../../lib/api/types";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";
import { createRealtimeSocket, RealtimeEvent } from "../../lib/realtime/socket";
import {
  getOrderStatusClassName,
  getRealtimeConnectionClassName,
  statusPillClassName
} from "../../lib/theme/status-colors";
import { cn } from "../../lib/utils/cn";

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

type RealtimeState = "idle" | "connecting" | "connected" | "fallback";

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
  const [actionErrorTitle, setActionErrorTitle] = useState<MessageKey>(MessageKey.OrdersUnableToUpdateStatus);
  const [updatingStatus, setUpdatingStatus] = useState<UpdateOrderStatusRequest["status"] | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<OrderDetail | null>(null);
  const [realtimeState, setRealtimeState] = useState<RealtimeState>("idle");
  const updateOrderStatusMutation = useUpdateOrderStatusMutation(token, selectedBranchId, selectedStatus);
  const confirmPaymentMutation = useConfirmPaymentMutation(token, selectedBranchId, selectedStatus);

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

  const getOrderActionButtonClass = (status: UpdateOrderStatusRequest["status"]): string => {
    const classByStatus: Record<UpdateOrderStatusRequest["status"], string> = {
      CONFIRMED: "mt-0 min-h-[42px] bg-info text-white",
      PREPARING: "mt-0 min-h-[42px] bg-warning text-yellow-950",
      READY: "mt-0 min-h-[42px] bg-success text-white",
      SERVED: "mt-0 min-h-[42px] bg-slate-200 text-slate-800",
      CANCELLED: "mt-0 min-h-[42px] bg-destructive text-destructive-foreground"
    };

    return classByStatus[status];
  };

  const shouldShowOrder = useCallback(
    (order: Order): boolean => {
      return order.branchId === selectedBranchId && (selectedStatus === "ALL" || order.status === selectedStatus);
    },
    [selectedBranchId, selectedStatus]
  );

  const upsertOrder = useCallback((order: Order) => {
    setOrdersState((currentState) => {
      if (currentState.status !== "success") {
        return currentState;
      }

      const withoutCurrent = currentState.orders.filter((currentOrder) => currentOrder.id !== order.id);

      return {
        status: "success",
        orders: [order, ...withoutCurrent].sort(
          (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        )
      };
    });
  }, []);

  const removeOrder = useCallback((orderId: string) => {
    setOrdersState((currentState) => {
      if (currentState.status !== "success") {
        return currentState;
      }

      return {
        status: "success",
        orders: currentState.orders.filter((order) => order.id !== orderId)
      };
    });
  }, []);

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

  useEffect(() => {
    if (!token || !selectedBranchId) {
      setRealtimeState("idle");
      return;
    }

    const socket = createRealtimeSocket(token);
    let fallbackTimer = window.setTimeout(() => {
      setRealtimeState("fallback");
    }, 5000);

    setRealtimeState("connecting");

    socket.on("connect", () => {
      window.clearTimeout(fallbackTimer);
      setRealtimeState("connected");
      socket.emit(RealtimeEvent.AdminJoinBranch, { branchId: selectedBranchId });
      void loadOrders(selectedBranchId, selectedStatus);
    });

    socket.on("connect_error", () => {
      window.clearTimeout(fallbackTimer);
      setRealtimeState("fallback");
    });

    socket.on("disconnect", () => {
      fallbackTimer = window.setTimeout(() => {
        setRealtimeState("fallback");
      }, 5000);
    });

    socket.on(RealtimeEvent.OrderCreated, (payload) => {
      if (!shouldShowOrder(payload.order)) {
        return;
      }

      upsertOrder(payload.order);
      setSelectedOrderId((currentOrderId) => currentOrderId || payload.order.id);
    });

    socket.on(RealtimeEvent.OrderStatusUpdated, (payload) => {
      if (shouldShowOrder(payload.order)) {
        upsertOrder(payload.order);
      } else {
        removeOrder(payload.order.id);
      }

      setOrderDetailState((currentState) => {
        if (currentState.status === "success" && currentState.order.id === payload.order.id) {
          return { status: "success", order: payload.order };
        }

        return currentState;
      });
    });

    socket.on(RealtimeEvent.PaymentCompleted, (payload) => {
      if (shouldShowOrder(payload.order)) {
        upsertOrder(payload.order);
      } else {
        removeOrder(payload.order.id);
      }

      setOrderDetailState((currentState) => {
        if (currentState.status === "success" && currentState.order.id === payload.order.id) {
          return { status: "success", order: payload.order };
        }

        return currentState;
      });
    });

    socket.connect();

    return () => {
      window.clearTimeout(fallbackTimer);
      socket.disconnect();
    };
  }, [loadOrders, removeOrder, selectedBranchId, selectedStatus, shouldShowOrder, token, upsertOrder]);

  const handleStatusUpdate = async (status: UpdateOrderStatusRequest["status"]) => {
    if (!token || !selectedOrderId) {
      logout();
      return;
    }

    setSuccessMessage(null);
    setUpdateError(null);
    setActionErrorTitle(MessageKey.OrdersUnableToUpdateStatus);
    setUpdatingStatus(status);

    try {
      const response = await updateOrderStatusMutation.mutateAsync({ orderId: selectedOrderId, status });
      setOrderDetailState({ status: "success", order: response.order });
      upsertOrder(response.order);
      setSelectedOrderId(response.order.id);
      setSuccessMessage(t(MessageKey.OrdersStatusUpdated));
    } catch (error: unknown) {
      setUpdateError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleConfirmPayment = async () => {
    if (!token) {
      logout();
      return;
    }

    if (!pendingPaymentOrder) {
      return;
    }

    setSuccessMessage(null);
    setUpdateError(null);
    setActionErrorTitle(MessageKey.OrdersUnableToConfirmPayment);
    setConfirmingPayment(true);

    try {
      const response = await confirmPaymentMutation.mutateAsync({
        orderId: pendingPaymentOrder.id,
        amount: pendingPaymentOrder.total
      });
      setOrderDetailState({ status: "success", order: response.order });
      upsertOrder(response.order);
      setSelectedOrderId(response.order.id);
      setPendingPaymentOrder(null);
      setSuccessMessage(t(MessageKey.OrdersPaymentCompleted));
    } catch (error: unknown) {
      setUpdateError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    } finally {
      setConfirmingPayment(false);
    }
  };

  return (
    <section className="grid gap-5">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="mb-1.5 mt-0 text-xs font-bold uppercase text-muted-foreground">{t(MessageKey.OrdersEyebrow)}</p>
          <h1 className="m-0 text-[28px] leading-tight">{t(MessageKey.OrdersTitle)}</h1>
          <p className="mb-0 mt-2 text-muted-foreground">{t(MessageKey.OrdersSubtitle)}</p>
        </div>
      </header>

      <section className="grid grid-cols-[minmax(0,320px)_minmax(0,220px)_auto_auto] items-end gap-3 rounded-md border border-border bg-card p-[18px] text-card-foreground shadow-panel max-[780px]:grid-cols-1 max-[780px]:items-stretch">
        <label className="grid gap-1.5 text-sm font-semibold text-foreground">
          {t(MessageKey.Branch)}
          <select
            className="min-h-[42px] w-full rounded-md border border-input bg-card px-2.5 py-2 text-foreground"
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
        <label className="grid gap-1.5 text-sm font-semibold text-foreground">
          {t(MessageKey.Status)}
          <select
            className="min-h-[42px] w-full rounded-md border border-input bg-card px-2.5 py-2 text-foreground"
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
          className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
          disabled={!selectedBranchId}
          onClick={() => void loadOrders(selectedBranchId, selectedStatus)}
        >
          {t(MessageKey.Refresh)}
        </Button>
        <span className={cn("inline-flex min-h-[30px] items-center justify-center self-center rounded-full px-2.5 py-1 text-xs font-extrabold", getRealtimeConnectionClassName(realtimeState))}>
          {realtimeState === "connected" ? t(MessageKey.RealtimeConnected) : null}
          {realtimeState === "connecting" ? t(MessageKey.RealtimeConnecting) : null}
          {realtimeState === "fallback" ? t(MessageKey.RealtimeFallback) : null}
        </span>
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
        <section className="grid grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)] items-start gap-4 max-[780px]:grid-cols-1">
          <section className="rounded-md border border-border bg-card p-[18px] text-card-foreground shadow-panel">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="m-0 text-base">{t(MessageKey.OrdersListTitle)}</h2>
                {orders.length > 0 ? (
                  <p className="mt-1 text-[13px] leading-normal text-muted-foreground">{t(MessageKey.OrdersTotal, { count: orders.length })}</p>
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
              <div className="grid gap-3">
                {orders.map((order) => (
                  <button
                    type="button"
                    className={cn(
                      "grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2.5 rounded-md border border-border bg-muted/45 p-3 text-left text-foreground hover:border-ring hover:bg-accent max-[780px]:grid-cols-1 max-[780px]:items-start",
                      order.id === selectedOrderId && "border-ring bg-accent"
                    )}
                    key={order.id}
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setSuccessMessage(null);
                      setUpdateError(null);
                    }}
                  >
                    <span className="grid min-w-0 gap-1">
                      <strong>{order.tableName}</strong>
                      <small className="break-words text-[13px] text-muted-foreground">{new Date(order.createdAt).toLocaleString(locale)}</small>
                    </span>
                    <span className={cn(statusPillClassName, getOrderStatusClassName(order.status))}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                    <b className="text-primary">{formatCurrency(order.total)}</b>
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <section className="grid gap-3 rounded-md border border-border bg-card p-[18px] text-card-foreground shadow-panel">
            {orderDetailState.status === "idle" ? <StateMessage title={t(MessageKey.OrdersSelectOrder)} /> : null}
            {orderDetailState.status === "loading" ? <StateMessage title={t(MessageKey.OrdersLoadingDetail)} /> : null}
            {orderDetailState.status === "error" ? (
              <StateMessage title={t(MessageKey.OrdersUnableToLoadDetail)} description={orderDetailState.message} tone="error" />
            ) : null}
            {orderDetailState.status === "success" ? (
              <>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="m-0 text-base">{t(MessageKey.OrdersDetailTitle, { tableName: orderDetailState.order.tableName })}</h2>
                    <p className="mt-1 text-[13px] leading-normal text-muted-foreground">
                      {orderDetailState.order.branchName} &middot;{" "}
                      {new Date(orderDetailState.order.createdAt).toLocaleString(locale)}
                    </p>
                  </div>
                  <span className={cn(statusPillClassName, getOrderStatusClassName(orderDetailState.order.status))}>
                    {getOrderStatusLabel(orderDetailState.order.status)}
                  </span>
                </div>

                <div className="grid gap-3">
                  {orderDetailState.order.items.map((item) => (
                    <div className="flex items-center justify-between gap-3 border-b border-border py-3" key={item.id}>
                      <div className="grid min-w-0 gap-1">
                        <strong>{item.menuName}</strong>
                        <span className="break-words text-[13px] text-muted-foreground">
                          {item.quantity} &times; {formatCurrency(item.unitPrice)}
                        </span>
                      </div>
                      <b className="text-primary">{formatCurrency(item.lineTotal)}</b>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3 py-3 font-extrabold">
                  <span>{t(MessageKey.OrdersTotalAmount)}</span>
                  <strong className="text-primary">{formatCurrency(orderDetailState.order.total)}</strong>
                </div>

                {orderDetailState.order.status !== "PAID" && orderDetailState.order.status !== "CANCELLED" ? (
                  <div className="flex items-center justify-between gap-3 rounded-md border border-success/50 bg-success/10 p-3 max-[780px]:flex-col max-[780px]:items-start">
                    <div className="grid min-w-0 gap-1">
                      <span className="text-xs font-extrabold uppercase text-muted-foreground">{t(MessageKey.NavPayments)}</span>
                      <strong className="break-words text-primary">{t(MessageKey.OrdersPaymentMethodCash)}</strong>
                    </div>
                    <Button
                      type="button"
                      className="mt-0 min-h-11 flex-none bg-primary px-[18px] text-primary-foreground max-[780px]:w-full"
                      disabled={confirmingPayment || updatingStatus !== null}
                      onClick={() => {
                        setSuccessMessage(null);
                        setUpdateError(null);
                        setPendingPaymentOrder(orderDetailState.order);
                      }}
                    >
                      {confirmingPayment ? t(MessageKey.OrdersConfirmingPayment) : t(MessageKey.OrdersConfirmPayment)}
                    </Button>
                  </div>
                ) : null}

                {orderDetailState.order.status === "PAID" ? (
                  <StateMessage title={t(MessageKey.OrdersPaymentUnavailablePaid)} tone="success" />
                ) : null}
                {orderDetailState.order.status === "CANCELLED" ? (
                  <StateMessage title={t(MessageKey.OrdersPaymentUnavailableCancelled)} />
                ) : null}

                <div className="grid grid-cols-[repeat(auto-fit,minmax(118px,1fr))] gap-3">
                  {operationStatusOptions.map((status) => (
                    <Button
                      type="button"
                      className={getOrderActionButtonClass(status)}
                      disabled={
                        confirmingPayment ||
                        updatingStatus !== null ||
                        orderDetailState.order.status === status ||
                        orderDetailState.order.status === "PAID"
                      }
                      key={status}
                      onClick={() => void handleStatusUpdate(status)}
                    >
                      {updatingStatus === status ? t(MessageKey.Saving) : getOrderStatusLabel(status)}
                    </Button>
                  ))}
                </div>
                {successMessage ? <StateMessage title={successMessage} tone="success" /> : null}
                {updateError ? (
                  <StateMessage title={t(actionErrorTitle)} description={updateError} tone="error" />
                ) : null}
              </>
            ) : null}
          </section>
        </section>
      ) : null}

      {pendingPaymentOrder ? (
        <div
          className="fixed inset-0 z-20 grid place-items-center bg-foreground/40 p-5"
          role="presentation"
          onMouseDown={() => {
            if (!confirmingPayment) {
              setPendingPaymentOrder(null);
            }
          }}
        >
          <section
            aria-labelledby="payment-confirm-title"
            aria-modal="true"
            className="grid w-[min(460px,100%)] gap-4 rounded-md border border-border bg-card p-5 shadow-floating"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 max-[780px]:flex-col max-[780px]:items-stretch">
              <div>
                <p className="mb-1.5 mt-0 text-xs font-bold uppercase text-muted-foreground">{t(MessageKey.NavPayments)}</p>
                <h2 className="m-0 text-lg" id="payment-confirm-title">{t(MessageKey.OrdersPaymentModalTitle)}</h2>
              </div>
              <span className={cn(statusPillClassName, getOrderStatusClassName(pendingPaymentOrder.status))}>
                {getOrderStatusLabel(pendingPaymentOrder.status)}
              </span>
            </div>

            <p className="m-0 leading-normal text-muted-foreground">
              {t(MessageKey.OrdersPaymentModalDescription, {
                tableName: pendingPaymentOrder.tableName
              })}
            </p>

            <div className="grid gap-2.5 rounded-md border border-border bg-muted/45 p-3">
              <div className="flex items-center justify-between gap-3 max-[780px]:flex-col max-[780px]:items-stretch">
                <span className="text-[13px] font-bold text-muted-foreground">{t(MessageKey.Branch)}</span>
                <strong className="break-words text-right text-secondary-foreground max-[780px]:text-left">{pendingPaymentOrder.branchName}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 max-[780px]:flex-col max-[780px]:items-stretch">
                <span className="text-[13px] font-bold text-muted-foreground">{t(MessageKey.OrdersPaymentMethod)}</span>
                <strong className="break-words text-right text-secondary-foreground max-[780px]:text-left">{t(MessageKey.OrdersPaymentMethodCash)}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border pt-2.5 max-[780px]:flex-col max-[780px]:items-stretch">
                <span className="text-[13px] font-bold text-muted-foreground">{t(MessageKey.OrdersTotalAmount)}</span>
                <strong className="break-words text-right text-xl text-primary max-[780px]:text-left">{formatCurrency(pendingPaymentOrder.total)}</strong>
              </div>
            </div>

            {updateError ? (
              <StateMessage title={t(actionErrorTitle)} description={updateError} tone="error" />
            ) : null}

            <div className="flex items-center justify-between gap-3 max-[780px]:flex-col max-[780px]:items-stretch">
              <Button
                type="button"
                className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent max-[780px]:w-full"
                disabled={confirmingPayment}
                onClick={() => setPendingPaymentOrder(null)}
              >
                {t(MessageKey.Cancel)}
              </Button>
              <Button
                type="button"
                className="mt-0 min-h-9 max-[780px]:w-full"
                disabled={confirmingPayment}
                onClick={() => void handleConfirmPayment()}
              >
                {confirmingPayment ? t(MessageKey.OrdersConfirmingPayment) : t(MessageKey.OrdersConfirmPayment)}
              </Button>
            </div>
          </section>
        </div>
      ) : null}

    </section>
  );
};
