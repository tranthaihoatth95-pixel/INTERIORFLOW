# ARCHINOTE-MAP — Khảo sát cây gia phả ArchiNote (M6, 06/08/2026)

> **Loại việc:** CHỈ CHẨN ĐOÁN — không sửa dòng code nào ở cả 3 repo, không chạy dev server,
> không commit (luật V6). Mọi khẳng định dưới đây đều kèm lệnh/đường dẫn kiểm chứng lại được.
> Cách làm: 2 agent chạy song song (1 map hệ con · 1 kiểm phản biện `.idf`), phiên chính tự
> spot-check lại các khẳng định trụ cột bằng lệnh thật trước khi ghi.

---

## 0 · NĂM CÂU KẾT LUẬN

1. **`~/Downloads/archinote` KHÔNG có code** — 13 file, toàn `.md`, 1 commit `d6a1a1e`, 0 dòng code.
2. **Code ArchiNote thật nằm ở `~/Downloads/ttt-tasks`** (`package.json` name = `archinote`,
   `CLAUDE.md` dòng 1 = `# ArchiNote (repo: ttt-tasks)`, commit `45795f7` ghi thẳng điều này).
3. **ArchiNote KHÔNG đọc/ghi `.idf`.** Grep `ttt-tasks/src` cho `idf|dxf|dwg|cad|atlas` = **0 kết quả**.
   Mọi lần xuất hiện các từ này đều nằm trong `docs/*.md` (bản sao spec), không phải code.
4. **Hai app hiện KHÔNG chung định dạng dữ liệu nào.** Kênh chung mà spec chủ ý là **Lark Base**,
   nhưng ở tầng code hai bên dùng **2 bộ biến môi trường và 2 kiểu xác thực khác nhau** (§4.3)
   ⇒ "chung một nguồn sự thật" hiện là **chủ trương**, chưa phải hợp đồng kỹ thuật.
5. **ArchiNote mới làm 1/5 module của tầm nhìn** (Điều phối, ở dạng CHỈ ĐỌC). 4 module còn lại
   (Hiện trường · Trợ lý · Vị trí-an toàn · Hạ tầng offline) = **0%** — kể cả Capacitor để chạy
   điện thoại cũng chưa có, dù spec định vị ArchiNote là "máy THU chạy trên điện thoại".

---

## 1 · ĐỊA HÌNH — 3 nơi mang tên ArchiNote

| Nơi | Là gì | Bằng chứng |
|---|---|---|
| `~/Downloads/archinote` | **Chỉ tài liệu.** 10 spec `.md` + `docs/BAO-CAO-ARCHINOTE.md`. 1 commit. | `git log` 1 dòng · `find` 13 file · 0 file code |
| `~/Downloads/ttt-tasks` | **Code thật.** Next 16.2.10 App Router · React 19 · Prisma 6.19 · NextAuth v5 beta · Tailwind 4 · `@lark-base-open/node-sdk`. `src/**` = **4.209 dòng**. | `package.json` · `wc -l` |
| `~/Downloads/NEN/archinote-backup-*.bundle` | **Backup của chính `ttt-tasks`**, không phải dự án thứ ba. | `git bundle list-heads` cho hash `50d48fb`/`b5864d7` — trùng đúng commit trong `git log` của `ttt-tasks` |

**Không có bản ArchiNote nào khác trên máy.** `find ~/Downloads ~/Documents -maxdepth 3 -iname "*archinote*"`
chỉ ra thư mục spec + các **bản sao tài liệu** nằm trong `ttt-tasks/docs/`, `interiorflow/docs/`,
`interiorflow-phu/docs/`, `interiorflow-g4/docs/`.

### 1.1 Rủi ro tài liệu: 1 spec sống ở 3 nơi, 2 nơi chưa commit

`SPEC-ARCHINOTE-UI-2026-08-03.md` (8.959 byte, "Hoà chốt trực tiếp 03/08") tồn tại 3 bản:

| Nơi | Trạng thái |
|---|---|
| `interiorflow/docs/` | ✅ đã commit — nhưng chỉ là **bia chỉ đường 10 dòng** ("đã chuyển sang repo ArchiNote") |
| `archinote/` | 🔴 **untracked** (`git status` = `?? SPEC-ARCHINOTE-UI-2026-08-03.md`) |
| `ttt-tasks/docs/` | 🔴 **untracked** |

Hai bản nội dung `diff` **giống hệt nhau**, nhưng **chưa bản nào được commit ở đâu cả** — mất máy
là mất luôn spec giao diện mới nhất. Ngoài ra bia chỉ đường trong IF trỏ tới `ttt-tasks/docs/...`,
tức IF đã ngầm thừa nhận `ttt-tasks` là repo ArchiNote — mâu thuẫn với việc vẫn giữ repo
`~/Downloads/archinote` rỗng song song. **Cần Hoà chốt: giữ 1 repo, bỏ 1 repo.**

3 spec còn lại (`MASTERPLAN` · `DETAIL-v1` · `IF-BOUNDARY`) `diff` giữa IF và archinote = **giống hệt**.

---

## 2 · CÂY GIA PHẢ ArchiNote (`ttt-tasks`)

```
ArchiNote (ttt-tasks) — web app quản lý công việc, đọc Lark
│
├─ VỎ APP
│  ├─ layout.tsx (42)  → Sidebar (80) + FeedbackOverlay (318)   [NỐI]
│  └─ Sidebar chỉ có 3 mục: "/" · "/lich" · "/du-an"
│
├─ ① ĐIỀU PHỐI — module DUY NHẤT có thật, CHỈ ĐỌC
│  ├─ / (Dashboard, 120)
│  │   ├─ StatCard (45) · StatusDistribution (73) · AttentionCards (144) · MiniCalendar (72)  [NỐI]
│  ├─ /du-an (Project, 200)
│  │   ├─ KanbanBoard (271) → Toast (51) · GanttChart (193) · TaskTable (151)
│  │   ├─ DepartmentFilter (61) · TaskFormModal (195) · DraftBanner (40)                      [NỐI]
│  └─ /lich (Lịch, 208) → CalendarMonth (143) · TaskFormModal · DraftBanner                   [NỐI]
│
├─ ② ĐĂNG NHẬP
│  ├─ /dang-nhap (73) · /tai-khoan (65)        [NỐI kỹ thuật · MỒ CÔI điều hướng — xem §2.2]
│  ├─ src/auth.ts (166) — NextAuth v5 + Microsoft Entra ID · auth-adapter.ts (30)
│  └─ token-crypto.ts (65) — AES-256-GCM
│
├─ ③ TẦNG DỮ LIỆU
│  ├─ lib/lark/{client 111, fields 127, tasks 49, staff 26}  — CHỈ ĐỌC
│  ├─ api/tasks (20) · api/staff (20) — chỉ export GET
│  ├─ lib/fixtures.ts (259) — dữ liệu mẫu fallback khi API lỗi, CÓ báo hiệu trên UI
│  ├─ useDashboardData.ts (71) · useDraftOverlay.ts (125) · draftTypes.ts (36)
│  └─ prisma/schema.prisma (74) — CHỈ 4 model auth, KHÔNG có model nghiệp vụ
│
├─ ④ GÓP Ý (công cụ nội bộ)
│  └─ api/feedback (73) ↔ FeedbackOverlay (318) — ghi file `.feedback/comments.json` (gitignored)
│
└─ 🔴 MỒ CÔI: ProjectProgress.tsx (51) · StaffList.tsx (71)
```

### 2.1 Hai component MỒ CÔI — có lý do lịch sử, không phải bỏ quên

```
grep -rn "ProjectProgress\|StaffList" src --include="*.tsx" --include="*.ts" \
  | grep -v "^src/components/ProjectProgress.tsx\|^src/components/StaffList.tsx"
→ 0 kết quả          (phiên chính chạy lại, xác nhận)
```

Nguyên nhân: commit `368d452` — *"áp góp ý thật — bỏ rail Nhân sự khỏi Project…"*; comment còn
sống ở `src/app/du-an/page.tsx:155-158` giải thích rail phải từng làm trang cao quá 1 màn hình.
**Code bị gỡ khỏi UI nhưng file không xoá.**

⚠️ **Sai lệch spec↔code cần biết**: `SPEC-ARCHINOTE-DETAIL-v1.md:223` chấm
`AN-1.1 | Ai đang gánh gì · ai sắp rảnh | ✅ StaffList.tsx, StatCard.tsx`.
Dấu ✅ đó chỉ đúng nghĩa "file có tồn tại", **sai** nghĩa "người dùng thấy được" — StaffList
không hiển thị ở bất kỳ đâu. Đây đúng kiểu lỗi mà luật IF §9 (giao diện = cây gia phả nhìn
thấy được) sinh ra để chặn.

### 2.2 Hai route mồ côi điều hướng

`/dang-nhap` và `/tai-khoan` chạy được nếu gõ URL, nhưng **không mục Sidebar nào trỏ tới**.
`/tai-khoan/page.tsx:5-8` tự khai *"Route demo (KHÔNG chèn vào '/')"*. Không phải bug, nhưng là
ô trống chưa nối — người dùng không có đường bấm tới trang tài khoản.

### 2.3 Rác thao tác: `_to_delete/` (untracked, 13 file)

Toàn bộ là **bản sao lock file git** (`index.lock`, `HEAD.lock`, `objects/maintenance.lock`) từ
sự cố 19–20/07 — đúng loại sự cố "hai phiên chung `.git`" IF đang gặp. **Không chứa code hay dữ
liệu nghiệp vụ** ⇒ xoá được, nhưng đó là quyết định của Hoà, phiên này không đụng.

---

## 3 · DỮ LIỆU — Lark chỉ đọc, Prisma chỉ auth

| Câu hỏi | Trả lời | Bằng chứng |
|---|---|---|
| Lark có ghi không? | **KHÔNG.** Chỉ đọc. | `grep -rnE "appTableRecord\.(create\|update\|delete\|batchCreate\|batchUpdate)" src` → **0** · `/api/tasks`+`/api/staff` chỉ export `GET` · comment `client.ts:7-9` tự khai chỉ đọc |
| Prisma có model nghiệp vụ? | **KHÔNG.** 4 model đều của NextAuth: `User`·`Account`·`Session`·`VerificationToken` (+`User.avatarUrl`). | `grep "^model" prisma/schema.prisma` |
| Dữ liệu công việc nằm đâu? | **Toàn bộ ở Lark**, không có bản sao local. Mất mạng = trắng màn. | không có tầng cache/offline nào trong `src/` |
| Có fixtures giả không? | **Có, 259 dòng** — fallback khi API lỗi, **có báo hiệu rõ trên UI** ("Dữ liệu mẫu — API chưa sẵn sàng"), không giả danh dữ liệu thật. | `lib/fixtures.ts` · `useDashboardData.ts` |

🟡 **Cần rà riêng (chưa làm được phiên này):** `docs/BAO-CAO-ARCHINOTE.md §9` tự ghi fixtures
*"tên nhân sự ngoài team Creative là phát sinh"* — hàm ý **tên trong team Creative có thể là tên
thật** trong 115 bản ghi mẫu. Không đối chiếu được vì không có danh sách nhân sự thật. Nếu đúng
thì đây là vi phạm trung tính giống ca `public/__dwg-cancel-test.dwg` bên IF.

---

## 4 · CÂU HỎI TRUNG TÂM — `.idf` và chuyện chung định dạng

### 4.1 `.idf` của IF thực chất là gì

`lib/cad/idf.ts` (230 dòng): **JSON thuần**, không zip/binary. `IDF_VERSION = 2` (dòng 25).
Hình dạng: `{ idfVersion, meta{projectName, createdAt, modifiedAt, appVersion}, sheets[{id,name,doc}] }`.
`exportIdf()` = `JSON.stringify`; `importIdf()` = parse + validate + `IDF_MIGRATIONS` cho bản cũ.
Vai trò = tương đương `.dwg`: file rời để xuất/chia sẻ, **khác** autosave IndexedDB. Toàn bộ 56 file
đụng tới `.idf` đều nằm trong repo IF.

### 4.2 ArchiNote có đọc/ghi `.idf` không → **KHÔNG**

```
grep -rniE "idf|dxf|dwg|\bcad\b|atlas|interiorflow"  ttt-tasks/src   → 2 kết quả
```
Cả **2** kết quả là comment trong `src/lib/token-crypto.ts:10,13` ghi *"giống hệt quy ước
interiorflow để dễ tham chiếu"* — tức **chép quy ước mã hoá**, không phải nối dữ liệu.
`.ifpack` = 0 · `projectId`/`matId`/`elementType`/`storey` trong `src/` = **0**.

### 4.3 Hai app có chung format nào không → **KHÔNG, ở cả 3 tầng**

| Tầng | InteriorFlow | ArchiNote | Chung? |
|---|---|---|---|
| File dự án | `.idf` JSON v2 (`Doc`/`Entity`/`Sheet`, `lib/cad/model.ts` 1.273 dòng) | không có khái niệm file dự án | ❌ |
| Hợp đồng kiểu | `lib/cad/model.ts` + `lib/types.ts` | `src/types/domain.ts` (30 dòng): `Staff`·`Task`·`TaskStatus` — dùng `project`/`projectCode` dạng **chuỗi tên**, không có `projectId` | ❌ **không trường nào trùng thật** |
| Kênh Lark | `LARK_APP_ID`+`LARK_APP_SECRET` → `tenant_access_token` (`lib/integrations/providers/lark.ts`), bảng qua `LARK_WORK_APP_TOKEN`/`LARK_TASK_TABLE_ID`/`LARK_HR_TABLE_ID`/`LARK_ATLAS_MATERIAL_TABLE_ID` | `LARK_APP_TOKEN` + **`LARK_PERSONAL_BASE_TOKEN`** → bảng qua `LARK_TABLE_TASKS`/`LARK_TABLE_STAFF` (`src/lib/lark/client.ts:35-53`) | 🟡 **cùng dịch vụ, khác tên biến, khác kiểu xác thực** |

⇒ Điểm quan trọng nhất của phiên này: **hai app đều nói chuyện với Lark, nhưng bằng hai bộ khoá
và hai lối vào khác nhau.** Từ code KHÔNG chứng minh được chúng trỏ vào cùng một Base vật lý
(giá trị env nằm ngoài repo). Muốn "chung một nguồn sự thật" thành sự thật kỹ thuật thì phải có
**hợp đồng tên bảng/tên trường dùng chung**, hiện chưa có.

### 4.4 Spec chủ ý thế nào (trích nguyên văn, ngắn)

`archinote/SPEC-ARCHINOTE-IF-BOUNDARY.md`:
> "Không app nào gọi app nào" (dòng 20-21)

> "Hợp đồng dữ liệu tối thiểu (bảng `PROJECT_STATUS`): `projectId` · `stage` · `%` · `updatedAt` · link mở." (dòng 54-56)

Bản vẽ · ảnh gốc · vật liệu · deck được spec xếp vào loại **"dữ liệu nặng ở lại máy local"**.
`SPEC-ARCHINOTE-DETAIL-v1.md:138` có nhắc `projectId` *"khớp id `.idf`"* — nhưng đó là **ý định
thiết kế**, 0 dòng code hiện thực. Khớp với `docs/CLAUDE.md` của IF: *"không gọi nhau, chỉ cùng
đọc/ghi Lark Base (ATLAS)"*.

**Kết luận §4:** hiện trạng KHỚP chủ trương spec (không nối trực tiếp), nhưng **cầu Lark
`PROJECT_STATUS` chưa được xây ở cả hai đầu** — bên ArchiNote không có bảng/trường nào tên
`PROJECT_STATUS`, `stage`, `percent`.

---

## 5 · THIẾU SO VỚI SPEC — đối chiếu 1-1 (`SPEC-ARCHINOTE-DETAIL-v1.md` phần C)

| Mã | Tính năng | Code thật | Ghi chú |
|---|---|---|---|
| AN-0.1 | Auth riêng (NextAuth) | ✅ | `src/auth.ts` 166 dòng |
| AN-0.2 | Đọc Lark server-side, token không lộ client | ✅ | `grep NEXT_PUBLIC.*LARK src/` → 0 |
| AN-0.4 | **Capacitor (chạy điện thoại)** | 🔴 **0%** | không dep `capacitor`, không `ios/`·`android/` — **mâu thuẫn định vị "máy THU chạy trên điện thoại"** |
| AN-0.5 | Offline-first | 🔴 0% | không tầng cache nào |
| AN-0.6 | Upload queue nền | 🔴 0% | |
| AN-0.7 | Ghi Lark có kiểm soát | ⬜ *(chặn cứng chủ đích)* | 0 lời gọi ghi — đúng ý đồ, không phải sót |
| AN-1.1→1.7 | Điều phối (Gantt·Kanban·Lịch·Cờ đỏ·Tải người) | ✅ | ⚠️ AN-1.1 chấm ✅ nhưng `StaffList` **mồ côi** (§2.1) |
| AN-1.8 | Nút xin/trả người | 🔴 | |
| AN-1.9 | Duyệt 1 chạm | 🔴 | |
| AN-1.10 | Nhật ký điều phối | 🔴 | |
| AN-1.11 | **Đồng bộ `PROJECT_STATUS` 2 chiều (cầu sang IF)** | 🔴 | **đây chính là cầu nối 2 app — chưa có ở cả 2 đầu** |
| AN-2 | **Hiện trường** (LiDAR·laser·ảnh điểm đo·ghi âm STT·panorama·SunCalc) | 🔴 **0% toàn module** | `grep -rni "lidar\|panorama\|suncalc\|whisper" src/` → 0 |
| AN-3 | **Trợ lý & tra cứu** (Ops Assistant·ATLAS·từ điển KTS) | 🔴 **0% toàn module** | không route trợ lý nào |
| AN-4 | **Vị trí & an toàn** (bản đồ·geofence·SOS) | 🔴 **0% toàn module** | không geolocation API |
| AN-5 | Hạ tầng nền (offline·nén·tự gắn ngữ cảnh) | 🔴 **0% toàn module** | |

**Giao diện:** `SPEC-ARCHINOTE-UI-2026-08-03` đòi kem 90% / vàng ≤5% / tím ≤1%, nút ≥56px,
mobile-first. `src/app/globals.css` hiện dùng `--color-accent: #8a6a45` (nâu đất) +
`--color-paper: #f6f3ee` — **chưa áp bộ token nào của spec mới**, và cũng chưa port token IF.
Không rõ là "chưa làm" hay "cố ý chờ duyệt" — `BAO-CAO-ARCHINOTE.md` cuối file ghi *"⛔ Đang
dừng. Chưa code. Chờ duyệt."*

---

## 6 · BỐN VIỆC CẦN HOÀ QUYẾT

1. **Một repo hay hai?** `~/Downloads/archinote` rỗng đang song song với `ttt-tasks` có code.
   `BAO-CAO-ARCHINOTE.md §1 Q1` đã hỏi (A: kéo ttt-tasks về · B: hai repo · C: viết lại) —
   **chưa thấy dấu vết Hoà trả lời**. Việc này chặn mọi việc sau; càng để lâu càng nhiều bản sao spec.
2. **Commit `SPEC-ARCHINOTE-UI-2026-08-03.md`** — đang untracked ở cả 2 repo, mất là mất hẳn.
3. **`PROJECT_STATUS`** — cầu duy nhất spec cho phép giữa 2 app, hiện 0% ở cả hai đầu. Nếu muốn
   "chung một nguồn sự thật" thì phải chốt tên bảng + tên trường + ai đẩy trước.
4. **Rà `fixtures.ts` 259 dòng** xem có tên nhân sự thật không (luật trung tính).

## 7 · PHIÊN NÀY KHÔNG KIỂM ĐƯỢC

- **Giá trị env thật** của cả 2 app ⇒ không chứng minh được hai bên có trỏ cùng một Lark Base hay không.
- **Runtime**: không chạy dev server/gọi Lark (đúng phạm vi "chỉ chẩn đoán"), nên chỉ xác nhận
  đường code, không xác nhận số liệu 46 việc / 115 người.
- **Đối chiếu tên thật trong fixtures** — không có danh sách nhân sự thật để so.
- **`.feedback/comments.json`** — gitignored, không đọc (có thể chứa góp ý riêng tư).
- Chưa grep sâu code trong `interiorflow-phu`/`interiorflow-g4` (chỉ xác nhận qua `find` rằng
  chúng chỉ chứa bản sao `.md`, không phải app ArchiNote riêng).
