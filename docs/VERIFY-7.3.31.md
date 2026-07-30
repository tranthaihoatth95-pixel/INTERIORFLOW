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

## 5 · Sửa theo chuẩn responsive (Luật #10, không hỏi) — trả lại 23px thiếu ở mục 4

Hai phép chuẩn, không phải quyết định sản phẩm:

**① Wordmark → logomark khi hẹp.** `<span>InteriorFlow</span>` cạnh logo: `lg:block` (bật ngay ở
1024px — breakpoint CHẬT NHẤT, sai hướng ưu tiên) → `xl:block` (chỉ bật ≥1280px). IFLogo (icon)
giữ nguyên, luôn hiện. Tiết kiệm ~110px ở 1024/1183.

**② "Đăng xuất" vào menu bấm-avatar.** `UserChip` trước có nút Đăng xuất đứng RỜI cạnh avatar
(chuẩn Google/Figma/Notion/Slack/GitHub: sign-out — hành động phá huỷ — nằm TRONG dropdown tài
khoản, không đứng trần trụi ngoài thanh). Bấm avatar/tên giờ mở popover: tên+email (đọc) → "Đổi
avatar" → ngăn cách → "Đăng xuất". Áp dụng ở MỌI kích thước (không phải chỉ khi hẹp — đây là
đúng chuẩn, không phải workaround responsive).

Thang ưu tiên đầy đủ (comment trên `<header>`, `AppChrome.tsx`) — bậc 3/4/5 CHƯA làm, chỉ làm nếu
đo vẫn thiếu:
```
1. wordmark → logomark        (≥1280px mới hiện chữ)          — ĐÃ LÀM
2. Đăng xuất → menu avatar    (mọi kích thước)                 — ĐÃ LÀM
3. Home → gộp vào ⋯           (nếu vẫn thiếu)                  — chưa làm, không cần
4. "Việc" → gộp vào ⋯         (nếu vẫn thiếu)                  — chưa làm, không cần
5. "Tệp" → còn icon, bỏ chữ   (nếu vẫn thiếu)                  — chưa làm, không cần
KHÔNG BAO GIỜ nhường: StageSwitcher · avatar · nút ⋯.
```

### Bảng đo sau ①② — route render, cả 4 điều kiện đạt

| BP | `header.scrollWidth` ≤ viewport? | Phần tử ngoài cùng phải `right` | Gap nhỏ nhất (mọi cặp liền kề) | Tên dự án ở 1024px |
|---|---|---|---|---|
| 1024px | 1024 ≤ 1024 ✅ | 1012 ≤ 1024 ✅ | **10.00px** (⋯→avatar) | **"Dự án mẫu" hiện ĐỦ CHỮ, rộng 78.66px** ✅ |
| 1183px | 1183 ≤ 1183 ✅ | 1171 ≤ 1183 ✅ | **10.00px** (⋯→avatar) | "Dự án mẫu" đủ chữ, rộng 193.4px |
| 1440px | 1440 ≤ 1440 ✅ | 1428 ≤ 1440 ✅ | **10.00px** (⋯→avatar) | "Dự án mẫu" đủ chữ, rộng 361.25px |

Chi tiết gap từng cặp liền kề ở CẢ 3 breakpoint (logo→Tệp: 33px · Tệp→tên DA: 12px · tên DA→Dock:
12px · Dock→Chạy flow: 12px @1024, 56.26px @1183/1440 · Chạy flow→Việc: 12px · Việc→⋯: 54px ·
⋯→avatar: 10px) — **mọi cặp ≥8px, 0px chồng lấn, 0px tràn ở cả 3 breakpoint.** 1024px không còn
là vấn đề: **tên dự án hiện được chữ thật (không còn co về 0 như trước phép sửa ①②).**

Xác nhận thêm: menu avatar mở đúng, có 2 mục "Đổi avatar"/"Đăng xuất" (test qua `click()`+đọc DOM).
`xl:block` xác nhận đúng — wordmark "InteriorFlow" ẩn ở 1024/1183, hiện lại ở 1440 (logo.right
nhảy từ 38px lên 127.15px, khớp bật lại wordmark ≥1280px).

## 6 · Kết luận

- Overlap CỤ THỂ Hoà chỉ ra (Tệp/StageSwitcher/Chạy flow đè nhau) — **ĐÃ SỬA**.
- Tên dự án cắt còn 1 ký tự / ẩn hẳn ở 1024px — **ĐÃ SỬA HOÀN TOÀN** sau ①②, hiện đủ chữ ở cả 3
  breakpoint, không chỉ 1183/1440 như bản vá đầu.
- Ngân sách bề rộng 1024px (mục 4) — **ĐÃ ĐỦ** sau ①②, dư ra tới gap nhỏ nhất 10px (không âm,
  không tràn). Bậc 3/4/5 của thang ưu tiên để dành, không cần dùng tới.
- `2.2.86` (dời "Chạy flow" khỏi header) sẽ trả thêm ~110px nữa — không tính trước, đã đủ ngay
  bây giờ theo yêu cầu.
