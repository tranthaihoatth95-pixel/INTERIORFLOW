# SPEC — TRỎ VÀO THÌ GÌ XẢY RA (hover · focus · press) — TOÀN HỆ IDF

> Hoà hỏi 02/08: *"trỏ vô thì zoom in nhẹ hay như thế nào? Nghiên cứu sâu rồi đề xuất áp cho toàn hệ
> sinh thái IDF."* Nghiên cứu từ **WWDC25 "Design hover interactions for visionOS"**, WWDC24
> "Create custom hover effects", HIG Focus & selection, tvOS focus engine, macOS Dock magnification.
> Áp cho: IF (3 chặng + hạ tầng) · ArchiNote · mọi UI hệ IDF về sau.

## 0 · CÂU TRẢ LỜI NGẮN
**KHÔNG zoom mọi thứ.** Apple nói rõ: hiệu ứng phóng/chuyển động **chỉ hợp với phần tử NHỎ, ĐƠN LẺ,
ít lặp lại**; dùng cho nút toolbar, ô danh sách, ảnh lớn → **gây rối mắt, cản thao tác chính**.
Nguyên tắc gốc: *"Keep effects small · avoid high-usage views · anchor the content"*.

## 1 · BA KIỂU HIỆU ỨNG (WWDC25) — chọn theo mục đích
| Kiểu | Cách chạy | Dùng khi | Rủi ro |
|---|---|---|---|
| **Tức thì** *(instant)* | phản hồi ngay khi trỏ tới | nút, icon, chip — cần chắc chắn "máy nghe thấy tôi" | quét mắt qua nhiều thứ → nhấp nháy |
| **Trễ** *(delayed)* | hiện sau ~400–600ms giữ chuột | tooltip, nhãn phụ, chú thích | không dùng cho phản hồi chính |
| **Bậc thang** *(ramp)* ⭐ | ease-in chậm → **bật gọn bằng spring** | thứ **nở ra** (tool window, thẻ mở rộng, popover) | — |
⭐ Apple khuyến nghị **ramp** là cân bằng nhất: có phản hồi ngay mà không giật.

## 2 · BẢNG ÁP DỤNG CHO IDF — tra là dùng, không đoán
| Phần tử | Trỏ vào (hover) | Bấm (press) | Đang chọn (selected) |
|---|---|---|---|
| **Nút rail / toolbar / icon-only** | ĐỔI NỀN `--hover` · **KHÔNG scale** · 120ms | nền đậm hơn + scale **0.97** 80ms | bubble nền đặc (đã chốt) |
| **Ô danh sách file / lớp / node trong panel** | đổi nền · 100ms · KHÔNG scale (lặp nhiều) | nền nhấn 80ms | viền trái accent 2px |
| **Thẻ nội dung** (dự án · template · hồ sơ · thư mục) | **lift**: `translateY(-2px)` + bóng `sh→sh-lg` + scale **1.02** · 200ms ease-out | scale 0.99 · 90ms | viền accent 2px + halo `accent-soft` |
| **Swatch vật liệu / avatar / chip nhỏ** | scale **1.04** + bóng nhẹ · 150ms *(nhỏ + đơn lẻ ⇒ hợp)* | 0.98 · 80ms | viền accent + tick |
| **Ảnh render / thumbnail lớn** | **highlight mờ phủ rồi TAN** để lộ màu thật · KHÔNG scale ảnh | — | khung accent, ảnh không đổi |
| **Node trên canvas** | viền sáng + bóng nổi · KHÔNG scale *(nhiều node → rung màn)* | — | viền accent + handle |
| **Tool window / popover mở ra** | — | — | **RAMP**: opacity+scale .96→1, ease-in 120ms → spring pop 220ms, gốc phóng tại nút bấm |
| **Hàng bảng BOQ / ô spreadsheet** | nền dòng nhạt · 80ms | — | viền ô accent |
| **Tab / segmented** | chữ đậm màu hơn · 120ms | — | nền trắng trượt sang bằng spring 250ms |

## 3 · LUẬT CHUNG (bắt buộc)
1. **Hình dạng highlight khớp hình dạng vật**: tròn→tròn, capsule→capsule, thẻ bo 16→highlight bo 16.
2. **Chữ không được nhảy.** Khi thẻ lift/scale, chữ bên trong giữ nguyên vị trí tương đối; không scale riêng chữ.
3. **Neo thị giác**: trong cụm đang hover, giữ ít nhất một phần tĩnh (tiêu đề/viền) để mắt bám.
4. **Một hiệu ứng một lúc.** Không vừa scale vừa đổi màu vừa xoay.
5. **Vào chậm, ra nhanh**: hover-out luôn ngắn hơn hover-in ~30% (200ms vào → 140ms ra).
6. **Bàn phím = chuột**: `:focus-visible` phải có cùng hiệu ứng + vòng focus accent 2px offset 2px.
7. **Tablet/cảm ứng**: không có hover → mọi thông tin chỉ hiện khi hover **phải có đường khác** (bấm giữ, nút hiện sẵn). Cấm giấu chức năng sau hover.
8. **`prefers-reduced-motion`**: bỏ scale/lift, chỉ giữ đổi nền ≤100ms.

## 4 · CẤM (học từ chính lỗi Apple nêu)
Scale nút toolbar · scale hàng danh sách · scale ảnh lớn · nhiều thẻ cùng nhảy khi rê chuột ngang ·
hiệu ứng làm đổi màu ảnh thật · hover làm dịch chuyển thứ đang đọc · hiệu ứng >250ms cho phản hồi trỏ.

## 5 · MÃ MẪU (dùng lại, khỏi nghĩ)
```css
/* thẻ nội dung */
.card{transition:transform .2s cubic-bezier(.32,.72,0,1),box-shadow .2s,border-color .15s}
.card:hover{transform:translateY(-2px) scale(1.02);box-shadow:var(--sh-lg)}
.card:active{transform:scale(.99);transition-duration:.09s}
/* nút icon */
.icon-btn{transition:background .12s}
.icon-btn:hover{background:var(--hover)}
.icon-btn:active{transform:scale(.97);transition:transform .08s}
/* ramp cho popover */
@keyframes ramp{0%{opacity:0;transform:scale(.96)}60%{opacity:1;transform:scale(1.008)}100%{transform:scale(1)}}
.popover{animation:ramp .34s cubic-bezier(.32,.72,0,1)}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition-duration:.1s!important;transform:none!important}}
```

## 6 · NGHIỆM THU
Mỗi phần tử tương tác phải trả lời được: thuộc dòng nào trong bảng §2 · vào/ra bao nhiêu ms ·
có test bàn phím `:focus-visible` chưa · trên tablet không hover thì dùng gì thay · đã thử
`reduced-motion` chưa.

**Nguồn:** WWDC25 *Design hover interactions for visionOS* · WWDC24 *Create custom hover effects* ·
Apple HIG *Focus and selection* · tvOS focus engine (scale+parallax+shadow) · macOS Dock magnification.

---
*Cowork nghiên cứu + soạn 02/08/2026 theo yêu cầu Hoà. Áp toàn hệ IDF. Nối `SPEC-APPLE-MOTION-MATERIAL`
(chuyển cảnh) · `SPEC-DESIGN-SYSTEM-IF` (token/hình khối) · `LUAT-GIAO-DIEN-BAT-BUOC`.*
