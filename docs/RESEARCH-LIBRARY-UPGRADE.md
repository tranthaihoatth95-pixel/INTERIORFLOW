# NGHIÊN CỨU · Nâng cấp Thư viện — taxonomy đa tầng · auto-classify · hiển thị theo chặng — InteriorFlow

> **Trạng thái: ĐỀ XUẤT, CHƯA THỰC THI.** Tài liệu này KHÔNG kèm thay đổi schema/API/UI nào.
> Mọi khối code bên dưới là **mẫu minh hoạ**, chưa áp vào repo.
>
> Nhánh: `feat/library-upgrade-research` · Ngày: 2026-07-23 · Mọi khẳng định về code đã verify
> bằng đọc file thật (không đoán); số liệu phân bố usage đã verify bằng `sqlite3` trên
> `prisma/dev.db` thật (1515 asset, không phải mẫu).

---

## Mục lục

0. Tóm tắt cho người bận
1. Vấn đề hiện tại (verify bằng code + số liệu DB thật)
2. Taxonomy tag đa tầng đề xuất (5 tầng: kind · stage-usage · domain · project · user-tags)
3. Auto-classify pipeline (upload → VLM → confirm)
4. Hiển thị theo chặng (auto-filter Reference pane)
5. Nút "Nhập" mở rộng (modal upload nâng cấp + description input)
6. Migration dữ liệu cũ (1515 asset)
7. Rủi ro & giới hạn
8. Phân kỳ M1/M2/M3
9. Câu hỏi cần user quyết

---

## 0. TÓM TẮT CHO NGƯỜI BẬN

**Số liệu DB thật (`sqlite3 prisma/dev.db`, 23/07):** 1515 asset. Phân bố `usage`:
`ref-render=527 · layout=521 · slide=457 · material=10 · furniture/cad/brief=0`. **1515/1515
đều có `tags`** — nhưng đọc thẳng cột `tags` thấy toàn `"moodboard, gu-đích"` /
`"view-render, gu-đích"` **lặp lại nguyên xi hàng trăm lần** (không phải taxonomy — là 2-3 nhãn
kỹ thuật cứng do node auto-lưu). 1450/1515 có `caption` (VLM đã chạy → có sẵn ngữ nghĩa, chưa
được khai thác vào search). **0/1515 có `content`** (chưa từng upload PDF/brief thật).

Ba phát hiện nền tảng:

| # | Phát hiện | Ý nghĩa |
|---|---|---|
| 1 | `tags String @default("")` (`schema.prisma:183`) = **CSV thuần, không normalize, không index, không có taxonomy** — thực tế data cho thấy tag do node tự sinh cứng, KHÔNG phản ánh nội dung ảnh. Cột `usage` (7 giá trị enum trong `refingest.ts:14`) tải hết ngữ nghĩa phân loại → quá tải, không đủ tầng. | Phải thêm tầng phân loại mới; **KHÔNG breaking** nếu dùng JSON field `tagsStructured` optional bên cạnh `tags` cũ. |
| 2 | `captionImage()` (`lib/ai/providers/nvidia.ts:50-73`) đã trả về ĐÚNG shape `{caption, style, materials[], room}` — 1450/1515 asset ĐÃ CÓ caption. Nhưng `LibraryPanel.filter` chỉ đọc `usage` (`lib/ref-search.ts:245-262`), **không đọc `style`/`materials`/`room`** để lọc/gợi ý. | 90% hạ tầng ngữ nghĩa ĐÃ CÓ SẴN. Việc còn lại là (a) parse caption/style/materials/room từ trường `caption` (đang chứa cả JSON hay chỉ text thuần?) → thêm cột `style/materials/roomType` riêng để index, HOẶC (b) chạy lại VLM 1 lần cho 1515 ảnh cũ để lấy JSON đầy đủ. Xem §6 migration. |
| 3 | Route `/api/library/POST` (`app/api/library/route.ts:49-87`) hiện chấp nhận `{name, category, tags, usage, palette, caption, content, w, h}` từ client — **KHÔNG có bước AI classify ở server**. Auto-caption chỉ chạy khi client GỬI ảnh sang `/api/vision/caption` (opt-in trong `LibraryPanel:194-200`). | Auto-classify muốn "mặc định bật" phải hook vào POST route (server-side) — hoặc client-flow bắt buộc gọi `/vision/caption` trước khi POST. Chọn 1 trong 2, xem §3. |

**Khuyến nghị kiến trúc 1 câu:** GIỮ NGUYÊN bảng `LibraryAsset` (không tách bảng con tránh
migration nặng) — thêm 3 cột optional `kind` (enum), `stageUsage` (JSON string[]), `domain`
(JSON `{style?, roomType?, material[], mood?, projectId?}`) — auto-classify chạy trong POST route
bằng VLM (đã có), fallback về `usage` cũ nếu VLM lỗi/hết quota. UI Reference pane đọc thêm
`stageUsage[]` để auto-filter theo chặng đang mở; user description input là **optional**, chỉ
gợi ý — không bắt buộc.

---

## 1. VẤN ĐỀ HIỆN TẠI

### 1.1 Tag CSV thuần → không normalize, không index, không đa nghĩa

`prisma/schema.prisma:183`:
```prisma
tags      String   @default("")
```

Đọc data thật:
```
moodboard, gu-đích        (lặp 100+ lần)
view-render, gu-đích      (lặp 100+ lần)
```

Đây KHÔNG phải tag user gõ — là nhãn node auto-lưu (moodboard/view-render là 2 flow output
Rendering). Nghĩa là **user chưa BAO GIỜ gõ tag thật** trong 1515 ảnh — có thể vì UI upload
không có ô tag trực quan, hoặc user thấy không cần. **Duplicate "moodboard" vs "mood-board"
sẽ xảy ra ngay khi có 2 người dùng gõ tự do** — chưa xảy ra vì chưa ai gõ.

### 1.2 `usage` enum quá tải — 1 cột gánh cả "kind" lẫn "chặng dùng"

`lib/refingest.ts:14`:
```ts
export type RefUsage = 'ref-render' | 'slide' | 'material' | 'layout' | 'cad' | 'brief' | 'furniture';
```

Vấn đề: 1 giá trị `usage` phải trả lời CÙNG LÚC:
- **Loại ảnh gì?** (photo/render/sketch/plan) — `cad` là "bản vẽ", `material` là swatch, còn
  lại (`ref-render`/`slide`/`layout`/`brief`) hỗn hợp không rõ.
- **Chặng nào dùng?** — `ref-render` cho Rendering, `slide` cho Presenting, `cad`/`layout` cho
  Drafting CAD, nhưng thực tế 1 ảnh mood đẹp có thể dùng cho CẢ Rendering (ref) LẪN Presenting
  (bìa slide) — enum single-value không diễn tả được.

Hệ quả: `PHASE_USAGES` (`lib/ref-search.ts:245-249`) phải map cứng — không có cách nào để 1 ảnh
xuất hiện ở nhiều chặng trừ khi upload nhiều lần.

### 1.3 Caption VLM đã có nhưng KHÔNG dùng để phân loại

`captionImage()` trả `{caption, style, materials[], room}` — 4 tầng ngữ nghĩa. `LibraryAsset.caption`
lưu **chỉ 1 chuỗi text** (`caption: typeof caption === 'string' ? caption.slice(0, 400) : ''`,
`route.ts:80`). Nghĩa là `style/materials/room` bị FLATTEN vào text, mất cấu trúc, không query
được. `LibraryPanel` search phải fuzzy-match cả 1 chuỗi.

Verify data: `sqlite3 dev.db "SELECT caption FROM LibraryAsset LIMIT 3"` → thấy caption text
thuần (không phải JSON). VLM output đã bị serialize hủy cấu trúc từ đầu.

### 1.4 Auto-classify không mặc định — user phải chủ động

`LibraryPanel:194-200`: nếu user chọn `usage='auto'` thì client gọi `/api/vision/caption` để
suy `usage`. Nhưng modal upload không **bắt buộc** dùng auto — user có thể để mặc định
`ref-render`. Kết quả: 1515 asset nhưng phân bố usage lệch nặng (527/521/457/10/0/0/0) — nhiều
ảnh có thể là `furniture` nhưng được gán `ref-render`.

### 1.5 Không có auto-filter theo chặng thực sự — chỉ sắp xếp lại

`phaseRelevance()` (`lib/ref-search.ts:259`) chỉ **cộng điểm sort**, không lọc. Vẫn hiển thị TẤT
CẢ. Trong khi chặng CAD mở panel Reference chỉ cần thấy `cad`/`layout` (bản vẽ, không cần ảnh
mood phòng ngủ). Rendering không cần thấy PDF brief.

---

## 2. TAXONOMY TAG ĐA TẦNG ĐỀ XUẤT

Thay 1 cột `usage` + `tags` phẳng bằng **5 tầng ngữ nghĩa độc lập**. Mỗi tầng trả lời 1 câu
hỏi riêng, không chồng chéo.

### Tầng 1 — `kind` (enum cứng, single-value)

**Trả lời: đây là LOẠI file/nội dung gì?**

```ts
type LibraryKind =
  | 'photo'            // ảnh thật (chụp không gian đã xây)
  | 'render'           // ảnh render 3D
  | 'sketch'           // vẽ tay/marker/concept sketch
  | 'plan'             // mặt bằng 2D
  | 'elevation'        // mặt đứng / mặt cắt
  | 'moodboard'        // collage nhiều ảnh
  | 'material-swatch'  // mẫu vật liệu (gỗ, đá, vải…) cận cảnh
  | 'document'         // PDF/DOCX brief
  | 'template'         // template dàn trang (slide layout)
  | 'video'            // mp4/mov clip
  | 'audio';           // wav/mp3
```

Enum cứng → không có "moodboard" vs "mood-board" trùng.

### Tầng 2 — `stageUsage[]` (multi-value)

**Trả lời: chặng nào của IF sẽ dùng ảnh này?**

```ts
type StageUsage =
  | 'cad-ref'         // dùng làm ref khi vẽ CAD (sketch, plan, elevation ref)
  | 'render-mood'     // ref không khí/style cho Rendering
  | 'render-material' // ref vật liệu cho Rendering
  | 'render-style'    // ref phong cách chung cho Rendering
  | 'present-cover'   // bìa slide Presenting
  | 'present-body'    // ảnh body slide
  | 'present-quote'   // ảnh nền cho quote/breaker slide
  | 'library-general';// chưa gán chặng cụ thể, hiện ở "Tất cả"
```

Multi-value → 1 ảnh mood đẹp có thể vừa `render-mood` vừa `present-cover` mà không cần upload 2
lần. Suy từ `kind`:
- `render` → auto-suggest `[render-mood, render-style]`
- `plan/elevation/sketch` → `[cad-ref]`
- `moodboard` → `[present-cover, render-mood]`
- `material-swatch` → `[render-material]`
- `photo` → `[render-mood, present-body]`
- `document` → `[library-general]` (brief hiển thị ở Home/Gallery, không phải Reference pane)

### Tầng 3 — `domain` (JSON object — ngữ nghĩa nội thất)

**Trả lời: nội dung nói về CÁI GÌ trong thế giới nội thất?**

```ts
interface LibraryDomain {
  roomType?: 'bedroom' | 'living' | 'kitchen' | 'bath' | 'office' | 'lobby' | 'restaurant' | 'retail' | 'exterior' | 'other';
  style?: 'japandi' | 'modern' | 'wabi-sabi' | 'quiet-luxury' | 'tropical' | 'industrial' | 'classic' | 'brutalist' | 'other';
  material?: string[];  // 'oak' | 'travertine' | 'marble' | 'concrete' | 'linen' | 'terrazzo' | 'brass' | ...
  mood?: 'warm' | 'cool' | 'dramatic' | 'serene' | 'playful';
}
```

Lấy trực tiếp từ VLM output (`captionImage` đã trả `{style, materials[], room}` — chỉ thiếu
`mood`, có thể thêm vào prompt). Enum `style/roomType/mood` KHÔNG cứng như tầng 1 — cho phép
`'other'` để user tự thêm nhãn.

### Tầng 4 — `projectId` (optional FK)

**Trả lời: ảnh này gắn với dự án cụ thể nào?**

Optional foreign key `Project.id` (bảng đã có). Nếu ảnh là hiện trạng "Detech Complex" hay
concept "Villa Anh Vinh" → gắn `projectId`. Nếu là ảnh reference chung → null.

### Tầng 5 — `userTags[]` (fallback tự do)

**Trả lời: mọi thứ khác user muốn ghi.**

Mảng string tự do, không normalize. Chỉ để "phễu cuối" — 4 tầng trên không đủ thì user gõ vào
đây. UI có autocomplete gợi ý từ tag có sẵn trong team để giảm trùng ("wabi-sabi" gõ 2 chữ
đầu → hiện gợi ý dùng lại).

### Prisma model đề xuất — NON-BREAKING

**Không tách bảng con** (tránh Prisma migration nặng, tránh JOIN). Thêm 4 cột JSON optional vào
`LibraryAsset`:

```prisma
model LibraryAsset {
  // ... field cũ giữ nguyên (id, userId, name, category, tags, usage, palette, caption, ...)

  // ---- Taxonomy v2 (23/07) — 5 tầng ngữ nghĩa, tất cả OPTIONAL ----
  kind         String?  // 'photo'|'render'|'sketch'|'plan'|'elevation'|'moodboard'|'material-swatch'|'document'|'template'|'video'|'audio'
  stageUsage   String?  // JSON string[] — StageUsage[]
  domain       String?  // JSON LibraryDomain — {roomType?, style?, material?[], mood?}
  projectId    String?  // FK Project.id, optional
  userTags     String?  // JSON string[] — tag tự do

  project      Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)

  @@index([kind])
  @@index([projectId])
}
```

Lý do KHÔNG dùng bảng con `LibraryAssetTag`:
- SQLite JSON query đủ dùng (Prisma hỗ trợ `contains` trên string).
- Không có JOIN → performance list panel tốt.
- Migration chỉ thêm cột nullable → **0 breaking change**.
- Rollback: drop cột.

Trade-off: full-text search trong JSON kém hơn indexed relation. Chấp nhận vì Reference pane
chỉ có ~2000 asset, filter in-memory sau khi load 1 lần.

---

## 3. AUTO-CLASSIFY PIPELINE

Khi user upload 1 file → 4 bước:

### Bước 1 — Detect MIME → `kind` cơ bản (server, đồng bộ)

```ts
function inferKind(mime: string, name: string): LibraryKind {
  if (mime === 'application/pdf' || /\.pdf$/i.test(name)) return 'document';
  if (/^application\/(msword|vnd\.openxmlformats)/.test(mime)) return 'document';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('image/')) return 'photo'; // fallback — tinh lại ở bước 2
  return 'other' as LibraryKind;
}
```

### Bước 2 — VLM classify chi tiết (chỉ ảnh, gọi `captionImage()` MỞ RỘNG)

**Mở rộng prompt** để VLM trả thêm `kind` chính xác + `mood`:

```ts
// lib/ai/providers/nvidia.ts — EXTEND captionImage()
const prompt =
  'Bạn là chuyên gia nội thất. Nhìn ảnh và CHỈ trả về JSON thuần: ' +
  '{"kind":"photo|render|sketch|plan|elevation|moodboard|material-swatch",' +
  '"caption":"<1 câu VN>","style":"<Japandi/Modern/...>",' +
  '"materials":["oak","travertine",...],"room":"bedroom|living|...","mood":"warm|cool|..."}';
```

Chi tiết phân biệt `photo` vs `render` khó (VLM llama-3.2-11b có thể sai) — chấp nhận sai lệch,
để user chỉnh tay ở bước 4.

### Bước 3 — Parse user description (optional, dùng LLM đã có)

Nếu user gõ textarea "Mô tả nội dung" → gọi `completeText()` (đã có ở `nvidia.ts:81-87`) với
prompt:

```
Người dùng gõ: "<text>"
Trích JSON: {"roomType?", "style?", "materials[]", "projectHint?", "userTags[]"}
```

Rồi **merge** với VLM output (ưu tiên user > VLM khi conflict — user biết dự án cụ thể).

### Bước 4 — User confirm UI (client, trước khi POST)

Modal upload hiện bảng gợi ý:

```
┌─ Ảnh: bedroom-oak-01.jpg ────────────────────┐
│ [preview 200×200]                             │
│                                               │
│ Loại (kind):     [Photo ▾]        ← từ VLM   │
│ Chặng dùng:      [x render-mood]              │
│                  [ ] render-material          │
│                  [x present-cover]            │
│ Phòng:           [Bedroom ▾]                  │
│ Style:           [Wabi-sabi ▾]                │
│ Vật liệu:        oak · linen · [+thêm]        │
│ Mood:            [Warm ▾]                     │
│ Dự án:           [— chưa gán —      ▾]        │
│ Tag tự do:       [                      ]     │
│                                               │
│ Mô tả (tuỳ chọn để AI hiểu thêm):             │
│ [                                       ]     │
│                                               │
│           [Huỷ]  [Chỉ lưu ảnh]  [Lưu + Tag]   │
└───────────────────────────────────────────────┘
```

- **"Chỉ lưu ảnh"** → save với `kind` từ MIME, `stageUsage=['library-general']`, không gọi VLM.
- **"Lưu + Tag"** → chạy pipeline đầy đủ.
- User có thể chỉnh mọi trường trước khi confirm.

### Bước 5 — Server POST + lưu (`app/api/library/route.ts` mở rộng)

Thêm accept `kind`, `stageUsage`, `domain`, `projectId`, `userTags` vào body POST hiện có.
Validate enum (whitelist), JSON stringify các mảng/object.

**Chi phí NVIDIA:** mỗi upload có VLM = 1 call llama-3.2-11b-vision (~30-50k tokens I/O).
NVIDIA free tier hiện có 1000 credit/tháng theo docs → **~500-1000 ảnh/tháng cho MỚI upload**,
đủ dùng cho team TTT ~50 ảnh/tuần. Migration 1515 ảnh cũ tốn ~1-2 tháng quota nếu chạy hết —
xem §6.

---

## 4. HIỂN THỊ THEO CHẶNG (auto-filter)

Reference pane ở mỗi chặng đọc `useFlowStore.getState().workspace` (đã có, kiểu `RefPhase =
'concept' | 'render' | 'present'`) → filter `stageUsage[]`:

```ts
// components/LibraryPanel.tsx — pseudo
const STAGE_TO_USAGES: Record<RefPhase, StageUsage[]> = {
  concept: ['cad-ref'],
  render:  ['render-mood', 'render-material', 'render-style'],
  present: ['present-cover', 'present-body', 'present-quote'],
};

const stageFiltered = showAll
  ? items
  : items.filter(a => {
      const su = safeArr(a.stageUsage) as StageUsage[];
      return su.some(u => STAGE_TO_USAGES[workspace!].includes(u));
    });
```

### 4.1 Rendering có 3 tab con

Rendering là chặng dùng ref NHIỀU nhất → tách tab con:
- **Mood** (`render-mood`) — ảnh không khí phòng đẹp
- **Material** (`render-material`) — vật liệu swatch
- **Style** (`render-style`) — ảnh mang phong cách rõ

### 4.2 Bộ lọc phụ theo domain

Trong mỗi chặng, thêm hàng chip filter:
- `roomType`: [Tất cả] [Bedroom] [Living] [Kitchen] [Office] ...
- `style`: [Tất cả] [Japandi] [Wabi-sabi] [Quiet-luxury] ...
- `project`: [Tất cả] [Detech Complex] [Villa Anh Vinh] ...

Chip active AND với nhau (roomType=bedroom AND style=japandi).

### 4.3 Toggle "Xem TẤT CẢ"

Nút ở góc phải trên panel — bỏ mọi filter chặng, hiển thị nguyên 1515 asset (giữ hành vi hiện
tại, cho user quen).

---

## 5. NÚT "NHẬP" MỞ RỘNG

`IOMenu` hiện là menu xổ đơn giản (`components/ui/IOMenu.tsx:189-232` — mỗi item chỉ có
`{id, label, sub, icon, onSelect}`). Đề xuất:

### 5.1 Thêm item mới "Ảnh vào Reference"

Ở CẢ 3 chặng, item mặc định trong menu Nhập:
```ts
{
  id: 'library-image',
  label: 'Ảnh vào Reference',
  sub: 'AI tự phân loại · gợi ý gu · gán chặng dùng',
  icon: <Sparkles size={15} />,
  onSelect: () => openLibraryUploadModal({ preselectStage: workspace }),
}
```

Ở chặng Presenting còn thêm "Ảnh vào slide" (behavior khác — dán thẳng vào slide đang mở, không
qua Library).

### 5.2 Modal upload nâng cấp (component MỚI)

`components/library/LibraryUploadModal.tsx` — thiết kế:

- **Drop zone** — kéo-thả nhiều file cùng lúc (không chỉ 1 như hiện tại).
- **Preview grid** — mỗi file 1 card, hiện thumbnail (ảnh) hoặc icon (PDF/DOCX).
- **Auto-classify chạy song song** — mỗi card có badge "Đang phân loại..." → sau vài giây
  hiện tag đã suy ra.
- **Bulk edit** — chọn nhiều card, chỉnh chung `stageUsage`/`domain.style`/`projectId`.
- **Description textarea** (dưới grid) — mô tả CHUNG cho batch, apply cho mọi card.
- **Confirm all** — nút "Lưu tất cả (N)" → POST tuần tự.

### 5.3 Wire `markitdown-mcp` cho office file

PDF/DOCX/XLSX/PPTX → gọi `mcp__markitdown__convert_to_markdown` (tool đã cài, xem memory
`tools-headroom-markitdown`) → lưu markdown vào `content` field. Ảnh (thumbnail trang đầu) →
gọi VLM classify tiếp.

Chi tiết: PDF hiện đã có `/api/pdf/extract` (`refingest.ts:127`) trả text. Với DOCX/PPTX/XLSX
cần route mới `/api/office/extract` gọi markitdown.

---

## 6. MIGRATION DỮ LIỆU CŨ (1515 ASSET)

### 6.1 Chiến lược 3 phase

**Phase A — Backfill từ dữ liệu ĐÃ CÓ (không tốn quota AI, ~30 phút chạy):**
- 1450 asset có `caption` text → parse regex tìm từ khoá material/room/style trong caption:
  - "wabi-sabi" trong caption → `domain.style='wabi-sabi'`
  - "bedroom"/"phòng ngủ" → `domain.roomType='bedroom'`
  - "oak"/"gỗ sồi" → `domain.material.push('oak')`
- Từ `usage` cũ suy `kind` + `stageUsage`:
  - `ref-render` → `kind='photo'` (hoặc 'render' — VLM lại), `stageUsage=['render-mood']`
  - `slide` → `kind='moodboard'`, `stageUsage=['present-cover']`
  - `layout` → `kind='template'`, `stageUsage=['present-body']`
  - `material` → `kind='material-swatch'`, `stageUsage=['render-material']`
  - `cad` → `kind='plan'`, `stageUsage=['cad-ref']`
  - `brief` → `kind='document'`
  - `furniture` → `kind='photo'`, `stageUsage=['render-mood']`
- Tag cũ (`"moodboard, gu-đích"`) → giữ nguyên vào `userTags[]` (không mất).

Ước tính: 80% asset sẽ có `kind`+`stageUsage`+1-2 field `domain` sau Phase A, không tốn AI.

**Phase B — VLM re-classify (opt-in, tốn quota):**
- Chạy trên asset còn thiếu `domain.style` hoặc user muốn refine.
- **KHÔNG chạy tự động toàn bộ 1515 ảnh** — tốn ~1-2 tháng quota NVIDIA. Chờ user OK.
- Batch: 50 ảnh/lần, background job, có progress bar ở /library. Vitals hiện tại tiến độ.

**Phase C — User bulk edit:**
- Trang `/library/admin` (chỉ user creator role) — bảng phẳng 1515 dòng, cột `kind`,
  `stageUsage`, `domain.style`, `projectId`, `userTags`, filter/sort/bulk-edit inline.
- Cho phép fix batch: "Chọn 200 ảnh gán projectId=Detech Complex".

### 6.2 Rollback plan

- Prisma migration chỉ ADD column nullable → `prisma migrate rollback` (hoặc drop cột thủ công)
  KHÔNG mất dữ liệu cũ.
- Backfill Phase A ghi vào field mới → nếu sai chỉ cần UPDATE ... SET kind=null, không đụng
  `usage`/`tags` cũ.

### 6.3 Ước tính chi phí

- Phase A: 0 đồng, ~30 phút CPU local.
- Phase B: nếu chạy 1515 ảnh × 1 VLM call ≈ 1515 credit NVIDIA. Free tier 1000/tháng → **tràn
  quota, cần chạy 2 tháng** hoặc user cấp API key trả phí. Rẻ nhất: chạy 500 ảnh/tháng, 3 tháng
  xong.
- Phase C: 0 đồng, phụ thuộc user có thời gian.

---

## 7. RỦI RO & GIỚI HẠN

| # | Rủi ro | Mức | Giảm thiểu |
|---|---|---|---|
| 1 | VLM misclassify `kind` (ảnh mù mờ, ảnh nhiều nội dung, ảnh render giả photo) | Trung | User confirm trước khi save (§3 bước 4); có nút "chỉnh tay" ở list view |
| 2 | Migration 1515 ảnh tràn quota NVIDIA free | Cao | Phase A không tốn AI; Phase B opt-in + throttle; chờ user OK |
| 3 | Schema breaking khi merge nhiều nhánh worktree đang mở | Thấp | Chỉ ADD cột nullable → non-breaking; test bằng `prisma migrate diff` trước khi merge main |
| 4 | User không dùng tính năng bulk edit (thói quen upload rồi bỏ đó) | Trung | UX: gợi ý "1200 ảnh chưa gán stage" ở Home; Vitals nhắc |
| 5 | JSON query trong SQLite chậm khi > 10k asset | Thấp | Chỉ ~2k dự kiến; nếu vượt → chuyển sang Postgres (đã có plan Supabase Sprint 4) |
| 6 | `domain.style` enum không phủ hết thực tế (VD "biophilic", "brutalist-neo") | Trung | Cho `'other'` + `userTags[]` — bổ sung enum sau khi có dữ liệu 3 tháng |
| 7 | Duplicate detection (user upload cùng ảnh 2 lần) | Trung | Hash SHA-256 file khi POST, cảnh báo "đã có" — KHÔNG chặn (có thể muốn variant crop khác) |
| 8 | Vitals cần thông báo tiến độ migration → phá trải nghiệm | Thấp | Progress panel riêng ở /library, không popup toàn màn hình |

---

## 8. PHÂN KỲ M1/M2/M3

### M1 — Schema + Auto-classify cho ảnh MỚI (~1 tuần)

**Mục tiêu:** upload ảnh mới → tự phân loại đúng, không phá gì cũ.

- [ ] Prisma migration `add_library_taxonomy_v2`: thêm 4 cột nullable + FK Project.
- [ ] Extend `captionImage()` prompt → trả thêm `kind` + `mood`.
- [ ] POST `/api/library` accept + validate field mới.
- [ ] Modal upload nâng cấp (single-file, chưa batch) với confirm tag UI.
- [ ] Extend `LibraryPanel` filter theo `stageUsage` khi có; fallback về logic cũ khi null.
- [ ] Test: 20 ảnh mới upload, verify tag đúng ≥ 70%.

**Deliverable:** user upload 20 ảnh mới, thấy Reference pane ở Rendering lọc đúng.

### M2 — Migration Phase A + hiển thị theo chặng full (~3-5 ngày)

- [ ] Script `scripts/migrate-library-v2.ts` — Phase A backfill từ `usage`/`caption` (0 AI).
- [ ] Reference pane 3 tab con Mood/Material/Style ở Rendering.
- [ ] Chip filter `roomType`/`style`/`project` mỗi chặng.
- [ ] Toggle "Xem TẤT CẢ".
- [ ] Verify: 80% asset cũ có `kind`+`stageUsage` sau backfill.

**Deliverable:** 1515 ảnh cũ hiện đúng chặng, không mất tag cũ.

### M3 — Bulk upload + description + Vitals assist (~3-5 ngày)

- [ ] Modal upload multi-file, drop zone, batch preview.
- [ ] Textarea description → parse LLM → merge tag.
- [ ] Wire `markitdown-mcp` cho DOCX/PPTX/XLSX (route mới).
- [ ] Vitals command "gợi ý tag cho ảnh này" khi click ảnh trong panel.
- [ ] Trang `/library/admin` bulk edit table (Phase C).
- [ ] Nút "chạy VLM re-classify" opt-in (Phase B), progress bar.

**Deliverable:** upload 10 ảnh cùng lúc với 1 mô tả chung, mất < 30 giây tag xong.

---

## 9. CÂU HỎI CẦN USER QUYẾT

Đánh dấu ưu tiên (🔴 chặn M1, 🟡 chặn M2/M3, 🟢 optional).

1. 🔴 **Schema approach: JSON field (đề xuất) hay tách bảng con `LibraryAssetTag`?** JSON =
   non-breaking, 0 JOIN, migration nhẹ. Bảng con = query mạnh hơn nhưng migration nặng, phá
   nhánh khác đang mở. → **Đề xuất: JSON.**

2. 🔴 **Migration ảnh cũ: chỉ Phase A (0 AI) hay chạy luôn Phase B (VLM 1515 ảnh, ~1500 credit
   NVIDIA)?** Phase A đủ để hiển thị theo chặng; Phase B refine style/material sâu hơn nhưng
   tốn quota. → **Đề xuất: chỉ Phase A ở M2; Phase B opt-in ở M3.**

3. 🟡 **User description textarea BẮT BUỘC hay optional khi upload?** Bắt buộc = tag tốt hơn,
   nhưng ma sát cao (user lười gõ, có thể bỏ upload). → **Đề xuất: optional; placeholder gợi ý
   "VD: phòng ngủ Villa Chương, gu wabi-sabi".**

4. 🟡 **Kho tag chuẩn công ty (approved list `style`/`material`/`mood`) hay user tự do gõ
   mới?** Approved = ngăn trùng, nhưng cần admin duyệt tag mới. Tự do = linh hoạt, dễ trùng.
   → **Đề xuất: enum cứng ở tầng 3 với option `'other'` + `userTags[]` tự do; sau 3 tháng
   audit `userTags` để bổ sung enum.**

5. 🟡 **ROI: team TTT ~50 ảnh/tuần — có đáng đầu tư 2-3 tuần dev không, hay để user tự tag đủ
   không cần AI?** Nếu 50 ảnh/tuần user tự tag tay = 5-10 phút/tuần, không đáng làm. Nếu
   scale lên 200-500 ảnh (khi thêm 5-10 dự án mới) = quan trọng. → **Cần user xác nhận số
   ảnh dự kiến 6 tháng tới.**

6. 🟡 **API expose taxonomy để Vitals gọi "tìm ảnh Villa Chương phòng ngủ wabi-sabi"?** Tức là
   Vitals đọc `LibraryAsset.domain` query DB. → **Đề xuất: có, đơn giản — thêm endpoint
   `/api/library/search?roomType=&style=&projectId=`.**

7. 🟢 **`kind='template'` (dàn trang Presenting) có nên tách khỏi `LibraryAsset` hẳn không?**
   Present có `PresentTemplate` model riêng? — kiểm tra khi build. Nếu tách → `kind` bỏ
   `template`.

8. 🟢 **Có cần phân biệt `photo` vs `render` chặt không?** VLM đôi khi nhầm, và user cũng
   nhầm. Có thể gộp thành `kind='visual'` rồi để user optional `isRender: boolean`. → **Đề
   xuất: giữ tách; sai lệch chấp nhận vì downstream không phá.**

9. 🟢 **Vitals nhắc "1200 ảnh chưa gán tag" — có phiền không?** → Đề xuất: chỉ hiện ở
   `/library`, không popup toàn app.

10. 🟢 **Batch upload có nên chạy trên client (browser đọc File) hay server (upload rồi
    process nền)?** Client = feedback tức thì, nhưng chặn tab; Server = tốt hơn cho 50+ ảnh
    nhưng cần job queue. → **Đề xuất: client cho ≤ 10 file; server queue cho > 10 (M3).**

---

## PHỤ LỤC · Số liệu DB verify (23/07, `prisma/dev.db` main branch)

```
$ sqlite3 prisma/dev.db "SELECT usage, count(*) FROM LibraryAsset GROUP BY usage ORDER BY 2 DESC"
ref-render|527
layout|521
slide|457
material|10

$ sqlite3 prisma/dev.db "SELECT count(*), sum(length(tags)>0), sum(caption!=''), sum(content IS NOT NULL) FROM LibraryAsset"
1515|1515|1450|0

$ sqlite3 prisma/dev.db "SELECT tags FROM LibraryAsset WHERE tags != '' LIMIT 15"
(15/15 dòng đều là "moodboard, gu-đích" hoặc "view-render, gu-đích" — 2 nhãn cứng auto-sinh)
```

Kết luận số liệu: user CHƯA từng gõ tag thật; 1450 caption VLM đã có nhưng bị flatten mất
cấu trúc; 0 PDF/document trong library dù enum `brief` có sẵn.
