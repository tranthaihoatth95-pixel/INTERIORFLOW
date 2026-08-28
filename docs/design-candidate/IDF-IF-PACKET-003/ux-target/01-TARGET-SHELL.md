# IF · TARGET — VỎ ỨNG DỤNG (Left Router · Thanh trên · Khung chung)

`IF-UX-VISUAL-REALIGNMENT-001` · gói `IDF-IF-PACKET-003` · trạng thái **CANDIDATE · chờ Hoà duyệt mắt**
HEAD đo: `63de2d8` · nhánh `checkpoint/2026-08-24-control-plane` · lập 27/08/2026

---

## 0 · BẬC BẰNG CHỨNG — ĐỌC TRƯỚC

| mục | giá trị |
|---|---|
| Bậc | **ĐỌC MÃ TẠI HEAD `63de2d8`** + **kế thừa runtime proof** của `ux/01-RUNTIME-UI-GAP-MAP.md` (web dev server, lượt 1 chưa đăng nhập · lượt 2 đã đăng nhập) |
| ⛔ Không có | dev server mới, ảnh mới, Electron đóng gói. Lượt này **CHỈ ĐỌC**, không được chạy server ghi vào cây |
| Nhãn tổng | **`PARTIAL — contract/design proof trên mã tại HEAD`** · ⛔ cấm đọc thành PASS |
| Mọi giá trị thẩm mỹ | **`PROPOSED`** — chờ Hoà |

🔴 **Mọi mock/canvas cũ (`docs/mocks/*.dc.html`, `Vitals.dc.html`, `claude-login-home-ambient-final.html`)
là `CANDIDATE / NOT FINAL TARGET`.** Tệp này **không** lấy cái nào làm chuẩn; chỗ nào trích chúng thì
trích làm **dấu vết lịch sử**, không làm target.

### 0.1 · Ràng buộc của Hoà mà tệp này thi hành
1. **Canvas thoáng.** **Liquid Glass CHỈ ở cạnh nổi / tạm thời.** Không phủ toàn màn, không làm nền.
2. **Left Router 52px, chỉ icon, HAI zone.**
3. **Thanh trên: app status → Search/Vitals → profile**, đúng thứ tự đó.

---

## 1 · TARGET

### 1.1 · KHUNG CHUNG — ba vật thường trực, một canvas

Vỏ IF gồm **đúng ba vật thường trực** và **một canvas**. Không có vật thứ tư nào được quyền
thường trực.

| ổ | vật | bề rộng/cao | vai trò một câu | nền |
|---|---|---|---|---|
| ⓵ | **Left Router** | **52px cứng** | *tôi đang ở đâu trong app* | ĐẶC (`--panel`) |
| ⓶ | **Thanh trên** | 48px (42px khi có logo menu) | *tôi đang ở ngữ cảnh nào · tôi nên biết gì · tôi là ai* | ĐẶC (`--panel`) |
| ⓷ | **Bottom Dock** | xem `03-TARGET-DOCK.md` | *tôi làm được gì với thứ trước mặt* | **KÍNH** (cạnh nổi, tạm thời) |
| — | **Canvas** | phần còn lại | nội dung là nhân vật chính | `--bg`, **không vật liệu** |

**Neo mã hiện trạng:** ba ổ này đã có thật — `components/nav/RailDieuHuong.tsx` (⓵) ·
`components/studio/AppChrome.tsx:255` (⓶) · ổ ⑤ toolbelt của `components/studio/AppShell.tsx:23-24,75` (⓷).
Target không đẻ khuôn thứ hai (M-26).

#### Luật vật liệu của vỏ — CHỖ NÀY LÀ NƠI RÀNG BUỘC ① CỦA HOÀ ĐƯỢC THI HÀNH

```
ĐẶC   (--vl-dac = --panel)  → Left Router · Thanh trên · panel thường trực · biểu mẫu
KÍNH  (--kinh-mong)         → CHỈ: Bottom Dock · Vitals Peek · viên ngữ cảnh nổi · lớp phủ tạm
KHÔNG VẬT LIỆU              → Canvas
```

Ba mức này **không phải phát minh của tệp này** — chúng đã được khai và giải thích tại
`app/globals.css:266-277` (*"KÍNH PHẢI ĐÁNG. Nó là NGOẠI LỆ có lý do, không phải mặc định"*),
và ba nấc độ đặc theo **lượng chữ** ở `app/globals.css:250-264`. Target chỉ làm một việc:
**gỡ kính khỏi hai vật thường trực**, để kính còn đúng nghĩa *cạnh nổi / tạm thời*.

> ⚠️ **MÂU THUẪN — GHI CẢ HAI VẾ, KHÔNG TỰ HOÀ GIẢI.** Xem §7 mục **X-1**: thanh trên hiện đang
> là kính (`AppChrome.tsx:255` dùng class `.nen-mo-header`), và `app/globals.css:256` liệt kê
> *"thanh trạng thái"* là nơi hợp lệ của `--kinh-mong`.

---

### 1.2 · LEFT ROUTER — 52px, CHỈ ICON, HAI ZONE

#### Bề rộng
**52px cứng, ở mọi route, mọi chặng, mọi viewport ≥ 768px.**
Neo: `components/nav/muc-dieu-huong.ts:133` `BE_RONG_NAC = { dinhVi: 52, dieuHuong: 240, duyet: 320 }`
và khối chú thích `:108-131` giải thích con số 52 là **PHÂN GIẢI** của mâu thuẫn 28↔52 đóng 23/08
(`IF-CANONICAL` §10 `[CHỐT]`). Hàng rộng `52 − 2×4 lề = 44px` — vừa đủ ô icon 20×20 và nút 32px.

⚠️ Runtime hiện **không đứng yên ở 52**: `RailDieuHuong.tsx:98` chọn nấc mặc định
`dangTrongChang ? 'dinhVi' : 'dieuHuong'` ⇒ **ngoài chặng, rail rộng 240px**. Ràng buộc của Hoà
đóng cửa đó lại: **52 là hằng số, không phải mặc định của một máy trạng thái ba nấc.**
Xem mâu thuẫn **X-2** ở §7.

#### Nội dung: CHỈ ICON
Không nhãn chữ, không badge số, không avatar, không nút "Tạo bằng AI" (xem §2 R-04).
Tên mục tới người dùng bằng **ba đường, không đường nào là hover-only**:
1. `aria-label` thật trên mỗi nút (đóng gap `#15`);
2. **viên ngữ cảnh** nở ra từ chính nút khi hover **hoặc focus bàn phím** (không phải `title`);
3. Command Palette `⌘K` — đường chữ đầy đủ, không phụ thuộc chuột.

> **Vì sao cấm `title`:** M-03 (`IF-UXUI-OPERATING-MEMORY.md`) — lý do đặt trong `title`
> *"câm trên cảm ứng, Tab bỏ qua nút `disabled`"* ⇒ **không bao giờ tới được ai**.

#### HAI ZONE — là gì và VÌ SAO tách

| zone | tên | mục | ràng buộc route | vì sao đứng riêng |
|---|---|---|---|---|
| **Z1** | **VIỆC** (`viec`) | Trang chủ · Dự án · Cảm hứng · Thư viện | mục khai `duong` — **đường tuyệt đối, sống không cần dự án nào** | Đây là **bản đồ app**. Bốn mục này **luôn đi tới được**, ở mọi trạng thái phiên. Chúng không bao giờ mờ, không bao giờ cần điều kiện |
| **Z2** | **CHẶNG** (`chang`) | Thiết kế 2D · Thiết kế 3D · Trình chiếu | mục khai `duoi` — **đuôi sau `/projects/<id>/`, chỉ có nghĩa khi đã mở một dự án** | Đây là **bản đồ trong một dự án**. Ba mục này **có điều kiện tiền đề**: không có dự án ⇒ không có đích |

**Ranh giới không phải thẩm mỹ, nó là KIỂU DỮ LIỆU.** Neo: `components/nav/muc-dieu-huong.ts:186-195`
khai rõ điều kiện "cần dự án" đọc từ **chính trường `duoi`**, không suy từ cụm; và `duongCua()`
(cuối tệp) trả `null` khi `duoi` có mà `duAnId` rỗng. Hai zone = **hai lớp đường dẫn khác hẳn nhau**:
một lớp luôn phân giải được, một lớp phân giải theo phạm vi.

Thứ tự dọc `viec` → `chang` đã chốt 23/08 (`muc-dieu-huong.ts:293-300`): VIỆC ở trên vì nó sống
độc lập; CHẶNG ở dưới vì nó là thứ tay chạm nhiều nhất trong một phiên sáng tác.

Hai zone tách bằng **một khoảng thở + một hairline `--border`**, không bằng nhãn chữ
(`NHAN_CUM` ở `:291-294` vẫn giữ trong mã cho `aria` và cho nấc rộng, nhưng **không vẽ ra ở 52px**).

#### Z2 khi chưa có dự án — bốn cách sai, một cách đúng
| cách | phán quyết |
|---|---|
| ẩn hẳn Z2 | ❌ mất bản đồ; người dùng không biết app có ba chặng |
| hiện nút mờ, lý do trong `title` | ❌ M-03 |
| hiện nút bấm được, trỏ vào một id đoán mò | ❌ **đây đúng là `L2-02` đang xảy ra** |
| hiện nút mờ + lý do đọc được **trong luồng**, và bấm vào mở **bộ chọn dự án** | ✅ **TARGET** |

Cách đúng: Z2 hiện đủ ba icon ở trạng thái **mờ có lý do**, `aria-disabled="true"` +
`aria-describedby` trỏ một dòng chữ thật trong DOM (*"Chưa mở dự án — chọn một dự án ở Trang chủ"*),
và **cử chỉ bấm không chết**: nó mở bộ chọn dự án ngay tại chỗ, đúng luật §10 *"No silent click"*.

---

### 1.3 · THANH TRÊN — BA VÙNG, ĐÚNG THỨ TỰ HOÀ CHỐT

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ⓵ APP STATUS          ⓶ SEARCH · VITALS (tâm vùng làm việc)     ⓷ PROFILE   │
│   logo · ngữ cảnh        ô tìm      khẩu độ Vitals                thông báo  │
│   (dự án · chặng)                                                 hiện diện  │
│                                                                   avatar     │
└──────────────────────────────────────────────────────────────────────────────┘
```

Thứ tự này **đã đúng trong mã** và target giữ nguyên — đây là chỗ hiếm hoi runtime khớp ràng buộc:
`AppChrome.tsx:330` (vùng ⓵, marker `data-if-cum-trai-tren`) → `:374` (cụm
`data-tour="home-search-vitals"`) → `:388` `<VitalsAperture/>` → `:403` `<CumPhaiTren/>`.
Chú thích `:394-397` tự khai đúng luật: *"thứ tự đọc trái→phải phải là ngữ-cảnh → Vitals → danh-tính;
đảo lại thì avatar chen vào giữa ô tìm và khẩu độ."*

#### ⓵ APP STATUS — *tôi đang ở ngữ cảnh nào*
Hai tầng, không hơn: **dự án · chặng**. (Không có tầng "Workspace" — đo tại nguồn:
schema không có model `Workspace`, xem chú thích `AppChrome.tsx:322-326`.)

**TARGET · trạng thái chưa có tên:** ô để **TRỐNG** kèm một lời mời đặt tên, **không bịa tên**.
Neo: `AppChrome.tsx:344-357` đã thi hành đúng luật này cho chuỗi `'Untitled flow'`
(*"CHƯA ĐẶT TÊN THÌ ĐỂ TRỐNG"*), **nhưng chỉ nửa đường** — `DaiNguCanh.tsx:79` vẫn viết
`tenDuAn || tr('Chưa đặt tên','Untitled')`, tức tầng dưới **vẫn đúc một cái tên** từ chuỗi rỗng
mà tầng trên vừa cẩn thận truyền xuống. Đây là `L2-05`, **còn sống tại HEAD `63de2d8`** (đã mở tệp đọc dòng).

#### ⓶ SEARCH · VITALS — *tôi nên biết gì*
- **Ô tìm** phải sống ở **mọi route**, không chỉ Home. Runtime hiện: `AppChrome.tsx:375`
  `{active === 'home' && <SearchProjectsInput />}` ⇒ ô tìm **biến mất** khi vào chặng.
  Ràng buộc của Hoà đặt Search vào vùng thường trực ⇒ target là **một ô tìm thường trực đổi PHẠM VI
  theo ngữ cảnh** (ở Home: tìm giữa các dự án · trong dự án: tìm trong dự án đó), **không phải hai ô**.
- **Khẩu độ Vitals** giữ nguyên chỗ dành riêng, neo theo **tâm vùng làm việc**, không nằm trong
  một cụm flex (`AppChrome.tsx:379-387` đã ghi lý do đắt giá: nằm trong flex là *"neo nhầm hệ"*).
- ⛔ **Hai hệ, cấm nhập một**: Vitals = *tôi nên biết gì* · cụm phải = *tôi là ai*
  (`AppChrome.tsx:392-393`).

#### ⓷ PROFILE — *tôi là ai / ai đang ở đây*
Thông báo · hiện diện · avatar. **Tự ẩn khi chưa đăng nhập** (đã đúng ở `CumPhaiTren`), và phần
hiện diện tự ẩn khi chỉ có một mình — không giữ chỗ trống (M-12).

---

### 1.4 · KHUNG CHUNG PHẢI THẬT SỰ DÙNG CHUNG

**Một vỏ, không hai.** Gap map đo được **hai vỏ thứ hai** đang sống:
`/library/ingest` (nền đen chữ vàng đồng, không rail, không thanh trên — dòng `#12`) và
`/workhub` (một sản phẩm khác hẳn — dòng `#8`, `#28`).

**TARGET:** mọi route sản phẩm mount đúng **một** vỏ. Route nào không mount được vỏ chung thì
**không phải một route sản phẩm** — nó là route dev, và route dev **không được ship tới được** (M-35).
Quyết định giữ/giấu/gỡ `/workhub` là **quyết định của người** (gap map `#28`), tệp này không chọn.

---

## 2 · REJECT — điều bị cấm, kèm CƠ CHẾ SAI

| mã | bị cấm | cơ chế sai — đã trả giá ở đâu |
|---|---|---|
| **R-01** | **Liquid Glass làm nền của Left Router / Thanh trên / canvas** | Kính ăn **0,5–1,0 điểm tương phản** — đo trên app thật 20/08, 4 nền × 2 theme: `--t3` trên kính mỏng chỉ còn **4.08 (Tối) · 3.83 (Sáng)**, dưới ngưỡng AA 4.5 (`app/globals.css:290-299`). Vật **thường trực** mà tương phản chạy theo nền là biến a11y thành biến số. Luật đã ghi: *"ĐỌC ĐƯỢC THẮNG TRONG SUỐT"* (`:250-253`) và *"KÍNH PHẢI ĐÁNG"* (`:266`) |
| **R-02** | **Kính chồng kính · mờ dày · phủ tím · acrylic dày** | Cấm nguyên văn tại `app/globals.css:277`. Và **F-14**: một cơ chế chứng minh (lưới nét thẳng) đặt sau một mặt **đục** — *"the thing is there; it does nothing"*. Màng tím đè lên kính là cùng họ: nó **trông** như chiều sâu, nhưng nó xoá mất chính đường quang mà kính dùng để chứng minh mình là kính (M-43: **rìa phải đặc hơn tâm**) |
| **R-03** | **Rail nở ra 240/320 làm mặc định ngoài chặng** | Hoà chốt 52px cứng. Runtime `RailDieuHuong.tsx:98` đang lấy 240 làm mặc định ⇒ ngoài chặng, canvas mất **188px** bề ngang cho một cột chữ mà người dùng chưa xin. Đây là M-10 ở tầng bố cục: *"một phần tử không xứng đáng tồn tại chỉ vì có chỗ trống"*. ⚠️ Mâu thuẫn **X-2**, không tự hoà giải |
| **R-04** | **Mục điều hướng CHẾT trong rail** — cụ thể `NutTaoAi` với lý do *"Cửa tạo bằng AI đang dựng — chưa nối"* | Neo còn sống tại HEAD: `RailDieuHuong.tsx:604` (render trong cụm `chang`) · `:672` · `:677`. Rail là **bản đồ app**; một mục trên bản đồ nói *"chưa dựng"* là bản đồ vẽ một con đường chưa có. §1.3 hợp đồng *"no dead interaction"* · §10: ẩn chỉ được vì **quyền/bảo mật**, không vì **chưa làm xong**. Gap map `#14` + `L2-10` chứng minh nó **không** phải hệ quả của việc chưa đăng nhập — nó là hằng số |
| **R-05** | **Rail trỏ vào một id đoán mò** | `L2-02`: `RailDieuHuong.tsx:270-281` lấy `moiNhat` từ `d.flows` rồi `setDuAnMayChu(moiNhat.id)` — **id của một FLOW gán vào biến DỰ ÁN** — rồi ghép vào `/projects/<id>/…`. Ba lối vào chính của app trỏ vào một dự án **không tồn tại**. Lẫn kiểu id ở tầng điều hướng là **dữ liệu giả ở chỗ đắt nhất** (`IF-CANONICAL` §3 luật 5) |
| **R-06** | **Hai bộ phận của cùng một vỏ trả lời khác nhau câu *tôi đang ở đâu*** | `L2-05` + `L2-02` cùng một khung hình: thanh trên nói *"Chưa đặt tên"*, rail trỏ `cmrfb3apo…`. §3.1 *persistent chrome* đòi **MỘT** nguồn ngữ cảnh. Hai nguồn = không có nguồn nào |
| **R-07** | **In mã giao thức lên mặt người dùng** (`HTTP 401`) | Đo được ở `#5` (`MaterialFormModal.tsx:118`) và `#6` (`TaskBoardScreen.tsx:157`). `401` không phải một câu; nó là **một mã dành cho máy**, và ở cạnh nó thường có một câu **mâu thuẫn với chính nó** (*"Không có vật liệu nào khớp"*) |
| **R-08** | **Kể một lỗi quyền thành lỗi mạng** | Ba lần đo được: `#1` (`ProjectSelect.tsx:1388`) · `#19` (`GalleryLienNganh.tsx:231`) · `#22` (toast phiên). Cơ chế sai: nó **đổi việc người dùng phải làm** — "kiểm tra kết nối" là một việc vô ích khi nguyên nhân là phiên hết hạn |
| **R-09** | **Trang trắng khi mở deep-link** | `#7`: `app/colors/page.tsx:29-31` và `app/library/page.tsx:28-29` `return null` rồi `router.back()` ⇒ **12 giây trắng tinh**, và với `history.length > 1` thì app **bật người dùng ra ngoài**. Storyboard C-03 REJECT: *"canvas trắng không lý do"* |
| **R-10** | **Nút thoát hiểm không đi tới đâu** | `#10`: *"Vào canvas trống"* — chính cái nút viết ra để *"user không bao giờ kẹt"* (`ProjectSelect.tsx:124`) — bấm xong **18 giây vẫn nguyên màn cũ**. §10 *"No silent click"* |
| **R-11** | **Render vỏ đầy đủ cho người chưa có quyền** | `#11`: người chưa đăng nhập nhận rail, thanh trên, ô tìm, nút Vitals, và một tên ngữ cảnh cho dự án không tồn tại. §13: isolation **trước** fetch/render. `02-STATE-CONTRACT.md` §4: che bằng CSS là cùng bệnh với M-03 — *"thông tin đã rời máy chủ, chỉ có mắt là không thấy"* |
| **R-12** | **Một route treo vĩnh viễn** | `L2-01`: 9 luồng `tokio-runtime-worker` của Prisma kẹt cùng một stack; `lib/server/db.ts:5` `new PrismaClient()` **trần**, không `pool_timeout`. Hệ quả UX: **app không bao giờ đạt trạng thái lỗi** ⇒ ĐANG TẢI nuốt mất TẢI HỎNG. Một trang tải mãi mãi **là tiến độ giả ở mức hệ thống** |
| **R-13** | **Vỏ thứ hai cho một route sản phẩm** | `#12` `/library/ingest` · `#8` `/workhub`. M-26: *"cái gì đã gọi là dùng chung thì phải THẬT SỰ dùng chung"*; đẻ khuôn thứ hai là bắt đầu phân kỳ |

---

## 3 · CẢNH — route · state · viewport

> Mọi cảnh ghi ở **cả hai viewport bắt buộc**: `1440×900` và `393×852`.

| # | cảnh | route | state | 1440×900 | 393×852 |
|---|---|---|---|---|---|
| **S-01** | Vỏ · có quyền, có dữ liệu | `/` | CÓ DỮ LIỆU | Rail 52 · thanh trên 3 vùng · dock đáy · canvas chiếm phần còn lại | Rail **thu thành thanh đáy 5 icon** (Z1 4 mục + 1 nút mở Z2); thanh trên rút còn ngữ cảnh + Vitals; profile vào menu sau avatar |
| **S-02** | Vỏ · chưa mở dự án | `/`, `/projects` | CÓ DỮ LIỆU | Z2 ba icon **mờ có lý do**, bấm mở bộ chọn dự án | như trên, Z2 nằm sau nút "Chặng" ở thanh đáy |
| **S-03** | Vỏ · chưa đăng nhập | mọi route | KHÔNG CÓ QUYỀN | **Rail chỉ còn Z1 rút gọn** (Trang chủ · Cảm hứng công khai nếu có); **không** thanh ngữ cảnh, **không** Vitals, **không** cụm profile. Một câu nói đúng nguyên nhân + một đường đăng nhập | như trên, một cột |
| **S-04** | Vỏ · phiên hết hạn giữa chừng | mọi route | KHÔNG CÓ QUYỀN (401 từ phép đo) | Vỏ **giữ nguyên bố cục**, nội dung phạm vi biến mất, một dải nói *"phiên đã kết thúc"* + *"bản vẽ vẫn ở máy"* + nút đăng nhập lại **tại chỗ** (không đá về `/login` — mất ngữ cảnh) | như trên, dải đứng đáy trên dock |
| **S-05** | Vỏ · máy chủ kẹt | mọi route | TẢI HỎNG | Sau `pool_timeout`, vỏ chuyển sang **màn hỏng thật**: cái gì hỏng · từ lúc nào · thử lại · và **việc làm được ngoại tuyến**. ⛔ không con quay vô hạn | như trên |
| **S-06** | Vỏ · deep-link vào route cần phạm vi | `/library`, `/colors` | KHÔNG CÓ DỮ LIỆU / KHÔNG CÓ QUYỀN | Vỏ mount **trước**, rồi bên trong nói thiếu gì. ⛔ không `return null`, ⛔ không `router.back()` | như trên |

**Ghi chú viewport 393×852:** ở `< 768px` **rail dọc không tồn tại** — bản đồ app đi xuống thanh
đáy. Đây **không** phải "rail thu nhỏ": 52px dọc ở màn 393 ăn 13% bề ngang cho một thứ ngón cái
không với tới. `NOT ASSESSED` — chưa đo được hành vi rail hiện tại ở 393px (không chạy server; gap
map lượt 1 chỉ chụp `/login` ở 393, dòng `#26`).

---

## 4 · MOTION INTENT — chuyển động BÁO HIỆU điều gì

> Thang nhịp là `lib/ui/nhip.ts:27-33` — `bam 130 · vien 170 · bang 220 · nguCanh 300 · bienHinh 460`.
> **Cấm gõ số ms tại chỗ.** Đóng nhanh hơn mở ~0,8× (`:46-49`).

| chuyển động | báo hiệu điều gì | tương đương khi `prefers-reduced-motion` |
|---|---|---|
| **Viên tên nở ra TỪ nút rail** (`vien` 170ms) | *"chữ này thuộc về icon vừa chạm"* — giữ trí nhớ không gian, và là lý do vì sao 52px chỉ-icon vẫn học được | Viên **hiện thẳng, 0ms**, vẫn neo cạnh nút. Thông tin (*thuộc về ai*) truyền bằng **vị trí**, không bằng đường đi |
| **Zone Z2 chuyển từ mờ sang rõ** (`bam` 130ms) khi vừa mở một dự án | *"tiền đề vừa đủ — ba chặng nay đi tới được"*. Đây là **thông báo về QUYỀN ĐI**, không phải trang trí | Bỏ chuyển tiếp; phân biệt bằng **độ sáng + hairline zone**, đọc được ở khung tĩnh. Kèm một dòng `aria-live="polite"`: *"Đã mở dự án X — ba chặng đã dùng được."* |
| **Thanh ngữ cảnh trượt một tầng** (`nguCanh` 300ms) khi vào/ra một chặng | *"bạn vừa đi sâu thêm một tầng"* — chiều sâu điều hướng | Hiện thẳng. Chiều sâu truyền bằng **số tầng đọc được** trong dải (dự án → chặng) |
| **Dock đổi nội dung** (`bienHinh` 460ms) | xem `03-TARGET-DOCK.md` §4 | — |
| ⛔ **KHÔNG có** chuyển động nào trên rail khi đứng yên | — | — |

**Luật cứng:** `prefers-reduced-motion` ⇒ thời lượng về **0ms (hiện thẳng)**, không phải "chậm lại".
Quyết định ở **một chỗ duy nhất** `lib/ui/nhip.ts:89-93`; nơi gọi **không được** tự `matchMedia`
rồi chế nhánh riêng.

---

## 5 · NĂM TRẠNG THÁI TÁCH BẠCH TRÊN VỎ

`KHÔNG CÓ DỮ LIỆU ≠ ĐANG TẢI ≠ TẢI HỎNG ≠ KHÔNG CÓ QUYỀN ≠ BẰNG KHÔNG`

Gap map §L2.3 đo được **6/7 bề mặt gộp trạng thái**. Vỏ là nơi trục này phải **không sập nữa**, vì
mọi màn khác thừa kế nó.

| trạng thái | vỏ làm gì · CHÍNH XÁC | dấu hiệu phân biệt ở KHUNG TĨNH | đóng gap nào |
|---|---|---|---|
| **KHÔNG CÓ QUYỀN** (S4) | **Cửa quyền chạy TRƯỚC mọi yêu cầu dữ liệu.** Vùng ngữ cảnh · Vitals · cụm profile **không tồn tại trong cây render** — không placeholder, không `aria-label`, không tooltip. Rail còn Z1 rút gọn | Vỏ **thiếu hẳn hai vùng**; bố cục vẫn đứng (M-12: ô co theo nội dung) | `#11` `#9` `#3` |
| **ĐANG TẢI** (S2) | Dấu hiệu đang chạy **gắn vào đúng ô đang chờ**, không chiếm chỗ số cũ. **Có trần thời gian**: quá `pool_timeout` ⇒ sang TẢI HỎNG, không ở lại | Skeleton **chỉ ở ô đang chờ**, phần vỏ đã biết vẫn đặc | `L2-01` `#6` |
| **TẢI HỎNG** (S3) | Một **màn hỏng thật**: *cái gì hỏng · từ lúc nào · thử lại · làm được gì ngoại tuyến*. ⛔ Không mã HTTP. ⛔ Không dùng lại pixel của KHÔNG CÓ QUYỀN | Khối lỗi có **mốc thời gian** — thứ mà màn KHÔNG CÓ QUYỀN không bao giờ có | `#1` `#2` `#5` `L2-01` |
| **KHÔNG CÓ DỮ LIỆU** (S1) | Vỏ đủ, nội dung nói **việc kế tiếp**, không nói số. ⛔ Không `0`, không khung rỗng chờ nội dung | Có **một hành động chính**, không có ô số nào | `#20` `#21` |
| **BẰNG KHÔNG** (S5) | Số `0` chỉ hiện khi **khai được phạm vi phép đo** ("0 cái gì"). Mặc định là **IM** | Con số 0 **luôn đi kèm một câu phạm vi**; thiếu câu đó ⇒ không được hiện | `#20` |

**Máy phân biệt S3 ↔ S4 — một câu, kiểm được:** *đã thử và bị từ chối* (S3, có mốc thời gian, có
nút thử lại) ≠ *biết trước là không được phép* (S4, không có mốc, không có nút thử lại, ô không tồn tại).
Neo: `02-STATE-CONTRACT.md` §4 bảng hệ quả · `lib/server/access.ts:31` (404 thay 403).

**Máy phân biệt S1 ↔ S5 — giữ ở KIỂU, không ở pixel:** `undefined` ≠ `0`, cấm `?? 0`.
Neo: `components/studio/vitals-tin-hieu.ts:21-26`.

---

## 6 · NEO VÀO P0/P1 CÓ THẬT TRONG GAP MAP

| dòng gap map | hạng | dòng target đóng nó |
|---|---|---|
| `#1` `#2` Projects: 401 kể thành lỗi mạng; S3≡S4 chung một màn | P0 | §5 (bảng năm trạng thái) · R-07 · R-08 |
| `#5` Vật liệu: `HTTP 401` + "không có vật liệu nào khớp" | P0 | R-07 · §5 (S3 ≠ S1) |
| `#6` Bảng việc: 401 kể thành kho rỗng + skeleton vĩnh viễn | P0 | R-07 · §5 (S2 có trần thời gian) |
| `#7` deep-link `/library` `/colors` ra trang trắng | P0 | R-09 · S-06 |
| `#8` `/workhub` một sản phẩm khác | P0 | §1.4 · R-13 (**quyết định giữ/gỡ là của người**) |
| `#9` Cài đặt render cho người chưa đăng nhập | P0 | §5 hàng S4 (cửa quyền trước render) |
| `#10` nút thoát hiểm không đi tới đâu | P0 | R-10 |
| `#11` vỏ đầy đủ cho người chưa có quyền | P1 | §5 hàng S4 · S-03 |
| `#12` vỏ thứ hai ở `/library/ingest` | P1 | §1.4 · R-13 |
| `#13` rail thiếu Tri thức/Knowledge | P1 | ⛔ **KHÔNG đóng** — mâu thuẫn M-3, chờ Hoà (xem X-3) |
| `#14` `L2-10` mục "Tạo bằng AI" chết trong rail | P1 | R-04 |
| `#15` ba nút chặng không có tên khả truy cập | P1 | §1.2 (ba đường tới tên, không hover-only) |
| `#22` toast phiên nói sai nguyên nhân | P1 | R-08 · S-04 |
| `#24` `/share/<token sai>` không vỏ, không đường về | P1 | §1.4 (route công khai vẫn phải có một đường về app) |
| `#32` `L2-11` nấc rail 52px chưa đo được bề rộng thật | NOT ASSESSED | §7 N-1 |
| `L2-01` route treo vĩnh viễn | P0 | R-12 · §5 hàng S2/S3 |
| `L2-02` rail trỏ id flow vào đường project | P0 | R-05 · §1.2 (Z2 mờ có lý do) |
| `L2-05` thanh ngữ cảnh bịa tên | P1 | §1.3 ⓵ · R-06 |
| `L2-09` cold open chuyển sang `/intro` kể cả khi đã đăng nhập | P1 | ⛔ **KHÔNG đóng** — mâu thuẫn M-2, chờ Hoà (xem X-4) |

---

## 7 · MÂU THUẪN — GHI CẢ HAI VẾ, KHÔNG TỰ HOÀ GIẢI

**X-1 · Kính trên thanh trên.**
· **Vế Hoà:** Liquid Glass CHỈ ở cạnh nổi/tạm thời ⇒ thanh trên (thường trực) phải ĐẶC.
· **Vế hợp đồng đang chạy:** `app/globals.css:256` liệt kê *"thanh trạng thái"* là nơi hợp lệ của
`--kinh-mong`, và `AppChrome.tsx:255` đang dùng `.nen-mo-header`. Hệ token có một số đo đi kèm
(4 nền × 2 theme) đứng sau lựa chọn đó.
⇒ Hai vế không tự dung hoà được: hoặc gỡ kính khỏi thanh trên (và bỏ một nhánh của bảng token),
hoặc nới định nghĩa *"cạnh nổi"* để phủ cả chrome thường trực. **Quyết định của Hoà.**

**X-2 · 52px cứng ↔ ba nấc công năng.**
· **Vế Hoà:** Left Router **52px**, chỉ icon.
· **Vế hợp đồng đang chạy:** `muc-dieu-huong.ts:108-131` chốt **BA NẤC LÀ BA CÔNG NĂNG**
(52 *"tôi đang ở đâu"* · 240 *"tôi đi đâu được"* · 320 *"ở đó đang có gì"*), có `IF-CANONICAL` §10
`[CHỐT]` đứng sau, và `RailDieuHuong.tsx:98` lấy 240 làm mặc định ngoài chặng.
⇒ Nếu 52 là hằng số thì **hai công năng kia mất chỗ đứng** và phải được tái bố trí (ứng viên: viên
ngữ cảnh nở từ nút · Command Palette · một panel gọi theo yêu cầu). Tệp này **không** chọn hộ.
⚠️ M-21 cảnh báo đúng chỗ này: *"che nấc to đi, nấc nhỏ vẫn đứng được một mình"* — nếu 52 đứng được
một mình thì hai nấc kia là **tuỳ chọn**, không phải nền tảng. Nhưng đó là một **lập luận**, không phải
một phép đo, và tôi không nâng nó thành quyết định.

**X-3 · Từ vựng rail: 4+3 ↔ ô "Nguồn & Tri thức".**
· **Vế runtime:** `MUC_RAIL` có đúng 7 mục, **không có Knowledge** (`muc-dieu-huong.ts:203-289`).
· **Vế hợp đồng ứng viên:** `DA-RESOURCE-027.1` đòi một ô Resources ba chế độ; và
`docs/design-authority/…` §14 mục 1 ghi rõ **đây vẫn là câu hỏi chưa quyết của Hoà**.
⇒ Đúng M-3 của gap map. **Cấm dựng theo bên nào.** Ràng buộc "HAI zone" của Hoà **không** trả lời câu
này — nó nói về *số zone*, không nói về *số mục trong Z1*.

**X-4 · Cold open.**
· **Vế hợp đồng:** `claude-cold-open.dc.html` — **320ms tới lúc gõ được**.
· **Vế runtime:** `IntroSequence.tsx:45` `SCENE_DURATIONS = [15000,10000,25000,10000]` = **60 000ms**,
và `L2-09` đo được `/` **tự chuyển sang `/intro` kể cả với phiên hợp lệ**.
⚠️ Ghi thêm một dữ kiện của lượt này: `git status` tại HEAD `63de2d8` cho thấy
`components/IntroSequence.tsx` ở trạng thái **`D` (đã xoá) trong cây làm việc của người ghi khác** —
tôi **không** kết luận gì từ đó vì tôi không được chạm cây và không đo được bản đang chạy.
`NOT ASSESSED` cho câu *"intro còn sống ở HEAD không"*.

---

## 8 · `NOT ASSESSED` — kèm lý do

| chỗ | vì sao chưa đánh giá được |
|---|---|
| **N-1** · Bề rộng THẬT của rail ở nấc `dinhVi` | Cần bấm nút thu rồi đọc `getBoundingClientRect().width`. Lượt này **chỉ đọc mã, không chạy server** (mệnh lệnh). Kế thừa `L2-11`, vẫn mở |
| **N-2** · Hành vi vỏ ở **393×852** ngoài `/login` | Gap map lượt 1 chỉ có một ảnh 393px (`#26`, route `/login`). Không có ảnh nào của vỏ đã đăng nhập ở 393. Mọi dòng "393" trong §3 là **PROPOSED**, không phải mô tả hiện trạng |
| **N-3** · Thanh trên có thật sự mount đủ ba vùng trên **mọi** chặng không | Đọc được thứ tự trong `AppChrome.tsx`, nhưng `CadStageScreen`/`Present` có thể thay slot. Chưa mở từng chặng — chặn: `#35` `#37` vẫn `NOT ASSESSED` trong gap map |
| **N-4** · `IntroSequence` còn sống ở HEAD không | Xem X-4. Cây làm việc đang bẩn bởi người ghi khác; tôi không được đọc bản làm dở như thể nó là HEAD (M-06: sai nguồn = kết luận sai) |
| **N-5** · Tương phản thật của mọi tổ hợp chữ/nền trong target | Chưa đo một số nào trong lượt này. Mọi khẳng định tương phản ở §2 là **trích số đã đo 20/08** (`app/globals.css:290-299`), không phải phép đo mới (M-05) |
| **N-6** · Electron đóng gói | Kế thừa `N-11` của gap map. Không thử, không được dùng bản `.app` cũ |

---

## 9 · THẨM QUYỀN

Tệp này chốt **CẤU TRÚC và NGỮ NGHĨA** của vỏ — có mấy vật thường trực, mỗi vật trả lời câu gì,
thứ tự đọc, ranh giới hai zone, năm trạng thái tách bạch, và điều gì bị cấm cùng cơ chế sai của nó.

⛔ **Tệp này KHÔNG chốt hình thái, màu, độ bo, khoảng cách, đường cong chuyển động.**
Mọi giá trị thẩm mỹ ở đây mang nhãn **`PROPOSED`**.

**Mắt và chuyển động cuối cùng là quyền của Hoà. Không agent nào thay.**
Chiếu `IF-CANONICAL` §2: Claude Design giữ thẩm quyền bố cục người dùng nhìn thấy · MAIN thi công ·
**chỉ Hoà** được nâng `CANDIDATE → APPROVED`. Gói này đang ở **CANDIDATE**.
