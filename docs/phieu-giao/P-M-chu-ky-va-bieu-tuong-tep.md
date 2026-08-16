# P-M · CHẤM LẠI 3 CHỮ KÝ THỊ GIÁC BẰNG THƯỚC `simpleCoChiTiet` + BIỂU TƯỢNG TỆP

> Khuôn §3 `docs/HOP-DONG-PHOI-HOP-T.md`. Tự chứa.
> **THẺ VAI [Đ4]:** phiên phụ cấp CHẶNG/LUỒNG, vùng `docs/mocks` — **chỉ MỘT tệp mới**.
> Chạm biên (sửa code, sửa token thật, sửa mock đang có) → **DỪNG + đề xuất lên T**.

---

## ⓪b TIỀN ĐỀ HẠ TẦNG
```bash
git log --oneline -1              # mốc mới nhất: 0471b54
git rev-list --count HEAD..main   # phải ra 0
```
Lệch > 0 → **DỪNG**, báo T. ⚠️ Một phiên phụ khác **đang sửa toàn bộ mock đang có** — bạn **chỉ tạo tệp MỚI**, không đụng tệp nào của nó.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ
1. *"`docs/mocks/mock-bo-nen-chung.html` mục **5** (`:752`) đã bày **ba phương án chữ ký thị giác**, cố ý *'không chọn hộ'*: ① **ba chặng soi vào một nguồn** ② **mọi con số truy được về một nguồn** (số đo được ↔ số người nhập) ③ **ánh sáng kể giờ**."*
2. *"Hoà chốt 16/08 nguyên tắc **`simpleCoChiTiet`** — *'simple nhưng luôn có những chi tiết thú vị'*, và điểm chung của mọi chi tiết đáng giữ là **chúng MANG THÔNG TIN, không phải hoa văn**. Nguyên tắc này chưa được dùng để **chấm lại** ba phương án đó."*
3. *"Chốt 16/08 về **biểu tượng tệp**: bộ nhiều màu **tiêu hết hai cửa hue sạch** còn lại; phải nêu **2-3 cách**, **không chọn hộ Hoà**."*

Bác ý nào → **DỪNG**, báo T kèm `file:dòng`.

## ① BỐI CẢNH

Hoà đưa nguyên tắc `simpleCoChiTiet` qua một ảnh timeline: tổng thể cực gọn, nhưng **thước có vạch nhỏ dày đặc** · **một đường dọc đỏ đánh dấu hôm nay** (điểm màu duy nhất cả màn) · **vạch xanh bé đầu mỗi thanh việc**. ⭐ Điểm chung: **cả ba MANG TIN** — thú vị vì *nói được điều gì đó*, không vì đẹp.

⇒ Nguyên tắc đó **là một cái THƯỚC**, và ba phương án chữ ký là thứ **đầu tiên phải đo bằng nó**. Chữ ký nào không mang tin thì **loại, dù đẹp**.

Cùng lượt, giải nốt ca **biểu tượng tệp**: nó là ca thật đầu tiên thử vào luật *màu luôn mang nghĩa* — đẹp, nhưng ăn hết phần phổ màu còn sạch.

## ② ĐỌC TRƯỚC
| File | Vì sao |
|---|---|
| `docs/mocks/mock-bo-nen-chung.html` mục 5 (`:752` trở đi) — **CHỈ ĐỌC** | ba phương án gốc, kèm ô Được/Mất từng cái |
| `docs/00-CHOT.md` — 3 chốt 16/08: **"SIMPLE NHƯNG CÓ CHI TIẾT THÚ VỊ"** · **"ƯU TIÊN HÌNH/KÝ HIỆU/ICON HƠN CHỮ"** · **"T ĐỀ XUẤT TÁCH ICON THÀNH SÁU LOẠI"** (T đã chốt thành **BẢY**) | thước đo + ranh giới |
| `docs/CHOT-16-08-BAN-DUNG.md` mục **A3 · A4 · B12 · B16** | màu chưa chốt · nền sáng · nguyên tắc chi-tiết-mang-tin · ca biểu tượng tệp |
| `docs/nc/NC-TU-DA-NGHIA-2026-08-16.md` §V5 dòng #9-#11 | bảy loại icon, loại nào có ca thật |

## ③ VÙNG FILE
**ĐƯỢC ghi — đúng 2 tệp, đều MỚI:** `docs/mocks/mock-chu-ky-va-bieu-tuong-tep.html` · `docs/bao-cao-phien/2026-08-16-P-M-chu-ky-bieu-tuong.md`.
**CẤM ghi bất kỳ tệp nào khác** — đặc biệt mọi mock đang có (phiên khác đang sửa chúng), `app/globals.css`, `components/`, `lib/`, `scripts/`, `docs/00-CHOT.md`.
**KHÔNG git. KHÔNG dev server.**

## ④ VIỆC

### V1 — Dựng THƯỚC thành thứ chấm được (marker: `simpleCoChiTiet`) 🔴 làm trước
Biến nguyên tắc thành **vài câu hỏi trả lời được bằng có/không**, mỗi câu kèm **cách kiểm**. Gợi ý khởi điểm — bạn được sửa nếu đo ra khuôn tốt hơn, nhưng phải nói vì sao:
- chi tiết này **nói lên điều gì**? (không trả lời được ⇒ hoa văn)
- **bỏ nó đi thì mất tin gì**? (không mất gì ⇒ hoa văn)
- nó **đổi theo dữ liệu thật** hay đứng yên mãi?
- người dùng **đọc ra được** hay chỉ tác giả biết?
- ở **nấc gọn nhất** nó còn nói được không?
⚠️ Thước phải chấm được **cả thứ Hoà thích lẫn thứ Hoà chưa nói tới** — thước chỉ hợp thức hoá cái đã có sẵn thì vô dụng.

### V2 — Chấm ba phương án, bày SONG SONG (marker: `chamChuKy`)
Mỗi phương án: dựng **hình thật** (không mô tả bằng chữ) + chấm theo thước + **nói thẳng chỗ nó trượt**.
⛔ **KHÔNG xếp hạng, KHÔNG chấm điểm** (luật §12.3: *"bố cục 7/10 vô nghĩa, người dùng sẽ cãi"*). Kết quả là **bảng đối chiếu**, để mắt Hoà quyết.
⚠️ Phương án nào trượt thước thì **nói trượt** — kể cả khi nó đẹp nhất. Đó là toàn bộ lý do có cái thước này.
🔎 Nếu bạn thấy **phương án thứ tư** mà thước gợi ra, được nêu — nhưng phải khai rõ **đó là bạn thêm**, và nó phải qua thước như ba cái kia.

### V3 — Biểu tượng tệp: 2-3 cách, KHÔNG chọn hộ (marker: `nhanLoaiTep`)
Dựng **hình thật** cho từng cách, cùng một bộ đuôi tệp để so được (gợi ý: `dwg` · `idfc` · `pdf` · `jpg` · `xlsx`):
- **Cách A** — phân loại bằng **chữ + hình dạng** (đuôi in trên biểu tượng, góc gấp khác nhau), màu **một dải duy nhất**.
- **Cách B** — cho nhiều màu **chỉ trong vùng biểu tượng tệp**, khai tường minh là **ngoại lệ CÓ PHẠM VI** (lý do: biểu tượng tệp là **NỘI DUNG**, không phải phần tử giao diện).
- **Cách C** — hướng bạn tự đề xuất, nếu đo ra có.
Mỗi cách: **được gì · mất gì · rủi ro đụng luật nào**. Cả ba chấm bằng thước V1.
🔴 **Ràng buộc không nới**: màu **không được là kênh duy nhất** — mọi cách phải đọc được khi bỏ hết màu. Dựng luôn **hàng "bỏ màu"** để chứng minh.

### V4 — Bản vẽ (marker: `@dsCard`)
Dòng đầu: `<!-- @dsCard group="Chữ ký & biểu tượng tệp" -->`.
**Đủ 2 theme có nút gạt** · **token thật**, cấm hex ngoài khối khai token · 1440×900 không tràn ngang · tự chấm bằng `design:design-critique` + `design:accessibility-review`.
🔴 **Dùng tên token MỚI `--nen-mo-*`**, KHÔNG dùng `--mat-*` (tên đã chết trong code; một phiên khác đang dọn nốt trong mock cũ).
⚠️ **Màu nhấn CHƯA CHỐT** (mòng két ↔ mận đang chờ mắt Hoà) ⇒ chữ ký **không được phụ thuộc vào một màu cụ thể**; nếu phương án nào chỉ sống được với một màu, **đó là một điểm trượt, ghi ra**.
T sẽ đẩy lên Claude Design; bạn **không có** `DesignSync`, đừng đi tìm.

## ⑤ RÀNG BUỘC
- **Ưu tiên ký hiệu hơn chữ** — nhưng ranh giới: ký hiệu thắng ở chỗ **lướt qua**, chữ giữ nguyên ở chỗ **dừng lại đọc**. **Nhãn 1-2 từ VẪN GIỮ** (chốt 16/08, đừng đọc thành "bỏ nhãn").
- **Ánh sáng chỉ mang nghĩa** (NT-11), **cấm glow tĩnh trang trí**. `prefers-reduced-motion` thắng.
- Chữ Việt: cấm hoa toàn phần, `line-height ≥ 1.5`, không tracking âm.
- **Trích mã điều khoản `docs/TRIET-LY-IF.md`** — **MỞ FILE ĐỌC SỐ, cấm nhớ hộ**: **[T5] con người quyết cuối** (`:32`) · **[N1] human-centric cho người sáng tạo lai kỹ thuật** (`:53`) · **[Đ2] nhìn vào trong trước** (`:72`). Số T ghi mà sai thì **báo lại đúng số**.

## ⑥ NGHIỆM THU TỰ LÀM
```bash
npm run soi:tu-dien
npm run soi:hinh-hoc
```
Không đụng code ⇒ không cần `tsc`.

## ⑥b ĐIỀU KIỆN ĐÍCH — VÒNG TỰ ĐÓNG
**ĐÍCH:** thước V1 có **≥4 câu hỏi trả lời được bằng có/không**, mỗi câu kèm cách kiểm · ba phương án đều có **hình thật** + kết quả chấm + **chỗ trượt nói thẳng** · ≥2 cách biểu tượng tệp, mỗi cách có **hàng bỏ-màu** · `soi:tu-dien` **không tăng** · `soi:hinh-hoc` giữ mốc **10** · **0 mục chữ dưới ngưỡng đọc-được ở cả hai theme** (mục cố ý bày cái chưa-đạt thì phải **đánh dấu tường minh** + hiện số ngay cạnh) · **0 hex ngoài khối khai token** · 1440×900 không tràn ngang.
**VÒNG:** chưa đạt → tự sửa, **trần 5 vòng**. **QUÁ TRẦN → DỪNG**, nộp kèm bảng *"vòng nào hỏng vì gì"*. **CẤM** nới thước cho một phương án qua cửa — thước nới được thì nó không phải thước.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-16-P-M-chu-ky-bieu-tuong.md`, khuôn 6 phần `docs/CLAUDE.md`.

## ⑦b CHƯA CHẮC — bắt buộc, trống cũng ghi "không có"
Bắt buộc phủ: câu hỏi nào trong thước là **suy ra từ lời Hoà** và câu nào là **bạn tự thêm** · phương án nào bạn thấy **thước chấm không tới** (thước có lỗ thì nói, đừng giấu) · biểu tượng tệp bạn có **đo** số cửa hue còn lại hay **tin lời sổ** · chỗ nào kết luận đổi nếu màu nhấn chốt khác đi.

## ⑦c HẠN DÙNG KẾT LUẬN
*"Hết đúng khi …"* — ít nhất phủ: khi **màu nhấn thứ hai được chốt** · khi **theme sáng đổi sang bản canh-Apple** · khi Hoà chọn một chữ ký (hai cái còn lại thành nợ chết, cần khai tử tường minh chứ không bỏ hoang).

## ⑧ DÂY MÁY
`khung-mot-khuon` (hệ ký hiệu) · `he-mau-2-lop` (cửa hue) · `hinh-hoc-ap-thang`. Bạn **không** sửa registry — T flip sau audit.
