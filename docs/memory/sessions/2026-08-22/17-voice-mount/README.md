# Wave 11–12 (Lane B) — HAI LỆCH ĐỎ + CẮM GIỌNG NÓI VÀO SURFACE THẬT

## 1 · Tổng quan
Đóng 2 lệch đỏ sổ frontier (**không build gì để chiều chữ nghĩa** — cả hai là **lỗi phép đo**), rồi
cắm Voice vào khẩu độ Vitals. Chứng minh trên app: câu **gõ** đi qua cửa thoại ghi THẬT vào
`/api/home/notes` — đúng kho QuickNotes đang dùng, neo đúng dự án.

## 2 · Hai lệch đỏ — phân loại **D (năng lực thật còn thiếu)**, lệch là artefact đo
| Entry | Máy thấy "code có rồi" vì | Sự thật |
|---|---|---|
| `vision-backbone-cuc-bo` | **một COMMENT** ở `lib/voice/nhan-dang.ts:14` chỉ NHẮC TÊN entry | 0 gói ML cục bộ. Chưa build |
| `xuong-hoa-van-parametric` | chữ `hoaVan` ở `lib/render-studio/form-recipe.ts` | Đó là **nhãn nhóm ý định** của BuildOp (hìnhChính·khoét·chiTiết·hoaVăn), **trùng CHỮ khác VIỆC** |

Sửa **bằng chứng**, không sửa mã sản phẩm: vision đòi `onnxruntime|InferenceSession`; hoa văn đòi
`lienMachTile|tileSeamless|hoaVanTile` (lát liền mạch — phần riêng thật của xưởng, 4 đích đều cần).
⇒ `soi:frontier` **0 lệch, exit 0**; cả hai về ⬜ đúng sổ.

### 🔴 Một lần tôi vá quá tay — ghi lại để không ai lặp
Tôi thử sửa **cả họ**: gỡ comment trước khi soi (*"nhắc tên ≠ thi hành"*). Kết quả: đỏ **2 → 7**,
xong-máy **76 → 70**. Thoạt nhìn như bắt được 6 màu-xanh-giả. Kiểm từng cái thì **ngược lại**:
IF **cố ý dùng `[marker: …]` trong comment làm mốc neo** (`present-magic-cua-vao`), và nhiều entry
trỏ vào tên tệp nằm trong docstring của chính tệp đó (`soi-tu-dien.mjs`, `scaffolder.ts` — **đều
tồn tại thật**). Gỡ comment là **giết một quy ước đang chạy**. ⇒ **Hoàn nguyên**, vá surgical.
Bài học: *sửa cả họ* chỉ đúng khi cả họ cùng một bệnh — ở đây không phải.

## 3 · Voice — cắm vào surface thật
**Không app riêng · không bong bóng trợ lý · không kho thoại riêng.** Neo ở khẩu độ Vitals (chốt
16/08: không nút micro thứ hai rải khắp app).

🔴 **Lỗi thật bắt được trong lúc cắm**: docstring `CuaGiongNoi.tsx` hứa *"không có micro thì cửa
vẫn nhận chữ GÕ — cùng một hợp đồng, cùng một đường đi (đó là điểm của cả lane này)"*. Đo:
`grep input` trong component = **0**. `nap()` gõ cứng `nguon: 'giong-noi'`, không nhận nổi nguồn
khác. **Lời hứa nằm trong docstring, không nằm trong mã** — sớm hơn một nấc so với bài học 16/08
*"có trong mã ≠ tới được người dùng"*.

Sửa: `nap(b, nguon = 'giong-noi')` + ô gõ đi **chung đúng những dòng đó**, khác **một tham số**,
không rẽ nhánh ⇒ mọi luật đã khoá cho giọng nói (phiếu xem trước · fail-closed · không kho riêng)
tự động áp cho chữ gõ, không viết lại lần hai.

## 4 · Bằng chứng app thật
| Đo | Kết quả |
|---|---|
| Nút **"Nói"** đứng cạnh ô "Hỏi Vitals…" | ✅ 1 nút, 0 lỗi trang |
| Gõ *"ghi chú chỗ này cần kiểm lại cao độ"* | POST `/api/home/notes` |
| Thân POST | `{"text":"ghi chú chỗ này cần kiểm lại cao độ","projectId":"cmsqu517r0001w9axbunx9m7m"}` |
| Đọc lại kho chung | 1 ghi chú, **khớp nguyên văn**, neo đúng dự án |
Ảnh: `artifacts/visual-review/master-completion/B1-thoai-cung-duong-go.png`.

## 5 · Chưa chắc / còn nợ
- ⛔ **Chưa ai nói vào micro thật.** Headless không có `SpeechRecognition`; đường transcript đã
  chạy qua cửa đúng, nhưng **nghiệm thu micro là việc của Hoà** (phần cứng).
- Chỉ khai cửa `ghiChu`. `soatDuyet`/`timKiem`/`yDinhThietKe` **cố ý không khai** — host này chưa
  có chỗ nhận; khai bừa là hứa suông rồi nuốt câu.
- Lệnh (`cad.*`) chưa thử qua cửa thoại trên app.

---

# Wave 13 (Lane B) — TÁCH QUYỀN SỞ HỮU: vỏ trình bày ↔ hợp đồng chức năng

## Việc
`components/home/widgets/VitalsPill.tsx` (241 dòng) đang giữ **business logic của Vitals** trong
một widget Trang chủ ⇒ Home không redesign được mà không đụng Voice/Vitals, và ngược lại.

## Tách theo ranh giới có sẵn, KHÔNG đẻ thư mục mới
Nhà canonical của Vitals là `components/studio/` — đã có `VitalsAperture` · `VitalsIcon` ·
`VitalsQuyDao` · `VitalsStateBadge` · `VitalsChatBubble` · `vitals-tin-hieu`. Và
`VitalsAperture.tsx:14` **đã khai sẵn tên** *"VitalsChatSurface, tách ra từ VitalsPill.tsx"* từ
trước — tệp chỉ chưa về đúng chỗ nó được khai. Nay về.

| | Trước | Sau |
|---|---|---|
| `components/home/widgets/VitalsPill.tsx` | 241 dòng · hội thoại + giọng nói + ghi chú + hợp đồng | **67 dòng · CHỈ vỏ trình bày** (Lane A) |
| `components/studio/VitalsChatSurface.tsx` | (không có) | **hành vi + `CuaNhan` + `nguCanhGiongNoi`** (Lane B) |
| `components/studio/VitalsAperture.tsx` | import vòng qua widget Trang chủ | đọc thẳng nhà canonical |

Trong vỏ có ghi **danh sách cấm nhận lại**: máy trạng thái giọng nói · ghi ghi chú · suy tín hiệu
địa điểm · định tuyến lệnh · quyết định miền — thấy một trong số đó mọc lại là đã trượt ranh giới.

## Bằng chứng app thật (sau tách)
Nút **Nói** còn · ô gõ cửa thoại còn · gõ câu → `POST /api/home/notes`
`{"text":"ghi chú kiểm lại cao độ sau khi tách","projectId":"cmsqu517r0001w9axbunx9m7m"}` · **0 lỗi trang**.
Ảnh: `artifacts/visual-review/master-completion/B2-sau-tach-quyen.png`.

## ⚠️ Điều Lane A cần biết khi nhận lại tệp
`VitalsPill` **không được mount ở đâu cả** — đo: 0 import ngoài chính nó, và `AppChrome` ở HEAD
cũng 0. Khẩu độ Vitals thay nó từ 17/08. Tức nó là **vỏ chưa có chỗ đứng**, không phải vỏ đang
chạy. Đây là hiện trạng CÓ TRƯỚC lượt này, không phải hồi quy của Lane B.

## Cổng
tsc 0 · npm test exit 0 · soi:frontier exit 0 · voice 20/20.
