# M-CAD-C-OUT — p9 · ĐỐI TƯỢNG PHÒNG + tường-một-vật + đo Hoàn tác

Phiên p9, 07/08. V6 KHÔNG commit. §0u: delta GAP ở cuối, TỔNG gộp — KHÔNG đụng `GAP-IF.md`.
Nối tiếp `M-CAD-B-OUT.md` (G-M1-14/20/21 đã đóng phiên trước, không làm lại).
⚠️ Trong lúc phiên chạy, `components/library/LibrarySheet.tsx` có lỗi tsc CỦA PHIÊN KHÁC đang sửa
dở (`BAYS`/`idfcItems` chưa khai) — NGOÀI vùng p9, không đụng; mọi lệnh `tsc` bên dưới đã lọc
riêng, phần còn lại của repo 0 lỗi.

## VIỆC 1 · ĐỐI TƯỢNG PHÒNG (G-M2-04 → G-M2-03 + G-M1-05 đóng theo) — ✅ LÕI XONG

Theo đúng `SPEC-TANG-DU-LIEU-CAU-KIEN.md` §6.2/§6.3. KHÔNG viết engine dò biên mới — tái dùng
`findRoomLabels`/`pickHatchFace` (phân hoạch mặt phẳng có sẵn, `standards/checker.ts:118` +
`hatch.ts:434-480`) và `ringKey` (`poche.ts:112`).

### Đã làm (file:dòng)
| Mảnh | Ở đâu |
|---|---|
| `RoomEntity` (type `'room'`, biên ĐÓNG BĂNG, KHÔNG lưu m²) + `roomCentroid` + vào `Entity` union + `entityBox` | `lib/cad/model.ts` (grep `G-M2-04 (07/08)`) |
| Field vật liệu phòng (floorSpecId/ceilingSpecId…) **CỐ Ý CHƯA khai** — K4/L7: ống kính 3D (nơi tiêu thụ) ngoài vùng p9. Ghi rõ trong docstring `RoomEntity` | `lib/cad/model.ts` docstring |
| `lib/cad/room.ts` MỚI: `roomAreaM2` · `roomLabel` (m² SỐNG) · `detectRooms` (đề xuất + `unresolved` KÈM LÝ DO, K3) · `staleRoomBoundaries` (tường đổi chỉ BÁO, L5) · `totalRoomAreaM2` | cả file, docstring đầu file |
| Ống kính 2D vẽ phòng: biên nét đứt + TÊN + m² tính-lúc-vẽ | `lib/cad/render.ts` `drawRoom` (grep `G-M2-04/G-M2-03 — vẽ 1 RoomEntity`) |
| Room là công dân đủ quyền: move/rotate/mirror (`geometry.ts:99,145,186`) · scale (`store.ts` case `'room'`) · grips (`grips.ts` case `'room'`) · hit-test + khung chọn (`query.ts` case `'room'` ×2) · scaleAbout/stretch (`modify.ts` case `'room'` ×2) | như liệt kê |
| Xuất DXF: biên LWPOLYLINE + TEXT "TÊN — NN.NN m2" (lossy có chủ đích như zone; `.idf` giữ nguyên cấu kiện vì serialize JSON entity) | `lib/cad/dxf.ts` case `'room'` (grep `G-M2-04 — RoomEntity ra DXF`) |
| Store: `replaceEntities(removeIds, add)` — thêm phòng + gỡ nhãn TEXT cũ trong MỘT bước Undo | `lib/cad/store.ts:310,641` |
| UI: panel **"Nhận diện phòng"** — duyệt TỪNG phòng (không có "áp tất cả") · danh sách nhãn KHÔNG dò được biên kèm lý do · danh sách phòng biên CŨ kèm nút "Cập nhật biên" | `components/cad/CadEditor.tsx:1987` `RoomDetectPanel`; N6 mount: `:727` `{roomDetectOpen && <RoomDetectPanel …>}`, nút ở menu "Công cụ bản vẽ" (grep `id: 'rooms'`) |

### Số đo
- Test MỚI `lib/cad/room.test.ts` — **22/22 pass**: dò đúng 20 m² phòng 4×5 · unresolved kèm lý do
  · idempotent (bấm lần 2 không đẻ trùng) · **kéo biên gấp đôi → m² tự nhân đôi, không sửa chữ nào
  (G-M2-03)** · tường nới 4→5 m: stale báo `20 → 25 m²`, Doc KHÔNG bị tự sửa (L5) · biên suy biến
  trả 0 không NaN.
- **G-M1-05 trên 6/6 file thật** (`~/Downloads/AI DATA/FILE MBHT/`): `planAreaCrossCheck` từ
  `method:'none'` 6/6 → **`'roomSum'` 6/6** (`lib/cad/dxf-plan.ts` grep `G-M1-05 (07/08)`).
  Trong lúc đo bắt được + sửa ngay 2 bệnh THẬT của phép cộng: ① 8 nhãn SỐ TRỤC cùng rơi vào một
  mặt sàn 451,8 m² ⇒ cộng trùng 8 lần thành 3.656,7 m² → lọc nhãn thuần-số + khử trùng mặt theo
  `ringKey`; ② chốt chặn mặt-rò >2.000 m², LOẠI CÓ KHAI BÁO trong notes (K3).
  Số sau sửa: F1 321,8 m² NET / khung tên 474 GFA (hợp lý — net < gross) · F2 1,8 · F3 26,6 ·
  F4 0,6 · F5 3,4 · F6 57,1. **Khai thật (N5): coverage thấp** — hồ sơ thật đặt tên phòng trong
  BLOCK/kiểu chữ khác nên nhãn TEXT toàn-hoa dò được ít (2-4 phòng thật/file); phần còn lại nằm ở
  bộ nhận nhãn (`ROOM_NAME_RE`), KHÔNG phải ở phép dò biên. Ghi nhận, chưa nới regex (nới ẩu là
  rước số trục/chữ kích thước vào — đúng bệnh ① vừa chặn).
- `tsc` 0 lỗi (ngoài file phiên khác nêu trên) · **toàn bộ 73 file test `lib/cad` pass** (kể cả
  `dxf-plan` 28 · `poche` 30+19 · `hatch` 45 · `idf` 42 — không hồi quy).

### 🟡 CHƯA VERIFY (nói thẳng)
- **Chưa verify browser** — port 3000 đang là dev server của phiên khác (lsof), luật "một thư mục
  = MỘT server" nên không mở thêm; Browser pane phiên này không với tới server đó. Panel đã chứng
  minh mount bằng grep (N6) + mọi logic chạy bằng store thật/file thật, nhưng CHƯA có ảnh màn hình
  bấm nút thật. Cần một phiên có quyền server verify: mở "Công cụ bản vẽ → Nhận diện phòng" trên
  file thật, duyệt 1 phòng, xem nhãn sống + kéo tường xem panel báo biên cũ.
- Nhãn phòng của tool `'room'` CŨ (vẽ phòng chữ nhật, `CadCanvas.tsx:1107` + `commands.ts
  roomRect`) vẫn sinh TEXT như trước — hai đường sống song song có chủ đích (không phá tool cũ);
  hợp nhất (room tool sinh thẳng RoomEntity) là việc tiếp, chưa làm.

## VIỆC 2 · TƯỜNG LÀ MỘT VẬT — ✅ phần còn lại đóng, có số đo

- **G-M2-01**: các mảnh đã có sẵn từ trước (select nở cặp `store.ts:658` vùng grep `A3 · G-M1-08 —
  chọn một nửa`; propagate `store.ts` `updateEntities`; importDoc đã vá phiên B). Phiên này VERIFY
  chuỗi đầy-đủ bằng store THẬT + file THẬT (03_TANG5B): **chọn 1 mảng tô → selection nở ra 11 id
  (cả đường bao + 9 mảng anh em) · dời riêng mảng tô +450mm → đường bao đi theo đúng 450mm, hai
  nửa vẫn trùng khít.** Ca "lệch 450mm" của sổ chết hẳn trên cả đường bấm-chọn lẫn đường dời.
- **G-M2-02**: phần trong vùng = cặp rách PHẢI LỘ MẶT — thêm cảnh báo ngay câu trạng thái lúc nạp
  DXF khi file mang cặp lệch sẵn (`CadEditor.tsx` grep `G-M2-02 vế "không màn nào báo"`, dùng
  `findBrokenPocheePairs` có sẵn). KHÔNG tự ghép (K3). 🔴 Phần "3D chỉ dựng từ vùng tô" nằm ở
  `lib/three/cad-to-obj.ts` — NGOÀI vùng p9, treo cho phiên 3D; với neo đã chạy ở mọi đường ghi
  thì hai nửa không còn lệch MỚI được nữa, chỉ file cũ mang bệnh sẵn mới cần cảnh báo này.
- **G-M2-08**: `WallTypePanel` (`CadEditor.tsx` grep `measuredWallThicknessMm`) — ① đo bề dày VẼ
  THẬT từ tứ giác poché (cạnh ngắn nhất; biên ≥5 đỉnh nói "không đo được", không đoán) ② khai ≠ vẽ
  lệch >max(5mm, 5%) → cảnh báo ngay cạnh ô: "Khai 220 mm nhưng vùng tô vẽ 100 mm…" — chỉ báo,
  không tự sửa bên nào ③ vế "chỉ ghi khi rời ô": gõ xong TỰ GHI sau 500ms debounce (Enter/blur vẫn
  ghi ngay). 🟡 CHƯA VERIFY bằng mắt trên browser (cùng lý do server ở trên) — logic thuần đã nằm
  trong hàm `measuredWallThicknessMm` + điều kiện `mismatch`, kiểm được bằng đọc code.

## VIỆC 3 · HOÀN TÁC — đo xong, kết quả: 1 mã ĐÃ CÓ NGƯỜI SỬA, 1 mã treo đúng lý do

- **G-M2-05 (3D không Hoàn tác): ĐÃ SỬA BỞI PHIÊN KHÁC hôm nay** — §0ab bắt đúng: sổ ghi 🔴 nhưng
  `components/render-studio/Render3DModeSkeleton.tsx:329-357` (file sửa 14:29 07/08) có nguyên
  listener ⌘Z/⌘⇧Z gọi `useCadStore.undo()/redo()` + báo "Không còn gì để hoàn tác" khi hết,
  docstring tự trích "VIỆC 4 (M-3D-OUT, G-M2-05)". → TỔNG đối chiếu `M-3D-OUT.md` rồi sửa sổ,
  p9 KHÔNG làm lại (và file đó cũng ngoài vùng p9).
- **G-M2-09 (hết phiên = mất Undo): TREO, kèm phân tích gốc** — đo được: `past/future` sống trong
  RAM zustand (`lib/cad/store.ts:298-300`), chết khi full-navigation sang màn đăng nhập; dải báo
  mất phiên là `components/studio/SessionWatch.tsx:1-60` (không chặn, đúng "băng chữ nhỏ" của sổ)
  — file thuộc `components/studio/`, VÙNG CẤM của p9. Hướng sửa đề xuất cho phiên đúng vùng:
  đăng-nhập-lại TẠI CHỖ (tái dùng LockScreen re-login đã có, `components/studio/LockScreen.tsx`)
  thay vì điều hướng — store không unmount thì Undo còn nguyên; bản vẽ vốn KHÔNG mất (autosave
  IndexedDB, `CadSheets.tsx`). Không tái hiện được ca "khung nhìn hỏng" bằng headless — cần
  browser + giết cookie thật, ghi CHƯA VERIFY.

## VIỆC 4 · CÒN LẠI
- **G-M1-18 · G-M1-19**: sổ ghi 🔴 nhưng ô trạng thái ghi ✅ — ĐO LẠI phiên B đã làm
  (`M-HINH-HOC-OUT.md` + `M-CAD-B-OUT.md`): cả hai ĐÃ SỬA thật, test `dxf-openable` (nay 21 ca)
  + `block-library-infer` 5 ca đều pass, ezdxf mở 6/6. → TỔNG sửa cột đầu của 2 dòng sổ.
- **G-M1-12**: đo xác nhận đúng nghi vấn của phiếu — TANG11 có chuỗi `"493 m2"` nằm TRONG định
  nghĩa BLOCK không được chèn (đọc raw DXF section BLOCKS ra 2 hit, section ENTITIES 0 hit);
  parser chỉ đưa entity của block ĐƯỢC INSERT vào `doc.entities` nên `planDeclaredAreaM2`
  (`dxf-plan.ts:255`) không bao giờ thấy. TANG12 thì KHÔNG có số diện tích thật — chỉ có chuỗi
  chuẩn `"(ĐẠT TIÊU CHUẨN 6m2/ng)"`; ⚠️ bẫy cho người sửa sau: nếu thêm đường đọc block mồ côi mà
  không lọc, regex sẽ nuốt `6m2/ng` thành "diện tích 6 m²". Fix TREO (cần đường đọc khung tên độc
  lập với INSERT + cảnh báo "block mồ côi" — việc parser riêng, hết thời lượng).
- **G-M2-06 (preview lệnh sửa hình) · G-M2-07 (hình dẫn xuất lẫn bộ đếm)**: CHƯA ĐỘNG — hết
  thời lượng, không giả vờ.

---

## DELTA GAP cho TỔNG gộp (§0u)
- G-M2-04 → 🟡 LÕI XONG 07/08 (p9): RoomEntity + dò/duyệt/stale + render m² sống + 22 test; treo
  verify browser + hợp nhất room-tool cũ + field vật liệu phòng (chờ ống kính 3D, K4).
- G-M2-03 → 🟡 đóng theo G-M2-04 cho phòng ĐÃ nhận diện (nhãn sống thay nhãn chết, 1 bước Undo);
  nhãn TEXT chưa chuyển thành phòng vẫn là chữ chết (đúng thiết kế di cư §6.3).
- G-M1-05 → 🟡 `method:'roomSum'` 6/6 file (hết 'none'), NET có khai báo rõ; coverage thấp do quy
  ước nhãn của hồ sơ thật — phần nhận nhãn là việc riêng.
- G-M2-01 → ✅ verify chuỗi đầy-đủ trên file thật (chọn nở 11 id · dời +450 → đi theo đúng 450).
- G-M2-02 → 🟡 cảnh báo cặp-rách lúc nạp (p9) · phần ống kính 3D treo phiên `lib/three`.
- G-M2-08 → 🟡 đo-so-cảnh báo + tự ghi debounce đã code; chưa verify mắt.
- G-M2-05 → ✅ ĐÃ SỬA bởi phiên 3D hôm nay (Render3DModeSkeleton.tsx:329) — sổ đang ghi 🔴 SAI.
- G-M1-18/19 → sổ còn 🔴 ở cột trạng thái tổng — thực tế ✅ từ 06/08, đề nghị sửa sổ.
- G-M1-12 → 🔴 xác nhận gốc (chuỗi trong block mồ côi) + ghi bẫy `6m2/ng`; fix treo.
- G-M2-09 → 🔴 treo: gốc đo được (undo trong RAM + SessionWatch không chặn), hướng sửa thuộc
  `components/studio` (ngoài vùng p9).

## HÀNG ĐỢI (§V7)
| Trạng thái | Việc | Ghi chú |
|---|---|---|
| ✅ kèm số đo | VIỆC 1 lõi (22/22 test · roomSum 6/6 file · tsc 0) · VIỆC 2 (verify file thật + 2 cảnh báo mới) | trên |
| ✅ đo, không làm lại | G-M2-05 · G-M1-18 · G-M1-19 | phiên khác đã sửa — TỔNG sửa sổ |
| 🟡 treo chờ server rảnh | verify browser panel Nhận diện phòng + cảnh báo dày tường | port 3000 của phiên khác, luật 1-server |
| 🔴 treo vì ngoài vùng | G-M2-09 (components/studio) · G-M2-02 phần 3D (lib/three) | hướng sửa đã ghi |
| 🔴 treo vì hết giờ | G-M1-12 fix · G-M2-06 · G-M2-07 · hợp nhất room-tool cũ · nới bộ nhận nhãn phòng | chưa động, không giả vờ |
