# HỢP ĐỒNG THIẾT KẾ — KHUÔN ĐIỀN

> **Không có hợp đồng thì không có thi công bề mặt nhìn thấy được.** (`SKILL.md §3`)
> Chép tệp này thành `docs/hop-dong-thiet-ke/<hệ>-<màn>-<ngày>.md` rồi điền.
> Ô nào chưa có câu trả lời thì ghi **`DESIGN MISSING`** — **cấm để trống, cấm ứng biến.**

---

## ⛔ LUẬT TỐI THƯỢNG CỦA HỢP ĐỒNG NÀY

**Thi công gặp một trạng thái mà hợp đồng CHƯA ĐỊNH NGHĨA ⇒ ghi `DESIGN MISSING` và TRẢ VỀ
Claude Design. CẤM TỰ ỨNG BIẾN.**

Đây không phải thủ tục. Đây là chỗ IF đã mất tiền nhiều lần:

- Bản vẽ Home có sẵn **11 ô** nên khung nào cũng kín. App thật chỉ có **3 ô có dữ liệu** ⇒
  lỗ thủng 234px + 480px trống dồn xuống đáy. **Hợp đồng không có ô RỖNG**, nên người thi
  công tự nghĩ ra một bố cục cho trạng thái ấy — và nghĩ sai.
- `01-CLINICAL-UI-AUDIT.md §B2`: **ba hành vi khác nhau** cho **cùng một** điều kiện *"chưa
  đăng nhập"* — vì không hợp đồng nào sở hữu ngữ nghĩa của trạng thái "không đọc được".

> **Người thi công tự lấp một ô trống trong hợp đồng KHÔNG PHẢI là chủ động — đó là một
> quyết định thiết kế được đưa ra bởi người không có thẩm quyền và không có ngữ cảnh.**

**Đường trả về:** ghi `DESIGN MISSING · <ô nào> · <câu hỏi cụ thể>` vào hợp đồng, báo MAIN,
MAIN chuyển Claude Design. Thi công **dừng ở đúng ô đó**, phần còn lại đi tiếp.

---

## ⓪ ĐỊNH DANH

| | |
|---|---|
| Hệ / màn | |
| Mã artefact thiết kế | |
| Phiên bản design system | |
| Trạng thái | `MISSING` / `BRIEFED` / `IN DESIGN` / `CANDIDATE` / `INTERNAL PASS` / `IMPLEMENTED` / `SUPERSEDED` / `REJECTED` / `FINAL HUMAN APPROVED` |
| Ngày · người soạn | |
| Vùng ghi của thi công | *(đường dẫn thư mục — ngoài vùng thì dừng và đề xuất)* |

⚠️ **Chỉ Hoà mới được đặt `FINAL HUMAN APPROVED`.** MAIN và Claude Design **không tự phong**.

---

## ① VIỆC CON NGƯỜI 🔴 *ô này điền TRƯỚC MỌI Ô KHÁC*

> Ô này không được điền sau. Điền sau nghĩa là bố cục đã có rồi và ta đang đi tìm lý do
> biện hộ cho nó.

| | |
|---|---|
| Người này là ai | |
| Họ đang cố làm gì | |
| Họ vừa từ đâu tới | |
| Họ sẽ đi đâu tiếp | |
| **Thứ gì XỨNG ĐÁNG được chú ý lúc này** | |
| **Thứ gì được phép biến mất** | |
| Việc gì lặp lại thường xuyên | |
| Việc gì nguy hiểm / không hoàn tác được | |
| Việc gì làm đứt mạch sáng tạo | |

**Bảng từng vật** — mỗi vật nhìn thấy được một dòng. Cột 2 không viết được thành **một câu**
thì vật ấy **không lên màn**:

| Vật | Phục vụ VIỆC GÌ của con người | Bỏ đi thì mất gì |
|---|---|---|
| | | |

*(Đây là bảng đã bắt được 4/7 widget vô nghĩa trên Home 23/08 — xem
`examples/BAD/home-tuong-the-23-08.md`.)*

---

## ② NHÂN VẬT CHÍNH

| | |
|---|---|
| **Đúng MỘT** nhân vật chính là gì | |
| Vì sao nó, không phải thứ khác | |
| Nó chiếm bao nhiêu phần màn (số) | |
| Nó nổi bật bằng **CHẤT LIỆU** gì | *(không được chỉ bằng kích cỡ)* |
| Thứ hạng nhì là gì, và nó **kém hơn ở điểm nào** | |
| Vật nào **không có vỏ** | |

⚠️ **To hơn không có nghĩa quan trọng hơn nếu chất liệu y hệt.** Thứ bậc là quan hệ **chất**
trước, quan hệ **cỡ** sau.

---

## ③ GIẢI PHẪU

Liệt kê mọi vùng, từ ngoài vào trong. Mỗi vùng: tên · vai · nội dung · ranh giới.

| Vùng | Vai | Chứa gì | Ranh giới với vùng cạnh |
|---|---|---|---|
| | | | |

| | |
|---|---|
| **Số dải chrome ngang trên canvas** | *(trần: 2 — muốn 3 phải nêu dải nào biến mất)* |
| Panel nào thu/mở được | |
| Trạng thái thu/mở có **NHỚ** giữa các phiên không | *(bắt buộc: có)* |
| Có auto-hide không | *(bắt buộc: KHÔNG)* |

---

## ④ LƯỚI

| | |
|---|---|
| Số cột · số hàng | |
| **Cột có CỐ ĐỊNH không** | *(cố định + nội dung mềm = lỗ thủng — ca Home 23/08)* |
| Nội dung ít hơn dự kiến thì lưới làm gì | |
| Ô có **co theo ruột** không | *(⛔ cấm `h-full` trong ô lưới)* |
| Widget khai bằng **số ô** hay px | *(bắt buộc: số ô — px không xếp lại được trên tablet/điện thoại)* |
| Cỡ ô có sẵn | *(vd 1×1 · 2×1 · 2×2 — bộ đóng, không kéo giãn tự do)* |
| Màn rộng thêm thì **khoảng âm** lớn thêm hay **thẻ** dãn thêm | *(bắt buộc: khoảng âm)* |

---

## ⑤ GIÃN CÁCH

Thang: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80`.
Thứ bậc nói bằng **bậc**: 4–8 nội bộ · 12–16 nhóm · 20–32 mục · 40+ vùng lớn.

| Chỗ | Token | Giá trị |
|---|---|---|
| | | |

⛔ Cấm số ngoài thang. Cần số mới ⇒ `DESIGN MISSING`.

---

## ⑥ CHỮ

| Chỗ | Token | Cỡ | Cân nặng | Chiều cao dòng | Giãn chữ | **Chữ hoa?** |
|---|---|---|---|---|---|---|
| | | | | | | |

| | |
|---|---|
| **Tổng số cỡ chữ trên màn** | *(đếm. 4 → 10 là **tích tụ**, không phải phong phú — `01-CLINICAL-UI-AUDIT §B4`)* |
| Chữ Việt: có chỗ nào **hoa toàn phần** không | *(bắt buộc: KHÔNG. `LUAT-CHU-VIET-7.1.23`, 31/07 — dấu chồng mang nghĩa)* |
| Bỏ hoa thì đã hạ `letter-spacing` chưa | *(giãn chữ sinh ra để đỡ chữ hoa; giữ giãn mà bỏ hoa ⇒ chữ rời rạc)* |
| Có chữ **xoay dọc** không | *(chữ Việt xoay dọc mất đường chân chữ — cần lý do rất mạnh)* |
| Nhãn nào > 12 từ | *(`SPEC-NGON-NGU-CHI-DAN`: ≤12 từ, hành động trước)* |

🔴 **Thang chữ chính tắc chưa tồn tại** (`SKILL.md §6`: OWED BY CLAUDE DESIGN).
**MAIN không được tự chế.** Cần một cỡ chưa có ⇒ `DESIGN MISSING`.

---

## ⑦ CHẤT LIỆU

| Bề mặt | Bậc `G0`/`G1`/`G2`/`G3` | Lý do (theo **NGHĨA**, không theo kích thước) |
|---|---|---|
| | | |

| | |
|---|---|
| **Có mấy vật mang G3** | *(phân bổ đã chốt: `Vào xưởng` · thấu kính segmented đang chọn. Thêm ⇒ `DESIGN MISSING`)* |
| G3 dựng **ba tầng** chưa | phim màu mỏng ở đáy · khối kính trong · mép |
| **Phép thử rìa/tâm** | *rìa phải ĐẶC hơn tâm, đo trong **oklab**; bằng nhau ⇒ TRƯỢT* |
| Có hàng **CỠ THẬT** trong bản vẽ chưa | *(bắt buộc — bản phóng to là để SOI, không để DUYỆT)* |
| Có quầng sáng ngoài / neon / nhựa sữa / gel không | *(bắt buộc: KHÔNG. G3 zero-glow vẫn là G3)* |
| Có lưới/sọc thử khúc xạ lọt vào sản xuất không | *(bắt buộc: KHÔNG — F-14)* |
| Nền/ambient: **chênh sáng góc↔tâm đo được** | *(số. "đã bật" **không** phải bằng chứng — Home chênh 3 điểm sáng và vô hình)* |

---

## ⑧ ICON

| Chỗ | Loại | Nguồn | Nhãn |
|---|---|---|---|
| | | | |

**Bảy loại — mỗi loại một luật riêng, đừng gộp:**

| Loại | Luật |
|---|---|
| **Icon giao diện** (kính lúp · bánh răng) | **luôn có nhãn** (NT-8) |
| **Ký hiệu nghề** (ISO: cửa · tường · cầu thang) | KTS đọc được sẵn; toolbar không bắt buộc nhãn. 🔴 **IF CHƯA DỰNG** — toolbar hiện 11/11 lucide |
| **Icon nén tin** (🕐 2 ngày · 📐 78 m²) | **luôn kèm SỐ** — số mang tin, icon chỉ nói *số này là số gì* |
| **Hình minh hoạ thao tác** | **chỉ sống trong ô giải nghĩa**; ⛔ CẤM làm nút |
| **Dấu trạng thái** (chấm · vạch · quầng) | **bắt buộc kèm nhãn chữ** — màu không là kênh duy nhất |
| **Nhãn loại tệp** (`dwg` · `idfc`) | là **NỘI DUNG**, không phải giao diện; được dùng màu riêng |
| **Ảnh đại diện người** | không thay bằng chữ; có đường lùi; xếp chồng "+N" |

| | |
|---|---|
| Icon lucide / tổng | *(mục tiêu 100%. Đo 22/08: **không màn nào** đạt)* |

---

## ⑨ THÀNH PHẦN

| Thành phần | Primitive dùng lại | Đường dẫn | Mới? |
|---|---|---|---|

⚠️ **Sửa ở primitive, đừng vá ở nơi dùng.** Một chữ `uppercase` trong `WidgetCard` đẻ ra
**6 nhãn hoa** trên màn.

⚠️ Thành phần **mới** phải qua `[Đ2] nhìn vào trong trước`: đã tìm gì · primitive gần nhất ·
vì sao dùng lại / nối / mở rộng đều không đủ.

---

## ⑩ TRẠNG THÁI 🔴 *phải ĐỦ HỌ, không được chỉ vẽ trạng thái đẹp*

| Trạng thái | Trông thế nào | Nói gì | Làm gì tiếp |
|---|---|---|---|
| mặc định | | | |
| rê chuột | | | |
| focus bàn phím | | | |
| đang bấm | | | |
| đang chọn | | | |
| **mờ / không đủ điều kiện** | | **LÝ DO thành câu** | **LỐI RA** |
| đang tải | | | |
| **rỗng — chưa có dữ liệu** | | | |
| **rỗng — ÍT HƠN DỰ KIẾN** 🔴 | | | |
| **lỗi — đọc thất bại** | | | |
| **không rõ / không đọc được** 🔴 | | | |
| chỉ đọc / không có quyền | | | |

🔴 **Ba dòng đánh dấu là ba chỗ IF đã trả giá:**

- **rỗng-ít-hơn-dự-kiến** → bản vẽ 11 ô, app 3 ô ⇒ lỗ 234px.
- **không rõ / không đọc được** → `F-02` FALSE CALM: `calm` **không phải** im lặng, nó là lời
  khẳng định *"đã kiểm, không có gì cần chú ý"*. Đọc 401 ⇒ tiền đề đã mất.
  **Tuyệt đối không map 401 / tiền đề hỏng / không khả dụng → calm.**
- **mờ** → lý do phải đi bằng `aria-describedby` + phần tử ẩn, **KHÔNG** bằng `title`
  (`title` câm trên cảm ứng; `<button disabled>` không nhận focus, Tab bỏ qua hẳn).

---

## ⑪ CO GIÃN

| Khổ | Bố cục | Cái gì rơi ra | Cái gì gộp lại |
|---|---|---|---|
| ≥1440 | | | |
| 1100–1440 | | | |
| tablet | | | |
| điện thoại | | | |

⚠️ Widget khai bằng **ô**, không bằng px — đó là **điều kiện** để một widget chạy được trên
cả ba nền, không phải chuyện thẩm mỹ.

---

## ⑫ DESKTOP · CON TRỎ

| | |
|---|---|
| Chuột phải | |
| Shift-click · Ctrl/⌘-click | |
| Kéo khoanh vùng | |
| Kéo-thả từ Finder | |
| Rê: trễ bao nhiêu ms, kiểu gì | *(tức thì / trễ / ramp)* |
| 5 token mật độ (`--tap`/`--row`/`--gap`/`--pad-card`/`--fs-ui`) | *(`globals.css:105`)* |

---

## ⑬ BÀN PHÍM

| | |
|---|---|
| Thứ tự Tab | |
| Phím tắt (đọc từ **`lib/commands/registry.ts`**, không gõ tay) | |
| Phím tắt có **hiện trong menu / ô giải nghĩa** không | |
| Esc làm gì | |
| Enter làm gì | |
| Mũi tên làm gì | |
| **Kéo-thả làm được bằng bàn phím không** | *(bắt buộc: có — chọn → mũi tên dời → Enter thả)* |
| Vòng focus thấy được ở cả hai theme | |

🔴 **Một lệnh, một sổ.** IF đang có **5 sổ lệnh song song** và phím phân kỳ thật:
Xoay `RO`/`RO`/**`Q`** · Chép `CO`/`CO`/**`D`** · Đo `DI`/`DI`/**`T`**.
Hợp đồng mới **không được** đẻ sổ thứ sáu.

---

## ⑭ CẢM ỨNG

→ `checks/touch-checklist.md`

| | |
|---|---|
| Nhấn giữ: ms · độ trượt cho phép | *(chuẩn hiện có 500ms / 8px — nhưng nó đang là hằng số **của Tooltip**, chưa tách thành cử chỉ chung)* |
| Thứ gì **chỉ hiện khi rê** | *(⛔ cảm ứng không có rê — phải có đường thứ hai)* |
| Vùng chạm ≥44px | |
| Cử chỉ có đụng cử chỉ hệ điều hành không | |

---

## ⑮ CHUYỂN ĐỘNG

| Chuyển | ms | Đường cong | Từ đâu mở ra |
|---|---|---|---|

Nhịp mặc định (`IF-MOTION-VISUAL-LAW.md`): rê 100–160 · lộ ra 140–200 · kệ 180–260 ·
đổi stage 240–380 · morph 300–700.

| | |
|---|---|
| **Mở ra TỪ TÂM/NGUỒN của chính nó** chưa | *(nút → viên nang nở; thẻ → inspector từ vị trí thẻ. **Cấm teleport**)* |
| Morph có **giữ danh tính** không | *(cùng một vật nở ra, không cắt cứng)* |
| `prefers-reduced-motion` làm gì | *(bắt buộc — thứ chạy vô hạn là thứ **đầu tiên** phải tắt)* |
| Ánh sáng có **mang trạng thái** không, hay trang trí | *(trang trí ⇒ **cấm**)* |

---

## ⑯ DỮ LIỆU

| Trường | Nguồn thật (`tệp:dòng`) | **Đã nối chưa** | Chưa nối thì màn làm gì |
|---|---|---|---|
| | | ✅/❌ | |

🔴 **Ô "đã nối chưa" là bắt buộc.** Bản vẽ có quyền vẽ dữ liệu chưa tồn tại, **không có quyền
im lặng về việc đó**. Không có cột này thì bản vẽ đẹp và app rỗng — `F-04`.

⛔ **Không đẻ nguồn sự thật thứ hai** vì một màn muốn dữ liệu cho tiện.

---

## ⑰ RỖNG

| | |
|---|---|
| Không có dữ liệu nào ⇒ | |
| **Ít hơn dự kiến ⇒** 🔴 | |
| Phần dư đi đâu | *(bắt buộc: **trả về cho nền**, không phình thẻ, không lấp widget)* |
| Trạng thái rỗng **làm được việc tại chỗ** chứ | *(luật X2: cấm *"sang chặng kia làm rồi quay lại"*)* |
| Có bịa nội dung để lấp không | *(bắt buộc: KHÔNG)* |

---

## ⑱ LỖI

| Ca | Nói gì (nguyên văn) | Lối ra | Dữ liệu người dùng vừa nhập có giữ không |
|---|---|---|---|

🔴 **Mất im lặng tệ hơn lỗi thấy được** — người dùng bỏ đi mà tưởng đã lưu (`F-10`).
Mọi nhánh lỗi phải **nêu nguyên nhân** và **trả lại nguyên văn** thứ họ vừa gõ/nói.

⛔ Bịa % tiến trình khi không đo được. Không đo được ⇒ dạng chạy **vô hạn, KHÔNG có số**.

---

## ⑲ TRỢ NĂNG

| | |
|---|---|
| Tương phản chữ (số, đo **tại chân chữ**, không trung bình cả thẻ) | |
| Tương phản thành phần phi-văn-bản (≥3:1) | |
| Thao tác nào **chỉ làm được bằng chuột** | *(bắt buộc: không cái nào)* |
| Màu có là kênh **duy nhất** cho tin quan trọng không | *(bắt buộc: không — phải kèm chữ / hình dạng)* |
| Nhãn cho trình đọc màn hình | |
| Vùng động (`aria-live`) | |
| Vòng focus thấy được ở **cả hai** theme | |
| Đã thử bằng **bàn phím thật** chưa | *(🔴 "có trong mã" **không bằng** "tới được người dùng")* |

---

## ⑳ MAIN KHÔNG ĐƯỢC ĐỔI GÌ 🔴

Liệt kê **tường minh**. Không liệt kê ⇒ MAIN sẽ đổi, không phải vì cố tình mà vì phải chọn
một cái gì đó.

| Thứ | Vì sao khoá | Muốn đổi thì |
|---|---|---|
| | | `DESIGN MISSING` → Claude Design |

Khoá mặc định, luôn áp: **thang bo góc** (6/10/14/20 + `--r-full`) · **bo đồng tâm**
(`rInner = max(4, rOuter − pad)`, chỉ khi `pad ≤ 8`) · **màu mang nghĩa** (đỏ sai chuẩn ·
vàng cần xem lại · xanh đạt) · **một màu nhấn** · **luật ánh sáng chỉ mang trạng thái** ·
**nền và màu chữ**.

> **MAIN thi công. MAIN không thiết kế lại trong lúc gõ mã.** Khuôn cấm là: xin một bản vẽ →
> liếc qua → lặng lẽ nghĩ ra thứ khác trong CSS.
> MAIN **được** quyết chi tiết kỹ thuật **không** đổi bố cục nhìn thấy được hay ý định tương tác.

---

## ㉑ CHUỖI GIA PHẢ — không được đứt

`ARTEFACT THIẾT KẾ → HỢP ĐỒNG → PRIMITIVE → THÀNH PHẦN SẢN XUẤT → CHỦ SỞ HỮU LÚC CHẠY →
TEST → CHỨNG CỨ TRÌNH DUYỆT THẬT`

| Mắt xích | Đường dẫn / mã |
|---|---|

Không bản vẽ mồ côi. Không mã nhìn-thấy-được mồ côi.

---

## ㉒ PHÉP THỬ ĐỦ

> **Nếu hai người thiết kế có nghề đọc hợp đồng này và dựng ra hai bố cục KHÁC NHAU nhìn thấy
> được, thì nó CHƯA phải một hợp đồng.**

| | |
|---|---|
| Ai đã đọc thử | |
| Chỗ nào họ hiểu khác nhau | |
| Đã siết chưa | |

---

## ㉓ KÝ

| | Ai | Ngày |
|---|---|---|
| Soạn | | |
| Claude Design duyệt | | |
| MAIN nhận | | |
| **Hoà duyệt mắt** | | |
