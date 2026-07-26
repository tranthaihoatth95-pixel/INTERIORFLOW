# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (27/07 — chốt design tokens: accent tím + gộp font + token trạng thái)
- ✅ **`origin/main`** = `c350a55` — gồm audit IF1, docs/ phân loại, gói đợt 4-11, T1/T2 Semantic
  Room, onboarding 3 tầng, thẻ kính login, luật vận hành 8, audit design tokens, và chốt tokens
  (mới nhất). Chi tiết đầy đủ từng phần → `CHANGELOG.md`.
- ✅ **Chốt design tokens** (`c350a55`) — `--accent` tím hạ còn `#6a57f5` (đạt WCAG AA 4.89:1,
  bản cũ #8b7cf7 chỉ 3.32:1); thay ~40 chỗ vàng ấm `#c79a63` bằng `--accent` khắp login/dashboard/
  CAD/Present, giữ ĐÚNG 2 ngoại lệ (preset "ember" là màu định danh, không phải accent) +
  `--accent-warm` cho riêng nút "Vào xưởng"; gộp font — xoá SF-Pro/Space-Grotesk cục bộ khỏi 4
  file thật sự sống (đã verify import trace, không phải 7 file như brief đoán — 6 file khác chứa
  cùng hằng số là CODE CHẾT, không đụng); thêm `--danger`/`--warning`/`--success` (≥4.5:1 cả 2
  theme) nối vào standards checker. Verify: tsc 0 · 97/97 test · build sạch · browser thật cả 4
  màn (login/dashboard/CAD/Present) xác nhận accent nhất quán.
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
- 🟡 **Luật 8 (blueprint §8) — LLM↔Hình học**: audit 4 tầng (parse/solver/validator/render) xác
  nhận `lib/cad/ai-assist.ts` ĐÃ ĐÚNG kiến trúc (LLM không viết x/y, `RoomSpec` không có trường
  toạ độ) — nhưng chưa có LLM thật nào cắm vào (`parseDescription` vẫn rule-based, comment dòng
  7 mời "cắm LLM thật sau"); khi cắm cần: (a) schema validation cứng (zod) chặn AI trả field
  toạ độ lạ, (b) nối `checker.ts` thành vòng lặp tự-sửa tối đa 3 lần/tự-chặn-ship như
  `SPEC-SEMANTIC-MODEL.md` §8 mô tả — hiện `layoutToEntities` chỉ skip món quá chật + ghi note,
  không phải reject-và-báo-lỗi.
- 🐛 `/cad-editor` React warning không tái hiện · ⌘J Vitals grep 0 · morph login chỉ fade · cursor polling idle.
- 53 ảnh `public/wallpapers/ttt-*` giữ tạm theo ý user.

## Quy tắc session
*(worktree/LUẬT NỀN TẢNG → `CLAUDE.md`. Chi tiết đầy đủ → memory: `feedback-docs-never-overwrite`, `feedback-verify-before-trust`, `project-ben-doc-bundle-workflow`.)*
1. Không tự merge/push **main** nếu chưa hỏi; đã hỏi rồi thì tự làm (đã push xong lần này).
2. **LUẬT MÁU verify browser**: qua `127.0.0.1:<port>` (KHÔNG `localhost`); KHÔNG logout/xoá cookie.
3. Login demo: `demo@if.local` / `demo1234`.
