# PHIẾU GIAO · CW — Ghế 3D vào app thật: lưu Thư viện + cửa sổ xem 3D bật/tắt được

## THẺ VAI [Đ4]
- VAI: CW — agent UI, nối proof Lincoln 327 vào app thật theo lệnh Hoà 14/08 "1" (nối UI) + "cho phép tắt mở ô".
- PHẠM VI/TRẦN: `components/library/**` (MỚI: cửa sổ viewer + nút toggle + entry trong kệ Nội thất) · script proof lưu vào DB (chạy 1 lần, KHÔNG route API mới — POST /api/library sẵn có nhận `{name,category,tags,dataUrl,usage,caption,content,w,h}`). ⛔ KHÔNG đụng `lib/idfc-import/**` (agent CN đang/vừa sửa file chuẩn-nét ở đó — CHỈ ĐỌC kết quả nếu cần, không sửa) · KHÔNG đụng lib/cad/idfc.ts ruột.
- BIÊN → DỪNG: nếu CN đã tạo `lincoln-327-chuannet.obj/.glb` MỚI trong scratchpad, ưu tiên dùng bản đó (chuẩn nét, dễ chỉnh) thay vì GLB Trellis thô; không có thì dùng bản thô cũ, khai rõ bản nào đang hiển thị.
- ĐIỀU KHOẢN RUỘT: [T5] cửa sổ = tool window đã chốt (CHOT-RENDER-TOOL-WINDOW: window là lớp hiển thị của 1 trạng thái, không nhân bản) · [N1] tội ①: kính là VỎ (viền/header blur), RUỘT (viewer 3D) sắc nét không blur · [Đ2] tái dùng `components/render-studio/ToolWindow.tsx` (khuôn portal/kính) + `components/three/MaterialSphere.tsx` (khuôn RoomEnvironment/tone-mapping) — KHÔNG viết viewer 3D từ đầu.

## ② ĐỌC TRƯỚC
`components/render-studio/ToolWindow.tsx` (khuôn cửa sổ nổi: portal document.body, fixed, kính vỏ, nút Minus/X, backdrop-blur — COPY tinh thần, không import thẳng vì gắn với useToolModeUi của render tasks khác concept) · `components/materials/MaterialPbrEditor.tsx` dòng dùng `MaterialSphere` (cách setup scene) · `components/three/MaterialSphere.tsx` (RoomEnvironment PMREM + NeutralToneMapping — bản Lincoln VIEWER cần y hệt ánh sáng này để soi thật) · `docs/bao-cao-phien/2026-08-14-GI-ghe-3d.md` + (nếu có) `2026-08-14-CN-chuan-net.md` (file kết quả nằm đâu trong scratchpad) · `app/api/library/route.ts` POST shape · `lib/library/shelves.ts` (kệ 'furniture' đã có).

## ④ VIỆC
1. **Lưu vào Thư viện thật**: script Node/ts chạy 1 lần (không phải API route mới) — đọc GLB (ưu tiên bản chuẩn-nét CN nếu có) từ scratchpad, convert base64 dataURL, POST tới `/api/library` (cần session — nếu server-side script không có cookie thì gọi thẳng hàm xử lý tương đương, KHÔNG bịa auth) với `category:'furniture'`, `tags:'ghe-bar,lincoln-327,ai-sinh'`, `usage:'ref-render'`, `caption:` mô tả ngắn + cờ nguồn, `content:` JSON `.idfc` (bảng tham số + provenance) làm chuỗi kèm. Ghi rõ trong báo cáo asset id nhận được.
2. **Component cửa sổ nổi** `components/library/Object3DWindow.tsx`: portal, fixed, kính vỏ (header: tên + nút thu nhỏ + nút đóng, backdrop-blur đúng luật K3 webkit-prefix), RUỘT là canvas three.js sắc nét — dựng scene y khuôn MaterialSphere (RoomEnvironment .04, NeutralToneMapping, nền kem/token app, OrbitControls, ground shadow nhẹ). Props: `{ open, onOpenChange, glbUrl, title }` — component THUẦN, không gắn cứng Lincoln, tái dùng được cho mọi asset 3D sau này.
3. **Nút bật/tắt** (Hoà: "cho phép tắt mở ô"): 1 state cục bộ `open` (mặc định false — không tự bật khi vào trang) + nút toggle rõ ràng ("👁 Xem 3D" / đang mở thì icon khác) đặt cạnh thẻ asset Lincoln trong kệ Nội thất của Thư viện (LibrarySheet) — grep component thẻ item trong `components/library/` để cắm đúng chỗ, KHÔNG viết kệ mới.
4. Verify browser THẬT (server 3000 sẵn có, đăng nhập sẵn — không phải nhập mật khẩu, dùng session hiện tại của pane): mở Thư viện → kệ Nội thất → thấy thẻ Lincoln 327 (nguồn AI-sinh) → bấm nút → cửa sổ nổi lên xoay được → bấm đóng → cửa sổ biến mất, thẻ vẫn còn nguyên. Screenshot làm bằng chứng.
5. tsc 0 · soi:tu-dien 0 lệch mới (chuỗi UI có nhãn "AI-sinh"/"Xem 3D" — không dùng chữ "tự động").

## ⑦⑧
Báo cáo `docs/bao-cao-phien/2026-08-14-CW-ghe-3d-window.md`: asset id thật trong DB · screenshot mở/đóng · file GLB nào đã dùng (thô hay chuẩn-nét) · giới hạn (nếu route library cần thumbnail riêng chưa làm thì khai). Dây máy: entry `ghe-3d-window-app` — T flip sau audit + xem mắt.
