# 04/09 · G4 · MOAT — NỐI LẠI DANH TÍNH TRÊN ĐƯỜNG UI

## 1 · Tổng quan

Đường người dùng thật ở chặng 2D **không mang danh tính vật liệu**: `applyMaterial()` chỉ đổi
nét vẽ, và vùng tô mới vẽ rơi xuống bản vẽ **không mã nào**. Máy móc xuôi dòng
(`replaceMaterialReferences` · `inspectMaterialImpact` · `computeBoq`) đã có đủ và có test, nhưng
`grep` trong `app/` + `components/` trả **0 nơi gọi** — *dây có, chưa cắm điện*.

Lượt này **CẮM ĐIỆN**, không xây engine nào. Kết quả đo trên app thật:
**13/13 khẳng định đạt**, gồm cả mắt LUẬT PASS (đóng hẳn trình duyệt → vào lại → vẫn đúng vật
liệu mới VÀ đúng con số mới). Máy canh thường trực **13 khẳng định** đã vào `npm test`.

---

## 2 · Ba mắt sau khi VÀO LẠI — đọc từ đâu, ra số bao nhiêu

Bằng chứng chạy: `docs/delivery/anh-duyet-mat/g4-danh-tinh/nghiem-thu-g4-moat-danh-tinh.txt`

| Mắt | Đọc TỪ ĐÂU | Giá trị đo được |
|---|---|---|
| ① **HÌNH** | `Doc.entities[].color` trong **IndexedDB** `interiorflow-sheets`, khoá `cmtm9hop…::/cad-editor::cmtmdaaws…` | `#b98a54` → **`#5a3a26`** |
| ② **DANH TÍNH** | `Doc.entities[].specId` cùng bản ghi IndexedDB đó | `ps-kiem-go-soi` → **`ps-kiem-go-ocho`** |
| ③ **CON SỐ** | `POST /api/boq/<projectId>` với CHÍNH `Doc` vừa đọc | dòng `specId=ps-kiem-go-ocho` · `thanhTien` = **68.817.600** |

Con số ③ tự kiểm được: `26,55 m² × 1,08 (hao 8%) × 2.400.000 = 68.817.600`. Diện tích **26,55 m²**
là hình học thật của vùng tô (tính từ toạ độ đỉnh trong `Doc`), không phải số gõ vào.

⚠️ **Không đọc chữ trên màn.** Màn hình nói *"vẫn còn"* không chứng minh gì — bản vẽ có thể đang
nằm thuần trong bộ nhớ. "Đóng hẳn" = `launchPersistentContext` trên hồ sơ đĩa rồi `.close()`;
`newContext()` bị cấm vì nó vứt IndexedDB lúc đóng, nên "mở lại" vô nghĩa **từ định nghĩa**.

---

## 3 · Nối ở đâu — và nó là CONNECT, không phải NEW

| # | Chỗ nối | tệp:dòng | Hạng |
|---|---|---|---|
| ① | `applyMaterial` mọc tham số thứ 6 `specId`; ghi xuống entity đang chọn + giữ làm mã cho nét kế tiếp | `lib/cad/store.ts:402` (khai) · `:851` (thân) | **CONNECT** |
| ② | `hatchSpecId` — mã "đang cầm", tách hẳn `hatchMaterialId` (tên để hiện) | `lib/cad/store.ts:279` | **EXTEND** (thêm trường trạng thái, 0 trường dữ liệu mới) |
| ③ | `replaceMaterial()` — vỏ mỏng gọi ĐÚNG `replaceMaterialReferences` đã có | `lib/cad/store.ts:413` (khai) · `:895` (thân) | **CONNECT** |
| ④ | `handleHatch` cho vùng tô mới mang sẵn mã | `components/cad/CadCanvas.tsx:2248` | **CONNECT** |
| ⑤ | Tấm vật liệu mọc mục **Kho vật liệu · gán mã** (nguồn danh tính duy nhất) | `components/cad/MaterialPalette.tsx` | **CONNECT** |
| ⑥ | Cửa duyệt mọc nút phạm vi rộng | `components/materials/MaterialImpactPreview.tsx` | **EXTEND** |
| ⑦ | Bộ nạp `ProductSpec` dùng chung mọc hình lát dày `MaterialPick` | `lib/library/spec-refs.ts` | **EXTEND** |

**Không mục nào là NEW** ⇒ không phải trình bằng chứng phủ định 6 mục (§B25).
⑦ chọn EXTEND thay vì mở tệp mới **có lý do**: hai danh sách phải đến từ **CÙNG một lượt fetch** —
ô chọn vật liệu mà tự fetch riêng thì nó và `resolveLibraryItem` có thể nhìn hai ảnh chụp khác nhau
của kho, đúng loại lệch chính tệp đó sinh ra để chống. `toSpecRefs` giữ **nguyên 2 trường**
(có test khoá điều đó, 11/11 vẫn xanh).

🔴 **Ràng buộc 2.1.9.i giữ nguyên, không phá:** `MaterialPick.priceVnd` **chỉ để NHÌN** lúc chọn.
Vật liệu **TRỎ TỚI** bản ghi thương mại qua `ProductSpec.id`; **không chép giá vào `MaterialPbr`,
không chép vào entity**. `grep priceVnd lib/materials/schema.ts` vẫn **0**.

### Vì sao danh tính đến từ KHO, không từ 13 preset thị giác
`MATERIALS` (`lib/cad/materials.ts`) có **0 preset khai `matId`** — đo tại nguồn, không chép sổ.
Chúng đổi được HÌNH mà không có gì để đổi DANH TÍNH. Danh tính phải đến từ nơi có giá và có nhà
cung cấp. Preset thị giác **cố ý KHÔNG tự gán mã**: bịa danh tính tệ hơn để trống — `missing-specId`
là sự thật đọc được, mã bịa thì không ai bắt được.

---

## 4 · Cửa duyệt phạm vi rộng — người dùng thấy đúng câu gì

Chép nguyên văn từ app thật (không diễn giải):

> **Ảnh hưởng khi đổi** · Đổi sang **Sàn gỗ óc chó** — 1 tham chiếu trong dự án đọc lại.
> Bản vẽ 2D 1 tham chiếu · Mô hình 3D 1 tham chiếu · BOQ / dự toán 1 tham chiếu ·
> Mặt đứng *không đổi* · Bảng vật liệu 1 tham chiếu · Hồ sơ trình bày *đọc lại từ Doc* ·
> Áp xong vẫn hoàn tác được (⌘Z).
>
> Nút: `Huỷ` · **`Chỉ 1 vùng đang chọn`** (mặc định, autoFocus) · `Toàn dự án (1 chỗ)`

Ba điều đáng ghi:
* **Phạm vi HẸP là mặc định** — đổi ít là bước lùi rẻ nhất. Phạm vi rộng phải bấm có chủ ý.
* Nhãn nút **nói thẳng con số** nó sẽ đụng, không nói chung chung.
* Nút "Toàn dự án" **chỉ hiện khi có nghĩa** — cần vật đang chọn ĐÃ có mã để mà thay. Thiếu thì
  không bày; bày một lựa chọn giả còn tệ hơn không bày.
* Đếm bằng `inspectMaterialImpact`, đổi bằng `replaceMaterialReferences` — **cùng một cỗ máy**.
  Đếm bằng hàm này rồi đổi bằng hàm khác thì bảng tác động chỉ là lời hứa suông.

---

## 5 · Override cục bộ — không nuốt, và không rò

Khoá override là `${specId}::${field}` (`boq-overrides.ts:41`), nên câu hỏi "có bị nuốt không"
tách thành **hai** câu, và cả hai đều phải đúng:

| Ca | Đo được |
|---|---|
| Đè đơn giá **999.000** cho vật liệu **A**, rồi đổi vùng tô sang **B** | bản ghi đè của A **còn nguyên** trong kho: `[{"specId":"ps-kiem-go-soi","field":"donGia","value":999000}]` |
| Giá đè của A có rò sang B không | **không** — dòng B đọc `donGia = 2.400.000` (đúng giá kho của B), không phải 999.000 |

Rò mới là ca tệ nhất: người dùng đè giá cho gỗ sồi rồi bỗng thấy gỗ óc chó ăn theo giá đó. Ghi
xuống ĐÚNG kho + ĐÚNG khoá app dùng (`interiorflow-sheets`, route `/boq-overrides`), không bịa kho
thứ hai.

---

## 6 · Hiệu chuẩn — làm HAI lần, và lần thứ hai là lần đáng tin

| Kiểu | Cách làm | Kết quả |
|---|---|---|
| **Mô phỏng** (`--hieu-chuan`) | dựng `Doc` đúng hình dạng đường UI CŨ sinh ra (có `pattern`/`color`, **không** `specId`) | mắt HÌNH **xanh** · DANH TÍNH + CON SỐ **đỏ** (1 đạt · 3 trượt) |
| **GỠ DÂY THẬT** | xoá đúng 2 dòng ghi `specId` khỏi `store.ts` + `CadCanvas.tsx`, chạy lại trên app thật | **5 đạt · 8 trượt**; cắm lại → **13 đạt · 0 trượt** |
| **Máy canh** | xoá 1 dòng ghi `specId` trong store | **12 pass · 1 fail**; cắm lại → **13 pass · 0 fail** |

⭐ Điểm đáng giá: **mắt HÌNH vẫn XANH ở cả hai ca hiệu chuẩn.** Tức bộ đo phân biệt được
*"vẽ ra hình"* với *"mang danh tính"* — đúng cái nó sinh ra để phân biệt. Nếu cả ba mắt cùng đỏ
thì nó chỉ đang đo "app có chạy không", không đo được gì về moat.

🔴 Bộ đo tách **FAIL** (khẳng định sai ⇒ kết luận được) khỏi **LỖI hạ tầng** (server chết, không
đăng nhập được, điểm bấm bị che ⇒ thoát mã **2**, KHÔNG KẾT LUẬN). Thứ đỏ ở mọi thế giới thì không
chứng minh gì.

---

## 7 · Ba thứ tìm được NGOÀI phạm vi — không sửa, ghi lại

Cả ba đều **chặn phép đo** lúc đầu và đều là hành vi giao diện thật, không phải lỗi của lượt này.

1. **Ô dòng lệnh bị dock đáy che.** Ô ở `y≈888,5` cao 26; `div.pointer-events-none.inset-x-0.bottom-4.z-[6]`
   có con `pointer-events-auto` phủ lên ⇒ `elementFromPoint` giữa ô trả về `DIV`, **click chuột
   không tới được ô**. Bàn phím (Tab/focus) vẫn tới. ⇒ người dùng chuột không bấm vào ô lệnh được
   ở vùng đó.
2. **Dock đáy `div.cad-pill-scroll` chiếm `y 760–816` TRONG khung canvas** (`y 122–884`) ⇒
   `pointerdown` ở dải đó không bao giờ tới canvas. Đo bằng bộ đếm cắm thẳng lên canvas: **down=1
   sau HAI lần nhấn**. Vùng vẽ dùng được thực tế hụt ~56px so với vùng nhìn thấy.
3. **Bấm một điểm vào GIỮA LÒNG vùng tô không chọn được nó** — thanh trạng thái vẫn *"Chưa chọn
   đối tượng nào để xoá"*; quây khung thì ra *"2 đối tượng"*. Bộ đo chuyển sang quây khung (chính
   thanh trạng thái đang mách: *"click vào đối tượng, hoặc quây khung"*).

📌 Cả ba **không** được lấy làm cớ dừng phép đo — bộ đo nay **kiểm điểm bấm trước khi bấm** và báo
KHÔNG-KẾT-LUẬN nếu điểm bị che, để lần sau *thất bại vì overlay* không bao giờ đọc ra như *tính năng hỏng*.

---

## 8 · Đánh giá khách quan

**Được:** chuỗi đi tới cuối trên app thật, số tự kiểm được, sống qua đóng/mở trình duyệt; hiệu
chuẩn làm bằng **gỡ dây thật** chứ không chỉ mô phỏng; không engine mới, không trường dữ liệu mới,
không phá luật tách giá.

**Chưa được, nói thẳng:**
* Kho vật liệu trong lượt đo là **2 hàng `ProductSpec` do bộ đo tự gieo**
  (`scripts/nghiem-thu-ban-lam-viec/gieo-kho-vat-lieu.mjs`). CSDL sạch có **0** ProductSpec ⇒
  **trên máy sạch, mục "Kho vật liệu" hiện danh sách rỗng** kèm câu giải thích. Chuỗi đúng, nhưng
  người dùng mới chưa có gì để chọn cho tới khi kho có hàng.
* **Đường "Toàn dự án" chưa được bấm trong lượt đo** — ca thật chỉ có 1 tham chiếu nên hai nút ra
  cùng kết quả. Nút có hiện, nhãn có số đúng, `replaceMaterial` có test riêng (mục ④ máy canh),
  nhưng **cú bấm end-to-end thì chưa**.
* Chỉ đo **Chromium 1194**, một khổ màn **1600×950**, một dự án.
* **Chưa qua mắt Hoà.** Ảnh đã chụp, chưa ai duyệt.

---

## 9 · Hai hướng cho lượt sau

**Hướng A — đóng nốt phần đo còn hụt (rẻ, khép kín).** Thêm ca hai vùng tô cùng vật liệu để bấm
thật nút "Toàn dự án", + ca `wallTypes` (đường `includeWallTypes` hiện chỉ có test đơn vị).
*Được:* đóng trọn hợp đồng đã dựng. *Mất:* không thêm năng lực nào cho người dùng.

**Hướng B — gieo kho vật liệu mở đầu cho máy sạch.** `lib/materials/kho-mo-dau.ts` + `hat-giong.ts`
(2 vật liệu, có `hatch2d`, có PBR) **đã tồn tại và có 0 nơi gọi** — lại đúng bệnh *dây có, chưa cắm
điện*. Nối `tronHatGiong()` vào đường `/api/specs` là máy sạch mở ra đã có vật liệu chọn được.
*Được:* xoá điểm chưa-được nặng nhất mục 8. *Mất:* hạt giống **cố ý không có giá** (luật 2.1.9.i)
⇒ BOQ sẽ báo `missing-priceVnd` — đúng, nhưng người dùng mới sẽ gặp cảnh "chọn được mà chưa ra tiền".

**Đề xuất: B trước, A sau.** Lý do: A chỉ làm đẹp bảng điểm của một bộ đo đã xanh; B gỡ một chỗ
đứt **người dùng thật gặp ngay lần mở app đầu tiên**, và nó là cùng một loại bệnh mà lượt này vừa
chữa (`grep` = 0 nơi gọi) — chữa một lần hai chỗ thì rẻ hơn. Ràng buộc kèm theo cho B: phải nói rõ
trên giao diện rằng hạt giống **chưa có giá**, đừng để người dùng tưởng BOQ hỏng.

---

## 10 · ⑦b CHƯA CHẮC / CHƯA KIỂM

* **Đường "Toàn dự án" chưa bấm end-to-end** (xem mục 8). `wallTypes` cũng chưa đi qua UI lần nào.
* **Chỉ Chromium 1194 · 1600×950 · 1 dự án · 1 người dùng.** Safari/Firefox, khổ hẹp, cảm ứng: suy,
  không đo.
* **Giá trong ô chọn là số THÔ chưa định dạng địa phương hoá kỹ** (`toLocaleString('vi-VN')`) —
  chưa đối chiếu với quy ước tiền tệ dùng ở chỗ khác trong app.
* **Chưa thử trình đọc màn hình.** Mục kho mới thêm có `aria-pressed`, chưa ai kiểm bằng cây trợ năng.
* **Ba phát hiện ngoài phạm vi ở mục 7 chưa ai xác nhận là bug hay cố ý** — đặc biệt ca ③ (bấm giữa
  lòng vùng tô không chọn được): với hatch pattern thì AutoCAD cũng bắt theo nét gạch, nên có thể
  đúng ý; với `SOLID` thì gần như chắc là sai. **Chưa đo ca `SOLID`.**
* **`26,55 m²` là diện tích do chuỗi điểm sinh ra, không phải số tròn đặt trước** — nó phụ thuộc
  toạ độ bấm và mức zoom mặc định; đổi khổ màn là đổi số. Bộ đo tự tính lại nên không gãy, nhưng
  **đừng trích con số đó như một hằng số**.
* **Không kiểm được máy của Hoà.** Mọi số ở đây đo trong container Linux.

## 11 · ⑦c HẠN DÙNG KẾT LUẬN

| Kết luận | Hết hạn khi |
|---|---|
| "Ba mắt xanh sau khi vào lại" | ai đó đổi khoá IndexedDB, đổi route `/cad-editor`, hoặc đổi hình dạng `SheetsRecord` |
| "13/13 trên app thật" | đổi bố cục chặng 2D (điểm bấm/dock đáy dịch) — bộ đo sẽ báo **KHÔNG KẾT LUẬN**, không báo xanh giả |
| "BOQ ra 68.817.600" | đổi giá 2 hàng gieo, đổi công thức hao hụt, hoặc đổi khổ màn đo |
| "Không chép giá vào vật liệu" | ai đó thêm trường giá vào `MaterialPbr`/entity — cần máy canh riêng, **hiện chưa có** |
| "Danh tính chỉ đến từ kho" | ngày có preset đầu tiên khai `matId` (kế hoạch Slice 1A đã ghi trong `materials.ts:61`) |
