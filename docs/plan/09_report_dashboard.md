# Phase 9 - Report & Revenue Dashboard

## Mục Tiêu

Xây dashboard doanh thu và báo cáo vận hành cho admin.

## Metrics Ban Đầu

- Tổng doanh thu theo ngày.
- Số order theo ngày.
- Doanh thu theo branch.
- Top menu items.
- Order theo status.

## API Notes

- Dashboard endpoint cần JWT.
- Query phải filter theo `tenantId`.
- Cho phép filter theo:
  - date range
  - branch
  - status

## Performance Notes

- Tạo index cho các field báo cáo thường dùng.
- Với dữ liệu lớn, cân nhắc cache Redis hoặc pre-aggregation ở giai đoạn sau.

## Kết Quả Mong Muốn

- Admin xem được revenue dashboard.
- Dữ liệu không leak cross-tenant.
- Có test cho filter date range và tenant isolation.

