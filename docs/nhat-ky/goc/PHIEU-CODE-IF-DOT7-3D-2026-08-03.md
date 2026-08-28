# PHIẾU ĐỢT 7 — CHẶNG 3D THIẾT KẾ (2026-08-03)

Nguồn: Hoà soi màn hình `/projects/*/render` mode **Vẽ 3D** + 2 câu hỏi cơ chế.
Luật áp dụng: §9 *thiết kế trước — tính năng fill sau* · K1 *ba ống kính một nguồn* · V5 *kiểm bằng vật chứng*.

---

## NHÓM A — 3 lỗi mắt bắt (làm trước, nhẹ)

### A1 · Bảng TRÌNH TỰ choáng chỗ → phải DI DỜI ĐƯỢC
`components/render-studio/Render3DModeSkeleton.tsx:289-297` — hiện đóng đinh `position:absolute; left:12; bottom:156`, đè lên vùng nhìn khối.
Yêu cầu:
- Kéo thả được (pointerdown trên thanh tiêu đề "TRÌNH TỰ" → kéo cả bảng), kẹp trong lòng viewport.
- Nhớ vị trí vào `localStorage` khoá `if.ve3d.guide_pos_v1` (cùng họ `GUIDE_HIDDEN_KEY`).
- Bấm nhãn "TRÌNH TỰ" = thu gọn còn 1 dòng `✓1/3 · Trình tự` (không mất luôn như nút ✕ hiện có).
- Bỏ nền `color-mix(... 82%)` → dùng `.vitals-pop` (globals.css:617) cho đặc, khỏi lẫn vào khối trắng.

### A2 · Chip Vitals không nổi bật
Ảnh 2 đáy màn: chip `Vitals` chìm hẳn vào StatusBar, không ai thấy đó là điểm gọi CHÍNH THỨC.
`components/studio/StatusBar.tsx` vùng GIỮA.
Yêu cầu: viền tím `--accent` 1px + nền `--accent-soft` + chấm sống (pulse 2s) khi rảnh. Không phóng to chữ, không đổi layout 3 vùng.
⚠️ KHÔNG mount thêm panel — panel Vitals mount DUY NHẤT ở `StageSwitcher.tsx` (StatusBar.tsx:89-92).

### A3 · Thanh cuộn trắng ở cột cây tầng
`app/globals.css:286-302` — thumb dùng `var(--border-strong)`, ở nền tối chặng 3D thành ra trắng chói.
Yêu cầu: đổi thumb sang `color-mix(in srgb, var(--t3) 45%, transparent)`, hover `--t3`. Kiểm CẢ hai theme sáng/tối trước khi báo xong.

---

## NHÓM B — ViewCube phải XOAY THEO KHỐI (3ds Max / SketchUp)

**Vật chứng hiện trạng:** `components/three/Viewport3D.tsx:92-107` là **SVG 2D TĨNH** — 3 polygon toạ độ chết, chỉ đổi CHỮ nhãn qua `VIEW_LABEL[view]`. Không xoay theo camera, không kéo được. Đúng như Hoà nói.

Yêu cầu thay bằng ViewCube 3D THẬT:
1. Scene `three` thứ hai, `WebGLRenderer` riêng 96×96px góc trên phải (hoặc dùng chung renderer + `setScissor`), camera của cube **copy quaternion** từ camera chính mỗi frame → cube xoay đồng bộ khi orbit.
2. Khối lập phương 26 vùng bấm: **6 mặt · 12 cạnh · 8 góc**. Raycast trên cube → `camera.position` bay tới hướng đó bằng nội suy (`slerp`, ~350ms), không nhảy giật.
3. **Kéo trên cube = orbit camera chính** (giống SU): pointerdown trên cube → drag delta đẩy thẳng vào `OrbitControls`.
4. Nhãn mặt tiếng Việt: TRÊN · DƯỚI · TRƯỚC · SAU · TRÁI · PHẢI.
5. Bỏ 2 nút chữ TRƯỚC/DƯỚI (`Viewport3D.tsx:110-123`) — cube 26 vùng đã phủ hết, giữ lại là thừa.
6. Giữ nguyên `onViewChange` API để chỗ gọi không phải sửa.

Thư viện: **KHÔNG cài mới.** `three` có sẵn đủ; `OrbitControls` đã dùng. Nếu bí, `three/examples/jsm/helpers/ViewHelper` là nền tham khảo nhưng phải viết lại vì ViewHelper không có mặt/cạnh/góc đầy đủ.

---

## NHÓM C — "cơ chế vẽ Revit chưa thấy" (theo §9: VẼ LÊN GIAO DIỆN TRƯỚC)

Hoà nói đúng: chặng 3D mới có **khối trơn + gizmo**, chưa có cơ chế **cấu kiện có ngữ nghĩa**.

**VIỆC C1 — đối chiếu, ra bảng (không code chức năng):**
Đọc `docs/SPEC-VE-REVIT-MODE.md` + `lib/cad/model.ts`, lập bảng 3 cột vào `docs/SO-KIEM-TONG.md`:
| Cơ chế Revit | Chặng 2D đã có? | Chặng 3D đã có? |
Tối thiểu phải soi: location line của tường · cửa/cửa sổ **hosted** (đục lỗ theo chủ) · type vs instance · tham số cấu kiện · level/tầng · constraint theo cao độ.

**VIỆC C2 — vẽ hết lên giao diện, phần chưa code để MỜ kèm lý do:**
`components/render-studio/Command3DPanel.tsx` — thêm nhóm nút **"Cấu kiện"** đúng tầng ⑥ của `docs/SPEC-DUNG-BO-LENH-3D.md`: tường · cửa · cửa sổ · cầu thang thẳng/gấp/XOẮN · lan can · phào chỉ · trần thả · tủ bếp.
Nút chưa có chức năng → `opacity:.45` + tooltip ghi rõ *"chưa dựng — đợi ops[] (VIỆC 3 phiên boolean)"*. **Cấm** ẩn đi, cấm bỏ sót.

---

## NGHIỆM THU (V1-V5)
- Chụp màn hình A1 (bảng đã kéo sang chỗ khác) · A2 (chip Vitals) · A3 (thanh cuộn cả 2 theme).
- Quay 1 gif ngắn: orbit chuột → cube xoay theo; bấm góc cube → camera bay tới.
- `npx tsc --noEmit` sạch toàn repo.
- Ghi commit hash vào `docs/SO-KIEM-TONG.md`, append-only.
- ⛔ Không đụng `lib/cad/model.ts` (phiên boolean đang sửa `ops[]` ở đó) — tránh conflict.
