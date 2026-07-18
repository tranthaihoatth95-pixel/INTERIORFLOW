# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp **`feat/present-layout-ml-p1`** — local `db08340` (verify git), **CHƯA push, CHƯA merge main** (main/origin vẫn `3265db1`). 0 worktree sống.
- **App có nút "Mở DWG" trực tiếp** (Web Worker cô lập GPL) — không cần server/CLI. `~/Downloads/dwg2dxf` giữ làm dự phòng offline/bản vẽ nhạy cảm.
- **✅ 15/07 merge `feat/devops-docs`**: bộ cài .dmg (`dist/InteriorFlow-0.1.0-arm64.dmg`, unsigned) + docs build Win/deploy Vercel (chi tiết CHANGELOG).
- **✅ Cổng Sprint 2 PASS (14/07)**: 492 test/20 file · tsc 0 (chi tiết CHANGELOG).
- Test pattern: `node_modules/.bin/sucrase-node <path>.test.ts` (nay 41 file — thêm material-texture.test.ts).

## Quyết định user đã khoá
- **Auth**: chỉ Google OAuth @ttt.vn (mới) + admin cấp tay (`scripts/seed-admin.ts`); user cũ ngoài-domain grandfather; register công khai 403; quên mật khẩu = admin reset.
- Perceptron THẬT (learning-to-rank) · installer cả 3 unsigned (.exe cần Win) · PWA host Vercel + Supabase (Sprint 4).

## ĐIỂM RESUME (phiên mới đọc mục này TRƯỚC)
- **⏳ 18/07 — đang merge tuần tự 5 nhánh đã audit vào `feat/present-layout-ml-p1`** (user yêu cầu merge). Xong tới đâu cập nhật STATUS tới đó, tsc+test PASS sau mỗi merge mới đi tiếp:
  - ✅ `fix/groupoverlay-invisible` — merge sạch, không conflict. ViewportPortal + bỏ zIndex:-1.
  - ✅ `feat/present-ps2-templates` (PS-2) — merge, conflict CHỈ ở STATUS.md (đã resolve tay). "Lưu slide này thành template" → nhóm "Của tôi", `custom-templates.ts` mới.
  - ⏳ Còn lại: `feat/present-ps3-photoeditor-roundtrip`, `feat/present-ps4-multi-format`, `feat/present-ps7-photoeditor-ux` — 3 nhánh này CÓ khả năng đụng file chung (PhotoEditor.tsx/PhotoToolbar.tsx giữa PS-3↔PS-7; PresentEditor.tsx/EditorCanvas.tsx giữa PS-2/3/4) vì build song song từ cùng base, chưa rebase lên nhau.
- **Gate PS-5/PS-6** (share deck khách + comment): chủ dự án chọn DỪNG — hạ tầng share/auth public-facing để sau.
- Đã merge trước đó: PS-1 Brand Kit (`db08340`), E1.2 swatch vật liệu (`4a73a5b`), DWG mở trong app, PS-0 audit, Sprint 9+10 toggle Sketch↔Pro. Chi tiết → CHANGELOG.
- File rác `Bản sao Không có tiêu đề.rtfd/` ở repo chính — CHỜ user duyệt xoá.
- **NVIDIA_API_KEY đã có**, probe HTTP 200. **fal**: hết balance, chờ nạp credit.
- CHƯA làm (backlog cũ): hardcode 'DETECH·CONCEPT' · template tĩnh · heavy-ML pha 2 · membership per-flow.
- Sprint 3/6-8 (41 shape nội thất · MEP · Export PDF/.idf/markup · Template Office/Hotel) đã xong — chi tiết → CHANGELOG.md.

## Nợ kỹ thuật
- Hydration ⌘Z/Ctrl+Z tooltip (lib/kbd.ts:11 + CadToolbar, nay cả PhotoToolbar) — cosmetic, đã biết từ trước.
- `window.prompt` crash trong webview nhúng — Dashboard.tsx:138, browser thật OK.
- Migration Prisma drift (IntegrationAccount) — dùng `db push`, KHÔNG reset.
- 4 file stress test bị mất — cần viết lại nếu muốn coverage edge-case CAD/render/present/concurrency.
- Sprint 3 B1: `meta` (giá/vendor/sku) để trống toàn bộ — chưa có dữ liệu giá thật.
- PS-3: linked-asset chưa nối được với ảnh Render stage (thiếu id ổn định ở `deckImagesFromNodes`) — theo dõi khi cần.
- GroupOverlay + 2-nguồn-khổ-sân-khấu: đã sửa ở nhánh riêng (xem ĐIỂM RESUME) — hết là nợ SAU KHI merge.

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser**: cookie localhost dùng chung → verify TUẦN TỰ; dùng host 127.0.0.1 + account test riêng; KHÔNG logout, KHÔNG loadDemoFlow đè flow thật.
4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
