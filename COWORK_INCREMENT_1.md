# InteriorFlow — Increment 1 (Canvas UX) · Context để review

> File này do Cowork (Claude) tạo để bàn giao cho **Claude Code** review.
> Phạm vi: chỉ nhóm **Canvas UX cao cấp**. Đã `tsc --noEmit` sạch (exit 0). Commit: `d8fabfa`.
> Ngày: 2026-07-04.

---

## 1. Mục tiêu increment này
Thêm 3 tính năng UX cho canvas node-based, **không thêm dependency mới**, bám đúng pattern sẵn có (Zustand `getState()`, theming bằng CSS variables `--bg/--panel/--border/--field/--t1..t5/--hover/--card`, icon `lucide-react`, React Flow v12 `@xyflow/react`):

1. **Command Palette** (⌘K / Ctrl+K) — tìm & chạy node/hành động bằng bàn phím.
2. **Auto-layout** — tự sắp graph theo tầng DAG (longest-path), tự viết, không dùng dagre.
3. **Snap-to-grid** — hít node vào lưới 16px khi kéo.

---

## 2. File thay đổi

| File | Loại | Nội dung |
|---|---|---|
| `components/CommandPalette.tsx` | **MỚI** | Command palette đầy đủ keyboard-nav |
| `lib/store.ts` | sửa | + state `paletteOpen`, `snapGrid`; + action `setPaletteOpen`, `toggleSnap`, `autoLayout()` |
| `components/FlowCanvas.tsx` | sửa | đọc `snapGrid` từ store → prop `snapToGrid` + `snapGrid={[16,16]}` |
| `components/BottomToolbar.tsx` | sửa | + 3 nút: auto-layout (▦), snap toggle (⊞), palette (⌘) |
| `app/page.tsx` | sửa | import + mount `<CommandPalette/>` (bên trong `ReactFlowProvider`) |
| `.gitignore` | sửa | + `build.log` |

---

## 3. Chi tiết kỹ thuật (điểm cần review kỹ)

### 3.1 `lib/store.ts` → `autoLayout()`
- Thuật toán: **layered layout theo longest-path** trên các node `type !== 'note'`.
  - Dựng map `preds` (predecessors) chỉ giữa flow node (bỏ edge dính note).
  - `depth(id)` đệ quy có **memo** (`layer` map) và **chặn cycle** (`computing` set → gặp cycle trả 0, không vòng vô hạn).
  - Nhóm theo layer, trong mỗi layer sort theo `position.y` cũ để **layout ổn định** (không nhảy lung tung).
  - Toạ độ: `COL=340`, `ROW_GAP=44`, gốc `(80,80)`. Chiều cao dùng `n.measured?.height ?? 210` (React Flow v12 đo được).
  - Gọi `get().snapshot()` trước khi set → **undo được**.
- ⚠️ Cần check: node **không** nằm trong DAG (đứng rời, không edge) sẽ về layer 0 → xếp chồng cột đầu. Đúng ý đồ, nhưng reviewer xác nhận có OK với UX không.

### 3.2 `components/CommandPalette.tsx`
- Toggle bằng listener global `keydown` bắt `⌘K`/`Ctrl+K` → `setPaletteOpen(toggle)`.
- Danh sách lệnh = **Hành động** (Run flow, auto-layout, fit view, snap, undo/redo, add note, mở panel, đổi theme, 3 flow mẫu) + **toàn bộ NODE_DEFINITIONS** (thêm node tại tâm viewport qua `screenToFlowPosition`).
- Filter: cho điểm `startsWith(3) > includes(2) > keyword(1)` rồi sort; gom nhóm giữ `GROUP_ORDER`.
- Keyboard trong palette: `↑/↓` (wrap), `Enter` chạy item active, `Esc` đóng, click nền đóng. Active item `scrollIntoView({block:'nearest'})`.
- `commands` useMemo deps `[centerPos, fitView, open]` — thêm `open` để **nhãn động** (`Snap lưới: BẬT/TẮT`, theme) đọc lại `getState()` mỗi lần mở. Có `eslint-disable-next-line react-hooks/exhaustive-deps` (cố ý).
- Mount trong `ReactFlowProvider` nên `useReactFlow()` (screenToFlowPosition, fitView) hợp lệ.
- ⚠️ Cần check: `runFlow` import từ `@/lib/execution` — palette gọi `void runFlow()` (fire-and-forget), khớp cách BottomToolbar/nodes đang gọi.

### 3.3 Không xung đột phím
- `FlowCanvas` keydown cũ có guard `inField` (INPUT/TEXTAREA/SELECT) → gõ trong ô search của palette **không** trigger space/v/h/delete. Phím `k` không bị `FlowCanvas` xử lý → không đụng.

---

## 4. Checklist review cho Claude Code
- [ ] `npm run build` pass (sandbox không build được do quyền mount — **chưa chạy `next build` thật**, mới chỉ `tsc --noEmit` sạch). **Ưu tiên chạy `npm run build` để chắc.**
- [ ] `npm run lint` — kiểm eslint (đặc biệt rule `react-hooks/exhaustive-deps` ở CommandPalette đã disable đúng chỗ).
- [ ] Chạy `npm run dev`, test: ⌘K mở palette; gõ "sketch"/"upscale" thêm node; "Run flow"; "auto-layout"; toggle snap kéo node thấy hít lưới.
- [ ] Auto-layout với graph có cycle (nối vòng) → **không treo**, không crash.
- [ ] Auto-layout xong bấm Undo (⌘Z) → về vị trí cũ.
- [ ] Mobile/nhỏ màn hình: palette `w-[min(92vw,580px)]` không tràn.
- [ ] Regression: undo/redo, autosave (localStorage / API `/api/flows`), drag từ Node Library vẫn chạy.

---

## 5. Lưu ý môi trường (không phải bug code)
- **Git lock thừa** do folder mở qua Cowork mount: sandbox không xoá được `.lock`. Nếu `git` báo `HEAD.lock exists`, chạy:
  ```bash
  cd ~/Downloads/interiorflow && rm -f .git/HEAD.lock .git/objects/maintenance.lock .git/objects/*/tmp_obj_*
  ```
- Từ increment sau Cowork **không tự chạy git** trong sandbox nữa.

---

## 6. Lộ trình còn lại (user đã chọn cả 4 nhóm)
- **Increment 2 — AI pipeline thông minh:** mô tả ý tưởng → tự sinh graph node; batch variations (4 phương án chọn 1); so sánh nhiều kết quả.
- **Increment 3 — Realtime & job UX:** SSE progress, ước tính credit trước khi chạy, retry/queue UI.
- **Increment 4 — Collab & trình khách:** presence cursor, comment, presentation mode.

*(Increment 1 đã xong & đang chờ user review.)*
