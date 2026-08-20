# LANE A — Home Ngày-Số-Không · bốn trạng thái · nền ambient · một cửa vào (20/08)

Vùng ghi: `components/home/**` · `lib/home/**` · `lib/wallpaper/**` (đọc) · **+ `components/ProjectSelect.tsx`** (khai lý do ở ⑥).
Dev server 3001 giữ nguyên, không restart. Không git, không prisma. Không tạo/xoá dữ liệu thật.

---

## ⓪ TIỀN ĐỀ — tự kiểm

| Tiền đề phiếu | Kiểm bằng gì | Kết quả |
|---|---|---|
| Rail 3 cụm · dải ngữ cảnh · Vitals Aperture đã LIVE | đọc `components/nav/`, `studio/DaiNguCanh.tsx`, `VitalsAperture.tsx` | ✅ đúng — KHÔNG đụng |
| Widget Home đã có | `components/home/widgets/` 15 tệp, mount thật trong `DongStudioHome.tsx` | ✅ đúng |
| `SystemWallpaper` + `lib/wallpaper/sets.ts` (5 bộ) đã mount, mặc định BẬT | `DongStudioHome.tsx:631` · `prefs.ts:20 bat:true` · DOM thật: lớp thứ 2 trong `[data-dong-studio]` có `radial-gradient(...)` | ✅ đúng — VIỆC 3 là **EXTEND**, không phải NEW |
| Không đụng vùng lane khác | `cad|three|render-studio|present-editor|filemanager|library`, `lib/server`, `app/api` = **0 tệp do lane này sửa** (các tệp đó có hiện `M` trong `git status` nhưng là việc đang dở của lane khác, có sẵn trong cây từ trước lượt này) | ✅ |

**Không bác tiền đề nào.** Một tiền đề của phiếu cần đính chính, xem ⑦b mục ①.

---

## ① VIỆC ĐÃ LÀM

### VIỆC 1 — HOME NGÀY-SỐ-KHÔNG → **LIVE**

`components/home/BatDauNgaySoKhong.tsx` (mới). Hình dạng: **ba cửa chính, ba lối phụ** — không phải bức tường nút.

* Chính: **Tạo dự án** (`choose({kind:'new'})`, đường cũ) · **Mở dự án** · **Nhập nguồn** (`/library/ingest`, route THẬT đang chạy).
* Phụ: **Khám phá Thư viện** (`/library`) · **Ghi chú nhanh** (đưa con trỏ về ô ghi chú trên cùng màn) · **Bắt đầu từ đâu** (mở tại chỗ, 3 bước — không điều hướng đi đâu cả).
* **0 con số** trên toàn màn Ngày-Số-Không. Không thẻ trắng chờ dữ liệu: widget thiếu dữ liệu vẫn TỰ ẨN theo luật cũ.

Nó **cùng một vật** với trạng thái TRỐNG của ô Dự án, không phải màn chào riêng — hết dự án thì quay lại đúng màn này.

🔴 **Một lỗi trợ năng cũ đã sửa nhân thể**: nút "Mở dự án từ máy" ở `emptyBlock` cũ dùng `disabled` + `title`. Tab **bỏ qua** nút `disabled` và `title` **câm trên cảm ứng** ⇒ cái lý do (vốn viết rất đúng, giữ nguyên từng chữ) không bao giờ tới người dùng bàn phím / trình đọc màn hình. Nay đi `aria-disabled` + `aria-describedby` + `--mo-vo-hieu`.

### VIỆC 2 — BỐN TRẠNG THÁI KHÁC NHAU → **LIVE**

Hai tầng, tách quyết-định khỏi bày-ra:

* `lib/home/trang-thai.ts` — máy trạng thái **THUẦN** (không fetch, không React, không `navigator`) + `useTrangThaiMang()` là **một chỗ duy nhất** trong Home chạm `navigator.onLine`.
* `components/home/TrangThaiO.tsx` — `KhungXuong` (khung xương) + `OTrangThai` + `NutO`.

| Trạng thái | Nói cái gì | Đo trên app thật |
|---|---|---|
| **ĐANG TẢI** | 4 mảnh **mang hình dạng thẻ dự án** + dải tiến trình **không phần trăm** + nhãn `role="status" aria-live` | ảnh `dangtai` — lấp đầy ô 386px |
| **TRỐNG** | Ngày-Số-Không (VIỆC 1) | ảnh `ngaysokhong` |
| **LỖI** | *"Máy vẫn có mạng nhưng dịch vụ dự án không trả lời. Tệp trên máy bạn không bị đụng tới."* + **Thử lại** + **Vào canvas trống** | ảnh `loi` |
| **NGOẠI TUYẾN** | *"Thứ đã có sẵn trên máy này vẫn mở được và vẫn lưu được"* + 3 dòng việc-cục-bộ-vẫn-chạy. **KHÔNG có nút Thử lại** | ảnh `ngoaituyen` |

**Ba quyết định về THỨ TỰ ƯU TIÊN, có test khoá:**

1. `dangTai` thắng tất cả — chưa có câu trả lời thì chưa được kết luận gì.
2. `ngoaiTuyen` **thắng** `loi` — cùng một lượt fetch hỏng nhưng đường hồi phục khác hẳn; mất mạng mà mời bấm "Thử lại" là đẩy người dùng vào vòng bấm vô nghĩa.
3. `loi` **thắng** `rong` — **đây là lỗi Home đang mắc**: fetch hỏng → dữ liệu ở nguyên rỗng → màn nói *"studio chưa có dự án nào"*. Nói studio trắng tay trong khi chỉ là rớt mạng là lỗi **nặng hơn** lỗi bố cục.

`lib/home/trang-thai.test.ts` — **16/16 tổ hợp**, bảng mong đợi viết TAY (không sinh bằng chính hàm đang test), + 3 ca trên là 3 khẳng định riêng.

🔴 **GỐC BỆNH THẬT của "vòng xoay trong hộp trắng khổng lồ" — và nó không phải chuyện thẩm mỹ.** Đo chuỗi cha trong DOM lúc đang tải:

```
[role=status]                                        h=37   ← khối trạng thái
└ .relative.z-10.flex.w-full.max-w-5xl.flex-col      h=37   ← THỦ PHẠM: không có flex-1
  └ .relative.flex.h-full.flex-col.overflow-y-auto   h=386
    └ .min-h-0.flex-1                                h=386
      └ ô Dự án (nen-mo-card)                        h=420
```

Khối trạng thái **có khai `h-full`** nhưng cha nó tự co về chiều cao nội dung (37px), nên `h-full` = 37px. Tức: **không phải khối trạng thái nhỏ, mà là nó KHÔNG ĐƯỢC CẤP chiều cao.** Vá bằng `flex-1 min-h-0` (chỉ bật ở `bentoBox`, giữ nguyên màn chọn dự án toàn màn nơi căn giữa là đúng) — đây là lý do phải chạm `ProjectSelect.tsx`.

🔴 **Khung xương suýt TÀNG HÌNH — bắt được bằng mắt trên app thật, không bằng đọc mã.** Bản đầu dùng `--field` làm nền mảnh xương. Đo theme sáng: `--field #f4f1eb` đứng trên card `rgba(255,255,255,.82)` ⇒ gần như trùng màu, ô đang tải đọc ra **y hệt một hộp trắng rỗng** — vẫn đúng cái bẫy phiếu cấm, chỉ đổi hình dạng. Đổi sang `color-mix(in srgb, var(--t4) 14%, transparent)`: `--t4` là mực có thật ở cả hai theme và **tự đảo cực**, không phải khai hai giá trị rồi quên một bên.

### VIỆC 3 — NỀN KHÔNG KHÍ → **LIVE (đã có sẵn, chỉ xác minh + không thay)**

**LOOK INSIDE trước, và nó đã đúng tinh thần phiếu** — `lib/wallpaper/sets.ts` có đúng 5 bộ, mỗi bộ là một **cơ chế ánh sáng** chứ không phải một tấm ảnh: `chan-troi` (quầng sáng chạy theo vị trí mặt trời) · `o-cua` (vệt nắng nghiêng theo giờ) · `binh-do` (chỉ có nét) · `tang-sau` (chiều sâu khí quyển, sương dày về đêm) · `mat-phang` (ánh sáng liếm mép, hạt mịn nổi). Sinh bằng mã, hai theme, `pointer-events:none`, **một `setTimeout` chứ không `rAF`/`interval`** nên đứng yên tuyệt đối giữa hai mốc 30 phút.

Ba ràng buộc của nó **đã được máy kiểm** (`sets.test.ts` 82 pass · `contrast.test.ts` 23 pass): góc màu ngoài phổ màu-nghĩa · bão hoà ≤ 0.12 · sàn tương phản do `contrast.ts` quyết chứ không do mắt.

⇒ **KHÔNG thay, KHÔNG chỉnh.** Đây là EXTEND đúng nghĩa: việc của lane này là làm thứ đứng TRÊN nền đọc được, và đó là phần đã làm ở VIỆC 1-2.

### VIỆC 4 — MỘT CỬA VÀO → **PARTIAL** (nói thẳng, xem ⑤)

Nút (i) ở góc Home mang nhãn **"Chi tiết (toàn bộ dự án)"** — nó **tự quảng cáo mình là một danh sách dự án thứ hai** đứng cạnh Home. Nhưng đo `onClick` thì nó mở `openDashboardTab('board')` = tấm Lark **Bảng · Kanban · Nhân sự**, tức **nhóm & hoạt động**, không phải kho dự án. Nhãn nói sai việc nó làm.

⇒ Đổi nhãn thành **"Nhóm & hoạt động"**. Home là cửa vào dự án duy nhất; tấm kia là khung nhìn chi tiết về NHÓM, mở TỪ Home chứ không thay Home. Chức năng có giá (Lark, nhân sự, credit) giữ nguyên 100%.

### Sửa thêm trong vùng (a11y, bắt được nhân thể)

`LightClock.tsx:173` — hai mốc `05:00`/`20:00` dùng `--t4`, đo được **3,04** (sáng) / **3,44** (tối), dưới ngưỡng 4,5. Đây **không phải trang trí**: bỏ đi thì đường cong mất thang đo, không đọc được là cung mặt trời từ mấy giờ tới mấy giờ. Đổi **token** `--t4 → --t3` (không chế màu mới) ⇒ **5,20** / **6,53**.

---

## ② TỆP ĐỘNG VÀO

| Tệp | Mới/Sửa | Việc |
|---|---|---|
| `lib/home/trang-thai.ts` | mới | máy trạng thái thuần + `useTrangThaiMang` |
| `lib/home/trang-thai.test.ts` | mới | 16 tổ hợp + 3 ca khoá thứ tự ưu tiên |
| `components/home/TrangThaiO.tsx` | mới | `KhungXuong` · `OTrangThai` · `NutO` |
| `components/home/BatDauNgaySoKhong.tsx` | mới | màn Ngày-Số-Không |
| `components/home/DongStudioHome.tsx` | sửa | nhãn nút (i) → "Nhóm & hoạt động" |
| `components/home/widgets/LightClock.tsx` | sửa | token `--t4`→`--t3` cho mốc giờ |
| `components/home/widgets/QuickNotes.tsx` | sửa | thêm `data-ghi-chu-nhap` (mốc neo, không phải `id` — ô này mount nhiều lần được) |
| `components/ProjectSelect.tsx` | sửa | 3 khối trạng thái + `flex-1 min-h-0` + `useTrangThaiMang` |

---

## ③ RÀNG BUỘC — tự chấm

| Ràng buộc | Trạng thái |
|---|---|
| Token màu, cấm hex cứng | ✅ 0 hex trong 4 tệp mới. Chữ trên nền accent dùng **`--on-accent`** (token có sẵn, `globals.css:160`) thay vì `#fff` như vài chỗ cũ |
| Thang bo 6/10/14/20 | ✅ chỉ `--r-2` · `--r-3` · `--r-full` |
| `--mo-vo-hieu` | ✅ mọi nút mờ |
| `aria-disabled` + `aria-describedby` lý do thật | ✅ 3 chỗ (Mở dự án · Ghi chú nhanh khi ngoài Home · `NutO`) — **không** `disabled`, **không** `title` |
| `prefers-reduced-motion` thắng | ✅ **hai lớp**: nhánh JS (bố cục) + `@media` trong CSS (chuyển động). Xem ⑦b ② |
| Widget khai theo Ô LƯỚI, cấm px | ✅ `repeat(auto-fit, minmax(min(100%,160px),1fr))` — không breakpoint px nào; 160px là **ngưỡng đo được** (ô Dự án nấc MỎNG rộng ~536px ⇒ 3×160+2×8=496 ≤ 536, ba cửa một hàng đúng như câu chữ) |
| Cấm bịa số | ✅ Ngày-Số-Không 0 con số; dải tiến trình **không có** `pct`/`aria-valuenow` vì lượt tải này không đo được |

---

## ④ NGHIỆM THU

* `npx tsc --noEmit` → **0 lỗi**
* `npx tsx lib/home/trang-thai.test.ts` → **tất cả PASS** (16 tổ hợp + 3 ca khoá + 2 ca `canKhoiThayThe`)
* `bento-layout.test.ts` **30 ok/0 fail** · `wallpaper/contrast.test.ts` **23/0** · `wallpaper/sets.test.ts` **82/0** — không regress
* **BROWSER THẬT :3001, 1280×720** — bốn trạng thái dựng bằng cách chặn `/api/flows` ở tầng `window.fetch` **trong phiên trình duyệt** (empty · hang · 500 · reject + `navigator.onLine=false`). **Không đụng DB, không xoá dữ liệu.** Gỡ bằng cách tải lại trang; đã tải lại và xác nhận Home Active nguyên vẹn 19 dự án.

### Số đo tương phản (đo trên app thật, không suy từ token)

| Chữ | 11–12px | Sáng | Tối |
|---|---|---|---|
| "Bắt đầu từ một hồ sơ trống." (`--t3`) | 11 | **4,61** | **6,12** |
| "Khám phá Thư viện" (`--t3`) | 12 | **5,20** | **6,53** |
| "Tạo dự án / Mở dự án / Nhập nguồn" (`--t1`) | 14 | — | **14,91** |
| Tiêu đề "Chưa có gì ở đây…" (`--t1`) | 16 | — | **15,93** |
| `05:00` / `20:00` sau khi sửa | 11 | **5,20** | **6,53** |

Toàn bộ chữ do lane này viết **≥ 4,5:1 ở cả hai theme**.

---

## ⑤ CHƯA XONG / KHAI THẲNG

**VIỆC 4 = PARTIAL, và đây là phần còn lại, có địa chỉ:**

`components/Dashboard.tsx:416` — tab **"Tổng quan"** của tấm overlay vẫn dựng **lưới dự án + danh sách flow + thẻ KPI** (`StatCard` "Thành viên", "Credit dùng 30 ngày"). Đó vẫn là **cửa vào thứ hai**, chỉ lùi lại một cú bấm — và đúng loại "KPI / thẻ quản trị" mà phiếu nói Home không được là.

**Vì sao lane này KHÔNG tự gỡ:** tệp đó 537 dòng, nằm ngoài vùng ghi đã khai, và tab đó là nơi DUY NHẤT hiện số credit còn lại của team. Gỡ nó là một quyết định về *ai được thấy credit ở đâu* — quyết định sản phẩm, không phải dọn bố cục. Đề xuất cho lượt sau: giữ `board/kanban/roster`, chuyển phần dự án/flow của tab "Tổng quan" thành **liên kết về Home**, đưa credit sang Cài đặt hoặc thanh trên.

---

## ⑥ VÌ SAO CHẠM `components/ProjectSelect.tsx` (ngoài vùng khai)

Không tránh được, và đây là lý do có bằng chứng: **ba trạng thái cần sửa nằm BÊN TRONG tệp đó** (`loadingBlock` · `errorBlock` · `emptyBlock`), và **thủ phạm chiều cao cũng nằm ở đó** (`.max-w-5xl` thiếu `flex-1`). Sửa từ ngoài là không thể — `DongStudioHome` chỉ truyền props, không với tới được ruột.

Đã giữ diện tích chạm nhỏ nhất có thể:
* **0 thay đổi hành vi**: `load` · `onEnter` · `choose({kind:'new'})` giữ nguyên; lý do khoá "Mở dự án từ máy" giữ nguyên **từng chữ**.
* `flex-1 min-h-0` **gate sau `bentoBox`** ⇒ màn chọn dự án toàn màn không đổi một pixel.
* Tệp này **không thuộc vùng cấm** của lane nào (`cad|three|render-studio|present-editor` · `filemanager|library` · `lib/server` · `app/api`).

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

1. 🔴 **Một tiền đề của phiếu cần đính chính.** Phiếu ghi *"ô chọn dự án kẹt ở 'Đang tải danh sách…' và Home hiện spinner trắng"*. Đo lại tại nguồn: `/api/flows` trả **200 với 19 flow**, và `loadProjectCards()` **giải quyết bình thường** — nó **không kẹt**. Cái Hoà thấy là **khung hình đầu của một lượt tải bình thường**: một pill 44px giữa ô 420px, đứng đó vài trăm ms. ⇒ Bệnh là **hình dạng của trạng thái đang-tải**, không phải một lượt fetch hỏng. Bản sửa này chữa đúng bệnh đó; nếu có ca kẹt THẬT (mạng chậm/máy chủ treo) thì nay nó rơi vào nhánh `hang` = khung xương, vẫn đúng.
2. **`prefers-reduced-motion` CHƯA chạy trên máy thật bật cờ đó.** Đã cài hai lớp (nhánh JS + `@media` CSS) và đọc mã thấy đúng, nhưng **chưa quan sát bằng mắt** ở chế độ giảm chuyển động.
3. **Chỉ đo trên Chromium 1280×720.** Safari/Firefox là suy. `color-mix()` cần Chrome 111+/Safari 16.2+ — Electron 33 của IF thừa, nhưng chưa thử trên bản đóng gói.
4. **Chưa thử trình đọc màn hình thật.** `aria-disabled`/`aria-describedby`/`role=status` đúng theo cây trợ năng, nhưng chưa nghe VoiceOver đọc.
5. **Ngày-Số-Không đo ở nấc MỎNG (ô Dự án ~536×420).** Ở nấc ĐẦY ô chỉ cao ~200px thì panel **cuộn** (`overflow-y-auto`) — không mất chức năng, nhưng chưa ai xem nó có còn "tươm tất" ở cỡ đó không. Ghi chú: nấc ĐẦY + 0 dự án là tổ hợp gần như không xảy ra thật (có widget sống nghĩa là đã có dữ liệu).
6. **Số tương phản trên vỏ kính là XẤP XỈ.** Card là `rgba(...,0.82)` chồng lên hình nền sinh động ⇒ nền thật đổi theo giờ và theo bộ hình nền. Đã đo ở bộ mặc định `chan-troi`, ban ngày. `contrast.ts` mới là thứ giữ sàn cho mọi bộ/mọi giờ, và nó có test riêng.
7. **"Ghi chú nhanh" tìm ô nhập bằng `querySelector` toàn tài liệu.** Nếu sau này có hai ô ghi chú cùng lúc trên Home, nó nhảy vào ô ĐẦU TIÊN trong DOM. Hôm nay chỉ có một nên chưa sai.

## ⑦c HẠN DÙNG KẾT LUẬN

* Số tương phản: **hết hạn khi theme sáng đổi sang bản canh-Apple** (`#F2F2F7` ngả lam thay `#f2efe9` ngả vàng — chốt A4 16/08). Phải đo lại toàn bảng ⑤.
* Ngưỡng **160px** ba-cửa-một-hàng: hết hạn nếu lưới bento đổi tỉ lệ cột ô Dự án (nay 7/12).
* Nhãn "Nhóm & hoạt động": hết hạn khi tab "Tổng quan" của `Dashboard.tsx` được xử theo ⑤ — lúc đó phải xem lại cả nút này còn cần không.
* `color-mix` cho khung xương: hết hạn nếu IF hạ Electron xuống dưới 33.

---

## TRẢ MAIN

| Mục | Trạng thái |
|---|---|
| Home Day-Zero | **LIVE** |
| Home Active | **LIVE** (không regress — 19 dự án, mọi widget nguyên) |
| 4 trạng thái | **LIVE** (đang tải · trống · lỗi · ngoại tuyến, đo đủ 2 theme) |
| Nền ambient | **LIVE** (đã có sẵn + đúng tinh thần; xác minh, không thay) |
| Hợp nhất Dashboard | **PARTIAL** — nhãn cửa Home đã sửa; `Dashboard.tsx:416` còn là cửa thứ hai, có địa chỉ + đề xuất ở ⑤ |
