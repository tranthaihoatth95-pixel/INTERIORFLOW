# Reference — QA luồng dùng thật + Thiết kế Gu ML Engine

> Tài liệu 2 phần: **(A)** QA thư viện Reference — lỗi/thiếu xếp P0/P1/P2 kèm `file:line`;
> **(B)** thiết kế cơ chế Máy học "Gu Engine" (feature → memory → suggestion) để review trước khi build.
> Phần code FIX an toàn đã cài trong phiên này liệt kê ở mục **(D)**.

Nguyên tắc xuyên suốt (user chốt): **gu KHÔNG hardcode, TRÍCH từ Reference, mỗi sản phẩm mỗi khác**;
đề xuất phải **hiểu cơ chế/đặc tính để gợi ý — KHÔNG cưỡng ép thực dụng**.

---

## (A) QA luồng dùng thật — LỖI & THIẾU

### Bối cảnh luồng
Upload ảnh → `components/LibraryPanel.tsx` (chọn category + tags + usage) → phân loại local
`lib/classify.ts` khi để "Tự động" → POST `app/api/library/route.ts` (Prisma `LibraryAsset`:
name/category/tags/usage/palette/caption/content/w/h) → GET trả toàn team → hiển thị lưới theo
category → kéo-thả ra canvas. Gu trích ở `lib/gu.ts` bằng từ điển cứng quét tag+caption.

### P0 — chặn đúng nhu cầu cốt lõi

**P0-1 · Search bỏ hẳn caption/usage/palette dù DB & API đã có.**
`components/LibraryPanel.tsx:59-63` (trước fix) chỉ `i.name` + `i.tags` trong **1 category**.
Interface `ServerAsset` (`LibraryPanel.tsx:23-31`, trước fix) **không khai báo** `usage/palette/caption`
→ dữ liệu API trả (`app/api/library/route.ts:27-32`) bị **rơi ngay ở tầng TS**, không cách nào search.
Hệ quả: gõ mô tả ("phòng ngủ ấm", "travertine") không ra gì nếu tên file vô nghĩa (IMG_1234).
→ **Đã fix ở (D).**

**P0-2 · Search khoá cứng trong 1 category, không xuyên category.**
`LibraryPanel.tsx:59` điều kiện `i.category === cat`. Ảnh "vật liệu gỗ" nằm ở tab "Vật liệu /
Texture" sẽ không hiện khi đang ở tab "Ref nội thất" dù cùng chủ đề. Người dùng phải nhớ đã
bỏ ảnh vào tab nào. → **Đã fix ở (D)** (toggle "Tìm xuyên mọi category").

**P0-3 · Không match dấu tiếng Việt & không đồng nghĩa VI–EN.**
`String.includes` phân biệt dấu: gõ "be tong" không ra "bê tông"; gõ "sồi" không ra "oak";
"gỗ" không ra "wood". Với đội dùng lẫn Việt–Anh đây là lỗi tìm-không-thấy thường trực.
→ **Đã fix ở (D)** (chuẩn hoá bỏ dấu + từ điển đồng nghĩa song ngữ).

### P1 — đúng nhãn/chủ đề & đúng ngữ cảnh

**P1-1 · `classify.ts` chỉ tách CHẮC 2 kind, còn lại dồn 'space' conf 0.35.**
`lib/classify.ts:139-149`: chỉ `drawing` và `material` được auto-gán; layout/furniture/space đều
rơi về `space` (`ref-render`) độ tin 0.35. Nghĩa là **~3/6 kind không bao giờ tự phân đúng** ở
tầng local. Đúng chủ ý (không đoán bừa) nhưng hệ quả là **rất nhiều ảnh gắn nhãn sai mặc định**
`ref-render`, kéo lệch gu và picker minh hoạ.

**P1-2 · Không có SUBJECT/TOPIC (phòng gì, loại không gian).**
`classify.ts` chỉ ra "kind" hình học (layout/space/material…), **không có chủ đề công năng**
(bedroom/kitchen/office/lobby…). `lib/gu.ts` có `STYLE_TERMS`/`MATERIAL_TERMS` nhưng **không có
`ROOM_TERMS`/subject** → gu không biết ảnh thuộc loại phòng nào → không đề xuất "case giống" theo
công năng được. Đây là trục phân loại quan trọng nhất cho "case giống/gần giống" mà hiện **thiếu hẳn**.

**P1-3 · VLM caption không được gọi trong luồng upload chính.**
`app/api/vision/caption/route.ts` tồn tại, nhưng `LibraryPanel.tsx` (onChange upload, dòng ~139-190)
**không gọi** — chỉ dùng `classifyImage` local. Caption luôn rỗng khi upload nhanh → `gu.ts`
`buildGuProfile` (quét `name+tags+caption`, `lib/gu.ts:85-88`) mất nguồn ngữ nghĩa giàu nhất,
chỉ còn tag tay. Kết quả gu nghèo khi user lười tag.

**P1-4 · Panel KHÔNG biết chặng đang làm — không lọc/ưu tiên theo Concept/Render/Present.**
`LibraryPanel.tsx` trước fix không đọc `store.workspace` (`lib/store.ts:79`). Ở chặng Render vẫn
hiện y hệt chặng Present. Đúng "chặng mềm" (không nên khoá) nhưng **thiếu ưu tiên gợi ý**.
→ **Đã fix ở (D)** ( order tab + nổi asset đúng usage theo chặng, không khoá).

**P1-5 · `finalUsage` fallback nuốt lỗi thành 'ref-render'.**
`LibraryPanel.tsx` (upload) `classifyImage(...).catch(() => 'ref-render')`: ảnh phân loại lỗi →
gán ngầm `ref-render` mà không cảnh báo. Cộng với P1-1, tỉ lệ `ref-render` bị phồng giả tạo.
Nên hạ về `brief`/`other` + cờ "cần duyệt" thay vì `ref-render`.

### P2 — chất lượng & mở rộng

**P2-1 · `mergePalette` chỉ đếm hex trùng KHÍT.** `lib/gu.ts:60-71` gom theo chuỗi hex bằng nhau
tuyệt đối. Palette trích từ ảnh gần như không bao giờ trùng khít giữa 2 ảnh → `freq` hầu hết =1,
"màu chủ đạo tổng hợp" thực chất là ngẫu nhiên. Cần **gom theo cụm màu (bin/quantize)**, không so bằng.

**P2-2 · Từ điển style/material CỨNG, ngược nguyên tắc "trích từ Reference".**
`lib/gu.ts:33-44` `MATERIAL_TERMS`/`STYLE_TERMS` cố định → gu chỉ nhận ra từ có sẵn trong danh
sách. Từ mới ("mircocement", "boucle", "chàm") không bao giờ vào gu. Đây chính là điểm ML sẽ thay.

**P2-3 · Không khử trùng lặp ảnh.** Upload trùng → palette/gu bị đếm 2 lần, lệch trọng số. Thiếu
perceptual-hash chống trùng.

**P2-4 · Search không debounce, lọc mỗi ký tự trên toàn mảng.** Với thư viện lớn (toàn team) sẽ
giật. Cần debounce + memo (đã memo bằng biến dẫn xuất; debounce để sau).

---

## (B) THIẾT KẾ Gu ML Engine

### B.0 Mục tiêu
Từ mỗi Reference trích **đặc trưng** (palette · cấu trúc layout · bố trí công năng · quan điểm
thẩm mỹ theo chủ đề), **ghi nhớ** trong feature-store nhẹ, và **đề xuất theo xác suất** cho case
giống/gần giống bằng độ tương đồng — kèm **giải thích "vì sao gợi ý"** và **ngưỡng tin cậy**.
Ưu tiên **on-device/in-browser, manual-first, KHÔNG train nặng**.

### B.1 Kiến trúc 3 tầng

```
        ┌────────────────────────── INGEST (upload) ──────────────────────────┐
        │  ảnh/PDF ──► FEATURE EXTRACTION (3 lớp)                              │
        │     L0 local-statistic (0 AI, tức thì)   ── classify.ts + palette   │
        │     L1 lexical (tag/caption/room-terms)  ── gu.ts + ROOM_TERMS(mới) │
        │     L2 embedding/VLM (tuỳ chọn, chậm)    ── /api/vision + CLIP-lite  │
        └───────────────────────────────┬─────────────────────────────────────┘
                                         ▼
                         ┌───────── FEATURE STORE (memory) ─────────┐
                         │  RefFeature{} per asset  (JSON + vector) │
                         │  + PrototypeStore per (subject×usage)    │
                         │  + FeedbackWeights (học dần)             │
                         └───────────────────┬──────────────────────┘
                                             ▼
        ┌──────────────────────── SUGGESTION (query-time) ─────────────────────┐
        │  case hiện tại → feature vector ── kNN cosine ──► top-k similar        │
        │  → điểm xác suất (softmax theo similarity × feedbackWeight)           │
        │  → giải thích (feature nào khớp) + ngưỡng tin cậy                     │
        └──────────────────────────────────────────────────────────────────────┘
```

### B.2 FEATURE — trích đặc trưng (rõ tầng nào local, tầng nào cần AI)

| Đặc trưng | Cách trích | Tầng | Ghi chú |
|---|---|---|---|
| **Palette** (màu chủ đạo + tỉ trọng) | k-means/quantize trên canvas 128px | L0 local | đã có `extractPalette`; nâng: lưu **tỉ trọng** + bin LAB |
| **Thống kê hình học** (white/dark/sat/edge/flat/aspect) | `classify.ts:analyze()` | L0 local | đã có; là feature rẻ, ổn định |
| **Kind** (layout/space/furniture/drawing/material) | heuristic `classify.ts` | L0 local | mở rộng ngưỡng đa lớp thay 2 ca |
| **Subject/Room** (bedroom/kitchen/office/lobby…) | `ROOM_TERMS` quét tag+caption (mới) | L1 lexical | **P1-2** — trục thiếu nhất |
| **Material/Style** | từ điển gu.ts + **học term mới** từ tag người dùng | L1 lexical | bỏ dần hardcode (P2-2) |
| **Cấu trúc LAYOUT mặt bằng** | grid occupancy 8×8 (vùng đặc/rỗng) + hướng trục chính | L0 local | phác thô; đủ để so 2 mặt bằng "giống bố cục" |
| **Bố trí công năng** | (giai đoạn sau) phát hiện block furniture trên layout | L2 | cần detector — ĐỂ VỀ SAU |
| **Embedding thẩm mỹ** (vector 256–512d) | CLIP/SigLIP-lite qua VLM hoặc onnx in-browser | L2 embedding | nguồn "giống/gần giống" mạnh nhất; **tuỳ chọn** |

**Ranh giới rõ:**
- **Local-statistic (làm ngay, 0 chi phí):** palette+tỉ trọng, thống kê hình học, kind, layout-grid.
- **Lexical (làm ngay, rẻ):** subject/room terms, material/style + **học term** từ tag.
- **Embedding/VLM (tuỳ chọn, có chi phí/độ trễ):** caption tự động, embedding thẩm mỹ 512d.
  Chạy **nền, không chặn upload**; hết free thì degrade về L0+L1 (giữ nguyên tắc "chỉ báo, không tụt").
- **Để về sau:** detector bố trí công năng trên mặt bằng (cần model nặng hơn / dữ liệu gán nhãn).

### B.3 MEMORY — feature store nhẹ

**Schema `RefFeature` (1 bản/asset, JSON hoá; thêm cột `features` vào `LibraryAsset` hoặc bảng phụ):**
```ts
interface RefFeature {
  assetId: string;
  subject: string | null;        // 'bedroom' | 'kitchen' | ... (L1)
  usage: string;                 // RefUsage
  kind: RefKind;                 // L0
  palette: { hex: string; ratio: number }[]; // tỉ trọng chuẩn hoá
  geom: { white: number; dark: number; sat: number; edge: number; flat: number; aspect: number };
  layoutGrid?: number[];         // 64 số 0..1 occupancy (nếu là mặt bằng)
  styleTerms: string[]; materialTerms: string[];
  embed?: number[];              // 512d, chỉ khi L2 chạy; nén Float32→base64 để lưu
  confidence: number;            // độ tin phân loại
  updatedAt: string;
}
```
**PrototypeStore (nguyên mẫu theo nhóm):** với mỗi `(subject × usage)` giữ 1 **centroid** =
trung bình các feature vector đã "được chấp nhận". Đây là "hiểu đặc tính nhóm" — nền cho gợi ý.
Lưu client trước (IndexedDB, giống pattern moodboards) rồi đồng bộ server sau; nhẹ, không train.

### B.4 SUGGESTION — đề xuất theo xác suất + explainable

1. **Vector hoá case hiện tại** (ảnh/nhóm đang chọn) → cùng pipeline feature.
2. **Similarity:** cosine trên `embed` nếu có; nếu không, **similarity lai** =
   `w_pal·palSim + w_geom·geomSim + w_subj·subjectMatch + w_style·styleJaccard` (mọi thành phần L0/L1).
3. **kNN** lấy top-k gần nhất; **xác suất** = `softmax(similarity_i / τ) × feedbackWeight_i`.
4. **Ngưỡng tin cậy:** chỉ hiện gợi ý ≥ `θ` (vd 0.55); dưới ngưỡng → "chưa đủ dữ liệu, đây là phỏng đoán".
5. **Explainable (bắt buộc):** kèm *vì sao* — "khớp vì: cùng chủ đề *phòng ngủ*, palette gần
   (ΔE≈18), cùng phong cách *japandi*". Hiển thị 2–3 lý do đặc trưng đóng góp cao nhất.

**Nguyên tắc "hiểu đặc tính, không cưỡng ép thực dụng":** gợi ý là **đề xuất mềm có giải thích**,
không tự-áp, không ép chọn cái phổ biến. Nếu gu của sản phẩm này lệch số đông → tôn trọng gu sản
phẩm (similarity nội bộ nhóm đã chọn > prior toàn thư viện). Không bao giờ ẩn lựa chọn khác.

### B.5 COLD-START (ít data)
- **0–5 ref:** tắt kNN; chỉ dùng **L0+L1 rule** + prior nhẹ từ Reference toàn team (đọc-only), gắn nhãn
  rõ "gợi ý khởi tạo". Không bịa xác suất cao.
- **5–30 ref:** bật similarity lai (L0/L1), chưa cần embedding. Centroid theo subject bắt đầu hình thành.
- **>30 ref & VLM bật:** thêm embedding L2 → gợi ý ngữ nghĩa. Trọng số `w_*` chuyển dần từ rule→data.
- Luôn có **fallback**: thiếu feature nào thì bỏ khỏi công thức, chuẩn hoá lại trọng số còn lại.

### B.6 VÒNG PHẢN HỒI (học dần)
- Mỗi gợi ý có 2 hành động: **Nhận** (kéo ra dùng / áp gu) hoặc **Bỏ qua**.
- Cập nhật **online, nhẹ** (không train lại): `feedbackWeight_i ← clamp(w_i + η·(accept?+1:−0.5))`;
  đồng thời **nudge centroid** subject về phía feature được nhận (EMA, α nhỏ).
- Học **term mới**: tag người dùng gõ khi upload → nếu lặp lại đủ ngưỡng, thêm vào từ điển
  material/style **của workspace này** (không toàn cục) → dần thoát hardcode (P2-2).
- Chống nhiễu: giới hạn η, có sàn/trần trọng số, log để hoàn tác. Tất cả **on-device**, không gửi PII.

### B.7 Explainability & an toàn gu
- Mỗi profile gu hiển thị **nguồn**: feature nào từ ảnh nào (sampleUrls đã có trong `GuProfile`).
- Ngưỡng tin cậy hiển thị công khai; gợi ý dưới ngưỡng ghi rõ "phỏng đoán".
- Không auto-apply; user luôn là người quyết. Gu sản phẩm > gu trung bình thư viện.

---

## (C) LỘ TRÌNH TRIỂN KHAI theo pha

| Pha | Nội dung | Tầng | Rủi ro |
|---|---|---|---|
| **P0 (đã làm)** | Search nâng cấp (caption+xuyên category+fuzzy VI–EN+màu), hiển thị theo chặng | L0/L1 lexical | thấp — thuần client, tsc sạch |
| **P1** | Thêm `ROOM_TERMS`/subject vào classify+gu; gọi VLM caption nền khi upload; hạ fallback `ref-render`→`brief`+cờ duyệt | L1 (+L2 nền) | vừa — chạm gu.ts/classify.ts/api (cần chủ repo duyệt) |
| **P2** | `RefFeature` store (IndexedDB) + similarity lai + PrototypeStore + UI gợi ý explainable | L0/L1 | vừa — thêm bảng/cột, không train |
| **P3** | Embedding L2 (CLIP/SigLIP-lite in-browser hoặc VLM) + kNN ngữ nghĩa + vòng phản hồi online | L2 | cao — chi phí/độ trễ, cần feature-flag & degrade |
| **P4 (để sau)** | Detector bố trí công năng trên mặt bằng; palette quantize LAB; perceptual-hash chống trùng | L2+ | cao — cần dữ liệu/model |

---

## (D) FIX ĐÃ CÀI trong phiên này (an toàn, tsc sạch)

**File mới:** `lib/ref-search.ts`
- `normVi()` — bỏ dấu tiếng Việt + đ→d + hạ chữ (fix P0-3).
- `SYNONYM_GROUPS` + `WORD_TO_GROUP` — đồng nghĩa/song ngữ VI–EN vật liệu·phong cách·công năng (P0-3).
- `COLOR_TERMS` + `nearestPaletteDist()` — tìm theo màu, khớp hex palette gần nhất (P0-1 mở rộng).
- `editDist()`/`tokenHits()` — fuzzy gõ sai cho token ≥4 ký tự.
- `scoreAsset()`/`searchAssets()` — chấm điểm đa trường (name/tag/caption/usage/category/màu), xuyên category (P0-1, P0-2).
- `phaseRelevance()`/`orderCategoriesByPhase()`/`PHASE_USAGES`/`PHASE_CATEGORIES` — hiển thị theo chặng (P1-4).

**Sửa `components/LibraryPanel.tsx`:**
- `ServerAsset` bổ sung `usage/palette/caption` (trước bị rơi ở TS — gốc rễ P0-1).
- Đọc `store.workspace` → ưu tiên tab category & nổi asset đúng usage theo chặng (không khoá — P1-4).
- Thay filter cũ bằng `searchAssets(...)`; thêm placeholder mô tả + toggle "Tìm xuyên mọi category".
- Tab category có ★ đánh dấu nhóm hợp chặng.

**KHÔNG đụng:** `lib/gu.ts`, `lib/classify.ts`, store/types/registry, api (chỉ đọc). Phần ML (B) để dạng
thiết kế cho integrator review trước khi build.
