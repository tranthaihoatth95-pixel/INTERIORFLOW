# PHIẾU GIAO · feature-contract-may — P5 FeatureContract máy hoá + soi:contract (bậc 1)

## THẺ VAI [Đ4]
- **VAI:** FC — agent nhánh FeatureContract (DocCore, chuỗi nền P5), máy hoá hợp đồng 4 câu của hệ CẤP 1.
- **PHẠM VI/TRẦN:** cấp F (build-tooling). Vùng: `scripts/contract-registry.mjs` (MỚI) · `scripts/soi-contract.mjs` (MỚI) · `package.json` (1 dòng `soi:contract`) · `docs/FEATURE-CONTRACT.md` (MỚI, ≤60 dòng) · báo cáo.
- **BIÊN → DỪNG:** KHÔNG sửa code app dù thấy kho 0 caller — nối dây là việc của phiếu khác; KHÔNG sửa frontier-registry/thao-tac-registry. Mâu thuẫn giữa sổ cũ và code thật → GHI theo code thật + note.
- **ĐIỀU KHOẢN RUỘT:** [T6] máy soi 2 chiều · [T2] một cỗ máy nhiều mặt tiền — contract là SỔ DÂY của nguyên tắc này · [T0] kiểm bằng grep code thật, KHÔNG chép trạng thái từ sổ 08/08 (nhiều kho đã được mở 12-13/08) · [Đ2] nhìn vào trong trước.

## ① BỐI CẢNH
Anti-pattern #1 Hoà nêu đích danh: "lõi dày, tính năng lẻ tẻ, KHÔNG sợi dây liên kết". Đo 08/08: 14 kho code+test xong mà 0 nơi gọi. FeatureContract 4 câu (Đọc gì · Ghi gì · Để lại công thức gì · Ai ăn theo) đã CHỐT 11/08 nhưng chỉ nằm trong docs. P5 = biến nó thành registry máy-đọc + máy soi: từ nay engine mất dây là máy báo, không đợi ai đối chiếu tay 42 spec nữa.

## ② ĐỌC TRƯỚC
1. `docs/BAN-THIET-KE-HE-THONG-IF-2026-08-13.md` §4 bậc 1 (định nghĩa chính xác của việc này).
2. `docs/DOI-CHIEU-42-SPEC-2026-08-08.md` §1 — bảng 14 kho (SEED, nhưng phải KIỂM LẠI từng kho: #4 tasks và #12 library/FM đã được mở 12/08, có thể còn kho khác đã mở).
3. `scripts/frontier-registry.mjs` + `scripts/soi-frontier.mjs` + `scripts/thao-tac-registry.mjs` — họ máy soi để cùng khuôn (đọc kỹ cơ chế grep/exit/output).
4. `docs/TRIET-LY-IF.md` [T2] + `docs/HOP-DONG-PHOI-HOP-T.md` §9 (5 engine chung).

## ③ VÙNG FILE
Đúng 5 file ở PHẠM VI trên. Ngoài vùng = vi phạm dù sửa đúng.

## ④ VIỆC (marker `anTheo`)
1. **`scripts/contract-registry.mjs`** — mỗi entry: `{ id, ten, doc, ghi, congThuc, anTheo, // 4 câu chữ người đọc
   loi: { file|dir, mau },          // hàm lõi có tên — mất khớp = regress
   day: { dir|dirs, mau, loaiTru }, // grep caller NGOÀI module gốc + ngoài *.test.* — đếm dây thật
   trangThai: 'co-day'|'cho-day' }`.
   Nạp: (a) 14 kho §1 DOI-CHIEU — grep KIỂM TỪNG KHO trạng thái caller HÔM NAY rồi mới ghi co-day/cho-day; (b) các engine 12-13/08: DistillEngine · TableDocEngine · evalRecipe/BuildRecipe · pdfToDeck · packHoSoSong · GroundedRender (reference-sheet + region-inpaint) · suggestScaffold · TaskContext API · soi máy (miễn — không phải feature app, bỏ qua). Mục tiêu **≥20 entry đủ 4 câu**; câu nào không biết thì đọc code/spec liên quan để viết đúng, không viết suông.
2. **`scripts/soi-contract.mjs`** — 2 chiều + 1 sổ: ①entry nào `loi` mất khớp → 🔴 regress ②entry `co-day` mà `day` = 0 khớp → 🔴 mất dây ③entry `cho-day` mà `day` ≥1 khớp → 🔴 sổ quên (kho đã mở mà sổ chưa flip — in gợi ý flip). Kho `cho-day` đúng 0 caller = 🟡 bảng "KHO CHỜ DÂY" xếp theo đòn bẩy (thứ tự trong registry), không tính lệch. Exit 1 chỉ khi có 🔴. Dòng tổng kiểu họ soi.
3. **`package.json`**: `"soi:contract": "node scripts/soi-contract.mjs"`.
4. **`docs/FEATURE-CONTRACT.md`** ≤60 dòng: 4 câu là gì, cách thêm entry (tính năng mới = entry contract NGAY, cùng kỷ luật frontier), cách đọc output, giới hạn bậc 1 nói thẳng (chưa soi được "nút mồ côi" tổng quát — cần map nút→lệnh của hotkey-registry, ghi là việc bậc sau).

## ⑤ RÀNG BUỘC
KHÔNG git · KHÔNG server · KHÔNG dep · Node ESM thuần như họ soi · output tiếng Việt · pattern chạy macOS. Lần đầu có 🔴 sổ-quên/mất-dây là BÌNH THƯỜNG — ghi báo cáo, phân loại đúng, không nới.

## ⑥ NGHIỆM THU TỰ LÀM
`node scripts/soi-contract.mjs` chạy đủ 3 khối + bảng kho chờ dây · đếm entry theo trạng thái ghi báo cáo · `npm run soi:frontier` không vỡ · `npx tsc --noEmit` sạch.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-13-FC-feature-contract.md` — khuôn chuẩn + BẢNG ĐỐI CHIẾU 14 kho cũ: kho nào ĐÃ MỞ từ 08/08 đến nay (bằng chứng grep), kho nào vẫn chờ + output soi:contract lần đầu nguyên văn + khuôn 2 giá trị §1c.

## ⑧ DÂY MÁY
Entry `feature-contract-may` (đợt 7, DocCore, 🔗dây) — T flip sau audit.
