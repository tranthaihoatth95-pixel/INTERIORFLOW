# Cài InteriorFlow trên máy công ty (Windows RTX)

> **Muốn app NATIVE thật (cửa sổ riêng, có icon, vào Start Menu, không trình duyệt)?**
> → Xem **`INSTALL-windows-native.md`**: double-click `build-windows-native.bat` một lần để tạo bộ cài `.exe`, rồi cài như phần mềm thường. **Đây là cách khuyến nghị.**
>
> File dưới đây là **cách chạy nhanh** (mở ở cửa sổ trình duyệt `localhost:3000`, không cần build) — tiện để thử ngay.

Gói này = **mã nguồn app** (không kèm thư viện — máy tự tải khi cài). Chạy được ngay trên máy render RTX, dùng luôn ComfyUI + FLUX local (bản vẽ không rời máy).

## Cài trong 3 bước

1. **Cài Node.js LTS** (một lần): tải tại **https://nodejs.org** → cài như phần mềm thường (Next → Next → Finish).
2. **Giải nén** file zip này ra một thư mục (vd `D:\InteriorFlow`).
3. **Double-click `setup-windows.bat`** → nó tự: cài thư viện → tạo cấu hình → tạo database → chạy app.
   - Xong nó mở server ở **http://localhost:3000** — mở trình duyệt vào đó.
   - **Tài khoản đăng ký đầu tiên = admin.**

Lần sau muốn chạy lại: double-click `setup-windows.bat` (nó bỏ qua bước đã làm, chỉ chạy app).

## Nối render AI thật (0đ) — ComfyUI trên chính máy RTX này

**Đường nhanh nhất hôm nay — SDXL (đã tune sẵn, giống bản chạy trên Mac):**
1. Cài **ComfyUI Desktop** cho Windows: tải ở **comfy.org** → cài như phần mềm thường. Mở lên 1 lần cho nó tự cấu hình (server chạy ở cổng 8188).
2. Tải 2 model (bỏ vào thư mục model của ComfyUI):
   - SDXL base → `models/checkpoints/`: huggingface.co/stabilityai/stable-diffusion-xl-base-1.0 → file `sd_xl_base_1.0.safetensors` (~6.9GB)
   - ControlNet depth SDXL → `models/controlnet/`: huggingface.co/diffusers/controlnet-depth-sdxl-1.0 → file `diffusion_pytorch_model.safetensors`, **đổi tên thành** `controlnet-depth-sdxl-1.0.safetensors` (~4.7GB)
   - (Muốn thêm Sketch→Render: tải thêm controlnet **canny** SDXL của xinsir, đặt tên `controlnet-canny-sdxl-1.0.safetensors`)
3. Cài custom node **comfyui_controlnet_aux** (để tự trích depth từ ảnh clay): trong ComfyUI Desktop → Manager → Install "comfyui_controlnet_aux" (hoặc git clone vào `custom_nodes/`). Model DepthAnythingV2 tự tải lần chạy đầu.
4. Trong thư mục app, mở `.env.local` thêm 2 dòng:
   ```
   COMFYUI_URL=http://127.0.0.1:8188
   COMFY_SKETCH_WF=sketch_canny
   ```
5. Chạy lại app → trong app: núm AI → **oneAI** → engine **FLUX-RTX** → node **Clay→Render** (kéo ảnh clay 3ds Max vào) hoặc **Sketch→Render** (slider "Bám sketch" 3 mức) → ảnh thật.

**Đường FLUX (đẹp hơn, nặng hơn — làm sau):** theo `comfyui/SETUP-rtx-flux.md`.

## Xuất thuyết trình cho khách
- Node **Export Deck**: gom tối đa 6 slide 16:9. Ngoài **Tải PDF thuyết trình** (bản trình chiếu cố định), giờ có thêm **Tải PowerPoint (.pptx)** — file mở/chỉnh trực tiếp trong Microsoft PowerPoint.
- File .pptx đúng tỉ lệ 16:9 (1920×1080), ảnh nhúng sẵn trong file (khách không cần mạng để xem).
- Không cần cài thêm gì: khả năng xuất .pptx đã nằm trong app (thư viện `pptxgenjs` tự tải khi chạy `setup-windows.bat`).

## Ghi chú
- Không cần Internet để chạy app (trừ khi tải model / dùng ảnh online).
- Database là file `prisma/dev.db` ngay trong thư mục — copy thư mục là copy cả dữ liệu.
- Muốn nhiều máy trong LAN cùng dùng: chạy `npm run build` rồi `npm run start`, mở firewall cổng 3000, các máy khác vào `http://<IP-máy-này>:3000`.
- Bản mới nhất luôn ở GitHub: `github.com/tranthaihoatth95-pixel/INTERIORFLOW` (nếu máy có Git + quyền truy cập).
