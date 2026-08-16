# PHIẾU P-S — MÁY ĐỐI CHIẾU SỔ ↔ CODE

> Giao: T · 17/08 · vùng khoá: `scripts/soi-doi-chieu.mjs` (tạo mới) + `package.json` (thêm 1 dòng script) + báo cáo.
> ⛔ **KHÔNG đụng** `scripts/frontier-registry.mjs` (T giữ) · không đụng `scripts/soi-*.mjs` cũ · không đụng `lib/` `components/` `app/` `docs/mocks/`.

---

## ⓪b TIỀN ĐỀ HẠ TẦNG — trả lời TRƯỚC
```
git log --oneline -1
git rev-list --count HEAD..main
```
Lệch main > 0 → **DỪNG NGAY**, báo T. Mốc đúng khi phóng: `e57e2f6`.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — xác nhận hoặc BÁC, kèm file:dòng
> **TIỀN ĐỀ CỦA PHIẾU:** *"IF chưa có máy nào đối chiếu **văn bản sổ** với **code thật**. Năm máy soi hiện có (`soi:frontier` · `soi:tu-dien` · `soi:hinh-hoc` · `soi:thao-tac` · `soi:contract`) đều quét MỘT bên, nên bên nào cũng nhất quán với chính nó và không bên nào báo lỗi — đó là lý do ba khái niệm ma (`master tool` · `KB-5` · `.idfnotes`) sống được."*

→ `[XÁC NHẬN | BÁC BỎ | KHÔNG CÓ BẰNG CHỨNG]` + nguồn. **Bác thì DỪNG**, báo T — đừng làm tiếp theo tiền đề sai.

## ① BỐI CẢNH NGÀNH
Painpoint của **chính người xây IF** (Hoà + các phiên): sổ ghi một đằng, code một nẻo, và **không ai phát hiện được** vì mỗi bên đọc riêng thì đều hợp lý. Giá đã trả, đo được:
- `master tool` — **26 lần trong sổ / 0 trong code**; code gọi nó là `ToolWindow` (13 chỗ). Hiểu nhầm này ngốn **6 phiếu** làm sai hướng.
- `IF-ARCHITECTURE-COMPASS.md` — bản đồ sống, **19 ngày không ai đọc** vì con trỏ trong `CLAUDE.md` trỏ vào mẩu cụt 774 byte.
- **17/08 (sáng nay, 2 ca mới)**: sổ khẳng định *"`lib/materials`↔`ProductSpec` = 0 code"* nhưng [lib/materials/resolve.ts](../../lib/materials/resolve.ts) tồn tại từ 07/08; sổ khẳng định *"5 bộ hình nền chưa cắm vào Home"* nhưng `SystemWallpaper` đã mount ở [DongStudioHome.tsx:543](../../components/home/DongStudioHome.tsx).

Cả 5 ca cùng một họ: **khẳng định trong văn bản không được máy nào kiểm.** T bắt được 2 ca sáng nay **bằng tay, do tình cờ đo lại** — lần sau không có gì đảm bảo bắt được.

## ② ĐỌC TRƯỚC
| File | Vì sao |
|---|---|
| `docs/IF-KIEN-TRUC.md` §10 · §11 | định nghĩa *khái niệm ma* + luật ba tầng từ vựng — đây là thứ máy phải thi hành |
| `scripts/soi-tu-dien.mjs` | **anh em gần nhất** — học cách nó quét, loại trừ, in báo cáo; máy mới phải cùng họ |
| `scripts/soi-frontier.mjs` | khuôn báo cáo terminal + cách exit code |
| `scripts/frontier-registry.mjs` (chỉ ĐỌC) | dạng dữ liệu khai báo — **không sửa** |

## ③ VÙNG FILE
- **TẠO**: `scripts/soi-doi-chieu.mjs`
- **SỬA**: `package.json` — thêm đúng **một** dòng `"soi:doi-chieu": "node scripts/soi-doi-chieu.mjs"`
- **TẠO**: `docs/bao-cao-phien/2026-08-17-P-S-may-doi-chieu.md`
- Ngoài vùng này là vi phạm, kể cả khi sửa đúng.

## ④ VIỆC
**Máy làm ĐÚNG MỘT VIỆC: tìm những cái TÊN mà sổ nói tới nhưng code không có (và ngược lại).** Không ôm thêm.

1. **Rút định danh từ CODE** — quét `lib/` `components/` `app/` `scripts/`: tên `export` (hàm · type · interface · const · component), tên file, đuôi tệp xuất hiện trong chuỗi (`.idf` `.idfc` `.idfp` `.ifpack`), tên script trong `package.json`. Tất định bằng regex/AST — **cấm dùng AI**, cấm đoán.
2. **Rút định danh từ SỔ** — quét `docs/*.md` + `docs/nc/` + `docs/phieu-giao/`: chuỗi trong dấu backtick `` ` `` (đó đúng là quy ước sổ dùng để chỉ vật kỹ thuật) + tên có dạng `PascalCase`/`kebab-case.ts`.
3. **BÁO ĐỎ HAI CHIỀU**:
   - 🔴 **MA** — tên xuất hiện **≥3 lần trong sổ**, **0 lần trong code**. (Ngưỡng 3 để bỏ qua nhắc thoáng qua.)
   - 🟡 **CÂM** — tên có trong code, **0 lần trong sổ**, mà lại là *file/export cấp mô-đun* (thứ đáng lẽ bản đồ phải biết).
4. **DANH SÁCH THA** khai tường minh **kèm lý do ngay trong mã**, giống cách `soi-tu-dien.mjs` làm: nhật ký (`CHANGELOG` · `docs/memory/` · `docs/bao-cao-phien/` · `00-CHOT`) **không tính là sổ sống** — sửa nhật ký cũ là viết lại lịch sử. Ma đã khai tử (`master tool` · `.idfnotes` · `KB-5`) phải nằm trong danh sách tha **kèm dòng ghi rõ đã khai tử**, để nó không báo đỏ mãi.
5. **BÁO CÁO TERMINAL** — cùng họ 5 máy cũ: nhóm theo mức, mỗi dòng `tên · số lần trong sổ · số lần trong code · file:dòng đầu tiên`. Dòng tổng cuối cùng. **`exit 0`** ở phát đầu (đỏ-mà-chưa-sửa-được là cách nhanh nhất giết một máy soi — luật đã rút từ `soi:tu-dien`).
6. **TỰ KIỂM BẰNG CA THẬT**: máy phải bắt được `master tool` khi tạm gỡ nó khỏi danh sách tha. Dán kết quả thí nghiệm đó vào báo cáo — **đừng khai suông**.

## ⑤ RÀNG BUỘC
- **KHÔNG** `git` (không add/commit/stash/checkout) · **KHÔNG** chạy dev server · **KHÔNG** sửa test cũ.
- **KHÔNG dùng AI trong máy soi** — kiểm chuẩn là việc của MÁY: tất định, 0đ, chạy 10 lần ra 10 kết quả giống nhau (`00-CHOT` 15/08, Hoà duyệt).
- Chữ trong báo cáo terminal theo **từ điển máy** (`npm run soi:tu-dien` phải không thêm lệch mới).
- **Mã điều khoản** (mở `docs/TRIET-LY-IF.md` **đọc số**, đừng nhớ hộ): `[T2]` một cỗ máy nhiều mặt tiền · `[Đ2]` nhìn vào trong trước — **kiểm `soi-tu-dien.mjs` đã làm được phần nào trước khi viết dòng đầu tiên**; trùng thì mở rộng cái cũ, đừng đẻ máy thứ hai.
- **Về "mọi phiếu phải kèm giao diện"** — T đọc luật này cho máy soi là: *mặt của nó là **báo cáo terminal***, đúng như 5 máy cũ; **không** dựng trang web nào. T khai cách đọc này ra để Hoà bác được nếu sai.

## ⑥ NGHIỆM THU TỰ LÀM
```
npx tsc --noEmit
node scripts/soi-doi-chieu.mjs
npm run soi:tu-dien
npm run soi:frontier
```

## ⑥b ĐÍCH — VÒNG TỰ ĐÓNG, TRẦN 5 VÒNG
**ĐÍCH**: `tsc` 0 lỗi · máy mới chạy ra báo cáo đọc được · `soi:tu-dien` **không thêm lệch mới** · `soi:frontier` vẫn 0 lệch · thí nghiệm mục ④.6 bắt được `master tool`.
Chưa đạt → **tự sửa rồi chạy lại**, tối đa **5 vòng**. Quá trần → **DỪNG**, nộp bản chưa đạt kèm bảng *vòng nào hỏng vì gì*. **Cấm** nới điều kiện cho qua cửa.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-17-P-S-may-doi-chieu.md` — khuôn 6 phần (`docs/CLAUDE.md`): tổng quan → chi tiết có bằng chứng → tổng kết → đánh giá khách quan → ≥2 hướng → chọn 1 kèm lý do. Dán **nguyên văn** kết quả lệnh.

## ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc, trống cũng phải ghi "không có"
Cái gì đang **suy luận** chứ không **đo** · file nào chưa đọc mà có thể lật kết luận · **con số báo đỏ là SÀN hay TRẦN** (bao nhiêu ca chưa ai soi tay) · hai nguồn mâu thuẫn thì nêu **cả hai**, không chọn hộ T.

## ⑦c HẠN DÙNG KẾT LUẬN
Ghi rõ: *"kết luận này hết đúng khi …"*.

## ⑧ DÂY MÁY
Entry registry: **T tự mở** `may-doi-chieu-so-code` sau khi audit. **Agent KHÔNG sửa `frontier-registry.mjs`.**
