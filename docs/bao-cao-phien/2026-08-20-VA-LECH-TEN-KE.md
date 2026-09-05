# 20/08 — VÁ LỆCH TÊN KỆ ↔ KHO (`cad-kyhieu`)

## ⓪ TIỀN ĐỀ — xác nhận / bác bỏ

| Tiền đề của phiếu | Kết quả kiểm |
|---|---|
| Kệ khai `['Cửa 1 cánh 800','DOOR-S-800','block']` (`shelves.ts:167-169`) | ✅ ĐÚNG |
| Kho có `id:'doorRoom'`, name `'Cửa mở 800 (cửa phòng)'` (`furniture.ts:607`) | ✅ ĐÚNG |
| Resolver khớp theo TÊN (`library-item-resolve.ts:76`), mã không có bảng nối | ✅ ĐÚNG — `grep DOOR-S-800` toàn repo = 0 nơi tra hình |
| **"3/6 món đầu hỏng"** | 🔴 **BÁC — đo lại: 4/12 hỏng, và chỉ 2/6 nằm trong nửa đầu.** Lane soi 6/12 nên vừa đếm thiếu vừa đếm lệch. Con số đúng ở §1. |
| Vùng lane đang chạy | ✅ không đụng file nào trong danh sách cấm |

**Mở rộng vùng ghi (khai thẳng):** phiếu liệt kê 5 đường dẫn được ghi, không có
`components/library/LibrarySheet.tsx`. Nhưng việc ③ (món chưa có phải hiện MỜ + `aria-describedby`)
**chỉ sống được ở tầng vẽ thẻ**, mà thẻ nằm trong tệp đó. Đã sửa, giới hạn đúng khối `<button className="it">`.
Không đụng gì khác trong tệp.

---

## ① BẢNG ĐỐI CHIẾU ĐẦY ĐỦ — 12/12 món, không lấy mẫu

Đo bằng chính `resolveLibraryItem` + manifest THẬT trên đĩa (46 `BLOCKS` · 54 block `.dxf`).

| # | Mã | Tên trên kệ | TRƯỚC vá | Kho thật có gì | SAU vá |
|---|---|---|---|---|---|
| 1 | `DOOR-S-800` | Cửa 1 cánh 800 | 🔴 **NULL** | `doorRoom` "Cửa mở 800 (cửa phòng)" · w 800 | ✅ đúng món |
| 2 | `DOOR-D-1600` | Cửa 2 cánh 1600 | ⚠️ gần đúng | `doubleDoor` "Cửa 2 cánh" · w 1600 | ✅ **đúng món** (hết cờ gần-đúng sai) |
| 3 | `WIN-SL-1800` | Cửa sổ trượt | ✅ | `slidingWindow` · w 1200 | ⚠️ gần đúng *(kho 1200 ≠ 1800 — khai thật)* |
| 4 | `SOFA-3S` | Sofa 3 chỗ | ✅ | `sofa3` | ✅ |
| 5 | `TBL-D6` | Bàn ăn 6 ghế | ⚠️ gần đúng | `dining6` "Bàn ăn 6" | ✅ **đúng món** |
| 6 | `BED-160` | Giường 1m6 | 🔴 **NULL** | `bedD` "Giường đôi" · **w = 1600** | ✅ đúng món |
| 7 | `WC-WH` | Bồn cầu treo | ⚠️ | `toilet` "Bồn cầu" — kho chưa có bản TREO | ⚠️ gần đúng *(giữ, đúng sự thật)* |
| 8 | `LAV-CT` | Lavabo bàn đá | ⚠️ | `lavabo` — kho chưa phân kiểu đặt | ⚠️ gần đúng |
| 9 | `KIT-L` | Bếp chữ L | ⚠️ | `BLOCKS` chỉ có `kitchenI`; kho ②: `kitchen-cabinet-l` | ⚠️ gần đúng, kho ② |
| 10 | `WRD-240` | Tủ áo 2m4 | ⚠️ | `wardrobe` · w 1800 | ⚠️ gần đúng |
| 11 | `SCALE-H` | Người · tỉ lệ | 🔴 **NULL — câm** | **KHÔNG CÓ** trong cả 46 + 54 | 🚫 **khai thẳng chưa có, nút mờ** |
| 12 | `PLANT-M` | Cây trong nhà | 🔴 **NULL** | kho ②: `plant-tree-top` "Cây (nhìn từ trên)" | ⚠️ gần đúng, thả được |

**Tổng: trước 4 câm / 12 · sau 0 câm.** 11 món thả được, 1 món khai thẳng là kho chưa có.

**Ba món câm oan** (`DOOR-S-800`, `BED-160`, `PLANT-M`) **đều CÓ hình thật trong kho** — chỉ vì
kệ và kho gọi cùng một vật bằng hai cái tên. `BED-160` là ca đắt nhất: `bedD` rộng đúng **1600**,
tức đúng tuyệt đối, nhưng tên kho không mang con số nên cả 3 luật khớp-tên đều trượt.

**Hai món được nâng từ "gần đúng" lên "đúng món"** (#2, #5): trước đây thả ra hình đúng nhưng
kèm lời cảnh báo *"gần đúng — kiểm lại trước khi dùng"* — cảnh báo sai làm người dùng mất tin
vào cảnh báo thật.

---

## ② HƯỚNG SỬA ĐÃ CHỌN — (c) bảng nối mã→id

Phiếu nêu 3 hướng. Chọn **(c)**, lý do:

* **(a) sửa tên trong kệ** — rẻ nhất nhưng lệch lại ngay lần đổi tên tiếp theo, ở CẢ HAI phía.
  Nó chữa triệu chứng: sợi dây vẫn là tên hiển thị, thứ vốn được sinh ra để đọc chứ không để nối.
* **(b) khớp theo MÃ trước** — *không thi hành được như câu chữ*: `BlockDef` **không có trường mã**;
  `DOOR-S-800` không tồn tại ở bất kỳ đâu trong kho. Mã chỉ dùng tra `ProductSpec.sku`.
  (b) muốn chạy thì buộc phải có bảng — tức nó **sập vào (c)**.
* **(c) bảng ghim** `lib/cad/library-code-map.ts`: ghim **mã ↔ id kho** — hai định danh ổn định.
  Đổi tên hiển thị ở kệ: dây không đứt. Đổi tên block trong kho: dây không đứt.

Chi phí chênh không đáng kể (một bảng 12 dòng), nên theo đúng chỉ dẫn *"chọn hướng bền"*.

**Không dựng lại gì** (NO-REBUILD §B25): khớp-tên `matchByName` **giữ nguyên** làm đường lùi cho
mọi món chưa ghim; bảng chỉ **đứng trước** nó. Ghim vào kho ② mà manifest chưa tải xong ⇒ rơi
xuống khớp-tên như cũ, không trả `null` sớm. Bảng thêm đường, không cắt đường.

Bảng mang thêm hai trường khai-thật, để nó không biến thành chỗ nói dối mới:
`approximate` (hình gần đúng — vẫn cảnh báo) và `missing` (kho chưa có — cấm kéo).

**Vì sao tách module riêng, không nhét vào `library-item-resolve.ts`:** tầng kệ cần tra
"món này có hình chưa" ở mọi nấc thẻ; nếu bảng nằm trong resolver thì `shelves`/`LibrarySheet`
phải kéo theo cả `BLOCKS` (hình học nặng). Module mới **không import gì** — hai tầng cùng đọc
một nguồn, không vòng import.

---

## ③ MÓN KHÔNG CÓ TRONG KHO — nói thẳng

`SCALE-H` "Người · tỉ lệ": dò hết 46 `BLOCKS` + 54 block `.dxf` — **không có hình người/thước tỉ lệ nào**.
Trước bản vá nó là **nút giả kinh điển**: kéo được, im lặng, không ra gì.

Nay thẻ hiện **mờ** (`opacity: var(--mo-vo-hieu)` — token theo theme, không hằng số gõ tay),
`draggable={false}`, `onDragStart` chặn, bấm đúp báo đúng lý do.

Dùng **`aria-disabled`, KHÔNG dùng `disabled`** — nút `disabled` bị Tab bỏ qua nên lý do gắn kèm
không bao giờ tới được bàn phím và trình đọc màn hình (đúng bài học 16/08 ở `ToolbarChip`).
Lý do đi qua `aria-describedby` → `<span className="if-tooltip-a11y">`, không đi qua `title`
(`title` câm trên cảm ứng). Thẻ **vẫn bấm chọn được** để đọc lý do ở cột thông số — chỉ chặn đường DÙNG.

## ④ Cơ chế `claimed` — GIỮ NGUYÊN

Không đụng một dòng nào của `LibraryDropBridge.tsx`. Đo lại trên trình duyệt: `claimed=true` cho
mọi món (kể cả `SCALE-H` — app nhận việc rồi báo đúng lý do, không nói dối là đã thả).

## ⑤ TEST KHOÁ CHỐNG TÁI PHÁT

`lib/cad/library-code-map.test.ts` — **54 assertion**, đọc **CẢ HAI** danh sách:

1. mọi món kệ khai **hoặc resolve được, hoặc khai thẳng là kho chưa có** — không có cửa thứ ba (im lặng);
2. khai chưa-có thì resolver **cũng** trả `null` (hai bên không nói hai kiểu);
3. bảng ghim không trỏ vào hư không (id phải có thật trong `BLOCKS`/manifest), mỗi dòng đúng **một** đích;
4. bảng không có dòng chết (mã không còn trên kệ);
5. ghim đứng trước khớp-tên, **và khớp-tên vẫn là đường lùi**.

**Đã sabotage để chứng minh guard cắn, không phải dấu xanh cho có:** xoá dòng `BED-160` khỏi bảng
⇒ **3 FAIL**, dòng đầu ghi thẳng `BED-160 "Giường 1m6" — CÂM (thả không ra gì)`. Khôi phục ⇒ PASS.

---

## ⑥ NGHIỆM THU

| Cửa | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ **0** |
| `library-code-map.test.ts` (mới) | ✅ 54 ok · 0 fail |
| `library-item-resolve.test.ts` (hồi quy) | ✅ 57 ok · 0 fail |
| Toàn bộ test `lib/cad` + `lib/library` + `components` (~105 tệp) | ✅ 0 fail |
| **BROWSER THẬT — headed, tiền cảnh** | ✅ **PASS** |

Kéo thả **3 món trước đây hỏng**, đo `window.__cadStore.getState().doc.entities.length`, qua
**đúng sự kiện `if:library-instantiate`** mà `LibrarySheet` phát (không gọi tắt `addEntities`):

```
DOOR-S-800   entity 0 -> 1  (Δ1)  claimed=true
BED-160      entity 1 -> 2  (Δ1)  claimed=true
PLANT-M      entity 2 -> 6  (Δ4)  claimed=true    ← .dxf, 4 nét rời
SCALE-H      entity 6 -> 6  (đứng yên, đúng)
lỗi JS trên trang: không có
```

DOM thật của kệ (12 thẻ): đúng **1 thẻ** mang `aria-disabled=true` + `draggable=false` +
`aria-describedby` + span `.if-tooltip-a11y` — là `SCALE-H`. 11 thẻ còn lại bình thường.

⛔ **Đã dọn dữ liệu thử**: undo về `entity = 0` (kiểm bằng máy trong chính script), xoá 5 tệp tạm
(`_probe_ke.ts`, `_probe2.ts`, `_verify_drop.mjs`, `_verify_ui.mjs`, `_ke-sau-va.png`).
Không restart/kill server 3001 · không `git` · không `prisma`.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

* **Chỉ soi kệ `cad-kyhieu`.** Đó là kệ built-in **duy nhất** có món hình vẽ (`BUILTIN_ITEMS` chỉ
  1 khoá) — mọi kệ khác đọc kho DB/`.idfc`, đi đường khác. Nhưng **món từ DB `LibraryAsset` chưa
  ai soi bằng bảng này**: chúng cũng đi qua `resolveLibraryItem` và cũng có thể câm y hệt. Test
  không phủ được vì phụ thuộc DB thật.
* **Bốn "gần đúng" còn lại là quyết định của tôi, không phải phép đo**: `WC-WH`→`toilet`,
  `LAV-CT`→`lavabo`, `WRD-240`→`wardrobe` (1m8 vs 2m4), `WIN-SL-1800`→`slidingWindow` (1200 vs 1800).
  Đúng loại nhưng **sai kích thước danh nghĩa**. Nếu con số trên mã phải đúng thì lời giải không
  phải bảng ghim mà là **thêm biến thể vào kho** — ngoài phạm vi phiếu.
* **Không đổi mã món** (`WIN-SL-1800` → `…-1200`) dù mã đang nói sai kích thước: `SheetItem.id`
  dựng từ mã (`${shelfId}-${code}`) và `specLinks` gán tay khoá theo id đó ⇒ đổi mã làm **mất
  liên kết thông số người dùng đã gán**. Cố ý không đụng.
* **Trình duyệt chỉ thử Chromium**, 1440×900, 1 lượt. Chưa thử trình đọc màn hình thật, chưa thử
  Safari/Firefox.
* Chưa chạy `npm test` đầy đủ (kèm `license:check` + `check:chot`); đã chạy tsc + toàn bộ test của
  ba vùng liên quan.
* Chưa chạy `soi:frontier` / `soi:tu-dien` — bản vá thêm một module mới, có thể cần entry registry.

**🔴 Một phát hiện ngoài phạm vi, chưa vá — đáng mở phiếu:** lượt chạy trình duyệt ĐẦU TIÊN cho
`DOOR-S-800` Δ0 **claimed=false**, không phải do bản vá mà do **sự kiện phát trước khi
`LibraryDropBridge` kịp gắn listener** (canvas đã vẽ ≠ effect đã chạy). Tôi vá ở phía script
kiểm (cổng sẵn sàng), **không vá ở app**. Nghĩa là trong app thật, người dùng thả một món **ngay
khi vừa mở màn 2D** có thể rơi vào đúng khe đó: `claimed=false` ⇒ `LibrarySheet` báo *"màn đang
mở không có bản vẽ"* trong khi bản vẽ có thật. Cửa sổ hẹp nhưng đúng lúc người dùng nôn nóng nhất.
Đây cũng là **bằng chứng thứ hai trong ngày** cho luật *nghiệm thu phải có thao tác thật* — tsc,
54 test và grep đều xanh mà vẫn không thấy được ca này.

## ⑦c HẠN DÙNG KẾT LUẬN

* Bảng đối chiếu §1 đúng với `BLOCKS` 46 món + manifest 54 block **tại 20/08**. Thêm/bớt block là
  phải đo lại — nhưng **test tự canh**, không cần nhớ.
* Kết luận *"`SCALE-H` kho chưa có"* hết hiệu lực ngay khi ai đó thêm hình người tỉ lệ; lúc đó đổi
  dòng `missing` thành `blockId`/`manifestId` là xong, và test §3 sẽ bắt nếu id sai.
* Lựa chọn (c) hết hiệu lực nếu `BlockDef` mọc trường mã chuẩn — khi đó (b) thành khả thi thật và
  bảng ghim nên rút về chỉ còn các ca ngoại lệ.
