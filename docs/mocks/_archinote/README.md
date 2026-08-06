# _archinote — mock của app song song ArchiNote

Các file trong thư mục này thuộc **ArchiNote** (app "máy thu" chạy trên điện thoại — số đo,
ảnh hiện trường, ghi âm, ghi chú, tri thức — xem `CLAUDE.md`/`STATUS.md` phần "PHÂN VỊ HAI APP"),
**KHÔNG phải InteriorFlow**. Để riêng cho khỏi lẫn vào lúc port UI của InteriorFlow.

Danh sách (10 file, xác nhận bằng nội dung `<title>`/chuỗi "ArchiNote" trong file, không suy đoán
từ tên): `mock-an-bang-theo-doi.html` · `mock-an-ghi-chu-viet-tay.html` · `mock-an-so-tay.html` ·
`mock-an-thu-vien-tri-thuc.html` · `Cài đặt.html` · `Dự án.html` · `Ảnh đại diện.html` ·
`mock-if-anh-dai-dien.html` · `mock-if-cai-dat.html` · `mock-if-du-an.html`.

3 file cuối mang tiền tố `mock-if-*` (dễ tưởng là InteriorFlow) nhưng `<title>` bên trong ghi rõ
"· ArchiNote" — đã có bản kế nhiệm CHO INTERIOR FLOW cùng tên nhưng hậu tố `-v2` ở
`docs/mocks/mock-if-cai-dat-v2.html` / `mock-if-du-an-v2.html` / `mock-if-anh-dai-dien-v2.html`
(title ghi "InteriorFlow ·..."). Không xoá, không port nhóm trong thư mục này vào code InteriorFlow.

**KHÔNG XOÁ** — đây là tài sản của app anh em, chỉ dời chỗ để `docs/mocks/` gọn cho InteriorFlow.
Thư mục này nằm ngoài phạm vi quét của `scripts/check-mocks.mjs` (quét không đệ quy).
