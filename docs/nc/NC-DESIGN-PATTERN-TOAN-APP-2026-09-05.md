# NC · NGÔN NGỮ THIẾT KẾ TOÀN APP — pattern ngành, bộ tham số chốt, hai họ ký hiệu

> **Đặt bài 05/09 (Hoà):** *"Bỏ visual icon hiện tại → tệ vô cùng tệ. **Tệ vì thiết kế nó xấu chứ
> không phải bản chất của nó.**"* · *"nghiên cứu design pattern tương ứng, IF đối chiếu theo đó mà
> làm, phát huy thêm cái riêng làm điểm nhấn"* · nắn giữa lượt: *"design pattern **TOÀN APP, ĐỒNG
> BỘ, KHÔNG LẺ TẺ, ÁP DỤNG TẤT TẦN TẬT**. Bằng design pattern được rồi chuyện hơn là đặc trưng
> riêng."* · *"cái riêng tính luôn."* · *"đọc spec vitals trước đi."*
>
> **Sản phẩm kèm theo:** bản vẽ `docs/mocks/mock-design-pattern-toan-app.html` (đủ hai nền, ảnh ở
> `docs/mocks/anh/`) · bộ mã `lib/ui/icon/` (21 ký hiệu + test khoá ràng buộc).
>
> ⛔ **Lượt này KHÔNG sửa mã ứng dụng.** Sản phẩm là spec + bản vẽ. Chưa qua mắt Hoà.

---

## §0 · KẾT LUẬN TRƯỚC — ba câu

1. **Bộ ký hiệu cũ không xấu; cách IF dùng nó mới xấu.** Đo được: bộ vẽ cho lưới **24**, mà **92%**
   số lượt render ở **≤16px**, **91%** không bù nét ⇒ **năm bề dày nét khác nhau** trên cùng một
   màn, không cỡ nào tròn điểm ảnh. Đây là bệnh **thiếu cỡ quang học**, không phải bệnh thẩm mỹ.
2. **Bộ tham số chốt:** lưới **16** · đệm **1** · vùng an toàn **14** · nét **1 đơn vị (6,25%)** ·
   bo trong ký hiệu **= nét** · đầu nét **vuông** + góc **nhọn** · thang cỡ **16/20/24/32**.
   Nét khai theo *đơn vị lưới* nên tỉ lệ nét/lưới là **hằng số** — độ đậm không bao giờ trôi nữa.
3. **Cái riêng nằm TRONG pattern, không song song với nó.** Hai họ dùng **chung mọi luật hình
   học**; khác nhau đúng một điều: họ nghề dùng **cặp nét cắt/thấy 2:1** — bề dày mang **nghĩa**
   (cái bị cắt qua ↔ cái chỉ nhìn thấy), đúng ngữ pháp bản vẽ. Tỉ lệ 2:1 **lấy từ bảng nét của
   chính IF**, không tự chế.

---

## §1 · ĐO HIỆN TRẠNG — vì sao "xấu vô cùng tệ" là một con số

Lệnh đo trên `components/` ngày 05/09 (mọi phần tử JSX có thuộc tính `size=`):

| | Số |
|---|---|
| Lượt vẽ ký hiệu có khai cỡ | **1.188** |
| Số cỡ khác nhau | **35** — từ 1 tới 520 |
| Lượt render ở cỡ ≤ 16px | **1.093 · 92%** |
| Lượt KHÔNG khai `strokeWidth` | **1.091 · 91%** |
| Tệp có `import … from 'lucide-react'` | **206** |
| Số tên ký hiệu khác nhau đang nhập | **125** |

Năm cỡ dùng nhiều nhất và bề dày nét thật của chúng (lưới 24, nét 2, không bù):

| Cỡ | Lượt | Nét thực |
|---|---|---|
| 13px | 303 | 1,08px |
| 14px | 242 | 1,17px |
| 12px | 201 | 1,00px |
| 15px | 165 | 1,25px |
| 11px | 102 | 0,92px |

**1.013 lượt = 85%** rơi vào năm cỡ này, cho **năm bề dày khác nhau**, **không cái nào** tròn điểm
ảnh. Mắt không đọc ra "sai 0,08px" — mắt đọc ra **"lộn xộn"**, rồi người xem gọi nó là *xấu*.

⭐ **Chẩn đoán này quan trọng hơn bộ ký hiệu mới**: nếu vẽ một bộ mới rồi vẫn đặt ở 35 cỡ không bù
nét, **bộ mới sẽ xấu y hệt**. Cái phải sửa trước là **thang cỡ + cách khai nét**.

---

## §2 · NGHIÊN CỨU PATTERN NGÀNH — bốn hệ, tham số đo được

### Cách lấy dữ liệu — khai thật trước khi trình bảng

Nhiều trang tài liệu chính chủ **bị chặn** ở môi trường này (`m3.material.io`, `carbondesignsystem.com`,
`www.ibm.com`, `developers.google.com`, `phosphoricons.com`, `lucide.dev` — đều trả *EGRESS_BLOCKED*
hoặc *CONNECT tunnel failed 403*). Nên tôi làm hai đường và **đối chiếu chéo**:

- **Đường ①** — tra tìm kiếm để lấy **câu chữ chính chủ** (kèm URL nguồn ở bảng dưới).
- **Đường ②** — **tải thẳng tệp SVG gốc** của từng hệ từ `raw.githubusercontent.com` (không bị chặn)
  rồi **tự đo bằng toạ độ đường dẫn**. Đây là **nguồn sơ cấp**, mạnh hơn trích dẫn.

Chỗ nào hai đường khớp thì ghi số; chỗ nào chỉ có một đường thì ghi rõ.

### Bảng so sánh

| Tham số | **SF Symbols** (Apple) | **Material Symbols** (Google) | **Carbon** (IBM) | **Lucide** |
|---|---|---|---|---|
| Lưới dựng | Không công bố lưới px — symbol là **đối tượng chữ**, ăn theo font San Francisco | **24 dp** (đo: `viewBox 0 -960 960 960`, 960/24 = ×40) | **32 px** artboard | **24 px** (đo: `viewBox 0 0 24 24`) |
| Vùng an toàn / đệm | quy theo **cap height** của font, không theo đệm px | **20×20**, đệm **2 dp** | đệm **2 px** → sống **28×28** | đệm **≥1 px** → sống ~**22×22** |
| Bề dày nét | **9 trọng lượng** ultralight→black, **khớp trọng lượng chữ liền kề** | **đo được:** wght100 → **0,7 dp** · wght400 → **2,0 dp** · wght700 → **3,15 dp** | **2 px** (đo: `radio-button.svg` vành ngoài r=14 / trong r=12) | **2 px** cố định |
| Cỡ quang học | **3 nấc** small · medium · large, **định theo cap height** | trục `opsz` **20→48 dp**; chỉ 20 và 24 ăn đúng lưới điểm ảnh | vẽ RIÊNG cho 16/20/24/32 | **không có** — một bản vẽ, tự chỉnh `stroke-width` |
| Đầu nét / góc nối | theo kiểu chữ San Francisco | **đầu vuông** (squared terminals) | đầu vuông | **tròn / tròn** (đo: `stroke-linecap="round"`) |
| Bo trong ký hiệu | — | **2 dp** | **2 px** | **2 px** |
| **Bo = nét?** | — | **có** (2/2) | **có** (2/2) | **có** (2/2) |
| Hình khoá | *"nhất quán về mức chi tiết, trọng lượng quang học, canh lề, vị trí, phối cảnh"*; cho **lề âm** để canh quang học | **đo được:** tròn **⌀20** · vuông **18×18** · dọc **16×20** · ngang **20×16** | bốn hình: tròn · vuông · chữ nhật đứng · chữ nhật nằm | — |
| Nét ↔ đặc | **4 chế độ tô**: monochrome · phân cấp · bảng màu · nhiều màu; symbol chia **lớp** | trục `FILL` 0→1 | nét và đặc là hai bộ | chỉ nét |
| Phối cảnh | chính diện | chính diện | chính diện | chính diện |

**Nguồn:**
- SF Symbols — <https://developer.apple.com/design/human-interface-guidelines/sf-symbols>
  (lấy qua API tài liệu `…/tutorials/data/design/human-interface-guidelines/sf-symbols.json`
  vì trang HTML cần JavaScript; nội dung trích nguyên văn: *"nine symbol weights — from ultralight
  to black — corresponds to a weight of the San Francisco system font"*, *"three scales: small,
  medium (the default), and large. The scales are defined relative to the cap height"*).
- Material Symbols — <https://m3.material.io/styles/icons/designing-icons> ·
  <https://developers.google.com/fonts/docs/material_symbols> (cả hai **bị chặn**, lấy câu chữ qua
  tra tìm kiếm) · **số đo tự làm** trên tệp gốc
  `raw.githubusercontent.com/google/material-design-icons/master/symbols/web/{home,radio_button_unchecked,check_box_outline_blank,crop_portrait,crop_landscape}/materialsymbolsoutlined/*_24px.svg`.
- Carbon / IBM — <https://v10.carbondesignsystem.com/guidelines/icons/contribute/> ·
  <https://www.ibm.com/design/language/iconography/ui-icons/design/> (**bị chặn**, lấy qua tra tìm
  kiếm) · **số đo tự làm** trên
  `raw.githubusercontent.com/carbon-design-system/carbon/main/packages/icons/src/svg/32/radio-button.svg`.
- Lucide — <https://lucide.dev/contribute/icon-design-guide> · <https://lucide.dev/guide/lucide/basics/stroke-width>
  (**bị chặn**, lấy qua tra tìm kiếm) · **số đo tự làm** trên
  `raw.githubusercontent.com/lucide-icons/lucide/main/icons/*.svg`.
- Phosphor — **số đo tự làm** trên `raw.githubusercontent.com/phosphor-icons/core/main/assets/{thin,light,regular,bold,fill}/circle*.svg`.

### Ba điều rút ra — thứ thật sự đáng mượn

**① Bo góc trong ký hiệu **BẰNG** bề dày nét. Ba trên bốn hệ làm y hệt** (Material 2/2 · Carbon 2/2
· Lucide 2/2). Không phải trùng hợp: bo bằng nét thì mặt trong khúc cua khép lại thành **điểm** —
không hở khe, không chồng mực. ⇒ IF lấy nguyên: `BO = NET.cat`.

**② Hình khoá cân DIỆN TÍCH, không cân bề ngang.** Tự đo bốn hình khoá của Material rồi tính:

| Hình khoá | Kích thước (dp) | Diện tích (dp²) |
|---|---|---|
| Tròn | ⌀20 | 314,2 |
| Vuông | 18 × 18 | 324,0 |
| Dọc | 16 × 20 | 320,0 |
| Ngang | 20 × 16 | 320,0 |

Bốn hình **chênh nhau 3,2%** dù bề ngang chênh tới 25%. Lý do: hình vuông 14×14 và hình tròn ⌀14
cùng bề ngang nhưng **hình tròn mất 21% diện tích** ⇒ đọc ra là "nhỏ hơn". Hình khoá là cách trả
lại phần đó. ⇒ IF lấy nguyên **nguyên tắc**, tính lại **số** cho vùng an toàn 14.

**③ Điều đắt nhất, học từ Apple: ký hiệu là ĐỐI TƯỢNG CHỮ, không phải bức tranh.** SF Symbols không
công bố lưới px vì nó không cần — trọng lượng ký hiệu **khớp trọng lượng chữ**, cỡ ký hiệu **định
theo cap height**. Hệ quả: ký hiệu **không bao giờ** lệch nhịp với chữ bên cạnh, ở mọi cỡ.

⇒ Đây chính là thứ IF đang thiếu, và nó **giải thẳng** bệnh §1: nét không được khai bằng **pixel**,
phải khai bằng **quan hệ với hộp chứa**. Cách IF thi hành: nét khai theo **đơn vị lưới**, và lưới
co giãn theo cỡ ⇒ tỉ lệ nét/lưới là hằng số. Không cần biến font, không cần 9 trọng lượng.

**④ Điều chủ động KHÔNG lấy — nét bo tròn của Lucide.** Đo được `stroke-linecap="round"` +
`stroke-linejoin="round"`. Nó là lý do bộ đó đọc ra "web app đa dụng, thân thiện". IF là công cụ
**bản vẽ**: đường nét trong hồ sơ kỹ thuật **đầu vuông, góc nhọn**. Đây là **một tham số đổi cả
giọng sản phẩm** — và là chỗ rẻ nhất để có cái riêng.

---

## §3 · BỘ THAM SỐ CHỐT CHO IF

### 3.1 · Hình học ký hiệu

| Tham số | Giá trị | Vì sao đúng số đó |
|---|---|---|
| Lưới | **16** | 92% số lượt render ở ≤16px — lưới phải đặt ở **chỗ thật sự dùng**, không ở chỗ lý tưởng |
| Đệm | **1** | 1/16 = 6,25%, cùng bậc với Material (2/24 = 8,3%) và Carbon (2/32 = 6,25%) |
| Vùng an toàn | **14 × 14** | = 16 − 2×1 |
| Nét chính (`cat`) | **1 đơn vị = 6,25%** | đúng tỉ lệ **Phosphor regular** (đo: lưới 256, vành ngoài r=104 / trong r=88 ⇒ 16/256 = 6,25%) — bộ được coi là tinh và trầm nhất trong bốn hệ, hợp gu *quiet luxury* |
| Nét phụ (`thay`) | **0,5** | tỉ lệ **2:1** với nét chính — xem §4 |
| Nét thứ ba (`xa`) | **0,25** · **KHOÁ ở lưới 16** | 0,25px dưới sàn hiển thị mọi màn; chỉ mở từ cỡ **32** |
| Bo trong ký hiệu | **= nét chính** | luật chung của 3/4 hệ đã tra |
| Đầu nét · góc nối | **vuông · nhọn** | ngôn ngữ nét bản vẽ; chỗ đổi một tham số mà đổi cả giọng |
| Lưới toạ độ | bội số **0,5** | nét 1 tâm ở `x,5` ⇒ hai mép rơi số nguyên ⇒ ăn lưới điểm ảnh ở 1× lẫn 2× |
| Thang cỡ | **16 / 20 / 24 / 32** | bốn nấc, **cấm cỡ ngoài thang** — 35 cỡ là gốc bệnh |

**Nét thực theo cỡ** (khai theo đơn vị lưới nên tự đúng): 16→**1,00** · 20→**1,25** · 24→**1,50** ·
32→**2,00**. Tỉ lệ nét/lưới **luôn 6,25%**.

### 3.2 · Bốn hình khoá của IF

| Hình khoá | Mép ngoài | Diện tích | Tỉ lệ so vùng an toàn |
|---|---|---|---|
| Tròn | ⌀13,5 | 143,1 | 0,96 |
| Vuông | 12 × 12 | 144,0 | 0,86 |
| Dọc | 10 × 14 | 140,0 | 0,71 × 1,00 |
| Ngang | 14 × 10 | 140,0 | 1,00 × 0,71 |

Chênh lệch lớn nhất **2,8%** — chặt hơn Material (3,2%).

⭐ **Kiểm chéo tự làm:** nhân tỉ lệ IF lên vùng an toàn **20** (tức lưới 24) ra
`tròn ⌀20 · vuông ≈18 · dọc ≈16×20` — **trùng khít** hình khoá đo được từ Material Symbols.
Bộ số không phải bịa cho vừa; nó **tái lập được** một hệ đã tồn tại.

### 3.3 · Bộ tham số này phủ CẢ APP, không chỉ ký hiệu

Đây là phần trả lời chữ *"áp dụng tất tần tật"*. Mỗi dòng là một **luật đã có** được nối vào, không
phải luật mới:

| Lớp | Luật | Nguồn |
|---|---|---|
| **Nét** | hai bề dày, tỉ lệ 2:1 — áp cho nét ký hiệu, đường kẻ ngăn (`--vien-mo`), viền panel, vạch chia | mới, dẫn xuất từ bảng nét IF |
| **Hình** | 4 hình cơ bản CÓ VIỆC: chữ nhật = không gian · **chữ nhật bo = chủ đạo** · viên nang = hành động gọn/trạng thái · tròn = điểm/người | `SPEC-DESIGN-SYSTEM-IF §7` |
| **Bo** | `--r-1..4` = 6/10/14/20 + `--r-full`; đồng tâm `rInner = max(4, rOuter − pad)` khi `pad ≤ 8` | thang duyệt 12/08 |
| **Ô chạm** | `--tap` 32 · `--tap-lg` 44; cảm ứng nâng `--tap` lên 44 | `globals.css:105-110` |
| **Mật độ** | **một hệ, bốn mật độ** — Home thoáng · Tệp/Thư viện cân · 2D/3D chặt · Trình chiếu kiểu tạp chí, đi qua `--tap/--row/--gap/--pad-card/--fs-ui` | `SPEC-DESIGN-SYSTEM-IF §7` |
| **Bề mặt** | nền mờ **chỉ ở lớp vỏ**, ruột đặc; cấm nền mờ chồng nền mờ; panel nổi phải portal ra ngoài | luật K4 02/08 |
| **Chuyển động** | mở **từ tâm** · morph **giữ định danh** · `prefers-reduced-motion` thắng tất cả | `SPEC-DESIGN-SYSTEM-IF §7` |
| **Trạng thái** | màu **không bao giờ** là kênh duy nhất — luôn kèm chữ và/hoặc hình dạng | `ACTIVE-DESIGN-CONTEXT §7` |

⚠️ **Một ranh giới phải nói rõ, kẻo lẫn hệ quy chiếu:** bo **trong ký hiệu** (1 đơn vị trên lưới 16)
**KHÔNG PHẢI** thang bo giao diện (`--r-1..4`). Một cái bo *nét vẽ bên trong hình*, một cái bo *vỏ
điều khiển trên màn*. Trộn hai thang là lỗi hệ quy chiếu, không phải lỗi thẩm mỹ.

---

## §4 · CÁI RIÊNG — họ ký hiệu nghề, nằm TRONG pattern

### 4.1 · Riêng ở NGỮ VỰNG, không riêng ở LUẬT

Hai họ dùng **chung**: lưới 16 · đệm 1 · vùng an toàn 14 · bốn hình khoá · đầu nét vuông · góc nhọn
· bo = nét · thang cỡ. Khác nhau **đúng một điều**:

| | Họ **CHUNG** (12) | Họ **NGHỀ** (9) |
|---|---|---|
| Bề dày | **một** — `cat` (1) | **cặp** — `cat` (1) + `thay` (0,5) |
| Bề dày mang gì | không mang nghĩa | **mang nghĩa**: cái *bị cắt qua* ↔ cái *chỉ nhìn thấy* |

### 4.2 · Tỉ lệ 2:1 lấy từ đâu — không tự chế

`lib/three/section-entities.ts:61-63` khai ba lớp mặt cắt đang chạy thật:

| Lớp | Bề dày (mm) | Tỉ lệ |
|---|---|---|
| Mặt cắt · nét cắt | 0,70 | 4 |
| Mặt cắt · thấy | 0,35 | 2 |
| Mặt cắt · xa | 0,18 | 1 |

Ba giá trị đều nằm trong `STANDARD_LINEWEIGHTS` (`lib/cad/model.ts:42` — thang ISO 128 mà IF dùng để
**in bản vẽ thật**). Và `docs/CHUAN-DAU-RA-NGHE.md:37` chốt cùng hệ:
*"Lineweight theo bảng: tường cắt ~0.5 · thấy ~0.25 · dim/hatch 0.13."*

⇒ Quy về đơn vị lưới 16: **1,0 / 0,5 / 0,25**. Nấc thứ ba khoá lại vì dưới sàn hiển thị.

### 4.3 · Chín ký hiệu nghề — năm cái đầu do hồ sơ chỉ định, không do tôi chọn

`docs/CHUAN-DAU-RA-NGHE.md:39` liệt kê **ký hiệu tối thiểu** của một bản vẽ đạt chuẩn:
*"cửa có cánh mở · cốt ±0.000 · hoa gió · trục bong bóng · thước tỷ lệ"*. Bộ ký hiệu chỉ việc nói
đúng thứ tiếng mà hồ sơ đã nói.

| Ký hiệu | Vẽ gì | Cặp nét dùng thế nào |
|---|---|---|
| Tường | hai mặt tường + gạch chéo poché | mặt tường **cắt**, gạch chéo **thấy** |
| Cửa | tường hai bên + cánh + cung quét | tường/cánh **cắt**, cung quét **thấy** |
| Cửa sổ | tường ngắt quãng + khung + nét kính | tường/khung **cắt**, kính **thấy** |
| Trục | vòng bong bóng + nét chấm-gạch | vòng **cắt**, trục **thấy** (chấm-gạch) |
| Cao độ | đường gióng + tam giác nửa đặc | đường gióng **thấy**, tam giác **cắt** |
| Mặt cắt | hai đoạn cắt đậm + thân mảnh ngắt + mũi hướng nhìn | hai đầu **cắt**, thân **thấy** |
| Tỷ lệ | bốn ô so le + vạch chia | ô **cắt**, vạch **thấy** |
| Hoa gió | vòng định hướng + kim nửa đặc | kim **cắt**, vòng **thấy** |
| Bắt điểm | ô vuông bắt điểm + trục gióng | ô **cắt**, trục gióng **thấy** |

### 4.4 · Vì sao đây là cái riêng THẬT — bằng chứng, không phải khẩu hiệu

Đo cột "trước" của chín ký hiệu nghề trong `components/`:

| Khái niệm nghề | Đang vẽ bằng gì | Bằng chứng |
|---|---|---|
| **Tường** | một **hình vuông** | `components/render-studio/Command3DPanel.tsx:260` — `{ id: 'tuong', en: 'Wall', icon: Square }` |
| **Sàn** | một **gạch ngang** | cùng tệp — `icon: Minus` |
| **Mái** | `PanelTop` | cùng tệp |
| Cửa | `DoorOpen` (ký hiệu web đa dụng) | 6 lượt |
| Tỷ lệ | `Ruler` | 26 lượt |
| Hoa gió | `Compass` | 11 lượt |
| Bắt điểm | `Crosshair` | 15 lượt |
| **Cửa sổ · Trục · Cao độ · Mặt cắt** | **không có ký hiệu nào** | — |

⇒ **Năm trên chín** khái niệm nghề **không có ký hiệu**; bốn cái còn lại mượn **hình học chung
chung**. Kiến trúc sư nhìn hình vuông **không** đọc ra "tường" — họ đọc ra "hình vuông" rồi phải học
thuộc. Ký hiệu tường cắt thì **họ đã biết trước khi mở IF**.

Khớp đúng dòng `docs/00-CHOT.md` 16/08: *"Ký hiệu nghề là loại DUY NHẤT IF có mà đối thủ đa dụng
không có"* — kèm dòng khai thật *"hiện nó CHƯA ĐƯỢC LÀM"*. Chín ký hiệu này là lần đầu nó được làm.

### 4.5 · Bảy loại ký hiệu (00-CHOT 16/08) — bộ mới nằm ở đâu

Không đẻ phân loại thứ hai. Bộ này phủ **loại 1 và loại 2**; năm loại còn lại giữ nguyên luật cũ:

| # | Loại | Bộ này có phủ? |
|---|---|---|
| 1 | Icon giao diện | ✅ họ **chung** (12) — luôn có nhãn (NT-8) |
| 2 | Ký hiệu nghề | ✅ họ **nghề** (9) — lần đầu được làm |
| 3 | Icon nén tin | ✅ dùng lại họ chung/nghề, **luôn kèm SỐ** |
| 4 | Hình minh hoạ | ❌ `lib/ui/thao-tac-glyph.tsx`, khổ 220×110 — xem §6 |
| 5 | Dấu trạng thái | ❌ chấm/vạch/quầng — không phải ký hiệu vẽ |
| 6 | Nhãn loại tệp | ❌ ruột là chữ |
| 7 | Ảnh đại diện người | ❌ ảnh chụp |

---

## §5 · ÁP VÀO NĂM BỀ MẶT THẬT — kiểm "tất tần tật"

Bản vẽ §5 dựng cả năm cạnh nhau. Cả năm dùng **đúng một** thang bo, **đúng một** bộ ký hiệu,
**đúng một** luật ô chạm, **đúng một** cặp nét — khác nhau **chỉ ở mật độ**.

| Bề mặt | Cỡ ký hiệu | Mật độ | Hình khoá/hình cơ bản chi phối | Pattern có phủ? |
|---|---|---|---|---|
| **Home · khung thẻ** | 16 (nén tin: 14) | thoáng | chữ nhật bo `--r-3` · viên nang cho trạng thái | ✅ |
| **Thanh điều hướng** | 20 ở rail · 16 ở kệ | cân | nút 44 bo `--r-2`; ba cụm ngăn bằng vạch `--vien-mo` | ✅ |
| **Thanh công cụ 2D** | 20 | chặt | **viên nang** `--r-full`; đồng tâm vỏ 44/r22 − đệm 5 ⇒ ô 34/r17 | ✅ |
| **Panel trục phải** | 16 ở hàng · 16 ở thấu kính | chặt | chữ nhật bo `--r-1` cho ô thấu kính; nhãn sự thật = **viên nang có chữ** | ✅ |
| **Trình chiếu** | 10–14 ở chân trang | kiểu tạp chí | chữ nhật `--r-1`; trang giấy là chữ nhật thuần | ⚠️ xem dưới |

⚠️ **Một chỗ pattern phải nới, và nới CÓ LÝ DO:** chân trang hồ sơ dùng ký hiệu ở **10px** — dưới
sàn 16 của thang. Nhưng đó **không phải giao diện**, đó là **nội dung in ra giấy**: ở khổ A3 in
300dpi, 10px trên màn tương đương ~2,4mm trên giấy, thừa để đọc. ⇒ **Bản in là ngoại lệ có tên, có
phạm vi**: thang cỡ giao diện áp cho *màn hình*; bản in đi theo `CHUAN-DAU-RA-NGHE`, đơn vị **mm**
chứ không phải px.

⭐ **Vòng khép mà không công cụ đa dụng nào có:** ba ký hiệu nghề (tỷ lệ · cao độ · hoa gió) học ở
thanh công cụ thì **đọc lại được ở chân trang hồ sơ giao khách** — vì đó vốn là ký hiệu của bản vẽ,
không phải ký hiệu của phần mềm.

---

## §6 · PHÉP THỬ: KHẨU ĐỘ VITALS

Hoà bắt đọc spec Vitals **trước** khi dựng hệ hình. Lý do đúng: **Vitals là chữ ký** — pattern nào
không giải thích được khẩu độ thì pattern đó chưa đủ.

Spec đang hiệu lực — `CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` **điều 7**: *Vitals nằm **VẬT LÝ trong
mép trên** như khẩu độ sống (**không phải popover gắn lên**) · 3 mức Ambient → Peek (1–3 insight) →
Engage · **morph nhẹ theo ngữ cảnh, không giật***.
🔴 Bản này **ĐÈ** chốt 16/08 (*chấm cạnh ô tìm · nút rời cạnh trục phải*) — bản cũ **SUPERSEDED**.

Ba mức dựng **chỉ bằng** tham số §2–§3, không thêm luật:

| Tham số | Khẩu độ dùng nó thế nào |
|---|---|
| Viên nang **có việc** | cả ba mức bo `--r-full` ở hai góc dưới ⇒ **morph giữ định danh**: *một vật nở ra*, không phải ba vật thay chỗ |
| **Mở từ tâm** | ba mức **cùng tâm ngang**, nở đối xứng từ chính khẩu độ — không trượt vào từ mép |
| **Ba nấc = ba công năng** | Ambient *có/không* → Peek *là chuyện gì, ở đâu* → Engage *hệ quả + việc phải làm*. Mỗi mức thêm **một lớp tin** mức trước **không thể** mang |
| Ánh sáng chỉ mang nghĩa (NT-11) | vạch nhấn ở Ambient là **tín hiệu duy nhất** của mức đó; tắt khi không có gì đáng biết |
| **Cặp nét 2:1** | ký hiệu trong Peek là **ký hiệu nghề** (tường cắt) — người đọc biết ngay lệch nằm ở **tường**, không phải chấm than chung chung |

⭐ **Pattern giải thích được khẩu độ ⇒ pattern đủ.** Và chiều ngược lại cũng đúng: khẩu độ **ép**
pattern phải có viên nang-có-việc và luật mở-từ-tâm — nếu bộ tham số chỉ nói về ký hiệu thì nó
không dựng nổi mức Engage.

---

## §7 · CHỖ PATTERN **KHÔNG** PHỦ ĐƯỢC — nói thẳng

| Chỗ | Vì sao không với tới | Phần pattern **vẫn** giữ |
|---|---|---|
| **Ảnh đại diện người** (loại 7) | ảnh chụp: không nét, không hình khoá, không đổi màu theo nền | chỉ cái **vỏ** — hình khoá tròn ⌀ = vùng an toàn · chữ viết tắt khi chưa có ảnh · xếp chồng "+N" |
| **Nhãn loại tệp** (loại 6) | ruột là **chữ**, do bộ chữ định đoạt | ô bọc + bo + ô chạm. Cũng là chỗ **duy nhất** được dùng màu riêng theo loại — nó là **nội dung**, không phải giao diện |
| **Hình minh hoạ thao tác** | khổ 220×110, vẽ cả bối cảnh; nét hiện là **1,4 / 1**, không phải cặp 1 / 0,5 | nguyên tắc hai bề dày thì giữ, **con số phải quy về cặp 2:1**. 🔴 **Nợ thật, chưa làm** — đụng tệp đang có, ngoài phạm vi lượt này |
| **Nội dung của người dùng** (ảnh render · bảng vật liệu · moodboard) | áp ngôn ngữ IF lên đó là **vi phạm luật trung tính** — nhận diện thuộc dự án của khách | **không áp gì cả**, cố ý. Chỉ khung bọc theo hệ |
| **Trục toạ độ 3D** | X/Y/Z đỏ/lục/lam là quy ước **liên ngành**; đổi cho hợp một màu nhấn là hỏng thứ người dùng đã biết | ngoại lệ **có tên, có phạm vi** — chỉ trong khung nhìn 3D, không lan ra vỏ app |
| **Biểu đồ · thước tiến độ** | dữ liệu nhiều chuỗi cần nhiều màu; một màu nhấn không đủ | bề dày nét · lưới · bo theo hệ; **bảng màu dữ liệu là hệ riêng**, phải khai riêng |
| 🔴 **Năm nhãn sự thật** (Đo được/Đã kiểm/Suy ra/Ngoài/Cũ) | cần **năm** trạng thái phân biệt được, mà phổ màu gần cạn: đỏ·vàng·lục đã mang nghĩa, tím là màu nhấn | **CHƯA GIẢI ĐƯỢC.** Bản vẽ đi đường **chữ + viền**, không dùng màu — đúng luật nhưng **chưa chắc đủ đọc nhanh**. Xem Q2 |
| **Bản in ≥300dpi** | đơn vị là **mm**, không phải px; sàn cỡ 16 không áp được | thang cỡ giao diện áp cho *màn hình*; bản in theo `CHUAN-DAU-RA-NGHE` |

---

## §8 · BẢNG BỐN CỘT (luật `N5`) — tự chấm trước khi giao

| Bề mặt | ① tầm nhìn | ② chuẩn ngành | ③ spec | ④ visual | Kết |
|---|---|---|---|---|---|
| **Bộ tham số hình học** | `N-16` (máy không phán được gu ⇒ quy về số): lưới/nét/bo/hình khoá **đều là số đo được** · `N-20` câu ②: ký hiệu nghề đẩy thẳng về *"đúng chuẩn ngành, không đánh rơi ngữ cảnh"* | Material · Carbon · Lucide · Phosphor · SF Symbols (§2, có URL + số tự đo) · `NT-8` ký hiệu luôn có nhãn | `SPEC-DESIGN-SYSTEM-IF §7` 4 hình cơ bản có việc · thang bo 12/08 · `EXS 11` *"ký hiệu đọc nghĩa <1 giây, cấm hình trừu tượng"* | `docs/mocks/mock-design-pattern-toan-app.html` §2 lưới + hình khoá | ✅ |
| **Họ nghề, cặp nét 2:1** | `N-1` hào ở **hiểu sâu nghề**, không ở số tính năng | `CHUAN-DAU-RA-NGHE:37` bảng bề dày · `:39` ký hiệu tối thiểu · `STANDARD_LINEWEIGHTS` (ISO 128) | `00-CHOT` 16/08 bảng bảy loại, loại 2 *"Ký hiệu nghề"* + `khung-mot-khuon` 14/08 *"dùng ký hiệu bản vẽ ISO làm icon"* | bản vẽ §3 (ba ca cặp nét ở 64px) + §4 chín ô đối chiếu | ✅ |
| **Thang cỡ 16/20/24/32** | `N-10` cờ đỏ *"thẻ-cho-mọi-thứ"* cùng họ với *cỡ-cho-mọi-chỗ* | cỡ quang học: Carbon vẽ riêng 16/20/24/32 · Material trục `opsz` · SF Symbols 3 nấc | `ACTIVE-DESIGN-CONTEXT §7` — mật độ đổi qua token, **không đổi hệ** | bản vẽ §1 hai dải so sánh | ⚠️ **cần Hoà chốt** — xem Q1 (đổi mật độ nhiều màn) |
| **Áp lên 5 bề mặt** | `N-17` trượt bố cục thì dừng đánh bóng — nên bày **bố cục thật**, không bày bảng màu | `KB-1` thanh công cụ một khuôn, lấy dock viên nang làm gốc | `EXS 3+4` sidebar ba cụm/ba độ sâu · `EXS 9` chồng thấu kính · `EXS 10` bộ dùng 4–8 | bản vẽ §5 · board `EXS-B` (bàn thử "che logo, 9 màn cạnh nhau") | ✅ |
| **Khẩu độ Vitals** | `N-20` câu ②: khẩu độ là chỗ *"điều đáng biết ngay"* — đúng lời hứa không đánh rơi ngữ cảnh | — *(không có chuẩn ngành cho khẩu độ mép trên; đây là phát minh của IF)* | `EXS 7` (3 mức, mép trên, không phải popover) · `D-DR1` 04/09 | board `EXS-E` · bản vẽ §6 | ⚠️ `[KHÔNG TRA ĐƯỢC]` cột ② — xem Q4 |
| **Bảng màu 5 nhãn sự thật** | `N-10` cờ đỏ *"màu là kênh duy nhất"* | `NT-8` · WCAG 1.4.11 (3:1 thành phần) | `EXS 9` liệt 5 nhãn nhưng **không nói phân biệt bằng gì** | `[KHÔNG TRA ĐƯỢC]` — không board `EXS-*` nào có ca năm-trạng-thái | 🔴 **chưa xong** — xem Q2 |

**Cột trống được khai đúng luật `N5`:** hai ô `[KHÔNG TRA ĐƯỢC]` ở trên **không** ghi *"đạt"*, và cả
hai đều có câu hỏi kèm.

### Trợ năng — đo tại nguồn, không tính tay

Chạy `lib/ui/design-tokens` + `lib/adaptive-contrast` trên đúng giá trị token đang chạy:

| Cặp | Tối | Sáng | Ngưỡng |
|---|---|---|---|
| `--t1` / `--bg` — tiêu đề | 17,95 | 14,47 | 4,5 ✅ |
| `--t2` / `--card` — chữ trong thẻ | 11,98 | 9,96 | 4,5 ✅ |
| `--t3` / `--panel` — ghi chú | 6,93 | 4,90 | 4,5 ✅ |
| `--t1` / `--panel` — ký hiệu IF | 16,89 | 15,66 | 3 ✅ |
| `--t4` / `--card` — ký hiệu cột "cũ" (cố ý mờ) | 3,44 | 3,04 | 3 ✅ |
| `--accent` / `--panel` — vạch khẩu độ | 3,76 | 4,61 | 3 ✅ |

🔴 **Vòng đo bắt một lỗi thật của tôi:** bản đầu dùng `--t4` cho **chữ** nhãn — đo ra **3,65 tối /
2,86 sáng**, **trượt** 4,5:1 ở cả hai nền. Đã đổi sang `--t3` (6,93 / 4,90). `--t4` nay **chỉ còn**
ở phần tử đồ hoạ (nét ký hiệu cột "cũ", đường hình khoá), nơi ngưỡng là 3:1 và nó đạt.

---

## §9 · CÂU HỎI PHẢI HỎI — không tự quyết (luật `N3`)

**Q1 · Sàn cỡ 16 — chấp nhận đổi mật độ nhiều màn không?**
Hiện 92% số lượt ở ≤16px, riêng cỡ 13 chiếm 303 lượt. Lên sàn 16 làm ký hiệu **to lên** ở rất nhiều
hàng danh sách ⇒ **đổi mật độ nhiều màn**.
· (a) **giữ sàn 16**, chấp nhận đổi mật độ — sạch, một hệ, nhưng đụng bố cục nhiều chỗ
· (b) thêm nấc **12** vẽ RIÊNG (kiểu Carbon vẽ riêng từng cỡ) — giữ mật độ hiện tại, nhưng **gấp đôi
công vẽ** và mở cửa cho nấc thứ ba
· (c) giữ sàn 16 **cho ký hiệu bấm được**, cho phép 12–14 cho ký hiệu **nén tin** (luôn kèm số)
→ Tôi nghiêng **(c)**: nó cắt đúng theo *công năng*, không theo *chỗ trống*. Nhưng đây là **đánh đổi
bố cục**, không suy được từ luật đã ghi ⇒ **hỏi**.

**Q2 · Năm nhãn sự thật phân biệt bằng gì?**
· (a) **chữ + viền** (bản vẽ đang đi) — an toàn, đọc chậm
· (b) **năm hình dạng** khác nhau — đọc nhanh, phải học
· (c) mượn thêm một cửa màu — **đụng phổ đã gần cạn**
→ Không có tham chiếu nào trong `EXS-*` cho ca năm-trạng-thái. **Không tự chế rồi khai đạt.**

**Q3 · Đổi 206 tệp một lần hay theo bề mặt?**
Đổi dần thì **hai bộ chạy song song** một thời gian — mà hai bộ cạnh nhau còn **tệ hơn một bộ xấu**,
vì lệch trở nên nhìn thấy được. Cần chốt **thứ tự bề mặt** và **có chấp nhận giai đoạn lẫn** không.

**Q4 · Khẩu độ Vitals không có chuẩn ngành để đối chiếu — có cần đi tìm không?**
Cột ② của nó là `[KHÔNG TRA ĐƯỢC]`: khẩu độ mép trên ba mức là **phát minh của IF**, không hệ nào có
để mượn. Gần nhất là **Dynamic Island** (iOS) — cùng ý *mép màn hình là nơi thông tin sống*. Có nên
tra sâu nó làm cột ②, hay chấp nhận cột ② trống vì đây đúng là chỗ IF đi trước?

---

## §10 · CHƯA CHẮC / CHƯA KIỂM

- **Chưa chạy trên ứng dụng thật một dòng nào.** Mọi kết luận về ký hiệu mới đến từ **bản vẽ tĩnh**
  mở bằng trình duyệt, không phải từ màn thật có dữ liệu thật.
- **Chỉ đo trên Chromium 1194**, `deviceScaleFactor: 2`. **Chưa thử 1×** — mà 1× chính là nơi luật
  "toạ độ bội số 0,5" được thiết kế để cứu. Tuyên bố *"ăn lưới điểm ảnh ở 1×"* là **suy từ hình
  học**, chưa phải quan sát.
- **Chưa thử trình đọc màn hình thật**, chưa thử Safari/Firefox.
- **Hai skill tự chấm (`design-critique`, `accessibility-review`) KHÔNG có trong phiên này** — đã
  tìm, không thấy. Thay bằng: đọc ảnh chụp bằng mắt (bắt **3 lỗi bố cục**: thanh điều hướng bị cắt
  cụm thứ hai · lưới ba cột đẻ hộp rỗng · khẩu độ đè chữ) + đo tương phản bằng công cụ của chính
  repo (bắt **1 lỗi trợ năng**).
- **Con số "35 cỡ" và "1.188 lượt"** đến từ một biểu thức chính quy quét `<Component … size={N}>`.
  Nó **bỏ sót** cỡ truyền qua biến (`size={co}`) và cỡ đặt bằng CSS ⇒ **35 là sàn, không phải trần**.
- **Chín ký hiệu nghề chưa được kiến trúc sư nào đọc thử.** Tuyên bố *"kiến trúc sư đọc được ngay"*
  dựa trên **quy ước bản vẽ**, chưa dựa trên **người thật**. Đây là chỗ dễ sai nhất của cả bài, vì
  tôi không phải người trong nghề — `EXS 11` đòi *"đọc nghĩa <1 giây"* mà tôi **không đo được**.
- **Văn bản ISO 128 / ISO 4157 gốc: `[KHÔNG TRA ĐƯỢC]`** — tiêu chuẩn bán tiền và tên miền bị chặn.
  Tôi neo vào **nguồn thứ cấp trong chính repo** (`STANDARD_LINEWEIGHTS`, `section-entities.ts`,
  `CHUAN-DAU-RA-NGHE.md`) đã được dùng để in bản vẽ thật. Đủ để nhất quán **nội bộ**, **không** đủ
  để tuyên bố *"đúng ISO"*. Cần người có bản tiêu chuẩn xác nhận trước khi in câu đó lên tài liệu bán hàng.
- **Bộ mới mới có 21 ký hiệu**, ứng dụng đang dùng **125** tên. Danh sách còn thiếu **phải lập
  trước** khi đổi, kẻo đổi nửa chừng thành hai bộ song song.

---

## §11 · NẾU ĐƯỢC ĐI TIẾP — thứ tự đề xuất

1. **Chốt Q1** (sàn cỡ). Mọi việc sau phụ thuộc câu này.
2. **Lập danh sách 125 tên** → gom về ~40 khái niệm thật (phần lớn là trùng nghĩa khác tên).
3. **Vẽ nốt** phần còn thiếu theo cùng bộ tham số.
4. **Thêm máy soi `soi:ky-hieu`** — canh: cỡ ngoài thang · nét bo tròn · bề dày thứ ba · nhập thẳng
   `lucide-react` ở tệp đã chuyển. Cùng họ `soi:hinh-hoc`.
5. **Đổi theo bề mặt**, mỗi bề mặt một lượt, có ảnh trước/sau.
6. **Trả nợ** `thao-tac-glyph` về cặp nét 2:1 + sửa docstring của nó (câu *"muốn có nút thì lấy icon
   lucide"* hết đúng khi bộ này được cắm).
