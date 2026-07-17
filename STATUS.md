# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp **`feat/present-layout-ml-p1`** — local `5965e8b` (verify git; STATUS cũ ghi 4a73a5b — đã cập nhật), **CHƯA push, CHƯA merge main** (main/origin vẫn `3265db1`). 0 worktree sống.
- **App có nút "Mở DWG" trực tiếp** (Web Worker cô lập GPL) — không cần server/CLI. `~/Downloads/dwg2dxf` giữ làm dự phòng offline/bản vẽ nhạy cảm.
- **✅ 15/07 merge `feat/devops-docs`**: bộ cài .dmg (`dist/InteriorFlow-0.1.0-arm64.dmg`, unsigned) + docs build Win/deploy Vercel (chi tiết CHANGELOG).
- **✅ Cổng Sprint 2 PASS (14/07)**: 492 test/20 file · tsc 0 (chi tiết CHANGELOG).
- Test pattern: `node_modules/.bin/sucrase-node <path>.test.ts` (nay 41 file — thêm material-texture.test.ts).

## Quyết định user đã khoá
- **Auth**: chỉ Google OAuth @ttt.vn (mới) + admin cấp tay (`scripts/seed-admin.ts`); user cũ ngoài-domain grandfather; register công khai 403; quên mật khẩu = admin reset.
- Perceptron THẬT (learning-to-rank) · installer cả 3 unsigned (.exe cần Win) · PWA host Vercel + Supabase (Sprint 4).

## ĐIỂM RESUME (phiên mới đọc mục này TRƯỚC)
- **✅ 17/07 E1.2 — swatch vật liệu PROCEDURAL, ĐÓNG gap cuối Phase 1** (`4a73a5b`): trụ "Vật liệu" Stage 4 → Pro (3/3 trụ). `lib/cad/material-texture.ts` vẽ hoạ tiết bằng thuật toán; `MaterialPalette.tsx` swatch+hover. Verify: tsc 0 · 30/30 test mới + 41 file PASS. Chi tiết → CHANGELOG.
- **✅ 18/07 DWG — nút "Mở DWG" trong app** (Worker cô lập GPL); `dwg2dxf` giữ dự phòng. Chi tiết → CHANGELOG.
- **✅ 17/07 PS-0 (Present, gate) — AUDIT xong, KHÔNG đổi code**:
  - **D.9 = NỐI MỘT PHẦN.** `ImageEditor.tsx` (Canva, nhấp đúp): crop/chỉnh màu-CSS/thay ảnh/bo góc ghi THẲNG ImageElement → canvas+export đúng. Nhưng nút "Chỉnh ảnh nâng cao" = `window.open('/photo-editor')` (PresentEditor.tsx:937) — KHÔNG truyền src, KHÔNG đường về; `/photo-editor` mở doc MẪU trắng (makeSampleDoc), output duy nhất = TẢI file PNG/JPEG. ⇒ phần nặng (layer/mask/clone/adjustment) HOÀN TOÀN tách rời.
  - **Khoá 16:9**: hardcode gom 3 file — `standards.ts:69` (stage 1920×1080+pxPerPct), `render.ts:28-29` (W/H RIÊNG, không đọc standards ⇒ 2 nguồn), `export.ts:26/29/30` (jsPDF format). Toạ độ element là % (0..100) ⇒ reflow gần free. 6 chỗ CSS `aspectRatio:'16/9'` chỉ hiển thị. Job PS-4: vừa-nhỏ.
  - **Res render (chặng 2)**: `renderSlide` = 1920×1080; hero AI FLUX max 1344px cạnh dài. A3 300dpi cần ~3508×4961px ⇒ 1920px chỉ ~116dpi trên A3. **KHÔNG đủ in A3/A4 300dpi** — PS-4 chỉ xem màn hình.
- **✅ 18/07 Sprint 9+10 — toggle Sketch↔Pro** (mặc định Sketch, `cadMode`+`PRO_ONLY_TOOLS` ẩn ~30 tool) **+ Pro P1+P2** (nhập toạ độ chính xác, Polygon/Ellipse/Donut/Spline/Xline/Divide). Chi tiết → CHANGELOG.
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
