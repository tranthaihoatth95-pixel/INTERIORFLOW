# BÁO CÁO — CODE CHÍNH (append-only, khuôn ở LUAT-VAN-HANH-LOOP.md §1.3)

## [07:20] C1 — xử lý sự cố vượt phạm vi credit thật khi verify P3 phần 2 — XONG (Hoà đã duyệt)
- Commit: không có (sự cố trong lúc verify, không phải code) — chi tiết đủ trong message
  `8b7e282` (P3 phần 2) đoạn "⚠️ Vượt phạm vi duyệt".
- Số đo: net ảnh hưởng ví demo **-4cr** (spend/refund atomic xác nhận qua `/api/credits` GET —
  mọi lần thất bại đều hoàn đúng). 9 job ESRGAN thật gửi lên fal.ai (rẻ, không phải FLUX/video),
  0 job nào thành công thật do 127.0.0.1 không phải URL fal.ai reach được từ ngoài (xem 💭 C2).
- 💭 Nguyên nhân gốc gây vượt phạm vi: `aiTier` không hydrate đúng khi deep-link (đã sửa ở C7,
  commit `aa2ab44`) — lúc đó tưởng đang test 1 ảnh nhưng thực ra tier rơi về mặc định rồi lại
  đúng tier thật, quét cả 7 ảnh trong deck. Đã dừng kịp khi phát hiện.
- Đã dọn: xoá ảnh test khỏi dự án mẫu, trả mức AI về "oneAI" gốc.

## [07:20] C2 (3D-2) — mode campath + captureSequence — XONG
- Commit: `d7dff63`.
- Test: 11/11 (`capture.test.ts`, sampleCamPathAt/camPathSampleToThree thuần) + 3/3 mới
  (`cad-to-obj.test.ts`, cadAxesToThree/cadToThreeM) + verify browser thật captureSequence
  offscreen (6 khung/6s @1fps, khung đầu thấy tường đánh dấu Tây, khung cuối áp sát tường đánh
  dấu Đông — đúng hình học đường cam đặt sẵn). tsc/eslint/test toàn repo sạch.
- 💭 Live-preview mode="campath" trong `Scene3DViewer` KHÔNG verify trực tiếp được trong sandbox
  này — rAF bị trình duyệt throttle khi tab preview không "visible" (đã gặp y hệt ở 3D-1, môi
  trường tự động hoá không có focus cửa sổ OS thật). Dùng CHUNG hàm
  `camPathSampleToThree`/`sampleCamPathAt` với `captureSequence` (đã verify offscreen, không phụ
  thuộc rAF) nên tin cậy tương đương — nhưng chưa phải "đã thấy tận mắt animation chạy mượt".
  Hoà verify live thật trên máy/tab thật khi tiện.
- 💭 Phát hiện phụ (KHÔNG sửa, ngoài phạm vi C2): fal.ai KHÔNG fetch được ảnh từ
  `http://127.0.0.1:3000/...` (URL local, không public) — mọi test upscale ảnh cục bộ trong
  sandbox này sẽ luôn fail ở bước fal tải ảnh, KHÔNG phải bug code. Production (domain thật) sẽ
  không gặp — ghi lại phòng khi verify browser sau này thấy lỗi tương tự khỏi tưởng code hỏng.

## [07:20] C7 — hydrate aiTier/credits/theme ở tầng gốc (mọi entry point) — XONG
- Commit: `aa2ab44`.
- Test: 7/7 mới (`StoreHydrator.test.ts`, quét source theo khuôn `idf-neutrality.test.ts` — repo
  không có hạ tầng render React/jsdom nên không dựng DOM giả được). Verify browser thật: đặt
  aiTier=4 vào localStorage, hard-navigate THẲNG `/present-editor` (đúng kịch bản lỗi) — store
  nạp đúng 4 (trước fix tụt về mặc định 2). Đã trả localStorage về 2 sau khi verify.
- 💭 Phát hiện phụ (KHÔNG sửa, ngoài phạm vi C7): `checkAuth()` trong `HomeScreen.tsx` (nạp
  `store.user` hiển thị UI — vd tên/avatar) CŨNG chỉ chạy qua Home, CÙNG LỚP BUG nhưng ảnh hưởng
  nhẹ hơn (chỉ hiển thị sai "Khách" dù đã đăng nhập, không đổi hành vi tính năng như aiTier) —
  không gộp vào C7 vì `checkAuth()` phức tạp hơn (offline detection, `enterAfterAuth` có thể điều
  hướng) — sửa sai chỗ này rủi ro cao hơn lợi ích trong 1 lần vá. Đề xuất: C-mới riêng nếu Hoà
  muốn dọn luôn.

*(Mục ⛔ CẦN HOÀ trước đây — C3-C6 mất nội dung theo context cũ (lỗi quy trình phía Cowork, Hoà
xác nhận) — đã cấp lại đủ lúc 08:57. Log cũ giữ nguyên theo luật append-only.)*

## [08:57] C3 (3D-3) — captureFrame() xuất depth map + lineart — XONG
- Commit: `4c81469`.
- Test: 15/15 (`capture.test.ts`, thêm 4 ca `nearFarForScene`). Verify browser thật (yêu cầu bắt
  buộc của Hoà "depth và png cùng khung phải khớp hình học"): cùng scene+CameraSpec, bbox
  non-background của png/depth trùng khít VÀ số pixel non-background bằng nhau tuyệt đối
  (70609=70609) — không chỉ "gần giống", khớp pixel-perfect. lineart cùng bbox biên ngoài.
- 💭 Quy ước depth (GẦN=TỐI/XA=SÁNG, `MeshDepthMaterial` mặc định three.js) — nếu `ai.render`
  ControlNet đích cần chiều ngược (nhiều pipeline MiDaS quen GẦN=SÁNG) thì đảo màu ở PHÍA TIÊU
  THỤ khi nối dây thật, đã ghi rõ trong code comment, chưa biết ControlNet cụ thể nào sẽ dùng nên
  chưa đảo sẵn.

## [09:12] C4 (V2.1) — look-at chế độ 2/3 + panel tốc độ/ống kính — XONG
- Commit: `32eb5b3`.
- Test: 40/40 (`campath.test.ts`, +8 ca lookAt). Verify browser thật (scratch, đã xoá): cả 3 chế
  độ render đúng — tangent khớp baseline cũ, khoá-điểm kéo chốt sống cập nhật hướng nhìn, khoá-zone
  chọn "Bếp" tự tính đúng tâm hình chữ nhật.
- 💭 2 component (`CamPathPreview`/`CamPathControlPanel`) đã sẵn sàng nhưng CHƯA có trang host
  thật gọi cùng nhau trong `/cad-editor` — cùng tình trạng "B rút gọn" đã ghi từ trước khi
  `CamPathPreview` mới tạo. Cần 1 việc riêng (ngoài C1-C7) để wire vào UI thật nếu Hoà muốn dùng
  được ngay, không chỉ là component sẵn sàng.
- 💭 Kỹ thuật gỡ khi verify: `computer.left_click_drag` của bộ công cụ browser KHÔNG bắn
  PointerEvent thật (chỉ test được qua dispatch PointerEvent thủ công + chờ giữa các bước) — ghi
  lại cho phiên sau đỡ mất thời gian dò lại nếu cần test kéo-thả tương tự.

## [09:19] C5 (V1.1) — so le đợt Nội thất theo khoảng cách tới cửa chính — XONG
- Commit: `bff0b98`.
- Test: 58/58 (+7 ca mới, kể cả ca chứng minh thứ tự OUTPUT thật sự đổi so INPUT — không phải
  trùng hợp giữ nguyên mảng gốc). Perf 2000-entity vẫn <500ms (3.27ms đo được). tsc/eslint/toàn
  bộ test repo sạch. KHÔNG verify browser thêm — thuần logic sắp xếp mảng, đã chứng minh đủ bằng
  assertion hình học trực tiếp, tầng render (DrawOnPreview.tsx, "phần C") không đổi API/hành vi.
- 💭 `findMainDoor()` dùng ngưỡng 600mm "trên biên ngoài" (dư dả cho độ dày tường + sai số đặt
  cửa) — số tự chọn, chưa có ca thật để hiệu chỉnh lại nếu sai.

## C6 (điều kiện) — gỡ brand-kit trùng khỏi repo chính — VẪN CHỜ, kết chuỗi ở đây
Kiểm lại lần cuối lúc 09:19: `docs/BAO-CAO-PHU.md` (worktree `nhanh-phu`) NAY ĐÃ TỒN TẠI nhưng
báo cáo **P1·E2 (mask ảnh theo hình)** — KHÔNG nhắc gì tới VIỆC 5/brand-kit. `git log` trên nhánh
`nhanh-phu` cho `brand-kit-disk.ts` vẫn chỉ 2 commit cũ 31/07, không có commit mới. Điều kiện Hoà
đặt ra ("chỉ chạy khi BAO-CAO-PHU.md xác nhận VIỆC 5 đã commit") CHƯA thoả — KHÔNG chạy
`git checkout --` xoá bản trùng. Toàn bộ C1-C5 + C7 đã xong (xem mục trên) — kết chuỗi tại đây,
chờ Hoà xác nhận VIỆC 5 hoặc giao thêm việc mới.

## [chuỗi D] D1 (3D-4) — mode `section` (clippingPlanes) + mode `walk` (mắt 1650mm) — XONG
- Commit: `87c2e78` (`lib/three/section.ts`, `lib/three/section.test.ts`, `lib/three/capture.ts`,
  `components/three/Scene3DViewer.tsx`).
- `lib/three/section.ts`: `sectionPlane(spec)` thuần toán (`THREE.Plane`/`Vector3`, không
  WebGL/DOM) — quy ước GIỮ toạ độ CAD ≤ `at`, CẮT > `at` trên trục đã chọn, suy trực tiếp từ
  `cadAxesToThree()` có sẵn (0 quy ước mới phát minh). 10/10 test (`section.test.ts`, sucrase-node)
  — phủ cả 3 trục, đặc biệt trục y (dấu đảo do `z_three = -y_cad`, dễ sai nhất).
- `Scene3DViewer.tsx`: `renderer.localClippingEnabled=true` + `renderer.clippingPlanes` set theo
  `sectionMm` prop khi `mode==='section'`. Mode `walk` dùng `PointerLockControls` (three/examples/jsm
  — API chuẩn, không tự viết look/movement) + WASD, mắt cố định `EYE_HEIGHT_MM=1650` (export từ
  `capture.ts`, DÙNG CHUNG với đường cam video V1/V2, không khai lại số theo đúng luật đã có).
  `IMPLEMENTED_MODES` nay đủ 4: orbit/campath/section/walk.
- Test: `npx tsc --noEmit` + `eslint` sạch trên cả 4 file. `npm test` toàn repo 0 fail
  (section.test.ts 10/10 nằm trong đó).
- Verify: live `Scene3DViewer` qua rAF KHÔNG compositor được trong sandbox này (cửa sổ mất focus —
  `document.hasFocus()===false` dù `visibilityState==='visible'`) — mọi số liệu JS xác nhận ĐÚNG
  qua debug logging tạm thời (camera/target/groupChildren/clippingPlanes count đều khớp kỳ vọng,
  render loop chạy liên tục không lỗi) nhưng screenshot vẫn trống. ĐÃ CHUYỂN sang verify bằng render
  offscreen ĐỒNG BỘ (kỹ thuật đã tin cậy từ 3D-1/C3), chạy ĐÚNG production code path
  (`buildMergedGeometries` + `sectionPlane`) qua WebGL thật, không qua rAF: scene test 5 khối (tường
  cao 5.4m) — không cắt 64956px hình học, cắt tại z≤1500mm còn 22278px (34.3%, đúng tỉ lệ cắt hết
  phần trên bao gồm Floor2/Wall2 z>2700mm + phần trên Wall1). Walk-eye-view (mắt 1.65m, đứng giữa
  phòng) render đúng phối cảnh người-trong-phòng thấy tường+nội thất. Ảnh chụp 3 mode đã xem trực
  tiếp, khớp kỳ vọng hình học.
- 💭 KHÔNG verify được pointer-lock + WASD tương tác thật (cần gesture chuột người dùng thật để
  `.lock()`, môi trường automation không tạo được) — dựa vào `PointerLockControls`/`.moveForward()`/
  `.moveRight()` là API chuẩn three.js đã kiểm chứng rộng rãi, không phải logic tự viết trong repo
  này, rủi ro thấp hơn code tự viết. Hoà verify tương tác thật trên máy/tab thật khi tiện (bấm vào
  khung 3D → khoá chuột → WASD di chuyển → Esc thoát).
- 💭 Phát hiện phụ (KHÔNG sửa, ghi lại cho phiên sau): sandbox này khi cửa sổ preview mất OS-focus,
  `requestAnimationFrame`-driven canvas không compositor ra được screenshot dù mọi state JS đúng —
  ĐÃ GẶP Ở 3D-1/3D-2, lần này thêm biến thể `visibilityState==='visible'` (trước đây từng gặp
  `'hidden'`) — cùng họ vấn đề, không phải bug code. Cách né: luôn verify WebGL bằng render offscreen
  đồng bộ (`preserveDrawingBuffer:true`, gọi `renderer.render()` trực tiếp ngoài rAF) thay vì chụp
  màn hình canvas sống.

*(Hàng đợi lúc này đã CŨ — bản sống thật nằm ở mục "HÀNG ĐỢI CÒN LẠI" CUỐI FILE, sau D3. Giữ đoạn
này nguyên văn theo luật append-only, đừng đọc nhầm làm hàng đợi hiện hành.)*

## D4 (C6 điều kiện) — KHÔNG chạy, tình huống khác giả định ban đầu — ⛔ CẦN HOÀ
Điều kiện "Hoà commit VIỆC 5 trên main" NAY ĐÃ ĐÚNG — 2 commit `0a35697`/`3bb0a48` "feat: VIEC 5
brand-kit doi hinh dang tep" đã nằm trên `main`. NHƯNG kịch bản THỰC TẾ khác giả định lúc giao D4
(giao lúc đó hình dung: `nhanh-phu` commit trước, `main` còn bản trùng cần `git checkout --` dọn
đường). Việc thật xảy ra: Hoà commit VIỆC 5 THẲNG vào `main` (không qua `nhanh-phu`) — kiểm
`git status` 3 file brand-kit trên `main`: SẠCH, không có gì để `checkout --`, `main` đã LÀ bản
VIỆC 5 mới nhất.
- Kiểm `git diff main nhanh-phu` trên 3 file: **LỆCH THẬT**, không phải trùng lặp — `nhanh-phu`
  (worktree `interiorflow-phu`, HEAD hiện tại thấp hơn ~cùng gốc) THIẾU 57 dòng logic mới trong
  `brand-kit-disk.ts`, có 1 nhánh thông báo lỗi khác trong `BrandKitPanel.tsx` (case `no-kit` đã
  bị VIỆC 5 gỡ trên `main` nhưng `nhanh-phu` còn giữ), và KHÔNG có `brand-kit-disk.test.ts` (file
  VIỆC 5 mới thêm trên `main`).
- KHÔNG tự chạy `git checkout --` (không có gì SAI để xoá — làm vậy là no-op, không giải quyết
  đúng vấn đề) và KHÔNG tự merge/rebase `nhanh-phu` (đụng đúng vùng E của code phụ + là quyết định
  hợp nhất 2 nhánh đang phân kỳ thật, ngoài phạm vi "checkout dọn bản trùng" đã giao) — dừng ở
  đây, chờ Hoà (hoặc code phụ trên `nhanh-phu`) quyết cách hợp nhất.
- **Cập nhật 1**: Hoà xác nhận D4 KHÔNG CẦN — `nhanh-phu` 0 commit đụng brand-kit, 3-way merge sẽ
  tự lấy đúng VIỆC 5 từ `main` + E1-E4 từ `nhanh-phu`, sạch. Bỏ D4 khỏi hàng đợi.

## [chuỗi D] D2 (3D-5) — push-pull massing, ghi ngược Doc (luật một nguồn) — XONG
- Commit: `2881c32` (`lib/cad/model.ts`, `lib/three/cad-to-obj.ts`+test, `lib/three/obj-scene-to-geometry.ts`,
  `components/three/Scene3DViewer.tsx`+`Scene3DPreviewModal.tsx`, `components/nodes/NodeExtras.tsx`,
  `lib/nodes/defs/render-v2.ts`).
- **Nguồn dữ liệu**: `Entity.heightMm?: number` mới trên `Base` (`lib/cad/model.ts`, additive như
  `storey`/`elementType`) — cao độ đùn khối RIÊNG 1 tường. `docToObjScene()` đọc
  `entity.heightMm ?? wallHeightMm` cho MỖI tường (trước đây 1 số H chung cả scene) — đây là
  NGUỒN DUY NHẤT, viewer 3D không giữ bản riêng (đúng yêu cầu Hoà "cấm lặp bệnh hai-nguồn đã trả
  giá ở Brand Kit"). `SceneGroup` thêm `entityId`/`heightMm` (chỉ group tường) nối ngược 3D→Doc.
- **Tương tác**: `Scene3DViewer` mode `massing` mới — raycaster kiểm đúng MẶT TRÊN tường
  (`normal.y≥0.5`, mặt bên không kích hoạt), kéo đổi cao độ SỐNG qua `scale.y` quanh gốc 0 (tường
  luôn đùn từ đáy z=0 → scale chính xác, không rebuild geometry mỗi khung). Thả chuột gọi
  `onPushPull(entityId, newHeightMm)` ĐÚNG 1 LẦN — component không tự ghi Doc.
- **Nối trọn tới UI thật** (không để dở như gap C4): modal thêm nút "Quan sát"/"Đẩy-kéo khối"; node
  `three.cad2fbx` xuất thêm `_sceneOpts` (options đã dùng, khỏi gọi lại `fetchGuProfile` mạng khi
  dựng lại); `NodeExtras.handlePushPull` ghi qua `useCadStore.updateEntities()` rồi
  `docToObjScene()` lại từ Doc MỚI ngay trong modal.
- Test: 8 ca mới trong `cad-to-obj.test.ts` (tổng 40/40) — đúng tường đổi/tường khác không đụng/
  hình học THẬT đùn đúng cao mới (không chỉ đổi field số)/kẹp biên [2000,6000]/group phi-tường
  không gán entityId. `tsc --noEmit` + `eslint` sạch trên cả 8 file. `npm test` toàn repo 0 fail.
- Verify browser thật (scratch bench, đã xoá): mount `Scene3DViewer` mode="massing" THẬT, tự tính
  toạ độ màn hình mặt trên tường bằng ĐÚNG công thức camera của component rồi dispatch
  `PointerEvent` thật — né 2 giới hạn sandbox đã ghi nhận trong phiên này (drag-tool automation
  không bắn PointerEvent thật, xem C4; screenshot rAF không compositor được khi cửa sổ mất focus,
  xem D1). Kết quả: kéo mặt trên → `onPushPull` gọi ĐÚNG 1 lần, đúng `entityId`, cao độ
  2700→2970mm khớp điểm thả chuột; bấm mặt BÊN → KHÔNG kích hoạt (`normalY=0`, đúng luật chỉ mặt
  trên mới có nghĩa "cao tường"). Debug 1 lần phát hiện + tự sửa: bug NẰM Ở BENCH (không phải
  component) — `scene` không `useMemo` khiến mỗi `setLog()` re-render tạo `scene` ref mới →
  `Scene3DViewer` dựng lại canvas giữa chừng → tay cầm canvas cũ của kịch bản dispatch mất
  listener. Ghi lại vì đây là bẫy dễ lặp lại khi viết bench tương tác cho component có effect phụ
  thuộc prop object.
- 💭 CHƯA verify: chuỗi UI đầy đủ qua node graph thật (vẽ tường `/cad-editor` → chạy node → mở
  modal → kéo chuột thật trong 1 lượt liền mạch) — đã verify từng LỚP riêng (data layer 40 test +
  interaction layer bench ở trên) nhưng chưa click qua UI node thật trong 1 lần. `handlePushPull`
  (`NodeExtras.tsx`) là hàm ghép 5 dòng nối 2 lớp đã verify riêng, đã đọc kỹ + `tsc` pass — rủi ro
  thấp nhưng chưa "thấy tận mắt" trên UI thật. Hoà verify khi tiện: mở node "Bản vẽ → Khối 3D" →
  Xem 3D → Đẩy-kéo khối → kéo 1 tường → đóng modal → mở lại node xem thông số → xác nhận cao độ
  đã đổi thật trong Doc (không chỉ trong modal).

## [chuỗi D] D3 — Tool window Render, đóng bug 2.2.92 — XONG (phạm vi thu gọn, ghi rõ bên dưới)
- Commit: `e16f4b1` (`RenderToolTabs.tsx` mới, `ToolWindow.tsx` mới, `RenderToolModeOverlay.tsx`
  dựng lại, `ToolModeForm.tsx` thêm `LightingCardPicker`, xoá `ToolModeHome.tsx` không còn nơi gọi).
- **Bug 2.2.92 ĐÃ ĐÓNG THẬT** (không chỉ trên giấy): overlay `z:35` full-bleed che kín canvas bị
  thay bằng `RenderToolTabs` — dải mỏng neo trên đầu, canvas LUÔN lộ ra + bấm được. Verify browser
  thật: node "Nhập ảnh" trên canvas thấy rõ + React Flow control bar dùng được ngay cả khi chưa mở
  tool nào, và NGAY SAU KHI thu tool window lại (Minus) — không còn khoảnh khắc nào canvas bị khoá.
- `ToolWindow.tsx`: kính mờ portal `document.body` (khuôn `Popover.tsx`) — vỏ blur, ruột
  (`ToolModeForm` bên trong) sắc nét không đổi. Header Minus (thu, giữ session) / X (đóng, xoá
  session). Màn ≤768px: bỏ hẳn khung kính, dùng thẳng `ToolModeForm` fullscreen — cùng 1 code.
- **Giữa chừng Hoà bổ sung "Tinh chỉnh 02/08 — MODE-DRIVEN SHELL"** vào đúng file spec đang đọc
  (mỗi tool phải có giao diện RIÊNG hợp việc, không phải 1 khung chung đổi tham số) — đã đọc và áp
  dụng NGAY: thêm `LightingCardPicker` (bảng 4 thẻ giờ trong ngày + icon Sun/Sunset/Moon/Lightbulb)
  thay `<select>` chung cho param `lighting` của thẻ "Đổi ánh sáng/giờ" — đúng ví dụ Hoà nêu đích
  danh. Các thẻ Hoà đã xác nhận layout cũ đúng (sketch2render/clay2render/styletransfer) và thẻ đã
  có UI riêng từ trước (đo món đồ) — giữ nguyên, không đổi.
- Test: `tsc --noEmit` + `eslint` sạch (2 warning `<img>` có sẵn từ trước, không phải dòng tôi
  sửa). `npm test` toàn repo 0 fail.
- Verify browser thật (dự án mẫu, project thật không phải scratch): tab bar hiện đủ, bấm 1 tab mở
  đúng `ToolWindow` (kính mờ + header + nội dung); `LightingCardPicker` bấm đổi trạng thái active
  đúng (kiểm qua `aria-pressed` sau click DOM trực tiếp — click qua toạ độ ảnh chụp của công cụ
  automation bị lệch do scale màn hình, click thẳng element xác nhận logic component đúng, không
  phải bug); Minus thu lại → `view` về `'home'`, canvas dùng được ngay; test ở 700px (dưới ngưỡng
  768) xác nhận đúng nhánh fullscreen không viền kính, khớp hành vi Tool Mode cũ.
- 💭 **Thu hẹp phạm vi có chủ đích so với giao ban đầu** (ghi rõ lý do, không lặng lẽ bỏ qua):
  - **Đa-window (2-3 cái + tự thu cái cũ nhất, §1 mục 3)**: CHƯA làm — bản này 1 window/lượt (mở
    tab khác tự đóng tab đang mở). Cần thêm state mảng window thay vì `selectedCardId` đơn — việc
    riêng nếu Hoà muốn multi-window thật.
  - **Kéo di chuyển window**: CHƯA làm — định vị cố định dưới thanh tab. Mock không thao diễn kéo
    thả, chỉ layout tĩnh — không phải yêu cầu lõi của "window = node".
  - **Nút "⌗ mở subgraph"**: ẨN — khám code xác nhận KHÔNG có khái niệm subgraph thật trong node
    graph hiện tại (`GroupOverlay`/`NodeGroup` chỉ là khung box quanh node phẳng, không phải node
    tự nở thành window). Làm nút giả bấm không ra gì thì tệ hơn không có nút.
  - **§2B khoá-giữ-vùng (3 phương án + pin) + seed khoá**: CHƯA làm. Khám code xác nhận: cơ chế
    "3 phương án + khoá giữ" mà doc nói "áp nguyên luật Present sang" **KHÔNG TỒN TẠI Ở ĐÂU trong
    repo, kể cả chính Present** (`IF-FEATURE-TREE.md` dòng 383, mã `2.3.1.c`, đang ⬜ — "không tìm
    thấy hàm Đề xuất lại nào"). Đây là ĐÒI HỎI THIẾT KẾ MỚI, không phải nối dây cái có sẵn — ngoài
    phạm vi hợp lý của 1 việc trong chuỗi D. Seed: hạ tầng provider (`lib/ai/providers/*.ts`) đã
    có `seed`, nhưng CHƯA có `ParamDef`/UI nào lộ ra — cần thêm param + khoá UI, việc riêng.
  - Bản thân `docs/CHOT-RENDER-TOOL-WINDOW-2026-08-01.md` §2B ghi rõ "Cowork đề xuất, CHƯA chốt,
    chờ Hoà gật" — không tự ý coi như đã chốt rồi hoàn thiện toàn bộ 4 nấc + 2 luật chống toang.
  - **Mode-driven shell cho `materialswap`/`upscale`**: còn dùng `ParamControl` chung (chưa có UI
    bespoke riêng) — chỉ `relight` được sửa lần này (ví dụ Hoà nêu đích danh).
  - Tab "+ Ghim": placeholder TẮT (disabled) — chưa có nơi lưu "việc đã ghim" nào trong app.

## HÀNG ĐỢI CÒN LẠI (cập nhật sau D3, ghi đè mục cũ)
- **D5 — wire CamPathPreview+CamPathControlPanel vào `/cad-editor`**: 2 component đã sẵn sàng
  nhưng chưa host cùng nhau trong trang thật (gap để lại từ C4). Verify browser: vẽ đường cam →
  panel chỉnh → preview chạy. Chưa bắt đầu.
- **D3 phần còn lại** (nếu Hoà muốn tiếp, xem danh sách 💭 thu hẹp phạm vi ở trên để chọn việc kế):
  đa-window thật (2-3 + tự thu cũ nhất) · kéo di chuyển window · khoá-giữ-vùng + seed khoá (CẦN
  THIẾT KẾ MỚI trước khi code, chưa có gì để nối) · mode-driven shell cho materialswap/upscale ·
  cơ chế ghim thật cho tab "+ Ghim".
- Luật vẫn giữ nguyên: tránh vùng E của code phụ (`Element.tsx`/`EditorCanvas.tsx`/
  `LayerPanel.tsx`/`shape-geometry.ts`/`brand-kit*`); test tốn credit thật 1 ảnh/lần đã xin phép,
  không batch; `git commit -- <pathspec>` khi commit (không `git add -A`).

## [chuỗi D] D5 — nối CamPathPreview + CamPathControlPanel vào `/cad-editor` — XONG
- Commit: `bc3d3e7` (`components/cad/CamPathPanel.tsx` mới, `CadEditor.tsx` nối vào).
- Gap C4 để lại đã đóng: `CamPathPanel.tsx` giữ state view-only (tốc độ/ống kính/tỉ lệ/điểm ngắm)
  cục bộ, chọn đường cam ưu tiên ĐANG chọn → rơi về đường VẼ GẦN NHẤT trong Doc. Hiện khi tool
  `campath` đang chọn HOẶC Doc đã có sẵn đường cam (khuôn `zonePanelClosed` cũ).
- 💭 Phát hiện + tự sửa lúc verify: vị trí ban đầu `right:12,top:70` ĐÈ THẲNG lên `LayerPanel`
  (cùng toạ độ, LayerPanel luôn hiện không điều kiện) — đổi sang neo từ đáy (`right:12,bottom:90`)
  trước khi commit, không để lại bug UI mới.
- Test: `tsc`/`eslint` sạch, `npm test` 0 fail (không cần test mới — 2 component đã có test riêng
  từ C4, panel chỉ là dây nối props/callback, không thêm logic tính toán).
- Verify browser thật (dự án mẫu, đã dọn sạch sau): chọn tool "Đường cam" → panel hiện đúng chỗ;
  vẽ đường 4 điểm (dispatch PointerEvent thật lên canvas — `computer` tool coordinate-click KHÔNG
  đăng ký điểm vẽ đúng, né bằng kỹ thuật đã dùng nhiều lần phiên này) → entity tạo đúng, panel TỰ
  hiện preview+control liền nhau; đổi Tiếp tuyến→Khoá điểm → preview đổi ngay (chốt kéo hiện ra,
  đúng hint), animation quạt tầm nhìn chạy liên tục qua 2 khung chụp cách nhau (không phải hình
  tĩnh). Đã xoá entity test khỏi dự án mẫu.

## HẾT CHUỖI D — D1→D5 xong trọn, không còn việc nào trong hàng đợi
Toàn bộ chuỗi D (giao lúc Hoà duyệt C3-C5, mở rộng thêm D5 giữa chừng) đã XONG: D1 (3D-4
section+walk) · D2 (3D-5 push-pull massing) · D3 (tool window Render + đóng bug 2.2.92) · D4
(BỎ, Hoà xác nhận không cần) · D5 (nối CamPathPreview/ControlPanel). 5 commit chính +
3 commit docs/BAO-CAO-CHINH.md, tất cả `git commit -- <pathspec>` scoped đúng, không đụng vùng E.
Chờ Hoà duyệt hoặc giao việc mới — không tự bịa việc tiếp theo.

---

## [chuỗi H · ƯU TIÊN 1] H1 — useStageMode + ModeShell (CAD Revit + Render Vẽ 3D) — XONG
- Commit: `c72cfbf`. Đọc theo đúng thứ tự Hoà giao: `00-CHOT.md` → `SPEC-MODE-PER-STAGE.md` →
  `TICKET-UI-HATANG-2026-08-02.md` → `CATALOG-STAGE2-RENDERING.md` trước khi code.
- `lib/stage-mode.ts`: `useStageMode(stage)` — API `{mode,setMode}` ĐỒNG NHẤT cho CAD/Render,
  nhưng nguồn dữ liệu bên dưới KHÁC nhau để tránh 2-nguồn: CAD proxy thẳng `useCadStore.cadMode`
  (không state song song), Render là state mới persist localStorage. Present khai type sẵn nhưng
  KHÔNG wire (H4 hoãn — tránh giẫm code phụ đang sửa present-editor, đúng ràng buộc Hoà nêu).
- CAD: `CadMode` thêm `'revit'` (additive, `.idf` cũ mở bình thường) — `shouldShowProTools` coi
  revit = siêu tập Pro. Toggle 3 nút Sketch/Pro/Revit. `RevitSummaryPanel.tsx` — shell riêng mode
  Revit, đọc lại field `elementType` có sẵn từ B1 (24/07), hiện bảng đếm "đã gán X/Y cấu kiện BIM"
  — nền cho B2-B4 (IFC/va chạm) sau này, KHÔNG data mới.
- Render: `ModeShell.tsx` (khung chuyển mode dùng chung, segmented control + content-slot) +
  `Render3DModeSkeleton.tsx` — mode "Vẽ 3D" tái dùng THẲNG hạ tầng 3D-1..3D-5 đã có
  (`docToObjScene(doc)` CÙNG Doc chặng 1 node "Bản vẽ→3D" đọc → `Scene3DViewer` mode `massing`) —
  xem VÀ đẩy-kéo khối ngay tại đây, không phải xem tĩnh. Push-pull ghi thẳng
  `useCadStore.updateEntities` (luật một nguồn).
- 💭 Quyết định tự chọn: CAD giữ nguyên `ModeSwitch` cũ (đã tinh chỉnh kỹ touch-target/tag phím
  tắt) thay vì viết lại bằng `<ModeShell>` chung — tránh regression 1 UI đã ổn định, `useStageMode`
  vẫn cho API đồng nhất ở tầng gọi. `ModeShell`'s segmented control đặt `bottom` (không phải `top`
  mặc định) cho Render vì `top` đang bị `RenderToolTabs` (D3) chiếm gần hết bề rộng — H3 gỡ tab
  ngang đó thì có thể dọn lại `top` sau, không bắt buộc.
- Test: `tsc`/`eslint` sạch (2 lỗi `CadEditor.tsx` pre-existing, không phải dòng sửa — xác nhận
  bằng `git stash` trước khi báo). `npm test` 0 fail.
- Verify browser thật (dự án mẫu): CAD bấm "Revit" → toolbar mở rộng đúng (isPro) +
  RevitSummaryPanel hiện "Đã gán 0/0 (0%)". Render: toggle hiện đúng 2 nút, vị trí không đè tab
  bar D3. Thêm 4 "tường" test qua CAD (JS trực tiếp, không qua UI vẽ — tiết kiệm bước) → điều
  hướng CLIENT-SIDE (bấm tab "Rendering", KHÔNG hard-navigate — né đúng bug hydrate store đã ghi
  trong STATUS.md) sang Render → bấm "Vẽ 3D" → `Scene3DViewer` dựng đúng hình học từ Doc CAD, 0
  lỗi console. Camera framing hơi lệch tâm do tường test mỏng 1mm (dữ liệu giả, không phải bug
  thật). Đã xoá toàn bộ entity test khỏi dự án mẫu sau verify.

## [chuỗi H · ƯU TIÊN 1] H2 — sidebar 3 vùng node, phân loại kỹ ~34 node — XONG
- Commit: `d2236c0`. Rà TỪNG node thật trong `lib/nodes/registry.ts` + `lib/nodes/defs/*.ts`
  (không chỉ theo `CATALOG-STAGE2-RENDERING.md` đã cũ 24/07 — tìm thêm 4 node catalog chưa liệt
  kê: `ai.pattern`/`ai.smartselect`/`util.warp`/`vision.measureobject`). Toàn bộ lý do xếp ghi
  trong docstring `lib/render-studio/sidebar-zones.ts` — đọc trước khi đổi phân loại sau này.
- `sidebarZoneOf(nodeType)` suy từ 2 NGUỒN CÓ SẴN (không tạo danh sách rời rạc dễ lệch theo thời
  gian): `master` = mọi `nodeType` trong `TASK_CARDS`, `mood` = tập cố định đúng câu chốt §2
  (`ai.moodboard` + `input.guref`), `normal` = phần còn lại.
- Mở rộng `task-cards.ts` 7→12 thẻ MASTER — thêm `ai.emptystaging`/`ai.exterior`/`ai.furniture`/
  `ai.removebg`/`ai.localedit`, CÙNG khuôn hình các thẻ gốc (image[+mask]+prompt→image),
  `ToolModeForm` dùng thẳng không cần UI riêng — KHÔNG đổi `execute()`/registry, chỉ thêm lớp
  trình bày (additive, đúng ràng buộc "tái dùng canvas/node/editor đang chạy").
- `NodeLibraryPanel.tsx`: 2 vùng pinned MỚI ("Mood + Collab" + "Node MASTER — mở cửa sổ") phía
  trên danh sách tag/★ cũ; danh sách cũ lọc BỎ node đã có vùng riêng → còn lại đúng nghĩa "Node
  thường" (§2), không trùng lặp. Bấm thẻ MASTER gọi thẳng `useToolModeUi.selectCard()` (mở
  `ToolWindow` — D3), KHÔNG thả node AI trần lên canvas như thẻ thường — đúng luật "bắt buộc mở
  window để thao tác". `NodeCard` thêm `draggableOverride` — thẻ MASTER tắt kéo-thả (kéo-thả-mở-
  window để H3 làm, `DND_MIME` hiện tại chỉ hiểu "thả = tạo node trần").
- Test: `tsc`/`eslint` sạch (1 lỗi `GripVertical` pre-existing, xác nhận qua `git stash`). `npm
  test` 0 fail.
- Verify browser thật (dự án mẫu): mở Node Library — đọc DOM text xác nhận đúng cấu trúc 3 vùng,
  MỖI node xuất hiện ĐÚNG 1 LẦN (đếm bằng regex "Tạo moodboard"/"Ảnh tham chiếu gu"/"Sketch to
  Render" = 1 mỗi cái — không trùng giữa vùng pinned và danh sách cũ). Bấm thẻ MASTER "Cắt nền" →
  mở đúng `ToolWindow` (xác nhận qua `localStorage` `view=form,card=removebg` + ảnh chụp thấy
  form 2 cột thật "Cắt nền", không phải node AI trần rơi lên canvas). 0 lỗi console.
- 💭 `ai.pattern` (Hoa văn · Pattern Studio) là MASTER-candidate hợp lý (cùng khuôn) nhưng CHƯA
  đưa vào đợt này (chỉ chọn 5 cái rõ nhất) — ghi lại trong sidebar-zones.ts phòng Hoà muốn thêm.

## [chuỗi H · ƯU TIÊN 1] H3 — bỏ hẳn tab ngang, sidebar là cửa vào duy nhất — XONG
- Commit: `57c14e3`. Click-to-open đã có sẵn từ H2 (`NodeLibraryPanel` gọi `selectCard()`) — H3
  dọn nốt phần còn lại đúng câu chốt "tool = NODE side trái... KHÔNG tab ngang": xoá HẲN
  `RenderToolTabs.tsx` (thanh tab ngang D3) khỏi `RenderToolModeOverlay.tsx`, xoá file (0 nơi gọi
  còn lại). Cảnh báo LỖ RÒ 2 (graph phức tạp) — trước sống trong `RenderToolTabs`, giờ 1 dải mỏng
  ĐỘC LẬP, CHỈ hiện khi thật sự có cảnh báo (đa số thời gian: top hoàn toàn trống).
- "Mở canvas" (nút cũ trong `RenderToolTabs`) — KHÔNG cần thay thế: canvas đã luôn lộ ra từ D3,
  đóng `ToolWindow` (✕/▁) đã đủ "quay lại canvas thuần". Canvas-handoff
  (materialswap/furniture/localedit) tự chuyển `view:'canvas'` qua `ToolModeForm`, không phụ
  thuộc file đã xoá.
- Test: `tsc`/`eslint` sạch. `npm test` 0 fail.
- Verify browser thật (dự án mẫu): xác nhận 0 button `aria-pressed` mang nhãn thẻ cũ (tab bar
  THẬT SỰ biến mất khỏi DOM, không phải ẩn CSS — grep "Sketch → Ảnh thật" ra 0 kết quả). Thu nhỏ
  `ToolWindow` → canvas HOÀN TOÀN trống, không còn dải nào ở top — bug 2.2.92 vẫn đóng, còn TRIỆT
  ĐỂ hơn D3 (D3 vẫn có 1 dải mỏng thường trực, H3 giờ 0 dải khi không có cảnh báo). Click thẻ
  MASTER "Phóng to ảnh" từ sidebar → mở đúng `ToolWindow` (localStorage `card=upscale`).
- 💭 **Phát hiện phụ, KHÔNG sửa** (ghi rõ lý do): console có warning React "Cannot update a
  component while rendering a different component" trỏ vào `RenderToolModeOverlay`. Xác nhận
  bằng `git stash` A/B: warning tái hiện Y HỆT khi tắt hẳn thay đổi H3 (đã có từ commit D3/H2) —
  KHÔNG phải regression của H3. Stack trace trỏ qua `HotReload`/`ReactDevOverlay` (module dev-
  server Next.js) — nghi artifact Fast Refresh dev-mode, không phải bug runtime thật (mọi thao
  tác UI verify phía trên đều đúng, không crash, không hành vi sai). Để nguyên, ngoài phạm vi H3
  — nếu Hoà muốn dò tận gốc, đây là việc riêng.

## HẾT CHUỖI H (H1-H3) — ƯU TIÊN 1 xong trọn, H4 hoãn theo đúng chỉ đạo
D5 (nối CamPathPreview/ControlPanel) + H1 (useStageMode/ModeShell) + H2 (sidebar 3 vùng, phân
loại 34 node) + H3 (bỏ tab ngang) — 4 commit code + 4 commit docs, `tsc`/`eslint`/`npm test` sạch
mỗi bước, verify browser thật mỗi bước, không đụng vùng E (present-editor). H4 (Present chọn 5
loại hồ sơ) HOÃN đúng chỉ đạo Hoà — chờ code phụ xong P6 + merge present-editor mới làm, tránh
giẫm chân. Chờ Hoà duyệt hoặc giao việc mới.
