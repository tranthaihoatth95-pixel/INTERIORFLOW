# LỘ TRÌNH XONG IF — làm TUẦN TỰ (chống trùng, chống quên)
### Dán vào phiên LOCAL. Làm từ trên xuống, **một mảng xong mới sang mảng sau**.

## QUY TRÌNH MỖI BƯỚC (bắt buộc)
`grep -a BƯỚC 0` (đã có gì → nối, đừng dựng lại) → **làm** → **nghiệm thu N6** (chạy/render THẬT trên dev server, không phải "file đổi") → ghi `docs/M-OUT` của bước → **KHÔNG commit** (Hoà commit). Một thư mục một chủ. Đóng đỏ trên `GAP-IF` chỉ khi N6 đạt.

---

## PHA 1 · ĐÓNG NỐT ĐỎ CAD  `lib/cad` (một chủ)
1.1 **G-M1-08** — poché neo được hồ sơ NHẬP (cơ chế neo không đòi trùng lớp; hồ sơ thật để hatch khác lớp đường bao).
1.2 **G-M1-04** — zoom "về cụm vẽ chính" dùng **một khung** với lúc nạp (nay 2 chỗ 2 khung).
1.3 **G-M1-07** — giữ cây block **lồng 5 cấp** khi xuất (nay ép còn 1).
1.4 **G-M1-01** — DXF nạp có **worker + huỷ + tiến độ** (đường DWG đã có, DXF chưa).
1.5 Đỏ Gốc C dính cad: **G-M3-10** block làm phẳng · **G-M3-12/13** thư viện văn phòng mỏng · **G-M3-14** thả không rơi · **G-M3-16** auto-layout văn phòng.

## PHA 2 · XONG GỐC C DATA  `lib/ffe·boq·materials·prisma`
2.1 Chạy **migrate** cột phòng (G-M3-08) → verify lại các fix món rời/BOQ/FF&E (nhập không rơi cột · món rời lên BOQ có SL · xlsx có ảnh).

## PHA 3 · APPLY GIAO DIỆN đã có thiết kế  `components`
3.1 **LÀN A** node: Bảng nút · Nút tổng · Thư viện (Bảng nút đã diff 3 điểm).
3.2 **LÀN B** CAD: 2D Kỹ thuật · Chế độ Chuyên · Phác thảo (mode `sketch/pro` đã có).
3.3 **Màn 9** bảng tròn → nối vào công cụ bút/markup.
3.4 **4 màn frontier** (sau khi Claude Design xong `.dc`): Nhận đề bài · Inspector · Zoning · Bảng N món FF&E.

## PHA 4 · NỐI VÀNG (orphan — "có code, 0 nơi gọi")
4.1 Gốc **B/D/E/G**: nối nốt thuật toán đã viết mà chưa có nút gọi.

## PHA 5 · SYNCWORK (lớp workspace — thiết kế + build)
5.1 **Claude Design** vẽ trước: Kanban · Gantt · Lịch/nhắc · Tổng quan dự án · Chat nhóm · Vitals · Notebook · Knowledge · (khách) duyệt · báo giá · phiên bản.
5.2 Apply từng màn vào code (theo quy trình như PHA 3).

## PHA 6 · ĐẤU NỐI HỆ (chỉ khi PHA 1–5 xong)
6.1 **ArchiNote** — cầu `.idf` 2 chiều (đọc `ARCHINOTE-MAP.md` trước).
6.2 **Larkbase** — pull nhân sự/dự án (ĐỌC-only, cửa ghép cột như warehouse). Data khách → `.idf`, không vào repo.

---

## XEN KẼ (làm khi chuyển pha)
- Chốt sổ **GAP-IF + 3 bản đồ** cuối mỗi pha (TỔNG ghi, §0u).
- Dọn ổ (`dist-installer` + `.next` ~1.5G) khi ổ >90%.
- Ghi **luật byte điều khiển + CI scan** vào `CLAUDE.md` (đã chốt).

## TRƯỚC KHI PUBLIC (chưa gấp — repo đang private)
Dọn `demo-enso /detech/*` (ảnh khách) · đường máy cá nhân · `docs/` nhắc tên khách · rồi mới public / xoá lịch sử.

---
**Vạch đích XONG IF** = PHA 1–4 đóng hết đỏ + apply hết giao diện có thiết kế. PHA 5–6 là mở rộng (SyncWork + đấu nối).
