# LANE C — UX dự án + nối MỘT SỰ THẬT (22/08)

## ⓪ TIỀN ĐỀ — XÁC NHẬN
Pha 1 của MAIN có thật và chạy được: `lib/site/types.ts` (`HoSoDiaDiem` · `ViTriDuAn` ·
`HuongCongTrinh` · `DoChinhXacViTri` · `coToaDo`) · `lib/site/solar.ts#trangThaiNang` ·
`GET|PATCH /api/projects/<id>/site`. Kiểm bằng đường thật trên `localhost:3000`:
PATCH dự án của mình → `200` kèm `{hoSo, thayDoi, daCu}`; PATCH id không thuộc mình → `404`.

## 🔴 VIỆC MỘT — 3D THÔI SỞ HỮU VỊ TRÍ · **XONG**
**Trước:** `scene3d-ui.ts` giữ `latDeg` · `lngDeg` · `northDeg` trong store giao diện của mode 3D,
docstring tự thú *"MẤT KHI ĐÓNG APP"*, và `LightTab` nói với người dùng *"Not stored in the project
file yet — re-enter each session"*. Đó đúng là "3DLocation".

**Sau:**
- Ba khoá đó **đã bị gỡ khỏi store**; chỗ chúng từng nằm nay có một dòng cấm tái phạm. Docstring cũ
  không bị xoá lặng lẽ mà **đóng dấu ⛔ LỖI THỜI tại chỗ** kèm địa chỉ nơi ở mới.
- `LightTab` **chỉ ĐỌC** `HoSoDiaDiem`: hướng Bắc hiện dạng chữ (`chưa khai · 0°` khi trống), ô nhập
  toạ độ cũ thay bằng `<NhapViTri gonGang>` → ghi thẳng `PATCH …/site`. Câu *"not stored yet"* đã
  thay bằng *"Vị trí lưu trong dự án — khai một lần, mọi chặng dùng chung."*
- Nắng thật đi qua `gocNangTuHoSo()` → `lib/site/solar.ts#trangThaiNang`. **Không có công thức mặt
  trời thứ hai**; `sunLightFromDateTime` không còn được gọi ở đây.
- §25 khoá bằng test, không bằng lời dặn: `components/site/nang-tu-ho-so.test.ts` khẳng định patch
  chứa **đúng hai khoá** `azimuthDeg`+`altitudeDeg` ⇒ kéo giờ không đụng `intensity`/`colorK`,
  không chạm entity nào ⇒ mô hình không reset, danh tính vật thể không đổi.
- Ba tab (`mode`/`dateIso`/`hour`) **ở lại** store có lý do ghi rõ: đó là *đang xem lúc mấy giờ*,
  cách nhìn của một người, không phải sự thật của công trình.

## VIỆC HAI — TÓM TẮT ĐỊA ĐIỂM Ở TỔNG QUAN · **XONG**
`components/site/TomTatDiaDiem.tsx`, cắm vào `app/projects/[id]/overview/page.tsx` (giữ nguyên
`<AppShell>`). Thứ bậc **ĐỊA ĐIỂM → TÍN HIỆU → HỆ QUẢ → QUYẾT ĐỊNH**, một khối, **4 tín hiệu**
(bình minh · hoàng hôn · nắng trưa · mặt đứng chính) — không tường 12 thẻ, không bản đồ.
Phần còn lại nằm sau *"Xem phân tích đầy đủ"*, mở **tại chỗ**, không route mới, không mục rail mới.
Chưa có vị trí → một dòng mời **không chặn**. Vị trí cấp thành phố → in thẳng *"Phân tích hiện ở
cấp thành phố."* Mọi con số là hình học mặt trời **tất định**; Pha 1 chưa có khí hậu/gió nên ở đây
**không có ô nào được bịa**.

## VIỆC BA — NHẬP VỊ TRÍ + HƯỚNG, KHÔNG WIZARD · **XONG**
`components/site/NhapViTri.tsx` — **một khối, hai mặt tiền** (Tổng quan · bảng Đèn 3D).
Ba mức độ chính xác: *Tại công trường* · *Thành phố (gần đúng)* · *Chưa rõ*, lưu `doChinhXac` tường
minh. Toạ độ nhập dạng nghề `10.7769, 106.7009` (`doc-toa-do.ts`, có test). Hướng nhập rời;
đổi hướng đã khai thì **cảnh báo kèm giá trị cũ trước khi lưu**. Không gói bản đồ, không gọi
Google/Apple, và **cố ý không dựng lớp `MapProvider` rỗng** (mã chết + khoá thiết kế vào một
lựa chọn chưa có). Không có cổng bắt buộc nào trước khi tạo/mở dự án.

## PHÉP THỬ VÀNG — ĐẠT
Nhập MỘT LẦN ở Tổng quan (`10.7769, 106.7009` · mặt đứng `265°`) → `PATCH` 200 → **tải lại trang**
vẫn còn → mở `/projects/<id>/render` → **bảng Đèn 3D đã nạp sẵn đúng toạ độ đó** → kéo thanh giờ:
| giờ | app thật | tính độc lập qua `trangThaiNang` |
|---|---|---|
| 07:00 | cao 18° · phương vị 81° | cao 18° · phương vị 81° |
| 15:00 | cao 45° · phương vị 276° | cao 45° · phương vị 276° |
Khớp từng độ. **Không có sự thật thứ hai.**

## HAI LỖI THẬT BẮT ĐƯỢC KHI CHẠY, KHÔNG PHẢI KHI ĐỌC MÃ
1. **Bấm "Thêm vị trí" mở ra form không có ô nào để nhập.** Hồ sơ trống trả `chua-ro`, form nạp
   thẳng trạng thái đó nên ẩn hết ô toạ độ. Sửa: chưa khai gì thì mở ở *"tại công trường"*.
2. **"Sài Gòn" bị đọc thành toạ độ độ-phút-giây** — regex nhận diện DMS bắt "chữ NSEW ở cuối
   chuỗi", mà tên ấy kết thúc bằng `n`. Test bắt được trước khi lên app; nay chỉ nhận DMS khi có
   ký hiệu `° ′ ″` thật hoặc số dính hậu tố hướng.

## 📮 BÁO MAIN
- ✅ **Alias trong `lib/site/solar.ts` đã được MAIN sửa giữa phiên.** Trước đó `@/lib/three/lighting`
  là *value import* nên `sucrase-node` không phân giải ⇒ `lib/site/site.test.ts` và
  `lib/site/vat-ly.test.ts` **chết lúc nạp**, và `npm test | grep FAIL` đếm ra 0 vì tệp chết thì
  không in dòng FAIL nào. Shim tạm trong test của Lane C **đã gỡ**.
- 🟡 Sidebar hiển thị tên dự án cũ (`DỰ ÁN MỚI`) trong khi Tổng quan là *Căn hộ mẫu · Studio 48m²*
  — lỗi có sẵn ngoài vùng ghi của Lane C (`components/nav`), chỉ ghi nhận.

## ⚠️ CHƯA CHẮC / CHƯA KIỂM
- **403 chưa tái hiện trên app thật**: máy chỉ có một tài khoản, nên đường *không phải owner* mới
  chỉ kiểm gián tiếp (PATCH id lạ → 404 → UI hiện câu "Không lưu được lúc này"). Câu riêng cho 403
  (*"Chỉ chủ dự án đổi được vị trí và hướng"*) có trong mã nhưng **chưa từng hiện ra màn hình**.
- **Chỉ chụp theme SÁNG, 1440×900.** Theme tối và khổ hẹp chưa soi.
- **Chưa thử trình đọc màn hình** — `aria-label`/`aria-invalid`/`role="alert"` có khai nhưng chưa
  nghe thật.
- §25 chứng minh ở tầng hàm (patch hai khoá) và quan sát trên bảng Đèn; **chưa dựng một mô hình có
  vật thể rồi kéo giờ để đối chiếu danh tính entity trước/sau** — cảnh 3D lúc kiểm đang trống.
- Múi giờ của dự án vừa nhập là **suy từ kinh độ** (hồ sơ chưa khai `muiGio`); trùng khớp cho VN,
  chưa kiểm nước có ranh giới múi giờ lệch kinh tuyến.
