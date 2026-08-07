# M-NODE-BOARD-OUT — APPLY mock `docs/mocks/Bảng nút.dc.html` → code (06/08)

> V6: **KHÔNG commit**. Chỉ sửa file + báo cáo.
> §0u: delta GAP ghi Ở ĐÂY, **KHÔNG tự sửa `docs/GAP-IF.md`** — TỔNG gộp về sổ chung.
> ⚠️ Đo lúc **19:2x–19:4x ngày 06/08**, trên dev server CÓ SẴN `127.0.0.1:3005` (không dựng
> server mới). Phiên khác sửa song song `components/library/*`, `lib/library/shelves.ts`,
> `components/nodes/Macro*.tsx` **và cùng file `app/globals.css`** trong lúc đo — xem §5.

---

## 1 · BƯỚC 0 (N7) — grep `-a` trước khi thêm

| Định thêm | Lệnh đã chạy | Kết quả | Xử lý |
|---|---|---|---|
| `--p-img` (+3 biến cùng bộ) | `grep -ran -- "--p-img" .` (loại `node_modules`) | **CHƯA có trong code** — 19 dòng đều nằm trong `docs/` (`mocks/Bảng nút.dc.html`, `mocks/mock-if-bang-nut.html`, 2 file audit) | thêm mới vào `app/globals.css` |
| `bn-dash` | `grep -ran -- "bn-dash" .` | **CHƯA có trong code** — 5 dòng, toàn bộ trong `docs/` | chép nguyên keyframe từ mock |
| `nối sai` | `grep -ran -- "nối sai" .` | **CHƯA có trong code** — 9 dòng, toàn bộ trong `docs/` (spec + 2 mock) | thêm bộ đếm mới |

Grep thêm trước khi viết (chống đẻ trùng): `DATA_TYPE_COLORS` (đã có, 1 bảng dùng chung 7 nơi —
KHÔNG dựng bảng màu thứ hai) · `isValidConnection` (`FlowCanvas.tsx:331`, đã có — bộ đếm dùng
CÙNG luật so kiểu, không viết luật thứ hai) · `StatusBar` (đã có thanh trạng thái dùng chung 3
chặng — KHÔNG dựng thanh riêng cho bảng nút).

---

## 2 · Đã làm

### ① Màu cổng theo kiểu — `app/globals.css` + `lib/types.ts`
4 biến vào `:root`, **khai BÍ DANH của token thật** thay vì chép hex cứng:
`--p-img: var(--accent)` · `--p-mask: var(--warning)` · `--p-mat: var(--success)` ·
`--p-num: var(--t3)`. `DATA_TYPE_COLORS` (`lib/types.ts:147`) đổi `image`/`mask`/`number` sang
3 biến đó ⇒ chấm cổng (`InteriorNode` · `MacroNodeFace`) **và màu dây** (`edgeStyleFor`,
`lib/store.ts`) cùng đổi theo một nguồn.

### ② Dây đứt nét chạy — `app/globals.css` + `components/FlowCanvas.tsx`
`@keyframes bn-dash{to{stroke-dashoffset:-24}}` chép nguyên văn từ mock. Áp 2 chỗ, đúng "chỉ khi
đang chạy/kéo":
- **đang chạy**: `renderEdges` gắn class `bn-edge-running` cho cạnh CHẢY VÀO node
  `running`/`queued` (đúng mock màn 02: node nguồn đã "Xong", dây tới node đang render mới chạy).
- **đang kéo**: `connectionLineStyle` mang cùng keyframe + `strokeDasharray:'6 6'`, và lấy MÀU
  CỔNG NGUỒN theo `connectFromType` (trước là hex tím cứng `#8b7cf7`).

### ③ Đếm "nối sai" — `lib/nodes/edge-validity.ts` (MỚI) + `components/studio/StatusBar.tsx`
Hàm thuần `findMistypedEdges`/`countMistypedEdges`/`countBoardNodes` (nhận `lookupDef` từ ngoài
nên test không phải kéo cả `registry.ts`; import tương đối vì `@/…` không chạy dưới
`sucrase-node`). Thanh trạng thái chặng 3D hiện **`N nút · M nối sai`**.

**Vì sao vẫn có dây sai dù `isValidConnection` đã chặn** (ghi trong docblock): cửa chặn chỉ gác
thao tác nối tay — dây sai vào bảng qua flow cũ đã lưu · định nghĩa cổng đổi kiểu về sau · demo
dựng bằng `addEdge` thẳng trong store.

---

## 3 · Nghiệm thu — đo THẬT, không suy

`npx tsc --noEmit -p .` → chỉ **1 lỗi CÓ TRƯỚC** (`lib/cad/render-layer-index.test.ts:36`, xác
minh bằng `git stash` rồi chạy lại: lỗi y hệt khi chưa có diff này).
`npm test` → chỉ **1 fail CŨ đã biết** (`cad-to-obj` entityId nội thất). Test mới
`lib/nodes/edge-validity.test.ts` **8/8**; `lib/ffe/port.test.ts` 31/31; `lib/nodes/macro.test.ts`
14/14 (xem §4a — 1 assertion phải sửa).

Trình duyệt thật `127.0.0.1:3005`, chặng 3D → mode bảng nút, demo "Vẽ tay → Render" 3 khối:

| Điểm | Mock `Bảng nút.dc` | Đo được trên app | Khớp |
|---|---|---|---|
| ① biến cổng, nền Mực | `#6a57f5 · #d9a34a · #46b876 · #9e9ea8` | `rgb(106,87,245) · rgb(217,163,74) · rgb(70,184,118) · rgb(158,158,168)` | ✅ từng byte |
| ① biến cổng, nền Kem | mock **không khai lại** (giữ nguyên hex nền Mực ⇒ sai tương phản) | `#6a57f5 · #9a6304 · #107043 · #726c62` (bản nền Kem của token) | ⚠️ cố ý LỆCH mock — xem §4b |
| ① chấm cổng thật | chấm 10px viền `2px solid var(--bg)` | 6/6 handle: `width 10px`, cổng ảnh `rgb(106,87,245)`, cổng chữ `rgb(56,189,248)` | ✅ |
| ② dây đang chạy | `stroke-dasharray:6 6` · `opacity:.5` · `animation:bn-dash 1s linear infinite` | computed: `6px, 6px` · `0.5` · `bn-dash 1s` | ✅ |
| ② dây đang kéo | cùng nét chạy | đọc prop sống của React Flow (fiber): `{stroke:'var(--p-img)', strokeDasharray:'6 6', animation:'bn-dash 1s linear infinite', strokeWidth:2}` | 🟡 xem §4c |
| ③ thanh trạng thái | `7 nút · 1 nối sai` | `3 nút · 0 nối sai` → sau khi cố tình nối sai 1 dây: **`3 nút · 1 nối sai`** (đỏ) | ✅ |

Chụp đủ **2 theme** (Tối + Kem) ở trạng thái "node đang chạy 42% + 1 dây nối sai". Console: **0
lỗi** do việc này (lỗi duy nhất trong log là build error `components/library/library-sheet-css.ts`
của phiên khác, họ đã tự sửa xong).

**Dọn sạch sau verify**: 3 node test + dây sai đã xoá (`0 nút · 0 nối sai`, đúng hiện trạng lúc
vào), `themePref` trả về `'auto'`. Không đụng `dev.db`.

---

## 4 · Delta / điều phải khai thật

**a. Test cũ vỡ vì đổi hex → token (đã sửa, không giấu).** `lib/nodes/macro.test.ts:77` khoá
`/^#/.test(dotColor)` — khoá dạng hex tức là cấm token hoá, ngược luật L4. Đổi assertion sang
"màu CSS dùng được (hex **hoặc** `var(--…)`)". Đây là sửa HỢP ĐỒNG có chủ ý, không phải nới test
cho qua.

**b. Cố ý lệch mock ở nền Kem.** Mock khai 4 biến MỘT LẦN ngoài khối theme ⇒ nền Kem giữ nguyên
màu nền Mực (`--p-mask #d9a34a` trên `--panel #faf8f4` chỉ ~2.0:1). Khai bí danh token thật thì
nền Kem tự có bản đủ tương phản. Trùng đúng khuyến nghị `docs/AUDIT-MOCK-MANPHU-2026-08-03.md`
(mục token: "4 biến `--p-*` chỉ là bí danh… phải bỏ bí danh, dùng thẳng") — ở đây giữ TÊN biến
theo yêu cầu phiếu nhưng RUỘT là token, được cả hai.

**c. Chưa chụp được ảnh dây ĐANG KÉO giữa chừng.** Công cụ trình duyệt trong sandbox chỉ có
`left_click_drag` (không tách được nhấn/thả để chụp lúc đang giữ); pointer event tổng hợp không
kích hoạt được bộ nối của React Flow v12. Bằng chứng thay thế: đọc **prop sống** đang nằm trong
fiber React Flow (bảng §3) + cùng `@keyframes` đã chứng minh chạy thật trên dây "đang chạy".
Còn thiếu: một khung hình mắt-thấy của dây kéo.

**d. `--p-mat` (Vật liệu) CHƯA có nơi tiêu thụ.** `DataType` hiện là
`image|text|mask|number|video|table` — **không có kiểu 'material'**. Biến vẫn khai đúng mock để
dùng được ngay khi có kiểu đó; KHÔNG bịa một DataType mới chỉ để lấp chỗ trống.

**e. `text`/`video`/`table` vẫn là hex.** Mock chỉ vẽ 4 loại cổng nên không có nguồn cho 3 kiểu
này; riêng `table` bị test khoá đúng giá trị `--accent-warm` (`lib/ffe/port.test.ts`). Token hoá
tiếp = quyết định thiết kế mới, ngoài phạm vi phiếu.

**f. Dây SAI KIỂU chưa được tô đỏ trên canvas.** Mock (`Bảng nút.dc:141` + dòng 63) vẽ dây sai
`stroke:var(--danger); stroke-dasharray:6 5` kèm nhãn nổi cạnh dây. Phiếu chỉ giao phần ĐẾM ở
thanh trạng thái nên chỉ làm phần đó ⇒ người dùng đọc được "1 nối sai" nhưng phải tự dò cả bảng.
Hàm `findMistypedEdges` (trả `edgeId`) đã sẵn cho việc tô — chỉ thiếu 1 lần gắn class trong
`renderEdges`.

> 🟢 **ĐÍNH CHÍNH 06/08 (vòng 2 làn A) — mục f này KHÔNG CÒN ĐÚNG, gap `G-NB-01` đã đóng.**
> `components/FlowCanvas.tsx:401` nay gán `stroke: 'var(--danger)'` + `strokeDasharray: '6 5'` +
> class `bn-edge-bad` cho đúng các cạnh `findMistypedEdges` trả về (dùng CHUNG một luật so kiểu
> với `StatusBar`, không viết luật thứ hai). Nghĩa là dây sai **đã tô đỏ đứt đoạn trên canvas**,
> không còn cảnh "đọc được con số mà phải tự dò cả bảng". Chi tiết: `docs/M-APPLY-A-OUT.md` §1
> (bảng ③) và §A2.2.

**g. Bộ đếm bị chặn ở mode "Vẽ 3D".** Chặng 3D có 2 mode shell (`lib/stage-mode.ts`); chỉ mode
bảng nút mới có khái niệm "nút / nối sai" nên gate thêm `renderStageMode === 'render'` — nếu
không, đứng ở Vẽ 3D vẫn thấy con số của màn khác.

**h. Nét đứt phải ghi đè bằng INLINE, không bằng class.** `edgeStyleFor` gán
`strokeDasharray:'6 3'` inline cho luồng dữ liệu (text/number/table) — inline luôn thắng CSS
class ⇒ `renderEdges` phải tự đặt `strokeDasharray:'6 6'` khi cạnh đang chạy. Bẫy này do agent
phản biện bắt được, không phải tự thấy.

### Delta GAP đề xuất cho TỔNG gộp vào `GAP-IF.md`

| Mã tạm | IF thiếu gì (trung tính) | Subsystem | Build? |
|---|---|---|---|
| G-NB-01 | Dây nối SAI KIỂU chỉ đếm được, **chưa nhìn ra được dây nào** trên bảng — thiếu 1 lần gắn class đỏ (hàm trả `edgeId` đã có). | luồng node | Có (nối dây) |
| G-NB-02 | Luồng node **không có kiểu cổng 'vật liệu'** dù thư viện vật liệu (matId) đã là công dân hạng nhất ở 2 chặng khác ⇒ swatch vật liệu không đi qua dây được. Cùng họ với G-M3-02 (thiếu kiểu 'bảng'). | luồng node | Có |
| G-NB-03 | Màu 3 kiểu cổng còn lại (`text`/`video`/`table`) vẫn hex rời, **không đổi theo theme** — nền Kem 3 màu này giữ nguyên giá trị nền Mực. | design system | Có |

---

## 5 · Hai phiên chung `.git` — tái diễn (không mất dữ liệu)

Trong lúc đo, phiên khác sửa song song `components/library/*` (có lúc **làm vỡ compile**, dev
server hiện Build Error ~1 phút rồi họ tự sửa), `lib/library/shelves.ts`, `components/nodes/
Macro*.tsx`, `components/nodes/GroupOverlay.tsx` **và cùng file `app/globals.css`** (họ thêm
`--scrim`, `--k-doc`, bộ token giấy in, `@keyframes nt-halo`). Đã đọc lại `git diff` xác nhận
khối của phiên này **nằm riêng, không xung đột, không mất dòng nào**. Không commit (V6), không
`git add -A`.

## 6 · File đụng tới

`app/globals.css` (thêm khối token cổng + `bn-dash`/`.bn-edge-running`) · `lib/types.ts`
(`DATA_TYPE_COLORS` 3 kiểu) · `lib/store.ts` (1 dòng fallback màu) · `components/FlowCanvas.tsx`
(`renderEdges` + `connectionLineStyle`) · `components/nodes/InteriorNode.tsx` (chỉ comment) ·
`components/studio/StatusBar.tsx` (bộ đếm + gate mode) · `lib/nodes/macro.test.ts` (1 assertion) ·
**MỚI**: `lib/nodes/edge-validity.ts` + `lib/nodes/edge-validity.test.ts`.
