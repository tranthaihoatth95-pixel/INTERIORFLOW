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
- **✅ 16-17/07 verify UI Render/Present + merge text-toolbar-ux, Sprint 4, Sprint 5** — chi tiết đầy đủ → CHANGELOG.md. Tóm tắt: Render 6 node badge `_tier` đúng (GroupOverlay vô hình, xem Nợ kỹ thuật); Present zoom+panel resize/collapse (Photoshop/Canva); Sprint 4 copy-paste + auto-label phòng; Sprint 5 material palette (CSS swatch, 13 preset) + Circle 3-điểm + Arc tâm+góc.
- **✅ 17/07 merge Sprint 6 — MEP sơ cấp** (nhóm E: 0%→phần lớn xong): **D1.3/D2.2 shape** (`lib/cad/mep.ts` — 5 BlockDef đèn+ổ cắm, nhóm mới `'Điện'`). **D1.1-D1.5, D2.1, D2.6 suggest** (`mep-suggest.ts`, thuần đề xuất — user bấm Apply mới chèn): lux→số đèn (dùng số liệu `vn-lighting.ts` có sẵn), rải đèn đều, vị trí công tắc/ổ cắm, nhóm mạch, AC cách đầu giường. **D2.2 rule TCVN 9206:2012 thật** (`vn-electrical.ts`, 2-4 ổ cắm/phòng, nối đo thật vào checker). **D2.3-D2.5 (hộp gen) BỎ QUA** — không có quy ước DXF thật, tránh bịa logic an toàn thi công. Verify browser thật: đặt đèn/ổ cắm qua Apply, Kiểm chuẩn ra đúng 3 cảnh báo mật độ ổ cắm. 34 file test PASS, tsc 0 lỗi.

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
