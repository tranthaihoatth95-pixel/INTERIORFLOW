# LATEST — bản nén trí nhớ bối cảnh IF (ghi đè mỗi phiên lớn)

> **Đọc file này ĐẦU TIÊN**, rồi **`docs/coordination/IF-LIVE-BRIDGE.md`** (tóm tắt sống nhất,
> MAIN↔ChatGPT), rồi `docs/memory/sessions/2026-08-20/09-main-parallel-waves-handoff/README.md`
> (chi tiết đầy đủ phiên vừa xong), rồi `docs/INTERIORFLOW-ARCHITECTURE-MAP.md` nếu cần bối cảnh
> kiến trúc xa hơn. Luật giữ bản nén: **CHỈ tên + đường dẫn + một câu. Cấm chép nội dung.**

**Cập nhật lần cuối: 2026-08-20 đêm khuya (MAIN — 3 wave song song + UX pass + sửa bug generation THẬT)**

## ⭐ ĐỌC NGAY: `docs/coordination/IF-LIVE-BRIDGE.md` — tóm tắt LIVE/PARTIAL/MISSING mới nhất
File đó là nguồn sự thật sống, cập nhật liên tục trong phiên. File này chỉ trỏ đường.

## Git — backup/2026-08-19-batch0a tip `2d7b962` (đã push), main `2dfed16` CHƯA nhập
8 checkpoint tuần tự trong phiên (mới→cũ): `2d7b962` sửa timeout+lỗi dịch generation ·
`7418ac8` UX Coherence Pass (3 lane) · `f3e6d89` login color+chẩn ComfyUI · `a3ff86a` Demo Spine
Wave 3 · `7e1001b` Wave 2 (3D+Files) · `4a8801d` Wave 1 (2D+Home+Activity) · `1824ddd` CommandLine
quiet · `9a3934e` tip cũ phiên trước.

## Hạ tầng đang chạy lúc bàn giao (đo lại, không phải suy đoán)
- App dev server :3001 (PID mới sau restart giữa phiên), tsc 0.
- **ComfyUI THẬT chạy 127.0.0.1:8188** (PID 18339, khởi trực tiếp `main.py`, KHÔNG qua Comfy
  Desktop.app — app đó treo vô hạn). Model SDXL+ControlNet khôi phục bằng SYMLINK từ bản cài
  ComfyUI khác trên cùng máy — đã CHẠY THẬT 2 job generation thành công (22-25 phút/lượt nguội).
- Migration `ProjectFile.reviewState` **CHƯA CHẠY** — backup DB sẵn
  (`prisma/dev.db.bak-20260820-pre-review-migration`), lệnh chờ Hoà:
  `npx prisma migrate dev --name add_project_file_review_state`.

## Việc lớn nhất phiên — SỬA BUG GENERATION THẬT (không phải env/infra)
`lib/ai/client.ts` timeout 3 phút quá ngắn cho ComfyUI tự-host (lượt nguội thật mất 22-25 phút) +
`lib/execution.ts` dịch nhầm lỗi timeout thành "backend chưa chạy" — ĐÃ SỬA + RE-TEST SỐNG THÀNH
CÔNG (ảnh thật 960×640 trả về UI). Chi tiết đầy đủ: session `09-main-parallel-waves-handoff`.

## Phát hiện mới CHƯA XỬ — P0 tiếp theo
**Controlled Edit là vỏ không ruột**: 7 lệnh chỉnh sửa ảnh (Chọn thông minh/Co giãn vùng/Thêm
lớp/Gộp lớp/Chế độ hoà/Đường cong/Cân trắng) đều hiện đúng UI nhưng cùng title "chưa nối bộ thi
hành" — 0 lệnh chạy được. Xem mục 4+7 của README phiên 09.

## Câu hỏi còn ngỏ
Route-bounce/auto-redirect-to-Home: KHÔNG tái hiện suốt ~45 phút clean-window (0 lane song song)
— nghiêng "nhiễu đa-agent lúc hot-save" nhưng CHƯA đóng hẳn, cần 1 lượt dùng thật (không phải
đứng yên) mới kết luận.

## Bài học đắt nhất phiên (đừng lặp lại)
`GIT_INDEX_FILE=/tmp/x_$$` PHẢI ở CÙNG một lệnh Bash với `git write-tree` dùng nó — tách 2 lệnh
Bash riêng thì `$$` đổi PID, index rỗng, suýt push commit TREE RỖNG lên remote (đã xảy ra thật 1
lần, force-fix ngay). Mọi checkpoint sau đều guard `git ls-tree | wc -l` ≥ 2000 trước khi commit.

---
### Lịch sử ngày 20/08 trước phiên này (đã nén, không mở lại trừ khi cần)
`sessions/2026-08-20/01-golden-journey-asset-nn/` · `02-reference-ui-golden-journey/` ·
`03-night-shift-4-lane/` (backup tip cũ `5bc0996`, đã supersede) · `04-hash-dedupe-design/` ·
`05-hash-schema-va-don-rac/` · `06-manufacturer-idfc-import/` ·
`07-ban-giao-main/` (2 lane chết dở — ĐÃ hoàn tất/checkpoint trong phiên 08-09) ·
`08-truth-map-ux-study/` (truth map + UX study ban đầu, dẫn tới toàn bộ 3-wave plan).
