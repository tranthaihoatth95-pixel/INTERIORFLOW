# SOI 10 PHIÊN — KIẾN TRÚC HỆ `.idf` ĐO TẠI NGUỒN (17/08)

> Phiên **Đ2**, CHỈ ĐỌC. Mọi con số dưới đây **đo bằng grep/đọc mã**, không trích sổ.
> Phạm vi grep: `lib` · `components` · `app` · `scripts` · `electron`, đuôi `.ts/.tsx/.mjs`,
> **loại trừ** `node_modules` · `.claude/worktrees/` · `.next/`.
> Đối chiếu văn-bản↔code: `npm run soi:that` (chạy 17/08, kết quả ở §6).

---

## 1 · BẢNG ĐO — năm đuôi, đo tại nguồn

| | `.idf` | `.idfp` | `.idfc` | `.ifpack` | `.idfnotes` |
|---|---|---|---|---|---|
| **Là gì** | một DỰ ÁN 2D — mọi sheet + `Doc` + Paper Space | một HỒ SƠ Trình chiếu — mọi deck + Brand Kit chụp | một NỘI DUNG dùng lại — 12 `kind` | gói SAO LƯU ZIP một dự án 2D (bọc `.idf` + ảnh rời) | — |
| **Mã lõi** | `lib/cad/idf.ts` (245 dòng) | `lib/present-editor/idfp.ts` | `lib/cad/idfc.ts` (438 dòng) | `lib/cad/ifpack.ts` | **không có** |
| **Số lần xuất hiện trong mã** | **201** / 59 tệp | **54** / 16 tệp | **85** / 17 tệp | **43** / 12 tệp | **0** |
| **Phiên bản hiện tại** | `IDF_VERSION = 2` (`idf.ts:25`) | `IDFP_VERSION = 1` (`idfp.ts:34`) | `IDFC_VERSION = 3` (`idfc.ts:48`) | `IFPACK_VERSION = 1` (`ifpack.ts:28`) | — |
| **Bảng nâng cấp** | `IDF_MIGRATIONS` **1 bậc THẬT** (`idf.ts:72`) | `IDFP_MIGRATIONS` **1 bậc RỖNG** (`idfp.ts:44`, identity) | `IDFC_MIGRATIONS` **2 bậc** (`idfc.ts:263`) — 1 thật + 1 bump | **KHÔNG CÓ** | — |
| **Chặn file mới hơn app** | ✅ `idf.ts:203` | ✅ `idfp.ts:174` | ✅ `idfc.ts:391` | ❌ | — |
| **Kiểm toàn vẹn** | ❌ | ❌ | ❌ | ✅ sha256/tệp qua `manifest.json` | — |
| **Nhãn nguồn gốc** | ❌ | 🟡 `brandKitSnapshot` (chụp Brand Kit, không phải nguồn gốc) | 🟡 `meta.sourceLibraryId` (`idfc.ts:115`) + `meta.author` | ❌ | — |
| **Phạm vi (scope)** | ❌ | ❌ | ✅ `meta.scope` 4 nấc (`idfc.ts:104`) | ❌ | — |
| **Lỗi import nói được lý do** | ✅ `lastImportIdfError` | ✅ `lastImportIdfpError` | ✅ `lastImportIdfcError` | ❌ (trả `null` trơn) | — |

### 1.1 · Ai ĐỌC · ai GHI — file:dòng thật (đã bỏ tệp `.test.ts`)

**`.idf`**
- GHI: `components/cad/CadSheets.tsx:119` (đĩa, `ban-ve.idf` — `:104`) · `:625` (tải về `project.idf`) · `lib/cad/ifpack.ts:111` (nhét vào ZIP)
- ĐỌC: `CadSheets.tsx:123` (đọc lại xác nhận sau khi ghi) · `:174` (nạp từ đĩa) · `:659` (mở tệp) · `lib/cad/ifpack.ts:193` (phục hồi)
- Dùng KIỂU (`IdfSheetData`) nhưng không đọc/ghi tệp: `backup-diff.ts:21` · `auto-backup.ts:31` · `sheet-migrate.ts:30`
- Bench: `scripts/bench/bench-2d.ts:94,96`

**`.idfp`**
- GHI: `components/present-editor/PresentSheets.tsx:151` (đĩa, `trinh-bay.idfp` — `:136`) · `:487` (tải về `project.idfp`) · `components/present-editor/Toolbar.tsx:439` (nhét ruột vào Gói Hồ Sơ Sống)
- ĐỌC: `PresentSheets.tsx:155` (đọc lại xác nhận) · `:199` · `:503`

**`.idfc`**
- GHI: `components/library/LibrarySheet.tsx:895` (xuất một mục khỏi kệ) · `lib/idfc-import/from-photo.ts:124` (sinh từ ảnh sản phẩm)
- ĐỌC: `components/library/BulkIngestMode.tsx:69` (nhập hàng loạt) · `from-photo.ts:181` (tự kiểm ngay sau khi sinh)
- Kho đích: `lib/library/idfc-store.ts` — localStorage khoá `if.library.idfc.v1`, lưu `StoredIdfc extends ParsedIdfc`

**`.ifpack`**
- GHI: `components/cad/CadSheets.tsx:694` (tải về) · `lib/cad/auto-backup.ts:238` (sao lưu tự động) · `:253` (đúc mốc đầy đủ khi tỉa)
- ĐỌC: `CadSheets.tsx:721` (phục hồi tay) · `auto-backup.ts:152` (dựng lại từ chuỗi sao lưu)

**`.idfnotes`** — **0 nơi đọc, 0 nơi ghi.**

### 1.2 · Vòng đời

- **`.idf`** — sinh ở `CadSheets` (mỗi lần lưu) → ghi `ban-ve.idf` trong thư mục dự án (đĩa là NGUỒN, IndexedDB `interiorflow-sheets` tụt xuống cache, `lib/disk-sync.ts:5`) → đi vào `.ifpack` khi sao lưu → đi vào `.ifdiff.json` dạng chênh lệch entity. **Chết:** không có; file trên đĩa người dùng.
- **`.idfp`** — sinh ở `PresentSheets` → `trinh-bay.idfp` trong thư mục dự án → ruột JSON của Gói Hồ Sơ Sống (`Toolbar.tsx:439`). **Chết:** không có.
- **`.idfc`** — sinh từ ① kệ Thư viện (`LibrarySheet:895`) hoặc ② ảnh sản phẩm (`from-photo:124`) → nhập qua `BulkIngestMode` → **localStorage tầng studio**, KHÔNG có cột DB. **Một chiều, không ghi ngược** (`idfc.ts:35`). **Chết:** xoá theo `meta.code` (`idfc-store.ts:50`), hoặc mất trắng khi người dùng xoá dữ liệu trình duyệt.
- **`.ifpack`** — sinh từ `.idf` + ảnh markup rút ra `assets/` → thư mục sao lưu thứ hai (`CadSheets.tsx:461`) → tỉa theo thang thời gian. **Chết:** `planRetention` xoá, nhưng bất biến "mỗi mốc tự đứng được" bắt đúc bản đầy đủ mới trước khi xoá chuỗi (`backup-diff.ts:9-17`).

### 1.3 · Ràng buộc: máy canh hay chỉ docstring

| Ràng buộc | Ở đâu | Máy canh? |
|---|---|---|
| Ruột phải khớp loại (*"video không được có geom2d"*) | `idfc.ts:334` `bodyError()` | ✅ **máy chặn lúc import**, có test |
| Một chiều — không ghi ngược về `.idfc` gốc | `idfc.ts:35` docstring | ❌ **chỉ docstring** — không có test/lint nào cấm ai đó thêm hàm ghi ngược |
| Bản chèn giữ liên kết bằng FK mềm `specId` | `idfc.ts:37` docstring | ❌ chỉ docstring |
| Ghim phiên bản — nâng mẫu gốc không phá dự án cũ | — | ❌ **không có mã nào**: `.idfc` trong kho không mang số hiệu bản, bản chèn không ghim bản nào |
| `.idfc` không phụ thuộc registry `BLOCKS` của máy đích | `idfc.ts:118` + kiểu tự chứa `IdfcGeom2d` | ✅ ép bằng kiểu |
| Mốc sao lưu tự đứng được | `backup-diff.ts` `planRetention`/`reconstructUpTo` | ✅ có test riêng |
| Toàn vẹn ZIP | `ifpack.ts:172-190` | 🟡 **cảnh báo, không chặn** — cố ý (`ifpack.ts:143`) |

---

## 2 · CÂU ① — CÓ MẤY BỘ MÁY LƯU, KHÁC NHAU CHỖ NÀO

**Đo được: SÁU bộ máy lưu ra tệp, không phải bốn.** Bản đồ đếm thiếu hai.

| # | Bộ máy | Tệp | Phiên bản | Nâng cấp | Toàn vẹn | Nguồn gốc | Phạm vi |
|---|---|---|---|---|---|---|---|
| 1 | `idf.ts` | `.idf` | `idfVersion` = 2 | **1 bậc thật** | ❌ | ❌ | ❌ |
| 2 | `idfp.ts` | `.idfp` | `idfpVersion` = 1 | 1 bậc **rỗng** | ❌ | 🟡 snapshot | ❌ |
| 3 | `idfc.ts` | `.idfc` | `idfcVersion` = 3 | **2 bậc** | ❌ | 🟡 `sourceLibraryId` | ✅ |
| 4 | `ifpack.ts` | `.ifpack` | `packVersion` **ghi mà không ai đọc** | ❌ | ✅ sha256 | ❌ | ❌ |
| 5 | `backup-diff.ts` | `.ifdiff.json` | **KHÔNG CÓ trường phiên bản** (`BackupDiff { sheets }`, `:40`) | ❌ | ❌ | ❌ | ❌ |
| 6 | `ho-so-song/` | `ho-so-<slug>-<ngày>.zip` | `manifest.version: 1` (`types.ts:37`) — **ghi mà không ai đọc** | ❌ | ✅ sha256 | ✅ `provenance.nguon` | ❌ |

Thêm hai lớp lưu **không ra tệp**, mỗi lớp một quy ước phiên bản riêng nữa:
- IndexedDB `interiorflow-sheets`, `DB_VERSION = 1` (`lib/sheets-persist.ts:28-29`)
- localStorage — phiên bản **nhét trong tên khoá**: `if.library.idfc.v1` · `if.materials.pbr.v1` · `interiorflow.units_v1` · … (ít nhất 6 khoá, ba kiểu đặt tên khác nhau)

**Chúng khác nhau ở đâu — bốn trục, không trục nào có hai bộ máy làm giống nhau:**

1. **Phiên bản** — 3 kiểu: trường trong JSON gốc (`idfVersion`/`idfpVersion`/`idfcVersion`) · trường trong `project.json`/`manifest.json` bên trong ZIP · **không có gì** (`.ifdiff.json`). Cộng thêm kiểu thứ tư ở localStorage (nhét vào tên khoá).
2. **Nâng cấp** — chỉ 3/6 có `MIGRATIONS`, và **hai trong ba là bản sao chép nguyên văn khuôn của cái thứ nhất** (`idfc.ts:29` và `idfp.ts:43` đều tự khai là port từ `idf.ts`). Ba hàm `migrate*` gần như giống từng dòng, chỉ khác tên hằng số. Ba hàm `isPlainObject` giống hệt nhau ở ba tệp.
3. **Toàn vẹn** — chỉ 2/6 (hai gói ZIP). Hai cách tính sha256 **viết riêng, không dùng chung**: `ifpack.ts:47 sha256Hex(ArrayBuffer)` và `ho-so-song/manifest.ts:27 sha256Hex(Uint8Array)` — cùng tên hàm, khác chữ ký, hai tệp.
4. **Nhãn nguồn gốc** — `grep DataOrigin|dataOrigin` toàn repo = **0**. Không bộ máy nào mang nhãn nguồn thống nhất; ba bộ mang ba thứ na ná (`author`, `sourceLibraryId`, `provenance.nguon`, `brandKitSnapshot`) không cái nào đọc được bằng một hàm chung.

⇒ **Kết luận đo được: bản đồ nói đúng vấn đề nhưng đếm thiếu.** Không phải "bốn định dạng, bốn bộ máy" mà là **sáu bộ máy tệp + hai lớp lưu trong máy, tám quy ước phiên bản, hai bản sao chép của cùng một khuôn nâng cấp, hai bản sao chép của cùng một hàm băm, và số không nhãn nguồn gốc.**

### 2.1 · Ba lỗ thủng cụ thể, đo được, chưa ai ghi

- **`.ifpack` không có cổng phiên bản.** `packVersion` được ghi (`ifpack.ts:116`) và **chỉ được đọc trong test** (`ifpack.test.ts:53`). `restoreIfpack` (`:150-215`) không hề nhìn tới nó. ⇒ một `.ifpack` do bản IF tương lai sinh ra sẽ được bản hôm nay **phục hồi im lặng**, không cảnh báo — trong khi `.idf` bên trong nó thì lại chặn đúng (`idf.ts:203`). Cổng nằm ở lớp trong, lớp ngoài để ngỏ.
- **`.ifdiff.json` không có trường phiên bản nào cả.** Đây là định dạng của **hạ tầng chống-mất-dữ-liệu** (`backup-diff.ts:9` tự khai *"sai ở đây là mất thật"*). Đổi hình dạng `SheetDiffEntry` một lần là mọi chuỗi sao lưu cũ đọc sai mà không cách nào phát hiện.
- **`IDFP_MIGRATIONS[1]` là identity bump lên v2** (`idfp.ts:45`). Hôm nay không chạy (v1 = v1). Ngày nào `IDFP_VERSION` lên 2, mọi tệp v1 sẽ **được dán nhãn v2 mà không biến đổi gì** — đúng thứ `IDF_MIGRATIONS` sinh ra để chặn. Khuôn được chép, nhưng chép cả chỗ trống.

---

## 3 · CÂU ② — `.idfnotes` LÀ MA: **XÁC NHẬN**

Đo: `grep -rn "idfnotes"` toàn repo (trừ `node_modules` · `.claude/worktrees` · `.next` · `.git`) = **7 lần trong mã, 0 lần là mã thật.**

- **5 tệp sổ**: `docs/IF-KIEN-TRUC.md:157,202` · `docs/PHUONG-AN-CAU-IDF.md:126,132,147` · `docs/PHU-OUT.md:113,119` · `docs/00-CHOT.md:1383,1389` · `docs/memory/*`
- **6 lần trong `scripts/soi-that.mjs`** — nhưng **toàn bộ là chú thích/ví dụ**, dùng chính `.idfnotes` làm bài tự kiểm cho máy soi. Không phải nơi tiêu thụ.
- **0 nơi đọc, 0 nơi ghi, 0 kiểu dữ liệu, 0 hằng số.**

`npm run soi:that` 17/08 tự bắt nó: `👻 .idfnotes  5 tệp sổ · 0 code`.

**Chi tiết đáng ghi:** hình dạng đề xuất của nó (`PHUONG-AN-CAU-IDF.md:126`) là `<project>.idfnotes.json` chứa `IdfFieldNote[]` — cầu nối ArchiNote → IF. Mà **ArchiNote đã HOÃN từ 07/08** (`00-CHOT`: *"archinote chưa code, xử if trước"*). ⇒ đây là con ma có **lý do chết rõ ràng**: nó là định dạng cầu nối tới một app chưa tồn tại và đã bị hoãn. Đề xuất: **khai tử tại chỗ** — đóng dấu ⛔ ngay trên `PHUONG-AN-CAU-IDF.md` và `PHU-OUT.md` (luật "văn bản bị thay phải đóng dấu tại chỗ"), giữ nguyên `ExternalRef.system` làm cửa mở sẵn cho ArchiNote (đã trả trước từ 07/08, không cần định dạng mới).

⚠️ **Nhưng khai tử nó sẽ làm hỏng bài tự kiểm của `soi-that.mjs`** — chính báo cáo P-S2 đã ghi trước rủi ro này (`2026-08-17-P-S2-va-noi-soi-that.md:286`). Phải chọn ca ma thay thế **trước** khi khai tử.

---

## 4 · CÂU ③ — ĐÃ THÀNH CODE ↔ CHỈ TRONG SỔ (10 phiên gần nhất)

**10 tệp mới nhất trong `docs/bao-cao-phien/`**: P-X · P-U · P-T · P-S2 · P-S (17/08) · P-S-soi-3-chang · P-R · P-P · P-O · P-N (16/08).

Đếm chữ "idf" trong 10 tệp đó: **8/10 tệp = 0 lần.** Hai tệp còn lại: P-R nhắc 1 lần, P-P nhắc 1 lần, P-S2 nhắc `.idfnotes` (không phải `.idf`).

Đối chiếu git: lần cuối mỗi tệp lõi được sửa —
`idfp.ts` **31/07** · `ifpack.ts` **27/07** · `backup-diff.ts` **30/07** · `idfc.ts` **08/08** · `idf.ts` **10/08**.

⇒ **Trong 10 phiên gần nhất (13/08–17/08), KHÔNG một dòng nào của bốn tệp định dạng lõi bị sửa.**

| ĐÃ THÀNH CODE | CHỈ NẰM TRONG SỔ |
|---|---|
| `.idfc` v3 + kind `preset` — `idfc.ts:48,263` + `migrateV2ToV3` + test 3 bậc (**08/08**, ngoài 10 phiên) | **Xương sống lưu chung** cho các đuôi (`IF-KIEN-TRUC.md:169`) — 0 dòng mã, 6 bộ máy vẫn rời |
| `.idf` v2 + `Doc.levels` — `idf.ts:25,72` + `levels-idf-v2.test.ts` (**10/08**, ngoài 10 phiên) | **Nhãn nguồn `DataOrigin`** (entry `nhan-nguon-reset`, registry:214, `trangThai:'chua'`) — grep = **0** |
| **Gói Hồ Sơ Sống** `.zip` 3 tầng + manifest sha256 + viewer tự chứa — `lib/ho-so-song/`, **13/08** ✅ trong 10 phiên | **Tầng ③ "JSON máy-đọc để NHẬP LẠI"** (`types.ts:8`) — **không có hàm đọc nào**; gói chỉ ghi ra, chưa bao giờ nhập vào |
| **`.idfc` sinh từ ảnh** — `lib/idfc-import/from-photo.ts:124`, proof Lincoln 327, **14/08** ✅ trong 10 phiên | **Ghim phiên bản mẫu gốc** (ràng buộc 3, `IF-KIEN-TRUC.md:167`) — không mã nào ghim; bản chèn không biết mình theo bản nào |
| **mirror-completion** ghi recipe vào `.idfc` — `chuan-net.ts`, **15/08** ✅ trong 10 phiên | **`.idfnotes`** — 0 code, ma (§3) |
| `soi:that` **bắt được** ma đuôi tệp — `scripts/soi-that.mjs:262`, **17/08** ✅ trong 10 phiên | **Cỡ cửa sổ có vào `.idf` hay không** — P-R nêu 16/08 (`P-R:122`), `00-CHOT:1364` chốt *"cỡ và nấc đều thuộc MÁY MÌNH"* → **`NodeResizer` vẫn ghi `width/height` vào node**, chưa sửa |
| | **`.idfc` là "hai cấp độ cùng một hệ" với `.idf`** (`00-CHOT:410`) — hai tệp **không import nhau**, không chia sẻ một dòng mã nào |

---

## 5 · NĂM PHÁT HIỆN ĐÁNG CHÚ Ý NHẤT

**① `.idfc` sinh từ ảnh mang toàn bộ nhãn nguồn gốc ở NGOÀI schema — và mất trắng khi nhập lại.**
`from-photo.ts:145` nhét khoá `xFromPhoto` (cờ 3 nấc `measured|inferred|verified` từng trường · URL ảnh gốc · model vision · GLB · `reviewStatus: 'draft-pending-review'`) **vào JSON sau khi `exportIdfc` đã chạy xong**. `ParsedIdfc` (`idfc.ts:283`) chỉ có `{meta, body, commerce}` ⇒ `importIdfc` **bỏ hẳn** khoá đó. `idfc-store.ts:19` lưu `StoredIdfc extends ParsedIdfc` ⇒ **món vào kho Thư viện là món đã mất hết vết truy nguồn.** Chú thích `from-photo.ts:144` viết *"importIdfc bỏ qua khoá lạ (kiểm bằng round-trip ngay dưới)"* — nhưng round-trip đó (`:181`) chỉ kiểm **tệp còn mở được**, không kiểm `xFromPhoto` sống sót; test (`from-photo.test.ts:63,87`) đọc `JSON.parse` **thô**, không đi qua `importIdfc`. ⇒ đúng khuôn "test khẳng định đường thoái lui mà không ai khẳng định đường chính" (luật 15/08). **Thứ quý nhất của cả pipeline ảnh→3D — cờ tin cậy — không có chỗ trong định dạng.**

**② Bản đồ nói sai một câu đo được: `.idf` CŨNG có đường nâng cấp thật.**
`IF-KIEN-TRUC.md:170` ghi *"nay chỉ `.idfc` có đường nâng cấp thật"*. Đo: `IDF_MIGRATIONS` (`idf.ts:72`) có `migrateV1ToV2` **biến đổi dữ liệu thật** (sinh `Doc.levels` từ `Base.storey` qua `upgradeDocLevelsFromStorey`), có test riêng `levels-idf-v2.test.ts`. Đúng phải là: **`.idf` 1 bậc thật · `.idfc` 2 bậc (1 thật + 1 bump) · `.idfp` 1 bậc rỗng · `.ifpack` + `.ifdiff.json` + gói-hồ-sơ 0 bậc.** Bản đồ mới lập 16/08 mà đã lệch — đúng rủi ro T tự nêu ở `00-CHOT:1389`.

**③ Hai bộ máy ghi số hiệu phiên bản mà không ai đọc.**
`.ifpack` `packVersion` (ghi `:116`, đọc **chỉ trong test** `:53`) và Gói Hồ Sơ Sống `manifest.version: 1` (ghi `manifest.ts:67`, **0 nơi đọc vì 0 hàm nhập**). Số hiệu phiên bản không ai đọc **tệ hơn không có**: nó tạo cảm giác có cổng chặn, trong khi cổng để ngỏ.

**④ Gói Hồ Sơ Sống tự khai tầng ③ là "để NHẬP LẠI [T5]" nhưng chưa có nửa đường về.**
`lib/ho-so-song/types.ts:8`. `grep` toàn repo: chỉ có `packHoSoSong`; **không có `unpack`/`nhapGoi`/`giaiNen` nào**. Ba tầng thoái lui hôm nay là **ba tầng ĐỌC BẰNG MẮT** (viewer HTML · PDF/PNG/XLSX · JSON thô), không tầng nào IF tự nạp lại được. Đây là hero output đang xếp hàng — nếu đích là "gói là ĐÍCH mới của cùng nguồn" thì thiếu đúng nửa quyết định điều đó.

**⑤ Khuôn định dạng bị CHÉP ba lần, và chép cả chỗ trống.**
`idfc.ts:29` và `idfp.ts:43` đều tự khai port nguyên văn khuôn của `idf.ts`. Hệ quả đo được: **3 bản `isPlainObject` giống hệt** · **3 bản `migrate*` gần giống từng dòng** · **3 bản `lastImportError` + `__setCurrent*VersionForTest`** · **2 bản `sha256Hex` khác chữ ký**. Và chỗ trống cũng được chép: `IDFP_MIGRATIONS[1]` là identity bump — một quả mìn hẹn giờ cho ngày `.idfp` lên v2. ⇒ Đây chính là ca mẫu cho `may-soi-dong-dang` tín hiệu ③ (*cùng chuỗi thao tác ở nhiều nơi*): xương sống chung không phải việc thiết kế mới, nó là việc **rút cái đã bị chép ba lần về một chỗ**.

---

## 6 · `npm run soi:that` — phần liên quan (chạy 17/08)

```
👻 .idfnotes             5 tệp sổ · 0 code
👻 KB-5                  4 tệp sổ · 0 code
✅ 321 · 🟡 10 · ❌ 16 · 👻 2 · 🔇 2 · ⚪ 4
⚠️ 403/507 tệp văn bản KHÔNG rút được định danh — máy MÙ ở đó, phải đọc tay
```
Máy **không** báo lệch nào khác thuộc hệ `.idf`. Nhưng cảnh báo cuối là quan trọng: **79% văn bản nằm ngoài tầm máy** — mọi kết luận ở §2 và §5 đều đến từ đọc tay, không có máy nào canh chúng.

---

## 7 · CHƯA CHẮC — đang suy, chưa đo

1. **`.idfnotes` ngoài repo này.** Chỉ đo trong cây `interiorflow`. Nếu ArchiNote sống ở repo khác (`ttt-tasks`, `PHU-OUT.md:119` nhắc là "không mount được") thì có thể bên đó đã có mã đọc/ghi. Đ2 không truy cập được để kiểm.
2. **Con số 201/54/85/43** đếm **lần xuất hiện chuỗi** (kể cả trong chú thích), không phải "chỗ dùng thật". Bản đồ ghi 192/50/62/41 — Đ2 **không tái hiện được** phương pháp đếm của bản đồ, nên hai bộ số này **không so sánh trực tiếp được**; chỉ chắc chắn thứ tự lớn-nhỏ giống nhau và `.idfnotes` = 0 ở cả hai.
3. **`xFromPhoto` mất khi nhập** — suy từ đọc kiểu `ParsedIdfc` và `StoredIdfc`, **chưa chạy thử** (phiếu cấm dev server). Có thể có đường khác giữ nó mà grep không thấy (ghép chuỗi động, khoá qua biến trung gian).
4. **`.ifdiff.json` "không có phiên bản"** — đo trên `interface BackupDiff` (`:40`) và `BackupEntry` (`:145`). Chưa đọc hết 400+ dòng `backup-diff.ts`; có thể phiên bản được nhét vào **tên tệp** (mẫu `_yyyymmdd-hhmmss.ifdiff.json`, `:165`) như một quy ước ngầm — nếu vậy thì đó là quy ước thứ **chín**, không phải "không có".
5. **"Ghim phiên bản" = 0 mã** — suy từ việc `IdfcMeta` không có trường bản nào và `specId` là chuỗi trơn. Chưa đọc `model.ts` `BlockEntity`/`HatchEntity` đầy đủ để loại trừ khả năng có trường ghim ở phía bản chèn.
6. **Danh sách "sáu bộ máy"** dừng ở tệp sinh ra bởi `lib/`. Chưa quét `electron/` và `app/api/` xem có đường ghi tệp dự án nào khác không.
7. **Đề xuất khai tử `.idfnotes`** là đề xuất, không phải quyết định — nó chạm `soi-that.mjs` (mất ca tự kiểm) nên phải đi cùng phiếu chọn ca thay thế.
