# Step 24 - Dashboard Advanced Metrics

## Muc Tieu

Mo rong dashboard sau khi du lieu order/payment da on dinh.

## Can Doc Truoc

- `docs/PROJECT_RULES.md`
- `docs/plan/09_report_dashboard.md`
- `apps/api/src/services/report.service.ts`
- `apps/api/src/repositories/report.repository.ts`
- `apps/web/src/pages/admin/AdminDashboardPage.tsx`

## Scope

- Doanh thu theo gio/ngay/tuan/thang.
- Mon ban chay va mon doanh thu cao.
- Gia tri don trung binh.
- So order va thoi gian xu ly trung binh neu co du timestamp.
- So sanh branch trong cung tenant.

## Ngoai Scope

- Khong export CSV/XLSX.
- Khong inventory analytics.
- Khong chart qua phuc tap neu table/cards da du.

## Test / Smoke Test

- Metrics dung theo date range.
- Branch filter khong leak tenant khac.
- Dashboard empty state dung khi chua co du lieu.

## Hoan Thanh Khi

- Admin co them insight van hanh ma khong can export ngoai.
- Query report co index/performance hop ly voi du lieu demo.
