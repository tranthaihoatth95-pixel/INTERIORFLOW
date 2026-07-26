# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (26/07 — sau merge)
- Nhánh tích hợp `feat/present-layout-ml-p1` @ `111655a`, **3 commit vượt `origin/main`** — chờ user push tay.
- ✅ **ĐÃ MERGE cả 2 nhánh chờ** (user OK): `54b4b31` ← `feat/avatar-plush` · `96c046a` ← `fix/vn-pdf-font` (#25). Chi tiết → `CHANGELOG.md` 26/07.
- tsc 0 · **93/93 file test PASS** (`node_modules/.bin/sucrase-node <path>.test.ts` — repo KHÔNG có vitest). Không dev server nào chiếm :3000.
- Verify độc lập (dựng PDF THẬT, đọc byte thô): MediaBox A3 = 420×297mm NGANG **và** cùng file có `/FontFile2` + `/BaseFont /BeVietnamPro` — 21 ok / 0 fail. **Hai fix cùng sống.**
- 🗑️ 6 folder `~/Downloads/interiorflow-wt-*` cũ = **rác mồ côi chỉ chứa `.next`**, không commit lạc. Xoá được — chờ user.

## Worktree đang mở (1)
1. **`interiorflow-wt-avatar-2`** — `feat/avatar-plush-2` @ `96c046a`, chưa có commit. Đã copy `.env` + `DATABASE_URL` tuyệt đối + symlink `node_modules`. Dựng cho avatar đợt 2, **chưa agent nào chạy**.

## ⛔ CHẶN — `Agent` bị auto-mode classifier chặn (26/07)
Phóng agent code cho avatar đợt 2 → **"Blocked by classifier"**. User quyết: (a) cấp quyền `Agent` · (b) chạy phiên interactive · (c) cho Claude tự code (phá memory `role-agentic-not-hands-on`).

## 🎭 Avatar — đợt 1 ĐÃ MERGE (`54b4b31`), đợt 2 THẨM MỸ chưa làm
Tổ hợp **172.800 → 42.152.140.800**. Nối `Header.tsx > UserChip` (24px) + `MobileMenu.tsx > AccountRow` (36px).
- Tương thích ngược: key cũ giữ nghĩa, danh sách chỉ nối thêm CUỐI, field thiếu → `LEGACY_DEFAULTS` (không random).
- ⚠️ **Đổi hành vi**: user CHƯA từng lưu avatar sẽ nhận mặt khác trước (sửa bug `randomAvatarFromId` dùng chung 1 hash).
- Hiệu năng: filter (feTurbulence + 3 blur) **chỉ bật khi `size > 48`**; prop `detail` ép tay; id `<defs>` gắn `useId()`.
- 🔴 **ĐỢT 2 — 4 lỗi thẩm mỹ chủ dự án đã soi** (`/tmp/avatar-preview/grid-a|b|c.svg.png`):
  1. chưa ra chất **nỉ/lông** — vẫn gradient vector mượt; ref có **xơ vải rõ ở tóc + áo len**;
  2. **tóc mỏng dán sát đầu** như mũ lưỡi trai, hair **1/2/7/8/14 gần trùng nhau**;
  3. **kính quá khổ, tụt thấp** — ra "hai cục đen" thay vì cateye bản dày đuôi hếch, đúng tầm mắt;
  4. màu tóc `silver`/`ash`/`platinum` gần trùng.
  Ràng buộc: KHÔNG đổi kiến trúc / thêm hạng mục · giữ tương thích ngược · giữ ngưỡng `size > 48` · render PNG ở **đúng 24/36/200px** để soi (24/36 là cỡ THẬT ở Header/MobileMenu).
- Chưa đụng PresenceBar / LiveCursors / ProjectSelect / Chat / Dashboard (cố ý — vẫn hiện chữ cái).

## Chờ USER quyết
- **Push `111655a`** lên `origin/main` (3 commit) — Claude không tự push.
- **Gỡ chặn Agent tool** để làm avatar đợt 2.
- **Figma**: chọn tạo file mới trung tính; MCP trả `net::ERR_FAILED` 2 lần. Đường vòng: file trống + `docs/figma-bootstrap.js` (idempotent).
- **DWG**: sửa tuân thủ GPL ngay (0đ)? · đường A server-side (mất offline)? · ODA khi bán? → `docs/RESEARCH-DWG-LICENSE.md`
- Treo: **VIỆC 4** GuProfile=dữ liệu · **VIỆC 7** demo+onboarding · **#14** cụm Mẫu Presenting.

## Nợ kỹ thuật
- 🟡 `lib/cad/pdf.ts:383` nhắc `lib/cad/pdf.node-check.mjs` — **file KHÔNG tồn tại**. Sửa comment hoặc dựng lại script.
- 🟡 Brand Kit chưa cho upload font ⇒ nhánh "Brand Kit" của `lib/pdf-font.ts` LUÔN rơi về mặc định (`BrandKit.fonts` chỉ là `FontPairing` enum, `lib/slides.ts:90`).
- 🟡 `resume-state` chỉ lưu `flowId` + `sheetId` (id `cadsheet-N` trùng giữa dự án — chọn nhầm TAB, không rò dữ liệu).
- 🟡 Audit CATALOG-STAGE2 kê node KHÔNG tồn tại (`ai.localedit`/`idmask`/`furnitureextract`) — registry thật 5 node AI_EDIT.
- 🟡 3 nhánh `worktree-agent-*` đã merged còn local; `fix/hatch-t-junction` + `fix/quality-pipeline` chưa merge — chờ user.
- 🐛 `/cad-editor` React warning không tái hiện · ⌘J Vitals grep 0 kết quả · morph login chỉ fade · cursor polling idle.
- 53 ảnh `public/wallpapers/ttt-*` giữ tạm theo ý user (đã có nguồn stock thay).

## Quy tắc session
*(worktree/context/LUẬT NỀN TẢNG → `CLAUDE.md`, tự nạp mỗi phiên. Đây chỉ là phần KHÔNG có ở đó.)*
1. Không tự merge/push **main**; merge vào nhánh tích hợp phải có user OK. Bug ngoài phạm vi → ghi Nợ.
2. **LUẬT MÁU verify browser**: dev worktree qua `127.0.0.1:<port>` (KHÔNG `localhost`); KHÔNG logout/xoá cookie. Worktree copy `.env` + DB riêng `dev.db.wt`, **DATABASE_URL ABSOLUTE** (relative gây Prisma P2021).
3. **KHÔNG sub-agent · KHÔNG `spawn_task`**. **Vai trò**: phóng agent code, KHÔNG tự làm (memory `role-agentic-not-hands-on`).
4. Login demo: `demo@if.local` / `demo1234`.
