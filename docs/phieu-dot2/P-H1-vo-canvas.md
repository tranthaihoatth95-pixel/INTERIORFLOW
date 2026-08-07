# PHIẾU H1 · LỖI VỎ — canvas · node · present-editor

Vùng sở hữu: `components/nodes/` · `components/present-editor/` · `components/FlowCanvas.tsx`.
**KHÔNG** đụng `components/studio/`, `components/notebook/`, `components/photo-editor/` (phiếu H2 lấy phần đó).
Luật: V6 KHÔNG commit · §0u ghi `docs/M-VO-H1-OUT.md` · G6 (nút quyết định có CHỮ) · G8 (kéo-thả không là đường duy nhất) · N6 (phải chứng minh có nơi mount) · N8.
⚠️ §0aa — lỗi runtime trình duyệt: kiểm `.next/static/chunks/` trước khi đổ cho code.

## LOẠI LỖI (đều rẻ, cùng một họ — gộp được)
① **nuốt lỗi im lặng** — `catch {}` rỗng, hoặc gọi mạng không `catch` (9 chỗ, `G-M13-01` `GAP-IF.md:101`). Người dùng bấm, không có gì xảy ra, không ai biết vì sao.
② **nút không khoá khi đang chạy** — bấm 2 lần ra 2 việc.
③ **hàm viết xong chưa nối UI**.
④ **kéo-thả là đường duy nhất** (trái G8).

## VIỆC — theo mã trong `docs/GAP-IF.md`
- `G-M13-01` (101) — 9 chỗ gọi mạng không catch. Với mỗi chỗ: hoặc hiện lỗi cho người dùng thấy, hoặc ghi log kèm lý do. **Không để rỗng.**
- `G-M20-01` (125) · `G-M20-02` (126) · `G-M20-04` (128) · `G-M20-05` (129)
- `G-M20-06` (130) · `G-M20-07` (131)
- `G-NB-03` (119)

Đọc đúng dòng trong `GAP-IF.md` trước khi sửa — **không đoán nội dung từ mã**.

## CÁCH LÀM
Sửa theo cụm cùng loại, không sửa lẻ từng file: gom hết ca ①, xong mới sang ②. Mỗi ca ghi `file:dòng` trước và sau.

## VERIFY
Mở trình duyệt thật, **bấm thật** từng nút vừa sửa (N6). Chụp ảnh. Không kết luận từ grep.

## HÀNG ĐỢI (§V7) — bắt buộc cuối lượt
