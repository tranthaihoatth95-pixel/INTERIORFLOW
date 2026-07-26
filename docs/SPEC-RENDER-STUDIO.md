# SPEC — RENDER STUDIO *(chặng Render: canvas + node + template)*

> **[CẦN HOÀ DUYỆT]** · Đọc cùng `SPEC-SEMANTIC-MODEL.md`, `IF-CORE-SCHEMA.md`.
> **Nguyên tắc gốc**: **quyền điều khiển đặt ở nơi tay nghề nằm** *(control follows craft)*.
> Nghề của KTS nằm ở *chọn sửa chỗ nào, sửa thành gì* — không nằm ở sampler/scheduler.

---

## 1. Hai mặt phẳng làm việc

```
┌─ MẶT CHÍNH · Canvas ──────────────────────────────┐
│  Ảnh + layer + cọ mask + nét vẽ + ô Reference     │  ← 95% việc thật
└───────────────────────────────────────────────────┘
                 ↕ nút "Mở nâng cao"
┌─ MẶT DƯỚI · Node graph (ComfyUI thật) ────────────┐
│  Dựng/sửa workflow · lưu thành thẻ                │  ← master
└───────────────────────────────────────────────────┘
```

Preset **không phải cái lồng** — là điểm khởi hành; chọn thẻ xong vẫn vẽ, mask, thêm reference.

## 2. Sáu công đoạn — chỉ 3 cái cần người dùng chạm

| # | Công đoạn | Node tiêu biểu | Lộ ra? |
|---|---|---|---|
| 1 | Nạp *(Load)* | checkpoint · LoRA · VAE · ControlNet model | ❌ giấu |
| 2 | Bóc cấu trúc *(Preprocess)* | Lineart · Depth · MLSD · Canny · SAM | 🔸 chỉ "chọn vùng" |
| 3 | Ra điều kiện *(Conditioning)* | ControlNet Apply · IPAdapter · InstantID | ✅ |
| 4 | Sinh ảnh *(Sampling)* | KSampler: steps · cfg · denoise · seed | ✅ (rút gọn) |
| 5 | Hậu kỳ *(Post)* | Upscale · IC-Light · color match · composite | ✅ |
| 6 | Xuất *(Output)* | Save · metadata | ❌ tự động gắn `img_` id → Library |

## 3. Bảng chuyển ngữ núm *(parameter mapping)* — tài sản, phải giữ

| Núm trong IF | Thực chất | Khoảng an toàn |
|---|---|---|
| Bám sát bản vẽ | ControlNet weight | 0.6–1.0 |
| Tự do sáng tạo | denoise | 0.3–0.75 |
| Bám ảnh mẫu (phong cách) | IPAdapter weight | 0.4–0.8 |
| Độ kỹ / chất lượng | steps | 20–35 |
| Ánh sáng · giờ trong ngày | IC-Light preset | thẻ, không slider |
| Độ nét in ấn | upscale factor | 1× / 2× / 4× |

## 4. Flow trọng tâm — "Sửa một mảng trên ảnh có sẵn"

Khớp thói quen thật: ai cũng có sẵn ảnh, chỉ muốn sửa mảng tường/trần/vách.

| Bước | Người dùng | Máy chạy |
|---|---|---|
| 1 | Thả ảnh (chụp · render cũ · chụp màn hình CAD) | load image |
| 2 | Quét cọ lên mảng cần sửa | tạo **mask** |
| 3 | *(tuỳ chọn)* vẽ vài nét chỉ hình dạng mới | ControlNet Scribble **trong vùng mask** |
| 4 | Kéo 1–2 ảnh tham chiếu | IPAdapter |
| 5 | 2 núm → Render | inpaint + **crop & stitch** |

**3 cảnh báo bắt buộc xử lý**: ① mảng mới lệch sáng → phải có bước **color match** ·
② vùng quá nhỏ thiếu ngữ cảnh → **cắt vùng + viền đệm rồi dán lại** · ③ nét tay không tự
đúng điểm tụ — ControlNet bám nét, không sửa phối cảnh.

**Tin tốt**: canvas này CHÍNH LÀ photo-editor hiện có (PS-0 gọi là "hòn đảo"), và PS-3 đã dựng
đủ 3 mảnh đường ống *(handoff · composite · writeback)*. Nối đảo vào đất liền, không xây mới.

## 5. Bộ công cụ canvas — phân bậc

| Bậc | Công cụ |
|---|---|
| **N** | Cọ mask + tẩy · độ mềm biên · chọn vùng hình học · layer · undo · thả reference · so sánh Trước/Sau |
| **P** | Chọn vùng thông minh *(SAM)* · tách nền *(rembg)* · vẽ nét bám phối cảnh · **color match** |
| **L** | Mask đọc từ CAD (biết đâu là tường W-01) · reference tự đề xuất theo **gu dự án** · 4 biến thể một mảng |

## 6. Hệ template — mỗi thẻ là một file JSON + manifest

```
Thẻ "Sửa mảng tường"
├── workflow.json   ← ComfyUI thật, giấu
├── manifest.yaml   ← tên · mô tả · nhóm việc
├── preview         ← poster Trước/Sau · clip 2-4s (tuỳ chọn) · caption 1 dòng
├── inputs          ← ảnh + mask (+ reference)
├── knobs           ← núm nào lộ ra, khoảng nào
└── requires        ← model + custom node cần có
```

### Preview thẻ — dạy bằng kết quả, không bằng chữ

| Mức | Cách làm | Chi phí | Khi nào |
|---|---|---|---|
| **1 · Crossfade 2 ảnh** | Hover → ảnh Sau mờ chồng lên ảnh Trước (CSS) | ~50KB, **0 video** | Bản N — làm ngay |
| 2 · Clip ngắn | WebM/MP4 2–4s, muted, loop, ~480p, <500KB | Vừa | Thẻ cần thể hiện thao tác (vẽ mask, kéo núm) |
| 3 · Thanh trượt so sánh | Kéo qua lại Trước/Sau | Rẻ | Trang chi tiết thẻ |

**4 luật kỹ thuật**: ① không tự phát hết — chỉ nạp khi hover *(lazy load)* · ② luôn có ảnh tĩnh
*(poster)* mặc định · ③ cảm ứng không có hover → chạm 1 xem, chạm 2 chọn · ④ tôn trọng
*prefers-reduced-motion* → chỉ ảnh tĩnh.

**Preview tự nuôi**: kết quả đẹp do thẻ tạo ra tự đề cử làm preview mới — thẻ dùng càng nhiều,
minh hoạ càng sát thực tế. ⚠️ **Luật trung tính**: preview ship trong app phải trung tính (dự án
hư cấu / ảnh CC0). Studio thay bằng ví dụ riêng thì chỉ hiện trong tenant đó, KHÔNG ship theo app.

**Chưng cất**: master dựng workflow ở mặt dưới → "Lưu thành thẻ" → cả team dùng không cần
hiểu node. Kho thẻ cộng đồng = moat khó chép.

### 6 thẻ cho bản N (phủ ~85% việc thật)
Sketch→Ảnh thật · Grey-box→Nội thất có phong cách · Đổi phong cách giữ bố cục ·
Đổi ánh sáng/giờ · **Sửa mảng (inpaint)** · Upscale in ấn.

### Kho thẻ — bộ lọc bằng ngôn ngữ ngành

> **Preview là tuyên ngôn định vị**: ComfyUI phổ quát nên phải hiện người mẫu/thể thao;
> IF chuyên ngành nên kho thẻ **chỉ hiện nội thất · kiến trúc · furniture · layout · video nội thất**.
> Mở ra 2 giây là người dùng biết "đúng app của mình".

| ComfyUI | IF | Giá trị |
|---|---|---|
| Model Filter | **Chặng** — CAD · Render · Present | Lọc theo việc đang làm |
| Tasks | **Nhóm việc** — Phối cảnh · Sửa ảnh · Vật liệu · Ánh sáng · Bố cục · Video | Ngôn ngữ nghề |
| Runs on | **Chạy ở đâu** — 💻 Máy này *(0 credit)* · ☁️ Đám mây *(tốn credit)* | ⭐ biết tốn tiền hay không TRƯỚC khi bấm |
| Sort | Phổ biến · Mới · **Studio tôi hay dùng** | Học từ hành vi thật |

Nhãn trên thẻ: `Nội thất · Sửa ảnh · 0 credit` (không dùng nhãn kỹ thuật kiểu `API · Image Edit`).

### Bộ ảnh mẫu chuẩn — 7 cảnh, cùng phòng để so táo với táo

Mọi thẻ **cùng nhóm dùng chung một cảnh mẫu** → khác biệt giữa các thẻ hiện ra tức thì
*(controlled comparison)*. Tất cả trung tính, dự án hư cấu "Atelier Nord".

| Cảnh mẫu | Minh hoạ nhóm thẻ |
|---|---|
| Phòng khách grey-box | Sketch→render · đổi phong cách |
| Phòng khách hoàn thiện | Sửa mảng · đổi vật liệu · đổi ánh sáng |
| Mặt đứng công trình | Kiến trúc ngoại thất |
| Mặt bằng bố trí | Tô vật liệu · zone màu · diagram |
| Cận cảnh vật liệu | Kho vật liệu · hover xem bề mặt |
| Món furniture đơn | Tách nền · thay nền · catalogue |
| Fly-through 3s | Thẻ video |

**Tự render bằng chính IF** — sạch bản quyền · là bài kiểm tra thật cho app · dùng lại cho
onboarding, landing page, tài liệu bán hàng. Một công bốn việc.

### Luật extension / custom node
| Rủi ro | Xử lý |
|---|---|
| Custom node chạy code tuỳ ý | **Danh sách trắng** *(allowlist)* — bắt buộc trước khi bán ra ngoài |
| Update là vỡ workflow | **Khoá phiên bản** *(pin version)* trong manifest |
| Thiếu model | Thẻ tự kiểm `requires` → báo thiếu gì, tải ở đâu |

## 7. Chuỗi 2D → 3D → Render (tham vọng, mổ ra 4 khúc)

| Khúc | Bản chất | Ai làm |
|---|---|---|
| ① MB tô vật liệu | Ngữ nghĩa | IF ✅ |
| ② **Pull tường → khối 3D** | **Hình học thuần (extrude), KHÔNG phải AI** — DCEL có sẵn | IF ✅ rẻ |
| ③ Grey-box → phối cảnh | ControlNet Depth | ComfyUI ✅ |
| ④a **Diagram luồng giao thông** | **Vector, tính từ semantic model** — 0 credit | IF — bậc **L** |
| ④b Video người đi lại | Video AI: rung hình, méo hình học | ❌ dùng **D5 render video** |

## 8. Tutorial — 3 tầng, luôn có Bỏ qua

1. Lần đầu vào chặng: 5 coachmark (chọn thẻ → thả ảnh → 2 núm → Render → lưu Library).
2. Trong từng thẻ: 1 dòng gợi ý + ảnh Trước/Sau — **dạy bằng kết quả, không bằng chữ**.
3. Nút "Mở nâng cao" — lối xuống node graph cho master.

---

*v1.0 · 2026-07-24 · Ben soạn theo ý Hoà.*

