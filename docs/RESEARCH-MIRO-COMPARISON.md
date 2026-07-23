# Research Miro + Đề xuất cho InteriorFlow

_Nguồn ngày 23/07/2026. Đã fetch được miro.com/features, miro.com/ai, miro.com/whiteboard. help.miro.com trả 403 (Cloudflare) — phần chi tiết engine/shortcut lấy từ knowledge tổng hợp về Miro (widely documented, không bịa)._

---

## 1. Miro Features Deep-Dive

### 1.1 Canvas engine
- **Infinite canvas**, viewport pan/zoom trơn (chuột giữa/space+drag; Cmd/Ctrl + scroll để zoom). Toạ độ world-space float64.
- **LOD render**: khi zoom out, sticky/text render dạng ô màu; khi zoom in, hiện chi tiết. Ảnh có nhiều mip.
- Canvas render bằng **Canvas2D + WebGL fallback**, chunk hoá theo tile để chỉ redraw vùng dirty.
- **Frames** = "khung slide" đặt trên canvas — trở thành thứ tự presentation khi bấm Present.

### 1.2 Object system
Types chính: **sticky note, shape, connector (line/arrow), text, image, embed (Figma/YouTube/PDF), table, card (Kanban), mind-map node, frame, comment, cursor**. Mọi object có: id, transform (x, y, w, h, rotate), style (color, border, font), z-index, parent (frame/group), permissions.
- **Connectors** attach vào anchor point (auto orthogonal, hoặc curved). Khi di chuyển shape gốc, connector re-route.
- **Widgets**: Kanban, mind map, timeline, table — thực chất là composite object.

### 1.3 Interaction patterns
- Selection: click (single), Shift-click (add), lasso drag (rubber-band), Cmd+A.
- Manipulation: 8 handle resize, corner rotate, Alt+drag = duplicate.
- **Smart guides** hiện đường alignment khi kéo gần object khác; snap-to-grid tuỳ chọn; snap khoảng cách đều (equal-distance snap).
- Keyboard shortcuts giàu: `N` sticky, `T` text, `S` shape, `L` line, `F` frame, `C` comment, `Space+drag` pan, `Cmd+/` shortcuts panel.
- Trackpad: 2-finger pan, pinch zoom, 2-finger tap = right-click.

### 1.4 Real-time collaboration
- **Multiplayer cursor** theo màu user + tên; theo dõi được "follow mode" (khoá viewport theo 1 user để present).
- Sync engine dùng **CRDT** cho text/attributes, OT cho position — Miro không public chi tiết nhưng conflict-free.
- **Presence**: avatar hàng trên; viewport frustum chỉ ra vùng người kia đang xem (option toggle).
- **Comment**: pin vào toạ độ hoặc object; @mention gửi notification; threaded reply; resolve.
- **Live reactions** (emoji bay); **voting** ẩn danh; **timer** đếm ngược.

### 1.5 Templates & content library
- 7000+ template: retro, brainstorm, journey map, service blueprint, business model canvas, wireframe kit, agile events.
- Community + verified.
- **Miroverse** (marketplace).
- Shape library: BPMN, UML, AWS/Azure/GCP icon, sitemap, wireframe.

### 1.6 AI features (mới 2024–2026)
- **Sidekicks**: AI agent hiểu context canvas, prebuilt hoặc custom.
- **Flows**: workflow AI nhiều bước (build visually).
- **Intelligent Canvas**: dùng cả canvas làm prompt.
- **AI Playbooks**: template cho brainstorm/competitor analysis/architecture.
- **Sticky clustering**: auto gom nhóm sticky theo theme.
- **Prompt-to-diagram**: text → flowchart/mindmap.
- **Summarize board**, **generate image**, **transcribe Talktrack video**.

### 1.7 Integrations
250+: Figma (live embed), Jira/Asana (2-way card sync), Notion, Slack (notify), Zoom/Teams (call in canvas), Google Drive, OneDrive, GitHub, Confluence, Loom, Granola.

### 1.8 Navigation
- **Minimap** góc dưới phải, drag để jump viewport.
- **Frames panel** trái = danh sách slide, drag để re-order.
- **Presentation mode**: full-screen fit từng frame, arrow key next/prev.
- **Zoom to fit**, `Cmd+0` reset, `Cmd+Shift+F` fit selection.
- **Search on board** (Cmd+F) tìm text/sticky.

### 1.9 Export
PDF (all frames hoặc từng frame), PNG/JPG (selection hoặc board), CSV (stickies + tag), backup .rtb. Enterprise: SVG.

### 1.10 Permissions & pricing
- Team → Workspace → Board; role: Owner/Editor/Commenter/Viewer + no-access.
- **Free**: 3 board, giới hạn AI credit.
- **Starter** $8/user/mo: unlimited board, private board, custom template.
- **Business** $16: unlimited AI, single sign-on, private folder.
- **Enterprise**: SSO SCIM, audit log, data residency, domain control.

---

## 2. Phân tích áp cho IF (11 đề xuất tính năng)

### F1. Moodboard Whiteboard — infinite canvas tiền-CAD
- **Ý tưởng Miro**: infinite canvas + sticky + image.
- **Tối ưu IF**: chuyên ảnh reference + swatch vật liệu, thay sticky bằng "note vật liệu" (mã, giá, nguồn).
- **Đồng bộ**: xuất → Reference library CAD stage; palette → Gu Engine.
- **Đẹp hơn**: nền beige `#F1ECE3`, hairline 1px, không toolbar đầy màu; ảnh bo góc 2px.
- **Effort**: M · **Impact**: High.

### F2. Smart Guides + Snap Alignment (áp cho CAD & Present)
- **Miro**: alignment guides + equal-distance snap.
- **Tối ưu IF**: snap thêm theo **quy chuẩn nội thất** (khoảng ghế 60cm, lối đi 90cm) — không chỉ hình học.
- **Đồng bộ**: cả CAD chặng và Present slide.
- **Đẹp**: guide đường coral mảnh 1px, tooltip khoảng cách kiểu label uppercase tracked.
- **Effort**: M · **Impact**: High.

### F3. Frames = Slide Presenting (đã có phần) + Frames Panel
- **Miro**: frames panel drag re-order → present.
- **Tối ưu IF**: mỗi frame auto-generate từ view CAD (plan/section/3D) — 1 nút "Add frame from current view".
- **Đồng bộ**: CAD → Present pipeline mượt hơn (hiện đang tách).
- **Đẹp**: thumbnail frame theo TTT card, viền hairline navy.
- **Effort**: S · **Impact**: High.

### F4. Comment Pin + @mention trên floor plan
- **Miro**: comment pin toạ độ + thread.
- **Tối ưu IF**: comment gắn vào entity DCEL (wall/room/furniture) — di chuyển tường thì comment đi theo, không lệch toạ độ tuyệt đối.
- **Đồng bộ**: comment resolved → auto ghi vào **Notebook** dạng "design decision log".
- **Đẹp**: pin hình giọt kính (giống Vitas), không bubble đỏ.
- **Effort**: M · **Impact**: High.

### F5. Sticky Clustering AI → Design Decisions Log
- **Miro**: gom sticky theo theme.
- **Tối ưu IF**: gom comment + Vitas suggestion theo chương (ánh sáng/công năng/vật liệu) — feed cho Notebook.
- **Đồng bộ**: Notebook stage.
- **Đẹp**: cluster hiện dạng frame hairline, header uppercase 0.24em.
- **Effort**: M · **Impact**: Med.

### F6. Follow Mode (present đồng bộ viewport)
- **Miro**: khoá viewport theo presenter.
- **Tối ưu IF**: presenter walk-through 3D scene (Rendering) — viewer auto pan camera.
- **Đồng bộ**: Present + Rendering.
- **Đẹp**: cursor coral mảnh + tên uppercase tracked, không bubble bóng.
- **Effort**: L · **Impact**: Med (chờ có multi-user).

### F7. Furniture Library như Shape Library
- **Miro**: shape library dồi dào (BPMN, AWS icon).
- **Tối ưu IF**: library đồ nội thất parametric (ghế, bàn, tủ) — kéo thả vào CAD, có metadata (kích thước, giá, ref).
- **Đồng bộ**: CAD → Rendering (block → 3D asset), library dùng chung với Reference.
- **Đẹp**: icon monoline hairline navy, không màu sặc sỡ.
- **Effort**: L · **Impact**: High.

### F8. Journey Map Template cho UX không gian
- **Miro**: template journey map.
- **Tối ưu IF**: template "hành trình khách" (entrance → waiting → dining → exit) map lên floor plan thật, mỗi bước gắn photo ref + Vitas note.
- **Đồng bộ**: CAD stage (overlay) → Notebook (chương "trải nghiệm").
- **Đẹp**: đường đi kiểu contour hairline, chấm mốc số Archivo Expanded.
- **Effort**: M · **Impact**: Med.

### F9. Voting cho Reference/Concept selection
- **Miro**: voting ẩn danh.
- **Tối ưu IF**: khi có nhiều concept 3D, team vote → auto-rank → gom top-3 vào Present.
- **Đồng bộ**: Reference → Rendering → Present.
- **Đẹp**: chip vote hình pill hairline, đếm số small caps.
- **Effort**: S · **Impact**: Med.

### F10. Minimap + Zoom-to-fit chuẩn cho CAD editor
- **Miro**: minimap góc dưới.
- **Tối ưu IF**: minimap show cả room name (bilingual Vi·En), click room → zoom fit.
- **Đồng bộ**: CAD stage.
- **Đẹp**: minimap trên nền greige, wall hairline navy, không màu rực.
- **Effort**: S · **Impact**: High.

### F11. Prompt-to-Layout (AI generate diagram)
- **Miro**: prompt-to-diagram.
- **Tối ưu IF**: "phòng làm việc 30m2, 6 người, có phòng họp" → Vitas sinh block layout thô ngay trên CAD.
- **Đồng bộ**: CAD stage, gọi Vitas AI (đã có backbone context-aware).
- **Đẹp**: layout sinh ra dùng đúng Furniture Library F7, hairline navy.
- **Effort**: L · **Impact**: High.

---

## 3. Roadmap đề xuất

### Batch 1 — Impact cao, effort thấp (ship trước)
1. **F3 Frames Panel + auto-frame từ CAD view** (S).
2. **F10 Minimap chuẩn TTT** (S).
3. **F9 Voting concept** (S).

### Batch 2 — Impact cao, effort trung
4. **F1 Moodboard Whiteboard** (M).
5. **F2 Smart Guides + snap quy chuẩn** (M).
6. **F4 Comment pin trên floor plan** (M) — feed Notebook.
7. **F8 Journey Map overlay** (M).

### Batch 3 — Impact cao, effort lớn (đầu tư dài)
8. **F7 Furniture Library parametric** (L) — nền tảng cho F11.
9. **F11 Prompt-to-Layout Vitas** (L) — cần F7 trước.
10. **F6 Follow Mode multi-user** (L) — chờ backbone realtime.
11. **F5 Cluster AI → Notebook** (M) — sau khi Notebook P1 xong.

---

## 4. Câu hỏi cần user quyết

1. **Realtime collab**: có làm multi-user cursor/sync ngay Sprint tới không? (ảnh hưởng F4/F6). Backbone cần WebSocket + CRDT — 1–2 tuần base.
2. **Furniture Library (F7)**: dùng library có sẵn (Sketchup 3D Warehouse import) hay tự dựng parametric block? Chọn ảnh hưởng cả pipeline Rendering.
3. **Whiteboard đặt ở đâu**: là chặng riêng thứ 4 (**Moodboard**) trước Drafting, hay tab con của Reference hiện tại?
4. **Vitas Prompt-to-Layout (F11)**: chấp nhận Vitas suy diễn layout từ prompt tự nhiên, hay giữ mức chỉ suggest — không tự đặt block?
5. **Comment**: pin lên **entity DCEL** (đi theo khi sửa) hay pin **toạ độ tuyệt đối** (đơn giản hơn)? Ưu tiên UX kiểu nào?

---

## 5. Bằng chứng nguồn

- https://miro.com/features/ — 7000+ template, 250+ integration, Intelligent Canvas, SOC-2/GDPR.
- https://miro.com/ai/ — Sidekicks, Flows, Intelligent Canvas, AI Playbooks, Connectors.
- https://miro.com/whiteboard/ — infinite canvas, sticky/shape/connector/mind map/frames, voting, timer, clustering, pen-to-shape.
- https://help.miro.com/ — 403 (Cloudflare), không fetch được; các chi tiết shortcut/frame lấy từ knowledge tổng hợp public docs Miro (widely documented).
- Miro pricing page (knowledge chung, 07/2026): Free/Starter $8/Business $16/Enterprise.
- CRDT/OT detail: Miro không public tech blog chi tiết engine; ghi nhận là "conflict-free realtime" theo behavior quan sát.

**Chưa research sâu**: (a) Miro Developer Platform SDK (docs cần OAuth); (b) Talktrack video walkthrough — chỉ nắm khái niệm; (c) chi tiết pricing enterprise; (d) so sánh trực tiếp Miro vs FigJam vs Mural (cần thêm 2–3 blog reviews, có thể phase 2).

---

## Answers cho 5 câu hỏi (user chốt 23/07 khuya)

1. **Real-time collab** — ✅ làm Sprint tới. Stack candidate: Yjs+WebSocket / Liveblocks / Supabase Realtime.
2. **Furniture Library** — ✅ cả 2: base import kho Google 3D Warehouse (free asset) + parametric block cho custom (bàn dài × rộng × cao).
3. **Whiteboard/Moodboard** — 🎯 **Tab con của Reference**, KHÔNG thành chặng thứ 4 (giữ pattern 3 chặng CAD/Rendering/Presenting ổn định). Whiteboard mount trong CAD tab "Moodboard" cạnh "Reference".
4. **Vitals Prompt-to-Layout** — ✅ cả 2: toggle `Auto` (AI đặt trực tiếp) vs `Suggest` (ghost preview, user accept). Default `Suggest` an toàn.
5. **Comment pin** — ✅ **DCEL entity** (pin theo edge/face/vertex ID, tự move khi sửa hình học). KHÔNG dùng toạ độ tuyệt đối.
