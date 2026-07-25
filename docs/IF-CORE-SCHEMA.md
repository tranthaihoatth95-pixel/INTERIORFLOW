# IF-CORE-SCHEMA — Sơ đồ lõi InteriorFlow

> Tài liệu lõi về mô hình dữ liệu + phạm vi (scope) + quy ước route.
> Nguồn sự thật về CODE vẫn là `prisma/schema.prisma` và `lib/scope.ts`; file này
> ghi lại các QUYẾT ĐỊNH kiến trúc để phiên sau không hiểu nhầm.

## 1. Scope — hai phạm vi màn hình

Mọi màn hình thuộc đúng MỘT trong hai phạm vi (`lib/scope.ts`, `AppScope`):

| Scope | Nghĩa | Ví dụ màn |
|-------|-------|-----------|
| `global` | Toàn cục, không gắn 1 dự án | Gallery/chọn dự án (`/`), Login, Settings, Thư viện chung, route showcase demo (`/present`, `/report`) |
| `project` | Thuộc-1-dự-án `[id]` | `/projects/[id]/overview`, `/projects/[id]/notebook`, và **3 chặng + Chỉnh ảnh**: `/projects/[id]/cad`, `/render`, `/present`, `/photo` (Task #21) |

Luật scope `project`: **mọi truy vấn/hiển thị lọc chặt theo `[id]`** — không rò dữ
liệu dự án khác (flows, thành viên, notebook…). API `/api/projects/[id]/overview`
là mẫu tham chiếu: `where.projectId === id`.

Nguồn "tôi đang ở dự án nào?":
1. **URL** — trên `/projects/[id]/…` thì `[id]` là chân lý (`parseScope`/`useScope`).
2. **Store** — CHỈ là cache. Từ Task #21, 3 chặng đã nằm dưới `/projects/[id]/…` nên
   URL luôn có `[id]`; store dùng để (a) biết "dự án đang hoạt động" khi đứng ở route
   toàn cục (Gallery, cầu redirect cũ), (b) tránh nạp lại khi đã đúng dự án. KHÔNG suy
   ra từ `flowName`.

## 1B. Quy ước route: `/prj/` là KÝ HIỆU LOGIC — route THỰC TẾ là `/projects/`

> **QUYẾT ĐỊNH (Task #18, user chốt): GIỮ NGUYÊN URL `/projects/`. KHÔNG đổi tên route.**

- Trong tài liệu/thảo luận, có thể viết tắt nhánh logic scope-dự-án là **`/prj/`**
  cho gọn. Đây **chỉ là ký hiệu trên giấy**, KHÔNG phải đường dẫn thật.
- **Route THỰC TẾ trong code luôn là `/projects/[id]/…`** (thư mục
  `app/projects/[id]/`). Mọi link, bookmark, `localStorage`, deep-link, QR đã phát
  hành đều dựa trên `/projects/` — đổi sang `/prj/` sẽ phá tương thích ngược.
- Vì vậy: thấy `/prj/` trong tài liệu ⇒ đọc là `/projects/`. **Tuyệt đối không**
  refactor `app/projects/` thành `app/prj/`, không thêm redirect `/prj → /projects`.

`id` trong `/projects/[id]/…`:
- Thường là **`Project.id`** thật (cuid) khi flow đã gán dự án.
- Có thể là **`Flow.id`** (cuid) khi flow CHƯA gán dự án ("dự án tự do").
- KHÔNG bao giờ là slug tên flow (mutable + trùng tên ⇒ rò dữ liệu chéo — đây
  chính là bug card "mở nhầm/mở chung dự án" đã sửa ở Task #18). Điều hướng từ
  chặng toàn cục dùng `currentProjectId ?? currentFlowId` (`lib/scope.ts`).
- `resolveNotebookProjectId` (server) hiểu cả hai: `Project.id` của user → dùng
  thẳng; cuid khác (Flow.id) → bucket ẩn `__nb:<id>` duy nhất theo id đó.

## 1C. Chặng nằm dưới scope dự án (Task #21 · ĐỔ NỀN 1B)

**URL là nguồn sự thật, store chỉ là cache.** 4 route chặng:

| Route | Component | Route TOÀN CỤC cũ (giữ làm redirect) |
|---|---|---|
| `/projects/[id]/cad` | `components/studio/CadStageScreen` | `/cad-editor` |
| `/projects/[id]/render` | `components/home/HomeScreen` (canvas node) | `/` |
| `/projects/[id]/present` | `components/present-editor/PresentStageScreen` | `/present-editor` |
| `/projects/[id]/photo` | `components/photo-editor/PhotoEditorScreen` | `/photo-editor` |

- Trang chặng đọc `[id]` bằng `useParams()` rồi `useProjectScopeSync` (`lib/project-scope.ts`)
  ép store nạp đúng flow của `[id]`. Không tìm được flow nào thuộc `[id]` ⇒ **DỌN canvas**
  (không bao giờ để graph dự án A hiện dưới URL dự án B).
- **Route cũ KHÔNG bị xoá** (bookmark, `window.open('/photo-editor')`, resume-state cũ):
  `LegacyStageRedirect` tra dự án đang hoạt động (store → resume-state) rồi `router.replace()`
  sang route scope. Chưa có dự án nào (user mới) ⇒ render thẳng màn cũ, không kẹt.
- `/` giữ nguyên vai trò Gallery/đăng nhập. Khi đã biết dự án (chọn ở ProjectSelect hoặc
  auto-resume) → `replace` sang `/projects/[id]/render`.
- Điều hướng chặng (StudioBar, Header, UploadButton) dùng `stageHrefFrom(pathname, stage)` —
  lấy `[id]` TỪ URL trước, nên chuyển chặng không bao giờ rời dự án.
- Resume-state vẫn ghi TÊN ROUTE CŨ (`/cad-editor`…) cho gọn kiểu `ResumableRoute`; auto-resume
  đi qua cầu redirect nên vẫn về đúng chặng + đúng dự án.

## 2. Mô hình dữ liệu lõi (tóm tắt — chi tiết ở `prisma/schema.prisma`)

- **Project** `{ id, userId, name, clientName?, larkProjectCode?, currentStage,
  stageLocked }` — 1 dự án; có nhiều `Flow`, 1 `ProjectNotebook?`, nhiều `ProjectMember`.
- **Flow** `{ id, userId, projectId?, name, graphJson, coverUrl, status, version,
  shareToken? }` — 1 bản vẽ/canvas; `projectId` NULLABLE (`onDelete: SetNull`).
- **ProjectMember** `{ projectId, userId, role }` — role: `owner|crea|drafter|bim|
  viewer`; unique `(projectId,userId)`; mọi dự án luôn ≥1 owner.

Cửa quyền DUY NHẤT: `lib/server/access.ts` (`assertProjectAccess`) — route không
tự query `ProjectMember` rải rác.

---
*Task #18 (nền T0) — 25/07. Thêm khái niệm scope (`lib/scope.ts`), route
`/projects/[id]/overview`, fix bug card mở nhầm dự án. Route `/projects/` GIỮ NGUYÊN.*
