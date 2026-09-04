# SHIP BLOCKERS — thứ THẬT SỰ chặn việc phát hành IF

## ⬛ BẢY CỔNG PHÁT HÀNH (chủ dự án đính chính 04/09 — thay bản năm cổng)

| Cổng | Trạng thái | Chủ sở hữu | Còn thiếu đúng cái gì |
|---|---|---|---|
| **G1 · DATA SAFE** | 🟡 PARTIAL | 01 CORE | Vá P0 xong-máy, **chưa chạy app thật**. 8 ca đang nghiệm thu. |
| **G2 · PROFESSIONAL FLOW** | 🔴 BLOCKED | 02 WORKFLOW | Ma trận 22 hành trình đã có, nhưng **0 hành trình xác minh ở cột KẾT QUẢ ĐÃ LƯU**. |
| **G3 · WORKSPACES & TOOLS** | 🔴 BLOCKED | 04 DESIGN + 02 | Bàn làm việc nghề (2D · 3D · Vật liệu · Thư viện · Trình bày · BOQ · Duyệt) **chưa audit**. Chuẩn vi-tương-tác §8 chưa có máy canh. |
| **G4 · DESIGN TRUTH / MOAT** | 🔴 BLOCKED | 01 CORE + 02 | Định danh ngữ nghĩa · gia phả · ký ức quyết định · ảnh hưởng sửa lại — **chưa có phép thử xuyên bề mặt nào**. |
| **G5 · EXPERIENCE** | 🟡 PARTIAL | 04 DESIGN | Home đang khoá→thi công. **Home KHÔNG được chiếm đường găng toàn app.** Vitals · khung app · workspace chưa phán. |
| **G6 · CONTENT & INTELLIGENCE** | 🟡 PARTIAL | 05 ASSET · 06 MEDIA · 03 AI | Hợp đồng chốt, bước 1 xong. **3D = 1 tệp.** Vật liệu 0 dữ liệu. Intro chưa có. ⛔ **Cấm nhân nội dung trước khi lát cắt dọc moat PASS.** |
| **G7 · DESKTOP RELEASE** | 🔴 BLOCKED | 07 RELEASE | `db push` trên CSDL người dùng (rủi ro P0) đang sửa. **Cổng đóng gói chưa thử lần nào.** Bằng chứng cuối là **APP ĐÃ ĐÓNG GÓI**, Vercel xanh không tính. |

## 🔴 LUẬT PASS MỚI — áp cho MỌI luồng có ghi dữ liệu (chủ dự án ban 04/09)

> **THAO TÁC → GHI XUỐNG → ĐÓNG/TẢI LẠI → VÀO LẠI → CÙNG MỘT SỰ THẬT.**

Thiếu bất kỳ mắt nào ⇒ **KHÔNG PASS**, dù mã có chạy. Đây chính là lỗ mà ma trận hành trình vừa lộ ra: mọi bằng chứng hiện có chứng minh *app phản ứng đúng lúc bấm*, **chưa mẩu nào** chứng minh *việc còn đó sau khi đóng app*.

## 🔴 LÁT CẮT DỌC MOAT — cổng chặn việc nhân nội dung

Trước khi dựng 24 món 3D, phải chứng minh bằng **vài vật đại diện**:

`Thư viện → 2D → ĐỊNH DANH NGỮ NGHĨA → 3D BuildRecipe → Vật liệu → BOQ/Spec → Trình bày → lưu → ĐÓNG → mở lại → gia phả + định danh CÒN NGUYÊN`

Lát cắt PASS mới được nhân nội dung. Moat chỉ tồn tại trong kiểu dữ liệu/tài liệu mà người dùng **không trải nghiệm được hiệu ứng của nó** ⇒ **CHƯA HOÀN THÀNH**.

## ⬛ BẢN ĐỒ CHUYÊN GIA

| # | Chuyên gia | Sở hữu | Cổng |
|---|---|---|---|
| 01 | **CORE** | dữ liệu · sự thật dự án · định danh · lưu trữ | G1 · G4 |
| 02 | **WORKFLOW** | hành trình nghề đầu-cuối | G2 · G3 · G4 |
| 03 | **AI** | Vitals · khẩu độ · ranh giới người-quyết | G6 |
| 04 | **DESIGN** | UX/UI toàn sản phẩm · chuyển động · kiểm thị giác | G3 · G5 |
| 05 | **ASSET** | thư viện 2D · 3D · vật liệu | G6 |
| 06 | **MEDIA** | Wallgallery · intro · media thương hiệu | G6 |
| 07 | **RELEASE** | QA · hiệu năng · Electron · đóng gói | G7 |

**MAIN giữ tích hợp.** Worker không merge/rebase/đẩy nhánh tích hợp, không đổi quyền sở hữu của chuyên gia khác.

### Dây phụ thuộc chéo — cấm hai chuyên gia giải cùng một biên độc lập
`04 ↔ 06` bố cục Home cần hướng Wallgallery · `04 ↔ 03` Home cần quan hệ với Vitals · `05 ↔ 02` thư viện phải **đặt được vật vào việc thật** · `01 ↔ 02` bằng chứng lưu trữ phụ thuộc định danh an toàn · `02 ↔ 07` bằng chứng hành trình phải sống sót ở môi trường sạch · `01 ↔ 02 ↔ 05` lát cắt moat cắt ngang cả ba.

## ĐANG CHẶN

| # | Mức | Việc | Trạng thái |
|---|---|---|---|
| B1 | **P0** | Mất dữ liệu âm thầm khi vào thẳng deep-link | 🟡 **SỬA XONG-MÁY, CHỜ APP THẬT** — xem dưới |
| B2 | **P2** | Home chưa có hướng được duyệt mắt ⇒ bề mặt lớn nhất của sản phẩm chưa đạt *Product Complete* | 🔵 **ĐANG LÀM** (làn B) |
| B3 | **P2** | Khẩu độ Vitals — ảnh app thật đã sẵn, **chưa được phán** | 🟡 chờ mắt Hoà |
| B4 | **P3** | Đường phát hành: `.idf`/`.idfc` sinh từ máy sạch chưa chạy lại sau khi thu 11 slice | ⬜ chưa mở |

### B1 — trạng thái chi tiết (04/09 16:0x)

**Đã cắm đủ ba đường ghi** qua `danhTinhChoLuot()`: `CadSheets.tsx` · `PresentSheets.tsx` ·
`lib/cad/cad3d-autosave.ts`. Không đẻ đường thứ tư.

Bằng chứng là **số lần ghi xuống đĩa**, không phải lập luận:
```
trước patch  → 0 lần ghi
sau  patch   → 3 lần ghi, đúng khoá
   CadSheets      usr::/cad-editor::prj
   PresentSheets  usr::/present-editor::prj
   autosave 3D    DÙNG CHUNG khoá với CadSheets — không đẻ bucket thứ hai
401 thật     → vẫn 0 lần ghi (không nới cổng chặn để lấy số đẹp)
```
Ca "hình dạng CŨ" giữ lại làm **chốt chống tái phát**: quay về đọc đồng bộ là test đỏ ngay.
Ràng buộc *khối dọn phải đồng bộ* nay có **máy canh** chứ không chỉ lời dặn — ca ⑦ khẳng định
mọi lượt dọn chạy xong trước khi bất kỳ lượt định danh nào về.
4 cổng: `tsc` 0 · `test` 0 · `soi:frontier` 0 lệch · `soi:contract` 0 lệch.

🔴 **VÌ SAO CHƯA ĐÓNG:** *chưa mở app thật một dòng nào.* Test dựng lại **hình dạng** effect bằng
lời gọi hàm trần — chứng minh **cơ chế và thứ tự**, KHÔNG chứng minh React thật chạy đúng vậy.
`UNVERIFIED ≠ PASS`. Còn một hồi quy nhỏ chưa đo: `bucketIdRef.current || userIdRef.current ||
'local'` (tên thư mục backup `.ifpack`) — trên route toàn cục cũ `/cad-editor`, trong cửa sổ chờ
định danh nó rơi về `'local'` thay vì userId.

## KHÔNG CHẶN — phân loại rõ để không ai kéo vào đường tới đích

| Việc | Mức | Vì sao không chặn |
|---|---|---|
| Dời repo khỏi `~/Downloads` | **P4** | **RỦI RO ĐANG ĐIỀU TRA, chưa phải nguyên nhân đã xác định.** Chỉ nâng lên P0 khi có bằng chứng: việc chưa-track biến mất · tệp đã-track hỏng · object git hỏng · tiến trình đồng bộ sửa repo · tệp dataless ảnh hưởng cây làm việc · va chạm hoa-thường ở mã nguồn · build/chạy hỏng do chỗ đặt. Máy chẩn đoán giữ lại, đã giao Hoà, **không tiêu thêm thời gian đường-tới-đích**. Dời chỉ khi: cây sạch · đã đẩy hết · không worker nào chạy · audit phụ thuộc đường dẫn xong · có đường lùi · Hoà duyệt cửa sổ bảo trì |
| 21 lỗ vòng focus còn lại | P4 | trợ năng, không chặn ship; phiếu đã soạn |
| 186 hex viết thẳng | P4 | tuân thủ token, không chặn ship |
| 37 radius ngoài thang | P4 | như trên |
| 2 kho chưa mở (`slide-templates` · `idfc-seed`) | P4 | 0 nơi gọi ⇒ không ai mất gì |
| Đối chiếu di sản | **ĐÓNG** | dùng sổ hiện có; chỉ mở lại mục `RECOVER`/`INVESTIGATE` khi có bằng chứng mới |
| backfill `matId` cho hàng cũ | P3 | cần khi phát hành, không chặn việc hôm nay |

## ĐÃ ĐÓNG HÔM NAY
Rủi ro phát hành *migrations tụt sau schema* (`fd83f343` — đo lại: `migrate deploy` dựng **24/24 bảng**) ·
8 lỗ vòng focus · 2 báo nhầm máy soi · mặt AI thứ hai ở WorkHub (đã ghi luật, chưa gỡ mã).

## ĐỊNH NGHĨA XONG — 10 điều, không thêm
Luồng nghề lõi chạy đầu-cuối · việc đã lưu sống qua tải lại · **0 lỗi P0/P1** · hợp đồng dữ liệu/gia phả
đứng · bề mặt bắt buộc có máy kiểm · bề mặt trải nghiệm lớn **qua mắt Hoà** · đường build/test/phát hành
tái lập được · thẩm quyền và mã khớp nhau · **không năng lực trọng yếu nào chỉ nằm ở nhánh di sản chưa
tích hợp** · cài và chạy được từ nguồn chính tắc.
**KHÔNG cần để xong:** sạch nợ kỹ thuật · sạch nhánh lưu trữ · giải thích trọn lịch sử · hết mọi cảnh báo.
