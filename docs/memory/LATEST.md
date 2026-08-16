# LATEST — bản nén trí nhớ bối cảnh IF (ghi đè mỗi phiên lớn)

> **Đọc file này ĐẦU TIÊN.** Luật giữ bản nén: **CHỈ tên + đường dẫn + một câu. Cấm chép nội dung.**
> Không thay `STATUS.md` / `docs/00-CHOT.md` / `CHANGELOG.md` — là lớp tổng hợp nhanh thêm vào.

**Cập nhật lần cuối: 2026-08-16 (đợt T #2 — bàn giao diện)**

## Đang ở đâu
Đợt giao diện lượt 2. **T đã đổi vai thật sự**: không build, chỉ nghiên cứu · kiểm chứng · điều phối —
phóng **5 phiên phụ** (P-G ô giải nghĩa · P-H thanh tiến trình · P-I từ đa nghĩa · P-J bàn thử màu ·
P-K từ điển máy). Kết phiên **0 lệch** · `tsc` 0 · `npm test` 0 fail.

## ⭐ Việc đáng nhớ nhất phiên: CƠ CHẾ "AGENT ĐƯỢC PHÉP SOI NGƯỢC T" SINH LỜI ĐẬM
**Sáu lỗi của T, cả sáu do agent bắt, T verify rồi nhận** — không lỗi nào máy soi bắt được:
mã `[Đ1]`↔`[Đ2]` trích sai diện rộng · dẫn NT-8 thay vì NT-10 · sai lý do `<button disabled>` ·
xếp nhầm `module` vào từ đa nghĩa · số dòng `:69/:71` thay vì `:70/:72` (**ngay trong dòng ban luật
cấm nhớ hộ**) · gán `[N1]` cho *"người quyết cuối"* (thật ra **[T5]**).
⇒ Ô ⓪ TIỀN ĐỀ + quyền bác bỏ trong khuôn phiếu là thứ đáng giữ nhất của mô hình T.

## Bốn chốt của Hoà trong phiên
1. **Màu nhấn thứ hai: dựng CẢ HAI để so bằng mắt** — mòng két ↔ mận. 🔴 T từng đọc chữ "1" thành
   "Hoà chốt mòng két" → **sai**, đã đính chính. *Hoà nói ngắn ≠ Hoà đã chốt.*
2. **Từ đa nghĩa: duyệt cả 9 dòng đỏ** (không chỉ 3 dòng T đề xuất).
3. **Loại icon: Hoà giao T quyết** → T chốt **7 loại, có sửa**.
4. **Nút mờ 2,54:1: Hoà giao T quyết** → T chốt **sửa ngay bằng TOKEN**, không bằng con số.
5. Giữa phiên Hoà thêm: *"phần hiệu ứng tiến trình nên thêm sáng"* → đã làm, và nó **sửa luôn lỗ a11y**.

## Việc tiếp — nợ còn lại
1. **Đóng khe hở token**: `docs/mocks/` còn **622 dòng `--mat-`** trong khi code đã sang `--nen-mo-*`
   ⇒ mock và code lệch tên, mà mock là nguồn sự thật. Kèm class `.mat-*` (~60 nơi) + `--nen-mo-hairline`
   **tên cấn** (nó là đường kẻ, không phải nền).
2. **`simpleCoChiTiet`** — thước chấm lại 3 phương án chữ ký (nợ #3 chưa mở).
3. **Mục biểu tượng tệp** — 2-3 cách xử màu (nợ #5 chưa mở).
4. **PH-3**: `--success` bản tối `#46b876` chữ trắng chỉ **2,51:1** — chưa quét app xem chỗ nào dính.
5. **8 cụm đổi tên bàn giao** (P-K liệt kê, cố ý không thi hành) — nặng nhất `measured|inferred|verified`
   509 nơi **chạm `.idf`/`.idfc` đã ghi ra đĩa** ⇒ bắt buộc bảng nâng cấp; `khối`→`bước` **đụng chốt
   02/08 Hoà đã ký** ⇒ Hoà tự bấm.

## ⛔ CHỜ HOÀ
1. **Duyệt mắt 3 bản vẽ trên Claude Design** — ô giải nghĩa · thanh tiến trình · bàn thử màu.
2. **Chọn màu**: mòng két (sạch, nhưng đúng góc ai cũng dùng) ↔ mận (khác biệt, nhưng ngồi cạnh vùng đỏ).
3. **Một câu ở mục 6 bản vẽ thanh tiến trình**: hai thanh cùng 62% khác độ dài vệt — Hoà đọc ra
   *tốc độ* không? Không đọc ra thì **cắt** (dưới 10 dòng).
4. Nợ nghiệm thu mắt: **70 xong-máy đối 1 qua mắt**.

## Tài liệu / bản vẽ mới sinh trong phiên
| Đường dẫn | Một câu |
|---|---|
| `docs/CHOT-16-08-BAN-DUNG.md` | ⭐ **bảng đè chồng** — 6 chủ đề bị chốt 2-5 lượt trong ngày 16/08, bản nào đang dùng |
| `docs/nc/NC-TU-DA-NGHIA-2026-08-16.md` | 8 từ đo được + bảng 13 dòng, Hoà duyệt 9 dòng đỏ |
| `docs/mocks/mock-o-giai-nghia.html` · `mock-thanh-tien-trinh.html` · `mock-ban-thu-2-huong-mau.html` | 3 bản vẽ, **đã đẩy lên Claude Design** |
| `docs/phieu-giao/P-G…P-K` | 5 phiếu theo khuôn ⓪+⓪b+8 ô |

## Code đã ship
`components/ui/Tooltip.tsx` prop `hinh` + `lib/ui/thao-tac-glyph.tsx` (6 hình, **cấm-làm-nút khoá bằng
test**) · `ToolbarChip` bỏ `title` → `aria-disabled` + `aria-describedby` · `lib/ui/tien-trinh.ts` +
`components/ui/LightBar.tsx` (64 test, **bịa số là tsc đỏ**) · `soi:tu-dien` hết mù `.md` (+62 tệp) ·
`--mat-*` → `--nen-mo-*` (114 dòng/43 tệp) · token `--mo-vo-hieu` theo theme.

## Luật/cơ chế MỚI trong phiên (chi tiết `docs/00-CHOT.md` ngày 16/08)
Không dùng worktree isolation, thay bằng **khoá phạm vi file rời nhau trong cây chính** (⓪c thi hành thật) ·
**giảm chói cắt ánh kim, không bao giờ cắt độ đọc** · **duyệt CÁI TÊN ≠ duyệt cú đổi hàng loạt** ·
**siết máy soi theo TỪNG TỪ** (*số đứng yên là máy soi đã chết mà chưa ai tuyên bố*) · **cấm trích số góc
màu từ sổ**, đọc sống từ `globals.css` · **OKLCH là không gian màu chuẩn** (HSL chỉ đối chiếu) ·
**ban một luật xong không miễn cho người ban khỏi luật đó**.

## Lỗi của T trong phiên — ghi để không lặp
① sáu lỗi mã điều khoản/số dòng, gốc chung là **nhớ hộ máy thay vì mở file đọc** ② đọc ý Hoà từ một ký
tự rồi ghi vào sổ như đã chốt (lần thứ hai trong ngày) ③ ghi sai lý do kỹ thuật của `<button disabled>`
mà không đo ④ xếp nhầm một từ vô hại vào danh sách đa nghĩa.
