# LUẬT NGẦM — vì sao chạm giao diện là sai (điều tra 05/09)

> Hoà hỏi: *"cần đập đi xây lại toàn bộ giao diện nếu nguyên nhân không được làm rõ. Điều tra vì
> giao đụng tới giao diện là sai. Có luật nào ngầm không?"* → **CÓ. Một dòng.**

## ① Luật ngầm

**`components/studio/AppShell.tsx:193`**
```jsx
<div style={{ display:'flex', flexDirection:'column',
              height: '100dvh', overflow: 'hidden', ... }}>
```

Dòng này ra một mệnh lệnh cho toàn app — **trang không bao giờ được cao hơn màn hình** — mà
**không tài liệu nào ghi** và (tới 05/09) **không máy soi nào canh**. Nó được thi hành bằng CSS,
nên đọc `docs/` bao nhiêu cũng không thấy; mỗi phiên vấp lại từ đầu.

## ② Nó đẻ ra chuỗi hệ quả — đo được

| | số |
|---|---|
| tệp đi qua `AppShell` (chịu luật này) | **48** |
| chỗ tự dựng vùng cuộn con để lách | **122** ở **95 tệp** |
| khai báo `overflow[-y]: auto\|scroll` trong CSS/TS | **111** |
| chỗ dựng dấu hiệu "còn tiếp" (mask · fade · bóng mép) | **0** |
| máy soi canh chuyện này (trong 32 máy) | **0** |

Và 122 chỗ đó **không cùng một lối** — ít nhất bốn phương ngữ cho cùng một việc:
`min-h-0 flex-1 overflow-y-auto` · `flex-1 overflow-y-auto px-2 py-2` ·
`max-h-[52vh] overflow-y-auto` · `overflow-y-auto px-5 py-4`.

## ③ Mấu chốt: thanh cuộn là OVERLAY ⇒ trước khi cuộn, KHÔNG tín hiệu nào

Đo trên Chromium 1440×900: mọi hộp cuộn có `offsetWidth − clientWidth = **0**`. Máng bằng 0 với
`overflow-y:auto` nghĩa là thanh cuộn dạng **overlay** — chỉ hiện **trong lúc đang cuộn** rồi tan.

⇒ Người dùng **không thể khám phá ra thứ họ không biết là có**. Hậu quả đo được:

| màn | khung | nội dung | THẤY ĐƯỢC |
|---|---|---|---|
| Cài đặt | 858 | 3737 | **23%** |
| Files | 858 | 2548 | **34%** |
| `.shelf` (sidebar, mọi màn) | 474 | 499 | thiếu 25px |

Thứ đang bị giấu ở Cài đặt: **Độ chói của kính** + **trọn mục Đơn vị & Tỉ lệ** (đơn vị hiển thị ·
cách nhập số đo · ô quy đổi · 9 nấc tỉ lệ ISO) — đúng cái Hoà chốt 15/08, **đã dựng xong, đang
chạy, không ai nhìn thấy**.

⚠️ Và `globals.css:1211` **đã** khai `::-webkit-scrollbar { width: 8px }` với thumb tô theo theme.
**8px đó chưa bao giờ chạm màn**, vì không scroller nào giữ chỗ cho nó. *Đã viết, chưa cắm điện* —
cùng họ với `resolve.ts`, với `lib/ui/icon/`, với OTA.

## ④ Quyết định: GIỮ khoá vỏ · SỬA cái mép

**Không đập đi xây lại.** Lý do không phải để giữ việc:

- Vỏ mới **cũng cần một chiều cao**; người dựng vỏ mới **cũng sẽ viết** `100dvh; overflow:hidden`
  vì đó là cách mọi công cụ sáng tạo làm; và **không máy soi nào chặn** ⇒ giao diện mới **tái tạo
  đúng con bệnh này**, mất thêm vài tuần. Bằng chứng: chuyện này đã xảy ra **122 lần** trong chính
  repo — nó là **thuộc tính của cách app lớn lên**, không phải tai nạn của một người.
- Bỏ khoá vỏ **không giải bài này**: app cuộn-cả-trang với thanh cuộn overlay vẫn mù y hệt. Nó chỉ
  thêm rủi ro — rail · thanh công cụ · khẩu độ Vitals đều đang neo theo viền màn, bỏ khoá là trôi.
- Ngành: Figma · VS Code · Blender · Photoshop · Linear **đều khoá vỏ**, và **đều bù cho overlay
  bằng một tín hiệu đứng yên** (overview ruler · thanh hiện khi hover · vệt mờ). IF làm nửa đầu,
  bỏ nửa sau. **Cái đáng đập không phải giao diện — là cái mép cuộn đang không có chủ.**

## ⑤ 🔴 BỐN LẦN THỬ, BỐN LẦN ĐO — ghi cả bốn, vì ba lần đầu đều suýt thành "xong" giả

| # | làm gì | đo được | vì sao trượt |
|---|---|---|---|
| 1 | `scrollbar-gutter: stable` | máng **0 → 8px** trên 9/9 hộp cuộn | số đúng, nhưng cắt dải mép soi pixel ⇒ **con trượt không vẽ ra**. Dừng ở đây là lấy mất 8px mà **không thêm tín hiệu nào** |
| 2 | scroll-shadow 4 lớp `background` | `getComputedStyle` trả **đủ 4 lớp đúng**, pixel **CHÊNH 0.0** | **background vẽ PHÍA SAU con**; Cài đặt toàn thẻ đục ⇒ thẻ che kín. Mẹo này hợp danh sách trong suốt, **không hợp bố cục thẻ** |
| 3 | `::before/::after` **sticky** + scroll-driven fade | pseudo tồn tại đủ (sticky · z-3 · gradient · animation) mà pixel vẫn **0.0** | `.main` khai `overflow:auto` là **THUỘC TÍNH CSS**, không phải **class Tailwind** ⇒ **chưa bao giờ khớp** selector. Lẫn "có tràn" với "có class" — **hai lần trong một lượt** |
| 4 | liệt kê tường minh + `scroll(nearest block)` | ✅ **CHÊNH 26.3** | — |

**Kết quả đo cuối, trên app thật sau khi dựng lại:**
```
CUỘN 600 : 249.7 ×26 → 223.4 226 227.6 229.4 231.2 … 249.7   ⇒ CHÊNH 26.3
ĐỈNH  0  : không có vệt  (phần chênh 7.3 là chữ "Quay lại", không phải vệt)
```
Vệt bắt đầu **đúng ở dòng 26** — bằng `padding-top` của `.main`. Đó cũng là **lỗi đo thứ tư của
tôi**: ba lần trước tôi cắt dải chỉ 16px từ mép hộp, tức **cắt trúng vùng đệm trống**, nên đọc ra
0 và ba lần tưởng là hỏng.

⚠️ **Nói thẳng chỗ không tách được**: lần 4 đổi **hai thứ cùng lúc** (thêm selector tường minh +
`scroll(self)` → `scroll(nearest)`). Tôi **không chứng minh được** cái nào lật kết quả. Sửa
`nearest` là đúng theo đặc tả (`self` = phần tử mang animation = chính pseudo, mà pseudo không
cuộn) nên giữ, nhưng đó là lý lẽ **từ tài liệu**, không phải **từ phép đo**.

📌 **Bài học lớn nhất của cả lượt**: bốn lần liên tiếp máy trả `0`, và **không lần nào `0` nghĩa là
"sạch"** — nó lần lượt nghĩa là *không vẽ* · *bị che* · *không khớp selector* · *đo nhầm chỗ*.
Cùng họ với ca `900/900` sáng nay. **Một số `0` chưa được truy nguyên là một câu hỏi, không phải
một câu trả lời.**

## ⑤b Đã thi công lượt này

| việc | bằng chứng |
|---|---|
| `scrollbar-gutter: stable` — máng `0 → 8-9px` trên **9/9** hộp cuộn thật | đo trên runtime |
| **vệt mờ tự vẽ** — `::before/::after` sticky, nổi TRÊN nội dung, mờ dần theo cuộn | CHÊNH **26.3** đo trên runtime |
| tắt đúng lúc: ở đỉnh **không có vệt**, cuộn mới hiện | đo hai mốc `scrollTop` 0 và 600 |
| `prefers-reduced-motion` → vệt **đứng yên** chứ không tắt | vệt là TRẠNG THÁI, tắt là lấy mất tín hiệu của đúng nhóm cần nó |
| KHÔNG dùng `mask-image` | mask **xén** popover nổi trong vùng cuộn; background/pseudo thì không |
| **cổng máy mới `F-MEP-CUON`**, trần **104**, vào bánh cóc | `soi-foundation.mjs` |
| tự kiểm **hai chiều** (BẮT trần · THA khi đã khai · THA `overflow-x`) | `--tu-kiem` 🟢 |

🔴 **Thước tự bắt lỗi của chính nó ngay lượt mở sổ**: bản đầu dùng cửa sổ ±260 ký tự, `--tu-kiem`
chỉ ra nó **đọc ghé khai báo của rule bên cạnh** (cách ~60 ký tự) rồi tha oan. Đổi sang phạm vi
**khối `{...}`** ⇒ 105 → **104**.

## ⑥ Chưa xong — nói thẳng

- **104 khai báo còn lại** phần lớn là panel/dropdown **chưa tràn**; siết dần qua bánh cóc.
- **Hai thước bù nhau, không trùng**: cổng soi **khai báo CSS**; quy tắc utility phủ chỗ dùng
  **class Tailwind** (cổng KHÔNG đếm). Cần giữ cả hai.
- **8px máng cuộn là thay đổi NHÌN THẤY ĐƯỢC** ở 6 chỗ đã sửa (bề rộng nội dung hụt 8px) — cần
  mắt Hoà duyệt.
- `scrollbar-gutter: stable` giữ chỗ **kể cả khi không tràn**. Đó là chủ ý (chống nhảy bố cục khi
  nội dung lớn lên), nhưng ở dropdown hẹp nó là 8px trống — cần soi bằng mắt xem có chỗ nào cấn.
- **Danh sách selector tường minh là BẢN VÁ TẠM CÓ TÊN, không phải kiến trúc.** CSS không chọn
  được theo *"có tràn hay không"*, nên mỗi hộp cuộn khai-bằng-thuộc-tính phải được kê tên bằng tay.
  Đường bền là **MỘT component sở hữu cái mép**, mọi vùng cuộn đi qua nó — đúng nguyên tắc
  *một cỗ máy, nhiều mặt tiền*. Việc đó chưa làm.
- **Mới phủ 4 hộp cuộn khai-bằng-thuộc-tính** (`.main` · `.shelf` · `.insp` · `.uplist`); hộp cuộn
  không tên ở Files (`HaiTang.tsx`, giấu 1690px) **chưa có vệt** — nó dùng style nội tuyến.
- **Chưa soi mắt bản TỐI.** Vệt dùng `color-mix(--t1 12%)` nên tự đảo theo theme, nhưng chưa đo.

## ⑦ HỌ "NÚT TRÔI KHỎI TẦM NHÌN" — đã quét hết, chỉ 1 ca thật

Ca `ProjectInitBoard` (nút ở `y=909`, dưới mép 900) làm dấy nghi: **còn hộp thoại nào như vậy không?**
Quét cả họ — **24 tệp** khai `role="dialog"`/`aria-modal`:

| | |
|---|---|
| nghi theo phép soi TĨNH (thân cuộn · không thấy `sticky` · ≥2 nút) | **1** — `components/studio/HoatDongChuong.tsx` |
| xác minh trên **app thật** | **0 nút dưới mép** ⇒ **báo oan** |
| **ca thật** | **1/24** — chỉ `ProjectInitBoard`, đã sửa (`y 909 → 786`) |

⚠️ Phép soi tĩnh **yếu ở chỗ đã biết**: nó tìm chữ `sticky` ở **bất kỳ đâu trong tệp**, nên tệp
dùng `sticky` cho việc khác sẽ được tha oan. Nó dùng để **khoanh vùng đi kiểm**, không dùng để
tuyên trắng án — và đúng lần này nó khoanh trúng một tệp lành.

⇒ Kết luận đáng giá: **đây KHÔNG phải bệnh lan rộng.** Bản vá là ca lẻ, không cần đổi khuôn hộp
thoại toàn app. Máy soi lại: `node scripts/soi-mat/do-chuong.mjs` · `node scripts/soi-mat/do-hop-thoai.mjs`.
