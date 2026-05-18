import type { OrderStatus, TableStatus } from "../../lib/api/types";
import type { MessageKey } from "../../lib/i18n/messages";

export const getTableStatusLabelKey = (status: TableStatus): MessageKey => {
  const keyByStatus: Record<TableStatus, MessageKey> = {
    AVAILABLE: "status.available",
    OCCUPIED: "status.occupied",
    DISABLED: "status.disabled"
  };

  return keyByStatus[status];
};

export const getOrderStatusLabelKey = (status: OrderStatus | "ALL"): MessageKey => {
  const keyByStatus: Record<OrderStatus | "ALL", MessageKey> = {
    ALL: "orders.statusAll",
    PENDING: "orders.status.pending",
    CONFIRMED: "orders.status.confirmed",
    PREPARING: "orders.status.preparing",
    READY: "orders.status.ready",
    SERVED: "orders.status.served",
    CANCELLED: "orders.status.cancelled",
    PAID: "orders.status.paid"
  };

  return keyByStatus[status];
};
