# NGHIÊN CỨU · Chat Full — 3 loại kênh (project · direct · group) + Supabase Realtime — InteriorFlow

> **Trạng thái: ĐỀ XUẤT, CHƯA THỰC THI.** Tài liệu này KHÔNG kèm thay đổi schema/API/UI nào.
> Mọi khối code là **mẫu minh hoạ**. Quyết định user cần đưa trước khi phóng agent build.
>
> Nhánh: `feat/chat-full-research` · Ngày: 2026-07-23 · Verify code bằng đọc file thật (đường dẫn + số dòng), không đoán.
>
> **Bối cảnh (user chốt 23/07 — STATUS.md:53):**
> - Scope FULL = 3 loại kênh (`project` auto theo ProjectMember · `direct` 1-1 · `group` tự tạo kiểu Zalo).
> - (a) Bất cứ member nào tạo group được. (b) Direct cho phép cross-project. (c) Realtime = **Supabase Realtime** (không CRDT/Yjs).

## Mục lục

0. [Tóm tắt cho người bận](#0-tóm-tắt-cho-người-bận)
1. [Hiện trạng đã verify](#1-hiện-trạng-đã-verify)
2. [Data model Prisma đề xuất](#2-data-model-prisma-đề-xuất)
3. [Migration từ `ChatMessage` cũ — không mất tin](#3-migration-từ-chatmessage-cũ--không-mất-tin)
4. [Kiến trúc Supabase Realtime](#4-kiến-trúc-supabase-realtime)
5. [UI/UX — sidebar + composer + thread](#5-uiux--sidebar--composer--thread)
6. [API routes](#6-api-routes)
7. [Rủi ro & giới hạn](#7-rủi-ro--giới-hạn)
8. [Phân kỳ M1/M2/M3](#8-phân-kỳ-m1m2m3)
9. [Câu hỏi cần user quyết trước khi phóng agent build](#9-câu-hỏi-cần-user-quyết-trước-khi-phóng-agent-build)

---

## 0. TÓM TẮT CHO NGƯỜI BẬN

**Kết luận cốt lõi:** phương án hybrid — **giữ SQLite làm source-of-truth cho MỌI meta (User/Project/Flow…), CHỈ đẩy `Message` (bảng chat nóng) sang Supabase Postgres + Realtime**. Sync một chiều write-through (Next.js API là gate ghi duy nhất). Client subscribe Realtime **qua proxy JWT** (không dùng Supabase anon key trực tiếp trong browser).

**Bốn phát hiện phải báo trước:**

| # | Phát hiện | Mức |
|---|---|---|
| 1 | 🔴 **`ProjectMember` VẪN CHƯA BUILD** — verify `grep -n ProjectMember prisma/schema.prisma` chỉ ra **1 dòng comment** (`schema.prisma:245`), không có model thật. RESEARCH-ACCESS-CONTROL đã đề xuất nhưng chưa merge. Kênh `project` phụ thuộc trực tiếp bảng này — **không có nó thì scope FULL không dựng được đầu.** Xem Q1 (§9). |
| 2 | 🟡 **`ChatMessage` cũ có dữ liệu** — model `schema.prisma:168-175` chỉ `{id,userId,text,createdAt}`, không có `projectId`/`channelId`. Toàn app hiện dùng chung 1 kênh. Migration cần preserve toàn bộ vào 1 group "Team chung" — script cụ thể §3. |
| 3 | 🟡 **Polling 3s hiện tại đã hoạt động ổn** (`ChatPanel.tsx:44`, comment tự ghi *"LAN nội bộ là đủ mượt; realtime WebSocket để dành bản cloud"*). Chuyển sang Supabase Realtime = **hạ tầng mới hoàn toàn** (§1.4 confirm 0 package realtime trong `package.json`). Rủi ro cao nếu làm gộp với migration schema — khuyến nghị M1 giữ polling **song song** với Realtime (feature flag), tắt polling sau khi Realtime chứng minh ổn định 1-2 tuần. |
| 4 | 🟡 **Supabase Auth ≠ IF Auth.** IF dùng cookie session JWT nội bộ (jose, `lib/server/auth.ts:20-45`, cách ly theo worktree). Supabase RLS đòi JWT có claim `sub`+`role` theo schema Supabase. Cần **1 endpoint `/api/supabase-token`** mint JWT ký bằng Supabase JWT secret, TTL ngắn (10-15 phút), claim `sub = User.id` + `role = 'authenticated'` + custom claim `channel_ids` (danh sách channel user là member) — để RLS policy tự lọc. Không dùng anon key trong browser. |

**Đề xuất cốt lõi trả lời trực tiếp 3 chốt của user:**
- (a) **Bất cứ member tạo group được** → không cần `isAdmin` gate; ai đăng nhập là POST `/api/channels {kind:'group'}` được. UX: nút "+" trong sidebar, chọn ≥2 user + đặt tên. Ràng buộc: creator tự động thành `owner` role.
- (b) **Direct cross-project** → direct channel không có `projectId`, chỉ `ChannelMember` đúng 2 người. Sidebar "Nhắn riêng" liệt user roster toàn công ty (không giới hạn project).
- (c) **Supabase Realtime** → hybrid SQLite meta + Supabase Message. Subscription theo channel, presence qua Realtime Presence channel (thay `lastSeenAt` polling hiện tại).

---

## 1. HIỆN TRẠNG ĐÃ VERIFY

### 1.1 `ChatMessage` cũ — phẳng, chung 1 kênh

`prisma/schema.prisma:168-175`:

```prisma
model ChatMessage {
  id        String   @id @default(cuid())
  userId    String
  text      String
  createdAt DateTime @default(now())
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Không `projectId`, không `channelId`, không thread, không attachment, không reaction. Đúng như RESEARCH-ACCESS-CONTROL §1.1 đã verify: *"toàn app dùng chung 1 danh sách"*. Cần bảo tồn khi migration (§3).

### 1.2 API `/api/chat/route.ts` — đơn giản, có auth

Đọc toàn file (40 dòng):
- **GET** (`:6-30`) — `getSessionUser()` chặn đầu (khớp bài học P0 dự án); load `chatMessage.findMany` không filter theo user/project (kênh chung). Trả kèm `online` = user có `lastSeenAt > now-45s` (`:16-19`) — cơ chế presence hiện tại.
- **POST** (`:32-40`) — tương tự, tạo message gắn `userId` từ session.

**Không có** DELETE/PATCH message, không edit, không reply. Đây là "chat tối giản".

### 1.3 `ChatPanel.tsx` — polling 3s, panel phải

Đọc toàn file (162 dòng):
- Polling `setTimeout(poll, 3000)` (`:44`) — comment tự ghi rõ chủ ý.
- Cursor tăng dần theo `after=<createdAt>` (`:33`) — chỉ fetch tin mới.
- Presence bar (`:93-104`) hiện online user (green dot 1.5px).
- Bubble: my/others 2 style, `rounded-br-sm`/`rounded-bl-sm` — kiểu iMessage.
- **Không có** channel selector, không dropdown chọn project, không sidebar. 1 kênh duy nhất.

### 1.4 Hạ tầng — 0 realtime package

`package.json` **không có** `@supabase/supabase-js`, `socket.io`, `ws`, `yjs`, `partykit`, `liveblocks`. Stack: Next.js 14.2.35 App Router + Prisma + SQLite. Confirm khớp RESEARCH-TEAM-COLLABORATION §1.4.

### 1.5 `ProjectMember` — CHƯA build

`grep -n "ProjectMember\|projectMember" prisma/schema.prisma` = **1 hit duy nhất** ở `schema.prisma:245` — chỉ là **comment** trong `LarkUserMap` (*"ProjectMember riêng, xem RESEARCH-ACCESS-CONTROL.md"*), không phải model.

→ **Kênh `project` (auto theo ProjectMember) không dựng được nếu chưa có bảng này.** Đây là phụ thuộc cứng. Q1 §9.

### 1.6 IntegrationAccount / oauth-core — pattern tham khảo

`lib/integrations/` có `crypto.ts` (AES-256-GCM), `oauth-core.ts`, `providers/`, `registry.ts`. `IntegrationAccount` (`schema.prisma:41-56`) lưu token OAuth đã mã hoá, unique `[userId, provider]`. **Pattern áp dụng được cho Supabase**: Supabase JWT secret + service role key lưu ENV (không lưu DB); JWT mint mỗi request, không cần table riêng. Không cần bảng `SupabaseSession`.

### 1.7 Vitals chat — KHÁC, không đụng

`app/api/ai-assist-chat/*` (Vitals trợ lý AI 1-1 người-với-máy) và `components/*Vitals*` là **luồng tách biệt hoàn toàn**: 1 user ↔ 1 AI backend NVIDIA/Ollama, không multi-user, không cần realtime broadcast. Tài liệu này **không đụng** Vitals stack.

---

## 2. DATA MODEL PRISMA ĐỀ XUẤT

### 2.1 Nguyên tắc

- **Additive**: `ChatMessage` cũ giữ nguyên 1 thời gian ngắn (đọc-only sau migration), xoá ở M2 sau khi verify đủ.
- Model mới **KHÔNG** thay `ChatMessage`; đặt tên khác (`Message` + `Channel` + `ChannelMember`).
- `Message` có 2 nơi lưu: **Prisma (SQLite)** cho meta+backup + **Supabase Postgres** cho realtime. Write-through: mọi POST đi qua Next API → ghi Supabase → sync mirror về SQLite (async, best-effort). Xem §4.3.

### 2.2 Schema MẪU

```prisma
// ══ MỚI ══ Kênh chat: 3 loại (project|direct|group).
model Channel {
  id         String   @id @default(cuid())
  kind       String   // 'project' | 'direct' | 'group'
  name       String?  // group đặt tên tay; project=name của Project; direct=null (UI render tên đối phương)
  projectId  String?  // BẮT BUỘC nếu kind='project'; null cho direct/group. Enforce ở tầng code.
  ownerId    String   // creator (group/direct); với project = User.id đầu tiên tạo project
  avatarUrl  String?  // group avatar tuỳ chọn
  archived   Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  project  Project?         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  owner    User             @relation("ChannelOwner", fields: [ownerId], references: [id], onDelete: Restrict)
  members  ChannelMember[]
  messages Message[]

  @@unique([kind, projectId])  // 1 project chỉ 1 channel kind='project'; direct/group projectId=null nên không đụng
  @@index([kind])
  @@index([projectId])
}

model ChannelMember {
  channelId  String
  userId     String
  role       String   @default("member") // 'owner' | 'admin' | 'member' (group only; project/direct đều 'member')
  joinedAt   DateTime @default(now())
  lastReadAt DateTime?              // dùng tính unread; null = chưa đọc gì
  muted      Boolean  @default(false)

  channel Channel @relation(fields: [channelId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([channelId, userId])
  @@index([userId])              // truy vấn nóng: "channel của tôi"
}

model Message {
  id          String   @id @default(cuid())
  channelId   String
  userId      String
  text        String
  attachments String   @default("[]")  // JSON: Array<{url,mime,name,size,w?,h?}>
  replyToId   String?                  // thread nhẹ: reply 1 tầng
  createdAt   DateTime @default(now())
  editedAt    DateTime?
  deletedAt   DateTime?                // soft delete (giữ trong DB, ẩn UI)

  channel Channel  @relation(fields: [channelId], references: [id], onDelete: Cascade)
  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  replyTo Message? @relation("MessageReply", fields: [replyToId], references: [id], onDelete: SetNull)
  replies Message[] @relation("MessageReply")
  reactions MessageReaction[]

  @@index([channelId, createdAt])       // pagination "before <ts>"
  @@index([userId])
}

model MessageReaction {
  messageId String
  userId    String
  emoji     String   // ':heart:' | ':thumbsup:' … normalized string
  createdAt DateTime @default(now())

  message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([messageId, userId, emoji])
}
```

### 2.3 Ràng buộc bổ sung (enforce ở code, không enum SQLite)

Cùng lý do RESEARCH-ACCESS-CONTROL §2.3: SQLite không có `enum`. Const TS:

```ts
export const CHANNEL_KINDS = ['project', 'direct', 'group'] as const;
export type ChannelKind = (typeof CHANNEL_KINDS)[number];

export const MEMBER_ROLES = ['owner', 'admin', 'member'] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];
```

**Business rules (kiểm ở service layer, không DB constraint):**
- `kind='project'`: `projectId` NOT NULL; members = `ProjectMember` (auto-sync, xem §4.4); không cho add/remove member tay (đi qua ProjectMember).
- `kind='direct'`: chính xác 2 members, `projectId=null`. Trước khi tạo, tìm channel direct đã tồn tại giữa 2 user này (dedup) — không cho tạo trùng.
- `kind='group'`: ≥2 members (creator + ≥1), `projectId=null`. Creator = `owner`; owner có thể promote member → admin.
- `MessageReaction.emoji`: whitelist ~20 emoji thông dụng (like/heart/laugh/…), reject arbitrary Unicode để tránh spam.

### 2.4 Vì sao KHÔNG dùng enum Postgres ngay bây giờ

Dù Supabase = Postgres và **có** enum, `Message` bảng Supabase-side vẫn phải giữ `channelId` là **String** (cuid) — không phải Postgres native enum — vì `Channel` sống ở SQLite (§4). Enum chỉ để cho các field nội bộ Supabase (không có ở kiến trúc hybrid). Khi migrate hoàn toàn sang Postgres (Sprint 4 target, `STATUS.md:23`), lúc đó cân nhắc enum.

---

## 3. MIGRATION TỪ `ChatMessage` CŨ — KHÔNG MẤT TIN

### 3.1 Kế hoạch từng bước

1. **Backup**: `cp prisma/dev.db prisma/dev.db.bak-chat-full-<date>`.
2. **`prisma db push`** (KHÔNG `migrate reset`) áp schema mới. Rủi ro thấp — toàn field mới, `ChatMessage` cũ không đụng.
3. **Chạy script backfill** (dưới đây) — tạo 1 group "Team chung" + gộp mọi user hiện có làm member + chuyển toàn bộ `ChatMessage` → `Message`.
4. **Verify count**: `SELECT COUNT(*) FROM ChatMessage` = `SELECT COUNT(*) FROM Message WHERE channelId = <team-chung-id>`.
5. **Deploy code mới** (đọc `Message`, không đọc `ChatMessage` nữa).
6. **Chờ 1-2 tuần**, không có phản ánh mất tin → M2 xoá `ChatMessage`.

### 3.2 Script backfill MẪU

```ts
// scripts/backfill-chat-to-channels.ts (MẪU — chạy 1 lần, idempotent)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Bước 1: chọn owner cho group "Team chung" — admin đầu tiên, fallback User đầu tiên
  const admin = await prisma.user.findFirst({ where: { isAdmin: true }, orderBy: { createdAt: 'asc' } });
  const fallback = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  const ownerId = admin?.id ?? fallback?.id;
  if (!ownerId) { console.log('Không có user nào, bỏ qua migration.'); return; }

  // Bước 2: upsert channel "Team chung" (idempotent — chạy lại không tạo trùng)
  const teamChung = await prisma.channel.upsert({
    where: { id: 'chn-team-chung-legacy' },
    update: {},
    create: {
      id: 'chn-team-chung-legacy',
      kind: 'group',
      name: 'Team chung · Legacy',
      ownerId,
    },
  });

  // Bước 3: mọi user hiện có → ChannelMember (idempotent qua upsert composite key)
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) {
    await prisma.channelMember.upsert({
      where: { channelId_userId: { channelId: teamChung.id, userId: u.id } },
      update: {},
      create: { channelId: teamChung.id, userId: u.id, role: u.id === ownerId ? 'owner' : 'member' },
    });
  }

  // Bước 4: chuyển tin nhắn — dùng cùng id để không mất reference (tuỳ chọn) hoặc mint id mới
  // Idempotent: bỏ qua nếu Message.id đã tồn tại.
  const oldMsgs = await prisma.chatMessage.findMany({ orderBy: { createdAt: 'asc' } });
  let migrated = 0;
  for (const om of oldMsgs) {
    const exists = await prisma.message.findUnique({ where: { id: om.id } });
    if (exists) continue;
    await prisma.message.create({
      data: {
        id: om.id,          // giữ nguyên id — nếu cần rollback ChatMessage → so sánh dễ
        channelId: teamChung.id,
        userId: om.userId,
        text: om.text,
        createdAt: om.createdAt,
      },
    });
    migrated++;
  }

  // Bước 5: (SAU khi có Supabase) — push toàn bộ Message vào Supabase Postgres
  // (Không làm ở script Prisma — làm ở script sync riêng, xem §4.3)

  console.log(`✔ team=${teamChung.id} · ${users.length} member · ${migrated}/${oldMsgs.length} message`);
}
main().finally(() => prisma.$disconnect());
```

### 3.3 Rollback plan

- **Nếu migration hỏng ở bước 3**: rollback DB bằng `cp prisma/dev.db.bak-* prisma/dev.db`. Không sửa schema (schema mới additive, không phá gì).
- **Nếu deploy code mới hỏng**: revert commit code (schema giữ nguyên); `ChatMessage` vẫn còn nguyên → app quay về đọc kênh cũ vẫn hoạt động.
- **Nếu Supabase mất kết nối**: xem §4.6.

---

## 4. KIẾN TRÚC SUPABASE REALTIME

### 4.1 Setup Supabase

**Project setup** (user tự tạo — xem Q2 §9):
1. Vào [supabase.com](https://supabase.com), tạo project mới. Free tier: **200 concurrent connections, 2GB DB, 1GB file storage, 5GB egress/tháng**.
2. Chọn region: **Southeast Asia (Singapore)** — gần VN nhất, latency ~30-50ms từ HCM/HN.
3. Copy 4 giá trị vào `.env.local` IF:
   - `NEXT_PUBLIC_SUPABASE_URL` (public — client dùng để connect)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public — **CHỈ để init client**, không đủ quyền đọc data thật khi RLS bật)
   - `SUPABASE_SERVICE_ROLE_KEY` (server-side, tuyệt đối không expose)
   - `SUPABASE_JWT_SECRET` (server-side, để mint JWT §4.5)

**Ước lượng cho ~50 người TTT dùng thử:** 50 user × 1-2 subscription/user (1 channel active) = ~50-100 concurrent connection → **thoả free tier**. Message payload trung bình 200 byte × 500 msg/ngày × 30 ngày = ~3MB/tháng → không sát DB limit. Xem §7 cho ngưỡng vượt.

### 4.2 Bảng Supabase-side

Tạo trong Supabase SQL Editor:

```sql
create table public.message (
  id          text primary key,
  channel_id  text not null,
  user_id     text not null,
  text        text not null,
  attachments jsonb not null default '[]',
  reply_to_id text,
  created_at  timestamptz not null default now(),
  edited_at   timestamptz,
  deleted_at  timestamptz
);
create index message_channel_created_idx on public.message (channel_id, created_at desc);

-- Cache mỏng: user có phải member channel không (dùng cho RLS). Sync từ SQLite qua write-through.
create table public.channel_member (
  channel_id text not null,
  user_id    text not null,
  primary key (channel_id, user_id)
);
create index channel_member_user_idx on public.channel_member (user_id);

-- Bật Realtime cho bảng message
alter publication supabase_realtime add table public.message;
```

**Chú ý**: bảng `channel_member` bên Supabase **là cache mỏng** — chỉ chứa `(channel_id, user_id)` để RLS check. Nguồn chân lý vẫn là SQLite. Khi user vào/rời channel, Next API vừa update SQLite vừa upsert/delete row Supabase.

### 4.3 Hybrid write-through — mọi POST đi qua Next API

**Nguyên tắc:** browser **không** ghi trực tiếp Supabase (dù có quyền qua RLS). Mọi POST message → gọi `POST /api/channels/[id]/messages` → server:
1. Validate `assertChannelMember(user.id, channelId)` (helper mới, giống `assertProjectAccess` của RESEARCH-ACCESS-CONTROL).
2. `prisma.message.create({...})` — SQLite là source-of-truth.
3. `supabase.from('message').insert({...})` — Supabase Realtime auto-broadcast.
4. Nếu bước 3 fail (network/rate limit): log warning, không rollback SQLite. Có 1 job background retry mỗi 30s pending queue. §4.6.
5. Trả response 200 cho client.

Client **KHÔNG cần** listen Realtime trên message mình vừa gửi (đã có response). Chỉ subscribe để nhận message của **người khác**.

**Vì sao không để client ghi trực tiếp Supabase:**
- Rate limit dễ kiểm soát ở Next API.
- Business rules (whitelist emoji, sanitize text, virus scan attachment sau này) tập trung 1 chỗ.
- Backup vào SQLite đảm bảo không mất tin nếu Supabase down (§4.6).
- Analytics/audit log dễ.

### 4.4 Sync channel membership 2 chiều

- **Project channel (kind='project')**: khi `ProjectMember` thêm/xoá (route mới cần build, sau khi RESEARCH-ACCESS-CONTROL merge) → trigger cùng transaction: upsert/delete `ChannelMember` cho channel `kind='project'` của project đó + upsert/delete `channel_member` bên Supabase.
- **Direct channel**: tạo 1 lần, 2 member cố định, không thay đổi.
- **Group channel**: `POST/DELETE /api/channels/[id]/members` → cùng pattern.

**Ẩn danh cho user rời công ty**: `User.deletedAt` hiện không có; chưa xử lý ở đây. Xem "Nợ kỹ thuật" cuối §7.

### 4.5 Auth: mint Supabase JWT từ IF session

**Endpoint mới `/api/supabase-token` (MẪU):**

```ts
// app/api/supabase-token/route.ts
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!);

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Lấy danh sách channel user là member — dùng để RLS lọc
  const memberships = await prisma.channelMember.findMany({
    where: { userId: user.id },
    select: { channelId: true },
  });
  const channelIds = memberships.map((m) => m.channelId);

  const jwt = await new SignJWT({
    role: 'authenticated',
    sub: user.id,
    channel_ids: channelIds,  // custom claim dùng ở RLS
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')   // TTL ngắn, client refetch khi hết hạn
    .sign(JWT_SECRET);

  return NextResponse.json({ token: jwt, expiresIn: 900 });
}
```

Client dùng token này gọi `supabase.realtime.setAuth(token)` — Supabase Realtime authenticate + RLS tự kích hoạt.

**Refresh:** client hook `useSupabaseToken()` — mount 1 lần, setTimeout refresh 12 phút (trước hết hạn 3 phút để tránh gap).

### 4.6 RLS policies

```sql
-- Bật RLS
alter table public.message enable row level security;
alter table public.channel_member enable row level security;

-- Policy 1: đọc message chỉ khi user là member của channel
create policy "member_can_read_messages"
  on public.message for select
  using (
    exists (
      select 1 from public.channel_member
      where channel_id = message.channel_id
        and user_id = auth.uid()
    )
  );

-- Policy 2: KHÔNG cho INSERT/UPDATE/DELETE từ client (chỉ service role qua Next API)
-- (Không tạo policy = deny mặc định khi RLS bật)

-- Policy 3: đọc channel_member chỉ dòng của chính mình
create policy "self_can_read_membership"
  on public.channel_member for select
  using (user_id = auth.uid());
```

**Bẫy dễ mắc**: nếu quên `enable row level security`, tất cả anon key hold được là đọc sạch. **Test bắt buộc**: dùng JWT của user A gọi `select * from message where channel_id = <channel-của-B>` — phải trả rỗng.

### 4.7 Client subscription pattern

```ts
// lib/chat/useChannelMessages.ts (MẪU)
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export function useChannelMessages(channelId: string, token: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!token) return;
    supabase.realtime.setAuth(token);

    // 1. Initial fetch qua Next API (đã có auth cookie IF, không cần Supabase)
    fetch(`/api/channels/${channelId}/messages`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages));

    // 2. Subscribe INSERT mới
    const sub = supabase
      .channel(`channel-${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message', filter: `channel_id=eq.${channelId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message]),
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'message', filter: `channel_id=eq.${channelId}` },
        (payload) => setMessages((prev) => prev.map((m) => m.id === payload.new.id ? payload.new as Message : m)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'message', filter: `channel_id=eq.${channelId}` },
        (payload) => setMessages((prev) => prev.filter((m) => m.id !== payload.old.id)))
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [channelId, token]);

  return messages;
}
```

### 4.8 Presence (typing indicator + online)

Supabase Realtime có Presence channel riêng, thay `lastSeenAt` polling hiện tại:

```ts
// components/PresenceIndicator.tsx (MẪU)
const presenceChannel = supabase.channel(`presence-${channelId}`, {
  config: { presence: { key: user.id } },
});

presenceChannel
  .on('presence', { event: 'sync' }, () => {
    const state = presenceChannel.presenceState();
    setOnlineUsers(Object.keys(state));
  })
  .on('presence', { event: 'join' }, ({ newPresences }) => {/* ... */})
  .on('broadcast', { event: 'typing' }, ({ payload }) => setTypingUsers(prev => [...prev, payload.userId]))
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await presenceChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
    }
  });
```

Typing broadcast: `presenceChannel.send({ type: 'broadcast', event: 'typing', payload: { userId } })` — không lưu DB, ephemeral.

### 4.9 Failover: Supabase down

Nếu Supabase mất kết nối:
- **POST**: Next API vẫn ghi SQLite (bước 2 §4.3) → tin không mất. Insert Supabase fail → đẩy vào queue `pending_supabase_sync` (bảng phụ hoặc Redis nhẹ), background job retry.
- **GET/subscription**: client detect `supabase.realtime.getChannels()[0].state === 'CLOSED'` → fallback về polling `/api/channels/[id]/messages?after=<ts>` mỗi 5s. UX: banner nhẹ "Chế độ chậm — kết nối realtime tạm ngắt".
- **Alerting**: cần setup Supabase status webhook → Slack/Vitals sau.

---

## 5. UI/UX — SIDEBAR + COMPOSER + THREAD

### 5.1 Sidebar 3 nhóm

Thay `ChatPanel.tsx` hiện tại (panel phải 288px). Layout mới:

```
┌────────────────────────────────────────────────────┐
│ [🔍 Tìm channel/người...]                         │
├────────────────────────────────────────────────────┤
│ DỰ ÁN · Projects                                   │
│  # Sungroup Beach Club           2   ← unread    │
│  # HVH Office                                     │
│  # Detech Complex                                 │
├────────────────────────────────────────────────────┤
│ NHẮN RIÊNG · Direct                    [+]       │
│  @ Hoà                          1   ← unread    │
│  @ Thông                                          │
├────────────────────────────────────────────────────┤
│ NHÓM · Groups                          [+]       │
│  ⚙ BIM Core Team                                  │
│  ⚙ Present Sprint                                 │
└────────────────────────────────────────────────────┘
```

- **Badge unread**: `messages.count where createdAt > lastReadAt` (tính server-side qua `GET /api/channels`).
- **Nút "+"** trên nhóm Direct/Group (không có ở Project — auto).
  - Direct: modal chọn 1 user (search combobox toàn công ty roster).
  - Group: modal chọn N user + input tên + upload avatar tuỳ chọn.
- **Sắp xếp**: mỗi nhóm sort theo `lastMessageAt desc` (channel có tin mới nhất lên đầu).

### 5.2 Main pane

3 phần:
- **Header** channel: tên + avatar + "N thành viên" (click mở panel members).
- **Timeline** messages (giữ style bubble iMessage hiện có — quen thuộc): my=right cam, others=left greige. Group by day header.
- **Composer** dưới cùng: textarea + nút attach (📎) + emoji picker + Send. Enter gửi, Shift+Enter xuống dòng (giữ pattern `ChatPanel.tsx:141-146`).

### 5.3 Attachments

**Vị trí lưu**: `uploads/chat/{channelId}/{messageId}-{filename}` (theo pattern `NotebookSource.filePath`). **Không** dùng Supabase Storage cho MVP — giữ file trên server IF, đơn giản hoá backup.
- Upload: `POST /api/channels/[id]/upload` (multipart), trả URL, client set vào `attachments[]` khi POST message.
- Preview: image inline (max 400px), file khác → tên + kích thước + icon mime + download.
- **Giới hạn MVP**: 10MB/file, 5 file/message. Không virus scan (rủi ro — chỉ dùng nội bộ TTT).

### 5.4 Reply & reactions

- **Reply**: hover message → nút "↩ Reply" → composer hiện quote box; POST kèm `replyToId`. Render: message có `replyTo` hiện quote nhỏ phía trên bubble.
- **Reactions**: hover → nút "😀 +" → popover 20 emoji whitelist. Click emoji đã có → toggle. Render dưới bubble: `❤️ 3 · 👍 1`.
- **Thread panel** (optional MVP): click count reply → mở panel phải, filter `replyToId=<id>`. Có thể defer sang M2.

### 5.5 @Mention (M2, không MVP)

Composer `@` trigger autocomplete user; render `@Hoà` chip; parse text kèm mention list vào `attachments.mentions[]`. Notification khi được mention → Vitals bell + browser Push (M3).

### 5.6 Notification (M2/M3)

- **In-app**: badge sidebar realtime; toast khi message mới ở channel khác đang active.
- **Web Push** (M3): `Notification.requestPermission()` khi user click cho phép; service worker + Supabase webhook → push endpoint. Chỉ khi offline (detect qua Presence).
- **Email** (M3): digest daily nếu unread > 5 và user không online 24h.

### 5.7 Vị trí trong app

Thay entry hiện tại (MessageCircle icon trong StudioBar → mở panel phải 288px) bằng: **click MessageCircle → route `/chat`** (fullscreen page có sidebar+main). Panel phải cũ giữ 1 thời gian ngắn cho backward-compat rồi gỡ. Xem Q5 §9 (fullscreen vs overlay).

---

## 6. API ROUTES

Tất cả routes PHẢI có `getSessionUser()` dòng đầu (bài học P0 — RESEARCH-ACCESS-CONTROL §3).

| Route | Method | Mô tả | Auth |
|---|---|---|---|
| `/api/channels` | GET | List channels user là member (kèm unread count, lastMessage preview) | `getSessionUser` |
| `/api/channels` | POST | Tạo direct/group. Body: `{kind, memberIds[], name?, avatarUrl?}`. Direct dedup existing. | `getSessionUser` |
| `/api/channels/[id]` | GET | Meta channel + members list | `getSessionUser` + `assertChannelMember` |
| `/api/channels/[id]` | PATCH | Đổi name/avatar (group only, owner/admin) | + role check |
| `/api/channels/[id]` | DELETE | Xoá group (owner only) hoặc leave direct | + role check |
| `/api/channels/[id]/messages` | GET | Pagination `?before=<msgId>&limit=50`, mặc định 50 msg mới nhất | + member check |
| `/api/channels/[id]/messages` | POST | Gửi message. Ghi SQLite + Supabase (§4.3). Body: `{text, attachments?, replyToId?}`. | + member check |
| `/api/channels/[id]/messages/[msgId]` | PATCH | Edit (chỉ author, trong 15 phút) | + author check |
| `/api/channels/[id]/messages/[msgId]` | DELETE | Soft delete (author hoặc admin/owner) | + role check |
| `/api/channels/[id]/messages/[msgId]/reactions` | POST | Toggle reaction. Body: `{emoji}`. | + member check |
| `/api/channels/[id]/read` | PATCH | Update `ChannelMember.lastReadAt = now()` | + member check |
| `/api/channels/[id]/members` | POST | Add member (group, owner/admin only) | + role check |
| `/api/channels/[id]/members/[userId]` | DELETE | Remove member hoặc leave (self) | + role check |
| `/api/channels/[id]/upload` | POST | Upload attachment (multipart), trả URL | + member check |
| `/api/supabase-token` | GET | Mint JWT ngắn hạn cho Supabase Realtime (§4.5) | `getSessionUser` |
| `/api/users/roster` | GET | Roster user toàn công ty cho picker direct/group | `getSessionUser` |

**Helper mới cần build** (`lib/server/chat-access.ts`):

```ts
export async function assertChannelMember(userId: string, channelId: string, minRole: MemberRole = 'member') {
  const m = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
  });
  if (!m) throw new AccessError(404, 'Không tìm thấy kênh.');
  if (MEMBER_RANK[m.role as MemberRole] < MEMBER_RANK[minRole]) {
    throw new AccessError(403, 'Không đủ quyền.');
  }
  return m;
}
```

**Test bắt buộc** (theo mẫu `access-coverage.test.ts` của RESEARCH-ACCESS-CONTROL §3.4): walk `app/api/channels`, mọi route.ts phải grep-hit `getSessionUser` và `assertChannelMember`.

---

## 7. RỦI RO & GIỚI HẠN

| # | Rủi ro | Mức | Giảm thiểu |
|---|---|---|---|
| R1 | **`ProjectMember` chưa build** → kênh `project` không dựng được | 🔴 | Q1 §9 — quyết trước: làm RESEARCH-ACCESS-CONTROL trước, hoặc build tạm bảng đơn giản chỉ đủ cho chat |
| R2 | **Supabase free tier hết** khi vượt 200 concurrent hoặc 2GB DB | 🟡 | Ước lượng: 200 concurrent ≈ 150-200 user active đồng thời (mỗi user 1-1.5 sub). TTT hiện ~50 người → còn xa. 2GB DB ≈ 10 triệu message ngắn → nhiều năm mới chạm. Nếu vượt: Pro $25/tháng (500 concurrent, 8GB DB). |
| R3 | **Race condition** SQLite ↔ Supabase (POST fail giữa 2 bước) | 🟠 | Thứ tự: SQLite trước → Supabase sau. Nếu Supabase fail: queue retry (§4.6). Tin luôn còn ở SQLite, không mất. Trùng: `Message.id` là cuid unique → INSERT trùng Supabase reject, safe. |
| R4 | **RLS bypass** nếu ai đó lộ service role key | 🔴 | Service role KEY chỉ trong ENV server; **không bao giờ** trả về client. Nếu lộ → rotate ngay ở Supabase dashboard. Audit log định kỳ. |
| R5 | **JWT secret leak** → giả danh mọi user | 🔴 | ENV only, không log; rotate 6 tháng/lần. Cân nhắc dùng RSA thay HS256 (public key verify) — Supabase support. |
| R6 | **Data residency**: Supabase Singapore = server bên ngoài VN. Message có thể chứa nội dung dự án khách (brief NDA?) | 🟡 | Message TEXT không chứa file/brief (attach lưu server IF, không Supabase). Text có thể nhắc client name nhưng không upload document. Cân nhắc: có khách nào ràng buộc "data phải ở VN"? Q3 §9. |
| R7 | **Encryption at rest**: Supabase encrypt disk mặc định, nhưng không end-to-end | 🟢 | Đủ cho nội bộ. Nếu cần E2E (client-side encrypt bằng key user): mất realtime search + reaction; rewrite lớn. Không MVP. |
| R8 | **Attachment 10MB × 5** giới hạn Supabase Storage free 1GB, nhưng ta không dùng Supabase Storage — dùng disk server IF | 🟢 | Disk IF thoải mái (~100GB+); tự backup định kỳ. Nếu chuyển Vercel Sprint 4 → Vercel serverless không có persistent disk → phải dùng Supabase Storage hoặc S3. Xem Q4 §9. |
| R9 | **Group max members**: không giới hạn hôm nay | 🟡 | Ai tạo được → có nguy cơ "group 50 người ping loạn". Q6 §9 — cap 30? |
| R10 | **Message retention**: giữ mãi mãi hay archive | 🟡 | Free tier 2GB DB đủ nhiều năm. Nhưng thông tin dự án cũ (client cũ NDA) có nên xoá sau X tháng? Q7 §9. |
| R11 | **User rời công ty** → messages còn nguyên tên, membership còn trong ChannelMember | 🟡 | Không có `User.deletedAt`. Nợ kỹ thuật: soft-delete User + `Message.userName` cached vào record khi ghi (denormalize) để không cần join khi user gone. |
| R12 | **Notification storm** khi @all trong group 30 người | 🟡 | Rate limit ở composer: 1 message / 500ms; block @all cho group >10 member (yêu cầu owner enable). |
| R13 | **Migration downtime** khi bước 3 § 3.1 chạy | 🟢 | Backfill idempotent, chạy trong maintenance window <5 phút. |

---

## 8. PHÂN KỲ M1/M2/M3

### M1 — Minimal usable (2-3 tuần)

**Mục tiêu**: 3 loại kênh dựng, gửi/nhận text realtime, migration không mất tin.

- Setup Supabase project + ENV.
- Prisma schema: `Channel`, `ChannelMember`, `Message` (không reaction/reply).
- Migration `ChatMessage` → group "Team chung · Legacy" (§3).
- API core: `GET/POST /api/channels`, `GET/POST /api/channels/[id]/messages`, `PATCH .../read`, `POST .../members`, `/api/supabase-token`, `/api/users/roster`.
- Bảng Supabase-side: `message`, `channel_member`, RLS policies.
- Write-through hybrid + Supabase Realtime subscription.
- UI: `/chat` fullscreen page — sidebar 3 nhóm + main pane + composer text-only + Enter gửi.
- Nút "+" tạo direct (dedup) + tạo group.
- Presence (online users) qua Supabase Realtime Presence.
- **Song song polling**: giữ `ChatPanel.tsx` cũ 1-2 tuần, feature flag `NEXT_PUBLIC_CHAT_V2=1` để switch. Tắt polling sau khi Realtime chứng minh ổn.

**Chưa làm**: attachments, reactions, reply, edit, thread, notification.

### M2 — Rich messaging (1-2 tuần)

- Attachments (upload → server IF disk, giới hạn 10MB × 5).
- Emoji reactions (whitelist 20 emoji).
- Reply 1 tầng (không thread panel).
- Edit message trong 15 phút.
- Soft delete + admin can moderate.
- Typing indicator (Presence broadcast).
- @Mention với autocomplete.
- Badge unread real-time trên StudioBar.

### M3 — Notification & polish (1-2 tuần)

- Web Push notification (offline detect).
- Email digest daily (SendGrid/Resend).
- Thread panel (view all replies of message).
- Admin panel: manage all channels, disable spam user.
- Message search (client-side hoặc Supabase text search).
- Retention policy: archive channel >X months, xoá attachment orphan.

---

## 9. CÂU HỎI CẦN USER QUYẾT TRƯỚC KHI PHÓNG AGENT BUILD

| # | Câu hỏi | Khuyến nghị |
|---|---|---|
| **Q1** | `ProjectMember` chưa build (§1.5). Có 2 lựa chọn: **(A)** làm RESEARCH-ACCESS-CONTROL trước (~4 ngày, dựng nền chung cho quyền dự án), **(B)** build tạm bảng `ProjectMember` đơn giản trong sprint chat này (thô, chỉ đủ cho kênh project, không có role/GATE) — sau này migrate. | **(A)** — không làm hai lần. Access-control là gốc; chat + kanban + gallery đều dựa vào nó. Delay chat 4 ngày để tránh làm hai lần schema. Nếu urgent thì (B), NHƯNG phải commit rõ sẽ migrate lại. |
| **Q2** | Supabase project — user tự tạo hay agent hướng dẫn từng bước? | User tự tạo (5 phút UI). Agent viết sẵn hướng dẫn markdown (setup ENV, region, RLS SQL) — user copy-paste. Không thể tự động (cần thẻ VISA + email verify). |
| **Q3** | Data residency: Supabase Singapore. Có khách hàng TTT nào ràng buộc "dữ liệu phải ở VN" trong hợp đồng NDA không? | Chưa biết. Nếu **có** → không dùng Supabase, cân nhắc tự host Postgres + `pg-listen` hoặc dùng Ably self-hosted. Nếu **không** (khả năng cao vì đây là chat nội bộ team, không phải data khách) → Supabase Singapore OK. Cần user xác nhận. |
| **Q4** | Attachment: lưu server IF disk (MVP đề xuất) hay Supabase Storage? | **Server IF** cho MVP — đơn giản, đã có pattern `uploads/`. Sprint 4 lên Vercel serverless → BẮT BUỘC chuyển Supabase Storage hoặc S3 (Vercel không có persistent disk). Nên architect từ đầu có `lib/storage/` abstraction để switch dễ. |
| **Q5** | UI: `/chat` fullscreen page (mới) hay giữ overlay panel phải 288px cũ + thêm sidebar? | **Fullscreen** cho scope FULL — 3 loại kênh + roster + composer rich sẽ chật panel 288px. Panel cũ chỉ hợp "1 kênh chung". Overlay còn giữ Quick Actions từ StudioBar. |
| **Q6** | Group max members? | Đề xuất **30** cho MVP. Ai tạo group >10 tự động enable rate limit + disable @all. |
| **Q7** | Message retention: giữ mãi hay archive sau X tháng? | Đề xuất **giữ mãi cho MVP** (2GB Supabase đủ nhiều năm). M3 thêm archive: channel không hoạt động >6 tháng → cold storage (JSON export vào server IF, xoá row Supabase). Cần user quyết: có khách hàng nào yêu cầu "xoá sạch sau khi dự án đóng" không? |
| **Q8** | Encryption at-rest E2E — cần không? | **Không** cho nội bộ TTT. Supabase disk-level encryption đủ. Chỉ cần E2E nếu chat với khách hàng bên ngoài (KHÔNG phải use case này). |
| **Q9** | JWT signing: HS256 (đơn giản, 1 secret) hay RS256 (public key)? | **HS256** cho MVP. RS256 cần thêm cơ chế phân phối public key, phức tạp không đáng cho scale này. |
| **Q10** | Migration downtime OK không? Bước 3 §3.1 cần vài phút maintenance. | Đề xuất chạy đêm, thông báo trước. Backfill idempotent nên rerun-safe. |
| **Q11** | Notification: browser push (M3) có cần Apple Push Certificate không (iOS Safari)? | Có, nhưng iOS Safari mới support Web Push từ 16.4+. Nếu team dùng iOS <16.4 → không nhận được. M3 sẽ verify. |
| **Q12** | Vitals AI có nên tích hợp vào chat (summarize channel, draft reply)? | Không MVP. M4+, sau khi chat ổn định. Vitals hiện là 1-1, không multi-user context. |

---

*Hết. Không có thay đổi code nào kèm theo tài liệu này.*
