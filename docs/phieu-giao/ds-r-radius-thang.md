# PHIẾU GIAO · DS-R — rút 331 radius ngoài thang về thang bo + đồng tâm (A4 CHAN-DOAN-DS-MAT)

## THẺ VAI [Đ4]
- **VAI:** DR — agent hình học, đợt Đồng-bộ-DS #1, phần "góc bo tròn từ tâm" Hoà nhắc đích danh 14/08.
- **PHẠM VI/TRẦN:** cấp Đ. Vùng: các file `soi:hinh-hoc` liệt kê có giá trị ngoài thang (components/** + app/**) + báo cáo. ⛔ KHÔNG đụng: `app/globals.css` · file status bar · `app/files/**` · `components/filemanager/**` · 3 file chuỗi A5 (agent DA vừa sửa — đọc báo cáo `2026-08-14-DA-ds-bug.md` để biết danh sách chính xác file phải né; file nào DA đã đụng thì BỎ QUA radius trong đó, ghi hàng đợi).
- **BIÊN → DỪNG:** KHÔNG đổi kích thước/padding/màu — CHỈ radius · giá trị nào đổi nấc làm hình dáng đổi RÕ (chênh >4px hoặc capsule↔bo) thì GIỮ + ghi hàng đợi mắt, không tự quyết.
- **ĐIỀU KHOẢN RUỘT:** [Đ5 tội ⑦] · chốt 12/08: thang 6/10/14/20 + `--r-full` 999 + concentric rInner = max(4, rOuter − pad), CHỈ khi pad ≤ 8 · [T6] soi:hinh-hoc là thước — số ngoài-thang phải GIẢM MẠNH, ghi số trước/sau.

## ② ĐỌC TRƯỚC
`npm run soi:hinh-hoc` (danh sách thật hôm nay — đừng tin số 331 cũ) · `scripts/soi-hinh-hoc.mjs` (đọc cách đếm + thang) · `docs/00-CHOT.md` mục "[12/08 Hoà gật 3...] Thang bo DUYỆT: 6/10/14/20..." · tiền lệ H3 13/08 (radius 442→335, đổi theo nấc gần nhất, không ép var).

## ④ VIỆC
1. Chạy soi:hinh-hoc, lấy bảng giá trị lẻ × file. Với TỪNG giá trị lẻ: map về nấc gần nhất (≤2px chênh = đổi thẳng; 3-4px = đổi + ghi danh sách cho duyệt mắt; >4px = GIỮ + hàng đợi). Cặp lồng nhau (card chứa nút/ảnh) áp concentric khi pad ≤ 8.
2. Chạy lại soi:hinh-hoc — mục tiêu ngoài-thang giảm ≥60%; phần giữ lại phải có lý do từng nhóm trong báo cáo.
3. tsc 0 · không lệch mới ở soi:tu-dien/thao-tac · spot-check 3-4 màn trên browser pane (route không cần login) xác nhận không vỡ thị giác.

## ⑤⑥⑦⑧
KHÔNG git/server/dep · báo cáo `docs/bao-cao-phien/2026-08-14-DR-radius-thang.md` (số trước/sau + bảng giữ-lại-vì-sao) · dây máy: entry `dong-bo-ds-mat` phần A4 (T flip khi đợt xong).
