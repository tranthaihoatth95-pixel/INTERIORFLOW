# DEPLOY-VERCEL — Đưa InteriorFlow lên web (PWA) bằng Vercel + Supabase

> Làm theo từng bước, **theo đúng thứ tự**. Không cần biết code — chỉ cần trình duyệt + Terminal.
> Kết quả: app chạy ở địa chỉ `https://<tên>.vercel.app`, mở được trên mọi máy/iPad/điện thoại,
> "Add to Home Screen" thành app (PWA — manifest + service worker đã có sẵn trong repo:
> `public/manifest.webmanifest`, `public/sw.js`, headers đã cấu hình trong `next.config.mjs`).
>
> ⚠️ **2 điều tuyệt đối không làm:**
> 1. **KHÔNG chạy `prisma migrate reset` / `migrate dev`** — repo đang có drift migration
>    (IntegrationAccount). Lệnh duy nhất được dùng để tạo bảng: **`prisma db push`**.
> 2. **KHÔNG sửa `prisma/schema.prisma` trên nhánh chính** — chỉ sửa trong nhánh/bản deploy
>    riêng như Bước 3 mô tả, và phải được chủ dự án duyệt trước khi commit.

---

## Bước 0 — Cần có sẵn

- Tài khoản **GitHub** (repo `tranthaihoatth95-pixel/INTERIORFLOW` đã có).
- Tài khoản **Vercel** (đăng ký free bằng chính GitHub: <https://vercel.com/signup>).
- Tài khoản **Supabase** (free: <https://supabase.com>).
- Trên máy: Node.js ≥ 18 (đã có nếu từng chạy app).

## Bước 1 — Tạo database Postgres trên Supabase

1. Vào <https://supabase.com/dashboard> → **New project**.
2. Đặt tên (vd `interiorflow`), chọn region **Southeast Asia (Singapore)**, đặt **Database
   Password** (bấm Generate rồi **LƯU LẠI** — sẽ cần ở bước sau).
3. Đợi ~2 phút cho project khởi tạo.

## Bước 2 — Lấy 2 chuỗi kết nối DATABASE_URL

Trong project Supabase: bấm nút **Connect** (trên cùng) → tab **ORMs** → chọn **Prisma**.
Supabase hiện sẵn 2 dòng — copy cả 2, thay `[YOUR-PASSWORD]` bằng mật khẩu ở Bước 1:

- `DATABASE_URL` — dòng **Transaction pooler** (cổng **6543**, có `?pgbouncer=true`)
  → dùng khi app **chạy** (serverless cần pooler).
- `DIRECT_URL` — dòng **Direct connection / Session** (cổng **5432**)
  → dùng khi **tạo bảng** (`prisma db push`).

Dán tạm 2 dòng này vào file ghi chú — dùng ở Bước 4 và 6.

## Bước 3 — Đổi provider Prisma sang Postgres (CHỈ trong bản deploy)

File `prisma/schema.prisma` hiện là SQLite (bản desktop). Bản cloud cần Postgres.
**Tạo nhánh riêng** rồi sửa (đừng sửa thẳng nhánh chính khi chưa được duyệt):

```bash
cd <thư-mục-repo>
git checkout -b deploy/vercel
```

Mở `prisma/schema.prisma`, tìm block `datasource db` và đổi thành:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

(Chỉ đổi đúng block này — không đụng model nào khác. `directUrl` để `db push` đi cổng 5432.)

## Bước 4 — Tạo bảng trên Supabase bằng `prisma db push`

Tạo file `.env` tạm ở gốc repo (nhánh deploy) với 2 dòng từ Bước 2:

```
DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...:5432/postgres"
```

Rồi chạy:

```bash
npx prisma db push        # tạo bảng theo schema — KHÔNG dùng migrate
```

Thấy `Your database is now in sync with your Prisma schema` là xong.

Tạo tài khoản admin đầu tiên (register công khai đã khoá):

```bash
SEED_ADMIN_EMAIL=admin@ttt.vn SEED_ADMIN_PASSWORD=matkhau6+ \
  node_modules/.bin/sucrase-node scripts/seed-admin.ts
```

## Bước 5 — Đưa code lên Vercel

Cách dễ nhất — nối GitHub:

1. Push nhánh deploy: `git push origin deploy/vercel`.
2. Vào <https://vercel.com/new> → **Import** repo `INTERIORFLOW` → ở mục **Branch** chọn
   `deploy/vercel`. Framework tự nhận **Next.js** (file `vercel.json` trong repo đã khai
   region Singapore + buildCommand kèm `prisma generate`).
3. **KHOAN bấm Deploy** — mở mục **Environment Variables** và nhập Bước 6 trước.

## Bước 6 — Biến môi trường trên Vercel

Trong màn hình import (hoặc sau này ở Project → Settings → Environment Variables), thêm:

| Tên | Giá trị | Bắt buộc? |
|---|---|---|
| `DATABASE_URL` | chuỗi pooler cổng 6543 (Bước 2) | ✅ |
| `DIRECT_URL` | chuỗi direct cổng 5432 (Bước 2) | ✅ |
| `AUTH_SECRET` | chuỗi ngẫu nhiên dài (chạy `openssl rand -hex 32` để sinh) | ✅ |
| `GOOGLE_CLIENT_ID` | như trong `.env.local` hiện tại | cho nút "Đăng nhập Google" |
| `GOOGLE_CLIENT_SECRET` | như trong `.env.local` hiện tại | cho nút "Đăng nhập Google" |
| `FAL_KEY` | key fal.ai | cho render AI cloud (thiếu → node AI báo chưa cấu hình, app vẫn chạy) |

**KHÔNG** đặt `COMFYUI_URL` trên Vercel (ComfyUI là máy local, cloud không với tới).

Bấm **Deploy** → đợi vài phút → có link `https://<tên>.vercel.app`.

## Bước 7 — Cập nhật Google OAuth cho domain mới

Đăng nhập Google chỉ chạy khi domain được khai với Google:

1. Vào <https://console.cloud.google.com/apis/credentials> → mở OAuth Client đang dùng.
2. Mục **Authorized redirect URIs** → **Add URI**:
   `https://<tên>.vercel.app/api/auth/google/callback`
3. Save. (Code tự lấy origin của request nên không cần đổi env nào thêm.)

## Bước 8 — Kiểm tra PWA

1. Mở `https://<tên>.vercel.app` trên điện thoại/iPad → đăng nhập thử bằng admin đã seed.
2. Safari: nút Share → **Add to Home Screen**. Chrome/Android: menu ⋮ → **Install app**.
3. Icon InteriorFlow xuất hiện ở màn hình chính, mở lên chạy toàn màn hình (standalone).

## Ghi chú giới hạn bản cloud

- **Uploads (ảnh thư viện)**: route thư viện ghi file vào `process.cwd()/uploads` — trên Vercel
  filesystem là **tạm thời** (mất sau mỗi lần deploy/scale). Bản cloud dùng được toàn bộ 3 chặng
  CAD/Render/Present + gallery; riêng thư viện ảnh upload lâu dài cần chuyển sang Supabase
  Storage (việc riêng, cần code — báo chủ dự án, đừng tự làm).
- Data nằm ở Supabase — desktop (.dmg/.exe, SQLite) và cloud (Postgres) là **2 kho dữ liệu
  tách biệt**, không tự đồng bộ.
- Deploy lại: chỉ cần push commit mới lên nhánh `deploy/vercel` — Vercel tự build.
