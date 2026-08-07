# M-DATA-OUT — phiên p12 (07/08)

Vùng sở hữu: `prisma/` · `lib/workspace/` (thực tế là file `lib/workspace.ts`) · `lib/server/` ·
`app/api/flows/` · `lib/integrations/`. KHÔNG đụng `lib/cad/` (p9) · `lib/boq/` (p2) ·
`lib/materials/` (p13) · `components/` (p3). **V6 — CHƯA COMMIT.**

Đã đọc trước khi làm: `docs/M-SCOPE-OUT.md` (trọn 305 dòng) + `docs/GAP-IF.md` dòng 81, 92-97,
104, 105.

> ⚠️ **§0ab áp dụng nặng cho phiếu này**: phần lớn các dòng GAP được giao đã bị phiên p1
> (M-SCOPE, cùng ngày) làm xong một phần lớn — sổ chưa cập nhật. Dưới đây từng mục ghi rõ cái gì
> p1 đã làm (kiểm lại bằng code/DB thật, không tin báo cáo suông — N1) và cái gì phiên này (p12)
> làm THÊM.

---

## VIỆC 1 — G-M14-01/02 flow mồ côi (:104/:105)

**Tìm gốc — KHÔNG làm lại từ đầu**: `M-SCOPE-OUT.md` VIỆC 1 đã đào xong gốc, tôi kiểm lại bằng
code thật (N1) và xác nhận đúng:
- `lib/workspace.ts:45` `createFlow(name, graphJson)` KHÔNG có tham số `projectId`, trong khi
  `app/api/flows/route.ts:88-99` (POST) đã đọc `body.projectId` + `assertProjectAccess` sẵn từ lâu
  — server chờ, client không có cách truyền.
- 5 điểm gọi tạo flow trần: 3 ở `components/` (WelcomeIntro ×2 · ProjectSelect · FlowsPanel — vùng
  p3) + `lib/workspace.ts:143` `bootstrapWorkspace` (vùng TÔI).

**Đã sửa (trong quyền, sửa GỐC chứ không gán bừa):**
1. `lib/workspace.ts` — `createFlow(name, graphJson, projectId?)`: thêm tham số thứ 3 optional,
   forward vào body POST. Caller cũ gọi 2 tham số chạy y nguyên (additive).
2. `lib/workspace.ts` `bootstrapWorkspace()` — tài khoản mới đăng nhập lần đầu nay tạo
   **Project bọc ngoài trước** (`createProject(firstName)`) rồi gắn flow đầu tiên vào
   (`createFlow(..., project.id)`). Tạo Project thất bại → fallback flow trần như cũ, onboarding
   không chết vì thiếu vỏ. **Từ nay tài khoản mới không còn đẻ flow mồ côi.**

**⛔ TUÂN LỆNH CỨNG — KHÔNG script gán bừa 41 flow cũ**: không có tín hiệu đáng tin nào suy ra
flow mồ côi thuộc project nào (M-SCOPE đã kết luận, tôi đồng ý — gán bừa là bịa dữ liệu).
Lối thoát cho flow cũ đã có sẵn: tay qua `FlowsPanel` + nút "Nhập bản vẽ có sẵn" ở
`ProjectScopeEmptyState` (p1 làm, verify browser rồi).

**Số đo (VERIFY):** flow mồ côi (projectId null, chưa xoá) **TRƯỚC = 40 · SAU = 40** — đúng thiết
kế: phiên này chặn nguồn ĐẺ mồ côi mới, không đụng dữ liệu cũ.

**Còn cho phiếu khác (p3):** truyền `projectId` ở 3 điểm gọi `components/` (WelcomeIntro:54,70 ·
ProjectSelect:605 · FlowsPanel:85) — chữ ký hàm đã sẵn sàng nhận.

G-M14-02 (màn trắng): p1 đã làm `ProjectScopeEmptyState` cho `/cad` + `/present` (verify browser
trong M-SCOPE-OUT VIỆC 5); còn thiếu `/render` + `/photo` — ngoài quyền p12 (`app/projects/` không
thuộc sở hữu phiếu này), giữ nguyên ghi nhận của p1.

## VIỆC 2 — tầng dữ liệu G-M10-01…06 (:92-97), kiểm TỪNG DÒNG

| Mã | Sổ nói | Đo lại 07/08 (p12) | Việc p12 làm |
|---|---|---|---|
| G-M10-01 | không có `model Task` | **SỔ CŨ** — p1 đã thêm `Task`+`WorkflowState` vào `prisma/schema.prisma:514,530` + CRUD `lib/server/tasks.ts` + routes `app/api/tasks/*`; test 8/8 pass (chạy lại) | migrate THỬ trên bản sao — xem dưới; bảng thật chờ Hoà chạy lệnh |
| G-M10-02 | `ExternalRef` khai chưa migrate | ĐÚNG — `dev.db` thật chưa có bảng (`no such table`) | **đã chạy thử `db push` trên BẢN SAO: sạch, 23ms, 0 mất dữ liệu** (bảng đối chiếu count 5 bảng cũ khớp 100%) |
| G-M10-03 | 3 file sổ lệch | ① LICENSE-NOTES §5 "chưa đưa vào CI" — ĐÚNG là lệch: `license:check` đã là bước đầu `npm test` | ① **đã sửa** — đính chính có ngày trong `docs/LICENSE-NOTES.md §5` (gate đã có ở `npm test`; CI server riêng thì đúng là chưa — `.github/workflows` không tồn tại). ② README-mocks "lệch 3 điểm" — sổ KHÔNG liệt kê 3 điểm nào, nguồn gốc ở PHU-OUT: **để TỔNG** (đúng ghi chú trong chính dòng GAP). ③ cặp mock "Lịch việc" trùng (`Lịch việc.dc.html` + `Lịch · Nhắc việc.dc.html`, tìm bằng so NFC): chọn bản chốt là quyết định THIẾT KẾ — **để TỔNG/Hoà** |
| G-M10-04 | mock Gantt không mở được ngoài công cụ | **MỘT NỬA SỔ CŨ**: file thiếu `./support.js` thật (grep `src="./support.js"` có, file không tồn tại cạnh nó) NHƯNG body chứa **5.184 ký tự markup tĩnh thật** — trường dữ liệu ĐỐI CHIẾU ĐƯỢC với `SPEC-GANTT-DATA.md` bằng đọc HTML, chỉ mất phần tương tác | không sửa được từ phía repo (script là của công cụ thiết kế) — cần COWORK-UI xuất lại kèm asset, HOẶC chấp nhận đọc tĩnh (đề xuất: chấp nhận, vì mục đích là đối chiếu field) |
| G-M10-05 | `.idf` thiếu field external | ĐÚNG, thiết kế nằm `PHUONG-AN-CAU-IDF.md` | **BỊ CHẶN QUYỀN** — `lib/cad/idf.ts` thuộc p9, phiếu này cấm đụng `lib/cad/`. Không làm, không lách |
| G-M10-06 | docstring `idf.ts:1-6` nghi không khớp (`photos` không có trong `IdfFile`) — PHU gắn CHƯA VERIFY vì chưa đọc `model.ts` | **ĐÃ VERIFY HỘ (chỉ ĐỌC, không sửa file p9)**: `lib/cad/model.ts:905` `photos?: PhotoEmbed[]` **CÓ trong `Doc`**, và docstring idf.ts viết "chứa toàn bộ **Doc** (entities/layers/markups/photos)" — photos đi theo Doc, KHÔNG cần field cấp `IdfFile`. ⇒ **docstring ĐÚNG, GAP-dòng-97 là báo động nhầm** | báo TỔNG đóng dòng 97 = "không phải lỗi" |

## VIỆC 3 — G-M9-01 tên nhà cung cấp trong xương dữ liệu (:81)

**Đo lại:** bảng cầu `ExternalRef { system, externalId, entityType, entityId }` mà phiếu nói
"THIẾU" — **ĐÃ CÓ trong schema** (`prisma/schema.prisma:549`, p1 thêm, kèm `lastWriteBy/At`
chống vòng lặp). Tầng adapter đúng như phiếu nói (`lib/integrations/providers/` + registry).
Cầu `LarkUserMap` đã có dual-write (`lib/integrations/lark-bridge.ts`, p1). Còn thiếu thật:

**p12 làm thêm:**
1. `prisma/schema.prisma` — ghi chú DEPRECATED-ĐANG-CHUYỂN lên `Project.larkProjectCode` (cột
   vendor-name trong bảng LÕI, vi phạm §0v) — chỉ COMMENT, không đổi cột. Grep xác nhận **13
   file** đang đọc `larkProjectCode` ⇒ đúng luật CẤM "không đổi tên trường đang được đọc".
2. `scripts/migrate-lark-project-code-to-external-ref.ts` (MỚI) — backfill
   `Project.larkProjectCode` → `ExternalRef{system:'lark', entityType:'project'}`, idempotent,
   cùng khuôn script LarkUserMap của p1.
3. **Chạy thử END-TO-END cả 2 script trên BẢN SAO** (không phải chỉ đọc code):
   - seed 1 dòng `LarkUserMap` + 1 `larkProjectCode='99999'` vào bản sao
   - chạy cả 2 script → `ExternalRef` bản sao ra đúng 2 dòng:
     `lark|An.LNT.test|person|demo_seed_001` · `lark|99999|project|cmrqo009h0003w9ddwcuxaki6`
   - chạy LẠI lần 2 → vẫn 2 dòng (idempotent thật, không nhân đôi)

### ①②③ an toàn migrate (bắt buộc theo phiếu)

**① Sao lưu:** `sqlite3 prisma/dev.db ".backup ..."` đã chạy, bản sao tại:
```
/private/tmp/claude-501/-Users-tranben-Downloads-interiorflow/4f4de0fd-0a23-4999-94dd-bb7ee1621967/scratchpad/db-test/dev.db.bak-p12-truoc-migrate
```
⚠️ đường dẫn scratchpad SỐNG THEO PHIÊN — Hoà nên tự backup lại NGAY TRƯỚC khi migrate thật
(lệnh ở ③), đừng dựa vào bản này lâu dài.

**② Lệnh HOÀN TÁC** (migration hoàn toàn additive — 3 bảng mới, 0 cột sửa):
```bash
# Cách 1 (sạch nhất): khôi phục từ backup
cp prisma/dev.db.bak-truoc-externalref prisma/dev.db
# Cách 2 (nếu backup mất): chỉ cần bỏ 3 bảng mới — dữ liệu cũ chưa từng bị đụng
sqlite3 prisma/dev.db "DROP TABLE IF EXISTS ExternalRef; DROP TABLE IF EXISTS Task; DROP TABLE IF EXISTS WorkflowState;"
# và đảm bảo 2 cờ vẫn false: TASK_TABLES_READY (lib/server/tasks.ts:22),
# EXTERNAL_REF_TABLE_READY (lib/integrations/external-ref.ts:47)
```

**③ Đã thử trên bản sao TRƯỚC** — `db push` trên copy: thành công 23ms, bảng mới tạo đủ 3, đối
chiếu count Flow/Project/User/LarkUserMap/ProductSpec bản sao vs gốc khớp 100%, orphan flow bản
sao = 40 = gốc. **KHÔNG chạy trên dev.db thật** — đúng luật vận hành ("KHÔNG prisma db push qua
sandbox") + 2 dev server khác (cổng 3000, 3002) đang giữ file. Lệnh trọn gói cho Hoà (máy thật,
tắt hết dev server trước):
```bash
sqlite3 prisma/dev.db ".backup 'prisma/dev.db.bak-truoc-externalref'"
npx prisma db push
npx prisma generate
# bật 2 cờ: TASK_TABLES_READY=true (lib/server/tasks.ts:22)
#           EXTERNAL_REF_TABLE_READY=true (lib/integrations/external-ref.ts:47)
node_modules/.bin/sucrase-node scripts/migrate-lark-user-map-to-external-ref.ts
node_modules/.bin/sucrase-node scripts/migrate-lark-project-code-to-external-ref.ts
```

**Ghi chú `prisma generate`:** phiên này ĐÃ chạy `npx prisma generate` (không nằm trong danh mục
cấm — cấm là `db push`/`migrate`/`VACUUM`) để test script trên bản sao. Client sinh ra có delegate
`externalRef`/`task`/`workflowState` nhưng **mọi đường code chạm chúng đều chặn sau 2 cờ READY
(đang false)** — runtime không query bảng chưa tồn tại. Dev server đang chạy giữ bản client cũ
trong RAM, restart mới ăn bản mới — vô hại.

---

## VERIFY (theo phiếu)

| Phép đo | Kết quả |
|---|---|
| `npx prisma migrate status` | "Database schema is up to date!" — ⚠️ **số này ĐÁNH LỪA**: nó chỉ so thư mục `prisma/migrations` (1 migration) với bảng `_prisma_migrations`, KHÔNG thấy schema.prisma đã vượt lên trước (Task/WorkflowState/ExternalRef khai mà chưa có bảng). Trạng thái thật đo bằng `sqlite3 .tables`: 3 bảng CHƯA có trong dev.db thật, ĐÃ có trên bản sao sau `db push` |
| `npx tsc --noEmit -p .` | **exit 0, 0 lỗi** (chạy sau mọi sửa đổi) |
| Flow mồ côi TRƯỚC / SAU | **40 / 40** (đúng thiết kế — chặn nguồn đẻ mới, không gán bừa cũ) |
| `lib/server/tasks.test.ts` | 8/8 pass |
| `lib/integrations/external-ref.test.ts` | 12/12 pass |
| `lib/integrations/anti-loop.test.ts` | 7/7 pass |
| 2 script migrate trên bản sao | end-to-end pass + idempotent (chạy 2 lần vẫn đúng số dòng) |

## BẢNG CUỐI LƯỢT (§V7)

| Việc | Trạng thái | Số đo / lý do |
|---|---|---|
| G-M14-01 gốc mồ côi | ✅ phần trong quyền — `createFlow(+projectId)` + `bootstrapWorkspace` bọc Project | mồ côi 40→40 (cố ý); 3 call-site `components/` chờ phiếu p3 |
| G-M14-02 màn trắng | ✅ đã có từ p1 (cad/present) — /render /photo còn thiếu, ngoài quyền p12 | — |
| G-M10-01 model Task | ✅ có sẵn (p1) — xác nhận test 8/8 | chờ migrate thật |
| G-M10-02 ExternalRef migrate | ✅ THỬ SẠCH trên bản sao — thật chờ Hoà chạy (lệnh + hoàn tác ở trên) | copy: 3 bảng mới, 0 mất dữ liệu |
| G-M10-03 sổ lệch | ✅ ① LICENSE-NOTES đã đính chính · 🟡 ②③ để TỔNG (thiếu chi tiết/quyết định design) | — |
| G-M10-04 mock Gantt | 🟡 một nửa sổ cũ — markup tĩnh 5.184 ký tự đọc được, chỉ mất tương tác | đề xuất chấp nhận đọc tĩnh |
| G-M10-05 .idf external | 🔴 treo — `lib/cad/` là vùng p9, phiếu cấm | cần phiếu cho p9 |
| G-M10-06 docstring idf | ✅ verify hộ: **báo động nhầm** — `photos` CÓ trong `Doc` (`model.ts:905`), docstring đúng | TỔNG đóng dòng 97 |
| G-M9-01 vendor trong lõi | ✅ bảng cầu có sẵn (p1) + p12 thêm deprecation note `larkProjectCode` + script backfill project-code, test end-to-end trên bản sao | xoá cột thật = đợt sau, 13 file đang đọc |
| CHƯA VERIFY | kéo-thả Kanban sống · API tasks sống — cần migrate thật + cờ bật (như p1 đã ghi) | — |

**Lệnh hoàn tác nếu cần lùi toàn phiên p12 (code):** `git checkout -- lib/workspace.ts prisma/schema.prisma docs/LICENSE-NOTES.md && rm scripts/migrate-lark-project-code-to-external-ref.ts docs/M-DATA-OUT.md` (chỉ chạy khi Hoà muốn bỏ trọn — mọi thứ chưa commit theo V6).
