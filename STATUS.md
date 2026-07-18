# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp `feat/present-layout-ml-p1` = `main`/`origin/main` (`1ce8674` + commit Quality phase mới, verify git). 0 worktree sống.
- **App có nút "Mở DWG" trực tiếp** (Web Worker cô lập GPL) — không cần server/CLI.
- Test pattern: `node_modules/.bin/sucrase-node <path>.test.ts` (50 file). KHÔNG có vitest/jest — bỏ qua chỉ dẫn nào ghi `npm test`.
- **✅ 18/07 sửa bug môi trường (KHÔNG do phiên này gây ra, `.env` mtime 03/07)**: `DATABASE_URL` sai path khiến MỌI login 500 — đã fix, verify login trả 401 đúng nghĩa.

## Quyết định user đã khoá
- **Auth**: chỉ Google OAuth @ttt.vn (mới) + admin cấp tay (`scripts/seed-admin.ts`); user cũ ngoài-domain grandfather; register công khai 403; quên mật khẩu = admin reset.
- Perceptron THẬT (learning-to-rank) · installer cả 3 unsigned (.exe cần Win) · PWA host Vercel + Supabase (Sprint 4).

## ĐIỂM RESUME (phiên mới đọc mục này TRƯỚC)
- **✅ 18/07 — 4 phase Quality (knowledge+vá bug+design audit)** → chi tiết đủ `QUALITY-LOG.md` +
  `ARCHITECT-REVIEW.md` ở root. Tóm tắt: load `knowledge/` (design-system+brand+project-refs) +
  CLAUDE.md rule mới; vá 2/4 bug thật — **PS-2 "Của tôi" không hiện** (`LayoutShelf.tsx` ẩn cả kệ
  mẫu sau `GenerateFlow` tới khi generate 1 lần → thêm nút "Bỏ qua, xem mẫu có sẵn", verify browser
  thật OK) + **đổi Khổ trình bày làm ảnh đè chữ vô hình** (`reflow.ts` thêm `avoidImageOverlap()`
  né phần tử tự do bị ảnh che kín, test `[13]` tái hiện đúng bug); slider "Chỉnh màu" xác nhận
  KHÔNG PHẢI bug (3 lần verify độc lập); merge `feat/smart-tooltips`. Architect: 16/16 PASS, 0
  FIXABLE. Verify: tsc 0 · 50/50 test PASS. **CÒN CHƯA VÁ**: Brand Kit "áp cả deck" chỉ áp 1 slide
  + bug tương phản màu làm tiêu đề vô hình sau áp theme — cần đợt riêng. Agent Tester chạy phiên sau.
- **✅ 18/07 — đã merge tuần tự 5 nhánh vào `feat/present-layout-ml-p1`** rồi merge main + push origin (`1ce8674`): fix GroupOverlay vô hình · lưu template tự tạo PS-2 gốc · round-trip photo-editor↔slide + tài sản liên kết PS-3 · đa khổ A4/A3+reflow+export PS-4 · phím tắt Photoshop PS-7. Chi tiết → CHANGELOG.
- **Gate PS-5/PS-6** (share deck khách + comment): chủ dự án chọn DỪNG.
- Đã merge trước đó: PS-1 Brand Kit (`db08340`), E1.2 swatch vật liệu, DWG mở trong app, PS-0 audit, Sprint 9+10 toggle Sketch↔Pro. Chi tiết → CHANGELOG.
- File rác `Bản sao Không có tiêu đề.rtfd/` ở repo chính — CHỜ user duyệt xoá.
- **NVIDIA_API_KEY đã có**, probe HTTP 200. **fal**: hết balance, chờ nạp credit.
- CHƯA làm (backlog cũ): hardcode 'DETECH·CONCEPT' · template tĩnh · heavy-ML pha 2 · membership per-flow.
- Sprint 3/6-8 đã xong — chi tiết → CHANGELOG.md.

## Nợ kỹ thuật
- Hydration ⌘Z/Ctrl+Z tooltip (lib/kbd.ts:11 + CadToolbar/PhotoToolbar) — cosmetic, đã biết từ trước.
- `window.prompt` crash trong webview nhúng — Dashboard.tsx:138, browser thật OK.
- Migration Prisma drift (IntegrationAccount) — dùng `db push`, KHÔNG reset.
- 4 file stress test bị mất — cần viết lại nếu muốn coverage edge-case.
- Sprint 3 B1: `meta` (giá/vendor/sku) trống — chưa có dữ liệu giá thật.
- PS-3: linked-asset chưa nối được với ảnh Render stage (thiếu id ổn định ở `deckImagesFromNodes`).
- Brand Kit "áp cả deck" chỉ áp 1 slide + bug tương phản màu làm tiêu đề vô hình sau khi áp theme — audit 18/07, CHƯA vá (xem QUALITY-LOG.md).
- In A3/A4 300dpi thật vẫn CHƯA khả dụng (giới hạn Render stage) — PS-4 chỉ làm khổ màn hình/chiếu, đúng phạm vi đã chốt.
- `knowledge/project-references/` ~121MB PDF trong git — cân nhắc Git LFS nếu repo phình to.

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser**: cookie localhost dùng chung → verify TUẦN TỰ; dùng host 127.0.0.1 + account test riêng; KHÔNG logout, KHÔNG loadDemoFlow đè flow thật.
4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
