# P-S · SOI GIAO DIỆN CẢ BA CHẶNG — và trả lời "3 chặng như 3 app" bằng SỐ

> Khuôn §3 `docs/HOP-DONG-PHOI-HOP-T.md`. **Phiếu ĐO, KHÔNG SỬA** — không một dòng code.

## ⓪b TIỀN ĐỀ HẠ TẦNG
```bash
git log --oneline -1
git rev-list --count HEAD..main   # phải ra 0
```
Lệch > 0 → DỪNG, báo T. **Một phiên phụ khác đang chạy** giữ `components/nodes/**` + `components/render-studio/**` — bạn **CHỈ ĐỌC**, không ghi vào đó.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ
1. *"Ba chặng: **2D** `components/cad/**` (route `/projects/[id]/cad`) · **3D** `components/render-studio/**` + `components/three/**` (`/render`) · **Trình chiếu** `components/present-editor/**` (`/present`). Vỏ chung là `components/studio/AppShell.tsx` với các ổ `navigator` 214px · `inspector` 236px · `toolbar` · `statusBar` · `bottomExtra`."*
2. *"Hoà phàn nàn gốc: **'3 chặng như 3 app'** và **'khó dùng'**. Đợt 15/08 mới hợp nhất **VỎ NÚT** (`ToolbarChip`), chưa hợp nhất bố cục hay luồng."*
3. *"T đo được: `cadMode === 'sketch'` có **11 nhánh**, **6 dính pen/touch**, 3 là bố cục (`CadToolbelt.tsx:35` twoRows · `MaterialPalette.tsx:98` bottom 252↔120 · `CadSheets.tsx:865`), 2 là test."*

Số của T lệch số bạn đo → **báo lại số đúng**. Bác ý nào → DỪNG.

## ① BỐI CẢNH
Hoà vừa yêu cầu: *"lỡ rồi bạn soi giao diện của 2 chặng còn lại luôn đi, soi xong rồi tư vấn cho mình có ổn không"*. Chặng 3D vừa được soi kỹ; **2D và Trình chiếu thì chưa**. Và phàn nàn *"3 chặng như 3 app"* tới nay **chưa ai đo bằng số** — toàn cảm nhận.

## ② ĐỌC TRƯỚC
`components/studio/AppShell.tsx` · `components/cad/CadToolbar.tsx` · `CadToolbelt.tsx` · `CadSheets.tsx` · `components/present-editor/` (Toolbar + màn chính) · `components/render-studio/Tool3DBar.tsx` · `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` (NT-1..18 + mục 6 xếp hạng 8 lệch L1-L8) · `docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` (KB-1..4) · `docs/CHOT-16-08-BAN-DUNG.md`.

## ③ VÙNG FILE
**ĐƯỢC ghi — đúng 2 tệp MỚI:** `docs/nc/NC-SOI-3-CHANG-2026-08-16.md` · `docs/bao-cao-phien/2026-08-16-P-S-soi-3-chang.md`.
**CẤM ghi mọi tệp khác.** Không code, không mock, không `scripts/`, không `docs/00-CHOT.md`.
**KHÔNG git. KHÔNG dev server.**

## ④ VIỆC

### V1 — Bảng đối chiếu BA CHẶNG, cùng một bộ câu hỏi (marker: `doiChieu3Chang`) 🔴
Với **mỗi chặng**, trả lời **cùng** những câu này để so được:
1. Dùng ổ nào của `AppShell` (navigator/inspector/toolbar/statusBar/bottomExtra), ổ nào **bỏ trống**?
2. Thanh công cụ: **ở đâu · bao nhiêu nút · xếp mấy hàng · hình dạng nút**?
3. Trục phải có gì, hiện **khi nào**?
4. **Lối vào việc đầu tiên**: mở chặng ra, người dùng thấy gì trước, bấm gì đầu tiên?
5. Có bao nhiêu thứ **chỉ chặng này có** mà hai chặng kia không?

### V2 — ĐO "3 chặng như 3 app" bằng số (marker: `doLechBaChang`)
Đây là phần T cần nhất. Đề xuất vài phép đo, bạn được thay bằng phép tốt hơn **nếu nói rõ vì sao**:
- **Bao nhiêu %** phần tử giao diện của chặng này **tìm được cái tương đương** ở chặng kia?
- Cùng một việc (vd *hoàn tác* · *xuất tệp* · *đổi vật liệu*) ở ba chặng thì **nút nằm ở đâu, tên gọi là gì, phím tắt nào** — **lệch chỗ nào**?
- Bao nhiêu **component dùng chung** thật sự (import chéo) so với bao nhiêu **tự viết riêng**?
Cho một **con số tổng** kèm cách tính, để lần sau đo lại so được.

### V3 — SKETCH ↔ PRO ở chặng 2D (marker: `sketchVsPro`) 🔴 Hoà hỏi thẳng
Hoà nói: *"sketch mode hay pro mode ở chặng 1 chả khác gì nhau ngoại trừ phóng to giao diện"*.
**Kiểm câu đó bằng số**: liệt kê **đầy đủ** mọi chỗ hai mode rẽ nhánh, phân loại thành **① khác về NĂNG LỰC** (có lệnh mà mode kia không có) ② **khác về CÁCH NHẬN ĐẦU VÀO** (bút/chạm/chuột) ③ **khác về BỐ CỤC** (cỡ, số hàng, vị trí).
Rồi trả lời thẳng: **Hoà đúng hay sai, và đúng tới mức nào?**
🔎 T đã đo sơ: 6/9 nhánh thật là **pen/touch**, 3 là bố cục ⇒ **T nghi sketch mode thực chất ĐÃ LÀ chế độ bút+cảm ứng mà chưa ai gọi đúng tên**. **Kiểm chứng độc lập, được phép bác.**

### V4 — Chấm ba chặng theo hiến pháp giao diện (marker: `chamNT`)
Dùng **NT-1..18** + **KB-1..4** đã có (cấm chế thước mới). Mỗi chặng: đạt/trượt từng điều **có liên quan**, kèm `file:dòng`.
Mục 6 của `NC-NGUYEN-TAC-GIAO-DIEN` đã xếp hạng **8 lệch L1-L8** từ 14/08 — **kiểm xem cái nào đã sửa, cái nào còn**, và có **lệch mới** nào không.

### V5 — Ba việc đáng làm nhất, xếp theo LỢI/CHI PHÍ
Không phải danh sách mọi thứ hỏng — **đúng ba việc**, mỗi việc: sửa được cái gì · tốn cỡ nào · **đụng chốt nào không**.
⛔ **KHÔNG xếp hạng chặng nào "tệ hơn"**, không chấm điểm.

## ⑤ RÀNG BUỘC
- **CHỈ ĐO, KHÔNG SỬA.** Thấy lỗi rành rành cũng chỉ ghi.
- Mọi khẳng định có `file:dòng` mở ra đúng. **Đã grep thì đọc đường dẫn trong kết quả, đừng nhớ hộ máy.**
- **Trích mã điều khoản `docs/TRIET-LY-IF.md`** — **mở file đọc SỐ, cấm nhớ hộ**: **[N2] đơn giản ngoài sâu trong** · **[Đ2] nhìn vào trong trước** (`:72`). Số T ghi sai thì báo lại đúng số.

## ⑥ NGHIỆM THU + VÒNG TỰ ĐÓNG
```bash
npm run soi:tu-dien     # không tăng phần từ tệp bạn (đếm theo tệp)
npm run soi:frontier    # 0 lệch
```
**ĐÍCH:** V1 phủ **đủ 3 chặng × 5 câu** · V2 có **con số tổng + cách tính** · V3 phân loại **đủ 3 nhóm** và trả lời thẳng Hoà đúng/sai · V4 đối chiếu **đủ L1-L8** · V5 **đúng 3 việc**, mỗi việc có ô "đụng chốt nào".
**VÒNG:** trần 5 vòng. Quá trần → DỪNG, nộp kèm bảng *"vòng nào hỏng vì gì"*. **CẤM** bịa `file:dòng`.

## ⑦ BÁO CÁO
Khuôn 6 phần `docs/CLAUDE.md`. Mục **⑦b CHƯA CHẮC** bắt buộc: bạn có **mở app thật** không · phần nào **đọc mã** chứ không **nhìn** · chặng nào bạn quét **nông hơn** hai chặng kia (nói thẳng, đừng giả vờ đều tay) · phép đo V2 có chỗ nào **bạn tự chọn** mà người khác chọn khác sẽ ra số khác.
**⑦c HẠN DÙNG**: hết đúng khi nào.
