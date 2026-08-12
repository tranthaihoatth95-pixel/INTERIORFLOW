# PHIẾU focus-entity + tạo-việc-từ-đây (nhánh 2D + Trình chiếu) — khép vòng Phiếu 1
①NGÀNH: "junior 9h bấm việc → rơi đúng bức tường, không phải hỏi ai" — deep-link đã ship 12/08 nhưng các chặng CHƯA ĐỌC ?focusEntity; chiều ngược chưa có.
②ĐỌC TRƯỚC: lib/tasks/context.ts (buildTaskDeepLink — interface T đã chốt) · components/tasks/TaskBoardScreen.tsx (chip .tb-ctx) · components/cad/CadEditor.tsx (cách select entity: grep selection/setSelection trong lib/cad/store) · components/present-editor/PresentEditor.tsx (cách chọn trang/element).
③VÙNG FILE: components/cad/** · components/present-editor/** (phần nhỏ) · lib/cad/store nếu cần action select · lib/tasks/** helper dùng chung. KHÔNG đụng render-studio (nhánh 3D do agent D làm), KHÔNG đụng globals.css, ProjectSelect.
④VIỆC: (1) 2D đọc ?focusEntity= khi mount [marker: focusEntity]: entity tồn tại → select + zoom tới; không tồn tại → toast nhẹ "Đối tượng không còn trong bản vẽ", không chặn. (2) Trình chiếu đọc focusEntity dạng trang/element tương tự (mức trang là đủ v1). (3) "Tạo việc từ đây" [marker: taoViecTuDay]: ở 2D — mục trong menu chuột phải trên đối tượng (RadialToolMenu/context menu sẵn có, đọc trước cách menu mount) + ở Trình chiếu — nút nhỏ trong Inspector trang; gọi POST /api/tasks {title gợi ý theo tên đối tượng/trang, stage đúng chặng, entityId} → toast "Đã tạo việc" kèm mở Bảng việc.
⑤RÀNG BUỘC: không git · không server · token globals · nhãn ≤12 từ · KHÔNG đẻ API mới.
⑥NGHIỆM THU: tsc 0 · test tasks/cad liên quan pass · tự viết 1 test unit cho helper parse focusEntity nếu tách hàm.
⑦BÁO CÁO: docs/bao-cao-phien/2026-08-12-W-focus-entity.md (khuôn chuẩn + 2 GIÁ TRỊ).
⑧DÂY MÁY: focus-entity-doc · tao-viec-tu-day (nhánh 2D+Present). Agent KHÔNG sửa registry.
