# 17/08 · 01 — Mở phiên: đo lại tại nguồn, bắt hai lệch sổ ↔ code

> Bằng chứng đầy đủ cho hai dòng đính chính ở `docs/IF-KIEN-TRUC.md` §5 · §6 và cho phiếu P-S.
> Người đo: T (phiên chính). Mốc: `e57e2f6`, cây sạch.

---

## Bối cảnh — vì sao đi đo

`LENH-MO-PHIEN.md` liệt kê hàng đợi 5 mục. Trước khi giao phiếu, T đo lại **tại nguồn** hai mục
đầu tiên đụng tới code (luật 1: *đo tại nguồn, đừng nhớ hộ máy*). Cả hai đều lệch.

---

## LỆCH 1 — "`lib/materials` ↔ `ProductSpec` = 0 code"

**Sổ nói gì** — `IF-KIEN-TRUC.md` §6 (bản 16/08) · `LATEST.md` · `LENH-MO-PHIEN.md` mục 2:
> *"`lib/materials` nối `ProductSpec` = **0 code**, đo 07/08 và đo lại 16/08 **không đổi**."*

**Đo được 17/08:**

```
$ grep -rl 'ProductSpec' lib/materials/
10 tệp

$ ls -la lib/materials/resolve.ts
-rw-r--r--  1 tranben  staff  3070 Aug  7 15:14 lib/materials/resolve.ts

$ git log --oneline -- lib/materials/resolve.ts
ad2d23b dot 07/08: 5 phien code + go du an mau + cua kiem chot + tai lieu
```

`lib/materials/resolve.ts:52` — `getMaterial(matId, sources): MaterialFacets` trả **đủ ba mặt**:
`pbr` (`MaterialPbr`) · `commercial` (shape con của `ProductSpec`) · `flat` (`MaterialDef`).
Khoá nối `matId = ProductSpec.sku`. Mảnh thiếu ⇒ `null` **cho mảnh đó**, không throw, không bịa.
Có `resolve.test.ts` (5 ca).

**Nhưng:**

```
$ grep -rn 'getMaterial\b' --include='*.ts' --include='*.tsx' .   # trừ node_modules/.next
lib/materials/resolve.ts:52        ← định nghĩa
lib/materials/resolve.test.ts      ← 8 dòng, test của chính nó
lib/cad/materials.ts:60            ← chỉ là COMMENT trỏ tới
```

⇒ **0 nơi gọi thật.**

### Kết luận
Sổ **sai chữ, đúng ý**: không phải *chưa có dây*, mà là *dây có, chưa cắm điện*.
Và câu *"đo lại 16/08 không đổi"* là **số chép lại chứ không phải phép đo** — `resolve.ts` sinh
**chiều 07/08** (15:14), tức **sau** phép đo sáng 07/08 mà con số "0 code" bắt nguồn.

### Vì sao đáng ghi
Đây đúng bài học 16/08 — ***"có trong mã" không bằng "tới được người dùng"*** — lần này ở dạng
nặng hơn: thứ đã viết xong **10 ngày** mà không ai gọi, còn sổ thì ghi là **chưa viết**. Hai cái
sai ngược chiều nhau cùng tồn tại, và **không máy nào bắt được**, vì:
- `soi:frontier` canh registry ↔ code — `resolve.ts` không có entry nào khai nó.
- `soi:contract` canh FeatureContract — hàm thuần không khai contract.
- `soi:tu-dien` canh nhãn — không có nhãn nào lệch ở đây.

---

## LỆCH 2 — "5 bộ hình nền đã dựng, CHƯA cắm vào Home"

**Sổ nói gì** — `LATEST.md` mục 17/08 · `LENH-MO-PHIEN.md` hàng đợi mục 3:
> *"Gốc: lưới trả phần dư **cho hình nền** (chốt A2) nhưng **hình nền CHƯA nối vào Home**."*

**Đo được 17/08:**

| Đo | Kết quả |
|---|---|
| `lib/wallpaper/sets.ts` | **5 bộ**: `chan-troi` · `o-cua` · `binh-do` · `tang-sau` · `mat-phang` |
| `components/home/DongStudioHome.tsx:59` | `import SystemWallpaper from '@/components/wallpaper/SystemWallpaper'` |
| `components/home/DongStudioHome.tsx:543` | `<SystemWallpaper />` — **đã mount** |
| `lib/wallpaper/prefs.ts:16-20` | `MAC_DINH = { setId: WALLPAPER_SETS[0].id, nacGiamChoi: 0, bat: true }` — **bật mặc định** |
| `git log -- components/wallpaper/SystemWallpaper.tsx` | `45e79a2` (16/08) |

Comment tại chỗ mount (`:536-542`) khai rõ đây là phiếu **P-O (16/08)**, thi hành chốt A2:
nền để **nét**, không bôi mờ; `--bg` giữ lại làm đáy phòng khi người dùng tắt nền trong Cài đặt.

### Kết luận
Việc *"nối 5 bộ hình nền vào Home"* **đã xong từ 16/08** ⇒ **gỡ khỏi hàng đợi**.
Hệ quả nặng hơn: **chẩn đoán dải đen trên/dưới Home dựa trên tiền đề sai** ⇒ phải chẩn lại từ
đầu, và **không được** giao phiếu "nối hình nền" (sẽ là dựng lại thứ đã có — đúng tội N8).

### Nghi vấn còn để ngỏ (chưa đo, T không đoán)
Dải đen có thể là: ① lưới cao cố định bằng px (`279/220/112/97`) để lại khoảng thừa mà nền
**đúng là đang hiện** nhưng ở theme tối trông như dải đen ② nền bị một lớp `--bg` khác đè
③ nguyên nhân khác. **Phải soi trên app thật + đối chiếu 24 ảnh trên Drive**, không suy từ mã.

---

## Hai lệch này nói chung điều gì

Cả hai đều là **khẳng định trong văn bản không được máy nào kiểm**, và cả hai T bắt được
**bằng tay, do tình cờ đi đo lại**. Cùng họ với ba khái niệm ma đã bắt 16/08
(`master tool` · `KB-5` · `.idfnotes`) và với ca bản đồ mồ côi 19 ngày.

⇒ Củng cố việc #1 trong hàng đợi: **máy đối chiếu sổ ↔ code** (phiếu `P-S`).
Đáng chú ý: **bản đồ mới lập tối 16/08 đã sai một dòng sau đúng một ngày**, và nó do chính T
viết — tức luật *"viết lại, không cộng dồn"* giữ được **hình dạng** của bản đồ nhưng
**không giữ được tính đúng**. Chỉ máy canh mới giữ được.

---

## Trạng thái máy soi lúc mở phiên

```
npm run soi:frontier   → exit 0
🔴 0 LỆCH · ✅ 70 xong-MÁY · 👁 1 qua mắt Hoà · ⬜ 55 chờ
VAI — ⭐MVP 34/54 (63%) · 🔗Kết nối 20/40 (50%) · 🧰Đỡ 17/32 (53%)
```

Drive `IF-duyet-mat/01-anh`: **25 tệp** (24 ảnh + mục lục, gồm ba chặng lần đầu chụp được).
`02-note-cua-Hoa`: **trống** ⇒ Hoà chưa soi lô này.

Còn nợ dọn: **3 worktree rác** `.claude/worktrees/agent-*` (`de3abe8` · `8f71eac` · `21371df`).
