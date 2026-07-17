# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp **`feat/present-layout-ml-p1`** — local `db08340` (verify git), **CHƯA push, CHƯA merge main** (main/origin vẫn `3265db1`). Worktree sống: `interiorflow-wt-ps4` (nhánh `feat/present-ps4-multi-format`, PS-4 xong — chờ duyệt merge, xoá worktree ngay sau).
- **App có nút "Mở DWG" trực tiếp** (Web Worker cô lập GPL) — không cần server/CLI.
- **✅ 15/07 merge `feat/devops-docs`**: bộ cài .dmg unsigned + docs build Win/deploy Vercel (chi tiết CHANGELOG).
- Test pattern: `node_modules/.bin/sucrase-node <path>.test.ts` (45 file trên nhánh ps4, 43 trên `present-layout-ml-p1`).

## Quyết định user đã khoá
- **Auth**: chỉ Google OAuth @ttt.vn (mới) + admin cấp tay (`scripts/seed-admin.ts`); user cũ ngoài-domain grandfather; register công khai 403; quên mật khẩu = admin reset.
- Perceptron THẬT (learning-to-rank) · installer cả 3 unsigned (.exe cần Win) · PWA host Vercel + Supabase (Sprint 4).

## ĐIỂM RESUME (phiên mới đọc mục này TRƯỚC)
- **✅ 17/07 PS-4 (Present) — Đa khổ 16:9/A4/A3 + reflow + export** (nhánh `feat/present-ps4-multi-format`, worktree `interiorflow-wt-ps4`, CHƯA merge — chờ duyệt): gộp 2 nguồn stage-size cũ về `lib/present-editor/stage-presets.ts` (`STAGE_PRESETS`/`stageFor()`); `render.ts`/`export.ts` nhận W/H qua tham số (mặc định 16:9 = KHÔNG đổi hành vi cũ). 5 preset đúng tỉ lệ ISO 216 (A3 = A4 × √2, gấp đôi diện tích). `model.ts` thêm `deck.stagePreset?` (optional, an toàn ngược). `reflow.ts` (mới) — dàn lại compact (KHÔNG AI) tiêu đề/kicker/ảnh/thân bài theo hướng khổ mới, tái dùng `region-layout.ts`; KHÔNG BAO GIỜ xoá phần tử, chỉ đổi frame. UI: nút "Khổ trình bày" (Toolbar) → `StagePresetPanel.tsx`, nhãn bắt buộc "màn hình/chiếu", không hứa in 300dpi. PDF/PNG theo đúng khổ; **PPTX luôn giữ 16:9** (quyết định phạm vi — `lib/pptx.ts` định vị bằng inch tuyệt đối, đổi khổ dọc sẽ lệch nặng, ngoài phạm vi PS-4). Verify: tsc 0 · 45/45 test (stage-presets 42 ok, reflow 23 ok) · browser tuần tự (account test riêng, SQLite riêng đã xoá): reflow đúng (đo DOM %), PDF MediaBox đúng tỉ lệ, 16:9 export khớp y hệt cũ, 0 lỗi console. Nợ nhỏ: moodboard nhiều ảnh+caption riêng → dồn caption thành danh sách dọc (không mất chữ, chưa pixel-perfect).
- **✅ 17/07 PS-1 (Present) — Brand Kit + áp lại theme cả deck + logo/watermark** (`db08340`) — chi tiết → CHANGELOG.
- **✅ 17/07 E1.2 swatch vật liệu procedural** (`4a73a5b`) + **✅ 18/07 DWG nút "Mở DWG" trong app** — chi tiết → CHANGELOG.
- **✅ 17/07 PS-0 (Present, gate) — AUDIT xong**: D.9=nối một phần (photo-editor tách rời — job PS-3); res render 1920px chỉ ~116dpi/A3 ⇒ chưa in 300dpi (điều kiện chặn riêng, ngoài PS-4).
- **✅ 18/07 Sprint 9+10 — toggle Sketch↔Pro + Pro P1+P2**. Chi tiết → CHANGELOG.
- File rác `Bản sao Không có tiêu đề.rtfd/` ở repo chính — CHỜ user duyệt xoá.
- **NVIDIA_API_KEY đã có**, probe HTTP 200. **fal**: hết balance, chờ nạp credit.
- CHƯA làm (backlog cũ): hardcode 'DETECH·CONCEPT' · template tĩnh · heavy-ML pha 2 · membership per-flow.
- Sprint 3/6-8 đã xong — chi tiết → CHANGELOG.md.

## Nợ kỹ thuật
- Hydration ⌘Z/Ctrl+Z tooltip (lib/kbd.ts:11 + CadToolbar) — cosmetic.
- `window.prompt` crash trong webview nhúng — Dashboard.tsx:138, browser thật OK.
- Migration Prisma drift (IntegrationAccount) — dùng `db push`, KHÔNG reset.
- 4 file stress test bị mất (xem ĐIỂM RESUME) — cần viết lại nếu muốn coverage edge-case CAD/render/present/concurrency.
- Sprint 3 B1: `meta` (giá/vendor/sku) để trống toàn bộ — chưa có dữ liệu giá thật.
- ~~Present stage-size CÓ 2 NGUỒN~~ ĐÃ GỘP (PS-4, xem ĐIỂM RESUME) → `stage-presets.ts`.
- **BUG 16/07 — GroupOverlay vô hình** (Render canvas Cmd+G): thiếu `ViewportPortal` + `zIndex:-1` sai. Chi tiết → CHANGELOG.md. CHƯA sửa.

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser**: cookie localhost dùng chung → verify TUẦN TỰ; dùng host 127.0.0.1 + account test riêng; KHÔNG logout, KHÔNG loadDemoFlow đè flow thật.
4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
