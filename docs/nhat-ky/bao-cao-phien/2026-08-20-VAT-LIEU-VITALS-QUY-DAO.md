# 20/08 — VẬT LIỆU THEO CHỨC NĂNG · VITALS QUỸ ĐẠO · LUẬT ĐẶT CHỖ

Lane: `components/ui/**` · `components/studio/Vitals*` · `lib/ui/**` · `app/globals.css` (token vật liệu) · `/thu-be-mat`.
Server :3001 dùng lại, **không restart/kill**. Không git, không prisma.

---

## ⓪ TIỀN ĐỀ — xác nhận

| Giả định của phiếu | Đo tại nguồn | Kết |
|---|---|---|
| `BeMatNoi` là nguyên thể kính nổi + kéo | 320 dòng, portal body, `useKeoBeMat` | ✅ |
| `VitalsAperture` Ambient→Peek→Engage đã LIVE | mount ở `AppChrome.tsx:358`, chạy thật | ✅ |
| Vùng lane khác | KHÔNG đụng `present-editor/**` · `print/**` · `CadSheets.tsx` · `nav/**` · `AppChrome.tsx` | ✅ |
| Nơi gọi `BeMatNoi` ngoài lane | đúng **1**: `present-editor/ThietLapTrang.tsx` (`doDac="dac"`) — **không sửa tệp đó**, đổi ngữ nghĩa ở nguyên thể | ✅ |

---

## 1 · BA MỨC VẬT LIỆU

Trước: ba nấc là ba **độ đặc của kính** (`mong/vua/dac`, cùng một chất, khác alpha). Trục đó là trục **thẩm mỹ** — nơi dùng chọn "cái nào nhìn hợp" chứ không chọn "việc này thuộc loại gì".

Nay ba mức là ba **chất khác nhau**, chọn theo **chức năng**:

| Mức | Token / lớp | Nhoè | Dành cho |
|---|---|---|---|
| ① **ĐẶC** *(mặc định)* | `--vl-dac` · `.be-mat-noi--dac` | **không có** | biểu mẫu · cài đặt · thiết lập trang · spec · dữ liệu kỹ thuật · vùng nhiều núm · đọc lâu |
| ② **GẦN ĐẶC** | `--vl-gan-dac` (.97/.975) · `.be-mat-noi--gan-dac` | 6px | bảng làm việc thường trực · inspector · Object Passport · xem chi tiết · soát duyệt |
| ③ **KÍNH MỎNG** | `--kinh-mong` · `.be-mat-noi--kinh` | **12px** (trước 16-24) | **CHỈ**: Vitals Peek · viên giọng nói · hành động nhanh · công cụ nổi nhỏ · lớp phủ tạm |

Base `.be-mat-noi` **không còn tự cấp nền** — nền chỉ đến từ đúng một mức. Trước đó base tự bôi `--kinh-vua`, tức **mọi bề mặt là kính cho tới khi có người khai khác**; nay mặc định đảo chiều.

**Khuôn (B) vỏ kính + ruột gần đặc**: lớp `.be-mat-ruot-dac` (`backdrop-filter: none`) — ruột **tắt hẳn** kính, chặn kính-chồng-kính ở gốc.

### Bề mặt bị ĐỔI KHỎI KÍNH (danh sách)

| Bề mặt | Trước | Sau | Vì sao |
|---|---|---|---|
| `bac="bang"` — bảng năng lực / cửa sổ làm việc | kính `--kinh-vua` .90 | **GẦN ĐẶC** | bảng thường trực, đứng lâu |
| `bac="bangSau"` — cổng Spec, bảng sâu | kính `--kinh-dac` .95 + nhoè **24px** | **ĐẶC**, 0 nhoè | dày chữ-số, nhiều núm |
| `ThietLapTrang` (present-editor, `doDac="dac"`) | kính .95 + nhoè 24px | **ĐẶC** — qua ánh xạ ở nguyên thể, **0 dòng sửa trong tệp lane kia** | thiết lập trang = biểu mẫu |
| **Vitals Engage** | *(giữ `--card` đặc)* | giữ nguyên, và **cố ý KHÔNG bọc `BeMatNoi`** | bọc vào là kính chồng lên mặt đặc |
| `bac="vien"` · **Vitals Peek** | kính .84 nhoè 16px | **KÍNH**, nhoè 12px | đúng 1 trong 5 vai trò được đeo kính |

⇒ Ba trong bốn bề mặt nổi đang sống **rời khỏi kính**. Chỉ viên ngữ cảnh và Vitals Peek còn là kính.

### Luật thành thứ MÁY chặn được — `lib/ui/vat-lieu.ts`

Bảng **vai trò → vật liệu** (17 vai trò, 3 mức) + `duocDeoKinh()`. Vì sao là tệp lõi chứ không phải docstring: luật "kính phải đáng" chết ngay nếu chỉ viết bằng chữ — lane sau thấy `--kinh` đẹp hơn, bôi lên một biểu mẫu, không máy nào kêu. Nay `vatLieuTheoVaiTro('bieu-mau') === 'dac'` là khẳng định có test. **Không khai vai trò ⇒ ĐẶC**, không phải kính.

`BeMatNoi` nhận `vaiTro` (khuyến nghị) / `vatLieu` (khai thẳng); `doDac` giữ `@deprecated` để nơi gọi cũ không gãy.

**Số đo tương phản** (đo trên app thật, composite token màu qua nền vật liệu qua 4 nền: ambient · lưới 2D trắng · viewport 3D · trang Trình chiếu):

| Theme | Thấp nhất | Ở đâu |
|---|---|---|
| Tối | **5.26** | `--kinh-chu-phu` trên kính mỏng, nền trắng |
| Sáng | **4.66** | `--t3` trên gần-đặc, nền viewport 3D |

`--t1` thấp nhất 9.94 · `--t2` thấp nhất 7.41. **Mọi mức vật liệu × mọi nền × 2 theme đều ≥ 4.5.**

---

## 2 · VITALS — HÌNH THÁI QUỸ ĐẠO

`components/studio/VitalsQuyDao.tsx` — LÕI nhỏ + **3 đường quỹ đạo** ellipse nghiêng 0/60/120°, nét 0.9px.
🔴 Lấy **hình thái/chuyển động**, KHÔNG chép quả cầu: không gradient cầu, không bóng khối, không hạt bay. Quả cầu là một *vật để ngắm*; quỹ đạo là một *cách sắp xếp* — nó nói "có thứ chuyển động quanh một tâm", và **cái tâm ấy là chỗ cả ba mức mọc ra**.

| Mức | Vật liệu | Nội dung |
|---|---|---|
| **AMBIENT** | gần như **không vật liệu** — nền trong suốt, nét mảnh, **đơn sắc `--t4` lúc nghỉ** | lõi + 3 quỹ đạo + nhãn "Vitals" |
| **PEEK** | **kính mỏng**, nở ra từ đúng tâm đó | §17 (dưới) |
| **ENGAGE** | `--card` **ĐẶC**, cùng tâm | `VitalsChatSurface` — không overlay, không giữa màn, **không phải hộp thoại chatbot rời** |

**Bỏ**: `VitalsIcon` + `VitalsStateDot` ở nút ambient — chấm trạng thái nói lại đúng điều lõi đã nói.

### §17 — thẻ một-tín-hiệu-lớn

`1` (26px, tabular-nums) + `lượt đang chạy` → dòng ngữ cảnh `Phối cảnh phòng khách — bản 3` → tối đa 2 dòng phụ một-dòng → **một** hành động nhỏ "Mở Vitals…". Không biểu đồ, không %, không "so với tuần trước".

**Ô giải thích "vì sao bị gắn cờ"**: thêm `viSao` vào `TinHieu`, lấy từ **bảng hằng số `VI_SAO`** — không có cửa nào cho chữ tự do/AI lọt vào (test khoá). *"Việc đang chạy trong hàng đợi."* · *"Lượt chạy dừng giữa chừng."* · *"Bộ kiểm quy chuẩn đo được sai lệch trên bản vẽ đang mở."*

**Chỉ tín hiệu thật**: `vitals-tin-hieu.ts` giữ nguyên, không nới. Đo trên app: nguồn rỗng ⇒ Peek chỉ có *"Không có tín hiệu nào."* ✅

### §18 — phát sáng = trạng thái

Ánh sáng **mọc từ gốc hành động** (radial gradient tâm ở chính lõi, bán kính nhỏ, tắt về 0):

| Trạng thái | Lõi | Quỹ đạo |
|---|---|---|
| nghỉ | `--t3` mờ 0.7, **không quầng** | `--t4`, mờ 0.34, đứng yên |
| sẵn sàng | `--accent` + quầng nhẹ ở tâm | mờ 0.55, đứng yên |
| đang chạy | `--accent`, quầng mạnh hơn | mờ 0.75, **quay 9s tuyến tính** |

Ba mức chỉ đổi **độ sáng** và **chuyển động**. Không nhấp nháy, không neon.

**Ranh giới giữ nguyên**: Vitals = *tôi nên biết gì* · Thông báo = *ai gửi gì* · Dải hành động = *vừa xảy ra gì*.

---

## 3 · CHUYỂN ĐỘNG TỪ GỐC — bốn nhịp

`mọc từ nguồn → NỞ RA → CẮM/AN VỊ → thu về nguồn`

Nhịp **an vị** là phần mới: sau khi nở xong, bề mặt **cắm hẳn** — bóng đổ đi từ nông (còn "trong không khí") sang đầy (`.be-mat-noi--an-vi`). ⚠️ Chỉ đổi **bóng**; dời chỗ ở nhịp này thì đọc ra là "cửa sổ tự nhảy". Vitals dùng lại `nhip.ts`, không gõ ms tại chỗ.

---

## 4 · ĐẶT CHỖ — `lib/ui/dat-cho.ts`

### Bảy bước — có chạy đủ

| # | Bước | Trạng thái |
|---|---|---|
| ① | neo vào nguồn | ✅ |
| ② | nở ra hướng ngoài (phía nhiều chỗ trống hơn) | ✅ |
| ③ | tránh che — dời **ngang** trước (dời dọc là rời khỏi nguồn) | ✅ |
| ④ | sát mép ⇒ lật | ✅ |
| ⑤ | kẹp trong dải hợp lệ | ✅ |
| ⑥ | quá lớn ⇒ **inspector cắm bên** | ✅ |
| ⑦ | việc sâu ⇒ **toàn không gian** | ✅ |

⭐ **⑥⑦ chạy TRƯỚC ①-⑤ trong hiện thực**: hỏi *"đây là loại gì"* xong mới hỏi *"đứng đâu"*. Hỏi ngược lại là đẻ ra đúng con vật luật cấm — một tấm 700px lơ lửng giữa màn, kẹp viewport rất chỉnh tề.

### Ngưỡng — CON SỐ và VÌ SAO

| Hằng | Giá trị | Lý do |
|---|---|---|
| `NHO_RONG` | **380px** | `BeMatNoi` mặc định 360; 380 ôm trọn mọi viên/popover đang có mà không nới tới cỡ một bảng |
| `NHO_CAO` | **40% chiều cao khung** | trên mức này, tấm neo cạnh nguồn **không còn cách nào** không che vật đang chọn — ngưỡng của bước ③, không phải ngưỡng thẩm mỹ |
| `VUA_RONG` | **520px** | trần inspector còn để canvas thở trên màn 1280 (1280−520=760, hơn nửa) |
| `VUA_CAO` | **92%** | cao hơn thì "inspector" chỉ còn là cách gọi |
| `CAM_TREN` | **48px** | dải Vitals mép trên |
| `CAM_DUOI` | **56px** | dải hành động mép dưới |

**Sáu vùng không được che**: canvas chính · vật đang chọn · **vật nguồn** (tự thêm) · vùng con trỏ · **Vitals** · **dải hành động** — hai mục cuối là **vùng CẤM cứng**, không phải né-nếu-tiện: một bề mặt *tạm thời* mà bịt hai hệ *thường trực* là đổi thứ đắt lấy thứ rẻ, và người dùng không biết mình đang mất.

**Giữa màn** chỉ đến từ cờ khai tay `quyetDinhChan` (xác nhận · xoá · cảnh báo · một câu hỏi gật/lắc). **Không kích cỡ nào tự nhảy vào đó** (test khoá). Biểu mẫu dài/cài đặt: ĐẶC + đặt bên.

Người dùng kéo đi đâu vẫn là quyền của họ — `useKeoBeMat` không đụng.

### Đo trên app thật (1440×900) — ngưỡng: trên ≥60 · đáy ≤832 · phải ≤1428

| Ca | Kết quả | Đạt |
|---|---|---|
| nguồn **sát mép trên** (y=2) | y = **60** | ✅ đúng mép dải Vitals, không đè |
| nguồn **sát đáy** (y=854) | lật lên, đáy = **832** | ✅ đúng mép dải hành động, không đè |
| nguồn **sát mép phải** (x=1322) | phải = **1428** | ✅ kẹp chuẩn |
| nguồn **giữa canvas** (600,400) | tấm 518→798 / 448→548, `cheNguon: false` | ✅ |
| **cửa sổ 440px** ("Cổng Spec") | **ĐỔI LOẠI** → cắm mép trái x=12, y=60 | ✅ không phình giữa màn |

### 🔴 HAI BUG CHỈ LỘ TRÊN APP THẬT (lõi thuần vẫn xanh cả hai lần)

1. **Lệch đúng một nhịp** — lúc đóng, `conTrongDom` còn true suốt nhịp thu về mà `setDat(null)` chạy ngay ⇒ effect tính lại chỗ đặt **ngay lúc đóng**, bằng vị trí nguồn **cũ**; lần mở sau dùng lại kết quả đó. Triệu chứng: mọi phép đo đúng-chỗ-của-lần-trước. Vá: thêm `mo` vào điều kiện.
2. **Đo bằng `getBoundingClientRect` trong lúc đang `scale(0.96)`** ⇒ chiều cao trả về **đã co 4%**. Nghe không đáng kể, nhưng là **4px của một tấm 100px** — đủ để tấm thò xuống dưới dải hành động (đo được: đáy 836 > 832). Vá: dùng `offsetWidth/offsetHeight` (kích thước **layout**, `transform` không đụng vào) + đo lại nếu chiều cao đổi >2px.

⇒ Cả hai đều là loại lỗi **máy soi và test thuần không bắt nổi** — lõi `datCho` đúng từng phép tính, nó chỉ được cho số liệu sai. Đây là ca thứ hai trong tuần củng cố cùng một điều: nghiệm thu phải có **thao tác thật + đo bằng số**.

---

## 5 · REDUCED-MOTION — nợ, khai thẳng

**CHƯA bật được cờ hệ điều hành thật.** Đã thử và vì sao không được:

| Cách | Kết |
|---|---|
| `defaults read com.apple.universalaccess reduceMotion` | khoá **chưa tồn tại** (chưa ai bật bao giờ) |
| **Ghi** khoá đó / mở System Settings bằng computer-use | ⛔ **tôi không được phép** — đổi cài đặt hệ thống nằm trong nhóm cấm của tôi. Phải là **Hoà tự bật**: Cài đặt → Trợ năng → Hiển thị → Giảm chuyển động |
| Emulation cấp trình duyệt (`Emulation.setEmulatedMedia`) | công cụ trình duyệt đang có **không lộ** cửa này; `resize_window` chỉ có `colorScheme` |
| Cờ dòng lệnh `--force-prefers-reduced-motion` | phải khởi động lại trình duyệt của Hoà |

Đã đo: `matchMedia('(prefers-reduced-motion: reduce)').matches === false` — tức mọi ảnh chụp hôm nay là nhánh **chuyển động đầy đủ**.

**Thay bằng máy canh** (`lib/ui/giam-chuyen-dong.test.ts`): mọi chuyển động **mang nghĩa trạng thái** phải có nhánh reduced-motion **riêng**, và nhánh đó không được chỉ `animation: none` rồi thôi — phải **thay bằng dấu hiệu tĩnh**. Khoá 2 ca đang sống: `.be-mat-noi--dang-chay` (viền chạy → viền sáng tĩnh) · `.vitals-quy-dao--quay` (tắt quay, **giữ độ sáng**). ⚠️ Nó chứng minh **có nhánh**, không chứng minh nhánh đó **đẹp** — phần mắt vẫn nợ.

---

## 6 · VIỆC THỨ BA — 🔴 QUÁ TẢI, KHÔNG NHẬN

**Hệ neo điều khiển quanh cửa sổ** (`CuaSoCongCu.tsx` + nguyên thể neo mới): **chưa làm dòng nào.**
Khung giờ đã dùng hết cho hai việc trước (~2× dự kiến, chủ yếu ở vòng đo-sửa-đo trên app thật để bắt hai bug ở mục 4). Ôm tiếp việc ba là vỡ cả ba. Đề nghị tách lane riêng — hoặc giao lại lượt sau.

Ghi lại phần đã đọc để lượt sau không đọc lại: cửa nghiệm thu của nó là **ruột panel phải NHẸ ĐI**, không phải mép có thêm nút; nghĩa là việc đó chỉ thành công nếu **gỡ được thứ gì đó ra khỏi ruột `CuaSoCongCu`**. Đó là phần cần đo trước/sau, và là phần chưa ai đo.

---

## 7 · VERIFY

| Cửa | Kết |
|---|---|
| `tsc` | **0 lỗi trong lane**. ⚠️ 1 lỗi ở `lib/capabilities/image-to-3d.ts` — thư mục **untracked, của lane khác đang chạy**, không phải của tôi |
| test khuôn nhà (sucrase, **không vitest**) | toàn repo chạy: **1 FAIL** = `lib/capabilities/anh-thanh-spec.test.ts` (40 pass/2 fail), cùng lane khác đó. **9/9 tệp test của lane tôi OK**, gồm 3 tệp mới |
| Browser thật | ba nấc Vitals · tín hiệu rỗng vẫn im · 5 ca đặt chỗ · số đo tương phản 2 theme |
| Token | 0 hex cứng mới; **0 dòng đụng `--accent*`**; bo giữ thang 6/10/14/20 |

**Tệp mới**: `lib/ui/vat-lieu.ts(+test)` · `lib/ui/dat-cho.ts(+test)` · `lib/ui/giam-chuyen-dong.test.ts` · `components/studio/VitalsQuyDao.tsx`.
**Sửa**: `components/ui/BeMatNoi.tsx` · `components/studio/VitalsAperture.tsx` · `components/studio/vitals-tin-hieu.ts(+test)` · `app/globals.css` · `app/thu-be-mat/page.tsx`.

---

## 8 · CHƯA CHẮC / CHƯA KIỂM

- **Reduced-motion chưa nhìn bằng mắt** (mục 5). Nhánh có, đẹp hay không thì chưa ai biết.
- **Chỉ đo Chromium.** Safari/Firefox là suy — `backdrop-filter` ở mức gần-đặc 6px chưa thử ở WebKit.
- **Chưa thử trình đọc màn hình thật.**
- **`inspector-canh` che nguồn**: cửa sổ 440px cắm mép trái phủ lên chính cái nút đã gọi nó (`cheNguon: true` ở phép đo đầu). Đúng bản chất của việc cắm mép, nhưng **luật chưa nói rõ** ca này — nếu Hoà muốn inspector cũng né nguồn thì phải chốt riêng, thuật toán đổi được.
- **`CAM_TREN`/`CAM_DUOI` đang là hằng số 48/56**, chưa đo DOM thật của từng màn. Màn nào có dải khác cỡ thì phải truyền vào; hiện chưa nơi gọi nào truyền.
- **Ngưỡng 380/520/40%/92% là do tôi chọn**, có lập luận (mục 4) nhưng **chưa hỏi người dùng thật**. Đổi ngưỡng là đổi loại bề mặt, nên nếu Hoà thấy sai thì sửa sớm rẻ hơn sửa muộn.
- **Cách đọc "tránh che"**: tin bị cắt ở *"primary canvas · current…"*; bản đầy đủ sau đó xác nhận 6 mục. Tôi đã theo bản đầy đủ.

## 9 · HẠN DÙNG KẾT LUẬN

Số đo tương phản đúng với bộ token **hôm nay**. Màu nhấn thứ hai (mòng két ↔ mận) **chưa chốt** — chốt xong phải đo lại mục ①, vì `--accent` là màu của lõi quỹ đạo và của quầng sáng §18.

---

## 10 · CHECKPOINT NHÌN ĐƯỢC — trạng thái thật lúc kết lượt

**Ảnh đã chụp được**: MỘT — Peek có tín hiệu thật, trên Trang chủ, kính mỏng trên nền sáng:
`1` lớn + `lượt đang chạy` + `Phối cảnh phòng khách — bản 3` + `1 lượt chạy lỗi` + `Mở Vitals…`.

**Ba nấc còn lại chỉ có SỐ ĐO, chưa có ảnh** — khai thẳng vì sao:
- Pane trình duyệt render app vào một góc ~333px rồi thu nhỏ cả khung ⇒ ảnh không đọc nổi. Ép `resize_window` về 1440×900 thì `innerWidth` đúng 1440 nhưng ảnh chụp vẫn hỏng.
- Playwright headless chạy được nhưng vào `/` là **màn đăng nhập** (ngữ cảnh mới, không có cookie) ⇒ `AppChrome` không mount ⇒ không có Vitals. Cần một đường nạp phiên đăng nhập cho Playwright — chưa có, và không kịp dựng trong khung giờ.

⇒ **Nợ mắt**: ảnh Ambient (3 trạng thái) · ảnh Engage · ảnh ba mức vật liệu ở `/thu-be-mat` 1440×900 hai theme.

**Bằng chứng bằng số đã có** (đo DOM thật, 1440×900, có đăng nhập):

| Việc | Bằng chứng |
|---|---|
| Ambient sống, có quỹ đạo | `[data-vitals-aperture] svg ellipse` = có · `aria-label` = "Vitals — đang chạy" |
| Ambient đổi theo trạng thái | có việc chạy ⇒ `.vitals-quy-dao--quay` xuất hiện; hết việc ⇒ biến mất |
| Peek là **kính mỏng**, không kính dày | `backdrop-filter: saturate(1.4) blur(12px)` (trước: 16-24px) |
| Peek **mọc từ tâm lõi** | `transform-origin: 230.125px 0px` trên tấm 268px ⇒ **37,9px từ mép phải** = đúng nửa bề rộng nút |
| Engage **không kính** | `background: rgb(255,255,255)` · `backdrop-filter: none` |
| Engage **cùng tâm** | `transform-origin: 262.125px 0px` trên tấm 300px ⇒ **37,9px từ mép phải** — trùng khít Peek |
| Tín hiệu rỗng vẫn im | Peek chỉ có *"Không có tín hiệu nào."* |
| Ba mức vật liệu khác chất | ảnh `/thu-be-mat` (pane còn đọc được lúc đó): ba thẻ khác hẳn nhau, thẻ kính cho thấy nền tím ambient xuyên qua, hai thẻ kia không |

**Bug thứ ba, bắt được ở phút cuối**: trên khung hẹp (333px), Peek neo theo mép phải nút ⇒ mép trái tấm ở **−21px**, tràn ra ngoài màn. Đã vá bằng kẹp `right ≤ innerWidth − 268 − 8`; đo lại ở 1440 thì tấm ở 1118→1386, nằm gọn.
