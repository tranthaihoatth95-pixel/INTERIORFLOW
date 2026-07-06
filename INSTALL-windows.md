# Cài InteriorFlow trên máy công ty (Windows RTX)

Gói này = **mã nguồn app** (không kèm thư viện — máy tự tải khi cài). Chạy được ngay trên máy render RTX, dùng luôn ComfyUI + FLUX local (bản vẽ không rời máy).

## Cài trong 3 bước

1. **Cài Node.js LTS** (một lần): tải tại **https://nodejs.org** → cài như phần mềm thường (Next → Next → Finish).
2. **Giải nén** file zip này ra một thư mục (vd `D:\InteriorFlow`).
3. **Double-click `setup-windows.bat`** → nó tự: cài thư viện → tạo cấu hình → tạo database → chạy app.
   - Xong nó mở server ở **http://localhost:3000** — mở trình duyệt vào đó.
   - **Tài khoản đăng ký đầu tiên = admin.**

Lần sau muốn chạy lại: double-click `setup-windows.bat` (nó bỏ qua bước đã làm, chỉ chạy app).

## Nối FLUX (render ảnh thật 0đ) — nếu máy này có ComfyUI + RTX
1. Cài ComfyUI + tải model FLUX theo `comfyui/SETUP-rtx-flux.md`.
2. `.env.local` đã trỏ sẵn `COMFYUI_URL=http://127.0.0.1:8188` (ComfyUI cùng máy).
3. Trong app: núm AI → **oneAI** → engine **FLUX-RTX** → node **Sketch→Render** → ảnh thật.

## Xuất thuyết trình cho khách
- Node **Export Deck**: gom tối đa 6 slide 16:9. Ngoài **Tải PDF thuyết trình** (bản trình chiếu cố định), giờ có thêm **Tải PowerPoint (.pptx)** — file mở/chỉnh trực tiếp trong Microsoft PowerPoint.
- File .pptx đúng tỉ lệ 16:9 (1920×1080), ảnh nhúng sẵn trong file (khách không cần mạng để xem).
- Không cần cài thêm gì: khả năng xuất .pptx đã nằm trong app (thư viện `pptxgenjs` tự tải khi chạy `setup-windows.bat`).

## Ghi chú
- Không cần Internet để chạy app (trừ khi tải model / dùng ảnh online).
- Database là file `prisma/dev.db` ngay trong thư mục — copy thư mục là copy cả dữ liệu.
- Muốn nhiều máy trong LAN cùng dùng: chạy `npm run build` rồi `npm run start`, mở firewall cổng 3000, các máy khác vào `http://<IP-máy-này>:3000`.
- Bản mới nhất luôn ở GitHub: `github.com/tranthaihoatth95-pixel/INTERIORFLOW` (nếu máy có Git + quyền truy cập).
