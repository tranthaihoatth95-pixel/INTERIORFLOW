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

## ⛔ CẦN HOÀ — C3, C4, C5, C6 chưa có định nghĩa tới được tôi
Tin nhắn giao việc nhắc "C2 (3D-2) → C3 → C4 → C5 → C6 như đã giao" nhưng nội dung C3-C6 không
nằm trong hội thoại này lẫn không tìm thấy trong `docs/*.md` (đã grep toàn bộ). Có thể đã giao
cho phiên/kênh khác (vd Cowork lịch, hoặc code phụ). KHÔNG đoán bừa nội dung — dừng chuỗi ở đây
chờ Hoà/Cowork dán lại C3-C6, hoặc xác nhận 3 việc C1/C2/C7 đã xong là đủ cho đợt này.
