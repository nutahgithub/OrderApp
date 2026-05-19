# Deployment Guide

Tài liệu này lưu lại hướng deploy project Smart Restaurant OS để dùng lại khi chuẩn bị beta/production.

## Hướng Nhanh Cho Beta

Phương án đơn giản nhất:

- Web chạy bằng Nginx container.
- API chạy bằng Node container.
- MySQL và Redis dùng managed service hoặc Docker trên VPS.
- Reverse proxy bằng Caddy, Nginx, Traefik, hoặc load balancer của cloud provider.

Domain khuyến nghị:

- Web: `https://your-domain.com`
- API: `https://api.your-domain.com`

## Environment Production

Tạo env production dựa trên `.env.example`, rồi đổi các giá trị quan trọng:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL="mysql://..."
SHADOW_DATABASE_URL="mysql://..."
REDIS_URL="redis://..."
JWT_SECRET="replace-with-a-long-strong-secret"
WEB_APP_URL="https://your-domain.com"
API_PUBLIC_URL="https://api.your-domain.com"
VITE_API_BASE_URL="https://api.your-domain.com"
LOG_LEVEL=info
```

Lưu ý:

- `JWT_SECRET` phải đủ dài và không dùng giá trị local.
- `WEB_APP_URL` phải đúng origin của frontend để CORS hoạt động.
- `VITE_API_BASE_URL` được bake vào web image lúc build, đổi API URL thì phải build lại web image.
- Không dùng `local` upload nếu production chạy nhiều API instances; nên chuyển sang object storage hoặc MinIO/S3-compatible storage.

## Build Image

Build API:

```sh
docker build -f apps/api/Dockerfile -t orderapp-api:release .
```

Build Web:

```sh
docker build -f apps/web/Dockerfile --build-arg VITE_API_BASE_URL=https://api.your-domain.com -t orderapp-web:release .
```

## Database Migration

Trước khi mở traffic API mới, chạy migration như một job riêng:

```sh
npm run prisma:status
npm run prisma:migrate
```

Chỉ chạy seed cho beta/demo:

```sh
npm run prisma:seed
```

Không seed production thật nếu chưa có kế hoạch rõ ràng.

## Run Containers

API container expose port `4000`.

Web container expose port `80`.

Reverse proxy:

- `https://your-domain.com` -> web container port `80`
- `https://api.your-domain.com` -> API container port `4000`

## Health Checks

Kiểm tra API:

```sh
curl https://api.your-domain.com/health
curl https://api.your-domain.com/health/ready
curl https://api.your-domain.com/health/metrics
```

Kiểm tra Web:

```sh
curl https://your-domain.com/healthz
```

Expected:

- `/health` trả `status: ok`.
- `/health/ready` trả `status: ready` khi database reachable.
- `/health/metrics` có request count, error count, latency, và order-created count.
- `/healthz` trả `ok`.

## Manual Smoke Test

Sau deploy, test theo flow:

1. Admin login.
2. Admin tạo branch.
3. Admin tạo table và mở/copy QR URL.
4. Admin tạo active menu item.
5. Customer mở QR URL và tạo order.
6. Admin thấy order mới.
7. Admin cập nhật status.
8. Customer thấy status mới bằng realtime hoặc refresh.
9. Admin xác nhận thanh toán.
10. Admin dashboard hiển thị order/revenue trong date range.

Checklist chi tiết nằm ở `docs/smoke_test_step_11.md`.

## AWS Production Gợi Ý

Khi nâng lên production nghiêm túc:

- API: ECS Fargate.
- Web: S3 + CloudFront hoặc ECS/Nginx.
- Database: RDS MySQL.
- Redis: ElastiCache.
- Logs: CloudWatch Logs.
- Secrets: AWS Secrets Manager hoặc SSM Parameter Store.
- Upload assets: S3 hoặc storage S3-compatible.
- Migration: chạy bằng one-off ECS task trước rollout.

## Những Điểm Cần Nhớ

- Không commit env production.
- Không hard-code domain trong source; dùng env/build arg.
- Chạy migration trước khi rollout API.
- Bật health check trên scheduler/load balancer.
- Theo dõi structured logs có `requestId`.
- Chạy smoke test trước khi coi deploy là xong.
