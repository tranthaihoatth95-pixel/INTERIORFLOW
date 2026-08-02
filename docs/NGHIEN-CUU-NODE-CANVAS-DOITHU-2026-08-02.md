# NGHIÊN CỨU — ĐỐI THỦ NODE-CANVAS AI · áp cho IF

> Hoà 02/08 gửi 7 ảnh (Flora · Weavy/Figma Weave · Krea · Flowith · ComfyUI · Unity scene · UQURA…):
> *"nghiên cứu và chỉ ra áp dụng cho IF."* Sân chơi = **node-based AI creative canvas**. IF đúng dòng
> này, chuyên nội thất — rút pattern hay, bỏ pattern thừa. Nối `SPEC-CHANG2-UI-2MODE` §5.

## Bảng pattern → áp cho IF
| # | Pattern (ở ref) | Áp cho IF | Mức |
|---|---|---|---|
| 1 | Node có KIỂU màu (AI/Logic/Human/In/Out) | IF đã có nhóm màu — chuẩn hoá dot+icon | ✅ có |
| 2 | **Cổng nối CÓ KIỂU** (model/pos/neg) | port kiểu ảnh/mask/vật liệu/params — nối sai kiểu là chặn | ✅ thêm |
| 3 | **Node Inspector (panel phải)** | inspector nhẹ params nhanh — KHÔNG thay tool-window | 🔵 adapt |
| 4 | **"Turn into"** (ảnh→text/img/video) | output render → biến thành node kế (Upscale·Video Motion·trích màu) | ✅ adopt |
| 5 | AI Pipeline stages | nối tiến trình render + Vitals | 🔵 gọn |
| 6 | Style Presets | "Đổi phong cách" → preset **nội thất** (không 'neon cyber') | 🔵 adapt |
| 7 | Active Session + Stats | presence + credits/queue → Vitals + on/off đã chốt | ✅ nối |
| 8 | Bottom AI action bar | action nhanh trên node result — theo luật "Magic" (`CHOT-TACH-AI-VA-CHINH-TAY`) | 🔵 adapt |
| 9 | **Command bar hội thoại** ("đổi 3:4") | thanh lệnh ngôn ngữ tự nhiên sửa node — LLM ra lệnh (`SEMANTIC-MODEL` §8) | ✅ adopt mạnh |
| 10 | **Scene Objects + Object Properties** (Unity) | thêm cây outliner + inspector vào Command Panel Vẽ 3D | ✅ thêm |
| 11 | Replace Image Source | node Nhập ảnh: File Manager·Library·URL·Canvas·Drive | ✅ nối |
| 12 | Con trỏ tên + chat-output | đã có ở Mood+Collab | ✅ có |

## 3 pattern giá trị cao nhất (mới cho IF)
- **#9 Command bar LLM ra lệnh** — đúng triết lý "LLM là kiến trúc sư ra quyết định, CODE là hoạ viên" (`SEMANTIC-MODEL` §8). Sửa node/ảnh bằng câu nói.
- **#4 "Turn into"** — output render biến thành node kế → pipeline render→upscale→video mượt, đúng thang video 2 tầng.
- **#10 Scene Objects + Object Properties** — hoàn thiện Vẽ 3D (outliner + transform/component inspector, học Unity).

## 🚫 Bỏ / cẩn trọng
Style preset kiểu "Neon Cyber" (không hợp nội thất) · thống kê phù phiếm · **đừng biến thành ComfyUI rối** —
IF giữ node nội thất gọn, tool = window (đã chốt). Luật "đừng thành engine/Miro" vẫn áp.

---
*Cowork tra & ghi 02/08/2026. Nguồn: Krea "Top node-based AI workflow apps" · Flora/Weavy reviews 2026.*
