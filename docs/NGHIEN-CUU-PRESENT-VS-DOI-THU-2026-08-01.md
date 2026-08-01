# NGHIÊN CỨU — Presenting cần gì để hơn đối thủ

> Hoà hỏi 01/08. Khám code TRƯỚC, tra đối thủ SAU. Mọi số là đầu ra lệnh.
> Kết luận ngắn: **Present KHÔNG yếu như bảng tính năng mô tả** — ba dòng trong
> `IF-FEATURE-TREE.md` đang nói sai về chính code của mình.

## 0 · Quy mô thật

🧮 `components/present-editor/` **11.325 dòng** · `lib/present-editor/` **10.195 dòng** = ~21,5k.
Xuất được **3 định dạng**: PDF (jsPDF) · PNG từng trang · **PPTX chữ vẫn chỉnh được**
(🔍 `export.ts:10 · :117 · :192`).

---

## 1 · BA NHÃN NÓI DỐI — thắng rẻ nhất, sửa nhãn là xong

| Bảng/UI nói | Sự thật đo được | Việc cần làm |
|---|---|---|
| `2.3.32`: *"khoá tỉ lệ khi resize ⬜ **hoàn toàn không có**"* | 🔍 **ĐÃ CÓ** — `Element.tsx:14` *"Shift khi resize góc: GIỮ TỈ LỆ"*, cài ở `:225-231` | Sửa dòng bảng. Cân nhắc **mặc định giữ tỉ lệ cho ảnh** (Shift để bẻ) — dân thiết kế không ai muốn ảnh méo |
| `2.1.9.n`: *"`linked-assets.ts` có tên gợi ý nhưng **chưa xác minh live-update thật**"* | 🔍 **CHẠY THẬT** — `setLinkedAssetSrc()` sửa 1 nguồn → mọi element cùng `assetId` trên MỌI slide đổi theo; đã nối vào `PresentEditor.tsx::onAddImageUrl`; ảnh từ Render mang id ổn định `render:<nodeId>` nên chèn nhiều slide **tự hội tụ về 1 asset** | Sửa dòng bảng. Cái CÒN thiếu là link ngược **CAD → deck**, khác hẳn |
| Nút bị khoá: *"Chưa hỗ trợ **mở lại file deck**"* (`Toolbar.tsx:142`) | 🔍 `idfp.ts` có `importIdfp` · `migrateIdfp` · `lastImportIdfpError`, và `PresentSheets.tsx:60` đang import dùng | Nhãn **lỗi thời** — mở khoá nút hoặc sửa câu |

⚠️ Đây là bệnh hệ thống, không phải ba lỗi lẻ: **tài liệu mô tả ý định lúc viết, không mô tả code
lúc này** (Luật 14d). Sản phẩm đang bị đánh giá thấp hơn thực lực bởi chính giấy tờ của mình.

---

## 2 · ĐỐI THỦ — họ yếu ở đâu

**Gamma / Tome / AI-deck** (bản đánh giá 2026):
- Xuất PPTX **"nội dung xô lệch, chồng nhau, hoặc bị dẹp thành ảnh KHÔNG sửa được"**; animation web biến mất.
- **Có house style riêng** — deck nào cũng ra "mùi Gamma", khó khác biệt thương hiệu.
- Tự nhận: *"là trình soạn NỘI DUNG, không phải canvas thiết kế"* — không có kiểm soát bố cục tới pixel.
- Kết luận của người đánh giá: **sai công cụ cho hồ sơ khách phải giao dưới dạng PowerPoint sửa được.**

⇒ 🟢 **IF ĐÃ THẮNG chỗ này** và chưa từng nói ra: PPTX của IF **chữ chỉnh được**. Đây là điểm bán
hàng đang bị bỏ phí.

**Canva / Figma Slides**: canvas tự do, nhưng **không biết gì về bản vẽ** — mọi liên kết dữ liệu
là chép tay.

**Revit Sheets / SketchUp LayOut**: có **liên kết sống bản vẽ → khổ trình bày** (sửa model, sheet
tự cập nhật) — đây là chuẩn ngành BIM 30 năm.

⇒ Khoảng trống thị trường: **không tool trình bày nào có liên kết sống, không tool BIM nào trình
bày đẹp.** IF đứng đúng giữa.

---

## 3 · THẬT SỰ THIẾU — xếp theo giá/đổi

| # | Thiếu | Bằng chứng | Giá |
|---|---|---|---|
| 1 | 🔴 **In 300dpi đang KHOÁ** — vi phạm Luật #9 của chính mình | `Toolbar.tsx:179` *"ảnh render hiện ~116dpi ở khổ A3"* | Nghẽn ở **chặng Render**, không phải Present. Cần `ai.upscale` ×4 vào đường xuất in (mã `2.2.76`) |
| 2 | 🔴 **Liên kết sống CAD → deck** (sửa bản vẽ, deck tự đổi) | `2.1.9.n` ⬜ | Vừa–cao. **Đây là moat**, xem §4 |
| 3 | 🟡 **Toolbar nổi đè lên vùng đang kéo** | `2.2.91` ⬜, Hoà tự phát hiện | Nhỏ, nhưng phải sửa ở **tầng nguyên liệu dùng chung**, không vá riêng Present |
| 4 | 🟡 **Popover bị overlay Render đè** (z-index qua stacking context) | `2.2.92` ⬜ — cần portal hoá | Nhỏ, Hoà chưa chọn hướng |
| 5 | 🟡 **Quản lý nhiều deck** (PS-9) — Dashboard chưa có mục "Deck Present" | `2.3.14` ⬜ | Vừa |
| 6 | 🟡 Luồng 6 bước: **①chọn loại hồ sơ · ④ · ⑤ thiếu** | `2.3.4` 🟡 | Vừa — nối với `SPEC-PRESENT-FLOW` 3 phương án + khoá giữ |

---

## 4 · MOAT — thứ Canva/Gamma không thể bắt chước

**Liên kết sống CAD → deck** là câu trả lời. Hạ tầng đã có gần đủ:

- `linked-assets.ts` giải xong bài **"một nguồn, nhiều nơi dùng"** (ảnh) — chỉ cần **mở rộng nguồn
  từ ảnh sang bản vẽ**.
- Ảnh Render đã có id ổn định `render:<nodeId>` — cùng khuôn đó áp cho `cad:<sheetId>` là xong.
- Chặng 3 vốn là **hàm chiếu** (`TU-VAN-CHANG-3-VA-IF2` §6) — deck đọc từ nguồn chứ không chứa bản sao.

Kịch bản bán hàng: *khách đổi vị trí bếp lúc 4h chiều → sửa mặt bằng → **cả bộ hồ sơ 40 trang tự
cập nhật** → in lại.* Canva phải chép tay 40 trang. Revit làm được nhưng deck xấu.

🟢 Cộng thêm hai thứ IF đã có mà đối thủ không: **PPTX chữ sửa được** (Gamma dẹp thành ảnh) và
**Brand Kit thuộc dự án** (Gamma áp house style của Gamma).

---

## 5 · ĐỀ NGHỊ THỨ TỰ

1. **Sửa 3 nhãn nói dối** — gần như 0 chi phí, và một trong ba là **mở khoá một nút đang khoá oan**.
2. **Mặc định giữ tỉ lệ cho ảnh** (Shift để bẻ) — sửa 1 dòng điều kiện, chặn lỗi méo ảnh.
3. **`2.2.76` mở khoá in 300dpi** — đang vi phạm luật của chính mình; nghẽn nằm ở Render.
4. **`2.2.91` toolbar nổi** — làm ở tầng nguyên liệu, một lần dùng cho cả CAD/Render sau này.
5. **Liên kết sống CAD → deck** — moat, làm sau khi 1–4 xong.

💭 Chưa kiểm: chất lượng PPTX của IF khi mở bằng PowerPoint thật trên Windows (mới chỉ đọc code,
chưa mở file thật). Trước khi đem điểm này đi bán, phải thử thật.

---

*Cowork nghiên cứu 01/08/2026. Nguồn đối thủ: đánh giá Gamma 2026 (LogicBalls), tài liệu liên kết
CAD của Autodesk Revit. Nguồn hiện trạng: code thật, đọc trong phiên này.*
