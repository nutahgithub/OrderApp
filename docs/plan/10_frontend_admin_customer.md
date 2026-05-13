# Phase 10 - Frontend Product Overview

## Mục Tiêu

Xây frontend như một phần đầy đủ của sản phẩm, không chỉ là demo gọi API. Sản phẩm cần có hai trải nghiệm chính: admin app cho vận hành nhà hàng và customer QR app cho khách đặt món tại bàn.

## Frontend Sub-Plans

- `10a_frontend_foundation.md` - Nền tảng frontend, routing, auth state, API client, layout.
- `10b_frontend_admin_operations.md` - Các màn hình admin để vận hành hằng ngày.
- `10c_frontend_customer_qr_ordering.md` - Flow khách scan QR, chọn món, gửi order.
- `10d_frontend_realtime_states.md` - Realtime state, loading/error/empty state, UX polish.

## Admin App

- Login.
- Dashboard doanh thu.
- Quản lý chi nhánh.
- Quản lý bàn và QR.
- Quản lý menu.
- Danh sách order realtime.
- Cập nhật trạng thái order.
- Thanh toán order.

## Customer QR App

- Mở URL theo bàn.
- Xem menu đang bán.
- Chọn món và số lượng.
- Xem giỏ hàng.
- Gửi order.
- Theo dõi trạng thái order realtime.

## UX Notes

- Admin UI nên gọn, rõ, tối ưu thao tác lặp lại.
- Customer UI nên nhanh, dễ đọc trên mobile.
- Không cần landing page nếu chưa có yêu cầu marketing.
- Mỗi chức năng backend quan trọng cần có màn hình frontend tương ứng để sản phẩm dùng được end-to-end.
- Ưu tiên flow thật: tạo menu, tạo bàn/QR, khách đặt món, bếp/admin nhận order, thanh toán, xem báo cáo.

## Kết Quả Mong Muốn

- Admin vận hành được flow cơ bản.
- Customer đặt món được từ mobile qua QR.
- Frontend xử lý loading/error/empty states.
- Có thể demo sản phẩm hoàn chỉnh bằng seed data local.
