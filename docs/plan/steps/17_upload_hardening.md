# Step 17 - Upload Hardening

## Muc Tieu

Lam upload anh menu an toan hon truoc khi dung production.

## Can Doc Truoc

- `docs/PROJECT_RULES.md`
- `docs/deployment_guide.md`
- `apps/api/src/services/upload.service.ts`
- `apps/api/src/schemas/upload.schema.ts`
- `apps/web/src/pages/admin/AdminMenusPage.tsx`

## Scope

- Kiem tra magic bytes cho JPEG/PNG/WebP.
- Giu gioi han size hien co hoac cau hinh qua env neu can.
- Luu metadata upload theo tenant neu can cho audit/cleanup.
- Dam bao path/key khong cho path traversal.
- Neu menu doi anh, co ke hoach replace/cleanup anh cu neu storage ho tro.

## Ngoai Scope

- Khong tich hop S3 production moi neu MinIO/local hien tai du cho beta.
- Khong lam crop editor frontend.
- Khong lam CDN invalidation.

## Test / Smoke Test

- File gia mao content type bi reject.
- Anh JPEG/PNG/WebP hop le upload duoc.
- File qua lon bi reject.
- URL public anh menu van hien tren admin/customer.

## Hoan Thanh Khi

- Upload validation khong chi dua vao client/content type.
- Smoke upload menu image pass.
