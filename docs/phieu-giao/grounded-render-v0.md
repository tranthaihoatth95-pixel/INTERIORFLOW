# PHIẾU GIAO · grounded-render (lát v0) — mask bán tự động + inpaint theo mảng + phiếu đọc B dạng text

> Hợp đồng tự chứa theo HOP-DONG-PHOI-HOP-T §3. Lát v0 của `docs/SPEC-GROUNDED-RENDER-2026-08-13.md` §4.

## THẺ VAI [Đ4]
- **VAI:** GR — agent nhánh Grounded-Render (TriTueDuAn, chặng 2 Dựng), thi công lát v0 phục vụ dogfood ST5.
- **PHẠM VI/TRẦN:** cấp F (flow trong chặng 2). Vùng: `lib/grounded-render/**` (mới) + `lib/nodes/defs/**`/`lib/nodes/registry.ts` (thêm node, không phá node cũ) + panel node mới trong `components/render-studio/**` nếu cần mặt hiển thị.
- **BIÊN → DỪNG:** KHÔNG đụng `lib/distill/engine.ts` ruột (chỉ GỌI) · KHÔNG đụng schema DB/prisma · KHÔNG đụng present-editor/2D · bảng ánh xạ + núm per-mảng là v1, KHÔNG làm trước · chạm nhu cầu interface liên chặng (Thẻ DNA 20%, Company DNA 10%) → DỪNG, ghi đề xuất lên T.
- **ĐIỀU KHOẢN RUỘT:** [T5] máy trình PHIẾU người duyệt, đích sửa được, không hộp đen · [T2] một cỗ máy nhiều mặt tiền — phiếu đọc B là MẶT TIỀN DistillEngine, cấm engine trích xuất mới · [T6] không trộn toàn cục, mask cứng, guidance/image_size theo fix F2 · [N2] mặc định một-nút ra chuẩn, chiều sâu collapse.

## ① BỐI CẢNH NGÀNH
15 job dogfood ST5 (13/08, findings F2-F5) chứng minh bệnh: đưa ảnh tham khảo B vào là model TRỘN TOÀN CỤC → kết quả chung chung, "chỉnh không được, mô tả lại cũng không xong"; sàn "đậm" lây lên tường thành wainscot. KTS cần: giá trị chỉ chuyển theo TỪNG MẢNG định danh, qua mask cứng, và máy phải TRÌNH RA những gì nó đọc được từ B để KTS duyệt TRƯỚC khi áp. v0 = ba mảnh dựa toàn đồ có sẵn: mask bán tự động (Cắt nền + vẽ tay) · inpaint theo mảng · phiếu đọc B dạng text duyệt được.

## ② ĐỌC TRƯỚC (bắt buộc)
1. `docs/SPEC-GROUNDED-RENDER-2026-08-13.md` — toàn bộ, đặc biệt §2 B2/B3/B5 + §4 dòng v0.
2. `lib/render-core/idmask-core.ts` — cơ chế mask hiện có.
3. `lib/nodes/registry.ts` + `lib/nodes/defs/render-v2.ts` — cách node render khai báo, CONTROL_GUIDANCE_DEFAULT 3.5 + controlImageSize (fix F2, 13/08) — TÁI DÙNG, không chép số.
4. `lib/distill/types.ts` + `lib/distill/engine.ts` (đọc interface, không sửa) — cờ 3 nấc + nguồn.
5. Node "Cắt nền"/BiRefNet + node "Sửa vùng"/inpaint hiện có (grep `birefnet`, `inpaint` trong lib/nodes, lib/render-core, components/render-studio) — mask editor nào ĐÃ tồn tại thì tái dùng [Đ2].
6. `docs/REVIEW-DONG-BO-CO-CHE-2026-08-13.md` — khuôn ProposalSheet/RegionId; nếu chưa có mã ProposalSheet trong code thì phiếu duyệt v0 là text/JSON trong node panel, đặt type tên `ProposalSheet`-tương-thích để v1 hợp nhất.

## ③ VÙNG FILE
`lib/grounded-render/**` (MỚI: types.ts · reference-sheet.ts · region-inpaint.ts · test) · `lib/nodes/defs/` (file def mới) + `lib/nodes/registry.ts` (đăng ký) · `components/render-studio/**` (chỉ thêm panel/mặt node mới nếu luồng cần) · `docs/bao-cao-phien/2026-08-13-GR-grounded-v0.md`. Ngoài vùng = vi phạm dù sửa đúng.

## ④ VIỆC (marker)
1. **`lib/grounded-render/types.ts`** — marker `GroundedRender`: PHIẾU ĐỌC B 4 cấp (`ReferenceSheet`): ①tổng thể (tone·ánh sáng·nước hình) ②trần/tường/sàn ③mảng vật liệu ④chi tiết — mỗi dòng có `flag: 'inferred'|'verified'` + `nguon`, khớp khuôn cờ 3 nấc của lib/distill. Type vùng: `RegionMask { id, label, maskRef }` — id đặt theo tinh thần RegionId (mảng có định danh nền: san/tuong-trai/tran/…).
2. **`lib/grounded-render/reference-sheet.ts`** — `readReferenceSheet(imageB)`: sinh phiếu 4 cấp bằng đường vision/LLM ĐÃ CÓ trong repo (grep cách node khác gọi vision — ví dụ Bảng gu/mô tả ảnh); trả text có cấu trúc + JSON, mọi dòng flag `inferred`. KHÔNG gọi thẳng API mới — dùng client/hàm sẵn có; nếu không tìm được đường vision sẵn → làm bản `draftReferenceSheetPrompt()` trả prompt + type, ghi CHƯA NỐI trong báo cáo, không giả kết quả [T0].
3. **`lib/grounded-render/region-inpaint.ts`** — `inpaintRegion({imageA, mask, instruction, keepLevel})`: gọi đường inpaint sẵn có với mask cứng + guidance/image_size tái dùng từ fix F2 (import hằng, không chép số); seed truyền vào để chung đợt; thuần hàm, có test cho phần thuần (compose tham số, không gọi mạng trong test).
4. **Node `grounded-render` trong registry node** — luồng v0: input ảnh A + ảnh B + mask (từ node Cắt nền hoặc vẽ tay ở mask editor sẵn có) → bước 1 sinh PHIẾU ĐỌC B hiện ra cho người DUYỆT/SỬA từng dòng (textarea/JSON đơn giản là đủ v0) → bước 2 mới cho chạy inpaint từng mảng. CẤM một-nút-trộn-thẳng không qua phiếu [T5]. Node cũ không đổi hành vi.
5. **Mặt hiển thị tối thiểu** — nếu node panel hiện có render được phiếu text thì dùng luôn; chỉ tạo component mới khi thiếu. Mọi chữ UI song ngữ theo từ điển (KHÔNG lộ jargon "grounded/segmentation" — dùng "Render bám ý"/"phiếu đọc tham khảo"; kiểm `npm run soi:tu-dien` sau khi thêm chuỗi).
6. **Test** — `lib/grounded-render/*.test.ts` cho phần thuần: types round-trip phiếu, compose tham số inpaint (guidance đúng hằng F2, mask bắt buộc, thiếu mask = lỗi rõ ràng không fallback trộn toàn cục).

## ⑤ RÀNG BUỘC
KHÔNG git · KHÔNG dev server (verify browser để T làm khi audit) · KHÔNG dep mới · token/luật UI: G1 (không animate opacity panel) · nhãn chặng đúng từ điển ("3D Thiết kế"/"Dựng") · chuỗi qua i18n nếu chạm UI · reduce-motion thắng. Trích luật một-nguồn: mask id là RegionId-tương-thích để sau này ảnh từ scene IF chiếu entity thẳng (không SAM).

## ⑥ NGHIỆM THU TỰ LÀM
`npx tsc --noEmit` 0 lỗi mới · test mới pass + suite node cũ không vỡ (chạy test file liên quan lib/nodes nếu có) · `npm run soi:tu-dien` không thêm lệch · tự liệt kê: đường nào ĐÃ NỐI THẬT (gọi được) vs đường nào mới là khung chờ nối — nói thẳng [T0].

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-13-GR-grounded-v0.md` — file sửa/tạo · output lệnh THẬT nguyên văn · quyết định tự chọn + lý do (đặc biệt: đường vision/inpaint sẵn có nào được tái dùng, tên hàm, file:dòng) · CHƯA LÀM nói thẳng · đề xuất lên T các điểm chạm biên liên chặng · khuôn 2 giá trị (§1c).

## ⑧ DÂY MÁY
Entry `grounded-render` (đợt 6, TriTueDuAn, ⭐MVP) — bangChung grep `GroundedRender|grounded-render` trong lib. Agent KHÔNG tự sửa registry; v0 xong chưa flip cả entry (entry tả đủ v0-v2) — T ghi chú v0 vào ten khi audit đạt.
