# ĐỀ XUẤT — RANH GIỚI ẢNH ↔ DỮ LIỆU CHO CHẶNG TRÌNH BÀY
**Trả lời phát hiện `SPEC-TANG-DU-LIEU-CAU-KIEN.md` §0.6 ("Trình bày nhận ẢNH, không nhận dữ liệu").**
**COWORK-TRÌNH lập 03/08. ĐÂY LÀ ĐỀ XUẤT CHỜ TỔNG DUYỆT — không tự chốt, không phải lệnh code.**
**Luật căn cứ:** VÒNG CUỐI `CHOT-TEN-CHANG-MODE-2026-08-03` — *"ba chặng là ba ỐNG KÍNH soi vào một nguồn
dữ liệu, không phải ba kho dữ liệu"* · `SPEC-TANG-DU-LIEU-CAU-KIEN` L1/L2/L5/L6 · §0d giữ-cái-đang-tốt.

---

## §1 · HIỆN TRẠNG — ĐỌC CODE THẬT, KHÔNG ĐOÁN (03/08)

| Đường | Code | Mang gì |
|---|---|---|
| Chặng 2D → Trình bày (nút "Đưa sang Present") | `components/cad/CadEditor.tsx:390-396` | `renderDocToDataURL(doc, 2000)` **+ `snapshot: JSON.stringify(doc)`** |
| Kho tạm | `lib/cad/present-handoff.ts:24-32` | `{version, dataUrl, snapshot, timestamp, fromRole, toRole}` |
| Bên nhận | `components/present-editor/PresentEditor.tsx:321` | gọi `consumeCadPresentHandoff()` — hàm này **trả ĐÚNG chuỗi `dataUrl`** (`present-handoff.ts:92-95`), rồi chèn 1 slide mới có `makeImage(dataUrl)` |
| Chặng Trình bày ↔ `lib/boq` | grep `computeBoq|api/boq` trong `components/` = **0 kết quả** | **chưa có đường nào** — BOQ engine chưa có người tiêu thụ ở UI |

**Ba sự thật rút ra (bổ sung cho §0.6, đều kiểm được):**
1. §0.6 nói đúng phần lớn, nhưng **payload CÓ mang `snapshot` Doc** — bên gửi đã đóng gói dữ liệu, **bên nhận
   vứt đi** (`consumeCadPresentHandoffPayload()` có sẵn, không ai gọi). Cửa đã mở, chưa ai bước qua.
2. **Kể cả nếu bên nhận đọc `snapshot`, VẪN SAI LUẬT** — `JSON.stringify(doc)` là **bản sao đông lạnh** trong
   sessionStorage: vẽ thêm 1 vùng tô ở 2D thì bản sao đó vĩnh viễn cũ. Một-nguồn không cứu được bằng cách
   chép "dữ liệu" thay vì chép "ảnh"; chép cái gì cũng vẫn là chép (**L6**).
3. Ảnh chèn vào deck hiện là **pixel chết**: không có gì nối nó về bản vẽ gốc, nên lời hứa `SPEC-SEMANTIC-MODEL`
   §6 *"sửa bản vẽ → mặt bằng trong deck tự cập nhật"* hiện **CHƯA có đường code nào thực hiện**.

---

## §2 · RANH GIỚI ĐỀ XUẤT — CÂU MỘT DÒNG
> **Ảnh là SẢN PHẨM, không bao giờ là NGUỒN.**
> Cái gì người xem *ngắm* → ảnh hợp lệ. Cái gì người xem *đọc để ra quyết định/ra tiền* → phải là dữ liệu sống.
> Phép thử: **"số/chữ này in ra rồi khách chỉ tay vào cãi được không?"** — cãi được thì nó phải sống.

### Bảng phân loại (đề xuất chốt)

| Nội dung trong hồ sơ | Loại | Vì sao | Đường đúng |
|---|---|---|---|
| Ảnh render 3D, phối cảnh, moodboard | 🟩 **ẢNH — hợp lệ, KHÔNG phải lỗi** | ảnh render CHÍNH LÀ sản phẩm cuối; không có "dữ liệu" nào đằng sau để đọc | giữ nguyên `lib/present-editor/handoff.ts` (Render→Present). **Không đụng.** |
| Ảnh chụp thực tế, ảnh nhập từ ngoài, texture | 🟩 **ẢNH** | không sinh ra từ Doc | giữ nguyên |
| Mặt bằng / mặt cắt / bản vẽ kỹ thuật dán vào deck | 🟨 **ẢNH CÓ CÔNG THỨC** | *nhìn* là ảnh, nhưng **sinh ra từ Doc** → phải làm mới lại được khi Doc đổi | §3 dưới |
| Bản đồ zone tô màu (`renderZoneMapToDataURL`) | 🟨 **ẢNH CÓ CÔNG THỨC** | như trên | §3 |
| **Diện tích phòng (m²)** | 🟥 **DỮ LIỆU SỐNG** | khách cãi được; sai số = sai tiền | đọc `doc.entities` (đường `lib/boq`) |
| **Mã vật liệu / SKU / NCC** | 🟥 **DỮ LIỆU SỐNG** | neo `HatchEntity.specId` → `ProductSpec` | như trên |
| **Đơn giá · hao hụt % · thành tiền · tổng** | 🟥 **DỮ LIỆU SỐNG** | tiền | như trên |
| **Số lượng / thống kê cấu kiện** (bảng cửa, bảng đồ) | 🟥 **DỮ LIỆU SỐNG** | đếm sai = đặt hàng sai | `lib/cad/schedule.ts` (đã có `buildSchedule`) |
| Bảng vật liệu A3: **ảnh mẫu vật liệu** | 🟩 ẢNH | đó là thị giác | ATLAS ảnh |
| Bảng vật liệu A3: **tên/mã/NCC/giá dưới ảnh** | 🟥 DỮ LIỆU SỐNG | khách gọi NCC theo mã in trên đó | `atlasRecordId` → ProductSpec |
| Văn bản: biến `{{tổng_tiền}}`, `{{diện_tích}}` | 🟥 DỮ LIỆU SỐNG | đã đúng hướng trong `SPEC-TRINH-VANBAN-EDITOR` | giữ |
| Tiêu đề slide, chữ trang trí, hình khối | 🟩 nội dung của chính deck | không thuộc Doc | giữ |

**Ranh giới ở đâu:** đúng chỗ **"nội dung này có phải là HÀM của Doc không"**.
- Không phải hàm của Doc (ảnh render, chữ, ảnh chụp) → ảnh/nội dung riêng, hợp lệ, **không sửa gì cả**.
- Là hàm của Doc **và người ta ĐỌC nó** (số, mã, tiền) → cấm chụp ảnh, phải derive mỗi lần hiện.
- Là hàm của Doc **nhưng người ta chỉ NGẮM nó** (bản vẽ dán vào deck) → cho phép giữ pixel để render/xuất nhanh,
  **nhưng phải giữ kèm CÔNG THỨC để dựng lại**, và phải biết mình đang cũ.

---

## §3 · CÁCH SỬA — 3 việc, không việc nào đập cái đang chạy (§0d)

### T1 · Ống kính dữ liệu cho Trình bày (giải phần 🟥) — quan trọng nhất
Đúng bằng việc **B0** của `PHIEU-TRINH-BOQ-EDITOR.md`: hàm `getProjectDoc(projectId)` đọc **Doc sống**
(`useCadStore` → rơi về `loadSheets(userId,'/cad-editor',projectId)`), rồi mọi bảng số của chặng 3 derive từ đó
bằng **hàm thuần** (`computeBoq` / `buildSchedule`) — **L2**.
- CẤM: `dataUrl`, `snapshot`, `syncDocToPresent`, copy `doc` vào state của deck.
- Không cần sửa `present-handoff.ts` để làm việc này — nó là đường ẢNH, để yên.

### T2 · Ảnh dẫn xuất phải mang công thức (giải phần 🟨)
Tái dùng **cơ chế đã có**, không phát minh: `deck.linkedAssets` + `setLinkedAssetSrc`
(`lib/present-editor/linked-assets.ts:122`, `ImageElement.assetId` — `model.ts:294`).
- Thêm field **additive** `LinkedAsset.recipe?: { kind: 'cad-plan' | 'zone-map'; projectId: string; sheetId?: string; widthPx: number }`.
  Deck cũ không có field → chạy y hệt trước (đúng khuôn additive cả repo đang dùng).
- Khi bấm "Đưa sang Present": ngoài `makeImage(dataUrl)`, đăng ký asset kèm `recipe`.
- UI: nút **"Làm mới từ bản vẽ"** → `getProjectDoc` → `renderDocToDataURL(doc, recipe.widthPx)` → `setLinkedAssetSrc`
  ⇒ **mọi slide dùng ảnh đó cập nhật một lượt** (cơ chế linked-asset vốn đã làm được).
- Chỉ dấu "ảnh cũ": so `boqFingerprint(doc)` (`lib/boq/cache.ts:31` — rẻ, đã có) với vân tay lưu lúc render;
  khác nhau → chấm `--warning` + chữ *"Bản vẽ đã đổi từ lúc chèn ảnh"*. **Không tự động render lại** (L5:
  không ghi ngược/tự đổi sau lưng; người dùng bấm mới đổi).
- **Bỏ hẳn `snapshot: JSON.stringify(doc)`** khỏi `present-handoff` khi T2 xong: giữ một bản Doc đông lạnh trong
  sessionStorage vừa vô dụng (không ai đọc) vừa mời gọi phiên sau dùng sai. Xoá là **giảm** bản sao, không phải
  mất tính năng — đúng L1/L6. *(Xoá field ⇒ phải theo §1 sổ chống rớt: ghi 1 dòng lý do, không xoá lặng.)*

### T3 · Không làm — chặn phình
❌ Không dựng "kho dữ liệu của chặng Trình bày". ❌ Không hàm `sync*` giữa chặng. ❌ Không đọc `snapshot` để lấy số
(sai kiểu tinh vi hơn: vẫn là bản sao). ❌ **Không đụng Deck editor đang chạy tốt** — Deck vẫn là editor ảnh/chữ
tự do, T1/T2 chỉ THÊM đường, không đổi luồng cũ (§0d).

---

## §4 · NGHIỆM THU RANH GIỚI (đo được, dùng cho audit sau)
| # | Kiểm | Đạt khi |
|---|---|---|
| R1 | `grep -rn "dataUrl\|snapshot" components/present-editor/boq/ components/present-editor/*material*` | **0** — không màn số nào ăn ảnh |
| R2 | Sửa 1 vùng tô ở 2D → mở lại bảng BOQ/A3 ở chặng 3 | số đổi theo, không cần thao tác trung gian nào |
| R3 | Sửa bản vẽ sau khi đã dán mặt bằng vào deck | ảnh **hiện cảnh báo "đã đổi"** + nút Làm mới chạy đúng |
| R4 | Ảnh render 3D dán vào deck | **KHÔNG** cảnh báo gì (không phải hàm của Doc — không được làm phiền) |
| R5 | `grep -rn "syncDocTo\|syncPresent" lib/ components/` | 0 |

## §5 · TREO — cần TỔNG/Hoà quyết
| # | Câu hỏi | Ảnh hưởng |
|---|---|---|
| 1 | Đồng ý bỏ `snapshot` khỏi `present-handoff` (T2) chứ? Đây là field do phiên khác thêm 23/07 với ý "đóng băng chống mất khi sửa song song" — bỏ là **lật ý đó**, nên không tự quyết | T2 |
| 2 | Dự án nhiều bản vẽ: ảnh mặt bằng dán vào deck neo theo **sheet nào**? (`recipe.sheetId`) — trùng câu hỏi §E-1 phiếu BOQ | T2, BOQ B0 |
| 3 | Có nên đưa T1/T2 vào **P7** của `SPEC-TANG-DU-LIEU-CAU-KIEN` §9 (đang ghi "Trình bày đọc thẳng Doc — G4, sau P5") hay chạy song song? P7 hiện phụ thuộc P5 (RoomEntity) — nhưng T1 **không cần** RoomEntity (BOQ chỉ cần `HatchEntity.specId`) ⇒ đề xuất **T1 chạy được NGAY, không chờ P5** | thứ tự việc toàn hệ |

*COWORK-TRÌNH 03/08. Đề xuất, chưa chốt. Append-only.*
