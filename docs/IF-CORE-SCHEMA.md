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
