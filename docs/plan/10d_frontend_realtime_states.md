# Phase 10D - Frontend Realtime & UX States

## Mục Tiêu

Đảm bảo frontend phản ứng đúng với realtime events, trạng thái dữ liệu, lỗi mạng, và các tình huống vận hành thực tế.

## Socket.IO Integration

- Tạo socket client typed theo event contract.
- Admin join room theo tenant/branch sau khi login.
- Customer join room theo table/order context.
- Cleanup socket listeners khi component unmount.

## Realtime Admin Updates

- Khi nhận `order.created`, thêm order mới vào danh sách hoặc invalidate query.
- Khi nhận `order.status_updated`, cập nhật order tương ứng.
- Khi nhận `payment.completed`, cập nhật trạng thái thanh toán.
- Tránh duplicate item nếu event đến nhiều lần.

## Realtime Customer Updates

- Khi order status đổi, cập nhật tracking screen.
- Hiển thị trạng thái kết nối nếu socket mất kết nối lâu.
- Cho phép refresh thủ công nếu cần.

## Loading/Error/Empty States

- Mọi màn hình data phải có:
  - loading state
  - empty state
  - error state
  - retry action nếu hợp lý
- Form phải có validation error rõ.
- Action destructive như cancel order cần confirm.

## Offline & Failure Handling

- Nếu tạo order fail, giữ cart để khách thử lại.
- Nếu admin update status fail, rollback UI hoặc refetch.
- Nếu token hết hạn, redirect login.

## Visual Polish

- Admin UI ưu tiên mật độ thông tin, dễ scan.
- Customer UI ưu tiên thao tác nhanh trên mobile.
- Không để text tràn container.
- Không làm landing page thay cho app vận hành.

## Kết Quả Mong Muốn

- UI realtime ổn định khi order/status/payment thay đổi.
- Người dùng hiểu chuyện gì đang xảy ra khi mạng chậm hoặc API lỗi.
- Sản phẩm có cảm giác hoàn thiện, không chỉ chạy được happy path.

