# Step 28 - Reservation & Optional Customer Profile

## Muc Tieu

Them dat ban co ban va thong tin khach tuy chon ma khong bat buoc customer QR order.

## Can Doc Truoc

- `docs/PROJECT_RULES.md`
- `docs/plan/steps/23_table_status_operations.md`
- `apps/api/prisma/schema.prisma`
- `apps/web/src/pages/customer/CustomerQrEntryPage.tsx`

## Scope

- Reservation: branch, table optional, time, party size, customer name/phone, note.
- Admin UI list/create/update/cancel reservation.
- Customer profile optional khi dat QR order: name/phone/note.
- Luu thong tin toi thieu, tranh PII khong can thiet.

## Ngoai Scope

- Khong lam loyalty/points.
- Khong SMS/email reminder.
- Khong online booking public page day du neu scope qua lon.

## Test / Smoke Test

- Admin tao reservation.
- Reservation khong leak tenant khac.
- Customer QR order van dat duoc khi bo trong name/phone.
- Neu nhap name/phone thi admin thay trong order.

## Hoan Thanh Khi

- Nha hang co dat ban co ban.
- QR order van nhanh va khong bat khach dang ky.
