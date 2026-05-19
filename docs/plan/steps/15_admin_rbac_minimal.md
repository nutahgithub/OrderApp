# Step 15 - Minimal Admin RBAC

## Muc Tieu

Ap dung phan quyen toi thieu cho `OWNER`, `MANAGER`, `STAFF` dua tren role da co.

## Can Doc Truoc

- `docs/PROJECT_RULES.md`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/middlewares/auth.middleware.ts`
- `apps/api/src/routes`
- `apps/web/src/features/auth/AuthContext.tsx`

## Scope

- Tao helper/middleware require role.
- `OWNER`: toan quyen.
- `MANAGER`: quan ly branch/table/menu/order/payment/dashboard.
- `STAFF`: chi xu ly order/payment va doc du lieu can thiet.
- An/disable menu/action tren admin UI theo role.
- Tra 403 co error code ro khi khong du quyen.

## Ngoai Scope

- Khong lam man hinh quan ly admin users.
- Khong gan staff theo branch trong step nay neu schema chua co.
- Khong lam permission matrix phuc tap.

## Test / Smoke Test

- Staff khong tao/sua/xoa menu.
- Staff cap nhat order/payment duoc neu scope cho phep.
- Manager vao dashboard duoc.
- Request khong du role tra 403.

## Hoan Thanh Khi

- RBAC duoc ap dung o API, khong chi an UI.
- UI admin phan anh quyen co ban cua user dang login.
