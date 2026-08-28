# BÁO CÁO TỔNG THỂ IF — 07/08/2026
Gộp audit sáng + build thật + hai phát hiện chiều. Mọi con số đo bằng lệnh chạy thật.
Chỗ nào không đo được ghi thẳng **CHƯA VERIFY**.

---

## PHẦN I · NHẬT KÝ NGÀY

| Giờ | Việc | Kết quả |
|---|---|---|
| sáng | Audit tổng thể lần đầu | 888 file · 178.897 dòng · 3.016 test xanh · 0,9% mồ côi |
| sáng | Soạn bảng lệnh đợt 2 | 4 phiếu |
| trưa | Chốt thiết kế tấm Thư viện | phương án A + "nổi lên tại chỗ, không dính đáy" |
| trưa | Tra cách các hệ khác làm | sửa 4 điểm trong phiếu Đ2-1 |
| chiều | Hoà chốt hoãn ArchiNote | sổ 60 → 58 đỏ |
| chiều | **`npx next build` trên máy thật** | ✅ **XANH** — 84 route · 46 trang tĩnh · 0 lỗi |
| chiều | Hoà bắt: *"nhánh dựng 3D quên nữa r"* | 🔴 đúng — 12.737 dòng, 0 phiếu |
| chiều | Viết luật §0x rồi **chạy chính nó** | 🔴 không phải 1 mảng quên mà **14** |
| tối | Soạn bù Đ2-5 (3D) + Đ2-6 (soi 14 mảng) | bảng lệnh 4 → **6 phiếu** |

---

## PHẦN II · SỐ LIỆU

### 1. Quy mô
| | |
|---|---|
| File `.ts`/`.tsx` | 888 |
| Dòng code | 178.897 |
| Route API | 56 · Trang 26 · Model Prisma 18 · Component 220 |

### 2. Sức khoẻ kỹ thuật
| Phép đo | Kết quả |
|---|---|
| `npm test` | 96 khối · **3.016 phép kiểm · 0 FAIL** |
| `npx next build` (máy thật) | ✅ **XANH** — `✓ Checking validity of types` PASS |
| `npx tsc --noEmit` | 1 lỗi — `lib/cad/render-layer-index.test.ts:36`, có sẵn từ `752fb54`, là file TEST nên build không thấy |
| Component mồ côi | 2/220 = **0,9%** |

### 3. 🔴 PHÁT HIỆN LỚN NHẤT NGÀY — test phủ lệch hẳn một bên
| | file nguồn | dòng nguồn | file test | dòng test | che phủ |
|---|---|---|---|---|---|
| `lib/` (động cơ) | 353 | **70.158** | 208 | 30.720 | **43%** |
| `components/` (vỏ) | 233 | **71.004** | **2** | **170** | **0%** |
| `app/` (trang) | 92 | 6.845 | **0** | **0** | **0%** |

**Hai nửa gần bằng nhau về khối lượng — 70k so với 71k dòng. Một bên 43%, một bên 0%.**

16 mảng có **0 test**, tổng **48.589 dòng nguồn**, gần như toàn bộ là `components/`:
`present-editor` 13.696 · `cad` 11.378 · `render-studio` 5.111 · `nodes` 2.556 ·
`photo-editor` 2.205 · `three` 1.750 · `avatar` 1.744 · `library` 1.599 · `notebook` 1.319 ·
`print` 1.258 · `ui` 1.155 · `materials` 1.077 · `form` 1.032 · `intro` 1.016 · `colors` 865 ·
`filemanager` 828.

### 4. Sổ GAP
87 dòng · **58 đỏ** · 12 xong · 11 vàng · 6 cam · 3 hoãn.

---

## PHẦN III · ĐỌC LẠI BA CON SỐ CỦA AUDIT SÁNG

Audit sáng đúng về **cái nó đo**, nhưng ba con số đó dễ bị đọc rộng hơn thực tế. Đọc lại:

### ① "3.016 phép kiểm xanh" — đúng, nhưng chỉ nói về ĐỘNG CƠ
3.016 phép kiểm nằm gần trọn trong `lib/`. Lớp người dùng thật sự chạm vào — 71.004 dòng
`components/` — có **170 dòng test**, tức 0%.
> Ví von: **thử tải toàn bộ hệ dầm cột rất kỹ, chưa thử một cánh cửa nào.**
> Nói "kết cấu đạt" là đúng. Nói "nhà dùng được" là chưa có căn cứ.

### ② "0,9% component mồ côi" — đúng, nhưng nó đo sự TỒN TẠI, không đo sự HOẠT ĐỘNG
Phép đo chỉ hỏi *"component này có nơi nào gọi tới không"*. Nó không hỏi *"gọi tới rồi có
chạy đúng không"*. Với 0% che phủ test ở `components/`, câu hỏi thứ hai **chưa ai trả lời**.
> Ví von: **đếm được mọi cánh cửa đều đã lắp vào khung. Chưa mở thử cái nào.**

### ③ "68% GAP đỏ" — con số này KHÔNG đáng tin, và nay biết vì sao
Sổ GAP có 87 dòng, nhưng phân bố cực lệch:
| Mảng | dòng code | dòng sổ | tỷ lệ |
|---|---|---|---|
| `lib/cad` + `components/cad` | 35.255 | 43 | 820 : 1 |
| `present-editor` (lib+components) | 23.021 | **1** | **23.021 : 1** |
| `nodes` (lib+components) | 6.553 | 2 | 3.277 : 1 |
| `render-studio` + `three` | 9.355 | 2 | 4.678 : 1 |

Mảng nào bị soi kỹ thì sổ dày; mảng nào chưa ai mở ra thì sổ trống. **Sổ đang đo mức độ
CHÚ Ý, không đo mức độ HỎNG.** Nên "68% đỏ" chỉ đúng trong phạm vi đã soi — chưa phải bức
tranh cả repo. Con số thật sẽ **xấu hơn** sau khi Đ2-6 đi soi 16 mảng còn lại.

---

## PHẦN IV · LỖ HỔNG THẬT, XẾP THEO MỨC NẶNG

| # | Lỗ | Mã | Vì sao nặng | Đợt |
|---|---|---|---|---|
| 1 | **`components/` 0% test — 71.004 dòng** | `G-M12-01` (mới) | Không có lưới an toàn ở đúng lớp người dùng chạm. Sửa gì cũng có thể vỡ chỗ khác mà không ai biết cho tới khi khách kêu | 3 |
| 2 | **48.589 dòng chưa ai soi** | Đ2-6 | Không biết trong đó có gì thì không lập kế hoạch được. Đây là **ẩn số lớn nhất của dự án** | ngay |
| 3 | Không có `model Task` lõi | `G-M10-01` | chặn cả mảng SyncWork | 2 |
| 4 | Poché không neo — tường rách làm đôi, lệch 450 mm | `G-M2-01` `G-M1-08` | lỗi LÕI hình học; có thể phình thành 2 đợt | 3 |
| 5 | Tên khách hardcode: `content-deck.ts:113` in `DETECH · CONCEPT` lên **mọi deck user sinh** | `AUDIT-BRAND-PII` | khách A mở ra thấy tên khách B | 5 |
| 6 | GPL-3.0 của `libredwg-web` | — | lập luận miễn trừ "tool nội bộ" **chết** với định vị global. Nếu phải đổi thư viện thì kéo theo `lib/cad` ⇒ **quyết sớm** | quyết ngay |
| 7 | 8 trang vượt ngưỡng First Load JS (734 kB / 250 kB) | `G-M11-02` | Electron nạp từ ổ cứng nên ít thấy; bản web thấy rõ | 6 |
| 8 | Cảnh báo `jose` Edge Runtime | `G-M11-01` | chưa hỏng; bom hẹn giờ nếu đổi nhà cung cấp đăng nhập | theo dõi |

---

## PHẦN V · ĐÁNH GIÁ THẲNG

### Ba điều chắc chắn tốt
1. **Nền móng đứng được.** `next build` xanh trên máy thật — 84 route, 46 trang tĩnh, kiểm kiểu
   PASS. Đây là điều quan trọng nhất hôm nay: từ giờ mọi việc xây trên nền đã kiểm.
2. **Động cơ được nghiệm thu nghiêm.** 43% che phủ test ở `lib/`, `lib/boq` 88%, `lib/materials`
   76%, `lib/three` 66% — hiếm gặp ở dự án cùng quy mô.
3. **Kỷ luật N6 có tác dụng thật.** 0,9% mồ côi trên 220 component. Luật "tạo component phải chứng
   minh có nơi mount" không phải khẩu hiệu.

### Ba điều đáng lo
1. **Lệch cấu trúc, không phải lệch chất lượng.** Toàn bộ công sức nghiệm thu đổ vào `lib/`;
   `components/` — nơi khách hàng thực sự nhìn và bấm — chưa có lưới nào. Đây không phải "làm ẩu",
   đây là **thói quen tích tụ**: mỗi phiên code viết test cho hàm mình vừa viết, không ai viết test
   cho màn hình.
2. **Bức tranh còn thiếu một mảng lớn.** 48.589 dòng chưa ai mở ra. Mọi kế hoạch trước Đ2-6 đều
   dựa trên bản đồ thiếu 27% diện tích.
3. **Rủi ro pháp lý chưa quyết.** Giấy phép DWG là thứ duy nhất có thể buộc viết lại `lib/cad`
   — 36.296 dòng, mảng lớn nhất repo. Quyết muộn thì đắt gấp nhiều lần.

### Câu trả lời cho "app đang ở đâu?"

**Xong phần thô, chắc chắn. Chưa nghiệm thu phần hoàn thiện.**

Cụ thể hơn: kết cấu chịu lực đã thử tải kỹ (`lib/` 43% test) và đứng được (`build` xanh).
Cửa, tủ, thiết bị đã lắp đủ và đúng vị trí (0,9% mồ côi). Nhưng **chưa ai mở thử cái cửa nào**
(`components/` 0% test), và **có 5 phòng chưa ai bước vào** (48.589 dòng chưa soi).

Khoảng cách tới bản dùng được **không nằm ở thuật toán** — nằm ở nối dây, một model dữ liệu còn
thiếu, và việc đi soi hết những phòng chưa mở. Đó là tin tốt: ba thứ đó rẻ hơn nhiều so với viết
lại động cơ.

### Ước lượng, kèm mức tin cậy
| | Ước lượng | Tin cậy |
|---|---|---|
| Đợt 2 (6 phiếu) | đóng ~15 đỏ + mở nắp 16 mảng | **cao** — đã đo, phiếu đã soạn |
| Đợt 3 (hình học + workspace + test vỏ) | ~20 đỏ | **thấp** — `G-M2-01` là ẩn số, có thể phình thành 2 đợt |
| Đợt 4–6 | giao diện · trung tính/pháp lý · đóng gói | **trung bình** |
| Tổng còn lại | **4–6 đợt** | phụ thuộc kết quả Đ2-6 và độ lớn của `G-M2-01` |

> ⚠️ Không hứa ngày. Hai ẩn số chưa gỡ: (a) 48.589 dòng chưa soi, (b) poché có phải phẫu thuật lõi
> không. Gỡ xong hai cái đó mới ước lượng được ngày mà không nói dối.

---

## PHẦN VI · VIỆC KẾ TIẾP, THEO THỨ TỰ

| Khi nào | Việc | Ai |
|---|---|---|
| **ngay** | Dán lệnh xuất mock 3D vào cửa sổ Claude Design — đóng cửa sổ là mất | Hoà |
| **ngay** | Thả phiếu **Đ2-6** (chỉ đọc, không đụng ai, gỡ ẩn số lớn nhất) | phiên rảnh bất kỳ |
| **sớm** | Quyết giấy phép DWG — xem `docs/RESEARCH-DWG-LICENSE.md` | Hoà |
| khi rảnh | `git commit` — lệnh đã soạn, cây sạch, build xanh | Hoà |
| **11/08** | Dán Đ2-1 → Đ2-5 | Hoà |
| đợt 3 | Thêm mục **viết test cho `components/`** vào kế hoạch — hiện chưa có | TỔNG |

---

## PHẦN VII · CHƯA VERIFY — nói thẳng
- Hiệu năng lúc chạy: thời gian mở app, độ mượt kéo-thả — **chưa đo lần nào**
- Chưa mở app bằng trình duyệt trong phiên này
- Chưa đóng gói Electron thử trên máy sạch
- 48.589 dòng ở 16 mảng — **chưa ai đọc**, mọi nhận định về chúng đều là suy đoán
- Con số "58 đỏ" chỉ đúng trong phạm vi đã soi, **sẽ tăng** sau Đ2-6
