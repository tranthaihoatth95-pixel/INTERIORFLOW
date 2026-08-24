# TRỤC NHÓM D · SỰ THẬT

Bốn trục. Đây là nhóm mà **PARTIAL không tồn tại ở hai trục đầu**: một màn hoặc nói thật, hoặc
nói dối. Vi phạm ở D1/D2 mặc định xếp **H2 · sai sự thật**.

---

## D1 · SỰ THẬT DỮ LIỆU (bản sâu — cổng nhanh ở `A-sau-cong.md` A6)

**CÂU HỎI:** Có giá trị nào **không-REAL** đang định hình bố cục không? — CÓ / KHÔNG (CÓ = trượt)

**CÁCH ĐO — bảng bốn hạng, làm cho TỪNG giá trị:**

| Hạng | Nghĩa | Được định hình bố cục? |
|---|---|---|
| **REAL** | người dùng thật tạo ra | ✅ chỉ hạng này |
| **DEMO** | dựng để trình bày | ❌ |
| **FIXTURE** | dựng để chạy test | ❌ |
| **PLACEHOLDER** | chỗ trống mang hình dạng | ❌ |

**Bẫy đã đo, phải kiểm mỗi lần:** *"Measured on the running app ≠ product truth"*
(`if-design/SKILL.md` §11). 15 hàng `Project` = 5 `__nb:` placeholder + ~4–5 fixture ⇒ dự án
thật **≈ 0**; "21/21" và "19 drafts" là **debris**. ⇒ Nhìn app thật thấy đông đúc **không**
chứng minh dữ liệu thật. Phải truy: giá trị này từ đâu ra?

**Ba loại nói dối, phân biệt trong báo cáo:**
1. **Bịa nội dung** — số, tên, thời gian, thời tiết, "trending", ảnh mẫu đứng thay ảnh dự án.
2. **Bịa tiến độ** — % khi không đo được (xem `C-ngu-phap.md` C4). `CameraExportTab` từng chia
   cho `Math.max(1, total)` ⇒ bịa **0%** khi `total === 0`.
3. **Bình tĩnh giả (FALSE CALM)** — F-02 trong `02-FAILURE-LEDGER.md`: khẳng định trạng thái
   khoẻ trên một tiền đề đã hỏng (Vitals nói `calm` trong khi dữ liệu 401). **Đây là loại nguy
   hiểm nhất** vì nó nhìn như đang hoạt động tốt.

**Trạng thái rỗng trung thực thì ĐẠT** — nói rõ chưa có gì và làm gì tiếp. Đừng lẫn nó với
khung rỗng chờ nội dung. *"Silence beats fabrication."*

---

## D2 · QUYỀN TÁC GIẢ AI

**CÂU HỎI:** AI có đang **quyết** thay vì **đề xuất** không? — CÓ / KHÔNG (CÓ = trượt)

**Phân vai bất di bất dịch** (`if-design/SKILL.md` §0):
- **Con người** giữ: INTENT · JUDGMENT · APPROVAL · AUTHORSHIP.
- **AI** được: diễn giải · đề xuất · sinh · xếp hạng · tóm tắt · lập luận.
- **Mã tất định** kiểm: hình học · ràng buộc · danh tính · phiên bản · nguồn.
- **AI không bao giờ âm thầm sửa sự thật chính tắc.**

**TRƯỢT NGAY:**
- Kết quả AI **áp thẳng** không qua cửa duyệt (mọi đề xuất máy phải đi qua khuôn **ProposalSheet**
  — chốt 13/08).
- **AI đi kiểm tiêu chuẩn.** Kiểm chuẩn là việc của **MÁY**: tất định, 0 đồng, tức thì, chạy 10
  lần ra 10 kết quả giống nhau, dẫn được điều khoản (Hoà duyệt 15/08 thành **luật**).
  Đo được thì viết luật, đừng hỏi model.
- **Trộn hai lớp cảnh báo.** Lớp LUẬT (đỏ/vàng + dẫn điều khoản + nút sửa) và lớp GÓP Ý (dấu
  Magic + chữ "gợi ý", **không bao giờ chặn**) phải **khác dấu**. Cùng giọng đỏ cho cả hai ⇒
  người dùng học cách bỏ qua **cả hai** (chốt 07/08 §12).
- Không thấy **dấu + truy vết** phân biệt thứ AI làm với thứ người làm (chốt tách AI/chính tay).
- Chấm điểm kiểu *"Bố cục 7/10"* ở lớp góp ý — bị **cấm tường minh** (§12.3).

---

## D3 · TRUY NGUỒN

**CÂU HỎI:** Mỗi con số / mỗi vật liệu / mỗi kết quả có **lần ngược về nguồn** được không?
— CÓ / KHÔNG

**CÁCH ĐO trên ảnh:** tìm ba thứ — **Go-to-Source · Where-Used · Blast-Radius**
(`CHOT-EXPERIENCE-SYSTEM-2026-08-20.md`, Context Intelligence Stack). Có ít nhất đường về nguồn
chưa? Không có đường nào ⇒ trượt.

**Cờ tin cậy phải hiện, và phải đủ ba giá trị:** `measured` · `inferred` · `verified`
(+ `external` · `stale`). ⚠️ Ca thật: một chữ ký thị giác vẽ **HAI** hình cho **BA** giá trị ⇒
gộp *máy suy* vào *người nhập* ⇒ **NÓI SAI**. Đếm số hình / số nhãn khớp với số trạng thái —
lệch là trượt.

**Luật BOQ, kiểm riêng nếu màn có số tiền hoặc khối lượng** (Hoà chốt 15/08):
BOQ **chỉ nhận số đo được** từ CAD/Revit/khối dựng trong IF. **Không** cột "tạm tính",
**không** cờ độ tin cậy ở BOQ. Số ước tính từ ảnh phẳng ⇒ trượt **H2**.
ID gán trên phối cảnh chỉ phục vụ **TRÌNH BÀY**, không phục vụ con số.

**Vật liệu TRỎ TỚI bản ghi thương mại, KHÔNG chép giá vào mình** (luật 2.1.9.i 30/07). Giá đổi
hằng ngày, texture thì không. Thấy giá bị nhúng cứng vào vật liệu ⇒ H3.

---

## D4 · KHỚP CLAUDE DESIGN

**CÂU HỎI:** Cái đang chạy có **khớp bản vẽ nguồn** không, và bản vẽ nguồn có **tồn tại** không?
— CÓ / KHÔNG

**Máy làm được một nửa:** kiểm bản vẽ nguồn có tồn tại không. **Không bao giờ chọn bản vẽ theo
tên tệp hay mtime** — phải giải qua chỉ mục `docs/mocks/CLAUDE-DESIGN-CURRENT.md`.
(mtime vô nghĩa ở đây: một lần đổi tên token hàng loạt đã đóng dấu lại **21/36** tệp.)

**Ba kết cục, ghi đúng tên:**

| Kết cục | Nghĩa | Xếp hạng |
|---|---|---|
| **DESIGN MISSING** | trạng thái đang chạy **không có** trong bản vẽ nào | H3 — MAIN **không được tự lấp**, phải trả về |
| **DRIFT** | có bản vẽ, nhưng cái chạy **khác** bản vẽ | H3 — đúng bệnh *"xin mock → liếc qua → lặng lẽ tự chế bằng CSS"* |
| **KHỚP** | đúng bản vẽ đã giải qua chỉ mục | đạt |

**Trạng thái duyệt** (`if-design/SKILL.md` §2): `MISSING · BRIEFED · IN DESIGN · CANDIDATE ·
INTERNAL PASS · IMPLEMENTED · SUPERSEDED · REJECTED · FINAL HUMAN APPROVED`.
⛔ **Chỉ Hoà được đặt FINAL HUMAN APPROVED.** Skill này **không bao giờ** đặt trạng thái đó —
kể cả khi mọi trục đều PASS. PASS của skill này chỉ mở đường tới INTERNAL PASS.

**Chuỗi phải liền, đứt khúc nào ⇒ nêu đúng khúc đó:**
`BẢN VẼ → HỢP ĐỒNG → PRIMITIVE → COMPONENT → RUNTIME OWNER → TEST → BẰNG CHỨNG TRÌNH DUYỆT THẬT`.
Không có bản vẽ mồ côi; không có mã nhìn-thấy-được mồ côi.
