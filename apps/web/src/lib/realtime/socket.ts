import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type { Order, OrderDetail } from "../api/types";

export const realtimeBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export const RealtimeEvent = {
  AdminJoinBranch: "admin.join_branch",
  CustomerJoinTable: "customer.join_table",
  ConnectionReady: "connection.ready",
  RoomJoined: "room.joined",
  OrderCreated: "order.created",
  OrderStatusUpdated: "order.status_updated"
} as const;

type ServerToClientEvents = {
  [RealtimeEvent.ConnectionReady]: (payload: { socketId: string }) => void;
  [RealtimeEvent.RoomJoined]: (payload: { room: string }) => void;
  [RealtimeEvent.OrderCreated]: (payload: { order: Order }) => void;
  [RealtimeEvent.OrderStatusUpdated]: (payload: { order: OrderDetail }) => void;
};

type ClientToServerEvents = {
  [RealtimeEvent.AdminJoinBranch]: (payload: { branchId: string }) => void;
  [RealtimeEvent.CustomerJoinTable]: (payload: { tenantId: string; branchId: string; tableId: string }) => void;
};

export type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export const createRealtimeSocket = (token?: string): RealtimeSocket => {
  return io(realtimeBaseUrl, {
    autoConnect: false,
    auth: token ? { token } : undefined,
    transports: ["websocket", "polling"]
  });
};

