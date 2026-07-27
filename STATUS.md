# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (27/07 tối — nhánh Rendering-fix đã MERGE vào main)
- ✅ **`origin/main`** = `6ebb196` (merge commit, no-ff) — gồm nhánh `feat/present-layout-ml-p1`
  (`c258450`, đã xoá cả local + remote sau merge). tsc 0 · `npm run build` sạch trên main trước
  khi push. 3 lỗi UI Rendering + gom nút trùng nghĩa + docs SPEC-FILE-MANAGER §7 — chi tiết đầy
  đủ → `CHANGELOG.md` mục "27/07 tối".
- ✅ **3 lỗi UI Rendering đã sửa + verify browser thật**: (1) [`ingest/page.tsx`](app/library/ingest/page.tsx)
  thêm nút "← Quay lại". (2) [`LibraryPanel.tsx`](components/LibraryPanel.tsx) — panel Reference
  theo "THẤY ẢNH TRƯỚC, LỌC SAU" (hàng tìm + `[+]`, 1 dropdown lọc gộp, còn lại là lưới ảnh). (3)
  [`FlowCanvas.tsx`](components/FlowCanvas.tsx) — `<MiniMap>` chỉ hiện khi `nodes.length >= 3`.
- ✅ **Gom nút trùng nghĩa**: `IOMenu.tsx` `'Nhập'`→`'Mở tệp'` (3 chặng) · `UploadButton.tsx`
  chặng Render `'Tải lên'`→`'Thêm vào canvas'`.
- ⏸️ **CHƯA gộp "Upload" + "Nạp vào thư viện"** — KHÁC chức năng thật, không phải trùng UI: Upload
  = thêm nhanh vài ảnh thẳng vào thư viện team. "Nạp vào thư viện" = mở `/library/ingest`, trang
  riêng dàn cả bộ reference dự án (PDF/Excel/CAD, không chỉ ảnh) + "AI Content Strategist" sinh
  kịch bản content. Đã báo Hoà, chờ quyết định.
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
- Treo: **VIỆC 4 cũ** GuProfile=dữ liệu · **VIỆC 7** demo+onboarding · **#14** cụm Mẫu Presenting.
- 3 nhánh `worktree-agent-*` đã merged còn local; `fix/hatch-t-junction`+`fix/quality-pipeline`
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
- 🟡 `.idf` chưa có migration path thật (version lệch = từ chối thẳng) — T3 sẽ giải quyết.
- 🟡 **Luật 8 — LLM↔Hình học**: `lib/cad/ai-assist.ts` ĐÃ ĐÚNG kiến trúc nhưng chưa có LLM thật
  cắm vào; khi cắm cần zod validate chặn AI trả toạ độ lạ + nối `checker.ts` thành vòng lặp
  tự-sửa/tự-chặn-ship thật (hiện chỉ skip-and-note) như `SPEC-SEMANTIC-MODEL.md` §8 mô tả.
- 🐛 `/cad-editor` React warning không tái hiện · morph login chỉ fade · cursor polling idle.
- 🟡 **Vitals audit (27/07)**: chat thật (không phải shell) — gesture kéo xuống cả 3 chặng + bar
  Gallery, cùng gọi `/api/ai-assist-chat` → NVIDIA/Ollama thật. Thiếu nhất: function-calling —
  chỉ nói chuyện, chưa sửa được CAD/Render/Present (`docs/SPEC-VITALS-AI.md` §Nhóm 4).
- 53 ảnh `public/wallpapers/ttt-*` giữ tạm theo ý user.

## Quy tắc session
*(worktree/LUẬT NỀN TẢNG → `CLAUDE.md`. Chi tiết đầy đủ → memory: `feedback-docs-never-overwrite`, `feedback-verify-before-trust`, `project-ben-doc-bundle-workflow`.)*
1. Không tự merge/push **main** nếu chưa hỏi; đã hỏi rồi thì tự làm (đã push xong lần này).
2. **LUẬT MÁU verify browser**: qua `127.0.0.1:<port>` (KHÔNG `localhost`); KHÔNG logout/xoá cookie.
3. Login demo: `demo@if.local` / `demo1234`.
