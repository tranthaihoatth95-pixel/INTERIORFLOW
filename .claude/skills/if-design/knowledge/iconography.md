# Icon — vấn đề là DÙNG KHÔNG NHẤT QUÁN, không phải chọn sai bộ

> Lucide là **hệ nền** của IF, trừ khi Claude Design đổi quyết định ở tầng Foundation.
> Primitive chính tắc: **`components/ui/Icon.tsx`** — đọc docstring của nó trước khi vẽ icon nào.

## 1 · CÂU HỎI MODULE NÀY TRẢ LỜI
- Dùng cỡ icon bao nhiêu? Nét bao nhiêu? Ai quyết?
- Khi nào được dùng icon tô đặc?
- Icon có bắt buộc kèm nhãn không?
- "Ưu tiên ký hiệu hơn chữ" có nghĩa là bỏ nhãn không?

## 2 · LUẬT DÙNG ĐƯỢC NGAY

**I-1 · NGỮ PHÁP HÌNH HỌC — trích nguyên văn Foundation System Sheet, cấm tự chế giá trị:**
- lưới `0 0 24 24`, vùng sống **20×20**, lề **2px**
- `stroke-width` = **1.5** — *"One value, no exceptions."*
- cỡ quang học **chỉ** `{14, 16, 18, 20}` — **buộc theo hạng điều khiển**, không chọn tự do
- `stroke-linecap` / `stroke-linejoin` = `round`
- **VIỀN là mặc định và là trạng thái nghỉ HỢP LỆ DUY NHẤT**
- màu qua **`currentColor`**, không gán màu tại chỗ

**I-2 · TÔ ĐẶC LÀ MỘT TRẠNG THÁI, KHÔNG PHẢI MỘT KIỂU ICON.** Chỉ dùng cho `selected`/`on`, và
phải là **CÙNG MỘT glyph** đi vào rồi đi ra — không phải hai hình khác nhau.

**I-3 · CỔNG LÀ KIỂU DỮ LIỆU, KHÔNG PHẢI MÁY SOI.** `ICON_SIZES = [14,16,18,20]` xuất ra làm kiểu:
truyền `13` là **`tsc` đỏ ngay dòng dùng**, không phải chờ ai đi soi. Đây là khuôn nên nhân rộng.

**I-4 · KHÔNG TRA ĐỘNG `LucideIcons[name]`.** Tra động buộc bundler gói **toàn bộ** bộ icon, và gõ
sai tên chỉ lộ lúc render trắng bệch. Caller **truyền thẳng component đã import**:
`<Icon glyph={Move} />`.

**I-5 · CÓ NHÃN ⇒ MANG NGHĨA; KHÔNG NHÃN ⇒ TRANG TRÍ, PHẢI `aria-hidden`.** Không có trạng thái thứ ba.

**I-6 · BẢY LOẠI "ICON", MỖI LOẠI MỘT LUẬT** (T chốt 16/08 theo uỷ quyền — đây là **diễn giải của
IF**, không phải chuẩn ngoài):

| Loại | Là gì | Luật riêng |
|---|---|---|
| **Icon giao diện** | quy ước chung mọi phần mềm (kính lúp · bánh răng · thùng rác) | **luôn có nhãn** (NT-8) |
| **Ký hiệu nghề** | ký hiệu bản vẽ ISO (cửa · tường · cầu thang · trục · cao độ) | KTS đọc được sẵn; nhãn có ở sidebar, toolbar không bắt buộc. ⚠️ **VIỆC CHƯA LÀM** — xem §4 |
| **Icon nén tin** | đứng thay MỘT TỪ ở chỗ chật (`🕐 2 ngày` · `📐 78 m²`) | **luôn kèm SỐ** — số mang tin, icon chỉ nói *số này là số gì* |
| **Hình minh hoạ** | vẽ THAO TÁC, không phải nút | **chỉ sống trong ô giải nghĩa**; ⛔ CẤM làm nút (khoá bằng test) |
| **Dấu trạng thái** | chấm · vạch · quầng sáng | **bắt buộc kèm nhãn chữ** — không nới |
| **Nhãn loại tệp** | ô có đuôi tệp in trong (`dwg` `idfc`) | là **NỘI DUNG**, được dùng màu riêng |
| **Ảnh đại diện người** | avatar presence | không thay bằng chữ; có đường lùi; xếp chồng "+N" |

**I-7 · "ƯU TIÊN KÝ HIỆU HƠN CHỮ" — RANH GIỚI.** Hoà chê **chữ NHỎ và NHIỀU** (khối chữ dày đặc),
**không** chê nhãn 1–2 từ.
> *Đừng dùng ĐOẠN CHỮ để giải thích thứ mà MỘT KÝ HIỆU nói được.*
Ký hiệu thắng ở chỗ người ta **lướt qua** (card nấc gọn · toolbar · trạng thái · thanh tiến trình).
Chữ giữ nguyên ở chỗ người ta **dừng lại đọc** (ô giải nghĩa · nấc đầy · thông báo lỗi · trích điều
khoản). **Ba loại sau trong bảng I-6 không đụng luật này** — bỏ nhãn ở đó là hỏng thật.

**I-8 · MÀU/HÌNH KHÔNG ĐƯỢC LÀ KÊNH DUY NHẤT** cho thông tin quan trọng. Mức đỏ/vàng phải kèm
**nhãn chữ + hình dạng**. Xem `accessibility.md`.

**I-9 · MỘT BỘ, KHÔNG TRỘN NGUỒN.** Mọi svg ngoài hệ phải khai lý do và có đường về Lucide.

## 3 · VÌ SAO — cơ chế con người
Icon hoạt động bằng **nhận dạng hình dáng ở tốc độ quét**, và nhận dạng đó phụ thuộc vào **độ nhất
quán của ngữ pháp** nhiều hơn phụ thuộc vào chất lượng từng hình. Hai icon vẽ đẹp nhưng khác nét
(1.5 vs 2.0) đứng cạnh nhau đọc ra **hai hệ**, và mắt phải xử lý thêm một tầng "cái này thuộc về
đâu" trước khi tới nghĩa.

Còn ký hiệu nghề đắt giá vì nó **không cần học**: ngành xây dựng đã chuẩn hoá bộ ký hiệu từ lâu,
KTS đọc được **trước khi mở IF**. Sáu loại kia app nào cũng làm được như nhau — loại này là chỗ
duy nhất IF có lợi thế cấu trúc, nên là chỗ đáng đầu tư sâu.

## 4 · CA HỎNG THẬT CỦA IF
- **`01-CLINICAL-UI-AUDIT` B3 · trộn nguồn icon, 13/13 bề mặt.** Không màn nào 100% lucide. Nặng
  nhất **Settings 65/75** (10 svg ngoài hệ), 2D 103/108, Present 53/55; vỏ chung (Login/Home/3D)
  **4/8 — một nửa**. Chạm mọi bề mặt ⇒ **FAIL hệ thống**.
- **23/08 · đo bằng `soi:foundation`: 1.079/1.164 vi phạm nền là icon — 93%.** Phân bố:
  cỡ `13×332 · 15×186 · 12×183 · 11×83 · 10×31 · 22×21`; nét `2×32 · 1.8×26 · 1.75×21 · 1.9×8 ·
  2.2×8 · 1.7×8`.
  ⭐ **13/15/12/11 không phải nhiễu — chúng là những thang thay thế NHẤT QUÁN.** Nhiều người, mỗi
  người chọn một cỡ hợp lý, và **không có gì giữ một thang**.
  ⇒ **Gốc bệnh là THIẾU PRIMITIVE, không phải thiếu cẩn thận.** Sửa một chỗ, không sửa 213 chỗ.
- **🔴 `Icon.tsx` — test XANH mà primitive CHƯA TỪNG CHẠY.** Test cũ chỉ khoá **hằng số** (cỡ, nét,
  viewBox); **không ca nào truyền một icon lucide thật vào**. `grep 'glyph={'` = **0 nơi dùng**.
  Và `strokeWidth?: number` hẹp hơn `LucideProps` (`string | number`) ⇒ **`tsc` đỏ ngay dòng dùng**
  với mọi icon lucide thật.
  > Đúng bài học 15/08 (bug Hough): **test khẳng định đường THOÁI LUI mà không có test nào khẳng
  > định đường CHÍNH chạy được thì đó là test CHE bug, không phải test bảo vệ.**
- **Ký hiệu nghề — khai lại cho đúng: VIỆC CHƯA LÀM, không phải vốn sẵn có.** Đo được: nó chỉ tồn
  tại như **nét vẽ trong bản vẽ** (`lib/cad/commands.ts:491`); thanh công cụ vẫn **11/11 lucide**
  (`command-icon.tsx:13-16`). Khai vống một loại là vốn-sẵn-có chính là thứ khiến phiên sau tưởng
  có rồi, đi tìm không thấy, rồi tự chế lại (tội N8).

## 5 · KIỂM THẾ NÀO
1. `npm run soi:foundation` — cỡ · nét · nguồn icon.
2. `grep -rn "strokeWidth=" components/` — còn chỗ nào tự đặt nét khác 1.5?
3. Đếm svg ngoài lucide trên màn: phải là 0, hoặc có khai lý do.
4. Mỗi icon: có `label` không? Không có thì có `aria-hidden` không? (I-5)
5. Icon tô đặc nào đang là **trạng thái nghỉ**? (sai I-2)
6. Với mỗi icon mới, xếp nó vào **một trong bảy loại** I-6 rồi mới áp luật nhãn.
7. Trước khi tin một test icon: nó có truyền **một glyph lucide thật** vào không?

## 6 · ĐÀO SÂU
- `components/ui/Icon.tsx` — docstring là nguồn luật, kèm bằng chứng đo 23/08
- `docs/design-campaign/01-CLINICAL-UI-AUDIT.md` B3
- `docs/00-CHOT.md` 16/08 — bảy loại icon, ranh giới "ưu tiên ký hiệu hơn chữ"
- `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` NT-8 · NT-10
- `scripts/soi-foundation.mjs`
