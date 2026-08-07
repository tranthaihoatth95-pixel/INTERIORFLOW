# M-3D-NOI-OUT — báo cáo phiên P14 (07/08): BVH + BẮT ĐIỂM 3D (T1+T4) + mặt phẳng làm việc + lưới đổi mật độ

Sở hữu: `lib/three/` · `components/three/` · `components/render-studio/` · SnapSettings.
File đụng: `lib/three/bvh.ts` (MỚI 58d) · `lib/three/snap3d.ts` (MỚI 358d) · `snap3d.test.ts`
(MỚI, 28 test) · `Scene3DViewer.tsx` · `Viewport3D.tsx` · `Render3DModeSkeleton.tsx` (+4 dòng
nối) · `package.json` (+`three-mesh-bvh`). **KHÔNG đụng** `lib/cad/query.ts`/`store.ts` — hoá ra
không cần sửa: SnapSettings dùng lại NGUYÊN VẸN qua import type, đúng K1 mà 0 dòng diff.

## ĐÃ XONG (kèm số đo + ảnh trong transcript)

### VIỆC 1 · T1 — three-mesh-bvh 0.9.14 (MIT, đúng bản NC-12 kiểm)
- Cổng duy nhất `lib/three/bvh.ts` (grep `installAcceleratedRaycast`) — cùng khuôn cô lập `csg.ts`.
  `ensureBoundsTree()` idempotent trả ms thật; `dropBoundsTree()` bắt buộc trước geometry.dispose.
- **ĐO LẠI trên cảnh IF THẬT** (trả lời "CHƯA VERIFY" NC-12 §3.1 — nhiều SceneGroup nhỏ,
  script bench trong scratchpad phiên, node v20):
  | Cảnh | groups | tam giác | dựng BVH TỔNG | raycast BVH | raycast THƯỜNG |
  |---|---|---|---|---|---|
  | demo-plan văn phòng | 39 | 652 | **3,2 ms** (max 1 group 0,86) | 16,1 µs/tia | 10,4 µs/tia |
  | apartment74 | 67 | 1 068 | **0,9 ms** | 17,5 µs/tia | 10,3 µs/tia |
- **Nói thẳng (N5)**: cảnh IF NHỎ thì raycast thường còn NHANH HƠN (overhead cây trội khi mesh
  bé) — trúng tia giống hệt 100% (1189/1189, 1324/1324). BVH thắng áp đảo ở cảnh LỚN (số NC-12:
  100k tam giác 5 776,8→21,6 µs = 267×) — tức DWG nhập thật. Chi phí dựng ≤3,2ms là không đáng kể
  ⇒ giữ BVH mặc định cho mode massing là đúng, và số này KHÔNG mâu thuẫn NC-12, nó bổ sung đầu
  còn lại của trục kích thước cảnh.

### VIỆC 2 · T4 — bắt điểm 3D (`lib/three/snap3d.ts`, grep `findSnap3D`)
- **KHÔNG đẻ SnapSettings thứ hai**: nhận `SnapSettings` của `lib/cad/store.ts:191` — bảng ánh xạ
  7 nấc 3D → 11 công tắc 2D nằm ở docstring đầu file. Bật/tắt Đầu mút ở 2D là 3D nghe theo.
- Thang 7 nấc ƯU TIÊN CỨNG THEO LOẠI (đúng luật `snap-priority.test.ts` 2D): endpoint >
  intersection > center > midpoint > perpendicular > onface > grid. Test đo TOẠ ĐỘ: đỉnh thắng
  giữa-cạnh dù XA con trỏ hơn trên màn.
- Ba luật bắt buộc NC-12 §3.2-3.3, đủ cả ba:
  ① dung sai PIXEL màn hình — đọc token `--tap` thật từ CSS /2 (fallback 22px), test "cách 40px
    dung sai 12px ⇒ null";
  ② mỗi loại MỘT DẤU + MỘT CHỮ VIỆT — `SNAP3D_LABELS` (Đầu mút · Giao tuyến · Tâm mặt · Giữa
    cạnh · Vuông góc · Trên mặt · Lưới sàn), marker tròn + nhãn HTML cạnh con trỏ;
  ③ ⇧ khoá loại đang bắt (`lockKind`, test riêng) · X/Y/Z khoá trục màu đỏ/lục/lam
    (`lockToAxis`, bám HƯỚNG là hạng mục RIÊNG đúng cảnh báo phiếu — đã nối vào kéo dấu đèn với
    đường dẫn màu trục; bấm lại phím = nhả, chuẩn SketchUp).
- Đặc trưng rút từ TRIANGLE SOUP (không topology): hàn đỉnh 0.1mm → cạnh biên/cạnh gãy (chéo fan
  cùng mặt LOẠI — test hộp đúng 8 đỉnh/12 cạnh/6 tâm mặt), cache WeakMap runtime (K1).
- **Bug bắt được LÚC VERIFY app thật, đã sửa + test**: "Giao tuyến" (bắt trượt dọc cạnh, liên
  tục) che vĩnh viễn "Giữa cạnh" (nằm ngay trên cạnh) — điểm ĐẶC BIỆT trên cùng đường nay thắng
  điểm trượt (grep `Bắt được lúc VERIFY` trong snap3d.ts, 2 test mới).

### VIỆC 3 — mặt phẳng làm việc tự động
Mọi kết quả snap kèm `workPlane` (điểm chạm + pháp tuyến thế giới của mặt dưới con trỏ; nấc grid
= sàn y=0). Test: rê mặt +X của hộp → pháp tuyến ≈ +X; rê sàn → +Y. Đây là NGUYÊN LIỆU cho lệnh
vẽ (VIỆC 5) tiêu thụ — chưa có lệnh vẽ nào gọi (VIỆC 5 treo), khai đúng K4: có nơi tiêu thụ
là chính `findSnap3D` trả nó cho viewer, viewer sẽ đưa cho công cụ vẽ đợt sau.

### VIỆC 7 — lưới đổi mật độ theo tầm nhìn (`Scene3DViewer.tsx`, grep `VIỆC 7 (P14)`)
GridHelper(200,200) cố định → 3 lưới 1m/100mm/10mm bật tắt theo khoảng cách camera→target
(ngưỡng 8m/2m), 2 lưới mịn BÁM target làm tròn về mắt ô chính nó (pan không trôi vạch).

### Tích hợp viewer (`Scene3DViewer.tsx` grep `T4 (P14)` · `Viewport3D.tsx` · `Render3DModeSkeleton.tsx`)
Chỉ mode massing (Vẽ 3D) dựng BVH + bắt điểm — campath/chụp ảnh/công trường 0 đổi hành vi.
Snap settings đi qua REF (đổi công tắc không dựng lại cảnh). Cleanup đủ: dropBoundsTree trước
dispose, gỡ listener/label.

## VERIFY
- `snap3d.test.ts` **28/28** (đo toạ độ/nhãn/thang/công tắc/⇧/trục/workPlane) ·
  `build-ops` 51/51 · `csg` 6/6 · `obj-scene-to-geometry` 10/10 không hồi quy.
- `npx tsc --noEmit -p .` **exit 0** (3 lần, nền) · `npm test` **0 suite fail** ·
  `node scripts/check-chot.mjs` **0 đỏ 0 vàng**.
- **Browser thật** (server riêng phiên này port 3007 — trần 5 server lúc đó đã trống lại;
  ⚠️ qua `localhost:3007` KHÔNG phải 127.0.0.1: cổng duyệt origin của Browser pane từ chối
  127.0.0.1, cookie phiên vẫn nguyên — ghi rõ lệch luật máu + lý do): Dự án mẫu → Thiết kế 3D →
  Vẽ 3D → dựng 1 tường mẫu → RÊ chuột: **"Đầu mút"** bám đúng góc sàn · **"Giao tuyến"** trượt
  dọc mép sàn · **"Lưới sàn"** khi ra ngoài khối — dấu tròn + chữ Việt cạnh con trỏ, ảnh trong
  transcript phiên. 0 lỗi console. **Đã dọn 2 entity test khỏi Dự án mẫu** (removeIds, đo lại 0).

## CHƯA VERIFY / CÒN TREO (V7)
- 🟡 "Giữa cạnh"/"Tâm mặt"/"Vuông góc" CHƯA chụp được trên app thật (góc camera cảnh demo không
  với tới điểm đó — nút Toàn cảnh không đổi khung, nghi bug fit CŨ, ngoài phạm vi) — cả ba ĐÃ có
  test đo toạ độ. ⇧/X/Y/Z cũng mới verify bằng test, chưa bấm phím thật trên app.
- 🟡 Nút "Toàn cảnh" không đưa camera về khung bao sau khi thêm khối (thấy lúc verify, KHÔNG do
  phiên này — không sửa, báo để TỔNG giao đúng người).
- ⬜ VIỆC 4 (VCB) · VIỆC 5 (mở khoá cụm + sửa 3 icon sai ToolDock3D) · VIỆC 6 (nối 11 hàm
  build-ops, sweep parallel-transport ⚠️ chờ boolean trước miter) — CHƯA làm, đúng câu chốt phiếu
  "không đủ thời lượng thì xong VIỆC 1+2, báo cáo". Bắt điểm + BVH + mặt phẳng làm việc là nút
  chặn lớn nhất, đã gỡ; VIỆC 5 giờ có nền để mở cụm ① Vẽ.
- 🔴 **Hai phiên chung .git, lần này commit của HOÀ**: `ad2d23b` (22:02, gộp cả ngày) cuốn theo
  bản GIỮA CHỪNG của phiên này (bvh.ts, snap3d.ts trước fix giữa-cạnh, package.json). Phần chốt
  (fix giữa-cạnh + tích hợp viewer đầy đủ + test) còn ở working tree — đúng V6 không tự commit,
  Hoà commit nốt khi gom. Không mất dữ liệu (diff HEAD đã kiểm).
