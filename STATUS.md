# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp **`feat/present-layout-ml-p1`** — local `1a9361b`, **CHƯA push, CHƯA merge main** (main/origin vẫn `3265db1`). 0 worktree sống.
- **`dwg-parse-service`** — repo RIÊNG cạnh `interiorflow/` (`~/Downloads/dwg-parse-service`, xem README ở đó): `npm start` (cổng 4500) để nút "Mở DWG" hoạt động; thiếu `DWG_SERVICE_URL` trong `.env.local` → lỗi rõ ràng, không chặn app.
- **✅ 15/07 merge `feat/devops-docs`**: bộ cài .dmg (`dist/InteriorFlow-0.1.0-arm64.dmg`, unsigned) + docs build Win/deploy Vercel (chi tiết CHANGELOG).
- **✅ Cổng Sprint 2 PASS (14/07)**: 492 test/20 file · tsc 0 (chi tiết CHANGELOG).
- Test pattern: `node_modules/.bin/sucrase-node <path>.test.ts` (nay 29 file, xem Sprint 3 bên dưới).

## Quyết định user đã khoá
- **Auth**: chỉ Google OAuth @ttt.vn (mới) + admin cấp tay (`scripts/seed-admin.ts`); user cũ ngoài-domain grandfather; register công khai 403; quên mật khẩu = admin reset.
- Perceptron THẬT (learning-to-rank, degrade heuristic) · foldable Find N6 test on-device · installer cả 3 unsigned (.exe cần máy Win) · PWA host Vercel + Supabase (Agent 4 tự dựng, Sprint 4).

## ĐIỂM RESUME (phiên mới đọc mục này TRƯỚC)
- **✅ 18/07 tách DWG service riêng** (`1a9361b`): user chọn phương án (b) trong LICENSE-NOTES sau khi hỏi lại rõ ý — gỡ HẲN dependency GPL `@mlightcad/libredwg-web` khỏi `package.json`/`node_modules` InteriorFlow (đã `npm install` lại, xác nhận sạch). Parse DWG giờ chạy trong `dwg-parse-service` (repo/giấy phép riêng, xem mục Hiện tại) — InteriorFlow gọi qua `app/api/cad/dwg-import` (route server, env `DWG_SERVICE_URL`) như network service arms-length. Verify end-to-end qua HTTP thật (305KB DWG, sandbox preview không hỗ trợ file-picker OS): khớp chính xác kết quả cũ (421/497 entity, 25 layer) + test đường lỗi (service tắt → 502 rõ ràng). `docs/LICENSE-NOTES.md` viết lại — checklist luật sư review kiến trúc mới CHƯA làm, đọc trước khi release khách hàng thật.
- **✅ 18/07 Sprint 9 — toggle Sketch↔Pro** (merge vào `feat/present-layout-ml-p1`): user duyệt mockup 2 phương án (Artifact tương tác) → chọn **Phương án A** (segmented switch cố định, mặc định Sketch). `useCadStore.cadMode` + `PRO_ONLY_TOOLS` — CadToolbar ẩn ~30 công cụ CAD chính xác ở Sketch, chỉ hiện 7 tool vẽ+edit cơ bản; nhớ lựa chọn qua localStorage. Tự tìm+sửa 1 bug thật: Pro mode làm toolbar rộng hơn viewport, pill canh giữa đẩy ModeSwitch ra ngoài mép trái → thêm maxWidth+overflowX:auto, **giải quyết luôn nợ kỹ thuật cũ "toolbar tràn màn hẹp"**. 49 test mới.
- **✅ 18/07 Sprint 10 — Pro mode P1+P2** (chi tiết → CHANGELOG): nhập toạ độ chính xác + Polygon/Ellipse/Donut/Spline/Xline/Divide, tự tìm+sửa 1 bug (vector (0,0) làm dynBuf collapse). 62 test mới.
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
