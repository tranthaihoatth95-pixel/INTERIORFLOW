# BÁO CÁO PHIÊN · NC — Triết lý giao diện IF (14/08/2026)

**Phiếu:** `docs/phieu-giao/nc-triet-ly-giao-dien.md` · vai NC, không code.
**Sản phẩm:** `docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` (đúng khung 6 mục, ~140 dòng < trần 220).

## Cách làm
1. **51 ảnh** `/Users/tranben/Downloads/tham khao ui/`: chia 3 lô × 17, phóng 3 agent con đọc mắt
   từng tấm theo từ vựng cơ chế thống nhất (bảng 1 dòng/ảnh) — kết quả về qua T, tổng hợp lại phía tôi.
   50/51 dùng được (1 tấm là ảnh món ăn, loại). Đếm tần suất từng cơ chế trên 50 ảnh, đối chiếu chéo
   với trục gu 19 ảnh chat (T chưng cất sẵn trong phiếu ②) — cơ chế trùng cả hai nguồn đánh dấu ✚
   làm trọng số gu. Ra 12 cụm K1-K12.
2. **Nội lực** (đọc trước khi đề xuất, [Đ2]): TRIET-LY-IF.md · SPEC-DESIGN-SYSTEM-IF (§2b-2d·§5-6) ·
   CHAN-DOAN-DS-MAT-2026-08-14 (A1-A6, B1-B6, C) · REF-VISUAL-2026-08-02 (#1-15, giữ khuôn
   LẤY/Cho-IF/TRÁNH) · 00-CHOT các mục kien-truc-tool-3-lop · luong-theo-viec · SPEC-CAD-SHELL-V3 ·
   SPEC-PANEL-ROLLOUT · SPEC-MAT-DO-CON-TRO (làm bằng chứng "IF đạt/chưa" trong bảng nguyên lý).
3. **Web** 8 lượt search, giữ nguồn gốc/chính hãng khi có:
   - Figma UI3: figma.com/blog/behind-our-redesign-ui3 · figma.com/blog/our-approach-to-designing-ui3
   - Linear: gunpowderlabs.com/2024/12/22/linear-delightful-patterns · 925studios.co/blog/linear-design-breakdown-saas-ui-2026
   - Apple: developer.apple.com/videos/play/wwdc2025/219 (Meet Liquid Glass) · /wwdc2025/356 (new design system)
   - NN/g: nngroup.com/articles/progressive-disclosure (Nielsen 2006)
   - Blender: blender.org/download/releases/2-80 · blendernation.com/2018/11/28/left-click-select-is-now-the-default-in-blender
   - Rive/Spline: rive.app/blog/state-machines-make-iteration-a-breeze-for-designers-and-developers · greaterstudio.com/research/the-3d-tool-that-finally-feels-like-it-was-built-for-ui-designers-with-one-big-catch
   - Blank canvas/Notion: onboardme.substack.com/p/how-notion-solved-the-blank-page-product-strategy-deepdive · medium.com/ui-for-ai/no-more-blank-canvas-rethinking-how-people-start-with-ai-fd427af24dc8
   - Adobe bloat: en.wikipedia.org/wiki/Interface_bloat · bulklayers.com/blog/why-is-photoshop-getting-worse · daringfireball.net/linked/2026/05/04/photoshop-modern-user-interface

## Cái KHÔNG tìm được / hạn chế — nói thẳng
- **Linear không có bài "design philosophy" chính chủ** đủ chi tiết ở dạng public blog — nguyên lý P4
  dựa trên 2 bài phân tích bên thứ ba (đã ghi rõ trong bảng); nếu cần nguồn chính chủ hơn, linear.app/method
  nói về quy trình chứ không nói UI.
- **Số liệu tần suất là đếm tay qua mắt agent** — 3 agent dùng chung từ vựng nhưng vẫn có sai số chủ quan
  ±1-2/cụm (vd pill-capsule lô A: dòng liệt kê 9, agent tự đếm 7). Kết luận chỉ dùng thứ hạng tương đối,
  không dùng con số tuyệt đối.
- **Ảnh ref không kèm nguồn gốc** (file tải từ Pinterest-style, tên hash) — không truy được app nào,
  nên mọi cụm chỉ rút CƠ CHẾ, không quy chiếu "app X làm thế" (đúng trần vai: cấm chép nguyên).
- Không sửa REF-VISUAL/spec nào khác (trần vai) — cụm K1-K12 nếu T muốn nhập REF-VISUAL #16+ thì T flip.

## Trạng thái
- 2 file đã ghi. KHÔNG git, KHÔNG server, KHÔNG code — đúng phiếu ⑤⑥⑦.
- Dây máy: entry `nc-triet-ly-giao-dien` — chờ T audit rồi flip, tôi không tự flip registry.
