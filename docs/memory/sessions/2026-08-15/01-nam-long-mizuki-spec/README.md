# 01 · Nam Long Mizuki CCTM1 — cross-check spec vật liệu sảnh/thang/hành lang

> **Loại việc:** Việc khách hàng THẬT, NGOÀI phạm vi sản phẩm IF — dùng công cụ đọc PDF/hình học
> để xử lý hồ sơ dự án ngoài, KHÔNG động vào code IF. Ghi lại đây vì thuộc phiên làm việc, không
> vì nó là tính năng IF.

## Bối cảnh
Hoà đưa 6 file PDF/xlsx dự án Nam Long Mizuki (`~/Downloads/NL MIZUKI/`) — 1 spec vật liệu tổng
(61 trang, 58→90 mã thật) + 4 bản vẽ khu sảnh/thang/hành lang. Yêu cầu: lọc spec tổng chỉ giữ
trang có mã dùng ở khu sảnh-thang-hành lang tầng điển hình, giữ NGUYÊN visual gốc, đổi bìa đúng
tên hạng mục, và báo cáo mã nào dùng trên bản vẽ mà KHÔNG có card trong spec (xung đột).

## Quyết định / sai lầm tự sửa (quan trọng nhất)
1. **Lần quét đầu SAI** — tưởng catalog là "1 mã/1 trang" (58 mã), quét cả 32 trang TẦNG 4 (khu
   hỗn hợp gym/yoga/kid) → kéo nhầm VL-03/VL-04 (sàn gym) vào bản giao. Tự phát hiện qua soi mắt
   trang xuất ra ("VỊ TRÍ: SÀN KHU GYM" in rõ trên card).
2. Quét lại đúng: catalog thật có **90 mã** (nhiều trang chứa 2 card), TẦNG 4 chỉ giữ đúng trang
   22 (mặt đứng sảnh thang máy — trang 23 là vách gym+pantry, loại).
3. Sửa font tiếng Việt (PyMuPDF base font thiếu dấu) bằng nhúng Arial thật.

## Kết quả cuối
- File giao: 19 trang (bìa+duyệt+lưu ý giữ nguyên + 16 trang vật liệu đúng khu vực).
- 16 mã khớp spec (EP-02/03, EPA-04, ML-03, PL-01, SK-01/03, SS-01/02, ST-02/03, TL-03/04, LM-02,
  WD-02) — đã soi mắt từng trang xác nhận VỊ TRÍ đúng khu.
- 6 mã "xung đột" thật (EP-01, EP-06, GL-03, GL-04, SK-04, LM-07C) — dùng trên bản vẽ, KHÔNG có
  card trong spec 90-mã — báo cáo cho Hoà như phát hiện QC thật.
- File cuối: `~/Downloads/NL MIZUKI/SPEC-VAT-LIEU-SANH-THANG-HANHLANG-DIENHINH-CCTM1.pdf`.

## Bài học giữ lại
- Đếm trang PDF hệ thống báo SAI nghiêm trọng (203/216/148/247 so với thật 21/32/22/56) — luôn
  tự đếm lại qua `pdf.numPages` + regex `/Count N` trước khi lập kế hoạch theo số trang.
- Catalog "1 mã/1 trang" là giả định sai — phải quét MỌI "MÃ SỐ" trên trang (matchAll), không chỉ
  match đầu tiên.
