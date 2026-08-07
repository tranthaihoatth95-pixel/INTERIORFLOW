# M-CAD-B-OUT — vá neo poché lúc nạp (3 việc) + đối chiếu 3 mock CAD

Phiên vùng `lib/cad/` · `components/cad/`, 07/08. V6: KHÔNG commit — chỉ sửa file + báo cáo.
KHÔNG đụng `docs/GAP-IF.md` (§0u — delta GAP ghi ở cuối file này, TỔNG gộp).
Nối tiếp `docs/M-HINH-HOC-OUT.md` (cùng phiên đo trước đó — không đo lại thứ đã đo).

## VIỆC 1 · G-M1-20 — `importDoc` nay reconcile ngay lúc nạp ✅

**Sửa:** `lib/cad/store.ts` hàm `importDoc` (grep `G-M1-20 (07/08)`) — thêm
`syncPocheAnchors(syncHostedOpenings(...))` quanh Doc trước khi `set()`, CẢ nhánh `replace`
LẪN `merge`. Không đổi field nào khác của hai nhánh (merge vẫn giữ markup/photo/siteImage cũ).
Engine giữ nguyên 100% — không sửa `poche.ts`/`hosting.ts`.

**VERIFY bằng file DXF thật** (6/6 file `~/Downloads/AI DATA/FILE MBHT/`, chạy store THẬT qua
`sucrase-node` — zustand chạy server-side, `store.ts:6`; script ở scratchpad phiên, không vào repo):

| File | hatch | hostId TRƯỚC (Doc thô từ parser) | hostId SAU importDoc |
|---|---|---|---|
| 03_TANG5B | 126 | 0 | **90** |
| 04_TANG8 | 161 | 0 | **90** |
| 05_TANG9 | 147 | 0 | **80** |
| 06_TANG10 | 139 | 0 | **80** |
| 07_TANG11 | 137 | 0 | **90** |
| 08_TANG12 | 138 | 0 | **90** |

Khớp ĐÚNG số engine đã đo ở `docs/M1-OUT.md` PHẦN 4 ① (90/90/80/80/90/90) ⇒ importDoc gọi đúng
đường reconcile, không đường thứ hai. Phần không neo còn lại là hatch thật sự không có đường bao
trong tệp (lớp `htch` — đã ghi từ M1, K3 không bịa chủ).

## VIỆC 2 · G-M1-21 — đường `.idf` cũng thiếu, ĐÃ vá cùng khuôn ✅

**Đo trước khi kết luận** (đúng lệnh "grep trước"): `components/cad/CadSheets.tsx` có MỘT phễu
`docAndSheetsFromIdf()` (grep `G-M1-21 (07/08)`, trước sửa ở :265-277) — nó ĐÃ gọi
`syncHostedOpenings` (cửa/cửa sổ) nhưng **KHÔNG gọi `syncPocheAnchors`** ⇒ kết luận: thiếu thật,
đúng nửa vời. Cả 4 đường nạp đi qua phễu này (grep `docAndSheetsFromIdf(`):
`:354` import `.idf` · `:407` mount/cache · `:724` phục hồi `.ifpack` · `:772` phục hồi backup.

**Sửa:** bọc `syncPocheAnchors(...)` quanh cả 2 nhánh (1 sheet + gộp nhiều sheet) + import từ
`@/lib/cad/poche`. Vá 1 chỗ phủ cả 4 đường. Nhánh rỗng (`emptyDoc`) không cần — 0 entity.

## VIỆC 3 · G-M1-14 — poché sống sót vòng xuất→nhập DXF ✅ (tìm ra gốc KHÁC dự đoán)

**Gốc thật KHÔNG phải thiếu reconcile.** Đo bằng round-trip nhỏ: tường `wallSegment` xuất DXF ra
**0 entity HATCH** — hatch poché (`solid:true`, KHÔNG có `pattern`, `commands.ts` grep
`wallSegment`) rơi vào fallback cũ ở `lib/cad/dxf.ts` case `'hatch'`: "không pattern → LWPOLYLINE
biên, không tô". Nạp lại được 2 polyline trùng khít — mảng tô CHẾT HẲN, đúng nguyên văn GAP:55
"hatch quay về đường nhiều đoạn". Fallback đó viết từ thời HATCH-export chưa an toàn; từ khi
G-M1-18 thêm đủ dấu lớp con thì hết lý do tồn tại cho hatch solid.

**Sửa:** `lib/cad/dxf.ts` case `'hatch'` (grep `G-M1-14 (07/08)`) — `patternName = e.pattern ??
(e.solid ? 'SOLID' : undefined)`; hatch solid nay đi nhánh HATCH THẬT với pattern `SOLID`.
Fallback LWPOLYLINE chỉ còn cho hatch không-solid không-pattern (không có cách thể hiện).

**2 test cũ khoá HÀNH VI CŨ (= khoá đúng cái bệnh) — đổi có chủ đích, ghi lý do trong test:**
- `dxf.roundtrip.test.ts` mục [3] dòng đầu (trước: "hatch không pattern → POLYLINE, hành vi cũ
  giữ nguyên") → nay khoá "hatch solid → HATCH thật, round-trip vẫn là hatch solid".
- `dxf-openable.test.ts` mục [3] (trước: "vẫn đi đường LWPOLYLINE") → nay khoá "HATCH thật, đủ
  2 dấu lớp con AcDbEntity+AcDbHatch, pattern SOLID".
- Test MỚI `dxf.roundtrip.test.ts` mục [9]: cặp poché tường xuất→nhập→reconcile → vẫn neo, cùng
  layer, 0 cặp rách.

**VERIFY 3 tầng:**
1. **ezdxf (bộ đọc chuẩn, đúng chuẩn nghiệm thu G-M1-18):** file 2 tường + 1 chuỗi tường →
   `recover.readfile` **0 lỗi audit**, đọc ra đúng 3 HATCH `pattern=SOLID, solid_fill=1` + 3
   LWPOLYLINE. File THẬT 03_TANG5B xuất lại → **0 lỗi audit, đủ 126 HATCH** ⇒ G-M1-18 không hồi quy.
2. **Tròn vòng file thật:** 03_TANG5B nạp → 126 hatch/90 neo → XUẤT → NẠP LẠI → reconcile →
   **vẫn 126 hatch/90 neo**. Trước sửa: 0 hatch sống sót.
3. **Toàn bộ 72 file test `lib/cad/*.test.ts` chạy lại: 0 fail** (kể cả poche 30 · poche-import 19
   · hosting 28 · hatch 45 · idf 42 · sheet-migrate 34 · dxf-* 6 bộ). `npx tsc --noEmit -p .`
   sạch — còn đúng 1 lỗi CÓ SẴN `render-layer-index.test.ts:36` (của phiên khác, không đụng).

File tạm chứa dữ liệu khách (2 file .dxf xuất thử trong scratchpad) đã xoá ngay sau khi đo.

---

# ĐỐI CHIẾU MOCK (việc chèn giữa phiên — làm 3/36 mock thuộc vùng CAD, đúng lệnh "2-3 rồi báo")

Mở bằng trình duyệt thật (screenshot + đọc DOM), KHÔNG sửa mock. Code đối chiếu bằng grep tận dòng.

## Mock 1 · `Nhập bản vẽ có sẵn.dc.html` (14:00 07/08) ↔ màn nhập DXF/DWG (`CadEditor.tsx`)

> Đóng thẳng G-M5-01 phần "chưa có mock" — mock NAY CÓ. Phần code-thiếu bên dưới là GAP mới.

| Mock có gì | Code có chưa | Lệch ở đâu |
|---|---|---|
| Kéo-thả tệp/thư mục, tối đa 60 tệp/lần, nạp THEO LÔ | 🔴 chưa | `CadEditor.tsx` grep `onImportFile`: `e.target.files?.[0]` — mỗi lần đúng 1 tệp, DXF/DWG 2 input rời, không kéo-thả |
| Nút "Lấy từ hồ sơ dùng chung" (nguồn thứ 2) | 🔴 chưa | không có đường nạp từ File Manager vào màn 2D (`grep -rna "hồ sơ dùng chung" components/cad/` = 0) |
| Phân 3 hạng NGAY TRƯỚC nạp: vector đầy đủ · bản in bẹt lớp (khai tỉ lệ tay) · ảnh chỉ làm nền | 🟡 một phần | code phân loại SAU khi parse (report `skipped`/warnings); chưa có phân hạng theo LOẠI TỆP trước nạp; đường "ảnh làm nền tham chiếu" có ở photo embed nhưng không nối vào cùng cửa nhập |
| Tiến độ lô: "Đọc xong 13 · còn 7 · chừng 40 giây" + bảng từng tệp + 65% | 🟡 một phần | code có tiến độ + Huỷ cho TỪNG tệp (G-M1-01 đã xong, thanh `dxfImportAbort` `:743-748`) — không có lô nên không có đếm tệp/bảng |
| Huỷ giữa chừng GIỮ phần đã đọc ("13 tờ đã đọc vẫn nằm chờ ở báo cáo") | 🔴 chưa | code huỷ = bỏ cả tệp (`dxf-import.ts` reject), không có kết quả giữa chừng |
| **Mã lần nạp** `NAP-2026-0807-03`, "cùng bộ tệp nạp lại ra đúng kết quả" (KS2) | 🔴 chưa | không có khái niệm "lần nạp" trong code — `grep -rna "NAP-\|importSession" lib/cad/ components/cad/` = 0 |
| "LẦN NẠP GẦN ĐÂY" — lịch sử nạp, mỗi lần giữ báo cáo riêng, **lùi về trước lần nạp bất kỳ** (KS4) | 🔴 chưa | undo hiện là snapshot chung (≤50 bước), không có mốc "lần nạp" đặt tên; báo cáo nạp (`dxfLoad`) chỉ giữ LẦN CUỐI, đổi tệp là mất |
| "Chạy nền, tôi làm việc khác" | 🟡 một phần | worker đã chạy nền thật (G-M1-01) nhưng UI chặn bằng thanh trạng thái, không có nút thoát ra làm việc khác rồi quay lại |
| **Báo cáo nạp = CHECKPOINT DUYỆT TỪNG TỜ** (KS3): nhóm Đọc được (tick từng tờ) · Cảnh báo (lý do + nút sửa + bỏ tờ) · Bỏ qua; "máy không tự nạp gì cho tới khi bấm nút quyết định"; nút cuối "Đưa 17 tờ vào hồ sơ" | 🔴 **lệch nặng nhất** | code `importDoc(doc,'replace')` NGAY khi parse xong (`CadEditor.tsx:438`) — vào thẳng bản vẽ rồi mới hiện báo cáo. Ngược 180° với mock. Khuôn duyệt ĐÃ CÓ SẴN: `components/studio/Checkpoint.tsx` (§0j — cấm dựng checkpoint thứ hai) |
| "Huỷ bỏ lần nạp" sau khi đã xem báo cáo | 🔴 chưa | chỉ còn ⌘Z chung, không nút hoàn tác đích danh lần nạp |

## Mock 2 · `Xem cấu kiện.dc.html` (21:16 06/08) ↔ Inspector chọn vật (`CadEditor.tsx` BimAssignBox/WallTypeBox + `components/studio/CadInspectorPages.tsx`)

| Mock có gì | Code có chưa | Lệch ở đâu |
|---|---|---|
| Tên định danh cấu kiện: "Cột C2 · Trục C · giao 2 · tầng 4" | 🔴 chưa | code hiện loại + đếm ("BIM · IFC — n đối tượng", `BimAssignBox`), không có TÊN/mã từng cấu kiện, không suy vị trí theo trục |
| Badge nguồn gốc **TỪNG THUỘC TÍNH**: ✓KHAI BÁO / SUY ĐOÁN (mock có 2 badge mỗi loại) | 🟡 một phần | code có đúng 1 badge "suy đoán" cho `elementType` (`CadEditor.tsx` grep `suy đoán` trong `BimAssignBox`); kích thước/cao độ chưa có cờ nguồn gốc riêng |
| KÍCH THƯỚC sửa được: Rộng/Cao/Sâu (mm) + cao độ | 🟡 một phần | tường có ô "dày khai báo" (`WallTypeBox` grep `wallThicknessMm`); Rộng/Cao/Sâu tổng quát cho khối/cột thì chưa |
| THUỘC TÍNH: Vật liệu · Màu · Layer · Chịu lực · Phòng/vị trí · Mã sản phẩm | 🟡 một phần | Layer/Màu có ở SelectionInfo; Vật liệu qua MaterialPalette (gán, không hiện trong inspector); **Chịu lực, Phòng/vị trí (suy từ biên phòng), Mã sản phẩm** = 0 (grep `Chịu lực\|Mã sản phẩm` components/cad = 0). "Phòng/vị trí" đụng G-M2-04 (chưa có đối tượng phòng) |
| Nút hành động cạnh panel: Chọn · Đo · Ghi chú · Sửa | 🟡 một phần | Chọn/đo có tool riêng ở toolbar; không có cụm nút ngữ cảnh theo vật đang chọn |
| Footer đếm: "1 vật đang chọn · 318 vật trên bản vẽ" | 🔴 chưa | StatusBar không đếm tổng vật trên bản vẽ cạnh số đang chọn (grep `vật trên bản vẽ` = 0) |
| Chọn NHIỀU vật: "6 vật đang chọn", chỉ thuộc tính CHUNG, chỗ khác ghi "**Nhiều giá trị**", nút "Sửa 6 vật" | 🟡 một phần | `BimAssignBox` xử lý multi (storey/type chung) nhưng chỗ khác nhau hiện RỖNG chứ không ghi "Nhiều giá trị" (grep = 0) — người dùng không phân biệt được "chưa gán" với "khác nhau" |

## Mock 3 · `2D Kỹ thuật.dc.html` (15:41 06/08) ↔ màn 2D (3 trạng thái cùng 1 màn)

| Mock có gì | Code có chưa | Lệch ở đâu |
|---|---|---|
| Cây lớp trái **NHÓM THEO TẦNG** (TẦNG TRỆT: Tường·Cửa·Đồ đạc·Kích thước·Ghi chú / TẦNG MỘT: …), mỗi lớp có ẩn-hiện + khoá | 🟡 một phần | ẩn/khoá lớp có (`Layer.visible/locked`); nhóm theo tầng thì chưa — `Doc.layers` phẳng, không nối `storey` (Level đã có trong model nhưng cây lớp không đọc) |
| Trạng thái 01 chọn tường → inspector: Dày · **Cao thông thuỷ** · "**9 tường ngăn dày 160, cùng tầng trệt**" (sửa loại ăn mọi tường cùng loại — type/instance) | 🟡 một phần | Dày khai báo có (`WallTypeBox`); cao thông thuỷ per-tường: `heightMm` có trong model nhưng chưa lộ ô sửa ở inspector tường 2D (CHƯA GREP kỹ — ghi để kiểm); **đếm "9 tường cùng loại" + sửa lan cả loại = 0** (đúng mục "type/instance CHƯA ĐẦY ĐỦ" ở `SO-KIEM-TONG.md` §7) |
| Trạng thái 02 chọn PHÒNG → inspector phòng: Diện tích · Chu vi · Lớp sàn ("Gỗ sồi ghép thanh") · Lớp hoàn thiện · nút Đổi lớp sàn/hoàn thiện | 🔴 chưa | cần ĐỐI TƯỢNG PHÒNG — đúng G-M2-04 (đã ghi GAP, 🔴). Mock này chính là HỢP ĐỒNG giao diện cho nó — G-M2-04 hết cảnh "thiếu cả spec lẫn UI" |
| Nhãn phòng + m² SỐNG trên bản vẽ (24.60 m²…) | 🔴 chưa | đúng G-M2-03 (nhãn m² là chữ chết, đã ghi GAP) |
| Trạng thái 03 đang vẽ tường → dòng trạng thái "Bắt điểm: Đầu mút, Giữa cạnh" · "vuông góc" | 🟡 một phần | snap engine + marker trên canvas có thật (`drawSnap`); dòng chữ NÓI TÊN điểm bắt đang dính ở status — CHƯA GREP, cần kiểm `StatusBar`/`CadCanvas` trước khi kết luận |
| Chip khung nhìn "Mặt bằng tầng trệt · Tỉ lệ 1:50" trên canvas | 🟡 một phần | tỉ lệ có ở khung tên/print settings; chip nổi trên canvas gọi tên sheet + tỉ lệ — CHƯA GREP |

---

## DELTA GAP cho TỔNG gộp (§0u — tôi không đụng GAP-IF.md)

- **G-M1-20** → ✅ ĐÃ SỬA 07/08 (phiên CAD-B) — importDoc reconcile lúc nạp, verify 6/6 file thật 0→80-90 neo.
- **G-M1-21** → ✅ ĐÃ SỬA 07/08 — phễu `docAndSheetsFromIdf` (CadSheets) thêm `syncPocheAnchors`, phủ 4 đường nạp .idf/.ifpack/backup/cache.
- **G-M1-14** (GAP:55) → ✅ ĐÃ SỬA 07/08 — hatch solid xuất HATCH thật (SOLID); ezdxf 0 lỗi; tròn vòng file thật 126/90 giữ nguyên; 2 test cũ khoá-hành-vi-bệnh đã đổi có chủ đích + 1 test mới.
- **G-M5-01** → 🟠 THU HẸP — mock `Nhập bản vẽ có sẵn.dc.html` NAY CÓ (07/08 14:00); phần còn thiếu chuyển thành GAP code (2 dòng dưới).
- **GAP MỚI đề xuất (mã tạm, TỔNG đánh số):**
  - [CAD-B-a] Cửa nhập bản vẽ chưa theo hợp đồng mock: nạp 1-tệp-1-lần, vào thẳng hồ sơ không qua checkpoint duyệt-từng-tờ (KS3), không mã lần nạp (KS2), không lịch sử/hoàn tác theo lần nạp (KS4), không nạp lô/kéo-thả/nguồn-hồ-sơ-chung. Khuôn `Checkpoint.tsx` có sẵn (§0j). Nguồn: bảng Mock 1 ở trên.
  - [CAD-B-b] Inspector cấu kiện thiếu so hợp đồng `Xem cấu kiện`: tên định danh theo trục/tầng · badge nguồn gốc TỪNG thuộc tính · "Nhiều giá trị" khi multi-select · đếm tổng vật · Chịu lực/Phòng-vị trí/Mã sản phẩm. Nguồn: bảng Mock 2.
  - [CAD-B-c] Cây lớp chưa nhóm theo tầng; inspector tường chưa có "N tường cùng loại + sửa lan cả loại" (type/instance). Nguồn: bảng Mock 3.
  - (G-M2-03/04 giữ nguyên 🔴 — mock 3 nay là hợp đồng UI cho cả hai.)

## HÀNG ĐỢI (§V7)

- ✅ VIỆC 1 (G-M1-20) · VIỆC 2 (G-M1-21) · VIỆC 3 (G-M1-14) — xong, verify đủ, 72 bộ test 0 fail.
- ✅ Đối chiếu mock: 3/36 làm xong (`Nhập bản vẽ có sẵn` · `Xem cấu kiện` · `2D Kỹ thuật`).
- ⬜ 33 mock còn lại chưa đối chiếu — trong vùng CAD còn đáng làm tiếp: `Chế độ Chuyên` ·
  `Chế độ Phác thảo` · `Kết quả chia khu` · `Nhận đề bài` · `Phiên bản hồ sơ` · `Kéo thả`.
- ⬜ Việc treo từ M-HINH-HOC-OUT chưa động: G-M1-12 (diện tích trong block mồ côi) · POINT entity ·
  "2 HATCH/file dựng lỗi" · toàn bộ VIỆC 4 cũ (G-M2-03/04/05/06/07/08/09, G-M1-05).
- ⬜ 3 chỗ tôi ghi CHƯA GREP ở bảng Mock 3 (cao thông thuỷ ở inspector · dòng tên điểm bắt ·
  chip tỉ lệ trên canvas) — kiểm nốt trước khi TỔNG biến chúng thành GAP.
- Không chờ ai: mọi việc trên tự chạy tiếp được khi có phiếu.
