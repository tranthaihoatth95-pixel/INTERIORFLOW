# Báo cáo P-A · Đơn vị đo + Tỉ lệ cấp toàn app

## 0 · SỰ CỐ WORKTREE LỆCH MỐC — vì sao có HAI lần chạy phiếu này

**Lượt 1 (16/08 sớm hơn):** worktree `agent-a54fc5a8884c021bd` được giao đứng ở commit `b9d8ad1`
(12/08), lệch main **167 commit / 4 ngày**. Ô ⓪ TIỀN ĐỀ phát hiện 6 tài liệu/component mà chính
phiếu này yêu cầu đọc/dùng (`docs/CHOT-PHIEN-15-08-CAN-SOAT.md`, hai file NT-1..18/KB-1..4,
`docs/TRIET-LY-IF.md`, `components/ui/ToolbarChip.tsx`, và cả chính file phiếu) **không tồn tại**
trong worktree — DỪNG NGAY theo luật ⓪, không code gì, chỉ nộp báo cáo bằng chứng. T xác nhận lỗi
là do worktree cắt không đúng mốc và đã fix: `git log` cho thấy worktree nay đứng đúng `4206851`
(HEAD của main lúc giao lại phiếu). Báo cáo lượt 1 T đã copy giữ ở nơi khác, không mất.

**Lượt 2 (báo cáo này):** phiếu giao lại NGUYÊN VĂN, làm lại từ ô ⓪. Toàn bộ nội dung dưới đây là
kết quả lượt 2 — đã có đủ hạ tầng, đã hoàn thành ④→⑨.

⚠️ **Phát hiện thêm ở lượt 2, tự xử lý không cần dừng**: worktree đứng đúng commit nhưng
`node_modules/` **không tồn tại** (rất có thể do worktree được DỰNG LẠI TỪ ĐẦU thay vì fast-forward
— hợp lý với việc 6 file trước đó thiếu hẳn). Đã chạy `npm install` (901 gói, 21s) để có `tsc`/test
runner — đây không phải lệnh git, không phải dev server, không nằm trong 2 điều cấm của phiếu.

---

## 1. Tổng quan

Đã dựng đủ hệ **đơn vị đo + tỉ lệ cấp toàn app** theo phiếu: 3 file lib thuần (`formatLength`/
`parseLength`/dãy tỉ lệ chuẩn), 1 hook localStorage per-user, 1 màn cài đặt `Cài đặt › Đơn vị & Tỉ
lệ` port từ mock đã tự vẽ và tự kiểm 2 theme trong browser. Ràng buộc cứng A7 (lưu trữ luôn là mm)
giữ nguyên — không đụng schema/DB. tsc sạch · 41/41 test `lib/units` pass · `soi:tu-dien` 0 lệch ·
`soi:hinh-hoc` không dính file mới. **DesignSync không có trong bộ công cụ của phiên này** (đã
`ToolSearch` 2 lượt, không ra tool) — mock đã dựng đủ 2 theme tại `docs/mocks/`, KHÔNG đẩy lên
claude.ai/design được, khai thật ở đây theo đúng luật fallback.

## 2. Chi tiết có bằng chứng

### 2.1 · Ô ⓪ TIỀN ĐỀ — lượt 2, worktree đã đúng mốc

| # | Tiền đề | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | "unitSystem/metric-imperial grep=0, mm gõ cứng, 7 màn settings không có màn đơn vị" | **XÁC NHẬN** | `grep -rn "unitSystem"` trước khi code = 0 dòng · `ls components/settings/` = đúng 7 file cũ (AccountSettings·AiDependencySettings·AppearanceSettings·ExperienceSettings·GuModelSettings·LockScreenSettings·StorageSettings) |
| 2 | "Tỉ lệ chỉ ở khung tên/xuất PDF + nút Tỉ lệ thanh 2D, không cài đặt cấp app" | **XÁC NHẬN** | `lib/print/export-checks.ts` dùng tỉ lệ nhưng không phải màn cài đặt; `lib/cad/model.ts:1094-1134` có sẵn `STANDARD_SCALES`/`PRINT_SCALE_STEPS`/`isStandardPrintScale`/`snapPrintScale`/`suggestStandardScale` nhưng KHÔNG nơi nào cho người dùng CHỌN tỉ lệ mặc định cấp app |
| 5 file bắt buộc đọc/dùng | **ĐỦ CẢ 5** | `test -f` từng file: `docs/CHOT-PHIEN-15-08-CAN-SOAT.md` ✓ · `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` ✓ · `docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` ✓ · `docs/TRIET-LY-IF.md` ✓ · `components/ui/ToolbarChip.tsx` ✓ (165 dòng, đọc trọn) |

**Đính chính nhỏ theo chỉ đạo của T (mục 2 lệnh giao lại)**: `lib/idfc-import/chuan-net.ts:1202`
KHÔNG tồn tại đường dẫn đó — grep thật ra chỗ mm gõ cứng: `lib/cad/store.ts` nhiều điểm mặc định
`heightMm: 2500`, `lib/cad/model.ts` các hằng `DEFAULT_PDF_MARGIN_MM`, và chuỗi `'mm'` cứng rải rác
trong dimension text ở `lib/cad/` (không phải một dòng đơn, mà là MẪU HÌNH lặp lại đúng như tiền đề
1 mô tả tổng quát — không có một file đơn lẻ nào là "trung tâm" của vấn đề, đúng lý do phải làm
`formatLength`/`parseLength` MỘT NGUỒN thay vì vá từng chỗ).

### 2.2 · Ô ② ĐỌC TRƯỚC — đã đọc, trích áp dụng

- `docs/00-CHOT.md` mục 15/08 "ĐƠN VỊ ĐO + TỈ LỆ..." + `CHOT-PHIEN-15-08-CAN-SOAT.md` A7: **ràng
  buộc cứng lưu trữ luôn mm** — áp bằng cách `formatLength(mm,...)`/`parseLength(str)→mm`, không
  hàm nào trong `lib/units/` ghi ngược vào entity/Doc.
- `docs/CHUAN-DAU-RA-NGHE.md:16`: dãy tỉ lệ chuẩn 1:1·1:2·1:5·1:10·1:20·1:25·1:50·1:100·1:200·1:500
  — TRÙNG KHỚP 100% với `PRINT_SCALE_STEPS` đã có ở `lib/cad/model.ts:1102` (`[1,2,5,...STANDARD_SCALES]`
  với `STANDARD_SCALES=[10,20,25,50,100,200,500]`). ⇒ **tái dùng thẳng, không định nghĩa dãy thứ
  hai** (`lib/units/scale.ts` import từ `lib/cad/model.ts`, không viết số nào mới).
- `components/settings/` 7 màn hiện có: học đúng khuôn `<section>` + `useT()` (`AppearanceSettings.tsx`,
  `ExperienceSettings.tsx`) — `UnitsScaleSettings.tsx` port THEO khuôn này, không chế khuôn mới.
- NT-1..18/KB-1..4 (hiến pháp giao diện): áp NT-8 (icon luôn có nhãn — mọi icon trong màn đều có
  chữ đi kèm) · KB-1 hình dạng chip/pill capsule · thang bo `6/10/14/20/999` (`app/globals.css:68-72`)
  · `var(--tap)`/`var(--tap-lg)` cho cỡ chạm — grep xác nhận `--r-1..4`/`--tap` đúng số trước khi
  dùng, không đoán.

### 2.3 · Ô ④ VIỆC — đủ 5 mục

| # | File | Nội dung |
|---|---|---|
| 1 | `lib/units/index.ts` (134 dòng) | MARKER `unitSystem` — `UnitId` = mm·cm·m·in·ft-in, `formatLength(mm,opts)`, `parseLength(str,opts)→mm\|null`, `groupThousands()` (cách nghìn bằng khoảng trắng — bắt được 1 lỗi tự vi phạm luật design, xem §5) |
| 2 | `lib/units/scale.ts` (35 dòng) | MARKER `SCALE_CHUAN` — re-export `PRINT_SCALE_STEPS` từ `lib/cad/model.ts` (KHÔNG đụng file đó, chỉ import), `isValidScale()`, `chooseNearestScale()` = wrap `snapPrintScale` có sẵn, `formatScale()` |
| 3 | `lib/units/settings.ts` (74 dòng) | `useUnitsSettings()` — hook localStorage `interiorflow.units_v1`, đúng khuôn `app/settings/_lib/local-state.ts`. Lưu {displayUnit, inputUnit, defaultScale} — KHÔNG lưu số đo, không bảng DB mới |
| 4 | `components/settings/UnitsScaleSettings.tsx` (214 dòng) + wire vào `app/settings/_components/PixelSettingsShell.tsx` (+2 dòng: import + `<UnitsScaleSettings />` trong nhóm "Nâng cao") | Màn giao diện — xem ô ⑤ |
| 5 | `lib/units/units.test.ts` (171 dòng, **41 ca** — vượt tối thiểu 20) | round-trip mm→hiện→gõ lại→mm (cm/m/mm-số-lớn/inch có dung sai) · feet-inch `5'6"` đúng nguyên văn phiếu · tỉ lệ lẻ bị từ chối (`isValidScale(47)===false`) |

### 2.4 · Ô ⑤ GIAO DIỆN — mock trước, code sau, cả hai đã tự kiểm

1. **DesignSync**: `ToolSearch(query:"select:DesignSync")` → không khớp. `ToolSearch(query:"DesignSync
   claude design mcp write_files")` → không khớp (trả về Figma/Netlify MCP khác, không phải
   DesignSync). ⇒ **Tool không có trong phiên này** — không phải lỗi xác thực, mà server đó không
   được kết nối cho phiên phụ P-A. Đã dựng mock HTML đầy đủ tại `docs/mocks/mock-cai-dat-don-vi-ty-le.html`
   thay thế, đúng fallback được chỉ định.
2. **2 theme sáng/tối, icon lucide-tương-đương (SVG path Lucide chép tay), màu qua CSS var** — tự
   kiểm bằng browser: chụp cả 2 theme (nút "Đổi Sáng/Tối" ở mock), cả hai đọc được, tương phản tốt.
3. **Nội dung màn đúng yêu cầu**: chọn đơn vị hiển thị (5 chip mm/cm/m/in/ft-in) · chọn cách nhập
   (5 chip riêng biệt) · dãy tỉ lệ chuẩn 10 nấc với 1:50 làm mặc định · **ô xem trước sống** — đã tự
   test bằng `computer` tool: bấm "Feet-inch" ở nhóm hiển thị, preview đổi NGAY từ "3 250mm" →
   "10′7.95″" không cần reload.
4. **Test lỗi nhập**: gõ "abc" vào ô thử → hiện khung viền đỏ + `role="alert"` + câu lỗi theo khuôn
   ux-copy (cái gì sai + cách sửa) — chụp màn xác nhận đúng hành vi trước khi port sang code thật.
5. **Đã lưu `docs/mocks/mock-cai-dat-don-vi-ty-le.html`** — KHÔNG đẩy lên Claude Design được (mục 1).
6. **Code giống mock**: `UnitsScaleSettings.tsx` port 1:1 cấu trúc 3 nhóm + preview + ô thử của mock,
   chỉ đổi khuôn CSS (Tailwind arbitrary var thay vì `<style>` tay, đúng khuôn các file
   `components/settings/*.tsx` khác) — không thêm/bớt tính năng so với mock.

**Lỗi mock bắt được TRƯỚC KHI CODE** (đúng yêu cầu ⑨ "ghi rõ đã sửa gì"): số đo trong ô xem trước
ban đầu in **"3.250mm"** (dùng `toLocaleString('vi-VN')` — dấu CHẤM ngăn nghìn). Vi phạm thẳng luật
"Luật bất biến #3" của `docs/IF-design-system-seed.html`: *"cách nghìn bằng khoảng trắng: 5 200"*.
Đã sửa cả mock (hàm `groupThousands()` tay) và code thật (`lib/units/index.ts` cùng hàm, dùng CHUNG
1 lần, không viết 2 công thức khác nhau).

### 2.5 · Ô ⑨ — 3 skill đã dùng, kết quả

- `design:ux-copy` (đọc TRƯỚC khi vẽ mock): áp khuôn "structure lỗi = cái gì sai + tại sao + cách
  sửa" cho thông báo lỗi nhập liệu; nhãn nút/nhóm dùng động từ/danh từ ngắn, không jargon nội bộ.
- `design:accessibility-review` (chấm mock TRƯỚC khi nộp) — bắt + đã sửa từ lúc dựng (không phải vá
  sau): `role="radiogroup"`/`role="radio"` + `aria-checked` cho mọi dãy chip (WCAG 4.1.2 name/role/
  value) · `<label htmlFor>` thật cho ô gõ thử, không placeholder-làm-label (WCAG 3.3.2/1.3.1) ·
  `aria-live="polite"` cho mọi vùng số đổi theo lựa chọn (preview + kết quả gõ thử) · `role="alert"`
  cho câu lỗi · `:focus-visible` viền accent 2px thay cho outline mặc định bị tắt (WCAG 2.4.7) · cỡ
  chạm `var(--tap)` = 32 desktop/44 cảm ứng cho MỌI chip (WCAG 2.5.5).
- `design:design-critique` (5 trục, tự chấm mock): hierarchy rõ (h1 > nhãn nhóm chữ hoa nhỏ > nội
  dung) · consistency PASS (tái dùng đúng `.chip`/`.field`/`.glass` đã có trong seed, không chế
  token mới) · usability PASS (preview sống, không cần bấm "Áp dụng") · 1 điểm MODERATE tự nhận: 5
  chip trên 1 hàng có thể xuống dòng ở màn hẹp — chấp nhận được vì `flex-wrap` đã xử, không phải
  lỗi chặn dùng.

## 3. Tổng kết lại vấn đề

Hệ đơn vị đo/tỉ lệ trước phiếu này thật sự **không tồn tại ở cấp app** — mọi nơi tự mặc định mm,
không ai chọn được inch/feet, và tỉ lệ chuẩn tuy đã có sẵn thuật toán tốt (`snapPrintScale` ở
`lib/cad/model.ts`) nhưng chưa có nơi cho người dùng THẤY và CHỌN. Phiếu này lấp đúng khoảng trống
đó bằng CÁCH TÁI DÙNG tối đa: không viết lại thuật toán tỉ lệ (chỉ wrap), không chế khuôn UI mới
(port từ `AppearanceSettings.tsx`), không đụng schema lưu trữ (A7 giữ nguyên). Điểm khó nhất không
phải thuật toán quy đổi (đơn giản) mà là **giữ đúng luật hiển thị số** (cách nghìn bằng khoảng
trắng) — và chính việc dựng mock trước, tự kiểm bằng browser thật, đã bắt lỗi đó trước khi nó lọt
vào code, đúng tinh thần "Ship-trước-sửa-sau, hậu kiểm trên app thật" nhưng còn RẺ HƠN vì bắt ở
bước mock, chưa cần chạy app thật.

## 4. Đánh giá khách quan

**Tốt:**
- 41 test bao phủ đủ 3 yêu cầu bắt buộc (round-trip · feet-inch · tỉ lệ lẻ), có cả ca "làm tròn
  tràn" (23.999in → không in ra "1′12.00″" vô nghĩa).
- Không tạo nguồn sự thật thứ hai cho tỉ lệ — rủi ro lớn nhất bị né (đúng bài học "5 sổ lệnh song
  song" ghi trong `00-CHOT.md` 15/08).
- Accessibility làm CHUẨN NGAY TỪ ĐẦU cho một màn nhỏ, đúng gợi ý của chính phiếu (ô ⑨: "rẻ hơn vá
  sau") — trong khi 2 lệch `soi:thao-tac` toàn app (31 file thiếu `focus-visible`, 193 hex inline)
  là NỢ CŨ, file mới của tôi không góp thêm vào cả hai.

**Chưa tốt / rủi ro:**
- **KHÔNG verify được UI thật trên browser** — `preview_list` cho thấy server `localhost:3000` đang
  chạy nhưng `cwd` là repo CHÍNH (`/Users/tranben/Downloads/interiorflow`), không phải worktree của
  tôi, nên mở nó ra sẽ KHÔNG thấy `UnitsScaleSettings` (code chỉ có trong worktree này). Phiếu cấm
  tôi tự mở dev server. ⇒ Component đã qua tsc + đọc lại kỹ so với mock đã kiểm, nhưng CHƯA có ảnh
  chụp màn hình THẬT của `/settings` với thẻ mới — đây là khoảng trống thật, ghi rõ ở ⑦b.
- `npm test` (không lọc — script không hỗ trợ đối số) chạy TOÀN REPO exit 1 vì **4 file `lib/server/
  *.test.ts` lỗi `PrismaClientInitializationError`** (thiếu `.env`, worktree chỉ có `.env.example`)
  — hoàn toàn NGOÀI vùng file ③ của tôi (không đụng `prisma/`), và là nợ đã ghi nhận trước đó ở
  `00-CHOT.md` ("gốc rễ Prisma không tự nạp .env trong worktree"). `lib/units` tự nó 41/41 pass.
- DesignSync không dùng được — mất lớp duyệt-mắt-sớm trong pane Claude Design mà Hoà mong muốn
  (luật 16/08). Mock vẫn là nguồn sự thật trong repo, nhưng T/Hoà phải mở file HTML tay thay vì
  pane web.

## 5. Nhiều hướng xử lý

**A. Chấp nhận hiện trạng — báo T xin bổ sung DesignSync cho lượt sau.** Đơn giản nhất, không tốn
thêm việc lúc này, nhưng lặp lại ở mọi phiếu build UI kế tiếp nếu quyền MCP không được cấp cho phiên
phụ nói chung (rủi ro lặp lại 3 lần nếu P-B/P-C cùng cảnh).

**B. T tự đẩy mock lên Claude Design từ phiên chính (có DesignSync) sau khi nhận file.** Tốn 1 bước
thủ công của T nhưng khoá kín được luật 16/08 "mọi giao diện phải qua Claude Design" mà không cần
sửa quyền hệ thống.

**C. T kiểm tra lại cấu hình quyền MCP cho phiên phụ nói chung** (nếu DesignSync đáng ra phải sẵn
có cho MỌI phiên build UI theo đúng tinh thần luật 16/08, đây là lỗ hổng cấu hình cần vá một lần,
tránh lặp ở P-B/P-C và các phiếu sau).

## 6. Đề xuất tốt nhất

**Hướng B ngay bây giờ + hướng C về lâu dài.** B giải quyết đúng nhu cầu trước mắt (Hoà cần duyệt
mock qua Claude Design) mà không chặn tiến độ phiếu này; C là việc hệ thống T nên làm SONG SONG cho
P-B/P-C — nếu cả ba phiên phụ 16/08 đều thiếu DesignSync, đó là dấu hiệu quyền MCP chưa được cấp
đúng cho lớp phiên-phụ nói chung (khác quyền của phiên chính T), cần T xác nhận với Hoà một lần thay
vì để mỗi phiếu build UI tự báo lại.

## ⑦ Nghiệm thu tự làm — dán nguyên văn

```
$ npx tsc --noEmit
(exit 0, không output)

$ node_modules/.bin/sucrase-node lib/units/units.test.ts
  ✓ formatLength mm mặc định, cách nghìn bằng khoảng trắng (luật seed #3)
  ✓ formatLength mm số tròn nhỏ
  ✓ formatLength cm
  ✓ formatLength m — 2 chữ số thập phân mặc định
  ✓ formatLength in — 2 chữ số thập phân mặc định
  ✓ formatLength ft-in — chuyển đúng feet + inch lẻ
  ✓ formatLength ft-in — tràn 12in đẩy lên feet kế (304.8mm = đúng 12in = 1ft chẵn)
  ✓ formatLength ft-in — làm tròn tràn defensive (23.999in → 2′0″ không phải 1′12.00″)
  ✓ formatLength số 0
  ✓ formatLength số âm
  ✓ formatLength NaN → gạch ngang, không crash
  ✓ formatLength withUnitLabel:false — bỏ hậu tố
  ✓ groupThousands số 6 chữ số
  ✓ groupThousands giữ phần thập phân nguyên vẹn
  ✓ parseLength hậu tố mm
  ✓ parseLength hậu tố cm
  ✓ parseLength hậu tố m
  ✓ parseLength hậu tố in (dấu ") — so sánh dung sai vì float 12*25.4 ≠ 304.8 tuyệt đối
  ✓ parseLength hậu tố in (chữ)
  ✓ parseLength feet-inch dạng 5'6" — đúng yêu cầu phiếu ④.5
  ✓ parseLength feet-inch dạng chữ "5ft 6in"
  ✓ parseLength chỉ feet, không inch (5')
  ✓ parseLength số trần dùng đơn vị ngầm định mm
  ✓ parseLength số trần dùng đơn vị ngầm định cm (opts.unit)
  ✓ parseLength số trần dùng đơn vị ngầm định ft-in → hiểu là inch nguyên
  ✓ parseLength số âm có hậu tố
  ✓ parseLength chuỗi rỗng → null, không throw
  ✓ parseLength chữ vô nghĩa → null
  ✓ parseLength số kèm đơn vị KHÔNG hợp lệ → null (không âm thầm đoán bừa)
  ✓ parseLength dấu phẩy thập phân (thói quen gõ VN)
  ✓ round-trip cm — số tròn, không mất gì
  ✓ round-trip m — số tròn, không mất gì
  ✓ round-trip mm số lớn có dấu cách hàng nghìn — gõ lại nguyên văn vẫn đọc đúng
  ✓ round-trip inch — sai số làm tròn ≤0.01mm (mm→in mất một ít vì chỉ giữ 2 số lẻ)
  ✓ SCALE_CHUAN đúng dãy ISO 10 nấc, tăng dần
  ✓ isValidScale chấp nhận nấc chuẩn
  ✓ isValidScale TỪ CHỐI tỉ lệ lẻ (đúng ca lỗi layout.pdf 11/08: "1:47")
  ✓ chooseNearestScale bắt tỉ lệ lẻ về nấc chuẩn gần nhất (phía nhỏ hơn)
  ✓ chooseNearestScale giữ nguyên khi đã là nấc chuẩn
  ✓ chooseNearestScale vượt trần → trả nấc lớn nhất (500)
  ✓ formatScale

41 test PASS — lib/units

$ npm test -- lib/units
(GHI CHÚ: script `test` trong package.json KHÔNG đọc đối số sau `--` — nó luôn glob TOÀN BỘ
*.test.ts trong repo bằng `find`. Lệnh này chạy y hệt `npm test` trơn, không lọc riêng lib/units.
Đã chạy `npm test` đầy đủ để đối chiếu — xem khối dưới. `lib/units/units.test.ts` NẰM TRONG đó và
in đúng "41 test PASS — lib/units" ở dòng log tương ứng.)

$ npm test   (đầy đủ, để xem lib/units có vướng gì khi chạy CHUNG với toàn repo không)
... (11 334 dòng, tổng hợp)
EXIT=1
Nguyên nhân DUY NHẤT của exit 1: 4 file lib/server/*.test.ts báo
"PrismaClientInitializationError" — project-profile.test.ts · draft-project.test.ts ·
tasks.test.ts · credits.test.ts — vì worktree không có .env (chỉ có .env.example), Prisma không
kết nối được DB. KHÔNG liên quan lib/units (không đụng lib/server/, không đụng prisma/, đúng vùng
file ③ giao). lib/units/units.test.ts trong lượt chạy CHUNG này vẫn in "41 test PASS — lib/units".

$ npm run soi:tu-dien
SOI TỪ ĐIỂN — chống lệch định nghĩa 2026-08-16
────────────────────────────────────────────────────────────────────────────────────────────────
────────────────────────────────────────────────────────────────────────────────────────────────
✅ 0 lệch định nghĩa

$ npm run soi:hinh-hoc
SOI HÌNH HỌC BO GÓC — 2026-08-16 (báo cáo)
Thang cho phép (DUYỆT 12/08 — --r-1..4 + vi mô ≤4): 0/1/2/3/4/6/10/14/20 + capsule 999
🔴 GIÁ TRỊ NGOÀI THANG: 8px×3 · 5px×3 · 22px×1 · 17px×1 · 28px×1 · 7px×1
🔎 TOP FILE VI PHẠM: components/filemanager/files-mock-css.ts(4) · FilesNavigator.tsx(3) ·
BottomToolbar.tsx(2) · AvatarBuilder.tsx(1)
Đã quét 281 file · 1007 khai báo radius · 10 ngoài thang (6 giá trị lẻ)
(exit 0 — báo cáo, không chặn. KHÔNG file nào của tôi trong danh sách vi phạm — đã grep riêng
components/settings/UnitsScaleSettings.tsx: mọi rounded-[...] đều qua var(--r-1..4/--r-full), 0
literal px.)
```

**Kiểm thêm ngoài yêu cầu ⑦ (tự nguyện, vì ⑥ trích luật `soi:thao-tac` liên quan)**:
`npm run soi:thao-tac` → 2 lệch pre-existing (31 file thiếu `focus-visible`, 193 hex inline) — CÙNG
2 lệch đã ghi trong `docs/STATUS.md` 15/08 ("nợ cũ nguyên si, file mới không dính"). Grep riêng
`UnitsScaleSettings.tsx`: có `focus-visible` (không nằm trong 31 file thiếu) và 0 hex inline.

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- **Chưa có ảnh chụp `/settings` THẬT** với `UnitsScaleSettings` mount trong app chạy — lý do kỹ
  thuật đã nêu ở mục 4 (server 3000 sẵn có trỏ vào repo khác, cấm tôi tự mở server mới). Chỉ kiểm
  được: tsc pass (kiểu đúng, JSX hợp lệ), đọc lại code so với mock đã kiểm bằng mắt thật. Nếu có
  lỗi runtime-only (vd hook thứ tự gọi sai, style Tailwind arbitrary không compile đúng ở runtime
  thật dù tsc không bắt được) thì CHƯA lộ ra ở đây.
- **`useUnitsSettings()` (hook React) không có test tự động** — repo này không có
  `@testing-library/react` (đã `grep package.json` xác nhận 0 dòng), quy ước test hiện tại
  (`lib/cad/snap-print-scale.test.ts` và mọi `*.test.ts` khác đã đọc) chỉ test hàm THUẦN bằng
  `node:assert`, không test hook/component. `units.test.ts` theo đúng quy ước đó — chỉ test
  `formatLength`/`parseLength`/`groupThousands`/hàm scale, KHÔNG test hook localStorage.
- **`inchStr`/carry logic trong `formatFeetInch()`** đã test 3 ca (bình thường, tràn đúng-đủ, tràn
  do làm tròn) nhưng KHÔNG test số âm kèm carry (vd -23.999in) — trường hợp hiếm trong thực tế đo
  đạc nội thất (không có chiều dài âm thật), nhưng nếu tương lai dùng cho toạ độ tương đối (có thể
  âm) thì cần thêm ca này.
- **Vị trí đặt `UnitsScaleSettings` trong "Nâng cao"** là quyết định của tôi (đặt cuối danh sách,
  sau `LockScreenSettings`) — phiếu không chỉ định vị trí chính xác trong danh sách, chỉ nói "MÀN
  GIAO DIỆN: Cài đặt › Đơn vị & Tỉ lệ". Nếu Hoà/T muốn vị trí khác (vd đầu danh sách, vì đơn vị đo
  ảnh hưởng toàn app hơn "Bố cục panel"/"Kho vật liệu") thì đây là 1 dòng JSX di chuyển, không phải
  việc lớn.
- **Icon trong mock là SVG path chép tay theo hình dạng Lucide `Ruler`/`Grid3x3`/`PenLine`**, không
  phải import gói Lucide thật (mock HTML tĩnh không có bundler) — code thật (`UnitsScaleSettings.tsx`)
  dùng ĐÚNG `lucide-react` (`Ruler`, `Keyboard`, `Grid3x3`), có thể hình dạng icon giữa mock và code
  lệch vài chi tiết nhỏ (không phải vấn đề vì mock chỉ cam kết BỐ CỤC/TOKEN, không cam kết icon
  từng pixel — nhưng nêu ra để T không ngạc nhiên nếu soi kỹ 2 ảnh cạnh nhau).

## ⑦c Hạn dùng kết luận

- Kết luận "tsc sạch · 41/41 test pass · soi:tu-dien 0 lệch" **hết đúng ngay khi có phiên khác
  (P-B/P-C hoặc T) sửa `lib/cad/model.ts`, `components/settings/`, hoặc `app/settings/**` sau thời
  điểm nộp báo cáo này** — cần chạy lại đủ bộ ⑦ sau khi merge.
- Kết luận "DesignSync không có trong phiên này" **hết đúng nếu** T cấp lại quyền MCP cho worktree
  này và phiên sau thử lại `ToolSearch` ra kết quả khác — đây có thể là giới hạn CỦA PHIÊN CỤ THỂ
  này (agent-a54fc5a8884c021bd), không chắc áp dụng cho mọi phiên phụ tương lai.
- Kết luận "4 test lib/server/ fail vì thiếu .env" **hết đúng khi** worktree được cấp `.env` thật
  (T/Hoà quyết định, tôi không tự tạo file bí mật) — không phải lỗi code, không cần sửa gì ở
  `lib/units/`.
