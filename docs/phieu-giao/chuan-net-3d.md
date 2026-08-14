# PHIẾU GIAO · CN — bước CHUẨN NÉT: mesh máy sinh → hình học tham số + xuất FBX/OBJ cho 3ds Max

## THẺ VAI [Đ4]
- VAI: CN — agent hình học, thi công entry `chuan-net-3d` (Hoà đặt 14/08), proof trên `scratchpad/lincoln-327.glb` sẵn có. 0 job AI — thuần hình học.
- PHẠM VI/TRẦN: `lib/idfc-import/**` (chuan-net.ts + test + xuất) · `lib/three/build-ops.ts` CHỈ GỌI (kho 9 hàm sweep/revolve/lathe/torus — KHÔNG sửa ruột) · script proof scratchpad · báo cáo. KHÔNG đụng UI/models.ts.
- BIÊN → DỪNG: fit primitive là R&D — phần nào fit KHÔNG nổi (nệm cong tự do) thì GIỮ MESH làm sạch + khai thật, cấm ép fit sai; .max format đóng — KHÔNG cố ghi, xuất FBX/OBJ + ghi hướng dẫn import Max 3 dòng.
- ĐIỀU KHOẢN RUỘT: [T6] đo được: poly trước/sau, số mảnh tách, sai số fit (khoảng cách mesh↔primitive) in ra số · [T0] cờ từng phần: primitive-fit (tham số, chỉnh được) vs mesh-giữ (làm sạch) · [T2] rebuild qua build-ops sẵn.

## ② ĐỌC TRƯỚC
`docs/bao-cao-phien/2026-08-14-GI-ghe-3d.md` (mesh 15.538 tam giác, 1 khối liền) · `lib/three/build-ops.ts` (chữ ký 9 hàm + BuildOp union model.ts:449+) · `lib/idfc-import/` (glb-stats, from-photo — nối tiếp) · three.js exporters có sẵn trong node_modules (OBJExporter? kiểm examples/jsm/exporters — GLTF/OBJ/STL/PLY; FBX KHÔNG có trong three → FBX ASCII tự sinh mức mesh+material cơ bản nếu khả thi không dep, không thì OBJ+MTL là đường chính, khai rõ).

## ④ VIỆC (marker `chuanNet`)
1. `chuanNet(glb): ChuanNetResult` — pipeline: ①parse GLB (đường glb-stats sẵn) ②tách connected components ③detect shadow-blob: mảnh có bbox dẹt (h < 2% tổng), nằm đáy, màu tối/không texture chair → XOÁ (log) ④fit primitive heuristic cho từng mảnh trục-đối-xứng: cylinder (chân/thanh — PCA trục + bán kính trung bình + sai số), torus (vòng — fit tâm/bán kính lớn-nhỏ), mảnh đạt ngưỡng sai số (<2% bbox) → thay bằng BuildOp record {loai, thamSo} + mesh sinh lại từ build-ops; mảnh không đạt → mesh giữ, weld + bỏ đỉnh trùng.
2. Poly budget: đếm trước/sau; mesh-giữ decimate nhẹ nếu có đường sẵn (three có SimplifyModifier trong examples — dùng được thì dùng, không thì bỏ qua, khai).
3. Xuất: `lincoln-327-chuannet.obj` (+.mtl) bắt buộc · `.fbx` ASCII nếu tự sinh được không dep · JSON recipe {parts: [{loai:'torus', thamSo…}|{loai:'mesh', ref}]} — chính là "gọi bằng hàm số", nạp lại chỉnh tham số được.
4. Proof chạy thật trên lincoln-327.glb: in bảng — số mảnh, mảnh bóng xoá, mảnh fit được (loại+tham số+sai số), poly 15.538→?, file ra scratchpad.
5. Test thuần (fixture torus/cylinder tự sinh → fit đúng tham số ±1%) · tsc 0.

## ⑦
Báo cáo docs/bao-cao-phien/2026-08-14-CN-chuan-net.md. Trả T ≤12 dòng: bảng proof + đường Max khuyến nghị + phần fit không nổi khai thật.
