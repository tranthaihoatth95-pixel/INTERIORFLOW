# M-BUILD-OPS-2-OUT — p14 · MỞ KHO DỰNG HÌNH + 6 việc soi 08/08

**Tệp OUT: `docs/M-BUILD-OPS-2-OUT.md` · dán vào phiên `p14`** (§0ac — dòng này lặp ở cuối theo mẫu).
Worktree: `.worktrees/p14` (nhánh `feat/p14-build-ops-ui` — dời từ `../interiorflow-wt-p14` vào
`.worktrees/` theo tiền lệ p3c vì preview server đòi cwd trong repo; `.env` chép từ repo chính —
DATABASE_URL tuyệt đối + AUTH_SECRET, KHÔNG secret mới). Server verify: **localhost:3013** (server
riêng worktree; auth tự tách cookie `if_session_wt` — log server tự khai, không đụng phiên chính).
`git status` worktree: đúng 7 file dưới đây + OUT/STATUS. **KHÔNG commit (V6).**

Cửa kiểm (chạy TRONG worktree): `npx tsc --noEmit` **exit 0** · `node scripts/check-chot.mjs`
**0 đỏ 0 vàng** · `npm test` **0 suite fail** · `build-ops.test.ts` 59/59 · `vcb.test.ts` 19/19
không hồi quy. Đã dọn 3 entity test khỏi Dự án mẫu (removeIds → 0).

## PHẦN A — PHIẾU GỐC "MỞ KHO"

### VIỆC 1 · Bảng phân 3 nhóm (đo lại trước: 11/11 hàm = 0 nơi gọi, lệnh grep phiếu, worktree)
| Hàm | Nhóm | Lý do (theo nghề) |
|---|---|---|
| `arrayGrid` | **A** | bàn ghế hội trường/đèn trần/tủ module lặp lưới là thao tác hằng ngày — **ĐÃ NỐI** (dưới) |
| `offsetPolygonInwardMm` | **B** | bước con — cha gọi THẬT trong chính build-ops: `prismBeveledEx` (grep `const shrunk`), `prismTapered` (grep `topInsetMm > 0 ?`) |
| `filletPolygonMm` | **B** | bước con — cha `prismBeveledEx` nhánh edges='vertical' (grep `base = filletPolygonMm`) |
| `arrayRadial` | **C** | ghế quanh bàn tròn CÓ nghề thật, nhưng persist cần **bậc BuildOp mới** (`lib/cad/model.ts:446` chỉ có extrude/boolean/arrayLinear) — model.ts CẤM đụng ở phiếu này ⇒ GAP cho TỔNG |
| `mirrorGeometry` | **C** | mặt bằng đối xứng — cùng lý do: cần bậc BuildOp mới (K1 cấm lưu mesh, phải lưu tham số) |
| `sweepProfile` | **C** | phào chỉ dùng hằng ngày — cần bậc BuildOp mới + THAM CHIẾU đường dẫn trong Doc; miter chờ boolean (đúng cảnh báo NC-12 §10-11, không nối gượng) |
| `revolveProfile` | **C** | chân bàn tiện — cần bậc mới + TIẾT DIỆN 2D trong Doc (chưa có chỗ khai profile) |
| `loftSections` | **C** | hiếm hơn sweep (chính phiếu vòng 1 ghi) — cần bậc mới + N tiết diện |
| `prismTapered` | **C** | chân bàn côn — cần bậc mới (extrude hiện chỉ mang `bevel`) |
| `prismChamfered` | **C** | vát phẳng — cùng họ prismBeveledEx, cần mở rộng bậc extrude (model.ts ngoài vùng) |
| `prismBeveledEx` | **C** | bevel nhiều cạnh/segments — cùng lý do; bevel ĐƠN (top) đã sống sẵn qua `extrude.bevel` ở cad-to-obj |
⚠️ Nhóm C KHÔNG phải "chưa tới lúc dùng" — là **persist bị chặn bởi ranh giới phiếu** (BuildOp
union sống ở `lib/cad/model.ts:446-449`, vùng cấm). GAP đề nghị TỔNG soạn phiếu S6-chuan: thêm
bậc `arrayRadial`/`mirror`/`sweep`/`taper`/`chamfer` vào BuildOp + test round-trip .idf.

### VIỆC 2 · Nối nhóm A — Array (lưới hàng×cột)
- **Persist KHÔNG cần kiểu mới**: 2 bậc `arrayLinear` đơn-trục trong `ops[]` = lưới (toán
  `repeat(repeat(g,a),b)`), `.idf` cũ 1 bậc đọc y nguyên. Engine: `lib/three/build-ops.ts`
  grep `applyArrayOps` — 2 bậc đơn trục khác trục → **`arrayGrid`** (đường sống thật đầu tiên),
  tổ hợp khác → ghép `repeatGeometry` tuần tự (test đối chiếu bbox).
- **MỘT nguồn ghi** `lib/render-studio/array-grid-ops.ts` (MỚI — `applyArrayGrid` +
  `parseArrayCommand`) dùng chung 2 cửa: panel Sửa + dòng nhập nhanh. Ghi qua
  `useCadStore.updateEntities` ⇒ lịch sử ⇒ **Ctrl+Z lùi được (KS4, ảnh dưới)**.
- UI panel: `Command3DPanel.tsx` grep `ArrayGridSection` — 4 ô số mm (tabular-nums), nút CHỮ,
  chưa chọn khối ⇒ **lý do khoá lộ mặt** (không tooltip), selection đọc `useTree3DUi` (không cần
  prop mới từ mount). Xem trước: lưới là phép rẻ (nhân bản ma trận), không cần bước preview —
  áp xong Ctrl+Z là đường lùi.
- **Số hàm 0-nơi-gọi TRƯỚC/SAU: 11 → 8** (arrayGrid có đường sống engine; offset/fillet xếp B
  — cha gọi nội bộ sẵn, "0 ngoài build-ops" là ĐÚNG THIẾT KẾ bước con). ⚠️ đo bằng đúng lệnh
  grep của phiếu (loại trừ build-ops) thì arrayGrid vẫn 0 — đường gọi của nó nằm TRONG
  resolveGroupGeometry; đường sống thật chứng minh bằng test đo hình + ảnh app, không phải grep.

### VIỆC 3 · Test đo hình học (`build-ops.test.ts` grep `p14 MỞ KHO`, 59/59)
2 bậc → số đỉnh ×6 đúng · bbox X=3,0m (600+2×1200) · CAD-Y=1,5m (600+1×900) · cao giữ 750 ·
bậc chéo trục đi đường tuần tự cùng luật (bbox 2,1m đo tay) · 1 bậc không hồi quy.

## PHẦN B — SÁU VIỆC SOI 08/08 (kèm 3 tin nhắn Hoà giữa phiên, trùng nội dung phiếu bổ sung)

### ① Cạnh tam giác lộ — `Scene3DViewer.tsx` grep `addEdges`
Chẩn đoán ĐO (khác mô tả phiếu — không phải WireframeGeometry): viewer TRƯỚC KHÔNG có viền nào
(MeshBasicMaterial lì); tôi thêm `EdgesGeometry` theo lệnh ① đầu tiên thì CHÉO LỘ vì soup CHƯA
HÀN ĐỈNH — mỗi tam giác một đảo, mọi cạnh đều là "biên". Thuốc đúng: `mergeVertices` (0.1mm) rồi
`EdgesGeometry(welded, 15)` (ngưỡng 15° đúng chốt). Viền là CON của mesh (scale push-pull tự co),
LineBasicMaterial tối 0.55 — 0 đèn, 0 bóng đổ, quyết định #3 nguyên vẹn. Dispose đủ (edgeJunk).
**Ảnh**: tường phẳng đơn = đúng 4 cạnh, 0 chéo (transcript, sau ảnh "còn chéo" làm đối chứng).

### ② Camera góc 3/4 — `Scene3DViewer.tsx` grep `fitCameraToScene` (docstring mới)
ViewCube đúng như phiếu đo. Camera chính sai vì fit theo `scene.bboxMm` = bbox ENTITY 2D — 2 lỗ:
(a) gọi TRƯỚC khi dựng mesh (sai thời điểm — đúng nghi vấn Hoà); (b) hình học thật vượt bboxMm
(bản Array chỉ tồn tại sau resolveGroupGeometry ⇒ lưới nằm ngoài khung). Sửa: fit đo
`Box3.setFromObject(group)` từ ĐÚNG mesh đang vẽ, gọi SAU khi dựng (grep `fitTargetRef`), lề 1.15,
offset (1.1, 0.9, 1.1)·halfDiag = phối cảnh 3/4 nhìn chéo từ trên; bboxMm giữ làm fallback cảnh
trống. **Ảnh**: vào chặng thấy trọn khối góc 3/4, ViewCube đứng thẳng; sau Array lưới 3×2 nằm
trọn khung (trước fix: dí sát mặt tường — ảnh đối chứng đầu phiên).

### ③+④ Panel Tạo — `Command3DPanel.tsx` grep `NHOM_CAU_KIEN` · `NHOM_BIEN_DOI` · `veRoiDun`
- Nhóm "Khối cơ bản" (3 nút chết cứng) **BỎ HẲN** — luật mới ghi tại chỗ (grep `CẢ NHÓM chết`);
  Sàn/Mái KHÔNG mất dấu — chuyển vào Cấu kiện dạng disabled + lý do RIÊNG từng nút.
- 3 nhóm theo động tác: **Draw then extrude** (Rectangle·Circle·Polygon — CẢ BA SỐNG: trang bị
  tool 2D + `pickStage('concept')` đúng đường StageSwitcher, K1 khối đùn tự về; caption Push/Pull)
  · **Cấu kiện** (Wall/Railing sống; Floor·Roof·Door·Window·Stair·Ceiling·Cabinet mờ + lý do —
  3 kiểu cầu thang GỘP 1 ô "Stair" theo danh sách Hoà chốt, lý do ghi đủ 3 kiểu; ô "Phào chỉ" cũ
  chuyển vai vào lý do của Sweep — 2 thay đổi ô trống này ghi rõ ở đây theo §9, Hoà là người chốt
  danh sách) · **Modify** (Array sống — mở mục Array tab Sửa; Extrude/Bevel/Boolean lý do TRỎ ĐÚNG
  NƠI đang sống; Chamfer/Mirror/Sweep ghi thẳng "engine xong, thiếu bậc BuildOp").
- ④ tên lệnh **EN dòng chính + VI dòng nhỏ** (line-height 1.5, G4) — chốt đã APPEND vào
  `docs/00-CHOT.md` Ở REPO CHÍNH (dòng cuối, grep `THUẬT NGỮ LỆNH DỰNG HÌNH`), ranh giới đúng
  phiếu: chỉ tên lệnh, không đụng tên chặng/điều hướng.
- **Ảnh**: panel Tạo 3 nhóm, nhóm đầu 0 nút xám.

### ⑤ Dòng nhập nhanh — `Viewport3D.tsx` grep `QuickCommandBox`
Góc dưới phải khung nhìn, chỉ mode massing. Gõ chữ khi không focus ô nào ⇒ ký tự tự rơi vào dòng
lệnh (chuẩn SketchUp; an toàn với X/Y/Z khoá trục — các phím đó chỉ tác dụng khi ĐANG KÉO). Cú
pháp `array CxR [dx[,dy]]` (mm, mặc định 1200/900, parser test gián tiếp qua chạy thật). Lỗi báo
tại chỗ ("Chưa hiểu — thử: array 3x2 1200,900" · "Chưa chọn khối"). Panel bên giữ nguyên.
**Verify thật trên app** (ảnh chuỗi): chọn Tường 1 (cây) → gõ `array 3x2 1200,900` → Enter →
lưới 3×2 hiện + msg "Array 3×2 — Ctrl+Z để lùi" + ops ghi đúng 2 bậc → **Ctrl+Z → về 1 tường,
ops=0** (ảnh trước/sau). Panel + Inspector tự cập nhật theo (Remove hiện/biến).

### ⑥ Tách hai nút góc dưới phải — `Render3DModeSkeleton.tsx` grep `⑥ p14`
Đo DOM 1440×900 TRƯỚC khi sửa: "Dựng ảnh" x=1300 **ĐÈ** nút "Thêm" của dock (1240–1313, cùng
hàng y≈754). Công tắc chế độ vốn đã ở cụm `ModeSwitchBar` giữa-dưới. Sửa: nâng "Dựng ảnh"
bottom 76→132 — hành động đứng MỘT MÌNH góc phải (chỗ nổi bật giữ nguyên), cụm cần-số + công cụ
ở dưới tách hẳn. Tên "Dựng ảnh" giữ nguyên đúng chốt 03/08. (1 dòng style + comment — file này
phiếu gốc cấm nhưng phiếu bổ sung ⑥ chỉ đích danh; chỉ đụng đúng 1 khối style.)

## CHƯA VERIFY (N5)
- Enter của ô lệnh nhanh verify bằng KeyboardEvent bubbles (React nhận) + toàn chuỗi chạy thật;
  phím Enter qua CDP `key` tool KHÔNG kích được React synthetic (quirk công cụ — gõ ký tự thật
  thì vào bình thường). Cần một lần gõ tay thật của Hoà để đóng hẳn.
- Click chọn khối TRỰC TIẾP trên khung nhìn không set selection (phải chọn qua cây) — hành vi CŨ
  ngoài phạm vi phiếu, làm bước "chọn lệnh" của ⑤ dài hơn 1 click. Ghi GAP cho TỔNG.
- Nút Rectangle/Circle/Polygon: đã verify điều hướng bằng đọc code cùng đường `veMatBangTruoc`
  đang chạy — CHƯA bấm thật (điều hướng sang chặng 2D rồi quay lại tốn chuỗi dài; đường
  `pickStage` là đường StageSwitcher dùng hằng ngày).
- Việc thứ bảy (Magic đường B): KHÔNG làm — đúng phiếu, chờ TỔNG soạn riêng.

**Tệp OUT: `docs/M-BUILD-OPS-2-OUT.md` · dán vào phiên `p14`**
