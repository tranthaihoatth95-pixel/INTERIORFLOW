# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (28/07 tối — NT-gateway ①②③ + StatusBar (VIỆC A) + Tool Mode Render (VIỆC B))
Chi tiết đầy đủ → `CHANGELOG.md` mục "28/07 tối" (danh sách 7 commit). Tóm tắt:
- ✅ **PLAN-LIBRARY-GATEWAY.md ①②③ xong**, ④ NT1 (gộp LibraryPanel/LibraryBrowser) dời sau.
- ✅ **SPEC-RENDER-STUDIO.md §6C mới** — sinh diện đồ nội thất bằng hình học + kho nhớ 3 tầng
  (thuần tài liệu, chưa code).
- ✅ **VIỆC A — StatusBar dùng chung** 3 chặng: trái (dự án·toạ độ CAD) · giữa (Vitals, hover
  150ms/⌘J/xổ lên, điểm gọi DUY NHẤT — gỡ nút nổi cũ) · phải (hàng đợi·lưu·lỗi quy chuẩn). Verify
  browser thật + tự ẩn khi Trình chiếu. Khớp khung có sẵn `SPEC-NAVIGATION-MODEL.md` §2.
- ✅ **VIỆC B — Tool Mode mặc định chặng Render**: 6 thẻ (Tầng 1) → 2 cột tham số động từ node
  registry thật (Tầng 2) → node graph cũ nguyên vẹn qua "Mở canvas" (Tầng 3). Verify browser
  thật: Render chạy qua `runNode()` thật, ra lỗi thật (ComfyUI chưa bật) — không giả vờ thành công.
- **Lưu ý dev server**: `.next` cache hay hỏng sau nhiều HMR/git stash → xoá `.next` rồi khởi
  động lại, không phải bug code.
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
- BOQ (bảng thống kê vật tư): audit xác nhận 0 dòng code — cần quyết có làm không, matId nối
  vào đâu (xem IF1-COMPLETION-AUDIT §3c).

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
