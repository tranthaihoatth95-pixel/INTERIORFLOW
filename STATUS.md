# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Drafting CAD (TCVN checker) · Rendering (node canvas) · Presenting (dàn trang)** + login/gallery.
> ⚠️ Nhãn hiển thị đổi 20/07 (Layout CAD→Drafting CAD · Render→Rendering · Present→Presenting). **ID nội bộ GIỮ NGUYÊN** `concept`/`render`/`present` — mọi khoá localStorage/route/tên file không đổi. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp `feat/present-layout-ml-p1` = `origin/main` (local vượt origin, chưa push). Verify SHA bằng git. Toàn bộ đợt 19-21/07 ĐÃ MERGE hết (danh sách đầy đủ → CHANGELOG); mới nhất: **M1 Home/Gallery↔Larkbase · ambient cover glow · gesture audit · Vitas AI (Gallery + giọt kính ở chặng) · card kính trong hơn+khúc xạ · CAD workflow thực tế** (import hiện trạng → dossier-check ✓/⚠️/✗ · option đặt VÀO phòng thật · ML học layout được dùng · click-outside/Esc + draft cache).
  - ⚠️ **CHỜ USER VERIFY bằng mắt:** .pptx nhúng font (PowerPoint thật) · frame-timing chuyển chặng.
  - **M1 Larkbase**: bảng mirror + Gallery pill cảnh báo + nút "Chi tiết"(3 tab)/"Đồng bộ"/liên kết tuỳ chọn + Home/logo về `/`. **CHỜ USER cấp `LARK_APP_ID/SECRET/LARK_BASE_APP_TOKEN`** (xem `docs/INTEGRATIONS.md`).
  - **Vitas AI** (Gallery + giọt kính ở chặng): bong bóng iMessage, typing 3-chấm, `VitasIcon`, backend NVIDIA→Ollama, v1 không DB. KHÁC "Chat nhóm".
  - **Ambient cover glow** + **gesture audit** (1 P1 fix phím E CAD, 7 P2 chưa) — chi tiết → CHANGELOG.
- **8 BÁO CÁO NGHIÊN CỨU trong `docs/`, CHỜ USER QUYẾT** — đọc thẳng từng file (`RESEARCH-ACCESS-CONTROL/MOBILE-DISTRIBUTION/COMFYUI-LESS/MATERIAL-BRIDGE/TECHNICAL-DRAWING-PIPELINE/TEAM-COLLABORATION/OFFICE-FILE-INTEROP/HOME-GALLERY-DASHBOARD`), đừng chép lại vào đây.
- Test: `node_modules/.bin/sucrase-node <path>.test.ts` (70 file). KHÔNG có vitest/jest.

## Worktree đang mở
- `interiorflow-wt-fix-stage-transition` (nhánh `feat/fix-stage-transition`) — fix bug chặng + dời Home. Chờ merge.

## Quyết định user đã khoá
- **Auth**: email MỌI domain · Google OAuth mọi tài khoản · Microsoft OAuth (Entra ID) — user CHƯA tạo Azure app, nút disabled · quên mật khẩu = admin reset.
- **Logo IF: CÓ KHUNG** (`framed`). Wallpaper: 30 ảnh TTT ở `public/wallpapers/`.
- Perceptron THẬT (learning-to-rank, đã verify wired vào Presenting `LayoutShelf` + mới thêm CAD `AiBriefPanel`) · 3 installer unsigned · PWA Vercel + Supabase (Sprint 4).

## Nợ kỹ thuật
- ✅ **BUG chuyển chặng CAD↔Rendering — FIX 21/07 tối** (nhánh `feat/fix-stage-transition`, worktree `interiorflow-wt-fix-stage-transition`). **Root cause**: `stageDone` state ở `app/page.tsx` khởi tạo `false` rồi chỉ thành `true` sau khi `enterAfterAuth()` chạy xong (async, sau `/api/auth/me` ~50-300ms). Mỗi lần Home mount lại (bấm Render từ `/cad-editor` → `router.push('/')`), giữa khoảng mount và fetch xong, return của component rơi vào nhánh `!stageDone` → render `ProjectSelect` BÊN DƯỚI StageVeil. Veil kéo ra sau 2 rAF (~32ms) → lộ ProjectSelect chớp nhoáng → dăm ms sau setStageDone(true) → flash sang canvas. Người dùng cảm nhận đúng như "lag/nhảy/văng về đăng nhập" (thực ra là ProjectSelect, chớp giữa 2 lần render). **Fix**: `useState(() => {...})` đọc `localStorage.getItem('interiorflow.stageDone')` đồng bộ ngay lúc init, so với `useFlowStore.getState().user?.id` (store persist xuyên route → user đã set từ lần visit trước) → stageDone=true NGAY render đầu, không có khoảng ProjectSelect flash. Nghi vấn 2 (Vitas pointer handler) & 3 (`<Dashboard/>` mount fetch) loại: Vitas onPointerDown chỉ attach window listener trong lúc drag, không đụng router; Dashboard chỉ fetch khi `shown` (dashboardOpen && !coverMode), mount không tốn gì. **Test 20 vòng CAD↔Render**: 0 lỗi, không login, không ProjectSelect. **CHỜ USER VERIFY mắt** frame-timing thật.
- ✅ **Dời Home cạnh Tin nhắn** (cùng nhánh): trước ở đầu thanh (trước Drafting CAD), nay đặt ngay trước nút Chat (MessageCircle trong StudioBar · MoreMenu ⋯ trong Header).
- ✅ **Lag chuyển chặng — FIX 21/07 tối** (worktree `interiorflow-wt-fix-stage-transition`): veil duration `lib/motion.ts` 280/300 → 100/140ms, StageTransitionProvider bỏ 1 rAF (còn 1). Ước lượng cắt 316ms → ~155ms perceived lag. CẦN USER VERIFY mắt.
- ✅ **Click ngoài canvas + Esc → deselect element** (cùng worktree, `feat(present)`): opt-in data-attr `data-if-deselect-zone` trên `<main>` canvas area + StudioBar; window pointerdown listener; Esc key handler (loại trừ input/textarea/contenteditable).
- ✅ **Rename Vitas → Vitals toàn codebase** (cùng worktree): 10 file (3 file component đổi tên `VitalsIcon.tsx`/`VitalsStageDrop.tsx`/`VitalsChatBubble.tsx`); migration localStorage `interiorflow.vitas.*` → `interiorflow.vitals.*` inline script trong `app/layout.tsx` (guard sentinel `interiorflow.vitals.migrated_from_vitas`); STATUS/CHANGELOG/docs giữ nguyên "Vitas" làm history.
- ✅ **Vitals logo Siri iOS 27 + breathing + onboarding** (cùng worktree): `VitalsIcon` mới = tròn hairline gradient bọc squircle (rx=8) fill gradient cam TTT→navy TTT + subtle glow; StageSwitcher: gợn kính tĩnh giờ có breathing opacity 0.85↔1 chu kỳ 3s + hover scale 1.06; bong bóng onboarding 5s lần đầu (`interiorflow.vitals.hint_seen`).
- 🟡 **Vitals giọt kính drag → panel transition** (21/07 tối, user báo cũ): motion mở panel còn khựng giữa drag-active → panel mount. Chưa fix trong đợt này. Cần: shared layoutId, hoặc pre-mount panel opacity 0, hoặc easing khớp.
- 🐛 `/cad-editor` warning React `Cannot update a component...` (`CadCanvas`/`StudioBar`) — điều tra sâu nhưng KHÔNG tái hiện được, chưa sửa. Chi tiết → CHANGELOG.
- ⚠️ **RÒ RỈ NVIDIA_API_KEY** (21/07 sáng): lỡ in trong transcript agent — USER NÊN ROTATE key ở build.nvidia.com rồi thay `.env.local`.
- [THẤP] Property panel Render không undo được · Sprint 3 B1 `meta` giá/vendor/sku trống · `knowledge/` 121MB cân nhắc Git LFS · M1 Larkbase: chưa link-picker grid >8 dự án.

## Việc chờ USER DUYỆT (đề xuất đã gửi, chưa phóng agent)
1. **Chat mở rộng (kiểu Zalo)** — 3 loại kênh (`project`/`direct`/`group`), Prisma model `Channel/ChannelMember/Message` thay `ChatMessage` cũ. 3 câu hỏi cần user quyết trước: (a) ai tạo group, (b) direct cross-project không, (c) thông báo real-time cơ chế gì.
2. **Vitas roadmap 5 tầng** — Tầng 3 CAD (giải thích Kiểm chuẩn, chuyển chat→AiBriefPanel) làm trước sau khi bug chặng dứt điểm.

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser — LUẬT MÁU:** dev server worktree PHẢI verify qua `127.0.0.1:<port>` (KHÔNG `localhost`); TUYỆT ĐỐI KHÔNG logout/DELETE cookie. Cần đăng nhập thật: worktree copy `.env` + DB riêng `dev.db.wt`. Code tự cách ly cookie: thiếu AUTH_SECRET→`if_session_noenv`; worktree(`.git` là file)→`if_session_wt`.
4. Worktree & context: CLAUDE.md (max **5** worktree; cơ chế an toàn tự dọn cuối phiên; STATUS <800 từ).
5. **Vai trò:** tôi phóng agent code, KHÔNG tự làm (xem memory `role-agentic-not-hands-on`).
