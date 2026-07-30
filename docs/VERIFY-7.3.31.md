# VERIFY 7.3.31 — sửa nốt overlap 1024px (30/07)

> Route: `/projects/cms3350vn0001w9tu0vwby8y7/render`. Đo `getBoundingClientRect()` thật qua
> `javascript_tool`, KHÔNG chụp ảnh.

## 1 · Nguyên nhân gốc #1 (đã sửa) — Tệp/StageSwitcher sống trong hộp co

Cụm giữa `flex min-w-0 flex-1` từng chứa CẢ "Tệp" (RenderIOMenus) LẪN `StageSwitcher` — cả hai
đều `shrink-0`. Hộp bị flex bóp nhỏ hơn tổng nội dung → nội dung tràn khỏi mép phải hộp. "Chạy
flow" là em kế tiếp trong DOM nên vẽ SAU, nằm TRÊN phần tràn — đúng thứ tự vẽ DOM, không phải
z-index/stacking quirk. Không sửa bằng `overflow-hidden` trên cụm lớn (đã thử ở `Header.tsx` cũ
trước 7.3.31, bỏ vì cắt popover con).

**Fix**: tái cấu trúc. "Tệp" dời ra làm con trực tiếp `shrink-0` của `<header>`, cạnh logo (đúng
quy ước menu File). `StageSwitcher` dời ra làm con trực tiếp `shrink-0`. Cụm giữa `flex-1 min-w-0`
giờ CHỈ còn tên dự án — thứ DUY NHẤT co được (bỏ `max-w-28/40/56` cứng).

## 2 · Nguyên nhân gốc #2 (phát hiện KHI verify fix #1, đã sửa) — tên dự án tràn khỏi hộp 0px

Ở 1024px, hộp bọc tên dự án (`flex-1 min-w-0`) bị bóp xuống ĐÚNG 0px (đúng — không còn chỗ). Nhưng
nút tên dự án bên trong vẫn cần 1 mức rộng vật lý tối thiểu để vẽ (padding + 1 ký tự + "…") —
KHÔNG có `overflow-hidden` trên hộp bọc, nên nút tràn 16px ra ngoài, đè 4px lên `StageSwitcher`.
**Fix**: thêm `overflow-hidden` lên hộp bọc (an toàn — hộp này không chứa popover, khác cụm giữa
cũ bị cấm `overflow-hidden` vì có Tệp/MoreMenu). Hệ quả đúng dự kiến: ở 1024px tên dự án co về
0px, ẩn hẳn (không hiện được cả "…") — xem mục 4, đây là triệu chứng của vấn đề #3 bên dưới.

## 3 · Bảng đo — `right`(trước) vs `left`(sau) từng cặp liền kề

Với tên dự án: dùng rect của HỘP BỌC (`overflow-hidden`, biên cắt thật) chứ không phải rect thô
của nút bên trong (nút có thể "muốn" rộng hơn hộp — không còn ý nghĩa sau khi đã bị cắt hình).

| BP | Tệp `right` | Tên DA `left`→`right` | Gap 1 | Gap 2 | Dock `left`→`right` | Gap 3 | Chạy `left` | Đạt (≥8px, 0 chồng)? |
|---|---|---|---|---|---|---|---|---|
| 1024px | 240.80 | 252.80 → 252.80 (0px, ẩn hẳn) | 12.00 | 12.00 | 264.80 → 629.02 | 12.00 | 641.02 | ✅ (0 chồng) nhưng ⚠️ xem mục 4 |
| 1183px | 241.80 | 253.80 → 332.05 (78px, "Dự án mẫu" đủ chữ) | 12.00 | 12.00 | 344.05 → 708.27 | 56.27 | 764.53 | ✅ |
| 1440px | 241.80 | 253.80 → 589.05 (335px, "Dự án mẫu" đủ chữ) | 12.00 | 356.99 | 601.05 → 965.27 | 56.27 | 1021.53 | ✅ |

Gap nhỏ nhất trong bảng = 12.00px, trên ngưỡng ≥8px ở CẢ 3 breakpoint. **0px chồng lấn xác nhận
ở cả 3.** Tên dự án hiện ĐỦ CHỮ "Dự án mẫu" (không cắt) ở 1183px và 1440px.

## 4 · ⚠️ VẤN ĐỀ MỚI PHÁT HIỆN — 1024px KHÔNG đủ chỗ cho toàn bộ thanh, kể cả khi tên dự án = 0

Đo trực tiếp `header.scrollWidth` vs `header.clientWidth`:

| BP | `scrollWidth` | `clientWidth` (viewport) | Tràn? | Nút "Đăng xuất" `right` |
|---|---|---|---|---|
| 1024px | **1047px** | 1024px | **TRÀN 23px** | **1042.5px — CHỜM QUÁ viewport (1024px)** |
| 1183px | 1183px | 1183px | không | 1166px — trong viewport |
| 1440px | 1440px | 1440px | không | 1423px — trong viewport |

**Ở 1024px, ngay cả khi tên dự án co về 0px (ẩn hẳn), tổng các phần tử `shrink-0` (logo·Tệp·
StageSwitcher·Chạy flow·Việc·Home·⋯·avatar·Đăng xuất) VẪN vượt 1024px 23px.** Nút "Đăng xuất"
(trong `UserChip`) bị đẩy CHỜM RA NGOÀI viewport — đây chính là hệ quả đối nghịch với luật gốc
`2.2.60` ("cụm giữa co lại TRƯỚC, để cụm phải LUÔN THẤY"): 7.3.31 di dời Tệp+StageSwitcher từ cụm
giữa (co được) sang `shrink-0` (không co được nữa) → tổng khối không-co-được giờ tự nó đã vượt
1024px, không còn phần tử nào có thể "nhường chỗ" được nữa.

**Đây KHÔNG phải lỗi CSS sửa thêm được — là bài toán ngân sách bề rộng thật: tại 1024px, tổng độ
rộng tối thiểu của mọi phần tử `shrink-0` > 1024px.** Cần Hoà quyết phần nào được co/ẩn tiếp ở
1024px (vd: rút gọn "Chạy flow" còn icon-only dưới 1 ngưỡng, ẩn label "Việc", hoặc chấp nhận
1024px không còn là breakpoint đủ cho route Render — route này có nhiều nội dung cố định nhất
trong 4 route do có thêm Tệp/AiStatusDot/Chạy flow mà CAD/Present/Photo không có).

## 5 · Kết luận

- Overlap CỤ THỂ Hoà chỉ ra (Tệp/StageSwitcher/Chạy flow đè nhau) — **ĐÃ SỬA**, 0px chồng ở cả
  3 breakpoint, gap tối thiểu 12px.
- Tên dự án cắt còn 1 ký tự — **ĐÃ SỬA** ở 1183px/1440px (hiện đủ chữ); ở 1024px giờ ẩn hẳn (0px,
  đúng hành vi "cắt sạch" thay vì "tràn/vỡ chữ") — nhưng đây là triệu chứng của vấn đề #4, không
  phải bug riêng của tên dự án.
- **Mới lộ ra khi verify sâu**: 1024px không đủ ngân sách bề rộng cho toàn bộ thanh kể cả khi tên
  dự án = 0 — "Đăng xuất" chờm 18.5px ngoài viewport. Đây là hệ quả trực tiếp của việc tái cấu
  trúc (dời Tệp+StageSwitcher ra khỏi vùng co được) — cần quyết định sản phẩm, không tự chốt.
