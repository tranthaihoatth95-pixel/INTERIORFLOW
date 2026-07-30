# NỢ KỸ THUẬT — InteriorFlow

> Tách ra từ `STATUS.md` (30/07) để giữ STATUS dưới 800 từ — nội dung nguyên vẹn, không xoá gì.
> Cập nhật cùng lúc với `STATUS.md` mỗi khi phát hiện/đóng nợ kỹ thuật mới.

- 🟡 **`prisma/migrations/` lệch khỏi `dev.db` thật** (phát hiện 30/07 khi làm `2.1.9.r`) —
  `npx prisma migrate dev` báo drift (đòi thêm hàng loạt index vào `IntegrationAccount`/
  `LarkPersonRef`/`LarkTaskRef`/`LarkUserMap`/`NotebookChunk`/`NotebookSource`/`ProductSpec`/
  `ProjectMember`/`ProjectNotebook`) và ĐÒI RESET TOÀN BỘ DATABASE để reconcile — không phải lỗi
  do lần sửa này gây ra, mà do quy trình local LUÔN dùng `db push` (xem `electron/main.js:188`)
  thay vì `migrate dev`/`migrate deploy`, nên migration history (`20260703141955_init`, 1 bản duy
  nhất) chưa từng ghi lại các thay đổi schema về sau. Rủi ro thật: bản ĐÓNG GÓI (`electron/main.js`
  dùng `migrate deploy` cho máy khách mới, KHÔNG phải `db push`) sẽ tạo DB THIẾU các index/field đã
  thêm qua `db push` cục bộ — cần dọn: hoặc tạo migration mới bằng `prisma migrate dev --create-only`
  (không áp lên dev.db, chỉ generate file) rồi review tay, hoặc `prisma migrate resolve --applied`
  để đánh dấu drift đã biết là "đã áp" mà không chạy lại. CHƯA sửa — chỉ né bằng `db push` cho lần
  này, để nguyên đợi Hoà quyết cách dọn (rủi ro cho installer, không phải cho dev.db hiện tại).
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
- 🟡 1024px — Tệp chồng một phần Chạy flow ở route render. Pre-existing (`Header.tsx` cũ), không
  phải `7.3.31`. KHÔNG sửa bằng `overflow-hidden` (cắt popover — xem comment `Header.tsx` cũ dòng
  45-52). Tự hết khi dời Chạy flow khỏi bar theo `docs/TICKET-CHAY-FLOW-KHONG-GHIM-BAR-2026-07-30.md`.
