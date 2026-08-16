# LATEST — bản nén trí nhớ bối cảnh IF (ghi đè mỗi phiên lớn)

> **Đọc file này ĐẦU TIÊN.** Luật giữ bản nén: **CHỈ tên + đường dẫn + một câu. Cấm chép nội dung.**
> Không thay `STATUS.md` / `docs/00-CHOT.md` / `CHANGELOG.md` — là lớp tổng hợp nhanh thêm vào.

**Cập nhật lần cuối: 2026-08-16**

## Đang ở đâu
Phiên 16/08 là **ĐỢT GIAO DIỆN**, và là phiên Hoà chốt dày nhất từ trước tới nay (**~20 chốt**, phần lớn
cấp hệ thống). Trọng tâm đổi từ *làm tính năng* sang *dựng BỘ NỀN GIAO DIỆN để duyệt trước* — theo đúng
câu Hoà: *"cho mình duyệt tổng quan trước, cái gì chung hệ thống thì cần đồng bộ và duyệt trước."*

## Việc tiếp — BÀN GIAO DIỆN, sáu nợ theo thứ tự
Bản vẽ chính: `docs/mocks/mock-bo-nen-chung.html` (đã lên Design System).
1. **Ô giải nghĩa + trục phải** — hình minh hoạ thao tác là phần chính, không phải chữ
2. **Thanh tiến trình** — hai loại, cấm bịa phần trăm
3. **Nguyên tắc `simpleCoChiTiet`** — dùng làm thước chấm lại 3 phương án chữ ký
4. **Trim màu về riêng mòng két**
5. **Mục biểu tượng tệp** — 2-3 cách xử màu
6. **Chép phần card ba nấc vào báo cáo** — nhỏ nhất, dễ quên nhất
🔴 **CẠM BẪY đã xác minh**: `components/ui/ToolbarChip.tsx:137` `if (disabled) return button;` — nút mờ
đi vòng qua Tooltip, lý do nhét vào `title`. Đúng ca cần ô giải nghĩa nhất lại là ca duy nhất rơi ra ngoài.

## ⛔ CHỜ HOÀ
1. **Duyệt bộ nền** (`mock-bo-nen-chung.html`) — nền sáng Apple · mòng két · kính vỏ/ruột · card 3 nấc
2. **Duyệt đề xuất 6 loại icon** (`00-CHOT` 16/08 cuối) — duyệt xong mới vào từ điển máy
3. **Chạy 2 lệnh chụp màn** — `node scripts/chup-man-duyet-mat.mjs --dang-nhap` rồi chạy lại không cờ
4. Nợ nghiệm thu mắt: **68 xong-máy đối 1 qua mắt**

## Tài liệu / bản vẽ mới sinh trong phiên
| Đường dẫn | Một câu |
|---|---|
| `docs/mocks/mock-bo-nen-chung.html` | bộ nền chung — màu · kính · card 3 nấc · lưới · sidebar · chữ ký |
| `docs/mocks/mock-sidebar-3-nac-home.html` | sidebar 28/240/320 + Home dòng việc — **còn nợ 7 chỗ kính ở ruột** |
| `docs/mocks/mock-so-2-tim.html` | tím hiện tại ↔ tím shadcn, có góc màu/độ sáng/độ rực |
| `docs/mocks/mock-ban-thu-mau.html` | bàn thử màu kéo được, có vùng cấm hue |
| `docs/mocks/mock-4-huong-mau-nhan-dien.html` | 4 hướng màu v1 (đã bị chốt sau thay) |
| `docs/mocks/mock-cai-dat-don-vi-ty-le.html` · `mock-the-vi-pham-2-che-do.html` · `mock-3-thanh-cong-cu-mot-khuon.html` | 3 bản vẽ P-A/P-B/P-C, Hoà đã duyệt |
| `docs/phieu-giao/P-A…P-F` | 6 phiếu giao việc theo khuôn ⓪+8 ô |
| `scripts/chup-man-duyet-mat.mjs` | máy chụp màn đổ thẳng vào thư mục Drive |

## Code đã ship
`lib/units` (đơn vị + tỉ lệ, 41 test) · `lib/review/hien-thi-luat.ts` (2 chế độ + trục nguồn, 61 khẳng định) ·
`lib/commands/toolbar-source.ts` (3 toolbar đọc chung sổ lệnh, `grep lib/commands` 0/0/0 → 4/2/2, 167 ca).

## Luật/cơ chế MỚI trong phiên (chi tiết ở `docs/00-CHOT.md` tra theo ngày 16/08)
Vai T đổi thành điều phối · phiên phụ phải có mặt · cửa duyệt mắt qua Drive 2 chiều · vòng tự đóng
(điều kiện đích + trần 5 vòng) · tách phiên đọc-dữ-liệu-lạ · ⓪b tiền đề hạ tầng + ⓪c T kiểm mốc trước
khi phóng · hệ màu 3 lớp · bỏ vàng đồng · nền sáng theo Apple · nguyên tắc dùng kính vỏ/ruột · lớp phủ
chuyển sắc cục bộ · ba tầng ánh sáng · ba nấc là nhịp chung · thu gọn↔sổ ra là hai ngôn ngữ · luật thanh
tiến trình · ưu tiên ký hiệu hơn chữ · Vitals neo theo ngữ cảnh · ô giải nghĩa có hình · kéo thả module.

## Lỗi của T trong phiên — ghi để không lặp
① phóng agent không kiểm mốc worktree (lệch 167 commit, 3 agent chạy phí) ② kiểm đăng nhập bằng URL nên
lọt cả lô 17 ảnh chụp lúc chưa đăng nhập ③ ghi sai địa chỉ hằng số nhấn giữ (grep trả đúng đường dẫn mà T
nhớ hộ máy) ④ đề xuất bỏ ảnh nền vì sợ khó ⑤ dặn "làm mờ mạnh nền" trong khi ảnh tham chiếu đều sắc nét
⑥ ghi nhầm danh sách nợ, suýt bắt phiên sau dựng lại thứ đã có.
