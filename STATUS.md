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
- **0 worktree đang sống** (0/3 slot) — nhánh text-toolbar-ux vừa merge xong, đã dọn.
- **✅ 15/07 Sprint 3 B1+B2 xong** (41 shape nội thất + drag-drop/snap/collision/variant, schema chung `lib/cad/shared-types.ts`, 634 test PASS) + **merge thêm 4 nhánh** (render-nodes-v2 7 node · ai-local-ollama · render-ux-overhaul · deploy-vercel-supabase) — chi tiết + bài học quy trình (agent quên commit, số test sai) → CHANGELOG.md.
- File rác `Bản sao Không có tiêu đề.rtfd/` ở repo chính — CHỜ user duyệt xoá.
- **NVIDIA_API_KEY đã có**, probe HTTP 200. **fal**: hết balance, chờ nạp credit.
- CHƯA làm (backlog cũ): bỏ hardcode 'DETECH · CONCEPT' · template tĩnh thư viện · heavy-ML pha 2 · membership per-flow.
- **✅ 16/07 verify UI chặng Render xong** (tài khoản test `integrator@ttt.vn`): 6 node render-v2 đúng tên, chạy thật "Tạo ảnh"+"Góc máy ảnh" → badge `_tier` đúng màu. Cmd+G group: store đúng nhưng overlay KHÔNG hiện — xem Nợ kỹ thuật.
- **Kiểm tra "1/5" ở Present**: KHÔNG phải bug — số **sheet đang dùng / MAX_SHEETS=5**, không liên quan số slide. Audit trước hiểu nhầm, không cần sửa.
- **✅ 17/07 merge `fix/text-toolbar-clip-and-deselect`**: TextToolbar hết bị cắt (mép trên/dưới/phải, kể cả khi zoom), click-ra-ngoài tự bỏ chọn, kính mờ tối. **Panel trái/phải giờ resize (splitter+localStorage) + ẩn/hiện được** (tham khảo Photoshop/Canva) + **zoom in/out canvas** (nút, Ctrl/Cmd+lăn chuột, Ctrl/Cmd+0 Fit). Verify browser thật: zoom + panel collapse xác nhận qua screenshot; riêng chấm màu clamp mới review code kỹ (chưa chụp ảnh riêng) — theo dõi nếu tái diễn.
- **✅ 17/07 merge Sprint 4** (`lib/cad/`): Ctrl+C/Ctrl+V copy-paste nội bộ (khác tool Copy kiểu AutoCAD đã có) — `pasteEntities`/`clipboard` state, verify thật (117→118 entity, offset +20/+20). **Auto-label phòng thật** (`room-autolabel.ts`) — đề xuất tên phòng từ đồ nội thất bên trong khi CHƯA có nhãn (chỉ đề xuất, user bấm Apply mới chèn), badge Total GFA + đếm phòng theo loại ở status bar. Agent tự tìm+sửa 1 bug thật (nhãn "HÀNH LANG" giả từ khe hẹp quanh khung cửa — loại nhóm `Kiến trúc` khỏi pick-point). Multi-select/Move/Rotate/Mirror **đã có sẵn từ trước** — không làm lại. 32 file test PASS, tsc 0 lỗi.

## Nợ kỹ thuật
- Hydration ⌘Z/Ctrl+Z tooltip (lib/kbd.ts:11 + CadToolbar) — cosmetic.
- `window.prompt` crash trong webview nhúng — Dashboard.tsx:138, browser thật OK.
- Migration Prisma drift (IntegrationAccount) — dùng `db push`, KHÔNG reset.
- 4 file stress test bị mất (xem ĐIỂM RESUME) — cần viết lại nếu muốn coverage edge-case CAD/render/present/concurrency.
- Sprint 3 B1: `meta` (giá/vendor/sku) để trống toàn bộ — chưa có dữ liệu giá thật.
- **BUG 16/07 — GroupOverlay vô hình** (Render canvas Cmd+G): `GroupOverlay.tsx` thiếu `ViewportPortal` + `zIndex:-1` sai → group tạo đúng trong store nhưng UI không hiện. Chi tiết kỹ thuật → CHANGELOG.md. CHƯA sửa — chờ duyệt phạm vi.

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser**: cookie localhost dùng chung → verify TUẦN TỰ; dùng host 127.0.0.1 + account test riêng; KHÔNG logout, KHÔNG loadDemoFlow đè flow thật.
4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
