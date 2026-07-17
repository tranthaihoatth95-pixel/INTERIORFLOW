# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp **`feat/present-layout-ml-p1`** — local `5a51f98`, **CHƯA push, CHƯA merge main** (main/origin vẫn `3265db1`). 0 worktree sống.
- **App có nút "Mở DWG" trực tiếp** (Web Worker cô lập, GPL isolated) — hoạt động ngay, không cần server/CLI gì thêm. `~/Downloads/dwg2dxf` (CLI local riêng) VẪN GIỮ làm phương án dự phòng offline/bản vẽ nhạy cảm — không bắt buộc dùng hằng ngày.
- **✅ 15/07 merge `feat/devops-docs`**: bộ cài .dmg (`dist/InteriorFlow-0.1.0-arm64.dmg`, unsigned) + docs build Win/deploy Vercel (chi tiết CHANGELOG).
- **✅ Cổng Sprint 2 PASS (14/07)**: 492 test/20 file · tsc 0 (chi tiết CHANGELOG).
- Test pattern: `node_modules/.bin/sucrase-node <path>.test.ts` (nay 29 file, xem Sprint 3 bên dưới).

## Quyết định user đã khoá
- **Auth**: chỉ Google OAuth @ttt.vn (mới) + admin cấp tay (`scripts/seed-admin.ts`); user cũ ngoài-domain grandfather; register công khai 403; quên mật khẩu = admin reset.
- Perceptron THẬT (learning-to-rank, degrade heuristic) · foldable Find N6 test on-device · installer cả 3 unsigned (.exe cần máy Win) · PWA host Vercel + Supabase (Agent 4 tự dựng, Sprint 4).

## ĐIỂM RESUME (phiên mới đọc mục này TRƯỚC)
- **✅ 18/07 DWG — 4 kiến trúc thử, CHỐT lại nút "Mở DWG" trong app** (`5a51f98`): (1) Worker cô lập → (2) network service riêng (lo phí hạ tầng) → (3) CLI cá nhân `dwg2dxf` (lo bất tiện convert tay mỗi file) → **quay lại (1)**. Lý do đảo ngược: **InteriorFlow là TOOL NỘI BỘ TTT Architects** (auth khoá @ttt.vn, register 403, KHÔNG phân phối ra ngoài) — rủi ro "phân phối" GPL không áp dụng như 1 SaaS bán ra thị trường; 2 lần đổi kiến trúc trước đã áp nhầm góc nhìn đó. `lib/cad/dwg-worker.ts` (Worker DUY NHẤT import GPL) khôi phục nguyên trạng từ git history, verify tsc+40 test PASS + browser không lỗi console mới. `dwg2dxf` VẪN GIỮ làm phương án offline/nhạy cảm (không xoá) — `docs/LICENSE-NOTES.md` viết lại lần 4, ghi rõ: nếu SAU NÀY định bán/phân phối InteriorFlow ra ngoài công ty thì phải review pháp lý lại từ đầu.
- **✅ 18/07 Sprint 9 — toggle Sketch↔Pro** (Phương án A, mặc định Sketch): `useCadStore.cadMode`+`PRO_ONLY_TOOLS` ẩn ~30 công cụ CAD chính xác ở Sketch. Tự sửa 1 bug: toolbar Pro tràn viewport đẩy ModeSwitch ra mép → **giải quyết luôn nợ kỹ thuật "toolbar tràn màn hẹp"**.
- **✅ 18/07 Sprint 10 — Pro mode P1+P2**: nhập toạ độ chính xác + Polygon/Ellipse/Donut/Spline/Xline/Divide (chi tiết → CHANGELOG).
- File rác `Bản sao Không có tiêu đề.rtfd/` ở repo chính — CHỜ user duyệt xoá.
- **NVIDIA_API_KEY đã có**, probe HTTP 200. **fal**: hết balance, chờ nạp credit.
- CHƯA làm (backlog cũ): bỏ hardcode 'DETECH · CONCEPT' · template tĩnh thư viện · heavy-ML pha 2 · membership per-flow.
- Sprint 3/6-8 (41 shape nội thất · MEP · Export PDF/.idf/markup · Template Office/Hotel) đã xong — chi tiết → CHANGELOG.md.

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
