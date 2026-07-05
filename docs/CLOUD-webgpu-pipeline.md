# Cloud task — WebGPU SD pipeline (chạy SONG SONG, cô lập)

> Prompt tự-đủ cho một Claude Code / agent trên cloud (hoặc máy khác) build **pipeline
> Stable Diffusion chạy client-side bằng WebGPU** cho InteriorFlow — song song với công
> việc trên `main`, KHÔNG đụng file khác để tránh xung đột.

## 0. Bối cảnh (đủ để làm không cần hỏi)

InteriorFlow = web app Next.js 14 (App Router, TS, Zustand, @xyflow/react) — canvas node AI
cho studio nội thất. Có **"mức phụ thuộc AI" (oneAI, mức 2)** với 2 engine (SD-portable ·
FLUX-RTX) và 2 runtime cho SD: **`server`** (đã xong — gọi A1111/Draw Things) và **`webgpu`**
(việc của bạn — chạy SD thẳng trong trình duyệt trên Mac M / iPad / Snapdragon, 0 cài đặt).

**Khung đã có sẵn trên `main` (ĐỪNG làm lại):** selector engine/runtime ở Header + MobileMenu,
state `oneAiEngine`/`oneAiRuntime` persist, `ExecContext.oneAiRuntime`, và điểm rẽ trong
`lib/nodes/registry.ts`:
```ts
if (ctx.aiTier === 2 && ctx.oneAiEngine === 'sd' && ctx.oneAiRuntime === 'webgpu') {
  try { return await webgpuGenerate(task, input, ctx.onProgress); }
  catch { return runMock(); }   // chưa xong → tự mock, không lỗi
}
```

## 1. Việc của bạn = HIỆN THỰC `lib/ai/webgpu.ts`

CHỈ sửa **`lib/ai/webgpu.ts`** (+ thêm dependency vào `package.json`). Interface ĐÃ CHỐT —
giữ nguyên chữ ký, chỉ điền ruột:

```ts
export function webgpuAvailable(): boolean            // đã có (navigator.gpu)
export class WebGpuNotReady extends Error {}          // ném khi không chạy được → registry mock
export async function webgpuGenerate(
  task: AiTask,
  input: Record<string, unknown>,
  onProgress: (p: number) => void,   // 0..1
): Promise<string[]>                                   // MẢNG data-URI PNG ('data:image/png;base64,...')
```

### Hợp đồng input (giống provider server — nhất quán toàn app)
| key | ý nghĩa | nhánh |
|---|---|---|
| `prompt`, `negative_prompt` | text | luôn |
| `guidance_scale` | CFG | luôn |
| `seed` | int, không có = random | luôn |
| `width`,`height` | mặc định 768×512 | luôn |
| `control_image_url` | ảnh **guide hình học** (sketch/clay) → **txt2img + ControlNet** | 1 |
| `image_url` | ảnh init → **img2img** | 2 |
| `mask_url` | mask inpaint (đi kèm image_url) | 2 |
| `strength` | denoise img2img (0..1) | 2 |
| (không ảnh) | → **txt2img thuần** (moodboard) | 3 |

Ảnh đầu vào là **data-URI hoặc URL**; trả về **data-URI PNG**. `onProgress` gọi đều theo step.

## 2. Kỹ thuật đề xuất (tự chọn, ưu tiên nhẹ + chạy được thật)

- **Model chính**: **SD-Turbo / SDXL-Turbo** (1–4 step) — nhẹ, hợp WebGPU/mobile NPU.
- **Runtime** (chọn 1, đánh giá rồi quyết trong file này):
  - `@huggingface/transformers` (transformers.js) backend **WebGPU** — quen thuộc, có pipeline diffusion.
  - `web-stable-diffusion` (MLC-AI, TVM) — nhanh, nhưng nặng tích hợp.
  - `onnxruntime-web` + model ONNX tự ghép UNet/VAE/CLIP — linh hoạt nhất, nhiều việc nhất.
- **Tải & cache model** (~1–2GB): Cache API / IndexedDB, tải 1 lần, `onProgress` cả lúc tải.
- **Lazy-load**: `await import()` runtime + model CHỈ khi `webgpuGenerate` được gọi lần đầu —
  KHÔNG phình bundle khởi động. Giữ singleton pipeline giữa các lần gọi.
- **Bộ nhớ**: giải phóng tensor; cảnh báo nếu thiết bị thiếu VRAM → ném `WebGpuNotReady`
  (registry sẽ mock, không crash).

## 3. Milestone (làm dần, mỗi mốc 1 commit)

1. **v1 — txt2img SD-Turbo**: nhánh 3 (moodboard) chạy thật trong trình duyệt + progress + cache. Đủ để nghiệm thu "WebGPU thật".
2. **v2 — img2img**: nhánh 2 (styleTransfer/staging/relight/upscale) + mask (inpaint).
3. **v3 — ControlNet**: nhánh 1 (sketch/clay). Cần preprocessor (canny từ ảnh — làm bằng canvas/edge-detect JS) + ControlNet weights cho SD-Turbo/SD1.5. Khó nhất — có thể để mốc riêng, tạm fallback txt2img nếu chưa có CN.

## 4. Luật CHỐNG-ĐÈ (bắt buộc)

- Làm trên **branch/worktree riêng** (vd `feat/webgpu-pipeline`) hoặc bản clone từ bundle.
- CHỈ commit **`lib/ai/webgpu.ts`** + **`package.json`/`package-lock.json`** (thêm dep).
  TUYỆT ĐỐI không đụng: `registry.ts`, `store.ts`, `types.ts`, `tiers.ts`, `Header.tsx`,
  `MobileMenu.tsx`, `execution.ts`, `providers/*` — seam đã xong trên `main`.
- Commit path-scoped; PR/merge để integrator (phiên chính) gộp. Xem `docs/PLAN-oneAI-and-nodes.md`.

## 5. Test

1. `npm run dev`, đăng nhập (hoa@ttt.vn / matkhau123).
2. Header → núm AI → **oneAI** → engine **SD-portable** → runtime **WebGPU**.
3. Kéo node **Moodboard** (hoặc Sketch→Render), nhập prompt, Run → ảnh phải sinh THẬT trong
   trình duyệt (không phải placeholder mock). Kiểm `navigator.gpu` có (Chrome/Edge/Safari TP).
4. `npx tsc --noEmit` sạch.

## 6. Định nghĩa "xong"

`webgpuGenerate` trả ảnh SD thật (ít nhất txt2img) trên máy có WebGPU; thiếu WebGPU/model lỗi
thì ném `WebGpuNotReady` để app mock mượt. Không phình bundle khởi động. tsc sạch.
