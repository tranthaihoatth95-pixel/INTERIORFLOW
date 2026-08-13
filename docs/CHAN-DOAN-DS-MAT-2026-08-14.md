# CHẨN ĐOÁN DS BẰNG MẮT — T tự chụp toàn stage 14/08 (Hoà chê: "giao diện rất xấu, không thống nhất")

> Cách đo: browser pane chụp 7 màn (3D-Node desktop · 2D desktop+hẹp · Trình chiếu hẹp ·
> Files hẹp · Gallery hẹp · Materials/PBR desktop · Home hẹp) + đo computed style bằng JS.
> Mỗi finding gắn tội danh [N1/Đ5] + luật DS bị phạm. Khổ hẹp 732px ≈ tablet dọc — LỚP THAO
> TÁC đã chốt, không phải ca phụ.

## A · BUG HỆ THỐNG — sửa máy được ngay, không cần ảnh tham khảo

| # | Finding | Bằng chứng | Tội | Luật phạm |
|---|---|---|---|---|
| A1 | **CẢ APP RƠI VỀ TIMES khi font Geist không tải** — đo thật: `document.fonts` = geistSans **unloaded**, `computed body font = "Times"`. Chuỗi font-family KHÔNG có fallback sans ⇒ người dùng font tải chậm/hỏng (Electron offline, first paint) thấy toàn serif lệch — chính là cảnh "xấu, không thống nhất" nặng nhất trong loạt chụp | JS đo tab thật 14/08 | ①⑦ | DS: typography một hệ; FOUT không phanh |
| A2 | **Status bar đè chữ khổ hẹp**: pill Vitals đè lên "Đã lưu lúc 01:30" thành "ĐãVlialsúc" — cả 2D lẫn Trình chiếu | ảnh 2D hẹp + Present hẹp | ① | vỡ đọc được; pill absolute-center không né 2 cánh |
| A3 | **Files vỡ bố cục khổ hẹp**: card dung lượng ĐÈ lên tiêu đề "Files" + mô tả wrap 1-từ-1-dòng trong cột ~80px; toggle grid/list nổi đè card | ảnh Files hẹp | ① | grid thiếu breakpoint, không min-width |
| A4 | **331 giá trị radius ngoài thang** (13 giá trị lẻ) — máy soi:hinh-hoc đếm sẵn, hàng đợi từ H3; đây là phần "bo tròn từ tâm" Hoà nhắc | soi:hinh-hoc 13/08 | ⑦ | thang 6/10/14/20 + concentric §2d |
| A5 | **Chuỗi EN/jargon sót trong UI**: tooltip "Run node (+ upstream)" · "Tự sắp xếp graph (auto-layout)" · "Dynamic Input BẬT (F12)" | read_page 3D + ảnh 2D | ③ | SPEC-NGON-NGU: cấm jargon lộ UI, VI trước |
| A6 | **"Đang mở nơi khác" đỏ thường trực** ở status bar — màu cảnh báo cho trạng thái không nguy hiểm, ngồi cạnh "Đã lưu" gây nhiễu | ảnh 2D + Present | ④ | LightState: ánh sáng CHỈ mang nghĩa trạng thái; đỏ = nguy |

## B · THIẾU THỐNG NHẤT CẤU TRÚC — cần chuẩn hoá theo khuôn (đợi ảnh tham khảo Hoà để chốt hình dáng, nhưng bảng kê đã xong)

| # | Finding | Màn |
|---|---|---|
| B1 | **Ba stage ba khuôn thanh công cụ**: 2D = chip dropdown bo 10 hàng ngang · Trình chiếu = chip to wrap 4 hàng + gạch dọc "\|" lửng lơ giữa nhóm · 3D = dock capsule đáy. Cùng là "hàng lệnh đầu màn" mà 3 hình thái | 2D·Present·3D |
| B2 | **Empty-state 2 khuôn**: 2D = card nổi giữa canvas (đúng đẹp) · Files/khác = text thô. Chưa một khuôn EmptyState chung | 2D vs Files |
| B3 | **Hàng nút lặp per-thumbnail** ở dải slide (4 nút ↑↓⧉🗑 dưới TỪNG thumb) — rườm, nên hover-reveal hoặc gom vào context | Present |
| B4 | **Nhãn rail dọc xoay** (LỚP/KHỐI/TRANG/THƯ MỤC/GALLERY) là pattern chung tốt — giữ; nhưng khoảng cách/độ mờ chưa đồng nhất giữa màn | tất cả |
| B5 | Tab chặng vẫn sáng "Thiết kế 3D" khi đứng ở Files/Gallery (trang cấp APP, không thuộc chặng) — ngữ cảnh sai | Files·Gallery |
| B6 | Toolbar Trình chiếu: cụm "Xuất" accent đậm đứng giữa các chip thường + separator lửng — trật tự thị giác chưa kể đúng chuyện (hành động chính/phụ lẫn) | Present |

## C · GHI NHẬN ĐÚNG (giữ, đừng sửa lung tung)
Gallery đứng vững khổ hẹp (chip wrap gọn, card nguồn/giấy phép rõ) · PBR editor mới (RnaPanel) nhóm collapse sạch · khuôn node card 3D đồng nhất · bậc Sơ phác/Chuyên + dock 2D nhóm nhãn rõ.

## KẾ HOẠCH (đợt DS #1 — máy trước, mock sau)
1. **DS-A (agent, chạy ngay):** A1 font-fallback + A2 statusbar + A3 Files hẹp + A5 chuỗi EN + A6 hạ đỏ→trung tính. Không đổi hình dáng gì khác.
2. **DS-R (agent, chạy ngay):** A4 rút 331 radius ngoài thang về thang 6/10/14/20 + concentric (rInner = max(4, rOuter − pad), concentric chỉ khi pad ≤ 8 — chốt 12/08), đổi THẬN TRỌNG theo nấc gần nhất, soi:hinh-hoc làm thước.
3. **Nhóm B:** đợi ảnh tham khảo Hoà gửi → chốt khuôn (thanh công cụ một khuôn 3 stage · EmptyState chung · thumbnail strip) → mock Claude Design/Figma (file Figma `InteriorFlow · Design System` y421AJBWVpqGVvJ3vTn2wO có sẵn) → phiếu áp.

## BỔ SUNG 14/08 tối — 2 finding Hoà nêu trực tiếp (tội ③ lỗi thao tác)
| # | Finding | Chẩn |
|---|---|---|
| B7 | **Vị trí nút/toolbar chưa smart — thao tác rời rạc, di chuột khắp màn mới xong việc** (Hoà) | Đúng hệ quả L1 (3 khuôn toolbar) + chưa áp NT-1 (tool nổi SÁT VẬT theo selection) + chưa quy hoạch quãng đường chuột (Fitts: lệnh hay dùng phải gần nơi đang làm). Vào phạm vi mock KB-1: toolbar một khuôn + floating-tools-theo-chọn + đo quãng chuột trước/sau trên 3 tác vụ mẫu |
| B8 | **MVP chặng 3 chôn sâu: "800 bước mới tới AI", ô AI nửa prompt nửa form** (Hoà) | Đường thật hiện nay: mở chặng → picker loại → TaskFirstStart (3 lối, KHÔNG có lối Magic) → editor → panel phải tab Thiết kế → cuộn card "Magic tạo hồ sơ" (GenerateFlow.tsx:148) → thêm ảnh → chạy = 6-7 bước. Chốt 07/08 đã cho auto-deck-1-click + người duyệt ⇒ Magic phải là MỘT LỐI NGAY TaskFirstStart; ô nhập tách 2 vai rõ: PROMPT-BAR AI đúng nghĩa (ref K12/C9 — 3 pin AI-prompt-bar) ≠ form dữ liệu. Entry `present-magic-cua-vao` |
