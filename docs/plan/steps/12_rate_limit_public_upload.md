# Step 12 - Rate Limit Public Order & Upload

## Muc Tieu

Them rate limit cho cac endpoint de bi spam nhat ma khong doi business flow hien co.

## Can Doc Truoc

- `docs/PROJECT_RULES.md`
- `apps/api/src/routes/order.routes.ts`
- `apps/api/src/routes/upload.routes.ts`
- `apps/api/src/shared/http/error-handler.ts`

## Scope

- Them middleware rate limit dung duoc cho Express.
- Ap dung cho `POST /qr/:tenantId/:branchId/:tableId/orders`.
- Ap dung cho `POST /admin/uploads/menu-images`.
- Tra ve error code/message ro khi bi limit.
- Log `tenantId`, IP, route, va requestId neu co.

## Ngoai Scope

- Khong them idempotency.
- Khong sua order/payment logic.
- Khong them Redis distributed limiter neu chua can cho beta single instance.

## Test / Smoke Test

- Goi order endpoint vuot nguong thi nhan 429.
- Upload vuot nguong thi nhan 429.
- Request hop le duoi nguong van chay nhu cu.

## Hoan Thanh Khi

- Rate limit co test don vi hoac integration nho.
- Flow customer order va upload menu image van pass smoke test.
