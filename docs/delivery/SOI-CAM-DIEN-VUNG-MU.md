# `soi:cam-dien` — VÁ VÙNG MÙ `components/`

> Làn **SOI-MU** · 05/09 · mốc `13085a6c` · nhánh `nen-checkpoint`
> Vùng ghi: `scripts/soi-cam-dien.mjs` · `scripts/soi-cam-dien.test.ts` · tệp này. Không chạm gì khác.

---

## 1 · VÙNG MÙ CÓ ĐÚNG NHƯ MÔ TẢ KHÔNG — **ĐÚNG**, đo lại tại nguồn

`scripts/soi-cam-dien.mjs:163` (bản cũ) `if (p[0] !== 'lib') return null;` — xác nhận.
Kèm một chỗ thứ hai phiếu không nêu mà cùng gốc bệnh: bảng mồ côi cấp TỆP lọc
`t.startsWith('lib/')` (dòng 340 bản cũ). **Hai chỗ, cùng một giả định.**

⇒ `app/` và `components/` chỉ bao giờ đóng vai **NGƯỜI GỌI**, không bao giờ bị hỏi ngược
*"có ai gọi mày không"*. Nguyên thể dựng trong `components/` mà 0 người import thì **vô hình**.

Đo được ngay khi mở chủ thể: **24 tệp** ở vùng mù, **4.873 dòng** — trong đó
`DongStudioHome.tsx` **900 dòng** và `StageSwitcher.tsx` **462 dòng**, cả hai đã bị thay mà
chưa ai đóng dấu lỗi thời tại chỗ.

### 🔴 NHƯNG CA HIỆU CHUẨN CỦA PHIẾU ĐÃ DỊCH — `components/ui/Icon.tsx` KHÔNG còn mồ côi

Phiếu ghi `grep -rn "glyph={" components app` = **0**. Đo lại 05/09: **6** — nhưng cả 6 nằm
trong chú thích (5 dòng ví dụ trong docstring của chính `Icon.tsx`, 1 dòng ghi chú ở
`BeMatHome.tsx:41`). **Phần "component `<Icon>` chưa từng được cắm" của phiếu vẫn ĐÚNG.**

Cái đã đổi là **cấp TỆP**:

```
components/home/BeMatHome.tsx:43   import { ICON_STROKE } from '@/components/ui/Icon';
```

Đã nằm trong HEAD (`git show HEAD:` xác nhận), cả hai tệp `git status` sạch — không phải làn
nào đang sửa dở. Một làn khác đã cắm **hằng số** `ICON_STROKE` từ tệp đó, kèm ghi chú tại chỗ
là không dùng được `<Icon>` vì lỗi kiểu của primitive.

⇒ Ở **cấp tệp** (câu hỏi máy này hỏi) `Icon.tsx` **có 1 người gọi thật** ⇒ đúng ra không được
kêu. Ở **cấp tên xuất** thì `Icon` vẫn 0 nơi dùng.
**Đó là HAI câu hỏi khác nhau, và máy này chỉ trả lời câu thứ nhất.** Xem §6.

---

## 2 · ĐỊNH NGHĨA "MỒ CÔI" ĐÃ CHỐT

> **Mồ côi** = tệp mã trong `lib/` · `components/` · `app/` mà **không tệp không-phải-test nào
> với tới nó** bằng bất kỳ dạng nào máy dò được (`from` · `import()` động · `require` ·
> `import` lấy hiệu ứng · `new URL(…, import.meta.url)`), sau khi bỏ chú thích.

Giữ nguyên ba luật đã có từ trước, **không đổi**: người gọi phải là NGƯỜI DÙNG chứ không phải
bài kiểm · đường dẫn được **giải thật** (`@/`, `./`, `../`, thiếu đuôi, `index.*`) · dòng chú
thích không phải lời gọi.

### Những gì CỐ Ý KHÔNG TÍNH — và lý do từng loại

| Tha | Số | Vì sao **không phải** thiếu sót |
|---|---|---|
| **Điểm vào App Router** — `page` `layout` `template` `loading` `error` `global-error` `not-found` `default` `route` `middleware` `instrumentation` `sitemap` `robots` `manifest` `opengraph-image` `twitter-image` `icon` `apple-icon`, **chỉ trong `app/`** | **125** | Khung Next gọi theo **QUY ƯỚC TÊN TỆP**, không qua import. "0 nơi gọi" là **đúng bản chất**. Đo thô: 94 `route.ts` + 29 `page.tsx` + 2 `layout.tsx`. Gộp vào là **báo quá tay 5 lần** (149 thay vì 24) — và một máy soi đỏ thứ không sửa được thì chết theo cách tệ nhất: người ta học cách bỏ qua nó. |
| **`*.d.ts`** | 1 | Khai báo kiểu — TypeScript nạp qua `include` của tsconfig, theo bản chất không ai import. (Luật cũ, giữ nguyên.) |
| **`*.test.ts` / `*.spec.ts`** | — | Bài kiểm là **người gọi**, không phải chủ thể. (Luật cũ, giữ nguyên.) |

⚠️ **BẪY TỰ GÂY đã tránh**: `icon.tsx` là tên quy ước của App Router, nhưng
`components/ui/Icon.tsx` thì **không**. Luật vì thế **neo vào `app/`**, không so tên trần toàn
cây — so tên trần là tự bịt mắt ở đúng tệp primitive đang muốn soi. Có test khoá lại (§4 ca ⑤).

⚠️ **Tha thì IN RA kèm lý do**, không lọc im lặng — theo khuôn `soi-tu-dien.mjs`. Người đọc
thấy được máy đã bỏ qua cái gì và vì sao.

### Ba thứ CỐ Ý **không** làm

1. **Không đổi cách đếm phần cũ.** `duocGoi` giữ nguyên (kể cả chỗ nó tính `import type` là
   người gọi — một chỗ hở đã biết, xem §6). Đổi nó sẽ làm số `lib/` nhảy, và lúc đó không ai
   chứng minh được phần tăng đến từ đâu.
2. **Không mở sang cấp tên xuất.** Đó là đất `soi-that.mjs`. Lấn sang là đẻ máy thứ hai cho
   cùng một câu hỏi.
3. **Không xoá, không sửa registry.** Máy **CHỈ IN**.

---

## 3 · TỰ LOẠI TRỪ CHÍNH MÌNH

Máy này quét văn bản và **bản thân nó nằm trong vùng quét** (`GOC_PHU` có `scripts`).
Docstring của nó nêu đích danh hàng chục đường dẫn thật. `laChuThich` đã lọc dòng chú thích,
nhưng đó là **hàng rào mỏng**: chỉ cần một ví dụ viết ở dạng mã sống trong tệp này là một tệp
chết trông như còn sống — máy tự cấp chứng chỉ cho chính mình.

Đây đúng ca đã hỏng **ba lần trong ngày 04/09**: `soi-thao-tac` đọc trúng chú thích của nó ·
mẫu `outline-none` gộp ba cơ chế · máy chẩn đoán `pgrep` tự khớp mình rồi báo *"9 công cụ đồng
bộ đang chạy"* trong một container Linux trống trơn.

⇒ `TU_LOAI_TRU` = { `scripts/soi-cam-dien.mjs`, `scripts/soi-cam-dien.test.ts` }, loại khỏi đồ
thị người-gọi. **Lời khai của máy soi không được tính là bằng chứng.**
Kiểm được: máy chỉ `import` `./frontier-registry.mjs` (một tệp `scripts/`) ⇒ tự loại trừ
**không đổi một dòng nào** của bảng `lib/` — đã chứng minh ở §5.

---

## 4 · BẢNG HIỆU CHUẨN

Chạy máy thật rồi tra danh sách in ra.

| # | Ca | Kỳ vọng | Kết quả | |
|---|---|---|---|---|
| 1 | `components/ui/Icon.tsx` | phiếu: **BẮT** | **không bắt** | 🔴 **premise dịch** — có 1 người gọi thật (`BeMatHome.tsx:43`, `ICON_STROKE`). Máy đúng, phiếu cũ. Thay bằng ca 7–8. |
| 2 | `components/studio/AppChrome.tsx` | không bắt | không bắt | ✅ `AppShell.tsx:34` + `PhotoEditorScreen.tsx:37` import thật |
| 3 | `app/settings/page.tsx` | không bắt | không bắt | ✅ điểm vào App Router |
| 4 | `app/api/chat/route.ts` | không bắt | không bắt | ✅ điểm vào App Router (1 trong 94) |
| 5 | `components/ui/icon.test.ts` | không bắt | không bắt | ✅ bài kiểm không phải chủ thể |
| 6 | `components/render-studio/StringoutCreator.tsx` | không bắt | không bắt | ✅ **0 import tĩnh**, chỉ `dynamic(() => import(…))` ở `RenderIOMenus.tsx:42` — ca `next/dynamic` thật |
| 7 | `components/studio/StageSwitcher.tsx` | **BẮT** | **BẮT** | ✅ thay ca 1 · 462 dòng, đã bị sidebar-router thay 17/08 |
| 8 | `components/studio/VitalsRightEdgeHost.tsx` | **BẮT** | **BẮT** | ✅ tệp **tự khai** *"LỖI THỜI 04/09. BIA MỘ, KHÔNG PHẢI CODE"* |

**Đủ 6/6 ràng buộc của phiếu**, với ca 1 thay bằng 7–8 vì lý do đo được ở §1.

### Test có RĂNG — đã chứng minh bằng hai đầu dò

Một bài kiểm không thể đỏ thì vô giá trị — đúng bẫy `Icon.tsx` từng mắc (*"8 assertion PASS"*
trong khi primitive chưa từng chạy). Nên đã cố tình làm hỏng máy rồi kiểm:

| Đầu dò | Kết quả |
|---|---|
| Gỡ luật tha điểm-vào Next | 🔴 đỏ — `BÁO QUÁ TAY: app/library/ingest/page.tsx là điểm vào App Router` |
| Tắt mẫu ② `import()` động | 🔴 đỏ — `BÁO OAN: máy khai …Render3DModeSkeleton.tsx mồ côi, nhưng heavy-panels.tsx có dòng gọi thật` |

Cả hai đã khôi phục; `node --check` + chạy thật đều xanh sau khôi phục.

### Test **tự tính lại độc lập**, không khoá tên tệp

Danh sách mồ côi là **mục tiêu di động** — năm làn đang chạy cùng cây, một tệp hôm nay mồ côi
mai được cắm là chuyện **đúng**. Test khoá cứng tên tệp sẽ đỏ vì người khác làm đúng việc.
⇒ Với **mọi** tệp máy khai là mồ côi, test tự đi tìm nơi gọi bằng một phép quét **khác và thô
hơn** máy. Rộng hơn ⇒ chỉ bắt được **BÁO OAN**, không bao giờ đẻ báo thiếu.

---

## 5 · SỐ TRƯỚC / SAU — và chứng minh phần tăng đến từ đâu

| | Trước | Sau |
|---|---|---|
| Tệp mồ côi | **19** (1.998 dòng) | **43** (6.871 dòng) |
| — `lib/` | 19 | **19** |
| — `components/` | *(vô hình)* | **23** |
| — `app/` | *(vô hình)* | **1** |
| Tha, in kèm lý do | 1 loại | **2 loại · 126 tệp** |

**Chứng minh phần tăng là do MỞ RỘNG CHỦ THỂ, không phải đổi cách đếm phần cũ:**
chạy bản cũ (`git show HEAD:scripts/soi-cam-dien.mjs`) trên **đúng cây này**, lọc danh sách
`lib/` của cả hai bản, `diff` ⇒ **0 khác biệt, 19/19 dòng giống hệt**.
Tệp tạm dùng để so đã xoá.

Ba nhóm module (🟢 96 sống · 🔵 9 chỉ nội bộ · 🔴 1 kho chưa mở) và khối frontier
(⚡ 0 chưa cắm điện) **không đổi một con số nào**. Mã thoát vẫn **0**.

---

## 6 · MỒ CÔI MỚI TÌM ĐƯỢC — 24 tệp, chia BA LOẠI

> ⛔ **MỒ CÔI ≠ RÁC.** Máy không phân loại hộ và không xoá gì. Phân loại dưới đây là **của
> người**, dựa trên docstring tại chỗ + dấu vết trong repo. Mỗi dòng một lý do.

### (a) CHƯA CẮM — dựng rồi, chưa ai dùng ⇒ **phải cắm** (12 tệp · 1.949 dòng)

| Tệp | Dòng | Lý do |
|---|---|---|
| `components/ui/BeMatNoi.tsx` | 432 | docstring các tệp khác gọi nó *"nguyên thể dùng chung"*; `ThietLapTrang.tsx:22` còn dặn *"không sửa — nó là nguyên thể dùng chung"*. Cùng họ `Icon.tsx`. |
| `components/collab/CuaSoThaoLuan.tsx` | 334 | **Cửa Sổ Thảo Luận** (Hoà chốt 16/08, chặng 3D mode Node) — dựng xong, chưa mount |
| `components/cad/DrawOnPreview.tsx` | 304 | V1 phần C của `SPEC-VIDEO-MAT-BANG.md §1` |
| `components/ui/SoCucBo.tsx` | 232 | tự khai `[marker: soCucBo] … nguyên thể DÙNG CHUNG` |
| `components/ui/VanhTrangThai.tsx` | 220 | tự khai `[marker: vanhTrangThai] … nguyên thể DÙNG CHUNG` |
| `components/nav/NguCanhDuAn.tsx` | 119 | KHỐI NGỮ CẢNH đầu thanh trái — **Hoà chốt 22/08**, chưa cắm |
| `components/ui/MucNenDan.tsx` | 108 | *"một mục trong chuỗi cổng, ba trạng thái (nguyên thể dùng chung)"* |
| `components/cad/RevitSummaryPanel.tsx` | 87 | lớp BIM 2D của mode Chuyên, khai *"additive 100%"* |
| `components/collab/LiveCursors.tsx` | 70 | con trỏ nhiều người — presence |
| `components/ui/HienDan.tsx` | 68 | *"HIỆN DẦN THEO NGHĨA (nguyên thể dùng chung)"* |
| `components/notebook/NotebookButton.tsx` | 51 | nút "Sổ tay dự án" trong Header |
| `components/ui/TruthBadge.tsx` | 24 | vỏ bọc `TruthBadgeView`. ⭐ `lib/ui/truth.test.ts:76` đọc nó bằng **`readFileSync`**, không import ⇒ test xanh mà vỏ chưa bao giờ được mount — **đúng bẫy `Icon.tsx`, lần thứ hai** |

⭐ **Sáu tệp `components/ui/*` tự xưng "nguyên thể dùng chung" mà 0 nơi dùng.** Đây không phải
sáu tai nạn rời rạc — nó là **cùng một cơ chế** với `Icon.tsx`: dựng primitive, viết test khoá
hằng số, đánh dấu xong, **không bao giờ cắm**. Máy này bắt được cả sáu; trước 05/09 không máy
nào thấy.

### (b) ĐÃ BỊ THAY — ⇒ **đóng dấu lỗi thời tại chỗ, đừng bỏ hoang** (11 tệp · 2.917 dòng)

| Tệp | Dòng | Bằng chứng |
|---|---|---|
| `components/home/DongStudioHome.tsx` | 900 | `HomeScreen.tsx:57` *"ĐÃ XOÁ khỏi…"*, `:221` đổi sang `<XuongHome/>` từ 04/09 |
| `components/studio/StageSwitcher.tsx` | 462 | `muc-dieu-huong.ts:41` *"thôi là trục điều hướng duy nhất"* (sidebar-router 17/08) |
| `components/intro/TitleSequence.tsx` | 380 | chỉ còn được nhắc như **tiền lệ phong cách** ở `ProjectSelect.tsx`/`cardFaces.tsx`. ⚠️ intro **hoãn** theo chốt 14/08, không phải rác |
| `components/LoginScreen.tsx` | 289 | bản sống là `components/entry/LoginScreen.tsx` (`HomeScreen.tsx:21`) — **bản gốc thư mục là bản chết** |
| `components/StageSelect.tsx` | 217 | `ProjectSelect.tsx:107` *"THAY cho StageSelect"* |
| `app/files/_components/HaiNgan.tsx` | 172 | **tự khai** *"LỖI THỜI 17/08 tối — KHÔNG CÒN AI MOUNT"* (Hoà đổi Files hai NGĂN → hai TẦNG) |
| `components/settings/StorageSettings.tsx` | 134 | thay bởi `app/settings/_components/PixelSettingsShell.tsx` |
| `components/home/widgets/VitalsPill.tsx` | 87 | **tự khai** *"⛔ LỖI THỜI 04/09 — KHÔNG CÒN ĐƯỢC MOUNT Ở ĐÂU. Đừng cắm lại."* |
| `components/settings/AccountSettings.tsx` | 70 | `AccountMenu.tsx:183` xác nhận `PixelSettingsShell` là bản đang sống |
| `components/settings/AppearanceSettings.tsx` | 63 | như trên |
| `components/studio/VitalsRightEdgeHost.tsx` | 43 | **tự khai** *"⛔ LỖI THỜI 04/09. BIA MỘ, KHÔNG PHẢI CODE"* — khớp chốt D-DR1 |

⭐ **Bốn tệp đã TỰ ĐÓNG DẤU lỗi thời mà vẫn nằm trong cây** — việc đóng dấu làm đúng rồi; máy
này chỉ nói thêm rằng **không còn gì giữ chúng lại**. Quyết định giữ hay bỏ là của người.

### (c) NGHI MÁY ĐO SAI / cần người phán (1 tệp · 7 dòng)

| Tệp | Dòng | Vì sao chưa phán được bằng máy |
|---|---|---|
| `components/site/index.ts` | 7 | **barrel chết**: nó re-export 6 thứ, nhưng mọi nơi gọi đều import **đường sâu** (`@/components/site/dia-diem-client`, `…/NhapViTri`, `…/TomTatDiaDiem`). Máy nói đúng — *không ai import chính barrel*. Nhưng "mồ côi" ở đây nghĩa là **thừa một lối vào**, không phải chết chức năng. Xoá barrel là việc an toàn nhưng **là quyết định của người**, không phải của máy. Cùng dạng với `lib/site/index.ts` và `lib/auth/index.ts` đã có trong bảng `lib/` từ trước. |

---

## 7 · ⑦b CHƯA CHẮC / CHƯA KIỂM

1. 🔴 **VẪN MÙ Ở CẤP TÊN XUẤT — lỗ lớn nhất còn lại.** Tệp được import **cho một hằng số** vẫn
   tính là "có nơi gọi" dù component chính chưa ai dùng. Ca thật là chính
   `components/ui/Icon.tsx`: `<Icon>` 0 nơi dùng, nhưng `ICON_STROKE` có 1 nơi ⇒ **máy này
   không bao giờ kêu nó**. Đó là câu hỏi cấp tên xuất, đất `soi-that.mjs`. **Không lấn** —
   nhưng phải nói thẳng là chưa ai phủ giao điểm này.
2. **`import type` vẫn được tính là người gọi ở cấp TỆP.** Đồ thị cấp MODULE đã tách type-only
   rất kỹ (bản vá 22/08), nhưng `duocGoi` cấp tệp thì không. ⇒ tệp chỉ được mượn **một alias
   kiểu** vẫn thoát khỏi bảng mồ côi. **Cố ý không sửa lượt này** — sửa sẽ làm số `lib/` nhảy
   và mất chứng minh "phần tăng do mở rộng chủ thể". Là việc riêng, nên làm.
3. **Import động qua BIẾN thì grep mù.** `import(duongDan)` với `duongDan` là biến — không mẫu
   tĩnh nào bắt được. Đã dò `next/dynamic` trong repo: **mọi lượt đều dùng chuỗi literal**, nên
   hiện không có ca nào rơi. Nhưng đó là hiện trạng hôm nay, không phải bảo đảm.
4. **Cột "có test" là GỢI Ý HIỂN THỊ, không phải phép đo.** Nó khớp chuỗi tên trần trong tệp
   test (`doc(x).includes(basename)`), nên với tên ngắn/phổ biến (`Icon`, `index`) sẽ **báo
   dư**. Cột này **không tham gia quyết định mồ côi** — chỉ để đọc. Giữ nguyên hành vi cũ.
5. **Chưa mở app.** Toàn bộ kết luận là đọc mã tĩnh. Máy chứng minh **CÓ ĐƯỜNG DÂY**, không
   chứng minh **CÓ NÚT BẤM** — cảnh báo này máy đã tự in mỗi lần chạy, vẫn đúng nguyên.
6. **Chuỗi re-export dài chưa thử tới hạn.** Barrel một tầng thì máy đi đúng (`index.*` được
   giải). Barrel-của-barrel nhiều tầng chưa có ca thật trong repo để kiểm.
7. **Không xét tệp chỉ nạp trong Electron main.** `electron/` được quét với vai **người gọi**,
   nhưng nếu có tệp `components/` chỉ được main process nạp bằng đường không phải import thì
   máy sẽ báo oan. Chưa gặp ca nào; chưa kiểm hết.
8. **Phân loại ba nhóm ở §6 là của NGƯỜI, không phải của máy** — dựa trên docstring tại chỗ và
   dấu vết trong repo. Bốn tệp tự khai lỗi thời thì chắc chắn; số còn lại là suy từ bằng chứng
   văn bản, có thể sai ở ca cá biệt.
9. **Danh sách sẽ đổi.** Năm làn đang chạy cùng cây. Con số 43/19/23/1 là **ảnh chụp lúc mốc
   `13085a6c`**. Bài kiểm cố ý **không** khoá tên tệp nên nó không đỏ khi ai đó cắm điện đúng.

---

## 8 · TỆP ĐÃ ĐỘNG (chưa commit)

```
scripts/soi-cam-dien.mjs          (sửa — mở chủ thể, tự loại trừ, tha có lý do, in theo gốc)
scripts/soi-cam-dien.test.ts      (mới — bài kiểm hiệu chuẩn, tự tính lại độc lập)
docs/delivery/SOI-CAM-DIEN-VUNG-MU.md   (mới — tệp này)
```

`package.json` **không đụng**: `test:sweep` đã glob mọi `*.test.ts`, bài kiểm mới tự được nhặt.

**Nghiệm thu:** `node --check` xanh · `npm run soi:cam-dien` chạy thật exit 0 ·
`sucrase-node scripts/soi-cam-dien.test.ts` xanh · hai đầu dò làm-hỏng-cố-ý đều đỏ đúng chỗ ·
`diff` danh sách `lib/` cũ↔mới = 0.
