# STATUS — InteriorFlow

> ⚠️ **Mọi SHA/trạng thái trong file này phải verify bằng git, không chép từ brief hay memory. Git là sự thật duy nhất.**
> ⚠️ **Sản phẩm THẬT hiện tại là CAD/floor-plan editor + trình kiểm tra quy chuẩn TCVN** (DCEL, hatch merge, room area checker, route `/cad-editor`) — **KHÔNG** phải node-canvas + fal.ai render như brief gốc mô tả. **Tin file này, đừng tin brief.**

## Vừa xong
Fix DCEL hatch-boundary trả `null` cho phòng giáp tường ở nút chữ T (T-junction) — DCEL liệt kê mặt toàn cục thay vì dò cục bộ.

**Kiểm chứng (chạy lại, không đoán):**
- `npx tsc --noEmit` → sạch (exit 0)
- `lib/cad/hatch.test.ts` → **33/33 ok**
- `lib/cad/standards/checker.test.ts` → **15/15 ok**
- checker.test.ts [8] (E2E logic /cad-editor): bắt **đúng 1 vi phạm thật** — Bếp 5.7m² < 10m² (TCVN 4451:2012)

**SHA thật (sau `git pull --rebase`):**
- `origin/main` HEAD = **`fd4718d`** — `fix(cad): dò biên HATCH đúng cho phòng có vách chữ T` (đã push)
- `c9b3961` = `merge feat/cad-type-anywhere` (việc TRƯỚC, đã có sẵn trên origin)

## Đang làm — nhánh tích hợp `feat/present-layout-ml-p1` (local, CHƯA push/main)
- **Foundation (commit `539c960`)**: Present engine 5 module (detect-regions/standards/layout-check/region-layout/reference-layout)
  + guardrail toast + region path cắm PresentEditor; ML pha 1 tất định 3 module (operator-profile/color-psychology/grid-geometry).
- **Đã MERGE 3 nhánh agent** (HEAD `25eae60`), verify từng nhánh + **chạy lại TOÀN BỘ 348 test sau merge = pass, tsc 0**:
  · auto-layout refine (`cf02262`): kẹp 21→ít ô + biên độ min–max ảnh/tiêu đề/body (region-layout 20 test).
  · PCCC/Neufert (`107ffd2`): QCVN06:2022/2023 + NFPA/IBC + Neufert vào `lib/cad/standards/` (intl 22), checker 15 giữ.
  · multi-sheet (`050fdaf`+fix `c551d3d`): tab ≤5 sheet CAD+Present, verify browser (export còn nguyên); tôi tự vá 1 React warning SheetTabBar.
- **SPRINT MODE (user GO)**: roadmap 4 sprint theo Master Directive (6 agent ảo). Quyết định đã khoá:
  Perceptron THẬT (learning-to-rank, degrade heuristic) · foldable Find N6 test on-device · installer cả 3 unsigned (.exe cần máy Win) · auth tái dùng + Remember Me · PWA host Vercel.
- **AUTH ĐÃ CHỐT (user, 12/07)**: tài khoản = CHỈ Google OAuth domain @ttt.vn (ưu tiên) + admin cấp tay; register công khai KHOÁ. Quên mật khẩu = admin reset tay, KHÔNG build luồng email. Supabase = Agent 4 tự dựng Sprint 4 (user chưa có project).
- **Sprint 0 XONG**: audit fixes A1/B1/C1 merged (`d9070d2`, 348 test pass) · dọn 4 worktree merged · WIP ml-hooks cứu vào `348908a`.
- **Sprint 1 — Agent 1 `feat/ml-p1-hooks` ĐÃ MERGE** (integrator verify: 413 test/17 file, tsc 0, 21 caller hết dead-code, không đụng hatch/query):
  · A-2 CAD `bfb219c`: operator vào LayoutSpec + panel Kiểm chuẩn (explainable; mặc định getAllRules() y cũ, Bếp 5.7m² vẫn bắt).
  · A-3: D2 'neufert' → residential/hospitality/office; D1 fromDoc dò ROOM-SET qua findRoomLabels (checker hành vi không đổi).
  · A-2 Render `9009d4e`: gu.ts mergePalette → gom cụm LAB, GuProfile.moods, guToPrompt nối mood.
  · A-4 `d35474c`: bridge Render→Present (handoff.ts sessionStorage + mem fallback, consume-once).
  · A-2 Present `ebc818a`: detectRegions trả gutter; suggestTemplate nhận grid; dây sống refGrid ở PresentEditor.
  · A-5 `05db2b5`: pairwise-perceptron.ts (user duyệt learning-to-rank; degrade; serialize) — UI feedback Sprint 2.
- **Sprint 1 — Agent 5 `feat/access-journey` XONG chờ merge** (2 commit c258855+519ea7e): gỡ intro (Login→Gallery), Remember-Me + chính sách @ttt.vn/khoá-register, resume theo user, routing first-time/returning, SmartTour. Integrator verify: tsc 0, test lõi pass, browser gallery-không-intro OK.
- CHƯA làm: bỏ hardcode `'DETECH · CONCEPT'`; template tĩnh từ file thư viện; heavy-ML pha 2 (embedding/detector — báo rủi ro trước).
- Docs: `DIAGNOSIS.md`, `ML-GU-ENGINE-PROPOSAL.md`, `MULTI-SHEET-PROPOSAL.md`, `LOGIC-AUDIT.md`.

## Nợ kỹ thuật
- **Hydration warning** — `lib/kbd.ts:11` tính `IS_MAC` phía client (`navigator`). Tooltip Undo trong `components/cad/CadToolbar.tsx:182` render `Ctrl+Z` ở server nhưng `⌘Z` ở client Mac → lệch hydration. Chỉ nằm trong thuộc tính `title`, **cosmetic, chưa sửa.**

## Bị chặn — chờ chủ dự án quyết (KHÔNG tự khởi động)
- **Intro screen** — chờ hình/video.
- **ML Gu Engine** — ⚠️ chồng lấn với 2 app khác của chủ dự án, **chưa được phép tự build.**
- **"API team" spec** — chờ spec.

## Quy tắc session
1. Đọc **STATUS.md** trước tiên, không bới lịch sử chat.
2. Xong task thì **cập nhật STATUS.md TRƯỚC** khi báo cáo.
3. **Không tự merge + push lên `main`** khi chưa có OK của chủ dự án.
4. Hạng mục "bị chặn" thì **không tự khởi động.**
5. Chỉ sửa **đúng phạm vi được giao**; bug ngoài phạm vi ghi vào "Nợ kỹ thuật".
