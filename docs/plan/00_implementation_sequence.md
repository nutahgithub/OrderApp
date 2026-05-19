# Implementation Sequence - API + UI Theo Từng Chức Năng

## Mục Tiêu

Roadmap này là thứ tự triển khai chính của project. Không làm toàn bộ backend rồi mới làm frontend. Mỗi chức năng phải đi theo nhịp:

1. Database/model nếu cần.
2. API/service/use-case.
3. UI tương ứng.
4. Realtime nếu chức năng đó cần.
5. Test hoặc smoke test end-to-end.
6. Review rồi mới chuyển sang chức năng tiếp theo.

## File Plan Theo Thứ Tự Implement

Khi implement, hãy prompt theo từng file trong danh sách này. Chỉ chuyển sang file tiếp theo sau khi user test OK.

1. `docs/plan/steps/01_project_foundation.md`
2. `docs/plan/steps/02_auth_admin_login.md`
3. `docs/plan/steps/03_branch_management.md`
4. `docs/plan/steps/04_table_qr_management.md`
5. `docs/plan/steps/05_menu_management.md`
6. `docs/plan/steps/06_customer_order.md`
7. `docs/plan/steps/07_admin_order_operations.md`
8. `docs/plan/steps/08_realtime_order_updates.md`
9. `docs/plan/steps/09_payment.md`
10. `docs/plan/steps/10_report_dashboard.md`
11. `docs/plan/steps/11_product_polish_release.md`

## Prompt Mẫu

```text
Đọc docs/PROJECT_RULES.md và implement theo docs/plan/steps/01_project_foundation.md.
Chỉ làm scope trong file plan này.
Hoàn thành API + UI + smoke test theo đúng Definition of Done trong file.
Sau khi xong, báo tôi cách test để tôi review trước khi chuyển step tiếp theo.
```

## Tóm Tắt Các Step

### Step 01 - Project Foundation

Plan cần đọc:

- `01_project_setup.md`
- `02_database_multi_tenant.md`
- `10a_frontend_foundation.md`

Việc cần làm:

- Khởi tạo backend Node.js TypeScript.
- Khởi tạo frontend ReactJS TypeScript.
- Cấu hình lint, typecheck, test.
- Tạo Prisma, MySQL, Redis local setup.
- Tạo app shell frontend cho admin và customer.
- Tạo typed API client foundation.

Hoàn thành khi:

- Backend và frontend chạy local được.
- Health check API hoạt động.
- Frontend có routing admin/customer cơ bản.

### Step 02 - Auth Admin + Login UI

Plan cần đọc:

- `03_auth_tenant_admin.md`
- `10a_frontend_foundation.md`
- `10b_frontend_admin_operations.md`

API cần làm:

- Admin login.
- JWT middleware.
- Tenant context middleware.
- Endpoint current admin.

UI cần làm ngay sau API:

- Trang `/admin/login`.
- Auth state.
- Protected admin routes.
- Logout.
- Hiển thị lỗi login/loading state.

Hoàn thành khi:

- Admin login từ UI được.
- Token được gắn vào API requests.
- Route admin bị chặn nếu chưa login.

### Step 03 - Branch Management API + UI

Plan cần đọc:

- `04_branch_table_management.md`
- `10b_frontend_admin_operations.md`

API cần làm:

- Tạo chi nhánh.
- Sửa chi nhánh.
- Danh sách chi nhánh theo tenant.

UI cần làm ngay sau API:

- Trang `/admin/branches`.
- Danh sách chi nhánh.
- Form tạo/sửa chi nhánh.
- Loading/error/empty state.

Hoàn thành khi:

- Admin tạo và sửa chi nhánh từ UI được.
- Dữ liệu chi nhánh filter đúng theo tenant.

### Step 04 - Table + QR Management API + UI

Plan cần đọc:

- `04_branch_table_management.md`
- `10b_frontend_admin_operations.md`
- `10c_frontend_customer_qr_ordering.md`

API cần làm:

- Tạo bàn thuộc chi nhánh.
- Sửa tên/trạng thái bàn.
- Danh sách bàn theo chi nhánh.
- Tạo hoặc trả QR URL cho bàn.

UI cần làm ngay sau API:

- Trang `/admin/tables`.
- Filter bàn theo chi nhánh.
- Form tạo/sửa bàn.
- Hiển thị QR URL hoặc QR code.
- Chuẩn bị route customer `/qr/:tenantId/:branchId/:tableId`.

Hoàn thành khi:

- Admin tạo bàn và lấy QR URL từ UI được.
- Customer mở QR URL thấy được màn hình entry cơ bản.

### Step 05 - Menu Management API + UI

Plan cần đọc:

- `05_menu_management.md`
- `10b_frontend_admin_operations.md`
- `10c_frontend_customer_qr_ordering.md`

API cần làm:

- Tạo món.
- Sửa tên, giá, trạng thái.
- Danh sách menu admin.
- Public menu cho customer QR.

UI cần làm ngay sau API:

- Trang `/admin/menus`.
- Form tạo/sửa món.
- Toggle món đang bán.
- Customer QR hiển thị danh sách món đang bán.

Hoàn thành khi:

- Admin quản lý menu từ UI được.
- Customer QR xem được menu public.

### Step 06 - Customer Order API + Customer UI

Plan cần đọc:

- `06_order_module.md`
- `10c_frontend_customer_qr_ordering.md`

API cần làm:

- Tạo order bằng QR context.
- Server tính total.
- Validate table/menu/tenant.
- Lưu order và order items bằng transaction.
- Endpoint xem order summary.

UI cần làm ngay sau API:

- Customer chọn món.
- Cart tăng/giảm số lượng.
- Submit order.
- Màn hình order summary/tracking cơ bản.
- Giữ cart nếu submit lỗi.

Hoàn thành khi:

- Customer scan QR, chọn món, gửi order thành công từ UI.
- Order total do server tính và UI hiển thị lại theo response.

### Step 07 - Admin Order Operations API + UI

Plan cần đọc:

- `06_order_module.md`
- `10b_frontend_admin_operations.md`

API cần làm:

- Danh sách order theo chi nhánh.
- Chi tiết order.
- Cập nhật trạng thái order.

UI cần làm ngay sau API:

- Trang `/admin/orders`.
- Danh sách order theo status.
- Chi tiết order items.
- Nút cập nhật status.
- Loading/error/empty state.

Hoàn thành khi:

- Admin thấy order khách vừa tạo.
- Admin cập nhật trạng thái order từ UI được.

### Step 08 - Realtime Backend + Realtime UI

Plan cần đọc:

- `07_realtime_processing.md`
- `10d_frontend_realtime_states.md`

API/Socket cần làm:

- Socket.IO setup.
- Room theo tenant/branch/table.
- Emit `order.created`.
- Emit `order.status_updated`.

UI cần làm ngay sau socket:

- Admin order list nhận order mới realtime.
- Customer tracking nhận status mới realtime.
- Fallback refresh khi socket lỗi.

Hoàn thành khi:

- Customer tạo order, admin thấy order không cần reload.
- Admin đổi status, customer thấy trạng thái đổi không cần reload.

### Step 09 - Payment API + Payment UI

Plan cần đọc:

- `08_payment_module.md`
- `10b_frontend_admin_operations.md`
- `10d_frontend_realtime_states.md`

API cần làm:

- Xác nhận thanh toán.
- Chặn duplicate payment.
- Cập nhật order `PAID`.
- Emit `payment.completed`.

UI cần làm ngay sau API:

- Nút thanh toán trong order detail.
- Hiển thị trạng thái paid.
- Disable thanh toán lại.
- Cập nhật realtime/payment state.

Hoàn thành khi:

- Thu ngân/admin thanh toán order từ UI được.
- Order paid hiển thị đúng ở admin và customer nếu cần.

### Step 10 - Report API + Dashboard UI

Plan cần đọc:

- `09_report_dashboard.md`
- `10b_frontend_admin_operations.md`

API cần làm:

- Revenue summary.
- Order count.
- Top menu items.
- Filter theo date range và branch.

UI cần làm ngay sau API:

- Trang `/admin/dashboard`.
- Revenue cards.
- Chart/table báo cáo.
- Filter ngày/chi nhánh.

Hoàn thành khi:

- Admin xem dashboard bằng dữ liệu thật từ order/payment.
- Filter hoạt động đúng theo tenant.

### Step 11 - Product Polish & Release Readiness

Plan cần đọc:

- `10d_frontend_realtime_states.md`
- `11_deployment_observability.md`
- `12_testing_quality_release.md`

Việc cần làm:

- Hoàn thiện loading/error/empty states.
- Kiểm tra responsive admin/customer.
- Chạy typecheck/lint/test.
- Smoke test toàn bộ flow.
- Chuẩn bị Docker/deploy docs.

Hoàn thành khi:

- Demo được flow đầy đủ: admin setup branch/table/menu, customer QR order, admin nhận realtime, cập nhật status, thanh toán, xem dashboard.

### Step 12 - Rate Limit Public Order & Upload

Plan cần đọc:

- `steps/12_rate_limit_public_upload.md`

Việc cần làm:

- Them middleware rate limit cho public order va upload.
- Tra 429/error ro khi vuot nguong.
- Log route/IP/tenant/requestId neu co.

Hoàn thành khi:

- Spam order/upload bi chan.
- Flow order/upload hop le van chay.

### Step 13 - Order & Payment Idempotency

Plan cần đọc:

- `steps/13_order_payment_idempotency.md`

Việc cần làm:

- Them idempotency key cho create order.
- Them idempotency key cho confirm payment.
- Retry cung key tra ket qua an toan.

Hoàn thành khi:

- Duplicate order/payment do bam nhieu lan duoc chan.
- Test cover cung key/cung payload va cung key/khac payload.

### Step 14 - Order Status Transition Rules

Plan cần đọc:

- `steps/14_order_status_transition.md`

Việc cần làm:

- Dinh nghia transition hop le cho order.
- Validate trong service.
- UI chi hien action hop le.

Hoàn thành khi:

- Khong cap nhat nhay buoc/quay lui sai nghiep vu.
- Order paid/cancelled duoc bao ve.

### Step 15 - Minimal Admin RBAC

Plan cần đọc:

- `steps/15_admin_rbac_minimal.md`

Việc cần làm:

- Tao middleware/helper require role.
- Ap dung OWNER/MANAGER/STAFF cho API chinh.
- UI admin an/disable action theo role.

Hoàn thành khi:

- API tra 403 khi khong du quyen.
- UI phan anh role dang login.

### Step 16 - Audit Log Core Actions

Plan cần đọc:

- `steps/16_audit_log_core_actions.md`

Việc cần làm:

- Them audit log model/service.
- Ghi login, CRUD chinh, order status, payment, upload.
- Dam bao tenant isolation cho audit.

Hoàn thành khi:

- Action quan trong co audit record.
- Audit khong log password/token.

### Step 17 - Upload Hardening

Plan cần đọc:

- `steps/17_upload_hardening.md`

Việc cần làm:

- Kiem tra magic bytes file anh.
- Chong path traversal/key khong an toan.
- Them metadata/cleanup plan neu can.

Hoàn thành khi:

- File gia mao content type bi reject.
- Anh hop le van upload/hien thi duoc.

### Step 18 - Tenant & Realtime Isolation Tests

Plan cần đọc:

- `steps/18_tenant_realtime_isolation_tests.md`

Việc cần làm:

- Test tenant isolation cho API/repository/service.
- Test public QR sai context bi reject.
- Test realtime room join/emit khong leak.

Hoàn thành khi:

- Duong du lieu nhay cam co test isolation.
- Bug isolation neu phat hien duoc fix.

### Step 19 - Admin User Management

Plan cần đọc:

- `steps/19_admin_user_management.md`

Việc cần làm:

- API/UI list/create/update/disable admin users.
- Reset password hoac doi password.
- Gan role cho admin.

Hoàn thành khi:

- Tenant tu quan ly admin co ban.
- Disabled admin khong login duoc.

### Step 20 - Menu Categories & Availability

Plan cần đọc:

- `steps/20_menu_categories_availability.md`

Việc cần làm:

- Them category va sort order cho menu.
- Them out-of-stock/availability.
- Customer QR hien menu theo category.

Hoàn thành khi:

- Mon het hang khong dat duoc.
- Menu admin/customer ro rang hon.

### Step 21 - Order Notes & Cancel Reason

Plan cần đọc:

- `steps/21_order_notes_cancel_reason.md`

Việc cần làm:

- Them order note va item note neu scope cho phep.
- Them cancel reason.
- Hien note/reason trong admin order detail.

Hoàn thành khi:

- Customer/admin thay ghi chu dung.
- Huy order co ly do va realtime dung.

### Step 22 - Payment Methods & Printable Bill

Plan cần đọc:

- `steps/22_payment_methods_printable_bill.md`

Việc cần làm:

- Them payment method/reference.
- UI confirm payment co method/reference.
- Tao bill printable.

Hoàn thành khi:

- Thu ngan ghi nhan method/reference.
- Bill in duoc tu UI admin.

### Step 23 - Table Status Operations

Plan cần đọc:

- `steps/23_table_status_operations.md`

Việc cần làm:

- Mo rong status ban neu can.
- Admin thao tac doi/reset status.
- Customer QR bi chan neu ban disabled.

Hoàn thành khi:

- Staff quan ly trang thai ban co ban.
- QR/order/payment khong bi hong.

### Step 24 - Dashboard Advanced Metrics

Plan cần đọc:

- `steps/24_dashboard_advanced_metrics.md`

Việc cần làm:

- Them metrics doanh thu theo thoi gian.
- Top menu items, AOV, order count.
- So sanh branch.

Hoàn thành khi:

- Dashboard co them insight va filter dung tenant/branch/date.

### Step 25 - Report Export CSV

Plan cần đọc:

- `steps/25_report_export_csv.md`

Việc cần làm:

- Export CSV cho orders/payments/revenue.
- Dung filter tu report.
- UI nut export.

Hoàn thành khi:

- CSV mo duoc bang spreadsheet va khong leak tenant khac.

### Step 26 - Tenant Settings Timezone & Currency

Plan cần đọc:

- `steps/26_tenant_settings_timezone_currency.md`

Việc cần làm:

- Them settings timezone/currency.
- UI update settings.
- Report/bill/date format theo tenant.

Hoàn thành khi:

- Date range va currency hien dung theo tenant.

### Step 27 - Basic Inventory

Plan cần đọc:

- `steps/27_inventory_basic.md`

Việc cần làm:

- Model/API/UI inventory item.
- Low-stock threshold va warning.
- Tenant isolation.

Hoàn thành khi:

- Quan ly thay ton kho co ban.
- Khong anh huong flow order chinh.

### Step 28 - Reservation & Optional Customer Profile

Plan cần đọc:

- `steps/28_reservation_customer_profile.md`

Việc cần làm:

- Reservation co ban cho admin.
- Customer name/phone optional trong QR order.
- Giu privacy toi thieu.

Hoàn thành khi:

- Dat ban co ban hoat dong.
- QR order van khong bat khach dang ky.

### Step 29 - API Contract, E2E & Observability

Plan cần đọc:

- `steps/29_api_contract_e2e_observability.md`

Việc cần làm:

- OpenAPI/typed contract.
- Playwright E2E smoke.
- Alert/runbook/backup-restore docs.

Hoàn thành khi:

- Moi release co smoke E2E va runbook ro rang.
