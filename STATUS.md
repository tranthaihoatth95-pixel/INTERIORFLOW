# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## ✅ XONG (02/08, mã commit — chi tiết đủ trong message từng commit + CHANGELOG)
- **3D-1** (`d9eea9b`+`d5f6700`, `SPEC-3D-CORE.md` §4): `three@0.185.1`+`@types/three` pin chính
  xác · `cad-to-obj.ts` thêm `groups`/`Scene3DData` (spec giả định sai — ObjScene trước chỉ có
  text, đã bổ sung, 29/29 test cũ pass y hệt) · `Scene3DViewer.tsx` mode orbit + nút "Xem 3D"
  trong node "Bản vẽ → 3D". FPS thật (bench tạm, đã xoá): 2040 entity/24k tam giác — gộp theo màu
  4 draw call/0.087ms/khung; không gộp 2011 draw call/2.73ms/khung, vẫn realtime. walk/campath/
  section: TODO 3D-2..3D-4.
- **Wire nút "PDF in 300dpi (A3/A4)"** (`2a252c9`) — hết tranh chấp ĐỢT 3. Mở khoá theo
  `printReady` (khổ A4/A3), tooltip trung thực. Verify browser thật cả 2 nhánh (xuất thành công ở
  A3 · khoá đúng khi đổi 16:9), trả state gốc.
- **Đo ESRGAN thật** (Hoà duyệt ~4cr) — SỐ THẬT: **8.7s** (nguồn 512px) / **10.6s** (896px), TB
  **9.7s/ảnh** (models.ts ước 15s, thật nhanh hơn) · scale ×4 đúng lý thuyết: 512→2048px,
  896→3584px · dpi trên A3: **124dpi**/**217dpi** — **CẢ HAI KHÔNG ĐẠT 300dpi trên A3**; trên A4:
  175/**307dpi** (chỉ 896px+ vượt 300, chỉ ở A4). ⚠️ Pipeline ESRGAN ×4 hiện tại KHÔNG đủ cho lời
  hứa "300dpi trên A3" trừ khi nguồn ≥~1230px ngang / scale >4 / chỉ hứa cho A4 — CHƯA code tích
  hợp, chờ Hoà chọn hướng trước khi viết `ai.upscale` + cache theo img id.

## 🟡 DANG DỞ / CHỜ QUYẾT
- **P3 phần 2 tích hợp** — có số thật ở trên, CHƯA code. Cần Hoà chọn hướng (đổi kích nguồn tối
  thiểu / chấp nhận scale khác / chỉ hứa 300dpi cho A4) trước khi viết `ai.upscale` + cache.
- **KHÔNG PHẢI CỦA TÔI, đang dở trong working tree, CHƯA commit — đừng đụng khi chưa hỏi rõ**:
  `BrandKitPanel.tsx` + `lib/present-editor/brand-kit-disk.ts(.test.ts)` (VIỆC 5 code phụ) ·
  `docs/SPEC-SEMANTIC-MODEL.md` (sửa nhỏ nằm sẵn, file này của Hoà) · `AGENTKIENIFARCHITECT.md` ·
  `KE_HOACH_3_NGAY_SHIP_IF1.md` · `if-design-system.pdf` (3 file dán gốc repo, chưa rõ còn cần
  không — KHÔNG tự xoá, hỏi Hoà).

## ⬜ CHƯA BẮT ĐẦU (hàng đợi đã biết)
- 3D-2 (mode campath + captureSequence, mở khoá video bậc 2-b) → 3D-3 (depth/lineart) → 3D-4
  (section/walk) — thứ tự cố định, xem `docs/SPEC-3D-CORE.md` §4.
- V1.1 so le nội thất theo cửa chính · V2.1 look-at khoá điểm/khoá zone + panel chỉnh tốc độ/lens.
- Liên kết sống CAD→deck (moat, `NGHIEN-CUU-PRESENT-VS-DOI-THU-2026-08-01.md` §4) — sau P1-P3.
- Toàn bộ mục dưới "Chờ USER quyết" (chưa đổi) vẫn còn nguyên, chưa ai động thêm.

## 🔴 PHIÊN SAU PHẢI BIẾT (chưa nằm ở docs khác)
- **`.git/index.lock` stale LẦN 4** phiên này (không do tôi tạo) — xử lý đúng cách (`ps aux | grep
  git` xác nhận rồi mới `rm`). Đáng báo Hoà, nghi 1 tool/agent crash giữa `git commit` trong sandbox.
- **`findHatchBoundary`** (`cad-to-obj.ts`, code CŨ) treo >2 phút ở mật độ phòng cực cao (289 phòng
  nhỏ × 578 block) — né được trong bench, ghi `TECH-DEBT.md`, chưa phải bug chặn.
- **Code phụ dùng CHUNG working directory** (không worktree riêng) — lọc kỹ theo tên file trước
  khi commit hàng loạt, không `git add -A`.
- File scratch bench 3D-1 (`app/dev-bench-3d`, `scripts/_tmp-*`) đã xoá sạch — nếu thấy sót đầu
  phiên sau thì xoá ngay, không phải sản phẩm.

## Nợ kỹ thuật
→ `docs/TECH-DEBT.md` (30/07, giữ STATUS dưới 800 từ).

## Chờ USER quyết
- **P3 phần 2 hướng dpi A3** (mới, xem trên) · **4.1.f thi công** (đổi hình dạng `brand-kit.json`)
  · **`knowledge/ttt-design-system/`** vi phạm LUẬT TRUNG TÍNH · **④ `FlowVersion`** không phải
  thủ phạm `dev.db` phình · **NT1/NT5**/**T3/T4** dời sau · **Figma** MCP lỗi, đường vòng đã có ·
  **DWG** hướng GPL chưa chốt + `2.1.6.d` 🔴 bug Nhập DWG treo vĩnh viễn chưa ai động · Treo: VIỆC
  4 cũ, #14, Xlsx probe · 3 nhánh `worktree-agent-*` merged còn local · Sprint BOQ ĐỢT 3
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
