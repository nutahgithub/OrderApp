# Step 01 - Project Foundation

## Mục Tiêu

Khởi tạo nền tảng backend và frontend để các step sau có thể triển khai theo vertical slice.

## Plan Cần Đọc

- `docs/PROJECT_RULES.md`
- `docs/plan/01_project_setup.md`
- `docs/plan/02_database_multi_tenant.md`
- `docs/plan/10a_frontend_foundation.md`

## Backend Cần Làm

- Khởi tạo Node.js TypeScript app.
- Chọn Express hoặc Fastify theo hướng đơn giản, ổn định.
- Tạo cấu trúc modular monolith.
- Tạo health check endpoint.
- Tạo global error handler.
- Tạo request logger cơ bản.
- Cấu hình Prisma.
- Chuẩn bị MySQL và Redis local bằng Docker Compose nếu phù hợp.
- Tạo `.env.example`.

## Frontend Cần Làm

- Khởi tạo ReactJS TypeScript app.
- Tạo routing nền cho admin và customer.
- Tạo admin app shell cơ bản.
- Tạo customer mobile shell cơ bản.
- Tạo typed API client foundation.
- Tạo shared UI foundation tối thiểu: button, input, loading, error, empty state.

## Test / Smoke Test

- Backend chạy local được.
- Frontend chạy local được.
- Health check API trả thành công.
- Frontend gọi được health check hoặc hiển thị app shell không lỗi.
- Chạy typecheck/lint nếu đã có script.

## Hoàn Thành Khi

- Có cấu trúc backend/frontend rõ ràng.
- Có script chạy dev.
- Có Prisma setup ban đầu.
- Có route admin/customer nền.
- Bạn có thể mở frontend và thấy app shell.

