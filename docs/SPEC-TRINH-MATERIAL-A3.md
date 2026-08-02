# SPEC — EDITOR BẢNG VẬT LIỆU A3 (loại hồ sơ #2)
**COWORK-TRÌNH lập 04/08 theo hàng đợi bơm đêm (`SO-KIEM-TONG` §3). Kế thừa `SPEC-MODE-PER-STAGE` §4 (nguyên văn: "Material board (A3) — lưới ảnh + mã/giá/NCC — nền ATLAS L5"). Không chờ NC.**
**Người code:** G4 (Present editors, §2). PHU chỉ đụng nếu cần hàm lib mới (ghi rõ ở §6).

## §1 · BẢN CHẤT + RANH GIỚI
Bảng vật liệu A3 = tờ trình vật liệu cho khách/thi công: lưới ô, mỗi ô 1 vật liệu (ảnh + tên + mã + giá + NCC), in A3 ngang, có nhận diện dự án.
**Ranh giới dữ liệu BẤT DI BẤT DỊCH (2.1.9.i, chốt 30/07 — ghi ngay comment `lib/cad/materials.ts:47-56`):**

| Nhịp | Nguồn | Cho ô bảng |
|---|---|---|
| THỊ GIÁC (đổi theo thiết kế) | `MaterialDef` (`lib/cad/materials.ts:28`): name·category·color·tones·texture·`photoUrl?` | swatch + tên hiển thị |
| THƯƠNG MẠI (đổi theo NCC) | `ProductSpec` neo qua `MaterialDef.atlasRecordId` → `larkRecordId` — 8 cột ATLAS: **name·vendor·sku·unit·priceVnd·wastagePercent·packagingSpec·altSku** (`lib/lark/atlas-material-map`) | mã SKU · NCC · giá/đơn vị · mã thay thế |

CẤM nhồi giá/NCC vào MaterialDef. Card chỉ ĐỌC qua neo. matId chưa neo ATLAS → ô vẫn hợp lệ, phần thương mại hiện "— chưa gán mã" (khuôn mách nước `SPEC-NGON-NGU-CHI-DAN`, kèm nút "Gán mã ATLAS").
`wastagePercent`/`packagingSpec` KHÔNG hiện ở bảng A3 — đó là chuyện BOQ (editor #3, chờ NC-3).

## §2 · TRANG & LƯỚI
- Khổ: **A3 ngang 420×297mm**, in **300dpi** (`LUAT-300DPI`) = 4961×3508px. Lề in 12mm, bleed theo pipeline export hiện có.
- 2 layout preset: **L12** = 4×3 (12 ô/trang, khảo sát chuẩn tờ trình studio) · **L6** = 3×2 (6 ô, swatch lớn cho bảng ít vật liệu). Nhiều vật liệu hơn → tự sang trang (bảng = nhiều trang cùng deck).
- **Header:** tên dự án + logo/màu/font đọc từ **Brand Kit CỦA DỰ ÁN** (`LUẬT NỀN TẢNG` #2 — TUYỆT ĐỐI không hardcode nhận diện nào) + số trang "x/y". Footer: ngày xuất + tuỳ chọn watermark Brand Kit.
- Token/bo/hover theo `SPEC-DESIGN-SYSTEM-IF` + `SPEC-HOVER-FOCUS-IDF` (ô bảng = thẻ: hover 1.02+lift 2px trong editor; bản in không có trạng thái hover — hiển nhiên nhưng ghi để khỏi bake nhầm shadow hover vào PDF).

## §3 · Ô VẬT LIỆU (anatomy — element mới `materialCard`)
```
┌─────────────────────┐
│ [swatch ~65% ô]     │ ← ưu tiên: photoUrl (ảnh license) → PNG quả cầu MaterialSphere
│                     │    (G4 đang làm, cache theo hash — TÁI DÙNG, L6 của LUAT-GIAO-DIEN)
│ Tên vật liệu        │    → fallback texture procedural (materialTextureDataUrl có sẵn)
│ SKU · NCC           │ ← từ ProductSpec (neo). Thiếu neo → "— chưa gán mã" + nút
│ 285.000đ/m²         │ ← priceVnd+unit · ẨN ĐƯỢC (toggle §4) · tabular-nums (§2c DS)
│ Khu vực: Bếp, WC 2  │ ← tuỳ chọn, xem §5 live-link
└─────────────────────┘
```
- `materialCard` bind `matId` — model **additive** (pattern `model.ts:193`: file `.idfp` cũ không có field vẫn mở y hệt).
- Ô vẫn là element trong slide → kéo đổi thứ tự, xoá, ghi chú thêm bằng text element thường — **không chế engine mới**.

## §4 · KIẾN TRÚC EDITOR — TÁI DÙNG PRESENT-EDITOR, KHÔNG XÂY MỚI
1. Bảng A3 = **deck có `docType:'material-board'`** (field mới trên EditorDeck, additive): trang = slide khổ A3 thay 16:9 (engine đã có khổ giấy — nút "PDF in 300dpi (A3/A4)" wire rồi, `2a252c9`).
2. Vào từ **màn chọn 5 loại** (PHIEU-PRESENT-G4 V6) — thẻ "Bảng vật liệu A3" enable khi spec này thành code.
3. Sidebar trái thay LayoutShelf bằng **kệ vật liệu dự án**: liệt kê matId đang dùng trong dự án (nguồn §5) + tìm/lọc theo category → kéo thả vào lưới thành `materialCard`. Nút "Thêm tất cả" = đổ mọi matId dự án vào lưới theo layout.
4. Toolbar giữ nguyên cụm Chèn/Sắp xếp/Hiệu ứng (phiếu G4 V2) — materialCard hưởng luôn align/group/flip.
5. Toggle cấp bảng (header editor): **Hiện giá** (mặc định BẬT bản nội bộ; xuất "bản khách" = tắt) · **Hiện khu vực** · chọn layout L12/L6.
6. Undo/redo·layer·export·Brand Kit panel: có sẵn hết — không việc gì phải làm.

## §5 · NGUỒN matId + LIVE-LINK (một-nguồn, mầm của moat "CAD→deck")
- **Danh sách matId của dự án:** cùng nguồn BOQ đã dựng — `lib/boq/from-project` (`49ebadd`, nhanh-phu — **kiểm merge main trước khi code**, `git log main --oneline | grep boq`). Vùng tô có m²+matId → suy luôn cột "Khu vực" (tên phòng/zone).
- **Live-link:** card KHÔNG copy dữ liệu — render đọc thẳng MaterialDef+ProductSpec theo matId mỗi lần vẽ. Đổi vật liệu trong CAD/Thư viện → mở lại bảng thấy bản mới. ATLAS sync đổi giá → giá bảng đổi theo.
- matId bị xoá khỏi dự án → card MỒ CÔI: viền `--warning` + icon xích đứt (đúng bảng icon `SPEC-PANEL-ROLLOUT-IDF` §3) + nút "Gỡ ô" / "Chọn vật liệu khác". Không tự xoá ô (tôn trọng bố cục người dùng).
- KHÔNG sync ngược: sửa trên bảng A3 không ghi về CAD (bảng là HỒ SƠ, không phải editor vật liệu).

## §6 · VIỆC LIB CẦN PHU (nếu thiếu — kiểm trước, có rồi thì thôi)
1. Hàm gộp `getProjectMaterialRows(docId): {matId, def, spec?, zones[]}[]` — nếu `from-project` chưa expose dạng này (grep trước, đừng viết trùng — bài học 00-CHOT).
2. Không cần gì khác: export/upscale/cache (P3) · quả cầu (G4 mục 1) · ATLAS map — đủ sẵn.

## §7 · XUẤT
- PDF A3 300dpi qua pipeline export + `print-upscale` P3 có sẵn (targetPx theo khổ thật · planSteps ×4/×2 · cache IndexedDB · confirm giá credit trước khi trừ — giữ nguyên hành vi `8b7e282`). Swatch procedural/quả cầu = vector/render lại đúng dpi, KHÔNG upscale (chỉ upscale ảnh bitmap photoUrl thiếu px).
- PNG từng trang + PPTX kế thừa. Xuất "bản khách" = bản sao tắt giá (không đổi bản gốc).

## §8 · NGHIỆM THU
| # | Kiểm | Đạt khi |
|---|---|---|
| 1 | Dự án demo có ≥13 matId (7 neo ATLAS · 6 chưa) → tạo bảng L12 | tự sang 2 trang · ô chưa neo hiện "— chưa gán mã" đúng khuôn |
| 2 | Đổi giá 1 bản ghi ATLAS (hoặc sửa ProductSpec) → mở lại bảng | giá đổi, không cần tạo lại |
| 3 | Xoá 1 matId khỏi dự án | card mồ côi viền --warning, 2 nút đúng |
| 4 | Xuất PDF 300dpi cả 2 bản (nội bộ/khách) | 4961×3508 mỗi trang · bản khách sạch giá · Brand Kit dự án đúng, không TTT |
| 5 | 2 theme + file `.idfp` cũ mở lại | không vỡ, không đổi hành vi deck thường |

## §9 · TREO (1 câu, chờ Hoà lúc rảnh — không chặn code)
Bản khách có cần ẩn luôn **NCC** không (một số studio giấu nguồn)? Mặc định đề xuất: toggle "Hiện giá" và "Hiện NCC" TÁCH RIÊNG, cả hai bật trong bản nội bộ.

*COWORK-TRÌNH lập 04/08 (giờ máy 02/08 23:1x). Append-only.*
