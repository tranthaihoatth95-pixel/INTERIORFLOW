# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (29/07 — SPEC TỔNG Cowork: ingest 3 file lớn + PHẦN E v4 + cảnh báo trùng mã)
Chi tiết đầy đủ → `CHANGELOG.md`. Tóm tắt phiên này:
- ⚠️ **Đổi tên file nguồn sự thật** (Cowork, phiên trước, đã git-commit `8e096a8`):
  `IF-MASTER-TREE.md` → **`docs/IF-FEATURE-TREE.md`** · `IF-MASTER-BLUEPRINT.md` →
  **`docs/IF-ARCHITECTURE-COMPASS.md`**. Tên cũ giữ dạng redirect 1 dòng — `docs/CLAUDE.md` vẫn
  còn ghi tên cũ, cần sửa khi tiện.
- ✅ **3 file lớn từ Cowork đã lưu vào repo**: `docs/SPEC-TONG-COWORK-2026-07-29.md` (6 phát hiện
  lõi + bảng việc 8 sprint + chi tiết chặng 2/thoại/chỉ dẫn/chấm chuẩn/cộng tác/Vitals) ·
  `docs/IF-DESIGN-STANDARD-2026-07-29.md` (chuẩn thiết kế: 10 tật "mùi AI", thang chữ 7 bậc,
  khoảng cách bội-4, bo góc 3 bậc, Swiss/Apple HIG) · `if-vitals-visual.html` (mockup Vitals chạy
  thật, 5 trạng thái + 3 cỡ + xoắn thiên hà). **Chưa nhận được** 12 file phụ khác mà SPEC-TỔNG §9
  liệt kê (KHAM-*.md, LUAT-300DPI, AUDIT-PRESENT-UX, if-chang2-mockup.html...) — chỉ lưu được cái
  đã dán vào chat.
- ✅ **PHẦN E v4** (`docs/IF-FEATURE-TREE.md`) — thêm luật 8a (checklist 6 bước = "xong"), 8b (luật
  xếp hàng gia phả), 9 (≥300dpi khi giao khách/in).
- ⚠️ **CẢNH BÁO TRÙNG MÃ — chưa dán mã tính năng đề xuất vào cây, chờ Hoà quyết**: `3.30`/`3.31`
  (đề xuất) TRÙNG `3.30.a/b/c` đã có (Library NT1, việc khác hẳn) · `7.20-7.27` không khớp quy ước
  4 cấp của khối 7 (`7.<nhóm>.<mục>`) — đặc biệt `7.24-7.27` nên là `7.4.x` (đã có nhóm Cộng tác).
  `2.2.60-2.2.84`/`2.3.58-2.3.63` không trùng, an toàn dán khi Hoà duyệt.
- ⏸️ Chưa code gì cho Sprint 1 (`2.2.60` tràn thanh đầu, `2.2.61` dời AiTierMenu, `2.2.77` lỗ rò
  Tool Mode, `7.24` LiveCursors) — đúng luật 5 (SPEC/TƯ VẤN xong, CODE để phiên sau, được phép tách).
- ⏸️ **T3/T4 (Semantic Room)** vẫn CHƯA LÀM — đọc `docs/IF1-COMPLETION-AUDIT.md` §3 (a)/(d) trước.

## Worktree đang mở
Không có.

## Chờ USER quyết
- **NT1** (gộp `LibraryPanel`+`LibraryBrowser`, LỚN) và **NT5** (cây thư mục thật, RẤT LỚN) —
  `docs/PLAN-LIBRARY-GATEWAY.md` mục "Thứ tự làm" dời cả 2 sau, chưa hẹn ngày.
- **T3/T4** (Semantic Room sprint, phần còn lại): làm tiếp phiên sau — xem `docs/CHANGELOG.md`
  phần "26/07 khuya" cho lý do kỹ thuật đã chốt (T1/T2) trước khi bắt đầu T3/T4.
- **Figma**: MCP trả `net::ERR_FAILED` 2 lần. Đường vòng: file trống + `docs/figma-bootstrap.js`.
- **DWG**: sửa tuân thủ GPL ngay (0đ)? · server-side (mất offline)? · ODA khi bán? →
  `docs/RESEARCH-DWG-LICENSE.md`.
- Treo: VIỆC 4 cũ (GuProfile=dữ liệu) · #14 (cụm Mẫu Presenting).
- 3 nhánh `worktree-agent-*` merged còn local; `fix/hatch-t-junction`+`fix/quality-pipeline`
  chưa merge — xoá được không?
- BOQ: đã gộp 1 sáng kiến `2.1.9.p` (`IF-MASTER-TREE.md`, Q6 28/07) — vẫn cần quyết có làm không,
  matId nối vào đâu (xem IF1-COMPLETION-AUDIT §3c).
- **2.2.16-2.2.21** (Render Tool Mode Pha 2-4, hạ tầng có sẵn chưa lộ card) — mục CẦN HOÀ QUYẾT
  duy nhất còn mở trong `docs/IF-FEATURE-TREE.md`.
- **Đánh số lại `3.30`/`3.31` và `7.20-7.27`** (SPEC-TONG-COWORK-2026-07-29 §3) — trùng/lệch quy
  ước mã hiện có, xem cảnh báo chi tiết cuối `docs/IF-FEATURE-TREE.md` PHẦN E. Quyết xong mới dán
  mã chính thức vào cây và bắt đầu CODE các sprint liên quan.
- **12 file phụ SPEC-TỔNG §9 chưa nhận được** (KHAM-*.md × 8, LUAT-300DPI, AUDIT-PRESENT-UX,
  PHAN-E-HIEN-TAI-v4, FILEMANAGER-SPRINT-v2, `if-chang2-mockup.html`) — cần Hoà dán tiếp nếu muốn
  Claude Code đọc đủ trước khi làm các sprint liên quan.

## Nợ kỹ thuật
- 🟡 `lib/cad/pdf.ts:383` nhắc `lib/cad/pdf.node-check.mjs` — file KHÔNG tồn tại.
- 🟡 Brand Kit chưa cho upload font ⇒ `lib/pdf-font.ts` LUÔN rơi về mặc định.
- 🟡 `resume-state` chỉ lưu `flowId`+`sheetId` (trùng giữa dự án — chọn nhầm TAB, không rò dữ liệu).
- 🟡 Audit CATALOG-STAGE2 kê node ma (`ai.localedit`/`idmask`/`furnitureextract`) — registry thật 5 node AI_EDIT.
- 🟡 `lastEditedDevice` (4 model local-first) luôn null — chưa có `deviceId` thật, cần dựng TRƯỚC Pha 2.
- 🟡 `Toolbar.tsx` (present-editor) `Btn` chưa dùng `Tooltip.tsx` · `CadToolbar.tsx` dư `title=`+`<Tooltip>`.
- 🟡 `FINAL_ARCHITECTURE_REPORT.md`/`HUONG-DAN-SU-DUNG.md` framing cũ "nội bộ TTT" — cần viết lại.
- 🟡 Wall cũ (trước T2) không có `wallKind` — KHÔNG tự gán; cần UI bulk-assign nếu muốn phủ hết.
- 🟡 **Luật 8 — LLM↔Hình học**: `lib/cad/ai-assist.ts` ĐÃ ĐÚNG kiến trúc nhưng chưa có LLM thật
  cắm vào; khi cắm cần zod validate chặn AI trả toạ độ lạ + nối `checker.ts` thành vòng lặp
  tự-sửa/tự-chặn-ship thật (hiện chỉ skip-and-note) như `SPEC-SEMANTIC-MODEL.md` §8 mô tả.
- 🐛 `/cad-editor` React warning không tái hiện · morph login chỉ fade · cursor polling idle.
- 🟡 **Vitals**: thiếu function-calling (`docs/SPEC-VITALS-ROLE.md` §1 vai ③ — LỚN, chờ tầng
  năng lực) + selection-aware + trích dẫn nguồn (§5 mục 2-4).
- 🟡 **`docs/UI-SYSTEM-AUDIT.md` (28/07)**: menu/dropdown chưa lật hướng (ngoài `Popover.tsx`) ·
  `/settings/avatar` không có nút quay lại · Present drag-state vẫn đè toolbar · lỗi raw HTTP
  status ở `NodeExtras.tsx`/`ProjectMembersPanel.tsx` — top 5 xếp theo rẻ×tác động trong file.
- 🟡 **StatusBar (VIỆC A)** chưa hiện tên bản vẽ/slide đang mở · Dashboard/Gallery
  (`ProjectSelect.tsx`) chưa gộp — màn đó có thanh Vitals riêng (`VitalsChatBubble`).
- 🟡 **Tool Mode Render (VIỆC B)** — "Sửa một mảng" cần vẽ mask tay, chỉ dựng node rồi mở canvas
  · ngưỡng "≤7 inch" xấp xỉ bề rộng CSS px (`lib/render-studio/tool-mode-ui.ts`), chưa test máy thật.
- 53 ảnh `public/wallpapers/ttt-*` giữ tạm theo ý user.

## Quy tắc session
*(worktree/LUẬT NỀN TẢNG → `CLAUDE.md`. Chi tiết đầy đủ → memory: `feedback-docs-never-overwrite`, `feedback-verify-before-trust`, `project-ben-doc-bundle-workflow`.)*
1. Không tự merge/push **main** nếu chưa hỏi; đã hỏi rồi thì tự làm (đã push xong lần này).
2. **LUẬT MÁU verify browser**: qua `127.0.0.1:<port>` (KHÔNG `localhost`); KHÔNG logout/xoá cookie.
3. Login demo: `demo@if.local` / `demo1234`.
