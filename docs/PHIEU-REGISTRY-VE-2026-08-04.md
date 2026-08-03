# PHIẾU · BỔ SUNG REGISTRY CHO 4 SPEC VẼ — giao PHU
**Ngày:** 04/08/2026 · **Vai lập:** COWORK-VẼ (ĐỢT 3) · **Nhận:** PHU (chỉ `lib/commands/registry.ts` + lib thuần — wiring UI vẫn chờ TỔNG gán chủ `components/cad/*`)
**Đã rà:** `registry.ts` 389 dòng sau merge × 4 spec (`SPEC-VE-INFERENCE` · `REVIT-MODE` · `LAYOUT-PAPER` · `SKETCH-TOUCH`). `WhenCtx.mode` đã nhận 'sketch'|'pro'|'revit' + parser `when()` sẵn (`registry.ts:75,138`) — KHÔNG cần mở rộng ctx.

## 1 · VA CHẠM PHẢI XỬ TRƯỚC — D/WIN: block rời vs cửa hosted
Hiện trạng (`registry.ts:199-200`): `cad.draw.door`/`cad.draw.window` alias `D·DOOR`/`WIN·WINDOW`, `when: CAD_BASIC`, `run: setPendingBlock('door'|'window')` — đặt **block RỜI** thư viện 46.
Spec `REVIT-MODE` §4: ở `mode=='revit'` cửa/cửa sổ là **hosted** (con của WallRun, Space đảo chiều).
**Xử (một sổ lệnh, ba lát cắt when — đúng kinh §5):** GIỮ id + alias, TÁCH `when`:
```
cad.draw.door   when: CAD_BASIC && mode != 'revit'  → setPendingBlock('door')   (y cũ)
cad.draw.door.hosted  — KHÔNG. Không sinh id mới:
  → run phân nhánh theo ctx.mode ngay trong run() của cad.draw.door:
    mode=='revit' ? activate('door' /* tool hosted mới, store Tool union */) : setPendingBlock('door')
```
Chọn phân nhánh trong `run` (1 CommandDef/1 alias/1 nhãn — palette không hiện 2 dòng "Cửa đi"), KHÔNG tách 2 def cùng alias (dễ lệch nhãn/nhóm về sau). `cad.draw.window` y hệt. Test: `cmdsFor` mode revit và pro cùng trả 1 lệnh D, chạy ra 2 nhánh đúng.

## 2 · LỆNH MỚI CẦN THÊM (đều CHƯA có — đã grep 0 kết quả)
| id | label vi/en | aliases | when | group | surfaces | run |
|---|---|---|---|---|---|---|
| `cad.draw.roomsep` | Đường chia phòng / Room separator | `RS`, `ROOMSEP` | `stage=='cad' && mode=='revit'` | draw@sau room | statusbar·palette·llm | activate('roomsep') |
| `cad.edit.roomupdate` | Cập nhật phòng / Update room | `RU`, `ROOMUPDATE` | như trên | edit | statusbar·palette·llm | activate('roomupdate') |
| `cad.layout.viewport` | Khung nhìn / Viewport | `VP` | `stage=='cad' && mode!='sketch'` **&& tab layout** — tab-kind chưa có trong WhenCtx: pha 1 dùng `proToolsAllowed` + guard trong run (status báo "Chỉ dùng trong Tờ in"), pha 2 thêm `ctx.sheetKind` (ghi TODO trong code) | layout (bucket MỚI `layout@1`) | statusbar·palette·llm | activate('viewport') |
| `cad.layout.titleblock` | Khung tên / Title block | `TB` | như VP | layout@2 | statusbar·palette·llm | chèn `titleBlockPro(…, scaleN=1)` |
| Lệnh ROOM (đã có `cad.draw.room:196`) | — | — | GIỮ `gateFor('room')`; hành vi revit=click-vùng-kín phân nhánh trong TOOL, không đụng registry | — | — | — |
Ghi chú: `activate('door'/'roomsep'/'viewport'…) đòi Tool union mở rộng (`store.ts`) — thuộc phần lib spec REVIT/LAYOUT §5/§6 đã giao PHU, phiếu này chỉ nhắc để làm CÙNG LƯỢT, tránh registry trỏ tool chưa tồn tại (tsc bắt được).

## 3 · SURFACE `'radial'` (SKETCH-TOUCH §4b — registry đã merge nên nối đường chính thức)
1. `Surface` union (`registry.ts:64`) += `'radial'`.
2. Gắn `'radial'` vào surfaces các lệnh múi "nền trống": `cad.draw.line`·`polyline`·`rect`·`circle`·`room`·`pan`·undo·dòng lệnh (đúng bảng §4b spec).
3. **4 hành-động-trong-chuỗi chưa là lệnh** (Chốt ⏎ · Huỷ ⎋ · Lùi 1 điểm · Khoá trục X/Y): thêm nhóm `cad.act.*` — `commit`/`cancel`/`backpoint`/`lockX`/`lockY`, surfaces `['radial']` (KHÔNG statusbar/palette — tránh rác 2 mặt kia), `run` = phát `cad:synth-key` tương ứng (⏎/⎋/…) để đi CÙNG nhánh keydown như CadTouchDock (`CadTouchDock.tsx` docstring — một nhánh logic, không bản sao). Khoá trục synth `ArrowRight`/`ArrowUp` theo `SPEC-VE-INFERENCE` §3b.
4. Test: `cmdsFor({stage:'cad', mode:'sketch'})` lọc surface 'radial' trả đúng 8 múi ngữ cảnh nền-trống; mode pro trả 0 (radial chỉ Sketch).

## 4 · KHÔNG THUỘC REGISTRY (đã rà, ghi để PHU khỏi tưởng sót)
VCB/AMEND + `3x` `/3` (INFERENCE §4 — parser `lib/cad/vcb.ts`, không phải lệnh) · phím mũi tên khoá trục (keydown CadCanvas) · Shift ghim snap · preset xuất PDF (nút UI, không lệnh gõ) · cử chỉ chạm (pointer, không lệnh).

## 5 · NGHIỆM THU PHIẾU
1. Đếm lệnh registry trước/sau: +6 (`roomsep`·`roomupdate`·`viewport`·`titleblock` + 5 `cad.act.*` = +9 nếu tính act; act không hiện palette nên đếm palette +4) — không mất lệnh cũ nào (luật đếm trước/sau của phiếu PHU mục 3 cũ).
2. Gõ `D` ở mode pro → pending block như cũ; mode revit → tool hosted (khi Tool union có; chưa có thì nhánh revit tạm status "sắp có" — KHÔNG chặn merge registry trước).
3. `VP` ở sketch → không có trong palette lẫn statusbar; ở pro tab model → chạy được nhưng status "Chỉ dùng trong Tờ in".
4. tsc + test registry pass; `cmdsFor` radial như §3.4.

---
*Căn cứ: registry.ts:64/75/138/196/199-200 đọc 04/08 sau merge fbd9cc1/fdc5c0c/c1cf8cd. Việc 3 cũ (10 khuyết ①-⑩) VẪN chờ PHU gap-check — kiểm lần 3 phiên này, BAO-CAO-PHU chưa có mục đó.*
