# ①-XẤU · HOME — TƯỜNG THẺ TRẮNG TRÊN NỀN TRẮNG

**XẤU** · 23/08/2026 · bề mặt do `components/home/BeMatHome.tsx` vẽ, mount ở
`components/home/DongStudioHome.tsx:571`, trạng thái `D` / mật độ `dày`.

## 🔴 TÌNH TRẠNG BẰNG CHỨNG — đọc trước khi tin bất cứ câu nào dưới đây

| Thứ | Có không | Ghi chú |
|---|---|---|
| Ảnh Hoà chụp màn 23/08 | ❌ **CHƯA CÓ TRONG REPO** | tôi đã tìm: `artifacts/visual-review/` không có ảnh Home nào của 23/08 ngoài `2026-08-23-lane-workspace-01-home-CHUNK500.png` — **tôi đã mở, nó chỉ là một vòng xoay đang tải, vô dụng làm bằng chứng** |
| Số đo trên app thật 23/08 | ✅ có | `docs/bao-cao-phien/2026-08-23-lane-home-2.md` — đo bằng DOM, không bằng mắt |
| Ảnh Home thật đã mở bằng mắt | ✅ có, nhưng là **22/08** | `artifacts/visual-review/ui-authority/home-production/real-home-1440.png` — tôi đã mở. Nó là **ca liền trước**, cùng họ bệnh, khác một số chi tiết |
| Bản vẽ mổ xẻ bốn lỗi | ✅ có | `artifacts/visual-review/MOCK-home-sua-4-loi.png` — tôi đã mở |

⇒ Mọi mô tả dưới đây gắn nhãn nguồn. **Không câu nào tả một ảnh tôi chưa mở.**
Khi Hoà gửi ảnh 23/08, dán vào `artifacts/visual-review/` rồi cập nhật tệp này —
đây là ca đắt nhất của cả đợt, nó xứng đáng có ảnh riêng.

## Nhìn thấy gì

**Từ số đo 23/08** (`2026-08-23-lane-home-2.md`, đo DOM trên app thật):

- Thẻ *Việc đang dở* nhận khung `2x2` — sàn khung `2×88 + gap ≈ 184px` — trong khi **ruột
  nó chỉ cao 136px** (tên dự án · lần cuối mở · một nút). `WidgetCard` là `h-full` nên nó
  **kéo giãn vỏ trắng** cho bằng khung.
- Kế hoạch bày có **11 mục**, nhưng **chỉ 3 mục có dữ liệu**. Lưới cứng 4 cột ⇒ 3 ô trên
  4 cột ⇒ **lỗ thủng 234px ở mép phải**.
- Cả lưới cao **105px trong khung 720px** ⇒ **480px trống dồn xuống đáy**.
- **6 nhãn HOA TOÀN PHẦN** (Hoà đếm trên màn; nguồn thật là **9 chỗ** trong mã, `WidgetCard`
  là gốc của 6 trong số đó).
- Nền: `SystemWallpaper` **đang chạy**, không tắt. Gradient `rgba(254,254,255,.85)` trên nền
  trang `rgb(242,242,247)` ⇒ **chênh ≈ 3 điểm sáng**. Vẽ đúng, và vô hình.
- Widget *Lưới tích luỹ studio* (kiểu ô vuông GitHub) và *Biểu đồ chặng* hiện `3/0 · 0/0 · 0/0`.

**Từ ảnh 22/08 tôi đã mở** (`real-home-1440.png`, 1440 rộng):

- Sidebar là một khối đặc màu kem, **đè lên** vùng nội dung — chữ *"Tiếp tục Nháp"*,
  *"hôm nay"*, *"DỰ ÁN"*, *"Nháp"* bị mép phải sidebar cắt ngang.
- Bốn nhãn nhóm HOA TOÀN PHẦN: `VIỆC` · `NHÁP` · `CHẶNG` · `DỰ ÁN`.
- Một **cung mặt trời** vẽ giữa màn, kèm `05:00` · `20:00` · `HOÀNG HÔN · 3200K`.
- Từ khoảng y≈660 xuống đáy màn: **trống hoàn toàn**, ước lượng bằng mắt ~45% chiều cao.

## VIỆC CON NGƯỜI nào bị đánh mất

Nhiệm vụ của Home, theo chốt Hoà 23/08 (`docs/design-campaign/dna/HOME-SPEC-2026-08-23.md`):

> **Nắm nhanh tình hình và đưa người dùng vào đúng việc.**

Đối chiếu từng vật trên màn với câu đó:

| Vật | Phục vụ việc gì của con người | Phán |
|---|---|---|
| Việc đang dở | *tiếp tục cái tôi đang làm* | ✅ đúng việc — nhưng bị dựng sai (xem dưới) |
| Cung mặt trời + `3200K` | — | ❌ **không việc nào**. Không ai mở IF để tra nhiệt độ màu của hoàng hôn |
| Lưới tích luỹ studio | — | ❌ đo **quá khứ**, không giúp bắt đầu việc gì |
| Biểu đồ chặng `3/0 · 0/0 · 0/0` | — | ❌ ba số không thì không có tình hình nào để nắm |
| Ghi chú nhanh · Vật liệu của tuần | *liếc nhanh* | 🟡 hợp lệ ở **tầng 2 · PERSONAL**, nhưng đang đứng **ngang hạng** với việc đang dở |

⇒ Bốn trên bảy vật **không trả lời được câu "phục vụ việc gì"**. Chúng có mặt vì có ô trống,
không vì có người cần.

## NGUYÊN TẮC bị vi phạm — dẫn nguồn từng cái

| # | Luật | Nguồn | Ngày |
|---|---|---|---|
| 1 | *"TRƯỢT nếu Home vẫn trông như dashboard SaaS"* — **cấm lưới thẻ đều** | `components/home/xuong-layout.ts:7` | 20/08 |
| 2 | bản bốn-dải FAIL vì *"thẻ khổng lồ, tường widget"* | `components/home/BeMatHome.tsx:13` | 22/08 |
| 3 | *"KHÔNG lưới đồng đều. Editorial có trọng lượng… **Cỡ card = mức quan trọng**"* | `dna/HOME-SPEC-2026-08-23.md` §Bố cục | 23/08 |
| 4 | HOME là *personal operating surface*, **KHÔNG** là *project dashboard, analytics wall, **card farm*** | `.claude/skills/if-design/SKILL.md:30` | — |
| 5 | Chữ Việt: **cấm hoa toàn phần** (dấu chồng mang nghĩa) | `docs/LUAT-CHU-VIET-7.1.23-2026-07-31.md` | 31/07 |
| 6 | *"Widget thiếu dữ liệu thì **TỰ ẨN**"* | chốt Hoà 13/08, `docs/00-CHOT.md` | 13/08 |
| 7 | Daylight *"tác động qua ánh sáng… người dùng **CẢM** giờ; không bao giờ ĐỌC nó"* | `02-FAILURE-LEDGER.md` F-01 | 22/08 |
| 8 | *"thống kê phù phiếm"* — lưới đóng góp kiểu GitHub đã bị loại **tường minh** | `docs/nc/NGHIEN-CUU-NODE-CANVAS-DOITHU-2026-08-02.md` | 02/08 |
| 9 | Home ambient: *"màn càng rộng thì **khoảng âm càng lớn**, không phải thẻ càng dãn"* | chốt 20/08 | 20/08 |

**Luật 1 và 2 đã bị phạm lần thứ ba.** Đó là ngưỡng của `02-FAILURE-LEDGER`:
*same class twice = process failure* — hỏng ở hệ thống, không ở lần này.

## VÌ SAO NÓ HỎNG — CƠ CHẾ

Bảy cơ chế. Không cái nào là *"gu"*; mỗi cái đều chỉ được ra một dòng mã hoặc một quyết định.

### ① Nội dung tồn tại mà không có việc của con người đứng sau nó

Cung mặt trời không xuất hiện vì ai đó muốn nó. Nó xuất hiện vì **có một ô, và có dữ liệu
lấp được ô đó**. Đây là chuỗi nhân quả ngược: bình thường *việc → nội dung → chỗ đứng*;
ở đây là *chỗ trống → tìm dữ liệu → dán vào*.

`F-01` bắt đúng dạng này ở tầng sâu hơn: có một chú thích ngay trên đoạn mã vẽ cung mặt
trời, tự khai *"thuộc về khí quyển, không phải một widget"* — **lời khai và mã nói ngược
nhau, và chỉ lời khai được đọc.** Dán nhãn *ambient* cho một thứ không làm nó thành ambient.

⇒ **Cơ chế: một ô trống là một lời mời bịa nội dung.** Lưới có kích thước cố định thì luôn
sinh ra ô trống, nên lưới cố định là cỗ máy đẻ widget vô nghĩa.

### ② Thẻ ngang trọng lượng phá thứ bậc — không còn nhân vật chính

Mọi widget đều gọi **cùng một** `WidgetCard`. Ở theme sáng, `--card` là `#fff` trên `--bg`
`rgb(242,242,247)` ⇒ mắt nhận **một chuỗi tấm giống hệt nhau, cách nhau 5 điểm sáng**.

Chỗ này có một phản xạ sai rất dễ mắc: *"để cứu thứ bậc thì cho thẻ quan trọng to hơn"*.
Không cứu được.

> **To hơn không có nghĩa quan trọng hơn nếu chất liệu y hệt.**
> Mười tấm cùng vật liệu, một tấm to gấp đôi — mắt đọc ra *"một tấm to"*, không đọc ra
> *"tấm quan trọng"*. Thứ bậc là quan hệ **chất**, không phải quan hệ **cỡ**.

⇒ **Cơ chế: thứ bậc phải nằm ở CHẤT LIỆU trước, kích cỡ chỉ khuếch đại nó.** Lời giải đã
thi hành là trục thứ hai `VaiO`: `hero` / `chinh` / `phu`, trong đó **`phu` = KHÔNG VỎ**
(không nền, không viền, không bóng — chỉ một đường tóc). Cố ý **không** làm *"vỏ nhạt hơn"*:
thẻ nhạt cạnh thẻ đậm **vẫn là tường thẻ**.

### ③ Việc đang làm không phải nhân vật chính

Hoà mở Home để **quay lại việc đang dở**. Trên màn, việc đang dở là một trong bảy tấm, cùng
vật liệu, và tấm của nó lại **rỗng nhất** (136px ruột trong 184px khung).

Nghịch lý đáng ghi: thứ quan trọng nhất trông **trống nhất**, vì nó là thứ duy nhất nói
ngắn gọn. Các widget vô nghĩa thì đầy chữ — nên chúng trông "chắc" hơn.

⇒ **Cơ chế: khung cố định + `h-full` biến sự súc tích thành sự rỗng tuếch.** Nội dung ngắn
là **đức tính**; hệ bố cục đang phạt nó.

### ④ Khoảng trống bị đối xử như thiếu hụt cần lấp, thay vì là vật liệu bố cục

Số cột là hằng số `4` (`nhip.cot`, chép từ bản vẽ). Bản vẽ có 11 ô nên **luôn kín**. App thật
thì widget tự ẩn ⇒ 3 ô trên 4 cột ⇒ lỗ 234px.

Hai cách chữa, và **cách hiển nhiên là cách sai**:

| Chữa | Kết quả |
|---|---|
| ❌ *thu số cột về 3* | hết lỗ, nhưng ba ô phình lên **319px** — đổi lỗi này lấy lỗi kia (thẻ kéo dãn) |
| ❌ *lấp thêm widget vào cho kín* | đây chính là cơ chế ① |
| ✅ **thu cột VÀ thu bề ngang khung theo cùng tỉ lệ** | phần dư **trả về cho nền** |

Luật 20/08 nói thẳng: *"màn càng rộng thì **khoảng âm càng lớn**, không phải thẻ càng dãn"*.

⇒ **Cơ chế: khoảng trống là vật liệu, không phải lỗi.** Coi nó là lỗi thì hoặc phình thẻ,
hoặc đẻ widget — hai cửa đều dẫn tới tường thẻ.

### ⑤ Home trượt thành dashboard

Bốn dấu hiệu, mỗi dấu hiệu là một lời tự thú:

- lưới thẻ đều nhau,
- ô thống kê tích luỹ (lưới kiểu GitHub),
- biểu đồ,
- nhãn nhóm HOA + mono + giãn chữ.

Không dấu hiệu nào bị ai chọn. Chúng là **đường mặc định**: hỏi *"bày nhiều thông tin lên
một màn thế nào"* thì bộ nhớ trả về hình dashboard, vì trên đời có hàng vạn dashboard.

⇒ **Cơ chế: dashboard là trạng thái NGHỈ của bố cục — nó là thứ xảy ra khi không ai quyết
định gì.** Vì thế nó tái phát ba lần dù đã có luật cấm: luật cấm một *đích đến*, còn cái
đẩy ta tới đó là *lực hấp dẫn*, và lực thì không đọc luật.

Cổng chặn duy nhất chạy được: **`checks/human-centric-checklist.md` hỏi từng vật một** —
vì một dashboard được lắp bằng từng vật, và mỗi vật đều trượt cùng một câu hỏi.

### ⑥ Điều hướng át nội dung

*(nguồn: ảnh 22/08 tôi đã mở)* Sidebar là khối kem đặc, đè lên vùng nội dung, cắt ngang chữ.
Bên trái là một danh sách đường đi **đầy đủ và đọc được rõ**; bên phải là nội dung **bị cắt**.

⇒ **Cơ chế: khi bản đồ đọc rõ hơn lãnh thổ, người dùng đọc bản đồ.** Sidebar là hạ tầng;
hạ tầng đọc rõ hơn nội dung nghĩa là nội dung đã thua. Chi tiết ở cặp ② SIDEBAR.

### ⑦ Tiện ích cá nhân xuất hiện mà người dùng không hề yêu cầu

*Vật liệu của tuần* · *Ảnh đẹp tuần này* · *Lưới tích luỹ* — không ai bật chúng. Chúng bật sẵn.

Chốt 23/08 cho phép **tầng 2 · PERSONAL** tồn tại — nhưng có điều kiện: *"chỉ giữ **liếc +
thao tác nhanh**"* và ưu tiên **CORE WORK > AI CONTEXT > PERSONAL**. Trên màn thì ba tầng
**ngang nhau**, nên điều kiện đó bị vô hiệu trên thực tế dù đúng trên giấy.

⇒ **Cơ chế: bật-sẵn là một quyết định, và nó đang được đưa ra bởi sự im lặng.** Không ai
chọn bật; chỉ là không ai chọn tắt. Mặc định phải được **thiết kế**, không được **rơi ra**.

## HỌC GÌ

1. **Hỏi "vật này phục vụ việc gì của con người" cho TỪNG vật, trước khi vẽ.** Không trả lời
   được thành một câu ⇒ nó không lên màn. Đây là cổng, không phải lời khuyên —
   `checks/human-centric-checklist.md`.
2. **Thứ bậc đi bằng chất liệu, rồi mới tới cỡ.** Có ít nhất một vai **không vỏ**.
3. **Ô là ĐƠN VỊ ĐO, không phải KHUÔN ĐÚC.** Widget khai bằng số ô, nhưng ô phải **co theo
   ruột** — cấm `h-full` trong ô lưới.
4. **Khoảng trống là vật liệu.** Phần dư trả về cho nền.
5. **Nền phải NHÌN THẤY ĐƯỢC mới tính là nền.** Chênh 3 điểm sáng = không có nền.
   Nghiệm thu bằng số, không bằng *"đã bật chưa"*.
6. **Đo tình trạng widget bằng "có gì để nói không", không bằng "có dữ liệu không".** Cổng
   cũ hỏi *tổng dự án ≥ 2* nên trả về `3/0 · 0/0 · 0/0` — hỏi sai câu thì trả lời đúng vẫn vô dụng.
7. **Một chữ trong primitive dùng chung đẻ ra sáu lỗi trên màn.** `uppercase` ở
   `WidgetCard` ⇒ 6 nhãn hoa. Sửa ở primitive, đừng vá ở nơi dùng.

## KHÔNG ĐƯỢC CHÉP GÌ

- ⛔ **Đừng chép danh sách widget này rồi bỏ bớt vài cái.** Bỏ bớt vẫn là tường thẻ, chỉ
  ngắn hơn. Vấn đề là **cơ chế sinh ra chúng**, không phải số lượng.
- ⛔ **Đừng lấy "6 nhãn HOA" thành luật "cấm chữ hoa ở mọi nơi".** Luật thật là chữ Việt có
  **dấu chồng mang nghĩa**; `VI`/`EN`/mã kỹ thuật vẫn hoa được.
- ⛔ **Đừng đọc "gỡ biểu đồ" thành "IF không có biểu đồ".** Ba widget `StageChart` ·
  `ContributionGrid` · `NewsFeed` **vẫn sống** ở `xuongLayout`. Đây là quyết định **của
  Trang chủ** — Home là **nơi chốn**, không phải trang phân tích.
- ⛔ **Đừng dùng số 234px / 480px / 136px làm hằng số thiết kế.** Chúng là số đo của **một**
  trạng thái (`D`/`dày`, 1440×900). Chúng chứng minh một **cơ chế**, không định nghĩa một cỡ.

## NGUYÊN TẮC THAY THẾ ĐÚNG

> **Home là MỘT NƠI CHỐN có một việc đang chờ bạn — không phải một bảng số liệu về bạn.**

Bốn câu thi hành được:

1. **Một tiêu điểm, một cụm phụ.** Đúng một vùng lớn, lệch trục, là thứ mắt chạm đầu tiên.
   Không có vùng thứ hai ngang hạng. *(`xuong-layout.ts` docstring)*
2. **Vị trí tiêu điểm KHÔNG đổi giữa các trạng thái.** Dữ liệu **cập bến** vào tiêu điểm;
   tiêu điểm không nhảy chỗ. Đó là thứ làm Home đọc ra **một không gian đang lớn lên** thay
   vì ba màn khác nhau.
3. **Ba vai vật liệu, và vai `phu` không có vỏ.** Truyền bằng context, không bằng prop — vai
   là quyết định của **bố cục**, không phải của widget.
4. **Cửa loại bỏ, nguyên văn chốt 23/08:** widget nào khiến người dùng *ở lại Home lâu* mà
   không giúp **hiểu tình hình · bắt đầu · tiếp tục · quyết định · giảm chuyển ngữ cảnh**
   thì không được ưu tiên.

Xem tiếp: `GOOD/home-living-canvas.md`.
