# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (28/07 — PROMPT-2807-RUN VIỆC 2-8 xong + kiểm chứng + 2 fix onboarding)
- ✅ **`origin/main`** đã có: menu ngữ cảnh Present hết tràn viewport (`Popover.tsx` dùng chung,
  848eaf2) · Vitals nút nổi + ⌘J/Ctrl+J (1ecbbe7) · `.idf` migration path (80e2c5b) · backup
  `.ifpack` (5a0aad2) · token cỡ chữ 3 màn + gỡ hardcode TTT avatar builder (56a6459) · audit
  `docs/UI-SYSTEM-AUDIT.md` + kế hoạch `docs/PLAN-LIBRARY-GATEWAY.md` (2bb1f73). Chi tiết đầy đủ
  từng việc → `CHANGELOG.md` mục "27/07 tối"/"28/07".
- ✅ **KIỂM CHỨNG (28/07)** — đối chiếu git log + code thật: onboarding 3 tầng đủ cả 3 chặng trong
  code; glass-card khớp 4/5 giá trị yêu cầu (riêng `background` là gradient-tint có sẵn, không
  phải rgba phẳng); `--accent` = `#6a57f5` (đổi từ `#8b7cf7` vì WCAG AA, tự tính lại contrast
  đúng 4.89:1); SPEC-FILE-MANAGER §7 xác nhận thuần docs, 0 code.
- ✅ **Onboarding — 2 fix nhỏ (28/07)**: (1) "Xem lại hướng dẫn" trước chỉ reset Tầng 1+2, thiếu
  Tầng 3 (coachmark) — đã thêm `resetCoachmarkSeen()`/`COACHMARKS` (`8da38d6`). (2) Verify Tầng 2
  ở Present bằng browser thật — **không lỗi**: `StageIntroCard` hiện đúng 3 dòng + ảnh before/after,
  0 console error mới (đã loại trừ log tồn đọng bằng marker). Vậy Tầng 2 nay đã verify đủ CẢ 3
  CHẶNG (CAD/Render/Present), không chỉ CAD+Render như commit gốc ghi.
- ⏸️ **CHƯA gộp "Upload" + "Nạp vào thư viện"** — KHÁC chức năng thật (xem `docs/PLAN-LIBRARY-
  GATEWAY.md` NT1). Đang chờ Hoà quyết 4 câu hỏi trong đó.
- **Lưu ý dev server**: `.next` cache hay hỏng sau nhiều HMR/git stash — trang trắng/lỗi "Cannot
  find module vendor-chunks" → xoá `.next` rồi khởi động lại, không phải bug code.
- ⏸️ **T3/T4 (Semantic Room)** vẫn CHƯA LÀM — để phiên sau, đọc `docs/IF1-COMPLETION-AUDIT.md`
  §3 (a)/(d) trước.

## Worktree đang mở
Không có.

## Chờ USER quyết
- **T3/T4** (Semantic Room sprint, phần còn lại): làm tiếp phiên sau — xem `docs/CHANGELOG.md`
  phần "26/07 khuya" cho lý do kỹ thuật đã chốt (T1/T2) trước khi bắt đầu T3/T4.
- **Figma**: MCP trả `net::ERR_FAILED` 2 lần. Đường vòng: file trống + `docs/figma-bootstrap.js`.
- **DWG**: sửa tuân thủ GPL ngay (0đ)? · server-side (mất offline)? · ODA khi bán? →
  `docs/RESEARCH-DWG-LICENSE.md`.
- Treo: **VIỆC 4 cũ** GuProfile=dữ liệu · **#14** cụm Mẫu Presenting.
- 3 nhánh `worktree-agent-*` merged còn local; `fix/hatch-t-junction`+`fix/quality-pipeline`
  chưa merge — xoá được không?
- BOQ (bảng thống kê vật tư): audit xác nhận 0 dòng code — cần quyết có làm không, matId nối
  vào đâu (xem IF1-COMPLETION-AUDIT §3c).

## Nợ kỹ thuật
- 🟡 `lib/cad/pdf.ts:383` nhắc `lib/cad/pdf.node-check.mjs` — file KHÔNG tồn tại.
- 🟡 Brand Kit chưa cho upload font ⇒ `lib/pdf-font.ts` LUÔN rơi về mặc định.
- 🟡 `resume-state` chỉ lưu `flowId`+`sheetId` (trùng giữa dự án — chọn nhầm TAB, không rò dữ liệu).
- 🟡 Audit CATALOG-STAGE2 kê node ma (`ai.localedit`/`idmask`/`furnitureextract`) — registry thật 5 node AI_EDIT.
- 🟡 `lastEditedDevice` (4 model local-first) luôn null — chưa có `deviceId` thật, cần dựng TRƯỚC Pha 2.
- 🟡 `Toolbar.tsx` (present-editor) `Btn` chưa dùng `Tooltip.tsx` · `CadToolbar.tsx` dư `title=`+`<Tooltip>`.
- 🟡 `FINAL_ARCHITECTURE_REPORT.md`/`HUONG-DAN-SU-DUNG.md` framing cũ "nội bộ TTT" — đã gắn ⚠️, cần viết lại.
- 🟡 Wall cũ (trước T2) không có `wallKind` — báo "chưa phân loại", KHÔNG tự gán; cần UI bulk-assign nếu muốn phủ hết (không phải bug).
- 🟡 **Luật 8 — LLM↔Hình học**: `lib/cad/ai-assist.ts` ĐÃ ĐÚNG kiến trúc nhưng chưa có LLM thật
  cắm vào; khi cắm cần zod validate chặn AI trả toạ độ lạ + nối `checker.ts` thành vòng lặp
  tự-sửa/tự-chặn-ship thật (hiện chỉ skip-and-note) như `SPEC-SEMANTIC-MODEL.md` §8 mô tả.
- 🐛 `/cad-editor` React warning không tái hiện · morph login chỉ fade · cursor polling idle.
- 🟡 **Vitals**: chat thật, gesture+nút+⌘J cả 3 chặng, gọi NVIDIA/Ollama thật. Thiếu function-
  calling — chỉ nói chuyện, chưa sửa được CAD/Render/Present (`SPEC-VITALS-AI.md` §Nhóm 4).
- 🟡 **`docs/UI-SYSTEM-AUDIT.md` (28/07)**: menu/dropdown chưa lật hướng (ngoài `Popover.tsx`) ·
  `/settings/avatar` không có nút quay lại · Present drag-state vẫn đè toolbar · lỗi raw HTTP
  status ở `NodeExtras.tsx`/`ProjectMembersPanel.tsx` — top 5 xếp theo rẻ×tác động trong file.
- 53 ảnh `public/wallpapers/ttt-*` giữ tạm theo ý user.

## Quy tắc session
*(worktree/LUẬT NỀN TẢNG → `CLAUDE.md`. Chi tiết đầy đủ → memory: `feedback-docs-never-overwrite`, `feedback-verify-before-trust`, `project-ben-doc-bundle-workflow`.)*
1. Không tự merge/push **main** nếu chưa hỏi; đã hỏi rồi thì tự làm (đã push xong lần này).
2. **LUẬT MÁU verify browser**: qua `127.0.0.1:<port>` (KHÔNG `localhost`); KHÔNG logout/xoá cookie.
3. Login demo: `demo@if.local` / `demo1234`.
