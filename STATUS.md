# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (30/07 — dán mã tính năng Sprint 1-6 vào cây + tách Nợ kỹ thuật, đợt doc thuần)
Chi tiết đầy đủ → `CHANGELOG.md`. Tóm tắt phiên này:
- ✅ **Dán `2.2.60`-`2.2.85` + `2.3.58`-`2.3.63` vào `docs/IF-FEATURE-TREE.md`** (nguồn
  `SPEC-TONG-COWORK-2026-07-29.md` §3-§8 + `TICKET-FONT-MONO-NODE`), đủ 6 cột, Trạng thái ghi
  bằng chứng `file:dòng` thật (không chép lời spec) — 4 mã Sprint 1 ghi ✅ kèm SHA, còn lại ⬜/🟡.
  Kiểm trùng trước khi dán: KHÔNG lệch (đợt trùng `3.30`/`3.31`/`7.20-7.27` đã Cowork giải quyết
  phiên trước). Ghi rõ chuỗi phụ thuộc CHỐT `2.2.77→2.2.69(+2.2.85 chung commit)→2.2.65→2.2.78→
  7.1.18→phần còn lại`. 1 điểm mơ hồ nguồn (`2.2.83` gộp chung mô tả với `2.2.82`) đã tự tách theo
  suy luận, ghi rõ cần Hoà xác nhận lại (xem "Chờ USER quyết").
- ✅ **Tách "Nợ kỹ thuật" sang `docs/TECH-DEBT.md`** — STATUS.md chỉ còn 1 dòng link, không mất nội dung.
- ✅ **`2.2.61.a`** — Cowork phát hiện `2.2.61` bỏ sót `MobileMenu.tsx` (picker AI tier thật vẫn còn
  ở đó, trùng với `/settings`, vi phạm Luật #6). Sửa NGAY theo khuyến nghị ticket — commit `77224dc`,
  browser-verify thật ở 375px. `7.3.30` (phần lớn hơn — gom sáng/tối/ngôn ngữ/avatar/hướng dẫn về
  `/settings` 4 nhóm) đã dán vào cây, CHƯA làm, xếp Sprint 3 cùng cụm `2.2.69`.
- ⏸️ **T3/T4 (Semantic Room)** vẫn CHƯA LÀM — đọc `docs/IF1-COMPLETION-AUDIT.md` §3 (a)/(d) trước.
- ⏸️ **Sprint 2/3** (`docs/CHOT-SO-MA-2026-07-29.md` §D) code chưa bắt đầu — Sprint 3 nhớ gộp
  **2.2.85** (font mono node) chung commit với **2.2.69**, đúng thứ tự CHỐT ①-⑤ ghi trong cây.

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
- BOQ: đã gộp 1 sáng kiến `2.1.9.p` (`IF-MASTER-TREE.md`, Q6 28/07) — vẫn cần quyết có làm không,
  matId nối vào đâu (xem IF1-COMPLETION-AUDIT §3c).
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
