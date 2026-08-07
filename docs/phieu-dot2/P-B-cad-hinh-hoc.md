# PHIẾU B · CAD HÌNH HỌC — nối dây poché + đối tượng Phòng

Vùng sở hữu: `lib/cad/` · `components/cad/`. **KHÔNG** đụng `lib/three/`, `components/present-editor/`, `lib/materials/`.
Luật: V6 KHÔNG commit · §0u ghi `docs/M-CAD-B-OUT.md`, **KHÔNG** ghi `docs/GAP-IF.md` · N1 báo cáo ≠ bằng chứng · N5 khai thật cái chưa xong · N8 mọi dòng có `file:dòng`.
Đọc trước: `docs/M-HINH-HOC-OUT.md` (phiên trước đã đo, đừng đo lại) · `docs/GAP-IF.md` dòng 13,16,19,20,55,62-70,145,146.

## VIỆC 1 — vá `importDoc` (G-M1-20, dòng 145) · ƯU TIÊN 1, rẻ nhất
`lib/cad/store.ts:787-805` không gọi `syncPocheAnchors`/`syncHostedOpenings`. Mọi đường nạp Doc từ ngoài đi qua nó: `CadEditor.tsx:438` (DXF) · `:509` (DWG) · `:202,396` (demo) · `:1466` (template).
⇒ Vừa nạp file xong, `hostId` chưa backfill: chọn mảng tô KHÔNG cầm theo đường bao, bug "dời một nửa nửa kia đứng yên" tái hiện cho tới lần sửa đầu tiên.
Vá: thêm `syncPocheAnchors(syncHostedOpenings(d))` trước `set()`, **cả nhánh `replace` lẫn `merge`**. Engine đã đúng và đã test 49 ca — KHÔNG viết lại engine.
Không phá `.idf`: `hostId` optional, reconcile idempotent, không đổi `IDF_VERSION`, không migration.
Verify bắt buộc: nạp 1 file DXF thật → đếm mảng tô có `hostId` **trước và sau** vá, ghi cả hai số.

## VIỆC 2 — `.idf` load path (G-M1-21, dòng 146)
`CadSheets.tsx:122,173,649` gọi `importIdf()` — đường KHÁC `importDoc`. **CHƯA AI KIỂM** có reconcile không. Grep trước, kết luận sau. Nếu thiếu thì vá cùng khuôn VIỆC 1.

## VIỆC 3 — G-M1-14 (dòng 55): poché không sống sót vòng xuất→nhập DXF
Điều kiện tiên quyết `G-M1-13` **đã gỡ xong** (`buildUniqueLayerNames`, 07/08). Điểm dữ liệu roundtrip đúng (`dxf.ts:877-894` HATCH, `:895-904` LWPOLYLINE). Chỉ thiếu: sau khi nhập lại không ai gọi reconcile ⇒ **cùng gốc VIỆC 1**, làm xong VIỆC 1 thì đo lại ca này trước khi kết luận còn hay hết.

## VIỆC 4 — đối tượng PHÒNG (G-M2-04 dòng 65 · G-M2-03 dòng 64 · G-M1-05 dòng 13)
Ba mã CÙNG một gốc: không có đối tượng Phòng ⇒ nhãn m² là chữ chết, biên phòng dò lại mỗi lần vẽ, diện tích sàn `method:'none'` 6/6 file.
Đọc `docs/SPEC-TANG-DU-LIEU-CAU-KIEN.md` §0.5 trước khi thiết kế. Đây là việc LỚN — nếu quá một lượt thì làm VIỆC 1-3 xong, báo cáo, để VIỆC 4 phiếu sau. **Nói thẳng nếu không đủ, đừng làm dở.**

## VIỆC 5 — nếu còn thời lượng
- G-M2-08 (dòng 69) số khai ≠ hình vẽ, không ai đối chiếu · ô khai độ dày chỉ ghi khi rời ô
- G-M2-07 (dòng 68) hình dẫn xuất lẫn vào bộ đếm
- G-M2-06 (dòng 67) lệnh sửa hình không có bản xem trước
- G-M1-11 phần POINT (dòng 19) — cần `PointEntity` mới trong `model.ts`, K4

## CẤM
- Không đổi tên code `lib/cad/`, `useCadStore`, route `/projects/[id]/cad` (chỉ đổi NHÃN, việc đó thuộc phiếu G).
- Không gán bừa `projectId` cho flow mồ côi.
- Không tự chạy `npm run dev` mới — kiểm `lsof` trước; trần 5 server.

## HÀNG ĐỢI (§V7) — bắt buộc cuối lượt
Liệt kê: đã xong gì (kèm số đo) · còn treo gì · vì sao treo · cái gì CHƯA VERIFY.
