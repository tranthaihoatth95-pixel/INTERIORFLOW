# SPEC — BỘ CÔNG CỤ EDITOR *(deck · graphic · photo · video)*

> **[CẦN HOÀ DUYỆT]** · Đây là **bậc N thiếu nặng nhất** của IF. Ben từng cắt sai nhóm này
> (xếp nhầm sang "ngành khác") — thực tế toàn bộ là **deliverable của nghề nội thất**.
> Đọc cùng `SPEC-PRESENT-FLOW.md`, `SPEC-UI-SHELL.md`.

---

## 1. ⭐ LUẬT GỐC — vòng lặp chết & tầng năng lực

**Vòng lặp chết** (Hoà chỉ ra 26/07):
```
Công cụ tay thiếu → người dùng quay sang ô AI → AI cũng không có gì để gọi
→ bế tắc CẢ HAI LỐI → bỏ app
```

> **AI không tạo ra năng lực mới. AI chỉ là cách gọi năng lực có sẵn nhanh hơn.**

### Một năng lực, hai lối vào

```
              TẦNG NĂNG LỰC (mỗi việc = 1 hàm có tên, có tham số)
       applyGradient() · maskImage() · alignElements() · setTracking()
                    ▲                                ▲
            ┌───────┴────────┐              ┌────────┴────────┐
            │  LỐI 1 · Tay   │              │  LỐI 2 · AI     │
            │  nút, panel    │              │  gõ mô tả       │
            └────────────────┘              └─────────────────┘
```

**Thứ tự BẮT BUỘC, không được đảo**:

| Bước | Việc |
|---|---|
| 1 | Xây **năng lực** (engine + hàm có tên) |
| 2 | UI phơi ra **nút** |
| 3 | AI **gọi cùng hàm đó** *(function calling)* — rẻ bất ngờ nếu 1–2 làm đúng |

⚠️ Làm ngược (AI trước, công cụ sau) **không bao giờ chạy được** — ảo tưởng phổ biến nhất khi làm app AI.
⚠️ **Không có nút thì cũng không có hàm cho AI gọi.** Ô AI không có năng lực bên dưới = **hứa hão**,
tệ hơn không có.

### Ví dụ — AI không làm gì mới, chỉ dịch tiếng người thành lời gọi hàm

| Muốn | Lối tay | Lối AI |
|---|---|---|
| Chữ đọc được trên ảnh | Chọn ảnh → Overlay → chỉnh đậm | *"làm tối ảnh cho chữ nổi"* → `applyOverlay(0.4,'dark')` |
| Căn 5 ảnh đều | Chọn → Phân bố ngang | *"căn đều 5 ảnh"* → `distribute('horizontal')` |
| Pattern lam gỗ 60mm | Panel pattern → nhập 60 | *"pattern lam dọc 60mm"* → `makePattern('slat',60)` |

### Luật khi AI không làm được

Không im lặng, không vòng vo — **nói thẳng + chỉ đường**:

> *"Mình chưa làm được hiệu ứng đó. Hiện có thể: chỉnh độ trong suốt · thêm overlay · đổi blend
> mode. Bạn muốn thử cái nào?"*

## 2. Nguyên tắc cắt: **một engine, bốn bộ công cụ** — KHÔNG phải bốn editor

Deck · graphic · photo bản chất giống nhau (layer · transform · mask · blend). Làm 3 editor riêng
là tự nhân ba việc. Chỉ **video** mới thật sự khác.

```
MỘT CANVAS ENGINE (layer · transform · mask · blend)
├── Bộ công cụ DECK     → text, khối, lưới, master
├── Bộ công cụ GRAPHIC  → pattern, path, gradient nâng cao
├── Bộ công cụ PHOTO    → crop, chỉnh màu, xoá nền, inpaint
└── VIDEO (khác)        → ghép slide + audio, KHÔNG phải timeline đầy đủ
```

## 3. Kiểm kê bậc N — theo tần suất dùng thật trong deck kiến trúc

### Nhóm 1 · Dùng mỗi ngày — thiếu là không dựng nổi trang

| Món | Có? |
|---|---|
| Text: tracking · leading · chữ tràn viền · uppercase · đè lên ảnh | 🟡 |
| **Mask ảnh** theo hình + bo góc + crop trong khung | ⬜ |
| **Gradient + overlay + độ trong suốt** | ⬜ |
| Khối màu bán trong suốt (zoning diagram) | ⬜ |
| **Căn chỉnh · phân bố đều · khoá tỉ lệ** *(align/distribute)* | ⬜ |
| Layer: thứ tự · nhóm · khoá · ẩn | 🟡 |
| Đường kẻ · mũi tên · khung | 🟡 |
| Nhân bản có căn *(smart duplicate)* | ⬜ |

### Nhóm 2 · Dùng thường

| Món | Có? |
|---|---|
| **Pattern theo kích thước thật** → xuất tile PNG/SVG cho 3ds Max, CNC, decal | ⬜ ⭐ **chỉ IF làm được** |
| Blend mode (multiply · overlay · screen) | ⬜ |
| Đổ bóng · làm mờ | ⬜ |
| Dải palette tự sinh từ ảnh | ⬜ |
| Bảng số liệu đơn giản | ⬜ |

### Nhóm 3 · Photo

Crop · xoay · lật · thẳng chân trời 🟡 · sáng/tương phản/nhiệt độ/bão hoà ⬜ ·
xoá nền + inpaint 🟡 *(có ở Render, chưa nối)*

### Nhóm 4 · Video — mức **CapCut-like**, KHÔNG phải After Effects

| Mức | Gồm gì | Kết luận |
|---|---|---|
| 1 · Tự động | Deck → video, không sửa được | Chưa đủ |
| **2 · CapCut-like** ⭐ | Timeline 3–4 track · cắt/ghép · chuyển cảnh · nhạc + lời · text · tốc độ · Ken Burns | ✅ **Mức cần** — đủ 100% video kiến trúc thực tế |
| 3 · After Effects | Keyframe mọi thuộc tính · mask động · particle · camera 3D | ❌ nghề khác |

**Track bậc N**

| Track | Cần gì |
|---|---|
| **Hình** | Ảnh render (theo `img_` id) · clip · **Ken Burns/parallax** · chuyển cảnh (mờ dần, trượt) · tốc độ |
| **Chữ** | Tiêu đề · phụ đề · callout tên phòng/vật liệu — **theo Brand Kit** |
| **Tiếng** | Nhạc nền · lời đọc (TTS) · âm lượng · fade |
| **Chung** | Cắt/trim · sắp thứ tự · xem trước tức thì · xuất MP4 |

⛔ **Không làm**: keyframe từng thuộc tính · particle · chroma key · nhiều lớp mask động.

### Kiến trúc rẻ nhất: **timeline là DỮ LIỆU, không phải engine**

```
Timeline (JSON) → Remotion Player → xem trước real-time trong app
       ↓ cùng dữ liệu
Remotion render → xuất MP4
```

Chỉ phải làm **giao diện timeline** sinh ra JSON. Remotion lo phần vẽ + xuất, và **dùng lại đúng
bộ vẽ React của deck** — không viết engine video riêng.

### ⭐ Lợi thế IF mà CapCut/Canva không có: render bằng GPU MÁY BẠN

| | CapCut/Canva web | **IF (Electron)** |
|---|---|---|
| Render ở đâu | Server của họ | **Máy bạn** |
| Chi phí | Trả tiền / giới hạn | **0 credit** |
| Độ dài · độ phân giải | Bị chặn | Tuỳ máy |
| Riêng tư dự án khách | Lên cloud bên thứ ba | **Không rời máy** |

Dòng cuối quan trọng với CĐT lớn — nhiều hợp đồng cấm đưa hình ảnh lên dịch vụ bên thứ ba.

⚠️ **Khối lượng thật**: video editor là 1 trong 3 thứ tốn công nhất toàn app (cùng CAD engine và
render pipeline). Dù dùng Remotion, bản N tử tế vẫn cỡ **6–10 tuần**.

**Thứ tự bắt buộc**: ① nền CAD cảm giác tay → ② bộ công cụ deck (nhóm 1) → ③ video timeline.
Làm video trước khi deck có mask/gradient thì chỉ ghép được ảnh thô — không hơn CapCut mà tốn gấp đôi.

## 4. ⚠️ ĐỪNG TỰ VIẾT ENGINE

Viết canvas editor từ đầu = **6–12 tháng**. Dùng thư viện mã nguồn mở:

| Việc | Thư viện | Ghi chú |
|---|---|---|
| Canvas 2D editor | **Fabric.js** / **Konva.js** | Sẵn: layer · transform · mask · group · undo |
| Vẽ tự do | tldraw | Nếu cần vẽ tay |
| Chỉnh ảnh | Canvas filter + WebGL | Đủ cho sáng/tương phản/màu |
| **Video** | **Remotion** ⭐ | **Video = React component** → dùng lại chính bộ vẽ deck |
| Cắt ghép video thô | FFmpeg.wasm | Chạy trong trình duyệt |

**Remotion là mảnh ghép đẹp nhất**: deck đã là React → xuất video dùng lại đúng bộ vẽ đó, không
dựng timeline riêng. Đúng nguyên tắc "một bộ vẽ, nhiều chế độ".

## 5. Thứ tự

| Pha | Làm gì | Vì sao |
|---|---|---|
| **1** | Nhóm 1 đầy đủ (8 món) trên engine có sẵn + **phơi thành hàm có tên** | Không có = không dựng nổi trang chuẩn |
| **2** | Pattern real-world scale + blend/shadow | Moat + hoàn thiện thẩm mỹ |
| **3** | Photo cơ bản, nối inpaint sẵn có | Gộp "hòn đảo" photo-editor về |
| **4** | Video qua Remotion | Sau khi deck đã ổn |
| **5** | Nối AI vào tầng năng lực *(function calling)* | Rẻ, vì hàm đã có sẵn từ pha 1–4 |

---

*v1.1 · 2026-07-26 · Ben soạn theo ý Hoà. (v1.1: nâng nhóm 4 Video lên mức CapCut-like + kiến trúc timeline-as-data)*
