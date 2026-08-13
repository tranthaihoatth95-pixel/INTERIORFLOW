# KỊCH BẢN INTRO IF — "Dây chuyền · Bung nở · Một Nguồn" (Hoà đặt ý 14/08, T dựng kịch bản chờ duyệt)

> Khớp chốt cũ CHOT-INTRO-VIDEO 02/08: intro = MỘT video ~8-10s + 1 dòng chữ + nút Bỏ qua,
> không intro code. Ý Hoà 14/08: *"dây chuyền → phát triển bung ra → co cụm 1 nguồn sự thật →
> logo IF"*, vibe **quiet luxury · art · cá tính**. Art direction lấy từ gu đã chưng cất board
> what-i-see (NC 14/08): K17 ánh sáng kể giờ · K14 chrome kỹ thuật đánh số · K8 editorial kem-serif
> · K6 kính = 0 (không kính, bề mặt đặc).

## Ý niệm một câu
**Một nét mực chạy qua dây chuyền của nghề — nở thành mọi hình hài của một dự án — rồi mọi hình
hài thu về đúng một điểm: nguồn sự thật. Điểm đó là |F.**

## Storyboard 5 cảnh · ~9s (60fps, 3840×2160, một cú máy liền — không cắt cảnh, đúng "dây chuyền")

| # | Giây | Hình | Ánh sáng (kể giờ trong 9s) | Chi tiết K14 |
|---|---|---|---|---|
| C1 · MỘT NÉT | 0–1.8 | Nền kem giấy. MỘT nét mực mảnh (hairline) tự vẽ từ trái, chạy ngang như trên bàn máy — đi qua các "trạm" của dây chuyền | rạng đông — ánh xiên ấm rất nhẹ trên vân giấy | nhãn mono nhỏ mép dưới chạy theo nét: `01 · SKETCH` |
| C2 · THÀNH BẢN VẼ | 1.8–3.4 | Nét gãy vuông thành mặt bằng: tường poché tự tô, cửa mở cung tròn, kích thước tự ghi — đúng ngôn ngữ bản vẽ thật (ISO 128, không bịa ký hiệu) | sáng dần, bóng đổ ngắn lại | `02 · PLAN` · dim line + số tabular nhảy |
| C3 · ĐỨNG DẬY & BUNG NỞ | 3.4–5.8 | Mặt bằng đùn lên khối 3D wireframe → bung ra thành DÂY nhiều hình hài toả quanh trục máy: ảnh render ấm (**nội thất TRỐNG — tuyệt đối không người**, Hoà chốt 14/08), quả cầu vật liệu, trang deck kem, bảng BOQ, khung video — mỗi thứ một thẻ bay ra như trạm cuối dây chuyền | trưa — sáng đầy, màu vật liệu thật (gỗ, đá, vải) | mỗi thẻ mang nhãn `03 · RENDER` `04 · MATERIAL` `05 · DECK` `06 · BOQ` — chi tiết đánh số đúng gu |
| C4 · CO CỤM | 5.8–7.4 | Mọi thẻ đảo chiều, hút về MỘT ĐIỂM sáng giữa khung — càng gần càng chậm (ease đúng spring, không giật). Điểm sáng đập một nhịp như tim | hoàng hôn — viền thẻ nhuộm amber, nền sẫm dần về mực | các nhãn số hoà thành `01` duy nhất |
| C5 · MỘT NGUỒN | 7.4–9.2 | Điểm sáng nở thành mark **\|F** (nét mảnh, currentColor kem trên nền mực — đúng IFLogo hiện có, KHÔNG accent tím) → chữ **InteriorFlow** serif editorial → dòng triết lý mờ dần vào | đêm dịu — chỉ còn logo và chữ trên nền than | crop-mark 4 góc hiện 0.3s rồi tắt (chữ ký K14, rất khẽ) |

Nút **Bỏ qua** góc dưới-phải hiện từ giây 0.5 (chữ nhỏ mono, không hộp). `prefers-reduced-motion`
→ bỏ video, hiện thẳng khung C5 tĩnh.

## Dòng triết lý cuối — 3 phương án chờ Hoà chọn (VI trước, EN dưới, serif; 1 câu duy nhất)
1. **"Một nguồn sự thật — mọi hình hài."** / *One source of truth — every form.* ← T đề xuất: đúng [T1], đúng ý "co cụm 1 nguồn" của Hoà
2. "Từ một nét, thành không gian." / *From a single line, a space.*
3. "Vẽ một lần. Sống ở mọi nơi." / *Drawn once. Alive everywhere.*

## Âm (nếu dùng)
Một nốt piano/celesta thưa theo nhịp trạm (C1-C3), lặng ở C4, một hơi thở trầm khi |F hiện. Không whoosh, không riser quảng cáo — quiet luxury là im đúng chỗ.

## Đường sản xuất (theo chốt 02/08 — video, không code)
- **Prompt máy sinh (Google Flow/Veo, 2-3 lần thử):** "Minimal luxury motion graphic on warm cream paper, a single thin ink line travels left to right through stations of an invisible assembly line, becomes a precise architectural floor plan with poché walls and dimension lines, extrudes into a wireframe interior, blossoms into floating numbered cards (render photo, material sphere, editorial deck page, spreadsheet), all cards reverse and converge into one glowing point at dusk, the point becomes a thin line-art logo on near-black, editorial serif title fades in. Camera: one continuous slow lateral dolly. Light shifts dawn→noon→dusk→night across 9 seconds. No glass, no lens flare, no neon. **Absolutely no people, no human figures, no silhouettes, no hands — empty interiors only.** Quiet, gallery-like, Kinfolk magazine tone."
- **Luật cứng toàn intro (Hoà chốt 14/08): KHÔNG CÓ NGƯỜI** — mọi khung hình, kể cả ảnh render trong thẻ C3, đều là không gian trống; kiểm bằng mắt từng frame trước khi nhúng.
- Khúc C2 (bản vẽ) nếu máy sinh sai ký hiệu → ghép lớp bằng chính engine 2D của IF xuất PNG sequence (nút Xuất chuỗi ảnh vừa ship) — bản vẽ trong intro là bản vẽ THẬT, đúng [T0], không ai làm được điều này ngoài IF.
- Dựng ghép + chỉnh màu: 1 phiên, xuất MP4 9s ≤ 8MB, nhúng màn hình đầu thay intro cũ.

## Cần Hoà
① Gật storyboard 5 cảnh (hoặc sửa cảnh nào) ② chọn dòng triết lý 1/2/3 ③ chọn đường sản xuất: máy sinh toàn bộ, hay lai (C2 từ engine thật). Chốt xong T mở entry thi công.
