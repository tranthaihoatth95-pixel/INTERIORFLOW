# IF-CORE-GAP-MAP · S0

> Nguồn: **audit đã có** (`IF-ARCH-LOCAL-FIRST-LARK-001` — 3 phiên read-only) + **delta hẹp** lượt này.
> Theo đúng packet: *"Do not repeat a whole-repo inventory merely to feel safe."*
> HEAD `6c9712a` · **0 dev server đang chạy ⇒ 0 bằng chứng runtime ⇒ KHÔNG có `EXISTS-RUNTIME-PROVEN`.**

**Nhãn:** `EXISTS-RUNTIME-PROVEN` · `EXISTS-PARTIAL` · `CANDIDATE-ONLY` · `MISSING` · `UNKNOWN`

---

| # | Capability | Giá trị công việc | Đã có gì (OBSERVED) | Bằng chứng runtime | Nợ / lỗi đã biết | Hợp đồng thiếu | Lát mỏng kế tiếp | Nhãn |
|---|---|---|---|---|---|---|---|---|
| **C1** | identity · auth · session · giao tệp an toàn | ai vào được, thấy gì | JWT HS256 30d · bcrypt 10 · OAuth Google/MS · 3 tầng cửa (`middleware.ts:51` → `auth.ts:109` → `access.ts:32`) · 404-thay-403 · sniff MIME 2 đầu · `nosniff`+`attachment` | ❌ | 🔴 `AUTH_SECRET` fallback hardcode (`auth.ts:46`·`middleware.ts:34`) · 🔴 `public/comments-images/` **không xác thực** (`comments/route.ts:42`·`middleware.ts:76`) · cookie thiếu `secure` · không rate-limit login · `library/[id]/file` thiếu guard traversal | fail-closed cho `AUTH_SECRET` | **Q12: thiếu secret ⇒ từ chối khởi động.** Khuôn có sẵn `crypto.ts:16`. 1 dòng | **EXISTS-PARTIAL** |
| **C2** | tenant · org · membership · assignment · permission | ranh giới khách hàng | `ProjectMember` + `assertProjectAccess` **chỉ phủ cây Project** · `visibleProjectIds()` viết sẵn **chưa dùng** (`access.ts:73-80`) | ❌ | 🔴 **không có tenant** · 6 bảng nằm NGOÀI mô hình quyền · `library`·`specs`·`asset-representation`·`chat`·`lark-tasks`·roster `User` không lọc | Organization→…→Person + 4 đồ thị rời (đã dựng `04-NEUTRAL-CONTRACT`) | thêm `tenantId` + bật `visibleProjectIds()` | **MISSING** *(tenant)* / **EXISTS-PARTIAL** *(project)* |
| **C3** | project · workspace · canvas · revision · recovery | không mất việc | `rev-guard.ts` + test · soft-delete · snapshot DB+uploads **trước mỗi nâng cấp** (`main.js:134-175`) · `backup-offsite.mjs` giữ 7 bản | ❌ | không audit trail · `@@unique` **không gồm `deletedAt`** ở `ProjectMember`/`ProjectAssetUsage` · backup **plaintext** | audit trail | bảng audit (backlog 0.4) | **EXISTS-PARTIAL** |
| **C4** | resource · library · knowledge · provenance · search | tìm lại được | `LibraryAsset` + `AssetRepresentation` · notebook RAG đủ luồng ingest→chunk→embed (`source/route.ts:96-230`) · `contentHash` index | ❌ | 🔴 `library` GET **trả asset mọi user** (comment khai rõ) · **không có model provenance** · notebook chặn theo **owner**, loại nhầm member (`resolveProject.ts:34-45`) | `Provenance{externalId,source,syncedAt,stale,confidence}` | nhúng provenance + phạm vi | **EXISTS-PARTIAL** |
| **C5** | component · `.idfc` import/apply/edit/export/reopen | dùng lại cấu kiện | tham chiếu `.idfc` trong `lib/materials/{matid-identity,schema}.ts` · `lib/capabilities/{image-to-3d,anh-thanh-spec,compound}.ts` | ❌ | **chưa đo** hợp đồng `.idfc` đầy đủ · chưa rõ có luồng reopen không | luật cấu trúc lặp *(4 chân ghế = 2 Definition × instance, không copy hình)* | **đọc hợp đồng `.idfc` hiện có TRƯỚC khi mở rộng** | **UNKNOWN** |
| **C6** | material · PBR · connector vendor · cache offline | vật liệu thật | `ProductSpec` 24 model · `atlas-materials/sync` · `lib/materials/schema.ts` | ❌ | `specs` GET không lọc · chưa có PBR bundle · chưa có cache offline có nhãn | `IF-MATERIAL-CONNECTOR-001` — **chờ API/export thật, cấm suy từ ảnh chụp** | xin tài liệu API hoặc bản xuất mẫu | **EXISTS-PARTIAL** |
| **C7** | 2D · CAD · đo · kiểm tra tất định | bản vẽ đúng | `lib/cad/` **85 tệp test** · `ai-layout-feedback` · `block-library-infer` · `backup-diff` · auto-backup | ❌ | chưa đo độ phủ thật của 85 test · chưa rõ có validation tất định không | Design Brief / Parametric Sheet | đọc `lib/cad/` **hẹp**, chỉ phần validation | **EXISTS-PARTIAL** |
| **C8** | 3D · vật liệu · đèn · máy quay · render | hình ra được | Blender (93 chỗ) · NVIDIA (57) · ComfyUI (29) · `render/fbx` degrade **tường minh 501** · fal.ai · SD | ❌ | không timeout ở phần lớn connector · SD không có bằng chứng retry/timeout | Quick→Guided→Deep | timeout + huỷ + tiến trình | **EXISTS-PARTIAL** |
| **C9** | Present · PDF/PPTX/HTML/video · mở lại | giao khách | `lib/pptx.ts` + **test nhúng font** (`pptx-font-embed.test.ts`) · `present/text` route · artboard Trình bày đã dựng | ❌ | chưa đo luồng **reopen** · chưa có audit khi export | export có audit + provenance | chứng minh export→reopen giữ nguyên identity | **EXISTS-PARTIAL** |
| **C10** | cộng tác · flow · review · issue · bằng chứng công trường | làm chung | `cursors` (RAM-only) · `comments` (**tệp JSON**, không DB) · `ProjectMember` · `CuaSoThaoLuan` | ❌ | 🔴 `comments` PATCH/DELETE **không kiểm sở hữu** · ảnh góp ý **công khai** · cursors mất khi restart · không kiểm quyền flow khi poll `?flowId=` | presence ≠ membership ≠ assignment | đưa `comments` vào DB + cửa quyền | **EXISTS-PARTIAL** |
| **C11** | AI registry · thực thi tool · provenance · xác nhận | AI dùng được | `lib/ai/models.ts` · `tiers.ts` + test · `premium-models.ts` · `providers/` · `text-tier` · `webgpu` · lỗi **typed** (`NvidiaFreeExhausted`) không giả trả lời | ❌ | chưa có provenance đầy đủ cho từng đầu ra · chưa có queue/cancel/cost thống nhất | mỗi đầu ra: target·nguồn·model·version·cost·rights·revision·undo | gắn provenance vào **một** playbook trước | **EXISTS-PARTIAL** |
| **C12** | a11y · nhập liệu · hiệu năng · an ninh · khôi phục | dùng được thật | Electron gần hoàn hảo: `contextIsolation:true`·`nodeIntegration:false`·`sandbox:true`·preload **0 kênh IPC**·bind `127.0.0.1` **cả 3 chỗ** · DB lỗi ⇒ **503 không phải 401** | ❌ | **không CSP** · không `will-navigate` guard · SQLite **không mã hoá** · chưa đo a11y/reduced-motion/1100px | ma trận a11y + parity nhập liệu | thêm CSP *(rẻ, không phá gì)* | **EXISTS-PARTIAL** |

---

## Đọc bản đồ này thế nào

**Không có dòng nào `EXISTS-RUNTIME-PROVEN`** — và đó là **kết quả đúng**, không phải thiếu sót:
lượt này **0 dev server chạy**, nên không có bằng chứng runtime nào. Packet nói rõ:
*"code existence is not runtime PASS"*.

**Một dòng `MISSING`:** C2 tenant. Đó là dòng **chặn nhiều dòng khác nhất** —
C4 · C6 · C10 đều có lỗ rò cùng một nguyên nhân: **nằm ngoài mô hình quyền**.

**Một dòng `UNKNOWN`:** C5 `.idfc`. Packet cấm mở rộng trước khi đọc hợp đồng hiện có
⇒ đây là việc **đọc trước**, không phải việc **xây**.

**Điều bản đồ này sửa so với giả định của tôi:** C7 · C9 · C11 chín hơn hẳn mức tôi tưởng.
`lib/cad/` **85 tệp test** không phải một prototype. Nếu tôi không đo delta mà cứ theo cảm giác,
tôi đã xếp chúng vào `CANDIDATE-ONLY` và **đề xuất xây lại thứ đã có** — đúng lỗi N8 đã bị bắt ba lần hôm nay.
