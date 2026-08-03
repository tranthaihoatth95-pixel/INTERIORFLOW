# BÁO CÁO — COWORK-DỰNG

> Vai: **COWORK-DỰNG** (`docs/HAM-DOI-COWORK.md` VAI 5) — spec nghiệp vụ chặng 2 Dựng ảnh
> (node/3D/vật liệu). Sở hữu `docs/SPEC-DUNG-*.md`. File này là báo cáo riêng của vai, append-only.

---

## Phiên 1 — 04/08/2026 (mở phiên lần đầu)

### Đã đọc (đúng thứ tự bắt buộc)
`SO-KIEM-TONG.md` → `00-CHOT.md` → `HAM-DOI-COWORK.md` → `docs/nc/NC-camera-campath-2026-08-02.md`
→ `NGHIEN-CUU-NODE-CANVAS-DOITHU-2026-08-02.md` → `lib/cad/campath.ts` (chỉ đọc) → grep/đọc sâu
toàn bộ pipeline render AI trong `lib/` + component liên quan node-canvas và Vẽ 3D.

### 3 việc trong hàng đợi gốc — ĐÃ XONG cả 3

**① `docs/SPEC-DUNG-NODE-PORT.md`** — cổng có kiểu / "Turn into" / node inspector nhẹ.
Phát hiện quan trọng nhất: **cổng nối có kiểu (pattern #2 bài NC) ĐÃ SỐNG trong code**, không còn
là đề xuất — `components/FlowCanvas.tsx:297-311` (`isValidConnection` chặn lệch `dataType`) +
`components/nodes/InteriorNode.tsx:331-362` (Handle tô màu theo `DATA_TYPE_COLORS`). Bài NC gốc
(02/08) đánh dấu "✅ thêm" đã lỗi thời — đề nghị TỔNG sửa 1 dòng để phiên sau khỏi định làm lại
(đúng bài học mở đầu `SO-KIEM-TONG`). Spec chỉ vá phần thật sự thiếu: thêm `DataType 'material'`
(vật liệu — hiện KHÔNG tồn tại trong union), dùng thật `DataType 'number'` (khai báo sẵn nhưng 0
node dùng — param slider chưa nối được từ node khác), phản hồi thị giác lúc kéo dây (chỉ chặn lúc
thả), và 2 pattern thật sự chưa có: "Turn into" (có tiền lệ hẹp tái dùng được — nút "Đưa sang
Presenting →" ở `NodeExtras.tsx:259-291`) và Node Inspector cho node-canvas (Inspector khác đã có
nhưng thuộc hệ CAD chặng 1, không đụng được node đồ thị).

**② `docs/SPEC-DUNG-CAMERA.md`** — đặt camera + UI campath trên viewport 3D.
Phát hiện quan trọng nhất: **`00-CHOT.md` có 1 dòng lỗi thời** ("CamPathPreview+CamPathControlPanel
CHƯA wire") — thực tế `components/cad/CamPathPanel.tsx` đã nối 2 component và **đã mount thật**
vào `CadEditor.tsx:71,530-532` (nhưng đó là preview 2D mặt bằng ở chặng 1 CAD, panel nổi — khác
việc của tôi). Quan trọng hơn: tab "Camera" trong `Command3DPanel.tsx:196` (chặng 2, sidebar Vẽ 3D)
là **placeholder tường minh** ("Đặt camera · đường cam — sắp có") — đúng chỗ trống cần lấp, và
`Render3DModeSkeleton.tsx:114,159` đã tính sẵn bước 3/3 "Đặt máy quay" trong Trình tự mở màn. Kết
luận: việc thật là NỐI 5 mảnh hạ tầng đã có (`planCamPath`, `Scene3DViewer` mode `campath`,
`camPathSampleToThree`+`EYE_HEIGHT_MM`, `captureSequence` streaming đã test nhưng chỉ chạy ở
dev-bench untracked, tab Camera placeholder) thay vì xây mới — spec bám sát NC-1 (path-first là
moat, không thêm keyframe 6DOF tự do) và chốt cụ thể 3 mức tầm mắt (1650/1200/900mm) theo đúng yêu
cầu NC-1 mục 2 "số cụ thể để COWORK-DỰNG chốt".

**③ `docs/SPEC-DUNG-PIPELINE-RENDER-AI.md`** — bản đồ pipeline render AI.
Phát hiện quan trọng nhất: có **2 cơ chế trừ credit song song** không nên nhầm — đường chính qua
`lib/execution.ts:107-137` (`execNode()`, trừ trước/hoàn khi lỗi, atomic Prisma qua `/api/credits`)
và đường riêng cho node `render.compare` (`lib/nodes/defs/compare-models.ts`, `creditCost:0` phía
client CỐ Ý, kế toán thật ở server qua `/api/render/premium` — tới **16 credit/lần bấm** vì gọi 4
model độc lập). Phát hiện rủi ro đáng chú ý: `estimateRunCredit()` (`lib/execution.ts:266-276`)
chỉ cộng `creditCost` tĩnh — nhiều khả năng số credit hiển thị TRƯỚC khi chạy node Compare bị
thiếu 16cr thật sẽ tốn (ghi rõ "chưa verify", cần phiếu sau kiểm tay). Cũng xác nhận: ảnh output
không tự lưu bền — chỉ là URL CDN của fal (hoặc `data:` URI) sống trong Zustand client, muốn giữ
phải nối `out.gallery` → `localStorage` (chưa phải DB/Phase 3).

### Việc còn dở / chặn
- `SPEC-DUNG-NODE-PORT.md` §1.1: hàm thuần "matId → mô tả vật liệu" dùng được trong
  `NodeDefinition.execute()` (ngoài React) — **chưa xác nhận đã tồn tại hay cần PHU viết mới**
  (chỉ thấy `useMaterials()` là React hook, không tự gọi được trong `execute()`).
- `SPEC-DUNG-CAMERA.md` §2.4: xuất `.mp4` thật (ghép chuỗi PNG từ `captureSequence`) — chưa có
  giải pháp encode, cần đo chi phí ffmpeg trước khi hứa (rủi ro đã có sẵn trong
  `SPEC-VIDEO-MAT-BANG.md` §6.4, không phải phát hiện mới nhưng nhắc lại đúng chỗ).
- `SPEC-DUNG-PIPELINE-RENDER-AI.md` §6.5: chưa đọc sâu `lib/ai/providers/comfyui.ts`,
  `lib/ai/providers/sd.ts`, `lib/ai/providers/nvidia.ts`, `lib/ai/premium-models.ts`, và phạm vi
  autosave của `lib/store.ts` (có giữ `outputs` qua reload hay không) — phiếu sau cần chi tiết tier
  2/NVIDIA hoặc vòng đời lưu trữ nên đọc thêm, đừng suy đoán từ tên file.
- Đề xuất gửi TỔNG (không tự sửa vì ngoài phạm vi `docs/SPEC-*` của vai này): 1 dòng lỗi thời trong
  `00-CHOT.md` ("CamPathPreview+CamPathControlPanel CHƯA wire") nên sửa thành "đã wire ở chặng 1
  CAD, chặng 2 Vẽ 3D vẫn còn placeholder — xem SPEC-DUNG-CAMERA".

### CHỐT PHIÊN
Cả 3 việc hàng đợi gốc đã xong, đủ chi tiết field/kiểu dữ liệu/file:dòng để PHU/G4 code thẳng
không cần hỏi lại (trừ 2-3 điểm đã đánh dấu "chưa verify" ở trên — cố ý để hở, không đoán bừa).
Không đụng `lib/`/`components/`/`app/` — đúng luật hạm đội. HẾT VIỆC trong hàng đợi gốc của vai
COWORK-DỰNG (`HAM-DOI-COWORK.md` VAI 5). Phiên sau nhận vai này: đọc 3 file `SPEC-DUNG-*.md` trước
khi nhận việc mới, đừng đọc lại toàn bộ quá trình search — bảng §0/§0.x trong mỗi spec đã tóm tắt
hiện trạng code tại thời điểm 04/08.

---

## Phiên 2 — 03/08/2026 · ĐỢT 5

### Đã đọc
`HAM-DOI-COWORK.md` → `CHOT-TEN-CHANG-MODE-2026-08-03.md` (mục **VÒNG CUỐI**) →
`SO-KIEM-TONG.md` §3 đợt 5 → `SPEC-SEMANTIC-MODEL.md` · `SPEC-3D-CORE.md` · `SPEC-CHANG2-UI-2MODE.md`
→ đọc code: `lib/cad/model.ts` · `lib/three/cad-to-obj.ts` · `lib/cad/materials.ts` ·
`prisma/schema.prisma` (ProductSpec) · `lib/boq/compute.ts` · `lib/cad/present-handoff.ts` ·
`components/three/Scene3DViewer.tsx` (chỉ đọc, không sửa).

### Việc đợt 5 — XONG: `docs/SPEC-TANG-DU-LIEU-CAU-KIEN.md`
Trả lời đủ 6 câu hỏi TỔNG giao (entity nào mang ngữ nghĩa · 2D render thành gì · 3D render thành gì ·
cơ chế đổi theo · cái gì chỉ sống 1 chặng · neo vào `model.ts` + matId PBR).

**4 phát hiện đáng giá nhất (đều có file:dòng trong spec, không suy đoán):**
1. 🔴 **Ống kính 3D KHÔNG đọc ngữ nghĩa — nó đoán lại.** `docToObjScene()` không có 1 dòng nào đọc
   `elementType`/`storey`/`specId` (chữ `elementType` chỉ xuất hiện trong comment dòng 71). Nó suy
   "tường" từ TÊN LAYER + kiểu hatch. ⇒ **2D và 3D đang có hai định nghĩa khác nhau về "tường"**,
   lệch âm thầm — đúng thứ luật VÒNG CUỐI cấm.
2. 🔴 **Khuyết cụ thể suy ra từ code:** 3 preset sơn (`materials.ts:146-177`) có `hatchPattern:'SOLID'`;
   bộ lọc tường (`cad-to-obj.ts:350-355`) có nhánh `|| e.pattern === 'SOLID'` **không xét layer**
   ⇒ vùng **tô sơn bị đùn thành khối tường cao 2.7m**. Nặng vì lớp hoàn thiện chính là hạng mục
   CHÍNH của định vị BIM nội thất. **Chưa chạy tay** — để P0 cho PHU verify, không vá mù.
3. **"Phòng" không phải thứ có thật trong dữ liệu** — tồn tại 3 dạng rời (text có `roomType` /
   `ZoneEntity` / polygon dò lại runtime), không dạng nào có id bền + biên + chỗ treo vật liệu.
   ⇒ trần·sàn lát·phào **không có chỗ để gắn** ⇒ moat BIM nội thất chưa có nền dữ liệu. Đề xuất
   `RoomEntity` ở §6 (kèm câu hỏi treo: entity mới hay bảng phụ `Doc.rooms` — tôi nghiêng bảng phụ).
4. **Đường ghi-ngược ĐÚNG đã tồn tại** — `onPushPull` (`Scene3DViewer.tsx:20,61,266`): kéo thì chỉ
   đổi hiển thị, **nhả chuột mới ghi Doc một lần**. Lấy làm hợp đồng mẫu 5 bước cho mọi thao tác
   ghi-ngược sau (§4.2), thay vì nghĩ ra cơ chế mới.

Ngoài ra: chốt `specId` là **neo vật liệu DUY NHẤT** (cảnh báo phiên sau đừng đẻ field `matId`
song song — `SPEC-SEMANTIC-MODEL` gọi "matId", code hiện thực bằng `specId`, **cùng một thứ**), và
phân biệt rõ 4 thứ đang mang tiếng "vật liệu" (`MaterialDef` · `.pbr` · `ProductSpec` · `SceneTheme`).

### Việc còn dở / chặn
- `SPEC-DUNG-3D-THONG-NHAT.md` (đợt 4, 🔴) **CHƯA viết** — cố ý: bộ công cụ 3D phụ thuộc tập cấu
  kiện chốt ở §2/§6 spec này. Viết trước là phải sửa lại. Phiên sau làm khi §2/§6 được duyệt.
- §2.4 đề xuất thêm `'covering'` vào `ElementType` (IfcCovering — lớp hoàn thiện) **chờ NC-11** của
  COWORK-NC. Không code trước.
- 4 câu hỏi treo ở §11 cần TỔNG/Hoà chốt (rõ nhất là câu 2: `RoomEntity` vào `Entity` union hay
  bảng phụ — ảnh hưởng round-trip DXF/`.idf`).
- Đề nghị gửi TỔNG (không tự sửa file vai khác): chèn 1 dòng đính chính đầu `SPEC-CHANG2-UI-2MODE.md`
  (tên "2MODE" nay sai) và `SPEC-3D-CORE.md` §0 (cách gọi "IF hai tầng IF1/IF2" lỗi thời — luật kỹ
  thuật §1-§4 vẫn đúng nguyên). Chi tiết ở §12 của spec mới.

### CHỐT PHIÊN
Việc đợt 5 của vai xong. Không đụng `lib/`/`components/`/`app/` — đúng luật hạm đội.
Phiên sau nhận vai COWORK-DỰNG: đọc `SPEC-TANG-DU-LIEU-CAU-KIEN.md` §0 (bảng hiện trạng code) +
§9 (lộ trình P0-P7) trước, **đừng grep lại từ đầu**. Việc kế tiếp = `SPEC-DUNG-3D-THONG-NHAT.md`.

---

## CA 04/08 (đợt 4) — `SPEC-DUNG-3D-THONG-NHAT.md` (581 dòng)

**Việc:** #3 của `CHOT-TEN-CHANG-MODE-2026-08-03.md` §6 — spec mode 3D thống nhất, không mode con.
Đọc trước: `SO-KIEM-TONG` §0→§0d · `CHOT-TEN-CHANG-MODE` VÒNG CUỐI + §5 · `SPEC-TANG-DU-LIEU-CAU-KIEN`
(spec nền cùng vai) · `SPEC-HA-TANG-UI-IF` 4 trụ · `SPEC-DUNG-PIPELINE-RENDER-AI`.
Code đã đọc thật: `lib/commands/registry.ts` (389d) · `vcb.ts` · `components/three/*` (CommandPanel
415d · Viewport3D 162d · ObjectProperties 177d · Scene3DViewer 359d) · `render-studio/Command3DPanel.tsx`
· `Render3DModeSkeleton.tsx` · `lib/three/cad-to-obj.ts` · `mode-render-3d.ts` · `lib/shell/mode-registry.ts`
· `lib/shortcuts.ts` · `AppShell.tsx` · `lib/nodes/defs/render-v2.ts`.

### Nội dung spec
§1 khai báo mode `3d` theo Trụ 4 + bảng so với mode `node` (6 ổ) · §2 **bộ 10 công cụ tối thiểu**
+ 27 lệnh khác, có phím tắt + alias + id registry · §3 push/pull + gizmo + ô nhập số quy về **một
luật ba dòng** (cái nào hiện lúc nào · gõ số áp ra sao · ghi Doc theo hợp đồng 5 bước đã chạy đúng)
· §4 chọn-theo-ngữ-nghĩa neo `specId → elementType+wallKind → block` · §5 cây TẦNG › PHÒNG › VẬT
· §6 Inspector tự sinh theo 6 loại đối tượng · §7 nút "Dựng ảnh" (dựng sẵn chuỗi 3 node, không
bấm-là-ra-ảnh) · §8 đủ §0c ba mảng · §9 KHÔNG LÀM có lý do · §10 lộ trình D0-D15 · §11 5 câu treo.

### 12 phát hiện khi đọc code (H1-H12, đều grep được)
1. **H1 — sổ lệnh có ĐÚNG 0 lệnh 3D.** 55 CommandDef đều `stage==cad`. 17 chuỗi `render.3d.*` đang
   được `CommandPanel.tsx` gọi chỉ là string trong component, không nơi nào khai. ⇒ phải thêm **37**
   `CommandDef`; `when` parser + `WhenCtx` đã đủ, **0 thay đổi cơ chế**.
2. **H2 — `findByAlias()` không lọc `when`** ⇒ thêm alias 3D trùng chữ CAD (`M`/`W`/`S`/`C`/`T`) sẽ
   che lệnh CAD im lặng. Bug thật, phải vá (D3) + đai an toàn: alias 3D có hậu tố `3`.
3. **H3 — `defineMode()` có 0 nơi gọi.** Docstring `mode-registry.ts` tự nhận đã đăng ký mode `cad`;
   grep `getMode(` = 0. Trụ 4 mới chỉ có trên giấy. Kèm H4: hai bản khai mode lệch nhau (3 trường
   kiểu ReactNode vs 6 trường kiểu string).
4. **H5 — hai CommandPanel song song.** Bản `components/three/CommandPanel.tsx` (5 tab đủ) + 
   `ObjectProperties.tsx` = **592 dòng code tốt KHÔNG mount ở đâu**; app thật chạy
   `render-studio/Command3DPanel.tsx` với 3/5 tab placeholder. Khoá tab còn lệch (`tao` vs `create`).
5. **H6 — gizmo hiện tại là hình vẽ, không phải công cụ**: SVG cố định giữa viewport, không bám vật,
   bấm là nhích cứng 100mm, không kéo, không nhập số.
6. **H7 — 3D vẫn không đọc `storey`/`elementType`/`specId`**, `entityId` vẫn chỉ có ở nhóm tường,
   tên nhóm vẫn `Wall_${i+1}` (bom Đ2). Đúng như spec nền ghi 03/08 — chưa ai vá.
7. **H8 — dropdown lọc tầng ở tab "Hiện" không bao giờ hiện** vì `SceneObject.storey` luôn undefined
   (hệ quả H7). Cây theo tầng của mock chưa có nền dữ liệu.
8. **H9 — va phím `B`**: AppShell ăn phím trần B/I ở mọi chặng trừ CAD ⇒ `B` (thùng sơn kiểu
   SketchUp/D5) sẽ thu Navigator. Sửa 1 dòng `AppShell.tsx:126` (mở rộng luật ⇧ đã có, không đẻ luật mới).
9. **H10/H11 — ⌘K chưa tới chặng 3D** (nhãn tự khai trong `shortcuts.ts`) và **0 phím tắt nào cho 3D**.
10. **H12** — token trục khai cứng hex trong `ve3d-css.ts`, tên `--ax-*` lệch với `--axis-*` của spec.
11. Cầu 3D→AI **đã có và tất định**: `three.cad2fbx` đọc thẳng Doc, `three.camera`, `captureFrame()`
    → §7 dùng lại, cấm đẻ đường thứ ba.
12. VCB lõi (`lib/commands/vcb.ts`) đã có đủ `3x` `/3` số mm dấu phẩy VN → §3.2 không viết parser mới.

### CHƯA VERIFY (ghi thẳng theo §0)
- Push/pull chỉ nhận **mặt trên tường** (`worldNormal.y<0.5 → return`), kẹp cứng 2-6m — chưa thử tay
  kéo mặt sàn/trần/đồ.
- Chưa grep đủ sâu `useFlowStore` xem có hàm dựng-sẵn-node-graph + nối dây từ ngoài không (§7.2 · D14).
- Chưa đối chiếu `AUDIT-GESTURES-INPUT.md` cho phần cử chỉ tablet (§8.3).

### Việc còn chặn
- §11 5 câu treo cần Hoà/TỔNG chốt (rõ nhất: phím `B`, và cây 2 bậc chạy trước hay chờ `RoomEntity`).
- `'covering'` vẫn chờ NC-11 ⇒ panel lớp hoàn thiện (§6.2) chưa code được.
- Việc 🟡 #5 của §6 `CHOT-TEN-CHANG-MODE` (đính chính đầu `SPEC-CHANG2-UI-2MODE.md`) — Cowork không
  sửa file vai khác, đã nhắc lại ở §12 spec mới, cần TỔNG chèn.

### CHỐT PHIÊN
Không đụng `lib/` `components/` `app/` — chỉ ghi `docs/`. Không chạy git (luật phiên Cowork).
Phiên sau nhận vai COWORK-DỰNG: đọc `SPEC-DUNG-3D-THONG-NHAT.md` §0 (bảng H1-H12) + §10 (D0-D15)
trước, **đừng grep lại từ đầu**.
