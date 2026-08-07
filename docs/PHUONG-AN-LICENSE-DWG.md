# PHUONG-AN-LICENSE-DWG — tóm tắt quyết định, viết bởi COWORK-PHU (06/08/2026)

> ⚠️ **KHÔNG PHẢI TƯ VẤN PHÁP LÝ.** Người viết là agent kỹ thuật, không phải luật sư. File này
> **trỏ tới** 2 nguồn đã có sẵn và rất đầy đủ — `docs/LICENSE-NOTES.md` (hiện trạng + cổng chặn) và
> `docs/RESEARCH-DWG-LICENSE.md` (nghiên cứu 25/07/2026, 5 đường A-E, đã verify chạy thật) — KHÔNG
> lặp lại nội dung 2 file đó (đúng §0s "cắt token thừa"). Mục đích riêng của file này: nói thẳng cho
> Hoà (không phải dân IT) mức độ khẩn cấp, và tách rõ phần "hiểu được bằng kỹ thuật" khỏi phần
> "BẮT BUỘC hỏi luật sư thật".

## 0. Việc này đã có 2 file nghiên cứu SẴN, KHÔNG phải làm lại từ đầu

`docs/RESEARCH-DWG-LICENSE.md` (599 dòng, 25/07/2026) đã: verify package chạy Node thật (số đo
mili-giây thật), so sánh 5 đường (A: server-side · B: mua ODA · C: ODA File Converter · D: chỉ nhận
DXF · E: convert cloud), tra giá ODA thật ($3.000/$2.250 Commercial, $7.500/$4.500 Sustaining), viết
sẵn kế hoạch di trú `file:dòng` cho đường A, và có 20+ nguồn trích dẫn (gnu.org, FSF, ODA, CloudConvert).

`docs/LICENSE-NOTES.md` (v2.0, 28/07/2026, Hoà đã duyệt "tiến hành") là bản NHÁP §7 của file trên,
đã áp dụng — có bảng "cổng chặn trước khi phát hành thương mại" (§8) với 6 mục, hiện **[ ] chưa tick
2 mục đầu** (trang Third-party licenses + quyết định Electron).

**Việc của file này KHÔNG phải nghiên cứu lại** — là dịch 2 file trên thành ngôn ngữ quyết định
nhanh cho Hoà, đúng vai trò của VIỆC 4 trong phiếu.

## 1. Rủi ro cụ thể — điều khoản nào, kích hoạt khi nào

**Dependency:** `@mlightcad/libredwg-web@0.7.7` (`package.json:27`) — license `GPL-3.0`, dùng để đọc
file `.dwg`. File DUY NHẤT import: `lib/cad/dwg-worker.ts:231` (đã xác nhận qua `grep -rna
"libredwg\|dwg" lib/cad/` — code cô lập tốt, chỉ 1 điểm chạm).

**Điều khoản kích hoạt: GPL-3 §4/§5/§6 — nghĩa vụ "conveying" (phát bản copy cho người khác).**
Theo `RESEARCH-DWG-LICENSE.md §1.2`, IF đang **conveying** ở 2 chỗ, tức nghĩa vụ ĐÃ kích hoạt (không
phải rủi ro tương lai):
1. **Web**: `public/wasm/libredwg-web.wasm` (9 MB) tải xuống browser người dùng — FSF xác nhận rõ
   ràng "JavaScript/WASM browser tải về LÀ conveying" (khác code chạy trên server của mình).
2. **Desktop Electron**: installer đóng gói nguyên `node_modules` (`package.json > build.files` có
   `node_modules/**/*`, `asar: false`) → binary GPL nằm trong file cài đặt phát cho khách.

**Nghĩa vụ chưa làm (4 dòng, `LICENSE-NOTES.md §2`):** kèm text GPL-3 đầy đủ · giữ nguyên copyright
notice · cung cấp Corresponding Source (hoặc lời mời bằng văn bản) · ghi rõ phần nào dưới GPL —
**cả 4 đều đang ⬜ (chưa làm)** trong app thật hôm nay.

**Vì sao lý do cũ "tool nội bộ, không bán" không còn cứu được:** GPL-3 miễn trừ nghĩa vụ này khi
"tổ chức chỉ copy cho chính mình dùng" (FSF FAQ) — điều đó CHỈ đúng khi IF là công cụ nội bộ 1 pháp
nhân. `CLAUDE.md` LUẬT NỀN TẢNG đã chốt IF là **sản phẩm bán/dùng toàn cầu** — lý do miễn trừ cũ
chết ngay khi có bản phát hành ra ngoài (web công khai, installer, app store).

## 2. Các hướng xử lý khả dĩ

| # | Hướng | Tóm tắt (chi tiết đủ ở `RESEARCH-DWG-LICENSE.md §2-5`) |
|---|---|---|
| **A** | Chuyển parse DWG sang server-side, loại package khỏi bản web | Đã **verify chạy thật**: file 299KB → 351ms, 3.3MB → 1.5s (nhanh hơn bản browser hiện tại). $0 license. **Không tự cứu bản Electron** (Electron vẫn đóng gói package trừ khi làm thêm A1/A2 ở §3.4 file nghiên cứu) |
| **B** | Mua license thương mại ODA (Open Design Alliance) | Commercial $3.000 năm 1/$2.250 gia hạn (đủ cho desktop, giới hạn 100 bản). Sustaining $7.500/$4.500 (không giới hạn, cần cho web qua "Drawings inWEB SDK"). **Duy nhất giải quyết được việc GHI DWG** (libredwg hiện tại KHÔNG ghi được — `--disable-write`, xác nhận ở build script) |
| **C** | ODA File Converter (binary miễn phí) | KHÔNG redistribute được cho thương mại — chỉ dùng non-commercial hoặc user tự cài, không phải đường chính khả thi |
| **D** | Bỏ tính năng, chỉ nhận DXF | $0, sạch tuyệt đối — `lib/cad/dxf.ts` đã có sẵn, và **mọi entity IF thực sự dùng đều sống sót qua DXF nguyên vẹn** (đã đối chiếu danh sách entity map được). Cái mất là UX (khách phải tự SaveAs), không mất dữ liệu |
| **E** | Convert qua dịch vụ cloud thứ 3 (CloudConvert/Autodesk) | Sạch về license nhưng **rủi ro bảo mật/NDA nặng hơn rủi ro license** — hồ sơ khách hàng (bản vẽ kiến trúc, có thể chứa layout an ninh) rời khỏi tay IF sang bên thứ 3 mà chưa có sự đồng ý bằng văn bản của khách |
| **F** (cô lập tiến trình riêng) | Tách phần đọc DWG thành 1 add-on/plugin GPL riêng, user tự tải tự cài | Đây chính là "A2" trong nghiên cứu gốc — app chính không phân phối gì, user tự lấy bản GPL từ nguồn GPL. Sạch nhất về mặt "app chính không conveying", nhưng công sức trung bình-lớn (repo mới, updater, UX cài đặt riêng cho Windows+Mac) |

## 3. Chấm điểm chi phí/công sức/mất gì

| Hướng | Chi phí tiền | Công sức | Mất gì |
|---|---|---|---|
| A (server-side, web only) | ~$0 (chỉ hạ tầng CPU) | Nhỏ — 2 file sửa, 1 route mới (kế hoạch có sẵn `file:dòng`) | Web mất offline cho riêng tính năng mở DWG (DXF vẫn offline) |
| A + F (server web + plugin tách rời cho desktop) | ~$0 | Trung bình-lớn (thêm repo/updater cho F) | Desktop giữ được offline, nhưng cần dựng hạ tầng update riêng |
| B (mua ODA) | $3.000-$7.500 năm đầu, $2.250-$4.500/năm sau, **vĩnh viễn khi còn phân phối bản đã build** | Trung bình (thay thư viện, học API mới) | Rủi ro tài chính dài hạn — ngừng trả phí = mất quyền phân phối SẢN PHẨM ĐÃ BÁN, kể cả bản build khi đang trả phí |
| D (chỉ DXF) | $0 | Nhỏ (xoá code, không thêm) | 100% là UX — khách quen làm việc với DWG phải tự SaveAs sang DXF trong AutoCAD |
| E (cloud thứ 3) | Thấp ($8/tháng CloudConvert cỡ nhỏ) | Nhỏ | **Rủi ro cao nhất trong bảng này** — không phải rủi ro license mà là rủi ro hợp đồng/bảo mật với khách hàng thật |

## 4. Kiến nghị (kỹ thuật, không thay được ý luật sư)

Đồng thuận với khuyến nghị đã có trong `RESEARCH-DWG-LICENSE.md §8`, nói ngắn gọn lại:

1. **Làm ngay, không tốn tiền, không cần chờ luật sư** — thêm trang "Third-party licenses" trong
   app (đủ GPL-3 text + copyright notice + lời mời Corresponding Source). Đây là việc rẻ nhất, và
   **nên làm bất kể chọn hướng nào ở dưới** vì đang là nghĩa vụ còn thiếu ngay lúc này.
2. **Ngắn hạn (đường A + D):** chuyển parse sang server cho bản web, giữ DXF làm lối thoát offline
   luôn có sẵn. Bản Electron cần quyết định dứt điểm về A1 (gọi API ngoài, mất offline cho DWG) hay
   A2/F (plugin tách rời, giữ offline nhưng tốn công).
3. **Dài hạn, chỉ khi IF2 thật sự cần GHI DWG** (không mua trước khi cần — đúng nguyên tắc "không
   xây tính năng chưa có nơi tiêu thụ", tương đương K4): hỏi ODA trực tiếp bằng email để xác nhận
   giá thật + điều khoản chấm dứt hợp đồng, KHÔNG chốt ngân sách chỉ dựa vào trang web của họ.
4. **Không làm** đường E làm mặc định — rủi ro hợp đồng khách hàng lớn hơn lợi ích tiết kiệm license.

## 5. Tách bạch: phần kỹ thuật vs phần CẦN luật sư

**Phần agent này TỰ TIN xác nhận bằng kỹ thuật (đọc code + văn bản license công khai):**
- Package nào đang GPL, nằm ở file nào, có bao nhiêu điểm chạm trong code (1 file duy nhất).
- Package chạy được trên Node.js thật (đã đo số liệu, không phải suy đoán).
- Package KHÔNG ghi được DWG (xác nhận qua build script `--disable-write`).
- 2 đường phát hành hiện tại (web WASM + Electron installer) đều đang phát tán binary GPL cho người dùng.

**Phần BẮT BUỘC hỏi luật sư IP/open-source, agent KHÔNG tự trả lời được:**
1. **"Cô lập trong Web Worker/route riêng có đủ để không tạo derivative work không?"** — đây là
   vùng tranh chấp thật trong cộng đồng open-source (mere aggregation vs derivative work), không có
   câu trả lời kỹ thuật chắc chắn.
2. **Luận điểm "server-side parse = không conveying"** (đường A) dựa trên đọc GPL-3 §0 + FSF FAQ —
   đây là cách hiểu phổ biến và có nguồn trích dẫn, nhưng **là suy luận pháp lý**, cần luật sư xác
   nhận trước khi dựa hẳn vào nó cho sản phẩm thương mại.
3. **Có cần công bố Corresponding Source đầy đủ** (bao gồm build script) hay chỉ cần "written offer"
   là đủ theo GPL-3 §6 — cách diễn giải khác nhau có hệ quả vận hành khác nhau.
4. **Rủi ro thực tế nếu bị phát hiện vi phạm** (ai có quyền khởi kiện — thường là tác giả GPL gốc
   hoặc tổ chức như SFC/FSF; mức độ, khả năng thực tế) — nằm ngoài phạm vi kỹ thuật hoàn toàn.
5. **Điều khoản ODA về chấm dứt hợp đồng** ("ngừng trả phí = mất quyền phân phối cả bản đã build")
   — cần luật sư hợp đồng thương mại đọc kỹ bản hợp đồng thật trước khi ký, con số trên trang web
   của ODA không đủ để ký quyết định ngân sách.

## 6. Cổng chặn hiện tại (trích dẫn, không lặp — xem `LICENSE-NOTES.md §8` để có checklist đủ 6 mục)

`LICENSE-NOTES.md:120-132` đã liệt kê 6 điều kiện PHẢI xong trước khi phát hành thương mại — tính
tới 06/08, **mục 1 (luật sư review) và mục 2 (trang Third-party licenses) vẫn `[ ]` chưa làm**. Đây
là 2 việc chặn cứng nhất, không phụ thuộc hướng nào được chọn ở §2 trên.

## 7. Chưa kiểm chứng được

- Giá ODA thật (không chỉ trang web) — `RESEARCH-DWG-LICENSE.md §8` đã đề nghị gửi email hỏi trực
  tiếp, chưa thấy bằng chứng đã gửi.
- Có luật sư nào đã review chưa — không tìm thấy tài liệu nào trong `docs/` xác nhận việc này đã xảy ra.
- **Sửa lại so với `LICENSE-NOTES.md §5`** (bản đó ghi "nợ, chưa đưa vào CI" — kiểm lại thấy đã làm
  1 phần): `package.json:14` đã CÓ script `"license:check": "license-checker-rseidelsohn --production
  --onlyAllow '...' --excludePackages '...@mlightcad/libredwg-web@0.7.7...'"`, và `package.json:15`
  đã nối vào `"test"` (`"test": "npm run license:check && ..."`) — tức quét transitive ĐÃ chạy mỗi
  lần `npm test`, không còn hoàn toàn "chưa làm" như `LICENSE-NOTES.md` mô tả. Không tìm thấy thư
  mục `.github/workflows/` nào trong repo (chỉ có `.serena/project.yml`, `dist-installer/
  builder-debug.yml` — không phải CI) — nên "có gate trong CI" theo nghĩa GitHub Actions tự động
  vẫn CHƯA xác nhận được, chỉ xác nhận có gate trong lệnh `npm test` chạy local/thủ công.
  → Đề xuất: cập nhật lại dòng "chưa đưa vào CI" ở `LICENSE-NOTES.md §5`/`§8` mục 4 cho khớp hiện
  trạng (N9/§0i — chiếu dòng lệch phải sửa ngay khi phát hiện) — TỔNG quyết việc sửa file đó.
