# 02 · Slot furniture ở chặng 3D — chốt hướng A (Revit-style)

## Bối cảnh
Hoà mô tả bằng lời một cơ chế: sidebar dọc ở chặng 3D gợi ý MỘT BỘ furniture đầy đủ (không phải
next/prev từng món) khớp Thẻ DNA dự án, tự đặt đúng slot khi chọn. Hỏi lại "số lượng slot lấy từ
đâu" — Hoà trả lời "tưởng phải định nghĩa mặt bằng như Revit đúng không?"

## Quyết định (T tự quyết, Hoà uỷ quyền "tuỳ bạn quyết")
**Chọn hướng A — Revit-style, KTS tự đánh dấu slot tay ở 2D** (placeholder nhẹ, entity RIÊNG,
KHÔNG thêm field vào `RoomEntity` — chỉ đọc `boundary`+`roomKind` sẵn có).

**KHÔNG chọn hướng B** (tự suy toàn bộ số lượng/vị trí từ mô tả, không đánh dấu tay) — vì B trùng
đúng cơ chế "AI mô tả" đang sống ở cửa chặng 1, đã nhiều vòng vá (`QA-SWEEP-REPORT.md`) vẫn còn
kêu "vẽ sai/bố cục nhảy", và ĐÃ có spec riêng chờ làm lại chưa xong (`SPEC-BRIEF-INTAKE.md` →
"Đề bài → Phương án"). Không gánh sửa 2 việc cùng lúc.

## Kiến trúc
Chặng 3D đọc slot + Thẻ DNA dự án → **mặt tiền thứ 5 của DistillEngine**: 1 danh sách dọc hiện đủ
cả bộ fur khớp DNA cùng lúc, màu/vật liệu đồng bộ theo bộ, tuỳ chỉnh từng món, chọn là tự đặt
đúng slot.

## Đã ghi vào sổ chính thức
- `docs/00-CHOT.md` — dòng "[14/08 T quyết theo uỷ quyền Hoà]"
- `scripts/frontier-registry.mjs` — entry `furniture-slot-set`, trạng thái `chua` (chưa code,
  đúng luật chốt-trước-code-sau)

## Trạng thái
CHỈ mới chốt hướng — CHƯA viết spec chi tiết, CHƯA code. Việc kế tiếp (nếu Hoà duyệt): viết spec
ngắn cho entity "slot đặt đồ" + mặt tiền DistillEngine thứ 5.
