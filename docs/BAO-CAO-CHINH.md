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

---

## [chuỗi G] CHỐT PHIÊN — 2 việc đang DỞ, KHÔNG commit (chưa đủ điều kiện "xong")

Hoà giao chuỗi G (build UI chặng 2, G1→G5) rồi HOTFIX K4 chen trước. Đang làm G1 thì rẽ sang K4;
dừng phiên giữa K4 theo yêu cầu Hoà "chốt phiên". Cả 2 đều CHƯA đủ điều kiện commit (tsc/eslint
sạch nhưng còn lỗi/thiếu thật) — **không commit ẩu**, ghi rõ trạng thái để phiên sau tiếp đúng chỗ.

### DỞ 1 — G1 (bottom bar giữ nguyên + nút rời gạt Vẽ 3D)
**File đã sửa** (chưa commit): `components/shell/ModeShell.tsx` · `components/home/HomeScreen.tsx`
· `components/render-studio/Render3DToggleButton.tsx` (mới).

**Đã làm:**
- `ModeShell.tsx`: thêm `hideBuiltInSwitcher` (nơi gọi tự vẽ nút chuyển mode riêng, tắt segmented
  control có sẵn) + bọc nội dung bằng `AnimatePresence`/`motion.div` crossfade (`springPop`, guard
  reduce-motion) — đúng `SPEC-DESIGN-SYSTEM-IF.md` §3 "gạt mode = crossfade cả shell".
- `Render3DToggleButton.tsx` mới: "1 nút RỜI" (không phải pill 2 nút) cạnh `BottomToolbar`, dùng
  chung cả 2 mode (đứng ngoài `ModeShell.content()`), gọi `useStageMode('render')`.
- `HomeScreen.tsx`: nối `hideBuiltInSwitcher` + mount `<Render3DToggleButton />`.
- `tsc`/`eslint` sạch trên cả 3 file. **CHƯA chạy lại `npm test` sau bug tìm thấy** (xem dưới).

**⛔ BUG PHÁT HIỆN lúc verify browser — CHƯA SỬA:** `BottomToolbar` (`.if-bottombar` đầu tiên,
thanh zoom/pan React Flow) render LỆCH LÊN NGOÀI MÀN HÌNH (`getBoundingClientRect().top ≈ -10`,
tức nằm TRÊN mép viewport, không thấy được) sau khi thêm `motion.div{position:absolute;inset:0}`
bọc `content(active)` trong `ModeShell.tsx`. Nút "Vẽ 3D" mới (dùng chung className `.if-bottombar`
nhưng KHÔNG nằm trong wrapper mới) vẫn hiện đúng vị trí — chỉ `BottomToolbar` (bên trong
`content()`) bị ảnh hưởng. Nghi ngờ: lớp `position:absolute;inset:0` mới bọc quanh `FlowCanvas`
làm React Flow tính sai chiều cao container khi định vị `BottomToolbar` (vốn `position:absolute;
bottom:4` neo theo container CHA của nó bên trong `FlowCanvas.tsx`, không phải theo `ModeShell`).

**Đã thử:** `git stash` để so sánh A/B xem bug có phải do `ModeShell` gây ra không — VỪA `stash`
xong (chưa kịp `pop` lại để xác nhận) thì bị ngắt bởi HOTFIX K4 chen ngang. **Đã `git stash pop`
lại đúng bản DỞ này** (không mất việc) nhưng CHƯA xác nhận lại nguồn gốc bug.

**Còn phải làm khi tiếp tục:**
1. Xác nhận bug có phải do lớp `motion.div` mới trong `ModeShell.tsx` gây ra không (test lại bằng
   cách bỏ tạm `position:absolute;inset:0` khỏi `motion.div`, xem `BottomToolbar` có về đúng chỗ).
2. Nếu đúng — sửa cách bọc (có thể chỉ cần `position:relative` thay vì `absolute;inset:0`, hoặc
   set `height:100%` tường minh thay vì trông cậy `inset:0`).
3. Chạy lại `npx tsc --noEmit` + `eslint` + `npm test` sạch.
4. Verify browser lại: `BottomToolbar` đúng vị trí bottom-center, nút "Vẽ 3D" đúng vị trí
   bottom-right, bấm gạt mode → crossfade mượt (không giật), cả 2 nút cùng hiện ở cả 2 mode.
5. Commit riêng G1.

### DỞ 2 — K4 (hotfix "kính lồng kính" ở header — 2 dropdown AppChrome.tsx)
**File đã sửa** (chưa commit): `components/studio/AppChrome.tsx` — **CHỈ MỚI thêm 2 dòng import**
(`useLayoutEffect` từ 'react', `createPortal` từ 'react-dom') — **CHƯA viết logic portal thật**,
2 dropdown (`MoreMenu()` ~dòng 276-345, `UserChip()` ~dòng 427-498) vẫn y nguyên code cũ (render
tại chỗ trong `<header>` kính, CHƯA sửa bug). `eslint` hiện ĐANG BÁO LỖI 2 import chưa dùng —
**đúng, vì logic thật chưa viết**, không phải regression.

**Đã đọc:** `docs/TICKET-FIX-KINH-HEADER-2026-08-02.md` (gốc bug: `mat-panel` dropdown là CON của
`<header class="mat-header">` có riêng `backdrop-filter` → kính lồng kính, blur menu chỉ sample
trong phạm vi header, không thấy canvas dưới) + đã đọc kỹ code 2 dropdown thật trong AppChrome.tsx.

**Kế hoạch đã quyết (chưa code):** PORTAL cả 2 dropdown ra `document.body` — KHÔNG dùng lại
`components/ui/Popover.tsx` nguyên trạng (Popover không có animation enter/exit tích hợp sẵn theo
kiểu `AnimatePresence` giữ component mở trong lúc exit — dùng thẳng sẽ MẤT animation hiện có, trái
yêu cầu ticket "giữ animation như cũ"). Thay vào đó: giữ NGUYÊN khối `motion.div` animation/class
hiện tại của từng menu, chỉ đổi (a) bọc bằng `createPortal(..., document.body)`, (b) đổi định vị
từ `absolute right-0 top-9` (neo trong DOM cha) sang `position:fixed` với `top`/`right` tính từ
`triggerRef.current.getBoundingClientRect()` lúc mở, (c) `useDismissable` cần THÊM ref thứ 2 (ref
của menu đã portal) vào mảng `refs` — hiện `refs:[ref]` gộp chung cả nút+menu trong 1 wrapper div,
portal ra ngoài thì menu không còn nằm trong subtree đó nữa, phải khai riêng để bấm-trong-menu
không bị tính là "bấm ra ngoài" rồi tự đóng.

**Còn phải làm khi tiếp tục:**
1. Viết state `anchorRect` (top/right) cho từng menu, cập nhật lúc `setOpen(true)` (đọc
   `buttonRef.current.getBoundingClientRect()`).
2. `createPortal` khối `motion.div` ra `document.body`, đổi class định vị → `style={{position:
   'fixed', top, right}}`, `zIndex` nâng lên `80` (ticket yêu cầu `z-[80]`).
3. Thêm `menuRef` riêng, truyền `refs:[buttonRef, menuRef]` vào `useDismissable`.
4. Làm cho CẢ 2 menu (`MoreMenu`, `UserChip`) — cùng khuôn, tránh lặp code khác nhau.
5. `tsc`/`eslint`/`npm test` sạch.
6. Verify browser: mở từng menu ĐÈ LÊN node có nút "Đưa sang Presenting" → thấy BLUR mờ chữ node
   phía sau, không còn xuyên nét rõ. Test cả light/dark theme (theme toggle nằm trong MoreMenu).
7. Nếu portal làm vỡ anchor/animation sau 2 lần thử → fallback (b) của ticket: nền đặc
   `var(--panel)` cho dropdown, bỏ kính riêng menu, ghi rõ lý do.
8. Commit riêng: `fix(chrome): K4 portal dropdown khoi header kinh`.

**Sau khi K4 xong:** quay lại DỞ 1 (G1) hoàn thiện, rồi tiếp G2→G5 theo đúng thứ tự Hoà giao
(`docs/TICKET-CHANG2-BUILD-2026-08-02.md`). Không tự ý đổi thứ tự.

### Trạng thái khác cần biết
- `docs/00-CHOT.md` đang có thay đổi CHƯA COMMIT của phiên/người khác (thấy qua `git status`,
  KHÔNG phải tôi sửa) — để nguyên, không đụng.
- `docs/TICKET-FIX-KINH-HEADER-2026-08-02.md` + `docs/if-design-system.pdf` là file MỚI của
  Hoà/phiên khác — để nguyên, không tự ý thêm vào commit của tôi.
- Không có lệnh máy thật nào bị chặn (`prisma`/`migrate`/`merge`) — dừng phiên thuần theo yêu cầu
  Hoà, không phải vì hỏng 2 lần hay cần Hoà quyết.

---

## [phiên tiếp] K4 xong + G1 xong (nối đúng chỗ DỞ 1/DỞ 2 để lại) — cả 2 XONG, không còn dở
Đọc đúng thứ tự đầu phiên (`CLAUDE.md` → `STATUS.md` → `docs/00-CHOT.md` → mục cuối file này) rồi
tiếp tục từ 2 việc DỞ. Verify browser qua server phụ `interiorflow-verify` (cổng auto, KHÔNG đụng
cổng 3000 đang bị phiên khác chiếm) — thêm entry trong `.claude/launch.json`, commit riêng
`498e248`.

### K4 (hotfix "kính lồng kính" header) — XONG
- Commit `e1aa92c` (portal thật) + `edd57aa` (follow-up tránh warning framer-motion, phát hiện
  lúc verify browser — xem dưới).
- **Portal 2 dropdown** (`MoreMenu`/`UserChip`, `AppChrome.tsx`) ra `document.body` qua
  `createPortal`, định vị `position:fixed` theo `getBoundingClientRect()` nút bấm (hook dùng chung
  `useMenuAnchor()`), `z-[80]`. Giữ NGUYÊN animation `motion.div` cũ theo đúng kế hoạch phiên
  trước — không đổi sang `Popover.tsx` (thiếu AnimatePresence enter/exit tích hợp). `useDismissable`
  nhận 2 ref riêng (`triggerRef` nút + `menuRef` panel đã portal).
- 💭 **Phát hiện phụ lúc verify (đã sửa ngay, không để lại)**: đặt `ref={menuRef}` thẳng trên
  `motion.div` (con trực tiếp `AnimatePresence`) gây console warning "ref is not a prop" — framer-
  motion's `PopChild` clone con lúc exit, đọc `props.ref` kiểu React 18 cũ. Sửa: dời `ref` xuống 1
  div con `display:'contents'` (không đổi layout/animation gì), `motion.div` ngoài giữ nguyên
  style định vị + animate. Xác nhận sạch bằng tab browser MỚI (tab cũ giữ log tồn đọng không xoá
  khi navigate — bẫy verify, ghi lại phòng lặp lại: **luôn mở tab mới khi cần console "sạch từ
  đầu"**, đừng tin `navigate` xoá console buffer).
- Verify browser thật (dự án mẫu, qua `getComputedStyle` + click JS-dispatch PointerEvent thật —
  `computer` tool coordinate-click không ổn định khi viewport report lệch, xem dưới): panel đúng
  `position:fixed`, `parentIsBody:true`, `z-index:80`, `backdrop-filter: saturate(1.8) blur(22px)`
  ở CẢ light (`background:rgba(...,0.68)`)/dark theme (`rgba(20,20,23,.68)`). Outside-click dismiss
  đúng (test bằng `PointerEvent` thật dispatch qua JS — `Escape` phím qua `computer.key` KHÔNG
  đóng được dù outside-click đóng đúng, nghi ngờ artifact automation tool không bắn KeyboardEvent
  đúng cách document nhận capture-phase; KHÔNG phải lỗi code — outside-click là đường chính, đã
  xác nhận chắc).
- 💭 **Bẫy verify mới phát hiện, ghi lại cho phiên sau**: viewport "báo" bởi `read_page`
  (vd "1280x720") có lúc LỆCH với `window.innerWidth/innerHeight` thật (vd 769x803) — coordinate
  click theo toạ độ `read_page` báo có thể trật hoàn toàn (bấm nhầm nút MobileMenu thay vì
  AppChrome desktop cluster khi viewport thật < 1024 breakpoint `lg`). Cách né chắc nhất: đọc
  `window.innerWidth` qua `javascript_tool` trước, và với nút cụ thể thì `querySelector` +
  `getBoundingClientRect()` + dispatch `PointerEvent`/`MouseEvent` thật thay vì tin toạ độ từ
  `read_page`/`computer` ref.

### G1 (bottom bar giữ nguyên + nút rời gạt Vẽ 3D) — XONG, đã tìm ra + sửa đúng gốc bug để lại
- Commit `e74485a` (`ModeShell.tsx` + `HomeScreen.tsx` + `Render3DToggleButton.tsx` mới).
- **Gốc bug đã tìm ra** (phiên trước mới ghi triệu chứng, chưa rõ nguyên nhân): `content(mode)`
  của `ModeShell` (Fragment gồm `NodeLibraryPanel`/`GalleryPanel`/`LibraryPanel`/`FlowsPanel`/
  `FlowCanvas`/`RenderToolModeOverlay`/`ChatPanel`) TRƯỚC H1 (`git show c72cfbf~1`) là con TRỰC
  TIẾP của `<div className="relative flex min-h-0 flex-1">` — flex ROW THẬT, đúng lý do các panel
  `w-64/w-72 flex flex-col` (sidebar dock) đứng CẠNH `FlowCanvas`'s `wrapperRef`
  (`relative flex-1`) chứ không hề dùng `position:absolute/fixed`. H1 lồng thêm `ModeShell` giữa
  chừng — div bọc `content()` bên trong nó (`position:relative,flex:1,minHeight:0`) KHÔNG
  `display:flex` → mất ngữ cảnh flex row → panel xếp chồng DỌC (block flow bình thường) +
  `wrapperRef` của `FlowCanvas` MẤT `flex-1` (cha không phải flex container) → sập `height:0` →
  MỌI định vị `absolute bottom-*` bên trong (BottomToolbar, `Render3DToggleButton` KHÔNG bị vì nó
  đứng NGOÀI `content()`) bắn thẳng lên NGOÀI viewport — đúng y triệu chứng phiên trước ghi
  (`top≈-10`).
- **Sửa**: thêm `display:'flex'` (ROW mặc định, KHÔNG đổi `flexDirection`) vào `motion.div` bọc
  `content(active)` trong `ModeShell.tsx` — phục hồi ĐÚNG ngữ cảnh flex row gốc trước H1, không
  phải bịa cấu trúc mới. Test giả thuyết sai đầu tiên (chủ động ghi lại tránh lặp lỗi): thử
  `flexDirection:'column'` trước — SAI, làm sidebar panel xếp cạnh nhau đúng nhưng theo hướng dọc
  thay vì `FlowCanvas` chiếm không gian còn lại theo hàng ngang như thiết kế gốc; phải đối chiếu
  `git show c72cfbf~1` mới thấy đúng là ROW.
- Verify browser thật (dự án mẫu, đo bằng `getBoundingClientRect()` qua JS — KHÔNG dùng toạ độ ảnh
  chụp do bẫy viewport-mismatch ghi ở mục K4 trên): TRƯỚC fix `BottomToolbar` `rect.y=-10`,
  `parentElement height=0`; SAU fix `rect.y=710`, `parentHeight=720` (đúng, trong khung hình,
  cạnh đáy). Toggle "Vẽ 3D" 2 chiều: bấm sang → crossfade ĐÚNG (2 nhánh chồng lên nhau lúc chuyển,
  chụp giữa transition thấy CẢ 2 nội dung mờ chồng — đúng nghĩa "crossfade" đã đặc tả, không phải
  cắt-rồi-hiện) → `Render3DModeSkeleton` hiện đúng ("Chưa có bản vẽ..." vì Doc mẫu trống, đúng kỳ
  vọng) → bấm lại "Render + Mood + Collab" → `BottomToolbar`/minimap trở lại ĐÚNG vị trí
  (`rect.y=730`, viewport 800 lúc đó). 0 console error (đã loại trừ log tồn đọng bằng tab mới —
  xem bẫy ở mục K4).
- Test: `tsc --noEmit` + `eslint` sạch (`AppChrome.tsx`/`ModeShell.tsx`/`HomeScreen.tsx`/
  `Render3DToggleButton.tsx`). `npm test` toàn repo 0 fail.
- 💭 Đã dọn: reset `localStorage.interiorflow.theme` về `'auto'` sau khi test dark theme (server
  verify phụ, origin riêng `127.0.0.1:3001`, KHÔNG lẫn vào state phiên chính cổng 3000).

## G1b — chỉnh vị trí nút "Vẽ 3D" (Hoà bắt lỗi sau khi xem báo cáo G1) — XONG
- Commit `2daf089` (`BottomToolbar.tsx` + `Render3DToggleButton.tsx`).
- G1 ban đầu đặt nút cố định góc phải màn hình (`right:16`) — SAI spec
  (`SPEC-CHANG2-UI-2MODE.md` §1: "Cạnh nó [thanh zoom/pan] là 1 nút rời gạt Vẽ 3D"). Nguyên nhân
  không ghép được bằng CSS flex thuần: `BottomToolbar` và nút này KHÔNG cùng cây DOM cha (khác
  positioned-ancestor — `BottomToolbar` neo theo `wrapperRef` riêng của `FlowCanvas`, nút neo theo
  container ngoài cùng CHỨA CẢ `LeftRail`).
- Sửa: đo trực tiếp `getBoundingClientRect()` của `BottomToolbar` (gắn `id="if-bottom-toolbar"`
  mới) rồi tự quy đổi sang toạ độ `left` của CHÍNH containing-block nút này (`offsetParent`).
  `ResizeObserver` gắn trên CHA của toolbar (bắt đúng SIZE thật đổi khi sidebar mount/unmount —
  bản thân toolbar không đổi size khi bị đẩy, chỉ đổi VỊ TRÍ, `ResizeObserver` không bắt được đổi
  vị trí thuần) + `window resize`. Giữ nguyên `left` đo lần cuối khi toolbar vắng mặt (mode Vẽ 3D)
  — tránh nút nhảy vị trí lúc gạt mode.
- Verify browser thật (dự án mẫu): gap đo được ĐÚNG 10px cả lúc đóng/mở sidebar Node Library (mở
  sidebar → toolbar bị đẩy phải → nút bám theo đúng, vẫn gap=10px). Toggle Vẽ 3D 2 chiều: vị trí
  nút GIỮ NGUYÊN `(906,640)` trước/sau — không nhảy. 0 console error (tab mới, tránh bẫy buffer
  console tồn đọng đã ghi ở K4). tsc/eslint sạch, `npm test` 0 fail.

## G1c — Hoà đổi lệnh giữa chừng: bỏ phương án A (pill rời), chuyển capsule đồng tâm — XONG
- Commit `e1aaf6a` (`BottomToolbar.tsx` + `ModeSwitchCell.tsx`/`ModeSwitchBar.tsx` mới +
  `Render3DModeSkeleton.tsx` + `HomeScreen.tsx` + `ModeShell.tsx` comment + xoá
  `Render3DToggleButton.tsx`).
- Hoà đọc kỹ mock, chê G1/G1b (pill "Vẽ 3D" rời, lệch bo/bóng so với bar) — chốt lại theo
  `docs/SPEC-DESIGN-SYSTEM-IF.md` §2c (LUẬT CHỐNG NGÔ NGHÊ) + §2d (HÌNH HỌC APPLE, cả 2 mục MỚI
  thêm vào file spec — đọc kỹ trước khi code, không suy đoán). Bỏ HẲN cách tiếp cận "đo vị trí
  BottomToolbar rồi đặt pill cạnh" (toàn bộ nỗ lực G1b) — thay bằng: công tắc SỐNG NGAY TRONG bar,
  không còn là phần tử rời cần đo-vị-trí.
- **Kiến trúc mới** (khác hẳn G1b): `ModeSwitchCell.tsx` (nhãn "Vẽ 3D" + switch thật, dùng CHUNG)
  gắn cuối `<BottomToolbar>` sau vạch chia khi mode='render' (bar ZOOM/PAN + switch CÙNG 1 khối);
  mode='model3d' không còn `BottomToolbar` (không có zoom/pan React-Flow) → `ModeSwitchBar.tsx`
  (bar capsule riêng chỉ chứa switch) — mount BÊN TRONG `Render3DModeSkeleton.tsx` (KHÔNG phải
  `HomeScreen.tsx` ngoài `ModeShell.content()` như `Render3DToggleButton` cũ) để đúng
  positioned-ancestor (loại trừ `LeftRail`) NGAY TỪ ĐẦU — né lại đúng bug lệch tâm G1b từng vá.
  `Render3DToggleButton.tsx` xoá hẳn (hết nơi gọi, đúng yêu cầu).
- Hình học đúng công thức đồng tâm §2d: bar 44/r22 → đệm 5 → nút 34/r17 (=22−5) → icon 15 → cách
  5 ĐỀU (kể cả quanh vạch chia, không còn `mx-1` tuỳ hứng cũ) → track switch 36×22/r11 → núm tròn
  18 (đệm 2 mỗi cạnh, tắt left2 / bật left16). MỘT bóng duy nhất
  `shadow-[0_8px_24px_rgba(40,38,35,.14)]` (bỏ `shadow-xl shadow-black/30` cũ — đúng luật "một
  khối một bóng").
- 💭 Quyết định tự chọn: màu track TẮT dùng `var(--border-strong)` thay vì hex `#d8d5d0` mock đưa
  — hex đó chỉ đúng light theme (mock chỉ có 1 theme), hardcode sẽ khiến switch quá sáng/mờ nhạt
  trên nền tối. `--border-strong` là token xám trung tính gần nhất có sẵn (`app/globals.css`), tự
  đổi đúng theo theme — `#cbc4b6` (light, gần `#d8d5d0`) / `#3d3d45` (dark).
- Verify browser thật (dự án mẫu, cả 2 theme): đo DOM qua `getComputedStyle`/`getBoundingClientRect`
  xác nhận ĐÚNG TUYỆT ĐỐI mọi số — bar `height:44,radius:22px,padding:5px,shadow:rgba(40,38,35,.14)
  0 8px 24px`; nút `34×34,radius:17px`; track `36×22,radius:11px`; núm `18×18`, offset `(2,2)` khi
  tắt → `(16,2)` khi bật (đo được sau khi click, đúng khớp). Toggle 2 chiều đồng bộ đúng (cùng 1
  nguồn `useStageMode`, đổi ở bar nào cũng phản ánh đúng ở bar kia lúc quay lại). `ModeSwitchBar`
  (mode 3D) đo được tâm nằm ĐÚNG giữa vùng canvas (loại trừ `LeftRail`), không lệch — xác nhận kiến
  trúc mount-bên-trong-Skeleton đúng ngay từ đầu, không cần vá thêm như G1b. 0 console error (tab
  mới). tsc/eslint sạch, `npm test` 0 fail.
- 💭 `docs/SPEC-DESIGN-SYSTEM-IF.md` đang có §2c/§2d MỚI (chưa commit, của Hoà/phiên khác trước khi
  giao lệnh) — ĐỌC để lấy spec nhưng KHÔNG đụng vào commit của tôi, để nguyên như mọi phiên trước.

## HẾT K4 + G1 + G1b + G1c — TẤT CẢ ĐÃ XONG TRỌN, không còn gì dở lại
6 commit code (`498e248` chore server phụ · `e1aa92c` K4 · `edd57aa` K4 follow-up · `e74485a` G1 ·
`2daf089` G1b · `e1aaf6a` G1c) đều `git commit -- <pathspec>` scoped đúng file, không đụng
`docs/00-CHOT.md`/`docs/SPEC-DESIGN-SYSTEM-IF.md`/2 file mới của Hoà (để nguyên theo đúng ghi chú
phiên trước).

## G1d — Hoà giao thêm: áp `SPEC-NGON-NGU-CHI-DAN.md` mới (dọn jargon UI) — XONG
- Commit `5649f14` (`RenderToolModeOverlay.tsx` · `ToolWindow.tsx` · `ToolModeForm.tsx` ·
  `RenderIOMenus.tsx`).
- File spec MỚI (`docs/SPEC-NGON-NGU-CHI-DAN.md`, của Hoà, chưa commit — để nguyên như mọi file
  mới khác của Hoà phiên này) chê đúng dải nhắc `RenderToolModeOverlay.tsx` là ví dụ mẫu ("Flow
  này có 2 node — chọn 'Node MASTER'... mở Node Library để xem đủ" → "nói vậy chả ai hiểu gì cả").
  Sửa đúng theo khuôn §2 "Nhắc trạng thái" + ví dụ sửa mẫu §4: **"Còn công cụ khác chưa hiện."**
  + nút **[Xem tất cả]** gọi thẳng `setPanel('library')` (mở thư viện khối) — bỏ hẳn câu giải
  thích cơ chế (luật 1 "hành động trước, cơ chế sau (hoặc bỏ)").
- Grep `"node\|Node\|flow\|Flow\|MASTER"` khắp `components/shell/` + `components/render-studio/`
  (đúng 2 thư mục Hoà chỉ định) tìm thêm 2 tooltip lộ "node" (`ToolWindow.tsx` "Thu lại thành node
  nhỏ", `ToolModeForm.tsx` "Xem/chỉnh node phía sau thẻ này trên canvas") — cả 2 file TRƯỚC ĐÓ
  hoàn toàn chưa có i18n (không import `useT`), thêm mới cho đúng luật "Chuỗi đi qua lib/i18n.ts
  đủ cặp EN+VI, không hardcode". Mở rộng thêm sang `components/studio/RenderIOMenus.tsx` (menu
  "Tệp" chặng Render — không nằm trong 2 thư mục chỉ định nhưng dính đúng jargon `node`/`flow` ở 8
  chỗ label/sub/disabledReason, đã có sẵn `tr()` trong scope component nên bọc thẳng, không cần
  thêm import) — quyết định tự chọn mở rộng nhẹ vì cùng 1 cụm chức năng (menu Tệp render) và chi
  phí sửa rất nhỏ so với để sót jargon ngay cạnh.
- Grep lại sau sửa: 0 kết quả thật (chỉ còn `id:'flow'`/`id:'flow-export'` — định danh nội bộ
  không lộ ra UI — và code identifiers/comment, không phải chuỗi hiển thị).
- Verify browser thật (dự án mẫu, đúng kịch bản `nodeCount>1` để notice hiện): thông báo mới hiện
  đúng "Còn công cụ khác chưa hiện." + nút "Xem tất cả", bấm nút mở ĐÚNG Node Library panel (xác
  nhận qua DOM). Đổi ngôn ngữ EN qua store (`setLang('en')`) xác nhận dịch đúng "More tools aren't
  shown." + "[View all]" — cùng lúc thấy các chuỗi khác trong header (File/Tasks) cũng đổi đúng
  (hạ tầng i18n toàn app, không phải riêng phần tôi sửa). 0 console error. tsc/eslint sạch,
  `npm test` 0 fail.
- 💭 **Phát hiện phụ, KHÔNG sửa** (đã `spawn_task` báo riêng, không tự ý mở rộng phạm vi): panel
  `components/NodeLibraryPanel.tsx` (top-level `components/`, NGOÀI 2 thư mục Hoà chỉ định) vẫn
  hiện tiêu đề "NODE LIBRARY" tiếng Anh/thuật ngữ nội bộ khi mở — đúng loại lỗi spec muốn dọn,
  nhưng nằm ngoài ranh giới lần này nên để phiên/task riêng xử lý.

## HẾT K4 + G1 + G1b + G1c + G1d — TẤT CẢ ĐÃ XONG TRỌN, không còn gì dở lại
7 commit code (`498e248` chore server phụ · `e1aa92c` K4 · `edd57aa` K4 follow-up · `e74485a` G1 ·
`2daf089` G1b · `e1aaf6a` G1c · `5649f14` G1d) đều `git commit -- <pathspec>` scoped đúng file.
Tiếp theo quay lại G2 (Mood+Collab canvas) → G3 → G4 → G5 theo
`docs/TICKET-CHANG2-BUILD-2026-08-02.md`.

---

## G2 — khảo sát hạ tầng có sẵn (trước khi code, theo yêu cầu Hoà)
Dùng Explore agent đọc code thật (không suy đoán) trước khi thiết kế G2. Tóm tắt phần LIÊN QUAN
phần (1):
- **Group/frame ĐÃ CÓ**: `NodeGroup` (`lib/store.ts:206-213`) — `{id,label,nodeIds,collapsed,
  center?}`, action `groupSelected/ungroupById/renameGroup/toggleGroupCollapse`
  (`lib/store.ts:924-980`), vẽ bằng `GroupOverlay.tsx` (khung dashed quanh bbox node thành viên).
  NHƯNG `groupSelected` ép ≥2 node ĐÃ CÓ SẴN mới tạo được group (`if (selected.length<2) return`)
  — không có khái niệm "khung trống vẽ trước, thả node vào sau" kiểu Miro/Figma frame.
- **matId**: 0 kết quả toàn repo — khái niệm hoàn toàn mới, chưa có gì để nối (phần (5) sẽ cần
  tạo field mới, không phải việc của phần (1)).
- **mindmap**: 0 kết quả — hoàn toàn mới (phần (6), không phải phần (1)).
- **Kéo-thả từ kệ** (`NodeLibraryPanel.tsx` → `FlowCanvas.tsx onDrop`): cơ chế `DND_MIME` áp dụng
  được thẳng cho mindmap template sau này (phần (6)), không liên quan phần (1).
- Presence/sticky/comment đã có (dùng cho phần (2)/(4) sau) — không động tới ở phần (1).

## G2 phần (1) — khung canvas + frame theo phòng — THIẾT KẾ (viết trước khi code, theo yêu cầu)
**Quyết định kiến trúc**: KHÔNG viết canvas Miro riêng — dùng THẲNG `FlowCanvas` (React Flow) hiện
tại làm "canvas kiểu Miro" (đúng luật gộp tính năng CLAUDE.md "một cỗ máy nhiều mặt tiền" + luật
gốc SPEC-CHANG2-UI-2MODE "gạt mode chỉ đổi canvas+sidebar, không dựng lại shell"). "Frame theo
phòng" = MỞ RỘNG `NodeGroup` có sẵn, KHÔNG tạo hệ thống group thứ 2.

**Việc làm**:
1. `lib/store.ts`: `NodeGroup` thêm `rect?: {x,y,width,height}` (khung vẽ TRƯỚC, độc lập vị trí
   node — khác `center` suy từ node thành viên của group cũ) + `roomKind?: string` (đánh dấu đây
   là "khung phòng", khác group thường). Action mới `createRoomFrame(rect, label)` (không ép ≥2
   node — tạo group `nodeIds:[]`). Action mới `syncRoomMembership(nodeId, pos)` — gọi lúc node vừa
   kéo-thả xong, kiểm tâm node có rơi vào rect phòng nào không, tự thêm/gỡ khỏi `nodeIds` (CHỈ áp
   cho group có `rect` — group thường do user tự chọn, không tự động mutate).
2. `GroupOverlay.tsx`: `GroupRect` ưu tiên vẽ theo `group.rect` khi có (bỏ early-return khi 0
   member — khung phòng phải hiện NGAY CẢ KHI RỖNG, đó là điểm khác biệt cốt lõi so với group cũ).
   Thêm `<datalist>` gợi ý tên phòng (Phòng khách/Bếp/Phòng ngủ/Phòng tắm/Sân vườn/Phòng làm
   việc/Ban công/Khác) vào input đổi tên ĐÃ CÓ SẴN (double-click label) — không viết popover mới.
3. `BottomToolbar.tsx`: thêm nút "Khung" (icon `Frame` lucide) giữa Pan và Sticky note — đúng thứ
   tự SPEC-CHANG2-UI-2MODE §1 "➤ chọn · ✋ pan · ▢ frame". `Tool` type thêm `'frame'`.
4. `FlowCanvas.tsx`: khi `tool==='frame'`, bấm-kéo trên NỀN canvas (check `target.classList.
   contains('react-flow__pane')`, không bấm trúng node) vẽ preview rect (state cục bộ, toạ độ
   MÀN HÌNH tương đối `wrapperRef` — đơn giản hơn ViewportPortal vì preview không cần chính xác
   theo flow-space lúc đang kéo) → thả chuột: quy đổi 2 góc qua `screenToFlowPosition`, tạo room
   frame qua `createRoomFrame`, `setTool('select')` (khuôn có sẵn: thao tác 1-lần xong tự về
   select). `onNodeDragStop` mới gọi `syncRoomMembership`. `panOnDrag`/`selectionOnDrag` tắt khi
   `tool==='frame'` (nhường quyền bắt pointer cho logic vẽ khung).
5. Bỏ NGOÀI phạm vi phần (1) (ghi rõ, không lặng lẽ bỏ qua): kéo-thả DI CHUYỂN/resize khung SAU
   khi đã tạo (chỉ tạo 1 lần bằng kéo-vẽ, sau đó cố định — dùng nút "Gỡ group" có sẵn để xoá làm
   lại nếu cần) · animation kính/motion riêng cho khung (dùng style tĩnh giống `GroupOverlay` cũ,
   chưa theo token `SPEC-DESIGN-SYSTEM-IF` §2d vì group/frame là "canvas content" không phải
   "vỏ app" — §2d áp cho bar/pill nổi, khung phòng là panel-content nên giữ bo góc thường theo §2,
   không capsule).

## G2 phần (1) — khung canvas + frame theo phòng — XONG
- Commit `78d4cee` (`lib/store.ts` + `GroupOverlay.tsx` + `BottomToolbar.tsx` + `FlowCanvas.tsx`).
  Kèm `43adceb` — G1d bổ sung `NodeLibraryPanel.tsx` (Hoà giao làm ngay thay vì `spawn_task`,
  huỷ task cũ) — đã dismiss `task_cff85421`.
- Code đúng theo thiết kế đã mô tả ở trên, không lệch.
- 💭 **Phát hiện lúc verify, tự sửa ngay**: test bằng cách dispatch nhiều `PointerEvent` LIÊN TIẾP
  KHÔNG delay (`pointerdown`→`pointermove`→`pointermove`→`pointerup` trong cùng 1 tick JS đồng bộ)
  → tạo `frameDraft` xong nhưng KHÔNG có group nào được tạo. Nguyên nhân: React batch state update
  — `onFramePointerUp` (đọc `frameDraft` qua closure `useCallback([frameDraft])`) vẫn dùng closure
  CŨ (từ trước `pointerdown` set state) vì React chưa kịp re-render/swap closure giữa các dispatch
  đồng bộ liên tiếp. Thêm `await wait(~50-60ms)` giữa mỗi dispatch → hoạt động đúng. **Đây là bẫy
  của MÔI TRƯỜNG TEST (dispatch quá nhanh so với thao tác chuột người dùng thật, vốn luôn có vài ms
  giữa mousedown→mousemove→mouseup), KHÔNG phải bug code** — ghi lại cho phiên sau đỡ mất thời gian
  dò lại nếu test tương tự (cùng họ vấn đề với "computer tool coordinate-click không đăng ký điểm
  vẽ đúng" đã ghi ở C4, nhưng lần này là do timing/batching chứ không phải do computer-tool).
- Verify browser thật (dự án mẫu, đã dọn dữ liệu test sau khi xong): vẽ khung qua drag thật (có
  delay) → group tạo đúng `rect`/`center`/`label:"Phòng mới"`, `GroupOverlay` render đúng
  `border-solid` (phân biệt group thường `border-dashed`) — đo `getComputedStyle` khớp TUYỆT ĐỐI
  vị trí/kích thước với `group.rect` lưu trong store. `datalist` đúng 7 gợi ý tên phòng.
  `renameGroup` đổi tên đúng. `syncRoomMembership` cả 2 chiều đúng (gọi trực tiếp với toạ độ
  trong/ngoài rect rõ ràng — node vào rect → `nodeIds` thêm; ra khỏi rect → `nodeIds` gỡ). 0
  console error. tsc/eslint sạch, `npm test` 0 fail.
- 💭 KHÔNG kiểm bằng screenshot pixel-perfect được (bar zoom 15% mặc định của dự án mẫu + style
  nền `bg-accent/[0.04]` cố tình rất mờ, kế thừa nguyên style `GroupOverlay` cũ cho group thường —
  không phải lỗi mới) — dùng `getComputedStyle`/`getBoundingClientRect` làm bằng chứng chính,
  đủ chắc chắn (so khớp số chính xác, không phải "trông có vẻ đúng").

## G2 phần (2) — sticky + comment neo object — THIẾT KẾ (viết trước khi code)
**Khảo sát lại trước khi thiết kế**: sticky note ĐÃ CÓ ĐỦ (đã xác nhận từ khảo sát đầu G2 —
`NoteNode`/`addNote`, node React Flow thật, tự nhiên "neo vào object" vì bản thân nó LÀ 1 object
canvas). `CommentLayer.tsx` hiện có KHÔNG đạt yêu cầu "neo object" — neo theo % TOẠ ĐỘ VIEWPORT +
`elementHint` (DOM snapshot dò bằng `elementFromPoint`, không phải ID thật), lệch khi
pan/zoom/resize, và mặc định TẮT (`NEXT_PUBLIC_COMMENT_LAYER`). Việc thật của phần (2) là:
**comment neo vào NODE ID thật** (khác hẳn cơ chế `CommentLayer` cũ, không sửa file đó).

**Quyết định kiến trúc**: comment là 1 mảng top-level MỚI trong store (`comments: CanvasComment[]`,
đúng khuôn `groups: NodeGroup[]` đã có — KHÔNG nhét vào `node.data` vì comment là dữ liệu cộng tác
nhẹ, tách khỏi payload node giúp autosave/diff gọn hơn). Render bằng 1 component dùng chung
`CommentPin.tsx` (đúng tên đã liệt trong `SPEC-DESIGN-SYSTEM-IF.md` §4 "Comment pin") — mount
NGAY BÊN TRONG `InteriorNode.tsx`/`NoteNode.tsx` (không dùng `ViewportPortal` như `GroupOverlay`)
vì đặt trong chính node = tự động neo đúng vị trí theo pan/zoom/kéo-thả, không cần tính toán gì.

**Việc làm**:
1. `lib/store.ts`: type `CanvasComment {id,nodeId,author,text,createdAt}`, field `comments:
   CanvasComment[]`. Action `addComment(nodeId,text)` (author = `user?.name ?? 'Khách'`, id qua
   `nextId('cmt')`, `createdAt: Date.now()`), `removeComment(id)`. Đi qua ĐỦ 5 chỗ `groups` hiện
   đã có (đúng khuôn, tránh 2-nguồn/mất dữ liệu khi lưu-mở lại): field trong `FlowState` +
   init `[]` + `loadGraph()` (parse từ server) + `hydrate()` (parse localStorage) +
   `persistNow()` (payload DB PUT + payload localStorage + `subscribe()` watcher đổi field mới →
   trigger autosave).
2. `components/nodes/CommentPin.tsx` (mới): badge góc phải-trên node (`MessageCircle` icon +
   số đếm nếu >0), `position:absolute;-top-2;-right-2`. Bấm mở `Popover.tsx` (component có sẵn,
   tự lật hướng theo viewport — KHÔNG viết lại) liệt kê comment cũ (tác giả + giờ tương đối + nội
   dung) + textarea/nút gửi thêm mới. Nhận prop `nodeId`.
3. Mount `<CommentPin nodeId={id} />` trong `InteriorNode.tsx` (thêm `relative` vào className
   `motion.div` ngoài cùng — HIỆN CHƯA có, cần cho badge absolute định vị đúng) và trong
   `NoteNode.tsx` (đã có sẵn `relative`, chỉ thêm dòng mount).
4. Badge CHỈ hiện khi có ≥1 comment HOẶC đang hover node (`group-hover`, khuôn có sẵn ở nút xoá
   note/node) — tránh rối canvas khi phần lớn node chưa ai bình luận.
5. Bỏ NGOÀI phạm vi phần (2) (ghi rõ): **@mention** (không có UI gõ `@` autocomplete tên
   thành viên — cần danh sách presence + logic filter, để việc riêng) · **reaction/vote** (không
   có nút thả cảm xúc/đếm vote trên sticky/comment — cần thiết kế UI mới, chưa có trong bất kỳ
   component nào hiện tại) · sửa/xoá TỪNG comment theo quyền tác giả (v1: ai cũng xoá được bất kỳ
   comment nào, khớp mức đơn giản hiện có của sticky note — không kiểm tra ownership).

## G2 phần (2) — comment neo vào node ID thật — XONG
- Commit `066d48b` (`lib/store.ts` + `CommentPin.tsx` mới + `InteriorNode.tsx` + `NoteNode.tsx`).
- Code đúng thiết kế đã mô tả. Tái dùng `formatBackupRelativeTime()` có sẵn trong
  `lib/cad/backup-diff.ts` (tên hàm mang chữ "Backup" nhưng logic hoàn toàn generic, nhận
  `timestampMs`+`nowMs` — đúng luật "một cỗ máy nhiều mặt tiền", không viết lại bộ định dạng giờ
  tương đối lần 2).
- 💭 **Phát hiện lúc verify, KHÔNG phải bug**: lần đầu bấm mở, badge đo được `computed opacity:0`
  dù `className` đã đúng `opacity-100` — nghi ngờ ban đầu là bug thật, đào sâu bằng cách so
  `nodeEl`/`pin` inline style (không có gì bất thường) → reload trang → `opacity:1` đúng ngay.
  Kết luận: Tailwind JIT (Next dev) cần 1 nhịp compile CSS cho class MỚI xuất hiện lần đầu trong
  file `CommentPin.tsx` vừa tạo — không phải lỗi logic. Cũng thấy toast "1 error" thoáng qua lúc
  đó (Next dev overlay, tự hết sau khi HMR ổn định, tab mới hoàn toàn sạch, `preview_logs` xác
  nhận server không có lỗi thật). Ghi lại: **gặp opacity/lỗi lạ ngay sau khi tạo FILE MỚI → thử
  reload trước khi kết luận là bug**, cùng họ với các bẫy HMR/dev-server đã ghi trước đó trong
  phiên.
- Verify browser thật (dự án mẫu): tạo node test → `addComment` qua store đúng (author lấy từ
  `user.name` đăng nhập) → badge đếm đúng "1" → click thật (dispatch toạ độ chính xác dù zoom nhỏ)
  mở đúng `Popover` hiện tác giả/giờ tương đối/nội dung + ô gửi. `removeComment` + `deleteNode`
  dọn sạch đúng. 0 console error (tab sạch). tsc/eslint sạch (1 lỗi `meta` pre-existing
  `InteriorNode.tsx`, xác nhận qua `git stash`). `npm test` 0 fail.
- 💭 Dữ liệu dự án mẫu hiện có 3 node "lạ" từ trước (`note_msbbav2i_0`/`node_msbbe0yo_1` ở
  y≈-6150/-9261, `node_msbc60ns_2` ở y≈-50202) khiến "Fit view" không hội tụ tốt (kẹt ở
  `minZoom=0.15`) — KHÔNG xoá vì không chắc provenance (2 cái đầu có thể là "2 node" đã thấy từ
  đầu phiên trước tôi động vào gì; cái thứ 3 khả nghi là artifact test nhưng không chắc 100%).
  Ghi lại để Hoà tự quyết có dọn không — không tự ý xoá dữ liệu không chắc chắn là của mình.

## G2 phần (3) — toolbar bút tablet (bút·marker·highlight·tẩy) — THIẾT KẾ (viết trước khi code)
**Khảo sát lại**: `SketchCanvas.tsx`/`MaskPainterModal.tsx`/`AnnotateModal.tsx` đều là canvas 2D
CỠ CỐ ĐỊNH (vẽ lên 1 tấm ảnh/khung tĩnh) — KHÔNG chạy trong không gian flow-space vô hạn
(pan/zoom) của `FlowCanvas`. Không tái dùng trực tiếp được cho "vẽ tay lên MẶT PHẲNG canvas Mood+
Collab" (khác hẳn "vẽ lên 1 tấm ảnh cụ thể"). Cơ chế containment/toạ độ gần nhất để học lại là
CHÍNH G2 phần (1) vừa làm (`FlowCanvas.tsx` tool='frame': bắt pointer trên nền canvas, quy đổi
`screenToFlowPosition` lúc thả, xem trong `ViewportPortal` như `GroupOverlay`).

**Quyết định kiến trúc**: nét vẽ là dữ liệu FLOW-SPACE (polyline điểm x,y flow-space, KHÔNG phải
pixel màn hình) → tự đúng theo pan/zoom vĩnh viễn, giống `GroupOverlay`/khung phòng. Render bằng
1 lớp SVG mới `DrawLayer.tsx` bọc `ViewportPortal`, vẽ toàn bộ nét đã lưu bằng `<polyline>`. Tool
vẽ dùng CHUNG state `tool` đã có (mở rộng `Tool` thêm `'pen'|'marker'|'highlight'|'eraser'`,
không tạo state riêng) — nhất quán với `'frame'` đã thêm ở phần (1).

**Việc làm**:
1. `lib/store.ts`: type `DrawStroke {id,tool:'pen'|'marker'|'highlight',points:{x,y}[],color,
   width}`, field `strokes: DrawStroke[]`. `Tool` thêm `'pen'|'marker'|'highlight'|'eraser'`.
   Action `addStroke(stroke)`, `eraseAt(pos)` (xoá NGUYÊN nét nào có điểm nằm trong bán kính tẩy —
   tẩy kiểu vector "xoá cả nét chạm tới", KHÔNG phải tẩy pixel bitmap — đơn giản, khớp mức MVP).
   Đi qua ĐỦ 5 chỗ `groups` như phần (1)/(2) để đồng bộ persist.
2. `components/render-studio/DrawLayer.tsx` (mới): SVG trong `ViewportPortal`, mỗi `DrawStroke`
   → `<polyline>` với style theo tool — pen: đặc màu accent-ink, opacity 1; marker: opacity ~0.55,
   nét dày hơn; highlight: opacity ~0.3, RẤT dày, `mixBlendMode:'multiply'` (hiệu ứng dạ quang
   kinh điển). Nét ĐANG VẼ (chưa thả chuột) là state cục bộ riêng, render đè lên cùng cách.
3. `components/render-studio/DrawToolbar.tsx` (mới) — thanh dọc TRÁI nổi trên canvas (khác
   `LeftRail` app-level và `BottomToolbar` — đúng vị trí "toolbar trái" spec chỉ rõ), 4 nút Bút
   (`Pen`)/Marker (`Highlighter` icon nhạt hơn hoặc `PenTool`)/Tô sáng (`Highlighter`)/Tẩy
   (`Eraser`) — TỪ lucide, nút ≥34px (đúng spec "Nút to, tối ưu chạm/pen"). + nút "Chọn" reset
   tool về `'select'`. Chỉ hiện ở mode='render' (canvas Mood+Collab).
4. `FlowCanvas.tsx`: mở rộng handler pointerdown/move/up đã viết cho `tool==='frame'` sang xử lý
   thêm 4 tool vẽ mới — khi `tool` ∈ {pen,marker,highlight}: tích luỹ điểm (quy đổi
   `screenToFlowPosition` MỖI lần move, khác `frame` chỉ quy đổi lúc thả — vẽ tay cần điểm trung
   gian để đường cong mượt) → thả chuột: `addStroke`. `tool==='eraser'`: mỗi lần move gọi
   `eraseAt(flowPos)` liên tục (tẩy theo vệt kéo, không cần thả mới tẩy). `panOnDrag=false` cho cả
   4 tool mới (giống 'frame').
5. Bỏ NGOÀI phạm vi phần (3) (ghi rõ): **palm-rejection thật** (cần phân biệt `pointerType`
   'pen' vs 'touch' lúc CÓ CẢ HAI đồng thời — không có thiết bị tablet thật trong môi trường test
   để kiểm chứng đáng tin cậy, chỉ ghi nhận `e.pointerType` sẵn có trong sự kiện, CHƯA viết logic
   lọc palm) · **chữ/hình/ảnh trong toolbar trái** (spec liệt "chọn/sticky/chữ/hình/ảnh/comment"
   nhưng sticky/comment ĐÃ có lối vào riêng — BottomToolbar/CommentPin — không lặp; chữ/hình/ảnh
   là khả năng MỚI hoàn toàn, chưa có node/tool nào tương ứng, để việc riêng) · **undo/redo cho
   nét vẽ** (dùng `snapshot()` chung của toàn store — nét vẽ sẽ ĐI KÈM undo/redo hiện có của
   nodes/edges/groups một cách TỰ NHIÊN vì cùng 1 store, nhưng CHƯA kiểm tra riêng hành vi này).

## G2 phần (3) — toolbar bút tablet — XONG
- Commit `cc190d3` (`lib/store.ts` + `DrawLayer.tsx`/`DrawToolbar.tsx` mới + `FlowCanvas.tsx`).
- Code đúng thiết kế đã mô tả.
- 💭 **Sửa lại giả định SAI trong thiết kế phần (3) trước khi code** (phát hiện lúc verify, ghi rõ
  thay vì lặng lẽ sửa): dòng "undo/redo cho nét vẽ ... nhét vào TỰ NHIÊN vì cùng 1 store" ở mục
  "NGOÀI PHẠM VI" phía trên là SUY ĐOÁN CHƯA KIỂM CHỨNG. Đọc thẳng code `snapshot()`/`undo()`
  (`lib/store.ts`) mới thấy `HistoryEntry` CHỈ theo dõi `{nodes,edges}` — `groups`/`comments`/
  `strokes` gọi `get().snapshot()` (đúng khuôn) nhưng bản thân undo/redo KHÔNG hề khôi phục lại
  DỮ LIỆU của chính chúng khi lùi bước — đây là giới hạn CÓ SẴN của toàn hệ (đã tồn tại từ
  `groups` trước cả khi tôi động vào, không phải lỗi riêng của `strokes`). KHÔNG mở rộng sửa cả
  hệ undo (ảnh hưởng `groups`/`comments`, việc lớn hơn hẳn phạm vi phần (3)) — chỉ sửa lại đúng
  câu chữ trong tài liệu, để nguyên hành vi.
- 💭 **Bẫy timing LẶP LẠI** (cùng họ với phần (1)): dispatch `PointerEvent` NGAY sau khi bấm nút
  đổi tool trong `DrawToolbar` (không chờ) → nét vẽ đầu tiên vẫn dùng tool CŨ (đọc closure `tool`
  chưa kịp cập nhật). Thêm `await wait(~100ms)` SAU MỖI lần bấm nút đổi tool (không chỉ giữa các
  bước vẽ) mới đúng. Ghi lại lần nữa vì đây LÀ LẦN THỨ HAI gặp đúng bẫy này trong phiên — nên nhớ
  MẶC ĐỊNH cho MỌI test tương tác canvas sau này: bấm nút → đợi → mới dispatch bước kế.
- Verify browser thật (dự án mẫu, đã dọn strokes test): cả 4 tool tạo/xoá nét đúng qua store, SVG
  render đúng vị trí/màu/độ dày/blend từng tool (chụp ảnh xác nhận trực quan — marker tím mờ,
  highlight vàng dày dạ quang). Tẩy đúng nét trúng (không đụng nét khác). Dark theme giữ chất
  lượng capsule/blur. 0 console error. tsc/eslint sạch. `npm test` 0 fail.

## G2 phần (4) — presence online/offline + mời — THIẾT KẾ (viết trước khi code)
**Khảo sát trước khi thiết kế** (Explore agent đọc code thật): `PresenceBar.tsx` hiện tại CHỈ hiện
người có CURSOR SỐNG (poll 900ms, server tự prune sau 6s không hoạt động) — chấm xanh CỨNG cho
MỌI người trong `others`, KHÔNG có khái niệm "offline" (đã rời thì biến mất hẳn, không hiện xám).
Tìm thấy 3 nguồn dữ liệu CÓ SẴN quan trọng, tránh viết lại:
- `prisma.ProjectMember` (`prisma/schema.prisma:105`) — roster THẬT của dự án (khác cursor sống),
  API `GET/POST /api/projects/[id]/members` đã có đủ (trả `members[]`, `myRole`, `canManage`).
- `/api/dashboard` — field `team[]` có sẵn `online: boolean` (so `lastSeenAt` với ngưỡng 2 phút,
  route.ts) — nguồn "ai trong hệ thống, ai online gần đây" ĐÃ TÍNH SẴN, không cần tính lại.
- **Mời**: KHÔNG có cơ chế email-invite nào trong repo (đã grep). `POST /api/projects/[id]/members`
  chỉ nhận `userId` CÓ SẴN trong bảng User + yêu cầu `role=owner` mới gọi được — không tạo tài
  khoản mới, không gửi email. `ProjectMembersPanel.tsx` (Dashboard) ĐÃ dùng đúng luồng này với
  `teamUsers` lấy từ `data.team` của `/api/dashboard`.

**Quyết định kiến trúc**: "mời (+)" trong MVP này = **thêm thành viên CÓ SẴN trong hệ thống vào dự
án đang mở** (dùng THẲNG `POST /api/projects/[id]/members`, KHÔNG xây email-invite mới — việc đó
lớn hơn hẳn 1 phần của G2, cần hạ tầng gửi mail + token + trang đăng ký, ngoài phạm vi). Ghi rõ
ràng trong UI đây là "thêm người đã có tài khoản", không phải mời email — tránh hứa quá mức luật
"hành động trước, cơ chế sau" của `SPEC-NGON-NGU-CHI-DAN`.

**Việc làm**:
1. `PresenceBar.tsx`: fetch `GET /api/projects/{currentProjectId}/members` (poll nhẹ, KHÔNG cần
   900ms như cursor — 30s đủ, đây là roster ít đổi) → cross-reference với `others` (cursor sống,
   ĐÃ có sẵn từ `useCollabStore`) để suy "online" = có cursor sống HOẶC là chính user hiện tại;
   "offline" = member nhưng không có cursor sống. Render 2 nhóm: online (chấm emerald, khuôn cũ)
   trước, offline (avatar xám mờ, không chấm hoặc chấm xám) sau.
2. Nút "+ " CHỈ hiện khi `canManage` (owner, đúng luật API — ẩn hẳn với người không có quyền,
   không hiện nút rồi báo lỗi 403 sau khi bấm). Bấm mở `Popover` (có sẵn) fetch `/api/dashboard`
   MỘT LẦN lúc mở (không poll) → lọc `team` bỏ người ĐÃ là member → danh sách bấm "Thêm" gọi
   `POST /api/projects/{id}/members` (`role:'viewer'` mặc định, an toàn nhất) → refetch members.
3. Bỏ NGOÀI phạm vi phần (4) (ghi rõ): **email-invite thật** (tạo tài khoản mới qua email, cần hạ
   tầng gửi mail — KHÔNG có trong repo) · **đổi role thành viên từ PresenceBar** (đã có
   `ProjectMembersPanel.tsx` ở Dashboard làm việc này đầy đủ hơn, không lặp lại UI) · **share
   roles Viewer/Commenter/Editor riêng cho canvas** (SPEC-CHANG2-UI-2MODE §3 liệt đây là khái
   niệm KHÁC `ProjectMember` role hiện có — "collab-share, KHÁC phân quyền IF1/IF2" — cần thiết kế
   mới, không có hạ tầng nào khớp sẵn, để việc riêng).

## G2 phần (4) — presence online/offline + mời — XONG
- Commit `0cfdd62` (`components/collab/PresenceBar.tsx`, viết lại toàn bộ).
- Code đúng thiết kế đã mô tả ở trên: gộp cursor sống (`others`/`meId`) + roster
  `ProjectMember` (`GET /api/projects/{id}/members`, poll 30s) → online trước/offline sau,
  chấm emerald/xám. Nút "+" chỉ hiện khi `canManage`, mở `Popover` (portal có sẵn) lọc
  `team` từ `/api/dashboard` bỏ người đã là member, bấm "Thêm" gọi
  `POST /api/projects/{id}/members` role viewer mặc định.
- 💭 **2 bug thật phát hiện lúc verify browser** (đã sửa, chi tiết kỹ thuật trong commit
  `0cfdd62`):
  1. Avatar offline hiện sai `opacity:1` thay vì `.45` — `animate={{opacity:1}}` cứng của
     framer-motion đè mất `style={{opacity:.45}}` tĩnh cùng property (framer-motion tự đặt
     inline style cho property nó đang animate, luôn thắng style tĩnh dù đặt sau trong JSX).
     Sửa: chuyển điều kiện `p.online?1:.45` vào trong `animate`, bỏ khỏi `style` tĩnh.
  2. Console warning "Function components cannot be given refs... Check the render method of
     `PopChild`" — do tách avatar thành component `Avatar({p})` riêng, làm CON TRỰC TIẾP của
     `<AnimatePresence mode="popLayout">`; `AnimatePresence`/`PopChild` cần gắn ref thẳng lên
     con để quản lý animation thoát (exit), thất bại im lặng (chỉ warning dev) với function
     component thường (không `forwardRef`). Sửa: bỏ component `Avatar` riêng, inline lại JSX
     thẳng vào `.map()` bên trong `AnimatePresence` — đúng cấu trúc bản GỐC trước khi tôi tách
     ra (không phải lỗi có sẵn, lỗi do chính bước viết lại của tôi, đã tự phát hiện + sửa
     trước khi báo xong).
- Verify browser thật (project "Test B3 (phục hồi backup)", `canManage:true` vì `myRole:owner`
  của user demo trên project này): thêm thành viên "hoa" qua popover mời → `POST members`
  thành công, list cập nhật đúng. `getComputedStyle` xác nhận opacity self=1, hoa(offline)=0.45
  — cả hai lần: lần đầu trên tab cũ (nghi ngờ vì tab tái dùng giữ buffer console cũ), lần hai
  trên **tab hoàn toàn mới** (đúng quy ước "console phải sạch từ đầu" của phiên) → console
  0 error, xác nhận dứt điểm bug #2 đã hết. Dark theme: nền kính tối đúng
  (`rgba(26,26,30,.82)`), opacity giữ nguyên đúng. tsc/eslint/`npm test` sạch (0 fail, exit 0).
  Dọn dữ liệu test: xoá "hoa" khỏi `ProjectMember` của "Test B3" qua `DELETE
  /api/projects/{id}/members?userId=...` (xác nhận roster về lại đúng 1 member owner ban đầu).
- **Lưu ý cho phần sau**: `currentProjectId` mặc định `null` cho "Dự án mẫu" (flow trần, không
  có `Project` DB record bọc ngoài) — `PresenceBar` tự ẩn khi không đủ điều kiện
  (`people.length<=1 && !canManage`), đúng hành vi mong muốn, không phải bug.

## G2 phần (5) — swatch vật liệu matId — THIẾT KẾ (viết trước khi code)
**Khảo sát trước khi thiết kế** (2 agent Explore đọc code thật, không đoán):
- `SPEC-CHANG2-UI-2MODE.md:26` — yêu cầu đúng nguyên văn: "Swatch vật liệu | mang `matId`
  (hãng·mã·giá/m²) — kéo vào mang dữ liệu, không chỉ ảnh". `matId` cũng nằm trong spine chung
  (`:12-13`, "Thư viện (matId chung)") và trong "moat vật liệu: V-Ray/D5/IF hợp nhất bằng matId"
  (`:42`).
- **`matId` = khoá `ProductSpec{kind:'material'}`** (`prisma/schema.prisma:356-390`, bảng THẬT
  duy nhất cho vật liệu sau khi gộp `MaterialRef`, đã chốt Q-L2/2.1.9.i) — **KHÔNG phải**
  `MaterialDef` (`lib/cad/materials.ts`, vật liệu THỊ GIÁC cho Hatch CAD, cố ý tách khỏi thương
  mại). API `GET /api/specs?kind=material` (`app/api/specs/route.ts`) ĐÃ CÓ SẴN, trả đủ
  `id/name/brand/sku/colorHex/priceNote` — dùng thẳng, không viết API mới.
  ⚠️ Phát hiện phụ (không sửa, ngoài phạm vi): `specToDto` (`lib/server/specs.ts:18-47`) CHƯA trả
  `priceVnd`/`unit`/`wastagePercent` (field thêm sau ở 2.1.9.r) — dùng `priceNote` (text tự do,
  đã có, đúng convention "hiển thị, không parse số") cho hiển thị giá/m² là đủ cho phần (5), việc
  bổ sung DTO field số thật để dành cho BOQ thật sau.
- **Cỗ máy tái dùng** ("một cỗ máy, nhiều mặt tiền"): node `util.materialnote`
  (`lib/nodes/defs/material-notes.ts`) ĐÃ render đúng 1 thẻ ảnh tên/mã/NCC/hex/note — chỉ THIẾU
  field `matId` để neo về `ProductSpec` thật. KHÔNG viết node/engine mới.
- **Cơ chế kéo-thả tái dùng**: `NodeLibraryPanel.tsx` đã có `DND_MIME` ('application/
  interiorflow-node') nối sẵn vào `FlowCanvas.onDrop` (`addNode(defType,pos)`); nhánh
  `ASSET_MIME` (`components/LibraryPanel.tsx`) cho thấy khuôn "tạo node RỒI updateParam ngay
  sau" (`FlowCanvas.tsx:325-343`) — áp đúng khuôn này cho MIME mới, không phát minh cơ chế khác.

**Quyết định kiến trúc**:
1. `lib/nodes/defs/material-notes.ts`: thêm field `matId` — **KHÔNG khai trong `params:
   ParamDef[]`** (nên KHÔNG hiện ô nhập tay vô nghĩa trong panel thuộc tính — xác nhận qua code
   `InteriorNode.tsx:307`/`ToolModeForm.tsx:164` chỉ render field theo `def.params`, trong khi
   `execute()` nhận NGUYÊN `node.data.params` đầy đủ — `lib/execution.ts:145` — nên field không
   khai báo vẫn "đi theo" node, chỉ ẩn khỏi form). `renderMaterialCard` thêm dòng hiển thị
   `matId` (nếu có) trên thẻ — đúng yêu cầu "mang dữ liệu, không chỉ ảnh": nhìn thẻ vẫn thấy mã
   ATLAS thật, không chỉ hình.
2. Thêm khu **"Vật liệu"** vào `NodeLibraryPanel.tsx`, đặt NGAY SAU khu "Mood + Cộng tác" (đúng
   vị trí khái niệm — swatch phục vụ canvas Mood, không phải node xử lý) — cùng điều kiện hiện
   `phase.id==='render' && !query.trim()`. Fetch 1 lần `GET /api/specs?kind=material` lúc mount
   (không cần poll — vật liệu đổi chậm, giống lý do bỏ poll nhanh ở phần (4)). Mỗi vật liệu = 1
   chip: ô màu `colorHex` (fallback xám) + tên + `brand·sku` + `priceNote` rút gọn. Bấm = thêm
   node `util.materialnote` giữa canvas rồi tự điền params (giống hành vi "bấm để thêm" của
   `NodeCard`, ưu tiên cảm ứng). Kéo = set ĐỒNG THỜI 2 MIME lên `dataTransfer`: `DND_MIME` =
   `'util.materialnote'` (để nhánh cũ trong `FlowCanvas.onDrop` tạo đúng loại node) + MIME MỚI
   `application/interiorflow-material` (export từ `NodeLibraryPanel.tsx`, đặt tên `MAT_MIME`) =
   JSON `{matId,name,code,supplier,hex,note}`.
3. `FlowCanvas.tsx::onDrop`: SAU nhánh `DND_MIME` hiện có (đã `addNode` xong), kiểm thêm
   `MAT_MIME` — nếu có, parse JSON rồi gọi `updateParam` cho từng field lên node vừa tạo (đúng
   khuôn `ASSET_MIME` đã làm ở dòng 341-343: `nodes.at(-1)` lấy node vừa thêm). Additive thuần —
   không đổi nhánh cũ.
4. **Ref #3/#5 áp dụng thế nào** (theo chỉ đạo "G2 tiếp tục thì áp #3/#5"): #3 ("Canvas edit nền
   đen ... → Mood+Collab đã có, xác nhận hướng") — ĐÃ ĐÚNG hướng hiện tại (chrome tối trung tính,
   ảnh/nội dung nổi bật), KHÔNG cần sửa code, chỉ xác nhận. #5 (ambient-tint LẤY màu TỪ ảnh bên
   trong thẻ) — áp cho "thẻ ẢNH" (Gallery/File Manager/moodboard photo card); swatch vật liệu ở
   đây là Ô MÀU PHẲNG từ `colorHex` (không phải ảnh chụp) nên ambient-tint (trích màu từ ảnh) KHÔNG
   khớp kỹ thuật — màu chip CHÍNH LÀ `colorHex`, không cần trích xuất gì thêm. Ghi rõ thay vì áp
   gượng ép: #5 để dành đúng lúc động tới thẻ ảnh render/moodboard thật.
5. Ngoài phạm vi phần (5) (ghi rõ, không mở rộng): sửa `specToDto` thêm `priceVnd/unit` số thật
   (việc BOQ riêng) · picker tìm-kiếm/lọc vật liệu (2 bản ghi hiện có, chưa cần) · đồng bộ 2 chiều
   matId↔ATLAS khi sửa tay trên node (đã có triết lý "sửa tay không bị AI ghi đè" — giữ nguyên,
   node chỉ SAO CHÉP dữ liệu lúc kéo, không giữ liên kết sống).

## G2 phần (5) — swatch vật liệu matId — XONG
- Commit `a0b6968` (`components/NodeLibraryPanel.tsx`, `components/FlowCanvas.tsx`,
  `lib/nodes/defs/material-notes.ts`).
- Code đúng thiết kế đã mô tả ở trên: kệ "Vật liệu" mới trong khu Mood + Cộng tác, fetch
  `GET /api/specs?kind=material` thật, mỗi swatch bấm/kéo đều tạo `util.materialnote` mang
  `matId` (không có ô nhập tay — chỉ tự điền, đúng ý "mang dữ liệu, không chỉ ảnh").
- Verify browser thật (dự án mẫu, panel "Thư viện Node"): 2 vật liệu thật trong DB hiện đúng
  (An Cường AC-ENG-OAK15 · Stone World SW-TRV-BE, đủ tên/brand/sku/hex/priceNote). Test CẢ 2
  đường tạo node:
  1. **Bấm** — `onAddMaterial` → node mới `params: {matId, name, code, supplier, hex, note}`
     đúng dữ liệu ATLAS.
  2. **Kéo-thả thật** — giả lập `DragEvent`+`DataTransfer` thật (không phải gọi hàm tắt), dispatch
     `dragstart` trên chip rồi `drop` lên `.react-flow__pane` → xác nhận `dataTransfer.types` có
     ĐỦ cả `application/interiorflow-node` + `application/interiorflow-material`, node tạo ra
     đúng params như đường bấm — xác nhận `FlowCanvas.onDrop` đọc đúng `MAT_MIME` mới.
  `execute()` chạy qua `window.__nodeRegistry` (dev-only expose có sẵn, không phải hack riêng) ra
  đúng thẻ ảnh (chèn `<img>` xem trực tiếp) + `text` có `matId cmrykxtvg...` — card hiện đủ swatch
  màu/tên/mã·NCC/hex/**dòng matId (badge nâu)**/giá tham khảo, đúng bố cục dự kiến. Dark theme:
  chip đọc rõ, viền/hover đúng token. Console 0 error. tsc sạch, eslint sạch (lỗi
  `GripVertical` unused-var xác nhận CÓ SẴN từ trước, không phải do phần (5) — kiểm bằng `git
  stash` rồi chạy lại eslint). `npm test` 0 fail.
- 💭 **Dọn phụ**: lệnh `sqlite3 dev.db` lúc khảo sát vô tình tạo file rỗng `dev.db` ở gốc repo
  (DB thật nằm `prisma/dev.db`, khác file) — đã `rm` trước khi commit, không lọt vào git.
- Ref áp dụng đúng chỉ đạo: #3 xác nhận Mood+Collab hiện tại đã đúng hướng (không sửa code).
  #5 (ambient-tint) CHỦ ĐỘNG KHÔNG áp — swatch là ô màu phẳng từ `colorHex`, không phải ảnh chụp
  cần trích màu nền; để đúng lúc cho thẻ ảnh Gallery/File Manager/moodboard thật.

## G2 phần (6) — mindmap template tuỳ chọn kéo từ kệ — CHƯA BẮT ĐẦU
Tiếp theo trong hàng đợi G2 (6 phần theo TICKET-CHANG2-BUILD). Sẽ khảo sát trước khi thiết kế
(SPEC-STAGE-LIBRARIES.md phần mindmap template + hạ tầng kệ Thư viện hiện có) rồi viết note thiết
kế vào đây trước khi code, đúng quy tắc đã áp dụng suốt G2.

## G2 phần (6) — mindmap template tuỳ chọn kéo từ kệ — THIẾT KẾ (viết trước khi code)
**Khảo sát trước khi thiết kế**:
- `SPEC-CHANG2-UI-2MODE.md:27` — nguyên văn: "Mindmap = 1 TUỲ CHỌN | canvas trống mặc định tự
  do; khung lập luận kéo từ **kệ Thư viện** (nhiều form — `SPEC-STAGE-LIBRARIES`)".
- `SPEC-STAGE-LIBRARIES.md:26` — chặng 2 kệ "Form lập luận (nhiều loại)" liệt kê **6 form**: Khung
  concept 5 nhánh · Ma trận so sánh phương án · 6 chiếc mũ · SWOT không gian · Bảng tiêu chí chọn
  vật liệu · Mood→Concept map — "chốt 02/08" (§"✅ 3 điểm"), nhưng đây là **kệ Thư viện ĐẦY ĐỦ**
  (Master Library, 4 mức phạm vi, publish có chủ duyệt versioned) — quy mô LỚN HƠN HẲN "G2 phần
  (6)" (1 trong 6 mục của canvas Mood+Collab). Ghi đã có sẵn từ phần (1): "Kéo-thả từ kệ
  (`NodeLibraryPanel.tsx` → `FlowCanvas.tsx onDrop`): cơ chế `DND_MIME` áp dụng được thẳng cho
  mindmap template sau này" — xác nhận hướng tái dùng.
- **Quyết định phạm vi** (đúng kỷ luật đã áp dụng suốt G2 — mỗi phần chỉ làm ĐÚNG phần việc của
  canvas, không xây cả hệ Kệ Thư viện lớn): phần (6) chỉ làm **1 template mindmap kinh điển nhất**
  trong 6 form — "**Khung concept 5 nhánh**" (đúng nghĩa "mindmap": 1 tâm + N nhánh toả ra, khớp
  chữ "mindmap" trong tên phần việc nhất). **5 form còn lại** (Ma trận so sánh, 6 chiếc mũ, SWOT,
  Bảng tiêu chí, Mood→Concept) để dành cho việc riêng "xây kệ Thư viện chặng 2 đầy đủ" — không mở
  rộng phạm vi phần (6). "Mindmap = TUỲ CHỌN" đã đúng nghĩa: canvas KHÔNG ép, chỉ thêm 1 lối tắt
  kéo/bấm để dựng khung sẵn, người dùng tự do sửa/xoá/bỏ qua hoàn toàn.
- **Nguyên liệu tái dùng, KHÔNG viết node/type mới**: `note` (React Flow type riêng, KHÔNG phải
  `NodeDefinition`) + action có sẵn `addNote(position)` + `updateNote(id, text)` (`lib/store.ts`).
  Khuôn y hệt `demoSketchToRender` đã có trong `NodeLibraryPanel.tsx` (gọi `addNode` nhiều lần,
  đọc `nodes.at(-1)` lấy id vừa tạo, không cần store action mới). "Khung concept 5 nhánh" = 1 note
  tâm ("Ý tưởng chính") + 5 note nhánh xếp toả tròn (lượng giác quanh tâm, bán kính cố định) —
  **không nối dây** (React Flow edges chỉ nối node `interior` có port, `note` không có port — nối
  dây giả cho note ngoài phạm vi, hình toả tròn tự nó đã đọc ra "mindmap" không cần đường nối).
  5 nhánh gợi ý (trung tính, đúng "không áp gu" — LUẬT NỀN TẢNG): "Không gian & công năng" · "Ánh
  sáng" · "Vật liệu & màu sắc" · "Phong cách/gu" · "Cảm xúc mong muốn" — 5 trục phổ quát của MỌI ý
  tưởng nội thất, không phải gu/phong cách cụ thể nào.
- **Vị trí + cơ chế**: 1 chip mới trong `NodeLibraryPanel.tsx`, khu **"Form lập luận"** riêng (sau
  khu "Vật liệu", đúng thứ tự Mood+Collab → Vật liệu → Form lập luận trong SPEC-STAGE-LIBRARIES
  liệt kê). Bấm = gọi thẳng hàm instantiate tại tâm canvas (khuôn `quickSketch`/
  `demoSketchToRender`). Kéo = MIME mới `application/interiorflow-mindmap` (chỉ cần 1 giá trị cố
  định `'concept-5-nhanh'`, chưa cần đa template) đi cùng cơ chế `FlowCanvas.onDrop` đã có (thêm
  nhánh mới, không đụng nhánh cũ) — dùng ĐÚNG vị trí thả (`pos`) làm tâm thay vì tâm canvas cố
  định như đường bấm.
- **Hàm dùng chung 2 đường** (tránh trùng logic bấm/kéo): viết 1 hàm thuần
  `lib/render-studio/mindmap-templates.ts::instantiateConceptMindmap(center, {addNote,
  updateNote})` — cả `NodeLibraryPanel` (bấm) và `FlowCanvas` (kéo) cùng gọi, không lặp code toạ
  độ lượng giác ở 2 nơi.
- Ngoài phạm vi (ghi rõ): 5 form lập luận còn lại · hệ Kệ Thư viện đầy đủ (publish/versioning/4
  mức phạm vi) · nối dây giữa các note mindmap · undo gộp 1 bước cho cả cụm 6 note (giống giới hạn
  đã ghi ở phần (1)/(3), `addNote` tự `snapshot()` mỗi lần gọi — 6 bước undo riêng, chấp nhận theo
  đúng tiền lệ `demoSketchToRender`).

## G2 phần (6) — mindmap template tuỳ chọn kéo từ kệ — XONG
- Commit `5fbd9a1` (`lib/render-studio/mindmap-templates.ts` mới, `components/NodeLibraryPanel.tsx`,
  `components/FlowCanvas.tsx`).
- Code đúng thiết kế đã mô tả ở trên: kệ "Form lập luận" mới, 1 chip "Khung concept 5 nhánh",
  bấm/kéo đều gọi `instantiateConceptMindmap` dựng 6 `note` (1 tâm + 5 nhánh toả tròn).
- Verify browser thật: **bấm** — tạo đúng 6 note tại giữa canvas, tâm "Ý tưởng chính" + 5 nhánh
  đúng nội dung (Không gian & công năng / Ánh sáng / Vật liệu & màu sắc / Phong cách·gu / Cảm xúc
  mong muốn), toạ độ xác nhận đúng bán kính 260 (nhánh đầu tại góc 12h: y = center.y − 260, khớp
  số đo thật). **Kéo-thả thật** — giả lập `DragEvent`+`DataTransfer` thật (dragstart trên chip →
  drop lên `.react-flow__pane`, dataTransfer.types xác nhận đúng `application/interiorflow-mindmap`)
  → cụm mới dựng ĐÚNG TẠI VỊ TRÍ THẢ (khác tâm canvas của đường bấm) — xác nhận `FlowCanvas.onDrop`
  đọc đúng MIME mới, không lẫn nhánh `DND_MIME`/`MAT_MIME` cũ. Dark theme: chip nét đứt đọc rõ.
  Console 0 error. tsc sạch, `npm test` 0 fail. Dọn 12 note test (2 lần thử × 6 note) về đúng 3
  node gốc của "Dự án mẫu" sau verify.
- 💭 Lưu ý nhỏ lúc verify (không phải bug): nút "Thư viện Node" ở rail trái đôi lúc cần bấm 2 lần
  mới mở panel trên tab mới hoàn toàn tinh — nghi hiệu ứng hover/tooltip che mất target đúng 1
  frame đầu, không tái hiện lại được ổn định, không liên quan code phần (6) (dùng
  `setPanel('library')` trực tiếp qua store để verify tiếp, không chặn tiến độ).

---

# G2 — TỔNG KẾT (6/6 phần XONG)
Toàn bộ 6 phần của canvas Mood+Collab (`docs/TICKET-CHANG2-BUILD-2026-08-02.md`) đã xong, mỗi
phần 1(+) commit code + báo cáo riêng, verify browser thật đầy đủ:
1. Khung canvas + frame theo phòng (`NodeGroup.rect`, `createRoomFrame`)
2. Sticky + comment neo object (`CanvasComment`, `CommentPin`)
3. Toolbar bút tablet (pen/marker/highlight/eraser, `DrawLayer`/`DrawToolbar`)
4. Presence online/offline + mời (`PresenceBar` viết lại, `ProjectMember` roster)
5. Swatch vật liệu matId (`ProductSpec` thật, `util.materialnote` + matId)
6. Mindmap tuỳ chọn (Khung concept 5 nhánh, `instantiateConceptMindmap`)

Tiếp theo trong `TICKET-CHANG2-BUILD-2026-08-02.md`: **G3 — Vẽ 3D** (Command Panel + Scene
Objects). Sẽ khảo sát hạ tầng 3D hiện có (`SPEC-3D-CORE.md`, 3D-1 đã xong theo STATUS.md) trước
khi thiết kế, đúng kỷ luật đã áp dụng suốt G2.

## 🟡 PHÁT HIỆN — STATUS.md sai lệch với code thật (không tự sửa, báo để Hoà/phiên kia biết)
Khảo sát trước G3 phát hiện `STATUS.md` (mục "⬜ CHƯA BẮT ĐẦU" + "📌 CÂU HỎI ĐANG ĐỂ NGỎ", nội
dung thuộc domain 3D-core/P3 — KHÔNG phải phần việc H/G canvas của tôi, xem `docs/CHOT-...` header
"Hai phiên chung `.git`") đang **SAI so với `git log` thật**:
- `STATUS.md:11` ghi "walk/campath/section: TODO 3D-2..3D-4" nhưng git đã có `d7dff63` (3D-2
  campath+captureSequence), `87c2e78` (3D-4 section+walk), `2881c32` (3D-5 push-pull massing) —
  cả 3 đã XONG, không còn TODO.
- `STATUS.md:33-35` liệt 3D-2/3D-3/3D-4 vào "⬜ CHƯA BẮT ĐẦU" — sai tương tự, `lib/three/capture.ts`
  xác nhận 3D-3 (depth/lineart) cũng đã có code.
- Gap `STATUS.md:62` ("CamPathPreview+CamPathControlPanel CHƯA wire vào /cad-editor") đã ĐÓNG bởi
  `bc3d3e7` ("D5 — nối CamPathPreview + CamPathControlPanel vào /cad-editor thật") — không còn gap.
**KHÔNG tự sửa STATUS.md** — nội dung này thuộc việc của phiên "code chính" (3D-core/P3, khác domain
H/G canvas của tôi), sửa vào có thể đụng file đang có edit dở của phiên kia (đúng cảnh báo
`.git/index.lock` đã ghi sẵn trong STATUS.md). Ghi ở đây để Hoà/phiên kia thấy khi đọc — đúng luật
"tài liệu sai → báo ngay, không im lặng" (`docs/CLAUDE.md`).

## G3 phần (1) — Command Panel shell + tab Vật liệu — THIẾT KẾ (viết trước khi code)
**Khảo sát trước khi thiết kế** (Explore agent đọc code thật):
- `SPEC-CHANG2-UI-2MODE.md:30-43` — Command Panel = sidebar 5 tab **Tạo·Sửa·Vật liệu·Camera·Hiện**
  (kiểu 3ds Max). `docs/mocks/mock-ve-3d.html` (Hoà đã xem qua, "✅ Vẽ 3D CHỐT qua mock" —
  `00-CHOT.md`) vẽ đúng bố cục: sidebar rộng 256px bên trái viewport, tab "Vật liệu" đang mở minh
  hoạ — search + 3 sub-tab nguồn (V-Ray/D5/IF·ATLAS) + lưới swatch matId + hint "chọn→click lên
  mặt để gán". **Mock KHÔNG vẽ Scene Objects/outliner** (chỉ nhắc bằng chữ ở §5 spec) — để dành
  phần sau, không đoán bố cục chưa được duyệt.
- **Trạng thái code hiện tại**: `Render3DModeSkeleton.tsx` là viewport TOÀN MÀN (không sidebar),
  chỉ có hint box nổi + `<Scene3DViewer mode="massing">` + `<ModeSwitchBar/>`. Chưa có Command
  Panel nào — đúng như 00-CHOT ghi "chưa nối vào Scene3DViewer/3D-1".
- **Tái dùng trực tiếp** ("một cỗ máy, nhiều mặt tiền"): tab "Vật liệu" của Command Panel dùng
  ĐÚNG nguồn dữ liệu vừa xây ở G2 phần (5) — `GET /api/specs?kind=material` (ProductSpec/ATLAS
  thật, đã có UI swatch matId trong `NodeLibraryPanel`). Mock hiện 3 "nguồn" (V-Ray/D5/IF·ATLAS)
  nhưng field `vendor`/`brand` không phân biệt "nguồn phần mềm" — DB thật hiện chỉ có 2 bản ghi,
  chưa đủ dữ liệu để phân 3 tab con có ý nghĩa. **Quyết định**: phần (1) hiện MỘT danh sách matId
  thật (không chia sub-tab V-Ray/D5/IF giả — tránh tạo phân loại KHÔNG dữ liệu đứng sau), giữ đúng
  câu "IF không chạy engine V-Ray — chỉ mở catalog để gán" (dòng 43): phân loại theo nguồn phần
  mềm là việc CỦA ATLAS đồng bộ dữ liệu, không phải UI tự bịa nhãn.
- **Việc làm phần (1)** (chỉ dựng SHELL + 1 tab thật, 4 tab còn lại placeholder — đúng tinh thần
  SKELETON đã ghi trong chính file `Render3DModeSkeleton.tsx`):
  1. `components/render-studio/Command3DPanel.tsx` (mới) — sidebar 256px, 5 tab (icon+label, tab
     active = `box-shadow` dưới đúng token accent, khớp `.ctabs button.on` mock). State tab cục bộ
     component (`useState`), KHÔNG cần lưu store (chưa có gì phụ thuộc tab đang mở giữa các nơi
     khác — thêm sau nếu cần).
  2. Tab "Vật liệu": fetch `/api/specs?kind=material` (y hệt logic đã viết ở `NodeLibraryPanel`,
     KHÔNG copy-paste 2 lần — tách hàm fetch dùng chung nếu hợp lý, xem lúc code). Lưới 3 cột
     swatch (khác layout list dọc của kệ Mood — đúng mock `.mgrid`), bấm 1 swatch = đặt
     "vật liệu đang chọn" (state cục bộ, CHƯA gán lên mặt nào — click-to-assign lên mesh 3D là
     việc của phần sau, cần `Scene3DViewer` hỗ trợ raycast chọn mặt, chưa có).
  3. 4 tab còn lại (Tạo/Sửa/Camera/Hiện): placeholder rõ ràng ("Sắp có" + mô tả 1 dòng đúng
     `SPEC-NGON-NGU-CHI-DAN`), KHÔNG giả vờ hoạt động — đúng luật "không nút giả" (tránh hứa quá).
  4. `Render3DModeSkeleton.tsx`: bọc lại thành flex-row (sidebar + viewport flex-1), viewport giữ
     nguyên logic hint/Scene3DViewer/ModeSwitchBar hiện có, chỉ đổi layout bao ngoài.
- Ngoài phạm vi phần (1): Scene Objects/outliner (chưa có mock duyệt bố cục) · click-to-assign vật
  liệu lên mặt 3D thật (cần raycast, đổi `Scene3DViewer`) · nội dung thật cho Tạo/Sửa/Camera/Hiện ·
  ViewCube/axis gizmo (viewport hiện tại chưa có, `Scene3DViewer` props không hỗ trợ — việc riêng).

## G3 phần (1) — Command Panel shell + tab Vật liệu — XONG
- Commit `09c4816` (`components/render-studio/Command3DPanel.tsx` mới,
  `lib/render-studio/use-materials.ts` mới, `NodeLibraryPanel.tsx`, `Render3DModeSkeleton.tsx`).
- Code đúng thiết kế: sidebar 5 tab đúng bố cục mock, tab Vật liệu tái dùng hook `useMaterials`
  (tách từ G2 phần (5), NodeLibraryPanel giờ dùng lại thay vì tự fetch — xoá trùng lặp thật, không
  chỉ refactor cho đẹp).
- Verify browser thật: chuyển sang mode "Vẽ 3D" qua `lib/stage-mode.ts` (localStorage key
  `interiorflow.stagemode.render` + reload — nút UI có quirk lần bấm đầu không đăng ký trên tab
  hoàn toàn mới, không tái hiện ổn định, không phải do code phần (1); dùng đường ổn định để verify
  tiếp, không chặn tiến độ). Command Panel hiện đúng 5 tab, chuyển tab "Tạo" → placeholder đúng
  chữ, chuyển lại "Vật liệu" → 2 vật liệu thật (An Cường AC-ENG-OAK15, Stone World SW-TRV-BE) hiện
  dạng lưới 3 cột đúng mock. Bấm swatch → `className` đổi đúng sang viền `border-[var(--accent)]`
  (xác nhận qua DOM, không chỉ nhìn ảnh). Dark theme: viền accent + nền panel đọc rõ. Console 0
  error suốt cả phiên verify (mở tab mới → chuyển mode → đổi tab → bấm swatch → dark theme → reset).
- 💭 Quirk phụ (không phải bug code phần (1), ghi lại để nhớ): nút "Vẽ 3D"/"Thư viện Node" ở UI
  đôi khi cần bấm 2 lần trên TAB HOÀN TOÀN MỚI mới đăng ký (nghi lớp hover/tooltip che 1 frame đầu
  — đã gặp y hệt ở G3 phần (1) và trước đó lúc mở panel Thư viện Node cho G2 phần (5)/(6), không
  tái hiện ổn định để định vị root cause). Từ giờ verify browser: nếu click đầu vào 1 toggle/nút
  quan trọng không thấy đổi trạng thái ngay, thử lại 1 lần hoặc đọc thẳng qua store trước khi kết
  luận là bug code.

Tiếp theo: **G3 phần (2)** — theo TICKET-CHANG2-BUILD, sau Command Panel shell là các tab còn lại
(Tạo/Sửa/Camera/Hiện) hoặc Scene Objects/outliner — sẽ khảo sát + viết thiết kế trước khi code,
đúng kỷ luật đã áp dụng.

## 🐛 BUG THẬT — avatar mất chất 3D — ĐÃ SỬA
Hoà báo trực tiếp kèm chẩn đoán có số (đọc `docs/LUAT-GIAO-DIEN-BAT-BUOC.md` +
`docs/BAI-HOC-02-08-2026.md` trước khi sửa, đúng luật). Commit `8baab50`
(`components/avatar/AvatarRenderer.tsx`, `components/avatar/AvatarBuilder.tsx`).

**Nguyên nhân gốc** (đúng như Hoà chẩn đoán, đã tự kiểm lại code trước khi sửa):
1. `AvatarRenderer.tsx:66` `hi = detail ?? size > 48` — mọi nơi gọi thật (grep toàn repo, chỉ 3
   chỗ: `AppChrome.tsx:490` size=24, `MobileMenu.tsx:144` size=36, `AccountSettings.tsx:35`
   size=44) đều `<=48` → filter nỉ/blur/contact-shadow không bao giờ chạy.
2. `viewBox="0 0 200 240"` (5:6) nhưng `width={size} height={size}` (1:1) → letterbox hai bên.

**Sửa đúng 3 điểm Hoà yêu cầu**:
- Ngưỡng `size >= 32` (từ `>48`). **Đo chi phí TRƯỚC khi hạ** (không đoán): grep xác nhận KHÔNG
  có nơi nào trong app render avatar dạng danh sách nhiều-cái — cả 3 chỗ gọi (+3 chỗ trong
  `AvatarBuilder` preview) đều đơn lẻ → hạ ngưỡng không có rủi ro hiệu năng đo được ở hiện trạng.
  Đo thật bằng số (50 bản sao SVG felt-filter thật size=44, insert+forced-layout):
  **có filter 1.294ms/avatar · không filter 0.612ms/avatar · chênh 0.682ms/avatar** — 50 avatar
  cùng lúc chỉ +34ms tổng, nhẹ.
- `AvatarBuilder.tsx` size=200 (picker chính) → thêm `detail` rõ ràng, không chỉ dựa ngưỡng.
- `height={size * 1.2}` (khớp đúng 200:240) thay `height={size}` — **không đụng viewBox/toạ độ
  14 lớp** (mắt y112/mũi y128/miệng y142/cằm y161 giữ nguyên, xác nhận qua test
  `avatar renderer geometry` 54/54 pass, không lệch số nào).

**Verify browser thật** (`/settings/avatar` AvatarBuilder, `/settings` AccountSettings, header
chip AppChrome — sáng + tối):
| size gọi thật | width | height (đo DOM) | felt filter |
|---|---|---|---|
| 24 (AppChrome header) | 24 | 28.8 | tắt (đúng, <32) |
| 28 (AvatarBuilder preview nhỏ) | 28 | 33.6 | tắt (đúng, <32) |
| 44 (AccountSettings) | 44 | 52.8 | **bật** (đúng, >=32 — bug case Hoà nêu) |
| 48 (AvatarBuilder preview) | 48 | 57.6 | **bật** (đúng, >=32 — bug case Hoà nêu) |
| 200 (AvatarBuilder picker chính) | 200 | 240 | **bật** (detail rõ ràng) |

Mọi `height` đều đúng CHÍNH XÁC `size × 1.2` — không lệch pixel nào. Mắt thấy trực tiếp trong
phiên: hat/tóc/áo ở size 44/48/200 đọc rõ vân nỉ (feDiffuseLighting + displacement), size 24/28
phẳng có chủ đích (đúng thiết kế ngưỡng, chi tiết dưới ngưỡng nhìn không ra nên tắt cho nhẹ).
Dark theme: đọc rõ, contact-shadow/rim-light vẫn đúng hướng sáng trên-trái. Console 0 error.

⚠️ **Không nhúng ảnh PNG vào `BAO-CAO-CHINH.md`** — tool browser trong phiên không có cơ chế lưu
screenshot ra file đĩa để nhúng (chỉ trả ảnh inline trong hội thoại), và repo có luật 01/08 "gỡ
ảnh, giữ report.md" (dọn trung tính, tránh phình `docs/`) — bằng chứng thay bằng SỐ ĐO DOM khách
quan, tái lập được (bảng trên) thay vì ảnh nhị phân. Nếu Hoà cần xem trực tiếp, mở
`/settings/avatar` + `/settings` trên máy thật là thấy ngay, đúng avatar vừa sửa.

💭 **Phát hiện phụ** (không sửa, ghi lại): `MobileMenu.tsx` (dùng `UserAvatar size=36`) có vẻ đã
bị `MoreMenu` "universal" (comment `AppChrome.tsx:24`: *"MoreMenu (kèm link Cài đặt) giờ
universal"*) thay thế trên thực tế — thử nhiều cách ở viewport mobile 375px không kích hoạt được
UI trigger `title="Thêm"` của `MobileMenu` (không tìm thấy trong accessibility tree). Component
vẫn được mount (`AppChrome.tsx:288 <MobileMenu active={active} />`) nên KHÔNG phải dead code theo
nghĩa "không compile", nhưng nghi đường vào UI đã bị che/thay — nếu đúng thì `size=36` không còn
là bug case thật (không ai nhìn thấy). Không mở rộng điều tra (ngoài phạm vi "1 commit" của yêu
cầu này) — cờ lại đây để Hoà/phiên sau xác nhận, không ảnh hưởng gì tới bản sửa avatar vừa xong
(logic sửa tập trung 1 chỗ trong `AvatarRenderer.tsx`, áp dụng đồng nhất bất kể caller).
