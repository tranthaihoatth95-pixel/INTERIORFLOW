# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (30/07 khuya — 7.1.19 merge xong, 2.2.70 + npm test script còn treo)
Chi tiết đầy đủ → `CHANGELOG.md`. Tóm tắt phiên này (nhiều việc, thứ tự commit thật):
- ✅ **7.3.31 mở rộng** — hợp nhất `Header.tsx`+`StudioBar.tsx` → `AppChrome.tsx`, sửa 2 lần overlap
  1024px — xem `docs/VERIFY-7.3.31.md` bảng số đầy đủ.
- ✅ **2.1.8.k/l/m** — PDF nhiều tờ có mục lục · sửa va chạm `CadTouchDock` (`safe-area.ts`) · tách
  khổ giấy/hướng giấy (A0-A4, Luật #10). Cả 3 đã commit riêng.
- ✅ **7.1.20** — gộp hệ ngưỡng breakpoint (`lib/breakpoints.ts`), ghi Luật #10/#11.
- ✅ **2.2.86 ĐỔI PHƯƠNG ÁN** — bỏ "pill nổi trên canvas", hàng đợi thật trong menu "Việc" (đơn
  vị `FlowRun`, tuần tự, huỷ được). Phát hiện thêm `7.3.32` (⬜, header tràn 179px@640/51px@768,
  `sm:flex` cụm phải chưa thiết kế dải 640-1023) — cấp mã, chưa sửa.
- ✅ **7.1.19 (Lark Wiki) MERGE XONG** — làm ở worktree phụ song song, merge sạch không conflict
  (đúng 3 file `lark.ts`/`.env.example`/`INTEGRATIONS.md`). tsc+103/103 test sạch SAU merge (lớp
  kiểm duy nhất code này chưa từng qua — worktree phụ không chạy được bộ test). **VẪN 🟡** — chờ
  `.env.local` có `LARK_APP_ID/SECRET/LARK_ATLAS_NODE_TOKEN` để verify bằng call thật, chưa ✅.
  Worktree phụ `.worktrees/if-lark` + branch `feat/7.1.19-lark-wiki` đã dọn sạch (prune + `-d`).
- ⏭️ **Đang chờ Hoà xác nhận mã `7.1.21`** — thêm script `"test"` vào `package.json` (hiện KHÔNG
  có, bộ 103 bài chỉ chạy được nếu biết cú pháp riêng — đúng lý do `7.1.19` ship mà chưa qua test).
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
