# P-R · HỘP CÔNG CỤ NỔI CẠNH VẬT ĐANG CHỌN — master tool thành công dân của canvas

> Khuôn §3 `docs/HOP-DONG-PHOI-HOP-T.md`. Tự chứa.
> **THẺ VAI [Đ4]:** phiên phụ cấp CHẶNG/LUỒNG, vùng `components/nodes` + `components/render-studio`.
> Chạm biên (đổi hợp đồng lệnh, đổi router, đổi schema) → **DỪNG + đề xuất lên T**.

---

## ⓪b TIỀN ĐỀ HẠ TẦNG
```bash
git log --oneline -1
git rev-list --count HEAD..main   # phải ra 0
```
Lệch > 0 → **DỪNG**, báo T. **Ba phiên phụ khác đang chạy** — chúng giữ `components/home/**`, `lib/resume.ts`, `components/studio/AppChrome.tsx`, `lib/wallpaper/**`, `components/wallpaper/**`, `DongStudioHome`, `LoginScreen`, `LockScreen`, `LockScreenSettings`, và `docs/mocks/mock-kich-ban-sidebar.html`. **Không đụng.**

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — xác nhận/bác bỏ từng ý (T đã đo, bạn đo lại)
1. *"`@xyflow/react` **v12.11.1 đã cài** và ship sẵn **`NodeToolbar` · `NodeResizer` · `EdgeToolbar`** (`node_modules/@xyflow/react/dist/esm/additional-components/`). `grep NodeToolbar|NodeResizer|EdgeToolbar` toàn repo = **0** ⇒ **có sẵn, chưa ai dùng.**"*
2. *"`components/render-studio/ToolWindow.tsx` hiện `position:fixed` · `zIndex 31` · `createPortal` **ra `document.body`** ⇒ nó **nổi TRÊN canvas, không THUỘC canvas**: không pan/zoom theo, **không có cổng vào/ra, không nối được gì**. Docstring `:16-19` tự thú: **1 window/lượt · KHÔNG kéo di chuyển · chưa nối subgraph**."*
3. *"`components/nodes/InteriorNode.tsx` đã render **2 `<Handle>`** (`:398`, `:418`) ⇒ **cổng nối đã có**, không phải xây."*

Bác ý nào → **DỪNG**, báo T kèm `file:dòng`.

## ① BỐI CẢNH — và một lời thú nhận của T

🔴 **Hoà đã yêu cầu việc này nhiều lần, T không hiểu và đi làm việc khác.** Bằng chứng nằm trong sổ:
- **01/08** `CHOT-RENDER-TOOL-WINDOW §1`: *"Tool window **LÀ subgraph node phóng to**"*
- **13/08** kiến trúc tool 3 lớp: *"master node = mini-tool cửa sổ to ôm nội dung"*
- **15/08** entry `master-tool-cong-dan-canvas`, nguyên văn Hoà: *"và thiếu linh hoạt, **nó phải thuộc môi trường canvas**. Cho phép **mở nhiều master tool để nối với** nhau, và **định nghĩa file = kết quả**."*
- **16/08** Hoà gửi 7 ảnh bàn-làm-việc-node: *"mỗi node là MỘT TOOL NHỎ có thông số riêng"*

Entry mở từ 15/08 tới nay **chưa thi công một dòng**, trong khi T mở sáu phiếu khác (vỏ nút toolbar · ô giải nghĩa · thanh tiến trình · từ điển · hình nền · router). **T đọc "tool" thành "thanh công cụ" trong khi Hoà nói "tool sống trên canvas".**

⇒ Phiếu này là **thứ đáng lẽ phải làm trước**. Đừng mở rộng phạm vi; làm cho **đúng và chạy được**.

## ② ĐỌC TRƯỚC
| File | Vì sao |
|---|---|
| `components/render-studio/ToolWindow.tsx` (đọc HẾT, cả docstring) | thứ phải thay bản chất — nó tự khai giới hạn, đọc kỹ |
| `components/nodes/InteriorNode.tsx` `:390-425` | `<Handle>` đã có, khuôn node hiện tại |
| `docs/00-CHOT.md` — mục **[15/08 MASTER TOOL LÀ CÔNG DÂN CỦA CANVAS]** | nguyên văn Hoà + T tự đính chính xếp hạng |
| `docs/00-CHOT.md` — mục **[13/08 KIẾN TRÚC TOOL 3 LỚP]** | ba tầng: thanh chung · gói tác vụ · master node |
| `docs/CHOT-RENDER-TOOL-WINDOW-2026-08-01.md` §1 | *"tool window = subgraph node phóng to"* — chốt gốc |
| tài liệu `NodeToolbar`/`NodeResizer` trong `node_modules/@xyflow/react/dist/esm/additional-components/` | API thật, đọc trước khi tự chế |

## ③ VÙNG FILE
**ĐƯỢC ghi:** `components/nodes/**` · `components/render-studio/ToolWindow.tsx` · tệp MỚI trong `components/render-studio/` hoặc `components/nodes/` · `lib/nodes/**` (chỉ nếu cần khai cổng ra) · `app/globals.css` (**CHỈ THÊM** class) · `docs/mocks/mock-tool-bam-vat.html` (mới) · `docs/bao-cao-phien/2026-08-16-P-R-tool-bam-vat.md` (mới).

**CẤM:** mọi thứ ba phiên kia đang giữ (liệt kê ở ⓪b) · `scripts/**` · `docs/00-CHOT.md` · mock nào đang có · `lib/commands/**` (sổ lệnh — biên).
**KHÔNG git. KHÔNG dev server.**

## ④ VIỆC

### V1 — Hộp công cụ NỔI CẠNH VẬT ĐANG CHỌN (marker: `hopCongCuBamVat`) 🔴 đây là món chính
Dùng **`NodeToolbar`** của `@xyflow/react` — nó **tự bám node, tự định vị, tự đi theo pan/zoom**. Đừng tự viết định vị.
- Hiện **khi node được chọn**, biến mất khi bỏ chọn.
- Chứa **lệnh dùng-liên-tục cho đúng loại node đó** — không phải toàn bộ menu. Ít mà đúng.
- Đặt **phía trên** node (mặc định `NodeToolbar`), không che thân node.
- Nút trong hộp dùng **`ToolbarChip`** đã có ([Đ2] — vỏ nút đã hợp nhất 3 chặng, cấm kiểu nút thứ tư).
- **Nút mờ phải kèm lý do** qua đường `aria-describedby` mà đợt trước vừa dựng — **đừng dùng `title`**.

### V2 — Master tool THUỘC canvas, không nổi trên canvas (marker: `masterToolTrongCanvas`) 🔴
Đổi bản chất `ToolWindow`: thôi `position:fixed` + portal ra `body`, chuyển thành **thân node phình ra tại chỗ**.
- **Ba nấc kích thước** (đúng nhịp ba nấc toàn app): **thu** = node thường · **vừa** = node phình ôm nội dung · **toàn màn** = tái dùng đường ≤7in đã có.
- **Nhiều master tool mở cùng lúc** = nhiều node cùng phình. Bỏ giới hạn 1-window.
- **Kéo di chuyển** = kéo node (xyflow lo sẵn). **Đổi cỡ** = `NodeResizer` (có sẵn).
- ⚠️ `ToolModeForm` hiện tự `position:absolute;inset:0` (viết cho màn toàn-màn cũ) — đọc kỹ cách `ToolWindow` đang bọc nó, **giữ nguyên `ToolModeForm`** nếu bọc được; phải sửa thì nói rõ vì sao.

### V3 — CỔNG RA = kết quả đã có định nghĩa (marker: `congRaDinhNghia`)
Nguyên văn Hoà: *"**định nghĩa file = kết quả**"*. Đọc là: đầu ra mỗi master tool là **một asset mang sẵn định nghĩa** (loại · vai trò · nguồn gốc), và **chính nó là đầu vào đã-định-nghĩa của tool kế**.
- Master tool phải có **cổng ra thật** (`<Handle>`) để nối sang node sau — đây là điều kiện để *"mở nhiều master tool để nối với nhau"* có nghĩa.
- Định nghĩa đi kèm kết quả **không đẻ khái niệm mới** — nối vào thứ đã có (`lib/nodes`). Nếu bạn thấy phải thêm trường mới, **DỪNG và đề xuất**, đừng tự thêm.
- ⚠️ Nếu đo ra hạ tầng chưa đủ để làm trọn V3 thì **làm phần làm được, khai thẳng phần chưa** — đừng giả vờ nối.

### V4 — Nút `+` trên sợi dây (marker: `chenBuocTrenDay`)
Entry `nut-cong-tren-day` đã mở 16/08, T xếp *"rẻ nhất, thấy ngay, và là điều kiện để chuỗi node dài dễ sửa"*. **`EdgeToolbar` có sẵn trong gói** ⇒ làm luôn trong phiếu này vì cùng họ.
Bấm `+` giữa hai node → chèn một bước vào giữa. Hiện IF phải: kéo node mới → nối lần 1 → xoá dây cũ → nối lần 2.
Làm được thì làm; đo ra tốn hơn dự tính thì **cắt và khai**, đừng để nó nuốt V1-V3.

### V5 — Bản vẽ (marker: `@dsCard`)
`docs/mocks/mock-tool-bam-vat.html`, dòng đầu `<!-- @dsCard group="Tool bám vật" -->`.
Bày: node **chưa chọn** ↔ **đang chọn có hộp công cụ** · master tool ở **cả ba nấc** · **hai master tool nối dây nhau** · nút `+` trên dây.
Đủ **2 theme** có nút gạt · **token thật** (⚠️ `--mat-*` **đã chết** → `--nen-mo-*`; đường kẻ mảnh là **`--vien-mo`**) · cấm hex ngoài khối khai token · 1440×900 không tràn ngang · tự chấm bằng `design:design-critique` + `design:accessibility-review`.
T đẩy lên Claude Design; bạn **không có** `DesignSync`.

## ⑤ RÀNG BUỘC
- **Kính là VỎ, ruột ĐẶC** — `ToolWindow` hiện đã làm đúng (vỏ kính, ruột sắc nét). **Giữ.**
- **Một tầng kính, không hai**; panel nổi phải portal (luật K4) — nhưng **thân node thì KHÔNG portal**, nó phải ở trong canvas. Hai luật này không mâu thuẫn: K4 nói về **panel nổi trên chrome**, đây là **vật trong canvas**.
- **Ba tầng ánh sáng không lẫn**: node được chọn (viền đứng yên) ≠ node đang chạy (viền chạy).
- **Bàn phím**: chọn node và gọi lệnh trong hộp công cụ phải làm được không cần chuột.
- **Song ngữ VI/EN**. Nhãn **≤ 12 từ**. `prefers-reduced-motion` thắng.
- **Trích mã điều khoản `docs/TRIET-LY-IF.md`** — **MỞ FILE ĐỌC SỐ, cấm nhớ hộ**: **[T2] một cỗ máy nhiều mặt tiền** (`:18`) · **[N2] đơn giản ngoài sâu trong** (`:~`) · **[Đ2] nhìn vào trong trước** (`:72`). Số T ghi sai thì **báo lại đúng số**.

## ⑥ NGHIỆM THU TỰ LÀM
```bash
npx tsc --noEmit
npm test
npm run soi:tu-dien
npm run soi:hinh-hoc
npm run soi:thao-tac
npm run soi:frontier
```

## ⑥b ĐIỀU KIỆN ĐÍCH — VÒNG TỰ ĐÓNG
**ĐÍCH:** `tsc` 0 · `npm test` **0 fail** · `soi:frontier` 0 lệch · `soi:hinh-hoc` **10** và `soi:thao-tac` **31+193** giữ mốc · `soi:tu-dien` không tăng phần đến từ tệp bạn (đếm theo tệp, đừng nhận nợ của người khác) · **`grep NodeToolbar` > 0** (chứng minh đã dùng thứ có sẵn thay vì tự chế) · `ToolWindow` **không còn `position:fixed`** cho nhánh trong-canvas · **mở được ≥2 master tool cùng lúc**, chứng minh được.
**VÒNG:** chưa đạt → tự sửa, **trần 5 vòng**. **QUÁ TRẦN → DỪNG**, nộp kèm bảng *"vòng nào hỏng vì gì"*. **CẤM** khai đạt khi chưa đạt.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-16-P-R-tool-bam-vat.md`, khuôn 6 phần `docs/CLAUDE.md`.

## ⑦b CHƯA CHẮC — bắt buộc, trống cũng ghi "không có"
Bắt buộc phủ: bạn có **chạy app thật** không (nếu không thì mọi kết luận về pan/zoom và định vị là **đọc mã**) · `ToolModeForm` bạn **bọc được** hay **phải sửa** · V3 phần nào **thật sự nối** và phần nào mới là **khung chờ** · V4 làm hay cắt, và vì sao · node loại nào bạn **chưa phủ**.

## ⑦c HẠN DÙNG KẾT LUẬN
*"Hết đúng khi …"* — ít nhất phủ: khi `hotkey-registry` B2 nối toolbar vào sổ lệnh chung (hộp công cụ phải đọc chung sổ, không tự khai lệnh) · khi kịch bản sidebar được chọn · khi màu nhấn thứ hai chốt.

## ⑧ DÂY MÁY
`master-tool-cong-dan-canvas` (**món chính**) · `nut-cong-tren-day` (V4) · `kien-truc-tool-3-lop` (tầng ③). Bạn **không** sửa registry — T flip sau audit.
