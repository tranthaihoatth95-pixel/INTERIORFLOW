# HANDOFF-NEXT — 22/08/2026 (MAIN)

> Đọc file này TRƯỚC. Rồi `BANG-5-TRUC.md` → `docs/mocks/CLAUDE-DESIGN-CURRENT.md`.
> Không đọc rộng lịch sử. Sổ có thể cũ hơn mã — **đo tại nguồn** rồi sửa sổ.

## LOCALHOST — đọc kỹ, ba thứ khác nhau
| Cổng | Là gì | Dùng được để làm gì |
|---|---|---|
| `:3777` | **ẢNH CHỤP PHÁT HÀNH ĐÓNG BĂNG** (Electron .app, PID 39030) | Tham chiếu bản phát hành. **KHÔNG** chứng minh được mã sửa sau lúc dựng |
| `:3000` | `next dev` **ĐANG HỎNG** — `/` 404 còn `/api/health`·`/files` 200 | ⛔ **Đừng lấy số đo ở đây** |
| `:3778` | server production từ **MÃ HIỆN TẠI** (MAIN dựng) | Nơi nghiệm thu mã mới |

🔴 **BLOCKER NGƯỜI DÙNG:** hai `next dev` cùng ghi một `.next` (PID **11452**, **18745**).
Đó là nguyên nhân `:3000` hỏng. Phiên MAIN **bị chặn lệnh `kill`**, và **không nhờ phiên khác
giết hộ** (đi vòng qua quyết định quyền của Hoà). Cần Hoà dừng hai tiến trình đó.

## TRẠNG THÁI THIẾT KẾ HOME — đã sửa lượt này
- `claude-home-first-use.html` → **SUPERSEDED / REJECTED**. Cấm dựng, cấm xin duyệt lại.
  **Không có "First-Use Home" như một màn riêng** — MỘT hệ Home, nhiều TRẠNG THÁI DỮ LIỆU.
- `Home.dc.html` → SUPERSEDED (4 dải ngang bị bác).
- `claude-home-living-canvas-final.html` → **CANDIDATE, ĐANG CHẶN**. Vỏ đúng hướng nhưng:
  ① vẫn vẽ cung mặt trời `05:00 · BAN NGÀY · 5600K · 20:00` (dụng cụ đo đã bị bác)
  ② đóng đinh rác test `21/21` · `19 Bản nháp` · `ẢNH ĐẸP TUẦN NÀY` như dữ liệu thật
  Chi tiết + số dòng: `CLAUDE-DESIGN-CURRENT.md` §5. Đã giao phiên thiết kế sửa.

## LANE ĐANG CHẠY
| Lane | Việc | Trạng thái |
|---|---|---|
| `interiorflow-f2` (thiết kế/UI) | Home target sửa 2 lỗi luật · Sidebar hội tụ THỊ GIÁC | đang chạy · sở hữu `docs/mocks/**`, `components/home/**`, `components/nav/RailDieuHuong.tsx` |
| `interiorflow-74` (chức năng) | Voice mount (xong-mã) · Site nối (xong-mã) | chờ `:3778` để nghiệm thu thật |
| MAIN | dựng · tích hợp · control plane | — |

## ĐỪNG KHÁM PHÁ LẠI
- Rác dữ liệu: 15 hàng `Project` = 5 `__nb:` + ~4-5 fixture ⇒ **dự án THẬT ≈ 0**.
  `21/21` và `19 Bản nháp` là RÁC, không phải dữ liệu.
- `VitalsPill.tsx` mồ côi từ 17/08. Vitals sống = `components/studio/VitalsAperture.tsx`.
- `lib/idfc-import` (3.346 dòng, 4 test) **0 nơi gọi** — ENGINE CÓ, cửa vào NGƯỜI DÙNG chưa xác định.
  **Đừng dựng màn cho nó.** 5 entry frontier đã hạ về `trangThai: 'engine'`.
- `lib/lighting` **KHÔNG chết** — `lib/review/luat/rules-3d.ts:31` gọi runtime qua `'../../lighting/lux'`.
- Ngưỡng ẩm: `suy-luan.ts:177` lấy MỘT số từ chính sách. Bất biến khoá ở `dan-xuat.test.ts:89`.
- **Flake `npm test` đã tìm ra gốc**: `route.guard.test.ts` so `count()` TOÀN BẢNG trong khi
  `-P8` có `lib/server/promote.test.ts` cũng ghi cùng bảng. Nay khẳng định theo PHẠM VI RIÊNG.
  Đừng quay lại giả thuyết "khoá SQLite" nếu không có bằng chứng mới.
- 🔴 **FALSE CALM** — khẩu độ Vitals hiện `calm` khi `site`/`projects` trả **401**. `calm` KHÔNG
  phải im: nó KHẲNG ĐỊNH *"đã kiểm, không có gì cần chú ý"*. Tiền đề đọc HỎNG mà vẫn khẳng định
  ⇒ nói dối bằng một trạng thái nghe lành. Ba trạng thái phải tách: `calm` (đọc được, sạch) ·
  im (không ngữ cảnh) · **không-rõ/không-đọc-được ← ĐANG THIẾU**. Trạng thái: **FAIL**, lỗ
  TRUNG THỰC không phải lỗi hiển thị. Sửa: Auth chặn trước HOẶC Vitals có trạng thái không-rõ.
  ⚠️ Cả MAIN lẫn lane-74 đều KHEN NHẦM nó lúc đầu — Hoà bác mới thấy. Một trạng thái "lành"
  cũng là một LỜI KHAI; phải kiểm lời khai đó còn tiền đề không.
- ⚠️ `pgrep next dev` **KHÔNG bắt được** hai tiến trình phá (`node .../next dev` + `next-server`).
  Dùng `pgrep -f "next dev"` hoặc `ps aux | grep -E "next dev|next-server"`. Một lượt đo bằng
  `pgrep` đã kết luận nhầm là chúng đã chết — chúng vẫn sống (11452 · 11453 · 18745 · 18746).
- `components/home/widgets/LightClock.tsx`: đồng hồ đo ánh sáng (cung mặt trời · 05:00/20:00 ·
  nhãn kelvin) **ĐÃ XOÁ khỏi đường render** (7 chỗ còn lại chỉ là chú thích lịch sử; 0 `<svg>`).
  Xoá thay vì gài cờ là ĐÚNG: có 6 chỗ mount mà chỉ 1 truyền `truong`.
- `soi-cam-dien` đã vá: bỏ type-only khỏi phép đếm caller · tới-được BẮC CẦU · chéo frontier
  hỏi "có tới người dùng không" thay vì so nhãn nhóm · cảnh báo bằng-chứng-quá-rộng (20 entry).

## VIỆC KẾ TIẾP (thứ tự)
1. `:3778` lên → giao cho cả hai lane → Voice nghiệm thu đường lỗi thật (gửi câu → 401 →
   có phản hồi nhìn thấy → câu gốc còn lấy lại được → KHÔNG mất im lặng).
2. Home target sửa xong → MAIN dựng → so cạnh nhau với `:3778` → sửa tới khi khớp.
3. Sidebar hội tụ thị giác (hành vi đã PASS, **đừng viết lại**).
4. Auth/Lock/Session-ended → Site → Explore (thiếu bản vẽ, thiết kế trước) → Gallery → Present.


---

## ⏸ TRẠNG THÁI CUỐI LƯỢT MAIN (22/08) — HAI PHIÊN CÙNG DỪNG, CHỜ HOÀ

### Hai quyết định CHỈ HOÀ trả lời được
1. **AI LÀ MAIN.** `interiorflow-74` báo Hoà đã chỉ định họ TOP-LEVEL MAIN + luật một-người-ghi.
   Lệnh trực tiếp gần nhất mà phiên này nhận từ Hoà lại chỉ định CHÍNH PHIÊN NÀY. Phiên này
   **không nhận lệnh vai qua peer** (không xác minh được), nhưng **đã tự dừng ghi production
   ngay** để loại rủi ro ghi-đôi trong lúc chờ. Không bên nào đang ghi tranh nhau.
2. **BỐN TIẾN TRÌNH LẠC** `11452 · 11453 · 18745 · 18746` (`node .../next dev` + `next-server`).
   Chúng làm hỏng `.next` ⇒ `:3000` cho `/`=404 (đo ở MAIN) và `/files`=500 (đo ở lane-74) —
   cùng một hỏng, hai triệu chứng. **CẢ HAI PHIÊN đều bị bộ phân loại CHẶN lệnh `kill`**, và
   **không phiên nào lách qua phiên kia** (đi vòng quyền = cấm). ⛔ Đừng đụng `39030` (là .app).

### Câu hỏi mở cho Hoà/design — phạm vi ĐÚNG MỘT DÒNG
`components/wallpaper/WallpaperSettings.tsx:77` hiện `Đang là: <nhãn> · <kelvin>K`.
Đo tại nguồn: đây là **nơi đọc DUY NHẤT** của `tod.kelvin`; `lightLabel` nay **0 nơi đọc**
(chết theo LightClock).
Lập luận GIỮ: luật nhắm vào **Home** (cảm được giờ, không phải đọc thiết bị đo). Đây là màn
**CÀI ĐẶT**, nơi người dùng đang chỉnh chính hành vi ánh sáng — bày ra hệ đang làm gì là hợp lý.
Xoá một readout hợp lệ chỉ vì **trùng chuỗi** với widget bị bác là **khớp mẫu, không phải phán
đoán**. Hai phiên độc lập cùng kết luận GIỮ, và cùng KHÔNG tự xoá.
⚠️ Kèm: `lightLabel` (`lib/home/time-of-day.ts:49`) nay là **mã chết** — ai sở hữu production
quyết dọn hay giữ, phiên này KHÔNG đụng.

### Cổng (nhắc lại, đừng nhầm)
`:3778` PID **2225** = MÃ HIỆN TẠI (build sau khi xoá đồng hồ đo) · `:3777` PID 39030 = ĐÓNG BĂNG
· `:3000` = **HỎNG, số lấy ở đó là rác**.
`:3778` là build production ⇒ **không tự nhặt mã mới**; sửa nguồn xong phải nhờ dựng lại.

### Bằng chứng khai tử đồng hồ đo — cách đo đáng giữ làm khuôn
`05:00` → **0 chunk** · `20:00` → **0 chunk** trong bundle đang phục vụ (hai phiên đo độc lập,
số khớp). Đây **mạnh hơn ảnh chụp**: ảnh chứng minh MỘT trạng thái, bundle chứng minh MỌI trạng
thái — và Home thật nằm sau đăng nhập nên không phiên nào chụp được nó (không ai gõ mật khẩu).
