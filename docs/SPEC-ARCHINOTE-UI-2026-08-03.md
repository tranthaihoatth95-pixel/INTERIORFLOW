# SPEC · GIAO DIỆN ARCHINOTE — hệ riêng, khác InteriorFlow
**Hoà chốt trực tiếp 03/08/2026** qua chuỗi quyết định trong phiên COWORK-TỔNG. File này là nguồn chuẩn cho mọi mock/code ArchiNote. Kế thừa `SPEC-ARCHINOTE-DETAIL-v1.md` (5 khối chức năng), KHÔNG đập (§0d).

## §1 · PHÂN VỊ HAI APP — luật gốc, đọc trước mọi thứ khác
| | **InteriorFlow** | **ArchiNote** |
|---|---|---|
| Vai | **MÁY PHÁT** — tạo ra sản phẩm | **MÁY THU** — thu vào dữ liệu thật |
| Sản phẩm | bản vẽ · mô hình · ảnh · hồ sơ | số đo · ảnh hiện trường · ghi âm · ghi chú · tri thức |
| Thiết bị chính | **máy tính** (tablet phụ) | **điện thoại** (tablet phụ, máy tính chỉ xem lại) |
| Bối cảnh | ngồi bàn, phiên dài, chuột + bút | đứng công trường, bụi/nắng, một tay, mạng chập chờn |
| Cảm ứng để làm gì | **VẼ CHÍNH XÁC** | **GHI NHANH** |
| Nối nhau | qua ATLAS/Lark — **chung một nguồn sự thật**, KHÔNG gọi thẳng nhau |

⚠️ **Cơ chế cảm ứng nghiên cứu cho tablet IF chỉ HỌC, KHÔNG bê nguyên.**
- HỌC: chống tì tay · vùng chết mép trái · mọi cử chỉ đều có nút tương đương
- KHÔNG lấy: bắt điểm chính xác · ô nhập số kiểu CAD · bảng tròn 8 múi · thanh công cụ nhiều lớp

## §2 · MÀU — hai app hai nhiệt độ
| | InteriorFlow | ArchiNote |
|---|---|---|
| Chủ đạo | tím lạnh `#6a57f5` | **KEM là nền và thân — vàng CHỈ điểm nhấn** |
| Nền mặc định | tối | **sáng** (cảm giác giấy) |
| Vai của tím | nhân vật chính | **nhấn rất nhẹ** — chấm trạng thái, icon nhỏ, viền mảnh; không nền lớn |

**Luật tương phản (bắt buộc):**
1. Chữ ≥ 4.5:1 · viền/icon/vạch ≥ 3:1.
2. **Vàng/kem KHÔNG BAO GIỜ làm màu CHỮ** — chỉ làm nền khối, vạch, nhấn. Chữ luôn mực đậm.
3. Chữ trên nền vàng = mực đậm, KHÔNG phải trắng.
4. Trạng thái phân biệt bằng **sáng-tối trước**, màu là lớp phụ (người mù màu vẫn dùng được).
5. Ngoài nắng: nền kem đậm hơn một bậc, mực đen hơn, chữ to hơn app máy tính một bậc.

**⚠️ SỬA 03/08 (Hoà: "vàng giấy quá"): TỈ LỆ MÀU KIỂU APPLE.**
Không phải "kem + vàng" ngang nhau. Đúng là: **kem/trắng ngà chiếm ~90% mặt phẳng · sắc độ xám ấm lo toàn bộ phân cấp · vàng ≤5% diện tích · tím ≤1%**.
- Vàng CHỈ xuất hiện ở: nút chính đang mời bấm · vạch mảnh của mục đang chọn · chấm trạng thái · dải tiến độ. Hết.
- **Không** nền vàng cho khối lớn, **không** thẻ vàng, **không** tiêu đề vàng, **không** đường kẻ vàng chạy dài.
- Phân cấp bằng **sắc độ + khoảng trắng + cỡ chữ** trước; màu là thứ cuối cùng mới dùng.
- Phép thử: chụp màn hình rồi khử màu — nếu vẫn đọc được thứ tự quan trọng thì đạt. Nếu mất màu là loạn thì đang dựa vào màu quá nhiều.
- Nhiều khoảng trống hơn mình tưởng là đúng; chật chội mới là sai.

**Màu chuyển & kính:** chỉ chuyển trong CÙNG sắc (kem→vàng nhạt), nhẹ tới mức gần như không nhận ra — cảm giác giấy có ánh sáng chiếu, không phải nền gradient. Kính chỉ cho lớp NỔI, cấm kính lồng kính.

## §3 · LUẬT MOBILE-FIRST
- Mọi việc chính làm được **bằng một ngón cái**; nút chính ở **nửa dưới màn**, không bao giờ góc trên
- Nút chính **≥56px** (không phải 44px như IF)
- **Ba chạm / ba giây**: mở app → ghi xong một số đo ≤ 3 chạm
- Mọi thao tác ghi **chạy được khi mất mạng** + dải báo "đang lưu tạm, sẽ gửi sau" kèm số mục chờ

## §4 · KÉO THẢ CẢM ỨNG (áp cả tablet IF)
| Vấn đề | Luật |
|---|---|
| Kéo lẫn với cuộn | **giữ 250ms mới nhấc**; chỗ có tay nắm ⠿ thì kéo ngay |
| Nhấc lên | phóng 1.03 · bóng sâu · nghiêng nhẹ · rung một nhịp |
| Ngón che vật | vật nhấc **lên trên điểm chạm ~40px**; hiện dạng RÚT GỌN (tên + icon) |
| Không biết thả đâu | danh sách **tự dạt tạo khe hở** + đường kẻ màu nhấn; vùng nhận sáng viền, vùng không nhận mờ đi |
| Kéo tới mép | **tự cuộn**, càng sát mép càng nhanh |
| Thả & sửa sai | hạ mềm + rung nhẹ + dải "Đã chuyển sang [X] · Hoàn tác" 4 giây; thả ngoài vùng → bay về chỗ cũ |
| 🔴 CẤM | kéo thả là đường **DUY NHẤT**. Mỗi chỗ phải có đường thứ hai (nhấn giữ mở menu / nút trong chi tiết) — công trường tay bẩn, găng tay, màn ướt |

**Bốn chỗ kéo thả phải dựng rõ:** ① việc sang người khác trên lưới tải việc — **hiện % tải MỚI ngay lúc còn đang kéo, đỏ lên nếu quá tải** ② thẻ việc giữa các cột ③ ảnh vừa chụp vào một phòng ④ sắp xếp thẻ sống.

## §5 · ICON THAY CHỮ — có ranh giới
**Icon hoá:** công cụ · trạng thái · loại tệp · hành động lặp hằng ngày. Nét đều cùng một họ, không trộn nét với đặc.
**Bắt buộc kèm:** tooltip khi rê chuột · nhãn chữ ở chế độ cảm ứng · lần đầu gặp thì kèm chữ, quen rồi mới rút.
**CẤM icon hoá:** nhãn dữ liệu · tên trường · **nút quyết định quan trọng (Xoá · Gửi khách · Xuất hồ sơ)** — bấm sai là trả giá.

## §6 · MÀN ĐÃ GIAO CHO CLAUDE DESIGN (03/08)
Điều phối (phase board · lưới tải việc) · Hiện trường · Bảng tổng · Trợ lý điều hành · **Thư viện tri thức** (kệ sách vật lý, nhóm theo trạng thái đọc, bìa tự sinh cho PDF) · Bảng theo dõi + thẻ sống · Kế hoạch (Lịch · Tiến độ · Bảng việc) · Họp nhanh ghi âm→chữ→việc · Ảnh 360 có vòng điều khiển + mini mặt bằng · **Ghi chú viết tay** (bộ cọ vẽ hình thật trong khay).

## §7 · BỐ CỤC BENTO — có ranh giới
**Dùng cho màn TỔNG QUAN**: bảng theo dõi · trang dự án · bảng tổng · cài đặt · chọn loại hồ sơ. Ô 1×1/2×1/2×2, cùng bo góc, cùng khoảng hở, **mỗi ô một ý**.
🔴 **KHÔNG bento cho màn LÀM VIỆC** (2D · 3D · bảng nút · ảnh 360 · ghi chú): vùng làm việc phải **liền một khối càng lớn càng tốt** — chia ô nhỏ là giết công cụ. *(Lý do ghi rõ để phiên sau không đề xuất lại: bento chia đều sự chú ý, còn lúc vẽ thì không muốn chia gì cả.)*

## §8 · KHUNG THIẾT BỊ khi dựng mock
| Loại màn | Khung |
|---|---|
| 3 chặng IF · bảng nút · thư viện · cài đặt | máy tính 16:10 |
| Vẽ tay · khảo sát · 360 · sổ tay | tablet ngang 4:3 |
| **Mọi màn ArchiNote** | **điện thoại dọc 19.5:9 trước**, các khung khác là biến thể |
| Sổ tay · tri thức · kế hoạch | thêm điện thoại gập: **vẽ cả gập (≈21:9) và mở (≈9:8)**, nếp gập KHÔNG cắt ngang chữ/nút |
Không chắc số đo máy thì dùng đúng **tỉ lệ**, không bịa milimét.

## §9 · ĐỌC ẢNH THAM KHẢO — theo Luật #7 (tách lớp)
Hoà gửi 14 ảnh 03/08. Lấy **cấu trúc + cơ chế**, KHÔNG lấy màu, KHÔNG lấy chữ serif.
| Nguồn | Cơ chế lấy |
|---|---|
| Ghi chú màn gập | một ghi chú chứa cả ảnh + chữ + ghi âm + việc; thanh định dạng dọc; 2 bố cục rộng/hẹp |
| Thẻ dẫn đường | **timeline dọc chồng trên nền bản đồ** — nói thẳng 3 câu cần biết thay vì vẽ biểu đồ |
| Acme AI 3 cột | sidebar · nội dung có tab lọc · panel chi tiết **có nguồn trích** |
| Workflow plan | thanh tiến độ = **thẻ có vạch màu trái** + badge số ngày + đường "Hôm nay" dọc có nhãn viên thuốc; **phân biệt bằng sáng-tối, không bằng màu** |
| Reclaim Your Time | trục thời gian có **vạch chia như thước** |
| Lịch dashboard | **popover sửa nhanh ngay trên lưới** + cột phải theo giờ |
| Readowl | **kệ sách vật lý** (thanh đỡ + bóng đổ) · nhóm theo **trạng thái đọc** · thẻ "Đọc tiếp" ghim |
| Side nav kính | dải dọc viên thuốc kính, mục chọn nền đặc, logo trên avatar dưới |
| Wireframe xe hơi | **bản khung dây kèm ghi chú gạch chỉ** — kiểm bố cục không bị màu đánh lừa |
| Workly | **ô tìm hiện luôn phím tắt** — dạy đường tắt mà không cần dạy |
