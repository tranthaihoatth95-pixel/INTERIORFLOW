# NGHIÊN CỨU · Phân quyền & Cộng tác nhóm — InteriorFlow

> **Trạng thái: ĐỀ XUẤT, CHƯA THỰC THI.** Tài liệu này KHÔNG kèm thay đổi schema/API/UI nào.
> Mọi khối code bên dưới là **mẫu minh hoạ**, chưa áp vào repo.
> Lý do: đây là thay đổi an ninh + đụng dữ liệu thật → chờ chủ dự án duyệt phương án.
>
> Nhánh: `feat/research-access` · Ngày: 2026-07-20 · Mọi khẳng định về code đã verify bằng đọc file thật.

---

## 0. TÓM TẮT CHO NGƯỜI BẬN

**Chọn phương án B — `ProjectMember` tường minh + `Project.currentStage` (GATE) + `User.isAdmin` giữ nguyên làm cửa hậu.**

3 phát hiện phải báo trước, nằm NGOÀI hiện trạng mà chủ dự án mô tả:

| # | Phát hiện | Mức |
|---|---|---|
| 1 | `app/api/comments/route.ts` **không có một dòng auth nào** — GET/POST/PATCH/DELETE mở cho mọi người. `DELETE ?all=1` xoá sạch góp ý. | 🔴 Nghiêm trọng |
| 2 | `app/api/dashboard/route.ts:41-53` trả **`shareToken` của 12 flow mới nhất toàn team** + email/SĐT/credits/isAdmin của mọi user | 🔴 Nghiêm trọng |
| 3 | `app/api/cursors/route.ts:35-45` không auth, `userId` do **client tự khai** → giả danh presence | 🟠 Vừa |

Và 1 điểm **mâu thuẫn với brief**: **`Project.stage`/`phase` KHÔNG tồn tại trong DB.** Xem §5.1.

---

## 1. HIỆN TRẠNG ĐÃ VERIFY

### 1.1 Xác nhận đúng những gì chủ dự án mô tả

| Mô tả trong brief | Verify | Kết luận |
|---|---|---|
| `Project`/`Flow` chỉ có `userId`, không bảng thành viên | `prisma/schema.prisma:52-61`, `:63-79` | ✅ Đúng |
| `ChatMessage` không gắn project | `prisma/schema.prisma:103-110` — chỉ `{id,userId,text,createdAt}` | ✅ Đúng |
| `LibraryAsset` mọi người đều thấy | `app/api/library/route.ts:13-16` — `findMany` không `where` | ✅ Đúng (và **cố ý**, xem §4.3) |
| `flows/route.ts` lọc `where:{userId:user.id}` | `app/api/flows/route.ts:14` | ✅ Đúng |
| `PRO_ONLY_TOOLS` gate theo toggle tay | `lib/cad/store.ts:106-111` (danh sách 30 tool), `:330-334` `setCadMode` nhận tham số trực tiếp — không có khái niệm role | ✅ Đúng |
| `User.isAdmin` | `prisma/schema.prisma:20` | ✅ Đúng |
| Chat polling 3s | `components/ChatPanel.tsx:27,44` — `setTimeout(poll, 3000)` | ✅ Đúng |

### 1.2 ⚠️ MÂU THUẪN — `Project.stage`/`phase` không tồn tại

Brief §5 hỏi *"có nên tái dùng `Project.stage`/`phase` sẵn có không"*. **Không có gì để tái dùng.**

- `prisma/schema.prisma:52-61` — `Project` chỉ có `{id, userId, name, clientName, createdAt}`. Không `stage`, không `phase`, không `status`.
- `Phase` là khái niệm **thuần client**: `lib/phases.ts:7` — `type Phase = 'concept'|'render'|'present'`, và `lib/phases.ts:122` `phaseFromNodes()` **suy ra** phase từ node type đang có trên canvas, không đọc DB.
- `Flow.status` (`schema:70`) tồn tại nhưng là **chuỗi ghi chú tự do** hiện dưới tên dự án (comment tại chỗ ghi rõ: *"dòng trạng thái ngắn... trống = 'Chưa có ghi chú'"*), KHÔNG phải máy trạng thái.

→ **GATE bắt buộc phải thêm field mới.** Không có đường tắt. Đây là điểm quan trọng nhất về ước lượng công.

### 1.3 ⚠️ MÂU THUẪN — lệnh test trong CLAUDE.md sai

`CLAUDE.md` ghi `npx vitest run`. Nhưng `grep -c vitest package.json` = **0**; `package.json:8-18` không có script `test`. Test chạy bằng `node_modules/.bin/sucrase-node <file>.test.ts` (64 file `.test.ts`), đúng như `STATUS.md:18` ghi. Mục §7 dùng cách này.

---

## 2. MÔ HÌNH DỮ LIỆU

### 2.1 So sánh 3 phương án

| | **A · Role toàn cục** (`User.role`) | **B · Membership tường minh** (`ProjectMember`) ✅ | **C · Chỉ ACL theo flow** |
|---|---|---|---|
| Cách làm | Thêm `User.role: 'crea'\|'hoavien'\|'bim'`, lọc project theo role khớp stage | Bảng `ProjectMember{projectId,userId,role}` + `Project.currentStage` | Bảng `FlowShare{flowId,userId,perm}` |
| Trả lời yêu cầu #1 (*"chỉ thấy dự án mình làm"*) | ❌ Sai bản chất — CREA A sẽ thấy MỌI dự án đang ở chặng concept, kể cả của CREA B | ✅ Đúng — thấy đúng project mình có membership | ⚠️ Đúng ở mức flow, nhưng gallery gom theo *project* nên phải join ngược, rườm rà |
| Phục vụ GATE | ⚠️ Có role nhưng không biết *ai* cầm dự án nào | ✅ `currentStage` + role thành viên = đủ để khoá/mở chặng | ❌ Không có khái niệm chặng |
| Một người 2 vai (Hoà vừa CREA vừa quản lý) | ❌ Không biểu diễn được | ✅ Role theo *từng dự án*, khác nhau được | ✅ |
| Số bảng thêm | 0 | 1 | 1 |
| Rủi ro sót chốt chặn | Cao — logic role rải rác | Thấp — 1 helper `assertProjectAccess` | Trung bình |

### 2.2 CHỌN B — vì sao

Yêu cầu #1 của chủ dự án là *"bạn nào làm dự án nào sẽ vào thấy đúng gallery"* — đây là quan hệ **người ↔ dự án cụ thể**, không phải **người ↔ loại công việc**. Phương án A trả lời nhầm câu hỏi: nó phân quyền theo *nghề*, mà công ty có nhiều CREA cùng lúc, nên CREA A vẫn thấy dự án CREA B. Chỉ B mới biểu diễn đúng.

B cũng là cái duy nhất **gánh luôn GATE** như `IF1_IF2_BIGPICTURE.md:33-35` yêu cầu (*"mỗi team SỞ HỮU đúng 1 chặng tại 1 thời điểm... bàn giao qua GATE đóng băng snapshot"*): `Project.currentStage` cho biết dự án đang ở trạm nào, `ProjectMember.role` cho biết người này có phải chủ trạm đó không. Hai mảnh ghép đủ để `PRO_ONLY_TOOLS` chuyển từ toggle tay sang `role + đã-bàn-giao-chưa` — đúng chỉ đạo `BIGPICTURE:21-23`.

**Không làm hai lần** = làm B ngay bây giờ, GATE ở wave sau chỉ việc đọc bảng đã có.

### 2.3 Schema đề xuất (MẪU — chưa áp)

Toàn bộ **additive**: không sửa/xoá field nào đang có. `Project.userId` và `Flow.userId` **giữ nguyên** làm "người tạo" (creator) — không đổi ý nghĩa, không đụng code cũ.

```prisma
// ══ MỚI ══ Thành viên dự án. Nguồn chân lý DUY NHẤT cho "ai thấy dự án nào".
model ProjectMember {
  id        String   @id @default(cuid())
  projectId String
  userId    String
  role      String   // 'owner' | 'crea' | 'drafter' | 'bim' | 'viewer'
  createdAt DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId],    references: [id], onDelete: Cascade)

  @@unique([projectId, userId])   // 1 người 1 vai / 1 dự án
  @@index([userId])               // truy vấn nóng: "dự án của tôi"
}

model Project {
  // ... giữ nguyên toàn bộ field cũ (id, userId, name, clientName, createdAt) ...

  // ══ MỚI, đều optional/có default → .idf và DB cũ không vỡ ══
  currentStage String  @default("concept")  // 'concept'|'render'|'present' — trùng lib/phases.ts:7
  stageLocked  Boolean @default(false)      // true = đã qua GATE, chặng trước đóng băng
  archived     Boolean @default(false)

  members ProjectMember[]
}

model ChatMessage {
  // ... giữ nguyên ...
  projectId String?   // ══ MỚI, NULLABLE ══ null = kênh chung toàn công ty (hành vi cũ)
  project   Project?  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  @@index([projectId, createdAt])
}
```

**Vì sao `role` là `String` chứ không `enum`:** `datasource db provider = "sqlite"` (`schema.prisma:7`) — Prisma **không hỗ trợ `enum` trên SQLite**. Ràng buộc phải nằm ở tầng code. Khi lên Postgres/Supabase (Sprint 4, `STATUS.md:23`) thì đổi sang `enum` được, nhưng union type TS đã đủ an toàn:

```ts
// lib/server/access.ts (MẪU)
export const ROLES = ['owner','crea','drafter','bim','viewer'] as const;
export type ProjectRole = (typeof ROLES)[number];

/** Thứ bậc — số lớn hơn = quyền cao hơn. Dùng cho minRole. */
export const ROLE_RANK: Record<ProjectRole, number> = {
  viewer: 0, bim: 1, drafter: 2, crea: 3, owner: 4,
};

/** Chặng nào do vai nào cầm — dây chuyền tiếp sức (BIGPICTURE §2). */
export const STAGE_OWNER: Record<'concept'|'render'|'present', ProjectRole> = {
  concept: 'crea', render: 'drafter', present: 'crea',
};
```

### 2.4 Enum role — giải thích lựa chọn

| Role | Ai | Quyền |
|---|---|---|
| `owner` | Người tạo dự án / quản lý | Toàn quyền + mời/gỡ thành viên + mở GATE ngược |
| `crea` | Trạm 1 — sáng tạo | Sửa khi `currentStage='concept'`; đẩy GATE sang render |
| `drafter` | Trạm 2 — hoạ viên kỹ thuật | Sửa khi `currentStage='render'`; mở CAD Pro tool |
| `bim` | Trạm 3 — Team BIM | Sửa khi `currentStage='present'` (và IF2 sau này) |
| `viewer` | Khách / sếp duyệt | Chỉ đọc, mọi chặng |

Ba vai giữa **ánh xạ 1-1 với 3 trạm** của dây chuyền tiếp sức. Đây là lý do enum trông "lạ" so với `admin/editor/viewer` thông thường — nó phục vụ mô hình nghiệp vụ thật, không phải mô hình generic.

### 2.5 Migrate dữ liệu cũ — script (MẪU)

**Nguyên tắc: mọi `Project` đang có phải sinh đúng 1 `ProjectMember` role `owner` cho `Project.userId`.** Nếu bỏ bước này, sau khi bật lọc quyền thì **mọi người mất sạch dự án** — đây là rủi ro chết người của cả đợt.

```ts
// scripts/backfill-project-members.ts (MẪU — chạy 1 lần, idempotent)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({ select: { id: true, userId: true } });
  let created = 0;
  for (const p of projects) {
    const r = await prisma.projectMember.upsert({
      where:  { projectId_userId: { projectId: p.id, userId: p.userId } },
      update: {},                                        // đã có → không đụng
      create: { projectId: p.id, userId: p.userId, role: 'owner' },
    });
    if (r) created++;
  }

  // Flow mồ côi: flow có projectId=null (schema:65 cho phép) → vẫn lọc bằng Flow.userId.
  const orphans = await prisma.flow.count({ where: { projectId: null } });
  console.log(`✔ ${created}/${projects.length} member · ${orphans} flow chưa gắn project`);
}
main().finally(() => prisma.$disconnect());
```

**Backward-compatible ở đâu:**
- `Project.userId` không đổi → mọi truy vấn cũ vẫn chạy trong lúc migrate.
- `Flow` **không cần** field mới: quyền suy ra qua `Flow.projectId → Project.members`. Flow `projectId=null` rơi về luật cũ `Flow.userId`.
- `currentStage` có `@default("concept")` → row cũ tự có giá trị, không cần backfill.
- `ChatMessage.projectId` nullable → 100% tin nhắn cũ thành "kênh chung", không mất tin nào.

⚠️ **Cảnh báo migration (từ memory dự án):** đang có drift — `IntegrationAccount` chưa apply. Dùng `prisma db push`, **TUYỆT ĐỐI KHÔNG `prisma migrate reset`**. Backup `prisma/dev.db` trước khi chạy bất cứ thứ gì.

---

## 3. ĐIỂM CHỐT CHẶN (ENFORCEMENT)

### 3.1 Nguyên tắc

**Chặn ở SERVER, không phải ẩn ở UI.** Ẩn nút trên UI chỉ là lịch sự với người dùng — bất kỳ ai mở DevTools gõ `fetch('/api/flows/<id>')` là bypass sạch. Mọi route dưới đây phải tự kiểm tra, không tin client.

### 3.2 Lớp helper dùng chung (MẪU)

```ts
// lib/server/access.ts (MẪU)
import { prisma } from '@/lib/server/db';

export class AccessError extends Error {
  constructor(public status: 401 | 403 | 404, msg: string) { super(msg); }
}

/**
 * Cửa DUY NHẤT để hỏi "user này có quyền gì trên project này".
 * Trả về role, hoặc ném AccessError. Không route nào được tự query ProjectMember.
 */
export async function assertProjectAccess(
  userId: string, projectId: string, minRole: ProjectRole = 'viewer',
): Promise<ProjectRole> {
  const m = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });
  // 404 chứ không 403: không tiết lộ "project này có tồn tại" cho người ngoài.
  if (!m) throw new AccessError(404, 'Không tìm thấy dự án.');
  const role = m.role as ProjectRole;
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) throw new AccessError(403, 'Không đủ quyền.');
  return role;
}

/** Flow → project. Flow mồ côi (projectId=null) rơi về luật cũ: chỉ chủ sở hữu. */
export async function assertFlowAccess(
  userId: string, flowId: string, minRole: ProjectRole = 'viewer',
) {
  const flow = await prisma.flow.findUnique({
    where: { id: flowId }, select: { id: true, userId: true, projectId: true },
  });
  if (!flow) throw new AccessError(404, 'Không tìm thấy.');
  if (!flow.projectId) {
    if (flow.userId !== userId) throw new AccessError(404, 'Không tìm thấy.');
    return { flow, role: 'owner' as ProjectRole };
  }
  return { flow, role: await assertProjectAccess(userId, flow.projectId, minRole) };
}

/** Danh sách projectId user được thấy — dùng cho MỌI truy vấn dạng list. */
export async function visibleProjectIds(userId: string): Promise<string[]> {
  const rows = await prisma.projectMember.findMany({
    where: { userId }, select: { projectId: true },
  });
  return rows.map((r) => r.projectId);
}

/** GATE: có được SỬA ở chặng hiện tại không (BIGPICTURE §2 — mỗi team 1 chặng). */
export function canEditStage(role: ProjectRole, stage: string): boolean {
  if (role === 'owner') return true;
  if (role === 'viewer') return false;
  return STAGE_OWNER[stage as keyof typeof STAGE_OWNER] === role;
}
```

### 3.3 Bảng chốt chặn ĐẦY ĐỦ

Mọi route trong `app/api/**/route.ts` (36 file, đã liệt kê hết):

| Route | Hiện tại | Cần làm | Ưu tiên |
|---|---|---|---|
| `app/api/comments/route.ts` | 🔴 **KHÔNG AUTH** — GET/POST/PATCH/DELETE mở toang; `DELETE?all=1` xoá sạch (`:106-116`) | Thêm `getSessionUser()`; quyết định giữ hay gỡ (§4.1) | **P0** |
| `app/api/dashboard/route.ts` | 🔴 Trả `shareToken` 12 flow toàn team (`:41-53`, field `:49`) + email/SĐT/credits/isAdmin mọi user (`:17-29`) | Bỏ `shareToken` khỏi select. Lọc `projects`/`flows` theo `visibleProjectIds`. Chỉ `isAdmin` mới xem stats toàn team | **P0** |
| `app/api/cursors/route.ts` | 🟠 Không auth, `userId` client tự khai (`:35-45`) | `getSessionUser()`, **bỏ qua `userId` từ body**, dùng `user.id`; `assertFlowAccess` cho `flowId` | **P0** |
| `app/api/flows/route.ts` GET | Lọc `userId` (`:14`) → không chia sẻ được. Roster trả **toàn bộ user** (`:34-37`) | `where: { OR: [{userId}, {projectId: {in: visibleProjectIds}}] }`. Roster giới hạn thành viên các project đang thấy | **P1** |
| `app/api/flows/route.ts` POST | Tạo project không lập member (`:57-60`) | Tạo `Project` **và** `ProjectMember{role:'owner'}` trong 1 transaction. Gắn flow vào project → `assertProjectAccess(..., 'bim')` | **P1** |
| `app/api/flows/[id]/route.ts` | ✅ Có check `flow.userId !== user.id` (`:9-10`) — đúng nhưng quá chặt, chặn cả đồng đội | Đổi sang `assertFlowAccess`. GET→`viewer`; PUT→`canEditStage`; DELETE→`owner` | **P1** |
| `app/api/chat/route.ts` | Mọi tin nhắn toàn team (`:10-15`) | Lọc `projectId` + `assertProjectAccess`. Xem §4 | **P1** |
| `app/api/share/[token]/route.ts` | Public, không đăng nhập (`:5-18`) — **cố ý** | Thêm `expiresAt`/`revokedAt`. Xác nhận với chủ dự án (§4.4) | **P2** |
| `app/api/library/route.ts` | Mọi asset (`:13-16`) — **cố ý**, comment `:9` ghi rõ | Xem §4.3 — cần chủ dự án quyết | **HỎI** |
| `app/api/library/[id]/file/route.ts` | Mọi user tải mọi file (`:7-11`) | Theo quyết định §4.3 | **HỎI** |
| `app/api/library/[id]/route.ts` DELETE | ✅ `asset.userId !== user.id && !user.isAdmin` (`:13`) | Không đổi | — |
| `app/api/library/clip/route.ts` | Có auth, gắn `user.id` (`:49`) | Không đổi | — |
| `app/api/credits/route.ts` | ✅ Mọi query scope `user.id` (`:21,28,45`) | Không đổi | — |
| `app/api/jobs/route.ts`, `jobs/[id]` | ✅ Có `getSessionUser` (`:8-10`, `:8-9`) | Cân nhắc: gắn job vào project để tính credit theo dự án (ngoài phạm vi) | — |
| `app/api/render/premium/route.ts` | ✅ Auth + trừ credit (`:41`) | Không đổi | — |
| `app/api/render/fbx`, `nvidia-image` | ✅ Đã có `getSessionUser` (verify: mỗi file 2 lần gọi) | Không đổi | — |
| 🟠 `vision/caption`, `pdf/extract`, `present/text`, `illustration`, `strategy/scenarios` | **KHÔNG có `getSessionUser`** (verify: grep = 0 cả 5 file) — endpoint gọi AI mở cho vô danh = ai cũng đốt được balance | Thêm `getSessionUser()` chặn đầu | **P1** |
| `app/api/integrations/[provider]/*` | ✅ Đều scope `user.id` | Không đổi | — |
| `app/api/auth/*` | Ngoài phạm vi | — | — |
| `app/api/health` | Public — OK | — | — |

**Ngoài API — nơi truy vấn dữ liệu khác:**

| Nơi | Ghi chú |
|---|---|
| `components/Dashboard.tsx`, `components/GalleryPanel.tsx` | Chỉ hiển thị. Sau khi API lọc đúng thì tự đúng — **không sửa UI để "vá" quyền** |
| `app/share/[token]/page.tsx` | Server component đọc share — kiểm tra có tự query DB không |
| `lib/cad/store.ts:106-111,330-334` | `PRO_ONLY_TOOLS` → gate theo `role + stageLocked`. **Đây chỉ là UX, không phải bảo mật** — chặn thật vẫn ở PUT `/api/flows/[id]` |

### 3.4 Cách viết test bảo đảm không sót

Chạy bằng `node_modules/.bin/sucrase-node lib/server/access.test.ts` (khớp 64 file `.test.ts` đang có, **không dùng vitest** — xem §1.3).

**Ba tầng:**

1. **Unit** — `ROLE_RANK`, `canEditStage`: bảng chân trị đầy đủ 5 role × 3 stage = 15 assert.

2. **Test "quét route" — quan trọng nhất, chống sót về sau.** Đọc thư mục `app/api`, ép mọi route mới phải khai báo chính sách:

```ts
// lib/server/access-coverage.test.ts (MẪU)
// Mọi route API phải nằm trong 1 trong 3 danh sách. Thêm route mới mà quên
// → test ĐỎ ngay, buộc người viết phải nghĩ về quyền.
const PUBLIC_ROUTES  = ['app/api/health/route.ts', 'app/api/share/[token]/route.ts', /* auth/* */];
const USER_SCOPED    = ['app/api/credits/route.ts', 'app/api/jobs/route.ts', /* ... */];
const PROJECT_SCOPED = ['app/api/flows/route.ts', 'app/api/chat/route.ts', /* ... */];

const all = walk('app/api').filter((f) => f.endsWith('route.ts'));
for (const f of all) {
  ok(`${f} đã khai báo chính sách quyền`,
     PUBLIC_ROUTES.includes(f) || USER_SCOPED.includes(f) || PROJECT_SCOPED.includes(f));
}
// Route non-public PHẢI gọi getSessionUser — bắt bug /api/comments ngay từ đầu
for (const f of all.filter((x) => !PUBLIC_ROUTES.includes(x))) {
  ok(`${f} gọi getSessionUser`, readFileSync(f, 'utf8').includes('getSessionUser'));
}
```

3. **Test kịch bản rò rỉ** — dựng 2 user + 2 project trên DB tạm, khẳng định user B **không** đọc/sửa/xoá được của A qua từng route `PROJECT_SCOPED`. Đây là test chống hồi quy thật sự.

---

## 4. RỦI RO RÒ RỈ — TỪNG CHỖ

### 4.1 🔴 `/api/comments` — không auth (P0)

`app/api/comments/route.ts` không import `getSessionUser`, không kiểm tra gì. Bốn method mở hoàn toàn:
- `GET :60-62` — đọc **toàn bộ** góp ý của mọi người
- `POST :64-92` — ghi file `comments-review.json` + **ghi ảnh vào `public/comments-images/`** (`:37-45`), tức ghi file lên đĩa server từ request vô danh
- `DELETE :106-116` — `?all=1` **xoá sạch**

Đọc comment đầu file (`:1-10`): đây là **công cụ nội bộ để Claude đọc góp ý**, không phải tính năng sản phẩm. Nhưng nó đang chạy trong cùng app, và IF sắp *"launch cho dùng thử SỚM"* (`IF1_IF2_BIGPICTURE.md:82`).

**Xử lý — cần chủ dự án chọn (Câu hỏi Q1):** khuyến nghị **cổng theo env** `if (process.env.NODE_ENV === 'production') return 404` + thêm `getSessionUser()`. Giữ được tiện ích khi dev, biến mất khi launch. Rẻ hơn viết lại thành tính năng thật.

### 4.2 🔴 `/api/dashboard` — rò shareToken + PII (P0)

`app/api/dashboard/route.ts:41-53` select `shareToken: true` cho 12 flow mới nhất **toàn team**. `shareToken` là chìa khoá của `/api/share/[token]` — endpoint **public, không cần đăng nhập** (`share/[token]/route.ts:4`). Nghĩa là: bất kỳ ai đăng nhập được vào IF đều lấy được link công khai của flow người khác, rồi phát tán ra ngoài công ty. Người bị lộ không hề biết.

`:17-29` cũng trả email, SĐT, credits, isAdmin của **mọi** user cho **mọi** người gọi.

Comment `:6-8` biện minh *"app nội bộ team (LAN) → hiển thị toàn team"*. Điều đó có thể chấp nhận với 5 người cùng phòng, nhưng mâu thuẫn trực tiếp với yêu cầu #1 của chủ dự án (*"không thấy tràn lan qua dự án người khác"*), và mất hiệu lực hoàn toàn khi lên PWA Vercel + Supabase (`STATUS.md:23`) hoặc qua tunnel `interiorflow-ttt.loca.lt`.

**Xử lý:** (a) bỏ `shareToken` khỏi select **ngay** — sửa 1 dòng, không phá gì; (b) `projects`/`flows` lọc qua `visibleProjectIds`; (c) `team` + `stats` toàn công ty chỉ cho `isAdmin`, người thường thấy thành viên các dự án mình tham gia.

### 4.3 🟡 Thư viện dùng chung — CỐ Ý, nhưng cần xác nhận

`app/api/library/route.ts:9` và `prisma/schema.prisma:112` đều ghi rõ *"thư viện dùng chung cả team"*. **Tôi không tự quyết chỗ này** — đây là thiết kế có chủ đích, và với thư viện vật liệu/nội thất thì dùng chung là ĐÚNG (mỗi người tự upload lại 500 mẫu gỗ là vô lý).

Nhưng `LibraryAsset` không đồng nhất. Field `usage` (`schema:122`) có 7 giá trị, và chúng khác nhau về mức nhạy cảm:

| `usage` | Bản chất | Nên dùng chung? |
|---|---|---|
| `material`, `furniture` | Thư viện vật liệu/nội thất công ty | ✅ Chung — đúng chủ ý |
| `ref-render`, `layout`, `cad` | Ảnh tham chiếu, có thể là bản vẽ khách hàng | ⚠️ Cần hỏi |
| `slide` | Slide đã dàn — sản phẩm của một dự án cụ thể | ⚠️ Cần hỏi |
| **`brief`** | `content` (`schema:126`) = **chữ bóc từ PDF đề bài/hồ sơ khách hàng** | 🔴 **Gần chắc chắn KHÔNG** |

`brief` đáng lo nhất: đề bài khách hàng thường có NDA, ngân sách, thông tin thương mại. Hiện mọi người đăng nhập đều đọc được toàn văn qua `GET /api/library` (field `hasContent`) và tải file gốc qua `/api/library/[id]/file`.

**Đề xuất (Câu hỏi Q2):** thêm `LibraryAsset.projectId String?` — `null` = thư viện chung công ty (hành vi cũ, backward-compatible); có giá trị = chỉ thành viên dự án đó thấy. Mặc định `material`/`furniture` để `null`, `brief` bắt buộc gắn project. **Nhưng đây là quyết định nghiệp vụ, chờ chủ dự án.**

### 4.4 🟡 Share link public

`app/api/share/[token]/route.ts` cố ý public (`:4` — *"khách xem flow read-only qua share token, không cần đăng nhập"*). Đây là thiết kế hợp lý. Ba thiếu sót:

1. Không có hạn dùng — token sống mãi tới khi ai đó xoá tay
2. Không log ai đã xem
3. Rò qua dashboard (§4.2) — **đây mới là lỗ thật**, bản thân cơ chế share không sai

**Đề xuất:** thêm `Flow.shareExpiresAt DateTime?` + `shareRevokedAt DateTime?` (optional → không phá gì). Ưu tiên P2 — vá §4.2 trước là đã bịt đường rò chính.

### 4.5 🟠 `/api/cursors` — presence giả danh được

`:35-45` không auth, `userId`/`name`/`color` lấy thẳng từ body. Bất kỳ ai POST được là hiện con trỏ mang tên người khác trên canvas người khác. Dữ liệu chỉ trong RAM, không bền vững — nên tác hại giới hạn ở phiền nhiễu + suy đoán *ai đang làm dự án nào*. **Sửa rẻ:** dùng `user.id` từ session, bỏ qua `userId` client gửi.

### 4.6 🟢 Những chỗ ĐANG ĐÚNG — không đụng vào

- `app/api/flows/[id]/route.ts:9-10` — check chủ sở hữu chuẩn
- `app/api/library/[id]/route.ts:13` — owner-or-admin
- `app/api/credits/route.ts` — mọi query scope `user.id`; `:20-21` `updateMany` với `credits: {gte: amt}` là chống race đúng cách
- `lib/server/auth.ts:20-45` — cách ly cookie theo worktree, đã cứu sự cố thật

---

## 5. CHAT NHÓM (Yêu cầu #2)

### 5.1 Thiết kế

Thêm **một** field: `ChatMessage.projectId String?` (§2.3). Ngữ nghĩa:

| `projectId` | Kênh | Ai thấy |
|---|---|---|
| `null` | Kênh chung công ty (đúng hành vi hôm nay) | Mọi người đăng nhập |
| `<id>` | Bong bóng nhóm của dự án | Chỉ `ProjectMember` của dự án đó |

Toàn bộ tin nhắn cũ có `projectId=null` → vào kênh chung, **không mất tin nào**. Đây là lý do chọn nullable thay vì bắt buộc.

```ts
// app/api/chat/route.ts — GET (MẪU)
const projectId = new URL(req.url).searchParams.get('projectId');
if (projectId) await assertProjectAccess(user.id, projectId, 'viewer');
const messages = await prisma.chatMessage.findMany({
  where: { projectId: projectId ?? null, ...(after && { createdAt: { gt: new Date(after) } }) },
  orderBy: { createdAt: 'asc' }, take: 200,
  include: { user: { select: { name: true, id: true } } },
});
```

⚠️ **Bẫy cần tránh:** `where: { projectId }` với `projectId === undefined` thì Prisma **bỏ qua điều kiện** và trả về **toàn bộ tin nhắn mọi dự án**. Phải viết `projectId ?? null` tường minh. Đây đúng là loại lỗi hay lọt — cần 1 test riêng cho nó.

UI: `components/ChatPanel.tsx` thêm bộ chọn kênh (Chung · từng dự án). Đơn giản nhất là dropdown, chưa cần sidebar kiểu Slack.

### 5.2 Giữ polling 3s hay đổi?

**Khuyến nghị: GIỮ polling 3s cho đợt này.** Ba lý do:

1. Nó đang chạy tốt và comment tại chỗ (`ChatPanel.tsx:27`) ghi rõ chủ ý: *"LAN nội bộ là đủ mượt; realtime WebSocket để dành bản cloud"*.
2. Thêm `projectId` **không làm polling tệ hơn** — thực ra nhẹ hơn, vì mỗi lần fetch ít tin hơn.
3. Đổi sang real-time bây giờ là gộp hai việc rủi ro (phân quyền + hạ tầng transport) vào một đợt. Nếu hỏng thì không biết hỏng vì cái nào.

**Điểm nối cho wave real-time Presenting (chỉ nêu, KHÔNG thiết kế lấn):**

Việc cần làm **bây giờ** để wave sau không phải làm lại:

- **Chat là consumer, không phải owner của transport.** Đặt logic fetch sau một hook `useChannel(projectId)` — hôm nay bên trong là `setTimeout`, mai đổi ruột thành SSE/WebSocket mà `ChatPanel` không phải sửa.
- **`assertProjectAccess` là cửa chung.** Khi có WebSocket, handshake gọi đúng helper này — không viết logic quyền lần hai. Đây chính là chỗ "không làm hai lần" mà chủ dự án yêu cầu.

`STATUS.md:15` đã phân định: **CAD + Rendering = bất đồng bộ (comment/ghim kiểu Miro)** · **Presenting = real-time nhiều người (cần CRDT/Yjs)**. Chat nhóm ở đây thuộc nhóm bất đồng bộ — polling đúng công cụ. **Không đụng phần Presenting.**

---

## 6. KANBAN TRONG GALLERY (Yêu cầu #3)

### 6.1 Cột đến từ đâu — đừng tạo bảng `Column`

Câu hỏi §5 của brief: *"có nên tái dùng `Project.stage`/`phase`?"* — như §1.2 đã chứng minh, **không có gì để tái dùng**, phải thêm `Project.currentStage`. Nhưng một khi đã thêm nó (cho GATE, việc bắt buộc), thì **kanban gần như miễn phí**: cột chính là `currentStage`.

| | **Cột = `Project.currentStage`** ✅ | Bảng `KanbanColumn` + `KanbanCard` riêng |
|---|---|---|
| Bảng thêm | 0 (dùng field đã cần cho GATE) | 2 |
| Đồng bộ với 3 chặng | Tự động — cùng một field | Phải sync 2 chiều, chắc chắn lệch |
| Kéo thẻ = | Đổi chặng dự án = **kích hoạt GATE** | Chỉ di chuyển thẻ, vô nghĩa nghiệp vụ |
| Cột tuỳ ý | ❌ Cố định 3 cột | ✅ |

**Chọn cột = `currentStage`.** Ba cột **Drafting CAD · Rendering · Presenting** — trùng đúng 3 chặng sản phẩm (`STATUS.md:4`) và 3 trạm dây chuyền tiếp sức (`BIGPICTURE:30`). Board không phải là view phụ trang trí, nó **chính là** trạng thái dây chuyền.

### 6.2 Mô hình tối thiểu

Thứ tự thẻ trong cột — hai lựa chọn:

- **Không lưu**, sắp theo `updatedAt desc` → **0 field, 0 công.** Khuyến nghị cho v1.
- Lưu `Project.sortOrder Float @default(0)` → kéo thả tuỳ ý; dùng float để chèn giữa 2 thẻ không phải đánh số lại cả cột.

Không có `Card` — **thẻ chính là `Project`**. Không có `Column` — cột là giá trị của `currentStage`.

### 6.3 Kéo thẻ = GATE

Đây là chỗ kanban trả lại giá trị cho kiến trúc thay vì chỉ làm đẹp:

```ts
// Kéo thẻ concept → render (MẪU)
// 1. assertProjectAccess(userId, projectId, minRole) — chỉ chủ trạm hiện tại được đẩy đi
// 2. Đóng băng: prisma.flowVersion.create() cho mọi flow của project
//    (FlowVersion đã có sẵn — schema:82-90, không cần bảng mới)
// 3. project.update({ currentStage: 'render', stageLocked: true })
// 4. UI chặng cũ chuyển read-only cho vai cũ; PRO_ONLY_TOOLS mở cho drafter
```

`BIGPICTURE:33-35` yêu cầu *"bàn giao qua GATE: đóng băng snapshot version"* — `FlowVersion` (`schema:82-90`) đã có sẵn cơ chế snapshot đúng như vậy. Không cần bảng mới. Đây là lý do làm phân quyền + GATE + kanban chung một nền móng: chúng là **cùng một dữ liệu**.

### 6.4 ⚠️ Cảnh báo phạm vi — ĐỪNG làm thành Trello

Ranh giới rõ ràng cho v1:

| ✅ Làm | ❌ KHÔNG làm |
|---|---|
| 3 cột cố định = 3 chặng | Cột tuỳ chỉnh, thêm/xoá cột |
| Thẻ = project (tên, khách, avatar thành viên) | Sub-task, checklist trong thẻ |
| Kéo thẻ = chuyển chặng (qua GATE) | Nhãn màu, độ ưu tiên, story point |
| Lọc "dự án của tôi" | Deadline, lịch, biểu đồ burndown |
| Nút "Dự án mới" | Automation, quy tắc tự động |

Nếu thấy mình đang viết `KanbanColumn.color` thì đã đi quá xa.

### 6.5 "Tạo dự án mới"

`app/api/flows/route.ts:57-60` đã tạo được `Project`. Cần bổ sung **duy nhất một việc**: tạo `ProjectMember{role:'owner'}` cùng transaction. Đây là phần rẻ nhất của cả đợt — nhưng nếu quên thì người tạo dự án **không thấy chính dự án mình vừa tạo**.

---

## 7. ƯỚC LƯỢNG CÔNG & THỨ TỰ TRIỂN KHAI

### 7.1 Thứ tự an toàn — vì sao đúng thứ tự này

Nguyên tắc: **vá lỗ rò trước (rẻ, không phá gì) → dựng nền dữ liệu → bật lọc sau cùng.** Bật lọc quyền trước khi backfill member = mọi người mất sạch dự án.

| # | Việc | Công | Rủi ro dữ liệu | Chặn ai |
|---|---|---|---|---|
| **0** | **Backup `prisma/dev.db`** | 5 phút | — | Tất cả |
| **1** | Vá P0 rò rỉ: `/api/comments` auth · bỏ `shareToken` khỏi dashboard · `/api/cursors` dùng session | 0.5 ngày | **Không** — chỉ bớt dữ liệu trả về | Không chặn ai |
| **2** | Schema additive (`ProjectMember`, `currentStage`, `stageLocked`, `ChatMessage.projectId`) qua **`db push`** | 0.5 ngày | Thấp — toàn field mới/optional | Chặn 3-7 |
| **3** | Chạy `backfill-project-members.ts` + verify số row khớp | 0.5 ngày | **CAO — điểm nguy hiểm nhất.** Verify trước khi sang bước 4 | Chặn 4 |
| **4** | `lib/server/access.ts` + test unit + test quét route | 1 ngày | Không — code mới, chưa ai gọi | Chặn 5-7 |
| **5** | **Bật lọc**: `flows` GET/POST, `flows/[id]`, `dashboard` | 1.5 ngày | **CAO** — sai là mất quyền truy cập | — |
| **6** | Chat nhóm (`projectId` + UI chọn kênh) | 1 ngày | Thấp — tin cũ `null` | — |
| **7** | Kanban gallery (3 cột từ `currentStage`, kéo thả) | 1.5 ngày | Thấp | — |
| **8** | GATE thật (snapshot `FlowVersion` + `stageLocked` + `PRO_ONLY_TOOLS` theo role) | 2 ngày | Trung bình | — |
| **9** | Share link hết hạn/thu hồi (P2) | 0.5 ngày | Thấp | — |

**Tổng: ~9 ngày công.** Bước 1-5 (~4 ngày) là phần bắt buộc phải liền mạch — **không dừng giữa chừng ở bước 3 hoặc 5**, vì đó là lúc DB ở trạng thái nửa vời.

### 7.2 Ba luật an toàn khi thực thi

1. **`prisma db push`, KHÔNG `migrate reset`** — đang có drift `IntegrationAccount` chưa apply. `reset` = xoá sạch dữ liệu thật.
2. **Backup trước bước 2 và bước 3.** `cp prisma/dev.db prisma/dev.db.bak-<ngày>`.
3. **Verify qua `127.0.0.1:<port>` + DB riêng của worktree**, không bao giờ `localhost` (`STATUS.md:36` — luật máu). Bước 5 phải test bằng **2 tài khoản test riêng**, không dùng tài khoản thật của Hoà.

---

## 8. CÂU HỎI CẦN CHỦ DỰ ÁN QUYẾT

| # | Câu hỏi | Khuyến nghị |
|---|---|---|
| **Q1** | `/api/comments` (không auth) — giữ làm công cụ dev, hay nâng thành tính năng góp ý thật? | **Cổng theo env** — `NODE_ENV==='production'` → 404, kèm `getSessionUser()`. Rẻ, bịt lỗ ngay, giữ tiện ích khi dev. Nâng thành tính năng thật thì gộp vào wave "comment/ghim kiểu Miro" ở `STATUS.md:15`, đừng làm rời. |
| **Q2** | Thư viện: `material`/`furniture` dùng chung toàn công ty — **đồng ý**. Còn `brief` (chữ bóc từ PDF đề bài khách hàng) có được để chung không? | **KHÔNG.** Thêm `LibraryAsset.projectId String?`; `null` = chung (mặc định, không phá gì), `brief` bắt buộc gắn project. Đề bài khách thường có NDA/ngân sách. |
| **Q3** | `ref-render`/`slide`/`layout`/`cad` — chung hay theo dự án? | **Chung** cho v1. Chúng là nguyên liệu tham chiếu, và Gu Engine (`schema:121`) hoạt động tốt hơn khi được học trên toàn bộ kho ref. Xem lại nếu có dự án NDA. |
| **Q4** | Dashboard hiện cho mọi người xem email/SĐT/credits/isAdmin toàn team. Giữ hay giới hạn? | **Giới hạn.** Người thường thấy thành viên các dự án mình tham gia; `isAdmin` thấy toàn công ty. (`shareToken` thì bỏ **vô điều kiện** — không phải câu hỏi, là lỗi.) |
| **Q5** | 5 role đề xuất (`owner/crea/drafter/bim/viewer`) có khớp cách chia việc thật của TTT không? Tên gọi có đúng nghề không? | Tôi suy ra từ `BIGPICTURE:30` (CREA → Hoạ viên → Team BIM). **Cần chủ dự án xác nhận** — sai enum ở bước này thì sửa sau rất đắt vì đã có dữ liệu. |
| **Q6** | Một người giữ **nhiều vai trên cùng một dự án** (Hoà vừa CREA vừa duyệt)? | Hiện thiết kế `@@unique([projectId,userId])` = **1 vai / 1 dự án**. Đủ cho hầu hết trường hợp; `owner` vốn đã có toàn quyền. Nếu cần nhiều vai thì bỏ unique — nhưng sẽ phức tạp hơn đáng kể, khuyến nghị **không**. |
| **Q7** | Ai được **mời thành viên** vào dự án? | Chỉ `owner` + `isAdmin`. Đơn giản, ít đường sai. |
| **Q8** | GATE có cho **quay ngược** (render → concept khi phát hiện sai sót)? | **Có**, nhưng chỉ `owner`, và phải snapshot `FlowVersion` trước. Thực tế thiết kế luôn có việc quay lại; khoá một chiều sẽ khiến người dùng lách bằng cách tạo dự án mới. |
| **Q9** | Flow **không thuộc project nào** (`projectId=null`, `schema:65` cho phép) — xử lý sao? | Giữ luật cũ: chỉ `Flow.userId` thấy. Coi là "nháp cá nhân". Không ép migrate. |
| **Q10** | Thứ tự thẻ kanban — cần kéo thả tuỳ ý, hay `updatedAt desc` là đủ? | **`updatedAt desc`** cho v1 — 0 field, 0 công. Thêm `sortOrder Float` sau nếu thực sự thiếu. |

---

## 9. ĐỐI CHIẾU VỚI YÊU CẦU GỐC

| Yêu cầu chủ dự án | Trả lời ở |
|---|---|
| #1 "chỉ thấy dự án mình làm, không tràn lan" | §2 (`ProjectMember`) + §3.3 (chốt chặn server) + §4 (bịt rò) |
| #2 "chat bong bóng theo nhóm" | §5 — thêm `ChatMessage.projectId`, giữ polling 3s |
| #3 "tạo dự án mới + kanban" | §6 — cột = `currentStage`, thẻ = `Project`, kéo = GATE |
| Phục vụ luôn GATE (`BIGPICTURE:33-35`) | §2.2, §6.3 — cùng một nền dữ liệu, không làm hai lần |
| Additive, backward-compatible | §2.3 (mọi field optional/default), §2.5 (script backfill) |

---

*Hết. Không có thay đổi code nào kèm theo tài liệu này.*
