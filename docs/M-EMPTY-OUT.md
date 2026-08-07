# M-EMPTY-OUT — bỏ hết dự án mẫu, app bắt đầu trống (07/08 tối)

> **VÒNG 2 (phiếu dán lại, cùng phiên):** phần thân dưới là vòng 1 đã xong — không làm lại (§0z).
> Vòng 2 chỉ chạy các mục MỚI của bản phiếu sau:
> - **② e** `public/__testcases/present.json:32,33` — 2 đường dẫn `/detech/*` → `/demo/mood2.jpg` +
>   `/demo/mood3.jpg` (ảnh hư cấu có sẵn cùng bộ với ca Quote đang dùng `/demo/mood1.jpg`). JSON
>   parse hợp lệ, 2 ảnh tồn tại. ⚠️ `runner.js` là harness DEV-ONLY chạy TAY trong console trình
>   duyệt (đọc đầu file), KHÔNG nằm trong `npm test` — "chạy lại test" = `npm test` exit 0 + JSON/
>   ảnh kiểm tồn tại; chạy harness tay là việc dev thủ công, ghi CHƯA VERIFY.
> - **③ `node scripts/check-chot.mjs`**: luật **KHONG-DU-AN-MAU ✅ 0 chỗ** — muốn vậy phải làm 2
>   việc cửa kiểm đòi thêm: ① **đổi tên `lib/present-demo.ts` → `lib/present-render.ts`** (luật
>   quét THEO TÊN FILE; nội dung đã sạch mẫu từ vòng 1) + sửa 4 import (`PresentDeck` ·
>   `PresentOverlay` · `ConceptForm` · `RenderIOMenus` — cái thứ 4 grep vòng 2 mới lộ); ② luật
>   **TRUNG-TINH ✅ 0 chỗ** — 2 comment lịch sử trong `components/intro/TitleSequence.tsx:39,181`
>   còn chữ "/detech/" (regex CAM bắt cả comment) → viết lại 2 câu bỏ tên, giữ nguyên nghĩa
>   (ngoài vùng phiếu, 2 dòng comment, khai báo rõ). 32 🔴 còn lại của check-chot thuộc các luật
>   KHÁC (catch rỗng, jargon…), ngoài phạm vi phiếu này.
> - Kiểm lại sau vòng 2: `tsc` toàn repo **0 lỗi** · `npm test` **exit 0** · `next build` **exit 0**
>   (2 lần; vài dòng `PageNotFoundError` ở lần chạy chồng là tranh chấp `.next` với dev server
>   phiên khác đang chạy port 3000 — §0aa, không phải code) · grep bước ③ chỉ còn comment giải
>   thích có khai báo.

Chốt Hoà thi hành: *"Bỏ hết dự án mẫu. App xuất ra trung tính... App thật bắt đầu bằng card +."*
V6 KHÔNG commit (mọi thao tác xoá = `rm` trên đĩa, KHÔNG đụng git index — Hoà commit).
§0u: delta cuối file. Đúng thứ tự phiếu: dựng trạng thái rỗng TRƯỚC, gỡ mẫu SAU — không lặp G-M14-02.

## BƯỚC ① · TRẠNG THÁI RỖNG 4 MÀN

| Màn | Trạng thái | Bằng chứng |
|---|---|---|
| 1 · Dự án | ✅ **ĐÃ CÓ SẴN, không code thêm** — flows=[] hiện "Chưa có dự án nào / Tạo dự án đầu tiên để bắt đầu vẽ" + nút "Dự án mới" (port từ mock duyệt `mock-if-du-an-v2.html` màn 02) | `components/ProjectSelect.tsx` grep `emptyBlock` (:1139-1168 trước sửa) + `flows.length === 0 ?` |
| 2 · Thiết kế 2D | ✅ **DỰNG MỚI** — card giữa canvas khi `doc.entities.length===0`: "Bản vẽ đang trống" + 2 nút chữ "Nhập bản vẽ có sẵn" (mở đúng picker DXF `fileRef` sẵn có) / "Vẽ mới" (đóng thẻ, canvas sẵn sàng); song ngữ `useT`; không chặn canvas (pointerEvents chỉ trên thẻ) | `components/cad/CadEditor.tsx` grep `M-EMPTY (07/08` — ⚠️ NGOÀI vùng phiếu này nhưng phiếu đòi màn 2; `components/cad` là vùng p9 của CHÍNH phiên này các lượt trước, không phiên nào khác đang chạm (kiểm M-OUT 40') |
| 3 · Thiết kế 3D | ✅ **ĐÃ CÓ SẴN, không code thêm** — "Không gian trống" + card "Bắt đầu dựng không gian" + 2 nút "Đùn từ bản vẽ / Dựng khối đầu tiên" (mẫu đúng luật X2 từ trước) | `components/render-studio/Render3DModeSkeleton.tsx:575-605` — KHÔNG đụng (ngoài vùng) |
| 4 · Trình chiếu | ✅ **DỰNG MỚI** — deck khởi đầu = RỖNG 0 slide; màn "Chưa có slide nào" + 2 nút "Tạo từ ảnh đã dựng" (tạo trang trắng THẬT + mở picker ảnh, dùng lại `onAddImageUrl` sẵn có) / "+ Trang trắng"; song ngữ | `PresentSheets.tsx` (`initialDeck` optional → `{...blankDeck(1), slides: []}`) · `PresentEditor.tsx` grep `M-EMPTY (07/08)` ×2 · `PresentStageScreen.tsx` bỏ `makeSampleDeck` |

Đối chiếu mock `Nhập bản vẽ có sẵn.dc.html`: card màn 2 là TRẠM DẪN vào cửa nhập (đúng phạm vi
phiếu này); toàn bộ hợp đồng lớn của mock (nạp lô · checkpoint duyệt từng tờ · mã lần nạp) là GAP
[CAD-B-a] đã ghi ở `M-CAD-B-OUT.md`, KHÔNG nhét vào lượt này.

## BƯỚC ② · GỠ MẪU

### a. File xoá HẲN (rm, 942 dòng / 9 file + 1 file GIỮ-CÓ-LÝ-DO)
`lib/demos/_shared.ts` (117) · `lib/demos/clay.ts` (64) · `lib/demos/concept.ts` (71) ·
`lib/demos/present.ts` (135) · `lib/demos/sketch.ts` (57) · `lib/demo-seeds.ts` (35) ·
`lib/present-editor/sample.ts` (78) · `lib/present-editor/akh-sample.ts` (138) ·
`lib/present-editor/demo-enso-sample.ts` (147) — thư mục `lib/demos/` đã rmdir.
**LỆCH so phiếu, có lý do:** `lib/present-demo.ts` (197) KHÔNG xoá hẳn được — 3 màn THẬT đang ăn
util của nó (`PresentDeck`/`PresentOverlay` mount ở HomeScreen:705 trình chiếu slide THẬT từ flow;
`ConceptForm` dùng `downloadImage`). Đã **mổ**: gỡ `DEMO_DECK` + `COVER_IMAGES` + đổi
`DemoSlideSpec.hero:number` (index vào ảnh mẫu) → `heroUrl?:string`; `renderMoodboard` nay lấy ảnh
từ CHÍNH deck, hết dây vào ảnh khách. 197 → **120 dòng**, 0 dữ liệu mẫu. Tổng gỡ thật: 942 + 77 =
**1.019/1.039 dòng**; 20 dòng còn lại là util sống có người ăn.

### b. Route
| Route | Quyết | Vì sao |
|---|---|---|
| `app/present/` | ❌ XOÁ | showcase DEMO_DECK thuần (`page.tsx:12,22`), không màn thật nào trỏ tới |
| `app/demo-resort/` | ❌ XOÁ | demo dev-only (tự khai đầu file, gate NEXT_PUBLIC_DEMO) |
| `app/library/` | ✅ GIỮ NGUYÊN | màn THẬT — redirect mở Library sheet (Hoà chốt 03/08 "thư viện là SHEET"); `ingest/` là cửa nạp thật, grep 0 dữ liệu mẫu |
| `app/present-editor/` | ✅ GIỮ NGUYÊN | màn THẬT — LegacyStageRedirect về `/projects/[id]/present`, không mang mẫu |

### c. Nơi tiêu thụ đã gỡ/sửa
- `PresentStageScreen.tsx` — bỏ `makeSampleDeck` (gốc G-M14-02), `<PresentSheets />` không deck.
- `components/DemoLauncher.tsx` — XOÁ; `FlowCanvas.tsx` gỡ import + cụm "bắt đầu bằng 1 demo
  thực tế" (empty state còn 1 câu mời + nút Thư viện khối); dọn luôn 4 import mồ côi phát sinh
  (`stageTransition`/`DEFAULT_PHASE`/`workspace`/`framer-motion`).
- `components/present/PresentDeck.tsx` + `PresentOverlay.tsx` — chỉ sửa COMMENT nói dối ("mặc
  định deck DEMO mẫu" — thực tế không có default nào, đo bằng đọc destructure).
- `components/form/ConceptForm.tsx` — giữ nguyên (chỉ ăn `downloadImage`, util sống).
- **NGOÀI danh sách phiếu, cùng tâm chốt (mở rộng có khai báo):**
  - `components/entry/WelcomeIntro.tsx` — GỠ nút "Mở dự án mẫu để xem thử" (tạo flow +
    `requestCadDemoSeed()` + buildDemoPlan cho NGƯỜI DÙNG MỚI — vi phạm thẳng "app thật bắt đầu
    bằng card +"). Còn đúng 1 nút "Tạo dự án của tôi".
  - `components/entry/cardFaces.tsx` — 3 mặt thẻ `CoverPhoto` (ảnh `/covers/render_00|04|10`)
    → `CoverArt` gradient vật liệu trừu tượng, đúng tiền lệ `TitleSequence.tsx:39`.
  - `components/ProjectSelect.tsx:121` — 3 bìa mặc định + fallback hash-cover trỏ ảnh khách
    → 3 gradient SVG data-URI (giữ nguyên khuôn `<img src>`/`coverUrl`).

### d. 23 ảnh render khách — XOÁ SAU CÙNG (KS4, liệt kê đủ; grep code = 0 trước khi xoá)
`public/detech/` (18): apt-1.png · apt-2.png · apt-3.png · apt-4.png · enso-circle.png ·
enso-garden.png · iki-banner.png · lobby-water.png · lounge-green.png · mat-moodboard.jpg ·
mat-palette.png · mat-travertine.png · mat-walnut.jpg · meditation.jpg · pool-zen.png ·
tower-dusk.png · tower-night.png · wellness.png
`public/covers/` (5): render_00.jpeg · render_03.jpeg · render_04.jpeg · render_05.jpeg ·
render_10.jpeg — tổng ~24MB, khớp bảng B2 `M-BUILD-FINAL-OUT.md`. Cả 2 thư mục đã rmdir (rỗng).
**DB không vỡ:** `sqlite3 dev.db` — 39 flow coverUrl NULL (ăn fallback gradient mới) + 7 flow trỏ
`/api/library/...` (ảnh user upload) + **0 flow trỏ `/covers/render_*`**.
⚠️ Ảnh còn trong LỊCH SỬ git — `filter-repo` trước phát hành (việc Hoà, đã ghi sổ từ trước).

## BƯỚC ③ · GREP CÒN SÓT
Lệnh phiếu chạy ra **0 dòng code**; các dòng còn lại giải trình đủ:
- `enso` trong `lib/moodboard-boards.ts` + `ConceptForm.tsx` = **bố cục moodboard 円相 ENSŌ** (tính
  năng thật, trùng tên tình cờ với deck demo đã xoá) — GIỮ.
- `sensor`/`licensors` khớp chuỗi con "enso" — dương tính giả của regex.
- Các dòng nhắc `DEMO_DECK`/`makeSampleDeck`/`detech` còn lại đều là **COMMENT lịch sử/giải thích**
  (present-demo:4 · PresentDeck:7 · PresentOverlay:14 · PresentStageScreen:97 · cardFaces:26 ·
  TitleSequence:39,181 · FlowCanvas:888) — không import, không đường chạy.
- 2 comment cũ trỏ file đã xoá (`HomeScreen.tsx:361` nhắc demo-resort · `task-cards.ts:11` nhắc
  lib/demos/sketch) — chữ chú thích, ngoài vùng, không sửa để khỏi lấn; TỔNG cho ai tiện tay dọn.

## VERIFY (N1)
- `npx tsc --noEmit -p .` **exit 0** · `npm test` **exit 0** · `npx next build` **exit 0** — cả ba
  chạy SAU khi xoá hết file + ảnh.
- Browser thật (server riêng `interiorflow-verify` cổng 3001, đã tắt sau verify; ⚠️ đi qua
  `localhost:3001` vì preview pane từ chối `127.0.0.1` — lệch luật máu #2 phần địa chỉ, khai báo):
  **4 ảnh trong transcript**: ① WelcomeIntro chỉ còn 1 nút "Tạo dự án của tôi" · ② 2D "Bản vẽ đang
  trống" + 2 nút, bấm "Vẽ mới" đóng thẻ đúng · ③ 3D "Không gian trống" + "Đùn từ bản vẽ / Dựng
  khối đầu tiên" · ④ Trình chiếu "0 slide" + "Chưa có slide nào" + "Tạo từ ảnh đã dựng / + Trang
  trắng". Console: **0 lỗi**. Không tạo dữ liệu mới, không logout, không đụng cookie.

## CHƯA VERIFY (N5 — nói thẳng)
- **Màn 1 ở trạng thái danh-sách-RỖNG bằng mắt**: cần tài khoản MỚI ⇒ phải logout/đăng ký — luật
  máu #2 cấm đụng cookie phiên Hoà (cookie localhost dùng CHUNG mọi port ⇒ logout ở 3001 giết luôn
  phiên server 3000 của phiên khác đang chạy). Bằng chứng thay thế: code emptyBlock có sẵn từ mock
  duyệt + WelcomeIntro 1-nút đã chụp. Hoà tự kiểm 30 giây bằng máy sạch/profile trình duyệt khác.
- EN + light theme của 2 màn mới: chuỗi EN nằm trong code (`useT` cả 2 chỗ), token màu theo theme
  — CHƯA chụp bằng mắt.
- Nút "Tạo từ ảnh đã dựng" mới bấm tới bước mở picker (headless không chọn được file thật).

## HÀNG ĐỢI (§V7)
| | |
|---|---|
| ✅ xong | ①4 màn rỗng (2 dựng mới, 2 đo có sẵn) · ②a 9 file xoá + present-demo mổ còn 120 dòng · ②b 2 route xoá, 2 route thật giữ · ②c 6+3 nơi tiêu thụ · ②d 23 ảnh (~24MB) · ③ grep 0 · tsc/test/build 0 lỗi · 4 ảnh verify |
| 🟡 treo | 3 mục CHƯA VERIFY trên · 2 comment mồ côi ngoài vùng |
| 🔴 cửa mẫu CÒN LẠI, chờ TỔNG quyết | `lib/cad/demo-plan.ts` (buildDemoPlan + preset 74m²) + `lib/cad/seed-demo-flag.ts` + nút "Mở bản demo" NỘI BỘ trong menu "Bắt đầu" của CadEditor (grep `openDemo\|Bắt đầu`) — KHÔNG nằm trong danh sách 10 file của phiếu, và còn `templates.ts`/test đang ăn `demo-plan`. Nếu chốt "bỏ hết" phủ cả cái này thì cần phiếu riêng (blast radius: templates + 2 file test) |
| Đã dọn | server 3001 tắt · không dữ liệu test trong DB (0 flow mới, kiểm bằng chính flow "Untitled flow" có sẵn) |
