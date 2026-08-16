# PHIẾU P-S2 — VÁ VÀ NỚI `soi-that.mjs` (thay P-S đã bị bác)

> Giao: T · 17/08 · vùng khoá: `scripts/soi-that.mjs` + `package.json` + báo cáo.
> ⛔ **KHÔNG đụng** `scripts/frontier-registry.mjs` · các `scripts/soi-*.mjs` **khác** · `lib/materials/` và `components/materials/` (phiên **P-T** đang giữ) · `components/home/` (T giữ).

---

## 🔴 VÌ SAO CÓ PHIẾU NÀY — P-S ĐÃ BÁC ĐÚNG, T NHẬN

Phiếu P-S giả định *"IF chưa có máy nào đối chiếu văn bản với code thật"*. **Sai.** P-S bác, T verify độc lập từng điểm — **đúng cả năm**:

| Khẳng định của P-S | T kiểm |
|---|---|
| `scripts/soi-that.mjs:3` tự khai *"ĐỐI CHIẾU 57 SPEC ↔ CODE THẬT"*, sinh 08/08 từ **đúng** painpoint này | ✅ đọc tận mắt, kể cả đoạn *"Sổ là ảnh chụp cũ. Spec là hợp đồng. **Code là sự thật**"* |
| `soi-that.mjs` **vắng trong `package.json`** ⇒ chưa ai chạy | ✅ `grep -c` = **0** |
| `:45` loại `.worktrees` nhưng đường thật là `.claude/worktrees` | ✅ đúng nguyên văn dòng 45 |
| `master tool` nay **4 lần trong code** ⇒ bài tự kiểm ④.6 của P-S **không thể đạt** | ✅ 4 chỗ, đều là docstring chống-ma viết 16/08 |
| Phiếu P-S **tự mâu thuẫn**: ô⑤ *"trùng thì mở rộng cái cũ"* ↔ ô③ *"cấm đụng `soi-*.mjs` cũ"* | ✅ đúng |

> ⭐ **Ghi thẳng để phiên sau đọc:** T soạn một phiếu dựng máy bắt *"sổ nói có mà code không có / code có mà sổ không biết"* — và **chính phiếu đó là một ca của vế thứ hai**. Không cơ chế nào bắt được ngoài **quyền agent bác T**. Đây là lần thứ 10.

---

## ⓪b TIỀN ĐỀ HẠ TẦNG
```
git log --oneline -1
git rev-list --count HEAD..main
```
Lệch main > 0 → **DỪNG NGAY**, báo T. Mốc khi phóng: `e57e2f6`.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — xác nhận hoặc BÁC
> **TIỀN ĐỀ:** *"`scripts/soi-that.mjs` là máy đối chiếu văn-bản ↔ code **đã có sẵn** của IF, nhưng đang **hỏng và tắt tiếng**: `BO_QUA` loại nhầm đường worktree nên phần lớn tệp nó quét là bản sao cũ, và nó không có mặt trong `package.json` nên chưa ai chạy. ⇒ Việc đúng là **vá + nối + nới nó**, KHÔNG dựng máy thứ hai."*

→ `[XÁC NHẬN | BÁC BỎ | KHÔNG CÓ BẰNG CHỨNG]` + file:dòng. Bác thì **DỪNG**, báo T.

## ① BỐI CẢNH
Painpoint của người xây IF: **văn bản khẳng định một đằng, code một nẻo, không ai kiểm.** Giá đã trả: `master tool` (26 sổ / 0 code lúc đó) ngốn 6 phiếu · bản đồ mồ côi 19 ngày · **17/08 thêm 2 ca** (*"`lib/materials` = 0 code"* và *"hình nền chưa cắm"* — cả hai sai, T bắt bằng tay do tình cờ đo lại).

Trớ trêu: máy chữa bệnh này **đã có từ 08/08**, sinh ra sau khi Hoà hỏi *"cái lỗi gì mà lặp lại hoài vậy, không khám à?"* — rồi **chính nó bị bỏ quên**, đúng cái bệnh nó sinh ra để chữa.

## ② ĐỌC TRƯỚC
| File | Vì sao |
|---|---|
| `scripts/soi-that.mjs` **toàn bộ** | đối tượng của phiếu; đọc hết docstring trước khi sửa dòng nào |
| `scripts/check-chot.mjs` | anh em cùng họ, **có** trong `npm test` — học cách nó được nối vào vòng |
| `scripts/soi-tu-dien.mjs` | cách khai **danh sách tha kèm lý do ngay trong mã** — bắt chước đúng khuôn đó |
| `docs/IF-KIEN-TRUC.md` §10 · §11 | định nghĩa *khái niệm ma* + luật ba tầng từ vựng |

## ③ VÙNG FILE
- **SỬA**: `scripts/soi-that.mjs`
- **SỬA**: `package.json` — thêm `"soi:that": "node scripts/soi-that.mjs"`
- **TẠO**: `docs/bao-cao-phien/2026-08-17-P-S2-va-noi-soi-that.md`

## ④ VIỆC — HAI NHỊP, làm xong nhịp 1 mới sang nhịp 2

### NHỊP 1 — VÁ (bắt buộc)
1. `BO_QUA` loại **đúng** đường worktree thật. Đo hiện trạng: **13.816** tệp `.ts/.tsx/.mjs` nằm trong `.claude/worktrees/` so với **1.160** tệp của cây chính ⇒ nếu không loại, phần lớn thứ nó quét là **bản sao cũ**, và mọi `file:dòng` nó in đều trỏ nhầm cây.
   ⚠️ **Vá cho bền, đừng vá đúng một chuỗi**: loại theo *"bất kỳ đoạn đường dẫn nào chứa `worktrees`"*, để lần sau đổi chỗ đặt worktree vẫn không thủng. Đây đúng bug `00-CHOT` đã vá cho `package.json` 16/08 — **lần đó không ai soi chỗ khác cùng mắc**.
2. Nối vào `package.json`. Máy không có lối chạy thì **không tồn tại** — đó là lý do nó ngủ 9 ngày.
3. Chạy lại, **dán nguyên văn** kết quả trước ↔ sau (số tệp quét · số ✅/🟡/❌).
4. **5 dòng ❌ hiện có tính trên cây sai** ⇒ sau khi vá phải soi lại từng dòng: dòng nào **thật**, dòng nào là **ảo do quét nhầm cây**. Đây là phần dễ bỏ qua nhất mà lại là phần có giá trị nhất.

### NHỊP 2 — NỚI (chỉ làm nếu nhịp 1 đã xanh)
5. **Nới NGUỒN VĂN BẢN**: nay nó đọc spec; nới sang `docs/*.md` + `docs/nc/` + `docs/phieu-giao/`. **Loại tường minh kèm lý do ngay trong mã**: `CHANGELOG` · `docs/memory/` · `docs/bao-cao-phien/` · `00-CHOT` — đó là **nhật ký**, sửa nhật ký cũ là *viết lại lịch sử*, không phải sửa lỗi.
6. **Thêm chiều CÂM** (nay chỉ có một chiều): tên có trong code, **0 lần trong văn bản sống**, mà là *file/export cấp mô-đun* — thứ đáng lẽ bản đồ phải biết. Ví dụ thật đang mở: `lib/materials/resolve.ts` viết 07/08, **10 ngày không văn bản nào nhắc**, nên sổ vẫn ghi *"0 code"*.
7. **DANH SÁCH THA** cho ma đã khai tử (`master tool`), **kèm dòng ghi rõ đã khai tử** — để nó không báo đỏ mãi.

## ⑤ RÀNG BUỘC
- **KHÔNG** lệnh `git` ghi · **KHÔNG** dev server · **KHÔNG** dựng script mới (đó là cả điểm của phiếu).
- **KHÔNG dùng AI trong máy soi** — kiểm là việc của MÁY: tất định, 0đ, chạy 10 lần ra 10 kết quả giống nhau (Hoà duyệt 15/08).
- Chữ báo cáo terminal theo từ điển máy (`npm run soi:tu-dien` không thêm lệch mới).
- **Mã điều khoản: MỞ `docs/TRIET-LY-IF.md` ĐỌC SỐ**, cấm chép theo phiếu (P-S tự khai đã chép — đúng, nhưng phải sửa). Liên quan: *một cỗ máy nhiều mặt tiền* · *nhìn vào trong trước*.
- **"Phiếu phải kèm giao diện"**: với máy soi, **mặt của nó là báo cáo terminal**, đúng như các máy cũ — **không** dựng trang web nào. T khai cách đọc này để Hoà bác được nếu sai.

## ⑥ NGHIỆM THU TỰ LÀM
```
node scripts/soi-that.mjs
npm run soi:that
npm test
npm run soi:tu-dien
npm run soi:frontier
```

## ⑥b ĐÍCH — VÒNG TỰ ĐÓNG, TRẦN 5 VÒNG
**ĐÍCH**: `soi-that.mjs` quét **0 đường chứa `worktrees`** (grep kết quả chứng minh) · có lối `npm run soi:that` · `npm test` 0 fail · `soi:tu-dien` và `soi:frontier` không thêm lệch mới · **bài tự kiểm: máy phải bắt được `.idfnotes` (0 code / 4 tệp sổ) và `KB-5` (0 code / 9 tệp sổ)** — hai con ma **còn sống thật**, dùng thay `master tool` (nay đã có 4 chỗ trong code nên không còn là ma).
Chưa đạt → tự sửa rồi chạy lại, **trần 5 vòng**. Quá trần → **DỪNG**, nộp bản chưa đạt kèm bảng *vòng nào hỏng vì gì*. Cấm nới điều kiện cho qua cửa.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-17-P-S2-va-noi-soi-that.md` — khuôn 6 phần (`docs/CLAUDE.md`), dán **nguyên văn** kết quả lệnh trước ↔ sau.

## ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc, trống cũng ghi "không có"
Đặc biệt: **P-S đã khai *"con số thiếu-2-máy là SÀN"*** — chưa đọc hết `soi-frontier`/`soi-thao-tac`/`soi-contract`/`soi-hinh-hoc`, chưa mở `check-mocks`·`contract-registry`·`thao-tac-registry`·`soi-app.py`. **Hãy đóng nốt câu này**: liệt kê **đủ** các máy kiểm đang có, mỗi máy một dòng *"canh cái gì ↔ cái gì"*, và nói rõ còn máy nào bị bỏ quên như `soi-that` không.

## ⑦c HẠN DÙNG KẾT LUẬN
Ghi rõ *"kết luận này hết đúng khi …"*.

## ⑧ DÂY MÁY
Entry registry: T tự mở `may-doi-chieu-so-code` sau audit, **trỏ vào `soi-that.mjs`** chứ không phải máy mới. **Agent KHÔNG sửa `frontier-registry.mjs`.**
