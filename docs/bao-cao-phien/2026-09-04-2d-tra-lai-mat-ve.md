# 04/09 · TRẢ LẠI MẶT VẼ 2D — gỡ vật chắn (ca A) + sửa luật chọn hình học (ca B)

Lane: **02 · WORKFLOW + 04 · DESIGN**. Worktree `agent-a0cc13679eb92a5fa`, nhánh
`worktree-agent-a0cc13679eb92a5fa`. Dev server **3099** (đã tắt, `curl` rc=7). **KHÔNG đụng 3098.**

---

## ⓪ TIỀN ĐỀ — cả hai ĐÚNG, tái hiện được bằng số

| | Phiếu ghi | Đo lại trên app thật (1600×900) |
|---|---|---|
| Ca A | 439/5546 điểm bị hộp TRONG SUỐT của `AppShell` nuốt | **439/5546 (7,9%)** — khớp từng con số |
| Ca B | bấm lòng ⇒ "Chưa chọn"; bấm biên ⇒ "1 đối tượng" | `chonOLong=false · chonOBien=true` — khớp |

⓪b **MỐC**: `f43de304` lệch `origin/integration/2026-09-04` **221 commit**, cây SẠCH,
`merge-base --is-ancestor` rc=0 ⇒ `merge --ff-only` → **`e8285bb7`**. Làm trước khi đọc hết phiếu,
đúng cảnh báo sáu-lane-lệch.

Không có tiền đề nào phải bác lượt này.

---

## ① CA A — 439 → **0**

### Gốc bệnh: BA hộp bố cục lồng nhau, cả ba đều bắt chuột

Không phải một chỗ như phiếu tưởng — bóc xong lớp ngoài thì lớp trong lộ ra, phải bóc ba lượt:

| # | Sửa ở | Trước | Sau |
|---|---|---|---|
| ① | `components/studio/AppShell.tsx:186` — ổ toolbelt | `pointer-events-auto` | `pointer-events-none` |
| ② | `components/ui/StageToolbelt.tsx:88,92` — hộp cột | (mặc định auto) | root `none` + `<ToolbarBar style={{pointerEvents:'auto'}}>` |
| ③ | `components/cad/CadToolbelt.tsx:56` — hộp bọc StageToolbelt | `pointerEvents:'auto'` | `pointerEvents:'none'` |

Kèm hai chỗ **bật lại** cho phần nhìn thấy được, nếu quên là dock thành câm:
`StageToolbelt.tsx` `panel` (cửa duyệt) `pointerEvents:'auto'` · `CadToolbelt.tsx` `PaperToolbelt` root
`pointerEvents:'auto'` (nhánh Paper — dễ sót nhất, nó không đi qua đường Model).

**Luật rút ra, đã ghi tại chỗ**: *hộp chỉ để BỐ TRÍ thì không bắt chuột; phần tử THẬT SỰ bấm được tự
bật `pointer-events:auto`. Khoảng né phải nằm NGOÀI vùng bắt chuột.*

### Đo từng bước (cùng máy, cùng khung nhìn)

```
439  →  11  (sau ①)  →  2  (sau ②)  →  0  (sau ③)
```

11 → 2 **không phải do sửa mã** mà do **vá bộ phân loại của chính máy đo** — xem §④.

### Bốn màn kia — ĐO, không suy

Đây là câu phiếu bắt trả lời, và tôi **không** trả lời bằng lập luận "chỉ 2D dùng ổ toolbelt".
Đã vá `soi-cong-cu-chet` để nó **đếm riêng số phần tử bấm-được đang `pointer-events:none`** — đúng
chỗ mù của H5 (nó *bỏ qua* loại này, nên một cú sửa lỡ tay làm cả cụm nút chết sẽ khiến H5 báo
"0 ca" một cách sạch-giả). Kết quả trên **8 màn / 358 phần tử**:

```
ℹ️ phần tử bấm-được đang `pointer-events:none`:
     [3D] 2 — Undo (Ctrl+Z) · Redo (Ctrl+Shift+Z)
```

⇒ **Home · Files · Thư viện · Bảng việc · Cài đặt · 2D · Trình chiếu: 0 phần tử bị vô hiệu.**
Hai ca ở 3D là nút Undo/Redo ở trạng thái không dùng được — **không dính lượt này** (tôi không
chạm `components/three/**`). H5 vẫn giữ **3 ca bị-che**, y hệt lúc đo baseline sau merge, không
ca nào ở vùng tôi sửa.

Không có đánh đổi nào phải khai: ổ `toolbelt` của `AppShell` **chỉ có đúng một nơi truyền vào**
(`CadStageScreen.tsx:144` → `<CadToolbelt/>`), `grep "toolbelt="` toàn repo = 1 dòng.

---

## ② CA B — bấm giữa lòng vùng tô chọn được nó

### Cách sửa: **HAI VÒNG, thứ tự là phần quan trọng nhất**

`lib/cad/query.ts` `hitTest(doc, world, tolMm, opts?)`:

- **vòng ① BIÊN** — mọi entity, gần nhất trong dung sai thắng. **Giữ nguyên từng dòng luật cũ.**
- **vòng ② LÒNG** — *chỉ chạy khi vòng ① không bắt được ai*, và **chỉ xét `hatch`**.

### Thứ tự ưu tiên khi vùng tô phủ lên vật khác — và VÌ SAO

**Biên thắng lòng.** Khoảng cách tới *lòng* một vùng tô luôn bằng 0; gộp chung một vòng thì vùng
tô **thắng mọi thứ nó phủ lên** — bấm vào một đường nằm trong phòng sẽ chọn phải cái nền. Xếp lòng
sau biên thì mặt nền chỉ nhận cú bấm rơi vào **chỗ trống** — đúng trực giác "cái gì ở trên thì bắt
trước". Test ca [3] khoá đúng điều này (bấm lên đường trong lòng nền ⇒ ra ĐƯỜNG).

**Vùng tô lồng nhau → lấy DIỆN TÍCH NHỎ NHẤT.** Không phải luật mới: đúng luật `pickHatchFace`
(`lib/cad/hatch.ts` §4, *"ưu tiên vùng trong cùng khi có phòng lồng phòng"*) đang chạy cho lệnh
HATCH. Hai chỗ cùng một câu hỏi thì phải cùng một câu trả lời — nếu không, người dùng **tô** được
vùng nhỏ nhưng **bấm** lại trúng vùng to. Bằng diện tích thì `<=` cho entity đứng SAU trong
`doc.entities` thắng (nó là cái được vẽ sau, tức cái đang nhìn thấy ở trên).

**Chỉ `hatch`, cố ý hẹp.** `rect`/`polyline closed` KHÔNG chọn được bằng lòng — đúng thói quen
AutoCAD (đường khép kín vẫn là ĐƯỜNG; muốn bắt cả mặt thì tô nó). `room`/`zone` để ngoài lượt này
vì chúng phủ gần hết bản vẽ; mở ra là đổi hành vi ở **mọi** cú bấm vào chỗ trống — việc riêng, cần
đo riêng.

### Cờ `pickInsideFill` — MẶC ĐỊNH TẮT, và đây không phải sự rụt rè

`hitTest` còn là mắt của cả họ lệnh sửa hình: TRIM · EXTEND · FILLET · CHAMFER · BREAK · JOIN ·
EXPLODE · LENGTHEN · OFFSET · DIM (đo được: 14 nơi gọi trong `CadCanvas.tsx`). Chúng chỉ làm việc
với LINE/ARC. Trả cho chúng một vùng tô vì người dùng bấm nhằm vào lòng phòng là đổi câu
*"chưa trỏ trúng gì"* thành *"đối tượng này không hỗ trợ"* — tệ hơn, và không ai xin.

⇒ Bật cờ ở **đúng ba đường CHỌN**: `CadCanvas.tsx:1177` (chọn bằng chuột) · `:2320`
(`needSelection`, dùng bởi MOVE/COPY/ROTATE…) · `:917` (ống hút MATCHPROP — nó cũng là một phép chọn).

### Ca `SOLID` — **DỰNG THẬT**, không suy từ mã

Đây là ô còn trống lượt trước. `lib/cad/hit-test-long-vung-to.test.ts` ca [2] dựng **ba** vùng tô
khác nhau và bấm giữa lòng từng cái:

| Dữ liệu | Kết quả |
|---|---|
| `{ pattern:'SOLID', solid:true }` — khai tường minh | ✅ chọn được |
| `{ pattern:'ANSI31', patternScale:1 }` — nét gạch | ✅ chọn được |
| không `pattern`, không `solid` — poché tường dữ liệu cũ | ✅ chọn được |

**19 khẳng định, 0 fail**, gồm cả đa giác chữ L không lồi (điểm ở góc LÕM phải trả `null` — chứng
minh không bắt theo khung bao), lớp ẩn/khoá, và vùng tô 2 đỉnh (dữ liệu hỏng, không được sập).

Bấm ngoài vùng tô vẫn bỏ chọn (ca [1]); quây khung không đụng tới (`idsInRect` không sửa dòng nào).

### [Đ2] Dời nhà, không đẻ bản thứ hai

`pointInPolygon` + `polygonArea` **đã có** ở `lib/cad/hatch.ts` (6 nơi dùng). Nhưng `hatch.ts`
`import { entSegments } from './query'` ⇒ để nguyên là vòng import. **Dời xuống `lib/cad/model.ts`**
(tầng dưới cùng cả hai đã nhập) và `hatch.ts` **xuất lại** — 6 nơi nhập từ `./hatch` không sửa dòng
nào. Bản chép riêng ở `lib/cad/label-placer.ts:248` **cố ý không đụng** — nợ cũ, trộn vào lượt này
là trộn hai việc.

---

## ③ LUẬT PASS — chuỗi đầu-cuối trên app thật

`scripts/nghiem-thu-ban-lam-viec/chon-long-vung-to-song-sot.mjs` —
`launchPersistentContext` trên hồ sơ đĩa, đọc thẳng IndexedDB `interiorflow-sheets`
khoá `<uid>::/cad-editor::<pid>`, **không `reload()`**, **không `newContext()`**.

```
tô vùng → bấm GIỮA LÒNG (963,350) → trục phải báo "1 đối tượng" → Delete
IDB trước khi xoá : {"rect":1,"hatch":1}
IDB trước khi đóng: {"rect":1}
── ĐÓNG HẲN trình duyệt, mở lại trên CÙNG hồ sơ đĩa ──
IDB sau khi MỞ LẠI: {"rect":1}
```

✅ chọn được đúng 1 · ✅ vùng tô 1 → **0** sau khi tắt máy vào lại · ✅ hình chữ nhật biên còn
nguyên 1 → 1 (**xoá đúng vật, không xoá lây**).

**Đối chứng (`--tu-kiem`)**: cùng chuỗi nhưng bấm ra **chỗ trống** rồi cũng Delete ⇒ chọn 0 ⇒ vùng
tô **CÒN 1 → 1**. Hai thế giới khác nhau ⇒ phép đo không thoái hoá.

Ảnh: `docs/delivery/anh-duyet-mat/2d-cham-toi-duoc/` — `2d-bam-giua-long.png` ·
`2d-doi-chung-cho-trong.png` · `2d-mat-ve.png` (`git check-ignore` rc=1 cả ba).

---

## ④ CA D — vá chỗ mù của luật H5

### Bộ chọn: thêm `canvas`

`scripts/soi-cong-cu-chet.mjs` `DO_TRONG_TRANG.CHON` chỉ liệt các thẻ điều khiển HTML ⇒ H5
**không bao giờ xét mặt vẽ**. Con số "0 ca ở 2D" của lượt trước là **0 vì MÙ, không vì sạch**.

**Chứng minh vá không suông** — hiệu chuẩn riêng cho nhánh mới, phủ một tấm **TRONG SUỐT trọn mặt
vẽ** (đúng loại lỗi làm cả mặt vẽ chết mà mắt không thấy gì):

```
✅ HIỆU CHUẨN trên MẶT VẼ [2D] 1132×712: thường 1 → khi bị che 28 → gỡ che 1
```

### Số mới trên 2D: **0 ca** — và đó là con số ĐÃ QUA hai lần sửa của chính máy

Chạy lần đầu sau khi thêm `canvas`, H5 báo **1 ca ở 2D**: tâm mặt vẽ bị card trạng-thái-rỗng
*"Gõ W ↵ để vẽ tường ngay tại chỗ…"* (`CadEditor.tsx:806`) đè. Card đó **phủ trọn `inset:0`, cố ý**,
chạm một cái là tự đóng. Đo ở đúng khoảnh khắc đó thì H5 kêu đỏ **vĩnh viễn về một thứ đúng theo
thiết kế** — đúng cách ba máy soi đã chết trong tuần. ⇒ Sửa **máy**, không nới luật: H5 nay bấm
đúng nút người dùng sẽ bấm (*"Vẽ ngay"*) rồi mới đo, tức **đo ở trạng thái làm việc, không ở trạng
thái chào**.

⇒ **H5 sau khi vá: 3 ca / 8 màn / 358 phần tử — 1 ở 2D, 2 ở 3D.** Ca 2D là *"Markup" (1568,716)
bị `button.pe-panel-toggle "Mở bảng kiểm"` (1586,42,14×826) đè* — **nợ có sẵn, không phải mặt vẽ**,
và không do lượt này (tôi không chạm `components/review/**`).

### Ranh giới đã ghi vào docstring, để lượt sau không rải lưới vào H5

H5 hỏi *"tâm có bị đè không"*; `mat-ve-2d-cham-toi-duoc.mjs` hỏi *"đứng ở điểm này thì cú bấm rơi
vào ai"*. Rải lưới trong H5 sẽ báo đỏ mọi điểm rơi vào **dock kính** — thứ đã chốt từ 03/08 — và
muốn lọc thì phải chép sang bộ phân loại *thấy-được ↔ trong-suốt* vốn đã nằm ở máy kia. **Hai câu
hỏi, hai máy, không gộp.**

### Vá thêm hai lỗ của bộ đo cũ (cả hai đều là "máy soi báo quá tay")

1. **`trongSuot()` leo tối đa 4 tầng tổ tiên** — số 4 chọn bừa ⇒ một chip nằm sâu 5-6 tầng trong
   thanh công cụ KÍNH (nền ở tầng ngoài) bị đọc thành "hộp trong suốt". **11 điểm báo nhầm**, toàn
   bộ ở `y 666–750`, tức nằm trong hai hàng dock **hiện rõ trên màn**. Sửa: biên dừng là **tổ tiên
   chung gần nhất với `<canvas>`** — dưới biên là "đồ của lớp phủ" (nó tự sơn thì người dùng thấy),
   trên biên là nền của cả app (tính vào thì **mọi** thứ đều "thấy được" ⇒ hiệu chuẩn thoái hoá).
2. **`trongSuot` ghi cờ theo phần tử ĐẦU TIÊN chạm phải** ⇒ một `div` có nền chỗ này mà rỗng chỗ kia
   bị dán nhãn "thấy được" cho cả cụm, số tổng và bảng thủ phạm lệch nhau, chỗ hở không tra được là
   của ai. Nay đếm **theo ĐIỂM** (`soTrongSuot`) + in **toạ độ thật tối đa 12 điểm hở** kèm hộp/nền/con.
   Chính khối này chỉ ra thủ phạm ② và ③ của ca A.

---

## ⑤ HIỆU CHUẨN — gỡ dây phải ĐỎ, cắm lại phải XANH

| Ca | Gỡ dây ở đâu | ĐỎ | Cắm lại XANH |
|---|---|---|---|
| **A** | `AppShell:186` đổi ngược về `pointer-events-auto` | che trong suốt **0 → 430**, thủ phạm in đúng tên `div.pointer-events-auto`, dải `x 470–1562 · y 666–822` | 430 → **0** |
| **B** (lib) | `query.ts:418` thay bằng `if (true) return bestId` | test **9 ok / 10 FAIL** | **19 ok / 0 fail** |
| **B** (app thật) | như trên | chọn 0 · `hatch` 1 → **1** (không xoá được) | chọn 1 · `hatch` 1 → **0** |
| **H5 canvas** | tự chèn tấm phủ trong suốt trọn mặt vẽ | 1 → **28** | gỡ → **1** |
| **H5 nút** | tấm phủ lên một nút lành | 0 → **1** | gỡ → **0** |

Phân biệt giữ đúng: **FAIL** (khẳng định sai) ≠ **LỖI** (hạ tầng ngã ⇒ không kết luận) — cả hai bộ
đo in riêng hai con số. Không có ca nào "đỏ ở mọi thế giới" (hiệu chuẩn thoái hoá): lượt đối chứng
của ca B và số 430-vs-0 của ca A đều chứng minh phép đo **phân biệt được hai thế giới**.

---

## ⑥ VERIFY — tách lệnh, rc riêng

| Lệnh | rc | Kết quả |
|---|---|---|
| `npx tsc --noEmit` | 0 | 0 lỗi |
| `npm test` | **0** | 0 fail |
| `npm run soi:frontier` | 0 | **0 LỆCH** · 👁1 · ✅77 · ⬜56 |
| `npm run soi:cong-cu-chet` | 0 | **40 ca** (H1 39 · H2 0 · H3 0 · H4 1) |
| `npm run soi:hinh-hoc` | 0 | **32 ngoài thang** — giữ mốc |
| `npm run soi:tu-dien` | 0 | **322 chỗ chữ trần** — giữ mốc |
| `git status --short` | — | sạch sau commit |
| `curl localhost:3099` | **7** | server đã tắt |
| CSDL repo chính | — | `User 1 · Project 4 · Flow 5 · Member 3 · File 2` — **khớp mốc sạch** |

🔧 **Một mốc phiếu ghi lệch, đã đo lại**: phiếu ghi công-cụ-chết **41 ca**; baseline **ngay sau khi
ff-merge 221 commit, trước khi tôi sửa dòng nào** đã là **40**. Số 41 là của cây cũ hơn. Không phải
lượt này làm giảm.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- **Chỉ Chromium 1194** (`/opt/pw-browsers`). Safari/Firefox là **suy**, không đo. `pointer-events`
  và `elementFromPoint` là chuẩn lâu đời nên rủi ro thấp, nhưng chưa ai chạy.
- **Chỉ khung nhìn 1600×900.** Ở khổ hẹp, hộp toolbelt đổi kích thước ⇒ dải hở đổi theo; **con số 0
  chưa được kiểm ở khổ khác**. Đây là chỗ dễ tái phát nhất.
- **Bàn phím thuần: CHƯA KIỂM.** Ca B đo bằng chuột. Chọn-bằng-bàn-phím trong 2D thì `hitTest`
  không phải đường vào, nên tôi **không có căn cứ** nói nó tốt lên hay xấu đi.
- **Trình đọc màn hình: chưa thử.** Mặt vẽ là `<canvas>`, vốn đã không có ngữ nghĩa cho AT — lượt
  này **không cải thiện và cũng không làm tệ đi** phần đó.
- **`prefers-reduced-motion`: không liên quan**, lượt này 0 dòng chuyển động.
- **H5 chỉ xét TÂM.** Số "0 ca ở 2D" **không** có nghĩa mặt vẽ sạch ở mọi điểm — câu đó do
  `mat-ve-2d-cham-toi-duoc` trả lời (0/5546 điểm), và nó cũng chỉ quét **lưới 12px**, không phải
  từng pixel.
- **Ca B: chỉ `hatch`.** Vùng tô do `room`/`zone` vẽ ra trên màn **vẫn không chọn được bằng lòng** —
  cố ý, đã khai ở docstring, nhưng người dùng có thể coi đó là cùng một thứ.
- **Điểm đối chứng của bộ PASS** (85%/85% = `1416,727`) rơi vào **vùng dock**, không phải mặt vẽ
  trống. Khẳng định *"vùng tô sống sót"* vẫn đúng, nhưng nó **không** chứng minh thêm được
  "bấm chỗ trống trên mặt vẽ thì bỏ chọn" — điều đó do test đơn vị ca [1] gánh.
- **Hai hộp `pointer-events:none` mới thêm chưa được soi bởi máy nào.** Nếu lượt sau có ai cắm một
  `toolbelt` khác vào `AppShell` mà quên tự bật `auto`, **không máy soi nào báo** — chỉ có H5 (cần
  `--cham` + dev server) mới thấy, và nó chỉ thấy khi phần tử đó nằm trong bộ chọn.

## ⑦c HẠN DÙNG KẾT LUẬN

- **"439 → 0" chết khi đổi CHIỀU CAO thanh công cụ hoặc đổi cấu trúc `CadToolbelt`.** Con số 0 đến
  từ *ba* hộp cùng nhả chuột; thêm một lớp bọc mới ở giữa (dù chỉ để canh lề) là **hộp thứ tư**, và
  nó sẽ bắt chuột theo mặc định. `marginBottom: 34` trong `CadToolbelt.tsx:70` vẫn còn — nó **không
  còn hại** vì mọi hộp cha đã `none`, nhưng nó vẫn là **nguồn của cả dải hở**: ai gỡ một dòng
  `pointer-events:none` nào là dải đó sống lại y nguyên.
- **"0 phần tử `pointer-events:none` ở 7 màn" chết ngay khi có ai thêm lớp phủ mới** — đó chính là
  lý do con số này nay được IN RA mỗi lần chạy H5, để so trước/sau.
- **Luật chọn của ca B chết nếu `room`/`zone` được mở ra chọn-bằng-lòng** — lúc đó thứ tự
  "biên trước, lòng sau, nhỏ nhất thắng" phải tính lại, vì `room` phủ gần trọn bản vẽ.
- **Ranh giới "H5 chỉ xét tâm"** chỉ đúng chừng nào dock còn nổi trên mặt vẽ (chốt 03/08). Nếu dock
  đổi sang neo ngoài canvas thì rải lưới trong H5 lại thành hợp lý.
- **`--vien-mo`/token không đụng lượt này**; kết luận không phụ thuộc đợt màu đang chạy.

---

## Tệp đụng

**Sửa**: `components/studio/AppShell.tsx` · `components/ui/StageToolbelt.tsx` ·
`components/cad/CadToolbelt.tsx` · `components/cad/CadCanvas.tsx` · `lib/cad/query.ts` ·
`lib/cad/model.ts` · `lib/cad/hatch.ts` · `scripts/soi-cong-cu-chet.mjs` ·
`scripts/nghiem-thu-ban-lam-viec/mat-ve-2d-cham-toi-duoc.mjs`

**Mới**: `lib/cad/hit-test-long-vung-to.test.ts` ·
`scripts/nghiem-thu-ban-lam-viec/chon-long-vung-to-song-sot.mjs` ·
`docs/delivery/anh-duyet-mat/2d-cham-toi-duoc/` (3 ảnh)

**Không đụng** (vùng lane khác): `components/home/**` · `lib/home/**` · `app/page.tsx` ·
`scripts/nghiem-thu-g2-hanh-trinh.mjs` · `docs/delivery/JOURNEY-MATRIX.md` ·
`docs/delivery/SHIP-BLOCKERS.md`.
