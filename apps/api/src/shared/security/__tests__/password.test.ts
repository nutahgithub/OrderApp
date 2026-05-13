import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../password.js";

describe("password security", () => {
  it("verifies a password against its hash", () => {
    const passwordHash = hashPassword("admin123456");

    expect(verifyPassword("admin123456", passwordHash)).toBe(true);
    expect(verifyPassword("wrong-password", passwordHash)).toBe(false);
  });
});

