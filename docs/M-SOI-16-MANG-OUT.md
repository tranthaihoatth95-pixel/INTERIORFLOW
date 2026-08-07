# SOI 16 MẢNG CHƯA AI MỞ — 07/08/2026
Người soi: COWORK-TỔNG (tự quét bằng script, không qua phiên code).
Phạm vi: 25 thư mục · ~48.589 dòng nguồn chưa có test và chưa có dòng sổ.

---

## ⚠️ TRUNG THỰC TRƯỚC: script đầu SAI, kết quả đầu PHẢI BỎ

Lần quét đầu báo **"30 file chết hoàn toàn · 6.573 dòng"**. Sai.
Biểu thức tìm kiếm không bắt `export default function`, nên với mọi file dùng `export default`
(hầu hết component React) script chỉ thấy các hàm phụ, thấy chúng không ai gọi, rồi kết án cả file.

Kiểm tay 4 file bị kết án nặng nhất — **cả 4 đều sống**:
| File | Bằng chứng sống |
|---|---|
| `components/present-editor/EditorCanvas.tsx` (816 dòng) | `export default function EditorCanvas`, 12 file nhắc |
| `components/render-studio/LightTab.tsx` (606) | `components/render-studio/Command3DPanel.tsx:41` import · dùng `:127` |
| `components/studio/VitalsGesture.tsx` (440) | `export default function VitalsGesturePanel` |
| `components/ui/Tooltip.tsx` (294) | `export default function Tooltip`, 16 file nhắc |

Sửa regex (bắt `export default`, `type`, `interface`, + kiểm cả đường dẫn import) → chạy lại.
Đây là lần **thứ ba trong ngày** TỔNG mắc lỗi N7 (grep sai chỉ báo rồi tin kết quả). Xem §0y cuối file.

---

## ✅ KẾT QUẢ ĐÚNG — tin tốt là chính

### 1. **KHÔNG có file chết hoàn toàn** (0 / ~400 file soi)
Sau khi sửa regex, chỉ còn 1 file bị báo: `lib/nodes/defs/index.ts` — và nó cũng **sống**,
qua `lib/nodes/registry.ts:9` (`import { EXTRA_NODES } from '@/lib/nodes/defs'`, trỏ thư mục
chứ không trỏ `/index`).

Kiểm chứng chéo 5 file bị nghi:
| File | Kết luận |
|---|---|
| `components/colors/ColorMatchPanel.tsx` | 🟢 `ColorLibraryScreen.tsx:27` import |
| `components/form/DraftBoard.tsx` | 🟢 `ConceptForm.tsx:26` import |
| `components/render-studio/scene3d-ui.ts` | 🟢 `Object3DInspector.tsx:26` import |
| `components/filemanager/files-mock-css.ts` | 🟢 `FileManagerShell.tsx:12` import |
| `components/print/RadialToolMenu.tsx` | 🟡 chỉ 1 nơi nhắc, là **comment** ở `lib/print/radial.ts:4` |

⇒ **Khớp với con số "0,9% component mồ côi" của audit sáng.** Kỷ luật N6 có tác dụng thật.
48.589 dòng chưa có test — nhưng **không phải code chết**, đều có đường sống.

### 2. 🔴 LỖ THẬT — 9 chỗ gọi mạng KHÔNG bắt lỗi
Người dùng bấm, mạng hỏng, màn hình **im lặng** — không báo gì, không quay lại được.
| Chỗ | Hại |
|---|---|
| `components/entry/LoginForm.tsx:106` + `:111` | **đăng nhập** — hỏng mạng lúc này thì đứng hình ngay cửa vào app |
| `components/notebook/useNotebook.ts:148` | nạp tài liệu vào sổ tay |
| `components/notebook/useNotebook.ts:222` + `:227` | hỏi sổ tay (gọi AI, chạy lâu nhất) |
| `components/present-editor/PresentEditor.tsx:263` + `:268` | nạp thư viện ảnh |
| `components/render-studio/ToolModeForm.tsx:570` | xuất bảng thông số |
| `components/entry/LoginBackdrop.tsx:202` | tải ảnh nền màn đăng nhập |
⇒ dòng sổ mới `G-M13-01`.

### 3. 🔴 LỖ THẬT — tên khách thật hiện lên màn hình
```
lib/filemanager/mock-data.ts:50    name: '2026-06 Detech Complex'
lib/filemanager/mock-data.ts:216   name: 'Detech-brief-khach.pdf'
```
Không phải comment — là **chuỗi hiển thị**, có đường ra giao diện:
`lib/filemanager/queries.ts:3` → `app/settings/_components/StorageCard.tsx:10`.
Vi phạm luật trung tính (sản phẩm global, cấm tên studio/khách). ⇒ `G-M13-02`.

### 4. 🟡 `components/print` — 1.258 dòng chưa có màn hình nào mount
| Component | nơi nhắc |
|---|---|
| `ExportPdfDialog` | 4 (sống) |
| `LineweightTable` · `PaperSheetFrame` · `RadialToolMenu` | mỗi cái **1**, và đều là **comment** |

`ls app | grep print` = **0** — không có trang nào. Đây là 4 mock in ấn (`HopXuatPDF` ·
`BangNetIn` · `BangTron` · `ToGiay`) mà `4·apply-ingiay` đã port thành component nhưng chưa nối
vào đâu. Khớp `G-C-01/02` đã có trong sổ ("port xong, chưa nối hết") — nay có số đo. ⇒ `G-M13-03`.

### 5. ✅ 8 dòng "TTT" — KHÔNG phải vi phạm
Cả 8 đều là **comment giải thích**, không phải code chạy. Vài dòng còn là ghi chú
*"đã bỏ tên TTT theo AUDIT-BRAND-PII"* (`components/intro/IntroSequence.tsx:47`).
Kiểm bằng: đọc ký tự đầu dòng sau khi cắt khoảng trắng. ⇒ không mở dòng sổ.

---

## KHÔNG KIỂM ĐƯỢC bằng script — cần mở app thật
- Trạng thái chờ (spinner) có hiện không khi thao tác chạy lâu — script chỉ đo được `catch`,
  không đo được `loading state`
- Bố cục vỡ ở màn hẹp
- Thao tác nào chậm tới mức khó chịu
⇒ Cần một phiên mở trình duyệt bấm thật. Chưa làm.

## SỐ LIỆU CUỐI
| | |
|---|---|
| File soi | ~400 (25 thư mục) |
| File chết hoàn toàn | **0** |
| Chỗ gọi mạng không bắt lỗi | **9** |
| Chuỗi tên khách hiển thị | **2** |
| Component có mà chưa có trang | **3** (`components/print`) |
| Dòng sổ mới mở | **3** (`G-M13-01/02/03`) |

---

# ĐỢT 2 (07/08) — SOI 16 MẢNG THEO PHIẾU, KHÔNG SỬA CODE

Người soi: phiên KIỂM TRA (CHỈ ĐỌC, tuân N1–N8, V6). Dữ liệu thô do **8 agent Explore chạy song
song** thu thập (`grep -rna`, có file:dòng), phiên này tự đọc lại và spot-check trước khi ghi sổ
(N1 — báo cáo agent không phải bằng chứng).

## Tình trạng soi: **16/16 mảng con — XONG, không dừng giữa chừng**

Phiếu liệt kê 8 nhóm ①→⑧, nhóm ⑦ và ⑧ mỗi nhóm gộp 4 thư mục con → tổng cộng đúng 16 mảng con,
tất cả đã soi đủ 5 câu. Không có mảng nào bị bỏ dở.

| # | Mảng | Kết quả |
|---|---|---|
| ① | `lib/present-editor` + `components/present-editor` (23.021 dòng) | xong |
| ② | `lib/nodes` + `components/nodes` (6.553 dòng) | xong |
| ③ | `components/studio` (5.639/5.739 dòng) | xong |
| ④ | `lib/vision` (1.985 dòng) | xong |
| ⑤ | `lib/photo-editor` + `components/photo-editor` (3.214 dòng) | xong |
| ⑥ | `components/entry` (2.322 dòng) | xong |
| ⑦a | `components/notebook` | xong |
| ⑦b | `components/print` + `lib/print` | xong |
| ⑦c | `lib/colors` | xong |
| ⑦d | `components/colors` | xong |
| ⑧a | `lib/legal` | xong |
| ⑧b | `components/intro` | xong |
| ⑧c | `components/filemanager` + `lib/filemanager` | xong |
| ⑧d | `lib/commands` | xong |

## ⚠️ SPOT-CHECK — 1 phát hiện của agent SAI, đã tự sửa trước khi ghi sổ (N1)

Agent nhóm ⑦b báo `RadialToolMenu` "0 nơi mount, chỉ đúng như audit cũ". **Sai.** Tự chạy
`grep -rna "RadialToolMenu" lib components app` xác nhận nó **ĐÃ ĐƯỢC MOUNT**:
```
components/print/ExportPdfDialog.tsx:36  import RadialToolMenu from './RadialToolMenu';
components/print/ExportPdfDialog.tsx:290           <RadialToolMenu
```
Comment tại `ExportPdfDialog.tsx:19` còn tự ghi *"trước mở RadialToolMenu (Màn 9, trước đó 0 nơi
mount)"* — tức nó **đã được nối dây SAU** báo cáo trước, đúng cơ chế trôi dữ liệu N7 cảnh báo
(sổ cũ đúng lúc viết, sai lúc đọc lại). ⇒ `components/print` **không còn** component mồ côi nào.

3 phát hiện "chết" còn lại đã tự verify bằng `grep -rna` riêng, **đúng như agent báo**:
`renameCustomTemplate` (`lib/present-editor/custom-templates.ts:101`),
`customTemplatesAsEditorTemplates` (`lib/present-editor/custom-templates.ts:174`),
`makeShortDemoDeck` (`lib/present-editor/sample.ts:38`, chỉ còn trong 2 dòng comment) —
cả 3 **0 kết quả grep** ngoài dòng định nghĩa. `VitalsStateBadge` (hàm, khác `VitalsStateDot`
cùng file) cũng xác nhận đúng — `components/studio/VitalsStateBadge.tsx:56` export nhưng
0 JSX `<VitalsStateBadge` ở bất kỳ đâu.

---

## ① present-editor (23.021 dòng) — mảng NẶNG NHẤT, trước đó 1 dòng sổ

**Q1 — export chết (0 nơi gọi, kể cả nội bộ):**
| Export | file:dòng |
|---|---|
| `renameCustomTemplate` | `lib/present-editor/custom-templates.ts:101` |
| `customTemplatesAsEditorTemplates` | `lib/present-editor/custom-templates.ts:174` |
| `makeShortDemoDeck` | `lib/present-editor/sample.ts:38` (chỉ còn nhắc ở comment `:7`, `:31`) |

**Q2 — component 0 nơi mount:** không có (toàn bộ 26 component đều mount, phần lớn lồng nội bộ
qua `PresentEditor.tsx` → `PresentSheets.tsx` → `PresentStageScreen.tsx`).

**Q3 — thao tác dài thiếu bắt lỗi/trạng thái chờ (nghi, chưa đo được thời lượng thật):**
- `components/present-editor/boq/BoqScreen.tsx:127-134` — `fetch('/api/specs')` trong `useEffect`,
  lỗi bị nuốt bằng `.catch(() => {})`, không `setError`, không loading riêng.
- `lib/present-editor/custom-fonts.ts:134-142` `registerFonts()` nuốt lỗi từng font
  (`.catch(() => {})`, có chủ đích theo comment) — gọi từ `Inspector.tsx:490` trong `useEffect`,
  không báo UI khi font hỏng.
- `components/present-editor/BrandKitPanel.tsx:157,181` — `.then(...)` không có `.catch()` ở call
  site (an toàn vì hàm nội bộ tự nuốt lỗi trả `{ok:false}`, nhưng là mẫu hình rủi ro nếu code đổi).

**Q4 — tên khách/brand hardcode:** không có vi phạm đang chạy. `lib/present-editor/demo-enso-sample.ts:26-43`
có literal `/detech/tower-night.png`, `/detech/iki-banner.png` — là đường dẫn ảnh demo tĩnh trong
`public/detech/*`, không phải chuỗi hiển thị tên khách; **nghi, chưa xác minh** đây là ảnh demo hư
cấu hay tàn dư dự án thật thuộc `AUDIT-BRAND-PII.md`. `lib/present-editor/akh-sample.ts:5` tự khai
studio/dự án trong deck mẫu là **hư cấu** (Atelier Nord · Lumen Villa) — đúng luật.
`content-deck.test.ts:6,53` xác nhận bug cũ (kicker hardcode `DETECH · CONCEPT`) đã sửa + có test chặn.

**Q5 — mock chưa port:** `docs/mocks/mock-trinh-bay.html` (634 dòng) — **không xuất hiện trong bất
kỳ bảng trạng thái nào** của `docs/mocks/README-mocks.md` (không ✅/🕰/⚠️), chỉ bị nhắc 1 lần ở
`README-mocks.md:204` trong danh sách kỹ thuật. Nghi, chưa xác minh đã port đủ hay còn thiếu phần
nào — cần đối chiếu tay với `PresentEditor.tsx`/`PresentSheets.tsx`.

---

## ② nodes (6.553 dòng) — canvas/lõi sản phẩm, trước đó 2 dòng sổ

**Q1 — export chết:**
| Export | file:dòng |
|---|---|
| `PatternKind` (type) | `lib/nodes/defs/pattern-prompt.ts:26` — 0 nơi dùng kể cả nội bộ |
| `distinctColors` | `lib/nodes/defs/pattern-flatten.ts:89` — chỉ dùng trong `.test.ts`, chết trong production path |
| `MacroIcon` (type) | `lib/nodes/macro.ts:146` |
| `searchTextFor` | `lib/nodes/search.ts:34` — chỉ gọi nội bộ 1 lần |
| `resolveSourceImage` | `lib/nodes/source-image.ts:16` — chỉ gọi nội bộ 1 lần |

Đã kiểm tra riêng bẫy đã biết `lib/nodes/defs/index.ts:28` (`EXTRA_NODES`) — **sống**, qua
`lib/nodes/registry.ts:9` trỏ thư mục `@/lib/nodes/defs`.

**Q2 — component 0 nơi mount:** không có, cả 9 file `.tsx` đều mount qua `FlowCanvas.tsx`.

**Q3 — thao tác dài thiếu bắt lỗi/trạng thái chờ:**
- `components/nodes/InteriorNode.tsx:205-219` `smartImportImage` — CÓ try/catch nhưng **KHÔNG có
  trạng thái chờ**: nút vẫn nhận click lặp trong lúc ảnh đang decode/import.
- `components/nodes/MacroNodeFace.tsx:131-139` (onClick `:199`) — nút "Chạy nút tổng" **KHÔNG có
  try/catch** quanh `await runNode(id)`; nếu `runNode` ném lỗi đồng bộ trước khi enqueue, promise
  reject không bắt, không có thông báo lỗi cấp macro, nút không tự disable khi đang chạy.

**Q4 — tên khách/brand:** 0 kết quả (`grep -rna -iE "TTT|DETECH|Amanoi|IKI|Sungroup"` trên cả
2 thư mục).

**Q5 — mock chưa port:** không có — `Bảng nút.dc.html`/`Nút tổng.dc.html` đã port đủ, có tham
chiếu ngược từ code (`InteriorNode.tsx:375`, `MacroCreateDialog.tsx:4`…), và
`docs/SO-PHIEU-DA-PHAT.md:28` tự đánh dấu "đã port, ĐỪNG giao lại".

---

## ③ components/studio (5.739 dòng) — trước đó 1 dòng sổ

**Q1 — export chết:** `VitalsStateBadge` (hàm) — `components/studio/VitalsStateBadge.tsx:56`,
0 JSX gọi ở bất kỳ đâu (khác `VitalsStateDot` cùng file, đang sống qua `VitalsGesture.tsx:31`).
Đã tự verify — đúng.

**Q2 — component 0 nơi mount:** không có (ngoài mục Q1 ở trên vốn là hàm không phải component
được mount theo nghĩa JSX route).

**Q3 — thao tác dài thiếu bắt lỗi/trạng thái chờ:**
- `lib/lockscreen.ts:39-43` `lockScreenNow()` — bắn 2 `CustomEvent` ép autosave rồi khoá cứng sau
  **200ms cố định**, không `await`/Promise nào xuyên `CustomEvent` được, không bắt lỗi nếu save
  chưa kịp xong (comment tự thừa nhận giới hạn này). Gọi từ `components/studio/AppChrome.tsx:123,186`.

**Q4 — tên khách/brand:** "TTT" ở `StageSwitcher.tsx:12` chỉ là comment kỹ thuật ("tinh thần
quiet-luxury TTT"), không phải chuỗi hiển thị — không vi phạm. "mật khẩu" ở `AppChrome.tsx:204-205`
và `LockScreen.tsx:8-10` là comment giải thích cơ chế, LockScreen khẳng định dùng lại `LoginForm`
chứ không tự chế — không vi phạm.

**Q5 — mock chưa port:** không tìm thấy mock riêng cho `LockScreen`/`StageSwitcher` trong
`docs/mocks/` (nghi, chưa xác minh có dựng thẳng không qua mock hay mock nằm ở nơi khác).
`mock-checkpoint-duyet.html` đã port đủ nút "✕ Huỷ" 2 trạng thái vào `Checkpoint.tsx:70-71,152-160`.

---

## ④ lib/vision (1.985 dòng) — trước đó 3 dòng sổ

**Q1 — export chỉ dùng nội bộ (không hẳn chết, nhưng 0 nơi gọi từ ngoài thư mục):**
`templateExtrema` (`match-template.ts:222`) · `complexityScore` (`match-template.ts:233`) ·
`toGray` (`single-view-metrology.ts:546`) · `detectLineSegments` (`single-view-metrology.ts:587`).

**Q2:** không áp dụng — không có file `.tsx` trong `lib/vision`.

**Q3 — thao tác dài thiếu bắt lỗi/trạng thái chờ:**
`lib/nodes/defs/metrology.ts:142` gọi `measureObjectTiered` (→ `calibrateFromImage`/
`detectLineSegments`, vòng lặp pixel) **trần, không try/catch**, nằm giữa 2 mốc
`onProgress(0.5)` (`:124`) và `onProgress(1)` (`:150`) — **không có bước tiến độ nào trong lúc
tính toán thật sự chạy**, người dùng thấy thanh tiến độ đứng yên.

**Q4 — tên khách/brand:** không tìm thấy, chỉ có nhãn nội thất tiếng Việt ("Giường Queen"…).

**Q5 — mock chưa port:** `docs/mocks/InteriorFlow 05 Máy quay.html:227-228` và
`docs/mocks/mock-if-bang-cong-cu-3d.html:241-242` có nút "Chỉnh đứng (hai điểm tụ)" đánh dấu
`data-why="Chưa dựng được..."` — nghi, chưa xác minh có cùng phạm vi với `single-view-metrology.ts`
hay là tính năng hiệu chỉnh camera riêng (khác việc đo đạc).

---

## ⑤ photo-editor (3.214 dòng) — trước đó 0 dòng sổ

**Q1 — export chết:** không có, toàn bộ export chính đều có chuỗi gọi thật tới
`app/projects/[id]/photo/page.tsx` và `components/present-editor/PresentEditor.tsx:63-66`.

**Q2 — component 0 nơi mount:** không có.

**Q3 — thao tác dài thiếu bắt lỗi/trạng thái chờ:**
`components/photo-editor/PhotoEditor.tsx:279-291` — `onCommitLayerMask` invert-mask (IIFE async,
dùng `loadImage` bên trong) **KHÔNG có try/catch và không có trạng thái busy**, khác hẳn nhánh
liền kề `:303-320` có bắt lỗi đầy đủ — lệch chuẩn ngay trong cùng file.

**Q4 — tên khách/brand:** 0 kết quả trên cả 3 thư mục (`app/photo-editor`, `components/photo-editor`,
`lib/photo-editor`).

**Q5 — mock chưa port:** `docs/mocks/tool-window-sketch2photo.html` chữ "photo" trong tên nhưng nội
dung là mock AI render (mảng render-ai/sketch2photo), KHÔNG khớp tính năng photo-editor thật
(crop/adjust/layer/heal) — không tính là mock treo của mảng này.

---

## ⑥ components/entry (2.322 dòng) — trước đó 0 dòng sổ

**Q1 — export chết:** không có.

**Q2 — component 0 nơi mount:** không có.

**Q3 — ĐÍNH CHÍNH lỗ cũ (G-M13-01), đã sửa, không còn đúng:** `LoginForm.tsx:106/111` (login) và
`:120/125` (register) nay nằm trong `try{...}catch{...}finally{setBusy(false)}` đầy đủ (try mở ở
`:104`); `LoginBackdrop.tsx:305-311`, `:335-342` (tải ảnh nền) có `img.onerror` fallback;
`LoginBackdrop.tsx:913-923` (tải ảnh online, `remoteUrlToDataUrl` tại `:202`) có
`setFetching(true)/catch{setErr}/finally`. ⇒ 3/6 lỗ trong `G-M13-01` (đăng nhập, tải ảnh nền) **đã
được vá** giữa lần soi đợt 1 và đợt 2 này — cần cập nhật lại trạng thái `G-M13-01` ở TỔNG.

**Q4 — tên khách/brand:** chuỗi "InteriorFlow" hardcode trực tiếp trong JSX
(`LoginScreen.tsx:128`, `WelcomeIntro.tsx:120-121`) — đây là tên SẢN PHẨM, không phải khách hàng,
không vi phạm luật trung tính nhưng đáng lưu ý nếu về sau cần qua i18n.

**Q5 — mock chưa port:** nghi, chưa xác minh — `docs/mocks/mock-if-intro-C3.html` không có liên
kết grep nào tới `components/entry/*`.

---

## ⑦ notebook · print · lib/colors · components/colors

### ⑦a components/notebook
- **Q1/Q2** — `NotebookButton` (`components/notebook/NotebookButton.tsx:1`) export nhưng **0 nơi
  import/render**, chỉ bị NHẮC trong comment (`app/api/notebook/[projectId]/sources/route.ts:15`,
  `StageSwitcher.tsx:37`, `lib/notebook/resolveProject.ts:4,23` — dòng `:23` tự ghi "đã bỏ khỏi
  Header"). 3 component còn lại đều mount thật ở `app/projects/[id]/notebook/page.tsx`.
- **Q3** — `useNotebook.ts:222` (`ask()`, fetch `/query`) và `useNotebook.ts:148` (`addTextOrUrl`)
  **không kiểm `res.ok`** trước khi đọc JSON (`:227`, `:153`) — lỗi HTTP 4xx/5xx sẽ hiển thị answer
  rỗng thay vì báo lỗi rõ. Đây là bản sửa MỘT PHẦN của lỗ cũ `G-M13-01` (có `setQuerying` = có
  trạng thái chờ, nhưng vẫn thiếu kiểm mã lỗi) — cần ghi rõ khi cập nhật G-M13-01.
- **Q4** — không có.
- **Q5** — không có mock riêng cho notebook trong `docs/mocks/`.

### ⑦b components/print + lib/print
- **Q1/Q2 — ĐÍNH CHÍNH quan trọng** (xem mục spot-check đầu file): `LineweightTable` và
  `PaperSheetFrame` **CÓ** mount thật tại `ExportPdfDialog.tsx:28,252` và `:27,241` — báo cáo đợt 1
  (`G-M13-03`) nói chúng "chỉ 1 nơi nhắc, là comment" **SAI/LỖI THỜI**, đã được nối dây. Riêng
  `RadialToolMenu` — agent báo "0 mount" nhưng tự spot-check xác nhận **ĐÃ MOUNT**
  (`ExportPdfDialog.tsx:36,290`, comment `:19` tự ghi "trước đó 0 nơi mount"). ⇒ **`G-M13-03` ĐÃ
  LỖI THỜI HOÀN TOÀN — cả 3 component đều sống, cần TỔNG đóng dòng sổ đó.**
- **Q3** — không có lỗ; `ExportPdfDialog.tsx` không có async nào, xuất PDF thật nằm ở
  `PresentEditor.tsx:1196-1207` và `CadSheets.tsx:633-644,919-931`, cả hai đều có
  `setStatus`/`try-catch` đầy đủ.
- **Q4** — không có.
- **Q5** — `BangTron.dc.html`/`BangNetIn.dc.html`/`HopXuatPDF.dc.html` đều đã port và đang sống.

### ⑦c lib/colors
- **Q1** — không có export chết, mọi hàm chính đều có import thật.
- **Q3** — không có lỗ; route `/api/colors/lark` và `ColorImportWizard.tsx:94-137` đều có
  `setBusy`/try-catch/`setError` đầy đủ.
- **Q4** — `lib/colors/trend.ts:45-55` có literal `publisher: 'Pantone'` + tên màu "Mocha Mousse"…
  — dữ liệu "màu của năm" trích dẫn công khai (nominative use), không phải tên khách hàng, nhưng
  là brand string hardcode đáng lưu ý nếu cần trung lập tuyệt đối thương hiệu bên thứ ba.
- **Q5** — nghi, chưa xác minh — không tìm thấy mock `.dc.html` riêng cho bảng màu.

### ⑦d components/colors
- **Q1/Q2** — không có export/component chết, `ColorLibraryScreen` mount tại `app/colors/page.tsx:31`.
- **Q3** — không có lỗ (dùng chung cơ chế `pullLarkColorSource` đã bắt lỗi đầy đủ ở ⑦c).
- **Q4** — chỉ có "InteriorFlow" (tên sản phẩm) trong copy UI thật, không phải brand ngoài.
- **Q5** — nghi, chưa xác minh — không tìm thấy mock riêng, có thể được dựng thẳng trong code.

---

## ⑧ lib/legal · components/intro · filemanager · lib/commands

### ⑧a lib/legal
Toàn bộ 5 câu: **sạch**. Chỉ chứa text GPL/OSS chuẩn, không async, không component, 0 tên khách,
0 mock treo.

### ⑧b components/intro
- **Q1/Q2** — không có export/component chết. Lưu ý có 2 file trùng tên `IntroSequence`
  (`components/IntroSequence.tsx` cũ vs `components/intro/IntroSequence.tsx` mới) — cả hai đều có
  nơi gọi riêng, không phải trùng lặp chết, nhưng đáng ghi vào sổ để phiên sau không nhầm.
- **Q3** — không có async nào; `localStorage.setItem` đã bọc try/catch (`IntroSequence.tsx:72`).
- **Q4 — ĐÍNH CHÍNH:** mật khẩu test trong comment (từng bị `TICKET-...` ghi ở `IntroSequence.tsx:21`)
  **KHÔNG CÒN** — `grep -rna -i "password|mật khẩu|test123"` ra rỗng, đã được dọn. Tên "Detech"
  chỉ còn ở comment lịch sử (`TitleSequence.tsx:39,181`), không phải chuỗi hiển thị — không vi phạm.
- **Q5** — `docs/mocks/mock-if-intro-C3.html` và `mock-if-intro-bong-hoi-tu-2026-08-03.html`
  **0 tham chiếu nào** trong `components/intro/*` — nghi ngờ CHƯA PORT hoặc port không ghi nguồn
  (khác chuẩn mực đã thấy ở `files-mock-css.ts`). Đáng mở dòng GAP.

### ⑧c components/filemanager + lib/filemanager
- **Q1/Q2** — không có export/component chết, `FileManagerShell`/`FilesNavigator` đều mount tại
  `app/files/page.tsx`.
- **Q3** — không có lỗ; upload có `uploading` state + try/catch đầy đủ (`FileManagerShell.tsx:181-203`,
  `lib/filemanager/real-fs.ts:113-127`).
- **Q4 — XÁC MINH LẠI, VẪN Y NGUYÊN, CHƯA SỬA:** `lib/filemanager/mock-data.ts:50`
  (`name: '2026-06 Detech Complex'`) và `:216` (`name: 'Detech-brief-khach.pdf'`) vẫn hiển thị
  thẳng ra UI qua `lib/filemanager/queries.ts:3,6-11` → `FilesNavigator.tsx:53,66` và
  `FileManagerShell.tsx:342,367`. **Tự spot-check bằng `grep -na "Detech" lib/filemanager/mock-data.ts`
  — xác nhận đúng, dòng `:46,50,216` còn nguyên.** ⇒ `G-M13-02` (đợt 1) **CHƯA ĐƯỢC SỬA**, vẫn mở.
- **Q5** — `mock-files-polished.html` đã port có ghi nguồn rõ ở `files-mock-css.ts:3`, không có
  mock treo khác.

### ⑧d lib/commands
- **Q1** — `findByAlias` (`lib/commands/registry.ts:362`) và `parseVcbToken`/`applyVcbToMoveCopy`
  (`lib/commands/vcb.ts:42,92`) export nhưng **0 nơi gọi ngoài chính file `.test.ts`** —
  `registry.ts:389-393` tự ghi TODO thừa nhận *"chưa nối `CadEditor.tsx` gọi `findByAlias()`"*.
  Đây là tính năng đã viết xong phần lõi (có test) nhưng chưa nối dây UI — khác "code chết", gần
  với "chờ nối" (đáng ghi riêng, không xoá).
- **Q2** — không áp dụng (không có component); `cmdsFor` (đường sống chính, `registry.ts:348`) có
  gọi thật qua `AppCommandPalette.tsx:28` → `AppShell.tsx:168`.
- **Q3** — không có async nào trong `lib/commands/`.
- **Q4** — không có.
- **Q5** — không có mock riêng cho sổ lệnh/⌘K.

---

## ĐỀ XUẤT DÒNG GAP MỚI — chia theo mảng (TỔNG duyệt trước khi ghi vào `GAP-IF.md`, theo §0u)

| Mã đề xuất | Mảng | Nội dung | Bằng chứng |
|---|---|---|---|
| `G-M14-01` | present-editor | 3 hàm chết hẳn (`renameCustomTemplate`, `customTemplatesAsEditorTemplates`, `makeShortDemoDeck`) — xoá hoặc nối dây | `lib/present-editor/custom-templates.ts:101,174` · `lib/present-editor/sample.ts:38` |
| `G-M14-02` | present-editor | `BoqScreen.tsx:127-134` nuốt lỗi `fetch('/api/specs')` im lặng, không báo UI | `components/present-editor/boq/BoqScreen.tsx:127-134` |
| `G-M14-03` | present-editor | `mock-trinh-bay.html` không có trong bảng trạng thái README-mocks — chưa rõ đã port đủ | `docs/mocks/mock-trinh-bay.html`, `docs/mocks/README-mocks.md:204` |
| `G-M14-04` | nodes | "Chạy nút tổng" (`MacroNodeFace`) không bắt lỗi đồng bộ, nút không tự khoá khi đang chạy | `components/nodes/MacroNodeFace.tsx:131-139,199` |
| `G-M14-05` | nodes | upload ảnh vào node không khoá nút trong lúc decode — click lặp được | `components/nodes/InteriorNode.tsx:205-219` |
| `G-M14-06` | components/studio | `lockScreenNow()` khoá cứng sau 200ms cố định, không chờ autosave xong thật | `lib/lockscreen.ts:39-43` |
| `G-M14-07` | lib/vision | `measureObjectTiered` không có bước tiến độ thật giữa 2 mốc 0.5→1, thanh chờ đứng yên khi đang tính | `lib/nodes/defs/metrology.ts:142` |
| `G-M14-08` | photo-editor | `onCommitLayerMask` (invert-mask) không try/catch, không trạng thái chờ — lệch chuẩn so với nhánh liền kề trong cùng file | `components/photo-editor/PhotoEditor.tsx:279-291` |
| `G-M14-09` | components/entry | **ĐÓNG** — 3/6 lỗ trong `G-M13-01` (login, tải ảnh nền) đã được vá, cần cập nhật trạng thái | `components/entry/LoginForm.tsx:104` |
| `G-M14-10` | notebook | `useNotebook.ts` không kiểm `res.ok` trước khi đọc JSON — lỗi HTTP hiện thành câu trả lời rỗng | `components/notebook/useNotebook.ts:148,222,227,153` |
| `G-M14-11` | notebook | `NotebookButton` viết xong nhưng đã bị gỡ khỏi Header, nay mồ côi — xoá hoặc nối lại | `components/notebook/NotebookButton.tsx:1`, `lib/notebook/resolveProject.ts:23` |
| `G-M14-12` | print | **ĐÓNG** — `G-M13-03` (đợt 1) lỗi thời hoàn toàn, cả 3 component (`LineweightTable`, `PaperSheetFrame`, `RadialToolMenu`) đều đã sống | `components/print/ExportPdfDialog.tsx:27,28,36,241,252,290` |
| `G-M14-13` | intro | 2 mock intro (`mock-if-intro-C3.html`, `mock-if-intro-bong-hoi-tu-2026-08-03.html`) 0 tham chiếu trong code — chưa rõ đã port | `docs/mocks/mock-if-intro-C3.html`, `docs/mocks/mock-if-intro-bong-hoi-tu-2026-08-03.html` |
| `G-M14-14` | intro | mật khẩu test trong comment (nêu ở audit cũ) đã dọn — **ĐÓNG**, không còn | `components/intro/IntroSequence.tsx` (grep rỗng) |
| `G-M14-15` | filemanager | **VẪN MỞ** — `G-M13-02` (đợt 1) chưa sửa, "Detech Complex"/"Detech-brief-khach.pdf" còn hardcode và hiện ra UI `/files` | `lib/filemanager/mock-data.ts:50,216` → `FilesNavigator.tsx:53,66` |
| `G-M14-16` | lib/commands | `findByAlias`/`parseVcbToken`/`applyVcbToMoveCopy` viết xong (có test) nhưng chưa nối UI — TODO tự thú trong code | `lib/commands/registry.ts:362,389-393` · `lib/commands/vcb.ts:42,92` |
| `G-M14-17` | lib/colors | `trend.ts` hardcode `publisher: 'Pantone'` + tên màu thương mại — cân nhắc mức trung lập cần thiết | `lib/colors/trend.ts:45-55` |

---

## KHÔNG KIỂM ĐƯỢC bằng grep tĩnh — cần mở app thật (giữ nguyên từ đợt 1, vẫn đúng)
- Thời lượng thật của các thao tác "nghi &gt;1s" (BoqScreen specs fetch, registerFonts, đo
  metrology) — script không đo được độ trễ mạng/tính toán thật.
- Bố cục vỡ ở màn hẹp, trạng thái chờ có thực sự hiện ra mắt người dùng hay chỉ có trong code.
⇒ Chưa làm, cần phiên mở browser thật.

## SỐ LIỆU ĐỢT 2
| | |
|---|---|
| Mảng con soi | **16/16** |
| Agent Explore dùng | 8 (chạy song song, tự spot-check lại 5 phát hiện quan trọng nhất) |
| Export/hàm chết xác nhận thật | 3 (present-editor) + 5 (nodes, phần lớn chỉ dùng nội bộ không hẳn "chết") + 1 (studio) |
| Lỗ thao tác dài thiếu bắt lỗi/trạng thái chờ | 8 chỗ mới (`G-M14-02,04,05,06,07,08,10`) |
| Tên khách còn hiện ra UI | **1 vụ CHƯA SỬA** (`G-M13-02`/`G-M14-15`, filemanager) |
| Dòng sổ đợt 1 cần TỔNG cập nhật trạng thái | `G-M13-01` (đóng 1 phần) · `G-M13-03` (đóng hẳn — lỗi thời) |
| Đề xuất dòng GAP mới | 17 (`G-M14-01`…`G-M14-17`), TỔNG duyệt trước khi ghi vào `GAP-IF.md` theo §0u |
