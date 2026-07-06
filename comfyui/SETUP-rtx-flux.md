# FLUX trên máy render RTX công ty → sketch→render ảnh thật 0đ

Mac 16GB không kham nổi FLUX. Chạy ComfyUI + **FLUX** trên **máy render RTX (≥16GB VRAM, Windows)**; app (Mac) chỉ là client trỏ tới. Đúng mức **oneAI · FLUX-RTX**. Bản vẽ không rời LAN công ty.

## 1. Trên máy RTX (Windows) — cài ComfyUI
- ComfyUI Desktop (comfy.org) HOẶC portable (github comfyanonymous/ComfyUI).
- Chạy có **--listen** để máy khác trong LAN gọi được:
  `python main.py --listen 0.0.0.0 --port 8188` (Desktop: bật "Listen on network" trong settings).
- **Firewall Windows**: mở cổng **8188** inbound.

## 2. Tải model FLUX (dùng ComfyUI Manager cho nhanh) — đặt đúng thư mục
| File | Thư mục | Ghi chú |
|---|---|---|
| `flux1-dev.safetensors` | `models/unet/` | UNET FLUX.1-dev (fp16 ~23GB, hoặc fp8 ~11GB). Có RTX-VRAM lớn thì fp16. |
| `t5xxl_fp16.safetensors` | `models/clip/` | text encoder (fp8 nếu VRAM vừa) |
| `clip_l.safetensors` | `models/clip/` | |
| `ae.safetensors` | `models/vae/` | VAE FLUX |
| `FLUX.1-dev-ControlNet-Union-Pro.safetensors` | `models/controlnet/` | ControlNet Union (có canny). InstantX/Shakker-Labs. |

> ⚠️ **Tên file phải KHỚP** với `comfyui/workflows/sketch_flux.json`. Tải tên khác → đổi tên cho khớp, hoặc nhắn tôi tên thật để sửa workflow. Nếu ComfyUI thiếu node `SetUnionControlNetType`/`FluxGuidance` → update ComfyUI bản mới.

## 3. Trỏ app (Mac) tới máy RTX
Trong `.env.local` của InteriorFlow (sửa lại từ localhost):
```
COMFYUI_URL=http://<IP-LAN-máy-RTX>:8188
```
(vd `http://192.168.1.50:8188`). Restart app. `/api/health` phải trả `comfyui:true`. Mac và máy RTX **cùng LAN** (hoặc VPN công ty).

## 4. Chạy
Núm AI → **oneAI** → engine **FLUX-RTX** → node **Sketch→Render**, thả sketch, Run → FLUX render thật trên RTX, ảnh về Mac. App tự nạp `sketch_flux.json`, bơm prompt/ảnh/seed vào node `IF_*`, POST tới máy RTX.

## Ghi chú
- App GIỮ workflow (Mac); máy RTX chỉ cần **model + ComfyUI chạy + reachable**. Không cần copy workflow sang RTX.
- Không cùng LAN được → dùng tunnel (cloudflared) từ máy RTX ra một URL, đặt URL đó vào `COMFYUI_URL`.
- Muốn clay→render (từ 3ds Max): làm thêm `clay_flux.json` (ControlNet Union type=depth) tương tự — nhắn tôi.
