# SHIP BLOCKERS — thứ THẬT SỰ chặn việc phát hành IF

> Lập 04/09 theo lệnh **SHIP INTERIORFLOW · DELIVERY OVERRIDES INVESTIGATION**.
> Một câu lọc mọi việc: **việc này có CHẶN hay có GIẢM RỦI RO ĐÁNG KỂ cho việc ship không?**
> Không ⇒ **không được chen vào đường tới đích**.
>
> Thang: **P0** mất dữ liệu/hỏng/bảo mật/chặn build · **P1** luồng nghề lõi gãy ·
> **P2** chặn duyệt sản phẩm/thị giác · **P3** tích hợp/phát hành bắt buộc · **P4** nợ không chặn.
> **Chỉ P0/P1 được tự động ngắt việc hoàn thiện thị giác. P4 không được làm chỉ vì máy đang rảnh.**

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
