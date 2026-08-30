# BẢN ĐỒ NGHIÊN CỨU CHUẨN — KẾT QUẢ · 38 lĩnh vực

> Trả phiếu `docs/phieu-giao/ban-do-nghien-cuu-chuan.md` + phiếu sửa HAI TRỤC. Lane `05 · THIẾT KẾ/NC`, 30/08/2026.
> Khuôn: mỗi lĩnh vực đúng 4 ô **NGUỒN · NGƯỠNG · ĐO THẾ NÀO · HƠN Ở ĐÂU**. Số ghi từ trí nhớ chuẩn ngành
> của người viết; mục nào chưa chắc phiên bản/con số đã đánh dấu ⚠ hoặc `CHƯA KIỂM NGUỒN` — **đừng dựng cổng
> từ số có dấu ⚠ trước khi tra lại một lần**. KHÔNG nghiên cứu lại phần `IF-CHUAN-NEN.md` đã dựng
> (WCAG sàn · APCA tham khảo · thang mô-đun · 4 luật V) — chỉ trỏ vào.

## ⭐ NÓI TRƯỚC — NHỮNG ĐIỀU CÓ THỂ HOÀ CHƯA BIẾT (thước đo thành công của phiếu)

1. **Thang nét bút IF đang ĐÚNG CHUẨN QUỐC TẾ mà chưa ai khai nhận.** Dãy lineweight `0.13 · 0.18 ·
   0.25 · 0.35 · 0.5 · 0.7 · 1.0 mm` trong UI lớp chính là **dãy ISO 128-24 nhân √2** — đây là tài
   sản chuẩn có sẵn, chỉ cần tuyên bố và khoá bằng test, 0 công thiết kế. (Ngược với thang chữ/bo
   đang sai — cùng một app, một thang chuẩn một thang tự chế.)
2. **Neufert KHÔNG đúng cho người Việt.** Neufert dựng trên nhân trắc percentile Trung Âu; người
   trưởng thành VN thấp hơn trung bình Đức ~8–10cm ⇒ bếp cao 850–900 theo sách Âu là CAO cho đa số
   khách VN (khuyến nghị nghề VN thường 800–850 ⚠). IF có thể **HƠN mọi đối thủ** bằng MỘT tham số:
   `percentile dân số dự án` — Neufert là default, nạp bảng VN (TCVN/số đo điều tra nhân trắc ⚠
   CHƯA KIỂM NGUỒN bản mới nhất) khi dự án ở VN. Không CAD nào phổ biến làm điều này.
3. **CRI đã là chuẩn LỖI THỜI trong nghề chiếu sáng** — IES TM-30-20 (Rf/Rg + đồ thị vector) thay
   nó từ 2020; spec hospitality hiện đại ghi TM-30, không ghi CRI đơn. IF ghi cả hai là "hơn chuẩn".
4. **WELL v2 đo ánh sáng bằng melanopic EDI (lux sinh học), không phải lux thường** — sàn ~150–240
   EDI tại mắt ban ngày ⚠. Render "đúng lux" chưa đủ để tư vấn wellness — IF có thể tính EDI từ phổ
   nguồn sáng đã khai, đối thủ render đẹp không làm được.
5. **Tone mapping là chỗ render "đẹp mà sai"**: pipeline chuẩn hiện nay là ACES (điện ảnh) hoặc AgX;
   albedo vật liệu thật nằm ~30–240 sRGB (không có vật liệu trắng 255/đen 0 trong đời thật) — kho
   PBR nào chứa albedo ngoài dải này là sai vật lý, máy soi được bằng histogram.
6. **"Đơn sắc + 1 accent" của gu Hoà trùng với khoa học thị giác**: vùng nhìn rõ (fovea) chỉ ~2°,
   thị giác màu ngoại vi kém — accent hiếm mới dẫn mắt được; đây là chỗ gu và chuẩn NHẬP MỘT, ghi
   được thành luật máy đếm (số màu nhấn đồng thời trên một màn ≤1 đã có cổng đếm).
7. **Khoảng cách đọc quyết định cỡ chữ trong KHÔNG GIAN** (bảng hiệu, wayfinding hồ sơ in): quy tắc
   nghề ~**25–50mm chiều cao chữ cho mỗi 10m khoảng cách đọc** ⚠ (dải theo độ tương phản) — tức một
   bảng A3 dán tường phòng họp đọc từ 3m cần chữ ≥ ~10mm ≈ 28pt in. IF xuất hồ sơ in mà chưa có
   luật này.
8. **Grid 8pt IF đã có nửa dưới** (`--gap: 8px`, `--row: 28` ⚠ lệch — 28 không chia hết 8): nếu chốt
   lưới 4/8 thì `--row` phải về 28→28 giữ (bội 4) — tức lưới nên là **bội 4**, không phải bội 8, để
   khớp token hiện có; đề xuất cụ thể ở lĩnh vực 14.

---

## HỌ ① — 4 CHỖ TRỐNG HỆ THỐNG (8 lĩnh vực còn lại đã có cổng, không đụng)

### ①-6 · UX — tải nhận thức, số bước, luật chọn mục tiêu
| ô | nội dung |
|---|---|
| NGUỒN | Fitts (1954, mô hình đã kiểm chứng lặp) · Hick–Hyman · Doherty threshold (IBM 1982) · KLM-GOMS (Card–Moran–Newell 1983) · NASA-TLX (đo chủ quan) · ISO 9241-110:2020 (7 nguyên tắc đối thoại) |
| NGƯỠNG | phản hồi hệ thống **<400ms** giữ dòng suy nghĩ (Doherty) · phản hồi tức thì cảm nhận **<100ms** · việc-mỗi-phút ≤ **2 cú bấm/1 phím**, việc-mỗi-ngày ≤ **3 cú** (quy ước nội bộ đặt từ KLM — đếm được) · một menu ngang ≤ **7±2** mục hiển thị đồng thời (Hick + trí nhớ làm việc; rail 7–9 đã chốt khớp) |
| ĐO THẾ NÀO | MÁY: đếm cú bấm kịch bản chuẩn (script Playwright theo luồng `mở dự án→vẽ 1 phòng→dựng→1 trang present`) + đo timestamp phản hồi. NGƯỜI: NASA-TLX phát cho người dùng thật theo đợt. Đo trên **IF** |
| HƠN Ở ĐÂU | IF biết ngữ cảnh (dự án·chặng·selection) ⇒ có thể đưa **đường 1-cú** cho việc lặp (Resume, working-set toolbelt) — app tiêu dùng không có ngữ cảnh nghề để làm vậy |

### ①-8 · Tiếp cận — vùng bấm (phần còn trống duy nhất; sàn WCAG đã chốt ở CHUAN-NEN)
| ô | nội dung |
|---|---|
| NGUỒN | WCAG 2.2 (W3C 2023, hiệu lực): 2.5.8 Target Size Minimum **AA = 24×24px** · Apple HIG 44pt · Material 48dp |
| NGƯỠNG | **CHỌN HAI NẤC, không chọn một**: sàn CHẶN = **24px** (WCAG AA, đúng cho desktop mật độ pro) · sàn CẢM ỨNG = **44px** khi `(hover:none) and (pointer:coarse)`. Đây chính là cơ chế `--tap` 32/44 ĐANG CHẠY — hợp thức hoá: 32 desktop (>24 ✓), 44 chạm ✓ |
| ĐO THẾ NÀO | MÁY (đã có họ soi foundation — thêm luật `F-TAP-TARGET` đo computed size mọi phần tử có onClick). Trên IF |
| HƠN Ở ĐÂU | KHÔNG — đạt hai nấc là đủ; "hơn" ở đây không có nghĩa (to hơn nữa phá mật độ pro) |

### ①-9 · Hiệu năng — ngân sách khung hình cho app dựng hình
| ô | nội dung |
|---|---|
| NGUỒN | RAIL model (Google) · quy ước đồ hoạ realtime 60Hz · Electron/Chromium frame pipeline |
| NGƯỠNG | viewport 2D/3D khi thao tác: **≤16,7ms/khung (60fps)**, mục tiêu pro **≤8,3ms** cho màn 120Hz · input→phản hồi đầu tiên **<100ms** · thao tác nền (import DXF, render) phải có tiến trình sau **<1s** · mở app→màn làm việc được **<5s** (⚠ số nội bộ đặt, không có chuẩn quốc tế cho desktop app — `CHƯA CÓ SỐ` chuẩn ngoài, đây là budget tự tuyên) |
| ĐO THẾ NÀO | MÁY: Playwright trace + `requestAnimationFrame` đếm khung rơi trên kịch bản chuẩn (kéo 500 entity · orbit scene · cuộn gallery 1.600 thẻ — ca 401.805px đã đo là bằng chứng cần budget cuộn). Trên IF |
| HƠN Ở ĐÂU | local-first = không round-trip mạng trong thao tác vẽ — IF PHẢI nhanh hơn app cloud cùng loại; nếu đo thua tức kiến trúc đang bị phí |

### ①-10 · Bảo mật & riêng tư — app local giữ dữ liệu khách
| ô | nội dung |
|---|---|
| NGUỒN | OWASP ASVS 4.x (mức L1 tối thiểu, L2 cho dữ liệu khách) · Electron Security Checklist (chính chủ Electron) · nguyên tắc 3-2-1 backup |
| NGƯỠNG | Electron: `contextIsolation=true` · `nodeIntegration=false` · `webSecurity` bật — **3/3, đo nhị phân** · dữ liệu khách không rời máy khi chưa bật sync (đã là ADR Q14) · backup: **≥2 bản, ≥1 khác thiết bị** (3-2-1 rút gọn cho máy đơn) · log/telemetry: **0 PII** xuất xưởng |
| ĐO THẾ NÀO | MÁY: test đọc config Electron + grep endpoint mạng ngoài whitelist (khuôn `chon-tuyen.mjs --gui` đã có cho chiều gửi-ra) · NGƯỜI: rà đợt phát hành. Trên IF |
| HƠN Ở ĐÂU | local-first là lợi thế bảo mật CẤU TRÚC (không có server để lộ); tuyên bố được "dữ liệu khách không rời máy" là điểm bán — đối thủ cloud không nói được câu đó |
| LUẬT (tách) | GDPR (EU) · Nghị định 13/2023/NĐ-CP bảo vệ dữ liệu cá nhân (VN) — **luật, không phải chuẩn**: IF chỉ cảnh báo khi bật tính năng chia sẻ/sync |

---

## HỌ ② — 26 LĨNH VỰC NGÀNH

### ƯU TIÊN 1 · Lĩnh vực 13+14 — HỆ TỈ LỆ + LƯỚI (đang sai, đã đo)

**13 · Hệ tỉ lệ**
| ô | nội dung |
|---|---|
| NGUỒN | modular scale (truyền thống typography, hệ thống hoá bởi R. Bringhurst *Elements of Typographic Style* + Tim Brown *More Meaningful Typography* 2011) · tỉ lệ vàng 1,618 · Le Corbusier Modulor (1948 — tham khảo lịch sử, KHÔNG dùng làm thang số vì neo 1,829m người Âu) |
| NGƯỠNG | **MỘT tỉ lệ cho một thang.** Đề xuất cụ thể cho IF (nền 12 = sàn V-6, trần ~28–30 hiện dùng): **PA-1 · Minor Third 1,2** → `12 · 14,4→14 · 17,3→17 · 20,7→21 · 24,9→25 · 29,9→30` (6 nấc, bước mịn hợp UI mật độ cao) · **PA-2 · Major Third 1,25** → `12 · 15 · 19 · 23 · 29` (5 nấc, số đẹp, ít nấc hơn). Cả hai làm tròn về **bội 1px, neo nhịp dọc bội 4** (xem 14). Thang bo đề xuất theo cùng tỉ lệ từ nền 6: 1,25 → `6 · 7,5→8 · 9,4→10 · 11,7→12 · 14,6→15 · 18,3→18` — ⚠ hoặc GIỮ thang bo hiện tại và chỉ sửa thang chữ: bo là hình học cảm nhận phi tuyến, chuẩn mô-đun cho bo KHÔNG có nguồn ngành mạnh (`CHƯA CÓ SỐ` chuẩn ngoài cho radius) |
| ĐO THẾ NÀO | MÁY — cổng đã mô tả trong CHUAN-NEN §2 (lệch max–min tỉ lệ, trần sai trung bình ≤0,02); đo trên IF **và** trên hồ sơ IF xuất (deck dùng thang chữ nào thì đo thang đó) |
| HƠN Ở ĐÂU | hồ sơ IF xuất có thể TỰ CHỌN tỉ lệ theo khổ (A3 in ↔ 16:9 chiếu) từ CÙNG nội dung — Canva/PPT bắt người dùng tự căn |

**14 · Lưới & bố cục không gian**
| ô | nội dung |
|---|---|
| NGUỒN | lưới nhịp 4/8pt (quy ước hệ thiết kế hiện đại — Material/HIG đều là biến thể) · Müller-Brockmann *Grid Systems* (1961) cho lưới trang in · tỉ lệ khổ giấy ISO 216 (A-series, 1:√2) |
| NGƯỠNG | **nhịp KHÔNG GIAN = bội 4px** (khớp token sẵn: `--gap 8` ✓, `--pad-card 8/12` ✓, `--tap 32/44` ✓, `--row 28` ✓ — bội 4 ĐẠT cả, chọn bội-4 thay bội-8 để khỏi phá 5 token đang đúng) · line-height chữ làm tròn bội 4 để nhịp dọc khớp lưới · trang hồ sơ in: lưới 12 cột, lề ngoài ≥ **10mm** khổ A3 (⚠ quy ước in nghề, `CHƯA CÓ SỐ` chuẩn ISO cho lề — ISO 216 chỉ chốt khổ) |
| ĐO THẾ NÀO | MÁY: soi computed spacing % 4 ≠ 0 (thêm vào họ foundation); deck xuất soi bằng layout-check sẵn có. Cả IF lẫn sản phẩm IF |
| HƠN Ở ĐÂU | Auto Grid của Present (đã thiết kế) đặt block theo lưới + semantic — người dùng được lưới chuẩn MIỄN PHÍ, không phải biết lưới là gì |

### ƯU TIÊN 2 · Lĩnh vực 1 — NHÂN TRẮC HỌC (tĩnh + động)
| ô | nội dung |
|---|---|
| NGUỒN | Neufert *Architects' Data* (bản Anh hiện hành ⚠ CHƯA KIỂM ấn bản mới nhất) · ISO 7250 (số đo cơ thể) · BS 8300 / ADA cho tầm với-tiếp cận · dữ liệu nhân trắc người Việt (⚠ `KHÔNG TRUY ĐƯỢC` bản điều tra mới nhất từ trí nhớ — cần tra khi nạp kho) |
| NGƯỠNG | các số nghề lõi (Neufert, dùng làm default): lối đi 1 người **≥600mm**, thoải mái **900**, 2 người **1200** · mặt bàn làm việc/bếp **850–920** (Âu) — VN thường dùng **800–850** ⚠ · mặt bàn ăn **750** · ghế ngồi cao **400–450**, sâu **400–480** · tầm với đứng thoải mái **400–1800**, ngồi xe lăn **400–1200** · vòng xoay xe lăn **Ø1500** · chiều cao công tắc **900–1200**, ổ cắm **≥300** ⚠ |
| ĐO THẾ NÀO | MÁY trên **sản phẩm IF làm ra**: checker mặt bằng đối chiếu khoảng hở/route (họ `standards/` ĐÃ có 9 bộ luật — vn-accessibility 16 rule là chỗ cắm; kho Neufert nạp lại thành bộ luật có nguồn + năm + percentile) |
| HƠN Ở ĐÂU | **tham số hoá percentile theo dân số dự án** (điểm 2 phần ⭐): một dropdown "dân số mục tiêu" đổi cả bộ ngưỡng kiểm — chưa thấy CAD phổ thông nào có |

### ƯU TIÊN 3 · Lĩnh vực 9+10+11+12 — ÁNH SÁNG & MÀU
**9 · Khoa học nguồn sáng · 10 · Trắc quang**
| ô | nội dung |
|---|---|
| NGUỒN | EN 12464-1:2021 (chiếu sáng nơi làm việc trong nhà — hiệu lực) · IES Lighting Handbook · WELL v2 (circadian) · CIE 117 (glare UGR) |
| NGƯỠNG | mức rọi duy trì (lux, EN 12464-1 + quy ước nhà ở): hành lang **100** · phòng khách **100–300** · bếp mặt bàn thao tác **300–500** · đọc/làm việc **500** · phòng tắm gương **300–500** ⚠ · UGR văn phòng **≤19** · đồng đều Uo ≥ **0,4–0,6** theo vùng ⚠ · WELL circadian: **≥150–240 melanopic EDI** tại mắt ban ngày ⚠ |
| ĐO THẾ NÀO | trên **sản phẩm IF**: khi mô hình có nguồn sáng khai công suất/phổ → tính lux giả lập (radiosity đơn giản hoặc bảng tra theo phòng); mức đầu: NGƯỜI nhập loại phòng → máy đối chiếu bảng. Trên IF (app): không áp — màn hình theo chuẩn hiệu năng/tương phản đã có |
| HƠN Ở ĐÂU | điểm 4 phần ⭐ — tính **melanopic EDI** từ CCT/phổ nguồn đã khai; render đẹp của đối thủ không mang con số sức khoẻ này |

**11 · Khoa học màu, không gian màu · 12 · Màu dưới ánh sáng**
| ô | nội dung |
|---|---|
| NGUỒN | CIE Lab/ΔE2000 · sRGB (IEC 61966-2-1) · Display-P3 · IES TM-30-20 (Rf/Rg — hiệu lực, thay CRI) · CCT/Duv (ANSI C78.377 ⚠) |
| NGƯỠNG | ΔE2000 **<2** = mắt thường không phân biệt (ngưỡng khớp màu vật liệu ↔ render) · quản lý màu: mọi ảnh xuất gắn ICC profile, mặc định **sRGB**, P3 là opt-in · nguồn sáng nội thất: CCT **2700–3000K** khu nghỉ, **3500–4000K** khu làm việc ⚠ quy ước nghề · TM-30: **Rf ≥80**, hospitality **Rf ≥90, Rg 98–105** ⚠ · CRI ghi kèm cho tương thích spec cũ: **≥90** hospitality |
| ĐO THẾ NÀO | MÁY trên sản phẩm IF: so ΔE giữa swatch vật liệu (matId có sRGB đã khai) và pixel render vùng tương ứng dưới nguồn D65 chuẩn hoá; đọc metadata ICC khi xuất. NGƯỜI: duyệt mắt bản in thử |
| HƠN Ở ĐÂU | vật liệu IF mang matId + màu gốc ⇒ **truy được "màu này lệch bao nhiêu dưới đèn 2700K"** — cửa hàng vật liệu và Canva đều không trả lời được câu đó |

### CÁC LĨNH VỰC NỀN TẢNG CÒN LẠI (4 ô rút gọn — đủ dựng cổng khi tới lượt)

| # | lĩnh vực | NGUỒN | NGƯỠNG | ĐO | HƠN Ở ĐÂU |
|---|---|---|---|---|---|
| 2 | công thái học (làm việc với màn hình) | ISO 9241-5 · quy ước ergonomics | góc nhìn màn ±**30°** từ trục mắt ⚠ · phiên thao tác chuột liên tục nên có điểm nghỉ — `CHƯA CÓ SỐ` chuẩn cho app | NGƯỜI (khảo sát) + MÁY (đếm thao tác/phút) · trên IF | KHÔNG |
| 3 | thiết kế phổ quát | 7 nguyên tắc Universal Design (NC State 1997) · BS 8300 | dùng bộ số xe lăn/tầm với ở lĩnh vực 1; app: mọi năng lực chính có đường bàn phím **100%** | MÁY (kịch bản bàn phím) · cả hai đích | quy trình kiểm phổ quát chạy TỰ ĐỘNG trên mặt bằng — đối thủ để KTS tự nhớ |
| 4 | khoa học thị giác (sinh lý mắt) | thị lực chuẩn 1 phút cung · fovea ~2° · CIE | chữ đọc được: **≥5 phút cung** chiều cao x ⚠ (≈ px theo khoảng cách màn — nối V-6 12px @ ~60cm) | MÁY (đổi ra góc nhìn) · trên IF | nền khoa học cho V-6 — biến luật nội bộ thành luật có nguồn |
| 5 | Gestalt | Wertheimer 1923 + giáo trình thiết kế hiện đại | `CHƯA CÓ SỐ` chuẩn quốc tế — đề xuất quy ước đo được: khoảng cách TRONG nhóm : GIỮA nhóm ≤ **1:2** ⚠ nội bộ | MÁY (đo spacing DOM/layout) · cả hai đích | biến Gestalt thành cổng số — hiếm design system nào dám |
| 6 | độ sâu & phối cảnh | quy ước nhiếp ảnh kiến trúc + quang học | camera nội thất: cao mắt **1500–1600mm** · tiêu cự tương đương **24–35mm** ⚠ · phương đứng PHẢI thẳng (2-point) trừ chủ ý | MÁY trên sản phẩm IF (camera đã là dữ liệu — IF_CAMPATH) | preset "ống kính nghề" đúng số ngay từ node camera |
| 7 | tâm lý thị giác + cảm giác hình học | nghiên cứu preference (Bar & Neta 2006 — góc nhọn kích hoạt cảnh giác ⚠) | `CHƯA CÓ SỐ` — hướng diễn đạt | NGƯỜI | gu bo-tròn của IF có chỗ dựa nghiên cứu, ghi vào giọng tư vấn |
| 8 | bối cảnh văn hoá–tiến hoá | nhân học màu/hình theo vùng (`KHÔNG TRUY ĐƯỢC` một chuẩn thống nhất) | `CHƯA CÓ SỐ` | NGƯỜI (senior review) | máy đọc gu gắn tag bối cảnh → tư vấn "màu này ở thị trường X mang nghĩa Y" — làm SAU, dữ liệu chưa đủ |
| 15 | hình học dựng hình | Euclid/CAD kernel chuẩn · IEEE 754 | sai số khép kín polyline **≤0,5mm** ở tỉ lệ 1:50 ⚠ nội bộ · góc vuông lệch ≤**0,1°** | MÁY (đã có họ hình học + chuan-nap 5 tiêu chí) | cổng nạp DXF 54/54 tệp là bằng chứng đã HƠN mức "mở được là xong" |
| 16 | vật liệu lý-hoá, phản xạ | PBR conventions (Disney/Burley 2012) · tài liệu texture chuẩn | albedo sRGB **30–240** · metalness nhị phân 0/1 (trừ chuyển tiếp) · roughness đủ dải 0–1 | MÁY: histogram texture kho PBR · sản phẩm IF | máy soi albedo cho TOÀN kho vật liệu — đối thủ tin nhà cung cấp |
| 17 | âm học | RT60 (Sabine) · NRC · STC (ASTM E413 ⚠) | phòng khách RT60 **0,4–0,6s** · phòng ngủ cách âm vách **STC ≥45–50** ⚠ | mức đầu: bảng tra theo phòng+vật liệu (NGƯỜI nhập, MÁY đối chiếu) · sản phẩm IF | ghi chú âm học tự động khi chọn vật liệu cứng toàn phòng — mức cảnh báo, không tính toán mô phỏng |
| 18 | nhiệt & tiện nghi | ISO 7730 (PMV/PPD) · ASHRAE 55 | vận hành **23–26°C** mùa nóng ⚠ · PPD **≤10%** | như 17 — bảng tra cảnh báo · sản phẩm IF | KHÔNG (ngoài lõi thị giác; chỉ cảnh báo) |
| 20 | ký hiệu & quy ước bản vẽ | **ISO 128** (nét) · ISO 13567 (lớp) · dãy tỉ lệ chuẩn 1:1→1:100 · ISO 216 khổ | thang nét ĐÃ ĐÚNG (điểm 1 ⭐) · tên lớp theo ISO 13567 khi xuất DXF ⚠ hiện chưa · tỉ lệ chỉ dùng dãy chuẩn (đã có `isStandardPrintScale`) | MÁY (export-checks đã có CHUAN_DAU_RA — mở rộng) · sản phẩm IF | tuyên bố "xuất chuẩn ISO" có TEST đính kèm — hiếm app nhỏ nào dám ký |
| 25 | đo bóc BOQ | VN: định mức/thông tư đo bóc (`KHÔNG TRUY ĐƯỢC` số hiệu hiện hành từ trí nhớ) · quốc tế: NRM2 (RICS) / POMI | làm tròn khối lượng **2 chữ số** · mọi dòng truy được về entity nguồn (**đã là luật specId**) | MÁY (compute + test bất biến đã có) · sản phẩm IF | BOQ đo từ MODEL trực tiếp + truy nguồn từng dòng — hơn quy trình đo tay Excel phổ biến ở VN |
| 26 | logic ràng buộc, va chạm | solver hình học + bộ số nhân trắc (lĩnh vực 1) | cửa mở quét **90°** không vướng · lối thoát ≥**900** ⚠ theo bộ luật đã có (vn-fire 9 rule) | MÁY (checker standards đã chạy) · sản phẩm IF | đã có 9 bộ/82 rule — việc còn là NẠP NGUỒN+NĂM cho từng rule (nhiều rule chưa ghi xuất xứ) |

### 7 LĨNH VỰC DIỄN ĐẠT — chỗ duy nhất gu được sống (chuẩn chỉ đặt SÀN, không đặt TRẦN)

| # | lĩnh vực | NGUỒN | SÀN (số) | ĐO | GU SỐNG Ở ĐÂU |
|---|---|---|---|---|---|
| 7·8 | (đã ở bảng trên — diễn đạt) | | | | |
| 19 | typography trong không gian | quy tắc chữ-khoảng cách (điểm 7 ⭐) | chữ wayfinding ≥ **25mm/10m** ⚠ · in hồ sơ: body ≥ **9pt** ⚠ quy ước in | MÁY trên bản in xuất | chọn font/giọng là gu; SÀN đọc-được là chuẩn |
| 21 | từ ngữ–thị giác–hình học | SPEC-NGON-NGU-CHI-DAN nội bộ (đã có) | nhãn hành động ≤ **12 từ**, hành-động-trước (đã là luật nội bộ) | MÁY (soi chuỗi) · trên IF | giọng thương hiệu là gu |
| 22 | ngôn ngữ điện ảnh | grammar dựng phim (180°, shot size — sách nghề) | `CHƯA CÓ SỐ` — sàn duy nhất: mọi chuyển cảnh giữ trục không gian (đã là luật camera continuity nội bộ) | NGƯỜI | toàn bộ là diễn đạt |
| 23 | dựng ảnh PBR, tone mapping | ACES (AMPAS) · AgX · albedo 30–240 | pipeline khai TÊN tone map trong metadata ảnh xuất · albedo sàn như lĩnh vực 16 | MÁY (metadata + histogram) · sản phẩm IF | look/LUT là gu (nhuom-anh-the ASC CDL đã đúng chỗ này) |
| 24 | kể chuyện hồ sơ | cấu trúc hồ sơ nghề (story-set nội bộ đã có 167 trang tham chiếu) | `CHƯA CÓ SỐ` — sàn: mọi trang có nguồn dữ liệu thật (cổng ⑥) | NGƯỜI | trọn vẹn là gu |

---

## TRỤC QUY TRÌNH 12 BƯỚC — chuẩn nào đứng sau bước nào (vá đúng chỗ phiếu sửa)

| đoạn quy trình | bước | lĩnh vực chuẩn chống lưng |
|---|---|---|
| TRƯỚC 2D | đề bài · ý tưởng · moodboard | ①-6 UX (nhập nhanh) · 5 Gestalt · 7/8 tâm lý-bối cảnh · máy đọc gu (đặc tả đã giao) |
| TRỤC CÔNG CỤ | 2D · 3D · trình bày | 13–15 hình học · 1–3 con người · 9–12 ánh sáng màu · 16 vật liệu · 20 ký hiệu · 22–24 diễn đạt |
| SAU TRÌNH BÀY | soát duyệt | 6 cổng mắt (đã có) + 20 (CHUAN_DAU_RA) |
| | tender | **25 BOQ** + 21 ngôn ngữ (hồ sơ mời thầu đọc được) — `CHƯA CÓ SỐ` cho khuôn hồ sơ tender VN, cần tra thông tư hiện hành |
| | thi công | 26 ràng buộc + 20 (shop drawing kế thừa ISO 128) + LUẬT vùng (PCCC/điện — cảnh báo, không quyết) |
| | bàn giao | `CHƯA CÓ SỐ` — hồ sơ hoàn công theo luật vùng; IF chỉ cần XUẤT ĐỦ GÓI (bản vẽ + BOQ + spec đã là .ifpack) |

## LUẬT QUY ĐỊNH (ngoài hai họ) — IF đọc và cảnh báo, không tự quyết
Danh mục khung: **VN** QCVN 06 (PCCC ⚠ số hiệu cần kiểm) · QCXDVN tiếp cận · tiêu chuẩn điện dân dụng · **EU/US** IBC/ADA/EN tương ứng. **Cách IF biết đang ở vùng nào:** trường vị trí dự án (ProjectProfile — hiện **0 trường vị trí**, nợ đã ghi trong control plane) ⇒ điều kiện tiên quyết của cả mảng cảnh báo luật là **thêm trường vùng/quốc gia vào hồ sơ dự án**; chưa có nó thì mọi cảnh báo luật là đoán.

## CHƯA CHẮC · HẠN DÙNG
- Mọi ô đánh ⚠ = số/phiên bản từ trí nhớ nghề, **phải tra lại nguồn gốc trước khi thành cổng** (đặc biệt: ấn bản Neufert · nhân trắc VN · ANSI C78.377 · ASTM E413 · thông tư đo bóc VN · QCVN PCCC). Phiếu này là BẢN ĐỒ chỉ đường + con số làm việc, không phải trích dẫn học thuật.
- 8 lĩnh vực hệ thống đã-có-cổng: không rà lại theo đúng lệnh phiếu — nếu cổng nào trong 8 cái đó hoá ra đo thiếu, ngoài phạm vi phiếu này.
- HẠN DÙNG: bảng ưu tiên đúng tới khi thang chữ được sửa thật (khi đó lĩnh vực 13 chuyển từ "đang sai" sang "canh giữ"); phần luật vùng chờ trường vị trí dự án.
