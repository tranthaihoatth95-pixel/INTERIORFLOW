# PHIẾU GIAO VIỆC — P · `hieu-nang-do` (ĐO hiệu năng có số) — Đợt 5, 13/08/2026

## ① BỐI CẢNH NGÀNH
Trụ 7 (Hiệu năng & bền) ĐÓI 2 đợt liên tiếp = cảnh báo đỏ theo HOP-DONG §6 — đợt này bắt buộc bù. Bản vẽ nội thất thật dày (5.000+ entity), scene 3D thật nặng (100k+ tam giác) — IF chưa có MỘT CON SỐ nào về điểm gãy. R1 Cửa B không đóng được nếu không đo. Đây là việc ĐO, không phải việc TỐI ƯU — ra bảng số + xác định điểm gãy, việc sửa là đợt sau.

## ② ĐỌC TRƯỚC
1. `lib/cad/model.ts` (cấu trúc Doc/entity — cách sinh Doc lớn bằng code) + `lib/cad/` các hàm nặng đã biết: `findHatchBoundary` (docs/TECH-DEBT.md ghi có thể chậm).
2. `lib/three/cad-to-obj.ts` `docToObjScene` + `lib/three/build-ops.ts` `resolveGroupGeometry` (đường dựng geometry).
3. `lib/three/build-recipe.ts` `evalRecipe` (mới đợt 4 — đo luôn recipe dài).
4. Khuôn test hiện có (`*.test.ts` chạy qua sucrase-node) — bench viết cùng khuôn, chạy bằng node, KHÔNG cần browser.
5. `docs/TECH-DEBT.md`.

## ③ VÙNG FILE
ĐƯỢC: `scripts/bench/**` (MỚI) · `docs/bao-cao-phien/2026-08-13-P-hieu-nang-do.md`.
CẤM: MỌI file ngoài đó — phiếu này KHÔNG sửa code sản phẩm; phát hiện chỗ chậm thì GHI vào báo cáo, không tự vá.

## ④ VIỆC
1. **Sinh dữ liệu đo** `scripts/bench/sinh-doc-lon.mjs` (hoặc .ts chạy qua sucrase-node): Doc 5.000 entity hỗn hợp (tường/phòng/block/hatch/dim tỉ lệ thật của một mặt bằng lớn), tất định (seed cố định, không Math.random không seed).
2. **Bench 2D** `scripts/bench/bench-2d.ts`: thời gian parse/serialize round-trip Doc lớn · các hàm nặng (findHatchBoundary trên bản vẽ dày, hit-test, room boundary) — mỗi phép đo lặp ≥5 lần lấy median, in bảng.
3. **Bench 3D** `scripts/bench/bench-3d.ts`: docToObjScene từ Doc 5.000 entity · resolveGroupGeometry/evalRecipe với recipe 10 bước · tổng tam giác sinh ra (đếm thật) — mốc 100k tam giác đạt chưa, thời gian bao nhiêu.
4. **Bảng số + điểm gãy** trong báo cáo: ma trận kích thước (500/2.000/5.000 entity) × thời gian; chỗ nào tăng phi tuyến = điểm gãy, ghi rõ hàm nghi phạm + bằng chứng số. Kèm 1 lệnh `node …` chạy lại được toàn bộ.
5. Kệ ảnh 1.500 món (ảo hoá) KHÔNG đo được bằng node thuần — ghi rõ "cần browser, hàng đợi", không bịa số.

## ⑤ RÀNG BUỘC
Không git · không dev server · không prisma · không sửa code sản phẩm · máy đo phải TẤT ĐỊNH và chạy lại được một lệnh.

## ⑥ NGHIỆM THU TỰ LÀM
```
npx tsc --noEmit   # cây không vỡ vì file bench
node_modules/.bin/sucrase-node scripts/bench/bench-2d.ts   # dán bảng số
node_modules/.bin/sucrase-node scripts/bench/bench-3d.ts   # dán bảng số
```

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-13-P-hieu-nang-do.md` — bảng số nguyên văn + điểm gãy + nghi phạm; khuôn 2 giá trị §1c.

## ⑧ DÂY MÁY
Entry `hieu-nang-do` (dir docs/bao-cao-phien, mẫu hieu-nang-do|benchmark-if). Không tự sửa registry.
