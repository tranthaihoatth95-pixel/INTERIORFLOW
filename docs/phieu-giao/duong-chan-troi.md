# PHIẾU GIAO · HZ — ĐƯỜNG CHÂN TRỜI + KÉO SỬA ĐƯỜNG GIÓNG

Khuôn ⓪+8 ô (`docs/HOP-DONG-PHOI-HOP-T.md` §3).

## THẺ VAI [Đ4]
- **VAI:** HZ — agent thị giác/UI, lộ đường chân trời ra cho KTS sửa được.
- **PHẠM VI:** `lib/vision/single-view-metrology.ts` (THÊM hàm, không sửa hàm cũ) + **1 file mới**
  `lib/vision/horizon.ts` + `lib/vision/horizon.test.ts` + UI trong
  `components/render-studio/ToolModeForm.tsx`.
  ⛔ KHÔNG đụng: `lib/grounded-render/*` · `lib/nodes/*` · 3 thanh công cụ · `lib/boq/*`.
- **ĐIỀU KHOẢN RUỘT:** [T5] đích đến sửa được · [N1] tội ④ **không bịa số** — đường suy ra phải
  khai rõ độ tin cậy · [Đ2] tái dùng engine sẵn có, cấm viết lại phép tính.

## ⓪ TIỀN ĐỀ — xác nhận trước khi gõ dòng đầu
> **TIỀN ĐỀ:** *"3 điểm tụ đã được tính sẵn và tin dùng được; đường chân trời chỉ là đường nối 2
> điểm tụ NGANG (`horizA`–`horizB`), không cần thuật toán mới."*
> Nguồn T dựa vào: `lib/vision/single-view-metrology.ts:71` (`CameraCalib.vanishingPoints`),
> `:210,251` (`calibrateFromVanishingPoints`). Grep `horizon` trong `lib/vision/` = **0**.

Đọc code rồi ghi **một dòng** XÁC NHẬN / BÁC BỎ / KHÔNG CÓ BẰNG CHỨNG kèm file:dòng.
Nếu 2 điểm tụ ngang **không phải lúc nào cũng có** (ảnh 1 điểm tụ) → **BÁC BỎ, báo T ngay**,
đừng tự chế đường thay thế.

## ① BỐI CẢNH NGÀNH
KTS nhìn phối cảnh là biết ngay đường chân trời đúng hay sai — nó quyết định tầm mắt, mà tầm mắt
sai thì cả ảnh sai cảm giác. Máy đã tính được nhưng **giấu trong bộ nhớ**, người không thấy, không
sửa được. Đây là món rẻ nhất trong cả ticket: engine 958 dòng đã có sẵn phép tính.

## ② ĐỌC TRƯỚC
1. `lib/vision/single-view-metrology.ts` — đọc kỹ `CameraCalib` (`:71`) và
   `calibrateFromVanishingPoints` (`:210,251`); hiểu `confidence` nghĩa là gì
2. `components/render-studio/ToolModeForm.tsx:151-164` — chỗ click 2 điểm khai vật chuẩn tỉ lệ
   (khuôn tương tác đã có, HỌC theo nó, đừng phát minh kiểu mới)
3. `docs/TICKET-MASTER-TOOL-VA-DINH-DANH.md` §2.1

## ③ VÙNG FILE — đúng 4 file ở THẺ VAI

## ④ VIỆC
1. **`lib/vision/horizon.ts`** (mới): `horizonFromCalib(calib)` → `{ y0, y1, source: 'derived' |
   'user', confidence }`. Suy từ 2 điểm tụ ngang. **Không đủ dữ kiện thì trả `null`** — cấm đoán.
2. **Cho phép ĐÈ bằng tay**: `applyUserHorizon(calib, line)` → calib mới, đánh dấu
   `source:'user'`. Người sửa thắng máy [T5]; đè xong phải **lùi lại được** về bản suy ra.
3. **UI trong `ToolModeForm`**: vẽ đường chân trời chồng lên ảnh + **2 tay nắm 2 đầu kéo được**.
   Đường suy ra vẽ **nét đứt** + nhãn độ tin cậy; đường người sửa vẽ **nét liền**. Khác nhau nhìn
   là biết — không cùng một kiểu nét.
4. Thêm/sửa **đường gióng phụ**: cho thêm tối đa 4 đường, mỗi đường 2 tay nắm.
   ⚠️ Đợt này **CHỈ hiển thị + lưu**, CHƯA nối vào control image của AI (đó là phiếu sau) —
   khai rõ điều này trong UI, đừng để người dùng tưởng kéo xong là ảnh đổi.
5. Nhãn độ tin cậy dùng chữ người đọc được, **cấm chữ "tự động"**.

## ⑤ RÀNG BUỘC
Không git · dùng cổng 3000 · màu qua CSS var (**cấm hex inline**) · `soi:thao-tac` không được
tăng 31 focus-visible / 193 hex · tay nắm kéo phải đạt cỡ chạm `var(--tap)` · reduce-motion thắng.

## ⑥ NGHIỆM THU TỰ LÀM
`npx tsc --noEmit` 0 · `npm test` 0 fail · test riêng cho `horizon.ts` (ít nhất: ảnh đủ 2 điểm tụ
→ ra đường; ảnh thiếu → trả `null`; đè tay → `source:'user'`; lùi lại → về `derived`).
Browser 3000, **1440×900**, mở đúng màn có `ToolModeForm`, nạp một ảnh, chụp 2 ảnh:
đường suy ra (nét đứt) và sau khi kéo tay (nét liền) → `docs/bao-cao-phien/anh/2026-08-15-HZ-*.png`.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-15-HZ-duong-chan-troi.md`, **khuôn 6 phần**.
## ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc, trống cũng ghi "không có"
## ⑦c HẠN DÙNG KẾT LUẬN — "kết luận này hết đúng khi ___"
## ⑧ DÂY MÁY
Entry `duong-chan-troi-sua-tay` (T mở). **Agent KHÔNG tự sửa registry.**
