# SPEC — ARCHINOTE CHI TIẾT: Kiến trúc tính năng → Giao diện người dùng

> Duyệt 01/08/2026 (5 đề xuất E2, sửa điều 2 — xem `CHOT-DUYET-SPEC-DOT2-2026-08-01.md` §1c).
> Cụ thể hoá `SPEC-ARCHINOTE-IF-BOUNDARY.md` (định vị) + phần còn sống của
> `MASTERPLAN-IF-ARCHINOTE.md` (24/07) thành **1 cây tính năng mã hoá + UI có Hero + hợp đồng
> đồng bộ 2 chiều với IF1-2**, theo đúng khuôn `IF-MASTER-BLUEPRINT.md` để hai hệ soi được nhau.
> Đọc cùng: `SPEC-ARCHINOTE-IF-BOUNDARY.md` · `SPEC-NAVIGATION-MODEL.md` §7 · `SPEC-KNOWLEDGE-BASE.md`
> · `docs/IF-MASTER-TREE.md` mục 1.4 (đối chiếu code IF thật) · `ttt-tasks/CLAUDE.md` (code ArchiNote thật).

---

## 0 · ĐỐI CHIẾU NGUỒN SỰ THẬT — trước khi đọc tiếp

Hai bản trước nói khác nhau về ArchiNote là gì. File này đi theo bản **mới nhất** (26/07), không phải bản 24/07.

| | `MASTERPLAN-IF-ARCHINOTE.md` (24/07) | `SPEC-ARCHINOTE-IF-BOUNDARY.md` (26/07) — **bản đang dùng** |
|---|---|---|
| Định vị | "Sổ tay KTS" — Home 4 khu tài nguyên + Dashboard nổi + PM | **App hiện trường** — đo đạc · ảnh · ghi chú · tư vấn tại chỗ |
| Vỏ | Không nói rõ | **Capacitor** mobile, bọc web hiện có |
| Quan hệ với IF | Ngầm hiểu có gọi qua lại | **Không app nào gọi app nào** — chỉ cùng đọc/ghi Lark |

Phần **AN-3 "Điều phối người"** của bản cũ vẫn đúng tinh thần — boundary spec §5 xác nhận lại gần
như nguyên vẹn ("5 thứ, không hơn"). File này giữ phần đó, bỏ phần Home/Gallery/NotebookLM 4 khu.

### 0.1 Tầm nhìn vs. code thật hôm nay (28/07)

| | Tầm nhìn (boundary spec) | Thật — repo `ttt-tasks` |
|---|---|---|
| Vỏ | Capacitor, mobile-first | **Next.js web** (App Router), chưa đóng gói Capacitor |
| Việc làm được | Đo đạc · ảnh · ghi âm · panorama · AI tại chỗ · an toàn · điều phối | **Chỉ điều phối**: Dashboard/Kanban/Gantt/Calendar/Staff |
| Quan hệ Lark | Đọc + ghi có kiểm soát, 2 chiều | **CHỈ ĐỌC** (`CLAUDE.md`: "Chỉ ĐỌC Lark Base. Không create/update/delete") |
| Auth | *(bản 24/07 từng đề xuất "share JWT với IF")* | **NextAuth riêng, độc lập** — thực ra đúng hơn bản cũ (xem A5.2) |
| Dữ liệu thật đang đọc | — | Bảng `Chi tiết công việc` (46 việc) · `Nhân sự` (115 người, 11 Creative Design) |

⇒ **Kết luận dùng xuyên suốt file này**: ArchiNote hôm nay mới có **đúng 1 trong 5 module** của tầm
nhìn (Điều phối, ở dạng đọc). Phần còn lại (Hiện trường, Trợ lý, Vị trí & An toàn, Hạ tầng nền) là
**0% code** — cây tính năng bên dưới đánh dấu rõ như `IF-MASTER-TREE.md` vẫn làm (✅ / 🟡 / ⬜).

---

## PHẦN A · KIẾN TRÚC TỔNG THỂ

### A1. Ba hệ, ba vai (rút từ `SPEC-NAVIGATION-MODEL.md` §7)

```
   ARCHINOTE 📱              INTERIORFLOW 💻            ATLAS ☁️
   (hiện trường)               (xưởng)                (điểm gặp)
   Capacitor mobile          Electron desktop          Lark Base
   ─────────────             ─────────────             ─────────────
   đo · ảnh · ghi âm         Ý tưởng → CAD →          MATERIAL
   panorama · GPS            Render → Present →        STYLE_DNA
   nắng·gió·view              Movie                    DEVELOPER
        │                          │                   PROJECT_STATUS
   nặng ở máy                nặng ở máy                nhẹ, dùng chung
        └──── nhẹ ──────►  ◄────── nhẹ ────┘
                    (cả hai ĐỌC/GHI Lark — không app nào GỌI app nào)
```

### A2. Bốn tầng kỹ thuật ArchiNote (song song T0–T5 của IF, gọn hơn vì app nhỏ hơn)

| Tầng | Là gì | Chứa gì |
|---|---|---|
| **T3** | Tính năng | 5 module — PHẦN C |
| **T2** | Động cơ | Lark client (đã có) · STT engine · LiDAR/AR-anchor engine · SunCalc · offline upload-queue |
| **T1** | Lõi mã chung | `src/types/domain.ts` (hợp đồng — "không tự sửa, cần đổi báo kiến trúc sư trưởng") · schema Lark (`PROJECT_STATUS`/`MEASUREMENT`/`CASE`) |
| **T0** | Vỏ | Next.js web (hiện tại) → **Capacitor** (mục tiêu) — cùng 1 codebase React, bọc thêm native shell |

### A3. Năm khối chức năng (T3)

```
① ĐIỀU PHỐI          Gantt/Kanban · tải nhân sự · cờ đỏ          ✅ có (đọc-only)
② HIỆN TRƯỜNG         đo đạc · ảnh · ghi âm · panorama            ⬜ 0%
③ TRỢ LÝ & TRA CỨU    Ops Assistant · ATLAS · từ điển · case      ⬜ 0%
④ VỊ TRÍ & AN TOÀN     bản đồ · geofence · safety check-in · SOS  ⬜ 0%
⑤ HẠ TẦNG NỀN          offline-first · upload queue · nén         ⬜ 0%
     ↕ tất cả nối qua ATLAS/Lark — KHÔNG gọi thẳng InteriorFlow
```

### A4. Nguyên tắc chia dữ liệu (không đổi so với boundary spec)

> **Dữ liệu nặng ở lại máy — dữ liệu điều phối bay lên Lark.**

| Loại | Nằm đâu | Vì sao |
|---|---|---|
| Ảnh gốc · âm thanh gốc · panorama gốc | Máy điện thoại (local-first) | Nặng, cần offline, cần xem lại chính xác |
| Phân công · trạng thái dự án · số đo tóm tắt | Lark Base | Nhiều người phải thấy, mọi lúc, mọi máy |
| Sách · quy chuẩn · ATLAS vật liệu | Lark + bản tải về máy | Tra được cả khi mất mạng |

### A5. Sáu luật vận hành *(hiến pháp ArchiNote — song song "Tám luật" của IF)*

1. **Hai app không gọi nhau** — chỉ cùng đọc/ghi Lark. *(Huỷ ý cũ "share JWT với IF" ở bản
   MASTERPLAN 24/07 — mâu thuẫn trực tiếp với luật này; xem E2.1.)*
2. **Auth riêng, độc lập với IF** — NextAuth hiện tại của `ttt-tasks` đã đúng hướng, không cần
   thống nhất JWT với IF.
3. **Không stream liên tục lên Lark** — chỉ đẩy khi có mốc (chụp xong, đo xong, đóng ca), giống
   quy tắc IF chỉ đẩy `PROJECT_STATUS` khi có mốc, không đẩy real-time.
4. **Offline-first bắt buộc** — mọi thao tác capture phải ghi được khi mất sóng, không có ngoại lệ.
5. **Không giám sát nhân viên** — an toàn = check-in chủ động, không tracking nền liên tục
   (xem C4/D7).
6. **Metadata bắt buộc mọi số đo/ảnh** — nguồn · sai số · ai · khi nào · đã kiểm chưa. Output
   không có metadata = mồ côi = không ship (song song Luật 5 của IF: "output mồ côi không ship").

---

## PHẦN B · HỢP ĐỒNG DỮ LIỆU — ĐỒNG BỘ 2 CHIỀU VỚI IF1-2 ⭐

> Đây là phần trọng tâm được yêu cầu rõ nhất: **support 2 chiều thật, không phải khẩu hiệu.**
> Nguyên tắc: **hai luồng một chiều, không bao giờ sửa cùng bản ghi** (mỗi field có đúng 1 chủ ghi).

### B1. Sơ đồ luồng

```
ARCHINOTE (hiện trường)                    INTERIORFLOW (xưởng)
 đo đạc · ảnh · ghi chú · lời khách
        │
        ▼  ⟶ luồng NHẬP ⟶
   ┌──────────────────────────────┐
   │   LARK BASE + NÃO T5         │
   │ hiện trạng · ATLAS vật liệu  │──▶ IF đọc: dựng bản vẽ từ số đo thật (Luồng D, `SPEC-NAVIGATION-MODEL.md` §3)
   │ chi tiết điển hình · case    │
   │ PROJECT_STATUS · điều phối   │
   └──────────────────────────────┘
        ▲  ⟵ luồng TRẠNG THÁI ⟵
        │
 ArchiNote đọc: dự án tới đâu, ai rảnh, phương án nào chờ duyệt
```

**Liên hệ IF2 (không chỉ IF1)**: số đo có metadata sai số (laser ±1-2mm) là đầu vào **bắt buộc**
cho độ chính xác BIM/IFC 4.0 (IF2-B) — LiDAR (±2-5cm) không đủ chuẩn cho hồ sơ DD. Panorama ghim
mặt bằng cũng là nguyên liệu thô cho storyboard "từ dự án THẬT" (2.4.1.b Movie Studio) khi IF lên
tới chặng đó. Hai điểm nối này **chưa cần code ngay** nhưng khi thiết kế schema (B2-B4) phải để hở
chỗ cắm, không phải sửa lại từ đầu.

### B2. Bảng `PROJECT_STATUS` — hợp đồng tối thiểu (bảng Lark **MỚI**, khác bảng `Chi tiết công việc` đang đọc)

| Field | Type | Ai ghi | Ai đọc | Ghi chú |
|---|---|---|---|---|
| `projectId` | string (cuid, khớp id `.idf`) | IF | ArchiNote | khoá nối 2 hệ |
| `stage` | enum: ý tưởng / cad / render / present | IF | ArchiNote | hiện dạng 4 chấm màu trên card dự án (D2) |
| `percent` | 0–100 | IF | ArchiNote | |
| `updatedAt` | epoch ms | IF | ArchiNote | |
| `linkOpen` | URL deep-link mở đúng dự án | IF | ArchiNote | |
| `chuTri` (link field → Nhân sự) | record link | ArchiNote (đã có) | IF | field đã tồn tại thật trong bảng `Chi tiết công việc` |

> 🔴 **Trạng thái thật (từ `IF-MASTER-TREE.md` 1.4.2)**: *"phía IF xác nhận KHÔNG có bridge nào đẩy
> trạng thái lên Lark"* — bảng này hiện là **0%, cả hai phía chưa build phần ghi**. Bảng
> `Chi tiết công việc` ArchiNote đang đọc là **task-level**, không phải **project-stage-level** —
> cần tạo bảng Lark mới đúng tên `PROJECT_STATUS` nếu muốn khớp hợp đồng này (xem E2.4).

### B3. Bảng `MEASUREMENT` — mỗi số đo mang theo độ tin cậy

| Field | Type | Ai ghi | Ai đọc | Ghi chú |
|---|---|---|---|---|
| `giá trị` | number (mm) | ArchiNote | IF | |
| `cách đo` | enum: lidar / laser / manual | ArchiNote | IF | quyết định IF vẽ nét chuẩn hay nét đứt |
| `sai số ±` | number (mm) | ArchiNote | IF | laser ±1-2mm · LiDAR ±2-5cm · tay ±5-10mm |
| `ai đo` · `khi nào` | string / timestamp | ArchiNote | IF | |
| `đã kiểm chưa` | boolean | ArchiNote | IF | laser đè lên LiDAR tại đúng cạnh (quy trình scan-to-BIM) |

> 🔴 **Trạng thái thật (`IF-MASTER-TREE.md` 1.4.4)**: IF **chưa có field "nguồn đo" trên entity
> CAD** — nghĩa là kể cả khi ArchiNote gửi số đo đúng chuẩn, IF hiện **chưa có chỗ nhận và hiển thị
> khác biệt** nét chuẩn (đen) / nét sơ bộ (cam, đứt). Đây là việc 2 phía cùng phải làm, không phải
> việc riêng ArchiNote.

### B4. Bảng liên kết `MATERIAL` (ATLAS)

| Field | Ai ghi | Ai đọc |
|---|---|---|
| `matId` · mã · hãng · giá · NCC · ảnh · PBR | ATLAS Larkbase (nhập tay/import) | Cả hai |
| Giá/tồn kho cập nhật hiện trường | ArchiNote (khi tư vấn tại chỗ) | IF (khi tô vùng vật liệu, nối `matId`) |

⚠️ **Phụ thuộc thứ tự** (theo `KE_HOACH_3_NGAY_SHIP_IF1.md` mục 6): ATLAS Larkbase là ưu tiên **#2**,
đứng **trước** ArchiNote (#3) — vì B4 vô nghĩa nếu ATLAS chưa có dữ liệu vật liệu thật để nối vào.

### B5. Bảng liên kết `CASE` / chi tiết điển hình

Nuôi Knowledge Base dùng chung (`SPEC-KNOWLEDGE-BASE.md` §6) — **hạng C kinh nghiệm**, không phải
chuẩn pháp lý. ArchiNote ghi, cả hai trợ lý (Vitals của IF · Ops Assistant của ArchiNote) đọc.

### B6. Luật sở hữu field — không sửa cùng bản ghi

| Bảng | Field IF sở hữu (ghi) | Field ArchiNote sở hữu (ghi) |
|---|---|---|
| `PROJECT_STATUS` | `stage`, `percent`, `updatedAt`, `linkOpen` | `chuTri`, cờ đỏ thiếu người |
| `MEASUREMENT` | *(chỉ đọc)* | toàn bộ |
| `MATERIAL` | `matId` áp vào `.idf` | giá/tồn kho hiện trường |

Mỗi field có **đúng 1 chủ ghi** — bên còn lại chỉ đọc. Không có field nào 2 bên cùng ghi.

### B7. Bảng tổng hợp khoảng trống *(gap-check, kéo từ `IF-MASTER-TREE.md` 1.4.x)*

| # | Việc | Ai phải làm | Trạng thái |
|---|---|---|---|
| 1 | Bridge đẩy `PROJECT_STATUS` lên Lark | IF | ⬜ chưa có |
| 2 | Field "nguồn đo" trên entity CAD + hiển thị nét chuẩn/nét đứt | IF | ⬜ chưa có |
| 3 | Tạo bảng Lark `PROJECT_STATUS` đúng schema B2 | ArchiNote/Ops (Lark) | ⬜ chưa có (đang lẫn với `Chi tiết công việc`) |
| 4 | Mở ghi có kiểm soát lên Lark (hiện `ttt-tasks` chỉ đọc) | ArchiNote | ⬜ luật cứng đang chặn (đúng ý, chỉ mở khi cần) |
| 5 | SunCalc / windrose (phân tích toạ độ) | ArchiNote (rồi IF đọc để dựng "Site & Context" 2.0.2.a) | ⬜ 0 kết quả grep cả 2 phía |

---

## PHẦN C · CÂY TÍNH NĂNG ARCHINOTE *(mã `AN`, thang N/P/L như IF)*

> Ký hiệu: **N** = nền bắt buộc · **P** = tốt hơn công cụ thường (Lark/Zalo/Excel) · **L** = lai trội (moat).
> Cột Code lấy từ `ttt-tasks` thật (28/07).

### AN-0 · NỀN MÓNG

| Mã | Tính năng | Bậc | Code |
|---|---|---|---|
| AN-0.1 | Auth riêng (NextAuth), **không** share JWT với IF | N | ✅ |
| AN-0.2 | Đọc Lark Base server-side, token chỉ ở server (`LARK_*` không `NEXT_PUBLIC_`) | N | ✅ |
| AN-0.3 | `src/types/domain.ts` — hợp đồng chung, chỉ kiến trúc sư trưởng sửa | N | ✅ |
| AN-0.4 | Đóng gói **Capacitor** (mobile-first thật) | N | ⬜ |
| AN-0.5 | Offline-first storage (IndexedDB/SQLite local) | N | ⬜ |
| AN-0.6 | Upload queue nền + nén trước khi gửi | N | ⬜ |
| AN-0.7 | Ghi Lark có kiểm soát (hiện chỉ đọc — mở đúng field theo B6 khi cần) | P | ⬜ (đang chặn cứng theo chủ đích) |

### AN-1 · MODULE ① ĐIỀU PHỐI *(Coordination — đã có MVP thật)*

| Mã | Tính năng | Bậc | Code |
|---|---|---|---|
| AN-1.1 | Ai đang gánh gì · ai sắp rảnh | N | ✅ `StaffList.tsx`, `StatCard.tsx` |
| AN-1.2 | Dự án nào thiếu người (cờ đỏ) | N | ✅ `AttentionCards.tsx` |
| AN-1.3 | Gantt ⇄ Kanban chuyển đổi | N | ✅ `GanttChart.tsx`, `KanbanBoard.tsx` |
| AN-1.4 | Lịch tháng + mini calendar | N | ✅ `CalendarMonth.tsx`, `MiniCalendar.tsx` |
| AN-1.5 | Lọc theo phòng ban | N | ✅ `DepartmentFilter.tsx` |
| AN-1.6 | Phân bố trạng thái công việc (biểu đồ) | P | ✅ `StatusDistribution.tsx` |
| AN-1.7 | Nháp cục bộ trước khi ghi Lark (draft mode, tôn trọng luật chỉ-đọc) | N | ✅ `draftTypes.ts`, `useDraftOverlay.ts`, `DraftBanner.tsx` |
| AN-1.8 | Nút xin/trả người (mấy ngày · việc gì) | N | ⬜ |
| AN-1.9 | Duyệt 1 chạm trên điện thoại | P | ⬜ |
| AN-1.10 | Nhật ký điều phối | N | ⬜ |
| AN-1.11 | Đồng bộ `PROJECT_STATUS` 2 chiều với IF | P | ⬜ (chặn ở B7 #1/#3) |

### AN-2 · MODULE ② HIỆN TRƯỜNG — THU THẬP *(Capture — 0%, toàn bộ tầm nhìn boundary spec)*

| Mã | Tính năng | Bậc | Code |
|---|---|---|---|
| AN-2.1 | Đo scan-to-BIM: LiDAR khối thô → laser Bluetooth điểm chính → laser ghi đè LiDAR | L | ⬜ |
| AN-2.2 | ⭐ **Đối chiếu THIẾU SỐ real-time** (cạnh xanh đã đo/xám chưa đo) — moat | L | ⬜ |
| AN-2.3 | Ảnh tại điểm đo + đóng dấu vị trí | N | ⬜ |
| AN-2.4 | Ghi âm → STT tiếng Việt, giữ file gốc | N | ⬜ |
| AN-2.5 | Panorama ghim mặt bằng (N điện thoại · P camera 360 · L multi-point) | N/P/L | ⬜ |
| AN-2.6 | Phân tích hiện trạng từ toạ độ — nắng/bóng/gió/khí hậu/view (SunCalc, 0 credit) | L | ⬜ |
| AN-2.7 | Bốn luật app hiện trường: offline-first · upload queue · nén · tự gắn ngữ cảnh | N | ⬜ |

### AN-3 · MODULE ③ TRỢ LÝ & TRA CỨU *(Ops Assistant)*

| Mã | Tính năng | Bậc | Code |
|---|---|---|---|
| AN-3.1 | Đổi tên "AI Vitat" → **Ops Assistant / Trợ Lý Điều Hành** (tránh trùng "Vitals" của IF) | — | ⬜ |
| AN-3.2 | Trả lời có nguồn, dùng chung T5 Knowledge Base với IF (hạng A-D) | N | ⬜ |
| AN-3.3 | Tra ATLAS vật liệu (mã/giá/còn hàng) | N | ⬜ (phụ thuộc ATLAS Larkbase — B4) |
| AN-3.4 | Từ điển KTS song ngữ | N | ⬜ |
| AN-3.5 | Case công trường / chi tiết điển hình (RAG hạng C) | P | ⬜ |
| AN-3.6 | Không biết thì nói thẳng + chỉ đường sang IF | N | ⬜ |

### AN-4 · MODULE ④ VỊ TRÍ & AN TOÀN

| Mã | Tính năng | Bậc | Code |
|---|---|---|---|
| AN-4.1 | Vị trí công trình: bản đồ tĩnh + chỉ đường (mở tương tác khi bấm) | N | ⬜ |
| AN-4.2 | Geofence check-in chấm công | P | ⬜ |
| AN-4.3 | Ảnh/ghi chú tự gắn toạ độ | N | ⬜ (phụ thuộc AN-2) |
| AN-4.4 | Safety check-in **chủ động** (bật khi vào, tắt khi ra) | N | ⬜ |
| AN-4.5 | Nút SOS 1 chạm | N | ⬜ |
| AN-4.6 | Tự xoá dữ liệu vị trí sau 7–30 ngày | N | ⬜ |
| AN-4.7 | Đồng ý rõ ràng theo Nghị định 13/2023/NĐ-CP | N | ⬜ |

### AN-5 · MODULE ⑤ HẠ TẦNG NỀN

| Mã | Tính năng | Bậc | Code |
|---|---|---|---|
| AN-5.1 | Offline-first mọi capture | N | ⬜ |
| AN-5.2 | Upload queue nền, đóng app vẫn đẩy | N | ⬜ |
| AN-5.3 | Nén trước khi gửi (bản nén đi trước, gốc chờ wifi) | N | ⬜ |
| AN-5.4 | ⭐ Tự gắn ngữ cảnh (dự án · vị trí · thời gian · người ghi) — bánh đà | L | ⬜ |
| AN-5.5 | Bản đồ cache offline | P | ⬜ |

---

## PHẦN D · GIAO DIỆN NGƯỜI DÙNG *(mobile-first — mỗi màn có 1 Hero)*

### D0. Khung cố định

Khác IF (desktop, sidebar) — ArchiNote dùng **bottom tab**, mọi hành động chính nằm trong tầm ngón
cái *(thumb zone)*, nút ≥44px (đồng bộ luật Sketch mode 2.1.4.c của IF), banner offline **luôn
hiện** khi mất mạng, không ẩn đi.

```
┌─────────────────────────────┐
│  [tên dự án nếu đang mở] ⚙  │ ← top bar mỏng
│                              │
│         NỘI DUNG MÀN         │
│                              │
├───┬────┬────┬────┬──────────┤
│ 🏠 │ 📁 │ 📷 │ 💬 │   👤    │ ← Trang chủ · Dự án · Hiện trường · Trợ lý · Tôi
└───┴────┴────┴────┴──────────┘
```

### D1. Màn TRANG CHỦ (Dashboard)

**Hero: card "Cờ đỏ" to nhất, đầu tiên, màu cảnh báo** — 1 giây biết dự án nào đang thiếu người,
không phải đọc bảng số liệu trước.

Bố cục: Cờ đỏ (hero) → hàng StatCard (tổng việc/trễ hạn/chưa gán) → tải nhân sự → mini calendar.
Đồng bộ IF: khi B2 xong, hiện luôn % tiến độ IF ngay dưới tên dự án.

### D2. Màn DỰ ÁN (list + detail)

**Hero: mỗi card dự án hiện "IF đang ở chặng nào"** bằng đúng 4 chấm màu như thanh chặng của IF
(Ý tưởng·CAD·Render·Present) — nhìn 1 giây biết bên xưởng tới đâu, không cần mở IF.

Detail: Gantt/Kanban toggle (đã có) + tab **Hiện trường** (ảnh/đo/ghi chú dự án này) + tab
**Trạng thái** (đọc `PROJECT_STATUS`).

### D3. Màn HIỆN TRƯỜNG — ĐO ĐẠC

**Hero: overlay AR "cạnh xanh/cạnh xám"** trên khối LiDAR — đúng khoảnh khắc còn đứng ở công trình
đã biết thiếu gì, **không phải về studio dựng bản vẽ mới phát hiện** (đây là moat AN-2.2).

Luồng: quét LiDAR (1-2′) → chĩa máy bắn laser → số vào đúng cạnh đang chĩa → chụp ảnh + ghi chú
giọng nói → màn hình tổng kết XANH (đã đo) / XÁM (chưa) → đo nốt trước khi rời.

### D4. Màn CHỤP & GHI CHÚ tại điểm đo

**Hero: giữ song song bản gốc âm thanh + chữ đã STT** — bấm vào dòng chữ để nghe lại đúng câu,
không mất ngữ điệu hay chi tiết bị chữ hoá bỏ sót.

### D5. Màn PANORAMA

**Hero: chấm ghim trên mặt bằng 2D** — bấm vào chấm mở đúng panorama chụp tại điểm đó, "Street
View nội bộ công trình". Ba tháng sau cần kiểm chiều cao dầm — mở ra xem, khỏi quay lại công trường.

### D6. Màn TRỢ LÝ (Ops Assistant chat)

**Hero: nhãn hạng nguồn (A/B/C/D) cạnh mỗi câu trả lời** — nhìn phát biết tin được không, cùng cơ
chế với Vitals của IF (`SPEC-KNOWLEDGE-BASE.md` §2). Khi hỏi ngoài phạm vi ArchiNote: trả lời kèm
nút **"Mở trong InteriorFlow →"** (deep-link `linkOpen`), không im lặng hay đoán bừa.

### D7. Màn AN TOÀN

**Hero: nút SOS đỏ lớn luôn nổi (floating)**, 1 chạm gửi vị trí tức thì — không chôn trong menu cài
đặt. Safety check-in: "Đã tới công trường" → hẹn giờ N tiếng → quá hạn không xác nhận → tự động báo
văn phòng. **Không** chạy nền liên tục — đúng luật A5.5.

### D8. Màn VỊ TRÍ CÔNG TRÌNH

**Hero: ảnh bản đồ tĩnh load tức thì** (không tính tiền theo lượt gọi API), bấm mới mở bản đồ tương
tác — nhanh hơn mọi app bản đồ khác trên sóng yếu công trường; cache được để xem lại khi mất mạng.

### D9. Ngôn ngữ hình ảnh & design tokens

- Kế thừa **triết lý** token của IF (`DESIGN-TOKENS.md`) nhưng **không dùng chung bộ token** —
  khác app, khác thiết bị (đúng luật A5, hai app tách biệt).
- Ưu tiên: tương phản cao ngoài trời nắng · nút to · ít chữ, nhiều biểu tượng — ngược hướng IF
  (desktop, nhiều thông tin trên màn lớn).
- Trạng thái offline có màu/icon riêng biệt, không lẫn với "đang tải".

---

## PHẦN E · LỘ TRÌNH & CÁC QUYẾT ĐỊNH CẦN HOÀ DUYỆT

### E1. Thứ tự làm đề xuất (đối chiếu `KE_HOACH_3_NGAY_SHIP_IF1.md` mục 6 — ArchiNote đứng **sau** ATLAS Larkbase)

| Thứ tự | Việc | Vì sao |
|---|---|---|
| 1 | AN-0.4 – AN-0.6 (Capacitor + offline-first) | Nền bắt buộc trước bất kỳ tính năng hiện trường nào |
| 2 | AN-1.8 – AN-1.11 (hoàn thiện Điều phối) | Đã có ~70% hạ tầng, rẻ nhất, giá trị ngay |
| 3 | AN-2.3 – AN-2.5 (ảnh/ghi âm/panorama) | Không cần thiết bị LiDAR/laser, dùng được ngay bằng điện thoại thường |
| 4 | AN-2.1 – AN-2.2 (đo LiDAR+laser, moat) | Cần thiết bị + SDK, tốn nhất, để sau |
| 5 | AN-3 / AN-4 | Chỉ làm sau khi ATLAS + T5 Knowledge Base của IF có nền thật — không xây trước nguồn |

### E2. CẦN HOÀ QUYẾT

1. **Huỷ ý "share JWT với IF"** trong AN-0 bản cũ — mâu thuẫn luật "2 app không gọi nhau".
   *Đề xuất: HUỶ, giữ auth riêng như code thật hiện tại.*
2. **ArchiNote có theo Luật trung tính như IF không** (không hardcode TTT), hay được phép giữ
   nguyên vì hiện là tool nội bộ đọc thẳng Lark base tên "Chi tiết công việc"/"Nhân sự" của TTT?
   *Đề xuất: KHÔNG cần trung tính — khác IF ở chỗ IF bán toàn cầu, ArchiNote hiện phục vụ nội bộ
   TTT — nhưng cần Hoà xác nhận vì ảnh hưởng `domain.ts` và UI.*
   > ⚖️ **Hoà quyết 01/08/2026 — LẬT đề xuất trên**: ArchiNote CŨNG theo Luật Trung Tính. Lý do:
   > phòng mai mốt bán ra thì khỏi phải dọn lại như vừa phải dọn IF hôm nay (gỡ
   > `knowledge/ttt-design-system`, ảnh, `files.zip` — commit `96b5f1e`). Giá chấp nhận: trừu tượng
   > hoá `domain.ts` ngay từ đầu. Xem `CHOT-DUYET-SPEC-DOT2-2026-08-01.md` §1c. Đề xuất cũ ở trên
   > GIỮ NGUYÊN (không xoá) để thấy Cowork từng đề xuất gì trước khi Hoà lật.
3. **Repo `ttt-tasks` có tiếp tục là repo ArchiNote chính thức**, mở rộng dần sang Capacitor + Capture,
   hay tách repo mới khi bắt đầu phần Capture? *Đề xuất: MỞ RỘNG — đỡ phí công viết lại phần Điều
   phối đang chạy thật.*
4. **Bảng Lark `PROJECT_STATUS`** (B2) là bảng mới cần tạo, khác `Chi tiết công việc` đang đọc —
   xác nhận phạm vi tạo bảng nằm trong việc ATLAS Larkbase (ưu tiên #2) hay tách việc riêng?
5. Tên agent tư vấn hệ thống **"KIẾN"** (đang treo ở `AGENTKIENIFARCHITECT.md` mục 5, đụng tên KIÊN)
   — không thuộc ArchiNote trực tiếp, nhưng KIẾN sẽ tư vấn cho cả 2 hệ nên nên chốt trước khi các
   file sau dẫn chiếu chính thức.

### E3. Phạm vi 3 ngày tới

Theo `KE_HOACH_3_NGAY_SHIP_IF1.md`, ArchiNote **không code** trong 3 ngày tới (ưu tiên #3, sau ship
IF1 và ATLAS Larkbase). File này là **SPEC** — bước 3 trong luật `KHÁM → QUYẾT → SPEC → CODE` —
chuẩn bị sẵn để khi tới lượt, vào thẳng KHÁM → CODE, không mất công nghĩ lại từ đầu.

---

*v1.0 · 2026-07-28 · Ben (Cowork) soạn theo yêu cầu Hoà — gộp `SPEC-ARCHINOTE-IF-BOUNDARY.md`
(26/07, định vị hiện trường) + phần AN-3 còn sống của `MASTERPLAN-IF-ARCHINOTE.md` (24/07) + đối
chiếu code thật repo `ttt-tasks` (28/07) → 1 cây tính năng mã `AN` + UI có Hero + hợp đồng đồng bộ
2 chiều IF1-2. Theo khuôn `IF-MASTER-BLUEPRINT.md`.*
