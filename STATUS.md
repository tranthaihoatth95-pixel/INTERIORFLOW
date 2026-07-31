# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (31/07 — ĐỢT DEMO CAD LAN: 2.2.89 xong (ƯU TIÊN 1) · 7.3.32 xong · 2.1.8.n Ctrl+S xong)
Chi tiết đầy đủ → `CHANGELOG.md` (mỗi dòng dưới đây có 1 mục tương ứng ở đó). Tóm tắt:
- ✅ **2.2.89 (31/07, ĐỢT DEMO GẤP, ƯU TIÊN 1)** — menu chuột phải CAD không có đường thoát nào
  (bấm ngoài/Escape đều không đóng). `Popover.tsx` thêm `onDismiss?` tuỳ chọn (khuôn `MenuButton.tsx`
  — 2 nơi dùng cũ FlowCanvas/EditorCanvas không truyền, không đổi gì). `CadCanvas.tsx` truyền
  `onDismiss` + bổ sung `setCadMenu(null)` bị quên ở nhánh Escape. Bẫy "chính cú chuột phải mở menu
  bị đóng ngay" xử lý 2 lớp: bỏ qua target trong popover + cờ `armed` sau `requestAnimationFrame`.
  Test tay đủ 5 kịch bản qua dispatch event JS thật (mở-ở-lại · đóng ngoài · Escape · bấm mục
  chạy+đóng · nhảy vị trí không nhân đôi). tsc+eslint+test+build sạch. Nợ `useDismissable` dùng
  chung → `2.2.90`, hoãn sau demo.
- ✅ **7.3.32 (31/07, ĐỢT DEMO GẤP)** — tràn headbar 179px@640/51px@768 route render: đẩy mốc
  "hiện cụm phải" (Tasks/Home/⋯/UserChip) từ `sm`(640)→`lg`(1024) đồng bộ `MobileMenu`, tái dùng
  bottom-sheet có sẵn. Verify browser thật `/render`+`/cad`: 0 tràn 640/768/1024. Đo trước phát hiện
  brief ② (`ToolModeForm` grid) là NON-ISSUE, không sửa. ④ (quét 7.1.23) không kịp, hết giờ.
- ✅ **2.1.8.n (31/07, GẤP chặn thử CAD LAN)** — Ctrl/⌘+S ép autosave chạy ngay + toast "Đã lưu —
  HH:MM" · Ctrl/⌘+Shift+S xuất `.idf` (tái dùng luồng có sẵn) · StatusBar thêm giờ vào "Đã lưu lúc
  HH:MM". Verify browser thật cả 3 việc, tsc+eslint+test sạch.
- ✅ **7.3.31/2.1.8.k-m/7.1.20/2.2.86/2.2.70(a)(b)/7.1.19-merge** — hợp nhất AppChrome hết overlap ·
  PDF nhiều tờ+khổ/hướng giấy · gộp hệ ngưỡng breakpoint · hàng đợi "Việc" · Lark Wiki merge (**VẪN
  🟡**, chờ 3 khoá Lark verify call thật). Chi tiết → CHANGELOG.
- 🟡 **2.2.87+2.2.88** cascade 4 bậc "không-bao-giờ-fail", HẠ TỪ ✅ (Hoà chốt) — `measureObjectTiered()`
  tự tụt bậc, không throw. 46/46 test, CHƯA verify ảnh thật — nâng ✅ khi Hoà tự thử.
- ✅ **7.1.21+Luật #13** (merge `feat/sprint-infra`, `7a62e09`) — `"test"` vào `package.json`, bỏ
  loại trừ `auto-backup.test.ts` chết (xoá trong B3, thay `backup-diff.test.ts` 50 test). `7.1.22`
  CHƯA CODE.
- ✅ **B3 (`4.6`)** — backup CAD bỏ "giữ 5 bản" sang thang thời gian + lưu chênh lệch,
  `lib/cad/backup-diff.ts` (50 test) + UI phục hồi mới. Giới hạn công cụ ở `docs/VERIFY-B3.md`. ⚠️
  Còn 1 project test (`cms7imxpt...`) — Hoà xoá tay.
- ✅ **Sprint BOQ ĐỢT 1+2 — `2.1.9.q`+`2.1.9.r`** — `polygonPerimeter()`+`openingsAreaInPolygon()`
  (sửa `BlockDef.h` không phải chiều cao cửa, 45/45 test) + ATLAS Material cache mở rộng
  `ProductSpec` (Luật Đồng Bộ #6, mapping PLACEHOLDER, 22/22 test).
- 🟡 **7.1.23 — Bước 1 xong, CHỜ HOÀ GẬT** — bảng phân loại ở `docs/AUDIT-7.1.23-...md` (~112 chỗ
  tay + ⑤c token sàn 13px đã chốt hướng). CHƯA sửa dòng nào, hoãn sau ĐỢT DEMO.
- ⏸️ **Còn treo**: B2/B4. Sprint BOQ ĐỢT 3 (`2.1.9.p`, engine thật) — kế tiếp.

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
