# CHANGELOG — InteriorFlow (lịch sử đã xong; KHÔNG đọc mỗi đầu phiên — chỉ khi được yêu cầu)

## 16/07 — BUG GroupOverlay vô hình (Render canvas Cmd+G), chi tiết kỹ thuật
`components/nodes/GroupOverlay.tsx` + `FlowCanvas.tsx:305`: `<GroupOverlay />` render là sibling của `<ReactFlow>` (không bọc `ViewportPortal`), dùng thẳng `node.position` (toạ độ flow-space) làm CSS `left/top` — KHÔNG cộng transform pan/zoom hiện tại của viewport, nên khung/label/nút collapse-rename-ungroup lệch vị trí thật. Thêm nữa `zIndex: -1` khiến nó luôn nằm SAU nền canvas (wrapper cha có `position: relative` → tạo stacking context riêng) → hoàn toàn không thấy được dù DOM vẫn có element + state group vẫn tạo đúng (confirm qua `window.__flowStore`). Cần: bọc bằng `ViewportPortal` (hoặc tự áp transform từ `useViewport()`) + bỏ `zIndex:-1`.

## 15/07 — Sprint 3 B1+B2 Shape Library + tương tác
3 agent song song A/B/C theo `SHAPE-SCHEMA.md`, merge tuần tự A→B→C vào `feat/present-layout-ml-p1`, verify tsc+test sau mỗi merge, PASS cả 3.
- **B1 (41 shape, từ 18 gốc)**: `lib/cad/furniture.ts` — phòng ngủ (tủ đầu giường, bàn trang điểm), phòng khách (sofa góc, bàn trà, kệ TV), bếp (tủ lạnh, đảo bếp, hút mùi, lò vi sóng), tắm (vòi sen, gương), văn phòng (ghế, tủ hồ sơ, kệ sách), 3 loại cửa mới + 2 loại cửa sổ, cầu thang thẳng/chữ L (nhóm mới `Cầu thang`), máy lạnh/quạt trần (nhóm mới `Thiết bị`). Cầu thang xoắn BỎ QUA (Prim không vẽ được đường xoắn thật).
- **B2 (8/8 xong)**: drag-drop từ palette, auto-snap tường, resize góc, info panel, variant switch, collision (SAT), clearance overlay, search — file mới `lib/cad/shape-interactions.ts`, `components/ShapePalette.tsx`.
- **Schema chung**: `lib/cad/shared-types.ts` — tách 5 type (`BlockGroup/ShapeVariant/SnapAnchor/ClearanceZone/ShapeMeta`) ra khỏi `furniture.ts` sau khi 3 agent song song tự trùng định nghĩa gây conflict merge 2 lần liên tiếp. Quy tắc rút ra: tách schema chung + commit trước, agent chỉ import từ file chung, không tự định nghĩa lại.
- **Test**: 634 test (29 file `*.test.ts` qua `sucrase-node`) PASS 0 fail, tsc 0 lỗi.
- ⚠️ Bài học quy trình: 2/3 agent (Agent C, và trước đó agent merge QA-stress) LÀM XONG việc nhưng QUÊN COMMIT trước khi báo done — chỉ phát hiện lúc merge thấy branch không đổi HEAD. Từ đó: agent phải tự xác nhận `git log -1` trước khi báo cáo.
- ⚠️ Phát hiện khi verify: dòng "170 test mới" ghi trước đây cho `feat/sprint3-qa-stress` là SAI — thực tế merge chỉ có 42 test (`stress-auth.test.ts`), 4 file stress test khác đã mất do agent quên commit.

## 15/07 — 4 nhánh merge trước Sprint 3 (nhánh tích hợp `feat/present-layout-ml-p1`)
- **`feat/render-nodes-v2`**: 7 node chặng Render (`lib/nodes/defs/render-v2.ts`) — text2image, ID-mask, furniture-extract, cad2fbx (import FBX), local-edit, camera, nền cad-to-obj. Kiến trúc 2 tầng Cloud AI (khi có key) / lõi tất định (khi không), mọi node ghi `_tier` + badge UI. Adapter NVIDIA `generateImage()` dùng model `black-forest-labs/flux.1-dev` (SD3/SDXL trả 404 cho account free) + route `/api/render/nvidia-image`. Probe fal (`scripts/probe-fal.ts`) — fal hết balance. Blender OBJ→FBX (`scripts/blender/obj2fbx.py` + route `/api/render/fbx`, verify Blender 4.5 local OK; máy không có Blender → 501 kèm hướng dẫn). 110 test mới. Verify độc lập: tsc 0, 25/25 test file, smoke browser 127.0.0.1:3700 OK.
- **`feat/ai-local-ollama`**: tầng AI local Ollama chữ (mô tả/concept/tóm tắt, KHÔNG ảnh) — `lib/ai/providers/ollama.ts` + `lib/ai/text-tier.ts` (completeTextTiered Cloud→Ollama→lõi, kèm `_tier`/`_model`). Model mặc định llama3, override `OLLAMA_MODEL`. 36 test mới, ff merge, tsc 0.
- **`feat/render-ux-overhaul`**: đại tu UX canvas chặng Render — màu edge theo loại data (image/data/mask), node grouping (Cmd+G, collapse/rename/ungroup, undo), 35+ icon SVG flat inline, font mono cho label node. 543 test pass, tsc 0.
- **`feat/deploy-vercel-supabase`**: audit deploy readiness — `next build` PASS (31 static + 24 API route), liệt kê toàn bộ env var cần cho Vercel, xác nhận migration drift IntegrationAccount dùng `db push` an toàn, phát hiện `AUTH_SECRET` có fallback `dev-secret-change-me` cần set env thật. Output `DEPLOY-CHECKLIST.md`.
- **`feat/sprint3-qa-stress`**: fix P1 auth bypass (email nhiều `@` bypass domain check, `lib/server/auth-policy.ts:17`) + `stress-auth.test.ts` 42 test. ⚠️ 4 file stress test khác (CAD/render/present/concurrency, ~128 test) agent từng báo tạo nhưng KHÔNG được commit trước khi worktree xoá — mất, không khôi phục được. Bài học: agent phải `git log -1` xác nhận đã commit trước khi báo done.


## 14/07 — Cổng Sprint 2 PASS (nhánh tích hợp `feat/present-layout-ml-p1`, HEAD `bcbbce1`)
Merge `da49cf3` (ml-ui) → `b70ffa3` (ui-motion) → `bcbbce1` (docs). **492 test/20 file, tsc 0.**
Verify browser (PORT 3700, host 127.0.0.1 tránh cookie phiên thật; admin seed `integrator@ttt.vn`): 7 PASS · 1 SKIP.
1. Login Liquid Glass PASS (backdrop saturate(1.8) blur(40px); 4 preset nền Đêm ấm/Mực đêm/Đá ấm/Lụa sáng + upload; Ghi nhớ; không intro; light+dark).
2. Login → Gallery PASS (register vẫn khoá; seed-admin idempotent).
3. Unified Dock PASS (`.if-dock` kính mờ đồng nhất Header+StudioBar; StageEnter/Veil mượt; 0 lỗi console).
4. /cad-editor PASS (detect "residential (59%) — 1 giường"; checker bắt Bếp 5.7m² < 10m² TCVN 4451:2012 cả với bộ residential).
5. /present-editor PASS (LayoutShelf 21 card + Nhận/Bỏ + tooltip; guardrail toast; Export menu đủ PDF·PPTX·PNG).
6. Nút "Đưa sang Present →" SKIP (cần flow AI render thật tốn credit; code 11/11 test + verify trước đó).
7. FoldableDualPane PASS (`?dualpane=1` ≥840px dual, thu 700px về single giữ state; sheet-persist IDB log 13.6KB).
8. Console PASS (chỉ hydration ⌘Z cũ).

### Sprint 2 chi tiết (3 nhánh, 2 đợt — đợt 1 ngắt session-limit, resume theo danh sách user xác nhận)
- `feat/journey2` (Agent 5): register 403 kể cả DB trống (`scripts/seed-admin.ts` thay bootstrap) · grandfather Google 3 ca (auth-policy 9 test) · **multi-sheet persistence IndexedDB** `userId::route` (lib/sheets-persist.ts, autosave 1.2s, resume.sheetId; đo 15.2KB CAD · 226.5KB deck+ảnh-nhúng) · gallery: upload bìa, member icon owner, >8 flow → grid+search.
- `feat/ml-ui` (Agent 1): perceptron feedback UI tại LayoutShelf (lib/gu/feature-dict.ts + Nhận/Bỏ + re-rank ≥10 cặp + tooltip; verify dark-cover 3→1 sau 10 cặp, sống qua reload) · nút "Đưa sang Present →" (NodeExtras → stashPresentHandoff → toast) · lib/cad/gu-features.ts (occupancy 8×8, adjacency, typology 5 nhãn — additive vào classifyOperator) · ROOM_TERMS/subject vào gu.ts.
- `feat/ui-motion` (Agent 2, bị user dừng ở bước verify → integrator verify hộ): Liquid Glass + LoginBackdrop + StageTransition (wallpaper/veil) + Unified Dock + FoldableDualPane.
- ⚠️ Sự cố 13/07 (ĐÃ SỬA): agent verify ghi đè graph flow "Render test" trên dev.db → restore từ FlowVersion snapshot 11/07, bản-bị-đè giữ version 4. Bài học: browser pane + cookie localhost dùng chung → verify TUẦN TỰ.

## 13/07 — Cổng Sprint 1 PASS (`bb31fbf`, 413 test/17 file)
- `feat/ml-p1-hooks` (Agent 1): hết dead-code ML pha 1 (21 caller) — operator vào LayoutSpec + panel Kiểm chuẩn explainable · gu.ts mergePalette→LAB + moods + prompt · detectRegions trả gutter → suggestTemplate · bridge Render→Present (lib/present-editor/handoff.ts) · lib/gu/pairwise-perceptron.ts (18 test, degrade <10 cặp).
- `feat/access-journey` (Agent 5): gỡ intro (Login→Gallery) · Remember-Me (cookie phiên vs 30d) · chính sách @ttt.vn + khoá register · resume theo user (lib/resume.ts) · SmartTour 4 bước.
- Browser E2E nhánh gộp: LoginScreen mới + operator detect sống; 0 lỗi console mới.

## 12/07 — Nền tảng (trước Sprint mode)
- **Present layout engine** (5 module, khởi từ snippet detectRegions của user): detect-regions (sửa bug findGaps bỏ khe cuối) · standards.ts DECK_STANDARDS (chuẩn định lượng từ agent nghiên cứu Gamma/Canva/Figma) · layout-check (guardrail trống/chật/tràn, toast cắm PresentEditor) · region-layout (lưới→slide gán vai trò, kẹp budget) · reference-layout (ảnh mẫu→deck, augment).
- **ML Gu pha 1 tất định** (3 module): operator-profile (block×room×text) · color-psychology (LAB+ΔE+tâm-lý-màu) · grid-geometry (gutterBands+patternIconHint). Đề xuất đầy đủ: docs/ML-GU-ENGINE-PROPOSAL.md.
- **3 nhánh nghiên cứu**: autolayout-refine (kẹp 21 ô + min-max) · PCCC/Neufert (QCVN 06:2022/SĐ1:2023 + NFPA/IBC + neufert.ts, standards-intl 22 test) · multi-sheet (≤5 sheet CAD+Present + LOGIC-AUDIT.md).
- **Sprint 0**: audit fixes A1 (pill Present) B1 (handoff mất node) C1 (stageDone theo user) merged `d9070d2`.
- **DIAGNOSIS.md**: khám toàn repo (10 route 200; xuất PDF/PPTX/PNG/DXF thật; mock khi thiếu key; drift IntegrationAccount).
- Sự cố flow "Render test" + khôi phục: xem mục 14/07.

## Trước 12/07
Xem git log (`fd4718d` fix hatch T-junction · `c9b3961` type-anywhere · các merge trước đó) — main/origin đứng ở `3265db1`.
