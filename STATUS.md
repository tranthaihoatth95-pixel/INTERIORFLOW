# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (30/07 khuya — 2.1.9.q xong, 2.2.87/2.2.88 HẠ 🟡 chờ Hoà thử ảnh thật)
Chi tiết đầy đủ → `CHANGELOG.md` (mỗi dòng dưới đây có 1 mục tương ứng ở đó). Tóm tắt:
- ✅ **7.3.31 mở rộng** — `AppChrome.tsx` hợp nhất Header+StudioBar, hết overlap 1024px (0 tràn 3 mốc).
- ✅ **2.1.8.k/l/m** — PDF nhiều tờ có mục lục · sửa va chạm `CadTouchDock` · tách khổ/hướng giấy.
- ✅ **7.1.20** — gộp hệ ngưỡng breakpoint (`lib/breakpoints.ts`), ghi Luật #10/#11.
- ✅ **2.2.86 ĐỔI PHƯƠNG ÁN** — hàng đợi thật trong menu "Việc" (`FlowRun`). Phát hiện `7.3.32` ⬜.
- ✅ **7.1.19 (Lark Wiki) MERGE**. **VẪN 🟡** — chờ 3 khoá Lark trong `.env.local` verify call thật.
- 🟡 **2.2.87+2.2.88 SỬA SANG cascade 4 bậc "không-bao-giờ-fail", HẠ TỪ ✅ (Hoà chốt)** — bản gốc
  (điểm tụ bắt buộc) thất bại trung thực quá nhiều với ảnh thiếu cạnh thẳng; `measureObjectTiered()`
  tự tụt bậc, không bao giờ throw. 46/46 test. **CHƯA verify ảnh thật trong browser** (môi trường
  test không đưa được file qua input) — nâng lại ✅ khi Hoà tự thử. Disclose: Tầng 2/3 AI chưa làm.
- ✅ **2 mã XÁC NHẬN** (Luật #12 mới — chỉ Claude Code cấp mã): `7.1.21`=script test,
  `7.1.22`=Bộ nhớ đo đạc. Cả 2 CHƯA CODE.
- ✅ **7.1.21 CODE XONG (30/07, `if-infra`)** — thêm `"test"` vào `package.json`: `find` mọi `*.test.ts` (trừ `node_modules`/`.worktrees`, loại 2 ngoại lệ `edgecase-concurrency.test.ts`/`auto-backup.test.ts`) chạy song song qua `sucrase-node` (`xargs -P8`). Verify thật `npm test`: 102/102 pass, ~20-25s.
- ✅ **2.2.70 (a)(b)** 2 lỗi nhỏ commit riêng (`df74551`). Nội dung chính `2.2.70` vẫn treo (credit).
- ✅ **2.1.9.q (BOQ groundwork)** — `polygonPerimeter()`+`openingsAreaInPolygon()` vào `hatch.ts`.
  Phát hiện khi khám: review spec giả định sai `BlockDef.h`=chiều cao cửa (thật ra là độ sâu mặt
  bằng) — sửa dùng `w`×`OPENING_STANDARD_HEIGHT_MM` (CONFIG chuẩn nghề). 45/45 test. BOQ `2.1.9.p`
  (engine thật) vẫn chờ quyết.
- ⏸️ **Còn treo**: B2/B3/B4 chưa làm — B3 cần THỬ TAY thật.

## Worktree đang mở
Không có. Dọn thêm 1 thứ 30/07 khuya: `.worktrees/if-lark/` (thư mục VẬT LÝ còn sót trên đĩa dù
`git worktree list` đã không còn đăng ký nó, `.git` bên trong trỏ đường dẫn VM chết) — xác nhận đủ
4 điều kiện an toàn (nhánh đã merge+xoá, không dev server, không branch riêng chưa lưu) rồi `rm -rf`.

## Chờ USER quyết
- **NT1** (gộp `LibraryPanel`+`LibraryBrowser`, LỚN) và **NT5** (cây thư mục thật, RẤT LỚN) —
  `docs/PLAN-LIBRARY-GATEWAY.md` mục "Thứ tự làm" dời cả 2 sau, chưa hẹn ngày.
- **T3/T4** (Semantic Room sprint, phần còn lại): làm tiếp phiên sau — xem `docs/CHANGELOG.md`
  phần "26/07 khuya" cho lý do kỹ thuật đã chốt (T1/T2) trước khi bắt đầu T3/T4.
- **Figma**: MCP trả `net::ERR_FAILED` 2 lần. Đường vòng: file trống + `docs/figma-bootstrap.js`.
- **DWG**: sửa tuân thủ GPL ngay (0đ)? · server-side (mất offline)? · ODA khi bán? →
  `docs/RESEARCH-DWG-LICENSE.md`.
- Treo: VIỆC 4 cũ (GuProfile=dữ liệu) · #14 (cụm Mẫu Presenting).
- 3 nhánh `worktree-agent-*` merged còn local; `fix/hatch-t-junction`+`fix/quality-pipeline`
  chưa merge — xoá được không?
- BOQ: đã gộp 1 sáng kiến `2.1.9.p` (`IF-MASTER-TREE.md`, Q6 28/07) — matId nối vào đâu **ĐÃ CHỐT
  30/07** (bảng riêng `AtlasMaterial`, xem `2.1.9.i`); vẫn cần quyết CÓ LÀM ENGINE THẬT không.
- **2.2.16-2.2.21** (Render Tool Mode Pha 2-4, hạ tầng có sẵn chưa lộ card) — mục CẦN HOÀ QUYẾT
  duy nhất còn mở trong `docs/IF-FEATURE-TREE.md`.
- **12 file phụ SPEC-TỔNG §9 chưa nhận được** (KHAM-*.md × 8, LUAT-300DPI, AUDIT-PRESENT-UX,
  PHAN-E-HIEN-TAI-v4, FILEMANAGER-SPRINT-v2, `if-chang2-mockup.html`) — cần Hoà dán tiếp nếu muốn
  Claude Code đọc đủ trước khi làm các sprint liên quan.
- **`2.2.83`** (preflight — tích hợp nút Xuất) — nguồn `SPEC-TONG` §7.5 gộp chung tiêu đề với
  `2.2.82`, không tách rõ nội dung; đã tự tách theo suy luận hợp lý khi dán 30/07 (xem dòng đó
  trong cây), **cần Hoà xác nhận lại ranh giới đúng**.

## Nợ kỹ thuật
→ Tách ra `docs/TECH-DEBT.md` (30/07, giữ STATUS dưới 800 từ) — nội dung nguyên vẹn, không mất mục nào.

## Quy tắc session
*(worktree/LUẬT NỀN TẢNG → `CLAUDE.md`. Chi tiết đầy đủ → memory: `feedback-docs-never-overwrite`, `feedback-verify-before-trust`, `project-ben-doc-bundle-workflow`.)*
1. Không tự merge/push **main** nếu chưa hỏi; đã hỏi rồi thì tự làm (đã push xong lần này).
2. **LUẬT MÁU verify browser**: qua `127.0.0.1:<port>` (KHÔNG `localhost`); KHÔNG logout/xoá cookie.
3. Login demo: `demo@if.local` / `demo1234`.
