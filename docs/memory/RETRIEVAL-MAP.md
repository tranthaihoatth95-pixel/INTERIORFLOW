# RETRIEVAL MAP — chỉ mục tìm nguồn theo topic (Tầng B của hệ memory)

> **Lập lần đầu 19/08/2026** (trước đó file này KHÔNG tồn tại). Vai trò: khi cần quyết định lớn
> về một topic, file này nói **đào ở đâu** — nó là INDEX, KHÔNG phải source-of-truth code.
> Mọi khẳng định code trong đây mang ngày đo; quá ~1 tuần hoặc qua refactor lớn = đo lại.
> Luật cập nhật: chốt lớn / audit / drift mới → sửa đúng topic NGAY LƯỢT ĐÓ.
> Hợp đồng đầy đủ của hệ memory: `docs/memory/IF-MEMORY-RETRIEVAL-SYSTEM-2026-08-19.md`.

---

## PROJECT / WORKSPACE

CURRENT CANONICAL:
- `docs/IF-ARCHITECTURE-BLUEPRINT.md` (v1.0, 19/08) — B-section về Project/Workspace/Canvas
- `docs/INTERIORFLOW-ARCHITECTURE-MAP.md` — living direction
- `docs/ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md` — ADR thắng cả hai

KEY DECISIONS:
- C4 (Hoà chốt 19/08): **Project → nhiều Workspace → nhiều Canvas + MỘT Project Flow/Timeline**.
  Canvas=working surface · Workspace=working context · Project=identity+truth+genealogy.
  Khuyến nghị "một canvas" của T 16/08 SUPERSEDED.
- C3: Workspace = compose; danh mục CẤP 0.5 (11/08, `00-CHOT`) = các workspace instance chuẩn.
- Kiến trúc canvas + cửa sổ công cụ: `00-CHOT` mục 16/08 "CHỐT KIẾN TRÚC CANVAS + CỬA SỔ".

CODE ANCHORS (đo 19/08):
- Schema **không có model Workspace** — `Project` là thực thể DB (30 usage); code "workspace"
  = `WorkspaceMode` enum chặng (`lib/store.ts`, `lib/workspace.ts`, 152 ref). KHÔNG duplicate,
  chỉ là rủi ro từ vựng.
- NODE unit-of-work = [UNKNOWN] duy nhất còn treo trong Blueprint — cấm bịa.

KNOWN DRIFT: hai bộ "chặng" trong code — `CadStage='sketch'|'technical'|'bim'` (`lib/cad/store.ts:145`,
tự gọi "CHẶNG", trích BIGPICTURE đã huỷ) vs `phases` concept/render/present vs `GatewayStage`.
Máy soi chưa quét lib/ cho luật này (audit 19/08 §3c).

WHEN MAKING A BIG DECISION:
1. Đọc ADR → Blueprint (B3 từ điển, B20 KHÔNG-PHẢI-LÀ, B25 NO-REBUILD)
2. Đọc `docs/memory/sessions/2026-08-19/09-blueprint-canonical/`
3. Grep `WorkspaceMode|CadStage|phases` tại HEAD hiện tại
4. Không kết luận từ memory một mình.

---

## FILES / MASTER LIBRARY / IDFC

CURRENT CANONICAL:
- `docs/memory/sessions/2026-08-19/10-file-library-idfc/` (01-idfc-contract → 06-representations)
- `docs/IF-FILE-MASTER-LIBRARY-IDFC-MODEL.md` (19/08, untracked)
- `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` §3 (Files hai TẦNG + Collection+)

HISTORICAL ORIGIN: chuỗi chốt 07/08 (`.idfc` = một cấu kiện, C=CONTENT, vỏ chung + ruột theo kind)
→ 16/08 (Files↔Thư viện = hai trạng thái của cùng dòng chảy; bỏ nghĩa "chợ đầu mối")
→ 17/08 (hai TẦNG thay hai NGĂN; Collection+ 8 gói, không tách route) — đều trong `00-CHOT`.

KEY DECISIONS: dòng chảy VẬT: Files (thô) → cửa sổ công cụ (thêm định nghĩa) → Master Library
(.idfc đủ định nghĩa) → đề xuất đúng chỗ. MỘT Master Library, vật liệu là KỆ, màu là BƯỚC.

CODE ANCHORS (đo 19/08):
- `lib/cad/idfc.ts` (parse/validate, `IDFC_MIGRATIONS`) · `lib/library/idfc-store.ts` ·
  `components/library/LibrarySheet.tsx` (mount `AppShell.tsx:202`) · `app/files/` (HaiNgan hai tầng)
- `LibraryItem` = DTO TS (34 ref) — KHÔNG phải Prisma model; model DB là `LibraryAsset`.

KNOWN DRIFT (audit 19/08): `geom2d` write-only (0 reader — món .idfc nhập không thả xuống bản vẽ
được) · `SELLABLE_KINDS` 0 reader · `exportIdfcStoreJson` 0 caller uncommitted ·
`lib/idfc-import/**` 3.341 dòng 0 caller (orphan lớn nhất repo) · specId đứt lúc drop (P0-3).

WHEN MAKING A BIG DECISION:
1. Đọc session 10-file-library-idfc (01-idfc-contract trước)
2. Đọc audit 19/08 mục idfc/geom2d/specId
3. Grep `importIdfc|resolveLibraryItem|DROPPABLE_ITEM_KINDS` tại HEAD
4. Không kết luận từ memory một mình.

---

## MATERIAL

CURRENT CANONICAL:
- `docs/memory/sessions/2026-08-19/10-file-library-idfc/04-material.md`
- `bao-cao-phien/2026-08-19-wave0-runbook-db.md` (runbook matId — drift thật = 1 cột)
- Chốt "một vật ba mặt" + "đồng bộ = không tách ra ngay từ đầu": `00-CHOT` 16/08.

KEY DECISIONS: vật liệu TRỎ TỚI bản ghi thương mại, KHÔNG chép giá (luật 2.1.9.i 30/07 vẫn đúng) ·
range giá thuộc kho chung, giá chốt thuộc dự án · BOQ chỉ nhận số đo được, `specId` required
(Wave 0), overrides thắng variant (C2/M-03).

CODE ANCHORS (đo 19/08):
- `lib/materials/resolve.ts:88` `getMaterial()` — **2 caller thật** (`MaterialsScreen.tsx:98`,
  `app/files/_lib/ngan-tho.ts:142`). Sổ cũ "0 caller" đã SAI từ 17/08.
- matId namespaces ĐÃ hoà giải: `pbr-store.ts` (legacy upper + canonical UUID + cầu migrate
  `migratePbrLegacyToCanonical`) · `matid-identity.ts` · `warehouse/dto.ts` · `boq/model.ts:58`
  khai rõ matId BOQ = ProductSpec.id, deprecated về specId. (Chỗ duy nhất "nhiều namespace" được
  nối tử tế — audit 19/08.)
- PENDING: cột `ProductSpec.matId` chưa migrate (đúng 1 cột drift; 4 file untracked chờ:
  `matid-identity.ts` + tests + `scripts/backfill-material-matid.ts`) — Hoà chạy runbook.

KNOWN DRIFT: specId không được truyền lúc drop từ Thư viện (audit P0-3) → BOQ `missing-specId-item`.

WHEN MAKING A BIG DECISION:
1. Đọc 04-material.md + runbook DB
2. Đọc `lib/materials/resolve.ts` + `lib/boq/model.ts` docstring
3. Grep `getMaterial|specId|matId` tại HEAD (cẩn thận: matId có 2 nghĩa đã khai)
4. Không kết luận từ memory một mình.

---

## 2D / 3D

CURRENT CANONICAL:
- `docs/INTERIORFLOW-ARCHITECTURE-MAP.md` + Blueprint B-section
- Định nghĩa 3 chặng bản cuối: `00-CHOT` mục 07/08 (Thiết kế 2D / 3D / Trình chiếu; ID
  `concept/render/present` KHÔNG đổi) · luật X1–X4 (dựng đâu cũng ghi MỘT Doc, không chặn chặng).

KEY DECISIONS: BuildRecipe = "ý định có cấu trúc" của luật 8 (AI sinh recipe, không sinh mã tự
do — 15/08) · lệnh dựng giữ tên Anh (08/08) · mirror-đối-xứng chuan-net (14/08) · kiểm chuẩn =
MÁY không phải AI (15/08).

CODE ANCHORS (đo 19/08):
- BuildRecipe SỐNG đủ dây: `lib/cad/model.ts` BuildOp union → `lib/three/build-recipe.ts:93`
  `evalRecipe` → `Command3DPanel.tsx:1262-1285` (user chạy được).
- CamPath SỐNG đủ dây: tool `campath` → `CamPathPanel` (`CadEditor.tsx:866`) → preview/control →
  `CameraExportTab`. Sổ nghi "chưa wire" đã sai từ 02/08.
- Elevation SỐNG: `lib/cad/levels.ts` (5 component) + `lib/three/section-entities.ts`.
- Vision SỐNG: `single-view-metrology` → `ToolModeForm.tsx` (4 hàm gọi thật).
- `lib/commands/registry.ts` — cả 3 toolbar đọc qua `toolbar-source.ts` `commonCommandsFor`.

KNOWN DRIFT (audit 19/08): `lib/idfc-import/**` 0 caller · `pickHatchFace` O(N²) còn nguyên,
lời hứa entry chưa mở · `fix/hatch-t-junction` nhánh treo 39 ngày · `plan-depth.ts` 0 caller ·
`Tool3DBar` chưa lắp ToolbarChip (2/3 thanh xong) · hai ⌘K cùng nghe trên `/projects/[id]/render`.

WHEN MAKING A BIG DECISION:
1. Đọc MAP + chốt 3 chặng trong 00-CHOT (07/08)
2. Đọc audit 19/08 mục 2D/3D
3. Grep symbol cụ thể tại HEAD (`evalRecipe|CAMPATH|pickHatchFace`)
4. Không kết luận từ memory một mình.

---

## PRESENT / VISUAL PIPELINE

CURRENT CANONICAL:
- Chốt chặng 3 đa đích + human-in-loop: `00-CHOT` mục 07/08 tối (bỏ trần 5 sheet · auto-deck
  1-click có người duyệt · bỏ trần 25 template · đích đến phải sửa được).
- Video: TẠO+DỰNG ở chặng 2 master node, chặng 3 CHỈ trình chiếu (Hoà phán 13/08 — thay chốt 02/08).
- Grounded Render: `docs/SPEC-GROUNDED-RENDER-2026-08-13.md`.

CODE ANCHORS (đo 19/08):
- Present editor: `components/present-editor/` (Toolbar đọc registry + routeFormat + LightArc).
- BOQ pipeline sống: `compute→cache→from-project→api/boq→3 UI`.
- Grounded Render mới ở v0: `lib/grounded-render/` 4 file 575 dòng (mtime 13/08); v1 bảng ánh
  xạ + núm per-mảng CHƯA có (registry khai đúng).
- `Frame.rotation` field chết (render sẵn, 0 UI set — từ audit toolkit 28/07, còn nguyên).
- `reviewDeck` không nhận slides → luatDeck không bao giờ chạy.

KNOWN DRIFT: `SPEC-MODE-PER-STAGE.md` §1 "đổi cả shell" đã bị `SPEC-HA-TANG-UI-IF` thay nhưng
CHƯA đóng dấu, còn tự xưng "nguồn duy nhất", 12 file trỏ vào (audit 19/08 §3b — ưu tiên 1).

WHEN MAKING A BIG DECISION:
1. Đọc chốt 07/08-tối + 13/08 trong 00-CHOT
2. Đọc SPEC-HA-TANG-UI-IF (không tin SPEC-MODE-PER-STAGE §1)
3. Grep `luatDeck|Frame.rotation|grounded` tại HEAD
4. Không kết luận từ memory một mình.

---

## VITALS / AI / CREDIT

CURRENT CANONICAL:
- Vitals neo theo ngữ cảnh, 3 nấc (nấc lớn = AGENTIC): `00-CHOT` mục "16/08 Hoà chốt CUỐI về
  VITALS" + `docs/CHOT-16-08-BAN-DUNG.md`.
- Runtime AI: entry `runtime-ai-trong-if` (node-llama-cpp + 3 lựa chọn) · `tang-cli-nguoi-dung` ·
  kiểm chuẩn = MÁY, AI chỉ góp ý (15/08, đã thành luật).
- Bảng giá credit: `lib/nodes/registry.ts` (video 8cr · render 4cr · 13 việc 0cr) + `estimateRunCredit`.

CODE ANCHORS (đo 19/08):
- 🔴 **P0: `VitalsGesturePanel` (675 dòng) mất hẳn lối vào** — importer duy nhất StageSwitcher
  đã gỡ mount 17/08 (uncommitted), StatusBar gỡ từ 05/08. `VitalsPill` chỉ ở Home.
  Chi tiết + genealogy: audit 19/08 P0-1.
- `lib/ai/text-tier.ts` (thang chữ) · `lib/ai/web-lookup.ts` 355 dòng **0 caller** (chờ màn Cài đặt).
- Lớp góp ý `lib/review/gopy` luôn rỗng vì `deBai: null` hằng — không nơi nào dựng `DeBaiDaGhi`.

KNOWN DRIFT: sổ 12/08 ghi nấc 3 Vitals = "trang phiên" — đã đổi thành AGENTIC (16/08).

WHEN MAKING A BIG DECISION:
1. Đọc CHOT-16-08-BAN-DUNG (bảng đè) trước 00-CHOT
2. Đọc audit 19/08 P0-1
3. Grep `VitalsGesture|VitalsPill` mount chain tại HEAD
4. Không kết luận từ memory một mình.

---

## DNA / DISTILL / MEMORY (sản phẩm)

CURRENT CANONICAL:
- Thẻ DNA + DistillEngine một-cỗ-máy-nhiều-mặt-tiền: `00-CHOT` 12/08 (cụm đẳng cấu ①) + 13/08
  (dàn ý chờ sẵn = mặt tiền 4).
- Grounded Render phiếu 4 cấp + SuggestBlend 70/20/10: `SPEC-GROUNDED-RENDER-2026-08-13.md`.

CODE ANCHORS (đo 19/08, T verify tay):
- `lib/distill/engine.ts` SỐNG: import bởi `lib/dna/distiller.ts:27` + `lib/grounded-render/
  reference-sheet.ts:17`. `distillDnaFromSources` → `DesignDnaCardPanel` mount thật ở
  `app/projects/[id]/overview/page.tsx:308`.
- Mặt tiền thứ hai `CuaSoThaoLuan` (856 dòng cả cụm) **0 mount** — cờ `CHUNG_CAT_SAN_SANG=true`
  đã bật nhưng chưa cắm FlowCanvas (chờ Hoà ✓ mock Ca D).

KNOWN DRIFT: hai lượt quét 19/08 cho kết quả ngược nhau về engine này — phán quyết cuối ở
session 11-repo-archaeology README (bảng phân xử).

WHEN MAKING A BIG DECISION:
1. Đọc session 11 bảng phân xử + audit mục DistillEngine
2. Grep `distill/engine|distillDnaFromSources` tại HEAD
3. Kiểm mount chain tới page thật
4. Không kết luận từ memory một mình.

---

## DECISION / REVISION / GENEALOGY

CURRENT CANONICAL:
- `docs/ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md` (9 ADR — thắng Blueprint + MAP)
- `docs/IF-ARCHITECTURE-BLUEPRINT.md` B22 (6 SUPERSEDED cấm hồi sinh) + B25 (NO-REBUILD)
- Khuôn Deep Decision Record 13 ô: `docs/memory/IF-MEMORY-RETRIEVAL-SYSTEM-2026-08-19.md` §2C.

KEY DECISIONS: overrides thắng variant (M-03) · Gateway=từ-điển (M-01) · HEATMAP+NO-REBUILD
(nguyên văn: `memory/sessions/2026-08-19/09-blueprint-canonical/ADDENDUM-NO-REBUILD.md`).

KNOWN DRIFT: file bị thay chưa đóng dấu = genealogy gãy — danh sách nợ ở audit 19/08 §3b
(SPEC-MODE-PER-STAGE · IF1_IF2_BIGPICTURE · CHOT-INTRO-VIDEO mồ côi 17 ngày).

WHEN MAKING A BIG DECISION:
1. ADR trước, Blueprint sau, MAP sau nữa
2. Nhật ký (00-CHOT) chỉ để tra "khi nào", tra bản đè ở CHOT-16-08-BAN-DUNG
3. Kiểm file định trích đã bị ⛔ chưa (đọc 10 dòng đầu)
4. Không kết luận từ memory một mình.

---

## UX / DESIGN SYSTEM

CURRENT CANONICAL:
- Hiến pháp NT-1..18 + KB-1..5: `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` +
  `NC-TRIET-LY-GIAO-DIEN-2026-08-14.md`
- Bảng đè 6 chủ đề 16/08: `docs/CHOT-16-08-BAN-DUNG.md` (đọc TRƯỚC khi tin 00-CHOT về màu/kính/card)
- Token: `app/globals.css` (nguồn DUY NHẤT cho số góc màu — cấm trích từ sổ) · thang bo 6/10/14/20.

KEY DECISIONS: sidebar = hệ router toàn app, rail hai cụm (16-17/08) · ba nấc = ba công năng ·
màu nhấn thứ hai mòng két↔mận CHỜ HOÀ chọn bằng mắt (CẤM đụng `--accent*`) · kính 3 tầng ánh
sáng · OKLCH là không gian màu chuẩn.

CODE ANCHORS (đo 19/08): `RailDieuHuong.tsx` mount `AppShell.tsx:155` · `muc-dieu-huong.ts` =
nav registry · ToolbarChip 2/3 thanh (Tool3DBar chưa) · `thao-tac-glyph` 0 caller (kho hình ô
giải nghĩa chưa cắm) · `LightBar` 0 mount (LightArc 3-4 nơi).

KNOWN DRIFT: `--mat-*` migration SẠCH trong code, sót `docs/FIGMA-HANDOFF.md:44-48` (nguồn gieo
lại tên chết sang Figma) · 2 worktree treo còn docstring StageSwitcher cũ.

WHEN MAKING A BIG DECISION:
1. Đọc CHOT-16-08-BAN-DUNG → NT-doc
2. Đọc token sống từ globals.css (không trích số từ sổ)
3. Grep component tại HEAD + soi:tu-dien / soi:hinh-hoc
4. Không kết luận từ memory một mình.

---

## ARCHINOTE READINESS

CURRENT CANONICAL:
- Chốt 19/08 (đè CLAUDE.md): **Lark/ATLAS = OPTIONAL EXTERNAL ADAPTER** — IF chạy đầy đủ không
  cần Lark; ArchiNote dùng shared contract của IF.
- Chốt 07/08: ArchiNote HOÃN, không thiết kế trước, không field "để dành".

CODE ANCHORS (đo 19/08): cửa đã chừa sẵn miễn phí: `ExternalRef.system` (string tự do, 6 usage,
2 script migrate chờ chạy — KHÔNG dead) · `LarkTaskRef` 5 usage · `lark-write.ts`
`LARK_WRITE_ENABLED=false` (dead intentional, fail-closed) · `api/atlas-materials/sync` engine
hoàn chỉnh chặn ở quyền Lark 131006 (nay Lark optional → cân nhắc hạ ưu tiên).

WHEN MAKING A BIG DECISION:
1. Đọc chốt Lark-optional 19/08 (LATEST + CLAUDE.md dòng đè)
2. Grep `ExternalRef|LarkTaskRef` tại HEAD
3. Không xây gì "để dành" cho ArchiNote (luật 07/08)
4. Không kết luận từ memory một mình.

---

## ORPHAN CAPABILITIES / HIDDEN PRIMITIVES

CURRENT CANONICAL:
- **`docs/IF-CAPABILITY-EXPOSURE-MATRIX.md`** (19/08 khuya muộn — MỚI NHẤT, re-verify độc lập
  tại HEAD `c7f3ac8`) + cặp `IF-INTEGRATED-EXECUTION-MAP.md` (Đợt 0 R1-R11) +
  `IF-INTEGRATION-GATE-2026-08-19.md` (STOP GATE 6/7, nút chờ Hoà H1-H8).
  ⚠️ 2 path đã đổi so audit: `LibraryDropBridge` → `components/cad/` · `ReviewPanel` →
  `components/review/`.
- **`docs/AUDIT-ORPHAN-CAPABILITIES-2026-08-19.md`** — bản đồ đầy đủ 38 orphan, taxonomy A–M,
  action KEEP/RECONNECT/EXTEND/DEPRECATE/INVESTIGATE/IGNORE (không NEW).

LATEST AUDIT: 19/08 (chính là file trên). Trước đó: `soi:cam-dien` (17/08, 85 sống/3 kho chưa
mở) · `DOI-CHIEU-42-SPEC-2026-08-08.md` (§1 đã lỗi thời 12/14 dòng — đừng tin, tra soi:contract).

HISTORICAL ORIGIN: audit toolkit 28/07 (`AUDIT-EDITOR-TOOLKIT.md`, "8 chết" 04/08) · các ca
mồ côi kinh điển: bản đồ COMPASS 19 ngày · master tool↔ToolWindow.

KEY FINDINGS 19/08 (top): VitalsGesturePanel 675 dòng mất lối vào (P0) · WorkHubShell nút giả
duy nhất (P0) · specId đứt lúc drop (P0) · lib/idfc-import 3.3k dòng 0 caller · 2 công thức lux ·
5 ca sổ-ghi-sai đã đính chính.

CODE ANCHORS (máy soi): `soi:frontier` (sổ↔code) · `soi:contract` (kho có dây) · `soi:cam-dien`
(engine tới tay user) · `soi:tu-dien` (nhãn) — cả 4 chạy được, không cái nào bắt được loại lỗi
"mount chain đứt" ⇒ gap máy P-S.

WHEN MAKING A BIG DECISION (hoặc trước khi xây MỚI bất kỳ thứ gì — luật NO-REBUILD):
1. Tra bảng audit 19/08 theo tên capability
2. Chạy soi:cam-dien + soi:contract
3. Đo lại caller/mount tại HEAD bằng recipe §9 của IF-MEMORY-RETRIEVAL-SYSTEM
4. Không kết luận từ memory một mình — audit này cũng sẽ mốc.
