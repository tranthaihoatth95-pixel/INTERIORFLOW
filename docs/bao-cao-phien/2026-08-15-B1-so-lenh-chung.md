# Báo cáo B1 — SỔ LỆNH CHUNG (nền của kiến trúc lệnh 3 tầng, 15/08)

Phiếu giao: `docs/phieu-giao/so-lenh-chung-b1.md` · Ticket gốc: `docs/TICKET-KIEN-TRUC-LENH-3-TANG.md` §4 B1 ·
Entry dây máy: `hotkey-registry`.

## 1. Tổng quan

`lib/commands/registry.ts` (55 CommandDef · 97 alias) **đúng hình dạng** để làm sổ lệnh duy nhất —
tiền đề phiếu **XÁC NHẬN ĐÚNG**. Đã thêm 2 trường additive (`stages`, `icon`), khai 9 LỆNH CHUNG
(10 CommandDef: Chọn·Dời·Xoay·Chép·Lật·Xoá·Hoàn tác·Làm lại·Đo·Chữ) với `stages` đủ 3 chặng, và
**sửa 1 điểm ticket ghi sai so với code thật**: giá trị chặng runtime là `'cad'/'render'/'present'`
(khớp `AppCommandPalette.tsx:154`), KHÔNG PHẢI `'concept'` như `TICKET-KIEN-TRUC-LENH-3-TANG.md` §2
ghi — đã sửa đúng theo code, không chép nguyên văn ticket sai. Cả 4 lệnh nghiệm thu đạt 0 lỗi/0
lệch. Chỉ đúng 2 file trong phạm vi bị sửa, không đụng 3 thanh công cụ, không đụng `lib/vision/*`,
không chạy git. **Không có gì đổi trên màn hình** — đúng chủ ý phiếu (việc nền dữ liệu).

## 2. Chi tiết từng mục

### ⓪ Tiền đề — XÁC NHẬN, kèm 1 điểm sửa

`CommandDef` (`registry.ts:99-127` sau sửa, gốc `:88-104`) có đủ `id/label/key?/aliases/when/
group/surfaces/run` — thiếu đúng 2 trường `stages`/`icon` như phiếu nói, KHÔNG cần viết lại.
Parser `when` (`parseWhen` gốc `:114-124`, factory `when()` gốc `:138`) chỉ đọc `KEY==VALUE`/
`KEY!=VALUE` nối `&&`, đúng mô tả phiếu — **XÁC NHẬN**, không dừng.

**1 điểm sửa so với ticket**: `TICKET-KIEN-TRUC-LENH-3-TANG.md:60` ghi kiểu
`stages: ('concept'|'render'|'present')[]`. Đọc code thật (`AppCommandPalette.tsx:153-157`, nơi
DUY NHẤT dựng `WhenCtx` thật hôm nay) thì giá trị `stage` luôn là `'cad'` khi ở chặng 2D, không
bao giờ là `'concept'` (đó là ID của `lib/phases.ts`, một hệ khác — "Trụ 1 danh nghĩa"). Nếu chép
nguyên văn ticket, `when` mới sẽ KHÔNG BAO GIỜ khớp với ctx thật do `AppCommandPalette` gửi ⇒ 9
lệnh chung sẽ câm lặng ngay từ ngày ra đời. Đã sửa `Stage` = `'cad'|'render'|'present'`, ghi rõ lý
do bằng comment tại chỗ khai (`registry.ts:66-75`) và tại TODO cuối file, để phiên sau không đọc
ticket rồi tưởng registry sai.

### File đã sửa — đúng 2 file trong phạm vi

**`lib/commands/registry.ts`**
1. Thêm `export type Stage = 'cad'|'render'|'present'` + field `stages?: Stage[]` và `icon?:
   string` vào `CommandDef` (additive — TS biên dịch sạch, 55 CommandDef cũ không sửa 1 dòng nào
   ngoài 10 dòng thuộc 9 lệnh chung).
2. Thêm `CAD_OR_RENDER` — predicate hàm thường (không qua `when()` string, vì parser cố ý không
   hỗ trợ `||`) cho Hoàn tác/Làm lại: thật ở CẢ `'cad'` lẫn `'render'`.
3. Nâng cấp 10 CommandDef (9 bullet ticket): `cad.sel.select`, `cad.edit.move`, `cad.edit.rotate`,
   `cad.edit.copy`, `cad.edit.mirror`, `cad.sel.delete`, `cad.sel.undo`, `cad.sel.redo`,
   `cad.dim.measure`, `cad.draw.text` — thêm `stages: ['cad','render','present']` + `icon` (lấy
   ĐÚNG icon đang chạy thật ở `CadToolbar.tsx`/`ToolDock3D.tsx`, đối chiếu từng dòng) + `key:
   ['Esc']` mới cho `cad.sel.select` (phím thắng đã chốt, xem bảng dưới). KHÔNG tạo CommandDef
   mới, KHÔNG thêm alias mới — 97 alias/55 nhóm-phát-lệnh giữ nguyên tuyệt đối (test parity vẫn
   pass 100%).
4. Sửa docstring đầu file (mục `key`/`icon`) + TODO cuối file cho khớp hiện trạng mới (đính chính
   luôn 1 câu SAI cũ: TODO#3 gốc từng ghi "WhenCtx.stage chưa có nơi gọi thật nào" — SAI, đã có
   `AppCommandPalette` từ trước; sửa lại đúng).

**`lib/commands/registry.test.ts`**
1. Thêm nhóm `[6] testSharedCommands()` — 10 CommandDef có `stages` đủ 3 + `icon` không rỗng · 45
   lệnh còn lại KHÔNG có `icon` (chưa có UI thật) · bảng thật/mờ đúng 3 chặng cho cả 10 id · không
   2 lệnh THẬT nào trùng `key` trong cùng 1 chặng (3 chặng đều kiểm) · alias thắng RO/CO/DI đứng
   đầu mảng · `key:['Esc']` của Select.
2. Sửa 1 assertion cũ trong `testCmdsFor()` (nhóm [3]) — câu cũ *"stage khác cad → rỗng (mọi lệnh
   CAD đều when stage==cad)"* KHÔNG CÒN ĐÚNG sau khi undo/redo thật ở `'render'`; sửa lại đúng
   thực tế (rỗng trừ đúng 2 id undo/redo) — không xoá ý gốc, chỉ cập nhật theo thay đổi cố ý.

### Quyết định kỹ thuật — vì sao mờ 8/10, thật 2/10 ở `'render'`, mờ cả 10 ở `'present'`

`stages` là field KHAI BÁO (chặng nào lệnh này conceptually sống), KHÔNG PHẢI cổng thật — cổng
thật vẫn là `when()`. Cả 10 lệnh khai `stages` đủ 3 (đúng ④.2), nhưng `when()` CHỈ trả `true` ở
chặng nào `run()` genuinely làm đúng việc, xác nhận bằng đọc code (không đoán):

- **`'cad'`**: cả 10 thật — không đổi gì (hành vi cũ nguyên vẹn).
- **`'render'`**: CHỈ Hoàn tác/Làm lại thật. Lý do: `useCadStore` là MỘT store dùng chung 2D+3D
  (K1 — Doc một nguồn); `Render3DModeSkeleton.tsx:310-329` đã tự gắn listener ⌘Z/⌘⇧Z gọi ĐÚNG
  `useCadStore.getState().undo()/redo()` — cùng hàm registry gọi, xác nhận đọc code, không suy
  đoán. 8 lệnh còn lại (Chọn/Dời/Xoay/Chép/Lật/Xoá/Đo/Chữ) có engine 3D THẬT nhưng nằm ở
  **store khác** (`useTool3D`, `lib/render-studio/tool3d.ts`, `TOOL3D_IDS = select/line/rect/
  circle/move/rotate/dup/ruler`) hoặc **không có tool tương đương** (Lật/Chữ — `TOOL3D_IDS` không
  có 'mirror'/'text'; mirror ở 3D là BuildOp qua form tab Sửa, khác cơ chế tool-click hoàn toàn).
  Gọi `run()` hiện tại (chỉ biết `useCadStore`) từ palette lúc ở 3D sẽ **không đổi gì thấy được
  trên khung nhìn** — đúng "nút giả" §9 cấm — nên cố tình để `when` chặn thay vì giả vờ chạy được.
  Nối 2 store là **B5** của ticket (`runFor` theo ngữ cảnh, §2b(b)/(c)), KHÔNG PHẢI B1.
- **`'present'`**: cả 10 mờ. `components/present-editor/useEditor.ts:111` là **React hook cục bộ
  component** (state qua `useReducer`/props, xác nhận đọc code), không phải store toàn cục —
  `lib/commands/registry.ts` (module thuần, ngoài React tree) không có cách nào với tới, dù chức
  năng thật SỰ tồn tại ở màn đó (vd `onDeleteSelected`, `onDuplicateSelected`, `onNudge`, undo/
  redo cục bộ, `onAddText`).

### Bảng 9 dòng — bằng chứng bắt buộc (⑥ nghiệm thu)

| Lệnh chung | id | Nhãn VI/EN | Phím chốt | Alias giữ lại | 'cad' | 'render' | 'present' |
|---|---|---|---|---|---|---|---|
| Chọn | `cad.sel.select` | Chọn / Select | **Esc** | `SEL` (gõ tay); 3D giữ `V` (không sửa file 3D) | ✅ thật | 🔸 mờ — engine ở `useTool3D`, store khác | 🔸 mờ — không store toàn cục |
| Dời | `cad.edit.move` | Di chuyển / Move | *(gõ `M`, không phím giữ)* | `M`,`MOVE` | ✅ thật | 🔸 mờ — `useTool3D` khác store | 🔸 mờ — cục bộ component |
| Xoay | `cad.edit.rotate` | Xoay / Rotate | **RO** (typed) | `RO`,`ROTATE`; 3D giữ `Q` | ✅ thật | 🔸 mờ — `useTool3D` khác store | 🔸 mờ |
| Chép | `cad.edit.copy` | Sao chép / Copy | **CO** (typed) | `CO`,`COPY`; 3D giữ `D` (tool3d id `dup`) | ✅ thật | 🔸 mờ — `useTool3D` khác store | 🔸 mờ |
| Lật | `cad.edit.mirror` | Đối xứng / Mirror | *(gõ `MI`)* | `MI`,`MIRROR` | ✅ thật | 🔸 mờ — 3D không có tool rời, mirror là BuildOp form | 🔸 mờ — không có "Lật" ở Present |
| Xoá | `cad.sel.delete` | Xoá / Delete | `Delete` (giữ nguyên) | `E`,`DEL`,`ERASE` | ✅ thật | 🔸 mờ — `deleteSelected()` đọc `useCadStore.selection`, 3D dùng `viewportSelectedId` cục bộ khác | 🔸 mờ |
| Hoàn tác/Làm lại | `cad.sel.undo` + `cad.sel.redo` | Hoàn tác·Làm lại / Undo·Redo | `⌘Z` / `⌘⇧Z` (giữ nguyên) | `U`,`UNDO` / `RE`,`REDO` | ✅ thật | ✅ **THẬT** — cùng `useCadStore`, đã có listener riêng ở `Render3DModeSkeleton.tsx` | 🔸 mờ — `useEditor()` cục bộ |
| Đo | `cad.dim.measure` | Đo khoảng cách / Measure distance | **DI** (typed) | `DI`; 3D có khái niệm gần (không hệt) `T`=Thước (tool3d `ruler`, đo W×D×H) | ✅ thật | 🔸 mờ — khác store + khác nghĩa (đo 2 điểm ≠ đo hộp bao) | 🔸 mờ |
| Chữ | `cad.draw.text` | Chữ / Text | *(gõ `T`)* | `T`,`TEXT` | ✅ thật | 🔸 mờ — `TOOL3D_IDS` không có `text` | 🔸 mờ — `onAddText` cục bộ component |

## 3. Tổng kết lại vấn đề

B1 hoàn thành đúng phạm vi hẹp được giao: dữ liệu sổ lệnh nay MANG ĐỦ thông tin để B2 (nối 3 thanh
công cụ đọc registry) làm việc — 9 lệnh chung đã có tên/icon/phím thống nhất MỘT bản, và ranh giới
"đâu thật đâu mờ" đã tường minh bằng `when()` + comment tại chỗ (không phải đoán khi B2 cần biết
lệnh nào bấm được ngay). Điểm quan trọng nhất phát hiện được: **ticket tự nó có 1 lỗi dữ liệu**
(`'concept'` thay vì `'cad'`) — nếu B1 làm theo đúng nghĩa đen sẽ tạo ra 9 lệnh chung câm hoàn
toàn (không bao giờ `when()===true`), một dạng "sổ quên" ngược — code đúng chuẩn `soi:contract`
nhưng vô dụng thực tế. Việc đọc code thật trước khi chép ticket đã chặn đúng lỗi này.

## 4. Đánh giá khách quan

**Tốt:**
- Không phá gì: 55 lệnh cũ/97 alias nguyên vẹn (test parity 100%), `soi:contract`/`soi:tu-dien`
  0 lệch, tsc 0 lỗi.
- Không có "nút giả": mọi ô mờ đều có lý do cụ thể (tên store/file/dòng), verify bằng đọc code
  (grep xác nhận `TOOL3D_IDS`, `deleteSelected`, `useEditor`), không suy đoán.
- Bắt được 1 lỗi thật trong tài liệu nguồn (ticket) trước khi nó lan vào code.

**Chưa tốt / rủi ro:**
- **8/10 lệnh chung vẫn mờ ở `'render'` và cả 10 mờ ở `'present'`** — nghĩa là "1 sổ lệnh, giống
  hệt 3 chặng" MỚI ĐÚNG PHẦN DỮ LIỆU (tên/icon/phím thống nhất), CHƯA ĐÚNG PHẦN HÀNH VI (bấm ở 3D/
  Present chưa làm gì cả, vì registry chưa nối được store khác). Nếu người đọc chỉ thấy `stages`
  đủ 3 mà không đọc kỹ `when`, dễ hiểu lầm là "đã xong" — đây là rủi ro đọc-lướt, đã cố giảm bằng
  comment dày tại từng dòng nhưng không loại bỏ hoàn toàn được.
- Việc thêm `key:['Esc']` cho Select là một quyết định VƯỢT NHẸ khỏi "chỉ thêm 2 trường" (ticket
  ④.1 chỉ nói `stages`+`icon`) — có cơ sở (Esc đã THẬT ở 2D, xác nhận đọc `CadCanvas.tsx:2583-
  2607`) và đúng tinh thần ④.3 "chốt phím thắng: Chọn Esc", nhưng là một lựa chọn diễn giải, không
  phải chữ nghĩa đen của phiếu — nêu rõ để Hoà/T biết mà xét lại nếu cần.
- Chưa verify được 100% rằng KHÔNG có nơi nào khác trong code (ngoài `AppCommandPalette.tsx`) đọc
  `WhenCtx.stage` với giá trị khác `'cad'/'render'/'present'` — đã `grep` toàn bộ `components`+
  `app` cho `commands/registry` (8 kết quả, đã đọc hết những cái liên quan), nhưng không chạy
  full-repo semantic search cho các cách gọi gián tiếp (vd qua re-export).

## 5. Hướng xử lý nhiều góc độ

**Hướng A — giữ nguyên hiện trạng B1, để B2/B5 nối dần (đề xuất).** B2 đọc registry cho 3 thanh
công cụ (dùng `stages`+`icon`+`when` y như đang khai), B5 mới đụng tới "nối nhiều store" (`runFor`
theo ngữ cảnh). Ưu: đúng lộ trình 4 bước đã chốt trong ticket ("mỗi bước tự đứng được"), rủi ro
thấp, không đá bóng qua sân người khác. Nhược: 3D/Present sẽ có giai đoạn "lệnh chung nhìn thấy đủ
9 nhưng bấm không chạy" nếu B2 làm UI trước khi B5 nối hành vi — cần B2 tự lọc theo `when(ctx)`
thật (không chỉ theo `stages`) để tránh hiện nút chết.

**Hướng B — B1 tự mở rộng `run` ngay để dùng được ở 3D luôn** (import `useTool3D`, viết bảng ánh
xạ id↔Tool3DId, gọi cả 2 store trong 1 `run()`). Ưu: 3D có ngay 6/8 lệnh chung thật (trừ Lật/Chữ
không có tool3d tương đương), rút ngắn lộ trình. Nhược: đây CHÍNH LÀ cơ chế `runFor` ticket đã xếp
riêng vào B5 ("rộng nhất, xếp sau B1-B2, vì phải có sổ chung trước mới đối chiếu được") — làm sớm
trong B1 là lấn phạm vi của bước sau, tăng diện thay đổi trong một phiếu vốn được đóng khung hẹp
("nền dữ liệu"), và tự ý ánh xạ id (`copy`↔`dup`, `measure`↔`ruler`) mà không có ai soát lại có
rủi ro ánh xạ sai ý nghĩa (đã ghi rõ `measure`≠`ruler` về ngữ nghĩa trong bảng trên).

## 6. Đề xuất hướng tốt nhất

**Chọn Hướng A.** Lý do chính: ticket đã tự phân kỳ 4 bước có chủ đích ("mỗi bước tự đứng được"),
và B1 phiếu giao ghi rõ "CHỈ sửa 2 file" + liệt kê đúng 5 việc, không việc nào là "nối cross-store
dispatch". Vượt sang Hướng B trong phiếu này sẽ vi phạm đúng ranh giới đã được giao rõ ràng, dù
kỹ thuật khả thi. Đề xuất thứ tự tiếp theo: B2 (3 thanh công cụ đọc registry, dùng `stages` để biết
lệnh nào NÊN xuất hiện + `when(ctx)` để biết lệnh nào BẤM ĐƯỢC — 2 trục khác nhau, không gộp) rồi
mới tới B5 (bảng ánh xạ `runFor` cross-store, cần review kỹ ngữ nghĩa từng cặp trước khi gộp, đặc
biệt cặp Đo/Thước đã lệch nghĩa).

## ⑦b CHƯA CHẮC / CHƯA KIỂM

1. **`key:['Esc']` cho Select** — quyết định diễn giải (xem mục 4), chưa hỏi lại Hoà/T trước khi
   làm (theo luật "quyết định và ghi lý do" thay vì dừng hỏi mọi lựa chọn nhỏ) — nếu T thấy đây là
   lấn phạm vi, revert dễ (1 dòng).
2. **Chưa chạy `npm run soi:frontier`** — phiếu không yêu cầu (chỉ 4 lệnh: tsc/test/soi:tu-dien/
   soi:contract), nhưng entry `hotkey-registry` có thể cần T tự flip trạng thái sau khi đọc báo
   cáo này (đúng câu cuối phiếu "Agent KHÔNG tự sửa registry frontier").
3. **Chưa kiểm** liệu có component nào KHÁC `AppCommandPalette.tsx` gọi `cmdsFor`/`findByAlias`
   với `ctx.stage` mang giá trị lạ (vd viết tay `'concept'` ở đâu đó do nhầm theo ticket cũ) —
   `grep` 8 file có import `commands/registry` đã đọc hết, không thấy, nhưng không phải full
   semantic-search toàn repo.
4. **`gateFor()` cho move/copy/rotate/mirror/measure/text = CAD_BASIC** dựa trên đọc
   `PRO_ONLY_TOOLS` (`store.ts:187-193`) tại THỜI ĐIỂM viết báo cáo này — nếu set đó đổi sau này
   (thêm 1 trong 6 tool vào Pro-only), `when` của 10 lệnh chung tự động đổi theo (đúng thiết kế
   một-nguồn), nhưng KHÔNG có test nào cảnh báo NẾU ai đó cố tình thêm `move` vào PRO_ONLY_TOOLS
   rồi quên rằng nó ảnh hưởng cả lệnh chung — rủi ro nhỏ, chưa xử.

## ⑦c HẠN DÙNG KẾT LUẬN

Toàn bộ bảng "thật/mờ theo chặng" ở mục 2 chỉ đúng tại **15/08/2026**, dựa trên đọc trực tiếp:
`lib/render-studio/tool3d.ts` (`TOOL3D_IDS` 8 phần tử), `components/render-studio/
Render3DModeSkeleton.tsx` (dòng ~310-329, ~720), `components/render-studio/Command3DPanel.tsx`
(dòng ~917-967 mirror), `components/present-editor/useEditor.ts:111`, `components/present-editor/
PresentEditor.tsx` (~845-1680). **Hết hạn ngay khi bất kỳ file nào trong 5 file trên đổi** — đặc
biệt: nếu B2/B5 sau này thêm 'text'/'mirror' vào `TOOL3D_IDS`, hoặc nối `viewportSelectedId` vào
`useCadStore.selection`, hoặc chuyển `PresentEditor` sang store toàn cục — các dòng "mờ" tương ứng
trong bảng sẽ SAI, phải đọc lại code chứ không được tin bảng cũ. Kết luận về `AppCommandPalette.tsx:
153-157` là ctx thật DUY NHẤT hôm nay cũng hết hạn nếu có màn hình mới tự dựng `WhenCtx` riêng.
