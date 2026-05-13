# Phase 8 - Payment Module

## Mục Tiêu

Quản lý thanh toán ở mức cơ bản và chuẩn bị mở rộng tích hợp cổng thanh toán sau.

## Scope Ban Đầu

- Thanh toán tại quầy hoặc tiền mặt.
- Cập nhật order sang trạng thái `PAID`.
- Lưu thông tin payment tối thiểu nếu thêm bảng `payments`.

## Payment Fields Gợi Ý

- `id`
- `tenantId`
- `branchId`
- `orderId`
- `method`
- `amount`
- `status`
- `paidAt`

## Business Rules

- Không thanh toán order thuộc tenant khác.
- Không thanh toán order đã cancelled.
- Không thanh toán nhiều lần nếu không có nghiệp vụ partial payment.
- Amount phải khớp order total trong scope ban đầu.

## Kết Quả Mong Muốn

- Admin/thu ngân xác nhận thanh toán được.
- Order chuyển sang `PAID`.
- Realtime emit `payment.completed`.
- Có test cho duplicate payment và tenant isolation.

