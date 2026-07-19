# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp `feat/present-layout-ml-p1` (`8c05ace`, verify git) — đã merge thêm fix CAD wall-color + Render groups/tooltip, tsc pass. `origin/main` ở `600523c` — CHƯA push (còn agent present-gallery chạy, đợi xong push 1 lượt).
- **1 worktree sống:** `interiorflow-wt-fix-present-gallery` (branch `fix/present-gallery-interactions`, agent đang chạy).
- **Bug MỚI user báo (chưa sửa):** chuyển từ chặng CAD → Render bị văng ra màn hình đăng nhập dù đang đăng nhập, lặp lại nhiều lần, tồn tại lâu. Nghi vấn đã xác nhận 1 phần: `CadEditor.tsx` (chặng CAD) KHÔNG hề kiểm tra session (không gọi `/api/auth/me`, không đọc `user`), trong khi `app/page.tsx` (chặng Render, route `/`) gọi lại `/api/auth/me` MỖI LẦN mount và hiện `LoginScreen` nếu response không `ok`. Đang giao agent điều tra sâu bằng browser thật (worktree `interiorflow-wt-fix-cad-render-login-bug`).
- **19/07 chiều: audit toàn diện chuột/bàn phím/cảm ứng 3 chặng CAD/Render/Present+Login+Gallery** (4 agent, mỗi agent 1 host riêng để không đụng cookie/IndexedDB). Kết quả → mục Nợ kỹ thuật bên dưới. Danh sách đầy đủ (kèm dòng code) nằm trong lịch sử chat, chưa chép hết vào STATUS để giữ &lt;800 từ — hỏi lại nếu cần.
- **19/07: đã xử lý 2 nợ kỹ thuật nhỏ trực tiếp (không qua agent):** Prisma `db push` đồng bộ schema `IntegrationAccount` · dọn file rác `Bản sao Không có tiêu đề.rtfd/` + `CLAUDE.md.bak`.
- **App có nút "Mở DWG" trực tiếp** (Web Worker cô lập GPL) — không cần server/CLI.
- Test pattern: `node_modules/.bin/sucrase-node <path>.test.ts` (59 file). KHÔNG có vitest/jest — bỏ qua chỉ dẫn nào ghi `npm test`.
- ✅ 18/07 sửa bug môi trường: `DATABASE_URL` sai path khiến mọi login 500 — đã fix.

## Quyết định user đã khoá
- **Auth**: chỉ Google OAuth @ttt.vn (mới) + admin cấp tay (`scripts/seed-admin.ts`); user cũ ngoài-domain grandfather; register công khai 403; quên mật khẩu = admin reset.
- Perceptron THẬT (learning-to-rank) · installer cả 3 unsigned (.exe cần Win) · PWA host Vercel + Supabase (Sprint 4).

## Nợ kỹ thuật
- ~~Hydration tooltip CadToolbar/PhotoToolbar~~ · ~~window.prompt Dashboard/PS-3/Brand Kit~~ · ~~Migration Prisma drift~~ · ~~CAD Room tool chuột~~ · ~~CAD Backspace không xoá được~~ · ~~Demo render: thanh tím đè nhãn phòng (hatch SOLID bị force-highlight tô đặc thay vì chỉ viền, đã thêm `DrawStyle.outlineOnly`)~~ — ĐÃ SỬA, đã merge, **demo render user đã tự verify mắt qua tunnel 19/07, OK**.
- **Mới phát hiện 19/07 (audit 4 agent), CHƯA sửa — ưu tiên theo mức độ:**
  - ~~[CAO] Màu layer "Tường" `#e8e4dc` trùng nền canvas~~ — **ĐÃ SỬA**, nhánh `fix/cad-wall-layer-color` (`1079a22`, worktree `interiorflow-wt-fix-cad-wall-color`, tsc pass). Đổi sang `#47423a` (= `--t2` theme sáng, cân bằng cả nền sáng/tối); sửa luôn `addLayer()` palette trong `store.ts` (cùng bug). Verify browser port 4080 + pixel-sample OK. **CHƯA merge** — worktree còn sống.
  - [CAO] Handle xoay (rotate) ở Present không hoạt động — `components/present-editor/Element.tsx:206-210`.
  - [CAO] Phím Enter toàn cục ở Gallery (`ProjectSelect.tsx:401-417`) không check `e.target` → bấm Enter cho nút bất kỳ vô tình mở/tạo nhầm flow.
  - [CAO] Group bị collapse ở Render rồi reload → node ẩn vĩnh viễn, `groups` state không lưu (`lib/store.ts`).
  - [TRUNG] Bug hydration mismatch MỚI ở `components/ui/Tooltip.tsx:83` (khác bug đã sửa) — ảnh hưởng cả 3 chặng qua `StudioBar`.
  - [TRUNG] Không hỗ trợ cảm ứng thật ở CAD (chỉ chặn scroll, không xử lý gesture) · Slide Sorter dùng HTML5 DnD (không chạy trên touch) · Escape trong Mask/Annotate editor mất nét vẽ chưa lưu, không cảnh báo.
  - [THẤP-TRUNG] Tab-order sai ở LoginScreen · card gallery carousel 3D không tới được bằng Tab · property panel Render không undo được.
  - Chi tiết đầy đủ (dòng code, cách tái hiện) nằm trong lịch sử chat phiên 19/07 — hỏi lại nếu cần trích.
- Sprint 3 B1: `meta` (giá/vendor/sku) trống — chưa có dữ liệu giá thật.
- In A3/A4 300dpi thật vẫn CHƯA khả dụng (giới hạn Render stage) — đúng phạm vi đã chốt.
- `knowledge/project-references/` ~121MB PDF trong git — cân nhắc Git LFS. User chọn ĐỂ SAU (rewrite history rủi ro cao).
- `CadCanvas.tsx` còn nhiều `window.prompt`/`confirm` khác cùng rủi ro treo webview (Text ~768, markup ~777, array ~977-1016, scale ~1027, title block ~1368).

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser**: cookie localhost dùng chung → verify TUẦN TỰ; dùng host 127.0.0.1 + account test riêng; KHÔNG logout, KHÔNG loadDemoFlow đè flow thật.
4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
