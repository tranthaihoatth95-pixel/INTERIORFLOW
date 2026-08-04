# ĐỢT 9 — BƠM CĂNG (04/08) · 6 phiên song song

Điều kiện đã sạch: `nhanh-phu` và `nhanh-g4` **ĐÃ MERGE** vào main (kiểm bằng
`git merge-base --is-ancestor`, luật V5 — không tin `git log`). BOQ lib đã vào main `892c927`.

## LUẬT CHUNG CHO CẢ 6 PHIÊN
1. Đọc `docs/00-BAT-DAU-DOC-DAY.md` trước — đặc biệt **§5 luật N6** (component mới phải dán
   grep chứng minh có nơi mount) và **§9** (thiết kế trước, tính năng fill sau).
2. **KHÔNG đụng file ngoài vùng của mình** (bảng dưới). Đã dính merge conflict 2 lần.
3. Làm xong VIỆC ĐẦU thì DỪNG, báo cáo, chờ lệnh. Không làm một cục.
4. `npx tsc --noEmit -p .` sạch trước khi báo xong. Ghi hash vào `SO-KIEM-TONG.md` (append-only).
5. Verify bằng browser thật, chụp màn hình. Luật N1: báo cáo KHÔNG phải bằng chứng.

## PHÂN VÙNG FILE — cấm chồng lấn
| Phiên | Việc | Vùng file ĐỘC QUYỀN |
|---|---|---|
| **P1 · DWG** | bug nhập DWG treo vĩnh viễn | `lib/cad/dxf*` · `lib/cad/import*` |
| **P2 · SHEET** | multi-sheet đợt 8 | `components/cad/CadSheets.tsx` · `components/present-editor/PresentSheets.tsx` · `lib/cad/model.ts` · `lib/cad/sheet-migrate.ts` |
| **P3 · KHO** | kho vật liệu v1 | `prisma/schema.prisma` · `lib/materials/*` · `components/materials/*` |
| **P4 · BOQ** | BOQ editor UI | `components/boq/*` · `app/(boq)/*` |
| **P5 · 3D** | bộ lệnh dựng hình | `lib/three/*` · `components/render-studio/Command3DPanel.tsx` |
| **P6 · UI** | icon emoji + empty states | `components/ProjectSelect.tsx` · `components/ui/*` |

⚠️ P2 dùng `lib/cad/model.ts`, P3 dùng `prisma/schema.prisma` — HAI FILE KHÁC NHAU, không đụng nhau.
