-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NOT NULL,
    `actor_admin_id` VARCHAR(191) NULL,
    `action` ENUM('ADMIN_LOGIN', 'BRANCH_CREATED', 'BRANCH_UPDATED', 'BRANCH_DELETED', 'TABLE_CREATED', 'TABLE_UPDATED', 'MENU_CREATED', 'MENU_UPDATED', 'MENU_DELETED', 'ORDER_STATUS_UPDATED', 'PAYMENT_CONFIRMED', 'MENU_IMAGE_UPLOADED') NOT NULL,
    `resource_type` ENUM('ADMIN_USER', 'BRANCH', 'TABLE', 'MENU', 'ORDER', 'PAYMENT', 'UPLOAD') NOT NULL,
    `resource_id` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_tenant_id_created_at_idx`(`tenant_id`, `created_at`),
    INDEX `audit_logs_tenant_id_action_created_at_idx`(`tenant_id`, `action`, `created_at`),
    INDEX `audit_logs_tenant_id_resource_type_resource_id_idx`(`tenant_id`, `resource_type`, `resource_id`),
    INDEX `audit_logs_actor_admin_id_idx`(`actor_admin_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_admin_id_fkey` FOREIGN KEY (`actor_admin_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
