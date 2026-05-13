import { describe, expect, it } from "vitest";
import { createBranchSchema, updateBranchSchema } from "../branch.schema.js";

describe("branch schema", () => {
  it("accepts a valid branch name", () => {
    expect(createBranchSchema.parse({ name: "Main Branch" })).toEqual({
      name: "Main Branch"
    });
  });

  it("rejects blank names", () => {
    expect(() => updateBranchSchema.parse({ name: "   " })).toThrow();
  });
});
