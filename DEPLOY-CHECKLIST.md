# DEPLOY-CHECKLIST — InteriorFlow on Vercel + Supabase

> Ngay 15/07/2026 — tu nhanh `feat/deploy-vercel-supabase`
> Build status: **PASS** (Next.js 14.2.35, 31 static + 24 dynamic routes, 0 type error)

---

## 1. Environment Variables (Vercel Dashboard)

### BAT BUOC — app khong chay neu thieu

| Ten | Mo ta | Cach lay |
|---|---|---|
| `DATABASE_URL` | Postgres pooler (port 6543, co `?pgbouncer=true`) | Supabase > Connect > ORMs > Prisma > Transaction pooler |
| `DIRECT_URL` | Postgres direct (port 5432) — cho `prisma db push` | Supabase > Connect > ORMs > Prisma > Direct connection |
| `AUTH_SECRET` | JWT signing key | `openssl rand -hex 32` |

### GOOGLE LOGIN — thieu thi nut Google hien "chua cau hinh"

| Ten | Mo ta | Cach lay |
|---|---|---|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Web client ID | Google Cloud Console > APIs & Services > Credentials |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Web client secret | Cung cho voi CLIENT_ID |

> Sau deploy: them Authorized redirect URI `https://<domain>.vercel.app/api/auth/google/callback` vao Google Console.

### AI CLOUD — thieu thi node AI bao "chua cau hinh", app van chay

| Ten | Mo ta | Ghi chu |
|---|---|---|
| `FAL_KEY` | fal.ai render cloud | Hien **het balance** (403) — can nap credit |
| `NVIDIA_API_KEY` | NVIDIA NIM (text2image, VLM, LLM) | Da co local, can set tren Vercel |

### TICH HOP DICH VU NGOAI — chi can khi bat tinh nang tuong ung

| Ten | Mo ta |
|---|---|
| `INTEGRATION_ENC_KEY` | Ma hoa token OAuth at-rest (BAT BUOC neu dung tich hop). Tao: `openssl rand -base64 32` |
| `MS365_CLIENT_ID` | Azure AD — Outlook/Calendar/Drive |
| `MS365_CLIENT_SECRET` | Azure AD secret |
| `MS365_TENANT` | Mac dinh `common` |
| `ZOOM_CLIENT_ID` | Zoom Marketplace OAuth |
| `ZOOM_CLIENT_SECRET` | Zoom secret |
| `ZALO_OA_APP_ID` | Zalo Official Account |
| `ZALO_OA_SECRET` | Zalo OA secret |
| `SPOTIFY_CLIENT_ID` | Spotify metadata/nhung |
| `SPOTIFY_CLIENT_SECRET` | Spotify secret |
| `YOUTUBE_API_KEY` | YouTube Data API v3 |
| `YOUTUBE_CLIENT_ID` | YouTube OAuth (neu can) |
| `YOUTUBE_CLIENT_SECRET` | YouTube OAuth secret |
| `APPLE_MUSIC_TEAM_ID` | Apple MusicKit — STUB, chua dung |
| `APPLE_MUSIC_KEY_ID` | Apple MusicKit |
| `APPLE_MUSIC_PRIVATE_KEY` | Apple MusicKit |
| `TEAM_API_BASE` | Team API noi bo — cho spec |
| `TEAM_API_TOKEN` | Team API token |

### KHONG DAT TREN VERCEL — chi dung local

| Ten | Ly do |
|---|---|
| `COMFYUI_URL` | ComfyUI la may local, cloud khong voi toi |
| `SD_SERVER_URL` | Stable Diffusion server local |
| `COMFY_SKETCH_WF` | Ten workflow ComfyUI local |
| `OLLAMA_BASE_URL` | Ollama chay local (localhost:11434) |
| `OLLAMA_MODEL` | Model Ollama local |
| `NVIDIA_BASE_URL` | Override URL — mac dinh da dung |
| `NVIDIA_GENAI_BASE_URL` | Override URL — mac dinh da dung |
| `NVIDIA_IMAGE_MODEL` | Override model — mac dinh `flux.1-dev` |
| `NVIDIA_VLM_MODEL` | Override model — mac dinh `llama-3.2-11b-vision` |
| `NVIDIA_LLM_MODEL` | Override model — mac dinh `nemotron-70b` |

### CLIENT-SIDE (NEXT_PUBLIC_)

| Ten | Mo ta |
|---|---|
| `NEXT_PUBLIC_COMMENT_LAYER` | Set `1` de bat comment layer (debug) |

---

## 2. Supabase Setup

### 2.1 Tao project
1. Supabase Dashboard > **New project**
2. Ten: `interiorflow`, Region: **Southeast Asia (Singapore)** (khop `vercel.json` region `sin1`)
3. Dat **Database Password** > **Generate** > LUU LAI

### 2.2 Doi schema sang PostgreSQL
Trong worktree deploy, sua `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

> CHI doi block `datasource db`. Khong dung model nao khac.

### 2.3 Tao bang
```bash
# Tao .env voi DATABASE_URL (pooler:6543) + DIRECT_URL (direct:5432)
npx prisma db push
```

> **TUYET DOI KHONG** dung `prisma migrate reset` hay `prisma migrate dev`.
> Migration drift: model `IntegrationAccount` co trong schema nhung KHONG co trong `prisma/migrations/20260703141955_init/migration.sql`.
> `migration_lock.toml` van ghi `provider = "sqlite"`. `db push` se tao day du bang theo schema hien tai, bo qua migration history.

### 2.4 Seed admin
```bash
SEED_ADMIN_EMAIL=admin@ttt.vn SEED_ADMIN_PASSWORD=<matkhau6+> \
  npx sucrase-node scripts/seed-admin.ts
```

---

## 3. Vercel Setup

### 3.1 Import project
1. Vercel > New Project > Import repo `tranthaihoatth95-pixel/INTERIORFLOW`
2. Branch: `deploy/vercel` (hoac nhanh deploy tuong ung)
3. Framework: **Next.js** (tu nhan)
4. `vercel.json` da cau hinh:
   - `installCommand`: `npm ci`
   - `buildCommand`: `prisma generate && next build`
   - `regions`: `["sin1"]` (Singapore)
   - `functions.maxDuration`: 60s cho API routes

### 3.2 Environment Variables
Nhap tat ca env vars BAT BUOC (muc 1 tren) TRUOC khi bam Deploy.

### 3.3 Deploy
Bam Deploy > doi 3-5 phut > nhan link `https://<ten>.vercel.app`

### 3.4 Cau hinh Google OAuth redirect
Google Cloud Console > OAuth client > Authorized redirect URIs > them:
```
https://<ten>.vercel.app/api/auth/google/callback
```

---

## 4. Post-Deploy Verify

- [ ] Mo `https://<ten>.vercel.app` — trang login hien thi
- [ ] Dang nhap bang admin da seed (email/password)
- [ ] Dang nhap bang Google @ttt.vn
- [ ] Tao project moi + flow moi
- [ ] Mo `/cad-editor` — canvas load
- [ ] Mo `/present-editor` — dang trang load
- [ ] Mo `/report` — bao cao load
- [ ] Thu `/api/health` — tra ve OK
- [ ] PWA: iPad/dien thoai > Add to Home Screen > app mo standalone
- [ ] Kiem tra `/api/render/nvidia-image` (neu da set NVIDIA_API_KEY)

---

## 5. Known Limitations

### 5.1 File uploads la TAM THOI
Route thu vien ghi file vao `process.cwd()/uploads` — tren Vercel filesystem la ephemeral (mat sau moi lan deploy/scale). Can chuyen sang **Supabase Storage** cho uploads lau dai (viec rieng, can code).

### 5.2 Du lieu desktop va cloud TACH BIET
- Desktop (.dmg/.exe): SQLite local
- Cloud (Vercel): PostgreSQL Supabase
- KHONG tu dong bo giua 2 moi truong

### 5.3 AI nodes tren cloud
- **ComfyUI / SD / Ollama**: KHONG chay tren Vercel (can may local) — cac node nay se fallback ve tier "loi tat dinh"
- **NVIDIA NIM**: chay duoc neu set `NVIDIA_API_KEY`
- **fal.ai**: can nap credit (hien 403 Exhausted balance)

### 5.4 Large static assets (public/)
Tong `public/`: **31MB**. File lon nhat:
- `public/detech/tower-night.png` — 7.1MB
- `public/detech/tower-dusk.png` — 3.5MB
- `public/detech/enso-garden.png` — 2.9MB
- `public/detech/enso-circle.png` — 2.3MB
- `public/demo/clay-4k.jpg` — 2.2MB

> Vercel ho tro toi da 250MB cho static assets (free plan). 31MB khong vuot gioi han nhung nen toi uu anh lon (WebP/resize) de tang toc tai trang.

### 5.5 Font fetch khi build
Build log: `request to fonts.googleapis.com failed` roi retry thanh cong. Tren Vercel se co mang, khong anh huong.

### 5.6 Auth policy
- Chi Google OAuth @ttt.vn duoc dang nhap (hardcode `GOOGLE_ALLOWED_DOMAIN` mac dinh `ttt.vn`)
- Register cong khai da khoa (403)
- User ngoai domain: admin cap tay hoac grandfather

### 5.7 Prisma migration drift
- `IntegrationAccount` co trong schema nhung KHONG trong migration SQL
- `migration_lock.toml` ghi `sqlite`
- **Luon dung `db push`**, KHONG `migrate reset` hay `migrate dev`
- Doi sang PostgreSQL: chi sua `datasource db` block, khong doi model

### 5.8 API routes can runtime env
| Route | Env can thiet |
|---|---|
| `/api/auth/google/*` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| `/api/render/nvidia-image` | `NVIDIA_API_KEY` |
| `/api/render/premium` | `FAL_KEY` hoac `COMFYUI_URL` |
| `/api/illustration` | `FAL_KEY` |
| `/api/vision/caption` | `NVIDIA_API_KEY` |
| `/api/present/text` | `NVIDIA_API_KEY` hoac `OLLAMA_*` (fallback loi tat dinh) |
| `/api/strategy/scenarios` | `NVIDIA_API_KEY` hoac `OLLAMA_*` (fallback loi tat dinh) |
| `/api/integrations/*` | `INTEGRATION_ENC_KEY` + tuong ung provider |
| `/api/render/fbx` | Blender local (501 tren cloud) |

### 5.9 Security
- **Khong tim thay API key hardcode** trong source code (grep pattern: `sk-*`, `nvapi-*`, `fal_*`, `AIza*`)
- `AUTH_SECRET` fallback `dev-secret-change-me` trong code (`lib/server/auth.ts`) — **BAT BUOC set env tren Vercel**
- Token OAuth ma hoa AES-256-GCM (`lib/integrations/crypto.ts`) — can `INTEGRATION_ENC_KEY`
