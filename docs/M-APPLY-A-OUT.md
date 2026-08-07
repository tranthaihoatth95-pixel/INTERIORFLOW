# M-APPLY-A-OUT — LÀN A · APPLY DESIGN: NODE + THƯ VIỆN (3 màn)

> Phiên 06/08. Nguồn thiết kế: `docs/mocks/Bảng nút.dc.html` · `docs/mocks/Nút tổng.dc.html` ·
> `docs/mocks/Thư viện.dc.html`. **CHƯA COMMIT** (luật V6 — Hoà commit).
> Không đụng `lib/cad/**`, `components/cad/**`, `docs/GAP-IF.md` (§0u).
> Cách làm: 1 agent LÀM + 1 agent PHẢN BIỆN + phiên chính tự verify browser thật.

---

## 0. Kết quả một dòng

3 màn đã áp; **4 lỗi CHẶN bắt được sau khi agent làm xong** (3 do agent phản biện, 1 do verify
browser) đã sửa và verify lại bằng app thật. `tsc` sạch phần làn A · 90 test liên quan pass ·
2 theme đều chụp. **6 mục cố ý KHÔNG làm** ghi ở §5 — trong đó **2 mục cần Hoà quyết**.

---

## 1. MÀN 1 · Bảng nút (`InteriorNode.tsx` · `FlowCanvas.tsx` · `StatusBar.tsx`)

| Ý | Mock có | Đã làm | Bằng chứng |
|---|---|---|---|
| ① Màu cổng theo kiểu | `--p-img #6a57f5 · --p-mask #d9a34a · --p-mat #46b876 · --p-num #9e9ea8` | 4 token vào `globals.css` dạng **bí danh** của token thật (`--accent`/`--warning`/`--success`/`--t3`) ⇒ theme Tối resolve ĐÚNG từng byte hex mock, theme Kem tự lấy bản đủ tương phản. `DATA_TYPE_COLORS` trả `var(--p-*)` thay hex | đo trên app: Tối `#6a57f5/#d9a34a/#46b876/#9e9ea8` khớp mock; Kem `#6a57f5/#9a6304/#107043/#726c62`, tương phản trên `--panel` = **4.61 · 4.76 · 5.79 · 4.90** (đều ≥4.5) |
| ② Dây đứt nét chạy | `@keyframes bn-dash{to{stroke-dashoffset:-24}}` | chép NGUYÊN VĂN vào `globals.css`; `.bn-edge-running` gắn cho dây **chảy vào** node đang chạy/xếp hàng; dây ĐANG KÉO dùng cùng keyframe + màu cổng nguồn | có nhánh `prefers-reduced-motion` cho **cả hai** đường (class và inline) |
| ③ Đếm "N nút · M nối sai" | sidebar đáy mock: `7 nút · 1 nối sai`, dây sai vẽ `stroke:var(--danger); stroke-dasharray:6 5` (dòng 141) | thanh trạng thái hiện `N nút · M nối sai` (đỏ khi M>0) + **dây sai vẽ đỏ đứt đoạn trên bảng** | app thật: `1 nút · 1 nối sai`; đo DOM dây sai `stroke rgb(229,103,79)` = `--danger #e5674f`, `dash 6px 5px`, `z-index 5` — khớp mock |

### 🔴 Hai lỗi CHẶN đã sửa ở màn này

1. **Con số "N nút" nói dối khi gom nút tổng.** `countBoardNodes` chỉ loại giấy nhớ. Thu gọn nút
   tổng thì store gắn `hidden:true` cho node con (mặt nút tổng lại vẽ từ `groups[]`, không có node
   nào) ⇒ màn hình 1 mặt nút mà bar ghi "4 nút". **Đã sửa hai vế**: trừ node `hidden`, cộng mỗi nút
   tổng đang thu gọn 1 đơn vị. Verify app thật: gom 4 nút → bar đổi **"4 nút" → "1 nút"**.
   (+4 test khoá cả 4 ca: ẩn hết · thu gọn · đang mở · cụm thường.)
2. **"M nối sai" là ngõ cụt** — đếm được nhưng không chỉ ra dây nào. Nay tô đỏ đứt đoạn đúng mock,
   dùng CHUNG `findMistypedEdges` với thanh trạng thái (một luật so kiểu, không viết luật thứ hai).

---

## 2. MÀN 2 · Nút tổng (`MacroNodeFace` · `MacroSelectionToolbar` · `MacroCreateDialog` · `GroupOverlay` · `InteriorNode`)

Khung 4 màn 01–04 đã port từ mock cũ `mock-if-nut-tong.html` từ trước, đợt này chỉ vá phần LỆCH:

- **01** viền chọn: `1.5px solid var(--accent)` + quầng `0 0 0 4px var(--accent-soft)` (trước chỉ
  đổi màu viền sang `--accent-ring`, nền Kem gần như không thấy) · thanh nút nổi `gap:1px` đúng mock.
- **02** hộp thoại: nền phủ `var(--scrim)` (trước `bg-black/45` — đen cứng, không theo theme), bo
  `--radius-xl` 28px, bỏ `#fff` → `--on-accent`.
- **03/04** mặt nút tổng + khung mở: `--on-accent`; chấm tím "tham số đã đưa ra ngoài" trên tiêu đề
  node con + chip chú thích góc phải-dưới khung mở (khớp mock từng số: right 22 · bottom 18 · h26).
- **04 "khung mở là mặt đặc, không phải kính"** — code ĐÃ đúng sẵn (`--panel`, không `mat-*`),
  không đụng. Đúng luật K4 chống kính-lồng-kính.

Verify app thật (chụp trong phiên): chọn 4 nút → viền + quầng + thanh nút nổi · mở hộp thoại →
"THAM SỐ ĐƯA RA NGOÀI · 4 trên 6 đang hiện" đủ 4 cột + công tắc · tạo xong → mặt nút tổng "4 nút bên
trong · 4 credit" chỉ hiện tham số đã chọn · mở ra xem bên trong → khung đặc + chấm tím + chip chú thích.

---

## 3. MÀN 3 · Thư viện (`LibrarySheet` · `library-sheet-css` · `lib/library/shelves.ts`)

⚠️ **Mock con THIẾU — đã xác minh**: `Thư viện.dc.html` gọi 4 file qua `<dc-import name="KeVatLieu |
KeDoDac | KeDangGom | CotThongSo">` nhưng **cả 4 KHÔNG tồn tại trong `docs/mocks/`**. Nghĩa là
**lưới thẻ ③ và cột thông số ④ không được mock vẽ dòng nào**. Chỉ áp phần khung mock thật sự có;
không bịa.

| Mock có | Đã làm |
|---|---|
| mỗi kệ một **chấm màu 10px**, kệ đang mở chấm TRÒN accent | `ShelfDef.dot` (luôn là tên token, không hex) gán đủ **13/13 kệ** + kệ "Văn phòng · Cụm bàn" |
| khối **NHÓM VẬT LIỆU** (Gỗ tự nhiên · Sơn và vữa · Đá tự nhiên · Vải và da · Kim loại) | nhãn chép nguyên văn, nối vào `ThumbKind` có sẵn ⇒ **bộ lọc THẬT** (app thật: 12 món → bấm "Kim loại" → 2 món, không nhóm nào ra rỗng) |
| nút accent **"Thêm vật liệu mới"** ghim đáy cột kệ | nối vào chế độ "Nạp hàng loạt" CÓ SẴN (không dựng đường nạp thứ hai, không nút bấm-không-ra-gì §9) |
| **"N mục trong kệ …"** ở thanh trạng thái | đưa vào chân sheet, đếm **số thật sau lọc** (app thật: "2 mục trong kệ Vật liệu ATLAS") |
| ô tìm 250px | 260 → 250 |

### 🔴 Hai lỗi CHẶN đã sửa ở màn này (bắt lúc verify browser + phản biện)

3. **Nút "Thêm vật liệu mới" nằm NGOÀI màn hình.** `margin-top:auto` một mình không đủ: cột kệ có
   `overflow-y:auto`, 13 kệ + 5 nhóm dài hơn cột nên "đáy" là đáy VÙNG CUỘN — đo được **đáy nút
   910px trong cửa sổ cao 900px**, phải cuộn hết mới thấy. Sửa bằng `position:sticky; bottom:0` +
   nền đặc. Đo lại: nút **847–879** trong cột **411–885** ⇒ luôn nhìn thấy.
4. **Chân sheet bị đẩy vào giữa**: `.cnt` và `.pub` cùng `margin-left:auto` ⇒ khoảng trống chia đôi.
   Sửa: chỉ dòng gợi ý đầu hàng giãn (`margin-right:auto`). Đo lại: hint → "N mục…" → "Đưa lên kệ"
   sát mép phải (1065 / 1079). Tiện thể `.pub{color:#fff}` → `var(--on-accent)`.

---

## 4. Token · keyframe đã thêm vào `app/globals.css`

| Tên | Tối | Sáng (Kem) | Lý do |
|---|---|---|---|
| `--p-img` `--p-mask` `--p-mat` `--p-num` | `#6a57f5 · #d9a34a · #46b876 · #9e9ea8` (đúng mock) | `#6a57f5 · #9a6304 · #107043 · #726c62` | khai **bí danh** `--accent`/`--warning`/`--success`/`--t3` thay hex cứng: mock chỉ khai 1 lần ngoài khối theme nên nền Kem sẽ giữ hex nền Mực, sai tương phản |
| `--scrim` | `rgba(6,6,8,.56)` | `rgba(60,55,48,.28)` | bí danh của `--mat-overlay` đã có (trùng gần từng byte với mock) — không đẻ token thứ hai gần-giống |
| `--k-doc` | `#c79a63` (đúng mock, 7.21:1) | `#8a6a44` (4.69:1) | mock khai 1 lần ⇒ nền Kem chỉ ~2.1:1, chấm mờ tịt. Giữ hue, hạ độ sáng |
| `@keyframes bn-dash` | chép NGUYÊN VĂN từ mock | — | dùng thật cho dây đang chạy + dây đang kéo |
| `@keyframes nt-halo` | chép NGUYÊN VĂN từ mock | — | ⚠️ **trong chính mock nó cũng là CSS chết** (grep = đúng 1 dòng @keyframes, không gắn vào đâu) |
| `.bn-edge-bad` | — | — | dây nối sai: nổi lên trên, không mờ (màu/nét đặt inline) |
| `.nt-macro-halo` + `nt-macro-halo-run` | — | — | 🟡 **NGOÀI MOCK** — xem §5.6 |

**Token trong mock CỐ Ý không thêm**: `--dur-slow .32s` (app đã có `--dur-base` bằng đúng giá trị) ·
`--m-oak/--m-paint/--m-linen` (chỉ nằm trong file con đang thiếu) · `--stage-ink` (preview node, không
port đợt này). `--tap-lg` và `--on-accent` **đã có sẵn**.

### ⚠️ Lệch thang thời lượng — cần Hoà biết, KHÔNG tự sửa

| Token | Mock (cả 2 file) | App |
|---|---|---|
| `--dur-fast` | `.12s` | `0.18s` |
| `--dur-base` | `.18s` | `0.32s` |

Thang của app **dịch nguyên một nấc**: `mock.dur-base(.18)` = `app.dur-fast(.18)`,
`mock.dur-slow(.32)` = `app.dur-base(.32)`. Mọi chuyển động port từ mock đang chạy **chậm hơn một
bậc** trong app thật. Đây là quyết định mức toàn app, không phải việc của 3 màn này.

---

## 5. Chưa làm / cố ý không làm — nói thẳng

1. **Màn 05 "Nút tổng trong khung sáu ổ"** — canvas node của app không có bố cục cột 214/236 + dock;
   `MacroShelf` là thẻ nổi góc phải. Dựng lại = đập bố cục canvas đang chạy, vượt xa "port thiết kế".
2. **Khung nét đứt bao vùng chọn (Nút tổng màn 01)** — là selection-box của React Flow, phải sửa
   `FlowCanvas` ở vùng đang có sửa dở; để lại tránh đá nhau.
3. **🔴 CẦN HOÀ QUYẾT — 4 tab phạm vi "Của tôi · Của studio · Dự án này · Kho chung".** Áp vào sẽ
   (a) xoá mất 3 bộ lọc đang chạy (Tất cả / Chặng này / Gần đây), (b) đẻ tab **"Của tôi"** mà
   `SheetItem` không có trường nào đỡ được (không có `ownerId`/`author` trong `ScopeLevel`) ⇒ một tab
   luôn rỗng hoặc phải bịa dữ liệu. Đây là đổi **mô hình phạm vi kho**, không phải sơn lại giao diện.
4. **🔴 CẦN HOÀ QUYẾT — Thư viện: mock vẽ tấm DÍNH ĐÁY (bo 2 góc trên, cao 722px, cột kệ 214, cột
   thông số 236, dock 58) nhưng code là CARD RỜI 720×560 bo 4 góc theo đúng câu Hoà chốt 05/08**
   (ghi trong `library-sheet-css.ts`), kèm bỏ hẳn kính theo luật G9/G2. **Giữ bản Hoà đã chốt.**
   Cần xác nhận mock này có phải ý định lật lại quyết định 05/08 hay không.
5. **Thanh trạng thái ⑥ của mock Thư viện** — chỉ làm được "N mục trong kệ …". Hai mục còn lại
   ("Đã chọn: <tên> · <mã>", "Đã lưu 14:32") cần Thư viện có khái niệm "món đang chọn" (hiện bấm là
   dùng luôn) + nối Thư viện vào `StatusBar`.
6. **🟡 `.nt-macro-halo` là phần THÊM ngoài mock**: mock màn 03 chỉ có viền TĨNH; keyframe `nt-halo`
   mock khai mà không dùng. Ở đây gắn quầng thở cho mặt nút tổng lúc node con đang chạy (thu gọn thì
   đó là tín hiệu duy nhất còn lại), có nhánh reduced-motion. **Giữ lại vì hữu ích, nhưng gỡ chỉ mất
   1 class** nếu Hoà muốn đúng hợp đồng mock tuyệt đối.
7. **Chú giải 4 màu cổng** (mock Bảng nút, sidebar đáy: "Ảnh · Mặt nạ · Vật liệu · Tham số") chưa
   port ⇒ 4 màu cổng mới chưa có chỗ giải nghĩa. Nằm ở `NodeLibraryPanel` — cố ý không đụng file đó
   (nó là bảng chọn **node**, không phải Thư viện vật liệu của mock màn 3).
8. **`--p-mat` là token chết**: `DataType` chưa có kiểu `'material'`. Khai đúng mock, dùng được ngay
   khi thêm kiểu đó — không bịa DataType mới chỉ để lấp chỗ.
9. **Hộp thoại "Gom thành nút tổng" mất kính trong ~200ms lúc mở**: khối kính là CON của lớp phủ
   đang fade `opacity` ⇒ vi phạm K1 ("fade kính = self-opacity, không fade cha"). Đo được
   `opacity 0.79` giữa chừng, blur chết. **Có từ trước** (bản cũ `bg-black/45` cũng vậy), không do
   đợt này; ghi để phiên sau xử.

---

## 6. Nghiệm thu — số THẬT

- `npx tsc --noEmit -p .` → **đúng 1 lỗi, KHÔNG phải của làn A**:
  `lib/cad/render-layer-index.test.ts(36,21)` TS2352 (`Viewport` thiếu `panX/panY`) — vùng
  `lib/cad/**` bị cấm đụng, không đụng.
- Test: `edge-validity` **12/12** (thêm 4 ca mới) · `macro` **14/14** · `ffe/port` **31/31** ·
  `cad/library-item-resolve` **33/33**. Không hồi quy.
- Browser thật `127.0.0.1:3005` (dùng lại dev server sẵn có, không mở cổng mới), 1440×900,
  **cả 2 theme**: Tối + Kem đều chụp, chữ đọc được, 0 lỗi console còn sống (các lỗi trong buffer là
  bản biên dịch hỏng tạm thời do backtick trong comment CSS, đã sửa; kiểm lại CSS trên trang: 3 quy
  tắc mới đều có mặt, không có overlay lỗi Next).
- **Dọn sạch sau verify**: flow nháp trả về đúng trạng thái ban đầu (0 node · 0 dây · 0 cụm), theme
  trả về Tối, dây test `edge_badtype_test` đã gỡ. Không đụng `dev.db`, không tạo dự án mới.

## 7. File đã sửa (13 · **CHƯA COMMIT**)

`app/globals.css` · `components/FlowCanvas.tsx` · `components/studio/StatusBar.tsx` ·
`components/nodes/{InteriorNode,MacroNodeFace,MacroSelectionToolbar,MacroCreateDialog,GroupOverlay}.tsx` ·
`components/library/{LibrarySheet.tsx,library-sheet-css.ts}` · `lib/library/shelves.ts` ·
`lib/types.ts` · `lib/store.ts` · `lib/nodes/edge-validity.ts(.test.ts)` (mới).

> Trong working tree còn sửa của **làn khác** (`components/present-editor/Toolbar.tsx`,
> `components/print/`, `docs/CAY-GIA-PHA-IDF.html`, `docs/M-APPLY-C-OUT.md`,
> `docs/M-NODE-BOARD-OUT.md`, `lib/nodes/macro.test.ts`) — làn A **không đụng**.

---
---

# PHỤ LỤC A2 — phiên THỨ HAI cùng phiếu Làn A (19:54–21:0x)

> ⚠️ **Đọc mục 0 trước.** Phiếu Làn A được dán vào **HAI phiên** cùng lúc. Phần §0–§7 ở trên là
> của phiên thứ nhất (ghi lúc 20:01). Phụ lục này là phiên thứ hai. **KHÔNG ghi đè phần trên** —
> chỉ bổ sung phần họ chưa làm + phản biện + **1 khoản nợ dọn dữ liệu do phiên này gây ra**.

## A2.0 · Vì sao có hai phiên — và phiên này quyết định thế nào

Vào lúc 19:54, `git status` + mtime cho thấy 3 màn của phiếu **đã có người làm gần xong**:
`Macro*.tsx` (19:29–19:30) · `library/*` + `shelves.ts` (19:32–19:53, còn đổi tiếp sau 19:55) ·
`M-NODE-BOARD-OUT.md` (19:40). Thêm `M-APPLY-C-OUT.md` (19:57, làn in/giấy) và `lib/cad/*` +
`CadEditor.tsx` đổi sau 19:55 (làn CAD) ⇒ **ít nhất 3 làn cùng ghi một working tree**. App hiện
"Đang mở nơi khác".

Quyết định: **KHÔNG sửa chồng** vùng đang bị ghi. Phiên này chỉ (1) kiểm độc lập, (2) phản biện,
(3) vá đúng 2 điểm thiếu thật trong nhóm file đã ổn định 30+ phút.

## A2.1 · Hai điểm thiếu THẬT đã vá (cả 2 ở màn 2, đều thuộc mock `Nút tổng.dc.html`)

### a. "Giữ bên trong" — `MacroCreateDialog.tsx`

Mock dòng **227 · 243 · 264**: hàng ĐÃ TẮT thay ô nhập bằng **chữ tĩnh "Giữ bên trong"** màu
`--t4`. Code để nguyên `<input disabled>` **vẫn hiện tên gốc** mờ đi ⇒ người dùng thấy một ô
trông-như-sửa-được, gõ không ăn, không câu nào nói vì sao. Sửa: `row.exposed ? <input> : <span>`,
**giữ nguyên hình hộp** (h28 · bo 10 · nền `--field`) để hàng không nhảy khi bật/tắt công tắc.
Có bản EN qua `tr()`.

### b. Hàng tham số mặt nút tổng — `MacroNodeFace.tsx` (điểm ảnh hưởng lớn nhất của màn 2)

Mock dòng **313–342** xếp **NGANG**: nhãn cố định 96px trái · control phải · hàng cao 30px ·
trượt kèm số mono 30px căn phải. Code dùng lại `ParamField` của `InteriorNode` — nhãn IN HOA 10px
**nằm trên**, control tràn ngang ⇒ mặt nút **cao gấp đôi mock**, 4 tham số đã tràn khung 300px.

Sửa: thêm `MacroParamRow` **cục bộ trong chính file đó** (`text`/`select`/`slider`).
- **Không sửa `ParamField`**: node thường cần chỗ cho textarea + nút mở modal; sửa chung sẽ kéo
  theo cả canvas node thường.
- 6 kiểu mở modal (`image`/`mask`/`annotate`/`sketch`/`smartmask`/`corners`) **rơi về `ParamField`
  cũ** — mock không vẽ hàng ngang cho chúng, nhét nút mở cửa sổ vào ô 28px là bấm hụt.
- `tối đa N` (mock dòng 340) chỉ hiện với **thang ĐẾM** (`Number.isInteger(step) && step >= 1`);
  thang liên tục (0.05 · 0.1) thì trần vô nghĩa, và mock cũng không ghi ở hàng "Độ đậm nét vẽ".
- Giữ fallback `NaN → param.default` như `ParamField`, để node cũ không hiện "NaN".

**Nghiệm thu app thật** (ảnh trong transcript, `127.0.0.1:3005`, dùng lại dev server sẵn có):
mặt "Nút tổng 1" hiện 4 hàng ngang `Prompt · Style · Guidance · Bám sketch`, nhãn trái 96px,
trượt mảnh + số mono `15.00` / `0.60` căn phải — **đúng bố cục mock**; hàng `Vẽ tay` (kind
`sketch`) rơi về nút full-width như thiết kế. Đúng ở **cả 2 theme** (Mực + Kem). Hộp thoại: 2 hàng
tắt hiện đúng chữ **"Giữ bên trong"**, bật công tắc lên thì trở lại ô nhập tên gốc.
`npx tsc --noEmit -p .` — chỉ 1 lỗi CÓ TRƯỚC (`lib/cad/render-layer-index.test.ts:36`).
`npx tsx lib/nodes/macro.test.ts` **14/14**.

## A2.2 · Phản biện — bác bỏ / chỉnh lại

| Kết luận đang lưu hành | Phán quyết của phiên này |
|---|---|
| `M-NODE-BOARD-OUT.md §4f` + gap `G-NB-01`: *"dây sai kiểu chưa được tô đỏ"* | ❌ **Đã làm rồi** — `FlowCanvas.tsx:401` gán `stroke: var(--danger)` + `strokeDasharray '6 5'` + class `bn-edge-bad`. **Gỡ G-NB-01 khỏi danh sách gap** (phần §1 ở trên đã ghi đúng; chỉ sổ `M-NODE-BOARD-OUT` còn lệch) |
| Agent audit: *"5/6 nhãn kệ Thư viện LỆCH mock"* | ❌ **Không phải lỗi.** `lib/library/shelves.ts:29-31` ghi rõ kệ app **tự lọc theo chặng** theo `SPEC-STAGE-LIBRARIES`; ép khớp danh mục mock là **phá spec** |
| Agent audit: *"tấm Thư viện lệch mock (card rời, bo 4 góc, không kính)"* | ❌ **Lệch CÓ CHỦ Ý** do Hoà chốt 04/08 + 05/08 — trùng kết luận §5.4 ở trên, hai phiên độc lập cùng ra một chỗ ⇒ mục này **chắc chắn cần Hoà quyết** |
| Agent audit: *"thiếu `--m-oak/--m-paint/--m-linen`"* | ⚠️ Nửa đúng: 3 token không có, nhưng `lib/library/thumb-kinds.ts:74-99` **đã làm cùng việc đó bằng cách khác**. Thêm token = đẻ nguồn thứ hai |

## A2.3 · Delta GAP đề xuất TỔNG gộp vào `GAP-IF.md` (§0u — không tự sửa file đó)

Bổ sung cho phần đã có ở trên, **không trùng**:

| Mã tạm | IF thiếu gì (trung tính) | Subsystem | Build? |
|---|---|---|---|
| G-A-01 | Kho vật liệu **không có cột thông số** (mã · hãng · nguồn ATLAS · đơn vị · **giá** · nhám/bóng) ⇒ chọn xong không dùng để dự toán được. Mock gọi `CotThongSo` nhưng file con không tồn tại | thư viện | Có |
| G-A-04 | **Hợp đồng thiết kế rỗng**: 4 `dc-import` của `Thư viện.dc.html` (`KeVatLieu` · `KeDoDac` · `KeDangGom` · `CotThongSo`) trỏ vào file KHÔNG tồn tại ⇒ phiên sau buộc phải tự chế. `docs/M5-OUT.md:44-45` đã cảnh báo, **tình trạng chưa đổi** | quy trình thiết kế | Không |
| G-A-05 | Mock `Thư viện.dc.html` **mâu thuẫn với chốt 05/08 của Hoà** (kính vs đặc · dính đáy vs card rời · 214 vs 186px) — chưa ai gỡ mâu thuẫn | quy trình thiết kế | Không |

## A2.4 · 🔴 NỢ PHẢI DỌN — dữ liệu test của phiên này còn trong DB

§6 ở trên ghi *"dọn sạch sau verify"* — **đúng tại thời điểm 20:01**. Sau đó **phiên này** tạo dữ
liệu test mới và **CHƯA dọn được**:

- Flow `cmseovw360001w9hryuiqcyam` ("Untitled flow" — **vốn RỖNG**, đã kiểm: lúc vào thanh trạng
  thái ghi "0 nút") nay có **3 node** (`util.sketchpad` · `input.prompt` · `ai.sketch2render`),
  **2 dây**, **1 nhóm "Nút tổng 1"** — xác nhận bằng đọc `graphJson` trong `prisma/dev.db`.
- **Vì sao chưa dọn**: giữa lúc verify, dev server 3005 rơi vào 500 (`missing required error
  components`) rồi **phiên đăng nhập rớt** (401 → `/intro`). Tôi **không** logout, **không** xoá
  cookie (luật máu §2) — nghi do server rebuild giữa lúc 3 làn cùng sửa (làn C cũng ghi nhận
  hiện tượng vỡ build tương tự lúc 19:5x). Server đã 200 trở lại lúc 20:48 nhưng cần đăng nhập.
- **Không ghi SQL thẳng vào `prisma/dev.db`** (luật vận hành §1–3: sandbox không khoá được file
  SQLite).

**Cách dọn (Hoà, 30 giây):** mở "Untitled flow" → chặng Thiết kế 3D → chọn "Nút tổng 1" → Bỏ gom →
xoá 3 node `Vẽ tay tự do` · `Nhập prompt` · `Sketch → Ảnh thật`. Thanh trạng thái về "0 nút" là xong.

## A2.5 · Rác khác cần Hoà xử

- **`dev.db` 0 byte ở GỐC repo** (untracked). DB thật là `prisma/dev.db`. File rỗng này đã có
  trong `git status` từ 20:00 (**không phải phiên này tạo**), nhưng lệnh `sqlite3 dev.db` lúc kiểm
  có chạm mtime của nó. `rm dev.db` khi tiện — để lại dễ khiến phiên sau query nhầm DB rỗng.

## A2.6 · Chưa làm được — nói thẳng

- **Chưa chụp được ảnh đặt-cạnh với mock màn 03**: mở `file://` mock trong pane trình duyệt thì
  pane đóng giữa chừng; mở lại thì app đã 500 rồi mất phiên đăng nhập. Bằng chứng thay thế: ảnh
  app 2 theme trong transcript + đối chiếu **từng con số** với mock ở A2.1b (96px · 30px · 28px ·
  bo 10 · mono 30px căn phải).
- **Không đụng** `app/globals.css` · `components/library/*` · `lib/library/*` · `FlowCanvas.tsx` ·
  `lib/types.ts` · `StatusBar.tsx` (phiên thứ nhất đang giữ hoặc đã xong) · `lib/cad/*` ·
  `components/cad/*` (phiếu cấm). File phiên này đụng: **đúng 2** —
  `components/nodes/MacroCreateDialog.tsx` · `components/nodes/MacroNodeFace.tsx`.

---
---

# PHỤ LỤC A3 — VÒNG 2: gỡ G-A-04 · G-A-05, nối cột thông số, đính chính G-NB-01

> Phiên 06/08 tối. **CHƯA COMMIT** (V6). Không sửa `docs/GAP-IF.md` (§0u — TỔNG đã tự gộp
> G-A-04/05 vào đó lúc 20:0x, thấy ở `GAP-IF.md:87`).

## A3.0 · BƯỚC 0 — dán kết quả grep

```
$ grep -rna "dc-import" docs/mocks/*.html | head -20
docs/mocks/Chế độ Chuyên.dc.html:151:  <dc-import name="ToGiay" kho="A3" doc="false" …>
docs/mocks/Chế độ Chuyên.dc.html:167:  <dc-import name="BangNetIn" …>
docs/mocks/Thư viện.dc.html:173:      <dc-import name="KeVatLieu" chon-oak="" chon-paint="" …>
docs/mocks/Thư viện.dc.html:177:      <dc-import name="CotThongSo" ten="Gỗ sồi ghép thanh" ma="OAK-114"
                                       hang="An Cường" nguon="ATLAS" don-vi="mét vuông"
                                       gia="1 480 000" nhan-gia="Giá mỗi mét vuông"
                                       mau="var(--m-oak)" nham="0.42" bong="0.18" …>

$ ls docs/mocks/ | grep -ai "KeVatLieu\|KeDoDac\|KeDangGom\|CotThongSo"
(rỗng)
```

### 🔴 Phiếu vòng 2 nói "4 khối dc-import" — SAI, thật ra là **2**

| Tên | Có `dc-import` không | Có file con không |
|---|---|---|
| `KeVatLieu` | ✅ có (dòng 173) | ❌ không |
| `CotThongSo` | ✅ có (dòng 177) | ❌ không |
| `KeDoDac` | ❌ **KHÔNG** — chỉ là CHỮ trong dòng mô tả 53 | ❌ không |
| `KeDangGom` | ❌ **KHÔNG** — chỉ là CHỮ trong dòng mô tả 53 | ❌ không |

Dòng 53 của mock tự hứa *"Lưới thẻ và cột thông số nằm ở file con: KeVatLieu · KeDoDac ·
KeDangGom · CotThongSo"* — **hứa 4, gọi 2, có 0**. Hai cái tên kia là lời hứa suông, chưa bao giờ
được vẽ. Đây mới là hình dạng thật của G-A-04, hẹp hơn và cụ thể hơn báo cáo cũ.

## A3.1 · G-A-04 — chọn đường (b) NỘI HOÁ, và **không phải tự chế một dòng nào**

### Phát hiện quyết định: nội dung KHÔNG mất, nó nằm ở file anh em

`docs/mocks/mock-if-thu-vien.html` (57 KB, sửa **06/08 15:25** — trước `Thư viện.dc.html`
17 phút) chứa **ĐÚNG khung đó, đã đầy ruột**:

| | `mock-if-thu-vien.html` | `Thư viện.dc.html` |
|---|---|---|
| khối tấm | dòng 91 `height:722px;border-radius:28px 28px 0 0;…;grid-template-columns:214px 1fr 236px` | dòng 91 — **giống từng ký tự** |
| lưới thẻ ③ | dòng 159-270: 10 thẻ thật (Gỗ sồi ghép thanh · OAK-114 · An Cường …) | `<dc-import KeVatLieu>` — rỗng |
| cột thông số ④ | dòng 272-319: Hãng · Mã · Đơn vị · **Giá mỗi mét vuông 1 480 000** · Độ nhám 0.42 · Độ bóng 0.18 | `<dc-import CotThongSo>` — rỗng |

⇒ Bản `.dc` là một lần **tách file bỏ dở**: cắt 2 vùng ra thành `dc-import` rồi không bao giờ ghi
file con. Không phải "thiếu thiết kế" — là **hồi quy**.

### Chọn (b) gỡ `dc-import`, nội hoá vào file mẹ — 4 lý do

1. **Nguồn có sẵn, chép nguyên văn được** ⇒ không vi phạm "KHÔNG tự chế nội dung không có nguồn".
   Dựng 4 file con thì ngược lại: `KeDoDac`/`KeDangGom` **không có nguồn nào cả**, buộc phải bịa.
2. **`KeVatLieu`/`CotThongSo` không phải MÀN, chỉ là VÙNG của một màn.** Đối chiếu 2 `dc-import`
   duy nhất còn giải được (`ToGiay` · `BangNetIn`): chúng là màn ĐỨNG RIÊNG, có file `.dc` riêng,
   và được `Chế độ Chuyên.dc.html` DÙNG LẠI. Tách file có nghĩa khi được dùng lại ≥2 nơi.
3. **§0j "khuôn đã có, cấm đẻ cái thứ hai"** — 2 file con nữa = 2 nguồn phải đồng bộ tay với mẹ.
4. **Đóng đúng lỗ hổng `G-M5-05`** mà `docs/M5-OUT.md:44-50` nêu: cửa kiểm đo mock "rỗng" theo
   dung lượng + số thẻ nên file mẹ *đầy thẻ mà ruột trống* lọt lưới. Nội hoá làm mock **tự đủ** ⇒
   grep nội dung (`OAK-114`) bắt được ngay, không cần luật mới.

### Đã làm

- Chép **nguyên văn** `mock-if-thu-vien.html` dòng 159-270 → vùng ③, dòng 272-319 → vùng ④.
- **Nâng đúng 4 chỗ token** (không đổi gì khác): 3 gradient vật liệu → `var(--m-oak)` ·
  `var(--m-paint)` · `var(--m-linen)` + 1 chỗ `color:#fff` trên nền accent → `var(--on-accent)`.
  → 3 token này `:root` của bản `.dc` **đã khai sẵn mà chưa dùng** (báo cáo A2 §5 mục 6 từng ghi
  là "token chết") — hoá ra chúng được khai **dành riêng cho 2 vùng bị cắt**. Nay sống thật.
- Thêm `--swatch-bg` vào `:root` (nguồn dùng 13 lần; khai đủ **cả 2 theme**: Tối `#3a3a40`,
  Kem `#e4e0d8` — bản nguồn chỉ khai 1 lần nên nền Kem sẽ kẹt màu tối).
- Sửa dòng mô tả 53 cho khớp sự thật, nói thẳng KeDoDac/KeDangGom là lời hứa suông.
- Giữ dấu vết bằng comment `<!-- [06/08 · gỡ G-A-04] … -->` tại đúng 2 chỗ, ghi rõ chép từ đâu.

### Nghiệm thu mục 1 (dán lại grep SAU khi sửa)

```
$ grep -na '<dc-import' docs/mocks/*.html | grep -v ':[0-9]*: *<!--'
docs/mocks/Chế độ Chuyên.dc.html:151:  <dc-import name="ToGiay" …>
docs/mocks/Chế độ Chuyên.dc.html:167:  <dc-import name="BangNetIn" …>
docs/mocks/Thư viện.dc.html:172:  <!-- [06/08 · gỡ G-A-04] Trước đây là <dc-import name="KeVatLieu"> …
docs/mocks/Thư viện.dc.html:289:  <!-- [06/08 · gỡ G-A-04] Trước đây là <dc-import name="CotThongSo" …

$ ls -1 docs/mocks/ToGiay.dc.html docs/mocks/BangNetIn.dc.html
docs/mocks/BangNetIn.dc.html
docs/mocks/ToGiay.dc.html
```

⇒ **Thẻ `dc-import` SỐNG còn đúng 2, cả 2 trỏ vào file CÓ THẬT.** Hai dòng trong `Thư viện.dc.html`
nằm trong comment, không phải thẻ. **Không còn `dc-import` mồ côi nào trong `docs/mocks/`.**
Nội dung đã vào: `grep -c 'OAK-114\|An Cường\|Giá mỗi mét vuông\|Độ nhám'` = **8** (trước: 0).

## A3.2 · G-A-05 — bảng đối chiếu mock ↔ chốt (trích NGUYÊN VĂN, không trích trí nhớ)

### ⚠️ Trước hết: **KHÔNG CÓ file `CHOT-*.md` nào cho việc này**

```
$ grep -rna "chốt 05/08" .            # (bỏ node_modules, .git)
docs/TRUNG-TINH-VUNG-KHOANH.md:3      → chuyện trung tính, KHÔNG liên quan Thư viện
docs/00-BAT-DAU-DOC-DAY.md:141,301,369,392,413 → §0j §0l §0m §0n, KHÔNG liên quan
components/library/LibrarySheet.tsx:56        ← ✅ chốt gốc
components/library/library-sheet-css.ts:45    ← ✅ chốt gốc
```
`ls docs/ | grep CHOT` → file `CHOT-*` mới nhất là **02-03/08**, không có bản nào cho 05/08.

⇒ **Chốt gốc chỉ sống trong comment code.** Câu verbatim của Hoà, `LibrarySheet.tsx:56-57`:

> *"THƯ VIỆN — CARD RỜI trượt lên từ đáy (detached sheet, Hoà chốt 05/08: **"không dính bottom,
> raise lên là card rời bo 4 góc"**). Nền ĐẶC, không kính — xem `library-sheet-css.ts`."*

Và `library-sheet-css.ts:25-30` (căn cứ cho "bỏ kính"):

> *"🔴 SỬA 05/08 (Hoà, VIỆC 2 "card rời"): BỎ HẲN kính. Luật G9 liệt kê `.glass-float` CHỈ 4 chỗ và
> LibrarySheet không nằm trong đó; G2 bắt lớp nổi nhiều chữ phải nền ĐẶC ≥92% (popover ≥96%)."*

Luật nền, `docs/00-BAT-DAU-DOC-DAY.md:52` (**G2**) và `:59` (**G9**) — G9 nêu đích danh 4 chỗ được
dùng kính, không có Thư viện, và **"⛔ CẤM … mọi panel >2 dòng chữ"**.

### Bảng đối chiếu

| # | Điểm | Mock `.dc` ghi gì | Chốt/luật ghi gì | Bên nào thắng | Vì sao |
|---|---|---|---|---|---|
| 1 | Bám đáy | `border-radius:28px 28px 0 0`, dính đáy khung (d.91) | Hoà verbatim: *"không dính bottom, raise lên là card rời bo 4 góc"* | **CHỐT** | Câu chốt nói thẳng vào đúng điểm này |
| 2 | Bo góc | 2 góc trên | *"bo 4 góc"* (verbatim) | **CHỐT** | như trên |
| 3 | Kính | `background:var(--mat-panel)` + `backdrop-filter: blur(40px)` | G9: `.glass-float` CHỈ 4 chỗ, không có Thư viện · G2: lớp nổi nhiều chữ nền ĐẶC ≥92% | **CHỐT + LUẬT NỀN** | Đây là LUẬT viết ra sau sự cố, mạnh hơn một bản vẽ |
| 4 | Lớp phủ sau tấm | `var(--scrim)` trơn (d.89) | `library-sheet-css.ts:36-43`: Hoà 04/08 *"nền sau sheet phải tối xuống rõ"* → +22% | **CHỐT** | Có câu chốt, ghi tại chỗ |
| 5 | Cột kệ | 214px | 186px | 🟢 **MOCK** — *không sửa mock* | 186px **KHÔNG phải chốt**: `library-sheet-css.ts:4-6` ghi rõ nó là "port nguyên văn `mock-if-3chang.html`". Mock cũ thua mock mới. ⇒ việc của CODE, không phải của mock |
| 6 | 🔴 **Bề rộng tấm** (MỚI — phiếu chưa nêu) | khung 3 cột 214+1fr+236 trong màn 1440 | code `width:min(720px, 100vw-24px)` | ⏳ **CHƯA AI QUYẾT** | Không câu chốt nào nói bề rộng. Nhưng 720 − 186 − 236 = **298px** cho lưới thẻ ⇒ cột thông số và lưới không sống chung được ở 720. Xem A3.3 |

### Đã sửa mock (đúng 3 điểm 1·2·3, cộng điểm 4)

`docs/mocks/Thư viện.dc.html` dòng 89 + 91:
- `border-radius:28px 28px 0 0` → **`20px`** (4 góc, đúng `--radius-lg` app dùng)
- thêm `margin:0 12px 14px` (rời hẳn 3 mép — đúng "không dính bottom, raise lên")
- `background:var(--mat-panel)` + 2 dòng `backdrop-filter` → **`color-mix(in srgb, var(--panel) 97%, transparent)`**, bỏ kính
- bỏ `border-bottom:0`; bóng đổi sang `0 12px 40px rgba(0,0,0,.34)` — đúng công thức code
- scrim: thêm lớp `rgba(0,0,0,.22)` chồng lên `var(--scrim)`

**KHÔNG đụng** cột kệ 214px và khung 3 cột (điểm 5·6) — chưa có chốt, sửa là vượt quyền.

### Ảnh nghiệm thu → `docs/screenshots/`

- `G-A-04-thu-vien-sau-sua-toi.png` (nền Mực) · `G-A-04-thu-vien-sau-sua-kem.png` (nền Kem)
- Chụp bằng Chrome headless 1560×1150 trên chính file mock đã sửa. Đọc được ở cả 2 nền:
  lưới 10 thẻ vật liệu có quả cầu · cột thông số đủ 6 dòng (An Cường · OAK-114 · mét vuông ·
  1 480 000 · 0.42 · 0.18 + 2 thanh mức) · tấm **bo 4 góc, rời khỏi đáy, nền đặc** · dock 58 ·
  thanh trạng thái 26.

## A3.3 · G-A-01 — cột thông số ④ vào APP THẬT

Mục 1 xong ⇒ đã có hợp đồng ⇒ nối được.

**Mới**: `lib/library/spec-panel.ts` (thuần) + `spec-panel.test.ts` — **32/32 pass**.
`buildSpecRows()` trả **đủ 6 dòng theo đúng thứ tự mock**; `matchSpec()` khớp món↔kho theo MÃ
(chuẩn hoá hoa/thường + khoảng trắng, **không** khớp mờ theo tên: trùng tên khác mã là hai món
khác nhau trong dự toán); `formatVnd()` nhóm 3 chữ số bằng **dấu cách** đúng mock.

⛔ **Luật cứng của file: KHÔNG BỊA SỐ.** Giá/hãng/đơn vị đi thẳng vào báo giá gửi khách. Trường
chưa có nguồn thật ⇒ `value: null` ⇒ giao diện hiện `—` **kèm câu lý do**, KHÔNG rơi về số mẫu
`1 480 000` của mock. Test khoá cả 4 ca bẫy: giá `0` là giá THẬT (không nuốt thành ô trống) ·
`NaN` không hiện thành chữ "NaN" · chuỗi toàn khoảng trắng = chưa có · mã rỗng không khớp bừa.

**Giao diện**: `.speccol` (`library-sheet-css.ts`) + cột trong `LibrarySheet.tsx` — quả cầu 150px,
tên + badge phạm vi, 6 dòng thông số (mono + tabular), 2 thanh mức nhám/bóng, 2 nút
"Dùng cho vật đang chọn" / "Sửa bản sao" ghim đáy.

**Đổi hành vi (cố ý, theo mock)**: bấm thẻ = **CHỌN** (mở cột), bấm lại = bỏ chọn, bấm đúp = dùng
ngay, kéo–thả giữ nguyên. Trước đây **bấm một cái là ÁP THẲNG** vật liệu lên vật đang chọn —
không kịp xem mã/giá, không hoàn tác được trong tấm. Đã sửa 2 chuỗi hướng dẫn cho khớp hành vi mới.

**Cột chỉ hiện khi ĐANG CHỌN** — lý do ở A3.2 điểm 6: tấm rộng 720 (chốt), chiếm thường trực
236px thì lưới còn 298px (~2 thẻ/hàng) ngay cả lúc không cần. Hiện-khi-chọn giữ đúng nội dung mock
mà không đánh đổi lưới, và cũng đúng nghĩa của cột (nó tả MÓN ĐANG CHỌN).

### 🔴 Cần Hoà quyết: bề rộng tấm

Muốn cột thông số hiện **thường trực** như mock thì tấm phải rộng thêm. Ba lựa chọn:
- **(a) giữ 720, cột hiện-khi-chọn** ← đang làm. Không đụng chốt nào, lưới đủ rộng lúc duyệt kho.
- **(b) nới lên `min(956px, 100vw-24px)`** (= 720 + 236) — cột thường trực, lưới giữ nguyên bề
  rộng như hôm nay. Đổi 1 con số, không phá "card rời".
- **(c) theo mock hẳn** — tấm gần full 1440. Mâu thuẫn tinh thần "card rời" (card rời mà chiếm cả
  màn thì không còn là card).

### CHƯA verify được trên app thật

`tsc -p .` sạch (chỉ còn 1 lỗi có trước của làn CAD) · `spec-panel` 32/32. **Nhưng chưa mở được
Thư viện trên trình duyệt**: dev server 3005 của làn khác đã rớt phiên đăng nhập (401, xem A2.4),
và tôi **không tự nhập mật khẩu** để đăng nhập lại. ⇒ Cột thông số mới **chưa qua mắt người**.
Cần Hoà đăng nhập giúp (hoặc tự mở: bất kỳ chặng nào → nút Thư viện đáy → bấm 1 thẻ vật liệu).

## A3.4 · G-NB-01 — đã đính chính tại chỗ

`docs/M-NODE-BOARD-OUT.md` §4f nay có blockquote 🟢 **ĐÍNH CHÍNH 06/08**: gap đã đóng,
`FlowCanvas.tsx:401` tô đỏ đứt đoạn dây sai kiểu, dùng chung `findMistypedEdges` với `StatusBar`.
Không sửa đè chữ cũ (append-only).

## A3.5 · File vòng 2 này đụng tới

| File | Việc |
|---|---|
| `docs/mocks/Thư viện.dc.html` | nội hoá 2 vùng + sửa hình tấm theo chốt + sửa dòng mô tả (215 → 378 dòng) |
| `docs/M-NODE-BOARD-OUT.md` | 1 blockquote đính chính G-NB-01 |
| `lib/library/spec-panel.ts` · `spec-panel.test.ts` | **MỚI** |
| `components/library/library-sheet-css.ts` | khối `.speccol` + `.it.on` |
| `components/library/LibrarySheet.tsx` | state `picked` + cột ④ + đổi hành vi bấm thẻ |
| `docs/screenshots/G-A-04-thu-vien-sau-sua-{toi,kem}.png` | **MỚI** |

**KHÔNG đụng**: `docs/GAP-IF.md` (§0u) · `docs/mocks/mock-if-thu-vien.html` (chỉ ĐỌC làm nguồn) ·
`lib/cad/*` · `components/cad/*` · `app/globals.css`.

## A3.6 · Nợ còn lại

1. **Cột thông số chưa có dữ liệu THẬT** — `SheetItem` (`lib/library/shelves.ts`) là danh mục kệ,
   chưa mang hãng/đơn vị/giá; nguồn thật là `ProductSpec` qua `GET /api/specs`. `matchSpec()` đã
   viết + test sẵn cho lần nối đó; hiện chưa món mẫu nào trên kệ khớp mã trong kho nên **cả 5/6
   dòng hiện `—` kèm lý do** — đúng §9, không bịa.
2. **Nhám/bóng** ở kho KHÁC (matId PBR, `lib/materials/schema.ts`) — hai kho *cố ý không trộn*
   (STATUS.md 04/08), nối là một quyết định riêng.
3. **Dữ liệu test vòng 1 vẫn chưa dọn** (3 node + "Nút tổng 1" trong "Untitled flow") — xem A2.4.
4. Bề rộng tấm (A3.3) và cột kệ 214 vs 186 (A3.2 điểm 5) — chờ Hoà.
