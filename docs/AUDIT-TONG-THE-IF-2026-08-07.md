# AUDIT TỔNG THỂ IF — checkpoint 07/08/2026
Đo bằng lệnh chạy thật, không lấy từ sổ. Chỗ nào không đo được ghi **CHƯA VERIFY**.

---

## 1 · QUY MÔ

| | Số thật |
|---|---|
| File `.ts` / `.tsx` (`lib` `components` `app`) | **888** |
| Dòng code | **178.897** |
| File test | **580** |
| Route API | **56** |
| Trang (`page.tsx`) | **26** |
| Model Prisma | **18** |
| Component `.tsx` | **220** |

## 2 · SỨC KHOẺ KỸ THUẬT — rất chắc

| Phép đo | Kết quả |
|---|---|
| `npm test` | **96 khối · 3.016 phép kiểm · 0 FAIL** |
| `npx tsc --noEmit` | **1 lỗi** — `lib/cad/render-layer-index.test.ts:36`, có sẵn từ `752fb54` |
| Component **mồ côi** (0 nơi gọi) | **2 / 220 = 0,9%** |
| `npx next build` | ✅ **XANH** — Hoà chạy máy thật 07/08. 84 route · 46 trang tĩnh · 0 lỗi. `✓ Checking validity of types` PASS |

Hai component mồ côi, đều nhỏ, cùng một chỗ:
`components/settings/AccountSettings.tsx` (2.726 B) · `components/settings/AppearanceSettings.tsx` (2.514 B)

> Đây là con số **tốt bất thường** cho một repo 179k dòng. Luật `N6` (*tạo component mới phải chứng minh có nơi mount*) đang có tác dụng thật — 0,9% mồ côi là rất thấp.

## 3 · SỔ GAP

`docs/GAP-IF.md` — **85 dòng**: 🔴 **58** · ✅ 12 · 🟡 10 · 🟠 4 · ⚪ 1
⇒ **68% còn đỏ.**

## 4 · CHẨN ĐOÁN — nghịch lý phải giải thích

**3.016 test xanh, 0,9% mồ côi, nhưng 68% GAP đỏ.** Hai con số này không mâu thuẫn — chúng đo hai thứ khác nhau:

| | Đo gì | Kết quả |
|---|---|---|
| `npm test` | **code có chạy đúng không** | 3.016/3.016 ✅ |
| `GAP-IF` (luật N6) | **người dùng có BẤM được không** | 58 đỏ |

> **IF mạnh phần ĐỘNG CƠ, yếu phần NỐI DÂY.**

Ba ca điển hình, đo được:
- `G-M3-09` — `computeBoq` chạy thật, **120 test pass**, nhưng **không nút nào trên màn gọi tới**
- `G-M3-11` — file `.xlsx` xuất ra có `xl/media/` thật, openpyxl đọc được, **chưa bấm được trên UI**
- `G-M3-04` — `buildFfeSheet` ra file 14.083 B, 2 ảnh neo đúng ô, **nút chưa bấm được**

Ba cái này ở mức 🟡, không phải 🔴 — engine xong, thiếu đúng một sợi dây.

## 5 · CHẶN LỚN NHẤT — `G-M10-01`

**IF không có `model Task` nội bộ nào.** Chỉ có bản sao CHỈ ĐỌC từ nguồn ngoài
(`components/dashboard/LarkPanels.tsx:176-210`, tự khai `:8` *"kéo-thả kanban KHÔNG đổi trạng thái"*).

Hệ quả kép:
- Kanban **không ghi ngược được** ⇒ SyncWork mang tên "lớp việc" mà không sửa được việc
- Gantt **không có gì để dựng** ⇒ vẽ giao diện xong không nối vào đâu

⇒ **`G-M8-01` và `G-M8-03` phải xếp SAU nó.** Đây là việc số một của ngày mai.

## 6 · BỐN LỖ HỔNG CÒN LẠI, theo mức nặng

| # | Lỗ | Mã | Vì sao nặng |
|---|---|---|---|
| 1 | Không có `model Task` lõi | `G-M10-01` | chặn cả mảng SyncWork |
| 2 | Poché không neo được với hồ sơ NHẬP VÀO | `G-M1-08` | 0/126–161 mảng tô có đường bao để neo — sửa tường thì mảng tô đứng nguyên |
| 3 | Tên nhà cung cấp nằm trong schema lõi | `G-M9-01` | 45 file dính; đổi hạ tầng = phẫu thuật lõi |
| 4 | Rủi ro giấy phép GPL-3.0 (`libredwg-web`) | — | lập luận miễn trừ "tool nội bộ" chết với định vị global. Phương án: `docs/PHUONG-AN-LICENSE-DWG.md` |

## 7 · ĐÁNH GIÁ

**Nền móng chắc hơn con số 68% đỏ gợi ra.** 3.016 test xanh và 0,9% mồ côi là chỉ dấu của một codebase được nghiệm thu nghiêm — hiếm.

**Nhưng app chưa dùng được liền mạch.** Người dùng mở lên sẽ gặp: engine tính đúng mà không có nút bấm · Kanban xem được mà không sửa được · Gantt chưa có.

**Khoảng cách tới bản dùng được thật không nằm ở thuật toán — nằm ở NỐI DÂY và MỘT model dữ liệu còn thiếu.** Đó là tin tốt: hai thứ đó rẻ hơn nhiều so với viết lại engine.

## 8 · CẬP NHẬT 07/08 — Hoà chạy build trên máy thật

**✅ `npx next build` XANH.** Next.js 14.2.35 · 84 route · 46 trang tĩnh · `✓ Checking validity of types` PASS.
⇒ Nền móng đứng được. Bốn phiên code đợt 2 có thể chạy mà không sợ xây trên nền gãy.

> Ghi chú: `next build` PASS trong khi `tsc --noEmit` báo 1 lỗi — **không mâu thuẫn**. Lỗi đó nằm ở
> `lib/cad/render-layer-index.test.ts:36`, là file TEST; `next build` không biên dịch file test.

### ⚠️ Hai thứ build vừa lộ ra

**① Cảnh báo Edge Runtime — `jose`** (mức nhẹ, chưa gây hỏng)
`node_modules/jose/dist/webapi/lib/deflate.js` dùng `CompressionStream`/`DecompressionStream`,
không có trong Edge Runtime. Đường dẫn: `jose/index → jwe/flattened/decrypt → deflate`.
Chỉ nổ khi middleware phải giải nén một JWE **có nén**. Token JWT thường KHÔNG nén ⇒ hiện chưa hỏng.
Nhưng đây là bom hẹn giờ nếu sau này đổi nhà cung cấp đăng nhập. ⇒ `G-M11-01`.

**② Trang nặng — đo được lần đầu** (ngưỡng Next.js khuyến nghị: First Load JS < 250 kB)
| Trang | First Load JS | so ngưỡng |
|---|---|---|
| `/` và `/projects/[id]/render` | **734 kB** | ×2,9 |
| `/materials` | 716 kB | ×2,9 |
| `/projects/[id]/cad` | 712 kB (riêng trang 134 kB) | ×2,8 |
| `/colors` | 675 kB | ×2,7 |
| `/projects/[id]/present` | 640 kB | ×2,6 |
| `/settings` · `/files` | 568 · 564 kB | ×2,3 |
| chia chung mọi trang | 88,2 kB | — |

⇒ `G-M11-02`. **Mức độ nặng tuỳ nơi chạy** — bản Electron nạp từ ổ cứng nên gần như không thấy;
bản web qua mạng thì thấy rõ. Xếp đợt 6, KHÔNG phải việc gấp.

### Vẫn CHƯA VERIFY
- Hiệu năng lúc chạy (thời gian mở app, độ mượt kéo-thả) — chưa đo lần nào
- Chưa mở app bằng trình duyệt trong phiên này
- Chưa đóng gói Electron thử trên máy sạch
