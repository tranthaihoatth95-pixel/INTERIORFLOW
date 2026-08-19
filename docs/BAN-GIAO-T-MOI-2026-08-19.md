# BÀN GIAO T MỚI — 19/08/2026 (context T cũ đầy)

> Đọc **cả file** trước khi làm gì. Dưới 10 phút, đủ để tiếp việc mà không phá.

## 0 · VAI + LUẬT CỨNG

**Vai T (từ 12/08 Hoà chốt, `docs/HOP-DONG-PHOI-HOP-T.md`)**:
- T = phiên CHÍNH: nghiên cứu · trao đổi · kiểm chứng · điều phối phiên phụ
- T THÔI ôm việc build. Việc build giao phiên phụ (`Agent` tool).
- Chạm biên liên chặng thì dừng + đề xuất Hoà.
- Trích mã điều khoản `[Đ1]`/`[T2]`/`[N1]`... phải MỞ `docs/TRIET-LY-IF.md` đọc số — cấm nhớ hộ (bài học 16/08 — 6 lần trích sai trong 1 ngày).

**⛔ CẤM tuyệt đối phiên này**:
- Không code Prisma / migration / db push
- Không code ATLAS sync
- Không đụng `normalizeMatId` cũ (`lib/materials/pbr-store.ts:22`) — KS4 legacy compat
- Không cắm resolver vào 2D/3D/BOQ (chờ Prisma migration Hoà chạy tay)
- Không commit / push (Hoà tự bấm)
- Không tạo docs mới trừ khi Hoà yêu cầu

**⛔ Đầu phiên bắt buộc** (theo `docs/CLAUDE.md`):
1. Đọc `docs/memory/LATEST.md` (nếu có)
2. Đọc `docs/IF-KIEN-TRUC-OS.md` — hiến pháp OS 18/08
3. Đọc `docs/IF-KIEN-TRUC.md` — bản đồ kiến trúc
4. Đọc `STATUS.md`
5. Chạy `npm run soi:frontier` — nếu >0 lệch phải xử trước khi bàn việc mới

## 1 · BỐI CẢNH — 4 PHIÊN LỚN 19/08

Phiên T cũ chạy 4 chuỗi lớn trong 1 ngày, đầy context vì đọc/ghi nhiều. Sản phẩm:

| Chuỗi | Sản phẩm |
|---|---|
| ① `/understand` lần đầu | `.ua/knowledge-graph.json` (2694 nodes) + `docs/bao-cao-phien/2026-08-19-understand-lan-dau.md` |
| ② Audit Q0 Source of Truth | `docs/AUDIT-Q0-SOURCE-OF-TRUTH-LIBRARY-IDFC-2026-08-19.md` (1821 dòng, 21 findings, 9 câu Hoà quyết) |
| ③ 9 ADR kiến trúc Q0 | `docs/ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md` (1124 dòng, Hoà đã CHỐT 9 quyết định) |
| ④ Material Vertical Slice Contract + Slice 1A bước 1 | Xem §3 dưới |

## 2 · 9 ADR HOÀ ĐÃ CHỐT (KHÔNG được tự đổi)

`docs/ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md` — trạng thái **ACCEPTED**. 9 chốt:

1. **Q1 Source of Truth**: Domain Authority + Project Manifest (mỗi domain 1 authority rõ)
2. **Q2 Prisma vs `.idf`**: Live reference + portable snapshot
3. **Q3 `.idfc`**: Canonical reusable content definition (template ≠ instance; instance = reference + overrides)
4. **Q4 Library binary**: Managed copy + content addressing + provenance
5. **Q5 Files vs Library**: Files = raw · Library = understood reusable
6. **Q6 Stage representation**: Live = DERIVED; approved/issued = FROZEN SNAPSHOT
7. **Q7 Zustand mutation**: KHÔNG được mutate canonical trực tiếp — đi qua Command → Deterministic Core → Validate → Canonical mutation → Domain Event → Zustand update. **Nhưng scope Q7 chỉ 2/19 store** (`useCadStore` + `useFlowStore`) — 16 store còn lại là UI-only.
8. **Q8 DesignDecision**: CÓ, first-class domain (proposed|selected|rejected|approved|clientApproved)
9. **Q9 Design DNA**: 4 scope (Studio/Person/Client/Project → Contextual DNA)

**Nguyên tắc bao trùm**: Deterministic Core · AI Layer L0-L5 · AI Gateway + Intelligence Policy · Ownership (chấp nhận phụ thuộc công cụ, KHÔNG chấp nhận phụ thuộc dữ liệu).

## 3 · SLICE 1A "MỘT VẬT LIỆU NHIỀU MẶT" — TRẠNG THÁI

### 3a · Chốt hòa giải Decision Conflict Hoà 19/08

Chốt **SUPERSEDES** luật lịch sử 07/08 `matId = ProductSpec.sku`. Luật mới:

1. **matId = IF-owned immutable UUID** (identity của material, không phải business code)
2. **ProductSpec.sku** giữ vai business/external key (mutable — ATLAS sync đổi sku KHÔNG đổi matId)
3. **ProductSpec.matId?** field mới (chưa có Prisma migration — CHỜ Hoà chạy)
4. **BlockEntity.specId** giữ nghĩa cũ (FK mềm ProductSpec.id); **entity.matId?** thêm song song (identity khác domain)
5. **entity.hatchOverride?** = delta khi user sửa hatch tay — KHÔNG detach matId
6. **Portable slice v1 = LIVE only**, chờ Q2 thi công snapshot dùng chung
7. **Bootstrap**: Hướng B ATLAS Larkbase sync 1 material THẬT (không fixture)
8. **Legacy compat**: tách namespace UUID vs sku rõ ràng

### 3b · Slice 1A bước 1 — XONG-MÁY 19/08

**Files phiên T cũ đã đụng** (git status untracked/modified):

Mới:
- `lib/materials/matid-identity.ts` (98 dòng): `isMatIdUuid` · `normalizeMatIdCanonical` · `normalizeSkuBusinessKey` · `resolveInputMatId` · `generateMatId` — namespace UUID vs sku tách bạch
- `lib/materials/matid-identity.test.ts` (99 dòng): **32/32 test pass**

Sửa (chỉ docstring + registry — 0 dòng logic đổi):
- `scripts/frontier-registry.mjs`: entry mới `material-matid-uuid` (ĐỢT 11, trạng thái ✅ xong-máy) + SUPERSEDED note trên entry `vat-lieu-mot-vat`
- `lib/materials/pbr-store.ts` · `resolve.ts` · `ba-mat.ts`: docstring SUPERSEDED
- `lib/cad/materials.ts` · `idfc.ts` · `library-item-resolve.ts`: docstring SUPERSEDED
- `lib/idfc-import/surface-graph.ts`: comment SUPERSEDED

**Verify cuối**: tsc 0 · resolve.test 9/9 pass · ba-mat.test 37/37 pass · soi:frontier 0 lệch · soi:tu-dien không mọc lệch mới.

**Chưa commit**. Hoà tự bấm khi sẵn sàng.

### 3c · 🔴 2 BLOCKER chờ Hoà xử tay

**BLOCKER 1 · Prisma migration**:
- `prisma/schema.prisma`: thêm `ProductSpec.matId String? @unique`
- Backfill: mỗi ProductSpec cũ chưa có matId → sinh UUID (crypto.randomUUID)
- Theo `docs/CLAUDE.md`: KHÔNG chạy `prisma db push`/`migrate` qua sandbox. Hoà chạy tay trên máy thật.
- Cần script `scripts/backfill-productspec-matid.ts` (chưa viết) — Slice bước 2

**BLOCKER 2 · ATLAS Larkbase credentials**:
- `.env.local` cần: `LARK_ATLAS_MATERIAL_TABLE_ID` · `LARK_APP_ID` · `LARK_APP_SECRET` · `LARK_ATLAS_BASE_ID`
- Grep `atlas-material-map.ts:8-9` docstring khai *"ATLAS Material Library CHƯA từng nối route đọc thật (blocked)"*
- Cần Hoà cấu hình 4 env var + xác nhận Larkbase table đã có material data

### 3d · Slice 1A bước 2 — sau khi Hoà xử 2 blocker

Nếu Hoà xong 2 blocker, phiếu tiếp:
1. Viết backfill script (không tự chạy, soạn cho Hoà)
2. Sửa `resolve.ts:57` — đọc `s.matId` thay `s.sku` (giữ fallback legacy 1 vòng)
3. Sửa `pbr-store.ts:22` — tách `normalizeMatId` thành 2 hàm (UUID vs sku)
4. Sửa `atlas-material-map.ts` — sinh matId khi upsert mới
5. Cắm `getMaterial(matId)` vào 2D hatch render (chờ Q3 override thi công) + 3D `docToObjScene` PBR áp + Present bảng material (Slice 1B) + BOQ (đã dùng, chỉ chuyển sang matId)
6. Test end-to-end material Lincoln (Muuto Outline sofa `sku='MU-OUT-3S'` là ứng viên bootstrap ATLAS thật, xem `scripts/seed-specs.ts:57-64`)

## 4 · CÔNG CỤ CÓ SẴN

**Máy soi (chạy đầu phiên)**:
- `npm run soi:frontier` — sổ frontier ↔ code, đếm lệch, vai MVP/kết nối/đỡ
- `npm run soi:tu-dien` — từ điển 9 tên duyệt (`card`/`kính`/`nấc`/`lớp`/`tầng`/`module`/`tool`/mã điều khoản/bốn-tên-một-thứ)
- `npm run soi:thao-tac` — luật thao tác cấm 7 tội danh
- `npm run soi:hinh-hoc` — thang bo token concentric
- `npm run soi:contract` — FeatureContract 4 câu Đọc/Ghi/Công thức/Ai ăn theo
- `npm run soi:that` — sổ ↔ code sự thật
- `npm run ship:map` — bảng 1 khung nhìn từ frontier

**Test**:
- `npm test` — tsc + license + check-chot + toàn test
- Test riêng file: `node_modules/.bin/sucrase-node lib/materials/matid-identity.test.ts`

**Verify**:
- `npx tsc --noEmit` — chỉ type-check

**Đo dev server** (đang chạy nhiều instance có thể lỗi — luật §0aa):
- `lsof -i :3000 -i :3001 -i :3002` trước khi mở dev server mới
- Ports quy ước: CHINH=3001, PHU=3002, G4=3004 (feedback memory `dev-server-ports`)

**Plugin Understand-Anything** (đã chạy 19/08):
- `.ua/knowledge-graph.json` (2.2MB, 2694 nodes) đọc bằng `node -e "const g = require('./.ua/knowledge-graph.json'); ..."`
- Nhưng cẩn thận `autoUpdate: true` trong `.ua/config.json` → mỗi commit tự spawn subagent Anthropic. T cũ đề xuất tắt (Hướng A báo cáo 19/08). Hoà chưa quyết.

## 5 · TASK LIST HIỆN TẠI

29 task, phần lớn completed. Task còn `in_progress`/`pending` khi T cũ hết context:
- Không còn task in_progress (Slice 1A bước 1 hoàn thành)
- Tất cả blocker chờ Hoà xử

**Việc tiếp T mới cần làm** (khi Hoà yêu cầu):
1. Nếu Hoà chưa xử blocker → CHỜ, không code thêm gì cho Slice 1A
2. Nếu Hoà đã xử Prisma migration → mở phiếu Slice 1A bước 2 (soạn Task mới)
3. Nếu Hoà giao chuỗi mới (khác Slice 1A) → theo mã điều khoản `[Đ1]` phiếu mới

## 6 · CHỐT LỊCH SỬ QUAN TRỌNG PHIÊN 19/08 (rút cho T mới)

**Bài học đắt nhất**: 
- **Decision Conflict thật xảy ra** khi chốt kiến trúc mới đá vào chốt code lịch sử. Không tự hòa giải — báo Hoà quyết. Cách gõ trong sổ:
  ```
  DECISION CONFLICT
  Q: <mã Q hoặc M>
  NEW EVIDENCE: <file:line>
  WHY: <ngắn>
  IMPACT: <đo scope>
  ```
- **"Nhìn vào trong trước khi build mới"** ([Đ2] `TRIET-LY-IF.md:72`) — Reconciliation audit 19/08 phát hiện IF đã có ~80% primitive dưới dạng REUSE/CONNECT/EXTEND. Chỉ 3/16 điểm là NEW thật.
- **Migration estimate v2 = ~17-20 tuần** (giảm 33% so với ADR ước ban đầu 26-30 tuần) nhờ REUSE `PairwisePerceptron` (Q8/Q9), `FlowVersion` retention (Q6), `commands/registry` (Q7 chỉ 2/19 store).
- **Vertical slice > infra rewrite**: Hướng A slice trước, chốt xong mới sang tiếp — Hoà đã chọn.

## 7 · GHI CHÚ MEMORY (nạp vào ~/.claude auto memory khi thuận tiện)

Từ khóa quan trọng T mới nên nhớ:
- **matId 19/08**: UUID canonical, không phải sku. `lib/materials/matid-identity.ts`.
- **`normalizeMatId` cũ**: DO NOT TOUCH (legacy compat window).
- **9 ADR Q0 đã Accepted**: `docs/ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md`.
- **Slice 1A**: bước 1 xong-máy, bước 2 chờ 2 blocker.
- **Frontier registry** dot 11 mới lập: `material-matid-uuid`.

## 8 · CHƯA CHẮC KHI BÀN GIAO

- Context T cũ đầy — có thể có việc nhỏ đã quên ghi vào file này. T mới nên grep `git log --oneline -20` + `git status` để đối chiếu.
- Files chưa commit: T mới nên `git diff` xem trước khi làm gì tiếp — có thể có sửa nhỏ chưa handoff.
- Hoà có thể bật/tắt `.ua/autoUpdate` giữa chừng → T mới đọc `.ua/config.json` trước khi giả định.

## 9 · HẠN DÙNG BÀN GIAO

Bàn giao này hết đúng khi:
1. Hoà xử 2 blocker Slice 1A → có Prisma migration + ATLAS creds
2. Slice 1A bước 2 thi công xong
3. Hoà chốt phương án `autoUpdate` cho Understand-Anything
4. Có chuỗi việc mới thay Slice 1A

---

**Hết bàn giao.** T mới đọc xong file này + 5 file bắt buộc §0 = đủ để tiếp việc.
