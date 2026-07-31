# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (31/07 — 2.1.8.n Ctrl+S/xuất/chỉ báo lưu xong (GẤP LAN), sprint BOQ+B3+merge 30/07)
Chi tiết đầy đủ → `CHANGELOG.md` (mỗi dòng dưới đây có 1 mục tương ứng ở đó). Tóm tắt:
- ✅ **2.1.8.n (31/07, GẤP chặn thử CAD LAN)** — Ctrl/⌘+S ép autosave chạy ngay + toast "Đã lưu —
  HH:MM" (không đường lưu mới) · Ctrl/⌘+Shift+S xuất `.idf` (tái dùng luồng có sẵn) · StatusBar
  thêm giờ vào chỉ báo "Đã lưu lúc HH:MM" (khung đã có sẵn từ VIỆC A 28/07, chỉ thiếu giờ). Verify
  browser thật: cả 3 việc chạy đúng, input-guard chặn khi đang gõ lệnh. tsc+eslint+test sạch.
- ✅ **7.3.31/2.1.8.k-m/7.1.20/2.2.86/2.2.70(a)(b)/7.1.19-merge** — hợp nhất AppChrome hết overlap ·
  PDF nhiều tờ+khổ/hướng giấy · gộp hệ ngưỡng breakpoint (Luật #10/#11) · hàng đợi "Việc" · 2 fix
  nhỏ · Lark Wiki merge (**VẪN 🟡**, chờ 3 khoá Lark verify call thật). Xem CHANGELOG nếu cần chi tiết.
- 🟡 **2.2.87+2.2.88 SỬA SANG cascade 4 bậc "không-bao-giờ-fail", HẠ TỪ ✅ (Hoà chốt)** —
  `measureObjectTiered()` tự tụt bậc, không bao giờ throw. 46/46 test. **CHƯA verify ảnh thật
  trong browser** — nâng lại ✅ khi Hoà tự thử. Disclose: Tầng 2/3 AI chưa làm.
- ✅ **7.1.21+Luật #13 Trung Tính** (merge worktree phụ `feat/sprint-infra`, `7a62e09`) — `"test"`
  vào `package.json`. Sửa khi merge: bỏ loại trừ `auto-backup.test.ts` chết (file đã xoá trong B3,
  thay `backup-diff.test.ts` 50 test). `7.1.22` CHƯA CODE.
- ✅ **B3 (`4.6` sửa) — backup CAD bỏ "giữ 5 bản" sang thang thời gian + lưu chênh lệch** —
  `lib/cad/backup-diff.ts` (50 test) + lối phục hồi UI mới. **Giới hạn công cụ disclose rõ**
  (`docs/VERIFY-B3.md`): không tự động hoá được hộp thoại chọn thư mục thật/`kill -9` Electron thật
  — hướng dẫn 3 bước Hoà tự làm 1 lần. ⚠️ Còn 1 project test (`cms7imxpt...`) trong demo — Hoà xoá tay.
- ✅ **Sprint BOQ ĐỢT 1 — `2.1.9.q`** — `polygonPerimeter()`+`openingsAreaInPolygon()` vào
  `hatch.ts`. Phát hiện khi khám: `BlockDef.h` không phải chiều cao cửa — sửa dùng
  `w`×`OPENING_STANDARD_HEIGHT_MM`. 45/45 test.
- ✅ **Sprint BOQ ĐỢT 2 — `2.1.9.r` (ATLAS Material cache)** — phát hiện chỉ đạo gốc "bảng
  AtlasMaterial riêng" đụng `ProductSpec{kind:'material'}` có sẵn, Hoà xác nhận mở rộng
  ProductSpec thay vì bảng mới (Luật Đồng Bộ #6). 6 field mới (`priceVnd` Decimal...), `priceNote`
  cũ giữ song song. `MaterialDef.atlasRecordId?` neo sang `ProductSpec.larkRecordId`. Route
  `/api/atlas-materials/sync` — mapping PLACEHOLDER, chưa verify tên cột thật. 22/22 test.
- 🟡 **7.1.23 (Luật chữ Việt) — Bước 1 xong, CHỜ HOÀ GẬT** — bảng phân loại đầy đủ ở
  `docs/AUDIT-7.1.23-BANG-PHAN-LOAI-2026-07-31.md` (~112 chỗ sửa tay ①②③⑤ab + ⑤c hệ thống ~100+
  chỗ, đã chốt hướng đổi token chung sàn 13px). CHƯA sửa dòng nào — đợi gật trước Bước 2.
- ⏸️ **Còn treo**: B2/B4 chưa làm. Sprint BOQ ĐỢT 3 (`2.1.9.p`, engine thật) — kế tiếp.

## Worktree đang mở
Không có. `feat/sprint-infra` đã merge (`7a62e09`) + prune + xoá branch/thư mục/lock rác — đủ 4
điều kiện an toàn.

## Chờ USER quyết
- **NT1** (gộp `LibraryPanel`+`LibraryBrowser`, LỚN) và **NT5** (cây thư mục thật, RẤT LỚN) —
  `docs/PLAN-LIBRARY-GATEWAY.md` mục "Thứ tự làm" dời cả 2 sau, chưa hẹn ngày.
- **T3/T4** (Semantic Room sprint, phần còn lại): làm tiếp phiên sau — xem `docs/CHANGELOG.md`
  phần "26/07 khuya" cho lý do kỹ thuật đã chốt (T1/T2) trước khi bắt đầu T3/T4.
- **Figma**: MCP trả `net::ERR_FAILED` 2 lần. Đường vòng: file trống + `docs/figma-bootstrap.js`.
- **DWG**: sửa tuân thủ GPL ngay (0đ)? · server-side (mất offline)? · ODA khi bán? →
  `docs/RESEARCH-DWG-LICENSE.md`.
- Treo: VIỆC 4 cũ (GuProfile=dữ liệu) · #14 (cụm Mẫu Presenting).
- **Xlsx round-trip probe** (`scripts/probe-xlsx-roundtrip.ts`) — chờ Hoà copy `SPEC_TEMPLATE
  1.xlsx` vào `scripts/fixtures/` rồi chạy cả 2 nhánh `--mode=ziponly`/`--mode=exceljs` + mở bằng
  Excel thật để chốt (khuyến nghị hiện tại "vá XML trong zip" mới CÓ ĐIỀU KIỆN, chưa verify file thật).
- 3 nhánh `worktree-agent-*` merged còn local; `fix/hatch-t-junction`+`fix/quality-pipeline` chưa merge.
- BOQ: matId nối vào đâu **ĐÃ CHỐT + CODE XONG 30/07** (`2.1.9.r` — mở rộng `ProductSpec`, xem
  trên); groundwork hình học (`2.1.9.q`) cũng xong. Engine thật (`2.1.9.p`) — Hoà đã greenlight
  trong sprint BOQ, đang làm tiếp ĐỢT 3.
- **2.2.16-2.2.21**, **12 file phụ SPEC-TỔNG §9**, **`2.2.83` ranh giới** — 3 mục cũ chưa quyết,
  chi tiết đủ trong `docs/IF-FEATURE-TREE.md`/`CHANGELOG.md`, không lặp lại ở đây.

## Nợ kỹ thuật
→ Tách ra `docs/TECH-DEBT.md` (30/07, giữ STATUS dưới 800 từ) — nội dung nguyên vẹn, không mất mục nào.

## Quy tắc session
*(worktree/LUẬT NỀN TẢNG → `CLAUDE.md`. Chi tiết đầy đủ → memory: `feedback-docs-never-overwrite`, `feedback-verify-before-trust`, `project-ben-doc-bundle-workflow`.)*
1. Không tự merge/push **main** nếu chưa hỏi; đã hỏi rồi thì tự làm (đã push xong lần này).
2. **LUẬT MÁU verify browser**: qua `127.0.0.1:<port>` (KHÔNG `localhost`); KHÔNG logout/xoá cookie.
3. Login demo: `demo@if.local` / `demo1234`.
