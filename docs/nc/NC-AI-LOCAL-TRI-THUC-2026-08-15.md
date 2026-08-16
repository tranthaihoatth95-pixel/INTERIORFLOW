# NC · AI LOCAL ĐỌC TRI THỨC IF + CHỌN MODEL THEO CẤU HÌNH MÁY

> Hoà đặt bài 15/08: *"nghiên cứu thử vụ AI local — có cách nào training AI hoạt động bằng cách
> đọc knowledge, kiến thức nằm ở IF; và cho phép thay model mạnh tuỳ cấu hình máy cài IF khác
> nhau."* Agent AL, phạm vi CHỮ/TRI THỨC/LLM + chọn model theo máy — KHÔNG đụng vision backbone
> (agent VB lo phần đó). Chỉ đọc repo + tra web, không sửa code/cài gói/chạy git.
> **HẠN DÙNG KẾT LUẬN: số đo repo (dòng, bảng DB) đúng tại 16/08/2026. Số liệu model/license/
> benchmark từ web có thể đổi — kiểm lại trước khi build nếu cách bài đặt quá 1-2 tháng.**

---

## 1 · TÓM TẮT (đọc trước, đủ để quyết)

- **"Training" hiểu sai chỗ.** IF không nên "train" (pretrain/full fine-tune) bất cứ gì. Đường
  đúng cho tình trạng dữ liệu hiện tại là **RAG** (đã có hạ tầng, mới thiếu 1 mắt xích) + **học nhẹ
  on-device kiểu perceptron đã sống trong code** (`lib/gu/pairwise-perceptron.ts`). LoRA fine-tune
  là **khả thi kỹ thuật** trên M1 Pro (unified memory, MLX) nhưng **không đáng** với lượng dữ liệu
  IF hiện có: `NotebookChunk` = **0 dòng thật** trong `prisma/dev.db` (đo trực tiếp 16/08), tức
  chưa có nổi 1 tài liệu đã ingest — LoRA cần hàng nghìn cặp instruction-output có nhãn, IF chưa
  có cái nào.
- **Mắt xích hở đã tìm ra hướng đóng.** Embedder hiện tại (`lib/notebook/embed.ts`) gọi CLOUD
  (`nvidia/nv-embedqa-e5-v5`, 1024 chiều) — trái luật local-first, và là **điểm chặn cứng**: RAG
  im hoàn toàn khi mất mạng/hết quota NVIDIA (`NoEmbedProviderError`, không tụt tầng như văn bản).
  Đề xuất: **BGE-M3** qua Ollama (`ollama pull bge-m3`) — 567M tham số, **1024 chiều — TRÙNG số
  chiều NVIDIA hiện dùng** (may mắn, không phải thiết kế), MIT license, 1.2GB, có đo trên
  **VN-MTEB** (benchmark Vietnamese chính thức, ACL 2026 Findings) — bge-m3 đạt 64.90 trên bộ dữ
  liệu Việt. Đổi embedder vẫn cần tính lại toàn bộ vector cũ nếu đổi model (nêu ở §B) — nhưng vì
  `NotebookChunk` đang **0 dòng**, đây là thời điểm RẺ NHẤT để đổi (không có gì phải re-embed).
- **Chọn model theo máy: CHƯA có cơ chế nào** (`grep totalmem/freemem/os.cpus/deviceMemory/vram`
  = 0 hit trong `lib/`+`components/`+`app/`). `resolveOllamaModel()` hiện chỉ nhìn env/danh sách
  đã kéo, không nhìn phần cứng. Đề xuất bậc thang 3 mức RAM (đối chiếu Ollama/LM Studio community
  guideline, không có API chính thức) — xem §C.
- **ThinkDial là TRỤC KHÁC**, không trộn. ThinkDial chọn **độ sâu suy nghĩ** (bao nhiêu engine
  chạy) ở mức TÁC VỤ — làm việc này lúc VÀO CÂU HỎI. Bậc-theo-máy chọn **model nào chạy được** ở
  mức MÁY — làm việc này lúc KHỞI ĐỘNG APP / cấu hình. Hai trục vuông góc: máy yếu vẫn chọn được
  ThinkDial "Nghĩ sâu" (chỉ là chạy chậm hơn/model nhỏ hơn), máy mạnh vẫn có thể set ThinkDial
  "Trả nhanh" (tiết kiệm token dù máy dư sức). Đề xuất: bậc-theo-máy là **tiền tố xác định TẬP
  MODEL khả dụng**, ThinkDial vẫn chọn trong tập đó.
- **v0 làm trong 1 phiên**: thêm hàm `embedTextsTiered()` cùng khuôn `completeTextTiered` (cloud
  NVIDIA → Ollama BGE-M3 → lỗi rõ), route ingest gọi qua đây thay vì gọi thẳng `embed.ts`. KHÔNG
  cần bậc-theo-máy ở v0 (chỉ cần model CHẠY ĐƯỢC, chưa cần tối ưu theo máy).
- **Tra không ra**: dung lượng RAM/VRAM chính xác của các máy KTS thực tế đang cài IF (không có
  kiểm kê phần cứng nào trong repo) — không đo được nhu cầu thật, bậc thang ở §C là suy từ tài
  liệu cộng đồng Ollama/LM Studio, CHƯA verify trên máy thật ngoài M1 Pro của Hoà.

---

## 2 · BẰNG CHỨNG ĐÃ KIỂM (repo, đo trực tiếp 16/08/2026)

### 2.1 · Hạ tầng AI chữ hiện có

| File:dòng | Vai trò |
|---|---|
| `lib/ai/text-tier.ts:48-86` | `completeTextTiered()` — cloud NVIDIA → Ollama local → ném lỗi cho route tự lo lõi tất định. Đã đúng khuôn "tự tụt tầng". |
| `lib/ai/providers/ollama.ts:68-74` | `resolveOllamaModel(available, envModel)` — ưu tiên `OLLAMA_MODEL` env → `llama3:latest` mặc định → model đầu tiên đã kéo. **Không đọc RAM/CPU/GPU** — xác nhận bằng grep: `totalmem|freemem|os.cpus|navigator.hardwareConcurrency|deviceMemory|vram` trong `lib/`+`components/`+`app/` = **0 kết quả**. |
| `lib/ai/providers/ollama.ts:87-100` | `isOllamaAvailable()` — ping `/api/tags`, timeout 2s, không throw — đúng mẫu "tự dò, không mock im lặng". |
| `lib/ai/tiers.ts:11-59` | Có SẴN một trục "núm mức phụ thuộc AI" 4 mức (1 Không AI → 4 AI Cao) — nhưng trục này cho **ẢNH** (fal/comfyui/sd), KHÔNG phải cho chữ/model theo máy. Ghi lại vì đây là tiền lệ UI "núm 4 mức" — mẫu hình để tái dùng, không phải cùng cơ chế. |

### 2.2 · RAG — hạ tầng CÓ, dữ liệu THẬT = 0

| Bảng (`prisma/schema.prisma`) | Đo trực tiếp `prisma/dev.db` (16/08) |
|---|---|
| `ProjectNotebook` (:182 lân cận, xem `NotebookSource.notebook`) | **1 dòng** |
| `NotebookSource` (`schema.prisma:182-199`) | **0 dòng** |
| `NotebookChunk` (`schema.prisma:201-215`, cột `embedding` = JSON `float32[]`) | **0 dòng** |
| `GuModel` (`schema.prisma:328-340`) | **0 dòng** |

Lệnh dùng: `sqlite3 prisma/dev.db "SELECT count(*) FROM NotebookChunk;"` → `0`. (Lưu ý: `.env`
khai `DATABASE_URL="file:/Users/tranben/Downloads/interiorflow/prisma/dev.db"` — có 2 file `dev.db`
trong repo, file ở gốc `./dev.db` là 0 byte/rỗng, file thật là `prisma/dev.db` 36MB.)

⇒ **Pipeline RAG code-complete nhưng CHƯA ai ingest tài liệu nào qua nó.** Đây là bằng chứng trực
tiếp trả lời "dữ liệu IF thực tế đang có bao nhiêu" ở mục A: **0 chunk đã embed**, dù hạ tầng sẵn
sàng nhận.

### 2.3 · Luồng RAG hiện tại — `lib/notebook/rag.ts:1-44` (đọc toàn văn header)

```
1. embedOne(question, 'query')  ← lib/notebook/embed.ts, GỌI CLOUD NVIDIA, không có nhánh Ollama
2. prisma.notebookChunk.findMany({ where: { notebookId } })
3. cosineSimilarity top-k        ← lib/notebook/similarity.ts, thuần Node, ~10ms/5k chunk×1024-dim
4. build prompt (chatSystemPromptFor + context + "trích nguồn [n]")
5. completeTextTiered()          ← ĐÃ tự tụt cloud→Ollama cho phần SINH CHỮ
6. trả { answer, sources, tier, model, mode: 'grounded'|'general' }
```

**Lệch bất đối xứng đã xác nhận bằng đọc code**: bước 5 (sinh chữ) có 2 tầng cloud→local, nhưng
bước 1 (embed câu hỏi) chỉ có 1 tầng — `embed.ts:12` tự khai *"KHÔNG có fallback local ở đây (Ollama
embed model chưa cấu hình chung)"* và `embed.ts:48-50` ném `NoEmbedProviderError` cứng nếu thiếu
`NVIDIA_API_KEY`. Máy không có key + không mạng ⇒ RAG chết hoàn toàn dù Ollama đang chạy ngon cho
phần sinh chữ. Đây CHÍNH LÀ "mắt xích hở" T đã chỉ đúng.

### 2.4 · Mầm học on-device đã sống (`lib/gu/pairwise-perceptron.ts`, đọc toàn văn 183 dòng)

- Thuần TypeScript, 0 GPU, 0 key, cập nhật O(số feature khác 0) — comment tự khai `:9`
  *"Mac 16GB không đổ mồ hôi"*.
- Học **pairwise ranking** từ hành vi Nhận/Bỏ của người dùng (margin update kiểu Perceptron/PA,
  learning-rate 0.05, clamp trọng số ±5 chống drift, degrade về heuristic khi < 10 cặp dữ liệu —
  `pairwise-perceptron.ts:52-57,98-111,118-133`).
- Serialize JSON thuần → `localStorage` hoặc DB (`GuModel.weightsJson`, `schema.prisma:328-340`,
  cache `pairCount` để hiển thị nhanh).
- Đã cắm vào 2 nơi thật: `components/present-editor/LayoutShelf.tsx:24,162-185` (gợi ý bố cục) và
  `components/cad/AiBriefPanel.tsx:37,130-208` (gợi ý layout AI brief) + đồng bộ server qua
  `app/api/gu/[kind]/route.ts` và `lib/gu/gu-model-sync.ts`.
- **Đây KHÔNG phải RAG, không phải fine-tune — là "học nhẹ" đúng nghĩa third-way**: không sửa
  trọng số LLM, chỉ học một hàm điểm tuyến tính bên NGOÀI model, dùng để RANK kết quả LLM/heuristic
  đã sinh ra. Bằng chứng sống rằng "học cục bộ" đã có chỗ đứng trong kiến trúc IF — chỉ là nó học
  **gu xếp hạng**, không học **nội dung kiến thức ngành**.

### 2.5 · Kiến thức nằm ở IF — kiểm kê

| Nguồn tri thức | Dòng/kích thước | Vào RAG chưa? | Chặn gì |
|---|---|---|---|
| `lib/cad/standards/` (11 file luật: `checker.ts`, `neufert.ts`, `vn-fire.ts`, `vn-lighting.ts`, `vn-accessibility.ts`, `vn-electrical.ts`, `vn-residential.ts`, `intl-egress.ts`, `intl-occupant-load.ts`, `iso-drafting.ts`, `registry.ts`) | **3.094 dòng** (đo `wc -l`) | **CHƯA** — đây là code TypeScript (`RuleGroup`/rule object), không phải văn bản tự do; RAG hiện chỉ nuốt `NotebookSource` (pdf/image/text/url/meeting-note, `schema.prisma:186`). Muốn vào RAG phải render rule → câu văn rồi chunk, hoặc dùng thẳng làm structured context (đã có đường riêng: `lib/ai/violations-context.ts`, không qua RAG). | Không bản quyền — code IF tự viết, chỉ thiếu bước "văn bản hoá". |
| `docs/CHUAN-THIET-KE-v7.6-NGUON.md` | 132 dòng | CHƯA (chưa upload qua `NotebookSource`) | Không, chỉ chưa ingest. |
| `neufert.ts` (`standards/neufert.ts:1-19`) | 8.173 dòng file (gồm data + comment) | CHƯA | **CÓ bản quyền** — comment đầu file tự khai nguồn "Neufert Architects' Data / Metric Handbook", chốt 12/08 đã quyết tách: `neufert-tach-goi` (`scripts/frontier-registry.mjs:231`) — *"sách Wiley có bản quyền; app giữ cơ chế RuleGroup, gói nạp qua Kho tri thức/Company DNA Pack; nội bộ dùng tiếp, tách trước khi có người ngoài"*. Trạng thái registry: `trangThai: 'chua'` — **CHƯA LÀM**, vẫn nằm trong repo tại thời điểm 16/08. |
| `GuModel`/Thẻ DNA (`schema.prisma:328-340`) | 0 dòng dữ liệu thật (đo §2.2) | N/A — không phải văn bản, là vector trọng số | Không bản quyền, chỉ chưa có dữ liệu người dùng thật. |
| Sổ chốt (`docs/00-CHOT.md`, `STATUS.md`, `CHANGELOG.md`) + ~370 file `.md` trong `docs/` (32MB) | Lớn nhất về khối lượng | CHƯA — đây chính là "tri thức vận hành build", khác "tri thức ngành nội thất" mà Hoà hỏi, nhưng cùng cơ chế RAG có thể nuốt được nếu muốn Vitals trả lời câu hỏi về chính IF. | Không bản quyền (tài sản nội bộ), chỉ chưa ingest + cần lọc phần nhạy cảm/lỗi thời trước khi cho AI đọc thẳng (nhiều mục 00-CHOT tự ghi "ĐÃ HUỶ"/"lỗi thời" — nuốt thô sẽ dạy AI nói sai). |

**Kết luận §D**: Neufert là nguồn tri thức GIÁ TRỊ NHẤT (nhân trắc học chuẩn ngành, dùng ngay được
cho RAG) nhưng **đang bị khoá bởi bản quyền + việc tách gói CHƯA làm** — nếu build RAG ngành trước
khi tách Neufert, vô tình đóng gói lại y hệt vấn đề `neufert-tach-goi` đã cảnh báo (rule GIỮ trong
app, DATA phải tách). Thứ tự đúng: tách Neufert trước, RAG ngành sau — hoặc RAG chỉ ingest phần
KHÔNG có Neufert trước (TCVN/QCVN thuần Việt Nam, `vn-*.ts`, không dính bản quyền ngoại).

---

## 3 · A · "TRAINING" SAI Ở ĐÂU — BA ĐƯỜNG, ĐƯỜNG NÀO THẮNG

| Đường | Cơ chế | Cần gì | IF có gì | Phù hợp? |
|---|---|---|---|---|
| **① RAG** (Retrieval-Augmented Generation) | Đọc kiến thức LÚC TRẢ LỜI — không sửa trọng số model, chỉ tìm đoạn liên quan rồi nhét vào prompt | Văn bản đã chunk + embed + index; model chữ bất kỳ | **CÓ SẴN pipeline hoàn chỉnh** (`lib/notebook/{chunk,embed,similarity,rag}.ts`) — chỉ thiếu (a) mắt xích embedder local (§B) và (b) NGUỒN đã ingest (0 hiện tại) | ✅ **THẮNG** — đúng bài toán "app đọc kiến thức nằm trong IF", chi phí thấp nhất, đã có hạ tầng 90% |
| **② Fine-tune / LoRA** | DẠY lại trọng số model (một phần, qua adapter rank-thấp) để model tự "nhớ" gu/kiến thức mà không cần nhét prompt mỗi lần | Hàng trăm–hàng nghìn cặp (instruction, output) CÓ NHÃN CHẤT LƯỢNG; máy đủ RAM hợp nhất | **0 cặp dữ liệu có nhãn** (không có tập câu hỏi–trả lời chuẩn về nội thất do IF tự tạo); base model + toolchain (MLX/LoRA) CHƯA có trong repo | ❌ **THUA — không phải vì máy yếu, vì KHÔNG CÓ DỮ LIỆU** để train. Xem số cụ thể bên dưới. |
| **③ Học nhẹ on-device (perceptron)** | Học một hàm điểm NGOÀI model, xếp hạng gợi ý theo hành vi Nhận/Bỏ của người dùng | Cặp (accepted, rejected) từ tương tác thật | **ĐÃ CÓ, ĐANG CHẠY** — `lib/gu/pairwise-perceptron.ts`, cắm ở `LayoutShelf`/`AiBriefPanel` (§2.4) | ✅ Đúng việc của nó (học GU cá nhân/studio), KHÔNG thay được RAG (không học nội dung kiến thức, chỉ học thứ tự ưu tiên) |

**Vì sao "training" là từ sai**: khi Hoà nói "training AI đọc knowledge nằm ở IF", cơ chế đúng là
RAG — model KHÔNG được "dạy lại", nó chỉ được **cho xem tài liệu ngay lúc trả lời câu hỏi cụ thể**,
giống một trợ lý mở sách tra cứu thay vì học thuộc lòng. Fine-tune mới là "training" đúng nghĩa
đen (sửa trọng số) — và đó là đường KHÔNG PHÙ HỢP ở giai đoạn này.

### Số cụ thể — vì sao fine-tune trên máy KTS không đáng (M1 Pro / máy tương đương)

- **Khả thi kỹ thuật, KHÔNG khả thi dữ liệu.** Nguồn: fine-tune LoRA trên Apple Silicon dùng
  **MLX** (thư viện của Apple, tận dụng unified memory — không phân RAM/VRAM riêng như GPU rời).
  Ví dụ đo được: máy M1 16GB fine-tune model ~7B mất **15-20 phút**, đỉnh RAM **13-14GB**; QLoRA
  8B trên máy 16GB mất **~1 giờ**; máy 32GB kham được 14B — [Local LLM Fine-Tuning on Mac (M1 16GB) — Towards Data Science](https://towardsdatascience.com/local-llm-fine-tuning-on-mac-m1-16gb-f59f4f598be7/),
  [Fine-Tuning on Mac: LoRA & QLoRA with MLX — InsiderLLM](https://insiderllm.com/guides/fine-tuning-mac-lora-mlx/).
  Vậy VỀ MẶT THỜI GIAN/PHẦN CỨNG, fine-tune trên M1 Pro **làm được**.
- **Nhưng cái thiếu không phải phần cứng — là bộ dữ liệu huấn luyện.** LoRA/QLoRA đòi cặp
  (instruction, output) đã duyệt chất lượng; IF hiện có 0 cặp như vậy (không có tập Q&A nội thất
  do KTS tự viết/duyệt). Tự chế dữ liệu train bằng cách cho AI tự sinh câu hỏi-trả lời rồi tự
  duyệt là vòng lặp tự huyễn hoặc (model học lại chính lỗi của nó) — không nên làm ở v0/v1.
- **NVIDIA training tốc độ 2-4x nhanh hơn** cho model vừa trong VRAM GPU rời so với M1 Pro theo
  cùng nguồn trên — nhưng đây không phải nút thắt của IF (nút thắt là dữ liệu, không phải tốc độ).
- ⇒ **Kết luận: fine-tune là bất khả KHÔNG PHẢI vì máy yếu, mà vì chưa có gì để train.** Khi nào
  `GuModel`/Thẻ DNA tích luỹ đủ dữ liệu thật (hàng trăm dự án đã duyệt) MỚI đáng cân nhắc — và lúc
  đó đường ② vẫn phải cạnh tranh với việc mở rộng đường ③ (perceptron) trước, vì ③ rẻ hơn nhiều
  bậc và đã có sẵn.

---

## 4 · B · ĐÓNG MẮT XÍCH HỞ — EMBEDDER CỤC BỘ

### Ứng viên: BGE-M3 (BAAI), chạy qua Ollama

| Tiêu chí | Giá trị | Nguồn |
|---|---|---|
| Tên model (Ollama) | `bge-m3` (tag `:latest` = `:567m`) | [ollama.com/library/bge-m3](https://ollama.com/library/bge-m3) |
| Tham số | 567M (kiến trúc XLM-RoBERTa) | ollama.com/library/bge-m3 |
| Dung lượng tải về | **1.2GB** | ollama.com/library/bge-m3 |
| Số chiều vector | **1024** | [huggingface.co/BAAI/bge-m3](https://huggingface.co/BAAI/bge-m3) — **TRÙNG với `nv-embedqa-e5-v5` (1024, `lib/notebook/embed.ts:21`)** |
| Ngữ cảnh tối đa | 8.192 token | ollama.com/library/bge-m3 |
| Giấy phép trọng số | **MIT** | huggingface.co/BAAI/bge-m3 — sạch thương mại, không ràng buộc gì thêm cho IF bán ra |
| Đa ngôn ngữ | Tuyên bố hỗ trợ >100 ngôn ngữ (model card không liệt kê tên từng ngôn ngữ) | huggingface.co/BAAI/bge-m3 |
| **Tiếng Việt — đo được, không chỉ tuyên bố suông** | Có mặt trong **VN-MTEB** (Vietnamese Massive Text Embedding Benchmark, công bố ACL 2026 Findings, arXiv 2507.21500) — bộ 41 dataset/6 tác vụ dịch có kiểm soát từ MTEB gốc sang tiếng Việt; bge-m3 đạt **64.90 điểm** trên benchmark này (568M tham số, 1024 chiều) | [arxiv.org/abs/2507.21500](https://arxiv.org/abs/2507.21500), [ACL Anthology 2026.findings-eacl.86](https://aclanthology.org/2026.findings-eacl.86/) |
| So với `nv-embedqa-e5-v5` (đang dùng) trên đúng benchmark VN-MTEB | **KHÔNG TÌM ĐƯỢC NGUỒN** — bài VN-MTEB không thấy liệt kê `nv-embedqa-e5-v5` trong kết quả tra được; không so trực tiếp được điểm số | — |
| Endpoint Ollama để gọi | `POST /api/embed` (mới, hỗ trợ batch) hoặc `/api/embeddings` (cũ, 1 prompt/lần, deprecated) — cùng host `localhost:11434` IF đã dùng cho chat | community docs (DeepWiki ollama/ollama, GitHub issue #7242) |

**Vì sao BGE-M3 hợp hơn `nomic-embed-text`** (ứng viên phổ biến khác): nomic tối ưu cho tiếng Anh/
ngữ cảnh dài, không có bằng chứng đo tiếng Việt tương đương; BGE-M3 có benchmark tiếng Việt cụ thể
(VN-MTEB) — với luật "tri thức IF chủ yếu tiếng Việt" (Hoà nhấn mạnh trong bài giao việc), đây là
tiêu chí quyết định, không phải điểm MTEB tiếng Anh chung chung.

### Cảnh báo di trú — đổi embedder = đổi số chiều

`cosineSimilarity`/`topK` (`lib/notebook/similarity.ts:10-23`) dùng `Math.min(a.length, b.length)`
— **không throw khi hai vector khác chiều**, nhưng so sánh sai lệch âm thầm nếu trộn lẫn vector từ
2 model khác chiều trong cùng notebook. May mắn: BGE-M3 (1024) và `nv-embedqa-e5-v5` (1024) **CÙNG
SỐ CHIỀU** — nếu đổi thẳng sang BGE-M3, kỹ thuật không bắt buộc re-embed ngay (vector cũ vẫn "vừa
khớp" về độ dài mảng). Nhưng **KHÔNG NÊN dựa vào trùng hợp này** — hai model khác nhau tạo ra
không gian vector khác nhau dù cùng chiều, so sánh cosine giữa vector NVIDIA cũ và vector BGE-M3
mới cho kết quả VÔ NGHĨA dù không lỗi kỹ thuật. Cách xử lý đúng:
1. Thêm cột đánh dấu `embeddingModel` vào `NotebookChunk` (migration nhỏ, additive) — mọi chunk
   ghi rõ embed bằng model nào.
2. Khi retrieval, chỉ so sánh các chunk **cùng `embeddingModel`** với vector câu hỏi (embed bằng
   đúng model đó).
3. Đổi embedder mặc định ⇒ **re-embed toàn bộ chunk cũ** (chạy nền, không chặn UI) hoặc gắn nhãn
   "cần cập nhật" cho tài liệu cũ.
4. **Vì hiện tại 0 chunk thật (§2.2)** — bước 3 không tốn gì ở thời điểm này. Đây là lý do §1 nói
   "thời điểm rẻ nhất để đổi".

---

## 5 · C · CHỌN MODEL THEO CẤU HÌNH MÁY

### 5.1 · Ollama/LM Studio quyết định thế nào — tra được gì

- **Không có API "auto-select" chính thức của Ollama.** Cộng đồng xác nhận: bạn tự chọn model,
  Ollama chỉ tự **offload layer xuống CPU/RAM** khi VRAM không đủ (tốc độ giảm mạnh, từ ~45 token/s
  xuống 2-3 token/s) — không tự đổi sang model nhỏ hơn. [Ollama Hardware Selection Guide](https://eastondev.com/blog/en/posts/ai/20260528-ollama-hardware-guide/), [LocalLLM.in VRAM guide](https://localllm.in/blog/ollama-vram-requirements-for-local-llms).
- **LM Studio CÓ chỉ báo tương thích trực quan** (không phải "tự chọn" nhưng "gợi ý người chọn"):
  bảng model hiện màu **xanh** (vừa VRAM phát hiện được) / **vàng** (chạy được nhưng sát) / **đỏ**
  (cần kéo thanh trượt offload layer sang RAM hệ thống) trước khi tải — dựa trên VRAM thực tế máy
  đang chạy. Đây là mẫu UX đáng học: **KHÔNG tự động chọn thay người dùng, chỉ LỌC + GẮN NHÃN khả
  năng chạy, người dùng vẫn bấm** — khớp đúng luật IF "human-in-the-loop, máy đề xuất người duyệt".
  Nguồn: kết quả tra cộng đồng (LM Studio blog/hướng dẫn cộng đồng 2026) — **CHƯA verify trực tiếp
  trên app LM Studio thật, ghi nhận qua mô tả bên thứ ba**, độ tin cậy vừa phải.
- **Quy tắc kinh nghiệm cộng đồng** (nhiều nguồn trùng khớp, không phải số chính thức Ollama):
  model 7B lượng tử hoá Q4 cần **~8GB RAM**, 13-14B cần **~16GB**, 27-32B cần **~24GB+**. Q4_K_M là
  điểm cân bằng chất/tốc/dung lượng phổ biến nhất.

### 5.2 · Đề xuất bậc thang 3 mức cho IF (áp riêng cho tác vụ CHỮ — text-tier, không phải ảnh)

| Bậc | Điều kiện dò (RAM tổng máy qua `os.totalmem()` ở tầng Electron main — Node có sẵn, IF CHƯA dùng, xem §5.3) | Model Ollama gợi ý | Dung lượng | Ghi chú |
|---|---|---|---|---|
| **Nhẹ** | < 8GB RAM khả dụng hoặc không phát hiện Ollama | Không chạy local — chỉ cloud (NVIDIA) hoặc lõi tất định | 0 | Máy quá yếu để local chữ có ích; không ép |
| **Vừa** | 8-16GB | `llama3.2:3b`/`gemma2:2b` hoặc model 7-8B Q4 hiện IF đang mặc định (`llama3:latest`) | ~4-5GB | Giữ mặc định hiện tại `OLLAMA_MODEL_DEFAULT = 'llama3:latest'` (`ollama.ts:26`) đúng cho bậc này |
| **Khá** | 16-32GB (đúng dải máy M1 Pro của Hoà — thường 16 hoặc 32GB) | model 13-14B Q4 | ~8-9GB | Trả lời sâu hơn, vẫn local |
| **Mạnh** | ≥32GB | model 27-32B Q4_K_M | ~16-20GB | Máy render/workstation studio |

⚠️ **Số dung lượng model cụ thể lấy từ hướng dẫn cộng đồng năm 2026, KHÔNG phải benchmark IF tự
đo** — trước khi hardcode vào registry, nên chạy thử ít nhất 1 lần trên máy Hoà (M1 Pro) để xác
nhận tốc độ token/s thực tế cho bậc "Khá" có chấp nhận được không (Vitals cần phản hồi nhanh, kể
cả bậc Vừa/Khá — bậc Mạnh mới nên chấp nhận model to/chậm hơn).

### 5.3 · Dò cấu hình máy — kỹ thuật khả thi trong IF (Electron)

Repo xác nhận `electron/main.js` tồn tại (tiến trình main Electron, Node đầy đủ). `os.totalmem()`,
`os.cpus()` là API Node chuẩn, gọi được ngay trong main process — **KHÔNG cần cài gói mới**. Renderer
(React/Next) không có quyền Node trực tiếp nên phải đi qua IPC (`ipcMain.handle` → preload → React) —
đúng mẫu Electron đã quen dùng cho các tác vụ hệ thống khác trong repo (chưa kiểm chi tiết IPC hiện
có, nằm ngoài phạm vi agent này). Dò GPU/VRAM khó hơn nhiều (Node không có API chuẩn cho VRAM) —
**đề xuất KHÔNG dò VRAM ở v0/v1**, chỉ dùng RAM tổng máy + có Ollama hay không + danh sách model đã
kéo (API đã có: `isOllamaAvailable()` trả `models: string[]`, `ollama.ts:76-100`) làm 3 tín hiệu đủ
để xếp bậc — đơn giản, không đoán phần cứng sâu hơn mức cần thiết.

### 5.4 · Nối vào ThinkDial — KHÔNG trộn, LÀ TRỤC KHÁC

Đọc `docs/TU-VAN-LOI-LUONG-2026-08-11.md:40,94,106` và `docs/00-CHOT.md:788` (định nghĩa ThinkDial):
ThinkDial = **1 dropdown, 4 tổ hợp ENGINE** (Trả nhanh/Cân bằng/Nghĩ sâu/Nghiên cứu) — nó quyết
định *"bao nhiêu bước máy chạy cho MỘT câu hỏi"* (có nối RAG không, có đọc docContext không, có
đọc violations không...), KHÔNG quyết định *"model nào chạy được trên máy này"*.

**Bậc-theo-máy phải là trục ĐỘC LẬP, đứng TRƯỚC ThinkDial trong luồng quyết định**, vì lý do vật
lý: máy yếu không thể chạy nấc "Nghiên cứu" (nhiều engine, tốn nhiều lượt gọi model) ở tốc độ chấp
nhận được nếu buộc dùng model to — nhưng vẫn PHẢI cho người dùng thử ThinkDial "Nghiên cứu" trên
model NHỎ hơn, chỉ là kết quả nông hơn/chậm hơn, không bị chặn cứng. Sơ đồ quyết định:

```
Bậc-theo-máy (RAM+Ollama dò được)
        │
        ▼  xác định TẬP MODEL khả dụng cho tác vụ chữ (§5.2)
        │
ThinkDial (người dùng chọn/mặc định theo route)
        │
        ▼  chọn TỔ HỢP ENGINE (RAG bật/tắt, docContext, violations…)
        │
completeTextTiered() chạy model TRONG TẬP đã xác định ở bước 1
```

**Ai chọn**: máy TỰ ĐỀ XUẤT bậc (dựa trên RAM đo được — không hỏi người dùng con số kỹ thuật họ
không biết), người dùng CÓ THỂ ghi đè qua `OLLAMA_MODEL` env hoặc 1 dropdown ẩn trong Cài đặt
("Model local" — hiện tên + dung lượng + bậc khuyến nghị, giống chỉ báo màu LM Studio ở §5.1,
nhưng KHÔNG chặn chọn model khác bậc — chỉ cảnh báo "có thể chậm trên máy này"). Đây đúng khuôn
Đ2/Đ3 của TRIET-LY-IF (nhìn nội lực trước, ánh xạ 2 giá trị: giúp IF chạy đúng tốc độ ↔ người
dùng KHÔNG bị dội lỗi timeout khó hiểu khi máy yếu).

---

## 6 · E · ĐỀ XUẤT MỘT ĐƯỜNG + BẬC THANG

### v0 — chứng minh giá trị trong 1 phiên (không đổi schema, additive thuần)

1. Thêm `lib/notebook/embed-tiered.ts` cùng khuôn `text-tier.ts`: `embedTextsTiered(texts, inputType)`
   — thử NVIDIA trước (giữ nguyên `embed.ts` không đổi), lỗi/thiếu key → tụt xuống gọi Ollama
   `/api/embed` với model `bge-m3` (cần thêm hàm `embedOllama()` nhỏ trong
   `lib/ai/providers/ollama.ts`, cùng mẫu `chat()` đã có).
2. `lib/notebook/rag.ts` gọi qua `embedTextsTiered` thay vì `embedOne` thẳng — RAG không còn chết
   cứng khi mất mạng/hết quota NVIDIA.
3. **KHÔNG** thêm bậc-theo-máy ở v0 — chỉ cần "chạy được", chưa cần "chạy tối ưu theo máy".
4. Nghiệm thu: tắt mạng/xoá `NVIDIA_API_KEY`, chạy `ollama pull bge-m3`, thử ingest 1 file PDF thật
   qua `/api/notebook/[projectId]/source`, xác nhận chunk có `embedding` khác rỗng và retrieval
   trả kết quả hợp lý cho câu hỏi tiếng Việt.

### v1 — bậc-theo-máy tối thiểu

1. IPC nhỏ trong Electron main đọc `os.totalmem()` → gửi 1 số (GB) cho renderer lúc khởi động.
2. `resolveOllamaModel()` nhận thêm tham số `ramGb?: number`, dùng bậc §5.2 để LỌC danh sách model
   gợi ý (không ép — vẫn tôn trọng `OLLAMA_MODEL` env nếu người dùng đã tự đặt, giữ đúng thứ tự ưu
   tiên hiện có ở `ollama.ts:68-74`).
3. Thêm cột `embeddingModel` vào `NotebookChunk` (migration additive) — chống trộn vector khác
   không gian (§B mục cảnh báo di trú).
4. Mở dropdown "Model local" trong Cài đặt (đọc RAM đã dò, hiện bậc khuyến nghị + cho ghi đè).

### v2 — mở rộng nguồn tri thức (SAU khi v0/v1 chạy ổn, và SAU khi `neufert-tach-goi` xong)

1. Ingest `vn-*.ts` (TCVN/QCVN thuần Việt, không dính bản quyền ngoại) thành văn bản → nạp qua
   `NotebookSource` kind mới (vd `'standard'`) — chứng minh RAG đọc được LUẬT NGÀNH thật, không
   chỉ file PDF người dùng tự up.
2. Thi hành `neufert-tach-goi` (đã CHỐT 12/08, registry `trangThai: 'chua'`) — tách Neufert ra gói
   ngoài repo trước khi cho phép RAG chạm vào nó.
3. Đánh giá mở rộng `PairwisePerceptron` (§2.4) sang học **gu chọn vật liệu/style** — không phải
   "training LLM", vẫn là học nhẹ ngoài model, nhưng phạm vi rộng hơn xếp hạng layout hiện tại.

### KHÔNG nên làm (nói thẳng, tránh phiên sau đề xuất lại)

- **KHÔNG fine-tune/LoRA ở bất kỳ mốc nào trong 3 bậc trên** — chưa có dữ liệu, làm sớm là "training
  trên dữ liệu tự chế" (AI dạy AI), rủi ro hơn lợi.
- **KHÔNG tự "ollama pull" ngầm** — `resolveOllamaModel()` đã tự khai nguyên tắc này (`ollama.ts:65`
  *"KHÔNG bao giờ tự `ollama pull` (tốn băng thông/đĩa)"*), bậc-theo-máy chỉ nên GỢI Ý model, việc
  tải về vẫn do người dùng bấm — giữ nguyên luật.
- **KHÔNG dò VRAM/GPU ở v0/v1** — không có API Node chuẩn, độ phức tạp không tương xứng lợi ích khi
  IF hiện chỉ cần RAM tổng máy để xếp bậc chữ (ảnh/3D vốn đã có trục AI-tier riêng ở `lib/ai/tiers.ts`,
  không nằm trong phạm vi agent này).
- **KHÔNG trộn bậc-theo-máy vào ThinkDial thành 1 dropdown** — hai trục khác chiều nghĩa (§5.4),
  gộp lại sẽ tái diễn đúng lỗi "trộn 2 lớp khác nhau" mà `00-CHOT.md` mục 12 đã cấm cho lớp
  luật/góp ý (nguyên tắc chung: trục khác nghĩa → giao diện khác, dù cùng nằm cạnh nhau).

---

## 7 · CHƯA CHẮC / CHƯA KIỂM — đọc trước khi build

- Chưa chạy thử `ollama pull bge-m3` + `/api/embed` thật trên máy Hoà — mọi số về tốc độ/độ chính
  xác tiếng Việt là suy từ benchmark VN-MTEB công bố, KHÔNG phải đo trực tiếp trong IF.
- Chỉ báo màu LM Studio (§5.1) mô tả qua nguồn thứ 3, chưa tự tay mở app LM Studio kiểm chứng.
- Bậc RAM 8/16/32GB (§5.2) là quy tắc kinh nghiệm cộng đồng Ollama, không phải số chính thức của
  Ollama Inc. — cần verify lại nếu Ollama đổi engine lượng tử hoá mặc định.
- Chưa kiểm tra IPC hiện có trong `electron/main.js` có sẵn kênh nào gần giống việc gửi số RAM cho
  renderer để tái dùng hay phải viết mới hoàn toàn — nằm ngoài thời lượng nghiên cứu này.
- So sánh trực tiếp điểm số `bge-m3` vs `nv-embedqa-e5-v5` trên CÙNG benchmark VN-MTEB: **KHÔNG
  TÌM ĐƯỢC NGUỒN** (bài báo không liệt kê model NVIDIA này trong bảng kết quả tra được).

---

*Agent AL, mô hình điều phối T — InteriorFlow. Nghiên cứu thuần đọc, không sửa code/schema/cài gói.*
