# LICENSE-NOTES — dependency GPL trong tính năng "Mở DWG"

> ⚠️ File này KHÔNG phải tư vấn pháp lý. Người viết là engineer, không phải luật sư. Mục đích:
> ghi lại RÕ RÀNG dependency nào mang giấy phép copyleft, đã làm gì để giảm rủi ro, và việc gì
> CẦN người có thẩm quyền pháp lý xác nhận trước khi dùng cho khách hàng thật.

## Dependency GPL: `@mlightcad/libredwg-web`

- **Gói**: `@mlightcad/libredwg-web` (npm), `GPL-3.0` (dựa trên GNU LibreDWG).
- **Dùng để làm gì**: đọc (parse) file `.dwg` — định dạng nhị phân AutoCAD KHÔNG có tài liệu
  chính thức công khai từ Autodesk. GNU LibreDWG (bản C/C++, biên dịch WASM) là thư viện mã
  nguồn mở khả thi DUY NHẤT tìm được để làm việc này mà không phải tự viết lại reverse-engineering
  từ đầu.

## Quyết định cuối: giữ nút "Mở DWG" trong app — Web Worker cô lập

**Bối cảnh quyết định (18/07):** đã thử 3 kiến trúc trước khi dừng ở đây — (1) Worker cô lập →
(2) tách network service riêng (lo chi phí hạ tầng khi deploy thật) → (3) CLI cá nhân chạy tay
(`dwg2dxf`, sạch GPL nhất nhưng bắt user convert thủ công từng file). Sau khi cân nhắc lại: **(3)
không thực tế cho công việc hằng ngày** — toàn bộ file CAD của công ty đang ở định dạng DWG, kiến
trúc sư không thể convert tay qua terminal mỗi lần mở file. Quay lại **(1)**.

**Vì sao (1) chấp nhận được cho InteriorFlow, khác với 1 sản phẩm SaaS bán ra ngoài:**
InteriorFlow là **tool nội bộ của TTT Architects** — auth khoá domain `@ttt.vn`, đăng ký công khai
trả 403, KHÔNG bán/phân phối cho khách hàng ngoài công ty (xem STATUS.md "Quyết định user đã
khoá"). Nghĩa vụ copyleft của GPL xoay quanh việc **phân phối** phần mềm — dùng nội bộ trong 1 tổ
chức không phải là "phân phối" theo cách các sản phẩm thương mại bán ra thị trường vẫn hiểu. Rủi ro
pháp lý cho use-case này thấp hơn nhiều so với khi tôi (agent) ban đầu đánh giá — đã áp dụng góc
nhìn "sản phẩm SaaS bán ra ngoài" cho 1 công cụ nội bộ, dẫn tới 2 lần đổi kiến trúc không cần thiết.

**Kiến trúc**: `lib/cad/dwg-worker.ts` là file DUY NHẤT `import @mlightcad/libredwg-web` — chạy
trong Web Worker riêng, giao tiếp code chính qua `postMessage` JSON thô (không import/export trực
tiếp module GPL vào bundle chính). `lib/cad/dwg.ts` (`dwgRawDocToDoc`, không GPL) map JSON →
`Doc`. Nút "Mở DWG" trong `CadEditor.tsx` gọi `openDwgFile()`.

⚠️ Đây vẫn KHÔNG PHẢI tư vấn pháp lý chính thức. **Nếu SAU NÀY công ty định bán/phân phối
InteriorFlow ra ngoài** (cho khách hàng, đối tác, hay dưới dạng SaaS công khai) — dừng lại, review
pháp lý chính thức trước, cân nhắc lại 1 trong các phương án đã bỏ ở trên.

## Phương án dự phòng: `~/Downloads/dwg2dxf` (CLI local, vẫn giữ)

Không xoá — dùng khi cần **offline tuyệt đối** hoặc bản vẽ nhạy cảm không muốn qua bất kỳ xử lý
nào trong app: `node cli.js ban-ve.dwg` → convert ra `.dxf` → mở bằng nút "Mở DXF". CLI này
`require()` trực tiếp `lib/cad/dwg.ts` (`dwgRawDocToDoc`) + `lib/cad/dxf.ts` (`exportDxf`) của
InteriorFlow — đổi shape `DwgRawDoc` ở 1 bên thì phải đổi cả bên kia (không type-check chéo được,
2 repo khác nhau). Verify round-trip file .dwg thật (305KB): 421 entity/21 layer khớp chính xác.

## Giới hạn kỹ thuật hiện tại

- Chỉ map các entity: `LINE`, `CIRCLE`, `ARC`, `TEXT`, `MTEXT`, `LWPOLYLINE`, `HATCH` (boundary
  dạng polyline hoặc toàn cạnh thẳng). **CHƯA hỗ trợ**: `INSERT` (block), `DIMENSION`,
  `ATTRIB`/`ATTDEF`, `WIPEOUT`, `POINT`, HATCH có boundary cong — bị BỎ QUA an toàn, đếm vào
  `skippedEntityCount` hiện trong status bar sau khi mở.
- **Đã biết, CHƯA sửa**: thư viện không throw lỗi với file rác/không phải DWG thật — trả về
  `ok:true` với 0 entity thay vì báo lỗi rõ ràng (chưa validate magic-header trước khi parse).
- Lineweight (độ dày nét) đọc từ DWG dùng suy luận CHƯA XÁC NHẬN chính thức — chỉ ảnh hưởng thẩm
  mỹ, KHÔNG ảnh hưởng toạ độ/hình học.
- Verify với file .dwg thật (305KB, kiến trúc căn hộ): 421/497 entity map hợp lệ, 25 layer giữ
  tên, render đúng hình phòng ngủ (verify browser thật trước đó).
