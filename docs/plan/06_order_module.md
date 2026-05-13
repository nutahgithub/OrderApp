# Phase 6 - Order Module

## Mục Tiêu

Xây luồng QR order cốt lõi: customer chọn món, gửi order, hệ thống lưu transaction an toàn.

## Customer Flow

1. Customer scan QR của bàn.
2. Frontend tải thông tin tenant/branch/table/menu.
3. Customer chọn món và số lượng.
4. Customer gửi order.
5. API validate table/menu thuộc đúng tenant.
6. API tính tổng tiền ở server.
7. API tạo `Order` và `OrderItem` trong transaction.
8. API trả order summary.

## Backend Use Cases

- `createOrder`
- `getOrderById`
- `listOrdersByBranch`
- `updateOrderStatus`

## Order Status Gợi Ý

- `PENDING`
- `CONFIRMED`
- `PREPARING`
- `READY`
- `SERVED`
- `CANCELLED`
- `PAID`

## Critical Rules

- Không tin giá tiền từ client.
- Không tạo order nếu table không thuộc tenant/branch.
- Không tạo order nếu menu item không thuộc tenant hoặc đang inactive.
- Tạo order và order items bằng transaction.
- Business logic tính total nằm trong service/use-case.

## Kết Quả Mong Muốn

- Customer tạo order thành công qua QR context.
- Admin xem được order theo branch.
- Order total được tính đúng ở server.
- Có test cho transaction, total, invalid menu/table, tenant isolation.

