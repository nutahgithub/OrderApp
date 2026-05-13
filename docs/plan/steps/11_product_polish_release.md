# Step 11 - Product Polish & Release Readiness

## Mục Tiêu

Hoàn thiện trải nghiệm sản phẩm, kiểm tra flow tổng thể, và chuẩn bị release/deploy.

## Plan Cần Đọc

- `docs/PROJECT_RULES.md`
- `docs/plan/10d_frontend_realtime_states.md`
- `docs/plan/11_deployment_observability.md`
- `docs/plan/12_testing_quality_release.md`

## Việc Cần Làm

- Rà soát loading/error/empty states toàn bộ app.
- Kiểm tra responsive admin và customer mobile.
- Rà soát text tràn, layout vỡ, form validation.
- Rà soát tenant isolation ở các flow chính.
- Chuẩn bị Dockerfile production nếu chưa có.
- Chuẩn bị deploy checklist.
- Chuẩn bị logging/health check/observability cơ bản.

## Test / Smoke Test

- Admin login.
- Admin tạo branch.
- Admin tạo table và mở QR.
- Admin tạo menu.
- Customer scan QR và tạo order.
- Admin nhận/xem order.
- Admin cập nhật status.
- Customer thấy status mới nếu realtime đã bật.
- Admin thanh toán order.
- Admin xem dashboard.
- Chạy typecheck/lint/test.

## Hoàn Thành Khi

- Demo end-to-end chạy ổn.
- Các lỗi UX rõ ràng đã được xử lý.
- Có checklist deploy/release.
- Project sẵn sàng bước sang triển khai production hoặc beta.

