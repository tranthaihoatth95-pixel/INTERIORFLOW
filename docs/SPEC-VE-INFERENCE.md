# SPEC · VE-INFERENCE — trạng thái inference + VCB gõ-số-sau
**Ngày:** 03/08/2026 · **Vai lập:** COWORK-VẼ · **Trạng thái:** ĐỀ XUẤT (TỔNG duyệt)
**Kinh gốc:** `SPEC-LENH-VE-IF.md` §1 (tay SketchUp) + §4 khuyết ② · **Nối:** `SPEC-DESIGN-SYSTEM-IF` (token) · PHU §3 mục 5 (`SO-KIEM-TONG`)

> Mục tiêu: chi tiết đến mức PHU code phần lib KHÔNG phải hỏi. Mọi điểm móc code dưới đây đã
> đối chiếu code thật 03/08 (`CadCanvas.tsx` 3441 dòng · `store.ts` · `query.ts`).

## 0 · NGUYÊN TẮC
1. **Đắp, không đập.** Dynamic input (`dynBuf`) + OSNAP 10 loại + ortho/polar ĐÃ CHẠY — spec này chỉ thêm 4 lớp: màu inference · khoá Shift/mũi tên · AMEND (gõ-số-SAU-chốt) · `3x` `/3`.
2. Màu qua **token CSS var**, cấm hardcode hex (luật `00-CHOT` ③). Tên token ở §2, giá trị cuối do COWORK-UI ghi vào `SPEC-DESIGN-SYSTEM-IF`.
3. Glyph hình học của `drawSnap()` **GIỮ NGUYÊN** (vuông/tam giác/tròn/X… chuẩn AutoCAD, dân CAD đọc hình) — chỉ đổi màu theo nhóm. Người mới đọc MÀU, dân nghề đọc HÌNH.

## 1 · HIỆN TRẠNG — cái gì có sẵn, móc ở đâu (PHU khỏi grep lại)
| Cơ chế | Điểm móc | Ghi chú |
|---|---|---|
| OSNAP 10 loại bật/tắt | `store.ts:179 SnapSettings` | endpoint·midpoint·center·intersection·grid·quadrant·node·nearest·perpendicular·tangent |
| Bắt điểm | `lib/cad/query.ts:28 findSnap()` → `SnapResult{pt,type}` | gọi tại `CadCanvas.tsx:498` mỗi pointermove |
| Vẽ glyph snap | `CadCanvas.tsx:2923 drawSnap(ctx,v,accent)` | 1 màu `accent` cho mọi loại — §2 sửa chỗ này |
| Gõ số TRONG chuỗi | `ix.current.dynBuf` + `effectivePoint(base)` `CadCanvas.tsx:447` | số đơn = độ dài theo hướng con trỏ (fallback hướng Đông khi trùng base) · `X,Y` · `@dx,dy` qua `parseCoordInput` |
| Enter chốt/đặt tham số | `commitEnter()` `CadCanvas.tsx:928` | fillet/chamfer/lengthen/offset đã nhận số — GIỮ |
| Ortho | Shift = tạm (`ix.current.ortho`) · F8 = `st.orthoLock` | `applyConstraint` `CadCanvas.tsx:423` — ortho thắng polar |
| Polar tracking | `st.polarTracking` + `st.polarStep` | bắt bội số góc, chưa vẽ đường gióng |
| Heads-up VCB | F12 `st.dynInput` | vị trí hiển thị đã có |

## 2 · MÀU INFERENCE — 4 nhóm + 2 trục (6 token mới)
Đổi chữ ký: `drawSnap(ctx, v, accent)` → đọc màu theo `sn.type` từ bảng dưới (accent giữ làm fallback).

| Nhóm | Token đề xuất | Giá trị đề xuất* | Loại snap áp |
|---|---|---|---|
| Điểm thật trên vật | `--snap-point` | `#35b46f` (lục) | endpoint · node |
| Điểm suy ra | `--snap-derived` | `#3f8fd6` (lam) | midpoint · center · quadrant |
| Trên cạnh / quan hệ | `--snap-edge` | `#d05b5b` (đỏ dịu) | nearest · intersection · perpendicular · tangent |
| Lưới | `--snap-grid` | `var(--accent-soft)` | grid |
| Trục X | `--axis-x` | `#d05b5b` | đường gióng ngang (§3) |
| Trục Y | `--axis-y` | `#35b46f` | đường gióng dọc (§3) |

\* Giá trị cuối: COWORK-UI chốt theo 2 theme (test contrast trên nền canvas Tối mặc định + Sáng) rồi ghi vào `SPEC-DESIGN-SYSTEM-IF` — `00-CHOT` ghi chú mục "màu trục 3D" đã có trong design system: **dùng CÙNG token đó cho trục 2D**, không sinh cặp thứ hai. Code dùng `var(--snap-point, #35b46f)` — có fallback, không chờ nhau.

**Ưu tiên khi nhiều snap trùng tolerance** (giữ nếu `findSnap` đã đúng, chỉ bảo đảm bất biến): endpoint > intersection > midpoint > center > quadrant > node > perpendicular > tangent > nearest > grid. Bất biến quan trọng nhất: **endpoint luôn thắng nearest** (không thì không bao giờ nối kín được phòng).

## 3 · KHOÁ RÀNG BUỘC — Shift hợp nhất · mũi tên khoá trục · đường gióng
### 3a · Shift = khoá RÀNG BUỘC HIỆN HÀNH (hợp nhất SketchUp + ortho cũ, không phá thói quen)
```
pointermove khi Shift đang giữ:
  nếu lúc NHẤN Shift đang có snap (snap.type ∉ {none, grid}):
      ix.current.lockedSnap = snap tại thời điểm nhấn   // GHIM điểm đó
      → effectivePoint() trả lockedSnap.pt bất kể con trỏ rê đi đâu
  ngược lại:
      ix.current.ortho = true                            // code CŨ, giữ nguyên
nhả Shift / Esc / commit điểm → lockedSnap = null
```
Giải quyết đúng nỗi đau SketchUp giải: snap nhấp nháy giữa nhiều điểm gần nhau → giữ Shift là ghim. Ai quen ortho-tạm cũ: rê ra chỗ trống rồi giữ Shift — hành vi y hệt trước.

### 3b · Phím mũi tên = khoá TRỤC tường minh (mới)
| Phím | Hành vi | State |
|---|---|---|
| `→` | toggle khoá trục X | `ix.current.axisLock: 'x'\|'y'\|null` |
| `↑` | toggle khoá trục Y | nhấn lại cùng phím = bỏ; nhấn phím kia = đổi trục |
| `←` `↓` | **chưa gán** (dành pha sau: song song/vuông góc cạnh hover) | — |

Chỉ hoạt động khi đang trong chuỗi vẽ (`pts.length > 0` hoặc tool thuộc nhóm vẽ) — **không đụng** tool `select` (tránh chiếm phím nudge tương lai). Esc xoá `axisLock` (thêm vào nhánh Escape sẵn có `CadCanvas.tsx:~2047`). Thứ tự ưu tiên trong `applyConstraint`: **axisLock > ortho (Shift/F8) > polar**.

### 3c · Đường gióng (guide) — vẽ trong vòng render, hàm mới `drawGuides()`
| Khi | Vẽ | Màu |
|---|---|---|
| axisLock hoặc ortho đang ép trục | đường FULL viewport qua `base` theo trục | `--axis-x` / `--axis-y`, nét đứt 1px, alpha 0.6 |
| polar bắt được bội số góc | đường qua `base` theo góc đó | `var(--accent)`, alpha 0.4 |
| lockedSnap active | vòng nhấn kép quanh điểm ghim (r=9, 2 nét) | màu theo nhóm snap §2 |
Xuất hiện TỨC THÌ, không animate (canvas redraw mỗi frame sẵn — và khớp reduce-motion).

## 4 · VCB GÕ-SỐ-SAU (AMEND) + `3x` `/3`
### 4a · State machine
```
IDLE ──gõ phím số/toạ độ──▶ TYPING (dynBuf ≠ '', TRONG chuỗi — ĐÃ CÓ, giữ nguyên)
IDLE-sau-chốt (pts=[] và lastOp ≠ null) ──gõ số──▶ AMEND ──Enter──▶ applyAmend() → vẫn AMEND
lastOp bị xoá khi: đặt điểm mới · đổi tool · Esc · undo/redo → về IDLE thường
```
### 4b · `LastOp` — state mới trong `ix.current`
```ts
interface LastOp {
  kind: 'segment' | 'rect' | 'circle' | 'move' | 'copy' | 'rotate';
  ids: string[];      // entity vừa tạo (hoặc vừa dời)
  base: Pt;           // điểm neo — amend GIỮ base
  dir: Pt;            // vector ĐƠN VỊ hướng thao tác (segment/move) — amend giữ hướng
  value: number;      // giá trị vừa chốt: mm (len/dist) hoặc độ (rotate)
  snapshotDone: boolean; // false → amend ĐẦU snapshot() rồi set true; amend sau mutate thẳng
}
```
Quy tắc undo: **cả chuỗi amend liên tiếp = MỘT nấc undo** (snapshot đúng 1 lần ở amend đầu — các lần gõ tiếp mutate trực tiếp). Đây là điểm khác AutoCAD (mỗi lần 1 nấc) — chọn chủ đích: gõ 3 lần sửa số là "một ý định".

### 4c · Parser `parseVcb(s: string)` — PHU viết ở `lib/cad/vcb.ts` (MỚI, thuần, có test)
| Input | Kết quả | Hợp lệ khi |
|---|---|---|
| `2400` (số > 0) | `{kind:'len', mm:2400}` | mọi lastOp trừ rect |
| `1200,800` | `{kind:'abs', pt}` — tái dùng `parseCoordInput` | TYPING (như cũ) · AMEND rect = W,H mới |
| `@-300,0` | `{kind:'rel', d}` — tái dùng | TYPING (như cũ) |
| `3x` hoặc `x3` (N nguyên ≥ 2) | `{kind:'mult', n:3}` | lastOp.kind ∈ {move, copy} |
| `/3` (N nguyên ≥ 2) | `{kind:'divide', n:3}` | lastOp.kind ∈ {move, copy} |
| `45` khi lastOp.kind='rotate' | `{kind:'angle', deg:45}` | rotate |
| rác (`abc`, `0x`, `/1`, `-5`) | `{kind:'invalid'}` → status báo, GIỮ dynBuf | — |

### 4d · Bảng áp TỪNG LỆNH (PHU đối chiếu từng dòng, không hỏi lại)
| Lệnh | TRONG chuỗi (đã có — không đổi) | AMEND sau-chốt (MỚI) | `3x` `/3` |
|---|---|---|---|
| **L** line | số = độ dài theo hướng · `X,Y` · `@dx,dy` | số = độ dài MỚI đoạn vừa vẽ: điểm cuối = `base + dir·mm`, giữ base+hướng | — |
| **PL** polyline | như L cho từng đỉnh | số áp cho **ĐOẠN CUỐI** — cả khi chuỗi còn mở (sửa đỉnh vừa đặt) lẫn sau khi kết thúc (Enter/double-click) | — |
| **REC** rect | `W,H` (= `@W,H` từ góc base — chạy sẵn) | chỉ nhận `W,H` → resize giữ góc base; số đơn = invalid (báo "REC cần W,H") | — |
| **C** circle | số = bán kính (hướng con trỏ, có fallback Đông) | số = R mới, giữ tâm | — |
| circle3p · arc · arccenter | như hiện có | **không áp** AMEND (3 điểm/cung định nghĩa hình — sửa số đơn vô nghĩa). Ghi status "dùng grip để sửa" | — |
| **WALL** | như PL | số = độ dài đoạn tường CUỐI, giữ hướng + base + độ dày | — |
| **ROOM** (polygon kín) | như PL từng đỉnh | không áp số đơn; toạ độ đỉnh = như TYPING | — |
| **MOVE / COPY** | số = khoảng cách theo hướng (đã ăn qua `effectivePoint(base)`) | số = khoảng cách dời MỚI (dời lại từ base theo dir) | ✅ xem 4e |
| **ROTATE** | góc | số = góc mới | pha 2 (rotate-copy) |
| fillet·chamfer·offset·lengthen | Enter đặt tham số (đã có `commitEnter:933`) | GIỮ NGUYÊN hành vi cũ — không lastOp | — |

### 4e · Ngữ nghĩa `3x` `/3` (chuẩn SketchUp, định nghĩa chính xác)
Sau move-copy một vật đi vector **v** (|v| = d):
- **`3x`** → tổng **3 bản sao** tại `base+v`, `base+2v`, `base+3v` (bản tại v đã có sẵn từ move-copy, tạo thêm 2). Gõ `Nx` mới → điều chỉnh lại tổng thành N (thêm/bớt bản — vẫn 1 nấc undo).
- **`/3`** → **chia đoạn d thành 3**: bản tại `base+v/3`, `base+2v/3`, `base+v` (bản cuối đã có, tạo thêm 2 ở trong).
- PHU viết thuần: `arrayFromMove(ids, base, v, spec: {kind:'mult'|'divide', n}) → Entity[]` + test (case n=2, n=5, đổi Nx sau Nx, đổi Nx→/N).

## 5 · CHIA VIỆC + NGHIỆM THU
**PHU (lib thuần + test — khớp phiếu PHU §3 mục 5):** `lib/cad/vcb.ts` (`parseVcb` + test ≥ 9 case bảng 4c) · `amendSegment(entity, base, dir, mm)` · `amendCircle` · `amendRect` · `arrayFromMove` — hàm thuần trả Entity mới, KHÔNG đụng store.
**Wiring CadCanvas** (lastOp lifecycle · lockedSnap · axisLock · drawGuides · màu drawSnap): `components/cad/CadCanvas.tsx` **chưa gán mảng trong `SO-KIEM-TONG` §2** — TỔNG phân khi phát phiếu (đề xuất: cùng người làm lib để khỏi handoff giữa chừng, hoặc CHINH nếu tính là "sổ lệnh UI").

**Nghiệm thu (đo được từng dòng):**
1. Vẽ line kéo đại → `2400⏎` → 2400mm (hành vi cũ, không hỏng). Gõ tiếp `3000⏎` → đoạn thành 3000mm. **Undo MỘT lần** → về 2400 (không phải về giữa chừng).
2. Move-copy 600mm → `3x⏎` → bản tại 600/1200/1800. `4x⏎` tiếp → 4 bản. Undo 1 nấc → về 1 bản.
3. Move-copy 2400 → `/4⏎` → bản tại 600/1200/1800/2400.
4. Hover endpoint: glyph VUÔNG màu `--snap-point`; midpoint: TAM GIÁC `--snap-derived` — hình cũ giữ, màu mới.
5. Đang bắt endpoint, giữ Shift, rê 500px → điểm hiệu dụng vẫn là endpoint đã ghim; nhả Shift → thả.
6. Trong lệnh line nhấn `↑` → khoá Y + đường gióng `--axis-y` hiện full viewport; `↑` lần nữa → bỏ. `→` khi đang khoá Y → đổi sang X.
7. Tool select: 4 phím mũi tên KHÔNG có tác dụng phụ nào.
8. `grep -E "#[0-9a-f]{3,6}" <diff>` = 0 hex mới ngoài fallback trong `var(...)`.
9. REC gõ số đơn ở AMEND → status báo "cần W,H", không đổi hình, không mất dynBuf.

---
*Nguồn hành vi gốc: SketchUp Measurements Box + inference engine (link trong `SPEC-LENH-VE-IF` cuối file). Đối chiếu code: 03/08/2026.*
