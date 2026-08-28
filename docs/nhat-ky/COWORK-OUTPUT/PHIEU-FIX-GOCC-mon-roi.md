# PHIẾU · FIX ĐỎ — GỐC C: món rời / BOQ / FF&E
### Dán TRỌN vào MỘT phiên. Territory: `lib/ffe · lib/boq · lib/materials · lib/vision · prisma`.

## LUẬT CHUNG
- **V6**: KHÔNG commit. Hoà commit.
- Phóng **1 agent làm + 1 agent phản biện**.
- **N7 / §0t**: `grep -a` trước khi sửa (đừng dựng lại thứ đã có).
- Ghi `docs/M-FIX-C-OUT.md`. **KHÔNG sửa `GAP-IF.md`** (§0u).
- ⚠️ **KHÔNG chạm `lib/cad`, `components/cad`** (M1 giữ) và **không chạm `lib/boq/xlsx` nếu LÀN C đang mở** (báo TỔNG nếu cần).
- Đóng đỏ = **tính năng chạy THẬT** (N6), không phải "file đã đổi".

## ƯU TIÊN 2 BUG IM LẶNG (nguy hiểm nhất — làm trước)
**G-M3-06 · ghép cột sai** (`lib/materials/warehouse/column-mapping.ts`): từ khoá đoán cột dùng chữ cái đơn + khớp **chuỗi con** ⇒ "Phòng" (có `h`) bị gán vào **Cao**, cột Cao thật bị bỏ, cả lô mất chiều cao mà không báo.
→ Sửa: khớp theo **nhãn đầy đủ / ưu tiên khớp chính xác**, bỏ khớp substring 1 ký tự. Cảnh báo cột không map được.

**G-M3-09 · BOQ nuốt món rời** (`lib/boq/compute.ts`): chỉ quét `type==='hatch'` (m²) ⇒ món rời có `specId`+đơn giá **không sinh dòng, không báo lỗi** ⇒ báo giá thiếu âm thầm.
→ Sửa: quét cả **block/entity có `specId`**, sinh dòng; thêm **đơn vị đếm cái/bộ + cột số lượng**; nếu có `specId` mà không ra dòng → **báo lỗi rõ**.

## RỒI TỚI (theo thứ tự)
- **G-M3-05** mở cửa nhập kho: thêm **vật liệu · màu · phòng** (kho đã có field `materials`/`colorHex`/`hUp` — chỉ nối cửa Excel tới, đừng thêm field mới).
- **G-M3-07** cho **chọn loại** (material/furniture) — bỏ ép cứng `kind:'material'` (`apply-import.ts`).
- **G-M3-08** thêm **trường phòng/vị trí** vào `ProductSpec` (`prisma/schema.prisma`) để bảng FF&E theo phòng có chỗ lưu.
- **G-M3-11** BOQ **cột ảnh** + xuất `.xlsx` **nhúng được ảnh** (bộ ghi hiện chỉ chữ).
- **G-M3-01** vision **bốc N món/ảnh** (nay chỉ 1 món/lượt) → ra được danh sách.
- **G-M3-04** hồ sơ **FF&E nhiều món** (mã·ảnh·finish·vendor·giá·SL·ô duyệt).

## CHỜ M1 (đụng lib/cad — KHÔNG làm ở phiếu này)
G-M3-10 block làm phẳng · G-M3-12,13 thư viện văn phòng mỏng · G-M3-14 thả không rơi · G-M3-16 auto-layout văn phòng.

## NGHIỆM THU (N6)
Nhập 1 bảng FF&E thật → **không rơi cột** (Cao/Phòng vào đúng chỗ) · món rời **LÊN được BOQ có số lượng** · `.xlsx` xuất ra **có ảnh**. Chạy thật, không chỉ pass test. Ghi `docs/M-FIX-C-OUT.md`. KHÔNG commit.
