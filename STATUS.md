# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp `feat/present-layout-ml-p1` — **19/07 khuya: XONG backlog cảm ứng (2/2)**, đã merge `feat/cad-touch-support` (pinch-zoom/pan 2 ngón + nút Xoá nổi CAD) + `feat/slidesorter-touch` (Slide Sorter thay HTML5 DnD → Pointer Events, chạy cả chuột lẫn cảm ứng; nút Lên/Xuống giữ nguyên). tsc pass, reorder test 9/9, 0 worktree sống. Verify SHA bằng git.
- **CÒN THIẾU cho cảm ứng (chưa giao):** CAD vẫn cần bàn phím vật lý cho F8 Ortho · F12 Dynamic Input · type-anywhere gõ lệnh · Space giữ-để-pan — chưa có UI cảm ứng thay thế.
- **19/07 nhánh `feat/login-contrast` (CHƯA merge):** (1) gỡ tít "Bắt đầu dòng chảy…" + dòng phụ ở login, cân lại cụm logo/nhãn sát card; (2) **tương phản thích ứng dùng chung** `lib/adaptive-contrast.ts` + `components/ui/AdaptiveContrast.tsx` — đo luminance/độ-rối vùng ảnh dưới chữ → đảo tone kem/mực + sương mềm, áp 4 chỗ (login · caption thẻ Gallery · chữ Present đè ảnh · nhãn A/B node Render); (3) **logo IF `framed` đã đồng bộ toàn app** (Header · trang share · StudioBar) — CHỐT, gỡ mục "chưa quyết" cũ. 17 test mới pass, tsc pass. Verify mắt: chỉ màn login (Gallery/Present/Render cần đăng nhập — worktree KHÔNG có `.env`).
- ⚠️ MobileMenu:129 badge tím-hồng **không phải logo IF** mà là avatar chữ cái user → cố ý GIỮ NGUYÊN.
- ⚠️ `components/LoginScreen.tsx` (bản cũ ở gốc `components/`, khác `components/entry/LoginScreen.tsx`) là **code chết**, không nơi nào import — còn chứa badge "IF" đồng cũ. Chưa xoá (ngoài phạm vi).
- **19/07 chiều: audit chuột/phím/cảm ứng 3 chặng + Login/Gallery** (4 agent, mỗi agent 1 host riêng). Kết quả → Nợ kỹ thuật; danh sách đầy đủ trong lịch sử chat.
- **19/07: 2 nợ kỹ thuật nhỏ đã xử lý:** Prisma `db push` schema `IntegrationAccount` · dọn file rác.
- **Nút "Mở DWG" trực tiếp** (Web Worker cô lập GPL) — không cần server/CLI.
- Test pattern: `node_modules/.bin/sucrase-node <path>.test.ts` (59 file). KHÔNG có vitest/jest — bỏ qua chỉ dẫn nào ghi `npm test`.
- ✅ 18/07 sửa bug môi trường: `DATABASE_URL` sai path khiến mọi login 500 — đã fix.

## Quyết định user đã khoá
- **Auth (MỚI 19/07 — THAY quyết định "chỉ @ttt.vn" cũ)**: đăng ký + đăng nhập email MỌI domain (register công khai đã MỞ lại, mật khẩu ≥6 + bcrypt) · Google OAuth nhận mọi tài khoản · **Microsoft OAuth mới** (Entra ID, env `MS365_*` dùng chung tầng tích hợp — user CHƯA có Azure app, nút disabled + hướng dẫn trong `docs/INTEGRATIONS.md`) · admin seed giữ nguyên (`scripts/seed-admin.ts`); quên mật khẩu = admin reset. Đã build + MERGE 19/07 (kèm UI login kính lỏng + dynamic wallpaper 30 ảnh TTT `public/wallpapers/` — user sẽ lọc bộ ảnh cuối sau).
- Perceptron THẬT (learning-to-rank) · installer cả 3 unsigned (.exe cần Win) · PWA host Vercel + Supabase (Sprint 4).

## Nợ kỹ thuật
- Audit 19/07 (chuột/phím/cảm ứng 3 chặng) đã sửa gần hết, chi tiết → CHANGELOG.md mục "19/07 — Audit...".
- **CAD→Render văng đăng nhập** — đã sửa double-fetch StrictMode, chưa chắc hết root cause. Nếu tái diễn: user mở DevTools Network xem cookie `if_session` + status lúc bug xảy ra.
- ~~[TRUNG] Cảm ứng CAD + Slide Sorter~~ — XONG + merge; còn shortcut bàn phím CAD chưa có UI cảm ứng.
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
