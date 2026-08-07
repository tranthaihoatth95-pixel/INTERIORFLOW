# M-BUILD-FINAL-OUT — phiên NGHIỆM THU toàn repo (07/08 tối)

Luật đã theo: **V6 KHÔNG commit** · §0u chỉ ghi file này · N1 (số/ảnh) · N5 · N8.
Không thêm tính năng mới — 2 sửa code duy nhất là **① 1 chuỗi nhãn** (A2) và **② 1 khối config
đóng gói** (`package.json > build.extraResources`) để vá bug CHẶN PHÁT HÀNH tìm ra ở D7 (chi tiết
dưới — không vá thì D6/D7 không có đường qua trên máy người dùng thật).

---

## BẢNG TỔNG — QUA / KHÔNG QUA

| Mục | Kết quả | Số đo |
|---|---|---|
| A1 worktree mồ côi | ✅ ĐÃ XOÁ | 3 thư mục, 183MB — đủ 4 điều kiện (dưới) |
| A2 G-M15-07 | ✅ 1 sửa + 1 đã-xong-từ-trước + 1 KHÔNG SỬA CÓ LÝ DO | dưới |
| A3 `.next-HONG` | ✅ ĐÃ XOÁ | 1.9GB, xoá SAU khi `next build` mới xanh |
| B1 DETECH·CONCEPT | ✅ đã sạch TỪ TRƯỚC | grep `content-deck.ts` = 0; test khoá tại `content-deck.test.ts:53` |
| B2 ảnh khách | 📋 LIỆT KÊ, KHÔNG XOÁ | **23 file / 23.8MB** (không phải 53 — wallpapers/ đã biến mất từ trước), bảng dưới |
| B3 com.ttt | ✅ đã sạch TỪ TRƯỚC | `package.json:6` author "InteriorFlow" · appId `com.interiorflow.app` (`:74`); grep com.ttt = 0 |
| B4 mật khẩu comment | ✅ đã sạch TỪ TRƯỚC | grep password/mật khẩu trong 2 file IntroSequence = 0 |
| B5 route mẫu | ✅ đã trung tính TỪ TRƯỚC | `/present` = deck Atelier Nord hư cấu (`app/present/page.tsx:15-17`); `/demo-amanoi` KHÔNG tồn tại; "IKI Village" chỉ còn trong test CẤM (`content-deck.test.ts:53`) |
| B6 Pantone | ⏸ KHÔNG ĐỤNG (đúng phiếu) | `lib/colors/trend.ts:45-55`, chờ Hoà quyết |
| C1 LICENSE-NOTES | ✅ cập nhật bảng §2 | lập luận §0 đã đúng sẵn; bảng trạng thái ⬜→✅/🟡 khớp `M-PHAP-LY-OUT.md` |
| D1 tsc | ✅ QUA | EXIT 0, 0 dòng lỗi (chạy 2 lần: trước D và cuối phiên) |
| D2 npm test | ✅ QUA | EXIT 0 · **6.322 dòng ok** · 0 fail · `license:check` chạy ĐẦU pipeline, xanh |
| D3 next build | ✅ QUA | EXIT 0 · **85 route** · **45 trang tĩnh** · nặng nhất `/` và `/projects/[id]/render` = **747 kB** |
| D4 check:mocks | 📊 GHI SỐ | **104 quét · 29 xanh · 75 đỏ · 892 lần vi phạm** (EXIT 1 — cửa này đo mock, không chặn build) |
| D5 trang >250kB | 📋 13 trang, liệt kê + đề xuất dưới | (sổ cũ ghi 8 — nay 13, đo lại) |
| D6 electron:build:mac | ✅ QUA (sau vá) | `InteriorFlow-0.1.0-arm64.dmg` **352MB** — build 3 lần, lý do dưới |
| D7 mở app đóng gói, 3 chặng | ✅ QUA (sau vá) — **4 ảnh chụp trong transcript** | login thật → 2D (mặt bằng 58.5m², 5 phòng) → 3D (node canvas) → Trình chiếu (deck 8 slide LUMEN VILLA) |
| D8 mạng tắt | 🟡 ĐẶC TẢ TĨNH + **CHƯA VERIFY end-to-end** | lý do + phân tích dưới |

---

## 🔴 PHÁT HIỆN LỚN NHẤT PHIÊN — 2 BUG CHẶN PHÁT HÀNH trong đóng gói, đã vá 1

### D7-bug-1 (ĐÃ VÁ): electron-builder KHÔNG đóng gói `node_modules/.prisma`
- Triệu chứng: app đóng gói mở được, intro chạy, login screen hiện — nhưng **MỌI API trả 500**
  (form hiện "Unexpected token '<'… is not valid JSON" — không nuốt lỗi, nhưng không vào được app).
- Truy vết (chạy tay đúng lệnh server của app, `stdio` của app vốn 'ignore' nên phải tái hiện):
  `Cannot find module '.prisma/client/default'` — requireStack từ
  `Resources/app/node_modules/@prisma/client/default.js`.
- Gốc: `build.files` ĐÃ khai `"node_modules/.prisma/**/*"` (`package.json`) nhưng bộ gom
  node_modules của electron-builder đi theo cây dependency npm — `.prisma` không phải package npm
  ⇒ bị rơi im lặng. Máy dev không lộ vì `.app` nằm TRONG repo, Node resolve trèo lên tìm thấy
  `node_modules/.prisma` của repo; **máy người dùng thật (app ở /Applications) thì chết chắc**.
- Vá: thêm `build.extraResources` chép `node_modules/.prisma` → `app/node_modules/.prisma`,
  filter loại `**/*.db`/`*.db-journal` (tiện thể phát hiện **3 file DB rác nằm trong
  `node_modules/.prisma/client/`**: `dev.db`, `dev-ps3-test.db`, `ps4-dev.db` — không lọc là đóng
  cả DB test vào bộ cài).
- Chứng minh vá đúng: trước vá login 500 → sau vá (build lại trọn gói) login trả
  `{"user":{"id":"demo_seed_001",…}}` trên chính server app spawn (port 3777).

### D7-bug-2 (KHÔNG vá được bằng config — VẬN HÀNH phải né): `.next` bị dev server phiên khác ghi đè
Giữa 2 lần đóng gói, dev server của phiên khác (port 3000, cùng repo) ghi đè `.next` thành bản
dev ⇒ gói lần 2 thiếu `vendor-chunks`, server đóng gói chết bằng
`Cannot find module './vendor-chunks/next.js'`. Phải build TRỌN GÓI (`next build && electron-builder`
liền tay) lần 3 mới sạch. ⇒ **Luật vận hành đề nghị**: đóng gói phát hành phải chạy khi ĐÃ TẮT
mọi dev server, hoặc tách `distDir` build phát hành. Đây gần như chắc chắn cũng là cơ chế đẻ ra
`.next-HONG` hôm 07/08 sáng.

---

## A1 — bằng chứng 4 điều kiện trước khi xoá worktree

Cả 3 thư mục (`dot-b` · `pbr-schema` · `so-lenh`) có file `.git` trỏ
`/sessions/beautiful-ecstatic-volta/mnt/...` — metadata của một sandbox Cowork ĐÃ CHẾT, git trên
máy này không đọc được chúng (`git worktree list` chỉ thấy main). Kiểm thay thế bằng NỘI DUNG:

| Điều kiện | Cách kiểm | Kết quả |
|---|---|---|
| ① nhánh đã merge | `git merge-base --is-ancestor <nhánh> main` | `feat/dot-b-ha-tang` · `feat/pbr-material-schema` · `feat/so-lenh-registry` — **cả 3 MERGED** |
| ② working tree sạch | `git archive <nhánh> \| tar -x` ra thư mục tạm rồi `diff -rq` với worktree | mỗi worktree chỉ khác đúng **1 file `tsconfig.tsbuildinfo`** (artifact build) — 0 sửa đổi thật |
| ③ không dev server | `lsof +D .worktrees` | chỉ daemon `com.apple` giữ handle thư mục (Spotlight/FSEvents), 0 tiến trình node |
| ④ không nhánh mồ côi | nhánh nằm trong repo CHÍNH (bảng ①), commit sandbox (nếu có) đã mất cùng sandbox — nội dung dir = đầu nhánh nên không có gì để mất | đạt |

Xoá bằng `rm -rf` từng thư mục đích danh (KHÔNG `--force` của git — git không quản chúng nữa;
**KHÔNG đụng nhánh nào**, không `-D`). Sau xoá: `.worktrees/` biến mất, `git worktree list` = main.
⇒ hết nhiễu grep toàn repo, giải phóng 183MB.

## A2 — G-M15-07, ba chỗ

| # | Chỗ | Làm gì |
|---|---|---|
| ① | `lib/nodes/defs/render-v2.ts:292` | ✅ SỬA: `'Tầng lõi tất định (Thiết kế 2D→OBJ extrude)'` → `'(hình học 2D→OBJ extrude)'` — mô tả kỹ thuật, không phải tên chặng |
| ② | `lib/library/types.ts:87-88` | ✅ ĐÃ XONG TỪ TRƯỚC — đọc lại: `render: 'Thiết kế 3D'` · `present: 'Trình chiếu'` đã đúng |
| ③ | `components/LibraryPanel.tsx:25` vs `lib/refingest.ts:45` | ⛔ **KHÔNG SỬA — có lý do đo được**: chuỗi `'Thiết kế 2D / Sketch'` là **category KEY lưu theo từng asset trong DB** (`prisma/schema.prisma:262 category String`, POST `/api/library` bắt buộc `category`, và `lib/ref-search.ts:253` khớp CHUỖI này để ưu tiên theo chặng). Đổi nhãn = asset cũ mồ côi khỏi bộ lọc. Việc đúng là tách key ổn định khỏi nhãn hiển thị + migrate — MỘT PHIẾU RIÊNG, không nhét vào phiên nghiệm thu |

## B2 — danh sách ảnh chờ Hoà duyệt xoá (KHÔNG tự xoá, KS4)

Con số "53 ảnh" trong phiếu đã lỗi thời: `public/wallpapers/` **không còn tồn tại** trên đĩa.
Còn lại **23 file / ~23.8MB**:

- `public/covers/` — 5 file JPEG, 2.8MB (`render_00/03/04/05/10.jpeg`, mỗi file 328-724KB) —
  nghi render dự án khách (đang được dùng làm cover demo + deck dev).
- `public/detech/` — 18 file, 21MB — chắc chắn của khách (tên thư mục): `tower-night.png` 7.1MB ·
  `tower-dusk.png` 3.5MB · `enso-garden.png` 2.9MB · `enso-circle.png` 2.3MB · `pool-zen.png` 1.3MB
  · `lounge-green.png` 848K · `apt-1..4.png` (308-584K) · `wellness.png` 440K ·
  `mat-travertine.png` 424K · `lobby-water.png` 340K · `mat-palette.png` 240K · `mat-walnut.jpg` 68K
  · `meditation.jpg` 56K · `mat-moodboard.jpg` 52K · `iki-banner.png` 32K.
- ⚠️ Trước khi xoá `public/detech/`: `lib/present-editor/demo-enso-sample.ts:26-43` còn trỏ đường
  dẫn `/detech/*` (deck demo Enso) — xoá ảnh phải gỡ/hư-cấu-hoá deck đó cùng lượt, không thì deck
  demo vỡ ảnh.

## D5 — 13 trang >250kB First Load JS (shared 88.2kB)

`/` 747 · `/projects/[id]/render` 747 · `/projects/[id]/cad` 729 · `/materials` 728 · `/colors` 684
· `/projects/[id]/present` 650 · `/settings` 577 · `/files` 573 · `/projects/[id]/photo` 355 ·
`/share/[token]` 313 · `/dev-bench-3d-2` 307 · `/login` 305 · `/settings/avatar` 255 (kB).

Đề xuất (KHÔNG tự đổi kiến trúc, chỉ liệt kê):
1. `next/dynamic` cho các khối nặng chỉ dùng khi mở: `LibrarySheet` (mount trong `AppShell` mọi
   chặng), tool windows render-studio, `Scene3DViewer`/three.js (chỉ cần khi bật Vẽ 3D), photo-editor.
2. `/materials`/`/colors` kéo cả bảng + wizard ngay First Load — tách wizard nhập Excel thành chunk lười.
3. `/dev-bench-3d-2` là trang bench dev (307kB) — cân nhắc loại khỏi build phát hành.
4. Kiểm `@xyflow/react`/`framer-motion` có bị nhét vào `/login` không (305kB cho màn đăng nhập là bất thường).

## D8 — chạy không mạng: đặc tả + vì sao CHƯA VERIFY end-to-end

**KHÔNG tắt mạng máy thật trong phiên này** vì (1) đổi cài đặt hệ thống nằm ngoài quyền phiên,
(2) đang có 4-5 phiên Claude khác chạy song song trên máy — cắt mạng là cắt cầu của họ giữa chừng.
⇒ mục này ở mức ĐẶC TẢ TĨNH từ code + quan sát runtime, gắn nhãn **CHƯA VERIFY**:

| Vẫn chạy khi offline (căn cứ) | Gãy khi offline (căn cứ) |
|---|---|
| Toàn bộ lõi: server nội bộ 127.0.0.1 do app spawn (`electron/main.js:267`), DB SQLite trong userData (`main.js:126`), uploads cục bộ | Mọi node AI cloud: fal/nvidia/sd/comfy (`lib/ai/providers/*`) — có lớp lỗi rõ (`OllamaError`/`NoTextProviderError`… đã có test), không nuốt im lặng |
| Font: `next/font` self-host lúc build (`app/layout.tsx:2-3`) — không gọi Google Fonts lúc chạy bản production | Đồng bộ Lark (`lib/integrations/providers/lark.ts` → `open.larksuite.com`) — UI đã có banner "Chưa cấu hình Lark" |
| DWG/DXF/PDF/xlsx: WASM + engine thuần chạy cục bộ | electron-updater check update (github) — fail êm theo thiết kế thư viện |
| `/present` route demo: tự khai "0 auth, 0 AI, 0 mạng" (`app/present/page.tsx:7`) | Ollama là đường AI CỤC BỘ thay thế — sống nếu máy có Ollama |

## Dọn dẹp & trạng thái để lại
- App đóng gói đã tắt sau nghiệm thu; DMG nằm ở `dist-installer/InteriorFlow-0.1.0-arm64.dmg` (352MB).
- Đĩa: xoá 183MB worktree + 1.9GB `.next-HONG` — còn trống 53Gi.
- Excel vẫn mở file `boq-excel-test.xlsx` (từ phiếu p2, cố ý để Hoà liếc).
- DB userData của app đóng gói (`~/Library/Application Support/interiorflow/dev.db`) có sẵn từ
  bản cài cũ (10 user demo) — không đụng.

## File phiên này sửa (V6 — Hoà commit)
```
lib/nodes/defs/render-v2.ts   (1 chuỗi nhãn — A2①)
package.json                  (build.extraResources vá .prisma — D7-bug-1)
docs/LICENSE-NOTES.md         (bảng §2 cập nhật theo thực tế p6 — C1)
docs/M-BUILD-FINAL-OUT.md     (file này)
```
Đã XOÁ (vệ sinh, không phải file code): `.worktrees/` (3 thư mục) · `.next-HONG-2026-08-07-1610/`.

## CHƯA VERIFY / CHỜ HOÀ (N5)
1. **D8 end-to-end offline** — cần một máy/phiên không có việc khác chạy song song.
2. **DMG cài trên máy SẠCH** (ngoài repo): bug-1 chứng minh app cũ chỉ "sống giả" nhờ nằm cạnh
   repo — bản đã vá cần một lần cài thật trên máy không có repo để chốt. (Trên máy này mọi đường
   đã xanh: login + 3 chặng qua chính server app spawn.)
3. **B2**: chờ Hoà duyệt danh sách 23 ảnh; xoá `public/detech/` phải kèm sửa `demo-enso-sample.ts`.
4. **B6 Pantone** + **kênh liên hệ written-offer GPL** (`third-party-licenses.ts:29`) — 2 quyết định của Hoà còn treo.
