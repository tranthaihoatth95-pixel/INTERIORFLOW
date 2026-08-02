# SPEC · VỎ APP CHẶNG VẼ — v3 (tinh gọn)
**Ngày:** 03/08/2026 · **Trạng thái:** CHỐT (Hoà duyệt hướng) · **Vật mẫu:** `docs/mocks/mock-cad-shell-v3.html`
**Thay thế:** `mock-cad-shell-pro.html` (v1, quá rối — lưu lại để đối chiếu, KHÔNG dùng)

> Hoà 03/08: *"sidebar lèo tèo, không chuyên nghiệp"* → tôi làm v1 dày như AutoCAD → *"rối rắm quá,
> mình muốn như cách Apple tư duy, minimalist nhưng dễ hiểu dễ dùng"* + *"nghiên cứu thói quen
> designer graphic/kiến trúc/nội thất, đừng làm nó quá xa lạ"*.

## 1 · Ba nguồn, một kết luận

| Nguồn | Điều rút ra |
|---|---|
| [Figma UI3](https://www.figma.com/blog/behind-our-redesign-ui3/) | Bản cũ *quá* minimalist nên khó tìm → UI3 **thêm lại nền/viền/bo góc** nhưng **cắt panel** cho canvas rộng. Toolbar mỏng **ở dưới**. Panel thu gọn được. Minimalist ≠ trần trụi. |
| [Apple HIG · Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars) | Sidebar = đi lại giữa khu vực / bộ sưu tập cấp cao, chia **section có tiêu đề**, thu gọn được. HIG **không có khái niệm icon rail** — đó là ngôn ngữ VS Code/Slack. Keynote · Final Cut · Freeform đều **một sidebar có chữ**. |
| [AutoCAD Layers cho designer nội thất](https://www.chiquenest.com/journal/autocad-layers-explained) | Thao tác thống trị hằng ngày: **bật/tắt lớp**. Kế: **khoá** lớp tham chiếu · **Layer States** (snapshot: *Bố trí nội thất* / *Sơ đồ điện* / *Bản cho khách*) · lớp ghi chú đặt **không in** · màu lớp + độ dày nét. |

## 2 · Luật vỏ app chặng Vẽ

1. **KHÔNG rail icon.** 4 mục xuyên app (Tổng quan · Dự án & bảng làm việc · Tệp · Thư viện) gom vào **menu từ nút logo** góc trái. Dashboard/FlowsPanel vẫn mount tại shell như `a9b7203`, chỉ đổi cửa vào.
2. **Một sidebar, một việc: Lớp.** Không nhồi Bản vẽ/Khối/Lịch sử vào đó.
3. **Bản vẽ = tab ngang trên canvas.** Một chỗ duy nhất, không nhân bản trong sidebar.
4. **Inspector chỉ hiện khi có vật được chọn**, có nút ✕. Không chọn gì → ẩn hẳn, canvas rộng ra.
5. **Công cụ ở dock kính dưới canvas**: 7 công cụ + `⋯` + 2 công tắc (Ortho · Bắt điểm). Bỏ hẳn toolbar 20 icon trên đầu.
6. **Đầu trang chỉ 4 thứ**: logo · tên dự án · segmented 3 chặng · 2 nút (bình luận, chia sẻ).
7. **Layer State ở đỉnh sidebar** — dấu hiệu "app của dân trong nghề", đổi cả cảnh nhìn bằng 1 cú bấm.
8. Đếm phần tử nhìn thấy: **~26** (v1 là ~55).

## 3 · Token — không có ngoại lệ
Mọi màu/bo/chữ/nhịp lấy từ `app/globals.css`. Mock v3 chép nguyên văn khối token, **không hex tự chế**.
- Tối là **mặc định** (`:root` = dark), Sáng là `[data-theme='light']` — kem ấm *quiet luxury*.
- Bo `10/14/20/28` · chữ `12/14/16/20/28` · `--ease-apple` · `--dur-fast .18s` · `--dur-base .32s`
- Kính: class `.mat-header` / `.mat-panel` có sẵn — **không tự viết `backdrop-filter`**.
- Bóng: `--shadow-node/-pop/-sheet`. Trạng thái: `--danger/--warning/--success`.

**Bổ sung DUY NHẤT đề xuất thêm vào `globals.css`:**
```css
--fs-2xs: 11px;   /* thang 12/14/16/20/28 thiếu nấc cho nhãn mục & số phụ trong panel dày */
```

**Đồng tâm §2d:** dock bo `--radius-md` (14), đệm 4 ⇒ nút trong bo `--radius-sm` (10). Đúng `bo trong = bo ngoài − đệm`.

## 4 · Chuyển động — theo `SPEC-HOVER-FOCUS-IDF`, không sáng tác
| Phần tử | Luật đã chốt |
|---|---|
| Nút icon (đầu trang, dock, hàng lớp) | đổi nền **120ms**, **KHÔNG scale**; press `scale(.97)` 80ms |
| Hàng lớp | đổi nền **100ms**, KHÔNG scale; **chọn = viền trái accent 2px** |
| Tab bản vẽ | chữ đậm màu hơn 120ms; chọn = nền trượt |
| Swatch vật liệu | **được** scale `1.04` + bóng 150ms (nhỏ + đơn lẻ) |
| Inspector xuất hiện | **RAMP** `.96→1.008→1`, `--dur-base` `--ease-apple` |
| Bàn phím | `:focus-visible` vòng `--accent-ring` 2px offset 2px |
| `prefers-reduced-motion` | bỏ mọi scale/animation, transition ≤100ms |

## 5 · Progressive disclosure — có ngoại lệ bắt buộc
Nút **ẩn** và **khoá** trên hàng lớp chỉ hiện khi hover/focus. **NHƯNG** lớp đang tắt (`.mut`) hoặc đang khoá (`.lok`) thì hiện **thường trực** — vì đó là *thông tin trạng thái*, không phải nút. Đúng `SPEC-HOVER §3 luật 7`: cấm giấu chức năng sau hover trên thiết bị cảm ứng.

## 6 · Cố tình bỏ khỏi giao diện (đã cân nhắc, không phải quên)
| Thứ | Đi đâu |
|---|---|
| Thư viện khối (46 khối) | nút **Khối** đáy sidebar → popover |
| Lịch sử lệnh (`HistoryPanel`) | `⌘Z` đủ dùng; panel đầy đủ nằm trong menu `⋯` của dock |
| Vùng/Zone (`ZonePanel`) | chính là công cụ `ROOM` trong dock, không cần panel riêng |
| `MaterialPalette` | mở từ ô **Vật liệu** trong Inspector |

## 7 · Mật độ
Theo `SPEC-MAT-DO-CON-TRO`: `--tap 32 / --row 28 / --gap 8` desktop, override `44/44/12` ở `(hover:none) and (pointer:coarse)`.

---
*Áp cho chặng Vẽ trước. Chặng Dựng ảnh & Trình bày dùng cùng khung xương, đổi nội dung sidebar + dock.*
