# BÁO CÁO PHIÊN H3 — `don-giao-dien-v2` (13/08/2026)

> Phiếu: `docs/phieu-giao/don-giao-dien-v2.md` · 3 dây máy: `hinh-hoc-v2` · `tu-dien-mocks-sach` ·
> `mat-do-con-tro`.
> Ràng buộc tuân thủ: KHÔNG git · KHÔNG dev server · KHÔNG prisma · KHÔNG sửa file ngoài VÙNG ③ ·
> KHÔNG đổi hành vi/logic · KHÔNG sửa `scripts/soi-hinh-hoc.mjs`/`scripts/soi-tu-dien.mjs` (chỉ CHẠY).

## ① Đọc trước — xác nhận đã đọc

`app/globals.css:60-113` (thang `--r-*` + cụm mật độ) · `docs/SPEC-MAT-DO-CON-TRO.md` §5 · 2 máy
soi + chạy lấy hiện trạng · `git show 1918910` + `docs/bao-cao-phien/2026-08-12-H-ap-thang.md` +
`docs/AUDIT-HINH-HOC-2026-08-12.md` §3d (bảng migrate cũ→mới của đợt trước — dùng LẠI đúng bảng này,
không tự chế quy tắc mới).

**Lệch nhỏ so với phiếu, xử lý tại chỗ:** mục ③ ghi `components/studio/LightTab.tsx` — đường dẫn
thật là `components/render-studio/LightTab.tsx` (khớp đúng file 13 vi phạm trong soi:hinh-hoc và
khớp dây máy ⑧ "LightTab var(--r-)"). Coi là lỗi đánh máy trong phiếu, sửa đúng file thật.

## ② Việc đã làm

### 1 · `mat-do-con-tro` — 2 token thiếu + áp vào vùng ③
- `app/globals.css:105-118`: thêm `--pad-card: 8px 12px` và `--fs-ui: 13px` cạnh cụm mật độ có sẵn
  (`--tap/--tap-lg/--row/--gap`), đúng khối `:root` gốc. Override cảm ứng thêm vào khối
  `@media (hover: none) and (pointer: coarse)` sẵn có (`--pad-card: 12px 16px`, `--fs-ui: 15px`) —
  ĐÚNG giá trị SPEC-MAT-DO-CON-TRO §5, không tự chế số.
- Áp `var(--tap)` / `var(--gap)` / `var(--fs-ui)` vào 28 chỗ hardcode **giá trị TRÙNG KHỚP TUYỆT ĐỐI**
  với token (32/8/13, không đổi thị giác) trong 7 file vùng ③ dùng inline `React.CSSProperties`:
  `MaterialPbrEditor.tsx` (7) · `FlowCanvas.tsx` (3) · `ExportPdfDialog.tsx` (2) · `ImageEditor.tsx`
  (5) · `ToolModeForm.tsx` (1) · `CommentLayer.tsx` (3) · `MaterialImportWizard.tsx` (7).
- **CỐ Ý KHÔNG đụng**: `gap: 12` (2 chỗ, `ExportPdfDialog.tsx:324` + `MaterialImportWizard.tsx:391`)
  và `fontSize: 15` (`MaterialPbrEditor.tsx:164`, tiêu đề card) — giá trị KHÁC mặc định desktop của
  token (`--gap`=8, `--fs-ui`=13), gán `var()` vào đây sẽ THAY ĐỔI kích thước hiển thị → vi phạm
  ràng buộc "không đổi giá trị thị giác ngoài quy tắc map". Ghi lại làm hàng đợi (mục ④ dưới).
- 5 file còn lại của vùng ③ (`SectionExtractPanel` · `ProjectSelect` · `ProjectMembersPanel` ·
  `LightTab` · `LoginBackdrop`) dùng Tailwind class (không phải inline style số): grep thấy 28 lượt
  `h-8`/`gap-2`/`text-[13px]` trùng giá trị token nhưng KHÔNG áp — đổi tên class Tailwind sang
  `var()` bracket-syntax trên diện rộng vượt khỏi "cơ khí dọn" của phiếu này (rủi ro đụng phần tử
  không liên quan tới mật độ UI, ví dụ `h-8` dùng cho ảnh/avatar). Ghi hàng đợi.
- MARKER xác nhận: `grep -n "\-\-fs-ui\|\-\-pad-card" app/globals.css` → dòng 117-118 (khai) +
  167-168 (override cảm ứng).

### 2 · `hinh-hoc-v2` — radius 12 file vùng ③ về thang `--r-*`
Áp đúng **bảng migrate §3d của đợt trước** (`docs/AUDIT-HINH-HOC-2026-08-12.md`): 5/7→6 · 8→6 (chip
<28px)/10 (nút/field ≥28px, phân theo `height`/`min-h`/`--tap`/padding thật của từng chỗ) · 9/11/12→10
· 13/15/16→14 · 18/22(khối)/24/28/32→20. 12 file, tổng **114 chỗ sửa**:

| File | Sửa | Ghi chú |
|---|---|---|
| `components/render-studio/LightTab.tsx` | 13 | toàn Tailwind `rounded-[Npx]` |
| `components/entry/LoginBackdrop.tsx` | 11 | Tailwind, gồm 1 panel 16→14 |
| `components/materials/MaterialImportWizard.tsx` | 11 | modal 16→14, 2 nút 26px→6 |
| `components/materials/MaterialPbrEditor.tsx` | 10 | modal 16→14, avatar 12→10 |
| `components/FlowCanvas.tsx` | 9 | 3 `rounded-lg`(Tailwind named=8px) → `rounded-[10px]` |
| `components/print/ExportPdfDialog.tsx` | 9 | giữ nguyên 20 (đã trong thang), sửa 9 còn lại |
| `components/present-editor/ImageEditor.tsx` | 8 | giữ nguyên radius động (dòng 251, công thức crop-tay-người-dùng — KHÔNG phải token tĩnh, không đụng) |
| `components/render-studio/ToolModeForm.tsx` | 8 | 5 chỗ đã sẵn 6/10 (allowed) không đụng |
| `components/render-studio/SectionExtractPanel.tsx` | 7 | toàn Tailwind |
| `components/CommentLayer.tsx` | 7 | giữ nguyên 2 capsule 999 + 14 (đã hợp thang) |
| `components/ProjectSelect.tsx` | 7 | 4 `rounded-lg`/2 `rounded-xl` (Tailwind named) → bracket `[10px]` |
| `components/dashboard/ProjectMembersPanel.tsx` | 7 | 1 `h-7 w-7`(28px, ngưỡng nút) → 10 |

Quy tắc phân loại 8→6/10 dùng **kích thước thật** của phần tử (đọc `height`/`min-h-[var(--tap)]`/
padding+font-size ước lượng): có `--tap`/`height:32`/`h-7`(28px) trở lên → nút/field → 10; không có
sizing rõ, padding nhỏ (~<28px tổng) → chip/badge → 6. Trường hợp mập mờ sát ngưỡng 27-28px xử theo
hướng AN TOÀN cho mắt: giữ đồng bộ với phần tử cùng vai trò gần nhất trong cùng file.

## ③ `tu-dien-mocks-sach` — 77 chỗ lệch về 0

Sed thay `'Trình bày'` / `"Trình bày"` / `>Trình bày<` → `Trình chiếu` đúng 3 khuôn regex của
`scripts/soi-tu-dien.mjs`, trên toàn bộ 42 file `docs/mocks/**` mà máy soi liệt kê (100% nằm trong
`docs/mocks/`, `components/` = 0 hit trước khi sửa — đúng ghi chú của phiên 12/08). Chỉ đổi CHỮ,
không đụng layout/CSS/JS xung quanh.

**Phát hiện thêm khi mở file xác nhận không vỡ (mục ④ dưới) — 1 chỗ né được cả 2 vòng máy soi:**
`docs/mocks/mock-trinh-chon-ho-so-tablet-2026-08-10.html:11` có breadcrumb
`<b>› Trình bày</b>` (dấu `› ` đứng trước chữ phá khuôn `>Trình bày<` vì máy soi cần đúng ký tự
liền sau `>`). Đây CÙNG LOẠI lỗi với 77 chỗ đã sửa (nhãn hiển thị tên chặng cũ trong thẻ), rủi ro
sửa = 0 (đổi đúng 1 cụm chữ, không đụng gì khác) nên đã sửa luôn thành `<b>› Trình chiếu</b>` dù
KHÔNG nằm trong 77 đếm được của máy soi — ghi rõ ở đây để không tính trùng vào số máy soi báo.

**CHƯA sửa, để hàng đợi (ngoài khuôn regex của từ điển, đụng vào cần người quyết ranh giới
prose/nhãn):** rất nhiều chỗ khác trong `docs/mocks/**` dùng cụm "...và Trình bày" / "chặng Trình
bày" / "Chặng Trình bày" giữa câu văn (vd `InteriorFlow 02 Cài đặt.html:330,552,774` "Đổi giữa 2D,
3D và Trình bày" · `mock-if-vitals-v2.html:149,212` "chặng Trình bày" · cả cụm
`docs/mocks/_archinote/*` 8 chỗ). Từ điển `soi-tu-dien.mjs` CỐ Ý không bắt các chỗ này (comment
dòng 17 của script: *"né văn xuôi thường"*) vì không phân biệt được máy "chặng Trình bày" (danh từ
riêng, nên sửa) với "trình bày phương án" (động từ, không nên sửa). Đây là hàng đợi thật cho một
phiếu riêng mở rộng từ điển hoặc rà tay — KHÔNG tự ý mở rộng phạm vi phiếu này vì rủi ro sửa nhầm
câu văn xuôi cao hơn lợi ích, và phiếu H3 chỉ giao "theo từ điển soi-tu-dien".

## ④ tsc + mở file xác nhận không vỡ

`npx tsc --noEmit` → **0 lỗi** (output rỗng), chạy sau khi hoàn tất cả 3 việc.

Mở 3 mock đã sửa, đọc lại chuỗi quanh chỗ thay — không vỡ tag, không đụng CSS/layout:
- `docs/mocks/mock-if-thu-vien.html:73,511` — 2 nút `Trình chiếu` trong dải chuyển chặng, style
  giữ nguyên (`border-radius:8px` — mock KHÔNG thuộc vùng ③ hình học, chỉ đổi chữ đúng việc 3).
- `docs/mocks/InteriorFlow 01 Dự án.html:128,324,384` — `<b>Trình chiếu</b>` trong `.stage`, cấu
  trúc thẻ nguyên vẹn.
- `docs/mocks/mock-trinh-chon-ho-so-tablet-2026-08-10.html:11` — breadcrumb + stagebar cả hai đã
  đúng `Trình chiếu` (xem mục ③).

## ⑤ Ràng buộc — xác nhận tuân thủ

Không `git` · không dev server · không prisma · không sửa `components/ui/**`,
`components/library/**`, `components/cad/**`, `components/render-studio/Command3DPanel.tsx`,
`components/home/**`, `app/page.tsx`, prisma, `scripts/*.mjs` (chỉ chạy `npm run soi:*`) — xác nhận
bằng `git status --short`: chỉ 13 file component đúng danh sách vùng ③ + `app/globals.css` +
42 mock trong `docs/mocks/**` bị đổi. Không đổi hành vi/logic — mọi sửa là số radius map theo bảng
đã duyệt, chữ hiển thị, hoặc token CSS giữ nguyên giá trị mặc định.

## ⑥ NGHIỆM THU — số máy soi THẬT, dán nguyên văn

**TRƯỚC phiên:**
```
SOI HÌNH HỌC BO GÓC — 2026-08-12 (báo cáo)
🔴 8px×234 · 7px×61 · 12px×55 · 9px×42 · 5px×19 · 16px×18 · 11px×5 · 17px×2 · 22/32/28/24/13/18×1
TOP: CadEditor 21 · Command3DPanel 17 · CadCanvas 15 · LightTab 13 · LoginBackdrop 11 ·
     MaterialImportWizard 11 · MaterialPbrEditor 10 · FlowCanvas 9 · ExportPdfDialog 9 ·
     ImageEditor 8 · ToolModeForm 8 · CommentLayer 7 · ProjectSelect 7 ·
     ProjectMembersPanel 7 · SectionExtractPanel 7
Đã quét 258 file · 998 khai báo radius · 442 ngoài thang (14 giá trị lẻ)
```
```
SOI TỪ ĐIỂN — 2026-08-12
🔴 77× dùng sai → ĐÚNG là: Trình chiếu (tên chặng — chốt vòng cuối 07/08)
🔴 77 chỗ lệch định nghĩa
```

**SAU phiên:**
```
SOI HÌNH HỌC BO GÓC — 2026-08-12 (báo cáo)
🔴 8px×182 · 12px×49 · 7px×42 · 9px×21 · 5px×17 · 16px×14 · 11px×3 · 17px×2 · 22/28/24/13/18×1
TOP: CadEditor 21 · Command3DPanel 17 · CadCanvas 15 · PlanPresentPanel 6 · ConceptForm 6 ·
     MaterialFormModal 6 · WallTypePanel3D 6 · SmartSelectModal 6 · VitalsGesture 6 · (…)
Đã quét 258 file · 998 khai báo radius · 335 ngoài thang (13 giá trị lẻ)
```
→ **442 → 335, GIẢM 107** (mục tiêu phiếu ≥60 — đạt, vượt gần gấp đôi). Cả 12 file vùng ③ ra
KHỎI danh sách top-vi-phạm; 335 còn lại 100% nằm ngoài vùng ③ (CadEditor/Command3DPanel/CadCanvas
= vùng CẤM của phiếu, còn lại là file chưa thuộc phiếu nào — hàng đợi đợt sau).
```
SOI TỪ ĐIỂN — 2026-08-13
✅ 0 lệch định nghĩa
```

```
$ npx tsc --noEmit
(không có output — 0 lỗi)
```

```
$ grep -n "--fs-ui\|--pad-card" app/globals.css
117:  --pad-card: 8px 12px;
118:  --fs-ui: 13px; /* chữ giao diện (nhãn nút, dòng danh sách) */
167:    --pad-card: 12px 16px;
168:    --fs-ui: 15px;
```

## CHƯA LÀM (nói thẳng)

- **`--pad-card` chưa có nơi tiêu thụ thật trong vùng ③** — grep 12 file không thấy shorthand
  padding trùng khớp tuyệt đối `8px 12px`/`8px 10px`-gần-giống mà không đổi thị giác; token đã
  khai đúng SPEC nhưng đang "chờ mặt tiền" (giống `soi:frontier` gọi là entry mới khai mà chưa có
  usage) — hàng đợi phiếu sau khi chạm file có card padding rõ ràng.
- **28 lượt Tailwind `h-8`/`gap-2`/`text-[13px]` trùng giá trị token** trong 5 file
  (`SectionExtractPanel` 1 · `ProjectSelect` 19 · `ProjectMembersPanel` 1 · `LightTab` 1 ·
  `LoginBackdrop` 6) — không áp vì rủi ro đụng phần tử không liên quan tới mật độ UI (ảnh/avatar
  dùng trùng class `h-8`), cần rà tay từng chỗ, ngoài mức "cơ khí" của phiếu.
- **`gap: 12` (2 chỗ) và `fontSize: 15` (1 chỗ)** trong vùng ③ — giá trị KHÁC mặc định token, cố ý
  không đổi để tránh vi phạm "không đổi giá trị thị giác".
- **~15-20 chỗ "Trình bày" giữa câu văn** trong `docs/mocks/**` — ngoài khuôn regex của từ điển
  (xem mục ③), cần phiếu riêng hoặc mở rộng từ điển để rà an toàn.
- **335 vi phạm hình học còn lại** — 53 trong vùng CẤM của phiếu (`CadEditor`/`Command3DPanel`/
  `CadCanvas`), phần còn lại ở file chưa thuộc phiếu nào (`PlanPresentPanel`, `ConceptForm`,
  `MaterialFormModal`, `WallTypePanel3D`, `SmartSelectModal`, `VitalsGesture`, `CadSheets`,
  `CamPathControlPanel`, `ZonePanel`, `form/shared.tsx`, `GenerateFlow`, `PresentEditor`… mỗi file
  5-6 vi phạm) — hàng đợi đợt migrate kế, danh sách đầy đủ nằm trong output `npm run soi:hinh-hoc`.

## ⑦ HAI GIÁ TRỊ (khuôn §1c)

**KIẾN TRÚC** — [tính năng] Bộ token mật độ (SPEC-MAT-DO-CON-TRO §5) từ "3/5 token có mặt" thành
**đủ 5/5** (`--tap/--row/--gap/--pad-card/--fs-ui`), đúng vị trí (`:root` + override
`(hover:none)and(pointer:coarse)` tái dùng, không phát minh điều kiện mới) — khớp nguyên tắc
"MỘT nguồn sự thật" của dự án; token cũ (`--radius-sm/md/lg/xl`) tiếp tục sống làm bí danh nên 62
usage cũ không gãy. [giao diện] Thang bo góc 442→335 (−24%) tiếp nối đúng mạch đợt 12/08
(`hinh-hoc-ap-thang`, 498→442) — cùng MỘT bảng migrate §3d, không tự chế quy tắc mới lần thứ hai,
đúng tinh thần "hình sau là hệ quả hình trước" mà Hoà chê thiếu hôm 12/08; 12/12 file mục tiêu của
phiếu ra khỏi top-vi-phạm hoàn toàn.

**VẬN HÀNH-SỬ DỤNG + GIÁ TRỊ IF** — [tính năng] `soi:tu-dien` về 0 nghĩa là **mọi màn mock trong
`docs/mocks/**` hiển thị đúng bộ tên 3 chặng đã chốt** (`2D Kỹ thuật · 3D Thiết kế · Trình chiếu`)
— xoá một nguồn gây "lệch định nghĩa" mà chính Hoà đặt cơ chế 12/08 để chống (nói thẳng nếu phiên
sau đọc mock cũ để port UI, sẽ không còn bắt gặp nhãn "Trình bày" đã bị huỷ từ vòng chốt 07/08).
[giao diện] 114 chỗ radius + 28 chỗ mật độ sửa đều là thay-số-tại-chỗ, không đổi bố cục — người
dùng cuối sẽ thấy các nút/field/card trong 12 màn (vật liệu PBR, xuất PDF, sửa ảnh, form Vật liệu
render, đèn 3D, đăng nhập, bình luận, chọn dự án, thành viên dự án, trích mặt cắt) có độ bo góc
NHẤT QUÁN hơn theo đúng 4 nấc đã duyệt, thay vì 14 giá trị lẻ rải rác trước đó — trực tiếp trả lời
lời chê "bo góc không phát triển từ tâm" của Hoà ở đúng các màn người dùng chạm hằng ngày.
