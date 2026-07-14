# CHANGELOG — InteriorFlow (lịch sử đã xong; KHÔNG đọc mỗi đầu phiên — chỉ khi được yêu cầu)

## 14/07 — Cổng Sprint 2 PASS (nhánh tích hợp `feat/present-layout-ml-p1`, HEAD `bcbbce1`)
Merge `da49cf3` (ml-ui) → `b70ffa3` (ui-motion) → `bcbbce1` (docs). **492 test/20 file, tsc 0.**
Verify browser (PORT 3700, host 127.0.0.1 tránh cookie phiên thật; admin seed `integrator@ttt.vn`): 7 PASS · 1 SKIP.
1. Login Liquid Glass PASS (backdrop saturate(1.8) blur(40px); 4 preset nền Đêm ấm/Mực đêm/Đá ấm/Lụa sáng + upload; Ghi nhớ; không intro; light+dark).
2. Login → Gallery PASS (register vẫn khoá; seed-admin idempotent).
3. Unified Dock PASS (`.if-dock` kính mờ đồng nhất Header+StudioBar; StageEnter/Veil mượt; 0 lỗi console).
4. /cad-editor PASS (detect "residential (59%) — 1 giường"; checker bắt Bếp 5.7m² < 10m² TCVN 4451:2012 cả với bộ residential).
5. /present-editor PASS (LayoutShelf 21 card + Nhận/Bỏ + tooltip; guardrail toast; Export menu đủ PDF·PPTX·PNG).
6. Nút "Đưa sang Present →" SKIP (cần flow AI render thật tốn credit; code 11/11 test + verify trước đó).
7. FoldableDualPane PASS (`?dualpane=1` ≥840px dual, thu 700px về single giữ state; sheet-persist IDB log 13.6KB).
8. Console PASS (chỉ hydration ⌘Z cũ).

### Sprint 2 chi tiết (3 nhánh, 2 đợt — đợt 1 ngắt session-limit, resume theo danh sách user xác nhận)
- `feat/journey2` (Agent 5): register 403 kể cả DB trống (`scripts/seed-admin.ts` thay bootstrap) · grandfather Google 3 ca (auth-policy 9 test) · **multi-sheet persistence IndexedDB** `userId::route` (lib/sheets-persist.ts, autosave 1.2s, resume.sheetId; đo 15.2KB CAD · 226.5KB deck+ảnh-nhúng) · gallery: upload bìa, member icon owner, >8 flow → grid+search.
- `feat/ml-ui` (Agent 1): perceptron feedback UI tại LayoutShelf (lib/gu/feature-dict.ts + Nhận/Bỏ + re-rank ≥10 cặp + tooltip; verify dark-cover 3→1 sau 10 cặp, sống qua reload) · nút "Đưa sang Present →" (NodeExtras → stashPresentHandoff → toast) · lib/cad/gu-features.ts (occupancy 8×8, adjacency, typology 5 nhãn — additive vào classifyOperator) · ROOM_TERMS/subject vào gu.ts.
- `feat/ui-motion` (Agent 2, bị user dừng ở bước verify → integrator verify hộ): Liquid Glass + LoginBackdrop + StageTransition (wallpaper/veil) + Unified Dock + FoldableDualPane.
- ⚠️ Sự cố 13/07 (ĐÃ SỬA): agent verify ghi đè graph flow "Render test" trên dev.db → restore từ FlowVersion snapshot 11/07, bản-bị-đè giữ version 4. Bài học: browser pane + cookie localhost dùng chung → verify TUẦN TỰ.

## 13/07 — Cổng Sprint 1 PASS (`bb31fbf`, 413 test/17 file)
- `feat/ml-p1-hooks` (Agent 1): hết dead-code ML pha 1 (21 caller) — operator vào LayoutSpec + panel Kiểm chuẩn explainable · gu.ts mergePalette→LAB + moods + prompt · detectRegions trả gutter → suggestTemplate · bridge Render→Present (lib/present-editor/handoff.ts) · lib/gu/pairwise-perceptron.ts (18 test, degrade <10 cặp).
- `feat/access-journey` (Agent 5): gỡ intro (Login→Gallery) · Remember-Me (cookie phiên vs 30d) · chính sách @ttt.vn + khoá register · resume theo user (lib/resume.ts) · SmartTour 4 bước.
- Browser E2E nhánh gộp: LoginScreen mới + operator detect sống; 0 lỗi console mới.

## 12/07 — Nền tảng (trước Sprint mode)
- **Present layout engine** (5 module, khởi từ snippet detectRegions của user): detect-regions (sửa bug findGaps bỏ khe cuối) · standards.ts DECK_STANDARDS (chuẩn định lượng từ agent nghiên cứu Gamma/Canva/Figma) · layout-check (guardrail trống/chật/tràn, toast cắm PresentEditor) · region-layout (lưới→slide gán vai trò, kẹp budget) · reference-layout (ảnh mẫu→deck, augment).
- **ML Gu pha 1 tất định** (3 module): operator-profile (block×room×text) · color-psychology (LAB+ΔE+tâm-lý-màu) · grid-geometry (gutterBands+patternIconHint). Đề xuất đầy đủ: docs/ML-GU-ENGINE-PROPOSAL.md.
- **3 nhánh nghiên cứu**: autolayout-refine (kẹp 21 ô + min-max) · PCCC/Neufert (QCVN 06:2022/SĐ1:2023 + NFPA/IBC + neufert.ts, standards-intl 22 test) · multi-sheet (≤5 sheet CAD+Present + LOGIC-AUDIT.md).
- **Sprint 0**: audit fixes A1 (pill Present) B1 (handoff mất node) C1 (stageDone theo user) merged `d9070d2`.
- **DIAGNOSIS.md**: khám toàn repo (10 route 200; xuất PDF/PPTX/PNG/DXF thật; mock khi thiếu key; drift IntegrationAccount).
- Sự cố flow "Render test" + khôi phục: xem mục 14/07.

## Trước 12/07
Xem git log (`fd4718d` fix hatch T-junction · `c9b3961` type-anywhere · các merge trước đó) — main/origin đứng ở `3265db1`.
