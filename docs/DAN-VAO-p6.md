> **CÁCH DÙNG:** `Cmd+A` → `Cmd+C` → dán vào phiên **`p6. GPL-3 tuân thủ và third-party licenses`**
> ⚠️ **CHẠY SAU CÙNG** — khi `p12` · `p3c` · `p14` · `p2` · `p3` đã xong và Hoà đã merge hết.
> ⚠️ **Chạy MỘT MÌNH trên `main`**, KHÔNG worktree.

---

# LUẬT BẮT BUỘC

Đọc theo thứ tự: `STATUS.md` → `docs/00-CHOT.md` → `docs/00-BAT-DAU-DOC-DAY.md`.
**KHÔNG đọc `CHANGELOG.md`.**

```
V6  · KHÔNG commit. Hoà commit.
§0u · Chỉ COWORK-TỔNG được ghi docs/GAP-IF.md. Phiên này ghi vào tệp OUT của mình.
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
> *"nền đã vững chưa, đấu nối đã thông suốt chưa?"*

---

## VIỆC 1 — Bốn thước bắt buộc

```bash
npx tsc --noEmit -p .
node scripts/check-chot.mjs
npm test
npm run license:check
```

Cả bốn phải xanh. Lỗi nào cũng phải **giải thích bằng `file:dòng`**, không được bỏ qua,
không được ghi "chắc do môi trường".

---

## VIỆC 2 — Đo lại toàn bộ bảng số nền

Chạy lại **đúng** các lệnh dưới, in bảng **TRƯỚC (07/08 23:30) / SAU**:

```bash
# bảng DB vs schema
node --no-warnings -e "
const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync('prisma/dev.db',{readOnly:true});
const t=db.prepare(\"select name from sqlite_master where type='table' and name not like 'sqlite_%' and name not like '_prisma%'\").all().map(r=>r.name);
const fs=require('fs');
const m=[...fs.readFileSync('prisma/schema.prisma','utf8').matchAll(/^model\s+(\w+)/gm)].map(x=>x[1]);
console.log('DB:',t.length,'| schema:',m.length,'| THIEU:',m.filter(x=>!t.includes(x)).join(' · '));
"

# flow mồ côi
node --no-warnings -e "
const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync('prisma/dev.db',{readOnly:true});
const q=s=>db.prepare(s).all()[0].c;
console.log('Flow:',q('select count(*) c from Flow'),'| mo coi:',q('select count(*) c from Flow where projectId is null'));
"

# sổ GAP
echo "do: $(grep -c '🔴' docs/GAP-IF.md) | dong: $(grep -c '✅' docs/GAP-IF.md)"

# lib/review đã có nơi gọi chưa
grep -rn "review2d\|review3d\|reviewDeck" --include=*.tsx components/ | wc -l

# build-ops còn bao nhiêu hàm mồ côi
for fn in arrayGrid arrayRadial loftSections revolveProfile sweepProfile prismTapered prismChamfered prismBeveledEx mirrorGeometry offsetPolygonInwardMm filletPolygonMm; do
  echo "$fn: $(grep -rn "\b$fn\b" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v 'lib/three/build-ops' | wc -l)"
done

# trần 5 sheet · STATUS.md · trùng unicode
grep -rniE "5 sheet" --include=*.ts --include=*.tsx . | grep -v node_modules | wc -l
wc -w STATUS.md
node scripts/don-trung-unicode.mjs | grep "Cặp trùng"
```

### Bảng chuẩn để so

| Thước | TRƯỚC (07/08 23:30) | ĐÍCH |
|---|---|---|
| Bảng DB / schema | 17 / 20 | **20 / 20** |
| Migration đã áp | 1 | ≥ 2 |
| Flow mồ côi | 45 / 46 | **0**, hoặc gom hết vào "Chưa phân loại" |
| Sổ GAP đỏ | 72 | giảm — ghi rõ giảm bao nhiêu |
| `lib/review` nơi gọi | 0 | **≥ 1** |
| `build-ops` hàm mồ côi | 11 | giảm — ghi rõ còn mấy, vì sao |
| "5 sheet" trong code | 27 (cả docs) | **0** trong code |
| `STATUS.md` | 8 674 từ | **< 800** |
| Trùng Unicode | 0 | **0** |

**Số nào không cải thiện thì nói thẳng vì sao.** Đừng lấp liếm.

---

## VIỆC 3 — Đi một vòng người dùng, đầu tới cuối

Một mạch, **không tắt app giữa chừng**, chụp ảnh từng chặng:

```
① Tạo dự án mới (màn rỗng 1a)
② Nhập một bản vẽ .dxf    → chặng Thiết kế 2D thấy hình
③ Dựng khối lên 3D        → chặng Thiết kế 3D thấy khối
④ Bắt điểm 3D             → thấy dấu + chữ Việt cạnh con trỏ
⑤ Chạy bảng kiểm          → thấy hai khối LUẬT / GÓP Ý tách bạch
⑥ Chụp ảnh render         → sang chặng Trình chiếu
⑦ Tạo deck từ ảnh đã dựng
⑧ Xuất PDF và PPTX
⑨ TẮT APP, mở lại dự án   → MỌI THỨ CÒN NGUYÊN
```

### Bước ⑨ là bước quan trọng nhất

Nó chứng minh lỗ **flow mồ côi** đã bịt thật. Tắt hẳn app, mở lại, vào đúng dự án đó:
**bản vẽ · khối 3D · deck phải còn đủ.**

Trước đợt này, bước ⑨ là chỗ **đứt** — người dùng làm cả buổi rồi mai mở lại không thấy gì.

> Chỗ nào tắc thì **ghi lại rồi đi tiếp**, đừng dừng ở lỗi đầu tiên.
> Cuối cùng liệt kê đủ mọi chỗ tắc kèm `file:dòng`, **xếp theo mức đau**.

---

## VIỆC 4 — Build gói cài

```bash
npm run build
npm run electron:build:mac
```

Cài bản `.dmg` sinh ra **trên máy sạch, NGOÀI thư mục repo**, rồi thử ba việc:

| # | Thử | Vì sao |
|---|---|---|
| 1 | Đăng nhập | Bệnh `electron-builder` bỏ rơi `node_modules/.prisma` đã vá bằng `extraResources` — **cần chốt dứt điểm là hết** |
| 2 | Tạo dự án | |
| 3 | Nhập bản vẽ | |

Không cài được trên máy sạch thì ghi **CHƯA VERIFY**, đừng ghi "chắc là được".

---

## VIỆC 5 — Bàn giao cho TỔNG

Gom vào OUT:

1. **Bảng TRƯỚC / SAU** đầy đủ (VIỆC 2).
2. **Mọi chỗ tắc** ở VIỆC 3, xếp theo mức đau, kèm `file:dòng`.
3. Danh sách mã trong `docs/GAP-IF.md` **đã đóng thật** trong đợt này —
   **liệt kê thôi, KHÔNG tự ghi vào sổ** (§0u: chỉ TỔNG được ghi `GAP-IF.md`).
4. Kết quả build + cài trên máy sạch.
5. **Câu trả lời CÓ / KHÔNG** cho:

   > *"Nền đã vững, xương sống đã cứng, mọi đấu nối đã thông suốt chưa?"*

   Trả lời **CÓ** thì phải chỉ được: mạch 9 bước ở VIỆC 3 chạy hết, không tắc chỗ nào.
   Trả lời **KHÔNG** thì phải chỉ được: còn tắc ở bước nào, vì sao.

6. Dòng cuối: *"Tệp OUT: `docs/M-BUILD-FINAL-2-OUT.md` · dán vào phiên `p6`"* (§0ac).

**KHÔNG commit.**

---

## ⚠️ TRƯỚC KHI BẮT ĐẦU

```bash
cd ~/Downloads/interiorflow
git worktree list          # phải KHÔNG còn worktree nào của đợt này
git status --short         # phải SẠCH
git log --oneline -8       # thấy đủ commit của 5 phiên
pkill -f "next dev"; sleep 2; rm -rf .next && npm run dev
```

Còn worktree chưa dọn hoặc `git status` chưa sạch → **DỪNG, báo Hoà.**
Nghiệm thu trên nền chưa merge xong là nghiệm thu vô nghĩa.
