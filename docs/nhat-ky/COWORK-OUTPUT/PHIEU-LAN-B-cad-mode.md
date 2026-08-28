# PHIẾU · LÀN B — APPLY DESIGN: CAD + MODE (3 màn · PATCH)
### ⛔ CHỜ M1 BÁO XONG `lib/cad` RỒI MỚI THẢ (tránh đè). Dán TRỌN vào MỘT phiên.

## LUẬT CHUNG
- **V6**: KHÔNG commit. Hoà commit.
- Phóng **1 agent làm + 1 agent phản biện**.
- **N7**: `grep -a` trước khi sửa (§0t).
- Token từ `:root` của `.dc` → `app/globals.css`. **CẤM hardcode hex/px.**
- Nghiệm thu = **render đặt cạnh `.dc`** → khớp (N6).
- Ghi `docs/M-APPLY-B-OUT.md`. **KHÔNG sửa `GAP-IF.md`** (§0u).
- ⚠️ **XÁC NHẬN M1 XONG TRƯỚC**: `grep -a` M1-SUA-OUT / hỏi TỔNG. `CadEditor.tsx` + `CadCanvas.tsx` M1 đang giữ — đụng khi M1 còn chạy = đè nhau.

## QUY TRÌNH 6 BƯỚC — mỗi màn
1. `grep -a` component đích → token/animation/nhãn đã có.
2. `grep -a` file `.dc` tương ứng.
3. Liệt kê điểm lệch trước khi sửa.
4. Copy token/keyframe thiếu từ `.dc :root` → `globals.css`.
5. Vá vào component (dùng token, 0 hardcode).
6. Render đặt cạnh `.dc` → chụp → khớp. Ghi M-OUT.

## 3 MÀN — mode `cadMode='sketch'/'pro'` ĐÃ có (`CadToolbelt.tsx:29`), chỉ apply HÌNH

**Màn 4 · 2D Kỹ thuật** → `components/cad/CadEditor.tsx` + `CadCanvas.tsx`. Nguồn `docs/mocks/2D Kỹ thuật.dc.html`.
Đây là 2 file M1 vừa sửa → apply SAU cùng, cẩn thận không lật việc M1.

**Màn 5 · Chế độ Chuyên (Pro)** → `CadToolbelt.tsx` + `components/shell/ModeShell.tsx` (nhánh `cadMode==='pro'`). Nguồn `docs/mocks/Chế độ Chuyên.dc.html`.
Apply layout Pro vào nhánh mode sẵn có — không tạo mode mới.

**Màn 6 · Chế độ Phác thảo (Sketch)** → `components/cad/CadTouchDock.tsx` + `CadToolbelt` (`twoRows = cadMode==='sketch'`). Nguồn `docs/mocks/Chế độ Phác thảo.dc.html`.
Apply toolbar cảm ứng / radial menu từ `.dc`.

## XONG KHI
3 màn render khớp 3 `.dc` · mode switch vẫn chạy · ghi `docs/M-APPLY-B-OUT.md`. KHÔNG commit.
