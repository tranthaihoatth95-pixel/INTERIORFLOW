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
| 13 | **Viết "cấm dùng magic" vào tài liệu — trong khi Hoà vừa chốt "đổi nghĩa mẫu → magic, KHÔNG cấm"** | ⑥ |
| 14 | **Vi phạm Luật Trung Tính 20 phút sau khi vừa được nhắc** — ghi "lấy board TTT làm bố cục mặc định" vào tài liệu quyết định | ⑥ |
| 15 | Đọc `doc.shapes` (không tồn tại) thay vì `doc.entities` → báo nhầm "0 shape / mất dữ liệu" **hai lần** trong B5 | ③ |
| 16 | Đếm 29 file Escape bằng mắt — số thật **30** | ③ |
| 17 | Nói "`cp` không phải cách sao lưu SQLite hợp lệ" — bản `cp` thật ra `integrity_check` = `ok` | ③ |

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

**⑥ Viết vào tài liệu điều Hoà KHÔNG chốt.** Đây là loại nặng nhất vì tài liệu **sống lâu hơn cuộc
chat**. Phiên sau đọc file, thấy chữ trong đó, tưởng là Hoà đã chốt. Một câu tự ý thêm hôm nay thành
"luật" của tháng sau. Hai biến thể:
- **Lật ngược quyết định** (lỗi 13): Hoà chốt A, Cowork thấy A rủi ro, viết ¬A vào file kèm lý lẽ.
  Lý lẽ có thể đúng — nhưng chỗ của nó là **tin nhắn**, không phải file.
- **Nhét lại điều đã bị cấm** (lỗi 14): luật trung tính vừa được nhắc, 20 phút sau vẫn viết tên
  studio thật vào tài liệu quyết định. Nhắc miệng không đủ — phải thành bước kiểm trước khi ghi.

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

**14b — Hạn dùng 20 phút — áp cho MỌI thứ Hoà cho xem, không chỉ code.**
Kết luận về code cũ hơn **một commit của Claude Code** ⇒ đọc lại trước khi gửi.
Không nhớ đọc lúc nào ⇒ coi như hết hạn.

| Loại | Hết hạn khi |
|---|---|
| Code đã đọc | có commit chen vào (20–40 phút) |
| **Ảnh chụp màn hình** | Hoà gửi ảnh mới, **hoặc** Claude Code vừa sửa đúng màn đó |
| **Terminal output** | ngay sau lệnh kế tiếp — không suy trạng thái hiện tại từ ảnh cũ |
| **Tài liệu `docs/`** | Claude Code có quyền ghi vào `docs/` — đọc lại trước khi trích |

⚠️ Ảnh là loại **dễ tin nhầm nhất**: nó trông như bằng chứng trực tiếp, nhưng nó là ảnh của **một
thời điểm**. "Trên ảnh không có nút X" không có nghĩa "hiện giờ không có nút X".

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

**14q — CƠ SỞ DỮ LIỆU: bốn điều tuyệt đối** *(từ sự cố `dev.db` 01/08)*

| # | Luật | Vì sao |
|---|---|---|
| 1 | **KHÔNG chạy `prisma db push` · `migrate dev` · `migrate reset` qua sandbox** | FUSE không làm được khoá `fcntl` POSIX ⇒ SQLite đứt giữa `CreateTable`. Soạn lệnh sẵn, **Hoà chạy trên máy thật** |
| 2 | **Sao lưu bằng `sqlite3 dev.db ".backup 'ten'"`**, không dùng `cp` | `cp` chép lúc đang ghi thì được bản rách. Lần 01/08 `cp` may mà `ok` — **may không phải luật** |
| 3 | **Gặp sự cố DB thì DỪNG, không tự chữa** | Tự chữa là nơi mất dữ liệu thật sự xảy ra, không phải ở sự cố gốc |
| 4 | **KHÔNG BAO GIỜ xoá `dev.db-journal`** | Đó là **cuốn sổ hoàn tác**. Mở đúng cách là SQLite tự lùi. Xoá nó = vứt đường về |

🧮 Chứng cứ 01/08: `db push` bị chặn giữa chừng → hot journal (chữ ký `d9d5 05f9 20a1 63d7`, 3 trang)
→ mở trên máy thật → tự lùi → `PRAGMA integrity_check` = `ok` cả ba tệp. **Mất 0 dữ liệu.**
Chênh 7 MB là do dev server đang chạy ghi tiếp *sau khi* đã lùi; chênh byte 27 là bộ đếm thay đổi.

### Nhóm D · Khi SOI việc của Claude Code

**14f — Đối xử với mình như với Claude Code.** Trước khi gửi bất kỳ kết luận nào: chạy đúng phép
kiểm mà mình sẽ đòi ở báo cáo của nó. Không sẵn lòng chạy ⇒ hạ xuống nhãn 💭 và nói rõ chưa kiểm.

**14m — Kiểm cả claim PHỦ ĐỊNH.** "Chỗ này KHÔNG có X" là loại dễ sai nhất. Grep lại.

**14n — Việc chạm vào quyền của người khác thì đọc nhãn thật trên màn hình.**
Không suy từ ngữ cảnh. Lỗi 4 và 5 suýt cắt quyền của Vinh trên bảng ATLAS — hậu quả rơi vào
người khác, không phải Hoà.

### Nhóm E · GIAO TIẾP

**14o — Một khối, một đích, đích ghi ở dòng đầu.** Không bao giờ để Hoà phải đoán khối nào dán vào đâu.

⚖️ **Định dạng BẮT BUỘC — thiếu dòng này thì khối lệnh coi như chưa gửi:**

> **📍 DÁN VÀO: `<đâu>`** — ví dụ *Terminal máy thật, đang ở `~/Downloads/interiorflow`* ·
> *ô chat Claude Code chính* · *Project Settings → Instructions*

Kèm luôn: **kết quả mong đợi** (một dòng), và **làm gì nếu lỗi** (một dòng).
Hoà chỉ ra 01/08 rằng tôi vi phạm chính điều này **ngay lượt sau khi viết ra nó**.

**14o-bis — Lệnh HẸP, không lệnh RỘNG.** Cấm `git add -A` trần, `rm -rf` trần, `mv *` trần trên
máy Hoà. Liệt kê **đúng đường dẫn cần đụng**. 🧮 Bằng chứng 01/08: một `git add -A` suýt gói
`_to_delete/if-audit-bundle.tar.gz` (8,6 MB) + `if-design-system.pdf` vào commit "dọn trung tính".
Lệnh rộng tiết kiệm 10 giây soạn, đổi lấy một mớ phải gỡ.

**14p — Phân biệt "đã verify" với "suy ra".** Không nhận vơ. Chỗ nào không test thật được thì nói rõ.

### Nhóm F · Khi VIẾT TÀI LIỆU ⚠️ *(mới, từ lỗi 13 · 14)*

> Tài liệu **sống lâu hơn cuộc chat**. Chat bị nén thì mất; file thì phiên sau đọc và tin.
> Vì vậy ngưỡng để **ghi vào file** phải cao hơn ngưỡng để **nói trong chat**.

**14r — Hoà chốt gì thì ghi ĐÚNG điều đó.**
Không diễn giải rộng ra, không siết chặt lại, không lật ngược.
Không đồng ý ⇒ **nói ở tin nhắn**, để Hoà quyết. **Tuyệt đối không sửa trong file.**

| Hoà nói | Được ghi | ❌ Cấm ghi |
|---|---|---|
| "đổi nghĩa *mẫu* → *magic*, không cấm sản phẩm từ AI" | "từ khoá **Magic**; AI hỗ trợ kiến trúc sư" | ~~"cấm dùng magic"~~ |
| "học từ việc thật" | "học từ việc thật, **KHÔNG ship việc thật**" | ~~"lấy board TTT làm mặc định"~~ |

**14s — Ba câu hỏi bắt buộc trước khi lưu bất kỳ file `.md` nào:**

1. Câu nào trong file này **Hoà chưa hề nói**? → gắn *"Cowork đề xuất"* hoặc bỏ đi.
2. Có tên thật nào lọt vào không? — studio · khách hàng · dự án · `@ttt.vn` · ảnh việc thật.
   → **LUẬT TRUNG TÍNH**: IF là sản phẩm bán ra. Nhắc miệng không đủ, đây là **bước kiểm**.
3. File này **mâu thuẫn** với `00-CHOT.md` chỗ nào không? → sửa cho khớp, hoặc ghi rõ *"thay thế dòng X"*.

**14t — Chốt xong thì thêm 1 dòng vào `00-CHOT.md` ngay trong cùng lượt.**
Quyết định chỉ nằm trong chat = quyết định sẽ mất. Nén phiên tước mất mốc thời gian, và kết luận cũ
được *rửa* thành sự thật mới (nguyên nhân ①).

---

## 3 · Kiểm nhanh trước khi gửi

1. Câu nào chưa gắn nhãn?
2. Số nào chưa chạy lệnh sinh ra?
3. Lần đọc gần nhất cách đây bao lâu? Có commit nào chen vào? **Ảnh Hoà gửi từ bao giờ?**
4. Có chỗ nào trích từ comment không?
5. Đây là lần thử thứ mấy của cùng một việc?
6. **Đã `ls docs/` chưa — việc này đã có ai làm rồi chưa?**
7. **Nếu có ghi/di chuyển: đường dẫn đã in ra chưa? Có nuốt lỗi không? Kiểm ở ĐÍCH chưa?**
8. **Nếu là file `.md`: có câu nào Hoà chưa nói? có tên thật nào lọt vào? đã thêm dòng vào `00-CHOT.md` chưa?**
9. **Nếu đụng `dev.db`: có phải lệnh ghi không? có đang chạy qua sandbox không?** → dừng, soạn lệnh cho Hoà.

---

*Cowork, 01/08/2026 (bản 2 — thêm nguyên nhân ⑥, nhóm F, luật 14q–14t).
Nối tiếp Luật #4 (code là sự thật). Ba điều luật này nói rõ thêm: đọc code **có hạn dùng** và ảnh
cũng vậy · hành động lên máy người khác phải **chứng minh đường dẫn trước** · và tài liệu chỉ được
ghi **đúng điều Hoà chốt**, vì file sống lâu hơn chat.*
