# P-O · Năm bộ hình nền hệ thống — báo cáo phiên (16/08)

> Phiếu: `docs/phieu-giao/P-O-5-bo-hinh-nen-dong.md` · khuôn 6 phần `docs/CLAUDE.md`.
> Mốc git lúc nhận việc: `544999f`, `HEAD..main = 0` ✅ (⓪b đạt).

---

## 1 · Tổng quan

Dựng xong **năm bộ hình nền hệ thống sinh bằng MÃ** (không tệp ảnh nào), đổi ánh sáng theo giờ
bằng chính máy `lib/home/time-of-day.ts` đã chạy thật, có **chậm dần rồi dừng hẳn** khi vào
dashboard, và có **bảng tương phản tại chân chữ đạt ở cả 240 phép đo** (5 bộ × 4 thời điểm ×
2 theme × 2 bề mặt × 3 bậc chữ) — kiểm bằng test tất định, không bằng mắt.

Kết phiên: `tsc` 0 · 134 phép kiểm mới 0 fail · `soi:frontier` 0 lệch · `soi:hinh-hoc` 10 (giữ
mốc) · `soi:thao-tac` 31+193 (giữ mốc, tệp mới 0 dính) · `check:mocks` bản vẽ mới 0 vi phạm.

---

## 2 · Chi tiết từng mục

### ⓪ Bốn tiền đề — **xác nhận cả bốn**, một chỗ bổ sung

| # | Tiền đề | Kết luận |
|---|---|---|
| 1 | `public/wallpapers/` rỗng ⇒ cấm ảnh dự án studio | ✅ — **bổ sung**: thư mục **không tồn tại**, không phải "rỗng" (`ls` báo *No such file*). Kết luận không đổi, mạnh thêm. |
| 2 | `lib/home/time-of-day.ts` đã có máy ánh sáng theo giờ | ✅ đúng từng tên hàm (`timeOfDayFromHour` · `timeOfDayNow` · `sunPosition`) |
| 3 | ánh sáng kể giờ là chữ ký · NT-11 cấm glow tĩnh | ✅ |
| 4 | A2: nền **có hình và để NÉT**, kính đủ đặc, không phủ kín màn | ✅ |

### ⭐ NỘI LỰC PHÁT HIỆN THÊM — [Đ2] "nhìn vào trong trước"

Phiếu không nêu, nhưng đo ra hai thứ đã có và **quyết định lại hình dạng lời giải**:

| Đã có | Ở đâu | Dùng thế nào |
|---|---|---|
| **5 nền động sinh bằng code** (`aurora·dots·contour·dust·silk`) | `components/entry/LoginBackdrop.tsx:134` + CSS `globals.css:1319-1455` | **Bằng chứng sống rằng nền-sinh-bằng-mã đã chạy thật trong IF từ 20/07** — không phải hướng mới chưa ai thử. Nhưng chúng là nền **màn ĐĂNG NHẬP**, **không đổi theo giờ** (grep `time-of-day` trong file đó = 0), và tông **ẤM** (di sản) — nên là nền tảng tinh thần chứ không tái dùng trực tiếp. |
| **Máy đo tương phản** (`relLuminance`·`contrastRatio`·`blend`·`grayForLuminance`) | `lib/adaptive-contrast.ts` | **Dùng lại nguyên**, không viết lại dòng nào. Đây là thứ biến V4 từ "nhìn thấy ổn" thành "test khẳng định". |

### V1 · QUYẾT ĐỊNH KIẾN TRÚC — **SINH BẰNG MÃ** (marker `hinhNenNguon`)

**Quyết: sinh bằng mã. Không bác đề xuất của T — nhưng lý do quyết định KHÁC lý do T nêu.**

T xếp đầu là *0 byte bộ cài*. Đo xong thì lý do đó chỉ đứng thứ ba. Lý do số 1 là:

> ⭐ **Nền là mã ⇒ tương phản trở thành thứ CHỨNG MINH ĐƯỢC BẰNG MÁY, LÚC BUILD.**

Vì màu tại mọi điểm là số đã biết, `lib/wallpaper/contrast.ts` giải được nền hiệu dụng tại chân
chữ và `contrast.test.ts` khẳng định 240 phép đo trong một lệnh. **Nếu nền là 20 tệp ảnh thì
tương phản chỉ đo được lúc CHẠY, bằng canvas, trên máy người dùng — không có cửa nào chặn trước
khi ship.** Điều này thi hành thẳng luật Hoà chốt 15/08: *"kiểm tiêu chuẩn là việc của MÁY,
không phải của AI"*. Đây là lập luận T nên dùng lần sau, mạnh hơn lập luận dung lượng.

**Bảng đối chiếu, có số:**

| Trục | Sinh bằng mã (chọn) | 20 tệp ảnh (5×4) |
|---|---|---|
| Kiểm tương phản | **lúc build, 240 phép, tất định** | lúc chạy, canvas, không chặn được |
| Byte bộ cài | **0** | ~12–24 MB (JPEG q82 @2560×1600) — và Electron đóng gói cả `app.asar` |
| Độ phân giải | **mọi màn**, kể cả 5K/ultrawide | cố định, phóng là vỡ hoặc phải thêm bộ @2x |
| Chuyển giữa 2 thời điểm | nội suy màu, **1 lớp** | crossfade **2 ảnh toàn màn** — 2 lần decode |
| Luật trung tính | **bảo đảm bằng CẤU TRÚC** — không có chỗ nào nhét ảnh vào | bảo đảm bằng **kỷ luật** — và kỷ luật đã hỏng một lần: `public/wallpapers/` từng chứa 53 render khách (AUDIT-BRAND-PII 🔴 #2) |
| Giấy phép | không có tài sản bên thứ ba | mỗi ảnh phải tự kiểm giấy phép **phát hành thương mại** + ghi `LICENSE-NOTES` (đúng bài học GPL/libredwg) |
| Rủi ro | **đẹp tới đâu là chuyện phải chứng minh bằng mắt** | ảnh chụp thật thì đẹp sẵn |

**Rủi ro của phương án chọn — đã thử thật, có hình, và đã sửa một vòng:**
vòng 1 dùng dải sáng `[0.022 … 0.19]`, **qua hết cửa tương phản nhưng mở bản vẽ ra thì năm bộ
gần như đen tuyền, không phân biệt được**. Đây đúng loại lỗi tsc/test không bắt. Đã tính lại
biên trên **từ tương phản chứ không đoán** (chữ `--t3` kem đạt 4.5 khi kênh nền ≤ **138**) rồi
nâng dải lên `[0.05 … 0.34]` — còn dư biên rộng mà cấu trúc đã đọc ra được. Ảnh chụp 1440×900
xác nhận (§4).

### V2 · Năm bộ (marker `boHinhNen`) — khác nhau về **CƠ CHẾ**, không phải năm màu

| Bộ | Cơ chế | MỘT CÂU nó là gì | hue | sat | spread |
|---|---|---|---|---|---|
| **Chân trời** | `horizon` | Bầu trời một ngày — quầng sáng chạy dọc chân trời theo đúng vị trí mặt trời. | 215° | .11 | 1.00 |
| **Ô cửa** | `aperture` | Nắng lọt qua ô cửa — góc vệt sáng nghiêng theo giờ trong ngày. | 232° | .07 | 0.92 |
| **Bình độ** | `contour` | Bản vẽ — chỉ có nét, ánh sáng làm nét lộ ra hay chìm đi. | 205° | .05 | 0.42 |
| **Tầng sâu** | `strata` | Chiều sâu khí quyển — các lớp lùi dần, sương dày lên về đêm. | 248° | .09 | 0.74 |
| **Mặt phẳng** | `plane` | Một tấm vật liệu — ánh sáng liếm qua mép, hạt mịn nổi lên. | 222° | .035 | 0.34 |

Ba ràng buộc **máy kiểm**, không phải lời hứa (`sets.test.ts`):
- ⛔ **không lấn phổ màu nghĩa** — cách màu nghĩa gần nhất ≥ 20°, và bảng góc màu có **drift-guard**:
  test đọc thẳng `globals.css`, tính lại hue từ hex `--danger/--warning/--success`, lệch >2° là đỏ.
- ⛔ **sat ≤ 0.12 ⇒ không bộ nào khoá vào màu nhấn** — hai ứng viên chưa chốt (mòng két 185° ·
  mận 335°) đều cách mọi hue nền ≥ 15°, và ở mức bão hoà này góc màu gần như không đọc ra được.
- ⛔ **5 cơ chế khác nhau + 5 spread khác nhau** — chống đúng lỗi "năm màu của cùng một thứ".

⭐ **Nền MANG TIN, không trang trí** (NT-11 + B12): quầng sáng đứng đúng chỗ mặt trời đang
đứng (`sunPosition.xPercent`), góc vệt nắng nghiêng theo giờ (118°→186°), mặt trời lặn thì bộ
`horizon` tắt quầng và bộ `aperture` đổi sang ánh sáng nhân tạo hắt từ mép dưới. Nhìn nền là
biết mấy giờ.

⚠️ **Nhiệt độ màu — khai thẳng:** cả năm bộ ở nửa **LẠNH** (193–268°). Cố ý, đúng chốt 03/08
*"IF lạnh"* + A4 *"nền sáng canh Apple, ngả LAM"*. **Không có bộ ấm nào** — nếu Hoà muốn một bộ
ấm thì đó là quyết định phá chốt hai-nhiệt-độ, phải chốt riêng, không phải việc T tự thêm.

### V3 · Chậm dần rồi DỪNG HẲN (marker `chamDanDung`)

| Việc | Con số / cách làm | Vì sao |
|---|---|---|
| Thời lượng | **2400 ms** | chuyển cảnh nhỏ đã chốt 180–220ms là *đổi trạng thái*; đây là *hạ cánh cả một màn*, phải dài hơn hẳn mới đọc ra "đang chậm lại". Trần trên là kiên nhẫn (~3s), 2400 nằm dưới. |
| Đường cong | `cubic-bezier(.16, 1, .3, 1)` | đi gần hết quãng đường trong ~1s đầu, ~1.4s sau là phần **lắng** — chính đuôi dài đó tạo cảm giác chậm dần. `y2 = 1` ⇒ đạo hàm cuối = 0 ⇒ **không bật cụp**. |
| Biên độ | scale 1.045 → 1, dịch 8px → 0 | nền không được cướp sự chú ý |
| Vòng lặp | **KHÔNG có** | vòng lặp chạy mãi = trang trí = phạm NT-11 |

🔴 **"DỪNG HẲN" = NGỪNG TIÊU CPU/GPU — chứng minh bằng bốn thứ, không bằng lời:**
1. `settleStyle('stopped')` trả object **không còn `transition`/`animation`**, `willChange:'auto'`,
   `transform:'none'` — `settle.test.ts` khẳng định bằng hàm `daDungHan()`.
2. Trên DOM có **`data-wp-motion`** ba giá trị `entering → landing → stopped`; `stopped` chỉ
   xuất hiện **sau `transitionend`**, tức sau khi trình duyệt đã thật sự xong việc. Soi DOM là
   thấy — bản vẽ in thẳng chuỗi này ra thanh điều khiển, đọc được bằng mắt.
3. **Toàn hệ hình nền có 0 `requestAnimationFrame` lặp và 0 `setInterval`.** Nhịp thời gian là
   **một `setTimeout`** hẹn tới mốc 30 phút kế tiếp (`msToiMocSau`) — giữa hai mốc khung hình
   đứng yên tuyệt đối. (rAF duy nhất trong file là **một khung** để ép trình duyệt nhận style
   đầu, rồi huỷ.)
4. `nenCss()` **không sinh ra chuỗi `animation` nào** — test khẳng định trên cả 40 tổ hợp.

🔴 **`prefers-reduced-motion` ⇒ 0 chuyển động**, vào thẳng khung cuối — không phải "chậm hơn".
Test khẳng định style lúc reduced-motion **giống hệt** style lúc đã dừng.
⚠️ **Không khoá tay người dùng**: lớp nền `pointer-events:none` + `aria-hidden`, không overlay
nào chặn — bấm được từ khung hình đầu.

### V4 · Tương phản TẠI CHÂN CHỮ (marker `kinhTrenNen`) 🔴 chỗ chết người

**Định nghĩa dùng:** nền hiệu dụng ngay dưới nét chữ = `blend(màu bề mặt, độ đục bề mặt, MÀU
NỀN TẠI ĐIỂM ĐÓ)`. **Không lấy trung bình** — lấy **chặng màu cực trị** của bảng (sáng nhất và
tối nhất) rồi giữ tỉ số THẤP hơn; trung bình là cách giấu lỗi. Test khẳng định con số báo ra
đúng bằng ca xấu nhất.

**Hai bề mặt, và chúng khác nhau về bản chất:**
- `the-dac` — thẻ bento ruột **ĐẶC** (luật B1 *"kính là VỎ, ruột ĐẶC"*) ⇒ nền **không lọt vào**
  ⇒ tương phản là **hằng số**, chỉ 2 giá trị cho 2 theme. Test khẳng định.
- `pill-kinh` — pill/thanh kính nổi **trực tiếp trên nền** (`--nen-mo-header`, alpha .72) ⇒
  **đây mới là chỗ nền thật sự lọt vào**, và là chỗ phải đo 40 tổ hợp.

**BẢNG SỐ — bậc chữ mờ nhất `--t3` trên pill kính, nấc giảm chói mặc định (ngưỡng 4.5):**

| Bộ | theme TỐI (dawn · day · dusk · night) | theme SÁNG (dawn · day · dusk · night) |
|---|---|---|
| Chân trời | 6.12 · **5.69** · 6.27 · 6.53 | 4.65 · 4.77 · 4.60 · **4.56** |
| Ô cửa | 6.18 · 5.75 · 6.33 · 6.54 | 4.65 · 4.77 · 4.61 · 4.57 |
| Bình độ | 6.35 · 6.05 · 6.49 · 6.67 | 4.73 · 4.83 · 4.69 · 4.65 |
| Tầng sâu | 6.24 · 5.88 · 6.40 · 6.61 | 4.66 · 4.78 · 4.61 · 4.58 |
| Mặt phẳng | 6.40 · 6.05 · 6.54 · 6.69 | 4.73 · 4.86 · 4.69 · 4.65 |

`--t1` dao động 13.9–16.3 (tối) / 14.6–15.5 (sáng); `--t2` 10.4–12.3 / 8.7–9.3. **0/240 trượt.**

🔴 **SÀN THEME SÁNG LÀ RÀNG BUỘC THẬT, không phải chọn theo mắt.** Sàn `0.862` cho **4.57 ĐẠT**;
thử hạ xuống `0.80` cho **4.40 TRƯỢT**. Test in ra cả hai số mỗi lần chạy và khẳng định cả hai
chiều — ai định làm theme sáng "sâu" hơn cho đẹp thì bị chặn ngay, không phải chờ mắt bắt.

**Nấc giảm chói — cắt ánh kim, KHÔNG cắt độ đọc:** alpha kính `0.72 → 0.88 → 1.0`. Nấc 2 = kính
đặc hoàn toàn ⇒ tương phản thành **hằng số không phụ thuộc nền** (test khẳng định). Lựa chọn
được **nhớ** (localStorage), và tắt hẳn hình nền về nền trơn cũng được.

⚠️ **MỘT KHẲNG ĐỊNH CỦA TÔI SAI, ghi lại thay vì sửa số cho đẹp.** Tôi viết test *"nấc cao hơn
⇒ tương phản luôn TĂNG"*. **Sai** — ở theme tối ban đêm, bảng màu nền có chặng **tối hơn cả**
`--nen-mo-header` (lum .002 < .0065), nên đặc kính lên làm nền hiệu dụng **sáng hơn** một chút,
chữ kem giảm ~0.1. Bất biến ĐÚNG (và đúng nghĩa "cắt ánh kim") là: **nấc càng cao thì nền càng
ít ảnh hưởng — tỉ số tiến đều về hằng số của nấc 2**, cộng với mọi nấc đều vượt ngưỡng. Test đã
đổi sang khẳng định bất biến đúng.

**Drift-guard:** `contrast.ts` giữ bản sao token màu (phép tính phải chạy ở Node). `contrast.test.ts`
**đọc thẳng `app/globals.css`** và khẳng định từng giá trị khớp, kể cả alpha của `--nen-mo-header`.
Đổi token mà quên chỗ này ⇒ test đỏ.

### V5 · Chỗ chọn (marker `chonBoHinhNen`)

`components/wallpaper/WallpaperSettings.tsx`, mount trong `LockScreenSettings`. Xem trước là
**nền THẬT** — cùng hàm `nenCss` mà lớp nền dùng, dựng ở đúng thời điểm hiện tại và đúng theme
hiện tại; kèm **MỘT CÂU** mỗi bộ. Có nấc giảm chói + nút tắt hẳn. Lựa chọn nhớ được, và đổi ở
Cài đặt thì lớp nền cập nhật ngay (sự kiện `if-wallpaper-prefs`), không phải tải lại trang.

📍 **Đường may phải khai:** chỗ đúng về nghĩa lâu dài là `AppearanceSettings`. `LockScreenSettings`
là tệp **duy nhất** vừa nằm trong vùng ghi của phiếu vừa **đã mount thật**
(`PixelSettingsShell.tsx:218`) — `AppearanceSettings.tsx` tồn tại nhưng **không được mount ở đâu cả**.
Đã ghi comment tại chỗ để phiên sau không tưởng là cố ý xếp nhầm.

### V6 · Bản vẽ

`docs/mocks/mock-5-bo-hinh-nen.html` — `@dsCard group="Hình nền hệ thống"`. Lưới 5×4 · ô lớn
dashboard thật (thẻ đặc + cụm kính góc phải + lề 20px cho nền thở) · gạt theme · gạt giảm chuyển
động · 3 nấc giảm chói · bảng số đầy đủ. `check:mocks`: **0 vi phạm** (77 file đỏ còn lại là nợ cũ).

⭐ **Bản vẽ và code KHÔNG THỂ phân kỳ**: dữ liệu màu trong bản vẽ được **sinh ra từ chính
`lib/wallpaper/*.ts`** (chạy `nenCss`/`doChanChu` rồi nhúng kết quả), không phải chép tay công
thức sang JS. Đây là chỗ trước nay hay hỏng.

### Đấu nối

`DongStudioHome.tsx`: hai lớp nền cũ (`--bg` đặc + `tod.gradient` phủ mờ `opacity .16`) → `--bg`
làm đáy + `<SystemWallpaper/>`. **Bỏ hẳn lớp phủ mờ 0.16** — đúng A2 *"nền để NÉT, không bôi mờ"*.
Lề ngoài `p-3 → p-5` để nền thở. Gỡ `timeOfDayNow` không còn dùng.

---

## 3 · Tổng kết lại vấn đề

Yêu cầu Hoà có ba vế và cả ba đều **mâu thuẫn tiềm ẩn với nhau**: ① nền phải đẹp và có mặt
② dashboard dày số liệu vẫn phải đọc được ③ chuyển động phải dừng hẳn chứ không chạy mãi.

Lời giải gỡ cả ba bằng **một quyết định kiến trúc duy nhất**: nền sinh bằng mã.
- vì là mã nên ② trở thành **định lý chứng minh được lúc build**, không còn là chuyện may rủi
  theo từng tấm ảnh;
- vì là mã nên ① không phải mượn tài sản của ai, và ③ không cần một vòng lặp nào — nhịp thời
  gian là một `setTimeout` thưa, còn chuyển động chỉ tồn tại đúng 2.4 giây lúc vào.

Và điều then chốt: **việc nó dừng lại chính là nội dung của hiệu ứng** ("đã tới nơi"), nên nó
không phạm NT-11 — nếu để nó lặp thì mới thành trang trí.

---

## 4 · Đánh giá khách quan

**Tốt:**
- 240 phép đo tương phản, 0 trượt, có drift-guard đọc thẳng `globals.css`.
- Nền mang tin thật (vị trí mặt trời, góc nắng), không phải hoa văn.
- Dùng lại 2 máy đã có, không viết lại máy nào.
- Bắt được và tự sửa một lỗi chỉ-mắt-thấy (đen tuyền) — đúng luật nghiệm thu 11/08.
- Ghi lại một khẳng định sai của chính mình thay vì sửa số cho qua cửa.

**Chưa tốt / rủi ro — nói thẳng:**
1. 🔴 **Theme SÁNG là chỗ mỏng nhất của cả hệ.** Biên chỉ **0.06–0.36** trên ngưỡng (thấp nhất
   4.56). Gốc: `--t3` sáng (`#726c62`) đứng trên pill kính alpha .72. Không sửa được trong
   phạm vi phiếu này vì đổi token màu = chạm biên. **Và A4 đã chốt theme sáng sẽ đổi sang bản
   canh-Apple** ⇒ **mọi số cột sáng phải đo lại** khi việc đó thi công.
2. 🟡 **Bộ yếu nhất: `mat-phang` (Mặt phẳng).** `spread` 0.34 + `sat` 0.035 ⇒ gần như một tấm
   trơn; hạt mịn làm bằng `repeating-linear-gradient` 3–4px nên trên màn hiDPI có **rủi ro
   moiré** mà tôi **chưa kiểm được trên màn Retina thật**. Nếu phải bỏ một bộ thì bỏ bộ này.
   (Bộ mạnh nhất về "nhìn phát biết mấy giờ": `chan-troi` và `o-cua`.)
3. 🟡 **Cả năm bộ đều lạnh** — đúng chốt, nhưng nghĩa là **bộ mặc định không có lựa chọn ấm nào**.
   Nếu Hoà thấy thiếu thì đó là mở lại chốt hai-nhiệt-độ, không phải vá thêm một bộ.
4. 🟡 **A11y — lỗ ngoài phạm vi, T nên biết:** đo được `--t4 #6e6e78` trên `--bg #0c0c0e` chỉ
   đạt **3.91**, dưới 4.5. `--t4` đang được dùng làm chữ nhỏ **khắp app** (kể cả `WidgetCard`,
   `LightClock`). Tôi đã nâng mọi chữ mang nghĩa trong tệp của mình lên `--t3` (7.2), nhưng
   **không đụng token** — đây là việc cấp toàn app, đề nghị T mở entry riêng.
5. 🟡 **Nền hiện chỉ mount ở Home.** Màn khoá và các chặng khác chưa dùng — ngoài phạm vi phiếu.

---

## 5 · Hướng xử lý nhiều góc độ

**Hướng A — giữ nguyên, chờ duyệt mắt Hoà qua Drive.** Rẻ nhất. Rủi ro: nếu Hoà chê "chưa đủ
đẹp như macOS" thì mất một vòng.

**Hướng B — thêm một bộ ẢNH tuỳ chọn bên cạnh 5 bộ mã.** Cơ chế nạp ảnh **đã có sẵn nguyên vẹn**
(`LoginBackdrop` có upload · Unsplash/Openverse · Ken Burns · đo tương phản). Ưu: ai muốn ảnh
chụp thật thì có. Nhược: mở lại đúng cánh cửa mà luật trung tính vừa đóng — phải có cửa kiểm
giấy phép, và tương phản của ảnh người dùng tự chọn thì không chặn được lúc build.

**Hướng C — hoãn `mat-phang`, chỉ ship 4 bộ.** Ưu: bỏ bộ yếu nhất, giảm rủi ro moiré. Nhược:
5 là con số Hoà nói; cắt xuống 4 mà không hỏi là tự bỏ tính năng — thứ tôi bị cấm.

---

## 6 · Đề xuất hướng tốt nhất

**Hướng A**, kèm hai việc nhỏ:

1. **T đẩy `mock-5-bo-hinh-nen.html` lên Claude Design + chụp vào `Drive/IF-duyet-mat/01-anh/`**
   với tên tự nói (`HOME-01-hinh-nen-5-bo-toi.png` · `HOME-02-hinh-nen-5-bo-sang.png`). Câu hỏi
   duy nhất cần Hoà trả lời: *"bộ nào giữ, bộ nào bỏ"* — mọi thứ khác máy đã chốt.
2. **Không làm hướng B lúc này.** Không phải vì khó, mà vì nó **phá đúng cái ưu thế vừa xây**:
   tương phản chứng minh được lúc build. Nếu sau này Hoà muốn ảnh riêng thì đó là tính năng
   *"ảnh của tôi"* — có cửa kiểm riêng, có nhãn `DataOrigin`, và **không** nằm trong bộ đi kèm
   hệ thống. Ranh giới đó phải khai một lần cho rõ, kẻo lần sau lại nhập nhèm.

Không chọn C vì cắt tính năng khi chưa ai kêu là sai; nếu `mat-phang` bị Hoà chê thì lúc đó bỏ,
có căn cứ.

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM — bắt buộc

| Điều | Trạng thái thật |
|---|---|
| **Chạy app thật?** | ❌ **KHÔNG.** Phiếu cấm dev server. Tôi chỉ mở **bản vẽ tĩnh** (`file://`) ở 1440×900. ⇒ **Mọi kết luận về hành vi trong app thật — hiệu ứng vào, đổi theme sống, đổi lựa chọn ở Cài đặt rồi quay về Home — là SUY từ mã, chưa chạy.** Riêng bố cục/màu/tương phản thì đã thấy bằng mắt trên bản vẽ. |
| **Tương phản: ĐO hay TÍNH?** | **TÍNH**, bằng công thức WCAG trên mô hình lớp (nền → kính alpha → chữ), dùng máy `lib/adaptive-contrast.ts` đã có test. **Không** đo pixel từ ảnh chụp màn hình. Mô hình đúng vì nền là mã nên màu là số đã biết — nhưng **chưa đối chiếu với số đo pixel thật trên màn Retina**. |
| **"Dừng hẳn": ĐO hay TIN VÀO MÃ?** | **Cả hai, nhưng không phải đo bằng profiler.** Đo được: trên bản vẽ, `data-wp-motion` chuyển sang `stopped — 0 transition, 0 animation, will-change:auto` (đọc bằng JS trong trình duyệt thật, đã xác nhận). Tin vào mã: rằng không còn thuộc tính hoạt hoạ thì trình duyệt thôi vẽ. **CHƯA đo bằng DevTools Performance / Activity Monitor** ⇒ chưa có con số CPU/GPU thật. |
| **Hiệu năng: ĐO hay ƯỚC?** | **ƯỚC.** Lập luận là cấu trúc (0 rAF lặp, 0 interval, 0 CSS animation sau khi dừng, nền là gradient CSS không phải canvas/ảnh) chứ không phải số đo. Chỗ tốn nhất còn lại là **lúc vẽ lần đầu**: bộ `contour` và `plane` dùng `repeating-linear-gradient` — chưa đo thời gian paint trên màn lớn. |
| **Bộ nào yếu nhất?** | **`mat-phang` (Mặt phẳng)** — gần như tấm trơn, và hạt mịn 3–4px có **rủi ro moiré trên hiDPI mà tôi chưa kiểm được**. Kế đó là **`binh-do`** (nét 1px bước 34px, cùng họ rủi ro nhưng thưa hơn nên nhẹ hơn). **Không phải cả 5 đều tốt.** |
| **Bản vẽ: chụp đủ chưa?** | Chụp được **lưới 5×4 ở cả theme tối và sáng** (1440×900, `scrollWidth == 1440` ⇒ không tràn ngang). **Ô lớn dashboard và bảng số thì KHÔNG chụp được** — pane trình duyệt trả ảnh cũ/trắng sau khi cuộn; đã xác minh nội dung bằng JS thay thế (bảng 6 hàng, `data-wp-motion` đúng, cảnh báo tính đúng). |
| **`npm test`** | Lần 1 báo **3 fail ở `lib/cad/room.test.ts`** — chạy riêng file đó **3 lần đều PASS**, và `npm test` **lần 2 sạch**. ⇒ đọc là **nhiễu liên phiên** (phiên phụ khác đang ghi file trong lúc `xargs -P8` chạy), **không phải lỗi của phiếu này** — nhưng tôi **không chứng minh được** điều đó một cách chắc chắn. |
| **`soi:tu-dien`** | Ra **243**, phiếu ghi nền **212**. Kiểm từng dòng: tệp của tôi (`mock-5-bo-hinh-nen.html`) đóng góp **0**; phần tăng nằm ở các phiếu `P-B/P-C/P-D/P-E/P-F` của T. ⇒ **không tăng do tôi**, nhưng **mốc 212 trong phiếu đã lỗi thời**. |
| **Chưa làm** | Chưa chạy `design:design-critique` (chỉ chạy `accessibility-review`). Chưa lắp nền vào màn khoá / các chặng khác. Chưa `soi:contract`. |

---

## ⑦c · HẠN DÙNG KẾT LUẬN

**Hết đúng khi…**

1. **Màu nhấn thứ hai được chốt** (mòng két ↔ mận). Kết luận *"không bộ nào khoá vào màu nhấn"*
   dựa trên khoảng cách ≥15° tới cả hai ứng viên — chốt xong phải chạy lại `sets.test.ts` và
   **nhìn lại bằng mắt** xem màu nhấn đứng trên nền có tách bạch không (test chỉ kiểm góc màu,
   không kiểm cảm nhận).
2. 🔴 **Theme sáng đổi sang bản canh-Apple.** **TOÀN BỘ cột "theme SÁNG" của bảng tương phản
   phải đo lại** — và sàn `0.862` gần như chắc chắn phải tính lại, vì nó suy ra từ `--t3` và
   `--nen-mo-header` của theme sáng hiện tại. Đây là hạn dùng **nặng nhất**.
3. **`--t4` được sửa ở cấp token** (lỗ a11y 3.91 nêu ở §4.4) — lúc đó chỗ nào nên dùng `--t3`
   / `--t4` phải xét lại, không cứ nâng hết lên `--t3`.
4. **Bản tablet/điện thoại bắt đầu làm.** Hai thứ hết đúng: `msToiMocSau` (máy ngủ thì
   `setTimeout` bị hoãn — trên desktop không sao, trên di động cần `visibilitychange`), và
   `SETTLE_MS = 2400` (mở app trên điện thoại là thao tác ngắn, 2.4s có thể thành chờ).
5. **Home bento tuỳ biến thi công.** Kết luận *"thẻ ruột ĐẶC ⇒ tương phản là hằng số"* chỉ đúng
   khi widget còn dùng `--card` đặc. Người dùng được đổi widget sang nền kính thì **bảng 240
   phép đo phải mở rộng thêm bề mặt thứ ba**.
6. **`lib/adaptive-contrast.ts` đổi hằng số `CARD_STACK`** — mô hình lớp của tôi ăn theo cùng
   họ giả định.

---

## ⑧ · Tệp đã tạo / sửa

**Mới:** `lib/wallpaper/{types,sets,css,contrast,settle,prefs}.ts` + `{sets,contrast,settle}.test.ts`
(134 phép kiểm) · `components/wallpaper/{SystemWallpaper,WallpaperSettings}.tsx` ·
`docs/mocks/mock-5-bo-hinh-nen.html` · báo cáo này.

**Sửa:** `components/home/DongStudioHome.tsx` (thay nền, nới lề) ·
`components/settings/LockScreenSettings.tsx` (mount chỗ chọn).

**Không đụng:** `HomeScreen.tsx` · `components/home/widgets/**` · `lib/resume.ts` ·
`AppChrome.tsx` (phiên router giữ) · `scripts/**` · `docs/00-CHOT.md` · `app/globals.css`
(không cần thêm class nào — mọi thứ đi qua inline style sinh từ mã) · `frontier-registry`.

**KHÔNG chạy git. KHÔNG dev server.** ✅
