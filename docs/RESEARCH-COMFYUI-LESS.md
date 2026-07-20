# NGHIÊN CỨU — Chạy app KHÔNG cần ComfyUI local, vẫn kế thừa hệ sinh thái ComfyUI

> Ngày nghiên cứu: **20/07/2026**. Mọi giá/dịch vụ đã tra web cùng ngày (link + ngày kèm từng mục).
> Phạm vi đọc repo: `lib/ai/tiers.ts` · `lib/ai/models.ts` · `lib/ai/providers/{index,comfyui,sd,fal,nvidia}.ts` · `comfyui/README.md` · 4 file `comfyui/workflows/*.json`. **Không sửa gì trong repo.**

---

## 1. Diễn giải câu hỏi — 3 cách hiểu

| | Cách hiểu | ComfyUI có tồn tại? | Kế thừa extension? |
|---|---|---|---|
| **(a)** | Không cài trên Mac user — ComfyUI chạy **nơi khác** (máy render LAN / VPS GPU), app gọi HTTP | Có, ở xa | ✅ Toàn quyền (tự cài node gì cũng được) |
| **(b)** | Không có ComfyUI **tự quản** ở đâu cả — thuê hạ tầng **serverless bên thứ ba** chạy đúng runtime ComfyUI, nhận workflow JSON | Có, do bên thứ ba vận hành | ✅ Có, mức độ tuỳ dịch vụ (danh sách node cho phép / Dockerfile tự build) |
| **(c)** | Bỏ hẳn runtime ComfyUI — gọi thẳng **model API** (fal/NVIDIA/Replicate model đơn) | Không | ❌ Mất — chỉ mô phỏng lại tính năng |

**Điểm mấu chốt cho kiến trúc hiện tại:** provider `comfyui.ts` đã làm đúng việc mà mọi dịch vụ (b) yêu cầu — nạp **workflow API-format JSON**, bơm tham số theo `_meta.title`, POST đi, poll kết quả. Vì vậy **(a) và (b) gần như CÙNG MỘT giao diện** đối với app:
- (a): `COMFYUI_URL` trỏ máy khác → **không sửa 1 dòng code nào**.
- (b): vẫn gửi đúng cái graph JSON đó, chỉ khác **phong bì HTTP** (endpoint, auth header, chỗ nhét ảnh input base64, shape response). Tức là thêm ~1 provider adapter mỏng (~150–250 dòng, ngang tầm `comfyui.ts`), toàn bộ logic bơm marker `IF_*` **tái dùng nguyên vẹn**.
- (c) là tier dự phòng, đã có sẵn nửa hạ tầng (`fal.ts` + `nvidia.ts`), nhưng không bao giờ thay được (a)/(b) về khả năng "lắp node mới của cộng đồng".

Trả lời ngắn cho chủ dự án: **"không có ComfyUI" khả thi ở cả 3 mức, và mức (b) giữ được ~100% tài sản workflow + extension hiện có với chi phí tích hợp nhỏ.**

---

## 2. Khảo sát dịch vụ chạy ComfyUI serverless/hosted

### Bảng so sánh

| Dịch vụ | Nhận workflow API-JSON? | Custom nodes | Cold start | Giá (tra 20/07/2026) | API | Hạn chế chính |
|---|---|---|---|---|---|---|
| **RunPod serverless** (`worker-comfyui`) | ✅ nguyên bản, field `input.workflow` | ✅ **Dockerfile kế thừa image chuẩn** + `comfy-node-install <tên-registry>`; model bake vào image hoặc Network Volume (volume KHÔNG dùng cho node) | FlashBoot; thực tế vài giây→vài chục giây tuỳ cỡ model trong image | Flex/giờ: 16GB $0.58 · **4090 24GB $1.10** · L4/A5000 $0.69 · L40S 48GB $1.75 · A100 $2.72 · H100 $4.55 — bill theo giây, tính cả thời gian khởi động worker | REST `/run` (async) + `/runsync` + `/health`; ảnh input base64 trong `input.images` (giới hạn 10/20MB); output base64 hoặc S3 | Tự build/duy trì Docker image; lần đầu setup lích kích hơn |
| **Replicate** (`comfyui/any-comfyui-workflow`, tức fofr) | ✅ gửi JSON blob mỗi request | ⚠️ **danh sách đóng 69 pack** (đã kiểm `custom_nodes.json`: CÓ `comfyui_controlnet_aux`, ComfyUI-Advanced-ControlNet, DepthAnythingV2); muốn thêm → mở issue hoặc **fork repo tự deploy** | Model public nóng sẵn phần lớn thời gian; cold start không công bố | **~$0.021/run** trên L40S (≈47 run/$1), chạy điển hình ~22s | REST chuẩn Replicate (predictions, poll/webhook); ảnh input = URL trong JSON, file đơn, hoặc zip/tar | Không tự cài node ngoài danh sách (trừ khi fork); weight phải nằm trong danh sách hỗ trợ |
| **Modal** (ComfyUI trong container) | ✅ tự viết endpoint nhận JSON (ví dụ chính thức dùng comfy-cli) | ✅ toàn quyền: `comfy node install` trong image build; **memory snapshot** kéo cold start xuống ~<3s (không tính load model) | Tốt nhất nhóm nếu tối ưu snapshot | Trả theo giây: T4 $0.59/h → B200 $6.25/h; ~L40S/A100 tầm $1.1–2.5/h; có credit free hàng tháng gói Starter | Endpoint HTTPS tự định nghĩa (Python) | Phải viết/duy trì một app Python Modal (~100 dòng); thêm 1 ngôn ngữ hạ tầng |
| **fal.ai** (nền tảng app đã có provider) | ⚠️ 2 đường: (1) endpoint chạy workflow ComfyUI (`fal-ai/comfy-server` / comfy.new — runtime ComfyUI serverless họ tự dựng); (2) **fal serverless tự deploy app ComfyUI** (tutorial chính thức) | (1): bộ node fal hỗ trợ, không cam kết cài tuỳ ý; (2): ✅ toàn quyền vì mình dựng container | (2) tự tối ưu qua `/data` volume + `keep_alive` | Compute serverless: H100 $3.99/h (thoả thuận ~$1.89) · RTX PRO 6000 96GB $2.99/h; model-API tính theo ảnh (như hiện tại) | (1) `fal.run/fal-ai/comfy-server`; (2) endpoint riêng qua fal SDK — **tái dùng key + hạ tầng fal.ts sẵn có** | Tài khoản đang hết balance; đường (1) tài liệu mỏng, cần probe thật khi nạp tiền |
| **Comfy.ICU** | ✅ REST API chạy workflow | ❌ **KHÔNG cho cài node riêng** — nhưng cài sẵn 95+ extension / 4.000+ node / 2.000+ model | Nhanh (hạ tầng chuyên ComfyUI) | Credit: 10.000 = $1; **L4 $0.0009/s · L40S $0.0032/s · H100 $0.0064/s**; gói $10–240/tháng, credit KHÔNG dồn tháng sau | REST API + web UI chia sẻ workflow | Node ngoài bộ cài sẵn = chịu; credit hết hạn |
| **RunComfy serverless** | ✅ deploy workflow → endpoint | ✅ (môi trường ComfyUI đầy đủ) | Bill từ lúc "wake up" (tính cả cold start) | Máy Medium $0.99/h → 3X-Large $8.75/h, bill theo giây; Pro sub giảm 20–30% | REST theo deployment | Giá/giờ cao hơn RunPod cùng cỡ GPU |
| **Comfy Cloud** (chính chủ comfy.org) | ✅ chạy workflow + có API (giới hạn theo gói) | ⚠️ đang mở rộng dần theo nhu cầu; import LoRA từ gói Creator | n/a (cloud thường trực) | $20/$35/$100/tháng theo credit; GPU RTX 6000 Pro Blackwell 96GB | Có API, rate limit theo gói | Mô hình subscription-credit, không thuần pay-per-use; API còn mới |
| **ComfyDeploy** | — | — | — | **LOẠI: ngừng nhận khách mới, đã open-source toàn bộ nền tảng (thông báo founder 2025)** | — | Chỉ còn đường tự-host bản open-source |

Nguồn (truy cập 20/07/2026):
- RunPod: github.com/runpod-workers/worker-comfyui · docs (customization.md — Dockerfile + `comfy-node-install`) · runpod.io/pricing · docs.runpod.io/serverless/pricing (bill từ lúc worker start, làm tròn lên giây)
- Replicate: replicate.com/comfyui/any-comfyui-workflow ($0.021/run, L40S, ~22s) · github.com/replicate/cog-comfyui (fork để tự thêm node) · raw custom_nodes.json (69 pack — tự tải về kiểm)
- Modal: modal.com/docs/examples/comfyapp · tolgaoguz.dev/post/comfy-workflow-api-with-modal (cold start <3s bằng memory snapshot) · blaxel.ai/blog/modal-pricing-alternatives-guide (T4 $0.59/h → B200 $6.25/h)
- fal: blog.fal.ai/stable-diffusion-3-on-fal-comfyui-workflows-and-more (comfy-server, comfy.new) · fal.ai/docs/serverless/tutorials/deploy-comfyui-server · fal.ai/pricing
- Comfy.ICU: comfy.icu/pricing · comfy.icu/docs/api
- RunComfy: docs.runcomfy.com/serverless/about-billing · runcomfy.com/pricing
- Comfy Cloud: comfy.org/cloud/pricing
- ComfyDeploy: x.com/BennyKokMusic/status/1968325785158394089 · github.com/comfy-deploy/comfydeploy

### Khuyến nghị
- **Chính: RunPod serverless (`worker-comfyui`).** Lý do: nhận đúng API-format JSON app đang phát (khoảng cách tích hợp nhỏ nhất), custom node cài tuỳ ý bằng 1 dòng Dockerfile, GPU 24GB flex $0.69–1.10/h → **~$0.006–0.01/ảnh SDXL**, rẻ nhất nhóm cho tải "vài chục ảnh/ngày" vì scale-to-zero.
- **Dự phòng: Replicate `any-comfyui-workflow`.** Zero-ops tuyệt đối (không Docker, không quản endpoint), 4 workflow hiện tại nằm **trọn trong** danh sách node hỗ trợ (xem §5), giá cố định dễ đoán ~$0.021/ảnh. Nhược: không cài node lạ → khi Gu Engine cần node độc, phải quay về RunPod/fork.
- fal-comfy để **probe thêm** khi nạp balance (nếu chạy tốt thì hấp dẫn vì gom 1 nhà cung cấp, 1 key, 1 SDK) — hiện "chưa xác minh" mức hỗ trợ custom node của endpoint managed.

---

## 3. Phương án LAN — ComfyUI trên máy render công ty (kế hoạch cũ, đánh giá lại)

Windows RTX ≥16GB chạy ComfyUI, Mac đặt `COMFYUI_URL=http://<ip-máy-render>:8188`. Code hiện tại chạy được **ngay hôm nay, 0 công tích hợp**.

**Ưu:** 0đ/ảnh · extension cài tuỳ thích (cả node "bẩn" chưa audit) · bản vẽ khách **không rời văn phòng** (đúng tinh thần STRATEGY tier-2) · FLUX dev fp8 chạy được trên 16GB VRAM (comfyui/README §5).

**Nhược — nói thẳng:**
1. **Máy phải bật** + có người bảo trì (update ComfyUI, driver, dependency của node pack — chính README đã ghi vụ "thiếu 1 gói Python là cả pack đăng ký 0 node").
2. **Ra khỏi văn phòng là mù**, trừ khi tunnel — và tunnel công cộng (localtunnel) cho ComfyUI là **tự sát an ninh** (xem dưới).
3. Cạnh tranh tài nguyên: máy đó còn là máy render 3ds Max/D5 — job AI và job render giẫm nhau VRAM.
4. Đơn điểm hỏng: 1 máy chết = tier 2 chết (đây chính là lý do cần failover §6).

**An toàn — bắt buộc nếu muốn dùng ngoài LAN:**
- ComfyUI **KHÔNG có auth built-in** (xác nhận tới v0.21.0), và custom node = thực thi mã tuỳ ý by design → lộ port 8188 ra internet là giao máy cho người lạ. KHÔNG port-forward, KHÔNG localtunnel công khai.
- Chuẩn khuyến nghị 2026: **bind 127.0.0.1** (không `--listen 0.0.0.0` trần) + **Tailscale** (mesh VPN, free 3 user — đủ cho studio) + reverse proxy **Caddy basicauth** phía trước. Mac ở nhà vẫn gọi được qua IP tailnet, dữ liệu đi WireGuard mã hoá. Nguồn: dev.to/jovan_chan…/comfyui-on-linux-production-setup-in-2026 · github.com/Comfy-Org/ComfyUI-Manager/discussions/2729 (truy cập 20/07/2026).
- Trong LAN thuần văn phòng: `--listen <ip-LAN>` + firewall Windows giới hạn subnet là chấp nhận được.
- Với app: `COMFYUI_URL` chịu được dạng `http://100.x.y.z:8188` (Tailscale IP) — không cần sửa code; nếu thêm basicauth thì cần vá nhỏ `comfyui.ts` (thêm header Authorization từ env, ~5 dòng).

**Kết luận §3:** giữ làm **nguồn ưu tiên số 1 của tier 2** (rẻ nhất, kín nhất), nhưng KHÔNG còn là nguồn duy nhất — serverless (§2) là lưới đỡ khi máy tắt/bận/hỏng.

---

## 4. Tier dự phòng model-API: NVIDIA (key đã có, probe 200) + fal

Không chạy được extension ComfyUI — nhưng phủ được bao nhiêu trong 4 workflow?

| Workflow hiện có | Bản chất | NVIDIA NIM (`ai.api.nvidia.com`) | fal model-API (đã có trong `models.ts`) |
|---|---|---|---|
| `text2img` | SDXL text→image | ✅ `black-forest-labs/flux.1-dev` mode `base` — **đã probe 200 bằng key user (ghi chú trong nvidia.ts, 15/07)** | ✅ `fal-ai/flux/schnell` (đang là falModel của moodboard) |
| `sketch_canny` | SDXL + ControlNet canny | ✅ flux.1-dev **mode `canny`** — schema chính thức nhận `image` base64 + `preprocess_image: true` (server tự trích canny) | ✅ `fal-ai/flux-pro/v1/canny` (đang dùng ở tier 4) |
| `sketch_flux` | FLUX + ControlNet Union canny | ✅ như trên (cùng model gốc FLUX.1-dev) | ✅ như trên |
| `clay_depth` | SDXL + DepthAnythingV2 + ControlNet depth | ✅ flux.1-dev **mode `depth`** — NVIDIA dùng đúng **Depth-Anything** phía server để trích depth map → thay được luôn node custom DepthAnythingV2Preprocessor | ✅ `fal-ai/flux-pro/v1/depth` (đang dùng ở tier 4) |

Nguồn: docs.api.nvidia.com/nim/reference/black-forest-labs-flux_1-dev (schema `mode: base|canny|depth`, `image`, `preprocess_image`; biến thể base/canny/depth) — truy cập 20/07/2026.

**Kết luận §4: độ phủ 4/4.** Nghĩa là ngay cả khi KHÔNG có bất kỳ ComfyUI nào sống, app vẫn render đủ 4 task lõi qua NVIDIA (free tier, key sẵn) hoặc fal (khi nạp balance). Cái mất là: không tuỳ biến graph (không nhét LoRA gu riêng, không IPAdapter, không node cộng đồng), chất lượng/tham số bị đóng khung theo endpoint. Việc code: `nvidia.ts` đã có `generateImage()` với mode + fetch ảnh — **mở rộng nhận `image` input cho mode canny/depth là vá nhỏ (~30–50 dòng)**, chưa phải viết provider mới. Lưu ý free tier NVIDIA có rate-limit (cơ chế `NvidiaFreeExhausted` "CHỈ BÁO, KHÔNG tự tụt" đã có sẵn — giữ nguyên triết lý này).

---

## 5. Độ tương thích 4 workflow hiện có (đã đọc từng file)

| Workflow | `class_type` (đủ) | Core / Custom |
|---|---|---|
| `text2img` | CheckpointLoaderSimple · CLIPTextEncode ×2 · EmptyLatentImage · KSampler · VAEDecode · SaveImage | **100% core** |
| `sketch_canny` | + LoadImage · ImageScale · **Canny** · ControlNetLoader · ControlNetApplyAdvanced | **100% core** (Canny là node core) |
| `sketch_flux` | UNETLoader · DualCLIPLoader · VAELoader · CLIPTextEncode ×2 · FluxGuidance · LoadImage · ControlNetLoader · **SetUnionControlNetType** · ControlNetApplyAdvanced · EmptySD3LatentImage · KSampler · VAEDecode · SaveImage | **100% core** (FluxGuidance, SetUnionControlNetType đều thuộc ComfyUI core) |
| `clay_depth` | như sketch_canny nhưng thay Canny bằng **`DepthAnythingV2Preprocessor`** | ⚠️ **1 node custom duy nhất** — thuộc pack `comfyui_controlnet_aux` (Fannovel16) |

**Đối chiếu dịch vụ:**
- **Replicate any-comfyui-workflow:** `custom_nodes.json` (tự tải kiểm 20/07/2026) chứa `Fannovel16/comfyui_controlnet_aux` VÀ `kijai/ComfyUI-DepthAnythingV2` → **cả 4 workflow chạy được không cần xin thêm gì**, miễn là các weight (sd_xl_base, controlnet-depth-sdxl, flux1-dev, controlnet union) nằm trong danh sách weight hỗ trợ của họ — danh sách weight cần đối chiếu chính xác tên file lúc tích hợp (chưa xác minh từng tên file một).
- **RunPod worker-comfyui:** base image có sẵn node core; thêm 1 dòng `RUN comfy-node-install comfyui_controlnet_aux` + `comfy model download` cho 4 checkpoint/controlnet → **4/4 chạy**.
- **Comfy.ICU:** 95+ extension cài sẵn gần như chắc chắn gồm controlnet_aux (pack phổ biến nhất nhì hệ sinh thái) — **chưa xác minh danh sách cụ thể**, cần thử 1 job trước khi chốt.
- **Modal / fal tự-deploy:** tự cài → 4/4 chạy.
- Điểm khoá chung: cơ chế marker `_meta.title` của app là **thuần dữ liệu trong JSON** — mọi dịch vụ nhận nguyên graph đều giữ nguyên marker, logic bơm tham số không đổi.

---

## 6. Khuyến nghị kiến trúc cuối

### Tier 2 "oneAI" mở rộng thành chuỗi 3 nguồn cùng chạy workflow ComfyUI

```
Tier 2 = oneAI
  ├─ 2a. LAN ComfyUI        (COMFYUI_URL)          — 0đ, kín, ưu tiên 1
  ├─ 2b. Serverless ComfyUI (RUNPOD_ENDPOINT_ID)   — chạy CÙNG workflow JSON, ưu tiên 2
  └─ 2c. Model-API fallback (NVIDIA_API_KEY / fal) — mất extension, ưu tiên 3
```

- **2a/2b dùng chung 100% template + logic bơm marker** — chỉ khác lớp transport. Đề xuất tách `comfyui.ts` thành: `graph-inject.ts` (nạp template + bơm `IF_*`, thuần logic, test được offline) + 2 transport (`comfyui-local.ts` giữ nguyên, `comfyui-runpod.ts` mới: bọc graph vào `{input:{workflow, images:[...base64]}}`, gọi `/run`, poll `/status`). Interface `submitJob/jobStatus` **không đổi** → `providers/index.ts` chỉ thêm 1 nhánh dispatch + 1 giá trị `ProviderName`.
- **Chọn tay hay tự failover?** Theo triết lý đã chốt trong `nvidia.ts` ("CHỈ BÁO, KHÔNG tự tụt"): **failover trong nội bộ 2a→2b nên TỰ ĐỘNG** (cùng chất lượng, cùng workflow, khác mỗi chỗ chạy — user không cần biết; chỉ hiện badge "LAN"/"cloud" để minh bạch), nhưng **tụt xuống 2c phải HỎI/BÁO** vì chất lượng và hành vi đổi (mất LoRA/node riêng). Probe rẻ: `GET {COMFYUI_URL}/queue` timeout 2s → chết thì sang 2b.
- **Ước lượng công:** refactor tách graph-inject ~0.5 ngày · provider RunPod ~1 ngày (kèm test mock) · Dockerfile + build image + nạp model lên RunPod ~0.5–1 ngày · env/UI badge + failover probe ~0.5 ngày → **tổng ~2.5–3 ngày công**, không đụng node logic/UI canvas. Phương án Replicate dự phòng: provider tương tự ~1 ngày (API predictions chuẩn, không cần Docker).

### Chi phí vận hành ước tính (studio ~50 ảnh render/ngày, ~22 ngày/tháng ≈ 1.100 ảnh)

| Kịch bản | Đơn giá | Tháng | Ghi chú |
|---|---|---|---|
| 2a LAN là chính (90% ảnh), 2b đỡ 10% | LAN 0đ + RunPod ~$0.01/ảnh | **~$1–3** | + tiền điện máy render; rẻ nhất |
| 2b RunPod 100% (máy LAN nghỉ) | 4090 flex $1.10/h, SDXL+CN ~25–35s/ảnh ⇒ ~$0.008–0.011/ảnh (+cold start lẻ) | **~$10–18** | scale-to-zero, không phí giữ chỗ |
| Replicate 100% | $0.021/run | **~$23** | zero-ops, dễ đoán nhất |
| Comfy.ICU 100% | L4 $0.0009/s ×~40s ≈ $0.036/ảnh | ~$40 + gói tháng | credit hết hạn theo tháng — không hợp tải thấp |
| 2c NVIDIA free | $0 tới khi hết rate-limit | $0 | chỉ là lưới đỡ, không phải kế hoạch chính |

(Thời gian/ảnh là ước tính từ benchmark cộng đồng SDXL+ControlNet trên GPU 24/48GB và con số "~22s điển hình" Replicate công bố; con số thật cần đo lại khi probe.)

### Việc KHÔNG khả thi / cần nói thẳng
- fal-ai/comfy-server managed: tài liệu công khai mỏng, mức hỗ trợ custom node **chưa xác minh** — đừng đặt cược trước khi probe bằng balance thật.
- Comfy.ICU/Comfy Cloud không cho (hoặc chưa chắc cho) cài node tuỳ ý → loại khỏi vai "kế thừa extension dài hạn", chỉ đáng làm phương án chữa cháy.
- ComfyDeploy: loại hẳn (ngừng nhận khách mới).
- WebGPU client-side (runtime 'webgpu' trong tiers.ts) không liên quan nhánh này — Mac 16GB đã chứng minh không kham model lớn local, đừng quay lại hướng đó cho render chất lượng cao.

### Thứ tự hành động đề xuất (chờ duyệt)
1. Dựng Tailscale + Caddy basicauth cho máy render (nửa ngày, không đụng code) → tier 2a dùng được cả khi ra ngoài.
2. Sprint nhỏ 2.5–3 ngày: tách graph-inject + provider RunPod + failover 2a→2b.
3. Vá `nvidia.ts` nhận image input mode canny/depth (~0.5 ngày) → 2c phủ 4/4 task.
4. Khi nạp balance fal: probe fal-comfy 1 buổi; nếu ngon, cân nhắc gộp 2b về fal để giảm số nhà cung cấp.
