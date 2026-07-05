# InteriorFlow — Brief tư vấn (tự-đủ, mang sang Claude Project)

> Dán nguyên khối này vào 1 chat Claude Project mới để nhờ tư vấn chiến lược, KHÔNG cần cả lịch sử chat gốc.
> Bối cảnh người dùng: studio kiến trúc/nội thất Việt (TTT Architects), muốn thay quy trình render đắt đỏ bằng pipeline AI ổn định + rẻ.

## Sản phẩm là gì
**InteriorFlow** — web app **canvas node-based** (kiểu Weavy/ComfyUI) chuyên nội thất. Kéo-thả node, nối dây theo kiểu dữ liệu, chạy từng node hoặc cả flow. 1 app Next.js 14 (front+back), DB SQLite, AI qua adapter đa-provider. Triết lý: **lõi 0-AI chạy ổn định 100%; AI là chất tăng tốc, cô lập vào vài node, luôn có đường lui**.

## Quy trình công ty (điểm mấu chốt)
Cũ: 3ds Max → **V-Ray** render → Photoshop → PowerPoint. Bỏ V-Ray vì license đắt.
Mới: 3ds Max dựng hình → **render khối trắng (clay)** → **AI + ControlNet depth** khoá hình học → phối cảnh thực → chỉnh cục bộ (mask/inpaint) → dàn slide present.
Insight: clay render = geometry cố định 100% → ControlNet depth **khoá khối**, AI chỉ "sơn" vật liệu/ánh sáng bên trong khung → **ổn định hơn hẳn text→image**. Đây là cách dùng AI ổn định nhất trong archviz.

## Đã build xong (đang chạy)
- **3 chặng mềm** trên 1 canvas: Concept (moodboard/material) · Render (clay→photoreal, chỉnh, upscale, video) · Present (slide/board/spec). ~26 node.
- **Núm AI-tier 4 mức**: Cao (fal cloud) · Vừa · **Tự-host 0đ (ComfyUI+FLUX+ControlNet depth trên máy render RTX≥16GB)** · Không AI. Mặc định tự-host.
- Node cốt lõi **Clay→Photoreal (depth)**; node video Kling (image/text→video); Material Swap, Relight, Upscale, Slide Composer, Export Deck/Board.
- Multi-user (auth, credits ledger, flows+version, share link, chat team, thư viện), Electron (.exe), PWA (iPad/Android), theme sáng/tối, ⌘K, auto-layout, undo/redo, autosave.
- Design token Apple + entry cinematic.

## Đang chờ / hạn chế
- Cài ComfyUI + set COMFYUI_URL trên máy render công ty (chưa làm → mức tự-host chạy mock tạm).
- fal.ai hết balance; Gemini free bị chặn ảnh → AI cloud chờ nạp tiền.
- Realtime co-edit chưa có (mỗi flow 1 người). Responsive mobile của header/panel còn thô.
- V-Ray vẫn hơn AI về vật lý ánh sáng kính/kim loại/gương → giữ cho hero shot cực khó.

## Tình huống 2 app (cần tư vấn)
Có app thứ 2 **"Creative Board"** (do người khác trong team làm): moodboard pipeline (import→cắt nền→auto-layout preset+palette→note vật liệu→export PNG). **Trùng đúng chặng Concept của InteriorFlow.**
Hướng đang nghiêng: nối bằng dữ liệu trước (schema palette+material-tag+layout chung) → nhúng thành chặng Concept sau.

## Câu hỏi muốn tư vấn thêm
1. Nên hợp nhất Creative Board vào InteriorFlow (1 sản phẩm) hay giữ riêng nối bằng dữ liệu? Tiêu chí quyết định?
2. Định vị sản phẩm: công cụ nội bộ studio, hay SaaS bán cho studio khác, hay "cỗ máy present" cho khách/nhà đầu tư? Ảnh hưởng gì tới ưu tiên tính năng?
3. Với ràng buộc AI ổn định + rẻ: nên đầu tư sâu tự-host ComfyUI hay vẫn cần cloud cho chất lượng chốt? Cân bằng thế nào?
4. Tính năng nào tạo khác biệt cạnh tranh thật (vs Weavy/Canva/Figma/D5): comment-duyệt-khách, queue biến thể, template present, hay realtime co-edit?
5. Lộ trình đi thuyết phục nhà đầu tư: nên làm mượt "Present" hay "Render" trước?
