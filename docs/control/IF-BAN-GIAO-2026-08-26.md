# INTERIORFLOW — BẢN GIAO TÌNH HÌNH · 26/08/2026

> Viết để đưa cho một mô hình khác (ChatGPT) đọc một lần là nắm được, rồi trao đổi tiếp với Hoà.
> Nguồn: 33 artboard thiết kế dựng trong phiên 26/08 + control plane `docs/control/`.
> **Canvas thiết kế:** https://claude.ai/code/artifact/d0b75c15-eb2a-44ff-bb29-d807f456545c

---

## 1 · IF LÀ GÌ

**InteriorFlow (IF)** — hệ điều hành sáng tạo / **lớp quyết định thiết kế** cho nội thất chuyên nghiệp.
Local-first, chạy trên máy người dùng. **Sản phẩm độc lập bán toàn cầu**, KHÔNG phải tool nội bộ của một studio.

**Luật nền tảng — không thương lượng:**
1. **Trung tính thương hiệu.** Không nhúng cứng logo/màu/font của bất kỳ studio nào. Mọi chỗ cần thương hiệu đọc từ **Brand Kit của công trình đang mở**.
2. **Không dữ liệu giả, không PASS giả, không tự tin giả.** Không có tín hiệu thật thì bề mặt **im**, không bịa.
3. **Song ngữ VI/EN.** Giao diện tiếng Việt là mặc định hiện tại nhưng không được khoá cứng.
4. **Dữ liệu nằm trên máy người dùng.**

**Ai quyết cái gì:** Hoà là người duy nhất chốt CANDIDATE → APPROVED. Claude Design sở hữu phần người dùng nhìn thấy. MAIN thi công, **không âm thầm thiết kế lại**. Một người ghi sản xuất tại một thời điểm.

---

## 2 · KỸ THUẬT

- Next.js 14.2.35 + Electron 33.4.11, arm64 macOS, Prisma/SQLite, Tailwind + CSS custom properties
- Font: **BeVietnamPro** (Geist phủ 0/10 dấu chồng tiếng Việt — đã thay)
- 29 route thật; control plane ở `docs/control/` (4 tệp bắt buộc đọc đầu phiên)
- Nợ nền tảng: 128 vi phạm còn lại (từ 1173) — 37 stroke, 49 viewBox, 41 motion, 1 từ vựng G0–G3

---

## 3 · HỆ THIẾT KẾ ĐÃ CHỐT

### Màu — HỆ BA MÀU, tỉ lệ 92 / 7 / 1
| | mã | vai trò | luật |
|---|---|---|---|
| Trung tính | `#f2f2f7` → `#1d1d24` (9 bậc) | mọi thứ không phải quyết định | — |
| **Tím** `#6a57f5` | 7% | **việc của NGƯỜI** — nút chính, mục đang chọn, ô nhập | MỘT điểm neo mỗi màn |
| **Mòng két** `#1f7f88` | 1% | **việc của MÁY** — dải sáng khe Vitals, viên đang-làm, vạch nạp | màn tĩnh thì TUYỆT ĐỐI không có |

**Vì sao 1% vẫn là một màu trong hệ:** tỉ lệ của nó **tự canh** — nó xuất hiện theo *trạng thái có thật của máy*, không theo ý người vẽ. Luật nằm ở **điều kiện**, không nằm ở kỷ luật.

Ngoại lệ **không** thuộc hệ: màu lớp bản vẽ (dữ liệu người dùng) · Brand Kit công trình · ảnh và vật liệu thật.
Màu cảnh báo `#c9843e` (quá hạn, gần đầy) và `#a86a6a` (hỏng) là **ngoại lệ có điều kiện**, cố ý KHÔNG gộp thành màu thứ tư — hệ càng nhiều màu thì mỗi màu càng ít nghĩa. *Chờ Hoà chốt.*

### Token khác
- Radius 6 / 10 / 14 / 20 / full · luật đồng tâm `rInner = max(4, rOuter − pad)`
- Nhịp `130 / 170 / 220 / 300 / 460 ms`, easing `cubic-bezier(.32,.72,0,1)`
- Thang vật liệu **G0–G3**; G3 ba lớp, nghiệm thu: **vành đặc hơn tâm**

### Icon — hai tầng nghĩa
- **ĐỊNH NGHĨA** (danh từ): có khối, ba lớp chiều sâu, màu theo nghĩa lĩnh vực
- **THAO TÁC** (động từ): nét 1.5 trên lưới 24, `currentColor`, phải lùi lại

---

## 4 · VITALS — TRỤ CỘT KIẾN TRÚC GIAO DIỆN

**Vitals THÔI LÀ MỘT VẬT và trở thành chính ĐƯỜNG RANH** giữa điều hướng và vùng làm việc.
Đây là cách chữa lỗi "vòng tròn mờ lạc lõng" đã soi thấy trên app thật: *cái gì luôn ở đó mà không đòi chú ý thì phải là đường biên, không phải một hình tròn.*

Sáu trạng thái:
1. **NGHỈ** — khe 1px, mờ hai đầu, **màu lấy từ nền** (nền đổi theo giờ thì khe đổi theo), thở 4.6s
2. **TRỎ** — khe **võng xuống** tại chỗ; cả thanh đều nhận, trỏ đâu võng đó
3. **HỎI** — vũng mở tiếp thành dải nhập, **cùng một sợi**
4. **ĐANG CHẠY** — dải sáng đi dọc khe, một chiều. Không vòng xoay, không phần trăm bịa
   - **4b THANH ĐANG-LÀM** — viên tối ngồi *trong* khe, sóng thở, tên việc + n/N
   - **4c** — trỏ vào viên thì nở ra vừa đủ để QUYẾT: Xem / Dừng. Không có nút thứ ba
5. **NẶNG** — khối kính lỏng **dâng lên từ trong khe**, xong thì rút lại, không để lại vết
6. **NGĂN XẾP** — khe nở thành: **dòng việc → hàng công cụ → tầng nguồn → chốt**. Nói việc trước, chọn nguồn sau

**Luật gốc: MỌI THỨ CỦA VITALS PHẢI MỌC RA TỪ KHE.** Không gì được xuất hiện ở chỗ khác.
Giữ nguyên từ luật cũ: không tín hiệu thật ⇒ khe im. `401` / không truy được / không rõ **không bao giờ** vẽ thành khe yên.

---

## 5 · 33 ARTBOARD ĐÃ DỰNG — 10 NHÓM

**A · HỆ NỀN** — Hệ ba màu · Icon hai tầng · Tệp và thư mục · Nút + (màu trong khúc xạ)
**B · TRANG CHỦ ba hướng** — A ambient · B · **C bàn làm việc giấy nháp** (widget đặt tự do, băng dán, bố cục kéo được) · Widget vật liệu · Widget thiếu dữ liệu
**C · KHUNG** — Rail 52 · Thanh dưới
**D · VITALS VÀ THÔNG BÁO** — Vitals 6 trạng thái · Thông báo ba mức
**E · MÀN CHÍNH (8)** — Công trình · Tổng quan · **Bản vẽ (bộ công cụ đầy đủ, 5 nhóm, thư viện mở mà KHÔNG che, ba nấc collapse)** · Vật liệu (quả cầu) · Thư viện · Trình bày · Cảm hứng · Hoa văn và ký hiệu
**F · THƯ VIỆN DÙNG CHUNG** — MỘT khuôn cho mọi màn cần thư viện
**G · MÀN PHỤ** — 8 màn phụ · Khoá màn (mặt sau thẻ đăng nhập) · Ảnh đại diện
**H · CHI TIẾT** — Nhập số đo có ghim · Việc cần làm + hỏi brief
**I · TRÊN BẢNG** — Bản vẽ tablet · Dựng 3D tablet
**J · KIẾN TRÚC** — Luồng công trình + chặng còn thiếu · **Master tool nối biến đổi** · Cửa sổ theo môi trường

Tệp nguồn: 33 tệp `*.dc.html` ở gốc repo + `canvas.json`.

---

## 6 · LUẬT QUAN TRỌNG RÚT RA TRONG PHIÊN

**Thư viện dùng chung** — MỘT khuôn, mọi màn. Tay nắm 3 nấc · ô tìm · **hai dải**: *của dự án này* (LUÔN ở trên) và *cấu kiện IDFC dùng chung*, chia **ba loại: vật liệu · CAD · 3D**. Một thẻ = một cấu kiện, mang mã IDFC + kích thước chính + số biến thể + dấu "đã dùng". Vân/bump/texture **chỉ ở editor**, không nhét vào panel chọn. Sửa cấu kiện IDFC mặc định là **biến thể mới**, "đè lên gốc" phải nói rõ đang dùng ở mấy dự án.

**Ba mức nguồn ảnh — ba quyền khác nhau**
- *Máy dựng* → dùng được, **nhãn đi theo tới cùng**
- *Kho mở* (Cosmos/Unsplash/Pexels) → dùng được, ghi tác giả tự động
- *Web có bản quyền* (Pinterest…) → **xem và dàn lên bảng cảm hứng được**, **KHÔNG xuất ra hồ sơ khách**; lúc xuất app phải nói rõ bỏ mấy tấm nào

**Hoa văn: RÚT → DẪN XUẤT → DỰNG LẠI.** Ba bước chứ không phải một nút "sinh hoa văn", vì **giá trị nghề nằm ở bước giữa** — đường đi từ nguồn tới kết quả là thứ người thiết kế đem đi thuyết phục khách. Nét rút từ logo khách **thuộc về khách**, vào Brand Kit công trình đó, không vào kho chung. Hoa văn di sản không ai sở hữu nhưng **phải gọi đúng tên**.

**Master tool (nối node).** Dây **mang kiểu** (ảnh · khối 3D · bản vẽ · video · số) — nối sai kiểu thì cổng không sáng, biết ngay chứ không chạy rồi mới báo lỗi. Chạy lại **chỉ chạy phần đã đổi**. Vitals nói node nào đang chạy — **không có phần trăm tổng**, vì một chuỗi node không có phần trăm tổng thật.

**Cửa sổ theo môi trường.** Một khuôn cửa, bộ công cụ đổi theo **bản chất** nội dung: ảnh tĩnh (6) · ảnh động (thêm nhịp lặp) · video (thêm tiếng + chuyển cảnh, **bỏ** tách nền) · 3D (trục xoay · đèn · máy quay · lưới) · bản vẽ 2D (nét · kích thước · lớp). Công tắc **Sửa ↔ Nối**; **chuyển chế độ không được mất gì** — sửa tay xong bật sang Nối thì thao tác tay phải hiện ra thành node.

**Bảng ≠ để bàn thu nhỏ.** Không hover · thanh ngữ cảnh xuống dưới (tay che phần trên màn) · đích chạm 52px · nét đậm hơn · và **nội dung khác** (đồng hồ phiên đo, cảnh báo hở — vô nghĩa ở bàn).

**Chỗ DUY NHẤT được tối:** khung nhìn 3D, vì khối đọc bằng bóng đổ. Ngoại lệ phải trả lời được câu "vì sao".

**Nút + :** màu nằm **TRONG KHÚC XẠ**, không bôi lên thân. Thân kính gần như không màu; dải tán sắc sống ở **vành** (chặn ở 74% bán kính) và **vệt đọng trên mặt sau**. Nghiệm thu: che vành đi thì **tâm phải gần như trắng**.

**Khoá màn = mặt sau thẻ đăng nhập.** Cùng MỘT tấm thẻ, lật. Mặt sau là một câu về nghề + hình. **Không bịa câu, không gán nhầm người.** Mặc định là **hình vẽ IF tự dựng** — IF chỉ đóng gói thứ IF có quyền; studio muốn ảnh thật thì nạp ảnh của chính mình.

---

## 7 · CHẶNG CÒN THIẾU — bản đồ trung thực

33 artboard phủ tốt **hai chặng giữa** (ý tưởng, triển khai). **Hai đầu còn hở** — và đó lại là hai chỗ người làm nghề mất nhiều thời gian nhất.

**Ba chỗ hở giữa các chặng (quan trọng hơn từng màn thiếu):**
1. **Khảo sát → Ý tưởng** — số đo và ảnh hiện trạng nằm rời, phải mở lại từng thứ
2. **Triển khai → Duyệt** — bản vẽ đổi thì trang trình bày không biết; khách duyệt bản 3, xưởng đã ở bản 7. **Đây là chỗ mất tiền thật**
3. **Duyệt → Thi công** — đứt hẳn: chưa có hồ sơ in được, chưa có khối lượng

**Thứ tự đề xuất (lập luận của Claude, CHƯA kiểm với người làm nghề thật):**
1. **Lịch sử phương án** — không phải vì dễ, mà vì hỏng thì **mất tiền**; mọi thứ khác hỏng thì mất công
2. **Hồ sơ hiện trạng** — khoá đầu vào, **tự hình thành** từ khảo sát đã có, rẻ nhất
3. **Master tool** — thứ không ai khác có; nhưng làm IF *hay hơn* chứ chưa làm IF *đủ dùng*
4. **Bóc khối lượng → báo giá → hồ sơ in** — một chuỗi, làm rời từng cái thì vô nghĩa
5. **Tiến độ · nhật ký công trường · bàn giao** — nhiều studio đã có công cụ khác, ép đổi là khó nhất

---

## 8 · ĐANG CHỜ HOÀ QUYẾT

- Màu cảnh báo `#c9843e` — giữ là ngoại lệ có điều kiện (Claude khuyên) hay gộp thành màu thứ tư?
- Công trình bày kiểu nào: **thẻ chữ** (quét nhanh, so mã) hay **ngăn xếp ảnh** (nhận ra bằng mắt)? Claude đề xuất: ngăn xếp ảnh cho *Gần đây*, thẻ chữ cho *danh sách đầy đủ*
- Ngăn xếp Vitals mở bằng thao tác gì: kéo sâu thêm một nấc · giữ một nhịp · hay mở sẵn khi có vật đang chọn?
- **Thứ tự ưu tiên ở mục 7** — Hoà biết chỗ nào thật sự đau
- Hai script moodboard đang gãy (`build-stacked-board.mjs`, `build-collage.mjs` đọc `test-input/1-moodboard` đã dời sang backup): vá cho fail rõ hay chuyển thư mục về?
- Hai worktree `agent-a54fc5a8`, `agent-a919414f` cần dọn theo 4 điều kiện an toàn

## 9 · CHƯA DỰNG — hàng chờ

Màn presenting (trình chiếu live cho khách) · Thiết kế đồ nội thất (master tool cho furniture) · Tiến độ dạng Gantt · Bảng phương án cạnh nhau · Quản lý bản quét toàn cảnh

## 10 · ĐIỀU KHÔNG ĐƯỢC QUÊN

Toàn bộ 33 artboard là **BẢN VẼ**, không phải app chạy được. Mọi thứ liên quan tới **chuyển động, lực, cảm giác tay** — cú võng của khe, cú lật thẻ khoá màn, cú nở ngăn xếp, xoay-ngắm 3D trên bảng — **ảnh tĩnh không chứng minh được**. Luật số 4 của dự án: **app thật thắng bản vẽ**. Không chỗ nào trong bộ này được ghi PASS cho tới khi chạy trên runtime thật.

---
---

# 🔄 BỔ SUNG — CÙNG NGÀY 26/08, SAU KHI HOÀ SOI TRỰC TIẾP

> Phần trên viết lúc canvas có **33 artboard**. Nay **40**, và có **bốn sửa đổi hệ thống**
> lật lại thứ đã ghi ở trên. Đọc phần này ĐÈ LÊN phần tương ứng phía trên.

## A · MÀU — HAI LẦN SỬA, KẾT LUẬN LÀ TRẮNG ẤM

Phần trên ghi thang trung tính `#f2f2f7 → #1d1d24`. **SAI, đã bỏ.**

Hoà: *"màu nền trắng pha tím loang không phù hợp, làm cảm giác app bị bẩn"*, rồi
*"sao không làm TRẮNG ẤM như Claude, hoặc Apple. Tím là accent thôi mà."*

**Chẩn đoán đúng:** cả thang xám cũ đều mang sắc tím (`#93939f` `#b1b1bd` `#c4c4d0` `#6c6c78`).
Nên nền trắng đọc ra *không sạch*, và **tím thôi là accent vì cả màn đã hơi tím rồi**.

**Thang mới — ấm, hue ~40°, bão hoà rất thấp:**

| vai | cũ (lạnh) | **mới (ấm)** |
|---|---|---|
| nền | `#f2f2f7` | **`#f7f6f3`** |
| panel | `#f9f9fb` | **`#fdfcfa`** |
| field | `#f4f4f9` | **`#f4f3ee`** |
| viền | `#e2e2ea` | **`#e6e3dd`** |
| viền đậm | `#c4c4d0` | **`#c9c5bc`** |
| t1 | `#1d1d24` | **`#22201c`** |
| t2 | `#43434e` | **`#46433d`** |
| t3 | `#6c6c78` | **`#6e6a62`** |
| t4 | `#93939f` | **`#96918a`** |
| t5 | `#b1b1bd` | **`#b5b0a8`** |

Accent giữ nguyên: tím `#6a57f5` (việc của NGƯỜI) · mòng két `#1f7f88` (việc của MÁY).

**Lý do nền ấm chứ không phải trắng Apple:** trắng Apple hơi *lạnh* vì hợp accent *lam* của họ.
IF accent *tím* — nền lạnh + tím thì cả màn trôi về một phía và **mất điểm neo**. Nền ấm đẩy tím
ra xa nhất trên vòng màu ⇒ tím đọc ra là **một quyết định**. Thêm lý do nghề: **gỗ, đá, vải vốn ấm** —
trên nền lạnh mọi mẫu gỗ đều lệch màu.

🔴 **VIỆC CHO CODEX:** `app/globals.css` **VẪN ĐANG LẠNH**. 40 bản vẽ đã ấm hoá, mã thì chưa.
Đổi token một lần, rồi **chạy lại cổng tương phản cả hai theme** — thang ấm có thể làm chữ nhạt hụt ngưỡng.

## B · HÌNH NỀN — CHỈ HAI CHỖ

**Hình nền chỉ ở KHOÁ MÀN và TRANG CHỦ.** Ở đó thì là hình nền **hẳn** (có vệt nắng, chân trời sàn,
bóng đổ). **Mọi màn khác: trắng ấm phẳng, không gradient.**

*Vì sao gradient nhạt làm bẩn:* nó không đủ đậm để đọc ra là MỘT CHỦ Ý, nhưng đủ để mắt thấy trắng
KHÔNG SẠCH. **Nửa vời là chỗ tệ nhất.**

Phát hiện kèm: nền Home phẳng chính là lý do widget kính suốt mấy tuần trông nhạt —
**kính không có gì để khúc xạ**. Có bóng đổ trong hình nền thì kính mới có việc để làm.

## C · 🔴 MÂU THUẪN KHUNG — CẦN HOÀ CHỐT, CHƯA AI SỬA

**Repo có HAI bộ khung chỏi nhau, và bản vẽ hôm nay là bộ thứ ba.**

`docs/SPEC-HA-TANG-UI-IF.md` Trụ 1 (sáu ổ):
`① HEADER 42px · ② NAVIGATOR 214px · ③ STAGE · ④ INSPECTOR 236 · ⑤ TOOLBELT · ⑥ STATUS 26px`
— và **đặt Vitals TRONG status bar dưới**.

Bản vẽ 26/08: thanh trên **52px** · rail **52** · Vitals ở **khe TRÊN**.

| | spec | bản vẽ | phán |
|---|---|---|---|
| Thanh trên | 42 | **52** | ⏳ **CHỜ HOÀ** — 15 tệp neo theo 52 |
| Status 26px | có | ~~không~~ → **đã bổ sung vào màn Bản vẽ** | ✅ sửa rồi |
| Navigator | 214 | rail 52 | ✅ không lệch — 52 là nấc neo, 214 là nấc mở |
| **Vitals** | status **dưới** | khe **trên** | ⏳ spec cũ cần đóng dấu SUPERSEDED |

`IF-CANONICAL.md` §11 (control plane hiện hành) **không** đặt Vitals vào status bar — nó liệt
Vitals và TopShell là hai bề mặt dùng chung riêng biệt. Hoà cũng tả Vitals là *đường sáng ngăn hai
khu thông tin*. ⇒ Trụ 1 phần Vitals là bản **CŨ đã bị vượt qua nhưng KHÔNG AI ĐÓNG DẤU**.
Đây đúng lỗi **M-57** đã trả giá một lần.

## D · VITALS — TAI THỎ LÀ VẬT CHẤT, KHÔNG PHẢI HỘP

Phần trên tả viên/khối. **Đã dựng lại bằng BA LỚP RỜI:**
1. **Vật chất** — gradient toả tròn: đặc `.92` tâm → `.34` ở 72% → **0 ở rìa**. Không cạnh.
2. **Nét tai thỏ** — đường cong đi **RIÊNG**, rõ giữa tan hai đầu. Thứ duy nhất giữ *dáng* khi vật chất loãng.
3. **Ánh sáng** — **TOẢ TỪ TÂM**, không quét ngang.

Một hình duy nhất thì hoặc *đặc-có-cạnh*, hoặc *mờ-mất-dáng*. Phải ba lớp.
Kích thước: trỏ **560** · hỏi **620** · ngăn xếp **780**.

"Toả từ tâm" trùng đúng luật **FROM-THE-CENTER** (SPEC-DESIGN-SYSTEM §2c bổ chính 20/08).

---

## E · BẢY ARTBOARD MỚI (33 → 40)

| artboard | nội dung |
|---|---|
| **Project Legacy** | thay "Tổng quan công trình". Dòng thời gian, bìa công trình trên **băng TỐI** (bìa là ảnh ⇒ ngoại lệ thứ hai sau viewport 3D), thống kê theo năm/thể loại/khách hàng. **Máy KHÔNG tự xếp hạng** — bìa to nhỏ do studio chọn. |
| **Hồ sơ công trình** | bấm bìa → lưu trữ: phối cảnh · thông tin đầu vào · khách hàng · mốc · deck · bề mặt rút về kho. **Cây thư mục 00→08 trùng 1:1 với CHẶNG.** |
| **Tra cứu bằng hình ảnh** | thả ảnh → **vết truy ngược 5 nấc**: công trình → tệp gốc ở chặng nào → vật liệu chỉ định → nhà cung cấp → deck nào, ai duyệt. Không khớp thì **nói không khớp, KHÔNG đoán nguồn**. |
| **Thu thập có đầu bài** | đề bài + thông số + tuyên ngôn → gợi ý. **Ràng buộc LỌC, gu XẾP HẠNG. Không có điểm tổng.** Bảng cảm hứng dùng lại khuôn xếp chồng có sẵn. |
| **Toolbelt linh hoạt** | MỘT khối: ngang ↔ dọc · neo 4 cạnh · **ngả tối theo trường 3D**. `⋯` mở kho 20 công cụ. Belt tối đa 8 — ghim cái thứ 9 phải bỏ một cái. |
| **Chỉ dẫn** | thanh dưới **ô đầy RỘNG, ô trống HẸP**. Ba mức leo thang: im lặng → trỏ mới nói → chỉ khi bí. Bong bóng **phải có mũi chỉ vào đúng ô**. |
| **Thẻ màu hệ thống** | hình nền sinh ra bộ: khoá màn + trường + thang trung tính. **Tím và mòng két KHÔNG đổi theo bộ** (chỉ ngả tông ±6%) — màu mang nghĩa thì không đổi theo gu. |

## F · LUẬT MỚI RÚT RA HÔM NAY

1. **KHOẢNG THỞ PHẢI TRẢ LỜI ĐƯỢC MỘT TRONG BA:** *nền là nội dung* · *ngăn hai bản chất* · *chừa đường đi*.
   Không kiểu nào ⇒ đó là **THIẾU**, không phải **THOÁNG**.
2. **HÀNG LỌC NẰM TRỌN MỘT HÀNG.** Không đủ chỗ thì **panel dài ra**, không cho tag xuống dòng.
   Tối đa **4 tag hiện**, thừa thì gom.
3. **PHÓNG BẰNG `scale`, KHÔNG ĐỔI BÁN KÍNH.** Đổi bán kính thì capsule gãy *giữa lúc chuyển động*.
4. **CỠ LÚC ĐỨNG YÊN KHÔNG ĐỔI THEO DỮ LIỆU.** Dữ liệu đổi cỡ lúc MỞ.
5. **CHỈ DẪN: một lần là đủ · tắt được vĩnh viễn · không bao giờ chặn đường.**
   Hai luật đầu **cố ý làm giảm chỉ số** — bỏ chúng để tăng số liệu là lúc IF bắt đầu hỏng.
6. **HỌC TỪ VIỆC CHỌN, KHÔNG HỌC TỪ VIỆC NHÌN.** Chỉ hành vi *đưa vào bảng* mới sửa hồ sơ gu.
   Trỏ, lướt, dừng lâu — **không tính**.
7. **TRA REPO TRƯỚC KHI VẼ.** Hoà bắt được **hai lần** trong một phiên: thư viện màu (đã có 12 tệp
   + kiến trúc pháp lý) và dock (đã có spec số đo từ 02/08). Máy soi không bắt được lỗi này.

## G · 🔴 NỢ KỸ THUẬT — ĐO ĐƯỢC, CHƯA CHỮA

Bốn nhóm vi phạm trên chính bản vẽ, tôi tự soi ra:
- **Bo góc**: dùng 16 giá trị ngoài thang `6/10/14/20`
- **Nhịp**: `1.4s · 2.6s · 3.9s · 4.2s · 5.4s · 5.6s` — **không cái nào trên thang** `130/170/220/300/460ms`.
  ⇒ Đây **không phải ngoại lệ mà là THANG THIẾU MỤC**: chưa có mục *hoạt hình lặp vô hạn*.
  Ba ca độc lập rơi vào đó (khe thở · tán sắc nút + · dock). **Phải bổ mục vào thang, không vá từng ca.**
- **stroke-width**: ~180 chỗ lệch 1.5
- **4 màu tự đẻ** chưa khai báo token: `#3d7f5f` `#c9843e` `#a86a6a` + bậc xám lạ

**Máy soi KHÔNG quét `.dc.html`** — 40 artboard nằm ngoài tầm mọi guard. Đó là lý do bốn lỗi trên sống được.
⇒ Cần `scripts/soi-artboard.mjs`: kiểm nhịp `44/34/15/5` · capsule · bo đồng tâm · thang màu ấm · thang bo.

## H · CHỜ HOÀ QUYẾT

1. **Thanh trên 52 hay 42?** (mục C)
2. **Đóng dấu SUPERSEDED** lên Trụ 1 phần Vitals?
3. **Đổi token globals.css sang thang ấm?** (mục A)
4. Màu cảnh báo `#c9843e` — ngoại lệ có điều kiện (Claude khuyên) hay màu thứ tư?
5. Công trình: **thẻ chữ** hay **ngăn xếp ảnh**?
6. Ngăn xếp Vitals mở bằng thao tác gì?
7. **3 tệp untracked trong 2 worktree** — mock bàn thử màu + bộ nền chung, liên quan trực tiếp hệ màu đang bàn
8. **Hai script moodboard đang gãy** (`test-input/1-moodboard` đã dời) — khuôn xếp chồng lấy từ đó
9. **40 tệp `.dc.html` + canvas chưa vào git**

## I · CHƯA DỰNG

Màn presenting (trình chiếu live) · thiết kế đồ nội thất · Gantt tiến độ · bảng phương án cạnh nhau ·
quản lý bản quét toàn cảnh · node có núm ngay trong thân (ảnh Hoà gửi cuối)
