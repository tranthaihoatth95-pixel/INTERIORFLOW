# SPEC — CỔNG NỐI CÓ KIỂU · "TURN INTO" · NODE INSPECTOR NHẸ (chặng 2 · node-canvas Dựng ảnh)

> **COWORK-DỰNG · 04/08/2026.** Kế thừa `NGHIEN-CUU-NODE-CANVAS-DOITHU-2026-08-02.md` (pattern #2, #3, #4) +
> `SPEC-CHANG2-UI-2MODE.md`. Phạm vi: node-canvas chặng 2 mode **Render** (KHÔNG phải Vẽ 3D — xem
> `SPEC-DUNG-CAMERA.md` cho mode đó) — `components/FlowCanvas.tsx`, `components/nodes/*`, `lib/nodes/*`,
> `lib/execution.ts`, `lib/types.ts`. Đây là spec **NGHIỆP VỤ**; code do PHU/G4 làm (Cowork không đụng `lib/`/`components/`).

---

## §0 · XÁC MINH HIỆN TRẠNG TRƯỚC KHI SPEC — theo §0b (SEARCH trước khi quyết)

Bài NC gốc (02/08) chấm 3 pattern cho IF. Đọc lại code thật (04/08) thì **1 trong 3 đã xong**, KHÔNG còn là đề xuất:

| # | Pattern (bài NC) | Nhãn bài NC 02/08 | Thực tế code 04/08 |
|---|---|---|---|
| 2 | Cổng nối CÓ KIỂU | "✅ thêm" (đề xuất) | ✅ **ĐÃ SỐNG** — xem §0.1. Bài NC lỗi thời — đề nghị TỔNG sửa 1 dòng trong `00-CHOT.md`/README để phiên sau khỏi định làm lại (đúng bài học mở đầu `SO-KIEM-TONG.md`: "01/08 Cowork ba lần thiết kế lại thứ đã có sẵn"). |
| 4 | "Turn into" | "✅ adopt" | ⬜ **CHƯA có** — xác nhận đúng, xem §0.2 (có 1 tiền lệ hẹp tái dùng được). |
| 3 | Node Inspector (panel phải) | "🔵 adapt" | ⬜ **CHƯA có cho node-canvas** — xem §0.3 (Inspector khác tồn tại nhưng thuộc hệ CAD chặng 1, không đụng được). |

### §0.1 · Cổng có kiểu — dẫn chứng ĐÃ SỐNG
- `components/FlowCanvas.tsx:297-311` — hàm `isValidConnection` (truyền vào `<ReactFlow isValidConnection={isValidConnection}>` dòng 507): so `outPort.dataType !== inPort.dataType` → chặn nối + `setConnectError()` báo lỗi rõ tên 2 port + 2 kiểu.
- `components/nodes/InteriorNode.tsx:331-362` — mỗi `<Handle>` input/output tô màu theo `DATA_TYPE_COLORS[port.dataType]`, `title` hiện `"${label} · ${dataType}"` (hover thấy kiểu ngay).
- `lib/types.ts:1,123-129` — `DataType = 'image' | 'text' | 'mask' | 'number' | 'video'` + bảng màu `DATA_TYPE_COLORS`.

**Việc CÒN THIẾU thật sự** (spec này chỉ vá đúng phần thiếu, không xây lại phần đã có):
1. `dataType: 'number'` **có khai báo, 0 node nào dùng** (grep `dataType: 'number'` trong `lib/` = 0 kết quả) — mọi tham số số hiện là slider tĩnh trên thân node (`ParamDef kind:'slider'`), không nối được từ node khác. Bài NC ghi "params" là 1 trong 4 kiểu cổng cần có (ảnh/mask/**vật liệu**/**params**) — cả hai đều chưa tồn tại thật.
2. `dataType: 'material'` (vật liệu) — **không tồn tại** trong union. Vật liệu hôm nay chỉ là free-text param (`ai.materialswap` param `material`, `kind:'text'`, `lib/nodes/registry.ts:571-593`) hoặc `matId` rời rạc trong hệ Thư viện/ATLAS, hai thứ không nói chuyện với nhau qua đồ thị node.
3. Không có phản hồi thị giác **lúc đang kéo dây** (chỉ chặn lúc THẢ) — xem §1.3.

### §0.2 · "Turn into" — chưa có, nhưng có 1 tiền lệ hẹp nên tái dùng
`components/nodes/NodeExtras.tsx:259-291` hàm `SendToPresent`: sau khi node `slide.*` chạy xong, hiện nút "Đưa sang Presenting →" — bấm 1 cái là `stashPresentHandoffWithIds()` rồi điều hướng `/present-editor`. Đây CHÍNH LÀ dạng hẹp của "turn into" (biến 1 output thành input cho bước khác), chỉ khác: đích là **route khác** (handoff), không phải **node mới trong cùng đồ thị**. §2 dưới đây gộp 2 dạng vào cùng 1 cơ chế, KHÔNG xoá `SendToPresent` — chỉ đổi chỗ nó xuất hiện (từ nút riêng thành 1 mục trong danh sách "Biến thành…").

### §0.3 · Node Inspector — chưa có cho node-canvas
Grep `NodeInspector|SelectionInfoPanel` trong `components/` ra 4 file, cả 4 đều thuộc hệ **CAD chặng 1** (`CadStageScreen.tsx`, `CadEditor.tsx`, `CadInspectorPages.tsx`, `RevitSummaryPanel.tsx`) — đọc `useCadStore` (entity CAD), không đụng được `useFlowStore` (node đồ thị). `components/nodes/NodeExtras.tsx` đã hiện chi tiết đặc thù NGAY TRONG THẺ node (video player, so sánh A/B, palette màu, nút OBJ/FBX, `TierBadge`…) — đây là **cái đang tốt, giữ nguyên** (§0d SO-KIEM-TONG) — Inspector mới ở §3 **bổ sung** (xem nhiều node cùng lúc / node đang zoom nhỏ), **không thay thế** NodeExtras.

---

## §1 · CỔNG CÓ KIỂU — phần bổ sung (additive, không phá node cũ)

### 1.1 · Thêm `DataType: 'material'`
```ts
// lib/types.ts — additive, KHÔNG đổi thứ tự cũ (tránh lệch mọi chỗ so sánh theo index)
export type DataType = 'image' | 'text' | 'mask' | 'number' | 'video' | 'material';

export const DATA_TYPE_COLORS: Record<DataType, string> = {
  image: '#8b7cf7',
  text: '#38bdf8',
  mask: '#f59e0b',
  number: '#34d399',
  video: '#fb7185',
  material: '#c79a63', // ĐỀ XUẤT (tông đất/đồng — 5 màu hiện có đã kín phổ mát/lạnh, vật liệu cần tách bạch).
                        // COWORK-UI/CHINH CHỐT mã cuối theo token thật (`app/globals.css`) trước khi code — đây chỉ là gợi ý hex tạm.
};
```
`PortValue` khi `dataType:'material'` → `value` = **matId string** (khoá tham chiếu record thật trong ATLAS/Thư viện — **KHÔNG nhúng nguyên object** vào port, đúng nguyên tắc port nhẹ đã áp cho `mask`/`image` là data-URI/URL chứ không phải blob object).

**Node mới — `input.material`:**
| Field | Giá trị |
|---|---|
| `type` | `'input.material'` |
| `title` | "Chọn vật liệu · Pick Material" |
| `category` | `'INPUT'` |
| `outputs` | `[{ id: 'material', label: 'Vật liệu', dataType: 'material' }]` |
| `params` | `[]` (chọn qua nút mở sheet, không qua param tĩnh) |
| `creditCost` | `0` |
| hành vi nút | gọi lại **nguyên hàm đã có** `openLibrarySheet({ shelfId: 'common-atlas' })` (`lib/library/use-library-sheet`, đã dùng ở `components/render-studio/Command3DPanel.tsx:144`) — **không viết picker vật liệu mới lần 2**. Node giữ `matId` đã chọn trong 1 param ẩn nội bộ (kiểu `params.matId`) để hiện lại đúng lựa chọn khi mở node cũ. |

**Sửa `ai.materialswap` (`lib/nodes/registry.ts:562-594`) — additive:**
- Thêm input port tuỳ chọn: `{ id: 'material', label: 'Vật liệu (Thư viện)', dataType: 'material' }`.
- Giữ nguyên param `material` (text) làm **fallback** — không xoá, không bắt buộc đổi cách dùng cũ.
- `execute()`: nếu `inputs.material` có giá trị → resolve `matId` thành tên/mô tả thật rồi build prompt từ đó; không có → dùng `String(params.material)` như hiện tại.
- ⚠️ **Chưa verify**: hàm thuần "matId → tên/mô tả vật liệu" (không phải React hook, gọi được trong `execute()`) **chưa rõ đã có sẵn hay chưa** — `useMaterials()` (`lib/render-studio/use-materials.ts`, dùng ở `Command3DPanel.tsx:19,128`) là **React hook**, không gọi thẳng trong `NodeDefinition.execute()` được. PHU cần thêm 1 hàm thuần kiểu `getMaterialById(matId): MaterialRecord | null` tách từ cùng nguồn dữ liệu `useMaterials` đọc, hoặc xác nhận đã có hàm tương đương — đây là điểm CẦN PHU XÁC NHẬN, Cowork chưa đọc `lib/render-studio/use-materials.ts` đủ sâu để khẳng định.
- Cùng cách áp cho `ai.localedit` (`lib/nodes/defs/render-v2.ts:426-519`, chế độ AI inpaint) — port `material` tuỳ chọn thay prompt tay khi người dùng có sẵn vật liệu thư viện.

### 1.2 · Dùng thật `DataType: 'number'` — param → port (v1, phạm vi hẹp có chủ đích)
**KHÔNG** làm cơ chế "bấm nút biến MỌI slider thành port" (dynamic ports theo từng instance node) — lý do: `def.inputs`/`def.outputs` hiện là **mảng tĩnh** đọc trực tiếp ở nhiều nơi (`FlowCanvas.tsx:305-306`, `InteriorNode.tsx:331,347`, `execution.ts:84`); biến ports thành động theo dữ liệu từng node là đổi kiến trúc, rủi ro cao, ngoài phạm vi 1 spec nghiệp vụ.

**Làm bản RẺ, additive, đúng luật "code được ngay":** thêm **1 input port `number` cố định** (không toggle) cho ĐÚNG các param đắt giá nhất (khách hay muốn lái bằng 1 node khác, ví dụ node "Biến thiên hàng loạt" `batch-variants.ts` bơm nhiều giá trị guidance để so sánh):

| Node | Param muốn portable | Port mới |
|---|---|---|
| `ai.sketch2render` (`registry.ts:289-326`) | `guidance` (slider 1–20) | `{ id: 'guidance', label: 'Guidance (tuỳ chọn)', dataType: 'number' }` |
| `ai.clay2render` (`registry.ts:328-366`) | `preserve` (slider 1–20) | `{ id: 'preserve', label: 'Bám khối (tuỳ chọn)', dataType: 'number' }` |
| `ai.styletransfer` / `ai.emptystaging` (`registry.ts:397-423, 368-395`) | `strength` | `{ id: 'strength', label: 'Strength (tuỳ chọn)', dataType: 'number' }` |

`execute()` đổi 1 dòng mỗi node: `Number(inputs.guidance?.value ?? params.guidance)` thay vì `Number(params.guidance)` — **backward-compatible tuyệt đối** (không nối gì thì hành vi y hệt hôm nay).

⚠️ **Đánh đổi phải nói rõ:** thêm port tĩnh = node LUÔN hiện thêm 1 handle dù không dùng (chiều cao thân node tính theo `Math.max(inputs.length, outputs.length) * PORT_GAP`, `InteriorNode.tsx:303-305` — mỗi port thêm = +26px). Vì vậy CHỈ áp cho 3 node bảng trên (nhu cầu rõ nhất từ node Biến thiên hàng loạt), không rải đại trà toàn bộ ~15 slider hiện có. Muốn mở rộng thêm node nào → viết phiếu riêng, đừng tự ý.

### 1.3 · Phản hồi thị giác lúc ĐANG KÉO dây (thiếu, đáng thêm)
Hiện tại `isValidConnection` chỉ có tác dụng lúc **THẢ** — trong lúc kéo dây, không port nào đổi màu để báo "chỗ này ăn khớp, chỗ kia không". Thêm:
1. Bắt sự kiện `onConnectStart` của `<ReactFlow>` (đã có `onConnect`/`isValidConnection` truyền props ở `FlowCanvas.tsx:502-507`, thêm 1 handler cùng chỗ) → đọc `dataType` của port đang kéo ra (qua `getDefinition(...).outputs`) → lưu vào 1 field mới trong `useFlowStore`, ví dụ `draggingDataType: DataType | null`.
2. `onConnectEnd` → set lại `null`.
3. `InteriorNode.tsx` mỗi `<Handle>` input: khi `draggingDataType` khác `null`, thêm style — cùng kiểu = viền sáng/scale nhẹ (theo `SPEC-HOVER-FOCUS-IDF` mức "chip 1.04"), khác kiểu = `opacity: 0.35`. Thuần CSS/inline-style đổi theo 1 giá trị store, không tính lại `isValidConnection`.

### 1.4 · Bảng field/kiểu dữ liệu tổng hợp (cho PHU code thẳng)
| Thay đổi | File | Loại |
|---|---|---|
| Thêm `'material'` vào `DataType` + màu | `lib/types.ts` | sửa union (additive) |
| Node `input.material` | `lib/nodes/defs/<file mới>.ts` (theo cơ chế barrel `defs/index.ts`) | mới |
| Port `material` tuỳ chọn trên `ai.materialswap`, `ai.localedit` | `lib/nodes/registry.ts`, `lib/nodes/defs/render-v2.ts` | sửa additive |
| Port `guidance`/`preserve`/`strength` tuỳ chọn (bảng §1.2) | `lib/nodes/registry.ts` | sửa additive |
| `draggingDataType` state + `onConnectStart`/`onConnectEnd` | `lib/store.ts`, `components/FlowCanvas.tsx` | mới |
| Style Handle theo `draggingDataType` | `components/nodes/InteriorNode.tsx` | sửa additive |

---

## §2 · "TURN INTO" — pattern mới, gộp cả node-mới lẫn handoff

### 2.1 · Định nghĩa dữ liệu (đề xuất `lib/nodes/turn-into.ts`, file mới — PHU đặt đúng vùng `lib/nodes/`)
```ts
export type TurnIntoAction =
  | { kind: 'create-node'; targetDefType: string; targetInputPort: string }
  | { kind: 'handoff'; route: string }; // vd '/present-editor' — tái dùng stashPresentHandoffWithIds

export interface TurnIntoSuggestion {
  action: TurnIntoAction;
  label: string;      // "→ Phóng to", "→ Ảnh thành Video", "Đưa sang Presenting →"
  priority: number;   // số nhỏ hiện trước; phần dư dồn vào "Xem thêm"
}

/** Quét NODE_DEFINITIONS tìm node có input port CÙNG dataType với `sourceDataType`,
 *  loại chính `sourceDefType`. KHÔNG hard-code danh sách — bảng CURATED_PAIRS chỉ set priority. */
export function suggestTurnInto(sourceDataType: DataType, sourceDefType: string): TurnIntoSuggestion[];
```

### 2.2 · Hành vi bấm
- **`create-node`**: tạo 1 node mới (`targetDefType`) đặt lệch phải node nguồn (offset x+300, cùng y — trùng layout convention hiện có khi kéo từ `NodeLibraryPanel`) → tự nối 1 edge nguồn.output → mới.`targetInputPort` → node mới ở trạng thái `idle`, **KHÔNG tự chạy** (không tự trừ credit — người dùng bấm ▶ khi sẵn sàng, đúng nguyên tắc "nói giá trước khi tiêu tiền" đã ghi ở `lib/execution.ts:260-265`).
- **`handoff`**: giữ NGUYÊN hành vi `SendToPresent` hiện tại (`NodeExtras.tsx:259-291`) — chỉ đổi CHỖ nút xuất hiện (gộp vào danh sách "Biến thành…" thay vì đứng riêng).

### 2.3 · Danh sách gợi ý ưu tiên (CURATED_PAIRS, theo NGHIÊN CỨU + nghiệp vụ nội thất — đầu vào `priority`)
| Từ node (output `image`) | Gợi ý ưu tiên cao | Vào "Xem thêm" |
|---|---|---|
| `ai.sketch2render` / `ai.clay2render` / `ai.styletransfer` / `ai.exterior` | → Phóng to (`ai.upscale`) · → Ảnh thành Video (`ai.image2video`) · → Cắt nền (`ai.removebg`) | → Đổi ánh sáng (`ai.relight`) · → Đổi vật liệu (`ai.materialswap`) |
| `ai.moodboard` (4 ảnh) | → Bảng màu (`util.palette`) · → Ghép moodboard (`out.moodboard`) | → Xuất board (`out.board`) |
| `slide.composer` | Đưa sang Presenting → (handoff) | → Xuất deck (`slide.deck`) |
| bất kỳ node `image` khác | → So sánh ảnh (`util.compare`) | (theo dataType quét tự động) |

Trần hiện **4 nút hàng đầu**, còn lại gộp `▾ Xem thêm` — tránh rối (đúng luật §0c UI cảm ứng: nút hiện sẵn ≥44px, không giấu sau hover).

### 2.4 · Vị trí UI
Dải nút nằm ngay dưới phần OUTPUT hiện có trong `NodeExtras.tsx` (dưới `OutputImage`/`OutputVideo`, cùng chỗ `SendToPresent` đang đứng hôm nay) — chỉ hiện khi `run.status === 'done'`.

---

## §3 · NODE INSPECTOR NHẸ

### 3.1 · Vị trí — tái dùng cơ chế panel thò thụt đã chốt
KHÔNG dựng khung panel mới. Dùng chung **Rollout** đã chốt ở `SPEC-PANEL-ROLLOUT-IDF` (tiêu đề=toggle, grip kéo, thu về dải mỏng có nhãn) — neo dải phải của canvas Render, cùng họ với Inspector CAD bên chặng 1 nhưng đọc `useFlowStore.selection` thay vì `useCadStore.selection`.

### 3.2 · Hiện khi nào
Đúng 1 node đang chọn trên Flow canvas (`nodes.filter(n => n.selected).length === 1`). Chọn 0 hoặc >1 node → Inspector ẩn hoặc hiện dòng "Chọn 1 node để xem chi tiết" (không phải lỗi, theo khuôn trống `SPEC-NGON-NGU-CHI-DAN`).

### 3.3 · Nội dung tối thiểu (nhẹ = KHÔNG phải tool window)
| Khối | Nguồn dữ liệu | Ghi chú |
|---|---|---|
| Tiêu đề + icon | `def.title`, `nodeIconFor(defType)` (đã có, `NodeIcons.tsx`) | tái dùng |
| Danh sách input/output | `def.inputs`/`def.outputs` + có/chưa nối (quét `edges`) | mới — hiện dataType kèm chấm màu `DATA_TYPE_COLORS` |
| Bảng params hiện tại | `node.data.params` | chỉ ĐỌC, có nút "Sửa trên node" scroll-to-node (không sửa trùng UI với thân node, tránh 2 nơi cùng ghi 1 giá trị) |
| Credit cost | `def.creditCost` | tái dùng số đã có |
| Trạng thái chạy gần nhất | `node.data.run.status/progress/error` | tái dùng |
| Badge `_tier` (nếu có) | `outputs._tier` | **tái dùng nguyên `TierBadge`** (`NodeExtras.tsx:297-311`) — import lại, KHÔNG viết lại |

### 3.4 · Quan hệ với NodeExtras
Inspector **bổ sung**, không thay thế: NodeExtras vẫn hiện trong thẻ node như hôm nay (video player, so sánh A/B…) — Inspector hữu ích khi canvas zoom nhỏ hoặc cần xem nhiều node khác nhau liên tục mà không phải zoom tới từng cái.

---

## §4 · NGHIỆM THU §0c (3 mảng bắt buộc — thiếu 1 = 🔴 theo `SO-KIEM-TONG.md` §0c)

1. **Phím tắt**: Esc đóng Inspector (cùng họ `lib/useDismissable.ts` đã có). Phím mở nhanh "Turn into" trên node đang chọn — **CHƯA CHỐT phím cụ thể**, đề COWORK-VẼ/CHINH gán qua sổ lệnh `lib/commands/registry.ts` (tránh đụng phím đã dùng: B/I/⌘\\/⌘1-3/L…).
2. **Lệnh tương tác**: kéo dây có phản hồi tức thời (§1.3); dải nút "Turn into" điều hướng được bằng Tab + Enter (`:focus-visible` theo chuẩn đã áp toàn app).
3. **UI cảm ứng**: nút "Turn into" cỡ chạm ≥44px (`--tap`), LUÔN hiện sau khi node done — không dựa hover (đúng cấm hover-only đã ghi ở `SPEC-HOVER-FOCUS-IDF` §3.7).

---

## §5 · CHƯA LÀM / CẦN CHỐT THÊM (trung thực §0)
- Mã màu `'material'` (`#c79a63`) là **đề xuất tạm**, chưa đối chiếu token thật trong `app/globals.css` — COWORK-UI/CHINH chốt trước khi code.
- Hàm thuần "matId → mô tả vật liệu" dùng trong `execute()` — **chưa xác nhận** đã tồn tại hay cần viết mới (xem cảnh báo ở §1.1).
- Phím tắt "Turn into" — chưa gán.
- Cơ chế "toggle param↔port" (dynamic) — cố tình BỎ QUA ở v1 (rủi ro kiến trúc cao), chỉ ghi lại ở đây để không ai vô tình làm lại việc đã cân nhắc và loại bỏ.
