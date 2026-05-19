# Step 29 - API Contract, E2E & Observability

## Muc Tieu

Dong goi chat luong ky thuat sau cac tinh nang moi: contract ro, smoke E2E tu dong, va runbook/alerting co ban.

## Can Doc Truoc

- `docs/PROJECT_RULES.md`
- `docs/deployment_guide.md`
- `docs/plan/11_deployment_observability.md`
- `docs/plan/12_testing_quality_release.md`
- `docs/release_checklist.md`

## Scope

- Tao OpenAPI spec hoac typed contract cho API chinh.
- Dong bo error code giua backend/frontend.
- Them Playwright E2E smoke cho admin login -> setup -> QR order -> payment -> dashboard.
- Them alert/runbook cho 5xx, DB unavailable, upload failed, order creation failed.
- Them backup/restore runbook cho database.
- Ghi ro retention policy cho logs/uploads.

## Ngoai Scope

- Khong rewrite API layer neu contract co the them dan.
- Khong lam full load test.
- Khong tich hop monitoring provider phuc tap neu docs/runbook da du cho beta.

## Test / Smoke Test

- E2E smoke pass tren local/staging.
- Contract build/check pass.
- Runbook co lenh/cac buoc test restore staging.

## Hoan Thanh Khi

- Moi release co smoke E2E ro rang.
- Dev co contract va runbook de debug/deploy an tam hon.
