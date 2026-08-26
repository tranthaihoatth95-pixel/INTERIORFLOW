# 15 · Reference/Image Intelligence Reconciliation — 19/08 khuya muộn

> Phiếu nạp: "End-to-End Project Loop + Reference/Image Intelligence Reconciliation". ⓪ đo lại:
> reality khớp 100% (HEAD `c7f3ac8`/main, backup tip `d825e8f` local=remote, 16 commit ahead main).
> **5 phiên peer sống song song** (UX/UI · Execution · GUARDIAN · interiorflow-93 · tranben-12) —
> phạm vi họ không rõ ⇒ round này CHỈ audit read-only (an toàn tuyệt đối), hoãn packet ghi-file.
> Hai audit Explore chạy song song, MAIN spot-check 8 claim trọng yếu — khớp 100%.

## KẾT LUẬN MỘT CÂU

**Ảnh reference ở IF hiện là BỐN HÒN ĐẢO không nói chuyện với nhau, và hòn đảo bền vững nhất
(`LibraryAsset`) không biết dự án nào đang dùng nó.** Đây không phải nợ nhỏ — nó là lý do
Reference Canvas 3D (spec 4 cấp tin cậy) chưa thể code: không có gì để "canvas" lên, vì ảnh
không mang theo project context để hiện đúng chỗ.

## A · REFERENCE CAPABILITY MATRIX (gộp cả 2 audit, đã spot-check)

| Capability | Primitive | State | Owner | Action |
|---|---|---|---|---|
| Kho ảnh bền duy nhất (`LibraryAsset`) | `schema.prisma:278-314` | LIVE (hẹp) | **USER, KHÔNG projectId** | REUSE thận trọng |
| Binary storage (`./uploads/`) | `app/api/library/route.ts:73-92` | LIVE | filesystem local | REUSE |
| Gallery liên ngành | `lib/library/gallery-data.ts:72` | LIVE — mặt tiền tuyển chọn TRÊN CÙNG LibraryAsset | đọc lại | REUSE |
| "Đề xuất nguồn mới" (Gallery) | `gallery-local-state.ts:19-53` | DISCONNECTED — localStorage riêng máy, KHÔNG ghi LibraryAsset | máy | CONNECT |
| Reference Ingest (`/library/ingest`) | `lib/refingest.ts` `RefManifest` | LIVE nhưng **IndexedDB riêng, KHÔNG phải LibraryAsset, KHÔNG projectId thật** (`project: string` là text tự do) — "ảnh gốc KHÔNG lưu đâu cả" (comment tự khai, `:156-159`) | studio/máy | ghi nhận, đừng nhầm với Thư viện |
| Openverse/Unsplash "Pick hình" | `app/library/ingest/page.tsx` `pickIllustrations()` | DEAD-END — chỉ React state, 0 nơi lưu | — | CONNECT nếu muốn dùng thật |
| Files ngăn ① (Tệp dự án) | `lib/filemanager/types.ts` | PARTIAL/SPEC-ONLY — 0 Prisma model, thumbnail giả | client-side | NEW nếu cần thật |
| `lib/ref-search.ts` | — | LIVE, xác nhận lại: lexical thuần, KHÔNG embedding | — | REUSE |
| Reference Canvas 3D | — | **SPEC-ONLY — 0 dòng code** (chỉ `SPEC-REFERENCE-CANVAS-3D-2026-08-11.md`) | — | NEW (chưa 1 dòng) |
| `ExternalRef` | `schema.prisma:602-635` | LIVE nhưng **chưa từng dùng cho ảnh** (chỉ task/project/person) | — | INTENTIONAL-HEADLESS với domain ảnh |
| `ProductSpec.imageAssetId` | `schema.prisma:408` | PARTIAL — FK mềm 1 chiều, không where-used ngược | — | EXTEND nếu cần |
| DistillEngine (lõi thuần) | `lib/distill/engine.ts:32` | LIVE | — | REUSE |
| Project DNA distill | `lib/dna/distiller.ts:139` | LIVE nhưng **đọc metadata CŨ đã có sẵn trong LibraryAsset, KHÔNG tự phân tích ảnh mới**; đầu vào theo USER (LibraryAsset không projectId) | USER | REUSE |
| Image→3D (`from-photo.ts`) | `lib/idfc-import/from-photo.ts` | **ORPHAN xác nhận lại** — 0 caller runtime, 2 nơi "gọi" chỉ là comment nhắc tên (MAIN spot-check) | — | WAIT-HOÀ (đã có #11 Gate) |
| Metrology 1 ảnh | `lib/vision/single-view-metrology.ts` | LIVE, nhiều caller thật | offline, 0 credit | REUSE |
| idmask (median-cut, KHÔNG AI) | `lib/render-core/idmask-core.ts` | LIVE — xác nhận lại đúng | phiên node | REUSE |
| idmask→material candidate | — | TRUE-MISSING — palette node không nối vào kho vật liệu | — | (không đề xuất) |
| Grounded Render B3 (phiếu 4 cấp) | `lib/nodes/defs/grounded-render.ts` `ai.refsheet` | LIVE v0 | phiên node | REUSE |
| Grounded Render B1/B2/B4 | — | SPEC-ONLY (spec 6 bước, chỉ B3 code) | — | WAIT-H9/spec |
| PairwisePerceptron | `lib/gu/pairwise-perceptron.ts` | LIVE — học trên **lựa chọn template/layout**, KHÔNG phải ảnh thô | **USER** (per-account) | REUSE |
| Idea Board (CuaSoThaoLuan) | `components/collab/CuaSoThaoLuan.tsx` | ORPHAN chờ H3 (đã biết) — lưu ảnh theo USER, KHÔNG project | USER | WAIT-H9 (cần project context trước) |
| Pinterest | `lib/library/gallery-source-guard.ts` | **CHẶN chủ động** (runtime thật, không phải chưa làm) — quyết định có ý thức | — | REUSE (giữ chặn) |
| Unsplash | `app/api/stock-photos/route.ts` | **CODE THẬT** (fetch API thật, MAIN spot-check xác nhận) | — | REUSE |
| Openverse | `app/api/stock-photos/route.ts` | **CODE THẬT** | — | REUSE |
| Wikimedia/ArchDaily/OfficeSnapshots | — | KHÔNG TÌM THẤY / SPEC-ONLY | — | TRUE-MISSING |
| web-lookup | `lib/ai/web-lookup.ts` | ORPHAN (0 caller ngoài chính file) | — | INVESTIGATE (giữ, chờ màn Cài đặt — chốt cũ) |
| License gate tổng quát | — | **KHÔNG CÓ** — chỉ 1 domain bị chặn (Pinterest), cảnh báo Pantone/Dulux chỉ là COMMENT không phải runtime check | — | TRUE-MISSING |

## B · DATA OWNERSHIP

`LibraryAsset` = global theo **USER**, không theo Project, không theo Workspace. Mọi hệ đọc từ nó
(Gallery, DNA distill, PairwisePerceptron liên quan template) đều thừa hưởng giới hạn này. Đây
CHÍNH LÀ lý do sâu hơn của H9 (Workspace/Canvas): ngay cả khi có Workspace model, `LibraryAsset`
vẫn cần một cột `projectId` mới nối được — đây là **thay đổi schema thứ hai** cần Hoà quyết cùng lúc.

## C · PROVIDER REALITY

| Provider | Trạng thái |
|---|---|
| Unsplash | CODE THẬT, kèm đúng cơ chế ghi công (`download_location` ping) |
| Openverse | CODE THẬT, không cần key |
| Pinterest | CHẶN chủ động (ToS), có runtime guard thật |
| Wikimedia | KHÔNG TÌM THẤY |
| ArchDaily | SPEC-ONLY, 0 code |
| OfficeSnapshots | KHÔNG TÌM THẤY |

## D · PERSONALIZATION REALITY

Signal = cặp accepted/rejected trên **lựa chọn UI đã có sẵn** (template/layout), không phải ảnh
thô. Per-USER (không per-project). Threshold `minPairs=10` trước khi model cầm lái + margin=1
chống overfit từng click. Persistence: localStorage + Prisma sync fire-and-forget. Có giải thích
"vì sao hợp" (`explainLayoutOption`). Có negative signal (cấu trúc pairwise tự nhiên). **KHÔNG có
correction signal tinh** — chỉ export/import ghi đè toàn bộ, không sửa 1 điểm học sai.

## E · LICENSE BOUNDARY

Chỉ MỘT cơ chế runtime thật: chặn domain Pinterest ở cửa nhập URL Thư viện. Không có license-type
gate tổng quát (Pantone/Dulux chỉ cảnh báo bằng comment cho người code, không chặn hành vi thật).

## F · GOLDEN JOURNEY COVERAGE (R0-R6)

| Checkpoint | Trạng thái | Bằng chứng |
|---|---|---|
| R0 SOURCE-KNOWN | **PARTIAL** | Unsplash/Openverse biết nguồn lúc tìm nhưng KHÔNG lưu khi "dùng"; LibraryAsset không có cột nguồn |
| R1 REFERENCE-STORED | **PARTIAL** | 4 đảo lưu khác nhau, không hợp nhất |
| R2 PROJECT-CONTEXT-KNOWN | **BLOCKED** | LibraryAsset không projectId; RefManifest.project là text tự do |
| R3 USE-INTENT-KNOWN | PARTIAL | `RefUsage`/`LibraryAsset.usage` có enum nhưng 2 taxonomy song song không cầu nối |
| R4 PROMOTION-EXPLICIT | TRUE-MISSING | không có bước "promote reference→component" tường minh cho ảnh |
| R5 DOWNSTREAM-LINKED | PARTIAL (hẹp) | chỉ `ProductSpec.imageAssetId` 1 chiều |
| R6 REOPEN-PERSISTED | PARTIAL | LibraryAsset persist DB thật, nhưng RefManifest (IndexedDB) không project-scoped nên "reopen đúng dự án" không đảm bảo |

**Không checkpoint nào LIVE trọn vẹn.** R2 là nút thắt — mọi checkpoint sau nó phụ thuộc nó.

## G · HALF-CAPABILITY (cặp)

| Cặp | Đánh giá |
|---|---|
| Reference ↔ Source | HALF — có tag tự do, không có cột thật |
| Reference ↔ Promote | TRUE-MISSING nửa sau |
| Search ↔ Personal ranking | HALF — ref-search lexical thuần, không nối PairwisePerceptron |
| Save ↔ Where-used | HALF — chỉ `imageAssetId` 1 chiều |
| Image → DNA | LIVE nhưng đọc metadata cũ, không phân tích ảnh mới |
| Image → Component | ORPHAN (from-photo 0 caller) |
| Reference → Grounded Render | LIVE (B3), nhưng ảnh vào node KHÔNG phải từ Gallery/LibraryAsset — do KTS tự đưa vào |
| External Source → License state | HALF — chỉ Pinterest bị chặn, không phải hệ license đầy đủ |

## H · WHAT NOT TO BUILD

- ❌ ReferenceHub/InspirationCenter/MasterGallery mới — Gallery đã là mặt tiền tuyển chọn đúng vai
- ❌ Provider layer mới (Wikimedia/ArchDaily) trước khi có data contract (projectId trên LibraryAsset)
- ❌ Recommendation engine mới — PairwisePerceptron đã LIVE đúng vai, chỉ thiếu tín hiệu từ ảnh reference
- ❌ License engine tổng quát ngay — cần Hoà định phạm vi trước (chỉ ảnh? cả màu Pantone/Dulux?)

---

## TỔNG KẾT

REFERENCE SYSTEM: 4 đảo không hợp nhất (LibraryAsset · RefManifest · Files ngăn① · Gallery-local-state)
PROVENANCE: chỉ tag tự do, 0 cột DB thật, đứt ngay bước thumbnail
SEARCH: lexical thuần (ref-search.ts), không AI/embedding
PERSONALIZATION: LIVE, per-USER, học trên lựa chọn UI không phải ảnh thô
PROJECT CONTEXT: **KHÔNG CÓ** — LibraryAsset không projectId (nút thắt R2)
DNA: LIVE, đọc metadata cũ, không tự phân tích ảnh mới
VISUAL: Grounded Render B3 LIVE v0, B1/B2/B4 spec-only
IMAGE→3D: ORPHAN xác nhận lại (0 caller thật)
EXTERNAL SOURCES: Unsplash/Openverse CODE THẬT · Pinterest CHẶN chủ động · Wikimedia/ArchDaily/OfficeSnapshots KHÔNG CÓ
LICENSE: chỉ 1 domain-guard, không có license-type engine

READY TO IMPLEMENT (không cần H9): CONNECT "Đề xuất nguồn mới" → LibraryAsset thật · CONNECT
Openverse/Unsplash "Pick hình" → lưu thật · cầu nối RefUsage↔LibraryAsset.usage (2 taxonomy song song)

BLOCKED BY H9 (cần Workspace model TRƯỚC): Reference Canvas 3D · Idea Board project-scoped ·
R2 Project-context nói chung

NEED HOÀ: ① thêm `projectId` vào `LibraryAsset` — đây là schema change THỨ HAI song song H9, cần
quyết cùng lúc (nếu Workspace ra đời mà LibraryAsset vẫn per-user thì Reference Canvas vẫn kẹt)
② phạm vi license engine (chỉ ảnh hay cả màu hãng) ③ có build provider layer mới không hay dừng
ở Unsplash/Openverse hiện có.

CHƯA CHẮC: audit chỉ đọc code, chưa chạy app; "Files ngăn①" có thể có phần đã đổi trong 132 dirty
file hiện tại của working tree (chưa kiểm riêng phần đó).

HẠN DÙNG: hết hạn khi Hoà quyết H9/projectId-LibraryAsset, hoặc bất kỳ packet READY-TO-IMPLEMENT
nào ở trên được thi công.
