# CHANGELOG — InteriorFlow (lịch sử đã xong; KHÔNG đọc mỗi đầu phiên — chỉ khi được yêu cầu)

## 02/08 — 3D-1 viewer orbit + 3D-2..5 xác nhận đã có sẵn + PDF 300dpi + ESRGAN đo thật + P3 phần 2 upscale in

Dời từ STATUS.md (03/08, dọn cho dưới 800 từ) — chi tiết đủ nằm trong message commit từng mục:
- **3D-1** (`d9eea9b`+`d5f6700`): three.js viewer mode orbit + nút "Xem 3D". FPS: gộp theo màu 4 draw
  call/0.087ms/khung, không gộp 2011/2.73ms — vẫn realtime.
- **3D-2..3D-5 ĐÃ CÓ SẴN TỪ TRƯỚC** (`d7dff63`/`4c81469`/`87c2e78`/`2881c32`). Mới thêm: đổi chữ ký
  `captureSequence()` sang streaming `onFrame`+`AbortSignal`+`frameCount` (tránh gom RAM) +
  `planCaptureSequenceFrames()` thuần có test (26/26).
- Wire nút "PDF in 300dpi (A3/A4)" (`2a252c9`) — mở khoá theo khổ giấy, verify cả 2 nhánh.
- Đo ESRGAN thật (Hoà duyệt ~4cr) — TB 9.7s/ảnh · scale ×4 đúng lý thuyết.
- P3 phần 2 (`8b7e282`) — `lib/present-editor/print-upscale.ts` + `upscale-cache.ts` (IndexedDB, key
  = hash SHA-256 src) + `export.ts` tự upscale trước khi render + confirm giá/thời gian trước khi
  trừ credit thật. Verify: credit spend/refund atomic đúng, export không crash khi upscale lỗi.

## 03/08 — NC-12 bộ lệnh 3D VIỆC 1-3 (boolean CSG thật) + sửa bug mất dữ liệu mode 3D

Dời từ STATUS.md (04/08, dọn cho dưới 800 từ):
- **NC-12 VIỆC 1-3**: `three-mesh-bvh`+`three-bvh-csg` (MIT) · `Base.ops?: BuildOp[]` (`model.ts`,
  3 phép `extrude`/`boolean`/`arrayLinear`, optional/additive) · boolean THẬT: `lib/three/csg.ts` +
  `lib/three/build-ops.ts` (cache runtime, KHÔNG vào Doc) + `cad-to-obj.ts` dựng cutter + `lib/cad/
  commands.ts` `cutHoleInWall` + nút "Khoét hốc" (`Object3DInspector.tsx`). 30 test, tsc scoped sạch.
- **Sửa bug MẤT DỮ LIỆU mode 3D**: mode "3D Thiết kế" không autosave IndexedDB (bug có từ push-pull
  3D-5) — `useCad3DAutosave()` nối lại đúng `lib/sheets-persist.ts`, gọi ở gốc
  `Render3DModeSkeleton.tsx`. `lib/cad/cad3d-autosave-core.ts` (13 test, debounce 1200ms thật) +
  `lib/cad/cad-doc-hydration.ts` (cờ chống race 2D↔3D). Verify: khoét hốc → F5 → hốc còn nguyên.

## 03/08 — BOQ editor B0-B6+B10 + xlsx SUM sống B8 (TRÌNH-CODE)

Dời từ STATUS.md (03/08, dọn cho dưới 800 từ) — chi tiết đủ → `docs/PHIEU-TRINH-BOQ-EDITOR.md`,
message commit `4991340`/`18afba3`. Live-link override (sửa tay ô m²/đơn giá, badge+revert+cảnh báo)
· group theo tầng · truy vết ngược "Xem trên bản vẽ" · treo tạm nút BOQ trong `PresentNavigator`
(chờ H4 5-loại-hồ-sơ) · 27+36 test pass. Bắt+sửa 1 bug thật lúc verify browser (vòng lặp vô hạn
`useT()` trong `useCallback` deps). CHƯA làm: B7 cột tuỳ biến · B9 in PDF (treo, ghi rõ). B11
(mini-DSL) GATED chờ PHU.

## 02/08 tối — 3D-2: sửa STATUS.md sai (3D-2..5 thật ra ĐÃ XONG) + đổi captureSequence sang streaming

**Phát hiện trước khi viết gì**: nhận việc "làm 3D-2" theo đúng chỉ đạo (`docs/SPEC-3D-CORE.md` §4),
nhưng `git log` trên `lib/three/capture.ts`/`components/three/Scene3DViewer.tsx` cho thấy 3D-2
(`d7dff63`) → 3D-3 depth/lineart (`4c81469`) → 3D-4 section/walk (`87c2e78`) → 3D-5 push-pull massing
(`2881c32`) ĐÃ COMMIT SẴN VÀO MAIN, working tree sạch — `STATUS.md` mục "⬜ CHƯA BẮT ĐẦU" ghi sai
hoàn toàn (đã sửa). `Scene3DViewer.tsx` đã có đủ 5 mode `orbit/campath/section/walk/massing`; mode
`campath` áp đúng `LookAtMode` (tangent/point/zone) tự động qua `sample.dirRad` (đã tính sẵn trong
`planCamPath()`, không cần logic riêng ở viewer) — **task "Scene3DViewer thêm mode campath" KHÔNG
cần code mới**.

**Việc thật còn lại — đổi API `captureSequence()`** (`lib/three/capture.ts`): bản 3D-2 gốc trả thẳng
`string[]` (gom HẾT khung PNG base64 vào 1 mảng RAM trước khi trả) — Hoà yêu cầu (02/08 tối) đổi
sang streaming vì "cảnh mật độ cao nhiều khung có thể rất nặng". Đổi chữ ký "hợp đồng"
(`SPEC-3D-CORE.md` §3 — đổi phải qua duyệt, coi lệnh trực tiếp của Hoà là duyệt): đã `grep` xác nhận
0 nơi gọi `captureSequence` ngoài chính file + test, nên đổi THẲNG không giữ song song chữ ký cũ.

Chữ ký mới: `captureSequence(scene, path, { fps, frameCount?, w, h, onFrame, signal? }):
{ frameCount, aborted }`. `onFrame` nhận từng khung NGAY sau khi render (không giữ mảng nội bộ nào
tích luỹ cả — nơi gọi tự quyết dùng `dataUrl` thế nào). `signal?: AbortSignal` kiểm TRƯỚC mỗi khung
(không huỷ giữa khung đang render dở). `frameCount` tuỳ chọn ép đúng số khung, dàn ĐỀU trên
`[0, totalDurationSec]` — khung cuối CHẠM đúng mốc cuối; không truyền thì giữ hành vi gốc (số khung
suy từ `round(totalDurationSec×fps)`, mỗi khung cách `1/fps`s, khung cuối có thể hụt vài phần nghìn
giây nếu không chia hết — đúng hành vi mọi bộ đếm khung theo fps).

Tách phần LẬP KẾ HOẠCH khung ra hàm THUẦN riêng — `planCaptureSequenceFrames(path, fps,
frameCountOverride?): CaptureSequencePlanFrame[]` — không cần `WebGLRenderer`/canvas nên test được
dưới `sucrase-node` (khác `captureFrame`/`captureSequence` gốc cần WebGL thật). Test mới trong
`capture.test.ts`: đường 8 giây bắt buộc theo yêu cầu Hoà — đếm đúng số khung cả 2 chế độ (fps-driven
32 khung @ fps=4, và ép-số 5 khung dàn đều), kiểm đúng vị trí camera ở khung đầu/giữa/cuối, khung
cuối chế độ ép-số CHẠM đúng t=8s (chế độ fps-driven thì KHÔNG, đúng ý thiết kế — đã ghi rõ trong
JSDoc để không ai tưởng là bug), lỗi rõ khi `fps≤0`/`frameCountOverride<1`. `capture.test.ts` tổng
26/26 pass (11 ca mới + 15 ca cũ không đổi).

**Kiểm sạch**: `npm test` toàn repo (không chỉ file mới) — `EXITCODE=0`, grep hết log không thấy
`FAIL -`/fail>0 nào. `npx tsc --noEmit -p .` (toàn repo) KHÔNG chạy xong nổi trong sandbox này — luôn
hết giờ lệnh dù có `tsconfig.tsbuildinfo` sẵn (ghi lại làm bằng chứng, phiên sau khỏi thử lại y hệt);
dùng tsc SCOPED (`tsconfig.scoped.json` tạm, `include` đúng 6 file liên quan: `capture.ts`,
`capture.test.ts`, `cad-to-obj.ts`, `campath.ts`, `Scene3DViewer.tsx`, bench page) → sạch (exit 0).
`next lint` scoped 3 file đổi → sạch (1 lỗi `no-unused-vars` phát hiện+sửa ngay lúc lint, biến
`frames` đếm tay dư thừa vì `result.frameCount` đã có).

**⚠️ CHƯA đo được thời gian THẬT captureSequence qua browser** — Hoà yêu cầu rõ "đo 1 lần, ghi số
thật vào báo cáo, đừng đoán". Thử 2 hướng đều không được: (1) chạy `next dev` trong sandbox rồi dùng
Chrome MCP mở `127.0.0.1:3001` — Chrome MCP điều khiển trình duyệt THẬT trên máy Hoà, không phải máy
ảo sandbox này, nên không thấy được server chạy trong sandbox; (2) tự đo bằng headless browser NGAY
trong sandbox — không có `puppeteer`/`playwright`/binary Chromium cài sẵn, cài mới cần tải nặng, vượt
giới hạn 1 lệnh (~45s) của môi trường này, không background được (đã thử `nohup`+`disown`+`setsid`,
xác nhận tiến trình nền KHÔNG sống sót qua ranh giới 2 lần gọi lệnh riêng biệt trong sandbox này —
ghi lại làm bằng chứng môi trường, không phải lỗi thao tác). Kết luận: **không có cách đo số thật
trong phiên Cowork này** — thay vì bịa số, đã chuẩn bị sẵn bench `app/dev-bench-3d-2/page.tsx` (scene
tổng hợp ~2000 hộp/24.000 tam giác, gộp 4 màu — khớp quy mô bench 3D-1 "2040 entity/24k tam giác" để
so sánh ngang hàng; đường cam 4 giây; đo tổng/trung bình/nhanh nhất/chậm nhất mỗi khung, in ra cả màn
hình lẫn console). Hoà (hoặc phiên Claude Code chạy trên máy thật, có thể tự `npm run dev` sống lâu
dài) chạy `npm run dev` → mở `127.0.0.1:3001/dev-bench-3d-2` → đọc số → báo lại → XOÁ route (tạm,
không phải sản phẩm).

Đã dùng để đối chứng khoảng scope tsc, **2 file scratch không xoá được trong sandbox này** (FUSE,
cùng loại cũ) — đã dọn rỗng nội dung, Hoà `rm` tay khi tiện: `tsconfig.scoped.json`,
`app/dev-bench-3d-2/page.tsx` (file này CHỈ xoá SAU KHI đã chạy lấy số — xem trên).

Theo đúng lệnh gốc: "Xong 3D-2 thì DỪNG, báo cáo. 3D-3/3D-4 thứ tự cố định, chờ lệnh riêng." — đã
DỪNG ở đây (3D-3/3D-4/3D-5 vốn đã xong sẵn từ trước, không phải việc mới).

## 30/07 khuya (đợt 6) — merge feat/sprint-infra + sprint BOQ ĐỢT 2 (2.1.9.r ATLAS Material cache)

### Merge `feat/sprint-infra` (`7a62e09`)
Worktree phụ (`.worktrees/if-infra`, nhánh `feat/sprint-infra`) phát hiện tình cờ khi quét test
file cho B3 — Hoà xác nhận đây là phiên phụ của mình, soát xong, merge được sau khi xử 1 việc.
- **Điều tra loại trừ `auto-backup.test.ts`** (Hoà nghi ngờ đúng: "loại đúng cái đang lo nhất ra
  khỏi lưới an toàn là ngược") — chạy thử bản gốc TRƯỚC khi merge: 6/6 pass, KHÔNG chậm, KHÔNG
  flaky, không tìm ra lý do kỹ thuật cho việc loại trừ ban đầu. Nhưng đằng nào cũng đã xoá file đó
  trong B3 (thay `backup-diff.test.ts`, 50 test bao phủ đúng lớp rủi ro cao nhất) — bỏ mệnh đề
  loại trừ chết khỏi script `"test"`. Giữ nguyên loại trừ `edgecase-concurrency.test.ts` — xác
  nhận ĐÚNG (chạy thử thấy PASS đơn lẻ do file tự tránh import `jose` trực tiếp trong phần code
  thật dùng, nhưng nguyên nhân gốc `jose` ESM-only vẫn treo trong docstring của chính file đó).
- 1 conflict nhỏ ở `STATUS.md` (2 nhánh cùng thêm bullet khác vị trí) — tự giải quyết, giữ cả 2 ý.
- Điền số **Luật #13 — Trung Tính** vào PHẦN E (phiên phụ để trống đúng Luật #12, chờ Claude Code
  điền). Test cưỡng chế `idf-neutrality.test.ts` (8 test) quét `.idf`/`model.ts`, FAIL nếu khoá
  TRÌNH BÀY (fontSize/color/x/y/...) lọt vào type nguồn mà không có trong EXEMPTIONS có lý do.
- Thêm ghi chú "XEM LẠI khi làm preflight-theo-đích" vào 2 miễn trừ `Layer.color`/`Base.color` —
  Hoà chỉ ra đây là miễn trừ YẾU NHẤT (ACI color-dependent plot style có phần là ánh xạ trình bày).
- `scripts/probe-xlsx-roundtrip.ts` (thăm dò round-trip Excel, KHÔNG phải code sản phẩm) — chặn
  ở fixture thật `SPEC_TEMPLATE 1.xlsx` chưa có trên đĩa (lỗi của Cowork, Hoà sẽ copy vào sau).
- Dọn sau merge: `git worktree prune` + `git branch -d feat/sprint-infra` + `rm -rf` thư mục vật
  lý còn sót (giống ca `if-lark` trước) + xoá lock rác `feat/sprint-infra.lock.stale.*`.
- `npm test`: 0 fail sau merge (log lưu `/tmp/npmtest.log` phiên này, không commit).

### Sprint BOQ ĐỢT 2 — `2.1.9.r`: ATLAS Material cache + adapter pull-only
- **PHÁT HIỆN quan trọng khi khám trước khi code (Luật #4/#5)**: chỉ đạo gốc của Hoà yêu cầu bảng
  Prisma `AtlasMaterial` HOÀN TOÀN MỚI. Đọc `prisma/schema.prisma` trước khi tạo bảng (thói quen
  đã thành phản xạ sau B3/2.1.9.q) phát hiện `ProductSpec{kind:'material'}` đã tồn tại, có comment
  "Q-L2: GỘP MaterialRef vào đây, 1 bảng duy nhất" — CÙNG HẠT dữ liệu: không `projectId` (danh mục
  gốc, không phải bản ghi theo dự án), có `larkRecordId @unique`+`raw`+`syncedAt` y hệt mẫu
  `LarkTaskRef`. Tạo `AtlasMaterial` mới sẽ đúng loại xung đột Luật Đồng Bộ #6 cấm ("2 tính năng
  gần nhau tồn tại rời rạc"). Dùng `AskUserQuestion` hỏi thẳng — Hoà xác nhận: **"Bạn phát hiện
  đúng. Spec của tôi SAI: tôi đề xuất bảng AtlasMaterial mà không đọc schema trước."**
- **`prisma/schema.prisma`** — `ProductSpec` thêm 6 field: `unit` · `priceVnd` (**Decimal, KHÔNG
  Float** — tránh sai số nhị phân khi tính BOQ) · `wastagePercent` (Decimal) · `packagingSpec` ·
  `altSku` · `styleTags` (JSON string[], cùng mẫu `materials`/`finishes` có sẵn). `priceNote` (text
  tự do "1.250.000đ/cái") GIỮ NGUYÊN song song `priceVnd` — **TUYỆT ĐỐI không tự parse `priceNote`
  sang số khi migrate** (Hoà: "parse sai một dòng là sai tiền thật, và sai ÂM THẦM"). `priceVnd`
  null = chưa sync/chưa có giá — BOQ (đợt 3) phải HIỆN rõ "chưa có giá", không đoán, không bỏ qua
  dòng, nhưng vẫn hiện `priceNote` cạnh đó cho người kiểm.
- **Phát hiện phụ khi migrate**: `npx prisma migrate dev` báo drift giữa `prisma/migrations/` (1
  migration cũ) và `dev.db` thật — đòi RESET TOÀN BỘ DATABASE ("All data will be lost"). DỪNG
  ngay, KHÔNG xác nhận. Xác nhận `dev.db` (143MB, dữ liệu demo thật) còn nguyên (10 User/4
  Project/10 ProductSpec trước/sau, đếm bằng `sqlite3` trực tiếp). Dùng `npx prisma db push
  --skip-generate` thay thế — đúng workflow repo đã dùng cho local dev.db từ trước (xem
  `electron/main.js:188`), chỉ diff schema hiện tại vs DB hiện tại, không đòi reconcile lịch sử
  migration. Áp dụng sạch, 6 cột mới thêm, dữ liệu cũ nguyên vẹn (xác nhận lại bằng `PRAGMA
  table_info`). ⚠️ Phát hiện đây là NỢ KỸ THUẬT tồn tại từ trước (không phải do tôi gây ra) — migration
  history đã lệch khỏi dev.db thật do quy trình local luôn dùng `db push` — ghi vào TECH-DEBT.
- **`MaterialDef.atlasRecordId?: string`** (`lib/cad/materials.ts`) — neo DUY NHẤT sang
  `ProductSpec.larkRecordId`, đúng yêu cầu gốc "CHỈ thêm 1 field neo, TUYỆT ĐỐI không nhồi giá/đơn
  vị vào MaterialDef" (2.1.9.i, texture đổi theo thiết kế ≠ giá đổi theo NCC, 2 nhịp sống khác nhau).
- **`lib/integrations/providers/lark.ts`**: `listAllRecords()` thêm tham số `pageSize` (mặc định
  100, giữ nguyên hành vi 2 caller cũ `listTaskRecords`/`listHrRecords`) + `listAtlasMaterialRecords()`
  mới (page_size 500 theo Hoà chốt — ~1.449 record ⇒ 3 request thay vì ~15). KHÁC 2 hàm cũ: KHÔNG
  có `table_id` mặc định — `LARK_ATLAS_MATERIAL_TABLE_ID` bắt buộc, throw rõ lý do nếu thiếu
  (chưa từng verify bảng này, không đoán 1 id không rõ nguồn).
- **`lib/lark/atlas-material-map.ts`** (mới) — `mapAtlasRecordToProductSpec()` thuần, tách khỏi
  route API để test độc lập. `ATLAS_FIELD_NAMES` ghi RÕ là **PLACEHOLDER chưa xác minh** (đoán
  theo thuật ngữ Hoà dùng khi mô tả yêu cầu — "Giá tham khảo"/"Hao hụt %"/"Quy cách"/... — KHÔNG
  phải field_name thật qua MCP `list_tables`, vì bảng CHƯA từng nối route đọc). `raw` JSON luôn
  giữ nguyên bản gốc — sai tên cột thì sửa map rồi re-sync, không mất dữ liệu.
- **`app/api/atlas-materials/sync/route.ts`** (mới) — mirror đúng `/api/lark-tasks/sync` (pull-
  only, `getSessionUser()` dòng đầu, upsert theo `larkRecordId`, không bao giờ throw ra ngoài).
  Gate kép: `atlasConfigured()` (3 khoá Lark) + `LARK_ATLAS_MATERIAL_TABLE_ID` — thiếu 1 trong 2
  trả 503 rõ lý do, không chạy nửa vời.
- **`docs/SPEC-THU-VIEN-D-2026-07-30.md` §2 sửa** (Hoà chỉ ra thêm, cùng phát hiện): "Một thư
  viện, ba họ" KHÔNG cần model union mới như bản spec ban đầu đề xuất — `ProductSpec` đã có ĐỦ 3
  khoá nối đúng 3 họ tài liệu mô tả (`imageAssetId`→họ A ảnh, `drawingBlock`→họ B block CAD,
  `larkRecordId`→họ C ATLAS) — rẻ hơn nhiều, chỉ cần JOIN 3 bảng có sẵn qua `ProductSpec`, không
  phải dựng bảng lõi mới. Giữ nguyên phần "ngữ cảnh theo chặng" (§3 trở xuống) của tài liệu gốc.
- **Test — `lib/lark/atlas-material-map.test.ts`, 22/22 pass**: map đủ field → đúng toàn bộ ·
  field thiếu → `null`/JSON rỗng, KHÔNG bịa giá trị mặc định (đặc biệt `priceVnd` null khi thiếu —
  đúng luật "chưa có giá thì hiện rõ") · giá tới dạng chuỗi có dấu phẩy ("285,000") → `numberOf()`
  bóc đúng số · `styleTags` nhiều kiểu dấu phân cách (`,`/`|`/`·`) → tách đúng. `npm test` toàn repo
  sau khi thêm: 0 fail (log `/tmp/npmtest2.log`/`/tmp/npmtest3.log` phiên này, không commit).
- ⚠️ **CHƯA chạy thật** — chặn ở thiếu khoá Lark + `LARK_ATLAS_MATERIAL_TABLE_ID`; field mapping
  cần đối chiếu tên cột thật qua MCP trước khi tin số liệu sync ra lần đầu.

## 30/07 khuya (đợt 5) — B3: backup CAD bỏ "giữ 5 bản" sang thang thời gian + lưu chênh lệch
- **Lý do sửa cùng đêm**: B1 (`4.6`) chỉ verify được phần GHI (auto-backup, giữ 5 bản gần nhất).
  Hoà yêu cầu thử tay B3 (kịch bản sập/phục hồi thật) — nhưng trước khi thử, nhận ra "5 bản × 10
  phút = chỉ 50 phút lịch sử, sai từ hôm qua là mất" → chốt sửa cơ chế TRƯỚC khi chạy kịch bản thử.
- **`lib/cad/backup-diff.ts` mới** (thuần, không đụng File System Access API — test bằng
  sucrase-node không cần mock trình duyệt, đúng mẫu `namesToPrune()` cũ): `diffSheets()`/
  `applyDiff()` — chênh lệch theo ENTITY (so khớp theo id, không phải byte/JSON diff cả cây),
  fallback lưu NGUYÊN sheet khi field khác `entities` đổi (layers/viewport/paperKey/...) thay vì
  cố diff từng field nhỏ lẻ dễ sai. `planRetention()` — thang thời gian Hoà chốt: 1 giờ giữ MỌI
  bản · 24 giờ 1 bản/giờ · 30 ngày 1 bản/ngày · xa hơn 1 bản/tuần KHÔNG giới hạn
  (`RETENTION_TIERS`, CONFIG không hard-code) → ~60-80 bản phủ TOÀN BỘ đời dự án thay vì 50 phút.
  **Bất biến bắt buộc** ("mỗi mốc đầy đủ phải tự đứng được — mất 1 diff không được kéo sập cả
  chuỗi"): 1 bản chênh lệch được GIỮ mà đoạn chuỗi dẫn tới nó (từ mốc đầy đủ gần nhất) có chỗ bị
  XOÁ → tự ĐÚC (materialize) thành bản đầy đủ MỚI TRƯỚC khi xoá phần chuỗi phía trước — phát hiện
  qua debug thật lúc viết test: kể cả chính MỐC ĐẦY ĐỦ gốc cũng có thể bị xoá nếu không phải đại
  diện của bucket nó, miễn là bản phụ thuộc nó đã được đúc trước — ban đầu tưởng là bug, debug kỹ
  xác nhận đây là hành vi ĐÚNG (không phải bug), sửa lại 2 assertion test sai thay vì sửa code.
  `reconstructUpTo()` — ráp trạng thái tại 1 điểm bất kỳ (không chỉ mới nhất, đúng yêu cầu B3 "lấy
  bản thứ 2/3/4/5"); gặp entry thiếu/hỏng ở BẤT KỲ đâu trên đường đi → DỪNG NGAY, trả về trạng
  thái TỐT NHẤT ráp được NGAY TRƯỚC entry hỏng đó (không nhảy qua lỗ hổng ráp tiếp — sẽ ra trạng
  thái SAI mà tưởng là đúng, nguy hiểm hơn không phục hồi được); mốc đầy đủ bản thân cũng hỏng →
  tự lùi về mốc đầy đủ TRƯỚC ĐÓ, không throw. `formatBackupRelativeTime()` — "10 phút trước · 1
  giờ trước · hôm qua 15:20 · thứ Hai · tuần trước" (Hoà: "1.000 dòng thời gian giống hệt nhau còn
  khó dùng hơn 5 dòng"). Mốc đầy đủ mỗi 20 bản (`FULL_SNAPSHOT_EVERY`).
- **Test — `lib/cad/backup-diff.test.ts`, 50/50 pass** (nặng hơn bình thường — đây là lớp RỦI RO
  CAO NHẤT của sprint, "mất dữ liệu không sửa lại được"): round-trip diff/apply đủ 8 kiểu đổi ·
  tỉa đúng thang (2 kịch bản: thưa không tỉa gì/dày tỉa đúng kể cả xoá mốc đầy đủ gốc) · **2 đại
  diện khác bucket cùng gãy bởi 1 lần xoá → cả 2 phải đúc ĐỘC LẬP** (bẫy dễ mắc nếu code chỉ nhìn
  "bản cuối trong đoạn gãy") · **xoá 1 file diff giữa chuỗi → lùi ĐÚNG về mốc ngay trước đó, không
  throw** — đúng chính kịch bản B3 yêu cầu thử tay · mốc đầy đủ hỏng → lùi tiếp về mốc trước nữa ·
  phục hồi điểm GIỮA chuỗi (không chỉ mới nhất) · format hiển thị 8 mốc thời gian.
- **`lib/cad/auto-backup.ts` viết lại** — lớp keo mỏng chạm File System Access API thật: đếm số
  bản kể từ mốc đầy đủ gần nhất để quyết ghi đầy đủ hay chênh lệch, gọi `planRetention()` sau mỗi
  lần ghi (đúc TRƯỚC, xoá SAU — đúng thứ tự bắt buộc). `reconstructAsync()` mới — bản song sinh
  ĐỌC THẬT của `reconstructUpTo()` (cùng thuật toán, khác mỗi chỗ `await` đọc file thay vì tra
  bảng thuần — không đổi chữ ký hàm thuần chỉ để chiều 1 chỗ gọi bất đồng bộ). `namesToPrune()`/
  `auto-backup.test.ts` cũ (6 test "giữ 5 bản") đã xoá — thay hẳn bởi cơ chế mới.
- **Lối vào UI MỚI** (trước B3 KHÔNG CÓ — "phục hồi" chỉ có đường .ifpack export/import thủ công,
  tự mò Finder đoán tên file): `components/cad/BackupRecoveryModal.tsx` liệt kê backup theo thang
  hiển thị, bấm 1 mục → tạo DỰ ÁN MỚI (không đè dự án đang mở, đúng nguyên tắc `.ifpack` cũ), báo
  rõ nếu phải lùi mốc (`degraded`/`recoveredAsOf`) thay vì im lặng. Menu Xuất → "Khôi phục từ
  backup…" chỉ hiện khi đã bật backup tự động.
- **Verify browser thật** (`127.0.0.1:3000`): menu mô tả đã cập nhật (hết "giữ 5 bản gần nhất") ·
  phát `cad:backup-browse-open` → modal mở đúng, hiện đúng trạng thái rỗng · phát
  `cad:backup-restore-request` với 1 sheet giả lập → **xác nhận điều hướng sang project MỚI**
  (cuid khác hẳn), đọc `window.__cadStore.getState()` sau khi tải → entity/layer khớp CHÍNH XÁC dữ
  liệu đã gửi — chứng minh đường ống chạy TRỌN từ event → tạo project → ghi IndexedDB → điều
  hướng → nạp lại, không phải giả lập. `ifpack.test.ts::testCorruptZipDoesNotThrow` (có sẵn, không
  viết mới) vẫn PASS — xác nhận corrupt full-backup vẫn không throw.
- ⚠️ **Giới hạn công cụ, disclose rõ không giấu** (`docs/VERIFY-B3.md`): không tự động hoá được
  `showDirectoryPicker()` (bắt buộc gesture người dùng thật + hộp thoại OS thật) và `kill -9` tiến
  trình Electron thật trong môi trường phiên này. Bù bằng: rủi ro THẬT của cơ chế nằm ở lớp THUẬT
  TOÁN reconstruct/retention (không phải "app có crash không" — mọi đường đọc đã bọc try/catch) —
  lớp đó đã test 50 kịch bản kể cả mô phỏng đúng "1 file giữa chuỗi hỏng/mất". Kèm hướng dẫn 3
  bước Hoà tự làm 1 lần (kill -9 thật + mở lại + khôi phục) để xác nhận mức OS — bằng chứng cần
  cho phần trình BGĐ "mất dữ liệu: rủi ro thấp". Còn 1 project test (`cms7imxpt...`, "Test B3
  (phục hồi backup)") trong tài khoản demo — thử xoá qua `/api/projects/:id` DELETE bị chặn đúng
  luật (hành động phá huỷ), Hoà xoá tay trong Gallery nếu không cần giữ.
- **Phát hiện kèm, không phải việc của B3**: `.worktrees/if-infra` (nhánh `feat/sprint-infra`) —
  1 worktree phụ ĐANG CHẠY, chưa merge, phát hiện tình cờ lúc quét test file — KHÔNG đụng vào,
  ghi vào STATUS.md để Hoà biết (đúng luật "1 điều kiện thiếu thì giữ nguyên, báo rõ lý do").

## 30/07 khuya (đợt 4) — 2.1.9.q (BOQ groundwork) + hạ 2.2.87/2.2.88 ✅→🟡 + Luật #12 + commit 2.2.70
- **Luật #12 mới** (`docs/IF-FEATURE-TREE.md` PHẦN E) — Hoà chốt sau va số `7.1.21` (lỗi grep của
  Cowork, không phải lỗi Claude Code): "CHỈ Claude Code cấp mã. Cowork soạn ticket KHÔNG kèm số;
  Claude Code gán, báo lại, Cowork xác nhận." `7.1.21` = script test (giữ, đề xuất trước),
  `7.1.22` = Bộ nhớ đo đạc — cả 2 xác nhận, vẫn CHƯA CODE.
- **Hạ `2.2.87`/`2.2.88` ✅→🟡** — Hoà chốt: "46 test đơn vị sạch NHƯNG đường hiển thị end-to-end
  chưa verify — chưa có ảnh thật nào chạy thông ra số trên màn hình. Tính năng này xuất số đi tới
  xưởng; lỗi tầng hiển thị gây thiệt hại tiền thật mà test đơn vị không bắt được." Nâng lại ✅ khi
  Hoà tự xác nhận 1 ảnh thật chạy đúng — đúng nguyên tắc không tự nâng trạng thái khi chưa verify
  đủ lớp (Luật #4 PHẦN E).
- **Xác nhận an toàn dọn `.worktrees/if-lark/`** (Hoà yêu cầu kiểm bằng số, do bridge của Hoà đang
  khởi động lại): `git merge-base --is-ancestor 68f2a2e HEAD` → CÓ trong main (qua merge `2b89d47`);
  `grep -c resolveWikiAppToken lib/integrations/providers/lark.ts` → 7 (>0); `git branch --list
  "feat/7.1.19*"` → rỗng. Không có gì mồ côi, `rm -rf` trước đó an toàn như đã báo.
- **Commit `2.2.70` (a)(b) tách riêng** (`df74551`) — Hoà chỉ đạo ưu tiên: "rủi ro mất việc cao hơn
  giá trị của việc chờ" (2 fix đã nằm chưa commit qua nhiều lượt trong khi commit khác đè lên).
  (a) `RenderToolModeOverlay.tsx`: `detectGraphPattern()` trả `'complex'` cả khi chỉ 1 node mồ côi
  → báo động giả "còn node khác đang ẩn" dù không có gì ẩn — sửa chỉ hiện khi `nodeCount > 1`.
  (b) Mô tả node `ai.upscale` gắn cứng "khổ A3" — sửa chung chung, không hứa sai khổ giấy cụ thể.
- **`2.1.9.q` — Groundwork đo bóc hình học cho BOQ** (`lib/cad/hatch.ts`): `polygonPerimeter(poly,
  edgeMask?)` — chu vi hoặc chỉ cạnh được chọn (`edgeMask[i]===false` bỏ cạnh `i`), cùng phong
  cách `polygonArea` đã có. `openingsAreaInPolygon(entities, poly, thresholdM2?)` — trừ diện tích
  lỗ mở (cửa/cửa sổ) đi Đường (a) khuyến nghị của `docs/REVIEW-SPEC-BOQ-LARK-2026-07-30.md` §2②:
  trừ theo entity ĐÃ PHÂN LOẠI (`elementType==='door'|'window'`) có `.at` nằm trong polygon, KHÔNG
  dò ring con hình học. Ngưỡng `BOQ_OPENING_MIN_AREA_M2=0.5` vào CONFIG, không hard-code.
  **PHÁT HIỆN khi khám code trước khi code (Luật #4/#5)**: review spec ví dụ "cửa 900×2200=1,98m²"
  ngầm giả định `BlockDef.h` là chiều cao cửa thật — đọc `furniture.ts:599-619` xác nhận SAI: `h`
  là ĐỘ SÂU MẶT BẰNG (`door(900)` có `h:900` = bán kính cung mở cửa vẽ trên mặt bằng, `window` có
  `h:100` = độ dày tường tại vị trí cửa sổ). Dùng thẳng `w×h` sẽ trừ SAI 0,81m² thay vì ~1,89m²
  cho 1 cửa 900 — đúng loại lỗi "âm thầm sai số tiền thật" mà Hoà vừa nhắc ở mục `2.2.87` trên.
  Sửa: dùng `w` (rộng cửa/sổ, dữ liệu THẬT từ `BLOCK_MAP` qua `blockInfo()` — export thêm từ
  `schedule.ts`, TÁI DÙNG Luật #6, không đọc lại `BLOCK_MAP` theo cách khác) × hằng số
  `OPENING_STANDARD_HEIGHT_MM` mới (door 2100mm — cùng dải `ANCHOR_CONFIG.door` của `2.2.87`,
  window 1500mm — Luật #10, chuẩn nghề công khai, không bịa theo từng block). 17 test mới
  (`hatch.test.ts` [9] chu vi đầy đủ/từng cạnh/`edgeMask` rỗng, [10] cửa trong/ngoài polygon ·
  cộng dồn nhiều lỗ mở · bỏ qua entity không phải cửa/sổ · ngưỡng CONFIG điều khiển được · block
  lạ (không có trong `BLOCK_MAP`) không đoán mò) + 28 test cũ cùng file không hồi quy (45/45 tổng),
  toàn bộ 100+ test khác trong repo sạch, tsc+eslint sạch. BOQ thật (`2.1.9.p`) vẫn chờ Hoà quyết
  "có làm engine không" — mã này CHỈ là groundwork hình học, không phải BOQ.

## 30/07 khuya (đợt 3) — 2.2.87+2.2.88 SỬA SANG cascade "không-bao-giờ-fail" + dọn worktree cũ + 2 mã mới
- **Lý do sửa cùng đêm vừa ship (đợt 2, xem mục ngay dưới)**: bản gốc bắt buộc hiệu chỉnh camera từ
  điểm tụ — ĐÚNG thiết kế ban đầu nhưng THẤT BẠI TRUNG THỰC quá thường xuyên với ảnh render đẹp
  (rèm/thảm cong/sáng mềm hiếm cạnh thẳng 2 phương). Hoà tự nhận đây là lỗi thiết kế của brief, không
  phải lỗi code ("báo lỗi trung thực thay vì đoán bừa là đúng, nhưng brief bắt sai đường"). Nguyên tắc
  mới, ưu tiên cao nhất: **"Bấm Render KHÔNG BAO GIỜ được trả về tay không."**
- **`single-view-metrology.ts`**: thêm `measureObjectTiered()` — cascade 4 BẬC tự tụt, KHÔNG BAO GIỜ
  throw vì thiếu cấu trúc/mặt nạ/neo (chỉ throw ở tầng gọi khi ảnh THẬT sự hỏng — CORS/corrupt).
  Bậc 1 = dải chuẩn nghề theo loại đồ (`FURNITURE_SIZE_PRIORS` 14 loại, ~50% tin, ĐÁY không bao giờ
  fail, không cần ảnh/mặt nạ gì). Bậc 2 = tỉ lệ khung bao mặt nạ tinh chỉnh Bậc 1 (~65%). Bậc 3 = neo
  tay 2-điểm-khoanh bất kỳ trong khung (`tierManualAnchor`, `ANCHOR_CONFIG` thêm `bed` 1500-2000mm
  "mốc rất đáng tin") hoặc người dùng tự xác nhận 1 kích thước của chính món (`tier3`, ~80%). Bậc 4 =
  engine điểm tụ gốc KHÔNG ĐỔI (`tryTier4`, ~90%, trả `null` không throw khi thiếu cấu trúc, caller tự
  tụt Bậc 3). "Phương pháp" (bậc đo, độc lập chất lượng dữ liệu) TÁCH BẠCH khỏi `AiTier` hệ thống
  (`lib/ai/tiers.ts`, chọn provider/chi phí) — đúng Luật #6, không dựng 2 mặt quản chi phí song song;
  kể cả `aiTier=1` "Không AI" vẫn đạt Bậc 3/4 nếu ảnh/thao tác cho phép. 46/46 test (28 gốc giữ
  nguyên + 18 mới: ảnh mềm không cạnh thẳng vẫn ra số hữu hạn·nền trắng+1 vật→Bậc 1-2·gọi chỉ với
  `category` không ảnh/mặt nạ/neo vẫn ra số·neo tay 2 điểm→Bậc 3 đúng `kind:'measured'`).
- **`metrology.ts` node** rewrite: parse `manualAnchorJson` phòng thủ (JSON hỏng → bỏ qua im lặng,
  không throw), gọi `measureObjectTiered()`, payload thêm `aiTier`/`aiTierName` (CHỈ để ghi nhãn hiển
  thị, không điều khiển bậc đo).
- **`ToolModeForm.tsx`** viết lại cho thẻ "Đo món đồ": (1) `category` hiện chính, 2 slider cũ
  (`cameraHeightMm`/`bgTolerance`) gom vào mục **"Tinh chỉnh" thu gọn, mặc định ĐÓNG** — bản trước
  bày cả 2 ra trước khi chạy, Hoà chỉ ra sai ("bắt chỉnh tham số của thứ chưa chạy"); (2) UI khoanh
  tay 2-điểm mới trên ảnh gốc — bấm 2 điểm → chọn loại vật chuẩn (dropdown `ANCHOR_CONFIG`) + nhập mm
  thật → nút "Dùng vật chuẩn này, đo lại" ghi `manualAnchorJson` qua `store.updateParam()` (param
  KHÔNG khai trong `NodeDefinition.params`, tránh lộ vào vòng render tham số chung) rồi chạy lại ngay;
  quy đổi toạ độ px màn hình→px ảnh gốc có trừ letterbox của `object-fit:contain`; (3) `MeasurementPanel`
  hiện dòng bắt buộc "Tầng N · <tên tầng> · Bậc M · độ tin K%" + gợi ý nâng bậc cụ thể khi
  `needsManualAnchor` — không bao giờ chỉ hiện chữ đỏ rồi dừng, dấu cảnh báo "Mặt khuất là suy diễn"
  vẫn bắt buộc không tắt được. `measurement-spec-sheet.ts` sửa theo: nhận `TieredMeasurement` +
  `methodLine` dựng sẵn ở caller (không ghép chuỗi 2 lần).
- **Verify**: tsc sạch, eslint sạch (2 warning `<img>` có sẵn từ trước, không phải lỗi mới), 46/46
  test module + toàn bộ 100+ file `*.test.ts` khác trong repo chạy sạch không hồi quy. Browser thật
  (`127.0.0.1:3000`) xác nhận layout tĩnh đúng yêu cầu — category hiện chính, "Tinh chỉnh" đóng mặc
  định, Render tắt khi chưa có ảnh. ⚠️ **CHƯA verify được đường khoanh-tay+ra-số-thật** trong browser —
  môi trường test không đưa được file ảnh qua `<input type=file>` (thử native-setter+`change` event
  không kích hoạt handler React; thử điều khiển canvas qua `window.__flowStore` trực tiếp cũng không
  thao tác được do panel node zoom khoá trong demo project) — bù bằng đối chiếu type từng trường với
  export thật + 46 test đơn vị đúng hàm node gọi. Khuyến nghị Hoà tự thử 1 ảnh thật trước khi tin số
  đầu tiên hiện ra.
- ⚠️ **CHƯA LÀM, disclose rõ không giấu**: Hoà yêu cầu thêm ánh xạ Tầng 2 (oneAI/ComfyUI tự tìm vật
  neo qua object-detection+bbox) và Tầng 3 (VLM tự ước category/tỉ lệ) vào bản đồ 4-AiTier — chưa tìm
  thấy năng lực object-detection-có-bbox nào qua oneAI/ComfyUI trong codebase hiện tại; VLM sẵn có
  (`captionImage()`, `lib/ai/providers/nvidia.ts`) tách biệt kiến trúc khỏi hệ `fal`-tier Hoà kỳ vọng
  gắn vào — cần hạ tầng riêng, để đợt sau.
- **Dọn worktree cũ sót lại**: `.worktrees/if-lark/` — thư mục VẬT LÝ còn trên đĩa dù `git worktree
  list` đã không đăng ký (nhánh `feat/7.1.19-lark-wiki` đã merge+xoá từ trước), `.git` bên trong trỏ
  đường dẫn VM của phiên phụ đã chết. Xác nhận đủ 4 điều kiện an toàn (CLAUDE.md) trước khi `rm -rf`:
  nhánh đã merge (`2b89d47`) và xoá, không dev server đang mở trong đó (`lsof` chỉ thấy tiến trình lập
  chỉ mục Spotlight), không branch nào chỉ tồn tại ở đó.
- **2 mã mới đề xuất, va số `7.1.21`** — Hoà gửi liền 2 việc, cả 2 đều gắn số `7.1.21`: (a) script
  `"test"` vào `package.json` (đề xuất từ lúc merge `7.1.19`, sớm hơn) giữ nguyên `7.1.21`; (b) "Bộ
  nhớ đo đạc" — Tầng 1 tự học kích thước/tỉ lệ bộ phận/chiều cao máy ảnh theo dữ liệu nhà (Prisma
  `MeasurementSample`, ngưỡng n<5 dải chuẩn/n≥5 trộn/n≥20 ưu tiên dữ liệu nhà) — tự xếp `7.1.22`
  (số trống kế tiếp), CHƯA CODE theo đúng yêu cầu "báo mã, chờ xác nhận". Cả 2 ghi vào
  `docs/IF-FEATURE-TREE.md`, Hoà xác nhận lại nếu muốn số khác.

## 30/07 khuya (đợt 2) — 2.2.87+2.2.88: đo món đồ từ 1 ảnh + sửa triệt để overlap header
- **AppChrome overlap 1024px — sửa lần 2, triệt để.** Lần 1 (dời Tệp/StageSwitcher ra khỏi hộp
  co) hết overlap cụ thể nhưng lộ vấn đề sâu hơn: tổng `shrink-0` vượt viewport 23px, "Đăng xuất"
  chờm ngoài màn. Lần 2 (Luật #10, không hỏi — 2 phép chuẩn responsive phổ thông): wordmark
  "InteriorFlow" chỉ hiện ≥1280px (trước bật nhầm ở 1024px, breakpoint CHẬT NHẤT) + "Đăng xuất"
  vào trong menu bấm-avatar (chuẩn Google/Figma/Notion — hành vi phá huỷ không đứng trần trụi
  ngoài thanh). Kết quả: 0 tràn ngang cả 3 mốc, gap nhỏ nhất 10px, tên dự án hiện đủ chữ kể cả ở
  1024px (trước phải co về 0). Bảng số đầy đủ `docs/VERIFY-7.3.31.md`.
- **`2.2.87`** — `lib/vision/single-view-metrology.ts` mới: engine đo món đồ từ 1 ảnh (single-view
  metrology), Lát cắt 1 của `docs/TU-VAN-ANH-SANG-BAN-VE-2026-07-30.md` — hiệu chỉnh camera từ 3
  điểm tụ (Caprile-Torre) + neo thang đo 3 nguồn kiểm chéo ±5% + đo R×S×C có sai số, phân nhóm
  🟢 ĐO/🟡 SUY đúng bản chất toán học (depth luôn 🟡 trừ khi thấy mặt bên). 0 credit, tất định,
  không AI. 28/28 test verify bằng cảnh 3D tổng hợp chiếu qua camera pinhole biết trước (không
  phải raster ảnh thật) — bắt được 2 bug hình học có thật (điểm tụ rơi đúng vô cực khi camera
  test không có yaw; heuristic "dải sàn theo y" vỡ dưới phối cảnh xiên) nhờ đối chiếu độc lập,
  không phải suy luận suông.
- **`2.2.88`** — mặt tiền cho `2.2.87`: node `vision.measureobject` (tái dùng `extractForeground()`
  — chính hàm `ai.furnitureextract` gọi ở tầng lõi, không viết engine mới) + thẻ Tool Mode thứ 7
  "Đo món đồ" + bảng R×S×C phân màu (`--success`/`--warning`) trong `ToolModeForm.tsx` + xuất spec
  sheet (tái dùng `composeBoard()`/`out.board`, dấu cảnh báo "Mặt khuất là suy diễn" bắt buộc
  không tắt được). Verify browser thật: chạy qua `runNode()` thật (không giả lập) trên ảnh tổng
  hợp thiếu cấu trúc kiến trúc → đúng đường lỗi "không đủ neo, không đoán bừa" của tài liệu. Chưa
  thử đường đo-thành-công bằng ảnh thật — ghi rõ trong cây, không giấu.
- **7.1.19 merge** vào main từ worktree phụ (không conflict, đúng 3 file). Dọn `.git/refs/heads/
  feat/7.1.19-lark-wiki.lock.stale.*` (rác do phiên phụ bị ngắt giữa ghi ref) + `git worktree
  prune`. Đề xuất mã `7.1.21` (npm script "test") — chờ Hoà xác nhận.
- **Cấp mã đợt review BOQ/Lark** (`docs/REVIEW-SPEC-BOQ-LARK-2026-07-30.md`): `2.1.9.q` (groundwork
  hình học BOQ, gộp perimeter+trừ lỗ mở 1 mã theo yêu cầu Hoà), chốt câu hỏi treo `2.1.9.i`/
  `2.1.9.p` (matId → bảng riêng `AtlasMaterial`). `7.3.32` cấp mã cho header tràn 640/768px
  (chưa sửa). `ToolModeForm.tsx:138` grid cứng gộp vào `2.2.79` đã có (không mã mới).

## 30/07 khuya — 7.1.20: gộp hệ ngưỡng breakpoint + 2.2.86: hàng đợi "Việc" thay pill nổi
- `7.1.20` — `lib/breakpoints.ts` mới (hằng `BP`, nguồn duy nhất), kéo 5 ngưỡng tự viết rải rác
  (700/900/720/520/1100) về đúng mốc Tailwind. Ghi Luật #10 (tiêu chuẩn nghề không hỏi) + Luật #11
  (giao thức verify bắt buộc 5 mốc 640·768·1024·1180·1440, 1180 là bề rộng Hoà thật sự chạy).
- `2.2.86` — **ĐỔI PHƯƠNG ÁN**: bản đầu (pill nổi trên canvas, theo
  `docs/TICKET-CHAY-FLOW-KHONG-GHIM-BAR-2026-07-30.md`) bị HUỶ, Hoà chốt hướng khác cùng ngày —
  "Chạy flow" xoá hẳn khỏi headbar, khởi chạy chuyển hết sang cạnh đối tượng (▶ node/"Kết xuất"
  thẻ/Command Palette), theo dõi+huỷ qua hàng đợi thật trong menu "Việc" (đơn vị `FlowRun`, tuần
  tự tuyệt đối). Lý do đổi: kiến trúc sư cần THẤY ĐANG CHẠY GÌ/CÒN CHỜ GÌ/HUỶ ĐƯỢC — pill nổi
  không cho kiểm soát được quá trình, hàng đợi mới đúng nhu cầu nghề. `execNode()` giữ nguyên
  100%, chỉ thêm lớp điều phối hàng đợi bên ngoài. Sửa kèm 2 mặt tiền đếm lệch đơn vị
  (`MobileMenu.tsx`/`StatusBar.tsx` đếm `jobs[]` cũ, nay đổi sang `flowRuns[]` khớp badge chính).

## 30/07 khuya — 2.1.8.k: xuất bộ hồ sơ nhiều tờ thành 1 PDF có mục lục
- `buildSheetSetPdf()`/`exportSheetSetPdf()` mới (`lib/cad/pdf.ts`) — tách `drawDocOntoPdfPage()`
  dùng chung với `buildCadPdf()` (trang đơn) để không viết lại logic vẽ entity. Trang 1 mục lục
  (A4 dọc, bảng số tờ·tên·khổ·tỉ lệ) + mỗi tờ 1 trang riêng khổ giấy/tỉ lệ (`paperKey`/`printScale`
  per-sheet, không ép chung 1 khổ), bookmark PDF thật qua Outline PlugIn lõi jsPDF (không thêm
  dependency). Nối vào IOMenu CAD cạnh `.idf` qua CustomEvent `cad:sheetset-pdf-export-request`
  (cùng pattern bắc cầu `.idf`/`.ifpack`, `CadSheets.tsx` giữ `sheets[]`). Luật #9 (≥300dpi) xác
  nhận KHÔNG áp dụng — export 100% vector, không `addImage()`. 13/13 test mới
  (`pdf-sheetset.test.ts`), 103/103 test toàn repo, tsc sạch.
- Lệch nhẹ so với brief: test dùng khổ A1/A2/A3 thay vì "A2/A3/A4" — `PaperKey` chỉ có 3 giá trị
  này, không có 'A4' (xác nhận 30/07, brief ghi nhầm).
- Sửa doc drift `docs/MULTI-SHEET-PROPOSAL.md` §7: "không persist qua reload ở pha 1" — SAI,
  `CadSheets.tsx` đã persist IndexedDB từ J-3 Sprint 2 quyết định #6.

## 30/07 khuya — 7.3.31 mở rộng: hợp nhất Header+StudioBar → AppChrome, cấp mã đợt review BOQ/Lark
- **7.3.31** (nâng phạm vi từ "sửa 3 nút nhảy vị trí" lên "hợp nhất lớp app chrome") — `Header.tsx`
  (route `/`) + `StudioBar.tsx` (`/cad`,`/present`,`/photo`) → `AppChrome.tsx` duy nhất, prop
  `active`. `lib/studio/stage-nav.ts` mới gộp `PhaseSwitcher.onPick` (Header cũ) + `go()`
  (StudioBar cũ) thành `pickStage()`. `AppChromeTypes.ts` tách `type AppChromeActive` tránh vòng
  lặp import. `MobileMenu.tsx` nhận prop `active`, `PhaseRow` đổi gọi `pickStage()` qua router
  (trước gọi `setWorkspace()` trực tiếp — bug: đổi state không đổi URL ngoài route render).
  2 lỗi thật sửa kèm: `SessionWatch` trước chỉ ở `StudioBar` (route `/` không báo hết phiên) → nay
  universal 4 route; không route nào ngoài `/` có đường tới `/settings` → `MoreMenu` (link Cài
  đặt + theme) nay universal. Theme toggle: thử tách đứng riêng ở cụm phải trước, phát hiện vỡ
  bất biến priority+ (2.2.60) ở 1024px (thêm ~32-40px luôn-hiện làm "Chạy flow" đè "Tệp") — trả về
  đúng vị trí gốc trong `MoreMenu()`. `Header.tsx`+`StudioBar.tsx` xoá hẳn (xác nhận grep 0 import).
  Browser-verify thật: `.if-dock` ở CẢ 4 route (`/photo` qua tab mới, đúng cách vào thật) × 2
  breakpoint (1183/1440px) — left giống hệt 254.203125px cả 8/8 lần đo (0px jitter), width lệch
  tối đa 0.28px. `UserChip`/Cài đặt/`SessionWatch`/theme xác nhận có mặt cả 4 route. tsc sạch,
  ESLint sạch, 102/102 test sucrase-node pass.
- 🔴 Nợ kỹ thuật phát hiện khi verify (không phải regression `7.3.31`) — Tệp chồng một phần Chạy
  flow ở 1024px route render, pre-existing từ `Header.tsx` cũ (comment gốc dòng 45-52 xác nhận cố
  ý không dùng `overflow-hidden` vì cắt popover con). Ghi `docs/TECH-DEBT.md`, tự hết khi `2.2.86`
  dời "Chạy flow" khỏi bar.
- **Cấp mã (Luật #8b)** theo `docs/REVIEW-SPEC-BOQ-LARK-2026-07-30.md` và
  `docs/TICKET-CHAY-FLOW-KHONG-GHIM-BAR-2026-07-30.md`, Hoà đã xác nhận không trùng: `2.2.86`
  (Chạy flow rời bar → pill nổi trạng thái), `7.1.19` (Lark Wiki `resolveWikiAppToken` + 3-token
  split), `2.1.9.q` (BOQ groundwork — `polygonPerimeter`+trừ lỗ mở, gộp 2 việc 1 mã theo yêu cầu
  Hoà). Chốt luôn câu hỏi treo ở `2.1.9.i`/`2.1.9.p`: matId nối vào bảng Prisma riêng
  `AtlasMaterial` + `MaterialDef.atlasRecordId` — không thêm field thương mại vào `MaterialDef`
  (vật liệu thị giác, dùng vẽ texture). Thứ tự làm tiếp: `2.2.86`→`7.1.19`→`2.1.9.q`→BOQ `2.1.9.p`.

## 30/07 tối — Sprint 3 cụm đầu: 2.2.85+2.2.69+7.3.30, 3 commit + 2 xác nhận
- `2.2.85`+`2.2.69` chung 1 commit `74cf4c5` (đúng thứ tự bắt buộc: bỏ mono TRƯỚC đổi tên, vì SF
  Mono/Cascadia/Fira thiếu glyph dấu Việt). Bỏ font mono ở mọi nhãn node (10 file, 1 ngoài danh
  sách gốc phát hiện qua quét độc lập) + áp 5 luật thoại cho 45 node + `CATEGORY_META`.
  Browser-verify thật: `getComputedStyle` xác nhận font `Be Vietnam Pro`, không phải mono.
- `7.3.30` commit `10ba92e` — dựng `/settings` đủ 4 nhóm (Tài khoản/Giao diện/AI/Trải nghiệm),
  gỡ Ngôn ngữ + "Xem lại hướng dẫn" khỏi Header MoreMenu + MobileMenu. Browser-verify 1440+375px.
- Hoà xác nhận (commit `e947da6`): (1) giữ cả 2 nút theme Header/StudioBar là ĐÚNG — 2 route
  khác nhau (HomeScreen vs CadStageScreen/PresentStageScreen/PhotoEditorScreen), không trùng lặp
  thật, ticket gốc sai. (2) `2.2.69` hạ ✅→🟡 — phần "4 tên nhóm" chưa làm, hoãn tới `2.2.71`
  (nơi tiêu thụ thật). Cảnh báo mới ở `2.2.71`: dịch `CATEGORY_META` đã tự sinh 2 hệ phân loại
  song song lộ ra người dùng (6 category máy vs 4 nhóm nghề) — làm `2.2.71` phải chốt 1 cái chính.

## 30/07 — dán mã tính năng Sprint 1-6 vào cây + tách Nợ kỹ thuật + 2.2.61.a
- Dán `2.2.60`-`2.2.85` + `2.3.58`-`2.3.63` vào `docs/IF-FEATURE-TREE.md` (nguồn
  `SPEC-TONG-COWORK-2026-07-29.md` §3-§8 + `TICKET-FONT-MONO-NODE`), đủ 6 cột, Trạng thái ghi
  bằng chứng `file:dòng` thật. Kiểm trùng: không lệch. Ghi rõ chuỗi phụ thuộc CHỐT
  `2.2.77→2.2.69(+2.2.85 chung commit)→2.2.65→2.2.78→7.1.18→phần còn lại`. 1 điểm mơ hồ nguồn
  (`2.2.83` gộp chung mô tả với `2.2.82`) tự tách theo suy luận, ghi cần Hoà xác nhận lại.
- Tách "Nợ kỹ thuật" từ STATUS.md sang `docs/TECH-DEBT.md` — nội dung nguyên vẹn.
- `2.2.61.a` (commit `77224dc`) — Cowork phát hiện `2.2.61` bỏ sót `MobileMenu.tsx` (picker AI
  tier thật vẫn còn đó, trùng `/settings`, vi phạm Luật #6). Sửa ngay: `TierRow()` → `TierLinkRow()`
  (tên tier + `AiStatusDot` + link `/settings`). Browser-verify thật ở 375px.
- Dán `7.3.30` vào cây (chưa code lúc đó, xem entry riêng bên dưới khi code xong).

## 29/07 khuya — Sprint 1 (docs/CHOT-SO-MA-2026-07-29.md §D) CODE xong, 4 commit
- **Sprint 1 xong cả 4 việc, mỗi việc 1 commit, browser-verify thật**:
  `4804f45` **7.4.11** ẩn `LiveCursors` (giữ `PresenceBar`) · `573e314` **2.2.75** sửa
  `composeBoard()` từ "A4 300dpi-ish" (2480×1754, thật ra ~212dpi) → đúng A3 300dpi thật
  (4961×3508) · `57124b3` **2.2.60+2.2.61** (chung 1 commit — cùng file `Header.tsx`) gộp Header
  chỉ 1 zone co giãn `min-w-0 flex-1`, "Chạy flow"+avatar luôn `shrink-0` — verify thật ở
  1024/1183/1440px; dời `AiTierMenu` khỏi Header sang `/settings` (`AiDependencySettings.tsx`
  mới), Header chỉ còn `AiStatusDot` nhỏ · `e82b46d` **2.2.77** bịt 2 lỗ rò dữ liệu Tool Mode
  (ảnh mất khi đổi thẻ việc do `ToolModeForm` unmount hẳn — chuyển lên store `useToolModeUi`;
  rời canvas về Home im lặng bỏ qua graph đang có — `detectGraphPattern()` nhận mẫu đơn giản
  thì tự mở đúng thẻ, phức tạp thì báo) — 11/11 test pass (`sucrase-node`) + browser-verify thật
  qua `__flowStore`: đổi thẻ giữ nguyên node ảnh, chỉ thay node AI, không rác.
  ⚠️ 2 lần tự sửa sai giữa chừng (browser test bắt được, không phải chủ dự án báo): giả định
  sai `ToolModeForm` không unmount (sai — đã sửa lại đúng) · `overflow-hidden` thêm vào Header
  che mất toàn bộ dropdown popover (đã gỡ, quay lại chỉ dùng `min-w-0`+`flex-shrink`).
- Đã đọc `docs/TICKET-FONT-MONO-NODE-2026-07-29.md` (mã **2.2.85** — bỏ font mono nhãn node) —
  CHƯA LÀM lúc đó, hẹn gộp chung commit với **2.2.69** (quy chuẩn thoại) ở Sprint 3 (mã đã dán
  vào cây 30/07, xem entry "dán mã tính năng" bên dưới).

## 29/07 — SPEC TỔNG Cowork: ingest 3 file lớn + PHẦN E v4 + cảnh báo trùng mã
- Đổi tên file nguồn sự thật (git-commit `8e096a8`): `IF-MASTER-TREE.md` → `docs/IF-FEATURE-TREE.md` ·
  `IF-MASTER-BLUEPRINT.md` → `docs/IF-ARCHITECTURE-COMPASS.md`. Tên cũ giữ dạng redirect 1 dòng —
  `docs/CLAUDE.md` vẫn còn ghi tên cũ, cần sửa khi tiện.
- 3 file lớn từ Cowork lưu vào repo: `docs/SPEC-TONG-COWORK-2026-07-29.md` (6 phát hiện lõi + bảng
  việc 8 sprint + chi tiết chặng 2/thoại/chỉ dẫn/chấm chuẩn/cộng tác/Vitals) ·
  `docs/IF-DESIGN-STANDARD-2026-07-29.md` (chuẩn thiết kế: 10 tật "mùi AI", thang chữ 7 bậc, khoảng
  cách bội-4, bo góc 3 bậc, Swiss/Apple HIG) · `if-vitals-visual.html` (mockup Vitals chạy thật, 5
  trạng thái + 3 cỡ + xoắn thiên hà). Chưa nhận được 12 file phụ khác mà SPEC-TỔNG §9 liệt kê
  (KHAM-*.md, LUAT-300DPI, AUDIT-PRESENT-UX, if-chang2-mockup.html...) — chỉ lưu được cái đã dán
  vào chat.
- PHẦN E v4 (`docs/IF-FEATURE-TREE.md`) — thêm luật 8a (checklist 6 bước = "xong"), 8b (luật xếp
  hàng gia phả), 9 (≥300dpi khi giao khách/in).
- CẢNH BÁO TRÙNG MÃ (chưa dán mã tính năng đề xuất vào cây, chờ Hoà quyết): `3.30`/`3.31` (đề
  xuất) TRÙNG `3.30.a/b/c` đã có (Library NT1, việc khác hẳn) · `7.20-7.27` không khớp quy ước 4
  cấp của khối 7 (`7.<nhóm>.<mục>`) — đặc biệt `7.24-7.27` nên là `7.4.x` (đã có nhóm Cộng tác).
  `2.2.60-2.2.84`/`2.3.58-2.3.63` không trùng, an toàn dán khi Hoà duyệt.

## 28/07 tối — NT-gateway ①②③ + StatusBar (VIỆC A) + Tool Mode Render (VIỆC B)

Chi tiết đầy đủ nằm trong message commit (`git log`), đây chỉ tóm để không mất dấu:
- `144ea46` docs: chốt 4 câu hỏi PLAN-LIBRARY-GATEWAY.md.
- `9a52f83` NT3 chuột phải CAD+Render (Popover.tsx dùng chung).
- `bfd5fe9` NT2 bảng ánh xạ định dạng→đích, `lib/gateway/detect.ts`+`route.ts`, 34/34 test.
- `1f637ba` NT4 pha 1 `diskPath`+"Cập nhật liên kết", Present Inspector.
- `03b741a` docs: SPEC-RENDER-STUDIO §6C sinh diện đồ nội thất bằng hình học + kho nhớ 3 tầng.
- `8b03e2e` VIỆC A: StatusBar dùng chung 3 chặng, Vitals neo status bar (bỏ nút nổi).
- `cf1beeb` VIỆC B: Tool Mode 3 tầng làm mặc định chặng Render (6 thẻ → 2 cột → canvas).

Chi tiết đầy đủ (lý do thiết kế, trade-off, kết quả verify browser) → xem STATUS.md "Nợ kỹ
thuật" mục cùng ngày, hoặc đọc trực tiếp commit message từng commit trên.

## 27/07 tối — Sửa 4 lỗi giao diện chặng Rendering + gom nút trùng nghĩa + audit Vitals (CHƯA commit)

**Bối cảnh**: sau khi chốt design tokens + "giấy vuông vỏ bo" (mục dưới), user báo 4 lỗi UI cụ
thể ở chặng Rendering + yêu cầu gom nút trùng nghĩa giữa lúc làm + yêu cầu audit Vitals (chỉ báo
cáo). Nhánh `feat/present-layout-ml-p1`, KHÔNG phải main.

**1) `/library/ingest` không có đường về** — route đứng riêng (`app/library/ingest/page.tsx`),
không dùng khung `HomeScreen` (có login/resume/project-scope logic phức tạp, tích hợp nguyên
khung được đánh giá rủi ro cao/không đáng — route này vốn manual-first, không project-scoped qua
URL). Thêm nút "← Quay lại" tối thiểu: `router.back()`, fallback `router.push('/')` khi
`window.history.length <= 1` (vào thẳng bằng URL, không có lịch sử để back). Verify browser thật:
bấm nút từ `/library/ingest` quay đúng về project Rendering vừa mở trước đó.

**2) Reference panel (`components/LibraryPanel.tsx`) quá rối** — trước đó bắt lọc/khai báo TRƯỚC
KHI thấy ảnh nào (5 tab category + search + checkbox cross-category + dropdown usage + tag input +
2 nút, tổng 7 hàng chrome trước lưới ảnh). Tái cấu trúc theo "THẤY ẢNH TRƯỚC, LỌC SAU":
- Hàng 1: 1 ô tìm (giữ nguyên logic `searchAssets()`) + 1 nút `[+]` (icon `Plus`, toggle popover).
- Hàng 2: 1 `<select>` duy nhất thay thế 5 tab + checkbox cũ — value `crossCat ? '__all__' : cat`,
  option `__all__` = "Tất cả (tìm xuyên mọi category)", các option khác giữ đánh dấu `★` khi hợp
  chặng đang mở (logic `phaseCats`/`orderCategoriesByPhase` giữ nguyên).
- Phần còn lại (đa số chiều cao panel): lưới ảnh — không đổi logic, chỉ đổi vị trí (giờ hiện ngay
  sau 2 hàng thay vì sau 7 hàng).
- Ẩn sau `[+]` (chỉ cần khi THÊM ảnh, không cần khi TÌM ảnh): `usage` select (auto-classify), tag
  input lúc upload, nút "Upload" (giữ nguyên logic xử lý ảnh: FileReader→dataURL, extractPalette
  cho Gu Engine, classifyImage() khi usage='auto', POST `/api/library` từng file), và nút "Nạp vào
  thư viện" (giữ nguyên, route sang `/library/ingest`).
- Xoá `title="Hợp với chặng đang làm"` từng đè lên 2 tab bên dưới nó — hết vấn đề vì cả hàng tab
  cũ đã bị thay bằng dropdown (không còn tooltip nào để đè).
Verify browser thật (không chỉ tsc): mở panel Reference ở chặng Render → thấy lưới ảnh ngay, bấm
`[+]` → đúng 1 popover chứa usage/tag/Upload/"Nạp vào thư viện", đóng lại sạch sẽ.

**3) MiniMap React Flow hiện khối đen rỗng khi canvas ít node** — `components/FlowCanvas.tsx`:
bọc `<MiniMap>` (vốn luôn render, không điều kiện) trong `{nodes.length >= 3 && (...)}`. Lý do
đen rỗng: `maskColor` phủ toàn bộ phần ngoài viewport, mà viewport quá nhỏ so với khung minimap cố
định (160×110) khi canvas chỉ 1-2 node → gần như toàn bộ minimap là màu mask. Verify 2 chiều
bằng browser thật: canvas rỗng (0 node) → không có `.react-flow__minimap` trong DOM; sau khi thêm
demo flow (4 node) → minimap xuất hiện đúng góc dưới phải.

**4) Mục 4 của brief (3 thẻ gợi ý demo trên canvas rỗng)**: giữ nguyên theo đúng yêu cầu, không
đổi gì.

**Gom nút trùng nghĩa (đổi tên theo ĐÍCH ĐẾN, giữa lúc làm việc trên)**:
- `components/ui/IOMenu.tsx` — nhãn mặc định `'Nhập'` → `'Mở tệp'` (dùng chung CAD/Render/
  Present qua cùng component). Lý do: "Nhập" mô tả HÀNH ĐỘNG, không nói ĐÍCH — "Mở tệp" đúng cho
  cả 3 chặng (.idf/DXF ở CAD, ảnh ở Render, .pptx/.pdf ở Present) vì bản chất đều là "mở 1 tệp có
  sẵn". Nhận định premise: brief mô tả "Nhập mở .idf/DXF/PPTX" thực ra là GỘP hành vi của CẢ 3
  chặng lại — riêng menu Nhập của CHÍNH chặng Render chỉ có ảnh + 1 mục flow-JSON (disabled), không
  liên quan tài liệu — vẫn đổi nhãn mặc định GLOBAL vì "Mở tệp" đúng ngữ nghĩa bất kể định dạng cụ
  thể mỗi chặng cho phép.
- `components/studio/UploadButton.tsx` — nhãn chặng Render `'Tải lên'` → `'Thêm vào canvas'` (đây
  là chỗ TRÙNG 100% với "Nhập → Ảnh" cũ, cùng gọi `addImageNodesFromFiles()`, nên đổi tên không
  rủi ro hành vi). Nhãn chặng `concept`/`present` giữ nguyên (đã đặt tên theo đích từ trước).
- **CHƯA gộp "Upload" + "Nạp vào thư viện" thành 1 nút** theo đúng điều kiện user đặt ra ("nếu 2
  nút khác chức năng thật thì báo trước khi gộp") — 2 nút này KHÁC NHAU THẬT: Upload = thêm nhanh
  vài ảnh thẳng vào thư viện team, xử lý ngay tại chỗ. "Nạp vào thư viện" = mở `/library/ingest`,
  một trang riêng để DÀN CẢ BỘ reference của dự án (nhận PDF/Excel/CSV/DXF/DWG, không chỉ ảnh),
  có tính năng "AI Content Strategist" (gọi `/api/vision/caption`, `/api/strategy/scenarios`,
  `/api/illustration` để sinh 3 kịch bản content xếp hạng tốt nhất/phân vân/loại) — không phải chỉ
  "thêm ảnh vào thư viện". Đã báo user, CHỜ quyết định cách gộp (hoặc không gộp) trước khi sửa
  thêm.

**Audit Vitals (report-only, KHÔNG sửa code)** — chạy Explore agent, xác nhận bằng code thật:
- Mount: `VitalsGesture.tsx` (export `VitalsGesturePanel`) chỉ render từ `StageSwitcher.tsx`, gated
  bởi `dragging || panelOpen`; `StageSwitcher` có mặt ở cả 3 chặng qua `StudioBar`/`Header` →
  `HomeScreen`/`CadStageScreen`/`PresentStageScreen`. Confirmed: có mặt cả CAD/Render/Present.
- Cách gọi: KHÔNG có nút, KHÔNG có phím tắt hoạt động — chỉ có gesture kéo xuống trên 1 hairline
  nhỏ (40×12px) dưới stage-switcher pill (`onPointerDown`→`createStageDragTracker()`, ngưỡng
  28px = mở popover Vitals, 120px = sang Notebook full). `⌘J` được SPEC-VITALS-AI.md tự ghi nhận
  là nợ CHƯA implement (đúng, grep 0 kết quả). Gallery (`ProjectSelect.tsx`) có 1 bar chat luôn
  hiện, không cần gesture — mô hình gọi khác hẳn 3 chặng kia.
- Backend thật, KHÔNG phải shell: gửi tin nhắn → `POST /api/ai-assist-chat` (yêu cầu session đăng
  nhập, sanitize input, system prompt theo chặng) → `completeTextTiered()` gọi NVIDIA cloud thật,
  fallback Ollama local thật; thiếu cấu hình thì báo lỗi rõ ràng, không tự bịa câu trả lời. Có 1
  đường RAG riêng, mạnh hơn (`lib/notebook/rag.ts`, dùng cho Notebook full) nhưng popover Vitals ở
  3 chặng KHÔNG dùng đường này.
- So với "một trợ lý, nhiều điểm gọi" (`SPEC-VITALS-AI.md` — bản thân spec còn ghi
  `[CẦN HOÀ DUYỆT]`, chưa duyệt): phần chat ĐÃ đúng (cùng 1 endpoint, gọi được từ cả 4 nơi), nhưng
  tầm nhìn sâu hơn — hợp nhất 4 tính năng AI rời rạc (AI mô tả CAD, node-AI Render, PS-8 Present,
  Vitals) qua function-calling — là 0 dòng code, thuần spec (spec tự grep xác nhận).
- **Kết luận 1 dòng**: Vitals là trợ lý chat THẬT (không phải shell), gọi được từ cả 3 chặng +
  Gallery cùng 1 backend NVIDIA/Ollama thật, nhưng CHỈ nói chuyện — thiếu function-calling để thực
  sự SỬA được CAD/Render/Present là thứ cần nhất để dùng được đúng nghĩa "trợ lý".

**Verify**: `npx tsc --noEmit` 0 lỗi · 97/97 file test PASS (`sucrase-node` từng file, vitest
config không chạy được trên repo này — quirk đã biết) · `npm run build` sạch (phải dừng dev server
+ xoá `.next` trước vì 2 tiến trình cùng ghi `.next` gây `PageNotFoundError` giả — không phải bug
code) · browser thật qua `127.0.0.1:3000` cho cả 3 điểm sửa UI + 2 nhãn nút đổi tên.

**CHƯA làm**: commit + push (chờ user xác nhận), quyết định gộp Upload/Nạp vào thư viện, xoá
function-calling nợ Vitals.

## 27/07 — Chốt design tokens: accent tím, gộp font, token trạng thái (`c350a55`)

Thực thi 3 việc từ báo cáo audit `docs/DESIGN-TOKENS.md` (trước đó cùng ngày).

**1) Accent chính thức** — giữ tím `#8b7cf7` làm gốc nhưng HẠ ĐỘ SÁNG (HSL 72.7%→65%, giữ
nguyên hue/saturation 247°/88.5%) → `#6a57f5`, vì chữ trắng trên bản cũ chỉ đạt 3.32:1 (dưới
WCAG AA 4.5:1); bản mới đạt 4.89:1 — tính bằng công thức luminance thật (script Node), không
đoán. `--accent-strong`/`-soft`/`-ring` đổi theo RGB mới. Thay ~40 chỗ vàng ấm `#c79a63` bằng
`--accent` khắp login (LoginForm/LoginBackdrop/LoginScreen)/dashboard (ProjectSelect/WelcomeIntro)
/CAD (coachmark)/Present (qua StockPhotoPicker dùng chung) + VitalsGesture/LangToggle. GIỮ ĐÚNG
2 ngoại lệ trong LoginBackdrop.tsx (swatch + glow của preset nền "ember"/Đêm ấm — đó là màu ĐỊNH
DANH riêng của 1 preset trong danh sách chọn nền, đổi thành tím sẽ khiến preset "ấm" hoá lạnh vô
lý, cùng logic với việc không đổi màu vật liệu/furniture). Token mới `--accent-warm` CHỈ dùng cho
nút submit "Vào xưởng" (LoginForm.tsx) — ngoại lệ duy nhất user yêu cầu giữ nguyên.

**2) Gộp font** — brief đoán "7 file" nhưng verify import trace thật cho thấy chỉ 4 file THỰC SỰ
sống có hằng số `SANS`/`MONO`/`DISPLAY` cục bộ (ProjectSelect.tsx, entry/LoginScreen.tsx,
entry/LoginForm.tsx, studio/VitalsGesture.tsx) — 6 file khác cùng khai báo hằng số này
(`components/IntroSequence.tsx`, root `LoginScreen.tsx`, `StageSelect.tsx`, `entry/cardFaces.tsx`,
`entry/StackedCards.tsx`, `intro/TitleSequence.tsx`) là CODE CHẾT, xác nhận 0 nơi import — không
sửa, tránh làm việc vô ích trên code không chạy. Xoá sạch ~60 lệnh `fontFamily: SANS/MONO/DISPLAY`
ở 4 file sống, để kế thừa `--font-sans` (Be Vietnam Pro) từ `body` mặc định.

**3) Token trạng thái** — `--danger`/`--warning`/`--success` mới, cả 2 theme (dark:
`#e5674f`/`#d9a34a`/`#46b876`, light: `#c9341d`/`#9a6304`/`#107043`), mỗi giá trị verify ≥4.5:1
trên `--panel`/`--card` tương ứng bằng script tính luminance thật. Nối vào `CadEditor.tsx`
`sevIcon()` (severity error/warning của standards checker) + cảnh báo tỉ lệ in không lọt khổ +
cảnh báo máy lạnh/giường quá gần; `AiBriefPanel.tsx` `statusGlyph()` + 2 chỗ khác từng dùng tạm
`var(--accent)` làm màu "success" (giờ đổi đúng sang `--success`). Dọn 2 chỗ
`var(--danger, #fallback-khác-nhau)` (Inspector.tsx/CadEditor.tsx — biến chưa từng khai báo, 2
fallback khác nhau cho cùng ý nghĩa) — giờ khai báo `--danger` thật, xoá fallback.

**Verify**: tsc 0 · 97/97 test PASS · `npm run build` sạch · browser thật (127.0.0.1:3000, phải
restart dev server + xoá `.next` giữa chừng vì cache HMR hỏng sau phiên rất dài) xác nhận cả 4
màn nghiệm thu (login → dashboard → CAD → Present) đều dùng accent tím nhất quán, riêng nút "Vào
xưởng" đúng như yêu cầu vẫn vàng ấm.

## 27/07 — Onboarding 3 tầng + sửa thẻ kính login + Luật vận hành 8 (LLM↔Hình học)

**Onboarding** (`9539fbd`) — thay hẳn `SmartTour` (spotlight chỉ dạy phím bấm/vị trí UI, có bug
định vị đè lên mô tả phía sau) bằng 3 tầng just-in-time: Tầng 1 `WelcomeIntro.tsx` (modal căn
giữa dạy "bức tranh lớn" CAD→Render→Present dùng chung dữ liệu + 2 nút hành động thật) · Tầng 2
`StageIntroCard.tsx` (thẻ góc màn hình, 1 lần/chặng, 3 dòng + ảnh Trước/Sau — Render dùng ảnh
thật `sketch-in.jpg→sketch-out.png`; CAD/Present dùng SVG line-art tối giản 8px-grid/≤12 phần
tử/đơn sắc chờ ảnh thật, KHÔNG để AI vẽ minh hoạ cầu kỳ) · Tầng 3 coachmark chọn đối tượng CAD
lần đầu. Thêm "Xem lại hướng dẫn" (Header/MobileMenu) reset toàn bộ cờ. `lib/resume.ts` thêm
`effectiveUserId()` (route studio không nạp `user` khi hard-reload, rơi về `lastUserId`).
Verify: tsc 0 · 97/97 test · browser thật xác nhận cả 2 tầng hiện đúng vị trí/đúng 1 lần.

**Thẻ kính login** (`app/globals.css`) — chẩn đoán đúng: blur 22px quá mạnh làm nhoè hình nền,
không phải lỗi alpha. Hạ xuống 14px + saturate 160%, bỏ hẳn `::before`/`::after` (rim/specular
nhiều lớp — nguồn gốc cảm giác "khối nhựa"), border 1px sáng + box-shadow 2 lớp đơn giản, thêm
text-shadow giữ chữ đọc được. Verify trước/sau bằng browser thật (Chrome-based) + theme sáng/tối;
KHÔNG kiểm được Safari thật (môi trường không có công cụ điều khiển Safari desktop).

**Luật vận hành thứ 8** (`docs/IF-ARCHITECTURE-BLUEPRINT-v1.md` §8 + `docs/SPEC-SEMANTIC-MODEL.md`
§8 mới) — AI không được ghi trực tiếp toạ độ x/y vào hình học; bắt buộc ý định có cấu trúc → code
tính toạ độ → validator kiểm (chồng lấn/lối đi/ranh phòng/tổng kích thước) → sai thì tự sửa tối
đa 3 vòng, vẫn sai thì báo lỗi không ship. Audit code (`lib/cad/ai-assist.ts`) xác nhận **hiện
CHƯA vi phạm** — kiến trúc 2 tầng (parse rule-based → solver tất định) đã đúng, `RoomSpec` không
có trường toạ độ — nhưng chưa có LLM thật cắm vào layout (chỉ là rủi ro phòng ngừa, ghi vào Nợ
kỹ thuật cho lúc cắm LLM thật).

## 26/07 khuya — Audit IF1 + phân loại docs/ + Sprint Semantic Room (T1/T2)

**Audit** (`da310d9`) — `docs/IF1-COMPLETION-AUDIT.md` mới: đối soát 101 item spec + PS-0..11
với code thật (4 agent song song grep/đọc, tôi tự chốt trạng thái), không chép nhãn tự khai
17/07. Kết quả: 79/98 item (loại non-goal) ≈ 81% (số cũ tự nhận 89%, sai lên). Group C (TCVN
checker) từng tự nhận "đã Pro" — thực tế 5/7 item chỉ registry-only, chưa có wizard Apply. Bảng
4 điều kiện M1 cho IF2: `.idf` có version nhưng chưa migration path · semantic model chỉ Zone có
ngữ nghĩa thật (Room/Wall thì không, tới trước sprint này) · chuỗi matId→BOQ **0 kết quả** toàn
repo · RBAC tốt hơn kỳ vọng nhưng thiếu backup thật + onboarding wizard.

**Phân loại docs/** (`aff9b15`) — 79 file + `docs/archive/` gắn đủ 4 nhóm (🟢/🔵/🟡/🔴) trong
`docs/README.md`, dựa bằng chứng thật (header + git log + cross-reference), không đoán theo tuổi
file. 2 file archive: `LICENSE-NOTES.md` (tự khai hết hiệu lực) · `DEPLOY-VERCEL.md` (giả định
cloud, bị local-first ghi đè).

**VIỆC 1 — gói tài liệu đợt 4-11** (`74c3fe5`) — 8 file `IF-DOCS-BATCH-4..11.md` không tìm thấy ở
repo root/`~/Downloads`; nội dung xuất hiện gộp giữa phiên trong `docs/IF-FINAL-2607-ALL.md` (file
ngoài git, tự tái tạo — có thể là cơ chế đồng bộ ngoài, không rõ nguồn), xử lý từ đó. 9 phần: 6 bổ
sung vào file sống (`SPEC-RENDER-STUDIO`, `SPEC-EDITOR-TOOLKIT`, `SPEC-VITALS-AI`,
`SPEC-PRESENT-FLOW`, `SPEC-MATERIAL-PIPELINE`, `SPEC-ARCHINOTE-IF-BOUNDARY`) + 2 file mới
(`SPEC-BRIEF-INTAKE.md`, `SPEC-STAGE-0-IDEATION.md`) — file mới giải quyết luôn dẫn chiếu ⚠️ đã
ghi ở VIỆC 2.

**VIỆC 2 — Chặng 0 + dọn framing cũ** (`c8c7d0f`) — blueprint thêm CHẶNG 0 · Ý TƯỞNG (Ý tưởng →
CAD → Render → Present) vào hộ chiếu tính năng + bảng audit theo chặng. `FINAL_ARCHITECTURE_REPORT.md`
+ `HUONG-DAN-SU-DUNG.md` gắn cảnh báo framing cũ "nội bộ TTT" (nợ: viết lại đợt de-TTT 2).
`DEPLOY-VERCEL.md` đã archive từ trước, chỉ xác nhận.

**VIỆC 3 — Sprint Semantic Room, T1+T2** (T3/T4 hoãn sang phiên sau theo lệnh dừng):
- **T1 roomType** (`709f6d6`) — audit phát hiện Room không lưu trữ, `RoomKind` suy luận lại từ
  text label mỗi lần checker chạy. Thêm `roomType?: RoomKind` persisted trên `TextEntity` +
  `backfillRoomTypes()` (gán 1 lần cho phòng cũ, nối cả đường autosave-restore lẫn `.idf` import)
  + UI chọn công năng phòng (`RoomTypeBox`). Nghiệm thu: đổi label không mất công năng — verify
  bằng test thật.
- **T2 wallKind** (`1ec4dde`) — không có `WallEntity` riêng (tường = Line/Polyline/Hatch tuỳ cách
  vẽ) nên field đặt ở `Base`: `wallKind`/`wallStructural`/`wallThicknessMm`. Consumer:
  `wallKindSummary()` (đếm exterior/interior/unclassified) + `WallStatsBadge`. **LỆCH có chủ ý**:
  KHÔNG backfill/suy đoán wallKind từ hình học cho tường cũ (không có DCEL outer-boundary utility
  đáng tin cậy — khác T1 vốn suy luận được từ text), và KHÔNG bịa trích dẫn quy chuẩn độ dày tường
  (registry.ts đòi verified thật hoặc note trung thực).

Verify mỗi bước: tsc 0 + full test suite chạy lại độc lập (không tin báo cáo agent) — 96/96 sau T1,
97/97 sau T2. Merge `feat/present-layout-ml-p1` → `main`, `npm run build` sạch, push `origin/main`
@ `1ec4dde`.

## 26/07 tối — Batch 5 việc: sửa docs, merge avatar đợt 2, 3 route, rail tooltip, CAD sprint

Chạy tuần tự theo lệnh user "CHẠY TUẦN TỰ, KHÔNG HỎI LẠI", mỗi việc 1 commit, agent Sonnet cho
phần code (VIỆC 2/3/4), verify độc lập bằng browser thật sau MỖI agent trước khi qua việc kế.

**VIỆC 0** (`e35d49a`) — sửa 2 claim sai tôi tự phát hiện trước đó: `SPEC-CAD-MODES.md` §4 đổi
"khung tên ⬜ thiếu" → "✅ đã có `titleBlockPro()`", tách bảng phân biệt multi-sheet-tab (đang có)
vs Layout/Paper Space thật (vẫn thiếu); `SPEC-RENDER-STUDIO.md` §1B sửa "rail không nhãn" →
"có `title=` nhưng trễ/không style/không hiện trên cảm ứng". Xoá `docs/files.zip` (file user tải).

**VIỆC 1** (`a83e943`) — merge `feat/avatar-plush-2` (7 commit, 0 conflict) vào nhánh tích hợp.
Verify: tsc 0 · `npm run build` sạch · 94/94 test PASS. Gỡ worktree + nhánh (đủ 4 điều kiện an toàn).

**VIỆC 2** (`db9d83b`) — 3 route 🔴: `/library/ingest` thêm nút "Nạp vào thư viện" trong
`LibraryPanel` (verify browser: điều hướng đúng, không lỗi console) · `/intro` nối vào nhánh
`user === null` của `HomeScreen.tsx` (lazy `useState` đọc `if_intro_seen_v1`, cùng mẫu `stageDone`
— tránh hydration mismatch) · `/report` + `lib/report-deck.ts` **xoá** (deck nội dung cứng là báo
cáo nghiên cứu NỘI BỘ .idf/EFC, không phải tính năng khách hàng, đã hết mục đích chứng minh kỹ
thuật; grep xác nhận 0 import khác trước khi xoá). Verify: tsc 0 · 94/94 test · `/report` → 404
thật · nút mới điều hướng đúng qua browser thật (127.0.0.1:3000).

**VIỆC 3** (`503d273`) — tooltip tuỳ biến (`components/ui/Tooltip.tsx`, đã có sẵn từ trước, delay
~150ms) thay `title=` thô ở `LeftRail.tsx` (11 nút, 2/3 rail còn lại — CAD/Present — đã dùng sẵn).
Thêm chế độ THỨ HAI cho cảm ứng thật: `@media (hover:none) and (pointer:coarse)` ẩn tag nổi, hiện
nhãn chữ tĩnh dưới icon (kiểu tab bar iOS) — áp dụng tự động cho CẢ 3 rail vì dùng chung 1
component. Verify: tự mắt xác nhận bằng cách inject CSS mô phỏng touch tạm thời rồi gỡ — icon+nhãn
xếp dọc đúng, không vỡ layout, gỡ CSS khôi phục nguyên trạng desktop.

**VIỆC 4** (`a25cb22`) — Sprint ĐỔ NỀN 2 (blueprint mục 7, item 2-5, chỉ backfill N):
- T1 snap indicator: `drawSnap()` **đã có sẵn** từ `b3eafba` — sửa thật là `findSnap()`
  (`lib/cad/query.ts`) trộn sai thứ tự ưu tiên OSNAP (intersection bị đẩy xuống rất thấp), viết
  lại thành cascade đúng chuẩn AutoCAD (endpoint > intersection > center > midpoint >
  perp/tangent > quadrant > node > nearest > grid). Test mới `snap-priority.test.ts` (6 case, cố
  ý dựng tình huống "gần hơn" và "ưu tiên cao hơn" mâu thuẫn để test có răng). Thêm Alt = tắt tạm
  toàn bộ OSNAP (cùng mẫu Shift→ortho tạm thời có sẵn).
- T2 F8 Ortho: **phát hiện bug thật ngược hướng nghi ngờ ban đầu** — không phải "rect thiếu
  ortho" mà "rect bị áp ortho sai" (dùng chung `applyDirectionConstraint` với line, ép trục làm
  rect SẬP thành 1 đường khi F8 bật — đúng bug AutoCAD RECTANG né bằng cách bỏ qua ORTHO cho góc
  đối diện). Sửa bằng `BOX_CORNER_TOOLS` loại trừ `rect`/`room` khỏi constraint.
- T3 dimension tooltip: **đã có sẵn** (`drawDynInput()`, phím F12) — brief ban đầu grep sai tên
  hàm nên báo nhầm thiếu.
- T4 undo history panel: cơ chế `past`/`future`/`undo`/`redo` giữ nguyên (đã đúng, không đụng).
  Panel mới `components/cad/HistoryPanel.tsx` liệt kê từng bước, click nhảy tới đúng bước. CỐ Ý
  không đụng `LeftRail.tsx` (mục "History/Versions" ở đó là history CỦA CHẶNG RENDER/FLOW, khác
  hẳn `past`/`future` của CAD — brief ban đầu nhầm 2 hệ thống này là một).
- Verify: tsc 0 · 95/95 test (94 cũ + `snap-priority.test.ts`) · **tự tay verify browser thật**
  từng T bằng cách dispatch `PointerEvent` trực tiếp (không qua `computer` tool — lệch tỉ lệ
  toạ độ 1.6x giữa screenshot 800px và viewport 1280px thật): rect+ortho ra hình chữ nhật thật
  (không sập), tooltip "1165 mm ∠ 315.0°" hiện đúng cạnh con trỏ, panel History đúng số bước +
  click "Bước 1" undo về đúng 3 đối tượng.

---

## 26/07 — MERGE avatar đợt 1 + PDF font tiếng Việt (#25) vào `feat/present-layout-ml-p1`

**`54b4b31`** merge `feat/avatar-plush` (3 commit, sạch, 0 conflict) · **`96c046a`** merge `fix/vn-pdf-font` (4 commit).

**#25 — PDF hết mất dấu tiếng Việt.** `b2af06a` font · `57c256f` `lib/pdf-font.ts` + test · `02a1ae7` nối `standards-report.ts`/`pdf.ts`/`CadEditor` · `a65daaf` khung tên hết tràn ô + `⌀`→`Ø`.
- Nhúng **Be Vietnam Pro** Regular+Bold (SIL OFL 1.1, 273KB, `public/fonts/` + `OFL.txt` + attribution `docs/LICENSE-NOTES.md`) — một hệ chữ xuyên UI → bản vẽ → PDF → deck.
- `lib/pdf-font.ts` resolve **caller → Brand Kit → Be Vietnam Pro → helvetica**; .ttf nạp lúc xuất (KHÔNG nhồi base64 vào bundle); chạy cả browser (`fetch`) lẫn Node (`fs`).
- Chỉ 2/6 file jsPDF thật sự dính lỗi; 4 file kia chỉ `addImage` JPEG → cố ý KHÔNG nối font (khỏi cõng 273KB vô ích).

**Conflict merge — `lib/cad/pdf.ts`, file DUY NHẤT, đúng dòng `new jsPDF(...)`.** HEAD thêm `orientation` (fix `b5ca821`), nhánh thêm `await ensureVietnameseFont(pdf)` ngay dưới. Hai bên **bổ sung nhau chứ không đối nghịch** ⇒ gộp giữ CẢ HAI, không mất fix nào.

**Verify độc lập sau merge** — dựng PDF THẬT bằng `buildCadPdf()` rồi đọc BYTE THÔ của file (không tin test, không tin báo cáo agent): **21 ok / 0 fail**.
- MediaBox: A3 `1190.55×841.89pt` = 420×297mm **NGANG** · A2 `1683.78×1190.55` · A1 `2383.94×1683.78` — khớp đúng `PAPER_SIZES_MM`, không bị jsPDF đảo dọc.
- Cùng file đó có `/FontFile2` + `/BaseFont /BeVietnamPro` ⇒ font TTF **thật sự nhúng**, không rơi về helvetica.
- tsc 0 lỗi · **93/93 file test PASS** (đếm thật bằng `git ls-files '*.test.ts' '*.test.tsx'` — trước merge là 92, nhánh font thêm `lib/pdf-font.test.ts`).

**Dọn worktree** (đủ cả 4 điều kiện an toàn `CLAUDE.md`): gỡ `interiorflow-wt-avatar` + `interiorflow-wt-pdf-font` bằng `git worktree remove` (KHÔNG `--force`), xoá nhánh bằng `git branch -d` (KHÔNG `-D`).

**Bug CAD xuất giấy DỌC (`b5ca821`) — bối cảnh gốc.** `new jsPDF({unit:'mm', format:[pw,ph]})` **thiếu `orientation`** ⇒ jsPDF mặc định portrait rồi TỰ ĐẢO khổ ⇒ trang ra 297×420 DỌC trong khi viewport tính cho 420×297 ⇒ **cắt ~30% mép phải, đúng chỗ `titleBlockPro` neo** ⇒ khung tên cụt ở MỌI lần xuất. Lỗi CÓ SẴN TỪ TRƯỚC, không do đợt font. 5 chỗ dựng jsPDF khác trong repo đều truyền `orientation: 'landscape'` — riêng CAD sót, và không test nào kiểm khổ giấy CAD. Test `[4]` trong `pdf-scale.test.ts` nay khoá khổ A3/A2/A1.
⚠️ Bài học: bản sửa này từng **bay mất một lần** vì chạy phép thử "gỡ fix xem test có bắt không" khi file CHƯA commit. Muốn thử thì **commit trước**, khôi phục bằng `git checkout -- <file>`.


## 20/07 — CAD: fix M0 tỉ lệ khung tên + điều tra warning React (nhánh `fix/cad-warning-and-scale-m0`)

**Việc 1 — warning React `Cannot update a component while rendering a different component` (`CadCanvas`/`StudioBar`) — KHÔNG tái hiện được, chưa sửa.**
- Đọc tĩnh toàn bộ cây component liên quan: `CadCanvas.tsx`, `CadEditor.tsx` (+ mọi panel con: FurniturePanel/TemplatePanel/TitleBlockPanel/StandardsPanel/AutoLabelPanel/MepPanel/LayerPanel/ScaleMenu/SelectionInfoPanel/CommandLine/RoomStatsBadge/ConfirmBar), `CadToolbar.tsx`, `CadTouchDock.tsx`, `MaterialPalette.tsx`, `CadSheets.tsx`, `components/studio/StudioBar.tsx`, `StageSwitcher.tsx`, `StageTransitionProvider.tsx`, `StageTransition.tsx`, `SessionWatch.tsx`, `FoldableDualPane.tsx`, `ReferencePane.tsx`, `MenuButton.tsx`, `Tooltip.tsx`, `ResumeTracker.tsx`, `lib/cad/store.ts` (module scope) — KHÔNG tìm thấy setState (React hay Zustand) nào gọi trực tiếp trong thân hàm render; mọi chỗ đều nằm trong `useEffect`/`useLayoutEffect`/event handler, đúng chuẩn React.
- Cài hook `console.error`/`console.warn` chạy TRƯỚC hydrate (Next.js `<Script strategy="beforeInteractive">` tạm ở `app/layout.tsx`, đã revert sau khi xong) để bắt được cảnh báo dù xảy ra ở lần render đầu tiên hay bất kỳ lúc nào — không phụ thuộc timing của devtools console.
- Đã thử tái hiện qua browser thật (127.0.0.1:4531, worktree DB riêng `prisma/dev.db.wt`, tài khoản test tự đăng ký): mount lần đầu · mở demo · vẽ tường (line/wall) · chuyển layer (current/visible/lock) · đổi tool Sketch↔Pro · resize viewport nhiều lần · mở/chạy panel Kiểm chuẩn/Nội thất/Mẫu dự án · hover hàng loạt tooltip toolbar · round-trip điều hướng Header (`/`, đăng nhập thật) ⇄ StudioBar cả 3 chặng (`/cad-editor`/`/present-editor`) bằng click JS thật (`element.click()`, không phải toạ độ screenshot — tránh sai lệch do scale viewport/screenshot) · bật tạm `reactStrictMode: true` (Next mặc định tắt) ép double-render toàn app — class bug này thường lộ rõ hơn dưới Strict Mode · sửa file & để Fast Refresh chạy trong lúc trang đang mở (giả lập đúng thao tác 1 agent code trong khi xem browser). **0/tất cả các lần warning xuất hiện.**
- Nghi vấn hàng đầu, CHƯA XÁC NHẬN: `components/studio/StageSwitcher.tsx` dùng `layoutId="stage-active-pill"` (framer-motion shared layout, KHÔNG bọc `<LayoutGroup>` riêng → dùng chung 1 group toàn app) — `<StageSwitcher>` được render ĐỘC LẬP ở CẢ `Header.tsx` (app chính `/`) lẫn `StudioBar.tsx` (3 route studio). STATUS.md ghi nhận bug này lần đầu đúng batch "motion-audit" 20/07 — batch đó vừa hoist `<StageVeil>` từ trong route lên `app/layout.tsx` (`StageTransitionProvider`), đổi hẳn thời điểm mount/unmount của cây route trong lúc chuyển chặng. Trùng thời điểm nhưng test trực tiếp chuyển Header↔StudioBar (kể cả bấm 2 tab liên tiếp cực nhanh trong cùng 1 lần eval JS) cũng không lộ warning.
- Đề xuất người kế tiếp: (a) hỏi lại đúng 2 agent từng thấy bug — thao tác/route/thời điểm chính xác (branch nào, `next dev` hay build, màn hình gì); (b) thử thao tác CHUỘT THẬT (không phải automation — automation có thể vô tình "quá sạch/quá nhanh" hoặc thiếu 1 nhịp mà người dùng thật tạo ra); (c) nếu tái hiện được, first-hand đọc stack trace React chỉ đúng dòng gọi setState — đừng đoán tiếp.

**Việc 2 — M0 tỉ lệ khung tên CAD (đã sửa).**
- Gốc lỗi (`docs/RESEARCH-TECHNICAL-DRAWING-PIPELINE.md` §1.6): `titleBlock()` (`lib/cad/commands.ts`) nhận field `scale` là chuỗi tự do gõ tay (VD "1:100"); `buildCadPdf()` (`lib/cad/pdf.ts`) lại tự tính 1 hệ số scale KHÁC bằng `fitBox()` để vừa khổ giấy khi xuất PDF — 2 con số không liên hệ gì nhau → khung tên có thể ghi sai tỉ lệ so với đo thước trên bản in.
- Sửa (KHÔNG đụng M1 — dropdown khổ giấy/`ARCHITECTURAL_SCALES`/`suggestScale()`, chưa duyệt):
  1. `lib/cad/model.ts` — thêm `fitScaleLabel(box, paperMm, margin)`: tính "1:N" thật từ `fitBox()`, làm tròn nguyên nếu N≥10, 1 chữ số thập phân nếu N<10.
  2. `lib/cad/pdf.ts` — export `DEFAULT_PDF_PAPER_MM` ([420,297], A3 ngang, TẠM hardcode chờ M1) + `DEFAULT_PDF_MARGIN_MM` (15) thay số cứng lặp lại; thêm `applyRealScaleToTitleBlock(entities, scaleLabel)` (pure, map 1:1, chỉ clone entity text bắt đầu bằng "Tỷ lệ "); `buildCadPdf()` gọi hàm này TRƯỚC khi vẽ — ghi đè đúng vị trí text khung tên bằng tỉ lệ TÍNH THẬT tại đúng khổ giấy/lề của lần xuất đó, `doc.entities` gốc trong app KHÔNG bị mutate.
  3. `components/cad/CadEditor.tsx` (`TitleBlockPanel`) — ô "Tỉ lệ" đổi từ `<input>` tự gõ sang hiển thị READ-ONLY, tự tính bằng `fitScaleLabel(docBox(doc), DEFAULT_PDF_PAPER_MM, DEFAULT_PDF_MARGIN_MM)` mỗi render (luôn khớp bản vẽ hiện tại, không cần nút refresh).
- Test mới `lib/cad/pdf-scale.test.ts` (chạy `node_modules/.bin/sucrase-node lib/cad/pdf-scale.test.ts`, 11 assertion PASS):
  1. 1 line 3200mm, khổ A3 mặc định → `fitScaleLabel()` khớp 100% công thức `fitBox()` tính tay (`scale=0.121875 → N=8.205 → "1:8.2"`), đối chiếu thêm `fitBox()` gọi trực tiếp cho cùng số.
  2. `applyRealScaleToTitleBlock()` — ghi đè ĐÚNG entity "Tỷ lệ 1:999" (gõ sai) → "Tỷ lệ 1:83" (giả lập); `doc.entities` gốc KHÔNG đổi; entity không liên quan giữ NGUYÊN reference (không clone thừa); số lượng entity không đổi.
  3. `buildCadPdf()` end-to-end thật (jsPDF chạy được trong Node/sucrase, không cần DOM) — không throw, trả instance hợp lệ.
- **Verify browser thật** (127.0.0.1:4531, demo mặt bằng có sẵn title block cũ ghi "1:100"): mở panel Khung tên → ô Tỉ lệ hiện **"1:47"** (đối chiếu tay qua `window.__cadStore` + công thức `fitBox()`: bbox demo `16060×12520mm` → scale `0.02133` → N≈46.89 → làm tròn 47 — khớp). Xuất PDF thật (`Đã xuất layout.pdf`), chặn `URL.createObjectURL` để lấy byte Blob trực tiếp (không qua download dialog), decode + tìm chuỗi UTF-16BE 2-byte/ký tự (font nhúng jsPDF dùng encoding này) — text stream PDF thật chứa `(Tỷ lệ 1:47) Tj`, chuỗi **"1:100"** (giá trị gõ tay cũ trong `demo-plan.ts`) **KHÔNG còn xuất hiện** ở bất kỳ đâu trong file PDF xuất ra.
- `tsc --noEmit` sạch · 64/64 file `.test.ts` pass (63 file cũ + `pdf-scale.test.ts` mới), không fail nào phát sinh.

## 21/07 — Presenting chữ chồng/echo — TÌM RA + SỬA XONG (tiếp ngay sau đợt điều tra 2 ở dưới)

**Đầu mối quyết định:** user báo thêm 1 chi tiết mà 2 đợt điều tra trước chưa thử tách bạch: **gõ trực tiếp vào text TRÊN CANVAS (double-click để sửa tại chỗ) → chồng chữ; gõ qua ô "Nội dung" ở Inspector bên phải → luôn sạch.** Hai đường sửa chữ này đi qua 2 code path khác nhau trong `components/present-editor/EditorCanvas.tsx` — đầu mối đó trỏ thẳng vào đúng chỗ.

**Root cause (đọc code xác nhận, không suy đoán):** `EditorCanvas.tsx` có 2 cơ chế vẽ text tại cùng vị trí khi đang sửa tại chỗ:
1. Dòng ~313 — `slide.elements.map((el) => el.hidden ? null : <Element .../>)` — vẽ TẤT CẢ element, kể cả element đang được sửa tại chỗ (`editing.id`). `<Element>` (qua `Inner`/`TextInner`, `components/present-editor/Element.tsx`) đọc `el.text` từ `slide.elements` — giá trị này CHƯA đổi cho tới khi commit (chỉ cập nhật lúc `onBlur`).
2. Dòng ~451 — `{editing && editingEl && <textarea ... style={{position:'absolute', left:`${frame.x}%`, top:`${frame.y}%`, width:..., height:..., fontSize:`${fontSize}cqh`, ...}} />}` — textarea nổi đè ĐÚNG khung `frame` của element đang sửa, hiện giá trị `editing.text` (cập nhật sống theo từng phím gõ qua state cục bộ, KHÔNG ghi vào `slide.elements`).

Không có logic nào ẩn (1) khi (2) đang mở → trong lúc gõ, người dùng thấy ĐỒNG THỜI: chữ CŨ (chưa đổi) của `<Element>` tĩnh + chữ ĐANG GÕ của `<textarea>` nổi, cả hai gần như cùng vị trí/cỡ chữ nhưng khác box-model (div thường vs phần tử form `<textarea>`) → lệch vài pixel, đúng hiện tượng "mỗi ký tự như bị nhân đôi/lệch ngang" user mô tả. Sửa qua Inspector (`Inspector.tsx`, textarea "Nội dung") ghi thẳng vào `slide.elements` qua `onUpdateText`, không đụng tới overlay này — luôn chỉ có 1 lớp vẽ nên luôn sạch, đúng như user quan sát và dùng để bác bỏ kết luận sai của đợt 1.

**Sửa:** `EditorCanvas.tsx` dòng ~313 — thêm điều kiện bỏ qua `<Element>` khi phần tử đó đang được sửa tại chỗ:
```
el.hidden || editing?.id === el.id ? null : (<Element .../>)
```
Chỉ 1 dòng, đúng gốc — không đụng `Element.tsx`, `Inspector.tsx`, hay cơ chế commit/undo hiện có. Khi đang sửa, chỉ còn textarea (khung nét đứt) hiển thị; lúc `onBlur` gọi `onEditTextCommit` → `setEditing(null)` → textarea gỡ, `<Element>` vẽ lại BÌNH THƯỜNG với text đã commit — 1 lớp duy nhất, khớp Inspector/layer panel.

**Verify thật (không đoán):** `npx tsc --noEmit` sạch · 64/64 `*.test.ts` pass (`sucrase-node`) · browser thật (`127.0.0.1:4097`, tài khoản test riêng, worktree DB riêng — không đụng phiên user thật): double-click tiêu đề slide `dark-cover` demo, gõ đè "VILLAGE LIVE TEST" — trong lúc gõ chỉ 1 dòng chữ hiện trong khung nét đứt, không ghost; kiểm DOM trực tiếp lúc đang gõ: đúng 1 `<textarea>` mang giá trị, KHÔNG còn `<div>` tĩnh trùng vị trí trên canvas chính (trước khi sửa: có cả `<textarea>` VÀ `<div>` tĩnh cùng vị trí). Blur → commit đúng, layer panel + Inspector + canvas đều khớp "VILLAGE LIVE TEST", quay lại vẽ 1 lớp bình thường có khung chọn + toolbar chữ nổi.

**Bài học cho lần sau:** khi user báo "field/data sạch nhưng RENDER lỗi", luôn tách 2 code path NHẬP LIỆU khác nhau nếu UI có nhiều chỗ sửa cùng 1 giá trị (ở đây: canvas inline-edit vs Inspector) — đầu mối "chỗ nào sạch, chỗ nào lỗi" thường trỏ thẳng gốc, không cần đoán qua font/motion/CSS units như 2 đợt điều tra trước.

## 21/07 — Presenting chữ chồng/echo, đợt điều tra 2 (nhánh `fix/presenting-text-overlap-v2`) — log giữ lại để tham khảo phương pháp loại trừ (đã TÌM RA + SỬA ở mục ngay trên, mục này ghi lại 5 giả thuyết đã loại trừ bằng bằng chứng cụ thể trước khi có đầu mối quyết định từ user)

**Bối cảnh:** đợt 1 (agent khác, ~7 tiếng, 233 tool call) tái hiện bug bằng cách nạp thẳng `lib/present-editor/akh-sample.ts` (`makeAkhIkiDeck()`) qua code vào editor — KHÔNG phải thao tác tay — rồi kết luận "field text đã hỏng sẵn trong IndexedDB, không phải bug render". User bác bỏ kết luận này: gõ tiêu đề MỚI "VILLAGE" qua UI thật vẫn thấy hiện tượng, trong khi field Inspector + layer panel đều sạch — chứng minh bug ở tầng RENDER, không phải data.

**Đợt 2 làm gì khác:** dựng worktree riêng (port 4097, DB SQLite riêng copy từ `prisma/dev.db` → `prisma/dev.db.wt`, `.env` riêng — không đụng phiên đăng nhập thật, đúng luật STATUS mục 3), đăng ký tài khoản test thật (`bugtestv2-agent2@example.com`) qua UI đăng ký thật, mở `/present-editor` qua route thật (không qua code). Slide 1 của deck demo có sẵn (seed mặc định cho project mới) DÙNG ĐÚNG template `dark-cover` ("Bìa tối điện ảnh", `lib/present-editor/templates.ts` dòng ~470) — nền tối, ảnh trên, kicker "DESIGN FRAMEWORK · DRAFT MOODBOARD", tiêu đề lớn "IKI VILLAGE" dưới cùng, Inspector hiện đúng "Font chữ: Theo deck (Elegant)", "Cỡ chữ 7.5" — khớp gần như nguyên văn ảnh chụp màn hình user gửi. (Lưu ý: `section-divider` — tên tiếng Việt cũng là "Trang phân mục" — có NỀN SÁNG, không khớp mô tả "nền tối"; `dark-cover` mới là template đúng, dù tên gọi trong brief ghi "Trang phân mục".)

Chọn phần tử tiêu đề trên canvas thật (không phải qua code), gõ đè tiêu đề bằng chuỗi hoàn toàn mới, sạch — "VILLAGE" — thẳng vào ô "Nội dung" ở Inspector, giống hệt thao tác user mô tả. Test cả 2 trạng thái: gõ xong ngay lập tức, và sau khi resize/zoom lại viewport (1400×900 → 1600×1000), và sau khi bật thử hiệu ứng "Hai lớp bóng ngược chiều" trong bảng TextFx. **Không một lần nào thấy chữ chồng/echo** — canvas luôn vẽ sạch khớp với Inspector.

**5 giả thuyết loại trừ bằng bằng chứng cụ thể (DOM/console/`getComputedStyle`, không phải suy đoán):**
1. **Font tuỳ chỉnh tải muộn (`custom-fonts.ts` FontFace swap)** — kiểm `document.fonts` trong session: chỉ có 2 font next/font của UI (Be Vietnam Pro, Geist), KHÔNG có font nào đăng ký qua `FontFace`/`registerFont`. "Font chữ: Theo deck (Elegant)" trong Inspector KHÔNG phải webfont — nó resolve thẳng ra chuỗi CSS tĩnh `Optima, "Avenir Next", "Helvetica Neue", sans-serif` (`CANVAS_FONT.Elegant` trong `components/present-editor/Element.tsx` dòng 34), một font hệ thống, không cần tải mạng, không có FOUT/FOIT nào để swap. Toàn repo chỉ có đúng 1 file dùng `document.fonts`/`FontFace` (`lib/present-editor/custom-fonts.ts`) và cơ chế đó CHỈ chạy khi user chủ động bấm "Tải font lên" — không xảy ra trong kịch bản demo/gõ tay thuần.
2. **DOM lặp (2 node text chồng nhau trong cùng canvas)** — query trực tiếp `document.querySelectorAll` lọc theo `textContent === tiêu đề`: luôn đúng 1 `<div>` bên trong canvas chính (`<main>`). Node "trùng" duy nhất khác nằm trong thanh thumbnail slide ở cuối màn hình (`SlideStrip`) — vị trí, kích thước hoàn toàn khác, đây là 2 nơi vẽ hợp lệ khác nhau (canvas chính + preview thu nhỏ), không phải lỗi chồng lớp.
3. **`TextFx` tự áp 2 lớp bóng ("khắc")** — `getComputedStyle(titleDiv).textShadow` = `"none"` ở trạng thái mặc định từ template. Chỉ khi TỰ bấm preset "Hai lớp bóng ngược chiều" mới thấy `textShadow` có 2 lớp offset rất nhỏ (~0.44–0.55px dọc) — đây là hiệu ứng CHỦ Ý, không phải mặc định, và offset là DỌC chứ không phải "lệch ngang" như mô tả — không khớp hoàn toàn nhưng là cơ chế gần nhất có thể tạo cảm giác "echo" nếu user vô tình bật.
4. **React key trùng gây ghost-paint** — `newId()` (`lib/present-editor/model.ts` dòng 370) dùng counter `_seq` đơn điệu + timestamp, không thể sinh trùng id trong 1 phiên.
5. **Motion/slideshow crossfade kẹt giữa chừng** — `components/present-editor/EditorCanvas.tsx` (canvas ĐANG SỬA, đúng nơi user báo lỗi) không hề import `lib/present-editor/motion-present.ts`; animation chuyển slide chỉ tồn tại ở `SlidePlayer.tsx`/`PlayerElements.tsx` (chế độ "Trình chiếu" riêng) — khác hẳn nơi bug xảy ra.

**Nghi vấn còn lại, CHƯA xác nhận được (do giới hạn môi trường, không phải đã loại trừ):** stage trong `EditorCanvas.tsx` dùng `containerType:'size'` + toàn bộ cỡ chữ tính bằng đơn vị **`cqh`** (CSS container query units — dòng ~245 khai container, dòng ~469 dùng cho fontSize khi edit inline). Đây là tính năng CSS còn tương đối mới (Chromium ~105+, Safari 16+), từng có lịch sử bug repaint/rasterize-kép khi container đổi kích thước nhanh (kéo resize khung chữ, đổi zoom trình duyệt) — raster cũ có thể chồng lên raster mới vài frame trước khi ổn định, tạo đúng cảm giác "mỗi ký tự bị nhân đôi/lệch vài pixel". Agent này chạy Chrome headless trên Linux (không có font "Optima" thật — fallback sans-serif chung), khác hẳn máy Mac thật của user (Optima thật + GPU/DPI thật) — rất có thể lỗi cần đúng combo font-hinting + compositing của macOS mới lộ ra, và test resize/zoom ở đây (dù đã thử) không đủ "thật" để trigger race condition kiểu này.

**Đề xuất cụ thể cho đợt sau (KHÔNG lặp lại 2 cách đã thử hỏng):**
- KHÔNG dùng `akh-sample.ts` (đợt 1 đã sai).
- KHÔNG chỉ verify bằng agent Linux headless (đợt 2 này không đủ để lộ bug nếu nó thật sự liên quan font/GPU macOS).
- Verify trên **máy Mac thật** của user (Chrome hoặc Safari thật, có font Optima thật) — thao tác: mở slide `dark-cover`/`section-divider`, gõ tiêu đề, rồi NGAY LÚC ĐÓ kéo resize khung chữ hoặc đổi zoom trình duyệt (Cmd +/-) vài lần liên tục, chụp màn hình đúng khung hình đang lỗi (không chờ ổn định).
- Nếu tái hiện được: mở DevTools thật → Elements tab kiểm tra đúng lúc lỗi hiện có bao nhiêu text node (đợt 2 này dùng JS đọc DOM, không có cách "chụp" đúng khung hình transient — cần xem trực tiếp bằng mắt hoặc quay màn hình chậm).
- Cân nhắc thử tắt `containerType:'size'`/đổi `cqh`→`%`+JS đo tạm thời trên 1 nhánh test riêng, xem hiện tượng có biến mất không (nếu biến mất → xác nhận đúng thủ phạm).

**Lưu ý công cụ cho agent sau:** Browser pane của môi trường agent (không phải máy thật) không bắn `pointerdown` thật khi dùng `computer.left_click` (toạ độ hay `ref` đều vậy) lên các phần tử kéo-thả tuỳ biến của `Element.tsx` (dùng `onPointerDown`, không phải `onClick` chuẩn) — mọi lần thử chọn/gõ chữ qua click toạ độ đều bị bỏ qua hoặc gây bỏ-chọn ngoài ý muốn. Phải dispatch `PointerEvent`/`MouseEvent` tổng hợp qua `javascript_tool` mới chọn được element và set giá trị textarea qua native setter + `input` event mới gõ được chữ. Việc này tốn khá nhiều lượt thử — agent sau nên dùng cách này NGAY từ đầu thay vì thử click toạ độ trước.

**Verify không đổi code:** `npx tsc --noEmit` sạch · 66/66 file `*.test.ts` pass (`node_modules/.bin/sucrase-node`) — không có thay đổi code nào ở đợt này (chỉ điều tra), nên không có rủi ro regression.

## 20/07 — Present — Nhúng font THẬT vào PPTX (nhánh `feat/pptx-font-embed`)

**Khảo sát trước khi code (kết luận: KHẢ THI).**
- `pptxgenjs` v3.12 **không có API nhúng font** — grep `node_modules/pptxgenjs/dist` + `types/index.d.ts` cho `embed|fntdata|embeddedFont`: 0 kết quả. Nó chỉ ghi tên vào `fontFace`.
- Chuẩn OOXML có chỗ nhúng: `/ppt/fonts/font{N}.fntdata` + `<p:embeddedFontLst>` + relationship + content-type.
- **Định dạng bắt buộc là EOT, KHÔNG phải TTF thô.** Nguồn: W3C EOT Submission; Andreas Beeker (Apache POI) — "Fonts are stored under /ppt/fonts/*.fntdata in the pptx, always in EOT format". PowerPoint nhận 2 biến thể: MTX (nén, có bằng sáng chế) và **non-MTX (không nén)** — ta dùng non-MTX nên làm được thuần JS client, không cần nén.
- **KHÔNG cần obfuscate.** Việc XOR 32 byte đầu bằng GUID là của **.docx** (`w:fontKey`); `p:embeddedFont` của PPTX trong ECMA-376 không có fontKey.
- Zip: dùng `jszip` (đã có sẵn trong cây phụ thuộc của pptxgenjs, nay khai báo thẳng ở `package.json`), không thêm gói mới.

**Cài đặt.**
- `lib/pptx-font-embed.ts` (mới) — đọc bảng sfnt (`name`/`OS/2`/`head`), dựng header **EOT v1 không nén** (`Flags=0`, magic `0x504C`), nối nguyên vẹn sfnt gốc phía sau.
- `lib/pptx-zip-fonts.ts` (mới) — mở lại .pptx sau khi pptxgenjs xuất, chèn đủ **4 mảnh** (thiếu content-type là PowerPoint đòi "repair" — đúng lỗi pandoc #11492), cấp `rId` không đụng id pptxgenjs đã dùng. Đặt `<p:embeddedFontLst>` ngay sau `<p:notesSz/>` vì thứ tự con của `<p:presentation>` theo ECMA-376 là bắt buộc.
- `lib/pptx.ts` — thêm `embedFonts` + `fontFaces` theo vai trò chữ; thôi dùng `writeFile()` (nó tải xuống luôn, không chen vào giữa được) → `write({outputType:'arraybuffer'})` → chèn font → tự tải. Trả `PptxExportResult` để UI báo font nào nhúng được/bị bỏ.
- `lib/present-editor/export.ts` — chỉ gom font ĐANG DÙNG ở nhánh text-editable (không nhúng cả `deck.customFonts`, càng không nhúng thư viện máy).
- **Bí danh → tên họ thật.** App đặt tên riêng cho mỗi font tải lên (vd `Georgia-0eht`) để `@font-face` không đụng nhau; nhưng PowerPoint ghép font nhúng với chữ bằng tên họ nằm TRONG file font. Ghi bí danh vào XML là font nhúng thành vô dụng — nên cả `<p:embeddedFont>` lẫn `fontFace` từng đoạn chữ đều đổi sang tên thật (`realFamilyName`).
- **Giấy phép font.** Đọc cờ `fsType` (OS/2): `0x0002` Restricted → **từ chối nhúng**, kèm lý do tiếng Việt (restricted thắng cả khi đi kèm bit khác). Preview&Print / Editable / Installable → cho nhúng, có ghi nhận mức quyền. WOFF/WOFF2 (đã nén) và TTC cũng từ chối kèm lý do. Font lỗi chỉ bị BỎ QUA — file .pptx vẫn xuất được.
- UI: gỡ cảnh báo cũ "PPTX chỉ ghi tên font"; toast báo số font đã nhúng hoặc lý do bỏ qua.

**🐛 Bug nền phải sửa vì nó chặn tính năng này.** `useEditor.update()` clone `state.deck` bắt được lúc render ⇒ gọi 2 lần trong CÙNG một tick thì lần dispatch sau ghi đè lần trước. Tải font lên gọi liên tiếp `onAddDeckFont()` rồi `onUpdateSelected()`, nên `customFonts` vừa ghi bị xoá sạch — **tầng "nhúng font theo deck" thực ra chưa bao giờ chạy** (đã xác nhận trên máy: `deckCustomFonts === undefined` sau khi tải font). Nay clone TRONG reducer (action `mutate`), luôn dựa trên state mới nhất; gỡ 2 action `commit`/`live` thành ra chết.

**Verify.** tsc 0 lỗi · test mới 30 + 29 assertion (dùng font thật của macOS, chỉ đọc) · 19/19 suite `lib/present-editor/` vẫn pass · **xuất PPTX thật qua `/present-editor`** (127.0.0.1:4094) rồi giải nén: có `ppt/fonts/font1.fntdata` 379.762 byte (magic EOT `0x504C` đúng offset 34), `[Content_Types].xml` khai `application/x-fontdata`, rels `rId15 → fonts/font1.fntdata`, `<p:embeddedFont typeface="Georgia">` khớp `typeface="Georgia"` trong slide1, `unzip -t` sạch. Toast hiện "Đã xuất PowerPoint — nhúng kèm 1 font (Georgia)".

**⚠️ CHƯA verify được:** file chưa mở bằng PowerPoint thật. QuickLook macOS render được file (chứng tỏ gói không hỏng) nhưng **bỏ qua font nhúng** — thử A/B cùng một tên face bịa, bản có nhúng và bản không nhúng render giống hệt nhau, nên KHÔNG dùng làm bằng chứng. Muốn chốt: mở bằng PowerPoint trên máy CHƯA cài font đó. Cũng chưa xử lý bold/italic riêng (chỉ nhúng `<p:regular>`, PowerPoint tự làm giả kiểu).

## 20/07 — Đổi tên hiển thị 3 chặng (nhánh `feat/stage-rename`)
Bộ nhãn cũ **Layout CAD · Render · Present** lệch từ loại (danh từ / động-danh / động từ) → chốt bộ mới cùng dạng V-ing: **Drafting CAD · Rendering · Presenting**. Chặng 1 giữ chữ "CAD" làm từ neo cho người dùng Việt trong nghề (bản đầu là "Drafting" trơn, user thấy khó nhận). CỐ Ý KHÔNG dùng "3D Rendering" — chặng 2 không dựng 3D, chỉ AI hoá ảnh clay/sketch.
- **Nguồn nhãn**: `lib/phases.ts` — `label` của 3 phase + `blurb` chặng 1. Nhãn micro (`01 · DRAFTING CAD`) và tooltip pill trong `StageSwitcher.tsx` đọc thẳng từ `PHASES` nên tự khớp, không hardcode.
- **Chuỗi hiển thị khác**: nút chuyển chặng CAD ("Đưa sang Rendering" / "Đưa sang Presenting") + tooltip đi kèm (`CadEditor.tsx`); tooltip Nhập/Xuất 3 chặng (`CadEditor.tsx`, `RenderIOMenus.tsx`, `present-editor/Toolbar.tsx`); `NodeExtras.tsx` ("Đưa sang Presenting →" + toast đã gửi); `ReferencePane.tsx`; `StagePresetPanel.tsx`; `PresentDeck.tsx` (empty state, "Present mode" → "trình chiếu"); `entry/SmartTour.tsx` (song ngữ); tiêu đề PDF export CAD; `lib/present-demo.ts`, `lib/report-deck.ts`.
- **KHÔNG đổi (định danh nội bộ)**: `type Phase = 'concept' | 'render' | 'present'` và mọi id (`id: 'concept'` của chặng 1 giữ nguyên theo comment sẵn có); khoá localStorage `interiorflow.workspace` + giá trị của nó, `interiorflow.cad.mode`, khoá resume/stageDone; route `/cad-editor` `/present-editor`; tên file/component/hàm; `DemoKind`; `STAGE_TINT`/`STAGE_INDEX`; trường DB/Prisma. Nhãn ảnh bìa login `"Render · 3D"` (`entry/cardFaces.tsx`) giữ nguyên — mô tả thể loại ảnh, không phải tên chặng.
- **Verify**: `npx tsc --noEmit` 0 lỗi · 61/61 file test pass · browser `127.0.0.1:4095` `/cad-editor` + `/present-editor`: pill 3 chặng đúng, nhãn micro đúng, nút/tooltip đúng, `localStorage.interiorflow.workspace` vẫn nhận `concept`/`render`/`present` như cũ.

## 17/07 — PS-4 (Present) — Đa khổ 16:9/A4/A3 + reflow + export (nhánh `feat/present-ps4-multi-format`)
Gộp 2 nguồn stage-size cũ (`standards.ts` vs `render.ts`) về 1 nguồn duy nhất `lib/present-editor/stage-presets.ts` (`STAGE_PRESETS`/`stageFor()`); `render.ts`/`export.ts` nhận W/H qua tham số (mặc định 16:9 = KHÔNG đổi hành vi cũ). 5 preset đúng tỉ lệ ISO 216 (A3 = A4 × √2, gấp đôi diện tích). `model.ts` thêm `deck.stagePreset?` (optional, an toàn ngược). `reflow.ts` (mới) — dàn lại compact (KHÔNG AI) tiêu đề/kicker/ảnh/thân bài theo hướng khổ mới, tái dùng `region-layout.ts`; KHÔNG BAO GIỜ xoá phần tử, chỉ đổi frame. UI: nút "Khổ trình bày" (Toolbar) → `StagePresetPanel.tsx`, nhãn bắt buộc "màn hình/chiếu", không hứa in 300dpi. PDF/PNG theo đúng khổ; **PPTX luôn giữ 16:9** (quyết định phạm vi — `lib/pptx.ts` định vị bằng inch tuyệt đối, đổi khổ dọc sẽ lệch nặng, ngoài phạm vi PS-4). Verify: tsc 0 · 45/45 test (stage-presets 42 ok, reflow 23 ok) · browser tuần tự (account test riêng, SQLite riêng đã xoá): reflow đúng (đo DOM %), PDF MediaBox đúng tỉ lệ, 16:9 export khớp y hệt cũ, 0 lỗi console. Nợ nhỏ: moodboard nhiều ảnh+caption riêng → dồn caption thành danh sách dọc (không mất chữ, chưa pixel-perfect).

## 17/07 — PS-2 (Present) — "Lưu slide này thành template" (nhánh `feat/present-ps2-templates`)
Gap B.8/B.9 (IF-PRESENT-SPRINT-PLAN mục PS-2): người dùng tự lưu 1 slide đã dàn thành template dùng lại, gom vào picker nhóm "Của tôi". KHÔNG làm hệ component/variant/props sống kiểu Figma (liên kết instance để PS-3) — chỉ snapshot→build(ctx) tham số hoá, đúng shape với `BUILTIN_TEMPLATES`.
- **`lib/present-editor/custom-templates.ts` (mới)**: `CustomTemplate` = slide đã chụp (nguyên khung %) + palette lúc chụp + thumb (dataURL render sẵn). Persist localStorage `interiorflow.customTemplates` — copy ĐÚNG pattern read/write JSON của `brand-kit.ts`/`custom-fonts.ts` (guard `typeof window`, im lặng khi lỗi). `buildFromCustomTemplate(ct, ctx)`: text role title/kicker/body ghi đè bằng ctx khi có (giữ nguyên khi không, cùng quy ước BUILTIN_TEMPLATES); mọi image element + backgroundImage (slot cuối) lấy theo thứ tự từ `ctx.images` (tái dùng `imgAt` — mới export từ `templates.ts`) hoặc giữ ảnh đã chụp nếu ctx rỗng; màu nhuộm lại bằng `remapSlideColors`/`paletteRoles` (theme-roles.ts, TÁI DÙNG máy Brand Kit PS-1 — không viết lại thuật toán) từ palette lúc chụp sang `ctx.palette` hiện hành, nên áp template cũ vào deck đang mang Brand Kit khác tự nhuộm theo brand mới. `toEditorTemplate(ct)` bọc thành `EditorTemplate` nhóm `'mine'` — cắm thẳng vào `onApplyTemplate` sẵn có, không cần nhánh xử lý riêng.
- **`templates.ts`**: `EditorTemplate.group` thêm `'mine'`; export `imgAt()` (trước private) để custom-templates.ts tái dùng.
- **`LayoutShelf.tsx`**: nút "Lưu mẫu" (cạnh "Tạo") mở form đặt tên inline (Enter/nút ✓ xác nhận, X huỷ) → render preview thật (`renderEditorSlide`) rồi `saveCustomTemplate`. Section "Của tôi" (sau 4 kệ, trước "Từ thư viện Reference") — mỗi thẻ có nút xoá (Trash2) riêng, không dùng chung nút Nhận/Bỏ/biến-thể của builtin. Prop mới `activeSlide` (từ `PresentEditor.tsx: ed.slide`).
- **`TemplatePicker.tsx`**: thêm section "Của tôi" lọc `t.group === 'mine'` — đồng bộ type/pattern dù component này hiện KHÔNG được mount ở đâu (chỉ `LayoutShelf.tsx` sống trong `PresentEditor.tsx`); giữ cho không lệch nếu sau này dùng lại.
- **Test mới `custom-templates.test.ts`** (31 assertion, pure-function, không DOM/localStorage mock cần thiết): ctx rỗng giữ nguyên nội dung/ảnh/khung %; ctx có nội dung → fill đúng slot + kicker viết hoa + body nối bullet (khớp `textBlocks()`); ảnh vòng lại đúng modulo khi ctx ít ảnh hơn slot; nhuộm màu đúng vai trò khi đổi palette; `toEditorTemplate` bọc đúng group/id/build.
- **Verify**: `npx tsc --noEmit` 0 lỗi. Toàn bộ 44 file `*.test.ts` (thêm 1) chạy qua `sucrase-node` — 0 fail (custom-templates.test.ts 31/31). Browser thật (dev server riêng port 4042, `.claude/launch.json` + registry chung `~/Downloads/.claude/launch.json` thêm entry `ps2-4042`, route `/present-editor` không cần auth — standalone dev route với sample deck): gõ nội dung → Generate → mở tab Mẫu → bấm "Lưu mẫu" → đặt tên "Bìa concept PS-2" → xác nhận → mục "CỦA TÔI" hiện ngay với thumbnail render thật khớp slide đã chụp. Reload trang lần 1: xác nhận "Của tôi" còn nguyên (localStorage sống qua reload). Lần thử reload thứ 2 để test thêm bị chặn bởi `window.confirm` gốc của flow Generate (hỏi Thay/Nối khi deck đã có slide — hành vi CŨ, không liên quan PS-2) — an toàn trình duyệt tự dừng tương tác thay vì tự bấm OK hộ, không phải lỗi code; đã dừng kịp thời, tắt server sạch.
- **Scope call không có trong spec gốc**: (1) không dựng UI đặt tên bằng `window.prompt` (dù `Dashboard.tsx`/`CadCanvas.tsx` có tiền lệ) mà dùng input inline — khớp gu quiet-luxury/`BrandKitPanel.tsx` hơn; (2) đồng bộ `TemplatePicker.tsx` dù đang là dead code — theo đúng yêu cầu "matching existing patterns in TemplatePicker.tsx" trong brief; (3) backgroundImage coi là 1 "ô ảnh" slot cuối cùng (sau mọi image element) — suy từ cách `onApplyTemplate` gom `ctx.images` (element trước, backgroundImage sau) khi trích xuất từ slide nguồn, giữ nhất quán 1 chiều.
## 17/07 — PS-1 (Present) chi tiết đầy đủ (STATUS.md chỉ giữ 1 dòng tóm tắt)
PS-1 Brand Kit bền vững + áp lại theme cả deck + logo/watermark (`db08340`, đóng G.5/G.6/G.7):
`lib/present-editor/brand-kit.ts` persist localStorage (pattern custom-fonts, 1–vài brand PHẲNG,
KHÔNG kiểu Canva) — deck MỚI tự nạp (PresentSheets.blankDeck→seedDeckWithBrandKit). `theme-roles.ts`
**rethemeDeck**: nhuộm lại MỌI slide theo VAI TRÒ màu (dark/light/accent/muted gần-nhất), xử lý đúng
nền tối LẪN sáng (không đảo tương phản), KHÔNG find-replace hex; templates.pal() nay gọi
paletteRoles (1 nguồn). `model.ts` **deck.watermark** cấp deck (render.ts+export+SlidePlayer+
EditorCanvas overlay). UI: `BrandKitPanel.tsx` + nút "Nhận diện" (Toolbar). Verify: tsc 0 · 43/43
test (2 mới: theme-roles 25 ok, brand-kit 13 ok) · browser 127.0.0.1 tuần tự account riêng: nhuộm
lại đúng slide tối+sáng, watermark mọi slide+toggle, deck mới auto-load kit (palette+logo). 0 lỗi
console mới.

## 16-18/07 — Sprint 6, 7, 8
- **Sprint 6 — MEP sơ cấp** (nhóm E: 0%→phần lớn): đèn+ổ cắm (`lib/cad/mep.ts` 5 BlockDef, nhóm mới `'Điện'`), `mep-suggest.ts` (lux→số đèn dùng số liệu `vn-lighting.ts` có sẵn, rải đèn đều, vị trí công tắc/ổ cắm, nhóm mạch, AC cách đầu giường — chỉ đề xuất, user bấm Apply mới chèn). Rule TCVN 9206:2012 thật (`vn-electrical.ts`, 2-4 ổ cắm/phòng, nối đo thật vào checker). Hộp gen (D2.3-5) BỎ QUA — không có quy ước DXF thật, tránh bịa logic an toàn thi công. Verify browser: đặt đèn/ổ cắm qua Apply, Kiểm chuẩn ra đúng 3 cảnh báo mật độ ổ cắm.
- **Sprint 7 — Export nâng cao**: CAD PDF vector (`pdf.ts`, vẽ lại Entity bằng API hình học jsPDF — KHÔNG raster; jsPDF 4.2.1 không có OCG nên layer PDF không ẩn/hiện lại được, đã ghi rõ giới hạn). `.idf` save/load (`idf.ts`, JSON versioned toàn bộ sheet, verify round-trip 117 entity khớp). Markup overlay (`markup.ts`, ghim ghi chú riêng field `Doc.markups`). Photo embed (`Doc.photos`, upload+gắn ảnh, lightbox xem full). Share link/PWA đã có sẵn — không làm lại.
- **Sprint 8 — Template/Title block/Fix suggestion**: Layer manager xác nhận ĐÃ CÓ SẴN — không làm lại. Title block UI (hàm `titleBlock()` đã có sẵn trong `commands.ts`, chỉ thêm form nhập project/scale/author/date). 2 template mới Văn phòng+Khách sạn (`templates.ts`, cùng pattern `demo-plan.ts`). Fix suggestion thật (`fix-suggest.ts`) — gợi ý mm cụ thể cho vi phạm diện tích/hành lang (vd "kéo tường ra ~255mm"), chỉ hiện text cạnh violation trong panel Kiểm chuẩn, KHÔNG tự sửa entity — verify số khớp chính xác với test tự động.


## 16-17/07 — Verify UI Render/Present + text-toolbar-ux + Sprint 4 + Sprint 5
- **16/07 verify UI chặng Render** (tài khoản test `integrator@ttt.vn`, port 3940, KHÔNG đụng flow thật): 6 node render-v2 hiện đúng tên trong Node Library. Chạy thật node "Tạo ảnh" (NVIDIA NIM flux.1-dev) + "Góc máy ảnh" (tất định) → badge `_tier` đúng màu (tím AI/lục tất định). Cmd+G group: store tạo group đúng (`groupSelected` `lib/store.ts:831`) nhưng overlay KHÔNG hiện (xem STATUS.md Nợ kỹ thuật — GroupOverlay thiếu ViewportPortal).
- **Kiểm tra "1/5" ở Present**: KHÔNG phải bug — số sheet đang dùng/MAX_SHEETS=5 (`SheetTabBar.tsx:212`, `PresentSheets.tsx:38`), không liên quan số slide. Verify: bấm thêm trang → "2/5" đúng. Audit trước hiểu nhầm.
- **merge `fix/text-toolbar-clip-and-deselect`**: TextToolbar hết bị cắt (overlay riêng ngoài `overflow:hidden` của stage, + clamp theo viewport browser thật qua `getBoundingClientRect`+`ResizeObserver` phản ứng đúng khi zoom) + click-ra-ngoài tự bỏ chọn (global pointerdown passive, không preventDefault) + kính mờ tối (blur 28px, nền đen alpha .62). Panel trái (Mẫu/Reference/Motion)/phải (Lớp) resize (splitter kéo-thả + localStorage nhớ độ rộng) + ẩn/hiện (tham khảo Photoshop collapse-to-icons/Canva). Zoom in/out canvas (nút +/-, %, Ctrl/Cmd+lăn chuột, Ctrl/Cmd+0 reset Fit — chuẩn Figma/Photoshop). Agent bị ngắt giữa chừng do hết session limit (không phải quên) — 424 dòng chưa commit được phát hiện+verify+commit thủ công thay vì mất.
- **merge Sprint 4** (`lib/cad/`): Ctrl+C/Ctrl+V copy-paste nội bộ (`pasteEntities`/`clipboard` state, khác tool Copy kiểu AutoCAD đã có) — verify 117→118 entity, offset +20/+20. Auto-label phòng thật (`room-autolabel.ts`) — đề xuất tên từ đồ nội thất khi CHƯA có nhãn, chỉ áp khi bấm Apply; badge Total GFA + đếm phòng theo loại ở status bar. Agent tự tìm+sửa 1 bug thật (nhãn "HÀNH LANG" giả từ khe hẹp quanh khung cửa — loại nhóm `Kiến trúc` khỏi pick-point). Multi-select rubber-band + Move/Rotate/Mirror/Copy kiểu AutoCAD xác nhận ĐÃ CÓ SẴN — không làm lại.
- **merge Sprint 5**: Material palette (`lib/cad/materials.ts`, 13 preset gạch/gỗ/đá/sơn, swatch CSS/pattern vì chưa có ảnh thật — ghi rõ trong code để thay sau) nối vào Hatch qua `applyMaterial()`. Circle 3-điểm (`circumcircle()` — refactor dùng chung với Arc 3-điểm cũ, gọn code) + Arc tâm+góc (`arcFromCenterStartEnd()`, quy ước Center/Start/End kiểu AutoCAD). 20 test mới, verify bằng toạ độ tính tay khớp chính xác.


## 16/07 — BUG GroupOverlay vô hình (Render canvas Cmd+G), chi tiết kỹ thuật
`components/nodes/GroupOverlay.tsx` + `FlowCanvas.tsx:305`: `<GroupOverlay />` render là sibling của `<ReactFlow>` (không bọc `ViewportPortal`), dùng thẳng `node.position` (toạ độ flow-space) làm CSS `left/top` — KHÔNG cộng transform pan/zoom hiện tại của viewport, nên khung/label/nút collapse-rename-ungroup lệch vị trí thật. Thêm nữa `zIndex: -1` khiến nó luôn nằm SAU nền canvas (wrapper cha có `position: relative` → tạo stacking context riêng) → hoàn toàn không thấy được dù DOM vẫn có element + state group vẫn tạo đúng (confirm qua `window.__flowStore`). Cần: bọc bằng `ViewportPortal` (hoặc tự áp transform từ `useViewport()`) + bỏ `zIndex:-1`.

## 15/07 — Sprint 3 B1+B2 Shape Library + tương tác
3 agent song song A/B/C theo `SHAPE-SCHEMA.md`, merge tuần tự A→B→C vào `feat/present-layout-ml-p1`, verify tsc+test sau mỗi merge, PASS cả 3.
- **B1 (41 shape, từ 18 gốc)**: `lib/cad/furniture.ts` — phòng ngủ (tủ đầu giường, bàn trang điểm), phòng khách (sofa góc, bàn trà, kệ TV), bếp (tủ lạnh, đảo bếp, hút mùi, lò vi sóng), tắm (vòi sen, gương), văn phòng (ghế, tủ hồ sơ, kệ sách), 3 loại cửa mới + 2 loại cửa sổ, cầu thang thẳng/chữ L (nhóm mới `Cầu thang`), máy lạnh/quạt trần (nhóm mới `Thiết bị`). Cầu thang xoắn BỎ QUA (Prim không vẽ được đường xoắn thật).
- **B2 (8/8 xong)**: drag-drop từ palette, auto-snap tường, resize góc, info panel, variant switch, collision (SAT), clearance overlay, search — file mới `lib/cad/shape-interactions.ts`, `components/ShapePalette.tsx`.
- **Schema chung**: `lib/cad/shared-types.ts` — tách 5 type (`BlockGroup/ShapeVariant/SnapAnchor/ClearanceZone/ShapeMeta`) ra khỏi `furniture.ts` sau khi 3 agent song song tự trùng định nghĩa gây conflict merge 2 lần liên tiếp. Quy tắc rút ra: tách schema chung + commit trước, agent chỉ import từ file chung, không tự định nghĩa lại.
- **Test**: 634 test (29 file `*.test.ts` qua `sucrase-node`) PASS 0 fail, tsc 0 lỗi.
- ⚠️ Bài học quy trình: 2/3 agent (Agent C, và trước đó agent merge QA-stress) LÀM XONG việc nhưng QUÊN COMMIT trước khi báo done — chỉ phát hiện lúc merge thấy branch không đổi HEAD. Từ đó: agent phải tự xác nhận `git log -1` trước khi báo cáo.
- ⚠️ Phát hiện khi verify: dòng "170 test mới" ghi trước đây cho `feat/sprint3-qa-stress` là SAI — thực tế merge chỉ có 42 test (`stress-auth.test.ts`), 4 file stress test khác đã mất do agent quên commit.

## 15/07 — 4 nhánh merge trước Sprint 3 (nhánh tích hợp `feat/present-layout-ml-p1`)
- **`feat/render-nodes-v2`**: 7 node chặng Render (`lib/nodes/defs/render-v2.ts`) — text2image, ID-mask, furniture-extract, cad2fbx (import FBX), local-edit, camera, nền cad-to-obj. Kiến trúc 2 tầng Cloud AI (khi có key) / lõi tất định (khi không), mọi node ghi `_tier` + badge UI. Adapter NVIDIA `generateImage()` dùng model `black-forest-labs/flux.1-dev` (SD3/SDXL trả 404 cho account free) + route `/api/render/nvidia-image`. Probe fal (`scripts/probe-fal.ts`) — fal hết balance. Blender OBJ→FBX (`scripts/blender/obj2fbx.py` + route `/api/render/fbx`, verify Blender 4.5 local OK; máy không có Blender → 501 kèm hướng dẫn). 110 test mới. Verify độc lập: tsc 0, 25/25 test file, smoke browser 127.0.0.1:3700 OK.
- **`feat/ai-local-ollama`**: tầng AI local Ollama chữ (mô tả/concept/tóm tắt, KHÔNG ảnh) — `lib/ai/providers/ollama.ts` + `lib/ai/text-tier.ts` (completeTextTiered Cloud→Ollama→lõi, kèm `_tier`/`_model`). Model mặc định llama3, override `OLLAMA_MODEL`. 36 test mới, ff merge, tsc 0.
- **`feat/render-ux-overhaul`**: đại tu UX canvas chặng Render — màu edge theo loại data (image/data/mask), node grouping (Cmd+G, collapse/rename/ungroup, undo), 35+ icon SVG flat inline, font mono cho label node. 543 test pass, tsc 0.
- **`feat/deploy-vercel-supabase`**: audit deploy readiness — `next build` PASS (31 static + 24 API route), liệt kê toàn bộ env var cần cho Vercel, xác nhận migration drift IntegrationAccount dùng `db push` an toàn, phát hiện `AUTH_SECRET` có fallback `dev-secret-change-me` cần set env thật. Output `DEPLOY-CHECKLIST.md`.
- **`feat/sprint3-qa-stress`**: fix P1 auth bypass (email nhiều `@` bypass domain check, `lib/server/auth-policy.ts:17`) + `stress-auth.test.ts` 42 test. ⚠️ 4 file stress test khác (CAD/render/present/concurrency, ~128 test) agent từng báo tạo nhưng KHÔNG được commit trước khi worktree xoá — mất, không khôi phục được. Bài học: agent phải `git log -1` xác nhận đã commit trước khi báo done.


## 14/07 — Cổng Sprint 2 PASS (nhánh tích hợp `feat/present-layout-ml-p1`, HEAD `bcbbce1`)
Merge `da49cf3` (ml-ui) → `b70ffa3` (ui-motion) → `bcbbce1` (docs). **492 test/20 file, tsc 0.**
Verify browser (PORT 3700, host 127.0.0.1 tránh cookie phiên thật; admin seed `integrator@ttt.vn`): 7 PASS · 1 SKIP.
1. Login Liquid Glass PASS (backdrop saturate(1.8) blur(40px); 4 preset nền Đêm ấm/Mực đêm/Đá ấm/Lụa sáng + upload; Ghi nhớ; không intro; light+dark).
2. Login → Gallery PASS (register vẫn khoá; seed-admin idempotent).
3. Unified Dock PASS (`.if-dock` kính mờ đồng nhất Header+StudioBar; StageEnter/Veil mượt; 0 lỗi console).
4. /cad-editor PASS (detect "residential (59%) — 1 giường"; checker bắt Bếp 5.7m² < 10m² TCVN 4451:2012 cả với bộ residential).
5. /present-editor PASS (LayoutShelf 21 card + Nhận/Bỏ + tooltip; guardrail toast; Export menu đủ PDF·PPTX·PNG).
6. Nút "Đưa sang Present →" SKIP (cần flow AI render thật tốn credit; code 11/11 test + verify trước đó).
7. FoldableDualPane PASS (`?dualpane=1` ≥840px dual, thu 700px về single giữ state; sheet-persist IDB log 13.6KB).
8. Console PASS (chỉ hydration ⌘Z cũ).

### Sprint 2 chi tiết (3 nhánh, 2 đợt — đợt 1 ngắt session-limit, resume theo danh sách user xác nhận)
- `feat/journey2` (Agent 5): register 403 kể cả DB trống (`scripts/seed-admin.ts` thay bootstrap) · grandfather Google 3 ca (auth-policy 9 test) · **multi-sheet persistence IndexedDB** `userId::route` (lib/sheets-persist.ts, autosave 1.2s, resume.sheetId; đo 15.2KB CAD · 226.5KB deck+ảnh-nhúng) · gallery: upload bìa, member icon owner, >8 flow → grid+search.
- `feat/ml-ui` (Agent 1): perceptron feedback UI tại LayoutShelf (lib/gu/feature-dict.ts + Nhận/Bỏ + re-rank ≥10 cặp + tooltip; verify dark-cover 3→1 sau 10 cặp, sống qua reload) · nút "Đưa sang Present →" (NodeExtras → stashPresentHandoff → toast) · lib/cad/gu-features.ts (occupancy 8×8, adjacency, typology 5 nhãn — additive vào classifyOperator) · ROOM_TERMS/subject vào gu.ts.
- `feat/ui-motion` (Agent 2, bị user dừng ở bước verify → integrator verify hộ): Liquid Glass + LoginBackdrop + StageTransition (wallpaper/veil) + Unified Dock + FoldableDualPane.
- ⚠️ Sự cố 13/07 (ĐÃ SỬA): agent verify ghi đè graph flow "Render test" trên dev.db → restore từ FlowVersion snapshot 11/07, bản-bị-đè giữ version 4. Bài học: browser pane + cookie localhost dùng chung → verify TUẦN TỰ.

## 13/07 — Cổng Sprint 1 PASS (`bb31fbf`, 413 test/17 file)
- `feat/ml-p1-hooks` (Agent 1): hết dead-code ML pha 1 (21 caller) — operator vào LayoutSpec + panel Kiểm chuẩn explainable · gu.ts mergePalette→LAB + moods + prompt · detectRegions trả gutter → suggestTemplate · bridge Render→Present (lib/present-editor/handoff.ts) · lib/gu/pairwise-perceptron.ts (18 test, degrade <10 cặp).
- `feat/access-journey` (Agent 5): gỡ intro (Login→Gallery) · Remember-Me (cookie phiên vs 30d) · chính sách @ttt.vn + khoá register · resume theo user (lib/resume.ts) · SmartTour 4 bước.
- Browser E2E nhánh gộp: LoginScreen mới + operator detect sống; 0 lỗi console mới.

## 12/07 — Nền tảng (trước Sprint mode)
- **Present layout engine** (5 module, khởi từ snippet detectRegions của user): detect-regions (sửa bug findGaps bỏ khe cuối) · standards.ts DECK_STANDARDS (chuẩn định lượng từ agent nghiên cứu Gamma/Canva/Figma) · layout-check (guardrail trống/chật/tràn, toast cắm PresentEditor) · region-layout (lưới→slide gán vai trò, kẹp budget) · reference-layout (ảnh mẫu→deck, augment).
- **ML Gu pha 1 tất định** (3 module): operator-profile (block×room×text) · color-psychology (LAB+ΔE+tâm-lý-màu) · grid-geometry (gutterBands+patternIconHint). Đề xuất đầy đủ: docs/ML-GU-ENGINE-PROPOSAL.md.
- **3 nhánh nghiên cứu**: autolayout-refine (kẹp 21 ô + min-max) · PCCC/Neufert (QCVN 06:2022/SĐ1:2023 + NFPA/IBC + neufert.ts, standards-intl 22 test) · multi-sheet (≤5 sheet CAD+Present + LOGIC-AUDIT.md).
- **Sprint 0**: audit fixes A1 (pill Present) B1 (handoff mất node) C1 (stageDone theo user) merged `d9070d2`.
- **DIAGNOSIS.md**: khám toàn repo (10 route 200; xuất PDF/PPTX/PNG/DXF thật; mock khi thiếu key; drift IntegrationAccount).
- Sự cố flow "Render test" + khôi phục: xem mục 14/07.

## Trước 12/07
Xem git log (`fd4718d` fix hatch T-junction · `c9b3961` type-anywhere · các merge trước đó) — main/origin đứng ở `3265db1`.

## 18/07 — "đợt mở rộng" + PS-2..PS-7
- 9 nhánh merge vào `feat/present-layout-ml-p1` (`0a734e5`): Brand Kit tiêu đề vô hình · cầu nối CAD→Present (`lib/cad/present-handoff.ts`) · toast Export · bỏ `window.prompt` Dashboard + sửa doc CAD-ROADMAP · viết lại 4 stress test (edgecase-stress, 59 file) · smart guide kéo + căn chỉnh/phân bố multi-select (`lib/present-editor/align.ts`) · Format Painter + bảng màu chữ nhanh · PS-3 linked-asset nối id ổn định Render (`render:<nodeId>[:index]`) · Slide Sorter · Animation Pane theo object (SlidePlayer đổi từ raster sang render DOM thật). Verify: tsc 0 · 59/59 test PASS · browser xác nhận. Merge main + push (`9cc1301`). Bug slider "Chỉnh màu" xác nhận KHÔNG PHẢI bug thật (3 lần verify).
- 5 nhánh merge tiếp rồi push (`1ce8674`): fix GroupOverlay vô hình · lưu template tự tạo PS-2 · round-trip photo-editor↔slide + linked-asset PS-3 · đa khổ A4/A3+reflow+export PS-4 · phím tắt Photoshop PS-7.
- Gate PS-5/PS-6 (share deck khách + comment): chủ dự án chọn DỪNG.
- Trước đó: PS-1 Brand Kit (`db08340`), E1.2 swatch vật liệu, DWG mở trong app, PS-0 audit, Sprint 9+10 toggle Sketch↔Pro.
- NVIDIA_API_KEY có, probe 200. fal hết balance chờ nạp.
- Backlog cũ chưa làm: hardcode 'DETECH·CONCEPT' · template tĩnh · heavy-ML pha 2 · membership per-flow.

## 19/07 — Audit tương tác chuột/bàn phím/cảm ứng + đợt fix lớn
4 agent audit song song 3 chặng CAD/Render/Present+Login+Gallery (mỗi agent 1 host riêng: localhost/127.0.0.1/[::1]/IP LAN — tránh đụng cookie/IndexedDB). Đã sửa + merge hết vào `feat/present-layout-ml-p1`:
- Hydration tooltip CadToolbar/PhotoToolbar (`988e0e0`) · CAD Room tool window.prompt chặn thread (`0c294cd`) · demo render thanh tím đè nhãn (hatch SOLID force-highlight tô đặc, thêm `DrawStyle.outlineOnly`) · CAD Backspace không xoá được đối tượng (`e8994a1`).
- Màu layer Tường `#e8e4dc` trùng nền → `#47423a` · handle xoay Present (frame stale trong `onPointerUp`, vá luôn move/resize) · Enter toàn cục Gallery (guard e.target) · groups Render không lưu (`groups` vào `graphJson` + auto-unhide node mồ côi) · Escape mất nét vẽ Mask/Annotate (cờ dirty + banner) · hydration `Tooltip.tsx` (mounted-gate) · tab-order Login · card carousel roving tabindex. Merge `977f32d`.
- CAD→Render văng đăng nhập: `/` gọi `/api/auth/me` 2 lần do StrictMode thiếu ref-guard, đã thêm guard (`dd60a8c`) — chưa chắc hết root cause (CAD không check session, có thể session hết hạn từ trước mà không biết).
- Sạch 100% `window.prompt`/`confirm` trong `components/cad/` → form/confirm nổi (Text/Markup/Array/Scale/Divide/Mở demo/Mẫu dự án/Mở .idf/AI mô tả). Escape ô lệnh xoá ký tự gõ dở, status hint đủ Backspace.
- **Login v2 + minimal**: đăng ký/đăng nhập mọi domain (bỏ giới hạn @ttt.vn), Google mở, Microsoft OAuth mới (Entra ID, chờ Azure app), toggle xem mật khẩu, card kính lỏng tối giản, logo IF monogram mới (`IFLogo.tsx`, 3 phương án, dùng B/`framed`), dynamic wallpaper 30 ảnh TTT mặc định slideshow.
- Dọn `launch.json` ~25 entry worktree chết, chỉ giữ server thật.

## 19/07 khuya — Tương phản thích ứng · logo IF · gốc bug văng đăng nhập
- **Gốc bug "CAD→Render văng màn đăng nhập"** (user than phiền nhiều ngày): cookie định danh theo HOST không theo PORT → dev server worktree của agent (`localhost:4xxx`, KHÔNG có `.env` nên thiếu `AUTH_SECRET`/`DATABASE_URL`) dùng chung lọ cookie với server thật `localhost:3000`; `DELETE /api/auth/me` ở server worktree phát `Set-Cookie: if_session=; Expires=1970` → xoá phiên thật. Chặng CAD không kiểm tra phiên nên user vẫn vẽ bình thường, bấm Render là thao tác duy nhất quay về `/` có check phiên → lộ ra. Bằng chứng: đo trực tiếp 3 cổng (3000 khoẻ 200, 4090/4091 401 + phát cookie xoá), `MAX(lastSeenAt)` toàn bảng User dừng ở 18/07 17:56. Fix: cookie cách ly `if_session_noenv` khi thiếu `AUTH_SECRET` · `getSession()` phân biệt anonymous/stale/error (DB lỗi → 503 GIỮ phiên thay vì đá về login) · xoá cookie chết + trả `reason` hiển thị lý do · `SessionWatch` ở StudioBar cảnh báo mất phiên ngay tại 3 chặng · `AUTH_SECRET` rỗng rơi về fallback (`||` thay `??`).
- **Tương phản thích ứng** `lib/adaptive-contrast.ts` + `components/ui/AdaptiveContrast.tsx`: 2 tầng chung một `ContrastPlan` — tầng đo (canvas 48×48 → `getImageData` → luminance trung bình + độ "rối"; cache, chỉ tính lại khi ảnh đổi) và tầng CSS thuần khi không đọc được pixel. Cố ý KHÔNG dùng `mix-blend-mode` (ra màu lạ trên render nội thất nhiều màu); dùng scrim gradient tắt dần về alpha 0 + text-shadow bán kính rộng alpha thấp, màu lấy từ thang greige ấm (`#F6F2EA`/`#14110D`), không trắng/đen lạnh, không viền. Có `compositeOver()` gộp lớp `PhotoScrim` sẵn có vào phép đo (không gộp thì ảnh sáng bị đọc nhầm là nền sáng). Áp 4 chỗ: login · caption thẻ Gallery · chữ Present đè ảnh (chỉ thêm scrim+shadow, KHÔNG đè màu chữ user chọn) · nhãn A/B node Render. Phát hiện phụ: `/covers/render_10.jpeg` có dải đáy sáng (lum 0.625) → comment cũ "ảnh cover luôn tối nên chữ trắng an toàn" là sai.
- **Login**: gỡ tít "Bắt đầu dòng chảy của bạn." + dòng phụ, cân lại cụm logo/nhãn. **Logo IF `framed`** đồng bộ Header · trang share · StudioBar.

## 19/07 khuya — Đợt user giao trực tiếp (5 nhánh)
- **Login**: gỡ tít "Bắt đầu dòng chảy của bạn." + dòng phụ, cân lại bố cục. Logo IF `framed` đồng bộ Header · trang share · StudioBar.
- **Toolbar CAD**: 18 nút ngang → 5 menu xổ (Nhập · Xuất · Bắt đầu · Công cụ bản vẽ · Tỉ lệ) + 2 nút chuyển chặng dạt phải. Bug scrollbar thô ở Pro mode: pill nổi `overflowX:auto` làm scrollbar cắt ngang bo góc → `.cad-pill-scroll` ẩn scrollbar + `mask-image` fade 2 mép, chỉ bật khi thật sự tràn (ResizeObserver quan sát CẢ hàng nút bên trong, vì font/icon nạp xong làm nội dung dài ra mà container không đổi size). Thanh file bỏ `overflowX:auto` (scroll container cắt cụt menu xổ) → dùng `flexWrap`.
- **Nhập/Xuất đồng bộ 3 chặng** qua `components/ui/IOMenu.tsx` + `MenuButton.tsx`: cùng cách thể hiện, bấm mới xổ định dạng riêng. CAD nhập DXF/DWG/.idf/ảnh, xuất PNG/DXF/PDF/.idf · Render nhập ảnh→node, xuất PDF/PPTX (⚠️ NĂNG LỰC MỚI ở tầng chặng, trước chỉ có trên node `slide.deck` — chờ user xác nhận) · Present nhập ảnh, xuất PDF/PPTX/PNG. Logic xuất/nhập giữ nguyên 100%; `ExportMenu.tsx` cũ đã xoá.
- **Sketch vs Pro**: Sketch = cảm ứng kiểu ArcSite (nút 44px, icon 19px, công tắc mode 40px, bỏ phím tắt khỏi tag hover) + `CadTouchDock` 6 nút — Ortho(F8) · Số liệu(F12) · Lệnh(type-anywhere) · Kéo(Space) · Xong(Enter) · Huỷ(Esc). Nút KHÔNG chép logic mà phát lại phím qua `cad:synth-key` → CadCanvas gọi thẳng handler `keydown` cũ, chỉ 1 nhánh logic. `orthoLock`/`dynInput` dời từ ref lên store để nút và phím dùng chung trạng thái. Pro = giữ 34px, tag hover kèm phím tắt ("Line · L"), ẩn dock.
- **Chuyển chặng**: `StageVeil` chỉ hiện sau 400ms (prefetch xong ~150ms, nhá chữ rồi tắt còn khó chịu hơn) + prefetch `/present-editor`. Phân định chặng: `STAGE_TINT` hairline đáy thanh đầu + chấm 4px trên pill + nhãn micro `01 · LAYOUT CAD` (ẩn <1100px). Không đổi `--accent` chung.
- **Present typography**: font tải từ máy — 2 tầng (nhúng theo deck qua `EditorDeck.customFonts` để mở lại còn + thư viện IDB máy để tái dùng). THAY bản localStorage cũ (base64 phình 33%, vỡ trần ~5MB và nuốt `QuotaExceededError` im lặng). Validate bằng magic-number 4 byte (`OTTO`/`wOFF`/`wOF2`/`0x00010000`) chứ không tin đuôi file, cap 8MB, lỗi báo tiếng Việt. Cố ý KHÔNG upload font lên server (bản quyền + shared uploads phát tán cho mọi user). `TextFx` 8 preset + tinh chỉnh sâu (word-spacing, stroke, outline-only, bóng nhiều lớp, gradient, hoa-thường, blend, uốn cung), math dùng chung `lib/present-editor/text-fx.ts` cho DOM + canvas; đơn vị `cqh` nên thumbnail 150px và export 1920px ra cùng ảnh. Test khoá độ tiết chế: không preset nào vượt 2% blur / 0.2% stroke.
- **Lỗi chữ ở dải thumbnail**: KHÔNG phải lỗi font/scale — `SlideStrip.tsx` chưa bao giờ vẽ chữ, nó cố ý vẽ `height:3, background:currentColor, opacity:0.5` làm skeleton từ đầu (thanh thừa hưởng màu chữ nên slide khác nhau ra màu khác nhau, đúng như ảnh user chụp). Nay dựng bằng chính `Inner` của `Element.tsx` trong hộp `containerType:'size'`.
- **Cách ly cookie tầng 2**: app tự nhận biết chạy từ git worktree (`.git` là FILE, repo chính là THƯ MỤC) → dùng cookie `if_session_wt`. Lớp cũ (`if_session_noenv`) chỉ chặn khi THIẾU `AUTH_SECRET`; copy `.env` sang worktree là trùng secret → cookie thật lại validate được → vẫn xoá đè được phiên thật. Repo chính giữ nguyên `if_session` nên user không bị đăng xuất.

## 20/07 — Tối ưu input + audit chuyển động
**`feat/input-optimization`** — Gốc bug "cuộn chuột không zoom ở Pro mode": thanh công cụ pill (`CadToolbar.tsx`) có `overflow-x:auto` + `maxWidth:calc(100vw-32px)`, nằm đè canvas thành dải kín hết bề ngang (y=136→187). Pro có 55 nút → `scrollWidth−clientWidth = 835px` (tràn thật) → trình duyệt quy `deltaY` thành cuộn NGANG cho phần tử chỉ cuộn được trục ngang → nuốt sự kiện, canvas không nhận. Sketch chỉ 25 nút → tràn 0px → không có gì để cuộn → wheel lọt xuống canvas. Đó là lý do bug CHỈ ở Pro. Kèm 4 lỗi hệ thống: trackpad 2 ngón đang zoom (phải pan) · Rendering lăn chuột chỉ pan không zoom · Firefox `deltaMode=1` (line) không quy đổi → sai cỡ + bị nhận nhầm là trackpad · `preventDefault` vô tác dụng vì React `onWheel` là passive (nay dùng native `{passive:false}`). Gom vào `lib/input/wheel.ts` (phân loại chuột/trackpad/pinch theo `ctrlKey` + `deltaMode` + độ lớn delta + có `deltaX` không; ngưỡng 40px là suy đoán thực dụng, có ghi lý do) + `findScrollableAncestor` nhường đúng trục cho panel. 51 assert. Bàn phím rà xong KHÔNG có lỗi (mọi handler đã bắt `metaKey||ctrlKey`, dùng `e.key` nên bàn phím không numpad vẫn chạy).
**`feat/motion-audit`** — Gốc "chớp" khi chuyển chặng: `StageVeil` nằm TRONG cây React của route bị rời đi → `router.push` unmount route cũ, veil bị huỷ tức thì, `exit` không bao giờ chạy, route mới mount ở opacity 0 → lộ khoảng nền phẳng `var(--bg)`. Fix: `StageTransitionProvider` hoist veil lên root layout để nó sống sót qua điều hướng, chỉ tắt khi đích đã paint; `StageEnter` bỏ fade riêng (1 crossfade thay vì 2). Kèm: layout-shift 2px (StudioBar 46px vs Header `h-12`=48px) · reduced-motion trước chỉ 6/~36 file tôn trọng → `<MotionConfig reducedMotion="user">` phủ hết, CSS cũng chưa từng reset `transition-delay` nên tooltip vẫn chờ 150ms · đổi animate gây layout sang transform (`pe-scan-sweep` animate `top` vô hạn kèm blur 14px; node progress `transition-all`+`width` → `scaleX`; SmartTour spotlight) · thêm exit còn thiếu (Slide Sorter trước đây KHÔNG có motion, cắt phựt) · `lib/usePageVisible.ts` dừng 3 glow khi tab ẩn · thang `DUR` trong `lib/motion.ts` (app đang có 11 thời lượng khác nhau + ~130 class Tailwind `transition-*` mặc định 150ms không khớp token nào).
**Chưa xong:** frame-timing trước/sau chưa đo được (khung trình duyệt tự động báo `visibilityState:hidden` → rAF đóng băng; agent không bịa số) · `nodePop` exit còn trơ vì React Flow sở hữu mount/unmount node · toast còn tự chế ở 4 chỗ không có exit · `MoodboardModal` chưa có motion · `LoginForm` còn animate `height:0↔auto` · `PresentViewer:235` còn transition `width`.

## 20/07 16h — Vá 3 lỗ hổng P0 phát hiện từ nghiên cứu phân quyền
`fix/api-auth-p0`: `/api/comments` trước 0 auth cả 4 method (DELETE?all=1 xoá sạch, POST ghi file từ request vô danh) → nay đòi đăng nhập, `?all=1` thêm đòi `isAdmin`. `/api/dashboard` trước trả `shareToken` (chìa endpoint public `/api/share`) của 12 flow toàn team + email/SĐT mọi user → nay bỏ hẳn khỏi payload, `Dashboard.tsx` đổi sang field `shared` boolean. `/api/cursors` trước không auth + `userId` client tự khai (giả danh được) → nay danh tính lấy từ session. 5 route AI (vision/caption, pdf/extract, present/text, strategy/scenarios, illustration) trước gọi vô danh được (đốt balance thật) → nay đòi đăng nhập. Verify bằng curl thật qua origin cô lập: 8/8 route 401 không cookie, 200 có cookie hợp lệ, dashboard xác nhận hết `shareToken`/`email` trong response, `/api/share` public không bị vạ lây. tsc sạch, 64/64 test.

## 20/07 — login-glass + fix bug "Ghi nhớ đăng nhập" + 2 báo cáo nghiên cứu + 2 tính năng CAD
- **`feat/login-glass`**: kính lỏng `.lq-card` đúng công thức 4 bước (tint ~20% từ ảnh nền · 3 inner-shadow trắng 20% · backdrop blur(22px) saturate(155%)+viền specular · `.lq-content`) + tầng 3 tương phản (`planCardText`) giải ngược 5 bậc chữ token t1..t5, đảm bảo ≥4.5 AA trên toàn dải nền (28 test sucrase-node, quét 30 wallpaper bằng raw luminance qua sharp). SHA `c891df8`.
- **Bug "Ghi nhớ đăng nhập chưa hoạt động"**: checkbox dùng `sr-only` co vùng bấm về đúng 1×1px (kỹ thuật ẩn chuẩn cho screen-reader, quá nhỏ để chuột/ngón tay thật bấm trúng dù forward-click từ `<label>` đúng chuẩn HTML). Server/React logic đã đúng sẵn (verify curl: `remember:false`→cookie phiên không Max-Age, `true`→Max-Age 2592000). Sửa: input `absolute inset-0 opacity-0` phủ kín cả label. SHA `3e12573`.
- **5 báo cáo nghiên cứu trong `docs/`** (chi tiết đọc thẳng từng file — đây chỉ tóm số 1 câu, KHÔNG kèm code):
  - `RESEARCH-ACCESS-CONTROL.md`, `RESEARCH-MOBILE-DISTRIBUTION.md`, `RESEARCH-COMFYUI-LESS.md` — đã có từ trước, chờ user quyết.
  - `RESEARCH-MATERIAL-BRIDGE.md` (mới) — cầu nối Larkbase↔hatch CAD↔Rendering. Gọi thật `mcp__lark-base__list_tables` xác nhận kết nối OK nhưng **sai workspace** (chỉ thấy bảng "Chi tiết công việc"/"Nhân sự", không có bảng vật liệu) → chặn mọi bước sau tới khi user trỏ đúng base (Q1). Kiến trúc đề xuất: `MaterialRef` pull-only mirror + `HatchEntity.materialRefId` + prompt-injection vào `ai.clay2render`/`ai.sketch2render` (M1/M2), segmentation ControlNet hoãn M4.
  - `RESEARCH-TECHNICAL-DRAWING-PIPELINE.md` (mới) — pipeline khung tên/tỉ lệ/PDF in kỹ thuật + cầu nối CAD→Presenting. 🔴 Phát hiện: `titleBlock()` nhận `scale` là CHUỖI GÕ TAY, hoàn toàn không liên hệ hệ số `fitBox()` thật dùng khi xuất PDF — đo thước trên bản in sẽ SAI tỉ lệ đã khai. Đề xuất sửa M0 trước hết (khoá ô gõ tay, thay bằng giá trị tính từ `viewportAtScale()`), sau đó SVG làm định dạng trung gian CAD→Presenting (thay raster 2000px hiện có).
- **`feat/cad-floorplan-demo`**: preset demo thứ 2 `buildDemoPlanApartment74()` trong `lib/cad/demo-plan.ts` (KHÔNG đụng `buildDemoPlan` cũ) — "CĂN HỘ 1" 74m² dãy 5B trục I-F, dựng từ ảnh chụp bản vẽ user gửi (không có file CAD gốc trong repo). 8 phòng, diện tích thông thuỷ đo được 73.89m² (khớp nhãn gốc trong 0.15%). Nối vào picker Bắt đầu→Mẫu dự án. Kiểm chuẩn 8 violation cùng loại demo cũ (không false-positive mới), 0 va chạm nội thất/cửa.
- **`feat/cad-ai-description-v2`**: cải tiến "AI mô tả" — `AiBriefPanel.tsx` (mới) thay ô nhập 1 dòng cũ, thêm textarea đề bài chi tiết nhiều đoạn + input tỉ lệ tuỳ chỉnh (hệ số nhân kích thước phòng đã parse, KHÁC `ScaleMenu`/`titleBlock` scale) + nút "Tạo 3 phương án" (`generateLayoutOptions()` trong `lib/cad/ai-assist.ts`, 3 biến thể đặt nội thất qua `WallVariant` mặc định/đối diện/xoay 90° trong CÙNG 1 hình bao phòng — sinh lại toàn bộ kiến trúc tường khác nhau để dành sprint sau) chạy qua `checkStandards()` (tái dùng, không viết checker mới) + UI Nhận/Bỏ tái dùng đúng pattern `LayoutShelf`/`PairwisePerceptron` (key riêng `lib/cad/ai-layout-feedback.ts`).
- Cả 2 CAD merge + 2 báo cáo merge: tsc sạch, 65/65 test pass sau cùng.

## 21/07 tối — fix-stage-transition (10 commit, đã merge)
Nhánh `feat/fix-stage-transition`: (1) ROOT CAUSE bug chuyển chặng "văng login": `stageDone` init `false` rồi thành `true` async sau `/api/auth/me` ~50-300ms → mỗi lần Home mount lại, giữa khoảng đó rơi vào nhánh `!stageDone` render `ProjectSelect` bên dưới StageVeil → veil kéo ra lộ ProjectSelect chớp nhoáng → dăm ms sau setStageDone(true) → flash sang canvas. Fix: `useState(() => {...})` đọc localStorage đồng bộ init. Test 20 vòng CAD↔Render: 0 lỗi. (2) Lag chặng: veil 280/300→100/140ms + bỏ 1 rAF, cắt 316ms→~155ms p50=175. (3) Deselect element: click ngoài + Esc (data-if-deselect-zone). (4) Rename Vitas→Vitals toàn code + migration localStorage. (5) VitalsIcon logo Siri iOS 27 breathing 3s + onboarding 5s. (6) Vitals GIỌT KÍNH LỎNG v2: SVG teardrop 24×32 bezier, motion 4 lớp (idle breathing + drip hint 8-12s + hover + greeting drip), reminder loop 3s×60s×3. (7) Presenting mount khựng: dynamic import skeleton. (8) Enter Vitals không hijack: `stopImmediatePropagation` native + marker `data-vitals-chat`. (9) Gallery gesture: Home/End + wheel deltaY→X + trackpad 2 ngón. (10) Vitals drag→panel pre-mount opacity 0/pointer-events none khi drag=true (chạy React commit trong lúc user kéo), thay springSheet → tween 220ms easeApple khớp droplet exit 120ms. (11) Intro Sequence 60s + 4 cảnh + 11 SVG (Desk/Monitor/Blueprint/…), route `/intro` + `/login`. (12) Avatar Builder MVP: 172k combo, SVG portrait tự vẽ, `/settings/avatar` + API GET/PATCH `/api/user/avatar` + Prisma `User.avatar String?`. Nợ: morph login chỉ fade (chưa LayoutGroup cross-page), signup chưa auto-open avatar picker.

## 23/07 chiều tối — 6 agent song song (đã merge)
- **IF2-A nền non-breaking**: PRO_ONLY_TOOLS gate `role×stage` (crea/drafter/bim/viewer × sketch/technical/bim) + 1 nav CAD tự đổi "Phác thảo/Kỹ thuật/BIM" + handoff+present-handoff `{version, snapshot, timestamp, fromRole, toRole}` đóng băng chống mất data (parser fallback shape cũ = backward-compat) + badge "SOON · IF2" + `model.ts` thêm `storey?`+`elementType?` optional. 74 test.
- **A1 fix Bug P1**: Notebook 404 slug↔cuid — root cause `NotebookButton` push `slugify(flowName)` không phải cuid; approach C: helper `resolveNotebookProjectId(userId, paramId)` — nếu paramId là Project.id thật → dùng; ngược lại tự tạo bucket ẩn `__nb:<slug>` per-user (idempotent, wired vào 5 route `/api/notebook/*`). Bug "leak /api/flows" là NHẦM attribution (code đã filter đúng). Defensive: `NOT { name startsWith '__nb:' }` cho `/api/flows` + `/api/dashboard`. 75 test.
- **INSTALLER-R** (docs+scaffold, không code app): `docs/RESEARCH-INSTALLER-4-PLATFORMS.md` + thư mục `installers/` (README + mac-notarize + windows-electron-builder + android-bubblewrap + ios-pwa-vs-capacitor). Windows scaffold sẵn build unsigned; iOS MỚI hoàn toàn (thiếu 10 icon sizes + 14 splash + safe-area). Sprint 1 (2-3 ngày, không cần credential): Windows unsigned + PWA iOS/Android + LAN QR. Sprint 2 (~1 tuần chờ credential): Mac notarize + Android TWA + iOS public. Chi phí năm 1 tối thiểu $124.
- **CHAT-R**: `docs/RESEARCH-CHAT-FULL.md` (702 dòng) — hybrid SQLite meta + Supabase Postgres cho `Message` + Realtime; mint JWT ngắn 15p từ `/api/supabase-token` claim `sub` + `channel_ids[]` cho RLS; 4 model mới (Channel/ChannelMember/Message/MessageReaction); migration idempotent tạo channel `chn-team-chung-legacy` gộp ChatMessage cũ. 🔴 Q1 chặn: `ProjectMember` chưa build → phải build ACCESS-CONTROL M1 trước Chat.
- **LIB-R**: `docs/RESEARCH-LIBRARY-UPGRADE.md` (~570 dòng). Verify dev.db thật 1515 asset: tag toàn 2 nhãn cứng lặp "moodboard, gu-đích"/"view-render, gu-đích" (user CHƯA gõ tag thật), 1450/1515 có caption VLM flatten, 0/1515 có content PDF. Đề xuất giữ `LibraryAsset` + thêm 4 JSON optional (kind/stageUsage[]/domain{style,roomType,material[],mood}/projectId/userTags[]) non-breaking; auto-classify khi upload MỚI qua NVIDIA VLM prompt mở rộng; filter Reference pane theo `stageUsage` khớp `workspace`. M1 schema+upload mới ~1 tuần · M2 backfill Phase A không tốn AI ~3-5 ngày · M3 batch+description+Vitals assist ~3-5 ngày.
- **V verify E2E 10 flow**: 6/10 PASS (login · chuyển chặng 3×10 vòng 0 văng login · intro · deselect · Home button · console log sạch). 2 P1 (1 thật: Notebook 404 — A1 fix xong; 1 nhầm: /api/flows leak). 3 P2 (⌘J Vitals chưa implement; cursor polling 25 cặp/30s; Skip avatar spec mismatch).

## 08/08 — DỌN STATUS.md (phiếu p2 M-DON-TRAN): bản STATUS trước khi cắt, chép NGUYÊN VĂN

Dời từ STATUS.md (08/08, dọn cho dưới 800 từ theo trần CLAUDE.md — trước đó 586 dòng/8.674 từ).
Toàn bộ nội dung cũ giữ nguyên văn dưới đây làm biên bản; bản STATUS mới chỉ giữ mục sống.

<details><summary>STATUS.md nguyên văn tính đến 08/08 (trước khi cắt)</summary>

# STATUS — InteriorFlow

## ✅ XONG (08/08 rạng sáng — P14 · T1+T4: BVH + BẮT ĐIỂM 3D + mặt phẳng làm việc + lưới đổi mật độ, CHƯA COMMIT V6)
Chi tiết → `docs/M-3D-NOI-OUT.md`. `three-mesh-bvh` 0.9.14 (MIT, đúng bản NC-12) qua cổng
`lib/three/bvh.ts`; **đo cảnh IF thật** (trả lời CHƯA-VERIFY NC-12 §3.1): dựng BVH ≤3,2ms/39-67
group, cảnh nhỏ raycast thường còn nhanh hơn (10 vs 16µs — BVH thắng ở cảnh LỚN như số NC-12).
`lib/three/snap3d.ts` MỚI: thang 7 nấc cứng theo LOẠI + dung sai PIXEL (token --tap/2) + nhãn
Việt + ⇧ khoá loại + X/Y/Z khoá trục màu + `workPlane` (VIỆC 3) — dùng NGUYÊN `SnapSettings`
store 2D (K1, 0 diff lib/cad). Nối vào Scene3DViewer CHỈ mode massing (campath/chụp ảnh 0 đổi).
VIỆC 7: lưới 1m/100mm/10mm theo tầm nhìn, bám target không trôi vạch. Test snap3d 28/28 ĐO toạ
độ · tsc 0 · npm test 0 fail · check-chot 0 đỏ. Verify browser thật (3007, server riêng): rê ra
đúng "Đầu mút"/"Giao tuyến"/"Lưới sàn" + dấu + chữ — bug "Giao tuyến che Giữa cạnh" bắt được lúc
verify, đã sửa + test. Đã dọn 2 entity test khỏi Dự án mẫu. 🟡 Giữa cạnh/Tâm mặt/⇧/XYZ mới verify
bằng test (camera demo không với tới — nút Toàn cảnh không fit lại, bug CŨ, báo chưa sửa).
⬜ VIỆC 4-6 (VCB · mở cụm nút + 3 icon sai · nối 11 hàm build-ops) để phiếu sau đúng điều khoản
cuối phiếu. 🔴 `ad2d23b` (Hoà, 22:02) cuốn bản GIỮA CHỪNG phiên này — phần chốt còn working tree.

## ✅ XONG (08/08 rạng sáng — P13 vòng 4: .idfc V2 "mọi thứ đều là .idfc", CHƯA COMMIT V6)
Chi tiết → `docs/M-IDFC-2-OUT.md`. Theo chốt 07/08 khuya (00-CHOT.md mục 11): `IdfcFile` v2 =
vỏ chung (meta có **kind** 11 loại, lighting→fixture) + RUỘT discriminated union 7 kiểu (⛔ không
interface phẳng) + commerce bỏ kind. **IDFC_VERSION 1→2, IDFC_MIGRATIONS lần đầu có entry thật**
— test 36/36 (9 test riêng migration: furniture/lighting/material/no-commerce; material cũ giữ
geom2d ở symbol2d, KS4). Verify UI thật (3000): thả 1 lần 3 file — v1 CŨ đọc được xuyên migration
(kệ hiện + giá 120tr + Roughness 0.45), v2 asset (không geom2d) vào được, file video-mang-ruột-
component bị CHẶN kèm câu lỗi union chính xác. ThumbKind hết vai phân loại → ánh xạ n→1 sang
IdfcKind (`idfcKindOfThumb`), 5 thumb `light-*` tạm map asset — **chờ Hoà quyết kind `preset`**.
VIỆC 4 (sidebar theo kind) + VIỆC 5 (lỗi thẻ a-e) ĐỂ PHIẾU SAU theo đúng điều khoản cuối phiếu —
không làm dở. tsc exit 0 · npm test 0 fail · check-chot không tăng đỏ (35 cũ, 0 dính file phiên).
⚠️ Suýt-sự-cố: git stash trong cây chung để đo HEAD — lệnh fail vô hại, nhưng RÚT LUẬT: cấm
stash/checkout khi nhiều phiên chung working tree.

## ✅ XONG (07/08 đêm — P13 vòng 3: .idfc CÓ NƠI TIÊU THỤ + tấm Thư viện 4 ngăn, CHƯA COMMIT V6)
Chi tiết → `docs/M-IDFC-OUT.md`. Format .idfc (P7) đo xong thấy ĐỦ — không sửa; nối 2 đầu dây
thiếu: NHẬP (BulkIngestMode parse thật ngay lúc thả, lỗi cụ thể tại dòng, lưu `lib/library/
idfc-store.ts` MỚI upsert theo mã) · KỆ THẬT `common-idfc` đếm số thật, cột thông số ưu tiên
commerce TRONG FILE (verify: giá 120tr/cái + Unit "cái" chỉ có trong file, DB đang "—") · XUẤT
(nút "Xuất .idfc" chỉ hiện khi resolve được BlockDef, gói đủ 3 mặt + pbr kho). VIỆC 4: nối
`surface` vào spec-panel — Roughness 0.45 + bar hiện từ pbr nhúng, Gloss "—" đúng (không suy
1−nhám). Cột kệ nhóm 4 NGĂN chốt (+ ngăn tạm "Mẫu & hồ sơ" cho 8 kệ template — CHỜ HOÀ XẾP).
G-M19-01 (3 nấc thẻ) đo ra ĐÃ LÀM từ chiều — chỉ verify chụp 3 nấc, không code lại. Verify vân
TRƯỚC/SAU (cầu trơn → vân gỗ). tsc 0 lỗi TOÀN REPO. Dọn sạch localStorage test trên 3000.
G-M3-15 (54 block) chừa cho p2 — không đụng, tầng dữ liệu ngăn Cấu kiện sẵn chỗ.

## ✅ XONG (07/08 tối muộn — P13 vòng 2: ẢNH VÂN vật liệu G-M17-03, CHƯA COMMIT V6)
Chi tiết → `docs/M-VAT-LIEU-2-OUT.md`. `MaterialPbr` +4 trường (`baseColorMapUrl` **sRGB** ·
roughness/metallicMapUrl linear · `uvScaleMm` mm thật — thiếu là gạch 600mm thành 3m) ·
`lib/three/pbr-three.ts` MỚI = nơi DUY NHẤT gán colorSpace/repeat (texture cache + clone trước khi
đổi repeat) · quả cầu đi `renderMaterialPreviewAsync` (caller cũ y nguyên) · editor 6 nút nạp ảnh
+ ô bước lặp vân. Verify browser thật (server 3000 dùng lại): quả cầu SW-TRV-BE từ MÀU TRƠN →
CÓ VÂN travertine sau khi nạp ảnh qua đúng input UI; uvScale 250mm → vân mịn hẳn; 0 lỗi console;
không để dấu vết localStorage. VIỆC 4: bảng đối chiếu mock `Thư viện.dc.html` ↔ code (9 dòng) —
đáng chú ý: cột thông số ④ có sẵn dòng Độ nhám/Độ bóng nhưng `buildSpecRows` gọi 2 tham số nên
LUÔN "—", nay đã có nguồn thật `getPbr(matId)`, nối 1 dòng ở `LibrarySheet.tsx:260` (chờ vùng
library hết kẹt phiên). ⚠️ `ve3d-css.ts` bị phiên khác ghi backtick vào template literal lúc
16:23 (lần 3 trong ngày họ bệnh này) — họ tự sửa sau 90s, tôi không đụng; đề nghị luật:
**file `*-css.ts` cấm backtick trong comment**.

## ✅ XONG (07/08 — LOGIN UI: text-shadow đúng ngữ cảnh + specificity tone dark, CHƯA COMMIT theo V6)
Phiên sở hữu `globals.css` khối `.lq-*` + `LoginForm.tsx`. VIỆC 1: shadow `.lq-content` nay CHỈ
áp cho chữ trắng trên nền tối/ảnh — tắt ở theme sáng/linen (card sữa chữ mực hết nhoè viền, ca
ảnh Hoà), chọn phương án selector theme/tone vì phương án class đòi sửa LoginScreen ngoài vùng.
PHÁT SINH cùng họ: `[data-login-tone='dark']` thua specificity nhánh theme sáng → theme sáng +
ảnh nền ra card SỮA đè ảnh — vá `:root ` prefix cho cả `.lq-card` lẫn `.lq-field`. VIỆC 2 "dính
Quên mật khẩu": KHÔNG tái hiện được (gap đo 102.6/45.6/≈34px ở 1280/375/EN) — vá lưới đỡ
flex-wrap+gap-x-4, cần Hoà cho ngữ cảnh nếu còn thấy. VIỆC 3: `adaptive-contrast` shadowCss đúng
tone (không cùng họ). Verify browser thật 127.0.0.1:3000 (server sẵn, HMR) đủ 4 trạng thái
computed + chụp màn, 0 lỗi console, tsc exit 0. Báo cáo: `docs/M-LOGIN-UI-OUT.md`.

## ✅ XONG (07/08 tối — P13 VẬT LIỆU: khoá nối matId + editor 4 núm + probe 3 cửa nạp, CHƯA COMMIT V6)
Chi tiết đủ → `docs/M-VAT-LIEU-OUT.md`. Chốt: **matId = `ProductSpec.sku`** (tái dùng mã ATLAS,
KHÔNG cột DB mới, không migrate) · `lib/materials/resolve.ts` `getMaterial()` trả 3 mảnh, thiếu=null
(9/9 test) · VIỆC 5: `material-edit.ts` (11 loại, metallic/specular KHOÁ, 46/46 test — roughness
từng loại khoá cứng bằng test vào `pbr-from-category`) + `MaterialPbrEditor.tsx` mount MaterialTable
(10/10 hàng), verify browser thật 3006: gỗ→kim loại metallic tự nhảy 0→1 + quả cầu đổi thật, kính
mở núm Độ trong, 2 theme, lưu localStorage `if.materials.pbr.v1` · VIỆC 6 probe: cửa ② Excel THÔNG
(246 test) · cửa ③ /api/library THÔNG (POST/DELETE 200, 0 rác) · cửa ① ATLAS TẮC (403 non-admin +
Lark 131006 treo từ 04/08, chờ Hoà) — CHƯA nạp 30 món (đúng lệnh probe trước) · VIỆC 7: (b) P7 làm
rồi (kiểm code, không làm lại), (a)+(c) treo vì vùng components/library đang nhiều phiên ghi chồng.
🔴 Sửa 2 bug CHẶN ngoài phiếu ở `library-sheet-css.ts`: (1) tấm Thư viện đóng xong vẫn che nguyên
màn (bản card-nổi quên ẩn — thêm visibility trễ 200ms, đúng G1); (2) backtick trong comment CSS
"SỬA 07/08 CHIỀU" nằm trong template literal → GÃY BUILD mọi route mount AppShell — đã gỡ; luật:
file đó CẤM backtick. ⚠️ 5 dev server chung `.next` giẫm manifest nhau (route 200→404 xen kẽ).
PBR chưa nối vào scene 3D (`components/three` tự khai chờ) — việc phiên vùng đó.

## ✅ XONG (07/08 — BỘ LỆNH DỰNG HÌNH build-ops G-M17-02, CHƯA COMMIT theo luật V6)
Phiên sở hữu `lib/three/build-ops.ts`+`csg.ts`: thêm 10 lệnh engine tham số MM THẬT —
`prismBeveledEx`/`prismChamfered`/`filletPolygonMm` (VIỆC 1, bán kính+segments+chọn cạnh
all/vertical/top) · `arrayGrid`/`arrayRadial`/`mirrorGeometry` (VIỆC 2) · `sweepProfile` (miter
phân giác)/`revolveProfile` (LatheGeometry)/`loftSections` (VIỆC 3) · `prismTapered` (VIỆC 4) +
`offsetPolygonInwardMm` (offset THẬT — phát hiện `insetPolygonMm` cũ chỉ lùi mặt 0,707d, bevel cũ
vát non ~29%, KHÔNG tự sửa, chờ TỔNG quyết). Test 51/51 đo toạ độ/bbox thật · tsc -p . exit 0 ·
`csg.ts` đọc không cần sửa · fail duy nhất còn lại = cad-to-obj entityId CŨ. Ảnh nghiệm thu N6
render từ chính BufferGeometry: `docs/screenshots/build-ops-dot1-2026-08-07.png` (+.svg có nhãn).
🟡 CHƯA nối `ops[]`/UI (BuildOp ở `lib/cad/model.ts` ngoài vùng) — báo cáo đủ: `docs/M-BUILD-OPS-OUT.md`.

## ✅ XONG (05/08 — BẢNG MÀU SƠN: bỏ bảng Pantone 2310 mã, tầng màu CẮM RỜI, CHƯA COMMIT theo luật V6)
Hoà chốt sau NC-16 (⚠️ **`docs/NC-16-BANG-MAU-SON.md` KHÔNG TỒN TẠI trong repo** — `find` + `git
log --all` = 0; phiên này dùng phần tóm tắt trong brief). **VIỆC 1** `lib/colors/` MỚI: `types.ts`
(ColorSource/ColorEntry, LƯU CẢ LAB) · `build.ts` (ghép cột + kiểm dòng, dùng CHUNG cho CSV lẫn
Lark) · `user-csv.ts` (đọc .csv/.xlsx qua `parseSpreadsheetFile` CÓ SẴN + parser clipboard tự dò
tab/phẩy/chấm-phẩy + mẫu CSV tải về) · `larkbase.ts` + `app/api/colors/lark/route.ts` (PULL-ONLY
§309-313; **preview trả TÊN CỘT THẬT** để ghép cột NGAY TRONG IF — Hoà không mở được UI Larkbase)
· `store.ts` (studio=localStorage · dự án=`colors.json` thư mục dự án, mẫu `brand-kit-disk.ts`) ·
`registry.ts` (**chặn theo hãng / tắt nguồn lúc chạy** — env ∪ máy, gộp-thêm không ghi-đè ⇒ có thư
yêu cầu gỡ thì đổi config, KHÔNG build lại app). **VIỆC 2** `deltaE2000` vào `color-psychology.ts`
(ΔE76 GIỮ NGUYÊN cho `paletteMood`/gu — đổi là vỡ gu đã học) — verify **28/28 cặp kiểm chuẩn
Sharma 2005**, lệch <5e-5; `nearestColor(hex, source)`/`nearestColors` trả TOP 3-5 kèm ΔE, ΔE>5 ⇒
"không có màu nào đủ gần". **VIỆC 3** `pantone-tcx.json` (2310 mã) **XOÁ khỏi đĩa** (chưa stage —
Hoà `git rm`); `trend.ts` = Color of the Year, **trần cứng 1 mục/năm + bắt buộc link nguồn, có test
chặn**; LICENSE-NOTES §9 viết lại (ranh giới ở QUY MÔ bộ sưu tập, không ở việc hiển thị). **VIỆC 4**
`disclaimer.ts` + `ColorAccuracyNotice` — **KHÔNG có nút tắt**, đứng cạnh mọi nút chỉ định/xuất.
UI: `/colors` (mở từ nút "Bảng màu" header Kho vật liệu). `tsc` sạch · 161 test mới pass · `npm test`
chỉ 1 fail CŨ đã biết (`cad-to-obj` entityId nội thất). Verify browser thật (127.0.0.1:3002, server
riêng phiên này, đã tắt): dán CSV → đoán đúng 4/4 cột, 3 màu vào + báo đúng "Dòng 5" hỏng · tra màu
ΔE 0/28.87/44.76 · ΔE 38.65 → hiện đúng câu "không đủ gần" · chặn hãng "NỘI BỘ" (khác hoa/thường) →
0/3 màu tức thì · 2 theme · 0 lỗi console; đã xoá sạch dữ liệu test khỏi localStorage.
🟡 **CHƯA VERIFY**: đường nạp tệp .xlsx/.csv thật qua hộp thoại (chỉ có test đơn vị) · đường Larkbase
(thiếu env `LARK_*`, không gọi được API thật) · 11 link nguồn `trend.ts` chưa mở đối chiếu · mục
**2026** cố ý ĐỂ TRỐNG, không đoán. ⚠️ `pantone-tcx.json` còn trong LỊCH SỬ git — cần `filter-repo`.
**VIỆC 5** (ước lượng xin license RAL) = BÁO CÁO, không code — xem báo cáo phiên.

## ✅ XONG (05/08 — ĐẶT LẠI TÊN NODE: tách VI/EN · 6 nhóm quy trình · 5 tên sai ngành, CHƯA COMMIT theo luật V6)
VIỆC 1: `NodeDefinition.titleEn` (mới, optional — `lib/types.ts`) · tách **46 nhãn** `'Việt · English'`
→ `title` chỉ tiếng Việt + `titleEn` ra TOOLTIP (bảng chọn node + mặt node trên canvas). EN interface
đảo lại (hiện tên EN, tooltip VI) — không mất chữ ở ngôn ngữ nào. Tên EN vào kho tìm kiếm
(`search.ts` + ⌘K `CommandPalette`) nên gõ "batch variants"/"inpainting" vẫn ra đúng node.
VIỆC 2: `lib/nodes/groups.ts` MỚI (6 nhóm quy trình archviz: Nguồn·Gu·Máy quay·Dựng ảnh·Sửa ảnh·Hồ sơ,
**1 node = 1 nhóm**) THAY `lib/nodes/tags.ts` (7 tag kỹ thuật, đã xoá — chỉ `NodeLibraryPanel` +
`edgecase-stress.test.ts` dùng, cả 2 chuyển sang groups). Xếp đủ **cả 46 node** registry, không chỉ 18.
VIỆC 3: 5 tên sai ngành → `Mặt nạ đối tượng`(Object Mask) · `Sửa vùng`(Inpainting) · `Ghi kích thước`
(Dimension Annotation) · `Bảng gu`(Style Reference) · `Hoạ tiết`(Pattern); nhãn cũ giữ trong `keywords.ts`
để người quen tên cũ vẫn tìm ra; đồng bộ `task-cards.ts` + chuỗi lỗi/mô tả nhắc tên cũ.
⛔ **id kỹ thuật KHỚP 100%** (diff `type: '...'` trước/sau = rỗng, 46/46) — không đụng tên file/key registry.
Verify browser thật (127.0.0.1:3002, server riêng phiên này): 6 nhóm + 6 chip hiện đúng thứ tự quy trình
· nhãn VI ngắn, `title` attr mang tên EN (đọc DOM 60 thẻ) · gõ "object mask"/"inpainting" ra đúng node ·
EN interface đổi cả chip lẫn nhãn thẻ · 0 lỗi console. `tsc -p .` sạch · `npm test` chỉ 1 fail CŨ đã biết
(`cad-to-obj` entityId nội thất) · +4 test `search.test.ts`, phần [1] `edgecase-stress` viết lại theo groups.
🟡 **3 sửa phụ bắt được LÚC VERIFY** (pre-existing, ghi rõ để Hoà biết đã đụng): (1) memo `groups` thiếu
`phase` trong deps → đổi chặng thì 6 nhóm giữ kết quả cũ, lặp node vùng Mood/Công cụ; (2) 2 vùng ghim
Mood/Công cụ bị ẩn hẳn khi đang gõ mà node của chúng cũng không lọt vào 6 nhóm ⇒ ở chặng 3D gõ tên 12
node Công cụ ra "Không tìm thấy khối nào" — nay vùng ghim tự lọc theo truy vấn; (3) dòng "Không tìm thấy"
nay đếm cả vùng ghim, không hiện sai khi có kết quả.
⚠️ **Cần Hoà biết**: cột "Đầu vào" từng bị bỏ ở layout nghỉ (Hoà 04/08) — nay ① NGUỒN hiện lại vì nó là
BƯỚC quy trình (chứa Tạo ảnh từ chữ · Phác tay · Bản vẽ → 3D), không phải cột "đầu vào thuần" cũ.

## ✅ XONG (05/08 — P12 chốt giá 3 task AI internal-free, CHƯA COMMIT theo luật V6)
Chốt giá Hoà giao TỔNG quyết: `removeBg`·`materialSwap`·`segment` MIỄN PHÍ khi luồng lớn gọi
NỘI BỘ, TÍNH PHÍ khi mở thẳng công cụ — "họ mua MỘT tấm ảnh, không mua ba lượt gọi mô hình".
Làm: `INTERNAL_FREE_TASKS` (whitelist cứng 3 task) + `costOfTask(task,{internal})` (`lib/ai/
tiers.ts`) · cờ đi `runImageJob(...,internal)` → body `/api/jobs` → `costOfTask` (`lib/ai/
client.ts` + `app/api/jobs/route.ts`, NGOÀI vùng khai báo nhưng bắt buộc — cờ không tự tới
server được, ghi rõ lý do) · bật `internal:true` đúng 3 chỗ: idmask `removeBg` + localedit
`materialSwap` (`render-v2.ts`) + SmartSelect `segment` (khôi phục đúng ý gốc "không tính
credit lần chạy lại"). `furnitureextract` GIỮ tính phí (removeBg = chính sản phẩm nút đó).
`lib/server/credits.ts` KHÔNG cần sửa (`spendCredits` sẵn no-op khi amount=0). Test
`tiers.test.ts` 31/31 (cả 2 đường + chốt an toàn: cờ không miễn phí được task ngoài whitelist)
· `tsc -p .` toàn repo sạch. Audit R2 đã ghi dòng chốt (hết "cần Hoà chốt"). ⚠️ Đánh đổi đã
ghi docblock: cờ do client khai ⇒ curl `internal:true` free được đúng 3 task này (nặng nhất
materialSwap 4); task đắt render/video vẫn chặn. VIỆC 2 (E4-E7 vào DUONG-VE-DICH): **đã có
sẵn trong working tree do phiên khác ghi, khớp brief 1-1 — không ghi trùng.**

## 🔴 XONG MỘT PHẦN (04/08 tối — P1-VERIFY nhập DWG bằng file thật, chi tiết `SO-KIEM-TONG.md` §11)
Verify `2236e0d` bằng 34 file .dwg thật + phát hiện khoảng trống: `openDwgFile()` có sẵn
`opts.signal`/`opts.onProgress` nhưng chưa nút nào gọi tới — nối vào `CadEditor.tsx` (state
`dwgImportAbort` + thanh nổi "Đang nhập DWG… [Huỷ]"). Verify browser thật 3 ca: **thành công**
(`Small office.dwg` 224KB → 315 đối tượng, đúng) · **tiến độ sống** (`ID-02-GN-200-00-001.dwg`
21MB → status cập nhật mỗi giây đúng giai đoạn `convertEx`) · **file hỏng báo lỗi rõ** (2 biến thể
chữ ký sai → thông báo có tên file cụ thể, đúng yêu cầu).
🟡 **BUG "Huỷ = treo tab": ĐÃ SỬA theo hướng Hoà chốt, nghiệm thu CÒN THIẾU** (chi tiết `SO-KIEM-
TONG.md` §11d). Hoà chốt: **Huỷ = BỎ RƠI worker, không `terminate()`**. Sửa xong ở `lib/cad/dwg.ts`
(`finish(settle, orphan)` + `orphanDwgWorker()` gỡ listener, trần 2 worker mồ côi, `console.warn`
để debug) — code đã nằm trong `dace0c4` (bị cuốn theo commit docs phiên khác, lần thứ 5, không mất
dữ liệu). `tsc` sạch · `dwg.test.ts` 21/21.
🔴 **CHƯA đo/chụp được "huỷ 9.7MB → UI sẵn sàng <1s"** như nghiệm thu yêu cầu: verify lại chính file
đó thì tab mất phản hồi CDP **ngay khi vừa dispatch**, chưa kịp bấm nút Huỷ (khác §11c — ở đó bấm
được rồi mới treo). Đo `ps`: renderer giữ ~100% một lõi liên tục, **elapsed 19:13 / CPU time 14:00**
mới can thiệp. **2 phát hiện MỚI nặng hơn §11c**: (1) nhánh `hardTimeout` 60s tự động gọi
`terminate()` mà CPU vẫn full tải ~18 phút sau mốc đó ⇒ `terminate()` không cắt được vòng WASM này;
(2) **đóng hẳn tab cũng KHÔNG giải phóng renderer** — phải `kill -9` tầng OS. ⇒ Giả định nền của
hướng "bỏ rơi" (*trình duyệt tự dọn khi tab đóng*) CHƯA chắc đúng cho ca vòng lặp nặng: worker mồ
côi có thể ăn nguyên 1 lõi vĩnh viễn; trần 2 worker chặn được RAM, KHÔNG chặn được CPU.
→ **Chờ Hoà quyết tiếp** (3 lựa chọn ghi ở §11d): (a) áp `orphan` cho cả nhánh timeout tự động ·
(b) cảnh báo/chặn theo ngưỡng dung lượng trước khi nhập · (c) chấp nhận, chỉ ghi TECH-DEBT.
Phụ (cũ, chưa đổi): file .dwg cắt cụt còn header → vào êm "0 đối tượng" thay vì báo lỗi rõ.
🔴 **VI PHẠM TRUNG TÍNH cần Hoà xử lý**: `public/__dwg-cancel-test.dwg` (9.7MB = bản sao hồ sơ khách
thật `01_BeachClub_TangHam.dwg`) **đã bị `add -A` của phiên khác commit vào lịch sử git** (`dace0c4`).
Bản trên đĩa nay đã mất (không phải phiên này xoá). Cần `git filter-repo` trước phát hành — xem §11d.

## ✅ XONG (04/08 — P5 luật kính lỏng + khuôn EmptyState toàn app)
VIỆC 1: `.glass-float`/`.glass-float--bar` vào `globals.css` (cạnh `.vitals-pop`) — panel 34% +
blur(--blur) saturate(1.3) + gờ trên sáng hơn (t1 26% vs 14%) + shadow 0 8px 32px; áp ĐÚNG 4 chỗ:
`ModeSwitchBar` (toolbelt canvas 3D) · nút "Dựng ảnh" (`Render3DModeSkeleton`, nền accent đặc →
kính, icon giữ accent) · ViewCube (`Viewport3D`+`ve3d-css` overflow:hidden) · nút đóng `Lightbox`.
Luật ghi APPEND vào `00-BAT-DAU-DOC-DAY.md` §4 (G9): cấm Inspector/cây tầng/bảng vật liệu/popover
Vitals (→`.vitals-pop`), trần 4 tấm backdrop trên WebGL. VIỆC 2: khuôn `components/ui/EmptyState.tsx`
rút từ mock `mock-if-thu-vien-trong.html` (cấu trúc thật ngăn kệ/hàng ghost + ≤2 nút làm việc TẠI
CHỖ, disabled phải kèm lý do §9) — nối vào `MaterialsScreen` (rỗng thật ≠ lọc rỗng, nút mở form/
wizard tại chỗ) · `BoqScreen` (docSource none) · `LibraryPanel` (rỗng thật, mở popover [+]) ·
`GalleryPanel` (disabled kèm lý do — ảnh chỉ vào qua node cùng canvas). Tệp/`FileManagerShell` ĐÃ
đúng khuôn sẵn (fan giấy + CTA tại chỗ) — không đụng. `tsc -p .` sạch; verify browser thật
(127.0.0.1:59978, server riêng autoPort vì 3005 bận): 3 chỗ kính đo computed style đúng số cả 2
theme + Lightbox mounted đúng class; EmptyState chụp Gallery panel + BOQ cả 2 theme, chữ rõ.
**CHƯA chụp được**: kho vật liệu rỗng (DB demo có 2 vật liệu thật — KHÔNG xoá dữ liệu để dựng ảnh)
· Trình chiếu không có màn rỗng chạm được (luôn sample deck). Lỗi console duy nhất = `EditorCanvas`
max-update CŨ đã ghi từ trước, không do việc này.

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## ✅ XONG (04/08 — P8 sửa 4 lỗi màn Thiết kế 3D, `3305001`+`bdeffd3`, chi tiết `SO-KIEM-TONG.md` §10)
Trùng nút Tường/Cửa/Cửa sổ (`Command3DPanel.tsx`, gộp về đúng 1 nhóm Cấu kiện, Hộp/Sàn/Mái tách
"Khối cơ bản") · ViewCube3D vỡ khung (canvas thiếu `style.width/height`, tràn 2x theo DPR — sửa 1
dòng) · tooltip đè nút (mở rộng `Tooltip.tsx` dùng chung thêm `side='right'` tự lật trái khi hết
chỗ). LỖI 2 "lẫn theme" KHÔNG tái hiện được dù kiểm kỹ 4 tab × 2 theme × 3 độ rộng — không sửa,
ghi rõ không giả vờ. Phát hiện phụ NGOÀI phạm vi: Lockscreen bị canvas 3D che mất click (đã tách
việc riêng, xem task đã spawn). `tsc`/`npm test` sạch, không hồi quy.

## ✅ XONG (04/08 — P3 KHO VẬT LIỆU VIỆC 3+4: màn quản lý + nhập Excel/CSV, `0120987`)
`docs/PHIEU-CODE-IF-KHO-VAT-LIEU-V1.md` — VIỆC 1 (4 cột schema) đã xong từ trước (`9710611`).
**VIỆC 3**: `components/materials/*` (MaterialsScreen/Table/FormModal) — thêm/sửa/xoá/tìm/lọc/
gắn ảnh, dùng ĐÚNG API sẵn có `GET/POST /api/specs` + `PATCH/DELETE /api/specs/:id` (không route
mới). Mở từ Settings → Nâng cao → "Mở kho vật liệu" (`app/materials/page.tsx`, N6: grep xác nhận
`PixelSettingsShell.tsx` → router.push('/materials') → MaterialsScreen → MaterialTable/FormModal/
ImportWizard, chuỗi đủ).
**VIỆC 4**: `MaterialImportWizard.tsx` + `lib/materials/warehouse/*` — đọc xlsx/csv (thêm dep
`xlsx`), nhận diện định dạng qua `lib/gateway/detect.ts` CÓ SẴN (KHÔNG viết cửa nhận diện thứ
hai, đúng chỉ đạo phiếu) → ghép cột tay (đoán qua từ khoá VI/EN + nhớ theo chữ ký tiêu đề,
`column-mapping.ts`) → xem trước 20 dòng báo lỗi rõ dòng nào hỏng → ghép ảnh thư mục theo SKU
trùng tên file. **Bug thật bắt được lúc viết test**: SheetJS đọc CSV không tự nhận UTF-8 → mọi
ký tự có dấu tiếng Việt mojibake ("Mã" → "MÃ£") — sửa bằng tự giải mã UTF-8 trước khi đưa
`XLSX.read`; nhánh xlsx (ZIP+XML) không bị lỗi này, XML tự khai UTF-8 sẵn.
`lib/server/specs.ts`: vá `specToDto/specNormalize/specPatch` thêm `unit/priceVnd/scope/ownerId/
supplierId/verified` (cột VIỆC 1 đã khai DB, chưa ai đọc/ghi qua API) — `ownerId` LUÔN ép theo
session user (client không tự khai), `scope` ép cứng `'studio'` (tầng `global` chưa có luật
duyệt, đúng luật §9 phiếu). Đặt `lib/materials/warehouse/` làm subfolder RIÊNG trong
`lib/materials/` — không trộn file phẳng với `lib/materials/schema.ts` (đó là matId PBR thị
giác, đây là ProductSpec thương mại, đúng luật 2.1.9.i "cố ý không trộn").
53 test mới pass (`column-mapping`/`apply-import`/`image-match`/`xlsx-parse`), `npx tsc --noEmit
-p .` sạch phần của mình, `npm test` 0 fail mới (chỉ còn 1 fail cũ đã biết, `cad-to-obj.test.ts`,
không liên quan). Verify browser thật (127.0.0.1:3000): thêm tay 1 vật liệu → hiện đúng bảng ·
sửa giá vật liệu có sẵn → đúng chặn 403 "chỉ admin" (hành vi cũ, không phải bug) · nhập CSV 3
dòng (dấu tiếng Việt) → tự map đúng 8/8 cột, 2 dòng hợp lệ vào kho, 1 dòng thiếu "Tên" báo lỗi
rõ, không chặn 2 dòng còn lại. Đã xoá sạch dữ liệu test khỏi `dev.db` (query xác nhận 0 dòng còn
lại) sau khi verify.
🔴 **Hai phiên chung `.git` — lần này va ngay lúc code, không phải sau khi commit**: `tsc` phát
hiện `components/cad/CadToolbar.tsx` đổi lỗi TS giữa 2 lần chạy liên tiếp (khác bug set mỗi lần)
— phiên khác đang sửa DWG (`lib/cad/dwg-map.ts`/`dwg-worker.ts`/`dwg.ts` + `dwg.test.ts` mới,
đúng mục "2.1.6.d bug Nhập DWG" trong STATUS.md "Chờ USER quyết") SONG SONG lúc tôi verify. Đã
lọc chắc chắn lỗi tsc CHỈ nằm ở file đó (0 lỗi còn lại khi loại `CadToolbar.tsx` khỏi output) —
không đụng, không commit file của họ, commit của tôi giới hạn đúng pathspec 8 mục việc mình.

## ✅ XONG (04/08 — P7 ĐỔI TÊN 3 chặng: 2D Kỹ thuật/3D Thiết kế/Trình bày → Thiết kế 2D/Thiết kế 3D/Trình chiếu)
Hoà chốt: IF1/IF2 nay gộp chung nên ngữ nghĩa nhãn cần RỘNG hơn. Đổi CHỈ NHÃN hiển thị — khoá kỹ
thuật `concept/render/present`·`sketch/pro/revit`·`node/3d` GIỮ NGUYÊN TUYỆT ĐỐI (verify: không
đụng dòng nào ngoài `label:`/chuỗi hiển thị). Nguồn gốc `lib/phases.ts` (comment append-only, giữ
lịch sử tên cũ) + ~20 file UI đồng bộ theo: `ShortcutsPanel`·`AppCommandPalette`·`StageSwitcher`·
`VitalsGesture`·`LibrarySheet`·`CadEditor`·`ZonePanel`·`Toolbar` (present-editor)·`NodeExtras`·
`StageIntroCard`·`StagePresetPanel`·`IntroSequence`·`ReferencePane`·`PresentDeck`·`overview/page`
·`lib/shortcuts.ts`·`lib/ai/chat-assist.ts`·`lib/present-demo.ts`. Docs: `00-BAT-DAU-DOC-DAY.md`
(bộ tên chính thức, bản cũ giữ làm blockquote lịch sử) · `SPEC-MODE-PER-STAGE.md` (ghi chú đầu
file) · `CHECKLIST-TONG.md` (1 dòng changelog cuối file, không sửa đè hàng cũ).
`components/ProjectSelect.tsx` **CHƯA đổi** (thuộc vùng P5, bỏ qua tránh conflict theo đúng luật
hai-phiên-chung-git — 1 dòng "Cách dùng 2D Kỹ thuật · 3D Thiết kế · Trình bày?" còn sót).
`npx tsc --noEmit -p .` sạch (chạy nền, exit 0). Verify browser thật (127.0.0.1:3001, cổng riêng
phiên này, KHÔNG đụng cổng 3000/3004 đang chạy): header StageSwitcher, ⌘K palette, tab-tooltip
(title attr đọc qua `read_page`), toolbar Nhập/Xuất present-editor — cả 3 chặng đúng nhãn mới ở
2 route (`/present-editor`, `/cad-editor`) + màn Cài đặt. Chưa bấm riêng toggle EN qua UI (scroll
bị kẹt trong sandbox) nhưng chuỗi EN đã sửa đúng theo yêu cầu (chỉ "2D Technical"→"2D Design" đổi,
"3D Design"/"Presenting" giữ nguyên) — xác nhận bằng đọc lại source, chưa xác nhận bằng mắt UI.

## ✅ XONG (04/08 — P1 bug đỏ 2.1.6.d "nhập DWG treo vĩnh viễn": timeout+tiến độ+huỷ+lỗi rõ)
TÁI HIỆN bằng **34 file .dwg THẬT** (`~/Documents/Zalo Received Files` — dự án thật của studio,
không phải file tự chế, đúng luật N3): 4/34 file (11–21MB) vượt 25s không phản hồi; đo lại kỹ hơn
(không giới hạn) xác nhận KHÔNG phải vòng lặp vô hạn tuyệt đối trong các case đã thử — nhưng tốn
tới **39 giây** (file 21MB) và thời gian KHÔNG ổn định giữa các lần chạy (cùng 1 file: <10s hoặc
>25s tuỳ tải máy), với ZERO tiến độ/timeout/huỷ trước đó — đúng cảm giác "treo vĩnh viễn" người
dùng mô tả. Đo chính xác nút cổ chai: `dwg_read_data` luôn nhanh (vài giây kể cả 21MB), chậm là
`convertEx`. Không loại trừ file khác gây vòng lặp C thật sự (ngoài tầm sửa — code C biên dịch
WASM) — cách phòng thủ đúng bất kể nguyên nhân là timeout cứng từ NGOÀI.
Sửa (`lib/cad/dwg.ts`+`dwg-worker.ts`+`dwg-map.ts`, đúng vùng giao — không đụng `dxf*.ts` vì không
cần, không đụng `cad-to-obj.ts`/`findHatchBoundary` như cảnh báo vì KHÔNG liên quan): **timeout
cứng** mặc định 60s (`DEFAULT_DWG_IMPORT_TIMEOUT_MS`, chỉnh được qua `opts.timeoutMs`) — CHỈ làm
được từ main thread qua `worker.terminate()` (đã đọc `.d.ts` thật: `dwg_read_data`/`convertEx`
ĐỒNG BỘ, không callback/progress hook nào, worker không thể tự huỷ giữa chừng) · **tiến độ CÓ
THẬT** — worker báo 2 mốc giai đoạn thật (`reading`/`converting`, KHÔNG phải % giả) + heartbeat
elapsed-time mỗi 1s từ main thread, mặc định ghi thẳng `useCadStore.setStatus()` (làm NGAY trong
`dwg.ts` vì ticket giới hạn vùng file, không được sửa `CadEditor.tsx`) · **huỷ được** qua
`opts.signal` (AbortController, cơ chế sẵn — nút "Huỷ" thật cần sửa CadEditor.tsx, ngoài vùng file
ticket này) · **lỗi rõ hơn** — mọi thông báo lỗi/timeout nay có tên file, kích thước, phiên bản DWG
đọc từ header (bảng `DWG_VERSION_NAMES`), và ĐANG Ở GIAI ĐOẠN NÀO khi treo. `openDwgFile(f)` gọi
như cũ (1 tham số) vẫn chạy y nguyên — chỉ tự động được bảo vệ thêm, không phá caller cũ.
Test mới `lib/cad/dwg.test.ts` (21/21, các hàm thuần format thông báo — không test được
`openDwgFile`/Worker thật vì `dwg.ts` chứa `import.meta`, giống lý do `dwg-map.ts` tách riêng từ
đầu) + `dwg-flatten.test.ts` cũ 36/36 không hồi quy. `tsc --noEmit -p .` sạch.
**CHƯA LÀM lúc đó** (nút Huỷ + verify thật) → đã làm + phát hiện bug MỚI, xem entry P1-VERIFY phía
trên đầu file · chưa xác nhận được TRUE infinite loop trong `convertEx` (nếu tái diễn với timeout
60s vẫn "treo" → là bug C thật trong libredwg-web, cần báo upstream, không phải thiếu timeout nữa).

## ✅ XONG (04/08 — P4 xuất PDF: sàn nét in an toàn + số tờ/phiên bản, `df6ca85`)
Brief P4 mô tả "xuất PDF hiện là chụp màn hình" — **SAI so code thật** (đã kiểm `git log` trước
khi sửa): `lib/cad/pdf.ts` từ lâu đã là **vector plot thật** (từng Entity vẽ lại bằng API hình học
jsPDF, không `addImage()`) — A0-A4 × ngang/dọc đã tách trục độc lập (`PAPER_SIZES_MM`/
`paperSizeMm`, `model.ts`) · **plot-to-scale 1:N thật** (`fixedScaleViewport`/`doc.printScale`,
`STANDARD_SCALES` gồm đủ 10/20/25/50/100/200/500) · lineweight ISO 128 mm-trên-giấy thật (không
nhân zoom) · khung tên `titleBlockPro` (`commands.ts`) đã có project/drawing/scale/author/date/
checker/studio — đã có 24+19 test cũ (`pdf-scale.test.ts`/`pdf-sheetset.test.ts`) pass sẵn.
**Việc thật còn thiếu** (đúng vùng `lib/cad/pdf*.ts`): (1) sàn bề dày nét mảnh nhất 0.03mm — DƯỚI
lineweight ISO 128 mảnh nhất (0.13mm), rủi ro mất nét khi in phổ thông → nâng lên
`MIN_PRINTABLE_LINE_MM=0.1mm` (1 điểm sửa, `setStroke()`); (2) "số tờ"/"phiên bản" trong khung tên
— thêm `sheetIndex`/`sheetCount`/`version` vào `CadPdfOptions` + `pdfFooterLine()` (hàm thuần),
`buildSheetSetPdf` TỰ điền theo đúng thứ tự `sheets[]`. **CHƯA nối được vào khung tên ENTITY thật**
(chỉ vẽ ở dòng ghi chú cuối trang) — `TitleBlockInfoPro`/`titleBlockPro` sống ở `commands.ts`,
ngoài vùng file P4 được giao; cần phiên khác thêm field `version` rồi nối UI mới đủ.
Test mới `lib/cad/pdf-print-fidelity.test.ts` (14/14) — **GIẢI MÃ byte content stream PDF thật**
(không chỉ tin `scaleLabel`): đúng nghiệm thu gốc tường 4000mm @ 1:50 trên A3 → đo được 80.00mm ·
cả 4 tỉ lệ 20/50/100/200 → 200/80/40/20mm đúng · nét khai 0.01mm vẫn in ra ≥ sàn an toàn (không
biến mất). `tsc --noEmit -p .` sạch, không hồi quy 2 file test cũ. KHÔNG đụng
`components/cad/*`/`CadSheets.tsx` (đúng chỉ đạo, nhường P2 multi-sheet Sheet[]).

## ✅ XONG (04/08 — SPEC-DUNG-BO-LENH-3D VIỆC 1+2: nối extrude+arrayLinear thật)
`ops[]` trước chỉ boolean chạy thật (27d8c6d) — extrude/arrayLinear mới khai TYPE. Nay nối THẬT cả
2: **extrude** (bevel vát cạnh trên) áp ở `lib/three/cad-to-obj.ts` `ObjBuilder.prismBeveled()` (cần
đa giác gốc `h.points`, làm TRƯỚC khi xuống triangle soup — khác boolean/arrayLinear chạy ở tầng
ba.js) + `insetPolygonMm()` co đa giác (chép cục bộ công thức `offsetEntity` hatch của
`geometry.ts`, TRÁNH kéo `lib/cad/store.ts` vào module "thuần TS không DOM"). **arrayLinear**
(nhân bản dãy) áp ở `lib/three/build-ops.ts` `resolveGroupGeometry()` — SAU boolean (khoét trước,
nhân bản sau, đúng thứ tự modifier stack) — `repeatGeometry()` nối N bản dịch theo `cadToThreeM()`
(tái dùng phép đổi trục có sẵn). `lib/cad/commands.ts` thêm `setEntityBevel`/`setEntityArrayLinear`
(sửa-tại-chỗ, không cộng dồn — khác `cutHoleInWall` cố ý cộng dồn) + `railingPosts()` (dựng 1 cột
qua `wallSegment()` + gắn arrayLinear, dùng cho nút "Lan can"). VIỆC 2: `Object3DInspector.tsx`
thêm `BevelAction`/`ArrayAction` cạnh `CutHoleAction` (chọn tường → panel phải) · `Command3DPanel.tsx`
mở khoá nút **"Lan can"** (tầng ⑥, gọi `railingPosts` qua `Render3DModeSkeleton.tsx`), 8 nút cấu
kiện còn lại đổi từ lý do chung "đợi ops[]" sang lý do ĐÚNG riêng từng mục (cửa/cửa sổ: đã dựng
được qua thư viện đồ, chỉ chưa nối nút này; cầu thang/tủ bếp: chưa có lệnh tham số tầng ⑥; phào chỉ:
cần sweep chưa có; trần thả: cần khối nổi chưa có cơ chế) — sửa luôn câu "sua" tab cũ SAI (nói
"Bevel... sắp có" dù không có nút bevel nào ở tab đó, bevel thật nằm ở Inspector). CHƯA CÓ tay vịn
ngang cho lan can (tường luôn đùn từ sàn z=0, chưa có khối nổi — ghi rõ trong code, không giấu).
Test mới: `commands.test.ts` (+26), `cad-to-obj.test.ts` (+5, bevel), `build-ops.test.ts` (+5,
arrayLinear+compose với boolean) — toàn bộ pass, `npx tsc --noEmit -p .` sạch, `npm test` chỉ còn
đúng 1 fail cũ đã biết (entityId nội thất, không liên quan). Verify browser thật (127.0.0.1:3000,
"Dự án mẫu"): bấm "Lan can" → 9 cột thật xuất hiện trong cây đối tượng · Inspector 3 nút Khoét
hốc/Vát cạnh/Nhân bản dãy đổi nhãn đúng theo state · gộp cả 3 ops (boolean+extrude+arrayLinear)
trên cùng 1 entity không lỗi console — đã xoá sạch entity test khỏi "Dự án mẫu" sau khi verify
(qua `window.__cadStore.removeIds`, không đụng `setState` ghi đè).
🔴 **Hai phiên chung `.git` tái diễn**: 7/9 file việc này (mọi thứ trừ `STATUS.md` + 2 file test
`cad-to-obj.test.ts`/`build-ops.test.ts`) bị cuốn vào commit `a40adf2` "khoa duong ve dich 3 dot"
của phiên khác (họ `git add -A` thay vì giới hạn pathspec, đúng luật cấm ở `CLAUDE.md`). Đã verify
lại nội dung file thật khớp 100% (đọc code + chạy lại `tsc`/3 file test — sạch/pass) — KHÔNG mất
dữ liệu, chỉ lệch tên/nhãn commit. Không rewrite lịch sử.

## ✅ XONG (04/08 — mở rộng BOQ editor: quy cách/đơn vị · nhóm theo phòng · in A4 ngang)
BOQ editor UI **đã có sẵn từ trước** (`4991340`, B0-B6+B10, `components/present-editor/boq/*` —
STATUS.md cũ KHÔNG ghi việc này, chỉ phát hiện qua đọc `git log` trực tiếp) — không tạo bản song
song ở `components/boq/*`/`app/(boq)/*` như chỉ đạo gốc ghi, mà MỞ RỘNG bản có sẵn (đúng luật
"một cỗ máy nhiều mặt tiền"), KHÔNG đụng `lib/boq/*` (tầng tính). Thêm: 2 cột **Quy cách/Đơn vị**
(JOIN hiển thị theo `matId` qua `GET /api/specs`, `lib/present-editor/boq-spec-extra.ts`, MỚI) ·
**nhóm theo Phòng** (`groupBoqRowsByRoom`, `boq-group.ts` — tái dùng `findRoomLabels`/
`pointInPolygon` có sẵn, KHÔNG viết engine hình học mới; SUY ĐOÁN khi không dò được biên khép kín
→ cờ `inferred` lộ badge, đúng luật `SPEC-TANG-DU-LIEU-CAU-KIEN`) toggle song song với nhóm theo
Tầng cũ · **in A4 ngang** (`@media print` cô lập bảng, `@page{size:A4 landscape}`, đủ "in văn
phòng" — preset "gửi nhà in" +bleed/crop-marks CHƯA làm, B9 đầy đủ theo phiếu để sau). Tiện sửa
1 bug thật: `BoqErrorRows` colSpan hardcode=9 trong khi bảng lúc đó 8 cột (nay 10, export hằng
`BOQ_TABLE_COLUMN_COUNT` để không lệch lại) · phát hiện thêm `boq-group.ts` dùng alias `@/...`
nên `.test.ts` của nó **chưa từng chạy được** qua `sucrase-node`/`npm test` dù commit trước ghi
"27/27 pass" — đổi sang import tương đối theo đúng quy ước `boq-overrides.ts`.
Verify: `tsc --noEmit -p .` sạch · `boq-group.test.ts` 25/25 (thêm 15 ca phòng) · `boq-spec-
extra.test.ts` 13/13 (mới) · 4 file test `lib/boq/*` cũ vẫn xanh · browser thật (127.0.0.1:3001,
demo@if.local, "Dự án mẫu" → 2D Kỹ thuật → Trình bày → Bảng khối lượng BOQ): 10 cột hiện đúng thứ
tự, toggle Tầng↔Phòng không vỡ, không lỗi console liên quan BOQ. "Dự án mẫu" hiện **0 entities**
(sheet rỗng) nên chưa xem được số liệu thật/badge suy đoán trên UI — chỉ xác nhận cấu trúc không
vỡ, KHÔNG bơm dữ liệu test vào dự án mẫu (tránh lặp sự cố cũ). 1 lỗi console KHÔNG liên quan đã
thấy sẵn (`EditorCanvas.tsx` "Maximum update depth exceeded", chặng Trình bày mode Deck) — CHƯA
sửa, đúng §0d "không đụng Deck editor đang chạy", không phải do việc này gây ra.
🔴 **Hai phiên chung `.git` tái diễn LẦN NỮA** (giữa lúc code): làm việc xong phát hiện `git log`
đã có 2 commit MỚI của phiên khác (`39c55a5 wip`, `a40adf2 docs: khoa duong ve dich...`) **cuốn
theo toàn bộ file BOQ của tôi** (kể cả 1 bản sửa `boq-group.ts` họ tự làm thêm — đã đọc diff, TRÙNG
KHỚP với sửa alias tôi vừa làm, không xung đột) — **đã push lên `origin/main`** trước khi tôi kịp
biết. Không phải tôi chạy git, không mất nội dung (đã grep xác nhận file trên đĩa đúng), chỉ lệch
tên commit — không rewrite lịch sử. Không có gì để tôi tự commit thêm (đã nằm trong 2 commit trên).

## ✅ XONG (04/08 — sửa hero ProjectSelect chìm vào wallpaper tối)
`components/ProjectSelect.tsx` — hero (pill chào/tiêu đề/mô tả/2 nút "Chi tiết"·"Đồng bộ tiến độ"/
Vitals AI) trước đè `--t1`/`--t4` (token theo THEME) lên ảnh nền "ambient" (cover dự án đang
focus, carousel-only) → theme sáng làm `--t1` gần đen chìm mất chữ trên wallpaper tối. Fix: thêm
`heroPlan = useAdaptiveContrast(...)` (đo đúng vùng hero, `overlay` gộp đúng 2 lớp CSS ambient đã
đắp — brightness(0.5) + rgba(8,7,5,0.55) ⇒ alpha gộp 0.775), áp `adaptiveTextStyle(heroPlan)` cho
mọi chữ hero — CHỈ khi `showAmbient` (carousel), grid/mobile/reduce giữ nguyên token cũ (không có
wallpaper thì không cần thích ứng). Verify: `npx tsc --noEmit -p .` sạch, `npx tsx lib/adaptive-
contrast.test.ts` 28/28 pass. Browser thật (127.0.0.1:3000, demo@if.local): tái hiện bug trước
(ép `--t1` → chữ biến mất trên wallpaper tối, N3), rồi xác nhận fix (cream + shadow, đọc được) ở
CẢ 2 theme (light/dark, qua `window.__flowStore.setThemePref`) trên cùng ảnh thật `render_10.jpeg`.
Không đủ đa dạng ảnh thật trong dữ liệu demo (carousel bị kẹt `active` không tiến — nghi do poll
flows định kỳ reset index, KHÔNG liên quan fix này) nên bổ sung bằng toán đúng thuật toán production
(`readImageRegion` sampling) trên cả 5 cover thật có sẵn (`render_00/03/04/05/10`, luminance thô
0.209–0.449, độ rối 0.019–0.273) — composited luminance luôn ≤0.101 (trần lý thuyết 0.225 < ngưỡng
0.42) nên tone LUÔN là kem, đúng thiết kế lớp phủ tối cố định của ambient. Không tạo flow/dữ liệu
lạ trong `dev.db` (đã kiểm `createdAt` sau khi verify).

## ✅ XONG (04/08 — BA VIỆC UI: đường về Gallery · phím tắt tập trung · Lockscreen, `docs/SO-KIEM-TONG.md` §8)
- **VIỆC 1**: `HomeButton.tsx` (có sẵn, trước mồ côi) mount vào `AppChrome.tsx` cạnh logo + mục
  "Về Thư viện dự án" trong `AppLogoMenu.tsx` — cả 2 qua `goHomeConfirmed()` (`lib/resume.ts`),
  hỏi trước nếu còn thay đổi chưa lưu (`LeaveConfirmBar.tsx`, portal, không `window.confirm`).
- **VIỆC 2**: đăng ký phím tắt TOÀN CỤC mới (⌘0/⌘B/⌘L/⌃⌘Q) tập trung trong đúng effect có sẵn ở
  `AppChrome.tsx`. Đổi ⌘0→⌘9 (zoom fit CAD/Present/Photo) nhường ⌘0 cho "về Gallery". Bảng ⌘? nay
  liệt kê phím "chưa nối" MỜ + lý do thay vì giấu (`lib/shortcuts.ts` field `disabled/
  disabledReason`) — vd ⌘N đánh dấu chưa nối vì trình duyệt giữ cứng, kiểm kỹ không giả vờ chạy.
- **VIỆC 3**: Lockscreen kiểu macOS — `lib/lockscreen.ts` + `components/studio/LockScreen.tsx`
  (blur, đồng hồ sống, nhúng `LoginForm` có sẵn — mở khoá = đăng nhập lại, không tự chế mật
  khẩu/PIN) + `AppChrome.tsx` (⌃⌘Q, hẹn giờ tự khoá mặc định 15 phút, chặn phím khác khi đã khoá)
  + `components/settings/LockScreenSettings.tsx` (chỉnh số phút, nút "Khoá ngay"). Ép force-save
  TRƯỚC khi khoá (tái dùng `cad:force-save-request`/`present:force-save-request` có sẵn) — verify
  bằng RELOAD TOÀN TRANG sau khoá (khắt khe hơn unlock đơn thuần), dữ liệu còn nguyên.
- Bắt + sửa 2 lỗi ngay trong phiên trước khi báo xong: (1) lockscreen mồ côi trong header có
  `backdrop-filter` (containing block mới cho `position:fixed`) → portal ra `document.body`,
  đúng luật K4 đã có. (2) bộ chặn phím khi khoá thiếu guard `instanceof Element` cho
  `e.target` — vỡ khi test bằng `window.dispatchEvent` (target lúc đó là `window`, không có
  `.closest`); sửa xong còn phát hiện thêm cách test đó tự nó sai thứ tự capture/bubble, phải
  dispatch trên `document.body` mới đúng ngữ nghĩa phím thật.
- `npx tsc --noEmit -p .` sạch, `npm test` chỉ 1 fail cũ đã biết (không liên quan), không đụng
  `lib/cad/model.ts`.
- 🔴 **Hai phiên chung `.git` tái diễn**: code 3 việc này bị cuốn rải rác vào commit của phiên
  khác (`b7b5484`/`f77ce9d`/`9710611`/`c69c491`) — CHỈ VIỆC 2 (`e2f55d6`) là commit sạch của đúng
  phiên này. Đã đọc lại file thật để xác nhận nội dung ĐÚNG, không mất dữ liệu — chỉ lệch tên
  commit. Không rewrite lịch sử.

## 🟡 ĐANG CHẠY (04/08 — KHO VẬT LIỆU IF v1, VIỆC 1 xong — DỪNG theo lệnh, chờ Hoà trước VIỆC 2)
`docs/PHIEU-CODE-IF-KHO-VAT-LIEU-V1.md` VIỆC 1: thêm 4 cột `scope`/`ownerId`/`supplierId`/`verified`
vào `model ProductSpec` (`prisma/schema.prisma`) — khai chỗ cho kho 3 tầng, CHƯA code chức năng
`global`. `npx prisma validate` sạch. **CHƯA chạy migrate/db push/generate** — theo luật "KHÔNG
prisma db push/migrate qua sandbox" (mục Quy tắc session #4): lệnh soạn sẵn cho Hoà chạy máy thật
(xem cuối báo cáo phiên). Không đụng `components/cad/CadSheets.tsx`.

## ✅ XONG (04/08 đêm — ĐỢT 8 multi-sheet D2: GỠ TRẦN MAX_SHEETS, `b46fa30`, sổ §12; D3 HOÃN)
Hoà duyệt D2 + hoãn D3 (đổi định dạng file người dùng — chờ studio thật dùng thử mới làm).
D2: `SheetTabBar.tsx` prop `max` thành optional (không truyền = không trần) · `CadSheets.tsx`
3 chỗ · `PresentSheets.tsx` 9 chỗ (bỏ 4 `slice(0,5)` nạp/autosave/đĩa/import + thông báo vượt
trần + status) — đọc kỹ từng chỗ, không áp máy móc (Present mỗi sheet vẫn ôm deck, khác CAD).
Nghiệm thu browser thật (127.0.0.1:3002, dự án test riêng): CAD 13 tờ + Present 12 hồ sơ không
chặn/không chậm · `.idf` cũ 5 sheet mở đủ 5/5 entity (gộp 1 Doc đúng D1, thông báo rõ) · tsc
sạch · 22/22 + 13/13 test cũ pass · lỗi console duy nhất là bug CŨ `EditorCanvas.tsx` đã ghi sổ.
Rác cần Hoà dọn tay: 1 Flow test `cmser4yxk0001w97ydu3oy6je` trong `dev.db` (lệnh DELETE soạn ở
sổ §12). Nghi vấn NGOÀI phạm vi: click chuyển chặng Present→2D không điều hướng (phải hard-nav),
chưa rõ bug thật hay sandbox — ghi §12, chưa sửa.

## 🟡 D1 ĐỢT 8 (bối cảnh — đã xong từ trước, giữ ghi chú gốc)
`components/cad/CadSheets.tsx` + `components/cad/CadCanvas.tsx` — bỏ hẳn "hoán store" khi đổi tab
(mỗi sheet ôm 1 Doc riêng, K1 vi phạm) → `useCadStore` giờ giữ ĐÚNG 1 `doc`/`past`/`future` xuyên
suốt phiên; `sheets` chỉ còn metadata `Sheet`/`Viewport2D` (model.ts, Bước 1+2 cũ). Đổi tab = bay
camera tới `centerMm` viewport (sự kiện `cad:goto-box` mới, không đụng Doc). Verify browser thật
(dự án test tạo riêng, không đụng "Dự án mẫu"): vẽ tường ở tab 1 → sang tab 2 thấy ngay (tiêm qua
`window.__cadStore.addEntities()`, KHÔNG `setState({doc})` ghi đè) · Undo ở tab 1 xoá đúng thao tác
cuối dù thao tác đó làm lúc đang ở tab 2 → 1 dòng lịch sử chung, đúng AutoCAD.
**Quyết định tự chọn (chưa hỏi lại, xem lý do đủ trong code comment đầu `CadSheets.tsx`):** ĐỊNH
DẠNG LƯU (.idf/IndexedDB/.ifpack/backup) CHƯA đổi cấu trúc ở D1 — lý do: `lib/cad/cad3d-autosave-
core.ts` (autosave riêng mode 3D, vừa xong `d57067a`) đọc/ghi CHUNG bucket IndexedDB và có logic
"chỉ cập nhật đúng 1 sheet đang hoạt động, giữ nguyên sheet khác" — nếu D1 ghi N sheet cùng trỏ 1
Doc, logic đó dễ làm chúng lệch nhau rồi hồi sinh bản cũ khi gộp lại (rủi ro nhân đôi hình học).
An toàn hơn: LUÔN lưu/xuất ĐÚNG 1 sheet (tab đang mở, mang trọn Doc chung); nhiều tab UI trong 1
phiên CHƯA persist qua reload (session-only, việc D3). Mở `.idf`/cache CŨ có N sheet khác Doc (từ
trước luật này) → tự gộp về 1 Doc bằng `mergeIdfSheetsToDoc()` đã có + đã test, không rơi rớt entity.
`npx tsc --noEmit -p .` sạch · `sheet-migrate.test.ts` 22/22 · `cad3d-autosave-core.test.ts` 13/13
(test này verify ĐÚNG cái invariant D1 không được phá — pass nghĩa là mode 3D không bị ảnh hưởng).
**CHƯA LÀM**: D2 (gỡ trần `MAX_SHEETS=5` cả CadSheets + PresentSheets) · D3 (bump `IDF_VERSION` +
tách N sheet thật theo công thức offset Q1 khi mở file cũ, thay vì gộp về 1 như D1 đang làm tạm).

## ✅ XONG (04/08 — cửa/cửa sổ HOSTED, `d57067a`, chi tiết đủ trong message commit + `SO-KIEM-TONG.md` §7b)
- Nối dây `docs/SO-KIEM-TONG.md` §7 dòng "Cửa/cửa sổ HOSTED" (2D ⬜→✅, 3D 🟡→✅ khối cơ bản): `Block
  Entity.hostId` suy tự động qua `lib/cad/hosting.ts` `syncHostedOpenings()` (chạy sau mọi mutation
  doc) · xoá tường kéo theo xoá cửa/cửa sổ con (`expandDeleteWithHostedChildren`) · cửa sổ hết là
  khối kính chồng — sinh `BuildOp boolean subtract` thật vào `ops[]` tường chủ, kính chỉ còn tấm lắp
  lỗ · cửa có khung+cánh 3D (xám, không PBR). Đi qua đúng `ops[]`/`buildOpCutters` sẵn có (NC-12),
  không đường dựng thứ hai. 35 test mới, tsc -p . toàn repo sạch (tiện sửa 1 lỗi tsc có trước ở
  `Viewport3D.tsx`, không liên quan). Nghiệm thu browser thật: lỗ thật xuyên tường + cánh cửa nhô ra
  (ảnh chụp) · xoá tường → cửa/cửa sổ biến mất theo (state + màn hình).
- 🔴 **Sự cố rút kinh nghiệm** (không phải mất dữ liệu thật, xem §7b để đọc đủ): lúc tiêm doc test
  để verify, dùng `setState({doc:...})` GHI ĐÈ nguyên `doc` thay vì cộng thêm — xoá mất nội dung
  thật của "Dự án mẫu" trong cache IndexedDB **của trình duyệt sandbox** (đã xác nhận không đụng đĩa
  thật/`dev.db` — trình duyệt sandbox không nối file-handle nào, CAD sheet cũng không gọi API
  server). Luật rút ra: verify bằng tiêm store → luôn `addEntities()`, KHÔNG BAO GIỜ `setState({doc})`
  ghi đè trên route có autosave mount.

## ✅ XONG (03/08 đêm khuya muộn — NC-13 multi-sheet BƯỚC 1+2, DỪNG chờ Hoà duyệt trước bước 3)
- **BƯỚC 1**: khai kiểu đích `Sheet`/`Viewport2D`/`SheetTitleBlock` vào `lib/cad/model.ts` (cuối
  file, sau `fitScaleLabel`) — CHỈ KHAI KIỂU, chưa nơi nào dùng, `CadSheets.tsx` không đụng.
- **BƯỚC 2**: `lib/cad/sheet-migrate.ts` — bộ chuyển 1 chiều `mergeIdfSheetsToDoc()`: N sheet cũ
  (mỗi sheet 1 `Doc` riêng) → 1 `Doc` gộp (dịch offset xếp hàng ngang theo bbox thật, không chồng)
  + 1 `Sheet`/1 `Viewport2D` tỉ lệ 1:100 mặc định. Đổi tên id entity/markup/photo có tiền tố theo
  sheet (an toàn kể cả 2 sheet trùng id gốc), `ops[].withRef` (NC-12 boolean) ánh xạ lại đúng
  trong cùng sheet, layer dedupe theo id. `lib/cad/sheet-migrate.test.ts` — 22/22 test pass (không
  rơi rớt entity · không chồng nhau · id/ops remap đúng · layer dedupe · Sheet/Viewport2D sinh
  đúng hình dạng · sheet rỗng không crash · **`.idf` cũ đọc được nguyên vẹn qua `importIdf()` rồi
  mới đưa qua bộ chuyển, không sửa `idf.ts`**). `tsc --noEmit` toàn repo sạch.
- **DỪNG THEO YÊU CẦU** — KHÔNG làm bước 3 (đổi `SheetTabBar` đọc `Sheet[]`), bước 4 (gỡ
  `MAX_SHEETS`), bước 5 (bump `IDF_VERSION`). Lý do: bước 3 đổi kiến trúc UI lớn, cần Hoà nghiệm
  thu thiết kế trước khi động.

## ✅ XONG (03/08 đêm khuya — PHIẾU ĐỢT 7 chặng 3D: ViewCube thật + 3 lỗi UI + đối chiếu Revit)
- **Nhóm A** (`ccf9d46`): bảng "TRÌNH TỰ" kéo-thả tự do + thu gọn 1 dòng (khác nút ✕ = ẩn hẳn) ·
  chip Vitals StatusBar thêm viền/nền accent + chấm sống pulse 2s · thanh cuộn tối đúng cả 2 theme.
- **Nhóm B** (`68c6950`): **ViewCube 3D THẬT** thay SVG tĩnh cũ — `components/three/ViewCube3D.tsx`
  (renderer riêng 96×96, khối 26 vùng kiểu Rubik's cube, camera cube copy quaternion camera chính
  mỗi khung → xoay đồng bộ khi orbit) · bấm 1 vùng = bay camera tới bằng slerp ~350ms · kéo trên
  cube = orbit camera chính (giống SketchUp) · nhãn TRÊN/DƯỚI/TRƯỚC/SAU/TRÁI/PHẢI. `Scene3DViewer`
  xuất `Scene3DCameraApi` qua `cameraApiRef` làm cầu nối. Verify browser thật: orbit chuột → cube
  xoay theo · kéo cube → camera orbit · bấm mặt cube → bay tới top-down mượt, không lỗi console.
  **Không quay được gif** (không có công cụ ghi màn hình khả dụng ở surface trình duyệt chính;
  claude-in-chrome không nhận input trong sandbox phiên này dù đã thử nhiều cách) — bằng chứng thay
  thế là chuỗi screenshot trong transcript phiên.
- **Nhóm C** (`f796fef`): VIỆC C1 — bảng đối chiếu 6 cơ chế Revit (location line·cửa hosted·
  type/instance·tham số cấu kiện·level/tầng·constraint cao độ) × 2D/3D vào `docs/SO-KIEM-TONG.md`
  §7 — **cả 6 đều CHƯA ĐẦY ĐỦ ở cả 2 chặng**, điểm sáng duy nhất là `ops[]` boolean (NC-12) làm nền
  cho cửa hosted sau này. VIỆC C2 — nhóm nút "Cấu kiện" (đúng tầng ⑥ `SPEC-DUNG-BO-LENH-3D.md`)
  trong `Command3DPanel.tsx`: Tường (đã dựng, bấm được) + 9 mục còn lại (Cửa·Cửa sổ·Cầu thang
  thẳng/gấp/xoắn·Lan can·Phào chỉ·Trần thả·Tủ bếp module) mờ + tooltip đúng lý do, không ẩn/bỏ sót.
- `npx tsc --noEmit -p .` toàn repo SẠCH sau cả 3 nhóm, chạy NỀN (`run_in_background`) — KHÔNG bị
  timeout lần nào trong phiên này (3 lần chạy, mỗi lần vài chục giây). Sửa lại ghi chú cũ bên dưới
  (mục "🔴 PHIÊN SAU PHẢI BIẾT") — có thể do phiên trước chạy foreground bị cap 40-45s của Bash tool
  chứ không phải bản thân lệnh treo.

## 🟡 PHÁT HIỆN QUAN TRỌNG — đọc trước khi verify browser bất kỳ tính năng dùng `aiTier`/`credits`
`useFlowStore.hydrate()` (đọc `aiTier`/`credits`/theme từ localStorage) **CHỈ được gọi từ
`components/home/HomeScreen.tsx`**. Vào THẲNG URL con (vd `/present-editor`, hard reload/navigate
mới) → store luôn về mặc định (`aiTier=2`), BỎ QUA mọi thứ đã lưu trong Settings. Cách verify
đúng: mở `/` (hoặc để app tự resume) trước, RỒI điều hướng bằng click UI thật (client-side route,
không hard-navigate) sang trang cần test. Ghi vào TECH-DEBT nếu có ca thật user report "đổi mức
AI ở Settings không ăn" — nghi đúng nguyên nhân này (route không qua Home).

## ⬜ CHƯA BẮT ĐẦU (hàng đợi đã biết)
- Menu "3D — sắp có (Phase 3–4)" đã có sẵn trong header canvas (`ref` thấy khi verify) — CHƯA nối
  vào Scene3DViewer (3D-2..5 giờ đã xong hết, không còn "chờ mode" nữa) — việc nối menu này là việc
  UI riêng, chưa ai làm, xem trước khi động vào.
- V1.1 so le nội thất theo cửa chính · V2.1 look-at khoá điểm/khoá zone + panel chỉnh tốc độ/lens.
- Liên kết sống CAD→deck (moat) — sau P1-P3.
- Toàn bộ mục dưới "Chờ USER quyết" (chưa đổi) vẫn còn nguyên.

## 🔴 PHIÊN SAU PHẢI BIẾT
- **`.git/index.lock` stale LẦN 5** phiên này — hai phiên (tôi + code phụ) giờ **CHUNG 1 .git**,
  Hoà đã báo trực tiếp. Luật mới: commit theo CỤM NGẮN, không giữ lock lâu giữa các bước; nếu file
  đang STAGED sẵn (không phải của mình) → **dùng `git commit -- <pathspec>` giới hạn đúng file
  mình**, TUYỆT ĐỐI không `git add -A`/commit trơn (sẽ cuỗm cả staged của phiên kia).
- **`findHatchBoundary`** (`cad-to-obj.ts`, code CŨ) treo >2 phút ở mật độ phòng cực cao — né được
  trong bench 3D-1, ghi `TECH-DEBT.md`, chưa phải bug chặn.
- File scratch bench 3D-1 đã xoá sạch, ảnh test P3-2 đã xoá khỏi dự án mẫu, mức AI đã trả về
  "oneAI" (mặc định gốc) trước khi rời — dự án mẫu sạch, không còn dấu vết verify.
- 🟢 **ĐÍNH CHÍNH (03/08 đêm khuya, PHIẾU ĐỢT 7):** ghi chú cũ "`tsc --noEmit -p .` không chạy xong
  trong sandbox" — chạy **NỀN** (`Bash run_in_background:true`) thì XONG BÌNH THƯỜNG, không timeout
  (thử 3 lần, mỗi lần vài chục giây). Nghi vấn cũ chỉ đúng khi chạy FOREGROUND (Bash tool cap mặc
  định 40-45s không đủ cho lần compile đầu nguội cache). Tsc scoped (`tsconfig.scoped.json`) vẫn
  dùng tốt cho vòng lặp sửa nhanh, nhưng KHÔNG còn đúng là "buộc phải dùng vì -p . không chạy được".
- **2 file scratch KẸT lại, sandbox không xoá được** (FUSE, cùng loại cũ) — đã dọn rỗng nội dung,
  Hoà `rm` tay: `tsconfig.scoped.json` (tsc scoped tạm, xem trên) · `app/dev-bench-3d-2/page.tsx`
  (bench đo `captureSequence`, xem mục 3D-2 phía trên — CHỈ xoá SAU KHI đã chạy lấy số thật, đừng
  xoá trước).

## Worktree đang mở
- **`interiorflow-g4`** (nhánh `nhanh-g4`) — ĐÃ merge vào `main` (`12223cf`), nhưng KHÔNG xoá worktree:
  `git status` worktree này còn dirty (`​.claude/launch.json` sửa tay, chưa commit — thêm entry dev
  server `interiorflow-g4` port 3004) VÀ có dev server đang chạy thật ở port 3004. Thiếu 2/4 điều
  kiện an toàn (`CLAUDE.md` mục "Dọn cuối phiên") → giữ nguyên, chủ dự án quyết khi tiện.

## Nợ kỹ thuật
→ `docs/TECH-DEBT.md`.

## Chờ USER quyết
- **4.1.f thi công** (đổi hình dạng `brand-kit.json`) · **`knowledge/ttt-design-system/`** vi phạm
  LUẬT TRUNG TÍNH · **④ `FlowVersion`** không phải thủ phạm `dev.db` phình · **NT1/NT5**/**T3/T4**
  dời sau · **Figma** MCP lỗi, đường vòng đã có · **DWG** hướng GPL chưa chốt + `2.1.6.d` gốc đã
  vá (timeout/tiến độ/lỗi rõ) + "Huỷ = bỏ rơi worker" ĐÃ SỬA theo hướng Hoà chốt, nhưng 🔴 nghiệm
  thu "<1s" chưa đo được + phát hiện `terminate()`/đóng tab đều KHÔNG cắt được vòng WASM nặng —
  xem `SO-KIEM-TONG.md` §11d, chờ Hoà chọn 1 trong 3 hướng tiếp · Treo: VIỆC 4 cũ, #14, Xlsx probe · 3 nhánh
  `worktree-agent-*` merged còn local · Sprint BOQ ĐỢT 3 greenlight sau ĐỢT DEMO ·
  `2.2.16-2.2.21`/12 file SPEC-TỔNG §9/`2.2.83` chưa quyết. Chi tiết → CHANGELOG/`IF-FEATURE-TREE.md`.

## Quy tắc session
*(worktree/LUẬT NỀN TẢNG → `CLAUDE.md`. Chi tiết đầy đủ → memory: `feedback-docs-never-overwrite`,
`feedback-verify-before-trust`, `project-ben-doc-bundle-workflow`.)*
1. Không tự merge/push **main** nếu chưa hỏi.
2. **LUẬT MÁU verify browser**: qua `127.0.0.1:<port>` (KHÔNG `localhost`); KHÔNG logout/xoá cookie.
3. Login demo: `demo@if.local` / `demo1234`.
4. **KHÔNG `prisma db push`/`migrate` qua sandbox** (FUSE chặn khoá file SQLite) — soạn lệnh sẵn
   cho Hoà chạy máy thật. Backup: `sqlite3 dev.db ".backup 'ten'"`, không `cp`. Chi tiết →
   `docs/00-CHOT.md` mục "LUẬT VẬN HÀNH".
5. **Hai phiên chung `.git`** (mới 02/08) — commit cụm ngắn, `git commit -- <pathspec>` khi có
   file staged của phiên khác, không giữ lock lâu.


</details>

## 12/08/2026 — Đợt 2 & 3 & phiên dài (chuyển từ STATUS để giữ <800 từ)

- **12/08 rạng sáng (đợt 2, 4 agent + audit):** né nhãn v2 đạt trọn luật (dim ra ngoài nhà 2 lớp, WC/BẾP leader chuẩn nghề — PDF soi mắt độc lập) · Story Set v1 (hero output 8 trang, thẻ đầu gallery hồ sơ, ảnh Unsplash verify 200) · Bảng khởi tạo dự án (ProjectProfile model+API + Scaffolder gợi ý theo loại hình kèm căn cứ, việc gieo mang TaskContext) · Kho THẬT (Library đọc LibraryAsset, FM bỏ mock, 17 seed minh hoạ tải offline, gỡ --undo). Đợt 1 đã push origin (65fb168).
- **12/08 đêm (phiên dài, 4 agent + audit mắt):** xuất 2D đạt LUẬT (tỷ lệ bắt nấc 1:50, khung tên 9 ô sạch jargon, né nhãn v1 leader, gate CHUAN_DAU_RA trong dialog xuất) · Material Impact preview (hỏi trước khi áp, số thật 6 nơi tiêu thụ, undo giữ nguyên) · TaskContext (stage/workspace/entity + migration + chip chặng deep-link) · ThinkDial 4 nấc (Nghiên cứu nối RAG notebook) · LightArc + PresenceRow. Luật mới CHUAN-DAU-RA-NGHE.md: nghiệm thu = MỞ FILE ĐẦU RA.
- **12/08 chiều (ĐỢT 3, mô hình T trọn 8 bước, 5 agent song song 14ph24s, V độc lập bắt 1 lệch đã vá):** tool-state 3D (dock 12→8 nút sống + Tool3DBar) · thang bo áp v1 (498→442) · TaskContext khép 2 chiều cả 3 chặng · Home = Tổng quan dự án · backup offsite.

## 11/08/2026 — các mục "Vừa xong" chuyển từ STATUS (12/08, giữ STATUS <800 từ)

- Handoff tổng hợp: `docs/HANDOFF-CODEX-2026-08-11.md` + `docs/HANDOFF-KIEM-TONG-2026-08-11.md`. Canvas bỏ nền trang trí, giữ dot grid `--dots`; minimap góc phải trên; toolbar đáy theo bề rộng canvas.
- R1 hardening: Electron bind `127.0.0.1`; snapshot DB+uploads trước đổi schema; lỗi schema chặn khởi động + log; auto-update opt-in; key/config trong userData; `npm run release:preflight` + `docs/RELEASE-CHECKLIST-INTERNAL.md`.
- Build bỏ Google Fonts (font cục bộ + fallback OS); cảnh báo `unpdf` theo dõi riêng.
- Metadata desktop/PWA trung tính.
- Sửa giật viewport 3D: LightRig memo; render khi cảnh/camera đổi; ViewCube redraw khi xoay; DPR giới hạn Retina. Dev cache lỗi chunk → production build thay Fast Refresh.
- 3D Scene giữ entityId/levelId/typeId/provenance; RoomEntity nguồn phòng ưu tiên; floor/ceiling preview đánh dấu dẫn xuất.
- Present: Material A3 editor thật lưu `.idfp`; Văn bản/Video khoá lý do năng lực; ma trận `docs/OUTPUT-CAPABILITY-MATRIX-INTERNAL-2026-08-11.md`.
- Wallpaper aura procedural; Visual Vitals 3 quỹ đạo oval, tắt khi giảm chuyển động.
- Master Library Khám phá/Nổi bật + spotlight ngữ cảnh; "Top tuần này" là minh hoạ.
- Photo Editor Crop thật (raster/mask/document + undo/redo); perspective correction chưa UI.
- 3D shell dọn nhẹ: bỏ checklist che canvas; ViewCube 76px; Tường hai điểm ghi về Doc; gizmo giữ cặp tường liên kết.

## 12/08/2026 khuya — ĐỢT 4 (chuyển từ STATUS 13/08)

- T điều phối, 4 agent song song ~15-19ph, audit + verify browser từng cụm: Công Thức Khối build-recipe (BuildRecipe stack non-destructive, d0b0c13) · Thẻ DNA Thiết kế (DistillEngine generic + 8 lớp + JSON per-project, b0327cc) · Gallery liên ngành /library/gallery (tag nganh/license/nguon/bosuutap, chặn Pinterest, 5662b9f) · TableDocEngine + docType "Bảng thống kê" (b5feacb). tsc 0 · frontier 34/25/0 · hinh-hoc giữ 442. Dọn 3 dev server cùng thư mục về 1.

## 13/08/2026 — Đợt 5 + Dogfood #1 + chuỗi nền móng (chi tiết, STATUS giữ tóm tắt)

Đợt 5: Home Dòng Studio v1→v4 (3 lần Hoà lật: cuộn 2 trang → bento → co-giãn-theo-độ-dày-dữ-liệu; card dự án + ngăn Nháp; Đồng hồ ánh sáng giờ thật; MaterialSphere; cấm seed lên Home) · dọn giao diện v2 (radius 442→335, từ điển mocks 77→0, đủ 5 token mật độ) · PanelFlank phát hiện có sẵn từ 07/08 (sổ sai marker) · bench hiệu năng tất định (pickHatchFace O(N²) hatch.ts:502; recipe 10 bước ×660 tam giác). Dogfood #1 (task ST5): Smart Convert PDF bậc 1 (unpdf, 47 test, fix detached ArrayBuffer, verify browser 1→3 slide) · sửa nóng F1 (TaskFirstStart, toolbar nhóm Hình/⋯, banner→toast, cột phải theo nội dung) · fix F2 (CONTROL_GUIDANCE_DEFAULT 3.5 + controlImageSize ≤1024 bội-8) · làn máy 15+ job fal ra bộ render giao Hoà (sảnh thang v6 khoá sắc độ 3 lớp · hành lang v5 ombre · cab wireframe 2 view) · findings F1-F5 + 2 chế độ tham khảo + khoá sắc độ 3 lớp vào spec node tổng. Nền móng: TRIET-LY-IF (T0-T8+N1-N2+Đ1-Đ6) · P2 HOP-DONG (bước-0/thẻ vai/phân loại) · SPEC-GROUNDED-RENDER chốt (6 bước, entry grounded-render) · REVIEW-DONG-BO-CO-CHE (ProposalSheet·RegionId·Núm-stack·PostGate·SuggestBlend thành luật soi) · SPEC-HOME-BENTO-V5 + phác chờ duyệt · BAN-THIET-KE-HE-THONG (16 mục: 3✅10🟡3❌; đề xuất P5 FeatureContract-máy, P6 IF-RNA) · DOI-CHIEU-3-TRUONG-PHAI · NC-GU-BENTRAN + NC-HOME-CAM-NHAN + NC-HOME-DELIGHT. Ingest 5 ảnh ST5 vào kho (license:user). Commits chính: cf3b5ec d00de01 e16546f + chuỗi docs.

## 13/08/2026 tối — Đợt T: P3 Hệ Luật Thao Tác + Grounded Render v0 (2 agent song song)

- **P3 he-luat-thao-tac** (LT): `scripts/thao-tac-registry.mjs` kho 36 luật (17 grep + 19 mắt) chưng cất từ ~10 spec UI, mỗi luật có nguồn + tội danh 1-7 [N1][Đ5]; `scripts/soi-thao-tac.mjs` + `npm run soi:thao-tac` (3 kiểu điều kiện, exit 1 khi lệch, nợ mắt nhóm theo tội danh); `docs/HE-LUAT-THAO-TAC.md`. Lần chạy đầu bắt 5 lệch THẬT có sẵn trong code app (Webkit prefix 18 file · focus-visible 31 · keydown né ô nhập 12 · chữ "tự động" 17 · hex inline 193) = HÀNG ĐỢI SỬA đợt sau, chưa vào gate kết phiên (tiền lệ tu-dien 81→0). T phán: không chế marker miễn trừ cho ca Escape-only, chấp nhận nợ liệt kê.
- **grounded-render v0** (GR): `lib/grounded-render/` (types phiếu 4 cấp cờ inferred/verified + RegionMask id theo RegionId · reference-sheet nối VLM thật qua `captionImage` nvidia.ts + DistillEngine làm mặt tiền · region-inpaint tái dùng task materialSwap/FLUX Fill, guidance IMPORT hằng F2 không chép số, thiếu mask = lỗi cứng); 2 node `ai.refsheet` "Phiếu đọc tham khảo" (nhóm Gu) + `ai.regionrender` "Render bám ý (mảng)" (nhóm Dựng ảnh) — CỬA DUYỆT PHIẾU trước khi được chạy mảng [T5]. 41 test mới, suite cũ 0 vỡ. Khai thật: phiếu cấp ②④ là khung chờ (route vision chưa nhận prompt 4 cấp); v1 bảng ánh xạ + SAM2, v2 metrology còn chờ.
- Sổ: ghi bù 2 entry P3/P4 (`he-luat-thao-tac`, `goi-ho-so-song`) đã chốt 13/08 mà chưa vào registry (sổ-quên tự bắt) · vá trung tính `lib/home/greeting.ts:34` comment "Detech Complex" (check:chot 1 vi phạm chặn → 0) · map 2 node mới vào `lib/nodes/groups.ts` · 2 phiếu giao tự chứa `docs/phieu-giao/` + 2 báo cáo agent `docs/bao-cao-phien/`.
- Kết: tsc 0 · frontier 47 xong-MÁY/29 chờ/0 lệch · hinh-hoc 0 · tu-dien 0 · check:chot 0.

## 13/08/2026 đêm — Đợt T #2: P4 Gói Hồ Sơ Sống v0 + sửa lệch thao-tac đợt 1 + Lô duyệt mắt #1

- **P4 goi-ho-so-song v0** (HS, `db21536`): lib/ho-so-song (manifest v1 kênh+sha256 WebCrypto+provenance · packHoSoSong jszip nhận artifact từ đường xuất sẵn có · viewer index.html TỰ CHỨA: JSON nhúng script tag né fetch-file://, 0 mạng ngoài khoá bằng test regex, tone kem editorial song ngữ, kênh vắng khai thật); điểm cắm Toolbar Trình chiếu "Gói Hồ Sơ (.zip)". 22 test. T mở gói mẫu bằng mắt: đạt (1 vết fixture: title lặp cụm tên — dự án thật không bị). NỢ: kênh PDF chờ export.ts biến thể trả Blob; đề xuất treo: viewer làm mặt tiền chung xem-gói cho Story Set/.idfc.
- **Sửa lệch thao-tac đợt 1** (TT, `eebb654`): 41 chỗ 3 luật — 17 file Webkit prefix (0 đổi blur) · 5 guard né ô nhập + 5 ca esc-only (phán quyết T: Escape = lệnh đóng, luật thêm esc-only vào mauThieu) · 16 nhãn "tự động" → đúng nghĩa từng chỗ (Theo hệ thống · định kỳ · Vừa khổ giấy · Tự nhận loại · Magic chọn vùng). 7 chỗ present-editor NHƯỜNG (HS làm song song). soi:thao-tac 3 luật mục tiêu sạch ngoài phần nhường; còn focus-visible + hex inline = hàng đợi mắt-design.
- **Lô duyệt mắt #1** (`docs/duyet-mat/LO-1-2026-08-13.md`): 49 mục xong-MÁY gộp 7 trạm ~20 phút (Trạm 0 = 9 mục nền đề xuất flip thẳng), phản hồi theo trạm, T flip loạt — cơ chế §8.1 lần đầu chạy thật.
- Kết: tsc 0 · frontier 49 xong-MÁY/27 chờ/0 lệch · hinh-hoc 0 · tu-dien 0 · check:chot 0 · npm test 0 fail.
