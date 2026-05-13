# Step 02 - Auth Admin API + Login UI

## Mục Tiêu

Hoàn thành auth admin end-to-end: API đăng nhập, JWT context, và UI login.

## Plan Cần Đọc

- `docs/PROJECT_RULES.md`
- `docs/plan/03_auth_tenant_admin.md`
- `docs/plan/10a_frontend_foundation.md`
- `docs/plan/10b_frontend_admin_operations.md`

## API Cần Làm

- Tạo model/table cần thiết cho admin user nếu chưa có.
- Seed tenant và admin demo nếu cần.
- API admin login.
- Hash/verify password an toàn.
- JWT middleware.
- Tenant context middleware.
- API current admin.
- Chuẩn hóa auth error response.

## UI Cần Làm Ngay Sau API

- Trang `/admin/login`.
- Form email/password.
- Loading state khi login.
- Error state khi sai thông tin.
- Lưu auth state.
- Gắn token vào admin API requests.
- Protected admin routes.
- Logout.

## Test / Smoke Test

- Login thành công bằng admin seed.
- Login sai hiển thị lỗi.
- Route admin bị chặn nếu chưa login.
- Sau login, API current admin trả đúng tenant context.
- Chạy test/typecheck/lint nếu có script.

## Hoàn Thành Khi

- Admin đăng nhập từ UI được.
- Token được dùng cho API protected.
- Tenant context hoạt động.
- Bạn test OK màn hình login thì mới chuyển Step 03.

