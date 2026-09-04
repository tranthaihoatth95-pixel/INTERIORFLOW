# CAPABILITY-DELTA · `backup/2026-08-19-batch0a`

**Lập** 04/09/2026 · theo chỉ thị chủ dự án *"RECOVER SELECTIVELY · PRESERVE ENTIRE BRANCH"*.
**Bảo tồn**: `refs/preserved/backup-2026-08-19-batch0a` → `fbd65213` (ref cục bộ, ngoài tầm `git branch -d`). Nhánh remote nguyên vẹn.
**Chưa merge / rebase / cherry-pick / xoá bất cứ thứ gì của nhánh này.**

Đối chiếu với `integration/2026-09-04` (**INT** = `origin/main` + 11 slice đã thu về, đã `tsc` 0 · `build` 0 · `npm test` 0).

---

## 0 · KHÁM NGHIỆM CẤU TRÚC

| Mục | Kết quả |
|---|---|
| merge-base với main | `2dfed165` (20/08) — **cùng dòng lịch sử**, gốc `388a8932` |
| ahead / behind | 59 / 2 |
| Dòng thời gian phần ahead | **34 commit ngày 20/08** · 22 ngày 21/08 · 3 ngày 22/08 |
| `git cherry origin/main` | **59/59 dấu `+`** — không commit nào có bản tương đương trong main |
| Diff so main | 201 tệp · **+28.955 / −1.779** · A 141 · M 60 · D 0 |
| Schema / package / migration | `prisma/schema.prisma` **không đụng** · `package.json` **không đụng** · 1 migration mới |
| So với INT | **139/141** tệp thêm mới KHÔNG có ở INT |
| Trong đó | **56 tệp MÃ** · 16 tệp TEST · 56 tài liệu · 9 ảnh mẫu vật liệu · 3 script |

**Đọc lại dòng thời gian:** main dừng giữa ngày 20/08 tại `2dfed165`; 34 commit tiếp theo **của cùng ngày đó** nằm trên nhánh này. Đây **không phải bản sao lưu bỏ quên** — nó là phần tiếp của chính dòng làm việc.

### 🔴 SỨC KHOẺ MÃ — HEAD KHÔNG BIÊN DỊCH ĐƯỢC
`tsc --noEmit` trên worktree chỉ-đọc tại `fbd65213`: **4 lỗi TS2307**, đều là import trỏ vào tệp không tồn tại trên nhánh:
`@/lib/home/trang-thai` · `@/components/ui/useVungLamViec` · `@/lib/ui/vung-lam-viec` · `@/lib/ui/keo-be-mat`.
⇒ Nhánh ở trạng thái **dở dang**. `VitalsAperture.tsx` và `useKeoBeMat.ts` **không thể biên dịch nguyên trạng**.

---

## 1 · 🔴🔴 PHÁT HIỆN LỚN HƠN PHẠM VI PHIẾU — BỐN MODULE THIẾU NẰM Ở `checkpoint`

Truy 4 module thiếu trên **mọi** ref: cả bốn tồn tại ở `origin/checkpoint/2026-08-24-control-plane`.
Đo tiếp thì lộ ra điều đảo ngược phân loại cũ:

| Đo | Kết quả |
|---|---|
| 56 tệp MÃ độc nhất của backup | **54/56 cũng có ở checkpoint** |
| `components/studio/VitalsAperture.tsx` | backup **477 dòng** · checkpoint **722 dòng** — bản checkpoint **mới hơn** |
| checkpoint commit cuối | **01/09/2026** (backup dừng 22/08) |
| Cây tệp | INT **2.513** · checkpoint **3.214** |
| checkpoint CÓ mà INT KHÔNG | **957 tệp** — trong đó **207 tệp MÃ**, 327 tài liệu |
| INT CÓ mà checkpoint KHÔNG | **256 tệp** (11 slice + việc main 03/09) |
| checkpoint có việc của 11 slice không | **KHÔNG** — `Surface.tsx` · `design-tokens.ts` · `app/inspiration` · `ChinhLenhVuaChay` · `library/knowledge` đều vắng |

> ⇒ **`backup/2026-08-19-batch0a` là một NHÁNH CON của một dòng phát triển lớn hơn, không phải bản thân dòng đó.** Dòng đó là `checkpoint/2026-08-24-control-plane`: chạy liên tục tới 01/09, mang 207 tệp mã mà canonical không có, và giữ bản **mới hơn** của chính những tệp backup đang cầm.

### Đính chính phân loại 04/09 sáng
Sổ `CLOUD-SESSION-LEDGER` §3 xếp `checkpoint` là *"lịch sử trước dọn — ARCHIVE"*. **Đúng một nửa, sai một nửa:**
- ✅ **ĐÚNG về LỊCH SỬ**: gốc `8c3d317b`, không tổ tiên chung với main, cây chứa 6 tệp TTT ⇒ **không bao giờ được merge như lịch sử**.
- ❌ **SAI về NỘI DUNG**: chữ "trước dọn" hàm ý nội dung cũ. Nội dung của nó là **mới nhất** trong toàn repo.

Hai điều đó **không mâu thuẫn**: luật đã ghi sẵn ở §4 — *"cần lấy một mẩu mã từ đó thì CHÉP NỘI DUNG TỆP, không merge commit"*. Chép nội dung **không** kéo lịch sử TTT về.

### Hệ quả: **HAI DÒNG PHÁT TRIỂN SONG SONG, cả hai đều thật**
| | `integration/2026-09-04` | `checkpoint/2026-08-24-control-plane` |
|---|---|---|
| Lịch sử | sạch (gốc 19/08, 0 TTT) | trước dọn (gốc 03/07, 6 tệp TTT) |
| Mốc cuối | 04/09 | 01/09 |
| Mã riêng | 256 tệp | **207 tệp** |
| Nội dung riêng | auth · library · integrations · idfc-import · gu · 11 slice | Home LivingCanvas · **Vitals Aperture + Chat** · BeMatNoi · Icon · **site/địa điểm** · voice · studio |
| Máy kiểm | `tsc` 0 · `build` 0 · `test` 0 | **CHƯA ĐO** |

⚠️ **Va ngữ nghĩa đã thấy:** cả hai đều có `components/site/**` — checkpoint có `NhapViTri` · `TomTatDiaDiem` · `dia-diem-client`; INT có 7 tệp `site` khác từ slice `compass-site-calendar`. **Hai bản độc lập của cùng khái niệm "địa điểm dự án".**

---

## 2 · BẢNG CAPABILITY-DELTA

Cột theo khuôn chủ dự án đặt. ACTION ∈ {RECOVER · ADAPT · ALREADY REPLACED · OBSOLETE · DECISION REQUIRED}.

### A · 3D · gizmo · thao tác vật thể · CAD/2D

| # | CAPABILITY | BACKUP | HIỆN CÓ TRONG INT | GIÁ TRỊ | VA CHẠM | TEST | ACTION |
|---|---|---|---|---|---|---|---|
| A1 | **Gizmo bám vật, kéo được** (dời/xoay tại chỗ) | `Viewport3D.tsx:165-283` chiếu tâm khối ra màn mỗi rAF, commit-on-release ⇒ 1 bước undo | **KHÔNG** — INT còn SVG ghim `left:50%`, mỗi trục chỉ `onNudge(axis,100)` = nút nhích 100 mm | **CAO** | `Viewport3D.tsx` INT lệch 229 dòng | E2E `kiem-3d-contro-that.js` lệnh `transform` | **ADAPT** |
| A2 | **Bấm vào khối trong viewport 3D để chọn** | `Scene3DViewer.tsx:192 onPickEntity` raycast mọi mặt + viền chọn `:490` | **KHÔNG** — chọn 3D chỉ qua cây Navigator | **CAO** (LANE-C ghi là FAIL P0) | `Scene3DViewer.tsx` lệch 203 dòng; `tree3d-ui.ts` khác hình dạng | E2E `probe`/`drag` | **RECOVER** |
| A3 | **Xoá khối 3D bằng lệnh chung** | `lib/commands/registry.ts:230/238` đọc `selectedEntityId` | **KHÔNG** — INT vẫn `when: CAD_BASIC` + comment "sẽ xoá NHẦM ở render" | **CAO** | `registry.ts` | — | **RECOVER** *(bó cùng A2 — tách ra là vô nghĩa)* |
| A4 | **Dựng khối bằng CỬ CHỈ** (kéo trên mặt sàn) | `lib/three/tao-khoi-3d.ts` 88 dòng thuần + máy trạng thái ở `Scene3DViewer` | **MỘT PHẦN, tên khác**: `lib/render-studio/tool3d.ts` cùng bộ line/rect/circle nhưng **nhập số**, docstring tự khai chưa nối được con trỏ | **CAO** | bổ sung `tool3d.ts`, không thay | thiếu unit test | **RECOVER + ADAPT** |
| A5 | **Viewport 3D bị cắt cụt trên retina** | `ve3d-css.ts:135` ghim `>canvas{width:100%;height:100%}` | **KHÔNG — lỗi còn nguyên** (`ve3d-css.ts:128` thiếu luật, `Scene3DViewer.tsx:225` vẫn `setPixelRatio(min(dpr,1.5))` với `setSize(...,false)`) | **CAO** | không đụng gì | script chạy `deviceScaleFactor:2` | **RECOVER** ⭐ *rẻ nhất, giá trị cao nhất — 1 dòng CSS* |
| A6 | **Bản vẽ 2D có bản sao bền trên máy chủ** | `lib/cad/luu-len-may-chu.ts` 107 dòng, cổng chặn ghi đè bằng trạng thái hỏng | **KHÔNG** — đã loại trừ cả `/api/flows` (chỉ node-graph) lẫn đường đĩa opt-in `ban-ve.idf` | **CAO** | trùng tên tệp `ban-ve.idf` với đường đĩa INT; **cần kèm `mime-sniff` kind `idfp`, thiếu là ra tính năng chết** | ✅ `luu-len-may-chu.test.ts` 9 khẳng định | **RECOVER** *(kèm mime-sniff)* |
| A7 | **Kệ hết món câm — bảng ghim mã↔id kho** | `lib/cad/library-code-map.ts` 89 dòng, 12 mã, 3 hạng | **KHÔNG — bệnh còn nguyên**: `shelves.ts:166` vẫn khai 12 mã cũ, resolver chỉ khớp tên ⇒ `DOOR-S-800` không bao giờ khớp `doorRoom` | **CAO** (lỗi im lặng: kéo món, Δ entity = 0) | chèn trước `matchByName`, không phá | ✅ test 109 dòng đọc kho THẬT | **RECOVER** |
| A8 | Con trỏ 2D theo ý định (crosshair chỉ khi đang vẽ) | `CadCanvas.tsx:2874/3624` | KHÔNG — INT gọi vô điều kiện | VỪA | `CadCanvas.tsx` INT lệch +176 | — | **ADAPT** |
| A9 | Bảng lớp 3 nấc + dòng lệnh câm ở Sơ phác | `CadEditor.tsx:1451/2571` | KHÔNG | VỪA (UI thuần) | sự kiện `if:navigator-width` là khái niệm mới | — | **DECISION REQUIRED** |
| A10 | **Bộ kiểm 3D bằng con trỏ THẬT** | `scripts/kiem-3d-contro-that.js` 722 dòng, 11 lệnh, Playwright trusted events | **KHÔNG** — INT chỉ có bench hiệu năng | **CAO cho hạ tầng kiểm** (là thứ duy nhất chứng minh được A1/A2/A4) | ⚠️ chứa đường dẫn + project id + mật khẩu demo **gõ cứng** | tự nó là bộ kiểm | **ADAPT** *(tham số hoá trước)* |
| A11 | Trang demo `/demo/ghe-3d` | 105 dòng | KHÔNG | THẤP-VỪA | thuộc cụm deep-link Present | — | **DECISION REQUIRED** |
| A12 | Cửa vào 3D rỗng hết đòi mặt bằng 2D | `Render3DModeSkeleton.tsx:470` | KHÔNG | VỪA | phụ thuộc A4 | E2E `empty3d` | **ADAPT** *(kèm A4)* |
| A13 | Công thức hình gom theo Ý ĐỊNH | `lib/render-studio/form-recipe.ts` | **ENGINE ĐÃ CÓ tên khác**: `lib/three/build-recipe.ts` (từ 12/08). BK chỉ thêm lớp mặt tiền | VỪA | nguy cơ trùng thật | ✅ có test | **DECISION REQUIRED** |
| A14 | Báo cáo nghiệm thu tiền cảnh 2D/3D (số đo rAF, sha1 ảnh, 7 điều chưa kiểm) | `docs/…LANE-C-foreground-2d3d.md` 244 dòng | KHÔNG | **CAO cho khảo cổ** | không | tự nó là bằng chứng | **RECOVER** |

### B · Present · deck · BOQ · hợp đồng miền

**Điểm va đã gỡ:** BK và slice `present-boq-voice` sửa cùng 3 tệp nhưng **hai việc khác nhau, cộng hưởng được** — `model.ts` hai vùng cách nhau ~280 dòng, `PresentEditor.tsx` các hunk không giao; **chỉ 1 chỗ xung đột văn bản** ở khối import `SlidePlayer.tsx:15-27`.

| # | CAPABILITY | BACKUP | HIỆN CÓ TRONG INT | GIÁ TRỊ | TEST | ACTION |
|---|---|---|---|---|---|---|
| B1 | **Deck có bản sao bền trên máy chủ** | `lib/present-editor/luu-len-may-chu.ts:40/77` | **KHÔNG** (grep 0) | **CAO** — sự cố mất deck 24 trang là thật, 21/08 | có ở bản 2D song sinh | **RECOVER** |
| B2 | **TỜ BẢN VẼ 2D/3D → Trình chiếu** (tỉ lệ · khổ · lề · khung tên · neo nguồn) | `lib/present-editor/to-ban-ve.ts` — `:102` cấm co giãn âm thầm, `:137` neo nguồn | **KHÔNG** — INT `cad/present-handoff.ts` chỉ gửi **ẢNH** | **CAO** — khoá bằng máy hai luật nghề | ✅ test 231 dòng | **RECOVER** |
| B3 | Thiết lập trang NHANH (cột neo cạnh canvas) | `ThietLapTrang.tsx` 387 dòng | KHÔNG (INT chỉ có hộp thoại xuất PDF) | VỪA-CAO | — | **RECOVER** *(sau B2)* |
| B4 | Thiết lập trang ĐẦY ĐỦ + khai năng lực THẬT | `ThietLapTrangDayDu.tsx:29-41` — núm chưa nối phải khai lý do thật, cấm khai `false` giả | KHÔNG | VỪA *(giá trị là NGHI THỨC, tái dùng rộng)* | — | **RECOVER** |
| B5 | Cửa nhận tờ + guard StrictMode | `CongThietLapTrang.tsx:96` | KHÔNG — INT có **3 cầu consume-once** có thể dính cùng bẫy | VỪA | — | **RECOVER** *(ít nhất chuyển bài học)* |
| B6 | **Deep link slide → ngữ cảnh sống → quay về đúng slide** | `present-return.ts` + `model.ts +href?` + `moLink()` chặn `//` | **KHÔNG** | **CAO** | — | **ADAPT** *(hoà tay 1 khối import)* |
| B7 | Cầu Spec G1-G4 → Present | `spec-present-handoff.ts:36/52` | KHÔNG | VỪA-CAO | — | **RECOVER** |
| B8 | Nguồn liên kết ở màn Present trống | `NguonLienKet.tsx:52` đếm từ máy đang chạy | KHÔNG | VỪA | — | **RECOVER** |
| B9 | Cờ "hồ sơ đã có trang chưa" | `ho-so-status.ts` 27 dòng | KHÔNG (INT có `play-status.ts` cùng khuôn khác cờ) | THẤP-VỪA | — | **RECOVER** *(kèm B8)* |
| B10 | **Trạng thái tệp nguồn — 2 trục 7 nấc** | `tep-nguon-trang-thai.ts:32/85/142` | KHÔNG tương đương (INT `tep-nguon.ts` chỉ có usage/kích thước) | VỪA-CAO | ✅ test 144 dòng, `assert` chuẩn Node | **RECOVER** lõi; **DECISION REQUIRED** cho bản viết lại `TepNguonDuAn.tsx` 747 dòng |
| B11 | Bảng phân loại 8 điểm vào in/khổ/tỉ lệ | doc `PRESENT-TRUNG-TAM-IN` | KHÔNG | **CAO cho việc gộp** | — | **RECOVER** |
| B12 | **Bốn nghĩa sự thật — `flag` luôn suy từ `canCu`** | `image-to-3d.ts:63 nacTuCanCu()` | **KHÔNG** (grep 0) | **CAO** — sửa một quyết định sai mà không phá `ProvenanceFlag` đang gánh ~509 chỗ | ✅ 7 khẳng định, bất biến giữ qua cả 4 đường ký | **RECOVER** |

### C · Dữ liệu · nhập liệu · hạ tầng (tôi tự soi)

| # | CAPABILITY | BACKUP | HIỆN CÓ TRONG INT | ACTION |
|---|---|---|---|---|
| C1 | **Cửa trích siêu dữ liệu cho `LibraryAsset`** — sửa lỗi promote ghi asset `0×0`, palette rỗng | `lib/server/asset-metadata.ts` | **KHÔNG — LỖI CÒN NGUYÊN**: `lib/server/promote.ts` grep `palette\|width\|height` = **0 dòng** | **RECOVER** ⭐ *bug dữ liệu thật, chưa ai vá* |
| C2 | Ảnh → Spec: bước cuối ra **tờ spec lưu được** | `lib/capabilities/anh-thanh-spec.ts` | INT có phần **ĐỌC** ảnh (`lib/vision/image-spec.ts`, 03/09) nhưng **không có** phần ra tờ spec | **RECOVER** *(khác tầng, không trùng)* |
| C3 | `POST /api/asset-representation` — lưu kết quả Ảnh→Spec đã duyệt | `app/api/asset-representation/route.ts` | **CÓ, bản KHÁC** từ slice `asset-idfc` (có `_lib/kiem` + `_lib/db`, mới hơn) | **ALREADY REPLACED** |
| C4 | `POST /api/manufacturer-import` | đường B — gói tệp người dùng có sẵn | **CÓ, bản KHÁC** từ slice `asset-idfc` — dùng `idfc-import/asset-family` + `catalog-link` | **DECISION REQUIRED** *(hai cách tiếp cận khác nhau cho cùng một cửa)* |
| C5 | **Cầu same-origin tới ComfyUI** (vá 403 do header `Origin`) | `app/api/comfyui-image/route.ts` | KHÔNG | **RECOVER** |
| C6 | Sửa có kiểm soát trên ảnh sinh ra (`cua.anh.can-trang`) | `lib/render-studio/controlled-edit.ts` | môi trường `cua.anh.can-trang` **ĐÃ có** trong INT ⇒ cắm vừa | **ADAPT** |
| C7 | `contentHash` dedupe ở cửa nhập | LANE-B khai LIVE | **ĐÃ CÓ** — `schema.prisma:321`, `promote.ts`, `project-files/_lib/guard.ts` | **ALREADY REPLACED** |
| C8 | Migration `ProjectFile.reviewState` | `20260821140000_them_project_file_review_state` | **schema của CẢ HAI bên đều không có `reviewState`** — LANE-B tự khai *"Review contract BLOCKED, schema là cửa của Hoà"* ⇒ cột này chưa từng được duyệt | **OBSOLETE** ⛔ *đừng áp — sẽ thêm cột Prisma không biết* |
| C9 | Sổ kiểm kê toàn app (41 khung / 7 nhóm) + mock Atlas | `docs/ATLAS-KIEM-KE-2026-08-20.md` | KHÔNG | **RECOVER** *(nuôi thẳng Completion Matrix)* |
| C10 | 9 ảnh mẫu vật liệu + `scripts/sinh-mau-vat-lieu.mjs` | `public/mau-vat-lieu/*` | KHÔNG | **RECOVER** *(rẻ, có script sinh lại)* |

### D · Vỏ app · EXS · Vitals · nền UI

**Sự thật nền:** 32/32 đường dẫn của cụm này **đều vắng ở INT**, và grep khái niệm dưới tên khác cũng ra 0 ⇒ INT trống hẳn mảng này.

#### D-0 · Câu quan trọng nhất đã có lời: nền UI hai bên **GỘP ĐƯỢC**, không phải chọn một
`BeMatNoi`+`vat-lieu`+`nhip` (BK) và `Surface`+`design-tokens`+`truth` (INT) là **hai bản của cùng một lớp nền, cắt theo hai trục khác nhau**:

| | BK rộng hơn | INT rộng hơn |
|---|---|---|
| | **HÀNH VI**: portal body + tự tính `transform-origin` từ hộp nguồn · luật ĐẶT CHỖ 7 bước (vùng cấm trên 48/dưới 56 bảo vệ chỗ đứng Vitals) · hiện-dần 6 bậc · máy KÉO dùng chung · **ba mức vật liệu có test** | **VỆ SINH TOKEN + MÁY KIỂM**: parser CSS đo tương phản bằng số · `surface.test.ts` · thang `--z-*` · `--tap-chinh` · `--focus-ring` đặc · `truth.tsx` |

**Đường gộp**: `.if-surface--solid` của INT chính là **bản 2 giá trị** của trục vật liệu 3 giá trị của BK (`kinh/ganDac/dac`). ⇒ **giữ tên lớp + tên khe của INT** (đã cắm vào mã và có test), **thu trục vật liệu + toàn bộ tầng hành vi của BK**, sửa `LOP_VAT_LIEU` trỏ sang `.if-surface--{kinh|gan-dac|dac}`. Một lần đổi tên lớp, không mất bên nào.

| # | CAPABILITY | BACKUP | INT | AUTHORITY | GIÁ TRỊ | ACTION |
|---|---|---|---|---|---|---|
| D1 | **Luật ĐẶT CHỖ 7 bước** — kích-cỡ-đổi-LOẠI, vùng cấm trên 48 / dưới 56 | `lib/ui/dat-cho.ts:140-277` | **KHÔNG** | điều 2 · 10 | **RẤT CAO** — thứ chặn "popover 700px lơ lửng giữa màn", và là cái bảo vệ chỗ đứng Vitals | **RECOVER** |
| D2 | Hiện dần 6 bậc + nén dần 3 trạng thái | `lib/ui/hien-dan.ts` + `HienDan` + `MucNenDan` | **KHÔNG** | điều 1 · 9 | CAO — nguyên thể chung cho MỌI chuỗi cổng duyệt | **RECOVER** |
| D3 | Máy KÉO cửa sổ nổi (pointer capture + phím mũi tên + hút mép + nhớ chỗ) | `useKeoBeMat.ts` | **KHÔNG** | điều 11 | CAO | **RECOVER** ⚠️ `lib/ui/keo-be-mat.ts` **thiếu ở BK** — lấy từ checkpoint |
| D4 | Chữ phụ đọc được trên kính `--kinh-chu-phu` (5,26/5,34 vs 3,83/4,08) | globals BK | **KHÔNG**, nhưng INT có **đúng máy đo** để xác thực | điều 1 + a11y | CAO, đo lại được ngay | **RECOVER** |
| D5 | Primitive bề mặt nổi (portal + mọc-từ-nguồn) | `BeMatNoi.tsx` 428 dòng | bản khác: `Surface.tsx` chỉ gắn lớp | điều 2 · 11 | CAO — giải bài K4 kính-lồng-kính | **ADAPT** |
| D6 | Ba mức vật liệu theo vai trò (17 vai → 3 mức, có test) | `lib/ui/vat-lieu.ts` | bản rút gọn 2 giá trị | điều 1 · 11 | CAO | **ADAPT** |
| D7 | Nhịp chuyển động theo VAI TRÒ + một chỗ duy nhất quyết reduce-motion | `lib/ui/nhip.ts` | `--dur-*` hẹp hơn | điều 1 · 11 | VỪA-CAO | **ADAPT** |
| D8 | **DẢI NGỮ CẢNH mép trên** (dự án · chặng, 2 tầng có chứng cứ) | `DaiNguCanh.tsx` 209 dòng | **KHÔNG** | điều 2 "Left = Where am I" | CAO | **RECOVER** |
| D9 | **CỤM PHẢI TRÊN** (thông báo · hiện diện · avatar) tách khỏi rail | `CumPhaiTren.tsx` 176 dòng | **KHÔNG** — INT còn avatar ở rail | **điều 3** + tiêu chí trượt của chủ dự án | CAO — INT **đang ở đúng trạng thái bị khai là TRƯỢT** | **RECOVER** (kèm dọn bản trùng ở rail) |
| D10 | Chuông hoạt động 3 mức, gộp 2 hàng đợi THẬT | `HoatDongChuong.tsx` + `hoat-dong-luong.ts` | **KHÔNG** (nhưng 2 nguồn dữ liệu thì INT có đủ) | điều 7 ranh giới Vitals ≠ notification | CAO | **RECOVER** |
| D11 | Live Guide / Demo Conductor tự tiến theo trạng thái thật | `LiveGuide.tsx` + `live-guide.ts` | **KHÔNG** | điều 6 | VỪA-CAO | **RECOVER** |
| D12 | Xương demo 9 bước | `lib/studio/demo-spine.ts` | **KHÔNG** | điều 6 | VỪA | **RECOVER** |
| D13 | **Work Panel kéo được 320→440** | `RailDieuHuong.tsx:79-81` | **CHƯA** — INT tự ghi *"trần resize 440 là NỢ phiếu riêng"* | **điều 4** | CAO — BK thi hành đúng chốt, INT tự khai là nợ | **RECOVER** |
| D14 | Lõi chọn tín hiệu Peek — chỉ dữ liệu thật, trần 3, `undefined ≠ 0` | `vitals-tin-hieu.ts` + test | **KHÔNG** (INT `vitals-eval-*` là việc KHÁC) | điều 7 · 9 | CAO — chống bịa tín hiệu | **RECOVER** |
| D15 | Bốn trạng thái ô (tải · trống · lỗi · **ngoại tuyến**) + luật khung-xương mang hình dạng thứ sắp tới | `TrangThaiO.tsx` 246 dòng | `EmptyState.tsx` chỉ 3 tone, **thiếu ngoại tuyến** | pattern "empty state = workflow surface" | CAO | **ADAPT** — gộp nấc thứ tư vào `EmptyState.tsx`, không dựng component thứ hai |
| D16 | Rail 3 nấc 52/240/320 | có | **ĐÃ CÓ y hệt** | điều 4 | — | **ALREADY REPLACED** |
| D17 | Nhãn nguồn sự thật 5 nấc | **BK không có** | `truth.tsx` | **điều 9** | — | **ALREADY REPLACED** (INT thắng) |
| D18 | 6 báo cáo phiên 20/08 (chứa số đo tương phản 4 nền × 2 theme + lý do từng quyết định) | `docs/bao-cao-phien/2026-08-20-*` | **KHÔNG** (6/6 vắng) | điều 1 | CAO — thứ duy nhất giải thích các con số trong globals BK | **RECOVER** ⭐ *thu trước tiên, 0 rủi ro* |

#### 🔴 D-DR1 · CHỖ ĐỨNG VẬT LÝ CỦA VITALS — authority chống authority
| | |
|---|---|
| **EXS điều 7** (chốt 20/08, đã duyệt mắt) | *"Vitals nằm VẬT LÝ trong top edge như aperture sống, không phải popover gắn lên"*; §hệ quả sổ sách đóng dấu **SUPERSEDED** cho "Vitals neo theo ngữ cảnh — nút rời trục phải (16/08)" |
| **BK** | `VitalsAperture.tsx` 477 dòng mount ở `AppChrome.tsx:376`; docstring `:23-27` ghi rõ `VitalsGesture` là *"BẢN CŨ, ĐÃ MỒ CÔI"* và khẩu độ này **không hồi sinh nó** |
| **INT (Slice 12, 03/09)** | `components/studio/VitalsRightEdgeHost.tsx` — **hồi sinh `VitalsGesture` cạnh trục phải**, đúng thứ chốt 20/08 đã đóng dấu SUPERSEDED. `AppChrome.tsx:39,347` vẫn mount `VitalsPill` **chỉ ở Home** |
⇒ **Hai bên loại trừ nhau về chỗ đứng vật lý.** Không tự chọn.

#### 🔴 D-DR2 · BỐ CỤC HOME — authority chống authority
| | |
|---|---|
| **EXS điều 6** | Home = Personal Work OS, **hero = Resume**; tiêu chí trượt do chủ dự án đặt: *"TRƯỢT nếu Home vẫn trông như dashboard SaaS"* |
| **BK** | `components/home/xuong-layout.ts` — **MỘT TIÊU ĐIỂM + MỘT CỤM PHỤ**, bỏ lưới bento; tự khai *"NÓ ĐÈ HƯỚNG CŨ… bento giữ nguyên cho bản xếp dọc hẹp"* + `BatDauNgaySoKhong.tsx` (Home ngày-số-không) + `widget-prefs.ts` (ẩn/hiện/thứ tự per-user) |
| **INT** | vẫn **bento 9 ô** (`components/home/widgets/bento-layout.ts`), và slice Home 03/09 còn **đầu tư thêm** vào bento |
⇒ **Hai bố cục Home loại trừ nhau trên màn rộng.** BK có sẵn đường sống chung (bento → nhánh hẹp <1100px) nhưng chọn hướng chính là quyết định của chủ dự án.

---

## 3 · KẾT LUẬN PHÂN LOẠI

**`backup/2026-08-19-batch0a` = RECOVER SELECTIVELY** — khớp chỉ thị chủ dự án. Nhưng kèm hai đính chính bắt buộc:

1. **Nhánh KHÔNG tự đứng được.** HEAD không biên dịch (4 module thiếu). Mọi kế hoạch thu về phải lấy 4 module đó **từ `checkpoint`** (chép nội dung, không merge lịch sử).
2. **Nó không phải nguồn đầy đủ.** `checkpoint` giữ bản **mới hơn** của 54/56 tệp, cộng thêm 207 tệp mã mà cả backup lẫn INT đều không có. ⇒ **Nguồn thu hồi đúng là `checkpoint`, backup chỉ là lát cắt sớm của nó.**

**Thứ tự thu về đề xuất** (rẻ→đắt, mỗi nhóm tự đứng được):
`A5` (1 dòng CSS) → `C1` · `A7` · `C8-loại` (lỗi dữ liệu, có test) → `A6+mime-sniff` · `B1` (chống mất việc) → `A2+A3` → `A4+A12` → `B2→B3→B4` → `B6` (hoà tay 1 chỗ) → `A10` (tham số hoá).

**Không đụng cho tới khi có quyết định:** `A9` · `A11` · `A13` · `B10-viết-lại` · `C4` · **D-DR1 (chỗ đứng Vitals)** · **D-DR2 (bố cục Home)** — hai mục cuối là authority chống authority, đã trình chủ dự án.

**Nguồn thu hồi**: lấy blob từ `origin/checkpoint/2026-08-24-control-plane` chứ **không** từ `backup` — checkpoint là bản muộn hơn của cùng những tệp đó, và là nơi duy nhất có các module phụ thuộc mà backup thiếu. Chép NỘI DUNG, không merge lịch sử.

---

## 4 · TIẾN ĐỘ THU HỒI (cập nhật 04/09)

Chủ dự án chốt **THU CÓ CHỌN LỌC**; mục RECOVER/ADAPT không đụng authority thì tự thi công, mỗi cụm một commit riêng.

| Mục | Trạng thái | Bằng chứng |
|---|---|---|
| **D18 · 22 tài liệu bằng chứng + sổ kiểm kê toàn app** | ✅ thu về | `3cefdd95` — 4.971 dòng; rà trung tính 0 dấu vết, 0 khoá lộ |
| **A5 · viewport 3D cắt cụt trên retina** | ✅ thu về + máy canh | `ab43f1c1` — đo Chromium: DPR=2 không vá **tràn 300px**, có vá **0px**, buffer vẫn 900×600 |
| **A7 · kệ hết món CÂM** | ✅ thu về | `8eb248d1` — 4 món câm hết câm, `SCALE-H` trả null **có lý do** thay vì im lặng; test đọc kho THẬT |
| **C1 · Promote thôi ghi tài sản 0×0** | ✅ thu về | `f35fffa4` — đo thật: `0×0` → `37×21`, palette rỗng → 4 màu, `contentHash` trùng khít `ProjectFile` |
| **D1-D4 · tầng hành vi nền UI** | ✅ thu về | `31a1c6cc` — đặt chỗ 7 bước · hiện dần 6 bậc · máy kéo · `--kinh-chu-phu`; `globals.css` thuần thêm 19/0 |
| **D13 · Work Panel kéo được 320–440** | ✅ thu về (port, không dán đè) | `366c6fba` — kèm **sửa lỗi closure của chính bản cũ** (lưu bề rộng trước-khi-kéo) |
| **C8 · migration `reviewState`** | ⛔ loại | schema hai bên đều không có cột đó ⇒ thêm vào là dựng cột Prisma không biết |
| Rủi ro phát hành migration *(ngoài phạm vi nhánh này)* | ✅ đóng | `fd83f343` — `migrate deploy` từ CSDL sạch nay dựng **24/24 bảng** |

**Cổng tích hợp**: `tsc` 0 · `npm test` **EXIT 0 hai lần liên tiếp** · `build` 0. Trong lúc soi diff, cổng bắt được một lỗi đua giữa các test chạm CSDL dùng chung `dev.db` — root-cause bằng thí nghiệm (chạy riêng PASS, chạy cùng FAIL), sửa ở **khâu chạy test**, không đụng sản phẩm (`ac751327`).

### Còn trong hàng, chưa đụng
`A2+A3` (chọn/xoá khối 3D — bó chung) · `A4+A12` (dựng khối bằng cử chỉ) · `A6+mime-sniff` và `B1` (bản sao bền trên máy chủ) · `B2→B4` (tờ bản vẽ sang Trình chiếu) · `B6` (deep-link slide) · `B12` (bốn nghĩa sự thật) · `A10` (bộ kiểm con-trỏ-thật, phải tham số hoá trước) · `D5-D7` (gộp trục vật liệu/nhịp) · `D8-D12` (dải ngữ cảnh · cụm phải-trên · chuông · Live Guide) · `D15` (nấc "ngoại tuyến" cho EmptyState) · `C2 · C5 · C6`.
