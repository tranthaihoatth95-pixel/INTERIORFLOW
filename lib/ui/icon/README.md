# `lib/ui/icon` — bộ ký hiệu riêng của IF

Bộ mẫu, **chưa cắm vào ứng dụng**. Spec đầy đủ: `docs/nc/NC-DESIGN-PATTERN-TOAN-APP-2026-09-05.md`.
Bản vẽ: `docs/mocks/mock-design-pattern-toan-app.html`.

## Vì sao có tệp này — số đo, không phải chuyện gu

Đo trong `components/` ngày 05/09:

| | |
|---|---|
| Lượt vẽ ký hiệu có khai cỡ | **1.188** |
| Số cỡ khác nhau | **35** (1 … 520) |
| Lượt render ở cỡ ≤ 16px | **1.093 = 92%** |
| Lượt KHÔNG khai `strokeWidth` | **1.091 = 91%** |

Bộ đang dùng vẽ cho lưới **24**, nét **2**. Render ở 12/13/14/15/16 mà không bù nét ⇒ nét thực
**1,00 / 1,08 / 1,17 / 1,25 / 1,33px**. Năm cỡ đó chiếm **85%** số lượt.

⇒ Cùng một màn có năm độ đậm ký hiệu chen nhau, **không cỡ nào tròn điểm ảnh**. Đó là thứ mắt
đọc ra là *"xấu"* mà không chỉ được tên — và nó **không phải lỗi của bộ ký hiệu cũ**, mà là lỗi
**dùng một bộ lưới-24 ở cỡ 13**. Cách chữa của cả ngành là **cỡ quang học**: khai nét bằng
**đơn vị lưới**, không bằng pixel.

## Bốn con số phải nhớ

```
lưới 16 · đệm 1 · vùng an toàn 14 · nét 1 (= 6,25% bề ngang)
```

Nét khai theo đơn vị lưới nên **co giãn theo hộp**: 16px→1,00 · 20px→1,25 · 24px→1,50 ·
32px→2,00. **Tỉ lệ nét/lưới là hằng số** — độ đậm không bao giờ trôi nữa.

## Thêm một ký hiệu mới — làm đúng thứ tự

1. **Chọn họ.** `chung` (việc phần mềm nào cũng có) hay `nghe` (ký hiệu bản vẽ)?
   Họ nghề là chỗ IF có lợi thế mà công cụ đa dụng không có — kiến trúc sư **đọc được trước
   khi mở IF**. Nghi ngờ thì hỏi: *"cái này có trong hồ sơ giấy không?"*
2. **Chọn hình khoá** rồi vẽ **chạm mép** hình đó, đừng vẽ nhỏ hơn:
   | | mép ngoài | diện tích |
   |---|---|---|
   | tròn | ⌀13,5 | 143,1 |
   | vuông | 12 × 12 | 144,0 |
   | dọc | 10 × 14 | 140,0 |
   | ngang | 14 × 10 | 140,0 |
   Bốn hình **cân diện tích trong 2,8%**. Vẽ thụt vào là ký hiệu đó đọc ra "nhẹ hơn" các cái bên cạnh.
3. **Đặt toạ độ trên bội số 0,5.** Nét 1 đơn vị có tâm ở `x,5` thì hai mép rơi đúng số nguyên
   ⇒ ăn lưới điểm ảnh ở cả 1× lẫn 2×.
4. **Chọn bề dày.**
   - họ `chung`: **chỉ** `c` (nét cắt, 1).
   - họ `nghe`: **bắt buộc** cả `c` lẫn `t` (nét thấy, 0,5) — tỉ lệ 2:1.
     Đây không phải trang trí: bản vẽ dùng bề dày để phân biệt **cái bị cắt qua** với
     **cái chỉ nhìn thấy**. Vẽ tường bằng một bề dày là **nói sai nghĩa**, không phải xấu.
     Tỉ lệ 2:1 lấy từ bảng nét của chính IF — `lib/three/section-entities.ts:61-63`
     (cắt 0,7 · thấy 0,35 · xa 0,18), các giá trị đều nằm trong `STANDARD_LINEWEIGHTS`
     (`lib/cad/model.ts:42`).
   - nét thứ ba (`xa`, 0,25) **cấm dùng ở lưới 16** — 0,25px là dưới sàn hiển thị. Chỉ mở
     từ cỡ 32 trở lên (`NGUONG_NET_XA`).
5. **Chi tiết quá nhỏ thì vẽ ĐẶC**, đừng vẽ rỗng. Ô cửa sổ 1×1 viền nét 1 chỉ còn lỗ 0,5 —
   ra một chấm bẩn. `du-an` dùng ô đặc đúng vì lý do này.
6. **Bo trong ký hiệu = đúng bề dày nét** (`BO`). Không phải quy ước đẹp mắt: bo bằng nét thì
   mặt trong khúc cua khép lại thành điểm, không hở khe cũng không chồng mực.
   ⚠️ Đây **không phải** thang bo giao diện `--r-1..4` (6/10/14/20) — hai hệ quy chiếu khác nhau.
7. **Thêm tên vào `TenIcon` + `TEN_ICON` + `HO_CUA_ICON` + `NHAN_ICON`.** Thiếu một chỗ là test đỏ.
8. **Chạy test.** `node_modules/.bin/sucrase-node lib/ui/icon/if-icon.test.ts`

## Ràng buộc máy giữ (đừng chỉ đọc — test bắt thật)

| # | Ràng buộc |
|---|---|
| 2 | 0 mã màu gõ cứng — chỉ `currentColor` |
| 3 | mọi ký hiệu cùng `viewBox 0 0 16 16` |
| 4 | đầu nét **vuông** + góc **nhọn** ở mọi ký hiệu; nét bo tròn là FAIL |
| 5 | chỉ hai bề dày `{1 · 0,5}`; bề dày thứ ba là bắt đầu trôi |
| 6 | bốn hình khoá cân diện tích < 3% |
| 7 | không toạ độ nào ra ngoài `[0, 16]` |
| 8 | họ `nghe` **phải** dùng cặp nét 2:1 — không thì nó chỉ là họ chung đội tên |
| 9 | có nhãn ⇒ `role="img"`; không nhãn ⇒ `aria-hidden`; không bao giờ cả hai |
| 10 | cỡ ngoài thang `16/20/24/32` bị từ chối — kể cả 13, cỡ đang dùng nhiều nhất hiện nay |

> Ràng buộc ④ và ⑧ chỉ sống được vì có test. Lượt dựng đầu tiên, test **[8] bắt hai lỗi thật**
> của chính tôi: `cao-do` và `mat-cat` vẽ toàn nét cắt, tức đường gióng bị vẽ đậm bằng cạnh vật
> bị cắt — **sai nghĩa bản vẽ**, mà nhìn bằng mắt thì không thấy gì lạ.

## Dùng

```tsx
import { IfIcon } from '@/lib/ui/icon';

// đứng cạnh chữ đã nói cùng điều → BỎ TRỐNG nhãn, kẻo trình đọc màn hình đọc hai lần
<span><IfIcon ten="tuong" co={16} /> Tường</span>

// đứng một mình → BẮT BUỘC có nhãn
<button><IfIcon ten="cao-do" co={20} nhan="Cao độ" /></button>
```

`co` chỉ nhận `16 | 20 | 24 | 32`. Cần cỡ khác nghĩa là **bố cục đang sai**, không phải thang thiếu nấc.

## Chưa làm — nói thẳng

- **Chưa cắm vào ứng dụng.** 206 tệp còn nhập bộ cũ; đây là bộ mẫu để duyệt trước.
- **Chưa qua mắt Hoà.**
- Docstring `lib/ui/thao-tac-glyph.tsx` còn câu *"muốn có nút thì lấy icon lucide + nhãn chữ"* —
  câu đó **hết đúng** khi bộ này được cắm; phải sửa **cùng lượt thi công**, không để mồ côi.
- Bộ mới **chưa phủ hết** nơi bộ cũ đang phủ: mới 21 ký hiệu, ứng dụng đang dùng nhiều hơn thế.
  Danh sách còn thiếu phải lập **trước** khi đổi, kẻo đổi nửa chừng thành hai bộ chạy song song —
  đúng thứ tệ hơn cả bộ cũ.
