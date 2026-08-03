# SPEC — EDITOR BẢNG TÍNH / BOQ (loại hồ sơ #3)
**COWORK-TRÌNH lập 04/08 · mở khoá nhờ `NC-spreadsheet-nhung-2026-08-02` (đọc trọn) + `NC-xuat-pdf-in` phần in.**
**Đủ 3 bước §0b:** SEARCH = grep `lib/boq` thật (`49ebadd`: model·compute·cache·from-project·xlsx·route — 12 file 1322 dòng, test 24/24+20/20) · NGHIÊN CỨU = NC-3 (Airtable/Notion/Grist, có nguồn + than phiền) · NGƯỜI DÙNG THẬT = QS/kỹ sư dự toán VN sống trong Excel, cần số ₫ chính xác, ghét số chết.
**Người code:** G4 (UI editor) + PHU (2 việc lib §8). Nền: `SPEC-MODE-PER-STAGE` §4 dòng 3 — "spreadsheet, dự toán TỰ SINH, nền SEMANTIC-MODEL §7 (vùng tô m²+matId)".

## §1 · TUYÊN BỐ MÔ HÌNH (NC#1 — ghi để không ai đòi Excel về sau)
**BOQ editor KHÔNG phải Excel.** Mô hình = **records-có-schema, công thức theo CỘT** (con đường cả Airtable·Notion·Grist đã chứng minh; cell-ref `B4` là nồi phức tạp có án lệ than phiền). Dòng = hạng mục vật liệu từ `BoqRow` (`lib/boq/model.ts:40` — matId·ten·ncc·ma·m2·donGia·haoHutPhanTram·thanhTien·entityIds). Không tham chiếu ô, không tham chiếu ngang bảng — TUYÊN BỐ ngay trong UI lần đầu mở (khuôn mách nước ≤12 từ).

## §2 · NGUỒN DỮ LIỆU — TỰ SINH, KHÔNG NHẬP TAY TỪ ĐẦU
- Bấm tạo BOQ → `POST /api/boq/[projectId]` (route có sẵn) → `BoqResult{rows, errors, totalAmount}`.
- **Lỗi là dữ liệu hạng nhất:** `BoqError` (missing-specId · spec-not-found · missing-priceVnd · overlapping-region) đã có `message` tiếng Việt → hiện thành **banner đếm lỗi + dòng lỗi riêng cuối bảng**, mỗi lỗi kèm nút hành động ("Gán mã ATLAS" / "Tách vùng chồng lấn"). KHÔNG cộng vùng lỗi vào tổng (engine đã đúng vậy — UI không được che).
- `entityIds` mỗi dòng: v1 tooltip liệt kê vùng tô; v2 nút "Xem trên bản vẽ" (cần CAD expose select-by-entityIds — hỏi CHINH, KHÔNG hứa trước).

## §3 · CỘT — SCHEMA CỐ ĐỊNH + CỘT THÊM CÓ TRẦN (NC#2·#8)
| Nhóm | Cột | Kiểu |
|---|---|---|
| Cố định (từ BoqRow, không xoá được) | STT · Tên · Mã SKU · NCC · Khối lượng m² · Đơn giá ₫ · Hao hụt % · Thành tiền | Computed/Reference — sửa theo luật §5 |
| Người dùng thêm (**trần 30 cột, công bố NGAY trong nút thêm cột**) | tuỳ | đúng **6 kiểu chép Grist-tối-giản**: Text · Numeric (currency ₫, ngăn nghìn, 0-2 số lẻ, `(-)` kế toán) · Integer · Choice (m²·m·md·cái·bộ·tấm…) · Reference→matId · Computed |
- Nhập sai kiểu: **cho nhập + highlight lỗi ở cell** (pattern Grist), không chặn cứng, không mất số đang gõ (NC#6).
- Format VND mặc định: ngăn nghìn, 0 số lẻ, tabular-nums (`SPEC-DESIGN-SYSTEM-IF` §2c).

## §4 · CÔNG THỨC THEO CỘT — HIỂN THỊ "ƒx" (NC#3)
- Click header cột Computed → thấy công thức dạng chữ: `thành_tiền = khối_lượng × đơn_giá × (1 + hao_hụt%)`.
- **Mini-DSL đúng 4 thứ:** `+ − × ÷` · tham chiếu cột CÙNG DÒNG (tên cột không dấu cách hoặc chọn từ dropdown) · `ROUND(x, n)` · `IF(đk, a, b)`. KHÔNG Python, KHÔNG cell-ref, KHÔNG cross-row — né depth-limit surprise kiểu Notion. **PHU thẩm định độ khó parse TRƯỚC khi vào phiếu code** (NC ghi rõ giới hạn này).
- Cột cố định `thanhTien` engine đã tính (`compute.ts`) — UI chỉ HIỂN THỊ công thức, không cho sửa công thức cột cố định v1.

## §5 · LIVE-LINK = TRIGGER-FORMULA KIỂU GRIST (NC#4 — phát minh đáng chép nhất) ⭐
- Cột **Khối lượng m²**: máy tính từ vùng tô (from-project) nhưng **SỬA TAY ĐƯỢC**. Sửa xong: cell thành dữ liệu + **badge chấm màu "đã sửa tay" + nút revert về số máy** — đúng `CHOT-TACH-AI-VA-CHINH-TAY` (tách bằng DẤU + TRUY VẾT, không bằng vị trí).
- Reload/CAD đổi: cell CHƯA sửa tay → cập nhật theo CAD; cell ĐÃ sửa tay → giữ nguyên + cảnh báo nhỏ nếu số máy nay khác ("máy tính 42,5 — bạn đang giữ 40").
- Đơn giá: từ ProductSpec/ATLAS nếu có (chỉ-đọc qua Reference); nhập tay được với cùng cơ chế badge.

## §6 · GROUP + SUBTOTAL = SUMMARY-BAR, KHÔNG PHẢI CÔNG THỨC (NC#5)
- Group theo: phòng/zone · tầng · hạng mục (Choice). Mỗi group 1 **dòng subtotal do ENGINE tính** (sum m²·thành tiền) + grand total = `totalAmount`.
- **Công thức KHÔNG đọc được subtotal** — né từ đầu cái bẫy Airtable (formula không ăn group-sum), khỏi ai vấp giữa chừng. Pivot/summary-table thật = v2 nếu cần.

## §7 · KHÔNG LÀM (NC#10 — chặn phạm vi ngay trong spec)
Relation/rollup đa bảng · pivot tự do · công thức Python · cell-ref · view board/gallery · đơn vị tính ngoài m² ở cột máy (`MaterialSpecLite.unit` thuần hiển thị v1 — `model.ts:29` ghi rõ, KHÔNG rẽ nhánh logic).

## §8 · XUẤT (NC#9 + NC-xuat-pdf-in)
1. **xlsx:** subtotal/group = dòng thật mang công thức `SUM()` Excel sống (QS sửa tiếp không vứt file) — `lib/boq/xlsx.ts` đã có, **PHU kiểm 1 lần output hiện tại có SUM() sống chưa**, chưa thì đó là việc lib #2.
2. **Bản in PDF:** 2 preset "In văn phòng" (A4/A3 RGB 300dpi) / "Gửi nhà in" (+3mm bleed+crop marks+1 dòng thật về RGB) theo NC-pdf#1#2#5; **mọi chữ qua `lib/pdf-font.ts`** (luật font Việt NC-pdf#3, thêm ca test "ẳ ỹ ợ"); chữ không flatten (NC-pdf#7).

## §9 · BA MẢNG §0c (thiếu 1 = 🔴)
1. **Phím tắt:** mũi tên di cell · Enter sửa/xuống · Tab phải · ⌘Z undo · ⌘K palette có "Tạo BOQ/Thêm cột/Xuất xlsx" · `:focus-visible` rõ.
2. **Lệnh tương tác:** status bar mách trạng thái ("3 vùng lỗi — bấm để xem" · "đang sửa tay 2 ô").
3. **Cảm ứng:** `--row 44` qua `(hover:none)and(pointer:coarse)` (nền `globals.css:1030`); badge/revert bấm được bằng chạm (nút hiện sẵn khi cell selected, KHÔNG chỉ-hover).

## §10 · NGHIỆM THU
| # | Kiểm | Đạt khi |
|---|---|---|
| 1 | Dự án demo có vùng tô đủ 4 loại lỗi | banner + dòng lỗi đúng message engine, tổng KHÔNG gồm vùng lỗi |
| 2 | Sửa tay 1 ô m² → đổi CAD → reload | ô sửa tay giữ + cảnh báo; ô khác cập nhật; revert về đúng số máy |
| 3 | Group theo phòng | subtotal từng phòng + grand total = totalAmount engine |
| 4 | Xuất xlsx mở bằng Excel thật | SUM() sống, sửa 1 số → subtotal Excel tự đổi |
| 5 | Thêm cột thứ 31 | UI báo trần 30 NGAY, không lỗi ngầm |
| 6 | 3 mảng §0c + 2 theme | đủ, kiểm bằng tab-walk + tablet |

*COWORK-TRÌNH 04/08 (giờ máy 02/08 23:2x). Append-only. Mini-DSL §4 + SUM() §8 chờ PHU thẩm định trước khi thành phiếu code.*
