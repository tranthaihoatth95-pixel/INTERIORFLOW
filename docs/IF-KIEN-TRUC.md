# IF · KIẾN TRÚC — bản đồ, không phải nhật ký

> ⛔ **BẢN ĐỒ CHÍNH TẮC NAY LÀ `INTERIORFLOW-ARCHITECTURE-MAP.md` (19/08).**
> File này giữ làm dấu vết, **không cập nhật nữa**. Mọi con trỏ đã chuyển cùng lượt
> (luật 16/08: đổi tài liệu nền phải sửa mọi con trỏ ngay).

> **ĐỌC FILE NÀY ĐẦU MỖI PHIÊN. Đọc thật, không lướt.**
>
> **Đây là loại tài liệu KHÁC `00-CHOT.md`.** `00-CHOT` trả lời *"cái gì được quyết, khi nào"* —
> nó là **nhật ký**, chỉ thêm, không sửa. File này trả lời *"thứ này **LÀ GÌ** và nằm **ở đâu**
> trong cây"* — nó là **bản đồ**, luôn **viết lại**, **không bao giờ cộng dồn**.
>
> 🔴 **Vì sao có file này** (bài học 16/08): bản đồ cũ `IF-ARCHITECTURE-COMPASS.md` sửa lần cuối
> 29/07, và **19 ngày không phiên nào đọc** — vì `CLAUDE.md` trỏ vào tên cũ đã thành mẩu cụt 774
> byte. Suốt 19 ngày mọi phiên **tưởng đã đọc kiến trúc**. Hệ quả đo được trong một ngày: `master
> tool` ↔ `ToolWindow` là một thứ mà tưởng hai (mất 6 phiếu) · vật liệu chẻ ba suốt 9 ngày không
> ai nối · Thư viện bị xếp sai chỗ vì mượn luật ngành cho một thứ khác bản chất.
> **Không lần nào thiếu dữ kiện. Lần nào cũng thiếu QUAN HỆ.** Nén nhật ký không bao giờ ra bản đồ.
>
> **Luật giữ file:** phần CỐT LÕI **không tách**, **viết lại** khi đổi, **không phình**. Chi tiết
> đầy đủ + bằng chứng của mỗi lần đổi nằm ở `docs/memory/sessions/<YYYY-MM-DD>/`, **chung chỗ với
> dữ liệu full** — xem §9.

---

# PHẦN CỐT LÕI — không tách

## 1 · IF là gì

App thiết kế **nội thất**, **local-first**, **trung tính toàn cầu** — không mang thương hiệu của
studio nào. Một dự án đi qua **ba chặng**, dùng **một nguồn dữ liệu**, và **mọi con số truy được
về nguồn đó**.

Hào của IF nằm ở chỗ hai đối thủ lớn nhất đều hụt: **Canva đẹp mà không thật · Revit thật mà
không đẹp.** IF đổi vật liệu ở phối cảnh thì bản vẽ, bảng vật liệu, **giá** và tiến độ đổi theo —
không phải vì có ai đi đồng bộ, mà vì **chỉ có một vật**.

## 2 · Bốn bề mặt, bốn vai — không cái nào giẫm cái nào

> **Canvas là SƠ ĐỒ DÂY CHUYỀN. Cửa sổ là XƯỞNG của một công đoạn. Chặng là KHUNG NHÌN. Sidebar là BẢN ĐỒ.**

| Bề mặt | Trả lời câu hỏi | Nội dung đổi theo chặng? |
|---|---|---|
| **Sidebar** | *tôi đang ở đâu / đi đâu được* | **KHÔNG** — nó là bản đồ |
| **Canvas** | *dây chuyền của tôi trông thế nào* | không — một nền duy nhất |
| **Cửa sổ công cụ** | *làm gì với thứ trước mặt* | **CÓ** — mỗi cửa sổ một môi trường |
| **Chặng** | *tôi đang nhìn dự án qua ống kính nào* | — nó **là** ống kính |

**Luật ranh giới, một câu mỗi bên:**
> **Sidebar không bao giờ đổi nội dung theo chặng. Thanh công cụ không bao giờ chứa lối đi.**

## 3 · Sidebar — một trục dọc, BA CỤM

> 🔄 **Cập nhật 04/09.** Mục này trước ghi **HAI cụm** (16-17/08). Chốt `CHOT-EXPERIENCE-SYSTEM`
> 20/08 điều 3 **đè lên**: ba cụm — *workspace chung · dự án/ba chặng · cá nhân+hệ thống*. Mã đã
> thi hành từ commit `3e1dde32` (EXS-BUILD-1); sổ này là thứ đi sau, nay khớp lại.
> Đọc theo mã, không theo trí nhớ: `components/nav/muc-dieu-huong.ts` — `THU_TU_CUM` và `NHAN_CUM`.

| Cụm | Gồm (đúng mã 04/09) | Sống khi |
|---|---|---|
| **① WORKSPACE CHUNG** | Tổng quan · Bảng việc · Chat·Họp · Files · Thư viện | **không cần dự án nào** |
| **② DỰ ÁN** | Dự án này · Sổ tay · Thiết kế 2D · Thiết kế 3D · Trình chiếu | **chỉ khi đã mở dự án** |
| **③ CÁ NHÂN + HỆ THỐNG** | Cá nhân · Cài đặt | luôn |

**Vì sao tách ③ ra khỏi ①** (đây là phần chốt 20/08 thêm vào, không phải chuyện xếp cho đẹp):
hồ sơ · credit · cài đặt là **thứ của NGƯỜI DÙNG**, không phải một nơi làm việc. Trộn chúng vào
cụm workspace là bắt mắt đọc một danh sách gồm hai loại vật khác bản chất — và chính chủ dự án đặt
tiêu chí trượt cho việc đó: *"trượt nếu thanh trái còn chứa Hồ sơ/Credit/Cài đặt"* lẫn trong cụm chung.

Tách các cụm bằng **một khoảng thở**, không phải đường kẻ — rẻ hơn mọi cơ chế khác.
Ba nấc chi tiết: **52 định vị · 240 điều hướng · 320–440 duyệt (kéo được)** — ba mức là ba **công
năng** khác nhau, không phải ba cỡ (§7).
**Files và Thư viện đứng cạnh nhau có lý do** (xem §5): chúng là hai trạng thái của cùng một dòng chảy.

**KHÔNG lên sidebar:** Bảng màu (một *bước* trong chọn vật liệu) · Kho vật liệu (một *kệ* trong
Thư viện) · Gallery (mặt tiền tuyển chọn của kệ Ảnh).

**Ba nấc = ba CÔNG NĂNG, không phải ba cỡ** (§7).

## 4 · Ba chặng — ba ống kính, một nguồn

| | Việc | Mode |
|---|---|---|
| **Thiết kế 2D** | bản vẽ · cấu kiện · hồ sơ kỹ thuật | Sơ phác ↔ Chuyên |
| **Thiết kế 3D** | dựng khối · vật liệu · ánh sáng · render | Node ↔ Vẽ 3D — *một bộ lệnh, hai lối thao tác* |
| **Trình chiếu** | đóng gói: deck · bảng vật liệu · BOQ · văn bản · video | không mode |

**Khoá kỹ thuật trong code GIỮ NGUYÊN** (`concept`/`render`/`present`, `sketch`/`pro`/`revit`) —
đổi khoá là vỡ persist, chỉ đổi **nhãn hiển thị**.

⚠️ **Cấu kiện / BIM nội thất KHÔNG phải mode, không thuộc chặng nào** — nó là **TẦNG DỮ LIỆU nằm
dưới cả ba chặng**.

**Luật không chặn** — vào chặng nào cũng dựng được; dựng ở đâu cũng ghi vào **một** `Doc`; chặng
trống thì hiện lối làm-được-việc-tại-chỗ, **cấm** bắt "quay lại bước trước".

## 5 · Dòng chảy của VẬT — xương sống của sản phẩm

```
FILES  ──────►  CỬA SỔ CÔNG CỤ  ──────►  THƯ VIỆN  ──────►  ĐỀ XUẤT ĐÚNG CHỖ
 thô             thêm ĐỊNH NGHĨA          đủ định nghĩa      slot đồ · mảng vật liệu
 dùng chung      (tool làm vật liệu)      (.idfc)            ký hiệu 2D · bảng giá
```

⭐ **Files và Thư viện KHÔNG phải hai kho ngang hàng — chúng là HAI TRẠNG THÁI của cùng một thứ:**
*chưa đủ định nghĩa* ↔ *đã đủ định nghĩa*. **Cửa sổ công cụ là thứ đưa nó qua ranh giới** — đầu ra
của một cửa sổ là asset **mang sẵn định nghĩa** (*"định nghĩa file = kết quả"*).

- **Files** = **phần THÔ**, thứ **ai cũng thấy**, một trường thông tin **chung**: map texture ·
  nhà cung cấp · **range giá**. **Không render được** vì thiếu đúng thông số V-Ray/D5 luôn phải đặt.
  ⛔ Nghĩa **"chợ đầu mối"** đã **BỎ** (16/08).
  ⭐ **HAI TẦNG** (Hoà đưa mock 17/08 tối): Tầng ① thư mục hệ thống 5 loại có quyền · Tầng ②
  **Collection+** — 8 gói component (mã `COL-XXX-NNN`) tổ chức theo LOẠI VẬT, là **kho nguồn** chờ
  chưng cất → Thư viện. Bản "hai ngăn dự án ↔ phần thô" (chốt sáng 17/08) hết hiệu lực. Logic phần
  thô gộp vào thư mục "Nhà cung cấp".
- **Thư viện** = **Master Library**, một cái duy nhất, **hiểu ngữ cảnh và đề xuất đúng** — không
  phải kho để đi tìm. Đứng ở 2D nó đưa ký hiệu · ở 3D đưa PBR + quả cầu · ở Trình chiếu đưa bảng +
  giá. **Cùng một `matId`, ba mặt.**
- **Vật liệu là GỐC** — đồ đạc cũng làm bằng vật liệu. **Màu là một BƯỚC trong chọn vật liệu.**
  ⛔ **Không có "thư viện vật liệu" riêng** — nghĩa hẹp đó sai, vì vật liệu **xuyên ba chặng**.

**Hai đầu của cùng một cỗ máy:** *tool làm vật liệu* = đầu **NẠP** (thô → thêm ~8 trường kiểu D5 +
quả cầu → `matId`) · *slot furniture* = đầu **RÚT** (Thư viện đề xuất **cả bộ khớp Thẻ DNA**).

## 6 · ĐỒNG BỘ — câu định vị, đừng diễn giải lệch

> **Đồng bộ KHÔNG PHẢI nối hai thứ lại. Đồng bộ là KHÔNG TÁCH chúng ra ngay từ đầu.**

Một vật liệu mang **cả hai nửa** — render được **và** biết mình là hàng của ai, giá bao nhiêu.
Đổi nó trong phối cảnh thì BOQ đúng **vì chỉ có một vật**, không phải vì có ai đồng bộ hai bảng.

⚠️ **Nhưng vật liệu TRỎ TỚI bản ghi thương mại, KHÔNG CHÉP giá vào mình** — giá đổi hằng ngày,
texture thì không. *"Hiểu được thông tin"* = **trỏ tới được**. **Range giá** thuộc kho chung, **giá
chốt** thuộc từng dự án.

🔴 **Hiện trạng: DÂY CÓ, CHƯA CẮM ĐIỆN.** Vật liệu vẫn chẻ ba — `MaterialPbr` (14 thông số, **0**
trường giá/NCC) · `ProductSpec` (NCC · giá · hao hụt, **0** thông số render) · `MaterialDef` (hatch/màu).
Hàm nối **đã có**: `getMaterial()` (`lib/materials/resolve.ts:52`, từ 07/08) trả đủ ba mặt, khoá nối
`matId = ProductSpec.sku`, có test — **nhưng 0 nơi gọi ngoài chính test của nó** (đo 17/08).
**Đây là món đáng làm nhất của toàn sản phẩm**, và việc còn lại là **cắm điện**, không phải kéo dây.

⚠️ **Đính chính 17/08:** dòng này trước ghi *"`lib/materials` nối `ProductSpec` = **0 code**, đo 07/08
và đo lại 16/08 không đổi"* — **sai**. Số "0 code" đúng cho phép đo **sáng** 07/08; `resolve.ts` sinh
**chiều cùng ngày** (commit `ad2d23b`). Câu *"đo lại 16/08"* là **số chép lại, không phải phép đo** ⇒
vi phạm chính luật 1 (*đo tại nguồn, đừng nhớ hộ máy*). Ca này là bằng chứng sống cho §10: cần
**máy đối chiếu sổ ↔ code**, vì bản đồ tự nó không tự kiểm được.

## 7 · BA NẤC = ba CÔNG NĂNG, không phải ba cỡ

> **Mỗi nấc trả lời MỘT CÂU HỎI KHÁC. Nấc to THÊM MỘT LỚP TIN, không phóng to lớp cũ.**

**Cửa nghiệm thu hai vế** — thiếu vế hai là trượt về kéo dãn:
| | |
|---|---|
| che nấc to đi | **nấc nhỏ vẫn đứng được một mình** |
| **nấc to** | phải có thứ nấc nhỏ **KHÔNG THỂ** có — không phải thứ nấc nhỏ có mà bé hơn |

**Sidebar:** 28 = *định vị* · 240 = *điều hướng* (thêm **chữ**) · 320 = *duyệt nội dung* (thêm
**HÌNH**, hoặc **tình trạng** nếu không có hình — Kho vật liệu → cột ô tròn; một chặng → màn dang dở).

**Cửa sổ:** thu = *có công đoạn này, xong chưa* · vừa = **làm việc** · toàn màn = **làm việc chi li**.

⛔ **Không phải mục nào cũng xứng đáng có ba nấc.** Không có gì để nhìn thì nấc thứ ba là kéo dãn ⇒
**bỏ**, để hai nấc. **Ba nấc là NHỊP CHUNG, không phải HẠN NGẠCH.**
📏 Nấc-hình có **ngưỡng đo được**: 141px đã được đo là *quá nhỏ để phân biệt vân sồi với óc chó*.

## 8 · HỆ `.idf` — bốn đuôi sống, một đuôi ma

| Đuôi | Là gì | Trong code |
|---|---|---|
| `.idf` | **một DỰ ÁN** — bản vẽ, tầng, mọi bản chèn *(ví như `.rvt`)* | 192 |
| `.idfp` | **một HỒ SƠ** Trình chiếu | 50 |
| `.idfc` | **một NỘI DUNG dùng lại được** — cấu kiện · vật liệu · mẫu trang · video · brand kit *(ví như `.rfa`)* | 62 |
| `.ifpack` | **gói SAO LƯU** ZIP cả dự án | 41 |
| ~~`.idfnotes`~~ | 🔴 **MA** — 0 code, chỉ 2 dòng trong sổ. **Dựng hoặc khai tử, đừng để đó.** | **0** |

**`.idfc` — chữ "C" đọc là CONTENT**, không phải Component (vì video và văn bản cũng là `.idfc`).
Cấu trúc **vỏ chung + ruột theo loại**: `meta` (id · tên · `kind` · phạm vi · thẻ · người tạo) +
`body` đổi theo `kind` + `commerce?` + `progress?`.

**Ba ràng buộc bắt buộc:**
1. **Một chiều** — `.idfc` → các chặng. Sửa ở dự án A **không** đổi mẫu gốc của kho.
2. **Bản chèn giữ liên kết + giữ ĐÈ CỤC BỘ** — dự án này muốn ghế cao 450 thì đè tại bản chèn.
3. **Ghim phiên bản** — nâng cấp mẫu gốc **không được** phá dự án cũ.

⚠️ **Bốn định dạng là hợp lý** (chúng lưu bốn thứ khác nhau thật) — **nhưng bốn BỘ MÁY LƯU thì
không**. Phải có **một xương sống chung**: phiên bản · đường nâng cấp · **nhãn nguồn gốc** · phạm
vi · kiểm toàn vẹn. Mỗi đuôi chỉ khai phần **ruột** riêng. Nay chỉ `.idfc` có đường nâng cấp thật.

## 9 · LƯU Ở ĐÂU — chung ↔ máy

| Loại | Lưu ở đâu | Vì sao |
|---|---|---|
| **VẬT** — vật liệu · cấu kiện · bản vẽ · deck | **CHUNG, ai cũng thấy** | nó là **tài sản** |
| **CẤU TRÚC VIỆC** — chuỗi công đoạn · dây nối · vị trí node | **CHUNG** | ai mở cũng phải thấy **cùng một dây chuyền** |
| **CÁCH BÀY TRÊN MÀN CỦA TÔI** — cỡ kéo tay · nấc · panel thu/mở | **MÁY MÌNH** | mỗi người một màn, một thói quen |

**Và CÁCH LÀM cũng là tài sản:** bố cục, chuỗi công đoạn đã nối, khung tư duy, preset, quy ước —
chúng **sống lâu hơn mọi dự án**. ⇒ **Cách làm là MỘT MỤC THƯ VIỆN có phiên bản; dự án chỉ THAM
CHIẾU.** Nhét cách-làm vào tệp dự án là mỗi dự án một bản sao — sửa một lần phải mở lại năm mươi
dự án, đúng thứ cần tránh.

## 10 · TỪ VỰNG — ba tầng, và luật chống khái niệm ma

| Tầng | Ví dụ | Ai đặt nghĩa |
|---|---|---|
| **NGHỀ** | tường · cấu kiện · mặt cắt · BOQ | **ngành** — IF không được đổi |
| **SẢN PHẨM** | chặng · cửa sổ công cụ · thư viện · dàn ý | **IF** — người dùng thấy |
| **KỸ THUẬT** | `ToolWindow` · `WallRun` · `cadMode` | chỉ người code thấy |

> ⛔ **Một khái niệm được có nhiều tên CHỈ KHI chúng ở KHÁC TẦNG — và phải khai ánh xạ.**

`ToolWindow` (kỹ thuật) ↔ `cửa sổ công cụ` (sản phẩm) = **hợp lệ**. `master tool` = tên thứ hai
**cùng tầng** ⇒ **cấm**, đã khai tử.

**Luật đặt tên:** khi sổ đặt tên cho một thứ, **phải kiểm code đã có tên chưa**. Đặt tên mới cho
thứ đã có tên là đẻ **khái niệm ma** — tồn tại trong đầu người viết sổ, không tồn tại với người đọc code.

**Ba con ma đã bắt (16/08), cùng một họ:** `master tool` (26 lần trong sổ / 0 trong code) ·
`KB-5` (lan 14 chỗ, chưa bao giờ được định nghĩa) · `.idfnotes` (0 code).
⚠️ **Quét riêng từng bên thì mỗi bên đều nhất quán, không bên nào báo lỗi** — chỉ **đối chiếu sổ ↔
code** mới lộ. Đó là máy soi quan trọng nhất còn thiếu.

## 11 · CÁI GÌ **KHÔNG PHẢI** CÁI GÌ — chống hiểu lệch

| Thứ này | **không phải** | mà là |
|---|---|---|
| Cửa sổ công cụ | thanh công cụ | **một môi trường làm việc**, cụm khung + vệ tinh, sống trên canvas |
| Thư viện | kho để đi tìm | thứ **mang đồ tới** — hiểu ngữ cảnh, đề xuất đúng |
| Files | chợ đầu mối | **phần thô dùng chung**, chưa đủ để render |
| Màu | một mục | **một bước** trong chọn vật liệu |
| Ba nấc | ba cỡ | **ba công năng** |
| Đồng bộ | nối hai thứ | **không tách chúng ra** |
| Sổ vàng `00-CHOT` | bản đồ | **nhật ký** — file này mới là bản đồ |

---

# PHẦN CẬP NHẬT — theo ngày, chung chỗ với dữ liệu full

**Cơ chế:** mỗi lần kiến trúc đổi, **viết lại phần cốt lõi ở trên** (không cộng dồn), và đặt
**bằng chứng + chi tiết đầy đủ** vào `docs/memory/sessions/<YYYY-MM-DD>/` — **chung thư mục với
dữ liệu full của ngày đó**, để lý do và chứng cứ nằm cạnh nhau.

**Mỗi mục một dòng ở đây: ngày · đổi gì ở cốt lõi · trỏ tới thư mục ngày.**

| Ngày | Đổi gì ở CỐT LÕI | Dữ liệu full |
|---|---|---|
| 2026-08-17 | **§5** Files có **hai ngăn khác bản chất** (Hoà chốt) · **§6 đính chính**: hàm nối ba mảnh **đã có** (`resolve.ts:52`, 07/08), chưa cắm điện — câu "0 code, đo lại 16/08" là số chép lại, không phải phép đo | `docs/memory/sessions/2026-08-17/` |
| 2026-08-16 | Lập bản này thay `IF-ARCHITECTURE-COMPASS` (29/07, mồ côi 19 ngày). Mới: §2 bốn bề mặt · §3 sidebar hai cụm · §5 dòng chảy Files→Thư viện · §6 định nghĩa Đồng bộ · §7 ba nấc ba công năng · §9 luật lưu chung↔máy · §10 từ vựng ba tầng · §11 bảng chống hiểu lệch | `docs/memory/sessions/2026-08-16/` |

**Luật giữ:**
1. Phần cốt lõi **KHÔNG TÁCH** — một khối liền, đọc một mạch.
2. Cốt lõi **viết lại**, không thêm đuôi. Thấy nó dài ra là dấu hiệu đang biến thành nhật ký.
3. Chi tiết, lập luận, số đo, bằng chứng → **thư mục ngày**, không nhét vào cốt lõi.
4. Đổi tên một tài liệu nền → **sửa mọi con trỏ ngay lượt đó**. Để lại mẩu chuyển hướng là **chưa
   xong việc** — mẩu cụt đọc ra như một tệp rỗng, và đó đúng là cách bản đồ cũ chết.
