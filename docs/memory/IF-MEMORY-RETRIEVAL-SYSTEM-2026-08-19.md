# IF MEMORY & RETRIEVAL SYSTEM — hợp đồng trí nhớ 3 tầng (Hoà ban 19/08/2026)

> Đọc độc lập được, không cần transcript chat. File này là **bản mô tả HỆ THỐNG trí nhớ**,
> không phải trí nhớ. Trí nhớ sống ở các file được nó trỏ tới.
>
> **Một câu tóm tắt:** chat/context của Claude KHÔNG phải nơi lưu trí nhớ chính — trí nhớ chính
> là file trong repo, chia 3 tầng, và **memory chỉ để TÌM CHỖ, code mới XÁC NHẬN SỰ THẬT**.

---

## 1 · Mục tiêu

1. **Tiếp việc được** — phiên mới nắm trạng thái trong <10 phút, không đọc lại 160+ file docs.
2. **Quyết định lớn tìm đúng nguồn sâu** — không quyết từ bản nén; bản nén chỉ trỏ đường.
3. **Chống stale memory nhớ hộ code** — mọi khẳng định về code (0 caller, 0 mount, route chết,
   thiếu field…) phải đo lại tại HEAD hiện tại trước khi dùng làm tiền đề.
4. **Kết quả quan trọng phải thành file thật** — không có gì "chỉ nằm trong chat". Chat bị nén
   là mất; file trong repo thì không.

Bài học trả giá đã có thật, ghi để không quên vì sao hệ này tồn tại:
- Bản đồ kiến trúc mồ côi **19 ngày** vì một lần đổi tên không sửa con trỏ (`IF-MASTER-BLUEPRINT`
  774 byte — mọi phiên đọc mẩu cụt rồi tưởng đã đọc kiến trúc).
- `SPEC-GANTT-DATA` nói *"chưa có model Task"* trong khi Task đã có UI thật — **11 ngày** không ai sửa.
- Sổ ghi "5 bộ hình nền chưa cắm" trong khi `SystemWallpaper` đã mount — chẩn đoán dải đen Home
  dựng trên tiền đề sai.
- 16/08: mọi lỗi hiểu-sai-khái-niệm (`master tool`↔`ToolWindow`, vật liệu chẻ ba) đều là
  **thiếu QUAN HỆ chứ không thiếu dữ kiện** — nén nhật ký không bao giờ ra bản đồ.

---

## 2 · Sơ đồ 3 tầng

```
TẦNG A — LIVING MEMORY          docs/memory/LATEST.md
  "bây giờ đang ở đâu"           HEAD · trạng thái · lane · blocker · chốt mới ·
  ghi đè mỗi phiên lớn           file canonical phải đọc · việc tiếp theo
        │ trỏ xuống
        ▼
TẦNG B — RETRIEVAL MAP          docs/memory/RETRIEVAL-MAP.md
  "chủ đề X thì đào ở đâu"       mỗi topic: canonical · audit mới nhất · gốc lịch sử ·
  INDEX, không phải sự thật      chốt then chốt · code anchor · drift đã biết ·
                                 quy trình 4 bước trước quyết định lớn
        │ trỏ xuống
        ▼
TẦNG C — DEEP DECISION RECORD   docs/memory/sessions/<ngày>/<nn-nhánh>/README.md
  "vì sao quyết thế, đánh đổi    + ADR (docs/ADR-*.md) + Blueprint B1-B25 +
   gì, đã bác phương án nào"     bao-cao-phien + PROMPT-GOC đã cứu
  KHÔNG BAO GIỜ nén mất
```

**Luật giữa các tầng:**
- A chỉ chứa con trỏ + một câu — **cấm chép nội dung** (luật LATEST đã có từ 15/08, giữ nguyên).
- B là **chỉ mục tìm nguồn**, KHÔNG phải source-of-truth code. B nói "đào ở file nào", không nói
  "sự thật là gì".
- C giữ đủ khuôn: QUESTION → OPTIONS → EVIDENCE → STRONGEST COUNTERARGUMENT → REJECTED OPTIONS
  → DECISION → WHY → COST/TRADEOFF → SUPERSEDES → IMPLEMENTATION ANCHORS → AUDIT/DRIFT →
  CURRENT STATUS → HẠN DÙNG. **Không được nén chỉ còn "Hoà chọn A."**
- Nếu reasoning đã nằm trong ADR/session report → B trỏ tới, KHÔNG duplicate.

---

## 3 · Source priority — khi hai nguồn cãi nhau, ai thắng

```
1. CODE tại HEAD hiện tại (đo bằng grep/đọc file — sự thật duy nhất về "có gì chạy")
2. ADR (docs/ADR-Q0-*.md) — thắng cả Blueprint lẫn MAP về quyết định kiến trúc
3. IF-ARCHITECTURE-BLUEPRINT.md v1.0 (19/08, gate MISSING=0) — kiến trúc GHÉP thế nào
4. INTERIORFLOW-ARCHITECTURE-MAP.md — living direction (24 direction có tag)
5. Registry máy: scripts/frontier-registry.mjs + các máy soi (soi:frontier/contract/tu-dien…)
6. STATUS.md — trạng thái đang chạy (<800 từ)
7. docs/memory/LATEST.md — bản nén (chỉ để định hướng, không để trích dẫn làm bằng chứng)
8. 00-CHOT.md / CHANGELOG — NHẬT KÝ: trả lời "khi nào quyết gì", đọc từ trên xuống sẽ gặp
   bản ĐẦU trước bản CUỐI → tra bản đè ở CHOT-16-08-BAN-DUNG.md và các file đè tương tự
```

Chuỗi chuyển hướng đang sống (đừng lạc): `IF-ARCHITECTURE-COMPASS` ⛔ → `IF-KIEN-TRUC` ⛔ →
**`INTERIORFLOW-ARCHITECTURE-MAP.md`** (hiện hành). ⚠️ `IF-ARCHITECTURE-BLUEPRINT-v1.md` là file
CŨ KHÁC HẲN (8 luật vận hành) — đừng nhầm với Blueprint v1.0.

---

## 4 · Retrieval Map — cách dùng

File: **`docs/memory/RETRIEVAL-MAP.md`** (lập lần đầu 19/08 trong đợt audit khảo cổ).

Mỗi topic lớn có đủ 7 ô: CURRENT CANONICAL · LATEST AUDIT · HISTORICAL ORIGIN · KEY DECISIONS ·
CODE ANCHORS · KNOWN DRIFT · WHEN MAKING A BIG DECISION (quy trình 4 bước, bước cuối luôn là
"không kết luận từ memory một mình").

Topic tối thiểu (11): PROJECT/WORKSPACE · FILES/MASTER LIBRARY/IDFC · MATERIAL · 2D/3D ·
PRESENT/VISUAL PIPELINE · VITALS/AI/CREDIT · DNA/DISTILL/MEMORY · DECISION/REVISION/GENEALOGY ·
UX/DESIGN SYSTEM · ARCHINOTE READINESS · ORPHAN CAPABILITIES/HIDDEN PRIMITIVES.

**Quy tắc cập nhật:** chốt lớn mới / audit mới / drift mới phát hiện → sửa đúng topic đó NGAY
LƯỢT ĐÓ (cùng kỷ luật với frontier-registry: "chốt không vào registry coi như chưa chốt").
Đổi tên file canonical → sửa mọi con trỏ trong MAP cùng lượt (luật rút từ ca bản-đồ-mồ-côi).

---

## 5 · Decision Genealogy — chuỗi phả hệ mỗi topic

Mỗi topic lớn phải theo được chuỗi:

```
ORIGIN → CHỐT → IMPLEMENTATION → AUDIT → DRIFT → CURRENT OWNER → CURRENT CODE ANCHOR
```

Ví dụ chuỗi thật (đào được từ RETRIEVAL-MAP topic ORPHAN):
- `StageSwitcher`: ship (07/2026, "trục điều hướng duy nhất") → chốt sidebar=router (16/08)
  → **unmount** (17/08, comment AppChrome.tsx:334, giữ file để quay đầu) → audit khảo cổ 19/08
  phát hiện `VitalsGesturePanel` (675 dòng) **chết theo** vì mất mắt xích mount → chờ quyết
  RECONNECT. Trạng thái hiện tại KHÔNG được viết như thể "Vitals xưa nay vẫn vậy" — lịch sử
  unmount là thông tin, không rewrite.

**Luật:** không rewrite lịch sử như thể trạng thái hiện tại luôn tồn tại. File bị thay/huỷ phải
**đóng dấu ⛔ tại chỗ** (mẫu đúng: `QUY_TRINH_SPIRAL_v1.md`, `IF-ARCHITECTURE-COMPASS.md`;
mẫu sai còn nợ: `IF1_IF2_BIGPICTURE.md`, `SPEC-MODE-PER-STAGE.md` §1).

---

## 6 · Session Handoff contract — cuối mỗi phiên lớn

1. Ghi chi tiết ĐẦY ĐỦ mỗi nhánh việc → `docs/memory/sessions/<YYYY-MM-DD>/<NN-nhánh>/README.md`
   (khuôn: bằng chứng file:dòng, số đo, CHƯA CHẮC, HẠN DÙNG). Prompt quan trọng → cứu vào
   `PROMPT-GOC.md` cùng thư mục (tiền lệ: `09-blueprint-canonical/PROMPT-GOC.md`).
2. Ghi đè `docs/memory/LATEST.md` — bản nén, dòng đầu là ngày mới nhất.
3. Sửa topic liên quan trong `RETRIEVAL-MAP.md` (mục 4).
4. Chốt của Hoà → 1 dòng `00-CHOT.md` + entry frontier-registry nếu là tính năng.
5. Kết quả quan trọng → **file .md thật trong repo** (+ artifact UI nếu môi trường hỗ trợ).
   Không có gì chỉ nằm trong chat.

---

## 7 · Stale-evidence rule (CODE REALITY RULE)

Khi memory/sổ/doc nói bất kỳ điều gì thuộc nhóm: *0 caller · 0 mount · N stores · feature chưa
có · route chết · DB thiếu field · capability orphan* — trước khi dùng làm tiền đề:

```
MEMORY: FIND THE PLACE   →   CODE: CONFIRM THE REALITY
```

**Cấm:** MEMORY → CONCLUSION. Mọi khẳng định code trong RETRIEVAL-MAP đều mang ngày đo
(`đo 19/08`) — quá ~1 tuần hoặc qua một đợt refactor lớn thì coi như CHƯA BIẾT, đo lại.

Recipe đo nhanh (dùng đúng thứ tự): `git log --oneline -1` (mốc) → grep import-by-path đếm
caller → trace mount chain lên tới `app/**/page.tsx` → nếu là claim về sổ, chạy máy soi tương
ứng (`npm run soi:frontier` / `soi:contract` / `soi:tu-dien` / `soi:cam-dien`).

Tiền lệ vì sao luật này cứng: 17/08 T bắt 2 lệch của chính sổ trong một buổi sáng ("0 code nối
ProductSpec" — sai, dây có chưa cắm điện; "wallpaper chưa cắm" — sai, đã mount). Cả hai đều là
số chép lại, không phải phép đo.

---

## 8 · Anti-loss checklist — chạy trước khi kết thúc phiên lớn

```
[ ] LATEST.md cập nhật (ghi đè, dòng đầu ngày mới)
[ ] RETRIEVAL-MAP.md cập nhật topic bị đụng
[ ] Decision genealogy có đường đào (session README / ADR trỏ được)
[ ] Session handoff có (docs/memory/sessions/<ngày>/<nn>/README.md)
[ ] Prompt quan trọng đã cứu (PROMPT-GOC.md) nếu prompt là một phần của quyết định
[ ] Canonical owner rõ (file nào là nguồn hiện hành, file cũ đã đóng dấu ⛔)
[ ] Artifact .md đã xuất vào repo
[ ] Artifact UI đã xuất nếu môi trường hỗ trợ
[ ] Mục CHƯA CHẮC có (khai thẳng cái chưa kiểm)
[ ] HẠN DÙNG có (kết luận nào sẽ mốc khi nào)
[ ] Không dùng memory nhớ hộ code (mọi số đều có ngày đo + lệnh đo lại được)
```

---

## 9 · Tìm lại hidden/orphan capability — quy trình chuẩn

1. **Đọc audit gần nhất:** `docs/AUDIT-ORPHAN-CAPABILITIES-2026-08-19.md` (bảng đầy đủ
   capability × status × evidence × action) + topic ORPHAN trong RETRIEVAL-MAP.
2. **Chạy máy soi:** `soi:cam-dien` (engine đã tới tay user chưa) · `soi:contract` (kho có dây
   chưa) · `soi:frontier` (sổ ↔ code).
3. **Đo tay một capability cụ thể:** grep import-by-path (`from '…/<Basename>'`) loại trừ chính
   file + test → 0 hit = 0 caller; component thì trace tiếp mount chain lên `app/**/page.tsx`;
   route thì grep href/push tới path; API thì grep `fetch('/api/…')`; model Prisma thì grep
   `prisma.<modelCamelCase>`.
4. **Khảo cổ lịch sử:** `git log --diff-filter=D --name-only` (file từng tồn tại) ·
   `git log -S'<tên>'` (FIRST SEEN / WHEN DISCONNECTED) · `git branch --no-merged main`
   (nhánh treo — 19/08 còn `fix/hatch-t-junction` 1 commit thật chưa merge).
5. **Phân loại theo taxonomy A–M** của audit (ENGINE NO CALLER / UI NO BACKEND / 0 MOUNT /
   DOC AHEAD / CODE AHEAD / DUPLICATE / DEAD INTENTIONAL…) — action chỉ được KEEP · RECONNECT ·
   EXTEND · DEPRECATE · INVESTIGATE · IGNORE. **Không NEW** (luật NO-REBUILD §B25).

---

## 10 · Bootstrap phiên mới trong <10 phút

```
phút 0–2   docs/memory/LATEST.md            → đang ở đâu, blocker gì, việc kế
phút 2–3   git log --oneline -5 + git status --short   → mốc thật + working tree
phút 3–5   npm run soi:frontier             → sổ ↔ code có lệch không
phút 5–8   Topic sắp đụng trong RETRIEVAL-MAP.md → biết file canonical + code anchor + drift
phút 8–10  Mở ĐÚNG file canonical của topic đó (không đọc rộng)
```

Chỉ khi làm việc KIẾN TRÚC mới đọc thêm: `INTERIORFLOW-ARCHITECTURE-MAP.md` →
`IF-ARCHITECTURE-BLUEPRINT.md` (B3 từ điển · B20 KHÔNG-PHẢI-LÀ · B25 NO-REBUILD) → ADR.

---

## 11 · Các file memory hiện có và vai trò

| File | Tầng | Vai trò | Nhịp cập nhật |
|---|---|---|---|
| `docs/memory/LATEST.md` | A | Bản nén trạng thái, con trỏ + 1 câu | Ghi đè mỗi phiên lớn |
| `docs/memory/RETRIEVAL-MAP.md` | B | Chỉ mục 11 topic → nguồn sâu (lập 19/08) | Mỗi chốt/audit/drift |
| `docs/memory/sessions/<ngày>/<nn>/` | C | Chi tiết đầy đủ từng nhánh việc + PROMPT-GOC | Mỗi nhánh việc |
| `docs/ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md` | C | 9 quyết định kiến trúc, thắng Blueprint+MAP | Khi có ADR mới |
| `docs/IF-ARCHITECTURE-BLUEPRINT.md` | canonical | Kiến trúc ghép hệ thống, B1–B25 | Theo gate |
| `docs/INTERIORFLOW-ARCHITECTURE-MAP.md` | canonical | Living direction 24 mục có tag | Theo direction |
| `STATUS.md` | vận hành | Đang chạy gì, <800 từ | Cuối task |
| `docs/00-CHOT.md` | nhật ký | Append 1 dòng/quyết định — KHÔNG sửa dòng cũ | Mỗi chốt |
| `docs/CHOT-16-08-BAN-DUNG.md` | nhật ký | Bảng đè chồng cho chủ đề bị chốt nhiều lượt | Khi chốt bị đè |
| `scripts/frontier-registry.mjs` | máy | Sổ máy-đọc-được, soi:frontier canh 2 chiều | Ngay lúc chốt |
| `docs/hoa-noi/SO-TONG.md` | kho Hoà nói | Hoà nạp, T đọc đầu phiên | Hoà/T |
| `docs/memory/BAN-GIAO-T-*.md` | C (cũ) | Bàn giao 17/08 — đọc khi cần bối cảnh đợt đó | Đóng băng |
| `~/.claude/.../memory/` (MEMORY.md + facts) | user-level | Thói quen Hoà, luật làm việc với Claude | Khi có feedback |

---

## 12 · Gaps hiện tại (đo 19/08, khai thẳng)

1. **Chưa có máy canh RETRIEVAL-MAP** — map mới lập, sẽ mốc như COMPASS nếu không ai đối chiếu.
   Phiếu P-S (máy đối chiếu sổ↔code) đã mở từ 17/08, chưa thi công. Đây là gap lớn nhất.
2. **Tầng C không đồng nhất** — session README từ 15/08 trở đi theo khuôn, trước đó nằm rải ở
   `docs/bao-cao-phien/` (cố ý không di dời — chấp nhận, chỉ cần MAP trỏ đúng).
3. **Khuôn Deep Decision Record chưa retro-fit** — các chốt cũ trong 00-CHOT không có đủ 13 ô
   (COUNTERARGUMENT, HẠN DÙNG…). Không đào lại hàng loạt; chỉ áp khuôn cho quyết định MỚI,
   quyết định cũ nào bị mở lại thì bổ khuôn lúc đó.
4. **`docs/` 674 file · 32MB** — trần kích thước kho đã có entry (`tran-kich-thuoc-kho`) nhưng
   chưa có cơ chế nén/lưu trữ định kỳ.
5. **2 worktree treo còn mang docstring cũ** (StageSwitcher "trục duy nhất") — agent song song
   đọc nhánh đó sẽ ăn lại câu đã huỷ. Dọn worktree là việc Hoà bấm.
6. **Stale docs còn sống đã điểm danh trong audit 19/08** (SPEC-MODE-PER-STAGE §1 chưa đóng dấu,
   IF1_IF2_BIGPICTURE chưa ⛔, SPEC-GANTT-DATA §0 sai 11 ngày…) — danh sách đầy đủ + action ở
   `docs/AUDIT-ORPHAN-CAPABILITIES-2026-08-19.md`.

---

## 13 · Đề xuất tối thiểu — không tăng bureaucracy

Nguyên tắc: **không thêm nghi thức mới, chỉ vá lỗ ca thật chỉ ra** (kết luận RG1 15/08: IF thừa
quy trình chứ không thiếu). Ba việc, đều rẻ:

1. **RETRIEVAL-MAP là file DUY NHẤT thêm vào nghi thức** — mỗi phiên lớn sửa đúng topic bị đụng
   (vài dòng), không viết lại. Mọi thứ khác (LATEST, sessions, registry) đã là thói quen sẵn.
2. **Ưu tiên thi công P-S (máy đối chiếu sổ↔code)** trước mọi việc giao diện — nó là máy canh
   duy nhất giữ được tầng B khỏi mốc. Không có nó, hệ này tự đẻ ma như COMPASS.
3. **Không nhân bản khuôn** — Deep Decision Record dùng lại session README + ADR sẵn có, chỉ
   thêm 2 ô bắt buộc vào thói quen viết: **CHƯA CHẮC** và **HẠN DÙNG** (đã là luật ⑦b/⑦c của
   khuôn phiếu, nay áp cả cho memory).

---

*Lập 19/08/2026 trong đợt REPO ARCHAEOLOGY (session `11-repo-archaeology`). Chi tiết audit:
`docs/AUDIT-ORPHAN-CAPABILITIES-2026-08-19.md`. Hệ này thay câu "coi chat là trí nhớ chính" —
từ nay chat chỉ là bàn làm việc, repo là trí nhớ.*
