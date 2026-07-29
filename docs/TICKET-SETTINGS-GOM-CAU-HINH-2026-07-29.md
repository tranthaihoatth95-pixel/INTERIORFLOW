# `7.3.30` — Gom cấu hình về Cài đặt · và bịt 1 lỗ hổng vừa sinh ra từ `2.2.61`

> Hoà hỏi: *Cài đặt cho phép đặt avatar, sáng/tối, hệ thống, tầng AI… đúng không?*
> **Đúng — đó là cách phải làm. Nhưng hiện KHÔNG phải vậy**, và có 1 chỗ trùng mới sinh ra hôm nay.

---

## 1. KHÁM — `/settings` hiện có đúng MỘT mục

`app/settings/page.tsx` chỉ render **`<AiDependencySettings />`** (dòng 36). Hết.

| Cấu hình | Ở `/settings`? | Thực tế đang ở đâu |
|---|---|---|
| Mức phụ thuộc AI | ✅ có | **và cả `MobileMenu.tsx:231-258`** — xem §2 |
| **Sáng / tối** | ❌ | `Header.tsx` MoreMenu (`ThemeToggle`) · `StudioBar.tsx` (nút riêng, xoay auto→sáng→tối) · `CommandPalette.tsx` |
| **Ngôn ngữ** | ❌ | `Header.tsx` MoreMenu · `MobileMenu.tsx:170` · `LangToggle.tsx` |
| **Avatar** | ❌ | route `/settings/avatar` **tồn tại nhưng mồ côi** — xem §3 |
| Xem lại hướng dẫn | ❌ | `Header.tsx` MoreMenu · `MobileMenu.tsx:355` |
| Tín dụng (credits) | ❌ | `Header.tsx` MoreMenu — **đúng chỗ**, xem §4 |

---

## 2. ⚠️ LỖ HỔNG VỪA SINH RA HÔM NAY — `Mức phụ thuộc AI` giờ ở 2 CHỖ

`2.2.61` dời `AiTierMenu` khỏi `Header.tsx` → `/settings`. **Nhưng bỏ sót `MobileMenu.tsx`**, nơi
vẫn còn picker thật:

```
MobileMenu.tsx:231   <Section label={tr('Mức phụ thuộc AI', 'AI dependency')}>
MobileMenu.tsx:233     {TIER_ORDER.map((t) => {
MobileMenu.tsx:241       onClick={() => setAiTier(t)}
```

Hai chỗ cùng ghi một state nên **hành vi không sai** — nhưng:

- Vi phạm **Luật #6 (Đồng Bộ)**: một cấu hình, hai mặt tiền.
- `2.2.61` chốt là *"Header chỉ còn 1 chấm trạng thái nhỏ, chỉ hiện khi chạy mock"*. Bản mobile
  không có chấm đó, lại có nguyên bảng 4 tầng → **hai nền tảng hai trải nghiệm khác nhau cho cùng
  một thứ**.
- Đợt sau ai thêm tầng thứ 5 hoặc đổi nhãn sẽ sửa 1 chỗ, quên chỗ kia.

→ **Phải gỡ khỏi `MobileMenu`**, thay bằng 1 dòng dẫn sang `/settings`. Đây là **phần còn thiếu của
`2.2.61`**, không phải việc mới — nên làm ngay, không đợi sprint.

---

## 3. `/settings/avatar` là route MỒ CÔI

`app/settings/avatar/page.tsx` tồn tại, nhưng `app/settings/page.tsx` **không có link nào** trỏ tới
(grep `avatar` trong page.tsx = 0 kết quả). Người dùng chỉ vào được bằng cách **gõ tay URL**.

→ Thêm mục "Ảnh đại diện" vào `/settings`.

---

## 4. Luật chia — cái gì vào Cài đặt, cái gì được giữ nút nhanh

**Cài đặt là nguồn sự thật duy nhất cho MỌI cấu hình.** Nút nhanh ngoài Cài đặt chỉ được tồn tại nếu
thoả **một** điều kiện:

> Người dùng cần đổi nó **nhiều lần trong một phiên làm việc**.

Áp vào từng mục:

| Mục | Tần suất đổi | Kết luận |
|---|---|---|
| **Sáng / tối** | nhiều lần/ngày — theo ánh sáng phòng, và theo chặng (chuẩn thiết kế §6.5: chặng 2 nên nền tối trung tính để chấm màu) | ✅ **GIỮ nút nhanh** + thêm vào Cài đặt. Nhưng **gom về 1 chỗ duy nhất** — hiện 3 chỗ |
| **Mức phụ thuộc AI** | thỉnh thoảng | ❌ **CHỈ Cài đặt** + chấm cảnh báo khi mock. Gỡ khỏi MobileMenu |
| **Ngôn ngữ** | gần như không bao giờ | ❌ **CHỈ Cài đặt.** Gỡ khỏi MoreMenu + MobileMenu |
| **Ảnh đại diện** | rất ít | ❌ **CHỈ Cài đặt** |
| **Xem lại hướng dẫn** | 1 lần trong đời | ❌ **CHỈ Cài đặt** |
| **Tín dụng (credits)** | — | ✅ **GIỮ ở MoreMenu, KHÔNG đưa vào Cài đặt** — đây là **trạng thái**, không phải cấu hình. Người dùng cần *nhìn* nó lúc làm việc, không cần *đổi* nó |

> Phân biệt cốt lõi: **cấu hình** = thứ người dùng *đặt*; **trạng thái** = thứ người dùng *xem*.
> Trộn hai loại vào cùng một nơi là lý do các trang Cài đặt trở thành bãi rác.

---

## 5. Bố cục `/settings` đề xuất — 4 nhóm

| Nhóm | Nội dung |
|---|---|
| **Tài khoản** | Ảnh đại diện · tên hiển thị · email · đăng xuất |
| **Giao diện** | Sáng / Tối / Tự động · ngôn ngữ · *(sau này: mật độ theo dải màn của `2.2.79`)* |
| **AI** | Mức phụ thuộc AI (4 tầng) · engine oneAI · runtime — `AiDependencySettings` đã có, giữ nguyên |
| **Trải nghiệm** | Xem lại hướng dẫn · *(sau này: bật/tắt các tầng chỉ dẫn của `7.3.27-29`)* |

Nhóm **Giao diện** và **Trải nghiệm** cố ý để chỗ trống — hai mã sắp tới (`2.2.79` mật độ màn,
`7.3.27-29` chỉ dẫn) sẽ cắm vào đúng đây, không phải đẻ trang mới.

---

## 6. Xếp hàng

| Mã | Việc | Chi phí | Xếp vào |
|---|---|---|---|
| **`2.2.61.a`** | **Gỡ picker AI tier khỏi `MobileMenu.tsx:231-258`**, thay bằng dòng dẫn sang `/settings` | Rất rẻ | **NGAY — đây là phần còn thiếu của `2.2.61` đã ✅, không phải việc mới.** Nếu không làm, cây đang ghi `2.2.61` xong trong khi thực tế còn 1 mặt tiền trùng |
| **`7.3.30`** | Dựng `/settings` 4 nhóm: link avatar (bỏ mồ côi) · sáng-tối · ngôn ngữ · xem lại hướng dẫn; gỡ ngôn ngữ + hướng dẫn khỏi MoreMenu/MobileMenu; gom 3 chỗ đổi sáng-tối về 1; **giữ credits ở MoreMenu** | Trung bình | Sprint 3, **cùng cụm với `2.2.69`** (cùng là việc dọn nhãn/điều hướng, cùng file `Header.tsx`/`MobileMenu.tsx` → Luật #6) |

---

*Cowork, 29/07/2026. Đọc trực tiếp `app/settings/page.tsx`, `app/settings/avatar/`,
`components/settings/AiDependencySettings.tsx`, `components/Header.tsx` (MoreMenu),
`components/MobileMenu.tsx:170,231-258,355`, `components/studio/StudioBar.tsx`.
Mã `2.2.61.a` và `7.3.30` là ĐỀ XUẤT — kiểm trùng trước khi dán.*
