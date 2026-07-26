# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (26/07 tối — sau batch 5 việc + avatar merge)
- Nhánh tích hợp `feat/present-layout-ml-p1` @ `a25cb22`, **~21 commit vượt `origin/main`** — chờ user push tay.
- tsc 0 · **95/95 file test PASS** (`node_modules/.bin/sucrase-node <path>.test.ts` — repo KHÔNG có vitest).
- ✅ **Avatar đợt 2 ĐÃ MERGE** (`a83e943`) — hết mồ côi worktree, xong cả 5 lỗi thẩm mỹ.
- ✅ **6 route 🔴 xử xong toàn bộ** (`docs/APP-MAP.md` §2): 3 route redirect cũ sửa fallback (Sprint ĐỔ NỀN 1B) · demo gắn `NEXT_PUBLIC_DEMO` · `/library/ingest` có entry · `/intro` nối first-run · `/report` xoá (nội dung meta, hết vòng đời). Chi tiết → CHANGELOG 26/07 tối.
- ✅ **Rail tooltip đồng bộ 3 chặng** — `Tooltip.tsx` dùng chung, thêm chế độ nhãn tĩnh cho cảm ứng thật (`@media hover:none`).
- ✅ **CAD "cảm giác tay" Sprint ĐỔ NỀN 2** — snap priority đúng chuẩn AutoCAD OSNAP (test khoá 6 case) + Alt tắt tạm snap · **fix bug thật**: rect/room từng SẬP thành đường khi bật F8 Ortho (dùng chung constraint sai với line) · dimension tooltip + undo history panel (mới) đã có/hoạt động, verify browser thật từng cái.
- **Local-first**: mô hình phát hành CHỐT = desktop Windows+macOS Pha 1 (không sync) → push 1 chiều Pha 2 → 2 chiều Turso/PowerSync Pha 3 (`docs/IF-CORE-SCHEMA.md` §1D). 4 model đã có `rev`/`deletedAt`/`lastEditedBy` + xoá mềm (verify runtime 12/12).
- **docs/ dựng lại**: `docs/APP-MAP.md` (+`.mermaid`), bundle 15 file kiến trúc user dán đã tách xong (0 ghi đè — chỉ bổ sung phần thiếu vào file đã sống). `DEPLOY-CHECKLIST.md` DEPRECATED (sai mô hình cloud).
- Không dev server nào chiếm :3000 ngoài phiên đang test.

## Worktree đang mở
Không còn — `interiorflow-wt-avatar-2` đã gỡ sau merge.

## Chờ USER quyết
- **Push `a25cb22`** lên `origin/main` (~21 commit).
- **Figma**: MCP trả `net::ERR_FAILED` 2 lần. Đường vòng: file trống + `docs/figma-bootstrap.js`.
- **DWG**: sửa tuân thủ GPL ngay (0đ)? · server-side (mất offline)? · ODA khi bán? → `docs/RESEARCH-DWG-LICENSE.md`.
- Treo: **VIỆC 4 cũ** GuProfile=dữ liệu · **VIỆC 7** demo+onboarding · **#14** cụm Mẫu Presenting.
- 3 nhánh git rác `worktree-agent-*` đã merged còn local; `fix/hatch-t-junction`+`fix/quality-pipeline` chưa merge — xoá được không?

## Nợ kỹ thuật
- 🟡 `lib/cad/pdf.ts:383` nhắc `lib/cad/pdf.node-check.mjs` — **file KHÔNG tồn tại**.
- 🟡 `docs/IF-FEATURE-UPGRADES.md` + `IF-FEATURE-SPEC-P1*.md` được `CLAUDE.md`/blueprint dẫn chiếu nhưng **KHÔNG tồn tại trong repo** — phát hiện khi làm Sprint ĐỔ NỀN 2, phải suy tiêu chí nghiệm thu trực tiếp từ user thay vì đọc spec gốc.
- 🟡 Brand Kit chưa cho upload font ⇒ nhánh "Brand Kit" của `lib/pdf-font.ts` LUÔN rơi về mặc định.
- 🟡 `resume-state` chỉ lưu `flowId`+`sheetId` (trùng giữa dự án — chọn nhầm TAB, không rò dữ liệu).
- 🟡 Audit CATALOG-STAGE2 kê node ma (`ai.localedit`/`idmask`/`furnitureextract`) — registry thật 5 node AI_EDIT.
- 🟡 `lastEditedDevice` (4 model local-first) luôn null — chưa có cơ chế `deviceId` thật, cần dựng TRƯỚC Pha 2.
- 🟡 `components/present-editor/Toolbar.tsx` — component `Btn` (nút có chữ, khác `IconOnly`) chưa dùng `Tooltip.tsx`, còn `title=` thô (phát hiện khi làm VIỆC 3, ít cấp thiết vì đã có label chữ sẵn).
- 🟡 `CadToolbar.tsx` giữ cả `title=` LẪN `<Tooltip>` trên cùng nút (dư, có sẵn từ trước) — có thể gây tooltip đúp tuỳ trình duyệt.
- 🐛 `/cad-editor` React warning không tái hiện · ⌘J Vitals grep 0 · morph login chỉ fade · cursor polling idle.
- 53 ảnh `public/wallpapers/ttt-*` giữ tạm theo ý user.

## Quy tắc session
*(worktree/context/LUẬT NỀN TẢNG → `CLAUDE.md`, tự nạp mỗi phiên. Đây chỉ là phần KHÔNG có ở đó.)*
1. Không tự merge/push **main**; merge vào nhánh tích hợp phải có user OK. Bug ngoài phạm vi → ghi Nợ.
2. **LUẬT MÁU verify browser**: qua `127.0.0.1:<port>` (KHÔNG `localhost`); KHÔNG logout/xoá cookie.
3. **Docs là nguồn chân lý** — file đã sống trong `docs/` KHÔNG BAO GIỜ ghi đè bằng bản dán từ ngoài, chỉ bổ sung phần thiếu (memory `feedback-docs-never-overwrite`).
4. **Batch nhiều việc "chạy tuần tự"**: mỗi agent (Sonnet) chạy XONG + verify độc lập (tsc/test/browser thật) MỚI qua việc kế — không song song dù không có worktree riêng.
5. Login demo: `demo@if.local` / `demo1234`.
