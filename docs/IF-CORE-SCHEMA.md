# IF-CORE-SCHEMA — Sơ đồ lõi InteriorFlow

> Tài liệu lõi về mô hình dữ liệu + phạm vi (scope) + quy ước route.
> Nguồn sự thật về CODE vẫn là `prisma/schema.prisma` và `lib/scope.ts`; file này
> ghi lại các QUYẾT ĐỊNH kiến trúc để phiên sau không hiểu nhầm.

## 0. LUẬT TRUNG TÍNH — repo không chứa dữ liệu studio/khách thật

> Luật gốc, cấp cao hơn mọi tiện lợi kỹ thuật. Xuất phát từ LUẬT NỀN TẢNG ở
> `CLAUDE.md`: **InteriorFlow là sản phẩm ĐỘC LẬP, GLOBAL** — không phải tool nội bộ
> của studio nào. Chi tiết phân loại nội dung: `docs/CONTENT-RULES.md`.

**Điều 0.1 — Repo TRUNG TÍNH.** Repo sản phẩm KHÔNG được chứa:
- hồ sơ/deck/bản vẽ **dự án khách thật** (PDF concept, mặt bằng, số liệu, tên khách);
- **brand guideline của bất kỳ studio nào** (logo · màu · font · wordmark);
- **ảnh render dự án thật dùng làm mặt tiền sản phẩm** (login backdrop, cover mặc định,
  intro, deck mẫu) — dù chỉ serve tĩnh trong `public/`, đã nằm trong `public/` là công khai.

**Điều 0.2 — Thương hiệu chỉ đến từ Brand Kit của DỰ ÁN.** Mọi chỗ cần nhận diện
(khung tên bản vẽ, footer slide, watermark, header export, kicker deck) PHẢI đọc Brand Kit
của dự án đang mở. **Không hardcode** tên/logo/màu/font của studio nào — kể cả studio làm ra
app. Không có Brand Kit ⇒ để **rỗng**, không fallback vào một brand cụ thể.

**Điều 0.3 — Dữ liệu tham khảo sống NGOÀI repo.** Ghi nhận 24/07: đã tách **401 MB**
dữ liệu tham khảo ra khỏi repo (chuyển, KHÔNG xoá) → **`~/Downloads/interiorflow-reference/`**:

| Thư mục đã tách | Nội dung | Dung lượng |
|---|---|---|
| `project-references/` | 4 PDF hồ sơ dự án khách thật | ~121 MB |
| `ttt-brand/` | brand guideline studio (5 biến thể) | — |
| `san pham dau ra/` | 51 ảnh sản phẩm tham khảo | — |
| `dev.db.bak-*` | 2 bản sao DB cũ | ~274 MB |

⛔ **KHÔNG copy trở lại vào repo.** Cần tra thì đọc từ đường dẫn ngoài repo.

**Điều 0.4 — Còn sót (chưa đóng).** Bảng bằng chứng đầy đủ: `docs/AUDIT-BRAND-PII.md`.
Tóm 🔴 nặng nhất:

| Vi phạm còn sót | Vì sao nghiêm trọng |
|---|---|
| `lib/present-editor/content-deck.ts:113` — `kicker: 'DETECH · CONCEPT'` | In tên khách hàng lên **mọi deck do người dùng khác tự sinh** |
| **53 ảnh mặt tiền là render khách** — `public/wallpapers/ttt-*` (30) · `public/covers/` (5) · `public/detech/` (18) | Toàn bộ mặt tiền (login → chọn dự án → intro) chạy bằng render của khách; `public/` = công khai |
| `package.json` author + appId `com.ttt.*` | Định danh sản phẩm mang tên một studio |
| Installer: cert ký + Android package `com.tttarchitects.*` | Nhận diện studio bám vào bản phát hành |

➡️ Phần **CODE** của các mục trên do **task #27** (nhánh `fix/audit-approved`) xử lý.
Task #24 (tài liệu) **không sửa code**.

## 0B. LUẬT DEMO — demo là seed CÓ CỜ, không phải nội dung app

> Bản ngắn, chuẩn hoá thành luật gốc. Chi tiết + checklist merge: `docs/CONTENT-RULES.md` §1, §3.

**Điều 0B.1 — Demo = seed có cờ.** Nội dung demo chỉ nạp khi cờ
**`NEXT_PUBLIC_DEMO`** bật. Mặc định: **dev BẬT · production build TẮT**.
Không có cờ ⇒ coi như tắt (fail-closed).

**Điều 0B.2 — Prod tắt demo ⇒ thay bằng ONBOARDING, không phải nội dung mẫu.**
Màn app thật khi rỗng phải là **empty state trung tính + tour** (coachmark), tuyệt đối
không **bake** deck/flow/moodboard mẫu vào màn app thật để "cho đỡ trống".

**Điều 0B.3 — Bộ định danh demo hư cấu chuẩn (dùng thống nhất mọi nơi):**

| Khoá | Giá trị chuẩn |
|---|---|
| Studio hư cấu | **`Atelier Nord`** |
| Dự án mẫu (`Project.id`) | **`prj_nord01`** |

Mọi ví dụ/seed/fixture/tài liệu dùng đúng hai giá trị này. **Không dùng tên khách thật
làm ví dụ** (`prj_detech01`, `Detech Complex`, `Amanoi`, `IKI Village`… → đổi sang
`prj_nord01` / `Atelier Nord`).

**Điều 0B.4 — Demo ở khu riêng, truyền nội dung tường minh.** File/route demo có tiền tố
`demo` (`app/demo/`, `lib/demo-*.ts`, `components/demo/*`) và **truyền nội dung mẫu tường
minh** — không để component app mặc định tự nạp seed demo.

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

- **Xác nhận lại (Task #24):** `/prj/` **không tồn tại** trong `app/`, trong link, trong
  redirect. Nó là **ký hiệu viết tắt trên giấy**. Route THỰC TẾ = `/projects/`. Không đổi
  tên URL, không tạo alias.

`id` trong `/projects/[id]/…`:
- Thường là **`Project.id`** thật (cuid) khi flow đã gán dự án. Trong tài liệu/ví dụ,
  id mẫu chuẩn là **`prj_nord01`** (dự án hư cấu của studio **Atelier Nord**) — xem §0B.3.
  Ví dụ: `/projects/prj_nord01/present`.
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

## 1D. Mô hình phát hành — CHỐT: **LOCAL-FIRST + ĐỒNG BỘ theo pha** (26/07, đã sửa lại)

> Quyết định kinh doanh, không phải kỹ thuật. ⚠️ Bản CHỐT THẬT SỰ nằm ở đây — **KHÔNG phải
> "C — Đa nền tảng"** như một bản ghi trước đó của mục này từng viết (commit `7ccb024`).
> User đã sửa lại ngay sau đó: mô hình thật **không nằm gọn trong A/B/C** đã trình bày ban
> đầu, mà là local-first có lộ trình đồng bộ 3 pha. Giữ lại 3 phương án A/B/C bên dưới làm
> ngữ cảnh đối chiếu — pha 1 trùng B, nhưng KHÔNG dừng ở B.

**Bối cảnh (không đổi):** repo từng giữ 2 tài liệu mâu thuẫn nhau — `DEPLOY-CHECKLIST.md`
(15/07) giả định cloud SaaS Vercel+Supabase; `README-electron.md` + `docs/RESEARCH-
INSTALLER-4-PLATFORMS.md` (23/07) giả định desktop đóng gói. 3 phương án A (cloud) / B
(desktop 1 nền) / C (desktop đa nền, không sync) đã đối chiếu — xem lịch sử git nếu cần bảng
so sánh gốc.

**Mô hình thật, theo 3 pha:**

| Pha | Nội dung | Hạ tầng |
|---|---|---|
| **1 (nay)** | Desktop đóng gói, **KHÔNG đồng bộ**. Trùng phương án B nhưng **chỉ Windows + macOS** (không Android/iOS ở pha này) | SQLite + `uploads/` trên đĩa máy đó, y hệt hiện tại — **không đổi gì** |
| **2** | Đồng bộ **MỘT CHIỀU**: đẩy lên để khách xem deck qua link (push-only, không kéo dữ liệu về máy) | Cần 1 điểm đặt để host bản deck đã xuất — chưa thiết kế, việc của lúc đó |
| **3** | Đồng bộ **HAI CHIỀU** (nhiều máy/nhiều người cùng 1 dự án) | Dùng thư viện có sẵn — **Turso embedded replica** hoặc **PowerSync**. **KHÔNG tự viết engine sync** |

**Hệ quả — ghi đè lại đúng những gì bản trước đã ghi sai phạm vi:**
- **`DATABASE_URL` = SQLite local (qua Prisma), `./uploads` = đĩa local, auth tự viết JWT
  (`jose` + cookie `if_session`) là ĐÚNG HƯỚNG cho Pha 1 — KHÔNG liệt vào "Nợ kỹ thuật"
  trong STATUS.md.** Đừng migrate sang Postgres/S3/NextAuth chỉ vì "sau này sẽ cần cloud" —
  Pha 3 dùng Turso/PowerSync (vẫn SQLite-based), không phải Postgres.
- **`DEPLOY-CHECKLIST.md` → DEPRECATED**, gắn nhãn ngay trong file (không xoá). Lý do: giả
  định sai cả tầng lưu trữ (Postgres/Supabase) lẫn mô hình vận hành (1 server dùng chung)
  so với hướng local-first đã chốt. Có thể hữu ích một phần nếu Pha 2/3 sau này cần một
  server nhỏ để host deck — nhưng phải viết lại, không dùng nguyên trạng.
- **`docs/RESEARCH-INSTALLER-4-PLATFORMS.md` → THU HẸP còn Windows + macOS** cho app CAD
  đầy đủ. Android/iOS **lùi lại, đổi mục đích**: không đóng gói app CAD đầy đủ, mà chỉ để
  **xem/duyệt deck qua web** (đúng khớp Pha 2 — đẩy deck lên cho khách xem, khách có thể
  đang cầm điện thoại). Gắn ghi chú này thẳng vào file đó.
- **5 ràng buộc schema local-first phải áp NGAY ở Pha 1** (đắt nếu để dồn tới Pha 3 mới sửa
  — lúc đó dữ liệu thật đã sinh ra không có các cột này, phải backfill):
  1. `id` = chuỗi ngẫu nhiên (cuid/uuid/ULID), KHÔNG autoincrement — tránh đụng id khi hợp
     nhất dữ liệu từ nhiều máy.
  2. Mọi bảng có `updatedAt` + `rev` (số hiệu bản sửa) — nền cho conflict resolution.
  3. Xoá mềm `deletedAt`, không xoá cứng — một bản ghi bị xoá trên máy A phải "biến mất"
     một cách có thể đồng bộ sang máy B, không phải biến mất khỏi DB luôn.
  4. Ghi `deviceId`/người sửa vào mỗi thay đổi — cần khi 2 máy sửa cùng 1 bản ghi.
  5. Tách file khỏi DB — **ĐÃ ĐÚNG**: `LibraryAsset` giữ `path`, ảnh nằm ở `uploads/`, DB
     không nhồi blob.
  → **Kết quả audit 16 model thật** (không suy đoán, đọc trực tiếp `prisma/schema.prisma`):
  xem bảng ở mục **2C** ngay dưới `2B`. Tóm tắt: (1) đạt 16/16 · (2) **updatedAt chỉ 3/16,
  rev 0/16** · (3) **deletedAt 0/16 — mọi xoá đều là `onDelete: Cascade` cứng** · (4) **0/16
  có deviceId** · (5) đạt.
- `README-electron.md` là bản THAM CHIẾU cho macOS (electron-builder có sẵn target `--mac`,
  script `electron:build:mac` đã có trong `package.json`) — cùng nguyên lý "nhúng sẵn
  backend, mỗi máy 1 instance".

## 2. Mô hình dữ liệu lõi (tóm tắt — chi tiết ở `prisma/schema.prisma`)

- **Project** `{ id, userId, name, clientName?, larkProjectCode?, currentStage,
  stageLocked }` — 1 dự án; có nhiều `Flow`, 1 `ProjectNotebook?`, nhiều `ProjectMember`.
- **Flow** `{ id, userId, projectId?, name, graphJson, coverUrl, status, version,
  shareToken? }` — 1 bản vẽ/canvas; `projectId` NULLABLE (`onDelete: SetNull`).
- **ProjectMember** `{ projectId, userId, role }` — role: `owner|crea|drafter|bim|
  viewer`; unique `(projectId,userId)`; mọi dự án luôn ≥1 owner.

Cửa quyền DUY NHẤT: `lib/server/access.ts` (`assertProjectAccess`) — route không
tự query `ProjectMember` rải rác.

## 2B. Luật worktree & Prisma — KHÔNG sửa `schema.prisma` khi `node_modules` symlink chung (26/07)

Worktree thường được dựng bằng `ln -s .../interiorflow/node_modules` sang worktree mới để
đỡ cài lại — nhanh nhưng **`@prisma/client` sinh ra bên trong `node_modules` đó là DÙNG
CHUNG cho mọi worktree trỏ vào**.

**Vì sao nguy hiểm:** `prisma generate` (chạy tay hoặc tự động sau khi sửa `schema.prisma`)
ghi đè client đã sinh — nếu một worktree sửa schema (thêm/bớt cột) rồi regenerate, client
mới đó lập tức áp dụng cho **TẤT CẢ** worktree khác đang symlink chung, kể cả worktree/máy
chủ (`main`) đang có phiên khác chạy dở. Phiên đó gọi `SELECT` cột mà `dev.db` của nó
CHƯA có (vì DB mỗi worktree tách riêng, `dev.db.wt` khác `dev.db`) ⇒ **`P2022` (column does
not exist)** giữa chừng, không báo trước.

**Luật:**
1. **Sửa `schema.prisma` CHỈ làm trên nhánh tích hợp (`main`/`feat/present-layout-ml-p1`)**,
   không làm trong worktree phụ.
2. Nếu BẮT BUỘC phải sửa schema trong worktree (ví dụ agent code chạy song song cần thêm
   cột) → worktree đó phải **cài `node_modules` riêng** (`npm install`, không symlink),
   để `prisma generate` chỉ ảnh hưởng chính nó.
3. Trước khi giao việc cho agent vào worktree symlink chung: nói rõ trong prompt "KHÔNG
   sửa `prisma/schema.prisma`" nếu việc đó không cần đổi schema (đúng cách avatar đợt 2
   26/07 đã tránh được — chỉ sửa `.ts`/`.tsx`, không đụng schema).
4. Phát hiện thấy `P2022` bất thường ở một phiên đang chạy → nghi ngay worktree khác vừa
   regenerate client qua symlink chung, đừng debug theo hướng dữ liệu hỏng trước.

## 2C. Audit 16 model so với 5 ràng buộc local-first — ĐÃ ÁP DỤNG cho 4 model (26/07)

Đọc trực tiếp `prisma/schema.prisma`. Bản đầu (26/07 sáng) chỉ audit + báo cáo; bản này ghi
lại sau khi đã **thêm cột thật + sửa code thật** cho đúng 4 model user tự tay sửa trực tiếp:
**Project, Flow, LibraryAsset, ProjectMember**. `npx prisma db push` đã chạy trên `main` (đúng
luật §2B — không phải worktree symlink); dữ liệu cũ verify còn nguyên (Project 3, LibraryAsset
1515, Flow 12 dòng trước/sau khớp nhau).

| Model | id cuid | updatedAt | rev | deletedAt | lastEditedBy/Device | Trạng thái |
|---|---|---|---|---|---|---|
| **Project** | ✅ | ✅ | ✅ | ✅ | ✅/🕳️ | **ĐÃ THÊM** 26/07 |
| **Flow** | ✅ | ✅ (có sẵn) | ✅ | ✅ | ✅/🕳️ | **ĐÃ THÊM** 26/07 (giữ nguyên `version` cũ — khác nghĩa `rev`, xem comment trong schema) |
| **LibraryAsset** | ✅ | ✅ | ✅ | ✅ | ✅/🕳️ | **ĐÃ THÊM** 26/07 |
| **ProjectMember** | ✅ | ✅ | ✅ | ✅ | ✅/🕳️ | **ĐÃ THÊM** 26/07 |
| User | ✅ | ❌ | ❌ | ❌ | — | chưa áp — không phải 1 trong 4 model chốt |
| IntegrationAccount | ✅ | ✅ | ❌ | ❌ | — | chưa áp |
| ProjectNotebook | ✅ | ✅ | ❌ | ❌ | — | chưa áp |
| NotebookSource | ✅ | ❌ | ❌ | ❌ | — | chưa áp |
| NotebookChunk | ✅ | ❌ | ❌ | ❌ | — | chưa áp |
| FlowVersion | ✅ | ❌ | ❌ | ❌ | — | **LOẠI TRỪ có chủ đích**, xem lý do bên dưới |
| CreditTransaction | ✅ | ❌ | ❌ | ❌ | — | **LOẠI TRỪ có chủ đích**, xem lý do bên dưới |
| ChatMessage | ✅ | ❌ | ❌ | ❌ | — | chưa áp |
| LarkTaskRef | ✅ | ❌ | ❌ | ❌ | — | **LOẠI TRỪ có chủ đích**, xem lý do bên dưới |
| LarkPersonRef | ✅ | ❌ | ❌ | ❌ | — | **LOẠI TRỪ có chủ đích**, cùng lý do LarkTaskRef |
| ProductSpec | ✅ | ❌ | ❌ | ❌ | — | chưa áp (chưa phải model user tự sửa trực tiếp qua UI) |
| LarkUserMap | ✅ | ❌ | ❌ | ❌ | — | **LOẠI TRỪ có chủ đích**, cùng lý do LarkTaskRef |

🕳️ = cột `lastEditedDevice` đã có trong schema (kiểu `String?`) nhưng **luôn ghi `null`** —
chưa có cơ chế `deviceId` thật trong repo (không cookie, không header, đã grep xác nhận 0 kết
quả). Cột tồn tại để KHỎI phải migrate lại lúc Pha 2 dựng cơ chế deviceId (vd UUID cài đặt lưu
trong Electron `userData`, gửi qua header mỗi request) — chưa wire, không phải bug.

**Lý do LOẠI TRỪ (không áp 5 ràng buộc), theo đúng yêu cầu ghi rõ lý do:**
- **`LarkTaskRef` / `LarkPersonRef` / `LarkUserMap`** — đây là bảng **mirror PULL-ONLY** từ
  Larkbase (`syncedAt` đã có sẵn đúng vai trò này). **Larkbase mới là nguồn chân lý**, IF chỉ
  đọc/cache — không có khái niệm "user tự sửa trực tiếp trên IF rồi cần hoà giải xung đột với
  máy khác", vì IF không bao giờ ghi ngược lên Larkbase. `rev`/`deletedAt`/`lastEditedBy` vô
  nghĩa ở đây: bản ghi "xoá" đơn giản là lần sync sau không thấy nữa (đã xử lý bằng cách xoá
  cứng + tạo lại theo `larkRecordId` — không phải state cần đồng bộ đa thiết bị của IF).
- **`CreditTransaction`** — sổ cái (ledger) **append-only theo thiết kế**: mỗi dòng là 1 giao
  dịch tín dụng đã xảy ra (nạp/trừ). Thêm `deletedAt` sẽ SAI bản chất kế toán — một giao dịch
  không "xoá mềm", nó hoặc tồn tại hoặc phải có giao dịch NGƯỢC DẤU để đảo (đúng chuẩn kế toán
  double-entry), không phải soft-delete. `rev` cũng vô nghĩa vì dòng không bao giờ update sau
  khi tạo.
- **`FlowVersion`** — snapshot **bất biến theo thiết kế**: mỗi lần user bấm "Run" tạo 1 bản mới
  (không update bản cũ, không xoá bản cũ trong vòng đời bình thường). `updatedAt` vô nghĩa (nó
  không bao giờ update); `deletedAt` sai mục đích (nếu cần dọn snapshot cũ, đó là retention
  policy — xoá cứng theo tuổi, không phải xoá mềm cho đồng bộ).

**Việc còn lại trước khi bắt đầu Pha 2:** dựng cơ chế `deviceId` thật (hiện `lastEditedDevice`
luôn null) — không chặn Pha 1 vì Pha 1 không đồng bộ, chỉ cần xong TRƯỚC khi Pha 2 (đẩy deck
lên) cần biết dữ liệu tới từ máy nào.

---

## 3. Hiến pháp dữ liệu tri thức T1 (bổ sung từ bundle Ben, 26/07)

> Nguồn: `docs/IF-DOCS-BUNDLE-v1.md` chunk `docs/IF-CORE-SCHEMA.md` (*v1.0 · 2026-07-24 · Ben
> soạn theo blueprint v1.2 mục 5B–5C*). Chunk đó TRÙNG TÊN với file này nhưng là tài liệu KHÁC
> hẳn (tầng "não tri thức" T5 — GuProfile/MaterialRef/FeedbackRecord/KnowledgePack — không phải
> Prisma DB đang chạy ở §2). Đã đối chiếu: phần LUẬT TRUNG TÍNH/LUẬT DEMO/route tree của chunk
> đó ĐÃ có ở §0/§0B/§1B/§1C trên — không chèn lại. Chỉ 7 mục dưới đây là THẬT SỰ MỚI, chèn
> nguyên văn, không sửa chữ. ⚠️ Các tiền tố `prj_/room_/deck_/mat_/gu_/fb_/kp_` là ĐỀ XUẤT CHƯA
> CÀI (0 kết quả grep trong code, 26/07) — riêng `img_` đã có thật (`lib/img-id.ts`).

**Luật gốc** (nguyên văn từ chunk): output không có `id` = mồ côi, không ship. Mọi bản ghi có
`v: 1` (version).

### 3.1 Quy ước ID — chuỗi ngắn, tiền tố nói nghĩa

| Tiền tố | Đối tượng | Ví dụ |
|---|---|---|
| `prj_` | Dự án | `prj_nord01` |
| `room_` | Phòng/không gian trong .idf | `prj_nord01/room_living` |
| `img_` | Ảnh render/photo-edit | `img_a8k2f` |
| `deck_` | Deck Present | `deck_nord_v3` |
| `mat_` | Vật liệu (trỏ ATLAS) | `mat_oak_natural` |
| `gu_` | Hồ sơ gu | `gu_nord_client` |
| `fb_` | Bản ghi phản hồi | `fb_20260724_001` |
| `kp_` | Gói tri thức dự án | `kp_nord01` |

Ảnh render **phải** nhận `img_` id ngay khi sinh ra (hiện đang truyền dataURL không id — vá đầu tiên).

### 3.2 GuProfile — hồ sơ gu 10 trục (theo Tập 2 Design DNA)

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | `gu_*` | |
| `axes` | 10 số nguyên –3…+3 | Trang trí · Nhiệt độ · Trọng lượng · Tự nhiên↔Nhân tạo · Đối xứng · Ồn↔Kín · Toàn cầu↔Bản địa · Trật tự↔Kể chuyện · Bền vững · Tốc độ |
| `subject` | `client` \| `developer` \| `project` | Gu của ai |
| `confidence` | 0–1 | Chấm tay = 0.6; đã kiểm 2 chiều = 0.9 |
| `evidence` | text[] | Bằng chứng chấm điểm (link, ghi chú họp) |

### 3.3 MaterialRef — vật liệu một nguồn

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `matId` | `mat_*` | Khoá chính, trỏ bảng MATERIAL trên ATLAS (Lark Base Vol.3) |
| `preset` | 1 trong 13 preset | Fallback procedural texture (`material-texture.ts`) khi chưa có ảnh |
| `photoUrl?` | url | Hook chờ ATLAS — có ảnh thật thì thay preset |

### 3.4 FeedbackRecord — viên gạch của bánh đà

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | `fb_*` | |
| `targetId` | id bất kỳ | Ảnh, deck, layout… được chấm |
| `verdict` | `accept` \| `reject` \| `approve` \| `revise` | Nhận/Bỏ (Perceptron) · duyệt/sửa (khách) |
| `source` | **`real`** \| **`synthetic`** | ⚠️ Luật buồng vang: synthetic chỉ veto, không train |
| `guProfileId` | `gu_*` | Ai chấm — gu nào |
| `note?` | text | Lý do, trích lời khách |
| `ts` | timestamp | |

### 3.5 Hai trường thời gian — gắn cho MỌI bản ghi tri thức & hộ chiếu tính năng

| Trường | Giá trị | Máy đọc thế nào |
|---|---|---|
| `trendStatus` | 🟢 đang lên · 🟡 bão hoà · 🔴 lỗi thời | 🔴 → hạ trọng số gợi ý; UI hiện nhãn |
| `reviewBy` | ngày | Quá hạn chưa quét lại → tự rơi về 🟡 |

Tần suất quét *(trend scout)*: **STYLE_DNA quý/lần · TREND_WATCH tháng/lần**.

### 3.6 Metadata 2 lớp — mọi bản ghi qua Gateway

- **Lớp chung** *(shared)*: `id` · `projectId` · `guProfileId` · `ts` · `v` — module nào cũng đọc.
- **Lớp trội** *(salient)*: cờ máy tự gắn — vi phạm quy chuẩn 🔴 · vật liệu chủ đạo · trục gu
  lệch ≥±2 · ảnh khách đã duyệt. Xử lý trước, UI highlight, não ưu tiên nạp.

### 3.7 KnowledgePack (O11) — đóng dự án là tự đóng gói

```
kp_<prj> = { guProfile cuối · .idf ref · danh sách img_ id · verdict pitch (thắng/thua/lý do)
             · vật liệu dùng thật (mat_ ids) · bài học 3 dòng }  →  nạp Não T5
```

---

## Phụ lục A. Kiểm kê chuỗi `detech` toàn repo (Task #24 · 25/07)

Lệnh: `grep -rniI --exclude-dir=node_modules --exclude-dir=.git -e 'detech' .`
→ **28 file · 121 dòng khớp** (`detech` / `Detech` / `DETECH`).
Chuỗi `prj_detech01` **không tồn tại trong repo** (chỉ nằm ở brief/STATUS như việc-cần-làm).

### A.1 CODE — ⛔ task #24 KHÔNG sửa, do **task #27** (`fix/audit-approved`) xử lý

| File | Dòng | Chuỗi / vai trò |
|---|---|---|
| `lib/present-editor/detech-sample.ts` | 32 | Deck khách hoàn chỉnh (`'DETECH COMPLEX'`, `DETECH_IMG` 18 ảnh) — vi phạm CONTENT-RULES §4 |
| `lib/demos/present.ts` | 11 | Flow demo nạp 4 ảnh `/detech/*` |
| `lib/present-editor/sample.ts` | 9 | import/tham chiếu `detech-sample` |
| `lib/present-demo.ts` | 7 | `DEMO_DECK` brand `'DETECH · NỘI THẤT'` (route sống `/present`) |
| `lib/present-editor/content-deck.ts` | 1 | 🔴 `kicker: 'DETECH · CONCEPT'` (dòng 113) — nặng nhất |
| `lib/report-deck.ts` | 1 | comment "tách khỏi deck khách (Detech)" — vô hại, giải thích luật |
| `components/intro/TitleSequence.tsx` | 8 | 7 ảnh `/detech/*` trên route sống `/intro` |
| `components/present/PresentOverlay.tsx` | 1 | tham chiếu deck mẫu |
| `components/present/PresentDeck.tsx` | 1 | tham chiếu deck mẫu |
| `components/nodes/InteriorNode.tsx` | 1 | ảnh/nhãn mẫu |
| `components/entry/cardFaces.tsx` | 1 | comment "ảnh render THẬT (Detech)" — dead code |
| `app/present/page.tsx` | 1 | route showcase nạp `DEMO_DECK` |
| `app/library/ingest/page.tsx` | 1 | placeholder "…input dự án Detech" (hardcode, ngoài `i18n.ts`) |
| `public/__testcases/present.json` | 2 | fixture công khai trỏ `/detech/*` |
| `public/detech/*` | 18 file ảnh | ảnh dự án thật, serve công khai |

### A.2 DOCS — đã trung tính hoá ở task #24

| File | Trước | Sau |
|---|---|---|
| `docs/RESEARCH-LIBRARY-UPGRADE.md:187,352,436` | ví dụ dự án `"Detech Complex"` (3 chỗ) + `"Villa Anh Vinh"` | `"Atelier Nord — Dự án mẫu"` / `prj_nord01` / `"Villa Nord"` |
| `docs/RESEARCH-CHAT-FULL.md:524-526` | mockup sidebar chat liệt kê 3 khách thật (`Sungroup Beach Club`, `HVH Office`, `Detech Complex`) | `Nord Beach Club` · `Nord Office` · `Nord Complex` (giữ nguyên độ rộng khung ASCII) |

### A.3 DOCS — CỐ Ý giữ nguyên (là bằng chứng hoặc chính chỗ ghi luật)

| File | Dòng | Vì sao giữ |
|---|---|---|
| `docs/AUDIT-BRAND-PII.md` | 18 | **Bảng audit** — xoá tên đi thì mất bằng chứng |
| `docs/CONTENT-RULES.md` | 4 | Chỗ **ghi luật cấm**, nêu tên làm ví dụ vi phạm |
| `docs/LOGIC-AUDIT.md` | 1 | Trích đúng chuỗi hardcode đang tồn tại trong code |
| `docs/GU-PROFILE.md` | 3 | Ghi **nguồn dữ liệu** gu (board `detech`, 257 pin) — sửa là sai sự thật. 🟡 Cần user quyết: đổi tên board trong doc hay giữ |
| `docs/ML-GU-ENGINE-PROPOSAL.md` | 1 | Dẫn lại nguồn từ `GU-PROFILE.md` |
| `docs/CATALOG-4-STAGES/poster.html` | 1 | Không phải `.md`; caption ảnh catalog. 🟡 Chờ user quyết |
| `CLAUDE.md` · `STATUS.md` · `CHANGELOG.md` · `DEPLOY-CHECKLIST.md` · `QUALITY-LOG.md` · `DIAGNOSIS.md` | 12 | Luật · lịch sử · checklist ở gốc repo — ngoài phạm vi `docs/*.md`, và là chỗ ghi nhận vi phạm |

---
*Task #18 (nền T0) — 25/07. Thêm khái niệm scope (`lib/scope.ts`), route
`/projects/[id]/overview`, fix bug card mở nhầm dự án. Route `/projects/` GIỮ NGUYÊN.*
*Task #21 (1B) — thêm §1C: 4 chặng xuống `/projects/[id]/…`, route cũ giữ làm redirect.*
*Task #24 (VIỆC 5) — 25/07. Thêm **§0 Luật trung tính** + **§0B Luật demo**
(`NEXT_PUBLIC_DEMO`, Atelier Nord / `prj_nord01`), xác nhận lại §1B, **Phụ lục A** kiểm kê
`detech` toàn repo. Docs-only — phần code do task #27 (`fix/audit-approved`).*
