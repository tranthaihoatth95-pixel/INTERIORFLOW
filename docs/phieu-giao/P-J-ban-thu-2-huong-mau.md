# P-J · BÀN THỬ HAI HƯỚNG MÀU NHẤN — mòng két ↔ mận, chọn bằng MẮT

> Khuôn §3 `docs/HOP-DONG-PHOI-HOP-T.md`. Tự chứa.
> **THẺ VAI [Đ4]:** phiên phụ cấp CHẶNG/LUỒNG, vùng `docs/mocks`. Chạm biên (sửa token thật trong
> `app/globals.css`, sửa code component) → **DỪNG + đề xuất lên T**. Phiếu này **KHÔNG đổi màu của app**.

---

## ⓪b TIỀN ĐỀ HẠ TẦNG
Cây chính `/Users/tranben/Downloads/interiorflow`.
```bash
git log --oneline -1
git rev-list --count HEAD..main   # phải ra 0
```
Lệch > 0 → **DỪNG**, báo T.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — xác nhận/bác bỏ từng ý
1. *"`docs/mocks/mock-ban-thu-mau.html` **ĐÃ CÓ** (phiên P-D dựng 16/08): bàn thử màu kéo được, đã có **vùng cấm hue**. Việc này là **mở rộng bàn thử đó**, KHÔNG dựng bàn thử thứ hai."* — [Đ2]
2. *"Vàng đồng `--accent-warm` đã bị Hoà **bỏ hẳn** khỏi vai màu nhấn 16/08 (*'tone vàng mà thêm xám vào là thảm hoạ'*) ⇒ bàn thử **không được** bày lại nó như một ứng viên."*
3. *"Ba vùng phổ đã bị màu nghĩa chiếm — đỏ (sai/huỷ) · vàng-cam (cần xem lại) · xanh lá (đạt). Màu nhấn phải nằm **ngoài ±20°** quanh góc màu THẬT của từng màu nghĩa, đọc từ `app/globals.css`, **không gõ số cứng**."*

Bác ý nào → **DỪNG**, báo T kèm `file:dòng`.

## ① BỐI CẢNH

Hoà bỏ tím-độc-diễn vì thấy *"quen tay, giống AI"*, rồi bỏ tiếp vàng đồng vì trên nền xám nó ra **xỉn**. Còn lại hai ứng viên. T xếp mòng két mạnh hơn, **nhưng Hoà chọn: dựng cả hai để so bằng mắt, không chọn bằng số.**

Đây là quyết định **khoá cả đợt giao diện** — mọi bản vẽ sau đều bám theo nó. Nên bàn thử phải cho Hoà thấy đúng chỗ màu **dễ chết nhất**, không phải chỗ nó đẹp nhất.

## ② ĐỌC TRƯỚC
| File | Vì sao |
|---|---|
| `docs/mocks/mock-ban-thu-mau.html` (đọc HẾT) | nền phải mở rộng — cơ chế kéo + vùng cấm hue đã có |
| `app/globals.css` — khối khai token màu, cả hai theme | lấy góc màu **thật** của `--danger`/`--warning`/`--success`/`--accent`; **đọc ra**, không gõ số nhớ |
| `docs/CHOT-16-08-BAN-DUNG.md` mục **A3** và **A4** | bản đang có hiệu lực về màu + nền sáng canh-Apple |
| `docs/mocks/mock-bo-nen-chung.html` | bộ nền — bàn thử phải nói cùng ngôn ngữ |

## ③ VÙNG FILE
**ĐƯỢC ghi:** `docs/mocks/mock-ban-thu-2-huong-mau.html` (MỚI) · `docs/bao-cao-phien/2026-08-16-P-J-hai-huong-mau.md` (MỚI).
**CẤM:** `app/globals.css` · mọi file trong `components/` và `lib/` · `scripts/*` · mock khác (kể cả `mock-ban-thu-mau.html` — **chép cơ chế sang bản mới, đừng sửa bản cũ**) · `docs/00-CHOT.md`.
**KHÔNG git. KHÔNG dev server.**
⚠️ Một phiên phụ khác đang giữ `components/ui/LightBar.tsx` + `app/globals.css` — tuyệt đối không chạm.

## ④ VIỆC

### V1 — Hai hướng đặt CẠNH NHAU, cùng một màn (marker: `haiHuongMau`)
- **Hướng A — mòng két**, teal trầm ~180–190°
- **Hướng B — mận trầm**, ~330–340°
Mỗi hướng sinh **thang tông** từ màu gốc (đừng đặt tay từng hex): giữ độ sáng đều khi đổi góc màu. Cùng một bố cục, cùng nội dung, chỉ khác màu — để mắt so được.

### V2 — Bày đúng chỗ MÀU DỄ CHẾT, không phải chỗ nó đẹp (marker: `caKho`) 🔴
Bàn thử phải có **đủ 5 ca**, mỗi ca ở **cả hai theme**:
1. **Nút chính đứng cạnh cả ba màu nghĩa** (đỏ huỷ · vàng cần-xem-lại · xanh đạt) — ca Hoà lo nhất: *"xanh vs đỏ dễ nhầm với duyệt và cancel"*. Cặp **Duyệt ↔ Huỷ** phải có mặt, và phải phân biệt được bằng **chữ + vị trí + hình dạng**, không chỉ bằng màu.
2. **Trên nền XÁM** — đây đúng chỗ vàng đồng chết. Nếu hướng nào ra xỉn ở đây thì loại, dù chỗ khác đẹp.
3. **Trên nền TRẮNG THUẦN** — nền sáng nay canh Apple: trắng là nền chính, xám chỉ là nền nhóm.
4. **Diện tích nhỏ**: vòng focus · chấm trạng thái · viền 2px đáy card · vạch thanh tiến trình. Màu nhấn phần lớn đời nó sống ở diện tích nhỏ, không phải ở mảng lớn.
5. **Chữ trên nền màu nhấn** — cặp nền/chữ phải đạt tương phản ở cả hai hướng.

### V3 — Số nằm cạnh mắt, không thay mắt (marker: `soDoiChieu`)
Mỗi hướng hiện: **góc màu · khoảng cách tới từng màu nghĩa gần nhất · tương phản chữ-trên-nền** ở cả hai theme.
Ràng buộc phải kiểm và **hiện kết quả đạt/không đạt ngay trên bàn**: ngoài ±20° quanh mọi màu nghĩa · cách tím `--accent` **≥ 60°** · chữ trên nền nhấn đạt ngưỡng đọc-được.
Hướng nào **trượt ràng buộc** thì nói thẳng ngay trên bàn thử — đừng để Hoà chọn phải màu hỏng rồi mới biết.

### V4 — Giữ được cơ chế kéo của bàn cũ (marker: `vungCam`)
Núm kéo góc màu + **ba dải cấm gạch chéo** + số khoảng cách tới màu nghĩa gần nhất. Hoà kéo tự do quanh hai hướng, máy chặn khi vào vùng cấm **kèm lý do bằng tiếng người** (vd *"trùng họ với màu báo đạt — nút nhấn sẽ mất nghĩa"*).

### V5 — Một ô KẾT LUẬN ngắn
Cuối bàn thử: mỗi hướng **2-3 dòng** — mạnh ở đâu, chết ở đâu, ca nào đáng lo. **Không chấm điểm, không xếp hạng.** Hoà nhìn rồi quyết; việc của bàn thử là **bày ra**, không phải kết luận hộ.

### V6 — `@dsCard`
Dòng đầu tệp: `<!-- @dsCard group="Bàn thử màu" -->`. Đủ 2 theme có nút gạt · token thật · **cấm hex ngoài khối khai token** · 1440×900.
Bạn **không có** `DesignSync` — T đẩy khi audit.

## ⑤ RÀNG BUỘC
- Vẫn giữ chốt 03/08 **hai nhiệt độ**: IF lạnh ↔ ArchiNote ấm. Hướng nào làm IF thành **ấm** thì phải **cảnh báo ngay trên bàn thử**.
- Giữ luật **một màu nhấn tại một thời điểm** — bàn thử bày hai hướng để **so**, không phải để dùng cả hai.
- **Màu luôn mang nghĩa**: không hướng nào được lấn phổ của màu nghĩa.
- Chữ Việt: cấm hoa toàn phần, `line-height ≥ 1.5`. Số dùng `tabular-nums`.
- **Trích mã điều khoản `docs/TRIET-LY-IF.md`** — mở file đọc SỐ, **cấm nhớ hộ** (hôm nay đã có một đợt trích sai mã trên diện rộng): **[T5]** người quyết cuối · **[Đ2]** nhìn vào trong trước. Trích **nguyên văn**; mã khác với T ghi thì **báo lại đúng mã**.

## ⑥ NGHIỆM THU TỰ LÀM
```bash
npm run soi:tu-dien
npm run soi:hinh-hoc
```
Không đụng code ⇒ không cần `tsc`.

## ⑥b ĐIỀU KIỆN ĐÍCH — VÒNG TỰ ĐÓNG
**ĐÍCH:** đủ 5 ca × 2 theme × 2 hướng · mọi ràng buộc V3 **tính từ token đọc ra**, không phải số gõ tay · `soi:tu-dien` 0 lệch · hai máy soi không thêm lệch mới · tự chấm bằng `design:design-critique` + `design:accessibility-review`, **0 mục chữ dưới ngưỡng đọc-được ở cả hai theme** · bàn thử mở được ở 1440×900 **không tràn ngang**.
**VÒNG:** chưa đạt → tự sửa, **trần 5 vòng**. **QUÁ TRẦN → DỪNG**, nộp kèm bảng *"vòng nào hỏng vì gì"*. **CẤM** khai đạt khi chưa đạt; **CẤM** nới ràng buộc cho một hướng đẹp hơn.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-16-P-J-hai-huong-mau.md`, khuôn 6 phần `docs/CLAUDE.md`.

## ⑦b CHƯA CHẮC — bắt buộc, trống cũng ghi "không có"
Bắt buộc phủ: góc màu và tương phản là **đo** hay **suy** · công thức sinh thang tông có kiểm được không · bàn thử chạy trong **trình duyệt nào** · chỗ nào bạn phải **chọn một con số** mà không có nguồn chốt.

## ⑦c HẠN DÙNG KẾT LUẬN
*"Hết đúng khi …"* — ít nhất phủ: khi Hoà chọn một trong hai hướng · khi **theme sáng đổi sang bản canh-Apple** (mọi số cột "sáng" phải đo lại) · khi bộ nền được duyệt/bác.

## ⑧ DÂY MÁY
Entry `he-mau-2-lop` (T flip sau audit — bạn **không** sửa registry).
