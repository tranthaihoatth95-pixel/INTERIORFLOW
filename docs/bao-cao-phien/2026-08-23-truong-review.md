# BÁO CÁO PHIÊN — dựng skill `if-design-review` (Trường Review)

Ngày 23/08. Vùng ghi: `.claude/skills/if-design-review/**` (đã tuân, không `git add/commit`).
Ngoại lệ được giao: hai tệp báo cáo `docs/design-campaign/07-SOI-HOME-23-08.md` và tệp này.

---

## 1 · LÀM GÌ

Lấp đúng một lỗ mà `06-DESIGN-KNOWLEDGE-AUDIT.md` đo được:
> **"NGƯỜI VẼ ĐANG TỰ CHẤM. Không có skill chấm độc lập nào tồn tại."**

Sản phẩm — 7 tệp:

| Tệp | Vai |
|---|---|
| `SKILL.md` (**110 dòng**, dưới trần 120) | bộ định tuyến: bản chất · quy trình 6 bước · bảng 23 trục · ranh giới máy↔người · luật đầu ra |
| `truc/A-sau-cong.md` | 6 cổng bắt buộc — A1 việc của con người · A2 nhân vật chính · A3 biến mất được · A4 tường thẻ · A5 SaaS · A6 sự thật |
| `truc/B-bo-cuc.md` | thứ bậc · khung viền · mật độ · lộ dần · mềm dẻo workspace |
| `truc/C-ngu-phap.md` | chữ · icon · chất liệu · chuyển động · cảm ứng · co giãn · thuật ngữ |
| `truc/D-su-that.md` | dữ liệu · quyền tác giả AI · truy nguồn · khớp Claude Design |
| `truc/E-dang-cap.md` | thấu kính Apple · tiền lệ nghề · cá tính IF |
| `contracts/visual-review-template.md` | khuôn báo cáo — ⓪ đề bài viết lại … ⑦c hạn dùng |

Mỗi trục có **CÂU HỎI NHỊ PHÂN** + **CÁCH ĐO** làm được trên ảnh. Không trục nào kết luận bằng
tính từ.

## 2 · BỐN LUẬT ĐÃ ĐÓNG CỨNG TRONG SKILL

1. **Không nhận lời nhờ "duyệt giúp".** Câu hỏi luôn là *"Tìm vi phạm và giải thích"*; gặp lời
   nhờ dạng duyệt-hộ thì **viết lại đề bài** và ghi câu viết lại vào ô ⓪. Người gọi không lách được.
2. **Cấm đề xuất thiết kế trong lúc soi.** Chỉ nêu **nguyên tắc** sửa. Ngoại lệ duy nhất: được
   yêu cầu thẳng, và phải tách hẳn thành mục sau kết luận.
3. **Chưa nhìn app thật ⇒ không được PASS.** Trần cứng là PARTIAL, và phải nói rõ trần đó do
   thiếu ảnh. Ca dẫn: 23/08 lane HOME tính bố cục bằng số, chưa mở Home lần nào, ra tường thẻ
   trắng; Hoà mở app và nói đúng một chữ **"XẤU"**.
4. **Không bao giờ đặt `FINAL HUMAN APPROVED`** — chỉ Hoà. PASS ở đây chỉ mở đường tới INTERNAL PASS.

Kèm hai luật xếp hạng: trượt cổng A ⇒ không PASS · PARTIAL và FAIL **đều** xếp theo mức hại
**H1 chặn việc → H2 sai sự thật → H3 hỏng kiến trúc → H4 hao mòn**, cấm liệt kê phẳng.

## 3 · RANH GIỚI MÁY ↔ NGƯỜI — ghi thành mục riêng, §3 của SKILL

- **Máy được**: thang chữ · nguồn/cỡ/nét icon · token nhịp · dùng G0–G3 · tương phản đã biết ·
  bản vẽ nguồn có tồn tại không. Lệnh: `soi:foundation · soi:hinh-hoc · soi:tu-dien · soi:thao-tac`.
- **Máy KHÔNG được**: **bố cục · cái đẹp · cân bằng thị giác · nhân vật chính · sự tĩnh tại của
  kiến trúc.** Skill nói thẳng *"đừng giả vờ máy làm được"*.
- **Cùng nhau, không thay nhau**: máy sạch mà mắt trượt ⇒ vẫn FAIL; mắt thấy đẹp mà máy đỏ ⇒ vẫn
  không PASS. Báo cáo giữ **hai cột riêng**, cấm gộp.

## 4 · CHẠY THỬ — Trang chủ ⇒ `docs/design-campaign/07-SOI-HOME-23-08.md`

Kết quả **🔴 FAIL**. Chín phát hiện, xếp theo hại. Ba cái đáng nói nhất:

- **PH-01 (H1)** — ở **1100px chữ đè lên chữ**: *"Soát duyệt"*×*"Tiếp tục Nháp"*,
  *"Tổng quan"*×*"DỰ ÁN"*, *"Flows · Workspace"*×*"Nháp"*. Cột nội dung không lùi theo sidebar
  mà nằm đè lên. Ở 1440 bệnh nhẹ hơn nhưng vẫn có: bốn chuỗi bị sidebar cắt mép trái.
  **Hero — thứ duy nhất Home tồn tại để phục vụ — nằm dưới chữ khác.**
- **PH-05 (H3)** — đồng hồ ánh sáng `HOÀNG HÔN · 3200K` chiếm giữa màn, **trên** hero. Đây đúng
  là **F-01 trong `02-FAILURE-LEDGER.md`: "Daylight telemetry leaked into Home"** — lỗi đã ghi sổ,
  **vẫn đang sống trên app**. Theo §15 (*same class twice = process failure*), đây là lỗi hệ.
- **PH-06 (H3)** — **6 nhãn HOA có dấu** (`VIỆC · NHÁP · CHẶNG · DỰ ÁN · HOÀNG HÔN` + mốc giờ).
  Luật `LUAT-CHU-VIET` có từ **31/07**, phạm suốt vì **không máy nào canh**.

⭐ **Điểm tự chứng minh của skill:** ba phát hiện nặng nhất (PH-01 chồng chữ · PH-04 sidebar là
nhân vật chính · PH-05 widget chiếm chỗ) **không máy soi nào bắt được**. Ngược lại,
`soi:foundation` đỏ 1173 vi phạm nhưng **không vi phạm nào trong đó là lý do Home trượt**. Đây là
bằng chứng sống cho §3: hai bên soi thật sự khác nhau, không thay nhau được.

## 5 · ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc

- 🔴 **Skill CHƯA CHẠY ĐỦ QUY TRÌNH của chính nó.** Bước 2 (nạp hợp đồng màn) và bước 3 (đối
  chiếu ví dụ xấu **bằng hình**) **không chạy được** vì
  `.claude/skills/if-design/product/**` và `.claude/skills/if-design/examples/BAD/**`
  **chưa tồn tại** — hai thư mục này thuộc lane khác. Skill đã có đường lùi (ghi MISSING rồi soi
  tiếp), nhưng **đường lùi chưa được thử ở trạng thái đầy đủ**. Bản soi Home vì thế đối chiếu
  A4/PH-04/PH-05 **bằng lập luận, không bằng hình** — đúng thứ audit nói là không đủ.
- 🔴 **Ảnh Home dùng để chấm là của 22/08 17:38, không phải mới nhất.** Tệp
  `2026-08-23-nen-sang-apple-home-sang.png` (23/08 10:53) tôi đã mở: **không phải Home** — là màn
  intro nền **tối**, trong khi tên tệp ghi *"sáng"*. **Tên ảnh đang nói dối nội dung ảnh**; không
  có ảnh Home nào của 23/08 trong `artifacts/visual-review/`. Kết luận FAIL có thể lỗi thời 1 ngày.
- **Chỉ chạy `soi:foundation`**; ba máy soi kia chưa chạy trong lượt này.
- **Chưa soi 8/23 trục** (B4 · B5 · C3 · C4 · C5 · D2 · D3 · E2) — thiếu ảnh trạng thái
  (hover · focus · rỗng · lỗi · đang tải · reduce-motion) và **thiếu hẳn theme tối** của Home.
- **Skill chưa được ai ngoài tôi chạy.** Tôi vừa viết luật vừa là người đầu tiên áp dụng nó —
  **đúng loại xung đột mà chính skill này sinh ra để chặn.** Lần chạy thứ hai nên do phiên khác
  làm, trên một bề mặt khác, thì mới biết bộ định tuyến có dùng được không.
- **Số "~90% trọng lượng thị giác"** ở PH-04 là **ước lượng bằng mắt**, không phải phép đo; con
  số 332/1440 thì đo được. Đã khai trong bản soi.
- **Sáu cổng nhóm A chưa hiệu chuẩn.** Chuẩn đúng là chấm thử vài thứ **đã biết kết luận** rồi
  mới đem chấm cái cần chấm (cách P-K/P-L/P-M đã làm). Tôi bỏ bước này vì hết lượt.

## 6 · ⑦c HẠN DÙNG

Skill hết hiệu lực một phần khi: token nền (thang chữ · màu · elevation) được Claude Design ban
hành (hiện **OWED**, `if-design/SKILL.md` §6) · ngữ pháp icon IF ra đời (hiện **MISSING** §7) ·
`product/**` và `examples/BAD/**` có nội dung (lúc đó bước 2–3 mới chạy thật).
Bản soi Home hết hiệu lực khi có ảnh Home chụp sau 23/08.

## 7 · VIỆC ĐỀ NGHỊ, KHÔNG TỰ LÀM

1. **Đưa luật chữ Việt hoa toàn phần vào máy soi.** Luật 31/07 phạm liên tục vì không ai canh;
   đây là luật **nhị phân, máy bắt được**, rẻ nhất trong mọi việc đang xếp hàng.
2. **Kiểm F-01 tái phát.** Đồng hồ ánh sáng vẫn ở Home ⇒ theo §15 phải mở lại mục ledger, không
   vá tại chỗ.
3. **Đổi tên `2026-08-23-nen-sang-apple-home-sang.png`** — tên nói dối nội dung. Ảnh sai tên là
   mầm cho đúng loại lỗi *"đếm ở bản chiếu thay vì đếm tại nguồn"*.
