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
- **✅ 17/07 PS-1 (Present) — Brand Kit bền vững + áp lại theme cả deck + logo/watermark** (`db08340`, đóng G.5/G.6/G.7): `lib/present-editor/brand-kit.ts` persist localStorage (pattern custom-fonts, 1–vài brand PHẲNG, KHÔNG kiểu Canva) — deck MỚI tự nạp (PresentSheets.blankDeck→seedDeckWithBrandKit). `theme-roles.ts` **rethemeDeck**: nhuộm lại MỌI slide theo VAI TRÒ màu (dark/light/accent/muted gần-nhất), xử lý đúng nền tối LẪN sáng (không đảo tương phản), KHÔNG find-replace hex; templates.pal() nay gọi paletteRoles (1 nguồn). `model.ts` **deck.watermark** cấp deck (render.ts+export+SlidePlayer+EditorCanvas overlay). UI: `BrandKitPanel.tsx` + nút "Nhận diện" (Toolbar). Verify: tsc 0 · 43/43 test (2 mới: theme-roles 25 ok, brand-kit 13 ok) · browser 127.0.0.1 tuần tự account riêng: nhuộm lại đúng slide tối+sáng, watermark mọi slide+toggle, deck mới auto-load kit (palette+logo). 0 lỗi console mới.
- **✅ 17/07 E1.2 swatch vật liệu procedural** (`4a73a5b`) + **✅ 18/07 DWG nút "Mở DWG" trong app** — chi tiết → CHANGELOG.
- **✅ 17/07 PS-0 (Present, gate) — AUDIT xong** (chi tiết đủ ở IF-PRESENT-SPRINT-PLAN mục PS-0 + Nợ kỹ thuật dưới): D.9=nối một phần (photo-editor nặng còn tách rời — job PS-3); khoá 16:9 nhẹ gom 3 file, reflow gần free (PS-4 vừa-nhỏ); res render 1920px chỉ ~116dpi/A3 ⇒ chưa in 300dpi.
- **✅ 18/07 Sprint 9+10 — toggle Sketch↔Pro + Pro P1+P2**. Chi tiết → CHANGELOG.
- File rác `Bản sao Không có tiêu đề.rtfd/` ở repo chính — CHỜ user duyệt xoá.
- **NVIDIA_API_KEY đã có**, probe HTTP 200. **fal**: hết balance, chờ nạp credit.
- CHƯA làm (backlog cũ): hardcode 'DETECH·CONCEPT' · template tĩnh · heavy-ML pha 2 · membership per-flow.
- Sprint 3/6-8 (41 shape nội thất · MEP · Export PDF/.idf/markup · Template Office/Hotel) đã xong — chi tiết → CHANGELOG.md.

## Nợ kỹ thuật
- Hydration ⌘Z/Ctrl+Z tooltip (lib/kbd.ts:11 + CadToolbar) — cosmetic.
- `window.prompt` crash trong webview nhúng — Dashboard.tsx:138, browser thật OK.
- Migration Prisma drift (IntegrationAccount) — dùng `db push`, KHÔNG reset.
- 4 file stress test bị mất (xem ĐIỂM RESUME) — cần viết lại nếu muốn coverage edge-case CAD/render/present/concurrency.
- Sprint 3 B1: `meta` (giá/vendor/sku) để trống toàn bộ — chưa có dữ liệu giá thật.
- Present stage-size CÓ 2 NGUỒN: `standards.ts:69` vs `render.ts:28-29` (W/H hardcode riêng) — PS-4 phải gộp về 1 nguồn khi tham số hoá khổ.
- **BUG 16/07 — GroupOverlay vô hình** (Render canvas Cmd+G): `GroupOverlay.tsx` thiếu `ViewportPortal` + `zIndex:-1` sai → group tạo đúng trong store nhưng UI không hiện. Chi tiết kỹ thuật → CHANGELOG.md. CHƯA sửa — chờ duyệt phạm vi.

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser**: cookie localhost dùng chung → verify TUẦN TỰ; dùng host 127.0.0.1 + account test riêng; KHÔNG logout, KHÔNG loadDemoFlow đè flow thật.
4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
