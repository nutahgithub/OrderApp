# Project Rules - Smart Restaurant OS

File này là bộ rule chung cho project. Mỗi lần bắt đầu một prompt triển khai trong repo này, Codex cần đọc file này cùng các plan liên quan trong `docs/plan/` trước khi sửa code.

## 1. Nguyên tắc chung

- Project là SaaS multi-tenant cho quản lý nhà hàng/cafe.
- Kiến trúc ưu tiên: Modular Monolith.
- Backend chính: Node.js, TypeScript, Prisma, MySQL, Redis, Socket.IO.
- Frontend chính: ReactJS.
- Sản phẩm phải hoàn thiện cả backend và frontend; không được mặc định chỉ làm backend.
- Khi làm một chức năng nghiệp vụ, cần xem xét đủ 3 phần: database/API, realtime nếu có, và UI/UX tương ứng.
- Thứ tự triển khai mặc định là vertical slice: làm API cho một chức năng, sau đó làm UI cho chính chức năng đó, rồi smoke test end-to-end trước khi chuyển sang chức năng tiếp theo.
- Không gom toàn bộ backend xong rồi mới làm frontend, trừ khi user yêu cầu rõ.
- Không dùng `any` trong TypeScript, trừ khi có lý do rất rõ và phải ghi chú.
- Không đặt business logic trong controller/route handler.
- Mọi logic nghiệp vụ phải nằm trong service/use-case/domain layer phù hợp.
- Code cần dễ test, dễ đọc, chia theo tầng rõ ràng.

## 2. Multi-Tenant

- Dùng shared database.
- Mọi bảng dữ liệu nghiệp vụ thuộc tenant phải có `tenant_id`.
- Mọi query dữ liệu nghiệp vụ phải filter theo `tenant_id`.
- Không được lấy dữ liệu cross-tenant nếu không có use case hệ thống rõ ràng.
- `tenant_id` phải được truyền qua request context hoặc auth context, không hard-code.

## 3. API Source Structure

- API dùng cấu trúc layer-first để dễ đọc và maintain:
  - `routes`: khai báo URL, middleware, controller handler.
  - `controllers`: nhận request, validate input, gọi service, trả response.
  - `services`: business logic/use-case.
  - `repositories`: Prisma query và data access.
  - `schemas`: Zod validation schema.
  - `middlewares`: Express middleware dùng lại.
  - `types`: type dùng chung trong API.
  - `shared`: code hạ tầng dùng chung như errors, response, prisma, logger, security.
- Không đặt source mới trong `src/modules/*` trừ khi có quyết định đổi kiến trúc.
- Controller không query Prisma trực tiếp.
- Service không tự parse request/response.
- Repository không chứa business rule.
- Transaction boundary nằm ở service layer. Repository phải nhận `DbClient` từ service để service có thể truyền `prisma` hoặc transaction client `tx`.
- Repository không import Prisma singleton trực tiếp, trừ khi có lý do đặc biệt được ghi chú.
- Code dùng chung như JWT/password/hash/response/error đặt trong `shared`, không đặt trong một chức năng riêng.

## 4. API & Controller

- Controller chỉ nhận request, validate input, gọi service/use-case, trả response.
- Controller không viết `try/catch` lặp lại. Route async phải dùng handler chung như `asyncHandler(...)`, middleware sync có thể dùng `safeHandler(...)`.
- Validate input bằng schema rõ ràng.
- Controller phải dùng helper validation chung như `parseBody(request, schema)` thay vì gọi schema parse rải rác theo kiểu tự phát.
- Response format cần thống nhất trong toàn project.
- Error handling cần thống nhất, không throw string/raw error ra client.
- Mỗi lỗi phải có một `ErrorCode` và message/status trong error catalog tập trung. Khi thêm lỗi mới, thêm vào catalog trước rồi mới sử dụng trong service/middleware/controller.

## 5. Database & Prisma

- Prisma schema phải thể hiện rõ quan hệ giữa tenant, branch, table, menu, order, order item.
- Dùng transaction cho các flow ghi nhiều bảng, đặc biệt là tạo order.
- Monetary value cần dùng kiểu dữ liệu an toàn, không dùng float cho tiền nếu có lựa chọn tốt hơn.
- Migration phải nhỏ, có tên rõ, và đi cùng cập nhật plan nếu thay đổi scope.

## 6. Realtime

- Socket.IO room phải có scope theo tenant/branch/table.
- Event realtime không được leak dữ liệu tenant khác.
- Event name cần thống nhất và được ghi lại trong plan/module docs.

## 7. Frontend

- Frontend admin là giao diện vận hành chính cho chủ/quản lý/nhân viên nhà hàng.
- Frontend customer QR là giao diện mobile-first cho khách đặt món tại bàn.
- UI admin cần gọn, rõ, tối ưu thao tác lặp lại, không làm kiểu landing page.
- UI customer cần nhanh, dễ đọc trên điện thoại, thao tác đặt món ít bước.
- Mọi màn hình chính phải có loading, error, empty state.
- API client phải typed, không dùng `any`.
- State realtime cần được đồng bộ với Socket.IO event và fallback refresh khi cần.
- Không hard-code tenant/branch/table trong UI ngoài dữ liệu seed/demo có ghi chú.

## 8. Test & Quality

- Mỗi module nghiệp vụ quan trọng cần có test cho service/use-case.
- Order flow là luồng lõi, cần test kỹ transaction, total calculation, và tenant filtering.
- Frontend cần test hoặc smoke check cho các flow chính: admin login, quản lý menu, tạo order QR, cập nhật order realtime.
- Trước khi hoàn thành một task code, chạy test/lint/typecheck phù hợp nếu project đã có script.
- Nếu không chạy được test, phải ghi rõ lý do trong phản hồi.

## 9. Cách Làm Việc Với Plan

- Plan nằm trong `docs/plan/`.
- Trước khi làm một chức năng, đọc `docs/plan/00_implementation_sequence.md` và file step cụ thể trong `docs/plan/steps/`.
- Khi user yêu cầu implement một file step, chỉ làm scope trong file đó, không tự chuyển sang step tiếp theo.
- Sau khi hoàn thành một file step, báo cách test để user review trước khi chuyển tiếp.
- Khi scope thay đổi, cập nhật file plan liên quan và nếu cần cập nhật file rule này.
- Mỗi giai đoạn nên hoàn thành theo thứ tự nhỏ, review được, tránh gom quá nhiều thay đổi.
