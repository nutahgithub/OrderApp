-- CreateTable
CREATE TABLE `idempotency_keys` (
    `id` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NOT NULL,
    `action` ENUM('CREATE_QR_ORDER', 'CONFIRM_PAYMENT') NOT NULL,
    `key` VARCHAR(128) NOT NULL,
    `request_hash` CHAR(64) NOT NULL,
    `resource_id` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `idempotency_keys_tenant_id_action_idx`(`tenant_id`, `action`),
    UNIQUE INDEX `idempotency_keys_tenant_id_action_key_key`(`tenant_id`, `action`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `idempotency_keys` ADD CONSTRAINT `idempotency_keys_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
