# Step 09 - Payment API + Payment UI

## Mục Tiêu

Cho admin/thu ngân xác nhận thanh toán order và cập nhật trạng thái thanh toán.

## Plan Cần Đọc

- `docs/PROJECT_RULES.md`
- `docs/plan/08_payment_module.md`
- `docs/plan/10b_frontend_admin_operations.md`
- `docs/plan/10d_frontend_realtime_states.md`

## API Cần Làm

- API xác nhận thanh toán.
- Lưu payment record nếu scope hiện tại đã có bảng payment.
- Chặn duplicate payment.
- Không thanh toán order cancelled.
- Amount phải khớp order total trong scope ban đầu.
- Cập nhật order sang `PAID`.
- Emit `payment.completed` nếu realtime đã có.

## UI Cần Làm Ngay Sau API

- Nút thanh toán trong order detail.
- Confirm trước khi thanh toán nếu phù hợp.
- Hiển thị trạng thái paid.
- Disable thanh toán lại.
- Cập nhật order list/detail sau payment.

## Test / Smoke Test

- Admin thanh toán order từ UI được.
- Order chuyển sang paid.
- Không thanh toán lại được.
- Order cancelled không thanh toán được.
- Chạy test/typecheck/lint nếu có script.

## Hoàn Thành Khi

- Payment flow dùng được từ UI.
- Duplicate payment bị chặn.
- Bạn test OK payment thì mới chuyển Step 10.

