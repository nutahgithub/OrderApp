# Smart Restaurant OS - Huong Dan Su Dung Du An

Tai lieu nay huong dan cach cau hinh moi truong, chay du an local, thao tac database, va review cac flow business tren man hinh.

## 1. Tong Quan Du An

Smart Restaurant OS la he thong SaaS multi-tenant cho nha hang/cafe.

Thanh phan chinh:

- API: Node.js, TypeScript, Express, Prisma, MySQL, Redis, Socket.IO.
- Web: React, TypeScript, Vite.
- Database: MySQL.
- Realtime/cache/rate-limit support: Redis.
- Upload anh: local storage hoac MinIO.
- Kien truc code API: routes, controllers, services, repositories, schemas, shared.

URL local mac dinh:

- Web admin/customer: `http://localhost:5173`
- API: `http://localhost:4000`
- MinIO console: `http://localhost:9001`
- MySQL: `localhost:3306`
- Redis: `localhost:6379`

## 2. Yeu Cau Cai Dat

Can co:

- Node.js `>=20`
- npm
- Docker Desktop hoac Docker Engine
- MySQL client neu muon tu kiem tra DB

Kiem tra nhanh:

```powershell
node -v
npm -v
docker --version
```

## 3. Cai Dat Lan Dau

Tu thu muc goc project:

```powershell
npm install
```

Copy env mau neu chua co `.env`:

```powershell
Copy-Item .env.example .env
```

Khoi dong ha tang local:

```powershell
docker compose up -d
```

Kiem tra container:

```powershell
docker ps
```

Database MySQL se duoc tao theo `docker-compose.yml` voi database chinh `orderapp`.

## 4. Cau Hinh Moi Truong

File `.env` nam o root project. API tu dong tim file `.env` tu thu muc hien tai di len, nen ca API va scripts Prisma cung doc file nay.

### Runtime

```env
NODE_ENV=development
PORT=4000
```

- `NODE_ENV`: `development | test | production`.
- `PORT`: port API Express lang nghe.

### Database

```env
DATABASE_URL="mysql://orderapp:orderapp@localhost:3306/orderapp"
SHADOW_DATABASE_URL="mysql://root:root@localhost:3306/orderapp_shadow"
REDIS_URL="redis://localhost:6379"
```

- `DATABASE_URL`: database chinh cua app.
- `SHADOW_DATABASE_URL`: chi can cho `prisma migrate dev` khi Prisma can shadow DB de kiem tra drift/tao migration moi. App runtime va `migrate deploy` khong can DB nay ton tai.
- `REDIS_URL`: Redis cho cac phan ho tro nhu rate limit/realtime infrastructure.

Neu muon dung `prisma migrate dev`, tao shadow DB truoc:

```sql
CREATE DATABASE orderapp_shadow;
```

Trong moi truong non-interactive, nen dung `migrate deploy` de apply migration da co san.

### Security

```env
JWT_SECRET="change-me-in-local-development"
```

- Dung de ky JWT admin.
- Production phai doi thanh chuoi dai, ngau nhien, khong commit vao git.

### Logging

```env
LOG_LEVEL=info
```

Gia tri hop le:

- `debug`
- `info`
- `warn`
- `error`

### Audit Log

```env
AUDIT_LOG_ENABLED=true
```

Gia tri hop le:

- `true`: ghi audit logs cho cac action quan trong.
- `false`: tat audit write va audit list query. Cac flow chinh khong insert/query bang `audit_logs`.

Khi doi bien nay, restart API de co hieu luc.

### Public URLs

```env
WEB_APP_URL="http://localhost:5173"
API_PUBLIC_URL="http://localhost:4000"
```

- `WEB_APP_URL`: origin frontend, dung cho CORS va build QR URL.
- `API_PUBLIC_URL`: URL public cua API, dung de build link upload local.

### Upload Storage

```env
UPLOAD_STORAGE_PROVIDER="local"
LOCAL_UPLOAD_DIR="uploads"
LOCAL_UPLOAD_PUBLIC_PATH="/uploads"
```

Gia tri `UPLOAD_STORAGE_PROVIDER`:

- `local`: luu file vao thu muc local.
- `minio`: luu file vao MinIO/S3-compatible storage.

Neu dung `local`, file duoc luu trong `LOCAL_UPLOAD_DIR` va public qua `LOCAL_UPLOAD_PUBLIC_PATH`.

### MinIO

```env
MINIO_ENDPOINT="http://localhost:9000"
MINIO_PUBLIC_URL="http://localhost:9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="orderapp"
MINIO_REGION="us-east-1"
```

Chi can khi `UPLOAD_STORAGE_PROVIDER=minio`.

### Frontend

```env
VITE_API_BASE_URL="http://localhost:4000"
```

- Bien `VITE_` duoc Vite expose cho browser.
- Neu doi API URL production, can build lai web.

## 5. Database Migration Va Seed

Generate Prisma Client:

```powershell
npm.cmd run prisma:generate
```

Kiem tra migration status:

```powershell
npm.cmd run prisma:status
```

Apply migration da co san trong repo:

```powershell
npm.cmd run prisma --workspace apps/api -- migrate deploy
```

Lenh `npm.cmd run prisma:migrate` dang map toi `prisma migrate dev`. Lenh nay huu ich khi tao migration moi trong moi truong interactive, nhung co the bi Prisma chan trong terminal non-interactive.

Seed du lieu demo:

```powershell
npm.cmd run prisma:seed
```

Seed tao:

- Tenant: `Demo Restaurant`
- Branch: `Main Branch`
- Table: `Table 1`
- Menu item: `House Coffee`
- Admin OWNER:
  - Email: `admin@example.com`
  - Password: `admin123456`

## 6. Chay Du An Local

Chay API va Web cung luc:

```powershell
npm.cmd run dev
```

Hoac chay rieng:

```powershell
npm.cmd run dev:api
npm.cmd run dev:web
```

Mo trinh duyet:

```text
http://localhost:5173/admin/login
```

Dang nhap demo:

```text
Email: admin@example.com
Password: admin123456
```

## 7. Lenh Kiem Tra Chat Luong

Typecheck ca API va Web:

```powershell
npm.cmd run typecheck
```

Lint:

```powershell
npm.cmd run lint
```

Test:

```powershell
npm.cmd run test
```

Build:

```powershell
npm.cmd run build
```

Neu Windows PowerShell chan `npm.ps1`, dung `npm.cmd` nhu cac vi du tren.

## 8. Health Check API

API health:

```text
GET http://localhost:4000/health
GET http://localhost:4000/health/ready
GET http://localhost:4000/health/metrics
```

Expected:

- `/health`: API dang song.
- `/health/ready`: database reachable.
- `/health/metrics`: metrics co ban nhu request/error/order-created.

## 9. Tong Quan Role Admin

Role hien co:

- `OWNER`: co toan quyen admin, luon duoc pass middleware role.
- `MANAGER`: quan ly setup, menu, dashboard, audit logs.
- `STAFF`: thao tac van hanh order/table sales.

UI se an/chan cac route/action theo role. API van la nguon enforce chinh.

## 10. Flow Business Tren Man Hinh

### 10.1 Dang Nhap Admin

Route:

```text
/admin/login
```

Buoc test:

1. Nhap email/password admin.
2. Submit form.
3. Neu dung, web luu token va vao dashboard.
4. Neu sai, UI hien loi login.

Audit:

- Neu `AUDIT_LOG_ENABLED=true`, login thanh cong tao event `ADMIN_LOGIN`.

### 10.2 Dashboard

Route:

```text
/admin/dashboard
```

Muc dich:

- Xem doanh thu.
- Xem tong so order.
- Xem order dang xu ly.
- Xem mon ban chay.
- Xem tong hop order theo status.

Bo loc:

- Start date
- End date
- Branch hoac All branches

Smoke test:

1. Tao mot order va thanh toan.
2. Ve dashboard.
3. Chon date range dung ngay tao order.
4. Kiem tra revenue/order count cap nhat.

### 10.3 Quan Ly Branch

Route:

```text
/admin/branches
```

Muc dich:

- Tao chi nhanh.
- Sua ten chi nhanh.
- Xoa chi nhanh neu chua co table/order.

Smoke test:

1. Tao branch moi.
2. Sua ten branch.
3. Xoa branch vua tao neu chua co table/order.
4. Thu xoa branch da co table/order, API/UI phai chan.

Audit:

- `BRANCH_CREATED`
- `BRANCH_UPDATED`
- `BRANCH_DELETED`

### 10.4 Quan Ly Table Va QR

Route:

```text
/admin/tables
```

Muc dich:

- Chon branch.
- Tao table.
- Sua ten/trang thai table.
- Copy QR URL cho table.

Trang thai table:

- `AVAILABLE`: khach co the dat mon.
- `OCCUPIED`: ban dang co khach/dang dung.
- `DISABLED`: QR khong cho dat mon.

Smoke test:

1. Chon branch.
2. Tao table.
3. Copy QR URL.
4. Mo QR URL trong tab moi.
5. Chuyen table sang `DISABLED`, QR page phai bao ban khong kha dung.

Audit:

- `TABLE_CREATED`
- `TABLE_UPDATED`

### 10.5 Quan Ly Menu

Route:

```text
/admin/menus
```

Muc dich:

- Tao mon.
- Sua ten, gia, anh, trang thai hien thi.
- Upload anh mon.
- An/hien mon tren QR menu.
- Xoa mon neu mon chua tung duoc goi.

Smoke test:

1. Tao mon voi gia hop le.
2. Upload anh neu can.
3. Tat `Available to customers`, mo QR menu kiem tra mon bi an.
4. Bat lai, QR menu hien mon.
5. Thu xoa mon da tung co order, API/UI phai chan.

Audit:

- `MENU_CREATED`
- `MENU_UPDATED`
- `MENU_DELETED`
- `MENU_IMAGE_UPLOADED`

### 10.6 Customer QR Ordering

Route mau:

```text
/qr/:tenantId/:branchId/:tableId
```

Muc dich:

- Khach mo QR table.
- Xem branch/table.
- Xem menu active.
- Them mon vao cart.
- Gui order.
- Xem tracking order.

Smoke test:

1. Copy QR URL tu `/admin/tables`.
2. Mo QR URL.
3. Chon mon, tang/giam so luong.
4. Submit order.
5. Man hinh tracking hien order total/status.

Luu y:

- Customer QR la public endpoint.
- Server tinh total, khong tin total tu client.
- Idempotency key chan duplicate submit.

### 10.7 Admin Orders

Route:

```text
/admin/orders
```

Muc dich:

- Xem order theo branch.
- Loc theo status/date.
- Xem chi tiet order items.
- Cap nhat order status.
- Xac nhan thanh toan.

Order status hien co:

- `PENDING`
- `CONFIRMED`
- `PREPARING`
- `READY`
- `SERVED`
- `CANCELLED`
- `PAID`

Transition hop le:

- `PENDING` -> `CONFIRMED` hoac `CANCELLED`
- `CONFIRMED` -> `PREPARING` hoac `CANCELLED`
- `PREPARING` -> `READY` hoac `CANCELLED`
- `READY` -> `SERVED` hoac `CANCELLED`
- `SERVED` -> thanh toan de thanh `PAID`
- `CANCELLED` va `PAID` la trang thai ket thuc

Smoke test:

1. Tao order tu QR.
2. Vao `/admin/orders`.
3. Chon branch dung.
4. Kiem tra order moi hien len.
5. Cap nhat status theo dung thu tu.
6. Thu nhay status sai, API/UI phai chan.

Audit:

- `ORDER_STATUS_UPDATED`

### 10.8 Payment Confirm

Nam trong man hinh:

```text
/admin/orders
```

Muc dich:

- Xac nhan thu tien mat cho order.
- Tao payment record.
- Chuyen order sang `PAID`.
- Chan duplicate payment bang idempotency key.

Smoke test:

1. Tao order.
2. Dua order toi status co the thanh toan.
3. Bam confirm payment.
4. Order chuyen sang `PAID`.
5. Bam lai payment, he thong phai chan duplicate.

Audit:

- `PAYMENT_CONFIRMED`

### 10.9 Table Sales

Route:

```text
/admin/table-sales
```

Muc dich:

- Staff tao order tai quay/theo ban.
- Chon table.
- Xem order chua thanh toan cua table.
- Them/sua mon trong order chua thanh toan.
- Ho tro flow phuc vu tai ban khong qua customer QR.

Smoke test:

1. Chon branch/table.
2. Chon mon vao cart.
3. Tao order.
4. Sua mon neu order chua paid/cancelled.
5. Thanh toan order tu order detail.

### 10.10 Audit Logs

Route:

```text
/admin/audit-logs
```

Role:

- `OWNER`
- `MANAGER`

Muc dich:

- Xem lich su thao tac quan trong.
- Loc theo action.
- Loc theo resource type.
- Pagination.

Audit action hien co:

- `ADMIN_LOGIN`
- `BRANCH_CREATED`
- `BRANCH_UPDATED`
- `BRANCH_DELETED`
- `TABLE_CREATED`
- `TABLE_UPDATED`
- `MENU_CREATED`
- `MENU_UPDATED`
- `MENU_DELETED`
- `ORDER_STATUS_UPDATED`
- `PAYMENT_CONFIRMED`
- `MENU_IMAGE_UPLOADED`

Resource type hien co:

- `ADMIN_USER`
- `BRANCH`
- `TABLE`
- `MENU`
- `ORDER`
- `PAYMENT`
- `UPLOAD`

Neu `AUDIT_LOG_ENABLED=false`:

- API khong query bang `audit_logs`.
- UI hien thong bao audit dang tat.
- Cac flow chinh van chay binh thuong.

## 11. Realtime Behavior

Realtime dung Socket.IO.

Expected:

- Customer tao order tu QR, admin order list nhan order moi khong can reload neu socket dang ket noi.
- Admin update status, customer tracking nhan status moi neu socket dang ket noi.
- Neu socket loi, UI van co fallback refresh.

Smoke test:

1. Mo admin orders tren mot tab.
2. Mo QR customer tren tab khac.
3. Tao order tu QR.
4. Admin thay order moi/toast.
5. Admin update status.
6. Customer thay status moi hoac refresh de thay.

## 12. Upload Anh

Mac dinh local:

```env
UPLOAD_STORAGE_PROVIDER="local"
LOCAL_UPLOAD_DIR="uploads"
LOCAL_UPLOAD_PUBLIC_PATH="/uploads"
```

Flow:

1. Admin vao `/admin/menus`.
2. Chon anh khi tao/sua menu.
3. API validate size/content type theo schema hien co.
4. File duoc luu local va URL duoc gan vao menu.

Neu dung MinIO:

1. Dam bao service `minio` dang chay.
2. Doi `.env`:

```env
UPLOAD_STORAGE_PROVIDER="minio"
```

3. Restart API.
4. Upload lai anh.

## 13. Multi-Tenant Va Bao Mat Du Lieu

Moi bang nghiep vu chinh co `tenantId`.

Nguyen tac:

- Admin token chua `tenantId`.
- API admin filter query theo `tenantId` tu token.
- Public QR endpoint nhan `tenantId/branchId/tableId` tu URL va validate quan he.
- Tenant A khong doc/ghi du lieu tenant B.
- Audit logs cung filter theo tenant.

Smoke test tenant isolation:

1. Tao hai tenant/admin khac nhau neu co seed/test data.
2. Login admin tenant A.
3. Goi list branches/orders/audit logs.
4. Dam bao khong thay du lieu tenant B.

## 14. Loi Thuong Gap

### API tra INTERNAL_ERROR sau khi them migration

Thuong do DB chua apply migration.

Kiem tra:

```powershell
npm.cmd run prisma:status
```

Apply:

```powershell
npm.cmd run prisma --workspace apps/api -- migrate deploy
```

Restart API sau khi migrate.

### `prisma migrate dev` bao non-interactive

Trong terminal cua agent/CI, Prisma co the chan `migrate dev`.

Dung apply migration da co san:

```powershell
npm.cmd run prisma --workspace apps/api -- migrate deploy
```

Chi dung `migrate dev` khi ban can tao migration moi trong terminal interactive.

### Khong thay `orderapp_shadow`

Binh thuong neu chua dung `prisma migrate dev`.

App runtime va `migrate deploy` khong can DB shadow.

### PowerShell chan `npm`

Neu gap loi `npm.ps1 cannot be loaded`, dung:

```powershell
npm.cmd run dev
```

### Web khong goi duoc API

Kiem tra:

- API co chay port `4000` khong.
- `.env` co `WEB_APP_URL="http://localhost:5173"` khong.
- Web co `VITE_API_BASE_URL="http://localhost:4000"` khong.
- Restart web sau khi doi `VITE_API_BASE_URL`.

### Upload anh khong hien

Neu local storage:

- Kiem tra file co trong `uploads`.
- Kiem tra `API_PUBLIC_URL`.
- Kiem tra API expose `/uploads`.

Neu MinIO:

- Kiem tra MinIO service.
- Kiem tra bucket/policy.
- Kiem tra `MINIO_PUBLIC_URL`.

## 15. Checklist Smoke Test Day Du

Chay sau khi setup local hoac sau deploy:

1. API `/health` tra ok.
2. Login admin demo thanh cong.
3. Tao branch moi.
4. Tao table trong branch.
5. Copy QR URL.
6. Tao menu item active.
7. Mo QR URL va thay menu.
8. Customer tao order.
9. Admin thay order moi.
10. Admin update status theo dung transition.
11. Customer tracking thay status moi hoac refresh thay.
12. Admin confirm payment.
13. Dashboard hien revenue/order trong date range.
14. Upload anh menu thanh cong.
15. Audit logs hien login/setup/order/payment/upload neu `AUDIT_LOG_ENABLED=true`.
16. Doi `AUDIT_LOG_ENABLED=false`, restart API, thao tac menu/order van chay va audit page bao disabled.

## 16. Ghi Chu Khi Lam Feature Moi

Truoc khi implement step moi, doc:

- `docs/PROJECT_RULES.md`
- `docs/plan/00_implementation_sequence.md`
- File step trong `docs/plan/steps/`

Nguyen tac:

- Chi lam scope cua step.
- Lam vertical slice: DB/API, UI, test/smoke.
- Service chua business logic.
- Controller chi validate request va goi service.
- Repository chi query DB.
- Moi query du lieu nghiep vu phai filter tenant.
- Chay typecheck/lint/test phu hop truoc khi coi la xong.
