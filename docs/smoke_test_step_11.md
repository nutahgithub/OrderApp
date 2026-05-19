# Step 11 Smoke Test

Run this after build/typecheck/lint/test pass and services are started.

## Automated Checks

```sh
npm run typecheck
npm run lint
npm run test
npm run build
```

## API Checks

```sh
curl http://localhost:4000/health
curl http://localhost:4000/health/ready
curl http://localhost:4000/health/metrics
```

Expected:

- `/health` returns `status: ok`.
- `/health/ready` returns `status: ready` when MySQL is reachable.
- `/health/metrics` increments `http.requestCount` after requests.

## Manual End-To-End Flow

1. Start dependencies and seed data if needed.
2. Start the API and web app.
3. Sign in at `/admin/login`.
4. Create a branch.
5. Create a table in that branch and copy/open its QR URL.
6. Create an active menu item.
7. In the QR page, add items to cart and submit an order.
8. In admin orders, confirm the new order is visible.
9. Update order status and verify the QR tracking view updates live or via refresh.
10. Confirm payment.
11. Open dashboard and verify the order/revenue appears for the date range.
