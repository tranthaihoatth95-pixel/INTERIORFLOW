# KIEM-KE-MOCK-2026-08-06 — kiểm kê `docs/mocks/`, viết bởi COWORK-PHU (06/08/2026, 22:xx)

**Phạm vi:** CHỈ liệt kê/đọc `docs/mocks/`, TUYỆT ĐỐI không sửa/xoá/ghi đè file nào (đúng ràng buộc
phiếu VIỆC 5 — thư mục này thuộc phiên `3·apply-node`). Mọi con số dưới đây là `grep -a`/`stat` thật
chạy 06/08, không suy đoán. Đã có `docs/mocks/README-mocks.md` (227 dòng, audit trước đó, 03-06/08)
— file này KHÔNG lặp lại nó, mà **đối chiếu và chỉ ra 3 chỗ README đã LỆCH hiện trạng** (xem §0).

## 0. Ba phát hiện quan trọng nhất (đọc trước bảng dài)

### 0.1 `support.js` — hiện đúng **10/67** file bị chặn, không phải 16 như README ghi

`README-mocks.md:204` liệt kê 16 file khai `<script src="./support.js">`. Kiểm lại **bây giờ**
(`grep -al 'support.js' *.html`) chỉ còn **10 file** (khớp CHÍNH XÁC con số "10/67" trong phiếu
VIỆC 5 — G-M5-05): `Bảng món nội thất.dc.html` · `Bảng việc.dc.html` · `Kết quả chia khu.dc.html` ·
`Lịch việc.dc.html` · `Lịch · Nhắc việc.dc.html` · `Nhận đề bài.dc.html` · `Tiến độ dự án.dc.html` ·
`Tiến độ · Gantt.dc.html` · `Tổng quan dự án.dc.html` · `Xem cấu kiện.dc.html`.

6 file README liệt kê nhưng KHÔNG còn dùng `support.js` nữa (`grep -a -c 'support.js' <file>` = 0,
đã kiểm từng file): `mock-2d-ky-thuat_cu.html` · `mock-3d-frame.html` · `mock-3d-thong-nhat.html` ·
`mock-trinh-bay.html` · `mock-if-vitals-v2.html` (README ghi "Vitals v2.dc", không khớp tên file nào
hiện có — có thể đã đổi tên). ⇒ **README-mocks.md §"CHẶN CHUNG" đã LỆCH hiện trạng**, cần TỔNG cập
nhật lại (đúng §0i — chiếu dòng lệch sửa ngay khi phát hiện, TỔNG giữ quyền sửa file đó theo §0u).

`ls docs/mocks/support.js` → **vẫn không tồn tại** (xác nhận lại) — 10 file trên vẫn KHÔNG mở sạch:
nút đổi theme không chạy, `style-hover` chết, `{{ project }}`/`{{ themeLabel }}`/`{{ toggleTheme }}`/
`{{ fxLabel }}` in ra nguyên chuỗi `{{ }}` thay vì giá trị thật.

### 0.2 "Thư viện trỏ 4 trang con không tồn tại" (G-M5-05) — **ĐÃ ĐƯỢC SỬA, cùng ngày 06/08, trước khi phiếu này ra**

Mở `Thư viện.dc.html` (mtime 22:25:40, tức **~5 phút trước khi phiếu VIỆC 5 được giao lúc 22:30**):
dòng 172 và 289 có comment `[06/08 · gỡ G-A-04]` xác nhận 2 `<dc-import>` từng trỏ tới file KHÔNG
tồn tại (`KeVatLieu`, `CotThongSo`) đã bị **gỡ, nội dung port thẳng vào file** — `grep -a -n
'<dc-import' "Thư viện.dc.html"` giờ chỉ còn khớp 2 dòng, cả 2 đều nằm trong COMMENT (`<!--`), không
phải tag sống. Dòng 54 còn ghi thêm: 2 tên nữa (`KeDoDac`, `KeDangGom`) **chưa từng có `dc-import`
hay file thật** — chỉ là tên nhắc tới trong text, "lời hứa suông". Cộng lại đúng **4 tên** khớp con
số "4 trang con" trong phiếu — nhưng **cả 4 đều đã hết là vấn đề tính tới thời điểm viết file này**:
2 tên đã port nội dung vào ngay trong file, 2 tên còn lại chưa từng là link chết thật (chỉ là chữ).
⇒ **G-M5-05 phần "Thư viện" coi như đã đóng**, không cần việc thêm — báo TỔNG xác nhận lại con số
GAP chính thức.

### 0.3 Cụm "CAD shell" — README ghi `mock-cad-shell-v5.html` là bản chốt "được port", nhưng file đó **không còn tồn tại dưới tên đó**

`README-mocks.md:9` (mục ✅ HIỆN HÀNH): *"`mock-cad-shell-v5.html` — Shell chặng Vẽ bản chốt... được port"*.
Thực tế trên đĩa hôm nay: **không có file nào tên `mock-cad-shell-v5.html`** — chỉ có
`mock-cad-shell-v5_cu.html` (hậu tố `_cu` = "cũ"). Cả 5 file cụm CAD-shell cũ + `mock-2d-ky-thuat_cu.html`
đều có **CÙNG MỘT mtime giây** (`1786007938`, tức 06/08 16:18:58) — một thao tác đổi tên hàng loạt 6
file cùng lúc. Thao tác này diễn ra **40 giây sau** khi 2 file `Chế độ Chuyên.dc.html` (mtime
`1786007898` = 16:18:18) và `Chế độ Phác thảo.dc.html` (mtime `1786007911` = 16:18:31) được tạo —
2 file này nhiều khả năng là lý do trực tiếp khiến cụm cũ bị đánh dấu `_cu`. Riêng
`2D Kỹ thuật.dc.html` (mtime `1786005692` = 15:41:32) **được tạo SỚM HƠN 37 phút**, tức đã tồn tại
song song với bản `mock-2d-ky-thuat_cu.html` (chưa mang hậu tố lúc đó) một lúc trước khi bản cũ mới
bị gắn `_cu` — không thay đổi kết luận (bản mới thay bản cũ), chỉ sửa lại mốc thời gian chính xác.
Đọc `<title>` xác nhận nội dung khác nhau thật (không phải đổi tên suông): `mock-cad-shell-v5_cu.html`
title = *"IF · CAD shell v3 — đúng design system"* (chú ý: filename ghi `v5` nhưng title bên trong
vẫn ghi `v3` — bằng chứng cụm này tự nó đã lẫn lộn version trước khi bị đánh dấu `_cu`);
`2D Kỹ thuật.dc.html` title = *"IF · 2D Kỹ thuật"* (khớp tên chặng/mode CHỐT theo
`CHOT-TEN-CHANG-MODE-2026-08-03.md`, README chưa cập nhật theo bộ tên này ở mục ✅ HIỆN HÀNH).
⇒ **Suy luận có căn cứ (không phải khẳng định chắc — xem giới hạn ở §4):** hậu tố `_cu` là một phiên
nào đó (không rõ tên, không có commit vì luật V6 cấm phiên khác tự commit) đã TỰ QUYẾT cụm CAD-shell
cũ bị thay bằng bộ `.dc.html` mới, nhưng KHÔNG cập nhật `README-mocks.md` theo — đúng loại lỗi
"2 ngòi bút cùng ghi 1 sổ, không đồng bộ" mà §0u cảnh báo cho `GAP-IF`, ở đây xảy ra với chính
`README-mocks.md`.

## 1. Bảng đầy đủ — 20 file `.dc.html` mới nhất (cụm chưa có trong audit trước, tự kiểm lần đầu)

Cột "Mở sạch" = KHÔNG có `{{ }}` chưa resolve VÀ KHÔNG có `<dc-import>` sống trỏ file thiếu.

| File | mtime 06/08 | Size | H1/nội dung (grep thật) | Mở sạch? | Trùng với |
|---|---|---|---|---|---|
| `ToGiay.dc.html` | 15:39 | 6,4 KB | (đã PORT → `components/print/PaperSheetFrame.tsx`, xem README-mocks.md:220) | ✅ (không `{{`, không dc-import sống) | — đã thành code, đừng port lại |
| `Nút tổng.dc.html` | 16:00 | 76 KB | title "IF · Nút tổng" | ✅ | — |
| `Bảng nút.dc.html` | 16:00 | 55 KB | title "IF · Bảng nút" | ✅ | — |
| `BangTron.dc.html` | 16:00 | 5,2 KB | (đã PORT → `components/print/RadialToolMenu.tsx`, README:219) | ✅ | — đã thành code |
| `BangNetIn.dc.html` | 16:00 | 9,9 KB | (đã PORT → `components/print/LineweightTable.tsx`, README:218) | ✅ | — đã thành code |
| `HopXuatPDF.dc.html` | 15:41 | 10,5 KB | (đã PORT → `components/print/ExportPdfDialog.tsx`, README:217) | ✅ | — đã thành code |
| `2D Kỹ thuật.dc.html` | 16:18 | 80,7 KB | title "IF · 2D Kỹ thuật" | ✅ | thay thế `mock-2d-ky-thuat_cu.html` (§0.3) |
| `Chế độ Chuyên.dc.html` | 16:18 | 18,6 KB | title "IF · Chế độ Chuyên"; có `<dc-import name="ToGiay">`, `<dc-import name="BangNetIn">` — **cả 2 đều TRỎ ĐÚNG file tồn tại cùng thư mục** (kiểm: `ToGiay.dc.html`, `BangNetIn.dc.html` có thật) | ✅ mở sạch — dc-import hợp lệ | thay thế 1 phần cụm CAD-shell cũ (§0.3) |
| `Chế độ Phác thảo.dc.html` | 16:18 | 22,8 KB | title "IF · Chế độ Phác thảo" | ✅ | thay thế 1 phần cụm CAD-shell cũ |
| `Thư viện.dc.html` | 22:25 | 43,1 KB | không có `<title>` riêng; h1 không grep được (kiểm `<h1` = 0 khớp — có thể dùng heading khác) | ✅ (đã sửa, xem §0.2) | — |
| `Nhận đề bài.dc.html` | 21:15 | 36,1 KB | h1 "Nhận đề bài" | ❌ — dùng `support.js` (thiếu) + có `{{ toggleTheme }}`/`{{ project }}` chưa resolve | cụm quy trình 4 bước cùng batch 21:15-21:16 (không phải trùng lặp — 4 màn KHÁC NHAU của 1 luồng) |
| `Xem cấu kiện.dc.html` | 21:16 | 26,1 KB | h1 "Xem cấu kiện" | ❌ (cùng lỗi support.js) | nt. |
| `Bảng món nội thất.dc.html` | 21:16 | 31,9 KB | h1 "Bảng món nội thất" | ❌ (cùng lỗi) | nt. |
| `Kết quả chia khu.dc.html` | 21:16 | 27,0 KB | h1 "Kết quả chia khu" | ❌ (cùng lỗi) | nt. |
| `Lịch việc.dc.html` | 21:46 | 44,3 KB | h1 "Lịch việc" | ❌ (cùng lỗi) | **TRÙNG MÀN với `Lịch · Nhắc việc.dc.html`** — cùng h1 "Lịch việc" (xem §2) |
| `Tiến độ dự án.dc.html` | 21:46 | 25,1 KB | h1 "Tiến độ dự án" | ❌ (cùng lỗi) | có khả năng cùng chủ đề với `Tiến độ · Gantt.dc.html` (xem §2, chưa chắc trùng 1-1) |
| `Tổng quan dự án.dc.html` | 21:46 | 26,9 KB | h1 "Tổng quan dự án" | ❌ (cùng lỗi) | không thấy trùng rõ với file khác trong cụm |
| `Thư viện.dc.html` | (đã liệt ở trên) | | | | |
| `Tiến độ · Gantt.dc.html` | 22:27 | 59,9 KB | h1 "Tiến độ" (cắt, xem grep) | ❌ (cùng lỗi) | xem §2 |
| `Bảng việc.dc.html` | 22:27 | 41,5 KB | h1 "Bảng việc" | ❌ (cùng lỗi) | không thấy trùng rõ |
| `Lịch · Nhắc việc.dc.html` | 22:27 | 55,6 KB | h1 "Lịch việc" (giống hệt `Lịch việc.dc.html`) | ❌ (cùng lỗi) | **TRÙNG** — xem §2 |

## 2. Nhóm trùng lặp xác nhận được bằng NỘI DUNG (không chỉ đoán theo tên)

| Nhóm | File | Bằng chứng trùng | Kiến nghị bản chốt |
|---|---|---|---|
| **Lịch việc** | `Lịch việc.dc.html` (21:46, 44 KB) vs `Lịch · Nhắc việc.dc.html` (22:27, 55,6 KB) | `grep -a -o '<h1[^>]*>[^<]*' <file>` ra **CÙNG CHUỖI** `Lịch việc` cho cả 2 file — cùng 1 màn, bản sau lớn hơn ~11 KB | `Lịch · Nhắc việc.dc.html` — mtime MỚI HƠN 41 phút + kích thước lớn hơn (nhiều khả năng thêm phần "Nhắc việc" mà bản đầu chưa có, đúng như tên file gợi ý) |
| **Tiến độ** (nghi vấn, CHƯA CHẮC 1-1) | `Tiến độ dự án.dc.html` (21:46, 25 KB) vs `Tiến độ · Gantt.dc.html` (22:27, 59,9 KB) | H1 KHÔNG khớp y hệt (`Tiến độ dự án` so với `Tiến độ` cắt dòng do `line-height` khác — có thể do CSS đổi giữa 2 bản, cần mở mắt xem mới chắc). Cùng chủ đề "Tiến độ", size chênh lệch lớn (gấp 2,4 lần) gợi ý bản sau là bản MỞ RỘNG (thêm khối Gantt) chứ không hẳn "cùng 1 màn objectively identical" | **CHƯA ĐỦ CĂN CỨ để khẳng định 1 trong 2 là bản thay thế hoàn toàn** — cần TỔNG/Hoà mở cả 2 xem bằng mắt (đúng §0o — cấm nhận xét hình/UI khi chưa mở xem) trước khi quyết xoá bản nào |

**Không tìm thêm được cặp trùng nào khác bằng grep h1** trong cụm 20 file `.dc.html` — 4 file batch
21:15-21:16 (`Nhận đề bài`/`Xem cấu kiện`/`Bảng món nội thất`/`Kết quả chia khu`) có h1 khác nhau
hoàn toàn, nhiều khả năng là **4 bước của MỘT quy trình** (nhận đề bài → chia khu → xem cấu kiện →
bảng món nội thất), không phải bản trùng của cùng 1 màn — nhưng đây là suy luận theo tên+thứ tự
mtime liền nhau, **CHƯA VERIFY** bằng cách mở nội dung so sánh luồng thật.

⇒ Kết luận đối chiếu với "6 trang mô tả CÙNG 1 màn hình" trong phiếu (G-M5-03): phiên này grep xác
nhận được **CHẮC CHẮN 1 cặp trùng thật** (Lịch việc), **1 cặp NGHI VẤN** (Tiến độ), và **cụm CAD-shell
5+1 file cũ đã tự được đánh dấu `_cu`** (không phải "không biết chọn bản nào" như phiếu mô tả — vấn
đề bây giờ là README chưa cập nhật theo, không phải thiếu quyết định). Không đủ căn cứ xác nhận đủ
"6 trang" — có thể phiếu tính cả cụm CAD-shell (3 bản v3/v4/v5) cộng 3 trang còn lại chưa xác định
được qua vòng grep này; cần Hoà/TỔNG chỉ rõ thêm nếu còn nhóm nào phiên này bỏ sót.

## 3. Cụm `_archinote/` — đã tự tài liệu hoá, KHÔNG thuộc phạm vi dedup của InteriorFlow

`docs/mocks/_archinote/README.md` (đọc nguyên văn) đã tự giải thích: 12 file trong này thuộc app
**ArchiNote** (không phải IF), đã tách riêng để "khỏi lẫn vào lúc port UI của InteriorFlow", ghi rõ
3 file tiền tố `mock-if-*` (`mock-if-anh-dai-dien.html`/`mock-if-cai-dat.html`/`mock-if-du-an.html`)
dễ nhầm là IF nhưng thật ra `<title>` bên trong ghi "· ArchiNote", và IF đã có bản kế nhiệm riêng
(`mock-if-cai-dat-v2.html`/`mock-if-du-an-v2.html`/`mock-if-anh-dai-dien-v2.html` — cả 3 đều nằm
trong `docs/mocks/` chính, không phải `_archinote/`). Thư mục này **nằm ngoài phạm vi quét của
`scripts/check-mocks.mjs`** (ghi rõ trong README). ⇒ Không cần dedup thêm — README con đã làm đúng việc.

## 4. Danh sách 45 file còn lại — đã có audit trước, KHÔNG lặp lại (trỏ nguồn)

47 file `.html` gốc tiếng Anh (`mock-if-*`, `mock-cad-*`, `mock-trinh-*`, `vitals-*`, `avatar-picker`,
`tool-window-*`, `InteriorFlow 05 Máy quay.html`...) **đã được `README-mocks.md` phân loại đầy đủ**
thành 4 nhóm (✅ HIỆN HÀNH 9 file · 🕰 LỊCH SỬ · ⚠️ LỖI THỜI · phần audit A4 7-mock-màn-phụ) — phiên
này KHÔNG đọc lại từng file (đúng §0s, tránh đốt token lặp việc đã làm), CHỈ nêu 2 lệch đã tìm thấy
ở §0.1 và §0.3. Muốn tra 1 file cụ thể trong nhóm này: mở thẳng `README-mocks.md`, KHÔNG hỏi lại
phiên nào khác trước.

`InteriorFlow 05 Máy quay.html` (title "InteriorFlow · Máy quay", 48,9 KB, mtime cũ nhất trong toàn
thư mục 03/08) — **không thấy trong README-mocks.md** (grep tên file trong README = 0 dòng) — file
mồ côi khỏi mọi audit trước đó, chưa ai xếp loại. Cần TỔNG bổ sung 1 dòng cho nó vào README hoặc xác
nhận nó đã lỗi thời/có thể xoá.

## 5. Kiến nghị tổng hợp

1. **Đóng phần "Thư viện" của G-M5-05** — đã sửa xong 06/08, không cần việc thêm (§0.2).
2. **10 file `.dc.html` còn thiếu `support.js`** vẫn là GAP thật — chặn xem trước theme/hover, KHÔNG
   tự bịa `support.js` (không biết đúng hành vi gốc Claude Design định làm) — cần xin lại từ nguồn
   xuất (đúng khuyến nghị cũ của README).
3. **Cập nhật `README-mocks.md`** (việc của TỔNG, không phải phiên này) — 3 chỗ lệch: (a) danh sách
   16 file support.js nay chỉ còn 10, (b) `mock-cad-shell-v5.html` không còn tồn tại dưới tên đó,
   (c) `InteriorFlow 05 Máy quay.html` chưa được xếp loại.
4. **Cặp "Lịch việc"**: giữ `Lịch · Nhắc việc.dc.html` làm bản chốt (mới hơn, lớn hơn, cùng h1) —
   TỔNG xác nhận trước khi xoá bản cũ (`Lịch việc.dc.html`), phiên này không tự xoá.
5. **Cặp "Tiến độ"**: CHƯA đủ căn cứ chọn bản chốt — cần mở bằng mắt (đúng §0o), không quyết bằng grep.
6. **4 file batch "quy trình"** (Nhận đề bài/Xem cấu kiện/Bảng món nội thất/Kết quả chia khu): nghi
   là luồng nhiều bước chứ không phải trùng lặp — cần Hoà xác nhận ý đồ trước khi gộp hay tách.

## 6. Chưa kiểm chứng được / giới hạn phiên này

- Không mở render trực quan (Chromium/Playwright) bất kỳ file nào — mọi nhận định về "trùng màn
  hình" chỉ dựa trên `grep` chuỗi text (h1/title), đúng giới hạn NT3 (cần ảnh chụp cạnh file mới coi
  là xác nhận đầy đủ, phiên này không có ảnh chụp nào để đối chiếu).
- Cặp "Tiến độ" và cụm 4 file "quy trình" — nêu ở mức nghi vấn có căn cứ, KHÔNG khẳng định chắc.
- Không đọc nội dung sâu bên trong 47 file đã có README audit (tin README làm nguồn thứ cấp đã kiểm
  hợp lệ theo cách đọc trực tiếp trước đó của chính README, không phải tôi tự đọc lại — nếu cần độ
  tin cậy cao hơn phải tự mở lại, ngoài phạm vi thời gian phiên này).
- `if-design-system.pdf`, `library-mock-note.md`, `videoframe_2421.png` trong `docs/mocks/` — không
  phải `.html`, ngoài phạm vi bảng kiểm mock của VIỆC 5, chỉ ghi nhận có tồn tại.
