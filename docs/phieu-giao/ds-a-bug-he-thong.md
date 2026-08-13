# PHIẾU GIAO · DS-A — 5 bug hệ thống từ CHAN-DOAN-DS-MAT (A1 A2 A3 A5 A6)

## THẺ VAI [Đ4]
- **VAI:** DA — agent sửa bug DS hệ thống, đợt Đồng-bộ-DS #1 (Hoà đặt 14/08).
- **PHẠM VI/TRẦN:** cấp Đ. Vùng: `app/globals.css` + `app/layout.tsx` (font config) · file status bar (grep `Đã lưu lúc` / `Đang mở nơi khác`) · màn Files (`app/files/**` + `components/filemanager/**`) · các file chứa đúng 3 chuỗi A5 · báo cáo.
- **BIÊN → DỪNG:** KHÔNG đổi radius/spacing/hình dáng gì ngoài 5 mục · KHÔNG đụng logic · thấy thêm bug ngoài phiếu thì GHI, không sửa.
- **ĐIỀU KHOẢN RUỘT:** [T0] đo trước sửa sau · [N1] tội ①③④⑦ · SPEC-NGON-NGU (VI trước, cấm jargon).

## ② ĐỌC TRƯỚC
`docs/CHAN-DOAN-DS-MAT-2026-08-14.md` mục A (bằng chứng từng bug) · `app/layout.tsx` + `app/globals.css` (cách khai font Geist hiện tại) · SPEC-NGON-NGU-CHI-DAN (từ điển nội bộ→người dùng).

## ④ VIỆC
1. **A1 font fallback:** mọi khai `font-family` dựa Geist phải có chuỗi fallback sans đầy đủ (`var(--font-geist-sans), -apple-system, 'Segoe UI', Roboto, system-ui, sans-serif` — thứ tự chuẩn); kiểm next/font config có `fallback`/`adjustFontFallback`; mono tương tự (fallback `ui-monospace, Menlo, monospace`). Kiểm bằng cách giả lập font fail (JS xoá/chặn) → chữ phải còn SANS.
2. **A2 statusbar hẹp:** pill Vitals không được đè 2 cánh — sửa layout (flex thật thay absolute-center, hoặc ẩn/gọn text khi hẹp qua container query/token `--tap` sẵn có). Kiểm ở 732px.
3. **A3 Files hẹp:** grid thêm breakpoint — dưới ~900px card dung lượng xuống DƯỚI header, mô tả không được wrap cột 80px; toggle không đè card. Kiểm 732px + desktop không đổi.
4. **A5 chuỗi:** "Run node (+ upstream)" → "Chạy khối (kèm khối nguồn)" · "Tự sắp xếp graph (auto-layout)" → "Tự dàn bảng" · "Dynamic Input BẬT (F12)" → "Nhập số theo con trỏ BẬT (F12)" — qua tr() nếu chỗ đó có i18n; grep thêm biến thể cùng cụm trong CÙNG file, ngoài file không lan.
5. **A6:** "Đang mở nơi khác" đỏ → màu trung tính `--t3/--muted` + icon 👁/⧉ (thông tin, không cảnh báo); giữ đỏ CHỈ khi xung đột ghi thật (nếu có state đó thì phân nhánh, không thì thôi).

## ⑤⑥⑦⑧
KHÔNG git/server/dep · tsc 0 · soi:tu-dien + soi:thao-tac + soi:hinh-hoc không lệch mới · verify 5 mục trên browser pane server 3000 (không login: 2D/Present cần login thì đo bằng khổ hẹp route được phép + đọc code, khai thật) · báo cáo `docs/bao-cao-phien/2026-08-14-DA-ds-bug.md` (ảnh/số từng mục trước-sau) · dây máy: entry `dong-bo-ds-mat` (T flip khi cả đợt xong).
