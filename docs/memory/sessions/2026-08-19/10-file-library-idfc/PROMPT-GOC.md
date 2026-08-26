# PROMPT GỐC — Lane 4 (nguyên văn Hoà giao, 19/08/2026)

> Hoà mở phiên với câu: *"bạn là File / Master Library / IDFC (tự đặt tên cho ss này luôn)"*
> — phiên tự đặt tên **"Lane 4 · IDFC — File→Library→Canonical"**. Dưới đây là phiếu nguyên văn.

```
# ================================================================
# INTERIORFLOW — FILE MANAGER / MASTER LIBRARY / IDFC SPECIALIST
# LANE 4 — CHẠY SONG SONG TRONG MÔ HÌNH 4 PHIÊN
# 19/08/2026
#
# MỤC TIÊU:
# FILE / IMAGE / SOURCE → UNDERSTAND → NORMALIZE → PROMOTE → MASTER LIBRARY
# → CANONICAL IDFC → 2D PLAN / ELEVATION / 3D / MATERIAL / SPEC → PROJECT INSTANCE
#
# KHÔNG REOPEN ARCHITECTURE AUDIT
# KHÔNG REWRITE CODEBASE
# KHÔNG IMPLEMENT PRODUCTION TRƯỚC INTEGRATION GATE
# ================================================================

# 0 · TOPOLOGY 4 PHIÊN: PHIÊN 1 MAIN/UNDERSTAND/EXAMINER (hợp nhất cross-lane duy nhất) ·
#     PHIÊN 2 EXECUTION/RUNTIME · PHIÊN 3 UX/UI (đã có report
#     docs/bao-cao-phien/2026-08-19-prompt01-ux-workspace-files-flow.md — BẮT BUỘC đọc) ·
#     PHIÊN 4 = lane này. Việc lane khác → CROSS-LANE NOTE; conflict kiến trúc →
#     DECISION CONFLICT → MAIN.

# 1 · SHARED CONTEXT BẮT BUỘC (đọc theo thứ tự): LATEST → 00-CHOT → CLAUDE.md →
#     BAN-GIAO-T-MOI-2026-08-19 → IF-ARCHITECTURE-BLUEPRINT → INTERIORFLOW-ARCHITECTURE-MAP →
#     Final Architecture Audit → ADR-Q0 → Material Slice 1A reports → Wave 0 reports →
#     UX report → current code thật.

# 2 · INPUT TỪ UX AUDIT — PHẢI VERIFY LẠI TẠI SOURCE (7 phát hiện: 2 đường chưa hội tụ ·
#     chưa có đường LibraryAsset xuyên suốt · Format Router ít caller · promote/normalize
#     chưa có · File Manager chưa thành flow · IA flow-centric · Workspace semantic chưa có).
#     KHÔNG dựng pipeline thứ ba chỉ để giải hai pipeline hiện có.

# 3 · NO-REBUILD RULE: LOOK INSIDE → MAP EXISTING → CLASSIFY → REUSE → CONNECT → EXTEND → NEW.
#     Trước NEW phải grep/read: File Manager · uploads · storage · LibraryAsset · library
#     ingest · idfc.ts · idfc store · BlockDef · BlockEntity · ProductSpec · MaterialDef ·
#     MaterialPbr · material resolver · image/VLM ingest · Format Router · geometry ·
#     2D block/symbol · scene/3D · thumbnails · ComfyUI/render · Design System · tests · callers.

# 4 · NEW REQUIRES NEGATIVE EVIDENCE (8 mục: đã search gì · primitive gần nhất · caller
#     production · vì sao REUSE/CONNECT/EXTEND không đủ · duplication risk · migration path).

# 5 · CANONICAL VISION: FILES ≠ MASTER LIBRARY. RAW SOURCE → FILE → UNDERSTAND → EXTRACT →
#     HUMAN REVIEW → NORMALIZE → PROMOTE → MASTER LIBRARY ITEM → REPRESENTATIONS/IDFC →
#     PROJECT INSTANCE. Cảm giác: "MỘT VẬT ĐƯỢC HIỂU DẦN", không phải "copy file sang thư viện".

# 6 · PROJECT CONTEXT: File → Project → Revision → Workspace → Decision → Source →
#     Provenance → Usage. Không tự biến mọi upload thành Master Library item.

# 7 · USE CASE VERTICAL SLICE: Hoà sẽ đưa MỘT ảnh mẫu thật từ Internet (chair/sofa/table/…).
#     REFERENCE IMAGE → IF UNDERSTANDS → HUMAN CHECKS → DEFINE CANONICAL COMPONENT →
#     MULTIPLE REPRESENTATIONS → MASTER LIBRARY → IDFC (nếu contract hỗ trợ) → PROJECT.

# 8 · SOURCE IMAGE ≠ GEOMETRY TRUTH. Confidence: PROVEN/INFERRED/ESTIMATED/UNKNOWN.
#     AI inference ≠ deterministic geometry truth. Thiếu dimensions → khai estimated/
#     needs-reference/parametric assumption.

# 9 · IMAGE UNDERSTANDING PIPELINE (conceptual): SOURCE → METADATA → VIEW CLASSIFICATION →
#     OBJECT REGION → SEMANTIC → PERSPECTIVE/HORIZON → VANISHING POINTS → PLANES →
#     SILHOUETTE → PART SEGMENTATION → MATERIAL CLUES → DIMENSION HYPOTHESIS →
#     GEOMETRY PROPOSAL → HUMAN REVIEW → DETERMINISTIC/PARAMETRIC BUILD.

# 10 · NHIỀU ẢNH CÙNG MỘT VẬT: ONE CANONICAL OBJECT ← many source views. Track
#     sourceAssetId/viewType/confidence/provenance.

# 11 · CANONICAL OBJECT: identity·semantics·parameters·dimensions·provenance·materials·
#     source assets·versions·representations. Một vật nhiều mặt, không truth riêng per mặt.

# 12 · IDFC: trace lib/cad/idfc.ts trước, KHÔNG tự redefine. Trả lời scope/kind/metadata/
#     geometry/material refs/provenance/version/portability/canonical-vs-snapshot/callers/
#     store/migration → rồi mới REUSE/CONNECT/EXTEND/NEW VERSION. Target: IDFC = portable
#     reusable canonical component representation, không phải Project instance/DB.

# 13 · PLAN: footprint·outline·projection·insertion point·rotation·bbox·symbolic detail·
#     detail level·snap anchors. Không lấy screenshot top-view làm technical plan.

# 14 · ELEVATION: FRONT/SIDE/BACK; ưu tiên semantic/vector/projected; image-derived =
#     INFERRED, không technical truth nếu chưa validate.

# 15 · 3D: phân quality REFERENCE_ONLY/PROXY/PARAMETRIC_APPROXIMATION/GENERATED_APPROXIMATION/
#     DESIGN_GRADE/MANUFACTURER_GRADE — nhưng REUSE canonical vocabulary nếu đã có, không
#     invent enum. AI mesh không được gọi manufacturer-grade.

# 16 · PARAMETRIC-FIRST cho vật cấu trúc đơn giản; organic → proxy/generated. Không ép một
#     strategy cho mọi category.

# 17 · MATERIAL: Component → material assignment → matId → 2D facet → PBR → commerce/spec.
#     matId = IF-owned immutable. Không hồi sinh matId=SKU. SKU/vendor = business/external key.

# 18 · VARIANT/OVERRIDE [CHỐT]: Template → Variant → Instance Override; cùng field →
#     Override thắng Variant. Không silently mutate Master item.

# 19 · FURNITURE SEMANTICS: category/subcategory/name/brand/model/dimensions/materials/
#     finish/manufacturer/supplier/external codes/room suitability/placement/mounting/
#     variants/adjustable params/source/provenance — phân required/optional/derived/external.

# 20 · CANONICAL IDENTITY: không dùng URL/filename/SKU/Lark record/supplier/manufacturer
#     code làm identity IF. ID ngoài = ExternalRef/business key.

# 21 · FILE MANAGER: nhận upload/drag/paste/URL/project file/photo/video/supplier/existing.
#     Status kiểu RAW/UNDERSTANDING/UNDERSTOOD/REVIEWED/PROMOTED/ARCHIVED — nếu vocabulary
#     chưa có: đề xuất conceptual, không tạo enum.

# 22 · FILE INSPECTOR: preview·metadata·source·provenance·project/revision relationship·
#     understanding·extracted entities·material clues·canonical links·used where·promotion
#     state. Actions: OPEN/REFERENCE/UNDERSTAND/RE-RUN/EDIT/PROMOTE/CREATE COMPONENT/
#     CREATE MATERIAL/LINK/ATTACH TO DECISION/COMPARE/ARCHIVE. Đánh CURRENT/PARTIAL/GAP.

# 23 · HUMAN REVIEW: AI output là proposal. UNDERSTAND → PROPOSAL → HUMAN REVIEW → EDIT →
#     APPROVE → CANONICAL. Không auto-promote high-uncertainty vào truth.

# 24 · MASTER LIBRARY item inspect được: identity·category·source·provenance·confidence·
#     plan·elevation·3D·material·spec·commercial·variants·preview·where used·version·
#     external refs. Không chỉ là gallery.

# 25 · PROJECT INSTANCE: reference canonical + variant? + overrides + placement/state.
#     Không clone Master truth per Project.

# 26 · VERSION/UPDATE: v1 proxy → v2 better geometry → v3 supplier model. PIN/FOLLOW/
#     REVIEW UPDATE/MIGRATE. Không silent overwrite. Contract, không framework.

# 27 · FILES/STORAGE: audit authority raw/metadata/canonical/preview/3D/IDFC/material/PBR/
#     generated. Trace Prisma·disk·IDB·localStorage bridge·portable·upload dirs. Không
#     invent storage mới.

# 28 · PORTABILITY: export/import/offline/provider loss/Lark loss/source loss/identity/
#     provenance preservation. Canonical IF item sống không cần Lark.

# 29 · LARK = OPTIONAL ADAPTER; supplier catalog = EXTERNAL SOURCE → INGEST → NORMALIZE →
#     IF CANONICAL. External không sở hữu identity/truth.

# 30 · VISUAL PIPELINE: 3D → Material → Camera → Pipeline → Preview/Render → Present.
#     ComfyUI/imagegen = derived visual capability. Không canonicalize render thành geometry.

# 31 · AI/VLM/CREDIT: trace AI Gateway/provider·estimateRunCredit·cost gate·whitelist·
#     credit behavior·fallback·direct-call bypass. Không bypass cost control.

# 32 · PROVENANCE: trả lời "từ đâu/ai tạo/model nào/user sửa gì/duyệt chưa/quality nào".
#     Không copy copyrighted source vào redistributable canonical mặc định.

# 33 · INTERNET REFERENCE: phân REFERENCE/OWNED/SUPPLIER/GENERATED DERIVATIVE. Không assume
#     quyền redistribute; source có thể chỉ làm evidence/provenance.

# 34 · DETERMINISTIC ROLE: VLM = semantic/part/material/spatial/hidden-part hypothesis;
#     deterministic = measurement/perspective/symmetry/projection/parametric/validation.
#     AI proposal → deterministic build → human correction.

# 35 · ARCHINOTE READINESS: chừa shared contracts (Component·Material·Location·Photo·
#     Installed item·Issue·Revision·Replacement·Comparison). Không build ArchiNote.

# 36 · REQUIRED VERTICAL SLICE — 16 bước: raw reference → metadata → understanding →
#     human review → canonical identity → semantic → plan → front elevation → side elevation
#     → 3D → materials → preview → provenance → IDFC → project instance → present usage.
#     Không fixture giả nếu có real source.

# 37 · SLICE ACCEPTANCE: ONE SOURCE(S) → ONE CANONICAL OBJECT → MANY REPRESENTATIONS →
#     SAME IDENTITY → PROJECT INSTANCE → NO DUPLICATE TRUTH. Source URL mất / Lark chết →
#     item sống. Override không phá Master.

# 38 · CURRENT→TARGET MATRIX bắt buộc: | Need | Existing Primitive | Evidence | Coverage
#     FULL/PARTIAL/NONE | Action REUSE/CONNECT/EXTEND/NEW/MIGRATE/LEGACY | Why |. NEW kèm
#     negative evidence.

# 39 · CROSS-LANE CONTRACT: UX note / Execution note / DECISION CONFLICT → MAIN. Không sửa
#     output lane khác. Không tự đổi Blueprint.

# 40 · OUTPUT CANONICAL: docs/IF-FILE-MASTER-LIBRARY-IDFC-MODEL.md — 36 mục (current reality
#     → target → file manager → inspector → understand → normalize → promote → library →
#     identity → idfc current → idfc target → plan → elevation → 3D → material → furniture
#     semantics → variant/override → provenance → VLM → deterministic → human review →
#     quality → project instance → version → storage → portability → Lark → AI/credit →
#     visual pipeline → ArchiNote → matrix → slice → acceptance → cross-lane → CHƯA CHẮC →
#     HẠN DÙNG).

# 41 · ANTI-LOSS: model doc + bao-cao-phien/2026-08-19-file-library-idfc.md +
#     memory/sessions/2026-08-19/<NN>/README.md + PROMPT-GOC.md. CHỐT mới → 00-CHOT+registry;
#     chỉ proposal → KHÔNG tự ghi thành CHỐT. Không tạo canonical doc thứ hai.

# 42 · KHÔNG IMPLEMENT: READ/TRACE/MODEL/SPEC/VERIFY. Đưa về MAIN contract đủ sạch để chia Wave.

# 43 · REPORT FORMAT 6 phần + NEGATIVE EVIDENCE + CHƯA CHẮC + HẠN DÙNG + CROSS-LANE NOTES.

# 44 · STOP: kết thúc bằng bảng trạng thái (FILE MANAGER MAPPED/BLOCKED · MASTER LIBRARY ·
#     IDFC CONTRACT VERIFIED/PARTIAL · MULTI-REPRESENTATION READY/BLOCKED · SLICE READY/
#     BLOCKED · MATERIAL LINK · VLM/AI · CREDIT · ARCHITECTURE NOT REOPENED · CODE NOT
#     MODIFIED · WAVE 1 NOT STARTED · ANTI-LOSS) rồi DỪNG. Không commit. Không push.
```

> Ghi chú lưu trữ: đây là bản nén-giữ-đủ-ý của phiếu (phiếu gốc dán trong chat rất dài,
> cấu trúc 44 mục giữ nguyên số và toàn bộ ràng buộc; câu chữ rút gọn không đổi nghĩa).
> Bản chat gốc nằm trong transcript phiên "Lane 4 · IDFC — File→Library→Canonical".
