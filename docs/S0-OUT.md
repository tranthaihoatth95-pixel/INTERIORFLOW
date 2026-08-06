# S0-OUT — [M0] GỘP M1+M2+M3+M4+M5+GAP-IF — 06/08 16:02

> Nguồn (đủ 6/6): M1 (117 dòng, 14:05) · M2 (139 dòng, 14:41) · M3 (159 dòng, 13:55) · M4 (236 dòng, 15:32) · M5 (117 dòng, 14:48) · GAP-IF (70 dòng, 15:59)
> Lần gộp trước (14:54) thiếu M4 vì lúc đó file chưa tồn tại — bản này thay thế.

════════════════════════ M1-OUT.md ════════════════════════
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

════════════════════════ M2-OUT.md ════════════════════════
# M2-OUT — mảng "ba dạng phòng" · vòng CHẨN ĐOÁN T1 — 06/08

> Vòng này **chỉ đo và ghi**, KHÔNG sửa IF, KHÔNG commit (V6).
> Kết quả trung tính đã rót vào `docs/GAP-IF.md` (G-M2-01 … G-M2-10).
> **Không sửa một dòng nào trong `lib/`, `components/`, `app/`.** Toàn bộ thao tác chạy trên
> app thật qua trình duyệt (`127.0.0.1:3001`), đo bằng state thật của app.

---

## 1 · Đã chạy gì (T1)

Mở **một thiết kế có sẵn trong IF** rồi **sửa một thành phần không gian**, đúng như một KTS
sẽ làm:

1. `/` → chọn dự án → chặng **Thiết kế 2D**.
2. Bản vẽ trống ⇒ dùng chính đường vào của IF: **Bắt đầu → Mở bản demo** (mặt bằng căn hộ mẫu
   của IF, 117 đối tượng, 5 phòng có nhãn — trung tính, không dùng hồ sơ khách).
3. **Sửa 1 thành phần không gian**: chọn vách ngăn giữa hai phòng → lệnh **Di chuyển** → dời
   sang ngang (450–500 mm), tức thao tác "nới phòng này, hẹp phòng kia" cơ bản nhất.
4. Quan sát 5 chỗ: nhãn phòng · diện tích · thanh trạng thái · chặng 3D · Hoàn tác.
5. Thử tiếp: gán **loại tường / độ dày** ở bảng thuộc tính; bấm ⌘Z ở chặng 3D; xem có
   **bản xem trước** khi đang dời không.

Số đo lấy trực tiếp từ state của app trong trình duyệt (`__cadStore`) + chữ đọc từ DOM, không
đọc bằng mắt qua ảnh chụp.

## 2 · Số đo — điều gì xảy ra khi dời MỘT bức tường

| Đo | Trước | Sau khi dời 1 tường | Nghĩa là |
|---|---|---|---|
| Vùng tô (poché) của tường | x 5350–5450 | **x 4850–4950** | nửa này đi |
| Đường bao của **cùng** tường | x 5350–5450 | **x 5350–5450** | nửa kia ở lại ⇒ tường rách |
| Nhãn diện tích các phòng trên bản vẽ | 36,7 / 12,2 / 5,7 / 3,6 m² | **y nguyên** | chữ chết |
| Tổng diện tích ở thanh trạng thái | 59,9 m² | **55,3 m²** | tính lại, ngược với nhãn |
| Bộ đếm "tường chưa phân loại" | 29 | **38** | +9 hình dẫn xuất bị đếm như tường |
| Số đối tượng trong bản vẽ | 117 | **126** | bản vẽ tự dài ra sau 1 thao tác |

Lần chạy thứ hai (bản demo mới, thao tác tách riêng để cô lập nguyên nhân):

| Thao tác | Số đối tượng | Tổng diện tích | Hoàn tác |
|---|---|---|---|
| mở bản demo | 117 | 59,9 m² | 1 bước |
| **chỉ gán** "Vách ngăn · Interior" (không đụng hình) | **128** | **58,5 m²** | 2 bước |
| dời tường 50 mm | **126** | 58,5 m² | 3 bước |
| dời tiếp 450 mm | 126 | **51,2 m²** | — |

⇒ Hai điều đọc được ngay: (a) **một thao tác chỉ khai ngữ nghĩa cũng làm bản vẽ mọc thêm 11
đối tượng và tổng diện tích tụt 1,4 m²**; (b) dời tường làm **biến mất 2 đối tượng** (khối
khoét của cửa/cửa sổ mất tường chủ) — im lặng, không thông báo.

## 3 · Từng GAP — bằng chứng, mở lại kiểm được

**G-M2-01 · một tường = hai hình rời.** Bấm 1 lần chỉ chọn được vùng tô (`selection` chỉ có id
của hatch); đường bao là entity khác, không có liên kết cha-con. Dời xong đo được hai nửa cách
nhau 450 mm (bảng §2). Không có nút "chọn cả tường", không cảnh báo.

**G-M2-02 · 2D và 3D nhìn hai nửa khác nhau.** `lib/three/cad-to-obj.ts:558-562` — bộ dựng 3D
lọc **chỉ hatch**; đường bao (polyline) không dựng. Sau khi dời: chặng 2D vẫn vẽ đường bao ở
chỗ cũ, chặng 3D dựng khối ở chỗ mới ⇒ cùng một bức tường, hai vị trí, tuỳ chặng đang mở.

**G-M2-03 · diện tích trên bản vẽ là chữ chết.** Nhãn "36,7 m²" là `TextEntity` độc lập, không
phái sinh từ hình. Đo: hình đổi, nhãn không đổi, trong khi ô tổng ở thanh trạng thái
(`components/cad/CadEditor.tsx:2099-2140`, `RoomStatsBadge`) tính lại ⇒ hai con số chỏi nhau
cùng lúc trên một màn hình.

**G-M2-04 · không có đối tượng PHÒNG.** `findRoomLabels` (`lib/cad/standards/checker.ts:118`)
dò biên phòng **mỗi lần vẽ lại**, từ hình học tường; nhãn phòng của bản demo **không có
`roomType`** (kiểm 31 text: rỗng hết). Phòng nào dò không ra biên thì `areaM2 = null` và
**bị bỏ qua khi cộng tổng** (`checker.ts:263` + `CadEditor.tsx:2118`) — tổng tụt mà không có
dòng nào nói "phòng X không đo được". Đây đúng khuyết ③ đã ghi ở
`SPEC-TANG-DU-LIEU-CAU-KIEN.md §0.5`, nay đo được bằng số.

**G-M2-05 · chặng 3D không có Hoàn tác.** Ở chặng Thiết kế 3D bấm ⌘Z hai lần (một lần trước,
một lần sau khi bấm vào khung nhìn để chắc chắn có focus): dữ liệu **không đổi**, ngăn Hoàn
tác **không đổi**, **không có thông báo nào**. Phím Hoàn tác chỉ được đăng ký trong từng màn
riêng: `components/cad/CadCanvas.tsx:1976` · `components/FlowCanvas.tsx:494` ·
`components/present-editor/PresentEditor.tsx:1394` · `.../boq/BoqScreen.tsx:150` ·
`components/photo-editor/PhotoEditor.tsx:82` — 5 ngăn rời, chặng 3D không có ngăn nào.

**G-M2-06 · không có bản xem trước khi sửa hình.** `components/cad/CadCanvas.tsx:2863-2866` —
nhánh vẽ của lệnh `move`/`copy` chỉ vẽ **một đoạn thẳng** từ điểm gốc tới con trỏ; `rotate`,
`mirror` y hệt. Bóng hình theo con trỏ chỉ có ở bước đặt khối mới (`:2916-2921`). Quan sát
trên app khớp: lúc dời chỉ thấy dây thun + số "515 mm ∠ 181,4°", không thấy tường sắp đi đâu.

**G-M2-07 · hình dẫn xuất chảy vào bản vẽ và bị đếm như hình người vẽ.** Sau thao tác sửa đầu
tiên, bản vẽ mọc thêm các đối tượng id `opening-*` (khối khoét cửa/cửa sổ do
`lib/cad/hosting.ts` `syncHostedOpenings` dựng lại sau **mọi** thay đổi). Chúng nằm trên lớp
tường nên `isWallLikeEntity` (`checker.ts:205-210`) đếm chúng là tường ⇒ bộ đếm ở bảng thuộc
tính nhảy 29 → 38 sau một thao tác không liên quan. Chiều ngược lại: dời tường ⇒ 2 khối khoét
mất tường chủ **biến mất không báo** (128 → 126).

**G-M2-08 · số khai ≠ hình vẽ.** Khai "Dày 220 mm" ở bảng thuộc tính: ghi được
(`wallThicknessMm = 220`) nhưng hình vẫn rộng **100 mm**; không có cảnh báo lệch ở bất kỳ đâu
(quét chữ trên màn: không có "lệch"/"không khớp"/"cảnh báo"). Đây là **thiết kế có chủ ý**
(`lib/cad/wall-types.ts:40` ghi rõ "chỉ là metadata KHAI BÁO"), nhưng hệ quả nghiệp vụ vẫn là
một khuyết: hồ sơ/BOQ không biết lấy số nào, và không ai đi đối chiếu hai số đó. Phụ: ô nhập
chỉ ghi khi **rời ô** — gõ xong mà chưa rời thì chưa vào dữ liệu.

**G-M2-09 · phiên hết hạn giữa lúc sửa.** Đang sửa thì hiện băng "Phiên đăng nhập đã kết
thúc · bản vẽ của bạn vẫn được giữ nguyên tại máy". Đo ngay lúc đó: bản vẽ còn đủ 126 đối
tượng, nhưng **Hoàn tác/Làm lại = 0/0** (mất sạch) và khung nhìn hỏng (`viewport.scale` = **âm**
−0,0127) ⇒ **màn hình trắng trơn**, người dùng tin là mất bài. Bấm "Đăng nhập lại" thì hình
hiện lại, lịch sử thao tác thì không.

**G-M2-10 · nghi mất bước Hoàn tác (CHƯA tái hiện).** Ở lần chạy đầu, sau khi gán loại tường,
ngăn Hoàn tác đo được **tụt từ 2 xuống 1**; bấm ⌘Z ba lần sau đó **không** đưa tường về vị trí
cũ (ngăn cạn ở 0 mà hình vẫn ở chỗ mới). Thử tái hiện hai lần với chuỗi thao tác gần nhất
(gán thuộc tính · huỷ lệnh giữa chừng bằng Esc rồi gán) đều **không lặp lại** — ngăn tăng đúng
1 → 2 → 3 → 4. Ghi lại nguyên trạng để điều tra, **không kết luận nguyên nhân**.

## 4 · Điều KHÔNG kiểm được / cố ý không làm

- **Không thử trên hồ sơ khách**: bản vẽ dùng để đo là bản demo do chính IF sinh ra (đường
  "Bắt đầu → Mở bản demo"). Đường nhập DWG/DXF thật thuộc mảng M1 (T3), không lặp lại ở đây.
- **Không kiểm chặng Trình chiếu**: định mở thì phiên đăng nhập hết hạn (G-M2-09); để lại vòng
  sau. Nghi vấn cũ "Trình bày chỉ nhận ảnh, không nhận dữ liệu"
  (`SPEC-TANG-DU-LIEU-CAU-KIEN §0.6`) **chưa đo lại trong phiên này**.
- **Không kiểm vùng công năng (Zone)** — bản demo không có Zone nào; dạng ② của "ba dạng
  phòng" chưa chạm tới.
- **Không đo được hình 3D bằng con số** (không có cửa đọc scene ra ngoài): kết luận G-M2-02 dựa
  trên đọc code bộ dựng + quan sát trên màn, không phải đo toạ độ trong 3D.

## 5 · Vệ sinh sau khi đo

Bản vẽ demo đã nạp vào dự án dùng để thử được **xoá sạch về 0 đối tượng** sau khi đo; kiểm lại
kho lưu của trình duyệt: cả 2 bản ghi đều `ents: 0`, đúng như lúc bắt đầu phiên. Không đụng
`dev.db`, không tạo dự án mới, không xoá dự án nào.

## 6 · Ghi chú môi trường (ảnh hưởng tới việc chạy lại)

- Máy đang chạy **nhiều phiên song song**; lúc bắt đầu có 3 dev server cùng dùng chung thư mục
  build `.next` (cổng 3000 · 3001 · 3002). Hai server mới **tự chết**, server cổng 3000 (đã
  chạy 27 giờ) trả 404 cho mọi tệp tĩnh ⇒ app không mở được.
- Cách chữa đã dùng: dừng server của phiên này, **xoá `.next`** (thư mục build, đã gitignore,
  tự dựng lại) rồi chạy lại **một** server ở cổng 3001 → app chạy bình thường. Ghi ra đây vì
  đây là thay đổi trên trạng thái dùng chung: phiên nào đang mở app ở cổng 3000 sẽ phải khởi
  động lại server của mình.
- Không commit gì (V6). Tệp đã sửa trong phiên: `docs/GAP-IF.md` (thêm 10 dòng G-M2-\*) và
  `docs/M2-OUT.md` (tệp này).

════════════════════════ M3-OUT.md ════════════════════════
# M3-OUT — vòng chẩn đoán nội thất (06/08) · CHỈ LOG GAP, KHÔNG SỬA

Chạy 2 phép thử xuyên qua IF như một KTS thật đang dùng app (§0q: task là **phép thử IF**, sản
phẩm dự án là sản phẩm phụ). **Không sửa một dòng code nào** trong vòng này. Không commit (V6).

- **T2** — bảng FF&E (.csv 9 cột) + ảnh phối cảnh đi vào luồng **vision → block → BOQ**.
- **T3-thả** — thư viện IF có đủ block văn phòng để bố trí không.

Dữ liệu dự án + log chạy: `2407-Test/M3-out/` (gitignore chặn, `git check-ignore` xác nhận
`.gitignore:37`). Tài liệu này **trung tính**: chỉ nói năng lực IF, không nêu số liệu/tên khách.

> Bằng chứng ở đây là **mức code + chạy thật hàm thật** (sucrase-node, grep tự chạy trong phiên),
> **chưa** có lượt nghiệm thu trình duyệt cho từng mục — xem §4 "Chưa verify".

---

## 1 · T2 — vision → block → BOQ

### 1a. IF bốc fur từ phối cảnh được không? — **được MỘT món/lượt, không ra danh sách**

| Mắt xích | Hiện trạng đọc được trong code | Kết luận |
|---|---|---|
| Tách món khỏi nền | `ai.furnitureextract` (`lib/nodes/defs/render-v2.ts:363`) — 1 ảnh vào, 1 cutout + 1 mask ra (BiRefNet nếu có khoá, không thì tách theo màu nền viền) | 1 món/lượt |
| Đo kích thước | `vision.measureobject` (`lib/nodes/defs/metrology.ts`) — đo MỘT món, trả số + dung sai + độ tin | 1 món/lượt |
| Liệt kê N món trong ảnh | không có bước nào | **thiếu hẳn** |
| Chở bảng giữa các node | `DataType = 'image' \| 'text' \| 'mask' \| 'number' \| 'video'` (`lib/types.ts:1`) | **không có kiểu bảng** ⇒ danh sách FF&E không tồn tại được như dữ liệu chạy trong luồng |

⇒ Muốn ra bảng N món thì phải chạy tay N lượt rồi tự gõ lại tên/mã — đúng chỗ đau của task.

### 1b. Từ món đo được có ra **block / bản vẽ** không? — **code có, mặt tiền KHÔNG có**

`lib/vision/match-template.ts` (bước ⑤ khớp block thư viện theo tỉ lệ w:d) và
`lib/vision/ortho-projection.ts` (bước ⑥ ba hình chiếu) đã viết xong, có test. Nhưng:

```bash
grep -rn "match-template\|ortho-projection" components app --include="*.tsx" --include="*.ts"
# → 0 dòng
```

⇒ Không có nút nào trong app đi từ "món đã đo" sang "block trên bản vẽ". Dây chuyền đứt đúng
giữa **vision** và **block**.

### 1c. Ra FF&E **có ảnh** không? — **một tấm JPG cho MỘT món, không phải hồ sơ FF&E**

- Có: `lib/render-studio/measurement-spec-sheet.ts` → 1 tấm `spec-sheet.jpg` 300dpi (ảnh món +
  bảng số đo + dấu cảnh báo mặt khuất), gọi từ `components/render-studio/ToolModeForm.tsx`.
- Không có: hồ sơ nhiều món (mã · ảnh · finish · vendor · giá · số lượng · checkbox duyệt) —
  đúng mục **F1 chưa làm** trong `docs/DUONG-VE-DICH-3-DOT.md:157`.
- Bảng BOQ trên UI: **10 cột**, không có cột ảnh (`components/present-editor/boq/BoqTable.tsx:176-186`).
- Xuất `.xlsx`: `lib/boq/xlsx.ts` tự dựng OOXML tối thiểu qua jszip, 1 sheet, chuỗi inline —
  `grep -n "image\|drawing\|media" lib/boq/xlsx.ts` → **0 dòng** ⇒ file xuất ra **không nhúng ảnh được**.

### 1d. Nhập bảng FF&E vào kho — **4/9 cột rơi + 1 bug ghép cột**

Chạy thật qua đúng cửa nhập của app (`parseSpreadsheetFile` → `guessMapping` → `buildImportRows`),
log đầy đủ: `2407-Test/M3-out/T2-nhap-bang-ffe.log`.

| Cột trong bảng FF&E | Field IF nhận | Ghi chú |
|---|---|---|
| Tên sản phẩm · SKU · Rộng · Sâu | `name` `sku` `w` `d` | đúng |
| **Cao** | ❌ rơi | bị cột khác chiếm chỗ — xem bug dưới |
| **Vật liệu** · **Màu sắc** · **Độ tin cậy** · **Phòng** | ❌ không có field | `MATERIAL_FIELDS` chỉ 9 field (`lib/materials/warehouse/column-mapping.ts:7`) |

**Bug đo được:** từ khoá đoán cột của `hUp` có chữ cái đơn `'h'` và khớp theo *chuỗi con*, nên
tiêu đề "Phòng" (chuẩn hoá thành `phong`, có chứa `h`) bị gán vào **Cao**; cột "Cao (H mm)" thật
bị bỏ. Kết quả: cả 5 dòng nhập vào **không có chiều cao**. Rủi ro y hệt đang treo ở `'w'` và `'d'`.

Hai điều nữa lộ ra ở cùng cửa này:
- `runImport` gửi cứng `kind: 'material'` (`lib/materials/warehouse/apply-import.ts`) ⇒ món nội
  thất rời nhập vào kho **thành vật liệu**, dù `ProductSpec.kind` có sẵn giá trị `'furniture'`.
- `ProductSpec` **không có trường phòng/vị trí** (`prisma/schema.prisma`) ⇒ bảng FF&E theo phòng
  không có chỗ lưu. Ngược lại `materials`/`colorHex`/`hUp` thì CÓ trong schema — chỉ là cửa nhập
  Excel không nối tới.

### 1e. BOQ **món rời** — không tính, và **im lặng**

Chạy thật: 1 bản vẽ gồm ① cụm bench 8 chỗ thả từ thư viện cụm, ② 1 ghế `BlockEntity` đã gán
`specId` + đơn giá, ③ 1 vùng tô sàn có `specId`. Log: `2407-Test/M3-out/T2-boq-mon-roi.log`.

```
Doc: 43 entity  ·  loại: {"polyline":41,"block":1,"hatch":1}
buildSchedule → "Chưa phân loại × 42" + "Ghế văn phòng × 1"
computeBoq    → 1 dòng (sàn, m²)   ·  errors: []   ·  ghế: KHÔNG có dòng, KHÔNG có lỗi
```

- `computeBoq` chỉ quét `type === 'hatch'` (`lib/boq/compute.ts:89-97`) ⇒ **mọi món rời rơi khỏi
  báo giá mà không kêu một tiếng** — nguy hiểm hơn báo lỗi, vì bảng vẫn trông "đủ".
- Không có cột **số lượng đếm** (cái/bộ): cột lượng của bảng là m² (`BoqRow.m2`).
- Cụm 8 chỗ vào bản vẽ dưới dạng **41 entity phẳng** (`clusterPrimsToEntities`,
  `lib/cad/block-library.ts`) — mất danh tính ⇒ bảng thống kê gộp vào "Chưa phân loại", không
  gán được `specId`, không lên được BOQ. Block .dxf từ thư viện cũng làm phẳng y hệt
  (`flattenBlockEntities`).

---

## 2 · T3-thả — thư viện block văn phòng có đủ bố trí không?

### 2a. Kiểm kê thật (đọc `public/cad-library/manifest.json` + `lib/cad/workstation-clusters.ts`)

- Manifest: **54 block**, 12 nhóm. Nhóm **`van-phong` = 8 block**: bàn 1400×700 · bàn 1200×600 ·
  ghế xoay · vách 1400 · vách 1200 · tủ hồ sơ thấp 800 · thấp 1200 · cao 800.
- Cụm sinh theo tham số: **6 loại** (`CLUSTER_SPECS`) — chữ L xương sống · bench thẳng hàng ·
  chữ Y 6 chỗ · góc 120° 6 chỗ · chữ thập 4 chỗ · bàn họp (chữ nhật/thuyền/tròn, tự dài theo số chỗ).
- Dùng ké được từ nhóm khác: sofa/ghế bành/bàn trà (lounge, tiếp khách) · bếp+tủ lạnh+chậu rửa
  (pantry) · cây cảnh · cửa/cửa sổ · cột · cầu thang.

### 2b. Đối chiếu với chương trình văn phòng chuẩn (mục F phiếu đề bài văn phòng của chính IF)

| Không gian phiếu đề bài hỏi | Block/cụm IF có |
|---|---|
| Chỗ làm việc mở | ✅ 2 bàn + ghế + vách + 5 kiểu cụm |
| Phòng họp lớn / nhỏ | 🟡 chỉ có bàn họp + ghế; **không có** màn hình/TV, bảng viết, bục |
| Co-working / họp mở | 🟡 ghép tạm từ bench + sofa |
| Phòng gọi điện riêng (booth) | ❌ |
| Khu tiếp khách / lễ tân | ❌ **không có quầy lễ tân** (chỉ có sofa dùng ké) |
| Pantry / khu ăn | 🟡 bếp gia đình, **không có** bàn cao/quầy bar văn phòng |
| Kho / lưu hồ sơ | 🟡 3 tủ hồ sơ, **không có** dãy kệ kho |
| Phòng máy chủ / kỹ thuật | ❌ **không có tủ rack** |
| Khu thư giãn | 🟡 dùng ké đồ phòng khách |
| (dùng chung) máy in/copy · locker | ❌ |

⇒ **Đủ để bố trí vùng làm việc mở và phòng họp; chưa đủ để bố trí trọn một sàn văn phòng.**

### 2c. Đường "thả" — hai cửa, một cửa không rơi xuống bản vẽ

```bash
grep -rn "if:library-instantiate\|LIBRARY_INSTANTIATE_EVENT" app components lib
# → 1 chỗ PHÁT (components/library/LibrarySheet.tsx:138) · 0 chỗ NGHE
```

- Thả món từ **Thư viện** (cửa được chốt 04/08 là "cửa duy nhất") ⇒ chỉ hiện toast, **không rơi
  xuống bản vẽ**. Riêng kệ "cụm bàn" chạy thật vì `ClusterPanel` gọi thẳng `addEntities()`.
- 54 block .dxf **không hiện trong Thư viện**; chỉ vào được qua panel "Nội thất (block)" tab
  "Thư viện" trong `components/cad/CadEditor.tsx:960-1000` và trang `/cad-library-demo`
  ⇒ hai cửa song song, trái chốt "một cửa".

### 2d. Tự zoning / tự bố trí theo đề bài — có máy, nhưng máy chưa biết văn phòng

`lib/cad/ai-assist.ts` **đã có** `generateLayoutOptions` (đề bài chữ → phòng → đặt nội thất áp
tường, có clearance, có học từ lựa chọn của người dùng). Nhưng bảng công năng của nó ghi
`office: ['desk']` — **một cái bàn**. Không có đường: số nhân sự → số chỗ → chọn kiểu cụm → rải
cụm vào lưới cột; cũng không đặt được các không gian dùng chung ở §2b.
Kiểm diện tích tự động hiện chỉ có cho bàn họp (`checkMeetingArea`, TCVN 4601 1,8 m²/người).

---

## 3 · GAP đã ghi

16 dòng `G-M3-01…16` trong `docs/GAP-IF.md` (trung tính, chưa sửa gì).

## 4 · Chưa verify — nói rõ, không giấu

- **Chưa nghiệm thu trình duyệt** cho bất kỳ mục nào ở trên. Bằng chứng là chạy hàm thật +
  grep tự chạy trong phiên; server 3000 đang chạy của phiên khác, chỉ dùng để kiểm
  `GET /cad-library/manifest.json → 200, 27.639 byte`.
- **Chưa mở ảnh phối cảnh** để chạy tách/đo thật — đường tách và đo cần canvas DOM, không chạy
  được ngoài trình duyệt; kết luận §1a/§1b là kết luận **về đường đi**, không phải về chất lượng
  tách của một tấm ảnh cụ thể (§0o: không nhận xét hình khi chưa mở hình).
- **Chưa thử nhập tệp .xlsx** (chỉ .csv) và chưa thử đường ghép ảnh theo SKU.

════════════════════════ M4-OUT.md ════════════════════════
# M4-OUT — vòng vò app (06/08) · chẩn đoán qua giao diện + sửa 3 lỗi tuân thủ/logic avatar

Hai phần tách bạch, KHÔNG trộn:

- **Phần A — chẩn đoán, CHỈ LOG**: bật máy chủ phát triển, đi task thật qua giao diện, gãy đâu ghi
  vào `GAP-IF.md`. Không sửa gì trong phần này.
- **Phần B — sửa, ĐƯỢC PHÉP**: gỡ màu thương hiệu khỏi avatar (bug tuân thủ) + 2 lỗi logic avatar
  Hoà chỉ ra khi xem ảnh dựng.

**V6 — không commit.** Mọi thay đổi nằm ở thư mục làm việc.

---

## A · Chẩn đoán qua giao diện

### A1. Kết quả đi task

| Đi qua | Kết quả |
|---|---|
| Vào app → chặng vẽ 2D → vẽ một đoạn tường | chạy đúng |
| Chuyển sang chặng 3D → bật dựng khối | **khối dựng lên đúng từ nét vừa vẽ ở 2D** — luật "vẽ ở đâu cũng ghi vào một nguồn" còn sống |
| Mở màn đổi ảnh đại diện, đi hết các thẻ | chạy đúng, 0 lỗi console khi nạp lại trang từ đầu |
| Quét route: kho vật liệu · bảng màu · thư viện · tệp · cài đặt · trình chiếu · hai route cũ | đều 200 |

### A2. Hai mục vào `GAP-IF.md`

- **G-M4-02 · 🔴 GAP thật** — công tắc chế độ màn vẽ hiện `Sketch/Pro/Revit` (khoá nội bộ) trên mặt
  nút, đẩy tên chính thức tiếng Việt vào tooltip. Ngược đúng chiều so với chốt tên và so với cách
  đã làm cho tên khối. Xác nhận bằng đọc DOM, không suy từ ảnh chụp.
- **G-M4-01 · ⚪ ĐÃ RÚT** — xem A3.

### A3. 🔴 Một kết luận của chính phiên này đã bị chứng minh là SAI — ghi lại để không ai lặp

Giữa phiên tôi báo: *"`/login` trả 404 dù trang tồn tại và biên dịch sạch — tái hiện trên cả máy chủ
sạch lẫn máy chủ cũ, ép biên dịch lại vẫn 404"*. **Kết luận đó không đứng vững.** Đo lại sau đó:
`/login` trả **200**.

Nhật ký máy chủ cho thấy cơ chế thật:

```
✓ Compiled /login  →  ✓ Compiled /_not-found  →  GET /login 404
✓ Compiled /settings/avatar → GET /settings/avatar?… 404 → GET /settings/avatar 200
```

Lần gọi ĐẦU ngay sau khi một route vừa biên dịch **đôi lúc** rơi vào nhánh không-tìm-thấy; gọi lại
là 200. Tật của máy chủ phát triển, không có trong bản phát hành.

**Bài học vận hành, quan trọng hơn cả cái GAP hụt:** 404 trên máy chủ phát triển **không phải bằng
chứng lỗi**. Trong phiên này một máy chủ chạy hơn một ngày trả 404 cho cả `/` lẫn `/login` trong khi
trang khác vẫn 200 — suýt nữa tôi ghi hai lỗi sản phẩm không tồn tại. Đo lại trên tiến trình MỚI
rồi mới được kết luận.

### A4. Việc phụ nhặt được, chưa xử lý

- `npx tsc --noEmit -p .` còn **1 lỗi CŨ** ở `lib/cad/render-layer-index.test.ts:36` (TS2352, thiếu
  `panX/panY`) — có từ commit gần nhất, **không phải của phiên này**. Chưa sửa (ngoài phạm vi).
- Nhật ký máy chủ có vài lượt `/api/*` trả 404. **Chưa xác minh** là thiếu route thật hay cùng tật
  đua ở A3 — không ghi thành GAP khi chưa đo lại.

---

## B · Ba việc đã sửa trên avatar

### B1. Gỡ màu thương hiệu (bug tuân thủ)

Ba màu của một studio khách bị nhúng cứng ở **10 chỗ**: bảng màu áo (`navy`/`orange`/`white`) và 7
chỗ vẽ thẳng trong SVG (dải mũ phớt · quả bông mũ len · ghim cổ · đèn tai nghe · băng đô · vòng viền
khung · ba sắc navy của mũ). Đổi hết sang màu trung tính cùng họ, **giữ nguyên KEY** nên ảnh đại
diện người dùng đã lưu chỉ đổi sắc độ, không mất lựa chọn.

Miễn trừ cũ trong `lib/legal/brand-neutrality.test.ts` dựa vào hai lập luận, cả hai đã hết hiệu lực:
① "avatar là giao diện của app nên được có nhận diện riêng" — luật cho phép nhận diện riêng của
**sản phẩm này**, không phải của một studio khách (chính chú thích cũ đã tự nhận là chưa đủ);
② "avatar sắp đổi sang ảnh thật nên sửa màu là sửa thứ sắp bỏ" — nhưng bản vẽ vẫn là đường dự phòng
đang chạy thật, và đợt đổi kiến trúc chưa có ngày.

⇒ **Gỡ miễn trừ.** Hai tệp avatar nay nằm trong lưới quét; thêm nhóm kiểm `[3]` khẳng định riêng
rằng chúng **thực sự nằm trong tập được quét** — không chỉ "sạch". Đổi tên tệp hay đổi phạm vi quét
mà làm chúng rơi ra ngoài lưới thì test đỏ, thay vì im lặng xanh.

### B2. SỬA 1 — da phải là MỘT biến

**Gốc lỗi:** `skin` vốn đã là một biến, nhưng **12 chỗ vẽ da mỗi chỗ tự bịa hệ số riêng**
(`darken(skin, .04/.12/.18/.20/.24/.30/.32/.34/.36/.50/.55)`). Hệ quả đọc được bằng mắt: tai trái
`−.04` còn tai phải `−.20` — lệch nhau `.16` trong khi cả khối cầu khuôn mặt chỉ đi từ `+.16` xuống
`−.12`, tức **tai phải tối hơn cả chỗ tối nhất của mặt**. Cổ `−.18` cũng không khớp nấc nào của mặt.

**Sửa:** đúng một thang `skinRamp(base)` — nơi DUY NHẤT được pha sáng/tối lên da, 7 nấc có tên
(`lit · sheen · base · shade · recess · deep · cast`). Tai trái lấy `base`, tai phải lấy `shade` —
đúng hai nấc mà chính gradient khuôn mặt dùng ở hai phía đó, nên tai không còn "rời" khỏi mặt.

### B3. SỬA 2 — đội nón thì tóc phải biết

**Gốc lỗi:** `config.hat` **chỉ được truyền cho phần vẽ nón**. Ba phần vẽ tóc (lớp sau, lớp trước,
bóng chân tóc) không hề nhận nó ⇒ tóc vẽ y hệt nhau dù có nón hay không, nón chỉ được đắp đè lên.
Kiểu tóc khối cao chui lên trên cả thân nón; bóng chân tóc vẫn hắt xuống trán dù chân tóc đang nằm
khuất dưới nón.

**Sửa:** mỗi nón khai mép dưới phần che kín sọ (`HAT_COVER_Y`). Tóc lớp TRƯỚC bị cắt trên mép đó;
tóc lớp SAU giữ nguyên nên đuôi và lọn dài vẫn lộ ra dưới nón; bóng chân tóc tắt khi chân tóc khuất.
`null` cho băng đô và tai nghe — hai thứ này nằm TRÊN tóc, tóc phải nguyên vẹn. Đây là lý do bảng
này không thể thay bằng một cờ đúng/sai.

### B4. Test khoá — `lib/avatar-invariant.test.ts` (mới), 23/23

Dựng **thật** bằng React chứ không đọc nguồn dạng chữ, vì hai lỗi trên là lỗi HÀNH VI: "tai ≠ mặt"
chỉ lộ ra sau khi đã tính xong màu, "nón không đổi tóc" chỉ lộ ra khi so HAI bản dựng khác cấu hình.
Gỡ được hai rào từng buộc test cũ phải đọc chữ: vá bộ phân giải đường dẫn cho bí danh `@/`, và gắn
`React` toàn cục cho JSX lối cổ điển — **không sửa tệp sản phẩm để chiều test**.

| Nhóm | Khoá điều gì |
|---|---|
| `[1]` | Mọi vùng da tô đúng nấc của thang (90 vùng × 6 tông) · màu tai nằm trong bộ màu khuôn mặt · đổi tông da thì **0 vùng đứng yên** · **0 chỗ tự pha sáng/tối lên `skin`** ngoài thang · miễn trừ pha-màu-khác đúng 2 chỗ đã biết (môi, má) |
| `[2]` | Mọi kiểu nón đều khai mép che (không sót) · nón che sọ → tóc ĐỔI THEO (5/5) và cắt đúng mép đã khai · nón không che sọ → tóc NGUYÊN VẸN (3/3) · tóc dài phía sau vẫn lộ · bóng chân tóc tắt/bật đúng **cả hai chiều** |
| `[3]` | Đổi tông da → **mọi đường hình học y hệt** (cấm chạm hình/khối) và màu cấu kiện không trôi theo da · ba trục đổi-được (tông da · phụ kiện · nền) phải thật sự đổi được |

**Đã chứng minh test cắn thật** — bẻ lại đúng hai lỗi cũ, mỗi lần phục hồi ngay:

| Bẻ lại | Test bắt |
|---|---|
| tai phải về hệ số tự bịa | 3 FAIL (lệch thang 6 vùng · tai ≠ mặt · 1 chỗ pha ngoài thang) |
| gỡ phép cắt dưới-nón khỏi tóc lớp trước | 1 FAIL (`tóc ĐỔI THEO 0/5`) |

`avatar-render.test.ts` (khoá toạ độ, có sẵn) · `avatar.test.ts` · `brand-neutrality.test.ts` đều
PASS, không hồi quy. `tsc` không thêm lỗi mới.

### B5. Ảnh dựng để nhìn (`docs/screenshots/`, `.gitignore` chặn — ảnh xem, không commit)

| Tệp | Nội dung |
|---|---|
| `avatar-truoc-va.png` · `avatar-sau-va.png` | 8 kiểu, cùng cấu hình — chứng minh **chỉ đổi màu, không đụng một toạ độ nào** |
| `avatar-sua-logic.png` | A/B logic cũ ↔ mới, **cùng bảng màu**: tóc hết chui qua mũ len/lưỡi trai/phớt; băng đô và tai nghe giữ nguyên (bằng chứng không sửa quá tay) |

Lấy bản trước vá bằng cách đọc thẳng từ lịch sử ra thư mục tạm, **không dùng `git stash`** — kho
đang có phiên khác làm song song, stash trơn sẽ cuốn cả tệp của họ. Thư mục làm việc không bị đụng
một byte (đã đối chiếu số dòng thay đổi trước/sau).

---

---

## C · Vòng SỬA (06/08, sau chẩn đoán) — 2 agent: 1 làm · 1 kiểm phản biện

### C0. BƯỚC 0 (N7) — grep trước, và nó đổi hẳn việc phải làm

| Định thêm | Grep ra | Xử lý |
|---|---|---|
| Tên chính thức 3 chế độ vẽ 2D | **ĐÃ CÓ** — `CadStageScreen.tsx:55/63` khai `[vi,en]`; `mode-registry.ts:36`; `i18n.ts:30` có `useT()` | **NỐI**, không đặt tên mới |
| "Lỗi lông mày theo kiểu nón" | **KHÔNG TỒN TẠI** — xem C3 | Không sửa |

### C1. G-M4-02 — nút chế độ hiện tên chính thức ✅

Đảo nhãn trong `ModeSwitch`: mặt nút nay là `Sơ phác` · `Kỹ thuật` · `Nội thất`, khoá kỹ thuật
biến khỏi giao diện nhưng **`onChange('sketch'|'pro'|'revit')` nguyên vẹn từng ký tự** (đổi khoá =
vỡ dữ liệu đã lưu). Nhãn đi qua `useT()` sẵn có nên EN ra `Sketch · Technical · Interior` — hết
mượn tên phần mềm hãng khác.

Tự nghiệm thu trên trình duyệt thật: nút hiện đúng tên · **0 chuỗi khoá kỹ thuật lọt ra giao diện**
(đọc DOM) · nhánh EN gạt tay xác nhận · thanh công cụ có tràn nhưng cuộn được và **đã tràn từ trước
khi sửa** nên không phải hồi quy.

### C2. 🔴 Kiểm phản biện phát hiện test khoá của chính vòng trước LÀ LỖ — đã vá

Vòng trước tôi báo "23/23, đã chứng minh cắn thật bằng 2 đột biến". **Kết luận đó quá vội.** Hai
đột biến tôi thử là loại *sửa thật thà*; agent phản biện thử 16 đường, trong đó **4 đường lách làm
test xanh y nguyên trong khi bug đã tái phát**. Tôi dựng lại từng cái để tự xác nhận, không tin lời:

| Đường lách | Trước vá | Sau vá |
|---|---|---|
| Dựng lại **nguyên bug gốc** (tai `−.04`/`−.20`) nhưng **xoá `data-skin`** | 🟢 xanh 23/23 | 🔴 2 fail |
| `HAT_COVER_Y.cap → null` (tóc chui xuyên mũ lưỡi trai trở lại) | 🟢 xanh 23/23 | 🔴 3 fail |
| `beanie: 88 → 200` (cắt bay cả tóc mai) | 🟢 xanh | 🔴 1 fail |
| Ép cả 6 nấc thang da về `0` (mặt phẳng lì, mất sạch khối) | 🟢 xanh | 🔴 1 fail |

**Gốc rễ — hai sai lầm thiết kế test, đáng nhớ hơn bản thân bug:**

1. **Khoá theo DẤU thay vì theo HÀNH VI.** Rào cũ chỉ soi phần tử mang `data-skin`; bỏ một thuộc
   tính `data-*` không đổi một pixel, không tsc/lint nào cản. Rào phụ grep `darken(skin` — khoá
   TÊN BIẾN, nên `darken(BASE_TONES[config.base], .2)` đi thẳng qua.
   → Rào mới không dùng dấu nào: **«màu nào ĐỔI khi đổi tông da thì bắt buộc phải là một nấc của
   thang»**. Vẽ da bằng đường nào cũng rơi vào lưới này.
2. **Kỳ vọng dẫn xuất từ chính thứ đang bị kiểm.** `covering = HAT_STYLES.filter(h => HAT_COVER_Y[h] !== null)`
   ⇒ bảng đổi thì kỳ vọng đổi theo, luôn tự khớp; đặt cả 8 nón về `null` thì thành `0 === 0` xanh rỗng.
   → Nay là **danh sách viết tay** dựa trên sự thật vật lý của từng cái nón (mũ phớt/len/lưỡi trai/
   tai bèo/nồi ôm sọ; băng đô đè lên tóc; tai nghe vòng qua), cộng rào "hai danh sách phải phủ đủ
   mọi kiểu nón" nên thêm nón mới là buộc phải khai.

Vá thêm 4 chỗ nhỏ agent chỉ ra: phép cắt nay kiểm **trên thẻ `<g>`** chứ không chỉ trong `<defs>`
(gỡ clip khỏi `<g>` mà định nghĩa còn thì bản cũ vẫn xanh) · chọn tai bằng **toạ độ** thay vì bằng
`data-skin` (bản cũ gom nhầm 2 thẻ `<stop>` của gradient mặt vào tập "tai" ⇒ tự so với chính mình) ·
thêm chốt chống-rỗng cho phép so hình · **bỏ một tích xanh KHAI MAN**: dòng ghi "bảng nền vẫn trung
tính" nhưng thân hàm chỉ ĐẾM số key — nhét đúng màu beige thương hiệu vào vẫn in `ok`.

`lib/avatar-invariant.test.ts` nay **31 ok / 0 fail**.

### C3. Bộ quét trung tính cũng thủng — đã vá (đúng phép Hoà chỉ định)

Phép "để lại 1 hex lạ xem test có đỏ không": hex **bắt được** mọi ca (thường, HOA, 8 số, trong
chuỗi), chú thích **tha đúng**, và làm thủng lưới quét thì nhóm `[3]` **vẫn bắt**. Nhưng ba cú pháp
CSS **hợp lệ và đang phổ biến** đi thẳng qua: `RGBA(` viết hoa · `rgb(240 96 32)` cách bằng dấu
cách · `rgb(240 96 32 / 50%)`. Nguyên nhân: bản cũ **so chuỗi** sau khi bỏ hết khoảng trắng, nên
`rgb(240 96 32)` thành `rgb(2409632)` không khớp gì nữa.

Đúng **cùng loại lỗi** mà docblock của chính file đó đã ghi ("quét hex là KHÔNG ĐỦ"), chỉ lùi một
bậc. Nay **bóc số ra khỏi lời gọi** thay vì so chuỗi, không phân biệt hoa/thường, mọi dấu phân cách.
Còn sót có ghi rõ: `hsl()` và `color(srgb …)` viết cùng một màu vẫn lọt — muốn bắt phải đổi hệ màu.
`brand-neutrality.test.ts` nay **16 ok / 0 fail**.

### C4. Lông mày — KHÔNG có lỗi, không sửa

Hoà giao "sửa lông mày 2 kiểu (băng đô, tai nghe) ra màu lạ — bind về đúng biến". Đo ba đường, cả
ba nói ngược lại:

1. **Hành vi**: giữ nguyên màu tóc, đổi qua cả 8 kiểu nón → lông mày ra **cùng một mã màu** ở cả 8.
2. **Hình học**: mép dưới băng đô cách lông mày 5,4–10,8 px (đo theo từng hoành độ); vòng gọng tai
   nghe ở tầm lông mày nằm cách gần 40 px. Không chỗ nào chạm.
3. **Nguồn**: `AvatarRenderer.tsx:302` bind `color={darken(hair, 0.22)}` — một biến duy nhất, `hat`
   không đi vào đó. Thumbnail cũng không phá (`AvatarBuilder.tsx:123` chỉ override đúng 1 thuộc tính).

⇒ Lông mày **đã bind đúng biến rồi**. Thứ Hoà nhìn thấy gần như chắc chắn là do **ảnh A/B tôi gửi
lượt trước**: tôi chọn tóc `pink` cho cột băng đô và `silver` cho cột tai nghe, mà lông mày bám màu
tóc nên ra hồng tím / xanh xám. **Lỗi trình bày của tôi, không phải lỗi code.**

Có một khuyết tật THẬT nằm cạnh đó, nhưng nó là quyết định mỹ thuật nên tôi **không tự đổi**: lông
mày bám cả 4 màu tóc phi tự nhiên (teal → xanh lục sẫm, pink → hồng tím, lilac → tím, silver → xanh
xám). Người nhuộm tóc hồng thì lông mày vẫn nâu. Chờ Hoà chọn: **(a)** giữ nguyên · **(b)** kẹp lông
mày về dải nâu-đen tự nhiên (1 dòng + 1 rào test).

---

## Còn treo

- Đường thẳng test tôi vẽ vào app lúc đi task **chưa dọn** (nằm trong bộ nhớ đệm trình duyệt của
  phiên chạy thử, không phải cơ sở dữ liệu). Chờ Hoà cho phép.
- Máy chủ phát triển cổng 3005 do phiên này bật vẫn đang chạy nền.
- `G-M4-02` chưa sửa — đúng luật vòng chẩn đoán chỉ log.

════════════════════════ M5-OUT.md ════════════════════════
# M5-OUT — mảng GIAO DIỆN · vòng chẩn đoán 06/08 · CHỈ LOG GAP, KHÔNG SỬA

Đi **3 task** như một KTS thật đang dùng app (§0q), nhưng chỉ hỏi **một câu ở tầng giao diện**:
*màn nào task CẦN mà bộ mock không có · màn nào có mock nhưng mock lệch nhu cầu task.*

**Không sửa một dòng code, không sửa một trang mock, không commit (V6).**

- Kết quả trung tính → `docs/GAP-IF.md` dòng **G-M5-01 … G-M5-15**.
- Việc phải làm → `docs/PHIEU-PORT-GIAO-DIEN-2026-08-06.md` (Bảng A port được · Bảng B sửa
  trước khi port · Bảng C phải vẽ mới).

---

## 1 · Cửa kiểm mock — số thật

`npm run check:mocks` (06/08):

```
67 trang quét · 44 ĐỎ · 23 sạch · 80 loại lỗi · 856 lần vi phạm
```

**Bộ 57 trang** trong phiếu = 67 trang trong thư mục **trừ 10 trang `.dc.html`** (bản xuất từ
công cụ thiết kế). Cả 10 trang `.dc` đều ĐỎ, không trang nào lọt.

| Luật | Số trang | Đọc thành lời |
|---|---|---|
| LINK-CUC-BO | 23 | trỏ tệp kịch bản/CSS cục bộ ⇒ mở ở máy khác không ra như tác giả thấy |
| HANDLEBARS | 23 | còn chữ mẫu `{{ }}` chưa thay |
| FONT-SHORTHAND | 15 | `font:` viết tắt nuốt font-family ⇒ chữ Việt rơi về font hệ thống |
| THIEU-DATA-THEME | **19** | chỉ dựng MỘT theme — đúng nguyên nhân lỗi màn tối đã ghi |
| HEX-TTT · MOCK-RONG | 0 | sạch |

## 2 · Cửa kiểm ĐANG ĐỂ LỌT một kiểu hỏng (đo bằng mắt, không suy)

Mở thật bằng trình duyệt 4 trang. Hai trang `.dc` cho kết quả nặng hơn bảng lỗi mô tả:

- **`HopXuatPDF.dc.html`** — hộp thoại dựng ra được, nhưng ô khổ giấy hiện đúng chữ `{{ k.ten }}`,
  danh sách tờ trống, vùng xem trước rỗng. Nút bấm không nói được nó sẽ xuất cái gì.
- **`Thư viện.dc.html`** — vỏ kệ dựng đủ, **ruột trống trơn**: `{{ k.ten }} {{ k.so }}`,
  `{{ TENNHOM }}`, vùng lưới trắng bóc. Trang này trỏ tới **4 trang con** (`KeVatLieu` ·
  `KeDoDac` · `KeDangGom` · `CotThongSo`) — **không trang nào tồn tại trong repo**.

⇒ Cửa kiểm có luật ⑥ "mock rỗng" (đo theo dung lượng + số thẻ) nên **hai trang này lọt lưới**:
chúng nặng vài chục KB và đầy thẻ, chỉ có **dữ liệu là chết**. Đây đúng cơ chế mà luật ⑥ sinh ra
để chặn — phiên sau thấy `ls docs/mocks/` có "Thư viện", tưởng đã có hợp đồng, mở ra trắng, rồi
tự chế. **Thiếu luật "trang con thiếu"** (G-M5-05).

Hai trang mở đối chứng thì lành: `mock-if-thu-vien.html` dựng đủ 6 kệ có số lượng, chỉ sót 4 chỗ
chữ mẫu (tên dự án ở thanh trên + nút đổi theme); `mock-cad-shell-v5.html` dựng đủ vỏ chặng vẽ.

## 3 · Đi 3 task — màn nào có hợp đồng, màn nào không

Ký hiệu: ✅ có mock dùng được · 🟡 có mock nhưng ĐỎ/lệch · ❌ không có mock.

### T1 — sửa lại một thành phần của hồ sơ đã thiết kế

| Bước người dùng | Mock | Ghi chú đo được |
|---|---|---|
| Chọn dự án đã có | ✅ | `mock-if-du-an-v2` sạch |
| Mở hồ sơ CAD | 🟡 | **6 trang cùng tả một màn**, 3 trang trùng tiêu đề, không trang nào ghi "bản chốt" (G-M5-03) |
| **Nhập bản vẽ có sẵn + tiến độ + huỷ + báo cáo nạp** | ❌ | grep 67 trang = 0 (G-M5-01) |
| **Chọn 1 cấu kiện → Inspector** | 🟡 | trang Inspector duy nhất chỉ tả **phòng** (diện tích · vật liệu sàn · thành tiền); code đã đi trước mock (dải 4 trang Khối/Phòng/Tường/Chung) ⇒ port ngược = thụt lùi (G-M5-02) |
| Đổi vật liệu của vật đang chọn | ✅ | `mock-if-thu-vien` có ô "Dùng cho vật đang chọn" (trang ĐỎ, sửa được) |
| Xem lại ở 3D | 🟡 | `mock-3d-thong-nhat` ĐỎ; `mock-if-bang-cong-cu-3d` sạch |
| **Xuất lại hồ sơ (PDF · tờ giấy · nét in)** | 🟡 | 4 trang, **cả 4 chết dữ liệu** (G-M5-04) |
| **Ghi phiên bản · so trước–sau · phát hành lại** | ❌ | không mock, không màn (G-M5-06) |

> Inspector trong mock ẩn sau phím `s` không ghi chú ở đâu — phải đọc mã nguồn trang mock mới
> tìm ra trạng thái quan trọng nhất của T1. Ghi lại để phiên port khỏi kết luận "mock không có
> Inspector".

### T2 — từ phối cảnh bốc tách đồ, ra bản vẽ + spec + bảng khối lượng

| Bước | Mock | Ghi chú |
|---|---|---|
| Đưa ảnh vào chặng dựng ảnh | 🟡 | `mock-mood-collab-g2` sạch; `mock-if-ai-3d`, `mock-render-layout-H3` ĐỎ (một theme) |
| **Cửa sổ công cụ bốc tách + đo món** | ❌ | trang tool-window duy nhất tả việc khác (G-M5-07) |
| **Bảng N món** | ❌ | 0/67 (G-M5-08) |
| **Kho vật liệu · cửa nhập bảng tính** | ❌ | **màn đã CODE mà chưa từng có mock** (G-M5-10) |
| Bảng khối lượng | 🟡 | mock 7 cột vs code 10 cột, lượng là m², **không cột số lượng**; trong khi **trang hồ sơ trình khách ĐÃ vẽ bảng món có cột SL + đơn vị "cái/tấm"** — hai trang đá nhau, và cái đúng nhu cầu T2 thì không cửa nào sinh ra được (G-M5-09). Cột **ảnh**: 0/67 trang |
| Hồ sơ trình khách | 🟡 | `mock-trinh-bay`, `mock-if-trang-chia-se` — cả hai ĐỎ |

### T3 — từ đề bài của chủ đầu tư, tự chia khu và bố trí

| Bước | Mock | Ghi chú |
|---|---|---|
| **Nhận đề bài** | ❌ | app đang có panel 3 bước nằm lọt trong màn vẽ, không có hợp đồng (G-M5-11) |
| Nạp mặt bằng + báo cáo nạp | ❌ | như T1 (G-M5-01) |
| **Chia khu · bảng diện tích · đối chiếu số người · xếp tầng** | ❌ | grep "zoning/chia khu/xếp tầng" = 0 (G-M5-12) |
| Thả đồ từ Thư viện | 🟡 | `mock-if-thu-vien` ĐỎ nhưng dựng đủ; `Thư viện.dc` ruột trống (§2) |
| **Bảng kiểm sau bố trí** | ❌ | không có chỗ đổ kết quả kiểm (G-M5-13) |

## 4 · Hai phát hiện xuyên suốt, không thuộc task nào

- **Bộ mock trộn hai sản phẩm**: 10/67 trang là màn của app song song — trong đó **3 trang mang
  tiền tố của app này nhưng tiêu đề lại là app kia**. Chưa có quy ước tách (G-M5-15).
- **Chiều lệch đang ĐỔI DẤU.** Luật cũ giả định *mock đi trước, code chạy theo*. Đo 06/08 thì có
  ít nhất 5 màn ngược lại: Inspector chặng vẽ, bảng khối lượng, kho vật liệu, cửa nhập bảng tính,
  bảng màu sơn — **code đã ship, mock hoặc lạc hậu hoặc chưa từng tồn tại**. Cứ port máy móc
  "theo mock" là kéo sản phẩm lùi lại. Đây là lý do phiếu port có luật §0.2.

## 5 · Chưa làm — nói rõ, không giấu

- **Mới mở 4/67 trang bằng trình duyệt thật.** 63 trang còn lại đọc ở mức mã nguồn + cửa kiểm.
- **Chưa đối chiếu pixel mock ↔ app một màn nào.** Mọi câu "mock lệch code" ở trên đều dựa trên
  **cấu trúc đọc được** (số cột bảng, số trang Inspector, tên trường), không phải so ảnh.
- **Chưa mở app thật** trong vòng này (3 dev server của phiên khác đang chạy, không đụng).
- Không sửa mock, không sửa `scripts/check-mocks.mjs` dù §2 chỉ ra nó đang để lọt — vòng này
  chỉ chẩn đoán, và sửa cửa kiểm là việc đã ghi thành mục 1 của phiếu port.

## 6 · Ba việc tiếp theo (đề xuất, chờ chốt)

1. **Vá cửa kiểm trước khi vá mock** — thêm luật "trang con thiếu / dữ liệu chết" vào
   `check-mocks.mjs`, vì hiện nay bảng "44 ĐỎ / 23 sạch" vẫn chưa nói đúng sự thật (2 trang lọt).
2. **Chốt bản hiệu lực cho màn 2D** (6 trang → 1 trang) rồi mới đụng bất kỳ việc CAD nào.
3. **Vẽ C1 + C2** (nhập bản vẽ có báo cáo · Inspector cấu kiện) — hai màn mở khoá cả T1 lẫn T3,
   và năng lực ở tầng dưới đều đã có sẵn, chỉ thiếu chỗ hiện.

════════════════════════ GAP-IF.md ════════════════════════
# GAP-IF — lỗi IF do TASK lộ ra (backlog sản phẩm, TRUNG TÍNH)

Ngôn ngữ trung tính: mô tả IF THIẾU GÌ, không nêu tên khách/số liệu dự án.
Dữ liệu dự án ở 2407-Test/. Đây chỉ là năng lực IF.

| GAP | Task lộ | IF thiếu gì (trung tính) | Subsystem | Build? | Trạng thái |
|-----|---------|--------------------------|-----------|--------|------------|
| (vòng chẩn đoán 06/08 — các phiên điền vào đây, CHƯA sửa) |
| G-M1-01 | T3 | Nạp DXF chạy trên LUỒNG CHÍNH, **không tiến độ, không huỷ, không worker** — đường DWG đã có đủ ba thứ đó, đường DXF thì chưa. Máy rảnh thì bản thân phép phân tích nhanh (0,2–1,5 s cho file 5–27 MB, DƯỚI ngưỡng 2 s) nên đây KHÔNG phải nút cổ chai thuật toán; nhưng máy bận thì cùng file đó đo được 12–68 s, và cả quãng đó giao diện đứng hình không có cách nào thoát. Bộ nhớ đỉnh 100–515 MB (tới ~20× dung lượng file). | lõi-cad | Có | 🔴 chưa sửa |
| G-M1-02 | T3 | Báo cáo nạp `DxfLoadReport` (7 trường: đọc được/bỏ qua/block/layer/bbox/cảnh báo) ĐÃ CÓ nhưng KHÔNG CÓ NƠI TIÊU THỤ — màn CAD gọi bản mỏng `parseDxf()` rồi vứt báo cáo, chỉ hiện "đã mở N đối tượng". Người dùng không biết mình vừa mất gì. | lõi-cad + vỏ CAD | Có (nối dây) | 🟢 ĐÃ NỐI 06/08 — `CadEditor.tsx:405-463` dùng `parseDxfEx` + panel "Báo cáo nạp bản vẽ"; verify browser thật |
| G-M1-03 | T3 | Bộ đọc ngữ nghĩa mặt bằng (lưới trục · lõi cứng · diện tích khung tên · đối chiếu diện tích) đã viết đủ và chạy đúng trên file thật nhưng có **0 nơi gọi** trong app ⇒ chặng zoning không có đường đi từ bản vẽ vừa nạp. | lõi-cad + vỏ CAD | Có (nối dây) | 🟢 ĐÃ NỐI 06/08 — `CadEditor.tsx:446-456` gọi `planGridAxes/planCoreZones/planAreaCrossCheck`, đo 1 ms |
| G-M1-04 | T3 | Zoom-extents sau khi nạp dùng khung bao TOÀN BỘ entity. Một bản sao cũ để xa trong model space (ca thật: cách gốc ~12 km) làm khung bao phình ~400× ⇒ mở file ra màn hình gần như trống. Hàm lọc cụm vẽ chính đã có nhưng không được gọi. | lõi-cad + vỏ CAD | Có (nối dây) | 🟢 ĐÃ NỐI 06/08 — bay tới `mainClusterBox` qua `cad:goto-box`, còn nút "Xem toàn bộ" (đo: scale lệch 671 lần) |
| G-M1-05 | T3 | Không tính được diện tích sàn TỪ HÌNH HỌC (cả 6/6 file trả `method:'none'`): đường bao sàn vẽ bằng nhiều đoạn thẳng rời, muốn thành đa giác phải dò mặt phẳng khép kín — thuật toán chưa có. ⇒ không nghiệm thu được diện tích của khu vừa chia. | lõi-cad | Có | 🔴 chưa sửa |
| G-M1-06 | T3 | Entity làm phẳng từ block chỉ mang TÊN block, KHÔNG mang id BẢN CHÈN. Ca thật: 1 tên block bị chèn 18 lần, 828 hình phẳng mang cùng một chuỗi ⇒ không chọn / không di chuyển / không đếm được **MỘT** cấu kiện — chỉ chọn được từng đường rời hoặc cả loạt. | lõi-cad | Có | 🟢 ĐÓNG 06/08 — `srcInsertId` (`dxf.ts:555`) + `expandIdsByInsertGroup` + nút "Chọn cả cụm"; phản biện Q1 ĐẠT, không lem sang bản chèn khác |
| G-M1-07 | T3 | Sửa 1 đường rồi xuất DXF lại: hình học giữ nguyên 100% (2984→2984, đủ layer) nhưng **cấu trúc block bị san phẳng** — 0 INSERT trong file ra, nhãn block 2965→0. Người nhận bản vẽ mất khả năng sửa theo block, mọi bản lặp thành hình rời. | lõi-cad | Có | 🟠 ĐÓNG MỘT PHẦN 06/08 — 6/6 file xuất ra có INSERT (trước = 0), nhưng chỉ giữ 3–12% định nghĩa BLOCK, và round-trip LÀM PHẲNG một cấp lồng (93→457 cụm). Chưa mở bằng CAD bên thứ ba |
| G-M1-08 | T3 | Vùng tô (poché tường, 126–161 mảng/file) KHÔNG neo vào cấu kiện — sửa đường tường thì mảng tô đứng nguyên tại chỗ cũ. Đúng nghĩa "sửa 1 chỗ vỡ chỗ khác". | lõi-cad | Có | 🔴 CHƯA ĐÓNG — cơ chế neo poché (`lib/cad/poche.ts`) chạy đúng cho tường IF TỰ VẼ (30/30 test) nhưng **0/126 · 0/161 · 0/147 · 0/139 · 0/137 · 0/138 hatch được neo trên 6 file hồ sơ NHẬP VÀO** (đo lại 06/08): hồ sơ thật để hatch khác layer với đường bao ⇒ điều kiện "trùng điểm + cùng layer" không bao giờ khớp |
| G-M1-09 | T3 | Sau khi nạp, **0/12.274 entity có `elementType`** — toàn bộ mặt bằng là đường rời, app không biết đâu là cột / tường / lõi. Ràng buộc chia khu ("không cắt vách ngang cột") không có gì để bám. Suy ngữ nghĩa từ tên layer chỉ là quy ước từng bộ hồ sơ, chưa có bộ suy + cờ `inferred`. | lõi-cad | Có | 🟢 ĐÓNG 06/08 — `element-infer.ts` nối vào `parseDxfEx` (`dxf.ts:721`), 0 → 8.680–10.957 entity có elementType, có cờ `inferred` + badge "suy đoán" trên UI, khai báo thắng suy đoán |
| G-M1-10 | T3 | `ATTRIB`/`ATTDEF` bị bỏ (14–17 bản ghi/file) — đó là nơi phần mềm CAD cất **giá trị khung tên** (tên bản vẽ, tỉ lệ, số hiệu, ngày, phiên bản) và nhãn trục dạng thuộc tính. Nạp xong không có gì để điền khung tên hồ sơ. | lõi-cad | Có | 🔴 chưa sửa |
| G-M1-11 | T3 | `ELLIPSE` bị bỏ (9/file) trong khi kho kiểu dữ liệu ĐÃ CÓ sẵn entity ellipse thật — chỉ thiếu nhánh đọc. `POINT` bị bỏ 27–300/file, `VIEWPORT` 2/file, và 2 `HATCH`/file dựng lỗi. Tất cả im lặng vì G-M1-02. | lõi-cad | Có | 🔴 chưa sửa |
| G-M1-12 | T3 | 2/6 file không lấy được diện tích ghi trong khung tên: chuỗi nằm trong **định nghĩa block không được chèn** (rác copy-paste của file gốc). IF chưa có đường đọc khung tên độc lập với việc block đó có được chèn hay không, cũng chưa cảnh báo "file có định nghĩa block mồ côi". | lõi-cad | Có | 🔴 chưa sửa |
| G-M3-01 | T2 | Bốc món từ ảnh chỉ làm được **MỘT món/lượt** (tách nền 1 foreground · đo 1 món). Không có bước liệt kê/đếm N món trong một ảnh ⇒ muốn ra bảng N món phải chạy tay N lượt rồi tự gõ lại tên/mã. | vision | Có | 🔴 chưa sửa |
| G-M3-02 | T2 | Luồng node **không có kiểu dữ liệu BẢNG** (chỉ ảnh/chữ/mặt nạ/số/video) ⇒ một danh sách món không tồn tại được như dữ liệu chạy giữa các khối; không khối nào xuất ra bảng món. | vision + luồng node | Có | 🔴 chưa sửa |
| G-M3-03 | T2 | Hai bước cuối của dây chuyền ảnh→bản vẽ (**khớp mẫu block theo tỉ lệ** và **ba hình chiếu**) đã viết xong + có test nhưng **0 nơi gọi** trong app ⇒ từ món đã đo KHÔNG có nút nào ra được block/bản vẽ. Dây chuyền đứt đúng giữa vision và block. | vision + vỏ CAD | Có (nối dây) | 🔴 chưa sửa |
| G-M3-04 | T2 | Hồ sơ FF&E chỉ có mức **1 món = 1 tấm ảnh JPG** (ảnh + số đo). Không có hồ sơ nhiều món kiểu chuẩn ngành (mã · ảnh · finish · vendor · giá · số lượng · ô duyệt trước sản xuất). | trình bày | Có | 🔴 chưa sửa |
| G-M3-05 | T2 | Cửa nhập bảng vào kho chỉ có **9 trường** ⇒ bảng bốc tách mất **vật liệu · màu · độ tin cậy · phòng**. Kho dữ liệu THẬT thì đã có sẵn trường vật liệu/màu/cao — chỉ là cửa nhập không nối tới. | kho vật liệu | Có (nối dây) | 🔴 chưa sửa |
| G-M3-06 | T2 | **Bug ghép cột đo được**: từ khoá đoán cột dùng chữ cái đơn và khớp theo chuỗi con ⇒ cột "Phòng" bị gán vào ô **Cao**, cột Cao thật bị bỏ; cả lô nhập vào mất chiều cao mà không báo gì. Rủi ro y hệt đang treo với chữ cái rộng/sâu. | kho vật liệu | Có | 🔴 chưa sửa |
| G-M3-07 | T2 | Nhập bảng luôn ép loại **'vật liệu'** ⇒ món nội thất rời vào kho thành vật liệu, dù kho có sẵn loại 'nội thất'. Người nhập không được chọn loại. | kho vật liệu | Có | 🔴 chưa sửa |
| G-M3-08 | T2 | Bản ghi sản phẩm **không có trường phòng/vị trí** ⇒ bảng FF&E theo phòng không có chỗ lưu, không thống kê được "phòng này gồm những món nào". | kho vật liệu | Có | 🔴 chưa sửa |
| G-M3-09 | T2 | **BOQ không tính món rời và không hề báo lỗi**: máy tính khối lượng chỉ quét vùng tô (m²). Món rời đã gán mã + đơn giá vẫn không sinh dòng nào, bảng vẫn trông "đủ" ⇒ báo giá thiếu âm thầm. Cũng không có đơn vị đếm cái/bộ, không có cột số lượng. | BOQ | Có | 🔴 chưa sửa |
| G-M3-10 | T2 · T3 | Block thư viện và cụm bàn khi thả vào bản vẽ bị **làm phẳng thành đường rời, mất danh tính** ⇒ bảng thống kê gộp hết vào "Chưa phân loại", không gán được mã sản phẩm, không lên được BOQ. (Ca đo: cụm 8 chỗ = 41 đường rời.) Cùng gốc với G-M1-06. | lõi-cad + thư viện | Có | 🔴 chưa sửa |
| G-M3-11 | T2 | Bảng khối lượng **không có cột ảnh** và file .xlsx xuất ra **không nhúng được ảnh** (bộ ghi file tự dựng, chỉ có chữ) ⇒ không ra được bảng FF&E có hình. | BOQ + trình bày | Có | 🔴 chưa sửa |
| G-M3-12 | T3 | Kho block **văn phòng mỏng: 8 block** (2 bàn · ghế · 2 vách · 3 tủ hồ sơ). Thiếu hẳn: quầy lễ tân · buồng gọi điện · tủ rack máy chủ · máy in/copy · locker · dãy kệ kho · bàn cao pantry · màn hình/bảng viết phòng họp. | thư viện | Có | 🔴 chưa sửa |
| G-M3-13 | T3 | Cụm sinh theo tham số mới có **6 loại, đều là bàn làm việc + bàn họp**. Không có cụm dựng sẵn cho lễ tân · lounge · pantry · phòng họp có thiết bị. | thư viện | Có | 🔴 chưa sửa |
| G-M3-14 | T3 | **Thả món từ Thư viện không rơi xuống bản vẽ** — sự kiện thả có 1 chỗ phát, **0 chỗ nghe**, chỉ hiện thông báo. Riêng kệ cụm bàn chạy được vì gọi thẳng vào bản vẽ. | thư viện + vỏ CAD | Có (nối dây) | 🔴 chưa sửa |
| G-M3-15 | T3 | **Hai cửa thư viện song song**: 54 block .dxf không hiện trong Thư viện, chỉ vào được qua panel nội thất của màn CAD và một trang demo — trái chốt "Thư viện là cửa duy nhất". | thư viện + vỏ CAD | Có | 🔴 chưa sửa |
| G-M3-16 | T3 | Máy tự bố trí theo đề bài **đã có** nhưng bảng công năng ghi văn phòng = **một cái bàn**. Không có đường: số nhân sự → số chỗ → chọn kiểu cụm → rải cụm theo lưới cột; cũng không đặt được các không gian dùng chung. Kiểm diện tích tự động mới có cho bàn họp. | lõi-cad (bố trí) | Có | 🔴 chưa sửa |
| G-M5-01 | T1 · T3 | **Màn đầu tiên của cả hai task không có hợp đồng giao diện**: cụm "nhập bản vẽ có sẵn" (chọn tệp → tiến độ → nút huỷ → báo cáo nạp: đọc được/bỏ qua/cảnh báo) — grep 67 trang mock cho "nhập bản vẽ"/"báo cáo nạp"/"tiến độ nhập" = **0**. Năng lực tiến độ/huỷ đã có ở một đường nạp (G-M1-01) nhưng chưa từng được VẼ, nên port xong vẫn không biết đặt nó ở đâu. | giao diện | Có | 🔴 chưa sửa |
| G-M5-02 | T1 | **Inspector cấu kiện mới có hợp đồng cho TƯỜNG, thiếu CỬA và KHỐI.** 🟠 **Đính chính 06/08 (bản đầu của dòng này SAI, kiểm phản biện bắt được)**: trang mock chế độ cấu kiện ĐÃ vẽ trọn Inspector tường — loại tường · tim tường · dày · cao · nối tường · sửa-loại-ăn-mọi-tường-cùng-loại · cửa nằm trong tường. Cái thiếu thật: **trang CỬA riêng**, **trang KHỐI (đồ rời)**, và **lịch sử sửa của cấu kiện**. Trang CAD shell còn lại chỉ có Inspector "phòng" nên đừng lấy trang đó làm chuẩn. | giao diện | Có | 🟠 thu hẹp |
| G-M5-03 | T1 · T3 | **Sáu trang mock cùng tả MỘT màn (chặng 2D), không trang nào ghi "bản chốt"** — ba bản CAD shell v3/v4/v5 dùng **chung một tiêu đề**, cộng một bản 2D khác và hai bản chế độ. Phiên port không có cách chọn bản đúng ngoài đoán theo ngày sửa file. Bộ mock thiếu hẳn quy ước đánh dấu bản hiệu lực / bản đã thay thế. | giao diện | Có | 🔴 chưa sửa |
| G-M5-04 | T1 | **Cụm xuất in không đọc được thành hợp đồng**: 4 trang (hộp xuất PDF · tờ giấy · bảng nét in · bảng tròn) đều là bản xuất công cụ thiết kế còn nguyên chỗ trống dữ liệu. Mở thật bằng trình duyệt: khổ giấy hiện `{{ }}`, danh sách tờ trống, vùng xem trước rỗng. T1 kết thúc bằng phát hành lại hồ sơ ⇒ bước cuối T1 mất hợp đồng. | giao diện | Có | 🔴 chưa sửa |
| G-M5-05 | (chung) | **10/67 trang là bản xuất công cụ thiết kế, chạy không nổi ngoài công cụ đó**: cần một tệp kịch bản kèm theo **không có trong repo**, và còn 2–58 chỗ chữ mẫu chưa thay mỗi trang. Nặng nhất: trang "Thư viện" trỏ tới **4 trang con không tồn tại** ⇒ mở ra kệ trống trơn. Cửa kiểm hiện bắt được "trỏ tệp cục bộ"/"còn chữ mẫu" nhưng **không có luật bắt trang con thiếu**, nên bộ này vẫn đếm là "đã có mock". | giao diện | Có | 🔴 chưa sửa |
| G-M5-06 | T1 | **Không màn nào, không mock nào cho PHIÊN BẢN hồ sơ**: so trước–sau bản vẽ, đánh dấu chỗ vừa sửa, đóng dấu bản phát hành. T1 nguyên văn là "sửa lại" một thành phần của hồ sơ **đã giao** — thiếu bước này thì bản sửa không giao lại được cho ai. | giao diện + hồ sơ | Có | 🔴 chưa sửa |
| G-M5-07 | T2 | **Cửa sổ công cụ bốc tách/đo món không có mock.** Trang tool-window duy nhất tả việc KHÁC (phác thảo → ảnh thật). Trong khi đó bước bốc tách là trục chính của T2 và đã có hàm chạy được ở tầng dưới (G-M3-01). | giao diện | Có | 🔴 chưa sửa |
| G-M5-08 | T2 | **Không trang nào có BẢNG N MÓN** (kết quả bốc tách nhiều món) hay hồ sơ nhiều món kiểu chuẩn ngành (mã · ảnh · hoàn thiện · nhà cung cấp · số lượng · ô duyệt). Giao diện chưa từng vẽ ra thứ mà G-M3-01/02/04 nói là thiếu ⇒ hai tầng cùng trống, không tầng nào kéo tầng nào lên. | giao diện | Có | 🔴 chưa sửa |
| G-M5-09 | T2 | 🟠 **Đính chính 06/08 — bản đầu đếm SAI và kết luận NGƯỢC.** Đếm lại: mock bảng khối lượng có **10 ô tiêu đề** (không phải 7 — phép đếm cũ dùng biểu thức chỉ bắt ô toàn chữ nên bỏ sót ô "Thành tiền ƒx" và ô thêm-cột), và mock **đi TRƯỚC code ở 3 điểm**: người dùng tự thêm cột (6 kiểu, có trần), popover công thức ƒx, và truy vết sửa-tay ↔ số-máy. Grep trong `components/present-editor/boq/` + `lib/boq/` = 0 chỗ làm 3 việc đó (4 dòng khớp chỉ là công thức ghi vào tệp bảng tính khi xuất). ⇒ **"sửa mock theo code" là xoá đặc tả** — hướng đúng là code đuổi theo mock. Cái thiếu THẬT của mock: **cột số lượng đếm (cái/bộ)** — trang hồ sơ trình khách đã vẽ bảng món có cột SL + đơn vị "cái/tấm", trang bảng khối lượng thì không, và máy tính khối lượng cũng chỉ quét m² (G-M3-09). | giao diện + BOQ | Có | 🟠 thu hẹp |
| G-M5-10 | T2 | **Ba màn đã CODE mà chưa bao giờ có mock** — kho vật liệu, cửa nhập bảng tính (ghép cột/xem trước/báo dòng hỏng), bảng màu sơn. Grep 67 trang cho "kho vật liệu"/"nhập bảng"/"ghép cột"/"màu sơn" = **0**. Ngược luật "mock là hợp đồng": màn ship trước, hợp đồng không tồn tại ⇒ không có gì để nghiệm thu, và phiên sau dễ vẽ lại từ đầu. | giao diện | Có | 🔴 chưa sửa |
| G-M5-11 | T3 | **Màn nhận ĐỀ BÀI không có mock** (app đang có một panel 3 bước nằm lọt trong màn vẽ). Bước MỞ ĐẦU của T3 không có hợp đồng ⇒ mọi thứ phía sau (chia khu, bố trí) không biết bám vào dữ liệu nào trên giao diện. | giao diện | Có | 🔴 chưa sửa |
| G-M5-12 | T3 | **Không mock, không màn cho ZONING theo chương trình**: chia khu từ đề bài · bảng diện tích từng khu · đối chiếu số người ↔ diện tích · bảng xếp bộ phận theo tầng. Grep "zoning"/"chia khu"/"xếp tầng" trên 67 trang = **0**. (Panel "zone" đang có là zone MÀU để trình bày — việc khác.) Đây là khoảng trống lớn nhất của T3 ở tầng giao diện. | giao diện + lõi-cad | Có | 🔴 chưa sửa |
| G-M5-13 | T3 | 🟠 **Đính chính 06/08 — bản đầu của dòng này SAI.** Panel kiểm chuẩn **ĐÃ CÓ và chạy** trong màn vẽ (mở bằng nút, có cả gợi ý sửa), tựa trên một bộ luật khá dày (thoát hiểm · mật độ người · phòng cháy · chiếu sáng · tiếp cận · nhà ở · Neufert · ISO bản vẽ). Cái thiếu thật, hẹp hơn nhiều: **(a) không trang mock nào tả panel này** ⇒ không có hợp đồng để nghiệm thu; **(b) luồng bố trí của T3 không tự đẩy kết quả sang panel đó** — bố trí xong vẫn phải nhớ mở tay, và chưa đo được bộ luật hiện có phủ tới đâu cho ca văn phòng (lối đi giữa cụm bàn · diện tích trên đầu người). | giao diện | Có | 🟠 thu hẹp |
| G-M5-14 | (chung) | **44/67 trang ĐỎ ở cửa kiểm mock**, trong đó **19 trang chỉ dựng MỘT theme** — đúng nguyên nhân đã ghi của lỗi màn tối. Mọi trang đỏ là hàng chặn: port một trang chỉ-sáng là đẻ lại lỗi cũ. | giao diện | Có | 🔴 chưa sửa |
| G-M5-16 | (chung) | **Cửa kiểm mock cho qua 5 kiểu hỏng đo được tận mắt** (vòng phản biện 06/08): ① **khoá theme sai từ vựng** — 6 trang dùng nhánh sáng gắn vào một tên theme mà app KHÔNG bao giờ phát ra (app chỉ có auto/sáng/tối, grep tên đó trong `lib`+`components`+`app` = 0) ⇒ đặt theme sáng lên trang đó nền vẫn tối, mà luật ④ vẫn xanh vì chỉ tìm chuỗi `data-theme`; ② **chữ mẫu không viết bằng `{{}}`** — một trang có 62 chỗ chữ "PLACEHOLDER" lộ thẳng ra giao diện, hai trang khác 28 và 21 chỗ, cửa kiểm xanh hết; ③ **ruột là TÊN COMPONENT thay vì hình** — một trang in chuỗi khai báo component và nhãn "tóc 2…tóc 8" ra màn, trái luật thumbnail-vẽ-thật đã chốt; ④ **phụ thuộc mạng vẫn tính là tự đủ** — 8 trang nạp thư viện icon/phông từ Internet (một trang ghim `@latest` ⇒ hợp đồng trôi theo phiên bản, mất mạng là mất 44 icon hoặc rơi phông chữ Việt); ⑤ **trùng màn không ai bắt** — 3 trang CAD shell mang **cùng một tiêu đề**. | giao diện | Có | 🔴 chưa sửa |
| G-M5-17 | (chung) | **Hợp đồng giao diện nằm NGOÀI vùng cửa kiểm**: cửa chỉ quét `docs/mocks/*.html` không đệ quy ⇒ bỏ sót ít nhất 4 tài sản ĐANG được git theo dõi và ĐANG được tài liệu gọi là nguồn thiết kế — bản gieo hệ thiết kế (`docs/IF-design-system-seed.html`, 12 KB, sổ chốt gọi thẳng là "nguồn sự thật cho công cụ dựng mock") · 2 trang đề xuất giao diện nằm ở GỐC repo (54 KB + 62 KB) · hệ thiết kế bản PDF 812 KB (cửa lọc `.html` nên vô hình). Thêm vào đó, thư mục vừa tách ra cũng lập tức ra khỏi tầm quét. ⇒ con số "N trang sạch" không bao giờ nói đúng sức khoẻ của bộ hợp đồng. | giao diện | Có | 🔴 chưa sửa |
| G-M5-15 | (chung) | **10/67 trang trong bộ mock của app này thực ra là màn của app song song** (4 trang cùng họ tiền tố + 6 trang tự khai trong tiêu đề). Ba trang trong số đó mang tiền tố của app này nhưng tiêu đề lại là app kia ⇒ phiên port rất dễ port nhầm màn của sản phẩm khác vào sản phẩm này. Bộ mock chưa có quy ước tách hai sản phẩm. | giao diện | Có | 🔴 chưa sửa |
| G-M1-13 | T3 · vòng SỬA | **Xuất DXF đổi tên lớp và GỘP MẤT lớp**: bộ làm sạch tên thay khoảng trắng bằng gạch dưới ⇒ hai lớp tên `A B` và `A_B` xuất ra chỉ còn MỘT (tái hiện được: 2 lớp → 1, entity vẫn 2, không cảnh báo). Hồ sơ thật có lớp 7.151 hình bị đổi tên. | lõi-cad | Có | 🔴 mới, do vòng kiểm phản biện phát hiện |
| G-M1-14 | T3 · vòng SỬA | **Vùng tô poché của IF không sống sót vòng xuất DXF** — xuất ra rồi nạp lại thì hatch quay về đường nhiều đoạn, mất luôn liên kết neo vừa dựng ⇒ tường lại rách sau một vòng xuất/nhập. | lõi-cad | Có | 🔴 mới |
| G-M1-15 | T3 · vòng SỬA | **Byte điều khiển thô trong mã nguồn làm cả tệp tàng hình trước công cụ tìm kiếm mặc định** — tệp bị xếp loại nhị phân, lệnh tìm kiếm trả rỗng GIẢ (exit 1) thay vì báo lỗi; `-a`/`--text` mới thấy. Hệ quả: luật "tìm trước khi thêm" cho kết quả sai ở tệp đó — vòng này báo sai 2 lần vì nó. Quét toàn repo: **chỉ 1 tệp dính** (đã được gỡ lúc 15:54, tệp nay là văn bản thuần). Còn lại là **bẫy công cụ vẫn treo**: cần luật cấm gõ byte điều khiển thô + 1 lệnh quét trong CI. | lõi-cad · vệ sinh mã | Có | 🟠 tệp đã sạch, bẫy công cụ CHƯA có rào |
| G-M1-16 | T3 · vòng SỬA | **Phỏng đoán của máy bị ghi vào file giao cho bên thứ ba**: bản xuất DXF mang cả cờ suy đoán loại cấu kiện. Nạp lại trong IF thì vẫn là suy đoán (đúng), nhưng người nhận ngoài IF không phân biệt được đâu là khai báo của người, đâu là máy đoán. | lõi-cad | Cần Hoà chốt | 🟡 mới, chờ quyết |
| G-M1-17 | T3 · vòng SỬA | **Chọn cả cụm ở cấp ngoài cùng = chọn gần cả bản vẽ** (đo: cụm ngoài cùng ôm 2.963/2.984 hình). Đường chọn theo cấp ngoài cùng hiện chưa nối vào giao diện — nối thẳng vào là ra thao tác vô dụng. | lõi-cad + vỏ CAD | Có | 🟡 mới |
| G-M2-01 | T1 | **Một bức tường không phải MỘT vật**: vùng tô (poché) và đường bao là hai hình rời không liên kết. Bấm chọn chỉ trúng một nửa; dời đi thì tường **rách làm đôi** (đo: nửa tô sang chỗ mới, nửa bao đứng lại, lệch 450 mm) — không cảnh báo, không nhóm lại được. | lõi-cad | Có | 🔴 chưa sửa |
| G-M2-02 | T1 | **2D và 3D đọc hai nửa khác nhau của cùng bức tường** ⇒ sau khi sửa, cùng một bức tường đứng ở **hai vị trí khác nhau** tuỳ chặng đang mở (3D chỉ dựng từ vùng tô). Không màn nào báo hai bản đang lệch. | lõi-cad + 3D | Có | 🔴 chưa sửa |
| G-M2-03 | T1 | **Diện tích ghi trên bản vẽ là chữ chết**: đổi hình phòng thì nhãn "… m²" vẫn y nguyên, trong khi thanh trạng thái tính lại số khác (đo cùng một màn: nhãn giữ nguyên, tổng chạy 59,9 → 58,5 → 51,2 m²). Hai con số mâu thuẫn hiển thị cạnh nhau, không ai bắt lỗi. | lõi-cad | Có | 🔴 chưa sửa |
| G-M2-04 | T1 | **Không có đối tượng PHÒNG**: nhãn phòng chỉ là chữ, biên phòng dò lại mỗi lần vẽ ⇒ diện tích đổi theo sửa đổi hình học lân cận; phòng dò không ra biên thì **im lặng rơi khỏi tổng** thay vì báo "không đo được". Không có chỗ treo trần/sàn/phào của phòng. | lõi-cad | Có | 🔴 chưa sửa (đúng §0.5 SPEC-TANG-DU-LIEU-CAU-KIEN) |
| G-M2-05 | T1 | **Chặng 3D không có Hoàn tác**: ⌘Z ở chặng 3D không làm gì và không báo gì (đo 2 lần, dữ liệu không đổi). Lịch sử thao tác sống riêng trong từng màn (5 ngăn rời) ⇒ sửa ở chặng này, lùi ở chặng kia là không thể. | hạ tầng | Có | 🔴 chưa sửa |
| G-M2-06 | T1 | **Lệnh sửa hình không có bản xem trước**: dời/xoay/lấy đối xứng chỉ hiện dây thun + số đo, **không hiện bóng vật sắp dời** ⇒ chỉ thấy kết quả sau khi đã chốt. (Bóng theo con trỏ mới có ở bước đặt khối mới.) | vỏ CAD | Có | 🔴 chưa sửa |
| G-M2-07 | T1 | **Hình dẫn xuất tự chảy vào bản vẽ và bị đếm như hình người vẽ**: sửa 1 tường ⇒ bản vẽ tự sinh thêm hình khoét cửa/cửa sổ, bộ đếm "tường chưa phân loại" nhảy sau một thao tác không liên quan (đo 29 → 38). Ngược lại, dời tường làm **mất im lặng** khối khoét của cửa mất tường chủ (đo 128 → 126 hình). | lõi-cad | Có | 🔴 chưa sửa |
| G-M2-08 | T1 | **Số khai ≠ hình vẽ, không ai đối chiếu**: khai "dày 220 mm" trong khi vùng tô vẽ 100 mm — cả hai cùng tồn tại, không cảnh báo lệch, không rõ hồ sơ/BOQ lấy số nào. Ô khai độ dày cũng chỉ ghi khi rời ô (gõ xong chưa đủ). | lõi-cad | Có | 🔴 chưa sửa |
| G-M2-09 | T1 | **Phiên đăng nhập hết hạn giữa lúc sửa = mất sạch Hoàn tác/Làm lại** và bản vẽ biến mất khỏi màn hình (khung nhìn hỏng), chỉ báo bằng một băng chữ nhỏ ⇒ người dùng tin là mất bài. Bản vẽ thực tế còn, nhưng lịch sử thao tác thì mất thật. | hạ tầng | Có | 🔴 chưa sửa |
| G-M2-10 | T1 | **Nghi mất bước Hoàn tác**: quan sát 1 lần — sau một thao tác gán thuộc tính, ngăn Hoàn tác tụt 1 bước và bấm lùi nhiều lần vẫn không đưa tường về chỗ cũ. **CHƯA tái hiện được** ở lần thử lại ⇒ ghi để điều tra, không kết luận. | hạ tầng | ? | 🟡 nghi vấn, chờ tái hiện |
| G-M4-01 | vo-app | **KHÔNG PHẢI LỖI SẢN PHẨM — đã điều tra xong, ghi lại để phiên sau khỏi log lại.** Triệu chứng ban đầu: một route CÓ trang thật, biên dịch sạch, vẫn trả 404 (`/login` 3 lần liên tiếp, kể cả sau khi ép biên dịch lại; server khác thì `/` và `/cad-editor` cũng vậy). Nhưng lần đo sau `/login` trả **200**. Nhật ký máy chủ phát triển lộ đúng cơ chế: `✓ Compiled /login → ✓ Compiled /_not-found → GET /login 404`, rồi gọi lại là 200 — **lần gọi đầu ngay sau khi một route vừa biên dịch đôi lúc rơi vào nhánh không-tìm-thấy**. Đây là tật của máy chủ phát triển (Next 14.2), KHÔNG có trong bản dựng phát hành. ⚠️ Hệ quả THẬT cần nhớ: **404 trên máy chủ phát triển chạy lâu không phải bằng chứng lỗi** — phải đo lại trên tiến trình mới rồi mới kết luận. Một máy chủ chạy >1 ngày trong phiên này 404 cả `/` lẫn `/login` trong khi trang khác vẫn 200. | (không) | Không | ⚪ đã rút, không phải GAP |
| G-M4-02 | vo-app | **Công tắc chế độ màn vẽ 2D lộ KHOÁ KỸ THUẬT ra mặt người dùng**: ba nút hiện đúng chữ `Sketch` · `Pro` · `Revit` (khoá nội bộ, lại còn mượn tên một phần mềm của hãng khác), trong khi bộ tên chính thức đã chốt (`Sơ phác` · `Kỹ thuật` · `Nội thất`) bị đẩy vào **tooltip** — ngược đúng chiều. Trái luật ngôn ngữ chỉ dẫn ("cấm jargon nội bộ lộ UI") và trái chốt tên 03/08; cũng ngược cách đã làm cho tên khối 05/08 (nhãn Việt trên mặt, tên Anh trong tooltip). Đọc DOM xác nhận, không suy từ ảnh. Điểm sửa gọn: 3 nhãn trong `ModeSwitch`. | vỏ CAD | Có | ✅ **ĐÃ SỬA 06/08** — nút hiện tên chính thức, EN qua `useT` ra `Sketch·Technical·Interior`; khoá kỹ thuật giữ nguyên trong `onChange`. Verify trình duyệt thật: 0 chuỗi khoá lọt ra UI. Chưa commit (V6). |

=== HET === 16:02
