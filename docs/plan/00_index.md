# Plan Index - Smart Restaurant OS

Tài liệu này chia project thành các giai đoạn nhỏ để triển khai và review dần.

## Cách Sắp Xếp Plan

Project sẽ triển khai theo vertical slice: API của chức năng nào xong thì làm UI của chức năng đó ngay, smoke test end-to-end, rồi mới chuyển sang chức năng tiếp theo.

File thứ tự triển khai chính:

1. `00_implementation_sequence.md` - Roadmap API + UI liên tiếp theo từng chức năng.

File implement từng bước:

1. `steps/01_project_foundation.md` - Foundation backend + frontend.
2. `steps/02_auth_admin_login.md` - Auth API + Login UI.
3. `steps/03_branch_management.md` - Branch API + Branch UI.
4. `steps/04_table_qr_management.md` - Table/QR API + UI.
5. `steps/05_menu_management.md` - Menu API + Admin/Customer UI.
6. `steps/06_customer_order.md` - Customer order API + QR UI.
7. `steps/07_admin_order_operations.md` - Admin order API + UI.
8. `steps/08_realtime_order_updates.md` - Realtime backend + realtime UI.
9. `steps/09_payment.md` - Payment API + UI.
10. `steps/10_report_dashboard.md` - Report API + Dashboard UI.
11. `steps/11_product_polish_release.md` - Polish, QA, release readiness.

File plan nền tảng:

2. `01_project_setup.md` - Khởi tạo backend, frontend, tooling, cấu trúc module.
3. `02_database_multi_tenant.md` - Thiết kế database, Prisma, multi-tenant rules.
4. `10a_frontend_foundation.md` - Frontend foundation, routing, API client, app shell.

File plan theo chức năng:

5. `03_auth_tenant_admin.md` - Auth admin, tenant context, phân quyền cơ bản.
6. `04_branch_table_management.md` - Quản lý chi nhánh và bàn.
7. `05_menu_management.md` - Quản lý menu.
8. `06_order_module.md` - QR order và luồng tạo đơn hàng.
9. `07_realtime_processing.md` - Socket.IO rooms/events cho bếp, thu ngân, bàn.
10. `08_payment_module.md` - Thanh toán và trạng thái đơn.
11. `09_report_dashboard.md` - Dashboard doanh thu và báo cáo.

File plan frontend chi tiết:

12. `10_frontend_admin_customer.md` - Tổng quan frontend cho sản phẩm hoàn thiện.
13. `10b_frontend_admin_operations.md` - Admin app cho vận hành nhà hàng.
14. `10c_frontend_customer_qr_ordering.md` - Customer mobile QR ordering.
15. `10d_frontend_realtime_states.md` - Realtime UI, state sync, loading/error/empty states.

File plan cuối:

16. `11_deployment_observability.md` - AWS deployment, logs, monitoring.
17. `12_testing_quality_release.md` - Test strategy, checklist release.

## Definition Of Done Chung

- Chức năng có API/use-case rõ ràng.
- Có tenant isolation cho dữ liệu nghiệp vụ.
- Không có business logic trong controller.
- Không dùng `any`.
- Có test phù hợp với mức độ rủi ro.
- Có UI tương ứng cho chức năng đã làm nếu chức năng đó cần người dùng thao tác.
- Chức năng được smoke test end-to-end sau khi API và UI hoàn thành.
- Có cập nhật plan/rule nếu scope thay đổi.
