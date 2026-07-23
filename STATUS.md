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
- (Không có — worktree `fix-stage-transition` merge xong 21/07 khuya, dọn theo rule an toàn.)

## Việc mới 21/07 khuya (worktree `fix-stage-transition`)
- **Intro Sequence 60s** (`/intro`, public, redirect `/login` nếu `if_intro_seen_v1=1`). 4 cảnh useReducer state machine + AnimatePresence mode=wait, auto-advance 15/10/25/10s. Skip button sau 3s (buffer 1s chống mis-click). 11 SVG stylized tự vẽ trong `components/intro/svgs/`: Desk isometric · Monitor · Blueprint · Ruler · Mouse · Clock · Pencil · Architect chibi (KTS Pixar-style) · LogoIF hairline · WaveFlow · VitalsDrop. Cảnh 1 tint xám lạnh + copy song ngữ; cảnh 2 KTS+bàn+logo grid-paper; cảnh 3 ba màn hình + wave cam + KTS+VitalsDrop; cảnh 4 VitalsDrop phóng to (`layoutId="hero-glass"`) + CTA. Route `/login` (thin wrapper `LoginScreen` entry + layoutId marker).
- **Avatar Builder MVP** (`/settings/avatar` + API `GET/PATCH /api/user/avatar`). 5 slot: base (4 tone da) · hair (8 kiểu × 5 màu) · glasses (6) · hat/headphone (6) · shirt (6 × 5 màu). Tổng ~172k combo. `AvatarRenderer` SVG portrait 200×240 hoàn toàn tự vẽ (không asset ngoài), gradient depth + circle frame hairline TTT. `AvatarBuilder` preview realtime + Randomize + Save/Skip.
- **Prisma `User.avatar` (String? JSON)** + `lib/avatar.ts` (types, normalize clamp, `randomAvatarFromId` djb2 deterministic) + test `lib/avatar.test.ts` (5 assertion, PASS via sucrase-node). Schema đẩy `prisma db push --accept-data-loss` cho `dev.db.wt` — **migration chính thức `add_user_avatar` sẽ generate lúc merge về main** (`prisma migrate dev` sẽ reset dev DB, tránh trong worktree).
- **CHỜ USER VERIFY mắt**: (a) chất lượng visual intro có "cinematic" đủ chưa hay còn xấu — SVG tự vẽ, không AI-gen, không mua asset; nếu chưa đạt gu quiet-luxury có thể tăng độ tinh xảo path/gradient; (b) avatar Pixar-look có ổn không; (c) morph login từ cảnh 4 — hiện tại chỉ FADE (cross-page `layoutId` Framer Motion không bảo đảm mượt qua `router.push`), nếu muốn morph thật cần refactor sang `LayoutGroup` + context persist state (chưa làm — Nợ kỹ thuật bên dưới).

## Nợ kỹ thuật đợt intro/avatar
- 🟡 **Morph login chưa thật** — cần `LayoutGroup` + context persist thay `layoutId` cross-page nếu muốn giọt kính morph → card login (hiện: intro fade → login mount).
- 🟡 **Signup flow chưa gọi avatar picker** — user register xong hiện chưa auto-open `/settings/avatar`; fallback deterministic-random đủ dùng (không có avatar rỗng), nhưng ưu tiên polish sau: hook `LoginForm` sau `POST /api/auth/register` → `router.push('/settings/avatar?first=1')`.
- 🟡 **Avatar `PATCH` route** — lấy `avatar` từ `getSessionUser()` bằng cast `(user as {avatar?}).avatar`; nên mở rộng `publicUser()` trả `avatar` để type-safe.


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
- ✅ **Vitals indicator GIỌT KÍNH LỎNG v2 — 21/07 tối** (cùng worktree, `feat(vitals)`): user báo "hiện tại ko có intro ai mà biết" — gợn kính 18×3px cũ gần như vô hình, người dùng thấy chấm active-stage tưởng là Vitals. Redesign: SVG teardrop 24×32 (viewBox 40×56) bezier đối xứng, đỉnh nhọn thuôn / đáy phình tròn tỉ lệ 1:1.4; fill gradient trắng→cam→navy trong suốt + inner ellipse highlight specular + hairline stroke gradient cam→navy + drop-shadow cam 0 4px 10px. Chồm 6px dưới dock (nhấn mạnh "kéo xuống"), aria-hidden pointerEvents:none nên drag start vẫn trên dock. Motion 4 lớp: idle breathing opacity 0.9↔1 chu kỳ 4s · drip hint 800ms mỗi 8-12s random (translateY [0,2,0,-1,0] + scaleY [1,1.05,1,1,1]) · hover -2px scale 1.08 glow đậm hơn · greeting drip biên độ lớn (y 4px, scaleY 1.1) lần đầu chào. Onboarding v2: key mới `hint_seen_v2` reset cho tất cả user cũ, tooltip 6s "↓ Kéo xuống để hỏi Vitals · Drag down to ask" có mũi tên cam. Reminder loop: user chưa từng drag (`first_drag_done`) → 3s tooltip mỗi 60s, max 3 lần/session; `openVitals()` set `first_drag_done`=1 khoá reminder vĩnh viễn. **Giả định**: chấm cạnh "Presenting" = active-stage marker (STAGE_TINT tint), KHÔNG đụng; giọt kính đặt giữa-dưới dock chồm 6px xuống. CẦN USER VERIFY mắt.
- ✅ **Presenting mount khựng — FIX 21/07 tối** (cùng worktree, `perf(present)`): user báo "chuyển sang presenting khựng nhẹ, 2 chặng kia ok". PresentEditor mount đồng bộ heavy (fonts+templates+suggest+layout-check+export+brand-kit+reflow+Toolbar/Inspector/LayerPanel). Tách chunk riêng bằng `next/dynamic({ ssr: false, loading: <Skeleton/> })` trong `PresentSheets.tsx` → veil kéo ra là thấy skeleton "Đang mở dàn trang…", heavy JS stream về sau. Không phá 1-instance-tại-1-thời-điểm (re-key activeId).
- ✅ **Enter trong Vitals chat bị hijack chuyển chặng — FIX 21/07 tối** (`fix(vitals-chat)`): user báo Enter chưa nhận trả lời đã "vào chặng luôn". React synthetic stopPropagation không chặn được `window.addEventListener('keydown')` (React 17+ delegate ở root). Fix 3 tầng: `e.nativeEvent.stopImmediatePropagation()` trong onKeyDown, `data-vitals-chat` marker container, global onKey check `target.closest('[data-vitals-chat]')` (chặn cả khi input disabled làm focus rơi về body).
- ✅ **Gallery gesture trượt card — FIX 21/07 tối** (`feat(gallery)`): user báo "cử chỉ/phím/chuột/bàn di đều ko hoạt động". ← → Enter đã có, THÊM Home/End + onWheel accumulator (deltaX trackpad ưu tiên, deltaY chuột convert ngang, ngưỡng 60px, reset sau 300ms). Caption hint mới: '← → · Home/End · lăn chuột / trượt 2 ngón'.
- ✅ **Vitals giọt kính drag → panel transition — FIX 21/07 khuya** (`perf(vitals)`, cùng worktree): pre-mount `VitalsDropPanel` NGAY khi `dragging=true` với `open=false`/opacity 0/pointer-events none → React commit + effect setup chạy TRONG lúc user còn kéo. Threshold hit → `open=true` → chỉ tween opacity+scale 220ms easeApple (thay `springSheet` stiffness 380/damping 42 settle ~300ms) → khớp nhịp droplet exit 120ms, không cold-mount. Guard: click-outside/Esc listener + autoFocus input chỉ chạy khi `open=true` để pre-mount không nuốt drag hoặc steal focus. 18/18 stage-drop test PASS, tsc PASS.
- 🐛 `/cad-editor` warning React `Cannot update a component...` (`CadCanvas`/`StudioBar`) — điều tra sâu nhưng KHÔNG tái hiện được, chưa sửa. Chi tiết → CHANGELOG.
- ✅ **NVIDIA_API_KEY rotate xong 21/07 tối** — user đã revoke key cũ, tạo key mới `Rebw...zv-e` trong `.env.local` (verify HTTP 200 với llama-3.1-8b). File `.env.local` dọn sạch (backup `.env.local.bak-20260721-164537`). 3 key model dự phòng comment `#` để dành.
- [THẤP] Property panel Render không undo được · Sprint 3 B1 `meta` giá/vendor/sku trống · `knowledge/` 121MB cân nhắc Git LFS · M1 Larkbase: chưa link-picker grid >8 dự án.

## Chốt scope 23/07 (user quyết trực tiếp)
- **Chat mở rộng: Full** — project + direct + group Zalo + Supabase Realtime (phóng Agent CHAT-R nghiên cứu chi tiết trước khi build vì Supabase = external service, cần thẻ + schema đúng).
- **IF2 song song IF1** — không đợi dùng thử IF1 xong, bắt đầu ngay từ IF2-A (nền không breaking).
- **4 bộ cài**: Windows · Mac · Android · iOS/iPadOS. Thứ tự khả thi theo phụ thuộc thanh toán (xem plan riêng). Cần user chuẩn bị: Apple Developer $99/năm · Google Play Console $25 one-time · Supabase Free tier đủ dùng thử ban đầu.

## Việc chờ USER DUYỆT (đề xuất đã gửi, chưa phóng)
1. Intro Phase 2 Figma — user cần authorize `plugin:brand-voice:figma` MCP + vẽ scene draft.
2. Archinote handoff — chưa quyết A/B/cả 2.
3. ML Gu Engine — chưa chọn bắt đầu từ đâu.
4. MS Teams — chưa chọn scope.

## Bị chặn — KHÔNG tự khởi động
- (Trống — Intro/ML Gu/MS Teams đã bỏ chặn 21/07 tối, chuyển sang mục "Chờ USER DUYỆT" trên.)

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser — LUẬT MÁU:** dev server worktree PHẢI verify qua `127.0.0.1:<port>` (KHÔNG `localhost`); TUYỆT ĐỐI KHÔNG logout/DELETE cookie. Cần đăng nhập thật: worktree copy `.env` + DB riêng `dev.db.wt`. Code tự cách ly cookie: thiếu AUTH_SECRET→`if_session_noenv`; worktree(`.git` là file)→`if_session_wt`.
4. Worktree & context: CLAUDE.md (max **5** worktree; cơ chế an toàn tự dọn cuối phiên; STATUS <800 từ).
5. **Vai trò:** tôi phóng agent code, KHÔNG tự làm (xem memory `role-agentic-not-hands-on`).
