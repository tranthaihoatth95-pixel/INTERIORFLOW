# IF · LIVE BRIDGE — điểm nối duy nhất MAIN ↔ ChatGPT

> Cập nhật lần cuối: 20/08 đêm khuya, bàn giao hết context. Chi tiết đầy đủ:
> `docs/memory/sessions/2026-08-20/09-main-parallel-waves-handoff/README.md` (đọc file đó nếu
> cần bằng chứng/lệnh chính xác). File này CHỈ tóm.

## CURRENT
- Git: `main` (remote) `2dfed16`, KHÔNG nhập. `backup/2026-08-19-batch0a` tip **`2d7b962`**, đã push. 8 checkpoint sạch trong phiên, mỗi checkpoint có guard chặn tree rỗng.
- App :3001 (đã restart 1 lần giữa phiên cho clean window), tsc 0. Login `demo@if.local`/`demo1234`, project `cmsl8prn80001w9i2ud3bfdgr`.
- **ComfyUI THẬT chạy `127.0.0.1:8188`** (PID 18339, khởi trực tiếp qua `main.py`, không qua Comfy Desktop.app — app đó treo vô hạn lúc khởi động). Model SDXL+ControlNet khôi phục bằng SYMLINK từ bản cài ComfyUI khác trên cùng máy — **đã CHẠY THẬT 2 job generation thành công** (22:48 và 25:38, lượt nguội).
- Migration `ProjectFile.reviewState` CHƯA CHẠY — backup DB sẵn (`prisma/dev.db.bak-20260820-pre-review-migration`), lệnh chờ Hoà: `npx prisma migrate dev --name add_project_file_review_state`.

## LIVE (mới trong phiên này)
- **Generation thật hoạt động end-to-end** — Sketch→Ảnh thật qua ComfyUI tự-host, xác nhận bằng DOM (`naturalWidth:960, complete:true`, base64 PNG thật), không phải mock.
- Activity/Flow (chuông→Peek→cột phải, dữ liệu thật) · 3D selection feedback · Image→Spec bấm được từ cả 2D/3D · Spec→Present handoff · Files→Promote→Library→Where-Used (verify UI thật) · Home cá nhân hoá (reorder/pin/hide, persist) · 2D StatusBar gọn · Library Browse→Passport→Technical-Verify · rail grammar đồng nhất Home/2D/3D.

## ⭐ SỬA BUG GENERATION THẬT (checkpoint `2d7b962`) — không phải env/infra
`lib/ai/client.ts` `TIMEOUT_MS=180_000` (3 phút) sai cho ComfyUI tự-host lượt nguội (đo thật 22-25 phút) + `lib/execution.ts` `friendlyAiError()` dịch nhầm timeout thành "backend chưa chạy". Đã sửa: `COMFYUI_TIMEOUT_MS=2_400_000` (40 phút, chỉ áp self-host) + nhánh thông điệp riêng cho timeout thật. **RE-TEST SỐNG THÀNH CÔNG** sau khi sửa — ảnh thật trả về UI, không lỗi sớm.

## ⭐ P0 TIẾP THEO — Controlled Edit là vỏ không ruột
Mở kết quả generation ra: 7 lệnh (Chọn thông minh/Co giãn vùng/Thêm lớp/Gộp lớp/Chế độ hoà/Đường cong/Cân trắng) đều có UI thật nhưng cùng title `"Lệnh của môi trường này — chưa nối bộ thi hành"`. 0 lệnh chạy được. Gợi ý bắt đầu từ lệnh biến-đổi-ảnh-thuần (Cân trắng/Đường cong) trước AI-based (Chọn thông minh) — rẻ hơn để chứng minh đường dây chạy.

## PARTIAL / MISSING
- Controlled Edit (xem trên) — P0.
- Present live sheet preview — chrome đúng, thiếu nối data.
- Gallery Home vẫn 1 ảnh/tuần.
- 2D near-pointer contextual actions — xác nhận thật sự chưa có.
- `ProjectFile.reviewState` — chờ Hoà migrate.
- Route-bounce/auto-redirect — xem UX FINDINGS.

## UX FINDINGS
- Route bounce: KHÔNG tái hiện suốt ~45 phút clean-window (0 lane song song, kể cả qua 1 lần khoá-màn-hình-do-idle rồi mở lại). Nghiêng "nhiễu đa-agent lúc hot-save" nhưng CHƯA đóng hẳn — cần lượt DÙNG THẬT (không phải đứng yên) để kết luận chắc. Một nguyên nhân thật đã xử: cờ `stageDone` chết trong `ProjectSelect.tsx`.
- Present từng crash toàn app tạm thời giữa phiên do lỗi mid-edit của 1 lane trong `LibrarySheet.tsx` — tự hết khi lane xong, phân loại DEV HOT-RELOAD ARTIFACT, không phải lỗi ở trạng thái nghỉ.

## DECISIONS
- Naming "Chuyên" giữ nguyên · widget resize theo luật cũ (không lưới 9-ô tự do) · Motion Relationship Law ghi nhận chờ thi công.
- Model khôi phục bằng SYMLINK, không copy, không tải lại, không đổi workflow.
- KHÔNG tự chạy `prisma migrate` — chờ Hoà.

## NEXT 3
1. **P0 Controlled Edit** — nối bộ thi hành thật cho ít nhất 1-2 lệnh.
2. Một lượt QA DÙNG THẬT (không phải đứng yên chờ) để đóng hẳn câu hỏi route-bounce.
3. Present live sheet preview → sau đó diễn tập demo loop đầu-cuối lần cuối → mới xét nhập `main`.

## TO CHATGPT
- "Plan branch" và phạm vi Credits UI vẫn UNKNOWN/DEFER, chưa đủ dữ kiện.
- Phiên này bàn giao hết context — người kế tiếp nên đọc `docs/memory/sessions/2026-08-20/09-main-parallel-waves-handoff/README.md` mục 6 ("bài học đắt") trước khi tự tay checkpoint git, để không lặp lại lỗi `GIT_INDEX_FILE` đã gặp.
