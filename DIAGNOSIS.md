# DIAGNOSIS — InteriorFlow (khám read-only, 2026-07-12)

> Báo cáo dựa trên: đọc code trực tiếp + chạy dev server thật (Next 14.2.35, node v20.18.1, port 3000) + 170 test CAD + thử xuất 1 deck PDF live. Không sửa code. Chỗ không kiểm được ghi **KHÔNG RÕ**.

---

## 1. HIỆN TRẠNG THẬT

### Routes (10 trang — TẤT CẢ mở được, HTTP 200)
| Route | Status | Ghi chú (bằng chứng: server log + console) |
|---|---|---|
| `/` | 200 | Node canvas chính. DB hoạt động (`/api/flows`, `/api/auth/me`, `/api/health` 200). Không lỗi console. |
| `/cad-editor` | 200 | ⚠️ **Có 1 console warning** (hydration — xem §3). Trang vẫn render đủ. |
| `/cad-library-demo` | 200 | Sạch |
| `/demo-amanoi` | 200 | Sạch |
| `/library/ingest` | 200 | Sạch |
| `/photo-editor` | 200 | Sạch |
| `/present-editor` | 200 | Deck mẫu dựng client-side (`app/present-editor/page.tsx:22` `makeSampleDeck`). **Không cần DB/key.** |
| `/present` | 200 | Sạch |
| `/report` | 200 | Sạch |
| `/share/[token]` | 200 | Trang render 200; `/api/share/<token-sai>` trả **404 đúng** (xử lý token thiếu gọn gàng). |

33 API route. Đã xác nhận 200 khi chạy: `auth/me`, `health`, `comments`, `flows`, `cursors`, `library`. SQLite `prisma/dev.db` hoạt động thật trên máy này.

### 4 chặng — chúng THẬT SỰ làm gì (đọc code, không đọc README)

**CAD — THẬT, hoàn chỉnh, 0 phụ thuộc AI/GPU/key.**
- Editor 2D tất định: `lib/cad/*` + `components/cad/*` + `app/cad-editor`.
- DXF import **và** export thật: `lib/cad/dxf.ts` (`parseDxf:177`, `exportDxf:420`), nối UI `CadEditor.tsx:51/89`.
- Dò biên phòng DCEL + hatch: `lib/cad/hatch.ts`. Kiểm chuẩn TCVN đo hình học thật: `lib/cad/standards/checker.ts:134`.
- **Test: 170 pass / 0 fail** — dxf.roundtrip 46 · grips 17 · modify 59 · hatch 33 · checker 15. (Chạy `node_modules/.bin/sucrase-node <file>`.)
- Điểm "AI": "mô tả → layout" là **parser regex/từ khoá, KHÔNG phải LLM** — `lib/cad/ai-assist.ts:127` tự ghi *"stub, sẽ thay bằng LLM"*. Solver hình học tầng 2 thì thật.
- Số liệu TCVN **hardcode**, tự thừa nhận *"CHƯA đọc bản PDF gốc"* (`lib/cad/standards/vn-residential.ts:4-6`, rule `verified:false`).

**Gu Engine — có 2 thứ khác nhau bị gọi trùng tên:**
- (A) Bản **lexical CÓ THẬT, đang chạy, 0 AI**: `lib/gu.ts:77` `buildGuProfile` = quét **từ điển cứng** `MATERIAL_TERMS/STYLE_TERMS` (`gu.ts:33-44`) + đếm tần suất màu + fuzzy search (`lib/ref-search.ts`, `lib/classify.ts`). Có node/UI tiêu thụ thật. **Không phải "máy học gu"**; header ghi "KHÔNG hardcode" nhưng danh sách vật liệu/phong cách chính là hardcode.
- (B) **"ML Gu Engine" (embedding/VLM) — KHÔNG có code.** Chỉ là `docs/REFERENCE-QA-AND-GU-ML.md` (bản thiết kế chờ duyệt) + đánh dấu **blocked** trong STATUS.md. Grep `embedding|cosine|vector similarity` → không có file thực thi.
- `caption` (chiều "hiểu ngữ nghĩa") mặc định **rỗng**, chờ VLM (`lib/refingest.ts:29`). VLM cần `NVIDIA_API_KEY`; thiếu thì gu vẫn chạy ở mức palette + tag gõ tay.

**Render — THẬT nhưng thiếu key/GPU thì ra ảnh GIẢ.**
- Queue submit→poll, 3 provider ảnh: **fal** (cloud, `FAL_KEY`), **comfyui** (GPU tự host, `COMFYUI_URL`), **sd** (A1111/Draw Things, `SD_SERVER_URL`). `lib/ai/providers/*`, `app/api/jobs/*`.
- **nvidia** chỉ vision/text (caption + concept text), **KHÔNG sinh ảnh** (`lib/ai/providers/nvidia.ts:84` TODO image-gen).
- **KHÔNG có Gemini/Nano Banana trong repo** — skill `render-ai` là skill Claude Code riêng, không phải code app.
- Thiếu mọi provider → **mock SVG placeholder** (`lib/nodes/registry.ts:60-67`; premium `app/api/render/premium/route.ts:12-24`). WebGPU là **stub** (`lib/ai/webgpu.ts:28` throw `WEBGPU_PENDING`). Video Kling: **không mock**, cần FAL_KEY + số dư + tier 3.
- **Test: 0.**

**Present — THẬT, dàn slide tất định, xuất 100% client-side, không cần key.**
- Auto-dàn slide từ text: `lib/present-editor/content-deck.ts:87` `slidesFromContent` (parse markdown → cover/quote/content). Không AI.
- Rasterize: `lib/present-editor/render.ts` (canvas 1920×1080, client-only).
- Xuất **PDF · PPTX · PNG** (`components/present-editor/ExportMenu.tsx:74-76`; pipeline `lib/present-editor/export.ts` + `lib/pptx.ts`) — jsPDF/pptxgenjs/canvas, đều `if (window===undefined) return`. PPTX giữ text chỉnh được trong PowerPoint.
- AI chỉ là nút tuỳ chọn "✨ Tạo content" qua NVIDIA; thiếu key vẫn dùng Present đủ.
- **Test: 0.**

### Chạy được khi KHÔNG có GPU / API key?
- **CAD**: chạy full, offline. ✅
- **Present** (dàn + xuất PDF/PPTX/PNG): chạy full, client-side. ✅
- **Gu (lexical)**: chạy. VLM caption: cần key. ⚠️
- **Render ảnh thật**: KHÔNG — chỉ ra mock SVG placeholder. Video: báo lỗi. ❌

---

## 2. ĐẦU RA THẬT

- **App xuất được**: PDF, PPTX, PNG (Present — client-side) · DXF (CAD export). Ngoài ra board PNG/PDF ở node "Export Board" (`lib/imaging.ts`).
- **File mẫu ĐÃ XUẤT trong repo: KHÔNG có cái nào do app sinh ra.** Mọi PDF/PPTX trong `test-input/`, `test drag/Detech/`, `san pham dau ra/tham khao/` đều là **file tham khảo ĐẦU VÀO**, không phải output. Các `.dxf` trong `public/cad-library/` là **asset thư viện furniture**, không phải deliverable đã xuất.
- **Thử live (máy này)**: mở `/present-editor` (deck 4 slide seed sẵn) → nút "Xuất file" → PDF. Kết quả: **chạy xong không lỗi** — nút về "Export", 0 toast lỗi, 0 console error. Đường `doc.save()` đã kích hoạt tải file.
  - **Thời gian**: **KHÔNG RÕ chính xác** — đo lẫn độ trễ tool (~18s tổng), render 4 slide thực tế chỉ vài giây. File có rơi xuống đĩa thật hay không thì **KHÔNG RÕ** (browser sandbox không kiểm được).

---

## 3. CHỖ MỤC — nói thẳng

### Dang dở / stub / mock / hardcode (bằng chứng)
- `lib/cad/ai-assist.ts:127` — parse đề bài là stub rule-based, LLM chưa nối.
- `lib/ai/webgpu.ts:28` — render client WebGPU là stub (`throw WEBGPU_PENDING`).
- `lib/ai/providers/nvidia.ts:84` — image-gen NVIDIA là TODO.
- `lib/nodes/registry.ts:60-67` & `app/api/render/premium/route.ts:12-24` — **mock SVG khi thiếu provider** (ảnh trông như đã render nhưng là placeholder).
- `lib/gu.ts:33-44` — MATERIAL_TERMS/STYLE_TERMS hardcode; `caption` rỗng chờ VLM.
- `lib/present-editor/content-deck.ts:113` — `kicker:'DETECH · CONCEPT'` hardcode cho slide cover auto.
- `lib/pptx.ts:23-27` — font PPTX hardcode sans; `export.ts:126-128` — nhánh PPTX text-editable **bỏ** font riêng/đậm/nghiêng/gạch chân (chỉ giữ ở PDF).
- (Grep `TODO|FIXME|mock|hardcode|stub|placeholder` = **207 hit** trong lib/components/app — phần lớn là fallback mock có chủ đích, không phải bug.)

### Sẽ VỠ nếu người khác chạy trên máy khác
- **`.env`, `.env.local`, `prisma/dev.db` đều bị `.gitignore`** (đã xác nhận `git check-ignore`). Máy sạch clone về → **không có DATABASE_URL, AUTH_SECRET, không có DB**. App gốc `/` cần DB (flows/auth/cursors/comments) → sẽ lỗi. Phải: tạo `.env` (mẫu `.env.example`), sinh `AUTH_SECRET`, `prisma db push` để tạo `dev.db`.
- **Migration DRIFT (xác nhận)**: model `IntegrationAccount` có trong `prisma/schema.prisma` nhưng **KHÔNG có trong bất kỳ migration nào** (chỉ 1 migration `20260703141955_init`). `prisma migrate deploy` sẽ tạo DB thiếu bảng → API integrations vỡ. Memory: **dùng `db push`, KHÔNG `migrate reset`**.
- **Ngoại lệ tốt**: `/present-editor` (deck→PDF) **KHÔNG cần DB/key** → demo deck vẫn chạy trên máy sạch dù DB chưa dựng.

### Lỗi console
- **CHỈ 1 lỗi**, ở `/cad-editor`: hydration warning `title "Undo (Ctrl+Z)"` (server) vs `"Undo (⌘Z)"` (client) — `components/cad/CadToolbar.tsx` dùng `lib/kbd.ts:11` (IS_MAC tính phía client). **Cosmetic, dev-only, không crash.** Các route khác: không lỗi console.

### Đang "giả vờ chạy" nhưng là dữ liệu cứng
- Node Render khi thiếu key → **mock SVG placeholder** trông như ảnh render.
- "AI mô tả → layout" = parser regex, không phải AI.
- "Gu Engine" = tra từ điển + đếm màu, không phải ML.

---

## 4. KHOẢNG CÁCH TỚI "DEMO ĐƯỢC TRƯỚC BGĐ"
**XONG = mở app → 1 nút → 1 bộ deck PDF, 3 lần liên tiếp không lỗi, trên máy sạch.**

Trên **máy này**, đường `/present-editor` → Export → PDF **đã chạy được 1 lần không lỗi hôm nay**. Khoảng cách còn lại chủ yếu là "máy sạch" + độ tin cậy:

| # | Việc còn thiếu | Ưu tiên | Ước lượng |
|---|---|---|---|
| 1 | **Chốt đường demo = `/present-editor` standalone** (đã offline, không cần DB/key). Nếu demo đi qua app gốc `/` thì phải dựng DB trước. | Cao | 0 (nếu dùng thẳng /present-editor) |
| 2 | **Script dựng máy sạch**: `.env.example`→`.env` + sinh AUTH_SECRET + `prisma db push` (né drift, KHÔNG reset). | Cao | 30–45 ph |
| 3 | **Xác minh file PDF rơi xuống đĩa thật** trên máy/máy chiếu demo (browser thật, không sandbox). | Cao | 10 ph |
| 4 | **Chạy xuất 3 lần liên tiếp** đo lỗi/thời gian (code tất định, rủi ro thấp). | Trung | 10 ph |
| 5 | (Nếu demo có ghé `/cad-editor`) dẹp hydration warning tooltip. Cosmetic. | Thấp | 15 ph |

**Kết luận**: nếu demo = "mở /present-editor → bấm 1 nút → PDF", về cơ bản **đã XONG trên máy này**; để lặp lại chắc chắn trên **máy sạch** cần ~**1 giờ** (việc 2–4).
**KHÔNG RÕ**: thời gian xuất chính xác; hành vi tải file trên browser demo thật.

---

## 5. RỦI RO PHÁ APP

### ĐỘNG VÀO LÀ VỠ (né ra)
- `lib/cad/hatch.ts` + `lib/cad/standards/checker.ts` + `query` — hình học DCEL vừa fix (`fd4718d`); 170 test canh nhưng logic tinh vi. Memory: *"giữ query.ts/hatch.ts ĐỪNG đụng"*.
- `lib/cad/dxf.ts` — parse/export ghép cặp bởi roundtrip test; sửa 1 vế vỡ vế kia.
- `lib/present-editor/export.ts` + `render.ts` + `lib/pptx.ts` — **chính pipeline demo phụ thuộc**; đụng `renderEditorSlide` hoặc map model → hỏng deck.
- `prisma/schema.prisma` — sửa schema mà không kèm migration làm **drift sâu thêm**; dùng `db push`, KHÔNG `reset` (mất dev.db).
- `lib/kbd.ts` (IS_MAC) — "sửa cho nhanh" dễ vẫn lệch; giá trị thấp, đừng ưu tiên.

### CHẠY ĐƯỢC — TUYỆT ĐỐI KHÔNG ĐỤNG
- **Toàn bộ `lib/cad/*`** — 170 test xanh, tất định, offline. Đây là phần chắc nhất của app.
- **Pipeline xuất Present** — deliverable demo đang chạy.
- **Cơ chế mock fallback** (`registry.ts`) — nhờ nó app chạy được khi thiếu key; gỡ đi là hỏng trải nghiệm "không key".

### Dọn dẹp (không gấp)
- `.claude/worktrees/` còn **3 worktree agent cũ, ~80M**, chứa **bản trùng** của test CAD → dễ gây nhiễu khi grep/chạy test. An toàn để xoá, không gấp.
- Memory cảnh báo: nhiều phiên Claude cùng 1 folder gây cuốn commit — **1 folder = 1 phiên**.

---
*Hết. Mọi khẳng định có file:line đều đọc trực tiếp; chỗ suy đoán đã ghi KHÔNG RÕ.*
