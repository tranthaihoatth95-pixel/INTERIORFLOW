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
- **1 worktree đang sống** (1/3 slot): `interiorflow-wt-sprint10` nhánh `feat/sprint10-precision-geometry-snap` — đang chạy (nhập toạ độ chính xác + Polygon + Spline/Xline/Ellipse/Donut/Divide). **Sprint 9 (thiết kế toggle Sketch↔Pro) CHƯA làm** — nhảy thẳng sang Sprint 10 theo yêu cầu user, quay lại Sprint 9 sau nếu cần trước khi Pro mode thật sự cần toggle UI.
- **✅ 15/07 Sprint 3 B1+B2** (41 shape nội thất, schema chung `lib/cad/shared-types.ts`) + merge 4 nhánh cũ (render-nodes-v2 · ai-local-ollama · render-ux-overhaul · deploy-vercel-supabase) — chi tiết → CHANGELOG.md.
- File rác `Bản sao Không có tiêu đề.rtfd/` ở repo chính — CHỜ user duyệt xoá.
- **NVIDIA_API_KEY đã có**, probe HTTP 200. **fal**: hết balance, chờ nạp credit.
- CHƯA làm (backlog cũ): bỏ hardcode 'DETECH · CONCEPT' · template tĩnh thư viện · heavy-ML pha 2 · membership per-flow.
- **✅ 16-17/07 verify Render/Present + text-toolbar-ux + Sprint 4 + Sprint 5** — chi tiết → CHANGELOG.md.
- **✅ 17/07 Sprint 6 — MEP sơ cấp** (nhóm E: 0%→phần lớn): đèn+ổ cắm (`mep.ts`, `mep-suggest.ts`, chỉ đề xuất), rule TCVN 9206:2012 thật nối checker. Hộp gen (D2.3-5) BỎ QUA — không có quy ước DXF thật.
- **✅ 17/07 Sprint 7 — Export nâng cao**: CAD PDF vector (`pdf.ts`, jsPDF không có OCG nên layer không ẩn/hiện lại — đã ghi rõ). `.idf` save/load (`idf.ts`, JSON versioned, round-trip verify khớp). Markup overlay + Photo embed (`Doc.markups`/`Doc.photos`, riêng khỏi Entity hình học). Share link/PWA đã có sẵn — không làm lại.
- **✅ 18/07 Sprint 8 — Template/Title block/Fix suggestion**: Layer manager xác nhận ĐÃ CÓ SẴN — không làm lại. Title block UI (`titleBlock()` có sẵn, chỉ thêm form) + 2 template mới (Văn phòng, Khách sạn — `templates.ts`, cùng pattern `demo-plan.ts`) + Fix suggestion thật (`fix-suggest.ts`, gợi ý mm cụ thể cho vi phạm diện tích/hành lang, chỉ hiện text KHÔNG tự sửa — verify số khớp chính xác test). 38 file test PASS, tsc 0 lỗi.

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
