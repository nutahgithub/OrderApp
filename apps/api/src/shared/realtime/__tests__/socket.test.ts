import type { Server as HttpServer } from "node:http";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findBranchByTenant } from "../../../repositories/branch.repository.js";
import { findTableQrEntry } from "../../../repositories/table.repository.js";
import { verifyAdminToken } from "../../security/jwt.js";
import { RealtimeEvent } from "../events.js";
import type { AdminJoinBranchPayload, CustomerJoinTablePayload } from "../events.js";
import { branchRoom, tableRoom, tenantRoom } from "../rooms.js";
import { emitOrderCreated, emitOrderStatusUpdated, emitPaymentCompleted, initRealtimeServer } from "../socket.js";

type ClientEventPayloads = {
  [RealtimeEvent.AdminJoinBranch]: AdminJoinBranchPayload;
  [RealtimeEvent.CustomerJoinTable]: CustomerJoinTablePayload;
};

type ClientEventHandler<EventName extends keyof ClientEventPayloads> = (
  payload: ClientEventPayloads[EventName]
) => void;

type FakeSocket = {
  id: string;
  handshake: {
    auth: {
      token?: string;
    };
  };
  handlers: {
    [EventName in keyof ClientEventPayloads]?: ClientEventHandler<EventName>;
  };
  emit: Mock;
  on: <EventName extends keyof ClientEventPayloads>(
    event: EventName,
    handler: ClientEventHandler<EventName>
  ) => void;
  join: Mock;
  disconnect: Mock;
};

type FakeRealtimeServer = {
  connectionHandler?: (socket: FakeSocket) => void;
  emittedRooms: string[];
  emittedEvents: Array<{
    event: string;
    payload: unknown;
  }>;
  on: Mock;
  to: Mock;
  emit: Mock;
};

const realtimeMock = vi.hoisted(() => {
  const server: FakeRealtimeServer = {
    emittedRooms: [],
    emittedEvents: [],
    on: vi.fn((event: string, handler: (socket: FakeSocket) => void) => {
      if (event === "connection") {
        server.connectionHandler = handler;
      }
      return server;
    }),
    to: vi.fn((room: string) => {
      server.emittedRooms.push(room);
      return server;
    }),
    emit: vi.fn((event: string, payload: unknown) => {
      server.emittedEvents.push({ event, payload });
      return true;
    })
  };

  return {
    server,
    Server: vi.fn(() => server)
  };
});

vi.mock("socket.io", () => ({
  Server: realtimeMock.Server
}));

vi.mock("../../../config/env.js", () => ({
  env: {
    WEB_APP_URL: "http://localhost:5173"
  }
}));

vi.mock("../../../repositories/branch.repository.js", () => ({
  findBranchByTenant: vi.fn()
}));

vi.mock("../../../repositories/table.repository.js", () => ({
  findTableQrEntry: vi.fn()
}));

vi.mock("../../prisma/client.js", () => ({
  prisma: {}
}));

vi.mock("../../security/jwt.js", () => ({
  verifyAdminToken: vi.fn()
}));

vi.mock("../../logger/logger.js", () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn()
  }
}));

const waitForSocketHandler = async (): Promise<void> => {
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
};

const createSocket = (token?: string): FakeSocket => {
  const socket: FakeSocket = {
    id: "socket-1",
    handshake: {
      auth: token ? { token } : {}
    },
    handlers: {},
    emit: vi.fn(),
    on: vi.fn(<EventName extends keyof ClientEventPayloads>(
      event: EventName,
      handler: ClientEventHandler<EventName>
    ) => {
      if (event === RealtimeEvent.AdminJoinBranch) {
        socket.handlers[RealtimeEvent.AdminJoinBranch] =
          handler as ClientEventHandler<typeof RealtimeEvent.AdminJoinBranch>;
        return;
      }

      socket.handlers[RealtimeEvent.CustomerJoinTable] =
        handler as ClientEventHandler<typeof RealtimeEvent.CustomerJoinTable>;
    }),
    join: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn()
  };

  return socket;
};

const connectSocket = (socket: FakeSocket): void => {
  initRealtimeServer({} as HttpServer);
  realtimeMock.server.connectionHandler?.(socket);
};

describe("realtime socket tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    realtimeMock.server.connectionHandler = undefined;
    realtimeMock.server.emittedRooms = [];
    realtimeMock.server.emittedEvents = [];
  });

  it("joins an admin only to the authenticated tenant and requested branch room", async () => {
    const socket = createSocket("admin-token");
    vi.mocked(verifyAdminToken).mockReturnValue({
      sub: "admin-1",
      tenantId: "tenant-a",
      role: "MANAGER",
      exp: 1_780_000_000
    });
    vi.mocked(findBranchByTenant).mockResolvedValue({
      id: "branch-a",
      tenantId: "tenant-a",
      name: "Branch A",
      createdAt: new Date("2026-05-13T00:00:00.000Z"),
      updatedAt: new Date("2026-05-13T00:00:00.000Z")
    });

    connectSocket(socket);
    socket.handlers[RealtimeEvent.AdminJoinBranch]?.({ branchId: "branch-a" });
    await waitForSocketHandler();

    expect(findBranchByTenant).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-a",
      branchId: "branch-a"
    });
    expect(socket.join).toHaveBeenCalledWith(tenantRoom("tenant-a"));
    expect(socket.join).toHaveBeenCalledWith(branchRoom("tenant-a", "branch-a"));
    expect(socket.join).not.toHaveBeenCalledWith(branchRoom("tenant-b", "branch-a"));
    expect(socket.emit).toHaveBeenCalledWith(RealtimeEvent.RoomJoined, {
      room: branchRoom("tenant-a", "branch-a")
    });
    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it("disconnects an admin trying to join a branch outside the authenticated tenant", async () => {
    const socket = createSocket("admin-token");
    vi.mocked(verifyAdminToken).mockReturnValue({
      sub: "admin-1",
      tenantId: "tenant-a",
      role: "MANAGER",
      exp: 1_780_000_000
    });
    vi.mocked(findBranchByTenant).mockResolvedValue(null);

    connectSocket(socket);
    socket.handlers[RealtimeEvent.AdminJoinBranch]?.({ branchId: "branch-b" });
    await waitForSocketHandler();

    expect(findBranchByTenant).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-a",
      branchId: "branch-b"
    });
    expect(socket.join).not.toHaveBeenCalled();
    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });

  it("joins a customer only when tenant, branch, and table match", async () => {
    const socket = createSocket();
    vi.mocked(findTableQrEntry).mockResolvedValue({
      id: "table-a",
      tenantId: "tenant-a",
      branchId: "branch-a",
      name: "Table A",
      status: "AVAILABLE",
      createdAt: new Date("2026-05-13T00:00:00.000Z"),
      updatedAt: new Date("2026-05-13T00:00:00.000Z"),
      branch: {
        id: "branch-a",
        name: "Branch A"
      }
    });

    connectSocket(socket);
    socket.handlers[RealtimeEvent.CustomerJoinTable]?.({
      tenantId: "tenant-a",
      branchId: "branch-a",
      tableId: "table-a"
    });
    await waitForSocketHandler();

    expect(findTableQrEntry).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-a",
      branchId: "branch-a",
      tableId: "table-a"
    });
    expect(socket.join).toHaveBeenCalledWith(tableRoom("tenant-a", "branch-a", "table-a"));
    expect(socket.join).not.toHaveBeenCalledWith(tableRoom("tenant-b", "branch-a", "table-a"));
    expect(socket.emit).toHaveBeenCalledWith(RealtimeEvent.RoomJoined, {
      room: tableRoom("tenant-a", "branch-a", "table-a")
    });
  });

  it("disconnects a customer when QR tenant, branch, and table context is invalid", async () => {
    const socket = createSocket();
    vi.mocked(findTableQrEntry).mockResolvedValue(null);

    connectSocket(socket);
    socket.handlers[RealtimeEvent.CustomerJoinTable]?.({
      tenantId: "tenant-a",
      branchId: "branch-from-tenant-b",
      tableId: "table-from-tenant-b"
    });
    await waitForSocketHandler();

    expect(socket.join).not.toHaveBeenCalled();
    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });

  it("emits order and payment events only to the order branch and table rooms", () => {
    initRealtimeServer({} as HttpServer);
    const order = {
      id: "order-a",
      tenantId: "tenant-a",
      branchId: "branch-a",
      branchName: "Branch A",
      tableId: "table-a",
      tableName: "Table A",
      status: OrderStatus.PENDING,
      total: "90000.00",
      itemCount: 2,
      createdAt: "2026-05-13T00:00:00.000Z",
      updatedAt: "2026-05-13T00:00:00.000Z"
    };
    const orderDetail = {
      ...order,
      items: []
    };
    const payment = {
      id: "payment-a",
      tenantId: "tenant-a",
      branchId: "branch-a",
      orderId: "order-a",
      method: PaymentMethod.CASH,
      amount: "90000.00",
      status: PaymentStatus.COMPLETED,
      paidAt: "2026-05-13T00:05:00.000Z",
      createdAt: "2026-05-13T00:05:00.000Z",
      updatedAt: "2026-05-13T00:05:00.000Z"
    };

    emitOrderCreated({ order });
    emitOrderStatusUpdated({ order: orderDetail });
    emitPaymentCompleted({ order: orderDetail, payment });

    const expectedRooms = [
      branchRoom("tenant-a", "branch-a"),
      tableRoom("tenant-a", "branch-a", "table-a"),
      branchRoom("tenant-a", "branch-a"),
      tableRoom("tenant-a", "branch-a", "table-a"),
      branchRoom("tenant-a", "branch-a"),
      tableRoom("tenant-a", "branch-a", "table-a")
    ];

    expect(realtimeMock.server.emittedRooms).toEqual(expectedRooms);
    expect(realtimeMock.server.emittedRooms).not.toContain(branchRoom("tenant-b", "branch-a"));
    expect(realtimeMock.server.emittedEvents.map((event) => event.event)).toEqual([
      RealtimeEvent.OrderCreated,
      RealtimeEvent.OrderStatusUpdated,
      RealtimeEvent.PaymentCompleted
    ]);
  });
});
