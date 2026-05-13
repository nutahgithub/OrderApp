# Step 10 - Report API + Dashboard UI

## Mục Tiêu

Cho admin xem dashboard doanh thu và báo cáo cơ bản bằng dữ liệu thật.

## Plan Cần Đọc

- `docs/PROJECT_RULES.md`
- `docs/plan/09_report_dashboard.md`
- `docs/plan/10b_frontend_admin_operations.md`

## API Cần Làm

- API revenue summary.
- API order count.
- API top menu items.
- API order status summary.
- Filter theo date range.
- Filter theo branch.
- Mọi query filter theo tenant.

## UI Cần Làm Ngay Sau API

- Trang `/admin/dashboard`.
- Revenue cards.
- Order count cards.
- Top menu table/list.
- Order status summary.
- Filter ngày.
- Filter chi nhánh.
- Loading/error/empty state.

## Test / Smoke Test

- Dashboard hiển thị dữ liệu từ order/payment thật.
- Filter ngày hoạt động.
- Filter chi nhánh hoạt động.
- Dữ liệu chỉ thuộc tenant hiện tại.
- Chạy test/typecheck/lint nếu có script.

## Hoàn Thành Khi

- Admin xem được dashboard vận hành cơ bản.
- Báo cáo phản ánh đúng dữ liệu đã tạo.
- Bạn test OK dashboard thì mới chuyển Step 11.

