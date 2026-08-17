# PHIẾU V1 — VỎ ĐIỀU HƯỚNG: rail hai cụm, ba nấc

> Giao: T · 17/08 · chạy **SONG SONG** với V2. Nguồn cấu trúc chung: `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md`.
> ⛔ Vùng ghi: `components/nav/**` (tạo mới) · `components/AppShell.tsx` · `docs/mocks/mock-rail-hai-cum.html` · báo cáo.
> ⛔ **KHÔNG đụng**: `app/files/**` · `components/library/**` · `app/colors/**` (phiên **V2** giữ) · `scripts/` (phiên **W** giữ) · `components/entry/**` · `app/globals.css`.

## ⓪b TIỀN ĐỀ HẠ TẦNG
`git log --oneline -1` + `git rev-list --count HEAD..main`. Lệch > 0 → **DỪNG**, báo T.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — có quyền BÁC
> **TIỀN ĐỀ:** *"IF hiện **KHÔNG CÓ** component rail/sidebar nào. `/materials` chỉ được với tới từ
> 2 chỗ (màn cài đặt, lỗi BOQ). Nên đây là **dựng mới**, không phải sửa cái đang có."*

→ XÁC NHẬN / BÁC + file:dòng. Bác thì DỪNG.

## ① BỐI CẢNH
Hoà chốt 16/08: **sidebar là hệ router toàn app**, 3 chặng chỉ là một nhóm stage. Đo 17/08: chốt đó
**0 dòng code**. Tấm tổng 23 màn cho thấy app vẫn là các route rời không có bản đồ chung.

## ② ĐỌC TRƯỚC
`docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` (**toàn bộ — nguồn cấu trúc**) · `docs/IF-KIEN-TRUC.md` §2 §3 §7 §11 ·
`components/AppShell.tsx` · `docs/mocks/mock-sidebar-3-nac-home.html` (bản cũ, tham khảo hình thức) ·
`components/studio/StageSwitcher.tsx` (docstring tự khai *"trục điều hướng DUY NHẤT"* — **câu đó nay LỖI THỜI**, sửa docstring).

## ③ VIỆC
1. `components/nav/RailDieuHuong.tsx` — rail hai cụm đúng bảng §1 hợp đồng. Marker `[marker: railHaiCum]`.
2. **Ba nấc 28 / 240 / 320 = ba CÔNG NĂNG** (§5 hợp đồng). Mục nào không có gì để nhìn ở 320 thì **bỏ nấc đó cho mục đó**, khai rõ trong mã vì sao.
3. **Thu/mở NHỚ giữa các phiên** (localStorage). **Cấm auto-hide.**
4. Cụm DỰ ÁN khi chưa mở dự án: **mờ kèm lý do đọc được**, đi đường `aria-disabled` + `aria-describedby` (**KHÔNG** dùng `title` — câm trên cảm ứng, Tab bỏ qua; bài học 16/08).
5. **Chat · Họp chưa có trang** ⇒ mục vẫn hiện, **mờ kèm lý do**, không nút giả.
6. Sửa docstring `StageSwitcher.tsx` — đóng dấu câu "trục điều hướng duy nhất" là lỗi thời, trỏ sang rail.
7. Mock `docs/mocks/mock-rail-hai-cum.html` + `<!-- @dsCard group="Điều hướng" -->`: đủ **2 theme**, **3 nấc**, ca *chưa mở dự án*, token thật, **0 hex gõ tay**. Tự chấm `design:design-critique` + `design:accessibility-review`.

## ④ RÀNG BUỘC
§6 hợp đồng, **đặc biệt**: cấm đụng `--accent*` · sidebar không đổi theo chặng · nấc lưu theo máy ·
KHÔNG git ghi · KHÔNG dev server. Mã điều khoản: **mở `docs/TRIET-LY-IF.md` đọc số**, cấm chép.

## ⑤ ĐÍCH — trần 5 vòng
`tsc` 0 · `npm test` 0 fail · `soi:tu-dien` + `soi:hinh-hoc` không thêm lệch · mock tự chấm sạch ·
`grep -c "Bảng màu\|Kho vật liệu" mock-rail-hai-cum.html` = **0** (chúng KHÔNG lên rail).
Quá trần → DỪNG, nộp kèm bảng *vòng nào hỏng vì gì*.

## ⑥ BÁO CÁO
`docs/bao-cao-phien/2026-08-17-V1-vo-dieu-huong.md` — khuôn 6 phần + **⑦b CHƯA CHẮC** + **⑦c hạn dùng**.
