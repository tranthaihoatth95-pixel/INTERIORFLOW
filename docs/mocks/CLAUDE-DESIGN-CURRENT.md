# CLAUDE DESIGN — CURRENT POINTER + DESIGN QUEUE

> **Vai:** đây là BẢNG ĐIỀU KHIỂN THIẾT KẾ (control plane), KHÔNG phải một bản vẽ.
> MAIN đọc file này TRƯỚC khi dựng bất kỳ màn nào. MAIN **không tự thiết kế**.
>
> **Luật:** `APPROVED TARGET` → dựng đúng bản đó · `IN DESIGN` → không bịa, làm frontier khác ·
> `DESIGN REQUIRED` → MAIN **phải giao ngay** cho Claude Design (không chỉ ghi "cần thiết kế") ·
> `SUPERSEDED` → cấm dựng.
>
> Bản vẽ Claude Design nằm ở `docs/mocks/*.dc.html`. Mock HTML tay cũ (`mock-*.html`) chỉ là
> tham chiếu lịch sử, **không** phải target trừ khi ghi rõ dưới đây.

Cập nhật: 22/08/2026 · nguồn: MAIN kiểm `ls docs/mocks/*.dc.html` + đối chiếu bảng frontier.

---

## 1 · APPROVED TARGET — dựng đúng bản này

| Màn | Bản vẽ (target) | MAIN dựng tới đâu |
|---|---|---|
| ⭐ **NỀN MÓNG · Foundation System Sheet** — KHÔNG phải một màn, là THANG ĐO mọi màn bị chặn ở đó (6 vai chữ · 10 nấc giãn cách có nghĩa · vai màu + kênh thứ hai bắt buộc · **luật icon** · G0–G3 số chính xác · elevation/motion/mật độ) | `docs/mocks/claude-foundation-system.dc.html` | **APPROVED TARGET CANDIDATE — chờ Hoà duyệt mắt** · §09 = **40 luật máy-kiểm-được**, hợp đồng cho guard `soi:foundation` · §08 = **11 mâu thuẫn đo được trong `globals.css`** (2 thang chuyển động song song · `body` tracking âm trên chữ Việt · G0–G3 vắng mặt 0 lần trong code · `--accent`/`--t4`/`--warning` trượt tương phản) · **lucide LÀ hệ**, ràng lại bằng luật chứ không thay: 1.5 stroke · lưới 24 · 4 cỡ 14/16/18/20 (nền hiện tại: 12 độ dày, 12+ cỡ) |
| **HOME · Living Canvas (bản campaign 22/08)** | `docs/mocks/claude-home-living-canvas-final.html` | 🔴 **CANDIDATE — CHẶN, KHÔNG dựng nguyên bản.** Bố cục/vỏ ĐÚNG hướng (`<nav class="rail">` · `<header class="thanh-tren">` · `vitals-edge` · không khí 19 chỗ). Nhưng vướng **HAI LUẬT ĐANG HIỆU LỰC** — xem §5 · ⛔ **SUPERSEDED bởi v2** (đồng hồ ánh sáng + rác test 21/21) |
| ~~**HOME · Living Canvas v2**~~ | `docs/mocks/claude-home-living-canvas-v2.html` | ⛔ **SUPERSEDED 23/08 — THAY BỞI `docs/design-campaign/dna/HOME-SPEC-2026-08-23.md`.** 🔴 **DÒNG NÀY TỪNG NÓI DỐI TỚI 26/08:** chính tệp v2 đóng dấu superseded ngay dòng 3 từ 23/08, nhưng chỉ mục này vẫn ghi APPROVED CANDIDATE thêm ba ngày. Một phiên Codex đọc chỉ mục (đúng thứ được lập ra làm con trỏ chính thức) và kết luận v2 là target hiện hành — **nó không sai, chỉ mục sai**. Lần thứ BA cùng bệnh: đóng dấu TỆP mà quên CON TRỎ. ⇒ Luật: đóng dấu superseded là **hai việc**, thiếu việc thứ hai thì việc thứ nhất phản tác dụng — vì nó tạo ra hai nguồn nói ngược nhau mà cả hai đều trông chính thức. *(Sáu thứ v2 đã giải và bản kế phải THỪA KẾ: xem diff trong đầu tệp v2, đừng bỏ.)* ~~APPROVED TARGET CANDIDATE~~ · đóng cả hai lỗi §5: bỏ HẲN mặt đồng hồ ánh sáng (giờ chỉ còn tác động qua hướng sáng · ấm-lạnh · độ sáng · hướng+độ dài+độ mềm của bóng · độ sắc mép chùm), gỡ sạch `19 / Bản nháp` · `21/21` · `ẢNH ĐẸP TUẦN NÀY`. 5 artboard: mặc-định-rỗng · ba giờ · có-dữ-liệu · 1100px · *Vào xưởng* nghỉ/rê/bấm KHÔNG quầng sáng |
| **ACTIVE-HOME / HỆ NỘI DUNG TƯƠNG LAI** — ⛔ **KHÔNG PHẢI First-Use Home** (6 vật · D0–D3 · G0–G3 · tràn 21 dự án) | `docs/mocks/claude-home-widget-system.html` | **NGHIÊN CỨU TƯƠNG LAI — chưa vào gói duyệt** |
| ~~HOME · Dùng lần đầu~~ | `docs/mocks/claude-home-first-use.html` | ⛔ **SUPERSEDED / REJECTED (22/08)** — hướng trung gian đã BỎ. **CẤM dựng. CẤM xin duyệt lại.** Không có "First-Use Home" như một màn/khái niệm riêng: **MỘT hệ Home, nhiều TRẠNG THÁI DỮ LIỆU**; zero-state chỉ là một trạng thái của nó |
| **HOME / Living Canvas** (6 bản A–F, §10) | `docs/mocks/Home.dc.html` | NOT STARTED ← bản MAIN tự ghép (wave 1/5) KHÔNG phải target · ⛔ SUPERSEDED bởi bản campaign (bố cục 4 dải bị bác §4/§41) |
| **Auth / Login / Lock / Resume** (6 bản A–F) | `docs/mocks/Auth.dc.html` | NOT STARTED |
| **Workspace / Canvas + Cửa sổ công cụ** (A–G, 3 nấc + vệ tinh) | `docs/mocks/Workspace-ToolWindow.dc.html` | NOT STARTED |
| 3D · Dựng khối | `docs/mocks/3D Dựng khối.dc.html` | PARTIAL — §11 gọi đây là chuẩn chất lượng |
| Project Ingest | `docs/mocks/Nhập bản vẽ có sẵn.dc.html` | PARTIAL |
| Bốn trạng thái rỗng | `docs/mocks/Bốn trạng thái rỗng.dc.html` | PARTIAL |
| Project Overview | `docs/mocks/Tổng quan dự án.dc.html` | PARTIAL |
| Master Library | `docs/mocks/Thư viện.dc.html` | PARTIAL (lane B: kệ 73 món thật) |
| Vitals | `docs/mocks/Vitals.dc.html` + `Vitals glyph.dc.html` | COMPLETE (bảng 🟢 mục 1) |
| 2D Kỹ thuật | `docs/mocks/2D Kỹ thuật.dc.html` | PARTIAL |
| 2D · hai chế độ | `Chế độ Phác thảo.dc.html` · `Chế độ Chuyên.dc.html` | PARTIAL |
| Sidebar Map | `docs/mocks/mock-sidebar-ban-do-2026-08-22.html` | COMPLETE (🟢 mục 5) — bản 22/08 |
| Xem cấu kiện | `docs/mocks/Xem cấu kiện.dc.html` | PARTIAL |
| **Kéo thả VIỆC · khổ ĐIỆN THOẠI** (9 bản, `width:393px`) | `docs/mocks/Kéo thả.dc.html` | NOT STARTED — ⭐ **bản vẽ CHẠM/DI ĐỘNG DUY NHẤT của cả kho** |
| ~~Kéo thả library→canvas~~ | **KHÔNG CÓ BẢN VẼ** | 🔴 lỗ thật — production ĐÃ chạy 22/08 nhưng vật rơi xuống thiếu `specId` (xem `TRANSFER-NOTE-2026-08-22-library-drop-specid.md`). Trước nay dòng này trỏ nhầm sang tệp trên nên **lỗ bị che** |
| Bảng việc / Lịch / Gantt | `Bảng việc.dc.html` · `Lịch · Nhắc việc.dc.html` · `Tiến độ · Gantt.dc.html` | NOT STARTED |
| BOQ → báo giá | `docs/mocks/Báo giá từ bảng khối lượng.dc.html` | PARTIAL |
| Xuất PDF / tờ giấy | `HopXuatPDF.dc.html` · `ToGiay.dc.html` · `BangNetIn.dc.html` | PARTIAL |
| Chat nhóm | `docs/mocks/Chat nhóm.dc.html` | NOT STARTED |
| Phiên bản hồ sơ | `docs/mocks/Phiên bản hồ sơ.dc.html` | NOT STARTED |
| **Settings** (A vỏ · B Màn hình chính MỚI · C Đơn vị & tỉ lệ · D chưa đặt · E 1100px) | `docs/mocks/Settings.dc.html` | NOT STARTED |
| **Gallery / Explore** (A duyệt · B bộ sưu tập · C soi ảnh · D rỗng · E Explore · F 1100px) | `docs/mocks/Gallery-Explore.dc.html` | NOT STARTED |
| **Review Gate · Cổng soát duyệt** (A bảng kiểm · B mục mở rộng · C cặp LUẬT ↔ GÓP Ý · D sạch · E cổng xuất · F 1100px) | `docs/mocks/Review-Gate.dc.html` | NOT STARTED |
| **Liquid Glass · thang vật liệu G0–G3 + Vào xưởng** (G1 kính phẳng = chủ đạo · G3 = hiếm) | `docs/mocks/claude-liquid-glass-system.html` | **APPROVED TARGET CANDIDATE — chờ Hoà duyệt mắt** |
| **LOGIN → HOME · liên tục ambient (campaign 22/08)** | `docs/mocks/claude-login-home-ambient-final.html` | **APPROVED TARGET CANDIDATE — chờ Hoà duyệt mắt** ⛔ **BỊ BÁC 22/08 (verdict: đọc như SaaS auth card)** |
| **LOGIN · 3 phương án dựng lại (A/B/C — sau verdict FAIL 22/08)** | `docs/mocks/claude-login-redesign-abc.html` | **APPROVED TARGET CANDIDATE — chờ Hoà duyệt mắt** |
| **COLD OPEN · môi trường thức trước giao diện** (6 trạng thái COLD→HOME_READY · thay intro 60 giây) | `docs/mocks/claude-cold-open.dc.html` | **APPROVED TARGET CANDIDATE — chờ Hoà duyệt mắt** · thay `components/intro/IntroSequence.tsx` (`:45 SCENE_DURATIONS` = 60 000 ms → **320 ms tới lúc gõ được**). Liên tục bằng **lớp trường gắn ở vỏ**, KHÔNG cần bỏ `router.push`. 5 artboard: dải phim 6 trạng thái · khung bàn giao · đang-gõ-lúc-còn-ổn-định · bản giảm chuyển động (2 bản tĩnh + 1 hoà tan 180 ms) · thang nhịp. Tương thích cả 3 phương án Login A/B/C |

## 2 · DESIGN REQUIRED — MAIN ĐÃ GIAO cho Claude Design

| # | Màn | Vì sao thiếu | Trạng thái giao |
|---|---|---|---|
| D5 | Present Template Browser | 0 `.dc.html`; chưa có bộ mẫu thật | HÀNG ĐỢI |
| D8 | Visual Pipeline / Render (vành ngữ nghĩa) | 0 `.dc.html` cho vành trạng thái job thật | HÀNG ĐỢI |

## 3 · SUPERSEDED — CẤM dựng

`mock-cad-shell-v2..v5_cu.html` · `mock-2d-ky-thuat_cu.html` · `mock-cad-shell-pro_cu.html`
→ đã bị `2D Kỹ thuật.dc.html` thay. Hậu tố `_cu` = bản cũ, giữ làm dấu vết.

---

## 4 · KHUÔN BRIEF (MAIN → Claude Design) — chỉ 9 ô, cấm gửi cả lịch sử IF

```
SCREEN · PURPOSE · REAL STATES · CANONICAL CONSTRAINTS (≤5) ·
EXISTING FUNCTION · EXACT FILES (≤8) · RELATED APPROVED REFERENCES ·
DO NOT · OUTPUT REQUIRED
```

Claude Design trả về: lưu `docs/mocks/<Tên>.dc.html` → cập nhật CHÍNH file này → báo đường dẫn
cho MAIN. **Không mock mồ côi. Không màn do MAIN tự vẽ.**


---

## 5 · 🔴 CHẶN — Home target hiện tại vướng hai luật (MAIN đo 22/08, KHÔNG tự sửa)

`claude-home-living-canvas-final.html` là bản **gần nhất và đúng hướng vỏ**, nhưng dựng nguyên
bản sẽ vi phạm hai luật đang hiệu lực. MAIN **không tự thiết kế lại** — đây là việc của phiên
thiết kế. Ghi ở đây để không ai lỡ tay dựng.

### ① Dụng cụ ánh sáng đã bị BÁC vẫn còn được VẼ RA
`:1004-1008` (lặp lại ở `:1264`, `:1607`) render một `<div class="vat">` chứa
`<svg aria-label="05:00 · BAN NGÀY · 5600K · 20:00">` — cung mặt trời + vạch kỹ thuật +
số Kelvin đứng yên. Chú thích ngay trên nó ghi *"thuộc KHÔNG KHÍ, không phải widget"* —
nhưng **lời khai và mã vẽ nói ngược nhau**: mã vẫn vẽ đúng cái đồng hồ đo.

Luật: ánh sáng ngày **KHÔNG phải widget**. Cấm cung mặt trời · cấm `05:00`/`20:00` lúc nghỉ ·
cấm `5600K` lúc nghỉ · cấm vạch kỹ thuật · cấm đồ thị kiểu bảng thời tiết.
Ánh sáng ngày phải tác động qua **hướng sáng · cân bằng ấm/lạnh · độ sáng môi trường · độ mềm
bóng đổ · phản ứng vật liệu**. Người dùng **CẢM** được giờ, không **ĐỌC** được đồng hồ.
`:1799` đã ghi đúng nguyên lý (nhiệt độ màu → `--amb-sang`) — giữ NGUYÊN LÝ đó, bỏ MẶT ĐỒNG HỒ.

### ② Rác test bị đóng đinh vào bản vẽ như thể là sự thật
`:870-874` khai *"Mọi chữ tiếng Việt … là chuỗi ĐO ĐƯỢC trên app đang chạy"* và
*"Không con số nào được bịa"*, rồi chép vào: `19 / Bản nháp`, `Tất cả dự án 21/21`,
`ẢNH ĐẸP TUẦN NÀY`.

Đo tại nguồn: 15 hàng `Project` = 5 `__nb:` placeholder + ~4-5 fixture ⇒ **số dự án THẬT của
người dùng ≈ 0**. Nên `21/21` và `19 Bản nháp` là **RÁC TEST**, không phải dữ liệu.
*Đo được trên app* và *là sự thật sản phẩm* là **hai chuyện khác nhau** — đây đúng là cách rác
test leo lên thành yêu cầu thiết kế.
`ẢNH ĐẸP TUẦN NÀY` cũng vướng luật ảnh: ảnh cảm hứng chỉ được lấy từ **Gallery/Explore thật**,
cấm ảnh chụp màn app / khung nhìn 3D.

### Cần ở bản sửa
Giữ vỏ (rail · thanh trên · vitals-edge · trường không khí). Bỏ mặt đồng hồ ánh sáng, giữ vật lý
môi trường. Vẽ Home ở **trạng thái không có dữ liệu thật** (0 dự án · 0 phiên dở · 0 ảnh) là
trạng thái mặc định, và trạng thái có dữ liệu là biến thể — **cùng một Home**. Widget G0–G1 là
chính, G2 khi có lý do, G3 hiếm. *Vào xưởng* = nền tím đặc + thấu kính quang học, **không quầng sáng**.
