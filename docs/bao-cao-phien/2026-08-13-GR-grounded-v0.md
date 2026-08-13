# BÁO CÁO PHIÊN · GR — grounded-render lát v0 (13/08)

> Phiếu: `docs/phieu-giao/grounded-render-v0.md`. Vai GR, cấp F chặng 2 Dựng. KHÔNG git, KHÔNG dev server (đúng ràng buộc ⑤ — hook nhắc preview đã bỏ qua có chủ đích, verify browser để T làm khi audit).

## 1 · File tạo / sửa

| File | Việc |
|---|---|
| `lib/grounded-render/types.ts` (MỚI) | marker `GroundedRender` · `ReferenceSheet` 4 cấp (dòng có `flag: 'inferred'\|'verified'` = tập con `TrangThaiNguon` lib/distill, + `nguon[]`) · `RegionMask`/`RegionId` + `REGION_IDS` 9 mảng nền (san/tuong-trai/…) · encode/decode/emptySheet/sheetToText/sheetValues |
| `lib/grounded-render/reference-sheet.ts` (MỚI) | `sheetFromCaption()` (thuần, đi qua `DistillEngine.distill` — phiếu là MẶT TIỀN [T2]) · `readReferenceSheet()` gọi đường vision sẵn có · `draftReferenceSheetPrompt()` (khung 4 cấp CHƯA NỐI, xem §4) |
| `lib/grounded-render/region-inpaint.ts` (MỚI) | `composeRegionInpaint()` thuần: task `materialSwap`, guidance import hằng F2, thiếu mask = throw · `fitMaskImageSize()` (luật F2 ≤1024/bội 8) · `KEEP_LEVELS` 3 nấc |
| `lib/grounded-render/grounded-render.test.ts` (MỚI) | 41 test phần thuần |
| `lib/nodes/defs/grounded-render.ts` (MỚI) | 2 node: `ai.refsheet` "Phiếu đọc tham khảo" · `ai.regionrender` "Render bám ý (mảng)" |
| `lib/nodes/defs/index.ts` (SỬA) | +1 import +1 spread (đúng cơ chế barrel chống-đè; KHÔNG đụng registry.ts) |
| KHÔNG sửa | `lib/distill/engine.ts` (chỉ gọi) · schema/prisma · present-editor/2D · node cũ nào |

`components/render-studio/**`: KHÔNG tạo component mới — node panel hiện có render được text output + param multiline (đủ cho phiếu text/JSON v0, đúng việc ⑤ "thiếu mới tạo").

## 2 · Đường sẵn có TÁI DÙNG (tên hàm, file:dòng)

- **Vision đọc B**: route `/api/vision/caption` (`app/api/vision/caption/route.ts:7`) → `captionImage()` `lib/ai/providers/nvidia.ts:50` (VLM NVIDIA free, trả `{caption, style, materials, room}`) — cùng đường `app/library/ingest/page.tsx:104` đang dùng. `readReferenceSheet()` fetch route này client-side (cùng cách node `ai.text2image` fetch `/api/render/nvidia-image`, `lib/nodes/defs/render-v2.ts:154`).
- **Chưng cất → phiếu**: `DistillEngine.distill()` `lib/distill/engine.ts:32` + cờ `TrangThaiNguon` `lib/distill/types.ts:15` — phiếu đọc B là mặt tiền thứ 4 của DistillEngine, KHÔNG engine trích xuất mới.
- **Inpaint mảng**: task `materialSwap` (`lib/ai/models.ts:81` → `fal-ai/flux-pro/v1/fill`, comfy `inpaint`) qua `runImageJob()` `lib/ai/client.ts:39` — cùng task node "Sửa vùng" `ai.localedit` (`lib/nodes/defs/render-v2.ts:462`). Khác localedit ở LUẬT: thiếu mask = LỖI, không có nhánh áp toàn ảnh [T6].
- **F2**: `CONTROL_GUIDANCE_DEFAULT` (`lib/ai/models.ts:141`) import làm `REGION_INPAINT_GUIDANCE` (= 3.5, KHÔNG chép số) + `image_size` khớp tỉ lệ ảnh A ≤1024 bội 8 (luật của `scaleToMaxSide` `lib/nodes/registry.ts:197` — xem §5 vì sao phải chép LUẬT thay vì import HÀM).
- **Mask nguồn**: node sẵn có `ai.idmask` (`maskForRegion` `lib/render-core/idmask-core.ts:155`) · `ai.furnitureextract` (BiRefNet) · `ai.smartselect` / Vẽ mask — node mới chỉ NHẬN mask qua port, không chế mask editor mới [Đ2].

## 3 · Kết quả lệnh THẬT

- `node_modules/.bin/sucrase-node lib/grounded-render/grounded-render.test.ts` → **41 pass · 0 fail** (round-trip phiếu · cấp ②④ trống-không-bịa · guidance === hằng F2 · thiếu mask throw · seed truyền nguyên/không NaN · fitMaskImageSize bội 8 không phóng to).
- `npx tsc --noEmit` → **0 lỗi** (output trống).
- Suite liên quan không vỡ: `lib/distill/engine.test.ts` 17 pass · `lib/nodes/defs/pattern-prompt.test.ts` 32 · `lib/nodes/defs/ffe-table.test.ts` 40 · `lib/render-core/render-core.test.ts` 41 · `lib/nodes/search.test.ts` 28 — tất cả 0 fail.
- `npm run soi:tu-dien` → **✅ 0 lệch định nghĩa** (UI không lộ "grounded/segmentation" — nhãn "Render bám ý (mảng)"/"Phiếu đọc tham khảo"; EN "Reference-guided Render").
- Không trùng node type: grep `'ai.refsheet'|'ai.regionrender'` ngoài file mới = 0.

## 4 · ĐÃ NỐI THẬT vs KHUNG CHỜ NỐI [T0] — nói thẳng

| Đường | Trạng thái |
|---|---|
| Phiếu 4 cấp: cấp ①(tone·phong cách·loại phòng) + ③(vật liệu) | **NỐI THẬT** — VLM qua `/api/vision/caption` (cần `NVIDIA_API_KEY`; thiếu key/hết free → route trả lỗi chữ rõ, node THROW, không tự tụt — cùng cơ chế nvidia.ts). |
| Phiếu cấp ②(trần/tường/sàn) + ④(chi tiết) | **CHƯA NỐI** — route caption dùng prompt CỐ ĐỊNH server-side (`nvidia.ts:52`), không truyền prompt 4 cấp được; `draftReferenceSheetPrompt()` để sẵn prompt + shape JSON. Dòng ②④ trong phiếu hiện TRỐNG cho người điền tay — không giả kết quả. |
| Chế độ "Phiếu trống — điền tay" | NỐI THẬT (không mạng, người tự chọn). |
| Inpaint mảng qua mask cứng | **NỐI THẬT** khi có provider (FAL_KEY/ComfyUI/SD); không provider → node báo lỗi rõ "không chạy giả" (khác node cũ có tầng lõi — inpaint AI không có tầng lõi tương đương, mock là lừa). |
| Mức bám per-mảng | v0 thể hiện qua CHỮ prompt (3 nấc). KHÔNG truyền `strength` cho fal flux-fill (model không khai tham số này — truyền mù là giả điều khiển); núm thật = bảng ánh xạ v1 (phiếu cấm làm trước). |
| Duyệt phiếu từng dòng | v0 = dán/sửa JSON trong param `sheetEdit` + cổng select "Đã duyệt phiếu" (chưa duyệt = node không chạy [T5]). UI từng-dòng đẹp hơn = v1 ProposalSheet. |

## 5 · Quyết định tự chọn + lý do

1. **2 node thay 1 node** — tách "đọc phiếu" khỏi "áp mảng" để cửa duyệt nằm GIỮA hai bước trên canvas; một node gộp là một-nút-trộn-thẳng trá hình [T5].
2. **Cổng duyệt = select 'Đã duyệt phiếu' + ô sửa JSON đè dây nối** — trong khuôn ParamDef hiện có (không thêm kind param mới, không đụng types.ts theo luật barrel). Type `ReferenceSheet` đặt tên/cấu trúc (flag+nguon từng dòng) tương thích khuôn ProposalSheet để v1 hợp nhất (ProposalSheet chưa có mã trong code — đã grep).
3. **`fitMaskImageSize` chép LUẬT của `scaleToMaxSide` (5 dòng) thay vì import** — `registry.ts` value-import `@/lib/ai/client` (sucrase-node không resolve `@/`, hạn chế đã ghi tại `registry.ts:191`) và import registry từ defs tạo vòng registry←defs←def-mới. Có test khoá parity. → đề xuất T nhấc `scaleToMaxSide` ra module thuần dùng chung rồi xoá bản này.
4. **`ai.refsheet` creditCost 0** (VLM free, route tự gác lượt) · **`ai.regionrender` creditCost 4** = đúng giá node `ai.materialswap` cũ (`registry.ts:651`) vì cùng task cùng provider — không internal (đây là hành động chính, không phải bước phụ).
5. **Nhóm bảng chọn**: không sửa `lib/nodes/groups.ts` (ngoài vùng file) — node mới rơi vào fallback nhóm ⑤ "Sửa ảnh" theo cơ chế sẵn có (`groups.ts:11`), đúng chỗ cho regionrender; refsheet hợp nhóm "Gu" hơn → 1 dòng cho T thêm khi audit.
6. **Lỗi vision THROW thay vì lặng lẽ trả phiếu trống** — giữ nguyên tắc "CHỈ BÁO, KHÔNG tự tụt" của provider NVIDIA; đường điền tay là lựa chọn CHỦ ĐỘNG của người dùng (param), không phải fallback im.

## 6 · CHƯA LÀM (đúng phạm vi v0, không phải sót)

- SAM2 đa mảng + wire-color UI · BẢNG ÁNH XẠ mảng↔mảng + núm per-mảng · seed/khoá-sắc-độ preset đợt (v1, `render-set-node-tong`).
- Metrology khung tự động (B1) · kéo-thả đường bám phối cảnh · pass B6 thống nhất ánh sáng + máy kiểm sắc độ (v2).
- Trọng số đề xuất 70/20/10 (chuẩn ngành/Thẻ DNA/gu CĐT) — chạm biên liên chặng, DỪNG theo phiếu.
- UI duyệt phiếu từng-dòng dạng bảng (v0 là textarea JSON — phiếu cho phép).
- Chưa chạy job inpaint THẬT end-to-end (cần FAL_KEY + browser — phiếu cấm dev server; T verify khi audit).

## 7 · Đề xuất lên T (điểm chạm biên)

1. **Route vision nhận prompt tuỳ biến** (hoặc route `/api/vision/refsheet` mới dùng `chat()` nvidia.ts) để nối cấp ②④ — prompt đã soạn sẵn ở `draftReferenceSheetPrompt()`. Vùng `app/api` ngoài phiếu này.
2. **Nhấc `scaleToMaxSide` ra module thuần chung** (vd `lib/ai/image-size.ts`) — xoá bản chép luật ở region-inpaint.ts (§5.3).
3. **Thẻ DNA 20% + Company DNA Pack 10%** trong SuggestBlend B4 — interface liên chặng, cần T thiết kế hợp đồng trước khi v1 đụng.
4. **ProposalSheet chung**: khi mở phiếu ProposalSheet, `ReferenceSheetLine {value, flag, nguon}` là ứng viên hợp nhất — đừng để hai khuôn phiếu duyệt sống song song.
5. Registry/dây máy: entry `grounded-render` — bằng chứng grep `GroundedRender|grounded-render` trong lib ĐÃ CÓ (3 file mới); T ghi chú v0 khi audit đạt (agent không tự sửa registry, đúng ⑧). +1 dòng `groups.ts`: `'ai.refsheet': 'gu'`.

## 8 · Khuôn 2 giá trị (§1c)

- **① Kiến trúc app** — [tính năng] Phiếu đọc B thành mặt tiền thứ 4 của DistillEngine (một cỗ máy nhiều mặt tiền, không engine mới); mask mảng mang RegionId nền để sau này scene IF chiếu entityId thẳng vào mask (lợi thế một-nguồn, không SAM). [giao diện] 2 node vào canvas chặng 2 qua barrel sẵn có, không component mới, không đổi hành vi node cũ.
- **② Vận hành/giá trị IF** — [tính năng] KTS hết bệnh "trộn toàn cục chung chung": B được đọc RA CHỮ duyệt được, giá trị chỉ chuyển qua mask cứng từng mảng, mảng hỏng chạy lại riêng với seed chung đợt; guidance/image_size ăn sẵn công thức 15 job dogfood F2. [giao diện] nhãn tiếng nghề không jargon ("Render bám ý", "Phiếu đọc tham khảo"), lỗi nào cũng kèm việc-cần-làm kế tiếp, cửa "Đã duyệt phiếu" giữ người trong vòng lặp đúng T5.
