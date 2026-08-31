# IF · KHUNG BA TẦNG + MỘT LỚP PHỦ — quyết định khung điều hướng & cấu trúc app

`Plane: IF`

**Trạng thái:** HOÀ CHỐT 31/08/2026 qua phiên điều phối `cl:00`; đã qua phản biện độc lập
(`REVISE` → 5 điều kiện đã nhập).

**Nguồn:** `docs/IF-KIEN-TRUC-OS.md` · khảo sát UX toàn cầu 31/08 · phán quyết mắt chủ **2/10**
trên `artifacts/man-30-08`.

---

## TẦNG 0 · BỐN KHÔNG GIAN APP

Ánh xạ **1-1** bốn hệ hiến pháp (`docs/IF-KIEN-TRUC-OS.md` §2):

| không gian | ghi chú |
|---|---|
| **Studio** (Home) | |
| **Dự án** | |
| **Kho tri thức** | LOOK INSIDE |
| **[Nghề]** | LOOK OUTSIDE — **chừa ghế**, chưa dựng |

⛔ **Cài đặt KHÔNG lên rail** — nằm ở menu avatar (**GIỮ** chốt 23/08).

---

## TẦNG 1 · THẾ GIỚI DỰ ÁN

**Dữ liệu** — Phase model giữ **ĐỦ ~12 bước ngành** theo hiến pháp §4b:

`Input → Research → Layout → Moodboard → Concept → 3D → Design Review → Revision → Tender →
Shopdrawing → Site → Handover`

> Nguyên văn Hoà 30/08: *"không cái nào thiếu được"*.

**UI** hiện **6 BAND** gộp: `Brief · Nghiên cứu/Moodboard · Concept/Layout · Thiết kế 2D-3D ·
Hồ sơ/Present · Bàn giao`.

### GIAI ĐOẠN LÀ TRẠNG THÁI, KHÔNG PHẢI MÀN
Dải **6 chấm** trong header dự án, **0 lần chuyển màn**.

Tiến **CHỈ** bằng sự kiện tất định hoặc đề-xuất-chờ-duyệt; đặt tay được; mọi thay đổi ghi
`log decision`.

⛔ **CẤM heuristic tự ghi** — *"AI không âm thầm biến đổi sự thật canonical"*.

Control point **4 mức**, và knowledge gắn vào **BƯỚC**, không vào band.
**Review** và **Bàn giao** có **bề mặt ToolWindow** trong ngữ cảnh dự án.

### Bối cảnh dự án
- **Tệp dự án** — provenance · phiên bản · quan hệ quyết định; `/files` gấp về đây, **không
  Finder-clone**
- **Sổ tay**
- **Vật liệu dự án**
- **Design DNA**
- **Team/Review**

---

## TẦNG 2 · CÔNG CỤ

`2D` · `3D/Render` · `Present` — **cửa sổ thao tác `.idf`**, mở từ ngữ cảnh.

⛔ **CẤM dán tên giai đoạn lên công cụ.**

**ĐƯỜNG TẮT VIỆC LẺ:** mở thẳng tệp không cần nghi lễ dự án, gắn về sau được.

---

## LỚP PHỦ AI

Không có địa chỉ nav. Control point `Assist / Collaborate / Delegate / Autopilot` theo **bước**,
kèm **Why-this**. Nút **"Tạo bằng AI"** rời khỏi nhóm điều hướng.

---

## PHẠM VI V1

Nghiêng **XƯỞNG** (Management §4e). **NGHỀ** (phát triển *người thiết kế*, **KHÔNG** phải
developer) chừa cửa.

Trục **VAI & QUYỀN** đứng riêng: v1 **không dựng UI**, và **không được chặn đường sau**.

---

## HAI NỢ NỀN ĐI TRƯỚC

**① Phase model MỚI cấp dự án** — Prisma qua `db-target-guard`; DB `PARTIAL`/`F-18` (tính giá
thật). `lib/phases.ts` **KHÔNG THAY** — đó là trục **CÔNG CỤ** (`IF-CANONICAL` §8), tái định danh
thành sổ công cụ.

**② Kho tri thức trên catalog `Q14`** — mỗi kệ schema riêng; **Chuẩn** tách mặt tra cứu khỏi
điểm thi hành.

---

## PHỤ LỤC A · CA THỰC TẾ — đề bài nghiệm thu Phase model

- bản đồ **không hàng rào**
- task lẻ
- vào giữa chừng: đặt tay **+ lý do**
- **MỐC NỘP = snapshot bất biến**; sửa sau = **VÒNG SỬA**, tự so lệch
- ý kiến chủ đầu tư = **dữ liệu cấu trúc** gắn vùng → task
- quay phương án cũ **1 bấm** — cây quyết định giữ hướng bị bác **kèm lý do**
- **vòng sửa là knowledge** — pattern client → cảnh báo sớm
- **THẺ Ý ĐỊNH** ở Brief + **3 hướng A/B/C** khách chọn sớm + mỗi gật = **biên nhận mềm**

---

## PHỤ LỤC B · KHO TÀI SẢN & DNA

**Luật TÀI SẢN TRUNG TÍNH — STYLE LÀ LỚP DNA** (Hoà 31/08; cùng họ luật trung tính 24/07, hạ
xuống tầng asset).

**Asset đa thể:** 2D CAD + 3D + vật liệu + thông tin cấu kiện (BOQ — thay là giá update) + thể
quang học (IES).

**Kệ:** `Vật liệu PBR` · `Cấu kiện .idfc` · `Khối 2D` · `Model 3D` · `Ánh sáng` · `Tham khảo` ·
`Chuẩn` · `Bài học` — catalog `Q14`.

**DNA xếp lớp:**
- **KIẾN TRÚC SƯ** — `GU-PROFILE` là hạt giống; máy đọc gu ở lane 05
- **DỰ ÁN** — `lib/dna` sống
- **THAM CHIẾU**

Nhuộm **lúc dùng**; asset **bất biến**. Cổng gắn nguồn: `gallery-source-guard`.

**LOOK INSIDE = Company Design Intelligence §4c, `DATA > MODEL`.**

**Máy sẵn — MỞ CỬA, không viết mới:** `idfc-import` (3.339 dòng, **0 cửa**) · `ffe/item` ·
`materials/impact` · `boq/compute`.

---

## PHỤ LỤC C · KHO ÁNH SÁNG

> *"đúng trước, đẹp sau, AI không đụng tay"* (luật 8)

**Kệ:**
- **Đèn** — IES + quang thông + CCT + CRI + giá → BOQ
- **Công thức công năng** — `lux.ts` đang ngủ + bộ luật chiếu sáng `standards` — **đánh thức**
- **Trời** — **MÓNG ĐÃ CÓ**: NOAA ±0,1° `lib/three/lighting.ts` (test đối chiếu thiên văn) + hồ sơ
  địa điểm `lib/site` có nhãn nguồn gốc + `NhapViTri` trên Tổng quan + trục CAD `x=Đông y=Bắc z=lên`

**Pipeline:** AI ra **Ý ĐỊNH cấu trúc** → **CODE** đặt đèn → **VALIDATOR lux** → render tất định →
xuất V-Ray/D5 (export sẵn).

**Render BỐN NHỊP:**
| nhịp | |
|---|---|
| **ĐI** | raster vật lý ≥30fps |
| **DỪNG** | path-tracing hội tụ — `UNKNOWN` benchmark GPU tầm trung |
| **XUẤT** | V-Ray / D5 |
| **SOI** | lux giả-màu realtime |

**Gió:** `UNKNOWN` — cần dữ liệu khí tượng.

**Cầu ArchiNote:** ảnh GPS → hồ sơ địa điểm (mố sẵn `lib/site` + `ifpack`).
