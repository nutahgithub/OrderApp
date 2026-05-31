import type { Menu, MenuCategory } from "@prisma/client";
import type { DbClient } from "../shared/prisma/types.js";

export type MenuWithUsage = Menu & {
  category: MenuCategory | null;
  _count: {
    items: number;
  };
};

export type MenuWithCategory = Menu & {
  category: MenuCategory | null;
};

export const listMenusByTenant = async (db: DbClient, tenantId: string): Promise<MenuWithUsage[]> => {
  return db.menu.findMany({
    where: {
      tenantId
    },
    include: {
      category: true,
      _count: {
        select: {
          items: true
        }
      }
    },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }]
  });
};

export const listActiveMenusByTenant = async (db: DbClient, tenantId: string): Promise<MenuWithCategory[]> => {
  return db.menu.findMany({
    where: {
      tenantId,
      isActive: true
    },
    include: {
      category: true
    },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }]
  });
};

export const listActiveMenusByTenantAndIds = async (
  db: DbClient,
  input: {
    tenantId: string;
    menuIds: string[];
  }
): Promise<Menu[]> => {
  return db.menu.findMany({
    where: {
      tenantId: input.tenantId,
      id: {
        in: input.menuIds
      },
      isActive: true,
      isOutOfStock: false
    }
  });
};

export const listMenuCategoriesByTenant = async (db: DbClient, tenantId: string): Promise<MenuCategory[]> => {
  return db.menuCategory.findMany({
    where: {
      tenantId
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });
};

export const findMenuCategoryByTenant = async (
  db: DbClient,
  input: {
    tenantId: string;
    categoryId: string;
  }
): Promise<MenuCategory | null> => {
  return db.menuCategory.findFirst({
    where: {
      id: input.categoryId,
      tenantId: input.tenantId
    }
  });
};

export const createMenuCategory = async (
  db: DbClient,
  input: {
    tenantId: string;
    name: string;
    sortOrder?: number;
  }
): Promise<MenuCategory> => {
  return db.menuCategory.create({
    data: {
      tenantId: input.tenantId,
      name: input.name,
      sortOrder: input.sortOrder ?? 0
    }
  });
};

export const updateMenuCategoryByTenant = async (
  db: DbClient,
  input: {
    tenantId: string;
    categoryId: string;
    name: string;
    sortOrder: number;
  }
): Promise<MenuCategory | null> => {
  const result = await db.menuCategory.updateMany({
    where: {
      id: input.categoryId,
      tenantId: input.tenantId
    },
    data: {
      name: input.name,
      sortOrder: input.sortOrder
    }
  });

  if (result.count === 0) {
    return null;
  }

  return findMenuCategoryByTenant(db, input);
};

export const deleteMenuCategoryByTenant = async (
  db: DbClient,
  input: {
    tenantId: string;
    categoryId: string;
  }
): Promise<number> => {
  const result = await db.menuCategory.deleteMany({
    where: {
      id: input.categoryId,
      tenantId: input.tenantId
    }
  });

  return result.count;
};

export const createMenu = async (
  db: DbClient,
  input: {
    tenantId: string;
    name: string;
    price: string;
    imageUrl?: string | null;
    categoryId?: string | null;
    isActive?: boolean;
    isOutOfStock?: boolean;
    isFeatured?: boolean;
    isNew?: boolean;
    sortOrder?: number;
  }
): Promise<Menu> => {
  return db.menu.create({
    data: {
      tenantId: input.tenantId,
      name: input.name,
      price: input.price,
      imageUrl: input.imageUrl ?? null,
      categoryId: input.categoryId ?? null,
      sortOrder: input.sortOrder ?? 0,
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
      ...(input.isOutOfStock === undefined ? {} : { isOutOfStock: input.isOutOfStock }),
      ...(input.isFeatured === undefined ? {} : { isFeatured: input.isFeatured }),
      ...(input.isNew === undefined ? {} : { isNew: input.isNew })
    }
  });
};

export const updateMenuByTenant = async (
  db: DbClient,
  input: {
    tenantId: string;
    menuId: string;
    name: string;
    price: string;
    imageUrl?: string | null;
    categoryId?: string | null;
    isActive: boolean;
    isOutOfStock: boolean;
    isFeatured: boolean;
    isNew: boolean;
    sortOrder: number;
  }
): Promise<Menu | null> => {
  const result = await db.menu.updateMany({
    where: {
      id: input.menuId,
      tenantId: input.tenantId
    },
    data: {
      name: input.name,
      price: input.price,
      imageUrl: input.imageUrl ?? null,
      categoryId: input.categoryId ?? null,
      isActive: input.isActive,
      isOutOfStock: input.isOutOfStock,
      isFeatured: input.isFeatured,
      isNew: input.isNew,
      sortOrder: input.sortOrder
    }
  });

  if (result.count === 0) {
    return null;
  }

  return db.menu.findFirst({
    where: {
      id: input.menuId,
      tenantId: input.tenantId
    }
  });
};

export const countMenuOrderItemsByTenant = async (
  db: DbClient,
  input: {
    tenantId: string;
    menuId: string;
  }
): Promise<number | null> => {
  const menu = await db.menu.findFirst({
    where: {
      id: input.menuId,
      tenantId: input.tenantId
    },
    select: {
      _count: {
        select: {
          items: true
        }
      }
    }
  });

  return menu?._count.items ?? null;
};

export const deleteMenuByTenant = async (
  db: DbClient,
  input: {
    tenantId: string;
    menuId: string;
  }
): Promise<number> => {
  const result = await db.menu.deleteMany({
    where: {
      id: input.menuId,
      tenantId: input.tenantId
    }
  });

  return result.count;
};
