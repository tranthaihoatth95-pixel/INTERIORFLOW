# F2 — Ảnh → Spec ứng viên → người xác minh

> Gói thi công · `IF-MVP-FLOWS-001` · xác minh lại trên **HEAD `147f66a`**
> (lượt đo gốc ghi `ad26391`. Luồng này đã **đi tiếp** kể từ lượt đo — xem §8.)

---

## 1. Nhãn

**`EXISTS-PARTIAL`**

Chuỗi ảnh → ứng viên khối → bốn cửa duyệt G1-G4 → tờ spec → ghi `AssetRepresentation` thật trong
DB **chạy đủ và có ngữ pháp sự thật nghiêm túc** (SUY RA / NGƯỜI NHẬP / ĐÃ KIỂM). Cầu sang Trình
bày **đã có** (mới, sau lượt đo). Còn đứt ở hai chỗ: **không có đường đọc lại** (`GET` không ai
gọi), và **tờ spec chưa có payload thật** — nội dung nằm nhờ trong cột `provenance`.

---

## 2. Bản đồ chuỗi chạy

| chặng | file:dòng | trạng thái | loại |
|---|---|---|---|
| Chọn ảnh nguồn (bước SOURCE, ngoài năng lực gộp) | `components/ui/StageToolbelt.tsx:99-104` → `datAnhNguon` | CHẠY | OBSERVED |
| Chip `image-to-3d` mở cửa spec | `components/ui/StageToolbelt.tsx:120-121` (`setMoKhoi(true)`), render `:93` | CHẠY | OBSERVED |
| Component cửa spec | `components/ui/CuaAnhThanhSpec.tsx:123` | CHẠY | OBSERVED |
| Đề xuất khối 3D từ ảnh | `lib/capabilities/image-to-3d.ts:350` (`deXuatKhoi3D`), gọi ở `CuaAnhThanhSpec.tsx:191` | CHẠY | OBSERVED |
| Cổng chặn số-đo-hỏng (dùng lại, không viết mới) | `lib/capabilities/image-to-3d.ts:364,375,381` → `lib/vision/to-cad.ts:130` (`dimsAreUsable`) | CHẠY | OBSERVED |
| G1 · Đối tượng | `components/ui/CuaAnhThanhSpec.tsx:295-296` | CHẠY | OBSERVED |
| G2 · Kích thước | `components/ui/CuaAnhThanhSpec.tsx:398-399` | CHẠY | OBSERVED |
| G3 · Vật liệu & sản phẩm | `components/ui/CuaAnhThanhSpec.tsx:429-430` | CHẠY | OBSERVED |
| Cổng cấm-bịa-mã sản phẩm (máy không bao giờ điền) | `components/ui/CuaAnhThanhSpec.tsx:216-224` → `lib/capabilities/anh-thanh-spec.ts:151,161` | CHẠY | OBSERVED |
| G4 · Xuất spec | `components/ui/CuaAnhThanhSpec.tsx:470-471` | CHẠY | OBSERVED |
| Ký nhận ứng viên (trả bản MỚI, không sửa tại chỗ) | `lib/capabilities/image-to-3d.ts:505` (`nhanUngVien`), gọi ở `CuaAnhThanhSpec.tsx:227` | CHẠY | OBSERVED |
| Dựng tờ spec (ném lỗi nếu chưa duyệt) | `lib/capabilities/anh-thanh-spec.ts:244` (`taoSpecTuUngVien`), gọi ở `CuaAnhThanhSpec.tsx:232` | CHẠY | OBSERVED |
| Ngữ pháp sự thật ba nấc | `lib/capabilities/anh-thanh-spec.ts:229-234` (`nhanKichThuoc`) | CHẠY | OBSERVED |
| Cổng BOQ — chỉ nhận `measured`/`verified` | `lib/capabilities/image-to-3d.ts:601,625-633` (`xuatXuBoq`) | CHẠY | OBSERVED |
| Dựng bản ghi biểu diễn | `lib/capabilities/anh-thanh-spec.ts:300` (`banGhiBieuDien`) | CHẠY | OBSERVED |
| **`payloadRef` là con trỏ LOGIC, chưa có kho blob** | `lib/capabilities/anh-thanh-spec.ts:288-293` (tự khai), `:305` | **KHUYẾT, đã khai thật** | OBSERVED |
| POST ghi DB | `components/ui/CuaAnhThanhSpec.tsx:240` → `app/api/asset-representation/route.ts:37` | CHẠY | OBSERVED |
| Cổng kiểm `assetId` phải là `LibraryAsset` thật | `app/api/asset-representation/route.ts:60` | CHẠY | OBSERVED |
| Bảng lưu | `prisma/schema.prisma:347` (`AssetRepresentation`), `kind` `:352` · `payloadRef` `:356` · `truthLevel` `:363` · `provenance` `:366` | CHẠY | OBSERVED |
| Ghi mốc demo **đúng lúc** `200/201` thật | `components/ui/CuaAnhThanhSpec.tsx:248` → `lib/studio/demo-spine.ts:88` (`markDemoStep`) | CHẠY | OBSERVED |
| **Cầu Spec → Trình bày** *(MỚI so với lượt đo)* | `lib/present-editor/spec-present-handoff.ts:36` (`stash`), gọi ở `CuaAnhThanhSpec.tsx:39`; `:52` (`consume`), gọi ở `PresentEditor.tsx:64,428` | **CHẠY** | OBSERVED |
| `GET /api/asset-representation` | `app/api/asset-representation/route.ts:24` | **TỒN TẠI — 0 component gọi** | OBSERVED (grep toàn `app/ components/ lib/`) |
| Chân "CAD candidate" đi TẮT — không qua spec, không ghi DB | `components/render-studio/ToolModeForm.tsx:974` (`buildFurnitureFromMeasurement`) → `:989` `st.addEntities` | CHẠY, **vòng ngoài** | OBSERVED |

---

## 3. Chỗ đứt chính xác

**Đứt A — REOPEN không chạy (đứt chính).**
`GET /api/asset-representation` (`route.ts:24`) đã viết xong, có filter, có `deletedAt`. Grep
toàn bộ `app/`, `components/`, `lib/` cho chuỗi `asset-representation`: **5 kết quả, tất cả là
comment hoặc lượt `POST` ở `CuaAnhThanhSpec.tsx:240`**. Không một component nào `fetch` cái `GET`
đó. Nghĩa là: dữ liệu **đi vào được DB nhưng không có đường đi ra**.

*Người dùng thấy gì:* duyệt xong 12 tờ spec cho một dự án, hôm sau mở lại — cửa G1-G4 trống trơn
như chưa từng làm gì. Không có danh sách, không có "spec đã lưu", không cách nào biết mình đã
duyệt cái ghế đó rồi. Kết quả thực tế: **duyệt lại từ đầu**, và mỗi lượt duyệt lại đẻ thêm một
hàng `AssetRepresentation` trùng nghĩa trong DB. Đứt này không chỉ mất việc — nó còn **âm thầm
làm bẩn dữ liệu**.

**Đứt B — tờ spec chưa có payload thật.**
`banGhiBieuDien` (`anh-thanh-spec.ts:300`) đặt `payloadRef = 'if:image-to-3d/<ungVienId>'` —
docstring `:288-293` **khai thẳng** đây là con trỏ logic, chưa phải đường dẫn tệp, và nội dung
thật đang nằm nhờ trong cột `provenance` (JSON chuỗi). Đây là khai thật đàng hoàng, không phải
nói dối. Nhưng hệ quả: không thể mở lại tờ spec ở dạng người đọc được, không thể xuất, không thể
gửi cho xưởng.

**Đứt C — chân CAD đi tắt.**
`ToolModeForm.tsx:974` gọi thẳng `buildFurnitureFromMeasurement` → `st.addEntities(built.entities)`
(`:989`). Đường này **không** đi qua `nhanUngVien`, **không** đi qua ngữ pháp sự thật,
**không** ghi `AssetRepresentation`. Cùng một món đồ, hai đường vào, một đường có ký nhận và một
đường không.

*Người dùng thấy gì:* dựng nội thất từ số đo trong Render Studio thì entity hiện ra ngay nhưng
không bao giờ xuất hiện trong bất kỳ danh sách spec nào — trong khi cùng thao tác qua cửa G1-G4
thì có. Hai đường cho cùng một việc, kết quả khác nhau, không có gì trên màn giải thích tại sao.

---

## 4. Lát mỏng nhỏ nhất kế tiếp

**Chỉ vá Đứt A. Đây là lát rẻ nhất trong cả ba luồng — endpoint đã viết xong rồi, chỉ thiếu
người gọi.**

Không bảng mới. Không migrate. Không route mới. Không đụng `payloadRef`.

**Sửa đúng 1 tệp: `components/ui/CuaAnhThanhSpec.tsx`.**

1. Thêm một `useEffect` lúc mount cửa: `fetch('/api/asset-representation?kind=spec&assetId=…')`
   → dựng state `daLuuTruoc: BanGhiDaLuu[]`.
2. Thêm một khối **"Spec đã duyệt cho ảnh này"** đặt **trên** G1 (trước khi người dùng bắt đầu
   duyệt lại) — mỗi dòng: đối tượng · `truthLevel` · thời điểm · ai ký. Đọc thẳng từ các cột đã
   có (`schema.prisma:352,363,366` + `verifiedBy`).
3. Khi danh sách **không rỗng**, hiện cảnh báo thật: *"Ảnh này đã có N tờ spec đã duyệt — duyệt
   tiếp sẽ tạo bản ghi thứ N+1."* Không chặn (người dùng có thể cố ý duyệt lại), chỉ **nói thật**.

**Cố tình KHÔNG làm ở lát này:**
- Không dựng kho blob cho `payloadRef` (Đứt B) — đó là lát riêng, cần quyết định nơi chứa.
- Không đụng `ToolModeForm.tsx` (Đứt C) — nối chân CAD vào spec là đổi hành vi một luồng đang
  chạy, không được gộp vào lát reopen.
- Không thêm nút xoá — `DELETE` đã có (`route.ts:82`) nhưng xoá là hành động phá, làm sau khi
  đọc đã chứng minh chạy.

---

## 5. Cờ + đường lùi

- **Cờ:** `NEXT_PUBLIC_IF_SPEC_REOPEN=1`. Mặc định **tắt**. Tắt ⇒ không `useEffect` nào chạy,
  không request nào phát, cửa G1-G4 y hệt hôm nay.
- **Đường lùi:** revert **1 tệp** (`components/ui/CuaAnhThanhSpec.tsx`). Lát này **chỉ đọc** —
  không ghi thêm hàng nào, không sửa hàng nào ⇒ **không có dữ liệu nào cần dọn ngược**. Đây là
  lý do nên làm nó trước tất cả các lát khác của F2.
- **Không đụng schema** ⇒ không migration.

---

## 6. Ba ca chứng minh trên runtime

Server đang chạy: **CHINH=3001**.

**Ca 1 — CA HÔM NAY TRƯỢT (bắt buộc).**
Đăng nhập, mở Studio, chọn một ảnh ghế. Mở chip `image-to-3d`. Đọc ảnh → G2 **gõ tay** cả ba số
(rộng/sâu/cao) → G4 bấm xuất spec, chờ báo lưu thành công. Reload cứng (**Cmd+Shift+R**), mở lại
đúng chip đó với đúng ảnh đó.
- **Hôm nay:** cửa trống trơn, không dấu vết nào của lượt vừa duyệt. Network tab: **0** request
  `GET /api/asset-representation`. ⇒ **TRƯỢT**.
- **Sau lát mỏng (cờ bật):** khối "Spec đã duyệt cho ảnh này" hiện **1** dòng, `truthLevel` =
  `verified` (vì cả ba chiều đều do người gõ lại), kèm tên người ký.

**Ca 2 — cổng ba nấc không bị lát reopen làm hỏng.**
Lặp Ca 1 nhưng ở G2 **chỉ gõ lại một chiều** (rộng), để nguyên sâu/cao.
- **Mong đợi:** dòng trong danh sách reopen ghi `truthLevel = inferred` (**không** phải
  `verified`) — đúng luật `schema.prisma:361-363`: bấm "Nhận" không tự nâng cả ba chiều. Nếu
  danh sách reopen hiện `verified` ⇒ đọc sai cột, dừng.

**Ca 3 — cảnh báo trùng nói đúng số.**
Sau Ca 1, duyệt lại **cùng ảnh, cùng đối tượng** thêm 2 lượt nữa. Reload.
- **Mong đợi:** danh sách hiện đúng **3** dòng, cảnh báo ghi đúng *"đã có 3 tờ spec đã duyệt"*.
  Số phải khớp `SELECT count(*) FROM AssetRepresentation WHERE deletedAt IS NULL` cho asset đó.
  Sai số ⇒ filter query sai.

**`NOT ASSESSED`:** hành vi khi số bản ghi lớn (>200 cho một asset) — `route.ts:29` dùng
`findMany` nhưng phiên này chưa đọc phần phân trang/`take`. Trước khi bật cờ rộng phải xác minh
có trần trả về, nếu không danh sách sẽ kéo cả nghìn dòng vào cửa.

---

## 7. Rủi ro nếu làm sai thứ tự

- **Dựng kho blob cho `payloadRef` (Đứt B) trước khi có reopen** — bỏ công lưu payload nặng vào
  một nơi mà không màn nào đọc. Lặp đúng lỗi đang mắc: hạ tầng ghi chạy, đường đọc trống. Reopen
  **phải** đi trước, vì nó là thứ chứng minh dữ liệu đang lưu có ai dùng.
- **Nối `ToolModeForm.tsx` (Đứt C) vào spec trước khi có reopen** — bơm thêm nguồn ghi vào một
  bảng chưa ai đọc được, và làm chậm một luồng đang chạy mượt để đổi lấy dữ liệu vô hình.
- **Thêm nút xoá cùng lượt với reopen** — lát đọc đang là **không rủi ro dữ liệu**. Gắn `DELETE`
  vào là biến nó thành lát có rủi ro, và mất luôn đường lùi sạch ở §5.
- **Bỏ cờ, bật thẳng** — nếu chưa xác minh trần phân trang (`NOT ASSESSED` ở Ca 3), một dự án
  nhiều spec sẽ kéo cửa G1-G4 đứng hình.

---

## 8. Sai lệch so với lượt đo (đã xác minh lại trên `147f66a`)

🔴 **Thay đổi lớn nhất: luồng đã ĐI TIẾP kể từ lượt đo.** Lượt đo không có hai thứ sau, nay đã
tồn tại và chạy:

- **Cầu Spec → Trình bày** — `lib/present-editor/spec-present-handoff.ts` (LANE F, đóng gap
  `IF-LIVE-BRIDGE.md` mục MISSING "Spec Portal to Present"). Gọi từ `CuaAnhThanhSpec.tsx:39` và
  `PresentEditor.tsx:64,428`. Dùng lại đúng khuôn `sessionStorage` + fallback singleton của
  `lib/cad/present-handoff.ts`, không đẻ cơ chế thứ ba, không content-model mới.
- **Mốc demo ghi đúng lúc `200/201` thật** — `lib/studio/demo-spine.ts:88` (`markDemoStep`), gọi
  ở `CuaAnhThanhSpec.tsx:248` ngay sau khi POST trả về, không sớm hơn.

⇒ Câu *"tờ spec không đi tiếp được đâu"* của lượt đo **không còn đúng**. Nó đi sang Trình bày
được. Chỗ đứt còn lại là **đọc lại**, không phải đi tiếp.

| lượt đo ghi | mã thật `147f66a` | ghi chú |
|---|---|---|
| HEAD `ad26391` | HEAD **`147f66a`** | — |
| `StageToolbelt.tsx:119` điểm vào | render `CuaAnhThanhSpec` ở **`:93`**; nhánh mở ở **`:120-121`** (`c.id === 'image-to-3d' ? () => setMoKhoi(true)`) | `:119` là nhánh `visual-generate` |
| `CuaAnhThanhSpec.tsx:93` component | `export default function` ở **`:123`** (`:93` là hàm đọc tệp ảnh) | lệch 30 |
| `anh-thanh-spec.ts:245` `taoSpecTuUngVien` | **`:244`** | lệch 1 |
| `anh-thanh-spec.ts:299` `banGhiBieuDien` | **`:300`** | lệch 1 |
| `anh-thanh-spec.ts:227-237` ngữ pháp sự thật | `nhanKichThuoc` **`:229-234`** (docstring `:225`) | lệch nhỏ |
| `anh-thanh-spec.ts:289-292` payload tự khai | docstring `payloadRef` **`:288-293`**, giá trị đặt ở **`:305`** | lệch nhỏ |
| `image-to-3d.ts:350,364,505` · `to-cad.ts:130` · `route.ts:23,63` · `schema.prisma:347` · `CuaAnhThanhSpec.tsx:216-247,240` · `ToolModeForm.tsx:974` | ✅ **đúng nguyên** (`route.ts` GET thực ở `:24`, POST `:37`) | — |
| "`GET` tồn tại, 0 component gọi" | ✅ **xác nhận lại** — grep `asset-representation` toàn `app/ components/ lib/`: 5 kết quả, chỉ 1 lượt `fetch` và đó là **POST** | — |
