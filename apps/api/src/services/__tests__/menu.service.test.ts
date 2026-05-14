import type { Menu, RestaurantTable } from "@prisma/client";
import { Prisma, TableStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMenu, listActiveMenusByTenant, listMenusByTenant, updateMenuByTenant } from "../../repositories/menu.repository.js";
import { findTableQrEntry } from "../../repositories/table.repository.js";
import { ErrorCode } from "../../shared/errors/error-catalog.js";
import { createTenantMenu, listPublicQrMenus, listTenantMenus, updateTenantMenu } from "../menu.service.js";

vi.mock("../../shared/prisma/client.js", () => ({
  prisma: {
    menu: {},
    restaurantTable: {}
  }
}));

vi.mock("../../repositories/menu.repository.js", () => ({
  createMenu: vi.fn(),
  listActiveMenusByTenant: vi.fn(),
  listMenusByTenant: vi.fn(),
  updateMenuByTenant: vi.fn()
}));

vi.mock("../../repositories/table.repository.js", () => ({
  findTableQrEntry: vi.fn()
}));

const menuFixture = (overrides: Partial<Menu> = {}): Menu => ({
  id: "menu-1",
  tenantId: "tenant-1",
  name: "Pho",
  price: new Prisma.Decimal("45000.00"),
  imageUrl: "https://example.com/pho.jpg",
  isActive: true,
  createdAt: new Date("2026-05-13T10:00:00.000Z"),
  updatedAt: new Date("2026-05-13T10:00:00.000Z"),
  ...overrides
});

const tableFixture = (overrides: Partial<RestaurantTable> = {}): RestaurantTable => ({
  id: "table-1",
  tenantId: "tenant-1",
  branchId: "branch-1",
  name: "Table 1",
  status: TableStatus.AVAILABLE,
  createdAt: new Date("2026-05-13T10:00:00.000Z"),
  updatedAt: new Date("2026-05-13T10:00:00.000Z"),
  ...overrides
});

describe("menu service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists menus inside the tenant scope", async () => {
    vi.mocked(listMenusByTenant).mockResolvedValue([menuFixture()]);

    const result = await listTenantMenus("tenant-1");

    expect(listMenusByTenant).toHaveBeenCalledWith(expect.any(Object), "tenant-1");
    expect(result).toEqual([
      expect.objectContaining({
        id: "menu-1",
        price: "45000.00",
        isActive: true
      })
    ]);
  });

  it("normalizes prices when creating a menu item", async () => {
    vi.mocked(createMenu).mockResolvedValue(menuFixture({ price: new Prisma.Decimal("55000.00") }));

    const result = await createTenantMenu("tenant-1", {
      name: " Bun Bo ",
      price: "55000",
      isActive: false
    });

    expect(createMenu).toHaveBeenCalledWith(expect.any(Object), {
        tenantId: "tenant-1",
        name: "Bun Bo",
        price: "55000.00",
        imageUrl: null,
        isActive: false
      });
    expect(result.price).toBe("55000.00");
  });

  it("updates a menu item inside the tenant scope", async () => {
    vi.mocked(updateMenuByTenant).mockResolvedValue(menuFixture({ name: "Iced Coffee", isActive: false }));

    const result = await updateTenantMenu("tenant-1", "menu-1", {
      name: " Iced Coffee ",
      price: "29000.5",
      isActive: false
    });

    expect(updateMenuByTenant).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      menuId: "menu-1",
      name: "Iced Coffee",
      price: "29000.50",
      imageUrl: null,
      isActive: false
    });
    expect(result.isActive).toBe(false);
  });

  it("returns MENU_NOT_FOUND when updating a menu outside the tenant", async () => {
    vi.mocked(updateMenuByTenant).mockResolvedValue(null);

    await expect(
      updateTenantMenu("tenant-1", "missing-menu", {
        name: "Tea",
        price: "15000",
        isActive: true
      })
    ).rejects.toMatchObject({
      code: ErrorCode.MenuNotFound
    });
  });

  it("only returns active menus for a valid QR context", async () => {
    vi.mocked(findTableQrEntry).mockResolvedValue({
      ...tableFixture(),
      branch: {
        id: "branch-1",
        name: "Main Branch"
      }
    });
    vi.mocked(listActiveMenusByTenant).mockResolvedValue([menuFixture(), menuFixture({ id: "menu-2", name: "Tea" })]);

    const result = await listPublicQrMenus("tenant-1", "branch-1", "table-1");

    expect(findTableQrEntry).toHaveBeenCalledWith(expect.any(Object), {
      tenantId: "tenant-1",
      branchId: "branch-1",
      tableId: "table-1"
    });
    expect(listActiveMenusByTenant).toHaveBeenCalledWith(expect.any(Object), "tenant-1");
    expect(result).toHaveLength(2);
  });

  it("rejects public menu access for an invalid QR context", async () => {
    vi.mocked(findTableQrEntry).mockResolvedValue(null);

    await expect(listPublicQrMenus("tenant-1", "branch-1", "missing-table")).rejects.toMatchObject({
      code: ErrorCode.TableNotFound
    });
    expect(listActiveMenusByTenant).not.toHaveBeenCalled();
  });
});
