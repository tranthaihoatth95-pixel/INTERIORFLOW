# NỢ SINH RA TỪ CUỘC HOÀ NHÁNH 05/09 — đóng trước khi dựng bộ cài

Tệp TẠM, xoá khi đóng hết. Đây là thứ chỉ tồn tại VÌ hoà nhánh, không phải nợ sản phẩm.

## 🔴 LIÊN LÀN — một làn không tự đóng được

| # | Nợ | Ai đóng | Vì sao chưa đóng được |
|---|---|---|---|
| 1 | `lib/three/tao-khoi-3d.ts` — hàm `duongBaoKhoiDac` **giữ lại có điều kiện**. Nhánh integration cố ý xoá nó (nó chép lại `polygonBlockEntities()` ⇒ **hai bộ phát entity cho cùng một hình**). Lý do đó ĐÚNG. | sau khi `components/three/Viewport3D.tsx` hoà xong | `Viewport3D` lúc L1 làm còn chứa **cả hai thế giới**: import `duongBaoKhoiDac` (:10) lẫn `entityTuCuChi` (:14), hai hàm `ghiKhoiMoi` (:169 và :398). Xoá ngay là gãy bản dựng. |
| 2 | `lib/server/promote.test.ts` **chưa từng chạy** trong lượt hoà | sau khi `app/api/project-files/_lib/luu-file.ts` hoà xong | tệp đó còn dấu xung đột ⇒ không parse. L1 chỉ chứng minh được test **parse** và các ký hiệu nó dùng đều tồn tại. |

## 🟡 CHƯA CHỨNG MINH — phải đo sau khi cả bốn làn xong

| # | Việc | Cách kiểm |
|---|---|---|
| 3 | `lib/site/store.ts` đổi `fs`/`path` sang **nạp động** `node:` để bundle client không gãy. Đã chạy thật `docHoSo`/`ghiHoSo` dưới Node, **chưa chạy `next build`**. | `npx next build` — đây là thứ duy nhất chứng minh bundle client sạch |
| 4 | `lib/site/*` đang giữ **CẢ HAI thế giới** (`HoSoDiaDiem` và `SiteContext`). L1 xác minh cả hai còn người gọi. Nếu ý định thật là **thay hẳn** một bên thì cần một lượt dọn có chủ ý. | quyết định sản phẩm, không phải kỹ thuật |
| 5 | `soi:thao-tac` báo **hex inline 244 / trần 194** sau khi nhập ~950 tệp. Luật cấm nới trần (M-52) ⇒ **phải sửa mã**. | `node scripts/soi-thao-tac.mjs` |
| 6 | `lib/wallpaper/sets.ts` lấy số của integration: máy xác nhận "sáng hơn nền", nhưng **biên độ tụt** (1,021–1,087 so với 1,057–1,213). Máy không phán được. | mắt |

## ⛔ NỢ ĐI RA NGOÀI MÁY NGƯỜI DÙNG — nặng nhất

| # | Nợ | Vì sao |
|---|---|---|
| 7 | **Bản `integration` Hoà ĐÃ CÀI không nâng cấp thẳng lên nền này được.** Sổ `_prisma_migrations` của nó ghi `20260904000000_catchup_schema_drift` (nay đã xoá vì trùng), và **thiếu** `20260820000000_baseline_bu_ba_bang` + 2 migration khác của checkpoint. `migrate deploy` sẽ thử tạo lại bảng đã có ⇒ **gãy**. | phải thêm nhánh nhận diện + `migrate resolve --applied` trong `electron/main.js`, HOẶC chấp nhận người dùng xoá dữ liệu cũ (KHÔNG chấp nhận được — trái hợp đồng zero-loss) |
