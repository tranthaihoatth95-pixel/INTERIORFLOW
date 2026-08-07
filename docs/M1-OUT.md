# M1-OUT — mảng lõi-cad · vòng CHẨN ĐOÁN T3 — 06/08

> Vòng này **chỉ đo và ghi**, KHÔNG sửa IF, KHÔNG commit (V6).
> Kết quả trung tính đã rót vào `docs/GAP-IF.md` (G-M1-01 … G-M1-12).
> **Không sửa một dòng nào trong `lib/`, `components/`, `app/`.** Kịch bản đo nằm ở thư mục
> scratchpad phiên, ngoài repo.

---

## 1 · Đã chạy gì

Nạp **6 file DXF mặt bằng thật của đề bài T3** (5,3–26,4 MB) **qua chính parser của IF**
(`lib/cad/dxf.ts` `parseDxfEx`), rồi đưa `Doc` thu được qua bộ đọc ngữ nghĩa
`lib/cad/dxf-plan.ts` (cụm vẽ chính · lưới trục · lõi cứng · diện tích khung tên · đối chiếu
diện tích). Sau đó thử **sửa 1 cấu kiện rồi xuất lại** để xem vỡ chỗ nào.

Nhãn file trong báo cáo này là F1…F6 theo thứ tự tên, cố ý không nêu tên hồ sơ/khách.

## 2 · Số đo — nạp

Mỗi file một tiến trình riêng, phân tích 3 lần liên tiếp trong tiến trình đó, lấy dải.

| | dung lượng | thời gian phân tích ×3 | heap đỉnh | entity vào `Doc` | bỏ qua |
|---|---|---|---|---|---|
| F1 | 5,6 MB | 0,42 – 0,54 s | 219 MB | 12.274 | 344 |
| F2 | 6,6 MB | 0,38 – 0,51 s | 101 MB | 11.775 | 284 |
| F3 | 9,3 MB | 0,65 – 0,69 s | 515 MB | 10.085 | 284 |
| F4 | 26,4 MB | 1,10 – 1,50 s | 322 MB | 9.891 | 281 |
| F5 | 12,6 MB | 0,70 – 0,86 s | 392 MB | 10.035 | 281 |
| F6 | 5,3 MB | 0,20 – 0,25 s | 140 MB | 2.984 | 71 |

- **6/6 file nạp được, không lỗi, không treo, không ném exception.** Phần INSERT/BLOCKS làm
  05/08 chạy đúng: 33–128 tên block, 101–558 lần chèn được làm phẳng mỗi file.
- Loại bị bỏ, giống nhau ở cả 6 file: `POINT` (27–300) · `ATTDEF` (14) · `SEQEND` (14) ·
  `ELLIPSE` (9) · `ATTRIB` (3) · `HATCH` (2, dựng lỗi) · `VIEWPORT` (2).
- 🔴 **Đính chính số đo trong chính phiên này.** Ba vòng đo đầu ra 4–25 s rồi 12–68 s cho cùng
  bộ file; `uptime` lúc đó cho **load average 47–58** (nhiều phiên chạy song song trên cùng
  máy). Khi tải hạ về ~33 thì số ổn định ở dải trong bảng, lệch nhau <15% giữa các lần. ⇒ Bảng
  trên là số đúng; **phép phân tích KHÔNG phải nút cổ chai**, nó nằm dưới ngưỡng 2 s mà phiếu
  DXF 05/08 đặt ra. Cái vẫn hỏng là chạy trên luồng chính, không tiến độ, không huỷ, và ăn tới
  ~0,5 GB bộ nhớ — máy bận thì người dùng lãnh nguyên quãng đứng hình đó (G-M1-01).
  Đây cũng là lời nhắc cho phiên sau: **đo hiệu năng phải kèm `uptime`**, không thì ra kết luận
  sai về việc nên tối ưu cái gì.

## 3 · Số đo — ngữ nghĩa mặt bằng (thứ zoning cần)

| | cụm vẽ chính | lưới trục | lõi cứng | diện tích khung tên | diện tích tính từ hình học |
|---|---|---|---|---|---|
| F1 | 28,5×26,2 m | 6 trục chữ + 5 trục số | 3 vùng | đọc được | **không tính được** |
| F2 | 34,7×28,1 m | 6 + 5 | 3 vùng | đọc được | không tính được |
| F3 | 31,3×27,7 m | 6 + 5 | 4 vùng | đọc được | không tính được |
| F4 | 31,3×27,7 m | 6 + 5 | 3 vùng | đọc được | không tính được |
| F5 | 31,0×27,4 m | 6 + 5 | 4 vùng | **null** | không tính được |
| F6 | 31,0×27,4 m | 6 + 5 | 4 vùng | **null** | không tính được |

Chạy tốt hơn mong đợi: lưới trục và lõi cứng ra đúng và **giống nhau ở cả 6 sàn** — đủ làm ràng
buộc chia khu. Hai chỗ hụt: diện tích tính từ hình học (G-M1-05) và 2 file thiếu số khung tên
(G-M1-12).

Chữ tiếng Việt nạp đúng dấu khi đọc bằng UTF-8 — **không có lỗi mã hoá** trên bộ file này.

## 4 · "Sửa 1 cấu kiện thì vỡ chỗ khác" — đo thật

Kịch bản: nạp F6 → dời một đường trên lớp tường 500 mm → `exportDxfEx` → nạp lại.

| | trước | sau vòng xuất–nạp |
|---|---|---|
| tổng entity | 2.984 | 2.984 ✅ |
| số layer | 23 | 23 ✅ |
| từng loại hình (line/polyline/hatch/circle/arc/text) | — | **khớp 100%** ✅ |
| entity còn nhãn block gốc | 2.965 | **0** 🔴 |
| `INSERT` trong file xuất ra | — | **0** 🔴 |

⇒ **Hình học an toàn, cấu trúc hồ sơ thì không.** Sửa một đường rồi giao file đi, người nhận
nhận về một bản vẽ đã bị nổ tung toàn bộ block: bản lặp không còn liên kết, sửa 1 cái cửa
không còn ăn sang các cửa cùng loại. (G-M1-07)

Ba thứ nữa vỡ theo, cùng một gốc — **không có ai neo vào ai**:
- Vùng tô poché không neo vào đường tường ⇒ dời tường, mảng tô ở lại (G-M1-08).
- Một tên block bị chèn 18 lần, 828 hình phẳng mang **cùng một chuỗi** ⇒ không có cách nào
  chọn riêng bản chèn thứ 7 (G-M1-06).
- 0/12.274 entity có `elementType` ⇒ app không biết đâu là cột để mà cấm cắt vách ngang
  (G-M1-09).

## 5 · Quyết định tự chọn khi gặp mơ hồ

1. **Không chốt số hiệu năng ở vòng đo đầu.** Ba vòng đầu ra 4–68 s; thay vì ghi thẳng vào
   GAP, kiểm `uptime` thấy máy đang tải 47–58 rồi đo lại lúc tải hạ — số thật thấp hơn 30–50
   lần. Nếu ship số cũ thì việc tiếp theo sẽ đi tối ưu thuật toán phân tích, đúng chỗ KHÔNG
   hỏng. Chi tiết ở §2.
2. **Không chốt "mất tên phòng".** Chuỗi chương trình phòng (tên phòng · số chỗ · diện tích)
   có trong file thô nhưng nằm trong **định nghĩa block không được chèn** — tức là rác
   copy-paste của file gốc, không phải nội dung sống mà IF làm rơi. Không ghi thành GAP; chỉ
   ghi phần IF thật sự thiếu là đường đọc khung tên độc lập (G-M1-12).
3. **Không mở rộng sang zoning/bố trí nội thất.** Phiếu giới hạn mảng lõi-cad; hai chặng sau
   của T3 chưa đo, xem §7.

## 6 · Chưa làm — nói rõ

- **Chưa so mắt với bản PDF cùng tên.** Mới đối chiếu bằng con số (entity, khung bao, lưới
  trục, lõi), chưa mở song song để soi mất mảng nào.
- **Chưa verify trên browser thật.** Vòng này đo ở tầng thư viện; đường người dùng thật
  (chọn file → nạp → zoom) chưa bấm tay. G-M1-01/02/04 suy từ đọc code đường gọi
  (`components/cad/CadEditor.tsx` gọi `parseDxf` bản mỏng · `components/cad/CadCanvas.tsx`
  zoom-extents dùng khung bao toàn bộ entity) — **cần bấm tay xác nhận trước khi sửa.**
- Chưa đo 3 file còn lại ở phần xuất–nạp (mới F6).
- Không sửa gì, không commit — đúng V6.

## 7 · Ba việc tiếp theo (đề xuất, chờ chốt)

1. **Nối dây trước, viết mới sau** — G-M1-02/03/04 đều là năng lực ĐÃ CÓ mà không ai gọi.
   Ba sợi dây này rẻ nhất và mở khoá luôn chặng zoning của T3.
2. **Đưa nạp DXF xuống worker** (G-M1-01) — dùng lại khuôn worker của đường DWG, kèm tiến độ
   + huỷ. Không phải để chạy nhanh hơn (phân tích đã dưới 1,5 s) mà để lúc máy bận giao diện
   còn thở và bấm huỷ được.
3. **Chọn được một cấu kiện** (G-M1-06 + G-M1-07 + G-M1-08) — id bản chèn và neo vùng tô vào
   cấu kiện là điều kiện cần cho mọi thao tác sửa; chưa có nó thì T3 dừng ở "xem được".

---

# PHẦN 2 — VÒNG SỬA (GỐC A + GỐC B) + KIỂM PHẢN BIỆN — 06/08

> Vẫn **KHÔNG COMMIT** (V6). Ba agent: 1 lo nền danh tính (`lib/cad/{model,dxf,commands,store}.ts`
> + `element-infer.ts`), 1 lo nối dây (`components/cad/{CadEditor,CadCanvas}.tsx` +
> `import-summary.ts`), 1 kiểm phản biện (chỉ đọc/đo, không sửa code sản phẩm). Mảng file tách rời
> hẳn để hai agent không giẫm chân — bài học "hai phiên chung `.git`".
>
> ⚠️ Chạy agent **trên máy này, KHÔNG đẩy lên cloud**: 6 file DXF đề bài nằm ở đĩa cục bộ, agent
> cloud không mở được thì mọi nghiệm thu thành lý luận suông.

## 1 · Bảng chốt sau kiểm phản biện

| GAP | Kết luận | Số đo |
|---|---|---|
| G-M1-06 chọn 1 cụm | ✅ **ĐẠT** | 6 file × 3 block + ca lồng 5 cấp: **0 lem · 0 sót**. Ca bệnh gốc (1 block chèn 18 lần) nay ra 18 danh tính riêng |
| G-M1-03 đọc mặt bằng | ✅ **ĐẠT** | 6/6: trục 6+5 · lõi 3–4 vùng · 4–15 ms |
| G-M1-07 giữ block khi xuất | 🟡 một phần | INSERT **0 → 91–457**, BLOCK = ENDBLK = BLOCK_RECORD, 0 INSERT thiếu định nghĩa. NHƯNG cây lồng 5 cấp bị ép còn 1, tên block 127→29 |
| G-M1-09 loại cấu kiện | 🟡 một phần | 0 → **52–89%** entity có loại, **100% mang cờ `inferred`**, cờ sống qua vòng xuất–nạp. NHƯNG có hồi quy (G-M1-19) |
| G-M1-02 báo cáo nạp | 🟡 một phần | panel có thật; còn jargon DXF thô + hai con số "bỏ qua" lệch nhau (344 vs 314) trên cùng một màn |
| G-M1-04 zoom cụm chính | 🟡 một phần | bật trên **6/6** file, giấu 9–76% số hình; nút "về cụm chính" ở panel cho khung KHÁC khung lúc nạp |
| G-M1-08 neo poché | 🔴 **CHƯA ĐẠT** với hồ sơ nhập | **0/126–161** mảng tô có đường bao trùng vòng để neo, kể cả bỏ điều kiện layer. Đạt với tường IF tự vẽ |

Round-trip (tôi tự đo, không chép agent): entity **khớp 6/6** · từng loại hình khớp · số entity
mỗi layer khớp 100% · hình học khớp ở dung sai 1e-6 mm.

Hồi quy 3D tôi tự thêm (không ai yêu cầu, vì đây đúng chỗ dễ "sửa 1 chỗ vỡ chỗ khác"): số nhóm
khối 3D khi BẬT bộ suy = khi TẮT (4=4, 28=28) ⇒ gán `elementType` không làm mất khối tường.

## 2 · Ba điều đính chính so với chính báo cáo của các agent

1. **`select()` "chữ ký cũ không đổi nghĩa"** — SAI. Nở poché chạy **vô điều kiện** trong
   `select()`, ăn vào 6 nơi gọi thật. Đổi hành vi là CỐ Ý (một mảng tường là một vật) nhưng
   docstring khai ngược ⇒ phải sửa chữ, không phải sửa code.
2. **"MỘT luật zoom dùng chung, không hai chỗ tự tính"** — SAI: nút "Về cụm vẽ chính" ở panel và
   khung lúc nạp cho hộp khác nhau trên **6/6** file.
3. **Lý do của G-M1-08 ghi ở vòng chẩn đoán** ("hatch khác layer với đường bao") cũng chưa đúng:
   đo lại thì hồ sơ nhập vào **không có nửa đường bao** để mà neo.

## 3 · Cái nghiêm trọng nhất lộ ra: nghiệm thu G-M1-07 chưa đóng được

File DXF do IF xuất ra **không mở được bằng bộ đọc DXF chuẩn** (`ezdxf`, cả chế độ cứu hộ) —
hỏng 6/6, trong khi file gốc mở tốt. Nguyên nhân đã cô lập: `LWPOLYLINE` thiếu dấu lớp con
`100/AcDbPolyline`. **Có sẵn từ trước** (bản `HEAD` hỏng y hệt) nhưng nó chặn đúng câu hỏi "giao
file cho người khác sửa tiếp có được không" ⇒ G-M1-07 mới chứng minh được **bằng chính parser của
IF**, chưa chứng minh được bằng CAD bên ngoài. Xem G-M1-18.

## 4 · Dọn trung tính (trước khi đưa lên GitHub)

Thay **11** chỗ ghi tên khách trong `lib/` (10 chỗ grep thấy + **1 chỗ grep KHÔNG thấy**) và 5 chỗ
ghi mã file hồ sơ kèm hậu tố studio. Chỗ thứ 11 bị giấu vì `lib/cad/dxf.ts` chứa **1 byte NUL**
(dấu tách khoá gõ thô vào template string) khiến `grep` coi cả tệp là nhị phân rồi bỏ qua — đã
thay bằng escape sáu ký tự `\u0000`, chuỗi lúc chạy y hệt, test đường ghi block 50/50 vẫn xanh.
**Bài học: phép kiểm trung tính bằng `grep` không đáng tin nếu chưa kiểm xem tệp nào bị coi là
nhị phân.**

Sổ chốt diện tích đã `git rm --cached` + dời sang `2407-Test/` (đã gitignore); 3 tham chiếu trong
`lib/` đổi sang trỏ thư mục, không nêu tên tệp.

Nghiệm thu: tên khách trong `lib/ components/ app/` = **0** · mã file hồ sơ = **0** · tệp nguồn bị
coi là nhị phân = **0** · `npx tsc --noEmit -p .` **exit 0** (chỉ còn 1 lỗi có sẵn ở
`render-layer-index.test.ts`, thuộc commit `752fb54`).

Còn lại, **chưa tự sửa vì cần Hoà quyết**: ~20 đường dẫn ảnh render dự án khách trong
`lib/present-editor/demo-enso-sample.ts` (`CLAUDE.md` ghi "user đã cho phép giữ") và đường dẫn máy
cá nhân trong chú thích `lib/cad/dwg*.ts`.

---

# PHẦN 3 — CHẶN MÁU + MỞ KHOÁ GIÁ TRỊ LÕI (06/08, theo thứ tự Hoà chốt)

## ① G-M1-19 · hồi quy đang sống — ĐÓNG

`lib/cad/block-library.ts` nay nạp block thư viện với `inferRules: null`. Đo trên **54 file .dxf
thật** của kho:

| | block bị gán loại | hình bị gán sai |
|---|---|---|
| trước | **30/54** | 461 (455 `space` + 6 `column`) |
| sau | **0/54** | 0 |

`parseDxf()` được nới thêm tham số tuỳ chọn (additive, mọi nơi gọi cũ giữ nguyên) để chỗ này tắt
được bộ suy mà không phải đổi kiến trúc.

Khoá bằng `lib/cad/block-library-infer.test.ts` — cố ý khoá **cả hai vế**: [1] hành vi trên 54 file
thật, [2] `block-library.ts` phải THẬT SỰ truyền tuỳ chọn (thiếu vế này thì ai đó gỡ tuỳ chọn đi mà
test vẫn xanh, vì test tự truyền). Kèm ca đối chứng: bật bộ suy lên thì bệnh cũ phải tái hiện —
test không có răng thì sớm muộn cũng thành trang trí.

## ② G-M1-18 · blocker — ĐÓNG, và nó cũng đóng luôn nghiệm thu G-M1-07

Hai chỗ thiếu dấu lớp con, cô lập bằng file tối thiểu một-entity:
`LWPOLYLINE` thiếu `100 AcDbPolyline` · `HATCH` thiếu `100 AcDbHatch`.

Đo lại bằng `ezdxf` (bộ đọc DXF độc lập) trên 6 file thật nạp-rồi-xuất:

| | trước | sau |
|---|---|---|
| mở được | **0/6** (kể cả chế độ cứu hộ) | **6/6**, **0 lỗi audit** |
| INSERT trong file ra | — | 91–457 |
| định nghĩa BLOCK | — | 25–31 |
| **hình sau khi BUNG khối** | — | **12.274 · 11.775 · 10.085 · 9.891 · 10.035 · 2.984** |

Cột cuối khớp **tuyệt đối** với số entity trong `Doc` ⇒ từ nay lời hứa "giao bản vẽ cho người khác
sửa tiếp" có bằng chứng từ **phần mềm ngoài**, không còn là lập luận vòng tròn "parser của IF đọc
được file của IF". CỐ Ý chỉ vá 2 loại này: LINE · CIRCLE · ARC · TEXT · DIMENSION đo được là mở
sạch dù không có dấu lớp con, thêm bừa dễ hỏng thứ đang chạy tốt.
Khoá bằng `lib/cad/dxf-openable.test.ts` (20 ca — có ca canh THỨ TỰ dấu, và ca chứng minh bản vá
không đụng 3 loại kia).

## ③ G-M1-20 · nhãn nói ngược + 4 field chết — ĐÓNG

Ba câu nói ngược sự thật, sửa cả ba (đo trên báo cáo thật, không sửa theo cảm tính):
- nhãn nút tải: *"đã làm phẳng block"* → **"giữ được phần lớn khối · Giữ N khối (M loại) · K hình bị rã"**
- tiêu đề hộp duyệt: *"Bản xuất này mất cấu trúc block"* → **"Xem lại phần khối trước khi tải"** (chỉ giữ câu cũ khi thật sự giữ được 0 khối)
- câu cảnh báo trong `dxf.ts` — **chỗ này chỉ lộ ra khi verify browser**, hai câu kia sửa xong rồi mà nó vẫn ghi *"mở lại ở AutoCAD sẽ không còn cấu trúc block"* ngay bên dưới dòng "giữ nguyên 3 khối".

Bốn field hết chết: `insertsWritten` · `blockDefsWritten` · `preservedBlocks` → hộp duyệt xuất DXF ·
`elementTypes` → mục **"Tự phân loại"** mới trong panel báo cáo nạp (K3: nói thẳng là MÁY ĐOÁN,
đoán theo tên lớp nào, để người dùng còn sửa). Tiện tay: bảng "Bỏ qua" nay dùng CHUNG từ điển với
thanh trạng thái (`SKIPPED_LABELS`) — trước đó cùng một việc hiện hai thứ tiếng trên cùng một màn.

**Verify browser thật** (server riêng cổng 3001, dự án test tạo riêng rồi xoá): panel hiện đúng
"Máy đoán 7 hình theo tên 1 lớp" + bảng `A-Wall → tường · vách`; bảng bỏ qua hiện "điểm đánh dấu 2 ·
hình elip 1"; hộp duyệt xuất DXF hiện đủ 3 câu mới, khớp nhau. 0 lỗi console do việc này.
Dọn sạch: flow test đã xoá (18 → 17, đúng số trước phiên), server đã tắt.

`npx tsc --noEmit -p .` sạch (chỉ còn 1 lỗi có sẵn ở `render-layer-index.test.ts`).
Test: `dxf-openable` 20 · `block-library-infer` 5 · `dxf-export-report` 20 · `dxf-reblock` 50 ·
`dxf.roundtrip` 46 · `element-infer` 35 — **0 fail**.

---

# PHẦN 4 — VÒNG 2: 4 ĐỎ CÒN TREO (06/08 đêm)

> V6: KHÔNG commit. Không đụng `lib/boq` · `lib/ffe` · `lib/materials` · `components/materials` ·
> `components/nodes` · `components/library` · `components/print`.
> ⚠️ `docs/GAP-IF.md` có bị sửa **TRƯỚC** khi lệnh cấm đụng tới nó về (cập nhật trạng thái 3 dòng
> G-M1-18/19/20 của vòng 1). Từ lúc nhận lệnh thì không đụng nữa. Nói ra để khỏi tưởng là lén.

## BƯỚC 0 — grep, dán nguyên văn

```
$ grep -rn "zoomExtents\|mainClusterBox" lib/cad/ components/cad/     (bỏ *.test.ts)
lib/cad/import-summary.ts:26   import { mainClusterBox } from './dxf-plan';
lib/cad/import-summary.ts:172  export function zoomExtentsPlan(...)
lib/cad/dxf-plan.ts:71         export function mainClusterBox(...)
lib/cad/dxf-plan.ts:326        const main = mainClusterBox(doc);
components/cad/CadCanvas.tsx:24,401,460,464   zoomExtentsPlan / zoomExtents()
components/cad/CadEditor.tsx:35,426,427       mainClusterBox + zoomExtentsPlan   ← HAI NGUỒN
$ grep -rn "Worker\|AbortController" lib/cad/dxf.ts lib/cad/dwg*.ts
lib/cad/dxf.ts        → 0 dòng            ← đường DXF KHÔNG có worker, không có huỷ
lib/cad/dwg.ts:70,111 → ORPHANED_DWG_WORKERS · new Worker(new URL('./dwg-worker.ts'…))
lib/cad/dwg-worker.ts → worker thật
```
Grep xác nhận đúng hai chẩn đoán: **`CadEditor` gọi `mainClusterBox` RIÊNG** (nguồn thứ hai) và
**`dxf.ts` không có worker/huỷ nào**.

## ① G-M1-08 · neo vùng tô cho hồ sơ NHẬP VÀO — ĐÓNG

Vòng 1 tôi kết luận *"hồ sơ thật không có nửa đường bao để neo"*. **Kết luận đó SAI.** Đo lại
từng cái cột: một cột = **1 đường bao 4 đỉnh + 10 mảng tô 5 đỉnh**, cùng lớp, cùng bản chèn, 4
đỉnh đầu trùng khít tới phần nghìn mm. Đỉnh thứ 5 là **điểm chia cạnh** phần mềm CAD tự chèn.

Hai luật cũ chặn mất, cả hai đều đúng-cho-ca-cũ: `sameRing` đòi **bằng số đỉnh** (4 vs 5 ⇒ "khác
vòng"), và **"1 chủ ↔ 1 con"** (neo được 1/10, dời cột thì 9 mảng ở lại).

| | mảng tô | neo được TRƯỚC | neo được SAU | đường bao có con | nhiều con nhất |
|---|---|---|---|---|---|
| F1 | 126 | **0** | **90** | 9 | 10 |
| F2 | 161 | **0** | **90** | 9 | 10 |
| F3 | 147 | **0** | **80** | 8 | 10 |
| F4 | 139 | **0** | **80** | 8 | 10 |
| F5 | 137 | **0** | **90** | 9 | 10 |
| F6 | 138 | **0** | **90** | 9 | 10 |

Ca bệnh gốc chạy thật trên file: **dời đường bao 1 cột +1000mm → 10/10 mảng tô đi theo đúng vị trí
mới** · chọn 1 mảng tô → nở ra đủ 11 hình. Phần chưa neo (36–71 mảng/file, lớp `htch`/`A-Hatch`)
**thật sự không có đường bao nào trong tệp** — để yên, không bịa chủ (K3).
Sửa: `normalizeRing()` mới + `sameRing` bỏ điều kiện bằng-số-đỉnh + `pochePartnerIds()` (1 chủ ↔ N
con) trong `lib/cad/poche.ts`. Test mới `poche-import.test.ts` 19 ca (có ca "đỉnh lệch 2,6 mm là
hình THẬT, không được bào mất" và 3 ca chống neo bừa). `poche.test.ts` cũ 30/30 vẫn xanh.

## ② G-M1-04 · zoom cụm chính — ĐÓNG

Gốc thứ nhất: `CadEditor` gọi `mainClusterBox` riêng để nuôi panel ⇒ nút "Về cụm vẽ chính" bay tới
khung khác khung lúc nạp. Nay panel dùng lại `view.box` — **một nguồn tính duy nhất**.

Gốc thứ hai: luật cũ cắt theo VÙNG (nới cụm 25% rồi bỏ mọi thứ ngoài) nên giấu cả bảng ghi chú và
các bản vẽ khác trong cùng tệp. Nay cắt theo **ĐỘ XA VÔ LÝ**, ngưỡng lấy từ số đo: nội dung bình
thường nằm ở **0,4–13,8 lần cỡ cụm**, bản sao parked thật nằm ở **353–358 lần** — chọn 30.

| | % hình bị giấu TRƯỚC | SAU | khung nhìn SAU |
|---|---|---|---|
| F1 | 76,3% | **0%** | 226×71 m (toàn bộ) |
| F2 | 74,1% | **13,1%** | 351×105 m (bỏ 1.542 hình cách 12 km) |
| F3 | 71,3% | **0%** | 466×105 m |
| F4 | 72,7% | **0%** | 301×135 m |
| F5 | 71,6% | **0%** | 185×135 m |
| F6 | 31,4% | **0%** | 313×81 m |

F2 là tệp DUY NHẤT có bản sao parked thật — và đó đúng là tệp phải canh cụm: khung bao thô
12.311×15.492 m → 351×105 m (**gấp 5.184 lần diện tích**). 5 tệp còn lại về **mode `full`, 0% giấu**.

## ③ G-M1-07 phần còn lại · cây lồng — ĐÓNG (kèm một hụt nói thẳng)

`srcInsertId` vốn là ĐƯỜNG DẪN (`i93/5/271`). Bản xuất cũ đổ hết INSERT ra `ENTITIES` ⇒ cây bẹp
còn 1 cấp. Nay mỗi bản chèn được đặt vào đúng cha; chỉ bản chèn gốc mới ra thẳng `ENTITIES`.

Nghiệm thu bằng **`ezdxf`** (đúng chuẩn đã lập ở vòng 1) — bung block ĐỆ QUY:

| | độ sâu cây TRƯỚC → SAU | định nghĩa BLOCK | INSERT ở gốc | bung đệ quy | audit |
|---|---|---|---|---|---|
| F1 | 1 → **5** | 335 | 94 | **12.274** | 0 lỗi |
| F2 | 1 → **5** | 277 | 80 | **11.775** | 0 lỗi |
| F3 | 1 → **5** | 273 | 74 | **10.085** | 0 lỗi |
| F4 | 1 → **5** | 269 | 74 | **9.891** | 0 lỗi |
| F5 | 1 → **5** | 271 | 74 | **10.035** | 0 lỗi |
| F6 | 1 → **5** | 56 | 3 | **2.984** | 0 lỗi |

Cột "bung đệ quy" khớp **tuyệt đối** số entity trong `Doc` ⇒ không mất hình. Vòng xuất–nạp bằng
parser IF: entity 6/6 khớp, loại hình khớp, **số entity từng lớp khớp 100%** (sau khi chuẩn hoá
tên lớp — phần đổi tên là lỗi CŨ, đã ghi từ vòng 1, không phải hồi quy).

🔴 **HỤT, nói thẳng**: **tên block của nút TRONG không lấy lại được** — bộ nạp chỉ ghi tên định
nghĩa TRỰC TIẾP chứa hình, không ghi chuỗi tên tổ tiên. Đo: **0/101 nút trong** lấy được tên gốc,
nên nhóm phải đặt tên tự chế `IF_NHOM_n`. **Cấu trúc đúng, tên thì không.** Muốn đúng cả tên phải
sửa BỘ NẠP ghi thêm chuỗi tổ tiên — việc riêng, chưa làm.

## ④ G-M1-01 · worker + tiến độ + huỷ cho DXF — ĐÓNG (một mục nghiệm thu đo kiểu khác)

3 tệp mới, đúng khuôn đường DWG đã chốt: `dxf-worker.ts` (worker) · `dxf-import.ts` (**vòng đời
THUẦN**, test được) · `dxf-open.ts` (vỏ trình duyệt, chứa `import.meta.url`). `CadEditor` bỏ
`FileReader`+parse trên luồng chính, dùng `openDxfFile()`; nút Huỷ dùng CHUNG thanh với đường DWG.

- **Tiến độ = giai đoạn + số giây, KHÔNG phải phần trăm.** `parseDxfEx` là một vòng quét duy nhất;
  bịa thanh % chạy đều là nói dối (K3). Test khoá luôn điều này (`không có % giả trong câu`).
- **Huỷ = BỎ RƠI worker**, không `terminate()` ngay — cùng luật Hoà đã chốt cho DWG.
- Test `dxf-import.test.ts` **23 ca** với worker giả + đồng hồ giả: đường thuận · nhịp tiến độ ·
  huỷ (kèm "không terminate") · huỷ trước khi chạy · quá giờ (nêu tên tệp + giai đoạn) · worker
  lỗi · worker chết · không đẻ nổi worker · câu chữ không lộ jargon.

**Verify trình duyệt thật** (server riêng 3001, tệp thử 18 MB và 26 MB tự sinh — KHÔNG dùng hồ sơ
khách):

| đo | kết quả |
|---|---|
| luồng chính sau khi thả tệp 18 MB | trả lời sau **77 ms**, lần kế **2 ms** (trước: đứng hình cả quãng parse) |
| thanh "Đang mở bản vẽ… [Huỷ]" | **có thật trong DOM** lúc đang nhập |
| bấm Huỷ | trạng thái đổi thành **"Đã huỷ mở tệp."**, thanh biến mất, bản vẽ không bị thay |
| 26 MB | nạp xong bình thường, panel báo cáo hiện đủ |

🟡 **Chưa chụp được ẢNH đúng khoảnh khắc thanh Huỷ đang hiện** — và lý do chính là bản vá: qua
worker, tệp 18–26 MB phân tích xong **dưới 1 giây**, ngắn hơn một vòng gọi chụp màn hình. Bằng
chứng thay thế là đọc DOM trực tiếp lúc đang nhập (thấy nút) + trạng thái sau khi bấm. Ghi đúng
mức đã đạt, không nói quá.

🔴 **Phát hiện phụ, quan trọng cho việc sau**: thử tệp tự sinh **400.000 entity** thì luồng chính
vẫn treo >30 giây — nhưng **không phải ở khâu phân tích**: nút cổ chai chuyển sang việc chuyển
`Doc` từ worker về (structured clone) + `importDoc` + vẽ lại. Hồ sơ thật chỉ 10–12 nghìn entity nên
chưa chạm ngưỡng này. Worker giải đúng phần nó nhận, phần còn lại là việc khác.

## Kiểm tổng

`npx tsc --noEmit -p .` — **chỉ còn đúng 1 lỗi có sẵn** (`render-layer-index.test.ts:36`, commit
`752fb54` của phiên khác), không thêm lỗi mới.
13 bộ test chạy lại: `poche` 30 · `poche-import` 19 · `dxf-import` 23 · `dxf-reblock` 50 ·
`dxf-openable` 20 · `dxf.roundtrip` 46 · `dxf-insert` 38 · `dxf-export-report` 20 · `dxf-plan` 28 ·
`element-infer` 35 · `block-library-infer` 5 · `cad-core-b1` 45 · `hatch` 45 — **0 fail**.
Dọn: flow test đã xoá từ vòng trước, bản vẽ thử đã xoá khỏi cache, server đã tắt.
