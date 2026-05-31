import { PrismaClient } from "@prisma/client";
import "../src/config/env.js";
import { hashPassword } from "../src/shared/security/password.js";

const prisma = new PrismaClient();

const main = async () => {
  const tenant = await prisma.tenant.upsert({
    where: { id: "demo-tenant" },
    create: {
      id: "demo-tenant",
      name: "Demo Restaurant"
    },
    update: {
      name: "Demo Restaurant"
    }
  });

  const branch = await prisma.branch.upsert({
    where: { id: "demo-branch" },
    create: {
      id: "demo-branch",
      tenantId: tenant.id,
      name: "Main Branch"
    },
    update: {
      name: "Main Branch"
    }
  });

  await prisma.restaurantTable.upsert({
    where: { id: "demo-table-1" },
    create: {
      id: "demo-table-1",
      tenantId: tenant.id,
      branchId: branch.id,
      name: "Table 1"
    },
    update: {
      name: "Table 1"
    }
  });

  const drinksCategory = await prisma.menuCategory.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: "Drinks"
      }
    },
    create: {
      tenantId: tenant.id,
      name: "Drinks",
      sortOrder: 1
    },
    update: {
      sortOrder: 1
    }
  });

  await prisma.menu.upsert({
    where: { id: "demo-menu-1" },
    create: {
      id: "demo-menu-1",
      tenantId: tenant.id,
      categoryId: drinksCategory.id,
      name: "House Coffee",
      price: "45000",
      imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
      sortOrder: 1,
      isFeatured: true
    },
    update: {
      categoryId: drinksCategory.id,
      name: "House Coffee",
      price: "45000",
      imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
      isActive: true,
      isOutOfStock: false,
      isFeatured: true,
      sortOrder: 1
    }
  });

  await prisma.adminUser.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: "admin@example.com"
      }
    },
    create: {
      tenantId: tenant.id,
      email: "admin@example.com",
      name: "Demo Admin",
      passwordHash: hashPassword("admin123456"),
      role: "OWNER"
    },
    update: {
      name: "Demo Admin",
      passwordHash: hashPassword("admin123456"),
      role: "OWNER"
    }
  });
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
