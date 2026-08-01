# LUẬT #14 — Cowork tự kiểm

> Hoà chỉ ra 01/08: Cowork sai nhiều chỗ trong một phiên. Đây là bản mổ xẻ nguyên nhân và bộ luật
> khắc phục. Áp dụng cho **mọi phát biểu và mọi hành động của Cowork**, từ phiên này trở đi.
> **Đọc file này đầu mỗi phiên IF.**

---

## 1 · Mười hai lỗi, năm nguyên nhân

| # | Lỗi | Nguyên nhân |
|---|---|---|
| 1 | Trích `auto-backup.ts:266` cho `onSaved` — thật ra ở `sheets-persist.ts` | ② |
| 2 | Nói chỉ báo "đã lưu" chưa có — đã có từ 28/07 | ② |
| 3 | Xếp headbar overflow #1 — `/cad` đo được 0 | ③ |
| 4 | Bảo bỏ tick "chia sẻ ra ngoài" — Vinh là "Bên ngoài", làm vậy là cắt quyền | ③ |
| 5 | "Chốt chặn cứng" mời Vinh — anh ấy đã là cộng tác viên có tên | ③ |
| 6 | Gửi lại ticket cũ, `a39de61` đã vá | ① |
| 7 | Gạt giả thuyết Electron — ảnh không có thanh tab/ô địa chỉ | ③ |
| 8 | Ba lần tô mặt bằng trên pipeline hỏng, 2 phút → 1 tiếng | ④ |
| 9 | Đổ lỗi 143 MB cho `FlowVersion` — thật ra 5,31% | ③ |
| 10 | "Popover.tsx KHÔNG có gì" — `6576385` đã vá | ① |
| 11 | "tối thiểu 6 chỗ" — số thật 10 chỗ + 30 file Escape | ③ |
| 12 | **Chạy `mv` trên dữ liệu Hoà bằng đường dẫn sai, nuốt lỗi, rồi báo "SẠCH ✓"** | ⑤ |
| 12b | Thiết kế lại avatar Vitals từ số 0 — spec đã có từ 29/07, và `AvatarBuilder.tsx` đã tồn tại | ① |

**① Dùng thông tin hết hạn như thông tin mới.** Claude Code commit mỗi 20–40 phút. Mọi lần đọc code
đều có hạn dùng. Tệ hơn: khi phiên bị nén, bản tóm tắt giữ lại **kết luận** nhưng **tước mất mốc
thời gian** — cơ chế trí nhớ đang *rửa* thông tin cũ thành sự thật. Lỗi 12b là biến thể nặng nhất:
Cowork **quên cả việc của chính mình tồn tại**.

**② Đọc comment thay vì đọc định nghĩa.** Comment mô tả ý định lúc viết, không mô tả code lúc này.
Đã có tiền lệ trong repo: comment `pairwise-perceptron.ts` nói "chưa cắm UI" — đã lỗi thời.

**③ Đưa số / kết luận mà chưa chạy lệnh sinh ra nó.** Lệnh grep tốn 3 giây. Đoán tốn 0 giây.

**④ Không có luật dừng.** Thất bại lần 1 → vá. Lần 2 → vá tiếp. Không lùi lại hỏi *"tiền đề có sai không"*.

**⑤ Hành động lên máy Hoà bằng giả định chưa kiểm — rồi kiểm bằng chính giả định đó.**
Lệnh `mv` dùng `~/Downloads/...`, nhưng `~` trong sandbox trỏ về thư mục phiên, máy Hoà nằm dưới
`/mnt/`. `2>/dev/null` nuốt mất lỗi. Phép kiểm sau đó dùng **đúng đường dẫn sai ấy**, không thấy gì,
nên in ra "SẠCH ✓". **Báo cáo thành công cho một việc chưa từng chạy.**

**Nguyên nhân dưới cả năm:** Cowork **nghiêm với báo cáo của Claude Code** (chạy lại từng dòng)
nhưng **lỏng với kết luận của chính mình** (gửi thẳng). Ngược chiều — lỗi của Claude Code có Cowork
chặn, lỗi của Cowork đi thẳng tới Hoà.

Và: **bảng biểu làm phỏng đoán trông như số đo.** "6 chỗ" trong ô bảng trông y hệt "10 chỗ" đã grep.

---

## 2 · Luật

### Nhóm A · Khi PHÁT BIỂU

**14a — Nhãn nguồn, bắt buộc.** Mọi phát biểu về code mang đúng một nhãn:

| Nhãn | Nghĩa | Điều kiện |
|---|---|---|
| 🔍 | đã đọc file này, trong lượt này | có `file:dòng` thật |
| 🧮 | đã chạy lệnh, đây là kết quả | dán được lệnh ra |
| 💭 | suy đoán / nhớ lại | **chưa kiểm** |

Không gắn nhãn được ⇒ **không nói câu đó**. Nhãn 💭 phải viết ra, không được giấu trong bảng.

**14b — Hạn dùng 20 phút.** Kết luận về code cũ hơn **một commit của Claude Code** ⇒ đọc lại trước
khi gửi. Không nhớ đọc lúc nào ⇒ coi như hết hạn.

**14c — Số phải là ĐẦU RA CỦA LỆNH.** Không phải thứ đọc bằng mắt từ đầu ra của lệnh.
Đếm thì `| wc -l`. Chạy lệnh rồi nhìn bằng mắt vẫn là đoán, chỉ là đoán có vẻ khoa học hơn.

**14d — Comment không phải code.** Không bao giờ trích vị trí học được từ comment.
Đi tới **định nghĩa thật**, trích chỗ đó.

### Nhóm B · Trước khi BẮT ĐẦU

**14g — Ba giây tra trước khi thiết kế.** Trước khi thiết kế/viết bất cứ thứ gì:
`ls docs/` + grep tên chủ đề + grep tên component.
Lỗi 12b xảy ra vì bỏ bước này: `SPEC-VITALS-*` đã có 2 file, `components/avatar/` đã có 1620 dòng.

**14e — Luật dừng hai lần.** Hai lần thử cùng một việc mà không đạt ⇒ **DỪNG**. Không vá lần ba.
Báo: đã thử gì, hỏng ở đâu, **tiền đề nào có thể sai**. Để Hoà chọn hướng.

### Nhóm C · Khi ĐỘNG VÀO MÁY HOÀ ⚠️ *(mới, từ lỗi 12)*

**14h — Đường dẫn phải chứng minh được trước khi ghi.**
Trong sandbox này `~` = **thư mục phiên**, KHÔNG phải máy Hoà. Máy Hoà nằm dưới
`/sessions/<phiên>/mnt/<thư mục>/`. Trước mọi lệnh làm thay đổi (`mv`, `cp`, ghi đè):
`ls -d` đường dẫn **nguồn** và **đích** trước, in ra, xác nhận có thật.

**14i — KHÔNG BAO GIỜ `2>/dev/null` trên lệnh làm thay đổi.**
Nuốt lỗi là tự mù. Chỉ được dùng trên lệnh **chỉ đọc**.

**14j — Kiểm từ HƯỚNG KHÁC với hướng đã hành động.**
Đây là luật đắt nhất. Sau khi di chuyển tệp: **đếm tệp ở ĐÍCH**, đừng chỉ xác nhận nguồn đã trống.
Phép kiểm dùng chung giả định sai với hành động thì **không phải phép kiểm**.

**14k — Không xoá, chỉ dời.** `device_bash` không xoá được (đúng thiết kế). Dời vào `_to_delete/`,
báo Hoà đường dẫn, để Hoà tự xoá.

**14l — Dữ liệu không thể thay thế thì hỏi trước.** Tệp Hoà tạo ra (bản vẽ, `.idf`, `brand-kit.json`,
`dev.db`, ảnh) — dời/đổi tên phải hỏi. Tệp tạo lại được (`node_modules`, `.next`, `dist`, `.dmg`) —
cứ dọn, báo sau.

### Nhóm D · Khi SOI việc của Claude Code

**14f — Đối xử với mình như với Claude Code.** Trước khi gửi bất kỳ kết luận nào: chạy đúng phép
kiểm mà mình sẽ đòi ở báo cáo của nó. Không sẵn lòng chạy ⇒ hạ xuống nhãn 💭 và nói rõ chưa kiểm.

**14m — Kiểm cả claim PHỦ ĐỊNH.** "Chỗ này KHÔNG có X" là loại dễ sai nhất. Grep lại.

**14n — Việc chạm vào quyền của người khác thì đọc nhãn thật trên màn hình.**
Không suy từ ngữ cảnh. Lỗi 4 và 5 suýt cắt quyền của Vinh trên bảng ATLAS — hậu quả rơi vào
người khác, không phải Hoà.

### Nhóm E · GIAO TIẾP

**14o — Một khối, một đích, đích ghi ở dòng đầu.** Không bao giờ để Hoà phải đoán khối nào dán vào đâu.

**14p — Phân biệt "đã verify" với "suy ra".** Không nhận vơ. Chỗ nào không test thật được thì nói rõ.

---

## 3 · Kiểm nhanh trước khi gửi

1. Câu nào chưa gắn nhãn?
2. Số nào chưa chạy lệnh sinh ra?
3. Lần đọc gần nhất cách đây bao lâu? Có commit nào chen vào?
4. Có chỗ nào trích từ comment không?
5. Đây là lần thử thứ mấy của cùng một việc?
6. **Đã `ls docs/` chưa — việc này đã có ai làm rồi chưa?**
7. **Nếu có ghi/di chuyển: đường dẫn đã in ra chưa? Có nuốt lỗi không? Kiểm ở ĐÍCH chưa?**

---

*Cowork, 01/08/2026. Nối tiếp Luật #4 (code là sự thật) — luật này nói rõ thêm: đọc code CÓ HẠN DÙNG,
và hành động lên máy người khác phải chứng minh đường dẫn trước.*
