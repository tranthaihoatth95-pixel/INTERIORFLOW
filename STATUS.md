# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (01/08 — ĐỢT B HOÀN TẤT · sự cố `dev.db` đã KHÉP, không mất dữ liệu)
Chi tiết đầy đủ → `CHANGELOG.md` + `docs/IF-FEATURE-TREE.md` `4.1.a-e`. Tóm tắt:
- ✅ **B1-B5 (ĐỢT B) ĐÓNG** — B5 nghiệm thu 7/7 ĐẠT (01/08, Hoà tự chạy, verify TRÊN ĐĨA bằng diff
  tệp) · đĩa là nguồn sự thật cho `.idf`/`.idfp`, nối CAD+Present — chi tiết → CHANGELOG + `4.1.a-e`.
- ✅ **4.1.f Brand Kit — Hoà ĐÃ QUYẾT** thuộc DỰ ÁN (`docs/CHOT-BRAND-KIT-2026-08-01.md`) — kèm
  đính chính B5 dòng (e): màu/font/tên đo được từ **DECK** (`.idfp`), không phải `brand-kit.json`
  được đọc. Thi công đổi hình dạng tệp CHƯA làm — xem "Chờ USER quyết".
- ✅ **`docs/00-CHOT.md`** (sổ mục lục, đọc đầu phiên sau STATUS.md) — `CLAUDE.md` dòng 2 theo.
- ✅ **Present — A1b/c chữ nghĩa**: tab "Mẫu"→**"Magic"** (6 chỗ `PresentEditor.tsx`) · microcopy
  `BrandKitPanel.tsx:497-501` đúng hiện trạng (Hoà duyệt).
- ✅ **A2** xoá `TemplatePicker.tsx` (dead code, `grep`=0 xác nhận lại trước khi xoá). **A3**
  `SPEC-PRESENT-FLOW.md`: gỡ cảnh báo sai + "25 template"→**21** (đếm `BUILTIN_TEMPLATES` thật,
  không dùng số 47 raw lẫn kiểu dữ liệu). **A4** gỡ nhãn `[CẦN HOÀ DUYỆT]` 7 spec đã duyệt (2 Hoà,
  4 Cowork thay, 1 tách vai trò/cơ chế) — `docs/CHOT-DUYET-SPEC-2026-08-01.md`. tsc+eslint+
  test+build sạch cả đợt.
- ✅ **ĐỢT A + Sprint "Lộ nền" + 2.2.89/7.3.x/2.1.8.x/2.2.86/BOQ ĐỢT 1+2** — chi tiết → CHANGELOG.
- ✅ **2.2.90 ĐỢT 1+2 `useDismissable`** (`5d81364`+`ad737e3`) — nối `MenuButton`/`IOMenu`/
  `RenderIOMenus`/`Popover`/`AppChrome`, sửa lỗi `stopPropagation` chặn Escape window. Cấp mã
  `2.2.92` (overlay đè popover, pre-existing). CHỜ GẬT ĐỢT 3 (panel CAD).
- 🟡 **2.2.87+2.2.88**/**7.1.23** CHỜ HOÀ GẬT — ĐỢT B xong, MỞ LẠI được, chưa ai động.

## Worktree đang mở
Không có. `feat/sprint-infra`+`feat/dot-a-ha-tang` đã merge + prune + xoá branch/thư mục/lock rác
— đủ điều kiện an toàn.

## Chờ USER quyết
- **4.1.f thi công** — hướng đã chốt, CHƯA làm: đổi hình dạng `brand-kit.json` (chỉ kit của dự án
  đó) TRƯỚC khi bàn đảo nguồn.
- **`knowledge/ttt-design-system/`** (16 KB) đang trong git — vi phạm LUẬT TRUNG TÍNH, `.gitignore`
  chưa khớp (nêu ở `docs/CHOT-DUYET-SPEC-2026-08-01.md` §3) — CHƯA sửa, ngoài phạm vi đợt này.
- **④ `FlowVersion`** — 14 dòng/7,27MB/5,31% `dev.db`, không phải thủ phạm → hạ 🟡. 136MB
  còn lại của 143MB `dev.db` bất thường — nghi `NotebookChunk`/`Flow.graphJson`/`ChatMessage` rác
  chưa VACUUM, đo sau.
- **NT1**/**NT5** (gộp Library panel/browser · cây thư mục thật) — dời sau (`docs/PLAN-LIBRARY-GATEWAY.md`).
- **T3/T4** (Semantic Room) — làm tiếp phiên sau, lý do ở CHANGELOG "26/07".
- **Figma**: MCP lỗi `net::ERR_FAILED`. Đường vòng: file trống + `docs/figma-bootstrap.js`.
- **DWG**: sửa GPL ngay (0đ)? · server-side? · ODA khi bán? → `docs/RESEARCH-DWG-LICENSE.md`. **Mới
  31/07**: `2.1.6.d` 🔴 bug Nhập DWG treo vĩnh viễn trên file thật (nghi block-flatten INSERT bùng
  nổ) — ĐỢT B đã xong, đến lượt HÀNG ĐỢI này, chưa ai động, chi tiết đủ ở cây.
- Treo: VIỆC 4 cũ (GuProfile) · #14 (Mẫu Presenting).
- **Xlsx round-trip probe** — chờ Hoà copy `SPEC_TEMPLATE 1.xlsx` vào `scripts/fixtures/`.
- 3 nhánh `worktree-agent-*` merged còn local; `fix/hatch-t-junction`/`fix/quality-pipeline` chưa merge.
- Sprint BOQ ĐỢT 3 (`2.1.9.p`) — Hoà đã greenlight, tiếp sau ĐỢT DEMO.
- **2.2.16-2.2.21**, 12 file phụ SPEC-TỔNG §9, `2.2.83` ranh giới — chưa quyết, chi tiết ở
  `docs/IF-FEATURE-TREE.md`/CHANGELOG.

## Nợ kỹ thuật
→ Tách ra `docs/TECH-DEBT.md` (30/07, giữ STATUS dưới 800 từ) — nội dung nguyên vẹn, không mất mục nào.

## Quy tắc session
*(worktree/LUẬT NỀN TẢNG → `CLAUDE.md`. Chi tiết đầy đủ → memory: `feedback-docs-never-overwrite`, `feedback-verify-before-trust`, `project-ben-doc-bundle-workflow`.)*
1. Không tự merge/push **main** nếu chưa hỏi; đã hỏi rồi thì tự làm (đã push xong lần này).
2. **LUẬT MÁU verify browser**: qua `127.0.0.1:<port>` (KHÔNG `localhost`); KHÔNG logout/xoá cookie.
3. Login demo: `demo@if.local` / `demo1234`.
4. **KHÔNG `prisma db push`/`migrate` qua sandbox** (FUSE chặn khoá file SQLite đúng chuẩn) — soạn
   lệnh sẵn cho Hoà chạy máy thật. Backup SQLite bằng `sqlite3 dev.db ".backup 'ten'"`, không `cp`.
   Chi tiết → `docs/00-CHOT.md` mục "LUẬT VẬN HÀNH".
