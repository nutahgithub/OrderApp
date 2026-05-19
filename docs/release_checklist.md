# Release Checklist

Use this checklist before production or beta deploy.

Deployment guide: `docs/deployment_guide.md`.

## Environment

- Copy `.env.example` into the target secret store and replace all local defaults.
- Set `NODE_ENV=production`.
- Set `WEB_APP_URL` to the deployed web origin.
- Set `API_PUBLIC_URL` and `VITE_API_BASE_URL` to the deployed API origin.
- Use production `DATABASE_URL`, `SHADOW_DATABASE_URL`, `REDIS_URL`, and a strong `JWT_SECRET`.
- Choose upload storage: `local` only for single-node beta, `minio` or object storage for durable production assets.

## Build Artifacts

- API image: `docker build -f apps/api/Dockerfile -t orderapp-api:release .`
- Web image: `docker build -f apps/web/Dockerfile --build-arg VITE_API_BASE_URL=https://api.example.com -t orderapp-web:release .`
- API health endpoint: `GET /health`.
- API readiness endpoint: `GET /health/ready`.
- API metrics endpoint: `GET /health/metrics`.
- Web health endpoint: `GET /healthz`.

## Database

- Run `npm run prisma:status` against the target database before deploy.
- Run Prisma migrations as a one-off release task before starting new API tasks.
- Run seed only for beta/demo environments, not for a live production tenant unless explicitly planned.

## Smoke Test

- Admin login succeeds with the intended admin account.
- Admin creates a branch.
- Admin creates a table and opens/copies the QR URL.
- Admin creates an active menu item.
- Customer opens the QR URL and creates an order.
- Admin sees the order, including realtime notification when enabled.
- Admin updates order status and customer tracking reflects the change or can refresh manually.
- Admin confirms payment.
- Admin dashboard shows the order and revenue in the selected date range.

## Observability

- API logs are structured JSON and include `requestId`.
- 4xx and 5xx responses appear in logs with error code context.
- `/health/metrics` shows request count, error count, latency, and order-created count.
- Container health checks are wired to the platform load balancer or service scheduler.
