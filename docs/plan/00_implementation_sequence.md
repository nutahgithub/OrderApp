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
