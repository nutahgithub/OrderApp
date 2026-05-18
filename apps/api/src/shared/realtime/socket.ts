import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../../config/env.js";
import { findBranchByTenant } from "../../repositories/branch.repository.js";
import { findTableQrEntry } from "../../repositories/table.repository.js";
import { AppError } from "../errors/app-error.js";
import { ErrorCode } from "../errors/error-catalog.js";
import { logger } from "../logger/logger.js";
import { prisma } from "../prisma/client.js";
import { verifyAdminToken } from "../security/jwt.js";
import { RealtimeEvent } from "./events.js";
import type {
  AdminJoinBranchPayload,
  CustomerJoinTablePayload,
  OrderCreatedPayload,
  OrderStatusUpdatedPayload,
  PaymentCompletedPayload,
  RealtimeServer
} from "./events.js";
import { branchRoom, tableRoom, tenantRoom } from "./rooms.js";

let io: RealtimeServer | null = null;

type SocketAuth = {
  token?: unknown;
};

const readToken = (auth: SocketAuth): string | null => {
  return typeof auth.token === "string" && auth.token.trim().length > 0 ? auth.token : null;
};

export const initRealtimeServer = (httpServer: HttpServer): RealtimeServer => {
  io = new Server(httpServer, {
    cors: {
      origin: env.WEB_APP_URL,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.emit(RealtimeEvent.ConnectionReady, {
      socketId: socket.id
    });

    socket.on(RealtimeEvent.AdminJoinBranch, (payload: AdminJoinBranchPayload) => {
      void (async () => {
        const token = readToken(socket.handshake.auth as SocketAuth);

        if (!token) {
          socket.disconnect(true);
          return;
        }

        const auth = verifyAdminToken(token);
        const branch = await findBranchByTenant(prisma, {
          tenantId: auth.tenantId,
          branchId: payload.branchId
        });

        if (!branch) {
          throw new AppError(ErrorCode.BranchNotFound);
        }

        const room = branchRoom(auth.tenantId, payload.branchId);
        await socket.join(tenantRoom(auth.tenantId));
        await socket.join(room);
        socket.emit(RealtimeEvent.RoomJoined, { room });
      })().catch((error: unknown) => {
        logger.warn("socket_admin_join_failed", {
          socketId: socket.id,
          error: error instanceof Error ? error.message : "unknown"
        });
        socket.disconnect(true);
      });
    });

    socket.on(RealtimeEvent.CustomerJoinTable, (payload: CustomerJoinTablePayload) => {
      void (async () => {
        const table = await findTableQrEntry(prisma, payload);

        if (!table) {
          throw new AppError(ErrorCode.TableNotFound);
        }

        const room = tableRoom(payload.tenantId, payload.branchId, payload.tableId);
        await socket.join(room);
        socket.emit(RealtimeEvent.RoomJoined, { room });
      })().catch((error: unknown) => {
        logger.warn("socket_customer_join_failed", {
          socketId: socket.id,
          error: error instanceof Error ? error.message : "unknown"
        });
        socket.disconnect(true);
      });
    });
  });

  return io;
};

export const emitOrderCreated = (payload: OrderCreatedPayload): void => {
  if (!io) {
    return;
  }

  io.to(branchRoom(payload.order.tenantId, payload.order.branchId))
    .to(tableRoom(payload.order.tenantId, payload.order.branchId, payload.order.tableId))
    .emit(RealtimeEvent.OrderCreated, payload);
};

export const emitOrderStatusUpdated = (payload: OrderStatusUpdatedPayload): void => {
  if (!io) {
    return;
  }

  io.to(branchRoom(payload.order.tenantId, payload.order.branchId))
    .to(tableRoom(payload.order.tenantId, payload.order.branchId, payload.order.tableId))
    .emit(RealtimeEvent.OrderStatusUpdated, payload);
};

export const emitPaymentCompleted = (payload: PaymentCompletedPayload): void => {
  if (!io) {
    return;
  }

  io.to(branchRoom(payload.order.tenantId, payload.order.branchId))
    .to(tableRoom(payload.order.tenantId, payload.order.branchId, payload.order.tableId))
    .emit(RealtimeEvent.PaymentCompleted, payload);
};
