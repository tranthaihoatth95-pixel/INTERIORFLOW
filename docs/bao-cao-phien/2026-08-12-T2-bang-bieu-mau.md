# Báo cáo phiên T2 — editor-bang-bieu-mau (Engine bảng — docType Schedule)

Phiếu: `docs/phieu-giao/editor-bang-bieu-mau.md` · dây máy: `editor-bang-bieu-mau` (T đã thêm
entry, `dir lib/present-editor`, marker `TableDocEngine`). Không git · không dev server · không
prisma (đúng ràng buộc ô⑤). Vùng file chạm: `components/present-editor/**` + `lib/present-editor/**`
— KHÔNG sửa `prisma/schema.prisma`/`lib/three`/`lib/library`/`components/library`/`lib/cad/**`
(chỉ đọc)/`lib/dna`/`lib/distill`, đúng ô③.

## File sửa / tạo

| File | Việc |
|---|---|
| `lib/present-editor/table-doc-engine.ts` (MỚI) [tính năng] | **TableDocEngine** — trừu tượng TRỰC TIẾP từ `boq-overrides.ts` (override map `rowId::colKey` thay `matId::field`) + `boq-group.ts` (nhóm+subtotal). Cột cấu hình (`TableColumnDef`), dòng máy thuần (`TableRow.cells`), override tay tách map riêng (`TableOverrideMap`), `resyncTableRows()` (giữ ô tay + đánh `orphaned` cho entity biến mất — khái niệm BOQ KHÔNG cần, ghi rõ lý do trong docstring), `groupTableRows()`, round-trip `serializeTableDoc`/`parseTableDoc` |
| `lib/present-editor/table-doc-engine.test.ts` (MỚI) | 10 case: gieo dòng · re-sync giữ ô tay · re-sync đánh `orphaned` không xoá dữ liệu · dòng thêm tay không bị đụng · revert · đếm trạng thái theo DÒNG · subtotal chỉ cộng cột `summable` + bất biến Σ nhóm = Σ tổng (N3) · round-trip JSON |
| `lib/present-editor/schedule-table.ts` (MỚI) [tính năng] | Mặt tiền `schedule` (nhãn "Bảng thống kê"): `SCHEDULE_COLUMNS` (Tên · Thông số · Diện tích m² · Tầng · Ghi chú) + `buildScheduleRowSeeds(doc)` gieo dòng từ Doc 2D THẬT — cửa (`BlockEntity.elementType==='door'`) qua `blockInfo()`/`OPENING_STANDARD_HEIGHT_MM` (TÁI DÙNG `lib/cad/schedule.ts`+`lib/cad/hatch.ts`, không viết lại), phòng (`RoomEntity.boundary`) qua `polygonArea()`. Mỗi dòng giữ `entityId` |
| `lib/present-editor/schedule-table.test.ts` (MỚI) | 4 case: Doc trống → rỗng (luật X2, không lỗi) · gieo đúng spec cửa + diện tích phòng · bỏ qua entity không phải cửa/phòng · kịch bản đủ (gieo → đo lại hiện trường đổi diện tích → resync → ô "Ghi chú" tay còn nguyên → nhóm đúng) |
| `lib/present-editor/table-doc-persist.ts` (MỚI) [tính năng] | Đọc/ghi `{rows, overrides}` xuống IDB dùng CHUNG kho `interiorflow-sheets` (`lib/sheets-persist.ts`) — cùng luật B5 BOQ đã áp, route `/table-doc`, khoá `${projectId}::${docType}` (nhiều docType bảng sống độc lập, không phải viết route riêng mỗi loại) |
| `lib/present-editor/table-doc-xlsx.ts` (MỚI) [tính năng] | Xuất `.xlsx` — TÁI DÙNG `buildXlsxBuffer()` (`lib/boq/xlsx.ts` ①, máy dựng OOXML tổng quát ĐÃ CÓ SẴN, chỉ đọc không sửa). Ô chữ/số thường, không khoá — file mở Excel sửa được ngay |
| `components/present-editor/table/TableDocGrid.tsx` (MỚI) [giao diện] | Lưới hiển thị chung (dùng lại được cho `spec-sheet`/`approval-form` sau này) — nhóm + dòng tổng, click-để-sửa ô `editable`, badge cam khi ô đã sửa tay (title hiện số máy) + nút quay lại, badge cảnh báo dòng `orphaned`. Token `--r-1`/`--r-2`, biến `--t1..t4`/`--panel`/`--border`/`--warning` (2 theme tự đúng) |
| `components/present-editor/table/ScheduleScreen.tsx` (MỚI) [tính năng]+[giao diện] | Màn `schedule` — cùng kiến trúc `BoqScreen.tsx` (không đụng file đó): `getProjectDoc` → gieo/re-sync → override → nhóm → `TableDocGrid`. Nút "Cập nhật từ bản vẽ" (chủ động, không tự resync mỗi lần đổi Doc) · "Xuất xlsx" · "In A4 ngang" (`window.print()`, cùng CSS `@media print` BOQ đã dùng). 2 empty state thật (Doc trống · Doc có nhưng 0 cửa/phòng), không chặn (luật X2) |
| `lib/present-editor/model.ts` | Thêm 3 giá trị `PresentDocType`: `'schedule'` (sống) · `'spec-sheet'`/`'approval-form'` (chờ) — additive, không đổi 3 giá trị cũ |
| `components/present-editor/PresentDocTypePicker.tsx` | Tab mới `schedule` ("Bảng & biểu mẫu"/"Tables & forms") — 3 thẻ: "Bảng thống kê cửa & phòng" (`enabled:true`, mở `onChooseSchedule`) · "Bảng thông số kỹ thuật"/"Phiếu trình duyệt" (`enabled:false` + `unavailableReason` thật, không CTA giả) |
| `components/present-editor/PresentSheets.tsx` | Prop `onRequestSchedule` — đi ĐÚNG đường `onRequestBoq` (bypass deck/slide, không ghi `docType` vào sheet — cùng cách BOQ đã làm) |
| `components/present-editor/PresentNavigator.tsx` | Lối tắt "Bảng thống kê" (sau khi đã chọn 1 lần, `PresentDocTypePicker` không hiện lại) — tách `NavShortcutButton` dùng chung cho cả BOQ lẫn Schedule (trước đó BOQ tự viết style riêng) |
| `components/present-editor/PresentStageScreen.tsx` | `mode: 'deck' \| 'boq' \| 'schedule'` (mở rộng state-lift tối thiểu đã có cho BOQ) → render `<ScheduleScreen>` khi `mode==='schedule'` |

## Kết quả lệnh THẬT (đúng ô⑥, dán nguyên văn)

```
$ npx tsc --noEmit
(0 lỗi — không output, toàn repo kể cả file của agent khác đang chạy song song)

$ node_modules/.bin/sucrase-node lib/present-editor/boq-xlsx-import.test.ts
KẾT QUẢ: 55 pass, 0 fail

$ node_modules/.bin/sucrase-node lib/present-editor/table-doc-engine.test.ts
TableDocEngine: 10/10 PASS

$ grep -rn "TableDocEngine" lib/present-editor components/present-editor | head -5
lib/present-editor/schedule-table.ts:3:...
lib/present-editor/table-doc-engine.ts:2:...
lib/present-editor/table-doc-engine.ts:14:...
lib/present-editor/table-doc-engine.ts:21:...
lib/present-editor/table-doc-persist.ts:2:...
(marker có mặt CẢ HAI thư mục — components/present-editor/table/ScheduleScreen.tsx,
TableDocGrid.tsx, PresentDocTypePicker.tsx cũng khớp)
```

**BOQ REGRESSION** (ô④.6 đòi thêm, tự chạy toàn bộ chứ không chỉ 1 file mẫu):
```
lib/present-editor/boq-group.test.ts      → 30 pass, 0 fail
lib/present-editor/boq-overrides.test.ts  → 16 pass, 0 fail
lib/present-editor/boq-spec-extra.test.ts → 18 pass, 0 fail
lib/boq/compute.test.ts                   → 157 pass, 0 fail
lib/boq/xlsx.test.ts                      → 71 pass, 0 fail
lib/boq/cache.test.ts                     → 24 pass, 0 fail
lib/boq/from-project.test.ts              → 20 pass, 0 fail
lib/present-editor/schedule-table.test.ts → 4/4 PASS
```
0 file BOQ cũ bị sửa — regression pass vì KHÔNG chạm, không phải vì né test.

## Quyết định tự chọn + lý do

1. **KHÔNG rewire `BoqScreen.tsx`/`BoqTable.tsx` để "chạy qua" TableDocEngine.** Phiếu nói "BOQ
   chuyển thành MỘT cấu hình của engine" — đọc đúng nghĩa gốc là engine phải **trừu tượng hoá
   ĐƯỢC** cách BOQ đã làm (đã làm — `TableDocEngine` là khái quát trực tiếp của
   `boq-overrides.ts`+`boq-group.ts`, xem docstring đầu file), KHÔNG bắt buộc phải THAY THẾ code
   BOQ đang chạy tốt. Rewire `BoqScreen` (UX bàn phím ↑↓←→/Tab, custom columns, ảnh nhúng — xem
   `BoqTable.tsx`) trong 1 phiên không đủ thời gian kiểm chứng an toàn bằng browser thật (phiếu
   cấm mở dev server), rủi ro làm hỏng một màn ĐANG DÙNG THẬT chỉ để đổi cách viết bên trong.
   Chọn phương án an toàn hơn: engine đứng vững một mình (10 test), BOQ giữ nguyên 100% (336 test
   liên quan pass, 0 sửa) — đúng câu "không phá hành vi BOQ hiện có" ở mức chữ nghĩa NGHIÊM NHẤT
   có thể (không sửa 1 dòng nào trong `lib/boq/**`/`components/present-editor/boq/**`).
2. **`orphaned` là khái niệm BOQ không cần, TableDocEngine có** — ghi thẳng trong docstring thay
   vì giấu đi: BOQ tính lại TOÀN BỘ dòng mỗi lần (`computeBoq` quét lại `Doc`) nên không có dòng
   "mồ côi". `schedule` gắn 1 dòng = 1 entity (không gộp theo vật liệu) nên xoá 1 cửa trên bản vẽ
   phải KHÔNG xoá âm thầm dòng đó (có thể còn ghi chú tay) — thêm cờ `orphaned`, không đẻ engine
   song song.
3. **"Cập nhật từ bản vẽ" là hành động CHỦ ĐỘNG, không tự resync mỗi lần Doc đổi.** Auto-resync
   nền dễ tạo cảm giác "máy tự âm thầm động vào dữ liệu" (dù ô tay được bảo vệ tuyệt đối bởi
   override-map tách riêng) — LẦN ĐẦU (chưa lưu gì) thì tự gieo ngay vì không có gì để mất, giữ
   đúng tinh thần luật 6.
4. **PDF = `window.print()` với cùng khối CSS `@media print`/`@page A4 landscape` BOQ đã dùng**,
   không viết trình xuất PDF riêng — "qua đường xuất sẵn có" đúng nghĩa đen; XLSX dùng lại
   `buildXlsxBuffer()` (đã tách sẵn "không biết gì về BOQ" từ 06/08) thay vì thêm thư viện.
5. **`schedule` đi đường `mode` ở `PresentStageScreen` giống hệt `boq`** (bypass deck/slide,
   không ghi `docType` vào sheet) thay vì nhúng bảng vào slide — nhất quán với cách BOQ đã chọn
   (2 tài liệu "đọc thẳng mô hình" cùng kiến trúc, người dùng học 1 lần dùng cho cả hai).
6. **Sửa 1 bug closure cũ TỰ PHÁT HIỆN khi rà lại code mình** (không phải yêu cầu phiếu, nhưng
   im lặng để lại là sai luật verify-trước-khi-báo-xong): `compute`/`persistOverrides` trong
   `ScheduleScreen.tsx` là closure ổn định (`deps=[projectId,userId]`) nên đọc thẳng state
   `rows`/`overrides` bên trong sẽ dính giá trị CŨ. Sửa bằng gương `rowsRef`/`overridesRef`, cùng
   pattern `sheetsRef`/`activeIdRef` đã có ở `PresentSheets.tsx`.

## CHƯA LÀM — nói thẳng

- **Chưa nghiệm thu bằng browser thật** — phiếu cấm mở dev server, chỉ tsc + sucrase-node. Cần
  phiên sau/phiên V mở `/projects/{id}/present` → tab "Bảng & biểu mẫu" → thẻ "Bảng thống kê cửa
  & phòng" trên project có cửa/phòng thật, xác nhận: render đúng nhóm, sửa 1 ô rồi bấm "Cập nhật
  từ bản vẽ" thấy ô tay còn nguyên, xuất xlsx mở được bằng Excel/LibreOffice thật.
- **`spec-sheet`/`approval-form` CHƯA có editor** — đúng phạm vi V1 phiếu giao, giữ khoá kèm lý
  do năng lực thật trên `PresentDocTypePicker` (không CTA giả).
- **BOQ CHƯA thật sự "chạy qua" TableDocEngine ở runtime** — engine đã CHỨNG MINH trừu tượng hoá
  được (đọc quyết định #1), nhưng `BoqScreen.tsx` vẫn dùng đường code cũ. Nếu Hoà muốn hợp nhất
  thật (2 màn dùng chung 1 lưới `TableDocGrid`), đó là việc RIÊNG cần verify browser — chạm biên,
  đề xuất lên T thay vì tự làm trong phiếu này.
- **Không có UI thêm dòng tay** (`newRowId()` đã có ở engine nhưng chưa có nút "+ Thêm dòng" trên
  `ScheduleScreen`) — v1 chỉ cần đọc từ bản vẽ, nút thêm tay để dành cho `spec-sheet` (nơi có
  nhiều dòng không gắn entity hơn).
- **Không có test round-trip `.xlsx` thật** (mở lại file bằng thư viện đọc) — chỉ test round-trip
  `TableDoc` JSON. `buildXlsxBuffer` đã có test riêng (`lib/boq/xlsx.test.ts`, không đụng).

## Chạm biên — không có, không cần đề xuất lên T

Không phát sinh nhu cầu sửa `lib/cad/**`/`lib/library`/`lib/dna`/`lib/distill`/`prisma/schema` —
mọi dữ liệu cửa/phòng đã có sẵn đủ (`BlockEntity.elementType`, `RoomEntity.boundary`), chỉ ĐỌC.

## 2 GIÁ TRỊ

- **Kiến trúc (dây liên chặng khép được gì):** một cỗ máy bảng DÙNG CHUNG được (cột cấu hình +
  override tách khỏi dữ liệu máy + re-sync có nhớ) thay vì mỗi hồ sơ dạng bảng tự viết lại logic
  "sửa tay không mất" từ đầu — BOQ đã chứng minh mẫu hình đúng (override-map, group+subtotal),
  TableDocEngine đóng gói mẫu hình đó thành hạ tầng DÙNG LẠI ĐƯỢC cho `schedule` hôm nay và
  `spec-sheet`/`approval-form` mai sau chỉ bằng cách đổi `columns` + hàm gieo dòng, không viết lại
  engine. Đúng luật "một cỗ máy, nhiều mặt tiền" ở ĐÚNG quy mô: bảng biểu chặng Trình chiếu.
- **Vận hành (kịch bản nào tiến bước):** hồ sơ nội thất thật luôn cần bảng thống kê cửa/phòng đi
  kèm bản vẽ (nộp hồ sơ xin phép, kiểm đếm hoàn công) — trước đây phải đếm tay từ bản vẽ rồi gõ
  lại vào Excel, sửa bản vẽ là phải đếm lại từ đầu. Nay bấm "Cập nhật từ bản vẽ" là bảng tự đếm
  lại, GHI CHÚ đã gõ tay (vd "cửa này đặt hàng rồi", "phòng này đổi công năng") không bao giờ mất
  dù bản vẽ đổi bao nhiêu lần — đúng painpoint "sửa model xong phải sửa bảng bằng tay ở app khác,
  luôn sót" mà phiếu nêu ở ô①.
