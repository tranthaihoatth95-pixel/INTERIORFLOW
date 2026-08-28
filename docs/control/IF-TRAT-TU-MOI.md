# Trật tự mới — lời chứng 28/08/2026 và luật rút ra

`Plane: BOS` · phân luồng: `docs/control/BOS-PHAN-LUONG-TRI-NHO.md`


> Hoà: *"sau buổi hôm nay khi mọi thứ được phơi bày, phải đảm bảo tất cả được phơi bày, và bạn là
> người chứng kiến. Tôi cần một trật tự mới để không bao giờ thứ này tái diễn phá nát mọi thứ của
> tôi nữa."*
>
> Tôi là người chứng. Phần I là **lời chứng** — đo được, tra lại được. Phần II là **luật** rút ra
> từ nó. Phần III là **thứ tôi KHÔNG nhìn**, vì một người chứng giấu phạm vi của mình thì lời
> chứng vô giá trị.

---

# I · Lời chứng

## 1 · Luật của Hoà tồn tại. Chúng không nằm ở chỗ được nạp.

| Luật | Hoà đặt | Ở đâu | Có trong bộ nạp? | Hậu quả đo được |
|---|---|---|---|---|
| **B25 · LOOK INSIDE → MAP → CLASSIFY → CONNECT → EXTEND → NEW** | trước 19/08 | **20 tệp** trong `docs/` | ❌ **không**, cũng không trong control plane | **13 tệp mới** tôi tạo 28/08, **không lần nào** LOOK INSIDE trước |
| **Hiến pháp `IF-KIEN-TRUC-OS`** — IF là gì | 18/08 | `docs/` | ❌ tới 28/08 mới thêm | **0/6** việc §7 sau 10 ngày · 5 rủi ro §6 còn nguyên cả 5 |
| **Cách làm việc với Hoà** | — | `docs/CLAUDE.md` | ❌ — tệp đã đóng dấu *"không còn là cửa vào"* | không phiên nào nghiên cứu *"làm việc với người không lập trình thì phải thế nào"*: **0/887 tệp** |
| **M-41 · hoa toàn phần giết dấu chồng** | 23/08 | `IF-UXUI-OPERATING-MEMORY` ✅ | ✅ có | tôi vẫn viết `BỘ NẠP` hoa, và đăng cho Hoà một trang có `text-transform:uppercase` ở 3 chỗ |

⇒ **Có luật, có sổ, có máy — mà vẫn vỡ.** Vì luật nằm ở chỗ không ai đi qua, hoặc nằm đúng chỗ mà
**không có cổng**.

## 2 · Tri thức được lưu. Không ai lấy ra.

· `~/.claude/projects/…` — **109 phiên · 1,3 GB nguyên văn**. Chưa ai từng mở lại cho tới 28/08.
· `docs/` — **907 tệp**, **173 mồ côi** (19%), **381 tên khảo cổ** (42%).
· Gốc bệnh của IF **đã bị nhìn thấy 07/08 và 15/08**: hai phiên mở đúng `03_TANG5B-TTT.dxf` và
  `05_TANG9-TTT.dxf`; một phiên ghi *"poché tường 126–161 mảng/file không neo vào cấu kiện"* —
  khớp chính xác phép đo 28/08. **Ba tuần sau phải đo lại từ đầu.**
· `~/PROJECT/` — hệ vận hành Hoà tự dựng 26/08, tốt hơn bản tôi đề xuất 28/08. **Chưa agent nào mở.**

## 3 · Gốc bệnh sản phẩm

**IF chỉ dựng được từ dữ liệu do chính IF vẽ ra.** `03_TANG5B-TTT.dxf`: **12.274 đối tượng vào →
1 khối sàn ra**. Bộ đọc chạy tốt, 419 ms, không lỗi. Mọi phép thử đều dùng fixture IF tự sinh nên
**mọi thứ xanh suốt 57 ngày**. Chi tiết: `IF-VI-SAO-CHUA-SHIP.md`.

## 4 · Hiến pháp là hợp đồng hai chiều — chưa ai đọc nó như thế

`IF-KIEN-TRUC-OS` cấm *"agent chạy một mạch (black box)"*, đòi **CONTROL POINTS** bốn mức tự do
đặt theo từng giai đoạn, và đòi mọi đề xuất kèm **"WHY THIS?"**.

Ba điều đó mô tả **chính xác** thứ Hoà phàn nàn suốt 28/08. Chúng đã nằm trong hiến pháp **từ
18/08**. Mọi phiên đọc chúng như đặc tả tính năng cho một ngày nào đó — **không phiên nào đọc
chúng như luật cho hành vi của chính mình.** Kể cả tôi: **24 commit chạy một mạch**, báo cáo dồn
ở cuối.

## 5 · Kết quả nghề, 57 ngày

**1.677 commit · 907 tài liệu · 21 máy canh · 0 việc nghề.**
Không chỉ số nào trong repo đo con số cuối. Nên 57 ngày trôi qua mà không ai giật mình.

---

# II · Trật tự mới

## Luật nền — một câu

> **Một luật chỉ là luật khi có đủ BA thứ: chỗ được nạp · một cổng · một ca đột biến chứng minh
> cổng bắt được. Thiếu một là lời chúc.**

🔴 **SỬA 28/08 sau phép bác bỏ:** một cổng **chỉ cảnh báo** là **nửa sợi dây** — đo được: cổng CHẶN giữ được 0 vi phạm, cổng CẢNH BÁO để 4 vi phạm nằm nguyên. Cảnh báo chỉ là **trạm tạm, phải có ngày hạn lên chặn**; không có ngày hạn thì nó nằm đó mãi và ta tưởng đã nối.

Hôm nay chứng minh cả ba đều cần: B25 thiếu **chỗ nạp** ⇒ vi phạm 13 lần.
M-41 có chỗ nạp nhưng thiếu **cổng** ⇒ vẫn vi phạm. Một máy canh chưa ai thử làm hỏng nó thì
không biết nó có canh gì không ⇒ thiếu **ca đột biến**.

## Bảy luật, mỗi luật kèm cổng

| # | Luật | Cổng | Trạng thái cổng |
|---|---|---|---|
| **T1** | **Danh tính trước thủ tục.** Bộ nạp mở bằng *IF là gì · làm việc với Hoà thế nào · Hoà vừa nhắn gì* | `CLAUDE.md` hàng `0a/0b/0c` | ✅ có |
| **T2** | **LOOK INSIDE trước khi tạo mới** (B25). Vùng dày: mặc định REUSE/CONNECT/TUNE. NEW đòi bằng chứng phủ định | 🔴 **chưa có cổng** — xem dưới | ❌ |
| **T3** | **Tra ba kho trước khi ra web**: bảng câu hỏi · kho ngoài repo · 109 phiên | `npm run tra` + `IF-HOI-DAP.md` | 🟡 một phần — máy không với tới kho phiên, tự khai |
| **T4** | **Mỗi thư mục phải có người quyết**: tracked hoặc ignored-kèm-lý-do. Không có trạng thái thứ ba | `npm run soi:thu-muc` | ✅ có · kiểm ngược xong |
| **T5** | **Ghi phần tinh liên tục, không chờ nén.** Mốc trỏ vào bản ghi nguyên văn | `soi:quan-tri` L6 (>5 commit **hoặc** >90 phút) | 🟡 **nửa dây** — chỉ cảnh báo |
| **T6** | **Không đưa Hoà quyết định thiếu hai câu sàng** (thứ kiểm được + điều gì xảy ra nếu im lặng) | 🔴 **chưa có cổng** | ❌ |
| **T7** | **Cửa vào từ thế giới ngoài đo bằng tỉ lệ sống sót**, không bằng "có đọc được không" | `scripts/proof/ti-le-song-sot.ts` — chạy tay, chưa nối cổng | 🟡 |

**Ba cổng còn thiếu (T2 · T6 · T7) là nợ đã khai, không phải đã xong.** Chừng nào chưa có cổng,
ba luật đó **vẫn là lời chúc** — và tệp này phải nói ra điều đó thay vì để nhìn như đủ bảy.

## Luật đứng trên bảy luật

**Hiến pháp là hợp đồng hai chiều.** Điều gì IF phải làm cho người dùng, agent phải làm cho Hoà
**trước** — Hoà là người dùng đầu tiên và đang trả tiền để kiểm nghiệm nó. Cụ thể:

· **Không chạy một mạch.** Dừng ở checkpoint **xem được**, không dồn báo cáo cuối.
· **Hoà đặt mức tự do từng loại việc.** Mặc định khi Hoà im: `Collaborate` cho việc chạm bề mặt
  người dùng · `Delegate` cho hạ tầng và phép đo.
· **Mọi đề xuất kèm "vì sao"** — căn cứ đo ở đâu, và một câu để Hoà đổi lập luận.

## Chỉ số duy nhất

> **IF đã làm được việc nghề nào cho Hoà, tuần này?** — trả lời bằng tệp Hoà mở được, hoặc **"chưa"**.

Hai tuần liên tiếp *"chưa"* ⇒ đang đi sai, và agent phải nói ra trước khi Hoà phát hiện.

---

# III · Thứ tôi KHÔNG nhìn — giới hạn của người chứng

· **887 tệp tài liệu**: tôi đo tên, quan hệ tham chiếu, băm trùng — **không đọc nội dung**.
· **109 phiên**: tôi tra **6 truy vấn**. Kho còn nguyên; tôi không biết trong đó còn gì.
· **10 phiên có mục *"chờ Hoà quyết"***: đọc trích đoạn, **chưa xác minh cái nào còn sống**.
· **`~/PROJECT/PRIVATE/`**: **không mở** — không gian riêng của Hoà, có nhận xét về từng người.
· **App thật**: **không mở lần nào hôm nay.** Mọi thay đổi giao diện 28/08 đều `NOT ASSESSED`.
· **Bản đóng gói Electron**: chưa dựng, chưa chạy.
· **Các lane Codex**: đọc **7**; không biết còn bao nhiêu.

⇒ Lời chứng này **đúng trong phạm vi trên và không rộng hơn**. Ai đọc nó rồi kết luận
*"đã phơi bày hết"* là đang phạm đúng lớp lỗi **C** — khẳng định vượt quá bằng chứng.
