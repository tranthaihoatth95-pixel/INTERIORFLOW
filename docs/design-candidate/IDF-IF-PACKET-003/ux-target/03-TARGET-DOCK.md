# IF · TARGET — BOTTOM DOCK (Adaptive Work Dock)

`IF-UX-VISUAL-REALIGNMENT-001` · gói `IDF-IF-PACKET-003` · trạng thái **CANDIDATE · chờ Hoà duyệt mắt**
HEAD đo: `63de2d8` · lập 27/08/2026

---

## 0 · BẬC BẰNG CHỨNG

**`PARTIAL — contract/design proof trên mã tại HEAD `63de2d8``**. ⛔ Cấm đọc thành PASS.
Mọi giá trị thẩm mỹ **`PROPOSED`**.

**Hiện trạng đo được, hai vế:**
- Gap map `#23` (**P1**): *"**Không có** dock ngang ở đáy. Đáy trái chỉ có cụm ghim/thu-mở của rail."*
- Nhưng **ổ dock đã tồn tại trong vỏ**: `components/studio/AppShell.tsx:23-24,75` khai ổ ⑤
  *"Toolbelt — dock kính nổi giữa-dưới Stage, chặng tự truyền nội dung"*.
  ⇒ **Máy đủ, dây thiếu.** Đo tại nguồn (M-55, dán nguyên văn):

```
$ grep -rn "toolbelt=" app components --include="*.tsx"
components/studio/CadStageScreen.tsx:144:      toolbelt={<CadToolbelt />}
$ grep -rn "toolbelt=" app components --include="*.tsx" | wc -l
       1
```

⇒ **Đúng MỘT chặng trong ba đang cắm vào ổ dock.** Đây không phải "chưa có dock"; đây là
**một dock có một người dùng**.

**Ràng buộc của Hoà mà tệp này thi hành:**
> **Bottom Dock THÍCH ỨNG THEO STAGE — và không được thoái hoá thành thanh công cụ thường.**

---

## 1 · TARGET

### 1.1 · CẤU TRÚC — MỘT KHỐI, BA PHẦN, ĐÚNG MỘT PHẦN BIẾN HÌNH

```
        ┌───────────────────────────────────────────────────────────────┐
        │  ⓐ NEO BẤT BIẾN   │   ⓑ VÙNG BIẾN HÌNH (theo chặng)  │ ⓒ VIỆC │
        │  chọn · hoàn tác  │   … đổi theo chặng đang đứng …   │  2 ▶   │
        └───────────────────────────────────────────────────────────────┘
                          ↑ kính mỏng · trôi TRÊN canvas · một khối một bóng
```

| phần | nội dung | đổi theo chặng? | trần |
|---|---|---|---|
| **ⓐ NEO BẤT BIẾN** | Chọn · Hoàn tác/Làm lại | ❌ **không bao giờ** | **≤ 4 nút** |
| **ⓑ VÙNG BIẾN HÌNH** | gói lệnh của **chặng đang đứng** | ✅ **đúng một vùng này** | **≤ 5 nút hiện**, phần dư vào một cửa "thêm" |
| **ⓒ VIỆC ĐANG CHẠY / GẦN ĐÂY** | **số thật** từ hàng đợi | ❌ vị trí không đổi; nội dung đổi theo **việc thật**, không theo chặng | 1 mục |

Ba phần này **không phải phát minh của tệp này** — chúng là §3.1 của hợp đồng nguyên văn:
*"Adaptive Work Dock: stable universal anchors; real running/recent tasks; current Stage package;
**one** morphing dynamic control zone"* (trích qua gap map `#23`).

**Neo mã cho ⓒ:** hàng đợi thật đã có — `AppChrome.tsx:405-408` ghi rằng ba lối khởi chạy
(nút ▶ trên node · "Kết xuất" trên thẻ Tool Mode · "Run flow" ở `⌘K`) *"đều xếp hàng qua cùng 1
hàng đợi (`lib/execution.ts`)"*, theo dõi/huỷ ở `TasksDropdown`. ⇒ ⓒ **không cần nguồn mới**;
nó là **mặt tiền thứ hai của cỗ máy đã có** (luật một-cỗ-máy-nhiều-mặt-tiền), ⛔ không viết engine mới.

**Neo mã cho hình khối:** `components/cad/CadToolbelt.tsx:3-11` đã dựng đúng khuôn —
*"một nền kính, một bóng… Hàng 1 là công cụ; hàng 2 đổi theo mode"*. Target **tái dùng khuôn này**,
không đẻ khuôn thứ hai (M-26).

---

### 1.2 · ⭐ RANH GIỚI — CÁI GÌ LÀM NÓ VẪN LÀ DOCK, CÁI GÌ BIẾN NÓ THÀNH TOOLBAR

Đây là phần quan trọng nhất của tệp. Ranh giới phải **kiểm được bằng mắt trong một khung tĩnh**,
không phải bằng thiện chí — M-11: *"luật thiết kế nào không kèm được một cặp ảnh TỐT/XẤU thì chưa
dùng được"*.

#### Năm phép thử — trượt **một** phép là đã thành toolbar

| # | phép thử | **VẪN LÀ DOCK** | **ĐÃ THÀNH TOOLBAR** |
|---|---|---|---|
| **T-1 · TRÍ NHỚ CƠ BẮP** | Đổi chặng, **ⓐ có đứng nguyên chỗ cũ không?** | Chọn/Hoàn tác ở **đúng một toạ độ** qua cả ba chặng | Toàn bộ nội dung thay khi đổi chặng ⇒ mỗi chặng là một thanh khác nhau, người dùng phải học lại ba lần |
| **T-2 · CÓ TRẠNG THÁI SỐNG** | **Che hết icon đi — nó còn nói gì không?** | Còn: ⓒ mang **số thật** của việc đang chạy ⇒ nó là một **bề mặt tình trạng** | Không còn gì ⇒ nó chỉ là một hàng lệnh, tức toolbar |
| **T-3 · MỘT VÙNG BIẾN HÌNH** | Đếm số vùng đổi nội dung khi đổi chặng | **Đúng 1** (ⓑ) | ≥ 2 vùng đổi ⇒ đây là một thanh công cụ **đổi trang**, không phải một vật thích ứng |
| **T-4 · CẠNH NỔI, TẠM THỜI** | Canvas có chạy **dưới** nó không? | Kính mỏng, **trôi trên** canvas, canvas liên tục bên dưới, dock **rời đi được** | Chiếm chỗ in-flow, **đẩy** canvas lên ⇒ nó là chrome thường trực, và theo ràng buộc ① của Hoà thì chrome thường trực **không được là kính** |
| **T-5 · TRẦN SỐ LƯỢNG** | Đếm nút hiện | ⓐ ≤ 4 · ⓑ ≤ 5 · ⓒ = 1 | Vượt trần và cho tràn thành hàng thứ ba ⇒ tường nút. M-10 ở tầng lệnh: *"vật tồn tại vì có chỗ trống"* |

#### Bốn cơ chế thoái hoá — gọi tên để bắt được sớm

| cơ chế | vì sao nó hấp dẫn | vì sao nó giết dock |
|---|---|---|
| **① Nhét thêm lệnh vì "chỗ này còn trống"** | Dock rộng, lệnh thì nhiều | Đây đúng M-10. Trần ở T-5 tồn tại để câu *"còn trống"* không bao giờ là một lý do hợp lệ |
| **② Cho ⓐ đổi theo chặng "cho hợp ngữ cảnh"** | Nghe rất hợp lý: mỗi chặng có Undo riêng | Undo **là** khái niệm chung; đổi vị trí của nó theo chặng là phá đúng thứ làm nên một dock. T-1 |
| **③ Bỏ ⓒ vì "chưa có việc nào chạy"** | Rỗng thì ẩn đi cho gọn | ⛔ **Sai chiều.** M-12 nói **widget thiếu dữ liệu tự ẩn** — nhưng ⓒ **không thiếu dữ liệu**, nó **có dữ liệu và dữ liệu đó là "không có việc nào"**. Đây là ranh giới S1 ↔ S5: ⓒ **im** (không số, không khung) nhưng **giữ chỗ**, vì chỗ của nó là thứ người dùng học được |
| **④ Đưa một mục ĐIỀU HƯỚNG vào dock** | Dock ở gần tay | Dock trả lời *"tôi làm được gì với thứ trước mặt"*; rail trả lời *"tôi đang ở đâu"*. Trộn hai câu là mất cả hai (cùng luật đã ghi ở `AppChrome.tsx:392-393` cho Vitals ↔ danh tính) |

---

### 1.3 · THÍCH ỨNG THEO STAGE — ⓑ ĐỔI CÁI GÌ

| chặng | ⓑ mang gì | neo |
|---|---|---|
| **Thiết kế 2D** (`/projects/<id>/cad`) | công cụ vẽ + (Sketch) cụm cảm ứng / (Chuyên) ngữ cảnh Model·Paper·BIM | **đã có**: `CadToolbelt.tsx:8-10` |
| **Thiết kế 3D** (`/projects/<id>/render`) | gói dựng ảnh: nguồn → sinh → xem trước → so sánh → nhận | **khuôn đã có**: `components/ui/StageToolbelt.tsx` (lát cắt dọc `SOURCE → VISUAL GENERATE → PREVIEW → COMPARE → ACCEPT`) — nhưng **chưa cắm vào ổ ⑤** (grep ở §0) |
| **Trình chiếu** (`/projects/<id>/present`) | gói dàn trang + khai báo xuất | `NOT ASSESSED` — chưa mở được chặng này (gap map `#37`) |
| **Ngoài chặng** (`/`, `/projects`, `/library`) | ⓑ **rỗng** — và **rỗng là một câu trả lời**: không có "thứ trước mặt" để thao tác. Dock co lại còn ⓐ + ⓒ | — |

**⛔ Cấm ⓑ mang một gói lệnh "chung cho mọi chặng".** Nếu một lệnh đúng ở cả ba chặng thì nó thuộc
**ⓐ**, không thuộc ⓑ — và nếu ⓐ đã đủ 4 thì lệnh đó **không lên dock**.

---

### 1.4 · CHỖ ĐỨNG MỚI CHO HÀNH VI "SINH RA THỨ MỚI"

Mục **"Tạo bằng AI"** hiện nằm trong rail và là một lệnh chết (`RailDieuHuong.tsx:604,672,677` —
gap map `#14`, `L2-10`). **TARGET: nó rời rail.**

Lý do **không phải** của tôi — nó đã được viết trong chính tệp từ vựng rail,
`components/nav/muc-dieu-huong.ts:281-283`:
> *"nút `+` (nút không phải `MucRail`: **nó không dẫn đi đâu trên bản đồ, nó SINH RA thứ mới**)"*

Một vật *sinh ra thứ mới* là một **hành động trên thứ trước mặt** ⇒ đúng định nghĩa của dock (ⓑ),
sai định nghĩa của rail (bản đồ). ⇒ Chuyển nó vào ⓑ đóng được `#14` **mà không cần xoá năng lực**.

⚠️ Kèm điều kiện cứng: **chỉ được xuất hiện khi đã nối**. Chưa nối ⇒ **không có mặt ở đâu cả**.
§10 hợp đồng: ẩn chỉ được vì **quyền/bảo mật**; *"đang dựng"* **không phải** một lý do hợp lệ để
chiếm chỗ.

---

### 1.5 · DOCK Ở 393×852

Ở `< 768px`, dock và thanh điều hướng đáy **là hai vật khác nhau chồng lên cùng một mép** — đây là
chỗ dễ gộp nhầm nhất.

| | vật | nội dung |
|---|---|---|
| hàng dưới cùng | **thanh điều hướng** (thay rail dọc) | Z1 + cửa vào Z2 — *tôi đang ở đâu* |
| hàng trên nó | **dock** | ⓐ + ⓑ + ⓒ — *tôi làm được gì* |

⛔ Gộp hai hàng làm một là vi phạm cơ chế thoái hoá ④. `NOT ASSESSED` cho mọi số đo — xem §8.

---

## 2 · REJECT — điều bị cấm, kèm CƠ CHẾ SAI

| mã | bị cấm | cơ chế sai — đã trả giá ở đâu |
|---|---|---|
| **D-01** | **Dock đổi toàn bộ nội dung khi đổi chặng** | T-1. Cùng họ M-21 (*"ba nấc là ba CÔNG NĂNG, không phải ba cỡ"*): nếu ba chặng cho ra ba thanh khác hẳn nhau thì "dock thích ứng" chỉ là **ba toolbar dùng chung một toạ độ** |
| **D-02** | **Dock không mang trạng thái sống nào** | T-2. Một dock chỉ toàn lệnh **không phân biệt được với toolbar** ở khung tĩnh ⇒ theo M-11, luật đã mất khả năng kiểm |
| **D-03** | **Hai vùng biến hình trở lên** | T-3. Hợp đồng §3.1 nói **one** morphing zone. Hai vùng đổi ⇒ người dùng không còn neo nào để đọc *"cái gì vừa đổi"* |
| **D-04** | **Thanh tiến trình đoán mò / phần trăm bịa** | `IF-CANONICAL` §3 luật 5 *"không tiến độ giả"*. Đã có luật thi hành sẵn ở `components/ui/StageToolbelt.tsx:19-21`: *"⛔ KHÔNG BỊA %. Thanh trên = **bước i/n**, đếm thật. Thanh dưới… `value` BỎ TRỐNG ⇒ `LightBar` tự chuyển sang hình thái không-đếm-được và không in con số nào."* **Tái dùng, không viết lại** |
| **D-05** | **Skeleton đứng yên vĩnh viễn trên dock** | `#6`: ba hàng skeleton đứng yên trong khi nguyên nhân thật là 401. Skeleton là một **lời hứa về thời gian**; giữ nó quá hạn là tiến độ giả |
| **D-06** | **Nút không đi tới đâu** | `#10`: *"Vào canvas trống"* bấm xong 18 giây không gì xảy ra. §10 *"No silent click"*. Trên dock, một nút chết **đắt hơn** ở nơi khác vì dock là chỗ tay đặt sẵn |
| **D-07** | **Lệnh chết chiếm chỗ với lý do "đang dựng"** | `#14` `L2-10` + §1.4. Nếu chưa nối ⇒ không có mặt |
| **D-08** | **Kính chồng kính** giữa dock và một panel nổi khác | `app/globals.css:277` cấm nguyên văn. Và M-43: kính **cần diện tích** — *"ở 44px các cue chồng lên nhau thành một vệt, đo được là **dưới ngưỡng đọc được**"*. Một dock kính đè lên một tấm kính khác thì cả hai thôi là kính, chỉ còn là hai lớp mờ |
| **D-09** | **Dock in mã giao thức / câu lỗi mạng cho lỗi quyền** | `#5` `#6` `#1` `#19`. Xem `01-TARGET-SHELL.md` R-07/R-08 |
| **D-10** | **Đẻ khuôn dock thứ hai** | Đã có nguy cơ đo được: `components/BottomToolbar.tsx:1-8` là **một capsule đáy khác** (của canvas flow, "MỘT capsule duy nhất, MỘT bóng"), sống song song với `CadToolbelt`. M-26: *"cái gì đã gọi là dùng chung thì phải THẬT SỰ dùng chung"*. ⚠️ Xem mâu thuẫn X-8 |
| **D-11** | **Bỏ ⓒ khi không có việc nào chạy** | Cơ chế thoái hoá ③. ⓒ **im** nhưng **giữ chỗ** — đây là ranh giới S1 (*không có gì để đếm*) ↔ S5 (*đếm rồi, ra 0*), và cả hai đều **không** phải "thiếu dữ liệu" theo nghĩa M-12 |

---

## 3 · CẢNH — route · state · viewport

| # | cảnh | route | state | 1440×900 | 393×852 |
|---|---|---|---|---|---|
| **D-S1** | Trong chặng 2D, có việc chạy | `/projects/<id>/cad` | CÓ DỮ LIỆU | ⓐ + ⓑ(2D) + ⓒ mang **số thật** | dock hàng trên thanh điều hướng; ⓑ cuộn ngang |
| **D-S2** | Trong chặng, **không** việc nào chạy | `/projects/<id>/cad` | BẰNG KHÔNG | ⓒ **im, giữ chỗ** — không số, không khung, không chữ "0" | như trên |
| **D-S3** | Ngoài chặng | `/`, `/projects` | CÓ DỮ LIỆU | ⓑ **rỗng** ⇒ dock co còn ⓐ + ⓒ. ⛔ không lấp | dock có thể ẩn hẳn (không có "thứ trước mặt") |
| **D-S4** | Đang tải gói lệnh của chặng | `/projects/<id>/render` | ĐANG TẢI | ⓐ **đặc ngay** (hằng số, không phụ thuộc mạng); chỉ ⓑ mang dấu hiệu đang chạy, **có trần thời gian** | như trên |
| **D-S5** | Không đọc được hàng đợi | mọi chặng | TẢI HỎNG | ⓒ nói **KHÔNG BIẾT** tường minh + đường thử lại. ⛔ **không** rơi về "0 việc" | như trên |
| **D-S6** | Không đủ quyền với một lệnh | mọi chặng | KHÔNG CÓ QUYỀN | Nút **không render** (`PresenceBar.tsx:16-19` là khuôn đúng: *ẩn hẳn thay vì hiện rồi báo 403*). Dock co lại, không để lỗ | như trên |
| **D-S7** | Không có đối tượng nào để thao tác | canvas trống | KHÔNG CÓ DỮ LIỆU | ⓑ hiện **gói tạo**, không hiện gói **sửa**. Lệnh sửa không có đối tượng ⇒ không tồn tại | như trên |

---

## 4 · MOTION INTENT

| chuyển động | báo hiệu điều gì | tương đương `prefers-reduced-motion` |
|---|---|---|
| **ⓑ biến hình khi đổi chặng** (`bienHinh` 460ms, `lib/ui/nhip.ts:32`) — ⓐ và ⓒ **đứng yên tuyệt đối** | *"vùng vừa đổi là vùng NÀY, hai vùng kia là của bạn ở mọi chặng"*. Chuyển động ở đây **dạy ranh giới dock/toolbar**: cái gì động là gói chặng, cái gì đứng là neo | ⓑ hiện thẳng. Ranh giới truyền bằng **hairline ngăn vùng** đọc được ở khung tĩnh + `aria-live="polite"`: *"Gói công cụ chặng 3D."* ⛔ Không được để ranh giới **chỉ** tồn tại trong chuyển động |
| **ⓒ đổi số khi một việc vào/ra hàng đợi** (`bam` 130ms) | *"có việc ĐANG diễn ra"* — người dùng có thể phải chờ | Đổi số thẳng. ⛔ **Cấm nhấp nháy** (`02-STATE-CONTRACT.md` §6.2 mục 3: nhấp nháy là kênh cưỡng bức chú ý, việc của toast) |
| **Dock nở ra TỪ mép dưới** khi vào chặng (`bang` 220ms) | *"vật này thuộc về vùng làm việc, không mọc từ hư không"* | Hiện thẳng tại chỗ. Quan hệ không gian đã có sẵn: nó **luôn** ở mép dưới vùng làm việc |
| **Đóng nhanh hơn mở (~0,8×)** | *"bạn quyết xong rồi, đừng bắt chờ xem hiệu ứng"* (`lib/ui/nhip.ts:46-49`) | 0ms |
| ⛔ **Cấm tự bung** | — | — |

---

## 5 · NĂM TRẠNG THÁI TÁCH BẠCH TRÊN DOCK

| trạng thái | dock làm gì | phân biệt ở KHUNG TĨNH | đóng gap |
|---|---|---|---|
| **KHÔNG CÓ DỮ LIỆU** (S1) | ⓑ chỉ có gói **tạo**; ⓒ im, giữ chỗ | Dock **hẹp hơn hẳn**, không con số nào | `#23` |
| **ĐANG TẢI** (S2) | ⓐ đặc ngay; chỉ ⓑ có dấu hiệu chạy, **có trần thời gian** | ⓐ sắc nét cạnh ⓑ chưa sắc — **hai phần khác pha** | `L2-01` `#6` |
| **TẢI HỎNG** (S3) | ⓒ nói KHÔNG BIẾT + **mốc thời gian** + thử lại | Khối lỗi mang **mốc thời gian** — thứ S4 không bao giờ có | `L2-01` |
| **KHÔNG CÓ QUYỀN** (S4) | Nút **không render**; dock co lại, không để lỗ | **Thiếu hẳn nút**, không nút mờ nào | `#15` (khuôn `PresenceBar.tsx:16-19`) |
| **BẰNG KHÔNG** (S5) | ⓒ **im, giữ chỗ**. `0` chỉ hiện khi khai được phạm vi | Chỗ của ⓒ trống nhưng **có ranh giới** — khác hẳn S4 (không có chỗ) | `#20` |

⭐ **Chỗ dễ sập nhất của dock là S1 ↔ S5 ↔ S3 ở ô ⓒ** — cả ba đều "không có số".
Cách chúng không sập nữa: **giữ phân biệt ở KIỂU trước khi vẽ** (`undefined` ≠ `0`, cấm `?? 0` —
`components/studio/vitals-tin-hieu.ts:21-26`), và **S3 luôn mang mốc thời gian + đường thử lại**,
hai thứ S1/S5 không bao giờ có.

---

## 6 · NEO VÀO P0/P1

| dòng gap map | hạng | dòng target đóng nó |
|---|---|---|
| `#23` **không có Adaptive Work Dock** | P1 | §1.1 (ba phần) · §1.3 (thích ứng) · §0 (ổ ⑤ đã có, thiếu dây) |
| `#14` `L2-10` "Tạo bằng AI" là lệnh chết trong rail | P1 | §1.4 (rời rail vào ⓑ, và chỉ khi đã nối) · D-07 |
| `#10` nút thoát hiểm không đi tới đâu | P0 | D-06 |
| `#6` skeleton đứng yên vĩnh viễn | P0 | D-05 · §5 hàng S2 |
| `#5` `HTTP 401` lên mặt người dùng | P0 | D-09 |
| `#15` nút chặng không tên khả truy cập, lý do chỉ trong `title` | P1 | D-06 · §5 hàng S4 (ẩn hẳn thay vì mờ-câm) |
| `L2-01` route treo vĩnh viễn | P0 | §5 hàng S2 (trần thời gian) · D-05 |

---

## 7 · MÂU THUẪN — GHI CẢ HAI VẾ, KHÔNG TỰ HOÀ GIẢI

**X-8 · Hai capsule đáy cùng sống.**
· **Vế A:** `components/cad/CadToolbelt.tsx` là dock ổ ⑤, khai *"một-khối-một-bóng"*.
· **Vế B:** `components/BottomToolbar.tsx:1-8` cũng là *"MỘT capsule duy nhất, MỘT bóng"* ở đáy, của
canvas flow, chốt riêng theo `docs/SPEC-DESIGN-SYSTEM-IF.md` §2c/§2d, có thang bo đồng tâm riêng
(44→r22 · 34→r17 · icon 15).
⇒ Hai vật cùng vai, cùng mép, hai lịch sử chốt khác nhau. M-26 cấm khuôn thứ hai, nhưng **cả hai đều
có chốt đứng sau**. Hợp nhất hay giữ hai là **quyết định của người**; tôi ghi cả hai vế.

**X-9 · "Thích ứng theo stage" ↔ "stable universal anchors".**
· **Vế Hoà:** dock **thích ứng theo stage**.
· **Vế hợp đồng §3.1:** *"stable universal anchors"* + *"one morphing dynamic control zone"*.
Hai vế **không loại nhau** — đọc ghép được thành cấu trúc ⓐ/ⓑ/ⓒ ở §1.1. Nhưng **tôi không tự tuyên
bố cách đọc đó là chốt**: nếu Hoà muốn *toàn bộ* dock đổi theo chặng thì ⓐ biến mất, và **T-1 sụp**,
kéo theo cả bộ ranh giới dock/toolbar ở §1.2. ⇒ **Cần Hoà xác nhận có giữ ⓐ bất biến hay không** —
đây là câu hỏi duy nhất mà mọi thứ còn lại của tệp này phụ thuộc vào.

**X-10 · Kính của dock ↔ kính của thanh trên.**
Dock là *cạnh nổi/tạm thời* ⇒ kính **đúng chỗ**. Nhưng nếu X-1 (`01-TARGET-SHELL.md`) được chốt theo
hướng giữ kính cho thanh trên, thì app có **hai** mép kính thường trực kẹp canvas — và ràng buộc
*"canvas thoáng"* mất nghĩa. Hai mâu thuẫn này phải chốt **cùng một lượt**.

---

## 8 · `NOT ASSESSED`

| chỗ | vì sao |
|---|---|
| **N-1** · Dock ở chặng **3D** và **Trình chiếu** | Chưa mở được hai chặng này — gap map `#36` `#37` vẫn `NOT ASSESSED`, blocker hạ tầng (`N-2`/`N-4` của §L2.4) |
| **N-2** · Dock ở **393×852** | Không có ảnh nào. Toàn bộ §1.5 là **PROPOSED** |
| **N-3** · `CadToolbelt` thật sự trông ra sao trên runtime | Đọc được docstring và cấu trúc, **chưa thấy render**. M-03: *"có trong mã ≠ tới được người dùng"*; M-11: khai không phải là chứng minh |
| **N-4** · `StageToolbelt` có cắm được vào ổ ⑤ không | Chưa thử. Grep ở §0 chỉ chứng minh **hiện chưa cắm**, không chứng minh **không cắm được** |
| **N-5** · Trần "≤ 4 / ≤ 5 / 1" có đúng không **bằng mắt** | Đây là số **PROPOSED** của tôi, chưa có cặp ảnh TỐT/XẤU nào chống lưng. Theo M-11, một luật chưa kèm được ảnh thì **mới là một câu, chưa phải công cụ** |

---

## 9 · THẨM QUYỀN

Tệp này chốt **CẤU TRÚC và NGỮ NGHĨA** của dock: ba phần, đúng một vùng biến hình, năm phép thử
ranh giới dock↔toolbar, bốn cơ chế thoái hoá, năm trạng thái tách bạch.

⛔ **Không chốt** hình thái, độ bo, cỡ icon, màu, đường cong. Mọi giá trị thẩm mỹ **`PROPOSED`**.
⛔ Con số trần (4/5/1) là **PROPOSED**, chờ Hoà — xem N-5.

**Mắt và chuyển động cuối cùng là quyền của Hoà. Không agent nào thay.** Gói đang ở **CANDIDATE**.
