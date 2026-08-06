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
