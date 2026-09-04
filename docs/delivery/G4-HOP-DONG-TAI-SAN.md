# G4 · HỢP ĐỒNG TÀI SẢN + MEDIA — cái gì BẮT BUỘC ship, cái gì tải sau

> Chủ dự án ra luật: **"Do not mass-download assets before contract/taxonomy is approved"** ·
> **"QUALITY + COVERAGE > QUANTITY"** · **"Every distributable asset must have appropriate
> provenance/license."** Tệp này là hợp đồng đó. Số liệu **đo tại nguồn 04/09**, không chép sổ.

## 0 · HIỆN TRẠNG ĐO ĐƯỢC — lỗ nằm đúng một chỗ

| Kho | Có gì thật | Giấy phép | Đánh giá |
|---|---|---|---|
| **2D** | **54 block `.dxf`** + 54 thumbnail, 12 danh mục | **54/54 CC0, tự dựng** | 🟢 ship được ngay |
| **3D** | **1 tệp `.obj`** (thí nghiệm ghế Lincoln) | — | 🔴 **LỖ THẬT DUY NHẤT** |
| **Vật liệu** | hạ tầng mã dày (`ba-mat` · `resolve` · `matid-identity` · `export-d5/vray` · `pbr-from-category` 17 họ) — **0 tệp texture trên đĩa** | — | 🟡 máy đủ, dữ liệu thiếu |
| **Nền/Wallgallery** | **5 bộ SINH BẰNG MÃ** (`lib/wallpaper/sets.ts`), 3 ràng buộc máy kiểm | **0 rủi ro** — không tệp ảnh nào | 🟢 đã giải xong |
| **Intro/brand media** | **0** | — | 🟡 thiếu, nhưng nhỏ |

⇒ **Đừng đi mua/tải thư viện.** Ba trên bốn mặt đã có lời giải; tiền và rủi ro giấy phép chỉ nên đổ vào **3D**.

## 1 · PHÂN LOẠI — BIND cái đã chốt, KHÔNG đẻ trục mới

Hai trục **độc lập**, đã chốt 07/08, `soi:tu-dien` canh tên:
- **Trục LOẠI (`kind`)** — *nó là cái gì*, và **ai thi công**: `material` · `furniture` · `millwork` · `fitout` · `fixture` · `soft`.
- **Trục PHÒNG** — *dùng ở đâu*: giữ nguyên 12 danh mục đang có trong manifest 2D (`phong-khach` · `van-phong` · `phong-ngu` · `phong-an` · `bep` · `ve-sinh` · `cua` · `cay-canh` · `cau-thang` · `cot` · `xe` · `ky-hieu`).

🔴 **Trục `kind` phủ vật MUA SẮM, không phủ hết kho 2D.** Đo 54 block: ngoài đồ mua sắm còn có **cửa/cửa sổ/cột/cầu thang** (vỏ kiến trúc), **cây/xe** (phụ cảnh), **ký hiệu hướng Bắc** (chú giải). Ép chúng vào 6 `kind` là **làm bẩn BOQ** — không ai đi mua một mũi tên chỉ hướng Bắc.
⇒ Thêm **trục thứ ba `nhomVat`**, một tầng TRÊN `kind`: `mua-sam` (mang `kind`, **vào BOQ**) · `kien-truc` · `phu-canh` · `ky-hieu`. **Chỉ `mua-sam` được vào BOQ** — thi hành thẳng luật *"BOQ chỉ nhận số đo được"*.
✅ **ĐÃ THI CÔNG 04/09**: 54/54 block có `nhomVat` — mua-sam 38 · kiến-trúc 10 · phụ-cảnh 5 · ký-hiệu 1; `kind`: furniture 24 · fixture 8 · millwork 4 · fitout 2; **53/54 có `hUp`** (ký hiệu hướng Bắc cố ý không có chiều cao). `tsc` 0 · `npm test` 34 pass 0 fail.

## 2 · MỘT TỆP TÀI SẢN = MỘT `.idfc` — không đẻ định dạng thứ hai

Vỏ chung `meta` + ruột theo `kind` (đã chốt 07/08). Trường **BẮT BUỘC** để một tài sản được coi là ship được:

| Trường | Vì sao bắt buộc |
|---|---|
| `id` · `name` · `kind` · `category` | định danh + hai trục phân loại |
| `w` · `h` (hình chiếu bằng) · **`hUp`** (cao đứng, mm) | ⚠️ **ĐÍNH CHÍNH sau khi đo**: `w`/`h` của manifest là **hình chiếu bằng** (rộng × sâu, `h` có thể gồm cả cung mở cánh) — `h` **KHÔNG** phải chiều cao. Thứ thiếu là **`hUp` chiều cao đứng**, không phải `d`. Không có `hUp` thì không đùn được lên 3D. |
| `thumb` | duyệt bằng mắt; 54/54 đã có |
| `license` · `source` | luật phân phối, không thương lượng |
| `specId?` / `matId?` | dây nối sang mặt thương mại — **trỏ tới, TUYỆT ĐỐI không chép giá vào tài sản** (luật 2.1.9.i) |

## 3 · 3D — LỖ THẬT, VÀ LỜI GIẢI BẢN ĐỊA

⛔ **Không tải thư viện model ngoài** ở đợt đầu: mỗi model là một hồ sơ giấy phép phải tự kiểm (bài học GPL/libredwg), và model tải về là **lưới chết** — sửa được bằng tay, không sửa được bằng tham số.

✅ **Dựng bằng `BuildRecipe`** — ngăn xếp lệnh KHÔNG PHÁ HUỶ đã chạy thật (`extrude · boolean · arrayLinear · arrayRadial · mirror · bevelEx · taper · sweep · revolve · loft`; `chuan-net` đã xuất recipe `revolve` cho 4 chân ghế Lincoln, ghi ra `.idfc` nạp-lại-chỉnh-được). Được ba thứ cùng lúc: **CC0 tự dựng** (0 rủi ro giấy phép) · **sửa được bằng tham số** (đổi cao 420→450 không cần model mới) · **2D và 3D sinh từ MỘT nguồn** ⇒ đúng câu định vị *"đồng bộ là KHÔNG TÁCH ra ngay từ đầu"*.

**Bộ 3D tối thiểu để ship — 24 món**, chọn theo tần suất trong hồ sơ nội thất thật, không theo cái gì dễ dựng:
- `furniture` (10): ghế ăn · ghế sofa đơn · sofa 3 chỗ · bàn ăn · bàn trà · bàn làm việc · giường đôi · tủ đầu giường · kệ TV · đôn/pouf
- `millwork` (5): tủ bếp dưới · tủ bếp trên · tủ áo âm tường · kệ liền tường · quầy lễ tân
- `fixture` (6): đèn thả · đèn âm trần · đèn rọi ray · bồn cầu · lavabo · vòi sen
- `fitout` (3): phào chỉ trần · nẹp chân tường · ốp lam gỗ
Mỗi món: `.idfc` mang recipe + `w/d/h` + `kind` + `category` + gợi ý `matId`.
**Cửa nghiệm thu:** đặt được vào scene · biến đổi · đổi vật liệu · thay thế giữ vị trí · lưu · mở lại · lên BOQ đúng số.

## 4 · VẬT LIỆU — THAM SỐ TRƯỚC, TEXTURE SAU (đóng gói)

**Ship**: **~32 vật liệu tham số** phủ 17 họ mà `pbr-from-category` đã biết suy (gỗ · đá · gạch · sơn · vải · da · simili · thảm · kính · inox · nhôm · ceramic · marble · granite · travertine · bóng · nhám). Mỗi món = `matId` + `MaterialPbr` (baseColor · roughness · metallic · uvScaleMm) + hatch 2D + quả cầu xem trước sinh lúc build.
**KHÔNG ship**: bản đồ texture (`baseColorMapUrl` · `normalUrl` · `roughnessMapUrl`…). Chúng đi theo **GÓI NẠP** — cùng cơ chế đã chốt cho `color-system-packs` và `neufert-tach-goi`: app trung tính, studio tự nạp catalog hãng.
**Lý do:** vật liệu tham số **0 byte, 0 rủi ro giấy phép, render được ngay**; texture là thứ nặng nhất và rủi ro bản quyền cao nhất — nó là **thứ tải sau**, không phải thứ chặn phát hành.

## 5 · MEDIA — ĐÃ GIẢI 3/4, CHỈ CÒN INTRO

- **Wallgallery/nền: XONG.** 5 bộ sinh bằng mã, mỗi bộ là một **hiện tượng ánh sáng có thật trong nghề**, ba ràng buộc do máy canh (góc màu ngoài phổ màu-nghĩa · bão hoà ≤ 0.12 · dải sáng theme sáng không tụt dưới sàn tương phản). ⇒ **cấm thay bằng ảnh chụp tải về** — sẽ mất cả ba ràng buộc và rước rủi ro giấy phép.
- **LightClock**: đã có `sunPosition` + `time-of-day`; việc còn lại là **thị giác**, thuộc 04 DESIGN, không phải việc tài sản.
- **Intro: LỖ.** Ràng buộc chủ dự án: **ngắn · chất lượng cao · bỏ qua được · không làm chậm khởi động · đúng bản sắc IF.** ⛔ *"Do not make a long marketing film that slows startup."* Trần cứng: **≤ 2,5 giây, ≤ 400 KB, luôn có nút Bỏ qua, không chặn tương tác đầu tiên.** Ưu tiên **sinh bằng mã/vector** như wallgallery — cùng lý do.
- ⛔ *"Do not let placeholder gradients become final media."* Gradient tạm phải khai `DEMO` và có ngày hết hạn.

## 6 · THỨ TỰ THI CÔNG (rẻ→đắt, mỗi bước mở khoá bước sau)
1. ~~Thêm `nhomVat`/`kind`/`hUp` vào manifest 2D~~ **XONG 04/09**. Còn lại: gắn `specId?`/`matId?` khi kho vật liệu có dữ liệu (bước 2).
2. 32 vật liệu tham số + quả cầu xem trước. *(0 byte tài sản, dùng lại máy đã có)*
3. 24 món 3D bằng `BuildRecipe`. *(đắt nhất — nhưng là lỗ thật duy nhất)*
4. Bổ ký hiệu chú giải 2D: hiện **chỉ 1 mục `ky-hieu`** trên 54 — quá mỏng cho hồ sơ kỹ thuật.
5. Intro trong trần 2,5s/400KB.

## 7 · CÁI GÌ CỐ Ý KHÔNG LÀM Ở ĐỢT NÀY
Thư viện lớn · texture PBR quét thật · model tải từ nguồn ngoài · cây/người/xe chất lượng render · thư viện ánh sáng IES/LDT · phim giới thiệu dài. Tất cả vào **hàng đợi tải sau**, không chặn phát hành.

## 8 · PHÁT HIỆN 04/09 — KHO PBR HIỆN LÀ `localStorage`, THIẾU TẦNG HẠT GIỐNG

Đo `lib/materials/pbr-store.ts`: vật liệu PBR đang lưu ở **`localStorage` khoá `if.materials.pbr.v1`**, tầng *studio*. Lựa chọn đó **đúng cho vật liệu người dùng tự tạo** (và có lý do ghi rõ tại chỗ: nhồi PBR vào `ProductSpec` là phá luật 2.1.9.i; thêm cột lúc migrate đang treo là chồng mìn).

🔴 **Nhưng thư viện MỞ ĐẦU thì KHÔNG được sống ở đó.** Thứ ship theo sản phẩm phải có mặt ở **máy sạch, lần chạy đầu tiên, trước khi người dùng chạm vào gì** — `localStorage` thì trống trơn lúc đó.
⇒ **Cần tầng thứ ba, thứ tự phân giải: HẠT GIỐNG (tệp trong repo, chỉ đọc) → STUDIO (`localStorage`, người dùng ghi đè) → DỰ ÁN (bản chèn ghi đè cục bộ).** Cùng khuôn `.idfc` một-chiều đã chốt 07/08: sửa ở dự án **không** đổi mẫu gốc.

Ràng buộc cho người thi công:
- `matId` của vật liệu hạt giống là **UUID cố định, gõ cứng một lần, không bao giờ đổi** — nó đi vào tệp `.idf` người dùng lưu. Sinh lại mỗi lần build là **làm mồ côi dữ liệu cũ**.
- Không đụng `normalizeMatId` cũ (`upper+trim`) — dữ liệu `localStorage` đang sống giả định đúng ngữ nghĩa đó.
- `inferPbrFromCategory` (17 họ) là **đường suy khi thiếu**, không phải kho — giữ nguyên vai, đừng biến nó thành nơi chứa vật liệu.

⇒ **Gộp bước 2 (32 vật liệu tham số) và bước 3 (24 món 3D) vào CÙNG một lượt của 05 ASSET.** Cả hai cùng cần `matId` ổn định và cùng cần tầng hạt giống; tách ra là dựng tầng đó hai lần.
