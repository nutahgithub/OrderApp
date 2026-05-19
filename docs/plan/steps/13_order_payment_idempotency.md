# Step 13 - Order & Payment Idempotency

## Muc Tieu

Chan duplicate order/payment khi user bam nhieu lan hoac retry request.

## Can Doc Truoc

- `docs/PROJECT_RULES.md`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/services/order.service.ts`
- `apps/api/src/services/payment.service.ts`

## Scope

- Thiet ke idempotency key cho public create order.
- Thiet ke idempotency key cho confirm payment.
- Luu key theo tenant va action de tranh trung cheo.
- Neu retry cung key va body tuong thich, tra ket qua da tao.
- Neu cung key nhung body khac, tra validation/conflict error.

## Ngoai Scope

- Khong thay doi order status flow.
- Khong them payment method moi.
- Khong lam distributed lock phuc tap neu transaction DB da du.

## Test / Smoke Test

- Tao order 2 lan cung idempotency key chi co 1 order.
- Payment 2 lan cung idempotency key chi co 1 payment.
- Cung key nhung payload khac bi reject.

## Hoan Thanh Khi

- Duplicate order/payment do retry da duoc chan.
- Migration/schema thay doi co test va rollback hop ly.
