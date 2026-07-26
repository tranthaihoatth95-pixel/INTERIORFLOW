# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (26/07 — sau sprint "ĐỔ NỀN 1B")
- Nhánh tích hợp `feat/present-layout-ml-p1` @ `fce61cb`, **~16 commit vượt `origin/main`** — chờ user push tay.
- tsc 0 · **93/93 file test PASS** (`node_modules/.bin/sucrase-node <path>.test.ts`).
- **Local-first**: mô hình phát hành CHỐT = desktop đóng gói Windows+macOS Pha 1, sync 1 chiều Pha 2, 2 chiều (Turso/PowerSync) Pha 3 — chi tiết `docs/IF-CORE-SCHEMA.md` §1D. `Project/Flow/LibraryAsset/ProjectMember` đã thêm `rev`/`deletedAt`/`lastEditedBy` + mọi query chuyển sang xoá mềm (verify runtime thật 12/12, không mock).
- **docs/ dựng lại**: `docs/APP-MAP.md` (+ `.mermaid`) — cây thư mục/route/API đọc từ code thật. 5 file kiến trúc gốc move vào `docs/`; bundle 11 file kiến trúc user dán đã tách xong (1 xung đột thật với `IF-CORE-SCHEMA.md` sống — đã hỏi trước khi ghi, chèn bổ sung §3 thay vì đè). `DEPLOY-CHECKLIST.md` (cloud Vercel+Supabase) đã DEPRECATED — sai mô hình.
- **Sprint "ĐỔ NỀN 1B — dọn route song song"** (T1+T2 code xong, mỗi task 1 commit, verify browser thật qua 2 tab 2 project):
  - T1 (`a678acd`): `/cad-editor`, `/present-editor`, `/photo-editor` ĐÃ LÀ redirect từ trước (Task #21) — sửa đúng chỗ sai: không có project active thì KHÔNG còn render màn cũ tại chỗ (vi phạm scope:'project' bắt buộc projectId), nay `router.replace('/?notice=choose-project')` + banner dismissible ở ProjectSelect.
  - T2 (`fce61cb`): `/cad-library-demo` + `/demo-resort` gắn cờ `NEXT_PUBLIC_DEMO` — production build redirect `/`.
  - T3 (báo cáo, xem CHANGELOG 26/07 để đọc lại): `/present` **KHÁC HẲN** `/present-editor` — deck demo dựng sẵn 0 auth/0 mạng, KHÔNG đọc project từ store, cố ý KHÔNG gộp vào T1. Library không có route riêng — là `LibraryPanel` nhúng trong `HomeScreen` (chặng Render).
- Không dev server nào chiếm :3000 ngoài phiên đang test.

## Worktree đang mở (1)
1. **`interiorflow-wt-avatar-2`** — `feat/avatar-plush-2` @ `2d07190`, **7 commit, SẠCH, CHỜ MERGE**. Agent đã xong cả 5 lỗi thẩm mỹ đợt 2 (bug bịt mắt hair 8/16 · chất nỉ · khối tóc + phân biệt 16 kiểu · kính cateye · 3 màu bạc) — verify runtime: tsc 0, 94/94 test (không hồi quy), trial-merge 0 conflict.

## Chờ USER quyết
- **Merge `feat/avatar-plush-2`** vào nhánh tích hợp — 0 conflict, sẵn sàng.
- **Push `fce61cb`** lên `origin/main`.
- **Figma**: MCP trả `net::ERR_FAILED` 2 lần. Đường vòng: file trống + `docs/figma-bootstrap.js`.
- **DWG**: sửa tuân thủ GPL ngay (0đ)? · server-side (mất offline)? · ODA khi bán? → `docs/RESEARCH-DWG-LICENSE.md`.
- Treo: **VIỆC 4** GuProfile=dữ liệu · **VIỆC 7** demo+onboarding · **#14** cụm Mẫu Presenting.
- **6 route không entry UI** (`docs/APP-MAP.md` §2): T1/T2 xử 3 route redirect + 2 route demo; còn `/report`, `/library/ingest`, `/intro` — quyết xoá hẳn / giữ demo có watermark / khôi phục vào luồng.

## Nợ kỹ thuật
- 🟡 `lib/cad/pdf.ts:383` nhắc `lib/cad/pdf.node-check.mjs` — **file KHÔNG tồn tại**.
- 🟡 Brand Kit chưa cho upload font ⇒ nhánh "Brand Kit" của `lib/pdf-font.ts` LUÔN rơi về mặc định.
- 🟡 `resume-state` chỉ lưu `flowId`+`sheetId` (trùng giữa dự án — chọn nhầm TAB, không rò dữ liệu).
- 🟡 Audit CATALOG-STAGE2 kê node ma (`ai.localedit`/`idmask`/`furnitureextract`) — registry thật 5 node AI_EDIT.
- 🟡 3 nhánh `worktree-agent-*` merged còn local; `fix/hatch-t-junction`+`fix/quality-pipeline` chưa merge.
- 🟡 `lastEditedDevice` (4 model local-first) luôn null — chưa có cơ chế `deviceId` thật, cần dựng TRƯỚC Pha 2.
- 🐛 `/cad-editor` React warning không tái hiện · ⌘J Vitals grep 0 · morph login chỉ fade · cursor polling idle.
- 53 ảnh `public/wallpapers/ttt-*` giữ tạm theo ý user.

## Quy tắc session
*(worktree/context/LUẬT NỀN TẢNG → `CLAUDE.md`, tự nạp mỗi phiên. Đây chỉ là phần KHÔNG có ở đó.)*
1. Không tự merge/push **main**; merge vào nhánh tích hợp phải có user OK. Bug ngoài phạm vi → ghi Nợ.
2. **LUẬT MÁU verify browser**: qua `127.0.0.1:<port>` (KHÔNG `localhost`); KHÔNG logout/xoá cookie. Worktree copy `.env` + DB riêng, **DATABASE_URL ABSOLUTE**.
3. **Docs là nguồn chân lý** — file đã sống trong `docs/` KHÔNG BAO GIỜ ghi đè bằng bản dán từ ngoài, chỉ bổ sung phần thiếu (memory `feedback-docs-never-overwrite`).
4. Login demo: `demo@if.local` / `demo1234`.
