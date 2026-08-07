# M-KHO-OUT — phiên p12 (07/08, đợt 2)

Vùng sở hữu: `lib/present-editor/` · `lib/pptx.ts` · `components/present-editor/`.
KHÔNG đụng: `lib/cad/` · `lib/three/` · `lib/materials/` · `components/ui/` — giữ đúng
(diff phiên này: `lib/pptx.ts` · `lib/present-editor/export.ts` · `components/present-editor/
{StagePresetPanel,PresentSheets,Toolbar,PresentEditor}.tsx` · `docs/IF-PRESENT-STAGE-SPEC.md` ·
file này). **V6 — CHƯA COMMIT.**

---

## VIỆC 1 — PPTX nuốt trục KHỔ ✅ (lỗi Hoà báo — SỬA XONG, VERIFY FILE THẬT)

**Gốc đúng như phiếu tả**: `lib/pptx.ts` neo mọi toạ độ bằng inch tuyệt đối vào khung
13.333×7.5 (footer `SLIDE_H-0.6`, cột ảnh `SLIDE_W*0.56`, lề 0.85…) ⇒ `export.ts:15` chọn
"PPTX luôn 16:9" (PS-4) ⇒ đổi A3 dọc thấy đúng trên màn, xuất ra 16:9 ngang.

**Sửa:**
- `lib/pptx.ts` — thêm `geomFor(pageW, pageH)`: mọi số đo đi qua bộ quy đổi tỉ lệ
  (`x·sx`, `y·sy`, cỡ chữ `·min(sx,sy)` làm tròn 0.5pt). **16:9 ⇒ sx=sy=1 ⇒ output y hệt
  trước** (an toàn ngược). `ExportPptxOptions.pageSize?` (inch) mới — bỏ trống = 16:9 cũ.
  `defineLayout` theo khổ thật. Đúng BA TRỤC §3a: đổi KHỔ không phá BỐ CỤC (tương đối giữ
  nguyên) lẫn NHẬN DIỆN (màu/font/logo không đổi).
- `lib/present-editor/export.ts` — `exportDeckToPptxFromModel` truyền
  `pageSize = PAPER_SIZE_MM[deck.stagePreset]/25.4` (khổ giấy THẬT — cùng nguồn PDF, đúng
  chỉ đạo "PDF làm bài mẫu"); slide fallback-ảnh render bằng `stageFor(deck.stagePreset)`
  thay vì stage mặc định. Ghi chú PS-4 cũ gạch bỏ kèm ngày (không xoá lịch sử).
- `components/present-editor/StagePresetPanel.tsx` — câu UI *"(.pptx) luôn giữ khổ 16:9"* đổi
  thành *"Mọi đường xuất (PDF, PNG, PowerPoint) đều ra đúng khổ đang chọn"*.
- **KHÔNG đụng `reflow.ts`** (đúng lệnh CẤM — 25/25 test của nó vẫn pass, chạy lại xác nhận).
- `components/ui/IOMenu.tsx` grep không có câu "PPTX 16:9" nào — không cần đụng vùng cấm.

**VERIFY N1 — file thật, mở thật:** sinh 3 file .pptx qua ĐÚNG `exportDeckToPptx` (script
scratch stub mỗi đường tải-xuống, không đụng logic dựng slide), rồi:
1. Mổ ZIP đọc `ppt/presentation.xml` — khổ trang EMU khớp **chính xác từng đơn vị**:

| Khổ | `<p:sldSz>` đo được | Mong đợi (914400 EMU/inch) |
|---|---|---|
| 16:9 (không truyền pageSize) | 12191695 × 6858000 | 12191695 × 6858000 ✅ |
| **A3 dọc** | **10692000 × 15120000** | 10692000 × 15120000 ✅ |
| **A4 ngang** | **10692000 × 7560000** | 10692000 × 7560000 ✅ |

2. **MỞ FILE THẬT** qua Quick Look (`qlmanage` render nội dung file thật, không phải suy diễn)
   → 3 ảnh chụp đã xem bằng mắt trong phiên: A3 DỌC ra trang đứng thật (footer đáy trang, kicker/
   title/gạch accent đúng vị trí tương đối) · A4 ngang ra trang 297×210 · 16:9 y hệt cũ.
   File + ảnh nằm ở scratchpad phiên (`test-{16x9,a3-portrait,a4-landscape}.pptx[.png]`) — đã
   gửi kèm 3 ảnh cho Hoà xem trực tiếp.

Ghi chú nhỏ: Quick Look nối các dòng body sát nhau ("Ý tưởng chủ đạoVật liệu chính") — quirk
renderer của Quick Look với multi-paragraph pptxgenjs, XUẤT HIỆN Ở CẢ BASELINE 16:9 (không
phải hồi quy của việc này); PowerPoint thật hiển thị đúng từng bullet.

## VIỆC 2 — trần "≤5 sheet" ✅ (code ĐÃ GỠ từ trước — dọn nốt sổ + comment sót)

Đo lại (§0ab): **code hết trần từ D2 đợt 8 (04/08)** — `PresentSheets.tsx` `addSheet` không
chặn, các nhánh nạp/import không `slice(0,5)` (grep `MAX_SHEETS|slice(0,5)` trong
present-editor = 0 chỗ ép thật). Còn sót:
- `PresentSheets.tsx:12` docblock vẫn ghi "TRẦN 5" — **đã sửa** (ghi rõ đã gỡ D2).
- `docs/IF-PRESENT-STAGE-SPEC.md` 4 chỗ (:7 "gói trong ≤5 sheet" · :157 F.5 · :191 I.1 ·
  :220) — **đã sửa cả 4**, kiểu gạch-giữ-lịch-sử + dẫn chốt Hoà 07/08 "bỏ vụ gói trong 5 sheet
  ở tất cả các chặng". Grep `≤5` sau sửa = 3 hit, đều nằm TRONG phần gạch lịch sử.
- Chặng khác (CAD): `MAX_SHEETS` đã gỡ từ D2 (`lib/cad/model.ts:1316` tự ghi) — ngoài vùng
  sở hữu, chỉ xác nhận không còn gì để gỡ.

## VIỆC 3 — giới hạn 25 template ✅ (code CHƯA TỪNG có trần — sửa sổ cho khớp sự thật)

Đo lại: **"25" chỉ là SỐ ĐẾM builtin trong spec, code không có trần nào** —
`lib/present-editor/custom-templates.ts` không limit (grep MAX/slice = 0), và **kho mở ĐÃ CHẠY
từ PS-2/B.8**: nút "Lưu mẫu" trong `LayoutShelf.tsx:404-443` → `saveCustomTemplate()` →
localStorage, hiện lại ở mục "Của tôi", xoá được. Gap "lưu template tự tạo" trong
IF-PRESENT-STAGE-SPEC thực tế đã đóng từ trước — 2 hàm chết `renameCustomTemplate`/
`customTemplatesAsEditorTemplates` (G-M20-01) grep 07/08 = **0 kết quả, đã có phiên khác xoá**.
Việc còn thật: sổ spec ghi "25 template" như đặc điểm cố định — **đã sửa 2 chỗ** (:26, :66)
thành "kho MỞ, không trần số lượng, người dùng tự lưu qua Lưu mẫu" + dẫn chốt 07/08.
`custom-templates.test.ts` 31/31 pass (chạy lại).

## VIỆC 4 — gộp TemplatePicker + LayoutShelf = "Bố cục" ✅ (gộp đã xong từ A2 — chốt nốt TÊN)

Đo lại (§0ab): `TemplatePicker.tsx` **không còn trên đĩa** (ls `components/present-editor/` +
grep toàn repo = 0 — đã xoá ở A2, khớp `00-CHOT.md` "`TemplatePicker.tsx` đã xoá (A2)").
`LayoutShelf.tsx` 825 dòng là bản duy nhất. Phần gộp CODE không còn gì để làm. Còn lệch TÊN —
một thứ đang mang HAI tên trên UI:
- Nút toolbar ghi **"Mẫu"** (`Toolbar.tsx:428`) — **đã đổi** thành "Bố cục" (title "Bố cục —
  mẫu dàn trang, bấm là áp").
- Tab panel trái ghi **"Magic"** (`PresentEditor.tsx:1747`) — **đã đổi** thành "Bố cục".
  Lưu ý ranh giới từ khoá: "Magic" (CHOT-TACH-AI-VA-CHINH-TAY) là tên cho phần AI SINH bên
  trong LayoutShelf (GenerateFlow/spec), không phải tên cái kệ — đổi tên tab không đụng chốt đó.

## VERIFY tổng

| Phép đo | Kết quả |
|---|---|
| `npx tsc --noEmit -p .` | **exit 0** |
| `npm test` | 1 FAIL duy nhất = `lib/cad/hatch-perf.test.ts` (perf 3.6s > trần 3s) — **file p9, KHÔNG liên quan** (phiên này không đụng lib/cad); chạy LẺ lại pass 22/22 (327ms) ⇒ fail do tranh CPU khi test chạy `-P8` song song với nhiều dev server đang mở, không phải hồi quy |
| `reflow.test.ts` | 25/25 (không đụng file nguồn) |
| `edgecase-stress.test.ts` | 31 ok, 0 fail |
| `custom-templates.test.ts` | 31 ok, 0 fail |
| PPTX A3 dọc / A4 ngang / 16:9 | EMU khớp 100% + mở file thật qua Quick Look, xem bằng mắt |

## BẢNG CUỐI LƯỢT (§V7)

| Việc | Trạng thái |
|---|---|
| 1 — PPTX đúng khổ | ✅ xong — 3/3 khổ verify file thật (bảng EMU + ảnh mở file) |
| 2 — bỏ trần 5 sheet | ✅ code đã gỡ từ D2 (xác nhận lại) + dọn 1 comment sót + 4 chỗ spec |
| 3 — bỏ giới hạn 25 template | ✅ code vốn không trần, kho mở đã chạy — sửa 2 chỗ spec cho khớp |
| 4 — gộp thành "Bố cục" | ✅ gộp code xong từ A2 (đo lại) — đổi nốt 2 nhãn UI "Mẫu"/"Magic" → "Bố cục" |
| CHƯA VERIFY | đổi khổ + bấm xuất từ UI TRÌNH DUYỆT THẬT end-to-end (blocker §0aa: nhiều dev server chung `.next`, phiên trước cùng ngày đã dính 500 khi mở server riêng). Bù bằng đường verify MẠNH HƠN ở tầng file: gọi thẳng `exportDeckToPptx` thật → mổ ZIP + mở file. Riêng nhãn "Bố cục" (VIỆC 4) là JSX tĩnh, tsc đã kiểm — chưa chụp màn |
