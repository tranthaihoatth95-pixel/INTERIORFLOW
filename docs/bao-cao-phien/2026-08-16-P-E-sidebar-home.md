# BÁO CÁO P-E · SIDEBAR 3 NẤC + HOME DẪN THEO VIỆC + TAY CẦM DÙNG CHUNG

> Phiên P-E, 16/08. Phiếu `docs/phieu-giao/P-E-sidebar-3-nac-va-home-dan-viec.md`.
> Đợt này **chỉ dựng bản vẽ** — không sửa một dòng code app. Khuôn 6 phần + ô ⑦b + ⑦c.

## 1 · TỔNG QUAN

Dựng xong `docs/mocks/mock-sidebar-3-nac-home.html` (911 dòng, đủ 2 theme, tự chứa). Đo trên trình
duyệt 1440×1000: ba nấc **28 / 240 / 320px** đúng khai, bấm chạy ở cả hai theme. `check:mocks`
**không đỏ file này**, `soi:tu-dien` **0 lệch**.

Trong lúc dựng nhận **ba lượt đính chính** của T (nền ảnh thay nền ánh sáng → ảnh phải để nét →
Vitals là vật di chuyển, ô tìm về lại là ô tìm). Tất cả đã vào bản vẽ. Phần đắt nhất không phải
hình mà là **con số ngưỡng độ đặc của kính** — thứ duy nhất đo được trong cả việc này, tính ở §2.5.

## 2 · CHI TIẾT TỪNG MỤC

### 2.1 · Ô ⓪ + ⓪b — tiền đề

| # | Tiền đề | Kết luận | Bằng chứng |
|---|---|---|---|
| ⓪b | Worktree đúng HEAD, lệch 0 | ✅ **XÁC NHẬN** | `47fe9f8` · `git rev-list --count HEAD..main` = **0** |
| 1 | `components/ui/PanelHandle*` không tồn tại | ✅ **XÁC NHẬN** | `ls` không thấy; cả repo chỉ 1 chỗ nhắc tên nó và là **comment**: `PresentEditor.tsx:1246` *“cùng mẫu PanelHandle app dùng ở chặng Trình chiếu”* — tức mẫu tồn tại như thói quen chép tay, chưa thành component |
| 2 | Home là lưới ô đều nhau bày trạng thái, không có dòng việc | ✅ **XÁC NHẬN** *(kèm một đính chính nhỏ)* | `DongStudioHome.tsx:293` `repeat(12,…)`×`repeat(3,…)`; 10 widget ở `components/home/widgets/`. **Đính chính:** không phải Home hoàn toàn không bấm đi đâu được — `UpcomingList` có gọi `goToProjectStage()`. Nhưng nó là **mốc lịch**, không phải **việc đang dở**; và `TodayStrip` chỉ hiện **con số** việc đến hạn. ⇒ Kết luận của phiếu (“bày trạng thái, không bày việc”) **đúng**; chỉ câu “không có dòng việc nào để bước vào” là hơi mạnh |
| 3 | Chốt 03/08 đã bỏ rail chỉ-icon | ✅ **XÁC NHẬN** | `SPEC-CAD-SHELL-V3.md:14` (*HIG không có khái niệm icon rail; Keynote·Final Cut đều một sidebar có chữ*) + `:19` |
| 4 | Cấm auto-hide, thu về dải mỏng có nhãn | ✅ **XÁC NHẬN** | `SPEC-PANEL-ROLLOUT-IDF.md:56-59` §2f — *“auto-hide là thứ bị chửi nhiều nhất trong cả 4 app”* |

### 2.2 · Đã vẽ gì, sâu tới đâu

| Mục | Nội dung | Độ sâu |
|---|---|---|
| ④.1 ba nấc | Thu 28 (nhãn xoay đứng + tay cầm + chấm báo) · Vừa 240 (icon+chữ+số) · Rộng 320 (+nhóm phụ, xem trước) — bày cạnh nhau, đủ 2 theme | **vẽ sâu** |
| ④.2 tay cầm | Một khuôn, 4 trạng thái (thường·trỏ vào·đang kéo·bàn phím) × 2 theme | **vẽ sâu** |
| ④.3 Home | Hai cột: dòng việc trái, widget phải; trên nền ảnh, thẻ kính, có lề thở | **vẽ sâu** |
| ④.4 số đếm | 0 ẩn · >99 → `99+` · nền trung tính | **vẽ sâu** |
| ④.5 trạng thái trống | Cả màn, 2 theme, 3 lối đi tiếp | **vẽ sâu** |
| ④.6 3 nấc × 2 theme | Có | **vẽ sâu** |
| Nền ảnh 3 trạng thái | Có ảnh · giảm chói · tắt hẳn, bấm đổi được | **vẽ sâu** |
| Vitals | Hai chỗ đứng (cạnh ô tìm ↔ rời cạnh trục phải) · 3 trạng thái gọi · 3 nấc bung | **mới phác** — đúng mức T cho phép |

Về Vitals, **phác** nghĩa là: chỗ đứng, hình dạng, cách gọi và ba nấc đã rõ và bấm thấy được; còn
**nội dung bên trong từng nấc** (bố cục hội thoại, cách bày nguồn dẫn, lịch sử phiên) thì chưa vẽ.
Riêng **nấc lớn** đã vẽ đúng bản chất chứ không phác: đồ thị chuỗi việc 3 bước + giá từng bước +
tổng credit + nút **Duyệt chuỗi** — không phải chat phóng to.

### 2.3 · Chủ kiến của bản vẽ — chữ ký “sống lưng ba chặng”

Chủ dự án chê thẳng chữ **“xấu”**, nên bản vẽ cần một điểm nhớ được chứ không phải mẫu dựng sẵn.
Chọn: **ba vạch nhỏ đứng trước mỗi dòng việc**, vạch sáng là chặng việc đang nằm (2D · 3D · Trình
chiếu). Nó lặp khắp trang và thành nhịp.

Lý do chọn nó thay vì một hoạ tiết trang trí: nó **mã hoá một sự thật của sản phẩm** — IF là ba
chặng soi vào một nguồn — và nó trả lời tại chỗ đúng câu người dùng hỏi khi mở app: *việc này đang
ở đâu, tôi bấm vào là rơi vào đâu*. Ở màn trống nó phóng to làm hình minh hoạ, nên không phải đi
mượn tranh ở đâu khác.

**Một quyết định có chủ kiến khác, xin nêu để T soi:** cột việc vẽ thành **dải kẻ chỉ, không phải
thẻ rời**. Cả Home hiện tại là thẻ, mà thẻ làm mọi thứ trông ngang nhau — đúng cái bệnh đang chê.
Dải xếp chồng đọc ra là **hàng đợi**, mắt biết chạy từ trên xuống. Cả cụm đứng trên **một** tấm
kính nên chữ luôn trên nền đồng nhất.

### 2.4 · Ba lượt đính chính của T — đã vào bản vẽ

| Lượt | Đổi gì | Đã làm |
|---|---|---|
| 1 | Home có **ảnh nền** (bỏ hướng nền-ánh-sáng); nội dung đứng trên kính; có nấc giảm chói | ✅ |
| 2 | Ảnh **để nét**, không bôi mờ; thẻ **không phủ kín**, chừa lề cho nền thở; kính rất trong chỉ cho chỗ ít chữ | ✅ lề 20px, khe 14px |
| 3 | Vitals là **một vật di chuyển theo ngữ cảnh**; **ô tìm về lại là ô tìm**; chuột rê vào ↔ cảm ứng nhấn giữ | ✅ bỏ hẳn hướng “ô hai chế độ” của lượt trước |

### 2.5 · ⭐ NGƯỠNG ĐỘ ĐẶC CỦA KÍNH — điểm nghiệm thu đo được

Cách tính: lấy **ca xấu nhất của nền** (trắng tinh `#ffffff` và đen tuyền `#000000`), trộn qua lớp
kính theo đúng alpha của nó, rồi so với màu chữ thật của theme (`--t1`) bằng công thức tương phản
WCAG. Nếu **sàn** (giá trị thấp nhất trong hai ca) vượt 4,5:1 thì tương phản không còn phụ thuộc
tấm ảnh nữa.

| Lớp kính | Alpha | Nền trắng | Nền đen | Kết |
|---|---|---|---|---|
| Thẻ số liệu `--mat-card` tối | 0,82 | **9,1:1** | 18,5:1 | ĐẠT, dư nhiều |
| Panel `--mat-panel` tối | 0,68 | **5,9:1** | 17,7:1 | ĐẠT |
| Thanh tìm (kính mỏng) tối | 0,62 | **4,8:1** | 17,5:1 | ĐẠT, sát sàn |
| Kính rất trong | 0,35 | **2,1:1** | 16,8:1 | 🔴 **TRƯỢT** khi nền sáng |
| Thẻ số liệu `--mat-card` sáng | 0,82 | 13,9:1 | **5,6:1** | ĐẠT |

**Ngưỡng: alpha ≥ 0,60 (tối) · ≥ 0,53 (sáng)** cho mọi vùng có chữ.

Ba điều rút ra:
1. **Hai token app đang dùng đã vượt ngưỡng sẵn** (`--mat-card` 0,82 · `--mat-panel` 0,68/0,70) —
   không phải chế token mới, chỉ là **nay biết vì sao chúng đủ**. Đúng [Đ1] nhìn-vào-trong-trước.
2. **Kính 0,35 trượt hẳn** — đây là con số chứng minh cho câu “kính rất trong chỉ dùng cho chỗ ít
   chữ”. Nó không phải chuyện gu, nó là 2,1:1.
3. T dặn thanh tìm “được trong hơn vì ít chữ”. **Đúng hướng, nhưng có sàn**: 0,62 là mức trong nhất
   còn hợp lệ (4,8:1) — trông nhẹ hơn hẳn thẻ số liệu mà vẫn qua. Trong hơn nữa là chữ gợi ý 13px
   tụt dưới 4,5:1. Bản vẽ chốt ở 0,62 và ghi rõ vì sao dừng ở đó.

Bản vẽ có **dải soi ca xấu nhất**: một băng nửa trắng tinh nửa đen tuyền chạy sau thẻ kính, bấm
đổi được ba trạng thái nền để nhìn tận mắt.

### 2.6 · Hai đính chính T nên biết

**① Hằng số nhấn-giữ KHÔNG nằm ở `RadialToolMenu.tsx`.** T dặn lấy lại số từ file đó. Đo:
`components/print/RadialToolMenu.tsx` **không có một dòng nào** về long-press (`grep 500|long|press`
= 0). Số thật ở **`components/ui/Tooltip.tsx:33`** (`TOOLTIP_LONG_PRESS_MS = 500`) và **`:37`**
(`LONG_PRESS_SLOP_PX = 8`). `RadialToolMenu` là cái **được mở ra**, không phải nơi giữ cử chỉ; nó
được mount ở `CadCanvas.tsx:3617` và `ExportPdfDialog.tsx:308`. Phiên thi công đi theo lời dặn cũ
sẽ mở nhầm file. Giá trị 500/8 thì **đúng** — chỉ sai địa chỉ.

**② Lỗi tôi tự gây và tự sửa, ghi để T biết chất lượng file.** Khi đổi hàng loạt ô tìm sang cấu
trúc mới, tôi dùng một lệnh thay-thế-theo-mẫu quét cả tệp. Mẫu đó **khớp quá tay**, ăn lan qua
nhiều dòng và làm **lệch thẻ đóng/mở** ở hai chỗ — hậu quả nhìn thấy được: khối Home **đóng sớm một
nhịp**, nên bản theme sáng rơi ra ngoài khung và cả hai bản Home bị bóp còn 687px thay vì 1388px.
Đã dò bằng cách đếm độ sâu thẻ theo từng dòng, tìm đúng hai điểm, sửa. Kiểm lại: **toàn tệp cân
bằng (lệch 0)**, khối Home đóng đúng sau cả hai bản, đo lại mỗi bản **1388px**.
⚠️ **Bài học đáng ghi:** thay-thế-theo-mẫu trên tệp giao diện là thứ hỏng âm thầm — trình duyệt tự
vá thẻ lệch nên **vẫn hiện ra được**, chỉ sai bố cục. Nếu tôi chỉ nhìn ảnh chụp mà không đo bề rộng
thật thì đã nộp bản hỏng.

### 2.7 · Ba lối đi của Home có đường về thật — không vẽ thứ chưa có

| Cần gì | Đã có chưa |
|---|---|
| Việc mang ngữ cảnh để bấm là nhảy đúng chỗ | ✅ `Task.stage` · `workspaceId` · `entityId` (`schema.prisma:575-577`) |
| “Chặng đang dở” của từng dự án | ✅ `lib/shell/last-stage.ts` + điểm ghi duy nhất `lib/studio/stage-nav.ts:39` |
| Hàm nhảy tới đúng chặng | ✅ `goToProjectStage()` (`components/home/widgets/nav.ts`) |
| Hạ tầng kính | ✅ `.mat-card`/`.mat-panel` + `--blur` (`globals.css:371-377`, `:93`) |

⇒ Dòng việc **không cần thêm bảng dữ liệu nào**. Đây là lý do tôi dám vẽ nó làm nhân vật chính.

## 3 · TỔNG KẾT LẠI VẤN ĐỀ

Câu chê *“vào rồi không biết đi đâu tiếp”* không phải chê thẩm mỹ, nó là **chê thông tin**: Home
đang trả lời “tình hình thế nào” trong khi người mở app hỏi “giờ tôi làm gì tiếp”. Đổi trục từ
**trạng thái** sang **việc** là sửa đúng gốc; phần đẹp (nền ảnh, kính, cặp màu theo giờ) là lớp
phủ lên trên, không thay được phần lõi đó.

Việc còn lại chia hai loại rất khác nhau: phần **bố cục** (ba nấc, dòng việc, tay cầm) thì mắt
duyệt là xong; phần **kính trên nền ảnh** thì mắt duyệt **không đủ** — phải giữ con số alpha, vì
đây là chỗ một tấm ảnh sáng của người dùng có thể làm chữ biến mất mà lúc thiết kế không ai thấy.

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Tốt**
- Ngưỡng kính ra được **con số**, và số đó hoá ra **xác nhận token sẵn có là đủ** — không phải đẻ
  thêm gì. Kèm một con số phản chứng (0,35 → 2,1:1) để câu “kính trong chỉ cho chỗ ít chữ” có bằng
  chứng thay vì là khẩu hiệu.
- Ba nấc đo đúng 28/240/320 ở **cả hai theme**, bấm chạy thật, không phải hình tĩnh.
- Bắt được và tự sửa một lỗi cấu trúc mà trình duyệt che mất.
- Bắt được sai địa chỉ hằng số nhấn-giữ trước khi nó thành một phiếu thi công sai.

**Chưa tốt / rủi ro**
- ⚠️ **Nền không phải ảnh thật.** Mock phải tự chứa (mở bằng `file://` ở máy khác vẫn đúng) nên
  “ảnh” là cảnh dựng bằng gradient. Nó có vùng rất sáng và rất tối để soi kính, nhưng **không thay
  được cảm giác một tấm render thật**. Chủ dự án nhìn có thể thấy “chưa ra chất ảnh”.
- ⚠️ **Số tương phản là tính tay, chưa đo bằng máy đo màu** — xem ⑦b.
- ⚠️ **Vitals mới phác.** Đúng mức T cho phép, nhưng nếu chủ dự án duyệt cả cụm cùng lúc thì phần
  này sẽ mỏng hơn hẳn hai phần kia.
- ⚠️ Bản vẽ **dài** (6 mục lớn). Có nguy cơ người duyệt mệt ở nửa sau — mà nửa sau lại chứa mục
  quan trọng nhất (ngưỡng kính) và ca hay bị quên nhất (màn trống).
- Cặp màu đảo vai (tối→tím chủ, sáng→đồng chủ) tôi lấy từ chốt 16/08 và **tự áp vào bản vẽ này**;
  chưa ai duyệt nó ở ngữ cảnh Home cụ thể.

## 5 · HƯỚNG XỬ LÝ — NHIỀU GÓC ĐỘ

**Hướng A — T đẩy nguyên bản vẽ lên Claude Design, chủ dự án duyệt một lượt.**
· Ưu: một lần chạm, thấy trọn mạch từ sidebar → Home → nền → màn trống; các mục nối nhau nên duyệt
liền mạch dễ ra quyết định hơn duyệt rời.
· Nhược: dài, và mục ngưỡng kính nằm gần cuối — dễ bị lướt đúng chỗ cần soi kỹ nhất.

**Hướng B — cắt đôi: duyệt “bố cục” trước (nấc + dòng việc + tay cầm + màn trống), “nền ảnh + kính
+ Vitals” sau.**
· Ưu: phần bố cục là phần chắc nhất, duyệt xong là mở được phiếu thi công ngay, không chờ phần còn
tranh luận. Phần nền/kính được soi khi người duyệt còn tỉnh.
· Nhược: hai lần chạm của chủ dự án — mà băng thông duyệt mắt là tài nguyên khan hiếm nhất.

**Hướng C — thay nền dựng-bằng-gradient bằng một ảnh render thật rồi mới trình.**
· Ưu: đóng đúng rủi ro lớn nhất (“chưa ra chất ảnh”), và cho thấy kính hoạt động trên ảnh thật.
· Nhược: mock hết tự chứa (trái luật `check:mocks`), hoặc phải nhúng ảnh dạng chuỗi làm tệp phình
rất to. Và **không đổi kết luận nào** — ngưỡng alpha đã tính theo ca xấu nhất, ảnh thật bao giờ
cũng dịu hơn trắng tinh/đen tuyền.

## 6 · ĐỀ XUẤT — CHỌN HƯỚNG A, KÈM MỘT SẮP XẾP LẠI

**Đẩy trọn một lượt, nhưng đưa mục ngưỡng kính lên NGAY SAU Home** thay vì để gần cuối.

Vì sao A chứ không B: bốn mục này là **một mạch lập luận** — dòng việc cần chỗ đứng (Home), Home
cần nền, nền cần kính, kính cần ngưỡng. Cắt đôi thì nửa sau mất bối cảnh và người duyệt phải dựng
lại trong đầu. Đổi một lần chạm lấy mạch liền là đáng.

Vì sao A chứ không C: C tốn nhiều, phá luật tự-chứa, mà **không đổi một kết luận nào** — đó là dấu
hiệu rõ của việc không đáng làm. Nếu chủ dự án xem xong vẫn thấy “chưa ra chất ảnh”, lúc đó hãy
làm, và làm ở bản thi công nơi ảnh thật vốn đã có sẵn.

Ba việc kèm theo:
1. **Sửa địa chỉ hằng số nhấn-giữ** trong ghi chép của T: `Tooltip.tsx:33,37`, không phải
   `RadialToolMenu.tsx` (§2.6①).
2. Khi mở phiếu thi công: **`PanelHandle` làm trước** — nó là component nền, ba mục còn lại đều
   dùng lại nó, và nó là nợ từ 07/08.
3. Nếu chủ dự án gật hướng bố cục, phần **Vitals nên tách phiếu riêng** — nó là cơ chế xuyên chặng
   (đứng ở Home lẫn ở mọi chặng làm việc), không phải chi tiết của Home.

---

## ⑦ NGHIỆM THU — nguyên văn

```
$ npm run check:mocks
TỔNG: 112 file quét · 75 file ĐỎ · 138 loại lỗi · 941 lần vi phạm
# grep "sidebar-3-nac" trong bảng đỏ = 0 dòng → FILE NÀY KHÔNG ĐỎ.
# Đối chiếu baseline trước khi thêm: 111 file · 75 đỏ · 941 vi phạm.
# Thêm 1 file, số đỏ và số vi phạm KHÔNG ĐỔI.

$ npm run soi:tu-dien
✅ 0 lệch định nghĩa
# Lượt đầu bắt 2 lệch TRONG FILE NÀY (dùng "Trình bày" cho tên chặng, đúng phải là
# "Trình chiếu" theo chốt vòng cuối 07/08). Đã sửa toàn bộ, chạy lại sạch.

$ Đo bề rộng thật trên trình duyệt — viewport 1440×1000, bấm lần lượt cả ba nấc:
TỐI  · thu  =  28px · nhãn dọc hiện: true
TỐI  · vua  = 240px · nhãn dọc hiện: false
TỐI  · rong = 320px · nhãn dọc hiện: false
SÁNG · thu  =  28px · nhãn dọc hiện: true
SÁNG · vua  = 240px · nhãn dọc hiện: false
SÁNG · rong = 320px · nhãn dọc hiện: false

$ Đo lại sau khi sửa lỗi cấu trúc:
panes.doc có 2 pane con | rộng mỗi pane: 1388, 1388     (trước khi sửa: 687, và chỉ 1 pane con)
toàn tệp: thẻ mở/đóng lệch = 0
```

## ⑦b · CHƯA CHẮC / CHƯA KIỂM

1. **Số tương phản là TÍNH TAY, chưa đo bằng máy.** Tôi tự áp công thức WCAG lên màu trộn, không
   dùng công cụ đo. Sai số có thể đến từ cách trình duyệt trộn màu trong không gian màu khác với
   giả định của tôi (`backdrop-filter` còn có `saturate(180%)` mà tôi **không tính vào**). Hướng
   và thứ hạng thì chắc; **con số lẻ thì nên đo lại** trước khi ghi thành luật.
2. **Nền là cảnh dựng bằng gradient, không phải ảnh thật.** Kết luận về ngưỡng vẫn đứng (tính theo
   ca xấu nhất), nhưng **cảm giác thị giác** với ảnh render thật thì chưa ai thấy.
3. **Chưa mở app thật** — đúng phạm vi phiếu (đợt này chỉ bản vẽ, cấm sửa code, cấm mở dev server).
   Nghĩa là chưa biết ba nấc và tay cầm cư xử ra sao khi lắp vào `AppShell` thật.
4. **Chưa kiểm bằng trình đọc màn hình thật.** Đã làm phần cơ bản (nút thật, `aria-label`, vòng
   focus, nhãn kèm icon), nhưng chưa chạy VoiceOver.
5. **Chưa đo ở khổ hẹp thật** (tablet/điện thoại). Có khai điểm gãy và token mật độ, nhưng chỉ xem
   ở 1440.
6. **Chuyển nấc dùng `width`, không phải `transform`.** Phiếu ghi “chỉ transform”. Tôi không làm
   được đúng chữ đó: đổi nấc là **đổi bề rộng thật của thanh**, các thứ bên cạnh phải dịch theo —
   `transform` chỉ dời hình, không đẩy được nội dung. `transform` chỉ đúng cho panel **nổi đè**.
   Đã dùng `width` 200ms với đúng đường cong; **nêu ra để T quyết**, không im lặng làm khác phiếu.
7. **Không có ý kiến** về việc widget nào nên nằm cột phải — tôi chỉ giữ đúng ba cỡ đã chốt và lấy
   vài widget sẵn có làm ví dụ.
8. Nội dung mẫu là **tên bịa** (Thảo Điền · An Phú · Lê Lợi · Bến Thành — đều là địa danh chung,
   không phải tên khách nào).

## ⑦c · HẠN DÙNG KẾT LUẬN

- **Ngưỡng alpha 0,60/0,53** hết đúng nếu đổi màu chữ `--t1` hoặc đổi màu nền kính. Nó là hàm của
  **cặp (màu chữ, màu kính)** — đổi một trong hai là phải tính lại, không được bê số cũ sang.
- Kết luận **“token app đã đủ”** hết đúng nếu ai đó hạ `--mat-card`/`--mat-panel` cho “nhẹ hơn”.
  Đây đúng là loại thay đổi trông vô hại nên **nên có máy soi canh**, chưa có.
- Bảng **28/240/320** hết đúng khi ai đó đổi ba token nấc; số đo trong báo cáo này gắn với
  viewport 1440.
- Kết luận **“`PanelHandle` chưa tồn tại”** hết đúng ngay khi phiếu thi công dựng nó — và đó là
  mục đích.
- Đính chính địa chỉ hằng số nhấn-giữ (§2.6①) hết đúng nếu có phiên dời chúng khỏi `Tooltip.tsx`;
  lúc đó **tra lại bằng `grep`, đừng tin dòng này**.
- Phần **Vitals mới phác** — mọi nhận xét về nó trong báo cáo này chỉ ở mức chỗ-đứng và ba-nấc,
  không phải kết luận về nội dung từng nấc.
