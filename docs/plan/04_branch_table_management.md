# Phase 4 - Branch & Table Management

## Mục Tiêu

Cho admin quản lý chi nhánh và bàn trong từng tenant.

## Branch Features

- Tạo chi nhánh.
- Cập nhật chi nhánh.
- Danh sách chi nhánh theo tenant.
- Vô hiệu hóa hoặc xóa mềm chi nhánh nếu cần.

## Table Features

- Tạo bàn thuộc chi nhánh.
- Cập nhật tên/trạng thái bàn.
- Danh sách bàn theo chi nhánh.
- Sinh hoặc lưu QR identifier cho bàn.

## API Notes

- Tất cả endpoint admin cần JWT.
- Query branch/table phải filter `tenantId`.
- Không cho table thuộc branch của tenant khác.

## Kết Quả Mong Muốn

- Admin quản lý được branch/table.
- Table có dữ liệu đủ để tạo QR order URL.
- Có test tenant isolation cho branch/table.

