# LỘ TRÌNH ĐỢT — chốt khung 01/08/2026

> Trả lời câu "còn tổng cộng mấy đợt?". Khung do Cowork xếp theo nguyên tắc Hoà đã chốt
> (*thứ nhìn thấy được đi trước · một nền dùng nhiều tính năng*); **thứ tự trong từng đợt chưa
> chốt cứng** — xếp khi tới lượt. Nguồn: `00-CHOT.md` + 2 vòng duyệt 01/08 + `SPEC-RENDER-STUDIO §6B`.

## Đang chạy (không tính đợt)

Phần C draw-on (code chính) · B3 đo 136 MB + ĐỢT 3 `useDismissable` 21 file (code phụ) ·
6 thẻ N Render Studio (pha 1 §6B). Xong = lõi kỹ thuật sạch.

## Sáu đợt còn lại

| Đợt | Gồm | Chờ nền gì |
|---|---|---|
| **1 · Video** | V2 đường cam 2-a → V3 luồng giao thông → V4 khối 3D thô (chỉ nếu V2 có người dùng) | không — spec sẵn |
| **2 · Nhận diện + Gu** | Vitals visual · avatar picker · Brand Kit đổi hình dạng tệp → đảo nguồn · sửa `/library/ingest` · ⭐ **Đọc gu từ ảnh khách** (§6B pha 2) | `GuModel` — ✅ vào DB 01/08 |
| **3 · Tính năng đã duyệt hướng** | Editor-Toolkit · Brief-Intake · Collaboration · File-Manager | không, thứ tự tự chọn |
| **4 · Chặng 0** | Ý tưởng & Moodboard | sau đợt 3 hoặc chen lên, Hoà quyết |
| **5 · ATLAS-gated** | ArchiNote (E1: AN-0.4→AN-2) · **Lưới vật liệu/moodboard** (§6B pha 3) | **ATLAS Larkbase** |
| **6 · Phát hành** | GPL-3.0 (Hoà quyết) · `git filter-repo` xoá vết TTT · de-TTT đợt 2 (`HUONG-DAN-SU-DUNG`) | ngay trước khi giao repo ra ngoài |

## Ràng buộc chéo — chỗ "làm 1 lần ăn 2"

- **Extrude tường → khối 3D thô** là nền CHUNG của: video V4 (bậc 2-b) **và** tool *Đổi góc phối
  cảnh* (§6B pha 4, moat — đổi góc bằng hình học thuần, chính xác hơn Google Flow đoán bằng AI).
  Làm ở đợt 1 thì đợt sau được không.
- **3 tab Của IF/Cộng đồng/Của tôi** (§6B pha 5): chỉ làm khi kho thẻ đủ nhiều — không gắn đợt.

## Việc treo của riêng Hoà (không thuộc đợt nào)

1. Đọc `SPEC-SEMANTIC-MODEL.md` (7,6 KB) → gỡ nhãn duyệt cuối cùng.
2. Quyết GPL-3.0 `@mlightcad/libredwg-web` (trước phát hành).

---

*Cowork lập 01/08/2026. Đổi thứ tự đợt = quyết định của Hoà, thêm 1 dòng vào `00-CHOT.md`.*
