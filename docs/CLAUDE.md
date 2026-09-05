> 🔴 **ĐÂY KHÔNG CÒN LÀ CỬA VÀO** (đóng dấu 23/08).
> Cửa vào duy nhất: **`CLAUDE.md` → BỘ NẠP → `docs/control/`**.
> · hiện trạng → `docs/control/IF-CURRENT-STATE.md`
> · luật bền → `docs/control/IF-CANONICAL.md`
> · sai lầm đã trả giá → `docs/control/IF-UXUI-OPERATING-MEMORY.md`
> · năng lực thật → `docs/control/IF-TOOLING-RECEIPT.md`
>
> **Vì sao có dấu này:** hai bài kiểm khởi động nguội 23/08 đều **KHÔNG** mở tệp nào trong
> `docs/control/`. Cả hai đi vào đây trước, vì mỗi tệp dưới đây từng tự xưng là điểm bắt đầu.
> Phiên nguội tự tổng kết đúng bệnh: *"hai đường đọc chồng nhau, không nói rõ cái nào thắng."*
> Nhiều cửa vào cùng mở = không có cửa vào nào. Nội dung dưới GIỮ NGUYÊN làm dấu vết.

> ⚠️ Sửa lần cuối **19/08**. Luật vận hành trong đây phần lớn vẫn đúng, nhưng **thứ tự đọc thì sai** —
> theo nó sẽ đi vào nhật ký thay vì vào não bền.

# CLAUDE.md — Quy tắc làm việc dự án InteriorFlow (IF)

> File này để ở gốc repo. Đọc trước MỌI phiên làm việc.

## Bối cảnh
- Hoà là kiến trúc sư nội thất, Creative Director, KHÔNG biết code. Tự xây IF một mình,
  cho TTT Architects dùng đầu tiên (miễn phí), dự định bán global.
- IF = app thiết kế nội thất: Ý tưởng → CAD → Render → Present → Movie, dùng chung 1 nguồn `.idf`.
- App song song: ArchiNote (hiện trường, mobile) — không gọi nhau, chỉ cùng đọc/ghi Lark Base (ATLAS).
> ⚠️ CHỐT 19/08 ĐÈ CÂU TRÊN: Lark/ATLAS = OPTIONAL EXTERNAL ADAPTER, không còn là hạ tầng lõi.
> IF phải chạy đầy đủ không cần Lark. ArchiNote dùng shared contract của IF, Lark không bắt buộc ở giữa.

## Nguồn sự thật — ĐỌC TRƯỚC KHI LÀM BẤT KỲ VIỆC GÌ
0. `docs/memory/LATEST.md` — bản NÉN trí nhớ phiên gần nhất (đọc trước tiên, rẻ nhất) — cần chi
   tiết đầy đủ 1 nhánh việc thì mở đúng thư mục `docs/memory/sessions/<ngày>/<nhánh>/`
1a. ⭐⭐ **`docs/IF-KIEN-TRUC-OS.md` — HIẾN PHÁP GỐC + NORTH STAR SẢN PHẨM. Trên mọi chốt khác.**
   IF = Local-first Design Operating System, AI chỉ là engine bên trong. 4 nguyên tắc:
   *Own your data · Own your workflow · Own your memory · Replace your AI* (Hoà chốt 18/08).
   ⭐ **Bổ sung 04/09 — NORTH STAR SẢN PHẨM/TRẢI NGHIỆM `N-1…N-20`** (§ ngay đầu tệp): IF là
   **hệ điều hành sáng tạo cho thiết kế nội thất**, lời hứa *"từ ý tưởng tới sự thật thiết kế —
   không đánh rơi ngữ cảnh"*. Đọc ít nhất **N-8** (Home), **N-10** (13 cờ đỏ), **N-16/N-17**
   (máy không phán được gu · bố cục trước đánh bóng sau) và **N-20** (cổng hai câu: *chạy được?*
   **và** *có đẩy về north star không?*) TRƯỚC KHI chạm bất kỳ bề mặt lớn nào.
0b. 🎨🎨 **PHIÊN LÀM GIAO DIỆN: ĐỌC `docs/ACTIVE-DESIGN-CONTEXT.md` TRƯỚC, VÀ CHỈ NÓ.**
   Lệnh CONTEXT DETOX của Hoà 04/09. `docs/` có **761 tệp `.md` · 78 MB** và **148 bản vẽ**, phần
   lớn là *lịch sử* chứ không phải *thẩm quyền* — crawl kho đó để tìm hướng thị giác chính là cơ
   chế đã làm nhiễm mấy đợt Home vừa rồi. ⛔ Bốn câu cấm đọc ngược: **giao diện đang chạy ≠ thẩm
   quyền · component đang có ≠ khuôn mẫu · code đang có ≠ lý do giữ bố cục · đã qua mắt trong quá
   khứ ≠ đang được duyệt** (nếu thẩm quyền mới đã đè). **NO-REBUILD (B25) bảo vệ NĂNG LỰC · HỢP
   ĐỒNG · DỮ LIỆU — KHÔNG bảo vệ bố cục thị giác lỗi thời.** Tài liệu/bản vẽ cũ chỉ mở khi việc đòi
   **truy nguyên · cứu vốn · giữ hành vi · điều tra xung đột**; nhãn ở
   `docs/delivery/LEGACY-DESIGN-QUARANTINE.md`.

1. ⭐ **`docs/INTERIORFLOW-ARCHITECTURE-MAP.md` — BẢN ĐỒ KIẾN TRÚC CHÍNH TẮC (19/08). ĐỌC THẬT, KHÔNG LƯỚT.**
   (Tên cũ `IF-KIEN-TRUC.md` đã đóng dấu chuyển hướng 19/08, giữ làm dấu vết.)
1b. ⭐ **`docs/IF-ARCHITECTURE-BLUEPRINT.md` — CANONICAL BLUEPRINT v1.0 (19/08, gate MISSING=0).**
   Từ điển canonical 26 term (B3) · domain authority (B8) · bảng KHÔNG-PHẢI-LÀ 30 cặp (B20) ·
   YAML machine-readable (B21) · coverage appendix 47 nhóm + 6 SUPERSEDED cấm hồi sinh (B22).
   Vai: kiến trúc hiện hành GHÉP thành hệ thống thế nào — MAP là living direction, ADR thắng cả hai.
   ⚠️ ĐỪNG NHẦM với `IF-ARCHITECTURE-BLUEPRINT-v1.md` bên dưới (file CŨ KHÁC HẲN — 8 luật vận hành).
   Kiến trúc tổng · hệ sinh thái `.idf` (là gì · ai đọc ai ghi · vòng đời · 4 ràng buộc) · lệnh giao diện.
   🔴 **Tên cũ `IF-MASTER-BLUEPRINT.md` chỉ còn là mẩu chuyển hướng 774 byte** (đổi tên 28/07).
   Dòng này TRƯỚC ĐÂY trỏ vào mẩu cụt đó ⇒ **suốt 19 ngày mọi phiên đọc mẩu cụt rồi đi tiếp,
   tưởng đã đọc kiến trúc**; `COMPASS` được nhắc **0 lần** trong `CLAUDE.md`/`STATUS.md`/`00-CHOT`/`LATEST`.
   ⚠️ Đây là loại tài liệu **KHÁC** nhật ký: `00-CHOT` trả lời *"cái gì được quyết, khi nào"*,
   `COMPASS` trả lời *"thứ này LÀ GÌ và nằm ở đâu trong cây"*. **Nén nhật ký không bao giờ ra bản đồ.**
   Mọi lỗi hiểu-sai-khái niệm ngày 16/08 (`master tool`↔`ToolWindow` · vật liệu chẻ ba ·
   Thư viện đứng đâu) đều là **thiếu quan hệ, không thiếu dữ kiện** — tức thiếu đúng file này.
2. `docs/IF-FEATURE-TREE.md` — cây 461 mục, có cột trạng thái CODE THẬT
   ⚠️ Tên cũ `IF-MASTER-TREE.md` **đã đổi từ 28/07**; file cũ nay chỉ còn 862 byte chuyển hướng.
   Ai đọc trúng nó sẽ tưởng đã kiểm cây (thật ra chưa) — T sửa tham chiếu 15/08.
3. `docs/IF-ARCHITECTURE-BLUEPRINT-v1.md` — 8 luật vận hành (hiến pháp)
4. `STATUS.md` — trạng thái hiện tại
5. `docs/IDEAS-BACKLOG.md` — ý mới chưa vào cây

## LUẬT ĐÓNG BĂNG (quan trọng nhất)
1. **Tính năng không có mã trong `IF-FEATURE-TREE` (tên cũ: IF-MASTER-TREE) → KHÔNG code.**
2. Ý mới phát sinh giữa chừng → ghi vào `docs/IDEAS-BACKLOG.md`, KHÔNG code ngay.
3. **KHÁM TRƯỚC KHI SPEC.** Không viết spec/tài liệu mô tả "code có gì" mà chưa đọc code thật.
   Nếu cần mô tả kiến trúc mới → đọc code liên quan trước, ghi rõ cái nào đã có/chưa có.
4. Cột "Code" trong cây là sự thật duy nhất — tài liệu nói xong mà code chưa có vẫn là ⬜.

## 8 luật vận hành (không được vi phạm)
1. Không làm bậc L khi bậc N (nền) chưa xong
2. Không có tài liệu spec thì không code
3. Mỗi sprint chỉ lên một bậc, không nhảy cóc
4. Tính năng thừa/lạc hướng → cắt, ghi vào STATUS, không xoá âm thầm
5. Output không có id → không ship (mọi thứ đều phải có img_/deck_/... id)
6. Con người quyết cuối: một lúc một việc · đề xuất NHIỀU phương án không phải một ·
   sửa tay của người dùng không bao giờ bị AI ghi đè · luôn nói rõ máy vừa làm gì
7. Không có nút thì không có AI — mọi việc AI làm phải là HÀM CÓ TÊN mà UI cũng gọi được.
   Thứ tự bắt buộc: năng lực → nút → AI gọi hàm
8. AI không ghi trực tiếp vào hình học/toạ độ — AI ra Ý ĐỊNH có cấu trúc, CODE tính toán,
   CODE kiểm tra (chồng lấn, lối đi, ranh giới), sai thì tự sửa tối đa 3 vòng, vẫn sai thì
   báo lỗi chứ không ship bản sai

## Quy tắc gộp tính năng — "một cỗ máy, nhiều mặt tiền"
Trước khi thêm tính năng mới, LUÔN hỏi: có cỗ máy/engine nào đã làm việc tương tự chưa?
Nếu có → tính năng mới là MẶT TIỀN mới gọi vào cỗ máy cũ (thêm bộ tham số), KHÔNG viết engine mới.
Ví dụ đã áp dụng: mọi thao tác "biến ảnh A thành ảnh B" ở chặng Render (6 thẻ việc, đổi góc,
tách vẽ diện đồ nội thất...) đều là mặt tiền của MỘT engine transform(ảnh, ý_định, mức_giữ_nguyên).

## Thói quen làm việc của Hoà — LUÔN tuân theo
- **Chạy một mạch, không dừng hỏi giữa chừng.** Gặp mơ hồ → chọn phương án đơn giản nhất,
  ghi lại quyết định vào báo cáo cuối, KHÔNG dừng lại hỏi.
- **Tiết kiệm token**: không đọc lại file docs nếu đã nêu đủ nội dung trong lệnh. Không chụp
  ảnh minh hoạ trung gian trừ khi được yêu cầu. Không báo cáo giữa chừng — chỉ báo cáo 1 lần cuối.
- **Mỗi việc lớn = 1 commit.** Xong việc nào chạy tsc + test rồi mới sang việc kế.
- **Tự verify độc lập, không tin báo cáo của agent con một cách mù quáng** — spot-check bằng
  cách đọc code/chạy lệnh thật trước khi báo "xong".
- **Verify bằng browser thật khi liên quan UI** — không chỉ tin tsc/test pass.
- Khi phát hiện tài liệu SAI so với code thật (vd. tự khai 89% nhưng thật 80%) → BÁO NGAY,
  không im lặng sửa cho khớp. Hoà muốn biết sự thật, không muốn tài liệu đẹp.
- Sau mỗi batch việc lớn: cập nhật `CHANGELOG.md` (append-only, không xoá lịch sử cũ) và
  `STATUS.md` (dưới 800 từ, phản ánh đúng thực tế — không giữ thông tin cũ đã lỗi thời).
- **Hệ trí nhớ 2 lớp (Hoà chốt 15/08)**: mỗi nhánh việc trong phiên → viết chi tiết ĐẦY ĐỦ không
  cắt vào `docs/memory/sessions/<YYYY-MM-DD>/<NN-nhánh-việc>/README.md` (số thứ tự theo trình tự
  làm trong ngày). Cuối phiên lớn → ghi đè `docs/memory/LATEST.md` (bản NÉN, 1 file duy nhất,
  dòng đầu là ngày mới nhất) — KHÔNG thay thế STATUS.md/00-CHOT.md/CHANGELOG.md, là lớp tổng hợp
  nhanh thêm vào. Không di dời `docs/bao-cao-phien/` cũ — quy ước mới chỉ áp dụng từ 15/08 trở đi.
- **HỎI GỘP BẰNG TRẮC NGHIỆM (Hoà chốt 15/08)** — KHÔNG rải câu hỏi ở cuối từng lượt. Dồn lại,
  đợi một lượt rồi hỏi GỘP: tối đa 4 câu, mỗi câu 2-4 phương án bấm được, khuyến nghị đặt đầu,
  **luôn có ô "ý khác" cuối**. Lý do Hoà nêu: *"câu hỏi bạn hỏi mình chưa trả lời, sang lượt tiếp
  theo nữa là trôi thông tin"* — hỏi văn xuôi cuối lượt bị lượt sau đè lên, coi như chưa hỏi, rồi
  máy tự suy diễn đi tiếp trên giả định chưa duyệt. Trong lúc làm cứ ghi câu hỏi vào báo cáo/sổ,
  đừng hỏi ngay.
- **KHÔNG tự push lên `origin/main`** trừ khi được yêu cầu rõ ràng trong phiên đó.

  🔴 **ĐÍNH CHÍNH 05/09 — DÒNG TRÊN ĐANG BỊ ĐỌC NGƯỢC, VÀ NÓ LÀ GỐC CỦA MỘT BỆNH LẶP.**
  Câu đó viết ra để chặn **ĐẨY THẲNG KHÔNG QUA DUYỆT**. Nó **KHÔNG** nói cấm *gộp một nhánh đã
  qua cổng vào main* — mà gộp mới chính là cách thân cây đi tới. Bị đọc thành "không được đụng
  main" thì thân cây đóng băng, và mỗi phiên phải tự dựng nhánh "thật" của riêng mình.

  **Đo tại nguồn 05/09, có ngày tháng rõ ràng:**
  · `main` tiến bằng GỘP **197 lần** cho tới **16/08** — rồi **dừng hẳn**.
  · Sau 16/08: **118 commit vào main, 0 commit gộp**. Sau 03/09: `main` đứng yên.
  · Nay **3 nhánh cùng tự nhận là thật** (`nen-checkpoint` · `integration/2026-09-04` ·
    `checkpoint/2026-08-24-control-plane`), nhánh làm việc đi trước main **565 commit**.
  · **14 PR mở · 13 nháp · cũ nhất 31/08 · 0 cái đã gộp.**
  · **12/12** nhánh `claude/slice-*` **nằm TRỌN** trong nhánh làm việc ⇒ **không mất việc nào**;
    thứ mất là **TÍN HIỆU** — 14 dòng mà 12 dòng đã được chứa thì 2 dòng đáng đọc bị chôn.

  ⚠️ **VẾ THIẾU, mới là gốc thật:** có luật bắt **LUÔN MỞ PR** cho nhánh vừa đẩy, nhưng **không
  luật nào nói ai ĐÓNG PR**. Cửa vào bắt buộc, cửa ra không có. Mọi hệ như thế đều phình — 14 PR
  treo là **đầu ra tất định của bộ luật**, không phải ai đó lười. Sửa bằng cách nhắc nhau là vô
  ích; phải có **cửa ra thành văn + máy canh**.

- 🌳 **LUẬT VÒNG ĐỜI NHÁNH & PR (mở 05/09) — cửa ra còn thiếu:**
  1. **`main` là thân cây duy nhất.** Nhánh dài ngày chỉ được tồn tại khi có lý do ghi ra được
     (nhánh dựng bộ cài, nhánh sao lưu). Mọi nhánh việc phải kết thúc bằng **gộp vào main** hoặc
     **đóng kèm lý do** — không có trạng thái thứ ba.
  2. **PR mở ra thì phải có đường đóng.** Nội dung đã nằm trọn trong nhánh khác ⇒ đóng PR + xoá
     nhánh, ghi rõ *"đã được chứa trong X"*. Đó là **dọn tín hiệu, không phải bỏ việc**.
  3. **Gộp vào main KHÔNG phải là "tự push lên main".** Gộp một nhánh **đã qua cổng máy** là
     việc bình thường và cần thiết; thứ bị cấm là đẩy thẳng thứ chưa ai kiểm.
  4. **Máy canh:** `npm run soi:than-cay` — đo 4 dấu hiệu (thân cây tụt · nhánh ma · nhánh bỏ
     hoang · **thân cây chẻ**), có bánh cóc trong `scripts/foundation-tran.json`, chỉ được kéo
     xuống. Máy **không gộp, không xoá, không đóng PR** — nó chỉ đo và nói.
- File gói `.md`/`.txt` dán tạm ở gốc repo (kiểu IF-DOCS-BATCH-*.md, PROMPT-*.txt) → xử lý xong
  thì XOÁ, không giữ lại làm rác.
- Nếu file `docs/files.zip` hoặc file lạ không phải do Cowork tạo xuất hiện → để nguyên, không đụng.

## Ngôn ngữ & phong cách
- Giao tiếp bằng tiếng Việt trong báo cáo/commit message. Code/biến/hàm tiếng Anh như chuẩn.
- Commit message ngắn, rõ, tiếng Việt: `"fix(login): ..."`, `"feat(cad): ..."`, `"docs: ..."`.

### LUẬT CỨNG BÁO CÁO (Hoà chốt 15/08) — KẾT QUẢ làm trọng tâm, không tường thuật diễn biến
Mọi báo cáo của Claude Code / agent con — dù dài hay ngắn — PHẢI đi theo đúng khuôn 6 phần dưới,
không được kể lại quá trình làm (bước 1 tôi làm gì, bước 2 tôi làm gì...) trừ khi phần đó CHÍNH
LÀ bằng chứng cần thiết cho kết luận. Chữ nhiều mà nội dung lan man = vi phạm luật này.

1. **Tổng quan** — 1-3 câu: việc gì, kết quả gì, ngay đầu report.
2. **Chi tiết từng mục** — bảng/gạch đầu dòng, mỗi mục ngắn gọn, có bằng chứng cụ thể (số đo/
   file:dòng/commit hash) — không phải câu chuyện.
3. **Tổng kết lại vấn đề** — gom các mục rời rạc thành 1 bức tranh chung, trả lời "vậy rốt cuộc
   là gì".
4. **Đánh giá khách quan** — cái gì tốt, cái gì chưa, có rủi ro gì, đừng chỉ khoe kết quả tốt.
5. **Hướng xử lý nhiều góc độ** — nêu ít nhất 2 hướng khả dĩ khác nhau (không phải 1 con đường
   duy nhất) kèm ưu/nhược mỗi hướng.
6. **Đề xuất hướng tốt nhất** — chọn 1, nói rõ vì sao chọn hướng đó thay vì các hướng còn lại.

Áp dụng cho MỌI báo cáo — kể cả báo cáo của agent con gửi về T, và báo cáo T trình Hoà.

## An toàn dữ liệu
- KHÔNG commit `.env`, secret, API key thật. `.env.example` là file mẫu, được phép commit.
- Trước khi push, kiểm `git log --all -- '.env*' 'uploads/*'` nếu nghi ngờ có secret lọt vào
  lịch sử — báo ngay nếu có, không tự ý xoá lịch sử git.
- Local-first: KHÔNG phụ thuộc dịch vụ cloud bên thứ ba cho dữ liệu dự án (đã quyết định
  local-first + Electron, xem IF-CORE-SCHEMA.md).
- CẤM chạy `prisma generate` trong sandbox/agent khi schema lệch DB thật — Prisma Client nằm
  shared node_modules, generate với schema mới trên DB cũ làm chết runtime mọi phiên khác
  (sự cố 19/08).
