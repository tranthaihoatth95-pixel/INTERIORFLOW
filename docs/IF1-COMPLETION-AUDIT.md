# IF1 Completion Audit — đối soát mã nguồn thật (2026-07-26)

> **Nguyên tắc**: mọi dòng trong file này bám theo `file:line` thật, không chép trạng thái từ
> `IF-FEATURE-SPEC-P1-v2.md`/`IF-PRESENT-SPRINT-PLAN.md`. Hai file đó tự chấm điểm ngày 17/07 —
> 9 ngày làm việc CAD (ortho/snap, undo panel, route cleanup, local-first schema...) đã trôi qua và
> một số nhãn tự chấm trong 2 file đó **sai** (đã tìm thấy cụ thể bên dưới). Item nào không tìm được
> bằng chứng ⇒ ghi ⬜ "không thấy trong code", không đoán.
>
> Quy ước trạng thái dùng THỐNG NHẤT trong file này (khác quy ước nguồn):
> **✅ xong** (hoạt động đúng như mô tả) · **🟡 một phần** (có code thật nhưng thiếu/khác spec) ·
> **⬜ chưa** (không tìm thấy bằng chứng) · **⛔ non-goal** (chủ đích không làm, không tính vào mẫu số %).
>
> Trọng số tally: ✅=1 · 🟡=0.5 · ⬜=0 · ⛔ loại khỏi mẫu số phần trăm (giữ trong cột "Tổng").

---

## 1) Đối soát 101 item — `IF-FEATURE-SPEC-P1-v2.md`

### A — VẼ SƠ PHÁC (24 item)

**A1 — Tường & Phòng**

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| A1.1 | Vẽ tường + kích thước realtime | 🟡 | `components/cad/CadCanvas.tsx:824,898-900` vẽ tường có ortho/polar snap thật (`:357-376`), nhưng nhãn độ dài realtime (`labelLen`, `:2690`) chỉ nối cho `'line'\|'dimension'\|'measure'\|'dimcontinue'\|'dimbaseline'` (`:2457-2461`) — **KHÔNG có** cho `'wall'` (preview riêng ở `:2477-2480` không gọi `labelLen`). Vẽ tường thiếu đúng phần "hiện kích thước realtime" mà spec ghi. |
| A1.2 | Nhận phòng tự động | 🟡 | `lib/cad/room-autolabel.ts:1-23,126` — chỉ **đề xuất** tên phòng (đọc `findHatchBoundary` + heuristic), tự comment "KHÔNG BAO GIỜ tự chèn TEXT"; user phải bấm "Áp dụng" ở panel. Không tự động như spec "Vẽ kín 4 tường → IF tự tô". |
| A1.3 | Resize phòng qua kéo tường | ✅ | `lib/cad/grips.ts` case `'polyline'` cho grip từng đỉnh; tường (từ `wallChain`) là polyline khép kín nên resize qua grip đỉnh — cơ chế chung, không riêng cho "phòng" nhưng hoạt động đúng hiệu ứng. |
| A1.4 | Cửa đi + auto-snap | ✅ | `lib/cad/furniture.ts:599-621` (`door` 900/`doorRoom` 800/`doorWC` 700/`doubleDoor`/`slidingDoor`/`glassDoor`, `anchors:[{kind:'wall-back'}]`); auto-snap `lib/cad/shape-interactions.ts:91-136` (`autoSnapToWall`), gọi ở `CadCanvas.tsx:727`. |
| A1.5 | Cửa sổ + auto-snap | ✅ | Cùng cơ chế A1.4 — `furniture.ts` `window`/`slidingWindow`/`fixedWindow`. |
| A1.6 | Cột vuông/tròn | 🟡 | KHÔNG có tool riêng trong `Tool` union (`lib/cad/store.ts`) hay `CadToolbar.tsx` — nhưng CÓ 2 block cột trong thư viện DXF phụ (`public/cad-library/manifest.json` nhóm `cot`, wired qua `insertBlockById` `CadCanvas.tsx:35`, tab "Thư viện 46" `CadEditor.tsx:576`). Đặt được cột nhưng phải qua tab thư viện khác, không phải tool sketch trực tiếp như spec mô tả. |
| A1.7 | Xoá tường | ✅ | `CadCanvas.tsx:1902` (phím Delete), FAB xoá cảm ứng (`:107,191-201`) — cơ chế chung mọi entity, hoạt động đúng với tường. |
| A1.8 | Tường cong | ⬜ | Grep `bulge\|curved\|arcWall\|bendWall` trên toàn `lib/cad/*.ts` + `components/cad/*.tsx` = 0 kết quả. `gripsOf` không có case midpoint-drag-to-arc cho polyline. Xác nhận chưa có, khớp nhãn 🆕 của doc gốc. |

**A2 — Hình vẽ phụ trợ**

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| A2.1 | Hình chữ nhật | ✅ | `CadCanvas.tsx:916,922,2524` (`case 'rect'`). |
| A2.2 | Đường tròn | ✅ | `CadCanvas.tsx:922,996,1007,2547,2590` (`circle`/`circle3p`). |
| A2.3 | Cung tròn (3 điểm) | ✅ | `CadCanvas.tsx:1007,1018,2605` (`case 'arc'` + `'arccenter'`). |
| A2.4 | Đường tự do | 🟡 | Spline có thật nhưng là **click control-point + Catmull-Rom**, KHÔNG phải kéo tự do bằng ngón/stylus như spec mô tả — `CadToolbar.tsx:60` ("click các control point"), `CadCanvas.tsx:2513`. Không tìm thấy pen/freehand-drag tool nào khác. |
| A2.5 | Đa giác | ✅ | `CadCanvas.tsx:931,2557`; đổi số cạnh `POL <n>` (`CadToolbar.tsx:57`). |
| A2.6 | Đo khoảng cách | ✅ | `CadCanvas.tsx:1038-1043` (`case 'measure'`), dùng chung nhãn live `labelLen`. |

**A3 — Chỉnh sửa**

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| A3.1 | Chọn | ✅ | Hit-test mặc định `CadCanvas.tsx` tool `'select'`. |
| A3.2 | Chọn nhiều (rubber-band) | ✅ | `CadCanvas.tsx:79,541,635-649,2701` (`selDrag`). |
| A3.3 | Di chuyển | ✅ | `CadCanvas.tsx:1104,2621` (`case 'move'`). |
| A3.4 | Xoay | ✅ | `CadCanvas.tsx:1108,2625`; phím `RO` (`CadToolbar.tsx:72`). |
| A3.5 | Lật đối xứng | ✅ | `CadCanvas.tsx:1111,2628`; phím `MI` (`CadToolbar.tsx:73`). |
| A3.6 | Sao chép | ✅ | `CadCanvas.tsx:1815-1830` (Copy-paste Ctrl+C/V). |
| A3.7 | Undo | ✅ | `CadCanvas.tsx:1801`; `CadToolbar.tsx:138-141,324-333` (nút Undo2, disable theo `past`). |
| A3.8 | Redo | ✅ | Cùng vùng trên, `future` stack. |
| A3.9 | Zoom | ✅ | Wheel `CadCanvas.tsx:669-703`; pinch `:456-482,557-614`. |
| A3.10 | Pan | ✅ | `CadCanvas.tsx:483` (middle-mouse/space/pan tool); pinch-drag `:566-573`. |

*Ghi chú A (không tính vào 24 item, chỉ verify claim "đã có, gated Pro"):* offset/trim/extend/fillet/chamfer/array/scale/stretch/break/join/explode/lengthen — **XÁC NHẬN có thật, không phải stub**: `lib/cad/modify.ts` (675 dòng, `trimEntity:208`, `extendEntity:269`, `filletTwoLines:288`, `chamferTwoLines:331`, `arrayRect:350`, `arrayPolar:375`, `scaleEntitiesAbout:432`, `stretchEntities:501`, `breakEntity:538`, `joinEntities:601`, `explodeEntity:621`, `lengthenLine/Arc:657,670`), test riêng `lib/cad/modify.test.ts` (306 dòng, 10 hàm test). Gate Pro thật: `CadToolbar.tsx:264` `{isPro && <Group items={MODIFY}/>}`.

**Tally A**: ✅=19 · 🟡=4 (A1.1, A1.2, A1.6, A2.4) · ⬜=1 (A1.8) · ⛔=0 · **Tổng 24**
**Điểm A = (19×1 + 4×0.5) / 24 = 21/24 ≈ 87.5%**

---

### B — THƯ VIỆN KÉO THẢ (21 item)

**B1 — Palette nội thất** (xác minh số liệu: `lib/cad/furniture.ts` `BLOCKS`/`BLOCK_MAP:639` = **41 shape / 9 nhóm**, khớp đúng con số doc gốc; có thêm thư viện DXF phụ 46 block/11 nhóm ở `public/cad-library/manifest.json`, không thay thế mà bổ sung.)

| # | Nhóm | Trạng thái | Bằng chứng |
|---|---|---|---|
| B1.1 | Phòng ngủ | ✅ | `furniture.ts` nhóm "Phòng ngủ" 5 shape (giường có `variants` size). |
| B1.2 | Phòng khách | ✅ | `furniture.ts` nhóm "Phòng khách" 6 shape. |
| B1.3 | Bếp | ✅ | `furniture.ts` nhóm "Bếp" 5 shape. |
| B1.4 | Phòng tắm | ✅ | `furniture.ts` nhóm "Vệ sinh" 5 shape. |
| B1.5 | Phòng ăn | ✅ | `furniture.ts` nhóm "Phòng ăn" 3 shape. |
| B1.6 | Văn phòng | ✅ | `furniture.ts` nhóm "Làm việc" 4 shape. |
| B1.7 | Cửa | ✅ | Gộp trong nhóm "Kiến trúc" (9 item cửa+cửa sổ) — xem A1.4. |
| B1.8 | Cửa sổ | ✅ | Cùng nhóm "Kiến trúc" — xem A1.5. |
| B1.9 | Cầu thang | ✅ | `furniture.ts` nhóm "Cầu thang" 2 shape (thẳng + chữ L). |
| B1.10 | Thiết bị | ✅ | `furniture.ts` nhóm "Thiết bị" 2 shape (máy lạnh, quạt trần). |

**B2 — Tương tác shape**

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| B2.1 | Drag from palette | ✅ | `components/ShapePalette.tsx:91-95`. |
| B2.2 | Auto-snap to wall | ✅ | `lib/cad/shape-interactions.ts:91-136`. |
| B2.3 | Resize by handle | ✅ | `shape-interactions.ts:159-190` (`resizeBlockCorner`). |
| B2.4 | Tap → info panel | ✅ | `ShapePalette.tsx:121-163` (`ShapeInfoPanel`, `def.meta?.price` dòng 159). |
| B2.5 | Variant switch | ✅ | `shape-interactions.ts:24-49`; UI `ShapePalette.tsx:164-186`. |
| B2.6 | Collision warning (SAT) | ✅ | `shape-interactions.ts:208-261` (`polygonAxes/projectPoly/polygonsOverlap` = SAT thật); viền đỏ nhấp nháy `CadCanvas.tsx:2078,2212-2218`. |
| B2.7 | Clearance zone | ✅ | `shape-interactions.ts:263-289` (`clearanceWorldPolygon`), dùng ở `CadCanvas.tsx:2233`. |
| B2.8 | Search shapes | ✅ | `ShapePalette.tsx:50-53` (filter tên/nhóm). |

**B3 — Thư viện mở rộng**

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| B3.1 | Custom shape | ⬜ | Grep `customShape\|saveAsShape\|userShape` = 0 kết quả. |
| B3.2 | Import DXF block | 🟡 | `lib/cad/dxf.ts` (`parseDxf`) và `CadEditor.tsx:212` có thật — nhưng chỉ import **thay thế cả bản vẽ** (mở file DXF), KHÔNG phải "nhập 1 block DXF làm shape mới vào palette" như spec mô tả. `block-library.ts` chỉ dùng `parseDxf` nội bộ để nạp 46-block có sẵn, không phải cho user upload. |
| B3.3 | Team library sync (Drive) | ⬜ | Chỉ có 1 scope OAuth khai báo chưa dùng (`lib/integrations/registry.ts:51` `drive.file`), không có code nào nối .idf/shape-library với Drive. |

**Tally B**: ✅=18 · 🟡=1 (B3.2) · ⬜=2 (B3.1, B3.3) · **Tổng 21**
**Điểm B = (18×1 + 1×0.5) / 21 = 18.5/21 ≈ 88%**

---

### C — TỰ ĐỘNG THÔNG MINH (18 item)

**C1 — Auto-label & Auto-dimension**

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| C1.1 | Room name auto | 🟡 | `lib/cad/room-autolabel.ts:78-85,204-219` — heuristic đúng (nhóm đồ nội thất, tỷ lệ cạnh, diện tích), nhưng chỉ là **đề xuất**, user phải Apply thủ công (`CadEditor.tsx` panel `RoomNameSuggestion`) — không "tự gán" như spec chữ. |
| C1.2 | Area label | ✅ | `lib/cad/standards/checker.ts:105-124` (`findRoomLabels`, `areaM2` từ polygon hatch). |
| C1.3 | Wall dimension khi tap/hover | 🟡 | Dimension là entity đặt tay qua lệnh `DIM` (`lib/cad/render.ts:176-177,397-425`), KHÔNG có tooltip xuất hiện khi tap/hover tường bất kỳ (`CadCanvas.tsx:2276-2354` chỉ có tooltip cho markup pin/ảnh, không cho tường). |
| C1.4 | Total GFA | ✅ | `CadEditor.tsx:1786-1830` (`RoomStatsBadge`, `stats.totalM2`). |
| C1.5 | Room count summary | ✅ | Cùng hàm trên, `ROOM_KIND_ORDER/LABEL` (`CadEditor.tsx:1809-1824`). |

**C2 — TCVN Checker**

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| C2.1 | Realtime check + badge | 🟡 | KHÔNG realtime, KHÔNG badge thường trực. `CadEditor.tsx:915-926` (`StandardsPanel`) — `violations` = `null` tới khi user bấm icon shield chạy `checkStandards()`. Không tự re-check khi sửa bản vẽ. |
| C2.2 | Tap → zoom + giải thích | ✅ | `CadEditor.tsx:1007-1010` (`zoomTo`, event `cad:zoom-to`) + `v.message` hiển thị mỗi dòng vi phạm (không phải từ "badge" vì C2.1 không có badge, nhưng chức năng zoom+giải thích hoạt động đúng trong panel). |
| C2.3 | TCVN 4451:2012 | ✅ | `checker.ts:166-185`, rule từ `vn-residential.ts`. |
| C2.4 | QCVN 06 PCCC | 🟡 | Chỉ 1 rule nối thật (bề rộng hành lang, `checker.ts:236-238`). Số lối thoát/khoảng cách thoát nạn/bề rộng cầu thang **CHƯA nối** — tự comment `checker.ts:406-425`: "verified=false CỐ Ý", thiếu occupant load trong model. |
| C2.5 | Neufert + NFPA/IBC | 🟡 | Chỉ 2/8 rule Neufert nối thật (hành lang 1-2 người, `checker.ts:248-255`); bếp/bàn ăn/cửa/trần chỉ ở registry chưa đo hình học (`checker.ts:426-437`). IBC/NFPA occupant-load info-only đã nối cho living/office/assembly (`checker.ts:195-234`). |
| C2.6 | Accessibility QCVN 10:2024 | 🟡 | Hành lang 2 chiều + bề rộng cửa nối thật (`checker.ts:259-262,272-291`); dốc/tay vịn/bãi đỗ chỉ registry, không đo hình học thật (`vn-accessibility.ts:75-195`, `checker.ts:381-392`). Bán kính xe lăn 1500mm = dùng lại rule hành lang, không phải check riêng. |
| C2.7 | Fix suggestion + Apply wizard | 🟡 | `lib/cad/standards/fix-suggest.ts:148-153` sinh gợi ý mm cho ĐÚNG 2 loại vi phạm (thiếu diện tích, hành lang hẹp); các loại khác trả `null` chủ đích. **KHÔNG có nút "Apply"/wizard nào** — `CadEditor.tsx:1070-1085` chỉ hiện text gợi ý (icon Wrench), user tự làm MOVE/STRETCH tay. Đây là gap thật so với claim "wizard gated" của doc gốc. |

*Ghi chú: doc gốc tự nhận "C2 là nhóm DUY NHẤT đạt Pro đầy đủ" — audit này KHÔNG xác nhận claim đó; 5/7 item C2 thực ra chỉ 🟡 (registry-only cho phần lớn rule, không có Apply wizard).*

**C3 — Gu Engine & AI Layout**

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| C3.1 | Operator detect | ✅ | `lib/cad/operator-profile.ts:1-96` (`classifyOperator`), UI nút "Nhận diện" (`CadEditor.tsx:978-988`). |
| C3.2 | Style extract từ ảnh/text | 🟡 | `lib/gu.ts:5-9` tự nhận: gán tag/palette hiện là **thủ công** (user tag), VLM auto-caption "làm giàu sau" — chưa build. |
| C3.3 | Mood palette | ✅ | `lib/gu/color-psychology.ts:160-262` (`colorMood/paletteMood/mixPaletteLab`, Lab space thật). |
| C3.4 | Layout suggest + feedback | ✅ | `components/cad/AiBriefPanel.tsx:247-275` (`accept()` gọi `model.update()` cho cả Nhận/Bỏ). |
| C3.5 | Perceptron learn | ✅ | `lib/gu/pairwise-perceptron.ts:40-56,79` (`minPairs:10`, degrade về heuristic đúng như spec). |
| C3.6 | Style moodboard 4-6 ảnh | 🟡 | `lib/moodboard-boards.ts:1-11` build collage thật nhưng KHÔNG giới hạn 4-6 ảnh cố định theo Gu profile như spec — chức năng có, ràng buộc số ảnh/gắn-profile không khớp mô tả. |

**Tally C**: ✅=9 · 🟡=9 (C1.1, C1.3, C2.1, C2.4, C2.5, C2.6, C2.7, C3.2, C3.6) · ⬜=0 · **Tổng 18**
**Điểm C = (9×1 + 9×0.5) / 18 = 13.5/18 = 75%**

---

### D — MEP SƠ CẤP (12 item)

**D1 — Chiếu sáng**

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| D1.1 | Lux suggest | ✅ | `lib/cad/mep-suggest.ts:77-93` (`estimateLightingSuggestion`, TCVN 7114 lux → lumen → số đèn). |
| D1.2 | Light placement | ✅ | `mep-suggest.ts:113-139` (`suggestLightGridPositions`). |
| D1.3 | Light symbol | ✅ | `lib/cad/mep.ts:34-70` (4 block symbol). |
| D1.4 | Switch near door | ✅ | `mep-suggest.ts:208-231` (offset 175mm từ khung cửa). |
| D1.5 | Light layer riêng | ⬜ | **Gap thật, doc gốc claim ✅ sai**: đèn chèn chung `l-furniture` (`CadEditor.tsx:1246`), `DEFAULT_LAYERS` (`lib/cad/model.ts:493-497`) không có layer đèn riêng ⇒ không thể ẩn/hiện riêng đèn như spec "Layer riêng cho đèn — ẩn/hiện 1 tap". |

**D2 — Ổ cắm & Hộp gen**

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| D2.1 | Outlet suggest | ✅ | `mep-suggest.ts:263-302` (`suggestOutletPlacements`). |
| D2.2 | Outlet count check | ✅ | `checker.ts:293-322` (đếm block `outlet` trong phòng, so `vn-electrical.ts minOutlets`). |
| D2.3 | Gen box detect | ⛔ | Xác nhận comment non-goal `lib/cad/mep.ts:15-19`: *"không có quy ước DXF/tên block thật nào cho gen kỹ thuật... dựng logic mà không có ví dụ DXF thật sẽ là ĐOÁN MÒ"*. |
| D2.4 | Gen box warning | ⛔ | Cùng comment trên. |
| D2.5 | Gen box adjust | ⛔ | Cùng comment trên. |
| D2.6 | AC position | ✅ | `mep-suggest.ts:334-361` (`checkAcUnitBedProximity`, ngưỡng 1800mm). |
| D2.7 | MEP layer riêng | ⬜ | **Gap thật, doc gốc claim ✅ sai**: ổ cắm cũng chèn chung `l-furniture` (`CadEditor.tsx:1254`), cùng nguyên nhân D1.5 — không có layer MEP riêng để toggle. |

**Tally D**: ✅=7 · 🟡=0 · ⬜=2 (D1.5, D2.7) · ⛔=3 (D2.3-D2.5) · **Tổng 12**
**Điểm D = 7×1 / 9 (loại 3 non-goal) = 7/9 ≈ 78%** (nếu tính cả non-goal vào mẫu số: 7/12 ≈ 58%)

---

### E — TÔ VẬT LIỆU (5 item)

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| E1.1 | Tap room → fill | ✅ | `components/cad/MaterialPalette.tsx:61,155-156` (chọn preset → chuyển tool `'hatch'` → click vùng kín). |
| E1.2 | Material thumbnail | ✅ | XÁC NHẬN đúng claim đóng gap 17/07: `lib/cad/material-texture.ts` (433 dòng, `generateTexturePixels:142`, PRNG `mulberry32:28-43`, vân gỗ/gạch/đá/granite/terrazzo thật, `materialTextureDataUrl:411`); `photoUrl?` field xác nhận `lib/cad/materials.ts:46` (rỗng ở 13 preset hiện có, không phải "14" — lệch nhỏ so với doc). |
| E1.3 | Wall material | 🟡 | Hoạt động được nhưng qua CƠ CHẾ HATCH CHUNG (không phải tool "tap tường" riêng) — cùng `MaterialPalette.tsx` như E1.1, hatch fill bất kỳ vùng kín nào kể cả tường. Nâng từ 🆕 (doc gốc) lên 🟡 vì thực tế dùng được, dù không phải feature riêng biệt. |
| E1.4 | Auto-update BOQ | ⬜ | Grep `BOQ\|bill of quantit\|vật tư\|quantity` toàn repo (trừ node_modules/.next) = **0 kết quả trong bất kỳ file .ts/.tsx nào**. Khớp `AUDIT-2026-07-15.md:110` đã tự xác nhận trước đó. Xem thêm mục M1(c) bên dưới — đây là gap trọng yếu. |
| E1.5 | Design DNA link | ⬜ | Không tìm thấy tham chiếu chéo giữa `lib/cad/materials.ts` và `lib/gu.ts`/`GuProfile` theo bất kỳ chiều nào. |

**Tally E**: ✅=2 · 🟡=1 (E1.3) · ⬜=2 (E1.4, E1.5) · **Tổng 5**
**Điểm E = (2×1 + 1×0.5) / 5 = 2.5/5 = 50%**

---

### F — XUẤT BẢN & CHIA SẺ (13 item)

**F1 — Pipeline IF**

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| F1.1 | CAD → Render | ✅ | `lib/cad/handoff.ts:24-32` (`CadHandoffPayload{version,dataUrl,snapshot,...}` qua sessionStorage). |
| F1.2 | Render → Present | ✅ | `lib/present-editor/handoff.ts:33,58,70` (`MAX_IMAGES=8`, `renderImageId` cho assetId ổn định). |
| F1.3 | Present → PDF/PPTX | ✅ | `components/ExportPptxButton.tsx`, `lib/pptx.ts`, `lib/present-editor/export.ts`. |
| F1.4 | Multi-sheet ≤5 tab, IDB | ✅ | `components/cad/CadSheets.tsx:38` `MAX_SHEETS=5` (enforce ở load+add); `lib/sheets-persist.ts` IndexedDB, khoá `userId::route::projectId` (dòng 5-6,15-16 — lý do chọn IDB vì Present chứa dataURL nặng MB). |

**F2 — Export**

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| F2.1 | DXF import/export, DWG import GPL-cách-ly | ✅ | `lib/cad/dxf.ts` (`parseDxf:179`, `exportDxf:452`); DWG worker cô lập GPL rõ ràng — `lib/cad/dwg-worker.ts:4-13` (comment cảnh báo GPL, chỉ file này được import `@mlightcad/libredwg-web`), `lib/cad/dwg.ts:2,4` (cầu nối KHÔNG GPL). DWG export xác nhận KHÔNG tồn tại (grep `exportDwg` = 0) — đúng như spec item tự ghi "bất khả thi, dùng DXF". |
| F2.2 | PDF export | ✅ | `lib/cad/pdf.ts` (`DEFAULT_PDF_PAPER_MM`); fix orientation gần đây `pdf.ts:396` khớp commit `b5ca821`. |
| F2.3 | PNG export | ✅ | `lib/cad/render.ts:595,621` (`renderDocToDataURL`). |
| F2.4 | .idf format | 🟡 | `lib/cad/idf.ts` — serialize `exportIdf:53`, deserialize `importIdf:97`. CÓ field version: `IDF_VERSION=1 as const` (dòng 18), type `IdfFile{idfVersion:1,...}` (dòng 37-41). **NHƯNG không có migration**: `importIdf` dòng 105 `if (parsed.idfVersion !== IDF_VERSION) return null` — version lệch = từ chối thẳng, không convert. Nếu tương lai bump `IDF_VERSION`, MỌI file .idf cũ sẽ đọc lỗi im lặng, không có đường phục hồi. Xem thêm M1(a). |
| F2.5 | Share link | 🟡 | Chỉ hoạt động cho **luồng Render** (`app/share/[token]/page.tsx` render ReactFlow read-only), KHÔNG có route/serialize riêng cho `EditorDeck` (bản vẽ CAD hoặc slide Present) như spec ngụ ý "gửi link xem online". |

**F3 — Cộng tác**

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| F3.1 | PWA mobile | ✅ | `public/manifest.webmanifest`, `public/sw.js` (cache strategy rõ), `components/PWARegister.tsx:30`. **Nâng từ 🔜 (doc gốc "chưa xác minh") lên ✅** — đã xác minh có thật. |
| F3.2 | Markup overlay | ✅ | `lib/cad/markup.ts:22` (`createMarkupPin`), lưu `Doc.markups`. |
| F3.3 | Google Drive sync | ⬜ | Chỉ 1 scope OAuth khai báo chưa dùng (`lib/integrations/registry.ts:51`), không có code nối .idf↔Drive. |
| F3.4 | Photo embed | ✅ | `lib/cad/markup.ts:26` (`createPhotoEmbed`), `lib/cad/model.ts:408` (`Doc.photos`). |

**Tally F**: ✅=10 · 🟡=2 (F2.4, F2.5) · ⬜=1 (F3.3) · **Tổng 13**
**Điểm F = (10×1 + 2×0.5) / 13 = 11/13 ≈ 85%**

---

### G — QUẢN LÝ (8 item)

**G1 — Layer đơn giản**

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| G1.1 | Layer toggle | ✅ | `lib/cad/model.ts:40-52` (`Layer.visible`), UI `CadEditor.tsx:530-531`. |
| G1.2 | Layer preset (view mode) | ⬜ | **Gap thật, doc gốc đã tự nghi ngờ ("cần xác minh") — audit xác nhận KHÔNG có**: grep `LayerPreset`/tên preset cụ thể ("Mặt bằng bố trí" v.v.) trong `lib/`, `components/` = 0. Chỉ có toggle từng layer riêng lẻ (G1.1), không có cơ chế preset/named-view. |

**G2 — Template dự án**

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| G2.1 | Project template | ✅ | `lib/cad/templates.ts:1-4,40` (`buildOfficeTemplate` + mẫu khách sạn, dùng chung pattern `demo-plan.ts`). |
| G2.2 | Title block tự điền, KHÔNG hardcode brand | ✅ | `lib/cad/commands.ts:251,294-296` (`titleBlockPro`, `studio = (info.studio||'').trim()` — rỗng nếu không set, KHÔNG fallback brand string); nạp từ Brand Kit dự án ở `CadEditor.tsx:766-770` (`doc.studioName` hoặc `getActiveBrandKit()?.name`). Alias cũ `titleBlockTTT` (`commands.ts:317`) chỉ còn tên, tự comment xác nhận hardcode ĐÃ bị gỡ. Đúng LUẬT NỀN TẢNG. |

**G3 — Auth**

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| G3.1 | Google OAuth @ttt.vn | 🟡 | **STALE — chính sách đã đổi 19/07**: `lib/server/auth-policy.ts:6-10` tự ghi *"THAY quyết định cũ 'chỉ Google @ttt.vn'... chấp nhận MỌI tài khoản"*. `app/api/auth/register/route.ts:8-11` xác nhận đăng ký công khai đã mở lại mọi domain. Đây là thay đổi CHỦ ĐÍCH (đúng hướng LUẬT NỀN TẢNG global-product), không phải regression — nhưng item spec như viết (domain-gate) không còn đúng hiện trạng. |
| G3.2 | Admin add | ✅ | `scripts/seed-admin.ts` (bootstrap tay) + `app/api/auth/register/route.ts:14-16,27` (admin cấp hộ tài khoản, giữ session admin). |
| G3.3 | Grandfather | ⬜ | **Moot** — vì G3.1 đã gỡ hoàn toàn domain-gate, không còn gì để "grandfather". Grep `grandfather`/`legacy domain`/allowlist = 0. |
| G3.4 | Remember Me 30 ngày | ✅ | `lib/server/auth.ts:61-66,76` (`maxAge: 60*60*24*30` khi `remember=true` mặc định). |

**Tally G**: ✅=5 · 🟡=1 (G3.1) · ⬜=2 (G1.2, G3.3) · **Tổng 8**
**Điểm G = (5×1 + 1×0.5) / 8 = 5.5/8 ≈ 69%**

---

### TỔNG KẾT SECTION 1

| Nhóm | Tổng | ✅ | 🟡 | ⬜ | ⛔ | Điểm (weighted / mẫu số không-non-goal) |
|---|---|---|---|---|---|---|
| A — Vẽ sơ phác | 24 | 19 | 4 | 1 | 0 | 21/24 ≈ 87.5% |
| B — Thư viện | 21 | 18 | 1 | 2 | 0 | 18.5/21 ≈ 88% |
| C — Tự động thông minh | 18 | 9 | 9 | 0 | 0 | 13.5/18 = 75% |
| D — MEP | 12 | 7 | 0 | 2 | 3 | 7/9 ≈ 78% |
| E — Vật liệu | 5 | 2 | 1 | 2 | 0 | 2.5/5 = 50% |
| F — Xuất bản & chia sẻ | 13 | 10 | 2 | 1 | 0 | 11/13 ≈ 85% |
| G — Quản lý | 8 | 5 | 1 | 2 | 0 | 5.5/8 ≈ 69% |
| **TỔNG** | **101** | **70** | **18** | **10** | **3** | |

**GRAND TOTAL có trọng số**: (70×1 + 18×0.5 + 10×0) = **79 điểm**.
- Trên mẫu số 101 (kể cả non-goal): **79/101 ≈ 78%**.
- Trên mẫu số 98 (loại 3 non-goal D2.3-D2.5, đúng quy ước doc gốc): **79/98 ≈ 80.6%**.

**So với tự chấm của doc gốc (87/101≈86%, hoặc 87/98≈89%)**: audit này thấp hơn ~6-9 điểm phần trăm.
Lý do chính: (1) nhóm C (checker) bị tự chấm quá cao — 5/7 item C2 thực ra chỉ nối một phần rule +
KHÔNG có nút "Apply" nào (doc gốc claim "Pro đầy đủ... wizard apply"); (2) 2 item MEP layer
(D1.5, D2.7) doc gốc chấm ✅ nhưng code không có layer đèn/MEP riêng; (3) G1.2 layer preset doc gốc
chấm ✅ (hedge "cần xác minh") nhưng audit tìm thấy 0 bằng chứng; (4) ngược lại F3.1 PWA doc gốc
để 🔜 "chưa xác minh" nhưng audit xác nhận ĐÃ có — đây là điểm nâng lên, không phải hạ.

---

## 2) PS-0 đến PS-11 — đối soát `IF-PRESENT-SPRINT-PLAN.md`

**Spot-check PS-0 (2 claim)**:
1. "`/photo-editor` mở tab trắng không nhận src" — ĐÚNG cho thời điểm 17/07, nhưng **đã được vá** (xem PS-3 dưới): `components/present-editor/PresentEditor.tsx:1224-1237` nay gọi `stashPhotoEditorIn(el.src, {slideId, elementId, assetId})` trước khi mở tab.
2. "3 nguồn khổ sân khấu hardcode 1920×1080" — ĐÚNG cho 17/07, **đã được gộp** (xem PS-4 dưới): `lib/present-editor/stage-presets.ts` nay là nguồn duy nhất, `standards.ts:75` và `export.ts:42` đều đọc từ đó, `render.ts` không còn `const W=1920`.
→ **Kết luận PS-0**: audit 17/07 CHÍNH XÁC tại thời điểm đó; 2 vấn đề nó nêu ra đã được sprint sau (PS-3, PS-4) giải quyết thật, không phải chỉ ghi trên giấy.

**Spot-check PS-1 (3 claim)**: cả 3 đều **CONFIRMED, còn đúng** — `lib/present-editor/brand-kit.ts` (localStorage, flat+activeId), `lib/present-editor/theme-roles.ts:154` `rethemeDeck()` (remap theo role, không find-replace hex), `deck.watermark` (`model.ts:251-260`) nối đủ `render.ts:581-665`/`SlidePlayer.tsx:109`/`EditorCanvas.tsx:71-308`.

| Sprint | Trạng thái thật (từ code) | Bằng chứng |
|---|---|---|
| PS-0 | ✅ done | Audit chính xác, đã verify trên. |
| PS-1 | ✅ done | Spot-check trên, không đổi. |
| PS-2 | ✅ done | `lib/present-editor/custom-templates.ts` (mới, tag "PS-2/gap B.8,B.9") — save/delete/rename, persist `localStorage['interiorflow.customTemplates']`; UI "Của tôi" ở `LayoutShelf.tsx:109,368,487-561` và `TemplatePicker.tsx:59-163`. |
| PS-3 | ✅ done | Round-trip thật: `PresentEditor.tsx:1224-1274` stash src+id → nghe lại qua `storage` event, ghi về `ImageElement.src`; `linked-assets.ts` (`setLinkedAssetSrc`) cho tài sản dùng nhiều slide. |
| PS-4 | ✅ done | `lib/present-editor/stage-presets.ts` — 5 preset (16:9, a4-landscape 1920×1358, a4-portrait, a3-landscape 2716×1920, a3-portrait) là nguồn thống nhất; tự chú thích đây là độ phân giải MÀN HÌNH (~116dpi), KHÔNG phải in 300dpi — khớp đúng cảnh báo PS-0. |
| PS-5 | ⬜ not-started | `app/api/share/[token]` + `app/share/[token]/page.tsx` chỉ xử lý `graphJson`/ReactFlow (luồng Render) — KHÔNG có nhánh cho `EditorDeck`/slide Present. Grep version/snapshot trong `lib/present-editor/*` = không có (chỉ 1 hit không liên quan trong test). |
| PS-6 | ⬜ not-started | `components/CommentLayer.tsx` có tồn tại nhưng là **công cụ feedback nội bộ cho dev/AI** (bấm bất kỳ đâu trong app → lưu JSON để agent đọc), KHÔNG phải comment khách trên slide Present, không có thread/reply, không scope theo slide. Không thoả spec PS-6. |
| PS-7 | ✅ done | `components/photo-editor/PhotoEditor.tsx:69-114` (tag "PS-7 Việc 1") — Cmd/Ctrl+Z/Y, Cmd/Ctrl+0, phím chọn tool (`toolForHotkey`), `[`/`]` cỡ cọ. Trái ngược hoàn toàn nhận định PS-0 "gần như không có phím tắt" — đã được sửa. |
| PS-8 | 🟡 partial | `app/api/present/text/route.ts` chỉ sinh **1 field text/lần** (title/kicker/body/free) qua `completeTextTiered`, KHÔNG sinh outline cả deck. `content-deck.ts` là **parser markdown thuần** (không gọi AI) — không phải "AI khởi thảo outline" như PS-8 mô tả. Không tìm thấy call-out vật liệu hay ngữ cảnh roomList/style. Hẹp hơn kế hoạch nhiều. |
| PS-9 | ⬜ not-started | `components/Dashboard.tsx` chỉ có 3 mục (Dự án/Team/Flow Render) — không có mục "Deck Present". `lib/sheets-persist.ts` vẫn khoá `userId::route::projectId` (1 record), chưa đổi theo `deckId` đa-bản ghi. |
| PS-10 | ⬜ not-started | Vẫn 4 hệ tách biệt: `GalleryPanel.tsx` (output render), `LibraryPanel.tsx` (reference chính), `present-editor/LibraryBrowser.tsx` (server + Unsplash/Openverse/Pinterest), `photo-editor/LibraryPickerModal.tsx` (fetch riêng). Không có model dữ liệu / component chung nào. |
| PS-11 | ⬜ not-started | `lib/present-editor/model.ts:20` `ElementKind = 'image'\|'text'\|'shape'` — vẫn KHÔNG có `'table'`, đúng điều kiện tiên quyết PS-11 tự nêu chưa đáp ứng. Không tìm thấy category template hồ sơ hành chánh nào trong `templates.ts`/`custom-templates.ts`. |

**Tally PS**: done=6 (PS-0,1,2,3,4,7) · partial=1 (PS-8) · not-started=5 (PS-5,6,9,10,11) — **Tổng 12**
**Điểm PS = (6×1 + 1×0.5) / 12 = 6.5/12 ≈ 54%**

---

## 3) 4 điều kiện tiên quyết cho IF2 (M1 gate)

| Điều kiện | Trạng thái | Thiếu chính xác cái gì |
|---|---|---|
| **(a) .idf format có `version`, đã đóng băng** | 🟡 | CÓ field version: `IDF_VERSION = 1 as const` (`lib/cad/idf.ts:18`), type `IdfFile{idfVersion:1,...}` (dòng 37-41). **NHƯNG chưa "đóng băng" theo nghĩa an toàn**: `importIdf()` (dòng 97-105) khi gặp `idfVersion !== IDF_VERSION` thì **từ chối thẳng** (`return null`) — KHÔNG có hàm `migrate()`/chuyển đổi nào. Vì mới có đúng 1 version từ trước đến giờ, chưa từng thử nghiệm đường nâng cấp thật — không có bằng chứng format "chịu được" thay đổi tương lai mà không làm hỏng file cũ. **Thiếu**: một dispatcher `migrate(oldVersion → currentVersion)` trước khi bump `IDF_VERSION` lần đầu, cộng theo dõi `IDF_APP_VERSION` (tự comment `idf.ts:19-20`: "chưa có nguồn version tập trung trong app — package.json version không public ở client"). |
| **(b) Semantic model thật (không chỉ hình học)** | 🟡 | Kết quả KHÔNG đồng đều giữa 3 khái niệm: **Wall** = không có `WallEntity` riêng, chỉ là `LineEntity/PolylineEntity` chung với field `elementType?` (`lib/cad/model.ts:73-83`, giá trị `'wall'|'slab'|'column'|...`) — đây là tag BIM/IFC CHUNG cho mọi entity (gán được thật qua UI `CadEditor.tsx:1859-1878`, dùng bởi `schedule.ts` để đếm BOQ theo loại), nhưng KHÔNG phân biệt vật liệu/chịu lực-hay-ngăn (grep `structural\|partition\|loadBearing\|chịu lực` = 0). **Room** = KHÔNG có field lưu trữ nào cả — "loại phòng" (`RoomKind`, `checker.ts:128,139`) là suy luận tức thời từ so khớp text label ("PHÒNG NGỦ"...) mỗi lần checker chạy, KHÔNG BAO GIỜ ghi ngược vào entity — không phải dữ liệu ngữ nghĩa sống, chỉ là phân loại tạm trong bộ nhớ. **Zone** = MỘT NGOẠI LỆ THẬT: `ZoneEntity.group: ZoneGroup` (`model.ts:267,291-306`, giá trị `'wet'|'social'|'private'|'work'|'balcony'|'service'`) được GÁN THẬT qua `ZonePanel.tsx` + ghi vào entity ở `CadCanvas.tsx:1199-1214` khi dùng tool zone. **Thiếu**: `roomType` là field thật trên Room (không phải suy luận từ text), `wallType`/material-vs-structural trên Wall — hiện chỉ Zone có ngữ nghĩa sống, Wall/Room thì không. |
| **(c) Chuỗi matId → BOQ** | ⬜ | **XÁC NHẬN KHÔNG TỒN TẠI.** `MaterialDef` (`lib/cad/materials.ts:28-47`) chỉ có `id: string`, KHÔNG có `matId`/`materialId` riêng biệt để liên kết ra ngoài. Grep `BOQ\|bill of quantit\|vật tư\|quantity` toàn bộ `.ts`/`.tsx` (loại node_modules/.next) = **0 kết quả** — không một dòng code nào tiêu thụ material id để tính số lượng/chi phí. Có MỘT chuỗi liên kết ID khác dễ nhầm: `BlockEntity.specId?` (`model.ts:209-212`) trỏ vào bảng `ProductSpec` (Prisma) cho **đồ nội thất** (không phải vật liệu hatch), tiêu thụ bởi `lib/cad/schedule.ts` để ra bảng ĐẾM SỐ LƯỢNG (không giá) — đây là chuỗi RIÊNG, không liên quan gì tới `materials.ts`. Kết luận: material hatch preset chỉ là UI chọn màu/hoạ tiết để RENDER, không nối tới bất kỳ bảng thống kê vật tư/BOQ nào. **Thiếu toàn bộ**: field liên kết trên `MaterialDef`, một bảng BOQ tiêu thụ nó, và UI hiển thị. |
| **(d) Hạ tầng bán được** | 🟡 | **RBAC**: tốt hơn kỳ vọng — `lib/server/access-policy.ts:7` `ROLES = ['owner','crea','drafter','bim','viewer']`, có `ROLE_RANK` (dòng 15-21) VÀ gate theo từng chặng pipeline `STAGE_OWNER`/`canEditStage` (dòng 33-48: concept→crea, render→drafter, present→bim) — granular thật, không phải chỉ owner/member. ✅ phần này đạt.<br>**Backup**: ⬜ KHÔNG có cơ chế backup dữ liệu thật nào — grep `backup\|cron\|pg_dump\|.sql dump` trong `lib/`, `scripts/`, `app/api/`, `package.json`, `.github/` chỉ ra 1 hit là comment mô tả `.idf` như file **user tự tải xuống thủ công** (`idf.ts`), không phải backup tự động. Chỉ có soft-delete (`deletedAt` trên `Project`/`ProjectMember`, `prisma/schema.prisma:88`) — soft-delete KHÔNG PHẢI backup (không chống mất dữ liệu do lỗi hệ thống/xoá cứng/hỏng DB).<br>**Onboarding**: 🟡 nửa vời — `app/intro/page.tsx`+`IntroSequence.tsx` chỉ là cinematic marketing (redirect thẳng `/login` sau khi xem), KHÔNG phải onboarding chức năng. `components/entry/SmartTour.tsx` là tour tương tác THẬT cho user mới (2 màn `gallery`→`canvas`, gate theo `markTourDone(user.id)`, KHÔNG gate theo `NEXT_PUBLIC_DEMO` — xác nhận không chỉ demo). Nhưng sau đăng ký, user mới với 0 dự án chỉ thấy `ProjectSelect.tsx` empty-state chung chung + nút "Dự án mới"/"Canvas trống" — KHÔNG có wizard chọn loại dự án/mẫu ngay từ đầu dù `lib/cad/templates.ts` (office/hotel) đã có sẵn, chỉ dùng được SAU KHI đã vào editor. |

---

## 4) Kết luận — % thật từng chặng + Punch list M1

### % hoàn thành thật theo chặng

> **Giới hạn phương pháp**: `IF-FEATURE-SPEC-P1-v2.md` chỉ phủ CAD (A-E) + Export/Quản lý (F/G);
> KHÔNG có nhóm item riêng cho chặng Render (ComfyUI pipeline) — chỉ có 2 connector (F1.1, F1.2).
> Vì vậy % Render dưới đây có độ tin cậy THẤP, ghi rõ.

- **CAD (nhóm A, B, C, D, E + phần CAD của F2 + G1/G2)**: weighted = 21+18.5+13.5+7+2.5+4(F2)+3(G1+G2)
  = 69.5 / 86 item ≈ **81%**.
- **Present (F1.2, F1.3, F3, PS-0..PS-11)**: weighted = 2(F1.2+F1.3)+3(F3)+6.5(PS) = 11.5 / 18 item
  ≈ **64%**.
- **Render**: KHÔNG đủ item trong spec để tính trực tiếp — chỉ có F1.1 (✅, connector CAD→Render) làm
  bằng chứng cứng duy nhất. Tín hiệu gián tiếp: PS-0 đã xác minh ảnh hero AI bị chặn ở ~1344px cạnh
  dài (~116dpi trên A3, cần ~300dpi) — **không đủ cho deliverable in thật**; nhóm C3 (Gu Engine nuôi
  Render) đạt 75%. Ước lượng thô **~65-70%, ĐỘ TIN CẬY THẤP** — cần audit riêng theo
  `docs/CATALOG-STAGE2-RENDERING.md`, không nên trích dẫn số này như kết luận chắc chắn.

### Punch list ngắn nhất để đạt M1 (hoàn thành 1 dự án thật CAD→Render→Present không rời app)

1. **Độ phân giải Render không đủ cho deliverable in** — ảnh hero AI bị chặn ~1344px cạnh dài
   (PS-0 đã đo), tối đa ~116dpi trên khổ A3 (cần 300dpi). PS-4 (khổ A3/A4) đã xây xong UI khổ trình
   bày nhưng tự nhận KHÔNG in được nét → nếu "dự án thật" cần board in, chặn cứng ở tầng model AI,
   không phải ở Present. **Size: LARGE** (cần tiled-gen/upscale model, không phải fix code nhỏ).

2. **matId → BOQ không tồn tại** — không một dòng code nào nối vật liệu (hatch) tới bảng thống kê
   vật tư/chi phí (`E1.4`, gate M1-c). Một dự án nội thất thật cần giao BOQ cho khách/nhà thầu;
   thiếu hoàn toàn buộc designer phải làm BOQ ở công cụ khác (rời app). **Size: MEDIUM-LARGE**
   (cần field liên kết trên `MaterialDef`, bảng BOQ tiêu thụ nó, UI hiển thị/xuất).

3. **Present-stage không share/nhận feedback được** (PS-5, PS-6) — `app/share/[token]` chỉ phục vụ
   luồng Render (ReactFlow), không có route cho `EditorDeck`; comment khách trên slide không tồn tại
   (CommentLayer hiện có là công cụ dev nội bộ, không phải cho khách). Vòng phản hồi khách buộc phải
   ra khỏi app (email PDF export thủ công). **Size: MEDIUM** (route/serialize riêng cho deck + version
   naming, cộng lớp pin+thread nếu cần comment).

4. **Không có backup dữ liệu thật** — chỉ soft-delete, không cron/export tự động nào bảo vệ dữ liệu
   người dùng thật khỏi mất mát (hỏng DB, thao tác sai). Đây là điều kiện "bán được" (M1-d), không
   chặn việc hoàn thành 1 dự án demo, nhưng chặn việc CAM KẾT với khách hàng thật trả tiền.
   **Size: MEDIUM** (thiết kế + cron/job, không phức tạp về thuật toán).

5. **.idf không có migration path** — `IDF_VERSION` mới có giá trị `1` từ trước đến nay; nếu bump
   version tương lai mà không viết `migrate()` trước, MỌI file .idf cũ của khách sẽ đọc lỗi im lặng,
   mất trắng dự án đã lưu. Rủi ro tiềm ẩn cao cho "dự án thật" một khi format cần tiến hoá.
   **Size: SMALL-MEDIUM** (viết dispatcher migrate trước lần bump version đầu tiên).

6. **Onboarding thiếu wizard chọn loại dự án cho user mới hoàn toàn** — SmartTour có tour UI thật,
   nhưng sau đăng ký, user 0-dự-án chỉ thấy empty-state chung, không được dẫn chọn mẫu
   apartment/office/hotel (`templates.ts` đã có, chỉ dùng được sau khi vào editor). Không chặn user
   đã biết app (như TTT), nhưng chặn trải nghiệm "ai cũng vẽ được trong 5 phút đầu" mà spec A đề ra
   cho người dùng THẬT SỰ mới. **Size: SMALL** (surface template picker ngay sau onboarding/tại
   bước "Dự án mới").
