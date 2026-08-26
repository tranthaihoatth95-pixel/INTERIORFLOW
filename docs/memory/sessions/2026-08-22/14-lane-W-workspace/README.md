# LANE W — WORKSPACE / CANVAS DÙNG CHUNG (22/08)

> Kết phiên: `npx tsc --noEmit` **0** · `npm test` **exit 0** (đo bằng MÃ THOÁT, không grep FAIL) ·
> `lib/nodes/cua-so-cong-cu.test.ts` **71 pass / 0 fail** (trước lượt: 48).
> Ảnh: `artifacts/visual-review/W1-hai-cua-so-noi-day.png` · `W2-ba-nac.png` · `W3-quay-ve-canvas.png`.

---

## LANE W: **PASS**

## ⓪ TIỀN ĐỀ — đo trước, và phiếu ĐÚNG ở chỗ nặng nhất

Phiếu nói *"lệnh trong vệ tinh còn MỜ HẾT"*. Đo lại: **gần đúng** — `CuaSoCongCu.tsx` có
`LENH_DA_NOI = new Set(['cua.anh.can-trang'])` từ P0 20/08, tức **1/13 lệnh** đã có điện, 12 lệnh
còn lại mờ với **MỘT câu lý do dùng chung**.

Nhưng đo tiếp ra một lỗ **lớn hơn cái phiếu nêu**, và nó là gốc của việc 2:

| Đo được | Hệ quả |
|---|---|
| `TASK_CARDS` có 12 thẻ, **12/12 là node ẢNH** | `laCuaSoCongCu()` hỏi *"có thẻ việc không"* ⇒ chỉ node ảnh mở được cửa sổ |
| `ToolWindow.tsx` gõ cứng `moiTruong="anh"` | mọi cửa sổ đều là cửa sổ Ảnh |
| `MOI_TRUONG` khai **4** môi trường, có vệ tinh, có test canh | **3 môi trường không có đường nào mở ra** |

⇒ Không phải *"dây có chưa có điện"* ở một chỗ, mà là **ba trong bốn xưởng chưa có cửa vào**.
Việc 2 (*"hai cửa sổ KHÁC LOẠI"*) trước lượt này **không thể dựng được**, vì app chỉ có một loại.

---

## LỆNH VỆ TINH ĐÃ CÓ ĐIỆN: **4 / 13** · còn mờ **9**, mỗi lệnh MỘT lý do riêng

Tệp mới `lib/nodes/thi-hanh-lenh-cua.ts` — bảng khai **số phận của từng lệnh**, có máy canh.

### Đã nối (cả 4 đều tựa engine ĐÃ CÓ, không viết engine mới — [Đ2])

| Lệnh | Bộ thi hành | Bằng chứng |
|---|---|---|
| `cua.anh.can-trang` | `lib/render-studio/controlled-edit.ts` (P0 20/08, giữ nguyên) | — |
| `cua.ba-chieu.tieu-cu` | tham số `lens` của `three.camera` | chạy trên app: **24mm → 35mm** |
| `cua.ba-chieu.gan-vat-lieu` | tham số `theme` của `three.cad2fbx` | — |
| `cua.video.doi-nhip` | tham số `duration` của `ai.image2video` | — |

Ba lệnh sau đi **cùng đường với `ParamField`** (`updateParam()`), nên **undo chung · lưu chung ·
không có bản sao nào để lệch**. Đây là lý do chúng nối được ngay: engine đã có, thứ thiếu chỉ là
**một cái nút đúng chỗ tay đang đặt**.

### Còn mờ — 9 lệnh, lý do RIÊNG (ví dụ, đọc thật từ cây trợ năng trên app)

* *Chỉnh đứng 2 điểm tụ* → “Cần chỉnh hai điểm tụ — máy ảnh nay chỉ có preset”
* *Extrude / đùn khối* → “Công thức khối chạy ở chặng 3D, chưa gọi được từ đây”
* *Thêm lớp* → “Cần hệ lớp ảnh — ảnh hiện chỉ một tầng”
* *Đường cong* → “Cần bảng đường cong — nay mới có cân trắng”

**Vì sao đổi chỗ khai**: câu dùng chung *"chưa nối bộ thi hành"* đúng nhưng vô dụng — nó không nói
người dùng đang thiếu **cái gì**, và không nói phiên sau phải xây **cái gì**. §9 đòi lý do; một lý
do cho 12 lệnh là lý do của **cái danh sách**, không phải của **lệnh**.

**Máy canh (test, không phải lời dặn):** `lenhKhongKhaiSoPhan()` · `lenhKhaiHaiLan()` ·
`lenhKhaiThua()` đều **phải rỗng** ⇒ thêm lệnh vào `MOI_TRUONG` mà quên khai số phận là **test đỏ**.

**Bất biến cũ giữ nguyên**: `lenhDamChan(môi trường)` vẫn luôn rỗng, và có thêm test *"lệnh đã nối
VẪN giữ tiền tố `cua.<môi trường>.`"* — nối điện không phải cái cớ để một lệnh bò ra thanh chung.

**Lối đi a11y**: nút mờ đi `aria-disabled` + `aria-describedby` (KHÔNG `disabled` + `title`) — bài
học 16/08: `<button disabled>` rơi khỏi Tab, `title` câm trên cảm ứng ⇒ lý do có trong mã mà không
bao giờ tới người dùng.

---

## HAI CỬA SỔ + DÂY: **W1-hai-cua-so-noi-day.png**

Dây chuyền **BA xưởng KHÁC LOẠI trên MỘT canvas**, ba dây nối thật (đọc từ `window.__flowStore`):

```
three.camera  (cửa sổ KHỐI 3D) --prompt--> ai.text2image (cửa sổ ẢNH) --image--> ai.image2video (cửa sổ PHIM)
              "                --camera-->
```

Ảnh cho thấy hai cửa sổ mở cùng lúc, **vệ tinh khác hẳn nhau**: cửa 3D có *Khung nhìn · Công thức
khối · Vật liệu*; cửa Ảnh có *Vùng chọn · Lớp · Chỉnh sáng*. Khối thứ ba đứng ở nấc `thu`. Trên
ảnh đọc được **“Tiêu cự ống kính · 35mm”** — nút đã bấm, giá trị thật đã đổi.

**Ba điều được chứng minh cùng lúc**: cửa sổ chứa được môi trường thật · kết quả mang định nghĩa để
nối (dải “CỔNG RA · Chữ · Camera · chờ chạy” ở chân cửa sổ) · hai môi trường khác loại **không đá
nhau** (mỗi bộ lệnh chuyên sâu ở lại trong cửa sổ của nó).

Cách làm: `moiTruongChoDefType()` — **bảng khai TƯỜNG MINH**, cố ý KHÔNG đoán theo tiền tố chuỗi
(`startsWith('three.')`). Đoán theo tên là luật ngầm: thêm một node `three.xyz` chỉ để tính toán
thì nó tự mọc ra một cửa sổ sai, và không ai thấy cho tới lúc người dùng bấm.

---

## BA NẤC LÀ BA CÔNG NĂNG: **W2-ba-nac.png** — giữ đủ ba, và ẢNH CHỤP BẮT ĐƯỢC MỘT LỖI THẬT

| Nấc | Công năng riêng |
|---|---|
| `thu` | *có công đoạn này, xong chưa* — khối nhỏ, **không chạy môi trường nặng** |
| `vua` | **làm việc** — môi trường + vệ tinh, vẽ ở **tỉ lệ canvas** (72% trong ảnh) |
| `toanMan` | **làm việc chi li** — **thoát khỏi phép biến đổi canvas ⇒ tỉ lệ THẬT 100%** |

🔴 **LỖI BẮT ĐƯỢC BẰNG MẮT, KHÔNG PHẢI BẰNG ĐỌC MÃ — và đã sửa**: ở `toanMan`, bọc ngoài là
`inset:0`, nên `right: calc(100% + 8px)` đẩy vệ tinh **ra ngoài mép màn** ⇒ **nấc to nhất là nấc
DUY NHẤT không có vệ tinh nào** — nó còn ÍT hơn nấc vừa, phạm đúng luật *"nấc to phải có thứ nấc
nhỏ KHÔNG THỂ có"*. Sửa: `choDung(neo, thuTu, trong)` — ở toàn màn vệ tinh **nổi đè lên mép** mặt
làm việc (đúng hình 7 ảnh tham chiếu Photoshop · Lightroom · Premiere). tsc/test không bắt nổi loại
lỗi này; chỉ ảnh chụp thật bắt được.

**Không bỏ nấc nào.** Nhưng nói thẳng: sau khi sửa, nấc 3 có **đúng một** công năng riêng —
*tỉ lệ thật, thoát zoom canvas*. Hai thứ phiếu kể (**vệ tinh phụ đầy đủ** · **bảng thông số sâu**)
**CHƯA có**: vệ tinh ở `vua` và `toanMan` hiện **y hệt nhau**. ⇒ nấc 3 đang **mỏng**, nhưng KHÔNG
bỏ được vì nó đang gánh chức năng thoát-zoom mà nấc vừa không có.

### ZOOM LỒNG ZOOM — xử ở nơi rẻ nhất, và khai đúng phần chưa xử

Phiếu đòi *"từ nấc vừa trở lên, cửa sổ phải THOÁT khỏi phép biến đổi của canvas"*. **Chỉ làm được
một nửa, cố ý:**

* `thu` — thêm `chayMoiTruongNang(cap)` (có test): nấc thu **không chạy môi trường nặng**.
* `toanMan` — **đã thoát** (portal ra `document.body`, kiểm bằng máy: `.react-flow__viewport
  [aria-label="Thoát toàn màn"]` = **không có**, portal ngoài body = **có**).
* `vua` — **VẪN nằm trong** phép biến đổi canvas. Đây là chỗ phiếu **va với chốt Hoà 15/08**
  (*"nó phải THUỘC môi trường canvas"*): thoát ra là mất cổng và mất dây — trả giá lớn hơn cái được,
  mà **rủi ro chưa hiện thực**: trong repo hiện tại **không mặt WebGL nào vẽ trong thân node** (xem
  3D đi qua `Scene3DPreviewModal`, một cửa sổ nổi riêng). Ngày nào kéo viewport 3D vào thẳng thân
  node thì phải giải lại — và `toanMan` là đường ra sẵn có. Lý do ghi tại chỗ trong
  `chayMoiTruongNang()`, không giấu.

---

## QUAY VỀ CANVAS CŨ: **W3-quay-ve-canvas.png** — đối chiếu bằng máy, không bằng mắt

Kịch bản: dựng dây chuyền → đổi một tham số thật (tiêu cự 35mm) → **vào tiêu điểm toàn màn** (canvas
lùi hẳn ra sau) → thu hai nấc quay lại. Đọc thẳng `window.__flowStore` **trước và sau**:

```
nut : node_…_0:three.camera@300,260 · node_…_1:ai.text2image@1240,260 · node_…_2:ai.image2video@2150,260
day : _0.camera→_1.camera · _0.prompt→_1.prompt · _1.image→_2.image
khungNhin: translate(166.046px, 196.52px) scale(0.719848)
lens: 35mm
⇒ GIỐNG HỆT SAU KHI QUAY VỀ? true
```

Cùng id khối · cùng vị trí · cùng dây · **cùng khung nhìn** · tham số đang dở còn nguyên.
Không dựng lại ngữ cảnh. Lý do kiến trúc: nấc + vị trí sống ở `useCuaSoCongCuUi` (**cách nhìn**),
không nhét vào `InteriorNodeData` (**nội dung tài liệu**) — nên mở/đóng cửa sổ không đụng vào doc.

---

## THAY ĐỔI — 6 tệp, không tệp nào ngoài vùng ghi

| Tệp | Việc |
|---|---|
| `lib/nodes/thi-hanh-lenh-cua.ts` **(mới)** | bảng bộ thi hành + lý do riêng + 4 hàm canh + `giaTriKe()` |
| `components/render-studio/NutLenhVeTinh.tsx` **(mới)** | một nút lệnh: chạy thật, hoặc mờ kèm lý do của chính nó |
| `lib/nodes/cua-so-cong-cu.ts` | `MOI_TRUONG_THEO_DEFTYPE` · `moiTruongChoDefType()` · `chayMoiTruongNang()`; `laCuaSoCongCu()` đổi trục |
| `components/render-studio/CuaSoCongCu.tsx` | vệ tinh gọi nút mới; `choDung(..., trong)` sửa lỗi mất vệ tinh ở toàn màn |
| `components/render-studio/ToolWindow.tsx` | `cardId` thành tuỳ chọn; môi trường đọc từ node thay vì gõ cứng `"anh"` |
| `components/nodes/InteriorNode.tsx` · `HopCongCuBamVat.tsx` | mở cửa sổ theo **môi trường**, không theo thẻ việc |

**KHÔNG chạm**: `lib/commands/registry.ts` (0 dòng — hoá ra không cần thêm dòng nào; lệnh chuyên sâu
ở lại trong cửa sổ, đó chính là ranh giới) · `FlowCanvas.tsx` (0 dòng) · mọi vùng cấm.
**Không dựng khung canvas thứ hai · không đẻ `MOI_TRUONG` thứ hai · không viết lại `CuaSoCongCu`.**

---

## CHƯA CHẮC / CHƯA KIỂM — bắt buộc khai

1. **2/4 lệnh có điện chưa bấm trên app thật.** Đã bấm: `cua.ba-chieu.tieu-cu` (24mm→35mm, có ảnh).
   **CHƯA bấm**: `cua.ba-chieu.gan-vat-lieu` (cần node `three.cad2fbx`, mà node đó đòi **bản vẽ
   chặng 1 có tường** mới chạy) và `cua.video.doi-nhip` (cần mở cửa sổ node video). Cả hai đi **cùng
   một đường mã** với lệnh đã bấm (`xoay-tham-so` → `updateParam`), nhưng đó là **suy ra**, không
   phải đo.
2. **`cua.anh.can-trang` — không kiểm lại trong lượt này.** Nó là đường của P0 20/08, tôi chỉ dời chỗ
   khai và đổi lối a11y (`title` → `aria-describedby`). **Chưa chạy lại kịch bản Trước/Sau + Nhận/Bỏ.**
3. **“Đổi nhịp” ↔ `duration` là một cách ĐỌC, không phải một sự thật.** Với `ai.image2video`,
   *retime* thực chất là đổi **thời lượng clip sinh ra**. Ô giải nghĩa của nút nói đúng việc nó làm
   (*"Đổi Thời lượng sang …"*), nhưng **nhãn lệnh có thể đang hứa rộng hơn**. Nếu Hoà thấy lệch thì
   sửa nhãn, đừng sửa dây.
4. **Chỉ đo trên Chromium (Playwright), một khổ 1920×1080, theme sáng.** Chưa thử Safari/Firefox,
   chưa thử khổ hẹp, **chưa thử theme tối**, chưa thử trình đọc màn hình thật, chưa thử
   `prefers-reduced-motion`.
5. **W2 và W3 là ẢNH GHÉP** — mỗi khung là ảnh chụp thật trên app, ghép lại để so cạnh nhau (đã ghi
   rõ ngay trên ảnh). Không phải một khung nhìn duy nhất.
6. **Nấc `toanMan` sau khi sửa mới xem bằng mắt ở ĐÚNG MỘT ca** (cửa sổ 3D, 1920×1080). Vệ tinh neo
   `duoi` (môi trường Phim) ở toàn màn **chưa ai nhìn** — công thức `bottom:12 + left` có thể tràn
   ngang nếu một môi trường có nhiều vệ tinh `duoi`.
7. **Bảng `MOI_TRUONG_THEO_DEFTYPE` khai tay 5 node.** Node nào lẽ ra phải là cửa sổ mà tôi bỏ sót
   thì **im lặng không mở được** — không có máy nào bắt chuyện đó, vì "node này đáng có xưởng riêng
   không" là câu người trả lời, không phải máy.
8. **Môi trường `ban-bac` vẫn là DÒNG KHAI** — không màn nào mở nó (ngoài phạm vi lane). 3 lệnh của
   nó đã có lý do riêng, nhưng chưa từng hiện trên màn nào.

## VIỆC ĐỀ XUẤT KẾ TIẾP (không tự làm — chạm biên)

* Nấc `toanMan` đang mỏng: cho nó **vệ tinh phụ + bảng thông số sâu** thì nó mới có công năng thứ
  hai. Đây là quyết định thiết kế, không phải kỹ thuật.
* `cua.ban-bac.*` — cửa sổ THẢO LUẬN (moodboard · khung tư duy) chưa có màn nào; nó là lời giải cho
  đoạn Collab (Hoà chốt 16/08), và `coCongRa:false` đã sẵn sàng chờ.
