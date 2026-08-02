# SPEC — KHUNG XƯƠNG CHUNG 3 CHẶNG (App Shell) + VAI TRÒ VITALS

> Hoà 02/08: *"xem lại giao diện 3 chặng làm sao cho thống nhất, lẹ để còn chạy tiếp tính năng.
> Điều gì 3 chặng giống nhau, cái gì thừa thải? Vitals thường trực là ổn, nhưng tận dụng tốt hơn được không?"*
> Soi từ 3 ảnh thật (CAD · Rendering · Presenting, 02/08).

## 1 · HIỆN TRẠNG — lệch ở đâu
| Thành phần | CAD | Rendering | Presenting | Kết luận |
|---|---|---|---|---|
| **Rail trái** | ❌ không có | ✅ có | ❌ không có | **LỆCH NẶNG NHẤT** |
| Header trái | logo·dự án | logo·**Tệp▾**·dự án | logo·dự án | lệch |
| Header phải | —01·⌂·⋯·avatar | —02·**Việc▾**·⌂·⋯·avatar | (không) | lệch |
| Chuyển chặng | segmented **+ 2 nút "Đưa sang…"** | segmented | segmented | **TRÙNG chức năng** |
| Thanh công cụ | **3 hàng ngang** (~25 nút) | 1 toolbar nổi + bottom | **2 hàng ngang** | lệch nặng |
| Panel phải | Lớp (nổi, đè canvas) | không | Lớp + Nền (cố định) | lệch |
| Thanh đáy | Ortho·Số liệu·Lệnh·Kéo·Xong | zoom·pan·**Vẽ 3D** | filmstrip slide | lệch |
| **Vitals đáy giữa** | ✅ | ✅ | ✅ | **ĐÃ thống nhất — giữ** |

## 2 · THỪA — cắt ngay
1. **2 nút "Đưa sang Rendering / Đưa sang Presenting"** ở CAD — segmented ở header đã làm việc đó. Cắt.
2. **Avatar 2 nơi** (header "Demo Tour" + rail) — giữ **một**, ở rail (đã chốt `CHOT-AVATAR-MEMOJI` §2).
3. **Nút ⌂ và ⋯** — gom vào menu avatar (đã chốt). Cắt khỏi header.
4. **"— 01 / — 02"** — nhãn không ai hiểu (vi phạm `SPEC-NGON-NGU-CHI-DAN`). Bỏ hoặc viết rõ.
5. **"Tệp ▾" chỉ có ở Rendering · "Việc ▾" chỉ có ở Rendering** — hoặc mọi chặng đều có, hoặc bỏ.

## 3 · KHUNG XƯƠNG CHUNG — mọi chặng dùng CHUNG 5 phần
```
┌─ HEADER (cố định): logo · tên dự án · [CAD | Dựng ảnh | Trình bày] · (avatar duy nhất)
│┌────┬──────────────────────────────────────────┬──────────┐
││RAIL│            VÙNG LÀM VIỆC (canvas)         │ INSPECTOR│
││cố  │                                          │ (phải,   │
││định│      [thanh công cụ RIÊNG của chặng]     │  theo    │
││    │                                          │  chặng)  │
│└────┴──────────────────────────────────────────┴──────────┘
└─ THANH ĐÁY: [zoom · pan · fit] CHUNG + [phần riêng của chặng] + Vitals
```
**Chung tuyệt đối:** Header · Rail trái (+avatar) · Inspector phải (khung, khác nội dung) ·
Thanh đáy phần zoom/pan/fit · Vitals.
**Riêng theo chặng:** nội dung thanh công cụ · nội dung Inspector · phần giữa thanh đáy
(CAD: Ortho/Lệnh · Rendering: gạt Vẽ 3D · Presenting: filmstrip).

⇒ Thi công: tách **`<StageShell>`** dùng chung; mỗi chặng chỉ truyền vào 3 slot
(`toolbar`, `inspector`, `bottomExtra`). Đây là cách **LẸ nhất** để đồng bộ — sửa 1 chỗ, cả 3 chặng theo.

## 4 · VITALS — tận dụng tốt hơn (đề xuất)
Hiện: chip nhỏ đáy giữa, gần như chỉ để trang trí. Nó đang ở **vị trí đắt giá nhất màn hình**
(giữa, thường trực, mọi chặng) — nên biến thành **thanh trạng thái sống**, kiểu Dynamic Island:

| Tầng | Vitals hiện gì | Vì sao đáng |
|---|---|---|
| **Nghỉ** (mặc định) | glyph + tên dự án + chấm trạng thái lưu | nhỏ, không chiếm chỗ |
| **Đang chạy việc** | *"Đang dựng ảnh · còn 40 giây"* + vòng tiến trình | nay tiến trình nằm rải rác trong node, dễ lạc |
| **Có cảnh báo** | *"3 vùng thiếu mã vật liệu"* + nút Xem | nối `SEMANTIC-MODEL` — chặn lỗi trước khi xuất BOQ |
| **Bấm vào** | mở **LM**: hỏi AI + chat nhóm (`SPEC-APPLE-MOTION-MATERIAL` §4b, kiểu Siri iOS 27) | biến chỗ trang trí thành cửa vào trợ lý |
| **Có người khác online** | avatar nhỏ chồng bên phải glyph | presence ở đâu cũng thấy |
Nguyên tắc: **một dòng, tự co giãn theo trạng thái**, không bao giờ che canvas, bấm mới nở ra.

## 4b · FIGMA — NGUỒN THIẾT KẾ THẬT (dựng 02/08)
**File:** `InteriorFlow · Design System` — https://www.figma.com/design/y421AJBWVpqGVvJ3vTn2wO

| Đã có trong Figma | Chi tiết |
|---|---|
| **Primitives** (43 biến) | màu thô sáng/tối + `radius 10/14/20/28` + `fs 12/14/16/20/28` + blur 22/40 + spacing + số đo rail (44/8/60) — **lấy nguyên từ `app/globals.css`**, không tự chế |
| **Theme** (12 biến, 2 chế độ **Sáng/Tối**) | `bg · panel · card · field · hover · border · border-strong · text/t1-t3 · accent · accent-strong`; alias sang Primitives; **có scopes + code syntax `var(--bg)`…** → Dev Mode đọc ra đúng tên biến CSS của app |
| **Trang `Shell · 3 chặng`** | 3 khung 1440×900 (CAD · Dựng ảnh · Trình bày) **dùng CHUNG một shell**: header (logo·dự án·segmented·avatar duy nhất) · rail capsule 60 + avatar 44 · canvas · inspector 280 · thanh đáy nổi + Vitals |

⚠️ **Xung đột đã xử (Phase 0e):** spec cũ ghi bo góc 6/9/12/16 — **SAI**, code thật là 10/14/20/28.
Đã sửa `SPEC-DESIGN-SYSTEM-IF` theo code. Từ nay **code `globals.css` là nguồn token gốc**, Figma phản chiếu nó.

## 5 · THỨ TỰ LÀM (lẹ nhất)
1. `<StageShell>` + đưa **Rail vào cả CAD/Presenting** (đang thiếu) — 1 việc, sửa 60% lệch.
2. Cắt 5 thứ thừa ở §2.
3. Chuẩn hoá Inspector phải thành 1 khung dùng chung.
4. Vitals tầng "đang chạy" + "cảnh báo" (§4) — làm sau khi shell xong.

---
*Cowork soi + soạn 02/08/2026 từ ảnh thật 3 chặng. Nối `SPEC-MODE-PER-STAGE` · `SPEC-DESIGN-SYSTEM-IF` · `CHOT-AVATAR-MEMOJI`.*
