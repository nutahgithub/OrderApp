import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { StateMessage } from "../../components/ui/StateMessage";
import { apiClient } from "../../lib/api/client";
import type { Menu, OrderDetail, OrderStatus, QrEntry } from "../../lib/api/types";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";
import { createRealtimeSocket, RealtimeEvent } from "../../lib/realtime/socket";

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
        const response = await apiClient.getQrEntry(tenantId, branchId, tableId);

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
        const response = await apiClient.listPublicMenus(tenantId, branchId, tableId);

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
      const response = await apiClient.getQrOrder(tenantId, branchId, tableId, orderId);
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
      const response = await apiClient.createQrOrder(tenantId, branchId, tableId, {
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
    <section className="customer-card">
      <p className="eyebrow">{t(MessageKey.QrEyebrow)}</p>
      <h1>{qrEntry.table.name}</h1>
      <p className="customer-subtitle">{qrEntry.branch.name}</p>
      <dl className="qr-context">
        <div>
          <dt>{t(MessageKey.QrBranch)}</dt>
          <dd>{qrEntry.branch.name}</dd>
        </div>
        <div>
          <dt>{t(MessageKey.QrTableStatus)}</dt>
          <dd>
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
          <div className="customer-section-header">
            <h2>{t(MessageKey.QrAvailableDishes)}</h2>
            <span>{t(MessageKey.QrItems, { count: menus.length })}</span>
          </div>
          <div className="customer-menu-list">
            {menus.map((menu) => (
              <article className="customer-menu-row" key={menu.id}>
                <div className="customer-menu-thumb" aria-label={menu.imageUrl ? menu.name : t(MessageKey.MenusNoImage)}>
                  {menu.imageUrl ? <img src={menu.imageUrl} alt={menu.name} loading="lazy" /> : <span>{menu.name[0]}</span>}
                </div>
                <div>
                  <strong>{menu.name}</strong>
                  <span>{t(MessageKey.QrAvailableNow)}</span>
                </div>
                <b>{formatCurrency(menu.price)}</b>
                <div className="cart-stepper">
                  <Button
                    type="button"
                    className="button--secondary button--icon"
                    aria-label={t(MessageKey.QrDecreaseItem)}
                    onClick={() => updateCart(menu.id, -1)}
                    disabled={(cart[menu.id] ?? 0) === 0 || orderState.status === "submitting"}
                  >
                    -
                  </Button>
                  <span>{cart[menu.id] ?? 0}</span>
                  <Button
                    type="button"
                    className="button--secondary button--icon"
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
          <section className="customer-cart">
            <div className="customer-section-header">
              <h2>{t(MessageKey.QrCartTitle)}</h2>
              <span>{t(MessageKey.QrItems, { count: cartCount })}</span>
            </div>
            {cartItems.length === 0 ? (
              <StateMessage title={t(MessageKey.QrCartEmpty)} />
            ) : (
              <>
                <div className="order-total-row">
                  <span>{t(MessageKey.QrSubtotal)}</span>
                  <strong>{formatCurrency(String(cartTotal))}</strong>
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
            <section className="customer-tracking">
              <div className="customer-section-header">
                <h2>{t(MessageKey.QrTrackingTitle)}</h2>
                <span className={`connection-pill connection-pill--${realtimeState}`}>
                  {realtimeState === "connected" ? t(MessageKey.RealtimeConnected) : null}
                  {realtimeState === "connecting" ? t(MessageKey.RealtimeConnecting) : null}
                  {realtimeState === "fallback" ? t(MessageKey.RealtimeFallback) : null}
                </span>
              </div>
              <span className={`status-pill status-pill--order-${orderState.order.status.toLowerCase()}`}>
                {getOrderStatusLabel(orderState.order.status)}
              </span>
              <div className="order-total-row">
                <span>{t(MessageKey.QrOrderTotal)}</span>
                <strong>{formatCurrency(orderState.order.total)}</strong>
              </div>
              <Button type="button" className="button--secondary" onClick={() => void refreshOrder(orderState.order.id)}>
                {t(MessageKey.Refresh)}
              </Button>
            </section>
          ) : null}
        </>
      ) : null}
    </section>
  );
};
