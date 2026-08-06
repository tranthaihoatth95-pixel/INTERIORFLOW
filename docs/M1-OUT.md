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
