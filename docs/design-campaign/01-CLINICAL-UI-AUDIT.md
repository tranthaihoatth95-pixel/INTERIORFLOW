# 01 · KHÁM LÂM SÀNG GIAO DIỆN — Phase 1 (QA read-only)

Đo trên **`http://127.0.0.1:3778`** (mã hiện tại, PID 2225) · 1440×900 · 22/08/2026.
Người đo: Lane QA (read-only, **0 dòng production**). Ảnh: `artifacts/visual-review/master-completion/audit/`.

> ⚠️ **PHIÊN CHƯA ĐĂNG NHẬP.** Tôi không gõ mật khẩu (luật an toàn). Mọi dòng dưới đây đo **vỏ
> giao diện**, không đo nội dung thật. Chỗ nào cần dữ liệu ⇒ **BLOCKED-NEEDS-HUMAN**, không đoán.

---

## A · BẢNG ĐO — 13 bề mặt

| Bề mặt | Rail | Lớp chrome | Canvas | Nút | Icon lucide/tổng | Cỡ chữ | Hạng |
|---|---|---|---|---|---|---|---|
| Login | – | 0 | – | 11 | 4/8 | 4 | PARTIAL |
| Home `/` | – | 0 | – | 11 | 4/8 | 4 | **BLOCKED** |
| Projects | ✓ | 3 | – | 46 | 40/42 | 7 | PARTIAL |
| Project Overview | ✓ | 3 | – | 42 | 43/45 | 8 | PARTIAL |
| Files | ✓ | 3 | – | 57 | 47/50 | **11** | PARTIAL |
| Library | ✓ | 3 | – | 58 | 48/51 | **11** | PARTIAL |
| Gallery | ✓ | 3 | – | 57 | 41/43 | 8 | PARTIAL |
| Materials | ✓ | **4** | – | 46 | 43/45 | 7 | PARTIAL |
| 2D | ✓ | 3 | **1338×712** | **101** | 103/108 | 10 | PARTIAL |
| 3D | **–** | **0** | – | 11 | 4/8 | 4 | **FAIL** |
| Present | ✓ | 3 | – | 54 | 53/55 | 8 | PARTIAL |
| Settings | ✓ | 3 | **107** | 65/**75** | 8 | PARTIAL |
| Tasks | ✓ | 3 | – | 45 | 43/45 | 7 | PARTIAL |

**Không hạng PASS nào.** Không màn nào được xanh chỉ vì component tồn tại — đúng luật đề bài.

---

## B · 🔴 BỐN "KẺ TÁI PHẠM" — chạm ≥2 bề mặt ⇒ LỖI HỆ THỐNG, phải nâng cấp, không vá lẻ

### B1 · `Untitled flow` hiện trên **10/13** bề mặt — DANH TÍNH GIẢ Ở LỚP VỎ
Mọi màn có rail đều mang chuỗi `Untitled flow` trong chrome. Đây **không phải fixture** — nó là
tên mặc định thật khi tạo flow (`ProjectSelect.tsx:739` · `FlowsPanel.tsx:85` · `WelcomeIntro.tsx:51`).
Nhưng ở **vỏ ứng dụng**, nó đọc ra như *"app chưa biết mình đang mở cái gì"*.
⇒ Vấn đề là **CHỖ HIỂN THỊ**, không phải dữ liệu. Sửa một màn không giải quyết được — nó nằm ở
shell dùng chung. **Hạng: FAIL (hệ thống).**

### B2 · BA HÀNH VI KHÁC NHAU cho CÙNG một điều kiện "chưa đăng nhập"
| Nhóm | Hành vi | Bề mặt |
|---|---|---|
| ① | dựng **vỏ đầy đủ** (rail ✓), dữ liệu 401 | Files · Library · Gallery · Materials · 2D · Present · Settings · Tasks · Projects · Overview |
| ② | ở nguyên URL nhưng **không vỏ, 11 nút** | **3D** |
| ③ | ra màn đăng nhập | Home `/` |
⇒ **Ba câu trả lời cho một câu hỏi.** Người dùng mất phiên giữa chừng sẽ thấy ba thứ khác nhau tuỳ
đang đứng đâu. Đây là **cùng gốc với FALSE CALM** (Vitals nói `calm` khi tiền đề 401): hệ **chưa có
MỘT chủ sở hữu ngữ nghĩa** cho trạng thái "không đọc được". **Hạng: FAIL (hệ thống).**

### B3 · ICON TRỘN NGUỒN — **13/13** bề mặt
Không màn nào 100% lucide. Nặng nhất **Settings: 65/75** (10 svg ngoài hệ), 2D 103/108, Present 53/55.
Vỏ chung (Login/Home/3D) 4/8 = **một nửa** icon không phải lucide.
⇒ Chạm mọi bề mặt ⇒ hệ thống. **Hạng: FAIL (hệ thống).**

### B4 · TRÔI CỠ CHỮ — 4 → **11** cỡ riêng biệt
Files và Library mỗi màn **11 cỡ chữ**; 2D 10; vỏ chung chỉ 4.
Chênh gần **3 lần** giữa màn giản dị nhất và màn rậm nhất ⇒ không phải thang, mà là tích tụ.
**Hạng: PARTIAL (hệ thống).**

---

## C · TỪNG BỀ MẶT — điểm đáng nói

**3D — FAIL, nặng nhất.** Ở nguyên `/projects/<id>/render` mà **không rail, 11 nút, 4/8 icon** —
chữ ký **giống hệt màn Login**. Trong khi **2D cùng dự án dựng đầy đủ** (rail ✓, canvas 1338×712,
101 nút). Hai chặng cùng một dự án, cùng một phiên, **hai kết cục khác nhau**.
⇒ Không phải "3D nặng nên chưa tải" — nó không có vỏ.

**2D — nhân vật chính ĐÚNG.** Canvas **1338×712 / 1440×900 = 93% bề ngang**, chrome không nuốt
canvas. Đây là màn duy nhất có PROTAGONIST rõ và đúng. Nhưng **101 nút** là mật độ cao nhất toàn app.

**Settings — 107 nút, 10 icon ngoài hệ, dính jargon `D5`.** Nhiều nút nhất toàn app.

**Materials — 4 lớp chrome** trong khi 10 màn khác đều 3. Lệch một lớp so với chuẩn de-facto.

**Home — BLOCKED.** `/` ra màn đăng nhập ⇒ **không đo được Home thật**. Việc gỡ widget ánh sáng đã
được chứng minh ở **tầng bundle** (`05:00` · `20:00` = **0 chunk**), không phải bằng ảnh chụp.

---

## D · LEGACY / DUPLICATE — nói thẳng giới hạn
Đề bài đòi **chứng minh cấu trúc**, không phải vắng chuỗi. Phiên chưa đăng nhập nên tôi **không**
mở được các panel sâu (ToolWindow · Vitals 3 nấc · sidebar mở rộng · Lock · Session-ended).
⇒ **Tôi KHÔNG kết luận "không có bản sao legacy"** — tôi chỉ chứng minh được một chiều:
* `05:00`/`20:00` = 0 chunk ⇒ đồng hồ đo ánh sáng **không với tới được** (đây là chứng minh cấu trúc thật).
* Còn lại: **BLOCKED-NEEDS-HUMAN.**

---

## E · CHƯA ĐO ĐƯỢC — BLOCKED-NEEDS-HUMAN (cần một phiên đăng nhập)
Home thật · Lock · Session Ended · Sidebar mở rộng/thu · Vitals 3 nấc · ToolWindow · Present editor
thật · nội dung Library/Gallery · trạng thái Material.
⇒ Cần **một người** đăng nhập trên `:3778`. Tôi không gõ mật khẩu, và không nhờ ai gõ hộ.

---

## F · ĐỀ XUẤT THỨ TỰ (cho MAIN)
1. **B2** trước hết — một chủ sở hữu ngữ nghĩa cho "không đọc được". Nó gộp luôn **false calm**;
   sửa riêng false calm là vá một triệu chứng của cùng một bệnh.
2. **B1** — `Untitled flow` ở shell, chạm 10 màn, sửa một chỗ.
3. **3D FAIL** — cùng dự án mà 2D sống 3D không, đó là lỗi định tuyến/gating chứ không phải UI.
4. B3/B4 (icon, cỡ chữ) — thật nhưng là **hoàn thiện**, làm sau ba mục trên.
