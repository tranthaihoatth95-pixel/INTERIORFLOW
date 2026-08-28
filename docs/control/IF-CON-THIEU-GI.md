# IF còn thiếu gì · cái gì đang chờ Hoà

> Chưng cất **một lần** 28/08 từ ba kho: repo · 109 phiên chat · phép đo trực tiếp.
> Hoà: *"đằng nào chả tốn — tốn sao cho khôn thì dựa vào các bạn khai thác khôn thôi."*
> Khôn = **tra có mục tiêu rồi cất vĩnh viễn**, không đánh thức 109 phiên.
>
> Cột **nguồn** nói rõ: `ĐO` = tôi tự chạy và thấy · `PHIÊN` = trích từ bản ghi chat, **chưa
> xác minh lại**. Đừng lẫn hai loại — lẫn là lớp lỗi C.

## 1 · Gốc bệnh — một câu

**IF chỉ dựng được từ dữ liệu do chính IF vẽ ra.** Bản vẽ nghề vào → gần như không ra gì.
Đo: `03_TANG5B-TTT.dxf` **12.274 đối tượng → 1 khối sàn**.
Chi tiết + cách chữa trung tính: `docs/control/IF-VI-SAO-CHUA-SHIP.md`.

⚠️ **Bệnh này đã bị nhìn thấy 07/08 và 15/08** rồi trôi — hai phiên đã mở đúng hai tệp đó, một
phiên đã ghi *"poché tường 126–161 mảng/file không neo vào cấu kiện"*. `PHIÊN`

## 2 · Đã xây xong nhưng chưa dùng được

| Thứ | Trạng thái thật | Nguồn |
|---|---|---|
| **14 hàm dựng khối 3D** (bevel · chamfer · array · mirror) | đã nối vào UI (`Object3DInspector`, `Command3DPanel`) nhưng **`ops[]` KHÔNG lưu vào `.idf`** ⇒ vát cạnh xong, lưu, **mở lại là mất** | `ĐO` — 14 hàm ở `build-ops.ts`, 0 chỗ `ops` trong `idf.ts` |
| **`geom3d.heightMm` của `.idfc`** | 3 nơi ghi · **0 nơi đọc** — chiều cao cấu kiện tự khai không tới được cảnh 3D | `ĐO` |
| **Đường `.idfc → 3D`** | mã có, **cổng G1–G7 chặn** thi công (`IF-DEC-IDFC-3D-001-v0.2`) | `ĐO` |
| **Nhập DWG trực tiếp** | mã còn nguyên, **cờ TẮT** vì GPL trong bộ cài | `ĐO` |

## 3 · Chưa có — nói thẳng

· **Gỡ mã GPL khỏi artifact** — cờ tắt **không** gỡ 19,1 MB khỏi bộ cài. Cổng đã chặn `electron:build*`. `ĐO`
· **Nguyên nhân cú kẹt L2-01** — 6,2 triệu lượt/45 phút, **không tái hiện được**. Còn bậc cuối: đo trên `next start` có phiên đăng nhập. `ĐO`
· **Ảnh runtime sau đăng nhập** — mọi thay đổi giao diện hôm nay đều `NOT ASSESSED` vì chưa ai mở app ra nhìn. `ĐO`
· **Nguồn dự án cho Home** — repo **không có** route liệt kê dự án; dự án chưa có bản vẽ thì Home không thấy. `ĐO`
· **Bridge Codex ↔ Claude** — chưa xây; nên Hoà vẫn phải dán tin bằng tay. `ĐO`

## 4 · 🔴 ĐANG CHỜ HOÀ — và chỉ Hoà quyết được

Luật: mỗi mục phải kèm **mặc định nếu Hoà im lặng** và **đường lùi**. Thiếu hai thứ đó thì không
được phép đặt lên bàn của Hoà (xem `AI-LA-AI-CHU-LA-GI.md` §2).

| # | Quyết định | Vì sao chỉ Hoà | Mặc định nếu im lặng |
|---|---|---|---|
| ① | **Một tệp DXF thật** để chạy đường nghề đầu tiên | không phải quyết định — chỉ cần **một tệp** | ⚠️ đứng yên, không có gì thay thế được |
| ② | Ghi vào `~/PROJECT/SHARED` + `NOW.md` được không | không gian riêng, có `PRIVATE/` | **không ghi**; đưa nội dung ra để Hoà tự dán |
| ③ | Ký số hay chấp nhận bản chưa ký | tiền · pháp lý | chưa ký, không phát hành cho ai |
| ④ | Quyền chụp màn hình Electron | quyền máy | không có ảnh Electron ⇒ giữ `NOT ASSESSED` |
| ⑤ | 23 ảnh runtime khách (`docs/audit-2026-08-18/anh`) — `IF-DEC-001` cấm sửa `.gitignore`, mà luật thư mục 28/08 đòi mọi thư mục phải có người quyết. **Xung đột luật thật** | dữ liệu khách · riêng tư | **để nguyên**, không tracked không ignored — và `soi:thu-muc` sẽ kêu mãi cho tới khi có người quyết |
| ⑥ | Tắt các lane Codex đứng sẵn | tiền của Hoà | giữ nguyên; tôi không tự tắt gì |
| ⑦ | Ngưỡng "tỉ lệ sống sót" bao nhiêu là **đạt** khi nhập bản vẽ | phán đoán **nghề**, không phải kỹ thuật | chưa đặt ngưỡng ⇒ chỉ báo cáo con số, không tự gọi đạt/không đạt |

### Còn treo từ các phiên cũ — `PHIÊN`, chưa xác minh lại

Mười phiên có mục *"chờ Hoà quyết"* rải từ 08/08 tới 22/08. Đáng chú ý nhất:
một phiên (`Lane 4 · IDFC`) có **9 câu hỏi kiến trúc** chờ Hoà; một phiên có *"duyệt mắt lô 24 ảnh"*;
`VitalsGesturePanel` *"chờ Hoà quyết cửa mới trước khi động"*.

⚠️ **Chưa xác minh cái nào còn sống.** Nhiều cái có thể đã tự giải. Tra bằng:
`mcp__ccd_session_mgmt__search_session_transcripts "chờ Hoà quyết"`.

## 5 · Cách dùng tệp này

Trả lời xong một mục → **xoá dòng đó**, ghi kết quả vào `IF-HOI-DAP.md`. Tệp này phải **ngắn dần**.
Nó dài ra là dấu hiệu đang tích nợ, không phải đang làm việc.

---

# ĐỐI CHIẾU VỚI HIẾN PHÁP — làm sau, và nó đổi cả phạm vi bảng trên

> Hoà 28/08: *"đối chiếu với mong muốn kỳ vọng và mục đích giao việc của tôi chưa? dựa trên tầm
> nhìn IF/IDF để xem chưa? cứ hỏi mà chưa tra thì hỏi làm gì?"*
>
> **Chưa.** Bảng phía trên viết từ phép đo **của tôi**, không từ **kỳ vọng của Hoà**. Giữ nguyên
> làm dấu vết, vì cách nó sai chính là bài học.

## Điều đáng xấu hổ nhất

`docs/IF-KIEN-TRUC-OS.md` §7 (Hoà chốt **18/08**) giao đúng một việc, nguyên văn:

> *"Đối chiếu 4 lớp lõi với hiện trạng — **dựng bảng "còn thiếu gì" chi tiết**"*

Tôi vừa dựng bảng đó **từ đầu**, không biết việc đã được giao và **§6 đã có bản đầu**.
Đúng bệnh N8 — *đề xuất lại thứ đã có*. Tôi đưa tệp này lên hàng **0a** của bộ nạp sáng nay rồi
**chính tôi không đọc nó**.

## Sáu việc §7 giao — sau 10 ngày: **0/6**

| Việc hiến pháp giao 18/08 | 28/08 | Đo |
|---|---|---|
| Thiết kế **AI Gateway** (6 lệnh) | ❌ chưa có | `lib/gateway/` là cổng **định dạng tệp**, tên trùng, không phải AI Gateway |
| Refactor mọi chỗ gọi thẳng provider | ❌ | **3 tệp** còn gọi thẳng |
| `PrivacyMode` enum + UI | ❌ | **0 tệp** trong toàn repo |
| Schema thiếu: `Phase` · Research · Moodboard · Tender · Handover · Community | ❌ | `model Phase` = **0** |
| Dựng bảng "còn thiếu gì" | 🟡 làm hôm nay, **không biết đã được giao** | — |
| Nạp memory hiến pháp | ❌ | tệp không nằm trong bộ nạp cho tới 28/08 |

Năm rủi ro §6 Hoà tự đo 18/08 — **cả năm còn nguyên** sau 10 ngày. Trong khoảng đó: **1.677 commit**
đi chỗ khác.

## 🔴 Phát hiện lớn nhất — hiến pháp cũng là bản mô tả cách LÀM VIỆC VỚI HOÀ, và chưa phiên nào áp cho chính mình

§ *"Cấm agent chạy một mạch (black box)"* viết cho **sản phẩm**: AI không được nhận brief rồi biến
mất rồi trả *"xong"*. Phải là

```
BRIEF → [1] Hiểu → 👁 xem ✎ sửa ✓ duyệt → [2] Nghiên cứu → 👁 xem nguồn …
```

và § **CONTROL POINTS** cho người dùng đặt mức tự do **từng giai đoạn**
(`Assist · Collaborate · Delegate · Autopilot`), và § **WHY THIS?** buộc mọi đề xuất phải khai
căn cứ kèm nút *Change reasoning*.

**Ba điều đó mô tả chính xác thứ Hoà phàn nàn suốt ngày 28/08** — chạy không kiểm soát, không cho
nhìn, không khai căn cứ. Chúng **đã nằm trong hiến pháp của chính Hoà từ 18/08**.

Không phiên nào đọc chúng như **luật cho hành vi của chính mình**; mọi phiên đọc chúng như đặc tả
tính năng cho một ngày nào đó. Kể cả hôm nay: tôi đóng **24 commit chạy một mạch**, trả báo cáo ở
cuối — đúng thứ ô vuông ❌ trong hiến pháp.

⇒ **Luật rút ra:** hiến pháp IF là **hợp đồng hai chiều**. Điều gì IF phải làm cho người dùng thì
agent phải làm cho Hoà **trước**, vì Hoà là người dùng đầu tiên và đang trả tiền để kiểm nghiệm nó.

Cụ thể, áp ngay:
· **Mỗi lát việc phải dừng ở checkpoint có 👁 xem được**, không dồn báo cáo cuối.
· **Hoà đặt mức tự do từng loại việc**, không mặc định Autopilot cho tất cả. Mặc định nếu Hoà im:
  `Collaborate` cho việc chạm bề mặt người dùng · `Delegate` cho hạ tầng và phép đo.
· **Mọi đề xuất kèm "vì sao"** — căn cứ lấy từ đâu, đo ở đâu, và nút đổi lập luận là một câu của Hoà.

## Bảng trên phải đọc lại thế nào

Bảng "còn thiếu gì" phía trên **đúng nhưng nhỏ**: nó liệt kê lỗ **thi công**. Lỗ **hiến pháp**
(Gateway · Privacy · Phase · Community · workflow ngành thiếu 4 chặng) **lớn hơn nhiều** và không
mục nào trong đó xuất hiện ở bảng ấy — vì tôi đo mã, không đọc kỳ vọng.
