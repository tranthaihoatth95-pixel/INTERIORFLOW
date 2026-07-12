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
- Lưu ý: brief ghi HEAD = `2dbab5a` (merge fix/hatch-t-junction) — rebase đã làm phẳng merge đó thành `fd4718d`. Nội dung fix không đổi.

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
