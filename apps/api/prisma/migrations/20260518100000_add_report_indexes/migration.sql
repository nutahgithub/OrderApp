CREATE INDEX `orders_tenant_id_createdAt_idx` ON `orders`(`tenant_id`, `createdAt`);
CREATE INDEX `orders_tenant_id_branch_id_createdAt_idx` ON `orders`(`tenant_id`, `branch_id`, `createdAt`);
CREATE INDEX `payments_tenant_id_paid_at_idx` ON `payments`(`tenant_id`, `paid_at`);
CREATE INDEX `payments_tenant_id_branch_id_paid_at_idx` ON `payments`(`tenant_id`, `branch_id`, `paid_at`);
