# SHAPE-SCHEMA.md — Hợp đồng dữ liệu Shape Library (Sprint 3, B1+B2)

> Mọi agent (A/B/C) PHẢI theo đúng schema này khi thêm shape hoặc build tương tác.
> Không tự đổi field name/type. Nếu thấy schema thiếu gì cần cho task — DỪNG, báo lại, không tự mở rộng.

## Bối cảnh: đã có sẵn, KHÔNG viết lại từ đầu

`lib/cad/furniture.ts` đã có `BlockDef` (định nghĩa hình) + 18 block mẫu (sofa, giường, bàn ăn, bồn cầu, cửa...).
`lib/cad/model.ts` đã có `BlockEntity` (instance đã đặt lên canvas: `block` key, `at`, `rot`, `sx`, `sy`).

Sprint 3 **mở rộng** 2 type này thêm field mới (optional, backward-compatible — 18 block cũ không cần sửa).

---

## 1. `BlockDef` — mở rộng (file `lib/cad/furniture.ts`)

```ts
export interface BlockDef {
  id: string;                // giữ nguyên
  name: string;              // giữ nguyên
  group: BlockGroup;         // MỞ RỘNG enum — xem bên dưới
  w: number;                 // giữ nguyên — kích thước danh nghĩa mm (variant mặc định)
  h: number;                 // giữ nguyên
  prims: Prim[];             // giữ nguyên — hình vẽ variant mặc định

  // ---- MỚI (Sprint 3) ----
  variants?: ShapeVariant[];      // B2.5 — nếu không có, shape chỉ có 1 dạng (dùng w/h/prims gốc)
  anchors?: SnapAnchor[];         // B2.2 — điểm neo để auto-snap vào tường
  clearance?: ClearanceZone[];    // B2.7 — vùng trống bắt buộc quanh shape
  meta?: ShapeMeta;               // B2.4 — info panel: giá, mã, nhà cung cấp
}

// Nhóm palette — 7 nhóm cũ + 3 nhóm mới cho B1.9/B1.10/B1.7-8 tách riêng nếu cần
export type BlockGroup =
  | 'Phòng khách' | 'Phòng ăn' | 'Phòng ngủ' | 'Bếp' | 'Vệ sinh'
  | 'Làm việc' | 'Kiến trúc'
  | 'Cầu thang' | 'Thiết bị';   // MỚI — B1.9, B1.10

export interface ShapeVariant {
  id: string;           // vd 'single' | 'double' — duy nhất trong 1 BlockDef
  name: string;         // tên hiển thị: "Giường đơn" / "Giường đôi"
  w: number;
  h: number;
  prims: Prim[];
}

// Điểm neo dùng cho auto-snap-to-wall (B2.2). Toạ độ LOCAL mm, gốc tâm block — giống hệ prims.
export interface SnapAnchor {
  kind: 'wall-back' | 'wall-side' | 'floor';
  pt: Pt;                // vị trí anchor trong hệ local
  normal: { x: number; y: number }; // hướng "áp vào tường", vector đơn vị
}

// Vùng chờ bắt buộc (B2.7) — hình chữ nhật LOCAL mm, gốc tâm block, KHÔNG xoay riêng
// (xoay theo block khi block xoay).
export interface ClearanceZone {
  x: number; y: number; w: number; h: number; // hcn local mm
  reason: string; // vd "Bán kính mở cửa tủ", "Lối đi tối thiểu 900mm"
}

export interface ShapeMeta {
  price?: number;      // VNĐ, optional — chưa có giá thật thì bỏ qua
  vendor?: string;
  sku?: string;
}
```

**Import `Pt`** từ `lib/cad/model.ts` (đã có sẵn, đừng định nghĩa lại).

---

## 2. `BlockEntity` — mở rộng (file `lib/cad/model.ts`)

```ts
export interface BlockEntity extends Base {
  type: 'block';
  block: string;      // giữ nguyên — key tra BLOCK_MAP
  at: Pt;             // giữ nguyên
  rot: number;        // giữ nguyên
  sx: number;         // giữ nguyên
  sy: number;         // giữ nguyên

  // ---- MỚI (Sprint 3) ----
  variant?: string;        // B2.5 — id của ShapeVariant đang chọn; thiếu = variant mặc định (w/h/prims gốc)
  collision?: boolean;     // B2.6 — true khi overlap object khác, tính ở runtime (KHÔNG lưu vào .idf, chỉ transient state trong store)
}
```

`collision` là derived state (tính lại mỗi lần render/move), không phải dữ liệu bền vững — Agent C xử lý trong store, KHÔNG serialize vào `.idf`.

---

## 3. Ai dùng gì (tránh đụng nhau)

| Field | Agent A (B1.1-3) | Agent B (B1.4-10) | Agent C (B2.*) |
|---|---|---|---|
| Thêm `BlockDef` mới vào `BLOCKS[]` | ✅ (phòng ngủ/khách/ăn) | ✅ (bếp/tắm/vp/cửa/cửa sổ/thang/thiết bị) | ❌ không thêm shape |
| `variants` | Điền nếu B1 spec có (giường đơn/đôi, bồn 1/2 chậu) | Điền nếu có | Đọc để build UI switch (B2.5) |
| `anchors` | Điền cho shape áp tường (tủ, giường đầu tường) | Điền cho bồn rửa/tủ bếp | Đọc để auto-snap (B2.2) |
| `clearance` | Điền cơ bản (vd tủ áo cần 700mm mở cửa) | Điền cho bồn cầu/bếp | Đọc để vẽ overlay (B2.7) |
| `meta` | Optional, để trống nếu chưa có giá | Optional | Đọc để render info panel (B2.4) |

Agent C **không chờ** A/B xong — dùng 2-3 `BlockDef` giả (mock) tự khai báo trong file test/mock riêng của mình để build B2.1-B2.8, miễn theo đúng interface trên. Khi merge, Agent C tự động ăn theo field thật của A/B vì cùng interface.

---

## 4. Nơi đặt code mới

- Shape mới: thêm vào `BLOCKS: BlockDef[]` trong `lib/cad/furniture.ts` (không tạo file riêng, tránh xung đột import).
- Type mới (`ShapeVariant`, `SnapAnchor`, `ClearanceZone`, `ShapeMeta`, `BlockGroup`): thêm ngay trong `lib/cad/furniture.ts` cạnh `BlockDef` — Agent A và B đều sửa cùng vùng đầu file này nên **phải merge A trước, B sau** (đúng thứ tự Bước 3 đã định).
- UI palette kéo-thả (B2.1) + info panel (B2.4) + search (B2.8): component mới trong `components/`, đặt tên `ShapePalette.tsx` (Agent C tạo).
- Auto-snap (B2.2), resize handle (B2.3), collision (B2.6), clearance overlay (B2.7): logic thuần trong `lib/cad/` (Agent C tạo file mới, vd `lib/cad/shape-interactions.ts`), UI nối vào `CadCanvas` hiện có.

---

**Xác nhận 1 dòng để tôi tiếp tục Bước 2 (tạo 3 worktree + giao việc A/B/C).**
