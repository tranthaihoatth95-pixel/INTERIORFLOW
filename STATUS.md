# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (31/07 — Sprint "Lộ nền" xong, ĐANG LÀM ĐỢT B lớp lưu trữ — B1)
Chi tiết đầy đủ → `CHANGELOG.md`. Tóm tắt:
- 🔵 **ĐANG LÀM: ĐỢT B — lớp lưu trữ** (`docs/QUYET-DINH-HA-TANG-2026-07-31.md`, Hoà đã gật kiến
  trúc) — 5 pha B1-B5, MỖI PHA BÁO+CHỜ GẬT riêng, tuyệt đối không chạy thẳng B4 (đảo nguồn sự thật
  IndexedDB→tệp thật, rủi ro mất dữ liệu). Tái dùng khuôn `lib/cad/auto-backup.ts` có sẵn
  (`showDirectoryPicker`/`storeHandle`/`loadHandle`/`writeAndPrune`), không viết cơ chế mới.
- ✅ **Sprint "Lộ nền" — `7.3.33`/`2.1.11`/`7.3.34`** (31/07, `docs/KIEM-NEN-2026-07-31.md`) — bảng
  tra phím tắt toàn app (`lib/shortcuts.ts` 1 nguồn, lệnh gõ tay CAD tách `command-aliases.ts`,
  layout theo mẫu Hoà gửi: cột phím 118px/hàng 30px/2 tab/ô tìm) · CAD thêm ⌘A chọn tất cả/⌘D nhân
  bản (nối hàm có sẵn)/⌘0·⌘=·⌘- zoom (phát hiện CAD ĐÃ CÓ SẴN phím `f`+nút Zoom Extents, chỉ thiếu
  ⌘0 discoverable) · dọn chữ CommandPalette (Anh→Việt, tự bắt lỗi đảo ternary khi đổi nhãn). 21+16
  test mới, tsc+eslint+test+build sạch mọi commit.
- ✅ **2.2.89** — menu chuột phải CAD thêm `onDismiss` cho `Popover` (khuôn `MenuButton`) · **7.3.32**
  — tràn headbar route render (mốc `sm`→`lg`) · **2.1.8.n** — Ctrl+S lưu ngay/xuất `.idf`/chỉ báo
  giờ lưu. Cả 3 GẤP cho ĐỢT DEMO CAD LAN 31/07, xong trước giờ thử.
- ✅ **7.3.31/2.1.8.k-m/7.1.20/2.2.86/B3(`4.6`)/Sprint BOQ ĐỢT 1+2(`2.1.9.q`+`.r`)/7.1.21+Luật #13**
  — hợp nhất AppChrome · PDF nhiều tờ · backup thang thời gian (`lib/cad/backup-diff.ts`) · BOQ
  groundwork+ATLAS cache · merge `feat/sprint-infra`. Chi tiết → CHANGELOG.
- 🟡 **2.2.87+2.2.88** — cascade 4 bậc, HẠ TỪ ✅ (Hoà chốt), CHƯA verify ảnh thật.
- 🟡 **7.1.23** — Bước 1 xong CHỜ HOÀ GẬT (~112 chỗ tay), hoãn tới khi ĐỢT B xong.
- ⏸️ **Còn treo**: mục "B2/B4" cũ trong CHANGELOG (đặt tên TRƯỚC khi có cây mã số, KHÔNG liên quan
  ĐỢT B lớp lưu trữ mới — tên trùng tình cờ). Sprint BOQ ĐỢT 3 (`2.1.9.p`) — kế tiếp sau ĐỢT B.

## Worktree đang mở
Không có. `feat/sprint-infra` đã merge (`7a62e09`) + prune + xoá branch/thư mục/lock rác — đủ 4
điều kiện an toàn.

## Chờ USER quyết
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
