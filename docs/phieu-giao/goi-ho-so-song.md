# PHIẾU GIAO · goi-ho-so-song — P4 Gói Hồ Sơ Sống v0 (ZIP + viewer HTML tự chứa + 3 tầng thoái lui)

## THẺ VAI [Đ4]
- **VAI:** HS — agent nhánh Gói-Hồ-Sơ-Sống (DocCore, chuỗi nền P4), thi công định dạng gói xuất một-nguồn.
- **PHẠM VI/TRẦN:** cấp F. Vùng: `lib/ho-so-song/**` (MỚI) + MỘT điểm cắm xuất trong `components/present-editor/**` (ghi rõ file nào vào báo cáo) + `docs/bao-cao-phien/2026-08-13-HS-goi-ho-so-song.md`.
- **BIÊN → DỪNG:** KHÔNG đụng engine BOQ/deck/export PDF hiện có (chỉ GỌI kết quả của chúng) · KHÔNG schema DB · KHÔNG dep mới (jszip ĐÃ có, client-side đang dùng ở lib/pptx-zip-fonts.ts, lib/boq/xlsx.ts) · viewer KHÔNG được gọi mạng ngoài (CDN/font/fetch tuyệt đối cấm — tự chứa là sống còn).
- **ĐIỀU KHOẢN RUỘT:** [T1] một nguồn nhiều đích — gói là ĐÍCH mới của cùng nguồn, không nguồn thứ hai · [T5] đích sửa được — ruột JSON máy-đọc để nhập lại · [T0] khai thật phần chưa nối · [T3] trung tính — viewer 0 brand IF cứng ngoài chữ "Tạo bởi InteriorFlow" nhỏ.

## ① BỐI CẢNH
Hồ sơ giao khách hiện là các file rời (PDF, ảnh, XLSX) — thất lạc lẫn nhau, không ai biết bản nào thuộc bản nào, và nếu app chết thì dữ liệu máy-đọc chết theo (bài học Adobe: IF mở định dạng TỪ ĐẦU). Gói Hồ Sơ Sống = MỘT file .zip tự chứa toàn bộ hồ sơ dự án với **3 tầng thoái lui**: ①`index.html` viewer tự chứa mở mọi trình duyệt → ②`out/` file chuẩn ngành (PDF/PNG/XLSX) mở bằng app phổ thông → ③`data/` JSON máy-đọc + `manifest.json`. Bất kỳ tầng nào chết, tầng dưới vẫn sống.

## ② ĐỌC TRƯỚC
`docs/TRIET-LY-IF.md` [T1] · `lib/pptx-zip-fonts.ts` (cách dùng jszip trong repo) · `lib/present-editor/export.ts` + `content-deck.ts` (deck data + đường xuất hiện có — GỌI, không sửa) · `lib/present-editor/brand-kit.ts` (Brand Kit thuộc dự án) · grep `ExportPdfDialog` (điểm cắm UI xuất hiện có).

## ③ VÙNG FILE
`lib/ho-so-song/{types.ts, manifest.ts, pack.ts, viewer-template.ts, ho-so-song.test.ts}` (MỚI) · 1 file trong `components/present-editor/` để thêm mục xuất "Gói Hồ Sơ (.zip)" vào menu/dialog xuất hiện có · báo cáo. **KHÔNG file nào khác trong components/present-editor ngoài đúng 1 file điểm cắm.**

## ④ VIỆC (marker `HoSoSong`)
1. `types.ts` + `manifest.ts` — `HoSoSongManifest`: { version: 1, projectId, tenDuAn, taoLuc (nhận từ caller, không Date.now trong lib thuần nếu test cần tất định), kenh: [{ id, loai: 'viewer'|'nganh'|'ruot', path, mime, sha256 }], provenance: { nguon: 'interiorflow', doc mấy bản, ai xuất } }. Checksum SHA-256 qua WebCrypto (đã có tiền lệ upscale-cache dùng SHA-256).
2. `pack.ts` — `packHoSoSong(input): Promise<Blob>` nhận danh sách artifact ĐÃ SINH SẴN từ caller ({ deckJson?, boqXlsx?: Blob, pdf?: Blob, images?: {name, blob}[] }) → dựng cây zip `index.html + manifest.json + data/ + out/` bằng jszip. KHÔNG tự render PDF/ảnh — nhận từ đường xuất hiện có (một cỗ máy nhiều mặt tiền).
3. `viewer-template.ts` — sinh `index.html` TỰ CHỨA: inline CSS (tone be/xám-đen, token gần globals nhưng tự chứa — chép giá trị, ghi chú nguồn) + inline JS thuần đọc `data/deck.json` qua fetch RELATIVE (chạy tốt qua `file://`? — KIỂM: fetch file:// bị chặn ở nhiều browser → nhúng thẳng JSON vào index.html dưới `<script type="application/json">` là đường chắc ăn, chọn đường này, ảnh tham chiếu relative `out/images/`). Hiện: tên dự án + danh mục kênh (từ manifest) + lưới trang deck (ảnh) + bảng BOQ tóm tắt nếu có. Song ngữ VI/EN tĩnh đơn giản. 0 request ngoài.
4. Điểm cắm UI: thêm mục "Gói Hồ Sơ (.zip) · Living Dossier" vào cửa xuất hiện có của Trình chiếu — gom deck hiện tại + ảnh đã render sẵn có + BOQ nếu mở được từ dữ liệu hiện hành; artifact nào thiếu thì BỎ QUA kênh đó trong manifest (không chặn, không giả) và viewer ghi rõ kênh vắng.
5. Test (thuần, không mạng): round-trip pack → jszip đọc lại → manifest đúng số kênh + sha256 khớp nội dung · viewer chứa JSON nhúng + KHÔNG chứa `http://`/`https://` ngoài (regex kiểm trong test — khoá tự chứa bằng máy) · thiếu toàn bộ artifact = lỗi rõ ràng.

## ⑤ RÀNG BUỘC
KHÔNG git · KHÔNG dev server · KHÔNG dep mới · chuỗi UI mới qua từ điển (kiểm `npm run soi:tu-dien`) · tên file zip: `ho-so-<slug>-<yyyymmdd>.zip`.

## ⑥ NGHIỆM THU TỰ LÀM
`npx tsc --noEmit` 0 lỗi mới · test mới pass (sucrase-node) · `npm run soi:tu-dien` 0 lệch mới · SINH 1 GÓI MẪU thật từ fixture vào `/private/tmp/claude-501/-Users-tranben-Downloads-interiorflow/b779779b-76b3-4e9c-ba44-69dbf50c46a5/scratchpad/ho-so-mau.zip` (script node nhỏ dùng fixture, không cần browser) — T sẽ MỞ FILE ĐẦU RA soi theo CHUAN-DAU-RA khi audit; ghi đường dẫn vào báo cáo.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-13-HS-goi-ho-so-song.md` — khuôn chuẩn: file sửa/tạo · output lệnh thật · quyết định + lý do · CHƯA LÀM nói thẳng · khuôn 2 giá trị §1c · điểm chạm biên đề xuất lên T.

## ⑧ DÂY MÁY
Entry `goi-ho-so-song` (đợt 7, DocCore, ⭐MVP) — bangChung grep `HoSoSong|ho-so-song` trong lib. Agent KHÔNG sửa registry, T flip sau audit.
