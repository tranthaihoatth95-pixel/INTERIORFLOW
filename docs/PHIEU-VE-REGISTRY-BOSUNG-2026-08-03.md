# PHIẾU · Bổ sung `lib/commands/registry.ts` — rà khớp 4 spec VẼ

**Ngày:** 03/08/2026 · **Vai lập:** COWORK-VẼ (đợt 3, `SO-KIEM-TONG.md` §3 dòng COWORK-VẼ) · **Gửi:** PHU
**Việc gốc:** rà khớp `SPEC-VE-INFERENCE.md` · `SPEC-VE-REVIT-MODE.md` · `SPEC-VE-LAYOUT-PAPER.md` ·
`SPEC-VE-SKETCH-TOUCH.md` × `lib/commands/registry.ts` — lệnh nào spec đòi mà registry thiếu.

> ⚠️ **TRÙNG VIỆC — đọc cả 2 phiếu trước khi code.** Sau khi viết xong phiếu này, đọc lại
> `docs/BAO-CAO-COWORK-VE.md` mới phát hiện phiên COWORK-VẼ trước (04/08, "ĐỢT 3") đã làm ĐÚNG việc
> này và ra `docs/PHIEU-REGISTRY-VE-2026-08-04.md` — do tôi chỉ Glob (kiểm tồn tại file) chứ chưa
> Read nội dung báo cáo cũ trước khi bắt tay (lỗi quy trình, ghi nhận theo §0 LUẬT TRUNG THỰC,
> không giấu). **KHÔNG xoá phiếu cũ** (luật append-only/versioning). Phần lớn kết luận ở 2 phiếu
> KHỚP NHAU (roomsep/roomupdate/VP/TB thiếu, surface 'radial' thiếu, va chạm D/WIN) — coi như đã
> kiểm chứng ĐỘC LẬP 2 lần, tăng độ tin. Đọc phiếu này thêm 3 điểm phiếu cũ KHÔNG có: (a) 3 lệnh
> radial mới — Nhân bản/Khoá-Mở/Snap± (§5.5-5.7 dưới); (b) cảnh báo `CadEditor.tsx` **CHƯA nối**
> `findByAlias()` — registry hôm nay chỉ ăn qua ⌘K, KHÔNG qua status-bar (§0 mục 3); (c) hướng xử
> D/WIN KHÁC nhau: phiếu cũ (`PHIEU-REGISTRY-VE-2026-08-04.md` §1) đề xuất phân nhánh NGAY TRONG
> `run()` của `cad.draw.door` (đổi sang 1 Tool `'door'` hosted mới ở revit); phiếu này (§2a dưới)
> đề xuất GIỮ NGUYÊN `when`/`run` của lệnh cũ, để hành vi hosted-vs-generic nằm hoàn toàn ở
> `CadCanvas.tsx` đọc `cadMode` lúc xử lý click — **PHU/TỔNG chọn 1 hướng, không làm cả hai.**
**§0b:** SEARCH đã chạy — đọc trực tiếp `registry.ts` (390 dòng), `command-aliases.ts` (145 dòng),
`store.ts` (PRO_ONLY_TOOLS, `shouldShowProTools`, `SnapSettings`), `model.ts` (`Base`/`Layer`),
`AppCommandPalette.tsx` (nơi DUY NHẤT build `WhenCtx` thật hôm nay), grep `titleBlockPro`/
`duplicate`/`findByAlias` toàn repo. Không đoán — mọi kết luận dưới đây trỏ thẳng dòng code.

---

## §0 · KIỂM CHỨNG NỀN TẢNG (tự đếm lại, không tin số cũ)

1. **Số alias**: `grep -c '{ cmd:' lib/cad/command-aliases.ts` ra 98, nhưng dòng đầu (18) là khai
   báo TYPE của mảng (`export const CAD_COMMANDS: { cmd: string; ... }[] = [`), không phải entry.
   **Số thật = 97** — khớp comment `registry.ts:171` ("55 CommandDef, gom đủ 97 alias") và
   `SO-KIEM-TONG` §3. Đếm tay từng dòng dữ liệu (19-100, 102-113, 115-117) cũng ra 97. **Số liệu
   cũ ĐÚNG, không lệch.**
2. **55 CommandDef hiện tại** — đối chiếu đủ, có test riêng `registry.test.ts` giữ đồng bộ (cảnh
   báo console nếu lệch số). Không cần đếm lại registry, chỉ cần biết baseline này khi đọc bảng
   dưới.
3. **🔴 RỦI RO CHUNG áp cho MỌI lệnh mới trong phiếu này** — đọc TODO cuối `registry.ts` (dòng
   379-389) + tự grep xác nhận: `findByAlias()` **CHƯA được `CadEditor.tsx` gọi ở đâu cả** (0 kết
   quả ngoài `registry.ts`/`registry.test.ts`). `registry.ts` hôm nay chỉ có **1 nơi tiêu thụ
   thật**: `AppCommandPalette.tsx` (⌘K, qua `cmdsFor()`). Status-bar gõ lệnh tay của CAD (nơi dân
   AutoCAD/SketchUp thực sự gõ 90% lệnh) vẫn chạy `map` object riêng trong `CadEditor.tsx` (dòng
   ~1579-1739) + autocomplete từ `command-aliases.ts` trực tiếp — KHÔNG đọc `registry.ts`.
   **⇒ Thêm CommandDef vào registry.ts KHÔNG làm lệnh đó gõ được ở status-bar.** Nó chỉ xuất hiện
   trong ⌘K palette. Muốn gõ tay chạy thật, PHU còn phải thêm alias vào `CAD_COMMANDS`
   (`command-aliases.ts` — vùng PHU, tự làm được) VÀ thêm case dispatch vào `run()` map của
   `CadEditor.tsx` — nhưng **`CadEditor.tsx` thuộc vùng CHINH** (`00-CHOT.md` dòng "[03/08 02:0x
   TỔNG chốt] Chủ mảng `components/cad/*`: UI shell (CadEditor·CadToolbar·CadTouchDock·
   CadStageScreen) = CHINH · engine (CadCanvas·CadSheets·tools) = PHU"). PHU KHÔNG tự sửa
   `CadEditor.tsx`. Ghi rõ ở mỗi lệnh mới bên dưới: "chạy được qua ⌘K ngay; gõ status-bar cần
   CHINH nối `run()` map — hoặc TỔNG ưu tiên việc TODO#1 (nối registry thay map cũ) trước".

---

## §1 · SPEC-VE-INFERENCE.md — rà từng lệnh/thao tác

| Lệnh/thao tác spec nhắc (bảng §4d) | Có trong registry? | alias | surface | when/group |
|---|---|---|---|---|
| L (line) | ✅ `cad.draw.line` | L, LINE | statusbar | draw@1, `gateFor('line')` |
| PL (polyline) | ✅ `cad.draw.polyline` | PL, PLINE | statusbar | draw@2 |
| REC (rect) | ✅ `cad.draw.rect` | REC, RECT | statusbar | draw@3 |
| C (circle) | ✅ `cad.draw.circle` | C, CIRCLE | statusbar | draw@4 |
| circle3p/arc/arccenter | ✅ 3 lệnh riêng | C3P, A, ARCC... | statusbar | draw@5-7 |
| WALL | ✅ `cad.draw.wall` | W, WALL | statusbar | draw@9 |
| ROOM | ✅ `cad.draw.room` | ROOM | statusbar | draw@10 |
| MOVE / COPY | ✅ | M/MOVE, CO/COPY | statusbar | edit@1-2 |
| ROTATE | ✅ | RO, ROTATE | statusbar | edit@3 |
| fillet/chamfer/offset/lengthen | ✅ đủ 4 | F, CHA, O, LEN | statusbar | edit@5,8,9,17 |

**Kết luận: KHÔNG thiếu lệnh/alias/surface/when nào cho spec này.** Toàn bộ cơ chế
SPEC-VE-INFERENCE (màu snap theo nhóm §2, khoá Shift/mũi tên §3, state machine AMEND + parser
`parseVcb` §4) là **tầng HÀNH VI nằm dưới bàn phím/con trỏ trong `CadCanvas.tsx`**, không sinh
thêm alias gõ-lệnh nào — registry chỉ định nghĩa "gõ chữ gì → activate tool gì", còn AMEND là
"sau khi có tool/entity rồi, gõ số tiếp theo nghĩa là gì" (đọc `ix.current.dynBuf`/`lastOp`,
hoàn toàn trong CadCanvas). **Không có việc bổ sung registry cho spec này.**

---

## §2 · SPEC-VE-REVIT-MODE.md — rà từng lệnh/thao tác

| Lệnh/thao tác spec nhắc | Có trong registry? | Ghi chú |
|---|---|---|
| WALL (revit = WallRun, hành vi khác nhưng CÙNG lệnh) | ✅ đã có, `when=CAD_BASIC` (không nằm trong `PRO_ONLY_TOOLS`) | ĐÚNG theo nguyên tắc "wall mọi mode" — không sửa `when`. Rẽ nhánh WallRun-vs-wallChain là việc CỦA `CadCanvas.tsx` đọc `cadMode`, không phải việc registry. |
| ROOM (sketch/pro = 2 góc cũ; revit = click-trace biên) | ✅ đã có, `when=CAD_BASIC` | Tương tự WALL — registry chỉ activate tool, hành vi khác theo mode nằm ở CadCanvas. Không sửa. |
| DOOR / WINDOW | ✅ đã có (`D/DOOR`, `WIN/WINDOW`), `when=CAD_BASIC` (mọi mode) | ⚠️ **XEM CẢNH BÁO §2a dưới — có khả năng mâu thuẫn với spec §7, KHÔNG tự sửa `when`.** |
| **`roomsep`** (§5c — đường chia phòng, chỉ hiện mode revit) | ❌ **THIẾU HOÀN TOÀN** | Không có trong `CAD_COMMANDS` lẫn `registry.ts`. Đề xuất ở §5 bảng tổng hợp. |
| **`roomupdate`** (§5d — chọn room → re-trace từ centroid) | ❌ **THIẾU HOÀN TOÀN** | Không có ở đâu cả. Đề xuất ở §5. |
| Cơ chế `REVIT_ONLY_TOOLS` (§7: "khuôn `PRO_ONLY_TOOLS` → thêm `REVIT_ONLY_TOOLS`") | ❌ **THIẾU** | `registry.ts` hiện chỉ có 2 `when`-guard: `CAD_BASIC` (`stage==cad`) và `CAD_PRO` (`stage==cad && proToolsAllowed==true`). **KHÔNG có guard nào đọc `ctx.mode`** dù kiểu `WhenCtx.mode?: string` đã khai (dòng 77) VÀ đã có dữ liệu thật (`AppCommandPalette.tsx:151` truyền `mode: cadMode`) — chỉ là chưa ai DÙNG. Cần thêm 1 hằng `CAD_REVIT` mới. Xem §5. |

### §2a · ⚠️ CẢNH BÁO — cần TỔNG/Hoà xác nhận trước khi đổi `when` của DOOR/WINDOW

`SPEC-VE-REVIT-MODE.md` §7 viết nguyên văn: *"door/window/roomsep/roomupdate chỉ
`cadMode=='revit'`"*. Đọc sát nghĩa đen, câu này bảo alias `D/DOOR`/`WIN/WINDOW` chỉ nên HIỆN ở
revit. Nhưng đối chiếu code thật: `cad.draw.door`/`cad.draw.window` hiện `when=CAD_BASIC` — đã
sống ở **MỌI mode** (sketch/pro/revit) từ trước spec này, dùng cơ chế `setPendingBlock('door')`
đặt block generic từ thư viện 46 khối (KHÔNG hosted). §1 "Thiếu thật" của chính spec REVIT-MODE
liệt kê "cửa/cửa sổ **hosted**" là thứ CHƯA CÓ — ngầm định placement generic hiện tại là tính
năng KHÁC, không phải thứ spec này thay thế.

**Nếu áp `REVIT_ONLY_TOOLS` y nguyên vào alias D/DOOR/WIN/WINDOW đang có** → RỚT tính năng đặt
cửa/cửa sổ generic ở Sketch/Pro (vi phạm `SO-KIEM-TONG` §1 sổ chống rớt + luật Hoà "không được
mất mát tính năng nào"). **Đề xuất của tôi (KHÔNG tự quyết, chỉ đề xuất):**
- **KHÔNG đổi `when` của `cad.draw.door`/`cad.draw.window` hiện có** — giữ `CAD_BASIC`, hành vi
  generic-block ở Sketch/Pro không đổi.
- Hành vi **hosted** (chỉ đặt được khi hover trúng WallRun, §4b) là logic RUN-TIME rẽ nhánh theo
  `cadMode` **bên trong `CadCanvas.tsx`** lúc xử lý click đặt block — không phải việc của
  registry's `when` (registry chỉ quyết định lệnh có HIỆN hay không, không quyết định NÓ LÀM GÌ
  khi chạy).
- `roomsep`/`roomupdate` là lệnh HOÀN TOÀN MỚI (không tồn tại trước) → áp `CAD_REVIT` cho 2 lệnh
  này AN TOÀN, không có gì để rớt.
- **Nếu Hoà/TỔNG đọc §7 theo nghĩa đen muốn D/DOOR/WIN/WINDOW thật sự CHỈ hiện ở revit** (ẩn khỏi
  Sketch/Pro), đây là quyết định SẢN PHẨM (ẩn 1 tính năng đang dùng được) — cần chốt riêng, không
  nằm trong phạm vi "gom dữ liệu registry" của phiếu này.

---

## §3 · SPEC-VE-LAYOUT-PAPER.md — rà từng lệnh/thao tác

| Lệnh/thao tác spec nhắc | Có trong registry? | Ghi chú |
|---|---|---|
| **`VP`** (§3 — đặt Viewport, chỉ trong layout tab) | ❌ **THIẾU HOÀN TOÀN** | Không có alias 'VP' ở `command-aliases.ts` lẫn `registry.ts`. Đề xuất §5. |
| **`TB`** (§3 — đặt khung tên trong layout) | ❌ **THIẾU alias gõ tay** | `titleBlockPro()` (hàm thật, `lib/cad/commands.ts:251`) đã tồn tại và CHẠY ĐƯỢC — nhưng chỉ qua **1 nút UI riêng trong `CadEditor.tsx:967`** (`addEntities(titleBlockPro(tbAt, info, ...))`), KHÔNG qua sổ lệnh gõ tay. Không có alias 'TB' nào trong `CAD_COMMANDS`. |
| `when`: "VP/TB/tab Tờ in chỉ hiện `cadMode ∈ {pro, revit}`" (§5 của spec) | 🟡 **Hạ tầng đủ, cách nối chưa có** | Đã xác nhận `shouldShowProTools()` **coi `'revit'` như `'pro'`** (`store.ts:144`, comment dòng 112: *"mọi công cụ Pro vẫn dùng được — `shouldShowProTools` coi 'revit' như 'pro'"*). Nghĩa là `CAD_PRO` (`proToolsAllowed==true`) trong registry **ĐÃ TỰ ĐỘNG = {pro, revit}** — đúng khớp yêu cầu spec, KHÔNG cần cơ chế mode mới cho phần này. Chỉ cần thêm `'viewport'` (và tool cho TB nếu có) vào `PRO_ONLY_TOOLS` rồi dùng `gateFor()` bình thường. |
| Điều kiện PHỤ "chỉ trong layout tab" (không phải chỉ theo mode) | ❌ **THIẾU field trong `WhenCtx`** | `WhenCtx` hiện có `stage`/`mode`/`proToolsAllowed` — KHÔNG có gì biểu thị "tab đang mở là model hay layout" (`SheetTab.kind` theo `SPEC-VE-LAYOUT-PAPER` §2a). Cần thêm field mới. Xem §5. |

---

## §4 · SPEC-VE-SKETCH-TOUCH.md — rà từng lệnh/thao tác

Spec dùng `registry.ts` qua kênh MỚI: **radial menu 8 múi gọi lệnh qua `cmdsFor(ctx)` lọc
`surface: 'radial'`** (§4b: *"Múi gọi lệnh qua sổ lệnh (`registry.ts` PHU đang làm) — múi =
`cmdsFor(ctx)` lọc surface 'radial'"*).

### §4a · Type `Surface` THIẾU giá trị `'radial'`

`registry.ts:64` — `export type Surface = 'statusbar' | 'shortcut' | 'dock' | 'palette' |
'contextmenu' | 'llm';` — **không có `'radial'`**. Đây là điều kiện tiên quyết, phải sửa TRƯỚC
khi gán surface cho bất kỳ lệnh nào bên dưới.

### §4b · Rà 24 mục trong bảng radial §4b (8 múi × 3 ngữ cảnh) — đối chiếu registry

| Mục trong radial | Registry đã có? | Xử lý đề xuất |
|---|---|---|
| Đường L / Chữ nhật REC / Phòng ROOM / Tròn C / Polyline PL (nền trống) | ✅ đã có CommandDef | Chỉ thêm `'radial'` vào mảng `surfaces` hiện có (không tạo mới) |
| Move / Xoay (đang chọn entity) | ✅ `cad.edit.move`, `cad.edit.rotate` | Thêm `'radial'` vào `surfaces` |
| Xoá (đang chọn) | ✅ `cad.sel.delete` | Thêm `'radial'` |
| Hoàn tác (nền trống) | ✅ `cad.sel.undo` | Thêm `'radial'` |
| **Nhân bản** (đang chọn) | ❌ **THIẾU CẢ TẦNG STORE** | Grep `duplicate\|Duplicate` toàn `lib/cad/` = **0 kết quả**. Không tồn tại action nào để nhân-bản-tại-chỗ 1 entity CAD (khác `COPY` vốn cần 2 điểm nguồn/đích). ⛔ Cần PHU thêm store action MỚI trước (vd `duplicateSelected(): void` — nhân bản lệch 1 khoảng nhỏ cố định hoặc = 0,0, tự quyết ngắn theo `LUAT-VAN-HANH-LOOP`, không phải quyết định UI lớn) RỒI mới thêm CommandDef. Xem §5. |
| **Khoá/Mở** (đang chọn) | ❌ **THIẾU, và MƠ HỒ ở tầng model** | Đọc `model.ts`: field `locked: boolean` chỉ có trên **`Layer`** (dòng 46), **KHÔNG có trên `Base`** (entity, dòng 151+) — CAD hiện KHÔNG có khái niệm "khoá 1 entity riêng lẻ". "Khoá/Mở" trong radial khi đang CHỌN 1 ENTITY có thể nghĩa là (a) khoá LAYER của entity đó, hoặc (b) cần thêm field `locked` mới vào `Base` (đổi model — quyết định lớn hơn phạm vi registry). ⛔ **KHÔNG tự thêm field vào `Base`** — cần TỔNG/Hoà chọn hướng (a) hay (b) trước. Xem §5. |
| **Snap ±** (đang trong chuỗi vẽ) | ❌ thiếu CommandDef, **NHƯNG store action ĐÃ CÓ SẴN** | `store.ts:306` có `setSnap: (patch: Partial<SnapSettings>) => void` (tổng quát, dòng 559 impl) — gọi được `store().setSnap({ enabled: !store().snap.enabled })` ngay, KHÔNG cần thêm gì ở tầng store. ✅ **PHU LÀM ĐƯỢC NGAY, không cần hỏi ai.** Xem §5. |
| Chốt ⏎ / Huỷ ⎋ / Lùi 1 điểm / Số liệu (F12) / Khoá trục X·Y | — | **KHÔNG đề xuất đưa vào registry.** Đây là thao tác gắn liền vòng đời state cục bộ của `CadCanvas.tsx` (`ix.current.dynBuf`/`axisLock`, chuỗi vẽ đang mở — xem SPEC-VE-INFERENCE §3b/§4a) — không phải store action toàn cục gọi được từ ngoài. Radial tại CadCanvas gọi thẳng nội bộ hoặc phát `cad:synth-key` (đúng cách dock hiện nay đang làm — có tiền lệ). |
| Đổi công cụ… / Layer… / Thuộc tính / Dòng lệnh / Kéo Pan | — | **KHÔNG đề xuất đưa vào registry.** Đây là hành động MỞ PANEL/ĐỔI UI-MODE (không phải "lệnh CAD" theo nghĩa registry định nghĩa hôm nay — activate tool hoặc gọi 1 store action đơn giản), thuộc quyết định UI của phiên wiring CadCanvas/dock, không phải dữ liệu sổ lệnh. |

### §4c · Tổng kết §4

3 lệnh thực sự "thiếu ở registry" theo đúng nghĩa nhiệm vụ giao (alias/surface/when/group):
**Nhân bản** (⛔ chờ xác nhận cơ chế), **Khoá/Mở** (⛔ chờ xác nhận model), **Snap ±** (✅ làm ngay
được). Còn lại là gán thêm `surface: 'radial'` cho 9 CommandDef đã tồn tại.

---

## §5 · BẢNG TỔNG HỢP — lệnh MỚI cần thêm (đủ chi tiết để code không cần hỏi lại)

### 5.0 · Sửa nền tảng TRƯỚC (bắt buộc, không phụ thuộc quyết định gì)

```ts
// registry.ts:64 — thêm 'radial'
export type Surface = 'statusbar' | 'shortcut' | 'dock' | 'palette' | 'contextmenu' | 'llm' | 'radial';

// registry.ts — thêm sau CAD_PRO (dòng 144), khai khi có ít nhất 1 lệnh dùng
const CAD_REVIT = when('stage==cad && mode==revit');
// LƯU Ý: khác gateFor()/CAD_PRO — CAD_REVIT KHÔNG bao gồm 'pro', chỉ đúng revit. Không dùng
// gateFor() cho roomsep/roomupdate vì gateFor chỉ phân basic-vs-pro (2 mức), không phân biệt
// pro-vs-revit (3 mức thật). Viết when() riêng, KHÔNG sửa gateFor() (sẽ đổi hành vi mọi lệnh
// PRO_ONLY_TOOLS khác, ngoài phạm vi việc này).
```

`ctx.mode` đã có dữ liệu thật qua `AppCommandPalette.tsx:151` (`mode: cadMode`) — `CAD_REVIT` ở
trên dùng được ngay, không cần sửa nơi build ctx.

### 5.1 · `roomsep` — đường chia phòng (SPEC-VE-REVIT-MODE §5c)

```ts
{ id: 'cad.draw.roomsep', label: ['Đường chia phòng', 'Room separator'], aliases: ['ROOMSEP'],
  when: CAD_REVIT, group: 'draw@20', surfaces: ['statusbar'], run: activate('roomsep') }
```
- **Điều kiện tiên quyết**: `Tool` union (`store.ts`, kiểu `| 'campath'` ở cuối, dòng ~106) CHƯA
  có `'roomsep'` — PHU phải thêm giá trị này vào union `Tool` trước, nếu không `activate('roomsep')`
  không biên dịch được (type error).
- Vẽ như line trên layer mới `l-room-sep` (nét gạch-chấm mảnh, mặc định không in — theo đúng
  §5c) — hành vi thật nằm ở `CadCanvas.tsx`/`commands.ts`, ngoài phạm vi registry.
- Cân nhắc thêm `'roomsep'` vào `PRO_ONLY_TOOLS` (dòng 171-177 store.ts) — dù registry dùng
  `CAD_REVIT` riêng (không qua `gateFor`), `PRO_ONLY_TOOLS` là cơ chế ĐỘC LẬP dùng trong
  `setCadMode()` để tự trả tool về `'select'` khi rời mode không phù hợp (tránh canvas "kẹt" tool
  ẩn — dòng 168-170 store.ts). Nên thêm để nhất quán, dù semantics hơi khác (PRO_ONLY_TOOLS không
  phân biệt pro/revit, nhưng revit ⊂ "không phải sketch" nên vẫn đúng).

### 5.2 · `roomupdate` — re-trace room đã chọn (SPEC-VE-REVIT-MODE §5d)

```ts
{ id: 'cad.edit.roomupdate', label: ['Vẽ lại biên phòng', 'Retrace room boundary'], aliases: ['ROOMUPDATE'],
  when: CAD_REVIT, group: 'edit@19', surfaces: ['statusbar'],
  run: () => store().retraceSelectedRoom() }  // tên hàm ĐỀ XUẤT, PHU đặt lại nếu có quy ước khác
```
- **KHÔNG phải `setTool`** — đây là action tức thời trên entity ĐANG CHỌN (giống
  `cad.sel.delete` gọi thẳng `store().deleteSelected()`), không mở chế độ tương tác mới.
- **Điều kiện tiên quyết**: store action `retraceSelectedRoom()` (hoặc tên tương đương) CHƯA tồn
  tại — PHU cần viết mới, gọi `traceRoomBoundary()` (spec §5d đã định nghĩa thuật toán, ngân sách
  50ms) trên `RoomEntity` đang chọn, tính lại `boundary`/`areaM2` từ centroid hiện tại.
- `registry.when` chỉ gate theo mode (`CAD_REVIT`), KHÔNG kiểm được "đã chọn đúng 1 RoomEntity"
  (`WhenCtx` không mang thông tin selection) — validate đó nằm TRONG `retraceSelectedRoom()`
  (early-return + status báo nếu selection rỗng/không phải room, giống cách `deleteSelected()`
  không cần gì đặc biệt khi selection rỗng — xem `registry.test.ts:220`).

### 5.3 · `VP` — đặt Viewport (SPEC-VE-LAYOUT-PAPER §3)

```ts
// WhenCtx cần thêm field mới (registry.ts:75-79):
export interface WhenCtx {
  stage: string;
  mode?: string;
  proToolsAllowed?: boolean;
  sheetKind?: 'model' | 'layout';   // MỚI — nơi gọi tính từ SheetTab.kind đang active
}

const CAD_LAYOUT_PRO = when('stage==cad && proToolsAllowed==true && sheetKind==layout');

{ id: 'cad.layout.viewport', label: ['Viewport', 'Viewport'], aliases: ['VP'],
  when: CAD_LAYOUT_PRO, group: 'layout@1', surfaces: ['statusbar'], run: activate('viewport') }
```
- **`proToolsAllowed==true` đã tự động = {pro, revit}** (xác nhận §3 bảng trên, `shouldShowProTools`
  coi revit như pro) — khớp đúng yêu cầu spec "chỉ hiện `cadMode ∈ {pro, revit}`", không cần thêm
  điều kiện mode riêng.
- **`sheetKind` là field MỚI, KHÔNG có nơi nào build hôm nay** — `AppCommandPalette.tsx:149-153`
  (nơi DUY NHẤT dựng `WhenCtx` thật) chưa biết tab đang active là model hay layout. Đây thuộc
  `components/studio/*` = **vùng CHINH** — PHU định nghĩa field + `when` trong `registry.ts` (vùng
  mình), nhưng KHÔNG tự sửa `AppCommandPalette.tsx` để truyền giá trị thật; ghi rõ trong bài giao
  việc/PR để CHINH nối (không thì `sheetKind` luôn `undefined`, lệnh VP sẽ KHÔNG BAO GIỜ hiện qua
  ⌘K dù registry đúng — `undefined !== 'layout'` trong parser `evalClauses`).
- `Tool` union cần thêm `'viewport'`; `PRO_ONLY_TOOLS` nên thêm `'viewport'` (đồng bộ lý do như
  §5.1).
- **`group: 'layout@1'`** — bucket `'layout'` CHƯA có trong `BUCKET_LABEL`
  (`AppCommandPalette.tsx:48-54`, chỉ có draw/dim/edit/view/sel). Nếu không thêm, ⌘K sẽ hiện tên
  bucket thô `"layout"` không dịch thay vì nhãn đẹp (không lỗi, chỉ xấu). File đó thuộc vùng
  CHINH — ghi chú kèm bàn giao, hoặc tạm dùng `group: 'view@3'` (bucket có sẵn, ít đúng ngữ nghĩa
  hơn) nếu muốn tự chạy được ngay không chờ CHINH — PHU tự chọn theo mức ưu tiên tốc độ vs đúng
  ngữ nghĩa.

### 5.4 · `TB` — đặt khung tên trong layout (SPEC-VE-LAYOUT-PAPER §3)

```ts
{ id: 'cad.layout.titleblock', label: ['Khung tên', 'Title block'], aliases: ['TB'],
  when: CAD_LAYOUT_PRO, group: 'layout@2', surfaces: ['statusbar'],
  run: () => window.dispatchEvent(new CustomEvent('cad:insert-titleblock')) }
```
- **KHÔNG đơn giản `activate()`** — `titleBlockPro()` cần 1 bộ `info` (project/drawing/scale…)
  hiện đang thu thập qua UI form riêng trong `CadEditor.tsx` (dòng 967, nút bấm gọi trực tiếp).
  Đề xuất: `run()` chỉ phát 1 `CustomEvent` (đúng tiền lệ đã có — `cad.view.zoomextents` cũng
  dùng `window.dispatchEvent(new CustomEvent('cad:zoom-extents'))`, dòng 331) để `CadEditor.tsx`
  lắng nghe và MỞ LẠI form/modal đặt khung tên sẵn có — tái dùng, không viết lại luồng nhập info.
  Tên event `cad:insert-titleblock` là ĐỀ XUẤT, CHINH có thể đổi tên khi nối (vùng CHINH sở hữu
  `CadEditor.tsx`).
- ⚠️ **Câu hỏi mở, KHÔNG tự quyết**: `titleBlockPro()` đã chạy được ở model-space Pro sheets từ
  trước (không giới hạn layout — §1 bảng "Khung tên ✅ Đúng"). Spec LAYOUT-PAPER chỉ mô tả use-case
  layout, nhưng không rõ có PHẢI giới hạn alias `TB` chỉ-layout hay nó cũng nên gõ được ở model
  sheet Pro (tái dùng đúng cơ chế hiện có, chỉ thêm lối gõ tay cho hành động đã tồn tại). Đề xuất
  trong bảng trên dùng `CAD_LAYOUT_PRO` (chỉ layout, bám sát câu chữ spec) — nếu Hoà/TỔNG muốn
  rộng hơn, đổi `when` thành `CAD_PRO` (bỏ điều kiện `sheetKind`) là 1 dòng.

### 5.5 · `Nhân bản` (Duplicate) — SPEC-VE-SKETCH-TOUCH §4b, ⛔ chờ xác nhận

Chưa đề xuất CommandDef cụ thể vì **chưa có store action để gọi**. Cần chốt trước:
1. Nhân bản lệch bao nhiêu / theo hướng nào (offset cố định vd (200,-200)mm, hay chồng đúng vị
   trí cũ rồi để user tự kéo — kiểu Figma ⌘D)?
2. Áp cho selection nhiều entity hay chỉ 1?

Khi có câu trả lời, hình dạng CommandDef sẽ là:
```ts
{ id: 'cad.edit.duplicate', label: ['Nhân bản', 'Duplicate'], aliases: ['DUP'],
  when: CAD_BASIC, group: 'edit@19', surfaces: ['statusbar', 'radial'],
  run: () => store().duplicateSelected() }  // store action MỚI, chưa tồn tại
```

### 5.6 · `Khoá/Mở` (entity lock) — SPEC-VE-SKETCH-TOUCH §4b, ⛔ chờ xác nhận

Chưa đề xuất CommandDef vì mơ hồ tầng model (xem §4b bảng). Cần Hoà/TỔNG chọn:
- **(a)** "Khoá/Mở" trong radial = mở nhanh khoá LAYER của entity đang chọn (tái dùng
  `Layer.locked` đã có, không đổi model) — rẻ, nhưng ngữ nghĩa hơi lệch (khoá cả layer thay vì
  riêng 1 entity, ảnh hưởng entity khác cùng layer).
- **(b)** Thêm field `locked?: boolean` mới vào `Base` (entity) — đúng ngữ nghĩa "khoá riêng 1
  vật" hơn, nhưng là thay đổi MODEL (đụng `.idf` schema, dù additive/optional nên không breaking)
  — cần mọi nơi đọc/ghi entity (select, move, delete...) tôn trọng cờ này, phạm vi rộng hơn 1
  CommandDef.

### 5.7 · `Snap ±` — bật/tắt toàn bộ OSNAP (SPEC-VE-SKETCH-TOUCH §4b) — ✅ làm ngay được

```ts
{ id: 'cad.view.togglesnap', label: ['Bật/tắt bắt điểm', 'Toggle snap'], aliases: ['SNAP'],
  when: CAD_BASIC, group: 'view@3', surfaces: ['statusbar', 'radial'],
  run: () => store().setSnap({ enabled: !store().snap.enabled }) }
```
`setSnap()` đã tồn tại (`store.ts:306,559`, tổng quát `Partial<SnapSettings>`) — KHÔNG cần thêm
gì ở tầng store, chỉ 1 CommandDef mới. **Không có phần ⛔ nào — PHU code được ngay.**

### 5.8 · Gán `'radial'` cho 9 lệnh đã tồn tại (SPEC-VE-SKETCH-TOUCH §4b)

Chỉ sửa mảng `surfaces` (thêm `'radial'`), KHÔNG đổi gì khác — 9 dòng: `cad.draw.line`,
`cad.draw.rect`, `cad.draw.room`, `cad.draw.circle`, `cad.draw.polyline`, `cad.edit.move`,
`cad.edit.rotate`, `cad.sel.delete`, `cad.sel.undo`.

---

## §6 · VIỆC PHU CẦN LÀM NGOÀI `registry.ts` để lệnh mới THẬT SỰ chạy

Nhắc lại §0 mục 3 — chỉ sửa `registry.ts` KHÔNG đủ. Với mỗi lệnh mới ở §5 muốn gõ được ở
status-bar (không chỉ ⌘K):
1. Thêm entry vào `CAD_COMMANDS` (`lib/cad/command-aliases.ts`) — **vùng PHU, tự làm được.**
2. Thêm giá trị mới vào union `Tool` (`store.ts`) nếu lệnh dùng `setTool` (roomsep, viewport) —
   **vùng PHU, tự làm được.**
3. Thêm store action mới nếu cần (`retraceSelectedRoom`, `duplicateSelected`) — **vùng PHU.**
4. Thêm case dispatch vào `run()` map của `CadEditor.tsx` (dòng ~1579-1739) — **vùng CHINH, PHU
   KHÔNG tự sửa.** Ghi vào báo cáo/bàn giao để CHINH nối, HOẶC đề xuất TỔNG ưu tiên việc TODO#1
   sẵn có cuối `registry.ts` (nối `CadEditor.tsx` gọi thẳng `findByAlias()` thay map riêng — giải
   quyết vấn đề này cho MỌI lệnh tương lai luôn, không chỉ 5 lệnh trong phiếu này).
5. `AppCommandPalette.tsx` truyền `sheetKind` vào `WhenCtx` (cho VP/TB) — **vùng CHINH.**
6. `BUCKET_LABEL` thêm nhãn bucket `'layout'` nếu dùng (cho VP/TB) — **vùng CHINH.**

---

## §7 · CHECKLIST NGHIỆM THU CHO PHU (khi code xong phần thuộc mình)

1. `npx tsc --noEmit -p .` sạch sau khi thêm `'radial'` vào `Surface`, field `sheetKind` vào
   `WhenCtx`, giá trị mới vào `Tool` union.
2. `registry.test.ts` vẫn chạy — thêm case mới cho từng CommandDef thêm (theo đúng khuôn test cũ,
   `findByAlias('ROOMSEP')?.id === 'cad.draw.roomsep'`...).
3. Cảnh báo tự-kiểm cuối `registry.ts` (dòng 367-377, so `CAD_COMMANDS.length` với
   `allAliases().length`) — sau khi thêm alias mới vào CẢ 2 nguồn, số phải khớp lại (không cảnh
   báo lệch).
4. ⌘K palette (`AppCommandPalette.tsx`) hiện lệnh mới đúng ngữ cảnh (revit thấy ROOMSEP/ROOMUPDATE,
   layout tab thấy VP/TB) — verify browser thật, sandbox không có trình duyệt (khớp thói quen báo
   cáo PHU đã dùng ở `BAO-CAO-PHU.md`).
5. Nếu làm §5.5/§5.6 (Nhân bản/Khoá-Mở) — PHẢI có xác nhận của Hoà/TỔÑG về cơ chế TRƯỚC, không tự
   suy diễn (đúng `LUAT-VAN-HANH-LOOP` + `§0 LUẬT TRUNG THỰC`).

---
*COWORK-VẼ lập 03/08/2026 — đối chiếu code trực tiếp, không dùng số cũ trong `SO-KIEM-TONG`/spec
mà không tự kiểm lại. Việc ② (khuyết ①-⑩ CAD) của đợt này KHÔNG làm được — xem `BAO-CAO-COWORK-VE.md`
mục CHỐT PHIÊN, lý do: `BAO-CAO-PHU.md` (1108 dòng, đọc hết) không có nội dung gap-check 10 khuyết,
chỉ có công việc present-editor (P1-P6c) — PHU CHƯA chạy gap-check SPEC-LENH-VE-IF §4.*
