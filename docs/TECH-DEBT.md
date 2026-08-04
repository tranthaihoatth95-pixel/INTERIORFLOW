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
- 🟡 `findHatchBoundary` (dò biên phòng, gọi trong `lib/three/cad-to-obj.ts` `docToObjScene`) —
  CODE CŨ, phát hiện khi bench 3D-1 (01/08): treo > 2 phút với 289 phòng nhỏ tách rời (1156 tường)
  × 578 block nội thất — mỗi block gọi 1 lần, mỗi lần quét toàn bộ `traceDoc`. Bản vẽ thật hiếm
  đạt mật độ này (chưa phải bug chặn) nhưng nếu có ca thật cần: cache biên phòng theo room thay vì
  dò lại mỗi block, hoặc index không gian (spatial hash) cho `traceDoc`.
- ✅ **ĐÃ SỬA (03/08 đêm)** ~~🔴 Mode "3D Thiết kế" KHÔNG autosave xuống IndexedDB~~ — phát hiện
  03/08 lúc verify browser NC-12 VIỆC 3 (nút "Khoét hốc"). Nguyên nhân gốc (đọc code): autosaver
  (`useCadStore.subscribe(...)` + `createSheetsAutosaver(...)`) sống TRONG
  `components/cad/CadSheets.tsx`, chỉ mount ở stage "2D Kỹ thuật" (route `/cad` riêng, KHÔNG
  layout chung với `/render`) — mode 3D sửa CÙNG `useCadStore` singleton nhưng không ai lắng nghe.
  Lỗi CÓ TRƯỚC NC-12 (push-pull 3D-5 đã ship dính cùng lỗi, `Render3DModeSkeleton.tsx` gọi thẳng
  `updateEntities`/`addEntities` không qua persistence nào).
  **Sửa**: `useCad3DAutosave()` (hook, gọi ở gốc `Render3DModeSkeleton.tsx`) nối lại ĐÚNG
  `loadSheets`/`saveSheets`/`createSheetsAutosaver` (`lib/sheets-persist.ts`, KHÔNG cơ chế lưu thứ
  hai — K1), cùng khoá bucket `CadSheets` dùng. Cốt lõi thuần `lib/cad/cad3d-autosave-core.ts`
  (tách theo khuôn `lib/scope-core.ts`/`lib/scope.ts` — không đụng `next/navigation`/React nên
  test được bằng sucrase-node) + cờ chia sẻ `lib/cad/cad-doc-hydration.ts` (module-level, không
  persist) chống race "vừa rời 2D, autosave chưa kịp ghi, mode 3D đã nạp lại bản cũ đè lên".
  13 ca test tích hợp thật (`cad3d-autosave-core.test.ts`, IndexedDB/localStorage fake tối giản
  cùng khuôn `sheets-persist.test.ts`, KHÔNG jsdom/fake-indexeddb — chờ debounce THẬT 1200ms).
  Verify browser thật: khoét hốc → F5 (URL y hệt) → hốc còn nguyên (IndexedDB + UI khớp, cutter
  entity còn, `wall.ops` còn). Tiện thể sửa `lib/resume.ts` import `@/lib/phases` → `./phases`
  (mechanical, cùng file — cần relative để module này test được bằng sucrase-node).
- 🟡 `findSnap()` (`lib/cad/query.ts:335`, gọi từ `CadCanvas.tsx` `updateCursor`/`onPointerDown`)
  — phát hiện 04/08 lúc verify browser PHIẾU ĐỢT 8 D1 (`docs/SO-KIEM-TONG.md` §9): thao tác
  Rect-tool kéo dở rồi Esc, rồi click lại vào canvas → `TypeError: trueEndpoints(...) is not
  iterable`. File này KHÔNG liên quan D1 (lần sửa gần nhất `a25cb22`, trước D1 nhiều). Chưa xác
  minh sâu nguyên nhân gốc (nghi: huỷ giữa chừng bằng Esc để lại state numeric-input/Số liệu dở
  dang, `findSnap` nhận endpoint list rỗng/undefined) — cần phiên khác tái hiện đúng chuỗi thao
  tác rồi đọc `query.ts` quanh dòng 335 để sửa.
- 🔴 **Huỷ nhập DWG giữa chừng làm TREO CỨNG tab** (`lib/cad/dwg.ts` `openDwgFile()` +
  `CadEditor.tsx` nút Huỷ mới nối, `docs/SO-KIEM-TONG.md` §11, 04/08) — verify browser thật bằng
  file 21MB thật (`ID-02-GN-200-00-001.dwg`), bấm Huỷ giữa lúc `convertEx` chạy → tab không phản
  hồi ≥2 phút, tái hiện 2/2 lần. Nghi chi phí giải phóng WASM linear memory lớn khi
  `worker.terminate()`, chưa chứng minh được (không lấy được performance trace vì tab treo).
  TỆ HƠN bug gốc "treo im lặng" vì giờ treo THẬT SỰ không phản hồi input. Cần Hoà duyệt hướng sửa
  trước khi động: (a) chặn nút Huỷ khi file quá lớn (chỉ cho chờ) hay (b) đổi ngữ nghĩa Huỷ từ
  "dừng ngay bằng terminate()" sang "đánh dấu huỷ, bỏ qua kết quả khi worker tự xong tự nhiên".
- 🟡 File .dwg thật bị cắt cụt giữa chừng (còn nguyên chữ ký + header, mất thân) → nhập ÊM, báo
  "0 đối tượng" thay vì báo lỗi rõ file đã hỏng (`docs/SO-KIEM-TONG.md` §11, 04/08). Không sai kỹ
  thuật (header đọc được thật) nhưng dễ gây hiểu lầm "file rỗng thật". Chưa quyết có cần cảnh báo
  thêm khi kích thước file lớn nhưng `totalEntityCount` = 0 hay không.
