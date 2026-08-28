# F3 · mắt xích `.idfc → 3D` — ĐO, chưa sửa

`IF-F3-VERTICAL-SLICE-001` · gói `IDF-IF-PACKET-003` · đo 28/08/2026 · HEAD `dcfa886`
Trạng thái: **OBSERVED** — đây là phép đo, không phải đề xuất kiến trúc.

## Vì sao đo trước

Lát F3 (`.idfc → 2D → 3D → BOQ → Present → export → mở lại`) có sáu mắt xích. Tôi đã ghi
`.idfc → 3D` là **mắt đứt hoàn toàn** dựa trên cảm giác, chưa đo. F-20 xảy ra đúng vì tôi dựng
một câu chuyện nghe hợp lý rồi không kiểm nó. Đây là phép kiểm.

## OBSERVED

`Sensitivity`: `internal` · `Scope`: trả lời *"tham số 3D của một cấu kiện `.idfc` có tới được
cảnh 3D không"*. **Không** trả lời *"3D của IF tốt tới đâu"* — đó là câu khác.

| | dữ kiện | neo |
|---|---|---|
| `EV-030` | `.idfc` **có** chỗ khai 3D: `IdfcGeom3d { heightMm, bevelMm, matId, pbr }` | `lib/cad/idfc.ts:160` |
| `EV-031` | **Ba nơi GHI** `geom3d`: nhập hồ sơ nhà sản xuất · dựng từ ảnh · tấm Thư viện | `manufacturer-import.ts:429` · `from-photo.ts:136` · `LibrarySheet.tsx:1262` |
| `EV-032` | **ĐÚNG MỘT nơi ĐỌC** `geom3d`, và nó chỉ lấy `pbr`/`matId` để vẽ **ô xem trước vật liệu trên tấm Thư viện** | `LibrarySheet.tsx:504` |
| `EV-033` | ⇒ `geom3d.heightMm` có **0 nơi đọc** trong toàn repo | grep `geom3d` trên `lib/ components/ app/`, trừ `idfc.ts` · `*.test.*` · `idfc-seed/` |
| `EV-034` | Cảnh 3D lấy chiều cao nội thất từ `furnitureHeightMm(def.id)` — bảng **dựng sẵn 46 block**, tra theo `def.id`, không theo cấu kiện | `lib/three/cad-to-obj.ts:748` · `BLOCK_MAP` `furniture.ts:643` |
| `EV-035` | Chú thích tại chỗ đó tự khai lý do: *"đồ đạc không khai `heightMm`, lấy nó sẽ là bịa"* | `cad-to-obj.ts:742-744` |
| `EV-036` | `blockFootprint()` trả `null` khi `BLOCK_MAP[b.block]` không có ⇒ block lạ **không sinh hình 3D nào** | `cad-to-obj.ts:466-468` |
| `EV-037` | Đường thả một món `.idfc` là `via:'idfc'` → **làm phẳng `prims`** thành đường rời, `keepsIdentity: false` — **không** dựng `BlockEntity` | `library-item-resolve.ts:67,181` |

## INFERENCE

`EV-037` + `EV-034` + `EV-036` ⇒ một cấu kiện `.idfc` thả xuống bản vẽ trở thành **đường rời**;
cảnh 3D chỉ đùn khối nội thất từ `BlockEntity` **có trong `BLOCK_MAP`** ⇒ cấu kiện ấy **không sinh
ra khối 3D nào**. `EV-033` ⇒ chiều cao nó tự khai cũng không ai đọc.

⇒ **Mắt xích đứt là THẬT.** Nhưng đứt **khác** chỗ tôi tưởng: không phải "3D chưa có" — 3D có và
chạy (`docToObjScene` đùn tường, sàn, nội thất). Đứt ở chỗ **`.idfc` không đi vào được đường đó**.

⚠️ `EV-035` đáng chú ý hơn cả: chú thích ấy **đúng vào lúc nó được viết** — khi ấy chỉ có 46 block
dựng sẵn, không cấu kiện nào tự khai chiều cao, nên đọc `heightMm` đúng là bịa. `.idfc` đã làm câu
đó **hết đúng**: nay có một nguồn khai báo thật. Đây là loại nợ nguy hiểm nhất — **một quyết định
đúng, không ai sai, và không ai đi xem lại khi tiền đề đổi.**

## PROPOSED — chưa làm, cần Design duyệt phần nhìn thấy

**① Thang ưu tiên chiều cao**, cùng khuôn `docToObjScene` đã dùng cho tường (*"khai báo thắng suy
đoán"*, `cad-to-obj.ts:572`): `geom3d.heightMm` của cấu kiện → `entity.heightMm` → `furnitureHeightMm(def.id)`.
Suy đoán phải gắn cờ `inferred`, y như tường.
**② Cấu kiện `.idfc` cần một đường vào 3D không qua `BLOCK_MAP`** — đùn `prims` theo `heightMm`.
⚠️ Đây là **hình mới xuất hiện trong cảnh**, tức bề mặt người dùng nhìn thấy ⇒ **Design duyệt trước**
(luật 3). Không tự làm.
**③ Không sinh được khối thì phải NÓI**, không im lặng bỏ — cùng luật với `warnings[]` của tường.

## NOT ASSESSED

· `matId` → vật liệu thật trong cảnh 3D (chỉ đo `heightMm`).
· `bevelMm` — 0 nơi ghi, 0 nơi đọc; chưa rõ có phải trường chết.
· Đường `via:'blockdef'` (món khớp được BLOCK_MAP): chưa đo cấu kiện `.idfc` **có** `blockId` khớp.
· Hiệu năng khi đùn `prims` số lượng lớn.
