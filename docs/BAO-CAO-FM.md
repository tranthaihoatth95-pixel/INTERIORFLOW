# BÁO CÁO FM — File Manager (/files) + Cài đặt (/settings)

> Phiên G4 (tiếp sau Kệ Thư viện), worktree `~/Downloads/interiorflow-g4` (nhánh `nhanh-g4`).
> Đọc theo thứ tự đã giao: `docs/CHOT-FILEMANAGER-SETTINGS-2026-08-02.md` → `docs/SPEC-FILE-MANAGER.md`
> → `docs/SPEC-DESIGN-SYSTEM-IF.md` §2c/§2d/§5 → `docs/SPEC-NGON-NGU-CHI-DAN.md` →
> `docs/REF-VISUAL-2026-08-02.md` → `docs/mocks/mock-files-polished.html` →
> `docs/mocks/mock-settings-polished.html` (2 vật mẫu pixel, tới sau, làm giống hệt).

## Tóm tắt tiến trình (3 vòng, mỗi vòng 1 chỉ đạo mới tới giữa lúc làm)

1. **Vòng 1** — build `/files` theo `CHOT-FILEMANAGER-SETTINGS` + `SPEC-FILE-MANAGER` (nav chữ,
   card folder lớn, cơ chế mock local). Hoàn chỉnh, verify browser, tsc/lint/test sạch.
2. **Vòng 2** — chỉ đạo mới: "sửa lại /files theo VẬT MẪU PIXEL `mock-files-polished.html`, làm
   giống hệt, không sáng tác". **Xây lại gần như toàn bộ** components theo đúng số đo mock (rail
   capsule icon-only, folder = chip ngang, storage gauge dạng mock, upload toast kính có đếm
   ngược). Chốt luật mới ghi vào yêu cầu: "mọi màn làm theo mock, màn chưa có mock thì DỪNG xin
   mock" — tự đối chiếu, KHÔNG bịa số đo.
3. **Vòng 3** — chỉ đạo mới: Phần 2 Cài đặt ĐÃ được duyệt (2 câu treo: trang riêng `/settings` ·
   theme cấp APP), có mock riêng `mock-settings-polished.html`. Build `/settings` giống hệt mock,
   theme phải đổi được THẬT.

## Vòng 2 — `/files` pixel-match

**Đối chiếu mock, mục nào giống, mục nào lệch có lý do:**

| Khu | Mock yêu cầu | Đã làm | Lệch (có lý do) |
|---|---|---|---|
| Rail trái | capsule bo 30, item active bubble tròn đen scale 1.12, icon-only | Đúng — `AppRail.tsx` (đổi tên từ `FileRail.tsx`, dùng chung cho cả `/files` và `/settings` vì 2 mock demo CÙNG 1 rail) | — |
| Toolbar | viewseg chip + nút Tải lên capsule ĐEN cao 38 | Đúng | — |
| Breadcrumb | hàng riêng dưới header, chip hover | Đúng | — |
| Folder chip | icon 2 lớp tím/be + tên + "n file · size" | Đúng — số liệu THẬT (đệ quy xuống con, không phải số tĩnh trong mock) | Bỏ avatar cộng sự + icon nguồn Drive trên chip (mock không vẽ — mock note gốc CHOT-FILEMANAGER có nhắc avatar, coi mock polished là bản mới hơn thắng) |
| Empty state | fan 3 ảnh xoay lệch viền trắng 4px + CTA đen cao 48 | Đúng | — |
| Upload toast | kính blur 20 + badge loại + track tím 5px + %, có "còn N giây" | Đúng — đổi thời lượng upload giả lập lên 4.2s để đếm ngược có ý nghĩa khi verify | — |
| Storage gauge (inspector) | ring r26/stroke8, số to = BYTES (không phải %), 4 hàng Dự án/Sao lưu/Thư viện/Khác nhạt dần 1 sắc tím | Đúng — gộp Knowledge+_System thành "Khác" đúng như mock ngụ ý (mock chỉ có 4 hàng, dữ liệu tôi có 5 root) | — |
| File card (inspector) | ambient tint theo màu ảnh + doc-chip góc gấp + tag CHÍNH THỨC + "Mở trong InteriorFlow" tím đầy | Đúng | Tab Mô tả/Bình luận + khối matId·hãng·giá (vật liệu) mock không vẽ — giữ lại vì cần thật, không phải bịa |
| Lưới file khi nhiều file | — | Giữ khung cũ (card 152px), chỉ retint theo `fm-tokens` | **Mock KHÔNG demo lưới file đầy** (chỉ demo empty-state + toast) — không có số đo để khớp pixel. Theo đúng luật mới ("màn chưa có mock thì dừng xin mock"), đây là trường hợp CHƯA CÓ mock cho phần này — ghi rõ ở đây thay vì tự chế, xin mock riêng nếu cần khớp tuyệt đối |

**2 bug thật bắt được khi verify (không phải chỉ tin mock khớp bằng mắt):**
1. **Empty state ở thư mục chỉ-đọc** vẫn hiện nút "Chọn file từ máy" (bấm được nhưng vô nghĩa vì
   không có quyền ghi) — sửa: `EmptyState` nhận `canUpload`, ẩn hẳn CTA khi false, đổi câu chữ.
2. **`folderStats` chỉ đếm file TRỰC TIẾP** trong thư mục → root như "Projects"/"Library" (chỉ chứa
   thư mục con, không file trực tiếp) luôn hiện "trống" dù có hàng chục file bên trong — sửa: đệ
   quy xuống mọi thư mục con (giống Finder "n mục" tính cả bên trong).

## Vòng 3 — `/settings` pixel-match

**File `app/settings/page.tsx` (đã tồn tại) — CÓ SỬA**, theo chỉ đạo trực tiếp của Hoà lúc giao
việc này ("Commit 'feat(settings): trang /settings theo mock pixel'" — xác nhận rõ /settings đổi
giao diện). Nội dung cũ (`AccountSettings`/`AppearanceSettings`/`ExperienceSettings`/
`StorageSettings`/`AiDependencySettings`/`GuModelSettings`) **KHÔNG bị xoá tính năng nào**:

| Nhóm cũ | Số phận |
|---|---|
| `AccountSettings` (avatar+tên+đăng xuất) | Thay bằng `ProfileCard.tsx` mới — avatar/tên/email/đăng xuất vẫn ĐỌC THẬT từ `useFlowStore`, chỉ đổi vỏ theo mock |
| `AppearanceSettings` (theme+ngôn ngữ) | Theme → `AppearanceCard.tsx` (thật, `useFlowStore.themePref`). Ngôn ngữ → gộp vào `StorageCard.tsx` (thật, `useFlowStore.lang`) |
| `StorageSettings` (chọn thư mục gốc) | → `StorageCard.tsx`, TÁI DÙNG NGUYÊN `lib/root-folder.ts` (File System Access API) — không viết lại, chỉ đổi vỏ. **Giữ thêm nút "Kiểm tra kết nối"** dù mock không vẽ, vì đây là chẩn đoán cho lỗi quyền ghi ĐÃ BIẾT (xem comment gốc trong `StorageSettings.tsx`) — xoá sẽ mất công cụ chẩn đoán thật |
| `ExperienceSettings` (xem lại hướng dẫn) | Mock không vẽ nhóm này — dời nguyên xuống khu "Nâng cao" cuối trang, KHÔNG đổi giao diện |
| `AiDependencySettings` / `GuModelSettings` | Mock không vẽ — dời nguyên xuống khu "Nâng cao", KHÔNG đổi giao diện |

**Đối chiếu mock — mục nào thật, mục nào mock-local (đúng chỉ đạo "avatar/nơi-lưu mock local trước"):**

| Khu | Thật hay mock? |
|---|---|
| Avatar lớn + tên + email | **THẬT** (`UserAvatar` + `useFlowStore.user`) |
| Nút ✎ + ô "＋" trong grid avatar | **THẬT** — trỏ `/settings/avatar` (bộ dựng đủ 13 slot có sẵn, không đụng) |
| 7 swatch màu trong grid | **Mock/trang trí** — chỉ đổi viền-chọn tại chỗ, KHÔNG ghi đè avatar thật (đúng chỉ đạo) |
| Theme Sáng/Tối/Theo hệ thống | **THẬT** — xem mục "Bug thật" dưới, đã sửa để đổi được thật |
| Hình nền canvas | **Nửa thật**: chọn xong ghi `document.documentElement.dataset.canvasWallpaper` NGAY (thật), nhưng CHƯA có canvas nào đọc thuộc tính này — xem "Cần nối tay" |
| Nơi lưu file | **THẬT** — tái dùng `lib/root-folder.ts`, không viết lại |
| Ngôn ngữ | **THẬT** (`useFlowStore.lang/setLang`) |
| Giảm chuyển động / Tự sao lưu | **State thật, persist localStorage riêng** — nhưng CHƯA có nơi tiêu thụ (không có công tắc "ép tắt motion" nào đọc cờ này ở nơi khác trong app, auto-backup không có job thật chạy nền) — xem "Cần nối tay" |

**1 bug thật nghiêm trọng bắt được khi verify (không phải lỗi vặt):**
- **Theme không đổi được thật** — build đầu tiên dùng hex CỐ ĐỊNH lấy từ mock (chỉ có bản sáng),
  nên bấm "Tối" thì store/`data-theme` đổi đúng nhưng MÀU MÀN HÌNH không nhúc nhích — chọn "Tối"
  xong hiện tick nhưng nền vẫn sáng. Đây LÀ ĐÚNG điều Hoà yêu cầu phải thật ("Theme thật sự đổi
  được... CSS var đã có dark theme trong app"), nên không thể để nguyên.
  **Sửa**: `fm-tokens.tsx` đổi từ hằng số hex → biến CSS `var(--fm-*)`, định nghĩa 2 bộ giá trị
  (sáng/tối) qua component `<FmThemeVars/>` render 1 lần ở gốc mỗi shell, chọn theo
  `[data-theme]` đã có sẵn trên `<html>` (chính cơ chế app dùng, xem `lib/store.ts` hàm
  `applyTheme()` — set `document.documentElement.dataset.theme` mỗi lần đổi `themePref`). Không
  đụng `app/globals.css` (ngoài vùng file cứng) — tự định nghĩa biến `--fm-*` riêng.
  **Bug con phát sinh khi sửa**: `<style>{cssString}</style>` (JSX con dạng text) bị React
  HTML-escape (`'` → `&#x27;`) khi render server, nhưng trình duyệt KHÔNG giải mã entity bên
  trong thẻ `<style>` (khác `<div>`) → CSS vỡ ở bản server-render + lệch với bản client
  (không escape) → hydration mismatch thật (bắt được qua console lúc verify, không phải đoán).
  Sửa đúng: `<style dangerouslySetInnerHTML={{__html: css}} />` — cách chuẩn để bơm CSS thô qua
  React. Verify lại: bấm "Tối" → CẢ TRANG đổi màu thật (nền gần đen, chữ sáng), console sạch.

## Bug nhỏ + bài học công cụ (không phải bug code)

- 2 lần đổi tên file (`FileManagerNav.tsx`→xoá, `FileRail.tsx`→`AppRail.tsx`, `fm-tokens.ts`→`.tsx`)
  gây lỗi HMR "Failed to read source code" tạm thời (webpack cache cũ trỏ path đã xoá) — không
  phải bug code, xác nhận bằng `tsc`/`eslint` sạch mỗi lần; sửa bằng xoá `.next` + khởi động lại
  dev server sạch.
- Trong lúc verify, `computer{action:"left_click"}` bằng toạ độ/ref thỉnh thoảng không bắn sự
  kiện tới React (không phải bug app — xác nhận bằng cách bắn `element.click()` qua
  `javascript_tool`, điều hướng đúng ngay) — vấn đề công cụ trình duyệt, không phải code G4.

## File mới / có sửa

```
components/filemanager/AppRail.tsx        — rail dọc chung /files + /settings (thay FileRail.tsx)
components/filemanager/EmptyState.tsx     — REBUILD pixel vòng 2
components/filemanager/FileManagerInspector.tsx — REBUILD pixel vòng 2
components/filemanager/FileManagerShell.tsx — REBUILD pixel vòng 2
components/filemanager/FileTile.tsx       — retint fm-tokens
components/filemanager/FolderCard.tsx     — REBUILD pixel vòng 2 (chip, không phải card)
components/filemanager/StorageGauge.tsx   — REBUILD pixel vòng 2
components/filemanager/UploadCard.tsx     — REBUILD pixel vòng 2 (toast, không phải inline card)
components/filemanager/fm-tokens.tsx      — token màu (mới) → theme-reactive (sửa vòng 3)
components/filemanager/icons.ts           — map icon (không đổi)
lib/filemanager/local-state.ts · mock-data.ts · queries.ts — queries.ts thêm folderStats đệ quy

app/files/page.tsx                        — không đổi (chỉ render shell)
app/settings/page.tsx                     — CÓ SỬA (file có sẵn, theo chỉ đạo trực tiếp Hoà)
app/settings/_components/ProfileCard.tsx · AppearanceCard.tsx · StorageCard.tsx · PixelSettingsShell.tsx — mới
app/settings/_lib/local-state.ts          — mới

docs/BAO-CAO-FM.md                        — file này
docs/mocks/mock-files-polished.html · mock-settings-polished.html — 2 vật mẫu Hoà thả vào (chưa commit ở đâu, đưa vào commit này để giữ nguồn đối chiếu)
```

`app/settings/avatar/page.tsx` — không đụng.

## Verify đã chạy

- `tsc --noEmit` toàn repo → **0 lỗi** (chạy lại nhiều lần, mỗi bước sửa lớn).
- `next lint` trên toàn bộ vùng file cứng → **0 warning/error**.
- `npm test` → **exit 0**, toàn bộ suite pass (repo hiện ~90+ nhóm test sau khi merge main — không
  có nhóm nào của G4 riêng, nhưng xác nhận không phá gì của phiên khác).
- Browser thật qua `127.0.0.1:3004` (dev server riêng phiên này, không đụng `.claude/launch.json`):
  - `/files`: root → Projects → Nord Villa → 01-input (đúng path mock demo) — empty state khớp
    pixel · upload thật (dispatch `File` synthetic qua input thật, không phải giả lập UI) → toast
    đếm ngược "còn N giây" đúng · thư mục Knowledge (chỉ đọc) → empty state ĐÚNG bản rút gọn, không
    còn CTA sai · folder chip số liệu đệ quy đúng sau khi sửa.
  - `/settings`: Hồ sơ hiện avatar/tên thật (khách chưa đăng nhập) · 3 thẻ theme + tick đúng ·
    lưới hình nền · Nơi lưu file hiện đúng trạng thái thật "Chưa chọn thư mục" (File System Access
    API thật, không phải chuỗi tĩnh) · Ngôn ngữ/switch đúng vị trí mock · **đổi theme Sáng↔Tối
    THẬT đổi cả màu trang** (đã verify cả 2 chiều, console sạch).
  - Không còn cảnh báo console nào sau khi sửa hết 3 bug ở trên (kiểm bằng tab trình duyệt MỚI
    mỗi lần, tránh nhiễu log HMR cũ — bài học từ phiên trước).

## Cần nối tay (code chính, sau khi merge) — G4 KHÔNG tự sửa vì ngoài vùng file cứng

1. **Hình nền canvas chưa có nơi tiêu thụ**: `/settings` ghi
   `document.documentElement.dataset.canvasWallpaper` (giá trị: `none|dots|grid|warm|cool`) NGAY
   khi chọn — canvas CAD/Render/Present cần ĐỌC thuộc tính này và vẽ pattern tương ứng lên nền.
2. **Giảm chuyển động / Tự sao lưu**: state thật + persist (`app/settings/_lib/local-state.ts`,
   key `interiorflow.settings_g4.local_state_v1`), nhưng CHƯA có nơi đọc cờ này để thực sự tắt
   motion (nhiều component dùng `prefers-reduced-motion` trực tiếp, chưa có override cấp app) hay
   chạy job backup thật.
3. **`AppRail`** hiện sống trong `components/filemanager/` (chỗ được giao đầu tiên có mock rail) —
   nên dọn về `components/shell/` chung khi code chính wire cả app, vì giờ `/settings` cũng import
   chéo từ đó.
4. **`LibraryNav`** (Kệ Thư viện, G4 việc trước) CHƯA đổi theo rail pixel mới — 2 mock (`files`,
   `settings`) dùng chung 1 rail, `library` thì chưa có mock riêng nên vẫn dùng nav chữ cũ. Cần mock
   riêng cho Library nếu muốn đồng bộ 3 màn.
5. **Nơi lưu file** dùng `lib/root-folder.ts` — dòng "Đang đồng bộ tốt · size" trong pathbox mock
   không có số liệu thật (chưa có cơ chế đo dung lượng theo thư mục thật), đang ẩn dòng đó khi
   chưa chọn, hiện dòng tĩnh "Đang đồng bộ tốt" khi đã chọn (không có số MB thật đi kèm).
6. **Vật liệu matId trong File Manager** (`W-102`/`S-044`/`P-070`) trùng với `lib/library/mock-data.ts`
   (Kệ Thư viện) — cả 2 đang là 2 bộ mock tách biệt, khi có ATLAS thật cần hợp nhất về 1 nguồn.

## SẴN SÀNG COMMIT — 2 commit riêng theo đúng 2 message Hoà cho

Worktree này git commit được từ sandbox (đã xác nhận ở việc Kệ Thư viện trước) — KHÔNG tự
merge/push origin/main lần này (chưa được yêu cầu rõ trong chỉ đạo Cài đặt/Files pixel — khác lần
Kệ Thư viện có script merge+push đầy đủ). Lệnh dưới đây chạy được ngay, hoặc để Hoà tự chạy:

```bash
cd ~/Downloads/interiorflow-g4

# Commit 1 — File Manager pixel-match
git add components/filemanager lib/filemanager app/files docs/mocks/mock-files-polished.html docs/BAO-CAO-FM.md
git commit -m "feat(files): dong bo pixel voi mock-files-polished

Xay lai rail/toolbar/folder-chip/empty-state/upload-toast/storage-gauge
/file-card dung so do mock-files-polished.html. 2 bug that: empty state
thu muc chi-doc van hien CTA sai, folderStats khong de quy (root luon
hien trong). tsc/eslint/test sach, verify browser that qua 127.0.0.1:3004."

# Commit 2 — Settings pixel-match
git add app/settings docs/mocks/mock-settings-polished.html
git commit -m "feat(settings): trang /settings theo mock pixel

Dung lai /settings theo mock-settings-polished.html (Ho so/Giao dien/
Noi luu file), giu nguyen tinh nang that (avatar/theme/ngon ngu/thu muc
goc qua lib/root-folder.ts) duoi khu Nang cao. Bug that: theme khong doi
mau thuc su (fm-tokens hardcode hex) + hydration mismatch do <style>
escape entity trong React - sua bang CSS var theo [data-theme] +
dangerouslySetInnerHTML. tsc/eslint/test sach, verify browser that ca 2
chieu sang/toi."
```

## Đề xuất 3 việc tiếp theo

1. Mock riêng cho `LibraryNav` (Kệ Thư viện) để đồng bộ rail 3 màn `/files`·`/settings`·`/library`.
2. Wire `data-canvas-wallpaper` vào canvas CAD/Render/Present (mục "Cần nối tay" #1).
3. Hợp nhất `lib/filemanager/mock-data.ts` + `lib/library/mock-data.ts` về 1 nguồn matId khi ATLAS
   thật sẵn sàng (mục #6) — tránh 2 bộ mock trôi dạt khác nhau.
