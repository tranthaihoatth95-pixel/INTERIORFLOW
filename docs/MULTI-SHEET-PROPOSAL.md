# MULTI-SHEET — Đề xuất kiến trúc (CAD + Present)

> Trạng thái: **PHA 1 đã implement** (tab-model, ≤5 sheet/chặng, đổi tên + kéo sắp xếp tab).
> Kéo-gộp-single-window (tear-off/split) mô tả ở §6 — **để PHA 2**, có khung sẵn.
> Phụ-thêm hoàn toàn: view đơn cũ = deck/doc 1-sheet, đường demo export Present KHÔNG đổi.

## 1. Vì sao & phạm vi

Hiện mỗi chặng chỉ giữ **một tài liệu**:
- **CAD** (`/cad-editor`): 1 `Doc` trong zustand singleton `useCadStore` (doc + past/future + viewport + currentLayer).
- **Present** (`/present-editor`): 1 `EditorDeck` trong hook cục bộ `useEditor(initialDeck)` (deck + undo/redo + selection).

Người dùng thực tế cần mở **nhiều bản vẽ / nhiều deck** cùng lúc (VD: mặt bằng tầng 1 + tầng 2;
deck "concept" + deck "báo cáo"). Yêu cầu: nhiều SHEET/chặng, **tối đa 5** ở giai đoạn đầu,
thanh tab để chuyển, và về sau kéo 1 sheet để gộp/chia cửa sổ (single-window split).

Trục điều hướng lớn **Concept · Render · Present** (StageSwitcher) **giữ nguyên** — multi-sheet là
tầng *bên trong* một chặng, không thay trục chặng.

## 2. Rút gọn từ 4 mô hình tham chiếu (nghiên cứu)

| Sản phẩm | Điều mượn | Điều bỏ |
|---|---|---|
| **Excel sheet tabs** | Thanh tab đáy/đỉnh; **+** thêm; double-click đổi tên; kéo trái/phải sắp xếp; menu chuột phải. Mô hình "mỗi tab = một tài liệu độc lập, undo riêng". | Màu tab, nhóm tab (chưa cần). |
| **Trình duyệt (tab tear-off & merge)** | Kéo 1 tab **ra** → cửa sổ mới; kéo tab **vào** → gộp lại. Chỉ dẫn thị giác vùng thả. | Cửa sổ OS thật (ta chạy trong 1 SPA → "cửa sổ" = pane split, xem §6). |
| **VS Code editor groups / split** | Kéo tab tới **cạnh** khung → tạo split trái/phải/trên/dưới; di tab giữa các group. "Group giữ một tập item, active 1". | Vô hạn group lồng nhau (ta giới hạn 2 pane ở pha 2). |
| **Figma desktop tabs** | Mỗi file = 1 tab có favicon; kéo tab sang cạnh canvas để chia đôi; pin/mute (bỏ qua). | Đa cửa sổ hệ điều hành. |

**Kết luận mô hình:** *tab-model* (Excel) làm xương sống pha 1; *edge-drop split* (VS Code/Figma)
làm cơ chế gộp-single-window pha 2. Tear-off ra cửa sổ OS riêng KHÔNG khả thi trong SPA Next →
thay bằng **split-pane trong cùng một window**.

## 3. State model

### 3.1 Nguyên tắc
- **Không đụng** state-core của mỗi editor. Bọc thêm một tầng "sheets" ở NGOÀI.
- Mỗi sheet = `{ id, name }` + một **snapshot nội dung** serialize được.
- Chuyển tab = **lưu snapshot sheet đang mở → nạp snapshot sheet đích**. Editor bên dưới không biết
  gì về multi-sheet (đúng tinh thần phụ-thêm).

### 3.2 CAD — `components/cad/CadSheets.tsx`
`useCadStore` là **singleton toàn cục**; mount nhiều `CadEditor` sẽ **dùng chung 1 store** (không cô lập).
→ Giữ **đúng 1** `CadEditor` mounted, chỉ **hoán nội dung store** khi đổi tab.

```
CadSnapshot = { doc, past, future, viewport, currentLayer, selection }   // đúng các key của store
sheets: { id, name }[]                 // ≤ 5
snapRef: Record<id, CadSnapshot>       // ref, không gây re-render
activeId
```
- `switchTo(id)`: `snapRef[active] = pick(useCadStore.getState())` → `useCadStore.setState(snapRef[id])`
  → `setActiveId(id)` → `dispatch('cad:zoom-extents')`.
- `addSheet`: lưu active; tạo sheet mới với `{ doc: emptyDoc(), past:[], future:[], viewport mặc định, currentLayer, selection:[] }`; switch.
- `closeSheet`: xoá; nếu là active → switch sang hàng xóm; **không cho đóng sheet cuối cùng**.
- `renameSheet`: chỉ đổi `name`.

Không cần sửa `store.ts` — dùng API công khai `getState`/`setState` của zustand (`setState` shallow-merge đúng key).

### 3.3 Present — `components/present-editor/PresentSheets.tsx`
`useEditor` là state **cục bộ theo instance**; nhưng `PresentEditor` bind **1 listener `keydown` cấp window**
(undo/redo/copy…). Mount đồng thời nhiều instance ẩn → **đụng listener** (mọi instance cùng nuốt ⌘Z).
→ Giữ **đúng 1** `PresentEditor` mounted, **re-key theo `activeId`**.

```
sheets: { id, name, deck }[]           // ≤ 5, mỗi sheet giữ deck riêng
deckRef: Record<id, EditorDeck>        // deck "sống" mới nhất của sheet đang mở
activeId
<PresentEditor key={activeId} initialDeck={sheets[active].deck} onDeckChange={d => deckRef[active]=d} />
```
- `onDeckChange` = **prop tuỳ chọn MỚI** của `PresentEditor` (mặc định undefined = 0 thay đổi hành vi).
  Fire mỗi khi `ed.deck` đổi → wrapper cập nhật `deckRef` (không setState → không render thừa).
- `switchTo/add/close`: commit `deckRef[active]` vào `sheets` rồi đổi `activeId` → instance mới mount với deck đã lưu.
- **Đánh đổi pha 1 (đã ghi rõ):** re-key làm **reset undo-history + selection** khi đổi tab (giống Excel:
  đổi sheet không share undo) và **fetch lại `/api/library`** một lần/đổi-tab. Nội dung deck KHÔNG mất.

## 4. Thanh tab dùng chung — `components/studio/SheetTabBar.tsx`
Thuần presentational, dùng cho cả 2 chặng:
```
props: sheets:{id,name}[], activeId, max, onSelect, onAdd, onRename, onClose, onReorder
```
- Click chọn; **double-click** → input đổi tên tại chỗ (Enter/blur lưu, Esc huỷ).
- Nút **+** thêm sheet, ẩn/disable khi đạt `max` (5) kèm tooltip.
- Nút **×** đóng (ẩn khi chỉ còn 1 sheet).
- **Kéo tab** trái/phải để sắp xếp (HTML5 draggable, `onReorder(from,to)`).
- Không tự bind phím tắt cấp window → không đụng listener của editor.

## 5. Điểm cắm (đường demo/đơn KHÔNG đổi)
- `app/cad-editor/page.tsx`: `<StudioBar/> + <CadSheets/>` (CadSheets bọc `SheetTabBar + CadEditor`).
- `app/present-editor/page.tsx`: `<PresentEditor initialDeck>` → `<PresentSheets initialDeck>`.
- 1 sheet ⇒ hành vi **y hệt** bản cũ (export PNG/DXF, "Đưa sang Render", export PDF/PPTX/PNG đều đọc
  active doc/deck). Route demo `/present`, `/report`, handoff CAD→Render **không liên quan**.

## 6. Kéo-gộp single-window (PHA 2 — khung + kế hoạch)
Mục tiêu: kéo một tab tới **cạnh** vùng canvas → chia 2 pane cạnh nhau **trong cùng cửa sổ**
(không tách cửa sổ OS — bất khả thi trong SPA).

Kế hoạch:
1. `SheetTabBar` đã phát `onReorder`; thêm sự kiện `onTearToEdge(id, edge)` khi thả tab vào vùng cạnh.
2. Tầng wrapper nâng từ "1 active" → **layout 2 pane** `{ left:id, right:id|null, ratio }`.
   - CAD: **không** hiển thị 2 `CadEditor` (đụng singleton store) → pha 2 render pane phụ ở chế độ
     **xem/so-sánh chỉ-đọc** (render doc ra canvas tĩnh) hoặc tách store thành factory (việc lớn, tính sau).
   - Present: `useEditor` theo-instance → **2 `PresentEditor` cạnh nhau khả thi**, nhưng phải chuyển
     listener `keydown` từ `window` sang **theo-pane có focus** (bọc trong container + `tabIndex`). Đây là
     điều kiện tiên quyết pha 2 cho Present.
3. Giới hạn 2 pane; vượt = từ chối kèm chỉ báo.

Rủi ro chính đã nhận diện: (a) singleton `useCadStore` cản 2 pane CAD sống; (b) listener window toàn cục
của PresentEditor cản 2 pane Present tương tác độc lập. Vì vậy pha 1 **chỉ tab-model** (an toàn), pha 2 làm
sau khi tách được store CAD + phạm-vi-hoá listener Present.

## 7. Giới hạn & mặc định
- **Tối đa 5 sheet/chặng** (hằng `MAX_SHEETS = 5`).
- Sheet đặt tên tự động: "Bản vẽ N" (CAD) / "Trang N" (Present); đổi tên tuỳ ý.
- Không persist qua reload ở pha 1 (khớp hiện trạng: CAD/Present editor cũng chưa auto-persist doc/deck).
