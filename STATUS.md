# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (31/07 — ĐỢT B lớp lưu trữ: B1+B2+B3 xong, CHỜ GẬT B4)
Chi tiết đầy đủ → `CHANGELOG.md`. Tóm tắt:
- 🟡 **ĐỢT B — `4.1.a`+`4.1.b`+`4.1.c` (B1+B2+B3) xong, DỪNG CHỜ GẬT B4** (`docs/QUYET-DINH-HA-TANG-2026-07-31.md`)
  — B1: chọn thư mục gốc `~/InteriorFlow` (`lib/root-folder.ts`) + UI "Lưu trữ" trong `/settings`.
  B2: `.idfp` cho Present (`lib/present-editor/idfp.ts`, khuôn `idf.ts`) — mang đủ slide/ảnh
  nhúng/font-theo-deck + brandKitSnapshot (bản CHỤP). **Bug thật bắt được khi browser-verify**:
  nhập `.idfp` giữ nguyên id sheet ⇒ canvas không remount dù tab đổi tên đúng — sửa bằng `importGen`
  ép remount. B3: `brand-kit.json` ra thư mục dự án — mở rộng `root-folder.ts`
  (`getProjectFolderHandle`/`writeTextFile`/`readTextFile`, hạ tầng chung cho B4) +
  `brand-kit-disk.ts` (mới, cầu nối mỏng tái dùng nguyên hàm THUẦN `7.1.25`) + nút "Nhập từ thư mục
  dự án" trong `BrandKitPanel.tsx`. **Giới hạn công cụ (B1+B3 giống nhau)**: `showDirectoryPicker()`
  cần gesture thật, không tự động hoá được — vòng ghi→đọc thật CHƯA verify tay thật, code mirror
  đúng khuôn `auto-backup.ts` đã chạy sản xuất; đã browser-verify phần còn lại: panel render đúng,
  Lưu không crash, nút disk-import ẩn đúng khi chưa có file. tsc+eslint+test+build sạch mọi bước.
  CHƯA đổi nguồn sự thật (đúng yêu cầu, chờ B4). 5 pha B1-B5, MỖI PHA BÁO+CHỜ GẬT riêng, tuyệt đối
  không chạy thẳng B4 (đảo nguồn sự thật IndexedDB→tệp thật — B4 phải trình kế hoạch xử lý
  remount/id trùng TRƯỚC khi code, bài học từ bug B2).
- ✅ **ĐỢT A merge + dọn git** — `7.1.24` khoá bộ học Gu theo user · `7.1.25` Brand Kit xuất/nhập
  `.json`. Code phụ chỉ đề xuất mã — code chính ghi cây (**Luật #12b mới**). Dọn ref hỏng CHẶN
  `git fetch` + 8 file `.lock*` rác + `git gc --prune=now`.
- ✅ **Sprint "Lộ nền" — `7.3.33`/`2.1.11`/`7.3.34`** (31/07) — bảng tra phím tắt toàn app
  (`lib/shortcuts.ts` 1 nguồn) · CAD thêm ⌘A/⌘D/⌘0·⌘=·⌘- · dọn chữ CommandPalette. 21+16 test.
  Chi tiết → CHANGELOG.
- ✅ **2.2.89/7.3.32/2.1.8.n** (GẤP demo LAN) · **7.3.31/2.1.8.k-m/7.1.20/2.2.86/B3(`4.6`)/BOQ ĐỢT
  1+2/7.1.21+Luật #13** — menu chuột phải/tràn headbar/Ctrl+S · hợp nhất AppChrome/PDF nhiều tờ/
  backup thang thời gian/BOQ groundwork+ATLAS cache. Chi tiết → CHANGELOG.
- 🟡 **2.2.87+2.2.88** — cascade 4 bậc, HẠ TỪ ✅ (Hoà chốt), CHƯA verify ảnh thật.
- 🟡 **7.1.23** — Bước 1 xong CHỜ HOÀ GẬT (~112 chỗ tay), hoãn tới khi ĐỢT B xong.
- ⏸️ Mục "B2/B4" cũ trong CHANGELOG (tên đặt TRƯỚC cây mã số, KHÔNG liên quan ĐỢT B mới — trùng tên
  tình cờ). Sprint BOQ ĐỢT 3 (`2.1.9.p`) — kế tiếp sau ĐỢT B.

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
