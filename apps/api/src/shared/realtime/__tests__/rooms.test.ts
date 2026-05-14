import { describe, expect, it } from "vitest";
import { branchRoom, tableRoom, tenantRoom } from "../rooms.js";

describe("realtime rooms", () => {
  it("builds tenant-scoped branch and table rooms", () => {
    expect(tenantRoom("tenant-1")).toBe("tenant:tenant-1");
    expect(branchRoom("tenant-1", "branch-1")).toBe("tenant:tenant-1:branch:branch-1");
    expect(tableRoom("tenant-1", "branch-1", "table-1")).toBe("tenant:tenant-1:branch:branch-1:table:table-1");
  });
});

