# ② LOCAL-FIRST BOUNDARY

> HEAD `a08378a`. Dựa trên bằng chứng Phiên A + B.
> **Luật cứng số 2 của đề bài:** Electron loopback runtime **LÀ** product backend local.
> Tôi đã gọi sai là *"không có backend"* trong một câu trả lời trước — **rút lại**.

---

## 1 · RANH GIỚI THẬT — cái gì ở đâu

```
┌─ MÁY NGƯỜI DÙNG ────────────────────────────────────────────────┐
│  Electron (chính)                                               │
│    └─ next start · 127.0.0.1:<3777+>          ← PRODUCT BACKEND │
│         ├─ 77 API route                                         │
│         ├─ Prisma → <userData>/dev.db          (SQLite, KHÔNG mã hoá) │
│         └─ <userData>/uploads/                 (tệp, sniff MIME)│
│                                                                  │
│  Ra ngoài — CHỈ khi có env key:                                 │
│    OAuth (Google · MS · Apple)   Lark   Unsplash · Openverse    │
│    NVIDIA · fal.ai · ComfyUI · SD        GitHub                 │
│    Ollama · Blender = LOCAL, không rời máy                      │
└──────────────────────────────────────────────────────────────────┘
```

| ranh giới | trạng thái | bằng chứng |
|---|---|---|
| Server **chỉ bind `127.0.0.1`** | ✅ | `electron/main.js:366-368,61-81` |
| DB **trên máy**, `<userData>/dev.db` | ✅ | `electron/main.js:118-130` |
| Tệp **trên máy**, `<userData>/uploads` | ✅ | `library-save.ts:24` + `main.js:389` |
| Token OAuth **mã hoá** khi lưu | ✅ | `lib/integrations/crypto.ts:14,42` |
| SQLite **có mã hoá?** | ❌ **KHÔNG** | Prisma sqlite thường, không thấy SQLCipher |
| `uploads/` **có bảo vệ?** | ❌ **KHÔNG** | thư mục thường trong userData |
| Có **product cloud** nào? | ❌ **CHƯA TỒN TẠI** | không tìm thấy tầng sync nào |

## 2 · `local-first` ≠ `local-only` — hiện trạng nghiêng hẳn về `local-only`

**Đang có (local):** toàn bộ dữ liệu công việc.
**Đang ra ngoài (không phải sync):** OAuth để đăng nhập · gọi AI/ảnh · **kéo Lark về**.
**Chưa có:** đồng bộ nhiều máy · sao lưu · nguồn chân lý chung · khôi phục khi đổi máy.

⇒ Hiện trạng là **`LOCAL-ONLY` + connector một chiều**.
Không phải `local-first` theo nghĩa đầy đủ, vì `local-first` hàm ý *có đường đồng bộ nhưng máy là nguồn chân lý* —
**đường đó chưa tồn tại**.

> Đây là lý do `06-SYNC-OPTIONS` đề xuất **Đường B**, và đề xuất bắt đầu từ
> **bậc 1: xuất/nhập tệp có ký** — nó trả lời được câu *"đổi máy có mất không"* mà không cần dịch vụ nào.

## 3 · 🔴 BA CHỖ RANH GIỚI BỊ THỦNG

### 3.1 · Secret fallback dùng chung, có ở production
`lib/server/auth.ts:46` + `middleware.ts:35` — fallback `'dev-secret-change-me'`.
Trong Electron được cứu bởi `loadUserConfig()` (`main.js:354-360`).
**Không được cứu** nếu chạy web — và **`vercel.json` có mặt trong repo**.
⇒ Ranh giới "local" **không được thực thi bằng mã**, chỉ bằng cách đóng gói.

### 3.2 · Không có tenant — dữ liệu Lark vào bảng dùng chung
`prisma/schema.prisma:444-454` không có khoá phân tách nào.
`GET /api/lark-tasks` `findMany()` **không WHERE** ⇒ trả **toàn bộ roster** cho **mọi user đăng nhập**
(`app/api/lark-tasks/route.ts:19-23,45-51`).
⇒ Ranh giới **giữa các khách hàng không tồn tại**.

### 3.3 · Ba route cố ý lộ toàn đội
`dashboard` · `chat` · `specs` — comment khai rõ *"app nội bộ team"* (`dashboard/route.ts:7-8`).
⇒ Ranh giới **giữa các người dùng** cũng được thiết kế là **không có**.

## 4 · KẾT LUẬN — hai định vị đang chỏi nhau

| | mã hiện tại nói | `CLAUDE.md` nói |
|---|---|---|
| Người dùng | **một studio nội bộ**, tin nhau | **sản phẩm bán toàn cầu** |
| Ranh giới giữa user | cố ý **không có** | phải có |
| Ranh giới giữa khách | **không tồn tại** | bắt buộc |
| Dữ liệu nhân sự | bảng phẳng dùng chung | phải theo tenant |

**Đây không phải lỗi lập trình. Đây là hai định vị sản phẩm khác nhau đang cùng tồn tại trong một repo.**

Bài toán People & Organization **đứng đúng trên đường nứt đó**: nó là tính năng đầu tiên
**bắt buộc** phải có ranh giới khách hàng. Không thể làm nó tử tế mà không quyết `0.1 tenancy` trước.

## 5 · ĐỀ XUẤT RANH GIỚI CHO GIAI ĐOẠN TỚI — `PROPOSED`

1. **Thực thi "local" bằng mã, không bằng cách đóng gói.**
   Bỏ fallback secret; thiếu `AUTH_SECRET` ⇒ **từ chối khởi động**, không chạy tiếp lặng lẽ.
2. **Thêm `tenantId` sớm**, kể cả khi chỉ có một tenant. Thêm sau đắt gấp nhiều lần.
3. **Đóng ba lỗ quyền không chủ ý** (`asset-representation` · `notebook` · `integrations/status`)
   — tách khỏi ba chỗ **cố ý** lộ toàn đội, vì hai loại này cần hai quyết định khác nhau.
4. **Mọi bề mặt People đứng sau `tenant capability flag`** — đã là luật cứng của đề bài.
5. **Không mở đường sync nào** trước khi 1–4 xong.
