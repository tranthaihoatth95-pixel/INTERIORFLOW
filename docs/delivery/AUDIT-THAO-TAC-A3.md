# AUDIT THAO TÁC — LÀN A3 · chặng 3D Thiết kế & chặng Trình chiếu

> Ngày 05/09 · app thật `next start` tại `http://localhost:3210` · nhánh `nen-checkpoint` (`b9f00873`)
> Tài khoản `audit@if.test` (200 credit) · dự án dựng bằng tay trong phiên: `cmto26vko00047d230l11744m`
> Ảnh: `docs/delivery/anh-duyet-mat/audit-a3/` (đặt ở đây vì `.gitignore:95` chặn `docs/**/*.png`,<br>> chỉ nhánh `anh-duyet-mat/` được mở ngoại lệ — tôi KHÔNG sửa `.gitignore`) · kịch bản: `/tmp/a3-*.mjs` · tệp xuất: `/tmp/a3-out/`
>
> **CHỈ AUDIT — không sửa một dòng mã nào.** Mọi kết luận dưới đây đến từ **thao tác thật trên app**;
> mã nguồn chỉ được mở SAU khi đã thấy lỗi, để giải thích nguyên nhân (luật `N6`).

---

## BẢNG PHỦ

Ký hiệu: ✅ đã đi · ⛔ đã đi và **hỏng** · ➖ không đi được (có lý do).

### Chặng 3D Thiết kế
| Ca | Chuột + bàn phím | Cảm ứng |
|---|---|---|
| **1 · Đường sung sướng** (dựng khối → đổi vật liệu) | ⛔ dựng tường **được**; đổi vật liệu **báo xong mà không đổi** → `[3D-VL-01]` | ➖ không dựng nổi: mọi cử chỉ trong khung nhìn đều chết → `[3D-CHAM-01]` |
| **2 · RỖNG** (chưa có khối) | ✅ có lối làm việc tại chỗ ("Bắt đầu trong 3D"), **không** đuổi sang chặng khác — đúng luật X2. Nhưng chữ hướng dẫn **1,21:1** gần như vô hình → `[3D-TUONGPHAN-01]` | ✅ cùng lối, cùng lỗi tương phản |
| **3 · VÀO NGANG** (URL thẳng) | ⛔ dự án **không tồn tại** vẫn dựng đủ xưởng 3D 32 nút → `[3D-MA-01]` | ⛔ như trên |
| **4 · QUAY VỀ / BỎ DỞ** | ✅ tường còn nguyên qua chuyển chặng **và** qua F5; mode cũng nhớ | ✅ như trên |
| Bàn phím: Tab · phím tắt · Esc · vòng focus | ⛔ vào mode Vẽ 3D là **Tab chết toàn trang** → `[3D-BANPHIM-01]`; `V`/`M`/`Q` chạy, `B` không | — |
| Xoay / pan / zoom khung nhìn | ✅ chuột chạy | ⛔ 1 ngón, 2 ngón, pinch — **không cử chỉ nào ăn** |

### Chặng Trình chiếu
| Ca | Chuột + bàn phím | Cảm ứng |
|---|---|---|
| **1 · Đường sung sướng** (chọn hồ sơ → dàn trang → xuất) | ⛔ dàn trang **được**, xuất PPTX **được**, nhưng bản nộp đầy chữ mẫu → `[TC-XUAT-01]` | ✅ vào được, dàn được |
| **2 · RỖNG** (chưa có trang / BOQ trống / thống kê trống) | ✅ **làm rất đúng**: 7 lối vào, nêu rõ vì sao trống + 2 nút xử lý tại chỗ | ✅ như trên |
| **3 · VÀO NGANG** | ✅ dự án không tồn tại → báo "Không tìm thấy dự án" đàng hoàng (ngược hẳn 3D) | ✅ như trên |
| **4 · QUAY VỀ / BỎ DỞ** | ✅ deck còn nguyên, có "Đã lưu lúc hh:mm" | ✅ như trên |
| Bàn phím | ⛔ trong trình dàn trang **Tab chết toàn trang** → `[TC-BANPHIM-01]` | — |
| Nút mờ nói lý do | ⛔ 10 nút: lý do **chỉ** cho trình đọc màn hình → `[TC-NUTMO-01]` | ⛔ câm hoàn toàn |
| **Kiểm đầu ra** (mở file thật) | ⛔ đã mở `a3-deck.pptx`: 13 ô chữ, **7 là chữ mẫu** | — |

### Không đi (khai rõ)
| Việc | Vì sao |
|---|---|
| Chạy node **Render ảnh · Video · Đổi phong cách · Moodboard · Cắt nền** | **Tốn tiền thật** (4·8·3·2·1 cr). Đã kiểm tới mức *có báo giá trước không* — **có**, mỗi thẻ ghi rõ `2cr`/`3cr`/`4cr`, việc chạy máy nội bộ ghi `0 credit`. **Dừng trước khi bấm chạy.** |
| Xuất **PDF · PDF 300dpi · Gói .zip** | Hết thời lượng phiên sau khi đã mở được PPTX. PPTX đủ để phán §4 `CHUAN-DAU-RA-NGHE`. |
| Trình đọc màn hình thật (VoiceOver/NVDA) | Không có trong môi trường. Kết luận a11y dựa trên cây trợ năng + `getComputedStyle`, không phải nghe thật. |

---

## P0 — chặn việc

### `[3D-VL-01]` P0 · chặng 3D · chuột · ca 1 — **gán vật liệu báo "xong" nhưng không có gì đổi**
**Thấy gì.** Chọn tường → *Đổi vật liệu* → chọn "Gỗ sồi tự nhiên" (`IF-MAT-GO-SOI`) → bấm
**"Dùng cho vật đang chọn"**. App hiện toast xanh **"✓ Đã áp 'Gỗ sồi tự nhiên' lên vật đang chọn"**.
Cùng lúc đó, trên cùng một màn hình:
- panel phải vẫn ghi **"Chưa gán vật liệu"**, ô tròn xem trước vẫn rỗng;
- chip trạng thái vẫn **"Khối xám · chưa vật liệu"**;
- bức tường trong khung nhìn không đổi.

Đóng thư viện, chọn lại khối, **và F5** — vẫn "Chưa gán vật liệu". Không phải panel cũ chưa kịp vẽ lại;
việc gán **không hề xảy ra**. Ảnh `31-da-gan-vatlieu.png` (toast + panel mâu thuẫn trong một khung hình),
`32-sau-dong-thuvien.png` (sau khi đóng thư viện).

**Đáng lẽ phải gì.** Hai căn cứ:
1. **`docs/00-CHOT.md` 04/09** — ca WorkHub: *"nút nói dối việc nó vừa làm, tệ hơn nút chết (nút chết
   thì người dùng biết mà đi đường khác)"*. Đây đúng ca đó.
2. **Nó chặn nguyên một luồng nghề đã có sẵn.** BOQ chạy đúng và nói rõ (ảnh `34-boq-sau-tinh-lai.png`):
   *"1 vùng tô chưa gán vật liệu (specId) — không tính vào BOQ. **Gán vật liệu cho vùng tô trước khi
   xuất bảng khối lượng.**"* App bảo người dùng đi gán vật liệu, mà cửa gán vật liệu thì hỏng và còn
   báo là đã xong ⇒ **vòng kín, không có đường ra**. Đây là mắt xích giữa của lời hứa
   "đổi vật liệu → cả ba chặng cập nhật".

**Tái hiện.** `/projects/<id>/render` → gạt *Vẽ 3D* → *Bắt đầu trong 3D* → kéo chuột trên sàn dựng tường →
`V` → bấm vào tường → *Đổi vật liệu* → chọn "Gỗ sồi tự nhiên" → *Dùng cho vật đang chọn* → nhìn panel phải.
Kịch bản: `/tmp/a3-32-verify.mjs`.

### `[3D-CHAM-01]` P0 · chặng 3D · cảm ứng · ca 1 — **khung nhìn 3D không nhận một cử chỉ chạm nào**
**Thấy gì.** Bắn cử chỉ **thật ở tầng trình duyệt** (CDP `Input.dispatchTouchEvent`, không phải
`TouchEvent` tự chế) trong ngữ cảnh `hasTouch:true`:

| Cử chỉ | Khung nhìn có đổi? |
|---|---|
| 1 ngón kéo (xoay) | **không** |
| 2 ngón chụm/xoè (zoom) | **không** |
| 2 ngón kéo song song (pan) | **không** |
| *đối chứng*: chuột kéo, **cùng khung hình đó** | **có đổi** |

Đối chứng chuột chạy ngay sau, cùng trang, cùng vùng cắt ảnh ⇒ không phải cảnh trống, không phải
lỗi công cụ đo. Kịch bản `/tmp/a3-17-cdp.mjs`.

**Đáng lẽ phải gì.** `docs/00-CHOT.md` 11/08 (CẤP 0): *"Desktop Electron = bản CHUẨN full · **Touch = LỚP
thao tác**, không phải bản riêng"*, và 03/08: *"IF cảm ứng là để VẼ chính xác"*. Một chặng dựng hình mà
trên tablet không xoay nổi góc nhìn thì lớp thao tác đó chưa tồn tại.

**Tái hiện.** Mở `/projects/<id>/render` trên tablet (hoặc ngữ cảnh `hasTouch`), gạt *Vẽ 3D*, thử xoay/zoom.

---

## P1 — hỏng nặng, còn đường vòng

### `[3D-BANPHIM-01]` / `[TC-BANPHIM-01]` P1 · cả hai chặng · bàn phím · mọi ca — **Tab bị nuốt, cả chặng mất bàn phím**
**Thấy gì.** Đo bằng cách bấm Tab rồi đọc `document.activeElement`:

| Nơi đứng | Số điểm dừng khác nhau sau 12–60 lần Tab |
|---|---|
| `/login` (đối chứng) | 7 · có vòng focus `2px solid` |
| `/settings` (đối chứng) | 10 · có vòng focus |
| `/render` **mode Node** | 12 · có vòng focus |
| `/render` **mode Vẽ 3D** | **1** — focus không bao giờ rời `BODY` |
| `/present` **trong trình dàn trang** | **1** — focus không bao giờ rời `BODY` |

Gạt *Vẽ 3D* → Tab chết; gạt về Node → Tab sống lại. Cô lập sạch. `/tmp/a3-13-tabab.mjs`, `/tmp/a3-23-tabpresent.mjs`.

Công bằng với bản thiết kế: Tab **có** làm đúng việc nó quảng cáo — 1 lần Tab ở Vẽ 3D làm dock nở
(61 → 76 nút). Nhưng đó là **toàn bộ** những gì Tab còn làm được.

**Nguyên nhân** (mở mã sau khi đã thấy lỗi): hai `keydown` gắn ở tầng **window/document**, không giới hạn
trong khu vực của mình —
- `components/render-studio/ToolDock3D.tsx:102` → `if (e.key === 'Tab') { e.preventDefault(); onToggleOpen(); }`
- `components/present-editor/PresentEditor.tsx:1775` → `if (e.key === 'Tab') { e.preventDefault(); onSelectNext(...) }`

**Đáng lẽ phải gì.** `docs/ACTIVE-DESIGN-CONTEXT.md` giữ trợ năng là yêu cầu, và `00-CHOT` 16/08 đã ban
luật *"kéo thả PHẢI làm được bằng bàn phím, nếu không thì người không dùng chuột mất hẳn tính năng"* —
tinh thần đó áp thẳng vào đây. Chiếm `Tab` mà **không mở đường focus thay thế** là lấy đi toàn bộ bàn phím
của hai chặng. (Trang trống thì `onSelectNext` còn không có gì để chọn ⇒ Tab vừa vô dụng vừa phá.)

**Tái hiện.** Mở `/present`, *Bắt đầu trình bày*, bấm Tab 20 lần — không ô nào sáng viền.

### `[3D-TUONGPHAN-01]` P1 · chặng 3D · cả hai lối · ca 2 — **chữ trên khung nhìn 3D chìm hẳn vào nền tối**
**Thấy gì.** Quét toàn bộ chữ trong chặng 3D ở **theme mặc định**, đo bằng cách ẩn chính chữ đó đi để
lấy màu nền thật rồi tính tỉ số (`/tmp/a3-08-sweep.mjs`) — **8/21 dưới ngưỡng AA**:

| Tỉ số | Cỡ | Chữ |
|---|---|---|
| **1,01:1** | 11px | nhãn trục **Y** |
| **1,02:1** | 11px | nhãn trục **X** |
| **1,21:1** | 14px | **"Bắt đầu dựng"** — tiêu đề màn rỗng |
| **1,21:1** | 11px | nhãn trục **Z** |
| 2,02:1 | 12px | nhãn công tắc **"Vẽ 3D"** |
| 2,66:1 | 11px | "Kéo thẳng trên mặt sàn để dựng tường…" |
| 2,66:1 | 11px | "Vẽ / nhập mặt bằng →" |
| 3,95:1 | 11,5px | "Vitals" |

Ảnh `06-crop-empty.png` — nhìn bằng mắt là chữ mờ như bóng ma. Ba nhãn trục toạ độ **không đọc được**,
tức người dùng mất luôn cái la bàn của không gian 3D.

**Nguyên nhân.** `<html>` đang mang **đồng thời** `data-theme="light"` và `class="dark"` — hai thứ nói
ngược nhau. Thẻ màn rỗng lấy mực theo token (`Render3DModeSkeleton.tsx:683` dùng `var(--t1)`, `var(--t3)`)
nên nhận `--t1 = #1d1d24` của theme **sáng**, trong khi nền khung nhìn 3D là tối cứng. Ép
`data-theme="dark"` thì cùng chữ đó lên **12,68:1** — chứng minh lỗi nằm ở lớp theme, không ở màu đã chọn.

**Đáng lẽ phải gì.** `docs/ACTIVE-DESIGN-CONTEXT.md` (trợ năng, ngưỡng AA 4,5:1 cho chữ thường) — cùng
ngưỡng mà đợt sửa nút mờ 16/08 đã lấy làm chuẩn.

### `[TC-XUAT-01]` P1 · Trình chiếu · chuột · ca 1 — **cổng CHUAN_DAU_RA mù đúng con đường app mời đi**
**Thấy gì.** Dựng deck 2 trang bằng **đúng lối app gợi ý** (*Dàn từ mẫu* → "Bìa (chữ trái · ảnh phải)" +
"Bảng vật liệu (flat-lay + nhãn)") rồi *Xuất → PowerPoint*. Không hộp thoại cảnh báo nào, màn hình báo
**"Đã xuất PowerPoint xong."** Mở `a3-deck.pptx` ra đọc (`unzip` + đọc `<a:t>`) — 13 ô chữ, **7 là chữ mẫu**:

```
slide1: "Tiêu đề bộ trình bày" · "1 / 2"
slide2: "MATERIAL BOARD" · "Tiêu đề slide" · "Ý chính 1" · "Ý chính 2"
        · "Vật liệu" · "Vật liệu" · #EFE9DC · #C2AD86 · #8A6A3A · #6E4A2E · "2 / 2"
```

Thí nghiệm đối chứng làm rõ **đây là điểm mù, không phải cổng hỏng** (`/tmp/a3-38-gate2.mjs`):

| Trạng thái deck | Cổng có chặn? |
|---|---|
| Chỉ áp mẫu (chữ mẫu từ template) | **KHÔNG** — file xuất ra bình thường |
| Thêm 1 ô chữ trống mặc định | **CÓ** — "Trang 1: 1 ô chữ còn nội dung mẫu", Huỷ thì không xuất |

**Nguyên nhân.** `lib/present-editor/export-checks.ts` chỉ coi là chữ mẫu khi nội dung **bằng đúng**
`DEFAULT_TEXT_CONTENT` = `'Nhập nội dung'` (`lib/present-editor/model.ts:662`). Chữ mẫu do template gieo
— `lib/present-editor/templates.ts:256` `'Tiêu đề bộ trình bày'`, `PresentEditor.tsx:1291` `['Ý chính 1','Ý chính 2']`
— là chuỗi khác nên không ai bắt.

**Đáng lẽ phải gì.** `docs/CHUAN-DAU-RA-NGHE.md` §4: *"**0 placeholder sót**: `{{ }}` · lorem · 'Untitled' ·
ảnh xám mẫu"*, và §6.1: *"Máy chặn lúc xuất … placeholder sót → **chặn kèm lý do + nút sửa**"*.
Cũng thiếu **revision hồ sơ** mà §4 đòi ("Trang có số trang + revision") — số trang có (`1 / 2`), revision không.

**Ghi nhận đúng phần được:** chữ trong PPTX nằm trong `<a:t>` ⇒ **sửa được sau khi xuất**, đúng §4.

### `[TC-NUTMO-01]` P1 · Trình chiếu · bàn phím + cảm ứng — **10 nút mờ: lý do chỉ đến tai trình đọc màn hình**
**Thấy gì.** Thanh công cụ chung có 10 nút mờ (Chữ · Đo khoảng cách · Di chuyển · Sao chép · Xoay ·
Đối xứng · **Chọn** · **Xoá** · Hoàn tác · Làm lại). Mỗi nút **có** `aria-disabled="true"` + `aria-describedby`
trỏ tới lý do thật ("Chưa nối lệnh xoay cho trang trình chiếu"…). Nhưng:

| Người dùng | Có nhận được lý do? |
|---|---|
| Trình đọc màn hình | **có** |
| Chuột (rê vào) | **không** — không tooltip nào hiện, đo sau 1,4s |
| Bàn phím | **không** — 80 lần Tab không tới được (mà Tab lại đang chết, `[TC-BANPHIM-01]`) |
| Cảm ứng | **không** — không `title`, không chữ hiện |

Phần tử mang lý do bị ẩn thị giác (`position:absolute; width:1px; clip:rect(0,0,0,0)`).
`/tmp/a3-22-dis.mjs`, `/tmp/a3-35-touchpresent.mjs`.

**Đáng lẽ phải gì.** `docs/00-CHOT.md` 16/08 đã rút đúng bài học này và gọi nó là *"đường dây bị đứt ở
đoạn cuối"*: **"CÓ TRONG MÃ" KHÔNG BẰNG "TỚI ĐƯỢC NGƯỜI DÙNG"**. Lần trước lý do chết trong `title`;
lần này chết trong lớp sr-only — vẫn là ba trong bốn nhóm người dùng không nhận được gì.

> Đối chiếu công bằng: **chặng 3D làm ĐÚNG** chuyện này. 4 nút mờ ở đó (Dựng hình ảnh · Kết xuất ·
> Chuyển động · Chuỗi khung) vừa có `aria-describedby`, vừa **in thẳng lý do thành chữ thấy được**
> cạnh nút ("Chưa có ảnh nguồn — chọn một ảnh hoặc khung nhìn"). Đây là khuôn nên bê sang Trình chiếu.

### `[3D-MA-01]` P1 · chặng 3D · cả hai lối · ca 3 — **dự án không tồn tại vẫn mở ra xưởng 3D đầy đủ**
**Thấy gì.** `/projects/du-an-ma-khong-ton-tai-123/render` → HTTP **200**, dựng đủ canvas node, thanh
công cụ, thư viện, Vitals — **32 nút, không nút nào mờ**, không một lời báo. Ảnh `02-ghost-3d.png`.
Cùng id bịa đó, `/present` **làm đúng**: *"Không tìm thấy dự án hoặc bản vẽ này — Đường dẫn có thể đã đổi
hoặc dự án đã bị xoá."*

**Đáng lẽ phải gì.** Lẽ thường (**không có điều khoản riêng**, tôi nói rõ đây là nhận định): người dùng
gõ nhầm/mở link cũ sẽ ngồi dựng khối trong một dự án không có thật. Chính chặng Trình chiếu trong cùng
app đã có cách xử đúng — hai cửa cùng một loại lỗi mà trả lời ngược nhau là bất nhất.

**Tái hiện.** Dán `/projects/bat-ky-chuoi-nao/render` vào thanh địa chỉ.

---

## P2 — cần sửa, không chặn việc

### `[3D-CHAM-02]` P2 · chặng 3D · cảm ứng — nhãn công cụ bị **cắt đôi** dưới dock
Ở 1024 **có cảm ứng**, nhãn "Chọn · Di chuyển · Xoay · Tạo · Vật liệu · Máy ảnh" hiện ra nhưng bị viền
capsule xén ngang thân chữ (ảnh `18-dock-1024-CÓ-cảm-ứng.png`). Ở 1440 không cảm ứng thì dock sạch,
chỉ icon. Trớ trêu: chế độ **cần nhãn nhất** lại là chế độ nhãn vỡ.
*(Đính chính phép đo của chính tôi: bộ dò chồng-lấn bằng toạ độ báo 13 cặp ở cả 1440 — **báo oan**, đó là
nhãn ẩn-thị-giác nằm đè nhau. Kết luận trên lấy từ **nhìn ảnh**, không lấy từ phép đo đó.)*

### `[3D-CHAM-03]` / `[TC-CHAM-01]` P2 · cả hai chặng · cảm ứng — vùng chạm dưới 44px
3D: **37 mục** — nặng nhất `10×10` ("AI đang chạy mock"), `24×24` ("Đóng"), `28×28` ("Mở lại Khối"),
ba tay nắm panel rộng `14px`.
Trình chiếu: **21 mục** — `24×24` cho **Lên · Xuống · Nhân bản · Xoá** slide, `26×26` cho cụm phóng to/thu nhỏ.
Căn cứ: `docs/00-CHOT.md` 03/08 (token `--tap` cho con trỏ thô) + ngưỡng 44px mà chính đề bài lấy làm chuẩn.

### `[3D-TITLE-01]` P2 · chặng 3D · cảm ứng — 9 mẩu thông tin **chỉ** nằm trong `title=`
Câm hoàn toàn trên cảm ứng. Đáng tiếc nhất là hai câu mang kiến thức nghề — *"Đặt máy chuẩn nghề ảnh
kiến trúc: trục nhìn NGANG…"* và *"Số điểm tụ suy TỪ HÌNH HỌC thế máy…"* — cùng lời khai trung thực
*"Mức 'oneAI' đang chạy mock (provider chưa sẵn sàng)"*.

### `[TC-CHU-01]` P2 · Trình chiếu · chuột · ca 1 — chèn ô chữ xong gõ thì chữ không vào
Bấm **Chữ** → ô chữ hiện ra, được chọn (8 nút bám quanh), panel phải mở mục "Nội dung". Gõ ngay
"Căn hộ Thảo Điền — audit A3" → **không ký tự nào vào**; ô vẫn "Nhập nội dung". Cùng lúc, thanh công cụ
chữ nổi **đè lên** dòng tiêu đề "Tiêu đề bộ trình bày" của trang (ảnh `37-sau-go-chu.png`).
*Nhận định của tôi, không có điều khoản*: có lẽ phải nhấp đúp mới vào chế độ sửa — nhưng không có dấu
hiệu nào nói thế, mà con trỏ thì đã nhấp nháy sẵn trong ô ⇒ người dùng gõ vào chỗ trống mà không biết.

### `[3D-NHAN-01]` P2 · chặng 3D · chuột — nhãn nói một đằng, hình vẽ một nẻo
Chip và ghi chú khẳng định *"Khối xám trơn — chưa vật liệu, chưa đèn"* trong khi khung nhìn đang vẽ
**sàn gỗ có vân** và tường be, có đổ bóng (ảnh `09-sau-keo1.png`). *Nhận định của tôi*: câu này để trấn
an rằng chưa có vật liệu thật, nhưng nó mâu thuẫn với thứ đang nhìn thấy nên phản tác dụng.

### `[3D-DONGBO-01]` P2 · chặng 3D — mở cùng dự án bằng trình duyệt khác thì **trống trơn**
Dựng tường ở phiên A (còn nguyên qua F5), mở đúng dự án đó ở một ngữ cảnh trình duyệt sạch → chip về
*"Không gian trống"*. Nhật ký `[present-sheets] IDB ghi 0.3 KB` cho thấy dữ liệu nằm ở IndexedDB máy.
**Có thể đúng chủ ý** (local-first đã chốt) — nêu ra vì nó va với lời hứa "một nguồn" khi có 2 người/2 máy,
**cần Hoà xác nhận là chủ ý hay thiếu sót**, tôi không kết luận.

---

## LÀM ĐÚNG — ghi lại để đừng sửa hỏng

1. **Màn RỖNG cả hai chặng đều tôn trọng luật X2** — không câu nào đuổi người dùng sang chặng khác.
   BOQ trống nói rõ *"BOQ tự sinh từ vùng tô vật liệu trong bản vẽ — không phải bảng nhập tay"* rồi đưa
   luôn *Tính lại từ bản vẽ* + *Mở bản vẽ*. Bảng thống kê, màn 3D trống cũng vậy.
2. **Luật X1 chạy thật**: tường dựng **trong 3D** đi thẳng vào BOQ thành "1 vùng tô" — không phải "xuất sang".
3. **BOQ giữ đúng luật "chỉ nhận số đo được"**: từ chối vùng chưa gán vật liệu, nói rõ lý do, kèm nút
   *"Xem 1 vùng này"*, chân bảng ghi provenance *"Lấy từ mô hình 0 · Đã sửa tay 0"*.
4. **Bền vững trong máy**: khối 3D và deck sống qua chuyển chặng và qua F5; deck có "Đã lưu lúc hh:mm".
5. **Báo giá trước khi tiêu tiền**: mỗi thẻ việc ghi `2cr`/`3cr`/`4cr`, việc chạy nội bộ ghi rõ `0 credit`.
6. **Khai thật khi chạy giả**: *"AI đang chạy mock (provider chưa sẵn sàng)"* — đúng tinh thần không-nút-dối.
7. **4 nút mờ ở chặng 3D in lý do thành chữ thấy được** — khuôn đúng, nên bê sang Trình chiếu.
8. **Vào ngang ở Trình chiếu xử đúng** (404 tử tế) — khuôn đúng, nên bê sang 3D.

---

## CHƯA CHẮC / CHƯA KIỂM

1. **`Kết xuất` vẫn mờ kèm lý do "Chưa có khung nhìn 3D để kết xuất"** ngay cả khi đã có tường + camera
   trong khung nhìn. Chưa rõ "khung nhìn 3D" ở đây nghĩa là **camera đã lưu** hay **cảnh có hình khối** ⇒
   chưa dám gọi là lý do sai. Cần người biết chủ ý xác nhận.
2. **Phím `B` (Vật liệu) không đổi công cụ** trong khi `V`/`M`/`Q` đổi được (đọc qua `aria-pressed`).
   Có thể `B` đang bị "Mở lại Khối — B" giành. **Chưa đào tiếp.**
3. **Chỉ đo trên Chromium 1194**, không thử Safari/Firefox.
4. **Không nghe bằng trình đọc màn hình thật** — phần "trình đọc màn hình có nhận được lý do" là suy từ
   cây trợ năng, không phải nghe thật.
5. **Danh sách 8 chữ dưới ngưỡng ở chặng 3D là SÀN, không phải trần**: chỉ quét phần tử lá đang hiện,
   trong **một** trạng thái màn hình (mode Vẽ 3D, cảnh rỗng). Panel khác, trạng thái khác chưa quét.
6. **Chưa xuất PDF / PDF 300dpi / Gói .zip** ⇒ chưa biết ba đường đó có đi qua cổng CHUAN_DAU_RA không.
   Riêng "PDF in 300dpi" thì mờ **kèm lý do thấy được ngay trên nhãn** — đúng cách.
7. **Chưa thử nhiều người cùng sửa**, chưa thử Electron (chỉ trình duyệt).
