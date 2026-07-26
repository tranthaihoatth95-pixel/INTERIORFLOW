# SPEC — HẠ TẦNG SẢN PHẨM *(product infrastructure)*

> **[CẦN HOÀ DUYỆT]** · Lớp phân biệt "app bán được" với "prototype chạy được".
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

### ⚠️ Luật rẻ tiền nhất
**KHÔNG tự viết hệ đăng nhập/phân quyền.** Dùng dịch vụ có sẵn (Clerk · Auth0 · Supabase Auth ·
WorkOS): vài giờ thay vì vài tuần, không tự tạo lỗ hổng bảo mật.

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

*v1.0 · 2026-07-24 · Ben soạn theo ý Hoà.*

