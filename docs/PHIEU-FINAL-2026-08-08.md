# PHIẾU ĐỢT CĂNG FINAL — 08/08/2026

> Soạn bởi COWORK-TỔNG. Mọi số đo **chạy bằng máy** lúc 23:30 · 07/08, không chép từ sổ (§0ab).
> Bản trước đặt tên F1–F5 là **SAI QUY ƯỚC** — đã sửa. Quy ước thật:
> **phiên = `p{n}`** (tên trong thanh bên Claude Code) · **báo cáo = `docs/M-{VIỆC}-OUT.md`**.

---

# BẢNG DÁN — CÁI NÀO VÀO CÁI NÀO

| # | Dán vào phiên | Tên phiên trong thanh bên | Việc | Tệp OUT phải ghi |
|---|---|---|---|---|
| **0** | *(Hoà, Terminal)* | — | Commit 21 mục + dựng server sạch | — |
| **1** | **`p12`** | *p12. RevitSummaryPanel…* | Nền dữ liệu — 3 bảng thiếu + 45 flow mồ côi | `docs/M-NEN-DL-OUT.md` |
| **2** | **`p3c`** | *nhánh con của p3. 3D shell UI and test* | Bảng kiểm 3 chặng — nối `lib/review` vào UI | `docs/M-BANG-KIEM-OUT.md` |
| **3** | **`p14`** | *p14. Bevel, chamfer, array…* | Mở kho dựng hình — 11 hàm `build-ops` lên nút | `docs/M-BUILD-OPS-2-OUT.md` |
| **4** | **`p2`** | *p2 Kiểm tra 16 mảng code…* | Dọn trần "5 sheet" — 27 chỗ | `docs/M-DON-TRAN-OUT.md` |
| **5** | **`p3`** | *p3. 3D shell UI and test in…* | Đối chiếu lại mock bằng MẮT + xác minh tay cầm panel | `docs/M-MOCK-2-OUT.md` |
| **6** | **`p6`** | *p6. GPL-3 tuân thủ và third-party licenses* | Nghiệm thu toàn app + build final | `docs/M-BUILD-FINAL-2-OUT.md` |

## Vì sao giao đúng phiên đó — bằng chứng, không phải cảm tính

| Phiên | Sở hữu **đã tự khai** trong báo cáo cũ | Nguồn |
|---|---|---|
| `p12` | `prisma/` · `lib/server/` · `lib/workspace.ts` | `M-DATA-OUT.md` dòng "Vùng sở hữu" |
| `p3c` | `lib/review/` · `lib/cad/standards/` | `M-REVIEW-OUT.md` dòng "Sở hữu" |
| `p14` | `lib/three/build-ops.ts` · `lib/three/csg.ts` | `M-BUILD-OPS-OUT.md` dòng "Sở hữu" |
| `p3` | `docs/mocks/` · `scripts/check-mocks.mjs` | `M-MOCK-OUT.md` dòng "Sở hữu" |
| `p2` | phiên quét/dọn toàn repo (vừa dọn 34 đỏ → 0) | `M-CHOT-OUT.md`, `M-BOQ-OUT.md` |
| `p6` | GPL-3 + trung tính thương hiệu; `license:check` là 1 trong 4 thước nghiệm thu | `M-PHAP-LY-OUT.md` |

> ⚠️ Riêng ô `p6` là **đề xuất**, không phải bằng chứng — `M-BUILD-FINAL-OUT.md` cũ không khai
> phiên nào. Chọn `p6` vì việc cũ của nó đã đóng (`LICENSE-NOTES.md:136` §9 đóng 05/08) nên slot
> rảnh, và nó vốn nắm khâu giấy phép. Anh thấy phiên khác hợp hơn thì đổi, đổi luôn tên OUT.

---

# SỐ ĐO NỀN — chụp 23:30 · 07/08

| Thước | Số |
|---|---|
| `npx tsc --noEmit` | 0 lỗi |
| `node scripts/check-chot.mjs` | 0 đỏ · 0 vàng (9 luật) |
| Bộ test 220 tệp | 218 sạch · 2 lỗi (chỉ do Prisma engine `darwin` vs hộp cát `linux`) |
| Bảng trong `prisma/dev.db` | **17** · schema khai **20** |
| Migration đã áp | **1** (`20260703141955_init`) |
| Flow mồ côi | **45 / 46** |
| Sổ `GAP-IF.md` | **72 đỏ** · 58 đã đóng |
| `lib/review/` | 7 tệp · **0 nơi gọi** |
| `lib/three/build-ops.ts` | 13 hàm xuất · **11 hàm 0 nơi gọi** |
| Chỗ còn nhắc trần "5 sheet" | **27** |
| `.next` | **2,0 GB** |
| `STATUS.md` | **586 dòng · 8 674 từ** — CLAUDE.md đòi **dưới 800 từ** ⚠️ |
| Mục chưa commit | **21** (= 27 tệp thật) |

---

# BƯỚC 0 — HOÀ COMMIT (làm TRƯỚC, một mình)

Mở Terminal. Dán **từng khối**, chờ khối trước xong rồi mới dán khối sau.
Lời commit cố ý **không dấu tiếng Việt** — dấu và ký tự lạ từng làm `zsh` báo `event not found`.

### 0.1 · về đúng chỗ, xem trước

```bash
cd ~/Downloads/interiorflow && git status --short | wc -l
```

✔ Trên máy Hoà ra khoảng **41**. Trong hộp cát Linux của TỔNG ra **21** — **cùng repo, cùng lúc,
hai con số khác nhau**. Đó KHÔNG phải lỗi, mà là triệu chứng của việc ở Khối 0.1b. Đọc tiếp.

### 0.1b · dọn 7 tệp bị git theo dõi HAI LẦN ⚠️ *(mới thêm 08/08 — làm TRƯỚC khi commit)*

**Chuyện gì:** 7 tệp trong `docs/mocks/` đang bị git theo dõi dưới **hai cách viết tên**,
khác nhau đúng ở chỗ mã hoá dấu tiếng Việt:

```
"2D Kỹ thuật.dc.html"   ← NFC:  chữ "ỹ" là MỘT ký tự
"2D Kỹ thuật.dc.html"   ← NFD:  chữ "y" + dấu ngã rời, ghép lại thành "ỹ"
```

Nhìn bằng mắt y hệt. Với git là **hai đường dẫn khác nhau**.

**Vì sao đẻ ra:** macOS lưu tên tệp theo NFD, còn công cụ (Claude Design, trình soạn thảo) ghi
theo NFC. Vài commit rơi vào lúc `core.precomposeunicode` chưa bật ⇒ lọt cả hai dạng vào chỉ mục.

**Hại chỗ nào:** grep và đếm tệp ra số sai · `git add -A` đẻ thêm bản sao ·
nhìn `git status` không biết đâu là thật. Đây chính là thứ làm lệch mọi con số đo tối 07/08.

Chạy khô trước — **chưa đụng gì**:

```bash
cd ~/Downloads/interiorflow && node scripts/don-trung-unicode.mjs
```

✔ Đúng khi in ra đúng **7 dòng NFD**:
`2D Kỹ thuật` · `Bảng nút` · `Chế độ Chuyên` · `Chế độ Phác thảo` ·
`InteriorFlow 05 Máy quay` · `Nút tổng` · `Thư viện`

Cả 7 cặp đã kiểm: **hai bên cùng SHA** = cùng nội dung, chỉ là bản sao thừa.
Số khác 7, hoặc hiện dòng ⚠️ "KHÁC nội dung" → **dừng, báo TỔNG**.

Đúng 7 rồi thì làm thật:

```bash
node scripts/don-trung-unicode.mjs --that
git status --short | wc -l
```

> Script chỉ `git rm --cached` (bỏ khỏi chỉ mục). **Tệp trên đĩa còn nguyên**, không xoá gì.

### 0.2 · commit 1/4 — khung kiểm hai lớp

```bash
git add lib/review docs/M-REVIEW-OUT.md lib/cad/standards/checker.ts
git commit -m "feat(review): khung kiem hai lop LUAT va GOPY, 3 chang cam du, 20 phep kiem"
```

### 0.3 · commit 2/4 — bắt điểm 3D

```bash
git add lib/three/snap3d.ts lib/three/snap3d.test.ts components/three/Scene3DViewer.tsx components/three/Viewport3D.tsx docs/M-3D-NOI-OUT.md
git commit -m "feat(3d): bat diem 3D 7 nac uu tien cung, khoa truc XYZ, BVH tang toc ban tia"
```

### 0.4 · commit 3/4 — bốn màn rỗng bám mock

```bash
git add components/ProjectSelect.tsx components/cad/CadEditor.tsx components/present-editor/PresentEditor.tsx components/render-studio/Render3DModeSkeleton.tsx docs/M-EMPTY-2-OUT.md docs/mocks
git commit -m "feat(empty): 4 man rong bam mock chot, keo tha that, ly do khoa lo mat, them support.js chay mock"
```

### 0.5 · commit 4/4 — sổ sách

```bash
git add STATUS.md docs/00-CHOT.md docs/00-BAT-DAU-DOC-DAY.md docs/M-CHOT-OUT.md docs/M-PANEL-OUT.md docs/PHIEU-FINAL-2026-08-08.md scripts/don-trung-unicode.mjs
git commit -m "docs: chot 12 muc 07-08, luat 0aa den 0ad, bao cao 5 phien, phieu dot final, script don trung unicode"
```

### 0.5b · quét nốt phần còn sót

Sau bốn commit trên, `git status` có thể còn vài mục — chủ yếu là các tệp mock mà máy Hoà
nhìn thấy còn hộp cát thì không. Xem rồi gom một lượt:

```bash
git status --short
```

Nếu **chỉ còn tệp trong `docs/mocks/`** thì gom:

```bash
git add docs/mocks && git commit -m "mocks: gom ban giao Claude Design, thong nhat ten NFC"
```

Nếu còn tệp **ngoài** `docs/mocks/` → **dừng, dán danh sách cho TỔNG**.

### 0.6 · kiểm sạch rồi đẩy

```bash
git status --short && git log --oneline -5
```

✔ Đúng khi `git status --short` **không in gì** và thấy 4 commit mới trên cùng.

```bash
git push origin main
```

### 0.7 · dọn rác + dựng server sạch

```bash
pkill -f "next dev"; sleep 2; cd ~/Downloads/interiorflow && rm -rf .next && npm run dev
```

✔ Đúng khi hiện `✓ Ready in ...`. Để cửa sổ này chạy, mở cửa sổ Terminal khác cho việc sau.

> Vì sao xoá `.next`: nó đang **2,0 GB** và là thủ phạm bệnh §0aa — nhiều `npm run dev` cùng ghi
> một thư mục ⇒ mọi route trả 500 `Cannot read properties of undefined (reading 'call')`.

### 0.8 · mở worktree cho 5 phiên song song

```bash
cd ~/Downloads/interiorflow
git worktree add ../interiorflow-wt-p12 -b feat/p12-nen-du-lieu
git worktree add ../interiorflow-wt-p3c -b feat/p3c-bang-kiem
git worktree add ../interiorflow-wt-p14 -b feat/p14-build-ops-ui
git worktree add ../interiorflow-wt-p2  -b feat/p2-don-tran-sheet
git worktree add ../interiorflow-wt-p3  -b feat/p3-mock-doi-chieu
git worktree list
```

⚠️ **Mỗi worktree một cổng riêng** (§0aa): p12 `3011` · p3c `3012` · p14 `3013` · p2 `3014` · p3 `3015`.

```bash
cd ../interiorflow-wt-p3c && npm run dev -- -p 3012
```

---

# LUẬT CHUNG — dán vào ĐẦU mỗi phiếu

```
LUẬT BẮT BUỘC — đọc trước khi gõ dòng code đầu tiên

Đọc theo thứ tự: STATUS.md → docs/00-CHOT.md → docs/00-BAT-DAU-DOC-DAY.md.
KHÔNG đọc CHANGELOG.md.

V6  · KHÔNG commit. Hoà commit. Làm xong để nguyên, báo cáo.
§0u · Chỉ COWORK-TỔNG được ghi docs/GAP-IF.md. Phiên khác ghi vào tệp OUT của mình.
§0ab· Sổ là ảnh chụp cũ. ĐO LẠI bằng máy trước khi tin bất kỳ con số nào.
§0ac· Báo cáo phải tự khai: tệp OUT tên gì, dán vào phiên nào.
N1  · Báo cáo KHÔNG phải bằng chứng. Mỗi việc "xong" phải kèm số đo hoặc ảnh.
N5  · Khai thật cái chưa xong. Thà ghi "CHƯA VERIFY" còn hơn ghi "xong" mà không đo.
N6  · Code không có nơi mount = CHƯA XONG. Phải chỉ được file:dòng nơi gọi tới.
N8  · Mọi dòng báo cáo có file:dòng.

LUẬT GIAO DIỆN (nếu đụng UI)
G2 · panel nền đặc ≥92%   G4 · line-height ≥1,5 (thấp hơn là cắt dấu tiếng Việt)
G6 · nút quyết định phải có CHỮ, không chỉ biểu tượng
G8 · kéo thả KHÔNG được là đường duy nhất — luôn có nút thay thế

LUẬT SẢN PHẨM
· IF là sản phẩm global. 0 tên khách, 0 brand studio nhúng cứng.
· MaterialDef = thị giác. ProductSpec = thương mại. CỐ Ý KHÔNG TRỘN (luật 2.1.9.i).
· Cấm chữ "tự động" ở nhãn hành động AI. Phễu AI tên "Magic".
· KHÔNG đổi tên code lib/cad/, useCadStore, route /projects/[id]/cad.

CỬA KIỂM TRƯỚC KHI BÁO XONG
  npx tsc --noEmit -p .        → phải 0 lỗi
  node scripts/check-chot.mjs  → phải 0 đỏ 0 vàng
  npm test                     → không được thêm lỗi mới
```

---

# ① PHIẾU CHO `p12` · NỀN DỮ LIỆU

**Tệp OUT:** `docs/M-NEN-DL-OUT.md` · **Worktree:** `interiorflow-wt-p12` · **Cổng:** 3011
**Sở hữu:** `prisma/` · `lib/server/` · `lib/workspace.ts` · `scripts/`
**Cấm đụng:** `components/` · `lib/three/` · `lib/review/` · `lib/cad/`

> Phiếu **nặng nhất và chặn nhiều nhất**. Hai lỗ dưới đây là lỗ ở **móng**, không phải thiếu
> tính năng. Chừng nào chúng còn, mọi thứ xây bên trên đều lung lay.

## VIỆC 1 — Ba bảng khai mà không tồn tại

Đo lại trước (đừng tin con số của TỔNG):

```bash
node --no-warnings -e "
const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync('prisma/dev.db',{readOnly:true});
const t=db.prepare(\"select name from sqlite_master where type='table' and name not like 'sqlite_%' and name not like '_prisma%'\").all().map(r=>r.name);
const fs=require('fs');
const m=[...fs.readFileSync('prisma/schema.prisma','utf8').matchAll(/^model\s+(\w+)/gm)].map(x=>x[1]);
console.log('DB:',t.length,'| schema:',m.length,'| THIEU:',m.filter(x=>!t.includes(x)).join(' · '));
"
```

Số của TỔNG: DB **17** · schema **20** · thiếu **`WorkflowState` · `Task` · `ExternalRef`**.

**Phải làm:**

1. Đọc `prisma/schema.prisma` phần khai 3 model đó — hiểu **chúng để làm gì** trước khi tạo bảng.
   `Task` là tầng Việc (lớp workspace của cả hệ IDF) · `ExternalRef` là **cầu nối sang app khác**
   (ArchiNote · Larkbase · SyncWork) · `WorkflowState` là trạng thái luồng.
2. Sinh migration bằng đúng công cụ, **không gõ SQL tay**:
   ```bash
   npx prisma migrate dev --name them-workflowstate-task-externalref
   ```
3. ⛔ Prisma đòi **reset dữ liệu** → **DỪNG, báo Hoà.** Trong `dev.db` đang có
   **9 dự án · 10 người dùng · 1 516 tài sản thư viện · 46 flow · 14 phiên bản flow**.
   Mất là mất thật. Ưu tiên `migrate diff` + `migrate resolve` để giữ dữ liệu.
4. `lib/server/tasks.test.ts` và `credits.test.ts` phải chạy được sau khi có bảng.

**Nghiệm thu:** in lại lệnh đo, kết quả phải là `DB: 20 | schema: 20 | THIEU:` (rỗng).

## VIỆC 2 — 45/46 flow mồ côi

```bash
node --no-warnings -e "
const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync('prisma/dev.db',{readOnly:true});
const q=s=>db.prepare(s).all();
console.log('Flow:',q('select count(*) c from Flow')[0].c,'| mo coi:',q('select count(*) c from Flow where projectId is null')[0].c);
console.log(q('select id, name, projectId, createdAt from Flow order by createdAt desc limit 8'));
"
```

⛔ **ĐỪNG viết script gán bừa `projectId`.** Tìm gốc trước.

**Phải trả lời được ba câu, mỗi câu kèm `file:dòng`:**

| # | Câu hỏi | Chỗ tìm |
|---|---|---|
| a | Đường tạo Flow nào **không truyền** `projectId`? | `app/api/**/flow*` · `lib/server/` · chỗ gọi `prisma.flow.create` |
| b | `projectId` là optional trong schema — **cố ý hay sót**? | `prisma/schema.prisma` model `Flow` |
| c | Mở dự án thì **thấy flow bằng truy vấn nào**? Truy vấn đó có lọc `projectId` không? | `lib/server/` · `app/api/projects/` |

**Rồi mới sửa, theo thứ tự:**

1. **Bịt đường tạo mồ côi** — mọi lối tạo Flow phải có dự án chủ, hoặc rơi vào dự án "Nháp" mặc định.
2. **Dữ liệu cũ: KHÔNG xoá.** Viết `scripts/gan-flow-mo-coi.mjs` — chạy khô (`--dry-run`) in bảng
   "flow nào → về dự án nào, **vì sao**", **chờ Hoà duyệt** rồi mới chạy thật (KS3 · KS4).
   Suy chủ bằng bằng chứng: `FlowVersion` · `userId` · `createdAt` gần dự án nào · tên trùng.
   Không suy ra được thì gom vào dự án "Chưa phân loại" — **không đoán bừa**.

**Nghiệm thu:** flow mồ côi = 0, **hoặc** số còn lại đều nằm trong "Chưa phân loại" có tên rõ;
và **đường tạo mới không đẻ thêm mồ côi được** (kèm test).

## VIỆC 3 — Test Prisma chạy được trên cả hai nền

`binaryTargets` hiện chỉ có `native` ⇒ máy Hoà (macOS) chạy được, hộp cát Linux/CI gãy. Thêm:

```
binaryTargets = ["native", "linux-arm64-openssl-3.0.x", "linux-musl-arm64-openssl-3.0.x"]
```

rồi `npx prisma generate`. Nếu làm phình gói `.dmg` thì **khai rõ số MB** trong OUT, để TỔNG quyết.

---

# ② PHIẾU CHO `p3c` · BẢNG KIỂM BA CHẶNG

**Tệp OUT:** `docs/M-BANG-KIEM-OUT.md` · **Worktree:** `interiorflow-wt-p3c` · **Cổng:** 3012
**Sở hữu:** `lib/review/` · `components/review/` (tạo mới) · `components/studio/AppShell.tsx`
**Cấm đụng:** `lib/cad/standards/` · `lib/present-editor/` · `lib/three/` (chỉ IMPORT) ·
`components/render-studio/Command3DPanel.tsx` (p14 đang giữ)

## Bối cảnh — chính phiên này đã dựng động cơ, giờ lắp đồng hồ

`lib/review/` — 7 tệp, kiến trúc hai lớp **khoá ở kiểu dữ liệu**:

```
FindingLuat  → BẮT BUỘC có: muc ('do'|'vang') · nguon (điều khoản dẫn được) · ruleId
FindingGopy  → KHÔNG CÓ CHỖ khai mức đỏ/vàng · không điểm số · không cờ chặn
ReviewResult → trả luat[] và gopy[] TÁCH SẴN — UI không bao giờ phải tự phân loại
```

Ba chặng đã cắm đủ: `review2d()`→`checkStandards()` (11 bộ, 3 074 dòng, nguyên trạng) ·
`reviewDeck()`→`evaluateDeck()` · `review3d()`→`rules-3d.ts` (20 phép kiểm).

**Nhưng `grep` toàn repo: 0 nơi gọi.** Đo lại:

```bash
grep -rn "review2d\|review3d\|reviewDeck\|from '@/lib/review'" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v "^./lib/review/"
```

## VIỆC 1 — Đọc hợp đồng trước khi vẽ

Đọc **trọn** `lib/review/index.ts` (spec vẽ nằm sẵn ở docstring) + `lib/review/types.ts`.
Đừng thiết kế lại — hợp đồng đã có, việc của phiếu này là **hiện nó ra màn**.

## VIỆC 2 — `components/review/ReviewPanel.tsx`

Một panel dùng chung cho cả ba chặng. Bắt buộc:

| Yêu cầu | Vì sao |
|---|---|
| **Hai lớp KHÔNG trộn trên màn** — hai khối riêng, tiêu đề riêng | Luật là pháp quy, góp ý là gu. Trộn là nói dối người dùng |
| Khối **LUẬT**: đỏ/vàng · số hiệu điều khoản · nguồn dẫn được · nút **Sửa** khi có `cachSua` | `FindingLuat.nguon` bắt buộc chính là để hiện chỗ này |
| Khối **GÓP Ý**: không màu cảnh báo · không điểm số · không chặn | Ba điều này đã khoá ở compile-time — UI không được lách |
| Mục mang `chuaKiemChung` phải **hiện rõ là chưa kiểm chứng** | N5 áp cả vào sản phẩm, không chỉ báo cáo |
| Tay cầm thu/mở dùng `components/ui/PanelFlank.tsx` | Mẫu chung toàn app (Hoà chốt 07/08). Đừng chế dải thứ hai |
| Bấm một mục → **nhảy tới đúng đối tượng** trên bàn vẽ / khối 3D / trang deck | Bảng kiểm không nhảy được thì chỉ là danh sách để đọc |
| Song ngữ VI/EN qua `useT` sẵn có | |

## VIỆC 3 — Mount

Mount **một chỗ duy nhất**, không ba chỗ. Panel tự đọc chặng đang mở rồi gọi đúng hàm.
Chỗ hợp lý: `components/studio/AppShell.tsx` (nơi đã quản Inspector).
**Khai `file:dòng` trong OUT** — N6 tính đúng chỗ này.

## VIỆC 4 — Lớp góp ý: GIỮ NGUYÊN trạng thái chặn

`lib/review/gopy/index.ts` đang **chặn có lý do** vì màn đề bài chưa xong.
**KHÔNG mở chặn, KHÔNG bịa nội dung AI.** UI hiện đúng: "chưa có đề bài dự án".

## Nghiệm thu

1. `tsc` 0 lỗi · `check-chot` 0/0 · `npm test` không thêm lỗi.
2. **Ảnh chụp thật** ở cả ba chặng, mỗi ảnh thấy đủ hai khối tách bạch.
3. Chứng minh nhảy được: bấm một mục luật ở chặng 2D → đối tượng lỗi được chọn trên bàn vẽ.

---

# ③ PHIẾU CHO `p14` · MỞ KHO DỰNG HÌNH

**Tệp OUT:** `docs/M-BUILD-OPS-2-OUT.md` · **Worktree:** `interiorflow-wt-p14` · **Cổng:** 3013
**Sở hữu:** `lib/three/build-ops.ts` · `lib/three/csg.ts` · `components/render-studio/Command3DPanel.tsx`
**Cấm đụng:** `components/studio/AppShell.tsx` (p3c đang mount) ·
`components/render-studio/Render3DModeSkeleton.tsx` (p3 đang sửa màn rỗng) · `lib/cad/` · `prisma/`

## Bối cảnh

Phiên này đã viết `build-ops.ts` (xem `M-BUILD-OPS-OUT.md`). Nó xuất **13 hàm** —
**11 hàm có 0 nơi gọi** ngoài chính nó và tệp test:

```
arrayGrid · arrayRadial · loftSections · revolveProfile · sweepProfile
prismTapered · prismChamfered · prismBeveledEx · mirrorGeometry
offsetPolygonInwardMm · filletPolygonMm
```

Hai hàm còn lại (`geometryOf`, `resolveGroupGeometry`) có đường sống thật qua
`lib/three/obj-scene-to-geometry.ts:12`. Đo lại:

```bash
for fn in arrayGrid arrayRadial loftSections revolveProfile sweepProfile prismTapered prismChamfered prismBeveledEx mirrorGeometry offsetPolygonInwardMm filletPolygonMm; do
  echo "$fn: $(grep -rn "\b$fn\b" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v 'lib/three/build-ops' | wc -l)"
done
```

## VIỆC 1 — Phân loại trước, đừng nối bừa cả 11

Không phải hàm nào cũng đáng có nút riêng. Chia ba nhóm, ghi bảng vào OUT:

| Nhóm | Nghĩa | Cách xử |
|---|---|---|
| **A · đáng có nút** | Người thiết kế nội thất dùng thật (nhân bản lưới ghế, xoay tròn quanh trục, vát cạnh bàn) | Lên `Command3DPanel` tab **Tạo** |
| **B · là bước con** | Chỉ được hàm khác gọi, không đứng riêng (`offsetPolygonInwardMm`, `filletPolygonMm`) | Nối vào hàm cha, ghi rõ cha là ai |
| **C · chưa tới lúc** | Cần dữ liệu chưa có | Ghi vào OUT làm GAP cho TỔNG — **không nối gượng** |

Xếp nhóm phải **nêu lý do theo nghề**, không theo cảm tính.

## VIỆC 2 — Nối nhóm A

- Mỗi phép có **nút CHỮ** (G6), không chỉ biểu tượng.
- Ô nhập tham số (số hàng/cột, khoảng cách, bán kính, số đoạn) — **đơn vị mm**, hiện rõ.
- **Lùi được** (KS4): xong bấm `Ctrl+Z` phải trả về hình cũ.
- Chưa chọn vật thì nút **khoá + nói rõ lý do TẠI CHỖ**, không dùng tooltip
  (bài học màn rỗng 07/08: lý do khoá phải lộ mặt).
- Phép nặng thì cho xem trước rồi mới chốt.

## VIỆC 3 — Test

Mỗi phép nối phải có phép kiểm **đo kết quả hình học** (số đỉnh, khung bao, thể tích),
không phải chỉ "gọi được không nổ". Theo khuôn `lib/three/build-ops.test.ts` sẵn có.

## Nghiệm thu

1. Số hàm 0-nơi-gọi giảm từ **11** xuống — ghi rõ còn bao nhiêu, hàm nào, vì sao còn.
2. Ảnh: chọn một khối → chạy một phép nhóm A → hình đổi → `Ctrl+Z` → về như cũ.
3. `tsc` 0 lỗi · `npm test` không thêm lỗi.

---

# ④ PHIẾU CHO `p2` · DỌN TRẦN "5 SHEET"

**Tệp OUT:** `docs/M-DON-TRAN-OUT.md` · **Worktree:** `interiorflow-wt-p2` · **Cổng:** 3014
**Sở hữu:** các chỗ nhắc trần "5 sheet" · `STATUS.md`
**Cấm đụng:** `prisma/` · `lib/review/` · `components/review/` · `lib/three/build-ops.ts` ·
`components/render-studio/Command3DPanel.tsx` · `docs/mocks/`

## VIỆC 1 — 27 chỗ còn nhắc trần "5 sheet"

Hoà chốt 07/08: **BỎ giới hạn ≤5 sheet ở TẤT CẢ chặng.** Nhưng còn 27 chỗ nhắc.

```bash
grep -rniE "≤ ?5 sheet|5 sheet|toi da 5 (to|trang|sheet)" --include=*.ts --include=*.tsx --include=*.md . | grep -v node_modules
```

Phân **ba loại**, xử khác nhau:

| Loại | Xử |
|---|---|
| **Chặn thật trong code** (`if (sheets.length >= 5)`) | Gỡ chặn. Cần trần vì lý do kỹ thuật (bộ nhớ) thì đặt trần **cao và khai rõ**, không phải 5 |
| **Chữ hiện cho người dùng** | Sửa lời cho khớp hành vi mới |
| **Ghi chép lịch sử trong `docs/`** | **GIỮ NGUYÊN** — sổ là biên bản, không sửa quá khứ (luật ghi thêm không ghi đè) |

Ghi bảng ba cột vào OUT: `file:dòng` · loại · đã xử ra sao.

## VIỆC 2 — `STATUS.md` phình gấp 10 lần trần

```
STATUS.md hiện: 586 dòng · 8 674 từ
CLAUDE.md đòi:  dưới 800 từ
```

Đây là **nguyên nhân tràn context** mà CLAUDE.md cảnh báo. Phải làm:

1. Giữ lại trong `STATUS.md`: đang chạy · vừa xong · worktree đang mở · việc kế tiếp.
2. Phần đã xong chuyển sang `CHANGELOG.md` (**ghi thêm, không ghi đè**).
3. Đích: **dưới 800 từ**. In số trước/sau vào OUT.

⚠️ Đọc kỹ trước khi cắt — trong đó có dòng như `STATUS.md:42` *"G-M3-15 (54 block) chừa cho p2"*
là **thông tin sống**, cắt nhầm là mất.

## Nghiệm thu

1. `wc -w STATUS.md` < 800.
2. Số chỗ nhắc "5 sheet" trong **code** (không tính `docs/`) = 0, hoặc còn lại có lý do kỹ thuật ghi rõ.
3. `tsc` 0 lỗi · `npm test` không thêm lỗi.

---

# ⑤ PHIẾU CHO `p3` · ĐỐI CHIẾU LẠI MOCK BẰNG MẮT

**Tệp OUT:** `docs/M-MOCK-2-OUT.md` · **Worktree:** `interiorflow-wt-p3` · **Cổng:** 3015
**Sở hữu:** `docs/mocks/` · 4 tệp màn rỗng: `components/ProjectSelect.tsx` ·
`components/cad/CadEditor.tsx` · `components/present-editor/PresentEditor.tsx` ·
`components/render-studio/Render3DModeSkeleton.tsx`
**Cấm đụng:** `components/studio/AppShell.tsx` (p3c) · `Command3DPanel.tsx` (p14) · `prisma/` · `lib/review/`

## VIỆC 1 — Vì sao phải làm lại

`docs/mocks/support.js` vừa được vá 07/08 đêm. **20/30 tệp mock cần nó**; trước đó mở bằng
`file://` thì `<sc-if>` không chạy ⇒ **mọi trạng thái chồng lên nhau**, `{{ }}` hiện chữ thô.

⚠️ **Phiên `p3` (nhánh M-EMPTY-2) đã đối chiếu 4 màn rỗng trong lúc mock đang hỏng** — nó tự khai
trong `M-EMPTY-2-OUT.md`: *"bản tĩnh chồng 4 màn nên cấu trúc nút đọc từ HTML"*.
Đọc mã thì **đúng chữ**, nhưng **không thấy được bố cục, khoảng cách, thứ bậc thị giác**.

## VIỆC 2 — Đối chiếu lại

1. Mở `docs/mocks/Bốn trạng thái rỗng.dc.html` bằng trình duyệt. Bấm 4 nút dưới cùng
   (`1a · Dự án` … `1d · Trình chiếu`) — mỗi lần phải hiện **đúng một** trạng thái.
   Nếu vẫn chồng: `Cmd+Shift+R` (Chrome cache bản cũ).
2. Mở app thật ở cùng 4 màn rỗng, **chụp cạnh nhau**.
3. So **ba thứ mà đọc mã không thấy được**:
   **bố cục** (thứ tự khối, canh lề) · **khoảng cách** (padding, gap, chiều cao nút) ·
   **thứ bậc** (cỡ chữ, độ đậm, tương phản).
4. Lệch thì **sửa CODE, không sửa mock** — mock là hợp đồng.
5. Kiểm luôn **G2** (nền panel ≥92%) và **G4** (line-height ≥1,5 — thấp hơn là cắt dấu tiếng Việt).

## VIỆC 3 — Xác minh tay cầm panel (nhánh `p3b` nợ lại)

`p3b` **không xác minh được bằng mắt** (dev server bệnh §0aa, `pkill` bị chặn quyền).
Nó chỉ dám tính "code xong + tsc sạch", không dám tính "xong". Server giờ đã sạch.

Làm 4 bước, **chụp ảnh từng bước**:

1. Mở Thư viện (phím `L`) → thấy dải mảnh có `‹` sát mép phải cột kệ → bấm → kệ thu, **vẫn còn dải** `›` → bấm lại nở ra.
2. Sang **Thiết kế 3D** mode Vẽ 3D → dải `‹` sát mép phải bảng lệnh → thu/mở tương tự.
3. Chọn một khối → bấm phím `I` (ẩn Inspector) → mép phải màn **còn dải 14px** → bấm mở lại được.
4. Thu kệ Thư viện → **RELOAD trang** → mở lại Thư viện → kệ **vẫn thu** (nhớ qua `localStorage`).

Bước nào sai thì sửa, ghi `file:dòng`.

## VIỆC 4 — 10 mock còn lại

10 tệp `.dc.html` không tham chiếu `support.js` là HTML thuần — mở được bình thường.
Rà nhanh xem có màn nào **đã dựng code mà chưa từng đối chiếu**, liệt kê vào OUT cho TỔNG.

## Nghiệm thu

Ảnh cho cả VIỆC 2 và VIỆC 3. **Không có ảnh = CHƯA VERIFY**, ghi thẳng vào OUT (N5).

---

# ⑥ PHIẾU CHO `p6` · NGHIỆM THU + BUILD FINAL

**Tệp OUT:** `docs/M-BUILD-FINAL-2-OUT.md`
**Chạy SAU CÙNG**, khi ①–⑤ đã xong và Hoà đã merge. **Chạy MỘT MÌNH trên `main`**, không worktree.
**Sở hữu:** không sửa tính năng. Chỉ đo, và chỉ vá lỗi chặn build.

## VIỆC 1 — Bốn thước bắt buộc

```bash
npx tsc --noEmit -p .
node scripts/check-chot.mjs
npm test
npm run license:check
```

Cả bốn phải xanh. Lỗi nào cũng phải giải thích bằng `file:dòng`, không được bỏ qua.

## VIỆC 2 — Đo lại toàn bộ bảng "Số đo nền"

Chạy lại **đúng** các lệnh ở mục *Số đo nền* (đầu tệp này), in bảng **TRƯỚC (07/08 23:30) / SAU**.
Số nào không cải thiện thì **nói thẳng vì sao**.

## VIỆC 3 — Đi một vòng người dùng, đầu tới cuối

Một mạch, **không tắt**, chụp ảnh từng chặng:

```
① Tạo dự án mới (màn rỗng 1a)
② Nhập một bản vẽ .dxf   → chặng Thiết kế 2D thấy hình
③ Dựng khối lên 3D       → chặng Thiết kế 3D thấy khối
④ Bắt điểm 3D            → thấy dấu + chữ Việt cạnh con trỏ
⑤ Chạy bảng kiểm         → thấy hai khối LUẬT / GÓP Ý tách bạch
⑥ Chụp ảnh render        → sang chặng Trình chiếu
⑦ Tạo deck từ ảnh đã dựng
⑧ Xuất PDF và PPTX
⑨ Tắt app, mở lại dự án  → MỌI THỨ CÒN NGUYÊN
```

Bước **⑨ quan trọng nhất** — nó chứng minh lỗ "flow mồ côi" đã bịt thật.
Tắt app, mở lại, vào đúng dự án đó: bản vẽ · khối · deck phải còn đủ.

Chỗ nào tắc thì **ghi lại rồi đi tiếp**, đừng dừng ở lỗi đầu. Cuối cùng liệt kê đủ, kèm `file:dòng`.

## VIỆC 4 — Build gói cài

```bash
npm run build
npm run electron:build:mac
```

Cài bản `.dmg` sinh ra **trên máy sạch, ngoài thư mục repo**, rồi thử: đăng nhập được không
(bệnh `electron-builder` bỏ rơi `node_modules/.prisma` đã vá bằng `extraResources` — cần chốt
dứt điểm) · tạo dự án được không · nhập bản vẽ được không.

## VIỆC 5 — Bàn giao cho TỔNG

Gom vào OUT: bảng TRƯỚC/SAU đầy đủ · mọi chỗ tắc ở VIỆC 3 xếp theo mức đau ·
mục `GAP-IF.md` **đã đóng thật** trong đợt này (TỔNG tự ghi sổ — §0u) ·
câu trả lời **có/không** cho: *"nền đã vững, đấu nối đã thông suốt chưa?"*

---

# THỨ TỰ CHẠY & BẢN ĐỒ CHỐNG ĐỤNG

```
BƯỚC 0   Hoà commit + push + dựng server sạch + mở 5 worktree
   │
   ├── p12 · Nền dữ liệu       ─┐
   ├── p3c · Bảng kiểm 3 chặng  │
   ├── p14 · Mở kho dựng hình   ├── SONG SONG (đúng trần 5 worktree của CLAUDE.md)
   ├── p2  · Dọn trần 5 sheet   │
   └── p3  · Đối chiếu mock    ─┘
   │
   ▼  Hoà merge cả 5, chạy tsc + npm test trên main
   │
p6 · Nghiệm thu + build final                          (một mình, sau cùng)
```

| | `prisma/`<br>`lib/server/` | `lib/review/`<br>`components/review/` | `AppShell` | `build-ops`<br>`Command3DPanel` | `Render3DModeSkeleton`<br>3 màn rỗng khác | `docs/mocks/` | `STATUS.md`<br>trần 5 sheet |
|---|---|---|---|---|---|---|---|
| **p12** | ✅ | | | | | | |
| **p3c** | | ✅ | ✅ | ⛔ | ⛔ | | |
| **p14** | | | ⛔ | ✅ | ⛔ | | |
| **p2** | ⛔ | ⛔ | | ⛔ | | ⛔ | ✅ |
| **p3** | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | |

Không ô nào trùng. Phiên nào thấy cần đụng ô của phiên khác → **DỪNG, báo TỔNG**, không tự sửa
(bài học 07/08: hai phiên cùng sửa `TitleSequence.tsx` gây lẫn công, phải đi đo lại mới biết).

## ⚠️ Ngân sách — đọc trước khi chạy cả 5

Thanh bên báo **"Approaching weekly usage limit · Resets Tue, Aug 11"**.
Chạy 5 phiên song song sẽ đốt nhanh. Nếu phải cắt, giữ theo thứ tự này:

| Ưu tiên | Phiên | Vì sao |
|---|---|---|
| **1** | `p12` | Lỗ ở **móng**. Không có nó thì mọi thứ khác đứng trên không khí |
| **2** | `p3c` | Động cơ đã lắp, chỉ thiếu đồng hồ — rẻ nhất mà thấy được ngay |
| **3** | `p3` | Xác minh bằng mắt hai việc đang nợ. Rẻ, không viết code mới nhiều |
| **4** | `p14` | Thêm năng lực, không phải vá lỗ |
| **5** | `p2` | Dọn dẹp. Quan trọng nhưng không chặn ai |

`p6` (nghiệm thu) **luôn phải chạy**, kể cả khi cắt bớt — không có nó thì không biết đợt này
được gì.

## Dọn worktree sau khi merge (KHÔNG dùng `--force`)

Chỉ dọn khi đủ **cả bốn**: nhánh đã merge · `git status` sạch · không còn dev server chạy trong đó ·
không có commit chỉ tồn tại ở worktree đó.

```bash
cd ~/Downloads/interiorflow
git branch --merged main
git worktree remove ../interiorflow-wt-p12 && git branch -d feat/p12-nen-du-lieu
```

Thiếu một điều kiện → **giữ nguyên**, ghi lý do vào `STATUS.md` mục "Worktree đang mở".
