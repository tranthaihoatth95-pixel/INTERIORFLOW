# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Drafting CAD (TCVN checker) · Rendering (node canvas) · Presenting (dàn trang)** + login/gallery.
> ⚠️ Nhãn hiển thị đổi 20/07 (Layout CAD→Drafting CAD · Render→Rendering · Present→Presenting). **ID nội bộ GIỮ NGUYÊN** `concept`/`render`/`present` — mọi khoá localStorage/route/tên file không đổi. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp `feat/present-layout-ml-p1` = `origin/main`. **19/07 XONG cảm ứng CAD (pinch-zoom/pan + nút Xoá) & Slide Sorter (Pointer Events)** → CHANGELOG. Verify SHA bằng git.
- **19/07 khuya — 7 nhánh ĐÃ MERGE + PUSH** (login/contrast · toolbar+IO đồng bộ · Sketch-Pro · Present typography · đổi tên chặng · PPTX nhúng font · fix bug login) → chi tiết CHANGELOG. Đã tự verify trên máy user: 3 tông hairline, thumbnail Present, toolbar 5 menu, layer Tường `#47423a`, Sketch/Pro dock.
  - ⚠️ **CHỜ USER VERIFY:** .pptx nhúng font chưa mở bằng PowerPoint thật (QuickLook BỎ QUA font nhúng → không dùng làm bằng chứng). Cần máy CHƯA cài font đó. Chưa nhúng bold/italic riêng.
  - 🐛 Đã sửa kèm: `useEditor.update()` clone deck lúc render ⇒ 2 lần/tick ghi đè nhau ⇒ `deck.customFonts` chưa bao giờ lưu được.
- **20/07 — ĐÃ MERGE:** `feat/input-optimization` (gốc bug cuộn Pro: toolbar 55 nút tràn 835px nuốt wheel; trackpad nay PAN, pinch/Firefox/passive fix; `lib/input/wheel.ts` + 51 assert — **tự verify trên máy user 4/4 kịch bản**) · `feat/motion-audit` (gốc "chớp" chuyển chặng: `StageVeil` chết cùng route cũ → hoist lên root; reduced-motion 6/36→phủ hết; 0 phần tử còn animate layout). Chi tiết → CHANGELOG.
  - ⚠️ Frame-timing chưa đo được (browser tự động luôn `hidden` → rAF đóng băng) — **cần user xem chuyển chặng bằng mắt thật**.
  - ⏳ Còn chạy: `feat/login-glass` (kính lỏng + tương phản card + 5 nền động) · agent nghiên cứu ComfyUI-less (scratchpad).
- **20/07 — 2 BÁO CÁO NGHIÊN CỨU ĐÃ MERGE, CHỜ USER QUYẾT:**
  - `docs/RESEARCH-ACCESS-CONTROL.md` — chọn `ProjectMember` 5 role + GATE; **🔴 3 LỖ HỔNG P0 (đã kiểm chéo): `/api/comments` không auth · `/api/dashboard` lộ shareToken+PII · `/api/cursors`+5 route AI không auth**. 10 câu hỏi §8 chờ user (Q2 brief NDA · Q5 role · Q8 GATE quay ngược). ~9 ngày công.
  - `docs/RESEARCH-MOBILE-DISTRIBUTION.md` — iOS: Custom App qua Apple Business Manager (TestFlight chết 90 ngày, Enterprise cần ≥100 người); phải qua Review 4.2, không bọc WebView trần. **macOS: BỎ Mac App Store** (sandbox chặn Blender/file) → `.dmg` notarize. **Android: Internal Testing track**. **PWA client ĐÃ CÓ SẴN** (manifest+sw+register) — chỉ thiếu server HTTPS cố định. Việc của user: Apple Dev 99USD + D-U-N-S (~30 ngày), Play Console 25USD, ABM, privacy policy.
- **ĐỢT SAU (chưa giao, cần NGHIÊN CỨU trước):** Chat/cộng tác nhóm. User phân định rõ: **CAD + Rendering = cộng tác bất đồng bộ** (để lại comment/ghim góp ý chỉnh sửa, kiểu lên ý tưởng của Miro) · **Presenting = sửa real-time nhiều người**. Lưu ý kiến trúc: real-time co-editing cần CRDT/Yjs — memory cũ đã ghi "mỗi flow hiện 1 người sửa, chưa detect conflict". Phải có agent nghiên cứu ra phương án trước khi code.
- ⚠️ `MobileMenu:129` là avatar chữ cái user, KHÔNG phải logo IF → giữ nguyên. `components/LoginScreen.tsx` (gốc, khác `entry/`) là code chết, chưa xoá.
- Có nút **Mở DWG** trực tiếp (Web Worker cô lập GPL).
- Test: `node_modules/.bin/sucrase-node <path>.test.ts` (63 file). KHÔNG có vitest/jest — bỏ qua chỉ dẫn ghi `npm test`.

## Quyết định user đã khoá
- **Auth (19/07 THAY "chỉ @ttt.vn")**: email MỌI domain · Google OAuth mọi tài khoản · **Microsoft OAuth** (Entra ID, `MS365_*`) — **user CHƯA tạo Azure app**, nút disabled, xem `docs/INTEGRATIONS.md` · quên mật khẩu = admin reset.
- **Logo IF: chốt phương án CÓ KHUNG** (`framed`). Wallpaper: 30 ảnh TTT ở `public/wallpapers/` — **user sẽ lọc bộ cuối sau**.
- Perceptron THẬT (learning-to-rank) · 3 installer unsigned (.exe cần Win) · PWA Vercel + Supabase (Sprint 4).

## Nợ kỹ thuật
- ~~CAD→Render văng đăng nhập~~ · ~~Cảm ứng CAD + Slide Sorter~~ — XONG + merge (gốc lỗi văng đăng nhập: cookie chung host, xem luật 3 + CHANGELOG). Shortcut bàn phím CAD nay đã có UI cảm ứng (`CadTouchDock`, nhánh `feat/sketch-pro-modes`).
- 🐛 **MỚI (có TRƯỚC đợt này, 2 agent độc lập cùng thấy, 1 agent xác nhận trên mã gốc):** `/cad-editor` ném warning React `Cannot update a component while rendering a different component` (`CadCanvas`/`StudioBar`) làm error boundary dựng lại cây. Chưa truy.
- [THẤP] Property panel Render không undo được (có thể chủ ý) · Sprint 3 B1 `meta` giá/vendor/sku trống (chờ dữ liệu) · in A3/A4 300dpi chưa khả dụng (đúng phạm vi) · `knowledge/` 121MB PDF cân nhắc Git LFS (ĐỂ SAU).

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser — LUẬT MÁU (19/07 đã gây sự cố thật):** cookie định danh theo HOST **không theo PORT** → `localhost:3000` và `localhost:4xxx` (worktree) dùng chung lọ cookie; server worktree gọi `DELETE /api/auth/me` là **xoá phiên thật của user** — đây chính là bug "bấm Render bị văng đăng nhập" kéo dài nhiều ngày. Luật: dev server worktree PHẢI verify qua **`127.0.0.1:<port>`** (lưu ý `preview_start` có thể tự mở tab `localhost` trước → navigate sang `127.0.0.1` NGAY); mỗi agent song song 1 origin riêng (127.0.0.1 / [::1] / IP LAN); TUYỆT ĐỐI KHÔNG logout / `DELETE /api/auth/me` / xoá cookie. **Code đã có 2 lớp chống** (`lib/server/auth.ts`): thiếu `AUTH_SECRET` → cookie `if_session_noenv`; chạy từ git worktree (nhận diện `.git` là file) → cookie `if_session_wt`. Nên worktree copy `.env` từ repo chính cũng KHÔNG đụng được phiên thật nữa. Muốn agent verify trang cần đăng nhập: cấp worktree `.env` + **DB riêng** (`cp prisma/dev.db prisma/dev.db.wt` rồi sửa `DATABASE_URL`), agent tự đăng ký tài khoản test.

4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
