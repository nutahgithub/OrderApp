import type { OrderStatus, TableStatus } from "../api/types";

export const getTableStatusClassName = (status: TableStatus): string => {
  const classByStatus: Record<TableStatus, string> = {
    AVAILABLE: "bg-emerald-100 text-emerald-950",
    OCCUPIED: "bg-amber-100 text-amber-950",
    DISABLED: "bg-red-100 text-red-950"
  };

  return classByStatus[status];
};

export const getOrderStatusClassName = (status: OrderStatus): string => {
  const classByStatus: Record<OrderStatus, string> = {
    PENDING: "bg-amber-100 text-amber-950",
    CONFIRMED: "bg-blue-100 text-blue-950",
    PREPARING: "bg-blue-100 text-blue-950",
    READY: "bg-emerald-100 text-emerald-950",
    SERVED: "bg-slate-100 text-slate-700",
    CANCELLED: "bg-red-100 text-red-950",
    PAID: "bg-slate-100 text-slate-700"
  };

  return classByStatus[status];
};

export const statusPillClassName =
  "inline-flex min-h-6 flex-none items-center justify-center rounded-full px-2 py-[3px] text-xs font-bold";

export const getRealtimeConnectionClassName = (state: "idle" | "connecting" | "connected" | "fallback"): string => {
  const classByState: Record<typeof state, string> = {
    idle: "hidden",
    connecting: "bg-slate-100 text-slate-600",
    connected: "bg-emerald-100 text-emerald-950",
    fallback: "bg-red-100 text-red-950"
  };

  return classByState[state];
};
