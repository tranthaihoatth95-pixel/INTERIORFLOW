# W2 — Browser verify R6 "một cửa upload qua Format Router" (19/08, WORKER VERIFY read-only)

## ① Tổng quan
Chạy đủ 5 kịch bản ④ của `2026-08-19-R6-mot-cua-upload.md` trên app thật (server 3001 sẵn có, HEAD `c7f3ac8`, không sửa code, không git). **Kết quả: 4/5 BROWSER-PASS trọn · 1/5 (kịch bản 3 /files) PASS phần R6 nhưng vế "ghi đĩa như cũ" KHÔNG-EXERCISE-ĐƯỢC do môi trường chưa chọn thư mục lưu.** Console 0 lỗi mới ở mọi bước. Bonus: nhánh unsupported ở Present cũng kiểm — toast "Không nhận diện được định dạng" hiện, không crash.

Cách bơm file: vì browser pane không có tool upload file hệ điều hành, file thử được dựng bằng byte thật (magic byte đúng: PNG/ftyp mp4/PK zip/OLE2 xls/%PDF/OOXML pptx·xlsx) rồi bơm qua `DataTransfer` + dispatch `drop`/`change` bằng JS lên đúng dropzone/input của app — đường đi qua chính `onGatewayFile`/`add()`/`runUpload` như người dùng thật, chỉ khác hộp thoại chọn file của OS.

## ② Chi tiết từng kịch bản

| # | Kịch bản | Kết luận | Bằng chứng |
|---|---|---|---|
| 1 | Present → Mở tệp → `.pdf` | **BROWSER-PASS** | Menu "Chọn tệp — tự nhận định dạng · Ảnh · PPTX · PDF (chữ sống, bậc 1) · IDFP · XLSX/CSV…" sống; PDF 1 trang (`test-tai-lieu.pdf`, chữ "Hello IF R6") → deck 1→2 slide, slide mới có LỚP: **"Hello IF R6"** (chữ sống bóc từ PDF) + "Nguồn nhập PDF". Console 0 lỗi. Prompt phạm vi trang KHÔNG kích hoạt — đúng, vì 1 trang < ngưỡng 30. |
| 2a | Cùng nút → `.pptx` | **BROWSER-PASS** | PPTX tối thiểu 1 slide (text "Xin chao PPTX R6") → deck 2→3 slide, slide mới có lớp "Title". |
| 2b | Cùng nút → `.xlsx` | **BROWSER-PASS** | Dialog "Nhập .xlsx vào bảng khối lượng" tự mở với file đã chọn, còn đọc ruột thật: báo "File không có dòng dữ liệu nào (chỉ có tiêu đề)" (file thử chỉ có ô A1). |
| 2c | Cùng nút → ảnh | **BROWSER-PASS** | PNG 4×4 đỏ → đặt thẳng lên slide đang mở (place-image), LỚP (2): Ảnh + Title, panel Ảnh mở "Chỉnh ảnh (crop · lọc · thay ảnh)". |
| 3 | `/files` upload ảnh + `.mp4` | **PASS phần R6 · vế ghi-đĩa KHÔNG-EXERCISE-ĐƯỢC** | Vào Files › Projects → bơm `test-anh.png` + `test-video.mp4` qua input "Chọn file từ máy". Cả hai vào danh sách (Ảnh 73 B · Video 88 B, "2 file · 161 B" — không mất file). **gwNote hiện đúng nguyên văn**: *"Đã giữ bản gốc trên đĩa; 1 tệp (test-video.mp4) hiện chưa chặng nào của IF mở được — sẽ mở được khi có importer, không cần tải lại."* — tách khỏi fsNote (*"Chưa chọn nơi lưu file — mở Cài đặt để chọn thư mục trước"*). Vì môi trường này CHƯA chọn thư mục lưu (fsNote là điều kiện env có sẵn, không phải regression R6; network 0 request upload), vế "ghi đĩa như cũ" không kiểm được ở đây. |
| 4 | `/library/ingest` kéo ảnh + `.zip` | **BROWSER-PASS** | "2 ref · Ảnh gốc 95 B → AI manifest 512 B"; ảnh có thumbnail thật (img `data:image/jpeg;base64,…` sinh từ PNG) + hàng swatch palette; card `test-goi.zip` badge **FILE** vẫn hiện; notice thật: *"1 tệp chưa chưng cất được (test-goi.zip) — vẫn giữ tham chiếu metadata, không mất bản gốc."* Không file nào bị từ chối. |
| 5 | `/library/ingest` kéo `.xls` đời cũ | **BROWSER-PASS** | Card `test-cu.xls` badge **XLS** (vào loại Excel, khác badge FILE của zip); counter lên "3 ref"; notice "chưa chưng cất" KHÔNG tăng (vẫn chỉ nêu test-goi.zip) — lưới đỡ `.xls` hoạt động. |
| + | Present → file `.xyz` lạ (bonus, ngoài 5 kịch bản) | **BROWSER-PASS** | Toast đỏ trên toolbar: **"Không nhận diện được định dạng"** — nhánh unsupported nói rõ lý do, deck giữ nguyên 3 slide, không crash. |

Console: kiểm `onlyErrors` sau kịch bản 4/5, sau KB3, sau PDF import và cuối phiên — **0 lỗi** mọi lần.

## ③ Tổng kết
Một cửa upload R6 chạy đúng trên app thật ở cả ba bề mặt: Present Toolbar hết đặc cách PDF (PDF đi cùng cửa `onGatewayFile` → `routeFormat` → Smart Convert bậc 1, chữ sống lên slide), `/library/ingest` phân loại qua router + notice nói thật cho loại lạ mà không mất file, `/files` chạy `planUpload` và tách gwNote/fsNote đúng thiết kế. Không thấy regression nào ở các đường cũ (pptx/xlsx/ảnh/xls đời cũ).

## ④ Đánh giá khách quan
- Tốt: mọi nhánh của `onGatewayFile` (place-image · present-import-deck pdf↔pptx · library-bulk-ingest · unsupported) đều đã được bấm sống; hai câu "nói thật" mới hiện đúng nguyên văn và đúng chỗ.
- Chưa kiểm được (khai thật):
  - **Ghi đĩa /files**: env chưa mount thư mục lưu → 0 request upload; chỉ chứng minh "không mất file trong danh sách + note đúng", chưa chứng minh byte nằm trên đĩa.
  - **Prompt phạm vi trang PDF >30 trang** và **LightArc tiến độ**: PDF thử 1 trang, chạy tức thì — hai thứ này chưa thấy bằng mắt (đường code có sẵn từ 13/08, R6 không đụng).
  - Bơm file bằng JS DataTransfer ≠ hộp thoại OS thật — khác biệt duy nhất là bước chọn file; sự kiện `change`/`drop` và ruột file y hệt.
  - File thử tối thiểu (pptx/xlsx tự dựng) — không đại diện file Office thật phức tạp.

## ⑤ Hướng xử lý
- Hướng A (đề xuất): coi nợ BROWSER-PENDING R6 là **ĐÃ TRẢ** ở mức kịch bản ④; hai vế chưa kiểm (ghi đĩa thật + PDF >30 trang) gộp vào lần dogfood có thư mục lưu đã mount + một PDF thật nhiều trang — 5 phút việc tay, không cần phiên riêng.
- Hướng B: dựng ngay env có mounted dir + PDF 47 trang để đóng nốt hai vế — trọn vẹn hơn nhưng tốn một lượt setup Cài đặt và file thật, trong khi hai đường đó không thuộc diff R6.

## ⑥ Đề xuất
Chọn A: phần R6 thay đổi đã được chứng minh sống toàn bộ; phần còn treo là hạ tầng env/dữ liệu thử, để dogfood tự nhiên đóng.

## ⑦b CHƯA CHẮC / CHƯA KIỂM
- Chưa kiểm ghi đĩa thật /files (env không có thư mục lưu — xem ④).
- Chưa kiểm PDF >30 trang (prompt phạm vi) và LightArc nhìn thấy được.
- `.xls` đời cũ chỉ kiểm ở ingest (kịch bản 5), chưa thử ở /files.
- Screenshot bằng chứng nằm trong transcript phiên verify (browser pane), không xuất ra file ảnh rời.

## ⑦c HẠN DÙNG
- Kết luận đúng tại HEAD `c7f3ac8` + trạng thái dirty 19/08, server dev 3001.
- Dữ liệu thử ĐỂ LẠI trong app (khai để dọn nếu cần): ① `/library/ingest` dự án "Dự án chưa đặt tên": 3 ref `test-anh.png`/`test-goi.zip`/`test-cu.xls` (manifest IDB — nút "Xoá hết" trên trang dọn được) ② `/files` › Projects: 2 mục `test-anh.png`/`test-video.mp4` (chưa ghi đĩa vì chưa chọn nơi lưu) ③ Present dự án "Dự án mới": "Hồ sơ 1" 3 slide (trang trống + trang PDF "Hello IF R6" + trang PPTX Title/ảnh đỏ). File nguồn thử nằm ở scratchpad phiên: `/private/tmp/claude-501/-Users-tranben-Downloads-interiorflow/1b593c57-4772-4fc2-af4c-af89b6dc6b51/scratchpad/test-*` (png/mp4/zip/xls/xyz/pdf/pptx/xlsx) — tự mất khi dọn scratchpad.
