import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { StateMessage } from "../../components/ui/StateMessage";
import { qrApi } from "../../features/customer-order/api";
import type { Menu, OrderDetail, OrderStatus, QrEntry } from "../../lib/api/types";
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

type QrRouteParams = {
  tenantId: string;
  branchId: string;
  tableId: string;
};

type Cart = Record<string, number>;
type RealtimeState = "idle" | "connecting" | "connected" | "fallback";

export const CustomerQrEntryPage = () => {
  const { locale, t } = useI18n();
  const { tenantId, branchId, tableId } = useParams<QrRouteParams>();
  const [qrEntryState, setQrEntryState] = useState<
    | { status: "loading" }
    | { status: "success"; qrEntry: QrEntry }
    | { status: "error"; message: string }
  >({ status: "loading" });
  const [menusState, setMenusState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success"; menus: Menu[] }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const [cart, setCart] = useState<Cart>({});
  const [orderState, setOrderState] = useState<
    | { status: "idle" }
    | { status: "submitting" }
    | { status: "success"; order: OrderDetail }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const [realtimeState, setRealtimeState] = useState<RealtimeState>("idle");
  const trackedOrderId = orderState.status === "success" ? orderState.order.id : "";

  useEffect(() => {
    if (!tenantId || !branchId || !tableId) {
      setQrEntryState({
        status: "error",
        message: t(MessageKey.QrMissingData)
      });
      return;
    }

    let isMounted = true;

    const loadQrEntry = async () => {
      setQrEntryState({ status: "loading" });

      try {
        const response = await qrApi.getEntry(tenantId, branchId, tableId);

        if (isMounted) {
          setQrEntryState({ status: "success", qrEntry: response.qrEntry });
        }
      } catch (error: unknown) {
        if (isMounted) {
          setQrEntryState({ status: "error", message: getUserErrorMessage(error, MessageKey.RequestFailed, locale) });
        }
      }
    };

    void loadQrEntry();

    return () => {
      isMounted = false;
    };
  }, [branchId, locale, t, tableId, tenantId]);

  useEffect(() => {
    if (!tenantId || !branchId || !tableId || qrEntryState.status !== "success") {
      setMenusState({ status: "idle" });
      return;
    }

    if (qrEntryState.qrEntry.table.status === "DISABLED") {
      setMenusState({ status: "idle" });
      return;
    }

    let isMounted = true;

    const loadMenus = async () => {
      setMenusState({ status: "loading" });

      try {
        const response = await qrApi.listMenus(tenantId, branchId, tableId);

        if (isMounted) {
          setMenusState({ status: "success", menus: response.menus });
        }
      } catch (error: unknown) {
        if (isMounted) {
          setMenusState({ status: "error", message: getUserErrorMessage(error, MessageKey.RequestFailed, locale) });
        }
      }
    };

    void loadMenus();

    return () => {
      isMounted = false;
    };
  }, [branchId, locale, qrEntryState, t, tableId, tenantId]);

  useEffect(() => {
    if (!tenantId || !branchId || !tableId || !trackedOrderId) {
      setRealtimeState("idle");
      return;
    }

    const socket = createRealtimeSocket();
    let fallbackTimer = window.setTimeout(() => {
      setRealtimeState("fallback");
    }, 5000);

    setRealtimeState("connecting");

    socket.on("connect", () => {
      window.clearTimeout(fallbackTimer);
      setRealtimeState("connected");
      socket.emit(RealtimeEvent.CustomerJoinTable, { tenantId, branchId, tableId });
      void refreshOrder(trackedOrderId);
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

    socket.on(RealtimeEvent.OrderStatusUpdated, (payload) => {
      if (payload.order.id === trackedOrderId) {
        setOrderState({ status: "success", order: payload.order });
      }
    });

    socket.connect();

    return () => {
      window.clearTimeout(fallbackTimer);
      socket.disconnect();
    };
  }, [branchId, tableId, tenantId, trackedOrderId]);

  if (!tenantId || !branchId || !tableId) {
    return <StateMessage title={t(MessageKey.QrInvalidTitle)} description={t(MessageKey.QrMissingData)} tone="error" />;
  }

  if (qrEntryState.status === "loading") {
    return <StateMessage title={t(MessageKey.QrCheckingTable)} description={t(MessageKey.QrCheckingTableDescription)} />;
  }

  if (qrEntryState.status === "error") {
    return <StateMessage title={t(MessageKey.QrInvalidTitle)} description={qrEntryState.message} tone="error" />;
  }

  const { qrEntry } = qrEntryState;
  const isDisabled = qrEntry.table.status === "DISABLED";
  const menus = menusState.status === "success" ? menusState.menus : [];
  const cartItems = menus
    .map((menu) => ({
      menu,
      quantity: cart[menu.id] ?? 0
    }))
    .filter((item) => item.quantity > 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + Number(item.menu.price) * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const formatCurrency = (price: string): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 2
    }).format(Number(price));
  };
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
  const updateCart = (menuId: string, delta: number) => {
    setCart((currentCart) => {
      const nextQuantity = Math.max(0, (currentCart[menuId] ?? 0) + delta);
      const nextCart = { ...currentCart };

      if (nextQuantity === 0) {
        delete nextCart[menuId];
      } else {
        nextCart[menuId] = nextQuantity;
      }

      return nextCart;
    });
  };
  const refreshOrder = async (orderId: string) => {
    if (!tenantId || !branchId || !tableId) {
      return;
    }

    try {
      const response = await qrApi.getOrder(tenantId, branchId, tableId, orderId);
      setOrderState({ status: "success", order: response.order });
    } catch (error: unknown) {
      setOrderState({ status: "error", message: getUserErrorMessage(error, MessageKey.RequestFailed, locale) });
    }
  };
  const submitOrder = async () => {
    if (!tenantId || !branchId || !tableId || cartItems.length === 0) {
      return;
    }

    setOrderState({ status: "submitting" });

    try {
      const response = await qrApi.createOrder(tenantId, branchId, tableId, {
        items: cartItems.map((item) => ({
          menuId: item.menu.id,
          quantity: item.quantity
        }))
      });

      setCart({});
      setOrderState({ status: "success", order: response.order });
    } catch (error: unknown) {
      setOrderState({ status: "error", message: getUserErrorMessage(error, MessageKey.RequestFailed, locale) });
    }
  };

  return (
    <section className="mx-auto w-[min(520px,100%)] rounded-md border border-border bg-card p-5 text-card-foreground shadow-panel">
      <p className="mb-1.5 mt-0 text-xs font-bold uppercase text-muted-foreground">{t(MessageKey.QrEyebrow)}</p>
      <h1 className="m-0 text-[28px] leading-tight">{qrEntry.table.name}</h1>
      <p className="mt-1 text-[13px] leading-normal text-muted-foreground">{qrEntry.branch.name}</p>
      <dl className="my-[18px] grid gap-2.5">
        <div className="flex justify-between gap-3 border-b border-border py-3">
          <dt className="font-bold text-muted-foreground">{t(MessageKey.QrBranch)}</dt>
          <dd className="m-0 break-words">{qrEntry.branch.name}</dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-border py-3">
          <dt className="font-bold text-muted-foreground">{t(MessageKey.QrTableStatus)}</dt>
          <dd className="m-0 break-words">
            {qrEntry.table.status === "DISABLED" ? t(MessageKey.Unavailable) : t(MessageKey.ReadyToOrder)}
          </dd>
        </div>
      </dl>
      {isDisabled ? (
        <StateMessage
          title={t(MessageKey.QrTableUnavailableTitle)}
          description={t(MessageKey.QrTableUnavailableDescription)}
          tone="error"
        />
      ) : null}

      {!isDisabled && menusState.status === "loading" ? (
        <StateMessage title={t(MessageKey.QrLoadingMenuTitle)} description={t(MessageKey.QrLoadingMenuDescription)} />
      ) : null}
      {!isDisabled && menusState.status === "error" ? (
        <StateMessage title={t(MessageKey.QrUnableToLoadMenu)} description={menusState.message} tone="error" />
      ) : null}
      {!isDisabled && menusState.status === "success" && menus.length === 0 ? (
        <StateMessage title={t(MessageKey.QrNoDishesTitle)} description={t(MessageKey.QrNoDishesDescription)} />
      ) : null}
      {!isDisabled && menus.length > 0 ? (
        <>
          <div className="mt-5 flex items-center justify-between gap-3 max-[780px]:items-start">
            <h2 className="m-0 text-base">{t(MessageKey.QrAvailableDishes)}</h2>
            <span className="flex-none text-[13px] font-bold text-muted-foreground">{t(MessageKey.QrItems, { count: menus.length })}</span>
          </div>
          <div className="mt-[18px] grid gap-2.5">
            {menus.map((menu) => (
              <article className="flex items-center justify-start gap-3.5 border-b border-border py-3 max-[780px]:items-start" key={menu.id}>
                <div className="grid h-16 w-16 flex-none place-items-center overflow-hidden rounded-md border border-border bg-muted font-extrabold text-muted-foreground" aria-label={menu.imageUrl ? menu.name : t(MessageKey.MenusNoImage)}>
                  {menu.imageUrl ? <img className="h-full w-full object-cover" src={menu.imageUrl} alt={menu.name} loading="lazy" /> : <span>{menu.name[0]}</span>}
                </div>
                <div className="grid min-w-0 gap-1">
                  <strong>{menu.name}</strong>
                  <span className="break-words text-[13px] text-muted-foreground">{t(MessageKey.QrAvailableNow)}</span>
                </div>
                <b className="ml-auto flex-none text-primary max-[780px]:ml-0">{formatCurrency(menu.price)}</b>
                <div className="inline-grid flex-none grid-cols-[42px_36px_42px] items-center justify-end gap-1.5 max-[780px]:w-full max-[780px]:justify-start">
                  <Button
                    type="button"
                    className="min-h-[42px] w-[42px] touch-manipulation bg-secondary p-0 text-base text-secondary-foreground hover:bg-accent"
                    aria-label={t(MessageKey.QrDecreaseItem)}
                    onClick={() => updateCart(menu.id, -1)}
                    disabled={(cart[menu.id] ?? 0) === 0 || orderState.status === "submitting"}
                  >
                    -
                  </Button>
                  <span className="text-center font-extrabold text-secondary-foreground">{cart[menu.id] ?? 0}</span>
                  <Button
                    type="button"
                    className="min-h-[42px] w-[42px] touch-manipulation bg-secondary p-0 text-base text-secondary-foreground hover:bg-accent"
                    aria-label={t(MessageKey.QrIncreaseItem)}
                    onClick={() => updateCart(menu.id, 1)}
                    disabled={orderState.status === "submitting"}
                  >
                    +
                  </Button>
                </div>
              </article>
            ))}
          </div>
          <section className="mt-5 grid gap-3 border-t border-border pt-4">
            <div className="mt-5 flex items-center justify-between gap-3 max-[780px]:items-start">
              <h2 className="m-0 text-base">{t(MessageKey.QrCartTitle)}</h2>
              <span className="flex-none text-[13px] font-bold text-muted-foreground">{t(MessageKey.QrItems, { count: cartCount })}</span>
            </div>
            {cartItems.length === 0 ? (
              <StateMessage title={t(MessageKey.QrCartEmpty)} />
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 py-3 font-extrabold">
                  <span>{t(MessageKey.QrSubtotal)}</span>
                  <strong className="text-primary">{formatCurrency(String(cartTotal))}</strong>
                </div>
                <Button type="button" disabled={orderState.status === "submitting"} onClick={() => void submitOrder()}>
                  {orderState.status === "submitting" ? t(MessageKey.QrSubmittingOrder) : t(MessageKey.QrSubmitOrder)}
                </Button>
              </>
            )}
            {orderState.status === "error" ? (
              <StateMessage title={t(MessageKey.QrUnableToSubmitOrder)} description={orderState.message} tone="error" />
            ) : null}
          </section>
          {orderState.status === "success" ? (
            <section className="mt-5 grid gap-3 border-t border-border pt-4">
              <div className="mt-5 flex items-center justify-between gap-3 max-[780px]:items-start">
                <h2 className="m-0 text-base">{t(MessageKey.QrTrackingTitle)}</h2>
                <span className={cn("inline-flex min-h-[30px] items-center justify-center self-center rounded-full px-2.5 py-1 text-xs font-extrabold", getRealtimeConnectionClassName(realtimeState))}>
                  {realtimeState === "connected" ? t(MessageKey.RealtimeConnected) : null}
                  {realtimeState === "connecting" ? t(MessageKey.RealtimeConnecting) : null}
                  {realtimeState === "fallback" ? t(MessageKey.RealtimeFallback) : null}
                </span>
              </div>
              <span className={cn(statusPillClassName, getOrderStatusClassName(orderState.order.status))}>
                {getOrderStatusLabel(orderState.order.status)}
              </span>
              <div className="flex items-center justify-between gap-3 py-3 font-extrabold">
                <span>{t(MessageKey.QrOrderTotal)}</span>
                <strong className="text-primary">{formatCurrency(orderState.order.total)}</strong>
              </div>
              <Button type="button" className="bg-secondary text-secondary-foreground hover:bg-accent" onClick={() => void refreshOrder(orderState.order.id)}>
                {t(MessageKey.Refresh)}
              </Button>
            </section>
          ) : null}
        </>
      ) : null}
    </section>
  );
};
