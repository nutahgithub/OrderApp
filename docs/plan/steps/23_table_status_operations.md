# Step 23 - Table Status Operations

## Muc Tieu

Lam trang thai ban gan voi van hanh thuc te hon.

## Can Doc Truoc

- `docs/PROJECT_RULES.md`
- `docs/plan/steps/04_table_qr_management.md`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/services/table.service.ts`
- `apps/web/src/pages/admin/AdminTablesPage.tsx`

## Scope

- Mo rong status neu can: available, occupied, reserved, cleaning, disabled.
- Admin thao tac chuyen status ban.
- Sau payment co option reset ban sang cleaning/available.
- Customer QR bi chan neu ban disabled.
- UI hien status ro rang.

## Ngoai Scope

- Khong lam so do ban visual.
- Khong lam reservation chi tiet trong step nay.
- Khong tu dong suy dien moi trang thai neu rule chua ro.

## Test / Smoke Test

- Admin doi status ban.
- Disabled table khong dat order.
- Paid order co the reset table.
- Status filter theo tenant/branch dung.

## Hoan Thanh Khi

- Staff quan ly trang thai ban co ban tu admin UI.
- Flow QR/order/payment khong bi hong.
