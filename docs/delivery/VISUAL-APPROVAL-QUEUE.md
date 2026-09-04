# HÀNG ĐỢI DUYỆT MẮT

**Lập** 04/09/2026 · theo chỉ thị D3 của chủ dự án. **Cửa HARD STOP của EXS vẫn còn hiệu lực** — không thi công board chưa được duyệt mắt; hàng đợi này là để việc duyệt **rẻ và nhanh**, không phải để lách cửa.

## Luật của hàng đợi

1. **Không đưa chủ dự án xem thứ chưa qua máy.** Điều kiện tối thiểu để một mục vào cột *SẴN SÀNG*: `tsc` 0 · `npm test` 0 · dựng được · và có **ảnh chụp thật** ở khổ chuẩn, đủ hai theme.
2. **Mỗi mục cô lập ĐÚNG MỘT delta.** Trộn hai thay đổi vào một ảnh là bắt người duyệt gỡ rối hộ.
3. **Chủ dự án chỉ trả một trong ba**: `PASS` · `SỬA: …` · `QUYẾT: …`. `PASS` trở thành authority, ghi vào sổ, **không hỏi lại** trừ khi có bằng chứng xung đột MỚI.
4. **Không hỏi lại một quyết định đã có.** Trước khi thêm mục, tra `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` và `docs/ATLAS-KIEM-KE-2026-08-20.md` — nhãn `APPROVED` ở đó nghĩa là **đã qua mắt**, đừng bắt duyệt lần hai.
5. Mục nào **máy tự phán được** thì máy phán, không tiêu băng thông mắt: tương phản · bo góc ngoài thang · nhãn lệch từ điển · nút mờ đi sai đường.

> **Vì sao hàng đợi này tồn tại**: `soi:frontier` đếm **76 mục xong-MÁY đối 1 mục qua mắt**. Nút cổ chai của dự án không phải khối lượng mã — là **băng thông duyệt mắt của chủ dự án**. Mọi thứ ở đây phục vụ đúng một mục tiêu: mỗi phút chủ dự án nhìn màn hình đóng được nhiều mục nhất.

---

## A · CHỜ CHỦ DỰ ÁN QUYẾT — chặn thi công, không chặn nhau

| BOARD | AUTHORITY | THAM CHIẾU | HIỆN TẠI | DELTA | QUYẾT ĐỊNH CẦN | ĐỀ XUẤT |
|---|---|---|---|---|---|---|
| **EXS-E · chỗ đứng Vitals** | EXS **điều 7**: *"nằm VẬT LÝ trong top edge như aperture sống, không phải popover gắn lên"*; §hệ quả đóng dấu **SUPERSEDED** cho bản neo-theo-ngữ-cảnh 16/08 | `VitalsAperture.tsx` (dòng cũ) — docstring ghi `VitalsGesture` là *"BẢN CŨ, ĐÃ MỒ CÔI"* | `VitalsRightEdgeHost.tsx` (Slice 12, 03/09) **hồi sinh** bản trục phải; `VitalsPill` chỉ mount ở Home | Aperture mép trên ↔ nút cạnh trục phải — **loại trừ nhau về chỗ đứng** | Giữ điều 7 và gỡ bản trục phải, **hay** Slice 12 lật điều 7? | Giữ **điều 7** — nó là chốt mới hơn VÀ đã qua mắt; Slice 12 không mang bằng chứng lật |
| **EXS-C · bố cục Home** | EXS **điều 6** + tiêu chí trượt: *"TRƯỢT nếu Home vẫn trông như dashboard SaaS"* | `xuong-layout.ts` — **một tiêu điểm + một cụm phụ**, tự khai *"NÓ ĐÈ HƯỚNG CŨ"* | **bento 9 ô**, slice Home 03/09 còn đầu tư thêm | Trên màn rộng: một-tiêu-điểm ↔ lưới thẻ đều | Hướng chính là gì? | Theo **điều 6**. Không phải xoá bento — bản cũ đã chừa sẵn: **bento tụt xuống nhánh xếp dọc hẹp** |

⚠️ Hai mục này **chưa có ảnh** — chúng là quyết định *hướng*, không phải duyệt *hình*. Chọn hướng xong tôi mới dựng ảnh cho đúng hướng đó; dựng cả hai để so là tiêu băng thông mắt vào thứ sẽ bỏ đi một nửa.

---

## B · ĐANG DỰNG BẰNG CHỨNG — chưa đủ điều kiện trình

| MỤC | ĐÃ QUA MÁY | CÒN THIẾU ĐỂ VÀO HÀNG |
|---|---|---|
| Viewport 3D hết cắt cụt trên retina | ✅ đo Chromium DPR=2: tràn 300px → 0px; có máy canh | ảnh **màn 3D thật** — viewport chỉ mount khi đã có mặt bằng 2D, cần dựng dữ liệu trước |
| Work Panel kéo được 320–440 | ✅ `tsc` · test nav · `npm test` | **thao tác kéo thật** — script chưa đưa rail lên nấc `duyet` được |
| Nền UI: đặt chỗ · hiện dần · máy kéo | ✅ 62 khẳng định thuần | **chưa cắm vào màn nào** (nơi dùng = 0) ⇒ chưa có gì để nhìn |
| EmptyState nấc "ngoại tuyến" | ✅ 8 khẳng định **render thật** | ảnh hai theme, cạnh nấc `error` để thấy khác nhau ở đâu |
| Kệ hết món câm · Promote hết `0×0` | ✅ đo thật ở tầng hàm + CSDL | đây là **đúng-sai dữ liệu**, máy phán được ⇒ **không cần mắt** (luật 5) |

---

## C · MÁY PHÁN, KHÔNG TIÊU BĂNG THÔNG MẮT

| Việc | Máy nào canh | Trạng thái |
|---|---|---|
| Tương phản token, hai theme | `lib/ui/design-tokens.test.ts` (174 cổng) | xanh |
| Bề mặt chrome, kính chọn lọc | `lib/ui/surface.test.ts` | xanh |
| Nhãn nguồn sự thật 5 nấc | `lib/ui/truth.test.ts` | xanh |
| Bo góc ngoài thang | `soi:hinh-hoc` | 37 mục — nợ, không chặn |
| Nhãn lệch từ điển | `soi:tu-dien` | không lệch |
| Sổ ↔ mã | `soi:frontier` · `soi:contract` | 0 lệch |

---

## D · CÁCH TRÌNH — rẻ nhất cho chủ dự án

Đã có sẵn hai đường, **không dựng đường thứ ba**:
· `scripts/chup-man-duyet-mat.mjs` — chụp màn THẬT (cần server + đăng nhập), đổ ảnh thẳng vào thư mục Drive đã sync để xem trên điện thoại; ghi chú trả về ở thư mục bên cạnh.
· `scripts/nen-chrome/` — dựng + đo nguyên thể chrome **không cần server/CSDL**, cho những mục chưa có màn thật.

Mỗi lô nên gộp **theo TRẠM** (cùng một màn, nhiều mục) chứ không theo mục — chủ dự án mở một màn là duyệt được cả cụm.
