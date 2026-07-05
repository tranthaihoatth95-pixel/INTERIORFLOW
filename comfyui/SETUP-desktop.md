# ComfyUI Desktop → render sketch thật 0đ trên Mac (không cần App Store)

Đường "tải web trực tiếp" cho oneAI. Sau khi cài xong, node **Sketch→Render** trong app ra ảnh THẬT.

## 1. Cài ComfyUI Desktop
- Tải installer từ **comfy.org** (mục Download) — bản macOS (Apple Silicon). Bấm cài như app thường.
- Mở lên, để nó khởi tạo. Server chạy ở **`http://127.0.0.1:8188`**.

## 2. Tải model (dùng ComfyUI Manager có sẵn trong Desktop cho nhanh)
Cần 2 file, đặt đúng thư mục (Manager tự đặt đúng, hoặc kéo tay):
- **Checkpoint SDXL** → `models/checkpoints/` — `sd_xl_base_1.0.safetensors` (~6.5GB).
  *Nhẹ/nhanh hơn cho demo: có thể dùng SD1.5 hoặc SDXL-Turbo — nếu vậy báo em, em chỉnh workflow.*
- **ControlNet Canny SDXL** → `models/controlnet/` — đặt tên `controlnet-canny-sdxl-1.0.safetensors`.
  (Có clay→render thì thêm `controlnet-depth-sdxl-1.0.safetensors`.)

> ⚠️ **Tên file phải KHỚP** với workflow (`comfyui/workflows/sketch_canny.json`). Tải về tên khác → đổi tên cho khớp, HOẶC nhắn em tên thật, em sửa workflow.

## 3. Nối app
Thêm vào `.env.local` của InteriorFlow:
```
COMFYUI_URL=http://127.0.0.1:8188
```
Restart app. Badge AI (mức **oneAI/Tự-host**) hết chữ "· mock" khi nối được.

## 4. Chạy
- Núm AI → **oneAI** → engine **FLUX-RTX** (dùng đường ComfyUI). Kéo node **Sketch→Render**, thả sketch, Run → ảnh thật.
- Workflow đã có: `sketch_canny.json` (sketch→render), `clay_depth.json` (clay→render). App tự bơm prompt/ảnh/seed vào node đánh dấu `_meta.title` (xem README.md).

## Trục trặc thường gặp
- **"chưa có workflow / model not found"**: tên file model chưa khớp → xem mục 2.
- **Ảnh méo/không bám sketch**: tăng `strength` ControlNet trong workflow (đang 0.85), hoặc thêm custom node **ControlNet Aux** để tiền xử lý Canny từ sketch.
- **Chậm**: SDXL nặng trên Mac — cân nhắc SD1.5 / SDXL-Turbo (báo em đổi workflow).
