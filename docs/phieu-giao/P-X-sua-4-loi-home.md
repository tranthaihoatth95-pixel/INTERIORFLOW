# P-X · SỬA 4 LỖI HOME — Hoà soi ảnh chụp thật, chỉ tận nơi

> Khuôn §3 `docs/HOP-DONG-PHOI-HOP-T.md`. Tự chứa.
> **THẺ VAI [Đ4]:** phiên phụ cấp CHẶNG/LUỒNG, vùng `components/home`. Chạm biên (đổi schema,
> đổi router, đổi token) → **DỪNG + đề xuất lên T**.

## ⓪b TIỀN ĐỀ HẠ TẦNG
```bash
git log --oneline -1              # mốc: ebb8aa9
git rev-list --count HEAD..main   # phải ra 0
```
Lệch > 0 → DỪNG, báo T.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — T đã đo, bạn đo lại
1. *"`lib/home/greeting.ts:62` lấy **từ cuối** của tên tài khoản làm tên chào (`.split(/\s+/).pop()`); `:64` ghép `Chào ${firstName}`. Ảnh chụp thật ra **"Chào hoa"** — thường và **mất dấu** ⇒ tên đang lưu là `hoa`."*
2. *"Số thứ tự ô **gán cứng tại chỗ gọi** trong `components/home/DongStudioHome.tsx` (`index=\"03\"` `:309` · `\"05\"` `:323` · `\"07\"` `:331` · `\"08\"` `:338`…), trong khi widget **render có điều kiện** (`hasC`/`hasD`/`hasE`/`hasG` `:359-362`) ⇒ widget tự ẩn thì số **đứt quãng**."*
3. *"Ảnh chụp 17/08 cho thấy dãy số thật là **01 · 02 · 04 · 05 · 06 · 08** — thiếu 03 và 07; và ô cuối *LƯỚI TÍCH LUỸ STUDIO* **không có số nào**."*

Số của T lệch số bạn đo → **báo lại số đúng**. Bác ý nào → DỪNG.

## ① BỐI CẢNH
Hoà mở ảnh chụp màn thật trên điện thoại và chỉ **bốn chỗ**. Đây là **lần đầu** lô ảnh duyệt-mắt
sinh ra finding thật — nút thắt của dự án đang là **70 việc xong-máy đối 1 việc qua mắt**, nên mỗi
finding từ mắt Hoà **đắt hơn nhiều** một việc xong-máy.

## ② ĐỌC TRƯỚC
`components/home/DongStudioHome.tsx` (đọc HẾT — đây là tệp chính) · `lib/home/greeting.ts` ·
`components/home/widgets/WidgetCard.tsx` · `components/home/widgets/types.ts` ·
`docs/IF-KIEN-TRUC.md` **§7 ba nấc = ba công năng** (luật chống kéo dãn) ·
`docs/CHOT-16-08-BAN-DUNG.md` **A5** (card ba nấc) và **B3** (card sổ ra khi bấm).

## ③ VÙNG FILE
**ĐƯỢC ghi:** `components/home/**` · `lib/home/greeting.ts` · `app/globals.css` (**CHỈ THÊM** class) ·
`docs/mocks/mock-home-sua-4-loi.html` (mới) · `docs/bao-cao-phien/2026-08-17-P-X-sua-4-loi-home.md` (mới).
**CẤM:** `scripts/**` (T đang sửa máy chụp) · `prisma/**` · `docs/00-CHOT.md` · mock nào đang có ·
`components/studio/**` · `lib/resume.ts`.
**KHÔNG git. KHÔNG dev server.**

## ④ VIỆC

### V1 — Lời chào (marker: `loiChao`)
Ảnh ra **"Chào hoa"**. Hai nửa, làm cả hai:
- **Viết hoa chữ cái đầu** — rẻ, luôn đúng, không đoán gì.
- 🔴 **Dấu thì KHÔNG đoán được** — `hoa` không suy ra `Hoà` (còn có Hoa, Hoá, Hoạ). ⇒ phải có
  **đường cho người dùng tự đặt TÊN HIỂN THỊ**. Đo xem `components/settings/AccountSettings.tsx`
  đã có chưa; **có** thì nói rõ vì sao nó chưa ăn tới đây, **chưa có** thì thêm — đây là **cách
  duy nhất đúng**, mọi cách khác đều là đoán.
⚠️ Tên rỗng thì giữ nguyên đường thoái lui hiện có (`'InteriorFlow'`), **đừng bịa tên**.

### V2 — Số thứ tự ô phải TỰ TÍNH (marker: `soThuTuO`) 🔴
Số nay **gán cứng** nên widget ẩn là dãy đứt. Chuyển sang **đánh số theo thứ tự ô THẬT SỰ hiện ra**
— ẩn cái nào thì cái sau **dồn lên**, dãy luôn liền: `01 02 03 04…`.
⚠️ Kèm: ô *LƯỚI TÍCH LUỸ STUDIO* (`ContributionGrid`) hiện **không có số** — hoặc cho nó số, hoặc
**bỏ số ở mọi ô**. Đứng giữa là bất nhất.
🔎 **Cân nhắc và nói rõ lựa chọn của bạn**: số thứ tự có còn **mang tin** không, hay chỉ là trang trí?
Nguyên tắc `simpleCoChiTiet` nói **chi tiết phải mang tin**; số chạy 01→08 mà không dẫn tới đâu thì
nó là hoa văn. Bạn được đề xuất **bỏ hẳn** — nhưng phải nêu lý do, vì Hoà từng pin nhiều lần rằng
*"số thứ tự (01/) làm xương cấu trúc tài liệu"* (NT-7). Nêu ≥2 hướng, chọn 1.

### V3 — THỪA TRỐNG: ô phải CO THEO NỘI DUNG (marker: `oCoTheoNoiDung`) 🔴 nặng nhất
Ảnh cho thấy: ô `01 DỰ ÁN` chiếm nửa màn mà **phân nửa dưới trống trơn** · `05 BIỂU ĐỒ CHẶNG` chỉ
**một cột**, hai cột rỗng, dưới là khoảng trắng lớn · `08 VẬT LIỆU CỦA TUẦN` một quả cầu rồi trống.
**Gốc bệnh:** ô đang **giãn ra cho vừa khung lưới** thay vì **khung co theo nội dung** — đúng tư duy
kéo dãn Hoà vừa cấm.
Việc: ô **cao theo lượng tin nó có**. Ít tin thì **thấp lại**, lưới **chặt theo**.
⚠️ **Giữ ràng buộc đã chốt**: widget khai theo **ô lưới**, **cấm khai px** (điều kiện để cùng widget
chạy trên máy tính/tablet/điện thoại) · cỡ vẫn trong bộ **1×1 · 2×1 · 2×2**, **không kéo giãn tự do**.
⇒ Cách đúng: **chọn đúng cỡ ô theo lượng tin**, không phải đổi chiều cao tự do.
📏 Nghiệm thu: đo **tỉ lệ khoảng trống** của 3 ô nêu trên, trước và sau, dán số vào báo cáo.

### V4 — Hai thẻ dự án không phân biệt được (marker: `theDuAn`)
Ảnh: hai thẻ *"Nháp"* và *"Dự án mới"* dùng **cùng một mảng be trơn**, nhìn không tách được.
Việc: thẻ phải phân biệt bằng thứ **mang tin** — ảnh thật của dự án nếu có; chưa có thì một dấu hiệu
**suy từ chính dự án** (chữ cái đầu · dải màu định danh · số bản vẽ), **không phải hoa văn ngẫu nhiên**.
⚠️ Màu định danh dự án thuộc **lớp ③ Brand Kit**, **không** phải màu hệ thống — được dùng nhiều màu.
⚠️ **Màu không là kênh duy nhất** — bỏ hết màu vẫn phải phân biệt được.

### V5 — Bản vẽ (marker: `@dsCard`)
`docs/mocks/mock-home-sua-4-loi.html`, dòng đầu `<!-- @dsCard group="Home" -->`.
Bày **trước ↔ sau** cho cả 4 lỗi. Đủ **2 theme** có nút gạt · **token thật** (⚠️ `--mat-*` **đã chết**
→ `--nen-mo-*`; đường kẻ mảnh là **`--vien-mo`**) · cấm hex ngoài khối khai token · 1440×900 không
tràn ngang · tự chấm bằng `design:design-critique` + `design:accessibility-review`.

## ⑤ RÀNG BUỘC
- **Song ngữ VI/EN** cho chuỗi mới. Nhãn **≤ 12 từ**. `prefers-reduced-motion` thắng.
- Màu qua biến CSS, cấm hex. Thang bo **6/10/14/20 + `--r-full`**.
- ⚠️ `WidgetCard` dùng `--t4` cho tiêu đề và `--t5` cho số — đo được **3,44/3,26** và **1,98/2,21**,
  **dưới 4,5:1**. Đây là **tiêu đề của cả 10 widget Home**. Sửa luôn nếu bạn đụng tới, **đổi TOKEN**
  (`--t3`), **cấm tự chế màu**.
- **Trích mã điều khoản `docs/TRIET-LY-IF.md`** — **MỞ FILE ĐỌC SỐ, cấm nhớ hộ**: **[N1] human-centric**
  (`:53`) · **[Đ2] nhìn vào trong trước** (`:72`). Số T ghi sai thì báo lại đúng số.

## ⑥ NGHIỆM THU + ⑥b VÒNG TỰ ĐÓNG
```bash
npx tsc --noEmit
npm test
npm run soi:tu-dien
npm run soi:hinh-hoc
npm run soi:thao-tac
npm run soi:frontier
```
**ĐÍCH:** `tsc` 0 · `npm test` **0 fail** · `soi:frontier` 0 lệch · hình-học **10** và thao-tác
**31+193** giữ mốc · `soi:tu-dien` không tăng phần từ tệp bạn · **dãy số ô liền mạch** ở mọi tổ hợp
widget ẩn/hiện, **chứng minh bằng test** (không phải nhìn) · **tỉ lệ khoảng trống** 3 ô có số trước/sau ·
mock 0 mục chữ dưới ngưỡng ở cả hai theme.
**VÒNG:** trần 5 vòng. Quá trần → DỪNG, nộp kèm bảng *"vòng nào hỏng vì gì"*. **CẤM** khai đạt khi chưa đạt.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-17-P-X-sua-4-loi-home.md`, khuôn 6 phần `docs/CLAUDE.md`.

## ⑦b CHƯA CHẮC — bắt buộc, trống cũng ghi "không có"
Bắt buộc phủ: có **chạy app thật** không (nếu không thì mọi kết luận về bố cục là **đọc mã**) ·
V3 bạn **đo** khoảng trống hay **ước** · V2 bạn chọn hướng nào và hướng kia mất gì · tổ hợp widget
ẩn/hiện nào bạn **chưa phủ**.

## ⑦c HẠN DÙNG
*"Hết đúng khi …"* — ít nhất phủ: khi **Home bento tuỳ biến** thi công (người dùng tự sắp ô) · khi
màu nhấn thứ hai chốt · khi theme sáng đổi sang bản canh-Apple.

## ⑧ DÂY MÁY
`home-bento`. Bạn **không** sửa registry — T flip sau audit.
