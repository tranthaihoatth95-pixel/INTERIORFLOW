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

---
---

# PHỤ LỤC 03/08 — TRỌNG TÂM NỘI THẤT (đợt 5)

**Vai lập:** COWORK-VẼ · **Ngày:** 03/08/2026 · **Trạng thái:** ĐỀ XUẤT (chờ TỔNG duyệt)
**Căn cứ:** `CHOT-TEN-CHANG-MODE-2026-08-03.md` §3 (*"BIM của IF = BIM NỘI THẤT — tường/cửa/sàn chỉ là VỎ CHỨA"*) + mục **VÒNG CUỐI** (ba chặng = ba ống kính, một nguồn dữ liệu) · `SO-KIEM-TONG.md` §0d (giữ-cái-đang-tốt), §0b (nghiên cứu 3 bước), §0 (luật trung thực).
**Kế thừa, KHÔNG đập:** `SPEC-TANG-DU-LIEU-CAU-KIEN.md` §2.2 (bảng elementType), §2.3 (thang suy đoán), §2.4 (field đề xuất), §6 (entity `room`), §7 (một neo `specId`).

> ⚠️ **QUAN HỆ VỚI §0-§8 BÊN TRÊN:** §0-§8 (WallRun · nối tường · cửa hosted · room trace · WallType) **VẪN ĐÚNG NGUYÊN, KHÔNG BỎ DÒNG NÀO.** Phụ lục này chỉ **đổi thứ tự ưu tiên**: những gì §0-§8 gọi là "cấu kiện chính" nay là **VỎ CHỨA** — vẫn phải làm, nhưng làm để **đỡ** cho lớp hoàn thiện · sàn lát · trần · tủ bếp · phào · đồ rời đứng lên trên. Đây là bổ sung ngang cấp, không phải bản thay thế.
>
> **Đổi tên theo VÒNG CUỐI:** file này tên "REVIT-MODE"; tên chốt nay là **chặng 2D Kỹ thuật**, mode **Nội thất** (khoá kỹ thuật `revit` **GIỮ NGUYÊN** — đổi khoá = vỡ persist, `SPEC-TANG-DU-LIEU-CAU-KIEN` §10). Đọc "mode Revit" = "mode Nội thất" trong mọi dòng dưới đây.

---

## §A0 · MỨC TIN CẬY CỦA PHỤ LỤC NÀY (luật §0)

| Loại phát biểu | Ký hiệu | Nghĩa |
|---|---|---|
| Có `file:dòng` | (không ký hiệu) | **đã kiểm bằng lệnh** ngày 03/08 trên repo `interiorflow` |
| **SUY ĐOÁN** | in đậm | chưa chạy tay/chưa đo, chỉ đọc code suy ra — phiên code phải verify trước khi dựa vào |
| **SỐ ĐỀ XUẤT** | in đậm | con số nghề do Cowork đề xuất, **chưa có nguồn đo** — phải vào CONFIG, chờ Hoà/QS xác nhận, CẤM hardcode rải rác |

**Chưa kiểm được (ghi rõ, không giấu):** chưa mở app chạy tay ca nào (Cowork không code, không chạy dev server); mọi kết luận về hành vi runtime đều là đọc code.

---

## §A1 · Ý TƯỞNG NỀN — "KIỂU ĐO" QUYẾT ĐỊNH CẢ BA ỐNG KÍNH

Bài học từ khuyết §0.3 của `SPEC-TANG-DU-LIEU-CAU-KIEN` (vùng tô sơn bị đùn thành tường 2.7m): 3D
đang hỏi **"hình này là hình gì"** (hatch? solid?) trong khi phải hỏi **"hạng mục này ĐO BẰNG GÌ"**.
Một lớp sơn và một bức tường có thể cùng là `HatchEntity` 4 đỉnh — khác nhau ở chỗ tường **có bề dày
để đùn**, sơn **chỉ có mặt để dán**.

⇒ **Chốt trục phân loại của BIM nội thất: KIỂU ĐO (5 loại, phủ hết).**

| Kiểu đo | Hạng mục | Ống kính 2D | Ống kính 3D | Ống kính Trình bày (BOQ) |
|---|---|---|---|---|
| **MẶT** (surface) | sơn tường · ốp tường · giấy dán · sàn lát · trần | vùng tô hatch (pattern theo `MaterialDef`) | **dán lên mặt host, KHÔNG đùn khối** | **m²** (trừ lỗ mở) × giá × hao hụt |
| **TUYẾN** (linear) | phào cổ trần · len chân tường · nẹp · chỉ · tay nắm thanh | polyline/tập cạnh của biên phòng | quét mặt cắt dọc tuyến (pha 1: prism chữ nhật) | **m dài** × giá × hao hụt cắt góc |
| **CỤM** (assembly) | tủ bếp · tủ âm tường · tủ áo đóng · quầy | đường bao + nét đứt tủ trên + ký hiệu thiết bị | nhiều khối con (thùng · cánh · mặt đá) | **nhiều dòng khác đơn vị** trong 1 cụm |
| **CÁI** (item) | sofa · bàn · ghế · đèn · thiết bị vệ sinh | block line-drawing top-view | proxy box / glTF | **cái** × đơn giá |
| **VỎ CHỨA** (shell) | tường · cửa · cửa sổ · sàn kết cấu · cột | như §0-§8 bên trên, **không đổi** | đùn khối như hiện tại | thường KHÔNG báo giá ở hồ sơ nội thất — chỉ là **mặt để lớp hoàn thiện bám** |

**Ba luật rút ra (dùng để bác đề xuất sau):**
- **N1 · MẶT không bao giờ sinh khối.** Bất kỳ hàm nào gọi `builder.prism(poly, 0, h)` cho một entity kiểu MẶT là sai. Lớp hoàn thiện chỉ được **offset khỏi mặt host 2mm** để không z-fighting.
- **N2 · Kiểu đo suy từ NGỮ NGHĨA, không suy từ hình học.** `elementType` (+ `coveringHost` §A3) quyết; `solid`/`pattern`/tên layer **không được** tham gia quyết định (đúng L3 spec nền).
- **N3 · Một hạng mục = một entity nguồn, nhiều dòng BOQ.** Tủ bếp ra 4 dòng khác đơn vị nhưng vẫn là MỘT `CabinetRun` trong Doc. Cấm tách thành 4 entity để "cho BOQ dễ tính".

---

## §A2 · RANH GIỚI — CÁI GÌ THUỘC MODE NỘI THẤT, CÁI GÌ ĐỂ CHO MODE KỸ THUẬT

Luật cắt: **mode Nội thất sở hữu HẠNG MỤC THI CÔNG NỘI THẤT (cái nhà thầu nội thất báo giá và làm).
Mode Kỹ thuật sở hữu TỜ BẢN VẼ (cái hoạ viên nộp).** Không ôm chéo.

| Việc | Mode **Nội thất** | Mode **Kỹ thuật** | Lý do cắt |
|---|---|---|---|
| Vẽ tường, nối tường, cửa hosted, WallType | ✅ (§0-§8 bên trên) | ✅ kế thừa hiển thị | Vỏ chứa — nội thất cần nó để bám lớp hoàn thiện |
| Gán lớp hoàn thiện (sơn/ốp/giấy) lên mặt | ✅ **độc quyền** | ❌ | Là hạng mục nội thất thuần |
| Sàn lát: hướng lát · mạch · viên bắt đầu | ✅ **độc quyền** | ❌ | — |
| Trần: cao độ · giật cấp · đèn âm trần | ✅ **độc quyền** | ❌ | — |
| Tủ bếp/tủ âm tường (CabinetRun) | ✅ **độc quyền** | ❌ | — |
| Phào · len chân tường | ✅ **độc quyền** | ❌ | — |
| Đặt đồ rời + gán `specId` | ✅ | ✅ (đã có sẵn ở mọi mode — **KHÔNG được rút về mode Nội thất**, sẽ RỚT tính năng) | §0d giữ-cái-đang-tốt |
| **Mặt bằng trần (RCP)** — tờ bản vẽ | ❌ chỉ cấp DỮ LIỆU | ✅ dựng tờ, khung tên, tỉ lệ in | Tờ giấy là việc của Kỹ thuật (`SPEC-VE-LAYOUT-PAPER`) |
| **Mặt cắt · khai triển tường** — tờ bản vẽ | ❌ chỉ cấp DỮ LIỆU | ✅ | như trên |
| Ghi kích thước (`dim`), ký hiệu, chú thích | ❌ | ✅ | `SPEC-TANG-DU-LIEU-CAU-KIEN` §5: dim/text chỉ sống ở ống kính 2D |
| Bảng thống kê in lên bản vẽ (`scheduleToEntities`) | ❌ | ✅ | đã chạy, không đụng |
| Bảng BOQ có giá | ❌ | ❌ | Thuộc **chặng Trình bày** (`SPEC-MODE-PER-STAGE` §4) — mode Nội thất chỉ cấp số lượng |
| Vật liệu PBR · quả cầu xem trước · ánh sáng | ❌ | ❌ | Thuộc **chặng 3D Thiết kế** |

**Ba câu "KHÔNG ôm" ghi to để phiên sau khỏi hỏi lại:**
1. Mode Nội thất **không dựng tờ bản vẽ nào** — nó nuôi dữ liệu, Kỹ thuật in ra.
2. Mode Nội thất **không hiện giá tiền** — nó ra số lượng theo đơn vị, Trình bày nhân giá.
3. Mode Nội thất **không render** — nó gán `specId`, chặng 3D đọc PBR từ đó.

---

## §A3 · LỚP HOÀN THIỆN (sơn · ốp · giấy dán) — kiểu MẶT

### §A3.1 · Đây là chỗ đang có BUG, phải vá TRƯỚC khi mở mode

Chuỗi bằng chứng (kiểm 03/08, khớp `SPEC-TANG-DU-LIEU-CAU-KIEN` §0.3):
1. `lib/cad/materials.ts:146-177` — 3 preset sơn (`son-trang`, `son-xam-am`, `son-xanh-reu`) đều `hatchPattern: 'SOLID'`.
2. Tô sơn ⇒ sinh `HatchEntity` với `pattern:'SOLID'`, layer bất kỳ.
3. `lib/three/cad-to-obj.ts:350-355` — bộ lọc tường: `wallLayers.has(e.layer) || e.solid === true || e.pattern === 'SOLID' || !e.pattern`.
4. `cad-to-obj.ts:413-417` — mọi phần tử trong `wallHatches` bị `builder.prism(h.points, 0, wallH)`, `wallH = clampWallHeight(h.heightMm ?? 2700)`.
⇒ **SUY ĐOÁN (chưa chạy tay):** mỗi mảng sơn tô ở 2D mọc thành một khối 2.7m giữa phòng khi mở 3D.

### §A3.2 · 🔴 VÁ TỐI THIỂU — rẻ, an toàn, làm được NGAY (không chờ NC-11)

**Luật vá:** `HatchEntity` **có `specId`** ⇒ **KHÔNG BAO GIỜ là tường**, loại khỏi `wallHatches`.

Vì sao an toàn — kiểm bằng lệnh: poché tường do lệnh WALL sinh ra **không hề set `specId`**
(`lib/cad/commands.ts:64` — `wallSegment()` trả `{ id, type:'hatch', layer, points, solid:true }`,
đúng 5 field, không có `specId`). Ngược lại `HatchEntity.specId` được khai chính là để neo vật liệu
(`lib/cad/model.ts:318`). ⇒ Điều kiện này **không thể** loại nhầm tường cũ, và bắt đúng 100% vùng tô
đã gán vật liệu.

| | Trước vá | Sau vá |
|---|---|---|
| Poché tường (WALL tool) | vào `wallHatches` ✅ | vào `wallHatches` ✅ (không có `specId`) |
| Vùng sơn đã gán vật liệu | vào `wallHatches` 🔴 | bị loại ✅ |
| Vùng SOLID cũ chưa gán gì | vào `wallHatches` | vào `wallHatches` (giữ nguyên hành vi cũ — §0d) |

Vá này **không đụng** thang `inferElementType` §2.3 của spec nền, **không** chờ `'covering'` vào
`ElementType`, **không** phá `.idf` cũ. Đây là **P0.5** chèn giữa P0 và P1 của lộ trình spec nền.

### §A3.3 · Dữ liệu cần khai

Entity nguồn = `HatchEntity` (tái dùng, **không đẻ type mới**).

| Field | Mới/Cũ | Giá trị | Ai ăn |
|---|---|---|---|
| `specId` | ✅ **đã có** `model.ts:318` | → `ProductSpec` `kind:'material'` | 2D pattern · 3D PBR · BOQ giá |
| `elementType: 'covering'` | ⬜ **thiếu** — `model.ts:78-89` mới có 8 giá trị, không có `covering` | `IfcCovering` | thang §2.3 · 3D · IFC (NC-11) |
| `coveringHost: 'wall' \| 'floor' \| 'ceiling'` | ⬜ **thiếu hẳn** | quyết **mặt phẳng dán** trong 3D | 3D (bắt buộc) · BOQ (nhóm "sơn tường" vs "sơn trần") |
| `thicknessMm` | ⬜ thiếu (spec nền §2.4 đã đề xuất vào `Base`) | sơn 0 · giấy 1 · ốp gỗ 15 · gạch ốp 8 (**SỐ ĐỀ XUẤT**) | 3D offset · BOQ m³ vữa (pha sau) |
| `elevationMm` + `heightMm` | ⬜ thiếu (spec nền §2.4) | ốp lửng (lambri cao 1200) — đáy/đỉnh dải ốp | 3D · BOQ |
| `roomId` | ⬜ thiếu (spec nền §2.4) | thuộc phòng nào | BOQ nhóm theo phòng |

⚠️ **`coveringHost` là field DUY NHẤT phụ lục này đề nghị thêm ngoài danh sách §2.4 spec nền.**
Lý do bắt buộc: `elementType:'covering'` một mình **không đủ** cho 3D biết dán mặt nào — sơn tường
(mặt đứng) và sơn trần (mặt nằm ngang cao 2.7m) là hai mặt phẳng khác nhau, không suy được từ hình
học 2D (cả hai đều là polygon nằm trên mặt bằng). Nơi tiêu thụ ngay (luật L7): `docToObjScene` §A3.5.

### §A3.4 · Chặng 2D vẽ ra sao
- Vùng tô hatch với `pattern`/`patternScale`/`patternAngle` từ `MaterialDef` — **cơ chế đã chạy**, `applyMaterial()` trong store set sẵn (`materials.ts` đầu file).
- Sơn = `SOLID` ⇒ 2D nhìn như mảng màu phẳng: **đúng, không phải lỗi**. Lỗi chỉ nằm ở 3D (§A3.1).
- **Mặt bằng KHÔNG vẽ sơn tường** (chuẩn nghề: mặt bằng cắt ngang 1.2m, mặt sơn nhìn theo phương đứng không thấy). Vùng sơn tường sống trên **layer riêng, mặc định TẮT ở tờ mặt bằng**, chỉ bật ở tờ khai triển tường. ⇒ **Thiếu:** `DEFAULT_LAYERS` (`model.ts:606-611`) chỉ có 5 layer (`l-wall`·`l-furniture`·`l-dim`·`l-text`·`l-axis`), **không có layer hoàn thiện**. Đề xuất thêm `l-finish-wall`·`l-finish-floor`·`l-finish-ceiling` (additive, `.idf` cũ không có vẫn chạy — cùng khuôn `IF_CAMPATH` `model.ts:614`).

### §A3.5 · Chặng 3D dựng ra sao (hợp đồng cho PHU)
```
covering:
  coveringHost==='floor'   → mặt phẳng z = 0 + thicknessMm, dán texture, KHÔNG prism
  coveringHost==='ceiling' → mặt phẳng z = (ceilingHeightMm của phòng) − thicknessMm
  coveringHost==='wall'    → quét polygon lên mặt đứng của tường host, dải từ elevationMm → elevationMm+heightMm
                             (mặc định 0 → heightMm tường)
```
Ba ca đều dùng **mặt (2 tam giác/quad)**, không `prism`. Offset 2mm khỏi mặt host chống z-fighting.
`SceneGroup.entityId` **phải gán** (Đ1 spec nền §8) — nếu không thì bấm vào mảng sơn trong 3D chẳng
biết đổi vật liệu cho ai.

### §A3.6 · BOQ tính thế nào
```
m²_thuần   = polygonArea(points) / 1e6                      ← hatch.ts:56 ĐÃ CÓ
m²_trừ_lỗ  = m²_thuần − openingsAreaInPolygon(entities, points)   ← hatch.ts:112 ĐÃ CÓ
m²_thi_công = m²_trừ_lỗ × (1 + wastagePercent/100)          ← ProductSpec.wastagePercent ĐÃ CÓ
```
⚠️ Ghi chú trung thực: `lib/boq/model.ts` đầu file ghi rõ v1 **KHÔNG trừ lỗ mở** (*"không có test case
nào xác nhận hành vi trừ lỗ mở là đúng cho vùng tô nói chung, vd sàn/trần không có lỗ mở"*). Đó là
quyết định ĐÚNG cho v1 generic. Với `covering` thì rẽ nhánh theo `coveringHost` là đủ an toàn:
`'wall'` ⇒ **trừ** lỗ mở · `'floor'`/`'ceiling'` ⇒ **không trừ**. Hàm `openingsAreaInPolygon` đã sẵn,
chỉ cần gọi có điều kiện — **không viết engine hình học mới**.

---

## §A4 · SÀN LÁT (gạch · gỗ · đá) — kiểu MẶT + tham số lát

### §A4.1 · Dữ liệu cần khai (ngoài phần chung §A3.3, `coveringHost:'floor'`)

| Field | Ý nghĩa | Mặc định đề xuất |
|---|---|---|
| `tileWMm` · `tileHMm` | kích thước **viên** thật (mm) | lấy từ `ProductSpec.w`/`d` (**đã có** `schema.prisma`) — chỉ override khi cắt viên |
| `layAngleDeg` | hướng lát (0 = song song trục X; 45 = lát chéo) | 0 |
| `layOrigin: Pt` | **viên bắt đầu** — góc đặt viên nguyên đầu tiên | góc dưới-trái bbox vùng |
| `groutMm` | bề rộng mạch | gạch 2 · đá 1 · gỗ 0 (**SỐ ĐỀ XUẤT**) |
| `layPattern` | `'grid' \| 'running' \| 'herringbone' \| 'basketweave'` | `'grid'`; gỗ mặc định `'running'` |

Bốn field trên **thiếu hẳn** — `HatchEntity` (`model.ts:294-320`) chỉ có `patternScale`/`patternAngle`,
là **tỉ lệ tương đối của nét gạch hatch**, KHÔNG phải kích thước viên mm. Không được dùng nhầm.

### §A4.2 · 🔴 Phát hiện: hệ vật liệu hiện tại KHÔNG mang kích thước viên (mm)

`MaterialDef` (`materials.ts:31-66`) có `hatchPattern`·`patternScale`·`patternAngle`·`color`·
`texture`·`tones`·`photoUrl`·`atlasRecordId`·`pbr` — **không có field kích thước thật (mm)**.
`SPEC-TANG-DU-LIEU-CAU-KIEN` §7 đã đòi *"`tiling size (mm)` là BẮT BUỘC — 2D và 3D phải đọc cùng một
con số"*. ⇒ **Con số đó hôm nay không tồn tại ở đâu trong `materials.ts`.** Nguồn duy nhất khả dĩ là
`ProductSpec.w/d` (`prisma/schema.prisma`, kích thước danh nghĩa mm) — tức **phải qua `specId`**, không
qua `MaterialDef`. Chốt luôn để khỏi đẻ field thứ hai: **kích thước viên đọc từ `ProductSpec.w/d`;
`MaterialDef` giữ đúng vai trò thị giác 2D.**

### §A4.3 · 2D vẽ ra sao — và giới hạn thật của hệ hatch hiện tại
`HatchPattern` chỉ có **5 giá trị** (`model.ts:290`): `SOLID`·`ANSI31`·`ANSI32`·`ANSI37`·`DOTS`.
`hatchLines()` (`hatch.ts:393`) vẽ **nét gạch song song**, `hatchDots()` (`hatch.ts:366`) vẽ chấm.
⇒ **Không vẽ được lưới viên gạch thật (2 phương vuông góc, có mạch, có gốc lát).**

| Pha | Cách vẽ | Đánh giá trung thực |
|---|---|---|
| **Pha 1** (rẻ, dùng ngay) | giữ hatch preset như hiện tại; `layAngleDeg` ghi vào `patternAngle` (đã có) để nhìn ra hướng lát | Nhìn ra "sàn gỗ chạy dọc/ngang" — **đủ cho DD, KHÔNG đủ cho bản vẽ thi công lát gạch** |
| **Pha 2** (việc thật) | renderer mới `tileGrid(poly, tileW, tileH, grout, angle, origin, pattern)` — cắt lưới theo polygon | Đây mới là cái hoạ viên nội thất cần: đếm được viên, thấy viên cắt ở mép |

Ghi rõ pha 2 là **việc mới, không rẻ** — đừng hứa trong sprint có pha 1.

### §A4.4 · 3D dựng ra sao
Dán texture lên mặt phẳng z=0 (§A3.5). UV scale phải theo `tileWMm`/`tileHMm` **thật**, xoay theo
`layAngleDeg`, gốc UV theo `layOrigin`. Nếu 3D tự chọn scale riêng ⇒ tái phạm đúng lỗi "hai nguồn
một con số" mà spec nền §7 cấm.

### §A4.5 · BOQ tính thế nào — 3 con số, không phải 1
```
① m²_thuần   = polygonArea / 1e6                     (không trừ lỗ — sàn không có lỗ mở)
② m²_đặt_hàng = m²_thuần × (1 + hao_hụt%)
③ số_đơn_vị  = CEIL( m²_đặt_hàng / m²_mỗi_thùng )    ← ProductSpec.packagingSpec ĐÃ CÓ
                (vd "4 viên/thùng = 1,44 m²" — schema.prisma ghi đúng công dụng CEILING này)
```
**Hao hụt phụ thuộc KIỂU LÁT**, không phải hằng số một con:

| Kiểu lát | Hao hụt đề xuất | Ghi chú |
|---|---|---|
| `grid` thẳng | **5%** | **SỐ ĐỀ XUẤT** |
| `running` (so le) | **7%** | **SỐ ĐỀ XUẤT** |
| chéo 45° (`layAngleDeg`≈45) | **10-12%** | **SỐ ĐỀ XUẤT** — cắt biên nhiều nhất |
| `herringbone` / `basketweave` | **12-15%** | **SỐ ĐỀ XUẤT** |

**Luật ưu tiên (chốt, tránh cãi):** `ProductSpec.wastagePercent` **THẮNG** nếu có (số của NCC/ATLAS,
đọc thật). Bảng trên chỉ là **fallback khi NCC để trống**, và phải nằm trong CONFIG cùng chỗ với
`BOQ_OPENING_MIN_AREA_M2` (`hatch.ts:84` — đúng tiền lệ *"vào CONFIG, không hard-code rải rác"*).
Hai con số phải **hiện riêng trên bảng** (m² thuần vs m² đặt hàng) — nhà thầu cần thấy cả hai.

---

## §A5 · TRẦN (trần thả · giật cấp · thạch cao) — kiểu MẶT + cao độ riêng

### §A5.1 · Luật gốc: cao độ trần ≠ cao độ tường
`RoomEntity.ceilingHeightMm` (spec nền §6.2) đủ cho **trần phẳng một cấp**. **Trần giật cấp = nhiều
vùng cao độ khác nhau TRONG CÙNG một phòng** ⇒ không treo được vào một field của phòng.

⇒ **Chốt mô hình:** mỗi **cấp trần** = một `HatchEntity` riêng, `elementType:'covering'`,
`coveringHost:'ceiling'`, `elevationMm` = **cao độ ĐÁY trần cấp đó** (so với cốt sàn hoàn thiện),
`thicknessMm` = dày tấm. Trần 2 cấp = 2 vùng chồng nhau, `elevationMm` khác nhau.
`RoomEntity.ceilingHeightMm` giữ vai trò **mặc định của phòng** khi không có vùng trần nào — không bỏ.

### §A5.2 · Hiện trạng 3D (kiểm 03/08) — trần đang là **một tấm bbox toàn nhà**
`cad-to-obj.ts:421-424`: `if (opts.ceiling) { builder.object('Ceiling', mats.ceil); builder.prism(floorPoly, H, H+100); }`
— `floorPoly` là bbox toàn bản vẽ nở 50mm (`:375-385`), `H` là cao tường chung.
⇒ Không có khái niệm trần từng phòng, không có cao độ riêng, không mang vật liệu.
**Giữ nguyên làm FALLBACK** khi Doc không có vùng trần nào (§0d — không đập cái đang chạy); có vùng
trần thì dựng theo vùng.

### §A5.3 · Đèn âm trần — nối vào cái ĐANG CÓ, đừng làm lại
Kiểm `lib/cad/mep.ts:84-96`: đã có 4 ký hiệu đèn nhóm `'Điện'` — `lightDownlight` (Ø100),
`lightPendant`, `lightTrack`, `lightWall`. Ký hiệu 2D **đã chạy**.

| Việc | Trạng thái |
|---|---|
| Ký hiệu 2D đèn | ✅ đã có (`mep.ts`) |
| Đèn có `specId` để vào BOQ | ✅ cơ chế có (`BlockEntity.specId` `model.ts:285`), `ProductSpec.kind` có sẵn giá trị `'lighting'` (`lib/server/specs.ts:6`) |
| Đèn biết mình ở **cao độ trần nào** | ⬜ **thiếu** — cần `elevationMm` trên block, hoặc suy từ vùng trần chứa nó (**SUY ĐOÁN: suy từ vùng chứa là đủ, khỏi khai tay**) |
| Đèn hiện trong 3D | ⬜ **không dựng gì** — `cad-to-obj.ts:357-360` chỉ nhận block có `BLOCK_MAP[b.block]`, mà đèn định nghĩa ở `mep.ts` (nhóm `'Điện'`) chứ không nằm trong `BLOCK_MAP` của `furniture.ts:639`. **SUY ĐOÁN: đèn hiện đang biến mất khỏi 3D** — PHU verify 2 phút |

**Không làm ở đợt này:** tính toán chiếu sáng (lux), rải đèn tự động, mạch điện. Chưa có nơi tiêu thụ (L7).

### §A5.4 · BOQ trần — 2 dòng, đừng quên dòng thứ hai
```
① m² trần      = Σ polygonArea(vùng trần) / 1e6                (không trừ lỗ đèn — lỗ đèn quá nhỏ, dưới ngưỡng BOQ_OPENING_MIN_AREA_M2 = 0.5m², hatch.ts:84)
② m² CỔ TRẦN   = Σ [ polygonPerimeter(vùng cấp trên) × (elevation_dưới − elevation_trên) ] / 1e6
                 ← mặt đứng của bậc giật cấp — dân thi công BÁO GIÁ RIÊNG, quên là thiếu tiền thật
③ cái đèn      = đếm block nhóm 'Điện' trong vùng     ← buildSchedule (schedule.ts:68) ĐÃ đếm được
```
`polygonPerimeter` **đã có** (`hatch.ts:72`) — dùng thẳng, không viết lại.

---

## §A6 · TỦ BẾP / TỦ ÂM TƯỜNG — kiểu CỤM (nhiều bộ phận, KHÔNG phải 1 khối)

### §A6.1 · Hiện trạng: chỉ có block cứng, không tham số
`lib/cad/furniture.ts` có: `kitchenI` (Bếp chữ I, `w:3000 h:600`, dòng 562) · `kitchenIsland`
(Đảo bếp 1800×900, 568) · `wardrobe` (Tủ áo 1800×600, 543) · `refrigerator`·`rangeHood`·`microwave`.
⇒ Đây là **ký hiệu mặt bằng cố định**, không chia khoang, không phân biệt thùng/cánh/mặt đá, không
tính được mét dài. Đủ cho **sơ phác**, không đủ cho **hồ sơ nội thất**.

**Giữ nguyên toàn bộ block này** (§0d) làm đường sơ phác + fallback. Mode Nội thất thêm `CabinetRun`
**bên cạnh**, không thay.

### §A6.2 · `CabinetRun` — đối xứng với `WallRun` (§2 bên trên), cố ý cùng khuôn
```ts
interface CabinetRun {
  id: string;
  path: Pt[];                    // TUYẾN tủ — bám mặt tường; chữ L/U = path nhiều đoạn
  bank: 'base' | 'wall' | 'tall';// tủ dưới · tủ trên · tủ cao (kịch trần)
  depthMm: number;               // base 600 · wall 350 · tall 600      (SỐ ĐỀ XUẤT, chuẩn VN)
  heightMm: number;              // base 720 · wall 700 · tall 2200     (SỐ ĐỀ XUẤT)
  elevationMm: number;           // base 100 (chân) · wall 1400 · tall 0 (SỐ ĐỀ XUẤT)
  carcassSpecId?: string;        // THÙNG tủ  → ProductSpec kind 'millwork'  (m² ván)
  doorSpecId?: string;           // CÁNH      → kind 'millwork'              (m² cánh)
  counterSpecId?: string;        // MẶT ĐÁ    → kind 'material'              (m dài hoặc m²)
  backsplashSpecId?: string;     // ỐP LƯNG BẾP → kind 'material'            (m²)
  modules?: CabinetModule[];     // chia khoang — undefined = 1 khoang chạy suốt
  entityIds: string[];           // hình 2D đã sinh — regen thì thay đúng đám này (khuôn WallRun §2)
}
interface CabinetModule {
  widthMm: number;
  kind: 'door' | 'drawer' | 'open' | 'appliance' | 'sink' | 'hob';
  applianceSpecId?: string;      // thiết bị lắp trong (bếp từ, lò, máy rửa bát) → kind 'fixture'
  hardwareSpecIds?: string[];    // ray, bản lề, tay nắm → kind 'fixture', đếm CÁI
}
```
**Vì sao dùng lại khuôn `WallRun`:** cùng bài toán (tuyến + type + regen + `entityIds`), cùng luật
regen (§2 *"một `snapshot()` cho cả cụm"*), cùng cách undo. Phiên code viết `regenCabinetRun` gần như
sao chép `regenWallRun` — rẻ và nhất quán. `ProductSpec.kind` **đã có sẵn** `'millwork'` và
`'fixture'` (`lib/server/specs.ts:6`) — **không cần thêm kind mới**.

### §A6.3 · 2D vẽ ra sao (chuẩn nghề, đừng vẽ sai quy ước)
| Thành phần | Nét |
|---|---|
| Tủ **dưới** (base) | nét liền — mặt bằng cắt 1.2m nhìn thấy |
| Tủ **trên** (wall) | **nét ĐỨT** — nằm trên mặt cắt, `lineType:'dashed'` (Base đã có `lineType`, `model.ts:159`) |
| Đường chia khoang | nét mảnh trong đường bao |
| Chậu rửa · bếp từ · hút mùi | ký hiệu block — `lavabo`·`kitchenI`·`rangeHood` **đã có** trong `BLOCK_MAP`, đặt như block con của run |
| Mặt đá | trùng đường bao tủ dưới, nhô ra 20mm phía trước (**SỐ ĐỀ XUẤT**) |

Mặt đứng/khai triển tủ: **KHÔNG làm trong mode Nội thất** — là tờ bản vẽ, thuộc mode Kỹ thuật (§A2).

### §A6.4 · 3D dựng ra sao
Mỗi module ra **3 khối con** (nhóm chung 1 `SceneGroup` với `entityIds`, đúng Đ1 spec nền §8):
```
thùng  : prism(footprint thu vào 18mm mỗi bên), z = elevationMm → elevationMm+heightMm
cánh   : tấm dày 18mm ốp mặt trước, hở khe 3mm giữa các cánh    (SỐ ĐỀ XUẤT)
mặt đá : chỉ bank==='base' — tấm dày 20mm, z = elevationMm+heightMm, nhô 20mm  (SỐ ĐỀ XUẤT)
```
Đây **không phải** modeling nội thất chi tiết — là khối nghiên cứu đúng tỉ lệ, cùng tinh thần
`furnitureHeightMm()` proxy (`cad-to-obj.ts:167`). Chi tiết thật (bản lề, ray, chỉ cạnh) **không dựng**.

### §A6.5 · BOQ — bốn dòng khác đơn vị từ MỘT cụm (đây là điểm bán hàng)
| Dòng | Công thức | Đơn vị (`ProductSpec.unit` đã hỗ trợ) |
|---|---|---|
| Tủ bếp dưới | `Σ length(path)` / 1000 | `m` — **cách báo giá phổ biến nhất ở VN** |
| Tủ bếp trên | `Σ length(path)` / 1000 | `m` |
| Cánh tủ | `Σ (module.widthMm × heightMm)` / 1e6 | `m2` |
| Mặt đá | `Σ length(path) × (depthMm+20)` / 1e6, **hoặc** m dài tuỳ NCC | `m2` hoặc `m` |
| Ốp lưng bếp | `Σ length(path) × 600` / 1e6 (**SỐ ĐỀ XUẤT** cao ốp lưng 600) | `m2` |
| Phụ kiện | đếm `hardwareSpecIds` + `applianceSpecId` | `cai` / `bo` |

`ProductSpec.unit` đã khai đúng tập giá trị cần: `'m2' \| 'm' \| 'cai' \| 'bo' \| 'm3'`
(`prisma/schema.prisma`, dòng comment field `unit`) — **không cần mở rộng schema DB**.

---

## §A7 · PHÀO CHỈ / LEN CHÂN TƯỜNG — kiểu TUYẾN

### §A7.1 · Tin tốt: hàm chu vi ĐÃ CÓ, đúng chữ ký cần
`hatch.ts:72` — `polygonPerimeter(poly: Pt[], edgeMask?: boolean[])`, docstring ghi thẳng công dụng:
*"Dùng cho m dài BOQ (chân tường/nẹp/tay nắm) — nẹp cạnh chỉ lấy cạnh biên, không lấy toàn chu vi"*.
⇒ Nền tính m dài **đã sẵn sàng**, không phải viết mới.

### §A7.2 · 🔴 Nhưng `edgeMask` KHÔNG đủ cho cửa — phát hiện của phụ lục này
`edgeMask` bật/tắt **cả một cạnh**. Ca thật: phòng 4×5m, cạnh dài 5000mm có 1 cửa rộng 900 ở giữa.
Len chân tường phải là **5000 − 900 = 4100**, không phải "bỏ cả cạnh 5000" cũng không phải "lấy đủ
5000". `edgeMask` không diễn đạt được ca này.

⇒ **Thiếu thật, đề xuất hàm mới** (đối xứng hoàn hảo với `openingsAreaInPolygon` đã có `hatch.ts:112`):
```ts
/** Tổng BỀ RỘNG (mm) các lỗ mở nằm TRÊN biên `poly` — trừ khỏi chu vi khi tính m dài
 *  len chân tường / phào. Cùng khuôn openingsAreaInPolygon: chỉ nhận block đã phân loại
 *  elementType 'door' | 'window'; rộng lấy qua blockInfo() (schedule.ts, TÁI DÙNG). */
export function openingsWidthOnBoundary(entities: Entity[], poly: Pt[], tolMm = 150): number
```
- Điều kiện "nằm trên biên": khoảng cách từ `block.at` tới cạnh gần nhất ≤ `tolMm` (dung sai nửa bề dày tường, **SỐ ĐỀ XUẤT 150**).
- Chỉ trừ `door` cho **len chân tường**; `window` **không trừ** (cửa sổ có bệ, len vẫn chạy dưới). Rẽ nhánh theo loại phào — ghi rõ, đừng trừ mù.

### §A7.3 · Dữ liệu cần khai
Treo trên `RoomEntity` (spec nền §6.2 đã có `skirtingSpecId` — dùng đúng field đó, **không đẻ field thứ hai**), bổ sung:

| Field | Ý nghĩa |
|---|---|
| `skirtingSpecId` | ✅ **đã đề xuất** ở spec nền §6.2 — len chân tường |
| `corniceSpecId` | ⬜ thêm — phào cổ trần (chạy trên đỉnh tường) |
| `skirtingHeightMm` | ⬜ thêm — cao len (VN phổ biến 80-120, **SỐ ĐỀ XUẤT** mặc định 100) |
| `skirtingEdgeMask?: boolean[]` | ⬜ thêm — cạnh nào KHÔNG có len (mặt tủ bếp liền tường, cửa lùa âm tường) |

### §A7.4 · 2D vẽ ra sao — chốt: **KHÔNG vẽ lên mặt bằng**
Chuẩn nghề: mặt bằng cắt ngang ~1.2m, len chân tường nằm dưới mặt cắt, **không thể hiện**. Vẽ lên là
rác. Phào chỉ hiện ở **mặt cắt / khai triển tường** (mode Kỹ thuật) và ở **bảng khối lượng**.
⇒ Mode Nội thất chỉ **khai dữ liệu + hiện số m dài trong Inspector của phòng**, không sinh entity 2D nào.
Đây là ca rõ nhất của luật §A2: dữ liệu ở Nội thất, tờ giấy ở Kỹ thuật.

### §A7.5 · 3D dựng ra sao
Pha 1: prism chữ nhật `15mm × skirtingHeightMm` chạy dọc biên phòng, z = 0 → `skirtingHeightMm`
(**SỐ ĐỀ XUẤT** dày 15). Phào cổ trần tương tự tại z = cao trần. Sweep mặt cắt thật = pha 2, chỉ khi
có thư viện mặt cắt phào — **chưa có, đừng hứa**.

### §A7.6 · BOQ tính thế nào
```
m_dài = [ polygonPerimeter(room.boundary, skirtingEdgeMask)
          − openingsWidthOnBoundary(entities, room.boundary) ] / 1000
m_đặt_hàng = m_dài × (1 + hao_hụt%)   ; hao hụt cắt góc: SỐ ĐỀ XUẤT +5%, hoặc +0.1m mỗi góc
số_thanh = CEIL( m_đặt_hàng / chiều_dài_thanh )   ← ProductSpec.packagingSpec (vd "2,4m/thanh")
```
⚠️ `lib/boq/compute.ts:89` `computeBoq()` hiện **chỉ quét `HatchEntity` → m²** (`lib/boq/model.ts`:
`BoqRow` có đúng một field số lượng là `m2`). ⇒ **Nhánh m dài chưa tồn tại trong BOQ engine.** Đây là
việc thật, xem §A9.

---

## §A8 · ĐỒ RỜI (sofa · bàn · ghế) — kiểu CÁI, gần xong nhất

### §A8.1 · Đã có gì (kiểm 03/08) — phần lớn đường ống ĐANG CHẠY
| Mắt xích | Trạng thái |
|---|---|
| Thư viện block | ✅ `furniture.ts:484-635` — ~46 block, nhóm `'Phòng khách'`·`'Phòng ngủ'`·`'Bếp'`·`'Vệ sinh'`·`'Làm việc'`·`'Kiến trúc'`·`'Cầu thang'`·`'Thiết bị'`; `BLOCK_MAP` `furniture.ts:639` |
| Biến thể | ✅ `ShapeVariant` (sofa góc trái/phải, giường 1.0/1.2/1.5/1.8) |
| Neo sản phẩm | ✅ `BlockEntity.specId` `model.ts:285` |
| Đếm số lượng | ✅ `buildSchedule()` `schedule.ts:68` → `ScheduleRow{count, block, specId, w, h, ids}` |
| Copy thuộc tính | ✅ eyedropper chép cả `specId` (`eyedropper.test.ts:15`) |
| 3D proxy | ✅ `cad-to-obj.ts:428-433` box theo footprint × `furnitureHeightMm(def.id)` |

### §A8.2 · Thiếu gì
| Thiếu | Bằng chứng |
|---|---|
| **Giá của đồ rời không vào BOQ** | `computeBoq` (`compute.ts:89`) chỉ nhận `HatchEntity`; block không được quét dòng nào |
| **Cao thật 3D không đọc từ ProductSpec** | `furnitureHeightMm()` (`cad-to-obj.ts:167-178`) là **bảng if/else hardcode theo tiền tố id** (`sofa*`→800, `bed*`→500, `wardrobe`→2100…) — trong khi `ProductSpec.hUp` (`schema.prisma`) đã khai *"cao thật 3D cho spec sheet"*. Hai nguồn cùng một con số, đúng bệnh spec nền §7 cấm |
| **Block ngoài `BLOCK_MAP` biến mất khỏi 3D** | `cad-to-obj.ts:357-360` lọc `BLOCK_MAP[b.block]` — đèn `mep.ts` không nằm trong map đó (**SUY ĐOÁN**, PHU verify) |
| **Cửa đi không dựng gì trong 3D** | `:361` chỉ nhận `b.block === 'window'`; đã ghi ở spec nền §0.2 |

### §A8.3 · Việc gọn nhất, giá trị cao nhất
`furnitureHeightMm(blockId)` → `furnitureHeightMm(blockId, spec?: {hUp?: number})`: **có `hUp` thì
dùng, không thì rơi về bảng cũ**. Additive, không phá test cũ, xoá được một nguồn trùng. Chi phí thấp
nhất trong toàn phụ lục này.

---

## §A9 · ĐỐI CHIẾU CODE — TÁI DÙNG GÌ / THIẾU THẬT GÌ (kiểm bằng lệnh 03/08)

### §A9.1 · Tái dùng được ngay — KHÔNG viết lại
| Cần cho | Đã có | File:dòng |
|---|---|---|
| m² vùng tô | `polygonArea` | `lib/cad/hatch.ts:56` |
| **m dài chu vi + chọn cạnh** | `polygonPerimeter(poly, edgeMask?)` | `lib/cad/hatch.ts:72` |
| Trừ lỗ mở khi tính m² | `openingsAreaInPolygon` + `BOQ_OPENING_MIN_AREA_M2` + `OPENING_STANDARD_HEIGHT_MM` | `hatch.ts:112` · `:84` · `:97` |
| Dò biên phòng | `findHatchBoundary` / `traceHatchBoundary` / `collectBoundarySegments` | `hatch.ts:317` · `:300` · `:128` |
| Neo vật liệu trên vùng tô | `HatchEntity.specId` | `model.ts:318` |
| Neo sản phẩm trên đồ rời | `BlockEntity.specId` | `model.ts:285` |
| Preset vật liệu 2D (13 preset, 3 danh mục `Sàn`/`Tường-Ốp`/`Sơn`) | `MATERIALS` / `MaterialDef` | `lib/cad/materials.ts:26,31,68` |
| Neo sang bản ghi thương mại | `MaterialDef.atlasRecordId` | `materials.ts` (docstring 2.1.9.i) |
| Thư viện block ~46 + biến thể | `BLOCKS` / `BLOCK_MAP` | `furniture.ts:484-639` |
| Ký hiệu đèn 4 loại | `lightDownlight`·`lightPendant`·`lightTrack`·`lightWall` | `lib/cad/mep.ts:84-96` |
| Đếm số lượng theo block/elementType | `buildSchedule` / `ScheduleRow` | `schedule.ts:68,16` |
| Bảng thống kê in lên bản vẽ | `scheduleToEntities` | `schedule.ts:120` |
| Giá · đơn vị · hao hụt · quy cách đóng gói · mã thay thế | `ProductSpec.priceVnd`·`unit`·`wastagePercent`·`packagingSpec`·`altSku` | `prisma/schema.prisma` (khối 2.1.9.r) |
| Tập `kind` sản phẩm (có sẵn `millwork`, `lighting`, `fixture`) | `SPEC_KINDS` | `lib/server/specs.ts:6` |
| Gộp theo vật liệu + báo lỗi thiếu giá + bắt vùng chồng lấn | `computeBoq` / `BoqError` | `lib/boq/compute.ts:89` · `lib/boq/model.ts` |
| Xuất XLSX + cache | `lib/boq/xlsx.ts` · `cache.ts` | — |
| Đường ghi-ngược 3D→Doc (khuôn) | `onPushPull` → `entity.heightMm` | `Scene3DViewer.tsx:20,61,266` · `cad-to-obj.ts:414` |

### §A9.2 · Thiếu thật — phải làm mới
| # | Thiếu | Bằng chứng đã kiểm | Ai | Cỡ |
|---|---|---|---|---|
| **T1** | Vá lọc tường: `hatch` có `specId` ⇒ không phải tường | `cad-to-obj.ts:350-355` có nhánh `\|\| e.pattern === 'SOLID'`; `commands.ts:64` chứng minh poché tường không có `specId` | PHU | **rất nhỏ** (1 điều kiện) |
| **T2** | `'covering'` vào `ElementType` + `coveringHost` | `model.ts:78-89` chỉ 8 giá trị | PHU | nhỏ (chờ NC-11) |
| **T3** | `thicknessMm` · `elevationMm` · `roomId` vào `Base` | `model.ts:151-181` không có | PHU | nhỏ (đã ở §2.4 spec nền) |
| **T4** | `openingsWidthOnBoundary()` — trừ bề rộng cửa khỏi chu vi | `hatch.ts` chỉ có bản tính **diện tích** lỗ mở (`:112`); `edgeMask` không diễn đạt được cửa giữa cạnh (§A7.2) | PHU | nhỏ, có test được |
| **T5** | **BOQ nhánh `m` (dài) và `cai` (đếm)** | `BoqRow` (`boq/model.ts`) chỉ có field `m2`; `computeBoq` chỉ quét `HatchEntity` | PHU | **trung bình — chặn cứng §A6, §A7, §A8** |
| **T6** | Kích thước viên thật (mm) cho sàn lát | `MaterialDef` (`materials.ts:31-66`) không có field mm; chỉ có `patternScale` tương đối | PHU | nhỏ (đọc từ `ProductSpec.w/d`, **không thêm field**) |
| **T7** | Tham số lát: `layAngleDeg`·`layOrigin`·`groutMm`·`layPattern` | không tồn tại | PHU | nhỏ |
| **T8** | Renderer lưới viên gạch 2D (`tileGrid`) | `HatchPattern` chỉ 5 giá trị (`model.ts:290`); `hatchLines` (`:393`) chỉ vẽ nét song song | PHU | **lớn — pha 2, đừng hứa sớm** |
| **T9** | 3D dán MẶT thay vì đùn khối (covering/sàn/trần) | `cad-to-obj.ts` chỉ có `prism`/`box4`, không có primitive "mặt phẳng có texture" | PHU | trung bình |
| **T10** | Trần theo VÙNG thay vì bbox toàn nhà | `cad-to-obj.ts:421-424` prism `floorPoly` (bbox) | PHU | trung bình (giữ fallback) |
| **T11** | `CabinetRun` + `CabinetModule` + `regenCabinetRun` | không tồn tại; `kitchenI` (`furniture.ts:562`) là block cứng | PHU | **lớn nhất trong phụ lục** |
| **T12** | `furnitureHeightMm` đọc `ProductSpec.hUp` | `cad-to-obj.ts:167-178` hardcode if/else | PHU | **rất nhỏ** |
| **T13** | Layer hoàn thiện mặc định | `DEFAULT_LAYERS` (`model.ts:606-611`) chỉ 5 layer | PHU | rất nhỏ |
| **T14** | Đèn `mep.ts` không vào 3D | `cad-to-obj.ts:357-360` lọc theo `BLOCK_MAP` của `furniture.ts` — **SUY ĐOÁN, verify trước** | PHU | nhỏ |
| **T15** | Hằng số nghề vào CONFIG (hao hụt theo kiểu lát, cao len, dày cánh…) | tiền lệ đúng: `BOQ_OPENING_MIN_AREA_M2` `hatch.ts:84` | PHU | nhỏ |

---

## §A10 · LỆNH MỚI CỦA MODE NỘI THẤT (nối vào §7 bên trên)

Theo đúng luật §7: **một sổ lệnh, thêm lát cắt `when`** — không bộ code song song.
`shouldShowProTools()` coi `revit` như `pro` (`store.ts:144`, đã xác nhận ở `BAO-CAO-COWORK-VE`) nên
lệnh mới chỉ cần guard `cadMode === 'revit'`.

| Lệnh | Alias | Làm gì | Kiểu đo |
|---|---|---|---|
| `FINISH` | `FN` | gán lớp hoàn thiện lên vùng chọn (chọn vật liệu + `coveringHost`) | MẶT |
| `FLOORFIN` | `FLR` | sàn lát: chọn vùng + vật liệu + hướng lát + gốc lát | MẶT |
| `CEILREG` | `CLG` | vẽ vùng trần một cấp (`elevationMm`) | MẶT |
| `CAB` | — | vẽ tuyến tủ (`CabinetRun`) — chọn `bank` trước, vẽ path như PL | CỤM |
| `SKIRT` | `SKT` | gán len chân tường cho phòng đang chọn | TUYẾN |
| `CORNICE` | `CRN` | gán phào cổ trần cho phòng | TUYẾN |

**§0c ba mảng (bắt buộc, thiếu 1 = 🔴 theo `SO-KIEM-TONG` §5 A7):**
1. **Phím tắt** — 6 lệnh trên vào `lib/commands/registry.ts` với `when: mode=='revit'`, có `key` + tooltip hiện phím, tìm được bằng ⌘K. ⚠️ Cảnh báo đã ghi ở `BAO-CAO-COWORK-VE`: `findByAlias` **chưa được `CadEditor.tsx` gọi** ⇒ lệnh mới chỉ hiện ở palette cho tới khi CHINH nối `run()`.
2. **Lệnh tương tác** — gõ-số-SAU-thao-tác theo `SPEC-VE-INFERENCE` §4: đang vẽ `CAB` gõ `3000` = chốt đoạn 3m; đang đặt sàn gõ `45` = xoay hướng lát 45°. Status bar luôn mách đang chờ gì.
3. **Cảm ứng** — `CAB` phải vẽ được bằng ngón (tap từng điểm, không đòi kéo-thả); chọn `bank`/`coveringHost` phải có nút thấy được, **CẤM chỉ-chuột-phải** (SPEC-HOVER §3.7). Token `--tap 44`.

---

## §A11 · CHIA VIỆC + NGHIỆM THU ĐO ĐƯỢC

### §A11.1 · Thứ tự (đan vào lộ trình P0-P7 của `SPEC-TANG-DU-LIEU-CAU-KIEN` §9, không tạo lộ trình đối thủ)
| Bậc | Việc | Chặn bởi |
|---|---|---|
| **P0** | (giữ nguyên) PHU verify tay khuyết §0.3 | — |
| **P0.5** 🆕 | **T1** — vá lọc tường bằng `specId`. Rẻ nhất, chặn thiệt hại lớn nhất | P0 |
| **P1** | (giữ nguyên) `inferElementType` + cờ `inferred` | P0.5 |
| P1.5 🆕 | **T12** (`hUp`) · **T13** (layer) · **T15** (CONFIG hằng số) — gói việc rẻ, làm chung 1 commit | P1 |
| **P5** | (giữ nguyên) `RoomEntity` — **nền của §A5/§A7**, không có nó thì trần/phào không có chỗ treo | P4 |
| P5.5 🆕 | **T2·T3** (`covering`+`coveringHost`+`thicknessMm`/`elevationMm`/`roomId`) · **T4** (`openingsWidthOnBoundary`) | P5 · NC-11 |
| **P6** | (giữ nguyên) 3D đọc `specId` → PBR — cộng **T9** (dán MẶT) · **T10** (trần theo vùng) | P5.5 |
| P6.5 🆕 | **T5** — BOQ nhánh `m` + `cai`. Mở khoá tủ bếp · phào · đồ rời cùng lúc | P6 |
| P7+ 🆕 | **T11** (`CabinetRun`) → **T6·T7** (tham số lát) → **T8** (`tileGrid`, pha 2) | P6.5 |

### §A11.2 · Nghiệm thu — 12 ca đo được (khuôn §8 bên trên)
1. Tô sơn `son-trang` lên 1 mảng giữa phòng → mở 3D: **KHÔNG có khối 2.7m nào mọc lên**; đếm `stats.walls` trước/sau bằng nhau. *(vá T1)*
2. Poché tường vẽ bằng lệnh WALL (không `specId`) → 3D **vẫn đùn đủ mọi tường**; `stats.walls` không giảm. *(chống rớt T1)*
3. Mở `.idf` CŨ (không field mới nào) → console **0 lỗi**, hình 2D y hệt trước.
4. Gán sàn gỗ cho phòng 4×5m có 1 cửa 900 → BOQ ra **20.00 m²** (sàn KHÔNG trừ lỗ mở).
5. Gán sơn cho mảng tường 5000×2700 có 1 cửa 900 → BOQ ra **13.50 − 1.89 = 11.61 m²** (tường CÓ trừ; `OPENING_STANDARD_HEIGHT_MM.door = 2100`, `hatch.ts:97`).
6. Đổi `layAngleDeg` 0→45 trên vùng sàn → hao hụt mặc định nhảy theo bảng §A4.5; m² thuần **không đổi**.
7. Phòng 4×5m, len cao 100, có 1 cửa 900 → m dài = `(4000+5000)×2 − 900 = 17100mm = 17.10 m`. Cộng tay đúng con số hiện trên bảng.
8. Trần 2 cấp (cấp trên 3×3 ở giữa phòng 4×5, chênh 200mm) → BOQ ra **2 dòng**: m² trần + m² cổ trần = `perimeter(3000×4) × 200 / 1e6 = 2.40 m²`.
9. Vẽ `CabinetRun` chữ L 3000+2000, `bank:'base'` → BOQ ra **m dài 5.00 m**; đổi sang `bank:'wall'` → nét mặt bằng chuyển sang **đứt**.
10. Đặt 3 sofa cùng `specId` → BOQ ra 1 dòng **3 cái** (không phải 3 dòng 1 cái).
11. Chọn 1 mảng sơn trong 3D → Inspector mở đúng entity đó (Đ1 spec nền: `SceneGroup.entityId` phải có).
12. Chuyển mode Nội thất → Sơ phác: **mọi hình vẫn hiển thị đủ**; 6 lệnh mới biến khỏi toolbar; tool đang cầm tự về `select` (khuôn `store.ts:171`).

---

## §A12 · TREO — cần TỔNG/Hoà chốt trước khi code
| # | Câu hỏi | Chặn |
|---|---|---|
| A | `coveringHost` — thêm field riêng (đề xuất của phụ lục này) hay nhét vào `elementType` thành 3 giá trị `covering-wall`/`covering-floor`/`covering-ceiling`? *(Nghiêng về **field riêng**: `elementType` phải ánh xạ 1-1 sang lớp IFC cho NC-11; `IfcCovering` có `PredefinedType` riêng — chẻ `elementType` sẽ lệch chuẩn.)* | T2 |
| B | Bảng hao hụt theo kiểu lát (§A4.5) — Hoà/QS xác nhận số, hay để trống chờ ATLAS bơm `wastagePercent` cho từng mã? | T15 |
| C | Tủ bếp báo giá theo **m dài** (phổ biến VN) hay theo **m² cánh + m² thùng** (cách xưởng tính)? Ảnh hưởng dòng BOQ mặc định. | T11 |
| D | `CabinetRun` là bảng phụ `Doc.cabinetRuns?` (như `wallRuns` §2) hay entity trong union? *(Nghiêng về **bảng phụ** — cùng lý do §11 câu 2 của spec nền: an toàn round-trip `.idf`/DXF.)* | T11 |
| E | Phào/len — **chốt KHÔNG vẽ lên mặt bằng** (§A7.4) có đúng ý Hoà không? Một số hồ sơ VN vẫn vẽ. | T4 |

## §A13 · KHÔNG LÀM (chống phình — nối §10 spec nền)
- ❌ Không tính chiếu sáng (lux), không rải đèn tự động, không mạch điện — chưa có nơi tiêu thụ (L7).
- ❌ Không modeling chi tiết tủ (bản lề, ray, chỉ cạnh, mộng) — 3D là **khối nghiên cứu**, chi tiết thật để render/xưởng.
- ❌ Không vẽ mặt đứng/khai triển trong mode Nội thất — là **tờ bản vẽ**, thuộc mode Kỹ thuật (§A2).
- ❌ Không hiện giá tiền trong mode Nội thất — thuộc chặng Trình bày (§A2).
- ❌ Không tự đẻ field `matId` song song `specId` — `SPEC-TANG-DU-LIEU-CAU-KIEN` §7 đã chốt một neo.
- ❌ Không thêm `kind` mới vào `ProductSpec` — `millwork`/`fixture`/`lighting` đã đủ (`lib/server/specs.ts:6`).
- ❌ Không đập block `kitchenI`/`wardrobe`/`kitchenIsland` hiện có — giữ làm đường sơ phác (§0d).
- ❌ Không đọc/ghi IFC — chờ NC-11.

---
*COWORK-VẼ soạn 03/08/2026 · đợt 5. APPEND, không sửa/xoá dòng nào của bản gốc §0-§8 (luật §0d).
Mọi `file:dòng` kiểm bằng grep/sed trên repo ngày 03/08; mục nào chưa kiểm được đã ghi **SUY ĐOÁN**.*
