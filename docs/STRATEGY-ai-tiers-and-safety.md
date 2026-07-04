# InteriorFlow — Chiến lược "Chỉnh mức phụ thuộc AI" + An toàn

> Trả lời trăn trở lớn nhất của user (2026-07-04): **rủi ro AI bất ổn** (fal hết balance, Gemini free bị chặn, kết quả/chi phí dao động). Ghi lại để phiên sau bàn tiếp.

## 0. Insight cốt lõi (đọc cái này trước)
**Giá trị của app KHÔNG nằm ở AI.** AI chỉ là *chất tăng tốc*, không phải nền móng. Toàn bộ phần lõi chạy **0% AI, ổn định 100%**:
- Canvas node, thư viện vật liệu/ref (team), autosave, version, share, chat, credits.
- Presentation: Slide Composer + Export Deck — **đã 100% local, không AI**.
- Chỉnh tay: node Chỉnh ảnh, Mask Painter, Annotate, Color Palette, Compare A/B, Export Board.
- Import ảnh render từ **3ds Max / Vray / D5 sẵn có** của công ty.

→ Vì vậy có thể **bắt đầu ở mức 0-AI (an toàn tuyệt đối) rồi vặn AI lên dần** khi tin tưởng. Rủi ro AI được *cô lập* vào đúng vài node, và luôn có đường lui.

## 0b. QUY TRÌNH THẬT CỦA CÔNG TY (user xác nhận 04/07) — và vì sao nó VỐN ĐÃ ỔN ĐỊNH
**Cũ:** 3ds Max + V-Ray render phối cảnh → Photoshop. Bỏ vì phí bản quyền V-Ray.
**Mới:** 3ds Max dựng hình → **render KHỐI TRẮNG (clay)** → AI + sketch + ảnh ref trần/vách → render thực. Thay cho gán+chỉnh vật liệu V-Ray. Cần: nhiều góc camera + **chỉnh cục bộ, không đổi ảnh tổng thể**.

**INSIGHT LỚN NHẤT — quy trình này là cách dùng AI ỔN ĐỊNH NHẤT trong archviz:**
- Render khối trắng = **hình học (geometry) đã cố định 100%**. Đưa qua **ControlNet (depth/canny/mlsd)** → AI **bị khoá theo đúng khối**, chỉ được "sơn" vật liệu/ánh sáng/không khí *bên trong* khung hình đã có. **AI gần như không thể bịa/biến dạng tổng thể.**
- Khác hẳn text→image (bất định cao). Đây là lý do các tool archviz-AI (nghiêm túc) đều đi hướng ControlNet từ clay/line. → **Nỗi lo "AI bất ổn" được giải quyết ngay ở cấp kiến trúc pipeline, không chỉ bằng núm chỉnh.**
- Việc bỏ V-Ray sang clay+AI **không chỉ tiết kiệm phí** — nó là một pipeline hợp lý và ổn định, tận dụng đúng máy đã có (Max để dựng + clay render nhẹ, không cần license V-Ray).

**Chuỗi node đúng cho quy trình này (phần lớn đã có sẵn):**
1. `Import: Clay/White render` (từ Max) + `Import: Sketch` (thô, tuỳ chọn) + `Import: Ref trần/vách` (từ thư viện).
2. **`Clay → Photoreal`** — node AI dùng **ControlNet DEPTH** (khoá hình học tốt hơn canny cho khối trắng) + style từ ref. *(Nâng cấp từ `ai.sketch2render` hiện dùng FLUX Canny → thêm biến thể depth cho clay.)*
3. **Nhiều góc camera**: mỗi góc là 1 clay render từ Max → cùng node xử lý (batch/nhiều Import).
4. **Chỉnh cục bộ**: `Mask Painter` → `Material Swap`/`Furniture`/`Relight` — **inpaint chỉ vùng mask, giữ nguyên phần còn lại** (FLUX Fill làm đúng việc này). Đã có sẵn.
5. **`Material Tag` (spec)**: đối chiếu vùng ↔ mã thư viện → xuất mã + ảnh. *(Xem §2 — AI chỉ tra cứu, không sinh.)*

**Mức AI khuyến nghị cho công ty:** **"Tự-host 0đ" (ComfyUI + FLUX + ControlNet depth trên máy render)** là điểm ngọt nhất — 0đ/ảnh, chạy trên máy đã có, geometry khoá = ổn định, bản vẽ không ra cloud. Mức "AI Cao" (cloud) chỉ để đánh bóng hero shot cuối cho khách nếu cần. → Cần biết **GPU/VRAM máy render** để chốt (Q&A §5).

## 1. NÚM CHỈNH MỨC PHỤ THUỘC AI (đề xuất cơ chế)
Một selector toàn cục (và override từng node) — 4 mức, ánh xạ thẳng vào adapter đã xây (`lib/ai/providers/`):

| Mức | Tên | Provider | Chi phí/ảnh | Ổn định | Khi nào dùng |
|---|---|---|---|---|---|
| **4** | **AI Cao** | fal FLUX pro / Gemini NB Pro / video Kling | ~$0.05–0.5 | Thấp (phụ thuộc cloud, balance, rate-limit) | Ảnh chốt cần chất lượng tối đa cho khách |
| **3** | **AI Vừa** | fal FLUX schnell / ESRGAN | ~$0.01 (333 ảnh/$1) | Trung bình | Thử nghiệm nhanh, nhiều phương án |
| **2** | **AI Tự-host (miễn phí)** | **ComfyUI + FLUX dev trên máy render công ty (RTX/Vray/D5)** | **0đ** | Cao (không phụ thuộc cloud, data không ra ngoài) | Vận hành hằng ngày, bảo mật bản vẽ khách |
| **1** | **KHÔNG AI (An toàn nhất)** | — | 0đ | Tuyệt đối | Import render Vray/D5 sẵn → chỉnh tay + note vật liệu + ghép board/slide. App = công cụ **tổ chức + trình bày** quanh quy trình truyền thống |

**Mức 1 chính là câu trả lời cho "phụ thuộc AI ít nhất":** app vẫn cực kỳ hữu ích mà không gọi 1 dòng AI nào — dùng đúng thế mạnh dàn máy Vray/D5 hiện có.

### Cách triển khai (kỹ thuật, cho phiên sau — Claude Code làm)
- Thêm `store.aiTier: 1|2|3|4` (global) + optional override mỗi node.
- Adapter đã tách sẵn: `lib/ai/models.ts` map task→model theo tier; thêm `lib/ai/providers/comfyui.ts` cho mức 2.
- Node AI đọc tier → chọn provider; **mức 1 = ẩn/khoá node AI, chỉ hiện node thủ công** (workspace gọn theo ngữ cảnh — đúng ý "không rối rắm").
- Header hiện badge tier hiện tại (đang có badge `AI: fal.ai / mock` — mở rộng thành 4 mức).
- Fallback dây chuyền: mức cao lỗi (hết balance) → tự gợi ý tụt mức, không crash (đã có nền: mock fallback).

## 2. NOTE VẬT LIỆU LÊN FILE (trả lời câu hỏi của user)
> "Khi có file phối cảnh present rồi, có nên thêm cơ chế note vật liệu lên file khi thư viện đã có data?"

**RẤT NÊN — và đây là tính năng gần như 0-AI, giá trị cao, đúng tinh thần an toàn.**
User làm rõ (04/07): note vật liệu là **bước tiến tới khâu BUILD/thi công** — phối cảnh dùng vật liệu gì thì note ra; **thư viện đã có mã vật liệu, AI chỉ ĐỐI CHIẾU thông tin rồi xuất mã + ảnh làm spec** (không sinh ảnh). Tức đây là công cụ *tra cứu + lập bảng*, không phải generative.

Ý tưởng: **Material Tag / Bảng vật liệu (material schedule)**:
- Trên ảnh render (từ clay→AI *hoặc* từ Vray/D5 cũ), click 1 điểm → chọn vật liệu từ **thư viện** (mã An Cường, texture) → app đặt **callout đánh số** (①②③) lên đúng vị trí.
- Tự sinh **bảng chú thích (legend/material schedule)** bên cạnh: số → ảnh swatch + tên + **mã NCC** (lấy từ tags thư viện).
- Xuất kèm ảnh/board — ra đúng **bản spec vật liệu để khách duyệt + xưởng thi công đặt hàng**.
- **Vai trò AI = 0 (mặc định)**: user tự chọn vật liệu từ thư viện. *Tuỳ chọn nâng cao sau*: AI gợi ý vật liệu khớp vùng (chỉ đối chiếu/match, không sinh) — để dành, không bắt buộc.
- 100% local, tái dùng dữ liệu thư viện đã có. Là bản nâng cấp có cấu trúc của node Annotate.

→ Giao cho **Mia** làm (self-contained UI, xem `PROMPT-MIA-material-tags.md`).

## 3. Phân công tránh giẫm chân (concurrency)
Nhắc: Mia + Claude Code **cùng 1 repo** → dễ cuốn commit (bài học syncwork). Chia rạch ròi:
- **Mia** = UI self-contained, file mới nhiều: **Material Tag** (modal + node + legend). Làm trên branch `feat/material-tags`, commit path-scoped.
- **Claude Code** = lõi/kiến trúc: **AI-tier engine** (store + adapter + provider ComfyUI), tách 2 workspace, restyle nốt Apple, merge 3 branch còn chờ (electron/video/pwa).

## 4. Mức độ khả thi (đánh giá thẳng)
**Rất khả thi** — vì lõi 0-AI đã chạy thật (đã build & test). Rủi ro duy nhất (AI) nay **chỉnh được + có đường lui về 0-AI**. Phần khó còn lại là *công sức hoàn thiện*, không phải *bất định công nghệ*.

## 5. CÂU HỎI Q&A CHO PHIÊN SAU (user trả lời để chốt hướng)
1. **Sản phẩm đầu-cuối bạn muốn look like thế nào?** (một app SaaS bóng bẩy như Figma? một tool nội bộ gọn? một "cỗ máy trình bày" cho khách?) — mô tả 1–2 app/ảnh tham chiếu.
2. **Ai là người dùng chính?** chỉ team nội bộ, hay cả khách hàng đăng nhập xem?
3. **Trong 2 cơ chế, cái nào cần MƯỢT THẬT trước** để đi thuyết phục nhà đầu tư — Presentation hay 3D Render? (bạn nói cần thử mượt CẢ HAI — vậy ưu tiên demo cái nào #1?)
4. **Khẩu vị chi phí AI/tháng?** (0đ tự-host / vài chục $ / vài trăm $) — quyết định mức mặc định.
5. **Máy render công ty**: model GPU/VRAM? (để tính có chạy ComfyUI FLUX local mức 2 được không)
6. Có cần **app store thật** (iOS/Android) hay PWA "add to home screen" là đủ?
