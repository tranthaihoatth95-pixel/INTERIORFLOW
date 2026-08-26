# ① OBSERVED BACKEND MAP

> **Nguồn:** Phiên A · Architecture Audit — read-only. HEAD `a08378a`.
> Mọi dòng dưới đây **đo được**, có `file:dòng`. Chỗ nào không đo được ghi rõ `KHÔNG CÓ BẰNG CHỨNG`.

---

## 1 · RUNTIME — Electron khởi động thế nào

```
Electron (process chính)
   └─ spawn: process.execPath + node_modules/next/dist/bin/next start <appRoot> -p <port> -H 127.0.0.1
      ELECTRON_RUN_AS_NODE=1 · cwd = app.getPath('userData')
   └─ poll http://127.0.0.1:<port>/ mỗi 400ms, timeout tổng 60s
   └─ BrowserWindow.loadURL(http://127.0.0.1:<port>)
```

| phát hiện | file:dòng | loại | tin cậy |
|---|---|---|---|
| Cổng ưa thích **3777**, dò tăng dần tối đa **50 lần**, bind `127.0.0.1` | `electron/main.js:49,61-81` | OBSERVED | cao |
| **`cwd = userData`**, KHÔNG phải appRoot | `electron/main.js:389` | OBSERVED | cao |
| `.next` đọc từ `appRoot` (`resources/app`, asar TẮT) | `electron/main.js:106-112,384` | OBSERVED | cao |
| `DATABASE_URL = file:<userData>/dev.db` — **ghi đè `.env`** | `electron/main.js:118-130,361` | OBSERVED | cao |
| Trước khi spawn: **snapshot DB** + `prisma db push` **2 lượt**, lượt 2 có `--accept-data-loss`. Fail ⇒ **dừng khởi động** | `electron/main.js:244-345,375-380` | OBSERVED | cao |
| `HOSTNAME=127.0.0.1` — **không bind LAN** | `electron/main.js:366-368` | OBSERVED | cao |
| Poll coi **bất kỳ HTTP status nào** là "đã lên" | `electron/main.js:84-104` | OBSERVED | cao |
| Spawn lỗi ⇒ chỉ `showErrorBox`, **không thử lại** | `electron/main.js:397-399` | OBSERVED | cao |

⇒ **Đây LÀ product backend**, chạy local. Gọi "không có backend" là sai — tôi đã nói sai câu đó trước đây và rút lại.

## 2 · API SURFACE — 77 route

| nhóm | route | THẬT | STUB / degrade |
|---|---|---|---|
| project | 24 | 24 | 0 |
| integration | 12 | 12 | 0 |
| ai/render | 11 | 10 | 1 *(điều kiện)* |
| library/spec | 10 | 10 | 0 |
| auth | 9 | 8 | **1 stub thật** |
| misc | 9 | 8 | 1 *(dev-only)* |
| tasks | 2 | 2 | 0 |

**Chỉ MỘT stub thật:** `auth/apple` — cả hai nhánh trả 503, comment ghi rõ có chủ ý (`app/api/auth/apple/route.ts:14-19`).

Bốn ca **không phải stub nhưng cần biết**:

| route | thực chất | file:dòng |
|---|---|---|
| `render/fbx` | THẬT, **degrade tường minh 501** khi thiếu Blender | `render/fbx/route.ts:28-38` |
| `dev-identity` | dev-only, 404 ở production | `dev-identity/route.ts:24-36` |
| `comments` | THẬT nhưng lưu **tệp JSON**, không DB, **không phân quyền** | `comments/route.ts:19,42-58` |
| `cursors` | THẬT nhưng state là `Map` module-scope, **mất khi restart** | `cursors/route.ts:24` |

## 3 · DỮ LIỆU — 24 model, **không có model chết**

Ba model trông như chết khi grep thẳng (`projectProfile`, `workflowState`, `externalRef`) — thực ra
truy cập qua **delegate ép kiểu động**: `lib/server/project-profile.ts:55` · `lib/server/tasks.ts:92` ·
`lib/integrations/external-ref.ts:72`. ⇒ Nợ kỹ thuật, **không phải** stub.

**Hai chỗ schema tự cảnh báo:** `ProjectMember` và `ProjectAssetUsage` có `@@unique` **không gồm
`deletedAt`** (`schema:131,144,798-799`) — xoá mềm rồi thêm lại sẽ đụng unique.

## 4 · LƯU TRỮ TỆP

| phát hiện | file:dòng | loại |
|---|---|---|
| Ghi vào `process.cwd()/uploads` — **tương đối theo cwd**, **5 nơi khai lại cùng hằng** | `lib/server/library-save.ts:24` +4 nơi | OBSERVED |
| Trong Electron đóng gói cwd = `<userData>` ⇒ rơi vào `<userData>/uploads` (ghi được) | `electron/main.js:118-124,389` | OBSERVED |
| **Kiểm MIME bằng magic bytes**, whitelist cứng, **SVG/HTML chặn cố ý** | `lib/server/mime-sniff.ts:15-50` | OBSERVED |
| Sniff **cả lúc ghi lẫn lúc trả** — không tin cột `mime` trong DB | `luu-file.ts:78` · `library/[id]/file/route.ts:19` | OBSERVED |
| Trần **25MB**, trả 413 | `luu-file.ts:58-59` | OBSERVED |
| `X-Content-Type-Options: nosniff` + ép `attachment` cho mọi thứ không phải ảnh raster | `library/[id]/file/route.ts:24` | OBSERVED |

> Tầng tệp là **phần chắc nhất** của backend hiện tại. Sniff hai đầu là làm đúng.

**Một lệch:** `comments` ghi vào `public/comments-images/` theo cwd ⇒ trong bản đóng gói rơi vào
`<userData>`, **không phải** `public/` của Next ⇒ ảnh góp ý **không phục vụ được qua static**.
(`comments/route.ts:42` + `electron/main.js:389`) · INFERENCE · vừa.

## 5 · XÁC THỰC — ba tầng

```
① middleware Edge  /api/:path*  — verify CHỮ KÝ + có `sub`, KHÔNG đụng DB   middleware.ts:51-73
② getSessionUser()             — verify + prisma.user.findUnique            auth.ts:109-150
③ assertProjectAccess()        — quyền theo dự án, 404 thay 403             access.ts:32-54
```

| phát hiện | file:dòng | loại |
|---|---|---|
| JWT **HS256**, hạn **30 ngày** | `auth.ts:46,70` | OBSERVED |
| 🔴 Secret fallback **`'dev-secret-change-me'`** hardcode — có ở **cả production** | `auth.ts:46` + `middleware.ts:35` | OBSERVED · cao |
| 🔴 Cookie **KHÔNG có flag `secure`** | `auth.ts:72-77` | OBSERVED · cao |
| Cookie `httpOnly` + `sameSite:'lax'` ✓ | `auth.ts:72-77` | OBSERVED |
| bcrypt cost 10 ✓ | `auth.ts:56` | OBSERVED |
| Tên cookie đổi theo môi trường (`if_session` / `_wt` / `_noenv`) | `auth.ts:22-44` | OBSERVED |
| `assertProjectAccess` trả **404 thay 403** để không lộ tồn tại ✓ | `access.ts:32-54` | OBSERVED |

> Fallback secret **được cứu một phần** trong Electron vì `loadUserConfig()` sinh `AUTH_SECRET`
> (`electron/main.js:354-360`). **Không được cứu** nếu deploy web — và `vercel.json` **có mặt** trong repo.

## 6 · 🔴 TÁM ROUTE KHÔNG KIỂM QUYỀN DỰ ÁN

| route | vấn đề | file:dòng | chủ ý? |
|---|---|---|---|
| `asset-representation` GET/POST/DELETE | **không lọc `userId` ở cả ba method**; DELETE xoá mềm representation của asset bất kỳ | `asset-representation/route.ts:30,60,87` | **KHÔNG — khác hẳn `library/[id]/route.ts:25` vốn có kiểm** |
| `library/[id]/file` GET | `findUnique({id})` không lọc userId | `library/[id]/file/route.ts:11` | nhiều khả năng CÓ *(thư viện dùng chung team)* |
| `dashboard` GET | trả **toàn bộ** user/project/flow của mọi người | `dashboard/route.ts:7-8,18-50` | **CÓ** — comment khai rõ *"app nội bộ team"* |
| `chat` GET | ChatMessage + danh sách user toàn cục | `chat/route.ts:10,16` | CÓ |
| `specs` GET | ProductSpec dùng chung | `specs/route.ts:20` | CÓ *(ghi/xoá có `requireAdmin`)* |
| `notebook/[projectId]/*` | không gọi `assertProjectAccess`; chỉ chặn theo **owner** ⇒ **member của dự án bị loại oan** | `resolveProject.ts:39` | **KHÔNG** |
| `integrations/[provider]/status` | gọi `getSessionUser()` nhưng **không 401 khi null** | `status/route.ts:9-10` | KHÔNG |
| `comments` | mọi user đọc/ghi chung một tệp JSON | `comments/route.ts:61-70` | KHÔNG |

> **`asset-representation` là ca nặng nhất** vì nó lệch hẳn với anh em cùng nhóm.
> **`notebook`** lệch theo hướng ngược: chặt quá, loại nhầm member.

## 7 · CONNECTOR NGOÀI

| dịch vụ | key | retry | timeout | thất bại |
|---|---|---|---|---|
| **Lark** | env | ✅ backoff+jitter theo mã rate-limit | ❌ | throw sau N lần |
| NVIDIA NIM | env | 1 lần cho 5xx | ❌ | 429 typed |
| Ollama *(local)* | — | ❌ | ✅ AbortController | `available:false` |
| fal.ai | env | ❌ | ✅ 15s probe | 503 |
| ComfyUI | env | ❌ | ✅ | 503 + hint |
| Stable Diffusion | env | ❌ | ❌ | KHÔNG CÓ BẰNG CHỨNG |
| Unsplash | env | ❌ | ✅ | `catch {}` **nuốt lỗi** |
| Google / MS / Apple OAuth | env | ❌ | ❌ | — |

✅ **Token OAuth được mã hoá** bằng `INTEGRATION_ENC_KEY` trước khi lưu (`lib/integrations/crypto.ts:14,42`).
🔴 **Phần lớn connector không có timeout** — một dịch vụ treo là giữ worker Next.

## 8 · SỰ THẬT KIẾN TRÚC LỚN NHẤT

Ba route **cố ý** trả dữ liệu toàn đội (`dashboard` · `chat` · `specs`), và comment nói thẳng
*"app nội bộ team → hiển thị toàn team"* (`dashboard/route.ts:7-8`).

⇒ **IF hiện tại được xây như một app NỘI BỘ MỘT STUDIO**, không phải sản phẩm nhiều khách.
Đây không phải lỗi — đó là **giả định nền** của mã hiện có.
Và nó **mâu thuẫn trực tiếp** với định vị *"sản phẩm độc lập, bán toàn cầu"* trong `CLAUDE.md`.

**Đây là phát hiện quan trọng nhất của cả gói.**
