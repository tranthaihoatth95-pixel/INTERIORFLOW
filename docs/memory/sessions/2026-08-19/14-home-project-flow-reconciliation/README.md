# 14 · Home/Project-Flow Reconciliation + Golden Loop coverage — 19/08 khuya muộn

> Phiếu nạp: "Integrate → Home/Project Flow → Golden Loop". ⓪ kết luận B (reality mới hơn
> handoff nhưng ánh xạ được — backup remote đã sync, Capability Matrix đã vá delta).
> LUẬT: CẤM build Home mới — bảng dưới là điều kiện bắt buộc trước khi đụng Home, không phải
> gợi ý. Hai audit read-only (Explore) chạy song song, MAIN spot-check 7 claim trọng yếu — khớp 100%.

## Bảng A — Home/Project-Flow (audit ①, MAIN đã spot-check)

| Mảnh | Nền | Nơi sống | Trạng thái | Hành động |
|---|---|---|---|---|
| ProjectProfile | có | `schema.prisma:150` + `ProjectOverviewCard.tsx` | LIVE | REUSE |
| PresenceRow | có | `components/ui/PresenceRow.tsx` → `ProjectOverviewCard.tsx:1331` | LIVE | REUSE |
| lastStage | có | `lib/shell/last-stage.ts` (localStorage per-project) | LIVE | REUSE |
| ResumeWork widget | có, mount thật | `DongStudioHome.tsx:355-386` ← `lib/resume.ts` | LIVE **+ continuity bug** | REUSE + fix (CONTINUITY-1 đang chạy) |
| Resume chung | có | `lib/resume.ts` (RESUMABLE_ROUTES 4 route cũ) + `ResumeTracker.tsx` | LIVE, thiếu 1 field | EXTEND — xem CONTINUITY-1 |
| **Project→Workspace→Canvas+Timeline (C4)** | **KHÔNG** | schema chỉ có `Project→Flow[]` phẳng, 0 model Workspace/Canvas/Board/Doc | **TRUE-MISSING** | NEW có điều kiện — architecture decision, cần Hoà (xem mục "Chờ Hoà") |
| Task model | có | `schema.prisma:574` + TaskContext Link (`stage?/workspaceId?/entityId?`) | LIVE (field), context-link chưa có UI click-through ngoài 3 chặng thiết kế | EXTEND |
| Review (lib/review) | có | `ReviewPanel.tsx` mount `AppShell.tsx:191` | LIVE (standards checker) — ⚠️ KHÁC NGHĨA với "Review approval workflow" phiếu mô tả (xem Bảng B) | REUSE (đúng vai nó có) |
| Activity/feed (NewsFeed) | UNKNOWN | `components/home/widgets/NewsFeed.tsx` | chưa đủ bằng chứng nguồn dữ liệu (nghi tĩnh một phần) | cần audit riêng, không kết luận |
| VitalsPill | có | `AppChrome.tsx:347` | LIVE | REUSE |
| VitalsGesturePanel | có, mồ côi | `VitalsGesture.tsx:251`, importer duy nhất `StageSwitcher.tsx` — **StageSwitcher bản thân cũng KHÔNG mount ở đâu** (gỡ 17/08 theo chốt Hoà, xác nhận comment `AppChrome.tsx:334`) | ORPHAN cả 2 tầng | CHỜ HOÀ (H2 — vị trí Vitals mới, đã chốt hướng 16/08, chỉ cần áp dụng) |
| Files/Thư viện rail nấc 320 | có, khai chỗ chưa nối | `RailDieuHuong.tsx:36-39` tự nhận để trống | DISCONNECTED (chi tiết) | EXTEND — chỗ đã chờ sẵn |
| route/deep-link (`lib/scope-core.ts`, `lib/project-scope.ts`) | có | `useProjectScopeSync` | LIVE | REUSE |
| `LegacyStageRedirect` | có, đúng vai | `LegacyStageRedirect.tsx:33-48` | LIVE — KHÔNG phải nguồn bug (nó tra đúng mọi nguồn có) | REUSE |
| focusEntity | có | `lib/tasks/focus-entity.ts`, đọc ở cả 3 chặng | LIVE | REUSE |
| stage/mode persistence | có | 4 key localStorage riêng biệt, không trộn | LIVE | REUSE |
| openFlow | có | `lib/workspace.ts:27` | LIVE, đúng như Map cũ mô tả (0 WHO/revision/decision) | ghi nhận, chờ Wave Workspace |
| route `/projects/[id]` gốc | KHÔNG tồn tại | chỉ có sub-route (cad/notebook/overview/photo/present/render) | xác nhận Map cũ đúng | ghi nhận |
| `/projects/[id]/overview` ngoài AppShell | xác nhận lệch khuôn | không import AppShell, tự vẽ header riêng | nợ kiến trúc thật | ghi nhận, chờ Wave |

## Bảng B — Context Pointer / Task-Review / External-Model (audit ②, MAIN đã spot-check)

| Mảnh | Trạng thái | Ghi chú |
|---|---|---|
| **TaskContext Link** (`Task.stage/workspaceId/entityId`) | **LIVE, hai chiều** (đọc ở CadEditor/PresentEditor/Render3DModeSkeleton; ghi ở CadCanvas/Render3DModeSkeleton) | primitive "tới nguồn" chuẩn nhất hiện có |
| ReviewPanel→goto entity | LIVE (2D) / DISCONNECTED (3D, deck) | deck tự khai "chưa nhảy được" |
| ChatMessage | ORPHAN — 0 projectId/entityId | nợ cũ 08/08 vẫn còn |
| Comment/issue-neo-vào-vật | **TRUE-MISSING** — 0 Prisma model | |
| `rev` optimistic lock | field sống 4 model, **7 chỗ tăng tay, 0 chỗ dùng làm `where` check** | data-integrity risk thật — GAP enforcement xác nhận đúng Blueprint |
| Import DWG/DXF | LIVE, dừng ở **LEVEL 2 COORDINATION** (suy elementType, cờ inferred) — không có LEVEL 1 (provenance tách biệt) hay LEVEL 3 (promote tường minh) | |
| IFC/Revit ingest | TRUE-MISSING (chỉ có UI skeleton `RevitSummaryPanel.tsx` tự khai chưa làm) | |
| Where-used material | LIVE nhưng hẹp — `inspectMaterialImpact()` chỉ soi 1 Doc, cờ BOQ là boolean không trỏ row | |
| `MasterTool` | xác nhận KHÔNG ai hồi sinh (grep 0). `ToolWindow` vẫn đơn nhất, đúng chốt 16/08 | |
| **"Review" 2 nghĩa trùng tên** | ⚠️ `lib/review/` = standards checker tất định (LUẬT) + gợi ý AI (GÓP Ý, cố ý khoá). Phiếu mới mô tả "Review = approval workflow accept/reject" — **KHÔNG PHẢI CÙNG THỨ**. 0 field nối Task↔Review, 0 state accept/reject nào tồn tại | **TRUE-MISSING thật** cho nghĩa "approval workflow" — tên trùng dễ gây hiểu lầm khi lập kế hoạch |

## Golden Loop coverage (Part L của phiếu)

CAPTURE→GROUND→AUTHOR→EXPLORE→DECIDE→COORDINATE→COMMUNICATE→REVIEW→REVISE→RELEASE→(lặp)

| Checkpoint | Trạng thái | Bằng chứng |
|---|---|---|
| Nguồn → 2D truth | LIVE | CAD editor + Doc + disk-sync `.idf` |
| 2D → 3D design | PARTIAL | docToObjScene derived, BuildRecipe LIVE; Node↔3D "một bộ lệnh hai lối" chưa hoà giải hết |
| → decision | **BLOCKED** | DesignDecision model TRUE-MISSING (Q8, Wave 3) |
| → Trình chiếu | LIVE | PresentEditor + H4 6 loại |
| → review | PARTIAL | reviewDeck LIVE (R7, chuẩn LUẬT) — nghĩa "approval" TRUE-MISSING |
| → tới nguồn (traceability) | PARTIAL | TaskContext Link LIVE; where-used material hẹp; Comment/issue TRUE-MISSING |
| → sửa → downstream update/stale | PARTIAL | `inspectMaterialImpact` LIVE nhưng 1-Doc; `rev` field sống, 0 enforcement |
| → release | PARTIAL | Gói Hồ Sơ Sống LIVE; ProjectRevision/Frozen TRUE-MISSING (Q6, Wave 3) |
| → đóng/mở lại, resume đúng context | LIVE **sau CONTINUITY-1** (bug thật đã xác nhận + đang vá) | ResumeWork + LegacyStageRedirect + lastStage |

**6 biến thể** (không cần code ngay, chỉ trạng thái):
1. External revision→impact→sửa: BLOCKED (IFC/Revit ingest TRUE-MISSING)
2. Reference image→proposal→Promote: PARTIAL (DistillEngine LIVE 1 caller, CuaSoThaoLuan ORPHAN chờ H3)
3. ProductSpec đổi→usages/BOQ kiểm soát: PARTIAL (where-used hẹp, 1 Doc)
4. Senior task→junior→review→accept: PARTIAL — **LIVE tới "junior sửa"**, đứt tại "submit review" (TRUE-MISSING approval workflow)
5. Multi-space/project resume: LIVE (4 key localStorage riêng biệt, không trộn) — nhưng KHÔNG có tầng Workspace/Canvas thật (chỉ Flow phẳng)
6. Brainstorm→Decision→Task/genealogy: BLOCKED (CuaSoThaoLuan ORPHAN chờ H3; DesignDecision TRUE-MISSING)

## Chờ Hoà (mới, ngoài H1-H8 cũ)

- **H9 — Workspace/Canvas model**: chốt C4 19/08 (Project→Workspace→Canvas+Timeline) CHƯA có nền
  DB (chỉ `Flow` phẳng). Đây là NEW thật — cần Hoà quyết trước khi bất kỳ ai code tầng Workspace,
  vì nó đụng schema + mọi route hiện tại đọc `flowId`.
- **H10 — "Review" đổi tên hay giữ hai nghĩa?**: `lib/review/` (LUẬT+GÓP-Ý) khác hẳn "Review
  approval workflow" (Senior/Junior accept-reject) phiếu mới mô tả. Giữ nguyên `lib/review/`,
  đặt tên MỚI cho approval workflow (tránh đẻ khái niệm ma lần thứ tư — sau `master tool`/`KB-5`/
  `.idfnotes`) — đề xuất tên chờ Hoà, KHÔNG tự đặt.
- **H11 — `rev` enforcement**: thêm `where: { id, rev: expectedRev }` vào 7 route — rẻ, không đụng
  kiến trúc, có thể làm ngay khi Hoà gật (không cần NEW, chỉ EXTEND route có sẵn).

## HẠN DÙNG

Bảng này hết hạn khi: Hoà quyết H9/H10 · CONTINUITY-1 đóng · Workspace model bắt đầu code.
