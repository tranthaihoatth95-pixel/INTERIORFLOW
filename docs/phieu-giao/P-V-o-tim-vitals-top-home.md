# P-V · Ô tìm dự án LÊN TOP + Vitals cạnh + Gỡ StageSwitcher

**Vai**: sub-agent build UI · vùng Home + AppChrome
**Mốc bàn giao**: `3da4b8c` (HEAD == main, agent P-V chạy trong cây chính T)

## ⓪ TIỀN ĐỀ
Giả định của T:
1. `ProjectSelect` (components/ProjectSelect.tsx) là component chứa ô search "Search name, note, project…" khi mount với prop `bentoBox`. Có thể tách phần Ô SEARCH ra thành component riêng để mount ở TOP mà không phá phần carousel/grid/card.
2. `VitalsPill` (components/home/widgets/VitalsPill.tsx) là pill/chấm hiện đang mount trong Home. Có thể mount ở AppChrome top bar cạnh ô tìm mà không đụng cử chỉ Vitals hiện tại.
3. `StageSwitcher` (components/studio/StageSwitcher.tsx) mount ở AppChrome.tsx:333. Gỡ được bằng cách xoá 3 dòng wrapper `<div className="shrink-0" data-tour="phase-switcher">...</div>`. Không có props nào khác trong AppChrome phụ thuộc `StageSwitcher` được import từ file khác.

Xác nhận [XÁC NHẬN | BÁC BỎ | KHÔNG BẰNG CHỨNG] cho từng giả định. Bác bỏ → DỪNG, báo T.

## ⓪b TIỀN ĐỀ HẠ TẦNG
`git rev-list --count HEAD..main` = 0 → PASS, làm tiếp.

## ① BỐI CẢNH
Hoà nói *"các màn không 1 màn nào ổn cả"* + *"2 nút góc trên là gì?"* (17/08 tối). Đo được 3 vấn đề Home:
- Vitals chấm không cạnh ô tìm (trái chốt 16/08)
- StageSwitcher 3 nút góc trên trùng cụm PROJECT trong sidebar
- Ô tìm dự án đang nằm sâu trong widget bento, tay phải chạy vào ô A mới tìm được

Chốt 16/08: *"Vitals ở Home = chấm tròn cạnh ô tìm kiếm"*. Chốt 16/08: sidebar là hệ router, ba chặng chỉ là 1 nhóm stage → StageSwitcher thừa.

Nghiên cứu 5 đối thủ (Notion/Linear/Figma/Miro/Framer) — 5/5 có ô tìm content ở TOP + ⌘K riêng cho lệnh.

## ② ĐỌC TRƯỚC
1. `components/ProjectSelect.tsx` — xem cấu trúc để tách ô search
2. `components/home/DongStudioHome.tsx:326,576` — chỗ mount ProjectSelect + VitalsPill
3. `components/home/widgets/VitalsPill.tsx` — xem props
4. `components/studio/AppChrome.tsx:332-334` — chỗ mount StageSwitcher
5. `docs/00-CHOT.md` mục 16/08 chốt Vitals cạnh ô tìm (dòng ~1028)

## ③ VÙNG FILE
Đụng: `components/ProjectSelect.tsx` (tách ô search), `components/home/DongStudioHome.tsx` (bỏ ô search khỏi widget), `components/studio/AppChrome.tsx` (thêm ô search top + Vitals cạnh + gỡ StageSwitcher wrapper).
KHÔNG đụng: mọi file khác.

## ④ VIỆC
1. **Tách ô search** từ `ProjectSelect.tsx` thành component riêng `SearchProjectsInput` (hoặc export sub-component). Giữ nguyên logic search, chỉ tách VIEW.
2. **Bỏ ô search khỏi widget dự án** trong bento Home (khi mount `bentoBox`, ô search không render nữa).
3. **Mount `SearchProjectsInput` ở AppChrome top bar** — cạnh chỗ hiện tại của StageSwitcher (giữa `flowName` và cụm VI/EN/Vitals).
4. **Mount `VitalsPill` cạnh ô search** trong AppChrome top bar (hiện đang mount trong DongStudioHome — di chuyển lên AppChrome, bỏ khỏi Home).
5. **Gỡ `StageSwitcher`** — xoá `<div className="shrink-0" data-tour="phase-switcher"><StageSwitcher ... /></div>` ở AppChrome.tsx:332-334. Xoá luôn import nếu StageSwitcher không dùng chỗ khác. KHÔNG xoá file `StageSwitcher.tsx` — giữ code, có thể dùng lại sau.
6. **Data-tour selector** — nếu có test/tour chỉ tới `[data-tour="phase-switcher"]`, đổi hoặc xoá reference.

## ⑤ RÀNG BUỘC
- KHÔNG git commit — T commit sau audit
- KHÔNG mở dev server mới (đã có port 3000 T đang dùng)
- Ô tìm ở top phải responsive: ≥1100px hiện full · <1100px thu icon kính lúp (theo luật cross-platform Home widget)
- Vitals cạnh ô tìm — CẠNH bên phải ô tìm, không trong ô, không dưới
- Không đổi hành vi search (thuật toán, thang điểm, kết quả) — chỉ đổi VỊ TRÍ
- TRÍCH mã điều khoản: [Đ2] nhìn vào trong trước (dùng lại ProjectSelect logic, không viết lại) · [T2] một cỗ máy nhiều mặt tiền (ô search có 2 mặt tiền: bento widget cũ vs top bar mới, cùng logic)
- Theme sáng + tối đều phải test

## ⑥ NGHIỆM THU TỰ LÀM
- `npm run tsc` 0 lỗi
- `npm run test -- ProjectSelect` — nếu có test, không fail
- Mở http://localhost:3000/ chụp screenshot desktop 1440×900: (a) ô tìm ở top có xuất hiện (b) Vitals cạnh ô tìm (c) 3 nút StageSwitcher biến mất (d) widget dự án bento không còn ô search bên trong
- Chụp thêm mobile <1100px xem ô tìm có thu về icon không

## ⑥b VÒNG TỰ ĐÓNG
Đích: 4 kiểm ở ⑥ đều PASS. Chưa PASS → tự sửa, trần 5 vòng. Quá trần → nộp bản chưa đạt + bảng "vòng nào hỏng vì gì". Cấm sửa test cho qua.

## ⑦ BÁO CÁO
Lưu `docs/bao-cao-phien/2026-08-17-P-V-o-tim-vitals-top.md` theo khuôn 6 phần. Kèm 4 screenshot ⑥ + diff các file sửa.

## ⑦b CHƯA CHẮC
Ghi mục bắt buộc, không rỗng.

## ⑦c HẠN DÙNG KẾT LUẬN
"Kết luận này hết đúng khi ProjectSelect refactor hoặc Vitals đổi cơ chế hoặc Home đổi bố cục bento."

## ⑧ DÂY MÁY
Entry registry liên quan: `vitals-3-window` · `home-bento`. Agent KHÔNG tự flip registry — T flip sau audit.
