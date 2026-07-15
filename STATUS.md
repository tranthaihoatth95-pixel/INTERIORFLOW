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

## ĐIỂM RESUME (phiên đóng 15/07 — phiên mới đọc mục này TRƯỚC)
- **2 worktree đang sống** (2/3 slot):
  · `interiorflow-wt-devops-docs` [`feat/devops-docs` `a777979`] — Agent-A GẦN XONG: **.dmg 321MB đã build** (`dist/InteriorFlow-0.1.0-arm64.dmg`) + BUILD-WINDOWS.md + DEPLOY-VERCEL.md + vercel.json + HUONG-DAN-SU-DUNG.md + FINAL_ARCHITECTURE_REPORT.md + TECHNICAL_GLOSSARY.md + đã dọn 2 file untracked. **Còn thiếu: verify cuối (tsc + đọc lướt docs) → merge.**
  · `interiorflow-wt-render-nodes-v2` [`feat/render-nodes-v2` `bd2e456`] — Agent-C mới xong NỀN: lib/three/ (cad-to-obj extrude + camera preset, **24/24 test, đã commit**). **Còn: 5/7 node (text2image · ID-mask · furniture-extract · import-FBX · chỉnh-cục-bộ) + adapter NVIDIA image-gen (nvidia.ts:84 TODO) + probe fal + Blender GLB/OBJ→FBX convert + node defs/UI. Kiến trúc 2 TẦNG bắt buộc: AI khi có key / LÕI tất định khi không — không mock-im-lặng.** Camera = phương án (a) user chốt.
- **User chưa dán NVIDIA_API_KEY** vào .env.local (thử lưu bị lạc thành file .rtfd). File rác `Bản sao Không có tiêu đề.rtfd/` ở repo chính — CHỜ user duyệt xoá.
- **Hàng đợi sau đó**: Agent-B đại tu UX canvas chặng 2 (màu dây nối, nhóm node, icon flat, chữ low-tech, review thao tác logic chặt) — chạy SAU khi render-nodes merge · Sprint 3 QA stress · deploy Vercel/Supabase thật (cần user đăng nhập).
- CHƯA làm (backlog cũ): bỏ hardcode 'DETECH · CONCEPT' · template tĩnh thư viện · heavy-ML pha 2 (báo rủi ro trước) · membership per-flow (cần schema, chờ duyệt).

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
