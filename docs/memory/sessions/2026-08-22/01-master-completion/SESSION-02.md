# SESSION-02 · 3D CÒN LẠI + FORM + AI FORM

MISSION
Đóng các khe hở dựng hình CÒN THẬT của 3D, rồi mở đường AI → Công Thức Hình có kiểm soát.

START COMMIT: 83ff452

GREEN — DON'T TOUCH
Dựng Hộp/Tường/Trụ bằng cử chỉ · chọn · dời · xoay · xoá · hoàn tác · Boolean · Array · Bevel ·
gizmo bám vật · Form Recipe gom theo ý định. Xem GREEN trong README.

OPEN
1. SCALE / RESIZE — hiện KHÔNG CÓ (lib/cad/geometry.ts chỉ có translate/rotate/mirror).
   Vật SEMANTIC nên đi bằng số nghề: Tường → Dài/Cao/Dày; Tủ → W/H/D.
   Khối chung cần SCALE THẬT hoặc TAY NẮM KÍCH THƯỚC THẬT. CẤM nút Scale giả.
2. CHI TIẾT: kiểm khe hở thật (chọn theo MẶT, Inset). Làm bộ NHỎ NHẤT đủ dùng nghề, đừng nổ phạm vi.
3. FORM: giữ BuildRecipe. Lăng kính SHAPE/STRUCTURE/DETAIL/HISTORY.
   Bend và Shell KHÔNG tồn tại trong BuildOp union — phải nói thật, cấm bịa.
4. AI FORM (wave lớn): Ngôn ngữ → phân tích ý định → ĐỀ XUẤT Công Thức Hình có cấu trúc → kiểm
   hợp lệ → kiểm ràng buộc → xem trước bóng ma → NGƯỜI áp dụng → CÙNG BuildRecipe.
   AI KHÔNG được sinh mã tuỳ ý thành hình học (hiến pháp luật 8, docs/CLAUDE.md).
   MVP: "Tạo quầy lễ tân dài 3.2m, cao 1.05m, sâu 700mm, hai đầu bo R400, mặt trước nghiêng 8 độ,
   chân âm 120mm, mặt bàn dày 30mm." → lộ tham số → Preview/Apply/Reject/Modify.
   Ý định cần phép chưa có → hiện UNSUPPORTED INTENT, cấm xấp xỉ im lặng.
   Vá vật đang có: đọc selection + recipe + ràng buộc → đề xuất PATCH → nói rõ ĐỔI GÌ / GIỮ GÌ.

FILES TO OPEN
lib/cad/model.ts:490-541          (BuildOp union + BuildRecipe — nguồn sự thật phép dựng)
lib/three/build-recipe.ts         (evalRecipe)
lib/render-studio/form-recipe.ts  (lớp ý định + OP_SUA_DUOC)
lib/render-studio/tool3d.ts       (move/rotate/duplicate/measure THUẦN đã có)
lib/cad/geometry.ts               (thiếu scale — bắt đầu ở đây)
components/render-studio/Command3DPanel.tsx  (BuildRecipeSection)
components/three/Scene3DViewer.tsx           (gizmo · cử chỉ · onPickEntity)

TESTS TO RUN
node_modules/.bin/sucrase-node lib/render-studio/form-recipe.test.ts
node scripts/kiem-3d-contro-that.js gate     # cần dev server :3000
npm test && npx tsc --noEmit

ACCEPTANCE
Khối chung đổi kích thước THẬT (khẳng định bằng doc.entities trước/sau, không bằng pixel).
AI trả về CẤU TRÚC, không phải mã. Ý định không làm được thì nói thẳng.
Vá vật đang có KHÔNG đẻ vật mới.

STOP CONDITION
Nếu AI hạ tầng chưa trả nổi recipe có cấu trúc: dựng HỢP ĐỒNG TẤT ĐỊNH trước, nối AI sau.
Cấm giả lập thành công bằng UI gõ cứng.
