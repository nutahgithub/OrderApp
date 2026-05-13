import { describe, expect, it } from "vitest";
import { createAdminToken, verifyAdminToken } from "../jwt.js";

describe("jwt security", () => {
  it("creates and verifies an admin token with tenant context", () => {
    const token = createAdminToken({
      sub: "admin-1",
      tenantId: "tenant-1",
      role: "OWNER"
    });

    const payload = verifyAdminToken(token);

    expect(payload.sub).toBe("admin-1");
    expect(payload.tenantId).toBe("tenant-1");
    expect(payload.role).toBe("OWNER");
  });
});

