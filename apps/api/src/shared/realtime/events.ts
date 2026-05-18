import type { Server } from "socket.io";
import type { OrderDetailDto, OrderDto } from "../../types/order.types.js";
import type { PaymentDto } from "../../types/payment.types.js";

export const RealtimeEvent = {
  AdminJoinBranch: "admin.join_branch",
  CustomerJoinTable: "customer.join_table",
  ConnectionReady: "connection.ready",
  RoomJoined: "room.joined",
  OrderCreated: "order.created",
  OrderStatusUpdated: "order.status_updated",
  PaymentCompleted: "payment.completed"
} as const;

export type RealtimeEvent = (typeof RealtimeEvent)[keyof typeof RealtimeEvent];

export type AdminJoinBranchPayload = {
  branchId: string;
};

export type CustomerJoinTablePayload = {
  tenantId: string;
  branchId: string;
  tableId: string;
};

export type OrderCreatedPayload = {
  order: OrderDto;
};

export type OrderStatusUpdatedPayload = {
  order: OrderDetailDto;
};

export type PaymentCompletedPayload = {
  order: OrderDetailDto;
  payment: PaymentDto;
};

export type ServerToClientEvents = {
  [RealtimeEvent.ConnectionReady]: (payload: { socketId: string }) => void;
  [RealtimeEvent.RoomJoined]: (payload: { room: string }) => void;
  [RealtimeEvent.OrderCreated]: (payload: OrderCreatedPayload) => void;
  [RealtimeEvent.OrderStatusUpdated]: (payload: OrderStatusUpdatedPayload) => void;
  [RealtimeEvent.PaymentCompleted]: (payload: PaymentCompletedPayload) => void;
};

export type ClientToServerEvents = {
  [RealtimeEvent.AdminJoinBranch]: (payload: AdminJoinBranchPayload) => void;
  [RealtimeEvent.CustomerJoinTable]: (payload: CustomerJoinTablePayload) => void;
};

export type RealtimeServer = Server<ClientToServerEvents, ServerToClientEvents>;
