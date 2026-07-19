# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp `feat/present-layout-ml-p1` = `origin/main`. **19/07 XONG cảm ứng CAD (pinch-zoom/pan + nút Xoá) & Slide Sorter (Pointer Events)** → CHANGELOG. Verify SHA bằng git.
- **19/07 khuya — ĐỢT MỚI user giao:**
  - **Đã merge cả 3:** `fix/login-bounce-root` · `feat/login-contrast` (login: gỡ 2 dòng chữ, tương phản thích ứng dùng chung, logo IF `framed` toàn app) · `feat/toolbar-io-sync` (toolbar CAD → 5 menu xổ + 2 nút chuyển chặng · `.cad-pill-scroll` · Nhập/Xuất 3 chặng qua `components/ui/IOMenu.tsx`). Chi tiết → CHANGELOG.
  - ⚠️ **CẦN USER XÁC NHẬN:** menu Xuất chặng **Render** giờ có PDF/PPTX ở mức CẢ FLOW (trước chỉ trên node `slide.deck`) — hàm cũ, nhưng là năng lực mới ở tầng chặng. Không muốn thì gỡ 2 mục.
  - **Đợt 2 — ① XONG (nhánh `feat/sketch-pro-modes`, CHƯA merge):** Sketch = cảm ứng kiểu ArcSite (nút 44px · `CadTouchDock` 6 nút thay F8/F12/gõ-lệnh/Space + Enter/Esc) · Pro = chuột/phím (nút 34px, tag hover kèm phím tắt, ẩn dock) · `orthoLock`/`dynInput` dời lên store · chuyển chặng có chỉ báo "Đang mở …" sau 400ms + tôn trọng reduced-motion · phân định chặng bằng tông riêng (`STAGE_TINT`: hairline đáy thanh đầu + chấm trên pill + nhãn micro "01 · LAYOUT CAD"). 60/60 file test pass, tsc pass.
    - ⚠️ CHƯA verify mắt: hairline tông chặng ở **Header app chính (Render)** — route `/` cần đăng nhập, agent không được tạo tài khoản. Cùng code path StudioBar (đã verify Layout CAD + Present).
  - **Đợt 2 — ② CHƯA giao:** Present font: tải font từ máy · edit chữ tiêu đề kiểu text-effects/typography illustration · sửa lỗi hiện chữ ở dải thumbnail deck mẫu.
- ⚠️ `MobileMenu:129` badge tím-hồng là avatar chữ cái user, KHÔNG phải logo IF → GIỮ NGUYÊN. `components/LoginScreen.tsx` (khác `entry/`) là **code chết**, chưa xoá.
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
3. **An toàn verify browser — LUẬT MÁU (19/07 đã gây sự cố thật):** cookie định danh theo HOST chứ KHÔNG theo PORT → `localhost:3000` (thật) và `localhost:4xxx` (worktree) chung một lọ cookie; server worktree gặp cookie lạ sẽ tự `clearSession()` (`app/api/auth/me` nhánh `stale`) = **XOÁ phiên thật của user** — đúng bug "bấm Render bị văng đăng nhập". Vì vậy: verify worktree PHẢI qua **`127.0.0.1:<port>`**, mỗi agent song song 1 origin riêng (127.0.0.1 / [::1] / IP LAN); TUYỆT ĐỐI KHÔNG logout, KHÔNG loadDemoFlow đè flow thật. ⚠️ `preview_start` tự mở tab ở `localhost:<port>` — phải `navigate` sang 127.0.0.1 NGAY. Lớp chống sẵn có: thiếu `AUTH_SECRET` → cookie riêng `if_session_noenv` (worktree này CÓ .env và **trùng `AUTH_SECRET` với main**, nên lớp chống này KHÔNG che được).
4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
