# Step 20 - Menu Categories & Availability

## Muc Tieu

Lam menu de van hanh hon: co category, sort order, va trang thai mon san sang ban/het hang.

## Can Doc Truoc

- `docs/PROJECT_RULES.md`
- `docs/plan/steps/05_menu_management.md`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/services/menu.service.ts`
- `apps/web/src/pages/admin/AdminMenusPage.tsx`
- `apps/web/src/pages/customer/CustomerQrEntryPage.tsx`

## Scope

- Them category cho menu.
- Them sort order cho category/menu.
- Them tag/trang thai don gian: active, out of stock, featured/new neu can.
- Admin UI quan ly category va sap xep co ban.
- Customer QR hien menu theo category va khong cho dat mon het hang.

## Ngoai Scope

- Khong them modifier/topping trong step nay.
- Khong lam schedule theo khung gio.
- Khong lam inventory tru ton.

## Test / Smoke Test

- Admin tao category va gan menu.
- Customer thay menu theo category.
- Mon out of stock khong dat duoc.
- Tenant isolation cho category/menu.

## Hoan Thanh Khi

- Menu admin va customer ro rang hon nhung flow order khong bi phuc tap.
- Migration va seed/demo data duoc cap nhat neu can.
