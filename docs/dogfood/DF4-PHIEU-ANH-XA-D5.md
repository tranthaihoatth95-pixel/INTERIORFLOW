# DF4 · PHIẾU ÁNH XẠ "THUẬT TOÁN D5" — 2 ảnh tham chiếu → thông số áp cho 4 view SketchUp

> Hoà giao 14/08: *"4 view cần render, đưa vào IF với thuật toán D5, giá trị hình ánh xạ."*
> Tham chiếu B = 2 render TTT (phòng ngủ master · phòng khách) — T đọc bằng mắt, ước số.
> ⚠️ Đây là PHIẾU ĐỀ XUẤT chờ Hoà duyệt — KHÔNG tự chạy job [luật hoi-y-dinh-truoc-khi-ap-gu].

## A · ĐỌC ẢNH THAM CHIẾU (4 cấp, T ước bằng mắt — máy sẽ đo lại chính xác khi có file)

**① TỔNG THỂ**
| Thông số | Đọc được từ 2 ảnh tham chiếu |
|---|---|
| Nguồn sáng chính | **Cửa kính lớn một bên** — ánh sáng ngày xiên ngang, khuếch tán qua voan trắng; KHÔNG phải đèn trần |
| Khoá sắc độ 3 lớp | Trần **sáng nhất** (trắng ~88-92%) · tường **trung** (kem ~70-78%) · sàn **đậm nhất** (gỗ nâu ~28-38%) — tách bạch rõ, đây là thứ 4 view SketchUp đang THIẾU |
| Nhiệt độ màu | Ấm chủ đạo ~3200-3600K ở vùng đèn, ánh sáng ngày ~5500K ở cửa → **hai nhiệt độ đối lập trong một khung** (đặc trưng D5) |
| Tương phản | Trung-cao: có vùng tối thật (gầm giường, góc tủ) và cao sáng cháy nhẹ ở rèm/cửa |
| Nước hình | Sạch, ít noise, hơi lệch ấm, không HDR bệt |

**② TRẦN / TƯỜNG / SÀN**
- Trần: trắng phẳng, có gờ chỉ bắt sáng, **hắt sáng cove** viền tường (không phải đèn downlight lộ)
- Tường: kem mịn có texture rất nhẹ; mảng nhấn (đầu giường / phào tường) khác chất, cùng tông
- Sàn: **gỗ xương cá nâu đậm bóng mờ** — phản chiếu mềm, thấy bóng đồ nội thất trên sàn

**③ VẬT LIỆU**
- Gỗ óc chó vân dọc (tủ, đầu giường) · vải bouclé kem (sofa, bench) · da/nubuck nâu (gối) ·
  kim loại đồng-đen mảnh (chân bàn, khung tranh) · thảm dệt hoa văn nâu-kem
- **Không món nào bóng gương** — tất cả satin/matte, đây là chìa khoá "sang" của bộ tham chiếu

**④ CHI TIẾT**
- Đèn bàn/đèn tường **BẬT SÁNG có quầng ấm** trên tường (4 view SketchUp đang tắt hết đèn)
- Bóng đổ mềm nhiều tầng · vải có nếp thật · cây xanh thật ngoài cửa · độ sâu trường ảnh nhẹ ở hậu cảnh

## B · 4 VIEW CẦN RENDER (screenshot SketchUp Hoà gửi) — khoảng cách so tham chiếu
| View | Đang có | Thiếu gì so tham chiếu |
|---|---|---|
| V1 Khách + vách TV | vật liệu đủ, xám phẳng | ánh sáng ngày một hướng · sắc độ 3 lớp · đèn hắt cove · phản chiếu sàn |
| V2 Khách sofa | bố cục xong | như trên + đèn tường bật + chiều sâu ngoài cửa |
| V3 Phòng ăn | rèm + bàn ăn | đèn thả BẬT (đang tắt) · nhiệt độ ấm-lạnh đối lập · sàn phản chiếu |
| V4+V5 Bếp (2 góc) | tủ trắng, đảo đá | ánh sáng bên · sắc độ tủ ≠ tường · đèn ray/hắt tủ bật |

## B2 · ⭐CẶP ĐỐI CHỨNG THẬT (Hoà gửi thêm 14/08) — quý nhất bộ dữ liệu
Ảnh D5 mới = **CHÍNH view V2 (khách sofa)** của loạt screenshot → có **before/after cùng một
view**: SketchUp thô ↔ D5 hoàn chỉnh. Đây là GROUND TRUTH, dùng 2 việc:
1. **ĐO ánh xạ chính xác** thay vì ước: cùng khung hình, cùng bố cục → sai khác luminance từng
   lớp/WB/tương phản/độ bão hoà giữa 2 ảnh CHÍNH LÀ hàm ánh xạ cần áp cho 4 view còn lại.
2. **THƯỚC CHẤM ĐIỂM**: chạy thuật toán IF trên screenshot V2 → so kết quả với bản D5 thật này
   → ra số "IF đạt bao nhiêu % so người render D5" — lần đầu đo được chất lượng engine, không cãi cảm tính.

Đọc nhanh cặp này (T soi mắt): D5 thêm — cảnh ngoài cửa THẬT (trời + cỏ, thay trắng bệt) ·
đèn cầu BẬT ấm · thảm từ mảng phẳng thành sợi dệt có chiều · rèm có nếp và bắt sáng · tường
có texture hạt mịn · sàn đá phản chiếu mềm · tổng thể ấm lên rõ, sắc độ 3 lớp tách bạch.
⇒ Củng cố M2: giữ nguyên bố cục/vật liệu, chỉ áp ÁNH SÁNG + CHẤT + SẮC ĐỘ.

## C · BA MỨC CƯỜNG ĐỘ ÁP — **HOÀ CHỌN 1**
| Mức | Làm gì | Được / Mất |
|---|---|---|
| **M1 · Bám sát 100%** | ép cả sắc độ, nhiệt màu, vật liệu, ánh sáng theo tham chiếu | Giống nhất; RỦI RO đổi cả vật liệu Hoà đã chọn trong SketchUp |
| **M2 · Cân bằng 70%** ⭐T đề xuất | giữ NGUYÊN vật liệu + bố cục của model; chỉ áp **ánh sáng + sắc độ 3 lớp + nhiệt màu + nước hình** | Giữ đúng thiết kế, lên chất D5; đây đúng nghĩa "ánh xạ giá trị" |
| **M3 · Gợi hướng 40%** | chỉ chỉnh tông màu/độ tương phản tất định (0 credit) | Rẻ, nhanh, nhất quán tuyệt đối; chưa có GI/đèn bật thật |

## D · CẦN ĐỂ CHẠY MÁY
1. Hoà chọn **M1/M2/M3** (và sửa dòng nào trong mục A nếu T đọc sai ý).
2. Thả file vào `~/Downloads/IF-LOAT-ANH/`: 4-5 screenshot vào `loat-A-screenshot/`, 2 ảnh D5 vào `tham-chieu-B/`.
Có 2 thứ đó là máy: đo tham chiếu ra số → áp CÙNG preset + CÙNG seed cho cả loạt → đo lại kiểm nhất quán → trình bảng lệch.
