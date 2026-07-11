# Mức 2 — Tự-host ComfyUI (render 0đ trên máy công ty)

Đây là mức AI khuyến nghị cho công ty: chạy FLUX/SDXL + ControlNet **ngay trên dàn máy render (RTX ≥16GB)** —
**0đ/ảnh, bản vẽ khách không rời máy**, hình học bị khoá bởi ControlNet nên AI không bịa/biến dạng tổng thể.
Xem lý do trong `docs/STRATEGY-ai-tiers-and-safety.md` §0b.

## 1. Cài ComfyUI trên máy render

```bash
git clone https://github.com/comfyanonymous/ComfyUI
cd ComfyUI && pip install -r requirements.txt
python main.py --listen 0.0.0.0 --port 8188
```

Tải model vào `ComfyUI/models/`:
- **Checkpoint**: SDXL base (`sd_xl_base_1.0.safetensors`) — hoặc FLUX.1 dev fp8 (16GB đủ).
- **ControlNet depth**: `controlnet-depth-sdxl-1.0.safetensors` (SDXL) hoặc `FLUX.1-dev-ControlNet-Depth`.
- Khuyến nghị thêm custom node **ControlNet Aux Preprocessors** để sinh depth map từ clay render.

## 2. Trỏ InteriorFlow tới máy render

Trong `.env.local` của app:

```
COMFYUI_URL=http://<ip-máy-render>:8188
```

Restart app. Badge AI trên header (mức **Tự-host**) sẽ hết chữ "· mock" khi nối được máy.
Không đặt `COMFYUI_URL` → mức 2 tự động chạy **mock** (ảnh placeholder), không crash.

## 3. Cơ chế workflow template (bơm tham số)

App KHÔNG hardcode graph. Mỗi task nội thất map tới 1 file workflow **API-format** trong
`comfyui/workflows/<tên>.json` (xem `lib/ai/models.ts` → trường `comfy`). Adapter
(`lib/ai/providers/comfyui.ts`) nạp file, **bơm tham số vào node đánh dấu bằng `_meta.title`**, rồi POST `/prompt`.

Marker hỗ trợ (đặt `_meta.title` cho node tương ứng trong ComfyUI):

| Marker | Node điển hình | App ghi vào |
|---|---|---|
| `IF_POSITIVE` | CLIPTextEncode (prompt dương) | `inputs.text` |
| `IF_NEGATIVE` | CLIPTextEncode (prompt âm) | `inputs.text` |
| `IF_IMAGE` | LoadImage (ảnh clay/sketch) | `inputs.image` (tự upload) |
| `IF_MASK` | LoadImage (mask inpaint) | `inputs.image` (tự upload) |
| `IF_GUIDANCE` / `IF_STRENGTH` / `IF_SCALE` | Primitive/Float | `inputs.value` |
| `IF_SEED` | KSampler / SamplerCustom | `seed` / `noise_seed` / `value` |

Ảnh output lấy từ node **SaveImage** (bắt buộc có 1 node SaveImage trong workflow).

## 4. Các workflow file app tham chiếu

| File | Dùng cho node |
|---|---|
| `clay_depth.json` ✅ (kèm sẵn) | **Clay → Photoreal** (ControlNet depth) — node cốt lõi |
| `sketch_canny.json` | Sketch → Render, Exterior (ControlNet canny) |
| `img2img.json` | Style Transfer, Empty Room Staging |
| `text2img.json` | Moodboard Gen |
| `inpaint.json` | Material Swap, Furniture Remove/Add (Fill/inpaint) |
| `upscale.json` | Upscale 4K |

Chỉ `clay_depth.json` kèm sẵn làm mẫu. Tạo các file còn lại bằng cách: dựng workflow trong ComfyUI →
đặt `_meta.title` cho các node cần bơm → **Save (API Format)** → lưu đúng tên trên. Task nào thiếu file
sẽ báo lỗi rõ ("chưa có workflow tự-host"), không crash — cứ chuyển tạm sang mức AI Cao/Vừa.

## 5. Đổi sang FLUX

Thay node checkpoint = FLUX loader, ControlNet = FLUX depth, KSampler = SamplerCustomAdvanced.
Giữ nguyên các `_meta.title` marker → adapter không cần sửa. 16GB VRAM chạy FLUX dev fp8 + depth ổn.

## 6. Custom node cho Clay → Photoreal (BẮT BUỘC)

`clay_depth.json` dùng `DepthAnythingV2Preprocessor` từ **comfyui_controlnet_aux**. Node này chỉ đăng ký
khi ĐỦ dependency Python — thiếu 1 gói là **cả pack đăng ký 0 node** và app báo "thiếu custom node".
Cài vào đúng venv của ComfyUI:

```bash
cd ~/ComfyUI && source venv/bin/activate
pip install matplotlib scikit-image scikit-learn onnxruntime   # KHÔNG cài onnxruntime-gpu trên Mac
# (requirements.txt của pack liệt kê onnxruntime-gpu — bỏ qua, Mac dùng onnxruntime CPU)
```

Restart ComfyUI, kiểm đã đăng ký:
`curl -s localhost:8188/object_info/DepthAnythingV2Preprocessor` → khác `{}` là OK.
Model depth ControlNet: `models/controlnet/controlnet-depth-sdxl-1.0-fp16.safetensors` (đã có).

**MPS (Mac 16GB) chậm**: SDXL + ControlNet + depth ~40–55 s/bước. `clay_depth.json` đã hạ
**steps 26→20, res 1216×832→1024×704** cho đỡ thrash RAM; máy RTX nên nâng lại + đổi FLUX (mục 5).
