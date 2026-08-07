# PHIẾU H2 · LỖI VỎ — studio · notebook · photo-editor · commands

Vùng sở hữu: `components/studio/` · `components/notebook/` · `components/photo-editor/` · `lib/commands/`.
**KHÔNG** đụng `components/nodes/`, `components/present-editor/` (phiếu H1 đang mở ở đó).
Luật: V6 KHÔNG commit · §0u ghi `docs/M-VO-H2-OUT.md` · G2 · G4 · G6 · N6 · N8.
⚠️ §0aa — lỗi runtime trình duyệt: kiểm `.next/static/chunks/` trước khi đổ cho code.

## VIỆC — theo mã trong `docs/GAP-IF.md`
- `G-M20-08` (132) · `G-M20-09` (133) · `G-M20-12` (136)
- `G-M13-03` (103) — `components/print/` **chưa mount**. Nối vào đường xuất, hoặc khai thẳng là code chết + đề xuất xoá. **Không để lửng.**
- `G-M12-01` (100) — **`components/` che phủ test 0%** (71.004 dòng code / 170 dòng test), trong khi `lib/` đạt 43%. Không đòi phủ hết: chọn **3 component rủi ro cao nhất** (đường tiền / đường mất dữ liệu / đường xuất file), viết test cho 3 cái đó, ghi rõ vì sao chọn.

Đọc đúng dòng trong `GAP-IF.md` trước khi sửa.

## VERIFY
Bấm thật từng chỗ đã sửa (N6). Test mới phải **có răng**: thêm một ca đối chứng chứng minh test fail được khi code sai.

## HÀNG ĐỢI (§V7) — bắt buộc cuối lượt
