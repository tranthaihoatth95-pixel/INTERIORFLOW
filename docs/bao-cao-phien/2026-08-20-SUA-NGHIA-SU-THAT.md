# 20/08 — SỬA NGHĨA SỰ THẬT (Measured · Verified · Human Override · Inferred)

Lane: **Ảnh→Spec, tầng ngữ nghĩa**. Phạm vi ghi: `lib/capabilities/image-to-3d.ts` (+test) ·
`lib/capabilities/anh-thanh-spec.ts` (+test) · `lib/vision/single-view-metrology.ts`.
⛔ KHÔNG chạm `components/ui/**`, KHÔNG đổi bố cục/vật liệu/cách bày, KHÔNG git, KHÔNG prisma.

---

## ⓪ TIỀN ĐỀ — kiểm trước khi làm

| Tiền đề của phiếu | Kiểm tại nguồn | Kết |
|---|---|---|
| `nhanUngVien` đang chốt *"chỉ chiều người GÕ LẠI SỐ mới verified"* | `image-to-3d.ts:346-362` cũ, `basis` ghi *"người nhập tay xác nhận đúng số máy"* | ✅ đúng |
| Test cũ khoá nghi thức đó | `image-to-3d.test.ts:129-136` *"gõ lại đủ ba chiều → cả ba verified"* + *"gõ lại ĐÚNG số máy vẫn tính là đã kiểm"* | ✅ đúng |
| Trường `basis` đã tồn tại, đang là chuỗi tự do | `KichThuocCoNguon.basis: string` | ✅ đúng |
| Bộ `measured\|inferred\|verified` dùng rộng | `ProvenanceFlag` (`lib/idfc-import/from-photo.ts:35`) — bộ chung, cấm đẻ bộ thứ tư | ✅ đúng |
| Nợ metrology: bậc 2 gắn `measured` cho số trong sách | `single-view-metrology.ts:851` `kind:'measured'` + `basis:"Cao chuẩn nghề — chưa có neo thật"` | ✅ đúng, **và rộng hơn phiếu tưởng** (xem §5) |

---

## ① CHỌN (a) HAY (b) — **CHỌN (b)**, và siết chặt hơn đề bài

**(b): giữ ba nấc, ghi ĐƯỜNG ĐI vào provenance.** Lý do, theo thứ tự sức nặng:

1. **(a) phá một bộ từ vựng đang gánh ~509 chỗ.** Thêm giá trị thứ tư vào `ProvenanceFlag` là
   sửa `.idf`/`.idfc` đã ghi ra đĩa ⇒ đòi bảng nâng cấp; và nó phá đúng luật *"cấm đẻ bộ từ vựng
   thứ tư"* mà chính lane này ghi trong docstring.
2. **Bốn nghĩa không cùng một trục.** `measured/inferred/verified` trả lời *tin được tới đâu*;
   `human-override` trả lời *ai đưa ra*. Nhét chúng vào một enum là ép hai câu hỏi khác nhau
   chung một ô — sau này sẽ lòi ra ca "người ghi đè lên một số đo được" mà enum một trục không
   biểu diễn nổi.
3. `basis` đã tồn tại ⇒ (b) là **EXTEND**, đúng thang B25 (LOOK INSIDE → EXTEND, không NEW).

**Siết thêm ngoài đề bài — và đây là phần đắt nhất:** `flag` không còn được gán bằng tay ở bất kỳ
đâu. Nó **luôn** là `nacTuCanCu(canCu)`.
⇒ *"human-override mang nhãn measured"* trở thành **điều không biểu diễn nổi trong kiểu dữ liệu**,
chứ không phải điều phải nhớ để đừng làm. Bảng `NAC_THEO_CAN_CU` là chỗ duy nhất quyết định nấc.

**🔧 Một chỗ đi khác chữ của phiếu, khai thẳng:** phiếu viết `basis: 'human-override' | …`. Tôi
**giữ `basis` nguyên vai chuỗi văn xuôi** và đặt căn cứ vào trường mới `canCu: CanCuSuThat`. Lý do
đo được: `components/ui/CuaAnhThanhSpec.tsx:375` render `{k.basis}` nguyên văn cho người đọc — biến
nó thành mã enum sẽ hiện chữ `human-override` lên màn của lane đang chạy, mà file đó tôi bị cấm
chạm. Tinh thần (b) giữ nguyên: không đẻ từ vựng thứ tư, đường đi được ghi có kiểu.

---

## ② BỐN NGHĨA ĐÃ TÁCH CHƯA — RỒI, thành 7 căn cứ trên 3 nấc

| Căn cứ (`CanCuSuThat`) | Nấc | Nghĩa |
|---|---|---|
| `deterministic-metrology` | measured | đo tất định trên hình học đã hiệu chỉnh (bậc 4) |
| `calibrated` | measured | thang đo từ neo/kích thước thật đã hiệu chỉnh |
| `trusted-geometry` | measured | hình học đáng tin sẵn có (CAD · `.idfc` · bản vẽ đã ký) |
| `human-confirmed` | verified | người xác nhận **tường minh, có nêu tham chiếu** |
| `human-override` | verified | người **chủ động cung cấp/ghi đè** giá trị |
| `image-estimate` | inferred | ước lượng từ ảnh/AI/dựng lại |
| `category-prior` | inferred | dải chuẩn nghề — một con số trong sách |

`KichThuocCoNguon` nay mang `canCu` (hiện hành) + `canCuMay` (máy đi đường nào lúc đầu). Người ký
**không xoá được** dấu vết máy — luật ⑤ nay có máy canh chứ không chỉ có docstring.

---

## ③ ĐƯỜNG LÊN VERIFIED — **HAI**, và không đường nào là gõ lại số cũ

| Đường | API | Giá trị | Căn cứ |
|---|---|---|---|
| người **cung cấp số** (Sửa · Nhập kích thước đã biết) | `nhanUngVien(uv,{sua:{…Mm}})` | số của người | `human-override` |
| người **xác nhận có tham chiếu** | `nhanUngVien(uv,{xacNhan:{sau:'catalogue tr.41'}})` | **giữ nguyên số máy** | `human-confirmed` |
| để nguyên | — | giữ nguyên | căn cứ máy, **không đổi nấc** |

Đường thứ tư — **Hiệu chỉnh lại** — cố ý KHÔNG ở cửa duyệt: nó quay về `deXuatKhoi3D()` với neo
mới, và số ra là số **MÁY** đo (`calibrated`), không đi qua tay người. Khai trong `HANH_DONG_DUYET`
(4 mục: id · nhãn · mô tả · căn cứ) để mặt tiền có một nguồn, không tự chế nhãn.

**Ba thứ đã chết:**
- `basis` không còn câu *"người nhập tay xác nhận đúng số máy"* — có test canh.
- ⛔ **Không bắt gõ lại từng chiều.** Ca thật: `uv` bậc 3 có rộng/cao đo được, chỉ sâu là suy ⇒
  người đưa **một** số cho sâu là vào BOQ. Trước đây phải gõ đủ ba.
- Xác nhận **suông** (tham chiếu rỗng/toàn khoảng trắng) → **ném lỗi**. Không có tham chiếu thì
  không có xác minh, chỉ có một cái gật đầu — đúng thứ vừa bị bác.
- Số người gõ mà hỏng (≤0/NaN) → ném lỗi **kèm tên chiều**, thay vì nuốt im lặng rồi vẫn báo "đã nhận".

---

## ④ BOQ GIỮ DẤU VẾT THẾ NÀO

`duocVaoBoq()` đổi từ `{duoc,lyDo}` thành `CongBoq{duoc, lyDo, xuatXu[3], canhBao?}`.

- `INFERRED` vẫn **không bao giờ** vào BOQ (phần này code đang đúng — giữ nguyên).
- `VERIFIED`/`HUMAN OVERRIDE` **được** vào — người cung cấp giá trị thì giá trị đó dùng được.
- ⛔ **CẤM dán lại nhãn `MEASURED`**: `xuatXu` luôn trả đủ **ba** chiều (kể cả khi cổng ĐÓNG), mỗi
  dòng có `canCu` + `flag` + `nhan` lấy từ `nhanXuatXu()` — chỗ **duy nhất** đặt tên cho căn cứ.
  `human-override` → `"người nhập tay"`, tuyệt đối không chứa chữ "đo được". Có test canh.
- `canhBao` xuất hiện khi có số của người, và nói **thẳng** ca xấu nhất:
  *"Riêng rộng là ghi đè lên số máy VỐN ĐÃ đo được — ưu tiên số đo nếu không có lý do rõ."*
  Đó là **ưu tiên MEASURED** ở dạng máy nói ra được, không phải một câu trong tài liệu.
- Dấu vết xuống tới **bản lưu**: `banGhiBieuDien().provenance` nay chứa `canCu`/`canCuMay`/`xuatXu`
  từng chiều — sau khi mọi giao diện đổi, đây là chỗ còn tra được "số này người nhập hay máy đo".
- Nhãn màn: `nhanKichThuoc()` tách `verified` làm hai — **`NGƯỜI NHẬP`** (human-override) ≠
  **`ĐÃ KIỂM`** (human-confirmed). Gộp chúng là xoá đúng thứ người đọc hồ sơ cần biết.
  Tham số `canCu` optional ⇒ lane UI đang chạy compile nguyên, và nhãn tự đúng theo.

---

## ⑤ NỢ METROLOGY — sửa, và **rộng hơn phiếu nêu**

Phiếu nêu chiều **Cao**. Đo tại nguồn thì **cả W lẫn H của bậc 2** đều sai:
`tier2` lấy toàn bộ thang mm/px từ **chiều cao chuẩn nghề**, nên `width = tỉ lệ px × cao-chuẩn-nghề`
thừa hưởng nguyên cái giả định đó chứ không đo được gì hơn. ⇒ sửa **cả hai** về `inferred`
(`single-view-metrology.ts:838-857`), kèm docstring nói vì sao.

Độ tin 65% **giữ nguyên** — bậc 2 thật sự đọc ảnh (tỉ lệ khung bao là tin thật lấy từ pixel), nó
tốt hơn bậc 1. Nhưng *"tốt hơn ước lượng"* không phải *"đo được"*. Bậc 3 trở lên mới có neo thật.

**Hệ quả đã đo:** không test nào khẳng định bậc 2 = `measured` (kiểm `single-view-metrology.test.ts`
[5a]/[5b]/[5c] — chỉ khẳng định *số hữu hạn > 0* và *kind hợp lệ*). `measurementConfidence()` và
`ffe` tụt về `inferred` cho bậc 2 — đúng hơn bản cũ. Node `vision.measureobject` không đổi hợp đồng,
chỉ đổi cờ nó báo. Toàn bộ suite xanh sau khi sửa.

---

## ⑥ TEST — sửa 4 ca khoá hành vi sai, thêm 1 khối 24 khẳng định

**Sửa (ghi lý do tại chỗ, đúng bài học Hough 15/08 — *test khoá hình dạng sai thì nó che bug*):**

| # | Ca cũ | Nay |
|---|---|---|
| 1 | `image-to-3d.test.ts` *"gõ lại đủ ba chiều → cả ba verified"* | *"người cung cấp **một** số → chiều đó verified qua human-override, KHÔNG phải gõ lại hai chiều kia mà vẫn vào BOQ"* |
| 2 | *"gõ lại ĐÚNG số máy vẫn tính là đã kiểm"* | ⛔ đảo ngược: *"gõ lại đúng số máy = **người nhập tay**, và basis KHÔNG còn câu nghi thức nào"* |
| 3 | `anh-thanh-spec.test.ts` *"nhãn đã kiểm nói ĐÃ KIỂM"* | tách hai: `human-confirmed`→ĐÃ KIỂM · `human-override`→NGƯỜI NHẬP, và **không** chứa ĐO ĐƯỢC |
| 4 | *"gõ lại đủ ba chiều → cả ba ĐÃ KIỂM"* | *"người đưa đủ ba số → verified nhưng mang nhãn NGƯỜI NHẬP + BOQ có cảnh báo xuất xứ"* |

**Thêm** — khối `①b bốn nghĩa canonical`, gồm đúng ba khẳng định phiếu đòi:
- mỗi đường lên VERIFIED đều chạy được (4 tổ hợp ký: để-nguyên · cung-cấp-số · xác-nhận · trộn);
- `basis` **không bao giờ rỗng** khi đã lên verified, và căn cứ phải là một trong hai đường người;
- 🔴 **human-override không bao giờ bị dán nhãn measured** — quét mọi chiều × mọi đường ký;
- kèm: `flag === nacTuCanCu(canCu)` là bất biến giữ qua cả bốn đường · bảng ánh xạ không lỗ ·
  vẫn đúng **3** nấc (không đẻ nấc thứ tư) · `canCuMay` không bị ghi đè · BOQ trả xuất xứ đủ 3
  chiều kể cả khi chặn · `HANH_DONG_DUYET` không hành động nào là *"gõ lại đúng số cũ"*.

---

## ⑦ VERIFY

| | |
|---|---|
| `npx tsc --noEmit` | **0 lỗi** |
| `image-to-3d.test.ts` | **99 pass · 0 fail** (trước: 75) |
| `anh-thanh-spec.test.ts` | **48 pass · 0 fail** (trước: 42) |
| Toàn suite (khuôn nhà `sucrase-node`, không vitest) | **0 fail** |
| `npm run soi:contract` | 21 có dây · 1 chờ dây · **0 lệch** |
| `npm run check:chot` | 9 luật · **0 vi phạm** |

⚠️ `app/api/project-files/[id]/file/route.test.ts` đỏ **một lần** trong lượt chạy song song
(`LibraryAsset: đếm trước === đếm sau`) — chạy lại một mình **11/11 PASS**. Đó là **đua ghi
`dev.db` giữa các lane**, không phải lượt này (lượt này 0 dòng chạm DB/Prisma).

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- **Chưa mở app thật một dòng nào.** Mọi kết luận là đọc mã + chạy test thuần. Riêng
  `CuaAnhThanhSpec.tsx` tôi chỉ ĐỌC để không phá hợp đồng; **chưa nhìn nó render sau đổi nhãn** —
  ô kích thước nay sẽ hiện `NGƯỜI NHẬP` thay vì `ĐÃ KIỂM` khi người gõ số. Đó là ý đồ, nhưng **chưa
  ai xem bằng mắt**.
- **Câu chữ trong UI nay lệch với luật:** `CuaAnhThanhSpec.tsx:365` còn ghi *"Gõ lại số nào thì số
  đó thành đã kiểm"* — nghi thức đã bị bác nhưng chữ còn đó. Ngoài vùng ghi ⇒ **khai nợ**.
- **`canCuTuMay()` phân biệt `category-prior` ↔ `image-estimate` bằng regex `/chuẩn nghề/` trên
  văn xuôi `basis`.** Chạy đúng với mọi `basis` hiện có (đã đọc hết 4 bậc), nhưng nó phụ thuộc câu
  chữ — ai sửa lời trong `single-view-metrology.ts` mà không biết luật này thì căn cứ tụt sai.
  Cách đúng về sau: cho `MeasurementValue` mang thẳng một trường căn cứ. Chưa làm (đụng tầng
  `lib/vision` rộng hơn phiếu).
- **`trusted-geometry` khai nhưng chưa có đường nào tới nó** — nó dành cho số đến từ CAD/`.idfc`,
  chưa nối ở lượt này. Khai thật thay vì bỏ khỏi union rồi phải thêm lại.
- Chưa thử trình đọc màn hình / `prefers-reduced-motion` — lượt này không đụng giao diện.

---

## ⑦c HẠN DÙNG KẾT LUẬN

- Con số **~509 chỗ dùng `ProvenanceFlag`** là **chép lại từ sổ**, không phải phép đo của lượt này.
  Lập luận chọn (b) không phụ thuộc con số chính xác, nhưng đừng trích nó như số đo mới.
- Kết luận *"không test nào khoá bậc 2 = measured"* đúng **tại 20/08**; lane khác thêm test mới thì
  phải đo lại.
- Bảng `NAC_THEO_CAN_CU` là **hợp đồng**: thêm căn cứ mới thì phải khai nấc ngay tại đó, nếu không
  `tsc` đỏ (Record đủ khoá). Cố ý.

---

## 🔴 NỢ BÀN GIAO (ngoài vùng ghi, KHÔNG tự phá)

1. **`prisma/schema.prisma` — comment trên `AssetRepresentation.truthLevel` còn ghi luật đã chết:**
   *"chỉ chiều nào người GÕ LẠI SỐ mới được verified"*. Nay sai. Phiếu cấm sửa schema ⇒ để lại.
   Đây đúng họ *"văn bản bị thay phải đóng dấu tại chỗ, không im lặng bỏ hoang"* (luật 15/08).
2. **`components/ui/CuaAnhThanhSpec.tsx`** — cần lượt riêng để: sửa câu *"gõ lại số nào thì số đó
   thành đã kiểm"*; bày **bốn hành động** (nay mới chỉ có ô gõ số = Sửa/Nhập-đã-biết); thêm ô
   **tham chiếu** cho "Xác nhận"; hiện `boq.canhBao` + `boq.xuatXu` (đang chỉ đọc `duoc`/`lyDo`).
   Hợp đồng phía lib đã sẵn, UI chỉ việc đọc.
3. **`MeasurementValue` nên mang căn cứ có kiểu** thay vì để tầng trên suy bằng regex (xem ⑦b).
