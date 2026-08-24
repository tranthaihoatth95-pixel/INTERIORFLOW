# 07 · SOI TRANG CHỦ — bản chạy thử skill `if-design-review`

Ngày 23/08. Người soi: Trường Review (độc lập, **0 dòng production**, **không tham gia vẽ Home**).
Khuôn: `.claude/skills/if-design-review/contracts/visual-review-template.md`.

---

## ⓪ ĐỀ BÀI ĐÃ VIẾT LẠI

Người gọi nhờ: *"chạy thử skill lên màn Trang chủ hiện tại và xuất một bản soi mẫu"*.
Skill viết lại thành: **"Tìm vi phạm trên màn Trang chủ và giải thích."**

## ① BỀ MẶT ĐANG SOI

| | |
|---|---|
| Màn / route | Trang chủ `/` — sau đăng nhập, có rail |
| Theme | sáng |
| Bề rộng đo | **1440** và **1100** (đủ hai bề rộng ⇒ chấm được trục co giãn) |
| Đăng nhập | có (tài khoản hiện tên *"Tour"*) |
| Dữ liệu | **hỗn hợp — nghiêng hẳn về không-REAL** (xem PH-03) |
| Ảnh đã nhìn | `artifacts/visual-review/ui-authority/home-production/real-home-1440.png` · `real-home-1100.png` (22/08 17:38) |
| **Agent đã tự mở ảnh?** | **CÓ** — đọc trực tiếp hai tệp PNG, không suy từ CSS |

## ② HỢP ĐỒNG MÀN

- `.claude/skills/if-design/product/home.md` — **MISSING** (thư mục `product/` chưa tồn tại).
- Nguồn thay thế đã dùng: `.claude/skills/if-design/SKILL.md` §1 (HOME **là** *personal operating
  surface*, **không phải** *project dashboard · analytics wall · card farm*) +
  `docs/design-campaign/dna/HOME-SPEC-2026-08-23.md` +
  `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` (Home = Personal Work OS, **hero = Resume**).

## ③ VÍ DỤ XẤU ĐÃ ĐỐI CHIẾU

`.claude/skills/if-design/examples/BAD/**` — **CHƯA TỒN TẠI**. Ghi vào ⑦b.
Đối chiếu thay thế bằng hình: `MOCK-home-work-os.png` · `MOCK-home-sua-4-loi.png` (bản vẽ, không
phải app) — dùng để so **ý định** với **kết quả**, không dùng làm chuẩn chấm.

## ④ MÁY SOI

| Lệnh | Kết quả |
|---|---|
| `npm run soi:foundation` | 🔴 **1173 vi phạm** — `F-ICON-SIZE` 874 (cỡ 13×334 · 15×186 · 12×183 · 11×83) · `F-ICON-VIEWBOX` 74 · `F-MOTION-TOKEN` 84 (`120ms`×34 gõ cứng, `--dur-*` cũ ×26) · `F-MAT-VOCAB` 1 (**G0–G3 xuất hiện 0 lần dưới dạng TOKEN**) |
| `soi:hinh-hoc` · `soi:tu-dien` · `soi:thao-tac` | **CHƯA CHẠY trong lượt này** — ⑦b |

> Bốn họ đỏ này là **toàn repo**, không riêng Home. Chúng **không** cứu được và **không** thay
> được phần chấm bằng mắt bên dưới.

## ⑤ 23 TRỤC

| Trục | Kết quả |
|---|---|
| **A1** việc của con người | **TRƯỢT** |
| **A2** nhân vật chính | **TRƯỢT** — thứ đập vào mắt là **sidebar** |
| **A3** cái gì biến mất được | **TRƯỢT** |
| **A4** tường thẻ | ĐẠT (0 thẻ — nhưng vì màn gần như rỗng, không phải vì có thứ bậc) |
| **A5** SaaS chung chung | ĐẠT — không KPI row, không neon, không gradient khởi nghiệp |
| **A6** sự thật dữ liệu | **TRƯỢT** |
| B1 thứ bậc · B2 khung viền · B3 mật độ · B4 lộ dần · B5 workspace | TRƯỢT · ĐẠT · TRƯỢT · CHƯA SOI · CHƯA SOI |
| C1 chữ · C2 icon · C6 co giãn · C7 thuật ngữ | **TRƯỢT** · TRƯỢT · **TRƯỢT** · **TRƯỢT** |
| C3 chất liệu · C4 chuyển động · C5 cảm ứng | CHƯA SOI (cần ảnh trạng thái / thao tác) |
| D1 dữ liệu · D2 tác giả AI · D3 truy nguồn · D4 khớp Claude Design | TRƯỢT · CHƯA SOI · CHƯA SOI · **DRIFT** |
| E1 Apple · E2 tiền lệ nghề · E3 cá tính IF | TRƯỢT · CHƯA SOI · TRƯỢT |

---

## ⑥ PHÁT HIỆN — xếp theo mức hại

### [H1] PH-01 · Ở 1100px, chữ ĐÈ LÊN CHỮ — không đọc được

- **THẤY GÌ** — `real-home-1100.png`: cột nội dung **không lùi theo sidebar**, nó nằm đè lên
  sidebar. Ba cặp chồng chữ đọc được bằng mắt trần: *"Soát duyệt"* × *"Tiếp tục Nháp"* (chữ
  chồng chữ, cùng dòng y≈530) · *"Tổng quan"* × *"DỰ ÁN"* (y≈687) · *"Flows · Workspace"* ×
  *"Nháp"* (y≈760). Ở 1440 bệnh vẫn còn, nhẹ hơn: *"05:00"*, *"hôm nay"*, *"DỰ ÁN"*, *"Nháp"*
  **bị sidebar che mất mép trái** — nhìn ra vì chúng bắt đầu ở x≈260 trong khi sidebar rộng tới
  x≈332.
- **LUẬT BỊ PHẠM** — `if-design/SKILL.md` §9 *"Responsive means recompose, not shrink"* ·
  `SPEC-MAT-DO-CON-TRO.md` (03/08) · `docs/CHUAN-DAU-RA-NGHE.md` (chữ đè hình là mục **trượt**
  của chuẩn đầu ra — cùng loại lỗi đã bắt trên `layout.pdf` ngày 11/08).
- **HẠI CHO AI, MẤT VIỆC GÌ** — KTS mở IF trên laptop 13" hoặc chia đôi màn: **hero "Tiếp tục
  Nháp" — thứ duy nhất Home tồn tại để phục vụ — nằm dưới chữ khác.** Không đọc được nghĩa là
  không bấm được. Home mất trọn lý do tồn tại ở bề rộng phổ biến nhất của nghề.
- **SỬA THEO NGUYÊN TẮC NÀO** — cột nội dung phải **thuộc cùng một hệ dòng chảy** với sidebar
  (sidebar chiếm chỗ thật, không phủ lên), và co giãn theo bậc `DOCKED → NARROW → COLLAPSED EDGE`
  chứ không giữ nguyên toạ độ.

### [H2] PH-02 · Danh tính giả làm NHÂN VẬT CHÍNH của màn

- **THẤY GÌ** — hero lớn nhất vùng nội dung là **"Tiếp tục Nháp →"**. "Nháp" ở đây không phải
  tên dự án của ai — nó là **nhãn mặc định**. Cùng chuỗi đó lặp **bốn lần** trên một màn: tên
  workspace đầu sidebar (*Nháp*), nhóm sidebar (*NHÁP*), hero (*Tiếp tục Nháp*), nhãn dự án
  (*Nháp*). Header cạnh logo ghi **"Untitled flow"**.
- **LUẬT BỊ PHẠM** — `if-design/SKILL.md` §12 *"An unnamed thing is unnamed — not 'Untitled flow'
  promoted to a title"* · `01-CLINICAL-UI-AUDIT.md` B1 (`Untitled flow` hiện **10/13** bề mặt ⇒
  đã xếp **FAIL hệ thống**) · `docs/CONTENT-RULES.md`.
- **HẠI CHO AI, MẤT VIỆC GÌ** — Home hứa *"đây là việc dở của bạn, bấm để về"*. Người dùng bấm
  vào và về **một thứ chưa có tên**. Lời hứa cốt lõi của Personal Work OS bị một chuỗi mặc định
  chiếm chỗ. Nặng hơn: ở vỏ app, `Untitled flow` đọc ra như *"app không biết mình đang mở cái gì"*.
- **SỬA THEO NGUYÊN TẮC NÀO** — thứ chưa có tên thì **hiện đúng là chưa có tên** và mời đặt tên;
  không thăng nhãn mặc định lên làm tiêu đề. Chuỗi lặp 4 lần trên một màn là dấu hiệu **một
  nguồn tên duy nhất đang rỗng**, phải sửa ở nguồn chứ không sửa từng chỗ hiện.

### [H2] PH-03 · Dữ liệu không-REAL đang định hình bố cục

- **THẤY GÌ** — trong toàn bộ vùng nội dung 1440×1250, thứ **REAL** duy nhất là dòng chào
  *"Chào Tour · Thứ Bảy, 22/08"* và *"DT · 1 thành viên"*. Mọi thứ còn lại: hero PLACEHOLDER
  (PH-02), nhãn dự án PLACEHOLDER, và **~75% diện tích canvas trống trơn** — một vùng xám
  1440×600 phía dưới không chứa gì.
- **LUẬT BỊ PHẠM** — `if-design/SKILL.md` §11 *"Only REAL defines layout"* + bẫy đã đo
  *"Measured on the running app ≠ product truth"*.
- **HẠI CHO AI, MẤT VIỆC GÌ** — bố cục Home đang được thiết kế **quanh một tài khoản không có
  việc thật**. Mọi quyết định bố cục rút ra từ ảnh này đều rút từ dữ liệu rỗng — đúng cơ chế
  *"fixture leo lên thành yêu cầu thiết kế"*.
- **SỬA THEO NGUYÊN TẮC NÀO** — hoặc **trạng thái rỗng trung thực** (nói rõ chưa có việc gì, và
  làm gì tiếp), hoặc soi lại trên tài khoản có việc thật. **Cấm** lấp vùng trống bằng widget.
  *Silence beats fabrication* — nhưng im lặng phải **được thiết kế**, không phải bỏ trống 600px.

### [H3] PH-04 · Sidebar là nhân vật chính; canvas là nền

- **THẤY GÌ** — bài nheo mắt: thứ đập vào đầu tiên là **khối kem dọc suốt màn bên trái**, mạnh
  nhờ **ba kênh cộng dồn**: nền ấm tương phản hẳn với canvas xám-lạnh · chiều cao trọn màn ·
  ba nhãn nhóm chữ đậm. Vùng nội dung chỉ có một dòng tiêu đề mảnh + một đường cong xám nhạt.
  Đo diện tích: sidebar 332/1440 ≈ **23% bề ngang** nhưng chiếm **~90% trọng lượng thị giác**.
- **LUẬT BỊ PHẠM** — `if-design/SKILL.md` §1 (SIDEBAR **là bản đồ**, không phải điểm đến) ·
  §4 *"QUIET FIELD + ONE MEANINGFUL SIGNAL"* · §16 *"Does content dominate chrome?"*.
- **HẠI CHO AI, MẤT VIỆC GÌ** — mắt người dùng mở app là rơi vào **thanh điều hướng**, không rơi
  vào việc. Mỗi lần mở Home là một lần phải tự tìm lấy việc của mình — chi phí trả **mỗi ngày**,
  không phải một lần.
- **SỬA THEO NGUYÊN TẮC NÀO** — bản đồ phải **lùi**: giảm số kênh nó đang dùng (đang 3, cần ≤1),
  và tín hiệu duy nhất của màn phải thuộc về **việc**, không thuộc về chrome.

### [H3] PH-05 · Đồng hồ ánh sáng chiếm vị trí đắt nhất mà không phục vụ việc nào

- **THẤY GÌ** — vật **to nhất và nằm giữa** vùng nội dung là cung mặt trời + nhãn
  `HOÀNG HÔN · 3200K`, mốc `05:00` … `20:00`. Nó nằm **trên** hero *"Tiếp tục Nháp"* theo trục dọc.
- **LUẬT BỊ PHẠM** — **A1 · việc của con người**: không rơi vào ô nào trong năm ô hợp lệ (không
  phải hiện diện người · không phải việc đang làm · không phải điều cần chú ý · không phải Design
  DNA của một dự án · không phải tiện ích người dùng **chủ động** bật). Và đây là **F-01 trong
  `02-FAILURE-LEDGER.md`: "Daylight telemetry leaked into Home"** — **cùng một lỗi, đã ghi sổ,
  vẫn đang sống trên app.**
- **HẠI CHO AI, MẤT VIỆC GÌ** — nó ăn mất **vị trí đắt nhất màn** và đẩy hero xuống dưới; đồng
  thời dạy người dùng rằng vùng giữa Home là chỗ trang trí, nên lần sau họ **không nhìn vào đó nữa**.
  `3200K` là số nghề đọc ra như số đo — nhưng nó không đo gì của dự án nào.
- **SỬA THEO NGUYÊN TẮC NÀO** — ánh sáng chỉ có nghĩa khi **gắn vào một dự án và một quyết định**
  (`Doc.lighting`, chốt 10/08). Ngoài ngữ cảnh đó nó là telemetry, và telemetry không sống ở Home.
  Cùng lỗi **lần thứ hai** ⇒ theo §15 đây là **lỗi quy trình**, phải sửa hệ, không vá chỗ.

### [H3] PH-06 · Sáu nhãn HOA TOÀN PHẦN có dấu tiếng Việt

- **THẤY GÌ** — `VIỆC` · `NHÁP` · `CHẶNG` (nhãn nhóm sidebar) · `DỰ ÁN` (nhãn vùng) ·
  `HOÀNG HÔN` (nhãn widget) · thêm mốc `05:00 / 20:00` đặt cách chữ (letter-spacing) kiểu chữ hoa.
  Bốn trong sáu chuỗi **mang dấu**: `IỆ` · `Á` · `Ặ` · `À`.
- **LUẬT BỊ PHẠM** — `LUAT-CHU-VIET-7.1.23-2026-07-31.md`: **cấm hoa toàn phần**, vì dấu chồng
  mang nghĩa. Luật có từ **31/07**; `06-DESIGN-KNOWLEDGE-AUDIT.md` đã ghi lỗi này ngày 23/08 và
  chẩn đúng nguyên nhân: *"không máy nào canh; không ví dụ xấu để đối chiếu"*.
- **HẠI CHO AI, MẤT VIỆC GÌ** — chữ Việt hoa toàn phần đọc chậm hơn và **trông như dịch máy**.
  Với sản phẩm bán ra toàn cầu, đây là chỗ lộ ra ngay rằng tiếng Việt là công dân hạng hai.
- **SỬA THEO NGUYÊN TẮC NÀO** — nhãn nhóm phân hạng bằng **cỡ · màu · khoảng trống**, không bằng
  chữ hoa. Và luật này phải **vào máy soi** — ba năm luật nằm trong văn bản đã chứng minh là không đủ.

### [H3] PH-07 · DRIFT — cái chạy khác bản vẽ, và không giải qua chỉ mục

- **THẤY GÌ** — bản vẽ `MOCK-home-work-os.png` và `MOCK-home-sua-4-loi.png` tồn tại trong
  `artifacts/visual-review/`, nhưng cái đang chạy **không khớp** (bố cục, hero, vị trí widget).
- **LUẬT BỊ PHẠM** — `if-design/SKILL.md` §2 *"MAIN implements. MAIN does not redesign while
  coding"* + luật **cấm chọn bản vẽ theo tên tệp hay mtime**, phải giải qua
  `docs/mocks/CLAUDE-DESIGN-CURRENT.md`.
- **HẠI CHO AI, MẤT VIỆC GÌ** — không truy được **mã nào sinh từ bản vẽ nào** ⇒ mọi lần sửa Home
  về sau là sửa mù, và bản vẽ mất tư cách nguồn sự thật.
- **SỬA THEO NGUYÊN TẮC NÀO** — nối lại chuỗi `BẢN VẼ → HỢP ĐỒNG → COMPONENT → RUNTIME OWNER →
  TEST → BẰNG CHỨNG TRÌNH DUYỆT`; chỗ nào không có bản vẽ thì khai **DESIGN MISSING**, **MAIN
  không được tự lấp**.

### [H4] PH-08 · Ba nút không nhãn ở đáy sidebar

- **THẤY GÌ** — góc dưới sidebar có ba icon trần: ghim · `‹` · `›`. Không nhãn, không nhóm,
  không nói được cái nào làm gì.
- **LUẬT BỊ PHẠM** — NT-8 (icon giao diện **luôn có nhãn**) · phân loại bảy loại icon 16/08:
  đây là **icon giao diện**, không phải ký hiệu nghề nên không được miễn nhãn.
- **HẠI CHO AI, MẤT VIỆC GÌ** — chức năng ghim/thu-mở sidebar là thứ dùng **mỗi phiên**; giấu nó
  sau ba ký hiệu câm nghĩa là người dùng phải thử-và-sai để biết.
- **SỬA THEO NGUYÊN TẮC NÀO** — hoặc gắn nhãn, hoặc đưa vào ô giải nghĩa có hình
  (`Tooltip` đã mọc prop `hinh` từ 16/08 — dùng lại, không dựng mới).

### [H4] PH-09 · Hai nhiệt độ nền đứng cạnh nhau không có lý do

- **THẤY GÌ** — sidebar nền **kem ấm**, canvas nền **xám ngả lam**. Ranh giới hai vùng là một
  đường đổi nhiệt độ màu chạy dọc suốt màn.
- **LUẬT BỊ PHẠM** — chốt 16/08 về nền sáng canh Apple, có số: Apple `#F2F2F7` ngả **lam**; nền
  kem `#f2efe9` ngả **vàng**; chênh **14 điểm ở kênh lam** — và 14 điểm đó *"là toàn bộ khoảng
  cách giữa sạch và rẻ tiền"*. Kem cũng đã bị **bỏ hẳn** chiều 16/08.
- **HẠI CHO AI, MẤT VIỆC GÌ** — hai nhiệt độ cạnh nhau làm sidebar **nhô lên** (góp vào PH-04) và
  làm màn đọc ra như hai sản phẩm ghép lại.
- **SỬA THEO NGUYÊN TẮC NÀO** — **một** nhiệt độ nền cho toàn app; phân vùng bằng độ sáng và
  khoảng trống, không bằng đổi tông màu.

---

## ⑦ KẾT LUẬN

# 🔴 FAIL

Căn cứ, không nới: **PH-01 là H1** (chặn việc ở 1100px) · **PH-02 và PH-03 là H2** (danh tính giả
+ dữ liệu không-REAL định hình bố cục) · và **trượt bốn trên sáu cổng nhóm A** (A1 · A2 · A3 · A6).
Bất kỳ một trong ba căn cứ đó đã đủ để FAIL.

**Bản soi này KHÔNG đặt trạng thái duyệt.** Chỉ Hoà đặt `FINAL HUMAN APPROVED`.

Ba việc nặng nhất, theo đúng thứ tự hại: **① PH-01 chồng chữ** (đang chặn việc thật) →
**② PH-02+PH-03 sự thật** (mọi quyết định bố cục sau đó phụ thuộc) → **③ PH-04+PH-05 nhân vật
chính** (sửa hai cái này là sửa được lý do tồn tại của Home).

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- **Trục chưa soi**: B4 lộ dần · B5 mềm dẻo workspace · C3 chất liệu · C4 chuyển động ·
  C5 cảm ứng · D2 quyền tác giả AI · D3 truy nguồn · E2 tiền lệ nghề. **Không có ảnh trạng thái**
  (hover · focus · rỗng · lỗi · đang tải · reduce-motion) và **không có theme tối** của Home.
- **Máy soi chưa chạy**: `soi:hinh-hoc` · `soi:tu-dien` · `soi:thao-tac`.
- 🔴 **ẢNH KHÔNG PHẢI MỚI NHẤT.** Hai ảnh dùng để chấm chụp **22/08 17:38**. Trong
  `artifacts/visual-review/` có tệp tên `2026-08-23-nen-sang-apple-home-sang.png` (23/08 10:53)
  — tôi mở ra và **nó KHÔNG PHẢI Home**: đó là màn intro nền tối (đồ vật rời + câu *"Mười file.
  Năm tool…"*), **tên tệp ghi "sáng" nhưng ảnh là tối**. ⇒ **Tên ảnh đang nói dối nội dung ảnh**,
  và không có ảnh Home nào của 23/08. Mọi kết luận trên đây **có thể lỗi thời một ngày**.
- **Hợp đồng màn thiếu**: `.claude/skills/if-design/product/home.md` chưa tồn tại ⇒ ranh giới
  *"Home được phép chứa gì"* đang suy từ nguồn khác, không phải đọc từ hợp đồng.
- **Ví dụ xấu thiếu**: `examples/BAD/**` chưa tồn tại ⇒ PH-04 và PH-05 đối chiếu **bằng lập luận**,
  chưa đối chiếu **bằng hình** như quy trình đòi.
- **Suy chứ không đo**: tỉ lệ *"~90% trọng lượng thị giác"* ở PH-04 là **ước lượng bằng mắt**,
  không phải phép đo. Con số diện tích 332/1440 thì đo được.
- **Chưa hỏi người dùng thật** lần nào — mọi phán đoán về "hại cho ai" là suy từ nghề, chưa quan sát.

## ⑦c HẠN DÙNG

Hết hiệu lực khi: có ảnh Home **chụp lại sau 23/08** · hoặc mã Home đổi · hoặc token nền
(thang chữ · màu · elevation) được Claude Design ban hành — hiện vẫn **OWED**.
