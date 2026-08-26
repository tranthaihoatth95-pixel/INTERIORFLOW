# IF · VITALS — PHÂN CẢNH TARGET ↔ REJECT
`W1-10 · IF-VITALS-UX-001` · gói `IDF-IF-PACKET-003` · trạng thái **CANDIDATE**

> **Vitals trong IF = lớp hiển thị TÌNH TRẠNG SỐNG của hệ và của dự án** — trạng thái chặng, tiến
> trình, cảnh báo, số liệu, presence. **Không phải một màn riêng.** Nó là một *lớp* mọc lên ở nhiều
> bề mặt (khẩu độ mép trên · chấm ambient · dòng tín hiệu ở Peek · thẻ số ở Home/Dashboard).
> Nguồn luật: `docs/control/IF-CANONICAL.md` §11 (Vitals) · §4 (mô hình UX) · §14 (Home 5 trạng thái).

> ⚠️ **Không có bằng chứng runtime trong lượt này.** Lane này là lane TÀI LIỆU, không chạy dev
> server, không chụp app thật. Mọi dòng dưới đây là **hợp đồng ngữ nghĩa** rút từ mã đã đọc + luật
> đã ghi. Nhãn verdict theo F-16: `PARTIAL — contract/design proof`, **`NOT ASSESSED` cho mọi bậc
> runtime**. Không dòng nào ở đây được đọc là PASS.

---

## 0 · TRỤC XƯƠNG SỐNG — NĂM TRẠNG THÁI, NĂM CÁCH HIỂN THỊ

Đây là trục quyết định cả gói. Gộp bất kỳ hai ô nào là đẻ ra một lời nói dối bằng giao diện.

| # | trạng thái | nghĩa chính xác | hiển thị (ĐỀ XUẤT `PROPOSED`) | cấm tuyệt đối | neo mã |
|---|---|---|---|---|---|
| **S1** | **KHÔNG CÓ DỮ LIỆU** | đã kiểm, nguồn tồn tại, **không có gì đáng nói** | **IM** — không có dòng nào; ambient ở `idle` | không hiện `0`, không hiện khung rỗng, không hiện "mọi thứ ổn" | `components/studio/vitals-tin-hieu.ts:177-190` (`chonTinHieu` → `[]` là *kết quả đúng*, không phải lỗi cần lấp) |
| **S2** | **ĐANG TẢI** | đã phát yêu cầu, chưa có trả lời | dấu hiệu **đang chạy**, gắn vào đúng ô đang chờ; không chiếm chỗ của số cũ | không dựng số giả để "giữ chỗ"; không nhấp nháy | `components/studio/VitalsStateBadge.tsx:29` (`VitalsState` có `answering`) · `vitals-tin-hieu.ts:198-201` (`dang-chay` → `answering`) |
| **S3** | **TẢI HỎNG / KHÔNG ĐO ĐƯỢC** | đã thử, **thất bại hoặc bị bỏ qua** | trạng thái **KHÔNG BIẾT** tường minh, có cách thử lại | ⛔ **không bao giờ** ánh xạ thành `calm`/`idle`/`0` | `vitals-tin-hieu.ts:21-26` (`undefined` = chưa/không đo được) · `VitalsAperture.tsx:91-110` (`doQuyChuan()` trả `undefined` khi bộ kiểm ném lỗi, **không bịa 0**) |
| **S4** | **KHÔNG CÓ QUYỀN** | người này **không được phép biết** | ô **không tồn tại** trong bố cục (không render), hoặc nói rõ "cần quyền" khi che giấu sự tồn tại là vô nghĩa | không render rồi che bằng CSS; không hiện số rồi báo 403 khi bấm | `lib/server/access.ts:31` (404 thay 403 — *không tiết lộ dự án có tồn tại*) · `components/collab/PresenceBar.tsx:16-19` (nút Mời **ẩn hẳn** khi không `canManage`, không hiện rồi 403) |
| **S5** | **BẰNG KHÔNG** | đã đo, kết quả **thật sự là 0** | chỉ hiện khi con số 0 **có nghĩa cho người dùng ngay lúc đó**; mặc định là IM | không dùng `0` làm bằng chứng "sạch"/"đạt chuẩn" | `vitals-tin-hieu.ts:24-26` (*"0 vi phạm" ≠ "đạt chuẩn"*) · `:155-164` (`chuanCanXem === 0` ⇒ **không ra dòng**) |

**Máy canh đã có cho trục này:** `vitals-tin-hieu.ts:129` (`dia-diem`: `undefined` và `0` đều im
nhưng **giữ phân biệt ở KIỂU để không ai gộp thành `?? 0`**) · `:157` (`chuan-ve`: kiểm
`typeof !== 'number'` **trước** khi kiểm `> 0`).

**Lỗ đã biết trên trục này (chưa vá, ghi để không mất):** F-02 trong
`docs/design-campaign/02-FAILURE-LEDGER.md` — với `site` và `projects` cùng 401, khẩu độ Vitals
từng hiện `calm`. Trạng thái ghi **FAIL, open**. Đó chính là S3 bị ánh xạ nhầm vào S1.

---

## 1 · BẢNG PHÂN CẢNH

| # | cảnh (khoảnh khắc người dùng) | TARGET — điều phải xảy ra | REJECT — điều bị cấm, kèm LÝ DO đã trả giá | nguồn |
|---|---|---|---|---|
| **C-01** | **Mở app lần đầu, kho rỗng** — chưa dự án, chưa tệp, chưa việc | Vitals **có mặt nhưng im**: chấm ambient ở `idle`, không dòng tín hiệu nào. Sự hiện diện của Vitals là thứ duy nhất nó khẳng định. Người dùng thấy **một hành động vào chính**, không phải bảng số | ⛔ Bày `0 dự án · 0 việc · 0 cảnh báo`. **Lý do:** `IF-CANONICAL.md` §14 cấm bày `0` · `—` · thẻ rỗng · dữ liệu giả trên Home; M-13 (`IF-UXUI-OPERATING-MEMORY.md`) — *"kho thật gần rỗng là trạng thái THẬT, một màn trống tử tế hơn hẳn một màn đầy số bịa"*. ⛔ Bày một vòng tròn/nhịp thở để chứng minh Vitals tồn tại — §11 cấm nguyên văn | `IF-CANONICAL.md` §11 · §14 (trạng thái A) · `vitals-tin-hieu.ts:179-181` |
| **C-02** | **Dự án đang chạy bình thường** — người dùng làm việc, không có gì hỏng | Vitals **lùi ra**. Ambient `idle`, thở chậm. Không dòng nào. Nội dung là nhân vật chính | ⛔ Hiện thẻ "Tình trạng: Tốt" / "Hệ thống bình thường". **Lý do:** F-02 — `calm` là một **KHẲNG ĐỊNH** (*"đã kiểm, không có gì đáng lo"*), không phải sự im lặng; một trạng thái "khoẻ" vẫn là một lời khai và phải kiểm tiền đề của nó. Và M-10: *"một phần tử không xứng đáng tồn tại chỉ vì có dữ liệu hoặc có chỗ trống"* | `02-FAILURE-LEDGER.md` F-02 · M-10 · `vitals-tin-hieu.ts:6-8` |
| **C-03** | **Một chặng bị chặn** — không đi tiếp được vì thiếu tiền đề (chưa có bản vẽ, chưa có hiện trạng, hồ sơ thiếu mục) | Nói **CÁI GÌ chặn · VÌ SAO · LÀM GÌ TIẾP**, và cho sửa **TẠI CHỖ**. `ProjectScopeEmptyState` đã phân biệt đúng hai ca: `empty-project` (dự án thật, chưa có bản vẽ ⇒ tạo/nhận ngay tại chỗ) ↔ `unknown` (đường dẫn hỏng ⇒ chỉ còn điều hướng đi) | ⛔ Canvas trắng không lý do. **Lý do đã đo:** `ProjectScopeEmptyState.tsx:5-9` — `useProjectScopeSync` trả `status='missing'` nhưng **không page nào đọc nó**, ba màn cứ render, *"vào bằng URL rỗng thấy canvas trắng không lý do"*. ⛔ Đá người dùng *"sang chặng khác rồi quay lại"* — vi phạm luật X2 ghi ngay tại `:13` | `components/studio/ProjectScopeEmptyState.tsx:5-19` · `IF-CANONICAL.md` §3 (tám câu: *"cái gì cần tôi?"*, *"tôi làm được gì tiếp?"*) |
| **C-04** | **Máy đang chạy tác vụ dài** — render / import / ingest, hàng phút | Tín hiệu `dang-chay` mang **SỐ THẬT** + nhãn lượt chạy nếu nguồn có; ambient chuyển `answering` (nhịp nhanh). Tín hiệu này **đứng đầu thứ tự ưu tiên** vì nó nói về việc CÒN ĐANG DIỄN RA — người dùng có thể phải chờ | ⛔ Thanh tiến trình đoán mò/chạy giả khi nguồn không cho biết phần trăm. **Lý do:** `IF-CANONICAL.md` §3 luật 5 — *"không tiến độ giả"*. ⛔ Bịa `chiTiet` khi lượt chạy không có nhãn: `vitals-tin-hieu.ts:147-148` chỉ kèm khi *"nguồn thật sự có nhãn; chuỗi rỗng cũng coi như không có"* | `vitals-tin-hieu.ts:120-123` (`THU_TU`) · `:140-150` · `:199` |
| **C-05** | **Tác vụ thất bại** — lượt chạy dừng giữa chừng | Tín hiệu `chay-loi` với số thật; ambient sang `alert`; câu **VÌ SAO** là hằng số theo loại: *"Lượt chạy dừng giữa chừng."* — nói cơ chế, không phán xét. Người dùng có đường đi tới chỗ xử lý | ⛔ Nuốt lỗi im lặng. **Lý do:** F-10 — `void fetch(...)` tới `/api/home/notes` trả 401, UI **không nói gì**, *"câu người dùng vừa gõ biến mất trong khi họ tin là đã lưu"*; luật đã sửa: *"mất im lặng tệ hơn lỗi hiện ra — người dùng bỏ đi"*. ⛔ Để AI viết câu giải thích: `vitals-tin-hieu.ts:61-66` cố ý làm `viSao` **HẰNG SỐ theo loại**, *"không có cửa nào cho một câu AI sinh lọt vào"* | `02-FAILURE-LEDGER.md` F-10 · `vitals-tin-hieu.ts:78-84` · `:151-153` · `:200` |
| **C-06** | **Dữ liệu CŨ / stale** — sự thật địa điểm đổi, các phân tích suy ra từ nó không còn khớp | Hiện **số mục cần tính lại** đếm thật từ `HoSoDiaDiem.daCu`, kèm **miền nào** bị ảnh hưởng, và đi tới **đúng miền** đó chứ không phải một trang chung. Câu VÌ SAO: *"Sự thật địa điểm đã đổi, phân tích suy ra từ nó không còn khớp."* | ⛔ Vừa cũ vừa hiện như mới (không dấu hiệu). ⛔ Xoá sạch dấu cũ khi chỉ một miền được cập nhật — test đã khoá: cập nhật `nang` thì `van-hoa`/`thu-cong` **VẪN cũ** vì chúng cũ **vì lý do khác**. ⛔ Suy "cũ" từ state giao diện: `vitals-tin-hieu.ts:101` — *"con số này PHẢI đến từ trạng thái miền đã ghi xuống hồ sơ — cấm suy từ state giao diện"* | `lib/site/vitals-site.ts:5` · `:43-62` · `lib/site/vitals-site.test.ts:29-34` · `vitals-tin-hieu.ts:98-109` |
| **C-07** | **Quyền không đủ** — người này là viewer, hoặc không phải member của dự án | **Kiểm quyền TRƯỚC khi tải.** Ô không đủ quyền **không được render**. Khi phải ẩn cả sự tồn tại: trả 404 chứ không 403. Điều khiển không dùng được thì **ẩn hẳn**, không hiện rồi báo lỗi | ⛔ Tải ảnh/tên/số rồi che bằng CSS hoặc `disabled`. **Lý do đã đo:** M-03 — lý do nút mờ nằm trong `title` ⇒ *"câm trên cảm ứng, Tab bỏ qua nút `disabled`"* ⇒ **không bao giờ tới được ai**. ⛔ Đếm thứ người dùng không được thấy rồi hiện tổng: `app/api/library/route.ts:7` ghi thẳng *"GET trả tất cả asset của mọi user"* — một thẻ Vitals đếm từ nguồn này là **rò rỉ đội lốt số liệu** | `lib/server/access.ts:29-56` · `components/collab/PresenceBar.tsx:16-19` · `app/api/library/route.ts:7` · M-03 |
| **C-08** | **Nhiều người cùng online** | Phân biệt **ba khái niệm khác nhau, không gộp**: đang hoạt động trên canvas (cursor sống, poll ~900ms, server prune sau 6s) ↔ có quyền vào dự án (roster, đổi chậm) ↔ được giao việc. Vitals hiển thị **presence là presence**, không suy ra "đang làm việc chăm chỉ" | ⛔ Gộp cursor và roster thành một danh sách "online". **Lý do:** `PresenceBar.tsx:8-14` tách hai nguồn và **cảnh báo ngay trong docstring** *"đọc kỹ trước khi sửa, đừng gộp nhầm"*; gộp thì người vừa đóng máy vẫn "online" 6 giây, và người có quyền mà chưa mở app thành "offline" theo một nghĩa khác hẳn. ⛔ Coi presence = membership = assignment — `01-IF-CORE-GAP-MAP.md` C10 ghi hợp đồng thiếu đúng câu này | `components/collab/PresenceBar.tsx:8-14` · `:29-42` · `01-IF-CORE-GAP-MAP.md` hàng C10 |
| **C-09** | **Số liệu BẰNG KHÔNG** — đã đo, bộ kiểm quy chuẩn không thấy mục nào | **IM.** Không ra dòng nào. Con số 0 chỉ được hiện ở nơi người dùng **chủ động đi tìm** một phép đo (bảng kiểm, panel review), không ở lớp Vitals | ⛔ Hiện *"0 lỗi"* / *"Bản vẽ không có lỗi"*. **Lý do:** `vitals-tin-hieu.ts:24-26` — nhập `0` với `undefined` *"là mở đường cho câu 'bản vẽ không có lỗi', thứ `violationsPromptBlock` đã cấm bằng chữ vì **'0 vi phạm' ≠ 'đạt chuẩn'**"*. Bộ kiểm chỉ phủ những gì nó kiểm | `vitals-tin-hieu.ts:21-26` · `:155-164` |
| **C-10** | **Số liệu CHƯA TẢI ĐƯỢC** — cùng ô đó, nhưng bộ kiểm bị bỏ qua (bản vẽ quá nặng) hoặc ném lỗi | Trạng thái **KHÔNG BIẾT** — khác hẳn C-09 dù cả hai đều không hiện số. Ở lớp kiểu: `undefined`, không phải `0`. Nếu bề mặt buộc phải nói gì đó, nói *"chưa đo được"* + cách thử lại, **không** nói *"sạch"* | ⛔ `?? 0`. **Lý do:** đây đúng là chỗ F-02 đã nổ (401 → `calm`) và là lỗi mà `vitals-tin-hieu.ts:127-128` cố ý giữ ở **kiểu** để chặn: *"giữ phân biệt đó ở kiểu để không ai gộp thành `?? 0`"*. ⛔ Dùng cùng một pixel cho C-09 và C-10 rồi tin rằng ngữ cảnh sẽ phân biệt hộ | `VitalsAperture.tsx:91-110` · `vitals-tin-hieu.ts:127-129` · F-02 |
| **C-11** | **Cảnh báo tiền / credit** — nguồn AI miễn phí hết lượt | Nói **hết lượt ở NGUỒN NÀO**, còn đường nào khác (local / oneAI), và **không giả trả lời**. Lỗi có kiểu riêng `NvidiaFreeExhausted`, đi thẳng lên route thành 429 | ⛔ Im lặng rơi về một mô hình khác rồi trình kết quả như thể vẫn là mô hình người dùng chọn. **Lý do:** `IF-CANONICAL.md` §8 — *"AI KHÔNG BAO GIỜ âm thầm biến đổi sự thật canonical"*; và F-10 (mất im lặng tệ hơn lỗi hiện ra). ⛔ Hiện một con số tiền **ước lượng** như thể đã đo. **NOT ASSESSED:** `grep "429" components app --include=*.tsx` không trả về bề mặt UI nào ⇒ **chưa có nơi nào hiển thị 429 cho người dùng**; ai xây phải xây mới, không có khuôn để tái dùng | `lib/ai/providers/nvidia.ts:6,19` · `lib/ai/text-tier.ts:45,80` · `01-IF-CORE-GAP-MAP.md` hàng C11 (*"chưa có queue/cancel/cost thống nhất"*) |
| **C-12** | **Dự án vừa tạo** — có danh tính, chưa có nội dung | Vitals nói **việc kế tiếp**, không nói số liệu. Đây là S1 (không có dữ liệu) ở phạm vi dự án — im về số, rõ về hành động. `empty-project` sửa được **tại chỗ** | ⛔ Bày khung tiến độ `0/12 chặng` hoặc dàn thẻ rỗng chờ nội dung. **Lý do:** M-12 — `WidgetCard` để `h-full` + cỡ ô là hằng số ⇒ *"vỏ trắng kéo giãn cho bằng khung, ruột thật chỉ 136px"*; luật: **widget thiếu dữ liệu phải TỰ ẨN**, ô co theo nội dung. Và M-34 — dữ liệu fixture (`21/21` · `19 Bản nháp`) *"không được định nghĩa giao diện sản xuất"* | M-12 · M-34 · `ProjectScopeEmptyState.tsx:13-17` |
| **C-13** | **Người được mời lần đầu** vào dự án của người khác | Người mới thấy **đúng phạm vi của mình** ngay từ lượt tải đầu, không nhấp nháy từ "thấy tất" sang "thấy phần mình". Vitals của họ tính trên tập đã lọc quyền | ⛔ Tải toàn bộ rồi lọc ở client. **Lý do đã đo:** `lib/server/access.ts:77-89` — bản cũ của `visibleProjectIds()` lệch ngữ nghĩa với `assertProjectAccess()` ở **ba** điểm và có **0 nơi gọi**, nên chỗ lệch chưa bao giờ nổ; docstring kết luận bật nguyên trạng *"nguy hiểm hơn không lọc gì, vì nó **trông như** đã lọc"*. ⛔ Coi member là owner: `resolveProject.ts` chặn theo **owner** ⇒ **loại nhầm member** (ghi ở GAP-MAP C4) | `lib/server/access.ts:76-89` · `01-IF-CORE-GAP-MAP.md` hàng C4 |
| **C-14** | **Vitals bị gọi mà không có gì để nói** — người dùng chủ động mở khẩu độ | Mở ra và **thành thật rỗng**: khẩu độ vẫn mở (người dùng đã ra cử chỉ, phải có phản hồi), nhưng nội dung là sự vắng mặt có chủ ý, không phải chỗ trống chờ lấp | ⛔ Lấp bằng "gợi ý AI" hoặc mẹo dùng app. **Lý do:** `vitals-tin-hieu.ts:17-19` — *"KHÔNG có 'insight AI' ở đây, và **cố ý không có chỗ để cắm vào**: mọi trường đầu vào đều là SỐ ĐẾM"*. ⛔ Tự bung khi có tin: `VitalsAperture.tsx:33-35` — *"Khẩu độ này KHÔNG BAO GIỜ tự bung… Tự bung là biến nó thành toast"* | `vitals-tin-hieu.ts:17-19` · `VitalsAperture.tsx:33-35` |
| **C-15** | **Người dùng bật giảm chuyển động** ở bất kỳ cảnh nào trên | Mọi phân biệt trạng thái vẫn **đọc được ở KHUNG TĨNH** — bằng độ sáng/hình khối, không phụ thuộc chuyển động và không phụ thuộc màu. Thời lượng về **0ms (hiện thẳng)**, không phải "chậm lại" | ⛔ Để trạng thái chỉ phân biệt bằng animation. **Lý do:** `VitalsStateBadge.tsx:23-26` khai đúng vế này (*"4 trạng thái vẫn phân biệt được ở KHUNG TĨNH"*) — nhưng khai không phải là chứng minh, xem NOT ASSESSED bên dưới. ⛔ Tự kiểm `matchMedia` rồi chế nhánh riêng tại chỗ: `lib/ui/nhip.ts:96-99` — *"đây là chỗ duy nhất quyết định, nơi gọi không được tự kiểm rồi tự chế nhánh riêng"* | `lib/ui/nhip.ts:90-99` · `VitalsStateBadge.tsx:23-26` · `Vitals.dc.html:28-31` (`@media (prefers-reduced-motion: reduce)` trong bản canvas) |

---

## 2 · BỐN CÁI BẪY LẶP LẠI — nhận ra bằng MẮT, không bằng chữ

M-11 dạy bài đắt nhất: *biết luật bằng chữ ≠ nhận ra vi phạm bằng mắt*. Bốn dấu hiệu dưới đây là
cách đối chiếu nhanh một bản dựng Vitals với luật, không cần đọc lại cả tệp.

1. **Có một con số nào trên màn mà bạn không chỉ được nguồn đo?** ⇒ nó là fixture (M-34).
2. **Có ô nào giữ nguyên kích thước khi rỗng?** ⇒ vỏ kéo giãn, ruột 136px (M-12).
3. **Có trạng thái "tốt/ổn/sạch" nào không kèm được câu *đã kiểm cái gì*?** ⇒ calm giả (F-02, M-07).
4. **Có chỗ nào `0` và "không đo được" trông giống nhau?** ⇒ trục S1–S5 đã sập.

---

## 3 · NHỮNG CHỖ PHẢI GHI `NOT ASSESSED`

| chỗ | vì sao chưa đánh giá được |
|---|---|
| Toàn bộ bậc **runtime** của mọi cảnh C-01…C-15 | Lane tài liệu, không chạy dev server, không ảnh app thật. Theo `IF-CANONICAL.md` §7 (*"thiếu mắt là chưa xong"*) và F-16 (*"nhãn verdict phải mang theo bề mặt đã chạm"*) ⇒ trần cứng của gói này là `PARTIAL — contract/design proof` |
| Trạng thái Vitals hiện **có tới được người dùng ở mọi màn** hay không | `VitalsAperture.tsx:20-28` ghi rằng `VitalsGesture.tsx` **đã mồ côi** và chip "Vitals" ở `StatusBar.tsx` gọi `openVitals()` tới một panel không còn mount ⇒ *"bấm vào không ra gì"*. Tôi **không xác minh lại** khẳng định này trong lượt này (nó là docstring, tức là một lời khai — đúng M-03/M-11 thì lời khai phải được đo). Cần một lượt grep + runtime riêng |
| `prefers-reduced-motion` có thật sự giữ được phân biệt 5 trạng thái ở khung tĩnh không | Chỉ đọc được **lời khai** ở `VitalsStateBadge.tsx:23-26` và CSS ở `app/globals.css:1384-1427`. Chưa chụp khung tĩnh nào để đối chiếu. F-14 đúng họ này: *cơ chế chứng minh phải với tới được thứ nó nhận là đang chứng minh* |
| Bề mặt UI cho **credit/429** | `grep "429" --include=*.tsx components app` chỉ trả về một `path` SVG không liên quan (`components/entry/LoginForm.tsx:576`) ⇒ **không có bề mặt UI nào**. Đây là khẳng định phủ định nên kèm nguyên văn phép đo theo M-55 |
| Luồng **mời người mới** ngoài `PresenceBar` | `grep -l "invite\|Mời" --include=*.tsx components app` chỉ trả `components/collab/PresenceBar.tsx`. Và chính docstring `:16-19` khai *"KHÔNG có hạ tầng email-invite trong repo"*. Cảnh C-13 vì thế mô tả **hợp đồng đích**, không mô tả thứ đang chạy |
| Trạng thái hiện tại của **F-02 (calm giả)** | Ledger ghi `FAIL, open`. Tôi **không** kiểm lại xem nó đã được vá chưa — cần chạm route thật với 401 |
| `Vitals.dc.html` có phải bản canonical **đang hiệu lực** không | Tệp nằm ở gốc repo, không nằm trong `docs/mocks/`, và tôi chưa đối chiếu với `docs/mocks/CLAUDE-DESIGN-CURRENT.md`. Theo M-57 (đóng dấu superseded là HAI việc) thì **chỉ mục mới là con trỏ chính thức**, không phải tệp. Dùng nó làm tham chiếu hình thái, **không** dùng làm target |

---

## 4 · THẨM QUYỀN

Gói này chốt **TRẠNG THÁI và NGỮ NGHĨA** — cái gì được hiện, khi nào, mang nghĩa gì, và cái gì
tuyệt đối không được hiện.

**Mắt và chuyển động cuối cùng là quyền của Hoà. Không agent nào thay.**

Mọi giá trị thẩm mỹ xuất hiện trong tài liệu này — hình thái khẩu độ, cách chấm ambient biểu đạt,
màu cảnh báo, nhịp thở, bố trí dòng tín hiệu — là **ĐỀ XUẤT**, đánh dấu `PROPOSED`, **chờ Hoà
duyệt**. Chúng không có hiệu lực chỉ vì đã được viết ra ở đây.

Chiếu theo `IF-CANONICAL.md` §2: **Claude Design** giữ thẩm quyền bố cục người dùng nhìn thấy ·
**MAIN** thi công · **chỉ Hoà** được nâng `CANDIDATE → APPROVED`. Gói này đang ở **CANDIDATE**.
