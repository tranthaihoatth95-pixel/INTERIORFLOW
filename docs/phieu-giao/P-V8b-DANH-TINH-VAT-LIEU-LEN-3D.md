# P-V8b · MỞ ĐƯỜNG DANH TÍNH VẬT LIỆU LÊN 3D — thay P-V8 (phiếu đó SAI khoá)

> 🔴 **P-V8 (phiếu trước) SAI VÀ ĐÃ BỊ THAY.** Nó bảo `group.specId → getMaterial`.
> `ProductSpec.id` là **cuid**, `getMaterial` rẽ nhánh theo `isMatIdUuid(input)` ⇒ cuid rơi xuống
> đường `legacy-sku` ⇒ **`pbr = null` vĩnh viễn**. `lib/boq/model.ts:64` đã ghi thẳng lệnh cấm này
> bằng chữ hoa: *"CẤM đưa giá trị này vào `getMaterial()`/pbr-store như thể nó là matId UUID."*
> Lane V8 lượt 1 **bác đúng** và dừng ở ô ⓪ — không gõ dòng mã nào. Đó là hành vi đúng.

## HAI KHÔNG GIAN TÊN — thuộc lòng trước khi gõ

| | là gì | ai dùng |
|---|---|---|
| `ProductSpec.id` = `entity.specId` | **cuid**, FK mềm tới bản ghi thương mại | BOQ · giá · nhà cung cấp |
| `matId` | **UUID** IF-owned, bất biến (ADR 19/08) | **texture · PBR · `getMaterial`** |

⛔ **Không bao giờ trộn hai giá trị này vào một trường.**

## ⓪ TIỀN ĐỀ — xác nhận hoặc BÁC rồi mới làm

| # | khẳng định | tự kiểm |
|---|---|---|
| ⓪.1 | `MaterialDef.matId?: string` **đã tồn tại** (`lib/cad/materials.ts:67`) và **chưa ai ghi nó xuống entity** | grep |
| ⓪.2 | Món hạt giống có **cả hai**: `id='hat-giong:<uuid>'` và `matId=<uuid>` (`kho-mo-dau.ts:230`) | đọc `thanhDef` |
| ⓪.3 | Hạt giống **không có `ProductSpec`** ⇒ chọn nó ở 2D hôm nay thì entity **không nhận danh tính nào** (`store.ts:914` chỉ ghi khi `specId` có) | đọc |
| ⓪.4 | `Base` **chưa có** trường `matId` (`lib/cad/model.ts`) | grep |
| ⓪.5 | `getMaterial(<uuid>)` trả `resolvedVia:'uuid'` + `pbr` thật | `resolve.ts:88` |

**Bác được cái nào thì DỪNG và báo.** Bạn được phép bác lại tôi — lượt trước làm thế và đã đúng.

## QUYẾT ĐỊNH KIẾN TRÚC (T chốt, đừng mở lại)

**Thêm `Base.matId?: string` — UUID, TÙY CHỌN, THÊM VÀO.**

Vì sao đây là cách đúng, không phải cách tiện:
- **Không trộn không gian tên** — `specId` giữ nguyên vai thương mại, `matId` mang vai texture.
- **Không cần migration** — trường tuỳ chọn, `.idf` cũ thiếu nó vẫn mở bình thường. Đây là khuôn IF
  đã dùng (`elementType`/`storey` luôn optional).
- **Là EXTEND, không phải NEW** (B25) — trường đã có ở `MaterialDef`, chỉ chưa được mang đi.
- ⭐ **Là đường DUY NHẤT sáng được trên máy sạch**: không cần CSDL, không cần đăng nhập, không cần
  mạng — và cũng là đường duy nhất hôm nay **có texture thật**.

⚠️ Chú thích `model.ts:692` viết *"specId là hiện thân của matId"* — câu đó có **TRƯỚC** ADR 19/08
và nay **sai**. Đóng dấu đính chính tại chỗ, đừng xoá (luật: văn bản bị thay phải đóng dấu).

## THỨ TỰ THI CÔNG — mỗi bước một commit, tsc + test mới sang bước kế

1. **`Base.matId?: string`** ở `lib/cad/model.ts`, kèm chú thích nói rõ hai không gian tên.
2. **2D ghi danh tính**: `lib/cad/store.ts` (`applyMaterial` + `hatchMatId` cạnh `hatchSpecId`) và
   `CadCanvas.tsx:2316`. Lấy từ `MaterialDef.matId`. **Giữ nguyên mọi hành vi `specId`** —
   `undefined` ⇒ **GIỮ mã đang có, không xoá** (luật đã ghi ở `store.ts:893`).
3. **Cầu 2D→3D**: `SceneGroup.matId?` ở `cad-to-obj.ts`, mang đi **cùng khuôn `specId`** (khai ở
   interface · gán trong `object()` · đẩy trong `flushGroup()`). Đúng khuôn, không bịa khuôn mới.
4. **MỘT hàm tra dùng chung** cho **cả `Scene3DViewer.tsx` LẪN `lib/three/capture.ts`**:
   `group.matId → getMaterial → loadPbrTextures → buildPbrMaterial`.
   Thứ tự lùi: `matId` → (nếu có `ProductSpec` trong tay) `specId → .matId` qua
   `lib/materials/warehouse/catalog-link.ts:65` → **`colorHex` như hôm nay**.
   ⛔ `capture.ts` là người đọc **thứ ba** — bỏ nó thì **ảnh/video xuất ra vẫn phẳng**, mà đó mới là
   thứ khách nhìn.

## BỐN CHỖ DỄ HỎNG — nói trước vì mắt không thấy được

1. **Tái dùng**: N mặt cùng `matId` ⇒ **một** lượt tải ảnh, nên dùng chung một material.
2. **Dispose**: cleanup hiện `dispose()` theo từng mesh (`Scene3DViewer.tsx:1044`). Material dùng
   chung mà dispose theo mesh ⇒ dispose nhiều lần. Xem `material-preview.ts:318` đã giải thế nào.
3. **Bất đồng bộ**: cảnh phải **hiện ngay bằng `colorHex`** rồi nâng cấp khi ảnh về — không chặn
   khung đầu, không nhấp nháy trắng.
4. **`capture.ts` chụp đồng bộ** ⇒ phải `await` texture TRƯỚC khi dựng cảnh chụp.

## CHỨNG MINH — dùng ảnh chẩn đoán, KHÔNG dùng gỗ
`public/textures/chan-doan/chan-doan-512.png`. Gỗ hỏng vẫn trông như gỗ.
Quy ước **1 chu kỳ = 400×400 mm** ⇒ tường 4000 mm phải đếm **đúng 10 chu kỳ**.
Ô cờ mất ⇒ mất map · chữ `IF` ngược ⇒ lật · số góc sai ⇒ xoay · sọc bệt ⇒ sai tỉ lệ UV.

**HAI phép thử tách bạch, cấm gộp thành một ô xanh:**
**A · ĐÚNG** (pixel đúng chỗ/chiều/tỉ lệ) · **B · HỮU DỤNG** (kiến trúc sư phán được vật liệu:
thấy thớ, hướng vân, cỡ thật). Đúng mà vô dụng vẫn là chưa xong.
Kèm `tsc` sạch · test phạm vi xanh · **không rò bộ nhớ** (mở/đóng cảnh 5 lượt,
`renderer.info.memory.textures` không tăng tuyến tính) · **2 ảnh cặp trước/sau** vào `docs/ship/anh/`.

## RÀNG BUỘC
- ⛔ **KHÔNG đụng `lib/materials/*` và `components/materials/*`** — lane V5 đang giữ.
- ⛔ **CẤM `git add -A` / `git add .` / `git commit -a`** · cấm `stash`/`checkout`/`reset`.
  Chỉ `git add <đường-dẫn-của-mình>`; tệp lạ là của V5, để nguyên.
- ⛔ Không đụng biểu diễn **hatch vector** của mặt 2D — luật, không phải việc chưa làm.
- ⛔ Không chạy nút AI tốn credit. Không làm Nền/Wallgallery.
- ⛔ **Không PASS giả.** Chưa mở app thật thì nói rõ là chưa.

## BÁO CÁO
Khuôn 6 phần + **⑦b CHƯA CHẮC** (trống cũng phải ghi) + **⑦c HẠN DÙNG** +
**Ô KẾT (MẪU 6)**: ① vấn đề ② giải pháp ③ **rủi ro của chính giải pháp mình** ④ đạt được kèm
*"biết bằng cách nào"*.
