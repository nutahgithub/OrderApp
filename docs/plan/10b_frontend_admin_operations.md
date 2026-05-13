# Phase 10B - Frontend Admin Operations

## Mục Tiêu

Xây admin app để chủ/quản lý/nhân viên nhà hàng vận hành hệ thống hằng ngày.

## Login & Session

- Màn hình login.
- Lưu JWT an toàn theo mức phù hợp với app.
- Tự redirect nếu chưa đăng nhập.
- Logout.
- Hiển thị tenant/admin hiện tại nếu API hỗ trợ.

## Dashboard

- Revenue cards:
  - doanh thu hôm nay
  - số order hôm nay
  - order đang xử lý
  - món bán chạy
- Filter theo ngày và chi nhánh.
- Chart doanh thu theo ngày nếu có data.

## Branch Management

- Danh sách chi nhánh.
- Tạo chi nhánh.
- Sửa chi nhánh.
- Empty/error/loading states.

## Table Management

- Danh sách bàn theo chi nhánh.
- Tạo bàn.
- Sửa tên/trạng thái bàn.
- Hiển thị QR URL hoặc QR code nếu đã có API.
- Copy/download QR khi scope cho phép.

## Menu Management

- Danh sách món.
- Tạo món.
- Sửa tên, giá, trạng thái.
- Bật/tắt món đang bán.
- Validate giá trên UI trước khi gửi API.

## Order Operations

- Danh sách order realtime theo chi nhánh.
- Bộ lọc theo status.
- Chi tiết order và order items.
- Cập nhật status:
  - `CONFIRMED`
  - `PREPARING`
  - `READY`
  - `SERVED`
  - `CANCELLED`
- Giao diện tối ưu cho bếp/nhân viên nhìn nhanh.

## Payment Operations

- Xác nhận thanh toán order.
- Hiển thị trạng thái `PAID`.
- Chặn thao tác thanh toán lại ở UI nếu order đã paid.

## Kết Quả Mong Muốn

- Admin có thể vận hành end-to-end: setup chi nhánh, bàn, menu, nhận order, cập nhật trạng thái, thanh toán.
- UI đủ rõ để demo sản phẩm thật, không chỉ là trang test API.

