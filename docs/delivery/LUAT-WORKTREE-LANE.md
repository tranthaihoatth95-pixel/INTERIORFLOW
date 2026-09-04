# LUẬT VẬN HÀNH WORKTREE — hai cái bẫy đã cắn thật, phải nạp vào MỌI phiếu

> Rút từ hai lane ngày 04/09. Cả hai không phải lỗi của agent — phiếu không dặn.

## 🔴 BẪY 1 · CSDL DÙNG CHUNG — nguy hiểm nhất, im lặng nhất

`node_modules` trong worktree là **symlink sang repo chính**. Prisma neo `file:./dev.db` **tương đối theo vị trí schema**, mà schema nó thấy là schema của **repo chính** ⇒ dev server chạy trong worktree **ghi thẳng vào CSDL của repo chính**.

**Đã xảy ra**: lane G1 chạy nghiệm thu, **2 tài khoản kiểm thử lọt vào `/home/user/INTERIORFLOW/prisma/dev.db`**. Lane tự phát hiện, tự xoá, MAIN xác minh lại — sạch. Nhưng nếu lane đó xoá dữ liệu thay vì thêm thì **không ai biết**.

⇒ **BẮT BUỘC nạp vào mọi phiếu có chạy dev server / Prisma trong worktree:**
```
export DATABASE_URL="file:$(pwd)/prisma/dev.db"     # ĐƯỜNG TUYỆT ĐỐI, đặt TRƯỚC khi chạy gì
cp /home/user/INTERIORFLOW/prisma/dev.db prisma/dev.db   # bản riêng, không dùng chung
```
Và **kiểm sau khi xong**: đếm bản ghi trong CSDL repo chính, phải khớp trước/sau.

## 🟠 BẪY 2 · WORKTREE KHÔNG CÓ `node_modules`

Worktree mới **không có** `node_modules` ⇒ `npm test` trả **rc=123**, `tsc` không chạy. Lane G3 tự nối symlink; lane khác có thể tưởng test hỏng.

⇒ Nạp vào phiếu: `[ -d node_modules ] || ln -s /home/user/INTERIORFLOW/node_modules node_modules`
(symlink bị gitignore nên không lọt commit — đã kiểm.)

## 🟡 BẪY 3 · MỐC CẮT LỆCH

Ba lane đã bị cắt worktree lệch **128 commit** so với mốc phiếu khai. Hai lane dừng đúng ở ô ⓪b, một lane tự sửa sau khi MAIN cho phép.

⇒ Nạp ⓪b vào **mọi** phiếu: đo `git rev-list --count HEAD..origin/<nhánh>`; lệch > 0 **và** cây sạch **và** `merge-base --is-ancestor` rc=0 ⇒ được `merge --ff-only`; phân kỳ hoặc cây bẩn ⇒ **DỪNG, báo MAIN**. Cấm `--force`, cấm rebase.

## ⚙️ KHỐI DÁN SẴN cho phiếu mới
```bash
set -euo pipefail
[ -d node_modules ] || ln -s /home/user/INTERIORFLOW/node_modules node_modules
[ -f prisma/dev.db ] || cp /home/user/INTERIORFLOW/prisma/dev.db prisma/dev.db
export DATABASE_URL="file:$(pwd)/prisma/dev.db"
[ -f .env ] || cp /home/user/INTERIORFLOW/.env .env 2>/dev/null || true
```

## 🔴 BẪY 1b · `DATABASE_URL` TUYỆT ĐỐI VẪN CHƯA ĐỦ — phát hiện 04/09

Lane G2 suýt ghi một hàng `User` vào CSDL repo chính **dù đã đặt `DATABASE_URL` tuyệt đối**.
Lý do sâu hơn bẫy 1: **`@prisma/client` là symlink**, nên Prisma nạp `.env` theo **đường THẬT của module** (tức repo chính), **không theo `cwd`**. Biến môi trường của bạn có thể bị `.env` kia đè.

⇒ Cách chắc chắn: **truyền thẳng URL vào client**, đừng nhờ `.env`:
```js
new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })
```
Và **vẫn phải đếm lại** bản ghi CSDL repo chính trước/sau.
⚠️ Khi nhiều lane chạy song song, **đếm-trước-sau không còn là bằng chứng sạch** — phải truy theo **dấu vết của chính mình** (tiền tố email/tên dự án), không chỉ theo tổng số.

## 🔴 BẪY 3b · MỐC CẮT LỆCH — LẦN THỨ HAI, và MAIN KHÔNG TỰ KIỂM ĐƯỢC SAU KHI XONG

Lô 04/09 thứ hai: một lane khai phiếu ghi mốc `5cb4db6c` nhưng HEAD thật lúc nó vào là
**`f43de304` — lệch 192 commit**. Lane tự chữa đúng quy trình ⓪b (`merge --ff-only`) rồi mới làm.
Xác minh lại: `git rev-list --count f43de304..5cb4db6c` = **192**, `git cat-file -t f43de304` = commit.

⚠️ **Điều MAIN cần biết, và đã suýt bị lừa**: `git worktree list` in **mốc HIỆN TẠI**, không in
**mốc lúc cắt**. MAIN chạy `git worktree list` ngay sau khi phóng và thấy cả ba worktree ở
`5cb4db6c` ⇒ **tưởng cắt đúng**. Thật ra ít nhất một cái cắt ở `f43de304` rồi tự nâng lên trước
khi MAIN nhìn. ⇒ **Không có cách nào cho MAIN xác minh mốc cắt sau sự việc.**

**Hệ quả vận hành:** ô ⓪b **không phải nghi thức thừa** — nó là **cơ chế phòng thủ duy nhất**
đối với loại lỗi này, vì cả người giao lẫn người kiểm đều không thấy được mốc cắt. Hai lần trong
một ngày nó cứu một lô agent khỏi chạy mù (lần đầu 128 commit, lần này 192). **Cấm gỡ ⓪b khỏi
phiếu để cho gọn.**
