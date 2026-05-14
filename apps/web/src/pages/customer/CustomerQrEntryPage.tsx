import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { StateMessage } from "../../components/ui/StateMessage";
import { apiClient } from "../../lib/api/client";
import type { Menu, OrderStatus, OrderSummary, QrEntry } from "../../lib/api/types";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";

type QrRouteParams = {
  tenantId: string;
  branchId: string;
  tableId: string;
};

type CartItem = {
  menu: Menu;
  quantity: number;
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
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [submitState, setSubmitState] = useState<
    | { status: "idle" }
    | { status: "submitting" }
    | { status: "success"; order: OrderSummary }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const [refreshState, setRefreshState] = useState<"idle" | "refreshing" | "error">("idle");

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
  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((sum, item) => sum + Number(item.menu.price) * item.quantity, 0);
  const cartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const formatCurrency = (price: string): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 2
    }).format(Number(price));
  };
  const formatAmount = (amount: number): string => formatCurrency(amount.toFixed(2));
  const statusLabel = (status: OrderStatus): string => {
    const statusLabels: Record<OrderStatus, MessageKey> = {
      PENDING: MessageKey.QrOrderPending,
      CONFIRMED: MessageKey.QrOrderConfirmed,
      PREPARING: MessageKey.QrOrderPreparing,
      READY: MessageKey.QrOrderReady,
      SERVED: MessageKey.QrOrderServed,
      CANCELLED: MessageKey.QrOrderCancelled,
      PAID: MessageKey.QrOrderPaid
    };

    return t(statusLabels[status]);
  };
  const submittedOrder = submitState.status === "success" ? submitState.order : null;

  const addToCart = (menu: Menu) => {
    setCart((current) => ({
      ...current,
      [menu.id]: {
        menu,
        quantity: (current[menu.id]?.quantity ?? 0) + 1
      }
    }));
  };

  const decreaseCartItem = (menuId: string) => {
    setCart((current) => {
      const item = current[menuId];

      if (!item) {
        return current;
      }

      if (item.quantity <= 1) {
        const next = { ...current };
        delete next[menuId];
        return next;
      }

      return {
        ...current,
        [menuId]: {
          ...item,
          quantity: item.quantity - 1
        }
      };
    });
  };

  const removeCartItem = (menuId: string) => {
    setCart((current) => {
      const next = { ...current };
      delete next[menuId];
      return next;
    });
  };

  const submitOrder = async () => {
    if (!tenantId || !branchId || !tableId || cartItems.length === 0 || submitState.status === "submitting") {
      return;
    }

    setSubmitState({ status: "submitting" });

    try {
      const response = await apiClient.createCustomerOrder(tenantId, branchId, tableId, {
        items: cartItems.map((item) => ({
          menuId: item.menu.id,
          quantity: item.quantity
        }))
      });

      setSubmitState({ status: "success", order: response.order });
      setCart({});
    } catch (error: unknown) {
      setSubmitState({
        status: "error",
        message: getUserErrorMessage(error, MessageKey.RequestFailed, locale)
      });
    }
  };

  const refreshOrder = async () => {
    if (!tenantId || !branchId || !tableId || !submittedOrder) {
      return;
    }

    setRefreshState("refreshing");

    try {
      const response = await apiClient.getCustomerOrderSummary(tenantId, branchId, tableId, submittedOrder.id);

      setSubmitState({ status: "success", order: response.order });
      setRefreshState("idle");
    } catch {
      setRefreshState("error");
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
                <button className="button button--inline" type="button" onClick={() => addToCart(menu)}>
                  {t(MessageKey.QrAddDish)}
                </button>
              </article>
            ))}
          </div>
          <div className="customer-cart">
            <div className="customer-section-header">
              <h2>{t(MessageKey.QrCartTitle)}</h2>
              <span>{t(MessageKey.QrItems, { count: cartQuantity })}</span>
            </div>
            {cartItems.length === 0 ? (
              <p className="customer-muted">{t(MessageKey.QrCartEmpty)}</p>
            ) : (
              <div className="customer-cart-list">
                {cartItems.map((item) => (
                  <article className="customer-cart-row" key={item.menu.id}>
                    <div>
                      <strong>{item.menu.name}</strong>
                      <span>
                        {item.quantity} x {formatCurrency(item.menu.price)}
                      </span>
                    </div>
                    <div className="quantity-controls">
                      <button
                        aria-label={t(MessageKey.QrDecreaseDish, { name: item.menu.name })}
                        type="button"
                        onClick={() => decreaseCartItem(item.menu.id)}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        aria-label={t(MessageKey.QrIncreaseDish, { name: item.menu.name })}
                        type="button"
                        onClick={() => addToCart(item.menu)}
                      >
                        +
                      </button>
                      <button
                        aria-label={t(MessageKey.QrRemoveDish, { name: item.menu.name })}
                        type="button"
                        onClick={() => removeCartItem(item.menu.id)}
                      >
                        x
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="customer-total-row">
              <span>{t(MessageKey.QrSubtotal)}</span>
              <strong>{formatAmount(cartTotal)}</strong>
            </div>
            {submitState.status === "error" ? (
              <StateMessage title={t(MessageKey.QrOrderUnableToSubmit)} description={submitState.message} tone="error" />
            ) : null}
            <button
              className="button customer-submit"
              disabled={cartItems.length === 0 || submitState.status === "submitting"}
              type="button"
              onClick={() => void submitOrder()}
            >
              {submitState.status === "submitting" ? t(MessageKey.QrSubmittingOrder) : t(MessageKey.QrSubmitOrder)}
            </button>
          </div>
        </>
      ) : null}
      {submittedOrder ? (
        <div className="customer-order-summary">
          <StateMessage
            title={t(MessageKey.QrOrderCreatedTitle)}
            description={t(MessageKey.QrOrderCreatedDescription)}
            tone="success"
          />
          <div className="customer-section-header">
            <h2>{t(MessageKey.QrOrderSummaryTitle)}</h2>
            <button
              className="button button--inline button--ghost"
              disabled={refreshState === "refreshing"}
              type="button"
              onClick={() => void refreshOrder()}
            >
              {refreshState === "refreshing" ? t(MessageKey.QrOrderRefreshing) : t(MessageKey.QrOrderRefresh)}
            </button>
          </div>
          {refreshState === "error" ? (
            <StateMessage title={t(MessageKey.QrOrderUnableToRefresh)} description={t(MessageKey.RequestFailed)} tone="error" />
          ) : null}
          <dl className="qr-context">
            <div>
              <dt>{t(MessageKey.QrOrderReferenceLabel)}</dt>
              <dd>{t(MessageKey.QrOrderReference, { id: submittedOrder.id.slice(-6).toUpperCase() })}</dd>
            </div>
            <div>
              <dt>{t(MessageKey.QrOrderStatus)}</dt>
              <dd>{statusLabel(submittedOrder.status)}</dd>
            </div>
            <div>
              <dt>{t(MessageKey.QrOrderTotal)}</dt>
              <dd>{formatCurrency(submittedOrder.total)}</dd>
            </div>
          </dl>
          <h3>{t(MessageKey.QrOrderItems)}</h3>
          <div className="customer-cart-list">
            {submittedOrder.items.map((item) => (
              <article className="customer-cart-row" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {item.quantity} x {formatCurrency(item.unitPrice)}
                  </span>
                </div>
                <b>{formatCurrency(item.lineTotal)}</b>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
};
