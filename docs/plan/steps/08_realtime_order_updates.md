# Step 08 - Realtime Backend + Realtime UI

## Mục Tiêu

Đồng bộ order realtime giữa customer QR và admin app.

## Plan Cần Đọc

- `docs/PROJECT_RULES.md`
- `docs/plan/07_realtime_processing.md`
- `docs/plan/10d_frontend_realtime_states.md`

## API / Socket Cần Làm

- Setup Socket.IO server.
- Tạo room theo tenant/branch/table.
- Admin socket join theo tenant/branch sau auth.
- Customer socket join theo table/order context.
- Emit `order.created`.
- Emit `order.status_updated`.
- Đảm bảo không leak dữ liệu cross-tenant.

## UI Cần Làm Ngay Sau Socket

- Admin order list nhận order mới không cần reload.
- Admin order detail/list cập nhật khi status thay đổi.
- Customer tracking nhận status mới không cần reload.
- Hiển thị connection fallback nếu socket lỗi lâu.
- Có fallback refetch khi cần.

## Test / Smoke Test

- Mở admin orders và customer QR cùng lúc.
- Customer tạo order, admin thấy order mới realtime.
- Admin đổi status, customer thấy status mới realtime.
- Disconnect/reconnect không làm UI duplicate order.
- Chạy test/typecheck/lint nếu có script.

## Hoàn Thành Khi

- Realtime order flow hoạt động end-to-end.
- Không cần reload ở happy path.
- Bạn test OK realtime thì mới chuyển Step 09.

