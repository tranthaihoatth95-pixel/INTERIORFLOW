# SPEC — HẠ TẦNG SẢN PHẨM *(product infrastructure)*

> **Đã duyệt (Cowork thay, uỷ quyền phần thuần kỹ thuật, 01/08).** Lớp phân biệt "app bán được"
> với "prototype chạy được".
> Đọc cùng `IF-ARCHITECTURE-BLUEPRINT-v1.md` mục 1B (ràng buộc nền tảng web/desktop).
> **Cảnh báo**: đây là việc **vô hình** — tốn công, không ai khen, nhưng thiếu thì không bán được.

---

## 1. Bảy trình quản lý — và cái nào chỉ cần khi có bản desktop

| # | Trình quản lý | Web | Desktop | Bậc |
|---|---|---|---|---|
| 1 | **Cài đặt cá nhân** — ngôn ngữ · đơn vị (mm/m) · phím tắt · tự lưu | ✅ | ✅ | **N** |
| 2 | **Người dùng & phân quyền** — mời thành viên · ai xem/sửa dự án nào | ✅ **bắt buộc** | ✅ | **N** |
| 3 | **Giao diện** — sáng/tối · mật độ · cỡ chữ | ✅ | ✅ | N |
| 4 | **Kho model AI** — checkpoint · LoRA · ControlNet (hàng GB) | ⬜ (chạy cloud thì không) | ✅ **bắt buộc** | P |
| 5 | **Extension / Node manager** — cài · gỡ · xung đột · **allowlist** | 🔸 giới hạn | ✅ | P |
| 6 | **Trạng thái hệ thống** — GPU · RAM · hàng đợi render · dung lượng | 🔸 chỉ hàng đợi | ✅ | P |
| 7 | **Cập nhật phần mềm** | ❌ **KHÔNG cần** (deploy = tự mới) | ✅ **đã CÓ SẴN** trong `electron/main.js` | ✅ |

⇒ **Không làm #4 #5 #6 #7 khi chưa bọc Tauri.** Làm sớm = làm thừa.

## 2. #2 Người dùng & phân quyền — bắt buộc, không tuỳ chọn

IF là app global bán cho nhiều studio. Không có phân quyền thì:
- Studio B nhìn thấy dự án studio A → hỏng danh tiếng ngay lần đầu
- Không mời được nhân viên → không bán theo đầu người
- Không có "khách xem link" → chặng Present mất tính năng share (O3 hồ sơ sống)

**Hai lớp lọc chồng nhau**: `scope: project` lọc **theo dự án** (Task 0 đã làm) ·
phân quyền lọc **theo người**. Thiếu lớp nào cũng rò.

### Ba vai đủ cho bản N
| Vai | Quyền |
|---|---|
| **Chủ studio** | Mọi quyền · mời người · quản lý Brand Kit, ATLAS của tenant |
| **Thành viên** | Làm dự án được giao |
| **Khách xem** | Xem + bình luận deck · **không tải bản vẽ gốc** |

### ⚠️ ĐÃ SỬA 28/07 (Q2b) — auth tự viết là QUYẾT ĐỊNH CÓ CHỦ ĐÍCH, không phải nợ kỹ thuật

> **Bối cảnh sửa**: bản v1.0 dưới đây khuyên dùng Clerk/Auth0/Supabase Auth/WorkOS. Khám code
> 28/07 (`docs/IF-MASTER-TREE.md` 1.1.5) xác nhận `lib/server/auth.ts` tự viết hoàn toàn (email/
> SĐT + password hash tự quản, tự tạo session/cookie) — đi ngược khuyến nghị này. **Hoà quyết
> GIỮ auth tự viết**, sửa lại khuyến nghị thay vì sửa code.

**Lý do giữ**: IF là **local-first** (mục 1B `IF-ARCHITECTURE-BLUEPRINT-v1.md`) — dữ liệu nằm ở
máy người dùng, cloud chỉ là bản sao đồng bộ. Cắm Clerk/Auth0/Supabase Auth/WorkOS nghĩa là
**đăng nhập LUÔN cần gọi ra dịch vụ ngoài** (dù app đang chạy offline-first) — đúng thứ local-first
đang tránh: 1 điểm phụ thuộc cloud bắt buộc, ràng giá theo lượt (MAU pricing) của bên thứ ba vào
đúng luồng người dùng chạm vào đầu tiên, và khoá app vào 1 nhà cung cấp danh tính ngoài tầm kiểm
soát. "Vài giờ thay vì vài tuần" đúng cho app cloud-first thuần — SAI tiền đề cho app local-first:
cái đắt không phải công viết auth, mà là **tự trói vào 1 dịch vụ bên ngoài đúng ở lớp T0 (hạ tầng)
mà mọi tầng trên đều phụ thuộc**.

**Không phải "không cần bảo mật"** — `lib/server/auth.ts` vẫn phải tự chịu trách nhiệm đúng những
gì Clerk/Auth0 lo hộ (hash mật khẩu đúng chuẩn, session an toàn, chống brute-force) — chỉ là
KHÔNG đi qua dịch vụ ngoài để làm việc đó. RBAC (mục 2 trên, `lib/server/access-policy.ts`) vẫn
đúng và ĐÃ vượt kỳ vọng ban đầu (5 vai chi tiết hơn 3 vai N đề xuất).

*(Câu gốc "KHÔNG tự viết hệ đăng nhập/phân quyền — dùng Clerk/Auth0/Supabase/WorkOS" đã BỎ, xem
lý do trên.)*

## 3. #5 Extension manager — luật bắt buộc trước khi bán ra ngoài

| Rủi ro | Xử lý |
|---|---|
| Custom node chạy code tuỳ ý | **Danh sách trắng** *(allowlist)* — chỉ node đã kiểm duyệt |
| Update là vỡ workflow | **Khoá phiên bản** *(pin version)* |
| Thiếu model → người dùng không hiểu lỗi | Thẻ tự kiểm `requires`, báo thiếu gì / tải ở đâu |

## 4. Thứ tự đề xuất

| Khi nào | Làm gì |
|---|---|
| Sau nền CAD | #2 phân quyền (dùng dịch vụ sẵn) → #1 cài đặt → #3 giao diện |
| Khi mở kho thẻ | #5 allowlist + pin version (mức tối thiểu) |
| Khi bọc Tauri | #4 kho model · #6 trạng thái hệ thống · #7 updater |

---

*v1.1 (28/07 — Q2b: bỏ khuyến nghị Clerk/Auth0/Supabase/WorkOS, giữ auth tự viết là quyết định
có chủ đích vì local-first) · 2026-07-28 · Hoà quyết, Claude ghi theo `docs/IF-MASTER-TREE.md`.*
*v1.0 · 2026-07-24 · Ben soạn theo ý Hoà.*

