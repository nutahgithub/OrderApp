# Step 27 - Basic Inventory

## Muc Tieu

Them inventory co ban de nha hang theo doi nguyen lieu va canh bao sap het hang.

## Can Doc Truoc

- `docs/PROJECT_RULES.md`
- `docs/plan/steps/20_menu_categories_availability.md`
- `apps/api/prisma/schema.prisma`

## Scope

- Model nguyen lieu, don vi tinh, ton kho hien tai.
- Admin UI list/create/update inventory items.
- Cau hinh low-stock threshold.
- Canh bao sap het hang trong admin.
- Cong thuc mon co the chi la optional mapping don gian neu step van nho.

## Ngoai Scope

- Khong tru ton tu dong neu rule chua ro.
- Khong purchase order/supplier.
- Khong costing/profit margin nang cao.

## Test / Smoke Test

- Tao/sua inventory item.
- Low stock hien canh bao.
- Tenant isolation cho inventory.

## Hoan Thanh Khi

- Quan ly thay duoc ton kho co ban.
- Scope khong anh huong flow customer order.
