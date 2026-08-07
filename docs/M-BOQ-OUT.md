# M-BOQ-OUT — phiếu p2 · BOQ/FF&E/bảng món/dây chuyền ảnh→bản vẽ (07/08 tối)

Phiên: **p2**. Vùng sở hữu theo phiếu: `lib/boq/` · `lib/ffe/` · `lib/blocks/` · `components/present-editor/boq/` · `lib/export/`.
⚠️ **`lib/blocks/` và `lib/export/` KHÔNG TỒN TẠI trên đĩa** (`ls` xác nhận) — phiếu ghi 2 thư mục ma, báo để TỔNG sửa phiếu mẫu.
Luật đã theo: **V6 không commit** · **§0u chỉ ghi file này, không đụng GAP-IF.md** · N1/N5/N6/N8 · §0t (`grep -rna`).
Đã đọc trước khi làm: `docs/M-FIX-C-OUT.md` (trọn 564 dòng) · đúng các dòng GAP 22, 23, 30, 32-36, 88, 89, 90 · `docs/M-IDFC-OUT.md` **chưa tồn tại** (p13 chưa báo cáo).

---

## KẾT LUẬN LỚN NHẤT, NÓI TRƯỚC: 3/4 việc chính của phiếu ĐÃ CÓ CODE SẴN từ mẻ 06/08 — sổ GAP lỗi thời (§0ab)

Phiếu giao "làm" G-M3-02/03/14 nhưng đo lại bằng `grep -rna` + đọc code thì cả ba **đã được viết
từ 06/08** (nằm trong working tree chưa commit / commit WIP `8a850f5`). Sổ GAP vẫn ghi 🔴 vì các
dòng đó viết trước khi mẻ tồn tại. **Việc thật của phiên này là NGHIỆM THU BẤM THẬT (N6) thứ chưa
ai bấm** — và đã bấm được phần lõi. Không viết lại thứ đã có (N8/§0ab).

| Việc | Sổ ghi | Đo lại 07/08 | Phiên này làm |
|---|---|---|---|
| VIỆC 1 · G-M3-02 kiểu dữ liệu BẢNG | 🔴 chưa sửa (:22) | **ĐÃ CÓ**: `lib/types.ts:14` `DataType` có `'table'` · khối `util.ffetable` "Bảng món" đăng ký đủ 4 kho (`defs/index.ts:26,39` · `groups.ts:95` nhóm Hồ sơ · `keywords.ts:73` 14 từ khoá · cổng roundtrip 5000 món có test) · `edgeStyleFor()` (`lib/store.ts:320-327`) đã cho cạnh 'table' NÉT ĐỨT đúng nhóm dữ liệu | Nghiệm thu bấm thật + sửa 1 comment lỗi thời (dưới) |
| VIỆC 2 · G-M3-03 nối vision→block | 🔴 chưa sửa (:23) | **ĐÃ CÓ**: `components/render-studio/ToolModeForm.tsx:626` `MeasurementToCadButtons` — 2 nút "⬒ Dựng khối trên bản vẽ" + "⊞ Ba hình chiếu", gọi `buildFurnitureFromMeasurement`/`orthoViewsToEntities` (`ToolModeForm.tsx:659,694`), mount tại `:436` trong panel kết quả đo | **BẤM THẬT cả 2 nút — đạt N6, chi tiết dưới** |
| VIỆC 3 · G-M3-14 thả từ Thư viện | 🔴 chưa sửa (:34) | **ĐÃ CÓ**: `components/cad/LibraryDropBridge.tsx` (nghe `LIBRARY_INSTANTIATE_EVENT` tại `:112`, mount `CadEditor.tsx:595`) — đường ① BLOCKS ra `BlockEntity` GIỮ DANH TÍNH, đường ② .dxf vẫn phẳng nhưng câu báo nói thẳng | Xác minh mount (N6 mức grep) · **bấm-thả qua UI DỪNG** vì đụng vùng p13 (dưới) |

---

## VIỆC 2 — NGHIỆM THU BẤM THẬT G-M3-03 (N6 ✅ phần lõi)

Trình duyệt thật `127.0.0.1:3008` (dev server riêng `interiorflow-h1`, đã tắt sau phiên), đăng nhập
demo, "Dự án mẫu", chặng Thiết kế 3D:

1. Mở công cụ **"Ghi kích thước"** từ panel khối (tìm ra bằng từ khoá "đo món" — kho từ khoá sống).
2. Nạp ảnh test (sofa vẽ bằng canvas 800×600, tiêm qua đúng `input[type=file]` + event `change`
   thật — không gọi tắt hàm nào).
3. Bấm **▶ Render** → máy đo chạy thật: **Rộng 1438±288 ĐO · Sâu ~875±75 SUY · Cao 850±50 ĐO,
   độ tin 65%**, cảnh báo "Mặt khuất là suy diễn" hiện đúng (KS5/K3 sống).
4. Bấm **"⬒ Dựng khối trên bản vẽ"** → `useCadStore` nhận **6 entity** (line+polyline, layer
   `l-furniture`).
5. Bấm **"⊞ Ba hình chiếu"** → thêm **8 entity** (tổng 14), thanh trạng thái ghi đúng câu
   *"Đã đặt 3 hình chiếu (8 nét). Mặt khuất là suy diễn — kiểm tra trước khi sản xuất. ⌘Z để lùi."*
6. **Chuyển chặng Thiết kế 2D — NHÌN THẤY BẰNG MẮT**: khối sofa (mặt bằng) + 3 hình chiếu
   (mặt bằng · mặt đứng · mặt bên) nằm trên bản vẽ thật, ⌘9 zoom fit trọn hình (ảnh chụp trong
   transcript phiên). Đúng luật X1/K1: dựng từ chặng 3D, mở 2D thấy ngay, không "xuất sang".
7. Autosave CAD ghi thật ("Đã lưu lúc 18:10") ⇒ sau nghiệm thu đã **xoá 14 entity qua
   `removeIds()`** (không `setState({doc})`, đúng luật 04/08) + ép lưu lại ("Đã lưu — 18:12", 0 entity).

🟡 **Ca phụ chưa đạt**: đường trượt-ngưỡng (không chọn "Loại đồ" → khối tạm + ghi `TemplateRequest`
vào hàng đợi mẫu) chưa bấm riêng — chỉ có test sẵn của `to-cad.test.ts`. Ghi lại, không giả vờ.

## VIỆC 1 — nghiệm thu G-M3-02 trên trình duyệt

- Node **"Bảng món"** tìm được qua tìm kiếm ("đo món"/"bảng món"), **thêm được vào canvas thật**
  (store ghi `defType: 'util.ffetable'` — đo bằng `__flowStore.getState()`).
- Test vùng chạy lại 07/08: `ffe-table.test.ts` **40/40** · `port.test.ts` **31/31** (cổng table
  roundtrip) · cùng compute 157 · xlsx 71 · item 44 · sheet 71 — **414 pass, 0 fail**.
- **Sửa 1 comment lỗi thời** (đúng tinh thần §0i, sửa ngay trong phiên): `lib/types.ts:180-182` cũ
  nói *"cạnh 'table' vẽ nét LIỀN vì edgeStyleFor chưa có 'table'"* — SAI so code hiện tại
  (`lib/store.ts` nhánh `isData` đã có `'table'`). Đã thay bằng ghi chú đính chính + ghi rõ điều
  còn đúng duy nhất: `table: '#c79a63'` vẫn là hex trần một-theme (cùng lớp bệnh G-NB-03 đã sửa cho
  text/video) — muốn sạch cần token `--p-table` 2 theme, **chưa làm** (đụng globals.css là vùng
  S5/p-khác đang chạm, và cần chọn giá trị bản Sáng có căn cứ đo tương phản).

## VIỆC 3 — danh tính cấu kiện: phần nào xong, phần nào DỪNG-BÁO

| Mã | Trạng thái thật | Của ai |
|---|---|---|
| G-M3-14 | Bridge ĐÃ CÓ + mount thật (`CadEditor.tsx:97,595` — grep dán ở bảng trên). **Bấm-thả qua UI: DỪNG** — tấm Thư viện đang là code p13 sửa dở (phiên này 2 lần chứng kiến app vỡ runtime `ReferenceError: BAYS is not defined` tại `LibrarySheet.tsx` giữa lúc p13 ghi file; kệ hiện tại gắn nhãn "Dữ liệu mẫu", có kệ "Cấu kiện (.idfc) 0" MỚI của p13). Bấm lúc này ra kết quả không phản ánh code cuối. | p2 xác minh xong phần grep; click-through chờ p13 xong |
| G-M3-10 | Đường ① của bridge đã GIỮ danh tính (BlockEntity + specId được). Phần còn phẳng là đường ② `.dxf` — sửa nằm ở `lib/cad/block-library.ts`/`insertBlockById` = **`lib/cad/` — vùng p9 giữ, CẤM theo phiếu** | **DỪNG, BÁO** |
| G-M3-15 | Hai cửa thư viện song song = ĐÚNG việc gộp G-M16 p13 đang làm (thấy tận mắt kệ .idfc mới trong sheet) | **DỪNG, BÁO — trùng việc p13** |

## VIỆC 4 — kho nội dung mỏng: TOÀN BỘ nằm ngoài vùng p2 được phép chạm

| Mã | Chỗ sửa thật | Vì sao p2 không làm |
|---|---|---|
| G-M3-12 (thêm block văn phòng) | `public/cad-library/**` + `scripts/cad-library/**` | Vùng `VE-block` (§0l) + luật §0m: sinh hình phải chia đợt ≤8 món, render PNG, DỪNG chờ Hoà duyệt từng đợt — không phải việc nhét cuối một phiếu code |
| G-M3-13 (cụm lễ tân/lounge/pantry) | `lib/cad/workstation-clusters.ts` | `lib/cad/` — p9 giữ, CẤM |
| G-M3-16 (số nhân sự → rải cụm) | `lib/cad/ai-assist.ts` + bảng công năng trong `lib/cad/` | `lib/cad/` — p9 giữ, CẤM |

⇒ Đề nghị TỔNG: chuyển 3 mã này sang phiếu cho đúng phiên (VE-block · p9), đừng để trong phiếu BOQ.

## VIỆC 5 — phần làm được trong thời lượng

- **G-M3-17** (đường ghi cửa nhập → DB): chỗ sửa là `lib/materials/warehouse/*` + `MaterialImportWizard`
  = **`lib/materials/` — p13 giữ, CẤM theo phiếu**. DỪNG, BÁO. (Lưu ý cho TỔNG: `M-FIX-C-OUT` §7-§8
  cho thấy `room`/`confidence` ĐÃ lưu DB từ 06/08 tối; cái còn thiếu đúng là `qty` per-dòng-nhập —
  phạm vi đã hẹp hơn dòng :90 mô tả.)
- **G-C-01** (:88 — hộp xuất PDF Trình chiếu nhận 1 tờ): đọc đúng dòng + đọc code hiện tại —
  `components/present-editor/Toolbar.tsx:261` vẫn `sheets={[{id:'current',label:'Trang hiện tại'}]}`,
  còn khổ giấy đã bị KHOÁ CÓ LÝ DO (`paperLockedReason`, `:262-265` — đúng §9, không phải nút giả).
  Việc còn lại là luồn `Sheet[]` thật từ `PresentSheets` xuống + xuất từng tờ — đụng
  `PresentEditor.tsx`/`PresentSheets.tsx` NGOÀI vùng hẹp của phiếu này và file đó nhiều phiên đang
  chạm; **không làm trong đợt, ghi nguyên trạng**.
- **G-C-02** (:89 — Bảng tròn chưa gắn thao tác): **ĐÃ LỖI THỜI** — `RadialToolMenu` nay mount thật
  trong `components/print/ExportPdfDialog.tsx:36,290` (phiên soi 16 mảng đợt 2 đã spot-check, xem
  `M-SOI-16-MANG-OUT.md` mục spot-check). Đề nghị TỔNG đóng dòng :89 cùng đợt với G-M13-03.
- **Mở .xlsx bằng Excel THẬT** (nợ ghi ở `M-FIX-C-OUT` §4.2 — mới có Numbers + openpyxl):
  1. Sinh 2 file bằng ĐÚNG engine sản phẩm chạy qua `tsx` (KHÔNG viết máy ghi thứ hai):
     `boqResultToXlsxBuffer` → `boq-excel-test.xlsx` 6.828B · `buildFfeSheet`+`ffeSheetToXlsxBuffer`
     → `ffe-excel-test.xlsx` 8.187B; `file` nhận cả hai là "Microsoft Excel 2007+".
  2. Máy CÓ Microsoft Excel thật (`/Applications/Microsoft Excel.app`) — đã `open -a "Microsoft Excel"`
     file BOQ, lệnh mở thành công, **Excel đang giữ file mở sẵn trên máy cho Hoà liếc**.
  3. 🔴 **Đọc ngược ô bằng AppleScript BỊ CHẶN** — macOS Automation permission (-10003 "Không được
     phép truy cập", rồi treo ở hộp xin quyền vì không có người bấm). ⇒ mức bằng chứng dừng ở
     "Excel mở file không phản đối ở tầng lệnh"; **CHƯA VERIFY nội dung ô bằng Excel** — cần Hoà
     một lần: mở System Settings → Privacy & Security → Automation, cho phép terminal điều khiển
     Excel, hoặc đơn giản là tự liếc file đang mở. File nằm tại
     `/private/tmp/claude-501/-Users-tranben-Downloads-interiorflow/cd96defc-1e46-43dd-8464-2cd52a27f1ea/scratchpad/`.

---

## Sự cố hai-phiên-chung-repo trong phiên (ghi để đối chiếu, không đổ lỗi)

1. App vỡ runtime 2 lần vì `LibrarySheet.tsx` nửa-ghi của p13 (`BAYS is not defined`) — code trên
   đĩa lúc kiểm lại thì nhất quán; là stale chunk giữa lúc ghi file.
2. `npx tsc --noEmit -p .` có lúc **EXIT 2 với ~13 lỗi toàn ở `components/cad/CadEditor.tsx`**
   (thiếu import `LayoutPanelTop`/`RoomDetection`… — phiên khác đang code dở); ~15 phút sau chạy
   lại **EXIT 0**. ⇒ Câu "tsc sạch" của bất kỳ phiên nào tối nay đều là ảnh chụp thời điểm.
3. Nhiều file trong vùng phiếu (`lib/boq/*`, `lib/ffe/*`, `components/present-editor/boq/*`) đã
   dirty sẵn từ mẻ 06/08 chưa commit — diff hiện tại KHÔNG phân biệt được của ai; phiên này chỉ
   nhận đúng 1 sửa code: **comment `lib/types.ts` (khối DATA_TYPE_COLORS.table)**.

## File phiên này sửa (đúng, đủ)
```
lib/types.ts        (CHỈ comment — đính chính ghi chú lỗi thời về edgeStyleFor/'table')
docs/M-BOQ-OUT.md   (file này)
```
Scratch NGOÀI repo: `scratchpad/gen-xlsx.ts` + 2 file .xlsx test (thư mục tạm phiên, không vào repo).
**KHÔNG `git add`/`commit`/`push`** (V6). **KHÔNG đụng GAP-IF.md** (§0u).

## Nghiệm thu cuối
- `npx tsc --noEmit -p .` → **EXIT 0** (lần chạy cuối 18:0x, sau khi phiên kia sửa xong CadEditor).
- Test vùng: **414 pass, 0 fail** (compute 157 · xlsx 71 · item 44 · sheet 71 · port 31 · ffe-table 40).
- Dữ liệu test đã dọn sạch, xác nhận bằng số: CAD `doc.entities = 0` (đã ép lưu, "Đã lưu — 18:12") ·
  flow `nodes = 0`, `groups = 0` — **kể cả leftover "Nút tổng 1" của phiên H1 trước** (món nợ
  "chưa dọn được" trong `M-VO-H1-OUT.md` nay ĐÓNG: xoá bằng `ungroupById()`, sidebar hết mục).
- Dev server riêng đã tắt cả 3 lần mở.

## HÀNG ĐỢI CUỐI LƯỢT (§V7)

| | Việc | Trạng thái |
|---|---|---|
| ✅ | VIỆC 1 G-M3-02 | Đóng bằng đo lại + bấm thật node Bảng món + 71 test cổng/bảng — đề nghị TỔNG hạ 🔴→✅ dòng :22 |
| ✅ | VIỆC 2 G-M3-03 | **Bấm thật 2 nút, hình vào bản vẽ 2D, nhìn bằng mắt** — đề nghị TỔNG hạ 🔴→✅ dòng :23 (ghi chú: silhouette mặt đứng vẫn từ hộp bao, hạn chế đã khai trong docblock code) |
| ✅ | Excel thật (một nửa) | File mở được bằng Excel thật; **CHƯA VERIFY ô** — chặn bởi quyền Automation, chờ Hoà liếc file đang mở |
| 🟡 | G-M3-14 | Code + mount xác minh xong; **bấm-thả UI treo chờ p13 gộp xong Thư viện** |
| ⛔ | G-M3-10 · 12 · 13 · 16 · 17 | Chỗ sửa nằm trọn trong vùng p9 / p13 / VE-block — DỪNG BÁO, đề nghị TỔNG chuyển phiếu |
| 🟡 | G-C-01 | Còn thật (1 tờ cứng ở `Toolbar.tsx:261`) nhưng đụng file nhiều phiên đang chạm — để phiếu riêng |
| 🔎 | G-C-02 | Đề nghị TỔNG ĐÓNG — RadialToolMenu đã mount (`ExportPdfDialog.tsx:290`) |
| ⏳ | Chờ Hoà | ① liếc `boq-excel-test.xlsx` đang mở trong Excel (hoặc cấp quyền Automation một lần để phiên sau tự đọc ô) — ngoài ra KHÔNG có gì chờ quyết |
