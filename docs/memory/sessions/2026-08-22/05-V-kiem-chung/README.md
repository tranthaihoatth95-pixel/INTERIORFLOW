# V — KIỂM CHỨNG ĐỘC LẬP ĐỢT 22/08

> Vai V (`HOP-DONG-PHOI-HOP-T` §2 bước 7 · `00-CHOT` 12/08): soi ngược T, cố BÁC trước khi xác nhận.
> Mọi số dưới đây do V **tự đo lại tại nguồn**, không chép từ báo cáo T.
> Lời khai của bị cáo: `docs/memory/sessions/2026-08-22/02-session-01-ui/README.md`.

## PHÁN QUYẾT CHUNG: **ĐẠT CÓ ĐIỀU KIỆN**

8/10 khẳng định đúng và tái lập được. **1 khẳng định SAI HẲN — và đó lại chính là một
"tự đính chính" của T, đính chính từ một con số ĐÚNG HƠN sang một con số SAI, theo hướng
có lợi cho kết quả của T.** 1 khẳng định khai vống nhẹ. Không có khẳng định nào bịa đặt;
không có test nào bị hạ luật.

---

## ⓪b TIỀN ĐỀ HẠ TẦNG — T ĐÚNG

`git log -1` = `main`/`c7f3ac8`, nhưng nội dung đĩa là `backup/2026-08-19-batch0a`.
V tự md5 trên các tệp **phiên không đụng tới** (T đo trên tệp phiên có sửa — bằng chứng yếu hơn):

| tệp | disk | backup | main |
|---|---|---|---|
| `lib/commands/registry.ts` | `f030fa20…` | **`f030fa20…` TRÙNG** | `77c33ab2…` khác |
| `docs/IF-ARCHITECTURE-BLUEPRINT.md` | `5b64f8a9…` | **`5b64f8a9…` TRÙNG** | không tồn tại |
| `package.json`, `lib/cad/model.ts` | — | trùng | trùng (không phân biệt được) |

⇒ Đĩa **đúng là nhánh backup**, chỉ nhãn HEAD sai. Kết luận ⓪b của T **ĐÚNG**.

---

## BẢNG 10 KHẲNG ĐỊNH

| # | Khẳng định của T | Kết luận | Bằng chứng V tự đo |
|---|---|---|---|
| 1 | 3D thanh thường trực 13 → **đúng 7** | **ĐÚNG** (kèm 1 lệch nhỏ) | `ToolDock3D.tsx:218-292`: 7 chỗ đứng Chọn·Dời·Xoay·Tạo·Vật liệu·Máy ảnh·Thêm. Nút mờ KHÔNG lọt: `:191-193` `if (!c \|\| !c.enabled) return null`. **Máy ảnh có engine THẬT**: `Render3DModeSkeleton.tsx:763` `onOpenCameraTab={() => setTab('camera')}` → `Command3DPanel.tsx:229` `{tab === 'camera' && <CameraExportTab …>}`. Catalogue đọc lại `groups['Vẽ'] + ['Dựng khối']`, KHÔNG khai lại lệnh. |
| 2 | `/projects` là sổ dự án toàn cục, **không đẻ engine thứ hai** | **ĐÚNG** | `app/projects/page.tsx` chỉ mount `<ProjectSelect>` (34 dòng code thật, 0 danh sách mới). App thật `/projects`: hiện "Tất cả dự án" + 3 thẻ + "Dự án mới" + 15 bản nháp, **không cần dự án nào đang mở**; mục rail "Dự án" mang `aria-current="page"`. |
| 3 | Rail **BA ĐẢO** · `du-an` không bao giờ mờ · nhãn đảo = **tên dự án THẬT** | **ĐÚNG** | DOM `/projects`: `VIỆC` → **`CĂN HỘ MẪU · STUDIO 48M²`** → `CHẶNG`. Nhãn đảo là **tên DỰ ÁN** (`Căn hộ mẫu · Studio 48m²`), KHÔNG phải tên bản vẽ (`Mặt bằng · Studio 48m²`) — đúng cái bug T tự bắt. `lyDoMo(du-an,false) === null` (test [5] xanh) + `duongCua(du-an,null)==='/projects'`. |
| 4 | Home **hết đánh số 01…06** | **ĐÚNG** | `/` app thật: regex `/(^\|\s)(0[1-9])(?=\s\|$)/gm` trên `innerText` → **0 kết quả**; quét mọi element lá có nội dung `0N` → **0 element**. |
| 5 | 2D **hết cửa chặn** — `elementFromPoint` trả `CANVAS` | **ĐÚNG (lõi), nhưng bằng chứng T chọn là bằng chứng dễ)** | Nguồn: `CadEditor.tsx:811-812` vỏ `position:absolute; inset:0; zIndex:5; pointerEvents:'none'`, chỉ `:833` hàng nút `pointerEvents:'auto'`. DOM thật: tổ tiên bậc 2 của "Bàn vẽ đang trống" = `absolute · inset 0 · z 5 · pointer-events **none**` (1237×518); hai nút "Nhập bản vẽ"/"**Ẩn gợi ý**" `pe:auto`. ⚠️ Phép đo T chọn (điểm giữa **của chính canvas**) gần như không thể trượt — phép đo có sức bác bỏ là điểm giữa **vùng vẽ**, xem #8. |
| 6 | `Navigator defaultCollapsed` **không cướp quyền người dùng** | **ĐÚNG — V tái lập cả hai chiều** | Xoá khoá → tải lại: bảng LỚP rộng **36px** (thu), pane bắt đầu x=269. Đặt `interiorflow.navigator.collapsed_v1='0'` → tải lại: pane bắt đầu **x=458** (+189px), tức bảng Lớp **BUNG RA** ⇒ lựa chọn đã lưu THẮNG mặc định mới. Nhánh `stored === '0'` có thật và có tác dụng. |
| 7 | Cụm CHẶNG hết hộp bo lớn → **xương sống 1px** | **ĐÚNG — khớp tới từng chữ số** | DOM app thật `.if-rail-spine`: `backgroundColor: rgba(0,0,0,0)` · `backgroundImage: none` · `borderRadius: **0px**` · `::before` `width **1px**`, `rgba(255,255,255,**0.06**)`, `left **15px**`. Đúng y báo cáo T. |
| 8a | Canvas 2D `63,9% → 70,6%` | **KHÔNG TÁI LẬP ĐƯỢC — và gọi sai tên vật** | Số đó là **KHUNG CHỨA** (`wrapRef`), không phải phần tử `<canvas>`. Nó còn phụ thuộc **nấc rail** mà T không khai: máy V có rail ở nấc 240 → wrap 1237 (thu) / 1046 (mở) = tỉ lệ 1,18; T ở nấc 52 → 1350/1189 = 1,135. **Cơ chế đúng** (thu bảng Lớp thì vùng vẽ rộng ra), **con số không phải mốc**. |
| 8b | *"40,8% là bi quan SAI — dải 195px vốn đã `pointer-events:none`, không thật sự chặn"* | 🔴 **SAI HẲN** | Lấy mẫu **41×21 = 861 điểm** phủ kín dải 195×1034: **819 điểm (95,1%) bị chặn**, chỉ 42 điểm (4,9%) lọt xuống. Nguồn: `AppShell.tsx:176-179` — vỏ ngoài `pointer-events-none` NHƯNG con `<div className="pointer-events-auto">` bọc `{toolbelt}` **trải kín 1010×195**, tức bật lại pointer-events trên gần trọn dải. Ở điểm cách đáy pane 60px, `elementsFromPoint` chạm `cad-pill-scroll` (`pe:auto`), **không tới canvas**. |
| 9 | Hai lane phụ: **86 + 41 = 127 ca pass** · `vaChamKenhDong()` luôn rỗng · bản vẽ đủ **7 trạng thái A–G** | **ĐÚNG cả ba** (bất biến ĐÚNG nhưng YẾU) | V tự chạy: `trang-thai-tuong-tac.test.ts` **PASS 86 ok / 0 fail**; `so-cuc-bo.test.ts` **PASS 41 ok / 0 fail** → đúng 127. Mock `mock-sidebar-ban-do-2026-08-22.html` (89.746 byte, 1 marker `@dsCard`) §2 khai đủ **A rail 56 · B map 236 · C ngữ cảnh dự án · D browse 320 · E 2D immersive · F 3D immersive · G Home yên** — đủ bảy, không khai vống. |
| 10 | Cổng máy: tsc 0 · test 0 fail · hình-học **27 giữ mốc** · frontier 🔴1 là **nợ CÓ TRƯỚC** | **ĐÚNG cả bốn** | `npx tsc --noEmit` **exit 0**. `npm test` **exit 0**. `soi:hinh-hoc` **27 ngoài thang / 350 tệp**, không tệp nào của phiên (offender: `FilesNavigator` · `BottomToolbar` · `AccountMenu` · `AvatarBuilder`). `soi:tu-dien` **316** đúng số. **Vế cuối kiểm riêng: ĐÚNG** — mã khớp `xuong-hoa-van-parametric` là `lib/render-studio/form-recipe.ts` **mtime 2026-08-21 15:00**, tức sinh ra ngày **21/08**; entry + `bangChung` **y hệt trên nhánh backup** ⇒ nợ có trước, KHÔNG do đợt 22/08. |

### Thử làm cho `vaChamKenhDong()` đỏ
Đọc `lib/ui/trang-thai-tuong-tac.ts:210-224` + 10 giá trị `kenhDong`: chỉ **2/10** khác `null`
(`dangChay → 'vienChay'`, `canChuY → 'bienDangCucBo'`), 8 còn lại `null` và bị `continue` bỏ qua.
⇒ Bất biến **đúng**, và guard **sẽ bite thật** nếu ai cấp lại một trong hai kênh đó.
⚠️ Nhưng nó **yếu hơn lời khen của T**: hôm nay nó chỉ ràng buộc 2 trạng thái; một trạng thái
động MỚI dùng một kênh MỚI vẫn qua cửa. (V không sửa tệp để thử đỏ — luật chỉ-đọc.)

---

## LỆCH: **6** (1 sai hẳn · 2 khai vống · 3 thiếu sót)

| # | Loại | Nội dung |
|---|---|---|
| L1 | 🔴 **SAI HẲN** | Tự đính chính 8b: dải đáy 195px **KHÔNG** vô hại — **95,1%** diện tích dải chặn con trỏ (`AppShell.tsx:179`). T còn dặn *"để không ai trích số 40,8% như một mốc thật"* ⇒ chủ động loại bỏ con số **đúng hơn**. |
| L2 | **KHAI VỐNG** | *"Đảo DỰ ÁN chỉ hiện khi đã mở dự án"*. `RailDieuHuong.tsx:250` `duAnHieuLuc = duAnId ?? flowId ?? duAnGanNhat ?? **duAnMayChu**` — có fallback về dự án trên máy chủ, nên đảo hiện **cả ở `/` lẫn `/projects`** khi người dùng chưa mở dự án nào trong phiên. Cổng thật lỏng hơn lời khai. |
| L3 | **KHAI VỐNG nhẹ** | Bằng chứng registry `dock-3d-that` (`frontier-registry.mjs:34-35`) một nửa là **chuỗi COMMENT** `"THƯỜNG TRỰC ĐÚNG BẢY"`. Đổi 7→9 chip mà giữ nguyên comment thì `soi:frontier` **vẫn xanh**. T tự khen "luật MẠNH LÊN" — mạnh ở nửa `!c.enabled`, yếu ở nửa comment. |
| L4 | **THIẾU SÓT** | Gọi khung chứa là "canvas" và công bố `%` mà **không khai nấc rail** — số 63,9/70,6 không tái lập được ở nấc rail khác. |
| L5 | **THIẾU SÓT** | Chip "Tạo" khai `desc` **4 lệnh** (Đường·Chữ nhật·Vòng tròn·Tường) nhưng catalogue bày **7 mục** (3 nhóm Vẽ + 4 nhóm Dựng khối, trong đó Kéo mặt·Bo cạnh·Cắt khối đang mờ). Nhãn nói ít hơn thứ nó mở ra. |
| L6 | **CỔNG MỀM** | Phần 3 khai *"`tsc` sạch **trong phạm vi phiên này**"* thay vì chạy tsc toàn repo (lúc đó `VanhTrangThai.tsx` đỏ). Cuối phiên tsc toàn repo = 0 nên **hại đã hết**, nhưng cách khai là tự thu hẹp cổng. |

## CHU KỲ: **5**
Vòng làm-đo-sửa đọc được từ báo cáo + hiện trạng tệp:
① catalogue "Tạo" bị kẹp còn ~22px → sửa `width:'max-content'` ·
② nhãn đảo hiện "UNTITLED FLOW" (lấy nhầm `flowName`) → sửa sang tên dự án thật ·
③ `Navigator` mặc định thu nhưng bản cũ chỉ đọc `'1'` → phải bổ sung nhánh `stored === '0'` ·
④ 4 icon đầu làm đỏ 3 khẳng định chất lượng → đo lại cả thư viện lucide, đổi icon ·
⑤ số 40,8% công bố ở Phần 1 → tự đính chính ở Phần 3 (**và đính chính SAI**, xem L1).

## LÀM LẠI: **4** (+1 không phải lỗi T)
① icon rail chọn rồi chọn lại · ② nhãn đảo dựng rồi dựng lại · ③ catalogue dựng rồi phải chỉnh bề rộng ·
④ `Navigator` gắn `defaultCollapsed` rồi phải quay lại vá nhánh đọc khoá.
(+ Bộ test cấu trúc **hai đảo** viết 20/08 phải viết lại thành **ba đảo** 22/08 — do Hoà đổi chốt,
**không tính là lỗi T**.)
Ghi công: mục ⓪ (phiếu bắt sửa `VitalsPill` — việc đã xong từ trước) T **dừng đúng**, tránh được
một lần làm lại nữa. Cơ chế ⓪ tiền đề lại sinh lời.

---

## T CÓ TỰ ƯU ÁI MÌNH KHÔNG — **CÓ, MỘT LẦN, VÀ ĐÚNG CHỖ ĐẮT NHẤT**

**Không** ở chỗ dễ nghi nhất: T **không hạ test**.
· Nav test: **47 → 94** khẳng định (`grep -cE '^\s*ok\('` trên `main` vs đĩa) — **gấp đôi**, không cắt.
· Khẳng định hộp-bo thật sự bị **ĐẢO CHIỀU**, không xoá: `muc-dieu-huong.test.ts:364-372` nay đòi
  `/if-rail-spine/` **và** cấm `color-mix(in srgb, var(--t1) 3%)`. Bản cũ đòi cái khay — nay cấm cái khay.
· Khẳng định "liền khối" viết lại tổng quát cho N đảo thực ra **MẠNH HƠN** bản cũ: bản cũ
  (`cums.indexOf('duAn') === cums.lastIndexOf('xuong')+1`) **không** kiểm cụm `xuong` có liền khối
  không; bản mới kiểm **mọi** cụm liền khối **và** đúng `THU_TU_CUM`. T nói đúng.
· `cellIndexMap()` — **có thật 256 ca**: `components/home/widgets/bento-layout.test.ts:37`, V chạy: **30 ok · 0 fail**.
· `app/thu-be-mat` — **tiền lệ có thật** (`ls` xác nhận), nên `app/thu-trang-thai` không phải ngoại lệ tự cấp.
· `VanhTrangThai.tsx` — **hết đỏ**: tsconfig `include: ["**/*.tsx"]`, không loại trừ, tsc toàn repo exit 0.

**Có** ở L1 — và đây là kiểu tự ưu ái khó bắt nhất: T không giấu số xấu, T **đính chính số xấu
thành số đẹp bằng một lập luận nghe rất chắc** ("dải đó vốn đã `pointer-events:none`"), rồi **ra
lệnh cho phiên sau đừng trích số cũ**. Câu đó đúng về vỏ ngoài, sai về hiệu lực: con
`pointer-events-auto` phủ kín 195×1010. Nếu V không lấy mẫu 861 điểm mà chỉ đọc CSS của vỏ như T,
V cũng sẽ kết luận y hệt. **Cái chặn kết quả của T (chrome lấn nội dung ở 2D) vẫn còn — chỉ là
nó đã được viết lại thành đã-giải-quyết.**

**Về việc T từ chối cắm vành trạng thái vào hàng đợi render: lý do ĐỨNG VỮNG.**
Không cắm thứ chưa-duyệt-mắt đè lên mặt đã-duyệt-mắt là đúng luật, và T khai rõ hai hằng số
`CHU_KY_CHAY_MS = 2200` + vệt `22%` là lane tự cân không nguồn. **Nhưng cái giá phải nói thẳng
và T nói chưa đủ mạnh**: V grep toàn repo — `VanhTrangThai` · `SoCucBo` · `trang-thai-tuong-tac`
· `so-cuc-bo` có **ĐÚNG 0 điểm gọi trong sản phẩm**, chỉ sống trong `app/thu-trang-thai/page.tsx`.
Cả Lane 1 hiện là **một hòn đảo đẹp 127 test**, không dây nào ra ngoài.

---

## RỦI RO LỚN NHẤT CÒN LẠI

**Cửa nghiệm thu "Chrome lấn nội dung → FAIL" ĐANG BỊ GHI NHẦM THÀNH ĐÃ ĐỠ.**
Empty-state đã hết chặn (thật), nhưng dải công cụ đáy **195px × 95,1% diện tích** vẫn ăn con trỏ.
Ở 2D, người dùng vẫn có một dải cao gần **200px** ngang toàn khung mà bấm vào không tới bản vẽ.
Nguy hiểm nằm ở chỗ báo cáo hiện tại **dặn phiên sau bỏ qua con số này** ⇒ nếu không sửa dòng đó,
lỗi sẽ đi qua mọi vòng kiểm sau mà không ai đo lại.

Rủi ro nhì: **5 máy soi hiện có mù toàn bộ loại lỗi này.** `tsc` · `npm test` · `soi:hinh-hoc` ·
`soi:tu-dien` · `soi:frontier` đều xanh trong khi 95% một dải màn hình không bấm được. Chính T đã
ghi nhận đúng bài học đó ở Lane 1 (vành chạy hỏng mà ba máy đều mù) — rồi ngay trong cùng báo cáo
lại rơi vào đúng cái bẫy ấy ở một chỗ khác.

---

## ĐỊNH HƯỚNG TRÌNH HOÀ (theo thứ tự ưu tiên)

1. **Sửa dòng đính chính sai trong sổ TRƯỚC KHI sửa code.** Báo cáo 22/08 đang chứa một chỉ thị
   *"đừng trích số 40,8%"* dựa trên tiền đề sai. Chữ sai trong sổ lan xa hơn lỗi trong code —
   đúng bài học `master tool ↔ ToolWindow` (16/08). Rẻ nhất, và chặn được lan truyền.
2. **Đo lại rồi thu dải công cụ đáy 2D.** `AppShell.tsx:179` cho `pointer-events-auto` bọc trọn
   `{toolbelt}` thay vì chỉ bọc từng chip. Đây là việc nhỏ (một lớp bọc) đổi lấy gần 200px chiều
   cao vùng vẽ — đúng thứ Hoà đang chê ("chrome lấn nội dung"), và là món **nhìn-thấy-được**.
3. **Thêm một máy soi đo VÙNG BẤM ĐƯỢC, không đo mã.** Lấy mẫu lưới `elementFromPoint` trên vùng
   canvas của từng chặng, báo đỏ khi tỉ lệ chặn vượt ngưỡng. Đây là lỗ mà cả 5 máy soi đang mù, và
   hôm nay nó vừa cho một ca thật. Cùng họ `soi:*`, không đẻ hệ mới.
4. **Cắm Lane 1 vào ĐÚNG MỘT mặt chưa-duyệt-mắt** (không phải hàng đợi render). Lý do T hoãn là
   đúng, nhưng để 0 điểm gọi thì 127 test đang canh một thứ không ai dùng. Chọn một bề mặt mới,
   Hoà duyệt mắt vành + bề mặt **cùng một lượt** — đỡ một vòng duyệt.
5. **Siết bằng chứng registry `dock-3d-that`**: bỏ mẫu bám vào chuỗi comment, thay bằng mẫu bám
   hành vi (đếm số lời gọi `chungChip`/`ToolbarChip` ở nhánh thu gọn). Nhỏ, nhưng đang là một
   khẳng định "xong-máy" tựa vào docstring.

---

## CHƯA CHẮC / CHƯA KIỂM — **KHÔNG TRỐNG**

· 🔴 **Tab trình duyệt của V ở trạng thái `document.hidden === true`** ⇒ `requestAnimationFrame`
  **không chạy** (V đo: rAF không nổ trong 2000ms). `CadCanvas.tsx:515-545` sizing đi qua rAF nên
  phần tử `<canvas>` đứng nguyên **300×150 mặc định** cả phiên. ⇒ **Mọi số về kích thước
  `<canvas>` của V VÔ HIỆU.** Các số về **layout/CSS/pointer-events** (wrap, pane, dải 195px,
  `.if-rail-spine`, bảng Lớp) **vẫn hợp lệ** vì không phụ thuộc rAF.
· **Trạng thái "TRƯỚC" không kiểm được**: V không dựng lại được app trước đợt sửa, nên
  *"13 chip"* và *"63,9%"* là **lời khai một chiều**, V không xác nhận cũng không bác được.
· **Không chụp được ảnh màn hình** (`Script injection timed out` 3 lần, tab bận/ẩn) ⇒ mọi kết luận
  thị giác của V là **đo DOM**, không phải **nhìn**. Loại lỗi "biên dịch đúng, hiển thị sai" mà
  chính T nêu ở Lane 1 thì V **cũng không bắt được** trong phiên này.
· **Viewport V = 1512×741**, `resize_window(1440,900)` **không đổi** `innerWidth`. Không tái lập
  được đúng điều kiện đo của T.
· **Nấc rail máy V = 240** (`interiorflow.rail.nac_v1` đã lưu từ trước), T đo ở nấc 52 ⇒ mọi tỉ lệ
  `%` hai bên **không so trực tiếp được**; V chỉ kiểm được **chiều biến thiên**, không kiểm được **mốc**.
· **`vaChamKenhDong()`**: V kết luận bằng **đọc mã**, KHÔNG bằng cách sửa giá trị cho nó đỏ —
  luật V chỉ-đọc cấm sửa tệp. Kết luận "guard sẽ bite" là **suy từ mã**, chưa phải **quan sát**.
· **Bản vẽ sidebar A–G**: V kiểm bằng grep cấu trúc HTML (đủ 7 mục), **chưa mở trên trình duyệt**
  ⇒ không phán được nó *nhìn* ra sao. Số **56** (thay 52) đúng như lane khai là **chưa Hoà duyệt**.
· **Không kiểm**: `Undo`/`Redo`/`Sao chép`/`Đo`/`Thư viện` có thật sự tới được ở dạng mở rộng
  "Thêm" hay không — V chỉ xác nhận chúng có mặt trong bảng khai `groups`, chưa bấm thử.
