import { useEffect, useRef, useState } from "react";
import { Minus, Plus, ReceiptText, Store } from "lucide-react";
import { useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { StateMessage } from "../../components/ui/StateMessage";
import { StatusPill } from "../../components/ui/StatusPill";
import { qrApi } from "../../features/customer-order/api";
import type { Menu, OrderDetail, OrderStatus, QrEntry } from "../../lib/api/types";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";
import { createRealtimeSocket, RealtimeEvent } from "../../lib/realtime/socket";
import { getOrderStatusClassName, getRealtimeConnectionClassName } from "../../lib/theme/status-colors";
import { cn } from "../../lib/utils/cn";

type QrRouteParams = {
  tenantId: string;
  branchId: string;
  tableId: string;
};

type Cart = Record<string, number>;
type RealtimeState = "idle" | "connecting" | "connected" | "fallback";
type PendingIdempotencyKey = {
  payloadSignature: string;
  key: string;
};

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
  const [qrReloadKey, setQrReloadKey] = useState(0);
  const [menuReloadKey, setMenuReloadKey] = useState(0);
  const [orderState, setOrderState] = useState<
    | { status: "idle" }
    | { status: "submitting" }
    | { status: "success"; order: OrderDetail }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const [realtimeState, setRealtimeState] = useState<RealtimeState>("idle");
  const orderIdempotencyRef = useRef<PendingIdempotencyKey | null>(null);
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
  }, [branchId, locale, qrReloadKey, t, tableId, tenantId]);

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
  }, [branchId, locale, menuReloadKey, qrEntryState, t, tableId, tenantId]);

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
    return (
      <StateMessage
        title={t(MessageKey.QrInvalidTitle)}
        description={qrEntryState.message}
        tone="error"
        action={
          <Button type="button" className="mt-0 min-h-9" onClick={() => setQrReloadKey((currentKey) => currentKey + 1)}>
            {t(MessageKey.Refresh)}
          </Button>
        }
      />
    );
  }

  const { qrEntry } = qrEntryState;
  const isDisabled = qrEntry.table.status === "DISABLED";
  const menus = menusState.status === "success" ? menusState.menus : [];
  const menuGroups = (() => {
    const groups = new Map<string, { id: string; name: string; sortOrder: number; menus: Menu[] }>();

    menus.forEach((menu) => {
      const groupId = menu.categoryId ?? "uncategorized";
      const group = groups.get(groupId) ?? {
        id: groupId,
        name: menu.categoryName ?? t(MessageKey.MenusUncategorized),
        sortOrder: menu.categorySortOrder ?? 9999,
        menus: []
      };

      group.menus.push(menu);
      groups.set(groupId, group);
    });

    return [...groups.values()]
      .map((group) => ({
        ...group,
        menus: group.menus.sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))
      }))
      .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
  })();
  const cartItems = menus
    .filter((menu) => !menu.isOutOfStock)
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

    const orderPayload = {
      items: cartItems.map((item) => ({
        menuId: item.menu.id,
        quantity: item.quantity
      }))
    };
    const payloadSignature = JSON.stringify([...orderPayload.items].sort((left, right) => left.menuId.localeCompare(right.menuId)));

    if (orderIdempotencyRef.current?.payloadSignature !== payloadSignature) {
      orderIdempotencyRef.current = {
        payloadSignature,
        key: crypto.randomUUID()
      };
    }

    setOrderState({ status: "submitting" });

    try {
      const response = await qrApi.createOrder(
        tenantId,
        branchId,
        tableId,
        orderPayload,
        orderIdempotencyRef.current.key
      );

      setCart({});
      orderIdempotencyRef.current = null;
      setOrderState({ status: "success", order: response.order });
    } catch (error: unknown) {
      setOrderState({ status: "error", message: getUserErrorMessage(error, MessageKey.RequestFailed, locale) });
    }
  };

  return (
    <section className="mx-auto grid w-[min(520px,100%)] gap-4 pb-24">
      <Panel className="overflow-hidden p-0">
        <div className="bg-primary px-5 py-5 text-primary-foreground">
          <p className="mb-1.5 mt-0 text-xs font-bold uppercase tracking-normal text-primary-foreground/80">{t(MessageKey.QrEyebrow)}</p>
          <h1 className="m-0 break-words text-[30px] leading-tight">{qrEntry.table.name}</h1>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm leading-normal text-primary-foreground/85">
            <Store className="h-4 w-4" aria-hidden="true" />
            <span className="break-words">{qrEntry.branch.name}</span>
          </p>
        </div>
        <dl className="grid gap-2.5 p-5">
          <div className="flex justify-between gap-3 border-b border-border py-3">
            <dt className="font-bold text-muted-foreground">{t(MessageKey.QrBranch)}</dt>
            <dd className="m-0 break-words text-right">{qrEntry.branch.name}</dd>
          </div>
          <div className="flex justify-between gap-3 py-3">
            <dt className="font-bold text-muted-foreground">{t(MessageKey.QrTableStatus)}</dt>
            <dd className="m-0 break-words text-right">
              {qrEntry.table.status === "DISABLED" ? t(MessageKey.Unavailable) : t(MessageKey.ReadyToOrder)}
            </dd>
          </div>
        </dl>
      </Panel>
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
        <StateMessage
          title={t(MessageKey.QrUnableToLoadMenu)}
          description={menusState.message}
          tone="error"
          action={
            <Button
              type="button"
              className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
              onClick={() => setMenuReloadKey((currentKey) => currentKey + 1)}
            >
              {t(MessageKey.Refresh)}
            </Button>
          }
        />
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
          <div className="mt-[18px] grid gap-5">
            {menuGroups.map((group) => (
              <section className="grid gap-2.5" key={group.id}>
                <h3 className="m-0 text-sm font-extrabold uppercase tracking-normal text-muted-foreground">{group.name}</h3>
                {group.menus.map((menu) => (
              <article className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-md border border-border bg-card p-3 shadow-panel max-[460px]:grid-cols-[72px_minmax(0,1fr)] max-[460px]:items-start" key={menu.id}>
                <div className="grid h-[72px] w-[72px] flex-none place-items-center overflow-hidden rounded-md border border-border bg-muted font-extrabold text-muted-foreground" aria-label={menu.imageUrl ? menu.name : t(MessageKey.MenusNoImage)}>
                  {menu.imageUrl ? <img className="h-full w-full object-cover" src={menu.imageUrl} alt={menu.name} loading="lazy" /> : <span>{menu.name[0]}</span>}
                </div>
                <div className="grid min-w-0 gap-1">
                  <strong>{menu.name}</strong>
                  <span className="break-words text-[13px] text-muted-foreground">
                    {menu.isOutOfStock ? t(MessageKey.MenusOutOfStockLabel) : t(MessageKey.QrAvailableNow)}
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    {menu.isFeatured ? <StatusPill className="bg-primary text-primary-foreground">{t(MessageKey.MenusFeaturedLabel)}</StatusPill> : null}
                    {menu.isNew ? <StatusPill className="bg-accent text-accent-foreground">{t(MessageKey.MenusNewLabel)}</StatusPill> : null}
                  </span>
                  <b className="text-primary">{formatCurrency(menu.price)}</b>
                </div>
                <div className="inline-grid flex-none grid-cols-[42px_36px_42px] items-center justify-end gap-1.5 max-[460px]:col-span-2 max-[460px]:w-full max-[460px]:justify-end">
                  <Button
                    type="button"
                    className="min-h-[42px] w-[42px] touch-manipulation bg-secondary p-0 text-base text-secondary-foreground hover:bg-accent"
                    aria-label={t(MessageKey.QrDecreaseItem)}
                    onClick={() => updateCart(menu.id, -1)}
                    disabled={menu.isOutOfStock || (cart[menu.id] ?? 0) === 0 || orderState.status === "submitting"}
                  >
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <span className="text-center font-extrabold text-secondary-foreground">{cart[menu.id] ?? 0}</span>
                  <Button
                    type="button"
                    className="min-h-[42px] w-[42px] touch-manipulation bg-secondary p-0 text-base text-secondary-foreground hover:bg-accent"
                    aria-label={t(MessageKey.QrIncreaseItem)}
                    onClick={() => updateCart(menu.id, 1)}
                    disabled={menu.isOutOfStock || orderState.status === "submitting"}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </article>
                ))}
              </section>
            ))}
          </div>
          <Panel className="mt-5 grid gap-3">
            <div className="mt-5 flex items-center justify-between gap-3 max-[780px]:items-start">
              <h2 className="m-0 inline-flex items-center gap-2 text-base">
                <ReceiptText className="h-4 w-4 text-primary" aria-hidden="true" />
                {t(MessageKey.QrCartTitle)}
              </h2>
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
          </Panel>
          {orderState.status === "success" ? (
            <Panel className="mt-5 grid gap-3">
              <div className="mt-5 flex items-center justify-between gap-3 max-[780px]:items-start">
                <h2 className="m-0 text-base">{t(MessageKey.QrTrackingTitle)}</h2>
                <span className={cn("inline-flex min-h-[30px] items-center justify-center self-center rounded-full px-2.5 py-1 text-xs font-extrabold", getRealtimeConnectionClassName(realtimeState))}>
                  {realtimeState === "connected" ? t(MessageKey.RealtimeConnected) : null}
                  {realtimeState === "connecting" ? t(MessageKey.RealtimeConnecting) : null}
                  {realtimeState === "fallback" ? t(MessageKey.RealtimeFallback) : null}
                </span>
              </div>
              <StatusPill className={getOrderStatusClassName(orderState.order.status)}>
                {getOrderStatusLabel(orderState.order.status)}
              </StatusPill>
              <div className="flex items-center justify-between gap-3 py-3 font-extrabold">
                <span>{t(MessageKey.QrOrderTotal)}</span>
                <strong className="text-primary">{formatCurrency(orderState.order.total)}</strong>
              </div>
              <Button type="button" className="bg-secondary text-secondary-foreground hover:bg-accent" onClick={() => void refreshOrder(orderState.order.id)}>
                {t(MessageKey.Refresh)}
              </Button>
            </Panel>
          ) : null}
          {cartItems.length > 0 && orderState.status !== "success" ? (
            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 p-3 shadow-floating backdrop-blur">
              <div className="mx-auto flex w-[min(520px,100%)] items-center justify-between gap-3">
                <div className="grid min-w-0 gap-0.5">
                  <span className="text-xs font-bold text-muted-foreground">{t(MessageKey.QrItems, { count: cartCount })}</span>
                  <strong className="break-words text-primary">{formatCurrency(String(cartTotal))}</strong>
                </div>
                <Button type="button" className="mt-0 flex-none px-5" disabled={orderState.status === "submitting"} onClick={() => void submitOrder()}>
                  {orderState.status === "submitting" ? t(MessageKey.QrSubmittingOrder) : t(MessageKey.QrSubmitOrder)}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
};
