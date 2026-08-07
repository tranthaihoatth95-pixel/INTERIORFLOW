# PHIẾU · LÀN C — APPLY DESIGN: IN / GIẤY / XUẤT (4 màn · BUILD)
### Dán TRỌN file này vào MỘT phiên. Nguồn: `docs/mocks/*.dc.html`

## LUẬT CHUNG
- **V6**: KHÔNG commit. Hoà commit.
- Phóng **1 agent làm + 1 agent phản biện**.
- **N7**: `grep -a` trước khi sửa (grep thường nuốt byte lạ — §0t).
- Token lấy từ `:root` của chính file `.dc` → thêm vào `app/globals.css` (đủ Tối/Sáng). **CẤM hardcode hex/px.**
- Nghiệm thu = **render màn thật, chụp, ĐẶT CẠNH `.dc`** → khớp mới xong (N6).
- Ghi kết quả vào `docs/M-APPLY-C-OUT.md`. **KHÔNG sửa `GAP-IF.md`** (§0u).
- ⚠️ Đây là màn app CHƯA có → **dựng mới** theo `.dc`. Chỉ tạo file mới trong territory in/giấy/xuất. **KHÔNG chạm node, cad, library** (làn khác giữ).

## QUY TRÌNH 6 BƯỚC — mỗi màn
1. `grep -a` xác nhận app CHƯA có màn này (tránh dựng trùng).
2. `grep -a` token `--*`, `@keyframes`, layout trong file `.dc`.
3. Ghi cấu trúc `.dc` định dựng (khối · nút · dữ liệu).
4. Copy token thiếu từ `.dc :root` → `globals.css`.
5. Dựng component mới bám token (0 hardcode), nối vào chỗ hợp lý (nút xuất/paper của chặng trình bày/CAD).
6. Render đặt cạnh `.dc` → chụp → khớp. Ghi M-OUT.

## 4 MÀN

**Màn 7 · HopXuatPDF** → hộp thoại xuất PDF. Nguồn `docs/mocks/HopXuatPDF.dc.html`.
App mới có `ExportPptxButton` (PPTX). Dựng hộp thoại: chọn khổ giấy · danh sách tờ · vùng xem trước · nút xuất.

**Màn 8 · BangNetIn** → bảng nét in (lineweight). Nguồn `docs/mocks/BangNetIn.dc.html`.

**Màn 9 · BangTron** → dựng theo `docs/mocks/BangTron.dc.html` (đọc kỹ nội dung file trước — nhỏ, 5KB).

**Màn 10 · ToGiay** → khung tờ giấy / khổ in. Nguồn `docs/mocks/ToGiay.dc.html`.
Present layer đã có (`components/present/*`) — nối khung giấy vào đó, không dựng trùng viewer.

## XONG KHI
4 màn render khớp 4 `.dc` · nối được vào luồng (nút mở ra đúng) · ghi `docs/M-APPLY-C-OUT.md`. KHÔNG commit.
