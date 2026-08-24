# TRỤC NHÓM C · NGỮ PHÁP THỊ GIÁC

Bảy trục. Máy soi được **một phần** (đã ghi ở mỗi trục) — phần còn lại là mắt.

---

## C1 · CHỮ

**CÂU HỎI:** Chữ có tuân thang, và có tôn trọng tiếng Việt không? — CÓ / KHÔNG

**Máy:** `npm run soi:foundation` (thang chữ). **Mắt:** đếm cỡ chữ riêng biệt trên ảnh.

**TRƯỢT NGAY:**
- **CHỮ HOA TOÀN PHẦN** — cấm tuyệt đối (`LUAT-CHU-VIET-7.1.23-2026-07-31.md`).
  Dấu tiếng Việt chồng lên nhau mang **nghĩa**; hoa toàn phần giết dấu.
  **Ca thật 23/08: 6 nhãn HOA trên Home** — luật có từ 31/07, không máy nào canh.
- `line-height < 1.5` cho chữ Việt · **tracking âm** · nén chữ theo chiều ngang.
- Thang trôi: đo được **11 cỡ chữ** ở Files và Library (`01-CLINICAL-UI-AUDIT.md` B4), vỏ chung
  chỉ 4 ⇒ chênh gần 3 lần. **Không phải thang, mà là tích tụ.**

**CÁCH ĐO thang trôi:** đếm số cỡ chữ phân biệt được trên một màn.
`≤5` đạt · `6–8` PARTIAL (H4) · `≥9` trượt (H3, vì nó chạm nhiều màn).

⚠️ Thang chữ chính xác (family/size/weight/line-height/tracking) hiện **OWED BY CLAUDE DESIGN**
(`if-design/SKILL.md` §6). Chưa có ⇒ chấm **tính nhất quán nội bộ** và luật chữ Việt, **không**
chấm theo con số chưa ban hành, và ghi vào ⑦b.

---

## C2 · ICON

**CÂU HỎI:** Toàn màn có **một** ngữ pháp icon không? — CÓ / KHÔNG

**Máy:** `soi:foundation` (nguồn · cỡ · nét). **Đo được:** không màn nào 100% lucide —
Settings **65/75** (10 svg ngoài hệ), 2D 103/108, vỏ chung **4/8 = một nửa** ngoài hệ
(`01-CLINICAL-UI-AUDIT.md` B3, chạm **13/13** bề mặt ⇒ **lỗi hệ thống, H3**).

**Mắt kiểm bốn thứ máy không thấy:** nét có đều không · cỡ quang học có bằng nhau không (icon
tròn phải to hơn icon vuông một chút mới *trông* bằng) · đặc/rỗng có theo luật không · trạng thái
active/selected/running/disabled có phân biệt được không.

**Bảy loại "icon" — đừng lẫn** (chốt 16/08, mỗi loại một luật):
icon giao diện (**luôn có nhãn**, NT-8) · ký hiệu nghề (KTS đọc sẵn) · icon nén tin (**luôn kèm
số**) · hình minh hoạ (**chỉ sống trong ô giải nghĩa, CẤM làm nút**) · dấu trạng thái
(**bắt buộc kèm nhãn chữ**) · nhãn loại tệp (là nội dung, được dùng màu riêng) · ảnh đại diện người.
Báo cáo phải gọi đúng loại — nói "icon" trần là chấm mù.

⚠️ Ngữ pháp icon IF hiện **MISSING** (`if-design/SKILL.md` §7). Chấm được: **trộn nguồn** và
**bất nhất nội bộ**. Không chấm được: có đúng "chuẩn IF" không — chuẩn chưa tồn tại, ghi ⑦b.

---

## C3 · CHẤT LIỆU

**CÂU HỎI:** G0–G3 có dùng đúng theo **nghĩa**, không theo kích cỡ, không? — CÓ / KHÔNG

**Máy:** `soi:foundation` (vật liệu) + `docs/mocks/LUAT-VAT-LIEU-KINH-G0-G3.md`.

| Nấc | Dùng cho |
|---|---|
| G0 ambient/matte | trường lớn, nền, vùng bao canvas |
| G1 kính môi trường phẳng | sidebar nổi, cửa sổ công cụ tiện ích, điều khiển thoáng qua |
| G2 kính phẳng đang hoạt động | đang chọn / đang focus |
| G3 kính quang học hiếm | **chỉ** hành động chữ ký |

**TRƯỢT:**
- **Cường độ theo kích cỡ thay vì theo nghĩa** — widget to nên tô kính đậm ⇒ sai luật.
- **Kính chồng kính** — panel kính lồng trong chrome kính (luật K4 02/08: panel kính nổi **phải
  portal ra ngoài**; ca thật: dropdown xuyên thấu).
- **Kính làm RUỘT** — kính là **VỎ**, nội dung bên trong phải ĐẶC (chốt 01/08 + 16/08).
- **G3 kèm glow** — cấm outer glow · neon halo · emissive bloom · quầng tím · nhựa đục.
  *G3 với zero glow vẫn là G3.*
- **Kính quá trong ở chỗ nhiều chữ** — tương phản chữ chạy theo từng tấm ảnh nền ⇒ không kiểm
  được ⇒ hỏng đúng chỗ a11y bảo vệ. Điểm nghiệm thu: **đo tương phản tại CHÂN CHỮ**, không đo
  trung bình cả thẻ.

**Ba tầng ánh sáng, cấm lẫn** (chốt 16/08): ①kính nhận sáng = *chất liệu* (luôn) ·
②quầng sáng viền **đứng yên** = *trỏ vào được* (hover) · ③viền **chạy** = *đang chạy* (render).
Nhìn phát phải phân biệt được ba thứ; lẫn ⇒ trượt.

---

## C4 · CHUYỂN ĐỘNG

**CÂU HỎI:** Mỗi chuyển động có **trả lời một câu hỏi** không? — CÓ / KHÔNG

Câu hỏi hợp lệ: cái này từ đâu ra · nó đi đâu · cái gì đổi · cái gì gây ra · cái gì đang chạy.
Không trả lời câu nào ⇒ **trang trí** ⇒ trượt (`if-design/SKILL.md` §8: *motion is information*).

**CÁCH ĐO** (cần ảnh trước/sau hoặc mô tả thao tác — không có thì ghi **CHƯA CHỨNG MINH**):
- **FROM THE CENTER** (luật hình học 20/08): mặt phẳng mở ra **từ tâm/nguồn của chính nó** —
  nút → capsule nở tại chỗ; card → inspector mọc từ vị trí card. **Teleport ⇒ trượt.**
- **MORPH GIỮ DANH TÍNH**: cùng một vật nở ra, **không hard-cut** sang vật khác.
- Nhịp: micro 100–160 · reveal 140–200 · shelf 180–260 · stage 240–380 · morph 300–700ms
  (`IF-MOTION-VISUAL-LAW.md`, **đè** dải cũ của `SPEC-APPLE-MOTION-MATERIAL` khi vênh).
- `prefers-reduced-motion`: chuyển động **lặp vô hạn là thứ ĐẦU TIÊN phải tắt**, thay bằng dấu
  hiệu tĩnh. Không có nhánh này ⇒ trượt.

**Thanh tiến trình — luật riêng, không ngoại lệ** (chốt 16/08): việc nào đang chạy cũng phải có
thanh. **Hai loại phải nhìn-là-phân-biệt:** đo được → có % và thời gian còn lại · không đo được →
dạng **khác hẳn**, chạy vô hạn, **KHÔNG có số**. **Bịa % là trượt H2**, không phải H4 — người
dùng phát hiện một lần là mất niềm tin vào mọi con số khác trong app.

---

## C5 · CẢM ỨNG

**CÂU HỎI:** Bề mặt này có đặc tả chạm riêng, hay chỉ là bản desktop thu nhỏ? — CÓ / KHÔNG

**TRƯỢT NGAY:** thu nhỏ điều khiển desktop rồi gọi là touch (`if-design/SKILL.md` §9).

**CÁCH ĐO:** đích chạm **≥44px**; có đường không-hover cho mọi thứ hiện-khi-hover (tablet không
có hover — thứ giấu sau hover là thứ **mất hẳn**); điều khiển **gần vật**, không phủ canvas;
có nêu tap · double tap · long press · drag · swipe · pinch · hai ngón · cử chỉ mép chưa.

Chuẩn nhấn giữ: **500ms / 8px**. ⚠️ Hằng số này hiện mang tên `TOOLTIP_LONG_PRESS_MS`
(`components/ui/Tooltip.tsx:33,37`) — **thuộc về Tooltip**, IF **chưa có** chuẩn cử chỉ chung.
Thấy chỗ khác mượn thẳng hằng số của Tooltip ⇒ ghi là **sai ngữ nghĩa**, H3.

---

## C6 · CO GIÃN

**CÂU HỎI:** Khi hẹp lại, màn **soạn lại** hay chỉ **co nhỏ**? — CÓ / KHÔNG

**Recompose, not shrink** (`if-design/SKILL.md` §9):
- tool: `FULL → ICON+LABEL → ICON → GROUP → OVERFLOW`
- panel: `DOCKED → NARROW → COLLAPSED EDGE → TRANSIENT`

**TRƯỢT:** ⛔ **thêm một hàng toolbar** khi hẹp — cấm tuyệt đối · chữ co nhỏ dần tới mức khó đọc ·
nhân vật chính bị ép nhường chỗ cho chrome · tràn ngang toàn trang.

**CÁCH ĐO:** cần **≥2 bề rộng** (vd 1440 và 1100). Chỉ có một ảnh ⇒ **CHƯA CHỨNG MINH**, không
được cho PASS trục này. Vật rộng (bảng, sơ đồ, khối mã) phải cuộn **trong khung của nó**, thân
trang **không bao giờ** cuộn ngang.

**Widget khai theo Ô LƯỚI, cấm khai px** (chốt 16/08) — đây không phải chuyện thẩm mỹ mà là
**điều kiện** để cùng một widget chạy trên desktop · tablet · điện thoại. Thấy widget kéo giãn
tự do ⇒ trượt H3.

---

## C7 · THUẬT NGỮ

**CÂU HỎI:** Chữ trên màn có phải ngôn ngữ **sản phẩm** không? — CÓ / KHÔNG

**Máy:** `npm run soi:tu-dien`.

**TRƯỢT NGAY:** từ vựng lập trình lộ ra UI (`node`, `flow`, `entity`, `matId`, `payload`) ·
ID nội bộ · trộn VI/EN tuỳ tiện trong cùng cụm · dịch máy nguyên văn · danh tính giả
(`Untitled flow` — hiện **10/13 bề mặt**, `01-CLINICAL-UI-AUDIT.md` B1, **H3 hệ thống**) ·
nhãn quá 12 từ · chữ "tự động".

**ĐƯỢC PHÉP giữ tiếng Anh:** lệnh dựng hình nghề quốc tế — Array · Bevel · Chamfer · Loft ·
Sweep · Revolve · Mirror · Fillet · Offset · Extrude · Boolean (chốt 08/08). Ranh giới hẹp:
**chỉ tên LỆNH DỰNG HÌNH**; tên chặng, điều hướng, trạng thái, câu giải thích vẫn theo ngôn ngữ
giao diện.

**Nhãn CẤM:** "CAD" ở chỗ chỉ **chặng làm việc** (chốt 07/08) — phải là *Thiết kế 2D*; chữ "CAD"
chỉ đúng khi nói về **định dạng tệp** (DWG/DXF).
