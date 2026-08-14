# PHIẾU GIAO · DF — DOGFOOD C4 end-to-end trên app thật (checklist docs/dogfood/DF2)

## THẺ VAI [Đ4]
- VAI: DF — agent dogfood lái browser, chạy vòng tròn PDF→deck→✨→PDF trên app thật, tick checklist DF2.
- PHẠM VI/TRẦN: KHÔNG sửa code (trừ khi vòng gãy chết cứng — lúc đó DỪNG, báo T, không tự vá). Browser pane server 3000 (login cookie sẵn — KHÔNG nhập mật khẩu; login mất thì DỪNG báo T). Deck làm việc TỰ TẠO MỚI tên "DF2-C4" — ⛔ không đụng deck/flow nào khác (Hoà đang review song song).
- CHI PHÍ: tối đa 4 job fal (inpaint/mask) cho ẢNH BẾP (C4-1 proof) — vượt là dừng báo.
- ĐIỀU KHOẢN RUỘT: [T0] bước nào máy bước nào tay ghi thật · [T5] đủ phiếu duyệt trước áp · checklist xong mục nào TICK mục đó vào docs/dogfood/DF2-C4-WESTLAKE-NHIEM-VU-2026-08-14.md (file duy nhất được sửa, cùng báo cáo).

## ② ĐỌC TRƯỚC
docs/dogfood/DF2-C4-WESTLAKE-NHIEM-VU-2026-08-14.md (checklist + ràng buộc đèn ray GIỮ) · docs/bao-cao-phien/2026-08-14-{D2-vong-chinh,DP-proxy-pages}.md (nút ✨ ở đâu, prompt trang nhập gì) · mẹo pane: navigate xong screenshot tí hon thì đọc bằng read_page/js, tab mới nếu kẹt.

## ④ VIỆC (theo checklist, tick dần)
1. Trình chiếu → tạo deck "DF2-C4" → Mở tệp → `/Users/tranben/Downloads/260810_Westlake-Residential_Public-T1-2-3-KhoiNguGD1-A_C1_D1-VACHKINHBEP_KhoiNguGD2-B_C2_C3_C4-BanHang_D2_D4-FULL.pdf` → nhập trang `15-22` → soi deck: ảnh đúng chỗ, kho nhận ảnh (screenshot làm bằng chứng).
2. Mục 3 checklist (Thẻ DNA C4): ghi NHANH định hướng từ ảnh được khen (1 đoạn 5 dòng vào file checklist — công cụ DNA panel nếu với tới được thì dùng, không thì ghi tay, khai rõ).
3. Mục 2 checklist (BẾP – proof): click ảnh bếp → "Chỉnh phối cảnh ✨" → sang chặng 2 → mask (ưu tiên node Cắt nền tự động; vẽ tay tối thiểu) → PHIẾU duyệt (điền theo ý định C4-1: tách sắc độ 3 lớp, bộ màu sang, GIỮ đèn ray) → chạy inpaint (≤4 job) → về Trình chiếu bấm "Nhận ảnh đã chỉnh" → chứng minh ảnh thay ĐÚNG khung (screenshot trước/sau).
4. Mục 7: Xuất PDF từ deck → lưu bản sao về scratchpad (`.../scratchpad/DF2-C4-out.pdf` — tải file rồi cp) — T mở mắt.
5. Tick các mục đạt vào checklist + sổ findings DF2-F3… cho mọi vấp (UI khựng, bước thừa, chữ sai) — đây là VÀNG của dogfood.

## ⑦
Báo cáo docs/bao-cao-phien/2026-08-14-DF-dogfood-c4.md: từng bước máy/tay, số job đã dùng, findings, đường dẫn PDF out + screenshots. Trả về T ≤12 dòng.
