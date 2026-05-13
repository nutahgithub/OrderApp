# Step 03 - Branch Management API + UI

## Mục Tiêu

Cho admin quản lý chi nhánh theo tenant từ UI.

## Plan Cần Đọc

- `docs/PROJECT_RULES.md`
- `docs/plan/04_branch_table_management.md`
- `docs/plan/10b_frontend_admin_operations.md`

## API Cần Làm

- API danh sách chi nhánh theo tenant.
- API tạo chi nhánh.
- API cập nhật chi nhánh.
- Validate input.
- Đảm bảo mọi query filter theo `tenant_id`.

## UI Cần Làm Ngay Sau API

- Trang `/admin/branches`.
- Danh sách chi nhánh.
- Form tạo chi nhánh.
- Form sửa chi nhánh.
- Loading state.
- Empty state khi chưa có chi nhánh.
- Error state và retry nếu API lỗi.

## Test / Smoke Test

- Admin tạo chi nhánh từ UI được.
- Admin sửa chi nhánh từ UI được.
- Refresh trang vẫn thấy dữ liệu.
- Không truy cập được nếu chưa login.
- Chạy test/typecheck/lint nếu có script.

## Hoàn Thành Khi

- Branch API và Branch UI dùng được end-to-end.
- Dữ liệu branch được cô lập theo tenant.
- Bạn test OK quản lý chi nhánh thì mới chuyển Step 04.

