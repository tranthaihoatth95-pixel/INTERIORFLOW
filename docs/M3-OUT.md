# M3-OUT — vòng chẩn đoán nội thất (06/08) · CHỈ LOG GAP, KHÔNG SỬA

Chạy 2 phép thử xuyên qua IF như một KTS thật đang dùng app (§0q: task là **phép thử IF**, sản
phẩm dự án là sản phẩm phụ). **Không sửa một dòng code nào** trong vòng này. Không commit (V6).

- **T2** — bảng FF&E (.csv 9 cột) + ảnh phối cảnh đi vào luồng **vision → block → BOQ**.
- **T3-thả** — thư viện IF có đủ block văn phòng để bố trí không.

Dữ liệu dự án + log chạy: `2407-Test/M3-out/` (gitignore chặn, `git check-ignore` xác nhận
`.gitignore:37`). Tài liệu này **trung tính**: chỉ nói năng lực IF, không nêu số liệu/tên khách.

> Bằng chứng ở đây là **mức code + chạy thật hàm thật** (sucrase-node, grep tự chạy trong phiên),
> **chưa** có lượt nghiệm thu trình duyệt cho từng mục — xem §4 "Chưa verify".

---

## 1 · T2 — vision → block → BOQ

### 1a. IF bốc fur từ phối cảnh được không? — **được MỘT món/lượt, không ra danh sách**

| Mắt xích | Hiện trạng đọc được trong code | Kết luận |
|---|---|---|
| Tách món khỏi nền | `ai.furnitureextract` (`lib/nodes/defs/render-v2.ts:363`) — 1 ảnh vào, 1 cutout + 1 mask ra (BiRefNet nếu có khoá, không thì tách theo màu nền viền) | 1 món/lượt |
| Đo kích thước | `vision.measureobject` (`lib/nodes/defs/metrology.ts`) — đo MỘT món, trả số + dung sai + độ tin | 1 món/lượt |
| Liệt kê N món trong ảnh | không có bước nào | **thiếu hẳn** |
| Chở bảng giữa các node | `DataType = 'image' \| 'text' \| 'mask' \| 'number' \| 'video'` (`lib/types.ts:1`) | **không có kiểu bảng** ⇒ danh sách FF&E không tồn tại được như dữ liệu chạy trong luồng |

⇒ Muốn ra bảng N món thì phải chạy tay N lượt rồi tự gõ lại tên/mã — đúng chỗ đau của task.

### 1b. Từ món đo được có ra **block / bản vẽ** không? — **code có, mặt tiền KHÔNG có**

`lib/vision/match-template.ts` (bước ⑤ khớp block thư viện theo tỉ lệ w:d) và
`lib/vision/ortho-projection.ts` (bước ⑥ ba hình chiếu) đã viết xong, có test. Nhưng:

```bash
grep -rn "match-template\|ortho-projection" components app --include="*.tsx" --include="*.ts"
# → 0 dòng
```

⇒ Không có nút nào trong app đi từ "món đã đo" sang "block trên bản vẽ". Dây chuyền đứt đúng
giữa **vision** và **block**.

### 1c. Ra FF&E **có ảnh** không? — **một tấm JPG cho MỘT món, không phải hồ sơ FF&E**

- Có: `lib/render-studio/measurement-spec-sheet.ts` → 1 tấm `spec-sheet.jpg` 300dpi (ảnh món +
  bảng số đo + dấu cảnh báo mặt khuất), gọi từ `components/render-studio/ToolModeForm.tsx`.
- Không có: hồ sơ nhiều món (mã · ảnh · finish · vendor · giá · số lượng · checkbox duyệt) —
  đúng mục **F1 chưa làm** trong `docs/DUONG-VE-DICH-3-DOT.md:157`.
- Bảng BOQ trên UI: **10 cột**, không có cột ảnh (`components/present-editor/boq/BoqTable.tsx:176-186`).
- Xuất `.xlsx`: `lib/boq/xlsx.ts` tự dựng OOXML tối thiểu qua jszip, 1 sheet, chuỗi inline —
  `grep -n "image\|drawing\|media" lib/boq/xlsx.ts` → **0 dòng** ⇒ file xuất ra **không nhúng ảnh được**.

### 1d. Nhập bảng FF&E vào kho — **4/9 cột rơi + 1 bug ghép cột**

Chạy thật qua đúng cửa nhập của app (`parseSpreadsheetFile` → `guessMapping` → `buildImportRows`),
log đầy đủ: `2407-Test/M3-out/T2-nhap-bang-ffe.log`.

| Cột trong bảng FF&E | Field IF nhận | Ghi chú |
|---|---|---|
| Tên sản phẩm · SKU · Rộng · Sâu | `name` `sku` `w` `d` | đúng |
| **Cao** | ❌ rơi | bị cột khác chiếm chỗ — xem bug dưới |
| **Vật liệu** · **Màu sắc** · **Độ tin cậy** · **Phòng** | ❌ không có field | `MATERIAL_FIELDS` chỉ 9 field (`lib/materials/warehouse/column-mapping.ts:7`) |

**Bug đo được:** từ khoá đoán cột của `hUp` có chữ cái đơn `'h'` và khớp theo *chuỗi con*, nên
tiêu đề "Phòng" (chuẩn hoá thành `phong`, có chứa `h`) bị gán vào **Cao**; cột "Cao (H mm)" thật
bị bỏ. Kết quả: cả 5 dòng nhập vào **không có chiều cao**. Rủi ro y hệt đang treo ở `'w'` và `'d'`.

Hai điều nữa lộ ra ở cùng cửa này:
- `runImport` gửi cứng `kind: 'material'` (`lib/materials/warehouse/apply-import.ts`) ⇒ món nội
  thất rời nhập vào kho **thành vật liệu**, dù `ProductSpec.kind` có sẵn giá trị `'furniture'`.
- `ProductSpec` **không có trường phòng/vị trí** (`prisma/schema.prisma`) ⇒ bảng FF&E theo phòng
  không có chỗ lưu. Ngược lại `materials`/`colorHex`/`hUp` thì CÓ trong schema — chỉ là cửa nhập
  Excel không nối tới.

### 1e. BOQ **món rời** — không tính, và **im lặng**

Chạy thật: 1 bản vẽ gồm ① cụm bench 8 chỗ thả từ thư viện cụm, ② 1 ghế `BlockEntity` đã gán
`specId` + đơn giá, ③ 1 vùng tô sàn có `specId`. Log: `2407-Test/M3-out/T2-boq-mon-roi.log`.

```
Doc: 43 entity  ·  loại: {"polyline":41,"block":1,"hatch":1}
buildSchedule → "Chưa phân loại × 42" + "Ghế văn phòng × 1"
computeBoq    → 1 dòng (sàn, m²)   ·  errors: []   ·  ghế: KHÔNG có dòng, KHÔNG có lỗi
```

- `computeBoq` chỉ quét `type === 'hatch'` (`lib/boq/compute.ts:89-97`) ⇒ **mọi món rời rơi khỏi
  báo giá mà không kêu một tiếng** — nguy hiểm hơn báo lỗi, vì bảng vẫn trông "đủ".
- Không có cột **số lượng đếm** (cái/bộ): cột lượng của bảng là m² (`BoqRow.m2`).
- Cụm 8 chỗ vào bản vẽ dưới dạng **41 entity phẳng** (`clusterPrimsToEntities`,
  `lib/cad/block-library.ts`) — mất danh tính ⇒ bảng thống kê gộp vào "Chưa phân loại", không
  gán được `specId`, không lên được BOQ. Block .dxf từ thư viện cũng làm phẳng y hệt
  (`flattenBlockEntities`).

---

## 2 · T3-thả — thư viện block văn phòng có đủ bố trí không?

### 2a. Kiểm kê thật (đọc `public/cad-library/manifest.json` + `lib/cad/workstation-clusters.ts`)

- Manifest: **54 block**, 12 nhóm. Nhóm **`van-phong` = 8 block**: bàn 1400×700 · bàn 1200×600 ·
  ghế xoay · vách 1400 · vách 1200 · tủ hồ sơ thấp 800 · thấp 1200 · cao 800.
- Cụm sinh theo tham số: **6 loại** (`CLUSTER_SPECS`) — chữ L xương sống · bench thẳng hàng ·
  chữ Y 6 chỗ · góc 120° 6 chỗ · chữ thập 4 chỗ · bàn họp (chữ nhật/thuyền/tròn, tự dài theo số chỗ).
- Dùng ké được từ nhóm khác: sofa/ghế bành/bàn trà (lounge, tiếp khách) · bếp+tủ lạnh+chậu rửa
  (pantry) · cây cảnh · cửa/cửa sổ · cột · cầu thang.

### 2b. Đối chiếu với chương trình văn phòng chuẩn (mục F phiếu đề bài văn phòng của chính IF)

| Không gian phiếu đề bài hỏi | Block/cụm IF có |
|---|---|
| Chỗ làm việc mở | ✅ 2 bàn + ghế + vách + 5 kiểu cụm |
| Phòng họp lớn / nhỏ | 🟡 chỉ có bàn họp + ghế; **không có** màn hình/TV, bảng viết, bục |
| Co-working / họp mở | 🟡 ghép tạm từ bench + sofa |
| Phòng gọi điện riêng (booth) | ❌ |
| Khu tiếp khách / lễ tân | ❌ **không có quầy lễ tân** (chỉ có sofa dùng ké) |
| Pantry / khu ăn | 🟡 bếp gia đình, **không có** bàn cao/quầy bar văn phòng |
| Kho / lưu hồ sơ | 🟡 3 tủ hồ sơ, **không có** dãy kệ kho |
| Phòng máy chủ / kỹ thuật | ❌ **không có tủ rack** |
| Khu thư giãn | 🟡 dùng ké đồ phòng khách |
| (dùng chung) máy in/copy · locker | ❌ |

⇒ **Đủ để bố trí vùng làm việc mở và phòng họp; chưa đủ để bố trí trọn một sàn văn phòng.**

### 2c. Đường "thả" — hai cửa, một cửa không rơi xuống bản vẽ

```bash
grep -rn "if:library-instantiate\|LIBRARY_INSTANTIATE_EVENT" app components lib
# → 1 chỗ PHÁT (components/library/LibrarySheet.tsx:138) · 0 chỗ NGHE
```

- Thả món từ **Thư viện** (cửa được chốt 04/08 là "cửa duy nhất") ⇒ chỉ hiện toast, **không rơi
  xuống bản vẽ**. Riêng kệ "cụm bàn" chạy thật vì `ClusterPanel` gọi thẳng `addEntities()`.
- 54 block .dxf **không hiện trong Thư viện**; chỉ vào được qua panel "Nội thất (block)" tab
  "Thư viện" trong `components/cad/CadEditor.tsx:960-1000` và trang `/cad-library-demo`
  ⇒ hai cửa song song, trái chốt "một cửa".

### 2d. Tự zoning / tự bố trí theo đề bài — có máy, nhưng máy chưa biết văn phòng

`lib/cad/ai-assist.ts` **đã có** `generateLayoutOptions` (đề bài chữ → phòng → đặt nội thất áp
tường, có clearance, có học từ lựa chọn của người dùng). Nhưng bảng công năng của nó ghi
`office: ['desk']` — **một cái bàn**. Không có đường: số nhân sự → số chỗ → chọn kiểu cụm → rải
cụm vào lưới cột; cũng không đặt được các không gian dùng chung ở §2b.
Kiểm diện tích tự động hiện chỉ có cho bàn họp (`checkMeetingArea`, TCVN 4601 1,8 m²/người).

---

## 3 · GAP đã ghi

16 dòng `G-M3-01…16` trong `docs/GAP-IF.md` (trung tính, chưa sửa gì).

## 4 · Chưa verify — nói rõ, không giấu

- **Chưa nghiệm thu trình duyệt** cho bất kỳ mục nào ở trên. Bằng chứng là chạy hàm thật +
  grep tự chạy trong phiên; server 3000 đang chạy của phiên khác, chỉ dùng để kiểm
  `GET /cad-library/manifest.json → 200, 27.639 byte`.
- **Chưa mở ảnh phối cảnh** để chạy tách/đo thật — đường tách và đo cần canvas DOM, không chạy
  được ngoài trình duyệt; kết luận §1a/§1b là kết luận **về đường đi**, không phải về chất lượng
  tách của một tấm ảnh cụ thể (§0o: không nhận xét hình khi chưa mở hình).
- **Chưa thử nhập tệp .xlsx** (chỉ .csv) và chưa thử đường ghép ảnh theo SKU.
