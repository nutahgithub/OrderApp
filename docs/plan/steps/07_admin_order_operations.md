# Step 07 - Admin Order Operations API + UI

## Mục Tiêu

Cho admin xem order từ khách và cập nhật trạng thái order.

## Plan Cần Đọc

- `docs/PROJECT_RULES.md`
- `docs/plan/06_order_module.md`
- `docs/plan/10b_frontend_admin_operations.md`

## API Cần Làm

- API danh sách order theo chi nhánh.
- API lọc order theo status nếu phù hợp.
- API xem chi tiết order.
- API cập nhật trạng thái order.
- Validate order thuộc đúng tenant.

## UI Cần Làm Ngay Sau API

- Trang `/admin/orders`.
- Danh sách order.
- Filter theo chi nhánh/status.
- Chi tiết order items.
- Nút cập nhật status.
- Loading/error/empty state.

## Test / Smoke Test

- Admin thấy order khách vừa tạo.
- Admin xem chi tiết order.
- Admin cập nhật trạng thái order.
- Refresh trang vẫn thấy trạng thái mới.
- Chạy test/typecheck/lint nếu có script.

## Hoàn Thành Khi

- Admin vận hành order từ UI được.
- Status update hoạt động đúng.
- Bạn test OK order admin thì mới chuyển Step 08.

