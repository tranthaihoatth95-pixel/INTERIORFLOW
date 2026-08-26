# FIX-500 — `GET /api/project-asset-usage?assetId=` trả 500 body rỗng

Phiên: WORKER lane EXECUTION · 20/08/2026 · mốc `c7f3ac8` (main)
Phạm vi ghi: `app/api/project-asset-usage/route.ts` · `app/api/project-asset-usage/[id]/route.ts` ·
`app/api/project-asset-usage/route.guard.test.ts` (mới). Không đụng `lib/server/*`, schema, UI. Không git.

---

## ⓪ TIỀN ĐỀ — xác nhận / bác bỏ

| Tiền đề trong phiếu | Kết luận |
|---|---|
| `git log -1` = `c7f3ac8`, nhánh `main` | ✅ đúng |
| Browser thật (có session) → `500` body RỖNG | ✅ tái hiện được bằng curl + cookie tự ký (xem §1) |
| `curl` không cookie → 401 | ✅ đúng — do `middleware.ts:52` chặn trước, không tới route |
| Query Prisma chạy tay thì OK | ✅ đúng — và chính chỗ này là manh mối quyết định |
| **Giả thuyết MAIN**: `getSessionUser()` / `projectMember.findMany` ngoài try nên lỗi thoát ra | 🟡 **ĐÚNG NỬA**. Đúng rằng `errResponse()` `throw e` là thứ biến mọi lỗi thành 500 câm, và `getSessionUser()` nằm ngoài try. **SAI ở chỗ nguồn lỗi**: không phải auth, không phải `projectMember` |
| **Giả thuyết bổ sung của MAIN**: session stale (user trong cookie không còn trong DB) | ⛔ **BÁC**. MAIN tự kiểm chứng độc lập sau đó và cũng bác: `/api/library` và `/api/tasks` cùng session đều 200 |

---

## ① NGUYÊN NHÂN THẬT — đo được, không đoán

> **Tiến trình dev server 3001 đang chạy một bản Prisma Client CŨ, sinh ra TRƯỚC khi model
> `ProjectAssetUsage` tồn tại. Trong tiến trình đó `prisma.projectAssetUsage === undefined`,
> nên `.findMany` ném `TypeError`. `errResponse()` ném tiếp ra ngoài ⇒ Next trả 500 body rỗng.**

Bằng chứng, theo thứ tự thu được:

1. **Tái hiện**: tự ký cookie phiên bằng `AUTH_SECRET` trong `.env` + `userId` thật →
   `GET ?assetId=cmsshuywg0001w90hkws755g5` → `status=500`, body rỗng. Cùng lúc `?projectId=nope`
   → `404` có body, `?` (thiếu param) → `400` có body ⇒ chỉ nhánh `assetId` chết.
2. **Bắt được thông điệp** sau khi thay `errResponse` bằng `loiJson`:
   `TypeError: Cannot read properties of undefined (reading 'findMany')`.
3. **Dò trực tiếp trong tiến trình server** (probe tạm, đã gỡ):
   `{ pau: "undefined", pm: "object", la: "object" }` — `projectAssetUsage` **undefined**, còn
   `projectMember` / `libraryAsset` bình thường ⇒ không phải Prisma hỏng, chỉ thiếu ĐÚNG model mới.
4. **Mốc thời gian khớp**:
   - dev server 3001 (`next-server v14.2.35`, pid 20546) khởi động **Tue 18/08 09:48:15**
   - `node_modules/.prisma/client/index.js` sinh lại **20/08 00:23:02**
   - `grep -c projectAssetUsage node_modules/.prisma/client/index.d.ts` = **29** (client trên đĩa CÓ model)
   ⇒ tiến trình Node sống dai giữ bản cũ trong module cache.

**Vì sao mọi kiểm chứng khác đều xanh mà bug vẫn sống:** query chạy tay, `route.test.ts` 10/10,
`npm run tsc` — cả ba đều **nạp Prisma Client mới**. Chỉ tiến trình server dài hạn mới thấy bản cũ.
Đây đúng họ lỗi *"có trong mã, không tới được người dùng"* đã ghi 16/08.

**Cách chữa nguyên nhân: KHỞI ĐỘNG LẠI dev server.** Không có dòng query nào sai.
(Không tự restart theo ràng buộc phiếu — Hoà restart, MAIN verify browser.)

---

## ② ĐÃ SỬA GÌ

Nguyên nhân là vận hành, nhưng **thứ khiến nó tốn một buổi để chẩn là error-boundary** — đó là bug thật và đã đóng.

1. **`errResponse()` → `loiJson()`** ở cả hai route file. Không còn `throw e`. Lỗi không lường trước
   → `500` + `{error, detail}` (`detail` chỉ ngoài production) + `console.error` kèm stack.
2. **Bọc TRỌN handler trong `try`, kể cả `getSessionUser()`**: `GET`/`POST`/`DELETE` nay là vỏ mỏng
   gọi `getHandler`/`postHandler`/`deleteHandler` trong `try/catch`. Lỗi hạ tầng ở khâu đọc phiên
   cũng ra JSON, không còn 500 câm.
3. **`kiemDelegate()` — guard nói tiếng người**: nếu `prisma.projectAssetUsage` undefined →
   `503` + *"Prisma Client đang chạy KHÔNG có model ProjectAssetUsage — tiến trình server khởi động
   trước lần `prisma generate` gần nhất. KHỞI ĐỘNG LẠI dev server (không phải lỗi dữ liệu)."*
   Đặt **SAU** kiểm 401 để khách vãng lai không thấy nội tạng server.
4. **Bảng mã lỗi viết thành docstring** trong `route.ts` (401/403/404/400/503/500) + chốt quy ước
   where-used luôn `200 + mảng`, kèm lý do, kèm test khoá.

`AccessError` giữ nguyên status của nó (401/403/404) — `loiJson` không đè.

---

## ③ TEST

**`route.guard.test.ts` (mới) — 18 assertions PASS.** Gọi THẲNG `GET`/`POST`/`DELETE` thật với
phiên giả lập (stub `jose` + `next/headers`, vá alias `@/` cho sucrase-node — tất cả tại chỗ trong
file test, không đụng hạ tầng chung). Mọi ca đều khẳng định *handler trả Response, body không rỗng, parse được JSON*:

| Ca | Kỳ vọng |
|---|---|
| Chưa đăng nhập (3 nhánh GET) | 401 + JSON |
| **Phiên chết** — user trong cookie không còn trong DB | 401 (không nới auth) |
| Token hỏng/hết hạn | 401 |
| Thiếu param / truyền cả hai | 400 |
| `projectId` không tồn tại | 404 (AccessError giữ status) |
| where-used, asset chưa ai dùng | **200 + `[]`** |
| where-used, `assetId` bịa | **200 + `[]`** (cùng quy ước, đã khoá) |
| where-used, cookie hợp lệ, có usage | 200 + đúng 1 project |
| `?projectId=` là member | 200 + list |
| Người NGOÀI dự án hỏi where-used | 200 + `[]` — không rò rỉ |
| Người ngoài mở `?projectId=` | 404 — không lộ sự tồn tại |
| **Usage đã soft-delete** | biến mất khỏi where-used |
| `DELETE` id không tồn tại | 404 |
| `POST` body JSON hỏng / thiếu trường | 400 |
| `POST` assetId không tồn tại | 404 |
| **Prisma Client thiếu delegate** (tái hiện ca thật) | **503 + body chỉ rõ cách chữa, KHÔNG ném** |
| Bất biến nguồn: không còn `throw e` ở cả 2 route file | grep khoá |

**Đối chứng âm (test không rỗng nghĩa):** dựng lại đúng hình dạng bug cũ (`errResponse` + `throw e`,
`getSessionUser` ngoài try) → test **ĐỎ** ngay ca đầu: *"handler NÉM lỗi ra ngoài … đây chính là bug
500-body-rỗng"*. Khôi phục → xanh lại.

---

## ④ NGHIỆM THU

| Cổng | Kết quả |
|---|---|
| `npm run tsc` | ✅ 0 lỗi |
| `route.test.ts` (cũ) | ✅ **10/10 PASS**, không sửa dòng nào |
| `route.guard.test.ts` (mới) | ✅ **18/18 PASS** |
| curl **không cookie** → server 3001 | ✅ `401 {"error":"unauthorized"}` |
| curl **có session** → server 3001 | ✅ `503` + thông điệp chỉ cách chữa (trước: `500` body rỗng) |
| curl `DELETE /[id]` có session | ✅ `503` + body, không 500 câm |
| `git status` | ✅ chỉ `app/api/project-asset-usage/` (untracked), không commit |

**Không còn nhánh nào trả 500 body rỗng.**

---

## ⑤ BÀI HỌC

- **Tiến trình sống dai + `prisma generate` = một lớp lệch không máy soi nào hiện có bắt được.**
  Không phải lệch sổ↔code, không phải lệch nhãn, không phải lệch hình học. Nó là *bản đang chạy ≠
  bản trên đĩa*. Cùng họ với ca `.next` hỏng đã ghi §0aa.
- **`throw e` trong lớp xử lý lỗi là bẫy tự đặt.** Nó biến mọi lỗi lạ thành 500 câm — đúng lúc cần
  thông tin nhất thì không có gì. Giá phải trả đo được: một buổi chẩn cho một `TypeError` một dòng.
- **Test mô phỏng logic ≠ test gọi handler.** `route.test.ts` 10/10 xanh mà bug sống nguyên, vì nó
  chạy Prisma trực tiếp chứ không đi qua route. Loại test còn thiếu chính là `route.guard.test.ts`.
- **Guard nên nói cách chữa, không chỉ báo lỗi.** *"KHỞI ĐỘNG LẠI dev server"* rẻ hơn một `TypeError`
  câm đúng bằng cả buổi chẩn này.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- **Chưa xác nhận sau khi restart server thì `?assetId=` trả 200.** Suy luận rất chắc (client trên
  đĩa có model, query chạy tay OK, test tích hợp 10/10) nhưng **chưa đo trên server mới** — phiếu cấm
  tự khởi động lại. Đây là mục MAIN/Hoà phải verify.
- **Chỉ đo trên server 3001.** Không kiểm các port khác / bản `next build` production.
- **Nhánh `NODE_ENV === 'production'`** (ẩn `detail`) **chưa chạy lần nào** — đọc mã, không đo.
- **Test dùng `jose` và `next/headers` giả.** Chứng minh logic phân loại lỗi của handler, KHÔNG
  chứng minh hành vi cookie/JWT thật (phần đó do `lib/server/auth.ts` lo, ngoài phạm vi ghi).
- **`kiemDelegate` chỉ canh `projectAssetUsage`.** Model mới khác vẫn có thể lặp lại cùng bệnh ở
  route khác — chưa có cơ chế chung.
- **Chưa chạy `npm test` toàn bộ** (nặng, và đang có phiên song song). Đã chạy: `tsc` + 2 test của
  đúng vùng này.
- **Không biết vì sao dev server 3001 sống từ 18/08.** Không kiểm tra có phiên nào khác phụ thuộc nó.

## ⑦c HẠN DÙNG KẾT LUẬN

- Kết luận **"nguyên nhân là Prisma Client cũ trong tiến trình"** hết hiệu lực **ngay khi server 3001
  được khởi động lại**. Sau đó nếu vẫn 500 thì là bug KHÁC — và lần này sẽ có `console.error` + body
  JSON để chẩn ngay, không phải mò lại từ đầu.
- **`kiemDelegate()` là chốt chặn tạm cho lớp lệch vận hành**, không phải tính năng. Khi có cơ chế
  chung (vd cổng kiểm client-vs-schema lúc khởi động, hoặc máy đối chiếu sổ↔code `P-S`), nên gỡ nó
  về một chỗ dùng chung thay vì chép ở từng route.
- **Quy ước where-used `200 + []`** đúng tới khi có yêu cầu ngược lại từ downstream (H9). Đổi thì
  phải sửa test khoá trong `route.guard.test.ts` — cố ý làm nó phải sửa có ý thức.
- **Số đo mốc thời gian** (server 18/08 09:48 · client 20/08 00:23) đúng tại thời điểm phiên này;
  đọc lại sau restart sẽ khác.
