# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp **`feat/present-layout-ml-p1`** — local `44bcfb1` (verify git), **CHƯA push, CHƯA merge main** (main/origin vẫn `3265db1`). 0 worktree sống, 5 nhánh nguồn đã merge+xoá xong.
- **App có nút "Mở DWG" trực tiếp** (Web Worker cô lập GPL) — không cần server/CLI.
- **✅ 15/07 merge `feat/devops-docs`**: bộ cài .dmg unsigned + docs build Win/deploy Vercel (chi tiết CHANGELOG).
- Test pattern: `node_modules/.bin/sucrase-node <path>.test.ts`.
- **✅ 18/07 sửa bug môi trường (KHÔNG do phiên này gây ra, `.env` mtime 03/07)**: `DATABASE_URL="file:./dev.db"` resolve theo `process.cwd()` (root) thay vì `prisma/`, app runtime đọc nhầm file rỗng → mọi login 500. Đổi sang đường dẫn tuyệt đối `file:.../prisma/dev.db`, xoá file rỗng, restart dev server :3000 — verify login trả 401 đúng nghĩa.

## Quyết định user đã khoá
- **Auth**: chỉ Google OAuth @ttt.vn (mới) + admin cấp tay (`scripts/seed-admin.ts`); user cũ ngoài-domain grandfather; register công khai 403; quên mật khẩu = admin reset.
- Perceptron THẬT (learning-to-rank) · installer cả 3 unsigned (.exe cần Win) · PWA host Vercel + Supabase (Sprint 4).

## ĐIỂM RESUME (phiên mới đọc mục này TRƯỚC)
- **✅ 18/07 — đã merge tuần tự 5 nhánh vào `feat/present-layout-ml-p1`** (`44bcfb1`), theo yêu cầu user. Mỗi merge verify tsc+test riêng trước khi đi tiếp; conflict chỉ ở doc (STATUS/CHANGELOG) + `.claude/launch.json` (dev-port entry, giữ cả 2) + `model.ts` (2 field mới cộng dồn) — KHÔNG có conflict logic thật, code tự auto-merge sạch mọi nơi khác. Sau merge: `npx tsc --noEmit` 0 lỗi, **49/49 file test PASS** (chạy lại toàn bộ trên nhánh đã merge, không chỉ từng nhánh riêng). 5 nhánh nguồn đã xoá (đã merge xong): `fix/groupoverlay-invisible`, `feat/present-ps2-templates`, `feat/present-ps3-photoeditor-roundtrip`, `feat/present-ps4-multi-format`, `feat/present-ps7-photoeditor-ux`. Nội dung: sửa bug GroupOverlay vô hình · lưu template tự tạo (PS-2) · round-trip photo-editor↔slide + tài sản liên kết (PS-3) · đa khổ A4/A3 + reflow + export (PS-4) · phím tắt Photoshop trong photo-editor (PS-7). **CHƯA push, CHƯA merge main — cần hỏi riêng.**
- **Gate PS-5/PS-6** (share deck khách + comment): chủ dự án chọn DỪNG — hạ tầng share/auth public-facing để sau.
- Đã merge trước đó: PS-1 Brand Kit (`db08340`), E1.2 swatch vật liệu (`4a73a5b`), DWG mở trong app, PS-0 audit, Sprint 9+10 toggle Sketch↔Pro. Chi tiết → CHANGELOG.
- File rác `Bản sao Không có tiêu đề.rtfd/` ở repo chính — CHỜ user duyệt xoá.
- **NVIDIA_API_KEY đã có**, probe HTTP 200. **fal**: hết balance, chờ nạp credit.
- CHƯA làm (backlog cũ): hardcode 'DETECH·CONCEPT' · template tĩnh · heavy-ML pha 2 · membership per-flow.
- Sprint 3/6-8 đã xong — chi tiết → CHANGELOG.md.

## Nợ kỹ thuật
- Hydration ⌘Z/Ctrl+Z tooltip (lib/kbd.ts:11 + CadToolbar, nay cả PhotoToolbar) — cosmetic, đã biết từ trước.
- `window.prompt` crash trong webview nhúng — Dashboard.tsx:138, browser thật OK.
- Migration Prisma drift (IntegrationAccount) — dùng `db push`, KHÔNG reset.
- 4 file stress test bị mất — cần viết lại nếu muốn coverage edge-case CAD/render/present/concurrency.
- Sprint 3 B1: `meta` (giá/vendor/sku) để trống toàn bộ — chưa có dữ liệu giá thật.
- PS-3: linked-asset chưa nối được với ảnh Render stage (thiếu id ổn định ở `deckImagesFromNodes`) — theo dõi khi cần.
- ~~GroupOverlay vô hình~~ ĐÃ SỬA (merge `fix/groupoverlay-invisible`). ~~Present stage-size 2 nguồn~~ ĐÃ GỘP (merge PS-4) → `stage-presets.ts`.
- In A3/A4 300dpi thật vẫn CHƯA khả dụng (giới hạn Render stage, ~116dpi/A3 hiện tại) — PS-4 chỉ làm khổ màn hình/chiếu, đúng phạm vi đã chốt.

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser**: cookie localhost dùng chung → verify TUẦN TỰ; dùng host 127.0.0.1 + account test riêng; KHÔNG logout, KHÔNG loadDemoFlow đè flow thật.
4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
