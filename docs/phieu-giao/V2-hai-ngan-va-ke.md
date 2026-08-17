# PHIẾU V2 — FILES HAI NGĂN · THƯ VIỆN CHIA KỆ · MÀU LÀ MỘT BƯỚC

> Giao: T · 17/08 · chạy **SONG SONG** với V1. Nguồn cấu trúc chung: `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md`.
> ⛔ Vùng ghi: `app/files/**` · `components/library/**` · `app/colors/**` · `docs/mocks/mock-files-hai-ngan.html` · `docs/mocks/mock-thu-vien-ke.html` · báo cáo.
> ⛔ **KHÔNG đụng**: `components/nav/**` · `components/AppShell.tsx` (phiên **V1** giữ) · `scripts/` (phiên **W** giữ) · `lib/materials/**` · `components/materials/**` · `app/globals.css`.

## ⓪b TIỀN ĐỀ HẠ TẦNG
`git log --oneline -1` + `git rev-list --count HEAD..main`. Lệch > 0 → **DỪNG**, báo T.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — có quyền BÁC
> **TIỀN ĐỀ:** *"`app/colors/page.tsx` hiện là **route riêng**, lối vào duy nhất là một nút trong
> `components/materials/MaterialsScreen.tsx:181`. Theo chốt Hoà 16/08, **màu là một BƯỚC trong chọn
> vật liệu**, không phải màn riêng."*

→ XÁC NHẬN / BÁC + file:dòng. Bác thì DỪNG.

## ① BỐI CẢNH
Hoà chốt 17/08: **Files có HAI NGĂN khác bản chất** — tệp của dự án ↔ **phần thô dùng chung**
(map texture · NCC · **range giá**, nhiều người góp, **chưa đủ định nghĩa để render**). Ngăn ② là
đầu vào của dòng chảy `Files → cửa sổ công cụ → Thư viện` (bản đồ §5) — xương sống của sản phẩm.

## ② ĐỌC TRƯỚC
`docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` (**toàn bộ**) · `docs/IF-KIEN-TRUC.md` §5 §6 §11 ·
`app/files/` · `components/library/` · `app/colors/page.tsx` · `components/materials/MaterialsScreen.tsx:181`.

## ③ VIỆC
1. **Files hai ngăn** đúng §3 hợp đồng — khác bản chất ⇒ **thấy được trên giao diện**, cấm rút thành bộ lọc. Marker `[marker: filesHaiNgan]`.
2. **Thư viện chia kệ** đúng §4: Vật liệu · Cấu kiện · Ảnh & tài sản · Mẫu & hồ sơ · Node. Gallery là **mặt tuyển chọn của kệ Ảnh**, không phải kệ riêng.
3. **Màu thành một BƯỚC trong chọn vật liệu.** Giữ `app/colors/page.tsx` sống (đừng xoá route — vỡ link cũ) nhưng **thôi là điểm đến độc lập**: nội dung của nó xuất hiện **trong luồng chọn vật liệu**. Khai rõ cách làm trong docstring.
4. Ngăn *phần thô* phải nói được **thiếu gì để render** — nối nghĩa với chỉ báo ba mặt vừa dựng (`lib/materials/ba-mat.ts`, **chỉ ĐỌC, không sửa**).
5. Hai mock + `<!-- @dsCard group="Thư viện" -->` / `group="Files"`: đủ **2 theme**, token thật, **0 hex gõ tay**, có ca **ngăn thô rỗng**. Tự chấm 2 skill design.

## ④ RÀNG BUỘC
§6 hợp đồng. **Đặc biệt**: cấm đụng `--accent*` · **range giá thuộc kho chung, giá chốt thuộc dự án** —
đừng trộn · KHÔNG git ghi · KHÔNG dev server. Mã điều khoản: **mở `docs/TRIET-LY-IF.md` đọc số**.

## ⑤ ĐÍCH — trần 5 vòng
`tsc` 0 · `npm test` 0 fail · `soi:tu-dien` + `soi:hinh-hoc` không thêm lệch · mock tự chấm sạch ·
hai ngăn Files **phân biệt được khi bỏ hết màu** (chứng minh bằng một hàng bỏ-màu trong mock).
Quá trần → DỪNG, nộp kèm bảng *vòng nào hỏng vì gì*.

## ⑥ BÁO CÁO
`docs/bao-cao-phien/2026-08-17-V2-hai-ngan-va-ke.md` — khuôn 6 phần + **⑦b CHƯA CHẮC** + **⑦c hạn dùng**.
