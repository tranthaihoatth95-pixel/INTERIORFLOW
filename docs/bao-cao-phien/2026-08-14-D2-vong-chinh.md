# BÁO CÁO PHIÊN · D2 — Vòng chỉnh phối cảnh liên chặng (mảnh 2)

**Phiếu:** `docs/phieu-giao/demo-d2-vong-chinh.md` · **Ngày:** 14/08/2026 · **Vai:** D2 (wiring liên chặng theo interface T, cấp F)

## ① Sơ đồ luồng 5 bước — THẬT chạy được đến đâu

```
 TRÌNH CHIẾU (deck)                CHẶNG 2 (flow node)                TRÌNH CHIẾU (deck)
┌──────────────────────┐   ②    ┌──────────────────────────┐   ④⑤  ┌──────────────────────┐
│ ẢNH có assetId       │ ─────▶ │ [Nhập ảnh]──▶[Render bám │ ─────▶ │ "Nhận ảnh đã chỉnh"  │
│ nút/menu             │ người  │  ý (mảng)] meta{assetId, │ người  │ → setLinkedAssetSrc  │
│ "Chỉnh phối cảnh ✨" │ bấm    │  deckId} — select sẵn    │ bấm    │ MỌI slide đổi ruột   │
└──────────────────────┘        │ ③ người: mask+phiếu+chạy │        │ ảnh, GIỮ frame + ⑤   │
                                └──────────────────────────┘        │ provenance           │
                                                                    └──────────────────────┘
```

| Bước | Máy/Người | Trạng thái | Ghi chú |
|---|---|---|---|
| ① Nút "Chỉnh phối cảnh ✨" | người bấm | ✅ CHẠY, verify browser | Inspector (marker `magic-phoi-canh`) + menu chuột phải. CHỈ hiện khi ảnh CÓ `assetId` (đúng interface T; ảnh chưa liên kết → bấm "Đặt làm tài sản dùng chung" trước — nút sẵn có) |
| ② Gieo node + điều hướng | máy | ✅ CHẠY, verify browser | `seedPerspectiveEdit`: cặp `input.image` (src của asset) → `ai.regionrender` mang `{assetId, deckId, luc}` trên `node.data` (additive), qua `snapshot()` → **undo được** (đã bấm thử, 7 nút → 5 nút). Bấm lại cùng asset = TÁI DÙNG node cũ + làm tươi ảnh nguồn, không đẻ trùng. Điều hướng `router.push` client-side (store giữ nguyên), node **select sẵn** + fitView của canvas — KHÔNG có đường `?focusEntity=` cho node-canvas (chỉ 3D-mode có), khai thật ở dưới |
| ③ Mask + duyệt phiếu + inpaint | người (luồng Grounded v0 sẵn) | ⛔ không đụng (ngoài vùng D2) | Node đứng yên chờ người nối mask, duyệt phiếu, bấm chạy — đúng [T5]. Cần provider inpaint (FAL_KEY/ComfyUI/SD) — chưa dogfood được trong phiên này |
| ④ Đường về | **người bấm — BÁN TỰ ĐỘNG trung thực** | ✅ code + unit test (chưa dogfood UI vì cần bước ③ chạy thật) | Engine node KHÔNG có completion hook/callback để cắm (kiểm `lib/store.ts` execNode — chỉ set `run.status`) → theo đúng nhánh dự phòng của phiếu: PresentEditor subscribe `useFlowStore(s=>s.nodes)` (subscription SẴN CÓ, không thêm), node magic `done` + ảnh output ≠ src asset hiện tại → Inspector hiện nút **"Nhận ảnh đã chỉnh"**. Bấm → `setLinkedAssetSrc` — mọi element cùng assetId giữ NGUYÊN frame/vị trí, chỉ đổi ruột ảnh [T1], qua `ed.update` → undo được [T5] |
| ⑤ Provenance | máy (lúc người bấm ④) | ✅ code + unit test, CÓ GIỚI HẠN | Asset ghi thêm `provenance: [{loai:'grounded-render', nodeId, luc}]` — xem "Khai thật" #2 |

## ② File sửa/thêm

| File | Gì |
|---|---|
| `lib/nodes/magic-perspective-core.ts` (MỚI) | phần THUẦN: metadata, `findPerspectiveResult`, `appendPerspectiveProvenance` |
| `lib/nodes/magic-perspective-core.test.ts` (MỚI) | 15 test, sucrase-node |
| `lib/nodes/magic-perspective.ts` (MỚI) | `seedPerspectiveEdit` — gieo/tái dùng node, CHỈ GỌI exports sẵn có của store (`nextId`/`edgeStyleFor`/`snapshot`/`setState` — cùng khuôn `loadDemoFlow`); **KHÔNG sửa `lib/store.ts`** (hàm additive hoá ra không cần) |
| `components/present-editor/PresentEditor.tsx` | handler ①②④⑤ + truyền props |
| `components/present-editor/Inspector.tsx` | 2 nút (marker `magic-phoi-canh`) trong ImageInspector |
| `components/present-editor/EditorCanvas.tsx` | mục menu chuột phải "Chỉnh phối cảnh ✨" (chỉ ảnh có assetId) |

KHÔNG đụng: `lib/present-editor/pdf-import.ts` (D1) · `lib/grounded-render/**` · `lib/store.ts` · git · không mở/tắt server (dùng preview 3000 đang chạy sẵn để verify, đã dọn sạch dữ liệu thử: xoá image element + undo node gieo; còn 1 entry linkedAssets mồ côi trong deck "Hồ sơ 1" — linked-assets.ts tự khai vô hại).

## ③ Nghiệm thu

- `tsc --noEmit` **0 lỗi** · test `lib/nodes/*` + `lib/present-editor/*` **48 file OK** (gồm 15/15 test mới) · `soi:tu-dien` **0 lệch**.
- Browser (server 3000 sẵn có): nút hiện đúng điều kiện assetId → bấm → nhảy chặng 2, node gieo + nối + select đúng, "0 nối sai" → undo sạch.

## ④ KHAI THẬT — giới hạn & đề xuất lên T

1. **"Focus node" = select sẵn + fitView**, không phải deep-link `?focusEntity=`: node-canvas chặng 2 (`FlowCanvas.tsx` — NGOÀI vùng D2) chưa đọc param đó (chỉ `Render3DModeSkeleton` 3D-mode có). Điều hướng client-side nên store giữ selection — hoạt động thật; nhưng mở URL render TRỰC TIẾP (tab mới) thì không có focus. Đề xuất: thêm nhánh đọc `?focusEntity=node:<id>` vào FlowCanvas (phiếu khác).
2. **Provenance sống nhờ JSON round-trip** (cloneDeck/persist đều JSON) vì `LinkedAsset` (model.ts — ngoài vùng) chưa có field `provenance`; và `setLinkedAssetSrc` DỰNG LẠI asset (giữ mỗi id/name/src/recipe) ⇒ lần đổi src KẾ TIẾP qua đường khác (vd round-trip /photo-editor) sẽ RƠI provenance. Sửa gốc = 1 dòng thêm field + giữ qua setLinkedAssetSrc (như `recipe`) — đề xuất T duyệt cho phiếu lib/present-editor.
3. **Undo của bước ④ chỉ sống trong phiên Present đang mở** — useEditor (undo deck) là state cục bộ component, chuyển chặng rồi quay lại là mất history (hành vi sẵn có của Present, không do D2).
4. Bước ③ chưa dogfood end-to-end (cần FAL_KEY/ComfyUI) — chờ T dogfood chung với D1 theo phiếu.
5. Banner notice sau khi gieo (`setNotice`) đi qua đường FlowCanvas sẵn có — trong lượt verify không chụp kịp banner (có thể auto-tắt); không ảnh hưởng luồng.
