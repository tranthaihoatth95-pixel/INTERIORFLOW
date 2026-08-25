# HÀNG ĐỢI THIẾT KẾ — Claude Design ↔ MAIN

> MAIN **tự đẩy** hàng đợi này, không đợi Hoà nói "gửi cái này cho Claude Design".
> `CLAUDE-DESIGN-CURRENT.md` = con trỏ *"bản nào đang có hiệu lực"*. File này = *"ai đang làm gì,
> tới đâu, và vì sao món kế tiếp lại là món đó"*. Hai file, hai câu hỏi — đừng gộp.

Cập nhật **22/08/2026** · phiên này **DESIGN-ONLY** (khoá đồng thời: một MAIN khác đang sửa code).
Bằng chứng tuân khoá: **mọi lượt ghi của phiên này đều nằm trong `docs/mocks/**` và
`artifacts/visual-review/ui-authority/**`** (truy được từ chính các lượt gọi công cụ).

> 🔴 **ĐÍNH CHÍNH CÁCH ĐO — bài học đáng giữ.** Trước đó MAIN dùng
> `find app components lib prisma server -newermt … → rỗng` làm bằng chứng. **Câu lệnh đó HỎNG:**
> thư mục `server/` **không tồn tại**, và `find` của macOS gặp đường dẫn không có thì **bỏ luôn cả
> lượt chạy**, trả về rỗng. Rỗng ở đây nghĩa là *lệnh chết*, **không** phải *không có ai sửa gì*.
> Chạy lại đúng (bỏ `server`) ra **8 tệp production đã đổi** — toàn của lane khác (Vitals · Voice ·
> LibraryDropBridge), không phải của phiên này.
> **Luật: một phép kiểm trả "rỗng" phải tự chứng minh được là nó CÓ CHẠY.** Rỗng-vì-hỏng và
> rỗng-vì-sạch nhìn giống hệt nhau trên màn hình.

## ✅ GIAO XONG TRONG PHIÊN NÀY — 6 bản, 21 target đang hiệu lực

| Màn | Bản vẽ | Bản con |
|---|---|---|
| **Home / Living Canvas** | `Home.dc.html` | A–F (có/trống · widget board · sửa · 3 mật độ · 1100px) |
| **Auth / Login / Lock / Resume** | `Auth.dc.html` | A–F |
| **Workspace / Cửa sổ công cụ** | `Workspace-ToolWindow.dc.html` | A–G (3 nấc + vệ tinh + thảo luận) |
| **Settings** | `Settings.dc.html` | A–E (**B = Màn hình chính, mục MỚI**) |
| **Gallery / Explore** | `Gallery-Explore.dc.html` | A–F |
| **Review Gate** | `Review-Gate.dc.html` | A–F |

Cả 6 đều: dòng đầu `<!-- @dsCard … -->` · token thật đọc từ `globals.css` · 2 theme · đã ghi vào
`CLAUDE-DESIGN-CURRENT.md`. **Không có mock mồ côi.**

## 🟡 CÒN CHỜ THIẾT KẾ — 2, và CỐ Ý chưa giao

| # | Màn | Vì sao CHƯA giao ngay |
|---|---|---|
| D5 | Present Template Browser | **Chưa có bộ mẫu thật nào.** Vẽ trình duyệt mẫu trước khi có mẫu = vẽ vào chỗ trống, rồi sẽ phải vẽ lại khi mẫu thật xuất hiện. Giao SAU khi có ≥1 bộ mẫu thật. |
| D8 | Vành ngữ nghĩa Render | Nhỏ, và **`Workspace-ToolWindow.dc.html` đã giải xong phần khó**: hai loại tiến trình (đo được = vạch rời + số · không đo được = capsule quét, KHÔNG số). Giao kèm phiếu Render để tái dùng khuôn đó, đừng đẻ khuôn thứ hai. |

## 📌 3 KHOẢN NỢ THẬT các lane tự khai — MAIN thi công phải đọc

1. **TOÀN MÀN (nấc 3) chưa tự nuôi nổi mình.** Đo hôm nay nó chỉ làm được mỗi việc thoát-zoom —
   đó là **CỠ, không phải TẦNG TIN**, nên theo luật "ba nấc = ba công năng" thì hôm nay nó **chưa
   đủ tư cách**. Bản vẽ đề xuất tầng tin thật cho nó: **ĐỐI CHIẾU** — hai kết quả ứng viên ở tỉ lệ
   1:1 cạnh nhau + bảng tham số đầy đủ + gia phả kết quả. ⇒ **Ba nấc CHỈ đúng nếu dựng tầng đó;
   không dựng thì ship HAI nấc**, cấm độn cho đủ chỗ. (Điều kiện này ghi ngay trong chú thích bản
   D nên không rơi khi bàn giao.)
2. **Explore có phần KHÔNG THỂ ship** — lane khai thẳng: mục "nguồn CC0 nối sẵn" cần một connector
   chưa tồn tại **và** một câu hỏi pháp lý chưa ai trả lời (ship ảnh CC0 bên trong hồ sơ bán cho
   khách); "ảnh dự án của studio" cần phạm vi lưu cấp STUDIO, mà Gallery đang là localStorage
   per-máy ⇒ thiếu nó thì mục đó **rỗng vĩnh viễn**; "ảnh gần giống" cần vision backbone cục bộ,
   repo hiện **0 gói ML**. ⇒ Các mục này đã đóng dấu PLACEHOLDER **hiện rõ trên mặt**, không phải
   nút giả.
3. **Kéo thả → 2D: đã chạy thật, nhưng đứt dây danh tính.** Xem
   `TRANSFER-NOTE-2026-08-22-library-drop-specid.md` — vật rơi xuống không mang `specId` ⇒ không
   lên được BOQ. Dây thật là `ProductSpec.drawingBlock` ↔ `BlockDef.id` (cột ĐÃ có dữ liệu,
   7/10 spec), **không** phải `code ↔ sku`.

## 🔁 Luật giữ hàng đợi sạch
- Bản vẽ phải ở `docs/mocks/`, mang `@dsCard`, và **vào `CLAUDE-DESIGN-CURRENT.md` NGAY lượt đó**.
- Màn chưa có target thì MAIN **không được tự vẽ** — kể cả Home.
- Bản bị thay phải **đóng dấu SUPERSEDED tại chỗ**, không bỏ hoang (bài học `IF-ARCHITECTURE-COMPASS`
  mồ côi 19 ngày: tệp còn sống, con trỏ chết, nên đọc ra như tệp rỗng).
- Nhiều lane sửa cùng `CLAUDE-DESIGN-CURRENT.md` được — **miễn mỗi lane chỉ chạm ĐÚNG dòng của
  mình**. Đã chạy 3 lane đồng thời hôm nay, không hỏng. Nhưng phải **xoá dòng cũ ở mục 2** khi
  thăng lên mục 1 (lane D3 quên, MAIN dọn sau).

---

## 🔴 VERDICT MẮT 22/08 — LOGIN: **FAIL**

`claude-login-home-ambient-final.html` **BỊ BÁC**. Lý do: *đọc ra như một SaaS auth card*, không
phải **khoảnh khắc bước vào xưởng**.
⛔ **KHÔNG vá bản đó.** Giữ LOGIC, thay TRỌN BỘ COMPOSITION.

**Bị gọi tên để BỎ:** tấm kính nặng · thân xám trong đục · CTA tím **phát sáng** · hộp bo lớn quá khổ ·
tấm 3D trang trí sau form · **rail/sidebar trên màn CHƯA đăng nhập** (bản bị bác vẽ nhầm) · thừa viền/pill.

**Hướng mới:** nền toàn màn ambient rất nhẹ, tối, **matte** · form **KHÔNG nằm trong card**, chỉ là cột
nội dung **360–420px**, đứng được nhờ **spacing + typography** · **chữ là nhân vật chính** · bo góc
**giảm mạnh** · **gần như không kính** · CTA tím **chỉ là accent, KHÔNG glow** · khoảng trống phải **có
chủ đích** · nền gợi **xưởng/ánh sáng/vật liệu/chiều sâu**, cấm slab trừu tượng vô nghĩa.
**Liên tục Login→Home** nay dựa vào **ánh sáng/chân trời/trường không gian**, KHÔNG dựa vào việc giữ
một tấm kính sống xuyên chuyển cảnh.

**Đang chạy:** 3 phương án **A · Editorial minimal** / **B · Spatial threshold** / **C · Ambient
cinematic**, cùng 1440×900 → `docs/mocks/claude-login-redesign-abc.html`.

### ⚠️ MÂU THUẪN LUẬT — CẦN HOÀ CHỐT, MAIN KHÔNG TỰ SỬA
`LUAT-VAT-LIEU-KINH-G0-G3.md` §4 ghi **Vào xưởng = G3**, thấu kính quang học chữ ký duy nhất.
Verdict 22/08 lại ghi **CTA chỉ là accent, không glow** ⇒ màn Login **không còn G3 nào**.

Hai cách đọc, chưa chọn:
1. **G3 rời khỏi Login**, để dành cho một điểm-hành-động chữ ký ở nơi khác (trong xưởng) — thang G0–G3
   giữ nguyên, chỉ đổi CHỖ ĐẶT.
2. **G3 bị hạ cấp toàn hệ** — nếu cửa vào quan trọng nhất còn không xứng G3 thì nấc đó gần như không có
   người dùng, và thang nên rút còn G0–G2.

MAIN **theo verdict** (mắt Hoà là trọng tài) cho màn Login, và **không tự sửa luật** — vì sửa §4 là đổi
vật liệu của **toàn app**, không riêng một màn. Chờ Hoà chốt 1 hoặc 2.

---

## 🔚 BÀN GIAO LANE A — 22/08, cuối phiên

### Đã ship, giữ xanh
| Việc | Bằng chứng |
|---|---|
| **Sidebar overlap = 0px** | đo `:3777` VÀ `:3778`, cả 2 theme (md5 ảnh KHÁC nhau). Trong chặng: railW 51 · canvasLeft 88 · canvas không bị bóp |
| **Home: bỏ dụng cụ đo ánh sáng** | `LightClock` mọc cờ `khongDongHo`; Home bật, bố cục `custom` KHÔNG bật (không mất widget của ai) |
| **Home: zero-state là MẶC ĐỊNH** | context sạch → `tiep-tuc: null` · `cam-hung: null`; đã gỡ mọi số đếm Project |
| **Ảnh cảm hứng** | nguồn đổi `usage:'ref-render'` → Gallery thật (`img_…`); `object-cover` → `object-contain` |
| Cổng | `tsc` 0 · `npm test` exit 0 |

### 🔴 P2 SIDEBAR — còn 4 mục THỊ GIÁC chưa hội tụ (hành vi ĐÃ xanh, CẤM viết lại)
Đối chiếu mục "Bỏ gì · thay bằng gì" của `mock-sidebar-ban-do-2026-08-22.html`:
1. **Hàng active còn là pill/card** — `NEN_DANG_MO` accent 5% + bo tròn cả hàng. Target: một mặt phẳng liền, KHÔNG nền hàng.
2. **Tiêu đề IN HOA cỡ lớn** (`VIỆC`·`NHÁP`·`CHẶNG`). Target: nhãn đảo **10.5px chữ thường nhạt**; thứ đáng to là **tên dự án đặt serif**.
3. **Nửa dưới trống chết.** Target: **ngữ cảnh dự án sống** (tên · phòng · chặng đang làm), nén thành một chấm khi không cần.
4. **Hai mũi tên `‹ ›` ở đáy không nhãn.** Target: nút nấc có nhãn đọc được — "Điều hướng" / "Duyệt".
Kèm: ba trọng lượng nét 1.5 (toàn cục) · 1.25 (dự án) · 1.85 (chặng).
✅ ĐÃ đạt: bỏ hộp bo lớn ôm cụm chặng · dải chỉ dấu **2px** (đo được).

### Chờ HOÀ — không ai khác quyết được
1. **Chọn phương án Login A/B/C.** Production login SẠCH (0 rò rỉ) ⇒ không chặn gì.
2. **Mâu thuẫn G3**: luật ghi "Vào xưởng = G3" ↔ verdict "CTA chỉ accent, không glow". Sửa §4 là đổi vật liệu **toàn app** ⇒ để `needsReview`, không tự hạ thang.

### ⚠️ BA CÁI BẪY ĐO LƯỜNG — trả giá thật trong phiên này
1. `find a b server -newermt …` trả **rỗng vì LỆNH CHẾT** (`server/` không tồn tại → BSD find bỏ cả lượt). Rỗng-vì-hỏng và rỗng-vì-sạch nhìn y hệt nhau.
2. Playwright `colorScheme` **KHÔNG** đổi theme app. App dùng `localStorage['interiorflow.theme']` → `documentElement.dataset.theme` (`lib/store.ts:321,568`). **Hai ảnh theme phải KHÁC md5** mới tin được.
3. `ls mock-*.html` **bỏ sót 15 tệp** (gồm `avatar-picker.html`, `InteriorFlow 05 Máy quay.html`). Luôn `ls *.html`.
> Luật chung: **một phép đo "đạt" phải tự chứng minh là nó CÓ CHẠY.**

### Cổng port
`:3778` = nguồn hiện hành, ĐO Ở ĐÂY · `:3777` = bản đóng băng, chỉ tham chiếu · `:3000` = **HỎNG**, cấm đo · `:4173` = server xem bản vẽ.
Bản đóng gói có **DB riêng** — lấy id dự án từ chính nó.

---

# ĐỢT 26/08 — MAIN TRẢ LẠI QUYỀN BỐ CỤC

> 🔴 **MAIN ĐÃ VƯỢT QUYỀN, KHAI THẲNG.** Ngày 26/08 tôi tự quyết bố cục rail (thụt trái 6px,
> `justify-center` neo trục giữa) và tự gỡ một widget khỏi Trang chủ. Tôi vin vào cớ *"chỉ sửa
> CHỖ ĐẶT, không đổi HÌNH DẠNG"* — cớ đó sai: **chỗ đặt CHÍNH LÀ bố cục.**
> Chủ dự án bắt được ngay: *"sao không đưa Claude Design dựng?"*
> Mã đã commit (`8ccbbf3`) và app thật tốt lên — nhưng nó là **CANDIDATE do MAIN dựng**, không
> phải target đã duyệt. Claude Design có quyền đè hoàn toàn.

## Bằng chứng app thật — chụp 26/08, sau đăng nhập, cổng `:3799` mã hiện tại
· `artifacts/visual-review/S-2508-HOME-sach.png` — TRƯỚC
· `artifacts/visual-review/S-2608-rail-hai-vien.png` — SAU (bản MAIN tự dựng)

## Bốn bài toán giao lại — MAIN không tự giải nữa

**① RAIL — chỗ đặt, không phải hình dạng.**
Mã đã dựng đúng hai viên có mép riêng từ 23/08, vậy mà app thật vẫn đọc ra *"một thanh dọc dài,
thô"*. Đo ra hai nguyên nhân: viên **dán sát mép trái** (không còn máng để mắt thấy "vật đứng
trong chỗ") và cụm **bám đỉnh rồi đổ dài xuống**. Bản MAIN dựng tạm: thụt trái 6, neo trục giữa.
**Cần Claude Design chốt:** khoảng thụt · điểm neo dọc · quan hệ giữa máng và viên ở cả ba nấc
28/240/320. Ràng buộc còn hiệu lực: máng giữ chỗ trong dòng chảy, nấc rộng **nổi đè** không bóp
canvas, `PEEK` tự thu · `OPEN` không · `PINNED` thường trực.

**② TRANG CHỦ vẫn là TƯỜNG THẺ TRẮNG TRÊN NỀN TRẮNG.** Đây là bài chưa ai giải.
Thấy trong ảnh: thẻ `Dự án` và cụm `Ghi chú nhanh` **ngang trọng lượng**, không có nhân vật chính,
**hai phần ba màn bỏ trống**, và khoảng trống đó đọc ra *thiếu sót* chứ không ra *vật liệu bố cục*.
Luật đã có (`product/home.md`: trường ambient là CĂN PHÒNG, các mục tin là VẬT TRONG PHÒNG — không
phải THẺ TRONG LƯỚI) nhưng **chưa có target thị giác nào cho trạng thái "ít dữ liệu thật"**.
⚠️ Dữ liệu thật hiện tại: **3 dự án, 2 ghi chú, 0 phiên dở**. Đừng thiết kế cho màn đầy.

**③ THANH TRÊN.** `Untitled flow` vô nghĩa · ô tìm kiếm to và tĩnh chiếm ngang giữa · Vitals là một
vòng tròn mờ lạc lõng. Luật nói thanh trên phải **gần như tan vào môi trường** khi ít ngữ cảnh.

**④ NỀN THEO GIỜ — trần vật lý, cần lối khác.**
MAIN nới biên độ tới **mức tối đa còn qua cổng tương phản**; hạ thêm là 9/40 tổ hợp trượt, chữ chìm.
⇒ **Không thể làm nền hiện rõ bằng độ sáng đơn thuần.** Muốn nền có mặt hơn thì phải đi đường khác
(lớp kính cục bộ dưới dải có chữ, hoặc vật liệu/kết cấu thay vì chênh sáng). Đó là bài của thiết kế.

## Thứ MAIN giữ, không trả — vì là LUẬT, không phải gu
Gỡ **"Vật liệu của tuần"** khỏi Trang chủ: `product/home.md` ghi đích danh nó là ca mẫu **bị từ
chối**. Nó lọt được vì có **dữ liệu thật** — và đó là cái bẫy: dữ liệu thật không tự cấp cho một
vật quyền chiếm chỗ. Component **không xoá**, vẫn là ứng viên hợp lệ khi có cơ chế ghim thật.
