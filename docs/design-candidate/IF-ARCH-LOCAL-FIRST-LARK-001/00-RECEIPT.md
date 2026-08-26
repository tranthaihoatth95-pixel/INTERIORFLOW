# BIÊN NHẬN — IF-ARCH-LOCAL-FIRST-LARK-001

| | |
|---|---|
| **Nhận** | CLAUDE MAIN · 26/08/2026 |
| **Chế độ** | `ARCHITECTURE + EVIDENCE FIRST` · **READ-ONLY ON PRODUCTION** |
| **Commit HEAD** | `a08378a78d216903ab1439c550c3ff5da2c69427` |
| **Nhánh** | `checkpoint/2026-08-24-control-plane` |
| **Trạng thái** | `CANDIDATE` · sensitivity `INTERNAL` |
| **Định tuyến kế** | gửi **Codex MAIN** → Product / Design / Architecture / Quality |

---

## 1 · VAI TRÒ PHIÊN

| phiên | vai | chế độ | phạm vi |
|---|---|---|---|
| **CLAUDE MAIN** | tổng hợp packet | ghi **CHỈ** `docs/design-candidate/` | 10 mục + manifest |
| **A** | Architecture Audit | **read-only** | electron startup · 77 route · 24 model · lưu tệp · auth · connector |
| **B** | Lark/HRM Audit | **read-only** · KHÔNG gọi API Lark · KHÔNG lấy dữ liệu nhân sự | 3 model · 5 route · tenant isolation · test · fixture · UI |
| **C** | Product Domain | CLAUDE MAIN — `PROPOSED`, **không phải** OBSERVED | hợp đồng trung tính 12 thực thể + adapter |
| **D** | Security/Quality | **read-only** · không trích giá trị secret | PII · permission-before-load · cross-tenant · secret · mã hoá · audit · Electron · test matrix |

## 2 · ⛔ NO-WRITE ASSERTION — có chứng minh

> **Phiên này KHÔNG ghi/sửa/xoá bất kỳ tệp nào trong**
> `app/` · `components/` · `lib/` · `prisma/` · `electron/` · `scripts/`.

**Bằng chứng đo được:**
```
find app components lib prisma electron scripts -type f \
     \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.prisma' -o -name '*.mjs' \) \
     -newermt '2026-08-26 14:06:57'
→ scripts/publish-idf-control-center.mjs   (DUY NHẤT)
```
Tệp đó **thuộc task TRƯỚC** (`TTT-PROFILE-UX-001`), **đã commit ở `a08378a`**, `git status` **sạch**.
mtime mới vì publisher được **CHẠY** (đọc), không phải sửa.

**Dirty count:** 616 lúc bắt đầu → 617 lúc xong. **Đúng +1**, là thư mục packet này.

> Có một tệp `docs/IF-ARCHITECTURE-BLUEPRINT.md` untracked xuất hiện khi grep —
> tôi đã truy: **mtime `2026-08-20 13:44`**, tức **có sẵn từ 6 ngày trước**, không phải agent nào ghi.

## 3 · NGUỒN ĐÃ ĐỌC

**Mã:** `electron/main.js` · `middleware.ts` · `next.config.mjs` · `prisma/schema.prisma` ·
77 route trong `app/api/` · `lib/server/{auth,access,access-policy,auth-policy,mime-sniff,library-save,blender,tasks}.ts` ·
`lib/integrations/{oauth-core,crypto,lark-bridge,external-ref}.ts` · `lib/integrations/providers/lark*.ts` ·
`lib/ai/providers/*.ts` · `lib/notebook/resolveProject.ts` · `electron/preload.js` · `scripts/backup-offsite.mjs` ·
`.gitignore` · `.env.example` · `package.json` · `vercel.json`

**Tài liệu:** `docs/ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md` (9 ADR `ACCEPTED`) ·
`docs/IF-ARCHITECTURE-BLUEPRINT.md` · `CLAUDE.md`

**⛔ CỐ Ý KHÔNG MỞ:** `prisma/dev.db` và 12 bản `.bak` — chứa roster nhân sự thật.
Không mở, không đếm dòng, không trích.

## 4 · ARTIFACT — vị trí và hash

Tất cả trong `docs/design-candidate/IF-ARCH-LOCAL-FIRST-LARK-001/`.
Hash SHA-256 từng mục: xem `MANIFEST.json`.

`01` bản đồ backend · `02` ranh giới local-first · `03` bằng chứng Lark ·
`04` hợp đồng trung tính · `05` phân loại dữ liệu · `06` ba đường sync ·
`07` rủi ro + chưa biết · `08` **ADR Q10–Q13** · `09` backlog · `10` cổng test

## 5 · 🔴 NĂM RỦI RO NẶNG NHẤT

| | rủi ro | bằng chứng |
|---|---|---|
| **R1** | **Không có tenant** — 6 bảng nằm **NGOÀI** mô hình quyền, không phải *bị sót trong* nó | `prisma/schema.prisma` · `library/route.ts:7,11-15` |
| **R2** | `AUTH_SECRET` **fallback hardcode** — web deploy thiếu biến ⇒ đúc được cookie `isAdmin` | `auth.ts:46` · `middleware.ts:34` |
| **R3** | `public/comments-images/` phục vụ **ảnh bản vẽ KHÔNG xác thực** — middleware chỉ phủ `/api/*` | `comments/route.ts:42-45` · `middleware.ts:76` |
| **R4** | **Không có audit trail nào**; cộng không rate-limit login ⇒ brute force **vô hình** | grep = 0 hit · `login/route.ts:14-18` |
| **R5** | Sync Lark **ghi đè im lặng** việc người dùng vừa kéo | `status/route.ts:89` ↔ `sync/route.ts:63` |

## 6 · ❓ UNRESOLVED — 7 mục, không suy đoán

`U1` **một cài đặt có phục vụ >1 studio không?** ← **chặn tất cả** ·
`U2` ngưỡng "quá tải" · `U3` Lark có phải nguồn HRM chính thức ·
`U4` base Lark có cột nhạy cảm không *(không tra bằng gọi API)* ·
`U5` `vercel.json` còn dùng hay là di tích · `U6` đã cài cho khách thứ hai chưa ·
`U7` `raw` trong `dev.db` chứa gì *(cố ý không mở)*

## 7 · PHỤ THUỘC KẾ TIẾP

> **`Q10` (tenancy) — không quyết thì KHÔNG mở writer task nào cho People & Organization.**

`Q12` (bỏ fallback secret) **độc lập, sửa một dòng, làm được ngay** — khuôn đã có sẵn tại
`lib/integrations/crypto.ts:16`.

## 8 · ĐIỀU TÔI PHẢI TỰ KHAI

1. Tôi từng nói **"IF không có backend"**. **Sai** — Electron loopback runtime **LÀ** product backend local. Đã rút lại trong `01` và `02`.
2. Tôi từng nói **"không push Drive được"**. **Sai** — publisher ghi vào thư mục Drive sync local. Đã rút lại.
3. Tôi **suýt** mở dãy `ADR-00x` thứ hai trong khi đã có `Q1–Q9` `ACCEPTED`. Tự bắt được **trước khi nộp**, đã đổi thành `Q10–Q13`. Đây là lần thứ ba trong ngày lỗi *"vẽ trước, tra sau"* xuất hiện.

## 9 · KHÔNG LÀM

Không viết production · không viết schema · không gọi API Lark · không kéo dữ liệu HRM thật ·
không mở `dev.db` · không đánh `PASS` cho bất kỳ mục nào trong `10-TEST-RUNTIME-GATE`
(phiên này read-only, không chạy Electron).
