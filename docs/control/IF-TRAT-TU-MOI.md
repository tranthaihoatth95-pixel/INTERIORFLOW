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

| **T9** | ⚠️ **KHÔNG PHẢI LUẬT MỚI — máy hoá của `M-55`.** Luật đã có trước 28/08 trong `IF-UXUI-OPERATING-MEMORY.md` (tệp **nằm sẵn trong bộ nạp**): *"khẳng định phủ định phải kèm ĐẦU RA NGUYÊN VĂN; không dán được ⇒ chưa được khẳng định"*. MAIN vi phạm nó **ba lần trong ngày**, rồi **phát minh lại nó**. `T10` cũng vậy — `M-55` đã kết luận *"quyền bác ngược của phiên khác là hàng rào DUY NHẤT"*. **Khẳng định VẮNG MẶT phải kèm lệnh chứng minh.** *"Chưa có X"* chỉ đúng **trong phạm vi mình đã nhìn**; nhìn nhầm chỗ là **sai âm thầm**, không ai phát hiện | `npm run soi:vang-mat` · bánh cóc **7** | ✅ **CHẶN** · kiểm ngược xong |
| **T10** | **Một lượt phản biện độc lập cuối mỗi khối việc** — phiên context **trắng**, giao đúng một việc: **cố bác bỏ** kết luận vừa ra | 🟡 **thói quen, chưa có cổng** — máy không ép được người phóng agent | 🟡 |

**Ba cổng còn thiếu (T2 · T6 · T7) là nợ đã khai, không phải đã xong.**

## Vì sao T9 và T10 sinh ra — 28/08

Ba câu sai của MAIN trong một ngày, **cả ba chỉ lộ ra vì Hoà hỏi**:

| | khẳng định | sự thật |
|---|---|---|
| sáng | `42/48` flow tên rác | `32/52` — số nhớ từ phiên trước |
| trưa | `16 máy soi ÷ 5` | `14/14` — **chính MAIN vừa nối 8 máy rồi vẫn trích số cũ** |
| chiều | *"bản đóng gói Electron **chưa dựng**"* | **336 MB nằm trong `dist/` từ 15/07** · đo lại: `ls -la dist/` |

*"Hoà tình cờ hỏi đúng chỗ"* **không phải một cơ chế.** Hai câu đầu là **khẳng định về số đếm**,
câu thứ ba là **khẳng định về sự vắng mặt** — và câu thứ ba nguy hiểm nhất, vì khẳng định **có**
thì nhìn một cái là bác được, còn khẳng định **không có** đọc y hệt một kết luận đã kiểm.

`T9` bắt được lớp thứ hai bằng máy. `T10` bắt được lớp thứ nhất bằng người —
và nó **đã chứng minh giá trị ngay lượt đầu**: một phiên context trắng, ba phút, tìm ra **ba lỗi
thật** trong chẩn đoán mà MAIN vừa viết, gồm cả câu *"tỉ lệ 16÷5"* đã hết đúng.

⚠️ **T9 khai đúng phạm vi của nó**: nó **KHÔNG** bắt mọi câu khẳng định vội — chỉ bắt **một lớp
con hẹp**. Thước phải siết hai lần: lượt đầu bắt cả **câu luật** (*"thư mục chưa ai quyết"* là
**tên một luật**) — kêu oan, đúng lý do `L3` từng bị bỏ. Chừng nào chưa có cổng,
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
· ~~**Bản đóng gói Electron**: chưa dựng, chưa chạy.~~ 🔴 **SAI — SỬA 28/08, cùng ngày.**
  Đo: `dist/InteriorFlow-0.1.0-arm64.dmg` · **336 MB** · dựng **15/07/2026** từ commit `7aa9006`,
  bung ra **895 MB**, **25 tệp `.wasm`**. **Một bộ cài macOS thật đã tồn tại 44 ngày trên đĩa.**
  Đo lại bất cứ lúc nào: `ls -la dist/`.
  Tôi khẳng định "chưa dựng" mà **không mở thư mục `dist/` ra nhìn** — lần thứ ba trong một ngày,
  đúng bệnh phiên phản biện vừa chỉ: **không kiểm lại trước khi khẳng định**.
  ⚠️ Bộ cài đó **không dùng được để ship**: dựng trước ~1.400 commit, trước toàn bộ việc GPL,
  trước cờ tắt DWG. Nhưng nó chứng minh **đường đóng gói ĐÃ từng chạy** — mốc *"IF cài trên máy
  khác"* không phải đường chưa ai đi, mà là đường **đã đi được rồi bỏ**.
· **Các lane Codex**: đọc **7**; không biết còn bao nhiêu.

⇒ Lời chứng này **đúng trong phạm vi trên và không rộng hơn**. Ai đọc nó rồi kết luận
*"đã phơi bày hết"* là đang phạm đúng lớp lỗi **C** — khẳng định vượt quá bằng chứng.
