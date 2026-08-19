# LATEST — bản nén trí nhớ bối cảnh IF (ghi đè mỗi phiên lớn)

> **Đọc file này ĐẦU TIÊN**, rồi **`docs/memory/RETRIEVAL-MAP.md`** (chỉ mục 11 topic → nguồn sâu, lập 19/08), rồi **`docs/INTERIORFLOW-ARCHITECTURE-MAP.md`** (bản đồ chính tắc 19/08 — thay `IF-KIEN-TRUC.md`), rồi **`docs/TAC-NHAN-T.md`** (vai T).
> Luật giữ bản nén: **CHỈ tên + đường dẫn + một câu. Cấm chép nội dung.**

**Cập nhật lần cuối: 2026-08-19 khuya muộn (MAIN — Q5-SCHEMA đóng, chạm migration execution gate)**

---

# 2026-08-19 · khuya muộn (tiếp #7) · MAIN — Hoà chốt Reference/Asset contract, Q5-SCHEMA đóng

**Hoà chốt đầy đủ contract** (10 điểm, xem message gốc): model tên `ProjectAssetUsage`, field tối
thiểu, `workspaceId?`/`canvasId?` TRANSITIONAL (không FK trước H9), `usage` REUSE vocabulary
KHÔNG deprecate `LibraryAsset.usage`, thứ tự Q5→Understand→Promote→LibraryAsset→
ProjectAssetUsage→H9→downstream. Uỷ quyền MAIN tự chia packet end-to-end sau khi Q5 READY,
không hỏi lẻ trừ migration-execution-gate/destructive/license/evidence-sai-tiền-đề.

**Q5-SCHEMA đóng** (`f0696a9`): `ProjectFile` + `ProjectAssetUsage` thêm vào `prisma/schema.prisma`
TEXT-ONLY (append 106 dòng, 0 sửa field khác) — KHÔNG push/generate (đúng luật CLAUDE.md). 0 code
nào gọi 2 model mới (route sẽ không tsc-pass tới khi Hoà push+generate — ràng buộc kỹ thuật thật,
không phải lựa chọn). tsc gộp vẫn 0.

**Hit migration execution gate** — đây là điểm dừng hợp lệ theo đúng lời Hoà cho phép gọi lại.
H6 nay gộp 2 slice (matId cũ + ProjectFile/ProjectAssetUsage mới), Hoà `db push` MỘT LẦN áp cả hai.

**30 commit trên `backup/2026-08-19-batch0a`, remote sync, `main` vẫn `c7f3ac8`.**

## ⛔ CHỜ HOÀ (bổ sung — không hỏi lẻ, chỉ thêm vào Human Gate Batch đã gộp)
Sau khi push xong (H6): mở Promote-transaction + ProjectAssetUsage API + Reference UI attach/reuse
+ browser Golden Journey (asset X→Project A→reuse B→usage khác nhau→reopen giữ→where-used A+B).

---

# 2026-08-19 · khuya muộn (tiếp #6) · MAIN — W5 đóng, WRITER FREEZE

**W5 durable** (`61cdd16`): rev enforcement mở rộng ProjectMember+LibraryAsset qua
`lib/server/rev-guard.ts` (generic, REUSE thật — `flows/[id]/route.ts` refactor để IMPORT, không
giữ bản cục bộ song song). `Project.rev` xác nhận là field CHẾT (0 route update) — không thuộc
phạm vi. 28 commit trên backup, remote sync, `main` vẫn `c7f3ac8`.

**⛔ WRITER FREEZE từ đây** — không mở thêm packet ghi-file cho tới khi Hoà xử ít nhất 1 trong 5
mục Human Gate Batch dưới. Mọi W1-W4 tiếp tục chờ đúng cổng (H6/H7/H9/Q5).

## ⛔ HUMAN GATE BATCH — GỘP MỘT LẦN, KHÔNG HỎI LẺ

**A · H6** — chạy block DB (backup→push→generate→backfill→verify), nguyên văn tại
`docs/memory/sessions/2026-08-19/17-integration-human-gate-batch/README.md` mục H6.

**B · H7** — bấm `git merge --ff-only backup/2026-08-19-batch0a` rồi `git push origin main` (lệnh
đủ tại cùng file mục H7), HOẶC cấp quyền MAIN tự làm trong phạm vi rõ.

**C · H9-A** — route không chỉ định `wsId` thì resolve Flow nào? (cần quyết định sản phẩm, code
không tự trả lời — chi tiết + 2 option tại `docs/memory/sessions/2026-08-19/
16-project-asset-ownership-spec/README.md` mục D).

**D · H9-B** — tên model Workspace mới, tránh đồng âm `lib/workspace.ts`/`WorkspaceMode`/
`Task.workspaceId` (3 thứ đã tồn tại, không liên quan model mới).

**E · Lô mắt 15-20 phút** — gom theo TRẠM (Home/Resume · 2D · Library/Reference · 3D · Goto/Task/
Review · Present · Error/Conflict), không hỏi riêng từng packet. 2 checkpoint chưa exercise được
bằng thao tác thật (Library-drop, GOTO-3D) nên nằm trong trạm tương ứng để Hoà tự thử.

---

# 2026-08-19 · khuya muộn (tiếp #5) · MAIN — Integration + Human Gate Batch

**Pre-integration verify GỘP (0 lệch)**: tsc 0 · `npm test` toàn repo exit 0 (0 fail thật) ·
soi:frontier 0 lệch · soi:cam-dien khớp baseline.

**Golden Loop Browser E2E (server 3001 sống, real click)**: Home→Resume→Present **LIVE, verified
sống** — bấm "Mở lại" nhảy thẳng `/projects/<id>/present`, KHÔNG qua legacy redirect (CONTINUITY-1
xác nhận hoạt động thật, không chỉ unit test). 2D/3D tải sạch console. Library-drop thao tác thật
và GOTO-3D thao tác thật KHÔNG exercise được (cần dữ liệu populated hơn / drag thật) — để lô mắt
Hoà, không tự dựng dữ liệu giả.

**H6 runbook**: đóng gói thành 1 block copy-paste (backup→push→generate→backfill→verify+rollback)
tại `docs/memory/sessions/2026-08-19/17-integration-human-gate-batch/README.md`.

**H7 integration plan**: 26 commit là chuỗi tuyến tính sạch, đề xuất `git merge --ff-only` (không
tạo merge commit, không rewrite history) — lệnh sẵn sàng cho Hoà, MAIN không tự push main.

**Wave dependency graph** (candidate, chưa tự build): W1 Workspace additive (chờ H9-A/B) → W2 Q5
ProjectFile → W3 Promote→LibraryAsset → W4 Project↔Asset N-N → W5 rev-enforcement 3 model còn lại
(độc lập) → W6-W12 xa hơn.

## ⛔ CHỜ HOÀ (gom, không hỏi lẻ)
H6 (chạy block DB) · H7 (bấm merge --ff-only hoặc cấp quyền MAIN) · H9-A (route không wsId resolve
Flow nào) · H9-B (tên model, tránh đồng âm `lib/workspace.ts`) · lô mắt gộp (Library-drop + GOTO-3D
thao tác thật + 11 packet khác đang chờ).

---

# 2026-08-19 · khuya muộn (tiếp #4) · MAIN — Batch 4-lane (2 read-only + 2 writer)

Theo mô hình mới: MAIN tự spawn sub-agent nội bộ, KHÔNG coi peer session ngoài là worker của mình.

**Lane A (H9 read-only)**: xác nhận đường **ADDITIVE khả thi** — `Flow.projectId String?` đã
optional sẵn (`onDelete: SetNull`), thêm bảng `Workspace` + cột `workspaceId?` song song KHÔNG phá
dữ liệu cũ. 3 điểm cứng phải sửa nếu chen route (`lib/scope-core.ts`: `parseStageRoute` hardcode
segment, `resolveFlowForRouteId` giả định phẳng 1 tầng). **Bẫy đặt tên**: `lib/workspace.ts`/
`WorkspaceMode`/`Task.workspaceId` đã tồn tại, ĐỒNG ÂM với model `Workspace` mới — phải đặt tên
khác. 15 điểm sửa lõi đo được nếu breaking. Chi tiết: `docs/memory/sessions/2026-08-19/
16-project-asset-ownership-spec/README.md` mục D.

**Lane B (H11 writer, `a2e1747`)**: `rev` optimistic-concurrency cho `Flow` (route đông nhất, 4/6
điểm increment) — 409 REV_CONFLICT khi 2 người sửa cùng lúc, backward-compat khi không gửi
`expectedRev`. 10 test tích hợp DB thật (self-cleaning) xác nhận Prisma ném P2025 thật. Phạm vi
1 route — `ProjectMember`/`Project`/`LibraryAsset` còn treo (risk tương tự, phiếu sau).

**Lane C (GOTO-3D writer, `42ab5c2`)**: ReviewPanel nhảy-tới-đối-tượng nay đủ cả 3 chặng (2D có
sẵn · deck từ R7 · **3D mới xong** qua `render:goto-entity`, REUSE `fitCameraToScene()` +
`SceneGroup.positions`). Rủi ro đã biết: RoomLight không có positions → rơi về khung toàn cảnh.

**Lane D (Guardian read-only)**: self-audit 22 commit đầu — **4/5 PASS sạch** (0 duplicate
primitive · 0 store/router/DS thứ hai vi phạm · 0 đổi persistence key · test thật 100%), **1
WARNING** (Execution Map §3 + Capability Matrix lệch tiến độ so Gate) — đã sửa (`daf3073`).

**25 commit trên `backup/2026-08-19-batch0a`, remote sync, `main` vẫn `c7f3ac8` không đổi.**
Golden Loop: checkpoint "→ tới nguồn" (COORDINATE) nay LIVE đủ 3 chặng nhờ GOTO-3D; "→ sửa →
downstream" (REVISE) một phần LIVE nhờ H11 (Flow — 1/4 model).

---

# 2026-08-19 · khuya muộn (tiếp #3) · MAIN — CONNECT-1 đóng + phối hợp 2 peer qua SendMessage

**Phân loại peer đúng cách** (theo hướng dẫn mới: ListAgents thấy 5 peer ≠ 5 active-writing) —
kiểm mtime dirty-tree (phẳng 1.5h ngoài chính MAIN) + hỏi trực tiếp `Execution`/`UX/UI` qua
SendMessage thay vì mặc định coi peer là blocker.

**2 phối hợp thật xảy ra trong round**:
1. `UX/UI` xác nhận R3 (đã checkpoint `f25716e`) khớp byte-identical + phát hiện 1 file sót
   (`docs/bao-cao-phien/2026-08-19-prompt01-ux-workspace-files-flow.md`) — đã vớt (`06739c5`).
2. `Execution` bắt lỗ thật: spec ownership round trước viết KHÔNG đọc ADR-Q4/Q5. Đã đọc + sửa
   (mục A0 trong file spec) — Q5 (`ProjectFile` raw→promote, 1-N trước-promote) BỔ SUNG chứ không
   conflict với join-table N-N sau-promote của tôi. Cũng cảnh báo đúng lúc: `app/library/ingest/
   page.tsx` mang `hydrateRefManifest()` (W0.3 của họ) đúng vùng CONNECT-1 đang sửa — đã chuyển
   cảnh báo cho worker qua SendMessage, xác nhận sau đó KHÔNG bị đụng.

**CONNECT-1 đóng** (`dee7ee8`): "Pick hình" Openverse/Unsplash ở `/library/ingest` hết dead-end —
`saveLibraryAssetFromBuffer()` là cửa ghi DUY NHẤT (dùng chung upload+URL ngoài), route mới
`POST /api/library/from-url` có SSRF guard REUSE `isFetchableImageUrl`. 7 test mới + tsc gộp 0.
"Đề xuất nguồn mới" Gallery để lại phiếu sau.

**21 commit trên `backup/2026-08-19-batch0a`, remote sync, `main` vẫn `c7f3ac8` không đổi.**

---

# 2026-08-19 · khuya muộn (tiếp #2) · MAIN — Project↔Asset ownership (many-to-many), SPEC only

⓪ đo lại: khớp 100%, 5 phiên peer vẫn sống. **Hoà đảo đề xuất H12 round trước**: một ảnh có thể
dùng NHIỀU Project (N-N), không phải `projectId` trực tiếp trên `LibraryAsset` (1-N — sai).

LOOK INSIDE join-table primitive: **xác nhận đây là quan hệ N-N ĐẦU TIÊN thật sự** giữa Project và
Asset — 0 primitive REUSE/EXTEND được (`ProjectMember` chỉ học được hình dạng bảng, khác model;
`ExternalRef` là mirror 1-1 ra ngoài; `TaskContext Link`/`ProductSpec.imageAssetId` đều 1-giá-trị).
MAIN spot-check 3 claim — khớp 100%. Thiết kế TARGET CONTRACT ở dạng **SPEC, KHÔNG viết Prisma**
— đúng STOP CONDITION (schema migration cần Hoà). Chi tiết đủ (negative evidence · field đề xuất ·
Golden Journey R0-R8 · 2 taxonomy song song cần cầu nối): `docs/memory/sessions/2026-08-19/
16-project-asset-ownership-spec/README.md`.

## ⛔ CHỜ HOÀ (H12 SỬA LẠI — không còn là "thêm projectId", mà là:)

H12 — chốt tên + field model join-table `Project↔LibraryAsset` (đề xuất: `projectId`+`assetId`+
`workspaceId?`+`canvasId?` không-FK+`usage`+`addedBy`, hình theo `ProjectMember`) · câu hỏi taxonomy
`RefUsage`↔`LibraryAsset.usage` có deprecate 1 bên không.

---

# 2026-08-19 · khuya muộn (tiếp) · MAIN — Reference/Image Intelligence Reconciliation

⓪ đo lại: reality khớp 100%. **Phát hiện: 5 phiên peer sống song song** (UX/UI · Execution ·
GUARDIAN · interiorflow-93 · tranben-12) — phạm vi không rõ ⇒ round này CHỈ audit read-only, hoãn
packet ghi-file. 2 audit Explore song song, MAIN spot-check 8 claim — khớp 100%.

**Kết luận một câu**: ảnh reference là **BỐN HÒN ĐẢO không nói chuyện với nhau** (LibraryAsset ·
RefManifest/IndexedDB · Files ngăn① · Gallery-local-state), và đảo bền nhất (`LibraryAsset`)
**KHÔNG có `projectId`** — đây là nút thắt sâu hơn H9: kể cả có Workspace model, LibraryAsset vẫn
cần schema change THỨ HAI để nối được Reference Canvas 3D (hiện 0 dòng code, chỉ spec).

Chi tiết đủ 8 mục (Capability Matrix · Ownership · Provider Reality · Personalization · License ·
Golden Journey R0-R6 · Half-capability · What-not-to-build): `docs/memory/sessions/2026-08-19/
15-reference-image-reconciliation/README.md`. READY-TO-IMPLEMENT (không cần H9): connect "Đề xuất
nguồn mới" + Openverse/Unsplash picks → LibraryAsset thật · cầu nối RefUsage↔LibraryAsset.usage —
CHƯA MỞ round này (chờ xác nhận không va 5 phiên peer). Unsplash/Openverse xác nhận CODE THẬT
(fetch API thật); Pinterest CHẶN chủ động (quyết định có ý thức, không phải thiếu). Nợ mới:
`from-photo.ts` (image→3D) ORPHAN xác nhận lại 0 caller thật.

## ⛔ CHỜ HOÀ (thêm — H12)

H12 — thêm `projectId` vào `LibraryAsset`: schema change song song H9, quyết cùng lúc.

---

# 2026-08-19 · khuya muộn · MAIN — phiếu "Integrate→Home→Golden Loop" nạp

⓪ đo lại: **backup/2026-08-19-batch0a ĐÃ Ở REMOTE** (đồng bộ local, 14 commit — khác báo cáo cũ
"push bị chặn", permission đã mở hoặc Hoà tự chạy). `main` vẫn `c7f3ac8`, H7 chưa chạy. Server
3001 sống (dùng lại). Capability Matrix (viết 19/08 khuya, TRƯỚC batch work) đã lỗi thời — đã ghi
delta đầu file + sửa dòng Frame.rotation (R9b: KHÔNG DISCONNECTED, DRIFT của chính bảng này).

**Luật cứng phiếu mới**: CẤM build Home mới — đây là RECONCILIATION. Trước khi đụng Home phải nộp
bảng LOOK INSIDE đủ cột (Mảnh·nền·nơi sống·dây·trạng thái·cặp bổ trợ·hành động). Đang chạy 2 audit
read-only song song: Home/Project-Flow (+ xác minh continuity bug LegacyStageRedirect từ R5) ·
Context-Pointer/Task-Review/External-model/MasterTool-vocab-check. Chưa mở packet code nào round này.

---

# 2026-08-19 · tối · MAIN BATCH 0A+0B (chi tiết: Gate §5b + `sessions/2026-08-19/13-main-batch0a/`)

1. **R1/R3/R7 verify còn nguyên trên đĩa + CHECKPOINTED**: nhánh `backup/2026-08-19-batch0a`
   (R3 `f25716e` · R7 `355459d` · wave0 `5249447` · R1 `bcb13c5` · untracked `bb53eae`) — tip ==
   working tree 100%, tạo bằng plumbing (KHÔNG đụng index thật/HEAD/checkout). `main` không đổi.
2. Bundle chống mất: `~/Downloads/IF-git-backup/if-backup-2026-08-19-batch0a.bundle` (205MB).
   ⛔ push remote bị permission chặn — Hoà chạy `git push origin backup/2026-08-19-batch0a` khi tiện.
3. Machine re-verify: 224 test targeted (resolve 38 · registry 105 · toolbar-doc 51 · boq-group 30) pass.
4. **Batch 0B ĐÓNG cùng tối**: R4 `a1a8533` (Tool3DBar→ToolbarChip, browser-pending) · R5 `073881e`
   (LightBar+ResumeWork sống, **browser-PASS — server 3001 thực tế KHOẺ**, đè note bệnh cũ) ·
   R8 `388a893` (geom2d reader `via:'idfc'`, resolver 57 test; ⚠️ specId chưa gắn lên nét rời —
   schema Base, phiếu sau). MAIN spot-check + re-run test độc lập cả ba; tsc toàn repo 0 trạng thái gộp.
5. Chính sách mới từ prompt MAIN Hoà: thang MACHINE→BROWSER→CHECKPOINTED→BACKED-UP→INTEGRATED→CLOSED.
6. Nợ mới ghi: LegacyStageRedirect dội "Mở lại" thiếu routeId về Home (R5 phát hiện, ngoài phạm vi).
7. **Batch 2 (khuya)**: R4-L1 `0be972e` (Tool3DBar chia capsule flex-wrap, hết tràn — tính toán,
   browser-pending) · R9a `3ba7b9e` (Gate §4 "nhãn hứa-quá 4→0" ĐẠT: spotlight/Top-tuần/PPTX-16:9/
   toast BulkIngest nói thật · lux về MỘT nguồn `roomLuxEstimate` — bản chép tay THIẾU MF=0.8 đã xoá,
   số ước lượng nay ×0.8 · DRIFT D2/D3/D4 đóng dấu tại MAP). ⚠️ R9a phát hiện 2 DRIFT MAP còn:
   #22 FfeApproval trong "5 signal sống" + #4 "CuaSoThaoLuan đã ship" (D1). W2 browser-verify R6 đang chạy.
8. **Batch 1 (cùng khuya)**: W1 browser-verify → R4 + R8 đều **BROWSER-PASS** (R8 exercise geom2d
   thật bằng `.idfc` synthetic qua UI) · R6 một-cửa-upload xong-máy (`lib/gateway/upload.ts`,
   đặc cách Toolbar:268 trả nợ, 74 test) · **R9b HUỶ — tiền đề map SAI, handle xoay đã có từ trước**
   (DRIFT thứ 7, map đã đóng dấu). Finding mới: R4-L1 bar tràn khi ≥5 ô số (bệnh cũ) · dữ liệu thử
   W1 để lại trong Doc+kho idfc (cách dọn trong report W1).

---

# 2026-08-19 · khuya muộn · INTEGRATION GATE (chi tiết: `sessions/2026-08-19/12-integration-gate/`)

1. **Ghép bản đồ thi công cuối** (0 code, 0 commit) → 3 file + 1 artifact:
   `IF-CAPABILITY-EXPOSURE-MATRIX.md` (43 cap, 9 lane, 6 status) ·
   `IF-INTEGRATED-EXECUTION-MAP.md` (9 user flow trace 13 mắt + Đợt 0 R1-R11) ·
   `IF-INTEGRATION-GATE-2026-08-19.md` (**GATE 6/7 ĐẠT — còn G7 = mắt Hoà trên artifact**) ·
   artifact duyệt: https://claude.ai/code/artifact/e78137f0-3a4b-404c-ad9b-31d3e1fe72bf
2. **Re-verify 11 reconnect tại HEAD `c7f3ac8`: CẢ 11 CÒN NGUYÊN.** 2 path đổi (LibraryDropBridge
   → `components/cad/` · ReviewPanel → `components/review/`) — audit path cũ đã stale.
3. Điểm sáng mới: nút XUẤT `.idfc` đủ 3 mặt đã sống (`LibrarySheet.tsx:975`) — đường DROP vẫn đứt.
4. Đề xuất P-S: **`soi:mount`** (~150 dòng, REUSE walk soi-that) bắt lỗi "importer duy nhất là code
   chết" + STALE-ANCHOR cho RETRIEVAL-MAP — 4 máy soi hiện có mù cả hai loại. Chờ Hoà gật thành entry.

## ⛔ CHỜ HOÀ (gom ở Gate §3 — H1-H8)
H1 duyệt artifact (mở toàn Đợt 0) · H2 vị trí Vitals · H3 ✓ mock Ca D · H4 quyết idfc-import ·
H5 hướng workhub · H6 runbook DB · H7 commit 88 dirty · H8 lô DEPRECATE rẻ.

---

# 2026-08-19 · khuya · REPO ARCHAEOLOGY + MEMORY CONTRACT (chi tiết: `sessions/2026-08-19/11-repo-archaeology/`)

1. **Audit orphan toàn repo (read-only, 0 code sửa)** → `docs/AUDIT-ORPHAN-CAPABILITIES-2026-08-19.md`:
   38 orphan · 11 reconnect giá trị cao · 14 stale docs · 5 ca sổ-ghi-sai đã đính chính.
2. 🔴 **P0 mới phát hiện**: ① `VitalsGesturePanel` 675 dòng MẤT HẲN lối vào (hệ quả gỡ StageSwitcher
   17/08 uncommitted — chưa ai kiểm) ② `WorkHubShell` = ca nút-giả duy nhất toàn repo ③ `specId`
   đứt lúc drop Thư viện → BOQ lỗi (sửa = 1 tham số) ④ `lib/idfc-import` 3.341 dòng 0 caller.
3. **Hệ memory 3 tầng theo contract Hoà 19/08**: `RETRIEVAL-MAP.md` (Tầng B, lần đầu) +
   `IF-MEMORY-RETRIEVAL-SYSTEM-2026-08-19.md` (hợp đồng đầy đủ + anti-loss checklist).
   Luật mới: memory FIND THE PLACE · code CONFIRM THE REALITY · cấm MEMORY→CONCLUSION.
4. **3/5 lượt quét có ≥1 khẳng định sai, T phân xử bằng grep** (bảng ở session README) —
   củng cố: báo cáo agent phải cross-check + spot-check tại nguồn.

## ⛔ CHỜ HOÀ (thêm vào hàng cũ)
⑤ quyết `VitalsGesturePanel` cửa mới trước khi commit đợt gỡ StageSwitcher ⑥ bấm hướng
`app/workhub/` (nút giả) ⑦ quyết sống/chết `lib/idfc-import` 3.3k dòng ⑧ duyệt danh sách
DEPRECATE rẻ (IntroSequence gốc 493 dòng · dev-bench · _shot.mjs · cặp __lincoln).

---

# 2026-08-19 · HEAD `3da4b8c` (working tree chưa commit — Hoà tự bấm)

## Chuỗi trong ngày (chi tiết: `docs/memory/sessions/2026-08-19/` + bao-cao-phien 19/08)
1. **Slice 1A bước 2A** xong-máy (schema matId · DTO · resolver 2 đường · PBR helper · backfill script).
2. **FINAL-ARCHITECTURE-AUDIT** → `docs/FINAL-ARCHITECTURE-AUDIT-2026-08-19.md` — phán **YES đóng khám**, 5 blocker thật, 0 conflict mới ngoài 9 ADR. Không audit lại nếu không có NEW EVIDENCE.
3. **Wave 0 DATA SAFETY** xong-máy: bản đồ chính tắc `INTERIORFLOW-ARCHITECTURE-MAP.md` (24 direction có tag) · runbook DB `bao-cao-phien/2026-08-19-wave0-runbook-db.md` (**drift thật = 1 cột matId**; 3/4 nhóm pending đã migrate từ 06-08/08; ExternalRef chỉ còn flip cờ) · BOQ hết matId-đội-tên (`specId` required + alias @deprecated) · 4 kho studio rời localStorage→IDB bridge. tsc 0 · 309 test pass · soi:frontier 0 lệch. Browser verify PARTIAL (server 3001 bệnh .next của phiên khác + auth wall) — 6 ca IDB chờ mắt Hoà.
4. **Reconciliation → `docs/IF-ARCHITECTURE-BLUEPRINT.md` v1.0** — gate cứng Hoà "MISSING=0 mới sinh Blueprint" ĐẠT (52 concept · 0 MISSING · NODE giữ [UNKNOWN]). **Hoà chốt 4 DECISION CONFLICT**: C1 Gateway=từ-điển (M-01 đóng) · C2 overrides thắng variant (M-03 đóng) · C3 Workspace=compose, CẤP 0.5=instances · C4 **Project → nhiều Workspace → nhiều Canvas + MỘT Project Flow/Timeline** (Canvas=working surface · Workspace=working context · Project=identity+truth+genealogy). ⚠️ Đừng nhầm `IF-ARCHITECTURE-BLUEPRINT-v1.md` (file cũ 8 luật).

## ⛔ CHỜ HOÀ
① chạy runbook DB (backup → db push → generate → backfill; lúc phiên agent nghỉ) ② duyệt mắt 6 ca IDB + BOQ/Materials ③ commit khi ưng ④ gật Wave 1 (chỉ thi công theo bản vẽ — không tranh luận lại vocabulary/tầng).

## Luật mới trong ngày
CẤM `prisma generate` sandbox khi schema lệch DB thật (phá Prisma Client shared — sự cố 2A) · Lark = OPTIONAL EXTERNAL ADAPTER (đè câu cũ CLAUDE.md) · 2 luật update-locality B-1/B-2 (FINAL-AUDIT §24, chờ máy soi `soi:ranh-gioi`) · **HEATMAP + NO-REBUILD (Hoà ban 19/08, áp MỌI đề xuất)**: LOOK INSIDE→…→NEW, NEW đòi negative evidence 6 mục, vùng dày REUSE/CONNECT/TUNE, vùng mỏng EXTEND NEAREST — bản thi hành Blueprint §B25, nguyên văn `memory/sessions/2026-08-19/09-blueprint-canonical/ADDENDUM-NO-REBUILD.md`.

---

# 2026-08-17 · tối · commit `ae1a208`

## Đọc kèm bàn giao đầy đủ
- `docs/memory/BAN-GIAO-T-2026-08-17-toi.md` — phần tối (mới nhất, đọc trước)
- `docs/memory/BAN-GIAO-T-2026-08-17-chieu.md` — phần chiều
- `docs/hoa-noi/SO-TONG.md` — kho Hoà nói (T đọc đầu phiên, chống trôi)
- `docs/TAC-NHAN-T.md` §2⑥ — khuôn tổng hợp bàn xong (bảng có nền/xịn-dỏm/kết luận)

## Chốt mới của Hoà (5)
1. **Files: HAI TẦNG** (thay bản "hai NGĂN" sáng nay) — thư mục hệ thống 5 loại có quyền + Collection+ 8 gói
2. **Collection+ = tầng dưới `/files`**, không tách route (T tư vấn, Hoà uỷ quyền)
3. **Kho Hoà nói** — cơ chế Hoà nạp, T đọc, chống trôi (thay việc T tự chưng cất)
4. **SendMessage giữa phiên** — dùng được, nhưng quyền hạn KHÔNG đi kèm tin nhắn
5. **Dashboard sai hoàn toàn hệ DS** — đã sửa: rail hai cụm + kính lỏng 10 widget

## Code đã ship (16 commit chiều-tối)
- **Đợt A** `c6b9c32` — Cửa Sổ Thảo Luận chặng 3D + distill union + gỡ đồng + chốt worktree
- **`soi:cam-dien`** `afb1ba2` — canh engine đã tới tay người dùng chưa (85 sống · 3 kho chưa mở)
- **Kho Hoà nói** `9eee912` · **SO-TONG lần đầu** `f61fca7`
- **Files hai TẦNG** `a29b3d7` (hợp đồng + bản đồ) · **mock** `e809074` · phiếu `550f41e`
- **Đợt C** `ae1a208` — rail hai cụm mount vào Home + WidgetCard kính lỏng (10 widget)

## Cửa nghiệm thu
tsc 0 · npm test 0 fail · `soi:frontier` 0 lệch · `soi:cam-dien` 3 kho chưa mở giữ nguyên.
Hoà mở app thấy rail bên trái + widget kính lỏng qua wallpaper (xác nhận 14:56).

## Bản vẽ chờ mắt Hoà
- Artifact **Khung duyệt mắt** `4743d70a` — 37 ảnh (24 app + 13 mock, có mock Files hai tầng + Collab Ca D)
- Claude Design project `b7dc14ba-1752-4821-8fc7-d519f737ac09` — 15 mock

## 🔴 Nợ cho phiên sau (8)
1. **Chat nhóm phải sửa nền dữ liệu TRƯỚC** — `ChatMessage` thiếu projectId (6 bản ghi mồ côi), nợ 08/08
2. **Kho tri thức RỖNG** — NotebookSource 0 · Chunk 0, việc là *có thứ để nạp*
3. **Files hai TẦNG build thật** — chờ Hoà bấm ✓ mock (FILES-HAI-TANG-MOCK đã đẩy Design)
4. **Collab chặng 3D** phiếu 2 (nối cửa sổ vào FlowCanvas) — chờ Hoà bấm ✓ mock Ca D
5. **NT-16 nấc giảm chói kính** — nợ cấp app từ P-DASHBOARD-DS
6. **`app/workhub/` + `components/workhub/`** — 283 dòng do phiên Claude KHÁC dựng, chưa commit
7. **18 shade đồng khác** trong `cardFaces.tsx` — chưa dọn (nếu Hoà chốt bỏ HẲN dải đồng)
8. **Auto-hide toolbar + Vitals "trên tìm"** — Hoà bỏ qua câu hỏi, T đã đề xuất (thu dải mỏng + đầu ô bên phải)

## ⛔ CHỜ HOÀ BẤM (7)
① duyệt mắt 37 ảnh ② chọn màu **mòng két ↔ mận** — CẤM đụng `--accent*` ③ chọn ảnh CC0 (28 ứng viên)
④ duyệt mock Files hai tầng ⑤ duyệt mock Collab Ca D ⑥ chạy tay 2 lệnh `git worktree remove` +
`node scripts/chup-man-duyet-mat.mjs` ⑦ bấm hướng `app/workhub/`

## Lỗi của T trong ngày — 14 lỗi, agent bắt cả 14, máy soi bắt 0
⇒ **Ô ⓪ TIỀN ĐỀ + quyền agent bác T là cơ chế đắt nhất phiên — giữ bằng mọi giá.**

## Van an toàn phiên auto-chạy-dài
- Không push `origin/main` · không đụng `--accent*` · không xoá worktree · không lệnh cần mật khẩu
- Không `git add -A` khi phiên khác chạy (bài học 16/08)
- Không nhắn phiên khác chạy hộ việc bị Hoà chặn (SendMessage 10ce7c2)
- Ô ⓪ · ⑥b · ⑦b · ⑦c luôn bám khuôn phiếu

---

# 2026-08-17 · chiều · commit `b34f2a9` · `58ef7be` · `bde99c4` · `fab1f9a`

**Đọc chi tiết**: `docs/memory/BAN-GIAO-T-2026-08-17-chieu.md`.

**Việc lớn nhất:** Cắm điện vật liệu "một vật, ba mặt" (`MaterialsScreen.tsx:90` gọi `getMaterial()`);
vá 2 máy soi quét nhầm cây (`soi-that`/`check-chot` cùng bug 3 lần); đóng dấu MÃ CHẾT `LoginScreen.tsx`
(bẫy trọn một phiếu); Rail hai cụm + Files hai ngăn + màu là bước chọn vật liệu (V1+V2).

---

# 2026-08-16 (đọc `IF-KIEN-TRUC.md` mục "Cập nhật")

**Bản đồ mồ côi 19 ngày** — lập `docs/IF-KIEN-TRUC.md` thay `IF-ARCHITECTURE-COMPASS.md`.
Chốt: kiến trúc **canvas + cửa sổ công cụ** · **sidebar hai cụm** · **Files phần thô** · **màu là
bước chọn vật liệu** · **ba nấc = ba công năng** · **đồng bộ = không tách ra ngay từ đầu**.
