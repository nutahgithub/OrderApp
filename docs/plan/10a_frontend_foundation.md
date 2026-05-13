# Phase 10A - Frontend Foundation

## Mục Tiêu

Tạo nền tảng ReactJS đủ chắc để xây admin app và customer QR app như một sản phẩm hoàn chỉnh.

## App Structure

- Chọn cấu trúc frontend phù hợp với repo:
  - Monorepo app `apps/web` nếu tách backend/frontend.
  - Hoặc folder `frontend` nếu project đơn giản hơn.
- Dùng TypeScript strict.
- Không dùng `any`.
- Tách code theo feature:
  - `auth`
  - `dashboard`
  - `branches`
  - `tables`
  - `menus`
  - `orders`
  - `payments`
  - `customer-order`

## Routing

- Admin routes:
  - `/admin/login`
  - `/admin/dashboard`
  - `/admin/branches`
  - `/admin/tables`
  - `/admin/menus`
  - `/admin/orders`
  - `/admin/payments`
- Customer QR routes:
  - `/qr/:tenantId/:branchId/:tableId`
  - `/qr/:tenantId/:branchId/:tableId/order/:orderId`

## API Client

- Tạo typed API client.
- Gắn JWT cho admin requests.
- Chuẩn hóa response/error handling.
- Tách public customer API và protected admin API.

## State & Data Fetching

- Chọn data fetching strategy phù hợp, ví dụ TanStack Query nếu được dùng.
- Cache danh sách menu, branch, table, dashboard data.
- Invalidate cache sau create/update/delete.

## UI Foundation

- Layout admin gồm sidebar/topbar/content.
- Layout customer mobile-first.
- Shared components:
  - Button
  - Input
  - Select
  - Modal/Dialog
  - Table/List
  - Toast
  - Loading state
  - Empty state
  - Error state

## Kết Quả Mong Muốn

- Frontend chạy local được.
- Routing admin/customer hoạt động.
- Login state và API client sẵn sàng.
- Có app shell đủ để các feature cắm vào.

