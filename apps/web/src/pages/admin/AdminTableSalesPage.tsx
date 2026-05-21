import { useCallback, useEffect, useMemo, useState } from "react";
import { Minus, Plus, RefreshCw, Table2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Panel } from "../../components/ui/Panel";
import { SelectField } from "../../components/ui/SelectField";
import { StateMessage } from "../../components/ui/StateMessage";
import { StatusPill } from "../../components/ui/StatusPill";
import { useAuth } from "../../features/auth/AuthContext";
import { branchesApi } from "../../features/branches/api";
import { qrApi } from "../../features/customer-order/api";
import { menusApi } from "../../features/menus/api";
import { OrderActionPanel } from "../../features/orders/components/OrderActionPanel";
import { PaymentConfirmDialog } from "../../features/orders/components/PaymentConfirmDialog";
import { ordersApi } from "../../features/orders/api";
import { tablesApi } from "../../features/tables/api";
import type { Branch, Menu, Order, OrderDetail, OrderStatus, RestaurantTable, UpdateOrderStatusRequest } from "../../lib/api/types";
import { toDateInputValue } from "../../lib/format/date";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";
import { cn } from "../../lib/utils/cn";

type LoadState = "idle" | "loading" | "success" | "error";
type Cart = Record<string, number>;

type MenuPickerCardProps = {
  menu: Menu;
  quantity: number;
  disabled?: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
};

const activeOrderStatuses: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED"];
const operationStatusOptions: UpdateOrderStatusRequest["status"][] = ["CONFIRMED", "PREPARING", "READY", "SERVED", "CANCELLED"];

const formatCurrency = (price: string | number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 2
  }).format(Number(price));
};

const normalizeMenuSearchText = (value: string): string => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
};

const MenuPickerCard = ({ menu, quantity, disabled = false, onDecrease, onIncrease }: MenuPickerCardProps) => {
  return (
    <article className="grid gap-2.5 rounded-md border border-border bg-card p-2.5 shadow-sm">
      <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3">
        <div
          className="grid h-16 w-16 place-items-center overflow-hidden rounded-md border border-border bg-muted text-lg font-extrabold text-muted-foreground"
          aria-label={menu.imageUrl ? menu.name : "No image"}
        >
          {menu.imageUrl ? (
            <img className="h-full w-full object-cover" src={menu.imageUrl} alt={menu.name} loading="lazy" />
          ) : (
            <span>{menu.name.trim()[0]?.toUpperCase() ?? "M"}</span>
          )}
        </div>
        <div className="grid min-w-0 gap-1">
          <strong className="break-words text-sm leading-snug">{menu.name}</strong>
          <span className="text-sm font-bold text-primary">{formatCurrency(menu.price)}</span>
        </div>
      </div>
      <div className="ml-auto inline-grid grid-cols-[36px_32px_36px] items-center gap-1">
        <Button
          type="button"
          className="mt-0 min-h-9 w-9 bg-secondary p-0 text-secondary-foreground hover:bg-accent"
          disabled={quantity === 0 || disabled}
          onClick={onDecrease}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </Button>
        <span className="text-center text-sm font-extrabold">{quantity}</span>
        <Button
          type="button"
          className="mt-0 min-h-9 w-9 bg-secondary p-0 text-secondary-foreground hover:bg-accent"
          disabled={disabled}
          onClick={onIncrease}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
};

export const AdminTableSalesPage = () => {
  const { admin, token, logout } = useAuth();
  const { locale, t } = useI18n();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<OrderDetail | null>(null);
  const [cart, setCart] = useState<Cart>({});
  const [menuSearch, setMenuSearch] = useState("");
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [detailState, setDetailState] = useState<LoadState>("idle");
  const [actionState, setActionState] = useState<LoadState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const today = toDateInputValue(new Date());

  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId) ?? null;
  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? null;
  const activeOrderByTableId = useMemo(() => {
    return activeOrders.reduce<Record<string, Order>>((ordersByTableId, order) => {
      if (!ordersByTableId[order.tableId]) {
        ordersByTableId[order.tableId] = order;
      }

      return ordersByTableId;
    }, {});
  }, [activeOrders]);
  const selectedTableOpenOrder = selectedTableId ? activeOrderByTableId[selectedTableId] ?? null : null;
  const orderedTables = useMemo(() => {
    return [...tables].sort((firstTable, secondTable) => {
      return new Date(firstTable.createdAt).getTime() - new Date(secondTable.createdAt).getTime();
    });
  }, [tables]);
  const cartItems = menus
    .map((menu) => ({
      menu,
      quantity: cart[menu.id] ?? 0
    }))
    .filter((item) => item.quantity > 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + Number(item.menu.price) * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const activeMenus = menus.filter((menu) => menu.isActive);
  const normalizedMenuSearch = normalizeMenuSearchText(menuSearch.trim());
  const filteredMenus = activeMenus.filter((menu) => {
    return normalizedMenuSearch === "" || normalizeMenuSearchText(menu.name).includes(normalizedMenuSearch);
  });
  const selectedOrderCanEdit = selectedOrder?.status !== "PAID" && selectedOrder?.status !== "CANCELLED";

  const loadBranches = useCallback(async () => {
    if (!token) {
      logout();
      return;
    }

    try {
      const response = await branchesApi.list(token);
      setBranches(response.branches);
      setSelectedBranchId((currentBranchId) => currentBranchId || response.branches[0]?.id || "");
    } catch (error: unknown) {
      setErrorMessage(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    }
  }, [locale, logout, token]);

  const loadWorkspace = useCallback(async () => {
    if (!token || !selectedBranchId) {
      return;
    }

    setLoadState("loading");
    setErrorMessage(null);

    try {
      const [tablesResponse, menusResponse, ordersResponse] = await Promise.all([
        tablesApi.list(token, selectedBranchId),
        menusApi.list(token),
        ordersApi.list(token, {
          branchId: selectedBranchId,
          startDate: today,
          endDate: today,
          page: 1,
          pageSize: 100
        })
      ]);
      const nextActiveOrders = ordersResponse.orders.filter((order) => activeOrderStatuses.includes(order.status));

      setTables(tablesResponse.tables);
      setMenus(menusResponse.menus);
      setActiveOrders(nextActiveOrders);
      setSelectedTableId((currentTableId) => {
        if (tablesResponse.tables.some((table) => table.id === currentTableId)) {
          return currentTableId;
        }

        return tablesResponse.tables[0]?.id ?? "";
      });
      setLoadState("success");
    } catch (error: unknown) {
      setLoadState("error");
      setErrorMessage(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    }
  }, [locale, selectedBranchId, today, token]);

  const loadOrderDetail = useCallback(
    async (orderId: string) => {
      if (!token || !orderId) {
        setSelectedOrder(null);
        setDetailState("idle");
        return;
      }

      setDetailState("loading");

      try {
        const response = await ordersApi.get(token, orderId);
        setSelectedOrder(response.order);
        setDetailState("success");
      } catch (error: unknown) {
        setDetailState("error");
        setErrorMessage(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
      }
    },
    [locale, token]
  );

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    setCart({});
    setMessage(null);
    setErrorMessage(null);
    if (selectedTableOpenOrder) {
      void loadOrderDetail(selectedTableOpenOrder.id);
    } else {
      setSelectedOrder(null);
      setDetailState("idle");
    }
  }, [loadOrderDetail, selectedTableId, selectedTableOpenOrder]);

  useEffect(() => {
    if (!selectedOrder || !selectedTableOpenOrder || !selectedOrderCanEdit) {
      return;
    }

    setCart(
      selectedOrder.items.reduce<Cart>((nextCart, item) => {
        nextCart[item.menuId] = item.quantity;
        return nextCart;
      }, {})
    );
  }, [selectedOrder, selectedOrderCanEdit, selectedTableOpenOrder]);

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

  const refreshAll = async () => {
    await loadWorkspace();
    if (selectedTableOpenOrder) {
      await loadOrderDetail(selectedTableOpenOrder.id);
    }
  };

  const createOrder = async () => {
    if (!admin || !selectedBranch || !selectedTable || cartItems.length === 0 || selectedTableOpenOrder) {
      return;
    }

    setActionState("loading");
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = await qrApi.createOrder(admin.tenantId, selectedBranch.id, selectedTable.id, {
        items: cartItems.map((item) => ({
          menuId: item.menu.id,
          quantity: item.quantity
        }))
      });

      setCart({});
      setSelectedOrder(response.order);
      setSelectedTableId(response.order.tableId);
      setActiveOrders((currentOrders) => [response.order, ...currentOrders.filter((order) => order.id !== response.order.id)]);
      setMessage(t(MessageKey.TableSalesOrderCreated));
      setActionState("success");
    } catch (error: unknown) {
      setActionState("error");
      setErrorMessage(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    }
  };

  const updateOrderItems = async () => {
    if (!token || !selectedOrder || cartItems.length === 0) {
      return;
    }

    setActionState("loading");
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = await ordersApi.updateItems(token, selectedOrder.id, {
        items: cartItems.map((item) => ({
          menuId: item.menu.id,
          quantity: item.quantity
        }))
      });

      setSelectedOrder(response.order);
      setActiveOrders((currentOrders) => [response.order, ...currentOrders.filter((order) => order.id !== response.order.id)]);
      setMessage(t(MessageKey.TableSalesOrderUpdated));
      setActionState("success");
    } catch (error: unknown) {
      setActionState("error");
      setErrorMessage(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    }
  };

  const updateOrderStatus = async (status: UpdateOrderStatusRequest["status"]) => {
    if (!token || !selectedOrder) {
      logout();
      return;
    }

    setActionState("loading");
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = await ordersApi.updateStatus(token, selectedOrder.id, { status });
      setSelectedOrder(response.order);
      setActiveOrders((currentOrders) => {
        if (!activeOrderStatuses.includes(response.order.status)) {
          return currentOrders.filter((order) => order.id !== response.order.id);
        }

        return [response.order, ...currentOrders.filter((order) => order.id !== response.order.id)];
      });
      setMessage(t(MessageKey.OrdersStatusUpdated));
      setActionState("success");
    } catch (error: unknown) {
      setActionState("error");
      setErrorMessage(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    }
  };

  const confirmPayment = async () => {
    if (!token || !pendingPaymentOrder) {
      logout();
      return;
    }

    setActionState("loading");
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = await ordersApi.confirmPayment(token, pendingPaymentOrder.id, {
        amount: pendingPaymentOrder.total,
        method: "CASH"
      });
      setSelectedOrder(response.order);
      setPendingPaymentOrder(null);
      setActiveOrders((currentOrders) => currentOrders.filter((order) => order.id !== response.order.id));
      setMessage(t(MessageKey.OrdersPaymentCompleted));
      setActionState("success");
    } catch (error: unknown) {
      setActionState("error");
      setErrorMessage(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    }
  };

  return (
    <section className="grid gap-5">
      <PageHeader
        eyebrow={t(MessageKey.TableSalesEyebrow)}
        title={t(MessageKey.TableSalesTitle)}
        subtitle={t(MessageKey.TableSalesSubtitle)}
        actions={
          <Button type="button" className="mt-0 bg-secondary text-secondary-foreground hover:bg-accent" onClick={() => void refreshAll()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t(MessageKey.Refresh)}
          </Button>
        }
      />

      <Panel className="grid grid-cols-[minmax(0,320px)_auto] items-end gap-3 max-[780px]:grid-cols-1">
        <SelectField
          label={t(MessageKey.Branch)}
          options={branches.map((branch) => ({ label: branch.name, value: branch.id }))}
          value={selectedBranchId}
          disabled={branches.length === 0}
          onValueChange={(value) => {
            setSelectedBranchId(value);
            setSelectedTableId("");
            setSelectedOrder(null);
            setCart({});
            setMenuSearch("");
          }}
        />
        <div className="text-[13px] font-bold text-muted-foreground">
          {loadState === "loading" ? t(MessageKey.TableSalesLoadingTables) : null}
          {loadState === "success" ? t(MessageKey.OrdersTotal, { count: activeOrders.length }) : null}
        </div>
      </Panel>

      {errorMessage && actionState !== "error" ? <StateMessage title={t(MessageKey.RequestFailed)} description={errorMessage} tone="error" /> : null}

      <section className="grid grid-cols-[minmax(420px,0.58fr)_minmax(0,1.42fr)] items-start gap-4 max-[1180px]:grid-cols-1">
        <Panel className="grid gap-3 min-[981px]:sticky min-[981px]:top-7">
          <div>
            <h2 className="m-0 text-base">{t(MessageKey.TableSalesTablesTitle)}</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">{selectedBranch?.name ?? t(MessageKey.Branch)}</p>
          </div>

          {loadState === "loading" ? <StateMessage title={t(MessageKey.TableSalesLoadingTables)} /> : null}
          {tables.length === 0 && loadState === "success" ? (
            <StateMessage title={t(MessageKey.TablesEmptyTitle)} description={t(MessageKey.TablesEmptyDescription)} />
          ) : null}
          {tables.length > 0 ? (
            <div className="grid grid-cols-3 gap-2.5 max-[1280px]:grid-cols-2 max-[520px]:grid-cols-1">
              {orderedTables.map((table) => {
                const openOrder = activeOrderByTableId[table.id] ?? null;
                const isSelected = table.id === selectedTableId;

                return (
                  <button
                    type="button"
                    className={cn(
                      "grid min-h-[118px] gap-2 rounded-md border border-border bg-muted/45 p-3 text-left text-foreground transition hover:border-ring hover:bg-accent",
                      isSelected && "border-ring bg-accent shadow-panel"
                    )}
                    key={table.id}
                    onClick={() => {
                      setSelectedTableId(table.id);
                      setMenuSearch("");
                    }}
                  >
                    <span className="flex items-start gap-2">
                      <span
                        className={cn(
                          "grid h-9 w-9 flex-none place-items-center rounded-md border",
                          openOrder ? "border-warning/60 bg-warning/20 text-yellow-950" : "border-success/60 bg-success/10 text-primary"
                        )}
                      >
                        <Table2 className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <strong className="min-w-0 break-words text-lg leading-tight">{table.name}</strong>
                    </span>
                    <StatusPill className={openOrder ? "bg-warning text-yellow-950" : "bg-emerald-100 text-emerald-950"}>
                      {openOrder ? t(MessageKey.TableSalesInUseUnpaid) : t(MessageKey.TableSalesEmptyTable)}
                    </StatusPill>
                    {openOrder ? <span className="text-[13px] font-bold text-primary">{formatCurrency(openOrder.total)}</span> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </Panel>

        <section className="grid gap-4">
          {!selectedTable ? <StateMessage title={t(MessageKey.TableSalesSelectTable)} /> : null}

          {selectedTable ? (
            <Panel className="grid gap-4">
              <div className="flex items-start justify-between gap-4 max-[780px]:grid">
                <div>
                  <p className="mb-1.5 mt-0 text-xs font-bold uppercase text-muted-foreground">
                    {selectedTableOpenOrder ? t(MessageKey.TableSalesOpenOrder) : t(MessageKey.TableSalesNewOrder)}
                  </p>
                  <h2 className="m-0 text-xl">{selectedTable.name}</h2>
                </div>
                <StatusPill className={selectedTableOpenOrder ? "bg-warning text-yellow-950" : "bg-emerald-100 text-emerald-950"}>
                  {selectedTableOpenOrder ? t(MessageKey.TableSalesInUseUnpaid) : t(MessageKey.TableSalesEmptyTable)}
                </StatusPill>
              </div>

              {selectedTableOpenOrder ? (
                <>
                  {detailState === "loading" ? <StateMessage title={t(MessageKey.OrdersLoadingDetail)} /> : null}
                  {selectedOrder ? (
                    <>
                      <OrderActionPanel
                        order={selectedOrder}
                        statusOptions={operationStatusOptions}
                        disabled={actionState === "loading"}
                        confirmingPayment={actionState === "loading" && pendingPaymentOrder?.id === selectedOrder.id}
                        onStatusUpdate={(status) => void updateOrderStatus(status)}
                        onRequestPayment={() => {
                          setMessage(null);
                          setErrorMessage(null);
                          setPendingPaymentOrder(selectedOrder);
                        }}
                      />
                      {selectedOrderCanEdit ? (
                        <section className="grid gap-3 rounded-md border border-border bg-muted/30 p-4">
                          <div className="flex items-center justify-between gap-3 max-[780px]:grid">
                            <div>
                              <h3 className="m-0 text-base">{t(MessageKey.TableSalesEditOrderTitle)}</h3>
                              <p className="mb-0 mt-1 text-[13px] text-muted-foreground">{t(MessageKey.TableSalesMenuTitle)}</p>
                            </div>
                            <strong className="text-primary">{formatCurrency(cartTotal)}</strong>
                          </div>
                          <Input
                            label={t(MessageKey.TableSalesMenuSearchLabel)}
                            placeholder={t(MessageKey.TableSalesMenuSearchPlaceholder)}
                            type="search"
                            value={menuSearch}
                            onChange={(event) => setMenuSearch(event.target.value)}
                          />
                          {activeMenus.length > 0 && filteredMenus.length === 0 ? (
                            <StateMessage title={t(MessageKey.TableSalesNoMenuSearchResults)} />
                          ) : null}
                          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2.5">
                            {filteredMenus.map((menu) => (
                              <MenuPickerCard
                                disabled={actionState === "loading"}
                                key={menu.id}
                                menu={menu}
                                quantity={cart[menu.id] ?? 0}
                                onDecrease={() => updateCart(menu.id, -1)}
                                onIncrease={() => updateCart(menu.id, 1)}
                              />
                            ))}
                          </div>
                          <Button
                            type="button"
                            className="mt-0 min-h-12"
                            disabled={cartItems.length === 0 || actionState === "loading"}
                            onClick={() => void updateOrderItems()}
                          >
                            {actionState === "loading" ? t(MessageKey.TableSalesSavingOrderChanges) : t(MessageKey.TableSalesSaveOrderChanges)}
                          </Button>
                        </section>
                      ) : null}
                    </>
                  ) : null}
                </>
              ) : (
                <section className="grid grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] items-start gap-4 max-[1280px]:grid-cols-1">
                  <div className="grid gap-3">
                    <h3 className="m-0 text-base">{t(MessageKey.TableSalesMenuTitle)}</h3>
                    {loadState === "loading" ? <StateMessage title={t(MessageKey.TableSalesLoadingMenus)} /> : null}
                    {activeMenus.length === 0 && loadState === "success" ? (
                      <StateMessage title={t(MessageKey.MenusEmptyTitle)} description={t(MessageKey.MenusEmptyDescription)} />
                    ) : null}
                    {activeMenus.length > 0 ? (
                      <Input
                        label={t(MessageKey.TableSalesMenuSearchLabel)}
                        placeholder={t(MessageKey.TableSalesMenuSearchPlaceholder)}
                        type="search"
                        value={menuSearch}
                        onChange={(event) => setMenuSearch(event.target.value)}
                      />
                    ) : null}
                    {activeMenus.length > 0 && filteredMenus.length === 0 ? (
                      <StateMessage title={t(MessageKey.TableSalesNoMenuSearchResults)} />
                    ) : null}
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2.5">
                      {filteredMenus.map((menu) => (
                        <MenuPickerCard
                          key={menu.id}
                          menu={menu}
                          quantity={cart[menu.id] ?? 0}
                          onDecrease={() => updateCart(menu.id, -1)}
                          onIncrease={() => updateCart(menu.id, 1)}
                        />
                      ))}
                    </div>
                  </div>

                  <Panel className="grid gap-3 self-start bg-muted/35 shadow-none">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="m-0 text-base">{t(MessageKey.TableSalesCartTitle)}</h3>
                      <span className="text-[13px] font-bold text-muted-foreground">{t(MessageKey.QrItems, { count: cartCount })}</span>
                    </div>
                    {cartItems.length === 0 ? <StateMessage title={t(MessageKey.QrCartEmpty)} /> : null}
                    {cartItems.map((item) => (
                      <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0" key={item.menu.id}>
                        <span className="grid min-w-0 gap-1">
                          <strong className="break-words">{item.menu.name}</strong>
                          <small className="text-muted-foreground">
                            {item.quantity} x {formatCurrency(item.menu.price)}
                          </small>
                        </span>
                        <b className="whitespace-nowrap text-primary">{formatCurrency(Number(item.menu.price) * item.quantity)}</b>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-3 pt-2 font-extrabold">
                      <span>{t(MessageKey.QrSubtotal)}</span>
                      <strong className="text-xl text-primary">{formatCurrency(cartTotal)}</strong>
                    </div>
                    <Button
                      type="button"
                      className="mt-0 min-h-12"
                      disabled={cartItems.length === 0 || actionState === "loading"}
                      onClick={() => void createOrder()}
                    >
                      {actionState === "loading" ? t(MessageKey.TableSalesCreatingOrder) : t(MessageKey.TableSalesCreateOrder)}
                    </Button>
                  </Panel>
                </section>
              )}

              {message ? <StateMessage title={message} tone="success" /> : null}
              {actionState === "error" && errorMessage ? (
                <StateMessage
                  title={selectedTableOpenOrder ? t(MessageKey.TableSalesUnableToUpdateOrder) : t(MessageKey.TableSalesUnableToCreateOrder)}
                  description={errorMessage}
                  tone="error"
                />
              ) : null}
            </Panel>
          ) : null}
        </section>
      </section>
      {pendingPaymentOrder ? (
        <PaymentConfirmDialog
          order={pendingPaymentOrder}
          isSubmitting={actionState === "loading"}
          error={actionState === "error" ? errorMessage : null}
          onCancel={() => setPendingPaymentOrder(null)}
          onConfirm={() => void confirmPayment()}
        />
      ) : null}
    </section>
  );
};
