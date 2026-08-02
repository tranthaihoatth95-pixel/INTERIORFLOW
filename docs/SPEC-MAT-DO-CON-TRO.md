# SPEC · MẬT ĐỘ & CON TRỎ — IF/IDF
**Ngày:** 03/08/2026 · **Trạng thái:** ĐỀ XUẤT — chờ Hoà chốt §5
**Bối cảnh:** Hoà hỏi sau khi xem `/files`: *"giao diện này scale tốt cho cảm ứng, nhưng phím chuột desktop hay laptop có hợp lý?"*

---

## 1 · Kiểm thật (đo trong code, không đoán)

| Chỗ | Số hiện tại | Chuẩn chạm | Chuẩn chuột | Kết luận |
|---|---|---|---|---|
| Nút rail | 42px (`files-mock-css`) / 44px (`LeftRail`) | 44 | 28–32 | **lệch nhau + to hơn cần** |
| Avatar rail | 40px | 44 | 28–32 | to |
| Nút "Tải lên" | cao 38px, chữ 12.5 | 44 | 28–30 | hơi to |
| Ô đổi kiểu xem | 32×28px | 44 | 28–32 | **đúng chuột rồi** |
| Thẻ thư mục | đệm 10/14, chữ 12.5 | ok | dày quá cho danh sách dài | thừa |
| Nút CTA rỗng | cao 48px | 44 | 32–36 | to |
| Bề rộng app | `max-width:1440px` | — | — | **màn 27"/4K bị bỏ trống 2 bên** |

→ Về **kích cỡ**: lệch nhẹ, không phải vấn đề chết người. Chuột chính xác hơn ngón tay (Fitts's law), 28–32px là đủ; macOS Finder toolbar 28px, Fluent 32px.

## 2 · Vấn đề THẬT không nằm ở kích cỡ

`grep` trong `components/filemanager/` → **0 kết quả** cho `onContextMenu`, `shiftKey`, `metaKey`, `onKeyDown`.
Giao diện đang có **từ vựng của ngón tay**, thiếu hẳn **từ vựng của chuột + bàn phím**:

| Động tác desktop | Người dùng chờ đợi | Hiện có? |
|---|---|---|
| Chuột phải | menu ngữ cảnh (Đổi tên · Nhân bản · Chuyển · Xoá) | ❌ |
| Shift-click | chọn cả dải | ❌ |
| ⌘/Ctrl-click | thêm/bớt từng mục | ❌ |
| Kéo khung chọn (marquee) | quét nhiều mục | ❌ |
| Mũi tên ← ↑ → ↓ | di chuyển tiêu điểm | ❌ |
| Enter / Space | mở · xem nhanh | ❌ |
| Gõ chữ | nhảy tới mục bắt đầu bằng chữ đó (type-ahead) | ❌ |
| ⌘C ⌘V ⌘Z Delete | sao chép · dán · hoàn tác · xoá | ❌ |
| Kéo file từ Finder/Explorer vào | tải lên | ❌ |
| Con trỏ đổi hình | `cursor` đúng ngữ cảnh | một phần |

**Đây mới là điều làm app "cảm giác như web mobile phóng to" trên laptop** — không phải vì nút to.

## 3 · Luật mật độ (một bộ token, hai chế độ)

KHÔNG làm 2 thiết kế. Làm **một** thiết kế, đổi 5 con số theo loại con trỏ. Desktop là **mặc định** (IF là app Electron), cảm ứng là **override** — đúng chiều với thực tế dùng.

```css
/* app/globals.css — thêm cạnh khối --radius-* */
:root{
  --tap: 32px;      /* nút icon vuông/tròn */
  --row: 28px;      /* chiều cao một dòng danh sách */
  --gap: 8px;       /* khoảng giữa các mục cùng nhóm */
  --pad-card: 8px 12px;
  --fs-ui: 13px;    /* chữ giao diện (nhãn nút, dòng danh sách) */
}
@media (hover: none) and (pointer: coarse){
  :root{
    --tap: 44px; --row: 44px; --gap: 12px;
    --pad-card: 12px 16px; --fs-ui: 15px;
  }
}
```

Điều kiện `(hover: none) and (pointer: coarse)` đã dùng ở `globals.css:1030` cho tooltip tĩnh — **tái dùng đúng điều kiện đó**, không phát minh cái mới, không dùng bề rộng màn hình (iPad rất rộng, laptop cảm ứng vẫn báo `hover: hover`).

Cho phép **ghi đè tay** trong Cài đặt → Hiển thị: `Thoải mái · Vừa · Gọn` (ghi vào `data-density` trên `<html>`, thắng media query). Người dùng iPad ngoài công trường có thể muốn "gọn", người mắt kém dùng chuột có thể muốn "thoải mái".

## 4 · Việc phải làm, theo thứ tự đau

| # | Việc | Nơi | Nặng |
|---|---|---|---|
| 1 | Menu chuột phải + chọn nhiều (shift/⌘) | `FileManagerShell` | vừa |
| 2 | Bàn phím: mũi tên · Enter · Space · Delete · type-ahead | `FileManagerShell` | vừa |
| 3 | Kéo file từ hệ điều hành vào để tải lên | `FileManagerShell` | nhẹ |
| 4 | Token mật độ §3 + thay số cứng bằng `var(--tap/--row/--gap)` | `globals.css` + 3 màn | nhẹ |
| 5 | Thống nhất nút rail 42 vs 44 → cùng `var(--tap)` | `LeftRail` · `files-mock-css` | nhẹ |
| 6 | Bỏ `max-width:1440px`, đổi `min(1720px, 100%)` | `files-mock-css:24` | 1 dòng |
| 7 | Kiểu xem danh sách (list) dùng `--row` — đây mới là kiểu desktop mặc định | `FileManagerShell` | vừa |

## 5 · ĐÃ CHỐT (Cowork chốt 03/08 — Hoà giao quyền quyết)

| # | Chốt | Lý do |
|---|---|---|
| 1 | **Desktop là mặc định, cảm ứng là override** | IF đóng gói Electron chạy máy bàn/laptop; tablet công trường là ca phụ. Mặc định phải là ca chính, override là ca phụ — nếu media query hỏng thì hỏng về phía ĐÚNG. |
| 2 | **Chỉ làm TỰ ĐỘNG. Không làm nấc tay lúc này.** | 3 nấc `Thoải mái · Vừa · Gọn` = thêm state, thêm màn Cài đặt, thêm test — mà 95% người dùng không đụng. Làm tự động trước, khi có người thật kêu mới thêm. Ghi TODO ở §6. |
| 3 | **`/files` mặc định: DANH SÁCH trên desktop · LƯỚI trên cảm ứng · rồi nhớ lựa chọn người dùng** | Danh sách cho thấy tên + ngày + dung lượng + người sửa trong một dòng — desktop có bề ngang để làm việc đó. Lưới chỉ hơn khi nội dung là ẢNH (ngón tay + mắt). Nhớ lựa chọn = chuẩn ngành (Finder, Drive, Dropbox đều vậy). |

Suy ra: kiểu xem mặc định đọc bằng chính `matchMedia('(hover: none) and (pointer: coarse)')` — **một nguồn sự thật** với token mật độ, không thêm biến mới.

## 6 · TODO sau (không làm bây giờ)
- Nấc mật độ tay `Thoải mái · Vừa · Gọn` trong Cài đặt → Hiển thị (`data-density` trên `<html>`, thắng media query). Chỉ làm khi có yêu cầu thật.

---
*Áp cho toàn hệ IDF: mọi màn mới phải khai báo cỡ bằng `var(--tap/--row/--gap)`, không viết số cứng.*
