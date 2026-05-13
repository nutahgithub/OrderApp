# Phase 11 - Deployment & Observability

## Mục Tiêu

Chuẩn bị triển khai AWS ổn định cho SaaS.

## AWS Components

- ECS cho API service.
- RDS MySQL.
- Redis managed hoặc tương đương.
- S3 nếu cần lưu asset/file.
- CloudWatch logs và metrics.

## Deployment Work

- Dockerfile production.
- Environment variable checklist.
- Migration strategy cho Prisma.
- Health check route.
- CI/CD pipeline nếu scope cho phép.

## Observability

- Structured logging.
- Request id/correlation id.
- Error logging.
- Basic metrics:
  - request count
  - error count
  - latency
  - order created count

## Kết Quả Mong Muốn

- Có thể build image production.
- Có checklist deploy rõ.
- Service có health check và logs đủ debug.

