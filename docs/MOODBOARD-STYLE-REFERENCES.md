# Moodboard Style References — Tham chiếu Gu cho IF

> User cung cấp 23/07 khuya làm gu tham chiếu cho tính năng **Moodboard tiền 3D** (Phase 2 + Phase 3 của Project Notebook).
> Ưu tiên áp dụng khi agent auto-generate moodboard từ knowledge base project.

## 6 Archetypes moodboard đã trích

### 1. Editorial Collage cổ điển (Wuthering Heights style)
- **Đặc điểm**: pages sách quote + ảnh mờ + swatch nhỏ + text sidebar (date, quote author).
- **Format**: 2 cột, mix ảnh scan + typography.
- **Áp dụng IF**: "Câu chuyện thiết kế" output — narrative kể lý do + cảm xúc, có quote client.
- **Component cần**: `BookPageCard` · `QuoteBlock` · `SwatchStrip mini` · `TextSidebarWithDate`.

### 2. Grid + Typography Structured Report (COUTRE Imagery Style)
- **Đặc điểm**: sections rõ ràng (Imagery Style · Photography Direction · Texture System · Lighting Mood · Color Treatment · Application Examples). Kiểu brand book.
- **Format**: Cột trái label + description, cột phải grid ảnh + swatch có tên.
- **Áp dụng IF**: **Định hướng không gian** — mỗi phòng có 5-6 sections (mood · lighting · material · texture · palette · application).
- **Component cần**: `SectionRow(title, desc, media)` · `TexturedSwatchGrid` · `LightingMoodMatrix` · `PaletteWithNames`.

### 3. Hand-drawn Annotation (BELONGING · Sencia · Adam & Fior)
- **Đặc điểm**: photo raw + arrow doodle bút chì + text tay + circle highlight + note viết tay.
- **Format**: freeform, không grid cứng.
- **Áp dụng IF**: **Moodboard canvas drag-drop** (Phase 3) — user có thể vẽ arrow + note tay lên trên moodboard.
- **Component cần**: `SketchArrowLayer` · `HandwrittenNote` · `LassoHighlight` · font "Caveat" hoặc "Kalam".

### 4. Vintage Postcard/Photo Taped (Master File · Moodboard Monday · Delicate)
- **Đặc điểm**: polaroid frame, tape washi trên đầu, torn paper edge, ảnh nghiêng tự nhiên.
- **Format**: chồng nhiều lớp, xoay góc nhẹ ±3-8°.
- **Áp dụng IF**: **Postcards mode Gallery** (đã có ref Your Gallery) — dự án hiện dạng postcard có wax seal.
- **Component cần**: `PolaroidFrame(rotate?)` · `TapeStrip(color, angle)` · `TornPaperEdge` · `WaxSeal`.

### 5. Concept Professional (Atamanovka Square · Nordic Wolves scene)
- **Đặc điểm**: rất ít elements, khoảng trắng nhiều, cột text lớn + 2-3 hero image + swatch material.
- **Format**: sạch, không có annotation, tinh giản.
- **Áp dụng IF**: **Giải pháp thiết kế** output — mỗi solution có 1 image chính + 3 material + 1 paragraph rationale.
- **Component cần**: `HeroImageBlock(large)` · `MaterialSwatch3` · `RationaleParagraph` · `Whitespace generous`.

### 6. Art Collage Fine (Moodboard Monday · Xiaohongshu #672456098 · No Scheme Creative)
- **Đặc điểm**: fine art collage kiểu Dada/Surrealism, ảnh cắt bỏ nền, chồng lên nhau tạo composition mới.
- **Format**: bố cục xoay 30-45°, mix media (film grain + digital + text).
- **Áp dụng IF**: cover intro screen (đã có 4 cảnh) — cảnh 2 "điểm chuyển" có thể dùng art collage style này.
- **Component cần**: `ClippedImageLayer(mask)` · `MixMediaComposition` · `TypographyTiltedOverlay`.

---

## Ghi chú áp dụng vào 4 Output Types (Phase 2 NotebookLM)

| Output | Archetype ưu tiên | Font | Palette |
|---|---|---|---|
| **Câu chuyện thiết kế** | 1 (Editorial Collage) + 3 (Hand-drawn) | Archivo body + serif quote block | TTT beige + navy accent |
| **Giải pháp thiết kế** | 5 (Concept Professional) | Archivo body + Archivo Expanded heading | Neutral greige + material swatch tự phân tích |
| **Định hướng không gian** | 2 (Grid Structured Report) | Archivo + label tracked uppercase 0.24em | Palette Gu extracted từ reference |
| **Moodboard tiền 3D** | 4 (Postcard Taped) + 6 (Art Collage) | Handwritten note "Caveat" + Archivo | Palette + material chip |

## Ghi chú áp dụng Phase 3 Canvas

- Canvas drag-drop cho phép user chọn archetype 1-6 làm template start.
- Auto-populate với ảnh + material + palette từ knowledge base project.
- Cho phép edit tay: xoay ảnh, thêm arrow, viết note, dán tape/wax seal.
- Export PNG 1920×1080 (proposal) hoặc A3 (in).

---

## Nguồn user cung cấp
- 11 hình moodboard references (Pinterest/Xiaohongshu/Behance style) — không log URL vì user upload thẳng ảnh vào chat 23/07.
