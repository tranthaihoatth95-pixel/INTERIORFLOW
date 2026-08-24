# THAM CHIẾU · BLENDER (và 3ds Max)

## BÀI TOÁN CON NGƯỜI
Dựng hình phức tạp mà **vẫn sửa lại được từ đầu chuỗi** — và chỉnh lại thông số của thao tác **vừa
làm** mà không phải hoàn tác rồi làm lại.

## CÁI GÌ CHẠY ĐƯỢC
- **Ngăn xếp lệnh KHÔNG PHÁ HUỶ**: bật/tắt từng bước, đổi thứ tự, lỗi bước này không sập bước sau.
- **F9 · "Chỉnh lệnh vừa chạy"**: một mini window hiện **ngay cạnh chỗ thao tác**, cho sửa tham số
  của lệnh vừa xong.
- **Thanh chung + panel trục phải chuyên sâu** — thứ hay dùng phơi ra, thứ sâu bọc trong panel.
- Rollout thò thụt: tiêu đề là công tắc, có tay nắm kéo đổi thứ tự.
- Nhớ trạng thái panel **theo LOẠI VẬT**, không theo chế độ con.

## VÌ SAO CHẠY ĐƯỢC
Vì nó tách **ý định** khỏi **kết quả**. Ngăn xếp lưu *bạn đã bảo làm gì*, không chỉ *hình ra thế
nào* ⇒ sửa ý định thì hình tự tính lại. F9 chạy được vì nó bắt đúng khoảnh khắc người dùng **vừa
thấy kết quả và biết mình muốn khác đi** — đúng lúc đó, không phải sau mười thao tác.

## LUẬT CHUNG
*Ý định lưu được thì sửa được · công cụ đặt gần chỗ thao tác · thứ sâu bọc lại, thứ hay dùng phơi ra
· phần mềm ghi nhớ.*

## CÁI GÌ RIÊNG CỦA HỌ
Phím tắt dày đặc học rất lâu · giao diện dành cho chuyên gia toàn thời gian · kiến trúc editor/area
riêng · văn hoá "biết hết mọi phím".

## LẤY GÌ CHO IF
- **Ngăn xếp lệnh dựng** — IF đã có và đã chạy thật (một bộ nhận diện nét từng xuất ra công thức
  dựng cho bốn chân ghế, ghi ra tệp cấu kiện nạp-lại-chỉnh-được).
- **Thứ tự áp = thứ tự người dùng kéo**, không phải ưu tiên cố định theo loại phép.
- **F9 — "Chỉnh lệnh vừa chạy": IF CHƯA CÓ, và đây là món giá trị cao nhất trong ba tầng lệnh.**
  Painpoint thật đang sống: đổi khoảng cách offset thì phải **hoàn tác rồi làm lại từ đầu**.
- **Đủ gia phả lệnh dựng hình** — Hoà **BÁC** đề xuất cắt bớt: *"dựng nội thất mà không có mấy cái
  đó là vứt"*; đồ nội thất mới là thứ hình phức tạp nhất (chân bàn tiện · tay vịn · phào chỉ · nan chớp).
- Rollout: tiêu đề = công tắc, có tay nắm đổi thứ tự; **CẤM auto-hide** (bị chửi nhất ở cả bốn app
  đã khảo — 3dsMax · Blender · Rhino · SketchUp).

## KHÔNG LẤY GÌ
Mật độ phím tắt kiểu Blender · giao diện cho chuyên gia toàn thời gian · kiến trúc riêng của họ ·
và **không dựng một khung canvas mới** chỉ để đổi lại vỏ.

## IF DIỄN GIẢI
Ngăn xếp lệnh là **cách IF sẽ cho AI nói chuyện với máy dựng hình**: AI sinh **ý định có cấu trúc**
(một công thức dựng), **không** sinh mã tự do — vì mã tự do đòi một hộp cát mà IF không có, và vì
hiến pháp đã ghi *"AI ra ý định có cấu trúc, CODE tính toán, CODE kiểm tra, sai thì tự sửa tối đa 3
vòng, vẫn sai thì báo lỗi chứ không ship bản sai"*.
Tin tốt kèm theo: sinh JSON theo lược đồ **không cần mô hình lập trình nặng vài GB** — mô hình nhỏ
+ đầu ra có cấu trúc là đủ.

Và luật đặt tên đi kèm: **tên lệnh dựng hình GIỮ TIẾNG ANH** (Array · Bevel · Loft · Sweep · Revolve
· Mirror · Fillet · Boolean) + dòng nhỏ giải thích tiếng Việt. **Chỉ áp cho tên LỆNH DỰNG HÌNH** —
tên chặng, điều hướng, trạng thái, câu giải thích vẫn theo ngôn ngữ giao diện.
