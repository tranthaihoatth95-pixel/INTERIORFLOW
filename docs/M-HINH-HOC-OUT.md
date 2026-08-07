# M-HINH-HOC-OUT — VIỆC 1 (đào gốc poché) + tình trạng thật VIỆC 2·3·4

Phiên `lib/cad/` · `components/cad/`, 07/08. V6: KHÔNG commit, chỉ sửa + báo cáo.

⚠️ **Trước khi đọc phần "chưa làm" bên dưới: nhiều mục trong brief đã LỖI THỜI.** `docs/GAP-IF.md`
chưa được TỔNG gộp bản delta mới nhất từ `docs/M1-OUT.md` PHẦN 4 (§0u — một người ghi là TỔNG,
phiên fix chỉ ghi `M-OUT` riêng). Đã kiểm bằng `grep -rna` + chạy test thật, KHÔNG suy từ trí nhớ
hay từ GAP-IF.md (N1/N7/§0o).

---

## VIỆC 1 · ĐÀO GỐC POCHÉ — trả lời 3 câu

### Hiện trạng đo được (KHÁC brief)

`docs/GAP-IF.md:16` (G-M1-08) và `:62-63` (G-M2-01/02) vẫn ghi "🔴 chưa sửa" / "CHƯA ĐẠT với hồ
sơ NHẬP VÀO". Nhưng `docs/M1-OUT.md:278-301` (PHẦN 4, phiên khác, cùng ngày 06/08 đêm) ghi
**"① G-M1-08 · neo vùng tô cho hồ sơ NHẬP VÀO — ĐÓNG"**, kèm bảng đo 6/6 file thật
(`0 → 80–90 mảng tô neo được/file`). Đã tự chạy lại, KHÔNG tin báo cáo suông (N1):

```
$ node_modules/.bin/sucrase-node lib/cad/poche.test.ts        → PASS — 30 ok, 0 fail
$ node_modules/.bin/sucrase-node lib/cad/poche-import.test.ts → poche-import.test.ts — 19 pass, 0 fail
```

Cơ chế đã có sẵn, ĐÚNG, ĐÃ TEST (`lib/cad/poche.ts`):
- `Base.hostId` (`lib/cad/model.ts:358-374`) — 1 field neo dùng chung cho cả cửa/cửa sổ
  (`BlockEntity.hostId` → tường chủ) lẫn poché (`HatchEntity.hostId` → `PolylineEntity` đường bao).
- `syncPocheAnchors()` (`lib/cad/poche.ts:189-227`) — reconcile idempotent, tự ghép lại từ hình
  học khi thiếu `hostId` (dữ liệu cũ/mới nạp), tự dọn khi chủ đã biến mất.
- `normalizeRing()` (`lib/cad/poche.ts:72-110`) — vòng 2, bỏ đỉnh-chia-cạnh thừa mà phần mềm CAD
  hay chèn (đúng ca thật: 1 đường bao 4 đỉnh + 10 mảng tô 5 đỉnh, cùng lớp/bản chèn) → nâng
  0/126–161 lên 80–90 mảng tô neo được/file (`lib/cad/poche-import.test.ts:1-18`, số đo thật).
- `propagatePocheEdits()` (`poche.ts:274-303`) — chép hình học từ nửa vừa sửa sang nửa kia.
- `expandIdsWithPoche()` (`poche.ts:236-258`) — chọn/xoá 1 nửa thì cầm/gỡ cả cặp (kể cả 1↔N).

Wiring vào `lib/cad/store.ts` — **CÓ, nhưng CHỈ ở một nửa số đường ghi Doc**:
```
$ grep -rna "syncPocheAnchors" lib/cad/store.ts
531:  addEntity   → syncPocheAnchors(syncHostedOpenings(...))
540:  addEntities → syncPocheAnchors(syncHostedOpenings(...))
572:  updateEntities → propagatePocheEdits(...) rồi syncPocheAnchors(syncHostedOpenings(...))
623,633: xoá → syncPocheAnchors(syncHostedOpenings(...))
```

### 🔴 PHÁT HIỆN MỚI (chưa ai ghi) — `importDoc` KHÔNG reconcile

```
$ grep -rna "syncPocheAnchors\|syncHostedOpenings" lib/cad/dxf-open.ts lib/cad/dxf-import.ts \
    components/cad/CadEditor.tsx
→ 0 dòng
$ sed -n '787,805p' lib/cad/store.ts   # importDoc(d, mode)
→ chỉ set({doc: d, ...}) hoặc merge entities — KHÔNG gọi syncPocheAnchors/syncHostedOpenings
```

**Mọi đường nạp Doc TỪ NGOÀI đều đi qua `importDoc`, và `importDoc` không hề reconcile:**
```
components/cad/CadEditor.tsx:438  onImportFile (DXF)  → importDoc(doc, 'replace')
components/cad/CadEditor.tsx:509  onImportDwgFile      → importDoc(doc, 'replace')
components/cad/CadEditor.tsx:202,396  buildDemoPlan()   → importDoc(..., 'replace')
components/cad/CadEditor.tsx:1466  template build()     → importDoc(..., 'replace')
```

⇒ Vừa nạp xong file DXF/DWG thật, `hostId` **chưa được backfill** — chọn một mảng tô KHÔNG cầm
theo đường bao (`expandIdsWithPoche` đọc `hostId` có sẵn, không tự dò hình học), và bug gốc
"dời một nửa, nửa kia đứng yên" **vẫn tái hiện trên file mới nạp**, cho tới lần **đầu tiên** người
dùng sửa BẤT KỲ entity nào (khi đó `updateEntities` mới chạy `syncPocheAnchors` lần đầu, tự ghép
lại toàn Doc). Đây là dây đứt thật — không phải vì thiếu thuật toán, mà vì thuật toán đúng chỉ nối
vào NỬA số đường ghi Doc.

`.idf` load path (`CadSheets.tsx:122,173,649` gọi `importIdf()`) đi đường KHÁC hẳn `importDoc` —
**CHƯA kiểm** có reconcile hay không, ghi rõ CHƯA VERIFY (N5), không suy đoán.

### Trả lời 3 câu

**a) Nhóm hai hình lại là ĐỦ, hay phải dựng lại mô hình "tường là MỘT vật"?**
→ **ĐỦ.** Không cần model mới. `hostId` + reconcile đã đúng kiến trúc (dùng lại khuôn cửa/cửa sổ,
không đẻ cơ chế thứ hai — đúng luật gộp tính năng). Cái thiếu KHÔNG phải kiến trúc, mà là **một
lệnh gọi bị bỏ sót** ở đúng chỗ hay dùng nhất.

**b) Đụng bao nhiêu file/dòng? Có phá `.idf` đang lưu không?**
→ **1 file, ~2-4 dòng**: `lib/cad/store.ts`, hàm `importDoc` (dòng 787-805) — thêm
`syncPocheAnchors(syncHostedOpenings(d))` trước khi `set()`, cả nhánh `replace` lẫn `merge`.
KHÔNG phá `.idf`: `hostId` là field optional, reconcile idempotent, không đổi `IDF_VERSION`, không
migration (đúng thiết kế gốc ghi ở `poche.ts:27-30`).

**c) Có đường đi TỪNG BƯỚC không?**
→ Có, và bước 1 (nặng nhất) đã xong từ trước:
1. ✅ **Engine** (`poche.ts` + `hosting.ts`) — xong, test 49 ca (30+19) pass.
2. ✅ **Wiring và mutation trong phiên** (`addEntity`/`updateEntities`/xoá) — xong.
3. 🔴 **Wiring lúc NẠP** (`importDoc`) — CHƯA, đây là việc còn treo, nhỏ, không rủi ro.
4. ⬜ **`.idf` load path** (`CadSheets.tsx`) — CHƯA KIỂM, cần grep riêng trước khi kết luận.
5. G-M1-14 (poché không sống sót vòng xuất→nhập DXF) **cùng gốc với mục 3** — điểm dữ liệu
   (points) roundtrip đúng (`lib/cad/dxf.ts:877-894` HATCH, `:895-904` LWPOLYLINE đọc lại đủ), chỉ
   là sau khi nhập lại không ai gọi reconcile. Có PHỤ THUỘC vào G-M1-13 (đổi tên/gộp layer lúc
   xuất) vì `syncPocheAnchors` khoá theo `layer` trùng khít — layer bị đổi tên lệch giữa hatch/
   polyline thì không ghép được. **G-M1-13 phải sửa trước hoặc cùng lúc với việc nối dây mục 3.**
6. G-M2-02 (2D/3D đọc hai nửa khác nhau — 3D dựng từ vùng tô, `lib/three/cad-to-obj.ts`, NGOÀI
   vùng sở hữu, KHÔNG đụng) — một khi mục 3 xong, hatch luôn theo polyline nên 2D/3D nhất quán
   ngay khi vừa nạp, không cần sửa gì bên `lib/three`. CHƯA VERIFY (không đọc code lib/three để kết
   luận chắc, chỉ suy theo luồng dữ liệu — cần phiên `S2-3d` xác nhận).

**Việc 1 XONG PHẦN ĐO. Không tự sửa `store.ts` — theo đúng lệnh "chỉ ĐO, CHƯA sửa", DỪNG BÁO CÁO.**
Đề xuất (không tự làm): vá mục 3 là 1 hàm 2-4 dòng, rủi ro thấp, có thể giao ngay không cần
duyệt kiến trúc thêm.

---

## VIỆC 2 · NẠP DXF — tình trạng thật

| Mã | Brief nói | Đo được |
|---|---|---|
| G-M1-01 (luồng chính/tiến độ/huỷ) | chưa làm | ✅ **ĐÃ XONG** trước phiên này — `lib/cad/dxf-worker.ts`+`dxf-import.ts`+`dxf-open.ts` (mới, 06/08 22:37-40) nối vào `CadEditor.tsx:424-495` (`openDxfFile`, AbortController, thanh Huỷ chung khuôn DWG). `dxf-import.test.ts` 23 ca — xác nhận có file nhưng CHƯA tự chạy lại (không có sucrase riêng biệt trong lần này; xem M1-OUT.md:349-380 cho số đo verify browser thật của phiên trước) |
| G-M1-10 ATTRIB/ATTDEF bỏ | chưa làm | ⚠️ **ĐÍNH CHÍNH — dòng dưới BỎ, tôi báo sai vì chưa chạy grep thật (§0y).** Đo lại:
`grep -na "'ATTRIB'\|'ATTDEF'" lib/cad/dxf.ts` → `case 'ATTRIB':` CÓ (dxf.ts:833, đọc như TEXT,
comment tự khai "trước bị bỏ hẳn" ⇒ đã có người sửa, không phải phiên này). `ATTDEF` KHÔNG có case
riêng, nhưng nó nằm trong `SILENT_RECORDS` (`import-summary.ts:75`, có docstring giải thích: ATTDEF
là ĐỊNH NGHĨA trong block, giá trị THẬT nằm ở ATTRIB — đã đọc rồi. Bỏ ATTDEF không mất chữ khung
tên). ⇒ **G-M1-10 coi như ĐÃ ĐẠT** (đúng mục tiêu gốc "khung tên đọc được"), không phải việc treo. |
| G-M1-11 ELLIPSE/POINT/VIEWPORT bỏ | chưa làm | ⚠️ **ĐÍNH CHÍNH cùng lỗi trên.** `case 'ELLIPSE':`
CÓ (dxf.ts:840, comment tự khai đã sửa). `VIEWPORT` nằm trong `SILENT_RECORDS` — đúng, vì nó là
khung nhìn giấy, không phải nét vẽ (`import-summary.ts:70-71`). **`POINT` vẫn KHÔNG có case đọc**
và KHÔNG nằm trong `SILENT_RECORDS` ⇒ vẫn bị bỏ nhưng có báo trong `report.skipped` (không im lặng
— đúng K3). Thêm `PointEntity` là field/kiểu MỚI trong `model.ts` — theo K4 (field mới cần nơi
tiêu thụ) và ngoài mảng nhỏ, CHƯA làm, để việc riêng. **2 HATCH/file "dựng lỗi"** trong mô tả gốc —
CHƯA VERIFY, chưa grep. |
| G-M1-12 2/6 file không lấy được diện tích trong định nghĩa block | chưa làm | 🔴 xác nhận CHƯA — chưa grep sâu, ghi CHƯA VERIFY chi tiết |

## VIỆC 3 · XUẤT DXF HỎNG — tình trạng thật

| Mã | Brief nói | Đo được |
|---|---|---|
| G-M1-18 (ezdxf không mở được) | 🔴 nặng nhất | ✅ **ĐÃ SỬA 06/08** — `docs/GAP-IF.md:59` tự ghi "✅ ĐÃ SỬA… `dxf-openable.test.ts` (20 ca)". File có trên đĩa: `lib/cad/dxf-openable.test.ts` |
| G-M1-13 (đổi tên/gộp lớp lúc xuất) | không có trong brief gốc | ✅ **ĐÃ SỬA phiên này** (`lib/cad/dxf.ts`) — `sanitizeName()` một mình có thể đụng tên (`"A B"` và `"A_B"` cùng ra `"A_B"`). Thêm `buildUniqueLayerNames(layers)` gán hậu tố `_2/_3…` khi đụng, dùng CHUNG cho cả bảng `LAYER` (group 2) lẫn `layerName(id)` mà entity group 8 tra theo — một nguồn, không còn 2 chỗ tự gọi `sanitizeName` rời nhau. Test mới `dxf.roundtrip.test.ts` mục [8] (2 layer đụng tên, xuất→nạp lại vẫn 2 layer riêng, entity đúng layer) — 48/48 pass (46 cũ + 2 mới), không hồi quy 5 bộ test dxf khác (`dxf-reblock` 50 · `dxf-openable` 20 · `dxf-insert` 38 · `dxf-export-report` 20 · `dxf-plan` 28). `tsc --noEmit -p .` sạch phần mình (còn đúng 1 lỗi có sẵn `render-layer-index.test.ts:36`, không phải của phiên này). Đây là điều kiện tiên quyết của Việc-1-mục-5 (G-M1-14) — nay đã gỡ. |
| G-M1-19 (bộ suy loại tự bật sai chỗ) | không có trong brief | ✅ **ĐÃ SỬA 06/08** — `docs/GAP-IF.md:60` "✅ ĐÃ SỬA… block-library-infer.test.ts" |

⇒ Việc 3 thật sự còn treo đúng **1 mục**: G-M1-13. Ưu tiên sửa nó vì Việc-1 phụ thuộc nó.

## VIỆC 4 · CÒN LẠI — tất cả 🔴 chưa sửa, đúng như brief (đã grep `docs/GAP-IF.md:66-70`,
không phát hiện lệch): G-M2-09 (mất Hoàn tác khi hết phiên) · G-M1-05 (diện tích sàn method:none)
· G-M2-03 (nhãn m² là chữ chết) · G-M2-04 (không có đối tượng Phòng) · G-M2-06 (sửa hình không
preview) · G-M2-07 (hình dẫn xuất lẫn vào bộ đếm) · G-M2-08 (số khai ≠ hình vẽ) · G-M2-05 (3D
không Hoàn tác).

---

## HÀNG ĐỢI (§V7) — cuối lượt

**Đã xong trong phiên này:**
- VIỆC 1: đo xong, KHÔNG sửa `store.ts` (đúng lệnh), tìm ra 1 phát hiện mới (dây đứt ở `importDoc`).
- G-M1-13 (xuất DXF đụng tên layer) — sửa xong, test xanh, `tsc` sạch.
- Đính chính 2 dòng báo sai trong chính báo cáo này (G-M1-10/G-M1-11 tưởng chưa làm, thật ra đã có
  người sửa từ trước) — theo đúng §0y, không giấu.

**Còn treo, CHƯA làm (không đụng vì hết thời lượng hợp lý của lượt này, không phải vì khó):**
- G-M1-12 (2/6 file không đọc được diện tích khung tên vì nằm trong block KHÔNG được chèn) —
  CHƯA VERIFY chi tiết, cần đọc `planDeclaredAreaM2()` (`lib/cad/dxf-plan.ts:255-269`) đối chiếu
  với cách `doc.entities` được dựng từ BLOCKS section (nghi: chỉ block ĐƯỢC INSERT mới vào
  `doc.entities`, block mồ côi thì chữ trong nó không bao giờ tới nơi hàm này đọc).
- G-M1-11 phần POINT (27–300 bản ghi/file bị bỏ, có báo trong `report.skipped`, không im lặng) —
  cần `PointEntity` kiểu mới trong `model.ts`, việc lớn hơn 1 mảng, để riêng (K4).
- "2 HATCH/file dựng lỗi" (một phần of G-M1-11 gốc) — CHƯA VERIFY, chưa grep.
- VIỆC 4 (G-M2-09, G-M1-05, G-M2-03/04/06/07/08, G-M2-05) — đúng như brief, tất cả 🔴 chưa sửa,
  chưa động tới trong lượt này.
- `.idf` load path (`CadSheets.tsx`) có reconcile poché/hosting hay không — CHƯA KIỂM (VIỆC 1 mục 4).

**Chờ TỔNG quyết (đúng lệnh "Việc 1 xong ⇒ DỪNG"):**
- Có cho vá `importDoc` (`lib/cad/store.ts:787-805`, ~2-4 dòng, thêm `syncPocheAnchors(
  syncHostedOpenings(d))`) không, hay để dành cho phiên khác vì đụng `store.ts` (mảng lõi, nhiều
  phiên khác có thể đang mở).
