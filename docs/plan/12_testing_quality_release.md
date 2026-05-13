# Phase 12 - Testing, Quality & Release Checklist

## Mục Tiêu

Đảm bảo project có chất lượng ổn định trước khi release từng giai đoạn.

## Test Layers

- Unit test cho service/use-case.
- Integration test cho API chính.
- Database test cho transaction quan trọng.
- Realtime integration check cho Socket.IO events.

## Must-Test Areas

- Tenant isolation.
- Auth middleware.
- Create order transaction.
- Order total calculation.
- Invalid table/menu cases.
- Payment duplicate prevention.
- Report date range filtering.

## Quality Checks

- `typecheck`
- `lint`
- `test`
- Prisma migration check.
- Manual smoke test cho customer QR flow.
- Manual smoke test cho admin order flow.

## Release Checklist

- `.env.example` cập nhật.
- Migration chạy thành công.
- Seed data chạy thành công.
- Không có `any` không giải thích.
- Controller không chứa business logic.
- Plan và rule docs cập nhật theo scope thực tế.

## Kết Quả Mong Muốn

- Mỗi phase có checklist review được.
- Có test tối thiểu cho luồng lõi.
- Có tiêu chuẩn rõ để quyết định phase đã xong.

