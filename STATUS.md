# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp **`feat/present-layout-ml-p1`** HEAD **`bcbbce1`** — local, **CHƯA push, CHƯA merge main** (main/origin vẫn `3265db1`).
- **✅ Cổng Sprint 2 PASS (14/07)**: 492 test/20 file · tsc 0 · verify browser 7 PASS + 1 SKIP (chi tiết CHANGELOG). Sprint 0→2 của Master Directive xong: audit fixes, ML hooks sống + perceptron, access/journey (login @ttt.vn + Remember-Me + resume + tour), Liquid Glass + Dock + dual-pane, sheet-persistence IDB, gallery grid.
- Chỉ còn **1 worktree = repo chính**. Test pattern: `node_modules/.bin/sucrase-node <path>.test.ts` (20 file).

## Quyết định user đã khoá
- **Auth**: chỉ Google OAuth @ttt.vn (mới) + admin cấp tay (`scripts/seed-admin.ts`); user cũ ngoài-domain grandfather; register công khai 403; quên mật khẩu = admin reset.
- Perceptron THẬT (learning-to-rank, degrade heuristic) · foldable Find N6 test on-device · installer cả 3 unsigned (.exe cần máy Win) · PWA host Vercel + Supabase (Agent 4 tự dựng, Sprint 4).

## Việc treo — chờ GO / đang chờ phóng agent
1. **Bộ cài + hướng dẫn** (.dmg tại Mac, config .exe, PWA/Vercel+Supabase, HƯỚNG DẪN.md).
2. **Sprint 3 QA stress** (tainted/overfill/offline, explainable đúng) + **Sprint 4 docs** (FINAL_ARCHITECTURE_REPORT + TECHNICAL_GLOSSARY).
3. Dọn 2 file untracked: `lib/cad/commands (1).ts` + `prisma/test-journey2.db` (chờ user duyệt).
4. CHƯA làm: bỏ hardcode 'DETECH · CONCEPT' · template tĩnh thư viện · heavy-ML pha 2 (embedding/detector — báo rủi ro trước) · membership per-flow (cần schema, chờ duyệt).

## Nợ kỹ thuật
- Hydration ⌘Z/Ctrl+Z tooltip (lib/kbd.ts:11 + CadToolbar) — cosmetic.
- `window.prompt` crash trong webview nhúng — Dashboard.tsx:138 (nút Dự án mới), browser thật OK.
- Migration Prisma drift (IntegrationAccount) — dùng `db push`, KHÔNG reset; schema change phải chờ duyệt.

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser**: cookie localhost dùng chung → verify TUẦN TỰ; dùng host 127.0.0.1 + account test riêng; KHÔNG logout, KHÔNG loadDemoFlow đè flow thật.
4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
