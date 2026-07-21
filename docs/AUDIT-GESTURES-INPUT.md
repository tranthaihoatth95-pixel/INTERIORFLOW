# AUDIT — Cử chỉ & Input (chuột · phím · trackpad · cảm ứng) toàn app

Phương pháp: đọc code thật (không đoán) trên từng bề mặt, đối chiếu với nền `lib/input/wheel.ts`
(20/07) đã thống nhất phân loại chuột/trackpad/pinch cho CAD+Rendering. Xếp hạng P0 (chặn dùng) /
P1 (khó chịu rõ, rủi ro thấp — ĐÃ SỬA trong đợt này) / P2 (đánh bóng / tính năng mới, CHỈ đề xuất).
Ngày: 21/07/2026, HEAD worktree `8641064` (nhánh `worktree-agent-ad129bdab46a23819`, rẽ từ
`feat/present-layout-ml-p1` — **CŨ HƠN `main` hiện tại**, xem mục "Giới hạn phạm vi" cuối file).

**Không phải audit lại UX/muscle-memory tổng quát** (đã có `docs/UX-AUDIT-HABITS.md`) — trọng tâm
lần này CHỈ input method: chuột/phím/trackpad/cảm ứng, và có nhất quán xuyên 4 bề mặt không.

## Mục lục
1. [Bảng hiện trạng theo bề mặt × input method](#bang-hien-trang)
2. [P0 — chặn dùng](#p0)
3. [P1 — đã sửa trong đợt này](#p1)
4. [P2 — đề xuất, CHƯA làm](#p2)
5. [Đối chiếu chéo (điểm b/c của đầu bài)](#doi-chieu-cheo)
6. [Giới hạn phạm vi audit này](#gioi-han)
7. [Verify](#verify)

---

## 1. Bảng hiện trạng theo bề mặt × input method <a name="bang-hien-trang"></a>

| Bề mặt | Chuột lăn | Trackpad 2-ngón | Pinch (trackpad/cảm ứng) | Phím tắt | Double-click/tap | Long-press | Swipe | Right-click |
|---|---|---|---|---|---|---|---|---|
| **Drafting CAD** (`CadCanvas.tsx`) | ✅ zoom quanh con trỏ, `lib/input/wheel.ts` (:662-683) | ✅ pan, phân loại bằng `looksLikeTrackpad()` | ✅ pointer-based 2-ngón thật (:436-462, :539-564), tự huỷ thao tác 1-ngón khi ngón 2 chạm | ✅ đầy đủ nhất app: F8/F12/type-anywhere/right-click=Enter/Delete/Backspace | ⚠️ double-CLICK chuột chỉ chốt polyline/wall/spline (:712-717) khi đang vẽ; double-TAP cảm ứng CHƯA có ý nghĩa riêng (không zoom-to-fit, không gì cả ngoài dblclick trình duyệt tự sinh — chưa kiểm trên thiết bị thật) | ❌ chưa có (native context menu bị chặn cứng :2661, không thay bằng gì) | N/A (không phải danh sách) | ✅ có ý nghĩa: Enter/lặp lệnh (:473-478) |
| **Rendering** (`FlowCanvas.tsx`) | ✅ zoom quanh con trỏ, CÙNG `wheel.ts` (:61-84) | ✅ pan qua React Flow `panOnScroll` | ✅ `zoomOnPinch` (React Flow/d3-zoom lo, cả trackpad lẫn cảm ứng thật) | ✅ mod+D/G/Z/Y, Space-giữ pan, v/h chọn tool (:227-274) | ⚠️ double-click nền = zoom-in (mặc định React Flow `doubleClickZoom`, KHÔNG override) — chưa xác nhận double-TAP cảm ứng có ăn qua d3-zoom hay không | ❌ chưa có, không chặn native menu (khác CAD) | N/A | ❌ không có xử lý riêng — hiện menu native trình duyệt |
| **Presenting** (`EditorCanvas.tsx`/`PresentEditor.tsx`) | ✅ Ctrl/⌘+lăn = zoom, lăn trần = cuộn trang (`zoomOnPlainWheel:false`, :462-469) | ⚠️ 2-ngón trần = cuộn trang tự nhiên (KHÔNG pan canvas riêng — khác CAD/Rendering, nhưng ĐÚNG Ý cho công cụ dàn trang kiểu Canva, không phải canvas vô hạn) | 🔴 **KHÔNG có trên cảm ứng thật**: trang khoá `userScalable:false` toàn app (`app/layout.tsx:48-57`, lý do ghi rõ "canvas tự pinch-zoom qua React Flow") nhưng Presenting chưa tự cài pinch cảm ứng nào — trên tablet/điện thoại, chụm 2 ngón trên sân khấu KHÔNG làm gì cả | ✅ zoom Ctrl+/-/0 (Figma-style), Esc huỷ Format Painter | ⚠️ double-click chuột sửa chữ/ảnh tại chỗ (`Element.tsx:298-301`) — double-TAP cảm ứng chưa kiểm trên thiết bị thật | ❌ chưa có, `onContextMenu` custom = menu phải-chuột riêng (không phải long-press) | ✅ `SlideStrip` cuộn ngang tự nhiên (overflowX:auto); `SlideSorter` kéo-thả ĐÃ dùng Pointer Events (mouse+touch+pen chung 1 cơ chế, đúng mẫu CadCanvas) | ✅ menu custom trên element (Element.tsx:302) |
| **Gallery** (`ProjectSelect.tsx`) | N/A (không phải canvas) | N/A | N/A (không cần, đã ghi rõ trong đầu bài) | ✅ `← →` điều hướng + Enter mở — **ĐÃ XÁC NHẬN CHẠY THẬT**, không phải chữ gợi ý suông (:445-473) | N/A | N/A | 🔴 **KHÔNG có** — carousel chỉ đổi bằng click card bên/phím, không bắt được vuốt ngang | N/A |
| **Dashboard** (`Dashboard.tsx`) | N/A | N/A | N/A | ✅ Esc đóng overlay (:165-171) | N/A | N/A | ❌ chuyển tab chỉ bằng click | N/A |

---

## 2. P0 — chặn dùng <a name="p0"></a>
*(Không tìm thấy P0 mới.)* Nền wheel/pinch/phím tắt đợt 20/07 đã đóng hầu hết lỗ hổng lớn trên
CAD+Rendering. Điểm gần-P0 duy nhất tìm được (mục P1 #1 dưới) được xếp P1 vì có lối thoát khác
(Delete/Backspace) nên KHÔNG "chặn dùng" hoàn toàn, chỉ "hỏng 1 luồng gõ tắt + xoá nhầm dữ liệu".

## 3. P1 — đã sửa trong đợt này <a name="p1"></a>

### P1-1. [ĐÃ SỬA] Phím `E` trên canvas CAD xoá nhầm selection + chặn chết lệnh gõ tắt EX/EL/ERASE
**File:** `components/cad/CadCanvas.tsx` (nhánh `onKey`, gần dòng 1786).

**Hiện tượng (trước sửa):** tool mặc định là `'select'` (`lib/cad/store.ts:284`). Khi đang chọn ≥1
đối tượng và gõ trực tiếp lên canvas (tính năng "type-anywhere" — gõ chữ bất kỳ lúc rảnh tự chảy
vào dòng lệnh, KHÔNG cần click ô lệnh trước, xem comment gốc dòng ~1800), phím `e`/`E` bị một
nhánh RIÊNG bắt TRƯỚC khi tới type-anywhere:
```
if (e.key === 'Delete' || (e.key === 'e' && st.tool === 'select')) {
  st.deleteSelected();
  ...
  return;
}
```
Hậu quả kép:
1. **Xoá dữ liệu ngoài ý muốn** — người dùng định gõ `EX` (Extend), `EL`/`ELLIPSE` (Ellipse) hay
   `ERASE` (đủ chữ) nhưng phím `E` đầu tiên đã xoá NGAY selection đang có trước khi họ kịp gõ chữ
   thứ 2.
2. **Lệnh gõ tắt không bao giờ chạy được** — `EX`/`EL`/`ERASE` (3 lệnh CÓ THẬT trong
   `components/cad/CadEditor.tsx:1181,1186,1173`, đúng chuẩn AutoCAD mà `docs/UX-AUDIT-HABITS.md`
   liệt kê "TR/EX" là thói quen cần khớp) không bao giờ gõ được qua type-anywhere vì phím `e` đã bị
   nuốt và `return` sớm, buffer lệnh không nhận được ký tự đầu.

Đây KHÔNG phải tính năng mới thiếu — đây là bug thật: type-anywhere được xây ĐÚNG cho mục đích này
(comment gốc "chuẩn AutoCAD... không cần click ô lệnh trước") nhưng bị 1 nhánh phím tắt che mất
đúng 1 chữ cái, và nhánh đó không có comment giải thích lý do tồn tại (khác trường hợp `f`/`F` bên
dưới, ĐÃ được ghi chú rõ là đánh đổi có chủ đích — xem mục 5).

**Sửa:** bỏ vế `(e.key === 'e' && st.tool === 'select')`, chỉ giữ `e.key === 'Delete'` cho nhánh
xoá tức thì. Delete-key và Backspace (khi buffer rỗng, nhánh riêng bên dưới, không đụng) vẫn xoá
được ngay — KHÔNG mất khả năng "phím tắt xoá nhanh". `E` giờ rơi đúng vào type-anywhere: gõ `e` →
seed "E" vào ô lệnh + focus ô lệnh (cơ chế có sẵn, `CadEditor.tsx:1279-1286`) → gõ tiếp `x` như
input thường → `EX` + Enter → chạy đúng `EXTEND` qua `cmdMap` có sẵn (không cần thêm dispatcher
mới). Gõ `E` rồi Enter ngay (không gõ thêm) vẫn xoá được, qua đúng `cmdMap.E → deleteSelected()`
đã có sẵn (`CadEditor.tsx:1383`) — hành vi AutoCAD thật ("gõ E, Enter = Erase") được BẢO TOÀN, chỉ
đổi từ "xoá tức thì ở phím đầu" sang "xoá khi Enter", đúng cách AutoCAD thật hoạt động (không có
lệnh nào trong AutoCAD tự chạy ngay ở keydown đầu tiên khi đang gõ chuỗi).

**Verify thật (browser, không chỉ đọc code):** dev server cô lập `127.0.0.1:4501` (worktree, KHÔNG
`localhost`, KHÔNG đụng DB/cookie thật — xem mục 7). Vẽ 1 rect (2 entity), chọn cả 2 qua store,
dispatch đúng `KeyboardEvent('keydown',{key:'e'})` lên `window` (mô phỏng gõ trên canvas, không
phải trong ô input):
  - **Trước sửa** (suy từ code, không chạy lại bản cũ để tránh mất công revert): `entities.length`
    sẽ về 0 ngay tại phím `e`.
  - **Sau sửa (đã chạy thật):** `entityCountAfterE: 2`, `selectionAfterE` giữ nguyên 2 id — KHÔNG
    xoá. Ô lệnh nhận `value: "E"` và tự focus (`isFocused: true`). Gõ tiếp `x` (qua `computer.type`,
    tức bàn phím thật của trình duyệt) → ô lệnh thành `"Ex"`. Dispatch `Enter` trên ô lệnh →
    `tool` chuyển đúng `"extend"`, `entities`/`selection` KHÔNG đổi (không có gì bị xoá dọc đường).
  - Xác nhận Delete-key KHÔNG bị ảnh hưởng: chọn lại 2 entity, dispatch `keydown Delete` →
    `entities.length` về 0 đúng như trước (nhánh không đụng tới).

**Không đụng gì khác:** không sửa `f`/`F` (mục 5, đã có lý do ghi rõ trong code, giữ nguyên theo
đúng chỉ đạo "không đảo ngược điều đã cố ý"), không sửa `c`/`C`/`r`/`R` (đã gate đúng theo tool
đang active, không có xung đột tương tự — xem mục 5).

---

## 4. P2 — đề xuất, CHƯA làm <a name="p2"></a>
*(Chỉ ghi đề xuất + độ khó, KHÔNG tự thêm — đúng nguyên tắc "không thêm hàng loạt gesture mới".)*

| # | Đề xuất | Bề mặt | Độ khó | Ghi chú |
|---|---|---|---|---|
| P2-1 | Pinch-zoom cảm ứng thật cho sân khấu Presenting | Presenting | **Trung bình-cao** | Cần state machine 2-pointer riêng (kiểu CAD `ix.current.pinch`), phải tránh xung đột với marquee-select/kéo-element đang dùng Pointer Events 1-ngón trên `EditorCanvas.tsx`/`Element.tsx`. Hiện chỉ có Ctrl+lăn/pinch-trackpad (qua `ctrlKey`) — người dùng tablet/điện thoại thật KHÔNG zoom được sân khấu bằng chụm ngón, chỉ dùng nút +/− có sẵn. |
| P2-2 | Long-press = menu ngữ cảnh trên cảm ứng | Cả CAD + Rendering + Presenting | **Trung bình** | CAD chặn cứng native contextmenu không thay gì (`CadCanvas.tsx:2661`); Rendering không chặn (menu native lọt ra); Presenting có menu custom nhưng chỉ bind `onContextMenu` (chuột), không có phát hiện long-press cảm ứng. Cần 1 hook dùng chung (timer pointerdown→pointerup) thay vì viết 3 lần khác nhau. |
| P2-3 | Double-tap cảm ứng có ý nghĩa RÕ + THỐNG NHẤT xuyên app | CAD / Rendering / Presenting | **Thấp-trung bình (xác minh) → cao (nếu phải thêm mới)** | CAD: double-click hiện chỉ hoạt động giữa chừng vẽ polyline/wall/spline, không có double-tap cảm ứng riêng biệt (vd zoom-to-fit). Presenting: double-click sửa text/ảnh tại chỗ. Rendering: double-click nền = zoom-in (mặc định thư viện). Ba ý nghĩa khác nhau tuỳ bề mặt — CÓ THỂ chấp nhận được (khớp phần mềm gốc mỗi bề mặt tham chiếu: AutoCAD/Canva/Figma vốn cũng khác nhau), nhưng CHƯA XÁC NHẬN double-TAP cảm ứng thật (không phải double-click chuột) có kích hoạt đúng 3 hành vi này trên thiết bị cảm ứng thật hay không — khuyến nghị test tay trên iPad/Android trước khi kết luận cần sửa gì. |
| P2-4 | Swipe ngang đổi card Gallery carousel | Gallery | **Thấp** | Card bên đã tap được (không "chết"), nhưng thiếu vuốt ngang đúng kỳ vọng carousel di động. Card giữa dùng `active` state (không phải DOM focus thật) nên cần thêm 1 lớp Pointer Events đo `deltaX` khi buông tay, tương tự mẫu `SlideSorter.tsx` đã có. |
| P2-5 | Swipe đổi tab Dashboard trên mobile | Dashboard | **Thấp** | Hiện chỉ click. Tab hiện có trong worktree này chỉ 1 tab "Tổng quan" (xem mục 6 — 3-tab Larkbase chưa có trong nhánh này để đánh giá đầy đủ). |
| P2-6 | Kéo-thả sắp xếp `SheetTabBar` (CAD multi-sheet) không chạy trên cảm ứng | Drafting CAD | **Trung bình** | Dùng HTML5 native `draggable` (`components/studio/SheetTabBar.tsx:98`) — kiểu kéo-thả này KHÔNG hoạt động trên cảm ứng (giới hạn nền tảng, đã ghi nhận cùng lớp vấn đề trong `docs/QA-SWEEP-REPORT.md` "Drag-drop native HTML5"). Đổi sang Pointer Events sẽ đồng bộ với `SlideSorter.tsx` (đã làm đúng mẫu này). |
| P2-7 | Right-click Rendering vô nghĩa (không custom, không chặn) | Rendering | **Thấp** | Không phải bug — chỉ là chưa làm gì. CAD có right-click=Enter (ngữ cảnh vẽ lệnh); Presenting có menu custom; Rendering bỏ trống, hiện menu trình duyệt gốc (Inspect/Save…). Cân nhắc thêm menu node (nhân bản/xoá/z-order) nếu muốn khớp Figma thật, nhưng đây là tính năng mới, không phải khôi phục hành vi cũ. |

---

## 5. Đối chiếu chéo — điểm (a)(b)(c) của đầu bài <a name="doi-chieu-cheo"></a>

**(a) Phím tắt xung đột giữa các bề mặt?** Không tìm thấy xung đột THẬT giữa các bề mặt (mỗi bề
mặt là route/khu vực riêng, không đồng thời nhận sự kiện — `Cmd+K` command palette là global nhưng
không trùng phím với bất kỳ bề mặt nào). Xung đột duy nhất tìm được là NỘI BỘ 1 bề mặt (CAD): phím
trực tiếp `f`/`F` (zoom extents, KHÔNG gate theo tool, `CadCanvas.tsx:1796`) che mất lệnh gõ tắt
`F` (Fillet) qua type-anywhere — nhưng đây là **đánh đổi CÓ CHỦ Ý, đã ghi chú rõ trong code**
(`CadEditor.tsx:1390-1391`: "Zoom Extents: KHÔNG dùng 'F' ở dòng lệnh nữa... phím tắt trực tiếp 'f'
trên canvas... vẫn còn"). Khác `E` (mục P1-1) ở chỗ hậu quả của `F` chỉ là "phải click vào ô lệnh
để gõ Fillet", KHÔNG xoá mất dữ liệu — nhẹ hơn hẳn, và đã được 1 phiên trước cân nhắc + quyết định
rõ ràng. **Giữ nguyên, không sửa**, chỉ ghi lại đây để minh bạch.

**(b) Gesture cảm ứng có nhất quán ý nghĩa xuyên app không?** Double-tap: CHƯA đồng nhất nhưng có
lý do hợp lý (mỗi bề mặt mô phỏng phần mềm gốc khác nhau — xem P2-3). Long-press: nhất quán ở chỗ
**không bề mặt nào có** (không phải bất nhất, mà đồng loạt thiếu — P2-2). Pinch: nhất quán ở CAD +
Rendering (cả hai đều tự cài, đều tôn trọng `ctrlKey`/2-pointer thật), NHƯNG Presenting lệch hẳn
(không có, xem P2-1) — đây là bất nhất RÕ nhất tìm được, dù xếp P2 vì rủi ro triển khai không nhỏ
(mục 4).

**(c) Trackpad 2-ngón đã nhất quán ở Rendering/Presenting như CAD (20/07) chưa?** ĐÃ nhất quán ở
mức phù hợp với bản chất từng bề mặt: CAD và Rendering đều dùng chung `lib/input/wheel.ts`
(`classifyWheel`) → chuột lăn=zoom, trackpad=pan, pinch=zoom — Y HỆT nhau (Rendering còn tận dụng
thêm `zoomOnPinch`/`panOnScroll` có sẵn của React Flow cho phần cảm ứng thật, không cần code
riêng). Presenting KHÁC có chủ đích: nó không phải canvas vô hạn mà là "trang trình bày" nên lăn
chuột trần / trackpad trần = cuộn trang (giữ nguyên hành vi cuộn quen thuộc của trình duyệt), CHỈ
Ctrl/⌘+lăn hoặc pinch-trackpad mới zoom — đúng chuẩn Figma/Canva khi sửa 1 trang, không phải lỗi.
Điểm CHƯA nhất quán thật sự (không phải do khác bản chất mà do thiếu code) là **pinch cảm ứng thật
trên Presenting** (P2-1) — CAD/Rendering có, Presenting không.

---

## 6. Giới hạn phạm vi audit này <a name="gioi-han"></a>

Worktree này (`8641064`) rẽ nhánh TRƯỚC khi `main` merge thêm: Larkbase Gallery (nút "Chi tiết" +
pill cảnh báo trên card `ProjectSelect.tsx`), ambient cover glow, panel Dashboard 3-tab
Bảng/Kanban/Nhân sự (`components/dashboard/LarkPanels.tsx` — file này KHÔNG tồn tại trong nhánh
đang làm việc), và 1 fix riêng "chữ chồng/echo" ở `EditorCanvas.tsx` (không liên quan gesture/input,
đã fix trên `main`, KHÔNG đụng trong đợt này vì ngoài phạm vi + đã giải quyết). Do đó:

- **Mục 5 (Dashboard 3-tab)** trong đầu bài KHÔNG audit được đầy đủ trong nhánh này — bảng trên chỉ
  phản ánh Dashboard "Tổng quan" 1-tab hiện có ở worktree. Đã đọc lướt (read-only, KHÔNG sửa)
  `components/dashboard/LarkPanels.tsx` trên `main` để có thông tin: sort bảng = click header
  (`Th` component), chuyển tab = click — cả hai đều thuần chuột/tap, không có swipe (khớp P2-5).
- **Mục 4 (Gallery Larkbase)**: phần carousel GỐC (arrow keys, click, không swipe) được audit đầy đủ
  trong nhánh này và không đổi giữa 2 bản (diff xác nhận phần Larkbase chỉ thêm nút "Chi tiết"/pill,
  không đụng logic gesture).
- Khuyến nghị: nếu cần audit đầy đủ mục 5 + phần Larkbase của mục 4, nên chạy lại đợt audit ngắn
  trên `main` (hoặc nhánh đã merge M1) sau khi nhánh này merge, KHÔNG cần lặp lại phần CAD/Rendering
  /Presenting đã xong ở đây.

---

## 7. Verify <a name="verify"></a>

1. **`npx tsc --noEmit`** — sạch, không lỗi (chạy trên worktree, `node_modules` resolve ngược lên
   repo gốc qua cơ chế module resolution chuẩn của Node vì worktree nằm lồng trong
   `.claude/worktrees/` của repo chính — không cần cài riêng).
2. **64/64 test `.test.ts`** chạy bằng `sucrase-node` (dùng binary tuyệt đối của repo gốc vì
   worktree không có `node_modules/.bin` riêng: `/…/interiorflow/node_modules/.bin/sucrase-node`) —
   PASS toàn bộ, không file nào lùi. Không thêm test mới: fix P1-1 là XOÁ 1 nhánh điều kiện gây bug
   (không phải logic thuần mới tách được thành hàm độc lập kiểu `wheel.ts`), và `CadCanvas.tsx`
   chưa có hạ tầng test đơn vị cho `onKey` (handler nằm trong closure của component 3000 dòng, cần
   refactor lớn để cô lập test — NGOÀI PHẠM VI đợt này). Thay vào đó verify bằng browser thật (mục
   3 dưới) với dispatch sự kiện chính xác + đọc trực tiếp state store, coi là bằng chứng đủ mạnh.
3. **Verify browser AN TOÀN**: `next dev` chạy trên `PORT=4501`, mở qua `127.0.0.1:4501` (KHÔNG
   `localhost`) trong 1 tab riêng của Browser pane, không đăng nhập (route `/cad-editor` không có
   auth gate phía client/server cho phần vẽ — chỉ API lưu/tải cần login, không đụng tới trong lúc
   test thao tác bàn phím thuần client-state). KHÔNG chạm `DELETE /api/auth/me`, không logout, không
   đụng cookie. Dừng server + đóng tab ngay sau khi xong.
4. **Verify MẮT (trước/sau) cho P1-1**: xem chi tiết đầy đủ + số liệu thật trong mục 3 (P1-1) ở
   trên — tóm tắt: trước sửa, gõ "E" lúc đang chọn đối tượng xoá NGAY (suy từ đọc code, không revert
   để tái hiện tránh rủi ro thao tác thừa); sau sửa, gõ "E" giữ nguyên selection + seed đúng ô lệnh,
   gõ tiếp "X" ra "Ex", Enter chạy đúng EXTEND — đã chạy THẬT qua dispatch sự kiện trên trang đang
   sống, không phải mô phỏng tĩnh.
