# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp `feat/present-layout-ml-p1` (`ba4803c`) — đã merge thêm `feat/cad-touch-support` (pinch-zoom/pan 2 ngón verify bằng toán học + nút Xoá nổi cho CAD). tsc pass. **CHƯA push origin** (đợi xong Slide Sorter, push 1 lượt).
- **19/07 khuya: TUẦN TỰ backlog cảm ứng — đang làm bước 2/2** `feat/slidesorter-touch` (worktree `interiorflow-wt-slidesorter-touch`, agent đang chạy): thay HTML5 native DnD (không chạy trên touch) bằng Pointer Events tự viết, giữ nguyên nút Lên/Xuống dự phòng.
- **Chưa quyết:** phương án logo IF (đang dùng `framed`/B — còn A không-khung, C wordmark) có áp đồng bộ sang Header/MobileMenu/trang share (đang dùng badge tím-hồng cũ) không.
- **19/07 chiều: audit toàn diện chuột/bàn phím/cảm ứng 3 chặng CAD/Render/Present+Login+Gallery** (4 agent, mỗi agent 1 host riêng để không đụng cookie/IndexedDB). Kết quả → mục Nợ kỹ thuật bên dưới. Danh sách đầy đủ (kèm dòng code) nằm trong lịch sử chat, chưa chép hết vào STATUS để giữ &lt;800 từ — hỏi lại nếu cần.
- **19/07: đã xử lý 2 nợ kỹ thuật nhỏ trực tiếp (không qua agent):** Prisma `db push` đồng bộ schema `IntegrationAccount` · dọn file rác `Bản sao Không có tiêu đề.rtfd/` + `CLAUDE.md.bak`.
- **App có nút "Mở DWG" trực tiếp** (Web Worker cô lập GPL) — không cần server/CLI.
- Test pattern: `node_modules/.bin/sucrase-node <path>.test.ts` (59 file). KHÔNG có vitest/jest — bỏ qua chỉ dẫn nào ghi `npm test`.
- ✅ 18/07 sửa bug môi trường: `DATABASE_URL` sai path khiến mọi login 500 — đã fix.

## Quyết định user đã khoá
- **Auth (MỚI 19/07 — THAY quyết định "chỉ @ttt.vn" cũ)**: đăng ký + đăng nhập email MỌI domain (register công khai đã MỞ lại, mật khẩu ≥6 + bcrypt) · Google OAuth nhận mọi tài khoản · **Microsoft OAuth mới** (Entra ID, env `MS365_*` dùng chung tầng tích hợp — user CHƯA có Azure app, nút disabled + hướng dẫn trong `docs/INTEGRATIONS.md`) · admin seed giữ nguyên (`scripts/seed-admin.ts`); quên mật khẩu = admin reset. Đã build + MERGE 19/07 (kèm UI login kính lỏng + dynamic wallpaper 30 ảnh TTT `public/wallpapers/` — user sẽ lọc bộ ảnh cuối sau).
- Perceptron THẬT (learning-to-rank) · installer cả 3 unsigned (.exe cần Win) · PWA host Vercel + Supabase (Sprint 4).

## Nợ kỹ thuật
- Audit 19/07 (chuột/phím/cảm ứng 3 chặng) đã sửa gần hết, chi tiết → CHANGELOG.md mục "19/07 — Audit...".
- **CAD→Render văng đăng nhập** — đã sửa double-fetch StrictMode, chưa chắc hết root cause. Nếu tái diễn: user mở DevTools Network xem cookie `if_session` + status lúc bug xảy ra.
- **[TRUNG] Cảm ứng** — CAD đang làm (`feat/cad-touch-support`, xem mục Hiện tại) · Slide Sorter (Present) chưa giao, tới lượt sau.
- [THẤP] Property panel Render không undo được (có thể chủ ý, chưa hỏi).
- Sprint 3 B1: `meta` (giá/vendor/sku) trống — chưa có dữ liệu giá thật.
- In A3/A4 300dpi thật CHƯA khả dụng (giới hạn Render stage) — đúng phạm vi đã chốt.
- `knowledge/project-references/` ~121MB PDF trong git — Git LFS, user chọn ĐỂ SAU (rủi ro rewrite history).

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser**: cookie localhost dùng chung → verify TUẦN TỰ; dùng host 127.0.0.1 + account test riêng; KHÔNG logout, KHÔNG loadDemoFlow đè flow thật.
4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
