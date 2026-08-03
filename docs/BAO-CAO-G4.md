# BÁO CÁO G4 — Kệ Thư viện (Master Library)

> Phiên G4, worktree `~/Downloads/interiorflow-g4` (nhánh `nhanh-g4`). Đọc theo thứ tự
> `CLAUDE.md` → `STATUS.md` → `docs/00-CHOT.md` → `docs/SPEC-STAGE-LIBRARIES.md` →
> `docs/SPEC-DESIGN-SYSTEM-IF.md` → `docs/mocks/library-mock-note.md` (đích Hoà đã duyệt).

## ⚠️ Việc ngoài phạm vi G4 lọt vào tool call giữa phiên

Giữa lúc đang làm, có 1 chỉ đạo tới nói về `PresentEditor.tsx`/`Toolbar.tsx`/nút "Ẩn hàng loạt"/cụm
HIỆU ỨNG, yêu cầu ghi báo cáo vào `docs/BAO-CAO-PHU.md`. Tên file báo cáo và các file đích đều
KHÔNG thuộc vùng file cứng G4 (`components/library/**` · `lib/library/**` · `app/library/**` ·
`docs/BAO-CAO-G4.md`) — nhiều khả năng chỉ đạo đó dành cho phiên khác (`nhanh-phu`, xem
`~/Downloads/interiorflow-phu`). **G4 KHÔNG động vào các file đó**, chỉ ghi chú lại đây để Hoà biết
và tự điều hướng đúng phiên.

## Đã build gì

Route mới `/library` — Kệ Thư viện, layout 3 khu đúng mock đã duyệt:
- **Trái** (`LibraryNav.tsx`, ~210px): Dashboard · Dự án · Files · **Master Library (active)** ·
  Cài đặt · Đăng xuất · dải "Tích hợp — sắp có".
- **Giữa**: tiêu đề + sub-caption · tab **Tất cả · CAD · Render · Present** · nút **"+ Publish lên
  kệ"** (accent, phải) · dải thả mô phỏng (demo cơ chế kéo) · các shelf cuộn ngang theo chặng đang
  mở (kệ chung "Vật liệu" xuất hiện ở mọi tab, không lặp trong "Tất cả").
- **Phải** (`LibraryInspector.tsx`, ~270px): preview gradient · tên/loại/badge phạm vi · người đăng
  + version + số lần dùng · nút to hành động chính (đổi nhãn theo cơ chế item) · khối chú giải 4
  mức phạm vi · tab **Mô tả / Bình luận** (bình luận thêm được, lưu local).

**Dữ liệu**: 100% mock JSON cục bộ (`lib/library/mock-data.ts`), theo đúng nội dung mock note đã
duyệt cho Render (6 form lập luận + moodboard/preset + 3 swatch vật liệu), bổ sung shelves cho
CAD (5 kệ) và Present (5 kệ) theo bảng `SPEC-STAGE-LIBRARIES.md` để 2 tab đó không rỗng. Không đụng
Prisma/DB.

**Cơ chế** (`lib/library/local-state.ts`, localStorage `interiorflow.library_g4.local_state_v1`):
- **Kéo = instantiate**: nút "＋ Kéo lên canvas để dùng" (hoặc icon nhanh trên thẻ, hoặc kéo thật
  — `draggable` HTML5 — thả vào dải mô phỏng) → cộng dồn "số lần dùng" cục bộ, toast xác nhận
  "không đụng bản gốc". Canvas THẬT (CAD/Render/Present) chưa nối — xem mục "Cần nối tay" dưới.
- **Áp = preset**: cùng cơ chế trên nhưng nhãn/icon đổi theo `item.mechanic === 'ap'` (hatch,
  preset render, vật liệu matId) — "⟳ Áp preset này".
- **Publish = chờ duyệt**: modal (portal ra `body`, kính lỏng `backdrop-filter`) nhập tên/chặng/
  loại/phạm vi/mô tả → ghi vào hàng "chờ duyệt" cục bộ, **KHÔNG** tự lên kệ chung (đúng
  `SPEC-STAGE-LIBRARIES.md`: "chủ studio duyệt"). Chip "N chờ duyệt" hiện cạnh nút Publish.

**Token/motion**: dùng lại nguyên bộ CSS var đã có toàn app (`--accent #6a57f5`, `--radius-*`,
`--shadow-*`, `--mat-*`, `--blur`, `--ease-apple`…) — **không tạo token song song** vì giá trị hiện
có đã khớp `SPEC-DESIGN-SYSTEM-IF` (accent trùng hex, bo góc cùng nhịp Apple). Badge 4 phạm vi dùng
đúng 4 cặp hex trong mock note (không phải CSS var — cố định theo mock, không đổi theo theme, vẫn
đọc được cả sáng/tối — đã verify). Publish modal portal ra `body` (`react-dom` `createPortal`) +
`lib/useDismissable` — theo đúng LUẬT PORTAL học từ bug K4 (`docs/00-CHOT.md`).

## File mới (đúng vùng cứng, KHÔNG sửa file có sẵn nào)

```
lib/library/types.ts          — kiểu dữ liệu + SCOPE_META/STAGE_META
lib/library/mock-data.ts       — 13 shelf, ~55 item mock (CAD/Render/Present/kệ chung)
lib/library/local-state.ts     — hook localStorage: usage/publish-queue/comments
components/library/ScopeBadge.tsx
components/library/ShelfCard.tsx
components/library/ShelfSection.tsx
components/library/CanvasDropDemo.tsx
components/library/LibraryInspector.tsx
components/library/LibraryNav.tsx
components/library/PublishModal.tsx
components/library/LibraryToast.tsx
components/library/LibraryShell.tsx
app/library/page.tsx
docs/BAO-CAO-G4.md             — file này
```

`app/library/ingest/page.tsx` đã tồn tại từ trước (không đụng).

## Verify đã chạy (browser thật, không phải báo cáo chép tay)

- `node_modules/.bin/tsc --noEmit -p .` → **0 lỗi** trên toàn repo (kể cả sau khi phải
  `npm install` vì worktree này chưa từng cài — `node_modules` không tồn tại lúc bắt đầu).
- `next lint` — không có warning/error nào trong `components/library|lib/library|app/library`
  (chỉ có 2 warning `no-img-element` cũ ở `app/library/ingest/page.tsx`, không phải việc này).
- `npm test` → **exit 0**, toàn bộ suite pass (18/7/4/34/14 ok, 0 fail) — không có test nào của
  G4 (mock-only, không có logic đủ phức tạp để cần unit test riêng) nhưng xác nhận không phá gì.
- Dev server riêng (`next dev -p 3004`, không đụng `.claude/launch.json` — file đó nằm ngoài vùng
  cứng G4) → verify `/library` qua `127.0.0.1:3004` (đúng LUẬT MÁU, không dùng `localhost`).
  - Bắt được + sửa 1 bug hydration thật: `ShelfCard` lồng `<button>` icon-nhanh vào trong
    `<button>` thẻ ngoài → HTML không hợp lệ → React hydration mismatch. Đổi thẻ ngoài thành
    `div[role="button"][tabIndex=0]` + `onKeyDown` Enter/Space (giữ a11y).
  - Bắt được + sửa 1 bug thật khác: `PublishModal` chỉ đọc `defaultStage` ở lần mount đầu
    (`useState`), đổi tab CAD/Render/Present rồi mở Publish vẫn giữ stage cũ. Thêm `useEffect`
    reset `stage` + các field khác mỗi khi `open` bật.
  - Sau 2 fix: click chọn thẻ → inspector cập nhật đúng · nút hành động chính → toast + số lần
    dùng cộng dồn, **bền qua reload** (tab mới, localStorage giữ đúng 205→206) · tab CAD/Render/
    Present/Tất cả (nhóm theo chặng) đều render đúng nội dung · Publish modal điền tên → submit →
    chip "1 chờ duyệt" xuất hiện, stage mặc định đúng tab đang mở · tab Bình luận thêm bình luận
    cục bộ, hiện ngay · dark theme (`data-theme=dark`) — panel/card/bg đổi đúng qua CSS var có
    sẵn, badge phạm vi vẫn đọc được (màu cố định theo mock, không theo theme). Console sạch, không
    còn warning nào sau 2 fix trên (đã mở tab trình duyệt MỚI để loại nhiễu log HMR cũ).
  - Đã dừng dev server thủ công (`pkill`) sau khi verify xong — không để tiến trình rác.

## Cần nối tay (code chính, sau khi merge) — G4 KHÔNG tự sửa vì ngoài vùng file cứng

1. **Canvas thật**: nút/kéo "instantiate" hiện chỉ mô phỏng (toast + đếm cục bộ). Nối thật cần
   canvas CAD/Render/Present đang mở nhận sự kiện thả (`text/library-item-id` đã set sẵn trong
   `dataTransfer`, xem `ShelfCard.tsx`/`CanvasDropDemo.tsx` để lấy đúng format).
2. **LibraryNav**: "Dashboard" (`/`) và "Cài đặt" (`/settings`) trỏ route thật. "Dự án"/"Files"/
   "Tích hợp"/"Đăng xuất" đang mờ/vô hiệu — chưa có route thật (File Manager chưa build theo
   `CHOT-FILEMANAGER-SETTINGS-2026-08-02.md`) hoặc cố tình không wire (Đăng xuất — tránh mất phiên
   khi verify, đúng luật STATUS.md mục Quy tắc session #2). Khi có shell/AppChrome thật cho khu
   này, nên thay hẳn `LibraryNav.tsx` bằng nav dùng chung, không giữ bản riêng.
3. **Publish → duyệt thật**: hàng "chờ duyệt" hiện chỉ nằm trong localStorage của trình duyệt
   (`interiorflow.library_g4.local_state_v1`), không đồng bộ giữa người dùng/thiết bị. Cần backend
   (bảng mới hoặc field trên bảng có sẵn) + UI duyệt cho "chủ studio" — đúng 1 trong 3 câu treo của
   `SPEC-STAGE-LIBRARIES.md` ("ai publish").
4. **Kệ chung còn thiếu**: mock/spec liệt kê kệ chung gồm Vật liệu · Brand Kit (dự án) · Asset/ảnh
   (File Manager) · Font·màu·theme. G4 chỉ build **Vật liệu** (đúng nội dung mock note chi tiết đã
   duyệt) — 3 mục còn lại cố tình để trống, tránh tự chế nội dung khi chưa có nguồn thật (Brand
   Kit/Asset cần đọc dữ liệu dự án thật, Theme cần đọc Settings thật) — không phải thiếu sót quên,
   là quyết định phạm vi.
5. **Real matId**: 3 swatch vật liệu trong `mock-data.ts` là dữ liệu mock — khi nối ATLAS thật,
   thay bằng fetch `app/api/atlas-materials` (đã có sẵn) thay vì mảng tĩnh.

## SẴN SÀNG COMMIT

Worktree này không tự `git commit` được (đúng luật G4). Lệnh cho Hoà chạy tay:

```bash
cd ~/Downloads/interiorflow-g4
git add lib/library components/library app/library/page.tsx docs/BAO-CAO-G4.md
git commit -m "feat(library): G4 — Kệ Thư viện (Master Library), route /library

3 khu theo mock đã duyệt (nav trái · kệ giữa lọc theo chặng · inspector phải).
Mock data cục bộ (CAD/Render/Present/kệ chung), cơ chế kéo=instantiate ·
áp=preset · publish=chờ duyệt (localStorage, chưa DB). Token/motion dùng lại
CSS var app-wide sẵn có (khớp SPEC-DESIGN-SYSTEM-IF). Portal cho panel nổi
(publish modal, toast) theo luật K4. tsc/lint/test sạch, verify browser thật
qua 127.0.0.1:3004 (2 bug hydration/stage-sync bắt và sửa trong lúc verify)."
```

**Lưu ý phụ (không phải việc G4, chỉ ghi nhận)**: `docs/mocks/library-mock-note.md` đang là file
untracked trong worktree này (`git status` báo `??`) — có thể do phiên trước drop vào chưa commit.
G4 chỉ ĐỌC file này, không tạo/sửa, không đưa vào lệnh commit trên — Hoà kiểm nếu cần giữ lại.

## Ảnh chụp verify

Đã chụp 6 màn hình trong lúc verify (Render tab mặc định · card selected + inspector · CAD tab ·
Publish modal mở · sau khi publish (chip chờ duyệt) · Tất cả tab nhóm theo chặng · dark theme) —
không đính kèm file ảnh vào repo (đúng luật không rác `docs/`), mô tả bằng chữ ở mục Verify trên.

---

# CHỐT PHIÊN G4 — 03/08/2026 (theo SO-KIEM-TONG.md §4)

> Phiên G4 đóng tại đây. Phiên G4 MỚI: đọc `docs/SO-KIEM-TONG.md` (trên main) → `docs/00-CHOT.md`
> → file này, đúng thứ tự §4.1. Việc kế tiếp nhận từ §3 sổ tổng: **MaterialSphere quả cầu vật liệu**
> (`SPEC-VAT-LIEU-PBR-IF` §2), rồi Mood+Collab G2.

## Nhánh `nhanh-g4` tại thời điểm chốt

HEAD = `245b96b`, cây sạch, 37 commit chưa push (push kèm lần chốt này). Các cụm việc phiên này,
mới → cũ:

| Cụm | Commit | Báo cáo chi tiết |
|---|---|---|
| **Mode Vẽ 3D (G3)**: CommandPanel 5 tab · Viewport3D (bọc `Scene3DViewer` sẵn có + trục/ViewCube/gizmo) · ObjectProperties 4 nhóm + khai báo mode Trụ 4 | `20e935d` · `f6868e7` · `245b96b` | mục dưới đây (phiên chốt trước khi kịp viết vòng riêng) |
| **Thư viện = MỘT sheet** (xoá trang `/library`, 1 tên "Thư viện", 1 nút "Đưa lên kệ") | `a73c658` (+ 4 commit sheet trước đó `8e04f85`…`c4ab1d9`) | `docs/BAO-CAO-G4-LIB.md` |
| File Manager + Settings (rail chung · list view · tải lên thật · hình nền canvas) | đã merge main `12223cf` | `docs/BAO-CAO-FM.md` |
| Kệ Thư viện trang (vòng 1 — **đã khai tử** bởi `a73c658`) | `6ba1ecb` | phần đầu file này (giữ làm lịch sử) |

## Mode Vẽ 3D — tóm tắt nghiệm thu (3 commit cuối phiên)

- **Ranh giới giữ đúng**: chỉ file MỚI trong `components/three/*` + `lib/three/materials.ts` +
  `lib/three/mode-render-3d.ts`. KHÔNG đụng `components/studio/*`, KHÔNG sửa engine 3D-1..3D-5
  sẵn có. 3 component nhận props tự render, không biết gì về shell — CHINH cắm vào AppShell là chạy.
- **⭐ Moat matId verify bằng DOM**: đổi engine IF→D5 chỉ đổi tên hiển thị (Gỗ óc chó →
  Wood_Walnut_01), `matId` W-102 giữ nguyên, lựa chọn không mất. Dòng "Mã matId giữ nguyên khi
  xuất sang D5 hoặc V-Ray" hiện ở cả hint tab Vật liệu lẫn Inspector.
- **Nhóm Nguồn** (ObjectProperties): cảnh báo `--warning` TRƯỚC khi sửa khối còn đồng bộ bản vẽ
  ("sửa ở đây sẽ TÁCH khỏi bản vẽ") và SAU khi tách — verify đủ 3 trạng thái nguồn.
- **3 bug thật bắt khi verify** (đã sửa, console sạch tab mới): matId bị `overflow:hidden` cắt
  ("W-102"→"102", span inline trôi dòng) · `<title>` SVG gây hydration mismatch (React 18, bỏ
  hẳn dùng `aria-label`) · overlay theo theme vô dụng vì nền cảnh `Scene3DViewer` hardcode
  `#2a2d33` → chốt kính tối cố định, ngoại lệ có căn cứ ghi comment.
- `defineMode` registry CHƯA tồn tại (grep 0 kết quả) → `RENDER_3D_MODE` object thuần đúng hình
  dạng Trụ 4 + TODO trỏ CHINH trong `lib/three/mode-render-3d.ts`, không tự chế cơ chế.
- tsc 0 lỗi · lint sạch · test exit 0 · verify DOM thật từng tab, 2 theme (Tối trước), bàn phím.

## ⚠️ MERGE BLOCKER cho ai merge `nhanh-g4` → main

Main (`3a92170`) đã **XOÁ `LeftRail.tsx` + `StageShell.tsx`**; nhánh này còn 2 commit SỬA đúng 2
file đó (`a73c658` mount `LibrarySheet` vào StageShell + nút Thư viện trong LeftRail). Merge sẽ ra
**modify/delete conflict** — đúng ghi chú sổ tổng §1 "main đã xoá StageShell → cần luật xử mount".
Cách xử khi merge (đề xuất, người merge quyết):
1. Nhận xoá 2 file (`git rm`) — phần code sheet trong `components/library/*` không mất gì.
2. Mount lại `<LibrarySheet stage={...}/>` vào chỗ tương đương của **AppShell 6 ổ** (overlay dùng
   chung, cạnh Dashboard/FlowsPanel cũ) + nút "Thư viện" ở Navigator gọi `openLibrarySheet()`
   (`lib/library/use-library-sheet.ts` — không phụ thuộc shell, cắm đâu cũng chạy).
3. `/files`/`/settings` đã tự mount sheet riêng (`app/files/page.tsx`, `PixelSettingsShell`) —
   phần đó không dính conflict.

## Bàn giao phiên G4 mới — việc 1: MaterialSphere (§3 sổ tổng)

Đọc `SPEC-VAT-LIEU-PBR-IF` §2 (trên main — nhánh này CHƯA có, **merge main trước khi làm**, xử
conflict theo mục trên). Đầu bài sổ tổng: `MaterialSphere.tsx` (three.js sphere + RoomEnvironment
PMREM dùng chung + cache PNG theo hash) · gắn vào Thư viện sheet mode Vẽ 3D + tab Vật liệu
CommandPanel · 3 cảnh Cầu/Sàn/Vải tự chọn theo danh mục · lưới 25%, chi tiết 100%. Chỗ gắn có sẵn:
`components/three/CommandPanel.tsx` (swatch `.msw` tab Vật liệu — thay `background:gradient` bằng
ảnh cầu) + `components/library/LibrarySheet.tsx` (ô `.it` kệ vật liệu). Catalog matId mock ở
`lib/three/materials.ts` — `MATERIALS[].swatch` là gradient tạm, đúng chỗ để thay bằng render cầu.
Dùng chung 1 renderer/PMREM cho mọi cầu (đừng dựng N canvas — bài học FPS ghi ở `SPEC-3D-CORE`).

---

# PHIÊN G4 — 04/08/2026 (đêm) · VIỆC 1a GẤP: 5 lỗi UI chặng Render

Nguồn việc: `SO-KIEM-TONG.md` §3 G4-1a + `BAO-CAO-DEM-2026-08-04.md` mục 23:1x (điểm 2–6).
Bước 0 đã chạy: merge `main` → `nhanh-g4` (`02b2b39`, sạch, không conflict).

## Đã sửa (4 file, ngoài vùng cứng G4 gốc nhưng được phiếu giao việc TỔNG giao đích danh)

1. **Toolbar bút hết đứng thường trực** — `DrawToolbar.tsx` return null khi tool không thuộc
   {pen·marker·highlight·eraser}; **lối vào mới**: nút "Bút vẽ tay" thêm vào `BottomToolbar.tsx`
   (cạnh Khung phòng, active khi bất kỳ tool vẽ nào bật) — không mất tính năng, chỉ đổi lối vào
   (chống rớt §1 giữ nguyên: bảng bút + DrawLayer còn sống, thoát bằng nút "Chọn" trong bảng).
2. **Canvas trống hết tụt 15%** — `FlowCanvas.tsx`: `fitView` chỉ bật khi có node
   (`fitView={nodes.length>0}` + `defaultViewport zoom 1` + effect fit-một-lần `maxZoom:1` cho
   ca hydrate muộn). **Phát hiện thêm khi verify**: đổi flow KHÔNG remount canvas → viewport flow
   cũ dính lại; đã xử: đổi `currentFlowId` → reset cờ fit, flow trống thì `setViewport zoom 1`.
3. **Banner đổi khuôn** — `RenderToolModeOverlay.tsx`: "Còn công cụ khác chưa hiện." →
   "Công cụ đầy đủ nằm trong Thư viện khối." + nút "Mở thư viện" (khuôn Nhắc trạng thái
   SPEC-NGON-NGU §2, tên panel đúng chữ trên UI).
4. **Empty state khuôn Trống có NÚT** — `FlowCanvas.tsx`: "Canvas đang trống — kéo khối từ
   Thư viện vào đây" + nút "Mở Thư viện khối" (mở đúng panel) + demo chips giữ nguyên; bỏ jargon
   "Node Library"/"rail trái" (từ điển §3).
5. **Minimap + attribution** — minimap đã có guard `nodes.length >= 3` từ trước (không sửa);
   attribution React Flow GIỮ theo license nhưng chuyển `bottom-left` + style trong suốt/9px/55%
   (bỏ nền trắng lộ ở theme Tối). Lưu ý kỹ thuật: selector `.react-flow__attribution` không viết
   được bằng arbitrary variant Tailwind (underscore→space) → dùng `<style>` cục bộ trong wrapper.

## Verify browser thật (127.0.0.1:3004, login demo, cả 2 theme Sáng/Tối)

- Dock: nút Bút bật bảng bút mép trái (5 nút, active accent) · "Chọn" tắt bảng — DOM đếm 0.
- Flow trống: zoom đứng 100%, empty state + nút hoạt động (mở Thư viện khối), minimap ẩn,
  banner ẩn. Flow có node: banner hiện, nút mở đúng panel. Console: 0 lỗi runtime mới sau reload
  (chỉ còn vết compile cũ của chính phiên — đã sửa trong phiên).
- Verify bằng flow test "Untitled flow" tự tạo → ĐÃ XOÁ sau khi xong (stub `window.confirm`
  tạm để bấm nút Xoá flow vì browser pane nuốt dialog native — restore ngay). Theme trả về Sáng.

## 🔴 PHÁT HIỆN CHO TỔNG/PHU — nguyên nhân THẬT của ảnh "zoom 15% trống trơn" của Hoà

Dự án mẫu (flow đang mở mặc định) có **3 node toạ độ văng cực xa**: y = −6150 / −9261 /
**−50202** (đo DOM). fitView đúng logic với bbox đó → kẹt minZoom 15%, node bé đến vô hình,
minimap "trông như trống" dù có 3 node (guard ≥3 nên vẫn hiện). Tức là NGOÀI lỗi UI đã sửa,
còn **lỗi DỮ LIỆU demo** (nghi do kéo node ở zoom cực nhỏ hoặc import lệch) — thuộc lõi dữ
liệu (PHU/TỔNG quyết): cần sanitize vị trí node khi load/save. G4 không tự sửa (ngoài mảng).

## Ghi chú vận hành phiên này

- Worktree G4 thiếu `.env` → login API 500. Đã `cp .env` từ repo chính (DATABASE_URL trỏ tuyệt
  đối `prisma/dev.db` repo chính — đúng file gitignore, không vào git). Server 3004 cũ (khởi động
  không env) đã kill, chạy lại `npm run dev -p 3004` nền — **đang chạy tiếp cho phiên sau**.
- `preview_start` không nhận cwd ngoài project root → server chạy qua Bash nền (bất khả kháng,
  log ở scratchpad phiên).

## VIỆC 1 (§3 G4): MaterialSphere — quả cầu vật liệu (SPEC-VAT-LIEU-PBR-IF §2)

**File mới**: `components/three/material-preview.ts` (lõi render + cache) ·
`components/three/MaterialSphere.tsx` (component <img> + fallback gradient).
**Gắn vào 3 nơi**: `components/three/CommandPanel.tsx` tab Vật liệu (bản G4, chờ CHINH nối) ·
`components/render-studio/Command3DPanel.tsx` tab Vật liệu (bản ĐANG MOUNT trên main — thêm để
tính năng nhìn thấy được ngay, ship-trước) · `components/library/LibrarySheet.tsx` kệ
`render-mat` + `common-atlas` (badge phạm vi giữ nguyên, kệ khác + hatch 2D giữ swatch phẳng
đúng spec "chặng Vẽ 2D giữ swatch phẳng").

Đúng spec §2: MỘT WebGLRenderer + MỘT env PMREM `RoomEnvironment` dùng chung (không dựng N
canvas — bài học FPS SPEC-3D-CORE) · render 1 lần/бộ tham số → PNG cache theo hash(params)
(Map in-memory — chưa IndexedDB vì mỗi lượt render <5ms, không đáng ghi đĩa) · 3 cảnh
Cầu/Sàn/Vải tự chọn theo danh mục (vải→Vải; tên có sàn/gạch/lát→Sàn) · nấc phân giải 25% cho
lưới, 100% để dành panel chi tiết — **sàn 56px** (thấy khi verify: 120px ô × 25% = 30px nguồn
→ nhuyễn mất highlight; 56px vẫn rẻ). Fallback = gradient swatch cũ khi WebGL tắt/SSR.

**PBR tạm suy từ loại bề mặt** (W/S/M/P/F/G từ matId · từ khoá tên cho ATLAS thật) vì schema
matId+PBR là việc PHU (§3 PHU-4) — khi PHU xong thì thay `materialFromSpec`/`kindFromName`
bằng đọc cột PBR thật, chỗ gắn không đổi.

**Verify browser thật (127.0.0.1:3004, 2 theme)**: Command3DPanel 2 vật liệu ATLAS thật ra cầu
("Đá traverti…" = cầu highlight, "Sàn gỗ sồi" = cảnh sàn phối cảnh vì tên có "Sàn") · kệ Thư viện
12 món ra cầu/sàn/vải đúng loại, badge nguyên · DOM đếm 14 ảnh PNG 56px · dark theme đọc rõ ·
lint/tsc/test sạch. Ghi chú: fetch `/api/specs` sau hard-reload URL con trả rỗng 1 lần (khớp
cảnh báo hydrate STATUS.md — không phải lỗi mới, toggle lại mode là có).

## CHỐT PHIÊN G4 — 04/08/2026 (theo SO-KIEM-TONG §4)

Nhánh `nhanh-g4` HEAD = `14d3ec6`, cây sạch. Phiên này: `02b2b39` (merge main) → `7ac431c`
(G4-1a 5 lỗi UI) → `14d3ec6` (MaterialSphere). Đã thêm 2 dòng vào §1 sổ tổng (chống rớt).

**Hàng đợi G4 còn lại** (đọc lại §3 sổ tổng trước khi làm):
- Việc 2 — **BỎ QUA phiên này**: "chờ CHINH merge xong" mới verify Vẽ 3D trên main. `git log main`
  còn `1873cbe`, chưa có commit merge nhanh-g4 ⇒ điều kiện chưa đủ, đúng luật bỏ qua.
- Việc 3 — **Mood+Collab G2 trọn gói** (việc kế tiếp cho phiên G4 mới): `lib/collab/` (presence
  store · share roles Viewer/Commenter/Editor · comment anchor) + UI theo ticket G2. **Đã khảo
  sát sẵn cho phiên sau, đừng làm lại**: `lib/collabStore.ts` (147 dòng, poll cursor, KHÔNG có
  role) · `components/collab/PresenceBar.tsx` (online/offline + mời — nhưng POST cứng
  `role:'viewer'`, chưa cho chọn) · `components/collab/LiveCursors.tsx` (TẠM ẨN có chủ đích,
  xem chú thích trong FlowCanvas — đừng bật lại nếu chưa đồng bộ node/edge) ·
  `components/CommentLayer.tsx` (ghim theo % VIEWPORT + route, dùng cho góp ý app — KHÁC comment
  neo vào node/flow-space mà G2 cần, đừng nhầm là đã có) · role hợp lệ đã có ở server:
  `prisma/schema.prisma:109` `'owner'|'crea'|'drafter'|'bim'|'viewer'` + `app/api/projects/[id]/
  members/route.ts` (có `isProjectRole`) ⇒ 3 vai Viewer/Commenter/Editor của spec PHẢI ánh xạ
  vào bộ role sẵn có này, không đẻ bộ thứ hai.
- Việc 4 (Present chooser) · việc 5 (empty state toàn app) — chưa động.

**Môi trường bàn giao**: dev server G4 đang chạy nền ở `127.0.0.1:3004` (worktree này, có `.env`
vừa copy — file gitignore, không vào git). Kill bằng `lsof -tiTCP:3004 | xargs kill` nếu cần.

## 🔴 4 FIX THƯ VIỆN (Hoà chê cách Thư viện xuất hiện — 04/08)

**① Xoá 12 gradient giả.** `lib/library/shelves.ts` bỏ hẳn bảng `SWATCH`; mỗi món khai `kind`
(LOẠI) thay cho một gradient bịa. Ô xem trước đi theo bậc thang trong `components/library/
ItemThumb.tsx`: **(c)** `item.imageUrl` (ATLAS sync có cột Ảnh — trường đã khai, chưa nối) →
**(a)** quả cầu render thật (chỉ kệ vật liệu) → **(b)** vân procedural theo loại + icon loại
(`lib/library/thumb-kinds.ts`: gỗ=vân dọc · đá=lấm tấm · vải=dệt chéo · kim loại=xước góc hẹp ·
kính=vệt sáng chéo · sơn=ánh mềm; loại phi-vật-liệu=lưới/nhịp trung tính theo token).
**Luật chống tái phạm**: tông màu gắn theo LOẠI, không theo từng món — mọi món gỗ chung một tông
tới khi ATLAS trả màu thật, thà nói đúng "đây là nhóm gỗ" còn hơn bịa 12 màu.

**② Scrim.** Bug thật, không phải chỉnh mắt: scrim z-index 20 chép từ mock, nhưng app thật có
`.mat-header` z-30 ⇒ **header đứng TRÊN scrim, nửa màn không hề tối** (đo bằng `elementFromPoint`:
điểm header trả về chính header). Sửa: scrim z-90 / sheet z-91 (dải modal của app: Lightbox z-60,
menu z-80, dưới PublishModal z-190 + toast z-200 của chính Thư viện). Sau sửa `elementFromPoint`
tại header/sidebar/canvas đều trả `scrim`. Đậm thêm 12% so với token `--mat-overlay` (token .28
hợp modal nhỏ; sheet này chiếm 74% màn).

**③ Ba tầng nền.** Sheet trước dùng `--mat-card` (Sáng = trắng .82) còn card dùng `--field`
(#f4f1eb) ⇒ hai lớp gần trùng, phẳng lì. Nay: **nền `--bg` < sheet `--panel` < card `--card` +
viền `--border`**. Đo thật (Sáng) 242,239,233 → 250,248,244 → 255,255,255 + viền 227,222,212;
(Tối) 12,12,14 → 20,20,23 → 26,26,30 + viền 42,42,49. Kính giữ nhưng chỉ còn 6% trong suốt +
blur — đúng `SPEC-APPLE-MOTION-MATERIAL` ("kính là gia vị, đọc được TRƯỚC").

**④ Gộp vật liệu về MỘT kệ.** Kệ chặng Dựng ảnh nay chỉ còn **Preset dựng ảnh · Template
moodboard · Chuỗi khối sẵn · Form lập luận**; toàn bộ 12 món vật liệu chuyển sang kệ chung
**Vật liệu ATLAS (1449)** — hết cảnh cùng một kho hiện hai chỗ, đếm 1449 hai lần. Kệ mặc định
chặng Dựng ảnh đổi thành Preset. `SPHERE_SHELVES` chỉ gồm `common-atlas`.

### 4 lỗi tự bắt khi verify (không ai giao, sửa luôn)
1. **Quả cầu tràn khung**: fov 32° ở khoảng cách 3.05 chỉ thấy cao 1.75 đơn vị < đường kính cầu
   2.0 ⇒ ô xem trước ra hình vuông bo góc, mất rìa Fresnel. Lùi camera 4.6 (vải 4.3).
2. **Ảnh mờ**: nấc 25% × 120px = 30px nguồn, phóng lên Retina thành vệt. Nay nhân DPR + sàn 96px
   (cache theo key nên mỗi tham số chỉ render 1 lần).
3. **`objectFit:cover` cắt chỏm cầu** → thêm prop `fit`, kệ dùng `contain` (cảnh Sàn vẫn `cover`).
4. **Vân bám `--t5`** (Sáng #b8b1a7) pha loãng trên `--field` là mất hút → đổi bám `--t3`.
Kèm 1 lỗi của chính tôi: backtick trong comment CSS làm đứt template literal (Build Error, sửa ngay).

**Nghiệm thu**: tsc 0 lỗi · lint sạch · test 0 fail · verify browser `127.0.0.1:3004` CẢ 2 THEME
(kệ vật liệu ra cầu đúng loại gồm cảnh Vải cho vải và cảnh Sàn cho gạch terrazzo; kệ preset/
template ra vân + icon; scrim phủ toàn màn; 3 tầng nền đo bằng `getComputedStyle`).

## 🔴 MODE VẼ 3D — dựng lại trải nghiệm mở màn (Hoà chê "rối rắm, không hệ thống", 04/08)

**① Sân khấu luôn hiện.** `Render3DModeSkeleton` bỏ nhánh "chưa có bản vẽ → hiện câu chữ", nay
LUÔN render `Viewport3D` (thêm `EMPTY_SCENE_3D` bbox 8×8m để camera khung sẵn một khoảng
người-ở-được). Thêm prop `Scene3DViewer.ground`: lưới sàn 200×200 + `THREE.Fog` làm ĐƯỜNG CHÂN
TRỜI. **Mặc định TẮT** — mọi chỗ chụp ảnh (campath/capture/xuất) không được dính lưới vào khung.

**② Hết nói chuyện nội bộ với người dùng.** Xoá 2 câu: "Cấu kiện/IFC (B2-B4) chưa làm" (banner
canvas) và "chưa làm — cần chọn mặt trong khung nhìn 3D, việc riêng" (tab Vật liệu). Sự thật kỹ
thuật chuyển thành comment code tại chỗ. Tab Vật liệu nay chỉ còn 1 câu hành động: "Chọn vật liệu
để cầm, rồi bấm lên mặt khối."

**③ Empty state làm được việc TẠI CHỖ.** "Bắt đầu dựng không gian" + 2 nút:
· **Đùn từ bản vẽ** — đặt `heightMm=2700` cho nét hatch/polyline chưa đùn, ghi thẳng vào Doc
  (một nguồn); disabled kèm lý do khi bản vẽ trống.
· **Dựng khối đầu tiên** — mở tab **Tạo** + **nháy nút Tường**. Tab Tạo trước đây là câu "sắp có"
  suông, nay có nút Tường THẬT: gọi engine `wallSegment()` của chặng Vẽ (không tự chế hình học),
  đoạn 4m dày 220. 5 khối còn lại (Hộp/Sàn/Cửa/Cửa sổ/Mái) giữ chỗ dạng disabled có lý do —
  không nút giả. **Không còn câu "sang chặng CAD vẽ rồi quay lại".**

**④ Trình tự 3 bước** góc dưới trái: ① Dựng khối → ② Gán vật liệu → ③ Đặt máy quay, tự đánh dấu
(gạch ngang + tick accent), có nút ẩn nhớ qua localStorage `if.ve3d.guide_hidden_v1`.
⚠️ TRUNG THỰC: bước ② hiện bắt tín hiệu "đã CHỌN vật liệu trong panel" chứ không phải "đã gán vào
khối" — `grep matId lib/cad/*` = 0, Doc CAD chưa có field vật liệu. Khi gán-lên-mặt (raycast) xong
thì đổi tín hiệu sang dữ liệu Doc (đã ghi TODO tại chỗ).

**⑤ Mọi vật liệu cùng MỘT kiểu xem trước.** Bỏ đoán-theo-tên (`floorHint`) ở cả `Command3DPanel`
lẫn kệ Thư viện: trước đây "Sàn gỗ sồi" ra cảnh Sàn phẳng còn "Đá travertine" ra quả cầu, nhìn
lổn nhổn hai kiểu. Nay tất cả là quả cầu; cảnh Sàn/Vải vẫn nằm trong `material-preview.ts` cho
panel chi tiết CHỌN TAY sau này.

**Verify browser (127.0.0.1:3004, 2 theme)**: mở Vẽ 3D lúc 0 khối → THẤY lưới sàn + chân trời +
trục XYZ + ViewCube + nhãn "Không gian trống" + thẻ "Bắt đầu dựng không gian" + trình tự 3 bước.
Bấm "Dựng khối đầu tiên" → tab Tạo mở, nút Tường nháy → bấm Tường → khối hiện thật, nhãn đổi
"Khối xám · chưa vật liệu", bước ① tự tick. Đo `getBoundingClientRect`: trình tự ban đầu ĐÈ LÊN
trục XYZ (bottom 74) → dời lên 156, đo lại `chongLan=false`. Tường test đã XOÁ khỏi dự án mẫu
(chặng Vẽ → chọn tất cả → Delete), bản vẽ trở lại rỗng như trước. tsc/lint/test sạch.

### ⚠️ Tồn tại phát hiện khi verify — KHÔNG sửa ở phiếu này (ngoài phạm vi, để PHU quyết)
Cảnh chỉ có 1 khối lẻ thì camera áp rất sát và khối nằm LỆCH TÂM khung. Nghi `controls.target`
dùng `(cx, cz, cy)` trong khi phép chiếu CAD→three là `(x, cao, −y)` ⇒ trục thứ ba phải là `−cy`.
Hành vi engine có từ 3D-1; đụng vào là đổi khung hình của cả campath/capture. Đã ghi comment cảnh
báo ngay tại dòng đó trong `Scene3DViewer.tsx`.

## 🔴 BUG card "Bắt đầu dựng không gian" không tắt được — ĐÃ SỬA (04/08)

Đủ 4 đường thoát, verify từng cái bằng thao tác thật:
1. **Nút ✕** góc trên phải card.
2. **Esc** đóng · **bấm ra ngoài card** đóng (listener `pointerdown` pha BẮT, cùng họ sự kiện
   `lib/useDismissable` của app).
3. **Nhớ** qua `localStorage if.ve3d.welcome_hidden_v1` — reload không hiện lại; thay bằng **nút
   "?"** góc dưới phải để gọi lại (đóng gì cũng phải mở lại được).
4. **Không chặn viewport**: đo `getComputedStyle` — overlay `pointer-events:none`, chỉ card
   `auto`. Orbit/pan không vướng.
Tự ẩn khi có khối đầu tiên: giữ nguyên (`soKhoi > 0`).
Verify: Esc → `cardConHien:false` + `localStorage=1` + nút "?" xuất hiện · bấm "?" → card về ·
bấm ra ngoài → đóng lại · reload → không hiện, nút "?" còn · theme Tối OK.

## ⚠️ QUẢ CẦU theo công thức §2c — THỬ RỒI TRẢ LẠI, CHƯA XONG (trung thực)

Đã dựng đủ theo công thức: `NeutralToneMapping` + exposure 1.0 · `environmentIntensity 1.1` +
`environmentRotation` (đưa vệt sáng lên góc trên-trái) · nền xám radial `#8a8a8a→#4a4a4a` ·
đĩa bóng tiếp đất 2.2× bake 1 lần · fov 30 vị trí (0,0.9,5) · sphere 64×32 · render 2× rồi thu
nhỏ · vải KHÔNG bóp hình học · kính có thẻ checker sau lưng.

**Kết quả: mọi quả cầu NGỪNG render** (12/12 ô rơi về vân procedural, `renderMaterialPreview`
trả null mà KHÔNG ném lỗi ra console — đã thêm `console.warn` ở cả 2 nhánh catch mà vẫn im).
Chưa tìm ra nguyên nhân trong ngân sách phiên này. **Đã `git checkout` trả `material-preview.ts`
về bản chạy được (de82ed7) — verify lại 12/12 cầu hiện đủ.** Bản thử giữ nguyên ở
`scratchpad/material-preview-2c-attempt.ts` để phiên sau soi tiếp (nghi: một trong
`environmentRotation` / `background` CanvasTexture / `drawImage` từ renderer canvas sau khi đổi
`setSize`).

**Đã giữ lại phần an toàn**: tách tông đá (trắng LẠNH `#eceae6`) khỏi sơn (trắng ngà ẤM
`#e7dfd0`) trong `thumb-kinds.ts`. Nhưng **CHƯA ĐẠT nghiệm thu** "Sơn trắng ngà vs Đá Calacatta
khác nhau rõ": đo pixel vùng cầu, hai ô mới lệch ~7/255 độ sáng — mắt thường vẫn thấy na ná.
Muốn đạt phải có nền xám + roughness tách biệt, tức đúng gói §2c đang treo.

**Phát hiện kèm**: "Gạch terrazzo" và "Đá Calacatta" ra ảnh Y HỆT nhau (cùng loại `stone` → cùng
tông → cùng tham số). Đây là hệ quả trực tiếp của luật "tông theo LOẠI, không theo món" — chỉ hết
khi ATLAS trả `colorHex` thật cho từng vật liệu.

## ⬜ CHƯA LÀM (bàn giao thẳng, không giấu)
- **A. Một Thư viện ở chặng 2**: xoá banner "Công cụ đầy đủ nằm trong Thư viện khối" · sheet chỉ
  mở từ nút đáy sidebar · tab Vật liệu có nút "Xem cả kho". CHƯA ĐỘNG.
- **CHINH-5 bàn giao**: icon-hoá ObjectProperties + chip engine + Settings. CHƯA ĐỘNG.

---

# PHIÊN G4 — 05/08/2026 · QUẢ CẦU §2c XONG + gói Thư viện + nhận CHINH-5

## ✅ VIỆC 1 — Quả cầu §2c (`9fa870b`): THỦ PHẠM KHÔNG PHẢI CÔNG THỨC

Cô lập từng biến trên browser thật (127.0.0.1:3004, reload sạch sau mỗi vòng, đếm `<img>` dataURL):
- Vòng 1 `environmentRotation` + `environmentIntensity` → 12/12 cầu vẫn render. VÔ TỘI.
- Vòng 2 + nền radial `CanvasTexture` → 12/12. VÔ TỘI.
- Vòng 3 + render 2× rồi `drawImage` sau `setSize` → 12/12. VÔ TỘI.

**Thủ phạm thật: RÒ WEBGL CONTEXT QUA HMR.** `rig` là biến module — mỗi lần Fast Refresh thay
`material-preview.ts` là tạo `WebGLRenderer` MỚI, cái cũ không ai dispose. Phiên trước sửa file
nhiều vòng liên tiếp trong một phiên dev → vượt trần ~16 WebGL context của Chrome →
`new WebGLRenderer()` ném lỗi ngay trong `getRig()` → `rig=false` VĨNH VIỄN → mọi lần gọi sau
trả null im lặng (warn chỉ bắn đúng 1 lần, chìm trong log Fast Refresh). Đó là lý do rollback
(kèm reload) lại chạy ngay. **Chốt chống tái phát: rig găm vào `globalThis`** — module thay bao
nhiêu lần vẫn đúng 1 context (đã ghi cảnh báo đầu file).

Công thức §2c áp đủ (theo bản thử phiên trước, giữ nguyên tinh thần): NeutralToneMapping +
exposure 1.0 · env 1.1 + xoay vệt sáng trên-trái · nền radial #8a8a8a→#4a4a4a · đĩa bóng tiếp
đất 2.2× bake 1 lần · fov 30 (0,0.9,5) · cầu 64×32 · render 2× thu nhỏ · vải giữ hình cầu ·
kính có thẻ checker · đá mài bóng (rough .1 + clearcoat .7) tách hẳn sơn matte (rough .95).

**Nghiệm thu đo thật**: 12/12 cầu render (đếm DOM) · "Sơn trắng ngà vs Đá Calacatta": đá có
hotspot specular max 254 + 0.58% pixel gần trắng, sơn max 241 + 0% (matte tuyệt đối) + ấm hơn
17 điểm R−B — khác rõ cả bóng lẫn tông · "Kính mờ" thấy checker sau lưng rõ. 2 theme OK.
⚠️ Còn đúng như dự báo: "Gạch terrazzo" ≈ "Đá Calacatta" (cùng loại stone → cùng tông) — chỉ
hết khi ATLAS trả `colorHex` thật từng món (luật tông-theo-loại giữ nguyên, không bịa màu).

## ✅ VIỆC 2 — Gói "MỘT Thư viện ở chặng 2" (`0569a91`)

- **Banner xoá hẳn** khỏi `RenderToolModeOverlay` (main cũng đã xoá độc lập ở CHINH-6 — merge
  về sau chỉ còn 1 bản, conflict comment đã xử theo bản TỔNG).
- **Nút "Xem cả kho"** ở tab Vật liệu `Command3DPanel` → `openLibrarySheet({shelfId:'common-atlas'})`.
  Verify: bấm trong mode Vẽ 3D mở đúng kệ Vật liệu ATLAS, 12/12 cầu, cả 2 theme.
- **Audit cửa mở sheet** (yêu cầu "chỉ mở từ nút đáy"): còn đúng 4 cửa, đều user-initiated —
  nút đáy sidebar (AppShell) · menu logo (chốt Hoà 03/08 "MỘT tên Thư viện", file CHINH nên không
  đụng) · phím L · deep-link `/library` một lần. KHÔNG có đường tự bung nào.

## ✅ VIỆC 3 — Nhận bàn giao CHINH-5 (`d143684`, sau merge main `c0fcd7d`)

- Merge `main` → `nhanh-g4` (cần Rollout.tsx + Settings bản main): 1 conflict comment ở
  RenderToolModeOverlay (2 bên cùng xoá banner) — lấy bản TỔNG.
- **ObjectProperties icon-hoá** theo bảng SPEC-PANEL-ROLLOUT §3: Trạng thái = chấm tròn
  xanh/cam + tooltip + sr-only · "Xuất sang" = 3 chip `IF · V-Ray · D5` đều sáng · cảnh báo
  tách bản vẽ = icon xích đứt --warning, câu đầy đủ ở tooltip. CSS mới `.dot/.chips/.chip.lit/
  .warn.mini` trong `ve3d-css.ts` (token sẵn có).
  ⚠️ TRUNG THỰC: hàng "Đổ bóng/Nhận bóng" trong bảng spec KHÔNG tồn tại trong code (grep 0) —
  không có gì để đổi; khi nào có toggle bóng thì làm icon từ đầu. Và `ObjectProperties` CHƯA
  mount ở màn nào (chờ CHINH cắm ổ Inspector) → phần này chỉ kiểm được bằng tsc/lint, CHINH cắm
  là thấy icon.
- **Settings**: hàng "Bố cục panel" đầu khu Nâng cao + nút "Đặt lại bố cục panel" gọi
  `resetAllRolloutLayouts()` (chỉ GỌI export sẵn, không sửa file CHINH). Verify thật: gieo khoá
  `interiorflow.rollout.v1.test-fake` → bấm → khoá bị xoá (0 còn lại), nhãn đổi "Đã đặt lại" 2.5s.

## Ghi chú vận hành phiên này
- **Browser pane click flaky**: nhiều click toạ độ/ref không dispatch được sau reload (nút thật
  không bị che — `elementFromPoint` trả đúng nút). Xử bằng lặp read_page→ref-click; riêng nút
  reset Settings phải verify qua `btn.click()` DOM (logic + wiring thật, chỉ bỏ qua tầng giả lập
  chuột của pane — không phải lỗi app).
- tsc toàn repo 0 lỗi sau từng việc · lint sạch các file sửa · dự án mẫu trả về trạng thái cũ
  (2D mode, theme Sáng, card chào đã gọi lại, không node rác mới).
- Dev server 3004 vẫn chạy nền cho phiên sau (`lsof -tiTCP:3004 | xargs kill` nếu cần).

---

# PHIÊN G4 — 05/08/2026 (tiếp) · PHIẾU 🔴 5 LỖI UI CHẶNG TRÌNH BÀY

Nguồn: `docs/PHIEU-TRINH-LOI-UI-2026-08-03.md`. Thứ tự làm theo phiếu: **L2 → L1 → L5 → L3 → L4**.
Bước 0: `git log --all -- components/present-editor/` — không ai đụng vùng này từ khi merge
`nhanh-phu`/E-sprint (commit gần nhất `10e5d9d` "P6c kính lồng", đã cũ) → an toàn vào việc.

## Trạng thái khai thật: 4/5 XONG Ở TẦNG LOGIC + tsc/lint sạch, **CHƯA verify browser 2 theme**
Phiên bị ngắt giữa lúc dựng L4 (script sửa import bị chặn tay), rồi nhận lệnh ưu tiên "đưa cây về
biên dịch được, không nhận việc mới". Đã xác nhận cây SẠCH (chi tiết dưới) nhưng **chưa kịp mở
`127.0.0.1:3004` xem bằng mắt** — đây là việc còn treo, không phải việc quên.

### ✅ L2 — Slide "Triết lý thiết kế" chữ chồng chữ (`lib/present-editor/templates.ts` +
`akh-sample.ts`, test mới `templates-fit.test.ts`)
Nguyên nhân gốc: bullet `"• Không gian chuẩn mực\n• Ít mà đúng"` là **CHUỖI CỨNG** đóng đinh
trong `grid4-philosophy.build()`, bơm giống hệt vào cả 4 cột — không đến từ dữ liệu ctx, nên deck
nào cũng lặp y hệt 4 lần và tràn khung 12%H khi text dài hơn dự kiến (đè lên nhãn cột phía trên).
Sửa: bullet nay đọc từ `ctx.body[4+i]` (4 ghi chú thật, đi kèm 4 nhãn cột `body[0..3]`) — không
có dữ liệu thì BỎ TRỐNG, không bịa. Thêm `fitFontSize()` (hàm thuần, cùng công thức ước lượng wrap
`charsPerPctWBody` với `layout-check.ts` để hai bên không lệch nhau) tự co cỡ chữ để không tràn
khung dù ghi chú dài bất thường. Deck mẫu AKH-IKI cập nhật `body` đủ 8 mục (4 nhãn + 4 ghi chú
riêng biệt, không lặp).
**Nghiệm thu tầng thuần** (`templates-fit.test.ts`, 9/9 ok): không tự bịa nội dung khi thiếu dữ
liệu · 4 bullet nội dung khác nhau · không cặp khung nào chồng nhau (đo như phiếu: overlap <0.2%,
gần tương đương "<2px" của nghiệm thu DOM) · ghi chú dài bất thường không kích cảnh báo tràn của
`layout-check.ts`. **CHƯA đo `getBoundingClientRect` trên DOM thật** — phiếu yêu cầu đúng phép đo
này, việc còn lại cho lượt verify browser.

### ✅ L1 — "Trang 1" + "1/5" đánh lừa đơn vị (`PresentSheets.tsx` + `SheetTabBar.tsx`)
`SheetTabBar` (dùng chung CAD + Present) nay nhận prop `status?: string` tuỳ chọn — không có thì
giữ nguyên `${sheets.length}/${max}` cũ (CAD không đổi gì, chỉ Present truyền). Present đổi tên
sheet mặc định "Trang N" → **"Hồ sơ N"** (mọi chỗ sinh tên + 3 câu toast Nhập/Xuất/mở-vượt-trần
đều đổi theo, tránh nửa Việt-Anh lẫn "trang" cũ mới). Góc phải nay hiện **"N slide"** (đếm
`deck.slides.length`, cập nhật qua `onDeckChange` + tức thời khi `switchTo` đổi hồ sơ) — trần 5
CHỈ nối thêm `"· tối đa 5 hồ sơ"` khi ĐÃ chạm trần, không nhắc sớm.
**CHƯA verify DOM**: cần mở đúng dự án mẫu 8-slide, đọc tab + góc phải bằng mắt.

### ✅ L5 — Panel phải bị cắt đáy (`PresentEditor.tsx`, khối `<aside>` Inspector)
Đo DOM thật (trước khi sửa) xác nhận: `aside` **ĐÃ** `overflowY:auto` và cuộn được thật
(`scrollHeight 395 > clientHeight 302`) — không phải thiếu cuộn, mà thiếu **DẤU HIỆU** còn nội
dung dưới mép (macOS ẩn thanh cuộn khi không rê chuột → dòng hướng dẫn "Chọn một phần tử…" nằm
sát mép trông y như bị cắt cứng). Sửa bằng CSS thuần, không thêm state: `scrollbarGutter:stable`
(chừa sẵn rãnh, không giật khi thanh cuộn hiện) + bóng-cuộn 4-lớp gradient (2 lớp `background-
attachment:local` màu nền phủ kín khi vừa khung, 2 lớp `scroll` là vệt mờ chỉ lộ ra khi còn nội
dung ở mép). `paddingBottom` tăng lên 28px cho thoáng.
**Đã đo trước khi sửa, CHƯA đo lại sau khi sửa** trên browser thật.

### ✅ L3 — Thumbnail chữ đè ảnh không tương phản (`Element.tsx`, `TextInner`)
Nguyên nhân gốc: `resolveAutoTextColor` (chọn màu chữ đọc được khi đè ảnh) chỉ chạy trong
`EditorCanvas` cho **slide đang mở** — slide 3 (và bản thu nhỏ của nó ở `SlideStrip`) chưa ai mở
tới thì giữ nguyên màu trắng gốc của template, đè lên ảnh sáng = không đọc được. KHÔNG sửa cơ chế
đo màu (đúng auto-color, tốn hơn nhiều nếu chạy cho mọi slide ẩn) — chỉ mở rộng điều kiện bật
**bóng AA mảnh sẵn có của P6a** (`autoShadowCss`): trước đây chỉ bật khi `el.autoShadow` (đã đo
và chốt), nay bật SỚM HƠN khi đang đè ảnh mà màu CHƯA ai chốt (`colorAuto === true`) — cùng một
bóng, chỉ đổi thời điểm bật. Màu chốt xong thì điều kiện tự tắt, không chồng hiệu ứng.
**CHƯA verify browser** — cần mở slide 3 lẫn thumbnail của nó, cả 2 theme.

### 🟡 L4 — Toolbar 2 hàng ~30 nút → popover "Sắp xếp" (`Toolbar.tsx`) — XONG CODE, ⬜ CHƯA VERIFY
Gom 14 nút (căn-lề × 6 · thứ tự lớp × 4 · nhóm/rã nhóm × 2 · khoá · ẩn) vào 1 nút **"Sắp xếp"**
mở `ArrangePopover` — portal ra `body` (luật K4, panel kính không lồng trong chrome kính) +
`useDismissable` (Esc/bấm ngoài, cùng họ sự kiện toàn app). §0d: KHÔNG xoá nút nào — Inspector.tsx
vẫn giữ nguyên bản sao của cụm này (đã có từ P6b) cho ai quen dùng bên phải, popover chỉ là LỐI
VÀO THỨ HAI từ toolbar trên. Còn lại 6 nút gốc + Divider (Chữ·Ảnh·5 hình·Mẫu·Undo/Redo·…) giữ
nguyên vị trí cũ.
**Sự cố khai thật**: giữa lúc dựng xong JSX + component `ArrangePopover`, một lệnh sửa import bị
chặn tay (Bash tool call), rồi nhận ngay chỉ đạo ưu tiên "dừng nhận việc mới, đưa cây về biên dịch
được". Kiểm lại thì import ĐÃ áp dụng đúng từ trước đó (không mất khi bị chặn) — `tsc --noEmit -p .`
xác nhận sạch, đọc lại toàn bộ JSX quanh `ArrangePopover` xác nhận thẻ mở/đóng cân bằng, không cần
rollback. **Chỉ còn thiếu bước cuối: chưa mở browser bấm thử nút "Sắp xếp" — chưa ai NHÌN THẤY nó
chạy.**

## Kiểm biên dịch (đúng yêu cầu, chạy trước khi báo cáo)
- `npx tsc --noEmit -p .` toàn repo → **1 lỗi duy nhất**, cả 6 dòng đều ở `lib/cad/eyedropper.test.ts`
  — **đã đối chiếu `diff` với bản trên `main`: BIT-FOR-BIT GIỐNG HỆT**, tức lỗi có sẵn trên `main`
  từ trước (nhánh PHU, commit `804952f`), không phải do phiên này gây ra, và ngoài vùng cứng G4
  (`§2 SO-KIEM-TONG`) — không tự sửa.
- 7 file tôi sửa (`Toolbar/Element/PresentEditor/PresentSheets.tsx` · `SheetTabBar.tsx` ·
  `templates/akh-sample.ts`) — **0 lỗi tsc, 0 cảnh báo lint** (`next lint --file` từng file).
- `templates-fit.test.ts` (test mới, L2) — 9/9 ok. `npm test` toàn repo — 34+14 ok, 0 fail
  (không có test nào vỡ vì đổi `SheetTabBar`/`Element.tsx`).

## ⬜ VIỆC CÒN TREO CHO LƯỢT KẾ (không giấu)
1. **Verify browser thật, CẢ 2 THEME**, đúng phiếu — đây là việc DUY NHẤT còn thiếu để đóng phiếu
   này. Mở `127.0.0.1:3004` (dev server vẫn chạy nền), đăng nhập demo, vào dự án mẫu → chặng
   Trình bày:
   - L2: slide 4 "Triết lý thiết kế" — đo `getBoundingClientRect` 4 khối bullet, xác nhận không
     cặp nào chồng >2px (test thuần đã xác nhận ở mức logic, cần xác nhận lại trên DOM thật).
   - L1: tab đầu đọc "Hồ sơ 1", góc phải đọc "8 slide" (không phải "1/5").
   - L5: cuộn Inspector xuống đáy, đọc trọn dòng "Chọn một phần tử trên slide để chỉnh. Kéo…".
   - L3: thumbnail slide 3 "Không gian sống kể…" — chữ đọc được trên ảnh, cả canvas lẫn dải dưới.
   - L4: bấm nút "Sắp xếp" → popover 14 nút mở đúng vị trí, không bị cắt mép màn hình, Esc/bấm
     ngoài đóng được, mọi nút bên trong vẫn hoạt động y hệt bản cũ trong Inspector.
2. Nếu verify phát hiện lệch — sửa tại chỗ, KHÔNG mở việc mới ngoài phiếu này.
3. Sau verify: cập nhật lại mục này thành ĐÃ XONG + xoá dòng "chưa verify" ở từng L.

## Khối lệnh commit (Hoà chạy tay — worktree không tự commit được)

```bash
cd ~/Downloads/interiorflow-g4
git add lib/present-editor/templates.ts lib/present-editor/akh-sample.ts lib/present-editor/templates-fit.test.ts
git commit -m "fix(present): L2 - bullet slide triet ly doc du lieu that, tu co chu chong tran

Chuoi cung '• Khong gian chuan muc / • It ma dung' bi bom vao CA 4 cot trong
grid4-philosophy.build() -> deck nao cung lap y het 4 lan, text dai hon du
kien thi tran khung 12%H de len nhan cot phia tren (PHIEU-TRINH-LOI-UI
2026-08-03 muc L2). Sua: bullet doc tu ctx.body[4+i] (4 ghi chu that di kem
4 nhan cot body[0..3]), thieu du lieu thi BO TRONG khong bia. Them ham thuan
fitFontSize() (cung cong thuc uoc luong wrap charsPerPctWBody voi layout-
check.ts) tu co chu de khong tran khung. Deck mau AKH-IKI cap nhat 8 muc
(4 nhan + 4 ghi chu rieng, khong lap).

Test moi templates-fit.test.ts 9/9 ok: khong tu bia noi dung khi thieu du
lieu, 4 bullet khac nhau, khong khung nao chong nhau, ghi chu dai bat thuong
khong tran. CHUA verify DOM that (getBoundingClientRect) - lam o luot sau.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"

git add components/present-editor/PresentSheets.tsx components/studio/SheetTabBar.tsx
git commit -m "fix(present): L1 - Trang N/1-5 danh lua don vi -> Ho so N/N slide

SheetTabBar (dung chung CAD+Present) them prop status? tuy chon - khong
truyen thi giu nguyen \${sheets.length}/\${max} cu (CAD khong doi). Present
doi ten sheet mac dinh 'Trang N' -> 'Ho so N' (PHIEU-TRINH-LOI-UI 2026-08-03
muc L1: nguoi doc '1/5' tuong dang o trang 1/5 trang tai lieu, that ra la
sheet 1/tran 5 sheet, con day duoi co 8 SLIDE - hai don vi khac nhau dung
chung 1 chu). Goc phai nay hien 'N slide' (dem deck.slides.length, cap nhat
qua onDeckChange + tuc thoi khi doi ho so); tran 5 CHI noi khi DA cham tran.

CHUA verify DOM that. Lam o luot sau.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"

git add components/present-editor/PresentEditor.tsx
git commit -m "fix(present): L5 - panel phai (Inspector) them dau hieu con cuon duoc

Do DOM truoc khi sua xac nhan aside DA overflowY:auto va cuon duoc that
(scrollHeight 395 > clientHeight 302) - thieu la DAU HIEU con noi dung duoi
mep (macOS an thanh cuon khi khong re chuot). PHIEU-TRINH-LOI-UI 2026-08-03
muc L5. Sua thuan CSS, khong them state: scrollbarGutter:stable + bong-cuon
4-lop gradient (2 lop background-attachment:local phu kin khi vua khung,
2 lop scroll la vet mo lo ra khi con noi dung o mep). paddingBottom 28px.

CHUA do lai DOM sau khi sua. Lam o luot sau.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"

git add components/present-editor/Element.tsx
git commit -m "fix(present): L3 - thumbnail/slide chua mo: chu de anh khong tuong phan

resolveAutoTextColor (chon mau doc duoc khi de anh) chi chay trong
EditorCanvas cho slide DANG MO - slide chua ai mo (va thumbnail cua no o
SlideStrip) giu nguyen mau trang goc template, de len anh sang = khong doc
duoc (PHIEU-TRINH-LOI-UI 2026-08-03 muc L3). KHONG sua co che do mau (dung,
ton hon nhieu neu chay cho moi slide an) - chi mo rong dieu kien bat bong AA
manh san co cua P6a (autoShadowCss): truoc chi bat khi el.autoShadow (da do
va chot), nay bat SOM HON khi dang de anh ma mau CHUA ai chot (colorAuto).
Mau chot xong thi dieu kien tu tat, khong chong hieu ung.

CHUA verify browser (slide 3 + thumbnail, 2 theme). Lam o luot sau.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"

git add components/present-editor/Toolbar.tsx
git commit -m "fix(present): L4 - toolbar 2 hang ~30 nut -> gom popover 'Sap xep'

14 nut (can-le x6, thu tu lop x4, nhom/ra nhom x2, khoa, an) gom vao 1 nut
'Sap xep' mo ArrangePopover - portal ra body (luat K4 SO-KIEM-TONG: panel
kinh khong long trong chrome kinh) + useDismissable (Esc/bam ngoai, cung ho
su kien toan app). PHIEU-TRINH-LOI-UI 2026-08-03 muc L4, §0d: KHONG xoa nut
nao - Inspector.tsx van giu ban sao cum nay (co tu P6b) cho ai quen dung ben
phai, popover la LOI VAO THU HAI tu toolbar tren.

tsc --noEmit -p . sach (1 loi con lai o lib/cad/eyedropper.test.ts DA DOI
CHIEU giong het main, khong lien quan file nay). CHUA verify browser bam
thu nut Sap xep - chua ai NHIN THAY no chay. Lam o luot sau, UU TIEN TRUOC
khi lam viec khac."
```

Ghi chú cho Hoà: 4 commit `L1-L5` an toàn để chạy (đã tsc/lint sạch, test không vỡ). Commit L4
(Toolbar) khuyên **verify browser trước khi push lên nhánh chung** — đây là phần rủi ro nhất
(popover mới, chưa ai nhìn thấy chạy thật), dù tsc/lint đã sạch.

## Hàng đợi G4 còn lại (đọc §3 sổ tổng trước khi làm)
- Mood+Collab G2 trọn gói (khảo sát sẵn ở mục 04/08, đừng làm lại) · Present chooser (H4) ·
  empty state toàn app · Material Editor §3b (UI q7 mock chưa có).

---

# PHIÊN G4 — 05/08/2026 (tiếp) · A2 CommandPanel mồ côi + port màn 3D thống nhất + verify L1-L5

Đọc trước theo đúng lệnh: `SO-KIEM-TONG.md` §0→§0d · `PHIEU-CODE-IF-DOT6-2026-08-03.md` ·
`SPEC-DUNG-3D-THONG-NHAT.md`. 3 file này **chưa có trong worktree g4** lúc mở phiên (main đã
thêm 11 commit từ lần merge trước) — commit các fix Present L1-L5 còn treo (tsc/lint/test sạch
sẵn từ phiên trước) rồi mới `git merge main` để lấy tài liệu, tránh xung đột trên working tree bẩn.
Merge sạch, không conflict.

## ✅ VIỆC 1 — A2 "592 dòng mồ côi": quyết (b), xoá 2 file

`components/three/CommandPanel.tsx` (415 dòng, 5 tab đủ, khoá `tao/sua/vatlieu/camera/hien`) +
`ObjectProperties.tsx` (177 dòng) KHÔNG mount ở đâu. App thật chạy
`components/render-studio/Command3DPanel.tsx` (khoá tiếng Anh lệch, 3/5 tab placeholder).

**Bằng chứng quyết định** (khảo sát cả hai trước khi chọn, đúng §0b):
- `CommandPanel.tsx` tab Vật liệu dùng `materialsIn()` — `lib/three/materials.ts`, **catalog TĨNH
  10 item hardcode**.
- `Command3DPanel.tsx` tab Vật liệu dùng `useMaterials()` — **fetch THẬT** `/api/specs?kind=material`
  (ATLAS), đã verify browser nhiều lần các phiên trước.
- `Command3DPanel` + `Render3DModeSkeleton` là hệ THẬT: welcome-card onboarding wired thật
  (localStorage nhớ lựa chọn) · nút Tường gọi đúng engine `wallSegment()` ghi Doc có undo ·
  "Xem cả kho" nối `openLibrarySheet` (cơ chế MỘT thư viện, Hoà chốt 04/08).
- `CommandPanel.tsx` tab Tạo: 6 nút đều gọi `onCommand(cmd)` vào một bộ điều phối lệnh **CHƯA TỒN
  TẠI** (H1 trong spec: "sổ lệnh có ĐÚNG 0 lệnh 3D") — mount thẳng sẽ là **nút giả** (bấm không
  làm gì), vi phạm luật "không nút giả" nặng hơn giữ nguyên trạng.

**Quyết định: (b)** — giữ `Command3DPanel.tsx` (đang chạy, tốt hơn thật, không phải chỉ vì "đang
mount"), migrate khoá tab sang tiếng Việt theo spec M3 (`tao/sua/vatlieu/camera/hien` — grep xác
nhận không có localStorage lưu tab nên không cần migrate dữ liệu), xoá hẳn 2 file mồ côi (grep xác
nhận 0 importer thật, chỉ tự-tham-chiếu lẫn nhau qua `type SelectedBox`).

**Sự cố quy trình (khai thật)**: `git commit` không giới hạn pathspec đã vô tình gộp việc xoá 2
file mồ côi CHUNG với commit storey/specId (`adb8d67`) — do lệnh `git rm -q` xoá file từ TRƯỚC đó
trong phiên vẫn còn staged, `git commit` không kèm `-- pathspec` sẽ commit TOÀN BỘ index chứ không
chỉ phần vừa `git add`. Đúng luật `CLAUDE.md` "luôn `git commit -- pathspec` đích danh" — lần này
sai luật, ghi lại để không lặp. Không ảnh hưởng nội dung (cả hai thay đổi đều đúng, chỉ lẫn message).

**Verify browser thật** (127.0.0.1:3004, cả 2 theme): 5 tab đổi khoá vẫn hiện đúng UI cũ (Tạo có
nút Tường thật · Sửa/Camera/Hiện giữ hành vi) — bấm "Dựng khối đầu tiên" → `setTab('tao')` chạy
đúng (trước sửa dùng `'create'`) → bấm nút Tường → khối thật xuất hiện trong Doc, bước ① tự tick.
Không vỡ hành vi nào sau khi đổi khoá.

## ✅ VIỆC 2 — Port màn 3D thống nhất (mock `mock-3d-thong-nhat.html`)

**⚠️ 4 chỗ nhãn chặng cũ trong mock đã kiểm, KHÔNG port nguyên văn**: grep ra đúng 4 chuỗi
`"Vẽ"`/`"Dựng ảnh"` — nhưng chỉ **2 chỗ thật sự là nhãn chặng cũ** (segment control đầu trang,
dòng 82-83 mock: "Vẽ"/"Dựng ảnh" = tên 2 chặng đầu kiểu cũ, phải thành "2D Kỹ thuật"/"3D Thiết
kế"). **2 chỗ còn lại** (dòng 244+246, nút nổi "Dựng ảnh AI") **KHÔNG phải nhãn chặng** — đó là
tên HÀNH ĐỘNG của nút, và chính `SPEC-DUNG-3D-THONG-NHAT` §7.1 xác nhận tên đúng là **"Dựng ảnh"**
(bỏ "AI" — spec dùng chữ này làm chuẩn). Code port của tôi không copy chuỗi nào từ mock — viết
tên mới đúng theo spec (`2D Kỹ thuật`/`3D Thiết kế` đã có sẵn trong header app; nút "Dựng ảnh" viết
mới) nên không dính lỗi cũ. Không sửa file `.html` gốc — mock là tài liệu tham chiếu lịch sử, chỉ
đọc không port nguyên văn (đúng luật port: "port nguyên văn TOKEN, không port nguyên văn NHÃN cũ").

### D1 (tiên quyết) — `docToObjScene()` đọc `storey`/`specId` thật

H7 trong spec ghi đúng: "3D vẫn KHÔNG đọc `storey`" — grep trước khi sửa = đúng 1 comment, 0 dòng
code. Thêm `storey?`/`specId?` vào `SceneGroup`, đọc NGUYÊN VĂN từ entity gốc (`h.storey`/`b.storey`,
`h.specId`/`b.specId`) cho 3 loại group sinh từ MỘT entity thật (tường/nội thất/cửa sổ). Sàn/Phòng/
Trần là hình học TỔNG HỢP (bbox/dò biên gộp nhiều entity) — KHÔNG suy đoán, để trống có chủ đích.

**Suýt phá vỡ engine, đã bắt kịp trước khi lên browser**: định gán thêm `entityId` cho group Nội
thất (để chọn được trong 3D, đồng bộ với tường) — nhưng đọc kỹ `Scene3DViewer.tsx:201` thì MỌI
group có `entityId` bị loại khỏi đường dựng hình TĨNH khi `mode='massing'` (coi là đang chỉnh),
rồi `buildMassingWalls()` lại đòi `heightMm` mới đưa vào đường TƯƠNG TÁC — nội thất không có
`heightMm` ⇒ rơi vào khe hở giữa hai đường, **biến mất khỏi cảnh hoàn toàn**. Revert ngay, ghi
cảnh báo thành comment tại chỗ trong `cad-to-obj.ts` để phiên sau không lặp lại.

**Test mới** (`cad-to-obj.test.ts`, 5 case): không gán storey → mọi group `undefined` (không bịa)
· tường/nội thất mang đúng storey entity gốc · Floor không suy đoán · tường khác không "lây"
storey. 51/51 pass (46 cũ + 5 mới). `npm test` toàn repo sau đó: **115/115 file pass, 0 fail**.

### Cây đối tượng theo TẦNG + panel thuộc tính + nút "Dựng ảnh" (tab "Hiện" của `Command3DPanel`)

- **Cây**: gom `scene.groups` theo `storey` thật, bucket "Chưa xếp tầng" luôn ở CUỐI kèm nút
  **"Gán tầng trệt cho N khối"** — số N tự tính từ chính bucket (`rows.length`), không truyền
  count riêng để tránh lệch số giữa nhãn và nút. Bấm nút ghi THẬT vào `doc.entities` (không qua
  group/entityId — nội thất/cửa sổ chưa có entityId trong group nên đây là đường DUY NHẤT chạm
  đúng entity), `docToObjScene` phản xạ lại tự động (luật một nguồn).
- **Ẩn/hiện THẬT**: `Render3DModeSkeleton` lọc `scene.groups` theo tập tên đang ẩn TRƯỚC khi đưa
  vào `Viewport3D` — không phải cờ trang trí trên hàng cây.
- **Chọn = xem thuộc tính**, khác chọn-để-gán-vật-liệu (tab Vật liệu). CHỈ group có `entityId`
  (hôm nay = tường) đẩy tiếp thành `Viewport3D.selectedId` → gizmo THẬT (tái dùng hạ tầng có sẵn,
  không bịa mới). Group khác (nội thất/cửa sổ/sàn/phòng) vẫn xem được thuộc tính, panel tự nói rõ
  "Chưa chọn được trong khung nhìn 3D — chỉ xem thuộc tính" — trung thực, không giả vờ có tương
  tác chưa xây.
- **Panel thuộc tính**: Cao (thật, `group.heightMm`) · Tầng (thật, `group.storey`) · quả cầu vật
  liệu tra `specId` qua `useMaterials()` (ATLAS thật, nâng lên top-level dùng chung với tab Vật
  liệu — tránh fetch 2 lần cùng API).
- **Nút "Dựng ảnh"** (đúng CHỮ spec §7.1, không phải "Dựng ảnh AI" của mock cũ): làm ĐÚNG phần
  spec đã xác nhận có thật — gạt mode qua `useStageMode('render')` (không đổi chặng, không mất
  ngữ cảnh). Chuỗi 3 node dựng-sẵn-dây-nối (§7.2 đầy đủ) **KHÔNG làm** — chính spec tự ghi "⚠️
  CHƯA VERIFY: chưa có hàm dựng-sẵn-node-graph từ ngoài" — không bịa phần chưa xác nhận.

**Verify browser thật** (127.0.0.1:3004, cả 2 theme, dự án mẫu có 1 tường test từ phiên trước):
- Tab Hiện hiện bucket "CHƯA XẾP TẦNG (2)": Sàn + Tường 1.
- Bấm "Gán tầng trệt cho 2 khối" → Tường 1 chuyển bucket "GF" THẬT (Doc ghi thật, phản xạ tự động)
  · Sàn ở lại "Chưa xếp tầng" ĐÚNG LÝ (hình học tổng hợp, không có entity nguồn — không phải bug).
- Chọn "Tường 1" → panel hiện Cao **2.700 mm** thật · Tầng **GF** thật · "Chưa gán vật liệu"
  (đúng, chưa ai gán specId) · **gizmo 3 trục THẬT hiện trong khung nhìn** (ảnh chụp xác nhận).
- Bấm "Ẩn" → tường **biến mất khỏi khung nhìn thật** (chỉ còn mép sàn) · bấm lại → hiện lại đúng.
- Bấm "Dựng ảnh" → **gạt sang mode node thật** (canvas đổi sang node graph, "Vẽ 3D" switch tắt).
- Dark theme: toàn bộ cây/panel/nút đọc rõ, không vỡ layout.

tsc 0 lỗi (từ đầu, không phải sửa-rồi-mới-sạch) · lint sạch mọi file sửa.

## ✅ VIỆC 3 — Verify browser 5 lỗi UI Trình bày (L1-L5, code đã commit phiên trước)

`git log --all -- components/present-editor/` xác nhận: L1-L5 đã code + commit phiên trước
(`174c1b7`…`06a502d`) nhưng ghi rõ "CHƯA verify browser". Phiên này verify đủ cả 5, cả 2 theme:

- **L1**: tab đầu đọc **"Hồ sơ 1"** (không phải "Trang 1") · góc phải đọc **"8 slide"** (không
  phải "1/5") — đúng đơn vị người dùng đang nhìn.
- **L2**: slide 4 "Triết lý thiết kế" — đo `getBoundingClientRect` 14 khối bullet trong DOM,
  **0px chồng lấn** (đạt tiêu chí phiếu "<2px"), 4 nội dung cột khác nhau (không còn lặp chuỗi
  cứng "Không gian chuẩn mực/Ít mà đúng" ×4).
- **L3**: thumbnail slide 3 "Không gian sống kể…" — đọc computed style xác nhận `text-shadow`
  2 lớp bóng tối ĐÃ đắp lên chữ trắng dù slide chưa từng mở tới (đúng cơ chế mới: bật sớm khi đè
  ảnh mà màu chưa ai chốt).
- **L4**: bấm nút "Sắp xếp" → popover 14 nút mở đúng vị trí dưới nút, không cắt mép màn hình ·
  Esc đóng đúng (qua `useDismissable`).
- **L5**: đọc computed style aside Inspector — `scrollbar-gutter: stable` · `padding-bottom: 28px`
  · `background-attachment: local, local, scroll, scroll` (đúng 4 lớp bóng-cuộn đã code) — panel
  vẫn cuộn được (`scrollHeight > clientHeight`), chỉ thêm dấu hiệu còn nội dung, không giả vờ nội
  dung dài vừa khung.

## Commit phiên này (đã push local trên `nhanh-g4`, chưa merge main)

| Commit | Nội dung |
|---|---|
| `adb8d67` | storey+specId vào SceneGroup (D1) **+ xoá 2 file mồ côi** (lẫn message, xem "sự cố quy trình" trên) |
| `4518bd6` | khoá tab tiếng Việt + cây đối tượng theo tầng + panel thuộc tính + nút Dựng ảnh |

## ⬜ CHƯA LÀM / còn treo (khai thật)
- Chọn nội thất/cửa sổ trong khung nhìn 3D — cần mở rộng CẢ `Scene3DViewer.tsx` (đường tĩnh) LẪN
  `buildMassingWalls()` (đường tương tác) cho đúng, không phải chỉ thêm entityId (đã ghi cảnh báo
  tại chỗ trong code). Việc riêng, không nhỏ.
- Chuỗi 3 node dựng-sẵn-dây-nối khi bấm "Dựng ảnh" (§7.2 đầy đủ) — chặn ở việc xác minh
  `addNodes`-với-dây-nối-sẵn có tồn tại không (spec tự ghi CHƯA VERIFY).
- Bậc PHÒNG trong cây (chỉ có TẦNG › VẬT, 2 bậc — đúng spec §5.2 "chạy 2 bậc trước", chờ
  `RoomEntity` — câu treo §11.2 spec, chưa Hoà chốt).
- Nhãn hàng trong cây dùng số thứ tự (Tường 1/2…) chứ không phải tên phòng thật (Tường Bắc/Tây
  như mock) — vì `RoomEntity`/hướng tường chưa có trong Doc, KHÔNG bịa hướng.
- Dự án mẫu còn 1 tường test (từ VIỆC 1 phiên trước, nay có thêm storey='GF') — không xoá được do
  hành động Delete/BackSpace bị lớp an toàn chặn (đúng luật, không tìm đường vòng) — vô hại, chỉ
  là metadata, đã khai báo minh bạch qua nhiều phiên.

---

# CHỐT PHIÊN G4 — 05/08/2026 (context 92%, dừng theo lệnh Hoà)

## ✅ XONG (đủ tsc/lint/test + verify browser thật cả 2 theme)
1. **VIỆC 1 (A2)** — xoá `CommandPanel.tsx`+`ObjectProperties.tsx` mồ côi, giữ `Command3DPanel.tsx`,
   migrate khoá tab tiếng Việt. `adb8d67`+`4518bd6`.
2. **VIỆC 2 (D1 + §5+§6+§7)** — `docToObjScene()` đọc storey/specId thật · cây đối tượng theo
   tầng · panel thuộc tính · nút "Dựng ảnh" gạt mode thật. `adb8d67`+`4518bd6`.
3. **VIỆC 3 — 5 lỗi UI Trình bày (L1-L5)**: code đã có từ phiên trước (`174c1b7`…`06a502d`), phiên
   này **verify browser thật xong cả 5, cả 2 theme** (L1 đơn vị đúng · L2 đo rect 0px chồng lấn ·
   L3 bóng chữ tự bật sớm · L4 popover đóng-mở đúng · L5 bóng-cuộn + scrollbar-gutter). Không còn
   mục nào ghi "CHƯA verify" trong nhóm này nữa.
4. Docs cập nhật + commit: `BAO-CAO-G4.md` · `SO-KIEM-TONG.md` §1 (thêm dòng, không xoá dòng cũ) ·
   `CHECKLIST-TONG.md` (2 hàng mới + cập nhật cột Code/Audit). `63577c0`.

Cây `nhanh-g4` **sạch tuyệt đối** lúc chốt (`git status --short` rỗng), tsc 0 lỗi.

## ⬜ CÒN (đọc mục "CHƯA LÀM / còn treo" phía trên trước, đây chỉ tóm tắt độ ưu tiên)
1. Chọn nội thất/cửa sổ trong 3D — **có thể đã được PHU giải quyết một phần trên `main`**, đọc
   bẫy #1 dưới TRƯỚC KHI làm lại.
2. Chuỗi 3-node dựng-sẵn khi bấm "Dựng ảnh" (§7.2) — chặn ở việc kiểm `addNodes`-với-dây-nối-sẵn.
3. D8 (ô nhập số VCB trong viewport), D13 (Inspector tự sinh theo schema §6.2), D15 (đường chạm
   tablet) — chưa động tới, đúng thứ tự lộ trình spec (D7 gizmo thật chưa xong nên D8 chưa nên
   bắt đầu).
4. Mood+Collab G2 trọn gói · Present chooser (H4) · empty state toàn app · Material Editor §3b —
   hàng đợi cũ từ phiên 04/08, chưa ai động (xem mục "Hàng đợi G4 còn lại" phía trên).

## 🔴 BẪY PHIÊN SAU PHẢI ĐỌC TRƯỚC KHI ĐỘNG VÀO `lib/three/cad-to-obj.ts` HOẶC MERGE MAIN

### Bẫy #1 — `main` đã có commit ĐỤNG ĐÚNG CHỖ tôi vừa sửa, khác hướng
Trong lúc tôi làm phiên này, `main` tiến thêm 8 commit (từ `a253c03` → `ccea29b`), trong đó
**`1c0b91d` "A4 — gán entityId cho MỌI nhóm 3D"** sửa **CHÍNH XÁC** vùng tôi vừa chạm
(`lib/three/cad-to-obj.ts`, các lệnh gọi `builder.object(...)` cho Furn_i/Window_i) nhưng theo
**hướng ngược lại quyết định của tôi**:
- Tôi: KHÔNG gán `entityId` cho Furn_i/Window_i vì phát hiện `Scene3DViewer.tsx:201` +
  `buildMassingWalls()` sẽ làm chúng **biến mất khỏi cảnh** ở mode massing (ghi thành cảnh báo
  comment tại chỗ, coi là việc riêng "chưa làm").
- PHU (main, `1c0b91d`): **sửa đúng gốc** — thêm hàm dùng chung `isMassingWallGroup()` (kiểm CẢ
  `entityId` LẪN `heightMm`) cho cả `buildMassingWalls()` lẫn `Scene3DViewer.tsx`, RỒI MỚI gán
  `entityId` an toàn cho mọi nhóm. Đây là bản đầy đủ hơn — cảnh báo "chưa làm" của tôi ở mục CHƯA
  LÀM phía trên **có thể đã LỖI THỜI**, PHU đã giải quyết đúng bài toán tôi né.

**Việc phiên sau PHẢI làm trước khi merge**: đọc kỹ diff `1c0b91d` (đặc biệt hàm mới
`isMassingWallGroup()` nó thêm ở đâu — nghi `lib/three/obj-scene-to-geometry.ts` hoặc
`Scene3DViewer.tsx`), rồi **hợp nhất TAY** với thay đổi của tôi trên CÙNG các dòng
`builder.object('Furn_...'/'Window_...', ...)` — giữ CẢ hai: `storey`/`specId` (tôi thêm) VÀ
`entityId` (PHU thêm, nếu hàm `isMassingWallGroup()` của họ đã làm nó an toàn). Đây **không phải**
conflict Git tự động phát hiện được gọn (2 bên sửa gần nhau, có thể merge im lặng sai) — phải đọc
bằng mắt, không tin merge tự động.

**Hệ quả tốt nếu đúng**: nếu PHU đã làm xong, thì "cây theo tầng" của tôi + "chọn nội thất trong
3D" của PHU CỘNG LẠI = mục CHƯA LÀM #1 ("Chọn nội thất/cửa sổ trong khung nhìn 3D") có thể ĐÃ XONG
mà không cần code thêm gì — chỉ cần verify browser sau khi merge.

### Bẫy #2 — D2 (37 CommandDef `render.3d.*`) VẪN CHƯA có trên main
Đã kiểm `grep -c "render.3d\." lib/commands/registry.ts` trên `main` = **0**. `A1` (`ee85c3f`,
`findByAlias()` lọc theo `when(ctx)`) đã xong nên KHÔNG còn bị chặn về mặt kỹ thuật, nhưng **chưa
ai khai 37 lệnh** — nghĩa là tab "Tạo"/"Camera" của `Command3DPanel` vẫn đúng phải giữ placeholder
trung thực (đừng tưởng D2 xong mà thêm nút gọi `onCommand` — vẫn sẽ là nút giả cho tới khi D2 làm).

### Bẫy #3 — "Chọn tất cả cùng loại" (§4, D12) đợi G4, không đợi PHU nữa
`main` (`ccea29b`) tự ghi nhận: A4 (PHU) xong nhưng **KHÔNG ĐỦ** mở khoá "Chọn hết cùng loại" —
điều kiện thật là **Đ3/P3 (selection sống ở `useCadStore`, việc của G4, chưa làm)**. Đừng chờ PHU
làm tiếp phần này — quả bóng đang ở sân G4.

### Bẫy #4 — sự cố quy trình đã xảy ra 1 lần, tránh lặp
`git commit` không giới hạn pathspec đã gộp nhầm việc xoá 2 file mồ côi vào commit `adb8d67`
(chỉ định danh cho storey/specId). Luôn `git commit -- <pathspec>` đích danh, kiểm `git status`
TRƯỚC mỗi lần add, đừng tin file đang stage khớp đúng ý định.

### Bẫy #5 — docs có thể conflict khi merge
`nhanh-g4` và `main` **CÙNG SỬA** `SO-KIEM-TONG.md` và `CHECKLIST-TONG.md` trong cùng khung giờ
(`ccea29b` bên main, `63577c0` bên tôi) — 2 file này gần như chắc chắn conflict khi merge. Xử theo
đúng convention từng file: `SO-KIEM-TONG.md` §1 append-only (giữ CẢ HAI dòng mới, không dòng nào
thắng dòng nào) · `CHECKLIST-TONG.md` mỗi hàng độc lập theo hạng mục, so dòng-theo-dòng để giữ cả
hai cập nhật, không lấy nguyên 1 bên.

## 📋 KHỐI KHỞI ĐỘNG CHO PHIÊN G4 KẾ NHIỆM

**Thứ tự đọc** (đúng luật `SO-KIEM-TONG.md` §4):
1. `docs/SO-KIEM-TONG.md` §0→§0d (luật trung thực/nghiên cứu-trước/giữ-cái-tốt/ba-mảng) → §1 (2
   dòng mới nhất, về A2 + cây theo tầng) → §2 (vùng mảng G4) → §3 (hàng đợi).
2. `docs/00-CHOT.md` (sổ mục lục quyết định).
3. **File này (`BAO-CAO-G4.md`) từ mục "CHỐT PHIÊN G4 — 05/08/2026" NGƯỢC LÊN** — đọc hết 5 bẫy
   trên TRƯỚC KHI chạm `lib/three/cad-to-obj.ts` hoặc chạy `git merge main`.
4. `docs/PHIEU-CODE-IF-DOT6-2026-08-03.md` — đọc lại NHÓM C (hàng đợi cũ còn nợ), đối chiếu với
   bẫy #2/#3 ở trên: dòng "G4: 5 lỗi UI Trình bày" nay **XONG**, gạch bỏ khỏi hàng đợi.
5. `docs/SPEC-DUNG-3D-THONG-NHAT.md` §10 (bảng lộ trình D0-D15) — đối chiếu bẫy #1: D0/D9/D10/D14
   phần nút có thể đã XONG (tôi + PHU cộng lại), kiểm bằng browser trước khi báo cáo lại là "đã
   xong" hay "còn thiếu X".

**`main` đang ở commit**: `ccea29b` (8 commit mới hơn lần `nhanh-g4` merge gần nhất `a253c03`).
**`nhanh-g4` đang ở commit**: `63577c0`, cây sạch, CHƯA push origin, CHƯA merge main.

**Hàng đợi PHU còn theo phiếu** (không phải việc G4, chỉ để biết bối cảnh): BOQ B7/B9 còn treo
(B0-B6+B8+B10 đã xong) · sửa nhãn `model.ts:101` `IfcFurnishingElement`→`IfcFurniture` (NC-11,
chưa ai làm) · GPL-3.0 `@mlightcad/libredwg-web` vẫn chờ Hoà quyết trước phát hành.

## 🔧 KHỐI LỆNH MERGE — CHO HOÀ CHẠY TAY, KHÔNG TỰ MERGE LÚC CHỐT PHIÊN

Worktree `~/Downloads/interiorflow-g4` (nhánh `nhanh-g4`) hiện **CHƯA merge vào main** — 3 commit
mới (`adb8d67`·`4518bd6`·`63577c0`) đứng riêng. Theo đúng luật `CLAUDE.md` "không tự merge/push
main nếu chưa hỏi" + bẫy #1/#5 ở trên (đụng độ ngữ nghĩa thật trong `cad-to-obj.ts`, không phải
conflict Git tự nhận diện gọn), lệnh dưới đây **CHỈ chuẩn bị, KHÔNG tự chạy**:

```bash
cd ~/Downloads/interiorflow

# 1. Xem trước phạm vi đụng độ TRƯỚC khi merge thật (đọc bằng mắt, đừng bỏ qua)
git diff a253c03 main -- lib/three/cad-to-obj.ts
git log --oneline a253c03..main -- lib/three/

# 2. Merge thật (chạy trong worktree g4, KHÔNG phải repo chính)
cd ~/Downloads/interiorflow-g4
git fetch . main
git merge main
# — nếu conflict trong lib/three/cad-to-obj.ts: hợp nhất TAY theo Bẫy #1 (giữ storey/specId CỦA
#   NHÁNH NÀY + entityId CỦA MAIN trên cùng dòng builder.object(...), không lấy nguyên 1 bên)
# — nếu conflict trong docs/SO-KIEM-TONG.md hoặc docs/CHECKLIST-TONG.md: hợp nhất theo Bẫy #5

# 3. Sau merge sạch — chạy đủ 3 lệnh trước khi coi là xong
npx tsc --noEmit -p .
npm test
# rồi verify browser thật /projects/.../render, mode Vẽ 3D, tab Hiện — xem nội thất có
# chọn được trong khung nhìn 3D chưa (câu hỏi mở của Bẫy #1)

# 4. Merge xong + test sạch mới push
git push origin nhanh-g4
```
