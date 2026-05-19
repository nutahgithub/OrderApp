# Step 16 - Audit Log Core Actions

## Muc Tieu

Ghi lai cac hanh dong quan trong de debug va truy vet su co van hanh.

## Can Doc Truoc

- `docs/PROJECT_RULES.md`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/controllers`
- `apps/api/src/services`
- `apps/api/src/shared/logger/logger.ts`

## Scope

- Them model/table audit log neu can.
- Ghi actor admin, tenantId, action, resource type/id, timestamp.
- Audit cac action: login, branch/table/menu create/update/delete, order status update, payment confirm, upload image.
- Them API list audit logs cho OWNER/MANAGER neu scope van nho.
- UI co the la trang/table don gian hoac chi API neu muon giu step ngan.

## Ngoai Scope

- Khong lam full activity feed realtime.
- Khong log du lieu nhay cam nhu password/token.
- Khong lam export audit trong step nay.

## Test / Smoke Test

- Login tao audit event.
- Update order status tao audit event.
- Payment confirm tao audit event.
- Tenant A khong doc audit tenant B.

## Hoan Thanh Khi

- Action quan trong co audit record.
- Audit khong lam hong flow khi ghi log loi.
