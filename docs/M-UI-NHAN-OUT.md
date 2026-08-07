# M-UI-NHAN-OUT — phiếu G-M15 (sửa chữ + màu thanh chặng)

Phạm vi: `components/studio/StageSwitcher.tsx` · `lib/phases.ts` · `lib/cad/store.ts` (chỉ
comment) + 14 chuỗi nhãn "CAD". CHỈ sửa chữ/màu, không đụng logic (đã tự kiểm: mọi thay đổi
logic duy nhất là bỏ tham số `cadStage` khi gọi `phaseLabel()` cho nhãn hiển thị — bản thân
`phaseLabel()` không xoá, `shouldShowProTools()` không đổi 1 dòng hành vi nào, chỉ đổi comment).

## VIỆC 1 — G-M15-01 · tương phản nút chặng không active

`components/studio/StageSwitcher.tsx:277` — đổi `color: on ? 'var(--t1)' : 'var(--t4)'` →
`color: on ? 'var(--t1)' : 'var(--t3)'`.

Đo lại tương phản (WCAG 2.1, công thức luminance chuẩn), nền là `--panel`/`--card` (nút
inactive nằm trên `.if-dock` với `background: var(--mat-panel)` — xấp xỉ `--panel`; nút active
có thêm lớp pill `--card` phía sau):

| | nền `--panel` | nền `--card` |
|---|---|---|
| dark `--t4` (cũ) | 3.65:1 ❌ | 3.44:1 ❌ |
| dark `--t3` (mới) | 6.93:1 ✅ | 6.53:1 ✅ |
| light `--t4` (cũ) | 2.86:1 ❌ | 3.04:1 ❌ |
| light `--t3` (mới) | 4.90:1 ✅ | 5.20:1 ✅ |

Cả 4 tổ hợp mới đều ≥4.5:1 (luật G2). Verify browser thật (127.0.0.1:3001, demo@if.local):
`getComputedStyle` đọc trực tiếp nút `.stage-btn` —
- Light theme: inactive `rgb(114,108,98)` = `#726c62` = đúng `--t3` light.
- Dark theme: inactive `rgb(158,158,168)` = `#9e9ea8` = đúng `--t3` dark.
- Active cả 2 theme vẫn `--t1` (không đổi).

## VIỆC 2 — G-M15-02 · gộp tên CHẶNG với tên MODE

`components/studio/StageSwitcher.tsx:247,299` — trước gọi `phaseLabel(p.id, cadStage)` (ra
"Thiết kế 2D · Sơ phác"/"· Kỹ thuật"), nay đổi thành `p.label` (chỉ "Thiết kế 2D"/"Thiết kế
3D"/"Trình chiếu") cho cả nhãn tooltip lẫn chữ trên nút. `phaseLabel()` trong `lib/phases.ts`
GIỮ NGUYÊN (không xoá hàm, không đổi behavior — chỉ StageSwitcher ngừng truyền `cadStage` vào).
Xoá import `phaseLabel` không dùng nữa; sửa comment `WIDEST_LABEL` (block trước mô tả 2 biến
thể theo cadStage, nay không còn đúng — cập nhật lại lý do ghost-width).
Verify browser: chụp cả 2 theme, thanh chặng hiện đúng "Thiết kế 2D · Thiết kế 3D · Trình
chiếu", không còn hậu tố mode. Mode (Sơ phác/Kỹ thuật) vẫn hiện đúng ở dải riêng bên dưới
(ngoài phạm vi sửa của phiếu này).

## VIỆC 3 — G-M15-05 · sửa comment sai chữ

`lib/cad/store.ts:156` — đổi comment `// override thủ công (backward-compat) — revit = siêu
tập của pro` → `// 07/08 Hoà chốt: người dùng TỰ BẤM CHỌN mode — đây là ĐƯỜNG CHÍNH, không phải
override. revit = siêu tập của pro`. Logic dòng này (0 ký tự code đổi) đã đúng từ trước — `if
(cadMode === 'pro' || cadMode === 'revit') return true;` đặt TRƯỚC 2 dòng role nên lựa chọn thủ
công vốn đã thắng; chỉ chữ mô tả sai bản chất.

## VIỆC 4 — G-M15-06 · bỏ chữ "CAD" khỏi nhãn người dùng (14 chỗ)

| file:dòng | Trước | Sau | ĐỔI/GIỮ · Vì sao |
|---|---|---|---|
| `lib/phases.ts:36` | `Import CAD 2D · vẽ sơ phác · bố trí furniture` | (viết lại toàn câu, xem Việc 5) | GIỮ nghĩa "CAD" trong câu cũ = import file DWG/DXF; câu mới ở Việc 5 không còn dùng chữ CAD |
| `components/present-editor/PresentEditor.tsx:337` | `Bản vẽ CAD · CAD Layout` | `Bản vẽ kỹ thuật · Thiết kế 2D` | ĐỔI — kicker slide khi handoff từ CAD-editor, nói về CHẶNG nguồn (Thiết kế 2D), không phải định dạng tệp |
| `components/render-studio/ModeSwitchCell.tsx:33` | `khối đùn từ bản vẽ CAD` / `the CAD drawing` | `khối đùn từ bản vẽ Thiết kế 2D` / `the 2D Design drawing` | ĐỔI — tooltip nói "khối 3D lấy dữ liệu từ chặng Thiết kế 2D", không phải định dạng tệp |
| `components/LibraryPanel.tsx:25` | `'CAD / Sketch'` | `'Thiết kế 2D / Sketch'` | ĐỔI — category thư viện map thẳng vào chặng `concept` (xác nhận qua `lib/ref-search.ts:253` `PHASE_CATEGORIES.concept`) |
| `lib/library/types.ts:86` | `cad: { label: 'CAD' }` | `cad: { label: 'Thiết kế 2D' }` | ĐỔI — chỉ đổi nhãn hiển thị, KHÔNG đổi key `cad` (StageKey) — dùng ở `PublishModal.tsx` dropdown chọn chặng xuất bản |
| `lib/refingest.ts:45` | `{ id: 'cad', label: 'CAD / Bản vẽ' }` | *(không đổi)* | GIỮ — đây là tag PHÂN LOẠI TỆP khi ingest (PDF/Excel/CAD…), nói về định dạng/loại tài liệu tải lên, không phải chặng |
| `lib/library/shelves.ts:155` | `Dự toán live-link CAD` | `Dự toán live-link Thiết kế 2D` | ĐỔI — tên preset BOQ mô tả tính năng liên kết sống tới dữ liệu bản vẽ (chặng Thiết kế 2D), không phải định dạng tệp |
| `app/library/ingest/page.tsx:16` | `cad: 'CAD'` (badge loại tệp) | *(không đổi)* | GIỮ — badge loại file y hệt PDF/XLS, đúng nghĩa định dạng tệp |
| `app/library/ingest/page.tsx:291` | `Kéo-thả nhiều ảnh / PDF / Excel / CAD vào đây` | *(không đổi)* | GIỮ — hướng dẫn dropzone liệt kê ĐỊNH DẠNG TỆP chấp nhận (khớp `accept=".dxf,.dwg"`) |
| `components/settings/GuModelSettings.tsx:130-131` | `gợi ý bố trí CAD` / `CAD layout suggestions` | `gợi ý bố trí ở Thiết kế 2D` / `2D Design layout suggestions` | ĐỔI — mô tả tính năng học-gu diễn ra ở CHẶNG Thiết kế 2D |
| `lib/nodes/registry.ts:210` | `sketch hoặc CAD export (PNG/JPG)` | *(không đổi)* | GIỮ — mô tả NGUỒN ảnh: ảnh export ra từ một phần mềm CAD, đây là ngữ cảnh định dạng/nguồn tệp, không phải chặng |
| `lib/nodes/defs/render-v2.ts:292` | `Tầng lõi tất định (CAD→OBJ extrude)` | `Tầng lõi tất định (Thiết kế 2D→OBJ extrude)` | ĐỔI — badge mô tả pipeline: dữ liệu Thiết kế 2D (Doc) được extrude ra OBJ, không phải "xuất từ định dạng CAD" |

Hệ quả bắt buộc đi kèm 1 chỗ ngoài danh sách gốc (không đổi thêm nhãn nào khác, chỉ giữ 2 nơi
tham chiếu cùng 1 chuỗi khớp nhau): `lib/ref-search.ts:253` `PHASE_CATEGORIES.concept` đổi
`'CAD / Sketch'` → `'Thiết kế 2D / Sketch'` để khớp `LIBRARY_CATEGORIES` mới — nếu không đổi,
`orderCategoriesByPhase()` mất priority-match (category không còn ưu tiên đúng chặng), tức đây
là sửa CHỮ nhưng phải đồng bộ 2 nơi để không vỡ hành vi có sẵn.

## VIỆC 5 — rà 3 tagline theo chốt 07/08

`lib/phases.ts`:
- `:36` concept: `'Import CAD 2D · vẽ sơ phác · bố trí furniture'` → `'Sơ phác ↔ Chuyên (gồm
  Revit 2D) · vẽ mặt bằng · bố trí nội thất'` — thêm đúng 2 ý thiếu (Revit 2D + khái niệm 2
  mode), giữ tinh thần "1 dòng, không dài hơn nhiều".
- `:51` render: `'Clay → photoreal · chỉnh cục bộ'` → `'Dựng khối (gồm Revit 3D) · Clay →
  photoreal · chỉnh cục bộ'` — thêm Revit 3D + dựng khối.
- `:88` present: không đụng (đã khớp chốt).

## Nghiệm thu N6 — ảnh chụp thanh chặng sau khi sửa

Verify browser thật 127.0.0.1:3001 (demo@if.local/demo1234, "Dự án mẫu", route `/` node-canvas
chặng Thiết kế 3D):
- Light theme: 3 nút "Thiết kế 2D · Thiết kế 3D · Trình chiếu", không hậu tố mode, chữ inactive
  đọc rõ trên nền panel.
- Dark theme (`window.__flowStore.setThemePref('dark')`): 3 nút cùng nhãn, chữ inactive vẫn đọc
  rõ, không mờ như trước.
- `getComputedStyle` xác nhận đúng token `--t3` cả 2 theme (số liệu ở Việc 1).
- 0 lỗi console liên quan.

`npx tsc --noEmit -p .` sạch phần việc này (1 lỗi tsc pre-existing không liên quan ở
`lib/cad/render-layer-index.test.ts:36`, không đụng tới trong phiếu này).

Không commit (V6). Không đụng logic ngoài phạm vi liệt kê trên.
