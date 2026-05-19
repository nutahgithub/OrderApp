# Step 18 - Tenant & Realtime Isolation Tests

## Muc Tieu

Bo sung test de dam bao multi-tenant va realtime room khong leak du lieu.

## Can Doc Truoc

- `docs/PROJECT_RULES.md`
- `apps/api/src/repositories`
- `apps/api/src/services`
- `apps/api/src/shared/realtime/socket.ts`
- `apps/api/src/shared/realtime/rooms.ts`

## Scope

- Test admin tenant A khong doc/sua du lieu tenant B.
- Test public QR sai tenant/branch/table bi reject.
- Test order/payment/report queries filter tenant.
- Test socket admin/customer join dung room.
- Test emit order/payment chi toi branch/table room dung.

## Ngoai Scope

- Khong them feature moi.
- Khong refactor toan bo repository neu test hien tai da duong dan ro.
- Khong lam E2E Playwright trong step nay.

## Test / Smoke Test

- Chay unit/service tests lien quan tenant.
- Chay realtime rooms/socket tests.
- Chay smoke flow Step 11 sau khi them test.

## Hoan Thanh Khi

- Cac duong du lieu nhay cam co test isolation.
- Bug isolation neu phat hien duoc fix trong cung step.
