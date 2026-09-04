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

## A · HAI QUYẾT ĐỊNH — ĐÃ ĐÓNG 04/09

| | Chốt | Hệ quả thi công |
|---|---|---|
| **Chỗ đứng Vitals** | **GIỮ EXS §7** — khẩu độ sống **vật lý ở mép trên**, 3 mức Ambient→Peek→Engage. Trục phải **SUPERSEDED** | Tách **hành vi** khỏi **chỗ đứng**: hành vi Slice 12 không đụng EXS thì ADAPT vào khẩu độ; sau di trú còn **đúng một chỗ đứng vật lý**. 🔴 Kèm một **lỗi chức năng đang sống**: panel Vitals không còn nơi mount nào từ 17/08 ⇒ gõ ở thanh trạng thái + Enter là mất câu hỏi, ⌘J chết |
| **Bố cục Home** | **GIỮ EXS §6** — desktop: **một tiêu điểm chính** (Resume) + **một cụm phụ hạng dưới hẳn**. Không dashboard SaaS, không bento 9 thẻ | Bento **ở lại làm nhánh khổ hẹp**, không định nghĩa thứ bậc desktop. *"Đừng giữ bento chỉ vì mã đã có sẵn"* |

⇒ Trọng tâm chuyển từ **thu hồi** sang **hoàn tất thị giác**. Đường đi cố định cho mọi board:
`AUTHORITY → THI CÔNG → MÁY KIỂM → ẢNH CHUẨN → DELTA → MẮT HOÀ`.

## A2 · LÔ DUYỆT MẮT #1 — ✅ ĐÃ TRÌNH, CHỜ MẮT HOÀ

📄 **Bản trình: `docs/delivery/VISUAL-REVIEW-BATCH-01.md`** — ba tấm, mỗi tấm đúng năm mục
(NGUỒN LUẬT · BẢN ĐANG CÓ · LỆCH · MÁY ĐÃ XÁC MINH GÌ · HOÀ PHẢI PHÁN GÌ).

Ba mục **cùng một lô** vì chúng chạm nhau ở mép trên màn hình; duyệt rời là bắt nhìn ba lần cùng một vùng.

| Tấm | Cổng máy | Trạng thái |
|---|---|---|
| **1 · HOME khổ rộng** | tỉ lệ 1,62 đo ở 1600 và 1280 · bốn chiều cao mục phụ khác nhau · tsc 0 · test lõi xanh · ảnh 3 khổ × 2 nền | **CHỜ MẮT** |
| **2 · VITALS khẩu độ mép trên** | `mot-cho-dung.test.ts` 8/8 — đúng một chỗ mắc, đúng một ⌘J, hai bản cũ không mắc ở đâu · ảnh 3 mức × 2 nền × 2 stage | **CHỜ MẮT** |
| **3 · Chrome/điều hướng mép trên** | ba nấc 52/240/320 khoá bằng test · ba cụm khớp điều 3 | **CHỜ MẮT** — kèm **một chỗ CHƯA XÁC MINH** đã khai thẳng: kéo Work Panel 320→440 |

⚠️ Mục 3 mang theo một dòng **CHƯA XÁC MINH ≠ ĐẠT** — khai trong bản trình, không giấu.

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
