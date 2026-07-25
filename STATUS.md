# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = 3 chặng **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` mục LUẬT NỀN TẢNG**: IF là sản phẩm ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử chi tiết → `CHANGELOG.md` (KHÔNG đọc mỗi phiên).

## Hiện tại (25/07 — đóng phiên)
- HEAD `4cfb240` nhánh `feat/present-layout-ml-p1`. **~28 commit local vượt origin — CHƯA PUSH:** `git push origin feat/present-layout-ml-p1:main`
- tsc PASS · **91/91 test** (`node_modules/.bin/sucrase-node <path>.test.ts` — repo KHÔNG có vitest).

## Worktree đang mở (2)
- `interiorflow-wt-pattern-nodes` (`feat/pattern-nodes`) — agent **R-NODES #28 XONG cả 4 việc, commit `b2b8615`, CHỜ MERGE**. tsc PASS · 89/89 file test PASS. Verify thật trên 127.0.0.1:3035 + fal: SAM chọn đúng vách cong 1 click · hoa văn Chăm từ ảnh mẫu → pattern phẳng 2 màu · warp→composite dán lên phối cảnh. Node mới: `ai.smartselect` · `ai.pattern` · `util.warp`. Nợ: chưa có workflow tự-host cho `segment` (mức oneAI báo lỗi rõ) · tile seamless còn là mirror 4 chiều (chưa offset+feather) · param màu vẫn là text hex (chưa có `kind:'color'`).
- `interiorflow-wt-audit-fix` (`fix/audit-approved`) — agent **#27 TREO, 45 file dirty CHƯA COMMIT**. Phiên sau: commit checkpoint NGAY rồi làm nốt.

## ĐÃ MERGE 25/07 (đợt lớn nhất)
**R-NODES**: Smart Select (SAM 2, click 1 điểm → mask theo biên) · search node **tiếng Việt bỏ dấu** (43 node có keywords) · **Pattern Studio** (img2img từ reference + dẹt stencil client-side) · **Perspective Warp** 4 góc · fix UX nút modal disabled khi chưa nối input. ⚠️ Phát hiện: **fal FLUX BỎ QUA `negative_prompt`** → phải dùng prompt dương.
**AUDIT-FIX**: xem mục 🔴 3 bên dưới.

ĐỔ NỀN **T0** scope global|project + fix bug card mở nhầm dự án (slug→id thật) · **T1** `img_` id ổn định · **T3** PDF báo cáo quy chuẩn trung tính · **1B** 4 route `/projects/[id]/(cad|render|present|photo)`, URL=nguồn sự thật, route cũ→redirect · **de-TTT** (khung tên đọc Brand Kit, prompt Vitals bỏ ép gu TTT, deck mẫu "Atelier Nord") · **VIỆC 6** `docs/AUDIT-BRAND-PII.md` 44 phát hiện · **VIỆC 3** `docs/SPEC-VITALS-AI.md` · **VIỆC 5** `IF-CORE-SCHEMA` §0 Luật trung tính + §0B Luật demo · **DWG license research** · tách **401MB** dữ liệu tham khảo ra `~/Downloads/interiorflow-reference/`.

## 🔴 3 việc nặng nhất còn treo
1. **Vitals tư vấn brand MÙ** — prompt đã gỡ TTT nhưng KHÔNG code nào bơm Brand Kit/GuProfile thật vào (`getActiveBrandKit` không có trong `lib/ai/*`). → VIỆC 4.
2. **⚖️ License DWG** — `libredwg-web` GPL-3.0 chạy client-side (wasm xuống browser = conveying). Miễn trừ "tool nội bộ" CHẾT với định vị global. Server-side Node nhanh hơn 10x và không phải conveying, NHƯNG libredwg **không GHI được DWG** → IF2 xuất DWG buộc ODA (~$7.500). Có lỗi tuân thủ sửa 0đ: thiếu GPL text/notice. → `docs/RESEARCH-DWG-LICENSE.md`
3. ✅ **XONG 25/07** (merge `4cfb240`): bỏ `DETECH · CONCEPT` · `lib/stock-photos.ts` nguồn ảnh Unsplash/Pinterest + `StockPhotoPicker` · appId `com.interiorflow.app` · xoá mật khẩu comment · footer login sạch · `detech-sample`→`demo-enso-sample` · `demo-amanoi`→`demo-resort`. **Grep runtime KHÔNG còn chuỗi TTT nào.** Còn: 53 ảnh `public/wallpapers/ttt-*` giữ tạm theo ý user (đã có nguồn stock thay thế).

## Chờ USER quyết
- **Figma**: file cũ `MUQ2tPFE0PIZ5w4RH1jAHE` **chỉ còn 1 page Cover** → dùng lại hay tạo file mới trung tính? (đã đề xuất 11 page khớp route, có thể dựng khung sẵn bằng `use_figma`)
- **DWG**: sửa tuân thủ GPL ngay? · đường A server-side (mất offline)? · ODA khi bán?
- Còn treo: **VIỆC 4** GuProfile=dữ liệu · **VIỆC 7** demo+onboarding · **#25** PDF font Việt · **#14** cụm Mẫu Presenting (thumbnail + import PPTX).

## Nợ kỹ thuật (mới phát hiện 25/07)
- 🔴 **CAD sheets lưu IndexedDB theo trình duyệt, CHƯA gắn theo `[id]` dự án** — mảnh cuối bug rò chéo. Xếp Đổ Nền 2 cùng PDF font Việt.
- 🟡 `resume-state` chỉ lưu `flowId`, không `projectId`.
- 🟡 Audit CATALOG-STAGE2 kê node KHÔNG tồn tại (`ai.localedit`/`idmask`/`furnitureextract`) — registry thật chỉ 5 node AI_EDIT.
- 🐛 `/cad-editor` React warning không tái hiện · ⌘J Vitals grep 0 kết quả · morph login chỉ fade · cursor polling idle.

## Quy tắc session
1. Đọc STATUS.md + `CLAUDE.md` LUẬT NỀN TẢNG trước tiên; xong task cập nhật STATUS.
2. Không tự merge/push main (auto mode chặn — user chạy tay). Bug ngoài phạm vi → ghi Nợ.
3. **LUẬT MÁU verify browser**: dev worktree PHẢI qua `127.0.0.1:<port>` (KHÔNG `localhost`); TUYỆT ĐỐI KHÔNG logout/xoá cookie. Worktree copy `.env` + DB riêng `dev.db.wt` với **DATABASE_URL ABSOLUTE** (relative gây Prisma P2021).
4. Agent: **KHÔNG sub-agent · KHÔNG `spawn_task`** (đẻ phiên lạc → cuốn commit). Max 5 worktree.
5. **Vai trò**: phóng agent code, KHÔNG tự làm (memory `role-agentic-not-hands-on`). Việc "cần thiết": gitops/verify/memory/đề xuất.
6. Login demo: `demo@if.local` / `demo1234`.
