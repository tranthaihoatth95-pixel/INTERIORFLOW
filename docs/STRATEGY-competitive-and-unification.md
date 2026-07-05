# InteriorFlow — Feature map, so sánh đối thủ, đánh giá vs workflow cũ, hợp nhất app

> Viết 05/07 để trả lời 3 câu hỏi của user: (1) hợp nhất 2 app hay không, (2) tổng→chi tiết tính năng + học gì từ Weavy/Canva/Figma, (3) app so với quy trình 3ds Max→Vray→PPT cũ.

---

## 1. Bản đồ tính năng — tổng thể đến chi tiết

### Tầng 1 — App là gì
Một **canvas node-based** (kiểu Weavy/ComfyUI) chuyên nội thất: kéo-thả node, nối dây theo kiểu dữ liệu, chạy từng node hoặc cả flow. Chạy full trên 1 app Next.js (front+back), DB SQLite, AI qua adapter đa-provider. **Lõi 0-AI đã chạy thật; AI là chất tăng tốc, cô lập vào vài node, luôn có đường lui.**

### Tầng 2 — 3 chặng mềm (1 canvas, đi lại tự do)
| Chặng | Vai trò | Node trụ |
|---|---|---|
| **Concept** | Moodboard, palette, style, pre-concept vật liệu | Import, Style Preset, Room Info, Moodboard Gen, Color Palette |
| **Render** | Clay/sketch → phối cảnh photoreal, chỉnh cục bộ, upscale, video | **Clay→Photoreal (depth)**, Sketch→Render, Material Swap, Furniture, Relight, Upscale, Image/Text→Video |
| **Present** | Dàn slide 16:9, board, spec vật liệu, xuất PDF | Concept Content, Slide Composer, Export Deck, Export Board |

Không tách app cứng — dùng chung canvas, PhaseSwitcher chỉ đổi nhấn mạnh + nhóm ★ node gợi ý.

### Tầng 3 — Danh mục node (≈26)
- **INPUT**: Import Image · Text Prompt · Style Preset · Room Info
- **AI GENERATE**: Sketch→Render (canny) · **Clay→Photoreal (depth)** · Empty Room Staging · Style Transfer · Moodboard Gen (4 ảnh) · Exterior/Facade · **Image→Video** · **Text→Video** (Kling)
- **AI EDIT**: Material Swap (inpaint) · Furniture Remove/Add · Relight · Upscale 4K · Remove BG
- **SLIDE**: Concept Content · Slide Composer (16:9, theme từ ref, 3 bộ chữ) · Export Deck (PDF)
- **UTILITY**: Mask Painter · Chỉnh ảnh manual · Color Palette · Compare A/B · Annotate
- **OUTPUT**: Export Board (PNG/PDF) · Save to Gallery

### Tầng 4 — Hạ tầng
- **Núm AI-tier 4 mức**: Cao (fal cloud) · Vừa · **Tự-host 0đ (ComfyUI+FLUX+ControlNet)** · Không AI. Mặc định tự-host; provider chưa nối → tự lùi mock, không crash.
- **Multi-user**: auth JWT tự viết, credits ledger server (spend/refund nguyên tử), flows + version snapshot, share link read-only, chat team + presence, thư viện ảnh/vật liệu team.
- **Đa nền tảng**: Electron (.exe Windows, đóng gói Next+SQLite), **PWA** (Add to Home Screen iPad/Android), web.
- **UX**: theme sáng/tối theo giờ, Command Palette ⌘K, DAG auto-layout, undo/redo 50 bước, snap grid, cache input-hash (không chạy lại node không đổi), autosave 2s.
- **Design**: token Apple (SF Pro, materials/vibrancy, motion spring), entry cinematic (Intro + LoginScreen 3 chặng stacked-cards).

---

## 2. So sánh Weavy · Canva · Figma — học được gì

| Tiêu chí | InteriorFlow | Weavy (node AI) | Canva | Figma |
|---|---|---|---|---|
| Mô hình | Node graph | Node graph | Layer/template | Layer + auto-layout |
| Chuyên nội thất | ✅ (clay→depth, spec vật liệu) | ❌ chung | ❌ | ❌ |
| Khoá hình học (ControlNet) | ✅ depth/canny | một phần | ❌ | ❌ |
| Tự-host 0đ | ✅ | ❌ (cloud tính tiền) | ❌ | ❌ |
| Dàn slide/present | ✅ local | ❌ | ✅ mạnh | ⚠️ (FigJam/Slides) |
| Realtime co-edit | ❌ (mỗi flow 1 người) | ⚠️ | ✅ | ✅✅ |
| Kho template/asset | ⚠️ thư viện team | ⚠️ | ✅✅ | ✅✅ community |

**Học từ Weavy**: (a) *node preview lớn + so sánh biến thể* ngay trên canvas; (b) *"queue" nhiều biến thể 1 node* (sinh 4–8 phương án rồi chọn) — hiện mới có Moodboard 4 ảnh, nên mở rộng cho Clay→Photoreal; (c) *reroute/group node* để canvas gọn khi flow lớn.

**Học từ Canva**: (a) *thư viện template dàn sẵn* (slide/board) — hiện Slide Composer mạnh nhưng ít layout; thêm 6–8 template present; (b) *thanh công cụ chỉnh nhanh khi chọn phần tử* (crop/filter/text) — giống điều Mia đang làm bên Creative Board; (c) *brand kit* (logo/màu/font cố định) cho studio.

**Học từ Figma**: (a) *auto-layout + constraints* → đây chính là "Window view" đang để mốc, giá trị nhất để dàn present pixel-perfect; (b) *comment trực tiếp trên artboard* (pin bình luận) — cực hợp cho khách/sếp duyệt phối cảnh; (c) *component/variant* để tái dùng; (d) *multiplayer con trỏ* — realtime.

**3 thứ đáng học nhất, theo thứ tự**: ① **comment pin trên ảnh/slide** (Figma) — duyệt khách; ② **queue biến thể + preview lớn** (Weavy) — chọn phương án render nhanh; ③ **template present + brand kit** (Canva) — ra deck đẹp nhanh.

---

## 3. Đánh giá vs workflow cũ: 3ds Max → V-Ray → PowerPoint

| Bước | Cũ | InteriorFlow | Được gì |
|---|---|---|---|
| Dựng hình | 3ds Max | 3ds Max (giữ) | Không thay — vẫn dựng khối ở Max |
| Vật liệu + render | **V-Ray** (license đắt, chậm, chỉnh vật liệu thủ công) | **Clay→Photoreal (ControlNet depth)** | Bỏ phí V-Ray; render nhanh; đổi style/vật liệu bằng prompt + mask |
| Nhiều góc camera | Render lại từng góc (lâu) | Batch import nhiều clay → cùng node | Nhanh hơn nhiều |
| Chỉnh sửa | Photoshop tay | Mask Painter + Material Swap + Relight + Chỉnh ảnh | Cục bộ, không phá tổng thể; có A/B |
| Trình bày | PowerPoint tay | Slide Composer + Export Deck (16:9, theme từ ref) | Đồng bộ brand, ra PDF thẳng |
| Duyệt khách | Gửi file rời | Share link read-only + (sắp) comment pin | Vòng phản hồi ngắn |
| Chi phí biến đổi | License V-Ray/năm | **0đ (tự-host)** hoặc vài chục $ cloud | Giảm mạnh |

**Điểm mạnh cốt lõi**: clay render = geometry cố định 100% → ControlNet depth **khoá khối**, AI chỉ "sơn" vật liệu/ánh sáng bên trong khung → **ổn định hơn text→image**, đúng nỗi lo "AI bất định". Đây là lý do pipeline này hợp lý chứ không chỉ tiết kiệm.

**Điểm còn thua workflow cũ (cần thành thật)**:
- V-Ray cho **độ chính xác vật lý ánh sáng/phản xạ** (kính, kim loại, gương) mà AI depth đôi khi bịa. → Giữ V-Ray/D5 cho hero shot cực khó; AI cho phần lớn còn lại.
- **Kiểm soát chi tiết tuyệt đối** (đúng từng viên gạch) — AI vẫn có sai số. → Mask + inpaint cục bộ để sửa.
- Cần **máy render mạnh** cho tự-host (đã có RTX ≥16GB → ổn).

**Kết luận**: không thay thế 100%, mà **thay đúng khúc tốn kém nhất (V-Ray material+render) + rút ngắn khúc present/duyệt**. Đây là *bổ trợ định vị đúng*, không phải thay toàn bộ.

---

## 4. Hợp nhất với "Creative Board" (app Mia đang làm) — khuyến nghị

**Creative Board v2** = moodboard pipeline (import→cắt nền→auto-layout 3 preset Spatial/Airy+palette→note vật liệu→export PNG). **Trùng đúng chặng Concept của InteriorFlow.**

**3 lựa chọn:**
1. **Gộp cứng** (Creative Board thành chặng Concept của InteriorFlow) — 1 sản phẩm liền mạch, nhưng phải port code, rủi ro, chậm.
2. **Đứng riêng, nối bằng dữ liệu** — Creative Board xuất moodboard/palette/material-note → InteriorFlow import làm đầu vào chặng Render. Mỗi app tối ưu việc của mình.
3. **Creative Board = "chế độ Concept nhẹ" độc lập**, InteriorFlow = pipeline đầy đủ; chia theo người dùng (khách/nhanh vs studio/đầy đủ).

**Khuyến nghị: (2) trước, hướng tới (1) sau.**
- *Ngắn hạn*: giữ 2 app riêng (đang chạy tốt, đừng phá). Định nghĩa **1 định dạng trao đổi** (JSON: ảnh + palette hex + material tags + layout) để moodboard Creative Board rơi thẳng vào node Import/Concept của InteriorFlow. Vòng: Concept (Creative Board) → Render → Present (InteriorFlow).
- *Trung hạn*: nếu vòng đó chạy mượt và người dùng thấy phiền vì 2 app, **nhúng Creative Board thành chặng Concept** (tái dùng UI moodboard của Mia làm 1 "view" trong InteriorFlow). Vì InteriorFlow đã có `store.workspace`=phase + PhaseSwitcher, chỗ cắm sẵn.
- **Tránh**: hai app cùng bồi đắp mảng moodboard song song mà không nói chuyện dữ liệu → phí công + lệch gu. Chốt định dạng trao đổi **sớm**.

→ Việc cần làm sớm: (a) thống nhất palette/material-tag schema giữa 2 app; (b) InteriorFlow thêm node "Import Moodboard (Creative Board)" đọc JSON đó.
