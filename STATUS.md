# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (31/07 — ĐỢT DEMO CAD LAN: 7.3.32 xong · 2.1.8.n Ctrl+S xong · sprint BOQ+B3+merge 30/07)
Chi tiết đầy đủ → `CHANGELOG.md` (mỗi dòng dưới đây có 1 mục tương ứng ở đó). Tóm tắt:
- ✅ **7.3.32 (31/07, ĐỢT DEMO GẤP, BƯỚC 1①)** — tràn headbar 179px@640/51px@768 route render: đẩy
  mốc "hiện cụm phải" (Tasks/Home/⋯/UserChip) từ `sm`(640)→`lg`(1024) đồng bộ với `MobileMenu`, tái
  dùng bottom-sheet có sẵn thay vì viết UI mới. Verify browser thật `/render`+`/cad`: 0 tràn tại
  640/768/1024. **BƯỚC 0 đo trước phát hiện**: brief ② (`ToolModeForm` grid `1fr 1fr`) là NON-ISSUE
  — đo thật 0 tràn mọi mốc, không sửa. BƯỚC 0 không thấy gì nặng hơn ① nên bỏ qua ③. ④ (quét
  7.1.23 rổ A) KHÔNG kịp làm — hết ngân sách thời gian trước mốc chốt commit. `npm run build` sạch.
- ✅ **2.1.8.n (31/07, GẤP chặn thử CAD LAN)** — Ctrl/⌘+S ép autosave chạy ngay + toast "Đã lưu —
  HH:MM" · Ctrl/⌘+Shift+S xuất `.idf` (tái dùng luồng có sẵn) · StatusBar thêm giờ vào "Đã lưu lúc
  HH:MM". Verify browser thật cả 3 việc, tsc+eslint+test sạch.
- ✅ **7.3.31/2.1.8.k-m/7.1.20/2.2.86/2.2.70(a)(b)/7.1.19-merge** — hợp nhất AppChrome hết overlap ·
  PDF nhiều tờ+khổ/hướng giấy · gộp hệ ngưỡng breakpoint · hàng đợi "Việc" · Lark Wiki merge (**VẪN
  🟡**, chờ 3 khoá Lark verify call thật). Chi tiết → CHANGELOG.
- 🟡 **2.2.87+2.2.88 SỬA SANG cascade 4 bậc "không-bao-giờ-fail", HẠ TỪ ✅ (Hoà chốt)** —
  `measureObjectTiered()` tự tụt bậc, không bao giờ throw. 46/46 test. **CHƯA verify ảnh thật
  trong browser** — nâng lại ✅ khi Hoà tự thử. Disclose: Tầng 2/3 AI chưa làm.
- ✅ **7.1.21+Luật #13 Trung Tính** (merge worktree phụ `feat/sprint-infra`, `7a62e09`) — `"test"`
  vào `package.json`. Sửa khi merge: bỏ loại trừ `auto-backup.test.ts` chết (file đã xoá trong B3,
  thay `backup-diff.test.ts` 50 test). `7.1.22` CHƯA CODE.
- ✅ **B3 (`4.6` sửa) — backup CAD bỏ "giữ 5 bản" sang thang thời gian + lưu chênh lệch** —
  `lib/cad/backup-diff.ts` (50 test) + UI phục hồi mới. Giới hạn công cụ disclose ở `docs/VERIFY-B3.md`
  (không tự động hoá hộp thoại thư mục/`kill -9` thật) — 3 bước Hoà tự làm 1 lần. ⚠️ Còn 1 project
  test (`cms7imxpt...`) trong demo — Hoà xoá tay.
- ✅ **Sprint BOQ ĐỢT 1+2 — `2.1.9.q`+`2.1.9.r`** — `polygonPerimeter()`+`openingsAreaInPolygon()`
  vào `hatch.ts` (sửa `BlockDef.h` không phải chiều cao cửa, dùng `OPENING_STANDARD_HEIGHT_MM`,
  45/45 test) + ATLAS Material cache mở rộng `ProductSpec` thay vì bảng mới (Luật Đồng Bộ #6, 6
  field mới, `/api/atlas-materials/sync` mapping PLACEHOLDER, 22/22 test).
- 🟡 **7.1.23 (Luật chữ Việt) — Bước 1 xong, CHỜ HOÀ GẬT** — bảng phân loại đầy đủ ở
  `docs/AUDIT-7.1.23-BANG-PHAN-LOAI-2026-07-31.md` (~112 chỗ tay + ⑤c hệ thống, token sàn 13px đã
  chốt hướng). CHƯA sửa dòng nào. Quét toàn app hoãn sau ĐỢT DEMO (rule #4 của Hoà 31/07).
- ⏸️ **Còn treo**: B2/B4 chưa làm. Sprint BOQ ĐỢT 3 (`2.1.9.p`, engine thật) — kế tiếp.

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
