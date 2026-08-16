# P-L · ĐÓNG KHE HỞ TÊN TOKEN GIỮA MOCK VÀ CODE + sửa tên cấn

> Khuôn §3 `docs/HOP-DONG-PHOI-HOP-T.md`. Tự chứa.
> **THẺ VAI [Đ4]:** phiên phụ cấp CHẶNG/LUỒNG. Chạm biên (đổi GIÁ TRỊ màu, đổi kiểu/union,
> đổi hợp đồng lệnh) → **DỪNG + đề xuất lên T**. Phiếu này **đổi TÊN, không đổi GIÁ TRỊ**.

---

## ⓪b TIỀN ĐỀ HẠ TẦNG
```bash
git log --oneline -1              # mốc mới nhất: 0471b54
git rev-list --count HEAD..main   # phải ra 0
```
Lệch > 0 → **DỪNG**, báo T. Có một phiên phụ khác chạy song song, nó **chỉ tạo một tệp mock MỚI**.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — xác nhận/bác bỏ từng ý (T đã đo, bạn đo lại)
1. *"Đợt trước đổi `--mat-*` → `--nen-mo-*` trong **code** (114 dòng/43 tệp, `grep` code nay = 0), **nhưng KHÔNG đụng `docs/mocks/`** vì lúc đó thư mục đó đang bị phiên khác giữ ⇒ **mock và code nay lệch tên token**. T đếm được **622 dòng `--mat-` trong `docs/mocks/`**."*
2. *"Class CSS `.mat-*` (khác biến `--mat-*`) **chưa đổi** — T đếm ~**70 chỗ**. Nó phải đi **cùng lượt** với mocks, không tách."*
3. *"`--nen-mo-hairline` là **TÊN CẤN**: nó là **đường kẻ**, không phải nền. T đếm ~**80 chỗ dùng**."*
4. *"`matId` (mã vật liệu nối tới giá, `lib/cad/materials.ts`) **KHÁC HẲN**, tuyệt đối không đụng."*

Số của T lệch số bạn đo → **báo lại số đúng**, đừng im lặng dùng số của T (hôm qua T đã sai số một lần).
Bác ý nào → **DỪNG**, báo T kèm `file:dòng`.

## ① BỐI CẢNH

**Mock là NGUỒN SỰ THẬT giao diện** — luật QUY TRÌNH DESIGN 02/08: *phiên code LÀM GIỐNG HỆT mock, không sáng tác*. Nay mock gọi tên token bằng tên **đã chết trong code**. Không gãy lúc chạy (mock tự khai token của nó), nhưng:
- phiên sau port từ mock sang code sẽ mang tên cũ vào, **đẻ lại đúng thứ vừa dọn**;
- và luật *một-nguồn* đang **hở một khe** ngay ở chỗ nó được tuyên bố mạnh nhất.

Khe này T tự mở ra khi khoá phạm vi để tránh va chạm agent. **Mở khe có ý thức thì phải đóng có hạn**, không để nó thành nợ vô thời hạn.

## ② ĐỌC TRƯỚC
| File | Vì sao |
|---|---|
| `app/globals.css` — khối khai `--nen-mo-*` | tên hiện tại + comment lý do đổi |
| `docs/00-CHOT.md` — mục **"[16/08 đợt T #2, lượt 2 …]"** | ghi rõ hai khe hở này + ba tên P-K thấy vướng |
| `docs/bao-cao-phien/2026-08-16-P-K-tu-dien-may.md` | cách P-K đổi đợt trước — **làm y hệt**, đừng chế cách thứ hai |
| `docs/nc/NC-TU-DA-NGHIA-2026-08-16.md` §V5 dòng #3 | lý do gốc của việc đổi tên |

## ③ VÙNG FILE
**ĐƯỢC ghi:**
- **9 tệp mock ĐANG CÓ** trong `docs/mocks/` — **liệt kê bằng `ls` NGAY ĐẦU LƯỢT và chỉ sửa đúng danh sách đó**. ⛔ Tệp mock nào **xuất hiện trong lúc bạn làm** là của phiên khác, **KHÔNG đụng**.
- `app/globals.css` · `components/**` · `lib/**` (chỉ để đổi tên class/biến)
- `docs/bao-cao-phien/2026-08-16-P-L-dong-khe-ho-token.md` (mới)

**CẤM:** `scripts/frontier-registry.mjs` · `docs/00-CHOT.md` · `docs/CHOT-16-08-BAN-DUNG.md` · `docs/memory/` · `STATUS.md` · `CHANGELOG.md` · mọi tệp mock mới sinh trong lượt.
**KHÔNG git. KHÔNG dev server.**

## ④ VIỆC

### V1 — Mocks đổi `--mat-*` → `--nen-mo-*` (marker: `nenMo`)
Đổi **tên**, giữ **nguyên giá trị**. Mỗi mock tự khai token của nó ⇒ đổi cả **chỗ khai** lẫn **chỗ dùng** trong cùng tệp, và **màu hiển thị phải không đổi một chút nào**.
📏 Nghiệm thu: `grep -rn -- "--mat-" docs/mocks/` **về 0** · mở lại vài mock, **cả hai theme vẫn y như cũ**.

### V2 — Class `.mat-*` (marker: `classMat`)
Đổi theo cùng lối. ⚠️ Class và biến là **hai thứ khác nhau** — đừng gộp một lần thay-thế-hàng-loạt rồi làm hỏng cái kia. `.mat-panel` (class) và `--mat-panel` (biến) từng tồn tại song song; đọc kỹ trước khi thay.
📏 Nghiệm thu: không còn class `.mat-*`; `tsc` 0; các panel kính **nhìn y như cũ**.

### V3 — Sửa tên cấn `--nen-mo-hairline` (marker: `hairline`) 🔴
Nó là **ĐƯỜNG KẺ mảnh**, không phải **nền mờ** — đặt vào họ `--nen-mo-*` là sai ngay từ nghĩa. Đây đúng loại lỗi mà cả đợt từ-đa-nghĩa sinh ra để diệt, mà lại do chính đợt đó đẻ ra.
Chọn tên **nói đúng nó là gì**, tiếng Việt, ≤ 3 từ, **không trùng nghĩa nào đang dùng** (kiểm bằng `soi:tu-dien` trước khi chốt). Ghi **lý do chọn** vào comment tại chỗ khai.
⚠️ **Nếu bạn đo ra nó thật sự đang được dùng làm NỀN chứ không phải đường kẻ** thì tên cũ đúng — **báo lại, đừng đổi**. Đọc chỗ dùng trước khi kết luận.

### V4 — PH-3: `--success` làm NỀN (marker: `successNen`)
P-J đo: `--success` bản **tối** (`#46b876`) đặt **chữ trắng lên trên** chỉ **2,51:1** — dưới ngưỡng đọc-được.
Việc: **quét xem app có chỗ nào đang dùng `--success` làm NỀN có chữ đè lên không** (khác hẳn dùng làm **màu chữ** hoặc **chấm nhỏ** — hai cái đó không dính ngưỡng này).
- Có → **báo cáo kèm `file:dòng` + số đo**, và sửa **nếu nằm trong vùng ③**; ngoài vùng thì **chỉ báo, không sửa**.
- Không có → nói thẳng *"không có chỗ nào dính"*, kèm cách bạn quét. **Kết quả rỗng cũng là kết quả**, đừng bịa việc cho đủ mục.
⛔ **KHÔNG đổi giá trị `--success`** — đó là màu mang nghĩa nghề, đổi nó là biên liên chặng.

### V5 — Phần NHÌN THẤY ĐƯỢC của phiếu này (marker: `truocSau`)
Phiếu này là dọn dẹp, nhưng luật *"phiên phụ phải có mặt"* vẫn áp. **Mặt của nó là BẰNG CHỨNG KHÔNG ĐỔI**: chọn **3 mock đại diện** (một cái nhiều kính, một cái nhiều đường kẻ, một cái là bộ nền chung), với mỗi cái ghi vào báo cáo **bảng đối chiếu token trước → sau** + khẳng định **giá trị màu y hệt**.
Cách đo tuỳ bạn chọn, nhưng phải **đo được**, không phải *"tôi nhìn thấy giống"*. Nêu rõ cách đo trong báo cáo.

## ⑤ RÀNG BUỘC
- **ĐỔI TÊN, KHÔNG ĐỔI GIÁ TRỊ.** Một pixel màu đổi là hỏng phiếu.
- Cấm hex ngoài khối khai token. Thang bo **6/10/14/20 + `--r-full`**.
- **Trích mã điều khoản `docs/TRIET-LY-IF.md`** — **MỞ FILE ĐỌC SỐ, cấm nhớ hộ**: **[T1] một-nguồn** (`:14`) · **[Đ2] nhìn vào trong trước** (`:72`). Trích **nguyên văn**; số dòng T ghi mà sai thì **báo lại đúng số** — hôm qua T sai đúng kiểu này sáu lần.

## ⑥ NGHIỆM THU TỰ LÀM
```bash
npx tsc --noEmit
npm test
npm run soi:tu-dien
npm run soi:hinh-hoc
npm run soi:thao-tac
npm run soi:frontier
grep -rn -- "--mat-" docs/mocks/ components lib app | grep -v matId
```

## ⑥b ĐIỀU KIỆN ĐÍCH — VÒNG TỰ ĐÓNG
**ĐÍCH:** `tsc` 0 · `npm test` **0 fail** · `soi:frontier` 0 lệch · `soi:tu-dien` **không tăng** (nền: 0 lệch nhãn · 205 chỗ cảnh báo — con số 205 **được phép GIẢM**, không được tăng) · `soi:hinh-hoc` 10 và `soi:thao-tac` 31+193 **giữ mốc** · `grep -- '--mat-'` **về 0 toàn repo** (trừ `matId`) · **0 class `.mat-*`** · bảng trước→sau của V5 chứng minh **giá trị màu không đổi**.
**VÒNG:** chưa đạt → tự sửa, **trần 5 vòng**. **QUÁ TRẦN → DỪNG**, nộp kèm bảng *"vòng nào hỏng vì gì"*. **CẤM** khai đạt khi chưa đạt.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-16-P-L-dong-khe-ho-token.md`, khuôn 6 phần `docs/CLAUDE.md`.

## ⑦b CHƯA CHẮC — bắt buộc, trống cũng ghi "không có"
Bắt buộc phủ: `grep` có phủ hết dạng dùng token không (**ghép chuỗi động** `` `--mat-${…}` `` — kiểm và nói rõ) · V5 bạn **đo** giống nhau hay **nhìn** giống nhau · V3 bạn đọc **bao nhiêu** trong 80 chỗ dùng trước khi kết luận nó là đường kẻ · V4 quét bằng cách nào và **chắc chắn bỏ sót dạng nào**.

## ⑦c HẠN DÙNG KẾT LUẬN
*"Hết đúng khi …"* — ít nhất phủ: khi **theme sáng đổi sang bản canh-Apple** · khi màu nhấn thứ hai chốt · khi các cụm đổi tên còn lại (P-K liệt kê 8 cụm) được thi hành.

## ⑧ DÂY MÁY
`chong-lech-dinh-nghia` · `he-mau-2-lop`. Bạn **không** sửa registry — T flip sau audit.
