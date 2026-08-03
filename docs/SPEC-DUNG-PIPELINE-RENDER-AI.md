# BẢN ĐỒ PIPELINE RENDER AI — prompt đi đâu · ảnh về đâu · credit trừ chỗ nào

> **COWORK-DỰNG · 04/08/2026.** Không phải spec tính năng mới — đây là **NỀN tra cứu** cho mọi
> phiếu sau chạm tới render AI (đúng yêu cầu: "làm nền cho mọi phiếu sau nên PHẢI trích dẫn
> file:dòng thật, không mô tả chung chung"). Mọi dòng dưới đây đọc trực tiếp từ code 04/08, không
> suy đoán — chỗ nào chưa đọc đủ sâu ghi rõ "chưa verify".

---

## §1 · SƠ ĐỒ TỔNG (1 lượt chạy 1 node AI)

```
Người dùng bấm ▶ trên node (hoặc "Run flow")
  └─ runNode()/runFlow()  ................................ lib/execution.ts:289,305
       └─ topo-sort → enqueueRun() → drainQueue() → executeRun()
            └─ execNode(nodeId)  ......................... lib/execution.ts:76-175
                 ├─ 1. Gom input từ edge upstream (đọc node.data.run.outputs của node nguồn)
                 ├─ 2. Hash input+params — trùng lần chạy trước (status done + cùng hash) → SKIP, không trừ credit
                 ├─ 3. TRỪ CREDIT (xem §4) — TRƯỚC khi gọi AI thật
                 ├─ 4. def.execute(ctx)  ................... NodeDefinition.execute() — build prompt (xem §2)
                 │        └─ aiImage()/aiImages()/aiVideo()  lib/nodes/registry.ts:73-162 (helper dùng chung)
                 │             HOẶC gọi thẳng runImageJob()   lib/nodes/defs/render-v2.ts (bộ node V2)
                 │                  └─ runImageJob()  ........ lib/ai/client.ts:39-94
                 │                       ├─ POST /api/jobs  ... app/api/jobs/route.ts (submit)
                 │                       │     └─ resolveModel() → submitJob(provider, model, input)
                 │                       │           └─ lib/ai/providers/index.ts:21-25 → fal.ts/comfyui.ts/sd.ts
                 │                       └─ poll GET /api/jobs/[id]  app/api/jobs/[id]/route.ts (mỗi 1.5s)
                 │                             └─ jobStatus() → provider trả mediaUrls (xem §3)
                 ├─ 5. done → store.setRunState(outputs) — ẢNH VỀ ĐÂU: chỉ vào Zustand client, xem §3
                 └─ 6. lỗi → friendlyAiError() dịch lỗi + HOÀN CREDIT (xem §4)
```

---

## §2 · "PROMPT ĐI ĐÂU" — nơi build + nơi rời khỏi app

### 2.1 · Build prompt — trong `execute()` của từng `NodeDefinition`
Mỗi node tự ghép prompt từ input/param TRƯỚC khi gọi AI — không có 1 "prompt builder" trung tâm.
Ví dụ cụ thể (file:hàm):
- `lib/nodes/registry.ts:183-186` `stylePrompt(style, extra)` — template chung "…interior design,
  photorealistic interior render, natural light, high detail, professional architectural photography".
- `lib/nodes/registry.ts:174-180` hằng `RENDER_NEGATIVE` — negative prompt CHUNG chống lỗi hình học
  (nhân đôi đồ, chân ghế gãy, phòng lồng phòng…) — dùng lại ở hầu hết node `ai.*` sinh ảnh.
- `lib/nodes/registry.ts:17-25` `guRenderPrompt()`/`withGu()` — kéo "gu" người dùng từ thư viện
  Reference (`fetchGuProfile(['ref-render'])`, `lib/gu`) nhồi thêm vào cuối prompt, thư viện trống
  → chuỗi rỗng, không phá prompt.
- Node V2 (`lib/nodes/defs/render-v2.ts`) build prompt tương tự nhưng thêm nhánh riêng: `ai.text2image`
  (dòng 137-197) ghép `base + cam?.prompt (từ node three.camera) + gu + hậu tố photoreal cố định`.

### 2.2 · Rời khỏi app — 2 con đường
1. **Qua `/api/jobs`** (đa số node `ai.*`): `lib/ai/client.ts:39-53` — `runImageJob()` POST
   `{task, input, tier, engine}` lên `/api/jobs`. Route `app/api/jobs/route.ts:34-55` gọi
   `resolveModel(task, tier, engine)` (`lib/ai/tiers.ts:112-137`) để tra **model id thật** từ bảng
   `AI_TASKS` (`lib/ai/models.ts:22-127` — vd `sketch2render.falModel = 'fal-ai/flux-pro/v1/canny'`)
   rồi `submitJob(provider, model, input)` → `lib/ai/providers/index.ts:21-25` dispatch theo
   `provider` ('fal' | 'comfyui' | 'sd') → `lib/ai/providers/fal.ts:42-51` (`fal.queue.submit()`,
   SDK `@fal-ai/client`) — **CHỈ chạy phía server** (route handler), key `FAL_KEY` không lộ ra client.
2. **Qua `/api/render/nvidia-image`** (chỉ node `ai.text2image`, tầng AI-1 trước khi rơi xuống
   `/api/jobs`): `app/api/render/nvidia-image/route.ts` — gọi NVIDIA NIM free tier
   (`lib/ai/providers/nvidia.ts`, **chưa đọc sâu file này — chưa verify chi tiết**), 503 nếu chưa
   cấu hình `NVIDIA_API_KEY` → node tự rơi xuống tầng kế (`/api/jobs`) hoặc tầng lõi tất định.
3. **Qua `/api/render/premium`** (RIÊNG, chỉ node `render.compare`): xem §5.2 — đường khác hẳn,
   không qua `execNode()`/`/api/jobs`.

**Ảnh input** (khi node cần `image_url`/`control_image_url`): `lib/ai/client.ts:25-32`
`absolutizeInput()` biến URL tương đối (`/demo/…`, `/uploads/…`) thành URL tuyệt đối TRƯỚC khi
submit — vì provider fetch ảnh phía SERVER, không hiểu path tương đối của Next app. Ảnh dạng
`data:` URI được `lib/ai/providers/fal.ts:21-33` `resolveDataUris()` upload lên `fal.storage`
(đổi thành URL fal) trước khi submit job — provider fal không nhận base64 trực tiếp trong input.

---

## §3 · "ẢNH VỀ ĐÂU" — theo dõi từ lúc provider trả kết quả tới lúc người dùng thấy

1. Provider hoàn tất → `lib/ai/providers/fal.ts:126-145` `jobStatus()` gọi `fal.queue.result()`,
   trích `imageUrls()`/`videoUrls()` từ payload — kết quả là **URL trên CDN của fal**
   (`fal.media/files/...`), KHÔNG phải file tải về server IF.
2. `lib/ai/client.ts:83-88` — client poll thấy `status:'COMPLETED'` → trả mảng URL cho node.
3. `def.execute()` gói URL vào `PortValue {dataType:'image'|'video', value: url}`.
4. `lib/execution.ts:151` `store.setRunState(nodeId, {status:'done', outputs, ...})` — **đây là
   toàn bộ vòng đời lưu trữ mặc định**: ảnh chỉ tồn tại như 1 URL tham chiếu trong **Zustand
   client-side store** (`useFlowStore`, RAM trình duyệt + autosave nếu có, KHÔNG phải DB server).
5. **KHÔNG có bước "tải ảnh về app" tự động** — ảnh vẫn nằm trên CDN của fal (hoặc là `data:` URI
   nhúng thẳng nếu là tầng NVIDIA/mock/lõi tất định — các tầng này trả base64 trực tiếp, không qua CDN).
6. Muốn giữ lại: người dùng phải NỐI output vào node `out.gallery`
   (`lib/nodes/registry.ts:984-1001`) → `saveToGallery()` (`lib/gallery.ts:22-39`) → ghi vào
   **`localStorage` key `interiorflow.gallery.v1`** (tối đa 200 mục, tự cắt bớt) — **không phải
   server/DB**. Comment gốc trong `GalleryItem`/`lib/gallery.ts` không nói thẳng nhưng
   `SO-KIEM-TONG.md`/ghi chú khác trong repo xác nhận đây là giai đoạn tạm — "bản DB/project sẽ
   vào ở Phase 3" (nguyên văn còn thấy ở comment `out.gallery` node, `registry.ts:987`).

**Hệ quả cần biết cho mọi phiếu sau**: (a) refresh trang KHÔNG mất ảnh NẾU store có autosave —
**chưa verify autosave có bao gồm `outputs` hay không, cần grep `lib/store.ts` riêng nếu phiếu sau
cần chắc chắn**; (b) URL fal CDN có thể hết hạn/bị xoá theo chính sách fal — **chưa verify TTL**,
rủi ro với ảnh không kịp lưu Gallery; (c) 2 người dùng khác trình duyệt KHÔNG thấy chung Gallery
(localStorage theo máy, không theo tài khoản).

---

## §4 · "CREDIT TRỪ CHỖ NÀO" — 2 cơ chế song song, đọc kỹ tránh nhầm

### 4.1 · Đường CHÍNH — qua `execNode()` (mọi node `ai.*`/`slide.*` trong registry)
`lib/execution.ts:107-137`:
- **Trừ TRƯỚC khi gọi AI thật** (mô hình "trừ trước, hoàn khi lỗi", KHÔNG phải "trừ khi xong").
- Đã đăng nhập (`store.user` có) → POST `/api/credits` `{action:'spend', amount:def.creditCost,
  reason:def.title, jobRef:job.id}` → `app/api/credits/route.ts:18-29` → **trừ nguyên tử**
  `prisma.user.updateMany({where:{id, credits:{gte:amt}}, data:{credits:{decrement:amt}}})` (chỉ
  trừ nếu đủ số dư, tránh âm) + ghi `CreditTransaction` (amount âm).
- CHƯA đăng nhập → `lib/execution.ts:130-136` trừ CỤC BỘ trong Zustand (`store.spendCredits()`) —
  **không bền, mất khi refresh/đổi máy**, không có bản ghi `CreditTransaction`.
- Lỗi trong `def.execute()` → catch ở `lib/execution.ts:154-173` → **hoàn credit**: đã đăng nhập
  POST `/api/credits {action:'refund', ...}`; chưa đăng nhập → cộng thẳng vào state Zustand.
- `lib/server/credits.ts` (`spendCredits()`/`refundCredits()` dòng 10-42) là **helper dùng chung**
  cho route `/api/credits` VÀ route `/api/render/premium` (§4.2) — cùng cơ chế atomic
  `updateMany` + ghi `CreditTransaction`, tránh viết 2 lần logic trừ tiền.

### 4.2 · Đường RIÊNG — `render.compare` node (SO SÁNH 4 MODEL) KHÔNG qua `execNode()` credit flow
`lib/nodes/defs/compare-models.ts:69` — `creditCost: 0` **CỐ Ý** (comment dòng 67-68: "Kế toán ở
SERVER... creditCost client để 0 tránh trừ đúp, và curl thẳng route cũng không thoát phí"). Thay
vào đó:
- `execute()` gọi `renderOne()` → `fetch('/api/render/premium', ...)` **4 lần** (1 lần/model —
  `DEFAULT_COMPARE`, `lib/ai/premium-models.ts` — chưa đọc sâu danh sách 4 model, chỉ biết qua
  comment "FLUX Pro · SD3.5 · Ideogram · Recraft").
- `app/api/render/premium/route.ts:41` — MỖI lần gọi tự trừ `PREMIUM_RENDER_COST = 4` credit
  (dòng 8) qua `spendCredits()` TRỰC TIẾP (không qua HTTP `/api/credits`, gọi thẳng hàm) — nghĩa là
  1 lượt "So sánh model" tốn **tối đa 16 credit** (4 model × 4cr) nếu cả 4 render thật.
- fal chưa cấu hình (`falConfigured()` false) → trả `placeholder()` (SVG mock có nhãn) **KHÔNG
  tính credit** (dòng 37: "không gọi fal → không tính credit").
- Timeout 120s hoặc job FAILED → `refundThenMock()` (dòng 45-48) hoàn credit rồi trả placeholder —
  người dùng KHÔNG mất tiền cho model lỗi, vẫn thấy đủ 4 ô (có ô là mock).

→ **Lý do 2 đường**: node Compare gọi 4 model = 4 lượt tính phí ĐỘC LẬP trong CÙNG 1 lần chạy
node — kiến trúc `execNode()` chỉ trừ 1 `creditCost` tĩnh/node nên không mô tả được ca này, phải
kế toán tại server theo từng cuộc gọi con.

### 4.3 · Bảng node × AI task × credit (trích, đủ để tra nhanh — không phải toàn bộ ~30 node)
| Node (`type`) | File:dòng | AI task (`lib/ai/models.ts`) | `creditCost` |
|---|---|---|---|
| `ai.sketch2render` | `registry.ts:289-326` | `sketch2render` | 4 |
| `ai.clay2render` | `registry.ts:328-366` | `clay2render` | 4 |
| `ai.emptystaging` | `registry.ts:368-395` | `staging` | 3 |
| `ai.styletransfer` | `registry.ts:397-423` | `styleTransfer` | 3 |
| `ai.moodboard` | `registry.ts:425-447` | `moodboard` (×4 ảnh, 1 lần trừ) | 2 |
| `ai.exterior` | `registry.ts:449-485` | `exterior` | 4 |
| `ai.image2video`/`image2videoMaster` | `registry.ts:487-529` | `image2video`/`image2videoMaster` | 8 |
| `ai.text2video` | `registry.ts:531-558` | `text2video` | 8 |
| `ai.materialswap` | `registry.ts:562-594` | `materialSwap` | 4 |
| `ai.furniture` | `registry.ts:596-628` | `furnitureEdit` | 4 |
| `ai.relight` | `registry.ts:630-662` | `relight` | 3 |
| `ai.upscale` | `registry.ts:664-693` | `upscale` (fallback local passthrough nếu provider chưa sẵn sàng) | 2 |
| `ai.removebg` | `registry.ts:695-709` | `removeBg` | 1 |
| `ai.text2image` (V2) | `render-v2.ts:116-198` | NVIDIA free → `moodboard` (fal fallback) → tầng lõi | 2 |
| `ai.furnitureextract` (V2) | `render-v2.ts:358-422` | `removeBg` (tầng AI) / tầng lõi tách màu nền | 1 |
| `ai.idmask`, `ai.localedit`, `three.camera`, `three.cad2fbx` (V2) | `render-v2.ts` | tầng AI tuỳ chọn (`removeBg`/`materialSwap`) hoặc 100% tất định | 0 |
| `render.compare` | `compare-models.ts:54-89` | 4× `/api/render/premium` (fal trực tiếp theo `PREMIUM_RENDER_COST`) | 0 (client) / lên tới 16 (server, §4.2) |
| `slide.*`, `util.*`, `out.*` (đa số) | `registry.ts` | không gọi AI — xử lý local (canvas/imaging) | 0 |

---

## §5 · 4 MỨC AI TIER — provider resolve theo tier đang chọn

`lib/ai/tiers.ts:24-57` — 4 mức, mỗi mức 1 `provider` cố định (trừ mức 2):

| Tier | Tên | Provider | Ghi chú |
|---|---|---|---|
| 4 | AI Cao | `fal` | model chính (`falModel`), chất lượng tối đa |
| 3 | AI Vừa | `fal` | model rẻ/nhanh nếu task có `falFast`, không thì dùng `falModel` |
| 2 | oneAI | `comfyui` hoặc `sd` (theo `oneAiEngine`: 'flux'→comfyui, 'sd'→sd) | tự-host, 0đ |
| 1 | Không AI | `null` | node AI bị KHOÁ hẳn — `lib/nodes/registry.ts:113-116` throw lỗi rõ ràng, không mock lén |

`resolveModel(task, tier, engine)` (`lib/ai/tiers.ts:112-137`) là điểm DUY NHẤT tra model
id/workflow name — route `/api/jobs` (submit + poll) đều gọi lại đúng hàm này với cùng tham số để
đảm bảo submit và poll luôn trỏ đúng 1 model.

---

## §6 · ĐIỂM YẾU / RỦI RO ĐÃ THẤY KHI SOI CODE (trung thực §0 — không tô hồng)

1. **Gallery chỉ localStorage, không phải kho bền theo tài khoản** (§3.6) — mọi phiếu sau nói
   "lưu ảnh vào dự án" phải biết đây là Phase 3 CHƯA làm, không giả định đã có backend lưu ảnh.
2. **Credit khách (chưa đăng nhập) không bền** — mất khi refresh, không có `CreditTransaction`,
   dễ bị "làm giàu" bằng cách xoá localStorage/mở tab ẩn danh liên tục — **chưa verify** có giới
   hạn nào khác chặn việc này không (vd rate-limit theo IP) — nếu phiếu sau cần bàn về chống lạm
   dụng, đây là lỗ hổng cần nêu trước.
3. **`render.compare` có thể tốn tới 16 credit/lần bấm** — UI hiện tại (`compare-models.ts`
   description dòng 60) đã ghi rõ "16cr đủ 4" trong mô tả node, nhưng CHƯA thấy xác nhận credit
   ước tính TRƯỚC khi chạy (`estimateRunCredit()`, `lib/execution.ts:266-276`) có tính đúng ca 4
   lần trừ ẩn bên trong 1 node hay không — **chưa verify**, `estimateRunCredit()` chỉ cộng
   `def.creditCost` tĩnh (=0 cho node này) nên **nhiều khả năng số hiển thị trước khi chạy bị THIẾU
   16cr thật sẽ tốn** — đáng để phiếu sau kiểm tra kỹ bằng tay trên app thật.
4. **URL ảnh output là URL ngoài (fal CDN)**, không có bước tự tải/lưu bền — dự án dùng ảnh này về
   sau (BOQ, Present, khung tên CAD…) phải tự chịu rủi ro URL hết hạn nếu không sớm lưu Gallery.
5. **Chưa đọc sâu**: `lib/ai/providers/comfyui.ts`, `lib/ai/providers/sd.ts`,
   `lib/ai/providers/nvidia.ts`, `lib/ai/premium-models.ts`, `lib/store.ts` (autosave scope) — bảng
   trên chỉ trích những gì đã đọc trực tiếp; phiếu sau cần chi tiết tier 2/NVIDIA nên đọc thêm các
   file này trước khi spec tiếp, đừng suy đoán từ tên file.
