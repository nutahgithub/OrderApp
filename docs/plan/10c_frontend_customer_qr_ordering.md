# Phase 10C - Frontend Customer QR Ordering

## Mục Tiêu

Xây giao diện mobile-first cho khách hàng scan QR tại bàn, chọn món và gửi order nhanh.

## QR Entry

- Route nhận `tenantId`, `branchId`, `tableId`.
- Tải thông tin bàn/chi nhánh nếu API hỗ trợ.
- Hiển thị tên bàn/chi nhánh rõ ràng.
- Nếu QR không hợp lệ, hiển thị lỗi dễ hiểu.

## Menu Browsing

- Hiển thị menu đang bán.
- Tìm kiếm món nếu danh sách dài.
- Nhóm món theo category nếu backend hỗ trợ sau này.
- Hiển thị tên, giá, trạng thái hết món nếu có.

## Cart

- Thêm món vào giỏ.
- Tăng/giảm số lượng.
- Xóa món khỏi giỏ.
- Tính tạm tổng ở UI để khách dễ xem.
- Server vẫn là nơi tính total cuối cùng.

## Submit Order

- Gửi order tới API.
- Disable nút khi đang gửi.
- Hiển thị lỗi nếu món/bàn không còn hợp lệ.
- Sau khi tạo order, chuyển sang màn hình order tracking.

## Order Tracking

- Hiển thị order summary.
- Hiển thị trạng thái hiện tại.
- Cập nhật trạng thái realtime qua Socket.IO.
- Có fallback refresh nếu socket mất kết nối.

## Mobile UX

- Tối ưu cho màn hình điện thoại.
- Nút gọi hành động dễ bấm.
- Cart summary luôn dễ thấy.
- Không cần khách đăng nhập.

## Kết Quả Mong Muốn

- Khách scan QR và đặt món được từ đầu đến cuối.
- UI rõ ràng khi loading/error/empty menu.
- Khách theo dõi được trạng thái order sau khi gửi.

