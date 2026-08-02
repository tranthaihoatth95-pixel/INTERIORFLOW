# SPEC — THẨM MỸ & CHUYỂN CẢNH KIỂU APPLE (nghiên cứu thật, có nguồn)

> Hoà 02/08: *"nói Apple design system người ta cười cho — nghiên cứu kỹ thẩm mỹ và hiệu ứng
> chuyển cảnh rồi hãy áp dụng."* Đúng. Trước đó Cowork viện "hình học Apple" mà chưa đọc tài liệu.
> File này viết SAU khi đọc: Apple HIG (Liquid Glass), WWDC23 *Animate with springs*, WWDC24
> *Enhance your UI animations and transitions*, tổng hợp iOS 26 motion, và **thay đổi iOS 27**.

## 0 · BÀI HỌC LỚN NHẤT: Apple đã TỰ SỬA Liquid Glass ở iOS 27
iOS 26 ra mắt Liquid Glass → bị chê **khó đọc, quá trong**. iOS 27/macOS 27 (WWDC 6/2026) sửa:
1. **Thanh công cụ mờ (frosted) quay lại** trên macOS — để nút nổi bật khỏi nội dung.
2. **Thanh trượt chỉnh độ kính** trong Cài đặt: từ "ultra clear" → "fully tinted" (người dùng tự chọn).
3. **Bo góc nhất quán** toàn hệ (sửa lỗi lệch bán kính của macOS 26).
4. Sidebar tràn mép; icon màu chỉ sáng ở app đang hoạt động (bớt nhiễu).

⇒ **Luật cho IF:** kính là GIA VỊ, không phải nền tảng. Chữ và nút phải đọc được TRƯỚC, đẹp SAU.
Đây đúng bệnh IF vừa mắc (K1–K4 kính hỏng, chữ trắng trên nền trắng ở theme tối).

## 1 · VẬT LIỆU — dùng kính ở đâu, KHÔNG dùng ở đâu
| Dùng kính (glass) | Dùng ĐẶC (opaque) |
|---|---|
| Lớp NỔI TRÊN nội dung: thanh công cụ nổi, popover, tool window, toast, sheet | Nội dung chính: canvas, danh sách file, bảng, form dài |
| Thứ tạm thời, che một phần nội dung | Panel cố định (sidebar, inspector) — nền đặc `--panel` |
Kính chuẩn IF: `background: rgba(nền, .72)` + `backdrop-filter: blur(20px) saturate(160%)` + viền
`1px rgba(255,255,255,.9)` (sáng) / `rgba(255,255,255,.08)` (tối) + bóng mềm.
**Cấm:** kính lồng trong kính (phải PORTAL ra body) · fade cha có opacity (giết backdrop) · kính trên nền quá tương phản mà không tăng độ đặc.

## 2 · HÌNH KHỐI — bo góc đồng tâm (concentric)
`bo trong = bo ngoài − khoảng đệm`. Thang: icon vuông → card bo 12/16/18 → bar/pill nổi = **capsule**
(bo = cao/2) → núm/avatar = **tròn**. Ví dụ chuẩn: bar 44 → r22, đệm 5 → nút 34 → r17.
Corner **continuous (squircle)** khi nền tảng cho phép — không dùng bo tròn cứng.

## 3 · CHUYỂN CẢNH — số cụ thể (không đoán)
### 3a · Thời lượng (iOS 26 motion guide)
| Loại | Thời lượng |
|---|---|
| Bấm/toggle/nút | **< 200ms** |
| Popover, tooltip, toast xuất hiện | 200–300ms |
| Chuyển trang / đổi mode / mở tool window | **300–500ms** |
| Ngoài 100–500ms | chỉ khi có lý do rõ |

### 3b · Spring (WWDC23 *Animate with springs*) — dùng 3 preset, không tự chế
| Preset | duration · bounce | Dùng cho |
|---|---|---|
| **smooth** | 0.5s · bounce 0 | chuyển trang, đổi mode, fade nội dung |
| **snappy** | 0.5s · bounce 0.15 | popover, menu, tool window, sheet |
| **bouncy** | 0.5s · bounce 0.3 | phản hồi vui: thả node, thêm ảnh, tick chọn |
Web tương đương: `transition: cubic-bezier(.32,.72,0,1)` cho smooth/snappy (đã dùng trong app —
`easeApple`), hoặc spring của Framer Motion `{type:'spring', duration:.5, bounce:.15}`.
**Không** dùng `ease`/`linear` mặc định cho chuyển động không gian.

### 3c · Bốn nguyên tắc bắt buộc (WWDC24 + iOS 26 guide)
1. **Liên tục không gian** *(shared element/zoom)*: thứ được bấm phải **phóng ra** thành màn/cửa sổ
   mới, không thay bằng fade rời rạc. Node → tool window: window nở ra TỪ vị trí node.
2. **Phân lớp chiều sâu**: panel trượt lên thì nền **thu nhỏ + tối nhẹ** (scale .96, tối 12%).
3. **Hướng nhất quán**: vào từ đâu → thoát về đó. Ghi thành quy ước, áp toàn app.
4. **So le (stagger)**: nội dung chính vào trước, phụ trễ 30–60ms/phần tử; tối đa 4–5 bậc.

### 3d · Kết hợp chuẩn (dùng nguyên, khỏi nghĩ)
- Mở cửa sổ/popover: `opacity 0→1` + `scale .96→1` + `y +6→0`, snappy 300ms, gốc phóng = tâm nút bấm.
- Đóng: 200ms (nhanh hơn mở — quy tắc "vào chậm ra nhanh").
- Đổi mode/chặng: crossfade 350ms smooth + nội dung mới `scale .99→1`; **không** trượt ngang cả màn.
- Toast: trượt lên `y 12→0` + fade, 250ms snappy; tự tắt 4s; ra nhanh 180ms.
- Hover nút: 120ms, chỉ đổi nền — không scale (tránh rung mắt).

## 4 · CẤM (anti-pattern, học từ chính lỗi iOS 26 + lỗi IF)
Kính chồng kính · animation > 600ms cho thao tác thường · scale bật nảy trên panel lớn · nhiều thứ
chuyển động cùng lúc không phân cấp · hiệu ứng làm chữ khó đọc · dùng motion để "khoe".
**`prefers-reduced-motion` THẮNG TẤT CẢ**: tắt scale/spring, chỉ giữ fade ≤150ms.

## 4b · SIRI iOS 27 — khuôn mẫu cho VITALS LM (Hoà nhắc 02/08)
Apple thiết kế lại Siri ở iOS 27; đây là tham chiếu sát nhất cho **Vitals chế độ LM** của IF:

| Siri iOS 27 làm gì | Áp cho Vitals LM |
|---|---|
| Kích hoạt = **pill nhỏ động** ở Dynamic Island — KHÔNG chiếm màn hình | Vitals = glyph/pill nhỏ ở chrome; **xác nhận lệnh cấm quả cầu Siri cũ** vẫn đúng |
| Trả lời = **thẻ kết quả trong suốt** nổi lên | popover kính nhỏ (portal), không mở panel to ngay |
| **Vuốt thẻ → chế độ hội thoại** kiểu iMessage, có thẻ nhỏ nhúng (thời tiết/ghi chú/lịch) | đúng cơ chế đã có: kéo Vitals → popover → kéo tiếp → LM đầy; thẻ nhúng = ảnh render · vật liệu `matId` · file dự án |
| **App Siri riêng**: lưới thẻ tóm tắt hội thoại cũ + ô tìm + nút **＋** hội thoại mới | trang Vitals LM: lưới phiên hỏi-đáp cũ theo dự án + tìm + ＋ mới (nối `NotebookChatPanel` đã có) |
| Nhập **giọng + chữ**, kéo **ảnh/tài liệu** vào hỏi | đã chốt trong `SPEC-VITALS-AI` (nhập giọng tiếng Việt + kéo ảnh reference) — nay có khuôn UI |
| Trả lời có **gạch đầu dòng + ảnh lớn**, dẫn nguồn | khớp luật grounded citation của IF (trả lời có trích nguồn) |
| Tông **màu tối** cho khu Siri | Vitals LM dùng bề mặt tối riêng, tách khỏi nền kem của app |

⇒ Vitals LM **không phải chatbot toàn màn**: pill nhỏ → thẻ kết quả → vuốt mới thành hội thoại →
trang riêng để tra lại. Đúng luật "một cửa cho chat AI + chat nhóm" đã chốt.

## 5 · NGHIỆM THU
Mỗi màn/hiệu ứng mới phải trả lời được: dùng preset nào (smooth/snappy/bouncy) · bao nhiêu ms ·
gốc phóng ở đâu · chiều vào-ra · đã test `reduced-motion` chưa · chữ trên kính còn đọc rõ ở CẢ 2 theme chưa.

**Nguồn:** Apple HIG (Materials/Motion, bản Liquid Glass) · WWDC23 *Animate with springs* ·
WWDC24 *Enhance your UI animations and transitions* · iOS 26 motion design guide · tổng hợp thay đổi
Liquid Glass iOS 27/macOS 27 (MacRumors · Cult of Mac · 9to5Mac, 6/2026).

---
*Cowork nghiên cứu + soạn 02/08/2026 sau khi Hoà yêu cầu "nghiên cứu kỹ rồi hãy áp dụng". Số liệu
lấy từ nguồn, không suy đoán. Nối: SPEC-DESIGN-SYSTEM-IF §2d/§3 · LUAT-GIAO-DIEN-BAT-BUOC.*
