# NGHIÊN CỨU · Cầu nối Vật liệu Larkbase ↔ Hatch CAD ↔ Rendering — InteriorFlow

> **Trạng thái: ĐỀ XUẤT, CHƯA THỰC THI.** Tài liệu này KHÔNG kèm thay đổi schema/API/node nào.
> Mọi khối code bên dưới là **mẫu minh hoạ**, chưa áp vào repo.
>
> Nhánh: `feat/research-material-bridge` · Ngày: 2026-07-20 · Mọi khẳng định về code đã verify bằng đọc file thật; mục Larkbase đã verify bằng gọi MCP thật (không đoán).

---

## Mục lục

0. Tóm tắt cho người bận
1. Hiện trạng đã verify (hatch · Gu Engine · Library/Reference · Node Rendering · AI providers · Larkbase MCP)
2. Data model — vật liệu Larkbase ↔ InteriorFlow
3. Gắn vật liệu vào hatch (CAD)
4. Cầu nối CAD → Rendering (material map)
5. Furniture pick — cơ chế ML đề xuất
6. Trích xuất vật liệu từ ảnh phối cảnh (feedback loop)
7. Moodboard generate — nối dữ liệu vật liệu + gu
8. Rủi ro & giới hạn
9. Phân kỳ đề xuất (M1/M2/M3)
10. Câu hỏi cần chủ dự án quyết

---

## 0. TÓM TẮT CHO NGƯỜI BẬN

**Larkbase ĐÃ kết nối được qua MCP (`mcp__lark-base__list_tables` gọi thành công) nhưng base đang trỏ tới KHÔNG phải kho vật liệu** — 2 bảng thấy được là "Chi tiết công việc" (task tracker) và "Nhân sự" (HR), thuộc 1 workspace quản lý dự án khác. **Chưa có bảng vật liệu nào để đọc** — xem §1.6 và câu hỏi Q1.

Ba phát hiện nền tảng cho toàn bộ kiến trúc phía dưới:

| # | Phát hiện | Ý nghĩa |
|---|---|---|
| 1 | `HatchEntity` (`lib/cad/model.ts:167-183`) chỉ có `points/solid/pattern/patternScale/patternAngle` — **0 field vật liệu**. Hatch hôm nay là **hình học thuần**, không mang metadata gì. | Phải thêm field mới, không có gì để tái dùng (giống mẫu hình đã gặp ở `RESEARCH-ACCESS-CONTROL.md §1.2` với `Project.stage`) |
| 2 | Cơ chế học "gu" (`PairwisePerceptron` + `feature-dict.ts`) đã **CHỦ Ý chừa chỗ** cho furniture: comment `feature-dict.ts:18` khai báo namespace `op:*` (đặt chỗ CAD) — mô hình pairwise + feature vector thưa là **đúng cơ chế** cho "furniture pick theo gu", chỉ cần thêm namespace `furn:*` và 1 instance model riêng, không cần phát minh thuật toán mới | Tiết kiệm đáng kể — không "làm hai lần" |
| 3 | `nvidia.ts::captionImage()` đã trả về ĐÚNG shape `{caption, style, materials[], room}` từ ảnh — nhưng hiện chỉ gọi cho auto-caption ảnh Reference (`app/api/vision/caption`), **chưa bao giờ chạy trên ảnh render thật** để làm vòng phản hồi "khớp gu tới đâu" | Hạ tầng VLM đã có sẵn 90% việc trích xuất vật liệu từ phối cảnh — việc còn lại là gọi nó ở chỗ khác + lưu kết quả |

Khuyến nghị kiến trúc 1 câu: **Larkbase là nguồn chân lý PULL-ONLY** → mirror vào 1 bảng Prisma mới `MaterialRef` (cache, lưu-theo-tham-chiếu như nguyên tắc đã có với ảnh Reference) → `HatchEntity.materialRefId` tham chiếu tới đó → khi render, gộp vật liệu đang hatch thành **prompt injection** kiểu `guToPrompt()` (rẻ, không cần hạ tầng mới) làm M1/M2, để dành **segmentation ControlNet thật** (vùng nào vật liệu gì, pixel-chính-xác) làm M3 sau khi có hạ tầng compute đủ mạnh (`RESEARCH-COMFYUI-LESS.md`).

---

## 1. HIỆN TRẠNG ĐÃ VERIFY

### 1.1 Hatch CAD — hình học thuần, không mang vật liệu

`lib/cad/hatch.ts` (336 dòng) làm đúng 2 việc, cả hai đều THUẦN HÌNH HỌC:

1. `traceHatchBoundary()`/`findHatchBoundary()` — dò biên vùng kín từ pick-point bằng DCEL half-edge thật (không phải "rẽ góc nhỏ nhất" đoán mò — file đã ghi rõ lý do đổi thuật toán ở comment đầu file, tránh lỗi tại đỉnh chữ T bậc ≥4).
2. `hatchLines()`/`hatchDots()` — sinh đoạn thẳng pattern ANSI31/ANSI32/ANSI37/DOTS phủ lên polygon.

Kết quả đi vào `HatchEntity` (`lib/cad/model.ts:167-183`):

```ts
export interface HatchEntity extends Base {
  type: 'hatch';
  points: Pt[];
  solid?: boolean;
  pattern?: HatchPattern;      // 'SOLID'|'ANSI31'|'ANSI32'|'ANSI37'|'DOTS'
  patternScale?: number;
  patternAngle?: number;
}
```

**Không có `materialId`, `color` override, `sku`, hay bất kỳ field ngữ nghĩa nào.** `Layer` (`model.ts:33-46`) cũng vậy — chỉ `{id,name,color,visible,locked,lineweight,lineType}`. Layer trong app này **không theo quy ước tên cố định kiểu "FLOOR"/"WALL"** — layer do người dùng tự tạo/đặt tên tự do (không tìm thấy `DEFAULT_LAYERS` hay hằng số layer nào trong `lib/cad/store.ts`), nên **không thể suy vật liệu từ tên layer** — phải gắn trực tiếp lên entity.

### 1.2 Gu Engine — cơ chế trích gu, TÁI DÙNG được cho furniture

`lib/gu.ts` (230 dòng) — nguyên tắc đã chốt (comment đầu file, 07/07): **gu TRÍCH từ Reference, không hardcode**.

- `MATERIAL_TERMS`/`STYLE_TERMS`/`ROOM_TERMS` (`gu.ts:43-83`) — từ điển substring VI+EN, quét `name+tags+caption` của từng `GuAsset`.
- `buildGuProfile()` gộp N ref → 1 `GuProfile{palette, materials, styles, keywords, subject, moods}` — palette gộp bằng **gom cụm LAB (ΔE*76)** (`mergePalette` → `mixPaletteLab`), không phải đếm hex trùng khít.
- `guToPrompt()` biến `GuProfile` thành 1 chuỗi nhồi prompt: `"bedroom interior, japandi · vật liệu: oak, travertine · tông màu: #... · mood: warm-inviting 62%"`.
- `lib/gu/pairwise-perceptron.ts` (`PairwisePerceptron`) — **learning-to-rank THẬT** (không phải mock): online margin-update perceptron trên vector đặc trưng thưa, `ready()` gate theo `minPairs` (degrade về heuristic khi chưa đủ dữ liệu), serialize JSON vào localStorage. **Đã dùng thật** cho gợi ý template Present (`LayoutShelf`, qua `PRESENT_TEMPLATE_MODEL_KEY`).
- `lib/gu/feature-dict.ts` — từ điển feature CHUẨN HOÁ cho **cả 3 chặng**, với 2 namespace đã đặt chỗ sẵn:
  - `op:*` — *"(đặt chỗ CAD) one-hot OperatorType từ classifyOperator/gu-features"* (`feature-dict.ts:47`)
  - `mood:*`, `room:*` — *"(đặt chỗ Render)"* (`:48-49`)

  Đây chính là bằng chứng: kiến trúc sư trước đã **thiết kế sẵn chỗ mở rộng** đúng hướng furniture-pick — chỉ chưa cắm.

### 1.3 Reference/Library — nơi lưu metadata vật liệu hiện tại

`prisma/schema.prisma:113-131` — `LibraryAsset`:

```prisma
model LibraryAsset {
  id String @id @default(cuid())
  userId String
  name String
  category String
  tags String @default("")
  mime String
  path String
  usage String @default("ref-render") // comment ghi: ref-render|slide|material|layout|cad|brief
  palette String @default("")          // JSON string[] hex
  caption String @default("")          // VLM hoặc tay
  content String?                      // chữ bóc PDF (brief)
  w Int @default(0)
  h Int @default(0)
  createdAt DateTime @default(now())
}
```

⚠️ **Lệch nhỏ đã phát hiện:** `lib/refingest.ts:15` khai `RefUsage` gồm **7 giá trị** (`'ref-render'|'slide'|'material'|'layout'|'cad'|'brief'|'furniture'`), nhưng comment tại `schema.prisma:122` chỉ liệt 6 (thiếu `furniture`). Vì field là `String` tự do (SQLite không có enum — lý do y hệt `RESEARCH-ACCESS-CONTROL.md §2.3`), giá trị `furniture` vẫn lưu được bình thường — đây chỉ là **doc-comment lỗi thời**, không phải bug thật, nhưng đáng sửa cùng đợt.

**Không có field `sku`/`vendor`/`price`** trên `LibraryAsset` — khớp đúng nợ kỹ thuật đã ghi ở `STATUS.md`: *"Sprint 3 B1 `meta` giá/vendor/sku trống (chờ dữ liệu)"*. Đây chính là khoảng trống mà Larkbase được kỳ vọng lấp.

`app/api/illustration/route.ts` — cơ chế 3 tầng đã có cho moodboard: **① Reference đã tải** (match theo caption/tag) → **② Openverse CC search** (không cần key) → **③ generate flag** (chỉ khi vẫn thiếu). Đây là **điểm nối tự nhiên** để chèn Larkbase làm tầng ưu tiên cao hơn cả Reference cho vật liệu (xem §7).

`lib/nodes/defs/material-notes.ts` (`util.materialnote`) — **node "thẻ vật liệu" đã tồn tại**, nhưng 100% nhập tay: `name/code/supplier/hex/note` gõ trực tiếp trong panel, không có autocomplete, không link DB nào. **Đây là điểm cắm rõ ràng nhất cho Larkbase** — thay ô nhập tay bằng picker kéo từ `MaterialRef` đã đồng bộ (§2), giữ nguyên node/UI hiện có.

### 1.4 Node Rendering — luồng ảnh đã có, chưa có "material map"

Đọc `lib/nodes/registry.ts` (1037 dòng) + `lib/nodes/defs/*`:

| Node | `type` | Cơ chế | Input vật liệu hiện tại |
|---|---|---|---|
| Moodboard Gen | `ai.moodboard` | text→4 ảnh FLUX schnell | chỉ prompt tay, không đọc gu/vật liệu tự động (nhưng `guRenderPrompt()` đã có sẵn, dùng ở node khác — xem dưới) |
| Clay → Photoreal | `ai.clay2render` | ControlNet **depth**, giữ nguyên hình học 3ds Max, chỉ đổi vật liệu/ánh sáng | **CÓ gọi `guRenderPrompt()`** (`registry.ts:347`) — tự động nhồi gu từ Reference `ref-render` vào prompt |
| Sketch → Render | `ai.sketch2render` | ControlNet **canny** | cũng gọi `guRenderPrompt()` |
| Material Swap | `ai.materialswap` | mask + prompt → inpaint (FLUX Fill) | **prompt vật liệu gõ TAY**, không có picker |
| Furniture Remove/Add | `ai.furniture` | mask + prompt inpaint | gõ tay |
| Gu Reference | `input.guref` | node ĐỘC LẬP — kéo `GuProfile` từ Reference → text, nối vào bất kỳ node nào | 0 credit, đã hoạt động — mẫu hình đúng để làm `input.materialref` (§7) |

`guRenderPrompt()`/`withGu()` (`registry.ts:17-25`) là hàm phụ trợ dùng chung: gọi `fetchGuProfile(['ref-render'])` → `guToPrompt()` → nối vào cuối prompt. **Đây chính là chỗ nối vật liệu Larkbase vào**: thêm 1 hàm `materialsToPrompt()` cùng mẫu hình, gọi song song `guRenderPrompt()`.

### 1.5 AI providers — VLM + ControlNet đã có, segmentation thì chưa

- `lib/ai/providers/nvidia.ts::captionImage()` — VLM (`meta/llama-3.2-11b-vision-instruct` mặc định) nhận ảnh, prompt ép trả JSON `{caption, style, materials[], room}`. Đang gọi DUY NHẤT từ `app/api/vision/caption/route.ts`, dùng để auto-caption ảnh Reference lúc upload. **Chưa từng chạy trên ảnh render đầu ra** của flow.
- `lib/ai/providers/nvidia.ts::generateImage()` hỗ trợ `mode: 'base'|'canny'|'depth'` (đã probe 200 thật, ghi trong `RESEARCH-COMFYUI-LESS.md §4`) — tức ControlNet canny/depth chạy được cả qua NVIDIA free tier, không chỉ ComfyUI local.
- `lib/ai/providers/comfyui.ts` — cơ chế bơm marker `IF_POSITIVE/IF_NEGATIVE/IF_IMAGE/IF_MASK/IF_GUIDANCE/IF_STRENGTH/IF_SCALE/IF_SEED` vào graph JSON tự-host. 4 workflow hiện có (`comfyui/workflows/*.json`): `text2img`, `sketch_canny`, `sketch_flux`, `clay_depth`. **Không có workflow segmentation** (ControlNet-seg) — nghĩa là "material map theo từng vùng pixel" chưa có hạ tầng, phải thêm workflow mới nếu làm (§4.2, §8).

### 1.6 Larkbase — ĐÃ kết nối, SAI workspace (verify thật, không đoán)

Gọi trực tiếp `mcp__lark-base__list_tables` (không tham số) → trả về:

```json
[
  {"name":"Chi tiết công việc","table_id":"tblnjLehkr6DRMJN","revision":58},
  {"name":"Nhân sự","table_id":"tblUvVYG5j70FCTn","revision":4}
]
```

Đọc tiếp `list_fields` từng bảng:
- **"Chi tiết công việc"** — cột: `STT, Công việc, Dự án, Chủ trì(User link), Hỗ trợ, Ngày giao, Deadline, Trạng thái(select: Đang làm/Hoàn thành/Ghi nhận), Số ngày còn lại(formula), Cảnh báo(formula), Ghi chú, Mã DA, Chủ trì(HRM)(link→Nhân sự)`. → **bảng quản lý công việc/tiến độ dự án**, không liên quan vật liệu.
- **"Nhân sự"** — cột: `Tài khoản, Họ tên, Chức danh, Phòng ban, Team Crea(checkbox)`. → **bảng nhân sự nội bộ**.

**Kết luận: MCP Larkbase kết nối THÀNH CÔNG về mặt kỹ thuật (token hợp lệ, API trả dữ liệu thật), nhưng workspace/app đang trỏ tới không chứa bảng vật liệu nào.** Đây có thể là (a) sai app trong cùng Larkbase workspace — cần đổi `app_id`/base ở phía cấu hình MCP, hoặc (b) kho vật liệu **chưa được tạo** trong Larkbase, cần dựng mới. Không tự đoán — xem câu hỏi Q1 (§10). Toàn bộ thiết kế ở §2 dùng cấu trúc GIẢ ĐỊNH hợp lý (mã/tên/NCC/màu/ảnh/giá) vì chưa có bảng thật để soi field name chính xác.

---

## 2. DATA MODEL — VẬT LIỆU LARKBASE ↔ INTERIORFLOW

### 2.1 Pull-only hay 2 chiều — chọn PULL-ONLY

| | **Pull-only** (Larkbase → IF, 1 chiều) ✅ | 2 chiều |
|---|---|---|
| Nguồn chân lý | Rõ ràng: Larkbase | Mơ hồ — 2 nơi có thể sửa cùng field |
| Conflict resolution | Không cần — IF luôn ghi đè bằng bản Larkbase mới nhất | Cần (KTS sửa trên IF, đồng nghiệp sửa trên Larkbase cùng lúc → ai thắng?) |
| Rate limit Larkbase API | Chỉ đọc theo lịch/tay — nhẹ | Ghi liên tục theo hành vi user trong CAD — nặng hơn nhiều, dễ chạm rate-limit |
| Rủi ro hỏng dữ liệu gốc | Thấp — IF không bao giờ ghi vào Larkbase | Cao — bug ở IF có thể phá dữ liệu vật liệu dùng chung toàn công ty |
| Công triển khai | 1 hàm sync + 1 nút bấm | Webhook 2 chiều + hàng đợi + version vector |

**Chọn pull-only cho M1.** Lý do nghiệp vụ: Larkbase là nơi phòng vật tư/NCC quản lý — họ đã có quy trình riêng (thêm mã mới, cập nhật giá). IF là bên **tiêu thụ** dữ liệu đó khi vẽ/render, không phải nơi tạo mã vật liệu mới. Nếu sau này cần "IF tạo mã vật liệu mới rồi đẩy lên Larkbase" (VD: KTS phát hiện vật liệu mới ngoài công trường) — đó là tính năng RIÊNG, làm ở M-sau, dùng `create_record` có kiểm duyệt (không tự động), không lẫn vào luồng sync định kỳ.

### 2.2 Schema Prisma (MẪU — additive, chưa áp)

```prisma
// ══ MỚI ══ Mirror vật liệu từ Larkbase — cache đọc, KHÔNG phải nguồn chân lý.
model MaterialRef {
  id           String   @id @default(cuid())
  larkRecordId String   @unique   // record_id thật bên Larkbase — khoá đối chiếu khi sync lại
  larkTableId  String              // table_id nguồn (đa bảng nếu công ty tách sàn/tường/nội thất)
  code         String              // mã vật liệu (SKU nội bộ NCC)
  name         String
  category     String?             // 'sàn'|'tường'|'trần'|'nội thất'|... — tự do, suy từ cột Larkbase
  vendor       String?
  colorHex     String?
  swatchUrl    String?             // ảnh mẫu — proxy/cache từ Larkbase attachment, KHÔNG base64 vào flow
  priceNote    String?             // text tự do (đơn giá + đơn vị) — chưa chuẩn hoá số, xem §8
  raw          String              // JSON toàn bộ field gốc Larkbase — tương lai-proof, khách thêm cột không cần migrate
  syncedAt     DateTime @default(now())

  @@index([code])
  @@index([larkTableId])
}
```

**Vì sao thêm bảng mới thay vì mở rộng `LibraryAsset`:** `LibraryAsset` là ảnh **user tự tải lên** (lifecycle: upload → dùng → xoá tay), còn `MaterialRef` là **cache đồng bộ định kỳ** từ hệ thống ngoài (lifecycle: sync ghi đè theo `larkRecordId`, không phải user thao tác trực tiếp). Trộn 2 lifecycle vào 1 bảng sẽ làm `usage='material'` cũ (ảnh vật liệu người dùng tự chụp/tải, không có trong Larkbase) và vật liệu chính thức từ NCC lẫn lộn — khó truy vấn "vật liệu nào có mã NCC thật, cái nào chỉ là ảnh tham khảo tay". Field `raw JSON` (giống nguyên tắc `IntegrationAccount` đã dùng ở dự án cho các field-lạ-đa-dạng, xem `docs/INTEGRATIONS.md`) tránh phải `db push` mỗi lần Larkbase thêm cột.

### 2.3 Đồng bộ — script + nút bấm (MẪU)

```ts
// scripts/sync-larkbase-materials.ts (MẪU, idempotent)
// Gọi qua MCP lark-base: list_records(table_id) → upsert theo larkRecordId.
// Field mapping (code/name/vendor/colorHex/...) CẦN xác nhận field_id thật sau khi Q1 có bảng đúng.
async function syncTable(tableId: string) {
  const records = await larkbase.list_records({ path: { table_id: tableId } });
  for (const r of records) {
    await prisma.materialRef.upsert({
      where: { larkRecordId: r.record_id },
      update: { /* map field → cột */ raw: JSON.stringify(r.fields), syncedAt: new Date() },
      create: { larkRecordId: r.record_id, larkTableId: tableId, /* ... */ raw: JSON.stringify(r.fields) },
    });
  }
}
```

M1: chạy tay qua nút "Đồng bộ vật liệu" trong panel Library (gọi 1 API route mới `POST /api/materials/sync`, auth `getSessionUser()` bắt buộc — bài học P0 từ `RESEARCH-ACCESS-CONTROL.md §4.1/§4.2`: MỌI route mới phải có auth từ dòng đầu tiên, không để lọt như `/api/comments`). Cron tự động để M-sau, sau khi đo tần suất Larkbase thực sự đổi dữ liệu.

---

## 3. GẮN VẬT LIỆU VÀO HATCH (CAD)

### 3.1 Field mới trên `HatchEntity` (MẪU)

```ts
// lib/cad/model.ts — HatchEntity (MẪU, additive)
export interface HatchEntity extends Base {
  type: 'hatch';
  points: Pt[];
  solid?: boolean;
  pattern?: HatchPattern;
  patternScale?: number;
  patternAngle?: number;
  // ══ MỚI ══ tham chiếu MaterialRef.id — KHÔNG lưu tên/ảnh/hex trực tiếp (single source of truth
  // vẫn là MaterialRef, sửa giá/tên ở Larkbase rồi sync lại → mọi hatch tự động cập nhật hiển thị).
  materialRefId?: string;
}
```

**Vì sao gắn trên `HatchEntity` chứ không trên `Layer`:** mỗi lệnh H (hatch) đang tạo **1 polygon riêng** theo pick-point (`findHatchBoundary`), không phải theo layer — 2 phòng cùng layer "Sàn" hoàn toàn có thể dùng 2 loại gạch khác nhau (phòng khách đá, phòng ngủ gỗ). Gắn theo layer sẽ ép "1 layer = 1 vật liệu", sai với cách người dùng thực tế vẽ (khớp câu hỏi Q4, §10).

Optional, không phá `.idf`/DXF export cũ — hatch cũ (không `materialRefId`) vẫn hiển thị patternANSI như hôm nay, chỉ là không có vật liệu gắn kèm.

### 3.2 UI chọn vật liệu khi hatch

Panel thuộc tính hatch hiện tại (property panel Render đã ghi ở nợ kỹ thuật là "không undo được") thêm 1 dropdown "Vật liệu" bên cạnh pattern/scale/angle hiện có — nguồn dữ liệu là `MaterialRef` đã sync, lọc theo `category` gần khớp loại layer đang chọn (gợi ý, không ép buộc — layer tên "Sàn" thì ưu tiên hiện `category='sàn'` lên đầu danh sách, nhưng vẫn cho chọn category khác).

### 3.3 Không nhồi ảnh nặng vào flow

Giữ đúng nguyên tắc "lưu-theo-tham-chiếu" đã có trong `lib/refingest.ts` (comment đầu file: *"ảnh gốc KHÔNG nhét base64 vào flow/AI"*). `MaterialRef.swatchUrl` là URL/path nhẹ; `.idf` chỉ lưu `materialRefId` (vài chục ký tự), không lưu ảnh mẫu — khi cần hiển thị/render mới resolve qua `MaterialRef`.

---

## 4. CẦU NỐI CAD → RENDERING (MATERIAL MAP)

### 4.1 M1/M2 — Prompt injection (rẻ, không cần hạ tầng mới)

Cùng mẫu hình `guRenderPrompt()`/`withGu()` đã chạy thật trong `registry.ts`:

```ts
// lib/materials-prompt.ts (MẪU) — song song guToPrompt(), KHÔNG sửa gu.ts
export async function materialsToPrompt(doc: Doc): Promise<string> {
  const ids = [...new Set(doc.entities
    .filter((e): e is HatchEntity => e.type === 'hatch' && !!e.materialRefId)
    .map((e) => e.materialRefId!))];
  if (!ids.length) return '';
  const mats = await prisma.materialRef.findMany({ where: { id: { in: ids } } });
  // gộp theo category để câu prompt đọc tự nhiên: "sàn: đá travertine · tường: sơn xanh nhạt"
  const byCat = new Map<string, string[]>();
  for (const m of mats) {
    const cat = m.category ?? 'vật liệu';
    byCat.set(cat, [...(byCat.get(cat) ?? []), m.name]);
  }
  return [...byCat.entries()].map(([cat, names]) => `${cat}: ${names.join(', ')}`).join(' · ');
}
```

Nối vào `ai.clay2render`/`ai.sketch2render` y hệt cách `guRenderPrompt()` đang được gọi (`registry.ts:347-351`): `withGu(prompt, await materialsToPrompt(doc))`. **0 hạ tầng AI mới** — chỉ là text nối thêm vào prompt đã có ControlNet depth/canny khoá hình học. Đủ tốt cho phần lớn ảnh render 1-phòng-1-góc-nhìn, vì ControlNet depth/canny đã khoá bố cục, prompt chỉ cần mô tả ĐÚNG vật liệu cho AI tô — đây thực chất là cách `ai.clay2render` mô tả chính nó: *"keep exact same geometry... only add realistic materials"*.

**Giới hạn thật:** prompt injection không **định vị không gian** — AI biết "có travertine và gỗ sồi trong ảnh" nhưng không chắc travertine phải ở đúng vùng sàn nào nếu phòng có nhiều loại sàn xen kẽ phức tạp. Với phần lớn ảnh archviz nội thất (1 sàn, 1-2 loại tường), rủi ro này thấp; với mặt bằng nhiều phân khu vật liệu trong 1 khung hình thì cần §4.2.

### 4.2 M3 — Segmentation ControlNet (chính xác theo vùng, cần hạ tầng)

Ý tưởng: render mặt bằng thành **1 ảnh "material map"** — mỗi polygon hatch tô phẳng 1 màu định danh theo `materialRefId` (không phải màu thật của vật liệu, mà màu MÃ HOÁ để ControlNet-seg phân vùng) — rồi dùng làm ảnh điều kiện thay/cùng depth.

Việc cần làm, theo đúng kiểu 2 tầng `graph-inject.ts` mà `RESEARCH-COMFYUI-LESS.md §6` đã đề xuất tách:
1. **Renderer material-map** — tái dùng pipeline vẽ 2D hiện có (`CadCanvas`), thêm chế độ vẽ mới "flat-fill theo `materialRefId`" thay vì pattern ANSI thật — thuần hình học, không cần AI, code nằm cạnh `hatchLines()`/`hatchDots()`.
2. **Workflow ComfyUI mới** `material_seg.json` — hiện **CHƯA có** trong `comfyui/workflows/` (chỉ có canny/depth). Cần custom node ControlNet-seg (vd `comfyui_controlnet_aux` đã xác nhận có trong 2/3 dịch vụ serverless mà `RESEARCH-COMFYUI-LESS.md §5` khảo sát — không phải bắt đầu từ 0).
3. NVIDIA NIM (`nvidia.ts::generateImage`) **không hỗ trợ mode `seg`** (chỉ `base|canny|depth`, đã probe thật) — nhánh M3 chỉ chạy được qua ComfyUI local/serverless, không có lưới đỡ NVIDIA free như M1/M2.

**Khuyến nghị:** M3 chỉ đáng làm SAU khi có nhu cầu thật (mặt bằng nhiều-vật-liệu-trong-1-khung-hình xảy ra thường xuyên) — nêu ở câu hỏi Q7 (§10), tránh xây hạ tầng cho use-case chưa xác nhận.

---

## 5. FURNITURE PICK — CƠ CHẾ ML ĐỀ XUẤT

> Đây là **ĐỀ XUẤT**, chưa có quyết định kiến trúc cuối. Bài toán tách làm 2 tầng độc lập — **retrieval** (lọc ứng viên hợp lý) rồi **rank** (xếp hạng theo gu) — mẫu hình chuẩn cho recommendation khi chưa có embedding model trong stack.

### 5.1 Retrieval — lọc theo mô tả đề bài (rule-based, không cần embedding)

Stack hiện KHÔNG có embedding model nào (không thấy `text-embedding-*`/`nomic`/`bge` trong `lib/ai/`). Thay vì thêm hạ tầng mới, **tái dùng nguyên `pickTerms()`/`pickSubjects()` đã có trong `gu.ts`**: quét mô tả đề bài (từ `LibraryAsset.content` — chữ bóc PDF brief, đã tồn tại) bằng `ROOM_TERMS`/`STYLE_TERMS`/`MATERIAL_TERMS` → tập từ khoá chuẩn hoá → lọc `MaterialRef`/`LibraryAsset(usage='furniture')` có tag/tên/category khớp. Đây CHÍNH XÁC là cơ chế `guToPrompt()` đang làm, chỉ đổi đầu ra từ "chuỗi prompt" sang "tập ứng viên".

Nếu về sau cần khớp ngữ nghĩa tốt hơn (không chỉ substring) — NVIDIA NIM có model embedding miễn phí (`nvidia/nv-embed-v1` và tương tự, cùng hệ sinh thái đã dùng cho `chat()`/`captionImage()`, cùng 1 `NVIDIA_API_KEY`) — nhưng đây là bước NÂNG CẤP sau, không phải điều kiện để bắt đầu M1 furniture-pick.

### 5.2 Rank — tái dùng `PairwisePerceptron` + mở namespace `furn:*`

```ts
// lib/gu/feature-dict.ts (MẪU — nối tiếp namespace đã đặt chỗ, không sửa gì cũ)
export interface FurniturePickContext {
  roomSubject?: string;     // từ GuProfile.subject (đã có, gu.ts)
  guStyles: string[];       // GuProfile.styles
  guMaterials: string[];    // GuProfile.materials
  roomAreaM2?: number;      // từ CAD scene stats (đã có — xem render-v2.ts scene.stats)
}
export function furnitureFeatures(item: FurnitureCandidate, ctx: FurniturePickContext): FeatureVector {
  const f: FeatureVector = {};
  f['furn.styleOverlap'] = jaccardOverlap(item.styleTags, ctx.guStyles);       // 0..1
  f['furn.materialOverlap'] = jaccardOverlap(item.materialTags, ctx.guMaterials);
  if (ctx.roomAreaM2 && item.footprintM2) {
    f['furn.sizeFit'] = clamp01(1 - Math.abs(item.footprintM2 / ctx.roomAreaM2 - item.idealRatio) / item.idealRatio);
  }
  f[`furn.category:${item.category}`] = 1; // one-hot, giống 'shelf:*'/'tpl:*' đã có
  return f;
}
```

Instance **RIÊNG** `PairwisePerceptron` cho furniture (key localStorage mới `interiorflow.gu.perceptron.furniture.v1`, tách khỏi model Present template — 2 bài toán khác nhau không nên chung 1 vector trọng số). UI feedback: nút Nhận/Bỏ y hệt mẫu hình đã thiết kế cho Present (`explainTemplateChoice()` — kèm giải thích "vì sao gợi ý cái này", đã có cơ chế, chỉ cần viết bản `explainFurnitureChoice()` tương tự).

**Vòng đời dữ liệu:** M1 chưa đủ cặp feedback (`ready()` trả false dưới `minPairs=10`) → tự động degrade về heuristic (retrieval §5.1 xếp theo điểm khớp từ khoá) — sản phẩm KHÔNG BAO GIỜ trống rỗng chờ "đủ dữ liệu ML" mới chạy, đúng triết lý `PairwisePerceptron.rank()` đã có.

---

## 6. TRÍCH XUẤT VẬT LIỆU TỪ ẢNH PHỐI CẢNH (FEEDBACK LOOP)

### 6.1 Mở rộng phạm vi gọi `captionImage()`

Hiện `captionImage()` (`nvidia.ts:50-73`) chỉ được gọi từ `app/api/vision/caption/route.ts`, dùng khi **upload** ảnh Reference. Đề xuất thêm 1 điểm gọi thứ 2: sau khi node render (`ai.clay2render`/`ai.sketch2render`/`ai.moodboard`...) trả ảnh xong, **tự động (hoặc nút tay "Phân tích vật liệu")** gọi lại `captionImage()` trên chính ảnh output — vì hàm đã trả sẵn `{caption, style, materials[], room}`, không cần sửa provider, chỉ cần route mới gọi nó ở thời điểm khác.

### 6.2 Chấm điểm "khớp gu tới đâu" — tất định, không cần AI thêm

So khớp `materials[]`/`style` trích được với `GuProfile` đã dùng để sinh prompt ban đầu (bằng CHÍNH `pickTerms()` — không cần gọi AI lần 2 để "chấm điểm AI"):

```ts
// lib/gu/render-feedback.ts (MẪU)
export function guMatchScore(extracted: RefCaption, guUsed: GuProfile): number {
  const matHit = extracted.materials.filter((m) => guUsed.materials.some((g) => norm(m).includes(g))).length;
  const styleHit = guUsed.styles.some((s) => norm(extracted.style).includes(s)) ? 1 : 0;
  const matScore = guUsed.materials.length ? matHit / guUsed.materials.length : 0;
  return Math.round(((matScore + styleHit) / 2) * 100); // 0-100%, tất định, giải thích được
}
```

Lưu kết quả vào 1 log nhẹ (bảng mới `RenderFeedback{flowId, imageUrl, extracted JSON, score, createdAt}` hoặc đơn giản hơn — field JSON trên `FlowVersion` đã có sẵn cơ chế snapshot, xem `RESEARCH-ACCESS-CONTROL.md §6.3`). Mục đích: (a) hiển thị badge "khớp gu 78%" cạnh ảnh render để KTS tự đánh giá nhanh, (b) tích luỹ dữ liệu — về sau nếu muốn model học "prompt nào hay ra ảnh lệch gu" thì đã có log để phân tích, không cần dựng lại từ đầu.

### 6.3 Chi phí — tuân triết lý "CHỈ BÁO, KHÔNG tự tụt"

Mỗi lần phân tích tốn 1 lượt NVIDIA free (VLM). Theo đúng cơ chế `NvidiaFreeExhausted` đã có (`nvidia.ts:19`, dùng nguyên, không viết lại): hết free → báo UI, không tự động chạy tiếp/im lặng bỏ qua. Đề xuất **M2 làm nút bấm tay** (không tự động mỗi render — tránh đốt quota nhanh, xem §8), tự động hoá là quyết định của M-sau khi đã đo tần suất dùng thật.

---

## 7. MOODBOARD GENERATE — NỐI DỮ LIỆU VẬT LIỆU + GU

### 7.1 Node `input.materialref` mới (song song `input.guref`)

```ts
// lib/nodes/defs/material-reference.ts (MẪU) — copy mẫu hình input.guref (gu-reference.ts), đổi nguồn dữ liệu
export const materialReferenceNodes: NodeDefinition[] = [{
  type: 'input.materialref',
  title: 'Material Reference',
  category: 'INPUT',
  description: 'Kéo vật liệu đã đồng bộ từ Larkbase (lọc theo category) → mẩu prompt, nối vào node AI khác.',
  inputs: [],
  outputs: [{ id: 'text', label: 'Material prompt', dataType: 'text' }],
  params: [{ kind: 'select', id: 'category', label: 'Lọc theo loại', options: ['Tất cả', 'Sàn', 'Tường', 'Nội thất', '...'] }],
  creditCost: 0, // đọc DB, không gọi AI — giống input.guref
  async execute({ params }) { /* prisma.materialRef.findMany(...) → gộp thành text */ },
}];
```

0 credit, đúng mẫu `input.guref` (0 credit vì chỉ đọc `/api/library`) — ở đây đổi thành đọc `MaterialRef` đã sync sẵn (không gọi Larkbase trực tiếp mỗi lần chạy node — tránh rủi ro rate-limit §8).

### 7.2 Ưu tiên Larkbase trong `app/api/illustration`

`MOOD_USAGES = new Set(['ref-render', 'slide', 'material'])` (`illustration/route.ts:11`) đã coi `material` là nguồn hợp lệ cho illustration picker. Đề xuất thêm tầng **①.5**: trước khi rơi xuống Openverse, thử match `MaterialRef.swatchUrl` (đã sync, có ảnh mẫu thật từ NCC) theo cùng `scoreMatch()` hiện có — vật liệu thật của công ty ưu tiên hơn ảnh CC ngẫu nhiên trên mạng.

### 7.3 `ai.moodboard` đọc gu VÀ vật liệu cùng lúc

Hiện `ai.moodboard` (`registry.ts:425-447`) CHƯA gọi `guRenderPrompt()` (chỉ nhận `inputs.prompt` tay) — khác với `clay2render`/`sketch2render` đã có. Đề xuất khi làm cầu nối vật liệu, tiện thể vá node này gọi cả `guRenderPrompt()` lẫn `materialsToPrompt()` (§4.1) — nhất quán với 2 node kia, và đúng yêu cầu gốc *"moodboard generate... nối dữ liệu vật liệu+gu vào cơ chế sinh moodboard hiện có"*.

---

## 8. RỦI RO & GIỚI HẠN

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Larkbase API tốc độ/rate-limit khi sync nhiều bảng | Trung bình | Pull-only + cache `MaterialRef` (§2) — app không bao giờ gọi Larkbase trực tiếp lúc render/hatch, chỉ lúc bấm "Đồng bộ" |
| Mac 16GB không kham segmentation/VLM nặng local | Cao (đã có bài học — `interiorflow-comfyui-local-limits`) | M1/M2 dùng NVIDIA free (cloud, nhẹ máy) cho VLM; M3 segmentation nếu làm thì theo hướng serverless đã khảo sát ở `RESEARCH-COMFYUI-LESS.md` (RunPod/Replicate), không chạy local |
| Chi phí AI — bài học fal hết balance, NVIDIA free rate-limit | Trung bình | Giữ nguyên triết lý "CHỈ BÁO KHÔNG TỰ TỤT" đã có; §6.3 đề xuất nút tay thay vì tự động mỗi render |
| `MaterialRef.priceNote` là text tự do, không chuẩn hoá số | Thấp (M1) | Đủ cho hiển thị/prompt; nếu sau này cần tính dự toán tự động (liên quan skill `du-toan-noi-that` đã có) thì cần chuẩn hoá số + đơn vị — NGOÀI phạm vi đợt này |
| `raw JSON` trên `MaterialRef` phình to nếu Larkbase có field đính kèm lớn (ảnh base64 trong field) | Thấp | Strip field kiểu attachment lớn khi lưu `raw`, chỉ giữ URL — cùng nguyên tắc "không vỡ context" của `refingest.ts` |
| 1 hatch = 1 `materialRefId` không biểu diễn được hoạ tiết pha trộn (viền khác sàn) | Thấp, đã biết trước | M1 chấp nhận giới hạn — muốn viền riêng thì vẽ 2 polygon hatch cạnh nhau (đã làm được với hình học DCEL hiện có, không cần field mới) |
| Larkbase hiện KHÔNG có bảng vật liệu (§1.6) | **Chặn khởi động** | Không tự đoán field — chờ Q1 (§10) trước khi viết code sync thật |

---

## 9. PHÂN KỲ ĐỀ XUẤT

| # | Việc | Phụ thuộc | Rủi ro dữ liệu |
|---|---|---|---|
| **M1** | Xác nhận đúng Larkbase base (Q1) → `MaterialRef` schema (`db push`) → script sync tay + nút bấm → `HatchEntity.materialRefId` + UI picker khi hatch → `util.materialnote` thêm nguồn "chọn từ Larkbase" cạnh nhập tay | Q1-Q4 trả lời | Thấp — toàn field mới/optional, giống mẫu additive ở `RESEARCH-ACCESS-CONTROL.md §2.3` |
| **M2** | `materialsToPrompt()` + nối vào `ai.clay2render`/`ai.sketch2render`/`ai.moodboard` · node `input.materialref` · illustration picker ưu tiên Larkbase (§7.2) · VLM material-extraction nút tay + `guMatchScore()` (§6) | M1 xong | Không — chỉ đọc, không sửa dữ liệu hatch/render cũ |
| **M3** | Furniture pick: `furn:*` feature + `PairwisePerceptron` riêng + UI Nhận/Bỏ + retrieval theo brief (§5) | M1 (cần `MaterialRef`/furniture data đã sync) | Thấp — model mới, degrade an toàn khi thiếu dữ liệu |
| **M4 (tuỳ chọn, cần xác nhận nhu cầu — Q7)** | Segmentation ControlNet thật cho material map theo vùng (§4.2) — renderer flat-fill + workflow `material_seg.json` + hạ tầng compute (nối `RESEARCH-COMFYUI-LESS.md`) | M2 + quyết định hạ tầng compute | Trung bình — đụng pipeline render, cần test kỹ trước khi thay ControlNet depth mặc định |

**Việc KHÔNG làm trong đợt này** (nói thẳng, tránh trôi phạm vi — giống cảnh báo `RESEARCH-ACCESS-CONTROL.md §6.4`): đồng bộ 2 chiều Larkbase, tính dự toán tự động từ `priceNote`, embedding model mới, tự động hoá VLM feedback mỗi render.

---

## 10. CÂU HỎI CẦN CHỦ DỰ ÁN QUYẾT

| # | Câu hỏi | Khuyến nghị |
|---|---|---|
| **Q1** | Larkbase base hiện kết nối qua MCP chỉ thấy "Chi tiết công việc" + "Nhân sự" — **không có bảng vật liệu**. Kho vật liệu nằm ở app/base Larkbase nào khác, hay chưa tạo? | Cần xác nhận trước khi viết bất kỳ code sync nào — mọi field mapping ở §2 đang là GIẢ ĐỊNH |
| **Q2** | Nếu bảng vật liệu đã tồn tại: cấu trúc cột thật là gì (tên field chính xác cho mã/tên/NCC/màu/ảnh/giá)? Nếu chưa tồn tại: ai dựng bảng — IF đề xuất cấu trúc hay phòng vật tư tự thiết kế? | Đề xuất IF gửi 1 cấu trúc mẫu (khớp `MaterialRef` §2.2) để phòng vật tư góp ý, tránh áp đặt |
| **Q3** | Đồng bộ Larkbase: nút tay mỗi khi cần, hay cron định kỳ (giờ/ngày)? | **Nút tay cho M1** — đơn giản, 0 rủi ro rate-limit; cron xét sau khi đo tần suất Larkbase thực đổi dữ liệu |
| **Q4** | 1 vùng hatch = đúng 1 vật liệu (như §3.1 giả định), hay cần biểu diễn pha trộn (viền/hoạ tiết khác vật liệu chính trong cùng 1 vùng)? | **1 vật liệu/hatch** cho M1 — viền riêng thì vẽ hatch riêng (hình học đã hỗ trợ), tránh model phức tạp hoá sớm |
| **Q5** | Furniture "gu máy học" (§5.2) học chung 1 model cho cả công ty, hay riêng theo từng KTS (như model Present template hiện tại lưu localStorage — tức RIÊNG THEO TRÌNH DUYỆT, không theo user)? | Cần quyết trước khi chọn nơi lưu (`localStorage` per-browser vs bảng DB per-user) — ảnh hưởng thiết kế lưu trữ, không chỉ thuật toán |
| **Q6** | VLM material-extraction feedback (§6) — chạy tự động mỗi lần render xong, hay chỉ khi KTS bấm nút? Ngân sách quota NVIDIA free cho việc này? | **Nút tay** — tự động mỗi render sẽ đốt quota nhanh, đặc biệt nếu 1 flow render nhiều lần thử trước khi chốt |
| **Q7** | Segmentation ControlNet thật theo vùng (M4, §4.2) — nhu cầu thực tế có đủ lớn để đầu tư hạ tầng mới (workflow + renderer flat-fill + compute ngoài), hay prompt injection (M2) đã đủ cho phần lớn ảnh render 1-góc-nhìn? | Khuyến nghị **hoãn quyết định tới sau M2** — chạy thử prompt injection trên vài dự án thật rồi mới biết có thiếu độ chính xác không |
| **Q8** | `LibraryAsset` doc-comment thiếu `furniture` trong danh sách usage (§1.3, lệch nhỏ) — sửa comment luôn trong đợt M1, hay để riêng? | Sửa cùng M1 (rẻ, 1 dòng comment), không đáng tách task riêng |

---

*Hết. Không có thay đổi code nào kèm theo tài liệu này.*
