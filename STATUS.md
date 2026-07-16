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
- **1 worktree đang sống** (1/3 slot): `interiorflow-wt-text-toolbar-ux` nhánh `fix/text-toolbar-clip-and-deselect` (local `cf6ece0`) — CHỜ user duyệt merge vào `feat/present-layout-ml-p1`. Xoá worktree sau khi merge.
- **Nội dung (2 commit)**: (1) `ee98e25` TextToolbar clip khi sát mép slide (overlay riêng ngoài `overflow:hidden`) + click-ra-ngoài tự bỏ chọn (global pointerdown passive) + kính mờ tối (blur 28px, nền đen alpha .62). (2) `cf6ece0` — **panel trái/phải (Mẫu·Reference·Motion / Lớp) giờ resize (splitter kéo-thả, nhớ localStorage) + ẩn/hiện được** (tham khảo Photoshop collapse-to-icons/Canva) + **zoom in/out canvas** (nút +/-, %, Ctrl/Cmd+lăn chuột, Ctrl/Cmd+0 reset Fit — chuẩn Figma/Photoshop) + chấm màu chọn chữ hết bị cắt mép phải (clamp theo viewport browser thật qua `getBoundingClientRect`+`ResizeObserver`, phản ứng đúng khi zoom đổi).
- **Verify**: tsc 0 lỗi, 30 file test PASS. Browser thật: zoom 100→120% mượt (screenshot xác nhận), ẩn panel trái → canvas giãn full (screenshot xác nhận). Chấm màu clamp: review code kỹ (logic đúng, cùng pattern đã test) nhưng CHƯA chụp ảnh trực quan riêng (thao tác chọn textbox qua tool bị lệch toạ độ) — cần verify thêm nếu muốn chắc 100% trước khi coi là xong hẳn.
- Agent làm việc panel/zoom bị NGẮT GIỮA CHỪNG do hết session limit (không phải agent quên) — 424 dòng thay đổi được phát hiện & commit thủ công sau khi kiểm tra kỹ (tsc+test+browser) thay vì mất.
- Friction UX khác phát hiện thêm lúc sửa: chưa thấy gì đáng kể ngoài các bug đã giao.
- **✅ 15/07 Sprint 3 B1+B2 xong** (41 shape nội thất + drag-drop/snap/collision/variant, schema chung `lib/cad/shared-types.ts`, 634 test PASS) + **merge thêm 4 nhánh** (render-nodes-v2 7 node · ai-local-ollama · render-ux-overhaul · deploy-vercel-supabase) — chi tiết đầy đủ + bài học quy trình (agent quên commit, số test sai) → CHANGELOG.md.
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
