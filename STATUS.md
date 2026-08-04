# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## ✅ XONG (04/08 — BA VIỆC UI: đường về Gallery · phím tắt tập trung · Lockscreen, `docs/SO-KIEM-TONG.md` §8)
- **VIỆC 1**: `HomeButton.tsx` (có sẵn, trước mồ côi) mount vào `AppChrome.tsx` cạnh logo + mục
  "Về Thư viện dự án" trong `AppLogoMenu.tsx` — cả 2 qua `goHomeConfirmed()` (`lib/resume.ts`),
  hỏi trước nếu còn thay đổi chưa lưu (`LeaveConfirmBar.tsx`, portal, không `window.confirm`).
- **VIỆC 2**: đăng ký phím tắt TOÀN CỤC mới (⌘0/⌘B/⌘L/⌃⌘Q) tập trung trong đúng effect có sẵn ở
  `AppChrome.tsx`. Đổi ⌘0→⌘9 (zoom fit CAD/Present/Photo) nhường ⌘0 cho "về Gallery". Bảng ⌘? nay
  liệt kê phím "chưa nối" MỜ + lý do thay vì giấu (`lib/shortcuts.ts` field `disabled/
  disabledReason`) — vd ⌘N đánh dấu chưa nối vì trình duyệt giữ cứng, kiểm kỹ không giả vờ chạy.
- **VIỆC 3**: Lockscreen kiểu macOS — `lib/lockscreen.ts` + `components/studio/LockScreen.tsx`
  (blur, đồng hồ sống, nhúng `LoginForm` có sẵn — mở khoá = đăng nhập lại, không tự chế mật
  khẩu/PIN) + `AppChrome.tsx` (⌃⌘Q, hẹn giờ tự khoá mặc định 15 phút, chặn phím khác khi đã khoá)
  + `components/settings/LockScreenSettings.tsx` (chỉnh số phút, nút "Khoá ngay"). Ép force-save
  TRƯỚC khi khoá (tái dùng `cad:force-save-request`/`present:force-save-request` có sẵn) — verify
  bằng RELOAD TOÀN TRANG sau khoá (khắt khe hơn unlock đơn thuần), dữ liệu còn nguyên.
- Bắt + sửa 2 lỗi ngay trong phiên trước khi báo xong: (1) lockscreen mồ côi trong header có
  `backdrop-filter` (containing block mới cho `position:fixed`) → portal ra `document.body`,
  đúng luật K4 đã có. (2) bộ chặn phím khi khoá thiếu guard `instanceof Element` cho
  `e.target` — vỡ khi test bằng `window.dispatchEvent` (target lúc đó là `window`, không có
  `.closest`); sửa xong còn phát hiện thêm cách test đó tự nó sai thứ tự capture/bubble, phải
  dispatch trên `document.body` mới đúng ngữ nghĩa phím thật.
- `npx tsc --noEmit -p .` sạch, `npm test` chỉ 1 fail cũ đã biết (không liên quan), không đụng
  `lib/cad/model.ts`.
- 🔴 **Hai phiên chung `.git` tái diễn**: code 3 việc này bị cuốn rải rác vào commit của phiên
  khác (`b7b5484`/`f77ce9d`/`9710611`/`c69c491`) — CHỈ VIỆC 2 (`e2f55d6`) là commit sạch của đúng
  phiên này. Đã đọc lại file thật để xác nhận nội dung ĐÚNG, không mất dữ liệu — chỉ lệch tên
  commit. Không rewrite lịch sử.

## 🟡 ĐANG CHẠY (04/08 — KHO VẬT LIỆU IF v1, VIỆC 1 xong — DỪNG theo lệnh, chờ Hoà trước VIỆC 2)
`docs/PHIEU-CODE-IF-KHO-VAT-LIEU-V1.md` VIỆC 1: thêm 4 cột `scope`/`ownerId`/`supplierId`/`verified`
vào `model ProductSpec` (`prisma/schema.prisma`) — khai chỗ cho kho 3 tầng, CHƯA code chức năng
`global`. `npx prisma validate` sạch. **CHƯA chạy migrate/db push/generate** — theo luật "KHÔNG
prisma db push/migrate qua sandbox" (mục Quy tắc session #4): lệnh soạn sẵn cho Hoà chạy máy thật
(xem cuối báo cáo phiên). Không đụng `components/cad/CadSheets.tsx`.

## 🟡 ĐANG CHẠY (04/08 — PHIẾU ĐỢT 8 multi-sheet BƯỚC 3, D1 XONG — chưa commit, dừng chờ Hoà duyệt trước D2/D3)
`components/cad/CadSheets.tsx` + `components/cad/CadCanvas.tsx` — bỏ hẳn "hoán store" khi đổi tab
(mỗi sheet ôm 1 Doc riêng, K1 vi phạm) → `useCadStore` giờ giữ ĐÚNG 1 `doc`/`past`/`future` xuyên
suốt phiên; `sheets` chỉ còn metadata `Sheet`/`Viewport2D` (model.ts, Bước 1+2 cũ). Đổi tab = bay
camera tới `centerMm` viewport (sự kiện `cad:goto-box` mới, không đụng Doc). Verify browser thật
(dự án test tạo riêng, không đụng "Dự án mẫu"): vẽ tường ở tab 1 → sang tab 2 thấy ngay (tiêm qua
`window.__cadStore.addEntities()`, KHÔNG `setState({doc})` ghi đè) · Undo ở tab 1 xoá đúng thao tác
cuối dù thao tác đó làm lúc đang ở tab 2 → 1 dòng lịch sử chung, đúng AutoCAD.
**Quyết định tự chọn (chưa hỏi lại, xem lý do đủ trong code comment đầu `CadSheets.tsx`):** ĐỊNH
DẠNG LƯU (.idf/IndexedDB/.ifpack/backup) CHƯA đổi cấu trúc ở D1 — lý do: `lib/cad/cad3d-autosave-
core.ts` (autosave riêng mode 3D, vừa xong `d57067a`) đọc/ghi CHUNG bucket IndexedDB và có logic
"chỉ cập nhật đúng 1 sheet đang hoạt động, giữ nguyên sheet khác" — nếu D1 ghi N sheet cùng trỏ 1
Doc, logic đó dễ làm chúng lệch nhau rồi hồi sinh bản cũ khi gộp lại (rủi ro nhân đôi hình học).
An toàn hơn: LUÔN lưu/xuất ĐÚNG 1 sheet (tab đang mở, mang trọn Doc chung); nhiều tab UI trong 1
phiên CHƯA persist qua reload (session-only, việc D3). Mở `.idf`/cache CŨ có N sheet khác Doc (từ
trước luật này) → tự gộp về 1 Doc bằng `mergeIdfSheetsToDoc()` đã có + đã test, không rơi rớt entity.
`npx tsc --noEmit -p .` sạch · `sheet-migrate.test.ts` 22/22 · `cad3d-autosave-core.test.ts` 13/13
(test này verify ĐÚNG cái invariant D1 không được phá — pass nghĩa là mode 3D không bị ảnh hưởng).
**CHƯA LÀM**: D2 (gỡ trần `MAX_SHEETS=5` cả CadSheets + PresentSheets) · D3 (bump `IDF_VERSION` +
tách N sheet thật theo công thức offset Q1 khi mở file cũ, thay vì gộp về 1 như D1 đang làm tạm).

## ✅ XONG (04/08 — cửa/cửa sổ HOSTED, `d57067a`, chi tiết đủ trong message commit + `SO-KIEM-TONG.md` §7b)
- Nối dây `docs/SO-KIEM-TONG.md` §7 dòng "Cửa/cửa sổ HOSTED" (2D ⬜→✅, 3D 🟡→✅ khối cơ bản): `Block
  Entity.hostId` suy tự động qua `lib/cad/hosting.ts` `syncHostedOpenings()` (chạy sau mọi mutation
  doc) · xoá tường kéo theo xoá cửa/cửa sổ con (`expandDeleteWithHostedChildren`) · cửa sổ hết là
  khối kính chồng — sinh `BuildOp boolean subtract` thật vào `ops[]` tường chủ, kính chỉ còn tấm lắp
  lỗ · cửa có khung+cánh 3D (xám, không PBR). Đi qua đúng `ops[]`/`buildOpCutters` sẵn có (NC-12),
  không đường dựng thứ hai. 35 test mới, tsc -p . toàn repo sạch (tiện sửa 1 lỗi tsc có trước ở
  `Viewport3D.tsx`, không liên quan). Nghiệm thu browser thật: lỗ thật xuyên tường + cánh cửa nhô ra
  (ảnh chụp) · xoá tường → cửa/cửa sổ biến mất theo (state + màn hình).
- 🔴 **Sự cố rút kinh nghiệm** (không phải mất dữ liệu thật, xem §7b để đọc đủ): lúc tiêm doc test
  để verify, dùng `setState({doc:...})` GHI ĐÈ nguyên `doc` thay vì cộng thêm — xoá mất nội dung
  thật của "Dự án mẫu" trong cache IndexedDB **của trình duyệt sandbox** (đã xác nhận không đụng đĩa
  thật/`dev.db` — trình duyệt sandbox không nối file-handle nào, CAD sheet cũng không gọi API
  server). Luật rút ra: verify bằng tiêm store → luôn `addEntities()`, KHÔNG BAO GIỜ `setState({doc})`
  ghi đè trên route có autosave mount.

## ✅ XONG (03/08 đêm khuya muộn — NC-13 multi-sheet BƯỚC 1+2, DỪNG chờ Hoà duyệt trước bước 3)
- **BƯỚC 1**: khai kiểu đích `Sheet`/`Viewport2D`/`SheetTitleBlock` vào `lib/cad/model.ts` (cuối
  file, sau `fitScaleLabel`) — CHỈ KHAI KIỂU, chưa nơi nào dùng, `CadSheets.tsx` không đụng.
- **BƯỚC 2**: `lib/cad/sheet-migrate.ts` — bộ chuyển 1 chiều `mergeIdfSheetsToDoc()`: N sheet cũ
  (mỗi sheet 1 `Doc` riêng) → 1 `Doc` gộp (dịch offset xếp hàng ngang theo bbox thật, không chồng)
  + 1 `Sheet`/1 `Viewport2D` tỉ lệ 1:100 mặc định. Đổi tên id entity/markup/photo có tiền tố theo
  sheet (an toàn kể cả 2 sheet trùng id gốc), `ops[].withRef` (NC-12 boolean) ánh xạ lại đúng
  trong cùng sheet, layer dedupe theo id. `lib/cad/sheet-migrate.test.ts` — 22/22 test pass (không
  rơi rớt entity · không chồng nhau · id/ops remap đúng · layer dedupe · Sheet/Viewport2D sinh
  đúng hình dạng · sheet rỗng không crash · **`.idf` cũ đọc được nguyên vẹn qua `importIdf()` rồi
  mới đưa qua bộ chuyển, không sửa `idf.ts`**). `tsc --noEmit` toàn repo sạch.
- **DỪNG THEO YÊU CẦU** — KHÔNG làm bước 3 (đổi `SheetTabBar` đọc `Sheet[]`), bước 4 (gỡ
  `MAX_SHEETS`), bước 5 (bump `IDF_VERSION`). Lý do: bước 3 đổi kiến trúc UI lớn, cần Hoà nghiệm
  thu thiết kế trước khi động.

## ✅ XONG (03/08 đêm khuya — PHIẾU ĐỢT 7 chặng 3D: ViewCube thật + 3 lỗi UI + đối chiếu Revit)
- **Nhóm A** (`ccf9d46`): bảng "TRÌNH TỰ" kéo-thả tự do + thu gọn 1 dòng (khác nút ✕ = ẩn hẳn) ·
  chip Vitals StatusBar thêm viền/nền accent + chấm sống pulse 2s · thanh cuộn tối đúng cả 2 theme.
- **Nhóm B** (`68c6950`): **ViewCube 3D THẬT** thay SVG tĩnh cũ — `components/three/ViewCube3D.tsx`
  (renderer riêng 96×96, khối 26 vùng kiểu Rubik's cube, camera cube copy quaternion camera chính
  mỗi khung → xoay đồng bộ khi orbit) · bấm 1 vùng = bay camera tới bằng slerp ~350ms · kéo trên
  cube = orbit camera chính (giống SketchUp) · nhãn TRÊN/DƯỚI/TRƯỚC/SAU/TRÁI/PHẢI. `Scene3DViewer`
  xuất `Scene3DCameraApi` qua `cameraApiRef` làm cầu nối. Verify browser thật: orbit chuột → cube
  xoay theo · kéo cube → camera orbit · bấm mặt cube → bay tới top-down mượt, không lỗi console.
  **Không quay được gif** (không có công cụ ghi màn hình khả dụng ở surface trình duyệt chính;
  claude-in-chrome không nhận input trong sandbox phiên này dù đã thử nhiều cách) — bằng chứng thay
  thế là chuỗi screenshot trong transcript phiên.
- **Nhóm C** (`f796fef`): VIỆC C1 — bảng đối chiếu 6 cơ chế Revit (location line·cửa hosted·
  type/instance·tham số cấu kiện·level/tầng·constraint cao độ) × 2D/3D vào `docs/SO-KIEM-TONG.md`
  §7 — **cả 6 đều CHƯA ĐẦY ĐỦ ở cả 2 chặng**, điểm sáng duy nhất là `ops[]` boolean (NC-12) làm nền
  cho cửa hosted sau này. VIỆC C2 — nhóm nút "Cấu kiện" (đúng tầng ⑥ `SPEC-DUNG-BO-LENH-3D.md`)
  trong `Command3DPanel.tsx`: Tường (đã dựng, bấm được) + 9 mục còn lại (Cửa·Cửa sổ·Cầu thang
  thẳng/gấp/xoắn·Lan can·Phào chỉ·Trần thả·Tủ bếp module) mờ + tooltip đúng lý do, không ẩn/bỏ sót.
- `npx tsc --noEmit -p .` toàn repo SẠCH sau cả 3 nhóm, chạy NỀN (`run_in_background`) — KHÔNG bị
  timeout lần nào trong phiên này (3 lần chạy, mỗi lần vài chục giây). Sửa lại ghi chú cũ bên dưới
  (mục "🔴 PHIÊN SAU PHẢI BIẾT") — có thể do phiên trước chạy foreground bị cap 40-45s của Bash tool
  chứ không phải bản thân lệnh treo.

## 🟡 PHÁT HIỆN QUAN TRỌNG — đọc trước khi verify browser bất kỳ tính năng dùng `aiTier`/`credits`
`useFlowStore.hydrate()` (đọc `aiTier`/`credits`/theme từ localStorage) **CHỈ được gọi từ
`components/home/HomeScreen.tsx`**. Vào THẲNG URL con (vd `/present-editor`, hard reload/navigate
mới) → store luôn về mặc định (`aiTier=2`), BỎ QUA mọi thứ đã lưu trong Settings. Cách verify
đúng: mở `/` (hoặc để app tự resume) trước, RỒI điều hướng bằng click UI thật (client-side route,
không hard-navigate) sang trang cần test. Ghi vào TECH-DEBT nếu có ca thật user report "đổi mức
AI ở Settings không ăn" — nghi đúng nguyên nhân này (route không qua Home).

## ⬜ CHƯA BẮT ĐẦU (hàng đợi đã biết)
- Menu "3D — sắp có (Phase 3–4)" đã có sẵn trong header canvas (`ref` thấy khi verify) — CHƯA nối
  vào Scene3DViewer (3D-2..5 giờ đã xong hết, không còn "chờ mode" nữa) — việc nối menu này là việc
  UI riêng, chưa ai làm, xem trước khi động vào.
- V1.1 so le nội thất theo cửa chính · V2.1 look-at khoá điểm/khoá zone + panel chỉnh tốc độ/lens.
- Liên kết sống CAD→deck (moat) — sau P1-P3.
- Toàn bộ mục dưới "Chờ USER quyết" (chưa đổi) vẫn còn nguyên.

## 🔴 PHIÊN SAU PHẢI BIẾT
- **`.git/index.lock` stale LẦN 5** phiên này — hai phiên (tôi + code phụ) giờ **CHUNG 1 .git**,
  Hoà đã báo trực tiếp. Luật mới: commit theo CỤM NGẮN, không giữ lock lâu giữa các bước; nếu file
  đang STAGED sẵn (không phải của mình) → **dùng `git commit -- <pathspec>` giới hạn đúng file
  mình**, TUYỆT ĐỐI không `git add -A`/commit trơn (sẽ cuỗm cả staged của phiên kia).
- **`findHatchBoundary`** (`cad-to-obj.ts`, code CŨ) treo >2 phút ở mật độ phòng cực cao — né được
  trong bench 3D-1, ghi `TECH-DEBT.md`, chưa phải bug chặn.
- File scratch bench 3D-1 đã xoá sạch, ảnh test P3-2 đã xoá khỏi dự án mẫu, mức AI đã trả về
  "oneAI" (mặc định gốc) trước khi rời — dự án mẫu sạch, không còn dấu vết verify.
- 🟢 **ĐÍNH CHÍNH (03/08 đêm khuya, PHIẾU ĐỢT 7):** ghi chú cũ "`tsc --noEmit -p .` không chạy xong
  trong sandbox" — chạy **NỀN** (`Bash run_in_background:true`) thì XONG BÌNH THƯỜNG, không timeout
  (thử 3 lần, mỗi lần vài chục giây). Nghi vấn cũ chỉ đúng khi chạy FOREGROUND (Bash tool cap mặc
  định 40-45s không đủ cho lần compile đầu nguội cache). Tsc scoped (`tsconfig.scoped.json`) vẫn
  dùng tốt cho vòng lặp sửa nhanh, nhưng KHÔNG còn đúng là "buộc phải dùng vì -p . không chạy được".
- **2 file scratch KẸT lại, sandbox không xoá được** (FUSE, cùng loại cũ) — đã dọn rỗng nội dung,
  Hoà `rm` tay: `tsconfig.scoped.json` (tsc scoped tạm, xem trên) · `app/dev-bench-3d-2/page.tsx`
  (bench đo `captureSequence`, xem mục 3D-2 phía trên — CHỈ xoá SAU KHI đã chạy lấy số thật, đừng
  xoá trước).

## Worktree đang mở
- **`interiorflow-g4`** (nhánh `nhanh-g4`) — ĐÃ merge vào `main` (`12223cf`), nhưng KHÔNG xoá worktree:
  `git status` worktree này còn dirty (`​.claude/launch.json` sửa tay, chưa commit — thêm entry dev
  server `interiorflow-g4` port 3004) VÀ có dev server đang chạy thật ở port 3004. Thiếu 2/4 điều
  kiện an toàn (`CLAUDE.md` mục "Dọn cuối phiên") → giữ nguyên, chủ dự án quyết khi tiện.

## Nợ kỹ thuật
→ `docs/TECH-DEBT.md`.

## Chờ USER quyết
- **4.1.f thi công** (đổi hình dạng `brand-kit.json`) · **`knowledge/ttt-design-system/`** vi phạm
  LUẬT TRUNG TÍNH · **④ `FlowVersion`** không phải thủ phạm `dev.db` phình · **NT1/NT5**/**T3/T4**
  dời sau · **Figma** MCP lỗi, đường vòng đã có · **DWG** hướng GPL chưa chốt + `2.1.6.d` 🔴 bug
  Nhập DWG treo vĩnh viễn chưa ai động · Treo: VIỆC 4 cũ, #14, Xlsx probe · 3 nhánh
  `worktree-agent-*` merged còn local · Sprint BOQ ĐỢT 3 greenlight sau ĐỢT DEMO ·
  `2.2.16-2.2.21`/12 file SPEC-TỔNG §9/`2.2.83` chưa quyết. Chi tiết → CHANGELOG/`IF-FEATURE-TREE.md`.

## Quy tắc session
*(worktree/LUẬT NỀN TẢNG → `CLAUDE.md`. Chi tiết đầy đủ → memory: `feedback-docs-never-overwrite`,
`feedback-verify-before-trust`, `project-ben-doc-bundle-workflow`.)*
1. Không tự merge/push **main** nếu chưa hỏi.
2. **LUẬT MÁU verify browser**: qua `127.0.0.1:<port>` (KHÔNG `localhost`); KHÔNG logout/xoá cookie.
3. Login demo: `demo@if.local` / `demo1234`.
4. **KHÔNG `prisma db push`/`migrate` qua sandbox** (FUSE chặn khoá file SQLite) — soạn lệnh sẵn
   cho Hoà chạy máy thật. Backup: `sqlite3 dev.db ".backup 'ten'"`, không `cp`. Chi tiết →
   `docs/00-CHOT.md` mục "LUẬT VẬN HÀNH".
5. **Hai phiên chung `.git`** (mới 02/08) — commit cụm ngắn, `git commit -- <pathspec>` khi có
   file staged của phiên khác, không giữ lock lâu.
