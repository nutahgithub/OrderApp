# Phase 2 - Database & Multi-Tenant Foundation

## Mục Tiêu

Thiết kế database nền cho SaaS multi-tenant, đảm bảo mọi dữ liệu nghiệp vụ được cô lập theo tenant.

## Prisma Models Ban Đầu

- `Tenant`
- `Branch`
- `RestaurantTable`
- `Menu`
- `Order`
- `OrderItem`
- Các timestamp chuẩn: `createdAt`, `updatedAt`.

## Tenant Rules

- Các model nghiệp vụ phải có `tenantId`.
- Query phải luôn filter theo `tenantId`.
- Service layer nhận tenant context trước khi xử lý dữ liệu.
- Không để controller tự build tenant filtering phức tạp.

## Database Notes

- `orders.total` và `menus.price` cần dùng decimal-safe type.
- `orders.status` nên dùng enum.
- `tables.status` nên dùng enum.
- Tạo index cho các cặp thường query:
  - `tenantId`
  - `tenantId, branchId`
  - `tenantId, tableId`
  - `orderId`

## Repository/Service Foundation

- Tạo Prisma client singleton hoặc module provider.
- Tạo transaction helper nếu framework cần.
- Tạo convention cho repository:
  - Nhận `tenantId`.
  - Không expose query cross-tenant mặc định.

## Kết Quả Mong Muốn

- Prisma schema đầu tiên hoàn chỉnh.
- Migration chạy được local.
- Có seed tối thiểu cho tenant/branch/table/menu test.
- Có guideline rõ cho tenant isolation.

