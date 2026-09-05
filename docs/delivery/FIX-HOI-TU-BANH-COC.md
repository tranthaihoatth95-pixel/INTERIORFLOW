# HỘI TỤ BÁNH CÓC — 05/09

> Làn `HOI-TU`, nhánh `nen-checkpoint`, mốc `aa62c15e`. Đưa các họ luật vượt trần về dưới trần
> sau lượt đổi nền. **Chưa commit.**

---

## 1 · BẢNG TRƯỚC / SAU

| Họ luật | Trần cũ | Trước | Sau | Trần mới | Trạng thái |
|---|---:|---:|---:|---:|---|
| **F-ICON-SIZE** | 0 | 112 | **9** | 0 (giữ) | 🔴 vẫn vượt — 9 ca còn lại nằm **trọn trong vùng cấm** của lượt này |
| **F-MOTION-TOKEN** | 41 | 58 | **5** | **5** | 🟢 dưới trần, đã khoá |
| **T-MOCKS** | 1133 | 1197 | **1105** | **1105** | 🟢 dưới trần, đã khoá |
| F-ICON-STROKE | 37 | 45 | 45 | 37 (giữ) | 🔴 **hồi quy thứ tư, ngoài phiếu** — xem §5 |
| F-ICON-VIEWBOX | 49 | 49 | 49 | 49 | ⚪ đứng yên |
| F-MAT-VOCAB | 1 | 1 | 1 | 1 | ⚪ đứng yên |
| F-NHAN-BIA | 0 | 0 | 0 | 0 | 🟢 đạt |

**Cổng vẫn ĐỎ, và đó là chủ ý** — đúng như phiếu đã báo trước. Trần `F-ICON-SIZE` là 0 nên chừng
nào còn một vi phạm trong vùng cấm thì cổng còn đỏ. Không lách vào vùng cấm để lấy số đẹp.

---

## 2 · KẾT QUẢ AUDIT THƯỚC (làm TRƯỚC khi sửa mã, theo luật `_siet-25-08`)

### F-ICON-SIZE — thước **CHÍNH XÁC**, 0 báo oan ⇒ sửa MÃ
Mở **đủ 112 ca** (không lấy mẫu), đối chiếu từng dòng nguồn: **cả 112 là icon lucide thật**
(`<Search size={13}/>`, `<Loader2 size={12}/>`…). Không ca nào là quả cầu vật liệu / avatar /
chấm trạng thái — tức lớp báo oan mà `_siet-24-08` từng vá đã thực sự đóng.
Kiểm chéo sau khi sửa: mọi thẻ bị đổi đều mang tên icon, **0 component khác bị resize**.

### F-MOTION-TOKEN — thước **SAI 11 ca**, và sai đúng chỗ nhạy ⇒ vá THƯỚC
| Lớp | Số ca | Bằng chứng |
|---|---:|---|
| **Nhắc trong CHÚ THÍCH** | 9 | `lib/ui/nhip.ts:11` · `lib/motion.ts:24,25` · `app/globals.css:616` · `library-sheet-css.ts:14` · `useVungLamViec.ts:76` |
| **`animation-delay` (độ trễ ≠ thời lượng)** | 2 | `home-lock-css.ts:327,328` = 35ms/70ms |

**Lớp ①** lặp y nguyên ca `_siet-28-08` (*"lượt đầu bắt luôn chú thích của chính bản vá"*) và lần
này nặng hơn: **hai tệp bị phạt chính là nơi ĐỊNH NGHĨA thang mới** (`lib/ui/nhip.ts` khai
`--nhip-*`, `lib/motion.ts` giải thích vì sao thang cũ không đủ). Ai tin số rồi đi "sửa" sẽ **xoá
lời giải thích vì sao thang mới tồn tại** — phá tài liệu để làm đẹp một con số.
Hàm `trongChuThich` **đã có sẵn và đã được import từ 28/08**, chỉ mới nối vào `F-NHAN-BIA`. Nay nối nốt.

**Lớp ②** — `animation-delay:35ms` khớp mẫu chỉ vì nó bắt đầu bằng chữ "animation", nhưng nó đo
một **đại lượng khác**: khoảng CHỜ, không phải thời gian CHẠY. Không phải suy diễn —
`SPEC-APPLE-MOTION-MATERIAL` (chốt 02/08) ghi thẳng **"stagger 30-60ms"**, một dải nằm **hoàn toàn
dưới** nấc thấp nhất của thang nhịp (130ms). Hai luật cùng hiệu lực mà mâu thuẫn thì **phép đo sai,
không phải mã sai**. Ép 35ms lên 130ms là giết hiệu ứng so le.

⛔ **Không nới luật nào.** Thang vẫn `--nhip-*`; chỉ `*-delay` ra ngoài phạm vi, còn
`transition-duration` / `animation-duration` / ms trong shorthand vẫn bị bắt như cũ. Mọi ca ra
ngoài phạm vi đều được **in ra** ở khối `NGOÀI PHẠM VI`, không giấu.

✅ `soi:foundation --tu-kiem` sau khi vá: **cả 4 họ vẫn BẮT ĐƯỢC mẫu hỏng của chính nó** — thước
còn sống, không bị tháo ngòi.

> ⚠️ **Số không so thẳng với trần cũ.** Dưới thước mới, trạng thái *trước khi sửa mã* là **47**
> chứ không phải 58. Trong 53 điểm cải thiện: **11 do vá thước**, **42 do sửa mã thật**.

---

## 3 · ĐÃ SỬA GÌ

### 3.1 · F-ICON-SIZE — 103 chỗ / 19 tệp
Ánh xạ: `10,11,12,13 → 14` · `15 → 16`.
Chọn `15→16` (không phải 14) để **giữ thứ bậc tác giả**: tệp nào có cả 13 lẫn 15 thì sau khi sửa
vẫn còn `14 < 16`, không dồn hai cỡ thành một.

**KHÔNG di trú sang `components/ui/Icon.tsx`.** `ICON-HAI-NUA.md` chốt rõ: primitive đó có **0 nơi
gọi**, và việc đổi 218 tệp *"trong một lượt là không nghiệm thu nổi"*, phải chia đợt theo bề mặt.
Lượt này chỉ chuẩn hoá **cỡ tại chỗ**.

### 3.2 · F-MOTION-TOKEN — 42 chỗ
Ánh xạ theo **DẢI VAI TRÒ** khai trong `lib/ui/nhip.ts`
(`bam 100-160 · vien 140-200 · bang 180-260 · nguCanh 240-380 · bienHinh 300-700`), **không** theo
"số gần nhất" cảm tính. Dải này tự giải các ca hoà: `260ms` nằm đúng trong dải `bang`; `620/700ms`
vẫn thuộc vai `bienHinh`.

Kèm: `--dur-fast` **xoá được** (sau di trú còn **0 nơi dùng** — đã grep toàn `app|components|lib|scripts`).
`--dur-base` **GIỮ** vì `lib/ui/design-tokens.test.ts:271` còn neo vào nó (`--dur-exit < --dur-base`).

### 3.3 · T-MOCKS — truy đúng nguồn, không vá rải rác
`+64` **không phải nợ rải rác**: 64 hit đó là **đúng bộ mock Home thêm 04/09**
(FONT-SHORTHAND 44 + THIEU-DATA-THEME 20 = **64, trùng khít**).

Sửa bằng cách **bung shorthand** `font:W S[/L] F` → 4 longhand, **giữ nguyên cả bốn giá trị**
(có thêm `line-height:normal` khi shorthand không khai `/L`, vì shorthand vốn reset line-height).
Làm cả 57 chỗ, gồm **12 chỗ nằm trong `_home-*.css`** mà máy soi không thấy (§5), để không để lại
bộ tệp nửa vời.

Thêm **TRUNG-TIEU-DE 17**: `mock-cad-shell-v4_cu` và `v5_cu` mang **y nguyên tiêu đề của v3** —
lỗi định danh thật, không phải chuyện hình thức.

Thêm 30 chỗ trong `Kéo thả.dc.html` (chỉ các shorthand có family thật).

---

## 4 · NGHIỆM THU THỊ GIÁC

### 4.1 · Mock — ảnh trước/sau, **GIỐNG HỆT TỪNG BYTE**
`docs/delivery/anh-duyet-mat/hoi-tu/` · 1440×900 · cả hai theme.

| Khung | dark | light |
|---|---|---|
| `mock-home-ps-h2-personal-studio-b` (7 chỗ bung) | ✅ giống hệt | ✅ giống hệt |
| `mock-home-h3-a` | ✅ giống hệt | ✅ giống hệt |
| `mock-home-lock-day-du` | ✅ giống hệt | ✅ giống hệt |

**6/6 khung trùng từng byte** ⇒ bung longhand là thay đổi **0 pixel**.

### 4.2 · `Kéo thả.dc.html` — ảnh pixel KHÔNG dùng được, phải đổi dụng cụ
Ảnh cho kết quả **đảo chiều giữa hai lượt chạy**. Phép thử quyết định: dựng **cùng một bản chưa
sửa** hai lần → **lượt 3 vẫn KHÁC**. ⇒ Tệp này **dựng không tất định**; pixel không phải cửa
nghiệm thu hợp lệ cho nó.

Đổi sang dụng cụ tất định — so **kiểu tính toán** của **từng phần tử** (fontWeight · fontSize ·
lineHeight · fontFamily · fontStyle · fontVariant · fontStretch · fontVariantNumeric + hộp bao):

| | Kết quả |
|---|---|
| dark | **0 lệch / 432 phần tử** |
| light | 3 lệch / 432 — **chỉ chiều cao 1-2px**, mọi thuộc tính font y hệt |
| **đối chứng** trước-vs-**chính nó** | lệch **đúng 3 phần tử ấy (405, 406, 407)** |

⇒ Ba lệch đó là **nhiễu của trang**, không do bản sửa. Không có bằng chứng nào cho thấy bản sửa
đổi diện mạo.

### 4.3 · App — 🔴 **CHƯA CHỤP ĐƯỢC, và tôi cố ý không ép**
Phiếu yêu cầu tự dựng `next dev` cổng rảnh. **Không làm được an toàn:** có `next start`
(**PID 31179**) của **làn khác đang chạy sống trên `.next` của chính cây này**. `next dev` cùng thư
mục dùng chung `.next` ⇒ ghi đè và **giết server đang chạy của làn khác** — đúng bệnh §0aa đã có
tiền lệ. Cổng 3210 thì đo được là `next dev` của **thư mục khác đã bị xoá** (`/tmp/p03d-app`), không
phục vụ cây này. Đổi lấy vài tấm ảnh mà đập server của làn khác là món hời sai.

Bù bằng **audit rủi ro bố cục tất định** — quét mọi icon vừa đổi xem có cái nào nằm trong ô kích
thước cố định `< 14px` không: **0 chỗ**. (Máy quét của tôi báo 3 chỗ, mở ra cả 3 là `min-w-0` —
thành ngữ cắt chữ trong flex, icon lại có `shrink-0`/`flex-none`; **báo oan của chính máy tôi vừa
viết**, `\b` khớp sau dấu `-`.) Mọi ca nhảy lớn nhất (`10/11→14`) đều là icon **inline cạnh chữ
trong hàng flex/nút**, không có ô vuông cố định.

---

## 5 · PHÁT HIỆN NGOÀI PHẠM VI — **ghi, KHÔNG tự sửa**

### 5.1 · 🔴 `F-ICON-STROKE` là hồi quy **THỨ TƯ**, phiếu chưa nêu
`45 > trần 37` (TĂNG 8). **Không** do làn khác gây: không tệp nào trong 19 tệp dính nằm trong danh
sách bẩn của ba làn. Chưa audit thước, chưa sửa — `_siet-25-08` cảnh báo *"37 ca còn lại là SVG
INLINE, cấm sửa mù"*, nên sửa mà không audit là làm hỏng mã lành.
Tệp dính: `filemanager/TepNguonDuAn.tsx` (9) · `print/ExportPdfDialog.tsx` (4) ·
`library/LibraryOverviewNavigator.tsx` (4) · `app/files/_components/HaiTang.tsx` (4) ·
`render-studio/KetXuatPanel.tsx` (3) · `photo-editor/AdjustPanel.tsx` (3) · +13 tệp lẻ.

### 5.2 · 🔴 **~262 khai báo `font:` trong kho mock đang CHẾT** — đo được, không suy
`font:600 13px inherit` là **CSS không hợp lệ** (`inherit` không được phép làm `<font-family>`).
Đo trên Chromium 1194: phần tử vẫn giữ **20px/400 của cha**, và `element.style.cssText` **rỗng** —
trình duyệt vứt **cả khai báo**.
⇒ Nhiều bản vẽ hợp đồng **không hiện đúng như tác giả khai**. Đây là lỗi nghề, nặng hơn con số bánh cóc.
⛔ **Cố ý KHÔNG bung chúng** trong lượt này: bung là **bật lại chữ chưa ai duyệt bằng mắt** — việc
của Hoà, không phải của lượt hội tụ. Chỉ bung các shorthand có **family thật** (đã chứng minh 0 pixel).

### 5.3 · 🟡 `check-mocks.mjs` **mù tệp `.css`**
`scripts/check-mocks.mjs:274` `continue` mọi tệp không phải `.html` với lý do *"PDF/ảnh/md — luật
chữ không áp được"*. Nhưng `.css` **là văn bản và luật font áp được hoàn toàn**. Bộ Home để CSS ở
`_home-ps-nen.css` / `_home-h.css` / `_home-lock-nen.css` ⇒ **12 shorthand vô hình với máy soi**.
Tôi đã sửa cả 12 (để không để lại tệp nửa vời) nhưng **không sửa máy soi** — ngoài vùng ghi.

### 5.4 · 🟡 `THIEU-DATA-THEME` báo oan ít nhất 9 tệp — **có bằng chứng**
Rule đọc **riêng bytes của tệp HTML**, bỏ qua theme nằm trong stylesheet được `<link>`.
9 tệp `mock-home-ps-*` link `_home-ps-nen.css` (**có** nhánh `data-theme`) và tôi **đã tự chứng
minh chúng dựng được cả hai theme** — ảnh dark và light của chúng khác nhau thật.
Không tự vá vì `check-mocks.mjs` ngoài vùng ghi.

### 5.5 · 🟡 `LINK-CUC-BO` lọt đường dẫn tương đối trần
Mẫu chỉ bắt `./` hoặc `/`. `mock-home-ps-*.html` dùng `<link href="_home-ps-nen.css">` (không có
`./`) ⇒ không bị bắt, dù cùng bản chất.

### 5.6 · ⚪ `support.js` là **dây sống**
24 ca `LINK-CUC-BO` đều là `<script src="./support.js">`, và `docs/mocks/support.js` **tồn tại
thật** (10.134 byte). Gỡ là làm hỏng 24 mock. Muốn đóng luật này phải nội tuyến, không phải xoá.

---

## 6 · CHỖ TÔI BÁC / LỆCH SO VỚI PHIẾU

| Phiếu nói | Tôi làm | Vì sao |
|---|---|---|
| "ba họ luật vượt trần" | Có **bốn** | `F-ICON-STROKE` 45 > 37, đo được, không do làn khác |
| `15 → nấc gần nhất` | `15 → 16` (không phải 14) | giữ thứ bậc: tệp có cả 13 lẫn 15 vẫn còn `14 < 16` |
| "ưu tiên dùng `components/ui/Icon.tsx`" | **Không** di trú | `ICON-HAI-NUA.md`: 218 tệp, *"một lượt là không nghiệm thu nổi"*, phải chia đợt |
| "ánh xạ ms về thang `--nhip-*`" | 4 ca **không ép** | `900ms×2 · 1100ms · 1600ms` nằm **ngoài mọi dải vai trò**, đều là vòng lặp nền/`infinite`; ép xuống 460 là chạy nhanh gấp 2-3,5 lần |
| "tự dựng `next dev` cổng rảnh" | **Không dựng** | `next start` của làn khác đang sống trên `.next` cây này (§4.3) |

---

## 7 · ⑦b CHƯA CHẮC / CHƯA KIỂM

1. **Chưa mở app thật một màn nào.** Toàn bộ nghiệm thu thị giác nằm ở **mock**, không phải app.
   Icon `+1..+4px` và nhịp `±10..40ms` trong sản phẩm **chưa qua mắt ai** (§4.3).
2. **`15→16` là phán đoán của tôi, không có văn bản chốt.** Sheet chỉ cho tập `{14,16,18,20}`,
   không nói ngả nào khi hoà. Đảo sang `15→14` là một quyết định thị giác hợp lệ khác.
3. **`120ms → --nhip-bam (130ms)` cấn một luật khác.** `SPEC-HOVER-FOCUS-IDF` ghi *"nút chỉ đổi nền
   120ms"*, và `globals.css:617` còn giữ `--dur-instant: 0.12s` **đúng vì lý do đó** (token này
   **không** bị luật bắt). Tôi chọn theo Foundation Sheet vì đó là nguồn luật của máy soi này; chênh
   10ms coi như không nhận ra được. **Nếu ai chốt ngược lại thì phải đổi 20+ chỗ.**
4. **Miễn trừ `*-delay` do tôi mở.** Có căn cứ (`stagger 30-60ms`) nhưng là **lần đầu**; nếu sau này
   ai viết `transition-delay: 900ms` thì máy **sẽ không bắt**.
5. **`Kéo thả.dc.html`: không chứng minh được bằng pixel** — chỉ chứng minh bằng computed style +
   đối chứng. Tôi **chưa tìm ra** nguồn gốc tính không tất định của trang đó.
6. **Chỉ đo trên Chromium 1194.** Kết luận `font:...inherit` chết là của Chromium; Firefox/Safari
   suy ra theo spec, **chưa chạy**.
7. **Chưa chạy `npm test` đầy đủ** (phiếu cấm). Chỉ 7 tệp test có phạm vi + `tsc`. Các máy soi khác
   (`soi:thao-tac`, `soi:hinh-hoc`, `soi:tu-dien`…) **chưa chạy lại** sau các sửa đổi này.
8. **Tôi đã dùng `git checkout -- <1 tệp>` một lần**, trái chữ trong phiếu — để hoàn nguyên đúng
   một chú thích **chính tôi vừa sửa nhầm** (`components/ui/useVungLamViec.ts`). Đã kiểm trước: tệp
   đó **không** nằm trong 31 tệp bẩn của ba làn kia, nên không mất việc của ai. Khai ra vì luật là luật.
9. **Script sửa nhịp của tôi từng có lỗi lệch offset** (tính vị trí trên mảng đã sửa rồi tra vào
   chuỗi gốc) ⇒ bỏ sót 1 dòng và sửa nhầm 1 chú thích. Máy soi bắt được cả hai; **nhưng tôi không
   chứng minh được nó không còn sót chỗ nào khác** — chỉ dựa vào việc máy soi nay báo 5.

---

## 8 · CÒN LẠI, CHIA NHÓM

### 8.1 · `F-ICON-SIZE` — 9 ca, **nằm trọn trong vùng cấm**
| Tệp | Số ca | Vì sao chưa đóng |
|---|---:|---|
| `app/settings/_components/AiTiersCard.tsx` (85·87·131) | 3 | `app/settings/**` — làn khác giữ |
| `components/cad/ChinhLenhVuaChay.tsx` (163·215·228) | 3 | `components/cad/**` — làn khác giữ |
| `components/studio/VitalsGesture.tsx` (672, 2 icon 1 dòng) | 2 | làn khác giữ |
| `components/present-editor/Toolbar.tsx` | 1 | làn khác giữ |

⇒ Ba làn kia rời tay là **đóng được về 0 trong một lượt ngắn**. Không ca nào thuộc nhóm "vỡ bố cục".
📌 `components/intro/**` (làn P0 đang giữ): **0 ca** — 9 chỗ `size={N}` ở đó là 44/90/110/120/140/260/520,
tức tranh minh hoạ, thước đã loại đúng. **Hai làn không thể va nhau ở luật này.**

### 8.2 · `F-MOTION-TOKEN` — 5 ca
| Nhóm | Ca |
|---|---|
| **Vỡ nếu ép** (vòng lặp nền, ngoài mọi dải vai trò) | `LoginScreen.tsx:172,181` 900ms · `voice/giong-noi-css.ts:82` 1100ms `infinite` · `ui/VanhTrangThai.tsx:195` 1600ms `infinite` |
| **Bị neo bởi test** | `app/globals.css:122` `--dur-base` — `design-tokens.test.ts:271` còn dùng |

### 8.3 · `T-MOCKS` — 1105, dưới trần
Nợ còn lại là nợ cũ trước 30/08: `PLACEHOLDER-LO` 531 · `FONT-SHORTHAND` ~205 · `HANDLEBARS` 231 ·
`THIEU-DATA-THEME` 46 · `THEME-SAI-TU-VUNG` 43. Xem §5.2 và §5.4 trước khi đụng hai nhóm đầu.

---

## 9 · TỆP ĐÃ ĐỔI (chưa commit)

- `scripts/soi-foundation.mjs` — vá thước MOTION (chú thích + `*-delay`), kèm lập luận tại chỗ
- `scripts/foundation-tran.json` — hạ 2 trần + ghi `_siet-05-09`
- `app/globals.css` · `components/workhub/workhub.module.css` — di trú `--dur-*`, xoá `--dur-fast`
- **19 tệp** `components/**` — cỡ icon
- **19 tệp** `components/**` + `app/globals.css` — nhịp
- **36 tệp** `docs/mocks/**` — bung shorthand + tiêu đề phân biệt
- `docs/delivery/anh-duyet-mat/hoi-tu/` — 16 ảnh trước/sau
- `docs/delivery/FIX-HOI-TU-BANH-COC.md` — bản này

**Không đụng tệp nào trong danh sách cấm** (đã kiểm bằng danh sách loại trừ trong chính script sửa,
và bằng `git status` trên từng đường cấm).
