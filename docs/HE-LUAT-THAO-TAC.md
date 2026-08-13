# HỆ LUẬT THAO TÁC — kho luật máy-đọc + máy soi (P3, Hoà chốt 13/08/2026)

> Bệnh gốc: luật thao tác (hover không scale vật lớn, cấm auto-hide, reduce-motion thắng,
> panel kính phải portal…) nằm rải trong ~10 spec UI đã chốt — mắt người soi sót, đã 3 lần
> Hoà chê xấu vì phiên code không biết luật tồn tại. P3 biến luật thành MÁY, cùng cơ chế
> soi-frontier: registry máy-đọc + grep 2 chiều + exit 1.

## Cơ chế
- **Kho luật:** `scripts/thao-tac-registry.mjs` — mỗi luật 1 entry `{ id, toiDanh, luat, nguon, loai, soi }`.
  Luật CHƯNG CẤT từ spec đã chốt [Đ2], không sáng tác mới — `nguon` ghi rõ file chốt gốc [T0].
- **Máy soi:** `npm run soi:thao-tac` (`scripts/soi-thao-tac.mjs`) — cùng họ soi-frontier/hinh-hoc/tu-dien.
- Luật `loai:'grep'` soi 2 chiều [T6]: điều kiện `can:true` mất khớp = regress · mẫu CẤM có khớp
  = vi phạm (in file:dòng) · `mauCo/mauThieu` = file có A mà thiếu B (vd có `backdrop-filter`
  thiếu prefix Webkit). Có lệch → **exit 1**.
- Luật `loai:'mat'` không tính lệch — in **BẢNG NỢ NGHIỆM THU MẮT** nhóm theo tội danh [Đ6],
  dùng làm checklist khi duyệt mắt UI.

## 7 tội danh — 7 CẤM KỴ của TRIẾT LÝ IF [N1], gắn mọi luật/finding [Đ5]
| # | Tội danh |
|---|---|
| 1 | Lỗi giao diện |
| 2 | Tính năng xài hoài không ra chất lượng |
| 3 | Lỗi thao tác |
| 4 | Cảm giác GIẢ về nội dung |
| 5 | Gò ép — không module / không tuỳ chỉnh |
| 6 | Không phân loại group-by |
| 7 | Thẩm mỹ kém |

## Cách thêm luật — kỷ luật frontier
1. **Chốt luật UI mới = thêm 1 entry registry NGAY LÚC CHỐT**, trước khi code. Chốt không vào
   registry coi như chưa chốt (cùng kỷ luật frontier-registry 11/08).
2. Chọn `toiDanh` đúng 1 trong 7 · viết `luat` 1 dòng · `nguon` = file chốt gốc.
3. Grep được thì viết `soi` (kiểm pattern trên code thật trước, tránh false-positive ồ ạt —
   nhớ `[^'\n]` chặn mẫu vắt dòng). Grep KHÔNG sạch → hạ `loai:'mat'`, **cấm nới pattern cho
   sạch giả** [T0].
4. Máy soi tự bỏ qua 2 file registry/soi (không tự khớp chính mình).

## Cách đọc output
- `✅ id` — luật grep đang được code tôn trọng (canh regress).
- `🔴 id — [tội N · …]` kèm LUẬT/NGUỒN/file:dòng — lệch thật trong code app. Phiên soi KHÔNG
  tự sửa code app: ghi vào báo cáo cho T quyết (có thể là nợ có chủ ý hoặc false-positive cần phán).
- Khối `👁` — luật chỉ kiểm được bằng mắt, mang vào phiên duyệt-mắt-gộp cùng nợ mắt frontier.
- Dòng tổng: `🔴 X LỆCH (trên N luật grep) · 👁 Y luật chờ mắt`.

*LT lập 13/08/2026 theo phiếu `docs/phieu-giao/he-luat-thao-tac.md`. Entry frontier
`he-luat-thao-tac` do T flip sau audit.*
