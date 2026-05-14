import type { Menu } from "@prisma/client";
import type { DbClient } from "../shared/prisma/types.js";

export const listMenusByTenant = async (db: DbClient, tenantId: string): Promise<Menu[]> => {
  return db.menu.findMany({
    where: {
      tenantId
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};

export const listActiveMenusByTenant = async (db: DbClient, tenantId: string): Promise<Menu[]> => {
  return db.menu.findMany({
    where: {
      tenantId,
      isActive: true
    },
    orderBy: {
      name: "asc"
    }
  });
};

export const createMenu = async (
  db: DbClient,
  input: {
    tenantId: string;
    name: string;
    price: string;
    imageUrl?: string | null;
    isActive?: boolean;
  }
): Promise<Menu> => {
  return db.menu.create({
    data: {
      tenantId: input.tenantId,
      name: input.name,
      price: input.price,
      imageUrl: input.imageUrl ?? null,
      ...(input.isActive === undefined ? {} : { isActive: input.isActive })
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
    isActive: boolean;
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
      isActive: input.isActive
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
