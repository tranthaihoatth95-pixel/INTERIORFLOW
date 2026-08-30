# IF · HIẾN PHÁP — luật bền, không diễn giải lại tuỳ tiện

`Plane: IF` · phân luồng: `docs/control/BOS-PHAN-LUONG-TRI-NHO.md`


> **Tệp này KHÔNG chứa trạng thái hiện tại.** Trạng thái ở `IF-CURRENT-STATE.md`.
> Phán đoán đã trả giá ở `IF-UXUI-OPERATING-MEMORY.md`. Ở đây chỉ có **luật**.
>
> Phân hạng bắt buộc khi ghi thêm: `[CHỐT]` · `[ĐANG CÓ]` · `[HƯỚNG]` · `[MỞ]` · `[LỊCH SỬ]`.
> Thứ bị thay phải ghi `THAY BỞI:` **tại chỗ** — cấm bỏ hoang (xem M-24).

---

## 1 · LUẬN ĐỀ SẢN PHẨM `[CHỐT]`

> **InteriorFlow là MỘT xương sống nghề nghiệp, không phải một bó ứng dụng nhỏ.**

Mọi thành phần thiết kế có **một danh tính chung**, được nhìn và dùng qua nhiều công đoạn
**mà không phải nhập lại, dịch lại hay dựng lại**.

**Lời hứa cốt lõi:** *một nguồn sự thật · nhiều hình thức sử dụng · con người quyết định cuối cùng.*

Một cái ghế đưa vào dự án: ở 2D là **ký hiệu** có kích thước và điểm neo · ở 3D là **khối** có vật
liệu · ở render là **asset** · ở BOQ là **một dòng khối lượng có mã** · ở Trình chiếu là **hình +
tên + thông tin thương mại** · ở tri thức dự án là **một lựa chọn có nguồn gốc và lịch sử**.
⇒ **Không phải sáu bản sao. Là sáu mặt của MỘT danh tính.**

**Phân vai không đổi:** con người sở hữu **ý định · phán đoán · phê duyệt**. AI **đề xuất · diễn
giải · tạo sinh**. Lõi tất định **kiểm chứng sự thật**.

⚠️ Hệ quả đã chốt: **kiểm tiêu chuẩn là việc của MÁY, không phải của AI** — tất định, 0 đồng, tức
thì, chạy 10 lần ra 10 kết quả giống nhau, dẫn được điều khoản. AI chỉ đứng ở **lớp góp ý**, và
góp ý **không bao giờ chặn**.

---

## 2 · QUẢN TRỊ `[CHỐT]`

| Vai | Sở hữu |
|---|---|
| **Claude Design** | **thẩm quyền DUY NHẤT** cho mọi bố cục người dùng nhìn thấy — mới hoặc đổi |
| **MAIN** | **người ghi sản xuất DUY NHẤT** — kiến trúc, state, routing, build, tích hợp, kiểm thử |
| **Hoà** | người duyệt mắt cuối. **Chỉ Hoà** được nâng CANDIDATE → APPROVED |

⛔ **MAIN KHÔNG BAO GIỜ được âm thầm bịa ra câu trả lời thị giác còn thiếu.**
Thiếu ⇒ ghi **DESIGN MISSING** rồi trả về Claude Design. Sản xuất lệch đích ⇒ so và sửa cho khớp.
Design System không diễn đạt nổi ⇒ đó là **vấn đề cấp hệ thống**, đưa lên Foundation.

**MỘT người ghi tại một thời điểm.** Nhiều lane song song thì khoá phạm vi — và khoá phải khai
được **cả định danh** (tên token/kiểu/lệnh), không chỉ đường dẫn (M-51).

---

## 3 · LUẬT UX CỐT LÕI `[CHỐT]`

Mọi lúc, người dùng phải trả lời được **tám câu** mà không phải đi tìm:

> Tôi đang ở đâu? · Tôi đang làm gì? · Cái gì đang được chọn? · Cái gì cần tôi? ·
> Tôi làm được gì tiếp? · Thứ này từ đâu ra? · Bấm cái này sẽ đổi gì? · Quay lại kiểu gì?

**Sáu luật nền, không thương lượng:**
1. **CON NGƯỜI TRƯỚC** — không bắt đầu từ component có sẵn, hình dạng DB, hay *"ta có sẵn nút gì"*.
2. ⭐ **KHÔNG PHẦN TỬ NÀO XỨNG ĐÁNG TỒN TẠI CHỈ VÌ CÓ DỮ LIỆU HOẶC CÓ CHỖ TRỐNG.**
3. **NỘI DUNG LÀ NHÂN VẬT CHÍNH** — nheo mắt nhìn, thứ đầu tiên đập vào phải là **việc của người
   dùng**. Nếu là sidebar · thanh công cụ · ô tìm kiếm · tường thẻ ⇒ **TRƯỢT**.
4. **LỘ DẦN** — bày đủ để quyết định, không đủ để choáng.
5. **CHỈ DỮ LIỆU THẬT** — không fixture, không `0/0`, không khung rỗng chờ nội dung, không tiến độ giả.
6. **LUÔN CÓ ĐƯỜNG QUAY LẠI** — undo · phiên bản · checkpoint · trước/sau · khôi phục.

**Cảm ứng là công dân hạng nhất.** Không tính năng quan trọng nào chỉ tới được bằng hover.

**Apple là THẤU KÍNH CHẤT LƯỢNG, không phải LỚP DA.** Hỏi *"Apple đang giải bài toán con người
nào?"* rồi *"IF giải bài đó cho KTS nội thất thế nào?"*

---

## 4 · MÔ HÌNH UX `[CHỐT]`

| Khái niệm | Là gì | KHÔNG phải là gì |
|---|---|---|
| **Canvas** | bề mặt sáng tạo, **nhân vật chính** | không phải nơi chứa dữ liệu riêng |
| **Sidebar** | **BẢN ĐỒ** | không phải bệ phóng, không đổi nội dung theo chặng |
| **Cửa sổ công cụ** (`ToolWindow`) | **XƯỞNG cho MỘT tác vụ** | không phải đồ đạc thường trực trên màn |
| **Stage/Chặng** | tiêu điểm & khung nhìn | không phải một ứng dụng riêng |
| **Vitals** | trí tuệ **đứng cạnh việc** | không phải chatbot toàn màn |
| **Ask/Tìm** | một cửa vào ngữ nghĩa tường minh | không phải đường duy nhất |

**Cây sở hữu:** `Project` → nhiều `Workspace` → mỗi Workspace nhiều `Canvas` + **MỘT** Project
Flow/Timeline xuyên suốt. Canvas = **bề mặt làm việc** · Workspace = **ngữ cảnh làm việc** ·
Project = **danh tính + sự thật + gia phả**. **Canvas không sở hữu sự thật canonical.**

**Ba nấc là ba CÔNG NĂNG, không phải ba cỡ.** Nấc to phải mang thứ nấc nhỏ **KHÔNG THỂ** có.
Che nấc to đi, **nấc nhỏ vẫn phải đứng được một mình**. Mục nào không có gì để thêm ⇒ **dừng ở hai
nấc**; ba nấc là **nhịp**, không phải **hạn ngạch**.

**Cái gì đã gọi là dùng chung thì phải THẬT SỰ dùng chung** — một sổ lệnh, một hệ token, một bộ
icon, một thang nhịp. Hai bản sao là bắt đầu phân kỳ (M-26).

---

## 5 · TRUNG TÍNH `[CHỐT]`
IF là **sản phẩm độc lập, toàn cầu** — không nhúng cứng thương hiệu của bất kỳ studio nào.
Mọi chỗ cần nhận diện phải đọc từ **Brand Kit của dự án đang mở**. Giao diện song ngữ VI/EN.

---

## 6 · CHỮ VIỆT `[CHỐT]`
Dấu chồng **mang nghĩa** ⇒ **cấm hoa toàn phần** cho chữ chạy · line-height phải tính cho dấu
chồng · cấm tracking âm kiểu tiếng Anh · **bộ chữ PHẢI phủ đủ tiếng Việt, kiểm bằng BẢNG MÃ**.
Phân biệt **chữ kỹ thuật** (`2400 × 750 mm` · `Ø25`) và **chữ chạy** (`Chiều cao 750 mm`).

---

## 7 · QUY TRÌNH BẮT BUỘC `[CHỐT]`

```
BẢN VẼ → HỢP ĐỒNG THIẾT KẾ → MÃ → APP THẬT → SOI BẰNG MẮT
```

**Thiếu mắt là chưa xong.** Tính bố cục từ số CSS rồi tuyên bố xong là **không hợp lệ**.

**"Xong" nghĩa là đủ 9 mục:** có canonical · có mã · ảnh app thật · sáng lẫn tối · bàn phím ·
giảm chuyển động · dữ liệu thật · so đích↔sản xuất · đã qua `if-design-review`.

**Cùng một lỗi lặp lại ⇒ nâng thành LUẬT / SKILL / TEST.** Không chữa bằng cách nhắc nhau cẩn thận.

---
---

# PHẦN II — NẠP TỪ CHỈ THỊ 23/08 (bản cuối của MAIN cũ)

## 8 · IF LÀ GÌ — định nghĩa chính tắc `[CHỐT]`

**KHÔNG phải:** app CAD · app render · app slide · app vật liệu · dashboard quản lý dự án ·
chatbot AI · một bó ứng dụng nhỏ.

> **IF là HỆ ĐIỀU HÀNH SÁNG TẠO / TẦNG RA-QUYẾT-ĐỊNH THIẾT KẾ cho công việc nội thất chuyên nghiệp.**

**XƯƠNG SỐNG NGHỀ NGHIỆP — một chuỗi, không phải nhiều app:**
```
Đề bài/Nguồn → Ý tưởng/Phác → Kỹ thuật → 3D/Thị giác → Quyết định → Vật liệu/Spec
→ Phối hợp → Trình bày → Soát duyệt → Bản sửa → Phát hành → Thi công/Công trường/Bàn giao
```

### HAI TRỤC — Hoà xâu chuỗi 30/08, **cả hai đều đã có, chưa ai viết quan hệ giữa chúng**

Đây là chỗ đã gây hiểu sai thật: phiếu `ban-do-nghien-cuu-chuan.md` viết *"ba chặng chính là ba
trạng thái của một việc"* — câu đó **gộp trục quy trình vào trục công cụ**, và làm mất đúng phần
Hoà nhấn. Nguyên văn anh:

> *"Ba chặng đó nếu được hiểu về mặt **công cụ** chính là **3 luồng sản xuất chính** để thiết kế.
> Còn nếu hiểu theo **chặng quy trình** thì **trước nó còn các bước khác, sau nó còn các bước
> khác** — và **không cái nào thiếu được** nếu hiểu theo quy trình."*

```
TRỤC CÔNG CỤ   ba luồng sản xuất:  2D  ·  3D  ·  TRÌNH BÀY
TRỤC QUY TRÌNH xương sống 12 bước, CHẠY XUYÊN QUA ba luồng đó — có bước TRƯỚC 2D
               (đề bài · ý tưởng) và bước SAU trình bày (soát duyệt · phát hành · thi công · bàn giao)
WORKSPACE      nơi hai trục gặp nhau: nó GIỮ NGỮ CẢNH và QUẢN LÝ QUY TRÌNH **qua** ba stage
```

**Bề mặt phụ trợ KHÔNG phải stage thứ tư.** Home quản lý · Dự án · Việc · Cổng · Sổ tay · Vật liệu
· Màu · Cảm hứng · Tệp · Chia sẻ — chúng phục vụ **các bước quy trình mà ba stage không mang**:
cộng tác, quản lý, tính BOQ, quản lý cấu kiện, hiểu cấu tạo, vật liệu. Hoà đặt chúng vào để
*"team work được phát huy tối đa, tối ưu cho tính chất ngành"*.
⇒ **Đo 30/08: 10/10 bề mặt này ĐÃ tồn tại trong app.** Cái thiếu chưa bao giờ là bề mặt — là
quan hệ giữa chúng với hai trục.

**Luật giao diện rút ra, và nó là phần khó:** mỗi stage phải quyết **cái gì DÙNG CHUNG, cái gì
TỐI ƯU RIÊNG**, và **cái nào chính cái nào phụ**. Vì phải nhồi nhiều thứ trông như không liên quan
vào một mặt công cụ, nên không quyết được hai câu đó thì ra một giao diện ôm đồm.

⚠️ **Nợ đã tự khai, đừng để nó trôi:** `docs/IF-KIEN-TRUC-OS.md:294` ghi *"Design Workflow 🟡 chỉ
3 chặng — chưa có Research · Moodboard tách riêng · Tender · Construction/Handover"*. Đó chính là
các bước **trước và sau** mà Hoà nói không cái nào thiếu được.

**Ba nguyên tắc:** một xương sống cho công việc · tự do và niềm vui cho người sáng tạo ·
trí tuệ cộng dồn cho tổ chức.

**Bốn câu về cách dựng hình:** dựng theo **ý định** · tinh chỉnh theo **hình học** ·
tạo sinh theo **mô tả** · **giữ lại công thức**. Ngữ nghĩa khi có thể, hình học khi buộc phải.
Nén phức tạp thành ý định **mà không giết khả năng sửa**.

**Phân vai:** AI *đề xuất · diễn giải · tạo sinh · xếp hạng · lập luận*. Người *ý định · phán đoán ·
phê duyệt · quyền tác giả*. Lõi tất định *hình học · ràng buộc · danh tính · sự thật · bản sửa*.
⛔ **AI KHÔNG BAO GIỜ âm thầm biến đổi sự thật canonical.**

## 8b · TRƯỚC KHI ĐỔI BẤT KỲ THỨ GÌ — cân lợi hại, chọn theo ĐƯỜNG DÀI `[CHỐT 30/08]`

> Hoà dạy 30/08: *"Làm gì cũng xác suất trước mặt lợi mặt hại của việc thay đổi. Cách nào đường
> dài lợi ích hơn thì đề xuất. Đây cũng là một trong những skill bạn nên ghi nhớ."*

Ba câu, hỏi **trước** khi sửa — không phải sau:
1. **Lợi ngắn hạn** của việc đổi là gì? Của việc **không đổi** là gì?
2. **Hại dài hạn** nếu không đổi — nó có **chắc chắn tái diễn** không?
3. Cách nào **không cần cổng canh** vì cấu trúc đã chặn? Cấu trúc thắng cổng, vì **cổng cũng có
   thể quên**.

**Ca thật cùng ngày, đo được:** bản đồ lane bị chép ra **hai** chỗ (`moc.mjs` + `bos-so-viec.mjs`)
và **lệch nhau sau đúng mười phút** — cầu thi hành tên mới trong khi màn 4173 vẽ tên cũ. Lệch bản
đồ ⇒ phiếu tới **sai vai** ⇒ kiểm chéo mất tác dụng, tức hỏng đúng thứ đắt nhất.
Chữa: **một nguồn** (`bos-so-viec.mjs` giữ, `moc.mjs` nhập vào). Không dựng cổng canh — vì một
nguồn thì **không lệch được**.

### NÂNG CẤP 30/08 — **XÁC LẬP TRỤC GIÁ TRỊ TRƯỚC KHI ĐÁNH GIÁ**

> Hoà: *"Đúng, nhưng thiếu. Những trường hợp ngoại lệ **không đúng không sai** — hệ thống chỉ **NÊU**,
> người dùng **TUỲ CHỌN**, **KHÔNG ÉP**. Và nếu báo thì **phải kèm lý do**."*

**Ca thật, cùng ngày.** Lane 05 báo: *"Neufert sai với người Việt — bếp 850–900 theo sách Âu là cao,
VN nên 800–850."* Đúng **một nửa**. Hoà bổ sung trục còn thiếu:

| trục giá trị | nói gì về chiều cao bếp |
|---|---|
| **nhân trắc học** | người VN thấp hơn TB Đức ~8–10 cm ⇒ **800–850** dễ thao tác hơn |
| **chuẩn thiết bị** | **đa số máy rửa chén và thiết bị bếp dựng theo chuẩn 900** ⇒ **900** hợp lý hơn cho đa số |

**Không trục nào sai.** Chọn 800 thì thiết bị chuẩn 900 không lắp vừa; chọn 900 thì thao tác mỏi hơn.
Đây là **đánh đổi có thật**, không phải lỗi cần sửa.

⇒ **Ba luật rút ra, áp cho MỌI đánh giá — của máy lẫn của agent:**
1. **Liệt kê TRỤC GIÁ TRỊ trước khi kết luận.** Một trục thì chưa đủ để nói "sai".
2. **Nêu kèm LÝ DO của từng trục.** Kết luận trần *"Neufert sai"* làm người đọc tưởng có bên đúng
   bên sai, trong khi thật ra là hai ràng buộc kéo ngược nhau.
3. **Hệ thống NÊU · người dùng CHỌN · KHÔNG ÉP.** IF là công cụ của người làm nghề, không phải
   trọng tài. Ngoại lệ **không đúng không sai** — máy bày ra đủ trục rồi lùi lại.

⚠️ Điều này đổi cả cách viết **cảnh báo trong sản phẩm**: một cảnh báo chỉ nêu kết luận mà giấu
trục lý do là **ép người dùng bằng cách giấu thông tin**.

⚠️ **Đổi tên lane thì phải đồng bộ BA chỗ**, thiếu một là lệch lại: ① sổ `bos-so-viec.mjs` ·
② tên phiên bên Codex · ③ tên phiên bên Claude (màn 4173 tự đọc từ ①).

⚠️ **`node -c` chỉ soi CÚ PHÁP, không soi import.** Cùng ngày nó báo xanh cho một tệp thiếu hẳn
dòng `import` — chỉ khi **chạy thật** mới lộ `ReferenceError`. Soi cú pháp không thay được chạy thử.

## 8c · HAI HỆ AGENT — ai nghĩ, ai làm `[CHỐT 30/08]`

> Hoà: *"Bạn là điều phối. Nếu vậy cần **một phiên code chính** — vì bên ChatGPT nó **không có
> phiên chính**, mình lập nó ra để **plan, tổng tham mưu, phân luồng** và **đưa phiếu cho bạn thi
> công**. Vì vậy bạn cần **nâng cấp tư duy** cho phù hợp, kèm **tool và quyền** tương ứng."*

```
CODEX   00 MAIN + 8 lane   plan · tổng tham mưu · phân luồng · viết phiếu · phản biện nhau
                            ⛔ KHÔNG thi công
                                   │  phiếu qua cầu
                                   ▼
CLAUDE  00 MAIN             nhận phiếu · phân rã · GIAO · kiểm chứng · báo cáo
                            ⛔ KHÔNG cầm bút mã sản xuất
        06 BUILD            PHIÊN CODE CHÍNH — viết mã · chạy test · chứng minh trên runtime
        03·04·05·07         chuyên môn, nhận việc từ MAIN
```

### Điều này SỬA một mâu thuẫn đã gây hỏng thật

Bàn `00` trước 30/08 ghi *"giữ bút mã sản xuất"* — tức MAIN vừa điều phối vừa thi công. Hệ quả đo
được trong một ngày: lane 00 tự làm việc của `04 DESIGN` (màu, wallpaper), của `06 BUILD` (cổng,
mã), rồi **quên mất vai điều phối** — 4 lane ngồi không trong khi MAIN ôm hết. Hoà phải nhắc.

⇒ **MAIN không cầm bút.** Việc của MAIN: *nhận phiếu → phân rã → giao đúng bàn → tự đánh thức →
kiểm chứng kết quả → báo cáo.*

### Ngoại lệ, có khai báo — nếu không thì luật này tự chặn mọi việc

MAIN được viết mã **chỉ** trong ba trường hợp, và phải nói rõ đang dùng ngoại lệ nào:
1. **Hạ tầng điều phối** — cầu, sổ việc, bàn, cổng canh quy trình. Đây là công cụ của chính MAIN.
2. **Một dòng chặn cả dây chuyền** — sửa để lane khác chạy được, rồi giao tiếp.
3. **Mọi lane thi công đều cạn** (hết lượt / offline) — làm thay, **ghi rõ là làm thay**.

⛔ Ngoài ba ca đó, MAIN thấy việc mã thì **viết phiếu**, không tự gõ.

## 9 · LUẬT DÙNG CHUNG `[CHỐT]`
> **CÁI GÌ ĐÃ GỌI LÀ DÙNG CHUNG THÌ PHẢI THẬT SỰ DÙNG CHUNG.**

**Hệ dùng chung:** App Shell · TopShell · Sidebar Map · Ask/Tìm · Vitals · Now Surface · Activity ·
Profile · hệ lệnh · hành vi ToolWindow · ngữ pháp icon · chữ · ngữ pháp chuyển động ·
focus/chọn/hover · ngữ pháp cảm ứng.

**Bề mặt chuyên nghiệp riêng:** Project · Sources · Design DNA · Library · 2D · 3D · Vật liệu ·
Visual Pipeline · Present · Review.

> **HỌC MỘT LẦN, LÀM VIỆC KHẮP NƠI.** Cấm dựng ngữ pháp tương tác khác nhau cho từng chặng.

## 10 · ⭐ SIDEBAR — TỪ VỰNG TRẠNG THÁI `[CHỐT — ĐÓNG MÂU THUẪN AUTO-HIDE]`
Hành vi **đã được kiểm chứng, CẤM viết lại để sửa thị giác.** Neo **52px**; bản đồ mở **NỔI ĐÈ**
lên nội dung, **không dịch toạ độ canvas**.

| Trạng thái | Do đâu | Tự thu? |
|---|---|---|
| **PEEK** | hover / thoáng qua | **ĐƯỢC** tự thu sau ân hạn ngắn |
| **OPEN** | bấm / bàn phím — **CÓ CHỦ Ý** | ⛔ **KHÔNG** được biến mất chỉ vì con trỏ rời đi |
| **PINNED** | ghim | thường trực |

Focus bên trong · đang kéo · đang đổi cỡ ⇒ **không được tự đóng**. Bề rộng cửa sổ **không bao giờ**
tự đóng một Map đang OPEN có chủ ý.

> **SUPERSEDES** — mâu thuẫn §6.1 (cấm tự thu theo bề rộng) ↔ §8 22/08 (tự thu khi rời chuột):
> **CẢ HAI ĐÚNG MỘT PHẦN.** Phân giải bằng **CHỦ Ý**, không bằng trigger. Câu hỏi *"giữ hay bỏ
> auto-hide"* nay **ĐÓNG** — giữ cho PEEK, cấm cho OPEN.

Thị giác đích: gọn · nổi · có chiều sâu không gian · tĩnh. **Không** phải menu app cao suốt màn,
**không** phải dải icon CAD, **không** phải bệ phóng.
Điều hướng hội tụ về: **Home · Projects · Design DNA · Sources · Library**. Cài đặt/Hồ sơ ⇒ vùng avatar.

## 11 · VITALS `[CHỐT]`
Trí tuệ **cạnh việc đang làm**, không phải chatbot ở chỗ khác. Kế thừa: dự án · workspace · chặng ·
vùng chọn · đối tượng · nguồn · hành động hiện tại. **Người dùng không phải kể lại ngữ cảnh.**

**KHÔNG phải:** thông báo · quản lý việc · app chat · thẻ chẩn đoán thường trực.
**Trạng thái:** `IDLE · PEEK · CONTEXT · DEEP`.
Mỗi tín hiệu có nghĩa phải lộ được: **CÁI GÌ · VÌ SAO · NGUỒN · ẢNH HƯỞNG · LÀM GÌ TIẾP**.
⛔ Không id nội bộ, không tiếng lóng lập trình.
⛔ **CALM là một KHẲNG ĐỊNH.** `401` / không truy được / không rõ ⇒ **không bao giờ** ánh xạ thành calm.
Không có tín hiệu đáng nói ⇒ **Vitals lùi ra**. Cấm bày một vòng tròn vô nghĩa để chứng minh mình tồn tại.

## 12 · TOOLWINDOW `[CHỐT]`
IF **không được kém mềm dẻo hơn** Photoshop / Blender / Rhino / AutoCAD / Figma.
Hỗ trợ: `MOVE · DOCK · UNDOCK · RESIZE · COLLAPSE · PIN · AUTO-HIDE · FOCUS · CLOSE · RESTORE · PERSIST`.
Trạng thái chính tắc: `COLLAPSED · NORMAL · FOCUSED`.
> **NGƯỜI DÙNG SỞ HỮU CÁCH BÀY.** IF được *đề xuất* bố cục tối ưu theo tác vụ; **người đè lên thì người thắng.**

**Workspace nhớ:** chặng · vùng chọn · camera · zoom · ToolWindow + vị trí + cỡ + trạng thái dock ·
tham chiếu · tác vụ/ngữ cảnh. ⛔ **Không bao giờ đẻ sự thật thứ hai.**

**Thích ứng theo tác vụ:** tác vụ đổi ⇒ tác vụ thành nhân vật chính, ToolWindow liên quan tiến lên,
thứ không liên quan lùi ra. ⛔ **Không xáo tung mọi thứ mỗi lần chọn một vật nhỏ.**

## 13 · TỔ CHỨC CÔNG CỤ `[CHỐT]`
`THẤY ĐƯỢC & THIẾT YẾU → THEO NGỮ CẢNH → FLYOUT → TOOLWINDOW → SÂU/TIÊU ĐIỂM`
Luật co theo bề rộng: `ĐẦY → ICON+NHÃN → ICON → NHÓM → THÊM`
⛔ **Cấm giải bài chật bằng: hàng thanh công cụ thứ hai/thứ ba · nhãn bé không đọc nổi · hàng chục icon.**
Bảng lệnh là **đường thay thế, không bao giờ là đường duy nhất**.

## 14 · HOME `[CHỐT]`
> Sứ mệnh: **NẮM TÌNH HÌNH VÀ ĐI VÀO ĐÚNG VIỆC.**

Mỗi vật trên Home phải trả lời được: *giúp người dùng HIỂU · BẮT ĐẦU · TIẾP TỤC · QUYẾT ĐỊNH ·
GIẢM CHUYỂN NGỮ CẢNH?* Không ⇒ **bỏ hoặc lùi ra**. **Widget rỗng thì BIẾN MẤT.**
⛔ Cấm bày: `0` · `—` · thẻ rỗng · ô nhập rỗng · dữ liệu giả · dự án giả · hoạt động giả · thời tiết
giả · vật liệu giả · cảm hứng giả.

**MỘT Home, NĂM TRẠNG THÁI dữ liệu thật** — là *trạng thái*, không phải năm app:
`A KHÔNG DỮ LIỆU · B QUAY LẠI/TIẾP TỤC · C ĐẦU NGÀY · D ĐANG LÀM · E CUỐI NGÀY`

**A · KHÔNG DỮ LIỆU** — được phép: Ambient Scene · Sidebar · TopShell · hiện diện Vitals · lời chào ·
**MỘT** hành động vào chính · có thể thêm một lối nhập/mở lặng lẽ.
⛔ Cấm: kệ dự án · resume · ghi chú nhanh · vật liệu của tuần · heatmap · thống kê năng suất · gallery giả.
**Phép thử:** *người ta có thấy dễ chịu khi để IF mở ở đây, không dự án, không việc gì đang chạy?*
Không ⇒ **sửa ambient/bố cục, ĐỪNG thêm widget để che chỗ trống.**

**B · TIẾP TỤC — trạng thái quan trọng nhất.** Có phiên dở thật ⇒ **việc đang làm thành NHÂN VẬT
CHÍNH**; ưu tiên liên tục (ngữ cảnh đang dừng trở thành trường môi trường). Lớp phủ tối thiểu:
dự án · tác vụ · sửa lần cuối · Tiếp tục · tín hiệu thật.
⛔ **Cấm nhét resume vào một thẻ bé tí giữa đám tạp nham.**

**AMBIENT SCENE SYSTEM** (gọi tên này, **không gọi "hình nền"**) — thuộc Design System. Ưu tiên
procedural/môi trường: tường/sàn/chân trời · ánh sáng trường · bóng · ấm/lạnh · chiều sâu · vật liệu.
Phải định nghĩa: vùng an toàn · tương phản · sáng/tối · khung giờ · giảm chuyển động · độ đọc.
> **Home CẢM THẤY thời gian. Home KHÔNG ĐỌC thời gian như một dụng cụ đo ánh sáng.**
> ⛔ Cấm quay lại: cung mặt trời · `05:00` · `20:00` · Kelvin · vạch khắc kỹ thuật.

**Lớp cá nhân** — luật cứng: **LIẾC MỘT CÁI + MỘT THAO TÁC NHANH.** Cấm dựng lại
Spotify/YouTube/Bloomberg/lịch bên trong IF. Dịch vụ chưa nối ⇒ **không có thẻ rỗng làm mục chính**.

## 15 · HAI LƯỢT `[CHỐT]` — cách hoàn thành sản phẩm
> **LƯỢT 1 · HỘI TỤ UX LÕI** — định hướng · thứ bậc · điều hướng · ngữ cảnh · tổ chức công cụ ·
> mềm dẻo workspace · dữ liệu thật · trạng thái · thuật ngữ · icon/chữ · bàn phím · cảm ứng ·
> trợ năng · gỡ legacy · liên tục đầu-cuối.
> **LƯỢT 2 · DELIGHT** — ambient tinh · G3 tinh · ánh sáng cục bộ · chuyển động nâng cao ·
> vi tương tác · cá nhân hoá · đánh bóng.

⛔ **Đừng chặn Lượt 1 để chờ:** ambient hoàn hảo · G3 nâng cao · micro-hover · hoa mỹ hiếm gặp.
⛔ **CẤM bắt đầu P4 khi P0/P1 còn hỏng về cấu trúc.**

**RÕ RÀNG TRƯỚC. DELIGHT SAU.**

## 16 · THỨ TỰ ƯU TIÊN `[CHỐT]`
```
P0 NỀN/ĐỊNH HƯỚNG   Foundation → App Shell → Sidebar → TopShell → Ask/Tìm → Vitals → Now Surface
P1 WORKSPACE         ToolWindow → Dock → Inspector → Toolbelt → hành động ngữ cảnh → nhớ bố cục
P2 BỀ MẶT LÕI        Home → Project → Sources → Library → Design DNA → 2D → 3D → Vật liệu
                     → Visual Pipeline → Present → Review
P3 CẮT NGANG         bàn phím · cảm ứng · co giãn · giảm chuyển động · thuật ngữ · trợ năng
                     · trạng thái dữ liệu thật · gỡ legacy
P4 DELIGHT           ambient · G3 · vi tương tác · cá nhân hoá · đánh bóng
```

## 17 · NGÂN SÁCH CLAUDE DESIGN `[CHỐT]`
> ⛔ **THÔI THIẾT KẾ 146 BẢN VẼ NHƯ 146 SẢN PHẨM.** Hội tụ về một **ngữ pháp trải nghiệm dùng lại được**.

Claude Design làm theo **LÔ HỆ THỐNG**: ① Foundation ② Shell ③ Workspace ④ Khuôn nội dung ⑤ Bố cục chặng.
Khuôn đã có ⇒ **DÙNG LẠI** — và khuôn nằm ở **`docs/mocks/`**, bản đang hiệu lực tra ở
**`docs/mocks/CLAUDE-DESIGN-CURRENT.md`**. (Câu "dùng lại" mà không nói kho ở đâu thì vô dụng —
đúng M-23: thiếu ĐƯỜNG DẪN chứ không thiếu tri thức.) Gọi Claude Design lại **chỉ khi**: ngữ pháp tương tác thật sự mới ·
hệ hiện tại không giải nổi · sản xuất lệch chứng minh hệ thiết kế chưa đủ.
⛔ Cấm đốt quota Claude Design để đổi padding lặt vặt.
**Tỉ lệ đích: ~70% thi công/hội tụ · ~20% Claude Design cho lỗ cấp hệ thống · ~10% ngoại lệ + duyệt cuối.**

## 18 · CHUỖI VÀNG `[CHỐT]` — hoàn thành sản phẩm bằng CÔNG VIỆC, không bằng ROUTE
```
Cold Open → Đăng nhập → Home → Tạo/Mở dự án → Nhập nguồn → Hiểu → Workspace
→ Design DNA/tham chiếu → 2D → chèn từ Library → 3D → Vật liệu → Visual Pipeline
→ Sửa có kiểm soát → Soát duyệt → Quyết định → Present/BOQ → Phát hành bản sửa
→ Khoá → Mở khoá đúng ngữ cảnh cũ → Tín hiệu học/DNA
```
Không dựng lại bằng tay · không đảo ốc xuất-nhập · **không fixture**.
> **CHUỖI VÀNG NÀY CHÍNH LÀ SẢN PHẨM.**

## 19 · MA TRẬN NGHIỆM THU `[CHỐT]`
Theo dõi **RIÊNG từng trục**: thiết kế · hợp đồng · thi công · chức năng · dữ liệu thật · trình duyệt
thật · khớp thị giác · định hướng · tương tác · mềm dẻo workspace · bàn phím · cảm ứng · co giãn ·
chuyển động · giảm chuyển động · thuật ngữ · trợ năng · gỡ legacy · đầu-cuối.
> **MỘT TRỤC XANH KHÔNG BAO GIỜ ĐƯỢC CHE MỘT TRỤC ĐỎ.**

## 20 · ĐIỀU KIỆN DỪNG `[CHỐT]` — khi nào ĐƯỢC hỏi Hoà
⛔ **KHÔNG hỏi** về: giãn cách · chọn icon · chữ thường ngày · bề rộng panel · co giãn thông thường ·
trạng thái tiêu chuẩn · chỉnh thị giác cục bộ. MAIN/Claude Design tự quyết bằng luật + bằng chứng.

**Ngoại lệ tường minh — KHÔNG phải "chỉnh thị giác cục bộ":** màu **nhận diện cấp hệ** (accent,
màu mang nghĩa, bộ chữ chính) · đổi tên khái niệm sản phẩm · bỏ/thêm một mục điều hướng cấp app.
Ba thứ này đi theo mục ③ bên dưới. Lý do: chúng không đảo được bằng một lượt sửa, và chúng
định nghĩa sản phẩm chứ không phục vụ một màn.

**CHỈ dừng khi:** ① quyết định phá huỷ / rủi ro dữ liệu ② riêng tư/mật khẩu/việc riêng của người
③ hai mô hình sản phẩm **đều hợp lệ** mà luật hiện có không phân xử được ④ triết lý sản phẩm lõi
chưa chốt ⑤ một trải nghiệm đã chín, sẵn sàng trình mắt.

⛔ **KHÔNG dừng sau mỗi đợt để hỏi.**

## 21 · G3 `[MỞ — CHỜ NGƯỜI]`
Quản trị G3 diện rộng **CHƯA CHỐT**. ⛔ **Đừng chặn việc UI khác vì G3.**

---

## 22 · CỔNG THẨM ĐỊNH LỜI KHUYÊN `[CHỐT 27/08]`

**Lời khuyên KHÔNG tự thành quyết định.** Mọi khuyến nghị — của MAIN, Codex, sub-agent hay người
review — phải đi qua `IF-ADVICE-VERIFICATION-GATE-001` trước khi trở thành quyết định bền hoặc
chạm sản xuất.

Protocol canonical: **`docs/control/IF-ADVICE-VERIFICATION-GATE.md`** (tệp DUY NHẤT, cấm sổ song song).

Năm hiện vật: `IF-DEC-*` quyết định · `EV-*` bằng chứng · `DISS-*` phản biện độc lập ·
`GATE-*` cổng thi công · `REC-*` biên nhận bền.

Ba câu là luật, thuộc lòng không cần mở tệp:
1. **Đồng thuận không phải bằng chứng.** Hai bên cùng gật mà cùng chưa đọc thì hai cái gật ấy
   cộng thành một sự tự tin, không cộng thành một bằng chứng.
2. **Không có `EV-*` thì chỉ được ghi `UNKNOWN`** — cấm nói thành fact.
3. **`PASS` chỉ do Quality tuyên, sau runtime proof độc lập.** MAIN/Codex không tự gọi `PASS`.

Bằng chứng phải đúng **PHẠM VI** câu hỏi: một `EV` mạnh vẫn vô dụng nếu nó trả lời câu khác.
