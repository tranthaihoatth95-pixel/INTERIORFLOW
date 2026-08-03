# SPEC · VE-SKETCH-TOUCH — Sketch mode trên tablet (bút · cử chỉ · radial · nắn nét)
**Ngày:** 04/08/2026 · **Vai lập:** COWORK-VẼ · **Trạng thái:** ĐỀ XUẤT (ship-trước-sửa-sau, hậu kiểm ca đêm)
**Kinh gốc:** `SPEC-CAD-MODES` §2-§3 (bậc N Sketch) + `SO-KIEM-TONG` §0c mảng 3 · **Nối:** `SPEC-MAT-DO-CON-TRO` (5 token con trỏ) · `SPEC-HOVER-FOCUS-IDF` §3.7 · NC-onboarding #7 (tooltip lần-đầu) · `app/foldable.css`
**§0b đủ 3 bước:** SEARCH (CadTouchDock·CadCanvas pinch·markup.ts 04/08) · NGHIÊN CỨU (chuẩn Procreate/Concepts/ArcSite đã dẫn trong SPEC-CAD-MODES §3) · NGƯỜI DÙNG THẬT (§0d).

## 0 · NGƯỜI DÙNG ĐÍCH
**§0d — KTS cầm iPad ngoài công trường:** đứng, một tay giữ máy một tay bút; nắng chói; ghi hiện trạng nhanh; vẽ sai phải hoàn tác TỨC THÌ không tìm nút; tì lòng bàn tay lên màn là chuyện mỗi nét; sợ nhất chạm nhầm phá bản vẽ. Mọi quyết định dưới đây trả lời cảnh đó — không phải cảnh ngồi bàn có chuột.

## 1 · HIỆN TRẠNG — có gì rồi (kiểm 04/08)
| Có sẵn | Ở đâu | Giữ/đắp |
|---|---|---|
| Pinch 2 ngón zoom/pan, tính từ gesture-start chống trôi | `CadCanvas.tsx:107-135, 523-535` (`ix.current.pinch`, `pointers` map theo pointerId) | GIỮ — cử chỉ mới đắp lên map này |
| `isTouchInput` + Delete FAB khi chọn trên cảm ứng | `CadCanvas.tsx:254-256` | GIỮ |
| Dock cảm ứng 6 nút (Ortho·Số liệu·Lệnh·Kéo·⏎·⎋) phát lại phím qua `cad:synth-key` — nút và phím CÙNG một nhánh logic | `CadTouchDock.tsx` (chỉ hiện Sketch, ≥44px) | GIỮ — thêm 2 nút §5 |
| Token con trỏ `--tap 44/--row/--gap…` tự đổi qua `(hover:none) and (pointer:coarse)` | `SPEC-MAT-DO-CON-TRO` §5 (đã chốt) | dùng, không chế thêm |
| Nét mực phác/markup | `lib/cad/markup.ts` | nơi DUY NHẤT pressure đổi nét (§2c) |
| Màn gập | `app/foldable.css` | nghiệm thu #12 |
**Thiếu (spec này đắp):** phân loại pen/touch + palm rejection · 2-chạm-undo/3-chạm-redo · radial menu · vẽ tay tự nắn · snap dung sai theo pointer.

## 2 · PHÂN LOẠI POINTER + PALM REJECTION (nền của mọi thứ)
### 2a · Pen-priority (chuẩn Procreate/Concepts — dân iPad quen sẵn)
```
state mới: ix.current.penSeen: boolean (bật khi thấy pointerType 'pen' lần đầu trong phiên sheet)
penSeen = true  → ngón tay KHÔNG vẽ nữa: touch chỉ pan/zoom/cử chỉ/chọn qua radial
penSeen = false → ngón vẽ bình thường (người không có bút không mất gì)
```
Nút gạt "Ngón tay vẽ" trong dock (tắt pen-priority thủ công — người mượn máy không bút của đồng nghiệp). Trạng thái lưu theo thiết bị (localStorage), không vào Doc.
### 2b · Palm rejection tầng web (tầng 1 là iPadOS đã lọc, tầng 2 chặn phần lọt)
| Luật | Cụ thể |
|---|---|
| Pen đang chạm → nuốt mọi touch MỚI | trong lúc tồn tại pointer 'pen' active: touch pointerdown mới → `preventDefault`, KHÔNG vào `pointers` map (không thành pinch/tap) |
| Vùng chạm to = lòng bàn tay | `ev.width/height ≥ 24px` (trình duyệt nào cung cấp) → bỏ qua pointer đó |
| Sau pen nhấc | 300ms tiếp theo vẫn nuốt touch mới (bàn tay nhấc chậm hơn bút) |
### 2c · Lực & nghiêng — KỶ LUẬT bản vẽ kỹ thuật
`pressure`/`tiltX/Y` **KHÔNG đổi lineweight entity CAD** (nét bản vẽ = lineweight theo layer, ISO 128 — bản vẽ không phải tranh). Pressure chỉ dùng 2 chỗ: ① nét markup/mực phác (`markup.ts`) — dày theo lực, đúng chỗ của nó; ② ngưỡng chống chạm sượt: nét pen `pressure < 0.05` toàn thời gian → coi là glide, không sinh entity.

## 3 · CỬ CHỈ — đắp lên `pointers` map sẵn có
| Cử chỉ | Định nghĩa | Hành vi |
|---|---|---|
| 2 ngón pinch/kéo | ≥1 ngón di >8px HOẶC giữ >250ms | zoom/pan — CODE CŨ GIỮ NGUYÊN, chỉ thêm điều kiện kích hoạt trễ dưới đây |
| **2 ngón TAP** | cả 2 down→up <250ms, di <8px | **UNDO** 1 nấc |
| **3 ngón TAP** | như trên, 3 ngón | **REDO** 1 nấc |
**Điểm sửa duy nhất ở pinch cũ:** hiện pinch kích hoạt NGAY khi ngón thứ 2 chạm — đổi thành kích hoạt khi vượt ngưỡng (di >8px hoặc giữ >250ms); chưa vượt mà up cả → xét tap-undo/redo. Dưới ngưỡng thời gian đó pinch chưa từng vẽ gì nên người dùng không thấy khác. Không thêm cử chỉ nào nữa (3-ngón-swipe, 4 ngón…) — ngoài công trường cử chỉ chồng nhau = chạm nhầm.

## 4 · RADIAL MENU — giữ-lâu quanh ngón/bút
### 4a · Kích hoạt & tương tác
- **Giữ 450ms, di <8px** (touch HOẶC pen; chuột KHÔNG — chuột có chuột phải + phím tắt) → radial 8 múi quanh đúng điểm chạm; gần mép màn tự dịch vào đủ hình.
- Kéo vào múi → múi sáng (≥ cỡ `--tap`), **thả = chọn**; thả ngoài vòng = huỷ êm. Một cử động giữ-kéo-thả, không cần chạm lần 2 (một tay đang giữ máy).
- Bắt đầu di chuyển TRƯỚC 450ms → thành drag/vẽ bình thường, radial không hiện (khớp `DRAG_ACTIVE_THRESHOLD_PX` đã có).
### 4b · 8 múi theo NGỮ CẢNH — vị trí theo NHÓM cố định (muscle memory: 12h luôn là chốt, 6h luôn là huỷ)
| Múi (giờ) | Đang CHUỖI VẼ | Đang CHỌN entity | Nền trống |
|---|---|---|---|
| 12h | Chốt ⏎ | Nhân bản | Đường L |
| 1h30 | Khoá trục Y | Xoay | Chữ nhật REC |
| 3h | Số liệu (F12) | Layer… | Phòng ROOM |
| 4h30 | Khoá trục X | Khoá/Mở | Tròn C |
| 6h | Huỷ ⎋ | — (trống) | Kéo Pan |
| 7h30 | Lùi 1 điểm | Thuộc tính | Hoàn tác |
| 9h | Snap ± | Move | Polyline PL |
| 10h30 | Đổi công cụ… | Xoá | Dòng lệnh |
Múi gọi lệnh qua **sổ lệnh** (`registry.ts` PHU đang làm — múi = `cmdsFor(ctx)` lọc surface 'radial'); registry chưa xong thì tạm phát `cad:synth-key` như dock (TODO nối, khớp cách CHINH xử phím ⌘K).

## 5 · VẼ TAY TỰ NẮN (shape recognition) — chỉ Sketch, chỉ pen/touch
- **Hai đường vào cùng sống:** tap-tap = click-click như cũ (không phá); **drag một nét dài = freehand → nắn khi thả**. Chuột không đổi gì.
- Lib thuần PHU: `recognizeStroke(pts, {tolMm}) → {kind:'line'|'polyline'|'rect'|'circle'|'closed-polyline'|'none'}`:
| Nhận dạng | Ngưỡng (đối chiếu khi test thật, được phép tinh chỉnh ±30%) |
|---|---|
| RDP simplify trước | epsilon = max(8mm world, 1.5% chiều dài nét) |
| Thẳng | lệch max khỏi dây cung < max(2% dài, 8mm) |
| Ép trục ngang/dọc | góc so trục < 5° |
| Polyline | RDP còn ≤ 8 đỉnh → giữ đỉnh, các cạnh gần trục ép trục |
| Đóng vòng | khoảng đầu-cuối < 3% chu vi → khép + snap đỉnh đầu |
| Tròn | nét khép, variance bán kính quanh centroid < 12% |
| Chữ nhật | 4 góc 90°±10° sau RDP |
| `none` | không đạt gì → GIỮ nét là polyline thô (không vứt công người vẽ) |
- Preview: 200ms nét thô mờ → kết quả nắn đậm → chốt (1 undo). Vẽ sai? 2 chạm — hoàn tác tức thì, đúng cảnh công trường.
- Tool áp: L·PL·WALL·REC·C ở Sketch. ROOM giữ 2-góc (đã 1 cử chỉ, không cần nắn). KHÔNG áp Pro (Pro = chính xác mm, nắn là phá).

## 6 · SNAP DUNG SAI + GLYPH THEO POINTER
| Pointer | `tolMm()` nhân | Glyph snap r |
|---|---|---|
| chuột (hiện tại) | ×1 | 6 (hiện tại) |
| pen | ×1.5 | 7 |
| ngón | ×2.5 | 9 |
Móc: `tolMm()` + `drawSnap()` `CadCanvas.tsx` đọc `ix.current.lastPointerWasTouch` (SẴN) — thêm phân biệt pen (lưu `lastPointerType`). Màu/hình glyph theo `SPEC-VE-INFERENCE` §2, chỉ đổi cỡ.

## 7 · LỘ RA NÚT + DẠY 1 LẦN (§0c: cấm chức-năng-chỉ-cử-chỉ)
- `CadTouchDock` thêm 2 nút **Hoàn tác/Làm lại** (synth ⌘Z/⌘⇧Z) — cử chỉ là lối tắt, nút là lối chính thức. Dock 8 nút vẫn 1 pill.
- Tooltip lần-đầu (NC-onboarding #7, khuôn mách-nước): lần đầu vào Sketch bằng cảm ứng → đúng 1 tooltip *"Giữ lâu: menu nhanh · Chạm 2 ngón: hoàn tác"* + nút "Đã hiểu", hiện đúng 1 lần (localStorage).
- Radial/dock của Sketch KHÔNG xuất hiện ở Pro/Revit (Pro đã ẩn dock sẵn — giữ luật).

## 8 · CHIA VIỆC + NGHIỆM THU
**PHU (lib thuần + test):** `lib/cad/stroke-recognize.ts` (`recognizeStroke` + test ≥ 10 nét mẫu: thẳng xiên/gần-trục/chữ L/vòng méo/scribble-none…) · hằng dung sai pointer (bảng §6) export từ 1 chỗ.
**Wiring CadCanvas** (penSeen·palm·tap-undo·radial·freehand hook) + **CadTouchDock 2 nút** + tooltip lần-đầu: TỔNG phân (CadCanvas chưa gán chủ — ghi lần 3; CadTouchDock nằm `components/cad/*` cùng tình trạng).
**Đặc tả mock bằng chữ (phiên nhận mảng tự dựng):** radial = vòng kính mờ `--blur` bán kính ~132px, 8 múi cách nhau hairline, múi active nền `--accent-soft` viền `--accent-ring`, nhãn ≤2 từ + icon lucide, đủ 2 theme; dock thêm 2 nút cùng pill hiện có.

**Nghiệm thu (đo được — chuẩn công trường):**
1. Có pen: ngón pan/zoom, KHÔNG sinh entity; gạt "Ngón tay vẽ" → ngón vẽ lại được.
2. Vẽ pen liên tục 20 nét có tì lòng bàn tay: 0 entity rác, 0 cú pan giật (đếm entity trước/sau = 20).
3. 2 chạm → undo đúng 1 nấc; 3 chạm → redo; làm 10 lần liên tiếp không miss; 2 ngón đặt-rồi-kéo → pinch, KHÔNG undo nhầm.
4. Giữ 450ms → radial đủ 8 múi đúng bảng ngữ cảnh §4b; kéo-thả vào "Xoá" xoá được; thả ngoài không gì xảy ra; giữ-rồi-kéo-sớm → vẽ thường, radial không hiện.
5. Radial mở sát mép màn → tự dịch vào, không múi nào bị cắt.
6. Nét tay ~2m lệch <8mm → line thẳng; gần ngang → ép ngang tuyệt đối; vòng méo <12% → circle; scribble → polyline thô GIỮ nguyên, không mất.
7. Chuột: toàn bộ hành vi cũ y nguyên (kể cả không radial); Pro mode: 0 thay đổi.
8. Snap: đo px màn vùng bắt ngón = 2.5× chuột; glyph r=9 dưới ngón.
9. Nét pen lực <0.05 suốt nét → không sinh entity; markup dày theo lực.
10. Dock có Hoàn tác/Làm lại ≥44px; mọi cử chỉ đều có đường nút/phím tương đương (§0c-1/3).
11. Tooltip lần-đầu hiện đúng 1 lần, có nút, ≤12 từ (`SPEC-NGON-NGU-CHI-DAN`).
12. Màn gập (foldable.css): radial không đè bản lề khi mở ở nửa màn có hinge — kiểm theo môi trường giả lập foldable đã dùng cho file css đó.

---
*Nguồn hành vi: Procreate/Concepts (2-chạm undo, pen-priority) · ArcSite (dock — đã là tham chiếu của CadTouchDock) · Concepts/Morpholio (nắn nét — dẫn trong SPEC-CAD-MODES §3). Đối chiếu code 04/08/2026.*
