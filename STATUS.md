# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (26/07 khuya — sau audit IF1 + Sprint Semantic Room T1/T2, dừng giữa chừng)
- ✅ **`origin/main` đã push** = `1ec4dde` (fast-forward 4 commit từ `da310d9`, `npm run build` +
  tsc sạch, verify độc lập không tin báo cáo agent). Chi tiết đầy đủ → CHANGELOG 26/07 khuya.
- ✅ **`docs/IF1-COMPLETION-AUDIT.md`** (mới) — đối soát code thật 101 item spec + PS-0..11:
  CAD 81% · Present 64% · Render ~65-70% (độ tin cậy thấp). 4 điều kiện M1 cho IF2: `.idf`
  version có nhưng chưa migration · semantic model chỉ Zone có ngữ nghĩa thật (trước T1/T2) ·
  matId→BOQ **0 kết quả** toàn repo · RBAC tốt, thiếu backup thật + onboarding wizard.
- ✅ **docs/ phân loại đầy đủ** — 79 file + `docs/archive/` (2 file: `LICENSE-NOTES.md`,
  `DEPLOY-VERCEL.md`) gắn nhãn 🟢/🔵/🟡/🔴 trong `docs/README.md`.
- ✅ **Gói tài liệu đợt 4-11** — 9 phần (6 bổ sung + 2 file mới: `SPEC-BRIEF-INTAKE.md`,
  `SPEC-STAGE-0-IDEATION.md`) đã tách vào `docs/`, không ghi đè file sống. Blueprint thêm
  CHẶNG 0 · Ý TƯỞNG (Ý tưởng → CAD → Render → Present).
- ✅ **T1 — roomType persisted** (`709f6d6`) — Room không còn suy luận lại công năng từ text
  label mỗi lần checker chạy; `roomType?: RoomKind` lưu thật trên `TextEntity` + backfill 1 lần
  cho phòng cũ (cả autosave-restore lẫn `.idf` import) + UI chọn công năng. Nghiệm thu đạt: đổi
  label không mất công năng, có test khoá lại.
- ✅ **T2 — wallKind/wallStructural/wallThicknessMm** (`1ec4dde`) — field ở `Base` (không có
  `WallEntity` riêng) + `wallKindSummary()` (đếm exterior/interior/unclassified). **LỆCH có chủ
  ý (ghi rõ trong commit)**: KHÔNG backfill wallKind từ hình học cho tường cũ (không có DCEL
  outer-boundary utility đáng tin cậy) và KHÔNG bịa trích dẫn quy chuẩn độ dày tường.
- ⏸️ **T3 (.idf migration path) và T4 (backup .ifpack) CHƯA LÀM** — dừng theo lệnh user (hạn mức
  tuần sắp hết), để phiên sau. Đọc trước khi làm: `docs/IF1-COMPLETION-AUDIT.md` §3 mục (a)/(d).
- tsc 0 · **97/97 file test PASS** (`node_modules/.bin/sucrase-node <path>.test.ts`) · build sạch.
- Không dev server nào chiếm :3000 ngoài phiên đang test.

## Worktree đang mở
Không có.

## Chờ USER quyết
- **T3/T4** (Semantic Room sprint, phần còn lại): làm tiếp phiên sau — xem `docs/CHANGELOG.md`
  phần "26/07 khuya" cho lý do kỹ thuật đã chốt (T1/T2) trước khi bắt đầu T3/T4.
- **Figma**: MCP trả `net::ERR_FAILED` 2 lần. Đường vòng: file trống + `docs/figma-bootstrap.js`.
- **DWG**: sửa tuân thủ GPL ngay (0đ)? · server-side (mất offline)? · ODA khi bán? →
  `docs/RESEARCH-DWG-LICENSE.md`.
- Treo: **VIỆC 4 cũ** GuProfile=dữ liệu · **VIỆC 7** demo+onboarding · **#14** cụm Mẫu Presenting.
- 3 nhánh git rác `worktree-agent-*` đã merged còn local; `fix/hatch-t-junction` +
  `fix/quality-pipeline` chưa merge — xoá được không?
- BOQ (bảng thống kê vật tư): audit xác nhận 0 dòng code — cần quyết có làm không, matId nối
  vào đâu (xem IF1-COMPLETION-AUDIT §3c).

## Nợ kỹ thuật
- 🟡 `lib/cad/pdf.ts:383` nhắc `lib/cad/pdf.node-check.mjs` — file KHÔNG tồn tại.
- 🟡 Brand Kit chưa cho upload font ⇒ `lib/pdf-font.ts` LUÔN rơi về mặc định.
- 🟡 `resume-state` chỉ lưu `flowId`+`sheetId` (trùng giữa dự án — chọn nhầm TAB, không rò dữ liệu).
- 🟡 Audit CATALOG-STAGE2 kê node ma (`ai.localedit`/`idmask`/`furnitureextract`) — registry thật 5 node AI_EDIT.
- 🟡 `lastEditedDevice` (4 model local-first) luôn null — chưa có `deviceId` thật, cần dựng TRƯỚC Pha 2.
- 🟡 `Toolbar.tsx` (present-editor) `Btn` chưa dùng `Tooltip.tsx` · `CadToolbar.tsx` dư cả `title=` lẫn `<Tooltip>`.
- 🟡 `FINAL_ARCHITECTURE_REPORT.md` + `HUONG-DAN-SU-DUNG.md` framing cũ "nội bộ TTT" — đã gắn ⚠️ đầu file, cần viết lại (đợt de-TTT 2).
- 🟡 Wall cũ (trước T2) không có `wallKind` — báo "chưa phân loại", KHÔNG tự gán; cần UI bulk-assign nếu muốn phủ hết (không phải bug).
- 🟡 `.idf` chưa có migration path thật (version lệch = từ chối thẳng) — T3 sẽ giải quyết.
- 🐛 `/cad-editor` React warning không tái hiện · ⌘J Vitals grep 0 · morph login chỉ fade · cursor polling idle.
- 53 ảnh `public/wallpapers/ttt-*` giữ tạm theo ý user.

## Quy tắc session
*(worktree/LUẬT NỀN TẢNG → `CLAUDE.md`. Chi tiết đầy đủ → memory: `feedback-docs-never-overwrite`, `feedback-verify-before-trust`, `project-ben-doc-bundle-workflow`.)*
1. Không tự merge/push **main** nếu chưa hỏi; đã hỏi rồi thì tự làm (đã push xong lần này).
2. **LUẬT MÁU verify browser**: qua `127.0.0.1:<port>` (KHÔNG `localhost`); KHÔNG logout/xoá cookie.
3. Login demo: `demo@if.local` / `demo1234`.
