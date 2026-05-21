import { Banknote, ReceiptText } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { StatusPill } from "../../../components/ui/StatusPill";
import type { OrderDetail, UpdateOrderStatusRequest } from "../../../lib/api/types";
import { formatDateTime } from "../../../lib/format/date";
import { useI18n } from "../../../lib/i18n/I18nContext";
import { MessageKey } from "../../../lib/i18n/messages";
import { getOrderStatusClassName } from "../../../lib/theme/status-colors";

type OrderActionPanelProps = {
  order: OrderDetail;
  statusOptions: UpdateOrderStatusRequest["status"][];
  updatingStatus?: UpdateOrderStatusRequest["status"] | null;
  confirmingPayment?: boolean;
  disabled?: boolean;
  onStatusUpdate: (status: UpdateOrderStatusRequest["status"]) => void;
  onRequestPayment: () => void;
};

const formatCurrency = (price: string | number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 2
  }).format(Number(price));
};

const getStatusButtonClassName = (status: UpdateOrderStatusRequest["status"]): string => {
  const classByStatus: Record<UpdateOrderStatusRequest["status"], string> = {
    CONFIRMED: "bg-info text-white hover:bg-info/90",
    PREPARING: "bg-warning text-yellow-950 hover:bg-warning/90",
    READY: "bg-success text-white hover:bg-success/90",
    SERVED: "bg-secondary text-secondary-foreground hover:bg-accent",
    CANCELLED: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
  };

  return classByStatus[status];
};

export const OrderActionPanel = ({
  order,
  statusOptions,
  updatingStatus = null,
  confirmingPayment = false,
  disabled = false,
  onStatusUpdate,
  onRequestPayment
}: OrderActionPanelProps) => {
  const { t } = useI18n();
  const isPaymentAvailable = order.status !== "PAID" && order.status !== "CANCELLED";

  const getOrderStatusLabel = (status: OrderDetail["status"] | UpdateOrderStatusRequest["status"]): string => {
    const labelByStatus: Record<OrderDetail["status"], MessageKey> = {
      PENDING: MessageKey.OrderStatusPending,
      CONFIRMED: MessageKey.OrderStatusConfirmed,
      PREPARING: MessageKey.OrderStatusPreparing,
      READY: MessageKey.OrderStatusReady,
      SERVED: MessageKey.OrderStatusServed,
      CANCELLED: MessageKey.OrderStatusCancelled,
      PAID: MessageKey.OrderStatusPaid
    };

    return t(labelByStatus[status]);
  };

  return (
    <section className="grid gap-6 rounded-md border border-border bg-card p-5 text-card-foreground shadow-panel">
      <div className="flex items-start justify-between gap-4 max-[780px]:grid">
        <div className="min-w-0">
          <h2 className="m-0 flex items-center gap-2 text-xl font-semibold">
            <ReceiptText className="h-5 w-5 flex-none text-primary" aria-hidden="true" />
            <span className="break-words">{t(MessageKey.OrdersDetailTitle, { tableName: order.tableName })}</span>
          </h2>
          <p className="mb-0 mt-2 break-words text-sm leading-normal text-muted-foreground">
            {order.branchName} &middot; {formatDateTime(order.createdAt)}
          </p>
        </div>
        <StatusPill className={getOrderStatusClassName(order.status)}>{getOrderStatusLabel(order.status)}</StatusPill>
      </div>

      <div className="grid gap-3">
        {order.items.map((item) => (
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-md border border-border bg-muted/20 p-4" key={item.id}>
            <div className="grid min-w-0 gap-2">
              <strong className="break-words text-lg">{item.menuName}</strong>
              <span className="text-sm text-muted-foreground">
                {item.quantity} x {formatCurrency(item.unitPrice)}
              </span>
            </div>
            <b className="whitespace-nowrap text-lg text-primary">{formatCurrency(item.lineTotal)}</b>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 text-xl font-extrabold">
        <span>{t(MessageKey.OrdersTotalAmount)}</span>
        <strong className="text-primary">{formatCurrency(order.total)}</strong>
      </div>

      {isPaymentAvailable ? (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-md border border-success/60 bg-success/10 p-4 max-[780px]:grid-cols-1">
          <div className="grid min-w-0 gap-2">
            <span className="text-xs font-extrabold uppercase text-muted-foreground">{t(MessageKey.NavPayments)}</span>
            <strong className="inline-flex items-center gap-2 break-words text-lg text-primary">
              <Banknote className="h-4 w-4 flex-none" aria-hidden="true" />
              {t(MessageKey.OrdersPaymentMethodCash)}
            </strong>
          </div>
          <Button
            type="button"
            className="mt-0 min-h-[54px] bg-primary px-6 text-primary-foreground max-[780px]:w-full"
            disabled={disabled || confirmingPayment || updatingStatus !== null}
            onClick={onRequestPayment}
          >
            {confirmingPayment ? t(MessageKey.OrdersConfirmingPayment) : t(MessageKey.OrdersConfirmPayment)}
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-3">
        {statusOptions.map((status) => (
          <Button
            type="button"
            className={`mt-0 min-h-[52px] ${getStatusButtonClassName(status)}`}
            disabled={disabled || confirmingPayment || updatingStatus !== null || order.status === status || order.status === "PAID"}
            key={status}
            onClick={() => onStatusUpdate(status)}
          >
            {updatingStatus === status ? t(MessageKey.Saving) : getOrderStatusLabel(status)}
          </Button>
        ))}
      </div>
    </section>
  );
};

