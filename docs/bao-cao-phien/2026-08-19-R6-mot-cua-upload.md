# R6 — Hợp nhất 2 đường upload qua Format Router (19/08, lane Files/Library)

## ⓪ Tiền đề — XÁC NHẬN (kèm 1 đính chính nhỏ)
- `lib/gateway/` đúng là Format Router (detect + capabilities + route), thuần logic. ✔
- Hai đường upload thật sự KHÔNG gặp nhau trước R6: `/files` (FileManagerShell ghi đĩa, tự đoán loại theo đuôi qua `kindFromName`) · `/library/ingest` (`lib/refingest.classify` tự chế bộ đoán đuôi thứ ba, ghi manifest IDB). Cả hai `grep lib/gateway` = 0. ✔
- ⚠ Đính chính câu "`capabilityFor` đang 0 caller": nó ĐÃ có caller gián tiếp qua `routeFormat` (present Toolbar, CadEditor, RenderIOMenus, MaterialImportWizard đều gọi `routeFormat`). Số 0 đúng cho **caller trực tiếp ngoài gateway** và đúng cho **hai bề mặt upload** — ý của map vẫn đứng, không phải cớ REFUSE.
- "ĐẶC CÁCH GATEWAY" có thật ở `components/present-editor/Toolbar.tsx:268` (comment tự khai cách trả nợ — R6 làm đúng theo chỉ dẫn đó).
- ⓪b: HEAD `c7f3ac8`, làm trên nội dung đĩa hiện tại của các file dirty, không revert hunk nào.

## ① Việc đã làm (CONNECT — không pipeline mới, không taxonomy mới, không route API mới)
1. **`lib/gateway/upload.ts` (MỚI, ~40 dòng)** — `planUpload(input): { format, importableStages, note? }`. MỘT cửa nhận: tái dùng `GatewayFormat` + `capabilityFor` + `GatewayStage`, không kiểu phân loại thứ tư. `capabilityFor` nay có caller thật từ cả hai bề mặt upload.
2. **`lib/gateway/capabilities.ts`** — `present.pdf.import: 'unavailable' → 'lossy'` (Smart Convert bậc 1 đã ship 13/08; bảng cũ khai sai hiện trạng, chính lỗ này đẻ ra đặc cách).
3. **`lib/gateway/route.ts`** — `routeFormat('pdf','present') → present-import-deck` (stage-dependent như ảnh; pdf ở cad/render giữ nguyên unsupported → 3 caller khác không đổi hành vi).
4. **`components/present-editor/Toolbar.tsx`** — GỠ đặc cách `if (format === 'pdf')` trước `routeFormat`; PDF đi cùng cửa, nhánh `present-import-deck` chọn importer theo format (pdf-import ↔ pptx-import). Nhánh xlsx/csv đổi từ so-format sang `action.kind === 'library-bulk-ingest'` (cùng kết quả, hết đường tắt thứ hai). Comment đặc cách đóng dấu ĐÃ TRẢ NỢ tại chỗ.
5. **`lib/refingest.ts`** — `classify()` delegate `planUpload` (Format Router là nguồn phân loại); `RefType` giữ nguyên làm KHOÁ LƯU manifest (đổi là vỡ IDB cũ). Lưới đỡ giữ hành vi cũ: mime `image/*` và `.xls` đời cũ (detect.ts chỉ nhận `.xlsx`, còn `accept` của trang ingest có `.xls`).
6. **`app/library/ingest/page.tsx`** — `add()` đếm tệp loại `other` → notice nói thật "chưa chưng cất được, vẫn giữ tham chiếu metadata". Không từ chối file nào.
7. **`components/filemanager/FileManagerShell.tsx`** — `runUpload` gọi `planUpload` (đọc 8KB đầu, magic byte thắng đuôi); ghi đĩa Y NHƯ CŨ với mọi file (gốc bất biến); tệp 0-chặng-mở-được → note `gwNote` nói thật (tách khỏi `fsNote` = lỗi ghi đĩa). Lỗi đọc đầu file → bỏ qua phân loại, upload vẫn chạy.

## ② Không mất gì (user-facing)
Mọi loại file trước đây nhận được vẫn nhận được, cùng đường xử lý: /files vẫn ghi đĩa tất; ingest vẫn nhận tất (ảnh→palette/thumb, pdf→bóc chữ, khác→metadata); present Toolbar: pdf/pptx/idfp/ảnh/xlsx/csv hành vi y hệt. Chỉ THÊM hai câu nói thật.

## ③ Nghiệm thu máy
- `npm run tsc` — 0 lỗi.
- `lib/gateway/upload.test.ts` (MỚI, 8 ca) — 8/8 pass; `capabilities.test.ts` 31/31 (2 dòng cập nhật + 1 ca mới pdf@cad giữ unsupported); `detect.test.ts` 35/35 (dòng pdf cập nhật + 1 ca mới).
- Chạy: `node_modules/.bin/sucrase-node lib/gateway/{upload,capabilities,detect}.test.ts`.

## ④ BROWSER-PENDING — kịch bản cần chạy tay (pane bận, phiên này không lái browser)
1. `/present` (hoặc route present của dự án) → nút Nhập → chọn `.pdf` → phải vào luồng Smart Convert như trước (prompt phạm vi trang nếu >30 trang, LightArc chạy, slide nối cuối deck).
2. Cùng nút → `.pptx` → nối deck như cũ; → `.xlsx` → mở dialog BOQ như cũ; → ảnh → đặt lên slide.
3. `/files` → mở một thư mục ghi được → tải lên 1 ảnh + 1 `.mp4` → cả hai nằm trên đĩa; note hiện: "…1 tệp (x.mp4) hiện chưa chặng nào của IF mở được…".
4. `/library/ingest` → kéo 1 ảnh + 1 file `.zip` → ảnh có thumb/palette; notice "1 tệp chưa chưng cất được (…) — vẫn giữ tham chiếu metadata"; card FILE vẫn hiện.
5. `/library/ingest` → kéo `.xls` đời cũ → vẫn vào loại Excel (lưới đỡ).

## ⑤ Câu hỏi cho MAIN (không chặn, đã làm phần chắc)
- `pdf` ở stage `cad`/`render` có capability `import: 'reference'` nhưng `routeFormat` trả `unsupported` (hành vi CŨ, giữ nguyên). Đây là lệch capability↔route có sẵn — muốn pdf-làm-reference đi qua router ở 2D/3D là quyết định kiến trúc riêng, ngoài shape R6.
- `/files` hiện chỉ *nói* chặng nào mở được; bước kế (đúng UF-3 full) là nút "Mở ở chặng…" đọc `plan.importableStages` — cần chốt UI trước, chưa làm.

## ⑦b CHƯA CHẮC / CHƯA KIỂM
- **Chưa chạy browser một dòng nào** (phiếu cấm) — mọi khẳng định hành vi UI là đọc mã; 5 kịch bản ④ chưa ai bấm.
- `planUpload` đọc `file.slice(0,8192)` cho MỌI file ở /files — với FileList rất lớn (hàng trăm file) thêm ~1 vòng đọc đầu file tuần tự trước upload; chưa đo thời gian thật.
- Manifest IDB cũ có asset đã phân loại bằng bộ classify cũ — không migrate (khoá `RefType` giữ nguyên nên không vỡ), nhưng file từng bị xếp khác đi (hiếm: chỉ ca mime lạ) sẽ giữ nhãn cũ.
- Các test dirty của lane khác (idfc-store, resolve…) không chạy lại ở đây — chỉ chạy targeted gateway.

## ⑦c HẠN DÙNG
- Kết luận "0 caller upload → đã nối" đúng tại HEAD `c7f3ac8` + trạng thái dirty 19/08. Khi Q5 (full pipeline ingest) mở, `planUpload` là chỗ EXTEND — đừng dựng cửa thứ hai.
- Số dòng/line-number trích trong báo cáo trôi theo mọi commit sau.
