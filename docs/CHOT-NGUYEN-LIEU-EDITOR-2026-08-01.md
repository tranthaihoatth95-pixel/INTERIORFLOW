# CHỐT — NGUYÊN LIỆU EDITOR đi trước (chặng 3)

> Hoà nêu 01/08: *"edit tay chặng 3 nghèo nàn so với Canva/CapCut/PowerPoint/Figma/Keynote —
> hạ tầng có nên đi trước không, tuỳ bạn quyết."* → **Cowork quyết theo uỷ quyền: CÓ, hạ tầng
> nguyên liệu đi trước — nhưng KHÔNG thay engine.** Căn cứ: `AUDIT-EDITOR-TOOLKIT.md` (28/07).

## 1 · Quyết định

**GIỮ engine canvas tự viết** (21,5k dòng đang chạy thật, B5 đã nghiệm thu) — đập đi xây lại trên
tldraw/Fabric là giết lịch ship IF1. Luật *"đừng tự viết engine"* (`SPEC-EDITOR-TOOLKIT` §4) áp cho
**video/photo nâng cao** (timeline, FFmpeg.wasm) — không áp hồi tố lên canvas deck đang sống.

**XÂY 4 NGUYÊN LIỆU GỐC** — mỗi cái mở cả họ tính năng, không phải 1 tính năng lẻ:

| # | Nguyên liệu | Phạm vi | Nền có sẵn |
|---|---|---|---|
| E1 | **GROUP** — `groupId?: string` trên `BaseElement` (additive, `.idfp` cũ không vỡ) | chọn nhóm · di chuyển/resize/khoá/ẩn/nhân bản cả cụm · LayerPanel hiện cây nhóm | mô hình additive đã có tiền lệ (`elementType`/`storey`) |
| E2 | **Mask ảnh theo hình** | áp `shapeClipPath()` cho `ImageElement` — tròn/tam giác/đa giác/mũi tên | 🔍 `shape-geometry.ts:65` ĐÃ CÓ, chỉ chưa gọi cho ảnh — RẺ NHẤT, LÀM ĐẦU |
| E3 | **Lớp phủ FILL** — 1 khái niệm: `{kind: màu\|gradient, opacity, blend}` áp cho shape/ảnh | giải luôn 2 ô ⬜ của audit: *gradient màu* + *overlay*. Text giữ `TextGradient` riêng đang chạy | `OpacityGradient` hiện tại giữ nguyên (backward-compat), đánh dấu deprecated |
| E4 | **Filter phần tử** — `blur · brightness · contrast · saturate` | chuỗi CSS filter, xuất PDF/PNG phải bake đúng | render.ts đã bake shadow, cùng đường |

## 2 · CỐ TÌNH KHÔNG làm đợt này — luật "có nơi tiêu thụ mới thêm"

| Thứ | Chờ gì |
|---|---|
| **Bảng số liệu** (table element) | chờ **BOQ** (semantic model §7) — nơi tiêu thụ thật. Làm trước là bảng chết |
| **Pattern real-world scale** | chờ chuỗi vật liệu **L5** (`matId` + tiling mm) |
| **Video editor CapCut-level** | spec riêng đã có (`SPEC-EDITOR-TOOLKIT` §Nhóm 4 — timeline là DỮ LIỆU); sau video bậc 1–4 |
| Thay engine (tldraw/Fabric) | KHÔNG — trừ khi engine hiện tại chứng minh bất lực bằng số đo |

## 3 · Ràng buộc thi công

1. Mọi trường mới **additive** — `.idfp` cũ mở bình thường (ràng buộc #3 `RANG-BUOC-IF2-CHO-IF1`).
2. **Export phải bake đủ**: PDF · PNG · PPTX render đúng mask/fill/filter — thiếu 1 đường xuất =
   chưa xong (PPTX chữ-chỉnh-được là điểm bán hàng, không được vỡ).
3. Undo/redo phủ cả 4 nguyên liệu.
4. Đi cùng hàng đợi đã có: P2 (ảnh mặc định giữ tỉ lệ) · 2.2.91 (toolbar thu khi kéo) ·
   2.2.92 (portal) — cùng nhau tạo cảm giác "đầy tay" ngang Canva ở thao tác hằng ngày.

## 4 · Ai làm, khi nào

**Code phụ, SAU VIỆC 5 (Brand Kit)** — nó đang ở sẵn vùng present-editor (ĐỢT 3 cụm 4).
Thứ tự trong sprint: **E2 (rẻ nhất) → E1 (group, nặng nhất) → E3 → E4.** Mỗi E một commit + test.

## 5 · Đính chính audit

Audit 28/07 ghi *"khoá tỉ lệ ⬜ KHÔNG có"* — **sai do grep theo tên biến** (`lockAspect|keepRatio`):
Shift-giữ-tỉ-lệ ĐÃ CÓ (`Element.tsx:14 · :225-231`). Bài học 14c/14m: claim phủ định phải grep
theo NHIỀU cách gọi, không chỉ một tên. `IF-FEATURE-TREE` 2.3.32 chép lại lỗi này — P1a đang sửa.

---

*Cowork quyết + ghi 01/08/2026 theo uỷ quyền Hoà ("tuỳ bạn quyết"). Rủi ro đã nêu: giữ engine tự
viết nghĩa là tự gánh bảo trì — đổi ý được nếu sau này có số đo chứng minh engine bất lực.*

## Chốt bổ sung 02/08 — resize NHÓM (E1)

> Hoà chốt: **kéo góc nhóm → scale CẢ CỤM theo tỉ lệ** (mọi phần tử con co giãn cùng tỉ lệ,
> giữ bố cục tương đối; chữ scale font theo). Chuẩn Figma/Canva/Keynote. KHÔNG dùng mô hình
> "khung đổi, con giữ nguyên".

## Chốt bổ sung 02/08 (ca trực) — z-order nhóm (E1)

> Cowork duyệt theo uỷ quyền (chuẩn Figma/Canva): khi nhóm được chọn, "Tiến/Lùi 1 bậc" →
> **cả cụm dịch bậc cùng nhau, giữ thứ tự tương đối bên trong cụm**. Không tách lẻ phần tử con.
