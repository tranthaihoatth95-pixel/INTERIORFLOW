# ⑦ RISKS + UNKNOWN

> Nguồn: Phiên A · B · D — read-only. HEAD `a08378a`.

---

## PHẦN I · RỦI RO — xếp theo mức, có bằng chứng

### 🔴 R1 · KHÔNG CÓ TENANT — và nó KHÔNG phải lỗi sót
| | |
|---|---|
| bằng chứng | `prisma/schema.prisma` toàn tệp — 0 model tenant/org · `app/api/library/route.ts:7,11-15` comment nói thẳng *"GET trả tất cả asset của mọi user"* |
| loại | OBSERVED · cao |

**Cách hiểu đúng, và đây là điểm tinh tế nhất của cả gói:**
`ProjectMember` **chỉ phủ cây `Project`**. Mọi bảng ngoài cây đó — `LibraryAsset` · `ProductSpec` ·
`AssetRepresentation` · `ChatMessage` · `LarkPersonRef` · roster `User` — **rơi RA NGOÀI mô hình quyền**,
không phải *bị bỏ sót trong* mô hình quyền.

⇒ **Vá từng route không giải quyết được.** Cần cột phạm vi ở **≥6 bảng** + một wave sửa route.
`visibleProjectIds()` (`access.ts:73-80`) **đã tồn tại và đang chờ** đúng việc đó — comment ghi *"bật lọc ở wave sau"*.

### 🔴 R2 · `AUTH_SECRET` có fallback hardcode
`lib/server/auth.ts:46` · `middleware.ts:34`.
Electron **được cứu** (tự sinh secret, `electron/main.js:224-226`). Web **không** — và `vercel.json` có trong repo.
Thiếu biến ⇒ JWT ký bằng hằng số **nằm công khai trong mã** ⇒ ai cũng đúc được cookie `sub=<bất kỳ>`, kể cả `isAdmin`.

> **Khuôn đúng đã có sẵn trong chính repo:** `lib/integrations/crypto.ts:16` **ném lỗi** khi thiếu key.
> `AUTH_SECRET` phải làm y hệt. Đây là sửa **một dòng**, không phải kiến trúc.

### 🔴 R3 · `public/comments-images/` phục vụ tệp người dùng **KHÔNG qua xác thực**
`app/api/comments/route.ts:42-45` ghi ảnh góp ý vào `public/`, trả URL công khai.
`middleware.ts` **chỉ khớp `/api/:path*`** ⇒ `public/` nằm **ngoài mọi cửa**.
Ảnh này là **ảnh chụp bản vẽ/màn hình dự án**. ID đoán được nếu biết mốc thời gian.
Kèm: `comments` PATCH/DELETE (`:99,:113`) **không kiểm ai sở hữu**.

### 🟠 R4 · Không có audit trail — bất kỳ loại nào
Grep `audit|activityLog|eventLog` = **0 hit chức năng**.
`lastEditedBy` + `rev` là **trạng thái**, không phải nhật ký — biết *"ai sửa gần nhất"*, không biết *"ai đã từng làm gì"*.
⇒ Đổi quyền · đổi thành viên · export **không để lại dấu vết nào**.
Cộng với **không rate-limit** ở `login` (`login/route.ts:14-18`) ⇒ **brute force là vô hình hoàn toàn**.

### 🟠 R5 · Sync Lark **ghi đè im lặng** việc của người dùng
`status/route.ts:89` (người kéo Kanban) ↔ `sync/route.ts:63` (sync ghi đè ngược).
⇒ Chứng minh **bằng hành vi có thật** vì sao luật `READ-ONLY IMPORT + PREVIEW + HUMAN CONFIRM` là đúng.

### 🟠 R6 · Không timeout trên **mọi** call Lark
`lib/integrations/providers/lark.ts:82,92` — `fetch` trần. Một base treo ⇒ giữ worker Next vô hạn;
retry 4 lần **nhân thêm** thời gian chờ.

### 🟠 R7 · `/api/colors/lark` — user thường chỉ định `tableId` tuỳ ý
`app/api/colors/lark/route.ts:22-24,48,56`, đọc bằng **token cấp tổ chức**
⇒ đọc **bất kỳ bảng nào** Lark app có quyền. Kiểu IDOR. Lỗi Lark còn trả **nguyên văn** ra client (`:60`).

### 🟠 R8 · `library/[id]/file` **thiếu guard path-traversal**
`app/api/library/[id]/file/route.ts:14` — `path.join(cwd,'uploads',asset.path)` không chặn `..`.
Bản `project-files` **có** chặn (`doc-noi-dung.ts:93-98`). ⇒ **Lệch trong chính repo**, dễ sửa.

### 🟡 R9 · `raw` JSON nuốt mọi field Lark
`schema:452` + `sync/route.ts:81`. Vượt xa 5 cột *"an toàn"* mà comment schema tự cam kết (`:441-443`).
Base thêm cột lương/CMND ⇒ **sync tự nuốt, không cần migrate**. **PII sinh sôi âm thầm.**

### 🟡 R10 · `dev.db` nằm trong git index
`.gitignore` phủ `prisma/*.db` nhưng **không phủ `dev.db` ở gốc**. Hiện 0 byte — **lần ghi sau là lộ**.

### 🟡 R11 · SQLite và sao lưu **không mã hoá**
`schema:15-18`. `<userData>/dev.db` quyền OS mặc định — đọc được đĩa là đọc được `passwordHash`, email, SĐT.
`scripts/backup-offsite.mjs` + snapshot trước nâng cấp (`main.js:134-175`) — **cả hai plaintext**.

### 🟡 R12 · Không có CSP
`next.config.mjs:32-47` chỉ đặt header cache. Giảm nhẹ bởi `sandbox:true` + preload rỗng,
nhưng app có nhiều đường nội dung do người dùng cung cấp (`dataUrl`, `from-url`, `stock-photos/proxy`).

### 🟡 R13 · `notebook` chặn theo **owner**, loại nhầm member
`lib/notebook/resolveProject.ts:34-45` dùng `Project.userId` thay vì `ProjectMember`
⇒ member của dự án bị đẩy sang bucket rỗng, **im lặng**. Lệch hướng ngược với R1.

---

## PHẦN II · ĐIỀU PHẢI GHI NHẬN — mã này làm ĐÚNG nhiều chỗ

Không ghi phần này là báo cáo thiên lệch.

| làm đúng | bằng chứng |
|---|---|
| **Cửa quyền DUY NHẤT**, 404-thay-403, tôn trọng soft-delete | `lib/server/access.ts:32-53` |
| **Test cưỡng chế THỨ TỰ DÒNG LỆNH** — khẳng định `assertProjectAccess` đứng trước `req.json` | `lib/site/quyen.test.ts:47,59` |
| **Sniff MIME bằng magic bytes CẢ lúc ghi lẫn lúc trả** + `nosniff` + ép `attachment` | `mime-sniff.ts:36-50` · `library/[id]/file/route.ts:19-30` |
| **Token OAuth mã hoá AES-256-GCM, không có đường lùi** — thiếu key thì ném lỗi | `lib/integrations/crypto.ts:16-21` |
| **Electron gần như hoàn hảo:** `contextIsolation:true` · `nodeIntegration:false` · `sandbox:true` · preload chỉ expose **3 giá trị tĩnh, 0 kênh IPC** · bind `127.0.0.1` ở **cả ba chỗ** | `main.js:417-419` · `preload.js:14-22` · `main.js:77,366,387` |
| **Snapshot DB + uploads trước mỗi lần nâng cấp** | `main.js:134-175` |
| **`publicUser()` không bao giờ trả `passwordHash`**; `dashboard` còn có comment giải thích vì sao **không** select email | `auth.ts:156-176` · `dashboard/route.ts:20` |
| **DB lỗi ⇒ 503, KHÔNG phải 401** — không đăng xuất oan | `auth/me/route.ts:17-20` |

> **Không tìm thấy route nào trả `User` kèm `passwordHash`.** Over-fetch chỉ ở tầng truy vấn,
> không tới response. Đây là mặt mạnh nhất của codebase.

---

## PHẦN III · UNKNOWN — chưa biết, KHÔNG suy đoán

| # | chưa biết | vì sao quan trọng | ai trả lời được |
|---|---|---|---|
| U1 | **Một cài đặt có bao giờ phục vụ >1 studio không?** | Quyết định R1. Nếu KHÔNG ⇒ ghi thành ràng buộc triển khai tường minh + đóng R3/R4. Nếu CÓ ⇒ cột phạm vi ở 6 bảng | **Hoà — quyết định sản phẩm** |
| U2 | Ngưỡng nào là **"quá tải"**? | Chặn `Availability` trong hợp đồng | tổ chức khách |
| U3 | Lark có phải nguồn HRM **chính thức** của khách không? | Quyết định `3.3` trong backlog | Hoà + khách |
| U4 | Base Lark có cột nhạy cảm (lương, CMND) không? | Quyết mức nghiêm trọng R9 | khách — **không tra bằng cách gọi API** |
| U5 | `vercel.json` còn dùng không, hay là di tích? | Quyết mức nghiêm trọng R2 | Hoà |
| U6 | Đã có ai cài IF cho khách thứ hai chưa? | Nếu rồi ⇒ R1 **đang xảy ra**, không phải rủi ro tương lai | Hoà |
| U7 | Cột `raw` trong `dev.db` hiện chứa gì? | Đo mức PII thật | **Phiên này CỐ Ý KHÔNG mở `dev.db`** |

## PHẦN IV · SỰ THẬT LỚN NHẤT

Điểm gãy **không nằm ở kỹ thuật** — kỹ thuật ở đây trên trung bình rõ rệt.
Nó nằm ở **PHẠM VI CỦA MÔ HÌNH**: `ProjectMember` phủ cây `Project`, và **mọi thứ ngoài cây đó không có ranh giới nào**.

Ba route rò rỉ nặng nhất đều thuộc nhóm ngoài-cây. **Vá từng route sẽ không giải quyết được.**

Và bài toán **People & Organization đứng đúng trên đường nứt đó** — nó là tính năng đầu tiên
**bắt buộc** phải có ranh giới khách hàng.

⇒ **`U1` là câu hỏi chặn tất cả.** Không trả lời nó thì không có cách nào làm People & Organization tử tế.
