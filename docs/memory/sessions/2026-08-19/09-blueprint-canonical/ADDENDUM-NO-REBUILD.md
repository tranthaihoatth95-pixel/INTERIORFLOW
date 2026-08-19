# ADDENDUM — CODEBASE HEATMAP + NO-REBUILD RULE (Hoà ban 19/08)

> Nguyên văn Hoà gửi qua chat (KHÔNG nằm trong file prompt gốc ở Downloads — bản này là nơi lưu
> duy nhất ngoài chat). Bản nén thi hành: `docs/IF-ARCHITECTURE-BLUEPRINT.md` §B25.
> BẮT BUỘC ÁP DỤNG CHO MỌI ĐỀ XUẤT.

InteriorFlow có nền code DÀY NHƯNG KHÔNG ĐỀU.

Có vùng rất dày:
- deterministic/professional tools
- 2D
- geometry/validation/BOQ
- Design System/UI primitives
- persistence
- Material facets
- Present/visual primitives
- AI/text/VLM/image primitives
- DistillEngine
- PairwisePerceptron
- credit/cost controls
- IDF/IDFC/IDFP
- Files/Library infrastructure

Có vùng chưa khép hoặc còn mỏng:
- Project Context / Manifest theo vision mới
- Workspace semantic
- revision genealogy / branch / non-destructive work
- DesignDecision / Creative Timeline
- Project Design DNA xuyên workflow
- Memory ↔ DNA learning loop
- Intelligence Policy
- unified AI Gateway
- optimistic conflict/merge
- ArchiNote shared contracts
- Files → Understand → Normalize → Promote → Master Library pipeline
- shared Visual Pipeline
- một số identity/portable wiring

NHƯNG danh sách trên chỉ là HEATMAP ĐỊNH HƯỚNG từ audit trước.

KHÔNG được dùng nó để nhớ hộ code.

Trước khi đổ thêm bất kỳ lớp nào:
ĐO LẠI TẠI NGUỒN.

---

## LUẬT THI CÔNG BẮT BUỘC

Mọi capability / model / service / store / component / contract / term mới phải đi theo thứ tự:

LOOK INSIDE
→ MAP EXISTING
→ CLASSIFY
→ CONNECT
→ EXTEND
→ NEW

### LOOK INSIDE

Phải kiểm:
- code đã có primitive tương đương chưa
- caller production thật có không
- type/schema đã có chưa
- persistence đã có chưa
- helper/resolver/service đã có chưa
- component Design System đã có chưa
- route/surface đã có chưa
- test/checker đã có chưa
- canonical term đã có chưa
- migration/compatibility path đã có chưa

Không suy từ filename.
Không nhớ hộ máy.
Phải grep/read caller thật.

---

## NEW REQUIRES NEGATIVE EVIDENCE

Muốn tạo NEW:

- model mới
- Prisma field/model mới
- store mới
- service mới
- component mới
- generic framework mới
- architecture term mới
- persistence layer mới
- gateway mới
- command abstraction mới

PHẢI chứng minh:

1. đã tìm primitive hiện có;
2. primitive gần nhất là gì;
3. vì sao REUSE không đủ;
4. vì sao CONNECT không đủ;
5. vì sao EXTEND không đủ;
6. NEW không tạo island hoặc duplicate ownership.

Không có negative evidence:
→ CẤM NEW.

---

## THICK AREA DEFAULT

Nếu vùng code đã dày:

DEFAULT = REUSE / CONNECT / TUNE.

Không rebuild.

Ví dụ: 2D · Design System · deterministic tools · Material · Present · AI primitives · persistence.

Nếu proposal ở vùng dày nhảy thẳng NEW: đánh RED FLAG.

---

## THIN AREA DEFAULT

Nếu vùng còn mỏng:

DEFAULT = EXTEND NEAREST EXISTING CONTRACT.

Không tạo một island mới chỉ vì chưa đủ feature.

Ví dụ:
- Project DNA thiếu → kiểm DistillEngine + Project + Decision + Memory trước.
- Workspace thiếu semantic → kiểm routes/store/context primitives trước.
- File Manager chưa đạt vision → kiểm storage + LibraryAsset + ingest + UI shell trước.
- Visual Pipeline chưa thống nhất → kiểm render/image/comfy/provider primitives trước.

---

## ANTI-DUPLICATION CHECK

Trước mọi NEW phải tìm:
- same concept, different name
- same behavior, different folder
- legacy primitive chưa cắm
- pure helper chưa có caller
- feature flag đang che primitive có sẵn
- stale docs khiến tưởng chưa có
- duplicated store/service/component

Nếu tìm thấy: ưu tiên CONNECT/REVIVE/EXTEND. Không đẻ "ma" thứ hai.

---

## CURRENT REALITY ≠ TARGET VISION

Nếu code hiện tại chưa đạt vision, KHÔNG: giả nó đã đạt · phá nó để xây mới ngay · lấy code hiện
tại làm chân lý mới.

Phải ghi: CURRENT / TARGET / GAP / TRANSITION STRATEGY.

Transition ưu tiên: ADDITIVE FIRST → BRIDGE → MIGRATE → VERIFY → DEPRECATE → REMOVE LATER.

---

## REQUIRED TABLE

Mọi nhóm đề xuất lớn phải có:

| Need | Existing Primitive | Evidence | Coverage | Action | Why |
|---|---|---|---|---|---|
| ... | ... | file:line | FULL/PARTIAL/NONE | REUSE/CONNECT/EXTEND/NEW | ... |

Nếu Action = NEW, bắt buộc thêm:

NEGATIVE EVIDENCE:
- searched:
- nearest primitive:
- why insufficient:
- duplication risk:
- migration/compatibility plan:

---

## STOP CONDITION

Nếu phát hiện code hiện có đã giải bài toán tốt: DỪNG đề xuất NEW.
Nếu phát hiện primitive gần đủ: EXTEND.
Nếu phát hiện decision conflict thật: báo COORDINATOR.

Không dùng "làm mới cho sạch" · "viết lại cho dễ" · "framework mới sẽ đẹp hơn" làm lý do.
