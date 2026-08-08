> **CÁCH DÙNG:** `Cmd+A` → `Cmd+C` → dán vào phiên **`p2 Kiểm tra 16 mảng code…`**
> ⚠️ Phải chạy trong **worktree riêng** — xem cuối tệp.

---

# LUẬT BẮT BUỘC — đọc trước khi gõ dòng code đầu tiên

Đọc theo thứ tự: `STATUS.md` → `docs/00-CHOT.md` → `docs/00-BAT-DAU-DOC-DAY.md`.
**KHÔNG đọc `CHANGELOG.md`.**

```
V6  · KHÔNG commit. Hoà commit. Làm xong để nguyên, báo cáo.
§0u · Chỉ COWORK-TỔNG được ghi docs/GAP-IF.md. Phiên khác ghi vào tệp OUT của mình.
§0ab· Sổ là ảnh chụp cũ. ĐO LẠI bằng máy trước khi tin bất kỳ con số nào.
§0ac· Báo cáo phải tự khai: tệp OUT tên gì, dán vào phiên nào.
N1  · Báo cáo KHÔNG phải bằng chứng. Mỗi việc "xong" phải kèm số đo.
N5  · Khai thật cái chưa xong.
N8  · Mọi dòng báo cáo có file:dòng.
```

**Luật ghi sổ**

```
Sổ là BIÊN BẢN. Ghi thêm, KHÔNG ghi đè. Không sửa quá khứ.
```

**Cửa kiểm trước khi báo xong**

```bash
npx tsc --noEmit -p .
node scripts/check-chot.mjs
npm test
```

---

# PHIẾU `p2` · DỌN TRẦN "5 SHEET" + CẮT `STATUS.md`

**Tệp OUT:** `docs/M-DON-TRAN-OUT.md`
**Sở hữu:** các chỗ nhắc trần "5 sheet" · `STATUS.md` · `CHANGELOG.md`
**Cấm đụng:** `prisma/` · `lib/server/` (`p12` giữ) · `lib/review/` · `components/review/` (`p3c` giữ) ·
`lib/three/build-ops.ts` · `components/render-studio/Command3DPanel.tsx` (`p14` giữ) ·
`docs/mocks/` · 4 tệp màn rỗng (`p3` giữ)

---

## VIỆC 1 — trần "5 sheet" · ⚠️ **PHẦN LỚN ĐÃ LÀM RỒI, ĐỌC KỸ TRƯỚC KHI ĐỘNG TAY**

> **Sửa 08/08 sau khi TỔNG đo lại.** Bản phiếu đầu ghi *"27 chỗ phải dọn"* — **số đó sai**,
> nó gộp cả `docs/` (biên bản lịch sử) vào cùng một rổ với code. Đo lại cho đúng:

```
MAX_SHEETS   →  ĐÃ GỠ HẲN từ 04/08 (D2 đợt 8)
                bằng chứng: lib/cad/model.ts:1316 · lib/cad/sheet-migrate.ts:7
"5 sheet" trong code (.ts/.tsx)  →  chỉ còn 2 chỗ, CẢ HAI LÀ COMMENT
"5 sheet" trong docs (.md)       →  45 chỗ — BIÊN BẢN, GIỮ NGUYÊN HẾT
```

**Việc thật còn lại chỉ có hai dòng chữ:**

| `file:dòng` | Nội dung | Xử |
|---|---|---|
| `components/studio/SheetTabBar.tsx:217` | comment `…thật ra là "sheet 1 / trần 5 sheet"…` | Sửa lời cho khớp hiện trạng (không còn trần) |
| `lib/present-editor/custom-templates.ts:12` | docstring `Slot hoá … đủ dùng cho deck ≤5 sheet` | Nếu slot-hoá **thật sự** chỉ chạy tốt tới 5 sheet thì **giữ**, nhưng đổi lời cho rõ đó là *giới hạn của thuật toán slot*, **không phải trần sản phẩm** |

**Rồi tự đi tìm chặn ẩn** — chặn có thể không mang chữ "5 sheet":

```bash
grep -rnE "sheets\.length\s*>=?\s*[0-9]|MAX_SHEET|maxSheets|limit.*[Ss]heet" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v '\.test\.'
```

TỔNG chạy lệnh này ra **0 chặn thật** (chỉ có `sheets.length > 1` để quyết định nút Đóng —
đúng nghiệp vụ, không phải trần). Đo lại; ra khác thì đó mới là việc.

⛔ **KHÔNG sửa 45 chỗ trong `docs/`.** Sổ là biên bản. Sửa quá khứ là xoá dấu vết quyết định.

Ghi vào OUT: bảng 2 dòng đã sửa + kết quả lệnh tìm chặn ẩn.

---

## VIỆC 2 — `STATUS.md` phình gấp 10 lần trần

```
STATUS.md hiện tại : 586 dòng · 8 674 từ
CLAUDE.md quy định : DƯỚI 800 TỪ
```

Đây là **nguyên nhân tràn context** mà `CLAUDE.md` cảnh báo thẳng. Mỗi phiên mở đầu đều nuốt
8 674 từ này trước khi làm được gì.

### Phải làm

**① Giữ lại trong `STATUS.md` — đúng 4 mục:**

```
· đang chạy
· vừa xong
· worktree đang mở
· việc kế tiếp
```

**② Phần đã xong chuyển sang `CHANGELOG.md`** — **ghi thêm, không ghi đè**.

**③ Đích: dưới 800 từ.** In số trước/sau vào OUT:

```bash
wc -w STATUS.md
```

### ⚠️ Đọc kỹ trước khi cắt

Trong `STATUS.md` có **thông tin sống** trộn lẫn với lịch sử. Ví dụ thật:

```
STATUS.md:42  "G-M3-15 (54 block) chừa cho p2 — không đụng, tầng dữ liệu ngăn Cấu kiện sẵn chỗ."
```

Dòng này là **lời dặn còn hiệu lực**, cắt nhầm là mất. Nguyên tắc:

> Dòng nào nói về **việc sẽ làm** hoặc **vùng đang giữ** → GIỮ.
> Dòng nào kể **việc đã làm xong** → chuyển sang `CHANGELOG.md`.

Không chắc thì **giữ lại và ghi vào OUT** cho TỔNG quyết. Thà dài còn hơn mất.

---

## VIỆC 3 — Thống nhất một thước đếm

Hiện có **hai thước cho cùng một thứ**, ra hai số khác nhau:

| Thước | Flow mồ côi | Mã đỏ |
|---|---|---|
| `scripts/soi-app.py` | **43/43** | 75 / 107 |
| Đo tay của TỔNG (07/08 23:30) | **45/46** | 72 |

Đây đúng là kiểu lệch số đã hại cả ngày 07/08 (vụ trùng tên Unicode cũng cùng dạng:
hai cách đếm, hai con số, không ai biết cái nào thật).

### Phải làm

1. Đọc `scripts/soi-app.py` — nó đếm **theo tiêu chí gì**?
2. So với cách đếm tay (`grep '🔴' docs/GAP-IF.md | wc -l` và truy vấn `Flow`).
3. **Chỉ ra chỗ lệch**, giải thích bằng `file:dòng`.
4. **Chọn MỘT thước làm chuẩn**, sửa cái còn lại cho khớp — hoặc ghi rõ vì sao hai thước **cố ý** đo hai thứ khác nhau.

⚠️ **Không tự ý xoá `soi-app.py`.** Nếu thấy nó sai, đề xuất trong OUT, để TỔNG quyết.

---

## NGHIỆM THU

| # | Đích |
|---|---|
| 1 | `wc -w STATUS.md` **< 800** ← *đây mới là việc chính của phiếu này* |
| 2 | 2 comment "5 sheet" đã sửa lời · lệnh tìm chặn ẩn ra **0 chặn thật** |
| 3 | Hai thước đếm **thống nhất**, hoặc giải thích được vì sao khác |
| 4 | `tsc` 0 lỗi · `check-chot` 0/0 · `npm test` không thêm lỗi |

> ⚖️ **Cân lại trọng tâm:** VIỆC 1 hoá ra chỉ là 2 dòng comment (`MAX_SHEETS` đã gỡ từ 04/08).
> **VIỆC 2 — cắt `STATUS.md` từ 8 674 xuống dưới 800 từ — mới là phần nặng và đáng giá nhất.**
> Dồn sức vào đó.

---

## BÁO CÁO — `docs/M-DON-TRAN-OUT.md`

1. Bảng ba cột cho 27 chỗ "5 sheet".
2. `STATUS.md`: số từ **TRƯỚC / SAU** + danh sách dòng **đã giữ lại vì còn hiệu lực**.
3. Kết luận về hai thước đếm, kèm `file:dòng`.
4. Mục **CHƯA VERIFY**.
5. Dòng cuối: *"Tệp OUT: `docs/M-DON-TRAN-OUT.md` · dán vào phiên `p2`"* (§0ac).

**KHÔNG commit.**

---

## ⚠️ TRƯỚC KHI BẮT ĐẦU — mở worktree riêng

```bash
cd ~/Downloads/interiorflow
git worktree add ../interiorflow-wt-p2 -b feat/p2-don-tran-sheet
cd ../interiorflow-wt-p2 && npm install && npm run dev -- -p 3014
```

Rồi mở phiên `p2` **trong thư mục `interiorflow-wt-p2`**.

> ⚠️ `STATUS.md` là tệp mà **mọi phiên đều đọc**. Sửa nó ở worktree riêng thì các phiên khác
> chưa thấy — đúng ý đồ. Hoà merge xong mọi phiên mới cùng thấy bản gọn.
