# ACTIVE DESIGN CONTEXT — bộ ngữ cảnh thiết kế ĐANG HIỆU LỰC

> **Lập 04/09/2026 theo lệnh CONTEXT DETOX của Hoà.** Đây là tệp **DUY NHẤT** mọi phiên làm
> giao diện được đọc để lấy **hướng thiết kế**. Ngắn là cố ý: `docs/` có **761 tệp `.md` · 78 MB**
> và **148 bản vẽ**, phần lớn là *lịch sử*, không phải *thẩm quyền*. Crawl toàn bộ kho đó để tìm
> hướng thị giác chính là cơ chế đã làm nhiễm mấy đợt Home vừa rồi.
>
> **LUẬT KHỞI ĐỘNG:** phiên UI/UX đọc **tệp này TRƯỚC**, và **chỉ** tệp này để lấy hướng.
> Tài liệu cũ chỉ mở khi việc đòi **truy nguyên · cứu vốn · giữ hành vi · điều tra xung đột** —
> mở với tư cách **bằng chứng**, không phải tiền lệ thị giác.
> Danh mục cách ly: `docs/delivery/LEGACY-DESIGN-QUARANTINE.md`.

---

## §0 · THỨ TỰ THẮNG khi hai chỗ nói khác nhau

```
① LỆNH HOÀ MỚI NHẤT (theo ngày)          ← thắng tất cả
② NORTH STAR N-1…N-20                     docs/IF-KIEN-TRUC-OS.md
③ EXPERIENCE SYSTEM 12 điều               docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md
④ Hiến pháp giao diện NT-1…18 · KB-1…5    docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md
⑤ TOKEN + TRỢ NĂNG                        app/globals.css · WCAG  ← KHÔNG bao giờ bị nới xuống
────────────────────────────────────────
   mọi thứ khác = BẰNG CHỨNG, không phải thẩm quyền
```

⛔ **BỐN CÂU CẤM ĐỌC NGƯỢC** (Hoà ban 04/09):
- Giao diện **đang chạy** ≠ thẩm quyền thiết kế.
- Component **đang có** ≠ khuôn mẫu thiết kế.
- Code **đang có** ≠ lý do giữ nguyên bố cục.
- **Đã qua mắt trong quá khứ** ≠ đang được duyệt, nếu có thẩm quyền mới đè lên.

⚠️ **NO-REBUILD (Blueprint §B25) đọc lại cho đúng:** nó bảo vệ **NĂNG LỰC · HỢP ĐỒNG · DỮ LIỆU**.
Nó **KHÔNG** bảo vệ **bố cục thị giác đã lỗi thời**. Trước 04/09 điều này bị đọc lẫn, và đó là một
nguồn nhiễm thật.

---

## §1 · NORTH STAR — IF là gì

**IF = hệ điều hành sáng tạo cho thiết kế nội thất.** Lời hứa: *từ ý tưởng tới sự thật thiết kế —
không đánh rơi ngữ cảnh.*

Hào **không** nằm ở sinh ảnh, render, chat hay số lượng tính năng. Nó nằm ở: **liên tục · gia phả ·
quyết định của người · sửa có cấu trúc · sự thật dự án · ký ức · DNA**.

> **Model AI thay được. Sự thật thiết kế thì không.**

Cổng hai câu cho mọi việc (N-20): ① *chạy được chưa?* ② *có đẩy về north star không?*
Đạt ① mà trượt ② = **chưa xong về mặt sản phẩm**.

Toàn văn N-1…N-20: `docs/IF-KIEN-TRUC-OS.md`.

---

## §2 · NGUYÊN TẮC TRẢI NGHIỆM đang hiệu lực

| | Nguyên tắc |
|---|---|
| **Luật không gian 5 vùng** | Trái = *tôi đang ở đâu* · Giữa = *tôi đang làm gì* · Phải = *cái gì đáng quan tâm lúc này* · Cạnh con trỏ = *làm gì tiếp* · **Mép trên = điều đáng biết ngay** |
| **Ba nấc = ba CÔNG NĂNG** | Không phải ba cỡ. Nấc to **thêm một lớp tin** nấc nhỏ *không thể* mang — không phóng to lớp cũ. Nấc mặc định phải **đứng được một mình**. Mục nào không có lớp tin thứ ba thì **chỉ có hai nấc** |
| **Mở TỪ TÂM** | Mọi bề mặt nở ra từ tâm/nguồn của chính nó. Không teleport, không hard-cut |
| **Morph giữ định danh** | rail→shelf, aperture→peek→engage, card→inspector: **cùng một vật nở ra**, không phải vật khác thay chỗ |
| **Chiều sâu tiến dần** | Mặc định gọn và tươm tất; chiều sâu chỉ hiện khi người dùng cần |
| **Chrome im lặng** | Giao diện lùi, nội dung tiến |
| **Ánh sáng/màu MANG NGHĨA** | Cấm trang trí. Mọi chi tiết thị giác phải mang tin |
| **Một hệ, bốn mật độ** | Home thoáng · Files/Thư viện cân · 2D/3D chặt · Trình chiếu kiểu tạp chí — **khác mật độ, không khác hệ** |

---

## §3 · MƯỜI HAI ĐIỀU EXPERIENCE SYSTEM (20/08 — Hoà duyệt mắt PASS)

| # | Chốt |
|---|---|
| 1 | Một trải nghiệm, một mental model `Home→Files→2D→3D→Review→Present`; DS hiện tại là canonical; mới thì `REUSE→VARIANT→EXTEND→NEW` |
| 2 | Shell thích nghi, cấu trúc ổn định — luật không gian 5 vùng (§2) |
| 3 | **Sidebar BA CỤM** (workspace chung · ba chặng · cá nhân/hệ thống) — vertical islands, không sitemap 30 feature |
| 4 | **Sidebar ba độ sâu**: Rail 52–56 · Context Shelf 220–280 · Work Panel 320–440 |
| 5 | Mỗi stage đúng **1 Primary + 1 Secondary spotlight** |
| 6 | **Home = Personal Work OS**, mặc định tươm tất ngay; **Hero = Resume** |
| 7 | **Vitals = signature interaction**, nằm **VẬT LÝ trong mép trên** như khẩu độ sống, 3 mức Ambient→Peek→Engage, morph nhẹ |
| 8 | **Voice = input ngữ cảnh**, không chatbot; mutation phải có người xác nhận |
| 9 | **Mép phải = Context Intelligence Stack** — 5 lens trên CÙNG entity; `Measured/Verified/Inferred/External/Stale` · `Go to Source` · `Where Used` · `Blast Radius` |
| 10 | **Master Capability System** — 3 stage = 3 môi trường sáng tác; 4 độ sâu: capsule cạnh con trỏ → toolbar → shelf/inspector → ToolWindow sâu; toolbar = **working set 4–8**, không chứa mọi feature |
| 11 | Tool chất nghề: capsule 3–6 hành động khi chọn · `Essentials ⇄ Advanced` · số chắc tay · **icon đọc nghĩa <1 giây, cấm glyph trừu tượng** |
| 12 | **Non-destructive**: `Definition → Representation → Instance → Override → Update → Where Used`; **anchor là first-class**; **Replace giữ vị trí/hướng/ngữ cảnh** |

🔴 **MỘT DÒNG CỦA EXS ĐÃ BỊ ĐÈ:** mục *Hệ quả sổ sách §2* của tệp EXS ghi drift sắp thi công là
*"bento thêm hero 2×2 Resume"*. Câu đó là **giả định thi công**, không phải nguyên tắc — và nó
**mâu thuẫn trực tiếp** với N-10 (`bento làm mặc định` = cờ đỏ) cùng lệnh Home 04/09.
⇒ **12 điều nguyên tắc GIỮ TRỌN; dòng drift bento SUPERSEDED.**

---

## §4 · QUYẾT ĐỊNH CỦA HOÀ đang hiệu lực

| Mã | Ngày | Nội dung |
|---|---|---|
| **D-DR1** | 04/09 | Vitals đứng **vật lý ở mép trên** (EXS §7). Chỗ đứng "cạnh trục phải" **SUPERSEDED**. Hành vi hữu ích của bản cũ được **hấp thu**, không xoá mù. Sau di trú phải còn **đúng một** chỗ đứng |
| **D-DR2** | 04/09 | Home khổ rộng: **ĐÚNG MỘT tiêu điểm chính**, rồi một cụm phụ **hạng dưới hẳn**. Không đọc ra như dashboard SaaS. Bento **không định nghĩa thứ bậc Home ở desktop** |
| **HOME-LIVE** | 04/09 | **Home = STUDIO CÁ NHÂN ĐANG SỐNG**, không phải trang Resume. Việc đang làm là **một** đối tượng trội **trong** Home, không phải toàn bộ Home |
| **NGỮ NGHĨA** | 04/09 | `LIVE WORK FRAGMENT` — **mảnh việc sống**, suy từ ngữ cảnh thiết kế (concept/planning/3D/render/vật liệu/present/review/research). **Mặt bằng 2D là MỘT trạng thái, không phải bản sắc Home**. `WORK > ATMOSPHERE` |
| **HÌNH HỌC** | 20/08 | Một ngôn ngữ hình học: `RECTANGLE → ROUNDED RECT (chủ đạo) → CAPSULE → CIRCLE`. Capsule có việc, circle có việc — không trang trí. Phép thử cứng: **che logo, đặt 9 màn cạnh nhau vẫn nhận ra cùng một hệ** |
| **AUTO GRID** | 20/08 | Là **master capability compose nội dung TRONG stage Trình chiếu**, chạy tại chỗ trên canvas. **KHÔNG** phải pattern 5 màn toàn app. "Layout Ghost" là phản hồi *của capability này*, không phải skeleton loading toàn app |
| **MẶT AI** | 04/09 | Trong IF, mặt AI là **Vitals**. Không có mặt AI thứ hai |
| **KIỂM CHUẨN** | 15/08 | Kiểm tiêu chuẩn là việc của **MÁY** (tất định, 0đ, dẫn được điều khoản). AI chỉ đứng ở **lớp góp ý**, và góp ý **không bao giờ chặn** |

---

## §5 · YÊU CẦU CHỨC NĂNG mà thiết kế phải đỡ được

Home phải trả lời được, **không cần bấm**: *đang làm gì · dở tới đâu · cần xử gì · làm gì tiếp*.

| | Phải chứng minh được |
|---|---|
| A | Ngày dày việc — vẫn đọc được |
| B | Studio **rỗng** — vẫn ra studio sáng tạo, KHÔNG phải "Home trừ ảnh hero"; đường đi `RESUME → BEGIN` |
| C | **Nhiều dự án** (≥7) — không vỡ |
| D | **Mảnh việc sống** — đủ nhiều loại nội dung, không chỉ mặt bằng |
| E | Widget cá nhân — chọn được, đặt được, **cỡ định sẵn** (1×1 · 2×1 · 2×2), **cấm kéo giãn tự do** |
| F | Khẩu độ Vitals ở mép trên |
| G | Wallgallery / nền động |
| H | Quan hệ chữ × hình đọc được ở **mọi ảnh của người dùng**, không chỉ ảnh đẹp |
| I | Tuỳ biến trong hàng rào DS |
| J | Chrome im lặng |
| K | Có mặt **tổng quan cấp app**, không chỉ là màn hạ cánh của CAD |

**Ràng buộc bố cục bắt buộc:**
- §24 — cấm chữa "nghĩa địa widget" bằng cách ép hết thành **một hàng ngang**; *nghĩa địa widget
  không được thành nghĩa địa toolbar*. Thứ phụ xếp theo **liên quan × tần suất × giá trị quyết định
  × ngữ cảnh**; được nén · gập · hé dần · đưa về theo yêu cầu.
- §28 — phải dùng **hiện vật công việc THẬT**. Cấm gradient giả để Hoà phán thứ bậc. Dùng dữ liệu
  mẫu thì **ghi rõ DEMO**.
- §30 — nội dung ngoài tầm nhìn phải có **dấu hiệu còn tiếp**. (Đã vỡ một lần: `scrollHeight 1293`
  so `clientHeight 775`, không dấu hiệu nào.)

---

## §6 · YÊU CẦU LUỒNG NGHỀ

- **Ba chặng** `2D Kỹ thuật · 3D Thiết kế · Trình chiếu` là **ống kính soi vào MỘT nguồn**, không phải
  ba app. Vào chặng nào cũng dựng được; **không màn nào được chặn vì "chưa làm bước trước"**.
- **Dòng chảy của vật:** `Files (thô, nhiều người góp) → cửa sổ công cụ (thêm ĐỊNH NGHĨA) →
  Thư viện (.idfc đủ định nghĩa) → đề xuất đúng chỗ đang làm`.
- **Đồng bộ** = **KHÔNG TÁCH ra ngay từ đầu**, không phải nối hai thứ lại sau. Đổi vật liệu ở phối
  cảnh thì BOQ đúng vì **chỉ có MỘT vật**, không vì có ai đi đồng bộ hai bảng.
- **Con số** chỉ đến từ chỗ **đo được** (CAD/Revit/khối dựng trong IF). ID trên phối cảnh phục vụ
  **trình bày**, không phục vụ con số. **BOQ chỉ nhận số đo được.**
- **Lưu ở đâu:** VẬT (vật liệu · cấu kiện · bản vẽ · deck) và CẤU TRÚC VIỆC (chuỗi công đoạn · dây
  nối) → **CHUNG, ai cũng thấy**. CÁCH BÀY TRÊN MÀN CỦA TÔI (nấc, cỡ kéo tay, panel thu/mở) →
  **máy mình**.
- **Undo trước, hỏi sau** — chỉ xác nhận khi không undo được.

---

## §7 · TOKEN + TRỢ NĂNG — đo tại nguồn `app/globals.css`, không được nới

| | Giá trị thật |
|---|---|
| Thang bo | `--r-1 6` · `--r-2 10` · `--r-3 14` · `--r-4 20` · `--r-full 999` |
| Bo đồng tâm | `rInner = max(4, rOuter − pad)`, chỉ áp khi `pad ≤ 8` |
| Ô chạm | `--tap 32` · `--tap-lg 44`; cảm ứng override `--tap` lên 44 qua `(hover:none) and (pointer:coarse)` |
| Mật độ | `--tap · --row · --gap · --pad-card · --fs-ui` — mật độ đổi qua token, **không đổi hệ** |
| Nhấn | `--accent #6a57f5`; vòng focus dùng `--accent` **ĐẶC** |
| Mờ vô hiệu | `--mo-vo-hieu` — `0.5` nền tối · `0.62` nền sáng (đạt ≥3:1 cả hai) |
| Nấc sidebar | `BE_RONG_NAC` hiện `52 / 240 / 320`; EXS chốt trần Work Panel **440** — còn nợ |
| Ngưỡng | chữ **4.5:1** · thành phần giao diện **3:1** (WCAG 1.4.11) |

**Luật cứng:**
- Khai màu/độ mờ theo **VAI TRÒ**, không gõ số tại chỗ dùng.
- **Màu không bao giờ là kênh duy nhất** — trạng thái phải kèm chữ và/hoặc hình dạng.
- Kính **chỉ ở lớp VỎ**, ruột thì đặc. **Cấm kính chồng kính.** Panel kính nổi phải portal ra ngoài.
- `prefers-reduced-motion` **thắng tất cả**; thứ chạy vô hạn là thứ **đầu tiên** phải tắt.
- Nấc giảm chói **cắt ánh kim, không bao giờ cắt độ đọc**.
- Kéo thả phải làm được **bằng bàn phím**.
- Chữ Việt: dấu chồng **mang nghĩa** — cấm hoa toàn phần, `line-height < 1.5`, tracking âm.

---

## §8 · HƯỚNG THỊ GIÁC ĐÃ QUA MẮT — danh sách đóng

| Đã qua mắt | Ngày |
|---|---|
| Bộ board `EXS-A…I` + `EXS-J` (bản viết lại) + `EXS-L` trên Claude Design | 20/08 |
| Luật hình học 14 mục | 20/08 |
| Nhãn Home + độ trễ (1 mục xong-mắt duy nhất trong sổ) | 14/08 |

**Ngoài danh sách này, KHÔNG có hướng thị giác nào đang được duyệt.** Cụ thể:
- Home hiện tại — **TRƯỢT** 04/09.
- Ba nghiên cứu A/B/C, bản Hybrid B×A, ba study H1/H2/H3 — **chờ mắt hoặc là ứng viên đã xét**.
- Lô duyệt mắt #1 board 2 (khẩu độ Vitals) và board 3 (chrome/điều hướng) — **chưa từng được phán**.
- `mock-exs-c-home-work-os.html` **đã qua mắt 20/08** nhưng **bố cục của nó SUPERSEDED** (nó là
  bento + WidgetCard). Chỉ dùng để tham chiếu **cách xếp ở khổ hẹp**, và **không** lấy bảng màu hex
  gõ cứng trong đó.

---

## §9 · GU CỦA HOÀ · NGUYÊN TẮC THAM CHIẾU

- **Quiet luxury** — trầm, nhiều khoảng thở, đúng một màu nhấn.
- **"Simple nhưng luôn có chi tiết thú vị"** — và **chi tiết phải MANG TIN**, không phải hoa văn.
  Thước chấm: chi tiết nào không nói được điều gì thì loại, dù đẹp.
- Stage Vẽ 3D: **cubic, nét, sang, đơn giản**.
- Nền **vẫn có hình** — đừng bỏ ảnh vì sợ khó đọc. Nền để **sắc nét**; chữ đọc được nhờ **tấm kính
  đủ đặc** hoặc **lớp phủ chuyển sắc CỤC BỘ ở chân chữ**, không dìm cả tấm. Thẻ **không phủ kín màn**
  — chừa lề cho nền thở. Đo tương phản **tại chân chữ**, không đo trung bình cả thẻ.
- Ưu tiên **hình/ký hiệu hơn đoạn chữ** ở chỗ người ta **lướt qua**; giữ chữ ở chỗ người ta **dừng
  lại đọc**. Nhãn 1–2 từ **vẫn giữ** — đó là TÊN, không phải "chữ nhiều".
- **Ký hiệu nghề (ISO)** là loại icon duy nhất đối thủ đa dụng không có — đáng đầu tư sâu.
  ⚠️ Khai thật: hiện nó **chưa được làm**, thanh công cụ vẫn 11/11 lucide.
- Sổ ref: `docs/nc/REF-VISUAL-EXS-2026-08-20.md` (R1–R16).

---

## §10 · CHỐNG CHỈ ĐỊNH — 13 cờ đỏ (N-10) + bổ sung

```
SaaS dashboard          bento làm mặc định       tường widget
thẻ-cho-mọi-thứ         hộp rỗng khổng lồ        kính lỏng vô cớ
bo/bóng = "cao cấp"     sidebar quản trị         landing page điện ảnh
nút giả bấm không ra gì  chữ "tự động" trong UI   bịa phần trăm tiến trình
màu là kênh duy nhất
```

Bổ sung, cùng hạng:
- **Ba nấc chỉ khác nhau ở chiều cao** — đó là kéo giãn, không phải công năng.
- **Nấc to nhất chỉ là nấc nhỏ phóng to** — không đáng tồn tại, cắt đi.
- **Icon ở lại khi chữ đã hiện** — nói cùng một điều hai lần.
- **Auto-hide panel** — bị chửi nhất ở cả 4 app đối thủ đã khảo.
- **Mặt AI thứ hai** cạnh tranh với Vitals.
- **Nút nói dối việc nó vừa làm** — tệ hơn nút chết.

🔴 **Trượt vì BỐ CỤC thì DỪNG đánh bóng** (N-17): cấm chữa bằng màu · bóng · bo · độ mờ · thu khe.

---

## §11 · PHÒNG SẠCH — cách bắt đầu một nghiên cứu thị giác lớn

```
ĐƯỢC PHÉP LÀM ĐẦU VÀO           CHỈ ĐƯỢC SOI SAU
─────────────────────           ─────────────────
tệp này                         cài đặt hiện tại
yêu cầu chức năng (§5)      →   để lập: HÀNH VI PHẢI GIỮ
tham chiếu của Hoà (§9)             + RÀNG BUỘC KỸ THUẬT
luồng nghề thật (§6)
```

**Không bắt đầu từ ảnh chụp màn hình hiện tại.** Không để bản cài đặt quyết định bố cục.
Bài học từ các bản cũ thì **giữ**; **bố cục** của chúng **không** được giữ mặc định.

## HẠN DÙNG
Hoà lật thì sửa **tại chỗ, viết lại** — không cộng dồn đuôi. Thấy tệp này dài ra là dấu hiệu nó
đang biến thành nhật ký; nhật ký thuộc `docs/00-CHOT.md`, không thuộc đây.
