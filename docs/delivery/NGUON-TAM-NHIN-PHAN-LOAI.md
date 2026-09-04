# PHÂN LOẠI NGUỒN TẦM NHÌN — cái gì là THẨM QUYỀN, cái gì chỉ là dấu vết, cái gì KHÔNG TỒN TẠI

> Lập 04/09 theo lệnh **FINAL COMPLETION DIRECTIVE §1**. Đo bằng `find`/`grep` tại nguồn.
> Luật đi kèm: *bằng chứng lịch sử KHÔNG tự động là thẩm quyền hiện hành*; dùng nó để **khôi phục ý định và năng lực**, không để **hồi sinh cách thi công đã lỗi thời**.

## 🔴 KHÔNG TỒN TẠI TRONG REPO — đừng đi tìm nữa

| Được nêu đích danh | Kết quả `find` toàn repo |
|---|---|
| `InteriorFlow_Canonical_Vision_Pack_2026-08-21` | **0 kết quả** |
| `InteriorFlow_Tam_nhin_Tiem_nang_2026` | **0 kết quả** |

Hai gói này **chưa bao giờ vào repo**. Chúng có thể nằm ngoài (máy chủ dự án, Drive, thư mục tham chiếu ngoài repo). ⇒ **Không phiên nào được suy diễn nội dung của chúng.** Cần thì chủ dự án đưa vào; đến lúc đó nó là *bằng chứng bổ trợ*, chưa mặc nhiên là thẩm quyền.

## 🟢 THẨM QUYỀN HIỆN HÀNH — được phép định hướng việc mới

| Tệp | Vai |
|---|---|
| `docs/IF-KIEN-TRUC-OS.md` (23,8 KB) | **North Star sản phẩm** — N-1…N-20, gồm 13 cờ đỏ và cổng hai câu N-20 |
| `docs/ACTIVE-DESIGN-CONTEXT.md` (17,7 KB) | **Thẩm quyền thiết kế duy nhất** đang hiệu lực |
| `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` (8,3 KB) | **EXS 12 điều** — đã qua mắt 20/08 |
| `docs/IF-ARCHITECTURE-BLUEPRINT.md` (53,6 KB) | **Blueprint B1–B25** — kiến trúc GHÉP thế nào; §B25 luật NO-REBUILD |
| `docs/delivery/LEGACY-DESIGN-QUARANTINE.md` | 12 hướng bị đè, **cấm hồi sinh** |
| Chỉ thị mới nhất của chủ dự án | **thắng tất cả** khi va |

## 🟡 BẰNG CHỨNG BỔ TRỢ — khôi phục Ý ĐỊNH, không khôi phục BỐ CỤC

`SPEC-3D-CORE.md` · `SPEC-3D-MVP-MODELING-2026-08-11.md` · `SPEC-DUNG-BO-LENH-3D.md` · `SPEC-DUNG-3D-THONG-NHAT.md` · `PHIEU-CODE-IF-DOT7-3D-2026-08-03.md` · `CHOT-HUONG-3D-2026-08-01.md` · `M-3D-OUT.md` · `M-3D-NOI-OUT.md` · `SPEC-BRIEF-INTAKE.md` · `SPEC-STAGE-0-IDEATION.md` · `CHUAN-THIET-KE-v7.6-NGUON.md` (nhân trắc · kích thước chuẩn · khoảng lưu thông · ISO 128).

## ⚠️ HAI CHỮ "12 BƯỚC" — KHÁC NGHĨA, CẤM GỘP

| | Là gì | Dùng cho |
|---|---|---|
| **Tour 12 bước** (`bao-cao-phien/2026-08-19-understand-lan-dau.md`) | 12 chặng **đọc MÃ NGUỒN** do máy sinh: Bối cảnh → Cửa vào Electron → Cửa vào Next.js → schema → lõi 2D → LUẬT → BuildRecipe → vật liệu ba mặt → DistillEngine → review 2 lớp → tầng AI → chiếu 6 đích | **onboarding người đọc code**. KHÔNG phải quy trình nghề. |
| **Tám bước** (`QUY-TRINH-THEO-NGON-NGU-NGHE.md`) | quy trình **XÂY IF**: nhận yêu cầu → khảo sát → trình phương án → hồ sơ thi công → thi công → giám sát → nghiệm thu → hoàn công | **cách chúng ta làm việc**. KHÔNG phải quy trình của người dùng. |

🔴 **Không tệp nào trong repo mô tả quy trình 12 bước NGHỀ của người dùng cuối.** Ai đọc lướt sẽ nhặt nhầm một trong hai bảng trên — đó đúng là bệnh *cùng một chữ, nhiều nghĩa*.

## ✅ XƯƠNG SỐNG NGHỀ ĐANG DÙNG — lấy từ chính chỉ thị 04/09 §0

Chủ dự án đã ban chuỗi liên tục, **đây là bản dùng cho cổng G2**:

`Ý ĐỊNH → NGUỒN → THAM CHIẾU → THĂM DÒ → VẬT THIẾT KẾ → BIẾN ĐỔI → QUYẾT ĐỊNH → SỬA LẠI → ĐẦU RA NGHỀ → KẾT QUẢ → KÝ ỨC`

Ràng buộc: **KHÔNG phải trình thuật sĩ tuần tự.** Phải đi được TIẾN · LÙI · SỬA · MỞ LẠI · LẶP · SONG SONG · KHÔNG-ÁP-DỤNG.
Phản hồi phải truy được: `PHẢN HỒI → BƯỚC GỐC → QUYẾT ĐỊNH → ẢNH HƯỞNG XUÔI DÒNG → KIỂM LẠI`.
**Ngữ cảnh phải sống sót khi đổi môi trường. Người thiết kế vẫn là TÁC GIẢ.**
