# PHIẾU · LÀN A — APPLY DESIGN: NODE + THƯ VIỆN (3 màn)
### Dán TRỌN file này vào MỘT phiên. Nguồn: `docs/mocks/*.dc.html`

## LUẬT CHUNG
- **V6**: KHÔNG commit. Hoà commit.
- Phóng **1 agent làm + 1 agent phản biện**.
- **N7**: `grep -a` trước khi sửa (grep thường nuốt byte lạ — §0t).
- Token lấy từ `:root` của chính file `.dc` → thêm vào `app/globals.css` (đủ Tối/Sáng). **CẤM hardcode hex/px.**
- Nghiệm thu = **render màn thật, chụp, ĐẶT CẠNH `.dc`** → khớp mới xong (N6).
- Ghi kết quả vào `docs/M-APPLY-A-OUT.md`. **KHÔNG sửa `GAP-IF.md`** (§0u).
- ⚠️ Chỉ đụng file trong bảng dưới. **KHÔNG chạm `lib/cad`, `components/cad`** (làn khác đang giữ).

## QUY TRÌNH 6 BƯỚC — mỗi màn
1. `grep -a` component đích → đọc token/animation/nhãn nó ĐÃ có.
2. `grep -a` token `--*`, `@keyframes`, nhãn trong file `.dc`.
3. Liệt kê **điểm lệch** (Design có / code thiếu) trước khi sửa.
4. Copy token + keyframe thiếu từ `.dc :root` → `globals.css`.
5. Vá cấu trúc/animation/nhãn vào component, dùng token (0 hardcode).
6. Render đặt cạnh `.dc` → chụp → khớp. Ghi M-OUT.

## 3 MÀN

**Màn 1 · Bảng nút** → `components/nodes/InteriorNode.tsx` + `components/FlowCanvas.tsx`
Đã diff sẵn — làm đúng 3 ý, khỏi mò:
- ① **màu cổng theo kiểu**: copy `--p-img/--p-mask/--p-mat/--p-num` từ `docs/mocks/Bảng nút.dc.html :root` → `globals.css`; tô Handle/port trong `InteriorNode.tsx` theo `DataType` (image/mask/mat/number).
- ② **dây đứt nét chạy**: copy `@keyframes bn-dash` từ `.dc` → `globals.css`; gắn `animation: bn-dash` cho path cạnh trong `FlowCanvas.tsx` (khi chạy/kéo).
- ③ **đếm "nối sai"**: đã có `isValidConnection` (`FlowCanvas.tsx:331`) → đếm edge sai kiểu, hiện ở thanh trạng thái: "N nút · M nối sai".

**Màn 2 · Nút tổng** → `components/nodes/MacroNodeFace.tsx` (+`MacroSelectionToolbar.tsx`, `MacroShelf.tsx`)
Tự diff theo QUY TRÌNH (macro = mặt gộp nhiều node). Nguồn: `docs/mocks/Nút tổng.dc.html`.

**Màn 3 · Thư viện** → `components/library/*` + `components/NodeLibraryPanel.tsx`
Tự diff. Nguồn: `docs/mocks/Thư viện.dc.html`. Lưu ý kiểm 4 kệ con: KeVatLieu · KeDoDac · KeDangGom · CotThongSo (mock từng thiếu).

## XONG KHI
`grep -a` 3 màn: token/animation/nhãn `.dc` đều có trong code · 3 ảnh render khớp 3 `.dc` · ghi `docs/M-APPLY-A-OUT.md`. KHÔNG commit.
