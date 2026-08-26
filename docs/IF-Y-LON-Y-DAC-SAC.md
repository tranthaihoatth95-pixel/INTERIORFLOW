# InteriorFlow · Ý LỚN + Ý ĐẶC SẮC KHÁC LẠ THÔNG MINH

> T chắt từ `docs/00-CHOT.md` (248k chars, 50 chốt Hoà + 30 mục ⭐⭐/⭐⭐⭐), `IF-KIEN-TRUC.md`, `TRIET-LY-IF.md`, `IF-KIEN-TRUC-OS.md`. Chỉ giữ ý ĐẶC SẮC (không phải liệt kê hết), gom theo nhóm — không theo thời gian.

---

## A · ĐỊNH VỊ SẢN PHẨM

### A1 · IF là Local-first Design Operating System — KHÔNG phải "AI App"
> *"AI chỉ là một engine bên trong"* — Hoà 18/08

Định nghĩa mới thay mọi câu cũ. IF vẫn phải quản dự án, deadline, workflow, tài liệu bình thường **khi tháo hết AI ra**. Hào cạnh tranh không phải model, mà là "Local-first" — data không chảy ra ngoài không được phép.

### A2 · IF ≠ Notion/Monday/ClickUp
Workflow ngành nội thất **KHÔNG** phải Todo/Doing/Done. Là 12 giai đoạn: INPUT → RESEARCH → LAYOUT → MOODBOARD → CONCEPT → 3D → DESIGN REVIEW → REVISION → TENDER → SHOPDRAWING → SITE → HANDOVER (18/08 §4b). Mỗi giai đoạn sinh knowledge — sau 5 năm thành **Company Design Intelligence**.

### A3 · HAI ỨNG DỤNG SIÊU KHÁC NHIỆT ĐỘ CÙNG NHÀ (03/08)
- **InteriorFlow** = MÁY PHÁT, chạy trên máy tính/tablet, tím lạnh, tạo ra sản phẩm
- **ArchiNote** = MÁY THU, chạy điện thoại, kem+vàng ấm, thu vào dữ liệu thật ngoài công trường
- Chung nguồn qua ATLAS/Lark, KHÔNG gọi thẳng nhau
- Cảm ứng tablet IF = để **VẼ chính xác**; cảm ứng ArchiNote = để **GHI nhanh** — cùng thiết bị, khác mục đích ⇒ khác thiết kế

### A4 · Định vị mới sau khi bàn tư duy sáng tạo (18/08)
> IF là *"môi trường designer điều khiển một đội ngũ AI như điều khiển team thiết kế — giao việc được, xem tiến độ được, can thiệp giữa chừng được, phản biện được, luôn giữ quyền quyết định cuối cùng."*

Không phải "AI thay designer". Là "AI như nhân viên trong app".

---

## B · TRIẾT LÝ NỀN — 8 NGUYÊN TẮC SONG SONG

### Hạ tầng (18/08)
1. **Own your data** — dữ liệu của người dùng, không thuộc nhà cung cấp
2. **Own your workflow** — không bị khoá bởi SaaS/API
3. **Own your memory** — schema riêng, không lưu theo format model
4. **Replace your AI** — model đổi tự do, không phải viết lại app

### Trải nghiệm sáng tạo (18/08)
5. **AI proposes** — máy đề xuất
6. **Human directs** — người điều khiển
7. **Every decision visible** — quyết định nào cũng thấy được
8. **Every decision reversible** — quay lại được

**Câu tổng**: *"Maximum control with minimum friction"* — KHÔNG phải *"maximum automation"*. Vì với designer, ý đồ thiết kế nằm trong **QUÁ TRÌNH lựa chọn/loại bỏ/điều chỉnh**, không chỉ trong output.

---

## C · KIẾN TRÚC UI — LỜI GIẢI CHO "3 CHẶNG NHƯ 3 APP"

### C1 · Canvas + Cửa sổ + Chặng + Sidebar — bốn vai, không cái nào giẫm cái nào
- **Canvas** = SƠ ĐỒ DÂY CHUYỀN
- **Cửa sổ** = XƯỞNG của một công đoạn (có thể kéo, mở nhiều, chứa môi trường — ảnh/video/3D)
- **Chặng** = KHUNG NHÌN
- **Sidebar** = BẢN ĐỒ

### C2 · Cửa sổ công cụ = "công dân của canvas", KHÔNG modal (15/08 khuya)
> *"nó phải THUỘC môi trường canvas. Cho phép mở NHIỀU master tool để nối với, và ĐỊNH NGHĨA FILE = KẾT QUẢ."*

Đây là lời giải kiến trúc — không phải chuyện thẩm mỹ. Mỗi cửa sổ có cổng ra mang sẵn định nghĩa, nối được thành dây chuyền.

### C3 · CHẶNG THÔI QUYẾT ĐỊNH GIAO DIỆN — ⭐⭐⭐ (16/08)
Nếu môi trường sống TRONG cửa sổ, thì 2D/3D/Trình chiếu **khác nhau ở chỗ MỞ CỬA SỔ NÀO**, không phải ở chỗ ĐỔI CẢ BỘ VỎ. Giải bằng KIẾN TRÚC, không phải bằng đồng bộ bo góc từng chỗ.

### C4 · Tool 3 lớp (13/08 → 16/08)
```
① Thanh chung   — 9-10 lệnh giống HỆT 3 chặng, ≥1-2 hàng luôn hiện
② Nhóm lệnh    — group-by, 2 khuôn: "iOS folder" tra thỉnh thoảng · "Photoshop ổ" dùng liên tục
③ Cửa sổ công cụ — mini-app cho tác vụ chuyên sâu
```
Người pro gọi lệnh đơn, người mới dùng gói — CÙNG MỘT REGISTRY.

### C5 · MỘT DÂY CHUYỀN, KHÔNG 3 CANVAS RIÊNG — ⭐⭐ (16/08)
Nối 2D → 3D → render → deck = MỘT dây chuyền. Mỗi chặng một canvas riêng thì chuỗi này **KHÔNG NỐI ĐƯỢC**, mỗi lần qua chặng là một lần "xuất sang" — đúng thứ IF sinh ra để giết.

### C6 · Sidebar là HỆ ROUTER TOÀN APP (16/08)
Sidebar không phải điều hướng chặng. Là **BẢN ĐỒ**, hai cụm XƯỞNG ↔ DỰ ÁN, ba nấc 28/240/320 — mỗi nấc **MỘT CÔNG NĂNG KHÁC**, KHÔNG phải ba cỡ. Nấc to bổ sung chi tiết, không phóng to lớp cũ.

### C7 · Icon 7 loại (16/08) — không phải "icon" chung chung
Icon giao diện · Ký hiệu nghề (ISO — thứ IF độc quyền không app đa dụng nào có) · Icon nén tin · Hình minh hoạ · Dấu trạng thái · Nhãn loại tệp · Ảnh đại diện người — mỗi loại một luật riêng.

### C8 · Ba tầng ánh sáng, ba nghĩa khác nhau (16/08)
① kính nhận sáng = **chất liệu** · ② hover gradient = **khả năng** (bấm được) · ③ viền chạy = **trạng thái** (đang render). Ba tầng KHÔNG được lẫn nhau — bản vẽ phải dựng cạnh nhau chứng minh phân biệt được.

---

## D · HỆ IDF — HỘT NHÂN THUẦN CỦA SẢN PHẨM

### D1 · .idfc = MỘT CẤU KIỆN, .idf = MỘT DỰ ÁN (07/08)
- `.idf` = dự án (như Revit `.rvt`)
- `.idfc` = cấu kiện dùng lại được ở mọi dự án (như Revit `.rfa`)
- Chữ "C" = **Content** không phải Component (07/08 khuya) — vì video/văn bản/mẫu trang cũng là `.idfc`
- KHÔNG phá luật "cấm đẻ format thứ hai" — hai cấp độ của cùng một hệ

### D2 · Một `.idfc` GÓI ĐỦ CẢ 3 CHẶNG + GIÁ + TIẾN ĐỘ (07/08)
```
             ┌── .idfc (ghế) ──┐
    ① 2D              ② 3D              ③ Trình bày
    ký hiệu · block   khối · PBR        giá · thông số
         │                │                    │
         └── SỬA MỘT CHỖ, CẢ 3 CẬP NHẬT ──┘
                    kéo theo GIÁ + TIẾN ĐỘ
```
Đây là thứ Revit·SketchUp·D5 KHÔNG có — họ phải xuất-nhập giữa 3 app. IF biến 4 lần thành 1 lần.

### D3 · Files ↔ Thư viện = HAI TRẠNG THÁI của CÙNG MỘT THỨ (16/08) — ⭐⭐
Không phải hai kho ngang hàng. Là: *chưa đủ định nghĩa* ↔ *đã đủ định nghĩa*. Cửa sổ công cụ CHÍNH LÀ thứ đưa nó qua ranh giới. **Đầu ra một cửa sổ = asset mang sẵn định nghĩa** = lúc nó rời Files và vào Thư viện.

### D4 · Files có HAI TẦNG khác BẢN CHẤT (17/08)
① thư mục hệ thống của dự án · ② phần thô DÙNG CHUNG nhiều người góp (map texture, NCC, range giá). Khác bản chất = phải THẤY ĐƯỢC trên giao diện, KHÔNG rút thành bộ lọc/nhãn.

### D5 · Collection+ = TẦNG THỨ HAI của DistillEngine (17/08)
Cấp DỰ ÁN đã có (Thẻ DNA, Grounded Render). Cấp STUDIO là mới — chưng gói áp cho NHIỀU dự án. Mặt tiền thứ 6 của cỗ máy chưng cất.

---

## E · ĐỒNG BỘ — CÂU ĐỊNH VỊ CẢ SẢN PHẨM

### E1 · ĐỊNH NGHĨA ĐỒNG BỘ — ⭐⭐⭐ (16/08 khuya)
> **Đồng bộ KHÔNG PHẢI nối hai thứ lại. Đồng bộ là KHÔNG TÁCH chúng ra ngay từ đầu.**

Khi một vật liệu mang **cả hai nửa** (render được VÀ biết mình là hàng của ai giá bao nhiêu), đổi trong phối cảnh xong BOQ đúng KHÔNG PHẢI vì có ai đi đồng bộ hai bảng, mà vì **CHỈ CÓ MỘT VẬT**. Đây là hào IF — Revit không có (đẹp không nổi), Canva không có (không thật).

### E2 · Vật liệu TRỎ tới bản ghi thương mại, KHÔNG chép giá vào mình
Giá đổi hằng ngày, texture thì không. Chép giá vào vật liệu ⇒ mỗi lần bảng giá đổi phải sửa MỌI vật liệu. *"Hiểu được thông tin"* = trỏ tới được, KHÔNG phải chứa.

### E3 · LUẬT LƯU CHUNG ↔ MÁY (16/08)
| | |
|---|---|
| **VẬT** (vật liệu, cấu kiện, bản vẽ, deck) | LƯU CHUNG — tài sản, không phải sở thích |
| **CẤU TRÚC VIỆC** (chuỗi công đoạn, dây, vị trí node) | LƯU CHUNG — ai mở cũng thấy CÙNG dây chuyền |
| **CÁCH BÀY TRÊN MÀN CỦA TÔI** (cỡ cửa sổ, nấc sidebar, panel thu/mở) | LƯU MÁY MÌNH |

---

## F · CHUẨN NGHỀ — THỨ APP ĐA DỤNG KHÔNG CÓ

### F1 · CHUẨN ĐẦU RA NGHỀ = LUẬT (11/08)
Lần đầu MỞ FILE ĐẦU RA bằng mắt, phát hiện engine đủ nhưng trượt vì chữ đè hình · tỷ lệ lẻ "1:47" · khung tên lộ jargon. **Kiểm code không bắt được**. Lập `CHUAN-DAU-RA-NGHE.md`: checklist NHỊ PHÂN theo ISO 128/216 + máy chặn lúc xuất + mắt người tick. Luật nghiệm thu MỚI: **frontier sinh file thì nghiệm thu = MỞ FILE, không phải tsc/test/screenshot**.

### F2 · ĐỒNG BỘ HỌ CHUẨN (15/08) — ⭐
> *"cái sai không đến từ tuyệt đối hay tương đối, cái sai đến từ sự KHÔNG ĐỒNG BỘ TRONG CÁCH HIỂU… một công trình đủ chuẩn không cùng họ là TỰ HUỶ."*

Ví dụ: mặt bàn châu Âu + mặt bếp châu Á + giường Nhật — mỗi số đúng ở quê, ghép thành công trình không ai ở được. Cấm TRỘN ÂM THẦM. Vị trí công trình = biến kéo trọn bộ.

### F3 · BIẾN SỐ NGỮ CẢNH — trục thứ 3 của tiêu chuẩn (15/08)
NGUỒN (ai ban hành) · RÀNG BUỘC (chặt tới đâu) — hai trục cũ không phủ. Thêm **VỊ TRÍ ĐỊA LÝ**: ven biển (ăn mòn → inox mác cao) · vùng ngập · miền Bắc mùa đông · hướng Tây nắng gắt · tập quán (bàn thờ, hướng bếp). Máy GỢI Ý — người thêm. **Chỉ SIẾT THÊM**, KHÔNG nới lỏng luật bắt buộc.

### F4 · KIỂM CHUẨN = MÁY, GÓP Ý = AI (07/08 → 15/08)
- **Máy** kiểm luật đo được: hành lang ≥1200mm, cửa thoát ≥800mm — tất định, 0đ, dẫn được điều khoản
- **AI** ở lớp góp ý (bố cục, ánh sáng, câu chuyện) — không bao giờ chặn
- CẤM trộn hai lớp: người dùng sẽ học cách bỏ qua CẢ HAI

### F5 · ID TRÊN PHỐI CẢNH ≠ CON SỐ BOQ (15/08)
- Gán id ảnh phối cảnh chỉ **PHỤC VỤ TRÌNH BÀY/thẩm mỹ** — nhóm spec, bảng vật liệu, bản nộp y chang bố cục màn
- Con số CHỈ đến từ **CAD/khối đo được**
- **BOQ chỉ nhận số đo được**, người edit chỉnh sau

---

## G · AI LAYER — LỚP THAY THẾ ĐƯỢC

### G1 · AI Gateway (18/08)
IF chỉ nói chuyện với Gateway của mình: `/chat` `/search` `/embed` `/analyze-project` `/create-task` `/review-design`. Gateway quyết định backend (Ollama · Qwen · Claude · Gemini · llama.cpp · vLLM). Đổi backend = đổi CẤU HÌNH, không sửa code.

### G2 · Privacy mode Hybrid (18/08)
- ✓ RA cloud: Search trend Internet · General brainstorming
- ✕ KHÔNG ra cloud: **Hồ sơ khách hàng · File dự án · Nhân sự · Budget · Tender**

### G3 · IF Memory schema riêng — KHÔNG lưu theo format model
Person · Project · Client · Material · Supplier · Space · **Design decision** · Issue · Feedback · **Lesson learned** · Standard. Đổi Qwen → Llama vẫn đọc được toàn bộ ký ức.

### G4 · WHY THIS? — evidence + assumptions + rationale
Mọi đề xuất AI phải kèm khối *"Why this?"* liệt kê căn cứ + nút **Change reasoning**. Không có transparency = chain-of-thought nội bộ (rác). Có transparency = 5 dòng bằng chứng ngắn kiểm tra được.

### G5 · CONTROL POINTS 4 mức (18/08)
Assist · Collaborate · Delegate · Autopilot — **người dùng đặt mức TỪNG GIAI ĐOẠN**. Creative Director khác Junior. Automation trở thành BIẾN SỐ do designer kiểm soát.

### G6 · Non-destructive AI workflow (18/08)
AI sai bước 4-5-6 → không làm lại từ đầu. **Return to step 4** → giữ 1-3 → AI regenerate 4-6. Giống layer/history Photoshop.

### G7 · Creative Timeline — decision > file (18/08)
Không chỉ "Version 17". Là cây concept evolution: Direction A rejected "too commercial" · Direction B.1 → feedback → B.2 → material changed → B.3 ★APPROVED · Direction C archived. **Sau 6 tháng vẫn trả lời được: "Tại sao thiết kế cuối cùng trở thành như vậy?"**

### G8 · Grounded Render — thuật toán "render bám ý" (13/08)
Bệnh AI trộn-toàn-cục làm ảnh chung chung → giải 6 bước: đọc khung phối cảnh · wire-color định danh mảng · phiếu 4 cấp cho KTS duyệt · bảng ánh xạ + núm mức bám per-mảng · sinh từng mảng qua mask cứng · pass thống nhất ánh sáng. **Trọng số 70/20/10**: 70% chuẩn ngành + 20% Thẻ DNA KTS + 10% gu CĐT. **Grounded Render = CONCEPT trình CĐT, không technical**.

### G9 · Data > Model (18/08)
> Model có thể thay. **Data + workflow + knowledge graph mới là TÀI SẢN.**

Sau 5 năm: 500 projects · 50k material · 20k comment · 5k feedback · 3k site issue · 100k drawings → **Company Design Intelligence**. Designer hỏi *"resort 5 sao trước đây dùng gỗ nào cho pool?"* — AI trả lời từ lịch sử CÔNG TY, không generic Internet.

### G10 · Hai thế giới MANAGEMENT ↔ DEVELOPMENT (18/08)
- Management = giúp công ty vận hành
- Development = giúp designer giỏi lên
- AI ở giữa học từ cả hai → **CAREER INTELLIGENCE SYSTEM**

Ví dụ: IF biết *"Hoà · Hospitality · 8 projects · Strong storytelling · Weak tender coordination"* → gợi *"3 case study detailing hospitality nên xem"* hoặc *"project mới phù hợp thử vai Design Lead"*.

---

## H · CHỐNG MA — MÁY SOI + PHÂN LOẠI + DATA ORIGIN

### H1 · MỌI THIẾT KẾ PHẢI ÁP DS, CẤM MỒ CÔI (18/08)
Nguyên tắc CỨNG. Mọi phiếu build UI phải dẫn được token/component DS. Cấm chế màu/kích thước lẻ.

### H2 · MÁY SOI ĐỒNG DẠNG — thước đo trung tính (15/08 cuối phiên) — ⭐⭐
> *"luật trung tính có thể build thành MÁY DÒ để nhận ra cơ chế giống nhau, bản chất giống nhau, rồi áp dụng cách xử lý giống nhau — TÁI CHẾ QUY TRÌNH: dùng cùng thứ vốn hoá đã có cho những vấn đề tưởng khác nhau hoá ra chung bản chất."*

Đo được 6 ca "cùng bản chất khác tên" trong 1 phiên: 5 sổ lệnh song song · 4 lối vào file · 2 hệ tên chặng · 4 bộ từ vựng cho cùng khái niệm · 6 file luật rời · cây ký ức dựng 2 lần. **Đây là thuộc tính hệ thống của cách app lớn lên**, không phải tai nạn. Máy soi CHỐNG lãng phí vốn.

### H3 · MASTER TOOL ↔ ToolWindow = ca mẫu ĐẺ TÊN MA — ⭐⭐ (16/08)
`"master tool"` = 0 lần trong code, 26 lần trong sổ. `ToolWindow` = 13 chỗ trong code, 0 trong sổ. **Sổ ĐẺ RA MỘT CÁI TÊN THỨ HAI cho thứ CODE ĐÃ ĐẶT TÊN RỒI**. Đọc sổ tưởng khái niệm mới → đi tìm không thấy → chế lại. Lỗi 15 ngày trôi qua audit.

### H4 · DATAORIGIN nhãn NGUỒN trên MỌI BẢN GHI (11/08)
`app-core | studio | project | demo` — CONTENT-RULES máy-đọc-được. *"Reset về trung tính"* thành MỘT lệnh xoá theo nhãn.

### H5 · SMART INGEST — bất khả nén không mất chất lượng (11/08)
Cơ chế THẬT: bản gốc BẤT BIẾN (Files, luật B4) + proxy lossy để hiển thị (xuất/in về gốc, chất lượng cuối không mất) + bộ định tuyến trích xuất theo yêu cầu. Mọi định dạng nhập được.

### H6 · SMART CONVERT — mọi định dạng tĩnh → EDITABLE tách lớp (13/08)
PDF → deck IF 3 lớp Nền·Ảnh·Chữ (chữ THẬT từ PDF, không OCR) → xuất PPTX. Bậc 1 tất định. Bậc 2 OCR+AI cờ `inferred`. Gốc bất biến, bản chuyển đổi là **DẪN XUẤT có provenance**.

### H7 · KÝ HIỆU BẢN VẼ ISO làm icon nghề (14/08) — ⭐⭐
Lệnh nghề dùng CHÍNH KÝ HIỆU BẢN VẼ ISO làm icon để KTS nhìn là hiểu, không cần học. **App đa dụng KHÔNG có** — ngành xây dựng đã có sẵn bộ ký hiệu chuẩn KTS đọc được TRƯỚC khi mở IF.

---

## I · MIRROR ĐỐI XỨNG — RÚT GỌN THUẬT TOÁN (14/08)

Trục đối xứng CHỈ dùng TỪ CHỐI fit (torus tay vịn bị annularity check bỏ) — chưa dùng CHỦ ĐỘNG SINH. **Thêm mirror-completion**: dò mặt phẳng đối xứng qua PCA → phần fit chắc hơn (RMS thấp) làm gốc → **mirror sang phần đối xứng thay vì giải 2 bên độc lập rồi cộng sai số**. Ghế 4 chân: giải 1 chân + mirror 3 lần > giải 4 chân độc lập.

---

## J · GHẾ TỪ ẢNH — PROOF (14/08)
Trellis 25s + `.idfc` cờ 3 nấc per-trường (`measured/inferred/verified`) + viewer public `__lincoln-viewer.html`. **Chứng minh sống** đường ảnh → mesh → mang định nghĩa → phối cảnh.

---

## K · VẬN HÀNH PHỐI HỢP T — CHÍNH TRỊ CỦA TỔ CHỨC AGENT

### K1 · THIẾT KẾ TRƯỚC — TÍNH NĂNG FILL SAU (03/08)
Nghiên cứu xong phải VẼ NGAY LÊN GIAO DIỆN (kể cả phần chưa code, `disabled` kèm lý do). **Giao diện = CÂY GIA PHẢ NHÌN THẤY ĐƯỢC** của toàn bộ tính năng. Mỗi ô trống trên giao diện = 1 dòng CHECKLIST. **Cấm nút giả · Cấm xoá ô trống cho gọn mắt** — ô trống là bằng chứng còn việc.

### K2 · CƠ CHẾ CHỐNG QUÊN FRONTIER (11/08)
Sổ giấy mục theo thời gian — chỉ MÁY kiểm mới không quên. `npm run soi:frontier` đầu mỗi phiên, exit 1 chặn bàn-việc-mới khi còn lệch. **KỶ LUẬT: chốt tính năng mới = thêm 1 entry registry NGAY LÚC CHỐT, trước khi code**.

### K3 · PHÂN LOẠI VAI 3 NHÓM thành MÁY (12/08)
Mỗi entry registry mang `vai`: ⭐MVP · 🔗KẾT NỐI · 🧰ĐỠ. Máy đếm % và cảnh báo khi MVP đói hơn support (anti-pattern #3). ≥3 entry cùng vai + cùng hệ → group-by thành 1 phiếu.

### K4 · Chốt 16/08 — ĐỔI VAI T
T = phiên CHÍNH — nghiên cứu · trao đổi · kiểm chứng · điều phối phiên phụ. T thôi ôm build. **KHÔNG phiên phụ nào không có giao diện đi kèm**. Bảng giao diện phải follow hệ thống — cấm sáng tạo ngoài vùng.

### K5 · REVIEW GATE (11/08 khuya)
Khách hàng KHÔNG vào hệ comment. Luồng khách giữ truyền thống. Tính năng thật = **Cổng duyệt NỘI BỘ**: chủ trì set mốc → Vitals push thông báo → sếp/bộ phận rơi đúng trang, note ghim vị trí (gõ/voice-to-text) → note tự gom thành CHECKLIST → designer tick → checklist sạch mới xuất gửi mail.

### K6 · REVIEW HAI TIẾNG — ĐỊNH NGHĨA LẠI NỢ MẮT (18/08)
Không phải audit thao tác. Là **QUYẾT ĐỊNH HƯỚNG**. 3 nhóm phán quyết: ✅ đúng hướng / 🟡 đúng khung sai chi tiết / 🔴 sai hướng. 4 câu hỏi thước đo + 7 loại lỗi + 5 bảng đóng phiên. Ca cần thao tác thật → chuyển **nợ QA**, thôi gọi nợ mắt.

### K7 · CƠ CHẾ ⓪ / ⓪b / ⑦b / ⑦c (15-16/08)
- ⓪ TIỀN ĐỀ: agent phải xác nhận/bác giả định của phiếu trước khi làm
- ⓪b MỐC GIT: agent chạy `git rev-list --count HEAD..main` — lệch > 0 DỪNG
- ⑦b CHƯA CHẮC: bắt buộc mục trong báo cáo, trống cũng phải ghi
- ⑦c HẠN DÙNG KẾT LUẬN: "hết đúng khi X xảy ra"

Đây là 4 van an toàn CHỐNG ĐẺ MA + CHỐNG TRẢ LỜI MÙ.

### K8 · TRIẾT LÝ IF (13/08) — Hiến pháp thi công
Cây T0-T8 · Trục N1 (human-centric sáng tạo lai kỹ thuật, 7 CẤM KỴ) · Trục N2 (đơn giản ngoài, sâu trong, học từ nghề) · 6 điều hành Đ1-Đ6 gồm: **nhìn-vào-trong-trước · ánh-xạ-2-giá-trị · ghim-cứng-vai-agent**. Mã điều khoản TRÍCH ĐƯỢC vào mọi phiếu.

---

## L · DELIGHT + THẨM MỸ — không hoa văn

### L1 · SIMPLE nhưng có CHI TIẾT MANG TIN — ⭐⭐ (16/08)
Ba chi tiết mang tin (đường dọc "hôm nay" · ô trống nét đứt drop zone · vạch nhỏ đầu thanh việc) đều **NÓI ĐƯỢC ĐIỀU GÌ ĐÓ**, không vì đẹp. ⇒ Thước chấm chữ ký thị giác: **không mang thông tin thì loại, dù đẹp**. Mở rộng LightState: mọi chi tiết thị giác đều phải mang tin.

### L2 · HOME = NƠI TẬP TRUNG SỰ THÚ VỊ + TUỲ BIẾN kiểu iPad (16/08)
Widget CỠ ĐỊNH SẴN 1×1/2×1/2×2 (không kéo giãn tự do) — điều kiện để **cùng widget chạy trên máy tính · tablet · điện thoại**. Không phải chuyện thẩm mỹ mà là điều kiện cross-platform.

### L3 · CẶP MÀU ĐẢO VAI THEO GIỜ (16/08)
Không chọn MỘT màu — dùng CẶP đảo vai theo theme. Tối tím chủ + đồng điểm xuyết · Sáng đồng chủ + tím điểm xuyết. Mỗi thời điểm vẫn ĐÚNG MỘT MÀU CHỦ. Nối cơ chế ánh-sáng-theo-giờ ĐÃ CÓ ở Home.

### L4 · HỆ MÀU 3 LỚP (16/08)
① Màu IF (logo · màn khoá · bộ cài) — KHOÁ CỨNG
② Màu vỏ làm việc — KTS chọn trong BIÊN, máy giữ hệ (chọn HƯỚNG, máy giữ THANG TÔNG)
③ Màu dự án (Brand Kit) — TỰ DO

Vùng cấm nhìn thấy được trên núm màu: dải gạch chéo ±20° quanh các màu nghĩa. Kéo tới là máy chặn kèm lý do — biến "tự do trong phạm vi cho phép" từ khái niệm thành THAO TÁC.

### L5 · CARD 3 NẤC = BA CÔNG NĂNG (16/08) — ⭐⭐
Mặc định (ký hiệu) → Vừa (chữ, icon biến mất) → Full (đoạn văn). **Nấc TO là BỔ SUNG CHI TIẾT** cho nấc nhỏ, KHÔNG phóng to lớp cũ. Cửa nghiệm thu: che nấc to đi, nấc nhỏ vẫn đứng được một mình VÀ nấc to có thứ nấc nhỏ KHÔNG THỂ có.

### L6 · VITALS NEO THEO NGỮ CẢNH (16/08)
Ở Home = chấm cạnh ô tìm · trong chặng = nút RỜI cạnh trục phải. **KTS đang chỉnh panel phải mà bí thì KHÔNG muốn rời chuột chạy lên đỉnh**. Đưa trợ giúp tới chỗ tay đang đặt.

---

## M · TÊN — ĐỔI TÊN LÀ QUYẾT ĐỊNH KIẾN TRÚC

### M1 · BỘ TÊN CHÍNH THỨC (03/08, vòng cuối)
- App: **InteriorFlow**
- 3 chặng: **2D Kỹ thuật · 3D Thiết kế · Trình bày** (rút gọn: 2D · 3D · Trình bày)
- Chặng 1 mode: **Sơ phác ↔ Kỹ thuật**
- Chặng 2 mode: **Node ↔ 3D**
- Chặng 3 KHÔNG mode
- **Cấu kiện/BIM nội thất KHÔNG là mode, không thuộc chặng nào** — là TẦNG DỮ LIỆU nằm dưới cả ba

**Khoá kỹ thuật GIỮ NGUYÊN**: `sketch/pro/revit · concept/render/present` — đổi khoá = vỡ persist.

### M2 · CẤM CHỮ "CAD" khỏi mọi nhãn người dùng (07/08)
> *"có cad là sai thôi"* — Hoà

"CAD" là từ nghề dân kỹ thuật, không phải ngôn ngữ sản phẩm. Nhãn phải là **Thiết kế 2D**. Chỉ đổi NHÃN, KHÔNG đổi tên code (đổi = vỡ route/localStorage/DB).

### M3 · LỆNH DỰNG HÌNH GIỮ TIẾNG ANH (08/08)
Array·Bevel·Chamfer·Loft·Sweep·Revolve·Mirror·Fillet·Offset·Extrude·Boolean = thuật ngữ nghề quốc tế. Dân 3ds Max/SketchUp đọc là hiểu. IF là sản phẩm global — dịch VI bắt họ dịch ngược trong đầu. **CHỈ áp cho tên LỆNH DỰNG HÌNH** — tên chặng/điều hướng/trạng thái vẫn VI/EN.

---

## N · Ý CHƯA NÓI HẾT (đáng đọc riêng file gốc)

- **`SO-KIEM-TONG` §1-4** (03/08) — sổ chống rớt ~20 tính năng, phân mảng CHINH/PHU/G4/COWORK
- **`SPEC-STAGE-LIBRARIES` C2** — kệ *"nhiều form lập luận"* cho chặng render, mặt tiền trong Cửa sổ Thảo Luận (16/08 đóng câu treo này)
- **`SPEC-HOVER-FOCUS`** (02/08) — 9 loại phần tử × hover/press/selected có số ms + scale cụ thể
- **`SPEC-DESIGN-SYSTEM-IF §2c`** — Luật chống ngô nghê, hình học Apple, bo đồng tâm
- **`SPEC-MAT-DO-CON-TRO`** (03/08) — 5 token mật độ (`--tap/--row/--gap/--pad-card/--fs-ui`) đổi theo con trỏ, cùng bộ token cho cả desktop/tablet
- **`CHOT-VIDEO-2-TANG`** → **13/08 phán** — VIDEO về CHẶNG 2 master node, chặng 3 CHỈ trình chiếu (thay chốt 02/08)
- **`CHOT-ELEMENT-MATERIAL-INTELLIGENCE`** (10/08) — Ảnh→Element/MaterialSpec nháp, tái dùng single-view metrology
- **HOP-DONG-PHOI-HOP-T §9** — TỔNG QUAN ĐỒNG BỘ, 5 đẳng cấu build ↔ sản phẩm (Sổ Frontier ↔ Drawing Register · hợp đồng 8 ô ↔ TaskContext · V ↔ Review Gate...)

---

## Ý ĐẶC SẮC NHẤT — nếu chỉ giữ 10

1. **"Đồng bộ = không tách ngay từ đầu"** (E1)
2. **Local-first Design OS + 4 nguyên tắc Own your...** (A1/B)
3. **Chặng thôi quyết định giao diện** (C3)
4. **Files ↔ Thư viện = 2 trạng thái của 1 thứ** (D3)
5. **Máy soi đồng dạng — tái chế quy trình** (H2)
6. **Ký hiệu ISO làm icon nghề** (H7)
7. **Kiểm chuẩn = máy, góp ý = AI, cấm trộn** (F4)
8. **Cửa sổ công cụ = công dân canvas + định nghĩa = kết quả** (C2)
9. **AI proposes · Human directs · Visible · Reversible** (B)
10. **DATA > MODEL — Company Design Intelligence** (G9)

---

*Trích lập 18/08/2026 — vai KTS trưởng. Nguồn: 00-CHOT (50 chốt Hoà) + 4 hiến pháp (TRIẾT-LÝ · KIẾN-TRÚC · OS · BẢN-ĐỒ-KT).*
