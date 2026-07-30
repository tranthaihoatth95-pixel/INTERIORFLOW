# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (30/07 khuya — B3 xong (giới hạn công cụ disclose), 2.1.9.q xong, 2.2.87/2.2.88 🟡)
Chi tiết đầy đủ → `CHANGELOG.md` (mỗi dòng dưới đây có 1 mục tương ứng ở đó). Tóm tắt:
- ✅ **7.3.31/2.1.8.k-m/7.1.20/2.2.86/2.2.70(a)(b)** — hợp nhất AppChrome hết overlap · PDF nhiều
  tờ+khổ/hướng giấy · gộp hệ ngưỡng breakpoint (Luật #10/#11) · hàng đợi "Việc" (`FlowRun`) · 2 fix
  nhỏ (`df74551`). Không đổi gì thêm — xem CHANGELOG nếu cần chi tiết.
- ✅ **7.1.19 (Lark Wiki) MERGE**. **VẪN 🟡** — chờ 3 khoá Lark trong `.env.local` verify call thật.
- 🟡 **2.2.87+2.2.88 SỬA SANG cascade 4 bậc "không-bao-giờ-fail", HẠ TỪ ✅ (Hoà chốt)** —
  `measureObjectTiered()` tự tụt bậc, không bao giờ throw. 46/46 test. **CHƯA verify ảnh thật
  trong browser** — nâng lại ✅ khi Hoà tự thử. Disclose: Tầng 2/3 AI chưa làm.
- ✅ **7.1.21 CODE XONG (worktree phụ `feat/sprint-infra`, merge 30/07 khuya)** — `"test"` vào
  `package.json`, 102/102 pass. **Sửa lại khi merge**: loại trừ `auto-backup.test.ts` giờ VÔ
  NGHĨA — file đó tôi đã xoá trong B3 (thay bằng `backup-diff.test.ts`, 50 test); xác nhận bằng
  cách chạy thử bản CŨ trước khi merge — 6/6 pass, KHÔNG chậm/flaky, không rõ lý do phiên phụ loại
  trừ ban đầu. Đã bỏ mệnh đề loại trừ chết đó khỏi script, giữ `edgecase-concurrency.test.ts`
  (loại đúng — `jose` ESM-only vỡ `require()` CommonJS của sucrase-node, đã xác nhận trong code).
  `7.1.22` (Bộ nhớ đo đạc) CHƯA CODE.
- ✅ **2.1.9.q (BOQ groundwork)** — `polygonPerimeter()`+`openingsAreaInPolygon()` vào `hatch.ts`.
  Phát hiện khi khám: `BlockDef.h` không phải chiều cao cửa (độ sâu mặt bằng) — sửa dùng
  `w`×`OPENING_STANDARD_HEIGHT_MM`. 45/45 test. BOQ `2.1.9.p` (engine thật) vẫn chờ quyết.
- ✅ **B3 (`4.6` sửa) — backup CAD bỏ "giữ 5 bản" sang thang thời gian + lưu chênh lệch** —
  `lib/cad/backup-diff.ts` mới (50 test) + `auto-backup.ts` viết lại + lối phục hồi UI mới
  (`BackupRecoveryModal.tsx`, trước không có). **Giới hạn công cụ disclose rõ**
  (`docs/VERIFY-B3.md`): không tự động hoá được hộp thoại chọn thư mục thật và `kill -9` tiến
  trình Electron thật — kèm hướng dẫn 3 bước Hoà tự làm 1 lần xác nhận mức OS thật. ⚠️ Còn 1
  project test (`cms7imxpt...`) trong tài khoản demo — Hoà xoá tay trong Gallery nếu không cần.
- ⏸️ **Còn treo**: B2/B4 chưa làm.

## Worktree đang mở
**1 worktree phụ ĐANG CHẠY, KHÔNG đụng vào**: `.worktrees/if-infra` nhánh `feat/sprint-infra` —
phát hiện tình cờ, `git worktree list` báo "prunable" (VM mount khác, giống ca `if-lark` cũ trước
đây) nhưng KHÔNG prune — nhánh CHƯA merge, có nội dung thật. Nếu không phải phiên phụ của Hoà, báo
lại. Ngoài ra sạch — `.worktrees/if-lark/` cũ đã `rm -rf` an toàn (đủ 4 điều kiện, xem CHANGELOG).

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
