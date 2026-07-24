# DEMO LIVE Clay → Photoreal · 24/07/2026

**Verdict: 🔴 FAIL-PROVIDER** — pipeline API hoạt động đúng end-to-end (auth → validate → resolve model → submit), nhưng CẢ HAI provider đều không khả dụng tại thời điểm chạy. **Không tốn credit nào** (0/500 của user demo).

## Setup
- Worktree `interiorflow-wt-clay2img-audit` (branch `feat/clay2img-audit`), dev server port 3014.
- `DATABASE_URL` đổi sang absolute path (`file:/…/prisma/dev.db.wt`) vì node_modules symlink về repo chính khiến relative path resolve sai — tránh P2021.
- Login API OK: `demo@if.local` (id `demo_seed_001`, 500 credits) qua curl cookie-jar `/tmp/if-demo.jar`.
- Script chạy: `run-demo.mjs` (cùng thư mục) — submit `POST /api/jobs` với input đúng contract node `ai.clay2render` (prompt + RENDER_NEGATIVE + `control_image_url` data-URI + `guidance_scale: 16` + `num_images: 1`), poll `GET /api/jobs/{id}?task=clay2render&tier=4`.

## Kết quả 2 case

| Case | Input | Tier / Model | Kết quả | Thời gian | Credit |
|---|---|---|---|---|---|
| 1 · Lobby lễ tân | `case1-lobby-input.webp` (38 KB, clay CGI) | 4 (AI Cao) / `fal-ai/flux-pro/v1/depth` | ❌ HTTP 502 submit | ~1s (fail ngay) | 0 |
| 2 · Phòng khách 3ds Max | `case2-livingroom-input.jpg` (228 KB) | 4 (AI Cao) / `fal-ai/flux-pro/v1/depth` | ❌ HTTP 502 submit | ~1s (fail ngay) | 0 |

**Lỗi fal nguyên văn (cả 2 case, giống hệt):**

```
{"error":"User is locked. Reason: Exhausted balance. Top up your balance at fal.ai/dashboard/billing"}
```

## Fallback ComfyUI (tier 2 oneAI / workflow `clay_depth`)
- `/api/health` báo `comfyui: true` — nhưng đây chỉ là check "CÓ COMFYUI_URL trong env", không phải liveness.
- Thực tế `COMFYUI_URL=http://127.0.0.1:8188` **không có process nào listen** (curl + lsof đều trống).
- Submit thử tier 2 → `{"error":"fetch failed"}` (HTTP 502).
- Ghi chú: theo giới hạn đã biết, Mac 16GB không kham nổi model nặng local — fallback này chỉ sống khi máy render RTX bật ComfyUI.

## Đánh giá
- **Chất lượng render: N/A** (0 ảnh output) — chưa đánh giá được ★ hay độ giữ hình học clay.
- **Pipeline code: PASS** — auth chặn anonymous đúng, task/tier validate đúng, resolve `clay2render`+tier 4 → `fal-ai/flux-pro/v1/depth` đúng thiết kế, error message của fal được relay nguyên văn về client (dễ chẩn đoán).
- **Lỗ hổng nhỏ phát hiện:** `/api/health` trả `comfyui: true` khi server ComfyUI chết → UI có thể gợi ý fallback không tồn tại. Nên probe liveness thật (đã có tiền lệ `probeFal`).

## Để chạy lại demo (khi provider sống)
1. Nạp balance fal (fal.ai/dashboard/billing) — FLUX Pro Depth ~$0.05/ảnh × 2 case, HOẶC bật ComfyUI trên máy RTX rồi đổi `tier: 4 → 2` trong script.
2. `cd interiorflow-wt-clay2img-audit && npm run dev -- -p 3014`
3. `curl -c /tmp/if-demo.jar -X POST http://127.0.0.1:3014/api/auth/login -H 'Content-Type: application/json' -d '{"identifier":"demo@if.local","password":"demo1234"}'`
4. `node docs/DEMO-CLAY-2407/run-demo.mjs`

File thô: `run-results.json` (kết quả máy đọc được của lần chạy này).
