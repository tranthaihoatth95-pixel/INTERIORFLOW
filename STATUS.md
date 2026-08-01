# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## Hiện tại (01/08 — V1+V2 video · toggle Gallery · P1/P2 Present xong · P3 KHÁM xong CHỜ Hoà)
- ✅ **P1+P2 Present** (`ab1d9a9`, `8f4ed9f`) — sửa 3 nhãn nói dối IF-FEATURE-TREE/Toolbar (khoá
  tỉ lệ + linked-assets ĐÃ chạy thật, nút deck .pptx/.pdf giữ khoá đúng nhưng sửa câu lý do lỗi
  thời) · ảnh mặc định GIỮ TỈ LỆ khi resize góc (Shift để bẻ, đảo ngược so text/shape), tách
  `resize-corner.ts` test được (18 test). **P3 (in 300dpi) — CHỈ KHÁM, CHƯA CODE** (đúng gate):
  nghẽn thật là 2 tầng riêng (canvas/text vô hạn dpi, rẻ · ảnh hero cần `ai.upscale` ×4 thật,
  2cr/ảnh) — báo Cowork trước khi động tay.
- ✅ **Toggle Carousel↔Grid Gallery** (`6303d7c`) — ghi đè J-4c (luật 2.1.10), nhớ theo user qua
  `lib/resume.ts`. Verify browser thật cả 2 chiều + persist qua reload; reduce-motion chỉ verify code.
- ✅ **V2 đường cam mức 2-a** (`69db004`, `SPEC-VIDEO-MAT-BANG.md` §2) — A/C/D đủ, B rút gọn:
  `campath:true` + layer `IF_CAMPATH` + round-trip DXF XDATA · `lib/cad/campath.ts` (bo góc
  R=600mm, 32 test) · `CamPathPreview.tsx`. Cố ý chưa làm: panel chỉnh tốc độ/lens sau khi vẽ.
- ✅ **V1 draw-on mặt bằng** (`d51a2cb`, `7b6bfbc`, bậc 1 cùng spec) — 5 đợt theo elementType,
  batching tự bật khi >500 entity/đợt ①. FPS thật: 2000 entity riêng lẻ ~31fps → batching >20000fps.
  Chưa làm: bậc 2/4, so le cửa chính (V1.1).
- ✅ **Đợt 2 gỡ nhãn `[CẦN HOÀ DUYỆT]`** (`1de5df7`) — 13/14 file đóng, chỉ còn `SPEC-SEMANTIC-MODEL`
  treo (Hoà giữ tự đọc). Blueprint sửa 4 chặng (0→3). ArchiNote **cũng theo Luật Trung Tính** (Hoà
  lật đề xuất Cowork). README/INDEX-AI-SPECS hết lệch mục lục.

Chi tiết đầy đủ → `CHANGELOG.md` + `docs/IF-FEATURE-TREE.md` `4.1.a-e`. Tóm tắt đợt trước: B1-B5
ĐÓNG (đĩa = nguồn sự thật) · 4.1.f Brand Kit thuộc DỰ ÁN (thi công chưa làm) · Present A1-A4 ·
2.2.90 `useDismissable` ĐỢT 1+2 (mã `2.2.92`) · 🟡 2.2.87+2.2.88/7.1.23 CHỜ HOÀ GẬT.

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
- **NT1/NT5** (gộp Library panel/browser · cây thư mục thật) — dời sau (`docs/PLAN-LIBRARY-GATEWAY.md`).
  **T3/T4** (Semantic Room) — làm tiếp phiên sau, lý do ở CHANGELOG "26/07".
- **Figma**: MCP lỗi `net::ERR_FAILED`. Đường vòng: file trống + `docs/figma-bootstrap.js`.
- **DWG**: sửa GPL ngay (0đ)? · server-side? · ODA khi bán? → `docs/RESEARCH-DWG-LICENSE.md`. **Mới
  31/07**: `2.1.6.d` 🔴 bug Nhập DWG treo vĩnh viễn trên file thật (nghi block-flatten INSERT bùng
  nổ) — chưa ai động, chi tiết đủ ở cây.
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
