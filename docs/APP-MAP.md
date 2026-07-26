# APP-MAP — Bản đồ ứng dụng InteriorFlow

> Dựng bằng cách đọc code trực tiếp (26/07), không sửa gì. Cây route + API là liệt kê thật từ
> `find`; entry point UI xác nhận bằng `grep` link/router.push thật, không suy đoán.
> Xem thêm `docs/APP-MAP.mermaid` — sơ đồ trực quan của cây route.

---

## 1. Cây thư mục (3 tầng, bỏ `node_modules`/`.next`/`uploads`)

```
interiorflow/
├── app/                      Next.js App Router — route + page.tsx + api/
│   ├── api/                  45 route handler (§4 bản đồ API)
│   ├── cad-editor/           route CŨ chặng CAD — nay chỉ redirect (§2)
│   ├── cad-library-demo/     demo riêng thư viện block CAD (🔴 không có entry UI)
│   ├── demo-resort/          demo deck Present dựng sẵn, dữ liệu hư cấu (🔴 không có entry UI)
│   ├── fonts/                font cục bộ dùng cho <next/font>
│   ├── intro/                intro điện ảnh — ĐÃ GỠ khỏi luồng đăng nhập (🔴, giữ để khôi phục)
│   ├── library/ingest/       công cụ nạp ảnh tham khảo → manifest JSON (🔴 không có entry UI)
│   ├── login/                route login độc lập — chỉ vào được qua /intro (cũng 🔴 gián tiếp)
│   ├── photo-editor/         route CŨ "Chỉnh ảnh" — nay chỉ redirect (§2)
│   ├── present/               deck Present dựng sẵn, zero-setup demo khách (🔴 không có entry UI)
│   ├── present-editor/       route CŨ chặng Present — nay chỉ redirect (§2)
│   ├── projects/[id]/        4 chặng SCOPE DỰ ÁN thật (cad/render/photo/present) + overview/notebook
│   ├── report/               deck Present nội dung báo cáo chiến lược, font Editorial (🔴 không có entry UI)
│   └── settings/avatar/      trình dựng avatar búp bê nỉ — vào từ Header/MobileMenu
│
├── components/               UI React theo tính năng (không theo route)
│   ├── avatar/                AvatarRenderer (SVG) + AvatarBuilder + UserAvatar
│   ├── cad/                   CadEditor + toolbar/panel chặng Drafting CAD
│   ├── cad-library/            BlockLibraryDemo — thư viện block nội thất
│   ├── collab/                PresenceBar/LiveCursors — hiện diện nhiều người
│   ├── common/                nút/badge/tooltip dùng chung
│   ├── dashboard/              màn Dashboard team (route `/` khi đã chọn dự án)
│   ├── entry/                  ResumeTracker — tự mở lại đúng dự án/chặng lúc quay lại app
│   ├── form/                   ConceptForm — nhập ý tưởng ban đầu
│   ├── home/                   HomeScreen — thân route `/` (login/Gallery/canvas)
│   ├── intro/                  IntroSequence + SVG minh hoạ (route /intro, đang ngắt)
│   ├── nodes/                  UI cho node-graph chặng Render (NodeExtras…)
│   ├── notebook/                NotebookButton + panel RAG theo dự án
│   ├── photo-editor/            PhotoEditor Photoshop-level (layer/mask/clone)
│   ├── present/                 PresentDeck/PresentViewer — phát bản trình chiếu đã dựng
│   ├── present-editor/           PresentEditor — trình dàn trang chặng Presenting (32 file)
│   ├── sketch/                   công cụ phác thảo nhanh
│   ├── smartselect/              chọn vùng ảnh thông minh
│   ├── studio/                   StageSwitcher/StudioBar — thanh điều hướng 3 chặng dùng chung
│   ├── ui/                       primitive UI thuần (không gắn tính năng)
│   └── warp/                     biến dạng ảnh (warp mesh)
│
├── lib/                       Logic thuần — phần lớn test được bằng sucrase-node
│   ├── ai/                     adapter AI đa provider (fal/comfyui/nvidia/ollama/sd) + tier chọn model
│   ├── cad/                    DCEL half-edge geometry, standards checker VN/quốc tế, PDF/DXF export (38 file)
│   ├── demos/                   dữ liệu dựng sẵn cho /demo-resort, /report
│   ├── gu/                      Gu Engine — chưng cất gu thẩm mỹ từ ảnh tham khảo
│   ├── images/                  tiện ích ảnh thuần (không DOM)
│   ├── input/                   xử lý gesture/wheel/drop đa nền tảng
│   ├── integrations/             OAuth + mã hoá token dịch vụ ngoài (Google/MS365/Zoom/Zalo…)
│   ├── lark/                     tiện ích đọc/chuẩn hoá dữ liệu Larkbase
│   ├── nodes/                    registry + logic node-graph chặng Render
│   ├── notebook/                 chunk/embed/retrieve RAG cho Vitals per-project
│   ├── photo-editor/              handoff + hotkey trình chỉnh ảnh nâng cao
│   ├── present-editor/             logic chặng Present (32 file: layout/reflow/theme/pptx…)
│   ├── render-core/                lõi render dùng chung Render↔Present
│   ├── server/                     auth (JWT `jose`), access-control, db (Prisma singleton)
│   ├── sketch/                     logic phác thảo
│   ├── smartselect/                 thuật toán chọn vùng
│   ├── three/                      cầu Doc CAD → OBJ (dựng khối 3D thô, IF2-nền)
│   ├── ui/                         helper UI thuần
│   └── warp/                       thuật toán warp mesh
│
├── prisma/                   schema.prisma (16 model) + dev.db (SQLite local) + migrations/
├── docs/                     tài liệu kiến trúc/spec/research (77 file, xem docs/IF-CORE-SCHEMA.md)
├── public/                   asset tĩnh — 30 ảnh wallpaper, 18 ảnh detech, fonts, icons, demo
├── scripts/                  script chạy tay 1 lần (seed-admin, backfill-project-members…)
├── knowledge/                ttt-design-system — CHỈ dùng khi làm tài liệu cho TTT, không vào sản phẩm
├── electron/                 main.js — vỏ desktop Electron (spawn Next.js server, auto-updater)
├── installers/                scaffold đóng gói Windows/Mac/Android/iOS (docs/RESEARCH-INSTALLER-4-PLATFORMS.md)
├── extension/                Chrome extension companion (clip ảnh vào Library)
├── comfyui/                  workflow JSON cho provider ComfyUI self-host
└── (rác/build, không phải mã nguồn: 2407-Test/, dist/, dist-installer/, test drag/, test-input/, .serena/)
```

---

## 2. Cây route (đánh dấu scope + entry point)

```
/                              [global]  Dashboard/Gallery · app/page.tsx (→ HomeScreen)
                                → vào từ: URL gốc, mọi "logo" trong Header/StudioBar

/login                         [global]  Form đăng nhập độc lập · app/login/page.tsx
                                → vào từ: /intro (router.push sau khi xem xong)
                                🔴 /intro đang bị ngắt khỏi luồng thật ⇒ /login CHỈ vào được
                                   bằng gõ URL trực tiếp. Đăng nhập THẬT của user xảy ra ở
                                   LoginScreen NHÚNG TRONG HomeScreen tại `/`, không phải route này.

/intro                         [global]  Intro điện ảnh 4 cảnh · app/intro/page.tsx
                                🔴 KHÔNG có entry UI — HomeScreen.tsx dòng 379: "intro điện ảnh
                                   ĐÃ GỠ khỏi luồng", giữ file để khôi phục khi có hình/video.

/settings/avatar               [global]  Trình dựng avatar búp bê nỉ · app/settings/avatar/page.tsx
                                → vào từ: Header.tsx UserChip · MobileMenu.tsx AccountRow

/share/[token]                 [public]  Xem flow read-only, không cần đăng nhập · app/share/[token]/page.tsx
                                → vào từ: nút Share (Header/MobileMenu) copy link vào clipboard
                                   (không phải nav tĩnh — token sinh động ở /api/flows/[id])

/present                       [global]  Deck Present dựng sẵn, 0 auth/0 AI, cho khách xem · app/present/page.tsx
                                🔴 KHÔNG có entry UI — chỉ vào bằng gõ URL (demo cho khách/sale)

/report                        [global]  Deck báo cáo chiến lược, font Editorial · app/report/page.tsx
                                🔴 KHÔNG có entry UI — chỉ vào bằng gõ URL

/demo-resort                   [global]  Demo Pavilion/Sảnh dựng bằng chính pipeline Present · app/demo-resort/page.tsx
                                🔴 KHÔNG có entry UI ngoài chính nó (nút "Đổi cảnh" tự trỏ lại)

/cad-library-demo              [global]  Demo thư viện block CAD mới · app/cad-library-demo/page.tsx
                                🔴 KHÔNG có entry UI

/library/ingest                [global]  Nạp ảnh tham khảo → manifest JSON (manual-first) · app/library/ingest/page.tsx
                                🔴 KHÔNG có entry UI

/cad-editor                    [global]  ROUTE CŨ chặng CAD · app/cad-editor/page.tsx
                                ⚙️ Chỉ còn REDIRECT: đọc dự án đang hoạt động → replace
                                   sang /projects/[id]/cad. Giữ để không vỡ bookmark cũ.

/present-editor                [global]  ROUTE CŨ chặng Present · app/present-editor/page.tsx
                                ⚙️ REDIRECT tương tự → /projects/[id]/present

/photo-editor                  [global]  ROUTE CŨ "Chỉnh ảnh nâng cao" · app/photo-editor/page.tsx
                                ⚙️ REDIRECT → /projects/[id]/photo
                                → vào từ: nút "Chỉnh ảnh nâng cao" trong PresentEditor
                                   (Inspector.tsx/ImageEditor.tsx) — window.open('/photo-editor')

/projects/[id]/overview        [project] Tổng quan dự án (flows + member count + role)
                                app/projects/[id]/overview/page.tsx
                                → vào từ: components/ProjectSelect.tsx

/projects/[id]/notebook        [project] NotebookLM riêng theo dự án (RAG cho Vitals)
                                app/projects/[id]/notebook/page.tsx
                                → vào từ: components/notebook/NotebookButton.tsx ·
                                   Header.tsx · StageSwitcher.tsx

/projects/[id]/cad             [project] CHẶNG 1 · Drafting CAD
                                app/projects/[id]/cad/page.tsx → components/cad/CadEditor.tsx
                                → vào từ: StageSwitcher (StudioBar/Header) · legacy /cad-editor

/projects/[id]/render          [project] CHẶNG 2 · Rendering (canvas node-graph)
                                app/projects/[id]/render/page.tsx → components/home/HomeScreen.tsx
                                → vào từ: StageSwitcher · auto-resume sau login · legacy /

/projects/[id]/photo           [project] Công cụ "Chỉnh ảnh" (con của chặng Rendering)
                                app/projects/[id]/photo/page.tsx → components/photo-editor/PhotoEditorScreen
                                → vào từ: nút "Chỉnh ảnh nâng cao" trong PresentEditor (qua legacy /photo-editor)

/projects/[id]/present          [project] CHẶNG 3 · Presenting
                                app/projects/[id]/present/page.tsx → components/present-editor/PresentStageScreen.tsx
                                → vào từ: StageSwitcher · legacy /present-editor
```

**Tổng: 18 route.** 6 route gắn 🔴 (không có đường vào từ UI, chỉ gõ URL trực tiếp) — 5 route
demo/dev cố ý đứng riêng (`/present`, `/report`, `/demo-resort`, `/cad-library-demo`,
`/library/ingest`) + `/intro` bị ngắt có chủ đích. Không cái nào là bug ẩn — đều có lý do trong
comment code, nhưng đáng để soát lại nếu định dọn route trước khi bán (mục Nợ kỹ thuật cuối file).

---

## 3. Sơ đồ 3 chặng — CAD → Render → Present

```
┌─────────────────────┐   handoff sessionStorage    ┌─────────────────────┐   handoff sessionStorage    ┌─────────────────────┐
│   CHẶNG 1 — CAD      │   lib/cad/handoff.ts        │  CHẶNG 2 — RENDER    │  lib/present-editor/         │  CHẶNG 3 — PRESENT   │
│  /projects/[id]/cad  │ ──────────────────────────► │ /projects/[id]/render│  handoff.ts                 │ /projects/[id]/present│
│                      │  key: interiorflow.          │                      │ ──────────────────────────► │                      │
│  CadEditor.tsx        │  cadHandoff                 │  HomeScreen.tsx       │  key: (module-singleton +   │  PresentStageScreen   │
│  Doc (DCEL half-edge) │                              │  node-graph React    │   sessionStorage fallback)  │  PresentEditor.tsx    │
│  lib/cad/model.ts     │  payload {version, dataUrl   │  Flow (React Flow)   │                              │  slide/deck theo      │
│  layer/hatch/dim/     │   (ảnh raster sheet), snapshot│  Flow.graphJson lưu │  payload: deckImagesFromNodes│  lib/slides            │
│  standards checker    │   (Doc JSON, đóng băng)}      │  DB qua Prisma       │  (rút ảnh từ node đã Run)    │                        │
│                       │                              │  registry node AI    │                              │  Export: PDF/PPTX/     │
│  "Đưa sang Present"   │ ─────────────────────────────────────────────────────────────────────────────────►│  video (chặng 3)       │
│  lib/cad/present-      │  SONG SONG — bỏ qua Render, đi thẳng CAD → Present (nút riêng, cùng pattern)        │                        │
│  handoff.ts            │                                                                                    │                        │
└─────────────────────┘                                                                                     └─────────────────────┘
```

**Cơ chế chung cả 3 cầu nối:** route đích là SPA client khác nhau, Zustand store KHÔNG tự
hydrate qua router.push — nên mỗi cầu đều STASH vào `sessionStorage` (fallback biến module-level
nếu sessionStorage đầy/bị chặn) rồi CONSUME-ONCE ở route đích (đọc xong dọn sạch cả 2 nguồn ngay,
tránh double-insert khi component remount). Không có handoff nào chạy ⇒ route đích hiện y hệt
trước khi có cơ chế này (không phá luồng cũ).

**Điểm khác giữa 2 cầu:** CAD→Render/Present đóng băng **snapshot Doc dạng JSON** (chống mất dữ
liệu khi hoạ viên/BIM sửa song song, IF2-nền); Render→Present chỉ rút **ảnh đã Run** từ node
graph (`deckImagesFromNodes`), không mang theo cấu trúc node.

---

## 4. Bản đồ API (45 route, gom theo miền)

| Miền | Route (`app/api/...`) | Mô tả |
|---|---|---|
| **auth** | `auth/{login,register,me,providers}`, `auth/{google,microsoft,apple}(/callback)` | Đăng nhập/đăng ký JWT tự viết (`jose`) + OAuth Google/Microsoft, Apple còn khung chưa bật |
| **project** | `projects/[id]/{members,overview}`, `dashboard` | CRUD thành viên + vai trò dự án, tổng quan 1 dự án, tổng quan toàn team (Dashboard) |
| **flow** | `flows`, `flows/[id]`, `share/[token]` | CRUD bản vẽ/canvas (autosave, snapshot version, share token), xem public qua token |
| **library** | `library`, `library/[id]`, `library/[id]/file`, `library/clip` | Thư viện tài sản dùng chung team — upload/liệt kê/tải file/xoá (mềm) + "clip" ảnh từ web qua extension |
| **notebook** | `notebook/[projectId]/{query,source,sources,source/[sourceId](/file)}` | RAG NotebookLM per-project — nạp nguồn (PDF/ảnh/note), chunk/embed, hỏi đáp có trích dẫn |
| **render/ai** | `render/{fbx,nvidia-image,premium}`, `ai-assist-chat`, `illustration`, `vision/caption`, `jobs`, `jobs/[id]`, `stock-photos(/proxy)` | Node AI chặng Render: xuất FBX, ảnh AI (NVIDIA/premium), gợi ý chat, minh hoạ, caption ảnh, polling job async, tìm/proxy ảnh stock |
| **present** | `present/text`, `pdf/extract` | Sinh nội dung text cho slide, bóc chữ từ PDF (đề bài/hồ sơ) |
| **integrations** | `integrations/[provider]/{connect,callback,disconnect,status}` | OAuth server-side cho dịch vụ ngoài (Google Workspace/MS365/Zoom…), token mã hoá at-rest |
| **lark** | `lark-tasks`, `lark-tasks/sync`, `lark-user-map` | Mirror pull-only bảng công việc/nhân sự Larkbase cho panel "Chi tiết" dự án |
| **khác** | `health`, `comments`, `credits`, `cursors`, `chat`, `specs`, `specs/[id]`, `user/avatar` | Health check provider AI · comment ảnh · giao dịch tín dụng · con trỏ collab realtime · chat Vitals · ProductSpec (legend/schedule) · avatar user |

---

## Nợ kỹ thuật phát hiện khi dựng bản đồ (chỉ ghi, không sửa)

- 🔴 **6 route không có entry UI** (§2) — nếu đóng gói bán, nên quyết dứt khoát: xoá hẳn (dev
  route như `/cad-library-demo`), giữ làm demo bán hàng có chủ đích (`/present`, `/demo-resort`,
  `/report` — cần gắn watermark/nhãn "demo" rõ ràng nếu public), hoặc khôi phục vào luồng
  (`/intro`, `/library/ingest`).
- 🟡 `/login` (route độc lập) chỉ vào được qua `/intro` — mà `/intro` lại đang ngắt. Về mặt UX
  thật, route `/login` gần như mồ côi kép; đăng nhập thật xảy ra ở `LoginScreen` nhúng trong
  `HomeScreen` tại `/`, không qua route `/login` này.
- 🟡 3 route redirect cũ (`/cad-editor`, `/present-editor`, `/photo-editor`) vẫn ăn 1 lượt
  round-trip điều hướng mỗi khi được gọi — chấp nhận được (giữ bookmark cũ) nhưng đáng nhớ khi
  đo hiệu năng chuyển chặng.
