# SOÁT LẠI CẢ PHIÊN 15/08 — Hoà tick từng mục rồi T làm một loạt

> Hoà yêu cầu: gom hết những gì bàn trong phiên + phần mới về hiển thị luật, gạch đầu dòng ngắn để
> soát từng mục, kèm bảng việc chưa làm. **Chưa mục nào được thi công tới khi Hoà tick.**
> Cách trả lời nhanh nhất: *"A3 sai — phải là …"*, còn lại coi như đúng.

---

## A · ĐÃ CHỐT TRONG PHIÊN (soát lại cho chắc)

**A1 · Master tool thuộc canvas.** Tool window là NODE trên canvas, không phải hộp thoại nổi. Mở
được nhiều cái cùng lúc, nối dây với nhau. Kết quả mỗi tool = một file đã có định nghĩa, và chính
nó là đầu vào của tool kế.

**A2 · Nấc nhỏ nhất của master tool = pill mang trạng thái** (44px, có tiến độ), không phải icon trần.

**A3 · Định danh bằng dải màu đặc 2px đáy thẻ**, hover thì đậm lên. Không dùng neon phát sáng —
kênh sáng đã dành cho "đang chạy".

**A4 · Chặng 2 = MỘT bộ lệnh, HAI lối thao tác** (node kiểu ComfyUI ↔ tool truyền thống). Không bỏ
mode nào. Cấm mỗi lối một tập lệnh riêng.

**A5 · Ranh giới id-phối-cảnh vs con số.** Gán id trên phối cảnh chỉ phục vụ TRÌNH BÀY (bảng vật
liệu, spec). Con số chỉ đến từ CAD/Revit hoặc khối dựng đo được. **BOQ chỉ nhận số đo được**, người
sửa tay sau.

**A6 · Bảng vật liệu sinh từ id**: mẫu xếp chồng đè nhau, bố cục đầy đủ, trỏ vào mẫu nào hiện thông
tin mẫu đó, và **bản nộp y chang bố cục trên màn**.

**A7 · Đơn vị đo + tỉ lệ chỉnh được ở cấp toàn app.** Ràng buộc cứng: **lưu trữ luôn là mm**, chỉ
đổi lớp hiển thị và lớp nhập.

**A8 · Kiến trúc lệnh 3 tầng**: một sổ lệnh duy nhất → ① thanh chung ≤9 lệnh giống hệt 3 chặng ②
nhóm lệnh 2 khuôn (Photoshop cho nhóm hay dùng · thư mục iOS cho nhóm tra thỉnh thoảng) ③ cửa sổ
nhỏ "chỉnh lệnh vừa chạy" kiểu Blender F9.

**A9 · Thiết kế = mã: AI sinh BuildRecipe, KHÔNG sinh mã tự do.** Đúng luật 8. Không chạy mã do AI
viết trên máy người dùng (IF chưa có sandbox nào).

**A10 · Vision backbone chạy cục bộ.** onnxruntime-node + MobileSAM + CLIP (~197MB). **Nhưng v0 phải
là PHÉP THỬ** — đo xem model phân biệt nổi gỗ sồi với gỗ óc chó không, trước khi nhúng 153MB.

**A11 · "AI học kiến thức IF" = RAG, không phải training.** Fine-tune bất khả vì thiếu dữ liệu nhãn
(kho đang **0 dòng**), không phải vì máy yếu.

**A12 · Bậc-theo-cấu-hình-máy ≠ ThinkDial.** Hai trục vuông góc: ThinkDial = muốn nghĩ sâu tới đâu ·
bậc máy = máy gánh nổi model nào.

**A13 · IF tự mang runtime AI** (node-llama-cpp, MIT, Metal, chạy trong Electron), không bắt người
dùng cài Ollama. Lộ 3 lựa chọn: **Trong IF · Máy tôi đã có · Ngoài**.

**A14 · Kiểm chuẩn là việc của MÁY, AI chỉ góp ý.** ✅ Hoà đã duyệt.

**A15 · Không xây agent tự chạy.** Xây máy soạn đồ thị + cửa duyệt: máy trình chuỗi việc kèm giá,
người bấm duyệt, engine chạy đúng cái đã duyệt.

**A16 · Đừng đua sinh-deck-đẹp với đối thủ mã nguồn mở** (87k sao). Hào của IF là con số truy được
về một nguồn.

---

## B · PHẦN MỚI HÔM NAY — hiển thị luật, 3 loại, quyền hạn, Vitals canh lỗi thời

**B1 · Hai chế độ hiển thị.**
· **Ngắn** — lúc làm nhanh, nhiều việc, gấp: chỉ mức (đỏ/vàng) + tên điều khoản + một câu.
· **Đầy đủ** — lúc cần kiểm chứng: thêm **nguyên văn điều khoản** + cách sửa + ngày hiệu lực + cờ
  "số liệu chưa đối chiếu bản gốc".
· Nhớ lựa chọn, đổi được bất cứ lúc nào.

**B2 · Ba loại, phân theo NGUỒN.**
| Loại | Ai ban hành | Cách hiển thị |
|---|---|---|
| **Luật** | nhà nước · chính phủ | **trích nguyên văn** + số hiệu + ngày hiệu lực. Cấm AI diễn giải hay tóm tắt |
| **Tiêu chuẩn** | ngành, có số liệu + nghiên cứu | trích số + nguồn nghiên cứu; cho chọn bộ nào áp dụng khi nhiều chuẩn mâu thuẫn |
| **Xu hướng** | thay đổi theo xã hội | Vitals nêu nội dung **kèm tư vấn cho trường hợp hiện tại**; bắt buộc có nguồn công khai + ngày; **không bao giờ chặn** |

**B3 · T bổ sung: phải là HAI TRỤC, không phải một.**
· Trục NGUỒN: luật · tiêu chuẩn · xu hướng *(mới, chưa có trong code)*
· Trục RÀNG BUỘC: bắt buộc · điều chỉnh được · khuyến nghị *(**đã có** — `RuleBinding`)*
Hai trục không trùng nhau: một tiêu chuẩn ngành có thể thành bắt buộc khi hợp đồng viện dẫn; một
luật vẫn có điều khoản chỉ mang tính khuyến nghị.

**B4 · Quyền hạn 3 tầng** — không đẻ cơ chế mới, dùng nhãn nguồn `DataOrigin` đã chốt:
· **app-core** — bộ luật gốc, chỉ nhà phát hành sửa
· **studio** — chuẩn riêng công ty, admin studio sửa
· **project / cá nhân** — người dùng tự thêm cho dự án của mình
Người dùng **được đè** rule gốc bằng rule cùng id (cơ chế này `registry.ts` đã có sẵn), nhưng bản đè
phải mang nhãn nguồn để nhìn là biết ai đặt.

**B5 · Vitals canh lỗi thời.** Nhiệm vụ: dò xem luật/chuẩn có bản mới không, tra nhiều nguồn, đối
chiếu. Với chuẩn theo xu hướng thì viết thành bộ chuẩn chung để người dùng xem và định hình bộ
riêng.

**B6 · ⚠️ T CẢNH BÁO — đây là chỗ rủi ro pháp lý cao nhất trong toàn bộ phiên.**
Nếu Vitals nói *"TCVN X đã đổi thành Y"* mà sai, và KTS xuất hồ sơ theo đó, hậu quả là thật.
⇒ Đề xuất ba rào:
· AI **chỉ được BÁO** "có vẻ có bản mới, đây là link", **không được tự sửa bộ luật**.
· Cập nhật bộ luật **luôn phải qua người duyệt** (khuôn phiếu duyệt đã có).
· Với loại **Luật**: AI chỉ được **TÌM và TRÍCH NGUYÊN VĂN**, cấm diễn giải, cấm tóm tắt.

**B7 · Tin tốt: code đã đỡ sẵn kha khá.**
· `effectiveFrom` / `supersededBy` — chiều thời gian, **đã có**
· `verified: boolean` + `note` — cờ "chưa đối chiếu bản gốc", **đã có**
· `nguonCongKhai` bắt buộc cho góp ý xu hướng — **đã có**, khớp đúng ý B2
· `region` — chuẩn theo vùng/quốc gia, **đã có**
· Đè rule cùng id — **đã có**
· **Còn thiếu**: trường giữ **nguyên văn** điều khoản (nay `nguon` chỉ giữ mã số như "QCVN
  06:2022 §3.2"), trục **loại nguồn**, và nhãn **quyền hạn**.

---

## C · BẢNG VIỆC — chưa làm mục nào

| # | Việc | Nhóm | Phụ thuộc | Cỡ |
|---|---|---|---|---|
| 1 | Nhúng chữ cục bộ (BGE-M3) — RAG hết phụ thuộc mạng | AI nền | — | 1 phiên |
| 2 | Tầng "mượn CLI người dùng đã cài" | AI nền | — | 1 phiên |
| 3 | IF tự mang runtime (node-llama-cpp) + 3 lựa chọn | AI nền | #2 | 2 phiên |
| 4 | Bậc model theo cấu hình máy | AI nền | #3 | 1 phiên |
| 5 | **Phép thử** CLIP phân biệt vật liệu thật | Thị giác | — | 1 buổi |
| 6 | Vision backbone cục bộ (nếu #5 đạt) | Thị giác | #5 | 2–3 phiên |
| 7 | Hai chế độ hiển thị luật (ngắn / đầy đủ) | Luật | — | 1 phiên |
| 8 | Trục loại nguồn + trường nguyên văn điều khoản | Luật | — | 1 phiên |
| 9 | Nhãn quyền hạn 3 tầng cho rule | Luật | #8 | 1 phiên |
| 10 | Cắm kiểm chuẩn vào mọi cửa chuyển công đoạn | Luật | #7 | 1–2 phiên |
| 11 | Vitals canh lỗi thời + 3 rào an toàn | Luật | #8, #9 | 2 phiên |
| 12 | B2 — 3 thanh công cụ đọc chung sổ lệnh | Lệnh | B1 xong | 2 phiên |
| 13 | Nhóm lệnh 2 khuôn (Photoshop / thư mục iOS) | Lệnh | #12 | 1–2 phiên |
| 14 | Cửa sổ "chỉnh lệnh vừa chạy" (Blender F9) | Lệnh | #12 | 2 phiên |
| 15 | Master tool thành node trên canvas | Tool | — | 2–3 phiên |
| 16 | Máy soạn đồ thị + cửa duyệt | Agentic | #1 | 3 phiên |
| 17 | AI sinh BuildRecipe (thiết kế = mã) | Agentic | #3, #16 | 2–3 phiên |
| 18 | Đơn vị đo + tỉ lệ cấp app | Nền | — | 1 phiên |
| 19 | Bảng vật liệu sinh từ id phối cảnh | Trình bày | — | 2 phiên |
| 20 | Xưởng hoa văn parametric | Sáng tạo | #17 | 3 phiên |

**Chưa xếp thứ tự thi công** — chờ Hoà tick xong mục nào đúng, rồi T phân loại và chạy một loạt.

---

## D · QUY TRÌNH LÀM VIỆC — bản sửa sau khi Hoà bắt lỗi + 2 mũi nghiên cứu

> **D2 bản cũ SAI, đã bỏ.** Nó viết *"Hoà nói bằng lời là đã chốt, T ghi thẳng rồi đi tiếp, không
> hỏi lại"*. T viết câu đó sau khi bị trách hỏi lại thừa — và **sửa quá tay**, từ "hỏi thừa" nhảy
> sang "không kiểm gì cả". Hai lỗi khác hẳn nhau: *hỏi thừa* bắt Hoà quyết hai lần; *không kiểm*
> để T hiểu sai rồi ghi vào sổ như thể Hoà đã chốt, cả chuỗi sau chạy trên cái sai đó — **và không
> ai bắt được vì bằng chứng duy nhất là code, thứ Hoà không đọc.** Trong chính phiên 15/08 việc này
> xảy ra 2 lần (`stages:'concept'` sai · ghi sai bản chất phân kỳ phím 2D/3D).

### 🔬 Điều nghiên cứu chỉ ra — trái với phản xạ thông thường
**Không thêm nghi thức.** RG1 quét GitHub: 6 dự án sản xuất lớn (openai/codex · sentry · airflow ·
temporal · cloudflare/workers-sdk · coder) **đều chỉ dùng MỘT file `AGENTS.md` ngắn**, không dùng
pipeline nặng. Các khung nhiều nghi thức (spec-kit ~120K sao) có phản biện rõ là overhead vượt lợi
ích với dự án một người.
⚠️ **Đo IF ngày 15/08: 537 file `.md` · 32MB · luật nền trải 4 file ~1.335 dòng.**
⇒ **Vấn đề của IF KHÔNG phải thiếu quy trình — nhiều khả năng là THỪA.** Cách chữa đúng là **thêm
đúng 2 thứ, bỏ 1 thứ sai**, không phải dựng thêm tầng.

### Thêm đúng hai thứ

**D-MỚI-1 · NHẮC LẠI TRƯỚC KHI LÀM.** Trước khi soạn phiếu, T nhắc lại ý Hoà **bằng ngôn ngữ nhìn
thấy được**, không bằng ngôn ngữ kỹ thuật. Hoà chỉ cần trả lời *"ok"* hoặc *"sai chỗ X"*.
Chọn khuôn theo **độ khó lùi**:

| Khuôn | Dùng khi | Tốn của Hoà |
|---|---|---|
| **So sánh + phản ví dụ** — "giống A, **KHÔNG phải** B đang có ở màn C" | mặc định, việc hằng ngày | 30–60 giây |
| **Phác thảo hình**, dán nhãn *"PHÁC THẢO — chưa code"* | **bắt buộc** khi chạm giao diện | 15–40 giây |
| **Given-When-Then có số thật** | chỉ khi khó lùi / rủi ro cao (đụng dữ liệu, tiền, giấy phép) | 2–3 phút |

Vì sao khuôn phản-ví-dụ rẻ mà hiệu quả: nó nói luôn thứ **KHÔNG phải**, và neo vào cái Hoà **đã
thấy trong app** — nên sai là lộ ngay.
Nền bằng chứng: kỹ thuật *nhắc-lại-lệnh* của hàng không (bắt được 34% lỗi lọt) và *teach-back* y
khoa. ⚠️ RG2 khai thật: **không tra ra số liệu định lượng cho ngành phần mềm** — đây là bắc cầu từ
ngành khác, không phải đo trực tiếp.

**D-MỚI-2 · DẤU VẾT AI TRONG COMMIT.** Mọi commit mang trailer
`Assisted-by: T (autonomous)` hoặc `(supervised)`.
Giải đúng câu Hoà nêu — *"không đọc code nhưng cần lật lại xem T tự quyết ở đâu"*: sau này gõ một
lệnh git là ra hết những chỗ T tự quyết không hỏi. **0 dòng code, chỉ là kỷ luật viết commit.**

### RANH GIỚI QUYỀN CỦA T — chưa từng viết rõ, đây là phần quan trọng nhất

| T ĐƯỢC tự quyết | T PHẢI nhắc lại và chờ gật | T KHÔNG BAO GIỜ tự quyết |
|---|---|---|
| cách làm · thư viện · cấu trúc code · thứ tự kỹ thuật · sửa lỗi · đặt tên biến/hàm | bất cứ gì đụng **Ý ĐỊNH**: cái gì hiện ra · xếp thế nào · gọi tên là gì · luồng đi ra sao · nhìn ra sao | bỏ/hoãn một tính năng · đổi định nghĩa đã chốt · đụng tiền, giấy phép, dữ liệu khách · viết lại lịch sử git |

Vai không ai thay được của Hoà: **người chấm ý đồ gốc**. AI đóng thay hai vai còn lại (phân tích
nghiệp vụ + phản biện chất lượng) — theo khuôn "Three Amigos with AI" RG2 tìm được.

### Giữ nguyên (đang chạy tốt, không đụng)
**D3** hỏi gộp bằng trắc nghiệm, luôn có ô "ý khác" · **D4** mỗi đợt ≥1 việc nhìn-thấy + ≥1 việc cốt
lõi · **D5** T tự kiểm lại mọi báo cáo agent, chạy lệnh thật · **D6** chốt là vào sổ máy ngay ·
**D7** kết phiên 0 lệch · **D8** nợ nghiệm thu mắt là nút thắt thật (66 đối 1).

### Việc dọn kèm theo
537 file `.md` là quá nhiều để tra. Entry `tran-kich-thuoc-kho` đã mở — nay có thêm căn cứ từ RG1
để làm: gom luật nền về **một file ngắn** làm cửa vào, phần còn lại thành tra-cứu-khi-cần.
