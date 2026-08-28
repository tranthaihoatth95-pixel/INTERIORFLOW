# NC · Vision Backbone chạy cục bộ — chọn runtime + model

> Agent **VB**, nghiên cứu thi hành chốt `docs/00-CHOT.md:855-860` ("VISION BACKBONE CHẠY CỤC BỘ", entry
> `vision-backbone-cuc-bo` — `scripts/frontier-registry.mjs:267`). Hoà đã chốt CHẠY CỤC BỘ — báo cáo này
> KHÔNG bàn lại quyết định đó, chỉ tìm đường thi hành. Đây là NGHIÊN CỨU THUẦN — không cài gói, không
> sửa code, không chạy git. Mọi khẳng định có nguồn kèm theo; chỗ không tra ra ghi rõ "KHÔNG TÌM ĐƯỢC NGUỒN".

---

## 1 · Tổng quan

**Runtime đề xuất: `onnxruntime-node` gọi trực tiếp (không qua `@huggingface/transformers`), chạy ở main
process.** Model tối thiểu cần **HAI họ, không phải một**: MobileSAM ONNX (mask theo vùng) + CLIP
ViT‑B/32 ONNX bản lượng tử hoá uint8 (gán vật liệu + tìm tương tự bằng chữ, dùng chung một model vì
cùng không gian embedding ảnh↔chữ). Tổng dung lượng trọng số thêm vào bộ cài **~200–215 MB** (chưa tính
binary gốc của `onnxruntime-node`, xem mục D). Giấy phép trọng số của cả hai đều **MIT/Apache‑2.0** —
sạch cho mục đích thương mại, nhưng **cổng `license:check` hiện tại KHÔNG soi trọng số model** (chỉ soi
gói npm) — phải tự kiểm tay và ghi vào `docs/LICENSE-NOTES.md` như đã làm với DWG.
Bẫy lớn nhất: `@huggingface/transformers` mặc định **tải model từ Hugging Face Hub lúc runtime rồi cache**
— nếu dùng thư viện đó mà không cấu hình lại, tính năng "cục bộ" sẽ âm thầm gọi mạng ở lần chạy đầu, trái
tinh thần chốt của Hoà.

---

## 2 · Chi tiết từng mục

### A. Runtime — so 3 đường

| | `onnxruntime-node` | `onnxruntime-web` | `@huggingface/transformers` (v3, gói `@huggingface/transformers`) |
|---|---|---|---|
| Chạy ở đâu | main process (native addon N-API) | renderer (WASM/WebGPU), không cần backend Node | tự chọn: Node → dùng `onnxruntime-node` bên dưới; browser → dùng `onnxruntime-web` bên dưới |
| Giấy phép | **MIT**, copyright Microsoft — [LICENSE](https://github.com/microsoft/onnxruntime/blob/main/LICENSE) | MIT, cùng repo | **Apache-2.0** — [LICENSE](https://github.com/huggingface/transformers.js/blob/main/LICENSE) |
| Node/Electron tối thiểu | Node ≥16 (khuyên ≥20), Electron ≥15 (khuyên ≥28) — IF đang Electron 33/Node 20.18 ⇒ đạt | chạy trong trình duyệt/renderer, không ràng buộc version Node | kế thừa ràng buộc của backend bên dưới |
| Nguồn version | [`js/node/README.md`](https://github.com/microsoft/onnxruntime/blob/main/js/node/README.md) | cùng repo | — |
| Cần binary native? | **CÓ** — file `.node` prebuilt theo platform | KHÔNG — thuần WASM/JS | CÓ khi chạy trong Node (kéo theo `onnxruntime-node`) |
| arm64 mac + win x64 | CoreML EP **chỉ trên macOS x64/arm64**; Windows/Linux dùng CPU EP mặc định (DirectML EP cho Windows GPU **CHƯA KIỂM** — không có nguồn xác nhận `onnxruntime-node` kèm sẵn binary DirectML) — [CoreML EP docs](https://onnxruntime.ai/docs/execution-providers/CoreML-ExecutionProvider.html) | chạy y hệt trên mọi OS vì là JS/WASM thuần — không có lệch mac/win về mặt đóng gói | kế thừa onnxruntime-node trên Node |
| electron-builder cần cấu hình gì | `asarUnpack` phải liệt kê `.node` — vd `"**/*.node"` hoặc `"node_modules/onnxruntime-node/**"`, nếu không app **crash sau khi đóng gói** dù chạy tốt lúc dev — [electron-builder troubleshooting](https://www.electron.build/docs/troubleshooting/), [issue #1285](https://github.com/electron-userland/electron-builder/issues/1285). `smartUnpack` (mặc định bật) có tự phát hiện native module nhưng không đảm bảo 100% — vẫn nên khai tay | không cần cấu hình đặc biệt (chạy như JS thường trong bundle renderer) | thừa hưởng cấu hình của `onnxruntime-node` khi chạy phía Node |
| Cạm bẫy đã biết | (1) ASAR: `.node` không load được từ trong archive → bắt buộc unpack. (2) macOS notarization: mọi binary trong bundle phải được **ký + hardened runtime**, module native hay bị bỏ sót khỏi notarization nếu chưa unpack đúng chỗ trước khi ký — [electron-builder notarization](https://www.electron.build/docs/features/code-signing/notarization/). (3) Cần build riêng cho từng platform đích (IF đã có sẵn 2 lệnh `electron:build:mac` / `electron:build:win` trong `package.json` nên không phải việc mới) | WASM chậm hơn native CoreML đáng kể cho model vừa/lớn; WebGPU EP còn **thử nghiệm** — [Microsoft Open Source blog](https://opensource.microsoft.com/blog/2024/02/29/onnx-runtime-web-unleashes-generative-ai-in-the-browser-using-webgpu/) | mặc định **tải model qua mạng lúc runtime rồi cache cục bộ** — [tài liệu chính thức](https://huggingface.co/docs/transformers.js/en/index) xác nhận "Model weights are downloaded at runtime... No need to bundle models". Có cấu hình trỏ về file cục bộ (`env.localModelPath`, tắt tải mạng) nhưng **CHƯA tự kiểm chứng được API chính xác qua nguồn đã fetch** — trước khi dùng phải đọc kỹ `docs/api/backends/onnx` và test thật |

**Kết luận A:** `onnxruntime-node` là lựa chọn đúng cho phần cần tốc độ + CoreML trên mac (main process
đằng nào cũng đang xử lý `sharp`), `onnxruntime-web` là phương án dự phòng nếu sau này muốn chạy trong
renderer/không muốn đụng vào cấu hình native-module của electron-builder. `@huggingface/transformers`
tiện cho việc prototype nhanh (tự tải model, tự tiền xử lý ảnh/text) nhưng **mặc định trái luật "cục bộ"**
nếu không tự cấu hình lại — dùng nó thì phải tự đảm bảo tắt tải mạng, nên xét ra không rẻ hơn gọi thẳng
`onnxruntime-node`.

### B. Model đề cử theo từng việc

| Việc | Model | Biến thể chính xác | Tham số | Kích thước ONNX (file thật) | Giấy phép TRỌNG SỐ | ONNX công khai | Tốc độ có nguồn |
|---|---|---|---|---|---|---|---|
| ① Mask theo vùng | **MobileSAM** | `mobile_sam_image_encoder.onnx` (TinyViT) + `sam_mask_decoder_single.onnx` (decoder gốc SAM ViT-H, chưng cất) | không tự đo được số tham số từ nguồn đã fetch — **CHƯA KIỂM** | encoder **28.2 MB** + decoder single **16.5 MB** = **44.7 MB** fp32 (bản multi-mask decoder cũng 16.5 MB, thay thế được) — [Acly/MobileSAM](https://huggingface.co/Acly/MobileSAM) | Apache-2.0 ở repo gốc [chaoningzhang/MobileSAM/LICENSE](https://github.com/chaoningzhang/mobilesam/blob/master/LICENSE); bản convert ONNX của Acly ghi **MIT** — cả hai đều lọt cổng `license:check` | Có, tải thẳng — [huggingface.co/Acly/MobileSAM](https://huggingface.co/Acly/MobileSAM) | GPU ~10ms/ảnh (8ms encoder + 4ms decoder); **ARM CPU <300ms/ảnh, RAM <50MB** — [Ultralytics docs](https://docs.ultralytics.com/models/mobile-sam), [Emergent Mind](https://www.emergentmind.com/topics/mobilesam). ⚠️ Không có số đo riêng cho CoreML EP trên M1 Pro hay CPU x64 Windows — **CHƯA KIỂM, cần tự đo** |
| ② Gán id vật liệu (zero-shot qua text prompt "gỗ sồi vân dọc"...) | **CLIP ViT-B/32** (gốc OpenAI) | `vision_model_uint8.onnx` + `text_model_uint8.onnx`, bản convert Xenova cho Transformers.js | kiến trúc công bố ViT-B/32 — số tham số chính xác không tự đếm được từ nguồn đã fetch, **CHƯA KIỂM** | vision **88.6 MB** + text **64.1 MB** (uint8/int8 quantized) = **~152.7 MB**; các mốc khác cùng repo: fp32 gộp 606 MB, fp16 gộp 304 MB, q4f16 gộp ~126 MB — [Xenova/clip-vit-base-patch32/onnx](https://huggingface.co/Xenova/clip-vit-base-patch32/tree/main/onnx) | **MIT** ở model gốc [openai/clip-vit-base-patch32](https://huggingface.co/openai/clip-vit-base-patch32) | Có, tải thẳng — link trên | Tìm được duy nhất benchmark GPU batch=2 (0.2–0.4ms/ảnh, không đại diện CPU đơn ảnh) — [CLIP-ONNX benchmark](https://github.com/Lednik7/CLIP-ONNX/blob/main/benchmark.md). **Số đo CPU/CoreML cho 1 ảnh: KHÔNG TÌM ĐƯỢC NGUỒN** |
| ③ Tìm tương tự (ảnh↔ảnh, ảnh↔chữ) | **CÙNG CLIP ViT-B/32 ở việc ②** — không cần model riêng, vì mục tiêu là so khoảng cách cosine trong cùng không gian embedding ảnh/chữ | — | — | dùng lại 2 file đã tải cho việc ② | MIT | — | — |

**Đối chiếu bị loại (để phiên sau không đề xuất lại):**
- **Apple MobileCLIP/MobileCLIP2** — nhỏ hơn CLIP chuẩn nhiều, có ONNX công khai (`plhery/mobileclip2-onnx`), nhưng **giấy phép là Apple Sample Code License (mã) + Apple ML Research Model Terms of Use (trọng số)** — KHÔNG nằm trong 11 giấy phép được phép của `license:check`, và điều khoản ML Research Terms thường giới hạn mục đích nghiên cứu — [apple/ml-mobileclip](https://github.com/apple/ml-mobileclip). **Không dùng được cho sản phẩm bán ra.**
- **Apple DMS (Dense Material Segmentation)** — đúng bài toán "gán vật liệu" nhất về mặt ngữ nghĩa (46 loại vật liệu, model pretrained 170MB), nhưng **dataset dán nhãn CC-BY-NC 4.0 — cấm dùng thương mại** — [apple/ml-dms-dataset](https://github.com/apple/ml-dms-dataset). Vì license của trọng số ràng theo license của dữ liệu huấn luyện, coi model này là **không dùng được cho sản phẩm bán ra** trừ khi tìm được bản huấn luyện lại trên dữ liệu khác.
- **SAM / SAM2 gốc (Meta)** — Apache-2.0, dùng được về giấy phép — [sam2 LICENSE](https://github.com/facebookresearch/sam2/blob/main/LICENSE) — nhưng nặng hơn MobileSAM hàng chục lần (không đo lại số cụ thể ở đây vì MobileSAM đã đủ đáp ứng, và IF vốn đã gọi SAM2 qua API cho ca cần độ chính xác cao — cục bộ nên ưu tiên bản nhẹ).

### C. Một model có phủ hết cả 3 việc không?

**KHÔNG.** CLIP phủ được ② và ③ vì cả hai đều là bài toán "so khớp trong không gian embedding ảnh/chữ
chung" — cùng 1 cặp file. Nhưng ① (mask theo vùng, tức phân vùng **cấp pixel** với đường biên rõ) là
một họ bài toán khác hẳn: CLIP encoder chỉ ra **một vector cho toàn ảnh** (hoặc patch thô 32×32), không
có đầu ra boundary/mask. Cần tối thiểu **2 họ model**.

**Tổng dung lượng trọng số thêm vào bộ cài** (chỉ tính file `.onnx`, chưa tính binary runtime — xem mục D):
- MobileSAM (việc ①): ~44.7 MB
- CLIP uint8 (việc ② + ③, dùng chung): ~152.7 MB
- **Tổng: ~197 MB**, có thể co xuống ~185 MB nếu chọn bản CLIP `q4f16` (~126 MB gộp) đánh đổi lấy độ
  chính xác thấp hơn — chưa có bằng chứng đo độ chính xác thực tế cho ca "gỗ sồi vân dọc" nên **CHƯA
  KIỂM được mức độ đánh đổi này có chấp nhận được không**.

### D. Cạm bẫy khiến hướng cục bộ thất bại

1. **Kích thước bộ cài** — ~197 MB model (mục C) + binary `onnxruntime-node` (chưa đo được số MB chính
   xác qua npm — trang `npmjs.com/package/onnxruntime-node` trả 403 khi fetch tự động, **CHƯA KIỂM**,
   cần tự `npm install` và đo `du -sh` khi thi công thật). Vì `electron-builder` build riêng theo target
   (`--mac`, `--win`) nên mỗi bản cài chỉ mang binary của platform đó — không cộng dồn cả hai.
2. **Thời gian khởi động** — nếu load cả 2 session ONNX ngay lúc app boot, thời gian mở app sẽ tăng.
   Không có số đo — nên thiết kế lazy-init (chỉ tạo `InferenceSession` khi lần đầu người dùng chạm vào
   tính năng mask/gán-vật-liệu), không init đồng bộ ở màn hình chào.
3. **RAM** — không tìm được số đo tổng khi 2 model cùng chạy trong 1 tiến trình Node (MobileSAM ghi
   "<50MB RAM" nhưng đó là con số của bản thân model đó trên ARM di động, không phải benchmark trong
   Electron main process cùng lúc với CLIP) — **KHÔNG TÌM ĐƯỢC NGUỒN**, phải tự đo trên máy đích.
4. **Khác biệt mac/win** — CoreML EP chỉ có trên mac; trên Windows `onnxruntime-node` mặc định chạy CPU
   EP (chậm hơn, không có tăng tốc phần cứng xác nhận được cho case này — DirectML EP có tồn tại trong
   hệ sinh thái ONNX Runtime nhưng **chưa xác nhận được** nó có sẵn trong gói `onnxruntime-node` mặc định
   hay phải cấu hình build riêng — **CHƯA KIỂM**).
5. **Model tải lúc cài hay nhúng sẵn** — đây là bẫy quan trọng nhất theo đúng tinh thần "cục bộ" của Hoà.
   Nếu dùng `@huggingface/transformers`, mặc định nó **tải model qua mạng ở lần chạy đầu rồi cache**
   ([nguồn](https://huggingface.co/docs/transformers.js/en/index)) — vi phạm ngầm chốt "chạy cục bộ" nếu
   không cấu hình lại. Nếu gọi thẳng `onnxruntime-node`, ta tự quyết định: **tải file `.onnx` một lần lúc
   build/CI, đóng gói qua `extraResources` của electron-builder, nhúng sẵn trong bộ cài** — không phụ
   thuộc mạng lúc người dùng chạy app. Đây là lý do chính chọn đường "gọi thẳng runtime" thay vì qua
   thư viện tiện ích.
6. **Tiền xử lý ảnh** — CLIP cần resize 224×224 + chuẩn hoá theo mean/std ImageNet, MobileSAM cần resize
   theo tỉ lệ dài cạnh 1024px kiểu SAM gốc — cả hai làm được bằng `sharp` đã có sẵn (`sharp: ^0.35.3` —
   `package.json`), không cần thêm thư viện ảnh mới, đúng ràng buộc đã cho.

### E. Đề xuất một đường

**Chọn: gọi thẳng `onnxruntime-node` (MIT) trong main process, KHÔNG qua `@huggingface/transformers`.**
Model: MobileSAM ONNX (Apache-2.0/MIT, ~44.7 MB) cho việc ①; CLIP ViT-B/32 ONNX uint8 (MIT, ~152.7 MB)
cho việc ② và ③. Cả hai nhúng sẵn trong bộ cài qua `extraResources`, tải một lần lúc build/CI — không có
lệnh gọi mạng nào ở runtime của người dùng cuối.

**Vì sao KHÔNG chọn các đường còn lại:**
- **`onnxruntime-web` (WASM/WebGPU trong renderer)** — tránh được hoàn toàn rắc rối `asarUnpack` +
  notarization của binary native, và chạy giống hệt mac/win. Nhưng đánh đổi mất khả năng dùng CoreML EP
  trên M1 Pro (chỉ `onnxruntime-node` có CoreML) — trong khi máy đích chính là M1 Pro, bỏ CoreML là bỏ
  đúng lợi thế phần cứng đang có. Giữ đường này làm **phương án dự phòng cấp 2** nếu native module gây
  quá nhiều sự cố đóng gói trong thực tế.
- **`@huggingface/transformers`** — tiện cho prototype (tự tải, tự tiền xử lý), nhưng vi phạm ngầm luật
  "cục bộ" nếu không tự cấu hình tắt tải mạng (mục D.5), và IF đã có `sharp` để tự viết tiền xử lý — thêm
  một tầng trừu tượng chỉ để đổi lấy sự tiện lợi không cần thiết ở quy mô 2 model.

**Bậc thang v0 nhỏ nhất chứng minh giá trị:** ship **CHỈ CLIP trước** (một model, ~153 MB, phủ được 2/3
việc: gán vật liệu qua text prompt + tìm tương tự bằng chữ) — đây là phần "tìm được bằng CHỮ" mà Hoà nhấn
là lý tưởng nhất trong 3 việc, và đo được ngay giá trị cảm nhận (nhập "gỗ sồi vân dọc" ra đúng ảnh) mà
không phải giải quyết bài toán khó hơn của mask theo pixel. MobileSAM (việc ①, RegionId) thêm sau khi có
ca dùng thật cần đường biên mask chính xác — vì hiện `RegionId` của Grounded Render còn có thể dùng
đường tắt "chiếu entity" (không cần SAM khi ảnh render từ chính scene IF, theo `REVIEW-DONG-BO-CO-CHE`),
nên MobileSAM chỉ thật sự cần cho ảnh KHÔNG có scene gốc (ảnh khách chụp, ảnh tham khảo ngoài).

---

## 3 · Tổng kết lại vấn đề

Hiện trạng đo được: **0 gói ML cục bộ trong `package.json`**, `lib/vision/` là 8 file thị giác cổ điển
(Hough, điểm tụ, hiệu chỉnh camera, match template — không phải học máy), `idmask-core` là median-cut
phân cụm màu tất định, cột `embedding` trong schema là vector CHỮ cho RAG (không phải ảnh) —
[`docs/00-CHOT.md:855`]. Đường thi hành khả thi nhất, có nguồn kiểm chứng đầy đủ, là: runtime
`onnxruntime-node` (MIT, có sẵn CoreML EP cho M1 Pro) + hai model nhẹ giấy phép MIT/Apache-2.0
(MobileSAM cho mask, CLIP cho vật liệu + tìm-bằng-chữ) — tổng ~197 MB trọng số, nhúng sẵn trong bộ cài
để không phá vỡ tinh thần "cục bộ". Không có một model duy nhất làm hết 3 việc vì mask theo pixel và
embedding-so-khớp là hai họ bài toán khác nhau về bản chất kiến trúc.

---

## 4 · Đánh giá khách quan

**Tốt:**
- Cả 2 model đề cử có giấy phép trọng số sạch, có bản ONNX công khai tải thẳng được, không phải tự convert.
- `onnxruntime-node` + CoreML là đường được chính Microsoft công bố hỗ trợ chính thức trên arm64 mac —
  không phải giải pháp lách/hack.
- Kiến trúc phù hợp máy đích (M1 Pro) và không đụng vào `sharp` đã có.

**Chưa tốt / rủi ro:**
- **Không có số đo hiệu năng thật trên máy đích** — mọi con số tốc độ trong báo cáo này là của bên thứ ba
  (GPU, ARM di động, batch GPU), KHÔNG phải CPU/CoreML trên M1 Pro hay Windows x64 thật. Không nên hứa
  SLA (vd "xử lý ảnh <1s") trước khi tự đo.
- **Chưa đo được size binary `onnxruntime-node` thật** — trang npm trả 403 khi fetch tự động, phải tự
  cài thử để biết chính xác cộng thêm bao nhiêu MB vào từng bản build mac/win.
- **DirectML EP cho Windows chưa xác nhận được** — nếu không có, Windows sẽ chạy CPU-only, chênh lệch
  hiệu năng mac/win có thể rất lớn — cần tự benchmark trước khi cam kết trải nghiệm ngang nhau.
- Cổng `license:check` hiện tại **không soi được giấy phép trọng số model** — đây là lỗ hổng quy trình,
  không chỉ riêng vụ này; nên cân nhắc thêm một bước kiểm tay bắt buộc (giống DWG/libredwg) mỗi khi thêm
  model mới, ghi vào `LICENSE-NOTES.md`.

---

## 5 · Hướng xử lý nhiều góc độ

| Hướng | Ưu điểm | Nhược điểm |
|---|---|---|
| **A. `onnxruntime-node` gọi thẳng (đề xuất)** | CoreML M1 Pro, kiểm soát hoàn toàn việc nhúng model cục bộ, không phụ thuộc thêm gói | phải tự viết tiền xử lý (đã có `sharp`), phải tự lo `asarUnpack` + notarization |
| **B. `onnxruntime-web` (renderer, WASM/WebGPU)** | không đụng cấu hình native-module/notarization, chạy y hệt mac/win | mất CoreML — bỏ phí phần cứng M1 Pro đang có, WebGPU còn thử nghiệm |
| **C. `@huggingface/transformers`** | tiện lợi cho prototype nhanh, cộng đồng lớn, API cao cấp có sẵn pipeline `zero-shot-image-classification` | mặc định tải model qua mạng lúc runtime (vi phạm ngầm luật cục bộ nếu không tự sửa), thêm 1 tầng phụ thuộc, license Apache-2.0 (vẫn qua cổng nhưng vẫn là thêm 1 gói phải theo dõi) |
| **D. Không làm cục bộ, tiếp tục 100% gọi API ngoài (giữ nguyên hiện trạng)** | không việc gì phải làm | Hoà đã chốt cục bộ — hướng này KHÔNG hợp lệ, chỉ nêu để đối chiếu, không đề xuất |

---

## 6 · Đề xuất tốt nhất

**Chọn hướng A** — `onnxruntime-node` gọi thẳng + MobileSAM (việc ①) + CLIP ViT-B/32 uint8 (việc ②③) —
vì đây là đường duy nhất khai thác được CoreML trên máy đích M1 Pro (lợi thế phần cứng đã có sẵn, bỏ qua
là lãng phí), giữ đúng tinh thần "cục bộ" tuyệt đối (model nhúng sẵn, 0 gọi mạng runtime — điều mà hướng
C không đảm bảo mặc định), và tái dùng `sharp` sẵn có thay vì kéo thêm tầng trừu tượng của hướng C.
Hướng B (`onnxruntime-web`) giữ làm phương án dự phòng nếu việc đóng gói native module (`asarUnpack` +
notarization) gây sự cố thực tế khi thi công — quyết định chuyển hướng đó nên dựa trên bằng chứng thất
bại thật, không suy đoán trước.

**Bậc thang thi công:** v0 = chỉ CLIP (~153 MB, phủ việc ②③, có giá trị nhìn thấy ngay: tìm vật liệu
bằng chữ) → v1 = thêm MobileSAM (~45 MB) khi có ca thật cần mask pixel không dựa được vào chiếu entity
từ scene IF.

---

## ⚠️ CHƯA CHẮC / CHƯA KIỂM — liệt kê lại để phiên sau không tưởng đã đo

1. Số tham số chính xác của MobileSAM encoder/decoder và của CLIP ViT-B/32 — chưa tự đếm từ file, chỉ
   suy từ kiến trúc công bố.
2. Tốc độ xử lý 1 ảnh thật trên **CPU/CoreML của M1 Pro** và trên **Windows x64** cho cả MobileSAM lẫn
   CLIP — mọi số liệu trong báo cáo là benchmark của bên thứ ba trên phần cứng khác (GPU rời, ARM di động).
3. Kích thước binary `onnxruntime-node` thật theo từng platform (trang npm 403 khi fetch tự động).
4. `onnxruntime-node` có kèm sẵn DirectML EP cho Windows hay chỉ CPU EP mặc định — ảnh hưởng trực tiếp
   đến chênh lệch trải nghiệm mac/win.
5. RAM thực tế khi 2 `InferenceSession` (MobileSAM + CLIP) cùng sống trong 1 tiến trình Electron main.
6. API chính xác của `@huggingface/transformers` để tắt tải mạng và trỏ model cục bộ (`env.localModelPath`
   hay tên khác) — chỉ liên quan nếu sau này đổi ý dùng hướng C.
7. Độ chính xác thực tế của CLIP zero-shot cho từ khoá tiếng Việt/tên vật liệu ngành nội thất ("gỗ sồi
   vân dọc") — CLIP gốc huấn luyện chủ yếu trên text tiếng Anh, cần tự thử nghiệm hoặc dịch prompt.

## HẠN DÙNG KẾT LUẬN

Kết luận trong báo cáo này dựa trên tra cứu web ngày 15–16/08/2026 và **KHÔNG có phép đo thật trên máy
đích**. Coi là hợp lệ để **chọn hướng đi**, nhưng **PHẢI tự đo lại** (tốc độ, RAM, size binary thật) trên
máy M1 Pro thật và một máy Windows x64 thật **trước khi cam kết bất kỳ con số hiệu năng nào** với Hoà hoặc
đưa vào spec chính thức. Nếu `onnxruntime-node`/`@huggingface/transformers` ra major version mới, hoặc
Xenova/Acly cập nhật lại bản ONNX, phải kiểm tra lại link tải + giấy phép trước khi dùng — các link trong
báo cáo trỏ đến snapshot tại thời điểm tra cứu, không đảm bảo còn nguyên trạng về sau.
