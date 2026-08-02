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

