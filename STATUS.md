# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (31/07 — ĐỢT B lớp lưu trữ: B1+B2+B3 xong + sự cố B3 đã vá, CHỜ GẬT B4)
Chi tiết đầy đủ → `CHANGELOG.md` + `docs/IF-FEATURE-TREE.md` `4.1.c`. Tóm tắt:
- 🔴→✅ **SỰ CỐ 31/07 — mất-dữ-liệu-im-lặng ở B3** (Hoà bắt ngay sau báo cáo B3, TRƯỚC khi gật B4).
  Chọn thư mục xong, "Lưu Brand Kit" báo đã lưu nhưng KHÔNG ghi file thật, không hộp xin quyền hiện
  ra. Verify độc lập bằng handle **OPFS thật** (không mock, qua đúng code sản xuất): logic ghi/đọc
  ĐÚNG 100% — lỗi 100% ở TẦNG QUYỀN (`readwrite` reset về `'prompt'` sau mỗi lần tải lại trang, đúng
  đặc tả API — `requestPermission()` gọi lại thiếu activation ⇒ Chrome âm thầm `'denied'`, không hộp
  thoại — khớp đúng quan sát của Hoà). Sửa: ① `getProjectFolderHandle`/`writeBrandKitToProjectFolder`
  trả LÝ DO cụ thể thay vì `null`/`boolean` mập mờ — `BrandKitPanel` tách "đã lưu máy" khỏi "đã ghi
  đĩa" (banner đỏ riêng, không tự tắt khi lỗi). ② Không dựng nút xin-quyền riêng — banner lỗi trỏ
  sang nút ③. ③ `testStorageConnection()` + nút "Kiểm tra kết nối thư mục" mới (Settings) — ghi/đọc/
  dọn 1 tệp thật vào thư mục gốc, chính cú bấm vừa kiểm vừa cấp lại quyền. Rà cùng lớp: `ensurePermission()`
  bọc try/catch đầy đủ hơn (B1+B3 dùng chung). Verify lại bằng browser thật (OPFS): nút Kiểm tra báo
  ✓ đúng + dọn rác đúng · Lưu Brand Kit ghi file MỚI đúng nội dung + nút Nhập xuất hiện đúng lúc.
  tsc+eslint+test+build sạch lại.
- 🟡 **ĐỢT B — `4.1.a`+`4.1.b`+`4.1.c` xong, DỪNG CHỜ GẬT B4** (`docs/QUYET-DINH-HA-TANG-2026-07-31.md`)
  — B1 chọn thư mục gốc, B2 `.idfp` cho Present (**bug thật**: nhập giữ nguyên id sheet ⇒ canvas
  không remount — sửa bằng `importGen`), B3 brand-kit.json ra thư mục dự án (nay đã vá sự cố trên).
  CHƯA đổi nguồn sự thật. 5 pha B1-B5, MỖI PHA BÁO+CHỜ GẬT riêng — B4 phải trình kế hoạch xử lý
  remount/id trùng TRƯỚC khi code VÀ xác nhận không lặp lại lớp lỗi permission-timing vừa vá.
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
  nổ) — HÀNG ĐỢI, chờ xong sự cố ghi đĩa B3, chi tiết đủ ở cây.
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
