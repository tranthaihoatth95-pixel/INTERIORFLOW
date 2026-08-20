# IF · LIVE BRIDGE — điểm nối duy nhất MAIN ↔ ChatGPT

> Cập nhật lần cuối: 20/08 đêm, sau UX/UI Coherence Pass (Lane 1 Shell/Home/Vitals/Activity ·
> Lane 2 2D · Lane 3 3D/Present/Library/Review) checkpoint + ComfyUI models khôi phục thật.
> Chi tiết đầy đủ: `docs/memory/sessions/2026-08-20/08-truth-map-ux-study/README.md`. File này CHỈ tóm.

## CURRENT
- Git: `main` (remote) `2dfed16`, KHÔNG nhập. Việc thật ở `backup/2026-08-19-batch0a` tip `7418ac8` (UX Coherence Pass) — checkpoint sửa timeout/lỗi generation đang chuẩn bị ngay sau file này.
- ⭐ **BUG THẬT ĐÃ SỬA (không phải env/infra, không phải hot-reload)**: chạy generation thật đầu tiên trong phiên (Sketch→Ảnh thật, ComfyUI tự-host, lượt NGUỘI) mất **25 phút 38 giây** — ComfyUI xác nhận `status:success` + ảnh thật 1.2MB trên đĩa, NHƯNG `lib/ai/client.ts` `TIMEOUT_MS=180_000` (3 phút) khiến client bỏ cuộc từ lâu trước khi job xong, VÀ `lib/execution.ts` `friendlyAiError()` khớp nhầm chữ "timeout" vào nhánh "backend chưa chạy/không kết nối" — hiện SAI thông điệp, dễ khiến người dùng tắt ComfyUI giữa lúc job sắp xong. Đã sửa: thêm `COMFYUI_TIMEOUT_MS=2_400_000` (40 phút) CHỈ áp cho provider tự-host (cloud fal/sd giữ nguyên 180s) + thêm nhánh riêng cho thông điệp timeout thật ("job vẫn đang chạy, đừng tắt") tách khỏi nhánh mất-kết-nối. tsc 0, test liên quan pass.
- Server app :3001, login `demo@if.local`/`demo1234`, project `cmsl8prn80001w9i2ud3bfdgr`. tsc 0 xuyên suốt cả 3 lane UX (verify độc lập từng lượt).
- **ComfyUI THẬT chạy `127.0.0.1:8188`** — model SDXL + ControlNet-canny đã KHÔI PHỤC bằng symlink từ một bản cài ComfyUI khác trên CÙNG máy (không tải lại, không đổi workflow). Đã xác nhận qua chính API ComfyUI (`/object_info/CheckpointLoaderSimple`) rằng `sd_xl_base_1.0.safetensors` đã hiện diện. **Chưa chạy lại 1 job generation thật kể từ khi khôi phục model** — môi trường lúc đó đang bị 3 lane UX cùng hot-save, MAIN chủ động HOÃN test để tránh kết quả không tin cậy, đúng chỉ đạo "clean verification window".
- **Migration `ProjectFile.reviewState`: CHƯA CHẠY** — đã kiểm trực tiếp `sqlite3 prisma/dev.db "PRAGMA table_info(ProjectFile)"`, 3 cột reviewState/reviewedAt/reviewedBy CHƯA có. Backup `prisma/dev.db.bak-20260820-pre-review-migration` đã sẵn sàng, integrity-check OK. Đợi Hoà chạy `npx prisma migrate dev --name add_project_file_review_state`.

## LIVE (bổ sung sau UX pass — giữ nguyên phần LIVE của các checkpoint trước, xem git log)
- **Rail 2-đảo grammar xác nhận đồng nhất qua Home/2D/3D** — active state là viền tint 5% + vạch accent trái 2px (`RailDieuHuong.tsx` `NEN_DANG_MO`), KHÔNG phải purple-fill. Cụm phải-trên (Vitals/Activity/Avatar) cùng vị trí xuyên suốt.
- **Xoá 1 nguyên nhân thật của "auto-redirect"**: cờ `interiorflow.stageDone` localStorage — write cuối cùng còn sót trong `ProjectSelect.tsx` (0 chỗ đọc còn lại trong toàn repo) đã bị xoá. Không đóng hẳn hiện tượng (còn liên quan Zustand `currentProjectId`/`workspace` chia sẻ giữa các tab), nhưng giảm thật một nguồn.
- **2D StatusBar bottom-edge hết dày**: danh sách "Bắt điểm: ..." dài giờ thu về icon nam châm (chấm mờ ở Sơ phác, icon+số ở Chuyên), mở đầy đủ qua Tooltip hover/focus có sẵn — không đẻ cơ chế thứ hai.
- **Library Browse→Passport→Technical Verify**: click item mở "Hộ chiếu" nhẹ (ảnh lớn + 2-3 fact chính + nút "Xem thông số kỹ thuật →") trước khi vào cột spec dày đặc cũ — đúng phân tầng brief yêu cầu.
- **3D Command3DPanel mặc định thu gọn** (`defaultOpen={false}`, cùng mẫu panel xuất bên phải) — viewport chiếm ưu thế hơn ngay từ đầu.
- **Present Page Setup xác nhận ĐÃ ĐÚNG cấu trúc** (full-work-area, tờ giấy cột chính rộng + cài đặt cột phụ hẹp, KHÔNG phải modal giữa màn) — không cần sửa chrome, chỉ còn thiếu NỘI DUNG preview thật (data-wiring, không phải UX/chrome).

## PARTIAL / MISSING (không đổi nhiều so với trước, các mục chính còn treo)
- Real generation chưa re-test sau khi model khôi phục (xem CURRENT).
- Gallery Home vẫn 1 ảnh/tuần.
- 2D near-pointer contextual actions (Offset/Material cạnh vật chọn) — xác nhận lại là THẬT SỰ CHƯA CÓ (grep CadCanvas.tsx), là việc BUILD có phạm vi rõ, chưa làm.
- Present Page Setup live sheet preview — chrome đúng rồi, chỉ thiếu nối dữ liệu slide thật.
- `ProjectFile.reviewState` — chờ Hoà chạy migration.
- Route-bounce / auto-redirect — CHƯA đóng hẳn, xem UX FINDINGS.

## UX FINDINGS
- Route bounce / auto-redirect-to-Home: xảy ra lặp lại trong CHÍNH lúc 3 lane UX đang hot-save đồng thời (giống hệt mẫu hình Wave 1). MỘT nguyên nhân thật đã xử (cờ `stageDone` chết) nhưng KHÔNG được khai là đã đóng — cần lượt QA cô lập (không lane nào chạy song song) mới kết luận được REPRODUCED hay NOT REPRODUCED thật sự.
- Present từng bị crash TOÀN APP giữa phiên do lỗi tạm thời `ReferenceError: Cannot access 'specs' before initialization` trong `LibrarySheet.tsx` lúc Lane 3 đang sửa dở (LibrarySheet mount toàn cục qua AppShell) — ĐÃ TỰ HẾT khi Lane 3 hoàn tất, tsc xác nhận sạch sau đó. Phân loại: DEV HOT-RELOAD ARTIFACT (tạm thời trong lúc sửa file), không phải APP DEFECT tồn tại ở trạng thái nghỉ.

## DECISIONS
(Giữ nguyên các quyết định trước: naming "Chuyên", widget resize theo luật cũ, Motion Law ghi nhận chờ thi công.)
- Model SDXL/ControlNet khôi phục bằng SYMLINK (không copy) — 0 byte tốn thêm đĩa, cùng file vật lý với bản cài ComfyUI cũ trên máy.
- KHÔNG chạy `npx prisma migrate dev` — chờ đúng người (Hoà) chạy theo luật CLAUDE.md.

## NEXT 3
1. Khi Hoà chạy migration xong: verify schema + tsc + browser-smoke Files/Review/Promote.
2. Mở CLEAN VERIFICATION WINDOW thật (không lane nào chạy song song) → chạy 1 job generation thật (Sơ phác → vẽ → Sketch→Ảnh thật → ComfyUI → kết quả về IF) → nếu PASS, chạy tiếp spine đầy đủ.
3. Sau spine xanh: full visual coherence walk 9 chặng (Home→Files→2D×2→3D→Image→Spec→Library/Review→Present→Home) đối chiếu 10 tiêu chí freeze, ra kết luận READY FOR HOÀ VISUAL REVIEW: YES/NO.
