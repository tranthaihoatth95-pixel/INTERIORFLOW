# M-MOCK-OUT — báo cáo phiên p3 (07/08, đối chiếu mock ↔ code + sửa cửa kiểm)

Sở hữu: `docs/mocks/` (CHỈ ĐỌC — không sửa/xoá file nào) · `scripts/check-mocks.mjs`.
Không đụng: `lib/cad/` `lib/boq/` `lib/materials/` `prisma/` — chỉ ĐỌC để đối chiếu.

**Cách mở mock `.dc.html` bằng trình duyệt thật** (26/36 file `.dc` trỏ `./support.js` KHÔNG có
trong repo — lớp bệnh G-M5-05): copy 15 mock cần xem sang scratchpad, viết shim `support.js` tối
thiểu Ở ĐÓ (gỡ `sc-if` nhánh false, xoá `{{ }}`, thêm nút gạt theme), serve `python3 http.server`
cổng 8791. **Không thêm/sửa file nào trong `docs/mocks/`.** Hệ quả tiện thể: các mock `.dc` KHÔNG
"trống trơn" như vài dòng GAP cũ tả — chúng chỉ thiếu file kịch bản; có shim là hiện đủ nội dung.

---

## VIỆC 1 — bảng đối chiếu 15 mock ↔ code

Mức verify từng mock ghi ở cột cuối (N5, không nói quá): **[B2]** = mở browser đủ 2 theme ·
**[B1]** = mở browser 1 theme (tối — theme mặc định của bộ `.dc`) · **[S]** = đọc source đủ.

| Mock | Mock có gì | Code có chưa | Lệch ở đâu | Verify |
|---|---|---|---|---|
| **Nhập bản vẽ có sẵn.dc** (G-M5-01) | 3 trạng thái: ① chọn tệp (kéo cả THƯ MỤC, trần 60 tệp/lần, nút "Lấy từ hồ sơ dùng chung", panel "Lần nạp gần đây") ② đang nạp — tiến độ "13/20 · ~40 giây", HUỶ giữa chừng giữ 13 tờ đã đọc, "Chạy nền" ③ báo cáo nạp 20 tệp — mã lần nạp `NAP-2026-0807-03`, tất định ("cùng bộ tệp nạp lại ra đúng kết quả"), 4 mức đọc được (đầy đủ · đo dè chừng · cần bạn xem · không đọc nổi), HOÀN TÁC CẢ LẦN NẠP | Một phần: nhập 1-TỆP có tiến độ+huỷ (`CadEditor.tsx:743` thanh "Đang nhập DWG… [Huỷ]", STATUS P1-VERIFY) · panel "Báo cáo nạp bản vẽ" (`CadEditor.tsx:1030` + `lib/cad/import-summary.ts` đúc chữ từ `DxfLoadReport`) | **Mock đi TRƯỚC code 5 mảnh**: nạp HÀNG LOẠT nhiều tệp/thư mục · lịch sử "Lần nạp gần đây" có mã · hoàn-tác-theo-lần-nạp · "Chạy nền" · "Lấy từ hồ sơ dùng chung". Code hôm nay 1 tệp/lượt, không lịch sử, không undo-theo-lô. ⇒ đề xuất GAP mới **(p3-01)** | [B2] |
| **Nhận đề bài.dc** (G-M5-11) | 2 trạng thái: đề bài đủ chỗ / thiếu chỗ. Số nhân sự 48 · bảng phòng ban (tên + số người, thêm/xoá dòng) · diện tích sàn 620m² + tầng + trần/lưới cột/hướng kính · panel "Đối chiếu" sống: diện tích cần 486/620, "Dùng 78%", đạt/thiếu theo CHỖ CẦN (làm việc·họp·chung) + "Chuẩn đang dùng" | Một phần, KHÁC HÌNH THÙ: `AiBriefPanel.tsx` (557d, quy trình 3 bước mô tả→`LayoutSpec`→dựng) + `lib/cad/ai-assist.ts` (kích thước chuẩn/công năng). KHÔNG có màn nhập cấu trúc phòng-ban/số-người, KHÔNG có panel đối chiếu diện tích cần↔có trước khi bố trí | **Mock đi trước**: form đề bài CÓ CẤU TRÚC + đối chiếu đạt/thiếu TRƯỚC khi bố trí (mock ghi rõ "panel phải hiện Đạt") — code đi thẳng từ mô tả chữ sang bố trí, không có bước đối chiếu. Khớp G-M5-11 vế "panel 3 bước nằm lọt trong màn vẽ" — còn đúng về code, SAI về "không có mock" ⇒ **(p3-02)** | [B1] |
| **Kết quả chia khu.dc** (G-M5-12) | Mặt bằng tô màu theo khu (làm việc·họp·chung) + bảng kiểm từng khu (diện tích·số chỗ·đạt chuẩn m²/người, 6/7 đạt, khu trượt nêu lý do "thiếu 0,1m²/chỗ") + tổng 594m²·91 chỗ·86% | **Chưa có màn nào**. Nền tảng có mảnh: `lib/cad/dxf-plan.ts` (lõi cứng thang/WC — "vùng cấm động khi chia khu"), `ai-assist` bố trí phòng — nhưng không có bước ZONING theo chương trình lẫn bảng kiểm khu. (`ZonePanel` trong app = zone MÀU trình bày, việc khác — đúng ghi chú GAP) | **G-M5-12 CÒN ĐÚNG vế code** (chưa có màn), SAI vế "không có mock" ⇒ **(p3-03)**. Mock là hợp đồng sẵn để code đuổi theo | [B1] |
| **Bảng món nội thất.dc** (G-M5-08) | Bảng N món nhóm theo PHÒNG: ảnh·mã(LT-01…)·tên·hoàn thiện·nhà cung cấp·đơn giá·SL·thành tiền · trạng thái CHỜ DUYỆT tô nhạt · tổng theo nhóm · Thêm món · Xuất PDF/xlsx · tìm theo mã/tên/NCC | Tầng DỮ LIỆU đã đủ (06/08): `lib/ffe/item.ts` (FfeItem instance vs `ProductSpec` catalogue) · `lib/ffe/sheet.ts` (bảng chuẩn ngành + Ô DUYỆT pending/approved/rejected + xuất .xlsx có ảnh qua `lib/boq/xlsx`) · node `util.ffetable` (`lib/nodes/defs/ffe-table.ts`, xâu N khối = bảng N món). **UI MÀN BẢNG chưa có** — grep `FfeItem|FfeTable|ffetable` trong `components/*.tsx` = 0 nơi render bảng | **Mock đi trước đúng 1 tầng: MÀN UI.** Dữ liệu + xuất đã sẵn, thiếu màn render + nút duyệt bấm được ⇒ **(p3-04)**. G-M5-08 lỗi thời một nửa (viết trước 06/08 khi chưa có lib/ffe) | [B1] |
| **Phiên bản hồ sơ.dc** (G-M5-06) | So bản 03↔04 cạnh nhau (Chia đôi/Đè lên nhau) · đánh dấu 4 chỗ đổi (tím=thêm/sửa, đỏ=bỏ) có chú thích từng chỗ · dấu ĐÃ GỬI KHÁCH không sửa được nữa · NHÁP NỘI BỘ · ghi chú cho bản · danh sách Bản 01→04 người-phát-hành/ngày | DB có `FlowVersion` (snapshot nghiệp vụ, `schema.prisma:221`) + `lib/flow-version-retention.ts`. **KHÔNG có UI nào**: so 2 bản, đánh dấu chỗ đổi, dấu phát hành — grep = 0 | **Mock đi trước gần trọn màn** — chỉ tầng snapshot DB là có ⇒ **(p3-05)**. G-M5-06 còn đúng vế màn, sai vế "không mock" | [B1] |
| **HopXuatPDF.dc** (G-M5-04) | Hộp Xuất PDF: khổ A0-A3 + Ngang/Dọc · tỉ lệ in theo từng khung nhìn "1:1 giấy" · checklist TRƯỚC KHI XUẤT (PURGE đã chạy · về gốc 0,0 · layer đúng bảng nét · ⚠️ VP-02 chưa khoá · cỡ chữ theo tỉ lệ) · "Xuất 3 tờ ra PDF" / "Chỉ xuất tờ đang mở" | `CadSheets.tsx:63` có hộp "Xuất PDF theo tờ giấy" + `paperSizeMm`/orientation; `lib/cad/pdf.ts` vector plot 1:N thật (STATUS P4). **Checklist trước-khi-xuất chưa có** (grep PURGE = 0) | Lệch 1 mảnh: checklist tiền-xuất (5 mục, có trạng thái cảnh báo) ⇒ **(p3-06)**. 🔴 **G-M5-04 tả SAI hiện trạng mock**: "khổ giấy hiện `{{ }}`, vùng xem trước rỗng" — mở bằng shim thì ĐỦ nội dung; cái hỏng thật là THIẾU `support.js` (bệnh G-M5-05), không phải mock rỗng | [B1] |
| **ToGiay.dc** (G-M5-04) | Tờ giấy paper-space: vùng in được · VP-01/02 1:50 (ĐÃ KHOÁ/CHƯA KHOÁ) · VP-03 1:20 · ô trống "kéo khung nhìn vào" · CHỖ ĐẶT KHUNG TÊN ghi rõ "nội dung do `titleBlockPro()` sinh — `lib/cad/commands.ts:347`, mock không dựng" | `Sheet`/`Viewport2D` đã khai kiểu (`lib/cad/model.ts`, NC-13 B1) + `titleBlockPro()` thật; **UI paper-space thật (đặt/khoá viewport trên tờ) chưa có** — D1 multi-sheet mới là tab-bay-camera | Mock đi trước: thao tác đặt khung nhìn lên tờ + khoá VP ⇒ gộp vào **(p3-07)** cùng Chế độ Chuyên | [B2] |
| **BangNetIn.dc** (G-M5-04) | Bảng nét khi in: mm theo layer (0.50→0.09) · toggle Bản màu/Đen trắng + câu "trước khi giao khách đổi sang đen trắng kiểm lại độ đậm" | `lib/cad/pdf.ts` có lineweight ISO 128 + sàn 0.1mm (STATUS P4). **UI bảng nét chỉnh được + chế độ in đen trắng chưa có** (grep "đen trắng/monochrome" = 0) | Mock đi trước: UI bảng nét + in đen trắng ⇒ **(p3-08)**. 🔴 **TRUNG TÍNH**: mock chứa chữ **"Checklist TTT"** (`BangNetIn.dc.html`, câu mô tả đầu trang) — tên studio lộ trong hợp đồng giao diện, cửa kiểm HEX-TTT không bắt được vì chỉ soi hex ⇒ **(p3-09)**, cần Design sửa mock (p3 không được sửa) | [B1] |
| **BangTron.dc** (G-M5-04) | Bảng tròn (radial menu) cho bút: Bút·Chữ·Hình·Đo·Gôm·Hoàn tác quanh tâm | **Chưa có** — grep "bảng tròn/marking/pressure" trong `components/cad/` = 0 | Mock đi trước trọn mảnh (đi cùng Chế độ Phác thảo dưới) ⇒ nhập vào **(p3-10)** | [B1] |
| **Thư viện.dc** (G-M5-05) | MỘT sheet 6 ổ (thanh trên 42 · cột kệ 214 · vùng thẻ · cột thông số 236 · dock 58 · trạng thái 26) · 6 kệ (Vật liệu 248·Đồ đạc 412·Khối ba chiều 96·Ký hiệu bản vẽ 64·Mẫu hồ sơ 18·Bộ nhận diện 7) · scope Của tôi/Của studio/Dự án này/Kho chung · thẻ ATLAS/TỰ TẠO · cột thông số khi chọn | `LibrarySheet` (components/library — vùng p5) chạy thật trong app, NHƯNG kệ khác taxonomy (kệ theo CHẶNG: Preset dựng ảnh/Template moodboard/… + KỆ CHUNG) và scope khác (Tất cả/Chung/Studio/Chặng này/Dự án này/Gần đây) | 🟢 **G-A-04 ĐÃ HẾT HIỆU LỰC** — đo lại: 2 `<dc-import>` trỏ file ma nay chỉ còn trong HTML COMMENT (dòng 172, 289, tự ghi "[06/08 · gỡ G-A-04]"), lưới thẻ + cột thông số đã nằm NGAY TRONG file, mở ra ĐỦ nội dung (ảnh chụp). Lệch còn lại: taxonomy kệ mock (6 kệ theo LOẠI, khớp chốt `.idfc` 07/08 "Cấu kiện·Vật liệu·Node·Ảnh tham chiếu") ↔ code (kệ theo chặng) — cần TỔNG phân xử bản nào theo bản nào ⇒ **(p3-11)**, vùng p5 | [B1] |
| **Xem cấu kiện.dc** (G-M5-02) | Chọn 1 vật trên bản vẽ → panel phải: tên (Cột C2 · trục C giao 2) · badge **KHAI BÁO** vs **Suy đoán** (đúng K3) · kích thước · thuộc tính (vật liệu·màu·layer·chịu lực·phòng/vị trí·mã) | `CadEditor.tsx:2585` có ô gán BIM (storey+elementType) cho selection; `:1063` có nơi tiêu thụ `report.elementTypes` (suy đoán theo layer) | Gần khớp về DỮ LIỆU; lệch về HÌNH THÙ panel (mock là inspector cấu-kiện đầy đủ có badge khai-báo/suy-đoán từng THUỘC TÍNH; code là ô gán gộp). G-M5-02 đã 🟠 thu hẹp từ 06/08 — xác nhận phần thiếu thật vẫn là trang CỬA riêng + trang KHỐI + lịch sử sửa | [B1] |
| **2D Kỹ thuật.dc** (G-M5-03) | 3 thời điểm cùng màn 2D: chọn entity ("Đã chọn: Tường ngăn · Delete để xoá") · vẽ tường bám trục + ô nhập số nổi cạnh con trỏ (3 600) · 6 lớp/1 ẩn/1 khoá · X·Y trạng thái | `CadCanvas.tsx` có dynamic input (`:81 dynBuf`, `:517`), snap/bám trục, select/delete, LayerPanel ẩn/khoá | **Khớp cao** — không thấy lệch lớn ở mức đối chiếu này. Về G-M5-03 (3 bản CAD shell cùng tiêu đề): 3 file trùng đều mang hậu tố `_cu` (`mock-cad-shell-v3/v4/v5_cu.html`) — quy ước "bản cũ" ĐÃ có trong tên file, cái thiếu là tiêu đề `<title>` bên trong chưa đổi theo ⇒ luật ⑪ mới của cửa kiểm nay BẮT được (xem VIỆC 2) | [B1] |
| **Chế độ Chuyên.dc** (G-M5-03) | Mô hình ↔ **Giấy**: tờ trong hồ sơ (A-101/201/501 + khổ) · khung nhìn VP trên tờ với tỉ lệ riêng + khoá · khung tên do `titleBlockPro()` | Kiểu `Sheet`/`Viewport2D` + tab multi-sheet (D1/D2) + PDF plot có thật; **không gian Giấy tách khỏi Mô hình như một MODE chưa có UI** | Mock đi trước: paper space UI ⇒ **(p3-07)** | [B1] |
| **Chế độ Phác thảo.dc** (G-M5-03) | Vẽ bút thật: nét theo LỰC NHẤN · nhấn giữ 500ms mở BẢNG TRÒN · giữ yên để nắn thẳng · tì tay không ra nét · pointercancel lùi được · dock trái Bút/Hình/Cung/Gôm/Đo/Chữ | `CadCanvas.tsx` có pointerdown/move nhưng **0 chỗ đọc `.pressure`**, không bảng tròn, không nắn-thẳng-khi-giữ-yên | **Mock đi trước trọn cụm bút/cảm ứng** ⇒ **(p3-10)** (gộp BangTron). Sketch mode hiện = công cụ chuột giống Pro | [B1] |
| **3D Dựng khối.dc** | (đối chiếu đầy đủ đã có ở `docs/M-3D-OUT.md` VIỆC 1-2, phiên trước) | Vỏ ~2100 dòng thật + `ToolDock3D` đã bù | Không lặp lại ở đây — xem M-3D-OUT | [B2 phiên trước] |

---

## VIỆC 2 — sửa cửa kiểm `scripts/check-mocks.mjs`

**Số đo TRƯỚC**: `npm run check:mocks` → **86 file quét · 28 file ĐỎ · 64 loại lỗi · 261 lần vi phạm**
**Số đo SAU**:  → **104 file quét (96 html gồm `_archinote/` + 5 file không-HTML + 3 tài sản ngoài) · 75 file ĐỎ · 149 loại lỗi · 892 lần vi phạm**
(Số đỏ TĂNG là ĐÚNG MỤC ĐÍCH — cửa trước đây mù 5 kiểu hỏng + mù đệ quy; nay nhìn thấy.)

- **G-M5-17**: `walkDir()` đệ quy + bỏ lọc `.html` (PDF/ảnh/md đếm vào tổng, luật chữ chỉ áp
  `.html/.htm`) + `EXTRA_ASSETS` quét kèm 3 tài sản ngoài `docs/mocks/` đang được tài liệu gọi là
  nguồn thiết kế (`docs/IF-design-system-seed.html` · `if-chang2-mockup.html` · `if-vitals-visual.html`
  ở gốc repo — đã `ls` xác nhận tồn tại).
- **G-M5-16** — 5 luật mới, MỖI LUẬT đo hiện trạng trước khi viết (số ghi trong docstring):
  ⑦ `THEME-SAI-TU-VUNG` — selector `[data-theme=…]` ngoài light/dark (đo: `kem` 36 lần · `paper`/`night` 3 mỗi loại, 12 file dính);
  ⑧ `PLACEHOLDER-LO` — chữ PLACEHOLDER > trần 2 (nhãn-vùng-tạm hợp lệ 1-2 chỗ; đo: 62·28·23·21/trang, 29 file dính);
  ⑨ `RUOT-TEN-COMPONENT` — `&lt;TênComponent` lộ trong thân trang (đo: 1 file `mock-avatar-picker-v2.html`);
  ⑩ `PHU-THUOC-MANG` — script/link/@import/url() trỏ Internet + cộng điểm `@latest` (đo: đúng 8 file trong mocks như sổ ghi + 2 tài sản ngoài; 1 file ghim `@latest` = `mock-mood-collab-g2-2026-08-03.html` unpkg lucide);
  ⑪ `TRUNG-TIEU-DE` — luật XUYÊN FILE sau vòng quét, nhóm ≥2 file cùng `<title>` đỏ cả nhóm (đo: 3 file CAD shell cùng tiêu đề + 7 nhóm khác, 17 file dính).
- Kiểm tay 3 mẫu theo §0y: `@latest` thật (`unpkg.com/lucide@latest`) · `[data-theme="kem"]` thật
  (`mock-if-thu-vien-trong.html`) · `&lt;AvatarRenderer` thật (`mock-avatar-picker-v2.html`) — khớp.

## VIỆC 3 — liệt kê, KHÔNG sửa

### G-M5-14 — trang thiếu nhánh theme SÁNG (đo lại 07/08: **33 file**, không còn là 19 — số sổ
trôi vì mock mới thêm sau lần đo cũ; tiêu chí đo: `grep -c '\[data-theme="light"\]'` = 0)
7 file họ `Canvas-*.dc.html` · `InteriorFlow 01/02/03/05 *.html` (4) · `Kéo thả.dc.html` ·
`mock-avatar-picker-v2` · `mock-cad-revit-2026-08-03` · `mock-cad-shell-pro_cu` ·
`mock-cad-shell-v2/v3/v4/v5_cu` (4) · `mock-if-3chang` · `mock-if-anh-dai-dien-v2` ·
`mock-if-bang-cong-cu-3d` · `mock-if-cai-dat-v2` · `mock-if-cong-tac` ·
`mock-if-du-an-v2` · `mock-if-intro-bong-hoi-tu-2026-08-03` · `mock-if-thu-vien-trong` ·
`mock-if-ve3d` · `mock-material-sphere-2026-08-03` · `mock-trinh-boq-2026-08-04` + 10 file
`_archinote/` (app song song, nền KEM SÁNG mặc định — thiếu nhánh TỐI, cùng bệnh chiều ngược).
⚠️ Trong đó 10 file dùng `[data-theme="kem"]` — vừa 1-theme vừa sai từ vựng (luật ⑦ mới bắt).
**KHÔNG tự vẽ lại** — việc Claude Design.

### G-M5-15 — app song song (đo lại: PHẦN LỚN ĐÃ XỬ LÝ, sổ lỗi thời)
10 trang ArchiNote nay đã nằm gọn trong **`docs/mocks/_archinote/`** (10 file, `ls` xác nhận) —
thư mục con mà cửa kiểm CŨ không quét tới (không đệ quy) nên sổ không biết. 0 file ở GỐC mocks còn
mang tiêu đề ArchiNote (grep title = chỉ 6 kết quả, toàn trong `_archinote/`). Còn sót: 3 file
TRONG `_archinote/` vẫn mang tiền tố `mock-if-*` (mock-if-cai-dat/du-an/anh-dai-dien.html — tiền
tố app này, ruột app kia, đúng 3 file sổ tả).
**Đề xuất quy ước tiền tố** (chờ Hoà duyệt, KHÔNG xoá/đổi tên file nào):
1. Gốc `docs/mocks/` = CHỈ InteriorFlow. App khác sống trong thư mục con `_<tên-app>/`.
2. Trong `_<app>/`, tên file KHÔNG mang tiền tố `if-`/`mock-if-` (3 file trên cần đổi tên khi Hoà gật).
3. `<title>` phải khai đúng app (`… · ArchiNote`) — luật ⑪ mới sẽ lộ trùng-tiêu-đề giữa bản cũ/mới.

### G-M5-07 · G-M5-10 — đo lại theo §0ab trước khi tin
- **G-M5-07 CÒN ĐÚNG**: mock cửa-sổ-công-cụ bốc tách/đo món = 0 (grep "bốc tách/đo món" toàn bộ
  96 html chỉ khớp `Nhập bản vẽ có sẵn` — ngữ cảnh khác; `Bảng món nội thất.dc` là BẢNG KẾT QUẢ,
  không phải tool window; `tool-window-sketch2photo.html` tả việc khác đúng như sổ ghi).
- **G-M5-10 CÒN ĐÚNG**: mock kho vật liệu / cửa nhập bảng tính (ghép cột) / bảng màu sơn = 0
  (grep cả nội dung lẫn tên file NFC-normalize).

---

## ĐỀ XUẤT DÒNG GAP MỚI (TỔNG gom theo §0u — p3 KHÔNG tự ghi GAP-IF.md)

| Mã tạm | Nội dung | Bằng chứng |
|---|---|---|
| p3-01 | Nhập bản vẽ HÀNG LOẠT (thư mục/60 tệp, lịch sử lần nạp có mã, hoàn tác theo lần nạp, chạy nền) — mock đặc tả đủ, code mới 1 tệp/lượt | mock `Nhập bản vẽ có sẵn.dc.html` ↔ `components/cad/CadEditor.tsx:743` |
| p3-02 | Form đề bài có cấu trúc (phòng ban·số người·diện tích) + panel đối chiếu ĐẠT/THIẾU trước bố trí — chưa có màn | mock `Nhận đề bài.dc.html` ↔ `components/cad/AiBriefPanel.tsx` |
| p3-03 | Màn kết quả chia khu + bảng kiểm chuẩn m²/người — chưa có màn (mock có) | mock `Kết quả chia khu.dc.html` ↔ grep zoning = chỉ `lib/cad/dxf-plan.ts` nền |
| p3-04 | MÀN bảng món nội thất — tầng dữ liệu ĐỦ (`lib/ffe/*` + node `util.ffetable`), thiếu đúng UI render + nút duyệt | mock `Bảng món nội thất.dc.html` ↔ grep `FfeItem` trong components = 0 nơi render |
| p3-05 | UI phiên bản hồ sơ: so 2 bản, đánh dấu chỗ đổi, dấu phát hành — DB có `FlowVersion`, UI = 0 | mock `Phiên bản hồ sơ.dc.html` ↔ `prisma/schema.prisma:221` |
| p3-06 | Checklist TRƯỚC-KHI-XUẤT PDF (PURGE·gốc 0,0·bảng nét·VP khoá·cỡ chữ) | mock `HopXuatPDF.dc.html` ↔ grep PURGE components/cad = 0 |
| p3-07 | Paper space UI (Mô hình↔Giấy, đặt/khoá viewport trên tờ) — kiểu dữ liệu có, mode chưa | mock `Chế độ Chuyên.dc.html`+`ToGiay.dc.html` ↔ `lib/cad/model.ts` Sheet/Viewport2D |
| p3-08 | UI bảng nét in + chế độ in đen trắng | mock `BangNetIn.dc.html` ↔ grep monochrome = 0 |
| p3-09 | 🔴 TRUNG TÍNH: chữ "TTT" lộ trong 2 mock (`BangNetIn.dc.html` "Checklist TTT" · `mock-if-intro-C3.html` comment) — cửa kiểm chỉ soi hex, không soi TÊN; mock là hợp đồng nên chữ này sẽ được port theo | grep "TTT" docs/mocks = 2 file |
| p3-10 | Cụm bút/cảm ứng chặng Phác thảo: lực nhấn (`.pressure` = 0 chỗ đọc), bảng tròn 500ms, nắn thẳng khi giữ yên, chống tì tay | mock `Chế độ Phác thảo.dc.html`+`BangTron.dc.html` ↔ `components/cad/CadCanvas.tsx` |
| p3-11 | Taxonomy kệ Thư viện: mock 6 kệ theo LOẠI (khớp chốt `.idfc` 07/08) ↔ code kệ theo CHẶNG — cần phân xử, vùng p5 | mock `Thư viện.dc.html` ↔ `components/library/LibrarySheet` |
| p3-12 | Sổ GAP xác nhận LỖI THỜI thêm 3 dòng: G-A-04 (dc-import ma → ĐÃ GỠ 06/08, comment trong chính mock) · G-M5-04 (mock "rỗng" → chỉ thiếu support.js) · G-M5-15 (10 trang app song song → đã dời `_archinote/`) | xem VIỆC 1 + VIỆC 3 |

## Còn treo / CHƯA VERIFY (N5)
- 12/15 mock chỉ mở 1 theme (tối) — theme sáng chỉ kiểm 3 mock (`Nhập bản vẽ` `ToGiay` + `BangNetIn`
  mở mặc định sáng). Các mock 1-theme dùng shim gạt được nhưng chưa chụp đủ 2×15 ảnh — khối lượng,
  không phải chặn. Danh sách nào cần ảnh đủ 2 theme thì TỔNG chỉ định, p3 bổ sung nhanh (server
  shim còn dựng lại được 1 lệnh).
- Đối chiếu `Thư viện.dc` với code p5 dừng ở mức taxonomy/scope (không đo px từng ổ — vùng p5).
- Server tạm `python3 http.server 8791` (PID nền) — đã dùng xong, Hoà không cần giữ; kill bằng:
  `pkill -f "http.server 8791"`. File shim + 15 bản copy nằm trong scratchpad phiên, tự huỷ theo session.
- V6: KHÔNG commit. File p3 sửa: `scripts/check-mocks.mjs` (duy nhất). File mới: `docs/M-MOCK-OUT.md`.
  **p3 không ghi byte nào vào `docs/mocks/`** (chỉ đọc + copy RA scratchpad). ⚠️ `git status
  docs/mocks/` KHÔNG sạch — nhưng toàn bộ các dòng M/?? ở đó (`Thư viện.dc.html` ·
  `mock-if-cong-tac.html` · `README-mocks.md` · file mới `3D Dựng khối.dc.html`…) đã có sẵn trong
  snapshot git status ĐẦU PHIÊN (phiên khác đang làm việc trên cùng cây — 3 phiên song song), không
  phải của p3. Đối chiếu được: mọi lệnh ghi của p3 đều nằm trong transcript, không có lệnh nào
  đích đến `docs/mocks/`.
