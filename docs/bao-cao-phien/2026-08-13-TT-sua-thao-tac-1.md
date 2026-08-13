# BÁO CÁO PHIÊN · TT — sửa lệch soi:thao-tac đợt 1 (13/08/2026)

Phiếu: `docs/phieu-giao/sua-lech-thao-tac-1.md` · Vai TT, cấp Đ. KHÔNG git, KHÔNG dev server, KHÔNG đụng `components/present-editor/**`.

## 1 · Bảng tổng theo luật

| Luật | Máy bắt | Sửa thật | Nhường present-editor | Ghi chú |
|---|---|---|---|---|
| `kinh-webkit-prefix` | 18 file | **17 file** (7 file code thật · 10 file máy-bắt-nhầm comment) | 1 (`Toolbar.tsx`) | xem §2 |
| `keydown-ne-o-nhap` | 13 file | **10 file** (5 guard · 5 esc-only) + 1 dòng registry | 3 (`EditorCanvas` · `SlidePlayer` · `boq/BoqScreen`) | xem §3 |
| `cam-chu-tu-dong` | 17 chỗ | **14 chỗ** (+2 chỗ máy KHÔNG bắt, sửa cho nhất quán) | 3 (`Inspector.tsx:659,1168` · `TextToolbar.tsx:272`) | xem §4 |

## 2 · kinh-webkit-prefix — chi tiết

**7 file DÙNG THẬT `backdropFilter`/`backdrop-filter` → thêm prefix Webkit NGAY CẠNH, cùng giá trị blur (không đổi thị giác):**
- `components/cad/CamPathPanel.tsx` (×2 chỗ) · `CamPathControlPanel.tsx` · `PlanPresentPanel.tsx` · `ZonePanel.tsx` — `WebkitBackdropFilter: 'blur(14px)'`
- `components/collab/PresenceBar.tsx` — thêm vào inline style
- `components/shell/ModeShell.tsx` — thêm vào style object
- `components/library/gallery-css.ts` — CSS string: `-webkit-backdrop-filter:blur(6px);` trước dòng chuẩn

**10 file MÁY-BẮT-NHẦM** — chỉ NHẮC "backdrop-filter" trong COMMENT (đa số giải thích vì sao file CỐ Ý *không* dùng kính — G9/K1/K4): `RevitSummaryPanel` · `LoginScreen` · `LoginForm` · `Tool3DBar` · `GroupOverlay` (×2) · `InteriorNode` · `LibrarySheet` · `SessionWatch` · `ToolDock3D` · `MacroCreateDialog` (×2). Xử lý: **viết lại chữ trong comment** `backdrop-filter` → `backdrop blur` (giữ nguyên nghĩa kỹ thuật, hết khớp pattern) — KHÔNG nhét chuỗi `-webkit-` giả vào comment cho máy im (sạch giả), KHÔNG nới pattern (T0). Cùng cách phiếu cho phép ở luật "tự động" với comment. Nếu T muốn pattern tinh hơn (chỉ bắt code, bỏ comment) thì đó là việc registry đợt sau.

## 3 · keydown-ne-o-nhap — chi tiết

**(a) Phím CHỨC NĂNG → thêm guard đầu handler (khuôn repo: `document.activeElement` + INPUT/TEXTAREA/SELECT/isContentEditable):** 5 file
| File | Phím | Vì sao cần guard |
|---|---|---|
| `components/home/DongStudioHome.tsx` | Tab (giữ bung lớp dữ liệu) | đang gõ thì Tab = chuyển focus |
| `components/photo-editor/DocCanvas.tsx` | Space (pan) | gõ dấu cách trong input không được pan |
| `components/present/PresentViewer.tsx` | mũi tên/Space/PageUp-Down/Home/End | không lật trang khi đang gõ |
| `components/studio/StageSwitcher.tsx` | ⌘J/Ctrl+J | cùng khuôn input-guard AppShell/AppChrome (phiếu xếp ⌘X vào nhóm (a)) |
| `components/three/Scene3DViewer.tsx` (×2 listener) | WASD/mũi tên walk · Shift/x/y/z snap | gõ w/x/y/z trong input không di chuyển camera/khoá trục |
Keyup chỉ XOÁ trạng thái (nhả phím) → cố ý KHÔNG guard, an toàn hơn (không kẹt state khi keydown lọt trước lúc focus vào input).

**(b) Chỉ Escape (đóng/huỷ) → marker `esc-only`, KHÔNG guard (đúng chuẩn dialog):** 5 ca
`components/home/widgets/VitalsPill.tsx` · `components/materials/MaterialImpactPreview.tsx` · `components/project-init/ProjectInitBoard.tsx` · `components/render-studio/SectionPreviewOverlay.tsx` · `lib/useDismissable.ts` (phiếu chỉ định sẵn). Đã kiểm TỪNG ca: handler thật sự chỉ xử `e.key === 'Escape'`.

**Registry:** `scripts/thao-tac-registry.mjs` luật `keydown-ne-o-nhap` — thêm `esc-only` vào 2 dòng `mauThieu` + comment giải thích phán quyết T 13/08 (đúng ngoại lệ duy nhất phiếu cho phép).

## 4 · cam-chu-tu-dong — bảng cũ → mới (từng chỗ, không thay hàng loạt)

| Chỗ | Loại | Cũ → Mới | Lý do chọn từ |
|---|---|---|---|
| `LibraryPanel.tsx:61` | comment | "Tự động phân loại" → "Tự nhận loại" | đồng bộ nhãn UI mới |
| `LibraryPanel.tsx:118` | comment JSX | như trên | — |
| `LibraryPanel.tsx:147` | title (UI) | "Tự động: app tự nhận (…)" → "Tự nhận: app tự nhận loại (…)" | phân loại local 0-AI, tất định → "tự nhận" tả đúng cơ chế |
| `LibraryPanel.tsx` option (máy KHÔNG bắt) | UI | "⚡ Tự động phân loại" → "⚡ Tự nhận loại" | chính nhãn mà title/comment trỏ tới — sửa cho nhất quán |
| `cad/CadEditor.tsx:421` | status (UI) | "Đã bật backup tự động —" → "Đã bật backup định kỳ —" | cơ chế = ghi mỗi 10 phút, "định kỳ" là từ CHÍNH FILE này đã dùng ở dòng sub |
| `cad/CadEditor.tsx:723` | label (UI) | "Backup tự động: đang bật"/"Bật backup tự động" → "Backup định kỳ: …"/"Bật backup định kỳ" | như trên |
| `cad/CadEditor.tsx:1821` | title (UI) | "Tự động = fit khổ giấy" → "'Vừa khổ giấy' = fit theo khổ" | tỉ lệ in fit khổ = tất định, gọi thẳng hành vi |
| `cad/CadEditor.tsx` option (máy KHÔNG bắt) | UI | "Tự động (fit)" → "Vừa khổ giấy (fit)" | chính option mà title mô tả |
| `library/LibrarySheet.tsx:827` | tr() VI | "Mã không khớp tự động? Gán tay:" → "Máy chưa khớp được mã? Gán tay:" | máy suy khớp mã → nói rõ chủ thể "máy"; EN giữ nguyên |
| `render-studio/SectionExtractPanel.tsx:291` | vi (UI, mục CHUA_CO) | "Ghi kích thước tự động" → "Tự ghi kích thước" | bộ sinh dim tất định từ nét cắt; EN "Auto-dimension" giữ |
| `settings/AppearanceSettings.tsx:21` | label VI | "Tự động" → "Theo hệ thống" | theme auto = theo OS, tả đúng cơ chế (chuẩn macOS); EN "Auto" giữ |
| `settings/AppearanceSettings.tsx:36` | tr() VI | "Sáng / Tối / Tự động" → "Sáng / Tối / Theo hệ thống" | — |
| `smartselect/SmartSelectModal.tsx:320` | error (UI) | "Chọn vùng tự động thất bại." → "Magic chọn vùng thất bại." | SAM 2 = AI đoán → nhãn Magic (§2a) |
| `smartselect/SmartSelectModal.tsx:455` | nút (UI) | "Chọn vùng tự động" → "Magic chọn vùng" | nút đã sẵn Wand2 + accent = đủ dấu |
| `studio/AppCommandPalette.tsx:141` | tr() VI | "Đổi theme (tự động → sáng → tối)" → "(theo hệ thống → sáng → tối)" | đồng bộ AppearanceSettings; EN giữ |
| `LibraryPanel.tsx:193` | comment | 'khi để "Tự động"' → 'khi để "Tự nhận"' | comment trỏ nhãn mới |

i18n: các chuỗi `tr()` chỉ đổi vế VI — vế EN vốn không dùng "tự động" nên giữ nguyên, không lệch cặp.

## 5 · Nghiệm thu (chạy thật)

- `npm run soi:thao-tac` — 3 luật mục tiêu chỉ còn ĐÚNG các file present-editor đã nhường: `kinh-webkit-prefix` 1 file (`Toolbar.tsx`) · `keydown-ne-o-nhap` 3 file · `cam-chu-tu-dong` 3 chỗ. Dòng tổng nguyên văn: `🔴 5 LỆCH (trên 17 luật grep) · 👁 19 luật chờ mắt` — 5 lệch = 3 luật mục tiêu (còn ruột present-editor) + 2 luật hàng đợi có chủ ý (`outline-can-focus-visible` 31+1 · `cam-hex-inline` 193) KHÔNG đụng theo phiếu.
- `npx tsc --noEmit` — **exit 0, 0 lỗi**.
- `npm test` — pass toàn bộ (mọi dòng đếm đều "0 fail").
- `npm run soi:tu-dien` — **0 lệch định nghĩa** (đổi "Theo hệ thống"/"Tự nhận loại"/"Magic chọn vùng" không vỡ từ điển).
- `npm run check:chot` — **0 vi phạm chặn, 0 cảnh báo** (luật AI-CAM-TU-TU-DONG không vỡ ngược).

## 6 · CHƯA LÀM / nói thẳng

1. **7 file + 6 chỗ present-editor NHƯỜNG** cho agent HS (đợt sau lấy lại): webkit `Toolbar.tsx` · keydown `EditorCanvas.tsx`/`SlidePlayer.tsx`/`boq/BoqScreen.tsx` · tự-động `Inspector.tsx:659,1168`/`TextToolbar.tsx:272`.
2. **2 luật hàng đợi** (`outline-can-focus-visible` · `cam-hex-inline`) không đụng — đúng phiếu.
3. **10 file webkit máy-bắt-nhầm** xử bằng viết-lại-comment (§2) — nếu T muốn pattern chỉ soi code bỏ comment thì cần sửa registry, ngoài phạm vi phiếu này.
4. **Chưa verify browser** — phiếu cấm dev server; đổi nhãn/guard/prefix đều đã qua tsc + test + 3 máy soi. Nhãn mới ("Theo hệ thống", "Magic chọn vùng", "Vừa khổ giấy", "Tự nhận loại", "Backup định kỳ") thuộc nợ nghiệm thu MẮT chung.
5. `SmartSelectModal` có fallback hình học khi chưa nối model (dòng 318) — vẫn nằm dưới nút Magic; câu note tại chỗ đã nói rõ "tạm tạo vùng hình học", không đổi thêm.
