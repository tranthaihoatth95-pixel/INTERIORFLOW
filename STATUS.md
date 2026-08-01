# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (01/08 — ĐỢT B lớp lưu trữ HOÀN TẤT, B1-B5 đủ)
Chi tiết đầy đủ → `CHANGELOG.md` + `docs/IF-FEATURE-TREE.md` `4.1.a-e`. Tóm tắt:
- ✅ **B5 — nghiệm thu ĐỢT B** (`4.1.e`, 01/08, Hoà tự chạy thật — ẩn danh, copy thư mục dự án
  sang `IF-MAYKHAC`). **7/7 ĐẠT** (CAD/Present/Brand Kit/StatusBar/bản gốc còn nguyên — verify
  TRÊN ĐĨA bằng diff tệp). **ĐỢT B (B1-B5) ĐÓNG.**
- ✅ **B1-B4** — chọn thư mục gốc · `.idfp` Present · `brand-kit.json` ra thư mục dự án ·
  `lib/disk-sync.ts` đảo nguồn sự thật, nối CAD+Present — chi tiết đủ → CHANGELOG + `4.1.a-d`.
- 🆕 **4.1.f — Brand Kit KHÔNG đảo nguồn theo B4** (khám xong, CHƯA CODE) — vẫn localStorage
  global, `brand-kit.json` chỉ xuất MỘT CHIỀU ⇒ hồ sơ sạch tạo id `bk_` MỚI thay vì nhận id trên
  đĩa. `resolveSourceOfTruth()` không tái dùng thẳng được — thư viện DÙNG CHUNG nhiều dự án, khác
  bản chất 1-dự-án-1-file. Xem "Chờ USER quyết".
- ✅ **ĐỢT A merge + dọn git** · **Sprint "Lộ nền"** · **2.2.89/7.3.32/2.1.8.n** (demo LAN) ·
  **7.3.31/2.1.8.k-m/7.1.20/2.2.86/BOQ ĐỢT 1+2/7.1.21+Luật #13** — chi tiết → CHANGELOG.
- ✅ **2.2.90 ĐỢT 1+2 — `useDismissable`** (`5d81364`+`ad737e3`). ĐỢT 1: nối `MenuButton`/
  `IOMenu`/`RenderIOMenus`, sửa `stopPropagation` gọi sớm chặn Escape nổi lên window. ĐỢT 2:
  `Popover.tsx`+`AppChrome.tsx` (`MoreMenu`/`UserChip`/Tasks) — bỏ backdrop, thêm Escape. Verify
  browser thật đủ 4 nơi trừ FlowCanvas (môi trường, suy ra từ component chung). Cấp mã `2.2.92`
  mở rộng (overlay đè popover, pre-existing). tsc+eslint+test+build sạch. CHỜ GẬT ĐỢT 3 (panel CAD).
- 🟡 **2.2.87+2.2.88** cascade 4 bậc CHƯA verify ảnh thật · **7.1.23** Bước 1 xong CHỜ HOÀ GẬT —
  ĐỢT B đã xong, cả hai giờ MỞ LẠI được, chưa ai động tới.
- ⏸️ Mục "B2/B4" cũ trong CHANGELOG trùng tên tình cờ, KHÔNG liên quan ĐỢT B. Sprint BOQ ĐỢT 3
  (`2.1.9.p`) — ĐỢT B xong, tới lượt (Hoà đã greenlight).

## Worktree đang mở
Không có. `feat/sprint-infra`+`feat/dot-a-ha-tang` đã merge + prune + xoá branch/thư mục/lock rác
— đủ điều kiện an toàn.

## Chờ USER quyết
- **🆕 `4.1.f` Brand Kit — 3 câu hỏi** (khám xong, chi tiết đủ ở cây): ① đảo nguồn theo B4 đụng
  gì — có tái dùng `resolveSourceOfTruth()` được không hay cần thiết kế hợp nhất cấp-từng-kit
  riêng? ② **Brand Kit của DỰ ÁN hay của STUDIO?** — sơ đồ gốc `QUYET-DINH-HA-TANG-2026-07-31.md`
  ② dự tính CẢ HAI lớp (`<dự án>/brand-kit.json` + `_studio/brand-kit-mac-dinh.json`) nhưng lớp
  `_studio/` CHƯA CODE — nếu CẢ HAI thì B4-kiểu-1-tầng sai khuôn. ③ microcopy
  `BrandKitPanel.tsx:497-501` lỗi thời một nửa, đã đề xuất câu thay — chờ chốt hướng trước khi đổi
  (đổi 2 lần nếu đổi sớm).
- **④ `FlowVersion`** — 14 dòng/7,27MB/5,31% `dev.db`, không phải thủ phạm phình DB → hạ 🟡. 136MB
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
