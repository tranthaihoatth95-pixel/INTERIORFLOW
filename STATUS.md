# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = 3 chặng **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` mục LUẬT NỀN TẢNG**: IF là sản phẩm ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử chi tiết → `CHANGELOG.md` (KHÔNG đọc mỗi phiên).

## Hiện tại (26/07 — phiên khuya, sau merge)
- Nhánh tích hợp `feat/present-layout-ml-p1` @ `96c046a`, **2 commit merge vượt `origin/main`** — chờ user push tay.
- ✅ **ĐÃ MERGE cả 2 nhánh chờ** (user OK): `54b4b31` ← `feat/avatar-plush` · `96c046a` ← `fix/vn-pdf-font`.
- tsc 0 · **93/93 file test PASS** (`node_modules/.bin/sucrase-node <path>.test.ts` — repo KHÔNG có vitest; đếm thật bằng `git ls-files '*.test.ts' '*.test.tsx'`).
- Không có dev server nào chiếm :3000.
- 🗑️ 6 folder `~/Downloads/interiorflow-wt-{audit-cad,audit-fix,audit-shell,clay2img-audit,de-ttt,vitals-drag-nb-general}` là **rác mồ côi chỉ chứa `.next`** (git không còn coi là worktree, không commit lạc). Xoá được, chưa xoá vì chờ user.

## Worktree đang mở (1)
1. **`interiorflow-wt-avatar-2`** — nhánh `feat/avatar-plush-2` @ `96c046a` (mới tách, chưa có commit). Đã copy `.env` + `DATABASE_URL` tuyệt đối + symlink `node_modules`. **Dựng cho avatar đợt 2, chưa có agent nào chạy** (xem mục bên dưới).

## ⛔ CHẶN — Agent tool bị auto-mode classifier CHẶN (26/07)
Phiên này gọi `Agent` để phóng agent code cho avatar đợt 2 → **"Blocked by classifier"**. Không phóng được agent trong auto mode.
→ Cần user quyết: (a) cấp quyền cho `Agent` trong settings, (b) chạy phiên interactive để phóng agent, hay (c) cho phép Claude tự code trực tiếp (phá memory `role-agentic-not-hands-on`).

## ✅ #25 — PDF hết mất dấu tiếng Việt (ĐÃ MERGE `96c046a`)
`b2af06a` font · `57c256f` `lib/pdf-font.ts` + test · `02a1ae7` nối `standards-report.ts`/`pdf.ts`/`CadEditor` · `a65daaf` khung tên hết tràn ô + `⌀`→`Ø`.
- Nhúng **Be Vietnam Pro** Regular+Bold (SIL OFL 1.1, 273KB, `public/fonts/` + `OFL.txt` + attribution `docs/LICENSE-NOTES.md`). Một hệ chữ xuyên UI → bản vẽ → PDF → deck.
- `lib/pdf-font.ts`: resolve **caller → Brand Kit → Be Vietnam Pro → helvetica**; .ttf nạp lúc xuất (KHÔNG nhồi base64 vào bundle); chạy cả browser (`fetch`) lẫn Node (`fs`).
- 🟡 Nhánh "Brand Kit" LUÔN rơi về mặc định: `BrandKit.fonts` chỉ là `FontPairing` (enum 3 preset → CSS stack hệ thống, `lib/slides.ts:90`), KHÔNG mang file font. Mở lại khi Brand Kit cho upload .ttf.

### ⚔️ Conflict lúc merge — ĐÃ GỘP, KHÔNG MẤT FIX NÀO
`lib/cad/pdf.ts` là file DUY NHẤT conflict, đúng dòng `new jsPDF(...)`: HEAD thêm `orientation`, nhánh thêm `await ensureVietnameseFont(pdf)` ngay dưới. Hai bên **bổ sung nhau chứ không đối nghịch** ⇒ giữ CẢ HAI.
**Verify độc lập sau merge** (dựng PDF THẬT rồi đọc byte thô, không tin test): 21 ok / 0 fail —
- MediaBox A3 `1190.55×841.89pt` = 420×297mm **NGANG** · A2 `1683.78×1190.55` · A1 `2383.94×1683.78`.
- Cùng file đó có `/FontFile2` + `/BaseFont /BeVietnamPro` ⇒ font TTF **thật sự nhúng**, không rơi về helvetica.

## ✅ Bug CAD xuất giấy DỌC (`b5ca821`) — đã sửa, đã verify lại sau merge
`lib/cad/pdf.ts` nay là `new jsPDF({ orientation: pw >= ph ? 'landscape' : 'portrait', unit:'mm', format:[pw,ph] })`. Thiếu `orientation` thì jsPDF mặc định portrait rồi TỰ ĐẢO khổ ⇒ cắt ~30% mép phải, đúng chỗ `titleBlockPro` neo ⇒ khung tên cụt mọi lần xuất. Test `[4]` trong `pdf-scale.test.ts` khoá khổ A3/A2/A1.
⚠️ Bài học: bản sửa này từng **bay mất một lần** vì chạy phép thử "gỡ fix xem test có bắt không" khi file CHƯA commit. Muốn thử thì **commit trước**, khôi phục bằng `git checkout -- <file>`.

## 🎭 Avatar — đợt 1 ĐÃ MERGE (`54b4b31`), đợt 2 THẨM MỸ chưa làm
`e0f19cd` schema 13 hạng mục + tương thích ngược + test · `22050c2` vẽ lại búp bê nỉ + builder 13 slot · `64eba00` gắn Header/MobileMenu. Tổ hợp **172.800 → 42.152.140.800**.
- 🔑 Mắt xích ẩn đã sửa: `SessionUser` + `publicUser()` (`lib/server/auth.ts`, `lib/store.ts`) **chưa từng trả cột `avatar`** về client ⇒ trước đây không có dữ liệu để vẽ.
- Tương thích ngược: key cũ giữ nguyên nghĩa, danh sách chỉ nối thêm CUỐI, field thiếu → `LEGACY_DEFAULTS` (không random). Test khoá: 12 input rác, 300 seed, round-trip 13 field.
- ⚠️ **Đổi hành vi**: user CHƯA từng lưu avatar sẽ nhận mặt khác trước (sửa bug `randomAvatarFromId` cũ dùng chung 1 hash ⇒ id gần nhau ra mặt gần giống hệt).
- Hiệu năng: filter (feTurbulence + 3 gaussian blur) **chỉ bật khi `size > 48`**; prop `detail` ép tay; id `<defs>` gắn `useId()`.
- 🔴 **ĐỢT 2 — 4 lỗi thẩm mỹ chủ dự án đã soi** (`/tmp/avatar-preview/grid-a|b|c.svg.png`):
  1. chưa ra chất **nỉ/lông** — vẫn gradient vector mượt; ref có **xơ vải rõ ở tóc + áo len**;
  2. **tóc mỏng dán sát đầu** như mũ lưỡi trai, hair **1/2/7/8/14 gần trùng nhau**;
  3. **kính quá khổ, tụt thấp** — ra "hai cục đen" thay vì cateye bản dày đuôi hếch, đúng tầm mắt;
  4. màu tóc `silver`/`ash`/`platinum` gần trùng.
  Ràng buộc đợt 2: KHÔNG đổi kiến trúc/thêm hạng mục · giữ nguyên tương thích ngược · giữ ngưỡng `size > 48` · phải render PNG ở **đúng 24/36/200px** để soi (24/36 là cỡ THẬT ở Header/MobileMenu).
- Chưa đụng PresenceBar / LiveCursors / ProjectSelect / Chat / Dashboard (cố ý, để đợt sau — chúng vẫn hiện chữ cái).

## Chờ USER quyết
- **Push `96c046a` lên `origin/main`** (2 commit merge) — Claude không tự push.
- **Gỡ chặn Agent tool** để làm tiếp avatar đợt 2 (xem mục ⛔ ở trên).
- **Figma**: user chọn tạo file mới trung tính, nhưng Figma MCP trả `net::ERR_FAILED` 2 lần. Đường vòng: tự tạo file trống rồi chạy `docs/figma-bootstrap.js` (bước 1→4, idempotent, 14 page + Variables 2 mode).
- **DWG**: sửa tuân thủ GPL ngay (0đ)? · đường A server-side (mất offline)? · ODA khi bán? → `docs/RESEARCH-DWG-LICENSE.md`
- Còn treo: **VIỆC 4** GuProfile=dữ liệu · **VIỆC 7** demo+onboarding · **#14** cụm Mẫu Presenting.

## Nợ kỹ thuật
- 🟡 `lib/cad/pdf.ts:383` nhắc file `lib/cad/pdf.node-check.mjs` để verify PDF ở Node — **file này KHÔNG tồn tại**. Sửa comment hoặc dựng lại script.
- 🟡 `resume-state` chỉ lưu `flowId` + `sheetId` (id `cadsheet-N` trùng giữa các dự án — chỉ chọn nhầm TAB, không rò dữ liệu).
- 🟡 Audit CATALOG-STAGE2 kê node KHÔNG tồn tại (`ai.localedit`/`idmask`/`furnitureextract`) — registry thật chỉ 5 node AI_EDIT.
- 🟡 Brand Kit chưa cho upload font (chặn nhánh 2 của `lib/pdf-font.ts`).
- 🟡 3 nhánh `worktree-agent-*` đã merged còn nằm local; 2 nhánh chưa merge `fix/hatch-t-junction`, `fix/quality-pipeline` — cần user xác nhận trước khi xoá.
- 🐛 `/cad-editor` React warning không tái hiện · ⌘J Vitals grep 0 kết quả · morph login chỉ fade · cursor polling idle.
- 53 ảnh `public/wallpapers/ttt-*` giữ tạm theo ý user (đã có nguồn stock thay thế).

## Quy tắc session
1. Đọc STATUS.md + `CLAUDE.md` LUẬT NỀN TẢNG trước tiên; xong task cập nhật STATUS.
2. Không tự merge/push **main**. Merge vào nhánh tích hợp thì phải có user OK. Bug ngoài phạm vi → ghi Nợ.
3. **LUẬT MÁU verify browser**: dev worktree PHẢI qua `127.0.0.1:<port>` (KHÔNG `localhost`); TUYỆT ĐỐI KHÔNG logout/xoá cookie. Worktree copy `.env` + DB riêng `dev.db.wt` với **DATABASE_URL ABSOLUTE** (relative gây Prisma P2021).
4. Agent: **KHÔNG sub-agent · KHÔNG `spawn_task`** (đẻ phiên lạc → cuốn commit). Max 5 worktree.
5. **Vai trò**: phóng agent code, KHÔNG tự làm (memory `role-agentic-not-hands-on`). Việc "cần thiết": gitops/verify/memory/đề xuất.
6. **Gỡ worktree**: đủ CẢ 4 điều kiện an toàn ở `CLAUDE.md` mới gỡ, dùng `git worktree remove` + `git branch -d` (KHÔNG `--force`, KHÔNG `-D`).
7. Login demo: `demo@if.local` / `demo1234`.
