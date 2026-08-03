# NC-4 · ONBOARDING APP PRO — Figma / Linear / Notion
**COWORK-NC · 02/08/2026 đêm.** Nuôi: **Smart Tour v2** (Smart Tour v1 đã merge — xem `SO-KIEM-TONG` §1 dòng Gallery/Notebook/Login/Journey/Smart Tour).
**Liên quan luật đã chốt:** `SPEC-NGON-NGU-CHI-DAN` (4 khuôn thông điệp, có khuôn TRỐNG và MÁCH NƯỚC — chính là ngôn ngữ của onboarding) · `CONTENT-RULES` (nội dung demo không trộn với thật) · `LUAT-TRUNG-TINH` (dự án mẫu không được dính tên/ảnh khách).

---

## 1 · Ba app dạy người mới bằng gì

| | Linear | Notion | Figma |
|---|---|---|---|
| Nước đi mở màn | **Dạy ⌘K TRƯỚC KHI user làm bất cứ gì** — không phải "mẹo hay" mà là tuyên bố mô hình sản phẩm; hỏi theme Sáng/Tối ngay sau tạo workspace (khoảnh khắc đầu tiên sản phẩm được cấu hình CHO user) | **3 câu hỏi cá nhân hoá** (câu chốt: "dùng Notion để làm gì?") → thay vì cả gallery, chỉ đưa **5 template hợp với câu trả lời** | Native onboarding = tooltip walkthrough ngắn; sức nặng nằm ở **Playground files** — file mẫu TƯƠNG TÁC cho từng tính năng (variants, prototype, copy/paste), mở ra là nghịch được ngay |
| Chống trang trắng | workspace có checklist "get familiar" thay vì trống | **Template đè chết "blank page paralysis"** — thấy ví dụ thật rồi sửa, thay vì đọc giải thích tính năng; Getting Started page = checklist SỐNG trong chính sản phẩm ("Type `/` for slash commands") | Playground + community templates |
| Học bằng làm | **Checklist nhiệm vụ nhỏ**: tạo issue → dùng ⌘K → đặt priority; mỗi task mở ra đúng 1 vùng UI trong ngữ cảnh; xong checklist là user đã CHẠM toàn bộ workflow lõi, chưa ai "giảng" gì | checklist Getting Started thao tác thật trên trang thật | Playground file = học bằng nghịch |
| Bước tuỳ chọn | GitHub + mời teammate: **optional, skippable, không chặn đường tới giá trị** — "gieo ý định mà không dựng cổng" | mời team sau | mời team sau |
| Activation event | **tạo VÀ resolve issue đầu tiên** — xảy ra ngay trong phiên onboarding; không ăn mừng, sản phẩm "chỉ đơn giản trở nên dùng được" | tự tạo trang đầu từ template | file đầu tiên |
| Vết gợn được ghi nhận | URL prefill sai kiểu · popup "active issues" hiện khi user chưa có ngữ cảnh | — | tooltip tour của Figma bị đánh giá là phần yếu hơn playground |

Nguồn: [Supademo teardown Linear (screen-by-screen)](https://supademo.com/user-flow-examples/linear) · [growthdives về onboarding Linear](https://www.growthdives.com/p/the-onboarding-linear-built-without) · [candu.ai teardown Notion](https://www.candu.ai/blog/how-notion-crafts-a-personalized-onboarding-experience-6-lessons-to-guide-new-users) · [Appcues GoodUX: Notion](https://goodux.appcues.com/blog/notions-lightweight-onboarding) · [onboardme: "How Notion Solved the Blank Page Problem"](https://onboardme.substack.com/p/how-notion-solved-the-blank-page-product-strategy-deepdive) · [Figma Playground collection (chính hãng)](https://www.figma.com/community/collections/playground) · [Figma blog "Three Cs"](https://www.figma.com/blog/the-three-cs-of-figma-a-beginners-guide-to-success/) · [Appcues GoodUX: Figma](https://goodux.appcues.com/blog/figmas-animated-onboarding-flow)

## 2 · Số liệu & nguyên tắc ngành về TOUR

- **~70% user bỏ qua tour bị áp đặt** ([Guideflow tổng hợp](https://www.guideflow.com/blog/product-tour-best-practices)); tour không skip được gây bực nhất với user có kinh nghiệm ([StepsKit](https://stepskit.com/blog/onboarding-tours)).
- **NN/g** ([Onboarding Tutorials vs. Contextual Help](https://www.nngroup.com/articles/onboarding-tutorials/)): contextual help thắng tutorial dài; lời khuyên ngành lặp lại: *"empty state tốt + 1 CTA thường thắng tour 5 bước giải thích các nút"*; tour nên xuất hiện KHI user cần, không phải lúc login đầu tiên.
- Mô hình thắng cuộc cả 3 app hội tụ: **checklist dẫn nhịp · tooltip xử lý friction tại chỗ · empty state chỉ nước đi tiếp theo** — không cái nào là "tour chiếu phim".

---

## 3 · ĐIỀU IF NÊN LÀM (đầu vào cho Smart Tour v2)

| # | Đề xuất | Căn cứ |
|---|---|---|
| 1 | **Định nghĩa ACTIVATION EVENT của IF và ghi vào spec Smart Tour v2** — đề xuất: *hoàn thành render đầu tiên từ bản vẽ của chính mình* (aha-moment 3 chặng nối nhau). Mọi bước onboarding xếp để dẫn tới sự kiện đó, đo được | Linear: activation = resolve issue đầu, cả flow phục vụ nó; không có đích đo được thì tour chỉ là trình chiếu |
| 2 | **Dự án mẫu "mở là nghịch được" thay cho tour** — 1 dự án trung tính đầy đủ 4 chặng (căn hộ nhỏ: mặt bằng đã vẽ, vài render, 1 deck) hiện trong Gallery với badge "Mẫu"; kiểu Figma Playground + Notion template. Nội dung tuân `CONTENT-RULES` + luật trung tính (chuẩn "Atelier Nord" như deck mẫu đã có) | Chống blank-canvas là bài Notion thắng đậm nhất; IF 4 chặng phức tạp hơn Notion nhiều → càng cần VÍ DỤ SỐNG hơn lời giảng |
| 3 | **Checklist 4-5 nhiệm vụ nhỏ học-bằng-làm** (thay tour tuyến tính): ① vẽ 1 phòng bằng ROOM · ② áp 1 vật liệu · ③ render 1 ảnh · ④ đặt ảnh vào 1 trang deck · (⑤ mời 1 đồng nghiệp — optional không chặn). Mỗi mục mở đúng vùng UI đúng lúc; xong = activation | Chép mô hình checklist Linear nguyên khối; mục ⑤ theo pattern "gieo ý định không dựng cổng" |
| 4 | **Dạy MÔ HÌNH LÕI trước khi dạy nút** — bài mở màn 1 màn hình duy nhất: "3 chặng Vẽ → Dựng → Trình là MỘT dòng chảy" + ⌘K là cách gọi mọi lệnh (nối `CommandPalette` CHINH đang wire). KHÔNG liệt kê tính năng | Nước đi đắt nhất của Linear: dạy ⌘K trước cả khi user chạm gì — tuyên bố sản phẩm này vận hành thế nào |
| 5 | **1 câu hỏi cá nhân hoá, không phải 3**: "Bạn bắt đầu từ đâu?" → *Bản vẽ có sẵn (DXF/DWG) / Vẽ mới / Xem thử bản mẫu* → đáp xuống đúng chặng + đúng empty state | Notion hỏi 3 câu vì phục vụ marketing segment; IF chỉ cần đúng 1 câu định tuyến — ít chữ theo `SPEC-PANEL-ROLLOUT` §3 |
| 6 | **Empty state = khuôn TRỐNG của `SPEC-NGON-NGU-CHI-DAN` áp đủ 5 màn** (mỗi màn trống: 1 câu hành-động-trước ≤12 từ + 1 NÚT, vd Trình bày trống: "Kéo một ảnh render vào để bắt đầu trang đầu tiên" + nút "Mở kho ảnh") — rà từng màn, liệt kê trong spec v2 | NN/g + StepsKit: empty state tốt thắng tour 5 bước; khuôn đã chốt sẵn trong spec ngôn ngữ, chỉ việc áp |
| 7 | **Tooltip theo ngữ cảnh lần-đầu-chạm** (kiểu Notion hover): lần đầu vào mode Vẽ 3D → 1 tooltip về gizmo; lần đầu mở node MASTER → 1 tooltip "kéo ra window". Mỗi tooltip hiện đúng 1 lần, có "Đừng chỉ nữa" | NN/g contextual-help; tránh dội 10 tooltip lúc login như tour cổ điển |
| 8 | **Smart Tour v2 = trạm tuỳ chọn, nút thoát luôn hiện, vào lại được từ menu avatar** ("Hướng dẫn" trong menu avatar đã gom ⚙+⋯ theo `CHOT-AVATAR-MEMOJI`) | ~70% skip tour bị ép — đừng ép; cho vào lại được là điều tour cổ điển hay quên |
| 9 | **Theme + ngôn ngữ VI/EN hỏi NGAY màn đầu tiên sau đăng ký** (IF đã có switcher + 2 theme, Tối mặc định) | Linear: câu hỏi theme là khoảnh khắc "sản phẩm cấu hình cho user" — rẻ mà đặt đúng chỗ thì sang |
| 10 | **KHÔNG làm ở v2**: video tour dài (đã có `CHOT-INTRO-VIDEO` 8s riêng cho intro — đừng trộn) · nhân vật hoạt hình dẫn chuyện · tour ép tuyến tính · gamification điểm thưởng | Giữ phạm vi; intro video và onboarding là 2 việc đã tách |

**Giới hạn nghiên cứu:** teardown Linear/Notion là nguồn thứ cấp chất lượng cao (có ảnh màn hình từng bước) nhưng phản ánh phiên bản tại thời điểm viết — flow thật 2026 có thể đã đổi chi tiết; số "~70% skip tour" là số vendor-blog tổng hợp (Guideflow/StepsKit đều bán tool onboarding — có thiên vị "tour phải làm khéo"), NN/g là nguồn trung lập nhất trong bộ. Chưa khảo được onboarding của app CÙNG NGÀNH (D5/SketchUp first-run) — nếu Smart Tour v2 cần, đó là bài NC bổ sung.
