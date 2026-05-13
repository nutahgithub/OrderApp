import { PrismaClient } from "@prisma/client";
import "../src/config/env.js";

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

  await prisma.menu.upsert({
    where: { id: "demo-menu-1" },
    create: {
      id: "demo-menu-1",
      tenantId: tenant.id,
      name: "House Coffee",
      price: "45000"
    },
    update: {
      name: "House Coffee",
      price: "45000",
      isActive: true
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
