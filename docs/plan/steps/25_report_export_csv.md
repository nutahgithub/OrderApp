# Step 25 - Report Export CSV

## Muc Tieu

Cho admin export order/payment/revenue de doi chieu ngoai he thong.

## Can Doc Truoc

- `docs/PROJECT_RULES.md`
- `docs/plan/steps/24_dashboard_advanced_metrics.md`
- `apps/api/src/services/report.service.ts`
- `apps/web/src/pages/admin/AdminDashboardPage.tsx`

## Scope

- Export CSV cho orders.
- Export CSV cho payments/revenue.
- Dung filter date range, branch, status, payment method neu co.
- Ten file co tenant/date range ro.
- UI nut export trong dashboard/report.

## Ngoai Scope

- Khong lam XLSX trong step nay.
- Khong export audit log.
- Khong gui email report.

## Test / Smoke Test

- CSV dung header va encoding.
- Filter export khop voi UI report.
- Tenant A khong export du lieu tenant B.

## Hoan Thanh Khi

- File CSV mo duoc bang spreadsheet thong dung.
- Export khong lam cham/hong dashboard.
