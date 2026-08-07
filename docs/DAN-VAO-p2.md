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

## VIỆC 1 — 27 chỗ còn nhắc trần "5 sheet"

Hoà **chốt 07/08**: bỏ giới hạn ≤5 sheet ở **TẤT CẢ** chặng (xem `docs/00-CHOT.md` mục 1).
Nhưng còn 27 chỗ nhắc. Đo lại — đừng tin số này:

```bash
grep -rniE "≤ ?5 sheet|5 sheet|toi da 5 (to|trang|sheet)" --include=*.ts --include=*.tsx --include=*.md . | grep -v node_modules
```

Phân **ba loại**, xử **khác nhau**:

| Loại | Cách nhận ra | Xử |
|---|---|---|
| **① Chặn thật trong code** | `if (sheets.length >= 5)`, hằng số `MAX_SHEETS = 5` | **Gỡ chặn.** Cần trần vì lý do kỹ thuật (bộ nhớ) thì đặt trần **cao và khai rõ lý do**, không phải 5 |
| **② Chữ hiện cho người dùng** | nhãn, tooltip, câu cảnh báo | Sửa lời cho **khớp hành vi mới** |
| **③ Ghi chép lịch sử trong `docs/`** | báo cáo cũ, sổ chốt | **GIỮ NGUYÊN** — sổ là biên bản, không sửa quá khứ |

⚠️ Nhầm loại ③ thành loại ② là **xoá dấu vết quyết định**. Đọc kỹ ngữ cảnh trước khi sửa.

Ghi bảng **ba cột** vào OUT: `file:dòng` · loại · đã xử ra sao.

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
| 1 | `wc -w STATUS.md` **< 800** |
| 2 | Số chỗ nhắc "5 sheet" **trong code** (không tính `docs/`) = **0**, hoặc còn lại có lý do kỹ thuật ghi rõ |
| 3 | Hai thước đếm **thống nhất**, hoặc giải thích được vì sao khác |
| 4 | `tsc` 0 lỗi · `check-chot` 0/0 · `npm test` không thêm lỗi |

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
