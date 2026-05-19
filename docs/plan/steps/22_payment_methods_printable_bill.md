# Step 22 - Payment Methods & Printable Bill

## Muc Tieu

Mo rong payment cash-only thanh nhieu method co ban va tao bill de in/chia se.

## Can Doc Truoc

- `docs/PROJECT_RULES.md`
- `docs/plan/steps/09_payment.md`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/services/payment.service.ts`
- `apps/web/src/pages/admin/AdminOrdersPage.tsx`

## Scope

- Them payment method: cash, bank transfer, card/e-wallet placeholder.
- Luu payment reference/transaction note neu co.
- UI confirm payment cho chon method/reference.
- Trang bill printable hoac modal print-friendly.
- Bill hien branch, table, items, total, payment status, paidAt.

## Ngoai Scope

- Khong tich hop provider thanh toan that.
- Khong split bill/partial payment.
- Khong refund.

## Test / Smoke Test

- Confirm payment voi cash.
- Confirm payment voi bank transfer va reference.
- Bill hien dung tong tien va payment method.
- Duplicate payment protection Step 13 van hoat dong.

## Hoan Thanh Khi

- Thu ngan co the ghi nhan method/reference.
- Bill co the in tu UI admin.
