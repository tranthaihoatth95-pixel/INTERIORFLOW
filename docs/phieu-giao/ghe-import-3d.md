# PHIẾU GIAO · GI — thi công import-ghe-tu-hinh: thuật toán tạo file 3D + định nghĩa phân loại sinh chi tiết (proof Lincoln 327)

## THẺ VAI [Đ4]
- VAI: GI — agent thi công pipeline ảnh→3D-có-tham-số (entry `import-ghe-tu-hinh`), proof bằng ghế Lincoln 327 THẬT (Hoà lệnh 14/08 "dùng thuật toán tạo file 3D đi, định nghĩa phân loại sinh chi tiết").
- PHẠM VI/TRẦN: `lib/ai/models.ts` (THÊM task image-to-3D đúng khuôn task sẵn có — không phá task cũ) · `lib/idfc-import/**` (MỚI: from-photo pipeline) · script proof trong scratchpad · báo cáo. KHÔNG đụng components/UI (mặt tiền UI = phiếu sau) · KHÔNG đụng lib/cad/idfc.ts ruột (chỉ dùng type/kind sẵn).
- CHI PHÍ: tối đa 3 job fal (1-2 image-to-3D + 1 vision) — vượt là dừng báo.
- ĐIỀU KHOẢN RUỘT: [T0] cờ 3 nấc — mesh máy sinh + phân loại vision = `inferred`; params từ DF3 spec hãng = `verified`, ghi provenance từng trường · [T2] vision dùng đường captionImage sẵn (GR đã dùng) · [T5] output là NHÁP chờ duyệt, không tự đăng thẳng vào Thư viện như đồ chuẩn.

## ② ĐỌC TRƯỚC
`docs/dogfood/DF3-LINCOLN-327-SPEC.md` (spec verified + bài học phân loại có-tay/không-tay) · `lib/ai/models.ts` + `client.ts` (khuôn khai task fal + runImageJob) · fal docs model image-to-3D (ưu tiên `fal-ai/trellis` hoặc `fal-ai/hunyuan3d/v2` — kiểm model nào sống bằng 1 call thật) · `lib/cad/idfc.ts` (IdfcKind furniture + shape file) · `lib/ai/providers/nvidia.ts` captionImage.

## ④ VIỆC
1. Ảnh đầu vào: tải ảnh sản phẩm Lincoln từ trang mezzocollection (og:image/ảnh product — ảnh nền trắng studio) về scratchpad; ghi URL nguồn vào provenance.
2. `lib/ai/models.ts`: thêm task `imageTo3d` (model fal chọn được, input ảnh, output mesh GLB url) đúng khuôn — marker `imageTo3d`.
3. `lib/idfc-import/from-photo.ts` (marker `importFromPhoto`): pipeline thuần ghép — ①vision phân loại (kind/category/mô tả 3 lớp vật liệu — captionImage, cờ inferred) ②gọi imageTo3d → tải GLB ③build bản ghi `.idfc` kind furniture: { meta (tên/mã/kind/phân loại), body.component { geom3d: ref GLB, params: {w,d,h,seatH,weight} }, commerce? bỏ trống, provenance per-trường: spec DF3 = verified (nguồn mezzocollection) · phân loại = inferred (vision) · mesh = inferred (fal model nào, seed/job id) } — dùng đúng type/hàm ghi của lib/cad/idfc.ts nếu xài được, không thì JSON đúng shape + khai.
4. Script proof chạy THẬT: ảnh Lincoln → chạy pipeline → xuất `scratchpad/lincoln-327.glb` + `scratchpad/lincoln-327.idfc` (hoặc .json) — in số: kích thước file GLB, số tam giác nếu đọc được (parse GLB header/accessor), bảng tham số cuối kèm cờ từng trường.
5. Test phần thuần (build idfc record từ inputs giả — không mạng): shape đúng, cờ đúng, provenance đủ. tsc 0.

## ⑦
Báo cáo `docs/bao-cao-phien/2026-08-14-GI-ghe-3d.md`: model fal đã chọn + vì sao, số job/chi phí, chất lượng mesh nhận định thật (xem được không, lỗi topology gì), bảng tham số cuối, giới hạn nói thẳng (mesh ước-hình ≠ kỹ thuật). Trả T ≤12 dòng.
