> 🔴 **ĐÂY KHÔNG CÒN LÀ CỬA VÀO** (đóng dấu 23/08).
> Cửa vào duy nhất: **`CLAUDE.md` → BỘ NẠP → `docs/control/`**.
> · hiện trạng → `docs/control/IF-CURRENT-STATE.md`
> · luật bền → `docs/control/IF-CANONICAL.md`
> · sai lầm đã trả giá → `docs/control/IF-UXUI-OPERATING-MEMORY.md`
> · năng lực thật → `docs/control/IF-TOOLING-RECEIPT.md`
>
> **Vì sao có dấu này:** hai bài kiểm khởi động nguội 23/08 đều **KHÔNG** mở tệp nào trong
> `docs/control/`. Cả hai đi vào đây trước, vì mỗi tệp dưới đây từng tự xưng là điểm bắt đầu.
> Phiên nguội tự tổng kết đúng bệnh: *"hai đường đọc chồng nhau, không nói rõ cái nào thắng."*
> Nhiều cửa vào cùng mở = không có cửa vào nào. Nội dung dưới GIỮ NGUYÊN làm dấu vết.

> ⚠️ Riêng tệp này còn **nói dối về chính mình**: tự xưng *"bản nén phiên gần nhất"* nhưng sửa
> lần cuối **22/08 01:37**, chỉ biết tới phiên 02 — trong khi ngày 22/08 đã có **21 phiên**.
> Đọc đúng theo nó là **mất trắng 19 phiên**. Cùng cơ chế đã giết `IF-ARCHITECTURE-COMPASS`.

# LATEST — bản nén trí nhớ bối cảnh IF (ghi đè mỗi phiên lớn)

## ⭐ ĐANG CHẠY: CHIẾN DỊCH HOÀN TẤT IF (22/08) — ĐỌC CÁI NÀY TRƯỚC

**Con trỏ chiến dịch:** `docs/memory/sessions/2026-08-22/01-master-completion/README.md`
**Báo cáo phiên mới nhất:** `docs/memory/sessions/2026-08-22/02-session-01-ui/README.md`

- WAVE: SESSION-01 · UI — 3D XONG (13→7 chip), Home + 2D CÒN DỞ (chờ Hoà duyệt mắt bản vẽ)
- 🔴 CHƯA COMMIT: `git symbolic-ref`/`reset` bị classifier chặn; đổi thay nguyên vẹn trên đĩa,
  2 lệnh cho Hoà nằm cuối báo cáo phiên 02
- ⚠️ Nhãn HEAD sai (trỏ `main`), nội dung đĩa = `backup/2026-08-19-batch0a` — đã xác minh md5
- ĐỪNG LÀM LẠI: Vitals mép trên ĐÃ XONG (`VitalsAperture`, `AppChrome.tsx:376`) — phiếu
  SESSION-01 điều 2 lỗi thời; `VitalsPill` default export nay mồ côi
- Home ↔ Project Overview: KHÔNG có module trùng; `components/Dashboard.tsx` = MERGE, không xoá
- BA LANE (Hoà chốt tách 22/08): MAIN (kiến trúc/state/route) · CLAUDE DESIGN (bố cục/chữ/nhịp)
  · VISUAL INTERACTION SYSTEMS (vật liệu/hover/ánh sáng cục bộ/viền chạy) — KHÔNG trộn lane
- IA rail 22/08: BA ĐẢO · "Dự án" = sổ TOÀN CỤC `/projects` · đảo DỰ ÁN mang TÊN DỰ ÁN THẬT
- 🔴 Hoà BÁC sidebar hiện tại ("generic như Notion/Linear") — ba nấc 52/240/320 ĐÃ ĐÚNG, đây là
  bài toán XỬ LÝ THỊ GIÁC, đừng dựng lại kiến trúc nấc
- BLOCKER THẬT: commit/push · ghi DB (S05) · Hoà duyệt mắt (S01) · test điện thoại LAN (S06)

> Luật giữ bản nén: **CHỈ tên + đường dẫn + một câu. Cấm chép nội dung.**

> **Đọc file này ĐẦU TIÊN**, rồi **`docs/memory/RETRIEVAL-MAP.md`** (chỉ mục 11 topic → nguồn sâu, lập 19/08), rồi **`docs/INTERIORFLOW-ARCHITECTURE-MAP.md`** (bản đồ chính tắc 19/08 — thay `IF-KIEN-TRUC.md`), rồi **`docs/TAC-NHAN-T.md`** (vai T).
> Luật giữ bản nén: **CHỈ tên + đường dẫn + một câu. Cấm chép nội dung.**

**Cập nhật lần cuối: 2026-08-20 ~03:1x (MAIN — UI ProjectFile→Promote LÊN MÀN + thiết kế hash chờ Hoà)**

## ✅ CHUỖI REFERENCE ĐỦ MẶT NGƯỜI DÙNG (20/08, `922af7e`)
UI trên /files: upload → xem/xác nhận → promote chọn usage → asset hiện ngay trong LibrarySheet
(event `if:library-db-refresh` → refreshDb sẵn có) → bấm lại daCo không nhân bản → 415 hiện nguyên
văn. Browser thật cả chuỗi + dọn sạch (LA 1613=1613). Drift-guard test khoá vocabulary client≡server.
⚠️ POST /api/project-files nhận **JSON {dataUrl|url}**, KHÔNG multipart — phiếu cũ mô tả sai, code thắng.
## 🔶 CHỜ HOÀ DUYỆT: thiết kế hash/dedupe (`edeb759`, `sessions/2026-08-20/04-hash-dedupe-design/`)
5 câu đã trả lời bằng đo tại nguồn; đề xuất contentHash? nullable + @@index([userId,contentHash]),
dedupe app-level tại cửa nhập, UNIQUE nhiều khả năng không bao giờ thêm (trùng-bytes-khác-license
là ca hợp lệ; kho ĐÃ có trùng thật ×7 Westlake ⇒ UNIQUE mù fail lúc backfill).

## 🌙 NIGHT SHIFT 20/08 ĐÓNG — 5 checkpoint, backup tip `5bc0996` (push rồi), main nguyên `c7f3ac8`
Chi tiết + bảng DONE/PARTIAL + nợ mở: `sessions/2026-08-20/03-night-shift-4-lane/README.md`.
- **B** `a25bb46`: `POST/GET/DELETE /api/project-files` + `lib/server/promote.ts` — Promote sinh
  LibraryAsset (KHÔNG projectId) + ProjectAssetUsage trong transaction, idempotent qua tag
  `nguon:projectfile:<id>`, không copy file. 16/16 test DB thật. 🔴 dedupe hash cần cột schema (phiếu riêng).
- **C** `37a596e`: Home — Ghi chú nhanh bị nghiến 12,3px (R5 chồng 2 widget 1 ô) → tách ô, MAIN verify browser.
- **D** `5b8f21c`: Golden Loop browser PASS trọn chuỗi; sửa **D2 P0 fake-success** (lớp phủ bàn-trống
  nuốt click đầu khi đã bật tool vẽ — nay chỉ hiện khi tool='select'; MAIN accept sống: W→2click→Enter
  ra tường lần đầu) + D1 hint sai phím + D3 12 nút 3D disabled câm → aria-disabled/describedby.
- **MAIN** `eb43791`: D5 WeeklyImage onError (asset 410 hết khung vỡ, widget tự ẩn) · D6 nút Lưu
  QuickNotes lý do focusable + token `--mo-vo-hieu` · D7 Checkpoint key trùng "Số chỗ".
- **D4** `5bc0996`: selection ma KHÔNG phải do undo — cơ chế thật là `removeLayer` (mutation duy nhất
  xoá entity không dọn selection, `store.ts:747`); fix gốc + defense `aliveSelection` ở CadStageScreen.
Cuối ca: `npm test` EXIT=0 (~9000 ok) · tsc 0 · soi:frontier 0 lệch · không rác dữ liệu thử.
Nợ mở: dedupe-hash schema (human gate) · upload v0 chỉ ảnh+PDF · D8 ToolDock3D title-câm ·
dọn LibraryAsset ảnh chết 410 · a11y mới kiểm mức DOM attr.

**(bản cũ bên dưới, 20/08 rạng sáng: H6 đóng + mở chuỗi ProjectAssetUsage)**

## H6 ĐÓNG — DB THẬT ĐÃ ĐỔI (20/08, đè mọi ghi chú "chờ push" cũ)
`db push`+`generate`+backfill đã chạy thật (Hoà chạy, MAIN verify độc lập bằng Prisma Client thật,
không tin lời). `ProductSpec.matId` (2 hàng kind=material có UUID) · `ProjectFile` · `ProjectAssetUsage`
đều sống trong `dev.db` thật. `EXTERNAL_REF_TABLE_READY` đã flip `true`. npm test + soi:frontier
sạch. **Một sự cố thật đã xảy ra và đã gỡ**: generate chạy trước lúc DB chưa push → mismatch phá
runtime `ProductSpec` cho MỌI phiên — MAIN bắt bằng query Prisma thật, không phải đoán; Hoà chạy
push ngay sau, hết mismatch (đã verify lại bằng query thật lần 2).

## ✅ REFERENCE N-N = LIVE END-TO-END (20/08, `9d3d37f`) — không còn chỉ "API verified"
Người dùng **bấm nút thật** → relation thật. Golden Journey 10/10 checkpoint browser :3001:
attach A → where-used A → **cùng asset** sang B → where-used A+B → LibraryAsset **không nhân bản**
(giữ 1613) → reopen persist → bấm lại khi đã gắn = 409 không nhân bản → remove A: asset + B sống.
Chi tiết: `sessions/2026-08-20/01-golden-journey-asset-nn/` (API) + `02-reference-ui-golden-journey/` (UI).

⚠️ **Bài học MAIN**: từng báo sai "nút Dùng cho dự án này không xuất hiện" — thật ra nút ở
y=1169px NGOÀI viewport 900px (screenshot cắt) + lúc đó server còn 503. `dbAssetIdOf`/identity/
context ĐỀU ĐÚNG, không có gì phải sửa. "Lincoln 327" là LibraryAsset DB thật, không phải hardcoded.
⇒ Luật: **kết luận "UI thiếu X" phải dựa runtime evidence (fiber/DOM), không dựa screenshot**.

**Bug UX thật đã sửa** (do bước REOPEN lộ ra): nút nói sai trạng thái sau reload → nay pre-fetch
bằng REUSE hook `useAssetWhereUsed` (1 request nuôi 2 nơi, không API/store mới) + `da-gan-du-an.ts`
7 test. 3 trạng thái không cái nào nói dối (đang tra / sự thật DB / lỗi thì lùi hành vi cũ).

**39 commit trên backup, remote sync. `main` vẫn `c7f3ac8`.** Thứ tự kế tiếp (Hoà chốt):
A. ProjectFile→Promote→LibraryAsset · B. provenance/source/license visibility · C. usage/context
sâu hơn · D. personalization/ranking · E. UX polish.

## AUTHORITATIVE — Reference/Asset contract (Hoà chốt, đè mọi bản cũ mâu thuẫn)
`ProjectFile` = raw project-owned input (1-N) · `LibraryAsset` = reusable understood asset, KHÔNG
projectId trực tiếp, dùng được bởi nhiều Project · `ProjectAssetUsage` = relation N-N (schema đã
thêm text-only, chờ push) · `LibraryAsset.usage` = phân loại generic/default, KHÔNG deprecate ·
`ProjectAssetUsage.usage` = cách project cụ thể dùng, REUSE cùng vocabulary · Q5/Promote = checkpoint
nối raw→reusable. Bản spec 15/16 cũ nào mâu thuẫn điểm này → SUPERSEDED, đọc A0/A1/C2 của 16 làm chuẩn.

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

> **Đọc file này ĐẦU TIÊN**, rồi **`docs/coordination/IF-LIVE-BRIDGE.md`** (tóm tắt sống nhất,
> MAIN↔ChatGPT), rồi `docs/memory/sessions/2026-08-20/09-main-parallel-waves-handoff/README.md`
> (chi tiết đầy đủ phiên vừa xong), rồi `docs/INTERIORFLOW-ARCHITECTURE-MAP.md` nếu cần bối cảnh
> kiến trúc xa hơn. Luật giữ bản nén: **CHỈ tên + đường dẫn + một câu. Cấm chép nội dung.**

**Cập nhật lần cuối: 2026-08-20 đêm khuya (MAIN — 3 wave song song + UX pass + sửa bug generation THẬT)**

## ⭐ ĐỌC NGAY: `docs/coordination/IF-LIVE-BRIDGE.md` — tóm tắt LIVE/PARTIAL/MISSING mới nhất
File đó là nguồn sự thật sống, cập nhật liên tục trong phiên. File này chỉ trỏ đường.

## Git — backup/2026-08-19-batch0a tip `2d7b962` (đã push), main `2dfed16` CHƯA nhập
8 checkpoint tuần tự trong phiên (mới→cũ): `2d7b962` sửa timeout+lỗi dịch generation ·
`7418ac8` UX Coherence Pass (3 lane) · `f3e6d89` login color+chẩn ComfyUI · `a3ff86a` Demo Spine
Wave 3 · `7e1001b` Wave 2 (3D+Files) · `4a8801d` Wave 1 (2D+Home+Activity) · `1824ddd` CommandLine
quiet · `9a3934e` tip cũ phiên trước.

## Hạ tầng đang chạy lúc bàn giao (đo lại, không phải suy đoán)
- App dev server :3001 (PID mới sau restart giữa phiên), tsc 0.
- **ComfyUI THẬT chạy 127.0.0.1:8188** (PID 18339, khởi trực tiếp `main.py`, KHÔNG qua Comfy
  Desktop.app — app đó treo vô hạn). Model SDXL+ControlNet khôi phục bằng SYMLINK từ bản cài
  ComfyUI khác trên cùng máy — đã CHẠY THẬT 2 job generation thành công (22-25 phút/lượt nguội).
- Migration `ProjectFile.reviewState` **CHƯA CHẠY** — backup DB sẵn
  (`prisma/dev.db.bak-20260820-pre-review-migration`), lệnh chờ Hoà:
  `npx prisma migrate dev --name add_project_file_review_state`.

## Việc lớn nhất phiên — SỬA BUG GENERATION THẬT (không phải env/infra)
`lib/ai/client.ts` timeout 3 phút quá ngắn cho ComfyUI tự-host (lượt nguội thật mất 22-25 phút) +
`lib/execution.ts` dịch nhầm lỗi timeout thành "backend chưa chạy" — ĐÃ SỬA + RE-TEST SỐNG THÀNH
CÔNG (ảnh thật 960×640 trả về UI). Chi tiết đầy đủ: session `09-main-parallel-waves-handoff`.

## Phát hiện mới CHƯA XỬ — P0 tiếp theo
**Controlled Edit là vỏ không ruột**: 7 lệnh chỉnh sửa ảnh (Chọn thông minh/Co giãn vùng/Thêm
lớp/Gộp lớp/Chế độ hoà/Đường cong/Cân trắng) đều hiện đúng UI nhưng cùng title "chưa nối bộ thi
hành" — 0 lệnh chạy được. Xem mục 4+7 của README phiên 09.

## Câu hỏi còn ngỏ
Route-bounce/auto-redirect-to-Home: KHÔNG tái hiện suốt ~45 phút clean-window (0 lane song song)
— nghiêng "nhiễu đa-agent lúc hot-save" nhưng CHƯA đóng hẳn, cần 1 lượt dùng thật (không phải
đứng yên) mới kết luận.

## Bài học đắt nhất phiên (đừng lặp lại)
`GIT_INDEX_FILE=/tmp/x_$$` PHẢI ở CÙNG một lệnh Bash với `git write-tree` dùng nó — tách 2 lệnh
Bash riêng thì `$$` đổi PID, index rỗng, suýt push commit TREE RỖNG lên remote (đã xảy ra thật 1
lần, force-fix ngay). Mọi checkpoint sau đều guard `git ls-tree | wc -l` ≥ 2000 trước khi commit.

---
### Lịch sử ngày 20/08 trước phiên này (đã nén, không mở lại trừ khi cần)
`sessions/2026-08-20/01-golden-journey-asset-nn/` · `02-reference-ui-golden-journey/` ·
`03-night-shift-4-lane/` (backup tip cũ `5bc0996`, đã supersede) · `04-hash-dedupe-design/` ·
`05-hash-schema-va-don-rac/` · `06-manufacturer-idfc-import/` ·
`07-ban-giao-main/` (2 lane chết dở — ĐÃ hoàn tất/checkpoint trong phiên 08-09) ·
`08-truth-map-ux-study/` (truth map + UX study ban đầu, dẫn tới toàn bộ 3-wave plan).
