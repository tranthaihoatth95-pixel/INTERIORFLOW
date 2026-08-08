# HỒI SINH SAU RESET QUOTA — đọc file này đầu phiên sau 11/08 12:00

> 08/08 chiều: 8 agent "chia nhau chạy 1 lần cho hết" (lệnh Hoà) chết đồng loạt giữa chừng vì
> HẾT HẠN MỨC TUẦN (reset Thứ Ba 11/08 12:00 trưa, giờ VN). File này là bản đồ nối lại.

## Trạng thái lúc dừng

- **main = `9d8af96`** (23 commit ngày 08/08, CHƯA push — Hoà chạy `git push origin main`).
- **Working tree CÓ ĐỒ DỞ của 5 agent, `npx tsc --noEmit -p .` exit 0** (type-safe, chưa verify,
  CHƯA COMMIT — cố ý, vì tính năng nửa chừng):

| Agent (việc §1 sổ DOI-CHIEU-42-SPEC) | File dở | Chết ở đâu |
|---|---|---|
| B · Vitals docContext (#2) + accent-warm (#13) | `VitalsGesture.tsx` · `VitalsStateBadge.tsx` · `ProjectSelect?` · `globals.css` | đang thêm CSS vùng vitals-state |
| D · Xuất V-Ray/D5 (#7) + lux (#8) | `MaterialPbrEditor.tsx` · `lib/materials/schema.ts` · `lib/lighting/` (test lux ĐÃ 26/26 pass) | đang thêm `reflectance` vào schema |
| E · Màn Bảng việc (#4) | `components/tasks/` · `lib/tasks/` (mới) | đang viết component màn chính |
| F · FM desktop idioms | `files-mock-css.ts` · `lib/filemanager/selection.ts(+test)` | vừa xong helper chọn-nhiều |
| G · Brief nạp PDF (#9) | `AiBriefPanel.tsx` · `lib/cad/brief-file.ts(+test)` | đang viết test |

- **3 agent KHÔNG để lại vết** (chết lúc đọc): A · BuildOp union (#1, ĐÒN BẨY LỚN NHẤT) ·
  C · eyedropper+VCB (#5#6) · H · LinkedAsset recipe (#11).

## Cách nối lại (phiên điều phối sau reset)

1. Đọc `docs/DOI-CHIEU-42-SPEC-2026-08-08.md` §1 — đề bài gốc từng việc nằm ở đó.
2. Với 5 việc có đồ dở: phóng agent MỚI cùng đề bài, thêm câu *"working tree ĐÃ CÓ phần dở
   type-safe của lượt trước — đọc diff (`git diff <file>`) trước, LÀM TIẾP không làm lại"*.
3. Với 3 việc không vết (A/C/H): phóng lại nguyên đề bài theo §1#1, #5+#6, #11.
4. Vùng cấm giữ nguyên: lib/three/lighting|capture, components/three/** (phiếu p7) ·
   components/library/** + lib/cad/idfc.ts (phiên Thư viện đã nhận phiếu .idfc v3 kind preset).
5. Xong con nào: kiểm độc lập (test + tsc + browser 3000) rồi commit con đó — như quy trình 08/08.

## Việc song song còn treo (không thuộc 8 agent)

- Phiên Thư viện: phiếu .idfc v3 `kind preset` + lỗi thẻ a-e (khối dán đã đưa Hoà 08/08).
- Phiên p7 worktree: lighting·camera·phím tắt (`DAN-VAO-p7.md`, nhánh đã lên main mới).
- Phiên p3-mock: đối chiếu mock bằng mắt (khối dán đã đưa Hoà 08/08).
- Hoà: push · video intro · 3 câu chốt (ChatMessage projectId? · Neufert? · chặng 0?) ·
  filter-repo (`scripts/don-git-lich-su.sh`) lúc đã đóng hết phiên.
