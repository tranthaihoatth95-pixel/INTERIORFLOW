# InteriorFlow — Bàn giao phiên & Roadmap

> File này để mở phiên chat mới đọc là tiếp tục được ngay. Cập nhật 2026-07-05 (xem MỤC 10 — mới nhất).

## 1. Backend hiện tại đang chạy như thế nào

Toàn bộ là **1 app Next.js 14 (App Router)** — vừa là frontend vừa là backend, không tách server riêng:

- **Frontend**: React + `@xyflow/react` (canvas node), Zustand (state), TailwindCSS + CSS variables (theme sáng/tối).
- **Backend = Next.js API Routes** (`app/api/**`), chạy Node.js:
  - `auth/*` — đăng ký/đăng nhập, JWT cookie (jose) + bcrypt. **Tự viết, không NextAuth.**
  - `flows/*` — CRUD flow, autosave, snapshot version, share token.
  - `credits` — ledger (spend nguyên tử `updateMany ... gte`, refund khi lỗi).
  - `chat` — tin nhắn + presence (polling 3s).
  - `library/*` — thư viện ảnh team, file lưu `./uploads/`, metadata trong DB.
  - `jobs/*` — **adapter gọi AI** (hiện tại fal.ai). Đây là chỗ nối API AI.
- **Database**: Prisma + **SQLite** (`prisma/dev.db`). Đổi `provider = "postgresql"` + `DATABASE_URL` là lên Supabase/Postgres, không sửa code.
- **AI**: adapter layer `lib/ai/` — client gửi `task` → server map sang model fal.ai → submit + poll. Tách sạch để **thêm provider mới (ComfyUI self-host, Gemini, video API) chỉ cần thêm 1 file provider**, không đụng node.
- **Cơ chế credit**: mỗi node có `creditCost`; đã đăng nhập thì trừ/hoàn qua `/api/credits` (server), chưa thì trừ local.

**Tóm lại**: một Next.js app duy nhất, DB SQLite, AI qua adapter. Chạy được trên bất kỳ máy nào có Node. Cả team hiện dùng bằng cách vào `http://<ip-máy-chủ>:3000`.

## 2. Yêu cầu tiếp theo (nhiệm vụ phiên 11:30) — theo thứ tự ưu tiên

### A. Chạy native trên Windows (dàn máy mạnh có 3ds Max + Vray/D5)
- **Cách 1 (khuyến ngh) — Tauri**: wrap app Next.js thành .exe/.msi, nhẹ (~10MB), Rust core. Ưu điểm: chạy như app desktop, đóng gói được cả server Node bên trong hoặc trỏ về server LAN.
- **Cách 2 — Electron**: nặng hơn nhưng dễ hơn, đóng gói Next.js + Node server + SQLite vào 1 app. Chọn cách này nếu cần nhanh.
- **Tận dụng máy mạnh**: cài **ComfyUI + FLUX.1 dev** local trên máy render (RTX ≥12GB), viết provider `lib/ai/providers/comfyui.ts` → render **0đ/ảnh, không gửi bản vẽ khách ra ngoài**. Đây là điểm mạnh nhất: máy đã có sẵn cho Vray/D5.
- 3ds Max/Vray: KHÔNG thay thế, mà **bổ trợ** — xuất viewport/clay render từ Max → Import Image → AI polish/relight/upscale. Có thể thêm node "Import từ Max" (watch folder).

### B. Cài lên iPad (iPadOS), Android, điện thoại
- **PWA** (Progressive Web App): thêm `manifest.json` + service worker → "Add to Home Screen" trên iPad/Android chạy full màn hình như app native. **Không cần App Store, không phí developer.** Đây là cách nhanh + phủ hết thiết bị nhất.
- Cần: responsive layout (hiện đang desktop-first — phải làm mobile: panel thành bottom-sheet, canvas pinch-zoom đã có sẵn của React Flow).
- Nâng cao (nếu cần app store thật): Capacitor wrap PWA → .ipa/.apk.

### C. Nối API AI tạo ảnh + video tốt nhất hiện nay
Adapter đã sẵn. Cần thêm:
- **Ảnh** (đã có fal FLUX): thêm **Gemini 3 Pro Image (Nano Banana Pro)** cho chất lượng cao + hiểu prompt tiếng Việt; **Recraft/Ideogram** cho text-trong-ảnh.
- **VIDEO** (CHƯA CÓ — làm mới): interior walkthrough / flythrough. Nên nối qua fal.ai (1 key, nhiều model):
  - **Kling 2.x** (image-to-video, chuyển động mượt) — tốt nhất cho pan nội thất.
  - **Google Veo 3** (chất lượng cao, có audio).
  - **Runway Gen-4**, **Luma Ray 2**, **Minimax Hailuo** — dự phòng.
  - Node mới: `ai.image2video` (input: ảnh render + prompt chuyển động → output video URL). Cần thêm `DataType = 'video'`, node hiển thị `<video>`, output panel tải mp4.
- **Giá tham khảo**: ảnh fal FLUX ~$0.05/ảnh; video ~$0.3–0.5/clip 5s. Nạp fal $10–20 là chạy được nhiều.

### D. Giao diện chuẩn Apple Design System + motion vibe Apple
- **Đổi type system**: dùng SF Pro (hoặc `-apple-system` font stack), spacing 8pt grid, corner radius Apple (10/14/20), materials (translucency/vibrancy — backdrop-blur).
- **Motion**: spring animations (framer-motion), easing Apple (`cubic-bezier(0.32, 0.72, 0, 1)`), panel slide như iOS sheet, haptic-like micro-interactions, node xuất hiện có spring scale.
- **Cân nhắc**: giữ tông quiet-luxury hiện tại nhưng tinh chỉnh theo HIG. Thêm framer-motion (chưa cài).

## 3. Trạng thái hiện tại (đã xong, đã test)
- Phase 1–4: canvas node, 24 node (input/AI generate/AI edit/slide/utility/output), edge typing, run per-node + run flow (topo-sort), cache, undo/redo, mask painter, annotate, compare A/B, color palette, export board PDF, gallery.
- Pipeline SLIDE: Concept → Slide Composer (theme từ ảnh ref) → Export Deck PDF. **Chạy 100% local, đã nghiệm thu (gửi user deck SERENE).**
- Phase 3 multi-user: auth, credits ledger server, flows + version, share link read-only `/share/[token]`, chat team + presence, thư viện team (`./uploads`). Test 2 user OK.
- Theme sáng/tối auto theo giờ (6h30–18h sáng).
- Command Palette ⌘K, DAG auto-layout, snap-to-grid (Increment 1).

## 4. Chặn / chờ
- **fal.ai**: key đã gắn (`.env.local`) nhưng **tài khoản hết balance** → cần nạp tại fal.ai/dashboard/billing.
- **Gemini**: key ở `~/.config/gemini/api_key` nhưng free-tier bị chặn model ảnh.
- Nạp 1 trong 2 là chạy AI thật ngay. Flow mẫu "Phòng ngủ hoàn chỉnh" đã tune prompt sẵn để nghiệm thu.

## 5. Tài khoản test
- `hoa@ttt.vn` / `matkhau123` (admin, 500cr)
- `thong@ttt.vn` / `matkhau123` (member, 200cr)

## 6. Lệnh hay dùng
```bash
cd ~/Downloads/interiorflow
npm run dev              # dev server :3000
npx prisma studio        # xem DB
npx prisma migrate dev   # sau khi đổi schema
# ⚠️ Đừng chạy `npm run build` khi dev server đang chạy — hỏng .next, phải rm -rf .next
```

## 7. Việc đã CHIA RA CHẠY SONG SONG (2026-07-04, mỗi hạng mục 1 branch riêng, worktree cô lập)

4 branch đã tạo xong, **cả 4 đều compile sạch (`npx tsc --noEmit` exit 0)**. TRẠNG THÁI THỰC TẾ (cập nhật 04/07 sau khi các agent dừng):

| Thứ tự merge | Branch | Commit | Trạng thái | Nội dung |
|---|---|---|---|---|
| 1 | `feat/electron` | `5979d49` | ✅ XONG | .exe Windows (Electron): `electron/main.js` spawn Next + SQLite/uploads vào `%APPDATA%`, README-electron.md. Chỉ thêm file + sửa package.json/next.config/.gitignore → ít xung đột |
| 2 | `feat/video-nodes` | `69c879d` | ✅ XONG | Node `ai.image2video` + `ai.text2video` (Kling qua fal), DataType 'video', `<video>` + tải mp4, lightbox video |
| 3 | `feat/pwa` | `9c1628d` | ✅ XONG (agent stall lúc *test trình duyệt*, code đã đủ + tsc sạch) | PWA: manifest + `public/sw.js` + `PWARegister.tsx` + responsive mobile (panel overlay). Đụng layout + nhiều component |
| 4 (CUỐI) | `feat/apple-design` | `6afc48d` | ⚠️ NỀN XONG + COMPILE SẠCH nhưng RESTYLE MỚI ~9 COMPONENT — CẦN HOÀN THIỆN | Tokens Apple (globals.css), `tailwind.config`, `lib/motion.ts` (framer-motion), restyle: Header, LeftRail, 4 panel, ChatPanel, FlowsPanel, TasksDropdown. **CHƯA restyle: InteriorNode (node canvas), MaskPainter/Annotate modal, Lightbox, LoginScreen, FlowCanvas, BottomToolbar**; AnimatePresence bọc panel có thể chưa xong. Đã sửa bug framer nuốt drag-drop ở NodeLibrary/LibraryPanel. |

**CẬP NHẬT 04/07 (tối) — apple-design ĐÃ MERGE VÀO MAIN + dựng ENTRY EXPERIENCE:**
- `feat/apple-design` đã merge vào `main` (commit merge `fb3d602`). Main giờ = bản Apple design.
- Dựng thêm trên main (theo yêu cầu "entry experience trước"): **IntroSequence** (4 cảnh điện ảnh, orb, CTA), **LoginScreen mới** (2 lối vào Presentation/3D Render, `StackedCards` xòe khi hover/xếp lại khi rời, form kính, chọn workspace), store `workspace`+`viewMode`, **ViewToggle Node/Window** (Window "sắp có" — mốc cho engine Figma). Đã verify E2E: intro→login→chọn mode→đăng nhập→vào app. Sửa xong warning AnimatePresence 'two children same key' (mỗi panel tự bọc AnimatePresence + key).
- File mới: `components/IntroSequence.tsx`, `components/LoginScreen.tsx`, `components/entry/StackedCards.tsx`, `components/entry/cardFaces.tsx`.
- **CÒN LẠI của apple-design (restyle chưa hết)**: InteriorNode (node canvas — hiện đã ổn nhờ token nhưng chưa có spring appear), MaskPainter/Annotate modal, Lightbox, BottomToolbar, FlowCanvas — nên restyle+motion nốt cho đồng bộ.

**3 branch còn CHỜ MERGE vào main (đã Apple hoá)** — thứ tự + lưu ý xung đột mới:
1. `feat/electron` (`5979d49`) — additive, merge dễ.
2. `feat/video-nodes` (`69c879d`) — đụng NodeExtras/types/registry, xung đột nhẹ với Apple main.
3. `feat/pwa` (`9c1628d`) — ⚠️ đụng NHIỀU với Apple restyle (responsive class + layout). Manifest/sw/PWARegister thì additive; phần responsive className phải hoà tay (giữ cả class Apple lẫn responsive modifier). Cân nhắc: lấy phần additive trước, làm lại responsive trên Apple main.
Merge xong mỗi cái chạy `npm run build`; `git worktree prune` để dọn.

**PHIÊN SAU (theo lựa chọn user):** (a) tách 2 WORKSPACE Presentation vs 3D Render — mỗi bên tool/library gọn theo ngữ cảnh (dùng `store.workspace` đã có); (b) xây engine **Window view kiểu Figma** (ViewToggle đã để mốc, `store.viewMode`); (c) restyle nốt component còn lại.

## 8. Còn lại phải làm TRÊN MÁY CÔNG TY (không chạy được autonomous/cloud)
1. Cài **ComfyUI + FLUX.1 dev** trên máy render (RTX) → viết `lib/ai/providers/comfyui.ts` → render 0đ, không gửi bản vẽ ra ngoài. Đây là hạng mục giá trị nhất, tận dụng dàn máy Vray/D5.
2. Build & test file **.exe Windows** thật (feat/electron chỉ cấu hình, chưa build ra .exe vì cần chạy trên Windows).
3. **Nạp fal.ai** (~$10–20) để chạy AI ảnh/video thật, nghiệm thu flow "Phòng ngủ hoàn chỉnh".
4. Tạo repo GitHub (private) nếu muốn dùng claude.ai/code cloud thật (máy hiện không có `gh`/token nên phải tạo tay 1 lần).

## 9. Chiến lược AI-tiers + Mia prompt (04/07)
- `docs/STRATEGY-ai-tiers-and-safety.md` — núm chỉnh mức phụ thuộc AI (4 mức: Cao/Vừa/Tự-host-0đ/KHÔNG-AI-an-toàn-nhất), note vật liệu lên file, phân công Mia vs Claude Code, câu hỏi Q&A cho user.
- `docs/PROMPT-MIA-material-tags.md` — prompt gửi Mia làm tính năng Material Tag (0-AI) trên branch feat/material-tags.
- **Claude Code phiên sau làm**: AI-tier engine (store.aiTier + provider comfyui), tách 2 workspace, restyle nốt Apple, merge 3 branch chờ. Chờ user trả lời Q&A §5 của STRATEGY.

**CẬP NHẬT 04/07 — AI-TIER ENGINE + COMFYUI + CLAY→PHOTOREAL ĐÃ XONG (Claude Code):**
- **User chốt Q&A**: (5) máy render **RTX ≥16GB** → mức 2 tự-host khả thi, đặt **DEFAULT_TIER=2**. (1) "sản phẩm đầu-cuối look like" ý user = **chất lượng ẢNH nội thất + slide PPTX dàn ra** (chuẩn quiet-luxury), KHÔNG phải giao diện app.
- **Đã build + verify (tsc sạch, test E2E trên browser):**
  - `lib/ai/tiers.ts` — 4 mức (TIERS/TIER_ORDER/DEFAULT_TIER=2), `providerForTier`, `resolveModel(task,tier)`.
  - `lib/ai/models.ts` — thêm `falFast`/`comfy` mỗi task + task mới `clay2render` (depth). Interface `TaskModel`.
  - `lib/ai/providers/comfyui.ts` — adapter self-host: nạp workflow API-format `comfyui/workflows/*.json`, bơm marker `_meta.title` (IF_POSITIVE/IMAGE/MASK/SEED…), upload ảnh, `/prompt`+`/history`. `providers/index.ts` dispatch fal|comfyui.
  - API `/api/jobs` (+`[id]`, `/api/health`) nhận `tier`, resolve provider, 503 PROVIDER_NOT_CONFIGURED → client lùi mock. `client.ts`: `runImageJob(...,tier)` + `checkProviders()`.
  - `store.aiTier` (persist+hydrate), `execution.ts` truyền `ctx.aiTier`, `registry.ts` tier-aware + node **`ai.clay2render`** (Clay→Photoreal, ControlNet depth, prompt khoá geometry).
  - `Header.tsx` — núm `AiTierMenu` 4 mức (badge + dropdown, cờ "chạy mock" khi provider chưa nối). `NodeLibraryPanel` — mức 1 ẩn hết node AI.
  - `comfyui/README.md` + `comfyui/workflows/clay_depth.json` (SDXL depth mẫu) — hướng dẫn cài trên máy render.
- **CÒN LẠI CHO MÁY CÔNG TY**: cài ComfyUI + set `COMFYUI_URL` (badge hết "mock"); tạo nốt các workflow còn lại (sketch_canny/img2img/text2img/inpaint/upscale) bằng Save-API-Format; tune clay_depth (đổi FLUX nếu muốn). Xem comfyui/README.md.
- **WORKSPACE → 3 CHẶNG MỀM ĐÃ XONG (04/07, sau khi bàn với user)**: KHÔNG tách app cứng. Present↔Render không rời rạc mà là 2 chặng liền của 1 pipeline → làm **3 chặng mềm Concept→Render→Present** (`lib/phases.ts` PHASES/featured/demo). `store.WorkspaceMode = Phase` (migrate 'presentation'→'present', hydrate persist). Header **PhaseSwitcher** segmented (đi lại tự do, chỉ đổi nhấn mạnh — không đụng canvas). NodeLibrary: nhóm **★ Chặng X** (featured node) ở đầu, phần còn lại vẫn liệt kê đủ (soft). Login entry 2→3 lối vào (conceptFaces mới). Starter demo `concept` (ref→palette, style→moodboard). tsc sạch + verify browser. **"Photoshop" KHÔNG làm trụ** (đã là util.edit/mask/annotate bên trong).
- **MERGE (05/07)**: `feat/electron` ✅ ĐÃ MERGE vào main (commit merge `5780a08`, chỉ đụng .gitignore — union xong). **Còn chờ merge: `feat/video-nodes`** (⚠️ đụng client/models/registry/types.ts — trùng file AI-tier vừa viết, xung đột thật, resolve tay) **và `feat/pwa`** (⚠️ đụng Header/NodeLibraryPanel/next.config — trùng phase work). Làm tuần tự, tsc sau mỗi bước.
- **05/07 — video-nodes + pwa ĐÃ MERGE** (commit `37d4c3d`, `fe951f7`), tsc sạch + verify browser (header có PhaseSwitcher+AiTier+Clay→Photoreal+Image/Text→Video, không lỗi). video-nodes giữ cả AI-tier lẫn Kling (`aiVideo` sửa tier-aware, video chỉ mức 3/4 fal; `mediaType?` trong TaskModel). pwa: **chỉ lấy hạ tầng** (manifest/sw/PWARegister/viewport/safe-area/mobile CSS + overlay mobile page.tsx), **GIỮ UI Apple** (7 component --ours). Cả electron/video/pwa nay ở main.
- **CÒN LẠI (autonomous phiên sau)**: ~~restyle nốt Apple (InteriorNode/MaskPainter/Lightbox/BottomToolbar/FlowCanvas)~~ ✅ **XONG 05/07** (xem bên dưới); **làm lại responsive header + panel bottom-sheet trên nền Apple** (đã hoãn khi merge pwa — header đang chật, tên flow bị co) ← **việc tiếp theo ưu tiên**; (tuỳ chọn) wire empty-state canvas nạp starter theo chặng (`phase.demo`).

**CẬP NHẬT 05/07 (tối) — APPLE RESTYLE OVERLAYS + NODE ĐÃ XONG (Claude Code, chưa commit):**
- Restyle 5 component còn sót sang token Apple + framer-motion (dùng preset `lib/motion.ts`, không tự chế): thay hết `violet-*` cứng → `var(--accent*)`; radii Apple (10/14/16/20); material `mat-overlay`/`mat-card` + hairline; motion `pressable`/`pressableIcon`.
  - `Lightbox.tsx` — bọc `AnimatePresence` (fade backdrop + modalScale content), nút X kính-mờ tròn, radius ảnh/video 14.
  - `MaskPainterModal.tsx` + `AnnotateModal.tsx` — bỏ `return null` sớm → bọc `AnimatePresence` (fade+modalScale), panel `mat-card` rounded-20, mọi nút → accent + motion press, slider/input focus → accent-ring.
  - `BottomToolbar.tsx` — `mat-card` rounded-14, spring-up appear, nút icon micro-press (component `Btn` nội bộ), active → accent-soft.
  - `nodes/InteriorNode.tsx` — root thành `motion.div` với `nodePop` (spring appear đã thiếu), viền chọn/nút Run/spinner/progress/focus → accent, `mat-card` rounded-16.
- **Verify**: `npx tsc --noEmit` exit 0. Chạy dev :3000, test browser: node + toolbar render material đúng (blur 40px, radius 14), mở Annotate modal (mount sạch, "chưa có ảnh nguồn" đúng), mở Lightbox (backdrop + ảnh rounded + nút X mới), đóng cả hai → exit animation chạy, **0 console error**. Store lộ ở `window.__flowStore` (dev) tiện test.
- **FlowCanvas.tsx CHƯA đụng** (chỉ là wrapper React Flow + BG, không có `violet-*`/radius lệch — để nguyên, không cần restyle). Nếu muốn có thể thêm empty-state đẹp sau.
- ~~CHƯA COMMIT~~ ✅ đã commit `da7b0b6`.
- **DOCS mới (05/07)**: `docs/STRATEGY-competitive-and-unification.md` (feature map tổng→chi tiết + so Weavy/Canva/Figma + đánh giá vs Max→Vray→PPT + hợp nhất với Creative Board), `docs/PROMPT-MIA-ui-polish.md` (giao Mia polish UI, thư mục cô lập tránh giẫm chân).

---

## 10. PHIÊN 05/07 (chiều) — DASHBOARD + REAL-TIME COLLAB + HEADER RESPONSIVE

Chạy song song: phiên chính (main) build Dashboard + header; **1 Claude Code phụ (worktree cô lập)** build real-time collab. Phân vùng file nghiêm ngặt để 0 xung đột. **Cả 4 commit đã lên `main`, tsc sạch mỗi bước, verify browser.**

| Commit | Nội dung |
|---|---|
| `da7b0b6` | Apple restyle overlays+node (mục 9 ở trên) |
| `4d51d81` | **Real-time collab** (agent phụ, branch `feat/realtime-collab` đã merge) |
| `8f15509` | **Dashboard** tổng quan + **header responsive** |
| `109cb5d` | merge collab → main |

### A. Dashboard tổng quan project + team ✅
- `app/api/dashboard/route.ts` — gộp team (users + presence online<2ph), projects (đếm flow), 12 flow mới nhất, stats (credit dùng 30 ngày / còn lại). App nội bộ → hiện **toàn team**.
- `components/Dashboard.tsx` — overlay toàn màn Apple-styled: 4 stat card, grid dự án, roster team (avatar màu theo hash userId + online dot + admin crown + "bạn"), recent flows click → `openFlow`. framer-motion stagger. Nút "Dự án mới" (`createProject`, đang dùng `window.prompt` — nên thay bằng modal đẹp sau).
- `store.dashboardOpen` + setter; **LeftRail** thêm nút "Tổng quan" ở đầu; mount trong `page.tsx`.
- **Verify**: login `hoa@ttt.vn` → render data thật (3 member / 2 flow / credit), 0 console error.

### B. Real-time collaboration kiểu Canva ✅ (code xong, cần test 2-máy thật)
- File MỚI (agent phụ): `app/api/cursors/route.ts` (Map in-memory, POST upsert / GET?flowId&me lọc <6s, prune stale — **reset khi restart server**, chấp nhận cho presence ephemeral); `lib/collabStore.ts` (Zustand RIÊNG, poll ~900ms, màu theo hash userId, SSR-guard); `components/collab/LiveCursors.tsx` (mũi tên SVG + pill tên, flow→screen theo `useViewport` nên bám pan/zoom); `components/collab/PresenceBar.tsx` (pill mat-card góc phải, avatar+online dot, ẩn khi 1 mình).
- Chỉ sửa `components/FlowCanvas.tsx`: onPointerMove→`screenToFlowPosition`→`setLocalCursor`, start/stop theo mount, mount `<LiveCursors/>`+`<PresenceBar/>`. Guest chưa login = "Khách" (id sessionStorage).
- **Verify**: client poll đúng flowId+me (server log xác nhận); bơm cursor giả 2 "đồng đội" vào flow đang mở → PresenceBar hiện 2 avatar + LiveCursor render (kiểm chứng DOM). **Multiplayer thật cần 2 trình duyệt** — chưa test được tự động.

### C. Header responsive (một phần) ⚠️
- Đã sửa "tên flow bị co": flow name `min-w-0 shrink truncate` + max-width theo breakpoint; cụm nút phải `shrink-0`; Run/Share thu nhãn theo sm/md. Desktop ≥1280 sạch, 1024 ổn.
- **CÒN**: ở **<400px (mobile thật)** vẫn tràn ~9 control (theme/tasks/user trôi khỏi mép) → cần **menu "⋯" overflow** gom nút phụ + **panel bottom-sheet** cho mobile (mục hoãn từ merge pwa vẫn còn).

### CÒN LẠI / CHẶN (phiên sau)
1. **AI (đã quyết HOÃN theo user 05/07)**: fal.ai + Gemini hết balance → node AI chạy **mock**. **User chốt "CHƯA CẦN AI" — dùng luồng non-AI trước** (import/edit/mask/annotate/slide/dashboard/collab đều THẬT, AI-tier mức 1). Đây là lựa chọn có chủ đích, KHÔNG phải đang kẹt. Khi cần bật AI thật: (a) nạp fal ~$10–20, hoặc (b) cài **ComfyUI + FLUX** máy render → mức 2 tự-host 0đ (`comfyui/README.md`).
2. Header mobile overflow menu + bottom-sheet panel.
3. Collab: test 2-máy thật; nâng cấp presence dùng WebSocket nếu polling nặng khi đông người (hiện ổn cho team nhỏ LAN).
4. Dashboard: thay `window.prompt` "Dự án mới" bằng modal; thêm nút xoá/đổi tên dự án; gán flow vào project.
5. Node `ai.clay2render` + các workflow ComfyUI còn thiếu (làm trên máy công ty).
