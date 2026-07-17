# LICENSE-NOTES — dependency GPL trong việc đọc file DWG

> ⚠️ File này KHÔNG phải tư vấn pháp lý. Người viết là engineer, không phải luật sư. Mục đích:
> ghi lại RÕ RÀNG dependency nào mang giấy phép copyleft, đã làm gì để giảm rủi ro, và việc gì
> CẦN người có thẩm quyền pháp lý xác nhận trước khi dùng cho khách hàng thật.

## Dependency GPL: `@mlightcad/libredwg-web`

- **Gói**: `@mlightcad/libredwg-web` (npm), `GPL-3.0` (dựa trên GNU LibreDWG).
- **Dùng để làm gì**: đọc (parse) file `.dwg` — định dạng nhị phân AutoCAD KHÔNG có tài liệu
  chính thức công khai từ Autodesk. GNU LibreDWG (bản C/C++, biên dịch WASM) là thư viện mã
  nguồn mở khả thi DUY NHẤT tìm được để làm việc này mà không phải tự viết lại reverse-engineering
  từ đầu.
- **InteriorFlow là sản phẩm thương mại đóng mã nguồn** → trộn dependency GPL vào cùng
  `package.json`/repo có thể kéo theo nghĩa vụ copyleft tuỳ cách diễn giải GPL cho "linking" trong
  ngữ cảnh JS bundler — vùng xám pháp lý.

## Quyết định cuối: InteriorFlow KHÔNG tự đọc .dwg nữa — dùng CLI convert local

Đã thử qua 2 kiến trúc trước khi dừng ở đây (lịch sử → CHANGELOG.md nếu cần):
1. Cô lập bằng Web Worker trong cùng repo (Sprint đầu tiên).
2. Tách thành network service riêng (`dwg-parse-service`, có API `POST /parse`).

**Cả 2 đều bị bỏ** vì (2) phát sinh chi phí hạ tầng nếu triển khai thật (dù dev local miễn phí),
và cả 2 vẫn giữ InteriorFlow phụ thuộc vào 1 thành phần chạy nền. Kiến trúc cuối — **CLI cá nhân
chạy 1 lần, KHÔNG server**:

1. **`~/Downloads/dwg2dxf`** (repo riêng, `package.json` riêng khai `"license": "GPL-3.0"`) — CLI
   `node cli.js ban-ve.dwg [output.dxf]` chạy LOCAL trên máy dev, đọc `.dwg` bằng
   `@mlightcad/libredwg-web` rồi tự `require()` trực tiếp `lib/cad/dwg.ts` (`dwgRawDocToDoc`) +
   `lib/cad/dxf.ts` (`exportDxf`) của CHÍNH repo InteriorFlow (qua sucrase, không cần build) để
   xuất ra file `.dxf` — đảm bảo định dạng LUÔN khớp những gì InteriorFlow đọc lại được.
2. User tự chạy CLI này TRƯỚC, rồi dùng nút **"Mở DXF"** có sẵn trong app (tự viết, không GPL,
   không đổi) để import file `.dxf` vừa xuất.
3. **InteriorFlow không còn nút "Mở DWG"**, không còn gọi network nào, không còn dependency GPL
   trong `package.json`/`node_modules` — `lib/cad/dwg.ts` chỉ còn hàm mapping thuần (không GPL),
   được `dwg2dxf` require dùng lại.

**Vì sao đây là lựa chọn sạch pháp lý nhất**: chạy `dwg2dxf` là **sử dụng cá nhân/local**, không
phải "phân phối" phần mềm theo nghĩa GPL (không đóng gói/bán/deploy kèm InteriorFlow cho khách
hàng) → nghĩa vụ copyleft GPL không áp dụng cho cách dùng này. InteriorFlow — sản phẩm thật sự
phân phối cho khách hàng — hoàn toàn sạch GPL.

⚠️ Vẫn KHÔNG PHẢI tư vấn pháp lý chính thức — nếu sau này có ý định **đóng gói/phân phối
`dwg2dxf` cho khách hàng** (vd bundle vào bộ cài InteriorFlow) thì lại quay về vùng xám cũ, cần
luật sư xác nhận trước.

## VIỆC CẦN LÀM (thấp ưu tiên hơn 2 phương án trước — không còn phân phối gì cả)

- [ ] Nếu về sau muốn đưa "Mở DWG" trở lại vào app cho khách hàng dùng trực tiếp (không qua CLI
      tay), quay lại 1 trong 2 phương án đã bỏ ở trên + luật sư review chính thức.
- [ ] `dwg2dxf` hiện chỉ chạy được trên máy đã có sẵn checkout `interiorflow/` cạnh nó
      (`INTERIORFLOW_DIR` env var nếu đặt chỗ khác) — chấp nhận được vì là tool nội bộ dev, không
      phân phối cho ai khác.

## Giới hạn kỹ thuật hiện tại

- Chỉ map các entity: `LINE`, `CIRCLE`, `ARC`, `TEXT`, `MTEXT`, `LWPOLYLINE`, `HATCH` (boundary
  dạng polyline hoặc toàn cạnh thẳng). **CHƯA hỗ trợ**: `INSERT` (block), `DIMENSION`,
  `ATTRIB`/`ATTDEF`, `WIPEOUT`, `POINT`, HATCH có boundary cong — bị BỎ QUA an toàn, đếm vào
  `skippedEntityCount` (CLI in ra khi convert xong).
- **Đã biết, CHƯA sửa**: thư viện không throw lỗi với file rác/không phải DWG thật — CLI có check
  best-effort (0 entity + totalEntityCount=0 → báo lỗi) nhưng chưa validate magic-header thật sự.
- Lineweight (độ dày nét) đọc từ DWG dùng suy luận CHƯA XÁC NHẬN chính thức — chỉ ảnh hưởng thẩm
  mỹ, KHÔNG ảnh hưởng toạ độ/hình học.
- Verify với file .dwg thật (305KB, kiến trúc căn hộ): round-trip CLI→DXF→`parseDxf` khớp chính
  xác 421 entity/21 layer, không mất dữ liệu.
