# REF VISUAL — 10 tham khảo Hoà giao 02/08 (chưng cất bằng chữ, repo không chứa ảnh)

> Bổ trợ `SPEC-DESIGN-SYSTEM-IF` (§2c·§2d·§5). Mỗi ref: LẤY gì → cho component nào · TRÁNH gì.

| # | Ref | LẤY | Cho IF | TRÁNH |
|---|---|---|---|---|
| 1 | **Booksaw** (web editorial kem) | nền kem tĩnh · serif display lớn · trắng rộng rãi · lưới bìa sách đều tăm tắp | **Template Deck / trang bìa hồ sơ** (§5) — gu quiet-luxury khớp IF | — |
| 2 | **NEOM card stack** (The Line) | thẻ tối image-forward, **xếp chồng có chiều sâu + xoay nhẹ**, CTA pill nhỏ trong thẻ | **Gallery Home carousel 3D** (TICKET-GALLERY-TOGGLE) · thẻ dự án | đừng lạm motion — reduce-motion thắng |
| 3 | **Canvas edit nền đen** (áo vàng) | ảnh rực trên chrome tối trung tính · named cursor + floating action bar sát vật | Mood+Collab (đã có) — xác nhận hướng | — |
| 4 | **Trợ lý orb + voice** | ① chữ trả lời **sáng dần theo dòng** (streaming emphasis) ② **thanh voice capsule** (✕·waveform·pause) | **Vitals chế độ LM**: kiểu chữ trả lời + ô voice input (đã chốt nhập giọng tiếng Việt) | ❌ quả cầu gradient Siri — SPEC-VITALS-VISUAL đã cấm (cliché AI), giữ glyph 1 accent |
| 5 | **Thẻ ảnh kỷ niệm** (nền pastel theo ảnh) | **nền thẻ nhuộm màu LẤY TỪ chính ảnh bên trong** *(ambient tint)* · collage xoay nhẹ | thẻ ảnh render trong Gallery + File Manager preview · moodboard | — |
| 6 | **"Add Photos to your walk"** | EMPTY STATE mẫu mực: fan ảnh xếp + 1 câu to + 1 câu phụ + **CTA capsule đen to** + segmented capsule | **khuôn "Trống"** của SPEC-NGON-NGU-CHI-DAN §2 — đây là chuẩn hình ảnh của khuôn đó | — |
| 7 | **Video editor accent lime** | timeline track có **dải thumbnail** · transport capsule (time·play·loop) · tool rail dọc trái · 1 accent duy nhất trên nền ghi | **Present Video ② Dựng (CapCut-level)** — bố cục chuẩn khi làm timeline | accent IF vẫn là tím #6a57f5, không lime |
| 8 | **Resiziy** (glass tối) | panel kính nổi tách lớp · **so sánh 2 pane trước/sau** · preset segmented (Social/Web/Print) | **Tool window render** (trước/sau = đúng nhu cầu so render) · preset khổ xuất | ❌ nền gradient tím-hồng scifi — IF nền kem/tối trung tính |
| 9 | **Side nav capsule** (Pierre Sù) | rail dọc = **capsule** đúng §2d · item active = **bubble tròn phóng to** · bản sáng/tối song song | **rail trái IF** — nâng cấp từ cột icon vuông hiện tại | — |
| 10 | **Upload card glass + progress** | thẻ file kính · badge loại file (TEXT) · **progress bar phát sáng nhẹ + %** | **File Manager: trạng thái tải lên** (G4 đang làm — dùng ngay) | bớt neon glow, giữ đúng 1 accent |
| 11 | **Image block node tối** (Creative Tools) | ① **capsule cấu hình NGAY TRÊN node**: khổ 4:3 · model · số ảnh (stepper) · engine dropdown — chỉnh nhanh không cần mở form ② prompt/caption ngay TRONG node + nút gửi tròn ③ **dây nối bezier mảnh, phát sáng nhẹ, fan-out 1→nhiều** ④ hint "Learn about…" = khuôn Mách nước | **Node AI chặng 2** (ai.render/moodboard): quick-config capsule trên node · dây React Flow đổi sang bezier mảnh sáng nhẹ · 1 output nuôi nhiều node kế | đen tuyền nền — IF giữ nền kem/tối theo theme, dây sáng vừa phải |

## Ba mẫu ưu tiên áp NGAY
1. **#9 rail capsule + bubble active** → CHINH (shell) — khớp §2d không phải bàn.
2. **#10 + #6** → G4 File Manager (upload state + empty state).
3. **#4** → khi làm Vitals LM (chữ sáng dần + voice capsule, KHÔNG orb).

---
*Cowork chưng cất 02/08/2026 từ 10 ảnh Hoà giao (ảnh gốc trong chat, không đưa vào repo theo luật dọn ảnh 01/08).*
