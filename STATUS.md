# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp `feat/present-layout-ml-p1` = `origin/main` (`a98799c`, verify git) — đã push xong.
- **19/07 chiều: agent thứ 4** — `interiorflow-wt-fix-demo-render-overlap` (branch `fix/demo-render-overlap`), điều tra bug user chụp màn hình: thanh tím đè lên nhãn phòng khi "Mở bản demo" ở CAD. Dùng IP LAN máy làm origin riêng (host thứ 4, tránh đụng 3 agent kia).
- **19/07 chiều: 3 agent nền chạy song song — audit toàn diện chuột/bàn phím/cảm ứng 3 chặng CAD/Render/Present+Login+Gallery, mỗi agent 1 host riêng (localhost/127.0.0.1/[::1], cùng server :3000) để không đụng cookie. Agent CAD kèm sửa bug đã xác nhận: `Backspace` không xoá được đối tượng (phím delete Mac gửi `Backspace` không phải `Delete`) — worktree `interiorflow-wt-fix-cad-delete-key`, branch `fix/cad-delete-key`, CHỜ merge. 2 agent Render/Present chỉ audit, không sửa code — kết quả là danh sách bất tiện chờ user lọc việc cần giao sửa tiếp.
- **19/07: đã xử lý 2 nợ kỹ thuật nhỏ trực tiếp (không qua agent):** Prisma `db push` đồng bộ schema `IntegrationAccount` (đã backup `dev.db` trước khi push) · dọn file rác `Bản sao Không có tiêu đề.rtfd/` + `CLAUDE.md.bak` (đã diff xác nhận bản cũ, không mất nội dung).
- **App có nút "Mở DWG" trực tiếp** (Web Worker cô lập GPL) — không cần server/CLI.
- Test pattern: `node_modules/.bin/sucrase-node <path>.test.ts` (59 file). KHÔNG có vitest/jest — bỏ qua chỉ dẫn nào ghi `npm test`.
- ✅ 18/07 sửa bug môi trường: `DATABASE_URL` sai path khiến mọi login 500 — đã fix.

## Quyết định user đã khoá
- **Auth**: chỉ Google OAuth @ttt.vn (mới) + admin cấp tay (`scripts/seed-admin.ts`); user cũ ngoài-domain grandfather; register công khai 403; quên mật khẩu = admin reset.
- Perceptron THẬT (learning-to-rank) · installer cả 3 unsigned (.exe cần Win) · PWA host Vercel + Supabase (Sprint 4).

## ĐIỂM RESUME (phiên mới đọc mục này TRƯỚC — file chi tiết đầy đủ: `~/.claude` memory `interiorflow-18-07-resume.md`)
- **✅ 18/07 — "đợt mở rộng" 9 nhánh đã merge xong vào `feat/present-layout-ml-p1`** (`0a734e5`):
  Brand Kit tiêu đề vô hình · cầu nối CAD→Present mới (`lib/cad/present-handoff.ts`) · toast Export
  + bỏ `window.prompt` Dashboard + sửa doc CAD-ROADMAP · viết lại 4 stress test đã mất (edgecase-stress,
  59 file test) · smart guide khi kéo + căn chỉnh/phân bố multi-select (`lib/present-editor/align.ts`)
  · Format Painter + bảng màu chữ nhanh (`format-painter.ts`) · PS-3 linked-asset nối id ổn định
  Render (`render:<nodeId>[:index]`) · Slide Sorter xem lưới toàn deck · **Animation Pane theo object**
  (đổi kiến trúc SlidePlayer từ raster ảnh sang render DOM thật — build-in cấp-phần-tử trước đây là
  dead code, giờ có hiệu lực thị giác thật). Mỗi nhánh build worktree riêng, audit độc lập (diff+tsc+
  test tự tay) trước khi merge tuần tự — conflict hầu hết chỉ ở `.claude/launch.json` (dev-port, giữ
  cả 2) + vài import trùng trong `PresentEditor.tsx`/`EditorCanvas.tsx` (gộp giữ cả 2 phía, không mất
  logic). Verify cuối: tsc 0 · 59/59 file test PASS · browser thật xác nhận toolbar đủ tính năng mới,
  Motion tab render đúng. Đã merge main + push origin (`9cc1301`).
  Từ audit trước còn treo: bug slider "Chỉnh màu" xác nhận KHÔNG PHẢI bug thật (3 lần verify độc lập).
- **✅ 18/07 — đã merge tuần tự 5 nhánh vào `feat/present-layout-ml-p1`** rồi merge main + push origin (`1ce8674`): fix GroupOverlay vô hình · lưu template tự tạo PS-2 gốc · round-trip photo-editor↔slide + tài sản liên kết PS-3 · đa khổ A4/A3+reflow+export PS-4 · phím tắt Photoshop PS-7. Chi tiết → CHANGELOG.
- **Gate PS-5/PS-6** (share deck khách + comment): chủ dự án chọn DỪNG.
- Đã merge trước đó: PS-1 Brand Kit (`db08340`), E1.2 swatch vật liệu, DWG mở trong app, PS-0 audit, Sprint 9+10 toggle Sketch↔Pro. Chi tiết → CHANGELOG.
- File rác `Bản sao Không có tiêu đề.rtfd/` ở repo chính — CHỜ user duyệt xoá.
- **NVIDIA_API_KEY đã có**, probe HTTP 200. **fal**: hết balance, chờ nạp credit.
- CHƯA làm (backlog cũ): hardcode 'DETECH·CONCEPT' · template tĩnh · heavy-ML pha 2 · membership per-flow.
- Sprint 3/6-8 đã xong — chi tiết → CHANGELOG.md.

## Nợ kỹ thuật
- ~~Hydration ⌘Z/Ctrl+Z tooltip (CadToolbar/PhotoToolbar)~~ ĐÃ SỬA 19/07 (`988e0e0`) — thêm `useModKey`/`useModShiftKey` mount-based vào `lib/kbd.ts`. tsc pass. Lưu ý: `BottomToolbar.tsx` + `CommandPalette.tsx` cũng gọi `modKey`/`modShiftKey` trực tiếp trong `title` → có thể dính cùng lỗi, CHƯA sửa (ngoài phạm vi khoanh ban đầu, cần user quyết).
- ~~window.prompt crash webview~~ ~~PS-3 linked-asset chưa nối Render~~ ~~Brand Kit áp 1 slide/tương phản~~ ĐÃ SỬA — tất cả đã merge (`0a734e5`).
- ~~Migration Prisma drift (IntegrationAccount)~~ ĐÃ SỬA 19/07 — chạy `db push` trực tiếp trên `dev.db` (đã backup trước khi chạy).
- Sprint 3 B1: `meta` (giá/vendor/sku) trống — chưa có dữ liệu giá thật.
- In A3/A4 300dpi thật vẫn CHƯA khả dụng (giới hạn Render stage) — PS-4 chỉ làm khổ màn hình/chiếu, đúng phạm vi đã chốt.
- `knowledge/project-references/` ~121MB PDF trong git — **GitHub đã cảnh báo lúc push** (1 file 73MB vượt khuyến nghị 50MB) — cân nhắc Git LFS. **19/07: user chọn ĐỂ SAU** (rewrite history nhánh đã push, rủi ro cao, cần làm riêng cẩn thận có backup).
- ~~CAD Room tool không phản hồi chuột~~ ĐÃ SỬA 19/07 (`0c294cd`, branch `fix/cad-room-tool-mouse`) — KHÔNG phải bug pointer: browser thật xác nhận click 2 góc tạo phòng đúng. Nguyên nhân: `window.prompt` sau click 2 chặn thread JS (cùng loại bug Dashboard cũ). Đã thay bằng ô nhập tên nổi không chặn trong `CadCanvas.tsx`, giữ hành vi Cancel cũ (huỷ vẫn tạo phòng tên mặc định). Verify browser thật OK, tsc pass.
- **Chưa sửa (ngoài phạm vi, ghi nhận từ agent B):** `CadCanvas.tsx` còn nhiều `window.prompt`/`confirm` khác cùng rủi ro treo webview — Text tool (~768), markup (~777), array rect/polar (~977-992), scale (~1003), title block (~1344).
- **Bug demo render: thanh tím dày đè chữ nhãn phòng** ĐÃ SỬA (worktree `interiorflow-wt-fix-demo-render-overlap`, branch `fix/demo-render-overlap`) — KHÔNG phải bug `demo-plan.ts` (đã đọc toàn bộ, không có logic set-selection; `importDoc(...,'replace')` luôn clear `selection:[]`). Nguyên nhân THẬT: `drawEntity` case `'hatch'` (dùng cho poché tường, pattern SOLID) khi bị ép `forceColor` (đường highlight-selection/preview accent trong `CadCanvas.tsx`) vẫn TÔ ĐẶC (fill alpha 0.9) toàn bộ quad thay vì chỉ viền — nếu 1 tường (hatch) được chọn, mảng tô đặc màu `--accent` (`#8b7cf7`, tím) đè hoàn toàn lên chữ bên dưới nó (highlight pass luôn vẽ SAU cùng base pass → luôn đè text). 2 "ô vuông ở 2 đầu" = grip 4 góc quad wall visually gộp cặp ở mỗi đầu lúc zoom xa. Sửa: thêm `DrawStyle.outlineOnly` (`lib/cad/render.ts`) — khi bật, case `'hatch'` chỉ vẽ viền không tô; áp cho 4 chỗ dùng `forceColor: accent` trong `CadCanvas.tsx` (highlight selection L1594, angular-dim leg L1954, join target L2121; ghost block L2131 không đụng path hatch nên giữ nguyên). KHÔNG đổi export PNG đen-trắng (`render.ts:390` vẫn tô đặc — đúng, cần cho bản in). Verify: tsc 0 lỗi · `hatch.test.ts` 33/33 · `checker.test.ts` 62/62 · Next dev HMR compile `/cad-editor` sạch (2938 module, 0 lỗi). **CHƯA verify browser thật** — origin test (port 4070, cookie riêng) không có session, bị redirect login, DỪNG theo luật không tự nhập mật khẩu — cần user tự đăng nhập rồi bấm "Mở bản demo" xác nhận lại bằng mắt trước khi merge.

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser**: cookie localhost dùng chung → verify TUẦN TỰ; dùng host 127.0.0.1 + account test riêng; KHÔNG logout, KHÔNG loadDemoFlow đè flow thật.
4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
