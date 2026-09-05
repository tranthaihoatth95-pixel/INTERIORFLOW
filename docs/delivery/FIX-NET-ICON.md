# FIX-NET-ICON — đóng cổng `F-ICON-STROKE` (05/09, làn NET-ICON)

## 1. Tổng quan

Cổng bánh cóc `F-ICON-STROKE 45 > trần 37` — thứ duy nhất trong họ nền còn đỏ — **đã đóng**.
Số về **28**, trần siết xuống **28**. Trong 17 điểm cải thiện: **8 do sửa mã** (8 icon lucide thật
mọc thêm sau 30/08), **9 do vá thước** (9 báo oan mà audit tìm ra trước khi đụng dòng nào).

| | trước | sau |
|---|---|---|
| `F-ICON-STROKE` đo được | **45** | **28** |
| trần trong `foundation-tran.json` | 37 | **28** |
| trạng thái cổng | 🔴 ĐỎ — *TĂNG 8, đây là bước LÙI* | 🟢 **XANH — không họ nào lùi** |
| tự kiểm | 4/4 (một chiều) | **8/8** — 4 chiều BẮT + 4 chiều **KHÔNG BẮT OAN** (mới) |

⚠️ **28 không so thẳng được với trần cũ 37.** Dưới thước mới, trạng thái *trước* lượt này là 37
chứ không phải 45. Ghi rõ trong `_siet-05-09b` để lượt sau không đọc nhầm thành "sửa được 17 chỗ".

---

## 2. Chi tiết

### 2.1 · Truy 8 ca mới — đo, không tin con số

Phiếu nói "8 ca mọc thêm do lượt đổi nền". Không suy từ hiệu `45 − 37`: xuất cây tại **`3540d04b`**
(30/08 — mốc cuối cùng trần 37 còn đúng) rồi chạy **thước hiện tại** lên nó, để hai danh sách nằm
trên **cùng một phép đo**.

| mốc | F-ICON-STROKE (thước hiện tại) |
|---|---|
| `78b8b250` 26/08 (commit ghi trần 37) | 68 — *commit tự khai chỉ đóng 15/29 tệp* |
| `abc15870` 28/08 | **37** ← trần 37 thành sự thật ở đây |
| `3540d04b` 30/08 | **37** |
| `931d0b2e` 05/09 | 45 |

Kết quả sạch — **8 ca nằm trọn trong 4 tệp MỚI thêm sau 30/08**, cả 8 đều là `strokeWidth={1.75}`
trên **icon lucide thật**:

| tệp:dòng | glyph | phán |
|---|---|---|
| `components/dna/InspirationBoard.tsx:312` | `Search` 14 | 🔴 vi phạm thật |
| `components/dna/InspirationNavigator.tsx:36,46` | `Lightbulb` · `FolderKanban` 14 | 🔴 vi phạm thật |
| `components/library/LibraryOverview.tsx:116` | `Icon` (bảng `LucideIcon`) 16 | 🔴 vi phạm thật |
| `components/library/LibraryOverviewNavigator.tsx:21,40,44,48` | `LayoutGrid`·`BookOpenText`·`Images`·`Palette` 14 | 🔴 vi phạm thật |

⇒ **0 báo oan trong 8 ca mới**, sửa MÃ về `1.5`. Căn cứ: `components/ui/Icon.tsx:16` trích nguyên
văn Foundation Sheet — *"stroke-width 1.5 — One value, no exceptions."*

3 dòng khác lệch giữa hai danh sách chỉ là **số dòng trôi** (`globals.css` 899→1237 ·
`LoginForm` 345→368 · `Viewport3D` 341→477); đếm theo TỆP thì cũ = mới.

### 2.2 · Audit thước — 9 báo oan, và cả 9 cùng một nhánh

Theo luật `_siet-25-08` (*audit thước TRƯỚC, sửa sau*): chạy probe in **thẻ sở hữu** của đủ 45 ca
trước khi đụng dòng nào.

**Tiêu chí phân biệt, viết thành câu:**

> *Nét này là nét của một **ICON** (glyph trên lưới 24), hay là nét của **HÌNH VẼ / ĐỒ THỊ / DÂY NỐI**?*
> Bằng chứng "là icon" chỉ có hai dạng: **(a)** prop nằm trên **thẻ component icon** — lucide không
> mang `viewBox` trong mã nguồn, chính sự vắng mặt đó là dấu hiệu; **(b)** nét nằm trong `<svg>` có
> **`viewBox` đo được và ≤ 48**. Thiếu **cả hai** ⇒ không chứng minh được là icon ⇒ **không kết tội**.

Chín ca báo oan, tất cả rơi vào nhánh "thiếu cả hai":

| ca | thật ra là gì | vì sao thước sập |
|---|---|---|
| `DrawOnPreview.tsx:221,296` `<motion.path 0.3>` `<motion.line 0.15>` | **bản vẽ mặt bằng**, toạ độ mm — 0.3/0.15 là **bề rộng nét bản vẽ** | `viewBox={viewBox}` là **biểu thức JSX**; regex đòi dấu nháy ⇒ trả `null` ⇒ rơi vào nhánh `vb === null` |
| `ClusterPanel.tsx:82` `<g strokeWidth={1} vectorEffect="non-scaling-stroke">` | xem trước `Prim[]` CAD | `viewBox` khai ở dòng **131**, tức **ở DƯỚI**, mà phép tìm chỉ **lùi về trước** |
| `AdjustPanel.tsx:162,163,167` `<line 0.5>` | lưới của **đồ thị đường cong tông màu** | cả tệp **không có `viewBox` nào** (svg đặt `width`/`height` thẳng) |
| `globals.css:1237` · `foldable.css:89,130` | `.react-flow__edge-path` · `.react-flow__connectionline` — **dây nối giữa node** | nhánh CSS không có thẻ, không có viewBox ⇒ kết tội mọi thứ |

🔴 Riêng nhánh CSS: đo cả kho chỉ có **4 khai báo `stroke-width` trong `.css`**, và **cả 4 đều là
react-flow** ⇒ nhánh này trước nay có **0 dương thật / 3 dương giả**.

**Vá thước** (`scripts/soi-foundation.mjs`) — chỉ kết tội khi có bằng chứng:
- **hình học SVG thô** (`path`·`line`·`g`·… kể cả bọc `motion.`) + không đo được thang `<svg>` ⇒ `NGOAI_PHAM_VI`
- **CSS** + selector không nhắc `icon|glyph|lucide|svg` ⇒ `NGOAI_PHAM_VI`
- **thẻ component** (lucide) không viewBox ⇒ **giữ nguyên là ứng viên** — đây là 134/180 ca thật, không đụng

⛔ **Không nới luật**: ngưỡng vẫn `1.5`, lưới vẫn `24`. Chỉ thu về đúng tập luật nói tới — cùng việc
bản 24/08 đã làm cho `F-ICON-SIZE` (quả cầu vật liệu 120px từng bị đếm là icon). Thứ bị loại **không
bị giấu**: nó vào sổ `NGOAI_PHAM_VI`, in ra cuối báo cáo (71 → **86** chỗ).

✅ **Họ lưới-16 mà `_siet-25-08` CỐ Ý chừa lại thì không suy suyển** — `ExportPdfDialog` (svg
`0 0 16 16`) · `PaperSheetFrame` · `LightBar` (`0 0 12 12`) vẫn bị bắt đủ.

### 2.3 · Tự kiểm mọc chiều thứ hai

Bộ cũ chỉ hỏi *"luật còn sống không"*. Một luật **sống quá tay** nguy hiểm ngang một luật chết: nó
đẻ ra việc giả, và người đi làm việc giả sẽ ép nét `0.15` của một đường kích thước lên `1.5` rồi
**làm hỏng bản vẽ**. Thêm **4 khẳng định ranh giới** + **tệp ảo thứ hai đuôi `.css`**:

```
🟢 BẮT  nét 2 trong <svg viewBox="0 0 16 16">
🟢 THA  nét 0.15 trên <motion.path> của bản vẽ (viewBox là biểu thức)
🟢 BẮT  nét 2 của selector `.if-icon svg`
🟢 THA  nét 2.5 của dây nối `.react-flow__edge-path`
```

**Đã đột biến để chứng minh dây bẫy có nổ** (chạy trên bản sao, script đã khôi phục nguyên trạng):

| đột biến | kết quả |
|---|---|
| gỡ miễn trừ hình học SVG (`else if (false)`) | 🔴 **TỰ KIỂM TRƯỢT** — bắt đúng dòng "THA nét 0.15" |
| cho selector CSS luôn kết tội (`return true`) | 🔴 **TỰ KIỂM TRƯỢT** — bắt đúng dòng "THA nét 2.5" |

---

## 3. Ba phán đoán của IF COMMAND — xác nhận cả ba

| ca | IF COMMAND phán | tôi | bằng chứng |
|---|---|---|---|
| `DrawOnPreview.tsx:221` `strokeWidth={0.3}` | 🟡 nghi báo oan | ✅ **XÁC NHẬN** | docstring `:3-6` khai rõ *"xem thử video draw-on của MỘT mặt bằng"*; `<svg viewBox={viewBox}>` `:75` với `viewBox` dựng từ `docBox(doc)` `:72` — **toạ độ mô hình mm**. Nét chị em ở `:116,124` lấy từ `lineweightOf(e, layerById)` — hàm **bề rộng nét theo lớp bản vẽ**. Không phải icon. |
| `DrawOnPreview.tsx:296` `strokeWidth={0.15}` | 🟡 nghi báo oan | ✅ **XÁC NHẬN** | `<motion.line>` cho entity `type === 'dim'` — **đường kích thước**. Đúng như phiếu đoán: không nấc icon nào bé thế. |
| `LoginForm.tsx:368` `<Check size={14} strokeWidth={3}>` | 🔴 vi phạm thật | ✅ **XÁC NHẬN** — nhưng **DỪNG, không ép** (xem §4) | `Check` nhập từ `lucide-react`; nằm trong `<span class="grid h-4 w-4 … rounded-[6px]">` `:362`, nền `--accent`, mực `--bg` khi `remember` bật. Icon lucide thật, vi phạm thật. |

---

## 4. Chỗ tôi DỪNG vì là đánh đổi thị giác

**`components/entry/LoginForm.tsx:368` — dấu tích trong ô kiểm.** Vi phạm thật, **cố ý không sửa**.

Nét `3` ở `size={14}` trên lưới 24 vẽ ra ≈ **1,75 px**; hạ về `1.5` còn ≈ **0,88 px** — **mỏng đi một
nửa**, xuống gần ngưỡng khử răng cưa, trên một ô **16 px đã tô đặc `--accent`** với mực là màu nền.
Hàng cuối trong ảnh nghiệm thu cho thấy rõ: ở 6× nét mảnh hẳn đi so với 7 glyph kia.

Đây là quyết định **thị giác**, thuộc mắt Hoà, không thuộc một lượt đóng cổng ⇒ **để nguyên trong 28**.
Nếu muốn đúng luật *"one value, no exceptions"* thì đường ra là **đổi cơ chế chứ không đổi số**: dùng
glyph tô đặc cho trạng thái `selected` (đúng luật `Icon.tsx:19-21` — *"tô đặc chỉ để báo selected/on,
và phải là CÙNG MỘT glyph"*), thay vì bơm nét lên cho dày.

---

## 5. Nghiệm thu

| máy | kết quả |
|---|---|
| `soi:foundation -- --tran` | 🟢 **CỔNG XANH** — `F-ICON-STROKE 28 = trần`, 6/6 họ không lùi |
| `soi:foundation -- --tu-kiem` | 🟢 **ĐẠT** — 4/4 họ còn sống **+ 4/4 ranh giới đúng cả hai chiều** |
| `npx tsc --noEmit` | 🟢 exit 0 |
| 11 máy soi sau `check:chot` trong chuỗi `test:ky-thuat` | 🟢 exit 0 tất cả (`quan-tri`·`frontier`·`hinh-hoc`·`tu-dien`·`contract`·`that`·`cam-dien`·`kho-tai-lieu`·`visual-source`·`thao-tac`·`design-school`) |
| ảnh trước/sau | `docs/delivery/anh-duyet-mat/net-icon/net-icon-truoc-sau.png` |

**Ảnh nghiệm thu — khai rõ nó là gì.** Không dựng `next dev` trong cây này (cổng dùng chung **3210
đang chạy**; dựng ở đây là ghi đè `.next` và giết nó). Thay vào đó **kết xuất SSR chính component
lucide** ở đúng cỡ và đúng hai giá trị nét, chụp bằng Chromium 1194 @2×. ⇒ Ảnh chứng minh **delta của
glyph** (thứ duy nhất thay đổi), **không** chứng minh bố cục trong app. Đọc được từ ảnh: ở cỡ thật
14 px chênh lệch `1.75 → 1.5` gần như không nhận ra; ở 6× thì thấy, và cả 7 glyph vẫn đọc tốt.

---

## 6. ⑦b CHƯA CHẮC / CHƯA KIỂM

- **Chưa mở app thật.** 8 ca đổi nét là thay đổi **nhìn thấy được** nhưng chưa có ảnh **trong ngữ
  cảnh giao diện** — chỉ có ảnh glyph tách rời. Nếu 4 tệp đó nằm trên nền có tương phản thấp thì
  kết luận "gần như không nhận ra" có thể không giữ.
- **`selectorNoiToiIcon` là phép SUY ĐOÁN**, đã khai thẳng trong mã: nó nhận ra selector nhắc
  `icon|glyph|lucide|svg`. Một selector đặt tên icon mà không mang chữ nào trong 4 từ đó thì nó
  nhìn không ra. Hiện kho chỉ có 4 khai báo CSS nên chưa có ca thử nào ngoài 4 ca đó.
- **`viewBoxBaoQuanh` vẫn chỉ lùi về trước, không giới hạn khoảng cách.** Đây là điểm mong manh
  **có sẵn từ trước**, tôi không sửa: một tệp có `<svg viewBox="0 0 24 24">` ở đầu và icon lucide
  ở cuối thì icon đó bị gán nhầm thang của svg trên. Chưa gặp ca thật, nhưng nó đang mở.
- **Chỉ đo trên Chromium 1194**, chưa thử Safari/Firefox. Số px hiệu dụng ở §4 là **tính** từ
  `stroke × size / 24`, không phải **đo** bằng thước trên màn.
- Bộ tự kiểm là **4 họ**, không phải "6/6" như phiếu ghi — `F-MAT-VOCAB` là luật toàn kho không tự
  kiểm được kiểu này, `F-NHAN-BIA` không nằm trong danh sách `CAN_BAT`. Nay là **4 + 4 = 8 khẳng định**.

---

## 7. Phát hiện ngoài phạm vi — GHI, KHÔNG SỬA

1. 🔴 **Cổng CI đỏ **KHÔNG PHẢI** chỉ vì `F-ICON-STROKE`.** Chuỗi `test:ky-thuat` nối bằng `&&`, và
   **`check:chot` đứng TRƯỚC `soi:foundation`** trong chuỗi đó. `check:chot` **đang đỏ**:
   `TRUNG-TINH · package.json:169 "!public/detech/**"`. Đã dựng lại cây tại `HEAD` (`bcc18eab`) nguyên
   trạng và chạy — **đỏ y hệt** ⇒ **có từ trước, không phải của làn này**. Trớ trêu: dòng đó tồn tại
   để **loại trừ** tài sản khách khỏi bản đóng gói, mà máy trung tính lại đọc nó là "nhúng cứng tên khách".
2. 🔴 **`test:sweep` exit 123, 1 tệp test đỏ**: `scripts/phieu-ca.test.ts` — *"B1ⓒ1 … `--kiem-ban` soi
   đúng 9 bàn THẬT"*. Cũng **đỏ y hệt trên `HEAD` nguyên trạng**. Nguyên nhân trông như **môi trường**:
   `test:so-sach` in *"MÙ: không đọc được sổ phiếu (`/root/PROJECT/SHARED/LOG/agent-handoffs.jsonl`)"*
   ⇒ các bàn in `❓` thay vì `✅🔴⚪`, mà khẳng định lại đòi đúng ba ký tự đó. ⇒ **Phiếu nói
   "`test:sweep` exit 0, cả 468 tệp test xanh" không khớp với đo được trong container này.**
3. 🟡 **Icon lucide **không khai** `strokeWidth` thì lọt lưới hoàn toàn** — lucide mặc định `2`, tức
   vi phạm luật `1.5`, nhưng không có prop thì không có ứng viên. Ca thật ngay cạnh chỗ vừa sửa:
   `InspirationBoard.tsx:327,332,357,406` (`Sparkles`·`X`·`ImagePlus`·`Upload` `size={14}`, không nét)
   ⇒ **các icon đó đang dày hơn hẳn** icon vừa chuẩn hoá, trong cùng một màn. Grep cũng không thấy
   `absoluteStrokeWidth`/`defaultProps` nào đặt mặc định toàn cục. Đây có lẽ là **lỗ lớn nhất còn lại**
   của họ luật này, và nó **không nằm trong con số 28**.
4. 🟡 **`trongChuoi` miễn trừ quá rộng**: mọi `stroke-width` trong template literal đều được tha, kể
   cả khi đó là CSS **icon thật** — ví dụ `components/avatar/AvatarBuilder.tsx:191`
   `.if-avb-tab svg{…stroke-width:1.75}` là một vi phạm thật đang được tha.
5. 🟡 **Trần 37 từng là con số **chưa từng đo được** trong 2 ngày.** Commit `78b8b250` (26/08) ghi
   trần 37 nhưng tự khai *"chỉ đóng 15 tệp … 14 tệp còn lại có lẫn việc chưa commit của phiên khác
   nên giữ nguyên"* — đo lại tại chính commit đó ra **68**. Phải tới `abc15870` (28/08) mới thật sự
   về 37. Tức bánh cóc **có thể ghi một con số đích thay vì con số đo** nếu người viết lỡ tay; máy
   không hề chặn, vì nó chỉ so lúc **chạy**, không so lúc **ghi**.

---

## 8. Tệp đã đụng

| tệp | đổi gì |
|---|---|
| `components/dna/InspirationBoard.tsx` · `InspirationNavigator.tsx` | 3 prop nét `1.75 → 1.5` |
| `components/library/LibraryOverview.tsx` · `LibraryOverviewNavigator.tsx` | 5 prop nét `1.75 → 1.5` |
| `scripts/soi-foundation.mjs` | vá thước (2 nhánh bằng-chứng) + mẫu ảo `.css` + 4 khẳng định ranh giới |
| `scripts/foundation-tran.json` | `F-ICON-STROKE: 37 → 28` + `_siet-05-09b` |
| `docs/delivery/FIX-NET-ICON.md` · `docs/delivery/anh-duyet-mat/net-icon/…png` | báo cáo + ảnh |

**Không chạm** `components/intro/**` · `app/api/flows/**` · `app/api/home/summary/**` ·
`app/api/dashboard/**` · `lib/server/**` (làn P0 đang giữ). Không `git add`/`stash`/`checkout`/
`reset`/`commit`. Không dựng `next dev` trong cây này.
