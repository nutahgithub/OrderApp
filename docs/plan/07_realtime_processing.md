# Phase 7 - Realtime Processing

## Mục Tiêu

Dùng Socket.IO để cập nhật order realtime cho admin, bếp, thu ngân, và bàn.

## Room Strategy

- Tenant room: `tenant:{tenantId}`
- Branch room: `tenant:{tenantId}:branch:{branchId}`
- Table room: `tenant:{tenantId}:branch:{branchId}:table:{tableId}`

## Events Gợi Ý

- `order.created`
- `order.status_updated`
- `order.cancelled`
- `payment.completed`

## Server Flow

- Client kết nối socket.
- Admin socket cần auth JWT.
- Customer socket join theo QR/table context.
- Khi order được tạo, emit event tới branch room và table room.
- Khi status đổi, emit event tới branch room và table room.

## Security Notes

- Validate quyền join room.
- Không emit dữ liệu cross-tenant.
- Event payload chỉ chứa dữ liệu cần thiết.

## Kết Quả Mong Muốn

- Bếp/admin nhận order mới realtime.
- Customer thấy trạng thái order thay đổi.
- Có test hoặc integration check cho room naming và tenant isolation.

