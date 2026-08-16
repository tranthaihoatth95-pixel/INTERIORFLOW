# P-O · NĂM BỘ HÌNH NỀN ĐỘNG ĐI KÈM HỆ THỐNG — chậm dần, dừng hẳn ở dashboard

> Khuôn §3 `docs/HOP-DONG-PHOI-HOP-T.md`. Tự chứa.
> **THẺ VAI [Đ4]:** phiên phụ cấp CHẶNG/LUỒNG. Chạm biên (đổi router, đổi widget, đổi token
> màu nghĩa) → **DỪNG + đề xuất lên T**.

---

## ⓪b TIỀN ĐỀ HẠ TẦNG
```bash
git log --oneline -1              # mốc mới nhất: 544999f
git rev-list --count HEAD..main   # phải ra 0
```
Lệch > 0 → **DỪNG**, báo T. Một phiên phụ khác chạy song song trên **router + widget** — nó giữ
`components/home/HomeScreen.tsx`, `components/home/widgets/**`, `lib/resume.ts`,
`components/studio/AppChrome.tsx`. **Đừng chạm.**

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — xác nhận/bác bỏ từng ý
1. *"`public/wallpapers/` hiện **RỖNG** — 53 ảnh mặt tiền là render khách (`ttt-*`, `covers/`, `detech/`) đã bị dọn theo **LUẬT TRUNG TÍNH**. ⇒ hình nền đi kèm hệ thống **TUYỆT ĐỐI không được** là ảnh dự án của bất kỳ studio nào."*
2. *"`lib/home/time-of-day.ts` **ĐÃ CÓ**: `TimeOfDayPeriod = dawn|day|dusk|night` · `timeOfDayFromHour()` · `timeOfDayNow()` · `sunPosition(hour)` — tức **máy tính ánh sáng theo giờ đã chạy thật**, đang nuôi widget `LightClock`."*
3. *"IF đã chốt **ánh sáng kể giờ** là một trong các chữ ký thị giác đang cân nhắc, và luật **NT-11 ánh sáng chỉ mang nghĩa, cấm glow tĩnh trang trí**."*
4. *"Chốt 16/08 (`CHOT-16-08-BAN-DUNG.md` mục **A2**): nền **VẪN CÓ HÌNH và để SẮC NÉT**; thứ làm chữ đọc được là **tấm kính đủ đặc** ở vùng có nội dung, **KHÔNG phải bôi mờ nền**. Thẻ kính **không phủ kín màn** — chừa lề cho nền thở."*

Bác ý nào → **DỪNG**, báo T kèm `file:dòng`.

## ① BỐI CẢNH — nguyên văn Hoà (16/08)

> *"thiết kế cho mình 5 bộ hình nền mặc định đi kèm hệ thống đi. mỗi bộ bao gồm hình nền động giống macOS của Apple, đăng nhập vô là chậm và dừng hẳn ở màn home dashboard."*

**Đọc cho đúng hai chữ "động":** macOS đổi ánh sáng của **cùng một cảnh** theo giờ trong ngày — sáng sớm khác trưa khác hoàng hôn khác đêm. Đó **không phải video chạy vòng**. Cộng thêm yêu cầu riêng của Hoà: **có một chuyển động chậm dần rồi DỪNG HẲN khi tới dashboard**.

⭐ **Vì sao chuyển động đó KHÔNG phải trang trí** — phải giữ đúng cách đọc này, vì NT-11 cấm trang trí: nó **mang hai tin**. ① **ánh sáng nói mấy giờ** (chữ ký *ánh sáng kể giờ* của IF) ② **việc nó dừng lại nói "đã tới nơi, bắt đầu làm việc"** — chuyển động chấm dứt là dấu hiệu **kết thúc quá trình vào**. Nếu bạn dựng ra một vòng lặp chạy mãi thì nó **thành trang trí và vi phạm NT-11**.

## ② ĐỌC TRƯỚC
| File | Vì sao |
|---|---|
| `lib/home/time-of-day.ts` (đọc HẾT) | máy ánh sáng theo giờ đã có — **dùng lại, cấm viết máy thứ hai** |
| `components/home/widgets/LightClock.tsx` | nơi tiêu thụ đang chạy, xem nó gọi `sunPosition` kiểu gì |
| `components/home/DongStudioHome.tsx` | nền hiện tại của dashboard |
| `docs/CHOT-16-08-BAN-DUNG.md` mục **A2 · A4 · A6 · B1** | nền có hình để nét · nền sáng canh Apple · ba tầng ánh sáng · kính là VỎ |
| `docs/00-CHOT.md` — mục **LUẬT NỀN TẢNG** đầu file | IF là sản phẩm global trung tính |
| `components/settings/LockScreenSettings.tsx` | cài đặt màn khoá đang có gì |

## ③ VÙNG FILE
**ĐƯỢC ghi:** tệp MỚI `lib/wallpaper/**` · tệp MỚI `components/wallpaper/**` · `components/home/DongStudioHome.tsx` · `components/entry/LoginScreen.tsx` · `components/studio/LockScreen.tsx` · `components/settings/LockScreenSettings.tsx` · `app/globals.css` (**CHỈ THÊM** class) · `docs/mocks/mock-5-bo-hinh-nen.html` (mới) · `docs/bao-cao-phien/2026-08-16-P-O-hinh-nen-dong.md` (mới).

**CẤM:** `components/home/HomeScreen.tsx` · `components/home/widgets/**` · `lib/resume.ts` · `components/studio/AppChrome.tsx` (**phiên router đang giữ**) · `scripts/**` · `docs/00-CHOT.md` · mock nào đang có.
**KHÔNG git. KHÔNG dev server.**

## ④ VIỆC

### V1 — QUYẾT: sinh bằng mã hay bằng tệp ảnh (marker: `hinhNenNguon`) 🔴 làm trước
Đây là **quyết định kiến trúc**, quyết sai thì mọi thứ sau đều sai.

**T nghiêng mạnh về SINH BẰNG MÃ** (gradient/lưới sáng vẽ theo `sunPosition`), lý do:
- **0 byte** thêm vào bộ cài, **mọi độ phân giải**, chạy **offline** — đúng local-first;
- **không thể lọt dữ liệu khách** — luật trung tính được bảo đảm **bằng cấu trúc**, không bằng kỷ luật;
- **dùng lại `lib/home/time-of-day.ts`** đã chạy thật ([Đ2]), thay vì phải sinh 5 bộ × 4 thời điểm = **20 tệp ảnh** rồi lo nén/độ phân giải/độ trễ tải;
- và nó **nối thẳng vào chữ ký *ánh sáng kể giờ*** thay vì là một lớp trang trí rời.

**Nhưng bạn được quyền bác** nếu đo ra sinh-bằng-mã **không đủ đẹp** cho thứ Hoà muốn — Hoà nói *"giống macOS"*, mà macOS dùng ảnh chụp thật. Bác thì phải kèm: **thử thật, có hình**, và **con số** (kích thước bộ cài tăng bao nhiêu, nguồn ảnh trung tính lấy ở đâu cho hợp pháp). ⚠️ **Nếu chọn ảnh: tuyệt đối không lấy ảnh dự án của studio nào**, kể cả ảnh đẹp sẵn trong máy.
Ghi quyết định + lý do vào báo cáo, **đây là mục T sẽ soi kỹ nhất**.

### V2 — Năm bộ, mỗi bộ là một CẢNH SÁNG (marker: `boHinhNen`)
Năm bộ **khác nhau về CHẤT**, không phải năm màu khác nhau của cùng một thứ. Mỗi bộ chạy đủ **bốn thời điểm** (`dawn` · `day` · `dusk` · `night`) lấy từ máy đã có.
Bạn tự đặt tên và tự chọn năm hướng — nhưng phải:
- **trung tính, quốc tế** (đây là giao diện của app, không phải nội dung dự án);
- **trầm, nhiều khoảng thở** — đúng "chất IF" đã ghi thành 5 điều đo được (chốt 16/08);
- **không lấn phổ màu nghĩa** (đỏ sai · vàng cần-xem-lại · xanh đạt) — nền mà ngả đỏ thì cảnh báo đỏ mất trọng lượng;
- **không khoá vào màu nhấn** (mòng két ↔ mận **chưa chốt**) — bộ nào chỉ sống được với một màu là **điểm trượt, ghi ra**.
📏 Mỗi bộ phải nói được **một câu** nó là gì. Không nói được ⇒ nó là hoa văn, bỏ.

### V3 — Chậm dần rồi DỪNG HẲN (marker: `chamDanDung`) 🔴
Chuyển động **chỉ tồn tại trong lúc VÀO**, và **dừng hẳn** khi tới dashboard — không phải chậm lại rồi vẫn nhúc nhích.
- Phải **thật sự dừng**: sau khi dừng, khung hình **đứng yên tuyệt đối** (chứng minh được, xem ⑥b).
- **Đường cong giảm tốc** phải êm, không "bật cụp" (tinh thần đã chốt: 180–220ms cho chuyển cảnh nhỏ; cái này dài hơn, bạn tự chọn và **nói rõ con số + vì sao**).
- 🔴 **`prefers-reduced-motion` ⇒ KHÔNG chuyển động chút nào**, vào thẳng khung hình cuối. Không phải "chậm hơn" — là **không có**.
- ⚠️ **Không được chặn thao tác**: người dùng bấm được ngay, không phải đợi hết hiệu ứng. Hiệu ứng vào mà khoá tay người dùng là lỗi nặng hơn cả không có hiệu ứng.

### V4 — Chữ trên nền phải ĐỌC ĐƯỢC, và đọc được BẤT KỂ bộ nào (marker: `kinhTrenNen`) 🔴
Đây là chỗ chết người: dashboard **dày số liệu**, mà nền thì đổi theo giờ **và** theo bộ.
Thi hành đúng chốt A2 — **để nền NÉT**, chữ đọc được nhờ **tấm kính đủ đặc**, không nhờ bôi mờ nền:
- vùng có chữ/số → **kính đặc**; vùng trống/lề/khe → nền **hiện nét**;
- **kính là VỎ, ruột ĐẶC**; **một tầng kính, không hai** (luật B1, và K4: panel kính nổi phải portal);
- **nấc giảm chói** bắt buộc + cho **tắt hẳn** về màu trơn, **nhớ lựa chọn**.
📏 **Điểm nghiệm thu đo được**: **đo tương phản TẠI CHÂN CHỮ**, **không** đo trung bình cả thẻ — và phải đạt ở **cả 5 bộ × 4 thời điểm × 2 theme**. Tổ hợp nào trượt thì **hoặc sửa, hoặc bỏ bộ đó**; **cấm** để trượt rồi khai đạt.
⚠️ **Học lại bài của lượt trước**: nấc giảm chói **cắt ánh kim, KHÔNG BAO GIỜ cắt độ đọc**.

### V5 — Chỗ người dùng chọn bộ (marker: `chonBoHinhNen`)
Cho chọn trong `LockScreenSettings` (hoặc chỗ bạn đo ra là đúng hơn — nói rõ vì sao). **Nhớ lựa chọn.**
Hình xem trước phải **cho thấy thật** bộ đó trông ra sao, không phải ô màu trơn.
⚠️ Đây là **màu VỎ LÀM VIỆC = lớp ② của hệ màu 3 lớp** — người dùng chọn trong biên; **không được** đụng lớp ① (màu của IF) hay màu mang nghĩa nghề.

### V6 — Bản vẽ (marker: `@dsCard`)
`docs/mocks/mock-5-bo-hinh-nen.html`, dòng đầu `<!-- @dsCard group="Hình nền hệ thống" -->`.
Bày **lưới 5 bộ × 4 thời điểm** để Hoà quét một mắt · **một ô lớn** cho thấy dashboard thật với thẻ kính đè lên nền · nút gạt **theme** + nút gạt **giảm chuyển động** + nút gạt **nấc giảm chói**.
Token thật (⚠️ `--mat-*` **đã chết** → `--nen-mo-*`; đường kẻ mảnh là **`--vien-mo`**), cấm hex ngoài khối khai token, 1440×900 không tràn ngang.
Tự chấm bằng `design:design-critique` + `design:accessibility-review`. T đẩy lên Claude Design; bạn **không có** `DesignSync`.

## ⑤ RÀNG BUỘC
- ⛔ **LUẬT TRUNG TÍNH — không thương lượng**: không logo/tên/màu/font của studio nào; không ảnh dự án khách; không tên khách trong tên tệp.
- **Ánh sáng chỉ mang nghĩa** (NT-11). Nền phải nói được **giờ**; chuyển động phải nói được **đã tới nơi**.
- **Không đụng ba tầng ánh sáng đã chốt** (kính nhận sáng ① · viền đứng yên khi trỏ ② · viền chạy khi render ③) — nền là **tầng đất**, không được đọc nhầm thành tín hiệu trạng thái.
- Giữ chốt **hai nhiệt độ**: IF **lạnh**. Bộ nào làm IF thành ấm → **cảnh báo ngay trên bản vẽ**.
- **Hiệu năng**: nền chạy sau lưng cả app; nếu dùng animation thì phải nói rõ nó tốn gì, và **dừng hẳn nghĩa là ngừng tiêu CPU/GPU**, không phải vẽ tiếp một khung hình không đổi.
- **Song ngữ VI/EN** cho chuỗi mới. `prefers-reduced-motion` thắng.
- **Trích mã điều khoản `docs/TRIET-LY-IF.md`** — **MỞ FILE ĐỌC SỐ, cấm nhớ hộ**: **[N1] human-centric** (`:53`) · **[Đ2] nhìn vào trong trước** (`:72`). Số T ghi sai thì **báo lại đúng số**.

## ⑥ NGHIỆM THU TỰ LÀM
```bash
npx tsc --noEmit
npm test
npm run soi:tu-dien
npm run soi:hinh-hoc
npm run soi:thao-tac
npm run soi:frontier
```

## ⑥b ĐIỀU KIỆN ĐÍCH — VÒNG TỰ ĐÓNG
**ĐÍCH:** `tsc` 0 · `npm test` **0 fail** · `soi:frontier` 0 lệch · `soi:tu-dien` **không tăng** (nền 212) · `soi:hinh-hoc` **10** và `soi:thao-tac` **31+193** giữ mốc · **5 bộ × 4 thời điểm** đều dựng được · tương phản **tại chân chữ** đạt ở **mọi tổ hợp bộ × thời điểm × theme**, có bảng số · **chứng minh được là ĐÃ DỪNG HẲN** (nêu rõ bạn chứng minh bằng cách nào) · `prefers-reduced-motion` cho **0 chuyển động** · **0 tệp ảnh nào mang dấu vết studio/khách**.
**VÒNG:** chưa đạt → tự sửa, **trần 5 vòng**. **QUÁ TRẦN → DỪNG**, nộp kèm bảng *"vòng nào hỏng vì gì"*. **CẤM** khai đạt khi chưa đạt; **CẤM** bỏ bớt tổ hợp cho dễ qua cửa — bỏ tổ hợp nào phải **nói thẳng là đã bỏ**.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-16-P-O-hinh-nen-dong.md`, khuôn 6 phần `docs/CLAUDE.md`. Mục V1 (quyết định mã ↔ ảnh) phải có **lập luận đầy đủ + số**.

## ⑦b CHƯA CHẮC — bắt buộc, trống cũng ghi "không có"
Bắt buộc phủ: bạn có **chạy app thật** không (nếu không, mọi kết luận về chuyển động và hiệu năng là **suy**, nói thẳng) · tương phản là **đo** hay **tính** · "dừng hẳn" bạn **đo** hay **tin vào mã** · hiệu năng bạn **đo** hay **ước** · bộ nào bạn thấy **yếu nhất** và vì sao (đừng khoe cả 5 đều tốt).

## ⑦c HẠN DÙNG KẾT LUẬN
*"Hết đúng khi …"* — ít nhất phủ: khi **màu nhấn thứ hai chốt** · khi **theme sáng đổi sang bản canh-Apple** (mọi số tương phản cột sáng phải đo lại) · khi bản tablet/điện thoại bắt đầu làm · khi Home bento tuỳ biến thi công.

## ⑧ DÂY MÁY
`home-bento` · `he-mau-2-lop`. Entry cho hình nền **T sẽ mở sau audit** — bạn **không** sửa registry.
