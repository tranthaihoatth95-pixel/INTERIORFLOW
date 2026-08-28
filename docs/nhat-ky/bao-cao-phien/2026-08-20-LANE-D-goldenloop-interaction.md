# LANE D — Golden Loop + Interaction Contract (đêm 20/08)

Mốc: `c7f3ac8` · main · server 3001 (dùng lại, không restart) · browser thật, tab riêng `tab-7`.
Vùng ghi: `components/cad|three|review|render-studio|ui`, `lib/commands`. Không đụng vùng LANE B/C.

---

## ① TIỀN ĐỀ (ô ⓪ / ⓪b)

- `git log --oneline -1` = `c7f3ac8`, nhánh `main`, `HEAD..main` = 0 lệch → **PASS**, làm tiếp.
- Server 3001 đã chạy sẵn (PID 2279) → dùng lại, **không** đẻ server mới, **không** restart.
- Tiền đề nghiệp vụ của phiếu ("chạy Golden Loop bằng click UI thật") **nhận**, có một điều chỉnh
  phải khai: `read_page` trả `(empty page)` và `innerWidth/clientWidth = 0` trên tab này suốt
  phiên ⇒ **không dùng được cây a11y của trình duyệt**. Đã thay bằng screenshot + truy vấn DOM
  trực tiếp. Ảnh hưởng: xem ô ⑦b.

---

## ② VIỆC ĐÃ LÀM

Chạy trọn Golden Loop trên dữ liệu thật, thao tác bằng nút/phím thật (không gọi API thay nút),
rồi soi hợp đồng tương tác ở từng chặng. Sửa 3 lỗi trong đúng vùng sở hữu.

### Bảng Golden Loop

| # | Chặng | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | HOME | **PASS** | 18/18 dự án, bento render đủ; rail nhóm DỰ ÁN mờ đúng lúc chưa mở dự án |
| 2 | Resume / mở dự án | **PASS** | Click thẻ "Nháp" → vào thẳng **Thiết kế 2D** = đúng "nhảy stage đang dở"; cuối phiên thẻ tự đổi sang "Trình chiếu" |
| 3 | 2D — vẽ | **PASS** (sau khi sửa BUG-D2) | `W`→Enter→2 click→Enter ra tường thật; status "X 3575 Y 3525 mm" |
| 4 | 2D — chọn | **PASS** | Click tường → sáng, Inspector hiện (chỉ khi có chọn); ⌘A → "Đã chọn 2 đối tượng" |
| 5 | 2D — undo/redo | **PARTIAL** | ⌘Z xoá, ⌘⇧Z phục hồi đúng hình. Nhưng để lại lựa chọn ma → BUG-D4 |
| 6 | Thư viện — mở/duyệt | **PASS** | Sheet nổi (không dính đáy), 14 kệ, 3 nấc cỡ thẻ Nhỏ/Vừa/Lớn, cột thông số trượt vào **chỉ khi chọn món** — đúng chốt 07/08 |
| 7 | Thư viện — thả xuống bản vẽ | **PASS** | Kệ "Văn phòng · Cụm bàn" → "Nhận 2 phần" → cụm bàn+ghế rơi thật; status "Đã thả 'Chữ L xương sống' … 2.860×5.600mm · 8 chỗ" |
| 8 | 3D | **PASS** | Viewport + ViewCube + empty state có việc làm ("＋ Thêm tường"); **tải chậm ~8 s** (xem ⑦b) |
| 9 | Review / Bảng kiểm | **PASS** | Hai lớp tách đúng chốt §12: ⚖ LUẬT vs ✨ GỢI Ý — MAGIC |
| 10 | Trình chiếu | **PASS** | Thư viện hồ sơ + template thật, tab BOQ/Bảng thống kê |
| 11 | Về Home → resume lại | **PASS** | Thẻ việc-đang-dở cập nhật đúng chặng vừa rời |

⭐ Điểm sáng đáng ghi: **lớp LUẬT từ chối nói dối**. Chưa mở tờ nào thì nó ghi thẳng
*"Không có gì được kiểm; đây không phải '0 vi phạm'"*. Đây đúng tinh thần chống-fake-success.
Tương tự, `LibraryDropBridge` khi không khớp kho **không thả hình bừa** mà báo
*"Chưa có hình vẽ cho 'Cửa 1 cánh 800' — kho block chưa có món này. Dùng panel Nội thất…"*.

---

## ③ LỖI TÌM ĐƯỢC

### ĐÃ SỬA (trong vùng sở hữu)

**BUG-D1 · P1 · chỉ dẫn sai — `components/cad/CadEditor.tsx:823`**
Bàn vẽ trống dạy sai lệnh: *"Gõ **L** để vẽ **tường**"* / *"Type **L** to draw a **wall**"*.
Đo tại nguồn: `L` = `cad.draw.line` → "Đường thẳng" (`lib/commands/registry.ts:258`); tường là
`W`/`WALL` (`registry.ts:274`, nhãn "Tường (W 200)"). Câu chỉ dẫn **đầu tiên** người dùng thấy là sai
ở cả hai ngôn ngữ. → sửa `L` → `W` (khớp luôn thanh trạng thái vốn đã quảng cáo `W 200`), kèm
chú thích chống sửa ngược.

**BUG-D2 · P0 · mất điểm vẽ im lặng — `components/cad/CadEditor.tsx:798`**
Lớp phủ empty-state phủ **trọn** canvas (`inset:0`, `zIndex:5`) và `onPointerDown` của nó **chỉ tự
đóng, không chuyển tiếp** cú chạm. Nên khi người dùng làm **đúng** lời app dặn — gõ `W`, click 2
điểm, Enter — cú click **đầu tiên bị nuốt**, chuỗi tường còn 1 điểm, **không có gì được vẽ và
không báo lỗi**. Tái hiện 2/2 lần trên máy sạch.
→ Sửa: lớp phủ chỉ còn hiện khi `cadTool === 'select'`; bật công cụ vẽ là nó ẩn, cú chạm đầu rơi
thẳng vào canvas. Đã nghiệm thu trên app: sau sửa, đúng chuỗi thao tác đó ra tường **ngay lần đầu**.

**BUG-D3 · P1 · lý do nút mờ không tới người dùng — `components/render-studio/Command3DPanel.tsx:426`**
12 nút lệnh 3D (Floor · Roof · Door · Window · Stair · Ceiling · Cabinet · Extrude · Bevel ·
Boolean · Revolve · Loft) dùng `disabled` **thật**, `aria-disabled=null`, `aria-describedby=NONE`.
Lý do vốn **đã được viết sẵn rất tử tế** trong `CellDef.reason` (vi/en) nhưng chỉ đi qua `Tooltip`
hover ⇒ Tab **bỏ qua** nút, `focus` không bắn, cảm ứng thì câm ⇒ lý do **không bao giờ** tới người
dùng bàn phím/trình đọc màn hình. Đây đúng bệnh mà `ToolbarChip` đã chữa 16/08 nhưng
`Command3DPanel` **chưa được migrate**.
→ Sửa theo đúng khuôn nhà đã có (`components/ui/ToolbarChip.tsx:33-35,156-180`): `aria-disabled` +
`aria-describedby` trỏ phần tử ẩn `.if-tooltip-a11y`; `onClick` vẫn chỉ gắn khi `lam` nên nút
**không** chạy gì. `useId()` đặt ở cấp component (`CreateTab`), không gọi trong vòng lặp `cell`.
Nghiệm thu trên app: cả 12 nút nay `aria-disabled=true` + lý do đọc được; `Floor` **focus được**.

### CHƯA SỬA — cần MAIN giao đúng owner

**BUG-D4 · P1 · lựa chọn ma sau Undo — `components/studio/CadStageScreen.tsx` + `lib/cad/store.ts`** *(vùng `components/studio/**` — không thuộc quyền ghi của tôi)*
Tái hiện (2/2 lần, có cả trên máy sạch sau reload): mở 2D → vẽ 1 tường → `⌘A` (chọn 2) → `⌘Z`.
Kết quả: bản vẽ **rỗng** (empty-state quay lại) nhưng Inspector **vẫn mở** và tiêu đề vẫn ghi
**"2 đối tượng"** — tức `selection` còn giữ id của entity **đã bị xoá**. Trái chốt
"inspector chỉ hiện khi có chọn", và nguy hiểm hơn: panel BIM·IFC lúc đó vẫn cho gán Tầng/Loại IFC
cho vật không còn tồn tại.
Đã loại trừ: **không** phải lỗi render — Inspector bám state sống (bấm `⌘A` lần nữa trên bản vẽ
rỗng thì tiêu đề biến mất, `inspector:false`). Và `undo()` **có** đặt `selection: []`
(`lib/cad/store.ts:534`), `redo()` cũng vậy (`:541`). ⇒ **có thứ gì đó nạp lại `selection` SAU khi
undo chạy** — cơ chế chính xác **tôi chưa chứng minh được**, không đoán bừa.
*Tái hiện:* `/projects/<id>/cad` → `W`,Enter → click (420,150),(650,150) → Enter → `⌘A` → `⌘Z` →
đọc `document.querySelectorAll('h2')`.

**BUG-D5 · P1 · ảnh vỡ trên Home — `components/home/widgets/WeeklyImage.tsx:47`** *(LANE C)*
`<img>` không có `onError`/ảnh lùi. Tài sản `cmt0e1ykl000hw9jaujzoem14` trả **410 Gone** ⇒ widget
"Ảnh đẹp tuần này" hiện **biểu tượng ảnh vỡ**. Sinh **12 lỗi đỏ console** mỗi lần tải Home. Lỗi
xuất hiện gián đoạn vì carousel xoay qua ảnh chết mới vỡ.
*Tái hiện:* mở `/`, chờ carousel tới ảnh đó; hoặc `curl -i http://localhost:3001/api/library/cmt0e1ykl000hw9jaujzoem14/file`.
Hai nửa: dữ liệu chết (LANE B) + thiếu ảnh lùi (LANE C).

**BUG-D6 · P2 · nút mờ không lý do — `components/home/widgets/QuickNotes.tsx:171-172`** *(LANE C)*
Nút "Lưu" dùng `disabled` thật, **không** `aria-describedby`, **không** lý do (trái luật §9 mà rail
và dock 2D đều tuân đúng). Kèm `disabled:opacity-40` gõ cứng thay vì token `--mo-vo-hieu` (chốt 16/08).

**BUG-D7 · P2 · trùng key React — `components/library/ClusterPanel.tsx:239`** *(LANE C)*
`Warning: Encountered two children with the same key … "Số chỗ"` (qua `Checkpoint.tsx:78`), lặp 3
lần. React cảnh báo có thể nhân đôi/bỏ sót phần tử.

**BUG-D8 · P2 · lý do đi sai đường — `components/render-studio/ToolDock3D.tsx:130,145,146,147`** *(vùng tôi, cố ý chưa sửa)*
Các nút mờ (`select-same`, `pushpull`, `fillet`, `cut`) mang lý do qua **`title`** — kênh mà chốt
16/08 đã kết luận là câm trên cảm ứng và trình đọc màn hình đọc không nhất quán. Cùng họ BUG-D3.
Chưa sửa vì đêm nay tôi đã chạm `Command3DPanel` và `CadEditor`; gộp thêm một file dock nữa vào
cùng lượt là mở rộng phạm vi quá mức khi chưa nghiệm thu được bằng bàn phím thật. Đề nghị làm lượt sau.

---

## ④ HỢP ĐỒNG TƯƠNG TÁC — bảng trạng thái

| Mục | 2D | 3D | Present / Home | Ghi chú |
|---|---|---|---|---|
| ⌘Z / ⌘⇧Z | ✅ | — | — | `CadCanvas.tsx:2477`; ⌘Y cũng nhận (Windows) |
| Esc | ✅ | — | — | Đóng gợi ý **và** xoá chữ gõ dở (`CadEditor.tsx:2723`) |
| Enter | ✅ | — | — | Chạy mục đang chọn trong dòng lệnh (`:2716`) |
| ⌘A | ✅ | — | — | Tự loại layer khoá/ẩn |
| Dòng lệnh + gõ-tiếp | ✅ | — | — | `L`→LINE/LEN/LENGTHEN, `W`→W/WIN/WALL/WINDOW |
| Nút mờ **có lý do** | ✅ | ✅ *(sau BUG-D3)* | rail ✅ · QuickNotes ❌ | |
| Lý do qua `aria-describedby` (không `title`) | ✅ | ⚠️ dock còn `title` (D8) | rail ✅ | |
| Inspector chỉ hiện khi có chọn | ⚠️ D4 | — | — | |
| focus-visible | ✅ | ✅ | ✅ | có `focus-visible:ring` trên rail và chip |
| Nhất quán sổ lệnh | ✅ | ✅ | — | Không thấy lệch nhãn/phím giữa các mặt hiện |

**Không tìm thấy** lệch phím giữa 2D/3D kiểu "Q/D/T" mà phiếu nghi ngờ: đo thực tế cho thấy
`lib/commands/registry.ts` đã là nguồn chung và `lib/cad/command-aliases.ts` khớp với nó
(`L`/`LINE`, `W`/`WALL`…). Việc hợp nhất B1 xem như đã có hiệu lực ở phần tôi chạm được.

---

## ⑤ NGHIỆM THU

- `npx tsc --noEmit` → **sạch** (chạy 2 lần: sau BUG-D1/D2, và sau BUG-D3).
- `npm test` → **exit 0, 0 fail** (toàn bộ suite).
- Browser thật cho **mọi** khẳng định: mỗi lỗi đều có ảnh/DOM trước–sau, không suy từ mã.
- ⛔ Không `git add/commit/push/stash/checkout/reset`. Không kill/restart server. Không đẻ server mới.

## ⑥ FILE ĐÃ SỬA

| File | Việc |
|---|---|
| `components/cad/CadEditor.tsx:823` | `L` → `W` trong câu dẫn bàn vẽ trống (BUG-D1) |
| `components/cad/CadEditor.tsx:798` | lớp phủ chỉ hiện khi `cadTool === 'select'` (BUG-D2) |
| `components/render-studio/Command3DPanel.tsx:26,382,426,447` | `useId`; `aria-disabled` + `aria-describedby` + phần tử ẩn mang lý do (BUG-D3) |

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- **`read_page` chết trên tab này** (`(empty page)`, viewport 0×0) suốt phiên ⇒ **không soi được cây
  a11y thật của trình duyệt**. Mọi kết luận trợ năng dựa trên **thuộc tính DOM** (`aria-disabled`,
  `aria-describedby`, `focus()`), **không** phải trên đầu ra trình đọc màn hình thật. Chưa thử
  VoiceOver.
- **Chưa đi Tab thật hết một vòng.** Với BUG-D3 tôi kiểm `focus()` bằng script + đọc `activeElement`;
  chưa bấm Tab tuần tự qua toàn panel để xác nhận thứ tự tiêu điểm hợp lý.
- **BUG-D4 chưa tìm ra cơ chế.** Đã chứng minh triệu chứng + loại trừ giả thuyết "lỗi render", nhưng
  **không** chỉ được ra dòng nào nạp lại `selection` sau `undo()`. Không đoán.
- **Cơ chế `L` vs `W` ban đầu tôi báo nhầm là lỗi Enter.** `key: "Return"` không tới React
  (`e.key === 'Enter'`); `key: "Enter"` thì chạy. **Enter không hỏng** — lỗi là ở tên phím tôi gửi.
  Ghi lại để phiên sau không đi báo lỗi ma.
- **Kéo-thả chuột từ Thư viện chưa kiểm được.** `left_click_drag` tổng hợp không sinh sự kiện kéo
  thật; đường thật đi qua `LIBRARY_INSTANTIATE_EVENT`. Tôi kích hoạt bằng cách bấm **đúng nút thật**
  ("Kéo ra bàn làm việc" / "Nhận 2 phần") qua `.click()` của DOM — vẫn là nút thật, **không** gọi API
  thay nút, nhưng **chưa** chứng minh thao tác kéo bằng chuột người dùng chạy được.
- **3D tải ~8 s** trên máy này (lần đầu trắng màn rồi mới hiện). Chưa đo lại nhiều lần, chưa tách
  phần do dev-mode/HMR ⇒ **không** kết luận là lỗi hiệu năng.
- **Toàn bộ đo trong `next dev`** (có HMR, StrictMode). Mỗi endpoint bị gọi **2 lần** trong nhật ký
  mạng — nhiều khả năng là StrictMode, tôi **chưa** xác nhận và **không** tính nó là lỗi.
- Một pha giữa phiên chạy trên cây đã HMR nhiều lượt; **mọi** lỗi báo ở trên đều đã **tái hiện lại
  sau khi tải mới hoàn toàn**, trừ điểm đã nói rõ ở BUG-D4.
- Danh sách nút mờ là kết quả quét **màn đang mở**, không phải toàn app; màn/panel chưa mở thì chưa soi.

## ⑦c HẠN DÙNG KẾT LUẬN

- Số dòng (`CadEditor.tsx:823/798`, `Command3DPanel.tsx:426`, `store.ts:534`) đúng tại `c7f3ac8`
  **cộng** 3 sửa đêm nay; ~163 file đang dirty của các phiên khác ⇒ **đo lại tại nguồn** trước khi tin.
- BUG-D5 phụ thuộc tài sản `cmt0e1ykl000hw9jaujzoem14` đang 410; nếu LANE B dọn dữ liệu thì triệu
  chứng biến mất **nhưng lỗ thiếu `onError` vẫn còn** — đừng đóng theo triệu chứng.
- Bảng ⓸ chỉ phản ánh các màn tôi mở được đêm nay (Home · 2D · Thư viện · 3D · Review · Present).
