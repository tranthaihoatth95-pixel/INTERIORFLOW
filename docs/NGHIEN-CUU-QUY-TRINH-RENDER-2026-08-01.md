# NGHIÊN CỨU — Quy trình render V-Ray · D5 · AI → đề xuất cho chặng 2

> Hoà yêu cầu 01/08. Khám hiện trạng IF trước (30 node, `CATALOG-STAGE2-RENDERING`), tra quy trình
> đối thủ sau. Mọi đề xuất đều ráp vào **mô hình tool window** vừa chốt — không thêm mode mới.
>
> ✅ **HOÀ DUYỆT HƯỚNG CẢ 6 — cùng ngày 01/08** (① nháp→chốt · ④ đổi giờ sau render · ③ không khí
> từ ảnh khách · ⑤+⑥ bookmark góc máy + hàng đợi, kèm ② render vùng đi theo khoá giữ).
> Thứ tự thi công theo §4. ⑤ chờ V2 đường cam. 💭 giá Schnell phải đo trước khi hứa "nháp 0cr".

## 1 · Ba trường phái — mỗi bên giỏi một thứ

| | V-Ray | D5 | AI thuần (Midjourney/Krea…) |
|---|---|---|---|
| Vòng lặp | **test render vùng** → chỉnh → final | realtime, thấy ngay | tức thì nhưng **xúc xắc** |
| Dễ nhất ở | **LightMix**: đổi đèn SAU render, không render lại | **Atmosphere Match**: kéo 1 ảnh mẫu → trời/giờ/tông màu tự áp; asset kéo-thả; 1-click enhance | tốc độ, không cần model 3D |
| Đau nhất ở | rừng thông số, mỗi final hàng phút–giờ | vẫn cần model 3D đủ tốt | không giữ hình học, không lặp lại được |

IF đứng ở thế **không ai có**: có bản vẽ vector làm xương (ControlNet depth/lineart) — AI mà giữ
hình học. Cái thiếu là **quy trình lặp** cho người dùng: hiện mỗi lần bấm là một lần sinh full,
26s + credit, ưng hay không cũng trả đủ tiền.

## 2 · Sáu đề xuất — xếp theo giá/đổi

### ① VÒNG NHÁP → CHỐT *(học test-render của V-Ray — tiết kiệm credit NHẤT)*
Mỗi tool 2 nút thay vì 1: **[Nháp]** (FLUX Schnell/steps thấp, rẻ hoặc 0cr, ~5s) và **[Chốt nét]**
(Pro + upscale, đủ credit). Nháp để dò ý — chốt mới trả tiền. 🧮 Nền có sẵn: catalog đã chia mức
2/3/4 theo model; chỉ là UI chưa cho người dùng chọn vòng.

### ② RENDER VÙNG *(region render — ghép với khoá giữ đã đề xuất)*
Khoanh vùng → chỉ sinh lại vùng đó (inpaint), phần ngoài giữ nguyên. Rẻ hơn sinh full, nhanh hơn,
và chính là "khoá giữ vùng" nhìn từ phía ngược lại. 🧮 Node `ai.inpaint`/FLUX Fill đã có.

### ③ THẺ "KHÔNG KHÍ" TỪ ẢNH MẪU *(học D5 Atmosphere Match)*
Kéo 1 ảnh tham chiếu → giờ trong ngày + trời + tông màu áp vào ảnh render. 🧮 IC-Light v2 đã có
(`ai.relight`, 22s); spec §3 đã chốt *"ánh sáng = thẻ, không slider"*. Chỉ thêm: nguồn thẻ có thể
là ẢNH MẪU của khách, không chỉ preset — nối thẳng vào Thẻ Gu.

### ④ ĐỔI GIỜ TRONG NGÀY SAU RENDER *(LightMix kiểu IF)*
IC-Light chạy TRÊN ảnh đã render — nghĩa là đổi sáng KHÔNG cần sinh lại. Tách thành vòng riêng
sau render: sáng → chiều → đêm trên cùng 1 tấm, mỗi lần chỉ tốn relight (rẻ hơn sinh mới).
Đúng cú "without re-rendering" làm LightMix nổi tiếng — IF có sẵn linh kiện mà chưa đóng gói.

### ⑤ GÓC MÁY TỪ CAD — bookmark render
Camera đặt trên mặt bằng (V2 đường cam đang làm + `CAMERA_PRESETS` lib/three) → chặng 2 hiện
**danh sách góc máy** như bookmark; mỗi góc 1 nút render; sau này *"render cả 5 góc"* = hàng đợi.
Khép vòng: vẽ góc ở chặng 1 → ảnh ở chặng 2 → video ở chặng 3. Không app AI nào có bước này
vì không app nào có bản vẽ.

### ⑥ HÀNG ĐỢI RENDER *(batch queue)*
🧮 Đo thật trong catalog: 1 tấm chốt = ~41s (26s sinh + 15s upscale). Render 5 góc × 3 phương án
= ngồi nhìn 10 phút. Hàng đợi: chọn nhiều → chạy nền → báo xong. BullMQ đã trong stack.

## 3 · Ráp vào mô hình tool window

Không đề xuất nào cần mode mới: ①② là nút trong window · ③④ là thẻ tab "Không khí" · ⑤ là panel
bookmark cạnh canvas · ⑥ là khay tiến trình. Bậc thang điều khiển 2B (núm nghề → nâng cao → mask
tay → subgraph) áp nguyên cho tất cả.

## 4 · Thứ tự đề nghị

**① nháp→chốt** (tiết kiệm credit, sửa cảm giác "mỗi click một ván bạc") → **④ đổi giờ sau render**
(linh kiện có sẵn, đóng gói là xong) → **③ không khí từ ảnh** → **② render vùng** → **⑤ bookmark
góc máy** (chờ V2 xong) → **⑥ hàng đợi**.

💭 Chưa kiểm: giá thật FLUX Schnell cho vòng nháp (catalog ghi mức 2 nhưng chưa ghi số tiền/tấm) —
đo trước khi hứa "nháp 0cr".

---

*Cowork 01/08/2026. Nguồn: D5 AI docs (Atmosphere Match, AI enhance/texture) · Chaos V-Ray
(LightMix — relight không re-render) · hiện trạng: CATALOG-STAGE2-RENDERING (30 node, đo 41s/tấm).*
