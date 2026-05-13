import { TableStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { createTableSchema, updateTableSchema } from "../table.schema.js";

describe("table schema", () => {
  it("accepts a valid table create payload", () => {
    expect(
      createTableSchema.parse({
        branchId: "branch-1",
        name: "Table 1",
        status: TableStatus.AVAILABLE
      })
    ).toEqual({
      branchId: "branch-1",
      name: "Table 1",
      status: TableStatus.AVAILABLE
    });
  });

  it("rejects invalid table status", () => {
    expect(() =>
      updateTableSchema.parse({
        name: "Table 1",
        status: "BROKEN"
      })
    ).toThrow();
  });
});
