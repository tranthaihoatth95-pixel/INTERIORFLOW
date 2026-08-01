# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## ✅ XONG (01-02/08, mã commit — chi tiết đủ trong message từng commit + CHANGELOG)
- P1+P2+P3-phần1 Present (`ab1d9a9`,`8f4ed9f`,`00bf640`,`73b92f0`,`db12802`): sửa 3 nhãn nói dối ·
  ảnh mặc định giữ tỉ lệ resize (Shift bẻ) · in khổ giấy THẬT theo dpi cho chữ/hình khối (0 credit,
  `resScale`+`exportDeckToPdfAtPaperSize`+`PAPER_SIZE_MM`) — 69 test mới, tsc/eslint/build sạch.
- Toggle Gallery Carousel↔Grid (`6303d7c`,`26c314b`) — ghi đè J-4c, verify browser thật 2 chiều.
- V2 đường cam mức 2-a (`69db004`,`8105298`, A/C/D đủ, B rút gọn) · V1 draw-on mặt bằng
  (`d51a2cb`,`7b6bfbc`,`10d3fac`, FPS thật đo được ~31fps→batching >20000fps).
- Đợt 2 gỡ nhãn `[CẦN HOÀ DUYỆT]` (`1de5df7`) — 13/14 đóng, chỉ `SPEC-SEMANTIC-MODEL` treo (Hoà đọc).
- 2 ticket nguồn lưu lại để đối chiếu (`9ee37bf`).

## 🟡 DANG DỞ
- **P3 phần 2 (ảnh hero đạt 300dpi thật)**: `scripts/measure-upscale-dpi.ts` soạn xong, **CHƯA
  CHẠY** — Hoà tự chạy (tốn credit thật), có số mới code `ai.upscale` + cache theo img id.
- **Nút "In 300dpi" Toolbar vẫn khoá** — cần `PresentEditor.tsx` thêm 1 prop, file đang KHÔNG ĐỤNG.
- **KHÔNG PHẢI CỦA TÔI, đang dở trong working tree, CHƯA commit — đừng đụng khi chưa hỏi rõ**:
  `BrandKitPanel.tsx` + `lib/present-editor/brand-kit-disk.ts(.test.ts)` (VIỆC 5 code phụ) ·
  `docs/00-CHOT.md` + `docs/README.md` (Cowork tái cấu trúc mục lục, diff 40+ dòng mỗi file, chưa
  rõ đã xong chưa) · `docs/SPEC-SEMANTIC-MODEL.md` (có sửa nhỏ nằm sẵn, file này của Hoà).

## ⬜ CHƯA BẮT ĐẦU (hàng đợi đã biết)
- V1.1 so le nội thất theo cửa chính · V2.1 look-at khoá điểm/khoá zone + panel chỉnh tốc độ/lens.
- Liên kết sống CAD→deck (moat, `NGHIEN-CUU-PRESENT-VS-DOI-THU-2026-08-01.md` §4) — sau P1-P3.
- `2.2.91` toolbar nổi present-editor — code phụ ĐỢT 3 đang ở cụm đó, TRANH CHẤP, chờ nó báo xong.
- 7 file `docs/` untracked mới thấy trong phiên, **CHƯA ĐỌC** (`SPEC-3D-CORE.md`,
  `CHOT-HUONG-3D`/`CHOT-RENDER-TOOL-WINDOW`/`CHOT-NGUYEN-LIEU-EDITOR`/`NGHIEN-CUU-QUY-TRINH-RENDER`/
  `RANG-BUOC-IF2-CHO-IF1`/`LO-TRINH-DOT` đều `-2026-08-01.md`, + `mocks/tool-window-sketch2photo.html`)
  — có nhắc "mở khoá 3D-1" trong hội thoại nhưng chưa giao việc cụ thể; đọc trước khi động.
- Toàn bộ mục dưới "Chờ USER quyết" (chưa đổi) vẫn còn nguyên, chưa ai động thêm.

## 🔴 PHIÊN SAU PHẢI BIẾT (chưa nằm ở docs khác)
- **`.git/index.lock`/`HEAD.lock` bị bỏ sót (stale) 3 LẦN** trong phiên này — không phải do tôi tạo.
  Đã xử lý đúng cách mỗi lần: `ps aux | grep git` xác nhận KHÔNG có tiến trình thật rồi mới `rm`
  lock. Nếu gặp thường xuyên hơn nữa → báo Hoà, nghi 1 tool/agent nào đó crash giữa `git commit`.
- **FAL_KEY THẬT đã có sẵn trong `.env.local` sandbox này** (không phải placeholder) — chưa dùng,
  script `measure-upscale-dpi.ts` chạy được NGAY nếu Hoà chấp nhận tốn ~4cr thật.
- **Code phụ hoạt động CÙNG working directory này** (không worktree riêng như `CLAUDE.md` mô tả) —
  WIP của nó lẫn trong `git status`. Lọc kỹ theo tên file trước khi commit hàng loạt, không `git add -A`.
- **Browser test tool**: toạ độ pixel từ ảnh chụp SAI lệch toạ độ click thật (DPR≠1) — click theo
  `ref` từ `read_page`, không đoán từ ảnh. `ref` click đôi khi thất bại âm thầm (overlay đè) — thử
  `element.click()` qua `javascript_tool` trước khi kết luận có bug thật.

## Nợ kỹ thuật
→ `docs/TECH-DEBT.md` (30/07, giữ STATUS dưới 800 từ).

## Chờ USER quyết
- **4.1.f thi công** (đổi hình dạng `brand-kit.json`) · **`knowledge/ttt-design-system/`** vi phạm
  LUẬT TRUNG TÍNH, `.gitignore` chưa khớp · **④ `FlowVersion`** không phải thủ phạm `dev.db` phình
  (136MB còn lại nghi rác chưa VACUUM) · **NT1/NT5**/**T3/T4** dời sau · **Figma** MCP lỗi, đường
  vòng đã có · **DWG** hướng GPL chưa chốt + `2.1.6.d` 🔴 bug Nhập DWG treo vĩnh viễn chưa ai động ·
  Treo: VIỆC 4 cũ, #14, Xlsx probe · 3 nhánh `worktree-agent-*` merged còn local · Sprint BOQ ĐỢT 3
  greenlight sau ĐỢT DEMO · `2.2.16-2.2.21`/12 file SPEC-TỔNG §9/`2.2.83` chưa quyết. Chi tiết mỗi
  mục → CHANGELOG/`IF-FEATURE-TREE.md` (không lặp lại giải thích ở đây, tránh phình STATUS).

## Quy tắc session
*(worktree/LUẬT NỀN TẢNG → `CLAUDE.md`. Chi tiết đầy đủ → memory: `feedback-docs-never-overwrite`,
`feedback-verify-before-trust`, `project-ben-doc-bundle-workflow`.)*
1. Không tự merge/push **main** nếu chưa hỏi.
2. **LUẬT MÁU verify browser**: qua `127.0.0.1:<port>` (KHÔNG `localhost`); KHÔNG logout/xoá cookie.
3. Login demo: `demo@if.local` / `demo1234`.
4. **KHÔNG `prisma db push`/`migrate` qua sandbox** (FUSE chặn khoá file SQLite) — soạn lệnh sẵn
   cho Hoà chạy máy thật. Backup: `sqlite3 dev.db ".backup 'ten'"`, không `cp`. Chi tiết →
   `docs/00-CHOT.md` mục "LUẬT VẬN HÀNH".
