# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (30/07 khuya — 2.2.87/2.2.88 đo món đồ xong, npm test script còn treo)
Chi tiết đầy đủ → `CHANGELOG.md`. Tóm tắt phiên này (nhiều việc, thứ tự commit thật):
- ✅ **7.3.31 mở rộng** — hợp nhất `Header.tsx`+`StudioBar.tsx` → `AppChrome.tsx`, sửa TRIỆT ĐỂ
  overlap 1024px (tái cấu trúc Tệp/StageSwitcher ra khỏi hộp co + wordmark→logomark ở `xl` +
  "Đăng xuất" vào menu avatar) — xem `docs/VERIFY-7.3.31.md` bảng số đầy đủ, 0 tràn ở cả 3 mốc.
- ✅ **2.1.8.k/l/m** — PDF nhiều tờ có mục lục · sửa va chạm `CadTouchDock` (`safe-area.ts`) · tách
  khổ giấy/hướng giấy (A0-A4, Luật #10).
- ✅ **7.1.20** — gộp hệ ngưỡng breakpoint (`lib/breakpoints.ts`), ghi Luật #10/#11 (verify bắt
  buộc 5 mốc 640·768·1024·1180·1440).
- ✅ **2.2.86 ĐỔI PHƯƠNG ÁN** — bỏ "pill nổi trên canvas", hàng đợi thật trong menu "Việc" (đơn
  vị `FlowRun`). Phát hiện `7.3.32` (⬜, header tràn 179px@640/51px@768) — cấp mã, chưa sửa.
- ✅ **7.1.19 (Lark Wiki) MERGE XONG** — worktree phụ dọn sạch. **VẪN 🟡** — chờ 3 khoá Lark trong
  `.env.local` để verify bằng call thật.
- ✅ **2.2.87 + 2.2.88 (đo món đồ từ 1 ảnh)** — `docs/TU-VAN-ANH-SANG-BAN-VE-2026-07-30.md` "Lát
  cắt 1". `lib/vision/single-view-metrology.ts` (2.2.87): hiệu chỉnh camera từ điểm tụ + neo thang
  đo + đo R×S×C, 28/28 test verify bằng cảnh 3D tổng hợp chiếu qua camera biết trước (bắt được 2
  bug hình học thật nhờ test, không phải suy luận suông). `vision.measureobject` node + thẻ Tool
  Mode thứ 7 "Đo món đồ" (2.2.88) — tái dùng `extractForeground()`/`composeBoard()` có sẵn, không
  viết engine mới. Verify UI thật: chạy qua `runNode()` thật, đường lỗi "không đủ neo" đúng thiết
  kế; **đường đo-thành-công CHƯA thử ảnh thật** — khuyến nghị Hoà thử 1 ảnh phòng thật.
- ⏭️ **Đang chờ Hoà xác nhận mã `7.1.21`** — thêm script `"test"` vào `package.json` (hiện không có).
- 🟡 **2.2.70** (a)(b) — 2 lỗi nhỏ sửa kèm — CODE XONG, CHƯA COMMIT, gộp cùng đợt ảnh thật 5 thẻ
  Tool Mode (đang CHỜ Hoà duyệt credit trước khi chạy AI thật).
- ⏸️ **Còn treo**: `2.1.9.q` (BOQ groundwork) → BOQ `2.1.9.p` (matId đã CHỐT, chờ quyết "có làm
  engine không"). B2/B3/B4 chưa làm — B3 cần THỬ TAY thật.

## Worktree đang mở
Không có (dọn sạch 30/07 khuya — `.worktrees/if-lark`/`feat/7.1.19-lark-wiki` đã merge+prune+xoá).

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
- BOQ: đã gộp 1 sáng kiến `2.1.9.p` (`IF-MASTER-TREE.md`, Q6 28/07) — matId nối vào đâu **ĐÃ CHỐT
  30/07** (bảng riêng `AtlasMaterial`, xem `2.1.9.i`); vẫn cần quyết CÓ LÀM ENGINE THẬT không.
- **2.2.16-2.2.21** (Render Tool Mode Pha 2-4, hạ tầng có sẵn chưa lộ card) — mục CẦN HOÀ QUYẾT
  duy nhất còn mở trong `docs/IF-FEATURE-TREE.md`.
- **12 file phụ SPEC-TỔNG §9 chưa nhận được** (KHAM-*.md × 8, LUAT-300DPI, AUDIT-PRESENT-UX,
  PHAN-E-HIEN-TAI-v4, FILEMANAGER-SPRINT-v2, `if-chang2-mockup.html`) — cần Hoà dán tiếp nếu muốn
  Claude Code đọc đủ trước khi làm các sprint liên quan.
- **`2.2.83`** (preflight — tích hợp nút Xuất) — nguồn `SPEC-TONG` §7.5 gộp chung tiêu đề với
  `2.2.82`, không tách rõ nội dung; đã tự tách theo suy luận hợp lý khi dán 30/07 (xem dòng đó
  trong cây), **cần Hoà xác nhận lại ranh giới đúng**.

## Nợ kỹ thuật
→ Tách ra `docs/TECH-DEBT.md` (30/07, giữ STATUS dưới 800 từ) — nội dung nguyên vẹn, không mất mục nào.

## Quy tắc session
*(worktree/LUẬT NỀN TẢNG → `CLAUDE.md`. Chi tiết đầy đủ → memory: `feedback-docs-never-overwrite`, `feedback-verify-before-trust`, `project-ben-doc-bundle-workflow`.)*
1. Không tự merge/push **main** nếu chưa hỏi; đã hỏi rồi thì tự làm (đã push xong lần này).
2. **LUẬT MÁU verify browser**: qua `127.0.0.1:<port>` (KHÔNG `localhost`); KHÔNG logout/xoá cookie.
3. Login demo: `demo@if.local` / `demo1234`.
