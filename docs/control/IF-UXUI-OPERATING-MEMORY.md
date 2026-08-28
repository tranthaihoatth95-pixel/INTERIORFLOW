# IF · TRÍ NHỚ VẬN HÀNH UX/UI — phán đoán đã trả giá

`Plane: BOS` · phân luồng: `docs/control/BOS-PHAN-LUONG-TRI-NHO.md`


> **Đây KHÔNG phải nhật ký phiên.** Nhật ký kể *chuyện gì đã xảy ra*; tệp này giữ *điều đã học được
> và phải trả giá để học*. Mọi mục đều là thứ đã làm hỏng thật ít nhất một lần.
>
> **Cách dùng:** đừng đọc hết. Khi sắp làm một việc giao diện, tra mục cùng họ. Khi thấy mình sắp
> nói *"chắc là ổn"* mà chưa đo — tra ở đây trước.
>
> Nhãn **HỆ THỐNG** = đã hỏng **từ hai lần trở lên** ⇒ không được chữa bằng cách nhắc nhau cẩn thận,
> phải chữa bằng máy canh hoặc bằng cách đổi cấu trúc.

---

## Nhóm 1 · SỰ THẬT vs VẺ NGOÀI CỦA SỰ THẬT

### M-01 · Máy soi xanh ≠ sản phẩm hội tụ 🔴 HỆ THỐNG
**Triệu chứng** — mọi cổng đo đều xanh, chủ dự án mở app và nói *"XẤU"*.
**Gốc bệnh** — máy đo được thang chữ · nguồn icon · token nhịp · tương phản. Máy **không** đo được
bố cục · nhân vật chính · sự tĩnh tại.
**Bằng chứng đắt nhất (23/08)** — ba phát hiện khiến Trang chủ trượt **không máy nào bắt được**,
trong khi `soi:foundation` báo **1.173 vi phạm** mà **không cái nào là lý do nó trượt**.
**Luật đã sửa** — máy và người soi **cùng nhau**, không thay nhau. Không có ảnh app thật thì
**cấm cho PASS**, trần cứng là PARTIAL.
**Kiểm tái phát** — skill `if-design-review`, bước bắt buộc "đã nhìn ảnh app thật chưa".

### M-02 · Bản vẽ tồn tại ≠ sản phẩm đã dựng 🔴 HỆ THỐNG
**Ca thật** — `mock-home-sua-4-loi.html` **đo đúng bệnh Trang chủ từ 17/08**, có cột TRƯỚC↔SAU, đo
được `trống 50,3% · 37,2% · 65,2%`. Bản SAU **chưa bao giờ vào app**. Sáu ngày sau vẫn nguyên bệnh.
**Luật** — bản vẽ vào chỉ mục **chưa phải là xong**; phải truy được `bản vẽ → mã → ảnh app thật`.

### M-03 · "Có trong mã" ≠ "tới được người dùng" 🔴 HỆ THỐNG
**Ba ca cùng họ:**
· lý do nút mờ nằm trong `title` — câm trên cảm ứng, Tab bỏ qua nút `disabled` ⇒ **không bao giờ tới được ai**;
· `--focus-ring` **chưa từng được khai** dù có nơi dùng từ 17/08 — CSS **im lặng** bỏ qua biến thiếu ⇒ vòng focus "đã sửa" **sáu ngày không vẽ một pixel**;
· `components/ui/Icon.tsx` khai `strokeWidth?: number`, hẹp hơn lucide ⇒ **mọi** chỗ dùng thật là `tsc` đỏ; `grep "glyph={"` = **0**. Primitive chưa từng chạy, mà test vẫn 8 PASS.
**Gốc bệnh chung** — kiểm **CÓ MẶT** thay vì kiểm **CÓ TÁC DỤNG**.
**Luật** — với mọi thứ người dùng phải chạm tới: chứng minh **đường dây tới đầu cuối**, không chỉ chứng minh nó tồn tại. `var(--x)` mà `--x` chưa khai là **một lỗi câm** — đáng có máy soi riêng.

### M-04 · Test khẳng định đường thoái lui là test CHE bug 🔴 HỆ THỐNG
**Ca gốc (15/08)** — `calibrateFromImage` hỏng suốt vì test duy nhất chạm nó lại **khẳng định nó trả `needsManualScale`** — tức ghi nhận đúng hành vi hỏng làm kỳ vọng.
**Ca lặp (23/08)** — `icon.test.ts` khoá hằng số, **không ca nào truyền icon lucide thật**.
**Luật** — có test cho đường thoái lui mà **không có test nào khẳng định đường CHÍNH chạy được** ⇒ đó là test che bug.

### M-05 · Số chép lại không phải phép đo
**Ca thật** — *"`lib/materials`↔`ProductSpec` = 0 code"* đúng cho phép đo **sáng** 07/08; `resolve.ts` sinh **chiều cùng ngày**. Số bị chép qua nhiều tệp suốt hai tuần như thể vẫn đúng.
**Ca thứ hai** — tôi đếm *"9 tệp mock"*, thật ra **106** — tôi lấy số tệp **đã đẩy lên Claude Design** làm số tệp trong thư mục, tức **nhầm một HÌNH CHIẾU thành NGUỒN**.
**Luật** — đếm cái gì thì đếm **tại nguồn**. Trích mã điều khoản thì **mở tệp đọc số**, cấm nhớ hộ.

### M-06 · Sai cổng = kết luận sai 🔴 HỆ THỐNG
Ba cổng cùng sống, nhìn giống hệt nhau: `:3777` ảnh chụp phát hành **đóng băng** · `:3778` bản dựng **cũ** · `:3799` **mã hiện tại**. Sửa nguồn rồi soi `:3777` ⇒ không thấy gì đổi, **không ai nói dối**.
**Luật** — trước mọi kết luận thị giác, hỏi **"cổng này phục vụ MÃ NÀO"** (`/api/dev-identity`).

### M-07 · Bình tĩnh giả là nói dối
`calm` là một **khẳng định** (*"đã kiểm, không có gì đáng lo"*), không phải sự im lặng. Trả `calm` khi thật ra **không kiểm được** (401) là nói dối bằng giao diện.

---

## Nhóm 2 · NỘI DUNG XỨNG ĐÁNG TỒN TẠI

### M-10 · Tường widget — vật tồn tại vì có chỗ trống 🔴 HỆ THỐNG
**Bị bác ba lần**: 20/08 *"cấm lưới thẻ đều"* · 22/08 *"thẻ khổng lồ, tường widget"* · 23/08 *"XẤU"*.
**Luật** — một phần tử **không xứng đáng tồn tại chỉ vì có dữ liệu hoặc có chỗ trống**. Mọi vật trên Trang chủ phải thuộc đúng một nhóm: hiện diện con người · việc đang làm · điều cần chú ý · Design DNA · tiện ích **người dùng CHỦ ĐỘNG bật**.
**Ca phân định tinh nhất** — *"Ghi chú nhanh"*: **cùng một widget, hai phán quyết**, phân biệt bởi **ai khởi xướng**. Người dùng ghim ⇒ hợp lệ. Máy nhét cho đỡ trống ⇒ loại.

### M-11 · ⭐ BIẾT LUẬT BẰNG CHỮ ≠ NHẬN RA VI PHẠM BẰNG MẮT
**Bài học đắt nhất cả chiến dịch.**
`components/home/BeMatHome.tsx:11-17` — docstring của **chính tệp dựng bố cục** — chép sẵn luật cấm lưới thẻ đều, **gọi tên đúng cả hai lần trượt trước**, phát biểu đúng cách hiểu đúng. Rồi vẫn giao ra tường thẻ trắng.
⇒ **Không phải "không ai đọc".** Luật bằng văn xuôi **không cho người ta cách đối chiếu sản phẩm của mình với nó**. Người dựng tin các ô khác số ô **trên giấy**, không có cách nào phát hiện rằng **trên màn** chúng vẫn cùng chất liệu, cùng vỏ trắng, cùng trọng lượng.
**Luật** — **luật thiết kế nào không kèm được một cặp ảnh TỐT/XẤU thì chưa dùng được** — nó mới là một câu, chưa phải công cụ. Kho ví dụ: `.claude/skills/if-design/examples/`.

### M-12 · Widget thiếu dữ liệu phải TỰ ẨN, và ô phải co theo nội dung
`WidgetCard` để `h-full` + cỡ ô là hằng số chép từ bản vẽ ⇒ vỏ trắng **kéo giãn cho bằng khung**, ruột thật chỉ 136px. Luật "co theo nội dung" trước nay chỉ áp cho nội dung, **không áp cho cỡ ô**.

### M-13 · Trang chủ phải biết cách IM LẶNG
Kho thật gần rỗng là **trạng thái THẬT**. Một màn trống tử tế hơn hẳn một màn đầy số bịa. Cấm fixture, cấm `0/0`, cấm khung rỗng chờ nội dung.

### M-14 · Telemetry ánh sáng ban ngày đã bị từ chối — và vẫn đang sống
Ghi sổ **F-01**, vẫn chiếm giữa màn Trang chủ **trên** hero tới 23/08.
**Luật** — **ghi sổ mà không có máy canh hoặc không có ví dụ hình thì sổ chỉ là sổ.**

---

## Nhóm 3 · THỨ BẬC, HÀNH VI, KIẾN TRÚC

### M-20 · Lỗi thị giác của Sidebar KHÔNG được kéo theo viết lại hành vi
Hành vi đã có test (ba nấc · nhớ nấc · cấm auto-hide · nút mờ có lý do) thì **giữ**; chỉ đổi hình dạng. Tách bảng **HÀNH VI ↔ DIỆN MẠO** trong `if-design/product/sidebar-map.md`.

### M-21 · Ba nấc là ba CÔNG NĂNG, không phải ba cỡ 🔴 HỆ THỐNG
Sửa cho `card` xong vẫn tái phát ở `sidebar` và `cửa sổ công cụ` — vì chỉ sửa **ca**, không sửa **tư duy** đẻ ra ca đó.
**Hai vế nghiệm thu**: ① che nấc to đi, **nấc nhỏ vẫn đứng được một mình** ② nấc to phải có thứ nấc nhỏ **KHÔNG THỂ** có — không phải thứ nấc nhỏ có mà to hơn.
**Hệ quả** — mục nào không có gì để thêm thì **dừng ở hai nấc**. Ba nấc là **nhịp chung, không phải hạn ngạch**.

### M-22 · Panel cố định là thua kém phần mềm chuyên nghiệp
Cửa sổ công cụ phải: kéo · cắm bến · gỡ bến · đổi cỡ · thu · ghim · tiêu điểm · khôi phục · **nhớ**. Và quan trọng hơn: **tầm quan trọng phụ thuộc NGỮ CẢNH** — chọn vật liệu thì công cụ vật liệu bước lên trước.

### M-23 · Sản phẩm không thiếu tri thức — thiếu ĐƯỜNG DẪN tới tri thức
32 tệp nghiên cứu · 12 văn bản luật · ~106 bản vẽ, mà vẫn phạm luật đã ghi thành văn. **Ba trên bốn ca là lỗi ĐỊNH TUYẾN.**
**Hệ quả cấu trúc** — `SKILL.md` là **bộ định tuyến**, không phải bách khoa. Nạp đúng nhánh, cấm nạp cả trường.

### M-24 · Tri thức chết vì đứt con trỏ, không phải vì bị xoá 🔴 HỆ THỐNG
`IF-ARCHITECTURE-COMPASS.md` — bản đồ 12KB, đủ thứ mọi phiên cần. Một lượt đổi tên 28/07 làm đứt con trỏ ⇒ **19 ngày không ai đọc**, và suốt 19 ngày đó các phiên tự suy diễn lại thứ nằm sẵn trong nó.
**Luật** — đổi tên tài liệu nền thì **sửa MỌI con trỏ ngay lượt đó**; để lại mẩu chuyển hướng là **chưa xong việc**. Máy canh: `npm run soi:design-school` (canh hai chiều: con trỏ chết **và** tệp mồ côi).

### M-25 · Sổ đặt tên cho thứ code đã có tên ⇒ đẻ khái niệm ma 🔴 HỆ THỐNG
`"master tool"` = **0 lần trong code, 26 lần trong sổ**. `ToolWindow` = **13 chỗ trong code, 0 trong sổ**. Hai tên **không giao nhau ở đâu cả** ⇒ đọc sổ thấy khái niệm mới, đi tìm không thấy, làm việc khác. **Yêu cầu bị nhắc 4 lần, làm nhầm 6 phiếu.**
**Luật** — sổ đặt tên cho một thứ thì **phải kiểm code đã có tên chưa**. Và: chữ nguy hiểm nhất là chữ **nghe quá quen nên không ai nghĩ phải định nghĩa** (`tool` · `card` · `panel`). Dấu hiệu rẻ nhất: **mỗi lần chủ dự án phải nhắc lại một yêu cầu lần thứ hai, kiểm xem có phải lệch nghĩa MỘT CHỮ không.**

### M-26 · Hai thang nhịp cùng sống ⇒ trôi dạt
Thang cũ `--dur-*` và thang mới `--nhip-*` cùng tồn tại. **Một khái niệm một chủ sở hữu**; thang bị thay phải đóng dấu tại chỗ, không bỏ hoang.

### M-27 · Sửa một ca không sửa được tư duy đẻ ra ca đó
Chủ dự án đã sửa lỗi "ba nấc = ba cỡ" cho `card`; nó **mọc lại** ở `sidebar` và `cửa sổ công cụ`.
**Luật** — hỏng lần hai ở chỗ khác ⇒ đó là **HỆ THỐNG**, phải chữa bằng luật/máy canh, không phải bằng vá ca.

---

## Nhóm 4 · QUẢN TRỊ

### M-30 · Claude Design là thẩm quyền thị giác — MAIN không được âm thầm thiết kế lại 🔴 HỆ THỐNG
**Ca thật 23/08** — tôi brief ba lane bằng **bố cục tôi tự nghĩ ra**, trong khi `mock-rail-hai-cum.html` · `mock-files-hai-tang.html` · `mock-home-sua-4-loi.html` **đã nằm sẵn trong repo**. Bản vẽ rail còn chặt hơn brief của tôi ở **6 điểm** tôi không nghĩ tới.
**Luật** — trước khi brief bất kỳ việc thị giác nào: **`ls docs/mocks/` và đọc `CLAUDE-DESIGN-CURRENT.md`**.

### M-31 · Báo cáo audit là BẰNG CHỨNG, không phải THẨM QUYỀN
Phân loại trước khi hành động: `LỖI` · `NỢ` · `LUẬT XUNG ĐỘT` · `BẰNG CHỨNG CŨ` · `BÁO ĐỘNG GIẢ` · `HƯỚNG THIẾT KẾ` · `CẦN NGƯỜI QUYẾT`. Phân loại sai ⇒ hành động sai **dù phát hiện đúng**.

### M-32 · Agent được phép bác MAIN — và nó sinh lời đậm nhất
Ngày 16/08 agent bắt **6 lỗi mã điều khoản** của MAIN. Ngày 23/08 agent bác lại **kết luận trung tâm** của audit MAIN, và **đúng** (xem M-11).
**Luật** — ô ⓪ TIỀN ĐỀ trong mọi phiếu: agent **phải xác nhận hoặc BÁC** giả định của phiếu trước khi làm. Làm đúng một phiếu sai vẫn là hỏng việc.

### M-33 · Ban một luật không miễn cho người ban khỏi luật đó
Tôi ban luật *"trích mã điều khoản phải mở tệp đọc số"* — và **sai số dòng ngay trong câu ban luật đó**. Cơ chế duy nhất bắt được: agent soi ngược MAIN.

### M-34 · Dữ liệu fixture không được định nghĩa giao diện sản xuất
`21/21` · `19 Bản nháp` là fixture. Dự án thật ≈ 0. Bố cục dựng trên fixture sẽ **sai ngay hôm ra mắt**.

### M-35 · Route dev/demo không được ship tới được
4 route bàn thử nằm trong cây sản phẩm, **không có lối vào từ giao diện** nên không ai thấy — nhưng trong bản đóng gói, **ai gõ đúng đường dẫn là vào được**, và thấy dữ liệu bịa.

### M-36 · Engine DNA sản phẩm KHÔNG phải thẩm quyền Design System giao diện
Hai thứ khác nhau: DNA là **gu của dự án khách**; Design System là **nhận diện của app**. Trộn là mất cả hai.

---

## Nhóm 5 · CHỮ VIỆT · ICON · VẬT LIỆU

### M-40 · Bộ chữ phải phủ đủ tiếng Việt — kiểm bằng BẢNG MÃ, không bằng mắt 🔴
Geist thiếu **10/10** ký tự dấu chồng. Mỗi chữ có dấu rơi về font hệ thống là **serif** ⇒ một từ tiếng Việt bị vá bằng **hai font**. Đó là nguyên nhân **duy nhất** của cả hai lời chê kéo dài hai tuần: *mất dấu* và *trông serif*.
**Bẫy** — chú thích cũ khai *"hệ điều hành tự fallback glyph tiếng Việt"*. `fallback` lo lúc font **tải hỏng**; nó **không** lo được lúc font tải xong mà **không có chữ**. Hai lỗi khác nhau bị gộp một dòng nên không ai đi kiểm.

### M-41 · Cấm hoa toàn phần cho chữ Việt chạy
Dấu chồng **mang nghĩa**; hoa toàn phần giết dấu. Ca 23/08: **đúng một** chữ `uppercase` trong `WidgetCard` đẻ ra **sáu** nhãn phạm luật.
Phân biệt **CHỮ KỸ THUẬT** (`2400 × 750 mm` · `Ø25` · `±0.000`) và **CHỮ CHẠY** (`Chiều cao 750 mm`).

### M-42 · Lucide không phải vấn đề icon
Vấn đề là **dùng không nhất quán**. Một nghĩa một icon; cỡ 14/16/18/20; nét 1.5; cùng lệnh phải cùng icon ở toolbar · palette · menu ngữ cảnh.

### M-43 · Kính: cả cục màu thì không bao giờ ra kính
Tô phẳng ⇒ tâm = rìa ⇒ mắt đọc ra **nhựa**. Cấu tạo đúng: **phim màu MỎNG → khối kính TRONG có bề dày → mép**. Nghiệm thu một câu: **rìa phải đặc hơn tâm** (đường quang dài hơn).
**Và** — kính lỏng quang học **cần DIỆN TÍCH**; ở 44px các cue chồng lên nhau thành một vệt, đo được là **dưới ngưỡng đọc được**.

### M-44 · Cơ chế chứng minh phải với tới được thứ nó nhận là đang chứng minh
Lưới nét thẳng đặt **sau một mặt đục** không chứng minh được khúc xạ nào — nhưng làm bản vẽ **trông** chặt chẽ. Nguy hiểm hơn là không có gì.
**Luật** — trước khi giao một mẫu khai là *chứng minh* một tính chất, kiểm tính chất đó **có xảy ra được** trên mẫu ấy không.

### M-45 · Hạ tham vọng cho vừa build hỏng là cách mất chữ ký sản phẩm êm ái nhất
Thấy một thứ không làm được điều nó khai ⇒ hỏi **"dựng sai à"** TRƯỚC khi hỏi *"khai sai à"*. Chỉ đổi tên sau khi đã thử dựng đúng một cách tử tế.

---

## Nhóm 6 · VẬN HÀNH NHIỀU AGENT

### M-50 · Kiểm MỐC trước khi phóng agent
Ba worktree bị cắt từ mốc lệch main **167 commit / 472 file**. Phiếu ĐÚNG với main nhưng SAI tại chỗ agent đứng. Giá của việc bỏ một lệnh git vài giây: ~770k token, kết quả bằng 0.
⇒ Ô **⓪b** trong mọi phiếu: `git rev-list --count HEAD..main`, lệch > 0 là DỪNG.

### M-51 · Va chạm giữa agent là VỐN TỪ, không chỉ TỆP
Hai phiên không đụng một tệp nào của nhau vẫn va: một phiên khai tử tên token trong khi phiên kia đang dựng mock dùng đúng tên đó. Khoá phạm vi phải khai được **cả định danh**, không chỉ đường dẫn.

### M-52 · Máy soi bị vô hiệu hoá còn tệ hơn không có
Một agent "đóng" được một máy soi bằng cách thêm chữ vào **chú thích** ở những tệp chưa từng dùng tính năng đó. Máy soi xanh, hành vi không đổi.
**Luật** — máy soi được đóng mà **hành vi không đổi** = một dây bẫy đã bị tháo ngòi.

### M-53 · Chủ dự án nói ngắn không có nghĩa đã chốt
Tôi đọc ký tự `"1"` thành *"chọn hướng ① mòng két"*. Suy diễn ý định từ một ký tự là quá đà.
**Ngược lại** — chủ dự án **mô tả bằng lời xong là ĐÃ CHỐT**; xác nhận lại thì ghi thẳng vào sổ dạng khẳng định rồi đi tiếp, **đừng dựng thành câu hỏi bắt bấm lần hai**. Chỉ hỏi khi hai cách đọc dẫn tới **hai việc khác hẳn nhau**.


### M-54 · ⭐ BẢN `CLAUDE.md` TRONG NGỮ CẢNH PHIÊN CÓ THỂ LÀ ẢNH CHỤP CŨ 🔴 HỆ THỐNG
**Bài kiểm khởi động nguội lượt 3 (23/08) tìm ra — không ai nghĩ tới trước đó.**
Phiên mới được **nhét sẵn** `CLAUDE.md` + `STATUS.md` + `00-CHOT.md` (112KB) vào system prompt. Bản
`CLAUDE.md` được nhét là **ảnh chụp CŨ**: nó mở đầu bằng *"Đọc @STATUS.md rồi @docs/00-CHOT.md
TRƯỚC TIÊN"* và **không có khối BỘ NẠP**, không nhắc `docs/control/` một chữ.
⇒ Phiên mới **bị đẩy vào đúng cái hố** trước khi kịp đọc bất cứ thứ gì. Sửa tệp trên đĩa **không**
sửa được bản đã nhét vào ngữ cảnh của phiên đang chạy.

**Thứ cứu được lượt 3:** dấu đóng *"ĐÂY KHÔNG CÒN LÀ CỬA VÀO"* đặt ở **dòng 1–11** của
`docs/CLAUDE.md` và `LATEST.md` — hai tệp cũ mà phiên nguội chắc chắn sẽ mở. Cơ chế chống mồ côi
chạy đúng như thiết kế: **không chặn được nó đi sai đường, nhưng kéo được nó về ngay khi vừa đi**.

**Hai luật rút ra:**
1. **Đầu phiên phải `Read` tệp `CLAUDE.md` THẬT trên đĩa**, đừng tin bản trong ngữ cảnh. Đây là
   M-05 (số chép lại ≠ phép đo) và M-06 (sai nguồn = kết luận sai) áp cho **chính khâu nạp phiên**.
2. **Dấu chuyển hướng phải đặt ở DÒNG ĐẦU của mọi cửa vào cũ**, không phải chỉ ở cửa vào mới.
   Ta không điều khiển được phiên mới bắt đầu từ đâu — chỉ điều khiển được **thứ nó gặp khi tới đó**.

⚠️ Còn một bẫy cùng họ chưa vá được: dòng 8 `STATUS.md` **vẫn ra lệnh** *"MỞ PHIÊN MỚI: đọc
LATEST.md trước"* dù đầu tệp đã đóng dấu — **dấu ở đầu tệp không vô hiệu hoá được câu lệnh ở giữa
tệp**. Đã gạch bỏ tại chỗ 23/08. Bài học: đóng dấu một tệp thì phải **quét cả tệp tìm câu lệnh còn
sống**, không chỉ dán một khối lên đầu.


### M-55 · 🔴 TỰ ĐO RỒI TỰ KHẲNG ĐỊNH NGƯỢC LẠI PHÉP ĐO CỦA MÌNH
**Ca 24/08, lỗi của MAIN, do phiên `interiorflow-9b` bắt.**

Tôi chạy `grep -c "dang-nhap" scripts/chup-man-duyet-mat.mjs` → trả về **`3`**.
Ở lượt tool **ngay sau đó**, tôi viết vào `IF-TOOLING-RECEIPT`: *"cờ `--dang-nhap` script không nhận"*.
Cờ đó có thật ở `:103`. **Số 3 nằm ngay trên màn, tôi viết ra số 0.**

**Đây KHÔNG phải các lớp lỗi đã có:**
· không phải M-05 (số chép lại) — tôi tự đo, dữ liệu mới tinh;
· không phải M-06 (sai nguồn) — nguồn đúng;
· không phải grep nói dối — grep đúng.
**Đây là lớp mới: dữ liệu đúng nằm trước mắt, kết luận viết ra là phủ định của nó.**

**Hậu quả không phải "một dòng sai".** Tôi đưa Hoà một lệnh "đã sửa" **đẩy mật khẩu lên dòng lệnh**
— đúng thứ docstring của script (`:100-101`) dựng ra để tránh (*"dòng lệnh còn bị lưu vào lịch sử
gõ"*). Sai của tôi **nguy hiểm hơn** cái sai tôi định sửa.

**Gốc bệnh:** `grep -c` trả **một con số trần**, không có ngữ cảnh. `3` và `0` trông giống nhau khi
mắt đang chạy nhanh và đầu đã có sẵn giả thuyết *"chắc cờ này không có"*. **Phép đo có xác nhận giả
thuyết hay không thì không quan trọng bằng việc tôi đã ngừng đọc nó.**

**LUẬT:**
1. **Câu hỏi "X có tồn tại không" thì CẤM dùng `grep -c`.** Dùng `grep -n` để **buộc mình nhìn thấy
   dòng thật**. Một con số cho phép mình đọc nhầm; một dòng mã thì không.
2. **Khẳng định phủ định ("không có" · "chưa từng" · "0 nơi dùng") phải kèm ĐẦU RA NGUYÊN VĂN** của
   lệnh đã chạy, dán vào ngay chỗ khẳng định. Không dán được ⇒ chưa được khẳng định.
3. **Sửa một lỗi an toàn thì kiểm cả bản sửa của mình có an toàn không.** Ở đây: mật khẩu trên dòng
   lệnh. Người sửa lỗi dễ tự miễn cho mình vòng kiểm mà họ vừa áp cho người khác (M-33).

**Cơ chế bắt được:** phiên khác đọc lại và bác. Không máy soi nào bắt nổi lớp lỗi này — nó nằm giữa
phép đo và câu văn, chỗ không có tệp nào để quét. ⇒ **Quyền bác ngược của agent/phiên là hàng rào
DUY NHẤT ở đây.** Giữ nó bằng mọi giá.

### M-56 · ⭐ "KHÔNG CÓ CONTROL BỌC ⇒ CỠ NHỎ NHẤT" LÀ MỘT LUẬT SAI — nó bóp TRANH thành ICON 🔴 HỆ THỐNG
**Ca 24/08, lỗi của MAIN, ba lane cùng vấp vì phiếu tôi viết sai.**

Foundation Sheet buộc cỡ icon theo **hạng điều khiển** (24→14 · 28→16 · 32/36→18 · 44/52→20).
Tôi viết vào phiếu một câu bổ sung nghe rất hợp lý: *"không tìm được control bọc ⇒ **14**"*.
Câu đó đúng cho icon nằm lọt trong dòng chữ chạy. Nó **SAI HOÀN TOÀN** cho một loại vật khác:
**glyph là NHÂN VẬT CHÍNH của một ô rỗng** — ô thả tệp · ô xem trước · thẻ chưa có ảnh · vòng quay
tải đứng giữa màn. Những vật đó **cố ý to**; chúng đang làm việc của một **TRANH**, không phải của
một icon gắn nút bấm. Chúng không có control bọc **vì chúng chính là nội dung**, không phải vì ai đó
quên bọc.

**Thiệt hại đo được** — 8 chỗ bị bóp: vùng thả tệp `MaterialImportWizard` **26 → 14** (mất hẳn tín
hiệu "thả vào đây", dù ô vẫn có trạng thái `dragOver`) · `form/shared.tsx` dropzone 22 → 14 ·
thẻ `CollectionPlus` **34 → 14** · ô xem trước `ItemThumb` 22 → 14 · hai vòng quay tải `Dashboard` 22 → 14.

**Vì sao nó lọt:** máy soi ĐẠT, `tsc` ĐẠT, `npm test` ĐẠT. Không cổng đo nào bắt được, vì mọi cổng
chỉ hỏi *"cỡ có thuộc {14,16,18,20} không"* — và 14 thì thuộc. Đúng M-01: máy đo được thang, không
đo được **vật này đang đóng vai gì**.

**Vì sao vẫn bắt được:** hai lane **tự khai nghi ngờ** thay vì im lặng làm cho xong — lane 4 viết
*"làm theo phiếu ĐÚNG TỪNG CHỮ, không theo bản năng giữ thị giác"*, và lane 5 **BÁC THẲNG** một ca y hệt
(`HaiTang.tsx` 30px trong ô 16:9). Hai lane, cùng một loại vật, **hai phán quyết ngược nhau** — chính
sự lệch đó là thứ lộ ra rằng luật của tôi thiếu một vế. ⇒ Ô ⓪ TIỀN ĐỀ (M-32) đã trả lãi lần nữa:
**agent được phép bác MAIN, và phải khai nghi ngờ kể cả khi vẫn làm theo.**

**LUẬT ĐÃ SỬA — ba vế, không phải hai:**
1. có control bọc ⇒ tra bảng hạng điều khiển;
2. icon nằm trong **dòng chữ chạy** ⇒ 14;
3. ⭐ glyph là **nhân vật chính của một ô** (thả tệp · xem trước · rỗng · đang tải · placeholder thẻ)
   ⇒ **NGOÀI PHẠM VI luật icon** — nó là tranh. Giữ nguyên cỡ, khai `soi-mien-tru` kèm lý do.

**Kiểm tái phát:** trước khi hạ cỡ một glyph, hỏi **"bỏ nó đi thì ô này còn gì không?"**
Còn ⇒ nó là icon. **Trống trơn ⇒ nó là TRANH, đừng đụng vào cỡ.**


### M-58 · 🔴 ĐỊNH DANH NGƯỜI GHI BẰNG **PID** LÀ HỎNG TỪ GỐC
<!-- 🔴 SỬA 28/08 — mục này TRƯỚC ĐÂY mang số `M-56`, TRÙNG với mục icon/tranh phía trên.
     Hai mục khác hẳn nhau cùng một mã, trong chính cuốn sổ dạy về định danh (M-25 · M-56-pid).
     Đổi thành `M-58` (M-57 đã dùng). Ai trích `M-56` trước 28/08 thì đang trỏ vào MỘT trong hai —
     phải đọc nội dung mới biết là mục nào. Đây là lý do M-24 tồn tại: con trỏ đứt thì tri thức chết. --> — pid LUÔN chết khi ai đó đi kiểm
**Ca 24–25/08. Lỗi của tôi, và nó là nguyên nhân của CẢ CHUỖI tranh chấp quyền ghi.**

M-25 dạy: cấm đại từ *"phiên này"*, phải là **định danh đo được**. Đúng. Tôi thi hành bằng cách ghi
`pid 29437 · ppid 25132` vào ô `NGƯỜI GHI HIỆN TẠI`, kèm cách kiểm `ps -p <pid>`.

**Cái pid đó là SHELL của MỘT lệnh Bash.** Nó chết ngay khi lệnh kết thúc. Lệnh Bash kế tiếp của
**cùng phiên đó** đã mang pid khác (đo được: 29437 → 59510), và `ppid` cũng đổi (25132 → 58988).
⇒ `ps -p 29437` **LUÔN LUÔN thất bại**, kể cả khi phiên đang sống khoẻ.

**Hậu quả thật:** một phiên Codex chạy đúng thủ tục tôi viết ra, `ps -p 29437` → không thấy,
kết luận *"Claude session pid 29437 — không còn sống, phiên đã dừng vì usage/service"*, rồi
tiếp quản. **Nó không làm sai gì cả** — nó thi hành đúng cách kiểm mà tôi để lại. Cái sai là
cách kiểm.

**Vì sao lỗi này sống dai:** nó **luôn cho ra câu trả lời đúng-về-hình-thức** ("phiên chết") nên
không ai nghi. Một cách kiểm luôn trả về cùng một kết quả thì nó không phải phép đo, nó là hằng số
đội lốt phép đo. Cùng họ với máy soi báo 0 mà không chứng minh đã quét (luật tự-chứng-minh của
`soi:foundation`), và với M-55 (tự đo rồi khẳng định ngược).

⚠️ Tôi **đã suýt bắt được**: chính tôi ghi chú *"ppid mới là định danh bền"*. Nhưng vẫn đặt `pid`
**đứng trước** trong ô — và người đi kiểm đọc thứ đầu tiên. **Biết một thứ dễ gây hiểu nhầm mà vẫn
để nó ở vị trí đập vào mắt trước thì coi như chưa biết.**

**LUẬT — định danh phiên phải là TÊN PHIÊN, không phải số hiệu tiến trình:**
1. Ô `NGƯỜI GHI HIỆN TẠI` ghi **tên phiên** (dạng `interiorflow-xx`, lấy bằng `ListAgents`).
   Tên bền suốt đời phiên; pid/ppid thì không.
2. Cách kiểm sống là **`ListAgents`**, KHÔNG phải `ps -p`. Tên không có trong danh sách ⇒ mới coi là
   không còn.
3. **Cấm ghi pid/ppid làm định danh chính.** Muốn ghi thì để trong ngoặc, sau tên, và **nói rõ nó
   phù du** — kẻo người sau lại đi `ps` rồi kết luận nhầm.
4. Mọi cách-kiểm ghi vào control plane phải tự trả lời: *"phép kiểm này có bao giờ trả về KHÁC
   không?"* Không bao giờ khác ⇒ **không phải phép kiểm**.


### M-57 · 🔴 ĐÓNG DẤU SUPERSEDED LÀ **HAI** VIỆC — làm một việc thì phản tác dụng
**Ca 26/08, phát hiện khi Hoà hỏi "Codex spec chỗ này thế nào".**

Ngày 23/08 ai đó đóng dấu `claude-home-living-canvas-v2.html` là SUPERSEDED **ngay dòng 3 của
chính tệp**, kèm cả diff sáu mục phải thừa kế. Làm rất kỹ. Nhưng **không cập nhật
`CLAUDE-DESIGN-CURRENT.md`** — chỉ mục vẫn ghi *"APPROVED TARGET CANDIDATE"* thêm **ba ngày**.

Một phiên Codex đọc **chỉ mục** — đúng thứ được lập ra để làm con trỏ chính thức — và spec cho
Hoà rằng v2 là target Home hiện hành. **Codex không sai. Chỉ mục sai.**

**Vì sao đây là lỗi TỆ HƠN không đóng dấu gì cả:** không đóng dấu thì có MỘT nguồn, cũ nhưng
nhất quán. Đóng dấu nửa vời thì có **HAI nguồn nói ngược nhau, và cả hai đều trông chính thức** —
người đọc không có cách nào biết bên nào mới hơn nếu không mở cả hai. Nửa vời **đắt hơn** bỏ mặc.

**Đây là lần THỨ BA cùng một họ trong ba ngày** (M-54 `STATUS.md` còn ra lệnh dù đầu tệp đã đóng
dấu · ô quản trị dùng đại từ · và ca này) ⇒ **HỆ THỐNG**, không còn là bất cẩn.

**LUẬT:** đóng dấu một artefact là superseded gồm **HAI** việc, làm trong CÙNG một lượt:
1. dấu **tại chỗ** trong chính tệp, kèm **DIFF** thứ kế nhiệm phải thừa kế;
2. cập nhật **MỌI CON TRỎ** trỏ tới nó — chỉ mục, bảng target, hàng đợi, `CLAUDE-DESIGN-CURRENT`.
Chỉ làm ① là **tạo ra một cái bẫy**, không phải dọn một cái bẫy.
📌 Ứng viên máy soi: quét tệp có dấu `SUPERSEDED` rồi đối chiếu mọi chỗ nhắc tên tệp đó.

### M-59
**PHÉP THỬ TỰ CHẤM MÙ — khi lỗi thổi phồng CẢ HAI VẾ thì tỉ lệ vẫn đẹp.**
Trả giá 29/08. Máy nhận tường: nghiệm thu đặt ra là *"số tường giảm mạnh · tổng chiều dài
gần như không đổi"* — chạy ra `972 → 262` và `1139 → 1129 m`, đạt cả hai vế. Nhưng Hoà phóng
to ảnh, nhìn một cái là thấy: **cái tưởng là một bức tường liền thật ra là 3–4 vật xếp đè**.
Chiều dài bị đếm nhiều lần — và vì **trước lẫn sau đều bị thổi như nhau**, phép thử "không
đổi" không thể phát hiện. Nó đo ĐÚNG cái nó đo, và mù đúng chỗ cần thấy.

**Cơ chế:** một phép thử so sánh TRƯỚC↔SAU chỉ bắt được lỗi mà bước đó **thêm vào**; nó không
bao giờ bắt được lỗi **đã có sẵn ở cả hai đầu**. Đó là lý do "tự chấm được, không cần mắt ai"
là câu nói **chỉ đúng một nửa** — nó đúng cho *hồi quy*, sai cho *nghiệm thu lần đầu*.

**Luật:** một máy sinh ra HÌNH HỌC thì lần đầu **bắt buộc phải vẽ ra và nhìn ở mức phóng to
một chi tiết**, trước khi báo bất kỳ con số nào. Vẽ toàn cảnh không tính — mặt bằng 189×70m
thu vào một ảnh thì tường 200mm mỏng hơn một điểm ảnh, nhìn cũng như không (đã xảy ra: bản vẽ
toàn cảnh đầu tiên Hoà bảo *"ko thấy rõ"*). Kèm theo: **tô mỗi đối tượng một màu riêng** —
thứ cần nhìn không phải hình dạng mà là **RANH GIỚI ĐỐI TƯỢNG**, mà ranh giới thì chỉ hiện ra
khi đổi màu.

**Liên quan:** [[M-01]] (NOT ASSESSED thay vì mở app ra xem) — cùng một bệnh, khác bề mặt:
tin vào thứ đo được thay vì thứ nhìn được.
