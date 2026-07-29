# IF Phase 1 — Kế hoạch Đóng (Closeout Plan)

> **Mục tiêu file này:** trả lời DUY NHẤT 1 câu hỏi — *còn phải làm gì trước khi
> ngừng thêm tính năng CAD cho IF1, coi như "đủ dùng", và chuyển trọng tâm sang
> tinh chỉnh 2 chặng **Render** và **Present**?*
>
> **Chuẩn "đủ dùng" không phải là 101/101 item.** Chuẩn là: IF1 làm được đúng
> phần việc mà **workflow thiết kế–thi công** giao cho nó. Theo sơ đồ
> `workflow-thiet-ke-thi-cong.svg`:
> - **Stage 3 (TKCS)** = IF1 **Sketch mode**: mặt bằng, kéo thả nội thất → ✅ xong
> - **Stage 4 (TKKT)** = IF1 **Pro mode**: **dimension · vật liệu · kiểm chuẩn** ← đây là ranh giới "done" của IF1
> - **Stage 5+ (TKBVTC)** = **IF2 / CAD ACE** (Revit 3D, MEP đầy đủ, CNC) — **NGOÀI phạm vi IF1**
>
> Nói cách khác: IF1 "xong việc" khi **Pro mode làm tốt 3 thứ của Stage 4: dimension, vật liệu, kiểm chuẩn.** Không cần hơn.

> Nguồn: đối soát mã nguồn `interiorflow` (nhánh `feat/present-layout-ml-p1`) ngày 2026-07-17.
> Đã spot-check trực tiếp: `lib/cad/materials.ts`, `furniture.ts`, `mep.ts`, `store.ts`, `standards/`.

---

## 1. ĐÃ ĐẠT CHUẨN — 2/3 trụ của Stage 4 xong

| Trụ Stage 4 | Trạng thái | Bằng chứng |
|---|---|---|
| **Dimension** | ✅ **Pro-grade** | Bộ dimension đầy đủ (`dimension/dimradius/dimdiameter/dimangular/dimcontinue/dimbaseline`) gated sau Pro mode; nhập toạ độ chính xác X,Y / @dx,dy; realtime dim khi vẽ tường. Đủ cho hồ sơ TKKT. |
| **Kiểm chuẩn** | ✅ **Pro-grade** | Standards checker là nhóm DUY NHẤT đã lên Pro đầy đủ: TCVN 4451 / QCVN 06 / Neufert / NFPA-IBC / QCVN 10:2024; có severity, click-to-locate, gợi ý fix bằng mm cụ thể + wizard apply-gated (`lib/cad/standards/`). |

→ 2/3 trụ của Stage 4 **không còn việc để đóng Phase 1**.

---

## 2. GAP THẬT DUY NHẤT — ✅ ĐÃ ĐÓNG 2026-07-17 (trụ "Vật liệu" lên Pro)

| Item | Trạng thái | Chuẩn Stage 4 cần |
|---|---|---|
| **E1.2 Material thumbnail** (≡ upgrade A3.1 trong UPGRADES) | ✅ **Pro** (procedural swatch) | Pro |

**"Done" ở đây nghĩa là gì:** preview mỗi vật liệu KHÔNG còn là ô gradient CSS phẳng mà là **hoạ tiết vẽ bằng thuật toán (procedural texture)** — module mới `lib/cad/material-texture.ts`: vân gỗ nhiều lớp + mắt gỗ, mạch gạch + nhiễu từng viên, vân đá marble bằng midpoint-displacement, đốm granite, chip terrazzo, vệt+lỗ travertine, sơn có vignette nhẹ. Sinh ra data-URL PNG (cache), dùng cho cả swatch nhỏ trong palette lẫn **hover preview lớn** (tên + nhóm). 13 preset đều render texture riêng biệt, phân biệt rõ (gỗ óc chó ≠ gỗ sồi về cả vân lẫn tông).

**Vì sao procedural, KHÔNG phải ảnh chụp:** repo chưa có bộ ảnh vật liệu có license — **ATLAS Vol.3 chưa nằm trên đĩa** (đã kiểm ~/Downloads). Lấy ảnh bừa trên web trưng như thư viện vật liệu của TTT là rủi ro bản quyền/nguỵ tạo cho một tool thương mại nội bộ → KHÔNG làm. Cũng KHÔNG dùng dịch vụ AI-gen tính phí (render-ai). Procedural là kỹ thuật CAD/design tool dùng phổ biến đúng vì lý do license này, và là bước nâng thị giác thật so với ô màu phẳng cũ.

**Đã chừa sẵn đường cho ảnh thật (future-proof):** thêm field `photoUrl?: string` vào `MaterialDef` (bỏ trống mọi preset hiện tại). `materialTextureDataUrl()` tự ưu tiên `photoUrl` nếu có → khi TTT cấp **ATLAS Vol.3**, chỉ cần thả URL/ảnh vào preset, KHÔNG cần đổi thêm code.

**Phạm vi để lại (đúng ưu tiên E1.2 = palette):** render hatch trên **canvas CAD** giữ nguyên hệ vector pattern (SOLID/DOTS/ANSI lines) — nó đã nhận màu vật liệu và gắn với DXF round-trip; không đắp raster texture lên canvas để tránh rủi ro round-trip. E1.2 chỉ yêu cầu palette hiện "ảnh thật vật liệu, không phải tên code" → đã đủ.

**Verify:** `npx tsc --noEmit` 0 lỗi · test mới `material-texture.test.ts` 30/30 (tất định, mọi cặp preset phân biệt, độ sáng khớp trực giác) + toàn bộ 41 file test PASS · browser `/cad-editor` palette hiện 13 swatch data-URL PNG (0 swatch gradient còn sót), hover preview hoạt động, không lỗi console mới. Nhánh `feat/material-texture` đã merge `--no-ff` vào `feat/present-layout-ml-p1` (`4a73a5b`), CHƯA push/main.

---

## 3. NGOÀI PHẠM VI ĐÓNG PHASE 1 — hoãn qua cổng đánh giá

Những mục dưới đây là gap so với wishlist 101/129 item, **nhưng KHÔNG phải gap so với việc Stage 4 cần**. Khuyến nghị **hoãn**, không chặn cổng Phase 1:

| Mục | Nhóm | Lý do hoãn |
|---|---|---|
| B3.1 Custom shape · B3.2 Import DXF-block · B3.3 Team library sync | Thư viện mở rộng | Tiện ích, không cần cho TKKT |
| C3.6 Style moodboard (gallery ảnh) | AI | Trùng nhu cầu với chặng Render/Present — để xử lý ở đó |
| E1.3 Wall material · E1.4 Auto-BOQ · E1.5 Design-DNA link vật liệu | Vật liệu nâng cao | BOQ/DNA thuộc chiều sâu hồ sơ, không phải "đủ dùng" |
| F3.1 PWA mobile (chưa xác minh) · F3.3 Google Drive sync | Cộng tác | Hạ tầng, không thuộc Stage 4 |
| A1.6 Cột · A1.8 Tường cong | Vẽ | Chưa có nhu cầu bắt buộc; workaround bằng shape/primitive |
| Snap visual indicator · F8 ortho · Undo-history panel · DXF import preview/auto-layer | Toolbar polish | "Nâng cho mượt", không phải "thiếu chức năng" |
| Auth: branded loading · session indicator · auto-save draft | Tiện ích | Auth lõi đã ✅; phần này là polish |

**Non-goal cố định (KHÔNG bao giờ tính là gap):**
- D2.3–D2.5 **Hộp gen kỹ thuật** (detect/warning/relocate): không có quy ước DXF thật để dò tin cậy → chủ động bỏ, không fake (`lib/cad/mep.ts`).
- **DWG export**: thư viện parse đã compile-out phần ghi DWG → bất khả thi; DXF export đã phủ nhu cầu thực. (DWG *import* thì đã làm, cô lập Web Worker GPL — IF1 nội bộ nên chấp nhận được.)
- 3D / kết cấu / MEP đầy đủ / CNC / clash detection: thuộc **IF2**, không phải IF1.

---

## 4. KHUYẾN NGHỊ

**✅ E1.2 đã đóng (2026-07-17) — bằng swatch procedural, KHÔNG phải ảnh chụp.** Việc chặn cuối cùng đã xong ở mức đủ đạt Pro cho trụ "Vật liệu"; ảnh thật ATLAS Vol.3 để dành cho tương lai qua hook `photoUrl?` (thả URL là xong, không cần code).

Cả 3 trụ Stage 4 (dimension · vật liệu · kiểm chuẩn) nay đều Pro-grade → **có thể đóng Phase 1, dừng thêm tính năng CAD, chuyển toàn bộ trọng tâm sang tinh chỉnh Render và Present** (2 chặng này đã có pipeline hoàn chỉnh CAD→Render→Present→PDF/PPTX/PNG — việc tiếp theo là *đánh bóng chất lượng*, không phải dựng mới; audit chất lượng Render/Present là task RIÊNG, không nằm trong lượt này).

Mọi mục ở §3 để lại **sau cổng đánh giá** — quyết định làm tiếp hay không dựa trên phản hồi người dùng thật, đúng tinh thần "không phình IF1 sang việc của IF2".

---

### Tóm tắt 1 dòng
> ✅ **Việc chặn cuối (E1.2) đã xong 2026-07-17** — swatch vật liệu **procedural** (chưa phải ảnh chụp; hook `photoUrl?` chờ ATLAS Vol.3). 3/3 trụ Stage 4 đạt Pro → **đủ điều kiện đóng Phase 1**, chuyển sang polish Render/Present.
