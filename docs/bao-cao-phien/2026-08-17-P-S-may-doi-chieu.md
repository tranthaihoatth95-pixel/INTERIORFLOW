# BÁO CÁO P-S — MÁY ĐỐI CHIẾU SỔ ↔ CODE

> Phiên phụ P-S · 17/08 · **DỪNG Ở Ô ⓪ — BÁC BỎ TIỀN ĐỀ.** Không tạo `scripts/soi-doi-chieu.mjs`,
> không sửa `package.json`. Đây là tệp duy nhất P-S ghi ra.

---

## 1 · TỔNG QUAN

P-S **bác tiền đề của phiếu và dừng** theo đúng ô ⓪. Máy đối chiếu sổ ↔ code **ĐÃ TỒN TẠI** —
`scripts/soi-that.mjs` (171 dòng, 08/08), dòng 3 tự khai nguyên văn *"ĐỐI CHIẾU 57 SPEC ↔ CODE THẬT"*.
Nó không nằm trong `package.json` nên **chưa ai chạy**, và nó **đang hỏng**: 74% tệp nó quét là bản
sao cũ trong worktree của agent khác. Kèm theo, **bài tự kiểm bắt buộc ở ô ④.6 nay không thể đạt** —
`master tool` đã có 4 lần trong code từ 16/08, nên theo đúng định nghĩa MA của chính phiếu
(*≥3 trong sổ **VÀ 0** trong code*) nó không còn là ma.

---

## 2 · CHI TIẾT — BẰNG CHỨNG

### ⓪b TIỀN ĐỀ HẠ TẦNG — ✅ PASS
```
$ git log --oneline -1
e57e2f6 docs(memory): lệnh mở phiên bản 17/08 — 6 luật đắt nhất + hàng đợi đã chốt
$ git rev-list --count HEAD..main
0
```
Khớp mốc `e57e2f6` phiếu ghi. Nhánh `main`, cây sạch (chỉ 2 tệp phiếu chưa theo dõi).

### ⓪ TIỀN ĐỀ NGHIỆP VỤ — 🔴 **BÁC BỎ**

**Tiền đề phiếu:** *"IF chưa có máy nào đối chiếu văn bản sổ với code thật. Năm máy soi hiện có đều
quét MỘT bên…"*

| # | Khẳng định của phiếu | Đo được | Bằng chứng |
|---|---|---|---|
| 1 | *chưa có máy nào đối chiếu sổ ↔ code* | 🔴 **SAI** | `scripts/soi-that.mjs:3` — *"ĐỐI CHIẾU 57 SPEC ↔ CODE THẬT"*; `:125` đọc `docs/SPEC-*.md`, `:106` rút định danh, `:68` tìm trong code |
| 2 | *5 máy soi đều quét một bên* | ✅ **ĐÚNG** | `soi-frontier` 0 · `soi-thao-tac` 0 · `soi-contract` 0 dòng nhắc `docs/`; `soi-hinh-hoc` 1 (chỉ chuỗi ghi chú); `soi-tu-dien` 19 nhưng quét `docs/` như **tập tệp cần soi nhãn**, không đối chiếu với code |
| 3 | *danh sách 5 máy là đủ* | 🔴 **THIẾU 2** | `soi-that.mjs` (đối chiếu spec↔code, **không** trong `package.json`) · `check-chot.mjs` (9 luật chốt↔code, **có** trong `npm test`) |

**Máy thứ 6 và thứ 7 phiếu không biết:**

- **`scripts/soi-that.mjs`** — đúng họ việc P-S được giao. Sinh 08/08 vì cùng một painpoint phiếu
  đang mô tả; docstring `:13-16` ghi: *"Sổ GAP-IF ghi ❌ · SPEC ghi 'đã có' · KHÔNG AI ĐỐI CHIẾU"*.
- **`scripts/check-chot.mjs`** — 9 luật *"quyết định đã chốt ↔ code thi công"*, viết tay (đọc `docs/`
  động = **0**), nguồn chỉ là chuỗi ghi chú. Khác họ, nhưng cùng mục tiêu.

### 🔴 PHÁT HIỆN NGOÀI PHẠM VI — `soi-that.mjs` ĐANG HỎNG, CÙNG HỌ BUG ĐÃ GHI SỔ 16/08

`scripts/soi-that.mjs:45`:
```js
const BO_QUA = new Set(['node_modules', '.next', '.git', 'dist', 'dist-installer', '.worktrees', 'coverage', 'docs']);
```
Loại `.worktrees` — nhưng đường thật là **`.claude/worktrees`**. Đo:

```
tổng tệp quét: 3433
trong đó từ .claude/worktrees: 2555        ← 74%
```
Ba worktree agent khác đang mở (`agent-a314eec0ea9c06a7e` · `agent-a54fc5a8884c021bd` ·
`agent-a919414f6dd76cb2e`). Hệ quả: **mọi dòng `file:dòng` nó in ra đều trỏ vào bản sao cũ**, không
phải cây chính. Nguyên văn output:
```
✅ BLOCK_MAP    .claude/worktrees/agent-a314eec0ea9c06a7e/lib/cad/furniture.ts:643   108 nơi gọi
✅ drawSnap     .claude/worktrees/agent-a314eec0ea9c06a7e/components/cad/CadCanvas.tsx:3508
──────────────────────────────────────────────────────────────────────
✅ spec nói có · code CÓ THẬT & đã dùng : 27
🟡 code CÓ nhưng 0 NƠI GỌI             : 0
❌ spec nói có · code KHÔNG THẤY       : 5
⚠️ 52 spec KHÔNG rút được định danh (viết bằng văn xuôi) — PHẢI ĐỌC TAY
```

⭐ **Đây đúng bug đã ghi `00-CHOT` 16/08** cho `package.json` (*"bộ lọc test loại `*/.worktrees/*`
nhưng đường thật là `.claude/worktrees/*`"*). Lần đó vá ở `package.json`; **không ai đi soi xem chỗ
nào khác cùng mắc** — và `soi-that.mjs` mắc y hệt. Nó sống được vì **không nằm trong `package.json`**
(`grep -c "soi-that" package.json` = **0**) nên chưa ai chạy để thấy.

### 🔴 BÀI TỰ KIỂM Ô ④.6 ĐÃ LỖI THỜI — KHÔNG THỂ ĐẠT

Phiếu ④.3 định nghĩa **MA** = *≥3 lần trong sổ **VÀ 0 lần trong code***. ④.6 bắt máy phải bắt được
`master tool`. Đo hôm nay:

| | số lần |
|---|---|
| sổ sống (`docs/` trừ nhật ký) | **31** |
| toàn `docs/` | 56 |
| **code** (`lib/` `components/` `app/`) | **4** ← không còn 0 |

Bốn chỗ đó là **docstring chống-ma viết 16/08**, tức phần vá đã có tác dụng:
- `lib/nodes/cua-so-cong-cu.ts:5-6` — *"Sổ dùng 'master tool' 26 lần cho thứ mà code đã đặt tên `ToolWindow` từ 01/08"*
- `components/render-studio/ToolWindow.tsx:7-8` — *"một tên: `cửa sổ công cụ`, khoá…"*

⇒ Theo đúng luật của chính phiếu, `master tool` **không còn là MA**. Muốn ⑥b xanh thì phải nới định
nghĩa — mà ⑥b ghi rõ **"Cấm nới điều kiện cho qua cửa"**. Vòng tự đóng này **không có lời giải hợp lệ**;
phát hiện ở ô ⓪ rẻ hơn phát hiện ở vòng 5.

### 🔴 PHIẾU MÂU THUẪN VỚI CHÍNH NÓ

| Ô | Câu |
|---|---|
| ⑤ | *"trùng thì **mở rộng cái cũ**, đừng đẻ máy thứ hai"* + trích `[Đ2]` nhìn vào trong trước |
| ③ | *"⛔ không đụng `scripts/soi-*.mjs` cũ"* |

Chỗ trùng chính là `scripts/soi-that.mjs`. Ô ⑤ bảo mở rộng nó; ô ③ cấm chạm nó. **Việc đúng nằm ngoài
vùng được phép** ⇒ làm tiếp trong vùng cho phép là cố tình đẻ máy thứ hai, đúng thứ `[Đ2]` cấm và đúng
tội N8.

---

## 3 · TỔNG KẾT — RỐT CUỘC LÀ GÌ

Phiếu P-S ra đời để chữa bệnh *"sổ khẳng định một đằng, code một nẻo, không máy nào kiểm"*. **Chính
phiếu mắc đúng bệnh đó**: nó khẳng định *"chưa có máy nào"* trong khi máy nằm sẵn ở
`scripts/soi-that.mjs` từ 08/08, và khẳng định `master tool` *"0 trong code"* trong khi code đã có 4
chỗ từ 16/08.

Nhưng **nhu cầu thì có thật** — chỉ là đã trả một phần, và phần đã trả đang mục:

| | `soi-that.mjs` làm được | Còn thiếu |
|---|---|---|
| Nguồn sổ | chỉ `docs/SPEC-*.md` | `docs/*.md` · `docs/nc/` · `docs/phieu-giao/` |
| Dạng bắt | `` `fn()` `` · `` `CONST` `` trên dòng khẳng định | chuỗi backtick thường, `PascalCase`, đuôi tệp — **`master tool` là văn xuôi ⇒ vô hình** (`grep "master tool" docs/SPEC-*.md` = rỗng) |
| Chiều | một chiều: sổ nói có → code không thấy | **chiều CÂM** (code có, sổ không biết) chưa ai làm |
| Danh sách tha | không có | ma đã khai tử báo đỏ mãi |
| Được chạy | **không** — vắng trong `package.json` | |
| Đúng cây | **không** — 74% tệp từ worktree lạ | |

⇒ Bài thật không phải *"xây máy mới"* mà là **ba việc trên một máy đã có**: ① vá đường
`.claude/worktrees` ② nối vào `package.json` ③ nới nguồn sổ + thêm chiều CÂM.

---

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Được:**
- Cơ chế ô ⓪ lần nữa sinh lời: chặn ở phút đầu thay vì sau 5 vòng tự đóng không thể xanh.
- Thu về **hai** thứ phiếu không đặt hàng: một máy soi hỏng 74% và một bug tái phát cùng họ đã ghi sổ.

**Chưa được / rủi ro:**
- P-S **không giao được sản phẩm chạy được** — không có máy mới nào.
- Bug `.claude/worktrees` **P-S không vá** (ngoài vùng ô ③). Nó vẫn đang hỏng.
- Chưa soi các script khác xem còn chỗ nào mắc cùng bug đường dẫn.
- Con số 74% đúng **tại thời điểm này**; nó đổi theo số worktree đang mở, tức output `soi-that`
  **đổi theo việc agent khác có đang chạy hay không** — một máy kiểm mà kết quả phụ thuộc chuyện đó
  thì không tất định, phạm đúng luật *"chạy 10 lần ra 10 kết quả giống nhau"*.

---

## 5 · HƯỚNG XỬ LÝ — 3 GÓC

**Hướng A — vá + nối `soi-that.mjs`, không đẻ máy mới.**
Ba việc: thêm `.claude/worktrees` vào `BO_QUA:45` · thêm `"soi:that"` vào `package.json` · nới nguồn sổ
và thêm chiều CÂM.
➕ đúng `[Đ2]` và `[T2]`; rẻ nhất; vá luôn bug đang sống; không thêm vật thể.
➖ ngoài vùng ô ③ ⇒ cần T mở phiếu mới; `soi-that` đang bị phiên khác giữ theo luật *"không đụng
`soi-*.mjs` cũ"*.

**Hướng B — làm đúng phiếu, dựng `soi-doi-chieu.mjs` mới.**
➕ trong vùng, không đụng ai; chiều CÂM là thứ thật sự chưa có.
➖ **hai máy cùng đọc sổ đối chiếu code** = đúng tín hiệu ④ của `may-soi-dong-dang` (*cùng một danh
sách khai ở nhiều chỗ*); `soi-that` hỏng vẫn hỏng; và ô ④.6 vẫn không đạt.

**Hướng C — chỉ vá bug, hoãn phần máy mới.**
➕ nhanh nhất, trả lại một máy đang có mà không dùng được; kiểm được ngay bằng số 2555→0.
➖ chiều CÂM vẫn trống — mà đó mới là phần chưa ai làm.

---

## 6 · ĐỀ XUẤT — **HƯỚNG A**, chia hai nhịp

**Nhịp 1 (rẻ, làm ngay):** vá `BO_QUA:45` + nối `package.json`. Nghiệm thu đo được: số tệp quét
**3433 → 878**, và mọi `file:dòng` in ra không còn chứa `.claude/worktrees`.

**Nhịp 2:** nới nguồn sổ (`docs/*.md` · `nc/` · `phieu-giao/`) + thêm chiều CÂM + danh sách tha —
**vào chính `soi-that.mjs`**, không đẻ tệp thứ hai.

**Vì sao A chứ không B:** phiếu P-S sinh ra để diệt *"hai bản của cùng một thứ"*. Dựng
`soi-doi-chieu.mjs` cạnh `soi-that.mjs` là **tự tạo ra ca đầu tiên cho chính máy đó bắt**. Và bug 74%
sẽ nằm im thêm một vòng nữa vì hướng B không đụng tới.

**Vì sao không C:** vá xong mà không nới thì `master tool` vẫn vô hình (nó là văn xuôi, không phải
`` `fn()` ``) — tức ca đắt nhất đã trả giá 6 phiếu vẫn không có máy nào bắt được.

**Ba việc kèm theo, T tự quyết:**
1. Ô ④.6 phải đổi ca tự kiểm — `master tool` **không còn 0 trong code**. Đề xuất: cắm ma giả vào
   danh sách tha rồi gỡ ra, như phiếu đã mô tả, nhưng dùng chuỗi **không tồn tại thật**.
2. Soi các script còn lại xem chỗ nào mắc cùng bug `.claude/worktrees`.
3. Ô ① của phiếu ghi *"`master tool` 26 lần trong sổ / 0 trong code"* — số thật **31 / 4**.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- 🔴 **Con số báo đỏ là SÀN, không phải trần.** P-S đọc kỹ `soi-that.mjs` · `check-chot.mjs` và
  *đầu* 5 máy còn lại. **Chưa đọc hết** `soi-frontier` · `soi-thao-tac` · `soi-contract` ·
  `soi-hinh-hoc` từ đầu tới cuối, cũng chưa đọc `check-mocks.mjs` · `contract-registry.mjs` ·
  `thao-tac-registry.mjs` · `sinh-ship-map.mjs` · `soi-app.py`. **Có thể còn máy thứ 8 đối chiếu
  sổ↔code mà P-S chưa thấy** — kết luận "thiếu 2" là sàn.
- **Phân loại 5 máy là ĐO GIÁN TIẾP**, không đọc toàn văn: đếm dòng nhắc `docs/` rồi suy. `soi-tu-dien`
  19 dòng — P-S đọc là *quét docs để soi nhãn*, không phải đối chiếu code; **chưa xác minh từng dòng**.
- **Không chạy `tsc` / `npm test` / `soi:tu-dien` / `soi:frontier`** — ô ⑥ chỉ áp cho phiên có tạo mã.
  Dừng ở ⓪ nên không có gì để nghiệm thu. ⇒ **P-S không có căn cứ nói cây hiện sạch hay bẩn.**
- **Bug `.claude/worktrees` là ĐỌC MÃ + ĐO TỆP, chưa vá chưa thử.** Số 3433/2555 do P-S chạy lại đúng
  hàm `quet()` bằng script rời, **không** phải instrument chính `soi-that.mjs`. Sai lệch nhỏ có thể có.
- **Chưa kiểm 5 dòng ❌ của `soi-that`** (*spec nói có, code không thấy*) là báo đúng hay báo giả —
  chúng đang được tính trên cây worktree sai nên **chưa dùng được**.
- **Hai nguồn mâu thuẫn, nêu cả hai, không chọn hộ T:** ô ⑤ (*mở rộng cái cũ*) ↔ ô ③ (*cấm đụng
  `soi-*.mjs`*). P-S nghiêng ⑤ vì nó trích `[Đ2]`, nhưng ③ là ràng buộc vùng file — **T quyết**.
- **Chưa xác minh phiên nào đang giữ `soi-that.mjs`.** Nếu đang có phiên khác sửa nó thì hướng A phải
  qua `claim-keys` trước.
- Chưa mở `docs/TRIET-LY-IF.md` đọc lại số `[T2]`/`[Đ2]` — P-S dùng theo phiếu ghi. Theo đúng luật
  16/08 (*trích mã điều khoản phải mở file đọc số*), **hai mã này trong báo cáo là CHƯA XÁC MINH**.

## ⑦c HẠN DÙNG KẾT LUẬN

Kết luận này **hết đúng khi**:
- ai đó vá `BO_QUA` của `soi-that.mjs` hoặc nối nó vào `package.json` → phần "hỏng 74% / chưa ai chạy"
  hết hiệu lực;
- ba worktree agent đóng lại → con số 2555 tụt về gần 0 **mà bug vẫn còn** (nó chỉ ẩn đi, đây là chỗ
  dễ kết luận nhầm là "đã tự khỏi");
- ai đó xoá 4 chỗ `master tool` trong docstring code → nó **thành ma trở lại**, ô ④.6 lại đạt;
- T sửa ô ③ cho phép đụng `soi-that.mjs` → mâu thuẫn ⑤↔③ tan, hướng A làm được ngay;
- có máy thứ 8 lộ ra khi đọc hết `scripts/` → bảng "thiếu 2" phải viết lại.

---

## ⑧ DÂY MÁY

**P-S KHÔNG mở entry registry** (phiếu ghi *T tự mở*), **KHÔNG sửa `frontier-registry.mjs`**.
Đề nghị T cân nhắc trước khi mở `may-doi-chieu-so-code`: nếu đi hướng A thì entry nên trỏ vào
`soi-that.mjs` (máy đã có, cần vá + nới), không phải một máy mới.
