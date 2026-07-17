# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp **`feat/present-layout-ml-p1`** — local `e22ae9e`, **CHƯA push, CHƯA merge main** (main/origin vẫn `3265db1`). 0 worktree sống.
- **`~/Downloads/dwg2dxf`** — CLI cá nhân riêng (repo/giấy phép riêng, GPL-3.0), convert `.dwg`→`.dxf` LOCAL (`node cli.js ban-ve.dwg`), không server/không tốn phí. App KHÔNG còn nút "Mở DWG" — dùng "Mở DXF" sau khi convert. Xem README ở đó.
- **✅ 15/07 merge `feat/devops-docs`**: bộ cài .dmg (`dist/InteriorFlow-0.1.0-arm64.dmg`, unsigned) + docs build Win/deploy Vercel (chi tiết CHANGELOG).
- **✅ Cổng Sprint 2 PASS (14/07)**: 492 test/20 file · tsc 0 (chi tiết CHANGELOG).
- Test pattern: `node_modules/.bin/sucrase-node <path>.test.ts` (nay 29 file, xem Sprint 3 bên dưới).

## Quyết định user đã khoá
- **Auth**: chỉ Google OAuth @ttt.vn (mới) + admin cấp tay (`scripts/seed-admin.ts`); user cũ ngoài-domain grandfather; register công khai 403; quên mật khẩu = admin reset.
- Perceptron THẬT (learning-to-rank, degrade heuristic) · foldable Find N6 test on-device · installer cả 3 unsigned (.exe cần máy Win) · PWA host Vercel + Supabase (Agent 4 tự dựng, Sprint 4).

## ĐIỂM RESUME (phiên mới đọc mục này TRƯỚC)
- **✅ 18/07 DWG: 3 kiến trúc thử, dừng ở CLI local** (`e22ae9e`): (1) Worker cô lập trong repo → (2) tách network service riêng (`dwg-parse-service`, user lo tốn phí hạ tầng khi deploy thật) → (3) **CLI cá nhân `dwg2dxf`** (chọn cuối, KHÔNG server, sạch GPL nhất vì là "sử dụng cá nhân" không phải "phân phối"). App giờ KHÔNG có nút "Mở DWG" — `package.json`/`node_modules` InteriorFlow sạch dependency GPL hoàn toàn (đã `npm install` xác nhận). `dwg2dxf/cli.js` require trực tiếp `lib/cad/dwg.ts`+`dxf.ts` của InteriorFlow (qua sucrase) để đảm bảo DXF xuất ra luôn khớp app đọc lại — verify round-trip file .dwg thật (305KB): 421 entity/21 layer khớp chính xác qua `parseDxf`. `docs/LICENSE-NOTES.md` viết lại lần 3 — checklist luật sư review CHƯA làm nếu sau này muốn đưa "Mở DWG" trở lại app cho khách hàng.
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
