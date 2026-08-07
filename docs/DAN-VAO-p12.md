> **CÁCH DÙNG:** mở tệp này, `Cmd+A` → `Cmd+C` → dán thẳng vào phiên **`p12`** trong Claude Code.
> Không cần cắt gọt gì. (Tệp gốc đầy đủ 6 phiếu: `docs/PHIEU-FINAL-2026-08-08.md`)

---

# LUẬT BẮT BUỘC — đọc trước khi gõ dòng code đầu tiên

Đọc theo thứ tự: `STATUS.md` → `docs/00-CHOT.md` → `docs/00-BAT-DAU-DOC-DAY.md`.
**KHÔNG đọc `CHANGELOG.md`.**

```
V6  · KHÔNG commit. Hoà commit. Làm xong để nguyên, báo cáo.
§0u · Chỉ COWORK-TỔNG được ghi docs/GAP-IF.md. Phiên khác ghi vào tệp OUT của mình.
§0ab· Sổ là ảnh chụp cũ. ĐO LẠI bằng máy trước khi tin bất kỳ con số nào.
§0ac· Báo cáo phải tự khai: tệp OUT tên gì, dán vào phiên nào.
N1  · Báo cáo KHÔNG phải bằng chứng. Mỗi việc "xong" phải kèm số đo hoặc ảnh.
N5  · Khai thật cái chưa xong. Thà ghi "CHƯA VERIFY" còn hơn ghi "xong" mà không đo.
N6  · Code không có nơi mount = CHƯA XONG. Phải chỉ được file:dòng nơi gọi tới.
N8  · Mọi dòng báo cáo có file:dòng.
```

**Luật sản phẩm**

- IF là sản phẩm global. 0 tên khách, 0 brand studio nhúng cứng.
- `MaterialDef` = thị giác · `ProductSpec` = thương mại. **Cố ý không trộn** (luật 2.1.9.i).
- Cấm chữ "tự động" ở nhãn hành động AI. Phễu AI tên "Magic".
- **KHÔNG đổi tên code** `lib/cad/`, `useCadStore`, route `/projects/[id]/cad`.

**Cửa kiểm trước khi báo xong**

```bash
npx tsc --noEmit -p .        # phải 0 lỗi
node scripts/check-chot.mjs  # phải 0 đỏ 0 vàng
npm test                     # không được thêm lỗi mới
```

> ⚠️ **Bài học 08/08 — áp lên chính phiên này:** một script vừa in "✅ đã gỡ 7/7" trong khi
> thực tế gỡ nhầm, số hỏng tăng từ 7 lên 27. Không ai phát hiện vì script không tự đo lại.
> **Mọi thao tác sửa dữ liệu trong phiếu này phải ĐO LẠI SAU KHI CHẠY**, và in số TRƯỚC/SAU.
> Không về đúng đích thì báo THẤT BẠI, đừng in "xong".

---

# PHIẾU `p12` · NỀN DỮ LIỆU

**Tệp OUT phải ghi:** `docs/M-NEN-DL-OUT.md`
**Sở hữu:** `prisma/` · `lib/server/` · `lib/workspace.ts` · `scripts/`
**Cấm đụng:** `components/` · `lib/three/` · `lib/review/` · `lib/cad/`

> Phiếu **nặng nhất và chặn nhiều nhất** trong đợt. Hai lỗ dưới đây là lỗ ở **móng**, không phải
> thiếu tính năng. Chừng nào chúng còn, mọi thứ xây bên trên đều lung lay.
> Bốn phiếu còn lại (`p3c` · `p14` · `p2` · `p3`) chạy song song ở worktree khác — đừng đụng
> vùng của họ.

---

## VIỆC 1 — Ba bảng khai mà không tồn tại

**Đo lại trước. Đừng tin con số của TỔNG.**

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

Số TỔNG đo lúc 23:30 · 07/08: **DB 17 · schema 20** · thiếu `WorkflowState` · `Task` · `ExternalRef`.
Migration đã áp: đúng **1** (`20260703141955_init`).

### Phải làm

**① Hiểu trước khi tạo.** Đọc `prisma/schema.prisma` phần khai 3 model đó:

| Model | Là gì |
|---|---|
| `Task` | Tầng **Việc** — lớp workspace của cả hệ IDF |
| `ExternalRef` | **Cầu nối sang app khác** — ArchiNote · Larkbase · SyncWork |
| `WorkflowState` | Trạng thái luồng |

**② Sinh migration bằng đúng công cụ**, không gõ SQL tay:

```bash
npx prisma migrate dev --name them-workflowstate-task-externalref
```

**③ ⛔ Prisma đòi RESET dữ liệu → DỪNG, BÁO HOÀ.** Trong `dev.db` đang có:

```
9 dự án · 10 người dùng · 1 516 tài sản thư viện · 46 flow · 14 phiên bản flow
```

Mất là mất thật. Ưu tiên `migrate diff` + `migrate resolve` để giữ dữ liệu.

**④** `lib/server/tasks.test.ts` và `lib/server/credits.test.ts` phải chạy được sau khi có bảng.

**Nghiệm thu:** in lại lệnh đo, kết quả phải là `DB: 20 | schema: 20 | THIEU:` (rỗng).

---

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

> ⚠️ **Số này đang có tranh chấp** — `scripts/soi-app.py` báo **43/43**, TỔNG đo được **45/46**.
> Hai thước đếm khác nhau. **Đo lại bằng lệnh trên, lấy đó làm chuẩn**, và ghi vào OUT vì sao lệch.

### ⛔ ĐỪNG viết script gán bừa `projectId`. Tìm gốc trước.

Phải trả lời được **ba câu, mỗi câu kèm `file:dòng`**:

| # | Câu hỏi | Chỗ tìm |
|---|---|---|
| **a** | Đường tạo Flow nào **không truyền** `projectId`? | `app/api/**/flow*` · `lib/server/` · chỗ gọi `prisma.flow.create` |
| **b** | `projectId` là optional trong schema — **cố ý hay sót**? | `prisma/schema.prisma` model `Flow` |
| **c** | Mở dự án thì **thấy flow bằng truy vấn nào**? Truy vấn đó có lọc `projectId` không? | `lib/server/` · `app/api/projects/` |

### Rồi mới sửa, theo thứ tự

**① Bịt đường tạo mồ côi** — mọi lối tạo Flow phải có dự án chủ, hoặc rơi vào dự án "Nháp" mặc định.

**② Dữ liệu cũ: KHÔNG xoá.** Viết `scripts/gan-flow-mo-coi.mjs`:

- Mặc định **chạy khô** (`--dry-run` là mặc định, `--that` mới làm thật).
- In bảng: *flow nào → về dự án nào → **vì sao*** (bằng chứng, không phải đoán).
- Suy chủ bằng: `FlowVersion` · `userId` · `createdAt` gần dự án nào · tên trùng.
- Không suy ra được → gom vào dự án **"Chưa phân loại"**. Không đoán bừa.
- **ĐO LẠI SAU KHI CHẠY** — in số mồ côi TRƯỚC/SAU. Không về đích thì báo THẤT BẠI (bài học 08/08).
- **Chờ Hoà duyệt bảng chạy khô** rồi mới chạy thật (KS3 · KS4).

**Nghiệm thu:** flow mồ côi = 0, **hoặc** số còn lại đều nằm trong "Chưa phân loại" có tên rõ;
**và** đường tạo mới không đẻ thêm mồ côi được (kèm test).

---

## VIỆC 3 — Test Prisma chạy được trên cả hai nền

`binaryTargets` hiện chỉ có `native` ⇒ máy Hoà (macOS) chạy được, hộp cát Linux/CI gãy với:

```
Prisma Client could not locate the Query Engine for runtime "linux-arm64-openssl-3.0.x".
This happened because Prisma Client was generated for "darwin-arm64"
```

Thêm vào `prisma/schema.prisma`:

```
binaryTargets = ["native", "linux-arm64-openssl-3.0.x", "linux-musl-arm64-openssl-3.0.x"]
```

rồi `npx prisma generate`.

⚠️ Nếu làm phình gói cài `.dmg` thì **khai rõ số MB tăng** trong OUT, để TỔNG quyết — đừng tự bỏ.

---

## BÁO CÁO — ghi vào `docs/M-NEN-DL-OUT.md`

Bắt buộc có:

1. **Bảng TRƯỚC / SAU** cho cả 3 việc, số đo bằng máy.
2. Ba câu trả lời a·b·c của VIỆC 2, mỗi câu kèm `file:dòng`.
3. Danh sách tệp đã tạo / đã sửa.
4. Mục **CHƯA VERIFY** — cái gì chưa đo được và vì sao (N5).
5. Dòng cuối tự khai: *"Tệp OUT: `docs/M-NEN-DL-OUT.md` · dán vào phiên `p12`"* (§0ac).

**KHÔNG commit.** Làm xong để nguyên, Hoà commit.
