# P-G · Ô GIẢI NGHĨA CÓ HÌNH + TRỤC PHẢI VÀO BỘ NỀN — báo cáo 16/08

> Phiếu: `docs/phieu-giao/P-G-o-giai-nghia.md` · vai: phiên phụ cấp CHẶNG/LUỒNG, vùng
> `components/ui` + `docs/mocks` · khuôn 6 phần theo `docs/CLAUDE.md`.

---

## 1 · TỔNG QUAN

Ô giải nghĩa nay mọc thêm **ô HÌNH** (tiêu đề → hình → chữ), có **kho 6 hình thao tác** vẽ bằng
SVG `currentColor`, và **nút mờ thôi đi vòng qua Tooltip** — lý do nay đi đường
`aria-disabled` + `aria-describedby` thay cho `title`. Bản vẽ `docs/mocks/mock-o-giai-nghia.html`
dựng đủ 5 mục, chạy được cả 2 theme ở 1440×900.

**Cả 5 việc V1–V5 xong.** `tsc` 0 lỗi · test vùng mình 0 fail · `soi:tu-dien` 0 lệch ·
`soi:hinh-hoc` và `soi:thao-tac` **không thêm lệch mới** (nợ cũ nguyên si: 31 focus-visible ·
193 hex). Vòng tự đóng ⑥b **đạt ở vòng 3/5**.

Ba thứ đáng chú ý hơn cả phần code:
- 🔴 **Tiền đề ⓪ #2 đúng, nhưng CẠM BẪY KỸ THUẬT phiếu nêu thì SAI** — đo trên Chromium 151:
  `<button disabled>` **VẪN bắn** `mouseenter`/`pointer*`. Thứ giết lý do là **focus + Tab**,
  không phải chuột. Kết luận (dùng `aria-disabled`) không đổi, nhưng **lý do đổi hẳn** — và lý do
  mới mạnh hơn: đây là mất trắng kênh, không phải khó dùng.
- 🔴 **Phiếu trích SAI hai mã**: `[Đ1]` phải là **`[Đ2]`** (T đã tự sửa giữa lượt, tôi xác nhận
  bằng nguồn); và nguyên tắc chống lưng cho việc này là **NT-10**, không phải NT-8.
- 🟡 **Một lỗi trợ năng CỦA APP lộ ra khi đo, nằm ngoài phiếu**: nút mờ `opacity .5` chỉ đạt
  **2,54:1** ở theme SÁNG — dưới ngưỡng 3:1 mà chính đợt sửa 16/08 nhắm tới. Giữ nguyên theo lệnh
  phiếu, **báo T quyết**.

---

## 2 · CHI TIẾT TỪNG MỤC

### ⓪b TIỀN ĐỀ HẠ TẦNG — ĐẠT

```
$ git log --oneline -1
895fbaf docs(memory): nén ký ức phiên 16/08 — đợt giao diện, ~20 chốt hệ thống, 6 nợ bàn giao
$ git rev-list --count HEAD..main
0
```
Đứng đúng mốc, lệch 0 → làm tiếp. (Không chạy lệnh git nào khác trong cả phiên.)

### ⓪ TIỀN ĐỀ NGHIỆP VỤ — XÁC NHẬN CẢ BA, kèm một đính chính

| # | Kết luận | Bằng chứng |
|---|---|---|
| 1 | ✅ **ĐÚNG** | `Tooltip.tsx` đã có `label:41` · `desc:48` · `shortcut:50` · `side:60`; `rich` bật khi có `desc\|\|shortcut`. Việc thật đúng là thêm ô hình, không dựng cơ chế thứ hai. |
| 2 | ✅ **ĐÚNG từng chữ** | `ToolbarChip.tsx:137` `if (disabled) return button;` · `:124` `title={disabled ? disabledReason : undefined}` — nút mờ là ca DUY NHẤT đi vòng qua Tooltip. |
| 3 | ✅ **ĐÚNG**, và repo tự khai điều đó | `Tooltip.tsx:46` *"`title=` … KHÔNG bao giờ hiện trên cảm ứng"* · `:179` *"§0c mảng 3: `title=` không bao giờ hiện trên iPad"*. Đo bổ sung ở mục V3. |

🔧 **ĐÍNH CHÍNH ô ⑤ — mã điều khoản.** Mở `docs/TRIET-LY-IF.md` trích nguyên văn:
- `:32` **[T5] CON NGƯỜI QUYẾT CUỐI — PIPELINE HUMAN-IN-LOOP** — *"AI hai vai (sản xuất/tham vấn)
  nhưng đích đến LUÔN sửa được; máy trình PHIẾU người duyệt; sửa tay không bao giờ bị đè; undo
  trước hỏi sau; **không nút giả, không hộp đen một chiều**."* → phiếu ghi ĐÚNG.
- `:60` **[N2] ĐƠN GIẢN NGOÀI · SÂU TRONG · SỨC SÂU HỌC TỪ NGHỀ** — *"mặc định đơn giản cho mọi
  level … chiều sâu không mất mà COLLAPSE sau phân loại rõ"* → phiếu ghi ĐÚNG.
- `:70` **[Đ1]** = *"Tầng sau phải là hệ quả tầng trước"* — **KHÔNG phải** nhìn-vào-trong-trước.
  `:72` **[Đ2] NHÌN VÀO TRONG TRƯỚC:** *"mọi bảng plan có cột 'NỘI LỰC ĐÃ CÓ' — IF có gì rồi mới
  chốt build mới; build = ưu tiên chưng cất/nối dây, **không sáng tác trùng**."*
  ⇒ nguyên tắc "mở rộng Tooltip có sẵn, cấm cơ chế thứ hai" là **[Đ2]**. T đã sửa phiếu giữa lượt;
  tôi chưa kịp ghi `[Đ1]` vào file nào nên không phải sửa ngược.

🔧 **ĐÍNH CHÍNH THỨ HAI — nguyên tắc giao diện chống lưng.** Phiếu ô ② dẫn **NT-8 + NT-16**. Mở
`docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md`:
- `:119` **NT-8** = *"Ngôn ngữ 'bản vẽ kỹ thuật' cho chrome lẫn output: nhãn mono uppercase mép,
  chi tiết đánh số, hairline/dot-grid, crop-mark"* — **không phải** "icon luôn có nhãn".
- `:121` **NT-10** = *"**Học bằng hình: lệnh dựng có minh hoạ trước→sau**; phím tắt hiện cạnh lệnh,
  một registry cho tooltip/⌘K/bảng phím"* ← **đây mới là điều khoản của việc này**, và nó mô tả
  đúng từng vế của phiếu (hình minh hoạ · phím tắt cạnh lệnh · một sổ lệnh).
- `:127` NT-16 (kính có nấc giảm chói) không dính tới ô giải nghĩa — thẻ này **đặc**, không kính.
- Bảng lệch `:138` **L2** (*"đường bàn phím ≈ 0"*) là chỗ việc này trả nợ một phần.

### V1 — Ô giải nghĩa mọc ô HÌNH ✅

| Thay đổi | Chỗ |
|---|---|
| prop `hinh?: React.ReactNode` | `components/ui/Tooltip.tsx:63` |
| `rich` tính thêm `hinh` | `:240` |
| dựng theo thứ tự tiêu đề → **HÌNH** → chữ, `aria-hidden` | `:303-306` |
| cảnh báo lúc phát triển: có `hinh` mà thiếu `desc` | `:241-245` |
| khuôn `.if-tooltip-hinh` 220×110 | `app/globals.css:1650-1665` |

Hai quyết định tự chọn, kèm lý do:
1. **`hinh` KHÔNG tự do đứng một mình** — thiếu `desc` thì `console.warn`. Hình `aria-hidden`, nên
   bỏ chữ là cắt trắng kênh của người dùng trình đọc màn hình. Cảnh báo thay vì im lặng.
2. **KHÔNG nới `max-width` của `.if-tooltip-rich`** — hình 220 + đệm 10×2 = **240 ≤ 260**, vừa khít.
   Nới là đụng ~90 chỗ tooltip đang dùng, không đáng.
3. Ô hình bo **4px** = `max(4, 10 − 10)` theo §2d (thẻ ngoài `--radius-sm` = 10, đệm ngang 10) —
   số là hệ quả của hình ngoài, không tự chọn cho đẹp.

### V2 — Kho hình thao tác ✅

`lib/ui/thao-tac-glyph.tsx` (mới) + `lib/ui/thao-tac-glyph.test.ts` (mới).
Đủ **6 hình**: `doi · xoay · chep · lat · do · chon`, cùng viewBox `0 0 220 110`, nét 1.4 (chính)
/ 1 (phụ), chỉ `currentColor`, SVG inline, `aria-hidden` + `focusable="false"`.

**Ràng buộc phạm vi ghi thành chữ ở đầu file** (và test khoá lại bằng grep nguồn):
*"⛔ CẤM DÙNG CÁC SVG NÀY LÀM NÚT … nó **chỉ sống trong ô giải nghĩa**"* — loại **Hình minh hoạ**
trong bảng sáu loại icon (00-CHOT 16/08).

Test 40 mục, chạy render THẬT (`renderToStaticMarkup`), không đọc chuỗi:
```
✅ thao-tac-glyph: tất cả đạt
```
Kiểm: 6 hình ra `<svg>` thật · 0 hex/rgb/hsl · có `currentColor` · cùng viewBox · `aria-hidden` +
`focusable="false"` · **id marker mũi tên không trùng nhau** (nhiều tooltip cùng nằm trong DOM thì
id trùng là hình này ăn định nghĩa hình kia) · nguồn mang đủ 3 câu cấm.

⚠️ **Một chỗ phải thêm import ngoài dự tính**: `import React from 'react'` (`:31`). Next.js không
cần (jsx: preserve), nhưng `sucrase-node` dịch JSX lối CỔ ĐIỂN nên thiếu import là ném
`React is not defined` **lúc render** trong khi **tsc vẫn xanh**. Ghi lý do ngay tại chỗ import để
phiên sau không "dọn cho gọn" rồi làm hỏng test.

### V3 — Nút mờ đi ĐÚNG đường ✅ (việc nặng nhất)

**Trước hết là ĐO, không nhớ** — phiếu ô ⑦b yêu cầu đúng điều này. Dựng trang thử, chạy Chromium
**151.0.7922.34** qua playwright (đã có sẵn trong `node_modules`, **không dựng dev server**), dùng
chuột thật (`mouse.move/down/up`) và bàn phím thật (`Tab`), không `dispatchEvent` giả:

```
hover_click_A  (<button disabled>)      : pointerover, pointerenter, mouseover, MOUSEENTER,
                                          pointerdown        ← KHÔNG có focus, KHÔNG có click
hover_click_B  (aria-disabled="true")   : … + focus + click
tabOrder_from_before                    : ["bB", "after", "BODY"]     ← nút disabled BỊ BỎ QUA
scriptFocus                             : focusable_disabled_attr=false, focusable_aria=true
hitTest                                 : cả hai đều nhận con trỏ
```

🔴 **Cạm bẫy phiếu nêu KHÔNG tái hiện được**: phiếu ngờ *"`<button disabled>` không bắn
`mouseenter`/`pointer` ở một số trình duyệt"*. Trên Chromium 151 nó **bắn đủ**. Nên nếu chỉ xét
chuột thì nút mờ bọc Tooltip đã chạy được mà **không cần** đổi `disabled`.

✅ **Nhưng kết luận vẫn là `aria-disabled`, vì lý do khác và nặng hơn**: `disabled` **gạt nút khỏi
thứ tự Tab** và **chặn hẳn `focus`**. Người dùng bàn phím / trình đọc màn hình **không có đường
nào** tới được lý do — đây là **mất trắng một kênh**, không phải "khó đọc". Trái [T5] *"không hộp
đen một chiều"*.

Thay đổi (`components/ui/ToolbarChip.tsx`):
| | Trước | Sau |
|---|---|---|
| chặn nút | `disabled={disabled}` `:122` | `aria-disabled={disabled \|\| undefined}` `:150` |
| lý do | `title=…` `:124` | `aria-describedby` `:151` → span ẩn `:172-176` (`.if-tooltip-a11y`) |
| tooltip | `if (disabled) return button;` `:137` | bỏ hẳn — nút mờ đi CÙNG đường, `desc` = `disabledReason` `:170` |
| chặn chạy | — | không gắn `onClick` `:154` (bàn phím kích hoạt nút bằng chính sự kiện click) + `type="button"` |
| id ổn định | — | `useId()` `:87` (khớp server/client) |
| `opacity .5` + `cursor:not-allowed` | giữ | giữ (lệnh phiếu) |

**Nghiệm thu bằng CÂY TRỢ NĂNG THẬT** của Chromium (CDP `Accessibility.getPartialAXTree`, không
suy từ DOM), markup y hệt bản sau khi sửa:
```
thu_tu_Tab                        : ["moi", "sau", "BODY"]
nut_CU_co_trong_Tab               : false      ← bản disabled: bàn phím không tới được
nut_MOI_co_trong_Tab              : true
su_kien_nut_moi                   : ["MOI:mouseenter", "MOI:focus"]   ← Tooltip nghe đủ 2
a11y_nut_moi.vai_tro              : "button"
a11y_nut_moi.ten                  : "Lật đối xứng"
a11y_nut_moi.mo_ta                : "Chưa chọn vật nào. Chọn ít nhất một vật trên khung nhìn rồi mới lật được."
a11y_nut_moi.bi_chan              : [true]     ← aria-disabled được tôn trọng
so_lan_chay_sau_khi_bam_va_Enter  : 0          ← bấm chuột + Enter đều không chạy
```
⇒ đủ bốn điều: **tới được · thấy được · nghe được lý do · không chạy được**.

⚠️ **Hệ quả phải nói thẳng**: nút mờ nay **chiếm một chặng Tab**. Đó là chủ ý — "mờ" nghĩa
*chưa dùng được*, không phải *biến mất khỏi bàn phím*. Thanh 2D có ~10 chip; nếu nhiều lệnh cùng
mờ, người dùng bàn phím sẽ Tab qua chúng. Nếu Hoà thấy phiền, đường lùi rẻ: gom nhóm bằng
`aria-owns`/roving tabindex — **chưa làm, không nằm trong phiếu**.

Đã kiểm nơi gọi: `CadToolbar.tsx:291-292` · `ToolDock3D.tsx:251-252` · `present-editor/Toolbar.tsx:1001-1010`
(`IconOnly` truyền `disabledReason = title`) — **mọi nơi đều đã có lý do**, không nơi nào rơi vào
nhánh cảnh báo §9. Không có CSS nào bám `button:disabled` cho chip (`grep :disabled` = 1 kết quả,
`.dock-icon-btn`, không liên quan).

### V4 + V5 — Trục phải hai tầng & bản vẽ ✅

`docs/mocks/mock-o-giai-nghia.html`, dòng đầu `<!-- @dsCard group="Ô giải nghĩa" -->`.
Năm mục: ① giải phẫu 3 tầng · ② dùng được ↔ mờ có lý do (cạnh nhau) · ③ trục phải hai tầng
**Cơ bản / Nâng cao** · ④ `side=right` ↔ lật `left` · ⑤ kho 6 hình. Kèm mục ràng buộc đã tuân.

Đo trên Chromium 1440×900, deviceScaleFactor 2, **chụp cả hai theme**:
```
chong_lan   : []        ← không thẻ ghim nào đè lên chữ
tran_ngang  : false     ← ở 1440 và ở 720 (tương đương zoom 200%)
svg_thieu_aria_hidden : 0
co_focus_visible : { chip:true, lenh:true, tang:true, gat:true }
duong_Tab : ["Tối · Dark","Sáng · Light","Chép","Chọn","Đo","Lật đối xứng [MỜ]","Cơ bản","Nâng cao","Dời M"]
```
Đường Tab đi qua **"Lật đối xứng [MỜ]"** — bản vẽ tự chứng minh đúng điều V3 vừa sửa.

**Tự chấm (⑥b) — ba chỗ tương phản hụt, đã đo bằng số, sửa hai:**

| Chỗ | Trước | Sau | Ghi chú |
|---|---|---|---|
| phím tắt trong danh sách lệnh (`--t4`/`--field`) | 3,22 tối · **2,69 sáng** | **6,12 · 4,61** (`--t3`) | chữ 10px cần 4,5:1 — hụt cả 2 nền |
| nhãn mục · tiêu đề mục (`--t4`/`--panel`) | 3,65 · **2,86** | **7,36 · 4,90** (`--t3`) | như trên |
| nét "vật cũ" trong hình (opacity .45) | 4,25 · **2,74** | **5,82 · 3,62** (.55) | nền sáng nét gần như biến mất |

Đạt sẵn, không phải sửa: tiêu đề thẻ **17,95 / 14,47** · câu mô tả (opacity .78) **9,65 / 9,25** ·
nhãn trạng thái **14,41 / 11,91** · nét chính trong hình **17,95 / 14,47** · dòng lệnh **16,89 / 15,66**.

**Vùng chạm (2.5.5)**: desktop có 2 nút tầng cao 28px = đúng token `--row` của IF. Đã **chép khối
override cảm ứng của `globals.css`** vào bản vẽ (`--tap/--row/--gap` nở khi
`(hover:none) and (pointer:coarse)`); đo lại ở ngữ cảnh cảm ứng: `{"duoi_44":[], "row":"44px"}` —
**0 nút dưới 44px**. Không có khối này thì bản vẽ nói dối về cảm ứng.

`npm run check:mocks` — bản vẽ này **không xuất hiện** trong 76 file đỏ.

---

## 3 · TỔNG KẾT

Ba mảnh ghép thành một đường: **Tooltip** biết chứa hình → **kho hình** cấp nội dung cho nó →
**nút mờ** thôi bị cắt khỏi đường đó. Trước hôm nay, ba mảnh này hỏng theo kiểu bù nhau che mắt:
Tooltip đủ giàu nhưng không ai đưa hình vào; lý do nút mờ có tồn tại nhưng nằm trong `title` —
tức có mà như không trên cảm ứng và trên bàn phím. **Dựng ô giải nghĩa mà không sửa nhánh rẽ ở
`ToolbarChip:137` thì ca cần nó nhất vẫn không bao giờ thấy nó** — đây là điều phiếu nêu đúng và
là phần đáng giá nhất của lượt này.

Điều học được rộng hơn một tính năng: **"nút mờ kèm lý do" lâu nay được coi là đã làm xong** (§9
có luật, code có `disabledReason`, có cả `console.warn` bắt thiếu lý do). Máy soi không bắt được vì
lý do CÓ trong mã. Chỉ khi đo bằng bàn phím thật mới thấy nó không tới được người dùng. Đây đúng
là hạng lỗi mà `👁 mo-kem-ly-do` trong `soi:thao-tac` đang chờ mắt người.

---

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Được:**
- V3 nghiệm thu bằng **cây trợ năng thật**, không bằng suy luận — bốn điều kiện đều có số.
- Kho hình có test render thật; ràng buộc "cấm làm nút" được **khoá bằng test**, không chỉ bằng
  lời dặn trong docstring (lời dặn thì phiên sau đọc lướt là mất).
- Bắt được 3 lỗi tương phản trong chính bản vẽ mình vừa dựng, trước khi Hoà phải nhìn.
- Không thêm một lệch nào vào hai máy soi đang có nợ.

**Chưa được / rủi ro:**
- 🔴 **Chưa chạy trong app thật.** Không được dựng dev server, nên `ToolbarChip` mới chỉ qua `tsc`
  + đọc mã + một bản dựng lại markup y hệt. **Chưa thấy nó sống trong `CadToolbar`/`ToolDock3D`/
  `present-editor` thật.** Rủi ro còn lại: `useId()` sinh id có ký tự `:` — hợp lệ cho
  `aria-describedby` nhưng sẽ hỏng nếu chỗ nào đó đem id này nhét vào `querySelector`. Đã grep,
  hiện không nơi nào làm thế.
- 🟡 **Chỉ đo trên Chromium.** IF chạy Electron nên Chromium là nền chính, nhưng bản web thì
  Safari/Firefox chưa đo. Lịch sử cho thấy WebKit/Gecko từng **chặn** sự kiện chuột trên phần tử
  `disabled` — nếu đúng vậy thì bản cũ còn hỏng nặng hơn ở đó, tức đổi sang `aria-disabled` càng
  đúng. Nhưng đó là **suy luận, chưa đo**.
- 🟡 **Nút mờ chiếm chặng Tab** (nêu ở V3) — đánh đổi có chủ ý, chưa hỏi Hoà.
- 🟡 **Kho hình mới 6 cái.** Đủ chứng minh khuôn, chưa phủ hết bộ lệnh. Chưa có lệnh nào trong app
  thật truyền `hinh` — tức đường dây đã nối nhưng **chưa có dòng điện**; đây là việc của phiếu sau
  (nối vào `hotkey-registry` B2 khi toolbar đọc sổ lệnh chung, để mỗi lệnh khai hình đúng một chỗ).

**🟡 Việc ngoài phiếu, đo được, báo T quyết — KHÔNG tự sửa:**
1. **Nút mờ `opacity .5` không đạt 3:1 ở theme SÁNG.** Đo: `--t2` ở 50% trên `--panel` = **2,54:1**
   (theme tối 4,01:1). Đợt sửa 16/08 nâng .35 → .5 *"vì WCAG 1.4.11"* — con số đó **đúng cho nền
   tối, chưa đúng cho nền sáng**. Phiếu bảo giữ nguyên nên tôi giữ. Đường ra khi T mở phiếu: bỏ
   `opacity` cho nút mờ, đổi sang **màu chữ mờ có kiểm soát** (`--t3`/`--t4`) — vừa đạt ngưỡng vừa
   không kéo mờ cả viền lẫn nền theo.
2. **`npm test` bỏ sót worktree agent.** Bộ lọc `find` loại `*/.worktrees/*` nhưng **không loại**
   `*/.claude/worktrees/*` ⇒ suite hiện gom cả test của worktree agent khác. 4 test đỏ hôm nay đều
   ở đó (`.claude/worktrees/agent-a54fc5a8884c021bd/lib/server/*.test.ts`), lỗi
   `Environment variable not found: DATABASE_URL` — **đúng nợ cũ 08/08** *"gốc rễ Prisma không tự
   nạp .env trong worktree"*, **không dính gì tới lượt này**. Hệ quả thật: `npm test` **luôn exit 1**
   khi có agent đang chạy song song, tức cửa kiểm mất tác dụng đúng lúc cần nhất. Sửa 1 ký tự
   trong `package.json` — ngoài vùng của tôi.
3. **`.tag`/`h2` trong `docs/mocks/mock-bo-nen-chung.html` cũng dùng `--t4`** cho chữ nhỏ (cùng
   ca 2,86:1 tôi vừa sửa ở bản của mình). Không đụng file của người khác; bản vẽ của tôi vì thế
   **lệch nhẹ so với bộ nền** ở đúng một chỗ, và lệch theo hướng đọc được hơn.

---

## 5 · HAI HƯỚNG TIẾP THEO

**Hướng A — nối dây ngay: cho lệnh thật khai hình.**
Thêm `hinh` vào các lệnh của `CadToolbar`/`ToolDock3D`, dựng thêm hình cho các lệnh dựng khối
(Extrude · Boolean · Array · Bevel…).
· *Được*: Hoà thấy ngay giá trị trên app thật, không phải nhìn bản vẽ.
· *Mất*: mỗi toolbar tự khai hình ⇒ **đúng bệnh 5 sổ lệnh song song** mà ticket kiến-trúc-lệnh
sinh ra để chữa. Làm bây giờ là đẻ chỗ thứ sáu phải dọn.

**Hướng B — chờ B2, khai hình MỘT chỗ trong `lib/commands/registry.ts`.**
Thêm `hinh` cạnh `icon` trong `CommandDef`; toolbar · ⌘K · bảng ⌘/ · trục phải cùng đọc ra.
· *Được*: một lệnh một hình, bốn mặt tiền không lệch nhau — đúng NT-10 *"một registry cho
tooltip/⌘K/bảng phím"*.
· *Mất*: phải chờ B2. Trong lúc chờ, ô giải nghĩa có hình mà **chưa lệnh nào dùng**.

**Hướng C (rẻ, chen được vào giữa)** — chưa nối lệnh nào, chỉ nối **trục phải** của một chặng để
Hoà duyệt mắt trên app thật thay vì trên bản vẽ. Nhưng trục phải là **biên liên chặng** — vượt vai
của tôi, phải T mở phiếu.

---

## 6 · ĐỀ XUẤT: **HƯỚNG B**, chen C nếu Hoà sốt ruột

Chọn B vì việc này sinh ra để **chữa** bệnh mỗi-nơi-khai-một-kiểu; khai hình rải rác ở 3 toolbar là
tự tay tái phạm đúng chứng bệnh mình đang chữa, và trả giá đúng chỗ [Đ2] cấm (*"không sáng tác
trùng"*). Cái giá của B là **chờ**, mà chờ thì không mất gì: kho hình + ô hình đã đứng sẵn, B2 nối
vào là chạy — công đã bỏ ra không hỏng đi trong lúc chờ.

Nếu Hoà cần thấy trên app thật trước B2 thì mở C (**một** chặng, **một** panel), tuyệt đối không
mở A — A là thứ khó gỡ nhất về sau.

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM

1. **Đo — không suy** (phiếu bắt buộc với V3): hành vi `<button disabled>` là **ĐO THẬT** trên
   Chromium 151 bằng chuột/bàn phím playwright. Kết quả nguyên văn dán ở mục V3.
2. **CHỈ đo Chromium.** Safari/Firefox **chưa đo** — không có sẵn trong `node_modules`. Suy luận
   (chưa kiểm): WebKit/Gecko từng chặn sự kiện chuột trên phần tử `disabled`; nếu đúng thì bản cũ
   hỏng nặng hơn ở đó và kết luận của tôi càng đúng — **nhưng đây là suy luận**.
3. **CHƯA chạy trong app thật.** `ToolbarChip` mới chỉ qua `tsc` + đọc mã + bản dựng lại markup.
   Chưa mở `/cad-editor` hay Present để nhìn chip mờ thật (phiếu cấm dựng dev server).
   ⇒ **Chỗ dễ lật kết luận nhất của cả lượt này.**
4. **`prefers-reduced-motion` chưa đo bằng máy** — bản vẽ có khối `@media` tắt mọi transition, và
   app thì `globals.css` đã phủ toàn cục từ trước; **tôi không chạy Chromium ở chế độ giảm chuyển
   động để xác nhận**.
5. **Trình đọc màn hình thật (VoiceOver/NVDA) chưa thử.** Tôi đọc **cây trợ năng Chromium** — đó là
   thứ trình đọc màn hình dựa vào, nhưng không thay được một lượt nghe thật.
6. **Hai nguồn mâu thuẫn, nêu cả hai, KHÔNG chọn hộ T** — nhãn mục nhỏ dùng `--t4` hay `--t3`:
   `docs/mocks/mock-bo-nen-chung.html` (bộ nền đang chờ Hoà duyệt) dùng **`--t4`**; đo được
   **2,86:1** ở theme sáng, dưới 4,5:1 cho chữ nhỏ. Bản vẽ của tôi dùng **`--t3`**. Hoặc bộ nền
   sửa theo tôi, hoặc tôi sửa theo bộ nền và chấp nhận chữ nhạt — **T quyết**.
7. **Chưa đọc**: `docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` (khuôn KB-1..5) — chỉ đọc bản NT-1..18.
   Nếu KB-5 có khuôn riêng cho lớp nổi/chú thích thì bản vẽ của tôi có thể phải nắn lại.
8. **Chưa đo**: ô giải nghĩa **có hình** đứng cạnh nút ở **sát mép dưới** màn hình. `Tooltip` kẹp
   dọc bằng `clampHorizontalOffset` cho mode `right/left`, nhưng thẻ nay **cao hơn hẳn** (thêm
   110px hình) — chưa dựng ca nút nằm ở đáy viewport để xem có bị cắt không.
   **Đây là rủi ro hồi quy cụ thể nhất, nên là việc đầu của phiếu sau.**
9. `soi:frontier` **chưa chạy** — phiếu không yêu cầu, và entry `o-giai-nghia-co-hinh` do T flip.

---

## ⑦c · HẠN DÙNG KẾT LUẬN

Kết luận trong báo cáo này **hết đúng khi**:

1. **Màu nhấn thứ hai được chốt** (mòng két — Hoà chưa chọn hex). Mọi số tương phản ở đây đo trên
   `--accent` tím `#6a57f5` hiện hành và bảng token 16/08. Đổi màu nhấn ⇒ **đo lại toàn bộ** vòng
   `focus-visible`, viền chip bật, `--accent-soft`.
2. **`hotkey-registry` B2 nối toolbar vào sổ lệnh chung.** Lúc đó `desc`/`shortcut`/`hinh` phải
   khai **trong registry**, không khai ở nơi gọi — đề xuất "hướng B" mục 6 thành việc thi công, và
   phần "mỗi toolbar tự truyền `desc`" trong `ToolbarChip` thành đường cũ.
3. **Bộ nền `mock-bo-nen-chung.html` được Hoà duyệt hoặc bác.** Duyệt ⇒ khớp lại `--t3`/`--t4`
   (mục ⑦b #6) và bảng token; bác ⇒ dựng lại token của bản vẽ này theo bộ nền mới.
4. **Nếu theme sáng đổi sang bản "canh theo Apple"** (nền trắng + xám ngả lam, đang đề xuất trong
   bộ nền): **mọi số cột "sáng"** trong báo cáo này hỏng — đặc biệt ba số tôi vừa sửa và con số
   2,54:1 của nút mờ, vì cả hai đều đo trên nền kem `#faf8f4`/`#f2efe9`.
5. **Nếu `opacity` của nút mờ bị đổi** (theo đề xuất mục 4.1) — số 2,54/4,01 hết hiệu lực và
   `.if-tooltip-a11y` vẫn đúng, nhưng phần "giữ nguyên opacity theo lệnh phiếu" thành lỗi thời.
6. **Nếu app thêm nền thứ ba** (Hoà đang bàn nền có ảnh + kính): thẻ ô giải nghĩa hiện là khối
   **đặc**, cố ý không kính — đúng luật *"kính là VỎ không là RUỘT"*. Nếu luật đó đổi thì phải xét
   lại, nhưng khi đó ngưỡng tương phản chữ trên thẻ sẽ **chạy theo ảnh nền** — đúng thứ luật a11y
   ngăn.

---

## Phụ lục · lệnh nghiệm thu, kết quả nguyên văn

```
$ npx tsc --noEmit                      → exit 0 (không dòng nào)

$ node_modules/.bin/sucrase-node lib/ui/thao-tac-glyph.test.ts
✅ thao-tac-glyph: tất cả đạt

$ node_modules/.bin/sucrase-node lib/ui/tooltip-position.test.ts
10 pass, 0 fail

$ npm run soi:tu-dien                   → ✅ 0 lệch định nghĩa

$ npm run soi:hinh-hoc
Đã quét 283 file · 998 khai báo radius · 10 ngoài thang (6 giá trị lẻ)
   (mốc trước lượt: 282 file · 997 khai báo · 10 ngoài thang — thêm 1 khai báo, KHÔNG thêm lệch)

$ npm run soi:thao-tac
🔴 2 LỆCH (trên 17 luật grep) · 👁 19 luật chờ mắt
   ↳ 31 file thiếu focus-visible   (mốc trước lượt: 31)
   ↳  1 file globals.css           (mốc trước lượt: 1)
   ↳ 193× hex trong inline style   (mốc trước lượt: 193)
   ⇒ KHÔNG thêm lệch mới.

$ npm run check:mocks                   → mock-o-giai-nghia.html không nằm trong 76 file đỏ

$ npm test                              → exit 1
   4 test đỏ, TẤT CẢ ở .claude/worktrees/agent-a54fc5a8884c021bd/lib/server/*.test.ts
   lý do: Environment variable not found: DATABASE_URL  (nợ cũ 08/08, worktree agent khác)
   Không file nào trong vùng P-G đỏ.
```

**Vòng tự đóng ⑥b — đạt ở vòng 3/5:**

| Vòng | Hỏng vì gì | Sửa |
|---|---|---|
| 1 | test kho hình ném `React is not defined` lúc render (sucrase dịch JSX lối cổ điển) | thêm `import React` + ghi lý do tại chỗ |
| 2 | thẻ ghim trong bản vẽ **đè lên chữ giải thích** (đo được 2 chỗ chồng lấn) | chừa chiều cao `.chodemo`; đưa phần chữ mục 3 lên trên, để trống chỗ cho thẻ |
| 3 | 3 chỗ tương phản hụt (2,69 · 2,86 · 2,74) | `--t4`→`--t3`; nét mờ .45→.55 · **đo lại: 0 chồng lấn, 0 tràn ngang, đạt cả 2 theme** |

*Chụp màn hình cả hai theme ở 1440×900 (deviceScaleFactor 2) đã dựng để T audit; bản vẽ mở trực
tiếp bằng `docs/mocks/mock-o-giai-nghia.html`, không cần máy chủ.*
