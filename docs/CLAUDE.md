# CLAUDE.md — Quy tắc làm việc dự án InteriorFlow (IF)

> File này để ở gốc repo. Đọc trước MỌI phiên làm việc.

## Bối cảnh
- Hoà là kiến trúc sư nội thất, Creative Director, KHÔNG biết code. Tự xây IF một mình,
  cho TTT Architects dùng đầu tiên (miễn phí), dự định bán global.
- IF = app thiết kế nội thất: Ý tưởng → CAD → Render → Present → Movie, dùng chung 1 nguồn `.idf`.
- App song song: ArchiNote (hiện trường, mobile) — không gọi nhau, chỉ cùng đọc/ghi Lark Base (ATLAS).

## Nguồn sự thật — ĐỌC TRƯỚC KHI LÀM BẤT KỲ VIỆC GÌ
1. `docs/IF-MASTER-BLUEPRINT.md` — kiến trúc tổng, hệ `.idf`, cây mã số, lệnh giao diện
2. `docs/IF-MASTER-TREE.md` — cây 461 mục, có cột trạng thái CODE THẬT
3. `docs/IF-ARCHITECTURE-BLUEPRINT-v1.md` — 8 luật vận hành (hiến pháp)
4. `STATUS.md` — trạng thái hiện tại
5. `docs/IDEAS-BACKLOG.md` — ý mới chưa vào cây

## LUẬT ĐÓNG BĂNG (quan trọng nhất)
1. **Tính năng không có mã trong IF-MASTER-TREE → KHÔNG code.**
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
- **KHÔNG tự push lên `origin/main`** trừ khi được yêu cầu rõ ràng trong phiên đó.
- File gói `.md`/`.txt` dán tạm ở gốc repo (kiểu IF-DOCS-BATCH-*.md, PROMPT-*.txt) → xử lý xong
  thì XOÁ, không giữ lại làm rác.
- Nếu file `docs/files.zip` hoặc file lạ không phải do Cowork tạo xuất hiện → để nguyên, không đụng.

## Ngôn ngữ & phong cách
- Giao tiếp bằng tiếng Việt trong báo cáo/commit message. Code/biến/hàm tiếng Anh như chuẩn.
- Commit message ngắn, rõ, tiếng Việt: `"fix(login): ..."`, `"feat(cad): ..."`, `"docs: ..."`.
- Báo cáo cuối luôn gồm: bảng tóm tắt việc đã làm (commit hash) · việc nào lệch nghiệm thu và
  vì sao · quyết định tự chọn khi gặp mơ hồ · đề xuất 3 việc tiếp theo.

## An toàn dữ liệu
- KHÔNG commit `.env`, secret, API key thật. `.env.example` là file mẫu, được phép commit.
- Trước khi push, kiểm `git log --all -- '.env*' 'uploads/*'` nếu nghi ngờ có secret lọt vào
  lịch sử — báo ngay nếu có, không tự ý xoá lịch sử git.
- Local-first: KHÔNG phụ thuộc dịch vụ cloud bên thứ ba cho dữ liệu dự án (đã quyết định
  local-first + Electron, xem IF-CORE-SCHEMA.md).
