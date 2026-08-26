# BÁO CÁO PHIÊN — Lane 4 · File Manager / Master Library / IDFC (19/08/2026)

> Phiên chuyên trách lane 4 trong mô hình 4 phiên. HEAD `3da4b8c` + working tree chưa commit.
> Chế độ: READ · TRACE · MODEL · SPEC · VERIFY — **0 production code, 0 commit**.
> Sản phẩm chính: `docs/IF-FILE-MASTER-LIBRARY-IDFC-MODEL.md` (36 mục).
> Bằng chứng đầy đủ: `docs/memory/sessions/2026-08-19/10-file-library-idfc/`.

## 1 · TỔNG QUAN

Đã trace trọn chuỗi `FILE → UNDERSTAND → NORMALIZE → PROMOTE → MASTER LIBRARY → IDFC →
REPRESENTATIONS → PROJECT INSTANCE` bằng 6 agent Explore đọc-only + spot-check độc lập 7 claim
nặng nhất (7/7 khớp). Kết luận gọn: **mọi mảnh đều đã có primitive (nhiều mảnh có test), nhưng
chuỗi đứt ở 4 khớp nối, và không khớp nào cần NEW** — ma trận CURRENT→TARGET 20 dòng ra
**0 dòng NEW thuần** (2 dòng gần NEW là thi công ADR Q4/Q5 đã ACCEPTED). Vertical slice
"ảnh Internet → cấu kiện" bị chặn bởi đúng 4 việc CONNECT. Không phát hiện DECISION CONFLICT
mới với 9 ADR / C1–C4.

## 2 · CHI TIẾT + EVIDENCE (chọn lọc — đầy đủ trong model doc + 6 báo cáo trinh sát)

| Vùng | Phát hiện đắt nhất | Evidence |
|---|---|---|
| IDFC contract | v3 verified (12 kind, migration thật); nhưng validate NÔNG, cờ tin cậy nằm NGOÀI schema (`xFromPhoto`), ruột `material` không có matId/specId | `lib/cad/idfc.ts:48,69-88,170-185,340-374` |
| Instance hoá | **ĐỨT**: thả món kệ đi vòng khớp-TÊN vào `BLOCKS`; `body.geom2d` tự chứa không bao giờ thành entity; `specId`/`srcInsertId` không được gán lúc thả (spot-check xác nhận) | `LibraryDropBridge.tsx:57,66-76` · `library-item-resolve.ts:140-148` |
| matId | 4 namespace cùng tên đang sống (UUID · UPPER-sku · ProductSpec.id · SheetItem.code); DB thật **chưa có cột matId** (đo pragma = 34 cột); docstring idfc nói gọi `resolveInputMatId` — code 0 caller; export ghi `matId: displayItem.code` | `pbr-store.ts:30` · `boq/model.ts:58-66` · `LibrarySheet.tsx:406,993` · `sqlite3 pragma` |
| Files/Library | 2 đường upload không gặp nhau; `promote/normalize`/lifecycle = **0 code**; LibraryAsset 19 cột 0 provenance/hash; 7 namespace tag ký sinh 1 cột CSV; 3 taxonomy phân loại song song | agent-2 §1-§8, verify bảng 10 claim UX (8 đúng, 1 sai, 1 lệch) |
| Format Router | `detectFormat` **5 caller** (UX audit ghi 1 — SAI); `capabilityFor` 0 caller; đã bị bypass hard-code "ĐẶC CÁCH GATEWAY" | `Toolbar.tsx:268-273` · `capabilities.ts` |
| Ảnh→cấu kiện | HAI pipeline rời nối bằng file đĩa (from-photo ảnh→GLB · chuan-net GLB→OBJ+recipe); toàn bộ `lib/idfc-import/**` ≈3.341 dòng **0 caller**; `recipeJson` khớp khuôn `BuildOp.revolve` nhưng 0 đường đọc; món 3D duy nhất = hardcode regex `/lincoln 327/i` | `from-photo.ts` · `chuan-net.ts:863-867,1200-1220` · `LibrarySheet.tsx:91-98` |
| Provenance | 8 hệ độc lập; `origin/sourceAssetId` = 0 hit toàn repo; cờ 3 nấc `measured|inferred|verified` chỉ sống trong nhánh chưa cắm, nấc `measured` chưa dùng | agent-5 §8 |
| Human review | Checkpoint sống 3 mount (không persist) + DistillEngine "người thắng máy" — khuôn duy nhất chạy thật; **ProposalSheet = 0 code** | `Checkpoint.tsx` · `distiller.ts:162-164` |
| Credit | Gate `/api/jobs` thật; 2 route AI 0 gate (`nvidia-image`, `vision/caption`); `from-photo` gọi `fal.subscribe` trực tiếp; `imageTo3d` 6cr chưa từng bị trừ (tự khai) | `jobs/route.ts:58-62` · `tiers.ts:147-150` |
| UI nói thật | 3 chỗ báo-thành-công-giả (toast BulkIngest không-idfc · toast "Đã áp" event 0 listener · spotlight `items[0]`) + nút câm "Mở trong InteriorFlow" | `BulkIngestMode.tsx:167-170` · `LibrarySheet.tsx:414,441-444` · `FileManagerShell.tsx:750-752` |
| Elevation | Primitive ĐỦ và ĐÃ NỐI UI (`elevationToEntities` + `OrthoView` 3-nhãn chống trộn) — ghi chú cũ "chưa mount" trong `plan-depth.ts:22-29` đã lỗi thời | `section-entities.ts:440` · `SectionExtractPanel.tsx:31-32` |
| Kho idfc | IDB (W0.3), upsert theo `meta.code` **đè phẳng**, không pin version, không where-used; `exportIdfcStoreJson` 0 nút | `idfc-store.ts:24-27,61-64,84` |

DRIFT sổ↔code ghi nhận (chuyển MAIN, không tự sửa): docstring `resolveInputMatId` · "46 block"
vs đếm 41 · `plan-depth` note lỗi thời · docstring idfc nhắc `payload`/`thumbnail` không có
trong schema · LATEST 17/08 "Files hai TẦNG" — code mới có hai NGĂN, `COL-` 0 hit.

## 3 · TỔNG KẾT BỨC TRANH

Vision Q3/Q4/Q5 và code không cãi nhau — code **đi trước một nửa** (format tự chứa, migration,
cờ 3 nấc, parametrize, mirror-completion đều đã viết) nhưng **dừng trước khớp nối cuối** đúng
họ bệnh "76 xong-máy đối 1 xong-mắt". Bốn khớp đứt: ① upload↔record ② understand↔UI+gate
③ idfc↔Doc ④ recipe↔BuildRecipe. Vá 4 khớp = vertical slice chạy được end-to-end mà không
đụng kiến trúc, không NEW format, không NEW store. Phần TARGET thật sự mới chỉ có: record file
thô (Q5), hash+origin (Q4), overrides entity (Q3-3a), v4 idfc additive (provenance+recipe) —
tất cả đã có ADR hoặc khuôn sẵn.

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Tốt**: nền format/deterministic rất dày và trung thực (tự khai giới hạn trong docstring gần
như mọi chỗ); 6 trinh sát + spot-check cho evidence dày đặc file:line; verify được cả DB thật.
**Chưa tốt / rủi ro**: ① toàn bộ là phân tích tĩnh, 0 runtime — các claim 0-caller/0-mount cần
1 lượt browser verify trước khi flip trạng thái; ② 3 chỗ UI báo-thành-công-giả là vi phạm luật
khai-thật đang sống với người dùng (nặng hơn mọi GAP kiến trúc); ③ working tree chưa commit +
nhiều phiên song song ⇒ số đo hạn dùng ngắn; ④ đề xuất v4 idfc chạm câu "v3 giữ" của Q3 —
nếu MAIN không xếp lịch rõ sẽ thành nguồn tranh luận lại.

## 5 · HAI HƯỚNG XỬ LÝ

**Hướng A — "VÁ 4 KHỚP NỐI TRƯỚC, SCHEMA SAU"**: lô CONNECT nhỏ (resolver nhánh idfc + truyền
specs + gán specId/srcInsertId · mặt tiền from-photo qua route có gate · reader recipeJson ·
sửa 3 toast giả) rồi mới đụng Prisma (Q4/Q5).
Ưu: 100% CONNECT đúng B25, không chờ Hoà chạy migration, trả slice nhìn-thấy sớm, giảm nợ
xong-mắt. Nhược: provenance/hash chưa có ⇒ item promote đợt đầu thiếu origin, phải backfill.

**Hướng B — "SCHEMA TRƯỚC (Q4+Q5), PIPELINE SAU"**: dựng ProjectFile + contentHash/origin +
promote endpoint trước, rồi mới nối understand/instance.
Ưu: item sinh ra sạch từ đầu, không backfill. Nhược: bị chặn bởi migration Hoà chạy tay (đúng
blocker Slice 1A đang treo), khối lượng lớn, chưa có gì nhìn thấy trong lúc chờ; các nút giả
tiếp tục sống.

## 6 · ĐỀ XUẤT

**Chọn A, B ngay sau khi Hoà chạy runbook DB** — vì: ① 4 khớp CONNECT không phụ thuộc bất kỳ
quyết định treo nào; ② trong A có việc sửa 3 chỗ báo-thành-công-giả = loại lỗi luật cứng phải
xử trước mọi việc mới; ③ B bị chặn thật bởi migration tay (cùng cửa với Slice 1A) — chạy A
trong lúc chờ là dùng thời gian chết đúng chỗ; ④ thứ tự này khớp đề xuất của UX lane (A-trước-B)
⇒ MAIN gộp hai lane thành một lô Wave dễ. Điều kiện kèm: mỗi khớp một phiếu nhỏ có ô ⓪, cấm
nhân-tiện refactor vùng dày; mọi call AI mới bắt buộc qua route có `spendCredits`.

---

### NEGATIVE EVIDENCE (cho các mục TARGET gần-NEW)
- Quality enum 3D: đã tìm `REFERENCE_ONLY|PROXY|grade|LOD|fidelity` trong lib/components/app
  = 0 hit dạng code; primitive gần nhất = bảng 4 trạng thái SPEC-MASTER-LIBRARY-3D-CONTRACT +
  `ProvenanceKind` + `ProvenanceFlag` (đều tồn tại) ⇒ REUSE, **không tạo enum**.
- Lifecycle file: đã tìm `promote|normalize|RAW|UNDERSTOOD|PROMOTED` = 0 hit nghĩa pipeline;
  primitive gần nhất = `FmFile.lifecycle` (chết) + ADR Q5 ⇒ EXTEND theo Q5, không tự đặt enum mới.
- Provenance model chung: 8 hệ đang sống ⇒ KHÔNG dựng model đại thống nhất; chỉ chuẩn hoá
  khoá `sourceAssetId` + reuse `ProvenancedValue`.

### CHƯA CHẮC
Phân tích tĩnh 100% · worktrees bỏ qua · test suite chưa chạy (trừ 1 file) · dev.db là DB dev
cục bộ · `app/api/specs/[id]` chưa đọc nội dung · thân `surface-graph`/`chuan-net` chưa đọc trọn.

### HẠN DÙNG
Hết hạn khi Hoà chạy runbook DB / commit Wave 0, khi Slice 1A bước 2 thi công, hoặc khi bất kỳ
phiếu nào chạm idfc/resolver/DropBridge/api-library. Số grep phải đo lại tại nguồn.

### CROSS-LANE NOTES
Đầy đủ ở model doc §34 (E1–E6 Execution · U1–U3 UX · M1–M4 MAIN). Không DECISION CONFLICT mới.

### STOP STATUS
FILE MANAGER: **MAPPED** · MASTER LIBRARY: **MAPPED** · IDFC CURRENT CONTRACT: **VERIFIED** ·
IDFC MULTI-REPRESENTATION: **READY-TO-DESIGN** (chờ MAIN chốt M1) · IMAGE→COMPONENT VERTICAL
SLICE: **READY** (4 việc CONNECT mở khoá) · MATERIAL LINK: **MAPPED** (dependency Slice 1A) ·
VLM/AI: **MAPPED** · CREDIT/COST: **MAPPED — PARTIAL** (2 route + 1 direct-call ngoài gate) ·
ARCHITECTURE: **NOT REOPENED** · PRODUCTION CODE: **NOT MODIFIED** · WAVE 1: **NOT STARTED** ·
ANTI-LOSS: **PASS**.
