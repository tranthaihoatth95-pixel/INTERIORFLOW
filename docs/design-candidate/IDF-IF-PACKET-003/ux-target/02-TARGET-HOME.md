# IF · TARGET — TRANG CHỦ (Home)

`IF-UX-VISUAL-REALIGNMENT-001` · gói `IDF-IF-PACKET-003` · trạng thái **CANDIDATE · chờ Hoà duyệt mắt**
HEAD đo: `63de2d8` · lập 27/08/2026

---

## 0 · BẬC BẰNG CHỨNG

**`PARTIAL — contract/design proof trên mã tại HEAD `63de2d8``** + kế thừa runtime proof của
`ux/01-RUNTIME-UI-GAP-MAP.md` (lượt 2 đã đăng nhập, dữ liệu thật, cửa sổ đo ~6 phút, **không ảnh**).
⛔ Cấm đọc thành PASS. Mọi giá trị thẩm mỹ **`PROPOSED`**.

**Ràng buộc của Hoà mà tệp này thi hành:**
> **Home CHỈ hai vùng: `Factory/Starter` và `Personalized/My Home`. Không vùng thứ ba.**

---

## 1 · TARGET

### 1.1 · HAI VÙNG — định nghĩa, và LUẬT PHÂN ĐỊNH

| | **F · FACTORY / STARTER** | **P · PERSONALIZED / MY HOME** |
|---|---|---|
| trả lời câu | *"app này làm được gì, và tôi bắt đầu bằng cách nào"* | *"việc của TÔI đang ở đâu"* |
| nội dung | đường bắt đầu · khuôn mẫu app mang sẵn · năng lực chưa dùng tới | dự án của tôi · việc dở · điều cần tôi xử · thứ tôi CHỦ ĐỘNG ghim |
| ai khởi xướng | **APP** | **NGƯỜI DÙNG** |
| lớn lên theo | **không lớn** — số mục là hằng số của sản phẩm | **lớn theo dữ liệu thật** |
| khi kho rỗng | chiếm **gần trọn** màn | **không tồn tại** (không phải "rỗng") |
| khi kho dày | **co xuống một dải mảnh** ở cuối, hoặc rút vào một cửa | chiếm **gần trọn** màn |

#### ⭐ LUẬT PHÂN ĐỊNH — MỘT CÂU, KIỂM ĐƯỢC
> **Ai khởi xướng vật này?** APP khởi xướng ⇒ vùng F. NGƯỜI DÙNG khởi xướng ⇒ vùng P.

Đây **không** phải một quy ước mới. Nó là ca phân định đắt nhất đã trả giá, ghi nguyên văn ở
**M-10** (`docs/control/IF-UXUI-OPERATING-MEMORY.md`): *"Ghi chú nhanh — **cùng một widget, hai
phán quyết**, phân biệt bởi **ai khởi xướng**. Người dùng ghim ⇒ hợp lệ. Máy nhét cho đỡ trống ⇒ loại."*

Và nó vừa được thi hành lần nữa ở HEAD: `components/home/nam-trang-thai.ts:1-12` **gỡ `vatLieu`
khỏi mọi kế hoạch bày** với đúng lý do đó — *"nó lọt được vì có DỮ LIỆU THẬT… **dữ liệu thật không
tự cấp cho một vật cái quyền chiếm chỗ trên Home**"*.

⇒ **Hai vùng của Hoà chính là hai vế của luật này, được nâng lên thành BỐ CỤC.** Trước đây nó là
một câu hỏi phải nhớ mỗi lần thêm widget; nay nó là **hai chỗ đứng khác nhau trên màn**, nên trả lời
sai là **nhìn thấy được** (M-11: *"luật bằng chữ ≠ nhận ra vi phạm bằng mắt"*).

#### Cấm vùng thứ ba — và ba ứng viên hay đội lốt vùng thứ ba
| ứng viên | thuộc về đâu | vì sao không được đứng riêng |
|---|---|---|
| **Lời chào / dải không khí** | **không phải một vùng** — nó là **nền**, luôn có mặt | `nam-trang-thai.ts:78-81` đã khoá: *"KHÔNG có mã `chao`… cho nó thêm một ô trong lưới là nói cùng một điều hai lần"* |
| **Vitals / tín hiệu** | **P**, khi và chỉ khi nó nói về việc CỦA TÔI | Vitals là một **lớp**, không phải một màn (`vitals/01-TARGET-REJECT-STORYBOARD.md` §mở đầu). Cho nó một vùng riêng là biến khẩu độ thành dashboard |
| **Quảng cáo năng lực mới / mẹo dùng app** | **F** | Nếu nó không nằm được trong F thì nó **không thuộc Home**. ⛔ Cấm lấp chỗ trống bằng gợi ý (`vitals-tin-hieu.ts:17-19`: *"cố ý không có chỗ để cắm vào"*) |

---

### 1.2 · THỨ BẬC VÀ MẬT ĐỘ — hàm của DỮ LIỆU THẬT, không phải của đồng hồ

**Một trục duy nhất quyết định bố cục Home: TỶ LỆ F/P.** Và tỷ lệ đó là **hàm của dữ liệu đã đo**,
không phải của giờ trong ngày, không phải của một cờ trong `localStorage`.

| dữ liệu thật | F chiếm | P chiếm | hình dáng |
|---|---|---|---|
| 0 dự án · 0 việc dở | ~100% | **không render** | F là **một đích chính** + ba khuôn mẫu. ⛔ Không thẻ `0`, không lưới chờ nội dung |
| có việc dở | dải mảnh cuối màn | **hero = việc dở**, một đích *"tiếp tục"* | P áp đảo. Đây là dữ kiện mạnh nhất về ý định người dùng |
| có dự án, không việc dở | dải mảnh cuối màn | kệ dự án + điều cần xử | P áp đảo |
| dữ liệu dày | **rút vào một cửa** (một mục, không phải một dải) | ~100% | F không được lớn theo P |

**Neo mã:** cỗ máy tính mật độ **đã có** và test được không cần trình duyệt —
`components/home/nam-trang-thai.ts` (`chonTrangThai` `:174-190`, `matDoCua` `:192-207`,
`nhipCua`, `BAY_THEO_TRANG_THAI`). Target **không đẻ máy thứ hai** (M-26); nó đổi **đầu vào** của
máy đó: xem mâu thuẫn **X-5** ở §7 — hiện `chonTrangThai` đọc `d.gio` (giờ trong ngày) và
`d.daQuayLai`, hai thứ **không phải dữ liệu về công việc của người dùng**.

**Thứ bậc bên trong mỗi vùng:** đúng **MỘT hero** mỗi vùng. Neo: `nam-trang-thai.ts:254-255` —
*"Mỗi trạng thái có ĐÚNG MỘT mục cỡ `2x2` (hero) — nhiều hơn một hero thì không còn hero nào."*

**Thứ bậc bằng HAI trục, không một:** diện tích (`CoO` `1x1/2x1/2x2`) **và** chất liệu (`VaiO`,
`phu` = không vỏ, đứng trần trên nền). Neo: `nam-trang-thai.ts:234-239` — *"chỉ đổi diện tích thì
mọi ô vẫn là một tấm kính giống nhau, và một dãy tấm kính to-nhỏ vẫn đọc ra 'tường widget'"*.

---

### 1.3 · VÙNG F — FACTORY / STARTER

**Cấu trúc:** một **đích chính** + **khuôn mẫu app mang sẵn**.

- Đích chính = *bắt đầu một dự án*. Đúng **một** nút chính trên toàn màn.
- Khuôn mẫu = thứ **IF mang sẵn và ĐẾM ĐƯỢC**, không phải ảnh minh hoạ.
  Ví dụ đo được tại HEAD: kho mầm `.idfc` **73 cấu kiện** (`lib/idfc-seed/index.ts:4`, trích theo
  gap map `#20`).
- ⛔ **Mọi con số trong F phải chỉ được nguồn.** Bẫy 1 của storyboard: *"có con số nào trên màn mà
  bạn không chỉ được nguồn đo?"*

**F ở trạng thái chưa đăng nhập:** F là vùng **duy nhất** được phép hiện. P **không tồn tại**
(không phải "rỗng") — vì P là dữ liệu có chủ, và chủ chưa xác định.

---

### 1.4 · VÙNG P — PERSONALIZED / MY HOME

**Cấu trúc:** hero (việc dở **hoặc** kệ dự án) + các mục nhỏ hơn, mỗi mục thuộc đúng một nhóm
của M-10: *hiện diện con người · việc đang làm · điều cần chú ý · Design DNA · tiện ích người dùng
CHỦ ĐỘNG bật*.

**Ba luật cứng của P:**
1. **Mọi con số phải là con số THẬT của toàn tập.** `2/2` khi DB có **17 dự án sống** là một
   khẳng định *"đây là toàn bộ"* mà không phải toàn bộ (`L2-07`). Nếu đang lọc ⇒ **nói đang lọc**
   và nói **còn bao nhiêu ngoài bộ lọc**.
2. **Widget thiếu dữ liệu TỰ ẨN, ô co theo nội dung.** M-12: `h-full` + cỡ ô hằng số ⇒ *"vỏ trắng
   kéo giãn cho bằng khung, ruột thật chỉ 136px"*.
3. **Không fixture.** `L2-04` đo được **8/17 dự án sống (47%)** và **9/21 user** là `__proof_*`/`demo*`,
   không mục nào mang dấu hiệu "dữ liệu kiểm thử". M-34: fixture không được định nghĩa giao diện
   sản xuất — ở đây nó còn tệ hơn: nó đang định nghĩa **nội dung**.

---

### 1.5 · CỬA VÀO LẦN ĐẦU — THUỘC F, KHÔNG PHẢI MỘT MODAL

**TARGET:** người mở app lần đầu **hạ cánh thẳng vào vùng F**. Vùng F **chính là** onboarding.
Không modal, không lớp phủ, không "Bỏ qua".

**Cơ chế sai hiện tại — đã mở tệp đọc dòng tại HEAD `63de2d8`:**
`components/home/HomeScreen.tsx:322` `if (!resume && !isTourDone(userId)) setWelcomeOpen(true)`
và `lib/resume.ts:181-188` `isTourDone` đọc **`localStorage`** theo `userId`.
⇒ Cổng "người mới" là **một cờ trên máy này**, **không phải một phép đo dữ liệu**. Hệ quả đo được:
một tài khoản **17 dự án** mở app trên máy/trình duyệt mới sẽ nhận modal *"Tạo dự án của tôi"*
(`components/entry/WelcomeIntro.tsx:120`) đè lên chính dải dự án của mình — đúng `L2-06`.

**Luật rút ra:** *"người mới"* là một **kết luận về dữ liệu**, không phải một cờ về thiết bị.
Cùng họ M-05 (*số chép lại không phải phép đo*): một cờ `localStorage` là **bản chép của một kết luận cũ**,
và nó sai ngay khi thiết bị đổi.

---

## 2 · REJECT — điều bị cấm, kèm CƠ CHẾ SAI

| mã | bị cấm | cơ chế sai — đã trả giá ở đâu |
|---|---|---|
| **H-01** | **Vùng thứ ba** trên Home | Mỗi vùng thêm vào là một chỗ hợp lệ mới cho câu hỏi *"để đâu?"* — và **mọi widget bị từ chối đều tìm được một vùng thứ ba để trú**. Hai vùng làm luật M-10 thành thứ **nhìn thấy được**; ba vùng trả nó về thành một câu phải nhớ (M-11) |
| **H-02** | **Lưới thẻ đều nhau** | Bị đánh trượt **ba lần**: 20/08 *"cấm lưới thẻ đều"* · 22/08 *"thẻ khổng lồ, tường widget"* · 23/08 *"XẤU"* (M-10). `BeMatHome.tsx:11-17` chép sẵn đúng luật này rồi **vẫn giao ra tường thẻ trắng** — đó là M-11, bài học đắt nhất cả chiến dịch |
| **H-03** | **Modal người-mới đè lên tài khoản có dữ liệu** | `L2-06` + cơ chế ở §1.5. Nó gộp **BẰNG KHÔNG** vào **CÓ DỮ LIỆU** — đúng cặp trục xương sống mà cả gói này đi tìm |
| **H-04** | **Con số khẳng định "toàn bộ" mà không phải toàn bộ** | `L2-07`: `2/2` trên một tài khoản 17 dự án. `IF-CANONICAL` §3 luật 5. Con số **không sai về số học**, nó sai về **phạm vi** — thứ khó bắt nhất, vì nó trông đúng |
| **H-05** | **Bày `0`** khi kho rỗng | `IF-CANONICAL` §14 + **M-13**: *"kho thật gần rỗng là trạng thái THẬT, một màn trống tử tế hơn hẳn một màn đầy số bịa"*. Và C-01 của storyboard cấm cả *"một vòng tròn/nhịp thở để chứng minh Vitals tồn tại"* |
| **H-06** | **Lưới ô ma giữ nguyên kích thước khi rỗng** | `#21`: bước "Chọn theo màu" bày **10 ô in chữ "TRỐNG"** đúng kích thước thật, rồi bên dưới mới nói *"Chưa có bảng màu nào"*. M-12 + M-10 (*"vật tồn tại vì có chỗ trống"*) |
| **H-07** | **Fixture `__proof_*` / `demo_seed_001` trên bề mặt sản phẩm** | `L2-04`. M-34. Fixture **có dữ liệu thật về mặt kỹ thuật**, nên mọi máy soi kiểu *"số này có nguồn không"* đều xanh — cửa duy nhất là hỏi *"nguồn này là AI-tạo-ra-để-làm-gì"* |
| **H-08** | **Hằng số đóng cứng đội lốt số đo** | `#9`: `STORAGE_QUOTA_BYTES = 10 * 1024³` (`app/settings/_components/StorageCard.tsx:13`) hiện thành *"Đã dùng 0 B / 10 GB"* cho một app local-first **không có hạn mức nào như thế**. Bẫy 1: *"có con số nào bạn không chỉ được nguồn đo?"* |
| **H-09** | **Máy nhét widget cho đỡ trống** | M-10 nguyên văn. Ca gần nhất đã bị gỡ: `vatLieu` (`nam-trang-thai.ts:1-12`). ⛔ Không hồi sinh nó cho tới khi có **cơ chế ghim thật** — lúc đó nó vào **P** hợp lệ |
| **H-10** | **Mật độ là hằng số CSS** | `nam-trang-thai.ts:19-22`: *"Mật độ là HÀM CỦA TRẠNG THÁI, không phải hằng số"* — nếu không, Home lại thành **một** bố cục đẹp cho **một** tình huống, đúng thứ bản chốt 23/08 bác |
| **H-11** | **Bày dự án của người khác dưới lời chào của tôi** | `L2-08`: session `Hoà` sở hữu **0 dự án**, Home bày 17 dự án của người khác. ⚠️ **Ghi cả hai vế** — xem X-6. Cái bị cấm ở đây **không** phải cửa hậu admin, mà là **kể nó thành "của tôi"** |

---

## 3 · CẢNH — route · state · viewport

| # | cảnh | route | state | 1440×900 | 393×852 |
|---|---|---|---|---|---|
| **H-S1** | Kho rỗng thật | `/` | KHÔNG CÓ DỮ LIỆU | **F chiếm màn**: một đích chính + khuôn mẫu đếm được. **P không render**. Không con số nào | F một cột, đích chính trong tầm ngón cái |
| **H-S2** | Có việc dở | `/` | CÓ DỮ LIỆU | **P hero = việc dở**, một đích *"tiếp tục"*; F còn một dải mảnh cuối màn | hero trên, dải F sau khi cuộn |
| **H-S3** | Dữ liệu dày | `/` | CÓ DỮ LIỆU | **P chiếm màn**, F rút vào **một cửa** (một mục) | P cuộn dọc; F là một mục trong menu |
| **H-S4** | Đang tải Home | `/` | ĐANG TẢI | Vùng nào **đã biết** thì vẽ đặc ngay (F là hằng số ⇒ **F không bao giờ skeleton**); chỉ P mang dấu hiệu đang chạy | như trên |
| **H-S5** | Không đọc được dữ liệu | `/` | TẢI HỎNG | **F vẫn đứng nguyên** (nó không cần máy chủ). P thay bằng một khối hỏng: cái gì · từ lúc nào · thử lại · làm được gì ngoại tuyến | như trên |
| **H-S6** | Chưa đăng nhập | `/` | KHÔNG CÓ QUYỀN | **Chỉ F.** P **không tồn tại trong cây render** — không placeholder, không tên, không avatar, không hạn mức | như trên |
| **H-S7** | Đã đo, kết quả 0 | `/` | BẰNG KHÔNG | Con số `0` chỉ hiện kèm **phạm vi phép đo** ("0 việc **cần tôi xử hôm nay**"); không có phạm vi ⇒ **im** | như trên |

⚠️ **`NOT ASSESSED` cho toàn bộ cột 393×852** — xem §8 N-2.

---

## 4 · MOTION INTENT

| chuyển động | báo hiệu điều gì | tương đương `prefers-reduced-motion` |
|---|---|---|
| **F co lại / P nở ra** khi dữ liệu đầu tiên xuất hiện (`bienHinh` 460ms, `lib/ui/nhip.ts:32`) | *"app vừa đổi vai: từ **chỗ bắt đầu** thành **chỗ làm việc của bạn**"*. Đây là chuyển động **quan trọng nhất** của Home, và nó chỉ xảy ra **một lần trong đời một tài khoản** | Hiện thẳng ở tỷ lệ mới. Thông tin *"vai đã đổi"* truyền bằng **thứ tự đọc**: hero của P nay đứng trên, F xuống cuối — đọc được ở khung tĩnh mà không cần thấy nó di chuyển |
| **Hero P nhận tiêu điểm khi mở app** (không chuyển động, chỉ tiêu điểm) | *"đây là chỗ bạn dừng lại lần trước"* | Không đổi — vốn đã là trạng thái tĩnh + `--focus-ring` (`app/globals.css:31`) |
| **Một mục P biến mất khi việc xong** (`bang` 220ms, thu về chỗ nó đứng) | *"việc này đã xử xong"* — Vitals chỉ giữ dòng **còn cần xử lý** (`lib/site/vitals-site.ts:9-11`) | Hiện thẳng + một dòng `aria-live="polite"` nói việc nào vừa rời danh sách. ⛔ Không được im lặng biến mất |
| ⛔ **Không** có chuyển động nào chào đón, chạy vòng, hay đếm số lên | — | — |

**Cấm tự bung, cấm nhấp nháy** trên mọi mục Home — nhấp nháy là kênh **cưỡng bức chú ý**, việc của toast
(`02-STATE-CONTRACT.md` §6.2 mục 3–4).

---

## 5 · NĂM TRẠNG THÁI TÁCH BẠCH TRÊN HOME

| trạng thái | Home làm gì · CHÍNH XÁC | phân biệt ở KHUNG TĨNH | đóng gap |
|---|---|---|---|
| **KHÔNG CÓ DỮ LIỆU** | Chỉ F. Một đích chính. ⛔ không `0`, không khung chờ | **Không có ô số nào trên màn** | `#33` `H-05` |
| **ĐANG TẢI** | F đặc ngay (hằng số), P mang dấu hiệu đang chạy, có **trần thời gian** | Vùng F sắc nét cạnh vùng P chưa sắc — **hai vùng khác pha** | `L2-01` |
| **TẢI HỎNG** | F đứng nguyên; P thành khối hỏng **có mốc thời gian** + thử lại + việc ngoại tuyến | Khối lỗi mang **mốc thời gian** | `#1` `#2` `L2-01` |
| **KHÔNG CÓ QUYỀN** | P **không tồn tại trong cây render**. Không tên, không avatar, không hạn mức | **Màn thiếu hẳn một vùng**, bố cục vẫn đứng | `#9` `#11` |
| **BẰNG KHÔNG** | `0` chỉ hiện kèm **phạm vi**; không phạm vi ⇒ im | Mọi số `0` đều có một câu phạm vi bên cạnh | `#20` |

**Chỗ trục này đang sập, và cách nó không sập nữa:**
- `L2-06` **CÓ DỮ LIỆU → BẰNG KHÔNG**: sập vì cổng đọc `localStorage` thay vì đọc dữ liệu.
  ⇒ Đóng bằng §1.5: cổng "người mới" là **kết luận về dữ liệu**, và onboarding **là vùng F**, không phải modal.
- `L2-07` **CÓ DỮ LIỆU (17) → hiện như 2**: sập vì con số không khai phạm vi.
  ⇒ Đóng bằng §1.4 luật 1: đang lọc thì **nói đang lọc** và nói **còn bao nhiêu**.
- `#20` **KHÔNG CÓ QUYỀN → KHÔNG CÓ DỮ LIỆU**: kệ khai `73` (kho mầm đóng gói) cạnh các kệ khai `0`
  (chưa đăng nhập nên không đọc được), **một cách hiện cho hai nghĩa**.
  ⇒ Đóng bằng §5 hàng KHÔNG CÓ QUYỀN: kệ chưa đọc được thì **không mang số nào**.

---

## 6 · NEO VÀO P0/P1

| dòng gap map | hạng | dòng target đóng nó |
|---|---|---|
| `#9` Cài đặt/hồ sơ render cho người chưa đăng nhập; hạn mức 10 GB đóng cứng | P0 | H-08 · §5 hàng KHÔNG CÓ QUYỀN · H-S6 |
| `#20` kệ `73` ↔ kệ `0` một cách hiện | P1 | §5 (chưa đọc được ⇒ không mang số) |
| `#21` lưới 10 ô ma in "TRỐNG" | P1 | H-06 |
| `#33` Home có dữ liệu chưa từng lên màn | NOT ASSESSED → **một phần đóng** | `L2-06`/`L2-07` đã đo ở lượt 2; phần ảnh vẫn mở (N-2) |
| `L2-04` fixture `__proof_*` chiếm 47% dự án sống | P0 | H-07 |
| `L2-06` modal người-mới trên tài khoản có dữ liệu | P1 | H-03 · §1.5 (cơ chế `localStorage` đã đo tại HEAD) |
| `L2-07` `2/2` trên 17 dự án | P1 | H-04 · §1.4 luật 1 |
| `L2-08` Home bày dự án của người khác dưới *"Chào Hoà"* | P1 | H-11 — ⚠️ **chỉ đóng nửa kể chuyện**, nửa phạm vi là X-6, chờ Hoà |
| `#18` `L2-09` cold open 60 s | P1 | ⛔ **KHÔNG đóng** — mâu thuẫn M-2, xem `01-TARGET-SHELL.md` X-4 |

---

## 7 · MÂU THUẪN — GHI CẢ HAI VẾ, KHÔNG TỰ HOÀ GIẢI

**X-5 · HAI VÙNG ↔ NĂM TRẠNG THÁI A–E VÀ BA TẦNG WIDGET.**
· **Vế Hoà (27/08):** Home **CHỈ hai vùng**, không vùng thứ ba.
· **Vế chốt đang chạy (23/08):** `docs/design-campaign/dna/HOME-SPEC-2026-08-23.md` chốt **năm trạng
thái ngữ cảnh A–E** và **ba tầng widget** `core / ai / personal`, đã thi công thành mã thuần có test:
`components/home/nam-trang-thai.ts:34-46` (`TrangThaiHome`, `TangWidget`, `MatDo`), `:174-190`
(`chonTrangThai` đọc `d.gio` và `d.daQuayLai`), `:192-207` (`matDoCua`).

**Hai vế không cùng trục, và tôi KHÔNG tự tuyên bố cách ghép:**
- Một cách đọc: *hai vùng là trục KHÔNG GIAN, năm trạng thái là trục MẬT ĐỘ; chúng chồng lên nhau
  chứ không thay nhau.* Nếu đúng, `nam-trang-thai.ts` **giữ nguyên** và chỉ cần gán mỗi `MaWidget`
  vào F hoặc P.
- Cách đọc khác: *ba tầng `core/ai/personal` chính là một cách chia vùng, và nó chia thành BA* ⇒
  mâu thuẫn thẳng với ràng buộc "không vùng thứ ba".
- Và một điểm riêng phải nêu: `chonTrangThai` chia C/D/E theo **giờ trong ngày** (`GIO_SANG_HET = 11`,
  `GIO_TOI_BAT_DAU = 18`). Giờ trong ngày **không phải** dữ liệu về công việc của người dùng.
  Ràng buộc hai-vùng của Hoà đặt trục ở **dữ liệu**; chốt 23/08 đặt một phần trục ở **đồng hồ**.

⇒ **Quyết định của Hoà.** Cấm dựng theo bên nào cho tới khi chốt. (M-57: đóng dấu nửa vời **đắt hơn**
bỏ mặc — nếu chốt 23/08 bị thay, phải sửa **cả** tệp mã **và** mọi con trỏ trong cùng một lượt.)

**X-6 · Phạm vi admin ↔ "isolation before render".**
· **Vế runtime (đúng mã):** `Hoà` là `isAdmin` ⇒ `lib/server/access.ts:50` trả `'owner'` cho **mọi**
dự án; `app/api/dashboard/route.ts:29-33` không bật `IF_PROJECT_SCOPE_ENFORCE` ⇒ `duAnWhere = { deletedAt: null }`.
· **Vế hợp đồng:** §13 *isolation và least privilege **trước** fetch/render* · §11 *filter before load*.
⇒ Đây là **M-4 của gap map**, vẫn mở. Tệp này chỉ khẳng định một vế **không tranh cãi**: dù chọn bên
nào, **màn không được kể tập dữ liệu đó thành "của tôi"**. Việc bật cờ hay định nghĩa lại admin là
**quyết định của người**.

**X-7 · Fixture sống chung bảng với dữ liệu thật.**
Gap map **M-5**: không hợp đồng nào cho phép, và cũng **không hợp đồng nào cấm bằng chữ** — M-34 chỉ
cấm *fixture định nghĩa giao diện*, ở đây fixture đang định nghĩa **nội dung**. Cần một luật mới hoặc
một cửa lọc. **Quyết định của người.**

---

## 8 · `NOT ASSESSED`

| chỗ | vì sao |
|---|---|
| **N-1** · Home ở **393×852** | Không có ảnh nào của Home ở 393 (gap map lượt 1 chỉ chụp `/login` ở 393, dòng `#26`; lượt 2 **không có ảnh nào**). Toàn bộ cột 393 ở §3 là **PROPOSED** |
| **N-2** · Home có dữ liệu, **bằng ảnh** | `L2.0` của gap map: Playwright-Chromium `net::ERR_ABORTED` với `127.0.0.1:3080`; Browser pane hiển thị được nhưng không ghi ra tệp. Lượt này không chạy server ⇒ **không thêm được ảnh nào** |
| **N-3** · Bố cục thật của `BAY_THEO_TRANG_THAI` trên màn | Đọc được bảng trong mã, **chưa thấy nó render**. M-03: *"có trong mã ≠ tới được người dùng"* |
| **N-4** · `xuong-layout.ts` (bố cục hai cột) ghép với hai vùng ra sao | Tệp này khai một trục A/B/C **khác trục** với `nam-trang-thai` (`nam-trang-thai.ts:27-31` cảnh báo đúng chỗ này). Chưa đọc `xuong-layout.ts` trong lượt này ⇒ **không khẳng định gì** (M-55: cấm khẳng định phủ định khi chưa dán được đầu ra phép đo) |
| **N-5** · Số dự án thật của một tài khoản **không phải admin** | Mọi số của gap map lượt 2 đo trên phiên `isAdmin = true`. Chưa có phiên thường ⇒ chưa biết Home của một user bình thường trông ra sao |

---

## 9 · THẨM QUYỀN

Tệp này chốt **CẤU TRÚC và NGỮ NGHĨA** của Home: hai vùng, luật phân định *ai khởi xướng*, trục
mật độ, năm trạng thái tách bạch, và điều bị cấm kèm cơ chế sai.

⛔ **Không chốt** hình thái ô, màu, tỷ lệ chính xác F/P bằng phần trăm, đường cong chuyển động.
Mọi giá trị thẩm mỹ mang nhãn **`PROPOSED`**.

**Mắt và chuyển động cuối cùng là quyền của Hoà. Không agent nào thay.**
Gói đang ở **CANDIDATE**; chỉ Hoà nâng được `CANDIDATE → APPROVED`.
