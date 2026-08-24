# DESIGN DNA — trí thông minh thị giác của dự án

> **[N]** = sự thật từ nguồn · **[IF]** = diễn giải. Nguồn ở §8.

## 1 · LÀ GÌ / KHÔNG PHẢI LÀ GÌ

**LÀ** — chuỗi đưa cảm hứng thị giác thành **gu có thể dùng được**, có bằng chứng truy được:

```
khám phá → thu thập → Board → diễn giải thị giác → gu cá nhân
        → DNA dự án → tạo sinh → soi tại chỗ → chấp nhận → sân khấu chuyên nghiệp
```

**KHÔNG PHẢI** — trang Gallery · feed mạng xã hội · một kho ảnh · một bộ lọc. Gallery là **một
chặng** trong chuỗi (khám phá), không phải cả chuỗi. **[N]** `SKILL.md §1`.

> ⛔⛔ **LUẬT NỀN, đã khoá:**
> **Engine cung cấp BẰNG CHỨNG. Giao diện TRUYỀN ĐẠT bằng chứng.
> Giao diện KHÔNG BAO GIỜ được bịa ra trí thông minh mà engine không có.**
> Và chiều ngược lại cũng khoá: Design DNA suy luận về **phòng · vật liệu · ánh sáng · hình
> khối** — nó **không bao giờ** trở thành nguồn quyền cho token chữ/giãn cách/icon/chuyển động
> của IF. Một bộ phân tích tham chiếu giao diện, nếu có, chỉ là **bằng chứng nghiên cứu lúc thiết
> kế**, không bao giờ là máy sinh token sản xuất. **Không có nguồn quyền thiết kế thứ hai.**
> **[N]** `04-DESIGN-DNA-AUDIT.md` §Boundary + §C3 (một đề xuất trước đó đã bị **bác chính thức**
> vì phạm đúng ranh giới này).

## 2 · VIỆC CỦA CON NGƯỜI

| Việc | Chặng của chuỗi |
|---|---|
| Tìm thứ làm mình rung | khám phá (Gallery / Explore) |
| Giữ lại thứ đáng giữ | thu thập → **Board** |
| Hiểu *vì sao* mình thích nó | diễn giải thị giác — máy tách ra thành nét đọc được |
| Biết gu của chính mình | **gu cá nhân** (lớp riêng của người) |
| Chốt gu cho MỘT dự án | **DNA dự án** (lớp riêng của dự án) |
| Bảo máy làm theo gu đó | tạo sinh |
| Kiểm ngay tại chỗ, không rời việc | soi tại chỗ |
| Nhận / bác từng nét | chấp nhận — có ghi ai nhận, từ bằng chứng nào, khi nào |
| Trình cho người khác | sân khấu chuyên nghiệp |

**[IF]** Chuỗi này chỉ có nghĩa nếu **hai lớp gu tách nhau**: gu *cá nhân* của kiến trúc sư và DNA
*của dự án này*. Trộn hai lớp = ghi đè im lặng — thứ luật cấm. Hôm nay chưa có lớp cá nhân nên nó
**chưa thể bị vi phạm, cũng chưa thể được tôn trọng** — nó đơn giản là chưa có nhà. **[N]** audit §7.

## 3 · NHÂN VẬT CHÍNH

**Ảnh.** Ở mọi chặng duyệt, ảnh là nhân vật chính — giữ đúng tỉ lệ khung, không bị cắt cho vừa ô,
không bị vỏ thẻ chiếm chỗ. **[N]** nguyên tắc Pinterest, xem `references/pinterest-arena.md`.

Ở chặng *chấp nhận*, nhân vật chính đổi: **bằng chứng** — nét này đến từ ảnh nào, ai duyệt, lúc nào.

## 4 · ĐƯỢC PHÉP CHỨA / BỊ TỪ CHỐI

### Lấy nguyên tắc từ Pinterest **[N]**
| Lấy | Vì sao lấy |
|---|---|
| Ảnh làm nhân vật chính | quét bằng mắt nhanh hơn quét bằng chữ nhiều lần |
| **Giữ tỉ lệ khung gốc** | cắt vuông là bóp méo thứ đang được đánh giá |
| Nhịp masonry | chiều cao khác nhau tạo nhịp, mắt không mỏi như lưới đều |
| **Lưu nhanh vào bộ sưu tập** | khoảng cách từ *thấy* tới *giữ* phải gần bằng 0 |

### Từ chối hành vi mạng xã hội **[N]** — quan trọng ngang phần lấy
| Từ chối | Vì sao |
|---|---|
| Feed | feed là *của người khác quyết cho bạn xem gì*; đây là kho tuyển của bạn |
| Thích / tim | biến đánh giá nghề thành phiếu bầu |
| Người theo dõi | IF không có khán giả |
| Độ phổ biến / thịnh hành | *phổ biến* không phải *đúng cho dự án này* |
| Tương tác, bình luận công khai | không phải chỗ |
| Vỏ Pinterest (nút chia sẻ, "Thêm nhận xét") | đó là khung của **trang**, không phải thiết kế được tham chiếu |

### Ba cấm của lớp góp ý (áp cho mọi nét DNA máy đề xuất) **[N]** chốt 07/08 §12.3
① **Không chấm điểm.** *"Bố cục 7/10"* vô nghĩa, người dùng sẽ cãi — phải là **câu quan sát cụ
thể**, nói được lý do, sửa được ngay. Luật này đã **đóng cứng vào kiểu dữ liệu**: `DesignDnaCard`
không có trường điểm số nào.
② **Không nói xu hướng** nếu không dẫn nguồn công bố công khai — mọi bảng xu hướng đều có chủ sở hữu.
③ **Không bao giờ chặn.**

## 5 · TRẠNG THÁI

| Trạng thái | Xử lý |
|---|---|
| **Rỗng** — chưa có thẻ DNA nào | có; thẻ là *N thẻ / dự án* (mỗi phương án một thẻ), rỗng là hợp lệ |
| **Ít** — vài lớp có, vài lớp trống | **đây là trạng thái mặc định thật**: 8 lớp khai, chỉ **4 lớp có bộ trích** |
| **Độ tin từng nét** | `measured` · `inferred` · `verified` — đã là mô hình sẵn có, **tái dùng đúng tên** từ hai chỗ khác thay vì đẻ bộ từ vựng thứ tư |
| **Lỗi / đang tải** | **chưa truy được nguồn** — chưa ai đặc tả |

**Tám lớp đã khai** (lấy nguyên văn từ `NC-KTS-SANPHAM-IF-2026-08-11`, cấm tự thêm/bớt):
ý đồ · ảnh có nguồn · ngôn ngữ không gian · màu + tỷ lệ · vật liệu (matId) · ánh sáng · khung hình ·
ràng buộc/độ tin.
🔴 **Chỉ 4 lớp có bộ trích thật** — ý đồ · ảnh có nguồn · ngôn ngữ không gian · vật liệu. Bốn lớp
**màu+tỷ lệ · ánh sáng · khung hình · ràng buộc/độ tin** đã khai nhưng **không có bộ trích**.
⇒ Giao diện phải hiện đúng sự thật đó: lớp không có bộ trích thì **trống, và nói rõ vì sao trống**
— không được vẽ một ô đẹp để ngụ ý máy đã hiểu. Đây chính là chỗ luật §1 dễ bị phạm nhất.

## 6 · CHỐT ĐÃ KÝ

| Ngày | Chốt |
|---|---|
| 10/08 | Design DNA trích **hình thái/motif CÓ NGUỒN**, tách khỏi Material Intelligence |
| 11/08 | Đổi tên "Thẻ gu" → **Thẻ DNA Thiết kế**; **N thẻ / dự án** (mỗi phương án một DNA) |
| 13/08 | Đầu ra của brainstorm/collab (moodboard · storyline) **chính là Thẻ DNA của dự án** |
| — | Lõi chưng cất là **chung, không phụ thuộc ngành**; DNA nội thất là **một adapter** trên nó |
| 23/08 | **Cảm hứng** lên rail cụm 1 — Design DNA có lối vào cấp bản đồ |

## 7 · CA HỎNG THẬT

**① Nền móng đã có, và suýt bị xây lại lần hai.** Lõi chưng cất sống thật, **hai adapter độc lập**
đứng trên nó (nội thất + grounded render). *Hai adapter trên một lõi mới là bằng chứng đáng kể —
tính chung được **chứng minh**, không phải chỉ tuyên bố trong docstring.* ⇒ **Tái dùng. Đừng dựng
engine thứ hai.**

**② F-12 — đo sai rồi suýt khai tử chính cái lõi đó.** Một lượt quét báo *"`lib/distill` có 0 nơi
gọi"* và suýt ghi lõi DNA vào sổ như một hòn đảo chết. Sai: đường import thật là `'../distill/engine'`
— **không có `lib/` trong chuỗi** ⇒ regex theo đường dẫn không bắt được. Đây **đúng là F-03, tái
phát cùng ngày F-03 được viết**. Luật rút ra **không phải** *"cẩn thận hơn"* mà là: **câu hỏi
"cái này còn ai gọi không" phải đi qua máy dò đồ thị import, không bao giờ qua grep tự chế.**

**③ Chín kiểu dữ liệu được khai trong đặc tả, cả chín KHÔNG tồn tại.** `Board` · `BoardItem` ·
`DNAAnalysis` · `DNARevision` · `DNAAcceptance` · `PersonalPreference` · `ProjectDNA` · `DNATrait` ·
`DNAEvidence`. Hệ quả nói chính xác: **không có Board nào** (thứ duy nhất giống "bộ sưu tập" là mã
lọc/tag của Gallery — đó là *duyệt*, không phải *tuyển*) · **không phân biệt được gu cá nhân với DNA
dự án** · **không có bản ghi chấp nhận/chỉnh sửa** — chỗ ghi *ai đã nâng một nét lên, từ bằng chứng
nào, khi nào* thì chưa tồn tại.

**④ Bác một đề xuất của chính mình.** Từng có đề xuất mở rộng engine chưng cất sang "ngữ pháp
UI/UX để gỡ bí bảng token". **Bác** — nó **trái đúng ranh giới ghi trong chính tài liệu đó**, và sẽ
đẻ ra một nguồn quyền thiết kế thứ hai sống trong mã. Bảng token là nợ của Claude Design.

## 8 · ĐÀO SÂU

| Cần gì | Đọc đâu |
|---|---|
| Đo runtime: cái gì đã có, 9 kiểu nào thiếu, 8 lớp / 4 bộ trích, ranh giới, bước kế nhỏ nhất | `docs/design-campaign/04-DESIGN-DNA-AUDIT.md` |
| Lõi chưng cất (chung, không phụ thuộc ngành) | `lib/distill/engine.ts` · `lib/distill/types.ts` |
| Adapter nội thất — 8 lớp + luật cấm chấm điểm đóng vào kiểu | `lib/dna/types.ts` · `lib/dna/distiller.ts` · `lib/dna/store.ts` |
| Mặt tiền đang sống | `components/dna/DesignDnaCardPanel.tsx` · `components/collab/CuaSoThaoLuan.tsx` · `app/api/projects/[id]/dna/route.ts` |
| Gu cá nhân Hoà đọc từ Pinterest (5 mạch, có tần suất) | `docs/nc/NC-GU-BENTRAN-PINTEREST-2026-08-13.md` |
| Nguyên tắc lấy/không-lấy từ Pinterest & Are.na | `.claude/skills/if-design/references/pinterest-arena.md` |
| Chốt Design DNA + Camera Intent 10/08 | `docs/CHOT-DESIGN-DNA-CAMERA-2026-08-10.md` |
| Bản vẽ Gallery / Explore (A duyệt · B bộ sưu tập · C soi ảnh · D rỗng · E Explore) | `docs/mocks/Gallery-Explore.dc.html` — **NOT STARTED** |
| Ledger F-03 · F-12 (đo sai reachability) | `docs/design-campaign/02-FAILURE-LEDGER.md` |

### 🔴 ĐO ĐƯỢC — đọc trước khi hứa bất cứ điều gì với người dùng
- **Gallery là thật và đáng kể** — route thật, dựng **1.634 asset thật** từ kho chung, cùng kho
  `LibraryAsset` với kệ Thư viện, **không đẻ route/cột DB mới**. ⇒ **Đừng xây lại Gallery.**
- **Explore KHÔNG tồn tại** — không có route. Thiếu thật, và là chỗ **thiết kế đi trước**.
- **Board KHÔNG tồn tại.** Bước kế nhỏ nhất mà *không* phải xây lại: dựng danh tính `Board` /
  `BoardItem` **trên danh tính ảnh sẵn có** (một danh tính, nhiều quan hệ) — **không** dựng kho ảnh
  thứ hai.
- **Không có bản ghi chấp nhận** ⇒ câu *"nét này đến từ đâu"* hiện **không trả lời được**. Ba bước
  theo thứ tự phụ thuộc: ① Board trên ảnh sẵn có ② tách gu-cá-nhân ↔ DNA-dự-án **kèm cơ chế nâng
  cấp tường minh** (ai · từ bằng chứng nào · khi nào) ③ bản ghi phân tích nối nét → bằng chứng.
  Mọi thứ khác (Tạo · Soi tại chỗ · Nhận → đưa vào chặng) **phụ thuộc ba cái này**.

### 🔴 MÂU THUẪN / CHƯA GIẢI
- **Danh sách nét mở rộng chưa chốt.** Đặc tả liệt kê thêm ~17 nét (tương phản · chất cảm · ngôn
  ngữ hình · độ cong · nghề thủ công · mộng ghép · ngôn ngữ kim loại & đá · hoa văn · nhịp · đối
  xứng · mật độ trang trí · thời kỳ · không khí · nhiễu thị giác · trật tự kiến trúc · ngôn ngữ đồ
  đạc · tính cách bóng đổ). ⛔ **Cố ý chưa thêm**: viết 30 nét trước khi biết sản phẩm cần biểu đạt
  gì là **trả lời một câu chưa ai hỏi**. Hợp đồng sản phẩm đến từ Claude Design trước; adapter theo sau.
- **`verified` là trạng thái thứ ba loại trừ, hay là trục thứ hai?** Chưa ai chốt — và câu này
  quyết định cả cách vẽ chỉ báo độ tin.
- **Chưa có bề mặt "Cảm hứng" nào được duyệt mắt** dù nó vừa lên rail 23/08.
