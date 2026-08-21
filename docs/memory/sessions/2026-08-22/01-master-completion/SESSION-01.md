# SESSION-01 · UI / HỆ THỊ GIÁC

## ⛔ ĐỌC TRƯỚC KHI ĐỘNG VÀO BẤT CỨ THỨ GÌ

**HƯỚNG THỊ GIÁC ĐÃ ĐƯỢC HOÀ DUYỆT MẮT — PASS 20/08.** Không dựng lại, không đề xuất lại.
Hợp đồng thị giác = bộ board **EXS trên Claude Design** (project `InteriorFlow · Design System`,
id `b7dc14ba-1752-4821-8fc7-d519f737ac09`) + hai văn bản:
- `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` — 12 điều chốt (55 dòng, đọc hết được)
- `docs/IF-MOTION-VISUAL-LAW.md` — luật vận động + cá tính thị giác

**Board ĐÃ DUYỆT (thi công theo được):** EXS-A luật vật lý · B sáu khung · C Home Work OS ·
D sidebar 3 độ sâu · E context stack + Vitals aperture · F flows nghề · G/H/I ref-áp-DS ·
J Auto Grid Present (bản v2) · L ngữ pháp hình học · M motion law.
**Board BỊ BÁC (CẤM thi công visual, chỉ tham chiếu kỹ thuật):** EXS-N · O · P · R.
**Đã huỷ:** EXS-K.

⚠️ `docs/mocks/mock-he-thi-giac-3-man.html` (dựng 21/08) là đề xuất SAU khi EXS đã duyệt —
coi là bản MINH HOẠ, KHÔNG phải hợp đồng. Chỗ nào lệch EXS thì EXS thắng.

## ĐÃ XÂY RỒI — ĐỪNG LÀM LẠI (đo tại nguồn 22/08)
- Sidebar 3 độ sâu: `BE_RONG_NAC = {52, 240, 320}` (`components/nav/muc-dieu-huong.ts:134`).
  Rail 52 ✓ trong dải 52–56 · Shelf 240 ✓ trong dải 220–280.
- Vitals **đã là aperture ở mép trên**, không phải pill: `components/studio/VitalsAperture.tsx`,
  mount ở `AppChrome.tsx:376`. `VitalsPill` đã thôi mount.
- Profile gom xong: Ngôn ngữ + Giới thiệu trong menu avatar; Home hết ⓘ/VI-EN lơ lửng (bf45718).

## OPEN — CHỈ CÒN NHỮNG THỨ NÀY
1. **Work Panel 320 → resizable tới 440** (chốt #4). Hiện đứng ở sàn 320, chưa nới được.
2. **HOME = Personal Work OS** (chốt #6, board EXS-C). **Hero = Resume ĐÃ CHỐT.**
   Mặc định phải tươm tất ngay; tuỳ biến sâu nằm trong guardrail DS (add/hide/reorder/resize/pin,
   density, mode, preset). Trả lời nhanh 4 câu: đang làm gì · dở đâu · cần xử gì · làm gì tiếp.
   → Đối chiếu `components/home/DongStudioHome.tsx` với EXS-C rồi sửa phần LỆCH, đừng vẽ lại.
3. **Master Capability System — 4 độ sâu** (chốt #10): Near-pointer capsule → Adaptive Toolbelt →
   Context Shelf/Inspector → Deep ToolWindow. Toolbar = **working set 4–8 capability** theo ngữ
   cảnh, KHÔNG chứa toàn bộ feature. Board EXS chưa vẽ thang này ⇒ phần MỚI thật sự.
4. **Spotlight 1 Primary + 1 Secondary mỗi stage** (chốt #5) — kiểm từng chặng, sửa chỗ lệch.

## HUMAN-GATED — CHỈ MỘT
**EXS-E · Vitals biến thể V3-a** (morph từ chính aperture, không phải popover gắn lên).
Bản chốt ghi rõ: *"chờ Hoà xác nhận trên board EXS-E"*. Đây là câu hỏi DUY NHẤT còn treo về thị
giác. Hỏi gọn, đừng mở lại cả hệ.

## FILES TO OPEN
docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md   (12 điều chốt — nguồn sự thật)
docs/IF-MOTION-VISUAL-LAW.md                (nhịp ms · character từng stage)
components/home/DongStudioHome.tsx          (Home vs EXS-C)
components/nav/muc-dieu-huong.ts:134        (BE_RONG_NAC — nới trần panel)
components/studio/VitalsAperture.tsx        (đã đúng hướng, chỉ tinh chỉnh nếu Hoà chốt V3-a)
components/render-studio/ToolDock3D.tsx     (working set 4–8)
components/cad/CadToolbelt.tsx              (working set 4–8)

## TESTS TO RUN
npm test && npx tsc --noEmit
npm run soi:hinh-hoc && npm run soi:tu-dien
Chụp màn thật qua pane ĐÃ ĐĂNG NHẬP (cookie HttpOnly — Playwright không đăng nhập được).
Ảnh ra nhỏ ~288px thì `resize_window` về preset desktop rồi chụp lại.

## ACCEPTANCE
Home dashboard-like → FAIL · 2D giống AutoCAD → FAIL · 3D nặng panel → FAIL ·
Present giống slide chung → FAIL · ba màn như ba app → FAIL · chrome lấn nội dung → FAIL ·
mọi thứ đều thẻ bo tròn → FAIL · kính dày → FAIL.
Phải có ẢNH APP THẬT mới PASS. Và phải đối chiếu được với board EXS tương ứng.

## STOP CONDITION
Chỉ dừng ở câu V3-a. Mọi mục OPEN còn lại KHÔNG phụ thuộc câu đó — làm được ngay.
