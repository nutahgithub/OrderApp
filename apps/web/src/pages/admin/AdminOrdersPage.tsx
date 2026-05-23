import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clock3 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { DateField } from "../../components/ui/DateField";
import { PageHeader } from "../../components/ui/PageHeader";
import { Panel } from "../../components/ui/Panel";
import { SelectField } from "../../components/ui/SelectField";
import { StateMessage } from "../../components/ui/StateMessage";
import { StatusPill } from "../../components/ui/StatusPill";
import { Toolbar } from "../../components/ui/Toolbar";
import { useAuth } from "../../features/auth/AuthContext";
import { branchesApi } from "../../features/branches/api";
import { OrderActionPanel } from "../../features/orders/components/OrderActionPanel";
import { PaymentConfirmDialog } from "../../features/orders/components/PaymentConfirmDialog";
import { ordersApi } from "../../features/orders/api";
import { useConfirmPaymentMutation, useUpdateOrderStatusMutation } from "../../features/orders/hooks";
import type { Branch, Order, OrderDetail, OrderStatus, UpdateOrderStatusRequest } from "../../lib/api/types";
import { formatDateTime, toDateInputValue } from "../../lib/format/date";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";
import { createRealtimeSocket, RealtimeEvent } from "../../lib/realtime/socket";
import { getOrderStatusClassName, getRealtimeConnectionClassName } from "../../lib/theme/status-colors";
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

type OrdersPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

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

const ordersPageSize = 10;

export const AdminOrdersPage = () => {
  const { token, logout } = useAuth();
  const { locale, t } = useI18n();
  const [branchesState, setBranchesState] = useState<BranchesState>({ status: "loading" });
  const [ordersState, setOrdersState] = useState<OrdersState>({ status: "idle" });
  const [orderDetailState, setOrderDetailState] = useState<OrderDetailState>({ status: "idle" });
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "ALL">("ALL");
  const [selectedOrderDate, setSelectedOrderDate] = useState(() => toDateInputValue(new Date()));
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPagination, setOrdersPagination] = useState<OrdersPagination>({
    page: 1,
    pageSize: ordersPageSize,
    total: 0,
    totalPages: 1
  });
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [actionErrorTitle, setActionErrorTitle] = useState<MessageKey>(MessageKey.OrdersUnableToUpdateStatus);
  const [updatingStatus, setUpdatingStatus] = useState<UpdateOrderStatusRequest["status"] | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<OrderDetail | null>(null);
  const [realtimeState, setRealtimeState] = useState<RealtimeState>("idle");
  const paymentIdempotencyKeyRef = useRef<string | null>(null);
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

  const shouldShowOrder = useCallback(
    (order: Order): boolean => {
      return (
        order.branchId === selectedBranchId &&
        order.createdAt.slice(0, 10) === selectedOrderDate &&
        (selectedStatus === "ALL" || order.status === selectedStatus)
      );
    },
    [selectedBranchId, selectedOrderDate, selectedStatus]
  );

  const loadBranches = useCallback(async () => {
    if (!token) {
      setBranchesState({ status: "error", message: t(MessageKey.AuthSessionExpired) });
      logout();
      return;
    }

    setBranchesState({ status: "loading" });

    try {
      const response = await branchesApi.list(token);
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
        const response = await ordersApi.get(token, orderId);
        setOrderDetailState({ status: "success", order: response.order });
      } catch (error: unknown) {
        setOrderDetailState({ status: "error", message: getUserErrorMessage(error, MessageKey.RequestFailed, locale) });
      }
    },
    [locale, logout, t, token]
  );

  const loadOrders = useCallback(
    async (branchId: string, status: OrderStatus | "ALL", orderDate: string, page: number) => {
      if (!token) {
        setOrdersState({ status: "error", message: t(MessageKey.AuthSessionExpired) });
        logout();
        return;
      }

      if (!branchId) {
        setOrdersState({ status: "idle" });
        setOrdersPagination({
          page: 1,
          pageSize: ordersPageSize,
          total: 0,
          totalPages: 1
        });
        setSelectedOrderId("");
        setOrderDetailState({ status: "idle" });
        return;
      }

      setOrdersState({ status: "loading" });

      try {
        const response = await ordersApi.list(token, {
          branchId,
          status: status === "ALL" ? undefined : status,
          startDate: orderDate,
          endDate: orderDate,
          page,
          pageSize: ordersPageSize
        });
        setOrdersState({ status: "success", orders: response.orders });
        setOrdersPagination(response.pagination);
        if (response.orders.length === 0 && page > response.pagination.totalPages) {
          setOrdersPage(response.pagination.totalPages);
          return;
        }
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
    void loadOrders(selectedBranchId, selectedStatus, selectedOrderDate, ordersPage);
  }, [loadOrders, ordersPage, selectedBranchId, selectedOrderDate, selectedStatus]);

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
      void loadOrders(selectedBranchId, selectedStatus, selectedOrderDate, ordersPage);
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

      void loadOrders(selectedBranchId, selectedStatus, selectedOrderDate, ordersPage);
      setSelectedOrderId((currentOrderId) => currentOrderId || payload.order.id);
    });

    socket.on(RealtimeEvent.OrderStatusUpdated, (payload) => {
      if (payload.order.branchId === selectedBranchId && payload.order.createdAt.slice(0, 10) === selectedOrderDate) {
        void loadOrders(selectedBranchId, selectedStatus, selectedOrderDate, ordersPage);
      }

      setOrderDetailState((currentState) => {
        if (currentState.status === "success" && currentState.order.id === payload.order.id) {
          return { status: "success", order: payload.order };
        }

        return currentState;
      });
    });

    socket.on(RealtimeEvent.PaymentCompleted, (payload) => {
      if (payload.order.branchId === selectedBranchId && payload.order.createdAt.slice(0, 10) === selectedOrderDate) {
        void loadOrders(selectedBranchId, selectedStatus, selectedOrderDate, ordersPage);
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
  }, [loadOrders, ordersPage, selectedBranchId, selectedOrderDate, selectedStatus, shouldShowOrder, token]);

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
      void loadOrders(selectedBranchId, selectedStatus, selectedOrderDate, ordersPage);
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
    if (!paymentIdempotencyKeyRef.current) {
      paymentIdempotencyKeyRef.current = crypto.randomUUID();
    }

    try {
      const response = await confirmPaymentMutation.mutateAsync({
        orderId: pendingPaymentOrder.id,
        amount: pendingPaymentOrder.total,
        idempotencyKey: paymentIdempotencyKeyRef.current
      });
      setOrderDetailState({ status: "success", order: response.order });
      void loadOrders(selectedBranchId, selectedStatus, selectedOrderDate, ordersPage);
      setSelectedOrderId(response.order.id);
      setPendingPaymentOrder(null);
      paymentIdempotencyKeyRef.current = null;
      setSuccessMessage(t(MessageKey.OrdersPaymentCompleted));
    } catch (error: unknown) {
      setUpdateError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    } finally {
      setConfirmingPayment(false);
    }
  };

  return (
    <section className="grid gap-5">
      <PageHeader
        eyebrow={t(MessageKey.OrdersEyebrow)}
        title={t(MessageKey.OrdersTitle)}
        subtitle={t(MessageKey.OrdersSubtitle)}
      />

      <Toolbar className="grid-cols-[minmax(0,260px)_minmax(0,190px)_minmax(0,180px)_auto_auto]">
        <SelectField
          label={t(MessageKey.Branch)}
          options={branches.map((branch) => ({ label: branch.name, value: branch.id }))}
          value={selectedBranchId}
          disabled={branches.length === 0}
          onValueChange={(value) => {
              setSelectedBranchId(value);
              setOrdersPage(1);
              setSelectedOrderId("");
              setSuccessMessage(null);
              setUpdateError(null);
            }}
        />
        <SelectField
          label={t(MessageKey.Status)}
          options={allStatusOptions.map((status) => ({ label: getOrderStatusLabel(status), value: status }))}
          value={selectedStatus}
          onValueChange={(value) => {
              setSelectedStatus(value as OrderStatus | "ALL");
              setOrdersPage(1);
              setSelectedOrderId("");
              setSuccessMessage(null);
              setUpdateError(null);
            }}
        />
        <DateField
          label={t(MessageKey.OrdersDate)}
          value={selectedOrderDate}
          onValueChange={(value) => {
              setSelectedOrderDate(value);
              setOrdersPage(1);
              setSelectedOrderId("");
              setSuccessMessage(null);
              setUpdateError(null);
            }}
        />
        <Button
          type="button"
          className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
          disabled={!selectedBranchId}
          onClick={() => void loadOrders(selectedBranchId, selectedStatus, selectedOrderDate, ordersPage)}
        >
          {t(MessageKey.Refresh)}
        </Button>
        <span className={cn("inline-flex min-h-9 items-center justify-center self-end rounded-full px-2.5 py-1 text-xs font-extrabold max-[780px]:self-stretch", getRealtimeConnectionClassName(realtimeState))}>
          {realtimeState === "connected" ? t(MessageKey.RealtimeConnected) : null}
          {realtimeState === "connecting" ? t(MessageKey.RealtimeConnecting) : null}
          {realtimeState === "fallback" ? t(MessageKey.RealtimeFallback) : null}
        </span>
      </Toolbar>

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
        <section className="grid grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)] items-start gap-4 max-[980px]:grid-cols-1">
          <Panel className="max-[980px]:max-h-none min-[981px]:max-h-[calc(100vh-220px)] min-[981px]:overflow-auto">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="m-0 text-base">{t(MessageKey.OrdersListTitle)}</h2>
                {ordersState.status === "success" ? (
                  <p className="mt-1 text-[13px] leading-normal text-muted-foreground">{t(MessageKey.OrdersTotal, { count: ordersPagination.total })}</p>
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
                      <small className="inline-flex items-center gap-1.5 break-words text-[13px] text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
                        {formatDateTime(order.createdAt)}
                      </small>
                    </span>
                    <StatusPill className={getOrderStatusClassName(order.status)}>
                      {getOrderStatusLabel(order.status)}
                    </StatusPill>
                    <b className="text-primary">{formatCurrency(order.total)}</b>
                  </button>
                ))}
              </div>
            ) : null}
            {ordersState.status === "success" && ordersPagination.totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 max-[780px]:flex-col max-[780px]:items-stretch">
                <Button
                  type="button"
                  className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
                  disabled={ordersPage <= 1}
                  onClick={() => {
                    setOrdersPage((currentPage) => Math.max(1, currentPage - 1));
                    setSelectedOrderId("");
                  }}
                >
                  {t(MessageKey.OrdersPreviousPage)}
                </Button>
                <span className="text-center text-[13px] font-bold text-muted-foreground">
                  {t(MessageKey.OrdersPageSummary, {
                    page: ordersPagination.page,
                    totalPages: ordersPagination.totalPages
                  })}
                </span>
                <Button
                  type="button"
                  className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
                  disabled={ordersPage >= ordersPagination.totalPages}
                  onClick={() => {
                    setOrdersPage((currentPage) => Math.min(ordersPagination.totalPages, currentPage + 1));
                    setSelectedOrderId("");
                  }}
                >
                  {t(MessageKey.OrdersNextPage)}
                </Button>
              </div>
            ) : null}
          </Panel>

          <Panel className="grid gap-3 min-[981px]:sticky min-[981px]:top-7">
            {orderDetailState.status === "idle" ? <StateMessage title={t(MessageKey.OrdersSelectOrder)} /> : null}
            {orderDetailState.status === "loading" ? <StateMessage title={t(MessageKey.OrdersLoadingDetail)} /> : null}
            {orderDetailState.status === "error" ? (
              <StateMessage title={t(MessageKey.OrdersUnableToLoadDetail)} description={orderDetailState.message} tone="error" />
            ) : null}
            {orderDetailState.status === "success" ? (
              <>
                <OrderActionPanel
                  order={orderDetailState.order}
                  statusOptions={operationStatusOptions}
                  updatingStatus={updatingStatus}
                  confirmingPayment={confirmingPayment}
                  onStatusUpdate={(status) => void handleStatusUpdate(status)}
                  onRequestPayment={() => {
                    setSuccessMessage(null);
                    setUpdateError(null);
                    paymentIdempotencyKeyRef.current = crypto.randomUUID();
                    setPendingPaymentOrder(orderDetailState.order);
                  }}
                />
                {orderDetailState.order.status === "PAID" ? (
                  <StateMessage title={t(MessageKey.OrdersPaymentUnavailablePaid)} tone="success" />
                ) : null}
                {orderDetailState.order.status === "CANCELLED" ? (
                  <StateMessage title={t(MessageKey.OrdersPaymentUnavailableCancelled)} />
                ) : null}

                {successMessage ? <StateMessage title={successMessage} tone="success" /> : null}
                {updateError ? (
                  <StateMessage title={t(actionErrorTitle)} description={updateError} tone="error" />
                ) : null}
              </>
            ) : null}
          </Panel>
        </section>
      ) : null}

      {pendingPaymentOrder ? (
        <PaymentConfirmDialog
          order={pendingPaymentOrder}
          isSubmitting={confirmingPayment}
          error={updateError}
          onCancel={() => {
            paymentIdempotencyKeyRef.current = null;
            setPendingPaymentOrder(null);
          }}
          onConfirm={() => void handleConfirmPayment()}
        />
      ) : null}

    </section>
  );
};
