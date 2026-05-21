import { Button } from "../../../components/ui/Button";
import { StateMessage } from "../../../components/ui/StateMessage";
import type { OrderDetail } from "../../../lib/api/types";
import { useI18n } from "../../../lib/i18n/I18nContext";
import { MessageKey } from "../../../lib/i18n/messages";
import { OrderActionPanel } from "./OrderActionPanel";

type PaymentConfirmDialogProps = {
  order: OrderDetail;
  isSubmitting: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export const PaymentConfirmDialog = ({ order, isSubmitting, error, onCancel, onConfirm }: PaymentConfirmDialogProps) => {
  const { t } = useI18n();

  return (
    <div
      className="fixed inset-0 z-20 grid place-items-center bg-foreground/40 p-5"
      role="presentation"
      onMouseDown={() => {
        if (!isSubmitting) {
          onCancel();
        }
      }}
    >
      <section
        aria-labelledby="payment-confirm-title"
        aria-modal="true"
        className="grid max-h-[calc(100vh-40px)] w-[min(760px,100%)] gap-4 overflow-auto rounded-md border border-border bg-card p-5 text-card-foreground shadow-floating"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div>
          <p className="mb-1.5 mt-0 text-xs font-bold uppercase text-muted-foreground">{t(MessageKey.NavPayments)}</p>
          <h2 className="m-0 text-xl" id="payment-confirm-title">
            {t(MessageKey.OrdersPaymentModalTitle)}
          </h2>
          <p className="mb-0 mt-2 text-sm leading-normal text-muted-foreground">
            {t(MessageKey.OrdersPaymentModalDescription, { tableName: order.tableName })}
          </p>
        </div>

        <OrderActionPanel
          order={order}
          statusOptions={[]}
          confirmingPayment={isSubmitting}
          disabled
          onRequestPayment={() => undefined}
          onStatusUpdate={() => undefined}
        />

        {error ? <StateMessage title={t(MessageKey.OrdersUnableToConfirmPayment)} description={error} tone="error" /> : null}

        <div className="flex items-center justify-between gap-3 max-[780px]:flex-col max-[780px]:items-stretch">
          <Button
            type="button"
            className="mt-0 min-h-10 bg-secondary text-secondary-foreground hover:bg-accent max-[780px]:w-full"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            {t(MessageKey.Cancel)}
          </Button>
          <Button type="button" className="mt-0 min-h-10 max-[780px]:w-full" disabled={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? t(MessageKey.OrdersConfirmingPayment) : t(MessageKey.OrdersConfirmPayment)}
          </Button>
        </div>
      </section>
    </div>
  );
};
