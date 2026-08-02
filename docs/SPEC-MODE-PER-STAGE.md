# SPEC — KIẾN TRÚC MODE & SIDEBAR (luật gốc, xuyên app)

> Hoà chốt 02/08. **Nguồn DUY NHẤT** cho: mode mỗi chặng · sidebar 3 vùng node · tool=window ·
> hạ tầng xuyên app · Present đa hồ sơ. Mọi chặng theo cùng một cơ chế, không rải rác.
> ⚠️ **Đây là GIAO DIỆN HẠ TẦNG — làm TRƯỚC tính năng lẻ** (Hoà nhấn: hạ tầng trước, tránh làm lại).

## 1 · MODE MỖI CHẶNG — bật/tắt = ĐỔI CẢ GIAO DIỆN (không thêm nút)

| Chặng | Mode (bật/tắt đổi cả shell) |
|---|---|
| **CAD** | **Sketch ↔ Pro ↔ Revit** (tay nhanh → chính xác → BIM cấu kiện 3D) |
| **Render** | **Render + Mood + Collab ↔ Vẽ 3D** (AI 2D + moodboard cộng tác → dựng khối 3D) |
| **Present** | **5 LOẠI HỒ SƠ** (xem §4) — chọn loại = đổi editor |

Luật: lên mode/tầng KHÔNG phải "hiện thêm nút trong màn cũ" mà **đổi cả bố cục** cho hợp việc.
Cơ chế chung một kiểu ở cả 3 chặng. (Khớp `CHOT-HUONG-3D`: IF2 bật → giao diện vẽ 3D.)

## 2 · SIDEBAR = CHUNG KHU NODE, PHÂN 3 VÙNG (Render, chi tiết ở CHOT-RENDER-TOOL-WINDOW)

1. **Mood + Collab** — moodboard cộng tác kiểu Miro (`ai.moodboard`, reference, gu, note).
2. **Node MASTER** — bắt buộc mở **tool window** để thao tác → ra sản phẩm → mới node tiếp
   (Sketch→Ảnh thật, Đổi vật liệu, Đổi ánh sáng, Sửa một mảng, Phóng to in…). Bậc thang 2B.
3. **Node thường** — như trước giờ, inline (Nhập ảnh, `util.*`, OUTPUT).

**Tool = NODE, ở side trái. Nhấn/kéo → xổ WINDOW trên canvas** (play·X·cổng nối). Không tab ngang.

## 3 · HẠ TẦNG XUYÊN APP — dùng chung CẢ 3 CHẶNG

| Thuật ngữ | Là gì | Spec |
|---|---|---|
| **File Manager** *(chợ đầu mối)* | quản lý file toàn app, mở Finder vẫn hiểu | `SPEC-FILE-MANAGER` |
| **Master Library** *(cửa hàng)* | siêu thư viện tài sản/DAM + **Thư viện Template** | `SPEC-IF-LIBRARY` |

Mọi chặng đọc/ghi qua 2 hạ tầng này. **Thư viện Template ở TRONG Master Library** — không dựng riêng.

## 4 · PRESENT — 5 LOẠI HỒ SƠ (chọn từ Thư viện Template → mở đúng editor)

| Loại | Editor | Nền |
|---|---|---|
| **Deck** (slide) | canvas slide — Kể chuyện (Magic dàn) + Biên tập (Studio E1-E4) | ✅ đang xây |
| **Material board** (A3) | lưới ảnh + mã/giá/NCC | ATLAS L5 |
| **Bảng tính / BOQ** ⭐ | spreadsheet — dự toán **tự sinh** | `SEMANTIC-MODEL` §7 (vùng tô có m²+matId) |
| **Word biểu mẫu** ⭐ | document — thuyết minh/hồ sơ/hợp đồng song ngữ | skill `docx` + template |
| **Video** *(chỉ ② DỰNG)* | timeline kiểu **CapCut** — ghép clip·ảnh AI·still + nhạc·**nhịp cắt**·title·transition·color | nhận footage **① Sinh từ chặng 2** · `SPEC-EDITOR-TOOLKIT` §Nhóm4 |

⚠️ Bảng tính + Word là editor RIÊNG, KHÔNG nhét vào canvas slide. Template word phải **hư cấu
100%** (luật trung tính, không tên TTT thật trong mẫu ship ra).

⭐ **VIDEO TÁCH 2 TẦNG (Hoà chốt 02/08 — `CHOT-VIDEO-2-TANG-2026-08-02.md`):**
> **① SINH phim** ở **IF2 · CHẶNG 2**, chung với **vẽ 3D + đặt camera** (đường cam từ scene → footage). D5/Chaos = **tùy chọn render photoreal NGAY TRONG chặng 2** (cửa bậc 5), KHÔNG phải đối thủ — IF vẫn tự vẽ 3D + camera.
> **② DỰNG** ở **CHẶNG 3 Present**, chỉ **edit như CapCut** (ghép + nhạc + nhịp cắt + title + color). **KHÔNG giữ scene 3D riêng ở chặng 3** — footage/camera sinh ở chặng 2 là NGUỒN (luật một-nguồn, Brand Kit đã trả giá). Không viết engine video.

---
*Cowork ghi 02/08/2026 theo chốt Hoà. Đây là luật kiến trúc — sửa phải qua Hoà.*
