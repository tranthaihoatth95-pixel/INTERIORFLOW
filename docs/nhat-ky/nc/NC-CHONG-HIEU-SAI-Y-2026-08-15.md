# NC · Chống hiểu sai ý — chốt chặn TRƯỚC khi code (RG2, 15/08)

> Câu gốc Hoà: *"mình nói bạn hiểu sai mà không check lại là chết, vì mình không hiểu chuyên ngành
> lập trình."* Phạm vi bài này: **chỉ** khoảng trống giữa "chốt bằng lời" và "duyệt mắt ở cuối" —
> không đụng khung quy trình/repo/GitHub (RG1 lo phần đó).
>
> ⚠️ **HẠN DÙNG KẾT LUẬN**: nghiên cứu ngành (BDD/Specification by Example/Three Amigos) là kiến
> thức ổn định, ít đổi theo năm. Phần về LLM (Rephrase-and-Respond, AI đóng vai Three Amigos) là
> lĩnh vực đổi nhanh — số liệu/kỹ thuật cụ thể có thể lỗi thời trong 6-12 tháng, cần tra lại nếu
> dùng làm luật cứng lâu dài.

---

## 1 · Tổng quan

Ngành phần mềm **đã giải bài toán này** cho trường hợp "người nghiệp vụ không biết code" — cụm kỹ
thuật gọi chung là *Behaviour-Driven Development / Specification by Example*: bắt người nghiệp vụ
xác nhận **ví dụ cụ thể, thấy được** (không phải câu mô tả trừu tượng) trước khi ai viết dòng code
nào. Với hoàn cảnh IF (1 người + AI, không có đội 3 vai), kỹ thuật khả dụng nhất là **AI tự đóng
3 vai trong Three Amigos** (đã có bài viết thực chiến 2025 mô tả đúng ca này) + **diễn đạt lại bằng
ví dụ cụ thể/hình phác thảo** thay vì Given-When-Then thuần chữ — vì Hoà là kiến trúc sư, mắt đọc
hình nhanh hơn đọc văn bản kỹ thuật. Phần D (khuôn diễn đạt lại) là trọng tâm và khớp thẳng vào
luật "HỎI GỘP BẰNG TRẮC NGHIỆM" Hoà đã chốt 15/08 trong `docs/CLAUDE.md` — không phải cơ chế mới,
mà là NỘI DUNG bỏ vào bên trong cơ chế trắc nghiệm đã có.

---

## 2 · Chi tiết từng mục

### A · Sáu kỹ thuật đã kiểm chứng — bắt người nghiệp vụ làm gì, tốn bao lâu, bằng chứng, điểm yếu

| Kỹ thuật | Người nghiệp vụ làm gì | Tốn (mỗi lần) | Bằng chứng hiệu quả | Điểm yếu đã biết |
|---|---|---|---|---|
| **Specification by Example** (Gojko Adzic) | Cùng viết/duyệt **ví dụ cụ thể** (số thật, tên thật) thay cho câu mô tả chung chung, trước khi code | Theo phase dự án, không có con số/lần cụ thể | Sách dựa trên khảo sát 30 đội × 50 dự án; case study ngành hạt nhân + tài chính dùng để đơn giản hoá tuân thủ quy định ([gojko.net](https://gojko.net/2020/03/17/sbe-10-years.html), [Manning](https://www.manning.com/books/specification-by-example)) | Cần đầu tư công cụ "living documentation"; hiệu quả phụ thuộc ví dụ có ĐỦ CỤ THỂ hay vẫn chung chung |
| **BDD / Given-When-Then** | Đọc & xác nhận kịch bản viết bằng "ngôn ngữ chung" (ubiquitous language), không phải thuật ngữ code | Vài phút/kịch bản | Không tìm được số liệu định lượng (tỷ lệ % giảm lỗi) qua nguồn công khai — chỉ có lập luận định tính | Kịch bản có thể phình to (Gherkin bloat); nếu dev viết một mình thì mất giá trị cộng tác — chỉ còn là "kịch bản" không phải "đối thoại" ([Medium](https://medium.com/codex/how-to-use-behaviour-driven-development-bdd-in-acceptance-criteria-a72668e0892f), [AccelQ](https://www.accelq.com/blog/bdd-behavior-driven-development/)) |
| **Acceptance Criteria** | Đọc điều kiện "coi là xong" viết từ góc nhìn người dùng, gật/lắc trước khi vào sprint | Nhanh, thường gộp lúc lập kế hoạch | — | Nếu viết bằng câu mơ hồ ("chạy tốt", "đẹp") thì vô nghĩa — bản thân kỹ thuật không tự sinh ra tính cụ thể ([Atlassian](https://www.atlassian.com/work-management/project-management/acceptance-criteria)) |
| **Example Mapping** (Matt Wynne) | Ngồi cùng AI/dev viết thẻ Quy tắc – Ví dụ – Câu hỏi cho MỘT việc, giới hạn thời gian | **~25 phút/việc**, khuyến nghị lặp lại mỗi 1-2 ngày | Thực hành rộng trong cộng đồng Cucumber; quy tắc 25 phút là kinh nghiệm đúc kết không phải khảo sát học thuật ([Matt Wynne — Medium](https://medium.com/@mattwynne/introducing-example-mapping-42ccd15f8adf), [Cucumber blog](https://cucumber.io/blog/bdd/example-mapping-introduction/)) | Nếu 25 phút không xong ⇒ việc quá to hoặc còn mơ hồ — kỹ thuật chỉ **phát hiện** vấn đề, không tự giải quyết |
| **Three Amigos** | Có mặt lúc thảo luận, phát biểu quan điểm nghiệp vụ trước khi bất kỳ ai code | 1 buổi ngắn/tính năng | Giảm hiểu-sai vì 3 góc nhìn (nghiệp vụ/dev/test) khớp nhau trước khi code — lập luận định tính, không có % ([Wrike](https://www.wrike.com/agile-guide/faq/what-are-the-three-amigos/), khởi xướng bởi George Dinwiddie 2014, [ministryoftesting.com](https://www.ministryoftesting.com/software-testing-glossary/three-amigos)) | Cần LỊCH của 3 người — chi phí điều phối; bản chất là "3 GÓC NHÌN" chứ không nhất thiết 3 NGƯỜI (điểm này quan trọng cho mục B) |
| **User Story Mapping** (Jeff Patton) | Cùng dựng bản đồ trải nghiệm người dùng trên tường/bảng, thấy toàn cảnh trước khi cắt việc nhỏ | Buổi dài (nửa ngày+), thường 1 lần/dự án hoặc theo mốc lớn | Giá trị nằm ở QUÁ TRÌNH XÂY cùng nhau tạo hiểu chung, hơn là bản đồ kết quả — Patton nói rõ điều này ([O'Reilly](https://www.oreilly.com/library/view/user-story-mapping/9781491904893/), [Agile Alliance](https://agilealliance.org/resources/books/user-story-mapping/)) | Nặng, hợp cho quy hoạch TỔNG THỂ (đúng tầng T/workspace của IF), KHÔNG hợp để chặn hiểu-sai cho từng việc nhỏ hằng ngày |

### B · Cái nào hợp hoàn cảnh 1-người-duyệt

Phần lớn 6 kỹ thuật trên giả định có ≥3 vai người thật. Tìm được đúng 1 nguồn nói thẳng biến thể
solo-với-AI, khớp gần như 100% hoàn cảnh IF:

**"Three Amigos with AI" (testdouble.com, thực chiến với Claude Code)** — lập luận cốt lõi: *"you
wear two hats, the AI wears three"*. Thay vì 3 người, một AI lần lượt đóng 3 vai:
1. **BA Expert Lens** — hỏi về quy tắc nghiệp vụ, ca lỗi, phạm vi trước khi bàn kỹ thuật.
2. **Architect Expert Lens** — đọc code có sẵn, đối chiếu quy ước, tính khả thi.
3. **QA Challenger** — chủ động hỏi ngược theo 8 nhóm câu hỏi đối kháng: đường vui thiếu gì, ca
   lỗi, biên, bảo mật… — và **người dùng trả lời các câu hỏi này TRƯỚC khi code chạy**, không phải
   lúc duyệt PR.

Nguồn: [testdouble.com/insights/three-amigos-with-ai](https://testdouble.com/insights/three-amigos-with-ai-stop-building-the-wrong-thing-faster).
⚠️ Đây là 1 bài blog thực chiến (2025), không phải nghiên cứu học thuật có bình duyệt — độ tin cậy
ở mức "kinh nghiệm ngành ghi lại", không phải "bằng chứng khoa học".

**Vì sao khớp IF:** George Dinwiddie (người khởi xướng Three Amigos) đã nói ba-amigos là "3 GÓC
NHÌN, không nhất thiết 3 người" — AI thay được 2 trong 3 vai (kỹ thuật + phản biện), Hoà giữ đúng
1 vai không thay được: **người duy nhất biết đúng ý đồ nghiệp vụ/gu thiết kế**. Đây khớp với luật
đã có ở `00-CHOT.md`: *"Con người quyết cuối"* (luật vận hành #6) — AI KHÔNG được tự đóng luôn vai
người duyệt, chỉ đóng vai người hỏi-ngược.

**Giới hạn quan trọng phải nói thẳng:** AI đóng vai "QA Challenger" chỉ hỏi được câu hỏi HỢP LÝ về
mặt kỹ thuật (thiếu ca lỗi, thiếu biên) — nó **không thể tự kiểm tra AI có hiểu đúng gu thẩm mỹ/ý
đồ nghiệp vụ của Hoà hay chưa**, vì AI không có "nguồn sự thật độc lập" để đối chiếu như controller
có radar hay bác sĩ có kiến thức y khoa (xem mục C). Đây là lý do mục D (diễn đạt lại) vẫn bắt buộc
— hỏi-ngược và diễn-đạt-lại là HAI lớp khác nhau, không thay nhau được.

### C · Readback / Teach-back — bằng chứng cụ thể

**Hàng không (readback-hearback):**
- Tỷ lệ đọc-lại-sai (readback error) trong giao tiếp phi công–kiểm soát không lưu: **dưới 1%** tổng
  số lượt liên lạc ([FAA report, 200625.pdf](https://www.faa.gov/sites/faa.gov/files/data_research/research/med_humanfacs/oamtechreports/200625.pdf)).
- Kiểm soát viên bắt được trung bình **66%** lỗi đọc-lại sai — nghĩa là **34% lỗi lọt qua** nếu chỉ
  dựa vào cơ chế nghe-lại này; kiểm soát viên en-route bắt tới 90%, nhưng đài kiểm soát sân bay và
  radar tiếp cận chỉ bắt 63% và 50% ([nguồn tổng hợp từ FAA/DTIC, xem WebSearch "readback hearback"]).
- **Ý nghĩa cho IF**: readback KHÔNG phải lưới an toàn tuyệt đối — nó giảm lỗi đáng kể nhưng không
  về 0, và hiệu quả phụ thuộc NGƯỜI NGHE phải chủ động đối chiếu (không chỉ nghe cho có). Áp vào IF:
  Hoà đọc câu AI diễn đạt lại phải THỰC SỰ so với hình dung trong đầu, không chỉ gật cho nhanh —
  đây là rủi ro vận hành thật, không phải lý thuyết (xem mục 4 Đánh giá khách quan).

**Y khoa (teach-back):**
- Giáo dục xuất viện bằng phương pháp teach-back giúp **giảm 45% tái nhập viện trong 30 ngày**
  (một tổng hợp hệ thống trên bệnh nhân suy tim) ([journals.lww.com](https://journals.lww.com/journalpatientsafety/Fulltext/2021/06000/Effectiveness_of_Discharge_Education_With_the.11.aspx)).
- Một nghiên cứu khác (Rahmani 2020) ghi nhận teach-back cải thiện RÕ kiến thức bệnh nhân ngay sau
  buổi giáo dục, nhưng hiệu quả **giảm dần theo thời gian** và KHÔNG có tương quan rõ với giảm tái
  nhập viện trong nghiên cứu đó — tức bằng chứng **không đồng nhất tuyệt đối**, có nghiên cứu ủng hộ
  mạnh, có nghiên cứu ủng hộ yếu ([Wiley — Rahmani 2020](https://onlinelibrary.wiley.com/doi/10.1155/2020/8897881)).

**Cơ chế teach-back là gì, áp vào IF ra sao:** bắt người NHẬN thông tin (bệnh nhân / phi công) diễn
đạt lại bằng LỜI CỦA HỌ, không phải nhắc lại nguyên văn — mục đích là lộ ra chỗ hiểu sai mà nhắc lại
nguyên văn không lộ được. **Đảo ngược trong IF**: người NHẬN chỉ đạo là AI, người GIỮ ý đồ gốc là
Hoà — nên khuôn đúng là **AI diễn đạt lại bằng lời/hình của AI, Hoà xác nhận đúng/sai** — chính là
mục D dưới đây, không phải Hoà phải nhắc lại lời mình đã nói (vô nghĩa).

**Khác biệt cấu trúc quan trọng cần nói thẳng**: readback (hàng không) hoạt động vì HAI bên có thể
độc lập đối chiếu với cùng một sự thật vật lý (radar, độ cao thật). Teach-back (y khoa) hoạt động
vì bác sĩ có kiến thức chuyên môn để PHÁN ĐÚNG/SAI câu bệnh nhân nói lại. **Trong IF, chỉ Hoà có
"sự thật gốc"** (ý đồ trong đầu) — AI diễn đạt lại không tự kiểm tra được đúng/sai, phải dựa hoàn
toàn vào Hoà chấm. Điều này đặt gánh nặng ĐÚNG vào đúng chỗ (Hoà là người duyệt cuối, khớp luật #6
đã chốt) nhưng cũng có nghĩa: **khuôn diễn đạt lại phải đủ RÕ để Hoà chấm nhanh và chấm ĐÚNG**, chứ
không thể mơ hồ như câu chỉ đạo gốc — nếu không sẽ chỉ là "hỏi lại câu hỏi cũ bằng chữ khác", không
thêm giá trị gì. Đây là tiêu chí thiết kế cho mục D.

### D · Ví dụ cụ thể — 3 khuôn diễn đạt lại (PHẦN TRỌNG TÂM)

**Câu chỉ đạo gốc, mơ hồ theo đúng kiểu ngành nội thất:**
> *"bảng vật liệu nên xếp chồng lên nhau, trỏ vô hiện thông tin"*

Câu này mơ hồ ở ít nhất 4 điểm: "xếp chồng" (chồng thẳng đứng như thẻ bài? chồng lệch góc như ảnh
polaroid? chồng đè một phần như masonry?) · "trỏ vô" (hover hay click?) · "hiện thông tin" (hiện ở
đâu — tooltip nổi, panel bên, hay đổi ngay tại thẻ?) · số lượng thẻ hiển thị cùng lúc là bao nhiêu.

---

**Khuôn 1 — Given-When-Then cụ thể hoá bằng số thật (Specification by Example + BDD)**

```
Giả sử (Given):  bảng có 5 mẫu vật liệu — Gỗ sồi, Đá marble, Sơn trắng, Vải lanh, Kính mờ
Khi (When):      Hoà rê chuột vào thẻ "Gỗ sồi" (không cần bấm)
Thì (Then):      thẻ "Gỗ sồi" nổi lên TRÊN CÙNG, hiện tên + mã + giá ngay tại chỗ;
                 4 thẻ còn lại vẫn xếp chồng phía sau, mờ đi 40%
Khi (When):      Hoà rê chuột RA KHỎI thẻ
Thì (Then):      thông tin biến mất, cả 5 thẻ trở về trạng thái xếp chồng ban đầu
```
- **Ưu**: chính xác nhất, bắt được cả hành vi biên (rê ra thì sao — câu gốc không nói tới, khuôn
  này ép AI phải hỏi/giả định và LỘ RA giả định đó cho Hoà thấy).
- **Nhược**: dài, đọc như tài liệu kỹ thuật — với người quen NHÌN hơn quen ĐỌC quy trình (Hoà là
  kiến trúc sư, không phải BA), dễ bị đọc lướt, mất đúng tác dụng "chốt chặn" mà nó nhắm tới.

**Khuôn 2 — So sánh với vật quen thuộc + phản ví dụ loại trừ (đối chiếu UI đã có trong app)**

```
Hoà hiểu "xếp chồng" là kiểu CHỒNG ẢNH POLAROID trên bàn — mỗi thẻ lệch nhau vài độ,
thấy được mép thẻ dưới, KHÔNG phải kiểu "lưới ảnh" (masonry grid) đang có sẵn ở màn
Thư viện hiện tại (components/library/). Đúng ý không, hay là ý khác?
```
- **Ưu**: nhanh, tận dụng đúng vốn từ vựng thị giác của kiến trúc sư (ví von bằng vật thật); ép
  chọn RÕ giữa 2 phương án cụ thể thay vì mô tả trừu tượng — giảm khả năng "cả hai đều gật vì đều
  nghe hợp lý"; tận dụng UI đã có sẵn trong app làm mốc so sánh (không cần dựng gì mới).
- **Nhược**: chỉ dùng được khi ĐÃ CÓ một cái tương tự trong app để đối chiếu (không phải lúc nào
  cũng có); nếu 2 phương án nêu ra đều không đúng ý Hoà, khuôn này không tự lộ ra được phương án
  thứ 3 — cần Hoà tự viết "ý khác" (đúng luật "luôn có ô ý khác cuối" đã chốt 15/08).

**Khuôn 3 — Phác thảo nhanh bằng hình (thấp-fi, không phải code thật)**

```
[Thẻ 3, mờ, lệch phải]
  [Thẻ 2, mờ, lệch trái]
    [Thẻ 1 — đang trỏ chuột, rõ nét]
    ┌──────────────────────┐
    │ Gỗ sồi tự nhiên       │
    │ Mã: WD-042            │
    │ 850.000đ/m²           │
    └──────────────────────┘
```
(bản thật sẽ là 1 ảnh SVG/HTML tĩnh vài giây dựng xong, không phải mã sản phẩm)
- **Ưu**: đúng thế mạnh "duyệt bằng mắt" của Hoà đã ghi trong hồ sơ (feedback_nhin-bang-mat-nguoi-dung-cuoi) —
  mắt đọc hình nhanh hơn đọc chữ nhiều lần; giảm khả năng cả hai bên "tưởng đã hiểu giống nhau"
  vì hình cụ thể không có chỗ trốn mơ hồ như chữ.
- **Nhược**: tốn công dựng hơn 2 khuôn trên (dù rẻ hơn code thật rất nhiều); rủi ro dựng SAI TOKEN/
  kích thước thật khiến Hoà tưởng "đây là bản đã code" chứ không phải "đây là cách AI hiểu ý" — PHẢI
  ghi rõ nhãn "PHÁC THẢO — chưa code" trên hình (đã có tiền lệ luật này ở `00-CHOT.md`: *"vùng tạm
  ghi PLACEHOLDER"*).

---

**Tại sao KHÔNG chọn 1 khuôn duy nhất — nên phối hợp:** Khuôn 2 (so sánh + phản ví dụ) rẻ nhất nên
dùng **mặc định cho mọi việc nhỏ**; khi việc phức tạp có nhiều bước/trạng thái (như ví dụ trên) thì
kèm khuôn 1 (Given-When-Then) để bắt hành vi biên; khi việc thuần thị giác/bố cục (đúng như ví dụ
"xếp chồng, trỏ vô hiện thông tin") thì khuôn 3 (phác thảo) là bắt buộc — chữ không đủ.

### E · Chi phí — tốn bao nhiêu thời gian của Hoà mỗi việc

| Khuôn | AI soạn (không tốn thời gian Hoà) | Hoà đọc/xem | Hoà trả lời | Tổng thời gian Hoà |
|---|---|---|---|---|
| Khuôn 1 — Given-When-Then | ~1-2 phút | ~1-2 phút (đọc văn bản) | 1 câu "đúng/sai + phần nào sai" | **~2-3 phút** |
| Khuôn 2 — So sánh + phản ví dụ | ~30 giây | ~20-30 giây (đọc 2-3 dòng) | 1 chữ "A" hoặc "B" hoặc "ý khác" | **~30-60 giây** |
| Khuôn 3 — Phác thảo hình | ~2-5 phút (dựng SVG/HTML đơn giản) | ~10-30 giây (mắt đọc hình nhanh) | 1 chữ "đúng" hoặc chỉ tay vào chỗ sai | **~15-40 giây** |

**Cảnh báo tương thích với `00-CHOT.md` (luật đã chốt 15/08 "hỏi gộp bằng trắc nghiệm")**: 3 khuôn
trên KHÔNG phải 3 cơ chế hỏi riêng — chúng là NỘI DUNG bên trong mỗi câu trắc nghiệm đã có (tối đa
4 câu/lượt, mỗi câu 2-4 phương án). Nếu tách thành bước hỏi riêng thêm ngoài luật đó, sẽ vi phạm
đúng nguyên nhân Hoà đã nêu khi chốt luật: *"câu hỏi... sang lượt tiếp theo nữa là trôi thông tin"*.
⇒ Khuôn 2/3 phải NẰM TRONG các phương án trắc nghiệm, không phải một vòng hỏi-đáp riêng biệt.

**Rủi ro "khuôn nặng bị bỏ qua"** (đúng cảnh báo Hoà đặt ra trong đề bài): khuôn 1 dài nhất, có khả
năng cao nhất bị Hoà đọc lướt/gật cho nhanh khi bận — đây chính là lỗ hổng mà readback hàng không
gặp phải (34% lỗi lọt qua vì người nghe không đối chiếu thật). ⇒ khuôn 1 chỉ nên dùng cho việc có
RỦI RO CAO (đổi dữ liệu/logic khó lùi), không dùng tràn lan cho việc UI nhỏ — khuôn 2/3 đủ cho phần
lớn việc hằng ngày.

---

## 3 · Tổng kết lại vấn đề

Ngành đã có sẵn công thức giải đúng bài toán "chuyên gia nghiệp vụ không biết code xác nhận yêu cầu
trước khi code" — nhưng công thức gốc giả định **3 người khác vai trò ngồi cùng phòng**. IF chỉ có
1 người + AI, nên phải BIẾN THỂ: AI đóng thay 2 trong 3 vai (kỹ thuật + phản biện, theo mô hình
"Three Amigos with AI"), Hoà giữ đúng vai không thay được — người xác nhận ý đồ gốc. Cơ chế XÁC
NHẬN đúng cho vai trò còn lại của Hoà không phải là "nhắc lại lời mình nói" (vô nghĩa) mà là **AI
diễn đạt lại theo cách Hoà nhìn thấy được là đúng/sai NGAY, không cần đọc kỹ** — mượn đúng tinh
thần teach-back (bên nhận thông tin diễn giải lại bằng lời/hình của mình) đảo chiều lại: AI diễn
giải, Hoà chấm. Ba khuôn cụ thể (Given-When-Then / so sánh-phản ví dụ / phác thảo hình) là ba mức
độ chi tiết khác nhau của đúng một cơ chế, chọn khuôn theo độ rủi ro và bản chất việc (logic/dữ
liệu → khuôn 1; bố cục/thị giác → khuôn 3; việc nhỏ hằng ngày → khuôn 2).

## 4 · Đánh giá khách quan

**Tốt:**
- Có nguồn thực chiến khá khớp hoàn cảnh (Three Amigos with AI) chứ không phải suy diễn hoàn toàn.
- Bằng chứng định lượng thật có ở 2 lĩnh vực xa (hàng không, y khoa) — đủ để lập luận, dù không có
  bằng chứng định lượng TRỰC TIẾP cho "diễn đạt lại người-AI trong lập trình" (lĩnh vực còn quá mới).
- 3 khuôn ở mục D được thiết kế RIÊNG cho gu Hoà (mắt đọc hình nhanh, ví von vật quen thuộc) chứ
  không bê nguyên BDD sách vở — có cân nhắc thực tế công cụ IF đã có (component có sẵn để so sánh).

**Chưa tốt / rủi ro:**
- **Không tìm được số liệu định lượng riêng cho "đọc lại yêu cầu phần mềm bằng người-AI"** — toàn
  bộ số liệu C là suy loại từ 2 ngành khác (hàng không, y khoa), áp dụng có điều chỉnh logic, KHÔNG
  phải bằng chứng trực tiếp. Ghi rõ CHƯA CHẮC ở đây.
- Bài "Three Amigos with AI" là 1 blog thực chiến, không phải nghiên cứu bình duyệt — độ tin cậy
  thấp hơn các kỹ thuật BDD/Example Mapping (đã có 10+ năm thực hành ngành ghi nhận).
- Bản thân cơ chế "AI diễn đạt lại rồi Hoà chấm" **không tự loại trừ được sai lầm hệ thống** — nếu
  AI hiểu sai THEO MỘT KIỂU NHẤT QUÁN (vd luôn hiểu "xếp chồng" theo nghĩa kỹ thuật máy tính quen
  thuộc), thì diễn đạt lại cũng sai theo kiểu đó, và Hoà có thể gật vì câu diễn đạt "nghe hợp lý"
  — đúng rủi ro mà readback hàng không gặp (34% lỗi lọt qua không phải vì cơ chế tồi mà vì người
  nghe không có thời gian/chú ý đối chiếu kỹ mỗi lần).
- Chưa có cách đo HIỆU QUẢ thật của 3 khuôn này khi áp vào IF — đây là đề xuất có cơ sở, chưa phải
  đã kiểm chứng bằng số liệu vận hành thật của IF.

## 5 · Hướng xử lý nhiều góc độ

**Hướng A — Áp khuôn 2 (so sánh + phản ví dụ) làm MẶC ĐỊNH cho mọi việc, khuôn 1/3 chỉ khi cần**
- Ưu: rẻ nhất, khớp thói quen "hỏi gộp trắc nghiệm" đã có sẵn, ít khả năng bị bỏ qua vì bận.
- Nhược: với việc thuần bố cục/thị giác (đúng kiểu câu ví dụ trong đề bài), chỉ dùng chữ có thể vẫn
  không đủ — hai phương án so sánh bằng lời cho một bố cục phức tạp có thể VẪN mơ hồ.

**Hướng B — Bắt buộc khuôn 3 (phác thảo hình) cho MỌI việc chạm giao diện, khuôn 2 chỉ cho việc
thuần logic/dữ liệu không có mặt hình**
- Ưu: đúng thế mạnh "duyệt mắt" của Hoà nhất, giảm mơ hồ mạnh nhất cho đúng loại việc IF làm nhiều
  nhất (UI/thẩm mỹ).
- Nhược: tốn công dựng hình mỗi lần (dù rẻ hơn code thật) — có nguy cơ làm chậm nhịp "chạy một mạch
  không dừng hỏi" mà Hoà đã đặt làm thói quen chuẩn; rủi ro phác thảo tự nó lại vẽ sai token/gu,
  tạo thêm một lớp hiểu-sai mới (hiểu sai trong lúc DIỄN ĐẠT LẠI hiểu sai gốc).

**Hướng C — Phân loại theo RỦI RO/CHI PHÍ LÙI thay vì theo loại việc**: việc dễ lùi (undo được, UI
nhỏ) → không cần chốt chặn thêm, cứ làm rồi duyệt mắt cuối như hiện tại; việc khó lùi (đổi cấu trúc
dữ liệu, đổi hành vi ảnh hưởng nhiều nơi, hoặc việc Hoà đã từng nói "hiểu sai" trước đây) → bắt buộc
1 trong 3 khuôn trước khi code.
- Ưu: khớp đúng luật đã có "Undo Trước Hỏi Sau" (CẤP 1, `00-CHOT.md` 11/08) — không thêm bước cho
  việc rẻ-để-sai, chỉ thêm cho việc đắt-để-sai.
- Nhược: cần AI tự đánh giá đúng "việc này khó lùi hay dễ lùi" — nếu đánh giá sai (coi việc khó lùi
  là dễ lùi) thì lại bỏ sót đúng lúc cần chốt chặn nhất — vòng lặp cũ lặp lại ở cấp meta.

## 6 · Đề xuất hướng tốt nhất

**Chọn Hướng C, cụ thể hoá bằng khuôn D2 làm nền + D3 làm điều kiện bắt buộc cho việc chạm UI/bố
cục, D1 chỉ cho việc chạm dữ liệu/logic khó lùi** — vì ba lý do:

1. **Khớp luật đã tồn tại, không đẻ luật mới chồng lên** — "Undo Trước Hỏi Sau" đã là luật CẤP 1
   trong `00-CHOT.md`; phân loại theo độ khó lùi tận dụng đúng phán đoán AI đã phải làm sẵn cho luật
   đó, không thêm gánh nặng suy luận riêng.
2. **Đúng chi phí-lợi ích đo được ở mục E** — khuôn 2 rẻ (~30-60 giây) nên làm mặc định không sợ
   Hoà bỏ qua; khuôn 3 chỉ tốn thêm khi việc THỰC SỰ về hình/bố cục (đúng nơi chữ không đủ, đúng ví
   dụ đề bài đưa ra); khuôn 1 tốn nhất nên chỉ dùng đúng chỗ rủi ro cao nhất — không tràn lan gây
   mệt mỏi dẫn đến "gật cho nhanh" (đúng bài học 34% lỗi lọt readback vì quá tải).
3. **Vai trò AI không lấn vai người duyệt** — cả 3 khuôn đều dừng ở "AI diễn đạt lại, Hoà chấm",
   không có khuôn nào để AI tự quyết đúng/sai — giữ nguyên luật vận hành #6 (*"con người quyết
   cuối"*) đã chốt từ đầu dự án.

**Việc cần làm tiếp (không thuộc phạm vi bài NC này — RG1 hoặc phiên code sau quyết)**: viết khuôn
mẫu 3 khuôn này thành 1 đoạn hướng dẫn ngắn trong `docs/CLAUDE.md` mục "HỎI GỘP BẰNG TRẮC NGHIỆM",
để mọi phiên sau tự động dùng đúng khuôn khi soạn câu hỏi — không phải quy trình mới, chỉ là NỘI
DUNG bỏ vào khuôn hỏi đã có.

---

## Phụ lục · CHƯA CHẮC / CHƯA KIỂM

- Không tìm được nghiên cứu định lượng riêng cho "hiệu quả diễn-đạt-lại yêu cầu phần mềm giữa người
  không biết code và AI" — mọi suy luận ở mục C là bắc cầu từ 2 ngành khác, chưa có bằng chứng trực
  tiếp trong lĩnh vực lập trình/AI.
- Không tìm được số liệu % giảm lỗi cụ thể cho BDD/Given-When-Then hay Three Amigos (chỉ có lập
  luận định tính từ nguồn ngành, không có khảo sát định lượng công khai).
- Bài "Three Amigos with AI" (testdouble.com) là kinh nghiệm cá nhân 1 tác giả, chưa có xác nhận
  độc lập hay khảo sát diện rộng.
- Chưa thử nghiệm 3 khuôn D1-D2-D3 trong thực tế vận hành IF — đây là đề xuất có cơ sở lý thuyết,
  chưa có số đo thật (đúng luật V phải đếm "lệch · chu kỳ · làm lại" sau khi áp dụng, nếu Hoà chọn
  thi hành).

## Nguồn

- Specification by Example: https://gojko.net/2020/03/17/sbe-10-years.html · https://www.manning.com/books/specification-by-example
- BDD / Given-When-Then: https://medium.com/codex/how-to-use-behaviour-driven-development-bdd-in-acceptance-criteria-a72668e0892f · https://www.accelq.com/blog/bdd-behavior-driven-development/
- Example Mapping: https://medium.com/@mattwynne/introducing-example-mapping-42ccd15f8adf · https://cucumber.io/blog/bdd/example-mapping-introduction/
- Three Amigos: https://www.wrike.com/agile-guide/faq/what-are-the-three-amigos/ · https://www.ministryoftesting.com/software-testing-glossary/three-amigos
- User Story Mapping: https://www.oreilly.com/library/view/user-story-mapping/9781491904893/ · https://agilealliance.org/resources/books/user-story-mapping/
- Readback/hearback hàng không: https://www.faa.gov/sites/faa.gov/files/data_research/research/med_humanfacs/oamtechreports/200625.pdf
- Teach-back y khoa: https://journals.lww.com/journalpatientsafety/Fulltext/2021/06000/Effectiveness_of_Discharge_Education_With_the.11.aspx · https://onlinelibrary.wiley.com/doi/10.1155/2020/8897881
- Three Amigos with AI (solo + AI): https://testdouble.com/insights/three-amigos-with-ai-stop-building-the-wrong-thing-faster
- Rephrase and Respond (LLM tự diễn đạt lại câu hỏi): https://arxiv.org/abs/2311.04205 · https://uclaml.github.io/Rephrase-and-Respond/ (⚠️ nghiên cứu này về AI tự rephrase để tự trả lời đúng hơn, KHÔNG phải về AI rephrase để người xác nhận — liên quan gián tiếp, không trực tiếp)
- Boehm cost-of-change curve (bối cảnh vì sao bắt lỗi sớm rẻ hơn): https://reworkcost.com/boehm-cost-of-change-curve · https://budgetoverrun.com/cost-of-change-curve
- Acceptance Criteria / Definition of Ready: https://www.atlassian.com/work-management/project-management/acceptance-criteria
