# Port FUR ENGINE → IF — **v2, sau khi đọc code thật**

> **THAY HOÀN TOÀN bản v1 cùng ngày.** v1 viết dựa trên ảnh màn hình và **có một kết luận SAI**.
> Bản này viết sau khi Claude web trích nguyên văn `App.tsx` + `designStandards.ts` từ Flow.

---

## 0 · ⚠️ Đính chính lỗi của v1

**v1 viết:** *"FUR ENGINE cắt món ra trước khi đo — lỗi gốc của IF là thiếu bước CROP."*

**SAI.** Code thật:

```
detectItemsForRoom()  →  gửi ẢNH PHÒNG NGUYÊN VẸN  →  đòi luôn w/d/h/sh cho từng món
cropImage()           →  chạy SAU, chỉ để làm ảnh tham chiếu cho HERO + DRAWING
```

Flow **cũng đo trên ảnh cả phòng**, y như IF. Tôi suy từ thứ tự hiển thị trên UI
(CROP → HERO → DRAWING) và tưởng đó là thứ tự xử lý.

**Điều thật sự làm Flow không nhầm món:** một lượt gọi duy nhất vừa **nhận diện + đánh khung +
gán kích thước cho TỪNG món**. Con số bị **buộc chặt vào một món có tên và có bbox**.

IF thì tách đôi — dropdown "Loại đồ" ở một nơi, bộ ước lượng chạy ở nơi khác, hai bên không nói
chuyện ⇒ chọn `Giường King`, trả về `Sofa 2 chỗ`.

> **Không phải CẮT. Là BUỘC.**

---

## 1 · Đừng port cách đo của Flow — nó tệ hơn IF

Toàn bộ "thuật toán đo" của FUR ENGINE v3.1, nguyên văn, **một câu**:

```
Identify main furniture pieces. Return JSON: {"items": [{"ten":..., "bbox":{...},
"w":mm, "d":mm, "h":mm, "sh":mm, ...}]}
```

Không neo · không lưới · không ISO · không độ tin · không dặn gì khi model không chắc.
Fallback `d.w || 0`. JSON hỏng → phòng thành `'ready'` với **0 món, không báo lỗi ra UI**.

Bản brief `[5-STAGE WORKFLOW]` (SAM · super-resolution · nắn phối cảnh · smart mirroring ·
vanishing point) **chưa bao giờ được cài** — không có dòng nào trong code chạy.

⇒ IF đã hơn ở khoản này (có dải ±, có phân bậc, có ghi lý do). **Giữ cascade của IF.**

---

## 2 · ⭐ Thứ ĐÁNG port: `designStandards.ts`

Bản gốc giữ ở `docs/CHUAN-THIET-KE-v7.6-NGUON.md`. **Trong Flow nó là dead code, chưa từng chạy.**

Một file 4,6 KB nuôi **ba** phần khác nhau của IF:

### ⓐ MỤC 1 + 2 + 9 → **Tầng 1 (không AI)** — thứ Hoà muốn "học giỏi nhất"

Hoà từng hỏi: *"làm sao tầng 1 không AI là tầng được học giỏi nhất sau nhiều lần thử và ghi nhớ?"*
**Câu trả lời đã nằm sẵn trong file này.** Tầng 1 = bảng chuẩn thật + học từ số Hoà sửa (`7.1.22`).

**MỤC 9 chính là bộ luật đo mà tôi đi tìm cả ngày** — và nó tốt hơn đề xuất của tôi:

| Luật MỤC 9 | Vì sao mạnh hơn cái tôi đề xuất |
|---|---|
| **5. Vật mốc để scale: Cửa 800×2100 · Công tắc 1200 · Ổ cắm 300 · Gạch 600×600 · Người 1650** | Tôi đề xuất neo bằng **chiều cao máy ảnh** — thứ ảnh render không có. Đây là **vật NHÌN THẤY ĐƯỢC**, và có mặt trong gần như mọi ảnh nội thất. Công tắc ở 1200mm là neo tuyệt vời: luôn có, luôn cùng độ cao |
| **1. KHÔNG BAO GIỜ xuất 0 / NaN / null** | Đúng nguyên tắc *"bấm Render không bao giờ trả về tay không"* |
| **3. Clamp vào dải hợp lệ** | Chặn thẳng lỗi "Giường King ra 1274mm" |
| **4. Suy chéo:** cao mặt 420 → sâu ngồi 450 | Lấp mặt khuất bằng quan hệ, không bằng đoán mò |
| **6. Làm tròn 5mm** | Bỏ hẳn kiểu số giả chính xác `1274` |
| **8. Lệch > 15% chuẩn → cờ CẦN XÁC NHẬN** | **Đây là nhãn trung thực mà IF đang thiếu** |

> 🔻 Trớ trêu: v3.1 fallback `|| 0` — **vi phạm đúng luật số 1 của chính nó.**

### ⓑ MỤC 3 → **va chạm mềm (soft clash)** cho IF2

`Lối đi chính 900-1200` · `Hai bên giường 600-750` · `Trước tủ khi mở cánh 800-900` ·
`Ghế ăn lùi ra 750-900` · `Mở ngăn kéo có người đứng 1000`.

Đây **chính là bộ luật soft clash** — thứ tôi ghi trong tài liệu tầm nhìn là "ngành đã có tên".
Hoà đã có sẵn bảng số cho nội thất Việt. Không phải đi mua, không phải đi tra.

### ⓒ MỤC 8 → **nét vẽ + bố cục bản vẽ** cho `lib/cad`

`Nét bao 0.5-0.7 · Nét thấy 0.35 · Nét ẩn 0.25 · Nét trục 0.18` · góc chiếu thứ nhất ·
`Plan (trên) - Front (giữa) - Side (phải)` · dải tỉ lệ chuẩn.

Khớp thẳng với phản hồi cũ của Hoà về *"bớt frame"* và thứ bậc nét. **Đây là con số để cài, không
phải cảm nhận để đoán.**

---

## 3 · Việc, xếp thứ tự

| # | Việc | Chờ gì |
|---|---|---|
| **1** | **Nhãn trung thực** — hằng số neo ⇒ luôn `SUY`; áp luật MỤC 9 ⑧ (lệch >15% ⇒ CẦN XÁC NHẬN); bỏ số giả chính xác, làm tròn 5mm (MỤC 9 ⑥) | không chờ gì |
| **2** | **Nạp MỤC 1+2 thành DỮ LIỆU** trong `lib/vision/` — không phải prompt, là bảng tra. Tầng 1 chạy được **không cần AI** | không chờ gì |
| **3** | **Vật mốc để scale** (MỤC 9 ⑤) — dò cửa / công tắc / ổ cắm / gạch trong ảnh làm neo | sau 2 |
| **4** | **BUỘC số vào món** — một lượt vừa nhận diện vừa đo, khung số phủ lên ảnh cho người bấm chọn | đợt chính |
| **5** | MỤC 3 → luật va chạm mềm | IF2 |
| **6** | MỤC 8 → nét vẽ vector trong `lib/cad` | P4 |

**Việc 1 và 2 làm được ngay, không cần AI, không cần Lark, không cần quyết định gì thêm.**

---

## 4 · Cảnh báo khi port

- `ten` · `category` · `bbox` trong Flow **không có fallback** → AI trả thiếu là crash lúc vẽ khung. IF phải có mặc định.
- `maSo` của Flow dùng **chỉ số mảng** (`PRE-04-01` = phòng thứ 4 trong `rooms`) → nạp thêm ảnh là mã lệch. IF **đừng lặp lại**.
- `cutoutBase64` khai báo nhưng **không ai gán** — CUTOUT chưa bao giờ tồn tại. Ảnh Hoà gửi có ô CUTOUT ⇒ **từ bản khác**. Cần xác nhận bản đang chạy 21 phòng là bản nào.
- Flow **không có gate chất lượng, không retry** — lỗi bất kỳ chặng nào là mất cả hero lẫn drawing của món đó.

---

*Cowork, 31/07/2026. Thay bản v1. Nguồn: `App.tsx` + `knowledge/designStandards.ts` trích nguyên văn từ Flow.*

---

## 5 · ⚠️ TÁCH NỀN — đừng copy Flow, Flow không có

**Đã kiểm code thật:** `cutoutBase64` khai báo nhưng **không dòng nào gán giá trị**. Bước CUTOUT
chưa bao giờ được cài. UI Flow chỉ có 3 ô: CROP · HERO · DRAWING.

Cái Flow gọi là "HERO SHOT" thực chất là `Flow.generate.image` với prompt
*"Isolated studio product shot… white background"* + crop làm ảnh tham chiếu.
⇒ **AI vẽ ra một món đồ MỚI**, không phải tách nền món đồ thật.

Với hồ sơ gửi xưởng, đây là lỗi nghiêm trọng: ảnh không phải món trong phối cảnh gốc.
Và nó phạm đúng luật đã ghi ở `lib/render-studio/task-cards.ts`:
*"TUYỆT ĐỐI không cho AI vẽ minh hoạ giả"*.

| | Cách của Flow | Cách đúng cho IF |
|---|---|---|
| Cơ chế | sinh ảnh mới từ prompt | **tách mặt nạ, giữ nguyên pixel gốc** |
| Model | Nano Banana Pro (sinh ảnh) | RMBG-2.0 · BiRefNet · SAM (chuyên tách nền) |
| Kết quả | món đồ **khác** | đúng món, nền trong suốt |
| Chạy ở đâu | đám mây, tính tiền | **ComfyUI tầng 2 — máy mình, 0đ, dữ liệu không rời máy** |
| Tái lập | mỗi lần một khác | cùng ảnh vào ⇒ cùng kết quả ra |

⇒ Tách nền **không cần sáng tạo, chỉ cần chính xác và lặp lại được** — đúng chỗ tầng 2 (oneAI)
mạnh nhất.

### Thứ tự khi quay lại việc này (đang xếp P4, sau hạ tầng)

1. **Nhãn trung thực** (hằng số neo ⇒ `SUY`; lệch >15% ⇒ CẦN XÁC NHẬN; làm tròn 5mm)
2. **Nạp bảng chuẩn v7.6 + luật MỤC 9** thành dữ liệu — tầng 1 chạy được **không cần AI**
3. **Buộc số vào món** — khung số phủ lên ảnh, người dùng bấm chọn
4. **Tách nền** bằng ComfyUI tầng 2
5. **Bản vẽ vector** từ `lib/cad` (không phải ảnh AI)
6. **XLSX** theo `SPEC_TEMPLATE` — ⚠️ tệp mẫu vẫn **chưa được copy vào** `scripts/fixtures/`

Bước 1–2 không cần AI, không cần mạng, không tốn tiền.

*(Ghi 31/07/2026 sau khi Hoà chốt: hạ tầng trước, việc này để P4.)*
