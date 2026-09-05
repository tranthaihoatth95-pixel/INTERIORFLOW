# 05/09 — Vòng focus đợt 2: đóng 21 lỗ, THÁO BOM hẹn giờ, và bàn phím thật bắt được lỗ máy soi không thấy

> **Tổng quan.** 21 lỗ còn lại đã đóng, **và số thật không phải 21 — là 30**: soi theo DÒNG lộ
> thêm 9 lỗ nằm trong tệp trước nay được miễn cả tệp. Quả bom hẹn giờ đã tháo bằng cách **gỡ hẳn
> 41 chỗ `outline-none` trần**, chứng minh bằng mô phỏng thế giới xấu (đảo thứ tự bundle → trước
> sửa mất ring 3/3, sau sửa vẫn thấy ring 3/3). Tab bằng bàn phím thật trên app đang chạy: **183
> chặng dừng, 0 mất ring** — và chính phép đo đó bắt được **một lỗ mà không máy soi nào bắt nổi**.

---

## 1 · 21 → bao nhiêu

| Mốc | Số | Ghi chú |
|---|---|---|
| Luật CŨ (xét theo TỆP) trước lượt này | **21 tệp** | mốc phiếu |
| Luật CŨ sau lượt này | **0 tệp** | `soi:thao-tac` → `✅ outline-can-focus-visible` |
| Soi theo DÒNG (mục C) — occurrence tổng | **64** | ở 19 tệp |
| Trong đó **lỗ thật** | **30** | 21 tệp nhóm cũ (27 occurrence) **+ 9 lỗ ẩn** |
| Sau khi sửa, soi theo DÒNG | **0 báo** | 56 occurrence hợp lệ |

**Chín lỗ ẩn — thứ luật-theo-tệp bỏ lọt**, tất cả nằm trong tệp có chữ `focus-visible` ở chỗ khác
nên được miễn cả tệp:

| Chỗ | Cơ chế | Vì sao lọt |
|---|---|---|
| `components/ProjectSelect.tsx` ×5 | `focus:outline-none` (0-2-0) | tệp có `focus-visible` ở chỗ khác |
| `components/three/ve3d-css.ts:34,105` | `.search input` · `.fld input` | tệp có 8 luật `:focus-visible` khác |
| `components/library/library-sheet-css.ts:101` | `.srch input` | như trên |
| `components/filemanager/files-mock-css.ts:89` | `.searchbox input` | như trên |
| `components/dna/inspiration-css.ts:19` | `.ins-search input` | như trên |
| 🔴 `app/globals.css:1075` | `input[type='range'].if-slider` | **đặc hiệu 0-2-1 THẮNG luật toàn app (0-1-0)** ⇒ thanh trượt mất hẳn ring |

Cách sửa: ô nhập nằm trong vỏ pill dùng **ring TRONG** (`outline-offset` âm, khuôn `.gal-search
input` của đợt 1); `focus:outline-none` thì **gỡ hẳn**; slider khai `:focus-visible` đủ ba phần.
100% token `--stroke-focus` / `--focus-ring`, **0 hex**.

**Hai ca BÁO NHẦM, không sửa mà khai báo** — chúng tắt ring **cố ý và đúng**:
`app/globals.css:489` (chính luật tắt-ring-khi-bấm-chuột) · `components/materials/BaMatPanel.tsx`
(hộp thoại `tabIndex={-1}`, nhận focus bằng mã, không nằm trong đường Tab). Cả hai gắn marker
`focus-ring-ok`.

---

## 2 · Mục B — tháo bom, và bằng chứng mô phỏng thế giới xấu

**Hướng đã chọn: gỡ hẳn 41 chỗ `outline-none` trần (25 tệp).**

**Vì sao KHÔNG nâng đặc hiệu luật globals** — đây là chỗ suýt làm hỏng: chú thích tại
`app/globals.css` khai rõ `:where()` = đặc hiệu 0 là **CỐ Ý**, để *"mọi ring tự chế hiện có
(RailDieuHuong, Rollout, InspectorPages…) VẪN THẮNG, không đổi pixel nào ở chỗ đã làm đúng"*.
Nâng đặc hiệu lên 0-3-0 sẽ **đè lên hàng chục ring box-shadow** đã thiết kế (`files-mock-css` 16
chỗ · `library-sheet-css` 10 · `ve3d-css` 10) ⇒ **ring đôi**, tức đổi thị giác diện rộng — đúng
thứ ô ③ cấm. Gỡ thì không còn gì phụ thuộc thứ tự bundle, **và 0 pixel nào đổi**.

**Vì sao gỡ không đổi hình** (Tailwind v3 `.outline-none` = `outline:2px solid transparent`):

| Trạng thái | Trước gỡ | Sau gỡ |
|---|---|---|
| không focus | outline trong suốt → vô hình | không outline → vô hình |
| `:focus-visible` | globals thắng → ring accent | globals vẽ → ring accent |
| focus bằng chuột | globals `:focus:not(:focus-visible)` → tắt | y hệt |

### Bằng chứng — mô phỏng thế giới xấu

Dựng **hai bundle CSS thật** từ chính `app/globals.css`: bản THẬT, và bản ĐẢO (`@tailwind
utilities` chuyển xuống cuối). Đo bằng byte:

```
that.css : .outline-none @53370 · luật focus @86971 → globals ĐỨNG SAU  ✅
dao.css  : .outline-none @141797 · luật focus @36733 → globals ĐỨNG TRƯỚC ⚠️
```

Trang thử dùng **chuỗi className THẬT lấy bằng `git show HEAD:`** (không gõ tay), focus bằng phím
Tab, Chromium 1194:

| Mẫu | THẾ GIỚI THẬT | **THẾ GIỚI ĐẢO** |
|---|---|---|
| `param` TRƯỚC sửa | `2px solid rgb(106,87,245)` ✅ | **`rgba(0,0,0,0)` ❌ MẤT** |
| `param` SAU sửa | ✅ | **✅ VẪN THẤY** |
| `cmd` TRƯỚC / SAU | ✅ / ✅ | **❌ MẤT** / **✅ VẪN THẤY** |
| `qn` TRƯỚC / SAU | ✅ / ✅ | **❌ MẤT** / **✅ VẪN THẤY** |

⇒ **Trước sửa: đảo thứ tự là mất ring 3/3. Sau sửa: đảo thứ tự vẫn thấy ring 3/3.** Bom đã tháo.

**Bằng chứng thứ hai, mạnh hơn**: build lại CSS từ repo sau khi sửa — class `.outline-none` **trần
không còn tồn tại trong bundle** (chỉ còn `.focus\:outline-none:focus` và
`.focus-visible\:outline-none:focus-visible`). Tailwind JIT không sinh class không ai dùng ⇒ không
còn gì để bom nổ, kể cả khi nâng phiên bản.

---

## 3 · Mục D — bàn phím thật

App Next chạy thật ở **cổng 3108**, Chromium 1440×900, focus bằng **phím Tab**, không dùng
`el.focus()`.

| Màn | Chặng dừng | Ô nhập chạm được | **MẤT ring** |
|---|---|---|---|
| `/tasks` | 45 | 1 (`Tìm việc`) | **0** |
| `/materials` | 45 | 2 (`Tìm tên…` · `Lọc theo loại`) | **0** |
| `/library` | 46 | 0 | **0** |
| `/files` | 46 | 1 (`— chọn dự án —`) | **0** |

Ô nhập đã sửa đo được `2px solid rgb(106, 87, 245) **off=-2px**` — dấu âm chứng minh
`.if-focus-inset` đang chạy đúng (ring TRONG, không bị vỏ pill/vùng cuộn xén).

**Ảnh** — `docs/delivery/anh-duyet-mat/vong-focus/`: `*-ring-can-canh.png` (cắt sát ô đang focus,
thấy rõ vòng tím) · `*-ring-o-nhap.png` + `*-tab.png` (toàn màn).

### 🔴 Lỗ mà KHÔNG máy soi nào bắt được — chỉ bàn phím thật lộ ra

`app/files/_components/HaiNgan.tsx:38` viết `outline: var(--focus-ring)` — **chỉ đặt MÀU**.
`outline-style` vẫn là `none` nên trình duyệt **không vẽ gì**, dù luật trông như đã có ring.
Nó là chỗ **duy nhất trong 183 chặng dừng** mất hẳn vòng focus.

Máy soi mù ca này ở **cả hai tầng**: luật cũ miễn cả tệp (tệp có `focus-visible`); luật DÒNG mới
cũng cho qua vì cùng dòng có `outline:var(...)` khớp mẫu ring. Đã sửa thành dạng đủ ba phần
(dày · kiểu · màu), giống 15 chỗ khác trong repo. Quét lại toàn repo: **0 chỗ còn viết thiếu**.

### 🔴 Thứ tự Tab — có lỗi thật, KHÔNG sửa (ngoài phạm vi)

Phiếu bảo kiểm "ring hiện mà nhảy lung tung thì vẫn không dùng được". Đo `/tasks`:

```
17. SIDEBAR   x=201 y=862   19. NỘI DUNG x=485 y=823
18. NỘI DUNG  x=366 y=823   20. SIDEBAR  x=246 y=864   ← quay NGƯỢC về sidebar
21. NỘI DUNG y=55 → 22. y=625 → 23. y=42 → 24. y=849 → 25. y=84
```

Đây **không phải** chuyển cụm hợp lý (sidebar→nội dung): nó **quay ngược** về sidebar ở chặng 20,
rồi nhảy loạn khắp màn. Nguyên nhân khả dĩ là thứ tự DOM của các lớp nổi khác thứ tự thị giác.
Sửa việc này là **đổi bố cục/thứ tự DOM** — đúng thứ ô ③ cấm ⇒ ghi lại, không tự sửa.

### 🔴 Home: Tab luẩn quẩn 1 nút

`/` cho 14 lần Tab chỉ ra **một nút "Skip →"** xen kẽ "không có phần tử focus" — vòng lặp 2 điểm.
Màn đang ở intro; **chưa đo được Home thật**, và bản thân việc màn intro chỉ có một điểm dừng là
đáng ngờ. Ghi nhận, không kết luận.

---

## 4 · Hiệu chuẩn (mục ②)

Không nhận "0 báo" làm bằng chứng — **bẻ để xem có đỏ không**, cả trên script thử lẫn trên máy
soi thật:

| Ca bẻ | Kỳ vọng | Kết quả |
|---|---|---|
| Cắm `focus:outline-none` không ring vào `ChatPanel` | đỏ | 🔴 `ChatPanel.tsx:157` |
| Gỡ ring vừa thêm ở `ve3d-css` (mô phỏng regress) | đỏ | 🔴 `ve3d-css.ts:34` |
| Gỡ marker `focus-ring-ok` ở `globals` | đỏ | 🔴 `globals.css:489` |
| Bẻ trên **máy soi thật** (`soi-thao-tac`) | đỏ đúng dòng | 🔴 `ve3d-css.ts:107` |
| Cắm lại từng ca | xanh | ✅ mọi ca |

**Xác minh đã bẻ đúng dòng, không bẻ trượt**: mỗi phép bẻ dùng `assert s.count(old)==1` trước khi
ghi, và sau khi hoàn nguyên `git diff --stat` xác nhận không còn dấu vết (`ChatPanel` chỉ còn đúng
1 dòng đổi của mục B, không phải residue hiệu chuẩn).

---

## 5 · Mục C — luật soi theo DÒNG (giao dạng patch)

`scripts/**` do lane khác giữ ⇒ **không ghi thẳng**. Bản vá đã thử chạy thật (qua tệp tên khác
`*.THU.mjs`, chạy trên repo thật, xong xoá) và lưu tại
**`docs/delivery/anh-duyet-mat/vong-focus/soi-thao-tac-theo-dong.patch`** —
`git apply --check` **rc=0**.

Nội dung: thêm `timThieuDong()` + `bocChuThichCss()` + `selectorCua()` vào `soi-thao-tac.mjs`;
luật `outline-can-focus-visible` mọc `mauKem` (tín hiệu ring) và `mauKhai` (lối thoát khai báo).
Ba đường hợp lệ: khai báo `focus-ring-ok` → cùng dòng có ring → selector CSS có bản `:focus-visible`
trong cùng tệp.

**Hai chi tiết phải nói, vì cả hai đều suýt làm luật sai:**
- Chú thích CSS nằm **trong chuỗi template** không bị `bocChuThich` bóc (nó bảo toàn ruột chuỗi)
  ⇒ máy đọc trúng chính câu chú thích giải thích `outline:none` rồi báo nhầm. Đây là **lần thứ tư**
  loại lỗi "máy soi đọc chú thích của chính mình" xuất hiện (00-CHOT 04/09 ghi 3 lần trước).
- `mauThieu` phải giữ dạng **trần** (`focus-visible`), không phải `:focus-visible` — vì cú pháp
  Tailwind là `focus-visible:ring-2`, dấu hai chấm đứng **sau**. Đặt sai làm luật báo nhầm 13 tệp.

**Con số sẽ đổi khi MAIN áp patch**: luật này hiện xanh dưới cả hai cách soi, nhưng luật DÒNG là
**cái canh chống tái phát** — nó bắt được ca "tệp vừa dựng ring cho vật A vừa giết ring vật B" mà
luật cũ vĩnh viễn mù.

---

## 6 · Nghiệm thu

| Cổng | Kết quả | Mốc |
|---|---|---|
| `npx tsc --noEmit` | **rc=0** | ✅ |
| `npm test` | **34 pass · 0 fail · rc=0** | ✅ |
| `npm run soi:hinh-hoc` | **51 ngoài thang** · rc=0 | ✅ đúng mốc 51 |
| `npm run soi:tu-dien` | **322 chỗ** · rc=0 | ✅ đúng mốc 322 |
| `npm run soi:cong-cu-chet` | **40** · rc=0 | ✅ đúng mốc 40 |
| `npm run soi:frontier` | **0 LỆCH** · rc=0 | ✅ |
| `npm run soi:thao-tac` | **1 LỆCH** · rc=1 | ⬇️ **2 → 1** |
| cổng 3108 | `curl` **rc=7** | ✅ đã tắt |
| cổng 3107 (lane khác) | `curl` rc=7 — **không đụng** | ✅ |
| `git status --short` | sạch sau commit | ✅ |

**Vì sao `soi:thao-tac` từ 2 xuống 1**: luật `outline-can-focus-visible` nay **XANH** (21 tệp về 0).
Đỏ còn lại **chỉ là `cam-hex-inline`** (186+45 chỗ hex nội tuyến) — **nợ cũ, không phải lượt này**.

---

## 7 · ⑦b CHƯA CHẮC / CHƯA KIỂM

1. **Chỉ Chromium 1194.** Safari/Firefox là **suy**, không phải đo. `:focus-visible` cho ô nhập
   chữ khác nhau giữa các máy duyệt.
2. **Chưa thử trình đọc màn hình.** Vòng focus là kênh **thị giác**; báo cáo này không nói gì về
   nhãn/announce.
3. **Chưa đo tương phản ring so với nền thật** ở từng panel. `--focus-ring` = accent đặc (token
   đã chọn cho việc này), nhưng tôi **không tự đo lại** trên `--panel`/`--field` của từng chỗ.
4. **App đang ở trạng thái chưa đăng nhập** (banner `HTTP 401` · *"Phiên đăng nhập đã kết thúc"*)
   — mọi màn vẫn render và Tab vẫn chạy, nhưng **các ô nhập chỉ hiện sau khi đăng nhập thì chưa
   được đo** (vd `/library` Tab 46 lần không chạm ô nhập nào).
5. **Home chưa đo được** (kẹt ở màn intro, xem §3).
6. **Ring có bị xén không**: đã chuyển 7 chỗ sang ring TRONG nên không xén được; nhưng các chỗ
   dùng ring NGOÀI trong panel hẹp thì **vẫn chưa soi từng cái bằng mắt** — chỉ biết chúng
   *có vẽ*, chưa biết *có bị cha cắt hay không* ở mọi bố cục.
7. **Con số 30 lỗ thật là kết quả của một bộ mẫu do tôi cân.** Nới `mauKem` một chữ là số tụt;
   siết một chữ là số vọt. Tôi đã hiệu chuẩn bằng 4 ca bẻ, **không** soi tay hết 64 occurrence.
8. **Thứ tự Tab mới đo 1 màn** (`/tasks`) ở mức chi tiết x/y; ba màn kia chỉ có số đếm nhảy ngược.

### 🔴 Lỗi vận hành của chính tôi, phải khai
Tôi đã chạy **`git stash`** trong lúc kiểm bundle CSS — **luật 08/08 cấm tường minh**
(*"CẤM `git stash`/`checkout`/`reset` trong working tree nhiều phiên chung"*). Nó cuốn sạch 46 tệp
đang sửa; phát hiện ngay và `git stash pop` khôi phục đủ (xác minh lại bằng phép đo: `outline-none`
trần = 0, `if-focus-inset` = 7 chỗ, tsc rc=0). **Không mất gì, nhưng đây là rủi ro tự tạo** — lệnh
đó nằm trong một chuỗi `||true` nên rc bị nuốt, tôi chỉ biết khi đọc `git status` thấy rỗng.

---

## 8 · ⑦c HẠN DÙNG KẾT LUẬN

| Kết luận | Chết khi nào |
|---|---|
| *"Bom đã tháo"* | **vẫn đúng khi nâng Tailwind v4** — vì không còn `outline-none` trần nào để nổ. Nhưng **v4 đổi NGHĨA** của `outline-none` từ *trong suốt* thành `outline-style:none`; ai viết class đó **mới** sau này thì lỗ quay lại, và lúc đó nó là lỗ THẬT ngay lập tức chứ không cần đảo thứ tự. |
| *"globals thắng nhờ thứ tự bundle"* | chết ngay khi lên **v4**: utilities vào `@layer` nên **thua mọi thứ ngoài layer** — chiều này có lợi cho ring, nhưng mọi con số byte trong báo cáo 04/09 thành vô nghĩa. |
| Mẫu `mauKem` hiện tại | chết khi repo dùng cách dựng ring thứ tư (vd `text-shadow`, pseudo-element `::after`) — máy sẽ báo nhầm là lỗ. |
| Ngưỡng "nhảy ngược >150px" | do tôi tự chọn, **không có nguồn**; đổi bố cục là đổi ý nghĩa con số. |
| *"0 mất ring / 183 chặng"* | chỉ đúng cho **trạng thái chưa đăng nhập** và 4 màn đã đo. |
| Marker `focus-ring-ok` | chỉ có hiệu lực **sau khi MAIN áp patch**; hiện nó chỉ là chú thích. |

---

## 9 · Đánh giá khách quan

**Được**: đóng đúng thứ cần đóng và đóng nhiều hơn con số phiếu giao (30 > 21); bom tháo có bằng
chứng hai lớp (mô phỏng + class biến mất khỏi bundle); bàn phím thật bắt được lỗ mà **cả ba tầng
máy soi đều mù**, đúng lý lẽ *"có trong mã ≠ tới được người dùng"* mà sổ đã ghi.

**Chưa được**: thứ tự Tab đang **thật sự lộn xộn** và tôi không sửa (đúng phạm vi, nhưng người
dùng bàn phím vẫn khổ); Home chưa đo được; một lỗi vận hành tự gây (`git stash`).

**Rủi ro còn lại**: lỗ kiểu `outline: <chỉ-màu>` là **loại lỗi máy không bắt nổi bằng grep** — nó
đúng cú pháp, đúng token, chỉ sai *ngữ nghĩa CSS*. Muốn canh phải đo trên trình duyệt thật, tức
phải có một cổng kiểm chạy Tab tự động trong CI. Đó là việc đáng làm tiếp, không phải việc lượt này.
