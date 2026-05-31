CREATE TABLE `menu_categories` (
  `id` VARCHAR(191) NOT NULL,
  `tenant_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `menu_categories_tenant_id_idx`(`tenant_id`),
  INDEX `menu_categories_tenant_id_sort_order_idx`(`tenant_id`, `sort_order`),
  UNIQUE INDEX `menu_categories_tenant_id_name_key`(`tenant_id`, `name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `menus`
  ADD COLUMN `category_id` VARCHAR(191) NULL,
  ADD COLUMN `is_out_of_stock` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `is_featured` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `is_new` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `sort_order` INTEGER NOT NULL DEFAULT 0;

CREATE INDEX `menus_tenant_id_category_id_idx` ON `menus`(`tenant_id`, `category_id`);
CREATE INDEX `menus_tenant_id_sort_order_idx` ON `menus`(`tenant_id`, `sort_order`);

ALTER TABLE `menu_categories`
  ADD CONSTRAINT `menu_categories_tenant_id_fkey`
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `menus`
  ADD CONSTRAINT `menus_category_id_fkey`
  FOREIGN KEY (`category_id`) REFERENCES `menu_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
