# 08 · TRUTH MAP + UX STUDY — bằng chứng đầy đủ

> Nguồn sự thật: HEAD hiện tại (working tree = `backup/2026-08-19-batch0a` tip `9a3934e`,
> `main` remote chưa nhập). Server :3001. Login `demo@if.local` / `demo1234`.
> Bản rút gọn cho ChatGPT: `docs/coordination/IF-LIVE-BRIDGE.md`. Đọc file đó trước, quay lại đây khi cần bằng chứng.

---

## TASK 1 · IMPLEMENTATION TRUTH MAP

Chú thích: 🟢LIVE · 🟡STRUCTURAL · 🟠PARTIAL · 🔵DESIGNED-NOT-CODED · ⚪MISSING · 🔴REJECTED · ❓UNKNOWN

### SHELL

| Surface | Trạng thái | Files/Routes | Bằng chứng browser | Còn thiếu |
|---|---|---|---|---|
| Home | 🟢 LIVE | `components/home/DongStudioHome.tsx`, `/` | Chào Tour + widget grid render thật, dữ liệu thật (19 bản nháp, 1 dự án) | Widget không tuỳ biến (xem HOME bên dưới) |
| Project (overview) | 🟠 PARTIAL | `app/projects/[id]/overview/page.tsx` | Vào được, hiện Flow list + Thẻ DNA CTA — **KHÔNG có AppShell/sidebar**, đứng ngoài vỏ chung | Chưa hợp nhất vào shell 3 cụm |
| Files | 🟢 LIVE | `components/filemanager/*`, `/files` | Hai tab "Tệp dự án" ↔ "Phần thô dùng chung" render đúng chốt 17/08; cây thư mục thật + storage meter | Data rỗng (demo project chưa có file) — chưa thử luồng Promote thật |
| Library | 🟢 LIVE | `components/library/LibrarySheet.tsx`, `/library` | Mở như **tấm/sheet đè lên Files**, không phải trang riêng; kệ thật có số liệu (Vật liệu ATLAS 21, Node Preset 5, Template moodboard 240) | Cấu kiện (.idfc) = 0 món thật |
| Review (Soát duyệt) | ⚪ MISSING (trang riêng) / 🟠 PARTIAL (panel) | `components/review/ReviewPanel.tsx` | Rail có mục "Soát duyệt", click → tooltip tự khai *"Chưa có trang riêng — bảng soát duyệt ở mép phải mở chặng"* | Không có nơi vào tổng hợp cấp app; chỉ sống trong từng stage |
| 2D | 🟢 LIVE | `components/cad/CadEditor.tsx`, `/projects/[id]/cad` | Layer panel + dock capsule đủ tool + VCB + status bar; canvas trống hiện đúng empty-state có CTA | Chưa thử vẽ thật (không phá canvas dev) |
| 3D | 🟢 LIVE (node canvas) / ❓ UNKNOWN (viewport 3D) | `components/render-studio/*`, `/projects/[id]/render` | Node canvas với capability thật (Sketch→Render, Clay→Render, moodboard, vật liệu). Bấm "Vẽ 3D" thêm node vào canvas thay vì chuyển hẳn viewport — chưa xác nhận được ranh giới hai lối thao tác (node ↔ tool truyền thống) rõ trong 1 lượt bấm | Cần lượt sau: bấm sâu vào node "Vẽ 3D" xem viewport ba chiều thật |
| Present | 🟢 LIVE | `components/present-editor/*`, `/projects/[id]/present` | Idle đúng chốt (ambient + 5 shortcut, KHÔNG wizard) → "Bắt đầu trình bày" → chọn nguồn (Nhập tệp/Dán mẫu/Trang trống) → editor đầy đủ (template rail, toolbar, filmstrip, Thiết kế/Tài nguyên/Hiệu ứng, Magic panel) | Page Setup nút chỉ hiện khi có tờ nhận từ 2D/3D (chưa test) |
| Profile | 🟠 PARTIAL | `app/settings/_components/ProfileCard.tsx` | Sống trong Settings→Hồ sơ, không phải trang riêng | Không tách biệt cấp app |
| Credits | 🟠 PARTIAL | `app/api/credits` | Chỉ có API, chưa thấy UI riêng trong lượt duyệt | Chưa xác nhận UI hiển thị credit ở đâu |
| Settings | 🟢 LIVE | `app/settings/page.tsx` | Hồ sơ / Giao diện (Sáng·Tối·Theo hệ thống) / Nơi lưu file / Nâng cao — có "Giảm chuyển động" toggle **trong app** | Đây KHÔNG phải `prefers-reduced-motion` cấp OS — vẫn cần Hoà bật OS-level như handoff ghi |

### CROSS-SYSTEM

| Item | Trạng thái | Bằng chứng | Thiếu |
|---|---|---|---|
| Sidebar Rail/Shelf/Panel | 🟢 LIVE | Rail 2 đảo (VIỆC/CHẶNG) xác nhận trên mọi màn; auto-thu về icon-only 52px khi vào stage canvas | Chưa test "không tự thu khi user đã mở" (mục 3 hàng đợi MAIN) |
| Stage Island | 🟢 LIVE | CHẶNG cluster dưới rail — 2D/3D/Trình chiếu, đúng hướng đã đóng băng | — |
| Top-right cluster | 🟢 LIVE | `CumPhaiTren.tsx` — chỉ có Tài khoản (avatar), KHÔNG có bell/notification | Xem Activity/Flow |
| Vitals | 🟢 LIVE (ambient/peek) | Click aperture → Peek mở đúng, neo tại tâm vùng làm việc, `aria-expanded` đổi true/false đúng | Chưa test Engage (mở chat đầy đủ) |
| Activity/Flow | ⚪ MISSING | `grep -rn "ActivityColumn\|TrungTamHoatDong\|Bell" components/` = 0 kết quả thật | Toàn bộ P0 #4 chưa có 1 dòng code |
| Bottom Action Strip | ❓ UNKNOWN | Không thấy dải hành động cấp toàn app riêng biệt — mỗi stage tự có toolbar dưới của nó (2D dock, 3D bottom bar, Present filmstrip) | Cần định nghĩa lại: có ý là "một dải chung" hay "mỗi stage tự có"? |
| Context Menu | ❓ UNKNOWN | Chưa test right-click trong lượt này | — |
| ToolWindow / NodeWindow | 🟠 PARTIAL | `components/render-studio/CuaSoCongCu.tsx` — cụm nổi kéo được, NodeToolbar/NodeResizer đã gắn (theo memory 16/08 P-R) | Handoff MAIN ghi "§26 neo điều khiển quanh ToolWindow — chưa làm dòng nào"; chưa verify browser lượt này |
| Overlay placement | 🟠 PARTIAL | Luật 6 vùng cấm che đã ghi trong code comment (`AppChrome.tsx`) | Chưa đo bằng số trên app thật lượt này |

### HOME

| Item | Trạng thái | Bằng chứng |
|---|---|---|
| Ambient (wallpaper/atmosphere) | 🟢 LIVE | `SystemWallpaper` mounted `DongStudioHome.tsx:523`; ánh sáng theo giờ (`LightClock`) |
| Vitals Greeting | 🟢 LIVE | "Chào Tour · Thứ Năm, 20/08" + cung ánh sáng ngày/đêm hiện trong khối `#02` |
| Gallery Taste Feed | 🟠 PARTIAL | `WeeklyImage` widget hiện 1 ảnh/tuần — đây là **một widget nhỏ**, không phải feed cảm hứng lớn image-first mà chốt 16/08 mô tả (Gallery riêng vẫn là trang `/library/gallery`, chưa xác nhận NO tags-over-image) |
| Resume | 🟢 LIVE | `ResumeWork` widget mounted, đọc `loadResume` — nhẹ, đúng "lightweight Resume affordance" |
| Project Cards | 🟢 LIVE | Một lưới card thật (không còn 3 khổ khác nhau — khớp việc 1+2 20/08); ảnh phủ trọn + gradient chữ, không đường nối cứng |
| Widget move | ⚪ MISSING | `grep widgetLayout\|WidgetPosition` = 0 |
| Widget resize | ⚪ MISSING | cùng bằng chứng trên |
| Widget pin/remove | ⚪ MISSING | cùng bằng chứng trên |
| Widget persistence | ⚪ MISSING | Không có cơ chế lưu bố cục cá nhân — layout là `cellIndexMap`/`bento-layout.ts` TẤT ĐỊNH theo signal có/không, không theo lựa chọn người dùng |
| Personalization | ⚪ MISSING | Đồng nghĩa 4 dòng trên — Home hiện là "auto-curated", chưa phải "user-curated" như đặc tả P0.2 |

### DEMO

| Item | Trạng thái | Bằng chứng | Thiếu |
|---|---|---|---|
| Visual Generate | 🟢 LIVE | `ae0ac7e feat(frontier): Visual Generate LIVE · Render LIVE...` đã checkpoint; node registry có Sketch→Render, Clay→Render | Chưa chạy thật 1 job (tốn credit) |
| Controlled Edit | 🟠 PARTIAL | `ai.regionrender` trong `lib/nodes/defs/grounded-render.ts` — bắt buộc mask + phiếu đã duyệt, cấm áp toàn ảnh | Chưa xác nhận UI vẽ mask trên app thật |
| Image→Spec | 🟢 LIVE | `components/ui/CuaAnhThanhSpec.tsx`; handoff ghi "cửa duyệt G1-G4 + ngữ pháp sự thật có máy canh" đã checkpoint (`e5df395`) | Chưa test browser trong lượt này |
| Motion | 🟠 PARTIAL | Present editor có tab "Magic/Reference/**Motion**" nhìn thấy thật; `CameraExportTab.tsx` tồn tại | Chưa xác nhận motion pipeline sinh video thật chạy hết vòng |
| Plan branch | ❓ UNKNOWN | Không có bằng chứng trực tiếp lượt này | Cần định nghĩa rõ "Plan branch" nghĩa là gì trong IF trước khi map |
| Present handoff | 🟢 LIVE | `CongThietLapTrang.tsx` — "CỬA nhận tờ từ 2D/3D", ẩn khi chưa có tờ (đúng thiết kế, không phải lỗi) | Chưa test round-trip 2D→Present thật |
| Source | 🟢 LIVE | Files "Tệp nguồn dự án" — badge "thô, thuộc dự án — xem rồi đưa vào Thư viện" | — |
| Where Used | 🟢 LIVE | `components/library/AssetWhereUsed.tsx` tồn tại + gắn trong `LibrarySheet.tsx` | Chưa click thử trong lượt này |
| Stale/Impact | 🟠 PARTIAL | `lib/present-editor/linked-asset-recipe.ts` — fingerprint Doc + nút "Làm mới từ bản vẽ" thủ công (KHÔNG tự động, đúng luật L5) | Đây là cơ chế CỤC BỘ cho ảnh dẫn xuất trong Present, KHÔNG phải Blast-Radius toàn app như đặc tả TRUTH yêu cầu |
| Demo Data Loop | ❓ UNKNOWN | Chưa rehearsal end-to-end (đúng như MAIN handoff mục 3.9 ghi) | Đây là việc P0 #6, chưa làm |

### OUTPUT

| Item | Trạng thái | Bằng chứng |
|---|---|---|
| Page Setup | 🟠 PARTIAL | `ThietLapTrangDayDu.tsx` tồn tại, cửa `CongThietLapTrang` ẩn khi chưa có tờ; handoff MAIN tự chấm "chưa đủ — chưa thấy kết quả trong lúc chỉnh" |
| Live Sheet Preview | ⚪ MISSING | Xác nhận qua handoff + không thấy trong lượt duyệt (không có tờ để mở) |
| Spec | 🟢 LIVE | Image→Spec (G1-G4) + BOQ/Bảng thống kê hiện diện trong sidebar Present |
| Deck | 🟢 LIVE | Present editor đầy đủ, template rail hoạt động |
| Motion | 🟠 PARTIAL | xem DEMO/Motion |
| Exports | 🟠 PARTIAL | Nút "Xuất" + "Xuất PDF/PPTX" nhìn thấy trong UI, chưa test file thật ra |

---

## TASK 2 · UX EXPERIENCE STUDY (đi bằng trình duyệt, không đọc JSX)

### A. NEW USER
- **Trying to do:** hiểu IF làm gì, bắt đầu dự án đầu tiên.
- **Thấy đầu tiên:** intro 3D icon-fall + câu trích dẫn ẩn dụ ("Mười file. Năm tool. Ba lần sếp hỏi 'chưa xong à?'") → nút Skip góc phải. Sau skip → login card kính mờ trên nền ảnh mờ.
- **Primary action:** "Vào xưởng" (nút màu **đồng/cam** — ĐÃ BIẾT NỢ, chốt 16/08 "bỏ hẳn vàng đồng khỏi màu nhấn" chưa thi hành ở màn này).
- **Secondary:** Google/Zalo/Apple continue-with.
- **Hesitate:** sau login, một modal onboarding pop ngay ("InteriorFlow — từ bản vẽ vẽ tới hồ sơ trình khách" + "Tạo dự án của tôi" / "Bỏ qua") — che một phần Home phía sau, đúng dáng WIZARD nhẹ (P0 nói Home "NOT onboarding architecture", modal này đứng tách biệt off Home nên chưa phạm luật đó trực diện, nhưng vẫn là lớp chặn đầu tiên).
- **Feels like a dashboard:** không — Home không đọc như SaaS dashboard, đúng hướng.
- **Feels disconnected:** intro (3D vật thể bay + trích dẫn) và login card không cùng một ngôn ngữ hình học với Home sau đó — chuyển cảnh có fade nhưng không có sự tiếp nối không gian rõ.
- **Should remember context:** N/A cho user mới.
- **Should be automatic:** Skip nên nhớ lựa chọn cho lần sau (chưa xác nhận).
- **Must require human confirmation:** tạo dự án đầu tiên — đã đúng (không tự tạo).

### B. RETURNING DESIGNER
- **Trying to do:** tiếp tục việc dở.
- **Thấy đầu tiên:** Home — card "Nháp" (dự án gần nhất) đã nổi bật ở vị trí thứ 2 trong lưới ngay sau "Dự án mới".
- **Primary action:** click thẳng vào card dự án.
- **Kết quả:** card → project overview (KHÔNG có shell) → phải bấm "Mở canvas" lần nữa → về lại Home rồi mới thật sự vào được stage qua rail. **Đây là một vòng lặp thừa 2 bước** (Home → card → overview → "Mở canvas" → Home lại → rail → stage) thay vì Home → card → thẳng vào stage đang dở.
- **Hesitate:** đúng ở bước "Mở canvas" — không rõ nó đưa đi đâu, và kết quả quan sát được là quay lại Home, gây cảm giác vòng tròn.
- **Feels disconnected:** project overview đứng NGOÀI shell chung (không rail, không top bar giống hệt) — đọc như một trang khác hẳn app.
- **Should remember context:** "lastStage" (chặng dang dở) nên đưa thẳng người dùng vào đúng stage khi click Resume/card, bỏ qua trạm trung gian overview.
- **Must require human confirmation:** không có ở luồng này (thuần điều hướng).

### C. CREATIVE FLOW (Sketch/Clay → Visual Generate → Controlled Edit → Accept)
- **Thấy đầu tiên khi vào 3D:** canvas trống + CTA "Mở Thư viện khối", sidebar trái đầy đủ capability card thật (Sketch to Render, Clay to Render, vật liệu matId thật, moodboard, style reference).
- **Primary action:** kéo/bấm một capability card vào canvas.
- **Secondary:** panel bottom "Vẽ 3D ⇄ node" toggle.
- **Hesitate:** bấm nút "Vẽ 3D" ở dock dưới KHÔNG chuyển hẳn sang viewport 3 chiều rõ ràng trong 1 cú bấm — sidebar đổi nội dung (Mood+Cộng tác/Vật liệu/Form lập luận/Công cụ) nhưng canvas chính vẫn ở dạng node/2D phẳng. Ranh giới "hai lối thao tác cùng một bộ lệnh" (chốt 15/08) **chưa đọc rõ bằng mắt** — cảm giác giống đổi bộ lọc sidebar hơn là đổi môi trường làm việc.
- **What covers their work:** không có gì che — canvas rộng, sidebar thu gọn được.
- **Should be automatic:** credit ước tính TRƯỚC khi chạy (đã có theo sổ, chưa verify UI lượt này).
- **Must require human confirmation:** Accept sau Visual Generate (chưa test — cần chạy job thật, tốn credit, không làm trong lượt map).

### D. TRUST FLOW (Image→Spec → uncertainty → verification → Spec → Present)
- Không test tương tác thật (tốn thời gian/credit ngoài phạm vi mapping). Bằng chứng code: `CuaAnhThanhSpec.tsx` tồn tại, "cửa duyệt G1-G4" đã checkpoint. **UNKNOWN về browser** — cần lượt riêng.
- Rủi ro đã biết từ 00-CHOT: luật 4 nghĩa kích thước (measured/verified/human-override/inferred) — MAIN tự sửa 1 lỗi sai (`27e3a96`) trong chính phiên trước, nghĩa là cơ chế NHẠY CẢM và mới vừa được vá — cần verify lại kỹ ở lượt sau, đừng coi là ổn định.

### E. PROJECT FLOW (Files → Promote → Library → place/use → Source → Where Used)
- Files hai-ngăn LIVE, thấy rõ nút "Đọc lại"/"Tải lên" cho Tệp nguồn dự án.
- "Promote" — code có (`app/api/project-files/[id]/promote/route.ts`, `edeb759`/`922af7e`) nhưng demo project rỗng file nên **chưa thấy luồng thật chạy** trong browser lượt này.
- Library mở như **sheet đè lên Files** — về mặt continuity, đây đúng ý "cùng một dòng chảy Files→Thư viện" (nhị nguyên hai trạng thái của một vật, chốt 16/08) chứ không phải điều hướng rời.
- Where Used: code tồn tại, chưa click thử (cần asset đã Promote để test có nghĩa).

### F. PRESENTATION FLOW (Project content → Present → compose → Page Setup → output)
- Idle state ĐÚNG luật (không wizard, ambient + shortcuts thật).
- Compose: chọn "Trang trống" → vào editor đầy đủ ngay, filmstrip + template rail hoạt động tốt.
- **Page Setup:** không lên được trong lượt map (cần một "tờ" gửi từ 2D/3D trước — dự án demo chưa có bản vẽ). Đây khớp đúng lời tự thú của MAIN handoff — CHƯA ĐỦ, không phải bịa.
- Output: nút Xuất hiện diện, chưa test file thật.

### G. PERSONAL HOME (Gallery → Save/More Like This → customize widgets → persist)
- Gallery hiện diện là 1 route riêng (`/library/gallery`) — KHÔNG kiểm tra sâu lượt này (ngoài phạm vi thời gian), nhưng widget "Ảnh đẹp tuần này" trên Home chỉ là MỘT ảnh tĩnh/tuần, không phải feed cuộn được.
- **Customize widgets: MISSING hoàn toàn** — không có move/resize/pin, xác nhận bằng cả grep code lẫn thao tác UI (không thấy handle kéo, không thấy nút ẩn/hiện widget).
- Layout persistence: N/A vì không có gì để persist (auto layout).

---

## TASK 3 · GAP MAP

### KEEP (đã đúng hướng, đừng động vào)
- Home ambient/greeting/Resume/project-card-single-grid.
- Files hai-ngăn, Library-là-sheet-đè-Files (đúng "một dòng chảy hai trạng thái").
- Present idle state (không wizard).
- Vitals ambient→peek anchor tại tâm vùng làm việc.
- Rail 2-đảo + auto-collapse vào stage.

### FIX (breakage/friction đo được)
1. **Login "Vào xưởng" vẫn màu đồng/cam** — vi phạm chốt 16/08 "bỏ hẳn vàng đồng khỏi màu nhấn", đã biết nợ (00-CHOT ghi rõ), chưa thi hành ở đúng màn khoá.
2. **Vòng lặp thừa Home→card→overview→"Mở canvas"→Home→rail→stage** — B. RETURNING DESIGNER nên là 1-2 bước, không phải 4-5 bước qua lại Home.
3. **Project overview đứng ngoài shell** — không rail, không top bar giống app — đọc như trang khác.

### CONNECT (code đã có, chưa nối tới người dùng)
1. **Page Setup live preview** — hạ tầng có (`ThietLapTrangDayDu`), nhưng chưa "thấy kết quả trong lúc chỉnh" như P0 yêu cầu — đúng §38 hàng đợi MAIN.
2. **ToolWindow neo điều khiển quanh viền** — §26 MAIN handoff, 0 dòng.
3. **Stale/Impact ở cấp app** (Blast-Radius) — hiện chỉ có ở Present/linked-asset-recipe, chưa lan ra Library/Where-Used như đặc tả TRUTH.

### BUILD (thật sự thiếu, 0 dòng)
1. **Activity/Flow right column** — P0 #4, ưu tiên cao nhất còn thiếu hoàn toàn.
2. **Widget move/resize/pin/persistence** — P0 #2 Personal/Customizable, 0 code.
3. **Bell/notification entry point** ở top-right cluster.

### DEFER (không phải bây giờ)
- Credits UI riêng (chỉ có API, chưa rõ có cần trang riêng hay hiện trong Settings là đủ — cần hỏi Hoà trước khi build).
- Plan branch (chưa rõ định nghĩa trong IF — cần làm rõ với ChatGPT/Hoà trước khi map tiếp).

### REJECT (đã có nhưng không được ship theo dạng hiện tại)
- Không phát hiện case REJECT rõ ràng trong lượt duyệt này (khác với "Old synthetic specimen visual" đã REJECTED từ trước và đã tách khỏi critical path theo chốt 20/08 chiều).

---

## GHI CHÚ PHƯƠNG PHÁP (để phiên sau không tự hỏi lại)
- Login: `demo@if.local` / `demo1234`. Project demo: "Nháp" — `cmsl8prn80001w9i2ud3bfdgr`.
- Server đang chạy sẵn ở :3001 (không tự mở server mới, theo `feedback_dev-server-ports`).
- Screenshot của Browser pane trả về ở scale 800×500 dù viewport thật 1440×900 — **luôn dùng `ref` từ `read_page`/`find` để click, đừng tính toạ độ tay** (đã tự bẫy mình 1 lần trong lượt này y hệt bài học cũ "click ngoài khung 800×500").
- Không chạy job Visual Generate/Video thật (tốn credit) — Demo/Trust flow phần "chạy job" còn UNKNOWN có chủ đích, không phải bỏ sót.
