# Phase 5 - Menu Management

## Mục Tiêu

Cho admin quản lý món bán trong tenant.

## Features

- Tạo món.
- Cập nhật tên, giá, trạng thái.
- Danh sách menu theo tenant.
- Ẩn/hiện món.
- Chuẩn bị khả năng phân loại menu nếu scope mở rộng.

## Validation

- Tên món bắt buộc.
- Giá phải hợp lệ và không âm.
- Không dùng float cho tiền trong tầng database.

## API Notes

- Admin endpoint cần JWT.
- Customer QR endpoint chỉ trả các món đang bán.
- Mọi query filter theo `tenantId`.

## Kết Quả Mong Muốn

- Admin quản lý được menu.
- Customer lấy được danh sách món khả dụng khi scan QR.
- Có test cho giá, trạng thái, tenant isolation.

