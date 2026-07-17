# LICENSE-NOTES — dependency GPL trong InteriorFlow

> ⚠️ File này KHÔNG phải tư vấn pháp lý. Người viết là engineer, không phải luật sư. Mục đích:
> ghi lại RÕ RÀNG dependency nào mang giấy phép copyleft, đã làm gì để giảm rủi ro, và việc gì
> CẦN người có thẩm quyền pháp lý xác nhận trước khi dùng cho khách hàng thật.

## Dependency GPL: `@mlightcad/libredwg-web`

- **Gói**: `@mlightcad/libredwg-web` (npm), version dùng lúc viết: `0.7.7`.
- **Giấy phép**: `GPL-3.0` (theo `package.json` của gói — dựa trên GNU LibreDWG, cũng có bản
  build khác `libredwg-web-ts` gắn `GPL-2.0-only`; ta chọn `@mlightcad/libredwg-web` vì maintained
  tích cực hơn — 51 version, cập nhật gần đây, cùng tác giả gốc GitHub `mlight-lee`).
- **Dùng để làm gì**: đọc (parse) file `.dwg` — định dạng nhị phân AutoCAD KHÔNG có tài liệu
  chính thức công khai từ Autodesk. GNU LibreDWG (bản C/C++, biên dịch WASM) là thư viện mã
  nguồn mở khả thi DUY NHẤT tìm được để làm việc này mà không phải tự viết lại reverse-engineering
  từ đầu (rủi ro ra hình học sai còn cao hơn).
- **InteriorFlow là sản phẩm thương mại** (xem `package.json` — hiện KHÔNG có field `license`
  công khai, tác giả "TTT Architects", không phải mã nguồn mở) → trộn code GPL vào cùng bundle
  có thể kéo theo nghĩa vụ copyleft (vd phải mở mã nguồn phần liên kết) tuỳ cách diễn giải GPL
  áp dụng cho JS/WASM chạy trong trình duyệt — đây là vùng xám pháp lý thật sự chưa có án lệ rõ
  ràng, KHÔNG có câu trả lời "chắc chắn an toàn".

## Biện pháp đã làm (giảm thiểu rủi ro, KHÔNG PHẢI bảo đảm tuân thủ)

1. **Cô lập vào 1 Web Worker riêng**: `lib/cad/dwg-worker.ts` là file DUY NHẤT trong repo được
   phép `import` gói này. Code chính (`lib/cad/dwg.ts`, `components/cad/CadEditor.tsx`, …) chỉ
   giao tiếp với worker qua `postMessage` (dữ liệu JSON thô), KHÔNG import/export trực tiếp module
   worker vào bundle chính.
2. Đây là khuyến nghị PHỔ BIẾN từ cộng đồng (bản thân tác giả `libredwg-web` gợi ý chạy trong
   worker) để dễ kiểm soát ranh giới — giúp việc audit/gỡ bỏ dependency này (nếu cần) chỉ đụng 1
   file, và tránh code GPL bị tree-shake/inline lẫn vào các file khác của app.
3. **Đây KHÔNG phải "tường lửa pháp lý" được đảm bảo** — cô lập kỹ thuật (Worker/postMessage)
   không tự động đổi bản chất pháp lý của việc dùng thư viện GPL trong 1 ứng dụng thương mại.
   Diễn giải GPL cho "linking" trong ngữ cảnh JS bundler/WASM/trình duyệt là vùng xám, KHÔNG có
   sự đồng thuận pháp lý tuyệt đối.

## VIỆC CẦN LÀM TRƯỚC KHI PHÂN PHỐI CHO KHÁCH HÀNG THẬT

- [ ] **Luật sư/quản lý dự án review chính thức** trade-off GPL trước khi tính năng "Mở DWG"
      được bật cho khách hàng thật (kể cả bản demo/beta có khách ngoài xem).
- [ ] Xác nhận `package.json` của InteriorFlow có field `license` rõ ràng (hiện chưa có) — nếu
      dự định giữ closed-source, cần đánh giá kỹ hơn thay vì chỉ dựa vào cô lập Worker.
      Phương án thay thế nếu review pháp lý KHÔNG chấp nhận rủi ro GPL: (a) bỏ tính năng "Mở
      DWG", chỉ hỗ trợ DXF (đã có, tự viết, không dependency ngoài); (b) tách "Mở DWG" thành
      dịch vụ/microservice RIÊNG chạy server-side với giấy phép/hạ tầng tách biệt hẳn khỏi app
      chính; (c) tìm dịch vụ chuyển đổi DWG→DXF thương mại (trả phí, có license phù hợp) thay vì
      tự parse.
- [ ] Nếu giữ tính năng: cân nhắc thêm dòng ghi công/giấy phép hiển thị cho user cuối (thường GPL
      không bắt buộc với "mere aggregation"/network use tuỳ điều khoản, nhưng đây lại là phần cần
      luật sư xác nhận, không phải engineer tự quyết).

## Giới hạn kỹ thuật hiện tại (Sprint đầu tiên — xem STATUS.md/CHANGELOG.md)

- Chỉ map các entity: `LINE`, `CIRCLE`, `ARC`, `TEXT`, `MTEXT`, `LWPOLYLINE`, `HATCH` (boundary
  dạng polyline hoặc toàn cạnh thẳng). **CHƯA hỗ trợ**: `INSERT` (block — cần dựng lại từ
  `BLOCK_RECORD`), `DIMENSION`, `ATTRIB`/`ATTDEF`, `WIPEOUT`, `POINT`, HATCH có boundary cong
  (cung/spline) — các entity này bị BỎ QUA an toàn (không đoán hình học khi chưa verify được cấu
  trúc dữ liệu thật của thư viện), đếm vào `skippedEntityCount` hiện trong status bar sau khi mở.
- Lineweight (độ dày nét) đọc từ DWG dùng suy luận CHƯA XÁC NHẬN chính thức (xem comment trong
  `lib/cad/dwg.ts` — enum thô của `libredwg-web` không có tài liệu TypeScript rõ ràng cho 3 giá
  trị sentinel BYLAYER/BYBLOCK/DEFAULT); chỉ ảnh hưởng thẩm mỹ (độ dày nét vẽ), KHÔNG ảnh hưởng
  toạ độ/hình học.
- wasm binary (`libredwg-web.wasm`, ~9.4MB) được copy thủ công vào `public/wasm/` — nếu nâng cấp
  version package, nhớ copy lại từ `node_modules/@mlightcad/libredwg-web/wasm/libredwg-web.wasm`.
