# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = 3 chặng **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` mục LUẬT NỀN TẢNG**: IF là sản phẩm ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử chi tiết → `CHANGELOG.md` (KHÔNG đọc mỗi phiên).

## Hiện tại (26/07 — phiên khuya)
- Nhánh tích hợp `feat/present-layout-ml-p1` @ `73d4f5d`. **0 commit vượt `origin/main`** — không nợ push.
- tsc PASS · **93/93 file test** (`node_modules/.bin/sucrase-node <path>.test.ts` — repo KHÔNG có vitest).
- ⚠️ Phiên này chạy nhầm gốc (`~/TTT Design system`) → memory rơi vào bộ nhớ TTT, `.claude/launch.json` phải dùng `npm --prefix`. **Phiên sau mở bằng `cd ~/Downloads/interiorflow && claude`.**
- ⚠️ Có thể còn **dev server :3000** chạy nền (mở qua preview_start) — kiểm `lsof -ti:3000`, tắt nếu thừa.

## Worktree đang mở (2)
1. **`interiorflow-wt-pdf-font`** — nhánh `fix/vn-pdf-font` @ `a65daaf`, **sạch, XONG, đã verify, CHỜ MERGE**.
2. **`interiorflow-wt-avatar`** — nhánh `feat/avatar-plush`, **agent ĐANG CHẠY lúc đóng phiên ⇒ RẤT CÓ THỂ DỞ DANG**.
   → Phiên sau **việc đầu tiên**: `git -C ~/Downloads/interiorflow-wt-avatar status --short` + `git -C ~/Downloads/interiorflow-wt-avatar log --oneline feat/present-layout-ml-p1..HEAD`. Dirty chưa commit thì checkpoint (`wip(avatar): …`) rồi mới quyết làm tiếp hay bỏ.

## ✅ #25 — PDF hết mất dấu tiếng Việt (nhánh `fix/vn-pdf-font`, 4 commit)
`b2af06a` font · `57c256f` `lib/pdf-font.ts` + test · `02a1ae7` nối vào `standards-report.ts`/`pdf.ts`/`CadEditor` · `a65daaf` khung tên hết tràn ô + `⌀`→`Ø`.
- Nhúng **Be Vietnam Pro** Regular+Bold (SIL OFL 1.1, 273KB, `public/fonts/` + `OFL.txt` + attribution `docs/LICENSE-NOTES.md`). User chọn BVP thay Noto Sans để **một hệ chữ xuyên UI → bản vẽ → PDF → deck** (khớp `docs/FIGMA-HANDOFF.md`).
- `lib/pdf-font.ts`: resolve **caller → Brand Kit → Be Vietnam Pro → helvetica**; .ttf nạp lúc xuất (KHÔNG nhồi base64 vào bundle); chạy cả browser (`fetch`) lẫn Node (`fs`).
- 🟡 Nhánh "Brand Kit" hiện LUÔN rơi về mặc định: `BrandKit.fonts` chỉ là `FontPairing` (enum 3 preset → CSS stack hệ thống, `lib/slides.ts:90`), KHÔNG mang file font; `lib/custom-fonts.ts` không tồn tại. Mở lại khi Brand Kit cho upload .ttf.
- Verify độc lập (không chép báo cáo agent): tsc 0 · 93/93 test · PNG soi tận mắt (`/tmp/if-pdf-verify/`) · font phục vụ qua HTTP `127.0.0.1` trả 200 + sha256 khớp file repo.
- Chỉ 2/6 file jsPDF thật sự dính lỗi; 4 file kia chỉ `addImage` JPEG → cố ý KHÔNG nối font (khỏi cõng 273KB vô ích).

## 🔴 BUG MỚI PHÁT HIỆN 26/07 — CAD xuất PDF ra GIẤY DỌC
`lib/cad/pdf.ts:391` — `new jsPDF({ unit:'mm', format:[pw,ph] })` **thiếu `orientation`** ⇒ jsPDF mặc định portrait rồi đảo khổ. Đọc `MediaBox` file thật: A3 ra `841.9×1190.6pt` = **297×420mm DỌC**, trong khi viewport tính cho 420×297 ngang. A2/A1 sai y hệt ⇒ **cắt ~30% mép phải, đúng chỗ `titleBlockPro` neo** ⇒ khung tên cụt ở MỌI lần xuất.
- **LỖI CÓ SẴN TỪ TRƯỚC**, không do đợt font: dòng tương ứng trên nhánh tích hợp (`pdf.ts:379`) y hệt.
- Củng cố: 5 chỗ dựng jsPDF khác trong repo đều truyền `orientation: 'landscape'` — riêng CAD sót. Không test nào kiểm khổ/hướng giấy CAD.
- **Sửa**: suy `orientation` từ `pw > ph` + test khoá khổ giấy cho A3/A2/A1. Đề xuất làm luôn trong `fix/vn-pdf-font` TRƯỚC khi merge (merge trước thì PDF có dấu đẹp nhưng khung tên vẫn cụt).

## 🎭 Hệ avatar — đã có nhưng MỒ CÔI (nhánh `feat/avatar-plush`)
Phát hiện: `lib/avatar.ts` + `AvatarRenderer` (SVG 200×240) + `AvatarBuilder` + `/settings/avatar` + `/api/user/avatar` + cột `User.avatar` **đã tồn tại**, nhưng `AvatarRenderer` **chỉ được dùng bên trong chính `AvatarBuilder`**. Ra ngoài app mọi người vẫn là chữ cái: `PresenceBar.tsx:72` initials · `ProjectSelect.tsx:144` gradient hash + chữ đầu · `LiveCursors.tsx:61` tên trơn · `api/dashboard/route.ts:20` không trả config avatar.
User chốt: (1) nâng SVG lên **chất búp bê nỉ 3D** (ref: chibi lông xù, kính cateye bản dày đuôi hếch, áo cổ lọ, bóng studio mềm, má ửng) · (2) **NHIỀU BIẾN THỂ để lựa** (mở rộng hạng mục cũ + thêm biểu cảm/khuyên tai/tàn nhang/màu nền/phụ kiện) · (3) nối vào **header/menu tài khoản THÔI** (chưa đụng PresenceBar/cursor/card dự án — để dành đợt sau).
⚠️ Ràng buộc đã dặn agent: `User.avatar` đã có dữ liệu thật ⇒ field mới phải optional + có mặc định, config cũ/giá trị lạ vẫn render được, có test khoá.

## Chờ USER quyết
- **Merge `fix/vn-pdf-font`**: sửa bug orientation trước rồi merge, hay merge trước?
- **Figma**: user chọn **tạo file mới trung tính**, nhưng Figma MCP trả `net::ERR_FAILED` 2 lần ⇒ chưa tạo được. Đường vòng: tự tạo file trống rồi chạy `docs/figma-bootstrap.js` (bước 1→4, idempotent, dựng 14 page + Variables 2 mode).
- **DWG**: sửa tuân thủ GPL ngay (0đ)? · đường A server-side (mất offline)? · ODA khi bán? → `docs/RESEARCH-DWG-LICENSE.md`
- Còn treo: **VIỆC 4** GuProfile=dữ liệu · **VIỆC 7** demo+onboarding · **#14** cụm Mẫu Presenting.

## Nợ kỹ thuật
- 🟡 `resume-state` chỉ lưu `flowId` + `sheetId` (id `cadsheet-N` trùng giữa các dự án — chỉ chọn nhầm TAB, không rò dữ liệu).
- 🟡 Audit CATALOG-STAGE2 kê node KHÔNG tồn tại (`ai.localedit`/`idmask`/`furnitureextract`) — registry thật chỉ 5 node AI_EDIT.
- 🟡 Brand Kit chưa cho upload font (chặn nhánh 2 của `lib/pdf-font.ts`).
- 🐛 `/cad-editor` React warning không tái hiện · ⌘J Vitals grep 0 kết quả · morph login chỉ fade · cursor polling idle.
- 53 ảnh `public/wallpapers/ttt-*` giữ tạm theo ý user (đã có nguồn stock thay thế).

## Quy tắc session
1. Đọc STATUS.md + `CLAUDE.md` LUẬT NỀN TẢNG trước tiên; xong task cập nhật STATUS.
2. Không tự merge/push main (auto mode chặn — user chạy tay). Bug ngoài phạm vi → ghi Nợ.
3. **LUẬT MÁU verify browser**: dev worktree PHẢI qua `127.0.0.1:<port>` (KHÔNG `localhost`); TUYỆT ĐỐI KHÔNG logout/xoá cookie. Worktree copy `.env` + DB riêng `dev.db.wt` với **DATABASE_URL ABSOLUTE** (relative gây Prisma P2021).
4. Agent: **KHÔNG sub-agent · KHÔNG `spawn_task`** (đẻ phiên lạc → cuốn commit). Max 5 worktree.
5. **Vai trò**: phóng agent code, KHÔNG tự làm (memory `role-agentic-not-hands-on`). Việc "cần thiết": gitops/verify/memory/đề xuất.
6. Login demo: `demo@if.local` / `demo1234`.
