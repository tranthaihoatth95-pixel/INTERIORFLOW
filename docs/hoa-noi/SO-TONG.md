# KHO HOÀ NÓI · sổ tổng

> Máy giữ ý, chống trôi. T commit khi Hoà bấm "Sao chép cho T" trên artifact.
> Cách đọc: `mau` (họ) → dòng dưới là các ý cụ thể, sắp theo họ đông nhất.
>
> Artifact: https://claude.ai/code/artifact/c369a03d-6fd0-4eed-b2ba-c2aa13a49d80

## file-manager  (1)

- **Files có HAI TẦNG khác chức năng** (Hoà đưa mock 17/08 tối):
  · **Tầng trên · Thư mục hệ thống có QUYỀN** — 5 thư mục:
    ① Dự án (24 thư mục · Theo dự án · avatar+cập nhật)
    ② Studio dùng chung (186 tệp · Toàn studio)
    ③ Nhà cung cấp (42 nguồn · Biên tập giới hạn)
    ④ Đã duyệt (328 nội dung · Chỉ đọc)
    ⑤ Lưu trữ (1.204 tệp · Quản trị viên)
  · **Tầng dưới · Collection+** (bỏ "My" hoặc giữ, tuỳ) — các gói component:
    ① Vật liệu (126, PBR · Cá nhân · COL-MAT-001)
    ② Furniture (54 · 2D/3D · Chia sẻ nhóm · COL-FUR-003)
    ③ Chi tiết điển hình (36 · Studio · COL-DET-002)
    ④ Cây · người (22 · Chia sẻ nhóm · COL-PLC-001)
    ⑤ Design DNA (8 thẻ · Studio · COL-DNA-001)
    ⑥ Gói học từ dự án (12 · Chia sẻ nhóm · COL-LEA-001)
    ⑦ Mẫu trình bày (18 · Chia sẻ nhóm · COL-PRE-001)
    ⑧ Cách làm (7 quy trình · Cá nhân · COL-PRO-001)
  · **Collection+ = KHO NGUỒN của IF** — nơi dữ liệu được **chưng cất** thành vật liệu/mẫu áp cho dự án.
  · Bộ lọc: Loại · Nguồn · Trạng thái · Cập nhật.
  · Mã collection dạng `COL-<LOẠI>-NNN`.
  · Ảnh preview thư mục = folder + content peek (kiểu Apple Files).

## design-system / toolbar  (1)

- **Toolbar nên NỔI, không dính thành** (Hoà 17/08 tối):
  · Neo TRÊN hoặc GIỮA (theo chiều dọc), tuỳ nhiều hay ít item
  · **Auto grid** — tự sắp lưới theo số item
  · **Kính lỏng** — liquid glass
  · **Auto hide** — tự ẩn khi không dùng
  · ⚠️ Có ảnh Hoà gửi kèm — chưa nhìn được (message chưa upload lên chat)

## vitals  (1)

- **Vitals thành icon TRÒN NHỎ nằm TRÊN thanh tìm kiếm** (Hoà 17/08 tối):
  · Tìm bình thường → không có gì lạ
  · Bấm Vitals → thanh tìm chuyển sang chế độ "tối" + **effect viên linh sáng nhiều màu**
  · Đây là chi tiết hoá chốt 16/08 (Vitals cạnh ô tìm → nay cụ thể là "trên" + có effect chuyển chế độ)

## bug  (1)

- **Dashboard Home sai HOÀN TOÀN hệ design system** (Hoà chê 17/08 tối, ảnh chụp app thật cổng 3000):
  · Card không kính lỏng (backdrop-filter = 0 chỗ)
  · Không ambient tint chuyển sắc mép
  · Chữ số ô 01/02/03 mono khai lộ, không mang tin
  · Widget đè nhau, khoảng thở lệch
  · Ảnh render (03 THIS WEEK'S FRAME) placeholder không khung
  · Ghi chú: rail router V1 (vừa dựng chiều) CHƯA MOUNT vào HomeScreen → dashboard không có sidebar
  · Đợt C đang chạy (2 phiên): P-ROUTER-HOME + P-DASHBOARD-DS

---

## 01/09 — 12 CHỐT GIAO DIỆN  (12)

> 🔴 **Vì sao mục này tồn tại.** Hoà 01/09 11:22: *"mày không lưu những điều tao nói rồi mày đi
> hỏi lại."* Đây là bản CANONICAL trong repo của 12 chốt đó (bản nạp-nhanh cho phiên Claude nằm ở
> memory `project_loi-hoa-ve-giao-dien.md`; hai bản phải khớp — sổ này thắng khi lệch).
> **Luật hỏi (Hoà 11:24 01/09):** *"cái gì lục lại đéo có thì mới được hỏi tao"* — hỏi CHỈ hợp lệ
> sau khi đã lục transcript + memory + `docs/` + kho và chứng minh được là KHÔNG có; câu hỏi phải
> kèm "đã lục ở đâu, không thấy".

1. **Cá nhân hoá là gốc** — *"giao diện thiết kế cho kiến trúc sư hay designer làm việc thì phải
   cá nhân hoá và làm đúng"* (11:22; anh nói đây là điều đã nói từ trước).
2. **Accent KHÔNG ấn định** — *"tao không ấn định teal hay tím quần què gì cả… accent đi theo bộ
   hình nền người dùng chọn, người ta chọn hình gì thì màu theo đó"* (11:20-21).
   Máy đã có `lib/wallpaper/mau-bo.ts`; việc = nối dây `--accent` động + cổng WCAG.
   ✅ **ĐÃ NỐI 01/09** — `lib/wallpaper/accent-css.ts` + `components/wallpaper/AccentHydrator.tsx`
   mount ở `app/layout.tsx` (mọi route, kể cả deep-link). Trượt cổng ⇒ thoái lui `#6a57f5`.
3. **"Màu xanh màu tím tè le vậy"** (31/08) = chê **RẢI NHIỀU** accent trong một màn — **KHÔNG**
   phải cấm màu nào. Suy diễn "cấm teal" là lỗi của máy, Hoà bắt 01/09 11:18.
4. **Sáng/tối người dùng chọn hoặc theo giờ**; canvas giấy đi cùng theme — *"xưởng đêm giấy đêm,
   xưởng sáng giấy sáng, cấm trộn"* (31/08–01/09).
5. **HAI phiên bản mọi màn**: desktop (phím+chuột) và tablet/foldable (cảm ứng+pencil).
   **CẤM bản lai** (QĐ 01/09 08:32).
6. **Vỏ 4 cạnh**: rail trái = điều hướng chính · góc trên phải = cá nhân + thông báo · đáy =
   context smart tool (master tool đã triển khai) · cạnh phải = hiển thị/edit kiểu 3ds Max (01/09).
7. **UX chốt trước, UI sau — 2 giai đoạn** (QĐ 01/09 09:52).
8. **Cá tính lấy từ Pinterest boards** của anh (`pinterest.com/Bentran_tth`); gu nội thất làm sau ship.
9. **CAD phải hiểu nghề AutoCAD**: block khối, layer đặt tên quy ước — *"đi sau phải giống nó
   trước rồi mới hơn nó"* (11:10).
10. **Soi chiếu đối thủ mọi bề mặt** (Present · 3D · Render) + *"đào kho `docs/` trước — nghiên
    cứu viết ra phải ĐỌC, không bỏ cho chó ăn"* (11:11).
11. **"App thật thắng bản vẽ"** — xong = chạy trên runtime, **có biên nhận**; cấm PASS giả.
12. **Home**: nền = chính việc dở / giấy draft caro lam, **KHÔNG ảnh phong cảnh**; widget do người
    dùng ghim; ô phụ **không vỏ**; **cấm tường thẻ** (canon `home.md`, Hoà duyệt qua 7 note canvas).

⚠️ **Mâu thuẫn còn treo, cần Hoà phân xử** — chốt 22/08 ghi *"bỏ mặt đồng hồ: người dùng CẢM giờ,
không ĐỌC giờ"*, nhưng bản vẽ GĐ1 (`HomeStart.dc.html` · `TheKhoa.dc.html`, mới hơn) vẽ **đồng hồ
số mảnh lớn**. Lượt vá 01/09 đi theo GĐ1 (nguồn mới thắng) ở Home trạng thái A · màn khoá · màn
đăng nhập. Giữ chốt cũ thì gỡ `DongHoMong` khỏi nhánh A của `BeMatHome.tsx` là xong (một chỗ).
