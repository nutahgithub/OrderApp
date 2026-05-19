# Step 21 - Order Notes & Cancel Reason

## Muc Tieu

Cho khach va nhan vien ghi chu order, dong thoi luu ly do khi huy order.

## Can Doc Truoc

- `docs/PROJECT_RULES.md`
- `docs/plan/steps/14_order_status_transition.md`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/services/order.service.ts`
- `apps/web/src/pages/customer/CustomerQrEntryPage.tsx`
- `apps/web/src/pages/admin/AdminOrdersPage.tsx`

## Scope

- Them note cho order.
- Them note cho tung order item neu scope van nho.
- Them cancel reason khi status sang `CANCELLED`.
- Hien note/reason trong admin order detail.
- Realtime update van dung khi order bi huy/cap nhat.

## Ngoai Scope

- Khong lam refund.
- Khong lam partial cancel tung item neu phuc tap qua.
- Khong lam kitchen print.

## Test / Smoke Test

- Customer tao order co note.
- Admin thay note trong order detail.
- Huy order bat buoc co reason.
- Cancel reason khong leak sang tenant khac.

## Hoan Thanh Khi

- Ghi chu va ly do huy duoc luu/hien thi dung.
- Status transition Step 14 van duoc ton trong.
