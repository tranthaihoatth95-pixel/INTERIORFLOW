# NC-5 · XUẤT HỒ SƠ PDF/IN từ web app — Figma / Canva / CAD plot
**COWORK-NC · 02/08/2026 đêm.** Nuôi: hồ sơ chặng Trình bày (5 loại) + nút "PDF in 300dpi A3/A4" đã wire (`2a252c9`).
**Đối chiếu code IF có sẵn:** xuất PDF client-side bằng **jsPDF 4.2.1** (`package.json`) · `lib/pdf-font.ts` ĐÃ GIẢI nhúng font tiếng Việt có dấu (fix #25, có test thật đo bề rộng glyph) · `lib/present-editor/print-upscale.ts` (targetPx = frame% × mm giấy, ×4/×2) · `LUAT-300DPI` · lineweight ISO 128 đã đọc từ DXF group 370 (`dxf.ts:138`).

---

## 1 · Chuẩn ngành in — các con số phải thuộc

| Khái niệm | Chuẩn | Ghi chú |
|---|---|---|
| **Bleed** (tràn lề) | **3 mm (0,125") mỗi cạnh** — chuẩn phổ quát thương mại | trim box = khổ thành phẩm sau xén; bleed box = trim + 3mm; nội dung chạm mép PHẢI vẽ tràn qua mép |
| **Crop marks** | vạch góc chỉ chỗ xén, nằm NGOÀI vùng bleed | không đè lên artwork |
| **Ảnh** | **300 dpi TẠI KÍCH THƯỚC IN** | khớp `LUAT-300DPI` + cách `print-upscale.ts` đang tính từ mm giấy thật |
| **PDF/X-1a** | CMYK/spot only · flatten transparency · font nhúng đủ | chuẩn cũ, chắc chắn cho RIP offset đời cũ |
| **PDF/X-4** | giữ live transparency + layer · **chấp nhận RGB/Lab kèm ICC profile** | chuẩn hiện đại cho in kỹ thuật số/packaging |
| **Font** | nhúng đầy đủ (hoặc subset); PDF 14 font chuẩn chỉ ASCII — tiếng Việt BẮT BUỘC nhúng TTF đủ glyph dấu | đúng bài IF đã giải ở `lib/pdf-font.ts` |

Nguồn: [Mixam bleed guide](https://mixam.ie/support/bleed) · [PDF Press: bleed sizes](https://pdfpress.app/blog/print-bleed-guide) · [Premier Press: PDF/X-1a vs X-4](https://www.premierpress.com/blog/print-ready-pdfx-1a-and-pdfx-4a-files/) · [IMG.LY: PDF/X standards](https://img.ly/blog/what-does-print-ready-pdf-mean-understanding-pdf-x-standards-for-professional-printing/) · [Devlin Peck: jsPDF custom fonts](https://www.devlinpeck.com/content/jspdf-custom-font)

## 2 · Ba app xử xuất-in thế nào

| | Figma | Canva | AutoCAD plot (chuẩn CAD) |
|---|---|---|---|
| Pipeline in | **KHÔNG có native**: PDF export RGB-only, không bleed/crop marks/CMYK — feature request treo nhiều năm trên forum; lỗ hổng được LẤP BẰNG PLUGIN trả phí (Printery, Print for Figma, TinyImage: CMYK + ICC + bleed + crop marks + DPI control) | **"PDF Print" một nút**: 300dpi + checkbox "Crop marks and bleed" + Colour type **CMYK (chỉ Pro)** + option Flatten; bleed phải bật "Show print bleed" từ lúc thiết kế để nội dung vẽ tràn sẵn | Plot từ **Layout 1:1** (cấm "Fit to paper" khi cần đúng tỷ lệ) · lineweight qua **CTB** + bật "Plot lineweights" · PDF là VECTOR |
| Chữ trong PDF | text vector | text (trừ khi Flatten) | **SHX → outline/curves** (file phình, không search được; `PDFSHX=0` để khỏi thành comment box) · **TTF → text thật searchable** (điều kiện: width factor = 1.0, oblique = 0) |
| Điểm cộng đồng | dân print than "RGB app, không dùng cho press được nếu không mua plugin" ([forum thread](https://forum.figma.com/suggest-a-feature-11/pdf-export-options-crop-marks-and-bleeds-7504)) | **các NHÀ IN phải tự viết guide dạy khách xuất Canva cho đúng** ([Panda Press](https://pandapress.co.uk/how-to-print-from-canva-for-professional-printing-canva-print-settings/), [Print Lord](https://www.printlord.co.uk/canva-to-press-exporting-artwork-like-a-pro/), [Redmond Imaging](https://redmondimaging.com/export-canva-files-with-bleeds/)…) — một-nút vẫn chưa đủ rõ với người thường | lineweight in ra dày/mỏng hơn màn hình là ticket kinh niên ([Autodesk KB](https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/Lineweights-plot-thicker-than-expected-in-AutoCAD.html)) |

Nguồn thêm: [Printery plugin](https://www.figma.com/community/plugin/1419316259939080556/print-pdf-cmyk-icc-bleed-crop-marks-dpi) · [Canva print setup — Clarke Murphy](https://www.clarkemurphyprint.com.au/news/cmp-charity/) · [SHX vs TTF — cadpanacea](http://cadpanacea.com/wp/?p=2854) · [AutoCAD SHX không thành text — Autodesk KB](https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/Publishing-to-PDF-does-not-convert-SHX-fonts-to-TrueType-TTF-fonts-in-AutoCAD-Electrical.html)

**Đọc ra bản chất:** (i) app web RGB nào cũng khuyết mảng chế bản — Figma bỏ hẳn cho plugin, Canva làm 80% rồi vẫn phải nhờ nhà in dạy nốt 20%; (ii) hồ sơ CAD là thế giới riêng: VECTOR + lineweight mm + tỷ lệ thật — không chung pipeline với deck ảnh; (iii) chữ phải là TEXT THẬT trong PDF, không outline.

---

## 3 · ĐIỀU IF NÊN LÀM

| # | Đề xuất | Căn cứ |
|---|---|---|
| 1 | **Hai preset xuất thay vì bắt hiểu thuật ngữ**: nút "In văn phòng" (A3/A4, không bleed, RGB 300dpi — pipeline hiện tại) và "Gửi nhà in" (+3mm bleed + crop marks + cảnh báo màu). Đúng tinh thần `SPEC-NGON-NGU-CHI-DAN`: hành động trước, không jargon | Canva một-nút vẫn cần nhà in viết guide → preset theo TÌNH HUỐNG mới là mức đủ dễ |
| 2 | **Bleed 3mm + crop marks vào pipeline "Gửi nhà in"**: `print-upscale.ts` đã tính px theo mm giấy — cộng 3mm/cạnh vào phép tính; crop marks vẽ bằng jsPDF line (rẻ). Template deck phải cho ảnh nền tràn qua mép (vùng bleed hiện trong editor khi bật preset, kiểu Canva "Show print bleed") | Chuẩn 3mm phổ quát; hạ tầng mm→px có sẵn, chi phí thấp |
| 3 | **Luật font trong spec: MỌI chữ vào PDF phải qua `lib/pdf-font.ts`** (nhúng TTF đủ glyph Việt), cấm rơi im lặng về helvetica (mất dấu); subset font để nhẹ file. Đã có test #25 — thêm ca test "chuỗi có đủ dấu hiếm (ẳ ỹ ợ)" | jsPDF 14 font chuẩn chỉ ASCII; IF đã giải đúng bài — giờ chỉ cần biến thành LUẬT để code sau không lách |
| 4 | **Hồ sơ BẢN VẼ (chặng Vẽ) xuất VECTOR, tách pipeline khỏi deck ảnh**: nét = path jsPDF với lineweight mm theo ISO 128 đã đọc từ layer; tỷ lệ in (1:50/1:100) = phép nhân mm thật → mm giấy, in từ khổ chuẩn KHÔNG "fit to paper"; chữ bản vẽ = TTF nhúng (không bao giờ outline hoá kiểu SHX) | Chuẩn CAD plot; IF có sẵn lineweight + tỷ lệ trong data — làm đúng ngay từ đầu rẻ hơn sửa |
| 5 | **Trung thực về màu**: preset "Gửi nhà in" kèm 1 dòng "PDF màu RGB — nhà in kỹ thuật số in tốt; in offset số lượng lớn cần file CMYK, IF chưa hỗ trợ". KHÔNG giả vờ có CMYK | Figma bị chửi vì im lặng; Canva gate CMYK sau Pro; nói thật = rẻ nhất, hợp `LUAT-COWORK-TU-KIEM` nhãn hạn dùng |
| 6 | **Mục tiêu v2 ghi sẵn: PDF/X-4** (chấp nhận RGB + ICC, giữ transparency) — KHÔNG đu X-1a (flatten + CMYK = nồi phức tạp, RIP đời cũ) | X-4 là chuẩn hiện đại duy nhất web-app RGB với tới được |
| 7 | **Không flatten chữ** — giữ text searchable trong mọi PDF xuất ra (lợi thế đã có nhờ #3; QS/kỹ sư search được bản vẽ + spec là giá trị thật) | Bài học SHX outline: file phình + mất search; Canva flatten bị chính nhà in khuyên tránh |
| 8 | **Đừng xây plugin-gap kiểu Figma**: mọi thứ ở #1–#4 nằm TRONG nút xuất, không đẻ "cửa hàng plugin xuất PDF" | Figma chứng minh khoảng trống xuất-in sẽ bị bên thứ 3 chiếm và user phải trả tiền 2 lần |

**Giới hạn nghiên cứu:** chưa đo thật file jsPDF của IF ra dung lượng/độ tương thích với RIP nhà in VN (cần 1 lần in thử thật — đề xuất Hoà đem 1 deck + 1 bản vẽ ra nhà in quen của TTT in thử, đó là verify rẻ nhất); số bleed của Canva (mặc định bao nhiêu mm) không công bố rõ trong nguồn đã đọc — các guide nhà in đều chỉ nói "bật crop marks and bleed"; chưa khảo pipeline in của đối thủ nội thất trực tiếp (Foyr/Coohom) — coi là bài NC bổ sung nếu Trình bày cần.
