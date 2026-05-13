# Phase 1 - Project Setup

## Mục Tiêu

Khởi tạo nền tảng project để các module sau có thể phát triển nhất quán.

## Backend Setup

- Tạo project Node.js với TypeScript.
- Chọn framework API: Express hoặc Fastify.
- Cấu hình lint, format, typecheck.
- Tạo cấu trúc API layer-first:
  - `src/routes`
  - `src/controllers`
  - `src/services`
  - `src/repositories`
  - `src/schemas`
  - `src/middlewares`
  - `src/types`
  - `src/shared`
  - `src/shared`
- Tạo health check endpoint.
- Tạo global error handler.
- Tạo request logger cơ bản.

## Frontend Setup

- Tạo ReactJS app với TypeScript.
- Cấu hình routing cho admin và customer QR.
- Cấu hình lint, format, typecheck cho frontend.
- Tạo cấu trúc thư mục frontend:
  - `src/app`
  - `src/pages`
  - `src/features`
  - `src/components`
  - `src/lib`
  - `src/styles`
- Tạo API client typed để gọi backend.
- Tạo layout nền cho admin app.
- Tạo layout mobile-first cho customer QR app.

## Environment

- Tạo `.env.example`.
- Chuẩn bị biến môi trường:
  - `DATABASE_URL`
  - `REDIS_URL`
  - `JWT_SECRET`
  - `PORT`
  - `NODE_ENV`

## Docker Local

- Tạo Docker Compose cho MySQL và Redis.
- Tạo script chạy local development.

## Kết Quả Mong Muốn

- Project chạy được local.
- Có endpoint health check.
- Có cấu trúc folder ổn định.
- Có script `dev`, `build`, `typecheck`, `lint`, `test` cho phần backend và frontend.
