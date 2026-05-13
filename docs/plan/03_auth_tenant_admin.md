# Phase 3 - Auth, Tenant Context & Admin

## Mục Tiêu

Xây auth cho admin, xác định tenant context cho mọi request quản trị.

## Auth Scope

- Customer order bằng QR không cần login.
- Admin đăng nhập bằng JWT.
- JWT chứa user id, tenant id, role hoặc permission scope.

## Chức Năng

- Admin login.
- Middleware xác thực JWT.
- Middleware tạo request context gồm:
  - `userId`
  - `tenantId`
  - `role`
- Endpoint lấy thông tin admin hiện tại.

## Tenant Admin

- Tạo tenant ban đầu qua seed hoặc endpoint nội bộ.
- Admin thuộc một tenant.
- Mọi API admin phải có tenant context.

## Security Notes

- Hash password bằng thư viện an toàn.
- Không log password/token.
- JWT secret bắt buộc qua env.
- Token expiry cần cấu hình rõ.

## Kết Quả Mong Muốn

- Admin login được.
- API admin reject request không có token.
- Service nhận tenant context từ middleware.
- Có test cho login và tenant context.

