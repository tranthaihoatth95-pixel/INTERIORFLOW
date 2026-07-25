# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = 3 chặng **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` mục LUẬT NỀN TẢNG**: IF là sản phẩm ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử chi tiết → `CHANGELOG.md` (KHÔNG đọc mỗi phiên).

## Hiện tại (25/07 — phiên tối)
- Nhánh `feat/present-layout-ml-p1`. **Đã push `0c6afe0` → `origin/main`** (998e1e0..0c6afe0) — hết nợ push.
- tsc PASS · **92/92 file test** (`node_modules/.bin/sucrase-node <path>.test.ts` — repo KHÔNG có vitest).
- **VIỆC 4 xong phần Brand Kit**: Vitals hết mù thương hiệu (xem 🔴 mục 1).
- **Sheets gắn dự án xong**: hết rò chéo IndexedDB (xem Nợ kỹ thuật).

## Worktree đang mở
- (Không có — đã dọn sạch, cả R-NODES và AUDIT-FIX đều đã merge.)

## ĐÃ MERGE 25/07 (đợt lớn nhất)
**R-NODES**: Smart Select (SAM 2, click 1 điểm → mask theo biên) · search node **tiếng Việt bỏ dấu** (43 node có keywords) · **Pattern Studio** (img2img từ reference + dẹt stencil client-side) · **Perspective Warp** 4 góc · fix UX nút modal disabled khi chưa nối input. ⚠️ Phát hiện: **fal FLUX BỎ QUA `negative_prompt`** → phải dùng prompt dương.
**AUDIT-FIX**: xem mục 🔴 3 bên dưới.

ĐỔ NỀN **T0** scope global|project + fix bug card mở nhầm dự án (slug→id thật) · **T1** `img_` id ổn định · **T3** PDF báo cáo quy chuẩn trung tính · **1B** 4 route `/projects/[id]/(cad|render|present|photo)`, URL=nguồn sự thật, route cũ→redirect · **de-TTT** (khung tên đọc Brand Kit, prompt Vitals bỏ ép gu TTT, deck mẫu "Atelier Nord") · **VIỆC 6** `docs/AUDIT-BRAND-PII.md` 44 phát hiện · **VIỆC 3** `docs/SPEC-VITALS-AI.md` · **VIỆC 5** `IF-CORE-SCHEMA` §0 Luật trung tính + §0B Luật demo · **DWG license research** · tách **401MB** dữ liệu tham khảo ra `~/Downloads/interiorflow-reference/`.

## 🔴 3 việc nặng nhất còn treo
1. 🟡 **Vitals tư vấn brand** — ✅ **Brand Kit đã bơm thật (VIỆC 4, 25/07)**: `brandContextForVitals()` (`lib/present-editor/brand-kit.ts`) → client gửi kèm `brand` mỗi lượt (`VitalsGesture.tsx`, `ProjectSelect.tsx`) → `sanitizeBrandContext()` + `brandPromptBlock()` (`lib/ai/chat-assist.ts`) nhồi tên · bộ màu · cặp font · có/không logo vào system prompt. Chưa có kit ⇒ prompt nói thẳng "dự án CHƯA có Brand Kit" + cấm bịa (luật rỗng-để-rỗng). Không gửi dataURL logo, hex sai bị lọc, tối đa 12 màu. 20 test mới.
   ⬜ **Còn lại: GuProfile.** CỐ Ý chưa bơm — `fetchGuProfile()` đọc `/api/library` mà thư viện là **dùng chung cả team, không scope theo dự án** (`app/api/library/route.ts:10`); bơm vào sẽ vi phạm "không trộn nội dung" (CONTENT-RULES §1) và §2.2 của SPEC-VITALS-AI ("gu phải trích từ Reference CỦA DỰ ÁN"). Mở lại khi Reference có scope `projectId`.
2. **⚖️ License DWG** — `libredwg-web` GPL-3.0 chạy client-side (wasm xuống browser = conveying). Miễn trừ "tool nội bộ" CHẾT với định vị global. Server-side Node nhanh hơn 10x và không phải conveying, NHƯNG libredwg **không GHI được DWG** → IF2 xuất DWG buộc ODA (~$7.500). Có lỗi tuân thủ sửa 0đ: thiếu GPL text/notice. → `docs/RESEARCH-DWG-LICENSE.md`
3. ✅ **XONG 25/07** (merge `4cfb240`): bỏ `DETECH · CONCEPT` · `lib/stock-photos.ts` nguồn ảnh Unsplash/Pinterest + `StockPhotoPicker` · appId `com.interiorflow.app` · xoá mật khẩu comment · footer login sạch · `detech-sample`→`demo-enso-sample` · `demo-amanoi`→`demo-resort`. **Grep runtime KHÔNG còn chuỗi TTT nào.** Còn: 53 ảnh `public/wallpapers/ttt-*` giữ tạm theo ý user (đã có nguồn stock thay thế).

## Chờ USER quyết
- **Figma**: file cũ `MUQ2tPFE0PIZ5w4RH1jAHE` **chỉ còn 1 page Cover** → dùng lại hay tạo file mới trung tính? (đã đề xuất 11 page khớp route, có thể dựng khung sẵn bằng `use_figma`)
- **DWG**: sửa tuân thủ GPL ngay? · đường A server-side (mất offline)? · ODA khi bán?
- Còn treo: **VIỆC 4** GuProfile=dữ liệu · **VIỆC 7** demo+onboarding · **#25** PDF font Việt · **#14** cụm Mẫu Presenting (thumbnail + import PPTX).

## Nợ kỹ thuật (mới phát hiện 25/07)
- ✅ **XONG 25/07 — CAD/Present sheets đã gắn `[id]` dự án.** Khoá IDB `userId::route::projectId` (`sheetsKey()`), bucket lấy từ URL trước rồi tới store (`useSheetsBucketId()`); đổi dự án giữa phiên ⇒ dọn tab/canvas + hydrate lại bucket mới, autosaver chốt bucket lúc tạo nên nhịp flush cuối không đè sang dự án khác. Bản ghi cũ (khoá 2 phần) DI TRÚ 1 lần sang dự án mở đầu tiên rồi xoá bucket chung → dự án thứ hai không thấy nữa. 18 test mới (`lib/sheets-persist.test.ts`, fake IDB).
  🟡 Còn: `resume-state` vẫn chỉ lưu `flowId` + `sheetId` (id dạng `cadsheet-N` có thể trùng giữa các dự án — chỉ chọn nhầm TAB, không rò dữ liệu).
- 🟡 Audit CATALOG-STAGE2 kê node KHÔNG tồn tại (`ai.localedit`/`idmask`/`furnitureextract`) — registry thật chỉ 5 node AI_EDIT.
- 🐛 `/cad-editor` React warning không tái hiện · ⌘J Vitals grep 0 kết quả · morph login chỉ fade · cursor polling idle.

## Quy tắc session
1. Đọc STATUS.md + `CLAUDE.md` LUẬT NỀN TẢNG trước tiên; xong task cập nhật STATUS.
2. Không tự merge/push main (auto mode chặn — user chạy tay). Bug ngoài phạm vi → ghi Nợ.
3. **LUẬT MÁU verify browser**: dev worktree PHẢI qua `127.0.0.1:<port>` (KHÔNG `localhost`); TUYỆT ĐỐI KHÔNG logout/xoá cookie. Worktree copy `.env` + DB riêng `dev.db.wt` với **DATABASE_URL ABSOLUTE** (relative gây Prisma P2021).
4. Agent: **KHÔNG sub-agent · KHÔNG `spawn_task`** (đẻ phiên lạc → cuốn commit). Max 5 worktree.
5. **Vai trò**: phóng agent code, KHÔNG tự làm (memory `role-agentic-not-hands-on`). Việc "cần thiết": gitops/verify/memory/đề xuất.
6. Login demo: `demo@if.local` / `demo1234`.
