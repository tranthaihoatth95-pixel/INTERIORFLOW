# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp `feat/present-layout-ml-p1` = `origin/main`. **19/07 XONG cảm ứng CAD (pinch-zoom/pan + nút Xoá) & Slide Sorter (Pointer Events)** → CHANGELOG. Verify SHA bằng git.
- **19/07 khuya — ĐỢT MỚI user giao:**
  - **Đã merge cả 5:** `fix/login-bounce-root` · `feat/login-contrast` (login gỡ 2 dòng chữ · tương phản thích ứng dùng chung áp 4 chỗ · logo IF `framed` toàn app) · `feat/toolbar-io-sync` (toolbar CAD 18 nút → **5 menu xổ + 2 nút chuyển chặng** · `.cad-pill-scroll` hết scrollbar thô Pro mode · **Nhập/Xuất 3 chặng đồng bộ** qua `components/ui/IOMenu.tsx`) · `feat/sketch-pro-modes` (Sketch = cảm ứng kiểu ArcSite: nút 44px + `CadTouchDock` 6 nút thay F8/F12/gõ-lệnh/Space + Enter/Esc, phát lại phím qua `cad:synth-key` nên chỉ 1 nhánh logic · Pro = chuột/phím, tag hover kèm phím tắt · `StageVeil` chỉ hiện sau 400ms + prefetch · phân định chặng bằng `STAGE_TINT` hairline + chấm + nhãn micro) · `feat/present-typography` (font tải từ máy: nhúng theo deck + thư viện IDB, validate magic-number, cảnh báo giới hạn PPTX · bảng **Hiệu ứng chữ** 8 preset + tinh chỉnh sâu, áp cả DOM lẫn canvas export · **lỗi thumbnail**: `SlideStrip` xưa vẽ chữ thành thanh 3px `background:currentColor` — placeholder skeleton CỐ Ý từ đầu, không phải lỗi font/scale — nay dựng bằng chính `Inner` của `Element.tsx`). Chi tiết → CHANGELOG.
  - ⚠️ **CẦN USER XÁC NHẬN:** menu Xuất chặng **Render** giờ có PDF/PPTX ở mức CẢ FLOW (trước chỉ trên node `slide.deck`) — dùng đúng bộ hàm cũ, nhưng là **năng lực mới ở tầng chặng**. Không muốn thì gỡ 2 mục.
  - ⚠️ CHƯA verify mắt: hairline tông chặng ở **Header app chính (Render)** — route `/` cần đăng nhập, agent không tạo tài khoản. Cùng code path StudioBar (đã verify Layout CAD + Present).
  - ✅ **XONG (nhánh `feat/pptx-font-embed`, CHƯA merge): PPTX nhúng font THẬT** (dạng EOT, hậu xử lý ZIP; có chặn font cấm nhúng theo cờ `fsType`). Kèm 1 bug nền: `useEditor.update()` gọi 2 lần/tick thì ghi đè nhau ⇒ `deck.customFonts` chưa bao giờ lưu được. Chi tiết + phần chưa verify → CHANGELOG.
- ⚠️ `MobileMenu:129` là avatar chữ cái user, KHÔNG phải logo IF → giữ nguyên. `components/LoginScreen.tsx` (gốc, khác `entry/`) là code chết, chưa xoá.
- Có nút **Mở DWG** trực tiếp (Web Worker cô lập GPL).
- Test: `node_modules/.bin/sucrase-node <path>.test.ts` (60 file). KHÔNG có vitest/jest — bỏ qua chỉ dẫn ghi `npm test`.

## Quyết định user đã khoá
- **Auth (19/07 THAY "chỉ @ttt.vn")**: email MỌI domain · Google OAuth mọi tài khoản · **Microsoft OAuth** (Entra ID, `MS365_*`) — **user CHƯA tạo Azure app**, nút disabled, xem `docs/INTEGRATIONS.md` · quên mật khẩu = admin reset.
- **Logo IF: chốt phương án CÓ KHUNG** (`framed`). Wallpaper: 30 ảnh TTT ở `public/wallpapers/` — **user sẽ lọc bộ cuối sau**.
- Perceptron THẬT (learning-to-rank) · 3 installer unsigned (.exe cần Win) · PWA Vercel + Supabase (Sprint 4).

## Nợ kỹ thuật
- Audit 19/07 (chuột/phím/cảm ứng) đã sửa gần hết → CHANGELOG.
- ~~CAD→Render văng đăng nhập~~ · ~~Cảm ứng CAD + Slide Sorter~~ — XONG + merge (gốc lỗi văng đăng nhập: cookie chung host, xem luật 3 + CHANGELOG). Shortcut bàn phím CAD nay đã có UI cảm ứng (`CadTouchDock`, nhánh `feat/sketch-pro-modes`).
- [THẤP] Property panel Render không undo được (có thể chủ ý) · Sprint 3 B1 `meta` giá/vendor/sku trống (chờ dữ liệu) · in A3/A4 300dpi chưa khả dụng (đúng phạm vi) · `knowledge/` 121MB PDF cân nhắc Git LFS (ĐỂ SAU).

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser — LUẬT MÁU (19/07 đã gây sự cố thật):** cookie định danh theo HOST **không theo PORT** → `localhost:3000` và `localhost:4xxx` (worktree) dùng chung lọ cookie; server worktree gọi `DELETE /api/auth/me` là **xoá phiên thật của user** — đây chính là bug "bấm Render bị văng đăng nhập" kéo dài nhiều ngày. Luật: dev server worktree PHẢI verify qua **`127.0.0.1:<port>`** (lưu ý `preview_start` có thể tự mở tab `localhost` trước → navigate sang `127.0.0.1` NGAY); mỗi agent song song 1 origin riêng (127.0.0.1 / [::1] / IP LAN); TUYỆT ĐỐI KHÔNG logout / `DELETE /api/auth/me` / xoá cookie. **Code đã có 2 lớp chống** (`lib/server/auth.ts`): thiếu `AUTH_SECRET` → cookie `if_session_noenv`; chạy từ git worktree (nhận diện `.git` là file) → cookie `if_session_wt`. Nên worktree copy `.env` từ repo chính cũng KHÔNG đụng được phiên thật nữa. Muốn agent verify trang cần đăng nhập: cấp worktree `.env` + **DB riêng** (`cp prisma/dev.db prisma/dev.db.wt` rồi sửa `DATABASE_URL`), agent tự đăng ký tài khoản test.

4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
