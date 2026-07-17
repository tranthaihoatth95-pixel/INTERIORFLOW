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
- **InteriorFlow là sản phẩm thương mại đóng mã nguồn** → trộn dependency GPL vào cùng
  `package.json`/repo có thể kéo theo nghĩa vụ copyleft tuỳ cách diễn giải GPL cho "linking" trong
  ngữ cảnh JS bundler — vùng xám pháp lý.

## Biện pháp: TÁCH RIÊNG HOÀN TOÀN thành `dwg-parse-service`

**KHÔNG còn cô lập bằng Web Worker trong cùng repo** (cách làm ban đầu, Sprint đầu tiên) — đã
**thay bằng tách service riêng hẳn** (theo lựa chọn của chủ dự án, sau khi cân nhắc 3 phương án ở
mục "VIỆC CẦN LÀM" trước đây):

1. **`dwg-parse-service`** (thư mục riêng cạnh `interiorflow/`, xem `README.md` của nó): repo Git
   riêng, `package.json` riêng khai `"license": "GPL-3.0"` — tự nó tuân thủ GPL vì không "giấu" gì
   (mã nguồn service này công khai/sẵn sàng cung cấp theo yêu cầu GPL). Đây là nơi DUY NHẤT còn
   `import @mlightcad/libredwg-web`.
2. Service expose `POST /parse` (nhận bytes `.dwg` thô, trả JSON entities/layers) — chạy độc lập,
   triển khai trên hạ tầng RIÊNG (không chung Vercel project/deploy với InteriorFlow).
3. InteriorFlow gọi service này qua route server `app/api/cad/dwg-import/route.ts` (biến môi
   trường `DWG_SERVICE_URL`, server-only) — **arms-length network call qua HTTP**, không
   import/link code GPL vào bundle thương mại. `package.json` của InteriorFlow **không còn**
   dependency GPL nào.
4. Client (`lib/cad/dwg.ts`) chỉ `fetch('/api/cad/dwg-import')` rồi map JSON → `Doc` — code này
   100% không GPL, không đổi từ trước.

⚠️ Đây là biện pháp GIẢM THIỂU RỦI RO ở mức kỹ thuật cao hơn hẳn cô lập Worker (network service
thay vì cùng dependency tree), nhưng **vẫn KHÔNG PHẢI bảo đảm pháp lý tuyệt đối** — chưa có luật
sư xác nhận chính thức.

## VIỆC CẦN LÀM TRƯỚC KHI PHÂN PHỐI CHO KHÁCH HÀNG THẬT

- [ ] **Luật sư/quản lý dự án review chính thức** kiến trúc tách service này trước khi tính năng
      "Mở DWG" được bật cho khách hàng thật (kể cả bản demo/beta có khách ngoài xem).
- [ ] Quyết định hạ tầng triển khai `dwg-parse-service` thật (server riêng/Railway/Render/Fly.io…
      — KHÔNG chung project Vercel với InteriorFlow) + publish repo (GPL-3.0 đòi hỏi mã nguồn sẵn
      sàng cung cấp nếu phân phối service — công khai lên GitHub là cách đơn giản nhất để tuân thủ).
- [ ] Nếu giữ tính năng: cân nhắc thêm dòng ghi công/giấy phép hiển thị cho user cuối.

## Giới hạn kỹ thuật hiện tại (không đổi từ Sprint đầu tiên)

- Chỉ map các entity: `LINE`, `CIRCLE`, `ARC`, `TEXT`, `MTEXT`, `LWPOLYLINE`, `HATCH` (boundary
  dạng polyline hoặc toàn cạnh thẳng). **CHƯA hỗ trợ**: `INSERT` (block), `DIMENSION`,
  `ATTRIB`/`ATTDEF`, `WIPEOUT`, `POINT`, HATCH có boundary cong — bị BỎ QUA an toàn, đếm vào
  `skippedEntityCount` hiện trong status bar sau khi mở.
- **Đã biết, CHƯA sửa**: thư viện không throw lỗi với file rác/không phải DWG thật — trả về
  `ok:true` với 0 entity thay vì báo lỗi rõ ràng (chưa validate magic-header trước khi parse).
- Lineweight (độ dày nét) đọc từ DWG dùng suy luận CHƯA XÁC NHẬN chính thức — chỉ ảnh hưởng thẩm
  mỹ, KHÔNG ảnh hưởng toạ độ/hình học.
- Cần chạy `dwg-parse-service` (`npm start`, xem README của nó) + đặt `DWG_SERVICE_URL` trong
  `.env.local` thì nút "Mở DWG" mới hoạt động — thiếu thì hiện lỗi rõ ràng, không chặn phần còn
  lại của app.
