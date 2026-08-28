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
