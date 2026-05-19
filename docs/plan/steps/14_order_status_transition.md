# Step 14 - Order Status Transition Rules

## Muc Tieu

Bao ve trang thai order de admin/staff khong cap nhat nhay buoc hoac quay lui sai nghiep vu.

## Can Doc Truoc

- `docs/PROJECT_RULES.md`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/services/order.service.ts`
- `apps/api/src/schemas/order.schema.ts`
- `apps/web/src/pages/admin/AdminOrdersPage.tsx`

## Scope

- Dinh nghia transition hop le cho `OrderStatus`.
- Validate transition trong service truoc khi update.
- Tra error ro khi transition khong hop le.
- UI chi hien action hop le theo status hien tai.
- Dam bao order da `PAID` hoac `CANCELLED` khong bi sua tuy tien.

## Ngoai Scope

- Khong them cancel reason trong step nay.
- Khong them RBAC rieng cho override status.
- Khong sua payment method.

## Test / Smoke Test

- `PENDING -> CONFIRMED` hop le.
- Transition nhay buoc/nguoc bi reject.
- Order `PAID` khong cap nhat status duoc tu UI/API.

## Hoan Thanh Khi

- Service test cover transition chinh.
- Admin UI khong dua user vao action bi API reject.
