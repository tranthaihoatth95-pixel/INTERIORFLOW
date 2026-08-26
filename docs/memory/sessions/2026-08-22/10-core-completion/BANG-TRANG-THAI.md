# BẢNG HOÀN TẤT LÕI IF — sống, cập nhật mỗi wave (§23)

MOC: HEAD `c7f3ac8` (nhãn main; **nội dung đĩa = backup/2026-08-19-batch0a**) · 383 tệp chưa commit
CỔNG: `tsc` exit 0 · `npm test` exit 0 (ok=9211, fail=0, 3 lượt liên tiếp)

| # | Hạng mục | TT | Bằng chứng / Hiện trạng | Chủ | Phép thử kế tiếp |
|---|---|---|---|---|---|
| 1 | VITALS USER-FACING | 🟢 | A–J app thật: calm→attention→peek→detail→deep-link→tính lại→calm. 2 lỗi UI thật đã sửa (focus-ghim · closure cũ). `data-vitals-state` | MAIN | — |
| 2 | HOME LIVING CANVAS | 🟡 | **Bốn dải LIVE trên `/`**: đo DOM `khong-khi(115) → tiep-tuc(290) → ke-du-an(452) → cam-hung(838)`; hết tường widget; `che-do-home.ts` calm/editorial/compact/custom (custom giữ NGUYÊN bố cục cũ, không xoá widget). CÒN: dải Không khí vẫn là THẺ có viền, chưa phải TRƯỜNG; màn cài đặt chọn chế độ chưa dựng | MAIN | ambient thành trường + màn Cài đặt→Màn hình chính |
| 3 | SHARED WORKSPACE/CANVAS | 🟡 | **Lane W PASS, MAIN kiểm lại** (71 test/0 fail · tsc 0 · suite exit 0): BA xưởng KHÁC LOẠI trên MỘT canvas (`three.camera`→`ai.text2image`→`ai.image2video`), bấm Tiêu cự đổi 24→35mm THẬT; W3 quay về canvas cũ — id/vị trí/dây/khung nhìn/tham số dở GIỐNG HỆT (đối chiếu máy). Gốc bệnh lane tự đào ra: `TASK_CARDS` 12/12 node ảnh ⇒ 3/4 môi trường không có đường mở | lane W | vệ tinh nấc 3 đầy đủ |
| 4 | TOOLWINDOW SYSTEM | 🟡 | Lệnh vệ tinh **4/13 có điện** (3 lệnh đi CÙNG đường `updateParam()` với ParamField ⇒ undo/lưu chung), 9 còn mờ **mỗi lệnh MỘT lý do riêng**; máy canh `lenhKhongKhaiSoPhan/KhaiHaiLan/KhaiThua` phải rỗng ⇒ quên khai số phận là test đỏ. Lỗi thật ảnh bắt được: `toanMan` inset:0 đẩy vệ tinh RA NGOÀI MÀN — nấc to nhất từng là nấc duy nhất không có vệ tinh, đã sửa. Nấc 3 hiện MỎNG (đúng 1 công năng riêng: thoát-zoom) — lane khai thẳng, không bỏ được | lane W | 9 lệnh còn lại + vệ tinh sâu nấc 3 |
| 5 | SIDEBAR MAP | 🟢 | 3 đảo · tên dự án thật · xương sống · **Soát duyệt hết chết** (mục HÀNH ĐỘNG mở bảng kiểm mép phải) · **nấc 320 THÊM TIN thật**: đo app `Dự án · 3 dự án` · `Tổng quan · Dự án mới` · `Thiết kế 2D · đang dở`. Files/Thư viện chưa nối nguồn ⇒ **im, không bịa số** | MAIN | — |
| 5b | **SMART SHELL / CHROME** | 🟡 | **Bản đồ NỔI + tự thu (§7–8) LIVE**: rail giữ 52px trong dòng chảy, nấc 240/320 là TẤM NỔI đè lên nội dung — đo app: canvas `left=88` khi tấm 240 đang mở (KHÔNG bị bóp) · rời chuột → ân hạn 320ms → thu về 52 · GHIM giữ tấm · Esc thu · focus bàn phím giữ mở. CÒN: hàng menu CadToolbar (44px) chưa gộp nốt · trạng thái chrome theo việc (§15) | MAIN | 2D toolbelt nổi |
| 6 | AUTH/LOCK/RESUME | 🟡 | **Lane K PASS** (MAIN đã kiểm lại: tsc 0 · npm test exit 0 · `APP_COMMANDS.app.lock` trong sổ lệnh chung · 6 ảnh). LOCK≠LOGOUT chứng minh bằng cách mạnh: **ref `<canvas>` lấy TRƯỚC khoá vẫn `isConnected` sau khi mở** ⇒ cây workspace chưa bao giờ bị tháo. `unlock()` chỉ hạ lớp che, KHÔNG `router.push` ⇒ về đúng bàn vẽ cũ. **SINH TRẮC: KHÔNG CÓ** (0 route WebAuthn — không vẽ nút giả). CÒN: 401 chưa chạy thật (login bị stub 200) · `⌃⌘Q` cũ vẫn song song `⌘⇧L` | lane K | 401 thật + dọn phím trùng |
| 7 | VOICE | 🟡 | **Lane V PASS, MAIN kiểm lại** (test 20 ca + toàn suite exit 0): hợp đồng `DauVaoNguNghia` — chữ gõ và giọng ra **cùng một ý định** (deepStrictEqual); lệnh giải qua SỔ LỆNH CHUNG (bằng chứng mạnh: 3 câu ví dụ trả `khong-co-trong-so-lenh` vì sổ chưa có lệnh đó — có bảng riêng thì đã chạy); **fail-closed 3 tầng** (mặc định mọi ý định phải xác nhận, undo/redo/delete cố ý KHÔNG nằm danh sách an toàn). CÒN: **chưa nói vào micro thật** (headless không có mic — transcript bơm vào đúng cửa) · component chưa mount | lane V | Hoà nói 1 câu thật |
| 8 | VI/EN | 🟡 | `lib/i18n.ts` `useT(vi,en)` cặp inline; chưa có lớp thuật ngữ + test hồi quy | lane V | đổi VI/EN bền qua F5 |
| 9 | MASTER LIBRARY | 🟡 | **Lane B PASS, MAIN kiểm lại** (seed test 20 pass): kệ **0 → 73 món THẬT** (54 dxf parse thật + 13 vật liệu + 6 cụm bàn); `BLK-ARCH-DOOR-SINGLE` một danh tính lộ 2D+3D+preview, mặt suy TỪ DỮ LIỆU không phải nhãn tay; 0 giá bịa · 0 trending · bỏ 17 ảnh uploads (không phục vụ công khai). CÒN: **kéo-thả xuống bản vẽ chưa chạy thật lần nào** (`via:'idfc'` có sẵn nhưng 0 lần chạy) · ký hiệu tạm xếp `fitout` chờ Hoà chốt kind | lane B | kéo bằng CHUỘT thật từ tấm Thư viện |
| 10 | 2D CONTENT | 🔴 | 54 block `.dxf` chưa mang dữ liệu | lane B | thả block → có specId |
| 11 | 3D CONTENT | 🔴 | rời rạc | lane B | thả vật → 3D + BOQ |
| 12 | MATERIAL | 🟡 | `getMaterial()` 3 mặt CÓ; matId UUID bước 2A; **chờ Hoà chạy migration** | MAIN | chọn → áp → 3D+2D+Spec |
| 13 | PRESENT TEMPLATES | 🔴 | chưa có bộ mẫu thật | lane B | chèn mẫu → ra lớp sửa được |
| 14 | GALLERY | 🟡 | `lib/gallery.ts` localStorage cá nhân | lane B | ảnh có nguồn |
| 15 | EXPLORE | 🔴 | chưa có | lane B | — |
| 16 | FILES→LIBRARY | 🟡 | hai tầng + Collection+; đường promote chưa đo lại | lane B | tệp → hiểu → lên kệ |
| 17 | VISUAL PIPELINE | 🟡 | ComfyUI THẬT chạy; vành ngữ nghĩa chưa cắm | lane W | chạy → vành chạy → xong |
| 18 | REVIEW GATE | 🔴 | `lib/review` có; cổng người chưa dựng | — | — |
| 19 | INTEROPERABILITY | 🟡 | DWG/DXF/PDF có đường; chưa nghiệm thu tệp thật | — | — |
| 20 | FULL-SPINE REHEARSAL | 🔴 | chưa chạy | MAIN | 1 dự án thật xuyên suốt |

## FREEZE — GIỮ XANH, CHỈ NỐI THÊM (§1)
Site truth · nắng tất định · 3D đọc hồ sơ · stale có mục tiêu · provenance/quyền người · Site→Vitals ·
Present bền vững · 2D bền vững · thao tác 3D đang chạy · ComfyUI thật · Image→Spec / Controlled Edit.

## BLOCKER THẬT (chỉ những cái cần Hoà)
1. **commit/push bị classifier chặn** — 383 tệp treo. Bàn giao ở `09-ban-giao/README.md`.
2. **Prisma migration `ProductSpec.matId`** — cần Hoà chạy tay (sandbox không khoá được file).
3. Ba ngưỡng Lane B (mưa 100mm · ven biển 3000m · ẩm 75%) — câu hỏi BẰNG CHỨNG, hiện đang IM
   trong sản xuất nên KHÔNG chặn.

---
## NHẬT KÝ WAVE

### Wave 1 (MAIN) — HOME BỐN DẢI
`lib/home/che-do-home.ts` + test (7 khẳng định) · `DongStudioHome.tsx` thêm nhánh `bonDai`.
Thứ tự đọc chính tắc **KHÔNG KHÍ → TIẾP TỤC → KỆ DỰ ÁN → CẢM HỨNG** nay là **MẶC ĐỊNH**.
🔴 Gốc bệnh đã sửa: bản cũ đặt KHÔNG KHÍ vào **cột phụ bên phải**, khung hình đầu nhường cho lưới
dự án + cột widget ⇒ mắt chạm DỮ LIỆU trước, chạm NƠI CHỐN sau ⇒ đọc ra bảng điều khiển.
⚖️ Widget cũ **KHÔNG bị xoá** — sống ở chế độ `custom` (hai cột nguyên vẹn). Đổi MẶC ĐỊNH, không
cắt tính năng.
📏 Số đo thật sửa một lỗi thật: dải kệ để `minHeight:300` **CẮT NGANG** thẻ dự án (thẻ cao ~340)
⇒ nâng 360. Số này ĐO trên app, không chọn cho đẹp.
Ảnh: `artifacts/visual-review/H1-home-bon-dai.png`. Cổng: `tsc` 0 · `npm test` exit 0.

### Wave 2 (MAIN) — GIẾT MỤC CHẾT "SOÁT DUYỆT"
🔴 Gốc bệnh: mô hình rail chỉ biết `duong` (route tuyệt đối) hoặc `duoi` (route trong dự án).
Bảng Soát duyệt sống ở MÉP PHẢI theo luật "một chỗ ngồi cố định" nên **không có route** ⇒ mục bị
ép **mờ vĩnh viễn**: một mục CHẾT nằm giữa bốn mục sống.
⛔ Cách sai là đẻ một trang "Soát duyệt" toàn cục chỉ để có chỗ trỏ tới — đúng thứ §5 cấm.
✅ Cách đã làm: thêm loại thứ ba `hanhDong` — mục là một HÀNH ĐỘNG, mở đúng bảng ĐANG CÓ tại chặng
đang đứng. `PanelFlank` mọc thêm cửa **mở-từ-xa** khoá theo `storageKey` (bắn cho panel này không
mở nhầm panel khác).
Đo app thật: Trang chủ → `aria-disabled=true` + lý do *"Mở một chặng thiết kế để có bảng kiểm"* ·
chặng 2D → bấm được → bảng kiểm MỞ (`if.panelflank.review.cad=1`).
Ảnh: `artifacts/visual-review/R1-soat-duyet-mo.png`. Cổng: `tsc` 0 · `npm test` exit 0.

### Wave 3 (lane K) — KHOÁ ≠ ĐĂNG XUẤT
Tái dùng nguyên `useLockScreen` · `lockScreenNow()` · hẹn giờ rảnh · portal K4 · `/api/auth/login`.
**Không dựng hệ khoá thứ hai**, và không sửa `AppChrome` (ngoài vùng ghi) — mọi thứ thêm đặt vào
`LockScreen` + `lib/lockscreen.ts` + `lib/auth/**` + `components/auth/**`.
⭐ Hai bẫy lane tự gỡ, đáng ghi:
① **"Không bao giờ" suýt thành "khoá tức thì"** — `setTimeout` với `0`/`Infinity`/`>2³¹ms` chạy
   NGAY. Quy ra 7 ngày (604.800.000ms, dưới trần) và phải sửa ruột `getLockIdleMinutes` (bản cũ
   coi `≤0` là hỏng rồi rơi về 15).
② Không nhét lệnh khoá vào `COMMANDS` — `registry.test.ts` khoá bất biến "mọi lệnh ≥1 alias", mà
   lệnh khoá cố ý KHÔNG có alias gõ tay ⇒ tách `APP_COMMANDS` cùng tệp cùng kiểu, **0 test vỡ**.
⭐ Cách chứng minh LOCK≠LOGOUT đáng nhân rộng: thay vì chụp ảnh, giữ **tham chiếu DOM trước khi
khoá** rồi kiểm `isConnected` sau khi mở — chứng minh cây chưa bị tháo, mạnh hơn mọi ảnh chụp.
🔴 **SINH TRẮC KHÔNG CÓ và lane nói thẳng**: `app/api/auth/` không có route WebAuthn, không gói
WebAuthn ⇒ thiếu nửa máy chủ thì `navigator.credentials.get()` không chứng minh được gì. Không vẽ
nút giả. Đây là cách khai đúng.
⚠️ CHƯA CHẮC (lane tự khai): 401 chưa chạy thật (login stub 200) · tab-nền và nấc "Không bao giờ"
chưa đợi đủ giờ · chỉ Chromium/macOS/theme sáng · `⌃⌘Q` cũ vẫn chạy song song `⌘⇧L` (hai phím một
việc — nợ, dọn khi AppChrome vào vùng ghi).

### Wave 4 (MAIN) — NẤC 320 THÊM TIN, KHÔNG GIÃN HÀNG
Luật §5: *"Large state ADDS information, not merely stretches rows."*
Đo trước: nấc Duyệt chỉ thêm tin cho `tong-quan` + 3 chặng, còn lại trả `null`.
Thêm **số dự án THẬT** — và tái dùng **CHÍNH lời gọi `/api/flows` đang có** cho tên dự án, **không
thêm request thứ hai**. Đo app thật: `Dự án · 3 dự án` · `Tổng quan · Dự án mới` · `Thiết kế 2D ·
đang dở`.
⚖️ Files/Thư viện/Soát duyệt vẫn **im** vì chưa nối nguồn — đúng luật "chưa đo thì không nói".
Bịa một con số ở đây là hỏng đúng cái mà nấc này sinh ra để làm.
Ảnh: `artifacts/visual-review/R2-rail-320-them-tin.png`. Cổng: `tsc` 0 · `npm test` exit 0.

### Wave 5 (MAIN) — KHÔNG KHÍ THÀNH **TRƯỜNG**, KHÔNG CÒN LÀ THẺ
`LightClock` mọc prop `truong`: bật thì bỏ vỏ `WidgetCard` (viền + nền thẻ), chữ đứng thẳng trên
nền trang. Chỉ dải KHÔNG KHÍ của bố cục bốn dải bật cờ này.
⚖️ Vẫn là PROP chứ không đổi luôn — bố cục `custom` hai cột vẫn cần vỏ thẻ để xếp hàng với các ô
khác. **Một component, hai chỗ đứng; không đẻ bản thứ hai.**

### Wave 6 (MAIN · phụ lục xếp hàng) — NÚT "VÀO XƯỞNG" THÀNH CỬA VÀO CÓ CHỮ KÝ
Chủ sở hữu THẬT: `components/entry/LoginForm.tsx:391` — **mở rộng tại chỗ**, không đẻ nút thứ hai,
không thêm bề mặt auth mới.
🔴 **Bắt được một lỗi màu đang sống**: nền nút là `ACCENT_WARM` (vàng đồng) — màu đó **đã bị khai
tử khỏi vai màu nhấn 16/08** (trên nền xám ra xỉn/ố). Nút quan trọng nhất của cửa vào vẫn đang đeo
màu đã bỏ. Đổi về `--accent`; chữ đổi `--bg` → `--on-accent` (`--bg` chỉ đúng ở một theme).
**Cấu tạo hai lớp** (`.if-vao-xuong`): ① NỀN TÍM ĐẶC ② THẤU KÍNH đè lên, thấy tím bên dưới bị bẻ.
Khác glassmorphism chung chung ở chỗ: kính thường là tấm mờ trên nền BẤT KỲ; đây thấu kính có một
nền tím CỤ THỂ để khúc xạ ⇒ đọc ra **vật liệu**, không ra **hiệu ứng**. `isolation:isolate` để nó
chỉ khúc xạ nền CỦA NÚT, không hút cả trang.
· NGHỈ: trôi 18s biên độ nhỏ · RÊ: thấu kính nghiêng về con trỏ (đặt biến CSS trên node, không
  chạy state React từng khung hình) + mũi tên nhích 2px · BẤM: nút nén 0.985, thấu kính **CÔ ĐẶC**
  (scale .94) chứ không chỉ mờ đi · XONG: **một** lượt quét sáng, chỉ chạy khi ĐÃ VÀO ĐƯỢC THẬT
  (`setVuaXong` đặt sau `res.ok`, trước `afterAuth`) — nó là tín hiệu "cửa mở", không phải hiệu
  ứng lúc bấm.
· Giảm chuyển động: thấu kính **ĐỨNG YÊN nhưng VẪN CÒN** — nó là vật liệu, cắt hẳn mới là làm mất
  thông tin về chất; chỉ cắt phần chuyển động. Đo: `animation-name: none`.
Đo app thật: nền `rgb(106,87,245)` · `::before` `if-thau-troi 18s` · reduce-motion `none`.
Ảnh: `B1-vao-xuong.png` · `B2-vao-xuong-reduce-motion.png`.

### Wave 7 (MAIN) — "KHÔNG BAO GIỜ" = KHÔNG CÓ HẸN GIỜ (§24, ĐÈ bản 7-ngày của lane K)
Bản 7-ngày là GIẢ LẬP: vẫn khoá (chỉ là rất lâu), và một `setTimeout` 604.800.000ms sống qua
sleep/wake theo cách không ai kiểm soát. Sửa HỢP ĐỒNG: `getLockIdleMinutes` trả **`null`** khi
Never — bắt nơi tiêu thụ xử nhánh "đừng đặt timer" thay vì nhận một số rồi cứ thế hẹn giờ. Hai
nơi tiêu thụ (AppChrome idle-timer · startLockGuard tab-về-lại) đều xử `null` = không khoá. Khoá
TAY (⌘⇧L) vẫn chạy. Bản `Effective` cũ đóng dấu ⛔ LỖI THỜI tại chỗ, không xoá.

### Wave 8 (MAIN) — BẢN ĐỒ NỔI + TỰ THU (hiến pháp Smart Shell §7–8)
🔴 Gốc bệnh: rail nằm TRONG dòng chảy — mở rộng nó là BÓP canvas, đúng thứ §7 cấm.
Nay: trong dòng chảy LUÔN chỉ 52px; nấc 240/320 vẽ thành **TẤM NỔI** (`position:absolute`, đổ
bóng) đè lên nội dung. Đo app thật: tấm 240 mở mà canvas `left=88` — **không bị bóp**.
§8: vào tấm → rời chuột → ân hạn **320ms** → tự thu về định vị (đo: `w 240 → 52`) · **GHIM** giữ
tấm ở lại (đo: ghim + rời chuột → vẫn 240) · Esc thu ngay · focus bàn phím bên trong giữ mở
(`onFocusCapture` huỷ hẹn thu — a11y §34) · đang kéo đổi bề rộng không bị thu.
⚠️ Lượt đo đầu báo "tự thu SAI" — **lỗi bộ đo**: chuột headless đi thẳng từ (0,0) ra canvas,
chưa từng VÀO tấm nên không có `pointerleave`. Vào rồi rời thì đúng. Ghi lại để không ai tưởng
phải vá thêm.
Ảnh: `M1-map-noi.png` · `M2-map-tu-thu.png` · `M3-map-ghim.png`. Cổng: tsc 0 · npm test exit 0 ·
nav test 0 fail.

### Wave 9 (MAIN) — GỘP DẢI "GỬI SANG TRÌNH CHIẾU" VÀO HÀNG TAB (§13)
Đo trước: 2D có **4 dải chồng** trước canvas (topbar 42 + tab 36 + gửi-TC 41 + menu 44 = 163px).
Dải "Gửi sang Trình chiếu" là dải NGANG TOÀN KHỔ 41px chỉ chứa MỘT nút + MỘT câu chú thích.
Sửa: `SheetTabBar` mọc **ổ phải** (`phai`) — hành động cấp-tài-liệu đứng CÙNG HÀNG với tab thay vì
tự mở dải riêng. Câu chú thích thường trực về `title` của nút (nó là lời GIẢI THÍCH, không phải
trạng thái cần chiếm chỗ); phản hồi "Đã gửi…" chỉ hiện TẠM THỜI khi có.
Đo sau: canvasTop **163 → 122px** (+41px cho bản vẽ), nút nằm trong hàng tab (y=47).
Ảnh: `S5-2d-gop-dai.png`. Cổng: tsc 0 · npm test exit 0.
Nợ ghi rõ: hàng menu CadToolbar 44px là dải cuối chưa gộp — chạm `CadToolbar` (900+ dòng), làm
lượt riêng để không kéo rủi ro vào wave này.
