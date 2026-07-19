# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp `feat/present-layout-ml-p1` = `origin/main` (`41976b3`) — đã merge `fix/cad-small-polish` + `feat/login-v2` + `feat/login-minimal` (login tối giản, logo IF mới `IFLogo.tsx` 3 phương án dùng `framed`, slideshow mặc định). launch.json đã dọn sạch ~25 entry chết, chỉ còn server thật. tsc pass, 0 worktree sống.
- **19/07 khuya: đang làm TUẦN TỰ backlog cảm ứng** — bắt đầu `feat/cad-touch-support` (worktree `interiorflow-wt-cad-touch`, agent đang chạy): pinch-zoom/pan 2 ngón + nút Xoá nổi cho CAD. Xong sẽ merge rồi tới lượt Slide Sorter cảm ứng (Present).
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
- ~~Hydration tooltip CadToolbar/PhotoToolbar~~ · ~~window.prompt Dashboard/PS-3/Brand Kit~~ · ~~Migration Prisma drift~~ · ~~CAD Room tool chuột~~ · ~~CAD Backspace không xoá được~~ · ~~Demo render: thanh tím đè nhãn phòng (hatch SOLID bị force-highlight tô đặc thay vì chỉ viền, đã thêm `DrawStyle.outlineOnly`)~~ — ĐÃ SỬA, đã merge, **demo render user đã tự verify mắt qua tunnel 19/07, OK**.
- **Từ audit 19/07 — ĐÃ SỬA + MERGE (`977f32d`):** ~~màu layer Tường trùng nền (đổi `#47423a`, sửa luôn palette `addLayer()`)~~ · ~~handle xoay Present (lỗi commit frame stale từ prop trong `onPointerUp`, không phải công thức atan2 — vá luôn move/resize cùng race)~~ · ~~Enter toàn cục Gallery (guard e.target)~~ · ~~groups Render không lưu (thêm `groups` vào `graphJson` + auto-unhide node mồ côi)~~ · ~~Escape mất nét vẽ Mask/Annotate (cờ dirty + banner)~~ · ~~hydration Tooltip.tsx (mounted-gate)~~ · ~~tab-order Login~~ · ~~card carousel roving tabindex~~. Lưu ý: Enter-guard + tabindex Gallery chỉ verify bằng đọc code (cần login thật) — user dùng thật là verify cuối.
- **Từ audit 19/07 — CHƯA sửa:**
  - **Bug user báo: CAD→Render văng màn đăng nhập.** ĐÃ SỬA PHẦN XÁC NHẬN ĐƯỢC (`dd60a8c`, đã merge): `/` gọi `/api/auth/me` 2 lần do StrictMode thiếu ref-guard — giờ còn đúng 1 (verify Network). NHƯNG chưa chắc là nguyên nhân gốc triệu chứng: có thể session hết hạn thật từ trước mà CAD không hề check auth nên user không biết, đến khi bấm Render mới lộ. **Nếu còn tái diễn** → user tự mở DevTools Network lúc bug xảy ra, xem request `/api/auth/me` có gửi cookie `if_session` không + status. Phương án dự phòng (chưa làm, chờ user quyết): thêm check session ngay ở CAD để báo mất đăng nhập tại chỗ.
  - [TRUNG] Không hỗ trợ cảm ứng thật ở CAD (gesture) · Slide Sorter dùng HTML5 DnD (không chạy trên touch) — 2 việc lớn, chưa giao.
  - [THẤP] Property panel Render không undo được (có thể là chủ ý) · ~~Escape không xoá ký tự gõ dở trong ô lệnh CAD~~ · ~~status hint chưa nhắc Backspace~~ — 2 mục sau ĐÃ SỬA + merge.
- Sprint 3 B1: `meta` (giá/vendor/sku) trống — chưa có dữ liệu giá thật.
- In A3/A4 300dpi thật vẫn CHƯA khả dụng (giới hạn Render stage) — đúng phạm vi đã chốt.
- `knowledge/project-references/` ~121MB PDF trong git — cân nhắc Git LFS. User chọn ĐỂ SAU (rewrite history rủi ro cao).
- ~~`CadCanvas.tsx` còn nhiều `window.prompt`/`confirm` khác cùng rủi ro treo webview~~ — ĐÃ SỬA HẾT + merge: 0 `window.prompt`/`confirm` còn lại trong `components/cad/` (Text/Markup/Array/Scale/Divide → form nổi; xoá pin markup/gỡ ảnh/Mở demo/Mẫu dự án/Mở .idf → confirm nổi; AI mô tả → ô nhập nổi). Verify browser port 4084; riêng confirm Mở .idf + gỡ ảnh lightbox chỉ verify code (cần file picker thật).

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser**: cookie localhost dùng chung → verify TUẦN TỰ; dùng host 127.0.0.1 + account test riêng; KHÔNG logout, KHÔNG loadDemoFlow đè flow thật.
4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
