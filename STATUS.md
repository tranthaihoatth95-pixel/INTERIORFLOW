# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = 3 chặng **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` mục LUẬT NỀN TẢNG**: IF là sản phẩm ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử chi tiết → `CHANGELOG.md` (KHÔNG đọc mỗi phiên).

## Hiện tại (26/07 — phiên khuya)
- Nhánh tích hợp `feat/present-layout-ml-p1` @ `488e57c`. **2 commit vượt `origin/main`** (`b5ca821` fix orientation + `488e57c` docs) — cần push tay.
- tsc PASS · **93/93 file test** (`node_modules/.bin/sucrase-node <path>.test.ts` — repo KHÔNG có vitest).
- ⚠️ Phiên này chạy nhầm gốc (`~/TTT Design system`) → memory rơi vào bộ nhớ TTT, `.claude/launch.json` phải dùng `npm --prefix`. **Phiên sau mở bằng `cd ~/Downloads/interiorflow && claude`.**
- ⚠️ Có thể còn **dev server :3000** chạy nền (mở qua preview_start) — kiểm `lsof -ti:3000`, tắt nếu thừa.

## Worktree đang mở (2)
1. **`interiorflow-wt-pdf-font`** — nhánh `fix/vn-pdf-font` @ `a65daaf`, **sạch, XONG, đã verify, CHỜ MERGE**.
2. **`interiorflow-wt-avatar`** — nhánh `feat/avatar-plush` @ `64eba00`. ✅ **AGENT ĐÃ XONG, worktree SẠCH, không còn ai giữ.** Tự do đọc/ghi/merge.

## ✅ #25 — PDF hết mất dấu tiếng Việt (nhánh `fix/vn-pdf-font`, 4 commit)
`b2af06a` font · `57c256f` `lib/pdf-font.ts` + test · `02a1ae7` nối vào `standards-report.ts`/`pdf.ts`/`CadEditor` · `a65daaf` khung tên hết tràn ô + `⌀`→`Ø`.
- Nhúng **Be Vietnam Pro** Regular+Bold (SIL OFL 1.1, 273KB, `public/fonts/` + `OFL.txt` + attribution `docs/LICENSE-NOTES.md`). User chọn BVP thay Noto Sans để **một hệ chữ xuyên UI → bản vẽ → PDF → deck** (khớp `docs/FIGMA-HANDOFF.md`).
- `lib/pdf-font.ts`: resolve **caller → Brand Kit → Be Vietnam Pro → helvetica**; .ttf nạp lúc xuất (KHÔNG nhồi base64 vào bundle); chạy cả browser (`fetch`) lẫn Node (`fs`).
- 🟡 Nhánh "Brand Kit" hiện LUÔN rơi về mặc định: `BrandKit.fonts` chỉ là `FontPairing` (enum 3 preset → CSS stack hệ thống, `lib/slides.ts:90`), KHÔNG mang file font; `lib/custom-fonts.ts` không tồn tại. Mở lại khi Brand Kit cho upload .ttf.
- Verify độc lập (không chép báo cáo agent): tsc 0 · 93/93 test · PNG soi tận mắt (`/tmp/if-pdf-verify/`) · font phục vụ qua HTTP `127.0.0.1` trả 200 + sha256 khớp file repo.
- Chỉ 2/6 file jsPDF thật sự dính lỗi; 4 file kia chỉ `addImage` JPEG → cố ý KHÔNG nối font (khỏi cõng 273KB vô ích).

## ✅ ĐÃ SỬA 26/07 (`b5ca821`) — CAD xuất PDF ra GIẤY DỌC
`lib/cad/pdf.ts:384` nay là `new jsPDF({ orientation: pw >= ph ? 'landscape' : 'portrait', unit:'mm', format:[pw,ph] })`. Test `[4]` trong `pdf-scale.test.ts` đo **trang THẬT qua `internal.pageSize`** cho A3/A2/A1 (không tin tham số truyền vào, vì chính jsPDF là bên đảo khổ) — 20 ok / 0 fail, tsc sạch.
Verify độc lập (chủ dự án, dựng PDF thật rồi đọc `MediaBox`): A3 `1190.55×841.89pt` = 420×297mm NGANG · A2 `1683.78×1190.55` · A1 `2383.94×1683.78`. Trước khi sửa cả 3 đều dọc.
⚠️ Bài học giữ lại: bản sửa này từng **bay mất một lần** vì chạy kiểm chứng "gỡ fix xem test có bắt không" khi file CHƯA commit. Muốn làm phép thử đó thì **commit trước**, rồi khôi phục bằng `git checkout -- <file>`, đừng dựa vào bản copy trong `/tmp`.

<details><summary>Bối cảnh gốc của bug (giữ để tra cứu)</summary>
`lib/cad/pdf.ts:391` — `new jsPDF({ unit:'mm', format:[pw,ph] })` **thiếu `orientation`** ⇒ jsPDF mặc định portrait rồi đảo khổ. Đọc `MediaBox` file thật: A3 ra `841.9×1190.6pt` = **297×420mm DỌC**, trong khi viewport tính cho 420×297 ngang. A2/A1 sai y hệt ⇒ **cắt ~30% mép phải, đúng chỗ `titleBlockPro` neo** ⇒ khung tên cụt ở MỌI lần xuất.
- **LỖI CÓ SẴN TỪ TRƯỚC**, không do đợt font: dòng tương ứng trên nhánh tích hợp (`pdf.ts:379`) y hệt.
- Củng cố: 5 chỗ dựng jsPDF khác trong repo đều truyền `orientation: 'landscape'` — riêng CAD sót. Không test nào kiểm khổ/hướng giấy CAD.
- **Sửa**: suy `orientation` từ `pw > ph` + test khoá khổ giấy cho A3/A2/A1. Đề xuất làm luôn trong `fix/vn-pdf-font` TRƯỚC khi merge (merge trước thì PDF có dấu đẹp nhưng khung tên vẫn cụt).

</details>

## 🎭 Hệ avatar — ĐÃ LÀM XONG ĐỢT 1 (nhánh `feat/avatar-plush`, 3 commit, CHỜ MERGE)
`e0f19cd` schema 13 hạng mục + tương thích ngược + test · `22050c2` vẽ lại phong cách búp bê nỉ + builder 13 slot · `64eba00` gắn vào Header/MobileMenu.
- tsc 0 · `lib/avatar.test.ts` PASS 57 assertion · cả 9 file `lib/*.test.ts` PASS · worktree sạch. Tổ hợp **172.800 → 42.152.140.800**.
- Nối vào `Header.tsx > UserChip` (24px) + `MobileMenu.tsx > AccountRow` (36px), cả hai dẫn `/settings/avatar`. Component mới `components/avatar/UserAvatar.tsx` lo parse/normalize/fallback.
- 🔑 Mắt xích ẩn đã sửa: `SessionUser` + `publicUser()` (`lib/server/auth.ts`, `lib/store.ts`) **chưa từng trả cột `avatar`** về client ⇒ trước đây không có dữ liệu để vẽ.
- Tương thích ngược: key cũ giữ nguyên nghĩa, danh sách chỉ nối thêm cuối, field thiếu → `LEGACY_DEFAULTS` (không random) ⇒ ai đã lưu avatar thì mặt KHÔNG đổi. Test khoá: 12 input rác, 300 seed, round-trip 13 field.
- ⚠️ **Thay đổi hành vi**: user CHƯA từng lưu avatar sẽ nhận mặt khác trước, do sửa bug `randomAvatarFromId` cũ (dùng chung 1 hash chia hằng số ⇒ id gần nhau ra avatar gần giống hệt).
- Hiệu năng: filter (feTurbulence + 3 gaussian blur) **chỉ bật khi `size > 48`**, nhỏ hơn dùng bản phẳng; có prop `detail` ép tay; id `<defs>` gắn `useId()`.
- 🔴 **THẨM MỸ CHƯA ĐẠT — cần đợt 2** (chủ dự án soi ảnh `/tmp/avatar-preview/grid-a|b|c.svg.png`): chưa ra chất **nỉ/lông** (vẫn gradient vector mượt, ref có xơ vải rõ ở tóc + áo len) · **tóc mỏng dán sát đầu** như mũ lưỡi trai, hair 1/2/7/8/14 gần như trùng nhau · **kính quá khổ, tụt thấp**, đọc ra "hai cục đen" hơn là mắt mèo · màu tóc `silver`/`ash`/`platinum` gần trùng.
- Chưa đụng PresenceBar / LiveCursors / ProjectSelect / Chat / Dashboard (cố ý, để đợt sau).

## 🎭 Bối cảnh gốc — vì sao avatar từng MỒ CÔI
Phát hiện: `lib/avatar.ts` + `AvatarRenderer` (SVG 200×240) + `AvatarBuilder` + `/settings/avatar` + `/api/user/avatar` + cột `User.avatar` **đã tồn tại**, nhưng `AvatarRenderer` **chỉ được dùng bên trong chính `AvatarBuilder`**. Ra ngoài app mọi người vẫn là chữ cái: `PresenceBar.tsx:72` initials · `ProjectSelect.tsx:144` gradient hash + chữ đầu · `LiveCursors.tsx:61` tên trơn · `api/dashboard/route.ts:20` không trả config avatar.
User chốt: (1) nâng SVG lên **chất búp bê nỉ 3D** (ref: chibi lông xù, kính cateye bản dày đuôi hếch, áo cổ lọ, bóng studio mềm, má ửng) · (2) **NHIỀU BIẾN THỂ để lựa** (mở rộng hạng mục cũ + thêm biểu cảm/khuyên tai/tàn nhang/màu nền/phụ kiện) · (3) nối vào **header/menu tài khoản THÔI** (chưa đụng PresenceBar/cursor/card dự án — để dành đợt sau).
⚠️ Ràng buộc đã dặn agent: `User.avatar` đã có dữ liệu thật ⇒ field mới phải optional + có mặc định, config cũ/giá trị lạ vẫn render được, có test khoá.

## Chờ USER quyết
- **Merge 2 nhánh đang chờ**: `fix/vn-pdf-font` (4 commit, #25) và `feat/avatar-plush` (3 commit, avatar đợt 1). Bug orientation đã sửa THẲNG trên nhánh tích hợp (`b5ca821`) nên không còn chặn.
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
