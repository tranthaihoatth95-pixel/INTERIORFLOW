# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (31/07 — ĐỢT A merge xong · ĐỢT B lớp lưu trữ: B1 xong, CHỜ GẬT B2)
Chi tiết đầy đủ → `CHANGELOG.md`. Tóm tắt:
- ✅ **ĐỢT A merge (`feat/dot-a-ha-tang`) + dọn git** — `7.1.24` khoá bộ học Gu THEO USER (khoá cũ
  giữ nguyên, không di trú, banner báo bắt đầu lại) · `7.1.25` Brand Kit xuất/nhập `.json` (merge
  không đè kit trùng id, cấp id mới). Code phụ CHỈ đề xuất mã trong commit — code chính (đây) xác
  nhận không trùng rồi ghi chính thức vào cây, đúng **Luật #12b mới** (2 phiên code song song: phụ
  đề xuất, chính ghi cây). Verify độc lập (đọc code, không tin báo cáo): tsc+eslint+test+build sạch
  sau merge. Dọn: xoá ref hỏng `feat/dot-a-ha-tang.lock.bak` (đang CHẶN `git fetch`) + 8 file
  `.lock`/`.lock.bak*` rác khác trong `.git/worktrees/dot-a/`+`.git/` gốc + `git gc --prune=now` +
  prune worktree/xoá nhánh đã merge.
- 🟡 **ĐỢT B — `4.1.a` (B1) xong, DỪNG CHỜ GẬT** (`docs/QUYET-DINH-HA-TANG-2026-07-31.md`) — chọn
  thư mục gốc `~/InteriorFlow` (`lib/root-folder.ts`, chép khuôn `auto-backup.ts`) + UI "Lưu trữ"
  trong `/settings`. CHƯA đổi nguồn sự thật gì. 5 pha B1-B5, MỖI PHA BÁO+CHỜ GẬT riêng, tuyệt đối
  không chạy thẳng B4 (đảo nguồn sự thật IndexedDB→tệp thật, rủi ro mất dữ liệu).
- ✅ **Sprint "Lộ nền" — `7.3.33`/`2.1.11`/`7.3.34`** (31/07) — bảng tra phím tắt toàn app
  (`lib/shortcuts.ts` 1 nguồn, layout theo mẫu Hoà gửi) · CAD thêm ⌘A/⌘D/⌘0·⌘=·⌘- (đã có sẵn phím
  `f`+nút Zoom Extents, chỉ thiếu ⌘0) · dọn chữ CommandPalette. 21+16 test, tsc+eslint+test+build
  sạch mọi commit. Chi tiết → CHANGELOG.
- ✅ **2.2.89/7.3.32/2.1.8.n** — GẤP cho ĐỢT DEMO CAD LAN 31/07: menu chuột phải CAD `onDismiss` ·
  tràn headbar route render · Ctrl+S lưu ngay/xuất `.idf`/chỉ báo giờ lưu.
- ✅ **7.3.31/2.1.8.k-m/7.1.20/2.2.86/B3(`4.6`)/Sprint BOQ ĐỢT 1+2/7.1.21+Luật #13** — hợp nhất
  AppChrome · PDF nhiều tờ · backup thang thời gian · BOQ groundwork+ATLAS cache. Chi tiết → CHANGELOG.
- 🟡 **2.2.87+2.2.88** — cascade 4 bậc, HẠ TỪ ✅ (Hoà chốt), CHƯA verify ảnh thật.
- 🟡 **7.1.23** — Bước 1 xong CHỜ HOÀ GẬT (~112 chỗ tay), hoãn tới khi ĐỢT B xong.
- ⏸️ **Còn treo**: mục "B2/B4" cũ trong CHANGELOG (đặt tên TRƯỚC khi có cây mã số, KHÔNG liên quan
  ĐỢT B lớp lưu trữ mới — tên trùng tình cờ). Sprint BOQ ĐỢT 3 (`2.1.9.p`) — kế tiếp sau ĐỢT B.

## Worktree đang mở
Không có. `feat/sprint-infra`+`feat/dot-a-ha-tang` đã merge + prune + xoá branch/thư mục/lock rác
— đủ điều kiện an toàn.

## Chờ USER quyết
- **④ `FlowVersion`** — đo xong (0c, code phụ): chỉ 14 dòng/7,27MB/5,31% `dev.db`, KHÔNG phải thủ
  phạm phình DB → hạ ưu tiên xuống 🟡, không làm bây giờ. **Câu hỏi mới phát sinh**: 136MB còn lại
  của 143MB `dev.db` (4 dự án/10 user) là bất thường — nghi `NotebookChunk` embedding/`Flow.graphJson`
  bản sống/`ChatMessage`/trang rác chưa VACUUM. Đo dung lượng theo bảng khi rảnh, CHƯA làm bây giờ.
- **NT1**/**NT5** (gộp Library panel/browser · cây thư mục thật) — dời sau, chưa hẹn ngày
  (`docs/PLAN-LIBRARY-GATEWAY.md`).
- **T3/T4** (Semantic Room, phần còn lại) — làm tiếp phiên sau, lý do kỹ thuật ở CHANGELOG "26/07".
- **Figma**: MCP lỗi `net::ERR_FAILED`. Đường vòng: file trống + `docs/figma-bootstrap.js`.
- **DWG**: sửa GPL ngay (0đ)? · server-side (mất offline)? · ODA khi bán? → `docs/RESEARCH-DWG-LICENSE.md`.
- Treo: VIỆC 4 cũ (GuProfile) · #14 (Mẫu Presenting).
- **Xlsx round-trip probe** — chờ Hoà copy `SPEC_TEMPLATE 1.xlsx` vào `scripts/fixtures/` để chạy
  cả 2 nhánh + mở bằng Excel thật chốt hướng.
- 3 nhánh `worktree-agent-*` merged còn local; `fix/hatch-t-junction`+`fix/quality-pipeline` chưa merge.
- Sprint BOQ ĐỢT 3 (`2.1.9.p`, engine thật) — Hoà đã greenlight, làm tiếp sau ĐỢT DEMO.
- **2.2.16-2.2.21**, 12 file phụ SPEC-TỔNG §9, `2.2.83` ranh giới — chưa quyết, chi tiết ở
  `docs/IF-FEATURE-TREE.md`/CHANGELOG.

## Nợ kỹ thuật
→ Tách ra `docs/TECH-DEBT.md` (30/07, giữ STATUS dưới 800 từ) — nội dung nguyên vẹn, không mất mục nào.

## Quy tắc session
*(worktree/LUẬT NỀN TẢNG → `CLAUDE.md`. Chi tiết đầy đủ → memory: `feedback-docs-never-overwrite`, `feedback-verify-before-trust`, `project-ben-doc-bundle-workflow`.)*
1. Không tự merge/push **main** nếu chưa hỏi; đã hỏi rồi thì tự làm (đã push xong lần này).
2. **LUẬT MÁU verify browser**: qua `127.0.0.1:<port>` (KHÔNG `localhost`); KHÔNG logout/xoá cookie.
3. Login demo: `demo@if.local` / `demo1234`.
