# 10 · Lane 4 — File Manager / Master Library / IDFC (19/08/2026)

## Phiên này là gì
Lane 4 trong mô hình 4 phiên song song 19/08 (MAIN examiner · Execution · UX · **lane này**).
Nhiệm vụ: trace + model + spec chuỗi `FILE → UNDERSTAND → NORMALIZE → PROMOTE → MASTER LIBRARY
→ CANONICAL IDFC → REPRESENTATIONS → PROJECT INSTANCE`. **Không implement, không commit, không
reopen architecture.** Prompt gốc: `PROMPT-GOC.md` trong thư mục này.

## Sản phẩm
1. **`docs/IF-FILE-MASTER-LIBRARY-IDFC-MODEL.md`** — canonical specialist model, 36 mục,
   ma trận CURRENT→TARGET 20 dòng (0 NEW thuần), vertical slice 16 bước, acceptance,
   cross-lane notes E1-E6/U1-U3/M1-M4.
2. **`docs/bao-cao-phien/2026-08-19-file-library-idfc.md`** — báo cáo 6 phần + STOP status.
3. Thư mục này — 6 báo cáo trinh sát nguyên văn (bằng chứng file:line đầy đủ).

## Cách đo
6 agent Explore đọc-only chạy song song:
- `01-idfc-contract.md` — hợp đồng `.idfc` (đọc trọn idfc.ts 443 dòng, kho, resolver, callers)
- `02-file-manager-storage.md` — /files, /library/ingest, api/library, LibraryAsset,
  Format Router, lifecycle, storage authority (kèm bảng verify 10 claim UX audit)
- `03-master-library.md` — kệ + dữ liệu thật (đo cả prisma/dev.db), spotlight, block library,
  đường instance hoá, where-used, ProductSpec/warehouse, Gallery
- `04-material.md` — matid-identity, resolver, PBR store, MaterialDef, ProductSpec, warehouse,
  ATLAS, BOQ, idfc material facet, hatchOverride (kèm đo pragma DB: 34 cột, chưa matId)
- `05-anh-cau-kien.md` — from-photo/chuan-net/part-lock/surface-graph, Trellis, VLM/SAM2/
  BiRefNet/idmask, metrology, BuildRecipe, credit gates, ProposalSheet/Checkpoint/Distill,
  8 hệ provenance
- `06-representations.md` — BlockDef/BlockEntity/DXF blocks, elevation/section primitives,
  cad-to-obj/build-ops/csg/glb-import, CLUSTER_SPECS, quả cầu preview, Doc insertion,
  vocabulary chất lượng

Sau đó T-lane **spot-check độc lập 7 claim nặng nhất** — 7/7 khớp (LIBRARY_APPLY 0 listener ·
resolver không nhận specs · entity thả không specId · resolveInputMatId chỉ trong docstring ·
export matId=code · ProposalSheet 0 code · spotlight items[0]).

## Kết luận một dòng
Mọi mảnh đã có primitive; chuỗi đứt ở **4 khớp nối toàn CONNECT**: ①upload↔record
②understand↔UI+credit-gate ③`.idfc`↔Doc (geom2d không bao giờ thành entity — đi vòng khớp-tên)
④chuanNet.recipeJson↔BuildRecipe (hình dạng khớp, 0 đường đọc). Đề xuất: Hướng A (vá khớp
trước) rồi B (schema Q4/Q5) sau khi Hoà chạy runbook DB — khớp đề xuất UX lane.

## Trạng thái cuối (STOP)
FILE MANAGER MAPPED · MASTER LIBRARY MAPPED · IDFC CONTRACT VERIFIED · MULTI-REPRESENTATION
READY-TO-DESIGN (chờ MAIN chốt M1 v4) · VERTICAL SLICE READY (4 CONNECT) · MATERIAL LINK
MAPPED (dep Slice 1A) · VLM/AI MAPPED · CREDIT MAPPED-PARTIAL · ARCHITECTURE NOT REOPENED ·
CODE NOT MODIFIED · WAVE 1 NOT STARTED · ANTI-LOSS PASS. Không commit, không push.

## Cho MAIN (4 điểm chờ chốt — M1-M4, chi tiết model doc §34)
M1 `.idfc` v4 additive (provenance+recipe+meshRef) vs câu "v3 giữ" của Q3 · M2 Q4 nhẹ/sạch ·
M3 Q5 ProjectFile riêng vs cột stage · M4 lô DRIFT sổ↔code cần đóng dấu.

## Không ghi 00-CHOT / registry
Phiên này chỉ sinh PROPOSAL — không có chốt mới của Hoà ⇒ theo luật §41 phiếu, không tự ghi
thành CHỐT, không mở entry registry.

## DELTA — R1 IMPLEMENT (cùng phiên, sau khi Hoà giao phiếu R1)
Phiếu R1 "specId khi drop" ĐÃ THI CÔNG (CONNECT thuần, 4 file):
`lib/cad/library-item-resolve.ts` (+`LibraryItemRef.specId?`, ưu tiên UI-specId trước matchSpec)
· `components/library/LibrarySheet.tsx` (instantiate tính specId: gán tay `specLinks` thắng
matchSpec, đè vào detail) · `components/cad/LibraryDropBridge.tsx` (chuyển tiếp specId + gán vào
BlockEntity, không có thì KHÔNG khai field) · `lib/cad/library-item-resolve.test.ts` (+khối [7],
5 ca). Verify: resolver test 38/0 · tsc 0 · BOQ compute 160/0 · soi:frontier 0 lệch · **browser
THẬT trên :3001** (gán tay Sofa 3 chỗ → drop → entity `specId=cmrykxtuc…` ✓ · món không spec →
`hasField:false` ✓ · không lây ✓ · undo 2 nấc về 0 ✓). Chưa commit. CROSS-LANE R8: nhánh
`via:'idfc'` sẽ nhận specId qua CÙNG đường `item.specId` này — không cần dây mới.
