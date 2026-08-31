# IF · GIẤY MỰC — quyết định ngôn ngữ canvas 2D

`Plane: IF`

> **TRẠNG THÁI: HOÀ CHỐT + MẮT CHỦ CHẤM "ỔN"** — 17:20 · 31/08/2026, trên mock tương tác
> https://claude.ai/code/artifact/69937cd3-d354-40c7-becb-037c25a31927 (label `giay-muc-v1`).

**Nguồn.** Nghiên cứu LOOK OUTSIDE 9 công cụ ngày 31/08 — Rayon · Archicad · Revit · Vectorworks ·
Snaptrude · Arcol · Concepts · Shapr3D · AutoCAD, cộng Solibri. **Tiền lệ chính: Rayon** — style
tách khỏi layer · wireframe là *chế độ khảo sát* chứ không phải mặc định · stroke-scale gắn tỉ lệ.
Báo cáo đầy đủ nằm trong transcript phiên điều phối 31/08.

**Vì sao có tệp này.** Mắt chủ phán **hai lượt "chưa ổn"** trên các bản vá lẻ. Vá tiếp lượt ba là
vá vào chỗ không có ngôn ngữ để vá. ⇒ Quyết định: **chốt ngôn ngữ trước, thi công sau.**

---

## LUẬT

### 1 · NỀN GIẤY
Canvas 2D nền **trắng giấy ấm**, một màu **phẳng** (hướng `#FAF9F6`). Không gradient. Không grid ồn.

### 2 · MỰC 3 BẬC — ISO 128-24 nội bộ (`CHUAN-DAU-RA-NGHE` §1)

```
cắt    0.50
thấy   0.25
mảnh   0.13
```

Bề dày **mm thật × stroke-scale** gắn tỉ lệ bản vẽ (kiểu Rayon). Zoom đổi ⇒ **cả thang co giãn
cùng nhau, giữ thứ bậc**. Chạm sàn hiển thị thì **NHẠT ĐI bằng pha-màu-về-nền**
(máy `lib/cad/plan-depth.ts` — **CẤM alpha**), **không mảnh thêm**.

### 3 · POCHÉ tường cắt
Xám đậm **75–85% mực** (không đen đặc), có **viền nét cắt**. Hatch vật liệu **chỉ hiện từ ngưỡng
zoom**.

### 4 · DXF NHẬP — HAI CHẾ ĐỘ

| chế độ | làm gì |
|---|---|
| **TRÌNH BÀY** *(mặc định)* | map toàn bộ về thang mực **đơn sắc**; màu ACI **biến mất** |
| **KHẢO SÁT** *(toggle — van an toàn bắt buộc)* | **wireframe 1px màu layer gốc**, tắt fill |

Bảng map `layer → bậc mực` là **heuristic**, phải **sửa được per-layer**.

### 5 · PHẦN MÁY SUY RA
Đúng **MỘT** màu không phải mực trên toàn canvas = **accent**.

- nét **LIỀN** accent = **đã xác nhận**
- nét **ĐỨT** accent = **đề xuất chờ duyệt**
- **fill** accent **pha 8–12% về nền** (pha màu, **không alpha**)
- selection/hover = **cùng accent, đậm hơn**

Logic Solibri: **một màu nóng, phần còn lại câm.**

### 6 · VẼ ĐÈ / HALFTONE *(mượn Revit)*
Khi thao tác đè lên bản nhập: bản nhập **hạ về halftone xám**, mực mới + accent **đứng trước**;
xong thì **trả lại**.

### 7 · ACCENT THEO BỘ — Hoà chốt 17:24 · 31/08
Accent **KHÔNG phải hằng số**. Nó **dẫn xuất từ BỘ theme người dùng chọn**:

- **5 hình nền mặc định = 5 bộ màu** (hệ đã chốt 30/08; máy `lib/wallpaper/mau-bo.ts`, 51 test
  sẵn, **thiếu dây nối `globals.css`**).
- Người dùng chọn **ảnh riêng** ⇒ máy **trích accent từ ảnh**, đi qua **CỔNG TƯƠNG PHẢN** (đạt AA
  trên **nền giấy** *và* **nền app**). Không đạt ⇒ **fail-closed** về accent an toàn của **bộ gần
  nhất**.

> *"Mòng két hay mận"* **không còn là câu hỏi** — chúng là accent của **từng bộ**.

---

## THI CÔNG — con trỏ, không phải diff

Phiếu **P1 + P3 hợp nhất: "thi công Giấy Mực"**. **Mock `giay-muc-v1` là spec.**

Chạm: `lib/cad/render.ts` (map mực · stroke-scale · toggle) · **`plan-depth` nối canvas** ·
**`mau-bo.ts` nối `globals.css`** · **máy trích màu ảnh** · **cổng tương phản**.

**Nợ kèm:** chống-ăn-lại kênh polyline — `lib/cad/tuong-hinh-hoc.ts:208-212`, chung thẩm
`7cf286db` đã đặt tên.
