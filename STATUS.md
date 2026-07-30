# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (30/07 khuya — 7.3.31 hợp nhất AppChrome xong, tiếp 2.2.86)
Chi tiết đầy đủ → `CHANGELOG.md`. Tóm tắt phiên này:
- ✅ **7.3.31 mở rộng** — hợp nhất `Header.tsx`+`StudioBar.tsx` → `AppChrome.tsx` duy nhất (4 route),
  `stage-nav.ts` gộp logic điều hướng, sửa 2 lỗi thật (`SessionWatch`+link `/settings` trước thiếu
  ở 3/4 route). Browser-verify 4 route×2 breakpoint: `.if-dock` left 0px jitter (254.203125px cả
  8/8 lần đo), width lệch tối đa 0.28px. 102/102 test, tsc+eslint sạch.
- 🔴 **Nợ kỹ thuật phát hiện** (pre-existing, không phải regression `7.3.31`): Tệp chồng Chạy flow
  ở 1024px route render — ghi vào `docs/TECH-DEBT.md`, tự hết khi `2.2.86` dời nút khỏi bar.
- ✅ **B1 backup tự động** (`4.6`+`4.13`) — xem CHANGELOG cho chi tiết, đã xong phiên trước.
- ⏭️ **Tiếp theo (thứ tự Hoà chốt 30/07)**: `2.2.86` (Chạy flow rời bar → pill nổi trạng thái,
  `docs/TICKET-CHAY-FLOW-KHONG-GHIM-BAR-2026-07-30.md`) → `7.1.19` (Lark Wiki token,
  `docs/REVIEW-SPEC-BOQ-LARK-2026-07-30.md`) → `2.1.9.q` (BOQ groundwork hình học) → BOQ `2.1.9.p`
  (còn chờ Hoà quyết "có làm không", matId đã CHỐT 30/07 — xem cây mã `2.1.9.i`).
- ⏸️ **B2/B3/B4** (`docs/CAT-PHAM-VI-3-NGAY-2026-07-30.md` §1, §3 Ngày 1-2) chưa làm — B3 (kiểm
  autosave sống sót crash) cần THỬ TAY thật, không đọc code; B4 (trung tính 44 chỗ/25 file) đụng
  `lib/server/auth.ts`+`app/layout.tsx`, rủi ro cao nhất.
- ⏸️ **Sprint 3 UI còn lại** (`2.2.65-68/70-72/78-84`, `2.3.61`) — xem CHANGELOG cho tóm tắt
  `2.2.85`/`2.2.69`(🟡)/`7.3.30` đã xong phiên trước; chuỗi phụ thuộc CHỐT ở `IF-FEATURE-TREE.md`.
- ⏸️ **T3/T4 (Semantic Room)** vẫn CHƯA LÀM — đọc `docs/IF1-COMPLETION-AUDIT.md` §3 (a)/(d) trước.

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
