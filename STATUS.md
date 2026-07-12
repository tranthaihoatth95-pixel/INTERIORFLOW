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

## Đang làm — Present layout engine (CHƯA commit)
- **5 module mới, phụ-thêm, KHÔNG đụng đường demo export** (46 test pass, tsc sạch):
  `detect-regions.ts` (lưới từ ảnh, sửa bug findGaps — 13), `standards.ts` (`DECK_STANDARDS`),
  `layout-check.ts` (`evaluateDeck` bắt trống/chật/chữ-tràn — 14), `region-layout.ts` (lưới→slide gán vai trò, kẹp chuẩn — 10),
  `reference-layout.ts` (ảnh mẫu→deck theo lưới — 9). Export thêm `parseBlocks` từ content-deck.
- **Đã cắm 2 chỗ** vào `PresentEditor.tsx` (+ `GenerateFlow.tsx` thêm `attachRefs`):
  (1) guardrail toast cảnh báo bố cục sau khi dàn; (2) có ảnh reference → dàn theo LƯỚI ảnh (region), không có → fallback template.
  **Verify browser OK**: toast hiện đúng, regression no-ref dàn 3 slide, ảnh thư viện thật→21 ô, 0 lỗi console (RSC prefetch warning của Next dev — không liên quan).
- **TEST THỰC TẾ (theo ý user)**: ảnh moodboard bận → detectRegions ra **21 ô nhỏ** → region-layout đổ ít, dư ô rỗng.
  → NỢ: `buildSlideFromRegions` cần **kẹp số ô về `budget.cells`** (gộp ô nhỏ vào ô lớn) để slide gọn. Chưa làm.
- CHƯA làm: bỏ hardcode `'DETECH · CONCEPT'`; cơ chế template tĩnh từ file thư viện tải lên (user yêu cầu).
- `docs/ML-GU-ENGINE-PROPOSAL.md` — đề xuất. **User DUYỆT build ý-3 (gồm ML nặng), quan sát rủi ro.**
  Đang chạy **agent PHA 1 (tất định)** — chỉ thêm file mới. Heavy-ML (embedding/detector) pha sau, báo trước.

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
