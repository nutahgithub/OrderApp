# Step 05 - Menu Management API + UI

## Mục Tiêu

Cho admin quản lý menu và cho customer QR xem danh sách món đang bán.

## Plan Cần Đọc

- `docs/PROJECT_RULES.md`
- `docs/plan/05_menu_management.md`
- `docs/plan/10b_frontend_admin_operations.md`
- `docs/plan/10c_frontend_customer_qr_ordering.md`

## API Cần Làm

- API danh sách menu cho admin.
- API tạo món.
- API cập nhật tên, giá, trạng thái.
- API bật/tắt món đang bán.
- Public API lấy menu đang bán cho customer QR.
- Giá phải dùng kiểu dữ liệu an toàn, không dùng float nếu database có lựa chọn tốt hơn.

## UI Cần Làm Ngay Sau API

- Trang `/admin/menus`.
- Danh sách món.
- Form tạo/sửa món.
- Toggle món đang bán.
- Validate giá trên UI.
- Customer QR hiển thị menu public.
- Customer QR có loading/error/empty state cho menu.

## Test / Smoke Test

- Admin tạo món từ UI được.
- Admin sửa giá/trạng thái từ UI được.
- Customer QR chỉ thấy món đang bán.
- Refresh trang vẫn thấy dữ liệu đúng.
- Chạy test/typecheck/lint nếu có script.

## Hoàn Thành Khi

- Admin quản lý menu end-to-end.
- Customer QR xem được menu public.
- Bạn test OK menu thì mới chuyển Step 06.

