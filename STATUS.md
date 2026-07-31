# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (31/07 — ĐỢT B lớp lưu trữ: B1-B4 xong, CHỜ GẬT B5)
Chi tiết đầy đủ → `CHANGELOG.md` + `docs/IF-FEATURE-TREE.md` `4.1.d`. Tóm tắt:
- ✅ **B4 — đảo nguồn sự thật** (`4.1.d`, PHA RỦI RO NHẤT, kế hoạch trình + Hoà gật kèm 4 bổ sung
  trước khi code). `lib/disk-sync.ts` mới: `resolveSourceOfTruth()` THUẦN (ngưỡng dung sai 2s —
  `modifiedAt`/`IndexedDB.ts` không nguyên tử, lệch trong ngưỡng = tie = DÙNG CACHE; guard "đĩa ít
  sheet hơn cache" = nghi ghi dở, KHÔNG thay im lặng) · `createDiskWriter()` throttle riêng (không
  debounce) + ⌘S/rời trang ép ghi ngay · `watchProjectPresence()` cảnh báo 2 tab cùng mở 1 dự án.
  Nối CAD (Zustand, không dính lớp lỗi remount B2) + Present (BẮT BUỘC tăng `importGen`, đường tự
  động đi qua ĐÚNG 1 hàm với nhập tay `.idfp`); thêm ⌘S cho Present. **2 bug thật bắt được khi
  browser-verify**: ① `flowName` nạp bất đồng bộ ⇒ có thể tạo nhầm 2 thư mục khác tên cho cùng 1
  dự án — sửa bằng gọi lại `ensureProjectScope()` trước khi đọc tên. ② cảnh báo đa-tab chỉ gửi
  `'bye'` lúc `beforeunload` — đóng không sạch ⇒ banner treo vĩnh viễn — sửa bằng heartbeat+TTL.
  Verify thật (OPFS + nhiều tab thật): di trú đúng tên · đĩa thắng id TRÙNG hiện đúng nội dung mới
  (CAD lẫn Present) · guard sheet-thiếu giữ cache + tự lành · cảnh báo đa-tab 2 chiều + tự hết khi
  tab kia mất. 14 test mới, tsc+eslint+test+build sạch. Còn 1 phép thử CHỈ Hoà tự làm được (mất
  quyền giữa phiên qua reload thật) — checklist đã soạn sẵn kèm báo cáo.
- ✅ **B1-B3 xong** — B1 chọn thư mục gốc, B2 `.idfp` Present (bug remount → `importGen`), B3
  brand-kit.json ra thư mục dự án + vá sự cố mất-dữ-liệu-im-lặng 31/07 (quyền File System Access
  reset sau mỗi lần tải trang). 5 pha B1-B5 — còn B5 (nghiệm thu: copy thư mục dự án sang máy
  khác, mở lên, chạy đủ).
- ✅ **ĐỢT A merge + dọn git** — `7.1.24`/`7.1.25`. Code phụ chỉ đề xuất mã, code chính ghi cây
  (Luật #12b mới). Dọn ref hỏng chặn `git fetch` + lock rác + `git gc`.
- ✅ **Sprint "Lộ nền"** (`7.3.33`/`2.1.11`/`7.3.34`) · **2.2.89/7.3.32/2.1.8.n** (demo LAN) ·
  **7.3.31/2.1.8.k-m/7.1.20/2.2.86/BOQ ĐỢT 1+2/7.1.21+Luật #13** — chi tiết → CHANGELOG.
- 🟡 **2.2.87+2.2.88** cascade 4 bậc CHƯA verify ảnh thật · **7.1.23** Bước 1 xong CHỜ HOÀ GẬT, hoãn
  tới khi ĐỢT B xong.
- ⏸️ Mục "B2/B4" cũ trong CHANGELOG trùng tên tình cờ, KHÔNG liên quan ĐỢT B. Sprint BOQ ĐỢT 3
  (`2.1.9.p`) — kế tiếp sau ĐỢT B.

## Worktree đang mở
Không có. `feat/sprint-infra`+`feat/dot-a-ha-tang` đã merge + prune + xoá branch/thư mục/lock rác
— đủ điều kiện an toàn.

## Chờ USER quyết
- **④ `FlowVersion`** — 14 dòng/7,27MB/5,31% `dev.db`, không phải thủ phạm phình DB → hạ 🟡. 136MB
  còn lại của 143MB `dev.db` bất thường — nghi `NotebookChunk`/`Flow.graphJson`/`ChatMessage` rác
  chưa VACUUM, đo sau.
- **NT1**/**NT5** (gộp Library panel/browser · cây thư mục thật) — dời sau (`docs/PLAN-LIBRARY-GATEWAY.md`).
- **T3/T4** (Semantic Room) — làm tiếp phiên sau, lý do ở CHANGELOG "26/07".
- **Figma**: MCP lỗi `net::ERR_FAILED`. Đường vòng: file trống + `docs/figma-bootstrap.js`.
- **DWG**: sửa GPL ngay (0đ)? · server-side? · ODA khi bán? → `docs/RESEARCH-DWG-LICENSE.md`. **Mới
  31/07**: `2.1.6.d` 🔴 bug Nhập DWG treo vĩnh viễn trên file thật (nghi block-flatten INSERT bùng
  nổ) — HÀNG ĐỢI, làm sau khi ĐỢT B xong hẳn (B5), chi tiết đủ ở cây.
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
