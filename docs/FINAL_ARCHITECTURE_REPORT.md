# FINAL ARCHITECTURE REPORT — InteriorFlow

> Sprint 4 · 14/07/2026 · nhánh `feat/devops-docs` (nền `feat/present-layout-ml-p1`).
> **Phần I đọc được bởi người không code**; Phần II trở đi dành cho dev (kèm đường dẫn file).
> Thuật ngữ in nghiêng có giải nghĩa trong `TECHNICAL_GLOSSARY.md`.

---

# PHẦN I — TỔNG QUAN (cho mọi người)

## InteriorFlow là gì

InteriorFlow là app nội bộ của TTT Architects, gom **trọn quy trình ra sản phẩm của một dự án
nội thất vào một chỗ**, theo 3 chặng nối tiếp:

```
   CAD ──────────→ RENDER ──────────→ PRESENT
 (bản vẽ mặt bằng   (ảnh phối cảnh     (dàn trang
  + kiểm chuẩn       từ AI / clay       thuyết trình
  TCVN)              3ds Max)           → PDF/PPTX/PNG)
```

Trước đây 3 việc này nằm ở 3 phần mềm (AutoCAD → D5/Photoshop → PowerPoint/InDesign), dữ liệu
chuyển tay qua export/import. InteriorFlow nối liền: bản vẽ CAD được **kiểm tra tiêu chuẩn Việt
Nam tự động**, ảnh render **bấm một nút là sang trang thuyết trình**, và app **học gu thẩm mỹ
của từng người** qua các lần Nhận/Bỏ gợi ý.

## Triết lý thiết kế (3 nguyên tắc user đã khoá)

1. **Người luôn quyết** — AI/checker chỉ *đề xuất và giải thích*, không bao giờ tự sửa bản vẽ
   hay tự áp bố cục ("điều khoản hiến pháp" ghi ngay đầu `lib/cad/standards/checker.ts`).
2. **Gu không hardcode** — gu thẩm mỹ được *trích từ thư viện Reference và từ phản hồi của
   chính người dùng*, mỗi sản phẩm mỗi khác; không có "một style đóng đinh trong code".
3. **Chạy được trên máy yếu, thiếu mạng, thiếu key** — mọi tầng AI xếp bậc thang: tầng miễn
   phí tức thì luôn chạy; tầng trả phí là tuỳ chọn; thiếu key thì *báo rõ* và tụt bậc, không
   hỏng việc chính (Mac 16GB là máy chuẩn để thiết kế ràng buộc).

## Sản phẩm chạy ở đâu

| Bản | Công nghệ | Dữ liệu | Trạng thái |
|---|---|---|---|
| **Desktop Mac** (.dmg) | Electron bọc Next.js server nội bộ | SQLite trên máy | build được, unsigned |
| **Desktop Windows** (.exe) | như trên, đóng gói NSIS | SQLite trong AppData | config sẵn, build trên máy Win (`docs/BUILD-WINDOWS.md`) |
| **Web / PWA** (iPad, điện thoại) | Vercel + Supabase Postgres | Postgres cloud | đã chuẩn bị (`docs/DEPLOY-VERCEL.md`), chưa deploy |

## Hiện trạng chất lượng (cổng Sprint 2, 14/07)

**492 test / 20 file PASS · TypeScript 0 lỗi · verify trình duyệt 7 PASS + 1 SKIP.**
Lịch sử chi tiết: `CHANGELOG.md`. Việc treo & nợ kỹ thuật: `STATUS.md`.

---

# PHẦN II — KIẾN TRÚC KỸ THUẬT

## 1. Khung tổng thể

- **Next.js 14 (App Router)** — UI React + API routes cùng một codebase (`app/`, `app/api/`).
  Không tách frontend/backend: một `next start` là đủ cả app.
- **Prisma + SQLite** (`prisma/schema.prisma`) — User, Flow, Project, CreditTransaction,
  ChatMessage, LibraryAsset, IntegrationAccount (token OAuth *mã hoá AES-256-GCM*,
  `lib/integrations/crypto.ts`). Lên cloud chỉ đổi provider sang `postgresql`.
  ⚠️ Có *migration drift* (IntegrationAccount) → luật: **chỉ `prisma db push`, cấm reset**.
- **Zustand** (`lib/store.ts`, `lib/cad/store.ts`) — state canvas/flow phía client.
- **Electron** (`electron/main.js`) — bản desktop: spawn `next start` ở cổng trống ≥3777
  (chỉ nghe 127.0.0.1), trỏ SQLite + uploads về thư mục userData ghi được, single-instance,
  `contextIsolation: true`. Chi tiết: `README-electron.md`.
- **PWA** — `public/manifest.webmanifest` + `public/sw.js` (headers cấu hình trong
  `next.config.mjs`) → cài lên màn hình chính iPad/Android, chạy standalone.
- **Test** — không dùng jest/vitest runner nặng: từng file `*.test.ts` chạy thẳng bằng
  `node_modules/.bin/sucrase-node <file>` (nhanh, 0 config). 20 file / 492 assert.

## 2. Chặng CAD (`app/cad-editor`, `lib/cad/`)

**Mô hình dữ liệu** — `lib/cad/model.ts`: `Doc` = danh sách `Entity` (line, polyline, text,
hatch, block…) + layer, toạ độ mm thật. Import/export **DXF** round-trip (`lib/cad/dxf.ts`
+ test). Lệnh vẽ/sửa: `commands.ts`, `modify.ts`, `grips.ts` (kéo grip), `query.ts` (đo/dò).

**Phản xạ AutoCAD** — type-anywhere (gõ lệnh bất kỳ đâu trên canvas + autocomplete),
Enter lặp lệnh, dynamic input F12.

**Hatch / dò phòng** — `lib/cad/hatch.ts`: từ đống đoạn thẳng rời rạc dựng *DCEL* (đồ thị
nửa-cạnh) toàn cục, liệt kê mọi mặt kín → tìm đúng biên phòng kể cả giao chữ T
(fix T-junction `fd4718d`). Đây là nền của mọi phép đo diện tích phòng. 33/33 test.

**Kiểm chuẩn (standards)** — `lib/cad/standards/`:
- `registry.ts` — sổ đăng ký nhóm rule, chọn bộ theo loại không gian.
- `vn-residential.ts` (TCVN 4451:2012 nhà ở — vd bếp ≥ 10m²), `vn-fire.ts`
  (QCVN 06:2022/SĐ1:2023 PCCC), `intl-egress.ts` (NFPA 101/IBC thoát hiểm),
  `iso-drafting.ts` (trình bày bản vẽ), `neufert.ts` (nhân trắc/kích thước đồ đạc Neufert).
- `checker.ts` — chạy rule trên `Doc`, trả cảnh báo **kèm giải thích + số đo thật**,
  *chỉ đọc, không sửa* (hiến pháp). 15/15 + 22 test intl.

**Phân loại operator** — `lib/cad/operator-profile.ts`: đoán loại vận hành không gian
(residential / office / f&b / retail / hospitality / clinic / generic) bằng heuristic có trọng
số trên block inventory × tập phòng × text, ra `{operator, confidence, evidence[]}` — cắm vào
checker để chọn đúng bộ tiêu chuẩn, và vào panel UI ("residential 59% — 1 giường").
Bổ sung tín hiệu hình học: `lib/cad/gu-features.ts` (xem §5).

**Handoff CAD → Render** — `lib/cad/handoff.ts`: stash bản vẽ/ảnh qua sessionStorage
(consume-once) để chặng Render nhận mà 2 route không chung store.

## 3. Chặng RENDER (`app/page.tsx`, `lib/nodes/`, `lib/ai/`)

- **Canvas node** (React Flow — `@xyflow/react`): mỗi bước xử lý ảnh là một node
  (Import, AI render, upscale, Export Deck…), nối dây thành pipeline; `lib/execution.ts` chạy graph.
- **Providers AI** (`lib/ai/providers/`): `fal.ts` (cloud, cần FAL_KEY, trừ credit),
  `nvidia.ts` (VLM free), ComfyUI local (`COMFYUI_URL` — máy RTX công ty, 0đ/ảnh, bản vẽ
  không rời máy; workflow clay2render/sketch_canny trong `comfyui/`). Thiếu key → node báo
  "chưa cấu hình", không chặn phần khác.
- **Credits** (`lib/server/credits.ts` + model CreditTransaction) — đếm chi phí render cloud
  theo user.
- **Handoff Render → Present** — `lib/present-editor/handoff.ts`: nút "Đưa sang Present →"
  trên node ảnh → stash (sessionStorage + fallback biến module khi quota vỡ vì dataURL to)
  → `/present-editor` consume-once, không double-import.

## 4. Chặng PRESENT — layout engine (`app/present-editor`, `lib/present-editor/`)

Pipeline "ảnh mẫu → deck" gồm 5 module tất định (0 AI, chạy client):

1. **`detect-regions.ts`** — nhận diện LƯỚI từ 1 ảnh bố cục tham khảo bằng *projection
   profile* trên bản đồ cạnh (gradient) → bất biến nền trắng/đen; phần toán tách hàm thuần
   để test không cần DOM. Trả `RegionCell[]` theo % sân khấu + gutter.
2. **`standards.ts`** — `DECK_STANDARDS`: ngân sách định lượng đúc từ nghiên cứu
   Gamma/Canva/Figma (12-col grid, 6×6 rule, safe-zone 5%, *bento* 6–9 ô, whitespace…).
3. **`region-layout.ts`** — gán VAI TRÒ cho ô bằng hình học (ô mỏng nằm cao = tiêu đề, ô to
   = ảnh, còn lại = body), **kẹp số ô về budget** chống loãng, "one idea per card".
4. **`layout-check.ts`** — guardrail sau dàn trang: trống/chật/tràn chữ → toast cảnh báo
   (không tự sửa).
5. **`reference-layout.ts`** — ảnh mẫu → deck hoàn chỉnh + augment biến thể.

Trên đó: `suggest.ts` + `templates.ts` (21 template) → **LayoutShelf** (kệ gợi ý bố cục,
nút Nhận/Bỏ + tooltip giải thích — đầu vào của perceptron §5). Xuất file: `export.ts`
(PDF qua jspdf, **PPTX** qua pptxgenjs 16:9 ảnh nhúng, PNG từng trang; CAD xuất DXF).

## 5. ML "Gu Engine" — kiến trúc 2 phần: 3 tầng feature + vòng học online

Đề xuất đầy đủ: `docs/ML-GU-ENGINE-PROPOSAL.md` (pha nặng CHƯA được duyệt — phần dưới là
những gì ĐÃ chạy, thuần TS, 0 GPU/0 key).

**Ba tầng feature (L0/L1/L2)** — dùng chung cho cả 3 chặng:

| Tầng | Bản chất | Chi phí | Trạng thái |
|---|---|---|---|
| **L0** | thống kê local: pixel/canvas (Present, Render), hình học vector (CAD) | 0đ, tức thì | ✅ chạy |
| **L1** | lexical: từ điển term + học term từ tag/caption | 0đ | ✅ chạy |
| **L2** | embedding / VLM qua API (NVIDIA free, fal) | phí/độ trễ | tuỳ chọn, có key |

Các bộ trích L0 đã có:
- CAD: `lib/cad/gu-features.ts` — *occupancy grid* 8×8 (mật độ nội thất), adjacency graph
  (phòng kề nhau), *typology* bố cục (linear/island/perimeter/open-plan/cellular) — nối vào
  operator-profile như tín hiệu additive.
- Render: `lib/gu/color-psychology.ts` — palette hex → không gian màu *LAB*, gom màu bằng
  *ΔE*, ánh xạ tất định palette → tâm-lý-màu (giải thích "vì sao gu này hợp không gian nghỉ dưỡng").
- Present: `detect-regions` + `grid-geometry.ts` (gutterBands, patternIconHint).

**Từ điển feature chung** — `lib/gu/feature-dict.ts`: chuẩn hoá TÊN + thang đo (~0..1) cho
mọi feature (`img.*`, `text.*`, `pal.*`, `grid.*`…) — để trọng số học ở chặng này tái dùng
được ở chặng khác và mọi gợi ý **giải thích được**.

**Vòng học** — `lib/gu/pairwise-perceptron.ts`: *pairwise perceptron* online
(learning-to-rank). Mỗi lần user Nhận A / Bỏ B tạo 1 cặp (A ≻ B); model chỉnh vector trọng
số thưa sao cho score(A) > score(B) + margin. η nhỏ (0.05) + clamp trọng số chống drift;
**degrade**: dưới 10 cặp thì giữ nguyên thứ tự heuristic. Cắm tại LayoutShelf (Sprint 2):
sau ~10 cặp thứ hạng gợi ý tự xếp theo gu, lưu bền qua reload. 18 test.

## 6. Multi-sheet + persistence

- Mỗi chặng CAD/Present làm việc theo **sheet, tối đa 5** (`docs/MULTI-SHEET-PROPOSAL.md`).
- `lib/sheets-persist.ts` — serialize CẢ BỘ sheet vào **IndexedDB**, khoá `userId::route`
  (mỗi user × mỗi chặng một bản ghi), autosave debounce 1.2s. Chọn IDB thay localStorage vì
  deck chứa ảnh dataURL hàng MB (đo thật: CAD 15.2KB, deck 226.5KB). JSON round-trip trước
  khi ghi để chặn giá trị không serialize được.
- `lib/resume.ts` — nhớ per-user đang ở chặng/sheet nào → mở app là về đúng chỗ.
- Server-side: Flow/FlowVersion trong SQLite (snapshot version — chính cơ chế đã cứu flow
  "Render test" bị ghi đè hôm 13/07).

## 7. Auth & chính sách tài khoản

`lib/server/auth-policy.ts` (pure, test được ngoài Next) + `auth.ts` + `oauth.ts`:

- **Đăng nhập**: email+mật khẩu (bcryptjs) hoặc **Google OAuth chỉ domain @ttt.vn**
  (env `GOOGLE_ALLOWED_DOMAIN`); redirect_uri lấy theo origin request → deploy domain mới
  chỉ cần khai với Google Console.
- ***Grandfather***: user Google ngoài domain nhưng ĐÃ có trong DB (trước khi siết) vẫn đăng
  nhập được; chỉ chặn tạo mới.
- **Register công khai = 403** kể cả DB trống; bootstrap admin bằng *seed script*
  `scripts/seed-admin.ts` (idempotent, upsert theo email — cũng là đường admin reset mật khẩu).
- **Remember-Me**: cookie phiên (đóng là hết) vs cookie 30 ngày; JWT ký bằng `AUTH_SECRET` (jose).

## 8. UI hệ thống

- **Liquid Glass** (*glassmorphism*): LoginBackdrop 4 preset nền + upload; **Unified Dock**
  `.if-dock` — Header + StudioBar cùng ngôn ngữ kính mờ; StageTransition (veil) khi chuyển chặng.
- **FoldableDualPane**: `?dualpane=1` — ≥840px hiện 2 khung, thu nhỏ về 1 khung giữ state
  (target test: Galaxy Fold N6).
- **SmartTour** 4 bước cho người mới; i18n `lib/i18n.ts`.

## 9. Tầng tích hợp ngoài (khung)

`docs/INTEGRATIONS.md` + `app/api/integrations/` + model IntegrationAccount: Google/MS365/Zoom
(thật), Zalo-OA/Spotify/YouTube (khung), Apple Music (stub), Chrome clip. Token lưu mã hoá.
⚠️ Chính là nguồn migration drift — xem §1.

## 10. Rủi ro / nợ kỹ thuật hiện hành (tóm từ STATUS.md)

1. Migration drift IntegrationAccount — chỉ `db push`, schema change phải duyệt.
2. Hydration tooltip ⌘Z (`lib/kbd.ts:11`) — cosmetic.
3. `window.prompt` crash trong webview nhúng (Dashboard.tsx:138) — browser thật OK.
4. Uploads trên Vercel là filesystem tạm — thư viện ảnh lâu dài cần Supabase Storage (chưa làm).
5. asar=false trong electron-builder (bundle to, 321MB dmg) — đổi sang asar+unpack là việc
   tối ưu sau, không chặn phát hành nội bộ.

## 11. Bản đồ thư mục nhanh

```
app/                  UI + API routes (Next App Router)
  api/auth|flows|render|present|library|integrations|…
  cad-editor/  present-editor/  photo-editor/  library/
lib/
  cad/                model, dxf, hatch(DCEL), commands, standards/ (TCVN/QCVN/NFPA/Neufert)
  present-editor/     detect-regions, standards, region-layout, layout-check, export…
  gu/                 feature-dict, pairwise-perceptron, color-psychology
  ai/providers/       fal, nvidia, (comfyui qua env)
  server/             auth, auth-policy, oauth, credits, db
  sheets-persist.ts   resume.ts   store.ts   execution.ts
electron/             main.js (spawn next start), preload.js, icons/
prisma/               schema.prisma (SQLite; cloud → postgresql), dev.db
public/               manifest.webmanifest, sw.js, icons (PWA)
docs/                 BUILD-WINDOWS, DEPLOY-VERCEL, HUONG-DAN-SU-DUNG, ML-GU-ENGINE-PROPOSAL…
scripts/seed-admin.ts
```
