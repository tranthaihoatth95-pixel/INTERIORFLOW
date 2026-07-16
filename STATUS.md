# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp **`feat/present-layout-ml-p1`** — local, **CHƯA push, CHƯA merge main** (main/origin vẫn `3265db1`).
- **✅ 15/07 merge `feat/devops-docs`**: bộ cài .dmg (`dist/InteriorFlow-0.1.0-arm64.dmg`, unsigned) + docs build Win/deploy Vercel (chi tiết CHANGELOG).
- **✅ Cổng Sprint 2 PASS (14/07)**: 492 test/20 file · tsc 0 (chi tiết CHANGELOG).
- Test pattern: `node_modules/.bin/sucrase-node <path>.test.ts` (nay 29 file, xem Sprint 3 bên dưới).

## Quyết định user đã khoá
- **Auth**: chỉ Google OAuth @ttt.vn (mới) + admin cấp tay (`scripts/seed-admin.ts`); user cũ ngoài-domain grandfather; register công khai 403; quên mật khẩu = admin reset.
- Perceptron THẬT (learning-to-rank, degrade heuristic) · foldable Find N6 test on-device · installer cả 3 unsigned (.exe cần máy Win) · PWA host Vercel + Supabase (Agent 4 tự dựng, Sprint 4).

## ĐIỂM RESUME (phiên mới đọc mục này TRƯỚC)
- **0 worktree đang sống** (0/3 slot) — Sprint 3 B1+B2 vừa merge xong, tất cả đã dọn.
- **✅ 15/07 Sprint 3 B1+B2 — Shape Library + tương tác** (41 shape, drag-drop/snap/resize/collision/clearance, schema chung `lib/cad/shared-types.ts`; 634 test PASS, tsc 0 lỗi). Chi tiết + bài học quy trình (agent quên commit) → CHANGELOG.md.
- **✅ 15/07 merge thêm 4 nhánh** (render-nodes-v2 7 node · ai-local-ollama · render-ux-overhaul · deploy-vercel-supabase) — chi tiết CHANGELOG.md.
- File rác `Bản sao Không có tiêu đề.rtfd/` ở repo chính — CHỜ user duyệt xoá.
- **NVIDIA_API_KEY đã có**, probe HTTP 200. **fal**: hết balance, chờ nạp credit.
- CHƯA làm (backlog cũ): bỏ hardcode 'DETECH · CONCEPT' · template tĩnh thư viện · heavy-ML pha 2 · membership per-flow.
- **✅ 16/07 verify UI chặng Render xong** (đăng nhập `integrator@ttt.vn`, flow mới, port 3940, KHÔNG đụng flow thật): 6 node render-v2 (text2image/ID-mask/furniture-extract/cad2fbx/local-edit/camera) hiện đúng tên trong Node Library. Chạy thật node "Tạo ảnh" (AI, NVIDIA NIM flux.1-dev) + "Góc máy ảnh" (tất định) → badge `_tier` đúng màu (tím AI / lục tất định). Cmd+G group: store tạo group đúng (`groupSelected` trong `lib/store.ts:831`) nhưng **overlay KHÔNG hiện** — xem bug bên dưới.
- **Kiểm tra "1/5" ở Present**: KHÔNG phải bug — đó là số **sheet đang dùng / MAX_SHEETS=5** (`components/studio/SheetTabBar.tsx:212`, `PresentSheets.tsx:38`), không liên quan số slide trong 1 sheet. Verify UI: bấm "Thêm trang trình bày" → counter lên đúng "2/5". Audit trước hiểu nhầm, không cần sửa.

## Nợ kỹ thuật
- Hydration ⌘Z/Ctrl+Z tooltip (lib/kbd.ts:11 + CadToolbar) — cosmetic.
- `window.prompt` crash trong webview nhúng — Dashboard.tsx:138, browser thật OK.
- Migration Prisma drift (IntegrationAccount) — dùng `db push`, KHÔNG reset.
- 4 file stress test bị mất (xem ĐIỂM RESUME) — cần viết lại nếu muốn coverage edge-case CAD/render/present/concurrency.
- Sprint 3 B1: `meta` (giá/vendor/sku) để trống toàn bộ — chưa có dữ liệu giá thật.
- **BUG mới 16/07 — GroupOverlay vô hình** (`components/nodes/GroupOverlay.tsx` + `FlowCanvas.tsx:305`): `<GroupOverlay />` render là sibling của `<ReactFlow>` (không bọc `ViewportPortal`), dùng thẳng `node.position` (toạ độ flow-space) làm CSS `left/top` — KHÔNG cộng transform pan/zoom hiện tại của viewport, nên khung/label/nút collapse-rename-ungroup lệch vị trí thật. Thêm nữa `zIndex: -1` khiến nó luôn nằm SAU nền canvas (wrapper cha có `position: relative` → tạo stacking context riêng) → hoàn toàn không thấy được dù DOM vẫn có element + state group vẫn tạo đúng (confirm qua `window.__flowStore`). Cần: bọc bằng `ViewportPortal` (hoặc tự áp transform từ `useViewport()`) + bỏ `zIndex:-1`. CHƯA sửa — chờ user duyệt phạm vi.

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser**: cookie localhost dùng chung → verify TUẦN TỰ; dùng host 127.0.0.1 + account test riêng; KHÔNG logout, KHÔNG loadDemoFlow đè flow thật.
4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
