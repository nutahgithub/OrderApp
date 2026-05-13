# Step 06 - Customer Order API + Customer UI

## Mục Tiêu

Cho khách scan QR, chọn món, gửi order, và xem summary đơn hàng.

## Plan Cần Đọc

- `docs/PROJECT_RULES.md`
- `docs/plan/06_order_module.md`
- `docs/plan/10c_frontend_customer_qr_ordering.md`

## API Cần Làm

- API tạo order bằng QR context.
- Validate tenant/branch/table.
- Validate menu item thuộc đúng tenant và đang bán.
- Server tính total, không tin giá từ client.
- Lưu order và order items trong transaction.
- API xem order summary.

## UI Cần Làm Ngay Sau API

- Customer QR chọn món.
- Cart tăng/giảm số lượng.
- Xóa món khỏi cart.
- Hiển thị tạm tính ở UI.
- Submit order.
- Disable submit khi đang gửi.
- Giữ cart nếu submit lỗi.
- Màn hình order summary/tracking cơ bản.

## Test / Smoke Test

- Customer mở QR URL, chọn món, gửi order thành công.
- Order total từ response server hiển thị đúng.
- Không gửi được cart rỗng.
- Nếu API lỗi, cart không mất.
- Chạy test/typecheck/lint nếu có script.

## Hoàn Thành Khi

- Customer đặt món end-to-end từ UI được.
- Order được lưu đúng transaction.
- Bạn test OK customer order thì mới chuyển Step 07.

