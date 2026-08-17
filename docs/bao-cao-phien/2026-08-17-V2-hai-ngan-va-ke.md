# BÁO CÁO V2 — Files hai ngăn · Thư viện chia kệ · Màu là một bước

> Phiên phụ **V2** · 17/08 · cây chính (không worktree) · chạy song song V1 (`components/nav/**`,
> `AppShell.tsx`) và W (`scripts/`). Phiếu: `docs/phieu-giao/V2-hai-ngan-va-ke.md`.
> Nguồn cấu trúc: `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` (đọc toàn bộ trước khi làm).

---

## ⓪b TIỀN ĐỀ HẠ TẦNG — PASS

| Đo | Kết quả |
|---|---|
| `git log --oneline -1` | `bde99c4` |
| `git rev-list --count HEAD..main` | **0** |
| nhánh | `main`, đứng đúng HEAD |

Không tái diễn ca lệch-167-commit của 16/08.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — **XÁC NHẬN** (không bác)

Tiền đề phiếu: *"`app/colors/page.tsx` hiện là route riêng, lối vào duy nhất là một nút trong
`MaterialsScreen.tsx:181`"*. Kiểm bằng grep toàn repo, **đúng cả hai vế**:

- `app/colors/page.tsx:14-35` — trang thật, tự bọc `<AppShell active="render">`, có Navigator riêng.
- `grep -rn "/colors" app components lib scripts docs/mocks` → chỉ **một** nơi điều hướng tới nó:
  `components/materials/MaterialsScreen.tsx:181` `router.push('/colors')`. Mọi hit khác là
  `lib/colors/*` / `app/api/colors/*` (module, không phải lối vào).

---

## 1 · TỔNG QUAN

Ba việc đóng: **Files có hai ngăn khác bản chất** (mới, có lõi thuần + 25 test), **màu thành một
bước trong chọn vật liệu** (`/colors` đổi vai từ trang thành cửa dẫn đường), **Gallery nối vào ngăn
Ảnh**. Việc "Thư viện chia kệ" hoá ra **đã có sẵn từ 07/08** — tôi không dựng lại, chỉ gắn hai quan
hệ còn thiếu và báo lại sự thật đó. `tsc` 0 · `npm test` **exit 0** · hai máy soi **không thêm lệch**.

---

## 2 · CHI TIẾT

### 2.1 · Files hai ngăn — `[marker: filesHaiNgan]`

| Tệp | Vai |
|---|---|
| `app/files/_lib/ngan-tho.ts` (mới) | lõi **thuần**: định nghĩa *thô*, khoảng giá kho chung, nhãn hai ngăn |
| `app/files/_lib/ngan-tho.test.ts` (mới) | **25 khẳng định, 25 pass** |
| `app/files/_components/NganPhanTho.tsx` (mới) | ngăn ②: bày món thô + *thiếu gì* + *làm sao có* |
| `app/files/_components/HaiNgan.tsx` (mới) | vỏ hai ngăn (tablist, roving tabindex, nhớ lựa chọn) |
| `app/files/page.tsx` (sửa) | nối vào; `FileManagerShell` **không đổi một dòng** |

⭐ **Điểm đắt nhất: "thô" KHÔNG phải một cờ mới.** Nó đọc ra từ cỗ máy đã có —
`lib/materials/ba-mat.ts` (mặt `dung3d` chưa `du`). Món thêm đủ thông số thì **tự rời ngăn**, đi
tiếp `Files → cửa sổ công cụ → Thư viện` (`IF-KIEN-TRUC.md` §5). **0 trường DB mới, 0 cờ mới** —
một mặt tiền mới của cỗ máy cũ, đúng luật `CLAUDE.md`. `lib/materials/**` chỉ **ĐỌC**, không sửa dòng nào.

**Vì sao nó không phải một bộ lọc** (§3 hợp đồng cấm rút hai ngăn thành bộ lọc): mỗi ngăn khai
**AI THẤY** ngay dưới tên (*người trong dự án* ↔ *ai cũng thấy · nhiều người góp*). Bộ lọc không
bao giờ đổi tập người xem — đó là chỗ khác **bản chất**, và nó nằm trên mặt chứ không nằm trong tài liệu.

**Ca `chuaDu` là ca đắt và test canh riêng nó**: món có ảnh vân mà quên bước lặp vân **trông như đã
xong** nên không ai đi sửa (viên gạch 600mm render thành 3m). Lọc kiểu "có PBR là đủ" sẽ đánh rơi
đúng ca này; test `ca chuaDu … VẪN nằm trong ngăn thô` chặn cách lọc đó.

**Range giá — hai nửa không trộn.** Mọi số tính **chỉ** từ kho chung, chuỗi trả về mang sẵn chữ
*"khoảng trong kho chung"* (có test canh chữ đó), không đọc `boq-overrides`/giá chốt dự án.
⚠️ Khai thẳng: schema **không có** cột min/max (`dto.ts:29` `priceVnd` là một số) ⇒ "range" ở đây là
**khoảng đo được giữa các món cùng nhóm trong kho**, không phải khoảng nhà cung cấp báo. Nhóm không
món nào ghi giá ⇒ `null`, **cấm bịa `0–0 ₫`** (test canh).

### 2.2 · Thư viện chia kệ — `[marker: thuVienChiaKe]`

🔴 **Việc này phần lớn ĐÃ XONG TỪ 07/08, tôi không dựng lại.** `BAYS` (`lib/library/shelves.ts:115`)
có **đúng năm ngăn** hợp đồng §4 gọi tên, `LibrarySheet.tsx:508` đã render chúng:

| Hợp đồng §4 | `BAYS` đang có |
|---|---|
| Vật liệu · Cấu kiện · Ảnh & tài sản · Mẫu & hồ sơ · Node | `vat-lieu` · `cau-kien` · `anh` · `mau` · `node` |

Dựng lại là làm lại thứ đã có. Việc thật còn thiếu là **quan hệ**, và tôi làm đúng phần đó:
**Gallery nối vào ngăn Ảnh** — một lối ra ngay dưới kệ *Ảnh & tài sản*, cố ý **không** dùng kiểu
`.shrow` và **không** có số đếm: `.shrow` nghĩa là *một kệ chọn được*, đeo vào là biến Gallery thành
đúng cái kệ riêng mà chốt 17/08 vừa gỡ.

### 2.3 · Màu là một bước — `[marker: mauLaMotBuoc]`

- `app/colors/page.tsx` **viết lại theo khuôn `/library`** (chốt 03/08): route **giữ nguyên** (xoá
  là vỡ bookmark), nhưng thôi làm trang — nó ghi ý định rồi trả người dùng về chỗ cũ với sheet mở
  đúng kệ Vật liệu, bước *Chọn theo màu*.
- `components/library/buoc-mau.ts` (mới) — cờ `sessionStorage` + nhãn hai bước.
- `LibrarySheet.tsx` — dải hai bước **trên thân**, và `<ColorLibraryScreen/>` render **nguyên vẹn**
  trong bước đó. Màn Bảng màu cũ không mất một dòng, không dựng bản thứ hai.

**Hai chỗ phải cân nhắc, ghi lại để phiên sau không sửa ngược:**
① Dải bước đặt **trên thân**, không đặt trong cột kệ — cột kệ là *chọn kho nào*; đứng cạnh "Nhóm
vật liệu" thì mắt đọc màu thành **một bộ lọc nữa**, đúng thứ chốt đang gỡ.
② Cờ đi **cạnh** `if:open-library-on-load` chứ không nới khoá đó ra — `use-library-sheet.ts` là cửa
chung cho mọi nơi mở Thư viện và nằm **ngoài vùng ghi** của phiên; đổi hợp đồng của nó giữa lúc hai
phiên chạy song song đúng là *"build chéo ngược"* mà hợp đồng cấu trúc sinh ra để chặn.

### 2.4 · Hai bản vẽ

`docs/mocks/mock-files-hai-ngan.html` (`@dsCard group="Files"`) ·
`docs/mocks/mock-thu-vien-ke.html` (`@dsCard group="Thư viện"`). Đủ 2 nền sáng/tối, token chép từ
`globals.css`, **0 hex gõ tay ngoài khối token** (đo bằng máy), có **ca ngăn thô rỗng cả hai nhánh**
(kho chưa có gì ↔ mọi món đã đủ — hai câu khác hẳn nhau, vì "mọi món đã đủ" là **tin tốt**).
**Hàng bỏ-màu** dựng thật bằng `filter:grayscale(1)`, đặt bản thường cạnh bản đã bỏ sạch màu.

### 2.5 · Tự chấm 2 skill design — bắt 4 lỗi thật, đã sửa

| # | Lỗi | Bằng chứng | Đã sửa |
|---|---|---|---|
| 1 | dòng "ai thấy" dùng `--t4` — **trượt WCAG 1.4.3** | tự tính: `--t4` trên `--panel` = **3,65:1** (tối) / **2,86:1** (sáng); ngưỡng chữ 4,5:1 | đổi `--t3` (6,93 / 4,90) — cả code lẫn bản vẽ |
| 2 | nút tab `border:none;background:transparent` → vòng focus mờ trên nền tối | WCAG 2.4.7 | bơm `:focus-visible` qua `RawStyle` (đúng cách repo đã dùng), không đụng `globals.css` |
| 3 | bản vẽ có `role="tab"` mà **không có `tabpanel`**, và hàng so sánh đeo `aria-selected` lên thứ không phải tab | ARIA sai chỗ hại hơn không có | nối `aria-controls`/`aria-labelledby` + roving `tabindex`; hàng so sánh chuyển sang `data-on` (nó là **ảnh của một trạng thái**, không phải nút) |
| 4 | ô màu để nền trơn → đọc ra *"đang tải/hỏng"* | — | dùng token `--hatch` thật (`globals.css:125`) — quy ước sẵn có cho *chỗ này chờ dữ liệu thật*; vẫn không vẽ màu bịa |

Kèm một ghi chú vào bản vẽ mà tôi cho là đáng: **ký tự ▣ ▢ ⌂ ₫ ⚠ là chỗ đứng của biểu tượng, không
phải biểu tượng** — bản dựng thật dùng lucide. Mock là hợp đồng, phiên port sau đọc thẳng ký tự vào
mã là sai bộ biểu tượng. Riêng **◐/○** cố ý là ký tự thật: nó phải in được trên giấy đen trắng.

---

## 3 · TỔNG KẾT — rốt cuộc là gì

Ba mảnh đều quy về **một câu**: *thứ gì khác bản chất thì phải nhìn thấy là khác, thứ gì là bước
của một việc thì đừng cho nó làm một nơi.* Files tách hai ngăn vì hai nửa khác **tập người xem**;
màu thôi làm trang vì nó là **bước**; Gallery thôi làm kệ vì nó là **bản tuyển chọn**. Và cái mới
duy nhất — ngăn thô — **không sinh khái niệm mới**: nó chỉ là cách đọc khác của chỉ báo ba mặt đã có.

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Được.** Ngăn thô nối được đúng vào xương sống `Files → cửa sổ công cụ → Thư viện` mà không thêm
trường dữ liệu nào — chỗ này rẻ hơn tôi tưởng lúc đọc phiếu. Lõi thuần tách khỏi UI nên test canh
được ba điều dễ hỏng nhất (bịa khoảng giá · đánh rơi ca `chuaDu` · mất chữ *kho chung*). Việc 2 hoá
ra đã có sẵn và tôi **báo thật thay vì dựng lại cho đủ đầu việc**.

**Chưa được.** ① **Không chạy trên app thật một dòng nào** — phiếu cấm dev server, và `file://`
không mở được trong pane trình duyệt, nên **hai bản vẽ chưa ai soi bằng mắt**; mọi kết luận hình
thức là đọc mã + tính số. ② Ngăn thô đọc `/api/specs` **toàn bộ kho** rồi lọc phía client — đúng lối
`MaterialsScreen` đang làm, nhưng kho lớn thì đây là chỗ chậm đầu tiên. ③ Ô tìm kiếm ở đầu sheet
**không áp cho bước Màu** (nó lọc món, không lọc màu) — không gãy, nhưng là một nút bấm không phản
hồi ở đúng bước đó.

**Rủi ro ngoài phạm vi, phải báo T.** Trong lúc tôi làm, một phiên khác chạy `git add -A` và **quét
3 tệp đang dở của tôi vào commit `804f17a`/`46278fa`** — hai commit có thông điệp về *docs*. Nội
dung không hỏng (bản trong cây làm việc mới là bản cuối), nhưng đây đúng ca `claim-keys-va-cham`:
**khoá phạm vi theo tệp không chặn được một lệnh `git add -A` của phiên khác.**

## 5 · HAI HƯỚNG CHO PHẦN CÒN LẠI

**Hướng A — nghiệm thu bằng mắt trước, rồi mới đi tiếp.** Mở `/files` và sheet Thư viện trên app
thật, chụp 4 khung vào `Drive/IF-duyet-mat/01-anh/`.
*Được*: đóng đúng nút thắt đang đau nhất (xong-máy ≫ xong-mắt), và ba mảnh này đều là thứ Hoà nhìn
là phán được ngay. *Mất*: phải chờ V1 xong — `AppShell.tsx` đang bị V1 sửa dở, mở bây giờ thì không
phân biệt được lỗi của ai.

**Hướng B — đi tiếp phần dữ liệu: cho ngăn thô nhận cả tệp thật, không chỉ bản ghi vật liệu.**
*Được*: Hoà mô tả phần thô là *"map texture · NCC · range giá"* — map texture nằm ở **tệp**, mà ngăn
hiện chỉ đọc bản ghi vật liệu có mã. *Mất*: chạm `components/filemanager/**` và `lib/filemanager/**`
— **ngoài vùng ghi**, và đúng loại việc mà build lẻ sẽ đẻ ra cấu trúc thứ hai.

## 6 · ĐỀ XUẤT

**Chọn A**, và làm ngay sau khi V1 đóng. Lý do chọn A thay vì B: B chạm hai thư mục ngoài vùng và
đụng đúng ranh giới hợp đồng vừa lập ra để chặn — mở nó ra lúc ba phiên còn chạy song song là trả
giá đắt nhất cho lợi ích ít nhất. A thì rẻ, đóng đúng nợ đang lớn nhất, và **nó là điều kiện để
biết B có đáng làm không**: nếu Hoà nhìn ngăn thô rồi nói "thiếu tệp", B thành việc có căn cứ; nếu
không, B chỉ là suy đoán của tôi từ một câu mô tả.

---

## ⑦ NGHIỆM THU — số THẬT

| Cửa | Lệnh | Kết quả |
|---|---|---|
| tsc | `npm run tsc` | **0 lỗi** |
| test | `npm test` | **exit 0**, 0 dòng FAIL |
| test lõi mới | `sucrase-node app/files/_lib/ngan-tho.test.ts` | **25 pass · 0 fail** |
| từ điển | `npm run soi:tu-dien` | 4 lệch nhãn · 273 chữ trần — **0 chỗ nào là tệp của V2** (4 lệch đều ở `docs/mocks/mock-home-sua-4-loi.html`, có sẵn từ trước) |
| hình học | `npm run soi:hinh-hoc` | **10 ngoài thang** — giữ nguyên mốc 16/08, **0 chỗ của V2** (chỉ dùng `var(--r-*)`) |
| bản vẽ | kiểm tĩnh bằng máy | 0 thẻ chưa đóng · 0 lỗi lồng thẻ · 0 id trùng · **0 aria trỏ hụt** · 0 hex ngoài khối token |

**Đích riêng của phiếu — *hai ngăn phân biệt được khi bỏ hết màu*: ĐẠT**, chứng minh bằng hàng
bỏ-màu trong `mock-files-hai-ngan.html` §④. Thứ mang nghĩa là **chữ** (tên + dòng *ai thấy*) và
**hình dạng** (dải mực 2px đáy + chữ đậm), không phải sắc độ. Cả hai bản vẽ **không dùng `--accent`
ở đâu cả**, không thêm token màu nào.

## ⑦b CHƯA CHẮC / CHƯA KIỂM

1. 🔴 **Chưa mở app thật, chưa mở bản vẽ trên trình duyệt.** Phiếu cấm dev server; `file://` không
   load được trong pane (thử 2 lần, tab trả `about:blank`). ⇒ **mọi kết luận về hình thức là đọc mã
   + tính số, không phải nhìn.** Chưa biết: hai ngăn có vỡ khổ hẹp không · `ColorLibraryScreen` đặt
   trong thân sheet có tràn/cuộn đúng không · dải bước có đè lên `discoverbar` không.
2. Số tương phản là **TÍNH từ hex trong `globals.css`**, không đo trên màn. Bộ tính đã hiệu chuẩn
   (tái hiện đúng 3,88:1 và 2,86:1 mà sổ 16/08 ghi) nhưng vẫn giả định nền sau chữ đúng là `--panel`;
   có lớp bán trong suốt chen giữa thì số đổi.
3. Chưa thử trình đọc màn hình thật, chưa thử Safari/Firefox, **chưa kích hoạt `prefers-reduced-motion`**
   lần nào (phần tôi làm không có chuyển động, nhưng chưa kiểm chứng bằng máy).
4. `khoangGiaCuaNhom` gom theo `ProductSpec.kind`. **Chưa ai chốt** `kind` có phải trục gom đúng
   cho khoảng giá không — tôi chọn nó vì đó là trục phân loại duy nhất có sẵn trên bản ghi.
5. Cờ `if:library-buoc-mau` chỉ có tác dụng khi trang được trả về **có `AppShell`** (nơi mount
   `LibrarySheet`). Từ một trang không có `AppShell` thì `/colors` sẽ mở sheet ở lần điều hướng sau
   đó — **chưa kiểm chứng bằng thao tác thật**.
6. Nút *"Bảng màu"* ở `MaterialsScreen.tsx:181` **vẫn còn nguyên** và vẫn đẩy sang `/colors`. Đường
   đi nay đúng (nó dẫn vào bước Màu trong sheet) nhưng **nhãn nút chưa sửa** — `components/materials/**`
   nằm ngoài vùng ghi của phiên này.

## ⑦c HẠN DÙNG KẾT LUẬN

- Kết luận **"BAYS đã đủ năm ngăn"** đúng tại `bde99c4`. Ai đổi `lib/library/shelves.ts` thì phải đọc lại.
- Con số **273 chữ trần / 4 lệch nhãn / 10 ngoài thang** là ảnh chụp lúc **V1 và W đang chạy song
  song** — chúng sẽ đổi khi hai phiên kia commit. Điều còn giá trị lâu hơn là mệnh đề hẹp:
  **0 chỗ nào trong đó là tệp của V2**.
- Cách nối `/colors` → sheet phụ thuộc `markOpenLibraryOnLoad()` của `lib/library/use-library-sheet.ts`.
  Nếu phiên sau nới khoá đó thành mang được *kệ + bước*, thì `buoc-mau.ts` **nên bị gộp vào**, đừng
  để hai cờ sống song song.
- Mục **⑦b.1** hết hạn ngay khi có ai mở được app thật — lúc đó phải chạy lại phần hình thức, đừng
  tin bản này.
