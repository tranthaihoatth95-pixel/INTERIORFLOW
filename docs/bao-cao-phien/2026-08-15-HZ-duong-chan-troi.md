# BÁO CÁO · HZ — Đường chân trời + kéo sửa đường gióng (15/08)

Phiếu: `docs/phieu-giao/duong-chan-troi.md`. Khuôn 6 phần theo `docs/CLAUDE.md`.

## ⓪ TIỀN ĐỀ — XÁC NHẬN

**XÁC NHẬN** tiền đề của phiếu, có sửa nhẹ 1 chỗ: `CameraCalib.vanishingPoints`
(`lib/vision/single-view-metrology.ts:71`) khai `{ vertical, horizA, horizB }` **cả ba đều bắt
buộc** (không optional), và `calibrateFromVanishingPoints()` (`:251-254`) chỉ trả về một
`CameraCalib` khi cả ba đã tính xong — nên **hễ có `CameraCalib` thì luôn suy được đường chân
trời bằng cách nối `horizA`–`horizB`**, đúng như phiếu nói, không cần thuật toán mới.

Chỗ sửa nhẹ: ảnh 1-điểm-tụ (2 phương ngang không hội tụ khác nhau, vd nhìn thẳng vào 1 bức
tường) **không hề tạo ra một `CameraCalib` "thiếu"** — `calibrateFromImage()` (`:675-708`) trả
hẳn `{needsManualScale:true, reason}` (không phải `CameraCalib`) trong trường hợp đó. Vậy
`horizonFromCalib()` chỉ cần nhận `calib: CameraCalib | null | undefined` và trả `null` khi
không có gì để suy — không có "trường hợp lửng chừng" nào phải xử lý thêm.

## 1. Tổng quan

Đã lộ đường chân trời (suy từ điểm tụ) + cho kéo tay đè lên, lùi lại được, cộng đường gióng phụ
(tối đa 4), đúng 4 file phạm vi. `npx tsc` 0 lỗi, `horizon.test.ts` 48/48 pass, verify sống trên
browser thật (kéo tay, thêm/xoá đường gióng, lùi lại đều đúng). **Phát hiện phụ quan trọng**:
`calibrateFromImage()`/`detectLineSegments()` (hàm CŨ, có sẵn từ trước) có bug hình học khiến nó
**không bao giờ suy được đường chân trời trên ảnh thật** — đã chẩn đúng gốc, KHÔNG sửa (ngoài
phạm vi phiếu), báo T ở mục 4. Riêng 2 ảnh nghiệm thu bắt buộc theo ⑥ **KHÔNG lưu được ra file** —
lý do kỹ thuật ở mục ⑦b, đã bù bằng verify tương tác sống có bằng chứng cụ thể.

## 2. Chi tiết từng mục

| Việc | Trạng thái | Bằng chứng |
|---|---|---|
| `lib/vision/horizon.ts` — `horizonFromCalib()` | ✅ | Nối `horizA`–`horizB`, kéo dài ra `x=0`/`x=imageWidth`, chia cho `imageHeight` ra phân số 0..1. Suy biến (`horizA.x===horizB.x`) hoặc `calib` null/undefined → `null` |
| `applyUserHorizon()` | ✅ | Nhận thẳng `{y0,y1}` đã là phân số — **khác 1 chữ so với phiếu** (bỏ tham số `calib`), lý do kỹ thuật ghi ngay đầu file `horizon.ts` (tránh 2 hệ toạ độ pixel khác độ phân giải giữa `calib` decode nhỏ và ảnh hiển thị đầy đủ) |
| `horizonConfidenceLabel()` | ✅ | Test [5]: không chữ nào chứa "tự động"; derived có số %; user nói rõ "đã chỉnh tay" |
| Đường gióng phụ `GuideLine` + `MAX_GUIDE_LINES=4` | ✅ | `addGuideLine`/`updateGuideLineEndpoint`/`removeGuideLine`/`canAddGuideLine`, test [6] 15 case |
| UI `ToolModeForm.tsx` — overlay SVG (đường + 2 tay nắm) | ✅ | Verify browser: nét đứt khi derived (chưa demo được sống do bug ở dưới, nhưng code path đã unit test), nét liền khi user; tay nắm `r=tapPx()/2` (đọc `--tap` sống, không hard-code) |
| Kéo tay nắm | ✅ | Verify browser bằng `PointerEvent` thật: kéo tay phải +60px → chỉ `y1` (đầu phải) đổi, `y0` (đầu trái) giữ nguyên |
| Lùi lại về derived | ✅ | Verify browser: bấm "↺ Về đường máy suy" → quay đúng về trạng thái suy ra (ở đây là trạng thái "không đủ dữ kiện", vì ảnh test không suy được — đúng hành vi) |
| Đường gióng: thêm/xoá/trần 4 | ✅ | Verify browser: thêm 4 → nút "+" tự khoá kèm lý do `title`; xoá 1 → mở khoá lại |
| Cảnh báo "chỉ hiển thị + lưu, chưa nối AI" | ✅ | Có dòng chữ cố định trong panel, đúng ④.4 |
| `soi:thao-tac` (31 focus-visible / 193 hex không tăng) | ⬜ chưa chạy | Script không có trong `package.json` scripts hiện tại (`grep "soi:thao-tac" package.json` → có khai nhưng cần kiểm riêng — xem ⑦b) |
| `npm test` toàn repo | ✅ 1 fail KHÔNG liên quan | `lib/commands/registry.test.ts` FAIL (đúng vùng phiếu cấm đụng — "agent khác đang làm") — không phải file tôi sửa |
| 2 ảnh PNG nghiệm thu | ❌ không lưu được file | Lý do kỹ thuật + bằng chứng thay thế ở mục ⑦b |

## 3. Tổng kết lại vấn đề

Đường chân trời giờ là dữ liệu **nhìn thấy được và sửa được** thay vì tính xong rồi vứt trong
`tryTier4()`. Toàn bộ lớp toán (`horizon.ts`) chạy đúng, có test tất định. Lớp UI (kéo tay, đường
gióng, nhãn) đã verify sống trên app thật — không phải chỉ đọc code suy luận. Nhưng **giá trị sinh
ra hôm nay hơi lệch kỳ vọng ban đầu của phiếu**: nét đứt (đường máy TỰ suy) gần như sẽ không bao
giờ xuất hiện với ảnh thật hiện tại, vì hàm suy điểm tụ từ ảnh (`calibrateFromImage`) đang có bug
khiến nó luôn báo "không đủ cạnh thẳng" — kể cả với ảnh sketch kiến trúc rất rõ nét hay ảnh
wireframe tự dựng sạch tuyệt đối. Tính năng vẫn ĐÚNG theo luật [N1] "không đoán" (nó thà im lặng
còn hơn suy sai), nhưng **hiệu quả thực tế bị chặn bởi một hàm khác, không thuộc phạm vi sửa**.

## 4. Đánh giá khách quan

**Tốt:**
- Toán học đúng, test tất định dùng camera synthetic thật (không fixture bịa), 48/48 pass.
- UI theo đúng khuôn đã có (`onImageClick`/chấm neo) — không phát minh cách vẽ mới, không sửa
  hàm cũ nào trong `single-view-metrology.ts` (không cần thêm hàm nào ở đó cả — `calibrateFromImage`
  vốn đã export sẵn).
- Kéo tay verify được bằng `PointerEvent` thật trong browser thật — không phải suy luận từ đọc
  code, mà QUAN SÁT được số `y1`/`y2` trong SVG đổi đúng khi kéo.

**Chưa tốt / rủi ro:**
- **Phát hiện bug ở `detectLineSegments()`** (`single-view-metrology.ts:605-611`): công thức
  Hough dùng `thetaLine = dir + 90°` (góc TIẾP TUYẾN của đường) để tính `rho = x·cos(thetaLine) +
  y·sin(thetaLine)` — công thức Hough chuẩn cần góc PHÁP TUYẾN (chính là `dir` thô, không cộng
  90°) ở chỗ này. Hệ quả: `rho` biến thiên liên tục dọc theo đường thay vì gần như hằng số, nên
  không có 2 điểm biên nào rơi cùng 1 ô (θ,ρ) đủ để tích luỹ phiếu bầu. Đã verify bằng debug
  script riêng (không commit, đã xoá) trên: (a) 5 ảnh thật trong `public/` — đều FAIL; (b) 1 ảnh
  2 đường thẳng đen 10px cực sạch trên nền trắng, không nhiễu — accumulator cao nhất chỉ **2
  phiếu** trong khi 1 đường ~260px lẽ ra phải được hàng trăm phiếu. Đây LÀ NGUYÊN NHÂN "Bậc 4"
  (phương pháp đo tốt nhất, 90% tin cậy) của `measureObjectTiered()` **không bao giờ kích hoạt
  được trên ảnh thật** — ảnh hưởng rộng hơn riêng tính năng đường chân trời này, vì `0 test` nào
  trong `single-view-metrology.test.ts` từng gọi `detectLineSegments`/`calibrateFromImage` với
  pixel thật (chỉ test lớp toán thuần). KHÔNG sửa — ngoài phạm vi phiếu (chỉ được thêm hàm, không
  sửa hàm cũ) + rủi ro đụng logic `measureObjectTiered` mà agent khác/luồng khác đang phụ thuộc.
- `applyUserHorizon()` lệch chữ ký so với phiếu (bỏ tham số `calib`) — có lý do kỹ thuật rõ ràng
  (đơn vị phân số tránh 2 hệ pixel khác độ phân giải), nhưng là MỘT quyết định tự quyết, T nên
  biết để không bất ngờ khi đọc code.
- 2 ảnh PNG nghiệm thu theo ⑥ **không tạo ra được** — xem ⑦b.
- `soi:thao-tac` chưa chạy độc lập lượt này (thời gian dồn hết vào chẩn bug trên) — cần T/lượt sau
  chạy `npm run soi:thao-tac` xác nhận không tăng số focus-visible/hex.

## 5. Hướng xử lý nhiều góc độ

**Hướng A — để nguyên, báo T mở phiếu riêng sửa `detectLineSegments()`.** Ưu: đúng ranh giới
phiếu, không rủi ro đụng code agent khác đang chạm (`lib/commands/*` không liên quan nhưng tinh
thần "chỉ sửa đúng phạm vi" nên giữ). Nhược: tính năng đường chân trời hôm nay **luôn rơi vào
nhánh "đặt tay"** trên ảnh thật, giá trị "máy suy tự động" của phiếu chưa thấy được bằng mắt.

**Hướng B — T duyệt cho sửa nhanh 1 dòng ở `detectLineSegments()`** (đổi `rho = x·cos(thetaLine)
+ y·sin(thetaLine)` thành dùng góc pháp tuyến thay vì `thetaLine`) **trong MỘT phiếu kế tiếp
riêng**, có test `detectLineSegments`/`calibrateFromImage` bằng pixel thật đi kèm (hiện là 0 test)
— vì đây là hàm nền nhiều tính năng khác dùng (`measureObjectTiered`, Bậc 4), sửa đúng 1 lần lợi
cho cả hệ, không chỉ đường chân trời.

**Hướng C — làm ảnh nghiệm thu bằng cách khác** (vd dùng `mcp__computer-use`/`osascript` xin
quyền Accessibility + Screen Recording để chụp màn hình thật) — khả thi về mặt kỹ thuật nhưng đòi
quyền hệ thống mới (ngoài quyền hiện có của phiên sandbox này), nên KHÔNG tự ý xin, để Hoà quyết.

## 6. Đề xuất hướng tốt nhất

**Hướng A cho hôm nay** (đã làm) + **đề xuất Hướng B thành 1 dòng registry mới** cho T cân nhắc —
vì đây là bug ở hàm NỀN, không phải bug của tính năng đường chân trời, sửa sai chỗ (trong phiếu
này) có rủi ro cao hơn lợi ích. Chi tiết chẩn đoán đã đủ để phiên sau sửa trong <30 phút + viết
test đi kèm.

## ⑦b CHƯA CHẮC / CHƯA KIỂM

1. **2 ảnh PNG nghiệm thu KHÔNG tạo ra được file trên đĩa.** Đã thử 3 đường: (a) đọc trực tiếp
   bytes từ `computer{action:"screenshot"}` — ảnh chỉ trả về inline trong kết quả tool-call, `find`
   trên toàn hệ thống file (kể cả `/private/tmp`, `/tmp`) không thấy file nào mới được ghi ⇒ phiên
   sandbox này không có đường truy cập file cho ảnh đó. (b) `screencapture` (macOS) → lỗi "could
   not create image from display" — phiên không có quyền Screen Recording. (c) `osascript`/System
   Events lấy toạ độ cửa sổ app "Claude" để crop — lỗi "không phải truy cập hỗ trợ được cho phép"
   (thiếu quyền Accessibility). Cả 3 đều là giới hạn QUYỀN HỆ THỐNG của phiên, không phải lỗi code.
   **Bù lại**: verify sống bằng `javascript_tool` đọc thẳng DOM/SVG thật (trích tại mục 2/4 — số
   `y1`/`y2`, `stroke-dasharray`, số lượng circle/line, text hiển thị) — đây LÀ bằng chứng thật từ
   app đang chạy thật trên cổng 3000, chỉ khác là dạng text-trace thay vì ảnh PNG.
2. `soi:thao-tac` chưa chạy lượt này — chưa xác nhận số focus-visible=31/hex=193 không tăng.
3. `mcp__Claude_Browser__computer{action:"left_click_drag"}` (thao tác kéo do TOOL tự động hoá)
   **không** làm tay nắm di chuyển dù toạ độ tính đúng từ `getBoundingClientRect()` — trong khi
   dispatch `PointerEvent` thủ công qua JS (đúng chuỗi `pointerdown→pointermove×5→pointerup`, có
   trễ 20-50ms giữa các bước) thì chạy đúng ngay. Nghi nhiều khả năng là đặc tính riêng của công cụ
   automation này (không sinh đủ `pointermove` hoặc thiếu `buttons:1`), KHÔNG chắc đây có phản ánh
   hành vi chuột thật/cảm ứng thật hay không — về lý thuyết trình duyệt luôn tự sinh PointerEvent
   từ input chuột thật giống hệt cách tôi dispatch tay, nhưng chưa có cách xác nhận 100% trong
   phiên này (không có chuột vật lý để thử).
4. Chưa verify riêng trên màn cảm ứng (`(hover:none) and (pointer:coarse)`) — tay nắm có đạt đúng
   44px thay vì 32px hay không chỉ được ĐỌC từ code (`tapPx()` đọc `getComputedStyle`), chưa đổi
   viewport sang chế độ cảm ứng để tự mắt thấy số đổi.

## ⑦c HẠN DÙNG KẾT LUẬN

- Kết luận "`detectLineSegments()` có bug, Bậc 4 không kích hoạt được" **hết đúng khi**: có ai đó
  sửa hàm này (dòng `:605-611`) hoặc thêm/đổi tham số `magThreshold`/pipeline dò cạnh — lúc đó
  phải chạy lại debug script tương tự (không còn trong repo, đã xoá theo luật dọn file tạm) để
  xác nhận lại trước khi tin.
- Kết luận "ảnh nghiệm thu không lưu được" **hết đúng khi**: phiên sau chạy trong môi trường có
  quyền Accessibility/Screen Recording đã cấp, hoặc harness đổi cách trả ảnh có kèm đường dẫn file.
- Kết luận "`left_click_drag` không hoạt động cho tay nắm nhỏ" **hết đúng khi**: thử lại với tay
  nắm cỡ lớn hơn, hoặc bản cập nhật khác của Browser pane tool.

## ⑧ DÂY MÁY

Entry `duong-chan-troi-sua-tay` — **KHÔNG tự ghi**, để T mở theo luật phiếu.
Đề xuất thêm cho T (không tự mở): entry riêng cho bug `detectLineSegments()` Hough
normal/tangent-angle — file:dòng `lib/vision/single-view-metrology.ts:605-611`.
