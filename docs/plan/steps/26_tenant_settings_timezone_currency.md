# Step 26 - Tenant Settings Timezone & Currency

## Muc Tieu

Cho moi tenant cau hinh timezone va currency de report/bill hien dung thuc te.

## Can Doc Truoc

- `docs/PROJECT_RULES.md`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/services/report.service.ts`
- `apps/web/src/lib/format/date.ts`
- `apps/web/src/lib/format/currency.ts`

## Scope

- Them tenant settings cho timezone va currency.
- API doc/update settings cho OWNER/MANAGER.
- UI settings don gian trong admin.
- Report/bill/date display dung timezone/currency tenant.
- Validate timezone/currency theo danh sach an toan.

## Ngoai Scope

- Khong lam multi-language day du.
- Khong migrate lich su tien te phuc tap.
- Khong them tax/service charge.

## Test / Smoke Test

- Doi currency thi bill/dashboard format dung.
- Doi timezone thi date range report dung ngay local.
- Tenant A settings khong anh huong tenant B.

## Hoan Thanh Khi

- Tenant co cau hinh hien thi co ban.
- Report khong con mac dinh UTC/currency cung cho moi tenant.
