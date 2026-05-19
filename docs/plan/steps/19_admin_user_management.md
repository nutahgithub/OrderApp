# Step 19 - Admin User Management

## Muc Tieu

Cho OWNER/MANAGER quan ly tai khoan admin trong tenant.

## Can Doc Truoc

- `docs/PROJECT_RULES.md`
- `docs/plan/steps/15_admin_rbac_minimal.md`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/services/auth.service.ts`
- `apps/web/src/components/layout/AdminLayout.tsx`

## Scope

- API list/create/update/disable admin users.
- Reset password hoac doi password cho admin.
- Gan role `OWNER`, `MANAGER`, `STAFF`.
- UI admin users don gian trong admin app.
- Khong cho user tu khoa/chuyen role minh thanh vo quyen neu gay mat access.

## Ngoai Scope

- Khong lam invite email.
- Khong lam branch scope neu muon tach tiep.
- Khong lam SSO/MFA.

## Test / Smoke Test

- Owner tao staff thanh cong.
- Manager khong tao OWNER neu rule khong cho.
- Disabled admin khong login duoc.
- User khong thao tac duoc tenant khac.

## Hoan Thanh Khi

- Tenant co the tu quan ly admin co ban.
- RBAC Step 15 van hoat dong dung voi user moi.
