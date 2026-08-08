# M-BANG-KIEM-OUT — phiếu p3c · Bảng kiểm ba chặng (08/08)

Worktree: `.worktrees/p3c` (nhánh `feat/p3c-bang-kiem`, gốc `3578af2`).
⚠️ Phiếu ghi `../interiorflow-wt-p3c` — đã tạo đúng vậy rồi **PHẢI dời vào `.worktrees/p3c`**
(`git worktree move`) vì `preview_start` của môi trường chỉ chạy được cwd NẰM TRONG project root;
tiền lệ `.worktrees/pbr-schema` có sẵn. Nhánh/nội dung không đổi.

## 1 · NƠI MOUNT (N6)

| Gì | file:dòng |
|---|---|
| Panel mới | `components/review/ReviewPanel.tsx` (MỚI, ~230 dòng) |
| **Mount DUY NHẤT** | `components/studio/AppShell.tsx:34` (import) + `components/studio/AppShell.tsx:166-173` — sau `InspectorSlot`, mép phải ngoài cùng; render khi `active ∈ {cad, render, present}` (2 màn /files·/settings không có gì để kiểm) |
| Đo bằng máy | DOM thật: dải `aria-label="Mở bảng kiểm"` tại x=1426, w=14, h=826 (full-height mép phải) — có mặt ở CẢ 3 chặng |

Panel tự đọc chặng qua prop `stage` (AppShell truyền `active`) → `review2d`/`review3d`/`reviewDeck`
(`lib/review/index.ts` — hợp đồng đọc TRỌN trước khi vẽ, không thiết kế lại). Ruột chỉ TÍNH khi
panel MỞ (PanelFlank không render children lúc thu ⇒ `checkStandards` không chạy nền mọi màn).

## 2 · ẢNH BA CHẶNG (đều chụp browser thật 127.0.0.1:3012, worktree server riêng, transcript phiên này)

| Chặng | Ảnh cho thấy |
|---|---|
| **Thiết kế 2D** | Bảng kiểm mở, badge đếm **2**; khối **LUẬT** 2 mục thật trên dữ liệu test (phòng ngủ 2,5×3m): ① *"diện tích 7.5m² < 9m² tối thiểu — TCVN 4451:2012"* chấm vàng + nút "Tới chỗ này" ② *"0 ổ cắm < 2 khuyến nghị (TCVN 9206:2012)"* + nguồn ghi rõ *"CHƯA đối chiếu trực tiếp bản PDF gốc"* (mang `chuaKiemChung` từ rule verified:false); **vạch ngăn**; khối **GỢI Ý — MAGIC, CHỈ LÀ Ý KIẾN** (tím, glyph Sparkles) hiện câu chặn đề bài |
| **Thiết kế 3D** | Badge **1**; khối LUẬT: *"Nét vt-ho đùn cao 2700mm từ đường HỞ — khối sinh ra không kín mặt…"* (`r3d-khoi-ho`, rules-3d mới) + nút "Tới chỗ này" + nút **"Sửa"** (finding có `cachSua`); vạch ngăn; khối GỢI Ý câu chặn |
| **Trình chiếu** | Hai khối vẫn tách bạch; khối LUẬT ghi trung thực: *"Chưa nối được hồ sơ đang mở — dữ liệu deck sống trong trình dàn trang… đây không phải '0 vi phạm'"* (xem mục 5); khối GỢI Ý câu chặn |

Hai lớp **không trộn**: dữ liệu đã tách từ `ReviewResult` (compile-time), UI 2 khối 2 tiêu đề,
lớp gợi ý không màu cảnh báo/không điểm số/không chặn — chỉ viền tím đứt + chữ "gợi ý" + nút Bỏ qua.

## 3 · CHỨNG MINH NHẢY-TỚI (nghiệm thu #3)

- **2D**: bấm "Tới chỗ này" của finding diện tích → viewport đổi THẬT, đo bằng máy:
  `{scale:0.08,panX:300,panY:400}` → `{scale:0.187,panX:379.7,panY:640}` — camera ôm đúng phòng
  (ảnh sau-bấm: PHÒNG NGỦ chiếm khung). Cơ chế: sự kiện `cad:goto-box` CÓ SẴN
  (`components/cad/CadCanvas.tsx:434`), không chế đường camera thứ hai.
- **Chọn đối tượng**: finding `r3d-khoi-ho` mang `viTri.entityId` → bấm → đo
  `useCadStore.getState().selection === ["vt-ho"]` — **đối tượng lỗi ĐƯỢC CHỌN thật**.
- ⚠️ Giới hạn hợp đồng dữ liệu (khai thật): `Violation` của `checkStandards` (2D) chỉ mang `at`
  (điểm mm), KHÔNG mang entityId ⇒ finding 2D nhảy-zoom tới đúng chỗ nhưng không select được
  entity. Muốn select cả 2D phải thêm `entityId?` vào `Violation` — file `lib/cad/standards/`
  (đợt này không đổi hợp đồng, ghi để TỔNG quyết).

## 4 · NHỚ TRẠNG THÁI + PanelFlank (không chế dải thứ hai)

- Tay cầm = `PanelFlank` dùng chung, key RIÊNG TỪNG CHẶNG (`if.panelflank.review.cad/render/present`)
  — đo localStorage: cả 3 key độc lập, mở ở chặng này không kéo chặng kia.
- RELOAD trang (chặng Trình chiếu đang mở) → sau hydrate, dải `aria-expanded=true` + header
  "Bảng kiểm" hiện — **nhớ qua reload hoạt động** (lần đo NGAY sau reload thấy "Mở bảng kiểm" là
  đo giữa lúc hydrate — đúng nhấp-nháy-1-khung đã ghi chú trong docstring PanelFlank, không phải bug).

## 5 · VIỆC 4 — lớp góp ý GIỮ NGUYÊN chặn ✓ · giới hạn chặng deck (khai thật, N5)

- `lib/review/gopy/index.ts` KHÔNG đụng — UI hiện đúng câu chặn "Chưa có đề bài đã ghi cho dự án…"
  ở cả 3 chặng (ảnh).
- **Chặng deck chưa có dữ liệu để kiểm**: slides sống trong state nội bộ `PresentEditor` (vùng
  p12 CẤM đụng); đọc bản autosave từ vỏ là đẻ nguồn sự thật thứ hai. Panel GHI RÕ trên màn thay vì
  hiện "0 vi phạm" giả. Nối thật cần p12 xuất slides ra một cửa đọc được (đề xuất cho TỔNG).

## 6 · CỬA KIỂM

- `npx tsc --noEmit -p .` (worktree) → **EXIT 0**.
- `node scripts/check-chot.mjs` → **9 luật · 0 đỏ · 0 vàng**.
- `npm test`: lần chạy trơn EXIT 1 — **3 file integration** (`lib/server/draft-project.test.ts` ·
  `tasks.test.ts` · +1 cùng họ) văng `PrismaClientInitializationError: Environment variable not
  found: DATABASE_URL`. Đây là **lỗi MÔI TRƯỜNG worktree, không phải lỗi code phiếu này** — chứng
  minh: cùng file chạy với `DATABASE_URL=file:…/.worktrees/p3c/prisma/dev.db` → **7/7 pass**;
  main repo (có sẵn env) cũng pass. Nguyên nhân tầng Prisma không tự nạp `.env` của worktree
  (đã thử cả `./.env` lẫn `prisma/.env`) — chưa truy tới đáy, ghi CHƯA VERIFY phần này.
  Lần chạy ĐỦ BỘ với env export: `DATABASE_URL=file:…/.worktrees/p3c/prisma/dev.db npm test` →
  **EXIT 0 · 0 PrismaClientInitializationError** — không thêm lỗi mới, đạt cửa kiểm.
- Môi trường worktree tự dựng để verify (khai để Hoà biết, không phải file giao): `.env` +
  `.env.local` (copy) + `prisma/dev.db` (bản sao qua `sqlite3 .backup`, ĐÚNG luật không `cp`) —
  cả 3 nằm ngoài git (ignored). Server 3012 qua entry `interiorflow-p3c-worktree` thêm vào
  `.claude/launch.json` (repo GỐC — file đó đang được các phiên chỉnh chung, p14 cũng vừa thêm
  entry 3013). Dữ liệu test 6 entity `vt-*` đã dọn (`removeIds`, đo lại = 0).

## 7 · CHƯA VERIFY / còn treo
- 🟡 Gốc rễ vụ Prisma-không-nạp-.env trong worktree (mục 6) — cần truy khi rảnh, không chặn phiếu.
- 🟡 Nhảy-tới ở chặng deck (chưa có dữ liệu deck — mục 5) + select-entity cho finding 2D (giới hạn
  hợp đồng `Violation` — mục 3).
- Ảnh chỉ chụp theme đang hoạt động (sáng). Chưa chụp theme tối cho panel này.

---
Tệp OUT: `docs/M-BANG-KIEM-OUT.md` · dán vào phiên `p3c`
