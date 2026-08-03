# SPEC · VE-REVIT-MODE — mode Revit chặng Vẽ (BIM-lite)
**Ngày:** 03/08/2026 · **Vai lập:** COWORK-VẼ · **Trạng thái:** ĐỀ XUẤT (TỔNG duyệt — ship-trước-sửa-sau)
**Kinh gốc:** `SPEC-LENH-VE-IF.md` §2 (não Revit) + §5 · **Nối:** `SPEC-MODE-PER-STAGE` §1 · `RANG-BUOC-IF2-CHO-IF1` · `SPEC-VAT-LIEU-PBR-IF` §1 (matId) · `SPEC-VE-INFERENCE.md` (VCB/snap dùng chung)
**Đối chiếu code:** 03/08 — `model.ts` · `store.ts` · `commands.ts` · `shape-interactions.ts` · `CadCanvas.tsx` · `RevitSummaryPanel.tsx`

## 0 · NGUYÊN TẮC
1. **Mode = đổi cách nhìn + lệnh, KHÔNG migrate Doc** (đúng comment `RevitSummaryPanel.tsx`). Mọi field mới đều **optional** — `.idf` cũ parse bình thường (khuôn `elementType`/`storey` của IF2-nền, tiền lệ zone 24/07).
2. **Một sổ lệnh, ba lát cắt `when`** (`SPEC-LENH-VE-IF` §5): cùng lệnh WALL/ROOM, mode revit đổi HÀNH VI, không thêm bộ code song song.
3. Tường vẽ ở Revit chuyển về Sketch/Pro **vẫn thấy nguyên hình** (hatch+polyline như cũ) — lớp tham số chỉ ngủ, không mất.
4. Bỏ của Revit thật (chốt trong kinh, nhắc để khỏi ai đề xuất lại): family editor · 3 kiểu nối + priority matrix · volume 3D room · phase · worksharing.

## 1 · HIỆN TRẠNG — tái dùng gì, thiếu gì
| Có sẵn | Ở đâu | Tái dùng làm |
|---|---|---|
| `CadMode = 'sketch'\|'pro'\|'revit'` + `RevitSummaryPanel` skeleton (H1) | `store.ts:116` · `components/cad/RevitSummaryPanel.tsx` | vỏ mode — spec này đổ ruột |
| `Base.elementType/storey/wallKind/wallStructural/wallThicknessMm/heightMm` | `model.ts:151-181` | tham số BIM per-entity — GIỮ NGUYÊN, không định nghĩa lại |
| `wallSegment`/`wallChain(points,t,layer,closed)` — click = TIM tường, sinh cặp hatch+polyline trên `WALL_LAYER_ID='l-wall'` | `commands.ts:70` · `shape-interactions.ts:64` | bộ sinh hình — bị THAY bằng `wallOutline` cả chuỗi (§3), giữ làm fallback sketch/pro |
| `extractWallSegments(doc)` | `shape-interactions.ts:67` | nguồn segment cho room tự nhận biên (§5) |
| `roomRect(p0,p1,t,name,…)` — phòng chữ nhật 2 góc + m² thông thuỷ | `commands.ts:88` | giữ cho sketch/pro; revit đổi hành vi ROOM (§5) |
| `ZoneEntity` polygon/ellipse+label | `model.ts:364` | KHÔNG đụng — zone là tô khu chức năng, khác room BIM |
| `SelectionInfoPanel` ô gán elementType 1 entity (B1) | đã có | giữ — gán lẻ vẫn qua đó |
| `MaterialDef`/`MATERIALS` — PHU đang mở rộng PBR | `lib/cad/materials.ts` | chỉ THAM CHIẾU `matId: string`, không chờ nhau |
| `docToObjScene` đọc `heightMm` (nguồn duy nhất cao tường 3D) | `lib/three/*` | opening 3D đục lỗ = hook pha sau (§4d) |
| `st.wallThickness` + tool `wall` + Space tap-lặp-lệnh/giữ-pan | `store` · `CadCanvas.tsx` | §4c xử xung đột Space |
**Thiếu thật:** tim tường bị VỨT sau khi vẽ (per-segment, không sửa được) · location line · nối sạch · cửa/cửa sổ hosted · room tự nhận biên + separator · type/instance.

## 2 · LỚP THAM SỐ TƯỜNG — `WallRun` (tim tường sống lại)
Gốc vấn đề: `wallChain` sinh hình rồi vứt tim → không parametric được. Giải: **lớp tham số đứng TRÊN lớp hình học**, liên kết bằng id.
```ts
// model.ts — thêm optional vào Doc (additive):
interface WallRun {
  id: string;
  path: Pt[];              // TIM tường — nguồn sự thật parametric
  closed: boolean;
  typeId: string;          // → WallType (§6)
  locationLine: 'center' | 'left' | 'right';  // theo CHIỀU VẼ path — không đoán trong/ngoài
  overrides?: Partial<Pick<WallType,'thicknessMm'|'matIdCore'|'matIdFinishL'|'matIdFinishR'>>; // instance thắng type
  openings: WallOpening[]; // §4
  entityIds: string[];     // hatch+polyline đã sinh — regen thì thay đúng đám này
}
interface Doc { …; wallRuns?: WallRun[]; wallTypes?: WallType[]; }
```
**Quy tắc regen:** mọi sửa đổi (path/type/locationLine/opening) → `regenWallRun()`: xoá `entityIds` cũ, sinh mới, ghi lại `entityIds` — MỘT `snapshot()` cho cả cụm. Entity sinh ra mang `elementType:'wall'`, `wallThicknessMm`, kế thừa `storey` hiện hành.
**Location line:** đổi `thicknessMm` → đường ở `locationLine` ĐỨNG YÊN, bề dày dồn về phía kia (center: chia đều). Hình học: path hiển thị = offset tim theo `(t/2)·side`; UI nhãn "Tim / Mặt trái / Mặt phải" (theo chiều vẽ — người dùng thấy ngay trên preview, không cần khái niệm exterior).
**Vẽ ở mode nào:** revit → tool `wall` tạo WallRun + regen. Sketch/Pro → `wallChain` cũ y nguyên (không WallRun — đúng nguyên tắc 3; nâng cấp tường cũ lên run = lệnh riêng pha 2, không auto).

## 3 · NỐI TỰ SẠCH — MỘT kiểu, không trình sửa nối
Thay sinh-per-đoạn bằng **offset cả chuỗi**: `wallOutline(path, t, locationLine, closed) → { left: Pt[], right: Pt[] }` (lib thuần, PHU):
| Ca | Xử lý |
|---|---|
| Góc trong chuỗi (L-join nội bộ) | **miter**: 2 biên offset kéo dài tới giao điểm; góc < 15° → fallback **bevel** (cắt vát), tránh gai nhọn vô hạn |
| 2 WallRun chạm ĐẦU-ĐẦU (L) | detect endpoint trùng (tol = t/2) → hàn miter như góc nội bộ |
| Đầu run này chạm THÂN run kia (T) | run đâm vào TRIM tới biên gần của run nhận — không xuyên; hatch run nhận giữ liền |
| X (2 run cắt thân nhau) | **pha 2** — pha 1 để nguyên chồng hình, KHÔNG chặn vẽ (ghi status 1 dòng) |
KHÔNG có UI chọn kiểu nối, không priority — cố tình (kinh §2: trình sửa nối là thứ "gây chấn thương nhất" của Revit). Trigger tự động trong `regenWallRun` của cả 2 run liên quan.

## 4 · CỬA / CỬA SỔ HOSTED
### 4a · Data
```ts
interface WallOpening {
  id: string;
  kind: 'door' | 'window';
  sMm: number;             // khoảng cách TÂM opening từ ĐẦU path, dọc tim (mm)
  widthMm: number;         // mặc định: cửa 800 · cửa sổ 1200
  swing: 'L' | 'R';        // bản lề trái/phải (nhìn theo chiều vẽ)
  face: 'left' | 'right';  // mở về phía nào của tường
  sillMm?: number; headMm?: number; // cửa sổ: bệ/lanh tô — 3D dùng, 2D bỏ qua
  blockId?: string;        // ký hiệu block thay mặc định (thư viện 46 — nếu có block cửa thì nối, chưa có thì ký hiệu vẽ tay §4d)
}
```
### 4b · Hành vi hosted (đúng kinh: con của tường)
| Sự kiện | Kết quả |
|---|---|
| Đặt | tool `door`/`window` CHỈ đặt được khi hover trúng WallRun (highlight tường nhận); ngoài tường = con trỏ cấm + status "Cửa phải đặt trên tường" |
| Tường đổi path | opening giữ `sMm` từ đầu path, clamp `[widthMm/2, L−widthMm/2]`; tường ngắn hơn tổng opening → opening thừa bị treo cờ lỗi (đỏ), không tự xoá |
| Xoá tường | xoá mọi opening của run (chết theo tường) |
| Kéo opening | trượt DỌC tim (đổi sMm) — không bao giờ rời tường |
| VCB | gõ số khi đang đặt/kéo = đặt `sMm` chính xác từ đầu gần nhất (khớp AMEND `SPEC-VE-INFERENCE` §4 — lastOp.kind mới: `'opening'`) |
### 4c · Space đảo chiều — xử xung đột phím
Space hiện = tap lặp lệnh / giữ pan (`spaceDownAt`/`spaceHeld`). Luật ưu tiên NGỮ CẢNH: **khi tool `door`/`window` đang có preview sống** (hover trúng tường, chưa click) → Space TAP = xoay vòng 4 trạng thái `swing×face` (L-left → R-left → L-right → R-right); giữ-pan vẫn hoạt động. Ngoài ngữ cảnh đó Space giữ nguyên hành vi cũ. Một phím, không thêm modifier — đúng SketchUp-tay.
### 4d · Thể hiện
- **2D:** khoét hatch tại opening (regen cắt outline) + ký hiệu chuẩn `CHUAN-THIET-KE-v7.6`: cửa = leaf + arc swing 90° theo swing/face; cửa sổ = 2 nét song song trong bề dày. Vẽ bằng entity sinh kèm (thuộc `entityIds` của run).
- **3D:** hook — `docToObjScene()` đọc `wallRuns[].openings` đục lỗ khối (việc của bậc 3D-5/B1, KHÔNG làm trong spec này; ghi để PHU chừa dữ liệu đủ: sillMm/headMm).

## 5 · ROOM TỰ NHẬN BIÊN + ĐƯỜNG CHIA PHÒNG
### 5a · Lệnh ROOM theo mode (một lệnh, hai hành vi — `when`)
| Mode | Hành vi |
|---|---|
| sketch/pro | `roomRect` 2 góc như hiện tại — KHÔNG đổi |
| revit | **click 1 điểm trong vùng kín** → trace biên → `RoomEntity` + nhãn tên + m² |
### 5b · `RoomEntity` — type mới trong union (tiền lệ zone: additive, `.idf` cũ không breaking)
```ts
interface RoomEntity extends Base {  // type: 'room'
  boundary: Pt[];        // polygon TIM tường/separator bao quanh
  name: string;          // nhập inline như roomNamePrompt hiện có (tái dùng cơ chế, KHÔNG window.prompt)
  areaM2: number;        // cache — thông thuỷ XẤP XỈ: area(boundary) − perimeter×t/2 (CÙNG mức xấp xỉ roomRect hiện tại, đủ DD)
  finishFloorMatId?: string; // BOQ ăn (matId — SPEC-VAT-LIEU-PBR-IF)
}
```
### 5c · Đường chia phòng (separator — không gian mở)
LineEntity thường trên **layer mới `l-room-sep`** (nét gạch-chấm mảnh, mặc định KHÔNG in — cờ layer). Không cần entity type mới. Tool: lệnh `roomsep` chỉ hiện mode revit — vẽ như line.
### 5d · Thuật toán trace — CHỐNG TREO là yêu cầu số 1
Bài học `findHatchBoundary` treo >2 phút (TECH-DEBT 02/08) — thuật toán mới bắt buộc:
1. Nguồn: `extractWallSegments(doc)` (tim) + mọi line trên `l-room-sep` + biên `closed` WallRun.
2. Chỉ số hoá lưới (spatial hash ô 500mm) → ray-cast từ điểm click tìm vòng kín bằng walk "rẽ phải nhất" (planar face tracing) — O(n log n).
3. **Ngân sách cứng 50ms** (`performance.now()` check mỗi 200 bước) → quá = DỪNG, status "Vùng chưa kín hoặc quá phức tạp — kiểm tường/vẽ đường chia phòng", KHÔNG treo, KHÔNG tạo entity.
4. Vùng hở → cùng thông báo trên (một thông điệp, khuôn "mách nước" `SPEC-NGON-NGU-CHI-DAN`).
5. Room theo dõi biên: KHÔNG live-link pha 1 — lệnh `roomupdate` (chọn room → re-trace từ centroid). Live theo tường = pha 2, ghi rõ để PHU khỏi tự chế observer.

## 6 · TYPE / INSTANCE — câu thần chú áp vào cột
```ts
interface WallType {
  id: string; name: string;          // "Tường gạch 110" / "Vách thạch cao 100"
  thicknessMm: number;
  matIdCore?: string; matIdFinishL?: string; matIdFinishR?: string; // tham chiếu materials.ts — PHU đang mở rộng, chỉ cần string
  structural?: boolean;
}
// Doc.wallTypes?: WallType[] — per-doc. Thư viện type dùng chung = việc Master Library (SPEC-STAGE-LIBRARIES C1), hook sẵn, KHÔNG làm ở đây.
```
| Tham số | Type hay Instance? (thần chú: "đổi thì MỌI bản sao đổi theo?") |
|---|---|
| thicknessMm · matId core/finish · structural | **TYPE** — đổi 1 lần cả dự án đổi; `overrides` per-run vẫn cho (instance thắng) |
| locationLine · closed · path · openings | **INSTANCE** (per WallRun) |
| heightMm · wallKind · storey | **INSTANCE** — đã nằm sẵn ở `Base`/entity, GIỮ nguyên chỗ |
Đổi WallType → regen MỌI run có `typeId` đó trong MỘT snapshot (undo 1 nấc). Seed 4 type mặc định: gạch 110 · gạch 220 · thạch cao 100 · kính 12 (giá trị VN phổ thông — TỔNG/Hoà chỉnh danh sách lúc duyệt).

## 7 · BA MODE · ROUND-TRIP · BOQ
- **Lát cắt `when`** (sổ lệnh PHU đang làm — `registry.ts` phiếu PHU mục 3): `wall` mọi mode (revit = WallRun) · `door`/`window`/`roomsep`/`roomupdate` chỉ `cadMode=='revit'` (khuôn `PRO_ONLY_TOOLS` → thêm `REVIT_ONLY_TOOLS`, setCadMode rời revit tự trả tool về select — copy đúng cơ chế `store.ts:171`).
- **Navigator cây cấu kiện** (mock COWORK-UI đang nợ): dữ liệu đã đủ từ spec này — nhóm theo `storey` → WallType → WallRun/opening/room. Spec UI KHÔNG nằm ở đây.
- **Round-trip:** `.idf` = JSON, field optional tự sống — PHU thêm case vào `idf.test.ts` (doc có wallRuns → save/load nguyên vẹn; doc CŨ không có → không lỗi). **DXF:** xuất làm phẳng như hiện tại (hình học thuần, mất tham số — chấp nhận, như Revit→DWG); XDATA `IF_WALLRUN` = pha 2.
- **BOQ:** RoomEntity.areaM2 + WallRun (dài×cao−opening) là 2 nguồn `lib/boq` ăn ngay khi merge `49ebadd` — ghi 1 dòng vào phiếu BOQ ĐỢT 3, không làm trước.

## 8 · CHIA VIỆC + NGHIỆM THU
**PHU (lib thuần + test):** `lib/cad/wall-run.ts` MỚI — `wallOutline` (miter/bevel/T-trim + test góc 30/90/135/15°) · `regenWallRun` · `traceRoomBoundary` (+ test vùng kín/hở/ngân sách-50ms bằng doc 500 segment) · types vào `model.ts` · case round-trip `idf.test.ts`.
**Wiring CadCanvas + tool mới** (`door`/`window`/`roomsep`, Space ngữ cảnh, con trỏ cấm): TỔNG phân mảng khi phát phiếu — cùng ghi chú CadCanvas chưa gán chủ như `SPEC-VE-INFERENCE` §5.
**Mock UI** (Navigator cây cấu kiện · panel WallType · nhãn location line): COWORK-UI hàng đợi mục 2 — spec này là đầu vào dữ liệu cho mock đó.

**Nghiệm thu đo được:**
1. Vẽ WallRun 3 đoạn chữ U, đổi `thicknessMm` 110→220 ở type: mặt theo `locationLine` ĐỨNG YÊN (đo toạ độ biên trước/sau bằng nhau), góc L sạch không hở.
2. 2 run chạm chữ T → hatch liền, không nét thừa xuyên (soi zoom 400%).
3. Đặt cửa 800 giữa tường: hatch khoét đúng 800, arc swing đúng phía; Space tap 4 lần quay đủ 4 trạng thái về ban đầu; kéo tường dài ra → cửa giữ khoảng cách từ đầu path.
4. Xoá tường → cửa biến mất cùng (1 undo trả lại cả hai).
5. Click giữa phòng kín 4 tường → room + m²; cùng phòng đục 1 cửa → m² KHÔNG đổi (opening không phá vòng kín — trace theo tim).
6. Phòng HỞ 1 góc → thông báo mách nước trong <100ms, **không treo** (doc 500 segment vẫn <50ms — đo `performance.now`).
7. Vẽ `roomsep` chắn ngang phòng lớn → click 2 phía ra 2 room riêng.
8. Đổi WallType matIdCore → mọi run type đó đổi; run có override giữ nguyên override. Undo 1 nấc.
9. Save `.idf` → load lại: wallRuns/openings/room nguyên vẹn; mở file `.idf` CŨ (không field mới) → không lỗi console.
10. Chuyển mode revit→sketch: hình tường/cửa vẫn hiển thị đủ; tool door/window biến khỏi toolbar, tool đang cầm tự về select.

---
*Nguồn hành vi gốc: Revit wall location line / wall joins / rooms / type-instance (link ở cuối `SPEC-LENH-VE-IF.md`). Đối chiếu code 03/08/2026.*
