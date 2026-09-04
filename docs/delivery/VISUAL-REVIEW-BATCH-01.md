# LÔ DUYỆT MẮT #1 — HOME (khổ rộng) · VITALS (khẩu độ mép trên) · CHROME TRÊN ĐI KÈM

> **Trạng thái: CHỜ MẮT HOÀ.** Máy đã xác minh hết phần máy xác minh được. Dưới đây **không có
> việc đang làm dở** — chỉ có ba tấm đã qua cổng máy, trình để Hoà phán bằng mắt.
>
> Mỗi tấm đúng năm mục: **NGUỒN LUẬT · BẢN ĐANG CÓ · LỆCH · MÁY ĐÃ XÁC MINH GÌ · HOÀ PHẢI PHÁN GÌ.**
> Trả lời chỉ cần: *"Tấm N — ĐẠT"* hoặc *"Tấm N — lệch chỗ …"*.
>
> Mốc mã: nhánh `integration/2026-09-04`, các commit `711d5c73` (thi hành D-DR1 + D-DR2) và
> `4ce173c2` (đóng bất biến MỘT CHỖ ĐỨNG).

---

## TẤM 1 · HOME — KHỔ RỘNG / MÁY BÀN

### ① NGUỒN LUẬT
- `CHOT-EXPERIENCE-SYSTEM-2026-08-20` **điều 6** — Home = **Personal Work OS**, *"mặc định tươm
  tất ngay"*, trả lời bốn câu: đang làm gì · dở đâu · cần xử gì · làm gì tiếp. **Hero = Resume CHỐT.**
- **điều 5** — mỗi stage đúng **1 Primary + 1 Secondary spotlight**; Home: *Resume / Needs-attention*.
- **QUYẾT ĐỊNH CỦA HOÀ 04/09 (D-DR2)** — giữ EXS §6. Khổ rộng: **MỘT TIÊU ĐIỂM CHÍNH** rồi tới
  **một cụm phụ ở hạng dưới**. *"Home must NOT read as a SaaS dashboard or a 9-card bento grid."*
  Bento **không tự động bị xoá** — được phép sống tiếp làm bản **xếp dọc cho khổ hẹp**, nhưng
  **không được định hình thứ bậc của Home khổ rộng**; và *"do not preserve bento merely because
  implementation already exists."*

### ② BẢN ĐANG CÓ
- Ngưỡng đổi bố cục: **1100px**. `≥1100` = bố cục một-tiêu-điểm · `<1100` = bản xếp dọc cũ
  (bento giữ nguyên, đúng phần Hoà cho phép giữ).
- Hai cột: `minmax(0, 1.62fr) minmax(0, 1fr)` — tiêu điểm : cụm phụ. Khi cụm phụ còn ≤2 mục thì
  tỉ lệ nới thành **1.9** (tiêu điểm càng trội khi ngày-số-không).
- Cụm phụ xếp theo **thứ tự ưu tiên cố định** khai một chỗ: `chao → homNay → mocToi → ghiChu →
  vatLieu → anhTuan → bieuDo → dongTin` — đọc từ *việc phải quyết hôm nay* xuống *thứ để ngắm*.
- Mỗi mục phụ **cao đúng nội dung, CẤM CO** (`flex: 0 0 auto`) ⇒ không có chuyện các thẻ chia
  nhau chiều cao thành lưới đều — đó chính là thứ làm nó đọc ra dashboard.
- Lề ngoài `clamp(20px, 2.6vw, 52px) / clamp(20px, 3.2vw, 64px)`, thân `max-width: min(100%, 1360px)`
  ⇒ **phần dư trả về cho nền**, không nhồi vào thẻ.
- Ba trạng thái A (ngày-số-không) · B (có dự án) · C (sau demo) dùng **CÙNG một vùng tiêu điểm ở
  cùng chỗ**; dữ liệu cập bến thì dải *"Tiếp tục việc dở"* mọc lên trong đó, tiêu điểm không nhảy.

### ③ LỆCH so với nguồn luật
Không còn lệch cấu trúc. Hai điểm **cố ý** khác bản mô tả chữ, khai thẳng để Hoà bác được:
1. **Bento vẫn còn trong mã** — nhưng chỉ chạy dưới 1100px. Đúng câu *"may remain as responsive/
   narrow arrangement"*. Nếu Hoà muốn xoá hẳn thì nói, máy xoá được ngay.
2. **Ngưỡng 1100px là do máy chọn**, luật không cho số. Đây là chỗ Hoà có thể thấy sai khi nhìn
   màn thật ở khổ trung gian.

### ④ MÁY ĐÃ XÁC MINH GÌ
| Kiểm | Kết quả |
|---|---|
| Tỉ lệ tiêu điểm : cụm phụ tại **1600×900** | **767,7 : 473,9 = 1,62** — đúng tỉ lệ khai |
| Cùng phép đo tại **1280×800** | tỉ lệ **giữ nguyên 1,62** (không vỡ theo bề rộng) |
| Chiều cao các mục phụ | **173 · 144 · 309 · 224** — bốn số khác nhau ⇒ **không phải lưới đều** |
| `tsc` | 0 lỗi |
| Test lõi bố cục (`xuong-layout.test.ts`) | xanh |
| Ảnh chụp app thật | 3 khổ × 2 nền (1600×900 · 1280×800 · 900×800, sáng + tối) |

### ⑤ HOÀ PHẢI PHÁN GÌ
1. Nhìn phát đầu, **mắt có chạm đúng MỘT chỗ trước** không — hay vẫn thấy "một màn nhiều thẻ"?
2. Cụm phụ có đọc ra là **hạng dưới** không, hay nó đang ngang hạng với tiêu điểm?
3. Lề ngoài + khoảng nền dư: **thoáng đúng** hay **trống hoang**?
4. Ở khổ 900×800 (bản xếp dọc, bento) — có chấp nhận được như bản khổ hẹp không?

---

## TẤM 2 · VITALS — KHẨU ĐỘ MÉP TRÊN

### ① NGUỒN LUẬT
- `CHOT-EXPERIENCE-SYSTEM-2026-08-20` **điều 7** — Vitals là **signature interaction**: nằm
  **VẬT LÝ trong mép trên như một khẩu độ sống**, *"không phải popover gắn lên"*; ba mức
  **Ambient → Peek (1–3 insight) → Engage**; morph nhẹ theo ngữ cảnh, **không giật**.
- **điều 2** — luật không gian 5 vùng: **Top edge = "điều gì đáng biết ngay ở đây"**.
- **QUYẾT ĐỊNH CỦA HOÀ 04/09 (D-DR1)** — giữ EXS §7. Chỗ đứng vật lý = **khẩu độ mép trên**.
  Bản neo-cạnh-trục-phải **SUPERSEDED**. *"There must be ONE canonical physical Vitals host."*
  Kèm lệnh: **không xoá mù** hành vi cũ — tách **HÀNH VI** khỏi **CHỖ ĐỨNG**, hành vi nào không
  chọi EXS thì **mang lên** khẩu độ mép trên.

### ② BẢN ĐANG CÓ
- `<VitalsAperture stage={currentPhase} />` mắc **một chỗ duy nhất** — `AppChrome.tsx:366` — nên
  **mọi stage đều có**, không phải riêng Home.
- `VitalsPill` (bản chỉ-Home) đã **gỡ**. `VitalsRightEdgeHost` giữ lại làm **bia mộ**, đóng dấu
  ngay dòng đầu tệp: *"⛔ LỖI THỜI 04/09. BIA MỘ, KHÔNG PHẢI CODE SỐNG."* — giữ để phiên sau
  không đi dựng lại, **không** để chạy.
- Hành vi cứu về từ bản cũ (đúng lệnh *"đừng xoá mù"*): bảng hỏi–đáp `VitalsGesturePanel` và phím
  **⌘J** — trước đây **hỏng thật**: bảng chỉ mắc trong `StageSwitcher`, mà `StageSwitcher` đã bị
  gỡ khỏi app từ **17/08**; `StatusBar.tsx:101` vẫn gọi mở panel không tồn tại; ⌘J chết ở cả hai
  chỗ đăng ký. **Gõ câu hỏi rồi Enter là mất câu hỏi.** Nay nó sống trong khẩu độ.

### ③ LỆCH so với nguồn luật
Không còn lệch chỗ đứng. Còn **một câu chữ Hoà chưa xác nhận**, sổ đã ghi từ 20/08:
*"không phải popover gắn lên"* nghiêng về **V3-a — morph mọc ra từ chính khẩu độ**, chứ không
phải mở một tấm mới. Bản đang có làm theo V3-a. **Đây là thứ chỉ nhìn mới phán được.**

### ④ MÁY ĐÃ XÁC MINH GÌ
| Kiểm | Kết quả |
|---|---|
| `mot-cho-dung.test.ts` — 8 khẳng định | xanh: **đúng một** `<VitalsGesturePanel` mắc (`VitalsAperture.tsx:719`) · **đúng một** chỗ đăng ký ⌘J · `VitalsPill` và `VitalsRightEdgeHost` **không mắc ở đâu cả** |
| `tsc` | 0 lỗi |
| Ảnh chụp app thật | ba mức **ambient · peek · engage**, hai nền sáng/tối, trên **Home** và trên **Files** (để thấy nó theo sang stage khác) + một khung bấm **⌘J** |
| CI | xanh trên mọi head đã hoàn tất |

### ⑤ HOÀ PHẢI PHÁN GÌ
1. Ở mức **Ambient** — nó có đọc ra là **một phần của mép trên** không, hay vẫn ra dáng một cái
   nút dán lên đó?
2. **Ambient → Peek → Engage**: ba mức có ra **một vật đang nở** không, hay ra **ba vật khác nhau**?
   (Đây đúng câu *"morph nhẹ, không giật"* và đúng luật hình học 20/08 *"FROM THE CENTER"*.)
3. Mức **Engage** che bao nhiêu là vừa — hiện nó chiếm tới đâu có làm mất ngữ cảnh phía dưới không?
4. Đứng trên **Files** nhìn có còn đúng không, hay chỉ hợp với Home?

---

## TẤM 3 · CHROME TRÊN + ĐIỀU HƯỚNG ĐI KÈM

### ① NGUỒN LUẬT
- `CHOT-EXPERIENCE-SYSTEM-2026-08-20` **điều 3** — sidebar **BA CỤM** (workspace chung · ba chặng ·
  cá nhân/hệ thống), *"vertical islands cùng một trục, không sitemap 30 feature"*.
- **điều 4** — **ba độ sâu**: Rail **52–56** icon-only · Context Shelf **220–280** · Work Panel
  **320–440** kéo được. *"Vào chặng mặc định rail gọn, bảo vệ canvas."*

### ② BẢN ĐANG CÓ
- Ba nấc: **52 / 240 / 320**, Work Panel kéo được trong khoảng **320–440**.
  (Số 52 = `--tap-lg` 44 + 2×4 lề hàng — không phải số bịa.)
- Ba cụm đã đúng; hai tài liệu còn ghi "HAI CỤM" (`IF-KIEN-TRUC` §3 và `HOP-DONG-CAU-TRUC-DIEU-HUONG`)
  **đã sửa theo** trong đợt này.
- Chỗ kéo bề rộng: sửa được **một lỗi thật** khi mang về — bản gốc đọc giá trị cũ trong `closure`
  nên **lưu sai bề rộng** sau khi thả tay; nay lưu đúng số cuối.

### ③ LỆCH so với nguồn luật
- Luật cho rail **52–56**, đang lấy **52** (mép dưới của khoảng). Nếu Hoà thấy chật thì nới tới 56.
- Luật cho shelf **220–280**, đang lấy **240** (giữa khoảng).
- **Một chỗ máy chưa xác minh được, khai thẳng:** phép thử tự động **chưa kéo tới được nấc
  `duyet`** — nên phần **kéo 320→440** hiện là **CHƯA XÁC MINH**, không phải ĐẠT. Cần một lần
  Hoà kéo thử bằng tay, hoặc máy phải sửa lại phép thử.

### ④ MÁY ĐÃ XÁC MINH GÌ
| Kiểm | Kết quả |
|---|---|
| `muc-dieu-huong.test.ts` | ba nấc **đúng 52 / 240 / 320** và **tăng dần** theo thứ tự nấc |
| Ba cụm | khớp điều 3 |
| Kéo bề rộng 320→440 | 🔴 **CHƯA XÁC MINH** — phép thử không tới được nấc `duyet` |

### ⑤ HOÀ PHẢI PHÁN GÌ
1. Rail **52** — chật hay vừa? (nới tới 56 là một dòng)
2. Ba cụm nhìn có ra **ba hòn đảo trên cùng một trục** không, hay vẫn ra một danh sách dài?
3. Vào chặng, rail **có gọn đúng mức để canvas được yên** không?

---

## SAU KHI HOÀ PHÁN

- **ĐẠT** → máy chuyển ba mục này từ *xong-máy* sang **xong-mắt** trong sổ frontier (hiện tỉ số
  là **76 xong-máy / 1 xong-mắt** — đây là nút thắt Hoà đã chỉ đúng).
- **Lệch** → nói **lệch chỗ nào**, máy sửa rồi trình lại đúng tấm đó, không trình lại cả lô.
- Lô kế đã xếp hàng nhưng **chưa động tới**, đúng lệnh *"đừng đi đánh bóng bề mặt không liên quan"*.
