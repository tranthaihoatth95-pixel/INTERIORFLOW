# PHIẾU · HOME — VÒNG PHÒNG SẠCH

> **TRẠNG THÁI: ĐANG CHẠY (phóng 04/09).** Cửa *"context đã sạch chưa"* **đã mở** — lệnh SHIP
> 04/09 đặt *"Continue Home H1/H2/H3 eye-review pipeline"* làm mục THI HÀNH NGAY, đè cửa cũ.

---

## ⓪ TIỀN ĐỀ — xác nhận hoặc BÁC BỎ trước khi vẽ một nét nào
1. `docs/ACTIVE-DESIGN-CONTEXT.md` tồn tại và là **thẩm quyền thiết kế duy nhất**.
2. `docs/delivery/LEGACY-DESIGN-QUARANTINE.md` liệt **12 hướng bị đè**, trong đó có Home hiện tại,
   bento, `WidgetCard`, Hybrid B×A, và ba study `mock-home-h{1,2,3}-*`.
3. Cây git sạch, HEAD không lệch nhánh `integration/2026-09-04`.
Sai một điều ⇒ **DỪNG, báo IF COMMAND.** Làm đúng một phiếu sai vẫn là hỏng việc.

## ⓪b MỐC
`git rev-parse --short HEAD` + `git rev-list --count HEAD..origin/integration/2026-09-04`.
Lệch > 0 ⇒ DỪNG. (Ca thật 16/08: ba worker cùng bị cắt từ mốc lệch **167 commit**, chạy mù hết.)

---

## MỤC TIÊU
Ba nghiên cứu bố cục Home cho khổ rộng, **khác nhau ở CƠ CHẾ**, không phải ở lớp sơn.

## ⛔ ĐẦU VÀO — CHỈ BỐN THỨ NÀY
```
① docs/ACTIVE-DESIGN-CONTEXT.md        ← thẩm quyền thiết kế
② §5 của tệp đó — yêu cầu chức năng A–K
③ §9 của tệp đó — gu và tham chiếu của Hoà
④ §6 của tệp đó — luồng nghề thật
```
**CẤM TUYỆT ĐỐI làm đầu vào:** ảnh chụp Home hiện tại · bất kỳ `mock-home-*` nào đang có ·
bento · `WidgetCard` · Hybrid B×A · `mock-exs-c-home-work-os.html` · bất kỳ ảnh nào trong
`docs/delivery/anh-duyet-mat/`.

**CẤM crawl `docs/` để tìm hướng thị giác.** Kho đó **761 tệp · 78 MB**, phần lớn là *lịch sử*.
Mở tệp cũ **chỉ khi** cần truy nguyên · cứu vốn · giữ hành vi · điều tra xung đột — và khi mở thì
đọc với tư cách **bằng chứng**, không phải tiền lệ.

**Bản cài đặt hiện tại chỉ được soi SAU**, và chỉ để lập hai danh sách:
`HÀNH VI PHẢI GIỮ` và `RÀNG BUỘC KỸ THUẬT`. Không để bản cài đặt quyết định bố cục.

## BA HƯỚNG — TÊN DO HOÀ ĐẶT, BỐ CỤC PHẢI DỰNG LẠI TỪ ĐẦU

Lệnh SHIP 04/09 gọi đích danh: **H1 LIVING WALL · H2 PERSONAL STUDIO · H3 QUIET DESKTOP**.
Ba cái tên đó là **cách Hoà đặt vấn đề** ⇒ **giữ nguyên tên**.
⛔ Nhưng **bố cục cũ mang ba tên đó đã bị cách ly** (`LEGACY-DESIGN-QUARANTINE.md`) — **cấm mở
`mock-home-h{1,2,3}-*` ra xem rồi vẽ lại cho giống**. Phải **dẫn xuất lại cơ chế từ §5**, và trong
báo cáo phải nói rõ **đi tới cơ chế đó bằng đường lập luận nào**. Trùng tinh thần bản cũ thì được;
chép bố cục bản cũ thì không.

Home phải đại diện **cả hệ sinh thái IF**, không chỉ việc đang dở: dự án · việc đang làm · cảm hứng ·
công cụ · widget cá nhân · Vitals · hoạt động · trí tuệ thiết kế.

## BA CƠ CHẾ — mỗi hướng phải khác nhau ở CƠ CHẾ
Ba hướng phải khác nhau ở **cách tổ chức không gian và cách thông tin lộ dần**, mỗi hướng trả lời
khác nhau ba câu:
- việc đang làm chiếm chỗ thế nào trong một **studio đang sống** (nó là **một** đối tượng trội,
  **không phải toàn bộ** Home);
- thứ phụ xếp theo cơ chế gì (§24: **cấm** ép hết thành một hàng ngang — *nghĩa địa widget không
  được thành nghĩa địa toolbar*; xếp theo **liên quan × tần suất × giá trị quyết định × ngữ cảnh**;
  được nén · gập · hé dần · đưa về theo yêu cầu);
- môi trường (nền/ánh sáng/ảnh) đóng vai gì mà **không** cạnh tranh với việc (`WORK > ATMOSPHERE`).

⚠️ Wallgallery động · LightClock · bố cục chữ-với-ảnh là **nghiên cứu môi trường/sản phẩm**, KHÔNG
phải cớ để mở việc thi công không liên quan.

## MỖI HƯỚNG PHẢI DỰNG BA KHUNG
`a` ngày thường có việc dở · `b` **studio rỗng** · `c` **bảy dự án**.
- Khung `b` **không phải** "Home trừ ảnh hero". Nó phải ra **studio sáng tạo tĩnh**, đường đi
  `RESUME → BEGIN` (chính: tạo dự án · phụ: mở/nhập · thứ ba: khám phá). **Cấm 6 thẻ onboarding.**
- **Đa dạng nội dung (§22):** ba hướng cộng lại phải bày **≥4 loại mảnh việc sống** khác nhau.
  **Mặt bằng 2D được xuất hiện nhiều nhất MỘT lần** trên cả chín khung — nó là *một trạng thái*,
  không phải *bản sắc Home*.
- **§28 — dùng hiện vật công việc THẬT.** Cấm gradient giả để Hoà phán thứ bậc. Dùng dữ liệu mẫu
  thì **ghi rõ DEMO** ngay trên khung.
- **§30 —** nội dung ngoài tầm nhìn phải có **dấu hiệu còn tiếp**.

## MÁY TIỀN KIỂM — chạy trước khi trình, không trình bản chưa qua
```
node scripts/chup-mock.mjs      → 9 khung × 2 nền
node scripts/soi-ban-ve.mjs     → tràn khung 0 · vượt khổ 0 · chữ dưới ngưỡng 0
```
Chữ nằm trên ảnh thì khai `data-tren-anh` — máy trả **"không đo được"**, và **"không đo được" là
câu trả lời đúng; nói "trượt" là nói dối theo hướng ngược lại**. Báo số đoạn không-đo-được mỗi
khung; đó là cái giá của việc chữ đè hình và **chỉ mắt Hoà phán được**.

## TOKEN — không nới
Thang bo `6/10/14/20` + `--r-full` · bo đồng tâm `rInner = max(4, rOuter − pad)` khi `pad ≤ 8` ·
màu khai theo **vai trò**, cấm gõ hex · chữ **4.5:1**, thành phần **3:1** · `prefers-reduced-motion`
thắng tất cả · **màu không bao giờ là kênh duy nhất** · kính **chỉ ở lớp vỏ**, cấm kính chồng kính.

## CHỐNG CHỈ ĐỊNH — §10 của ACTIVE-DESIGN-CONTEXT
19 mục. Nặng nhất ở đây: **SaaS dashboard · bento làm mặc định · tường widget · thẻ-cho-mọi-thứ ·
hộp rỗng khổng lồ · landing page điện ảnh · ba nấc chỉ khác chiều cao.**

## FILES_ALLOWED
`docs/mocks/` — **chỉ tệp MỚI**, đặt tên mới, **không sửa mock cũ** ·
`docs/delivery/` — một tệp bản trình mới · `docs/bao-cao-phien/` — một báo cáo.

## DO_NOT_TOUCH
Mọi mã sản phẩm (`components/` `lib/` `app/`) — **§19 KHÔNG CODE còn hiệu lực** ·
mọi `mock-home-*` đang có · `docs/ACTIVE-DESIGN-CONTEXT.md` · `docs/00-CHOT.md` ·
`prisma/` · `scripts/`. KHÔNG commit, KHÔNG push — MAIN giữ cổng tích hợp.

## ĐẦU RA
Một tệp trình trong `docs/delivery/`, gọn, cho Hoà đọc **trên điện thoại**:
mỗi hướng đúng **một đoạn cơ chế** + **rủi ro lớn nhất của chính nó** + bảng đối chiếu A–K.
Kèm báo cáo có đủ ô **⑦b CHƯA CHẮC/CHƯA KIỂM** (trống cũng phải ghi là trống) và
**⑦c HẠN DÙNG KẾT LUẬN**.

## CỬA TRÌNH HOÀ
IF COMMAND gạn lọc rồi mới trình. **Tối đa 2–4 quyết định** một lô, và Hoà phải trả được bằng đúng
một từ: `ĐẠT` · `SỬA` · `A/B` · `GHÉP`. Không đưa Hoà ảnh thô hay hàng chục tệp bằng chứng.

## HỢP ĐỒNG TRẢ VỀ
Ba cơ chế, mỗi cơ chế một câu · đường lập luận từ §5 ra cơ chế đó · số máy tiền kiểm ·
số đoạn không-đo-được mỗi khung · và những gì **chưa chắc**.
