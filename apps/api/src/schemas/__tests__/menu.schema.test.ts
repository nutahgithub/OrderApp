import { describe, expect, it } from "vitest";
import { createMenuSchema, updateMenuSchema } from "../menu.schema.js";

describe("menu schema", () => {
  it("accepts a valid menu price string", () => {
    const result = createMenuSchema.parse({
      name: "Pho",
      price: "45000.50",
      imageUrl: "https://example.com/pho.jpg",
      isActive: true
    });

    expect(result.price).toBe("45000.50");
    expect(result.imageUrl).toBe("https://example.com/pho.jpg");
  });

  it("normalizes an empty image URL to null", () => {
    const result = createMenuSchema.parse({
      name: "Pho",
      price: "45000.50",
      imageUrl: ""
    });

    expect(result.imageUrl).toBeNull();
  });

  it("rejects negative prices", () => {
    expect(() =>
      createMenuSchema.parse({
        name: "Pho",
        price: "-1"
      })
    ).toThrow();
  });

  it("rejects prices with more than 2 decimals", () => {
    expect(() =>
      updateMenuSchema.parse({
        name: "Pho",
        price: "45000.555",
        isActive: true
      })
    ).toThrow();
  });
});
