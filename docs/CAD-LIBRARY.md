# Thư viện block CAD (DXF) — `public/cad-library/`

Thư viện block nội thất/kiến trúc 2D (top-view mặt bằng) độc lập với `lib/cad/furniture.ts`
(thư viện block "vẽ tay" cũ dùng `BlockEntity` + `BLOCK_MAP`). Mục tiêu: có sẵn **block DXF thật**
(đơn vị mm, parse lại được bằng `lib/cad/dxf.ts` sẵn có) để demo/chèn vào bản vẽ, mà **không sửa**
bất kỳ file nào của trình CAD chính hay của agent khác.

## 1. Nguồn dữ liệu & bản quyền

Đã tìm các nguồn "free CAD blocks" phổ biến trên web (FreeCADS, DWGModels, v.v. — xem kết quả
tìm kiếm khi làm task). Quyết định: **KHÔNG tải file từ các site đó**, vì:

- Hầu hết không phải CC0/public-domain thật — là "miễn phí có điều kiện" (cần tài khoản, giới hạn
  mục đích sử dụng, không ghi rõ license tái phân phối trong sản phẩm khác).
- Tải file nhị phân/DWG-DXF từ site thứ 3 không rõ nguồn gốc/license rơi vào nhóm hành động
  "tải file từ nguồn không tin cậy" — best practice an toàn là tránh.

→ Toàn bộ 46 block trong thư viện này là **TỰ DỰNG (nguyên bản)**: hình học vector (line/polyline/
circle/arc) viết tay theo đúng phong cách và quy ước đã có ở `lib/cad/furniture.ts` (danh sách
`Prim` local mm, gốc tâm, X phải/Y lên), kích thước theo cataloge nội thất phổ biến VN/quốc tế.

**License**: mỗi block ghi `source: "tự dựng (nguyên bản...)"` và
`license: "CC0 — tự do sử dụng/sửa/phân phối"` trong `manifest.json` — an toàn 100% để dùng trong
sản phẩm, không dính bản quyền bên thứ 3.

Nếu sau này muốn nạp thêm block DXF **thật** tải từ nguồn có license rõ ràng (vd. thư viện CC0 của
chính công ty, block tự vẽ trong AutoCAD/LibreCAD rồi export), chỉ cần:
1. Đặt file `.dxf` vào `public/cad-library/<category>/`.
2. Thêm 1 dòng vào `manifest.json` (hoặc chạy lại generator sau khi thêm vào `blocks-data.ts` nếu
   muốn định nghĩa bằng Prim thay vì DXF tải sẵn).
3. Ghi rõ `source` (URL) + `license` thật của block đó — không được để trống.

## 2. Cấu trúc

```
public/cad-library/
  manifest.json                 ← danh sách toàn bộ block + metadata
  phong-khach/*.dxf, *.svg       ← Phòng khách (sofa, ghế bành, bàn trà, kệ TV, kệ sách...)
  phong-an/*.dxf, *.svg          ← Phòng ăn (bàn ăn 4/6/tròn, ghế bar, tủ búp phê)
  phong-ngu/*.dxf, *.svg         ← Phòng ngủ (giường đơn/đôi/queen/king, táp, tủ áo, tủ ngăn kéo)
  bep/*.dxf, *.svg               ← Bếp (bồn rửa, bếp 4 vòng, tủ lạnh, đảo bếp, tủ chữ L)
  ve-sinh/*.dxf, *.svg           ← Vệ sinh (bồn cầu, bidet, lavabo, bồn tắm, vòi sen)
  cua/*.dxf, *.svg               ← Cửa & cửa sổ (1 cánh/2 cánh/lùa, sổ đơn/đôi/vòm góc)
  cay-canh/*.dxf, *.svg          ← Cây cảnh (chậu nhỏ/lớn, cây nhìn từ trên)
  xe/*.dxf, *.svg                ← Xe (sedan, SUV)
  cau-thang/*.dxf, *.svg         ← Cầu thang (thẳng, chữ L)
  cot/*.dxf, *.svg               ← Cột (vuông, tròn)
  ky-hieu/*.dxf, *.svg           ← Ký hiệu (hướng Bắc)
```

**46 block / 11 danh mục** (đủ ngưỡng 30–50 yêu cầu).

### `manifest.json`

```jsonc
{
  "version": 1,
  "generatedAt": "...ISO...",
  "unit": "mm",
  "count": 46,
  "categories": [{ "slug": "phong-khach", "label": "Phòng khách" }, ...],
  "blocks": [
    {
      "id": "living-sofa-2seat",
      "name": "Sofa 2 chỗ",
      "category": "phong-khach",
      "categoryLabel": "Phòng khách",
      "w": 1600, "h": 850,           // kích thước bao, mm
      "file": "/cad-library/phong-khach/living-sofa-2seat.dxf",
      "thumb": "/cad-library/phong-khach/living-sofa-2seat.svg",
      "source": "tự dựng (nguyên bản, theo phong cách lib/cad/furniture.ts)",
      "license": "CC0 — tự do sử dụng/sửa/phân phối (tài sản gốc của dự án InteriorFlow)"
    }
  ]
}
```

### File `.dxf`

DXF ASCII tối thiểu — `SECTION 2 HEADER` ($INSUNITS=4 tức mm) rồi `SECTION 2 ENTITIES` chỉ chứa
`LINE` / `LWPOLYLINE` / `CIRCLE` / `ARC` (đúng tập entity mà `lib/cad/dxf.ts` đọc được). Toạ độ
local mm, gốc tâm block — mở trực tiếp file này (không cần `INSERT`/`BLOCKS` section) là thấy
hình vẽ tại gốc toạ độ, giống hệt 1 bản vẽ mặt bằng thật.

### File `.svg`

Thumbnail render sẵn (nền be nhạt `#f7f4ee`, nét `#3d3a34`) — hiển thị trực tiếp bằng `<img>`,
không cần parse DXF phía client chỉ để xem lưới ảnh.

## 3. Sinh lại / kiểm chứng thư viện

```bash
cd ~/Downloads/interiorflow
npx tsx scripts/cad-library/generate-library.ts   # xoá + sinh lại toàn bộ public/cad-library/
npx tsx scripts/cad-library/verify-library.ts      # parse lại từng .dxf bằng lib/cad/dxf.ts, đối chiếu số entity
```

- `scripts/cad-library/blocks-data.ts` — dữ liệu gốc (danh sách `LibBlockDef`, hình học `Prim`).
  Sửa/thêm block ở đây rồi chạy lại generator.
- `scripts/cad-library/generate-library.ts` — Prim → DXF ASCII + Prim → SVG thumbnail + manifest.
- `scripts/cad-library/verify-library.ts` — round-trip: parse lại 46/46 block bằng đúng parser
  thật của app, đối chiếu số entity kỳ vọng. Kết quả hiện tại: **46/46 OK**.

## 4. Loader trong app — `lib/cad/block-library.ts`

File mới, KHÔNG sửa `lib/cad/furniture.ts`/`components/cad/**`. API:

```ts
import { loadManifest, groupByCategory, searchBlocks, insertBlockById, flattenBlockEntities, loadBlockDoc } from '@/lib/cad/block-library';

const manifest = await loadManifest();               // fetch + cache public/cad-library/manifest.json
const byCat = groupByCategory(manifest);              // Map<category, LibraryBlockMeta[]>
const found = searchBlocks(manifest, 'sofa');         // lọc theo tên/danh mục

// Chèn 1 block tại điểm world (mm), có xoay/scale/lật gương:
const entities = await insertBlockById(manifest, 'living-sofa-2seat', { x: 1000, y: 500 }, {
  rot: Math.PI / 2,  // radian
  sx: -1,            // âm = lật gương ngang
  sy: 1,
  layer: 'l-furniture', // mặc định đã là 'l-furniture' nếu bỏ qua
});
// entities: Entity[] gồm line/polyline/circle/arc — CHÈN THẲNG vào doc.entities hiện có,
// không cần biết gì về BlockEntity/BLOCK_MAP, hiển thị đúng ngay trên CadCanvas hiện tại.
```

Cách hoạt động: mỗi block DXF được `lib/cad/dxf.ts#parseDxf` (đã có sẵn, chỉ import) parse thành
`Doc` cục bộ (toạ độ local quanh gốc 0,0), rồi `flattenBlockEntities` áp phép biến hình
**scale → rotate → translate** — ĐÚNG thứ tự với `blockLocalToWorld` trong `lib/cad/render.ts`
(cho block "vẽ tay" cũ) — để hành vi nhất quán, sinh ra mảng `Entity` mới (id mới, layer chỉ định)
đã ở toạ độ world, sẵn sàng nối vào `doc.entities`.

## 5. Demo trong app — `/cad-library-demo`

Route độc lập (`app/cad-library-demo/page.tsx` → `components/cad-library/BlockLibraryDemo.tsx`,
đều là file MỚI, không đụng route/panel của trình CAD chính):

```bash
npm run dev
# mở http://localhost:3000/cad-library-demo
```

- Cột trái: lưới 46 thumbnail, lọc theo 11 danh mục + ô tìm kiếm.
- Cột phải: canvas xem trước (nền tối, lưới 500mm, khung phòng mẫu 6m×4m) — click 1 block để
  chọn, xoay 90°/lật gương nếu muốn, rồi **click vào canvas để chèn thử tại điểm đó** (gọi
  `insertBlockById` thật, vẽ bằng `drawEntity` thật của `lib/cad/render.ts` — chứng minh entity
  sinh ra tương thích 100% với renderer chính). Kéo chuột phải/giữa để pan, lăn chuột để zoom.

## 6. Tích hợp vào panel "Thư viện nội thất" thật (việc còn lại cho agent CAD / phiên chính)

Panel thật hiện ở `components/cad/CadToolbar.tsx`, đang đọc `BLOCKS`/`BLOCK_MAP` từ
`lib/cad/furniture.ts` (16 block vẽ tay, dùng `BlockEntity{ block, at, rot, sx, sy }` +
`BLOCK_MAP` tra cứu prims lúc RENDER). Vì file này **cấm sửa** trong phạm vi task, việc nối 2
thư viện lại làm ở phiên khác, gợi ý 2 cách (không loại trừ nhau):

- **Cách A — thêm tab "Từ web" trong panel hiện có**: import `loadManifest`/`groupByCategory` từ
  `lib/cad/block-library.ts`, hiển thị song song lưới 46 block mới. Khi user click 1 block trong
  tab này rồi click canvas: gọi `insertBlockById(...)` rồi `useCadStore.getState().addEntity(...)`
  cho từng entity trả về (hoặc thêm 1 action `addEntities(list)` mới trong `store.ts` để gộp thành
  1 bước undo) — KHÔNG cần đụng `BlockEntity`/`BLOCK_MAP`.
- **Cách B — hợp nhất danh mục**: nếu muốn 2 nguồn hiện chung 1 danh sách, viết 1 adapter hiển thị
  gộp `BLOCKS` (furniture.ts) + `manifest.blocks` (block-library.ts) làm 2 "provider" khác nhau
  trong cùng UI, giữ nguyên cơ chế đặt block cũ cho 16 block gốc, dùng luồng entity-phẳng mới cho
  46 block DXF.

## 7. Phần CHƯA xong / rủi ro

- **Chưa verify bằng mắt trên trình duyệt thật** trong phiên này (môi trường chạy không mở được
  preview browser lúc thực hiện) — đã verify bằng: (a) `npx tsc --noEmit` sạch, (b)
  `verify-library.ts` parse lại đúng 46/46 block bằng chính parser của app. Cần mở
  `/cad-library-demo` một lần bằng mắt để xác nhận thumbnail hiển thị đúng tỉ lệ và việc chèn
  block vẽ ra hình hợp lý (đặc biệt các hình phức tạp: sofa L, tủ bếp chữ L, thang chữ L).
- **Arc trong thumbnail SVG** được xấp xỉ bằng polyline lấy mẫu 16 điểm (không dùng lệnh `A` của
  SVG) để tránh sai sót cờ sweep — đủ mượt ở kích thước thumbnail nhưng không phải cung tròn hình
  học tuyệt đối nếu phóng to thumbnail rất lớn.
- **DXF sinh ra tối giản** (không có `TABLES`/`BLOCKS` section) — mở được ở phần mềm CAD dễ tính
  (LibreCAD thường tự tạo layer khi thiếu) nhưng CHƯA test mở bằng AutoCAD/LibreCAD thật; đã test
  chắc chắn với parser riêng của app (`lib/cad/dxf.ts`).
- **Không có rủi ro bản quyền**: toàn bộ hình học tự dựng, không chép từ nguồn thứ 3 (xem mục 1).
- Panel thật (`CadToolbar.tsx`) **chưa được nối** — theo đúng giới hạn "không sửa file của agent
  khác" của task; xem mục 6 để agent CAD/phiên chính tiếp tục.
