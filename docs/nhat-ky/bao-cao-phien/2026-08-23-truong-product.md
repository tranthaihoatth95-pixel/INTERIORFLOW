# TRƯỜNG THIẾT KẾ IF — phần `product/` + `references/` (23/08)

Vùng ghi: `.claude/skills/if-design/product/**` · `.claude/skills/if-design/references/**` (+ báo
cáo này). Không `git add`, không commit.

---

## ⓪a TIỀN ĐỀ NGHIỆP VỤ — XÁC NHẬN

Đã đọc `docs/design-campaign/06-DESIGN-KNOWLEDGE-AUDIT.md` trước khi gõ. Ràng buộc chính
(*"IF không thiếu tri thức, IF thiếu ĐƯỜNG DẪN tới tri thức đúng lúc"*) **nhận nguyên**, và nó
quyết định hình dạng của toàn bộ 27 tệp: **mỗi tệp là một BỘ ĐỊNH TUYẾN + BẢN CHƯNG CẤT**, mục §8
luôn trỏ về nguồn. **Không tệp nào chép lại nội dung của một tài liệu đã có.**

## ⓪b TIỀN ĐỀ HẠ TẦNG — PASS
`git log --oneline -1` → `c7f3ac8` · `git rev-list --count HEAD..main` → **0** · nhánh `main`.

---

## TỆP ĐÃ VIẾT — 27 tệp, 2.628 dòng

### `product/` — 19 tệp, khuôn 8 mục
| Tệp | Dòng | Ghi chú |
|---|---:|---|
| ⭐ `home.md` | 164 | năm nhóm A–E · năm trạng thái · 10 lỗi 23/08 · bài học vĩnh viễn |
| ⭐ `sidebar-map.md` | 177 | tách **HÀNH VI ↔ DIỆN MẠO** thành bảng riêng · mâu thuẫn 28↔52 |
| ⭐ `workspace-toolwindow.md` | 210 | bốn nghĩa của chữ "tool" + thiệt hại đo được · bốn canvas |
| ⭐ `design-dna.md` | 164 | chuỗi 10 chặng · luật engine↔giao diện · 8 lớp / 4 bộ trích |
| ⭐ `sources.md` | 154 | hai TẦNG · bảy câu hỏi thật (4 câu chưa dựng) |
| `vitals.md` | 115 | F-02 còn mở, đo lại xác nhận |
| `material.md` | 109 | định nghĩa "đồng bộ" · số-chép-lại ≠ phép-đo |
| `review.md` | 106 | hai lớp đóng vào KIỂU · trạng thái rỗng mẫu tốt nhất repo |
| `library.md` · `present.md` | 103 | hai chốt mâu thuẫn cùng ngày · luật đích-đến-sửa-được |
| `visual-pipeline.md` | 101 | 6 bước, **4 bước chưa có file** |
| `3d.md` · `top-shell.md` · `2d.md` · `cold-open-auth.md` · `project.md` · `ask-search.md` | 89–96 | |
| `now-surface.md` | 87 | **0 dòng mã** — ghi rõ là chưa tồn tại |
| `activity.md` | 79 | **chưa xây** — ghi rõ, kèm thứ đang thay thế tạm |

### `references/` — 8 tệp, khuôn 9 mục, 46–58 dòng
`apple` · `visionos` · `photoshop` · `figma` · `blender` · `autocad-revit-rhino` · `resolve` ·
`pinterest-arena`. Ba mẫu bắt buộc trong đề bài (**Pinterest** · **visionOS** ·
**AutoCAD/Blender/Photoshop**) đã viết đúng cặp lấy/không-lấy đã chốt.

---

## NGUỒN ĐÃ CHƯNG CẤT (đọc, không chép)

**Chiến dịch:** `06-DESIGN-KNOWLEDGE-AUDIT` · `01-CLINICAL-UI-AUDIT` (13 bề mặt, 4 kẻ tái phạm) ·
`02-FAILURE-LEDGER` (F-01…F-14) · `04-DESIGN-DNA-AUDIT` · `05-FOUNDATION-BASELINE` (1.164 vi phạm,
93% một gốc).
**Đặc tả 23/08:** `dna/HOME-SPEC` (308 dòng, 4 bổ sung) · `dna/WORKSPACE-SPEC` · `dna/REF-DNA` (S1–S11).
**Sáu báo cáo lane 23/08:** home · home-2 · rail · workspace · files · mau.
**Chốt nền:** `00-CHOT.md` · `IF-KIEN-TRUC.md` · `HOP-DONG-CAU-TRUC-DIEU-HUONG.md` ·
`CHOT-RENDER-TOOL-WINDOW-2026-08-01` · `CHOT-EXPERIENCE-SYSTEM-2026-08-20` · `IF-MOTION-VISUAL-LAW` ·
`nc/NC-GU-BENTRAN-PINTEREST` · `mocks/CLAUDE-DESIGN-CURRENT.md`.
**Đo tại nguồn:** hai lượt khảo mã độc lập phủ 13 bề mặt (vỏ · Vitals · sổ lệnh · auth · review ·
thư viện · dự án · 2D · 3D · vật liệu · pipeline · present), mọi khẳng định có `file:dòng`.

---

## 🔴 MÂU THUẪN CHƯA GIẢI — liệt kê hết, đã ghi vào đúng tệp, KHÔNG tự chọn cái nào

| # | Mâu thuẫn | Ghi ở |
|---|---|---|
| 1 | **Rail nấc hẹp: 28px ↔ 52–56px** — hợp đồng+bản vẽ 16/08 nói 28 (đã thi công thử, có test khoá); chốt trải nghiệm 20/08 và `SKILL.md §6` nói 52. **CHỜ HOÀ** | `sidebar-map.md §8` |
| 2 | **Present đi đâu** khi "ba chế độ = Collab · 2D · 3D"? A1/A2/A3, khuyến nghị A3 nhưng là **quyết định sản phẩm**. Chưa trả lời thì **chưa dựng được cụm 2 của rail** | `workspace-toolwindow.md §8` · `sidebar-map.md §8` · `present.md §8` |
| 3 | **"Master tool" hai định nghĩa cùng sống** — khung môi trường (15–16/08, nặng) ↔ lớp chuột-phải gọi rồi tan (23/08, nhẹ). Có thể cùng sống nhưng **phải nói rõ** | `workspace-toolwindow.md §8` |
| 4 | **Màu nhấn thứ hai: mòng két ↔ mận** — hai bản đã dựng để so bằng mắt, **chưa duyệt**. Kéo theo: màu nút `+` của rail, gradient rê chuột | `sidebar-map.md §8` |
| 5 | **State B (ảnh phiên dở làm nền) ↔ nền môi trường theo giờ** cùng đòi một mặt phẳng. Khuyến nghị A4 (*thế giới ↔ thời tiết*) là **Claude Design phán, Hoà chưa ký** | `home.md §8` |
| 6 | **"Vật liệu của tuần"**: gu 13/08 nói *phải là quả cầu*; chốt 23/08 nói *không là widget mặc định*. Hai văn bản không đối thoại | `home.md §8` |
| 7 | **Nhãn mono UPPERCASE**: mạch Swiss khen ↔ 23/08 gỡ sạch 9 chỗ hoa toàn phần. Ranh giới *nhãn kỹ thuật ngắn ↔ nhãn tiếng Việt có dấu* **chưa ai kẻ** | `home.md §8` |
| 8 | **Ô `1×2` trong bản vẽ EXS-C** ↔ chú thích của chính nó *"ba cỡ 1×1 · 2×1 · 2×2"* — quyết định hay nét vẽ lỡ tay? | `home.md §8` |
| 9 | **Ngưỡng giờ 11h/18h** chia trạng thái C-D-E: lane tự chọn, **không có nguồn** | `home.md §8` |
| 10 | **Ngưỡng "đủ đáng giá"** của tín hiệu Vitals — chưa định nghĩa ⇒ chưa chặn được card rỗng | `home.md` · `vitals.md` |
| 11 | **Danh sách rail 23/08 ↔ `HOP-DONG` 17/08 lệch** (17/08: XƯỞNG 6 / DỰ ÁN 5). 23/08 thắng, nhưng `HOP-DONG` **chưa đóng dấu tại chỗ** | `sidebar-map.md §8` |
| 12 | **`/files` mồ côi** sau chốt rail — chưa ai chỉ lối vào mới | `sidebar-map.md §7` · `sources.md §7` |
| 13 | **Search ở giữa ↔ Vitals đang chiếm giữa**; và *search trong chặng tìm gì?* chưa ai trả lời | `top-shell.md` · `ask-search.md` · `workspace-toolwindow.md` |
| 14 | **"Now surface" chấm 🟢 *gần đạt* cạnh lời thú nhận *chưa có định nghĩa đo được*** — và cụm phải-trên hiện tại **không phải** nó (thông báo/hiện diện/avatar là *của hệ và của người khác*, Now Surface là *của tôi*) | `now-surface.md §7` |
| 15 | **Header 42px chưa phủ toàn app** — chỉ khi một cờ bật; hai chặng còn chiều cao khác | `top-shell.md §7` |
| 16 | **Chốt 720px ↔ 960px của Thư viện, CÙNG NGÀY 07/08, cả hai còn nguyên văn** trong sổ | `library.md §7` |
| 17 | **F-02 (false calm) chưa sửa** — trạng thái *unknown* không tồn tại trong mã; và nó **gộp việc** với ca B2 (ba hành vi khi chưa đăng nhập): cả hai cần **MỘT chủ sở hữu ngữ nghĩa cho "không đọc được"** | `vitals.md` · `cold-open-auth.md` |
| 18 | **`verified` là trạng thái thứ ba loại trừ hay trục thứ hai?** — quyết định cách vẽ chỉ báo độ tin | `design-dna.md §8` |
| 19 | **Danh sách ~17 nét DNA mở rộng** — cố ý chưa thêm, chờ hợp đồng sản phẩm từ Claude Design | `design-dna.md §8` |
| 20 | **Vị trí công trình chưa có trường dữ liệu** trong khi *vị trí quyết định cả bộ chuẩn* đã là chốt; và **không nơi nào khai "họ chuẩn đang áp dụng"** ⇒ luật *một dự án một họ chuẩn* **không kiểm được bằng máy** | `project.md §8` |
| 21 | **Đơn vị & tỉ lệ cấp toàn app: KHÔNG CÓ** | `project.md` · `2d.md` |
| 22 | **Giấy phép TRỌNG SỐ mô hình** không đi qua cổng kiểm giấy phép gói; và **một mô hình không phủ hết ba việc** thị giác | `visual-pipeline.md §7` |
| 23 | **Lỗi tự chuyển khổ A3/A4 ngang/dọc** — Hoà **đã thấy nó chạy sai** từ 07/08, chưa thấy ghi nhận đã sửa | `present.md §8` |
| 24 | **Bản vẽ chất lượng món (EXS-N/O/P) hạ hạng 20/08** xuống tham chiếu kỹ thuật nội bộ — **cấm thi công visual theo chúng**; ba tầng BROWSE→HỘ CHIẾU→KIỂM chưa có bản vẽ duyệt | `library.md §8` |
| 25 | **Chuỗi `specId` đứt ở mắt cuối** — mọi món thả từ Thư viện ra BOQ báo lỗi; hàm biết nhận tham số, hai nơi gọi không truyền | `library.md` · `2d.md` |
| 26 | **Chặng deck của bảng kiểm là vỏ rỗng** — luật deck không bao giờ chạy, mà bảng vẫn hiện "0 vi phạm" | `review.md` · `present.md` |

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc

1. **Không mở app thật một lần nào.** Mọi khẳng định về hiện trạng là **đọc tài liệu + đọc mã +
   nhận từ hai lượt khảo mã**, không phải quan sát. Với một bộ tài liệu về *thiết kế*, đây là giới
   hạn thật — nhất là các câu về "trông như thế nào".
2. **Nhiều dữ kiện là số của người khác, tôi không đo lại.** Cụ thể: mọi con số trong sáu báo cáo
   lane 23/08 (136px hero · lỗ 234px · 3,23:1 của màu AI · 2,55→3,36 của nút mờ · 1.634 asset ·
   93% bề ngang canvas). Chúng có nguồn rõ ràng nhưng **tôi kế thừa, không kiểm chứng lại** — đúng
   thứ mà chính ca §7② của `material.md` cảnh báo (*số chép lại không phải phép đo*).
3. **Hai lượt khảo mã là của subagent.** Tôi đối chiếu chéo với tài liệu ở những chỗ trùng nhau và
   không thấy mâu thuẫn, nhưng **không mở lại từng `file:dòng`**. Chỗ rủi ro nhất: các câu "0 nơi
   mount" / "0 dòng mã" — chúng dựa trên grep, và ledger F-03/F-12/F-13 đã chứng minh **ba lần**
   rằng grep bắt hụt đường import tương đối. Câu *"`NowSurface` = 0 dòng"* và *"activity-feed chưa
   xây"* có mã tự khai chống lưng nên tôi tin; các câu mồ côi khác thì **nên đi qua máy dò đồ thị
   import trước khi hành động**.
4. **Bốn tệp vượt trần 140 dòng** (`sidebar-map` 177 · `workspace-toolwindow` 210 · `home` 164 ·
   `design-dna` 164). Đây là bốn tệp đề bài yêu cầu *viết kỹ nhất*, và tôi chọn **giữ nội dung thật
   thay vì cắt cho đủ số dòng** — nhưng đó là tôi tự quyết, chưa ai duyệt. Nếu trần là cứng thì
   phần cắt được rẻ nhất là bảng §6 (chốt đã ký), vì nó trùng với `00-CHOT`.
5. **Không kiểm chéo mọi mã điều khoản.** Tôi cố ý **không trích mã `[Đ*]` / `[T*]` / `[N*]`** trong
   27 tệp — vì sổ ghi rõ đã có **sáu lần trích sai mã trong một ngày**. Thay vào đó tôi trích **tên
   luật + nội dung**. Cái giá: người đọc muốn tra số điều khoản vẫn phải mở `TRIET-LY-IF.md`.
6. **Phần "chốt đã ký" của các tệp nhẹ mỏng hơn phần của 5 tệp trọng tâm** — tôi lấy từ `00-CHOT`
   và các spec, **không quét hết** lịch sử chốt của từng bề mặt. Có thể sót chốt cũ.
7. **Chưa đối chiếu 24 ảnh trong thư mục duyệt-mắt trên Drive.** Nếu Hoà đã ghi chú lên hình thì
   những ghi chú đó **chưa vào bộ tài liệu này**.
8. **Không chạy `soi:tu-dien`** trên 27 tệp mới. Chúng là `.md` trong `.claude/`, nằm ngoài phạm vi
   quét hiện tại của máy soi (máy chỉ mới hết mù `.md` cho `docs/phieu-giao` và `docs/mocks`) ⇒
   **nhãn trong bộ tài liệu này chưa có máy nào canh**. Đây là lỗ thật: đúng loại tệp mà phiên sau
   sẽ đọc để thi công.
9. **`references/` chỉ có nguyên tắc, không có nguồn URL.** Đề bài cấm chép tài sản có bản quyền và
   tôi tuân, nhưng hệ quả là các câu về Apple/Figma/Blender **không truy được về một trang cụ thể**
   — chúng đến từ các tài liệu nghiên cứu đã có trong repo, không từ việc tôi đọc tài liệu gốc
   trong lượt này. Riêng bài học *iOS 27 tự sửa Liquid Glass* có nguồn trong repo
   (`SPEC-APPLE-MOTION-MATERIAL.md`), tôi **không** xác minh lại từ nguồn Apple.
10. **Chưa ai đọc thử bộ này với tư cách "agent đang cần định tuyến".** Giá trị của nó là *dẫn tới
    đúng tệp trong 3 giây* — điều đó chỉ chứng minh được bằng một lượt dùng thật.

## ⑦c HẠN DÙNG KẾT LUẬN
- Toàn bộ mục §6 (chốt đã ký) và §8 (mâu thuẫn) hết hiệu lực từng phần **ngay khi Hoà chốt** bất kỳ
  mục nào trong bảng 26 mâu thuẫn trên.
- Mọi câu về **màu và tương phản** hết hiệu lực khi lane MÀU đóng đợt token sáng — số cũ đo trên
  bảng màu trước đó.
- Mọi câu về **rail** hết hiệu lực khi mâu thuẫn #1 và #2 được chốt.
- Bảng trạng thái bản vẽ (`APPROVED / CANDIDATE / NOT STARTED`) chép từ chỉ mục thiết kế cập nhật
  **22/08** — phải resolve qua chỉ mục, **không bao giờ chọn bản vẽ bằng tên tệp hay ngày sửa**.
