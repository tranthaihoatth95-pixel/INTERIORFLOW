# M-IDFC-2-OUT — p13 vòng 4: `.idfc` v2 "MỌI THỨ ĐỀU LÀ .idfc" (chốt 07/08 khuya) · 08/08 rạng sáng

> Vùng: `lib/cad/idfc.ts` · `lib/library/` · `components/library/`. **CHƯA COMMIT** (V6).
> Phiếu cho phép: *"không đủ thời lượng thì làm xong VIỆC 1+2, BÁO CÁO, để VIỆC 3-5 phiếu sau"* —
> đã làm **VIỆC 1+2 TRỌN + VIỆC 3 (dính liền schema)**; **VIỆC 4+5 ĐỂ PHIẾU SAU, nói thẳng** —
> không làm dở migration, không làm dở UI thẻ.

## BẢNG CUỐI LƯỢT (§V7)

| Việc | Trạng thái | Số đo / bằng chứng |
|---|---|---|
| 1 · Vỏ chung + ruột union | ✅ XONG | `IdfcFile v2 = {meta, body, commerce?}`; `IdfcBody` = discriminated union 7 ruột; KHÔNG một trường optional phẳng nào; `progress` KHÔNG khai (K4, ràng buộc 3 giữ nguyên) |
| 2 · Migration v1→v2 | ✅ XONG — lần đầu `IDFC_MIGRATIONS` có entry thật | `IDFC_VERSION 1→2`; test **36/36** trong đó 9 test riêng cho v1→v2 (furniture/lighting/material/không-commerce); verify UI THẬT: thả file v1 CŨ qua "Nạp hàng loạt" → "✓ Ghế bành Pelican · FJ-PEL-01" → kệ hiện → cột thông số ăn đủ giá 120tr/cái + Roughness 0.45 XUYÊN migration (ảnh) |
| 3 · kind 5→11, ánh xạ ThumbKind | ✅ XONG (một điều chỉnh ngữ nghĩa, ghi dưới) | 11 kind + `lighting`→`fixture` (test) · `BODY_TYPE_OF_KIND` phủ 11/11 (test) · `SELLABLE_KINDS` 6 loại chia thầu (test) · `idfcKindOfThumb`/`THUMB_OF_IDFC_KIND` (`thumb-kinds.ts`) |
| 4 · Sidebar theo kind | ⏳ PHIẾU SAU | sidebar hiện vẫn 5 ngăn vòng trước; đổi sang danh sách kind đụng cả `shelves.ts` mock lẫn itemsFor — làm vội là dở dang đúng thứ phiếu cấm |
| 5 · Lỗi thẻ (a-e) | ⏳ PHIẾU SAU | chưa đụng; 5a (chữ cắt cụt) chưa tìm gốc — không đoán bừa vào report |
| tsc | ✅ exit 0 toàn repo | chạy sau khi đổi đủ 2 caller |
| npm test | ✅ 0 fail | chạy nền full suite, grep FAIL = 0 dòng thật |
| check-chot | ✅ không tăng đỏ | 35 đỏ có sẵn, grep 35 lỗi × file phiên này = 0 dính |

## VIỆC 1 — cấu trúc v2 (`lib/cad/idfc.ts`, viết lại ~410 dòng)

- `meta` vỏ chung đúng chốt 11.2: id? · name/nameEn · code · **kind** · scope? · tags? · room? ·
  author? · ngày. `IdfcScope` khai lại literal khớp `ScopeLevel` (lib/cad không import ngược
  lib/library — tránh vòng; ghi chú tại chỗ).
- `IdfcBody` union: `component` (geom2d·geom3d?·params?) · `material` (**pbr là ruột chính** +
  hatch2d? + `symbol2d?` — chỗ giữ geom2d của file v1 kind material, KHÔNG vứt dữ liệu KS4) ·
  `page`/`video`/`doc`/`brandkit` (KHỞI ĐIỂM TỐI THIỂU — app chưa có producer/consumer payload
  chi tiết, docstring ghi rõ mở rộng = migration v3, KHÔNG đoán trước schema) · `asset`.
- `IdfcCommerce` v2 **bỏ `kind`** (lên meta — một sự thật một chỗ; migration tự strip).
- `bodyError()` — chỗ union trả công: *"File .idfc loại "video" phải mang ruột "video", đang là
  "component""* — một câu lỗi nói đủ loại + ruột, chặn Ở CỔNG thay vì if rải khắp caller.
- Chữ C = **CONTENT** (chốt 11.3②) — đổi docstring đầu file, giữ phần mở rộng tệp.

## VIỆC 2 — migration (phần rủi ro nhất, làm trước tiên)

Khuôn PORT NGUYÊN VĂN idf.ts (bảng nâng từng bậc + `__setCurrentIdfcVersionForTest` cô lập test —
không phát minh cơ chế thứ hai). `migrateV1ToV2` mỗi quyết định một dòng lý do trong docstring:
- kind từ `commerce.kind` (chỗ duy nhất v1 khai loại); thiếu ⇒ 'furniture' (loại trung tính của
  file-có-hình-học); `lighting`→`fixture` (chốt 11.4).
- material: pbr từ geom3d lên ruột chính; geom2d cũ → `symbol2d` (KS4); material không pbr ⇒
  `pbr:{}` ("chưa đo" là trạng thái hợp lệ — MaterialPbr toàn optional, không bịa số N4).
- Test: 4 fixture v1 chép ĐÚNG cấu trúc exportIdfc v1 sinh (đối chiếu git history) + round-trip
  v2 3 loại + đứt gãy/fromV>toV/version tương lai + độc lập test-version. **36/36.**
- Verify UI: 1 lần thả 3 file (v1 cũ · v2 asset · v2 sai ruột) — 2 vào kho đúng
  `{kind, body.type}` = `{furniture, component}` / `{asset, asset}` (đọc localStorage), file sai
  ruột bị chặn kèm câu lỗi union hiển thị NGAY TRÊN DÒNG (ảnh).

## VIỆC 3 — một trục "nó là cái gì" + điều chỉnh ngữ nghĩa cần Hoà biết

- Ánh xạ THUMB→KIND là **n→1**, không 1-1 như câu chữ phiếu: 6 thumb vật liệu (wood/stone/…) đều
  là kind `material` — ThumbKind từ nay là HÌNH THỨC Ô XEM TRƯỚC, hết vai hệ phân loại (đúng tinh
  thần chốt "kind là trục duy nhất"); chiều KIND→THUMB có bảng mặc định.
- ⚠️ 5 thumb `light-*` (preset dựng ảnh) KHÔNG có kind trong chốt 11.4 (không phải cấu kiện,
  không phải mẫu hồ sơ) — tạm map `asset`, KHÔNG tự đẻ kind ngoài chốt. **Hoà quyết**: thêm kind
  `preset` (v3) hay giữ asset?
- 2 caller đổi theo v2: export ở `LibrarySheet` (meta.kind qua `idfcKindOfThumb`, ruột component)
  · kệ idfc đọc `THUMB_OF_IDFC_KIND[meta.kind]` (thẻ asset đã hiện icon khác thẻ furniture — ảnh)
  · spec đọc pbr theo ruột (material trực tiếp / component qua geom3d).

## Sự cố & suýt-sự-cố phiên này (ghi thật)
- **Suýt dại `git stash` trong cây chung** để đo "đỏ check-chot của HEAD" — stash sẽ cuốn cả file
  đang dở của MỌI phiên khác. Lệnh fail nên vô hại (stash list nguyên 2 entry cũ, status nguyên);
  đổi cách đo: grep 35 lỗi × đường dẫn file phiên này = 0. **Luật rút ra: cấm stash/checkout khi
  nhiều phiên chung working tree.**
- §0aa tiếp diễn: 3000 lúc 200 lúc 404; 3001/3002 treo không đáp. Verify bám 3000 lúc nó sống.

## CHƯA VERIFY
- Kéo-thả món idfc từ kệ xuống bản vẽ (chuỗi nghe bên CadEditor — như vòng trước).
- Ruột `page`/`video`/`doc`/`brandkit` chưa có file thật nào ngoài fixture (chưa có producer —
  đúng trạng thái K4 đã khai trong docstring).
- Nút "Xuất .idfc" sau đổi v2: tsc khớp kiểu + cùng đường exportIdfc đã test, CHƯA bấm lại trên UI.

## File đụng
| File | Việc |
|---|---|
| `lib/cad/idfc.ts` | viết lại v2 (vỏ+ruột+migration) |
| `lib/cad/idfc.test.ts` | viết lại — 36 test v2+migration |
| `lib/library/thumb-kinds.ts` | +`idfcKindOfThumb`/`THUMB_OF_IDFC_KIND` |
| `components/library/LibrarySheet.tsx` | export v2 · kệ idfc đọc kind/scope từ meta · spec đọc pbr theo ruột |

Không đụng: `model.ts`/`Base` (ràng buộc 2) · không hàm ghi ngược (ràng buộc 1) · không
`progress` (K4) · `lib/boq` · `components/present-editor` · mock.
