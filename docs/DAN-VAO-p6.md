> **CÁCH DÙNG:** `Cmd+A` → `Cmd+C` → dán vào phiên **`p6. GPL-3 tuân thủ và third-party licenses`**
> ⚠️ **CHẠY SAU CÙNG** — khi `p3c` · `p14` · `p3` · `p2` đã xong và Hoà đã merge hết.
> ⚠️ **Chạy MỘT MÌNH trên `main`**, KHÔNG worktree.
> *(cập nhật 08/08 sau khi `p12` xong và Hoà chốt phương án B)*

---

# LUẬT BẮT BUỘC

Đọc theo thứ tự: `STATUS.md` → `docs/00-CHOT.md` → `docs/00-BAT-DAU-DOC-DAY.md`.
**KHÔNG đọc `CHANGELOG.md`.**

```
V6  · KHÔNG commit. Hoà commit.
§0u · Chỉ COWORK-TỔNG được ghi docs/GAP-IF.md. Phiên này LIỆT KÊ, không tự ghi sổ.
§0ab· Sổ là ảnh chụp cũ. ĐO LẠI bằng máy trước khi tin bất kỳ con số nào.
N1  · Báo cáo KHÔNG phải bằng chứng. Mỗi việc "xong" phải kèm số đo hoặc ẢNH.
N5  · Khai thật cái chưa xong.
N8  · Mọi dòng báo cáo có file:dòng.
```

---

# PHIẾU `p6` · NGHIỆM THU TOÀN APP + BUILD FINAL

**Tệp OUT:** `docs/M-BUILD-FINAL-2-OUT.md`
**Sở hữu:** không sửa tính năng nào. **Chỉ ĐO** — và chỉ vá lỗi chặn build.

> Phiếu này là **cửa cuối**. Nó trả lời đúng một câu Hoà đã hỏi:
> *"nền đã vững, xương sống đã cứng, mọi đấu nối đã thông suốt chưa?"*

---

## ⚠️ ĐIỀU KIỆN VÀO — kiểm trước, thiếu là DỪNG

```bash
cd ~/Downloads/interiorflow
git worktree list          # phải CHỈ CÒN 1 dòng (thư mục gốc)
git status --short         # phải SẠCH
git log --oneline -10      # thấy đủ commit của 5 phiên
```

Còn worktree chưa dọn hoặc `git status` chưa sạch → **DỪNG, báo Hoà.**
Nghiệm thu trên nền chưa merge xong là nghiệm thu vô nghĩa.

```bash
pkill -f "next dev"; sleep 2; rm -rf .next && npm run dev
```

---

## VIỆC 1 — Bốn thước bắt buộc

```bash
npx tsc --noEmit -p .
node scripts/check-chot.mjs
npm test
npm run license:check
```

Cả bốn phải xanh. Lỗi nào cũng phải **giải thích bằng `file:dòng`** — không được bỏ qua,
không được ghi *"chắc do môi trường"*.

---

## VIỆC 2 — Đo lại bảng số nền

```bash
# ① bảng DB vs schema
node --no-warnings -e "
const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync('prisma/dev.db',{readOnly:true});
const t=db.prepare(\"select name from sqlite_master where type='table' and name not like 'sqlite_%' and name not like '_prisma%'\").all().map(r=>r.name);
const fs=require('fs');
const m=[...fs.readFileSync('prisma/schema.prisma','utf8').matchAll(/^model\s+(\w+)/gm)].map(x=>x[1]);
console.log('DB:',t.length,'| schema:',m.length,'| THIEU:',m.filter(x=>!t.includes(x)).join(' · ')||'(rong)');
"

# ② sổ GAP
echo "do: $(grep -c '🔴' docs/GAP-IF.md) | dong: $(grep -c '✅' docs/GAP-IF.md)"

# ③ lib/review đã có nơi gọi chưa  (p3c)
grep -rn "review2d\|review3d\|reviewDeck" --include=*.tsx components/ | wc -l

# ④ build-ops còn bao nhiêu hàm mồ côi  (p14)
for fn in arrayGrid arrayRadial loftSections revolveProfile sweepProfile prismTapered prismChamfered prismBeveledEx mirrorGeometry offsetPolygonInwardMm filletPolygonMm; do
  echo "$fn: $(grep -rn "\b$fn\b" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v 'lib/three/build-ops' | wc -l)"
done

# ⑤ trần 5 sheet · STATUS.md  (p2)
grep -rniE "5 sheet" --include=*.ts --include=*.tsx . | grep -v node_modules | wc -l
wc -w STATUS.md

# ⑥ trùng tên Unicode
node scripts/don-trung-unicode.mjs | grep "Cặp trùng"
```

### Bảng chuẩn để so

| Thước | 07/08 23:30 | Sau `p12` (đã đo) | ĐÍCH cuối đợt |
|---|---|---|---|
| Bảng DB / schema | 17 / 20 | **20 / 20** ✅ | giữ 20/20 |
| Migration đã áp | 1 | **3** ✅ | giữ 3 |
| Sổ GAP đỏ | 72 | 72 | giảm — ghi rõ bao nhiêu |
| `lib/review` nơi gọi | 0 | 0 | **≥ 1** *(p3c)* |
| `build-ops` hàm mồ côi | 11 | 11 | giảm — ghi rõ còn mấy, vì sao *(p14)* |
| "5 sheet" trong code | 27 | 27 | **0** *(p2)* |
| `STATUS.md` | 8 674 từ | 8 674 | **< 800** *(p2)* |
| Trùng Unicode | 27 | **0** ✅ | giữ 0 |

> ⚠️ **Flow mồ côi KHÔNG nằm trong bảng này.** Hoà chốt **phương án B** ngày 08/08:
> 45 flow đó là rác thử nghiệm trong bãi thử, **cố ý để yên**. Cái đã bịt là **đường đẻ mồ côi
> mới** (`app/api/flows/route.ts:106` → `ensureDraftProject`). Đừng chạy
> `scripts/gan-flow-mo-coi.mjs --that`. Đừng tính 45 đó là lỗi chưa sửa.

**Số nào không cải thiện thì nói thẳng vì sao.** Đừng lấp liếm.

---

## VIỆC 3 — Đi một vòng người dùng TRÊN CSDL SẠCH

> ⭐ **Đây là việc quan trọng nhất phiếu này.**

### Vì sao phải dùng CSDL sạch

Đo ngày 08/08: **cả 9 dự án trong `dev.db` đều là rác thử nghiệm** —
*"Dự án verify inline input"* · *"Enter test 2"* · *"Test B3 (phục hồi backup)"* ·
*"M-SCOPE test rỗng"* · 4 dự án `__nb:` do notebook tự sinh.
1 516 tài sản thư viện thì tên là mã băm (`0d83e371…`, `z8013092465505_…`).

Nghiệm thu trên bãi thử **không trả lời được** câu quan trọng nhất:
*"người dùng mới cài app, làm một vòng, tắt đi mở lại — còn nguyên không?"*

### Bật CSDL sạch

`prisma/dev-sach.db` đã dựng sẵn (20 bảng, 0 dữ liệu). Kiểm rồi hãy dùng:

```bash
node --no-warnings -e "
const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync('prisma/dev-sach.db',{readOnly:true});
const q=s=>db.prepare(s).all()[0].c;
console.log('du an:',q('select count(*) c from Project'),'| nguoi dung:',q('select count(*) c from User'),'| flow:',q('select count(*) c from Flow'));
"
```

Không thấy tệp, hoặc số khác 0 → dựng lại:

```bash
node scripts/db-sach.mjs --that --ghi-de
```

Rồi **sửa dòng đầu `.env`**:

```
DATABASE_URL="file:/Users/tranben/Downloads/interiorflow/prisma/dev-sach.db"
```

⛔ **Đổi `.env` xong PHẢI khởi động lại dev server** thì mới ăn.

### Chín bước — một mạch, KHÔNG tắt giữa chừng, chụp ảnh từng chặng

```
① Tạo tài khoản mới + dự án mới      (màn rỗng 1a — nền trắng thật)
② Nhập một bản vẽ .dxf               → chặng Thiết kế 2D thấy hình
③ Dựng khối lên 3D                   → chặng Thiết kế 3D thấy khối
④ Bắt điểm 3D                        → thấy dấu + chữ Việt cạnh con trỏ
⑤ Chạy bảng kiểm                     → hai khối LUẬT / GÓP Ý tách bạch
⑥ Chụp ảnh render                    → sang chặng Trình chiếu
⑦ Tạo deck từ ảnh đã dựng
⑧ Xuất PDF và PPTX
⑨ TẮT APP, mở lại dự án              → MỌI THỨ CÒN NGUYÊN
```

**Bước ⑨ là bước quyết định.** Nó chứng minh cái chốt `ensureDraftProject` chạy thật:
tắt hẳn app, mở lại, vào đúng dự án đó — **bản vẽ · khối 3D · deck phải còn đủ**.

Trước đợt này bước ⑨ là chỗ **đứt** — người dùng làm cả buổi, mai mở lại không thấy gì.

> Chỗ nào tắc thì **ghi lại rồi đi tiếp**, đừng dừng ở lỗi đầu tiên.
> Cuối cùng liệt kê đủ mọi chỗ tắc kèm `file:dòng`, **xếp theo mức đau**.

### Xong thì trả `.env` về bãi thử

```
DATABASE_URL="file:/Users/tranben/Downloads/interiorflow/prisma/dev.db"
```

---

## VIỆC 4 — Build gói cài

```bash
npm run build
npm run electron:build:mac
```

### Kiểm gói không mang thừa 30 MB

TỔNG đã thêm hai dòng loại trừ vào `package.json` → `build.files` (chốt 08/08):

```
"!node_modules/.prisma/client/libquery_engine-linux-*"
"!node_modules/@prisma/engines/*linux*"
```

Lý do: hai engine Prisma cho Linux ARM (**15 MB mỗi cái, đo thật**) chỉ để chạy test ở CI.
Người dùng cài `.dmg` trên macOS không bao giờ gọi tới. `binaryTargets` trong schema **giữ nguyên**
nên test ở CI vẫn chạy — chỉ khâu **đóng gói** mới bỏ.

**Xác minh gói ra không chứa chúng:**

```bash
find dist-installer -name "*linux*" 2>/dev/null | head
```

Ra dòng nào → hai luật loại trừ chưa ăn, ghi vào OUT.

### Cài trên máy sạch, ngoài thư mục repo

| # | Thử | Vì sao |
|---|---|---|
| 1 | **Đăng nhập** | Bệnh `electron-builder` bỏ rơi `node_modules/.prisma` đã vá bằng `extraResources` — **cần chốt dứt điểm là hết** |
| 2 | Tạo dự án | |
| 3 | Nhập bản vẽ | |

Không cài được trên máy sạch → ghi **CHƯA VERIFY**, đừng ghi *"chắc là được"*.

---

## VIỆC 5 — Bàn giao cho TỔNG

Gom vào `docs/M-BUILD-FINAL-2-OUT.md`:

1. **Bảng TRƯỚC / SAU** đầy đủ (VIỆC 2), kèm cột "đích" và chỗ nào chưa tới đích.
2. **Mọi chỗ tắc** ở VIỆC 3, xếp theo mức đau, kèm `file:dòng`.
3. **Ảnh 9 bước** — không có ảnh = CHƯA VERIFY (N5).
4. Danh sách mã trong `docs/GAP-IF.md` **đã đóng thật** trong đợt này —
   **liệt kê thôi, KHÔNG tự ghi vào sổ** (§0u).
5. Kết quả build + kích thước `.dmg` + kết quả cài trên máy sạch.
6. **Câu trả lời CÓ / KHÔNG:**

   > *"Nền đã vững, xương sống đã cứng, mọi đấu nối đã thông suốt chưa?"*

   - Trả lời **CÓ** → phải chỉ được: **mạch 9 bước ở VIỆC 3 chạy hết, không tắc chỗ nào.**
   - Trả lời **KHÔNG** → phải chỉ được: **còn tắc ở bước nào, vì sao, cần gì để thông.**

   ⛔ Không được trả lời nước đôi. Đây là câu Hoà dùng để quyết có làm tiếp
   (hình nền · thư viện · video giới thiệu · hướng dẫn) hay chưa.

7. Dòng cuối: *"Tệp OUT: `docs/M-BUILD-FINAL-2-OUT.md` · dán vào phiên `p6`"* (§0ac).

**KHÔNG commit.**
