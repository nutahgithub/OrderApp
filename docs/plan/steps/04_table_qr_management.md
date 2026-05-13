# Step 04 - Table + QR Management API + UI

## Mục Tiêu

Cho admin quản lý bàn theo chi nhánh và tạo QR URL để khách đặt món.

## Plan Cần Đọc

- `docs/PROJECT_RULES.md`
- `docs/plan/04_branch_table_management.md`
- `docs/plan/10b_frontend_admin_operations.md`
- `docs/plan/10c_frontend_customer_qr_ordering.md`

## API Cần Làm

- API danh sách bàn theo chi nhánh.
- API tạo bàn.
- API cập nhật tên/trạng thái bàn.
- API trả QR URL hoặc dữ liệu đủ để frontend tạo QR URL.
- Validate bàn phải thuộc branch cùng tenant.

## UI Cần Làm Ngay Sau API

- Trang `/admin/tables`.
- Chọn chi nhánh để xem bàn.
- Danh sách bàn.
- Form tạo/sửa bàn.
- Hiển thị QR URL hoặc QR code.
- Copy QR URL nếu phù hợp.
- Tạo route customer entry `/qr/:tenantId/:branchId/:tableId`.
- Customer QR entry hiển thị trạng thái cơ bản khi bàn hợp lệ/không hợp lệ.

## Test / Smoke Test

- Admin tạo bàn từ UI được.
- Admin sửa bàn từ UI được.
- QR URL mở được trang customer entry.
- Bàn filter đúng theo chi nhánh và tenant.
- Chạy test/typecheck/lint nếu có script.

## Hoàn Thành Khi

- Admin quản lý bàn và lấy QR URL được.
- Customer mở QR URL thấy màn hình entry cơ bản.
- Bạn test OK bàn/QR thì mới chuyển Step 05.

