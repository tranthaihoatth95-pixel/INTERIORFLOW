# Tầng tích hợp dịch vụ ngoài — hướng dẫn & rủi ro

Nhân 2 khuôn sẵn có: OAuth tự viết (`lib/server/oauth.ts`, `app/api/auth/google/*`) + adapter
(`lib/ai/providers/*`). Kiến trúc: `lib/integrations/{crypto,oauth-core,registry,index}.ts` +
`lib/integrations/providers/*` + route `app/api/integrations/[provider]/{connect,callback,status,disconnect}`.

Redirect URI mỗi provider: `<origin>/api/integrations/<provider>/callback`
(vd `http://localhost:3000/api/integrations/ms365/callback`).

## Trạng thái từng dịch vụ
| Provider | Tier | Kiểu | Trạng thái | Dùng cho |
|---|---|---|---|---|
| Google Workspace | 1 | OAuth | **Thật** (Calendar readonly · Gmail send · Drive.file) | Gửi deliverable, lịch present, lưu file |
| MS365 (Graph) | 1 | OAuth | **Thật** (Outlook Calendar/Mail readonly) | Vận hành đội |
| Zoom | 1 | OAuth | **Thật** (tạo meeting → join URL) | Present cho khách |
| Team API | 1 | API key | **Khung generic** (chờ spec đội) | Hệ thống nội bộ |
| Zalo OA/ZNS | 2 | OAuth | **Khung** (gate khoá) | Thông báo khách |
| Spotify | 2 | OAuth | **Khung** (now-playing) | Nhạc nền |
| YouTube | 2 | API key | **Khung** (search+nhúng) | Video tham khảo |
| Apple Music | 3 | — | **STUB** (503) | (sau) |
| Chrome Clipper | — | — | **Khung extension** + `POST /api/library/clip` | Clip ảnh web → Reference |

## Lấy khoá (tóm tắt)
- **Google**: Cloud Console → OAuth client (Web) → thêm redirect URI ở trên → bật Gmail/Calendar/Drive API. Dùng `GOOGLE_CLIENT_ID/SECRET`.
- **MS365**: Azure Portal → App registrations → redirect URI (Web) → API permissions Microsoft Graph (Calendars.Read, Mail.Read, User.Read, offline_access). `MS365_CLIENT_ID/SECRET`, `MS365_TENANT=common`.
- **Zoom**: Zoom Marketplace → OAuth app → scope `meeting:write` → redirect URI. `ZOOM_CLIENT_ID/SECRET`.
- **Zalo OA**: Zalo for Developers → Official Account (cần OA đã duyệt + doanh nghiệp) → app OAuth. `ZALO_OA_APP_ID/SECRET`. **Zalo cá nhân: KHÔNG có API → không hỗ trợ.**
- **Spotify**: developer.spotify.com dashboard → app → redirect URI. `SPOTIFY_CLIENT_ID/SECRET`.
- **YouTube**: Cloud Console → API key (Data API v3). `YOUTUBE_API_KEY`.
- **Apple Music**: Apple Developer ($99) → MusicKit key `.p8` + Team ID + Key ID. Chưa dựng ký JWT.
- **INTEGRATION_ENC_KEY** (bắt buộc cho OAuth): `openssl rand -base64 32`.

## Đăng nhập Microsoft (Sign in with Microsoft — 19/07, login-v2)
Nút "Đăng nhập với Microsoft" ở màn login (`app/api/auth/microsoft/*`) DÙNG CHUNG bộ env
`MS365_CLIENT_ID/MS365_CLIENT_SECRET/MS365_TENANT` với tầng tích hợp MS365 — cùng MỘT Azure App
Registration phục vụ cả login lẫn Outlook/Teams/Calendar về sau. Callback login còn best-effort lưu
token (mã hoá) vào `IntegrationAccount` provider `ms365` — có `INTEGRATION_ENC_KEY` là các tích hợp
Graph dùng lại luôn identity này, khỏi connect lần hai. Thiếu env → nút Microsoft hiện DISABLED kèm
tooltip "chưa cấu hình" (route `/api/auth/providers` trả `microsoft:false`), app không crash.

**Tạo Azure App Registration (từng bước):**
1. [portal.azure.com](https://portal.azure.com) → **Microsoft Entra ID → App registrations → New registration**.
2. Name tuỳ ý (vd `InteriorFlow`). **Supported account types**: chọn *"Accounts in any organizational
   directory and personal Microsoft accounts"* (multitenant + personal — khớp `MS365_TENANT=common`).
   Nếu chỉ cần tài khoản tổ chức của 1 tenant thì chọn single-tenant và đặt `MS365_TENANT=<tenant-id>`.
3. **Redirect URI**: platform **Web**, thêm CẢ HAI:
   - `http://localhost:3000/api/auth/microsoft/callback` (login — đổi host/port theo origin thật)
   - `http://localhost:3000/api/integrations/ms365/callback` (tầng tích hợp)
4. Sau khi tạo: **Overview → Application (client) ID** → `MS365_CLIENT_ID`.
5. **Certificates & secrets → New client secret** → copy **Value** (chỉ hiện 1 lần) → `MS365_CLIENT_SECRET`.
6. **API permissions** (Microsoft Graph, delegated): login chỉ cần `openid profile email User.Read offline_access`
   (mặc định gần đủ — thêm `offline_access` + `User.Read` nếu thiếu). Tích hợp sau thêm `Calendars.Read`, `Mail.Read`.
7. `.env.local`: `MS365_CLIENT_ID=... MS365_CLIENT_SECRET=... MS365_TENANT=common` → restart dev server
   → nút Microsoft tự chuyển enabled.

## 🔐 Rủi ro bảo mật (bắt buộc đọc)
1. **Secret server-only** — mọi khoá ở `.env.local` (đã gitignore), KHÔNG `NEXT_PUBLIC_`, không commit. Mọi gọi API ở route handler (server), không lộ token ra client.
2. **Token mã hoá at-rest** — access/refresh token lưu AES-256-GCM (`crypto.ts`), khoá `INTEGRATION_ENC_KEY` tách khỏi DB. SQLite `dev.db` là file → không lưu token thô.
3. **Scope tối thiểu** — mặc định readonly; quyền GHI (Gmail send, Calendar write) bán kính sát thương lớn → bật có chủ đích, hiển thị scope khi user connect.
4. **CSRF** — state cookie tách theo provider (`if_oauth_<provider>`), dùng 1 lần.
5. **Desktop/LAN** — app là Electron + SQLite nội bộ → **webhook/redirect từ dịch vụ ngoài khó tới**. OAuth desktop nên dùng loopback; muốn webhook (Zalo/Graph subscription, realtime) cần **backend hosted công khai** → quyết định hạ tầng trước.
6. **ToS/quota** — Zalo cá nhân bị loại (ToS); YouTube Data API quota 10k/ngày (cache+backoff); Spotify/Apple Music theo điều khoản, không cache lậu nội dung bản quyền.
7. **Ranh giới tác nhân** — người dùng TỰ tạo app OAuth + cấp khoá + bấm consent; hệ thống chỉ dựng khung, không tự đăng nhập/nhập secret hộ.
8. **Chrome clip auth** — cookie `httpOnly` khó gửi cross-origin từ extension → bản thật cần token riêng cho extension (xem `extension/README.md`).

## Áp DB (LƯU Ý drift)
Model `IntegrationAccount` đã thêm vào `prisma/schema.prisma` + `prisma generate` chạy rồi. **Chưa apply
migration** vì `dev.db` có drift (do `db push` login-social trước đó) — chạy `migrate dev` sẽ đòi RESET
(mất data team). Khi triển khai: dùng `npx prisma db push` (additive, thêm bảng, KHÔNG mất data) hoặc xử
lý drift rồi `migrate`. **TUYỆT ĐỐI không `migrate reset`** trên máy có data thật.

## Kiểm tra nhanh (không cần khoá thật)
`GET /api/integrations/<provider>/status` → `{configured:false, connected:false}` khi chưa cấu hình.
Có khoá + đã connect → gọi 1 hàm đọc (vd `listCalendarEvents`) xác nhận token+refresh chạy.
