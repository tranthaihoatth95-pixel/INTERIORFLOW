# InteriorFlow — Kế hoạch oneAI + mở rộng node (05/07)

> Bàn với user 05/07. File này vừa là spec vừa là **hợp đồng phân việc** cho nhiều
> Claude Code / worktree chạy song song. Đọc kỹ mục "Cơ chế chống-đè" trước khi fan-out.

## 0. Quyết định định hướng

- **Chế độ "Không AI" (mức 1)**: render Vray/D5 là **LOCAL trên máy công ty Windows RTX**, app KHÔNG render — chỉ *import* ảnh kết quả. (Chaos Cloud của Vray là tuỳ chọn trả phí, không dùng.) Có thể thêm node **Hot-folder watch** để bán tự động.
- **oneAI (chốt)**: đổi khung mức 2 "Tự-host" → **oneAI**, bên trong có **engine selector**: `SD-portable` (mọi thiết bị: Mac M/iPad/Snapdragon, iterate) ↔ `FLUX-RTX` (ảnh chốt quiet-luxury, máy render). **Runtime chọn được**: WebGPU-trình-duyệt ↔ Server-SD-cạnh-máy (Draw Things/ComfyUI/A1111). Giữ 4 mức, chất lượng đỉnh vẫn đi FLUX.
- **AI phụ mã nguồn mở (0đ)**: ControlNet · IP-Adapter · LoRA · SAM2 · LaMa · Depth-Anything v2 · MLSD/LineArt · Florence-2/CLIP-interrogator · Real-ESRGAN · BiRefNet.
- **Present + AI mở**: Concept-writer (LLM local qua Ollama/MLX) + trợ lý ảnh (smart-crop U²-Net, BG-remove BiRefNet, upscale, dịch EN↔VI).
- **3D**: import **FBX/OBJ/glTF** (user export từ 3ds Max/SketchUp — `.max`/`.skp` KHÔNG đọc trực tiếp được). Ortho mặt bằng/mặt đứng: số đo lấy từ mô hình, SD chỉ *tô đẹp*, không để SD bịa tỉ lệ.
- **"Market bố cục" = Presentation Sheet đa-camera**: nhiều góc của **cùng 1 không gian** (1 cam chính + phụ: overview/focus/detail) trên 1 tấm, có **grid ngăn giữa các cam** + **text thuyết minh**, chọn khổ **A3/A2/A1**.

## 1. Cơ chế chống-đè (nhiều worker song song)

Vấn đề: thêm node = đụng `registry.ts` (mảng lớn) → dễ đè nhau. Giải:

- **Seam đã dựng** (05/07, commit này): `lib/nodes/defs/` — mỗi MẢNG việc = 1 file export `NodeDefinition[]`. Barrel `defs/index.ts` gom vào `EXTRA_NODES`, registry spread `[...CORE, ...EXTRA_NODES]`. Downstream (NODE_REGISTRY/Library) tự nhận. **Đa số node KHÔNG cần React component** — UI sinh từ `param.kind`.
- **Luật vàng cho worker**:
  1. Worker CHỈ tạo/sửa **file `defs/<area>.ts` của mình**. Cấm đụng `registry.ts`, `types.ts`, `phases.ts`, `store.ts`, `ai/models.ts`, `ai/tiers.ts`, `Header.tsx`, `NodeLibraryPanel.tsx`.
  2. Mỗi worker 1 **git worktree** riêng (xem [[syncwork-concurrent-sessions]]). Commit **path-scoped** chỉ file của mình.
  3. Cần category/phase/AI-task/component MỚI → ghi vào **manifest bàn giao** (cuối file này), KHÔNG tự sửa file shared.
- **Integrator (phiên chính)** sở hữu: `defs/index.ts` (thêm 1 import + 1 spread/area) + toàn bộ file shared. Wiring gộp 1 lượt sau khi các worker xong.

## 2. Catalog node (✅ user chọn · 🆕 user thêm)

| # | Node | Category | File `defs/` | AI? | Ghi chú |
|---|---|---|---|---|---|
| 1 | Watermark 🆕 | UTILITY | `watermark.ts` ✅XONG | 0 | Node chứng minh seam |
| 2 | Multi-image drop 🆕 | INPUT | `import-multi.ts` | 0 | Chọn nhiều ảnh, kéo-thả (cần component) |
| 3 | Filter (IG preset) 🆕 | UTILITY | `filters.ts` | 0 | Canvas filter preset |
| 4 | Retouch (Hue/Sat/Layer/tách nền) 🆕 | UTILITY | `retouch.ts` | 0/SD | HSL 0đ; SAM2/BiRefNet cần SD |
| 5 | Room-type preset ✅ | INPUT | `room-preset.ts` | 0 | Auto prompt/negative theo phòng |
| 6 | Presentation Sheet A3/A2/A1 🆕 | SLIDE | `sheet-multicam.ts` | 0 | Đa-cam + grid + thuyết minh |
| 7 | CAD→Line ✅ | AI_GENERATE | `cad2line.ts` | SD | Nối pipeline CAD HVH |
| 8 | Material Injector ✅ | AI_EDIT | `material-inject.ts` | SD | IP-Adapter, nối Creative Board |
| 9 | Batch Variations ✅ | AI_GENERATE | `batch-var.ts` | SD | 1 sketch→N (SD-Turbo) |
| 10 | Style Memory (LoRA) ✅ | AI_EDIT | `style-memory.ts` | SD | Nhớ gu studio |
| 11 | 3D Import + Camera 🆕 | INPUT | (subsystem) | 0 | FBX/OBJ/glTF + DOF + chọn góc |
| 12 | Ortho mặt bằng/đứng 🆕 | AI_EDIT | (subsystem) | SD | Số từ 3D, SD tô |
| 13 | Concept-writer ✅ | SLIDE | (LLM local) | LLM | Present |
| 14 | Frame-mockup / Collage / Social-export 🆕 | SLIDE | `layout-*.ts` | 0 | Bố cục marketing |

## 3. Thứ tự build (đề xuất)

- **M0 — Seam** ✅ XONG (commit `5aa248e`).
- **M1 — Local 0-AI (ship ngay, không cần balance)**: #1✅ #2 #3 #4(HSL) #5 #6 #14. Ứng viên fan-out (file-disjoint).
- **M2 — oneAI tier + SD adapter**: ✅ **KHUNG XONG (commit `450445f`)** — mức 2→oneAI, engine SD-portable/FLUX-RTX + runtime WebGPU/server (chọn được, persist, badge, UI Header+Mobile), provider `sd` stub + thread engine toàn tuyến (ExecContext→registry→/api/jobs→resolveModel), health/checkProviders.sd. **CÒN**: (a) nối inference thật — server SD (`SD_SERVER_URL` → Draw Things/ComfyUI/A1111, sửa `providers/sd.ts`) hoặc WebGPU client-side; (b) `entry.sd` model ids riêng nếu cần khác `comfy`; rồi node #7 #8 #9 #10 #4(SAM2/BiRefNet) #12.
- **M3 — 3D subsystem**: #11 (three.js viewport, camera Vray-like) → feed clay2render.
- **M4 — Present LLM**: #13 + trợ lý ảnh.

## 4. Manifest bàn giao (worker ghi, integrator xử lý)

_(trống — worker thêm mục khi cần file shared: category mới / phase featured / AI-task / component)_
