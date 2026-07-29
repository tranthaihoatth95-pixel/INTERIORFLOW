# IF Master Architecture — Toàn cảnh dự án

> Quy ước tên: **IF1** = IF1 (nội thất, đang build). **IF2** = IF2
> / CAD ACE (kỹ thuật công trường, chưa build). Dùng nhất quán trong mọi
> tài liệu và khi giao việc cho Claude Code.

> Tài liệu này KHÔNG thay thế các spec chi tiết đã có — nó là **bản đồ tổng**
> để thấy IF1 và IF2 khớp với nhau ra sao.
> Claude Code chỉ đọc file này khi cần hiểu bối cảnh lớn, KHÔNG đọc mỗi phiên.

## Tài liệu liên quan

| File | Nội dung |
|---|---|
| `IF-FEATURE-SPEC-P1-v2.md` | **Spec canonical** — 101 item Sketch/Pro (ArcSite-style), trạng thái đã đối soát mã nguồn 2026-07-17 |
| `IF-FEATURE-UPGRADES.md` | Thang Basic→Pro→Elite; mỗi mục đã gắn ✅ ĐẠT / ⏳ CHƯA |
| `IF-PHASE1-CLOSEOUT-PLAN.md` | **Punch list đóng Phase 1** — còn gì trước khi chuyển trọng tâm sang Render/Present |
| `IF-FEATURE-SPEC-P1.md` / `_1.md` | ⚠️ Bản cũ đã thay thế (superseded), giữ làm lịch sử |
| ~~`IF-PRO-MODE-SPEC.md`~~ | ❌ **Không tồn tại & không cần** — Pro mode đã build trực tiếp (Sprint 9-10), tính năng nằm trong `IF-FEATURE-SPEC-P1-v2.md` |
| ~~`MODE-TOGGLE-DESIGN.md`~~ | ❌ **Không tồn tại & không cần** — toggle Sketch↔Pro đã ship (Sprint 9): `lib/cad/store.ts` (`cadMode`/`PRO_ONLY_TOOLS`) + `components/cad/CadToolbar.tsx`. Đã làm mà không cần spec riêng |

---

## Bức tranh 2 giai đoạn

| | **IF1 — IF** | **IF2 — CAD ACE** |
|---|---|---|
| Trạng thái | 🟢 Đang build — Sprint 3-10 XONG (Sketch + Pro + toggle); còn vá gap trước cổng đánh giá | ⚪ Chưa build — concept |
| Phạm vi | Thiết kế **nội thất** end-to-end | Kỹ thuật **công trường & sản xuất** |
| User | Designer + Drafter TTT | Kỹ sư giám sát, đội thi công, CNC |
| App | **1 app**, 2 mode (Sketch + Pro) | App **riêng biệt** |
| Độ chính xác | Đủ dùng cho concept → thi công nội thất | Chính xác tuyệt đối, đa bộ môn (kết cấu, MEP đầy đủ, CNC) |
| 3D | Không (2D CAD + render ảnh) | **Có** — 3D model, clash detection |
| Benchmark | ArcSite (Sketch) + AutoCAD scoped nội thất (Pro) | Revit + platform 3D viewing |
| File format | `.idf` | Định dạng riêng (tương thích IFC/Revit sau) |

---

## IF1 — IF (đang build)

### Sketch mode
Touch-first, kéo thả, 5 phút vẽ được. Xem chi tiết: `IF-FEATURE-SPEC-P1-v2.md`.

### Pro mode
Cùng file `.idf`, cùng DCEL, thêm lớp precision cho drafter: dimension chuẩn TCVN, snap nâng cao, layer manager, xuất bản vẽ thi công. **Đã build (Sprint 9-10)** — toggle `cadMode` gate ~30 tool precision sau nút "Pro", mặc định Sketch. (`IF-PRO-MODE-SPEC.md` chưa từng được viết — tính năng nằm trong `IF-FEATURE-SPEC-P1-v2.md`.)

### Ranh giới IF1
IF **KHÔNG làm**: 3D model, kết cấu, MEP đầy đủ (chỉ đèn/ổ cắm/hộp gen sơ cấp), CNC, multi-trade clash detection. Những thứ này thuộc IF2.

---

## IF2 — CAD ACE (chưa build, để thấy hướng đi)

> Ghi ở đây để **không quên hướng dài hạn** khi build IF1 — tránh
> IF1 tự phình ra làm luôn việc của IF2 (bài học từ lần trước IF
> đã drift khỏi brief gốc).

### Mục đích
App riêng cho đội kỹ thuật — nơi bản vẽ nội thất từ IF được **chính xác hoá** thành hồ sơ thi công đa bộ môn.

### Tính năng dự kiến (high-level, chưa spec chi tiết)

| Nhóm | Mô tả |
|---|---|
| Revit 3D | Model 3D đầy đủ, không chỉ mặt bằng 2D |
| Platform 3D viewing | Xem model trên web/mobile, xoay/cắt lớp |
| Construction management | Tiến độ thi công, phối hợp nhà thầu |
| CNC management | Xuất file gia công (đồ nội thất đặt đóng) |
| MEP đầy đủ | Không chỉ gợi ý — tính toán tải điện, thông gió, cấp thoát nước thật |
| Clash detection | Phát hiện xung đột giữa kết cấu/MEP/nội thất |

### Kết nối với IF1

```
IF (.idf) ──export──▶ CAD ACE (định dạng riêng)
   │                        │
   Geometry 2D          Geometry 3D + construction detail
   Material library ──────▶ dùng chung nguồn ATLAS
   BOQ sơ bộ ──────────────▶ BOQ thi công chi tiết
```

IF2 **không vẽ lại từ đầu** — kế thừa mặt bằng, phòng, vật liệu đã có từ `.idf`, rồi thêm độ chính xác 3D/kỹ thuật.

### Khi nào bắt đầu IF2
Chỉ sau khi IF1 **ổn định, có người dùng thật, đo được giá trị** — không build IF2 song song để tránh lặp lại tình trạng "scope drift" đã từng xảy ra với IF.

---

## Sprint roadmap tổng (cả 2 phase)

| Giai đoạn | Sprint | Nội dung | Trạng thái |
|---|---|---|---|
| IF1 Sketch | 3–8 | Shape library (41 shape/9 nhóm), MEP sơ cấp, checker, export, layer/template | ✅ XONG |
| IF1 Pro | 9–10 | Toggle Sketch↔Pro + precision drafting (offset/trim/dimension…), Standards checker lên Pro | ✅ XONG |
| IF1 vá gap | 11–12 | **Chỉ còn gap thật: E1.2 ảnh vật liệu (Material thumbnail)**. Ngoài roadmap gốc còn đã làm thêm: DWG import (Web Worker GPL) + DXF round-trip, Standards checker Pro-level — roadmap cũ đánh giá THẤP khối lượng thực nhận | 🔜 gần xong |
| *(đánh giá)* | — | Review: IF1 có được dùng thật chưa? Có đáng làm IF2 không? Sau cổng này → chuyển trọng tâm sang tinh chỉnh Render + Present | ⏳ |
| IF2 CAD ACE | TBD | Chỉ bắt đầu sau đánh giá, spec riêng lúc đó | ⚪ |

> Chi tiết còn-lại-để-đóng Phase 1: xem `IF-PHASE1-CLOSEOUT-PLAN.md`.
> Lưu ý: bộ edit AutoCAD-style + DWG import + Standards Pro **không có trong roadmap gốc** nhưng đã làm — khối lượng thực > kế hoạch.
