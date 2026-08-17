# PHIẾU W — `soi:cam-dien`: máy canh "engine đã tới tay người dùng chưa"

> Giao: T · 17/08 · chạy song song với V1 (`components/nav`, `AppShell`) và V2 (`app/files`, `components/library`, `app/colors`).
> ⛔ Vùng ghi: `scripts/soi-cam-dien.mjs` (tạo) · `scripts/frontier-registry.mjs` (**chỉ nếu** cần thêm trường, xem ④.5) · `package.json` (thêm 1 dòng) · `docs/bao-cao-phien/2026-08-17-W-soi-cam-dien.md`.
> ⛔ **KHÔNG đụng**: `lib/**` · `components/**` · `app/**` · các `scripts/soi-*.mjs` khác.

---

## ⓪b TIỀN ĐỀ HẠ TẦNG
`git log --oneline -1` + `git rev-list --count HEAD..main`. Lệch > 0 → **DỪNG**, báo T.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — có quyền BÁC, và **hãy soi kỹ tiền đề này**
> **TIỀN ĐỀ:** *"IF có 6 máy soi (`frontier` · `tu-dien` · `hinh-hoc` · `thao-tac` · `contract` · `that`).
> **Không máy nào trả lời câu: engine này đã được `app/` hoặc `components/` gọi tới chưa.**
> `soi:that` gần nhất — nhưng nó làm ở cấp **tên xuất** (`export`), không phải cấp **module**, và
> mục 🟡 của nó chỉ có 10 dòng. Nên đây là **máy mới**, không phải mở rộng máy cũ."*

→ `[XÁC NHẬN | BÁC BỎ | KHÔNG CÓ BẰNG CHỨNG]` + file:dòng.
⚠️ **Đây đúng là loại tiền đề đã sai hai lần hôm nay** (*"chưa có máy đối chiếu"* — máy đã có 9 ngày). **Đọc mã của cả 6 máy trước khi xác nhận.** Nếu mở rộng `soi:that` rẻ hơn dựng máy mới thì **BÁC và nói thẳng**.

## ① BỐI CẢNH — cái giá đo được
Hoà đặt bài chống **công cốc**. Đo trong ngày, công cốc có 4 loại; loại đắt nhất là **xong mà không ai dùng được**:

| Đo 17/08 | Số |
|---|---|
| `lib/idfc-import` | **3.339 dòng · 0 nơi gọi từ bất kỳ đâu** — 5 tệp chỉ gọi lẫn nhau, một hòn đảo. Frontier ✅, 64 test xanh, proof thật (ghế Lincoln 327) |
| `lib/ui/thao-tac-glyph.tsx` | 240 dòng · 0 nơi gọi |
| `lib/wallpaper/contrast.ts` | 171 dòng · 0 nơi gọi — **chưa ai khai ở đâu** |
| `lib/slide-templates.ts` | 228 dòng · 0 nơi gọi |
| `lib/ai/web-lookup.ts` | 355 dòng · 0 nơi gọi — đây là **cửa bảo mật** (chặn đẩy nội dung dự án ra ngoài) |
| Nợ nghiệm thu mắt | **71 xong-máy đối 1 qua mắt** |

Loại ①②④ tốn **phút**. Loại này tốn **tuần**.

## ② ĐỌC TRƯỚC — bắt buộc
| File | Vì sao |
|---|---|
| `docs/nc/DO-ENGINE-7-MANH-2026-08-17.md` | **Bản đo tay của phiên Đ1 — đây là đặc tả thật của máy bạn sắp viết.** Đọc trọn, gồm cả §5 CHƯA CHẮC |
| `scripts/soi-that.mjs` | anh em gần nhất; xem nó quét, loại trừ, in báo cáo thế nào |
| `scripts/soi-tu-dien.mjs` | khuôn **danh sách tha kèm lý do ngay trong mã** |
| `scripts/frontier-registry.mjs` | dạng `bangChung: [{dir, mau}]` — cần cho ④.5 |

## ③ HAI CẠM BẪY ĐO LƯỜNG — phiên Đ1 đã trả giá, **đừng trả lại**
1. 🔴 **Tìm theo chuỗi đường dẫn KHÔNG ĐỦ.** Phép đo v1 của Đ1 báo oan **4 module** là kho chết, vì mã thật import bằng **đường tương đối** (`'../pdf-font'`, không chứa chữ `lib/`). **Phải dựng bộ giải đường dẫn thật**: xử lý `@/…`, `./`, `../`, thiếu đuôi, và `index.ts`.
2. 🔴 **Nạp động không thấy được bằng import.** `cad/dwg-worker.ts` (349) + `dxf-worker.ts` hiện *0 nơi gọi* nhưng **sống thật**, nạp qua `new Worker(new URL(…))` tại `cad/dxf-open.ts:40`. **Ai tin bảng mà xoá là giết đường nhập DWG/DXF.** ⇒ máy phải **dò cả `new Worker(new URL(...))` và `import(...)` động**, và cái nào không dò nổi thì **khai vào danh sách tha kèm lý do**.
3. **Loại trừ theo *tên thư mục chứa chữ `worktrees`***, không so chuỗi cứng — bug này đã phải vá **ba lần**.

## ④ VIỆC
1. `scripts/soi-cam-dien.mjs` — quét `lib/**`, mỗi **module** (thư mục cấp 1 hoặc tệp rời) trả:
   `tên · dòng (không test) · số nơi gọi từ app|components · số nơi gọi từ lib khác · trạng thái`.
2. **Ba trạng thái**, in kèm nhãn chữ (**không chỉ màu**): 🟢 `SỐNG` (≥1 nơi gọi từ `app/` hoặc `components/`) · 🔵 `CHỈ NỘI BỘ` · 🔴 `KHO CHƯA MỞ` (0 nơi gọi ngoài test của chính nó).
3. **Sản phẩm phụ bắt buộc — SỔ TRA MÁY SẴN CÓ**: in kèm **dòng đầu docstring** của mỗi module (*"máy này làm việc gì"*). Đây là thứ diệt loại công cốc **"xây lại cái đã có"** — và nó gần như miễn phí vì máy đã phải đọc hết tệp rồi.
4. **Nghiệm thu ngược bằng ca đã biết** — dán kết quả vào báo cáo:
   · `lib/idfc-import` phải ra **KHO CHƯA MỞ**
   · `lib/pdf-font.ts` phải ra **CHỈ NỘI BỘ** (không được báo oan là chết)
   · `cad/dwg-worker.ts` **không được** báo là chết
   · `lib/store.ts` phải ra **SỐNG**
   Sai một ca là thuật toán chưa đạt.
5. **ĐỐI CHIẾU FRONTIER** — với mỗi entry `trangThai:'xong'`, tra `bangChung` của nó: nếu mọi tệp khớp đều nằm trong module **KHO CHƯA MỞ** ⇒ in cảnh báo `✅ nhưng CHƯA CẮM ĐIỆN`. **Chỉ IN, không tự sửa registry** (T flip sau audit).
6. Nối `package.json`: `"soi:cam-dien": "node scripts/soi-cam-dien.mjs"`. **`exit 0`** — đỏ-mà-chưa-sửa-được là cách nhanh nhất giết một máy soi.

## ⑤ RÀNG BUỘC
- **KHÔNG dùng AI trong máy soi** — tất định, 0đ, chạy 10 lần ra 10 kết quả giống nhau (Hoà chốt 15/08).
- **KHÔNG** lệnh `git` ghi · **KHÔNG** dev server.
- Chữ báo cáo theo từ điển máy (`npm run soi:tu-dien` không thêm lệch).
- Mã điều khoản: **mở `docs/TRIET-LY-IF.md` đọc số**, cấm chép theo phiếu.
- ⚠️ **Khai thẳng giới hạn ngay trong báo cáo terminal**: máy này chứng minh **có đường dây**, **không** chứng minh **có nút bấm**. Một dòng, in mỗi lần chạy.

## ⑥b ĐÍCH — VÒNG TỰ ĐÓNG, TRẦN 5 VÒNG
`tsc` 0 · `npm test` 0 fail · `soi:tu-dien` không thêm lệch · `soi:frontier` vẫn 0 lệch ·
**4/4 ca nghiệm thu ngược ở ④.4 đúng** · `grep -c worktrees` trong kết quả = **0**.
Quá trần → **DỪNG**, nộp kèm bảng *vòng nào hỏng vì gì*. **Cấm nới điều kiện cho qua cửa.**

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-17-W-soi-cam-dien.md` — khuôn 6 phần, dán **nguyên văn** kết quả chạy.

## ⑦b CHƯA CHẮC — bắt buộc
Đặc biệt: **bao nhiêu module máy KHÔNG dò nổi cách nạp** · con số KHO CHƯA MỞ là **sàn hay trần** · có dạng import nào (ghép chuỗi, biến trung gian, re-export) máy còn mù.

## ⑦c HẠN DÙNG KẾT LUẬN
Ghi rõ *"kết luận này hết đúng khi …"*.

## ⑧ DÂY MÁY
Entry registry: T tự mở sau audit. **Agent KHÔNG sửa `trangThai` của entry nào.**
