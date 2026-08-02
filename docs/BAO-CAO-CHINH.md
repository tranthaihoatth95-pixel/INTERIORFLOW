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

## HÀNG ĐỢI CÒN LẠI (ghi đè mỗi lần xong 1 việc — nguồn sự thật duy nhất, không sống trong chat)
- **C5** (V1.1 so le nội thất theo khoảng cách tới cửa chính) — ĐANG LÀM.
- **C6** (gỡ brand-kit trùng khỏi repo chính) — **CHỜ**: đã kiểm `~/Downloads/interiorflow-phu`
  (worktree `nhanh-phu`) — `docs/BAO-CAO-PHU.md` CHƯA tồn tại, `git log` trên nhánh đó cũng không
  thấy commit VIỆC 5 mới (chỉ có 2 commit cũ 31/07). Điều kiện Hoà đặt ra CHƯA thoả — không chạy
  `git checkout --` xoá bản trùng. Sẽ tự kiểm lại khi quay lại hàng đợi này (sau C5).
