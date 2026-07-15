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
- **✅ 15/07 Sprint 3 B1+B2 — Shape Library + tương tác** (3 agent song song A/B/C theo `SHAPE-SCHEMA.md`, merge tuần tự A→B→C vào `feat/present-layout-ml-p1`, verify tsc+test sau mỗi merge, PASS cả 3):
  - **B1 (41→ shape, từ 18 gốc)**: `lib/cad/furniture.ts` — phòng ngủ (tủ đầu giường, bàn trang điểm), phòng khách (sofa góc, bàn trà, kệ TV), bếp (tủ lạnh, đảo bếp, hút mùi, lò vi sóng), tắm (vòi sen, gương), văn phòng (ghế, tủ hồ sơ, kệ sách), 3 loại cửa mới + 2 loại cửa sổ, cầu thang thẳng/chữ L (nhóm mới `Cầu thang`), máy lạnh/quạt trần (nhóm mới `Thiết bị`). Cầu thang xoắn BỎ QUA (Prim không vẽ được đường xoắn thật).
  - **B2 (8/8 xong)**: drag-drop từ palette, auto-snap tường, resize góc, info panel, variant switch, collision (SAT), clearance overlay, search — file mới `lib/cad/shape-interactions.ts`, `components/ShapePalette.tsx`.
  - **Schema chung**: `lib/cad/shared-types.ts` — tách 5 type (`BlockGroup/ShapeVariant/SnapAnchor/ClearanceZone/ShapeMeta`) ra khỏi `furniture.ts` sau khi 3 agent song song tự trùng định nghĩa gây conflict merge 2 lần liên tiếp. **Quy tắc mới cho lần chia agent sau**: tách schema chung + commit trước, agent chỉ import từ file chung, không tự định nghĩa lại.
  - **Test**: 634 test (toàn bộ 29 file `*.test.ts` chạy qua `sucrase-node`) PASS 0 fail, tsc 0 lỗi.
  - ⚠️ **Bài học quy trình**: 2/3 agent (Agent C ở đây, và trước đó agent merge QA-stress) đã LÀM XONG việc nhưng QUÊN COMMIT trước khi báo done — chỉ phát hiện lúc merge thấy branch không đổi HEAD. Từ nay: agent phải tự xác nhận `git log -1` sau khi code xong, trước khi báo cáo.
- **⚠️ Phát hiện khi verify Sprint 3**: dòng "170 test mới" ghi trước đây cho `feat/sprint3-qa-stress` là SAI — thực tế merge chỉ có 42 test (`stress-auth.test.ts`), 4 file stress test khác đã mất do agent quên commit (chi tiết CHANGELOG.md).
- **✅ 15/07 merge thêm 4 nhánh** (render-nodes-v2 7 node · ai-local-ollama · render-ux-overhaul · deploy-vercel-supabase) — chi tiết CHANGELOG.md.
- File rác `Bản sao Không có tiêu đề.rtfd/` ở repo chính — CHỜ user duyệt xoá.
- **NVIDIA_API_KEY đã có**, probe HTTP 200. **fal**: hết balance, chờ nạp credit.
- CHƯA làm (backlog cũ): bỏ hardcode 'DETECH · CONCEPT' · template tĩnh thư viện · heavy-ML pha 2 · membership per-flow.

## Nợ kỹ thuật
- Hydration ⌘Z/Ctrl+Z tooltip (lib/kbd.ts:11 + CadToolbar) — cosmetic.
- `window.prompt` crash trong webview nhúng — Dashboard.tsx:138, browser thật OK.
- Migration Prisma drift (IntegrationAccount) — dùng `db push`, KHÔNG reset.
- 4 file stress test bị mất (xem ĐIỂM RESUME) — cần viết lại nếu muốn coverage edge-case CAD/render/present/concurrency.
- Sprint 3 B1: `meta` (giá/vendor/sku) để trống toàn bộ — chưa có dữ liệu giá thật.

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser**: cookie localhost dùng chung → verify TUẦN TỰ; dùng host 127.0.0.1 + account test riêng; KHÔNG logout, KHÔNG loadDemoFlow đè flow thật.
4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
