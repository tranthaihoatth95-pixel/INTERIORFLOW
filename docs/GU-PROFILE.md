# GU PROFILE — DNA thẩm mỹ của Hoà (học từ 4 board Pinterest, 11/07/2026)

> Nguồn: ~1.500+ pin từ boards `interior-detail` (2.300+), `uxui-design` (246), `detech` (257)
> của pinterest.com/Bentran_tth. Phương pháp: cluster màu k-means → Claude đọc 12 ảnh
> đại diện (mỗi ảnh đại diện 31–142 pin) → chưng cất DNA. Dữ liệu thô đã nạp Reference
> (palette 6 màu/ảnh + caption keyword cho Gu Engine). Kho gốc: `~/pinterest-gu/`.

## 1. NỘI THẤT (board interior-detail — gu render chính, usage `ref-render`)

**Một câu:** Hospitality luxury Á Đông đương đại — đá vân + gỗ ấm + đồng, đối xứng trang nghiêm,
ánh sáng ấm điện ảnh, phổ từ champagne-glam đến zen trầm.

Phổ gu trải 3 cực (theo cỡ cụm):
- **Cực GLAM sảnh lớn** (cụm lớn nhất ~40%): marble trắng vân + đen tương phản, panel khe rãnh
  dọc (fluted), brass/champagne, đèn chùm điêu khắc, ĐỐI XỨNG mạnh, rèm sáo dọc, glam mềm kem-trắng.
- **Cực TĨNH Aman/Japandi-luxury** (~30%): travertine/đá xám ấm, gỗ óc chó, khung đèn lồng,
  bathroom/suite tông greige, tĩnh và nặng khối.
- **Cực ZEN Á Đông** (~25%): lam gỗ nan dọc, mái dốc gỗ, không gian thiền đối xứng, phòng tối
  ấm 2700K + vườn trong nhà qua kính, đêm zen.
- Texture yêu thích: vân tia tròn ensō, thảm greige, đá wood-grain.

**Từ khoá prompt (đã nhét vào caption Reference):** quiet luxury, luxury, đương đại, zen,
warm, cinematic · marble, travertine, stone, walnut/óc chó, oak/sồi, wood/gỗ, brass/đồng,
leather/da · symmetry, fluted panel, vertical slat, lantern light, indoor tree.

**Palette trội:** greige – kem – champagne – nâu óc chó – đen nhấn – xanh cây điểm.

## 2. GIAO DIỆN APP (board uxui-design — usage `layout`)

**Một câu:** Liquid-glass / soft neumorphism — pill bo tròn full, frosted blur, đơn sắc + 1 accent,
floating toolbar, typography lớn sạch. (Khớp hướng visionOS đang làm cho InteriorFlow intro/ProjectSelect
— tiếp tục hướng này, KHÔNG rẽ flat/material.)

Chi tiết: nút dạng pill/capsule, nền xám nhạt-trung tính, đổ bóng mềm 2 chiều (neumorphic),
kính mờ có chiều dày (glass toggle), toolbar nổi bo tròn kiểu Figma, ít màu — đen/trắng/xám + 1 accent.

## 3. DETECH (board detech — usage `slide`, phục vụ deck ENSŌ)

**Một câu:** Lounge/terrace khách sạn Nhật đương đại — trần gỗ uốn + đồng, da cognac,
cây trong nhà, đèn lồng, đêm đô thị ấm. Khớp concept 円相 ENSŌ (gỗ ấm + đá greige + đồng).

## 4. MÁY DÙNG HỒ SƠ NÀY Ở ĐÂU
- **Render prompt**: `guRenderPrompt()` đọc usage `ref-render` → palette + keyword từ caption
  tự nhồi vào prompt node AI (sketch2render/clay2render/...).
- **Moodboard/Concept**: `guProfileFromPicked` từ ảnh user chọn (MOOD_USAGES).
- **Present layout**: TemplatePicker + analyze-refs đọc usage `layout` (167 trang thành phẩm
  DETECH + 246 pin uxui) để gợi bố cục.
- Nạp thêm gu sau này: script `seed_dir.py <thư_mục> <usage> <prefix> <caption>` — caption
  PHẢI chứa từ khoá trong từ điển `lib/gu.ts` (MATERIAL_TERMS/STYLE_TERMS) thì Gu Engine mới trích.
