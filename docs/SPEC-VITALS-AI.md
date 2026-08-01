# SPEC · VITALS AI — trợ lý AI trong InteriorFlow

> Trạng thái: phần **VAI TRÒ** đã duyệt (xem `SPEC-VITALS-ROLE.md`), phần **CƠ CHẾ** còn draft.
> Ngày soạn: **25/07/2026** · Người soạn: agent tài liệu (docs-only)
> Nợ tài liệu này được nêu ở `docs/INDEX-AI-SPECS.md` §F (dòng 43, 55) — file này trả nợ đó.
> Mọi trạng thái ✅/🟡/⬜ dưới đây đã **verify bằng code thật** (file:dòng làm bằng chứng),
> không suy đoán. Nhánh đối chiếu: `feat/present-layout-ml-p1` @ `733b389`.

---

## 0. Vitals là gì

**Vitals = trợ lý AI hội thoại trong InteriorFlow**, đi xuyên 3 chặng
Drafting CAD · Rendering · Presenting và cả Gallery. Vitals KHÁC hai thứ dễ lẫn:

| Thứ | Là gì | Nơi ở |
|---|---|---|
| **Vitals AI** (tài liệu này) | Chat 1-người-với-**AI**: tư vấn nội thất, hướng dẫn app, hỏi tài liệu dự án | `app/api/ai-assist-chat` · `app/api/notebook/[projectId]/query` |
| **Chat nhóm** | Chat người-với-**người** trong dự án | `app/api/chat`, `ChatMessage` (xem `docs/RESEARCH-CHAT-FULL.md`) |
| **AI mô tả → layout** (CAD) | Một câu mô tả ra mặt bằng sơ phác, solver + ràng buộc | `docs/CAD-AI-MECHANISM.md` |

### Thang bậc dùng trong file này

| Bậc | Nghĩa | Cách đọc |
|---|---|---|
| **N** (Nhỏ) | Việc nhỏ, gọn trong 1 lượt agent, không đổi kiến trúc | làm được bất cứ lúc nào |
| **P** (Phải làm) | Bắt buộc để Vitals đủ dùng — không có thì trợ lý còn què | ưu tiên cao nhất |
| **L** (Lớn) | Đổi kiến trúc / cần cổng duyệt riêng / rủi ro cao | KHÔNG tự khởi động, phải có OK |

Ký hiệu trạng thái: **✅** đã build · **🟡** một phần · **⬜** chưa có dòng code nào.

---

## 1. Sáu nhóm tính năng (tuần tự)

### Nhóm 1 · Ambient orb — hiện diện nhẹ, không chiếm layout

- **Mô tả.** Vitals không có panel thường trú chiếm chỗ. Nó hiện diện bằng một dấu
  hiệu tối giản (handle hairline dưới thanh chặng + icon giọt `VitalsIcon`), người
  dùng **kéo xuống** thì mở popover chat; kéo tiếp thì mở NotebookLM full. Onboarding
  subtle: lần đầu vào chặng thì handle sáng 3s + tooltip "↓ Kéo xuống để hỏi Vitals" 4s,
  sau lần kéo đầu không hiện lại.
- **Bậc.** N (phần còn lại: chỉ là polish).
- **Phụ thuộc.** Không phụ thuộc nhóm nào — đây là nền của các nhóm sau.
- **Trạng thái. 🟡 một phần.**
  - ✅ Cử chỉ 2 tầng: `lib/input/stage-drop.ts:20` `VITALS_DROP_THRESHOLD_PX = 28`,
    `:27` `VITALS_FULL_THRESHOLD_PX = 120`, `:30` `DRAG_SLOP_PX = 6`,
    `:36` `VERTICAL_DOMINANCE_RATIO = 1.2`, tracker `:58 createStageDragTracker`.
  - ✅ Handle hairline + tooltip onboarding: `components/studio/StageSwitcher.tsx:259-334`
    (idle 24×1px opacity 0.4 → active 3px opacity 0.9), khoá `gesture_hint_seen` /
    `gesture_first_done`.
  - ✅ Pre-mount panel chống "motion khưng": `StageSwitcher.tsx:98` `setDragging(true)`
    + `:162 shouldMountPanel = dragging || panelOpen`.
  - ✅ Thanh Vitals luôn hiện ở Gallery: `components/ProjectSelect.tsx:1646-1780`
    (placeholder xoay vòng `:372-382`).
  - 🟡 **Không phải "orb"** — visual giọt kính teardrop (SVG, drip motion, breathing)
    ĐÃ BỊ BỎ theo yêu cầu user 23/07, xem header `components/studio/VitalsGesture.tsx:6-16`.
    Nếu Hoà vẫn muốn "orb có hiện diện/nhịp thở" thì đây là việc MỚI, phải chốt lại
    (mâu thuẫn với quyết định 23/07).
  - ⬜ Phím tắt `⌘J` mở Vitals: **ghi là có nợ nhưng grep 0 kết quả implement** —
    chỉ còn dấu vết ở `CHANGELOG.md:256` và `docs/MASTERPLAN-IF-ARCHINOTE.md:34`.

### Nhóm 2 · Canvas copilot — biết ngữ cảnh đang ở đâu / đang chọn gì

- **Mô tả.** Câu trả lời phải đổi theo (a) **chặng** đang mở, (b) **scope** đang ở
  (`global` = Gallery vs `project` = trong dự án, theo `docs/IF-CORE-SCHEMA.md` §1),
  (c) **thứ đang chọn** trên canvas (node render nào, tường/phòng CAD nào, slide nào).
- **Bậc.** P (chặng + scope: đã có; **selection-aware: còn thiếu, đây là phần P**).
- **Phụ thuộc.** Nhóm 1 (điểm vào). Với selection: cần đọc `lib/store.ts` (canvas node)
  và `lib/cad/store.ts` (selection CAD) rồi nén thành ngữ cảnh ngắn gửi kèm payload.
- **Trạng thái. 🟡 một phần.**
  - ✅ Context theo chặng: `lib/ai/chat-assist.ts:38` `ChatStage = 'concept'|'render'|'present'|'gallery'`,
    `:40-56 STAGE_BRIEF`, `:59 chatSystemPromptFor()`, `:70 normalizeChatStage()`.
  - ✅ Client gửi kèm `stage`: `components/studio/VitalsGesture.tsx:125`
    `body: JSON.stringify({ messages: next, stage })`; nhãn/placeholder theo chặng `:46-56`.
  - ✅ Backend pick prompt theo stage: `app/api/ai-assist-chat/route.ts:35-38`.
  - ✅ Scope project được tôn trọng ở nhánh notebook: `app/api/notebook/[projectId]/query/route.ts:20`
    `resolveNotebookProjectId(user.id, params.projectId)` + `:31 upsert` theo `projectId`.
  - ⬜ **Selection-aware: chưa có.** Payload duy nhất là `{ messages, stage }`
    (`route.ts:27`) — Vitals KHÔNG biết user đang chọn node/tường/slide nào.
  - ⬜ Vitals ở `/api/ai-assist-chat` không biết `projectId` (chỉ nhánh notebook biết) ⇒
    hỏi ở chặng nhưng không đọc được dữ liệu dự án. Xem Nợ/rủi ro §4.

### Nhóm 3 · Grounded citation — trả lời có trích nguồn (học NotebookLM)

- **Mô tả.** Khi dự án đã nạp tài liệu vào notebook, Vitals trả lời **dựa trên tài liệu**
  và đánh dấu `[n]` khớp đoạn nguồn; bấm `[n]` nhảy tới nguồn. Khi notebook rỗng /
  retrieve không hit thì tự tụt về **general mode** và **nói rõ là không có nguồn**
  (không giả vờ đã đọc tài liệu).
- **Bậc.** P — đã đạt; phần còn lại là mở rộng nguồn (§5 câu hỏi chờ quyết).
- **Phụ thuộc.** Nhóm 2 (stage prompt là nền của RAG prompt) + hạ tầng embed/chunk.
- **Trạng thái. ✅ đã build.**
  - ✅ Pipeline RAG: `lib/notebook/rag.ts:103 ragAnswer()` — embed query → load chunk →
    cosine top-k (`:108` clamp k ∈ [1,12]) → build prompt → `completeTextTiered`.
  - ✅ Auto-smart 2 chế độ: `rag.ts:127`
    `const mode: 'grounded' | 'general' = hits.length > 0 ? 'grounded' : 'general'`.
  - ✅ Luật trích dẫn trong prompt grounded: `rag.ts:129-144` ("Trích nguồn bằng dấu [số]…
    KHÔNG bịa số ngoài phạm vi trên", "Nếu tài liệu không đủ… nói rõ 'Tài liệu dự án chưa đề cập'").
  - ✅ General mode có prefix cảnh báo: `rag.ts:146-160` +
    `GENERAL_PREFIX = '[General mode · không có nguồn]'`.
  - ✅ UI render citation click-to-jump: `components/notebook/NotebookChatPanel.tsx:28`
    `renderAnswerWithCitations()`, badge "General mode · không có nguồn" `:250-261`.
  - ✅ Không có key embed vẫn không vỡ: `rag.ts:116-118` bắt `NoEmbedProviderError` → `hits = []`.
  - ✅ Hạ tầng: `lib/notebook/chunk.ts` · `embed.ts` · `extract.ts` (PDF qua `unpdf`,
    `extract.ts:30-38`) · `similarity.ts` · `resolveProject.ts`; test `chunk.test.ts`,
    `rag.integration.test.ts`, `resolveProject.test.ts`.
  - 🟡 Popover Vitals ở chặng (`VitalsGesture.tsx`) gọi `/api/ai-assist-chat` **không RAG** —
    grounded chỉ có ở NotebookLM full. Người dùng không dễ nhận ra sự khác nhau này.

### Nhóm 4 · Function-calling tạo/sửa node — AI thao tác thật lên graph

- **Mô tả.** Vitals không chỉ nói mà **làm**: "thêm node upscale sau node render",
  "đổi tường này thành 220mm", "thêm slide bìa" → AI gọi hàm có kiểu, mutation đi vào
  store thật, và **mọi thao tác AI phải nằm CÙNG undo stack với thao tác tay** (⌘Z một
  lần là quay lại được, không phân biệt ai làm).
- **Bậc.** **L** — đổi kiến trúc, có rủi ro AI phá bản vẽ. Cần cổng duyệt riêng.
- **Phụ thuộc.** Nhóm 2 (phải biết đang chọn gì trước khi sửa được đúng thứ) +
  registry hàm cho phép + lớp xác nhận trước khi ghi.
- **Trạng thái. ⬜ chưa có.**
  - Grep `function.calling|functionCall|tool_call|toolCall|tools:` trong `lib/ components/ app/`
    ⇒ **0 kết quả liên quan AI** (2 hit là `lib/cad/store.ts:162 PRO_ONLY_TOOLS` và
    `components/sketch/SketchToolbar.tsx:10 TOOLS`, đều là tool vẽ của người dùng).
  - Undo stack ĐÃ CÓ SẴN để nối vào: `lib/store.ts:178-179 undo/redo` (impl `:643`, `:877`);
    `lib/cad/store.ts:277-278 undo/redo` (impl `:468`, `:475`, snapshot ≤50, xem header `:5`).
  - `docs/INDEX-AI-SPECS.md:57` cũng xếp nhóm này vào "đề xuất chưa làm".

### Nhóm 5 · Voice + ảnh (multimodal) — nói, kéo ảnh reference vào

- **Mô tả.** Nhập bằng giọng (tiếng Việt là chính) và kéo ảnh reference thẳng vào ô chat
  để Vitals đọc ảnh (style/vật liệu/tông màu) rồi tư vấn hoặc gán vào Gu.
- **Bậc.** L cho voice (quyền mic, tiếng Việt, chi phí) · P cho kéo ảnh (nhu cầu thực tế cao).
- **Phụ thuộc.** Nhóm 3 (ảnh nên đi vào cùng đường nguồn của notebook để trích dẫn được)
  + tầng VLM caption đã có ở `docs/RESEARCH-LIBRARY-UPGRADE.md` (📋 chưa thực thi).
- **Trạng thái. ⬜ chưa có.**
  - Grep `SpeechRecognition|MediaRecorder|getUserMedia|audio overview` trong
    `lib/ components/ app/` ⇒ **0 kết quả**. Ô nhập Vitals là `<input type=text>` thuần
    (`VitalsGesture.tsx:299-323`), không có nút mic, không có drop-zone ảnh.
  - Đường nạp nguồn đã có (`app/api/notebook/[projectId]/source/…`) nhưng **chưa nối vào ô chat**.

### Nhóm 6 · Audio overview — bản tóm tắt audio phiên thiết kế

- **Mô tả.** Sinh một bản "podcast 2 giọng" hoặc bản đọc tóm tắt phiên thiết kế /
  tài liệu dự án, nghe được khi đi đường, trước buổi present.
- **Bậc.** L — **tương lai, KHÔNG bắt buộc v1**.
- **Phụ thuộc.** Nhóm 3 (phải có nguồn để tóm) + provider TTS + kho lưu file audio.
- **Trạng thái. ⬜ chưa có** (cùng grep §Nhóm 5: không có TTS/audio pipeline nào).

### Bảng tổng

| # | Nhóm | Bậc | Trạng thái |
|---|---|---|---|
| 1 | Ambient orb | N | 🟡 (cử chỉ + handle xong; "orb" đã bị bỏ có chủ ý; ⌘J ⬜) |
| 2 | Canvas copilot | P | 🟡 (stage + scope xong; selection ⬜) |
| 3 | Grounded citation | P | ✅ |
| 4 | Function-calling node | L | ⬜ |
| 5 | Voice + ảnh | L / P | ⬜ |
| 6 | Audio overview | L | ⬜ |

**Tổng: 1 ✅ · 2 🟡 · 3 ⬜.**

---

## 2. Nguyên tắc trung tính của Vitals (BẮT BUỘC)

> **System prompt Vitals PHẢI trung tính.** Vitals đọc **Brand Kit + GuProfile của DỰ ÁN
> hiện hành**. Vitals **KHÔNG được ép gu / màu / font của bất kỳ studio nào** — kể cả
> studio của người viết code.

Căn cứ: `CLAUDE.md:47-57` (LUẬT NỀN TẢNG 24/07 — IF là sản phẩm độc lập, global;
Brand Kit = nhận diện riêng của TỪNG dự án).

### Hiện đã sửa thế nào (de-ttt, commit `f4017f0`)

Diff thật trên `lib/ai/chat-assist.ts`:

- Prompt gốc: gỡ đuôi `', theo gu quiet-luxury của TTT'` khỏi `CHAT_SYSTEM_PROMPT`
  (`chat-assist.ts:21-27` — nay chỉ còn mô tả app + vai trò, không gu studio).
- Brief chặng Presenting: gỡ nguyên khối brand guideline cứng (cam `#F06020`, navy
  `#002850`, beige `#F1ECE3`, Archivo/Archivo Expanded, hairline, tracked uppercase),
  thay bằng `chat-assist.ts:50-52`:
  > "áp Brand Kit CỦA DỰ ÁN (logo · bộ màu · cặp font · watermark mà user đã lưu —
  > KHÔNG áp brand guideline của studio nào khác)".
- Cùng commit: nhãn UI "Thư viện TTT" → "Thư viện ảnh"; gỡ class chết `ttt-architects`
  ở trang notebook.

### Điều PHẢI GIỮ khi mở rộng Vitals

1. **Không hardcode giá trị thương hiệu vào prompt.** Không tên studio, không hex màu,
   không tên font cụ thể. Cần thương hiệu ⇒ **đọc runtime** từ
   `lib/present-editor/brand-kit.ts:86 getActiveBrandKit()` (mẫu tham chiếu đã làm đúng:
   `components/cad/CadEditor.tsx:763`, `:937`; `lib/cad/model.ts:422`).
2. **Gu phải trích từ Reference của dự án**, không phải gu cá nhân: dùng
   `lib/gu.ts:132 buildGuProfile()` / `:210 fetchGuProfile()` / `:192 guToPrompt()`.
   `docs/GU-PROFILE.md` là gu CÁ NHÂN của chủ dự án — **không được dùng làm gu mặc định
   của sản phẩm** (`INDEX-AI-SPECS.md:58` đã cảnh báo).
3. **Rỗng thì để rỗng.** Brand Kit chưa có ⇒ Vitals nói "dự án chưa có Brand Kit", KHÔNG
   rơi về một gu mặc định nào (đúng pattern khung tên CAD: studio rỗng ⇒ in trống).
4. **Ngôn ngữ & giọng.** Tiếng Việt dẫn, không sến, không emoji, tối đa 3 câu ở popover
   (`chat-assist.ts:65`). Chuỗi UI mới phải qua `lib/i18n.ts` EN+VI theo
   `docs/CONTENT-RULES.md` §2 — không hardcode rải rác.
5. **Không trộn nội dung.** Vitals không được lấy nội dung dự án khách hay deck demo làm
   ví dụ mặc định (`docs/CONTENT-RULES.md` §1, §3, §4).

### Lỗ hổng còn lại của nguyên tắc trung tính

~~⚠️ Hiện prompt chỉ **nói bằng chữ** là "áp Brand Kit của dự án", nhưng **không có dòng code
nào bơm giá trị Brand Kit/GuProfile thật vào prompt Vitals**.~~

**CẬP NHẬT 25/07 — đã bơm Brand Kit (VIỆC 4).** Đường đi: `brandContextForVitals()`
(`lib/present-editor/brand-kit.ts`, bọc `getActiveBrandKit()`) → client gửi kèm trường `brand`
mỗi lượt (`components/studio/VitalsGesture.tsx`, `components/ProjectSelect.tsx`) → route
`app/api/ai-assist-chat/route.ts` gọi `sanitizeBrandContext()` → `brandPromptBlock()` nhồi
tên · bộ màu · cặp font · có-hay-chưa logo vào system prompt (`lib/ai/chat-assist.ts`).
Giữ đúng 3 luật §2: không hardcode giá trị nào (mọi hex đến từ user), rỗng-để-rỗng (chưa có kit
⇒ prompt nói "dự án CHƯA có Brand Kit" + cấm bịa), không gửi dataURL logo.

⬜ **GuProfile vẫn chưa bơm — cố ý.** `fetchGuProfile()` đọc `/api/library`, mà thư viện là
**dùng chung cả team, không scope theo dự án** (`app/api/library/route.ts:10`). Bơm vào sẽ trộn
gu của dự án khác — trái §2 mục 2 và `docs/CONTENT-RULES.md` §1. Mở lại khi Reference có
`projectId`.

---

## 3. Kiến trúc & file liên quan

| File | Vai trò |
|---|---|
| `lib/ai/chat-assist.ts` | **Nguồn sự thật của system prompt Vitals**: danh tính, brief 4 ngữ cảnh, sanitize/normalize payload, build prompt. Logic thuần → test được không cần mock Next. |
| `app/api/ai-assist-chat/route.ts` | Endpoint chat KHÔNG RAG (popover ở chặng + Gallery). Auth `getSessionUser`, chọn tầng AI, lỗi typed `NO_TEXT_PROVIDER` / `NVIDIA_FREE_EXHAUSTED`. |
| `lib/ai/text-tier.ts` | `completeTextTiered` — Cloud (NVIDIA free) → Ollama local → lỗi typed. "CHỈ BÁO, KHÔNG tự tụt âm thầm". |
| `lib/input/stage-drop.ts` | Máy trạng thái cử chỉ kéo: slop → `vitals` (28px) → `notebook-full` (120px) → `locked`. Có test `stage-drop.test.ts`. |
| `components/studio/StageSwitcher.tsx` | Handle hairline + onboarding tooltip + pre-mount panel + điều hướng `notebook-full`. |
| `components/studio/VitalsGesture.tsx` | Popover chat 380px ở chặng; lịch sử sống ở module scope (`vitalsSession`); nút Mở rộng → `/projects/[id]/notebook`. |
| `components/studio/VitalsIcon.tsx` · `VitalsChatBubble.tsx` | Icon giọt + bong bóng/typing dots dùng chung. |
| `components/ProjectSelect.tsx` | Thanh Vitals luôn hiện ở Gallery + overlay hội thoại; guard bàn phím `[data-vitals-chat]`. |
| `lib/notebook/rag.ts` | Pipeline RAG + quyết định `grounded`/`general` + luật trích dẫn. |
| `lib/notebook/{chunk,embed,extract,similarity,resolveProject}.ts` | Chunk · embed · trích text (PDF `unpdf`) · cosine · resolve `projectId`. |
| `app/api/notebook/[projectId]/query/route.ts` | Endpoint RAG (auth chủ project, clamp topK ≤ 12). |
| `app/api/notebook/[projectId]/source*/route.ts` | Nạp/đọc/xoá nguồn của notebook dự án. |
| `components/notebook/*` | UI NotebookLM full: sidebar nguồn, chat panel, source viewer, `useNotebook`. |
| `app/projects/[id]/notebook/page.tsx` | Route NotebookLM full (điểm dừng 2 của cử chỉ). |
| `lib/present-editor/brand-kit.ts` | `getActiveBrandKit()` — đường DUY NHẤT hợp lệ để Vitals biết thương hiệu dự án. |
| `lib/gu.ts` | `buildGuProfile` / `fetchGuProfile` / `guToPrompt` — gu trích từ Reference của dự án. |
| `lib/scope.ts` + `docs/IF-CORE-SCHEMA.md` | Luật scope `global` / `project` mà Vitals phải tôn trọng. |

---

## 4. Nợ / rủi ro

1. **🔴 Nhóm 4 phải đi qua CÙNG undo stack với thao tác tay.** Nếu function-calling tự
   giữ history riêng thì ⌘Z sẽ hoạt động lệch nhau và **vỡ bản vẽ** — người dùng undo
   thao tác tay nhưng thay đổi của AI vẫn còn (hoặc ngược lại). Bắt buộc dùng
   `lib/store.ts:178` và `lib/cad/store.ts:277` sẵn có, snapshot trước mỗi mutation của AI
   đúng như mutation tay (`lib/cad/store.ts:5`: "Mọi mutation cấu trúc đều snapshot()").
2. **🔴 Vitals tư vấn brand mù.** Prompt nói "áp Brand Kit của dự án" nhưng không nhận
   giá trị thật (§2 lỗ hổng). Rủi ro: AI bịa màu/font, người dùng tin theo.
3. **🟠 Hai đường chat không đồng nhất.** `/api/ai-assist-chat` (không RAG, không biết
   `projectId`) vs `/api/notebook/[projectId]/query` (RAG, có trích dẫn). Cùng một câu hỏi
   ra hai chất lượng khác nhau mà UI không nói rõ. Nên hợp nhất, hoặc ít nhất badge rõ.
4. **🟠 Lịch sử hội thoại không bền.** `VitalsGesture.tsx:35 let vitalsSession` sống ở
   module scope ⇒ reload là mất; route.ts:16 ghi rõ "v1: KHÔNG lưu DB". Chưa có
   ProjectNotebook thread lưu chat.
5. **🟠 `⌘J` là nợ ảo.** Được ghi là nợ ở `CHANGELOG.md:256` và
   `MASTERPLAN-IF-ARCHINOTE.md:34` nhưng **grep 0 kết quả implement**. Cần chốt: làm hay
   xoá khỏi danh sách nợ.
6. **🟡 "Ambient orb" mâu thuẫn quyết định 23/07.** Visual giọt kính đã bị user yêu cầu
   bỏ (`VitalsGesture.tsx:6-16`). Nếu spec vẫn gọi nhóm 1 là "orb" thì phải chốt lại
   nghĩa: "hiện diện nhẹ" = handle hairline (hiện tại) hay orb có nhịp thở (quay lại cái
   đã bỏ)?
7. **🟡 Phụ thuộc provider bên ngoài.** Vitals đứt khi hết NVIDIA free và không có Ollama
   (`route.ts:52-59`). Embed cũng vậy → RAG âm thầm tụt về general mode
   (`rag.ts:116-118`), user chỉ thấy prefix nhỏ. Xem `docs/STRATEGY-ai-tiers-and-safety.md`.
8. **🟡 An toàn dữ liệu dự án.** RAG hiện lọc theo `projectId` đúng luật scope
   (`query/route.ts:20,31`) — **phải giữ** khi mở rộng sang team/chia sẻ, nếu không sẽ rò
   nguồn dự án khác. `docs/RESEARCH-CHAT-FULL.md` là tài liệu liên quan.

---

## 5. Câu hỏi chờ Hoà quyết

1. **LLM nền nào?** Hiện là NVIDIA free → Ollama local (`lib/ai/text-tier.ts`), chất lượng
   dao động và đã có sự cố hết lượt. Có chuyển sang một provider trả tiền làm tầng chính
   (và tầng nào làm dự phòng)? Function-calling (Nhóm 4) **bắt buộc** model hỗ trợ tool
   use ổn định — quyết định này chặn Nhóm 4.
2. **Voice tiếng Việt: ngay hay sau?** Làm ngay bằng Web Speech API (miễn phí, chất lượng
   tiếng Việt kém, phụ thuộc trình duyệt) hay đợi provider STT trả tiền? Hay bỏ voice khỏi
   v1 luôn?
3. **Citation nối vào nguồn nào?** Hiện chỉ nguồn user tự nạp vào notebook dự án. Có mở
   thêm: (a) thư viện Reference của dự án, (b) bộ quy chuẩn TCVN/PCCC trong
   `docs/CAD-STANDARDS.md`, (c) chính bản vẽ `.idf` đang mở, (d) tài liệu app (HUONG-DAN)?
   Mỗi nguồn là một pipeline extract riêng.
4. **Hợp nhất hai đường chat?** Cho popover ở chặng dùng luôn RAG theo `projectId` (một
   đường duy nhất), hay giữ hai đường và ghi rõ khác biệt trên UI?
5. **Nhóm 4 có được phép chạm bản vẽ CAD không**, hay chỉ được tạo/sửa node ở Rendering và
   slide ở Presenting? (Bản vẽ CAD là hồ sơ DD — rủi ro cao nhất.)
6. **"Ambient orb" chốt nghĩa nào?** (xem Nợ/rủi ro #6).

---

## Gom AI về một cửa — một trợ lý, nhiều điểm gọi

**Hiện trạng**: AI **rơi rớt 4 chỗ** — "AI mô tả" ở CAD · node AI ở Render · PS-8 ở Present ·
Vitals riêng. Mỗi chỗ một kiểu, người dùng không biết chỗ nào làm được gì.

**Gom KHÔNG phải dồn hết vào một ô chat.** Mà là **một trợ lý, nhiều điểm gọi**
*(one assistant, many entry points)*:

| Gọi ở đâu | Vitals biết gì | Làm gì |
|---|---|---|
| CAD | Đang mở bản vẽ nào, phòng nào | Đề bài → phương án · tra quy chuẩn · tô vật liệu |
| Render | Ảnh nào đang chọn, thẻ nào đang chạy | Gợi ý thẻ · viết prompt · đọc gu từ ảnh |
| Present | Deck nào, slide nào | Khởi thảo nội dung · chọn bố cục · viết narrative |
| Library | Đang lọc gì | Tìm bằng câu chữ · gắn thẻ |

**Luật**: cùng một bộ não (T5), khác ngữ cảnh. **Không nhân bản 4 trợ lý.**
Áp luật 7 blueprint: mọi việc Vitals làm phải có **hàm có tên** mà UI cũng gọi được.

---

*File này là DRAFT. Không code Nhóm 4/5/6 trước khi Hoà duyệt spec + trả lời §5.*
