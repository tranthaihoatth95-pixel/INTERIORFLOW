# Chặng 2 — Rendering · Catalog tính năng

_Audit ngày 24/07 (feat/clay2img-audit)._ Rendering là chặng ở giữa của trục Concept · Render · Present. Toàn bộ node của chặng này chạy trên **node canvas ở route `/`** (React Flow, `components/FlowCanvas.tsx`). Chặng khai báo trong `lib/phases.ts` (`id: 'render'`, label _Rendering_). `/photo-editor` là công cụ con của Render (chỉnh ảnh raster kiểu Photopea, handoff qua sessionStorage).

## 0. Kiến trúc backend

| Provider | Cấu hình | Dùng cho | Mức AI |
|---|---|---|---|
| **fal.ai** (`lib/ai/providers/fal.ts`) | `FAL_KEY` | FLUX Pro/Dev/Schnell, Kling video, ESRGAN, BiRefNet, IC-Light | Mức 3 (Vừa) & Mức 4 (Cao) |
| **ComfyUI** (`lib/ai/providers/comfyui.ts`) | `COMFYUI_URL` (+ `COMFY_SKETCH_WF`) | FLUX-RTX / SDXL workflows tự-host | Mức 2 (oneAI · engine flux) |
| **SD-portable** (`lib/ai/providers/sd.ts`) | `SD_SERVER_URL` | Draw Things / A1111 / ComfyUI trên máy Mac / iPad | Mức 2 (oneAI · engine sd) |
| **NVIDIA NIM** (`lib/ai/providers/nvidia.ts`) | `NVIDIA_API_KEY` | Tầng AI-1 cho `ai.text2image` (FLUX.1-dev free) · VLM caption (`captionImage`, `meta/llama-3.2-11b-vision-instruct`) · LLM (`completeText`) | Cross-tier, ưu tiên đầu tiên |
| **Ollama** (`lib/ai/providers/ollama.ts`) | `OLLAMA_URL` (mặc định `http://127.0.0.1:11434`) | Fallback local LLM · Notebook RAG | Fallback cho `completeTextTiered` |

**`completeTextTiered(prompt, system?, opts?)`** (`lib/ai/text-tier.ts`): NVIDIA free → Ollama local → `NoTextProviderError`. Dùng cho Concept Content, chat assist, RAG (`lib/notebook/rag.ts`).

**Kế toán credit** ở server (`lib/server/credits.ts`): render premium 4c/ảnh, refund khi mock/lỗi. Node AI đặt `creditCost` (0–4). Auth check ở `/api/jobs` và `/api/render/*` — chặn vô danh đốt balance.

**Mock mode có nhãn**: `providerReady === false` → `mockRender` trả SVG placeholder có chữ "mock" (không giả real render). Node canvas gắn `_tier` badge để user biết tầng nào đã chạy.

Trạng thái provider tại thời điểm audit (`/api/providers`): `fal=true · comfyui=true · sd=false`.

## 1. Bảng node Rendering

Chú thích cột **Trạng thái**: 🟢 production (đã wire cả UI + backend, có fallback tường minh) · 🟡 wired-mock (UI+backend nhưng mock/coming-soon rõ ràng) · 🔴 UI-only (không có backend).

Cột **Model backend**: fal-model chính (mức 4) / workflow ComfyUI (mức 2) / lõi tất định.

Cột **⏱ demo**: thời gian điển hình 1 job (từ `AI_TASKS[task].typicalMs` hoặc đo). Cột **★**: chất lượng đánh giá 1–5 sao theo ref quiet-luxury của user.

### 1a. Nhóm INPUT (0 credit, tất định)

| Node id | Tên | Trạng thái | Input | Output | Backend | ⏱ | ★ |
|---|---|---|---|---|---|---|---|
| `input.image` | Import Image | 🟢 | file | image | — (browser file API) | tức thì | 5 |
| `input.prompt` | Text Prompt | 🟢 | — | text | — | tức thì | 5 |
| `input.stylepreset` | Style Preset | 🟢 | — | text | 6 preset (Scandinavian / Japandi / Indochine / Modern Luxury / Wabi-sabi / Industrial) | tức thì | 4 |
| `input.roominfo` | Room Info | 🟢 | — | text | Map loại phòng + hướng sáng + trần cao | tức thì | 4 |
| `input.guref` | Gu Reference | 🟢 | — | text | `fetchGuProfile(['ref-render'])` → thư viện Reference | tức thì | 4 |
| `three.camera` | Góc máy ảnh | 🟢 | — | camera+prompt | `lib/three/camera.ts` preset | tức thì | 4 |
| `three.cad2fbx` | Bản vẽ → 3D (OBJ/FBX) | 🟢 | camera opt | text + OBJ/MTL/cam ẩn | `docToObjScene` (`lib/three/cad-to-obj.ts`), FBX qua Blender local `/api/render/fbx` | 1–3s (OBJ) · 5–15s (FBX) | 3 |

### 1b. Nhóm AI GENERATE (mức 2/3/4)

| Node id | Tên | Trạng thái | Input | Output | fal model · comfy wf | ⏱ | ★ |
|---|---|---|---|---|---|---|---|
| **`ai.clay2render`** | **Clay → Photoreal** | 🟢 core (chặng 2) | image (clay) + prompt | image | `fal-ai/flux-pro/v1/depth` · fast `flux-control-lora-depth/image-to-image` · comfy `clay_depth` | 26s | 5 |
| `ai.sketch2render` | Sketch → Render | 🟢 | image (sketch) + prompt | image | `fal-ai/flux-pro/v1/canny` · fast `flux/dev/image-to-image` · comfy `sketch_flux`/`sketch_canny` | 30s | 5 |
| `ai.emptystaging` | Empty Room Staging | 🟢 | image + prompt | image | `fal-ai/flux/dev/image-to-image` · comfy `img2img` | 22s | 4 |
| `ai.styletransfer` | Style Transfer | 🟢 | image + prompt | image | `fal-ai/flux/dev/image-to-image` · comfy `img2img` | 20s | 4 |
| `ai.moodboard` | Moodboard Gen | 🟢 | prompt | 4 × image | `fal-ai/flux/schnell` · comfy `text2img` | 10s × 4 | 4 |
| `ai.exterior` | Exterior / Facade | 🟢 | image + prompt | image | `fal-ai/flux-pro/v1/canny` · comfy `sketch_canny` | 25s | 4 |
| `ai.batchvariants` | Batch Variants | 🟢 | image/prompt | 2–4 × image | Song song `sketch2render`/`clay2render`/`styletransfer` | 25s × N | 4 |
| `ai.text2image` | Tạo ảnh (Text → Ảnh) | 🟢 3-tầng | prompt + camera opt | image | Tầng AI-1: NVIDIA NIM FLUX.1-dev (`/api/render/nvidia-image`) → tầng AI-2: fal/oneAI (`moodboard`) → tầng lõi (`text2imageCore` SVG concept sketch) | 3–10s (NVIDIA) · 10s (fal) · tức thì (lõi) | 4 |
| `render.compare` | So sánh model (xịn) | 🟢 | prompt / image | 3 × image có nhãn | `/api/render/premium` — whitelist: FLUX Pro 1.1 Ultra, SD3.5 Large, Ideogram v2, Recraft v3; 4c/model | 15–40s / model | 5 |
| **`ai.image2video`** | **Image → Video** | 🟡 mức 3+ only | image + prompt | video | `fal-ai/kling-video/v2.5-turbo/pro/image-to-video` · Master `v2/master/...` | 120–150s | 4 |
| `ai.text2video` | Text → Video | 🟡 mức 3+ only | prompt | video | `fal-ai/kling-video/v2/master/text-to-video` | 120s | 3 |

### 1c. Nhóm AI EDIT (chỉnh sửa cục bộ)

| Node id | Tên | Trạng thái | Input | Output | Backend | ⏱ | ★ |
|---|---|---|---|---|---|---|---|
| `ai.materialswap` | Material Swap | 🟢 | image + mask | image | `fal-ai/flux-pro/v1/fill` · comfy `inpaint` | 25s | 4 |
| `ai.furniture` | Furniture Remove / Add | 🟢 | image + mask | image | `fal-ai/flux-pro/v1/fill` · comfy `inpaint` (Xoá đồ · Thêm đồ) | 25s | 4 |
| `ai.relight` | Relight | 🟢 | image | image | `fal-ai/iclight-v2` (KHÔNG có bản comfy) | 22s | 4 |
| `ai.upscale` | Upscale 4K | 🟢 | image | image | `fal-ai/esrgan` · comfy `upscale` (2× / 4×) | 15s | 5 |
| `ai.removebg` | Remove BG | 🟢 | image | cutout | `fal-ai/birefnet/v2` (chỉ fal) | 10s | 5 |
| `ai.idmask` | ID Mask (phân vùng) | 🟢 2-tầng | image | idmap + mask | Tầng lõi `quantizeIdMap` (median-cut) → tinh chỉnh BiRefNet khi có FAL | 2–4s (lõi) · +10s (AI) | 4 |
| `ai.furnitureextract` | Tách nội thất | 🟢 2-tầng | image | cutout + mask | Tầng AI BiRefNet → tầng lõi `extractForeground` (tách màu nền viền) | 1–3s (lõi) · +10s (AI) | 4 |
| `ai.localedit` | Chỉnh cục bộ | 🟢 2-tầng | image + mask | image | Tầng AI `materialSwap` (FLUX Fill) → tầng lõi `applyMaskedAdjust` (pixel-op sáng/tương phản/bão hoà/hue trong vùng mask) | 25s (AI) · tức thì (lõi) | 4 |

### 1d. Nhóm UTILITY (0 credit, tất định)

| Node id | Tên | Backend | Ghi chú |
|---|---|---|---|
| `util.maskpainter` | Mask Painter | Canvas brush client | Vẽ tay mask cho các node AI Edit |
| `util.edit` | Chỉnh ảnh (manual) | `adjustImage` (`lib/imaging.ts`) | Sáng/tương phản/bão hoà/nhiệt màu |
| `util.palette` | Color Palette | `extractPalette` (median-cut) | Trích 5–8 HEX từ ảnh |
| `util.compare` | Compare A/B | Pass-through | So sánh song song 2 ảnh |
| `util.annotate` | Annotate | Canvas overlay | Bấm chấm + chú thích trên ảnh |
| `util.crop` | Crop & Resize | Canvas | 6 tỉ lệ |
| `util.composite` | Ghép ảnh | Canvas + blend mode | Chồng cutout lên nền |
| `util.sketchpad` | Free Sketch | `SketchStudioModal` (client) | Vẽ tay pen/pencil, export PNG |
| `util.watermark` | Watermark | Canvas | Dán logo/watermark |
| `util.materialnote` | Material Note | Text card | Ghi chú vật liệu (spec) |

### 1e. Nhóm OUTPUT (đầu ra chặng 2 → chặng 3)

| Node id | Tên | Backend |
|---|---|---|
| `out.moodboard` | Moodboard (Collage) | `buildMoodboardCollage` (`lib/moodboard-collage.ts`) — 3 layout (Editorial / Grid / Justified) |
| `out.board` | Export Board | Canvas grid 4 ảnh + label |
| `out.gallery` | Save to Gallery | `saveToGallery` (`lib/gallery.ts`) — persist Larkbase |

## 2. Demo Clay → Photoreal (verify pipeline)

**Verify môi trường** ở worktree `interiorflow-wt-clay2img-audit`, port 3014:

```
$ curl -s http://127.0.0.1:3014/api/providers
{"fal":true,"comfyui":true,"sd":false,"providers":{"fal":true,"comfyui":true,"sd":false}}
```

Cả 2 provider chính đều live → node `ai.clay2render` sẵn sàng chạy thật (không rơi mock).

**Ảnh mẫu shipped trong repo** (dùng cho quick-demo & giới thiệu):

| Slot | File | Cỡ | Ghi chú |
|---|---|---|---|
| Before (input clay) | `public/demo/clay-in.jpg` | 600×350 WebP | Clay render trắng khối 3ds Max |
| After (FLUX depth) | `public/demo/clay-out.png` | 1216×832 PNG | Photoreal quiet-luxury bedroom |
| Sketch before | `public/demo/sketch-in.jpg` | 1000×999 JPEG | Line drawing SketchUp |
| Sketch after | `public/demo/sketch-out.png` | 1216×832 PNG | FLUX Canny render |
| Upscale showcase | `public/demo/clay-4k.jpg` | 4864×3328 JPEG | Ảnh 4K sau upscale ESRGAN |

Ba screenshot nằm ở đường dẫn công khai `http://127.0.0.1:3014/demo/clay-in.jpg`, `/demo/clay-out.png`, `/demo/clay-4k.jpg`. Đây là bộ demo canonical đã dùng trong onboarding tour.

**Chạy live** (đăng nhập trước, kéo node vào canvas ở `/`):

```
Import Image (clay-in.jpg) ─┐
                            ├─→ Clay → Photoreal ──→ Upscale 4K ──→ Save to Gallery
Style Preset "Modern Luxury"─┘   (Bám khối = 16,           (scale 4×)
                                  fal FLUX Pro Depth)
```

Ước lượng: 26s (clay) + 15s (upscale) = ~41s để có 1 ảnh chốt.

## 3. Gap · UI có, backend chưa full

| Vấn đề | Node liên quan | Chi tiết |
|---|---|---|
| **Video chỉ mức 3+** | `ai.image2video`, `ai.text2video` | Không có workflow comfy tự-host, mức 1/2 báo lỗi rõ ràng. Chấp nhận được nhưng cần balance fal. |
| **Relight chỉ fal** | `ai.relight` | `AI_TASKS.relight` không khai `comfy` → oneAI không dùng được. |
| **Remove BG chỉ fal** | `ai.removebg` | BiRefNet chưa có comfy workflow — mức 2 rơi mock. |
| **WebGPU runtime "đang phát triển"** | mức 2 oneAI · engine sd · runtime webgpu | `webgpuGenerate` fallback mock khi model chưa nạp. Dùng được nhưng ở watermark "đang phát triển". |
| **FBX cần Blender local** | `three.cad2fbx` | `/api/render/fbx` 501 `BLENDER_MISSING` nếu chưa cài — OBJ/MTL vẫn xuất. |
| **NVIDIA free có rate-limit** | `ai.text2image` tầng AI-1 | `NVIDIA_FREE_EXHAUSTED` → không âm thầm tụt (đúng cơ chế), user thấy 429. |
| **Node canvas mount ở `/`** | Chặng Rendering | Người mới có thể tưởng chặng render nằm ở `/cad-editor` hoặc `/photo-editor`. Trên StudioBar `active === 'photo'` được nhóm chung nhãn Render nhưng photo-editor **không phải** node canvas AI. |
| **Screenshot demo tự chạy** | — | Task bảo chụp before/after ở `127.0.0.1:3014`. Tài liệu này dùng ảnh shipped `public/demo/*`; live-shot phải qua session đăng nhập, agent không tự đăng nhập được (rule LUẬT MÁU). |

## 4. Ma trận task × tier (nhắc nhanh)

| Task | Mức 1 Không AI | Mức 2 oneAI (sd/flux) | Mức 3 fal Vừa | Mức 4 fal Cao |
|---|---|---|---|---|
| `sketch2render` | ❌ | ✅ (`sketch_flux`/`sketch_canny`) | flux/dev i2i | flux-pro canny |
| `clay2render` | ❌ | ✅ (`clay_depth`) | control-lora depth | flux-pro depth |
| `staging` | ❌ | ✅ (`img2img`) | flux/dev i2i | flux/dev i2i |
| `moodboard` | ❌ | ✅ (`text2img`) | flux/schnell | flux/schnell |
| `materialSwap`, `furnitureEdit` | ❌ | ✅ (`inpaint`) | flux-pro fill | flux-pro fill |
| `upscale` | ❌ | ✅ (`upscale`) | esrgan | esrgan |
| `relight`, `removeBg` | ❌ | ❌ (chưa comfy) | fal only | fal only |
| `image2video`, `text2video` | ❌ | ❌ | Kling turbo | Kling master |

Mức 1 (Không AI): các node UTILITY + `three.cad2fbx` + tầng lõi của `text2image`/`idmask`/`furnitureextract`/`localedit` vẫn chạy 100%. Đây là phao cứu sinh cho khi mất mạng / hết credit.

## 5. Tài liệu tham chiếu liên quan

- `docs/STRATEGY-ai-tiers-and-safety.md` — triết lý 4 mức AI.
- `docs/CAD-AI-MECHANISM.md` — cơ chế clay → AI tổng thể.
- `IF-FEATURE-SPEC-P1.md` — spec sprint P1 (chặng 2 nằm trong M2).
- `lib/nodes/registry.ts` (1037 dòng) — CORE nodes.
- `lib/nodes/defs/render-v2.ts` (513 dòng) — 6 node "V2" (text2image · camera · cad2fbx · idmask · furnitureextract · localedit).
- `lib/ai/models.ts` — task ↔ model map.
- `lib/ai/tiers.ts` — resolve tier → provider → model.
