# PHIẾU hinh-hoc-ap-thang — Áp thang bo ĐÃ DUYỆT + sửa nhãn lệch từ điển
①NGÀNH: Hoà (KTS trưởng) chê "bo góc không phát triển từ tâm, không chuyên nghiệp" — audit đo được 35% radius lẻ, 8px×259 lần không thuộc thang nào.
②ĐỌC TRƯỚC: docs/AUDIT-HINH-HOC-2026-08-12.md TOÀN VĂN (thang duyệt §3: --r-1..4 = 6/10/14/20 + --r-full 999 + rInner=max(4,rOuter−pad), concentric chỉ khi pad≤8, bảng migrate §3d, top-10 §4) · scripts/soi-hinh-hoc.mjs · chạy `npm run soi:tu-dien` xem 81 chỗ nhãn lệch.
③VÙNG FILE: app/globals.css (thêm token --r-*, KHÔNG xoá token cũ — bí danh dần) · lib/geometry.ts (MỚI: concentricRadius) · các file top-10 trong AUDIT NGOẠI TRỪ: Viewport3D/Command3DPanel/ToolDock3D (vùng D) · CadEditor/CadCanvas (vùng W) · ProjectSelect (vùng H2) — top-10 nào trùng vùng khác thì BỎ QUA ghi rõ. Nhãn từ điển: sửa các file components có chuỗi HIỂN THỊ sai ('Trình bày' nhãn chặng → 'Trình chiếu', 'tự động' → Magic...) cũng NGOẠI TRỪ 4 vùng trên; docs/mocks KHÔNG sửa (việc COWORK-UI).
④VIỆC: (1) nạp 5 token --r-* + hàm concentricRadius [marker: --r-full] (2) migrate top-10 khả dụng theo bảng §3d (3) siết ALLOWED trong soi-hinh-hoc về thang mới (giữ chế độ báo cáo, --strict vẫn opt-in) (4) sửa nhãn hiển thị lệch từ điển trong vùng cho phép, chạy lại soi:tu-dien đếm giảm.
⑤RÀNG BUỘC: không git · không server · KHÔNG đổi hình dạng component (chỉ radius/nhãn) · reduce-motion không liên quan.
⑥NGHIỆM THU: tsc 0 · `node scripts/soi-hinh-hoc.mjs` số ngoài-thang GIẢM (dán số trước/sau) · soi:tu-dien giảm (dán số).
⑦BÁO CÁO: docs/bao-cao-phien/2026-08-12-H-ap-thang.md (khuôn chuẩn + 2 GIÁ TRỊ).
⑧DÂY MÁY: hinh-hoc-ap-thang (+phần sửa của chong-lech-dinh-nghia).
