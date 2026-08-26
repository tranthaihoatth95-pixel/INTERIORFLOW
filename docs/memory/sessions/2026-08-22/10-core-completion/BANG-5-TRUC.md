# BẢNG TRẠNG THÁI — KHUÔN 5 TRỤC (§11, từ 22/08)

> 🔴 **Vì sao bỏ một-emoji:** một chữ 🟡 gộp chung "chưa có bản vẽ" với "có bản vẽ nhưng dựng dở"
> — hai thứ khác hẳn nhau về việc phải làm tiếp. Năm trục nói thật hơn.
>
> **Luật §10:** UI GREEN đòi **cả năm trục** PASS/APPROVED/COMPLETE. Bản vẽ đẹp hơn hàng thật ⇒
> **giữ VÀNG**. **MAIN không tự thiết kế** — Design column là của phiên Claude Design.

Nguồn Design: `docs/mocks/CLAUDE-DESIGN-CURRENT.md` (phiên thiết kế sở hữu — MAIN chỉ đọc).

| Frontier | Design | Impl | Visual match | Real browser | Function |
|---|---|---|---|---|---|
| VITALS user-facing | APPROVED | COMPLETE | PASS | PASS | PASS |
| SIDEBAR MAP | APPROVED | COMPLETE | PASS | PASS | PASS |
| **HOME (một hệ, nhiều trạng thái)** | 🔴 **CANDIDATE — CHẶN** ← `claude-home-living-canvas-final.html` vỏ đúng nhưng vướng 2 luật (`CLAUDE-DESIGN-CURRENT.md` §5). `Home.dc.html` SUPERSEDED · `claude-home-first-use.html` SUPERSEDED/REJECTED | PARTIAL (MAIN tự ghép w1/w5) | **FAIL** | PASS (bản đang chạy) | PARTIAL |
| SMART SHELL / CHROME | MISSING | PARTIAL | FAIL | PASS | PARTIAL |
| SHARED WORKSPACE/CANVAS | MISSING (D3) | PARTIAL | FAIL | PASS | PASS |
| TOOLWINDOW SYSTEM | MISSING (D3) | PARTIAL (4/13 lệnh) | FAIL | PASS | PARTIAL |
| AUTH/LOCK/RESUME | MISSING (D2) | COMPLETE | FAIL | PASS | PASS |
| VOICE | MISSING | PARTIAL | — | **PASS** ← nghiệm thu trên `:3778` 22/08: `POST /api/home/notes` 401 → dòng báo NHÌN THẤY ĐƯỢC → **nguyên văn câu gốc còn lấy lại được**. MAIN kiểm lại nguồn: CẢ BA nhánh hỏng (401 · mã khác · mất kết nối) đều nội suy `d.banChu.van` (`VitalsChatSurface.tsx:203-219`) | PARTIAL |
| MASTER LIBRARY | APPROVED | PARTIAL | UNKNOWN | PASS | **PASS** ← w10 |
| 2D CONTENT | APPROVED | PARTIAL | FAIL | PASS | PASS |
| 3D CONTENT | APPROVED | PARTIAL | UNKNOWN | PASS | PASS |
| MATERIAL | MISSING | NOT STARTED | — | — | **BLOCKED** (migration) |
| PRESENT TEMPLATES | MISSING (D5) | **COMPLETE** ← đo lại 22/08: `BUILTIN_TEMPLATES` **21 mẫu thật**, sinh ra `elements[]` sửa được (không phải ảnh chụp) | UNKNOWN | PASS | **PASS** |
| GALLERY | MISSING (D4) | **COMPLETE** ← đo lại 22/08: render **1.634 tài sản THẬT** từ `/api/library` | UNKNOWN | **PASS** | **PASS** |
| EXPLORE | MISSING (D4) | NOT STARTED | — | — | FAIL |
| FILES→LIBRARY | MISSING | PARTIAL | — | PASS | PARTIAL |
| VISUAL PIPELINE | MISSING (D8) | PARTIAL | — | PASS | PARTIAL |
| REVIEW GATE | MISSING (D6) | PARTIAL | — | PASS | PARTIAL |
| SETTINGS | MISSING (D7) | PARTIAL | — | PASS | PARTIAL |
| INTEROPERABILITY | n/a | PARTIAL | — | — | PARTIAL |
| FULL-SPINE | n/a | NOT STARTED | — | — | FAIL |

## 🔴 ĐÍNH CHÍNH 22/08 — HAI DÒNG BẢNG NÀY TỪNG SAI
Tôi ghi PRESENT TEMPLATES và GALLERY là `NOT STARTED`. **Cả hai đều SAI** — đo lại tại nguồn:
21 mẫu hồ sơ thật, và Gallery bày 1.634 ảnh thật. Tôi chép trạng thái từ *hàng đợi thiết kế*
(D4/D5 chưa có bản vẽ) rồi suy ra *code chưa có* — **thiếu bản vẽ ≠ thiếu mã**.
⚠️ Và lượt đo đầu tôi còn suýt kết luận sai lần hai: đếm `<img>` ra **0** nên tưởng Gallery hỏng;
thật ra nó vẽ bằng `background-image` — **1.634 phần tử**. Đếm sai đơn vị thì số nào cũng vô nghĩa.

## Đọc bảng này ra việc gì
- **Design MISSING ở 11 dòng** ⇒ MAIN **không được dựng** những màn đó (§1). Việc của phiên thiết kế.
- **HOME vừa đổi từ MISSING → APPROVED** ⇒ đây là dòng MAIN dựng được ngay khi UI-lane nhả file.
- **Visual match FAIL ở mọi dòng MAIN từng tự ghép** — khai đúng, không tô hồng.
- Dòng MAIN đi tiếp được **mà không đụng thiết kế**: MATERIAL (chờ migration) · INTEROPERABILITY ·
  FULL-SPINE · VOICE mount · FILES→LIBRARY.


## 🔴 ĐÍNH CHÍNH 22/08 (lượt MAIN mới) — HOME DESIGN KHÔNG CÒN LÀ APPROVED
Dòng HOME trước ghi `APPROVED ← Home.dc.html`. Nay **sai ba lần**:
1. `Home.dc.html` đã **SUPERSEDED** (bố cục 4 dải ngang bị bác).
2. `claude-home-first-use.html` **SUPERSEDED/REJECTED** — không có "First-Use Home" như một
   màn riêng. **MỘT hệ Home, nhiều TRẠNG THÁI DỮ LIỆU**; zero-state là một trạng thái.
3. Bản mới nhất `claude-home-living-canvas-final.html` **vỏ đúng hướng** (`<nav class="rail">` ·
   `<header class="thanh-tren">` · `vitals-edge` · trường không khí) nhưng **CHẶN**: nó vẫn VẼ
   cung mặt trời `05:00 · BAN NGÀY · 5600K · 20:00` (dụng cụ đo đã bị bác), và đóng đinh rác
   test `21/21` · `19 Bản nháp` · `ẢNH ĐẸP TUẦN NÀY` như thể là dữ liệu thật.
⇒ Đã giao lại phiên thiết kế sửa. **MAIN không tự vẽ.**

## ⚠️ HAI THỨ KHÔNG ĐƯỢC NHẦM LẪN KHI ĐỌC BẢNG NÀY
- **`:3777` = ẢNH CHỤP PHÁT HÀNH ĐÓNG BĂNG.** Nó KHÔNG chứng minh được mã sửa sau lúc dựng.
  Mã đổi sau build ⇒ trạng thái là `PENDING-REBUILD`, không phải PASS.
- **`:3000` ĐANG HỎNG** — `/` trả 404 trong khi `/api/health` và `/files` trả 200. Đúng triệu
  chứng HAI `next dev` cùng ghi một `.next` (PID 11452 · 18745, phiên này KHÔNG kill được).
  Đừng lấy số đo từ cổng này.


## 🟢 22/08 — VOICE là dòng REAL BROWSER xanh thật đầu tiên của đợt này
Không phải "đã mount" mà là **đường THẤT BẠI chạy đúng như tuyên bố**: gửi câu → 401 → có phản
hồi nhìn thấy → câu gốc còn lấy lại được → **không mất im lặng**. Bản đầu là `void fetch(...)`
rồi quên — nuốt câu tệ hơn báo lỗi, vì người dùng tưởng đã ghi xong rồi đi tiếp.

## 🔴 ĐÍNH CHÍNH — "FALSE CALM": tôi đã KHEN NHẦM một LỖI THẬT
Lượt trước tôi ghi ở đây rằng `site`=401 · `projects`=401 mà khẩu độ Vitals hiện **`calm`** là
"luật không-đo-không-nói chạy đúng". **SAI, và đây là lỗi của tôi** — Hoà bác, và bác đúng.

Lập luận cũ ("đọc không được ⇒ `undefined` ⇒ im") chỉ đúng nửa đầu. Nửa sau hỏng ở chỗ:
**`calm` KHÔNG PHẢI là im.** `calm` là một LỜI KHẲNG ĐỊNH — *"đã kiểm, không có gì cần chú ý"*.
Tiền đề đọc THẤT BẠI (401) mà vẫn khẳng định calm chính là **nói dối bằng một trạng thái nghe
có vẻ đúng** — đúng cái bệnh tôi tưởng nó tránh được. Tôi đã khen nó bằng chính câu mô tả bệnh
của nó ("0 việc cần xem" là nói dối bằng một con số đúng) mà không thấy `calm` là cùng một hình.

Ba trạng thái phải phân biệt, không được gộp:
| | nghĩa | đúng khi |
|---|---|---|
| `calm` | ĐÃ ĐỌC ĐƯỢC, và sạch | đọc thành công, 0 tín hiệu |
| im / không hiện | chưa có gì để nói | không có ngữ cảnh |
| **không rõ / không dùng được** | **ĐỌC KHÔNG ĐƯỢC** | **401 · lỗi mạng · thiếu quyền** ← đang THIẾU |

⇒ Đường sửa: **Auth chặn trước**, HOẶC Vitals phải vào trạng thái *không rõ* TƯỜNG MINH.
⇒ Trạng thái: **FAIL** (không phải PASS). Đây là lỗ trung thực, không phải lỗi hiển thị.
⚠️ Bài học chung: một trạng thái "lành" cũng là một lời khai. Kiểm lời khai đó có tiền đề không.
