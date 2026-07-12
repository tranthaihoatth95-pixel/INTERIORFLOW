# ĐỀ XUẤT — ML "Gu Engine" cho InteriorFlow (3 chặng: CAD · RENDER · PRESENT)

> **Trạng thái:** ĐỀ XUẤT để chủ dự án DUYỆT. **Chưa được phép implement** (khớp STATUS.md → mục
> "Bị chặn"). Tài liệu này chỉ THIẾT KẾ; không đụng bất kỳ file `.ts/.tsx` nào.
>
> **Quan hệ với tài liệu cũ:** `docs/REFERENCE-QA-AND-GU-ML.md` mục (B) đã phác kiến trúc 3 tầng
> chung (INGEST → FEATURE STORE → SUGGESTION) cho thư viện Reference. Tài liệu này **kế thừa và
> chuyên biệt hoá**: thay vì 1 engine chung, đề xuất **3 cơ chế phân loại TỐI ƯU RIÊNG** cho 3
> chặng vì bản chất đầu vào/đầu ra mỗi chặng khác hẳn nhau:
> - **CAD** phân loại *hình học vector + không gian* → tiêu chuẩn/bố trí/"gu vận hành" theo loại operator.
> - **RENDER** phân loại *cảm quan ảnh raster* → vật liệu/màu/style/tâm lý thị giác.
> - **PRESENT** phân loại *bố cục trang* → lưới bento/font/graphic/mật độ.
>
> Ba engine **chia sẻ 1 Feature Store nhẹ + 1 vòng phản hồi**, nhưng feature và mô hình tách rời.

---

## 0. Nguyên tắc & ràng buộc thực tế (bắt buộc tôn trọng)

**Nguyên tắc gu (user chốt, xem `lib/gu.ts:1-8`, `docs/GU-PROFILE.md`):**
- Gu **KHÔNG hardcode** — TRÍCH từ Reference; mỗi sản phẩm mỗi khác.
- Engine **chỉ đề xuất mềm + giải thích**, KHÔNG cưỡng ép, KHÔNG auto-apply. Người luôn quyết.
- "Điều khoản hiến pháp": checker/engine **chỉ đọc + gợi ý**, không tự sửa bản vẽ
  (`lib/cad/standards/checker.ts:5-8`).

**Ràng buộc phần cứng (đã xác nhận):**
- Máy chạy chính là **Mac 16GB** → **KHÔNG kham model lớn local** (CLIP-L/SigLIP/SAM full-precision,
  detector nặng đều loại). Đã có bằng chứng thực tế: Z-Image 6B swap 24GB, 20+ phút/ảnh (memory
  InteriorFlow-ComfyUI-local-limits).
- Kiến trúc BẮT BUỘC: **heuristic-first (L0/L1, 0 chi phí, tức thì)** → **API nhẹ khi có key**
  (fal `lib/ai/providers/fal.ts`, NVIDIA VLM free `lib/ai/providers/nvidia.ts`) → **embedding nhẹ**
  → **ML nặng để pha sau, phải degrade được** khi thiếu key/GPU/mạng.
- Mọi tầng AI chạy **nền, không chặn thao tác**; hết free/lỗi → tụt về L0+L1, "chỉ báo, không tụt
  chất lượng thầm lặng" (khớp hành vi `app/api/vision/caption/route.ts`).

**3 tầng feature dùng chung cho cả 3 engine:**

| Tầng | Tên | Chi phí | Khi nào |
|---|---|---|---|
| **L0** | Local-statistic (canvas/pixel, hình học vector) | 0đ, tức thì | Luôn chạy |
| **L1** | Lexical (từ điển + học term từ tag/caption) | 0đ, rẻ | Luôn chạy |
| **L2** | Embedding / VLM (NVIDIA free hoặc fal; embed nhẹ) | có phí/độ trễ | Tuỳ chọn, có key |

---

## 1. CHẶNG CAD — phân loại *hình học không gian* → tiêu chuẩn · bố trí · gu vận hành theo operator

### (a) Phân loại gì → nhãn gì

CAD engine nhận **DIỆN mọi định dạng đầu vào** (DXF/DWG-qua-DXF, PDF vector→DXF, ảnh scan bản vẽ,
mô tả ngôn ngữ tự nhiên) và phân về **4 trục nhãn**:

1. **Operator type** (loại vận hành — TRỤC MỚI, hiện thiếu hẳn):
   `residential-host` (nhà ở/homestay/host) · `office` · `f&b` (café/nhà hàng/bar) · `retail` ·
   `hospitality` (khách sạn/lounge) · `clinic` · `generic`.
2. **Space program** (chương trình công năng): danh sách phòng + `RoomFunction` — **đã có**
   enum ở `lib/cad/ai-assist.ts:29-40` (`bedroom|living|dining|kitchen|bath|office|corridor|generic`).
   → mở rộng thêm nhãn theo operator (vd f&b: `dining-hall|bar|kitchen-back|storage|restroom`).
3. **Layout typology** (kiểu bố trí): `linear` · `island/cluster` · `perimeter` · `open-plan` ·
   `cellular` — suy từ occupancy-grid + quan hệ tường/lõi.
4. **Standards profile** (bộ quy chuẩn áp): map operator → nhóm rule trong
   `lib/cad/standards/registry.ts` (`VN_RESIDENTIAL` / `VN_FIRE` / `INTL_EGRESS` / `ISO_DRAFTING`).

**"Gu vận hành theo operator"** = với mỗi operator, engine biết *nguyên mẫu bố trí* điển hình
(office → cụm bàn + lối thoát ≥1.2m + phòng họp lõi; f&b → tỉ lệ seating/kitchen, luồng phục vụ;
host → riêng tư phòng ngủ cuối tuyến). Đây là "gu" — TRÍCH từ các mặt bằng Reference cùng operator,
KHÔNG hardcode con số cứng.

### (b) Feature representation (đặc trưng lấy từ đâu)

Đầu vào CAD là **vector**, nên feature khác hẳn ảnh raster — lấy từ `Doc` sau khi `parseDxf`
(`lib/cad/dxf.ts` → `lib/cad/model.ts:177` `Entity`, `:188` `Doc`):

| Feature | Nguồn trích (vector) | Tầng |
|---|---|---|
| **Layer histogram** | tên + màu ACI mỗi layer (`dxf.ts` đọc group 8/62); vd nhiều `l-furniture`, `WALL`, `DIM` | L0 |
| **Entity mix** | tỉ lệ LINE/LWPOLYLINE/CIRCLE/ARC/TEXT/HATCH/DIMENSION/BLOCK | L0 |
| **Room set** | đa giác phòng dò từ `findHatchBoundary` + nhãn TEXT pick-point (`checker.ts:9-18`); mỗi phòng: diện tích (`polygonArea`) + bề rộng min (`polygonMinWidth` `checker.ts:38`) | L0 |
| **Block inventory** | block furniture nhận diện qua `BLOCK_MAP` id + `block-library` manifest (`block-library.ts:22` category) → đếm giường/bàn/toilet/bếp… | L0/L1 |
| **Occupancy grid 8×8** | rời rạc hoá bounding-box → ô đặc/rỗng theo tường (đề xuất mới, thuần hình học) | L0 |
| **Adjacency graph** | phòng nào giáp phòng nào (chung cạnh tường) → chữ ký typology | L0 |
| **Text/label tokens** | TEXT/MTEXT trong `Doc` + tên file + mô tả người dùng → operator keyword | L1 |

Với **mô tả ngôn ngữ tự nhiên** (không có file): feature lấy từ `parseDescription`
(`lib/cad/ai-assist.ts:190`) — đã tách phòng + công năng + kích thước + nội thất.

### (c) Cách tiếp cận mô hình (thực dụng)

- **Operator classifier = heuristic có trọng số (L0+L1), KHÔNG cần model:**
  chấm điểm mỗi operator từ *block inventory* (giường→host, desk cụm→office, bàn ăn nhiều + bếp
  lớn→f&b) × *room set* × *text tokens* → softmax → nhãn + độ tin. Rẻ, giải thích được, chạy 100%
  local. Đây là điểm mạnh: CAD vector cho tín hiệu SẠCH (biết chính xác có bao nhiêu giường/bàn),
  không cần "đoán" như ảnh.
- **Typology = luật hình học** trên occupancy-grid + adjacency (island vs linear vs cellular).
- **Standards profile = tra bảng** (data-driven) — operator → danh sách `RuleGroup`. KHÔNG ML.
- **"Gu bố trí" nguyên mẫu = centroid theo (operator × RoomFunction)**: trung bình các feature
  vector của mặt bằng Reference đã "được chấp nhận" → so mặt bằng đang làm với nguyên mẫu, gợi ý
  "case giống". Đây là kNN nhẹ, **không train**.
- **LLM (tuỳ chọn, L2):** chỉ ở **Tầng 1 PARSE** — thay `parseDescription` bằng 1 lời gọi model
  trả JSON đúng schema `LayoutSpec` (đã đánh dấu sẵn chỗ cắm ở `ai-assist.ts:7` và `:186-188`).
  Tầng 2 SOLVER (`layoutToEntities` `:337`) GIỮ NGUYÊN tất định — cùng input ra cùng toạ độ.

### (d) Nguồn dữ liệu học

- Các file DXF đã import + block-library manifest (`public/cad-library/manifest.json`).
- Mặt bằng Reference gắn `usage:'cad'`/`kind:'drawing'` (từ `classify.ts:13` KIND_TO_USAGE).
- Quy chuẩn: `verified` rules trong registry (nguồn TCVN/pháp luật — `registry.ts:14-24`).
- Vòng phản hồi: user Nhận/Bỏ gợi ý bố trí → nudge centroid operator (EMA nhẹ).

### (e) Điểm cắm vào code hiện có

- **Feature extractor mới** `lib/cad/gu-features.ts` (đề xuất): input `Doc` (từ `dxf.ts` `parseDxf`),
  output `CadFeature{}`. Đọc-only, không sửa `model.ts`.
- **Operator classifier** cắm sau `parseDxf` và cạnh `parseDescription` (`ai-assist.ts:190`);
  bổ sung field `operator` vào `LayoutSpec` (`ai-assist.ts:41-43`) — **thêm field optional**, không
  phá solver.
- **Standards profile** đọc `getAllRules()` / `getRulesByCategory()` (`registry.ts:116-125`); lọc
  nhóm theo operator trước khi đưa vào `checker.ts` — checker giữ nguyên.
- **Gợi ý bố trí** hiển thị ở panel Kiểm chuẩn / AI-assist; dùng `layoutToEntities` (`:337`) để
  preview, KHÔNG auto-ghi.

### (f) Yêu cầu key/GPU + hành vi khi thiếu

- **Operator classifier, typology, standards, centroid: 100% local, 0 key, 0 GPU.** Đây là phần
  MẠNH của CAD — vector cho feature sạch nên gần như không cần AI nặng.
- **LLM parse (L2):** cần NVIDIA free (`nvidiaConfigured()` `nvidia.ts:14`) hoặc fal. **Thiếu key →
  degrade về `parseDescription` rule-based** (đã tồn tại, chạy tốt). Không chặn luồng.

### (g) Lộ trình theo pha

- **P1 (local, làm ngay khi duyệt):** `CadFeature` extractor + operator classifier heuristic +
  standards-profile mapping. Rủi ro thấp (đọc-only, tất định).
- **P2:** occupancy-grid + adjacency typology + centroid nguyên mẫu (IndexedDB) + UI "case giống".
- **P3 (tuỳ chọn):** LLM parse thay `parseDescription`; degrade sẵn.
- **P4 (để sau, ML nặng):** detector nhận diện bố trí công năng trực tiếp từ ảnh scan bản vẽ (cần
  model/dữ liệu gán nhãn) — CHỜ DUYỆT.

---

## 2. CHẶNG RENDER — phân loại *cảm quan ảnh* → bố cục · vật liệu · màu · style · nguyên lý · tâm lý màu

### (a) Phân loại gì → nhãn gì

Từ ảnh Reference (raster) rút các trục để nhồi prompt render (`sketch2render`/`clay2render` …):

1. **Kind hình học** (`classify.ts:11`): `layout|space|furniture|drawing|material|other` — **đã có**.
2. **Subject/Room** (loại không gian): `bedroom|kitchen|lobby|office|bathroom|dining|lounge…` —
   **thiếu** (P1-2 trong REFERENCE-QA); là trục "case giống theo công năng" quan trọng nhất.
3. **Material set**: vật liệu chủ đạo (marble/travertine/walnut/brass/linen…) — có nhưng đang
   HARDCODE (`gu.ts:33-38` `MATERIAL_TERMS`).
4. **Style**: japandi/quiet-luxury/industrial/neoclassic… — HARDCODE (`gu.ts:39-44` `STYLE_TERMS`).
5. **Palette + tỉ trọng**: màu chủ đạo (`extractPalette`, `analyze-refs.ts:88` k-means).
6. **Design principle / cảm giác hình học**: đối xứng vs bất đối xứng · nhịp lặp (fluted/slat) ·
   khối nặng vs nhẹ · tuyến ngang/dọc trội — suy từ projection profile + edge stats.
7. **Tâm lý màu (màu tác động con người)**: nhãn cảm xúc suy từ palette theo lý thuyết màu —
   `warm-inviting` (đỏ/cam/nâu ấm) · `calm-restorative` (xanh lá/greige) · `serene-cool` (xanh
   lam nhạt) · `dramatic-moody` (tối tương phản) · `luxe-neutral` (kem/champagne/đen nhấn). Đây là
   **ánh xạ tất định palette→cảm xúc**, không phải model — dùng để giải thích "vì sao gu này hợp
   không gian nghỉ dưỡng".

### (b) Feature representation

| Feature | Nguồn | Tầng |
|---|---|---|
| **Thống kê hình học** white/dark/sat/edge/flat/aspect | `classify.ts:39` `analyze()` | L0 |
| **Palette + tỉ trọng LAB** | nâng `mergePalette` (`gu.ts:60`) từ so-hex-khít → **bin/quantize LAB** (sửa P2-1) | L0 |
| **Đối xứng / nhịp** | projection-profile symmetry score (tái dùng `detect-regions.ts:85`) | L0 |
| **Tâm lý màu** | hàm map palette→emotion (mới, tất định, từ hue/sat/lum) | L0 |
| **Material/Style terms** | `gu.ts:50` `pickTerms` + **học term mới từ tag** (bỏ hardcode P2-2) | L1 |
| **Subject/Room** | `ROOM_TERMS` mới quét tag+caption; hoặc field `room` từ VLM | L1/L2 |
| **VLM caption** | `nvidia.ts:50` `captionImage` → `{caption,style,materials,room}` | L2 |
| **Embedding thẩm mỹ 256–512d** | CLIP/SigLIP nhẹ **qua API** hoặc onnx-web lượng tử hoá | L2 |

### (c) Cách tiếp cận mô hình

- **L0/L1 heuristic (làm ngay):** đã có `buildGuProfile` (`gu.ts:77`). Nâng: palette LAB, thêm
  ROOM_TERMS, thêm ánh xạ tâm-lý-màu. Đủ để nhồi prompt + gợi ý cơ bản.
- **VLM caption (L2, có sẵn hạ tầng):** `captionImage` trả thẳng `style/materials/room` — chính là
  3 trục ta cần, "miễn phí" về mặt kỹ thuật (NVIDIA free). Chạy nền khi upload (hiện CHƯA gọi trong
  luồng chính — P1-3), làm giàu feature khi user lười tag.
- **Embedding thẩm mỹ (L2, "giống/gần giống" mạnh nhất):** vector hoá ảnh → cosine kNN cho "case
  giống". **KHÔNG chạy CLIP-L local trên Mac 16GB**; dùng embedding **qua API** hoặc model nhỏ
  lượng-tử-hoá in-browser (webgpu, xem `lib/ai/webgpu.ts` đã có khung). Là tuỳ chọn thuần.
- **Học term (thoát hardcode):** tag user gõ lặp đủ ngưỡng → thêm vào từ điển material/style **của
  workspace** (không toàn cục) → dần thay `MATERIAL_TERMS`/`STYLE_TERMS` cứng.

### (d) Nguồn dữ liệu học

- Thư viện Reference `usage:'ref-render'` + palette/caption trong Prisma `LibraryAsset`.
- `docs/GU-PROFILE.md` (DNA gu Hoà từ ~1.500 pin) — prior khởi tạo (đọc-only).
- Ảnh user CHỌN cho từng sản phẩm (`guProfileFromPicked` `gu.ts:110`) — gu sản phẩm > gu trung bình.
- Feedback Nhận/Bỏ khi kéo ảnh ra dùng làm style-ref.

### (e) Điểm cắm vào code hiện có

- **Palette LAB:** sửa `mergePalette` (`gu.ts:60-71`) — bin theo cụm màu thay so-hex-khít.
- **ROOM_TERMS + tâm-lý-màu:** thêm vào `gu.ts` (dạng dữ liệu, cạnh MATERIAL/STYLE_TERMS);
  `buildGuProfile` (`:77`) bổ sung trường `subject`, `moods` vào `GuProfile` (`:22-30`).
- **VLM nền:** gọi `POST /api/vision/caption` (`app/api/vision/caption/route.ts`) trong luồng upload
  (`components/LibraryPanel.tsx`), lưu `caption` vào asset — không chặn upload.
- **Prompt render:** `guToPrompt` (`gu.ts:128`) + `guRenderPrompt`/`withGu` (`nodes/registry.ts:17-24`)
  — nối thêm `moods`/`subject` vào prompt. Node `input.guref` (`nodes/tags.ts:52`) hiển thị gu.
- **Embedding + kNN:** module mới `lib/gu-embed.ts` (đề xuất), feature-flag; degrade khi không có.

### (f) Yêu cầu key/GPU + hành vi khi thiếu

- **L0/L1 (palette, term, tâm-lý-màu, ROOM_TERMS): 0 key, 0 GPU.**
- **VLM caption:** cần `NVIDIA_API_KEY` free (`nvidia.ts:14`). Hết lượt → `NvidiaFreeExhausted`
  (`:19`) → UI báo "đổi nguồn thủ công", **KHÔNG tự tụt provider**. Không có key → chỉ dùng tag tay.
- **Embedding:** cần API hoặc webgpu. Thiếu → **bỏ thành phần embed khỏi công thức similarity,
  chuẩn hoá lại trọng số L0/L1 còn lại** (fallback đã mô tả REFERENCE-QA B.5).

### (g) Lộ trình theo pha

- **P1:** palette LAB + ROOM_TERMS + ánh xạ tâm-lý-màu + VLM caption nền. Rủi ro vừa (chạm `gu.ts`).
- **P2:** học term workspace + centroid theo (subject×style) + UI "case giống" explainable.
- **P3 (ML nặng, chờ duyệt):** embedding thẩm mỹ + kNN ngữ nghĩa + vòng phản hồi online.

---

## 3. CHẶNG PRESENT — phân loại *bố cục trang* → lưới BENTO · font · màu · graphic · icon · #hình · nền · pattern

### (a) Phân loại gì → nhãn gì

Từ ảnh slide/template Reference → rút quy tắc dàn trang bento:

1. **Grid archetype (lưới bento)**: `cover` · `two-column` · `content+image` · `grid-3/4` ·
   `quote` · `full-bleed` — **đã có** taxonomy ở `suggest.ts:37-44`.
2. **Grid geometry**: số cột/hàng + **khoảng cách lưới (gutter)** + kích thước ô — từ
   `detect-regions.ts` (projection profile).
3. **Cặp font**: `Editorial|Modern|Elegant` (`suggest.ts:31-35` `fontsFromGu`).
4. **Tone màu nền**: `light|warm|dark|accent` (`analyze-refs.ts:139`, `spec.ts:23`).
5. **#Hình tối thiểu/tối đa**: `minImages/maxImages` (`analyze-refs.ts:149-150`, `spec.ts:25-33`).
6. **Nền HÌNH vs MÀU**: `BackgroundMode` (`spec.ts:20`).
7. **Mật độ chữ / graphic**: `thưa|vừa|dày` (`analyze-refs.ts:147`).
8. **Pattern & icon** (trục mới, thiếu): có/không đường kẻ nhịp, khối màu nền, cần icon-set hay
   không — suy từ mật độ mảng + số vùng nhỏ đều.

### (b) Feature representation

| Feature | Nguồn | Tầng |
|---|---|---|
| **Ranh giới cột/hàng + ô lưới** | `detect-regions.ts:146` `detectRegions` (edge projection profile) | L0 |
| **Gutter (khoảng cách lưới)** | độ rộng "khe trũng" trong `findGaps` (`detect-regions.ts:50`) — hiện trả tâm khe; mở rộng trả cả BỀ RỘNG khe = gutter | L0 |
| **Palette + tone** | `analyze-refs.ts:130` `analyzeReferences` → `RefRuleSet` | L0 |
| **Aspect ảnh ưu thế** | `imageShape` (`analyze-refs.ts:142`) | L0 |
| **Mật độ mảng → #hình, textDensity, titleScale** | `contrastRegions` (`analyze-refs.ts:67-70`) | L0 |
| **Font thật** | TODO(VLM) `analyze-refs.ts:159` — cần đọc chữ | L2 |
| **Vai trò vùng** (title/ảnh/body) | `detect-regions.ts:14-16` CỐ Ý bỏ trống; cần VLM/heuristic | L2 |

### (c) Cách tiếp cận mô hình

- **Grid geometry = tất định (projection profile)** — điểm mạnh: slide có ít vùng to, gutter sạch,
  thẳng trục → projection profile HỢP (đã ghi rõ `detect-regions.ts:11-13`). **KHÔNG dùng cho
  collage/masonry.** Đây là phần "nhận diện lưới bento + khoảng cách" chạy 100% local.
- **Archetype + font + tone + #hình = heuristic** đã có (`suggest.ts` `suggestTemplate`,
  `analyze-refs.ts`). Nâng: rút gutter thật → nhồi vào spacing của template.
- **Gán vai trò vùng (title/ảnh/body) + đọc font thật = VLM (L2)**: đây là 2 chỗ `detect-regions`
  và `analyze-refs` CỐ Ý chừa (`:14-16`, `:159`). Dùng VLM đọc slide → nhãn vai trò từng ô + tên
  font gần đúng. Tuỳ chọn; thiếu → giữ lưới hình học + font-từ-gu.
- **Pattern/icon = luật**: nhiều vùng nhỏ đều + mật độ cao → gợi icon-set; có dải màu lớn → gợi
  khối nền. Không ML.

### (d) Nguồn dữ liệu học

- Template Reference `usage:'layout'`/`'slide'` (167 trang DETECH + 246 pin uxui — `GU-PROFILE.md:46`).
- `BUILTIN_TEMPLATES` (`suggest.ts` tham chiếu) làm nhãn archetype.
- Gu font/palette từ `GuProfile` (`fontsFromGu` `suggest.ts:31`).
- Feedback: user giữ/đổi template gợi ý → cập nhật trọng số archetype.

### (e) Điểm cắm vào code hiện có

- **Gutter:** mở rộng `findGaps` (`detect-regions.ts:50`) trả `{center,width}` thay chỉ center;
  `cellsFromCuts` (`:105`) dùng width để suy spacing → nạp vào template.
- **Rule → spec:** `analyzeReferences` (`analyze-refs.ts:130`) đã trả `RefRuleSet`; map sang
  `LayoutSpec` (`spec.ts:25`) qua `applySpecToSlide`.
- **Suggest:** `suggestTemplate` (`suggest.ts:46`) nhận thêm grid geometry từ `detectRegions` để
  chọn archetype sát hơn (hiện chỉ dựa #ảnh + độ dài chữ).
- **VLM vai trò/font:** module mới `lib/present-editor/analyze-vlm.ts` (đề xuất) gọi NVIDIA VLM;
  degrade về `detectRegions` + `fontsFromGu`.

### (f) Yêu cầu key/GPU + hành vi khi thiếu

- **Grid detection, archetype, tone, #hình, gutter, pattern: 0 key, 0 GPU** (thuần canvas/heuristic).
- **VLM (vai trò vùng + font thật):** cần NVIDIA free. Thiếu/hết lượt → **giữ lưới hình học +
  font-từ-gu + nhãn vai trò suy đoán theo vị trí** (ô trên-lớn = title, ô lớn giữa = ảnh). Không chặn.
- Lưu ý CORS: `detectRegions` gọi `getImageData`; ảnh cross-origin phải `crossOrigin='anonymous'`
  (`detect-regions.ts:141-145`), nếu không ném `DetectRegionsError('TAINTED')`.

### (g) Lộ trình theo pha

- **P1:** gutter thật từ `findGaps` + feed grid geometry vào `suggestTemplate`. Rủi ro thấp.
- **P2:** pattern/icon heuristic + centroid archetype + feedback trọng số.
- **P3 (chờ duyệt):** VLM gán vai trò vùng + đọc font thật (2 TODO đang chừa).

---

## 4. HẠ TẦNG CHUNG — Feature Store + vòng phản hồi (dùng chung 3 engine)

- **Feature Store nhẹ:** 1 bản ghi/asset (`CadFeature | RenderFeature | PresentFeature`), JSON +
  vector tuỳ chọn. Lưu **client trước (IndexedDB)** giống pattern moodboards, đồng bộ server sau
  (thêm cột `features` vào `LibraryAsset` hoặc bảng phụ — **migration CHỜ DUYỆT**, dùng `db push`
  không reset, khớp luật STATUS/memory).
- **PrototypeStore:** centroid theo nhóm — CAD `(operator×fn)`, Render `(subject×style)`, Present
  `(archetype)`. "Hiểu đặc tính nhóm" — nền cho gợi ý "case giống".
- **Suggestion + explainable (bắt buộc):** kNN cosine → softmax × feedbackWeight; **chỉ hiện ≥ θ**;
  dưới ngưỡng ghi "phỏng đoán"; luôn kèm 2–3 lý do ("cùng operator office, palette ΔE≈18, cùng lưới
  2-cột"). KHÔNG auto-apply.
- **Vòng phản hồi online (nhẹ, không train):** Nhận/Bỏ → `feedbackWeight ← clamp(...)` + nudge
  centroid (EMA α nhỏ). Học term workspace. On-device, không gửi PII.
- **Cold-start:** 0–5 ref → tắt kNN, chỉ L0/L1 + prior team (đọc-only), nhãn "khởi tạo". 5–30 →
  similarity lai. >30 & có key → thêm embedding/VLM.

---

## 5. BẢNG CHỐT — LÀM NGAY (tất định) vs CHỜ DUYỆT (ML nặng)

| # | Hạng mục | Chặng | Tầng | Key/GPU | LÀM NGAY hay CHỜ |
|---|---|---|---|---|---|
| 1 | Operator classifier (block/room/text) | CAD | L0/L1 | không | **LÀM NGAY** — tất định, vector sạch |
| 2 | Standards-profile mapping theo operator | CAD | L0 | không | **LÀM NGAY** — tra bảng registry |
| 3 | Occupancy-grid + adjacency typology | CAD | L0 | không | **LÀM NGAY** |
| 4 | Palette LAB + tỉ trọng (sửa `mergePalette`) | RENDER | L0 | không | **LÀM NGAY** |
| 5 | ROOM_TERMS + ánh xạ tâm-lý-màu | RENDER | L0/L1 | không | **LÀM NGAY** |
| 6 | Gutter + grid geometry → suggest | PRESENT | L0 | không | **LÀM NGAY** |
| 7 | Pattern/icon heuristic | PRESENT | L0 | không | **LÀM NGAY** |
| 8 | Centroid PrototypeStore + kNN lai + UI explainable | cả 3 | L0/L1 | không | **LÀM NGAY** (sau 1–4) |
| 9 | VLM caption nền (style/material/room) | RENDER | L2 | NVIDIA free | **NHẸ — bật khi có key**, degrade sẵn |
| 10 | VLM gán vai trò vùng + đọc font | PRESENT | L2 | NVIDIA free | **NHẸ — bật khi có key** |
| 11 | LLM parse thay `parseDescription` | CAD | L2 | NVIDIA/fal | **NHẸ — bật khi có key**, degrade về rule |
| 12 | Học term workspace + feedback online | cả 3 | L1 | không | **LÀM NGAY** (sau store) |
| 13 | Embedding thẩm mỹ + kNN ngữ nghĩa | RENDER | L2 | API/webgpu | **CHỜ DUYỆT** — chi phí/độ trễ, feature-flag |
| 14 | Detector bố trí công năng từ ảnh scan | CAD | L2+ | **model nặng** | **CHỜ DUYỆT — KHÔNG chạy local Mac** |
| 15 | Migration cột `features` vào `LibraryAsset` | store | — | không | **CHỜ DUYỆT** — `db push`, không reset |

**Đường phân giới rõ:** mục **1–8, 12** không cần AI/GPU → nền tất định vững, ship trước.
Mục **9–11** dùng API free có sẵn hạ tầng, luôn degrade → pha giữa. Mục **13–14** là ML nặng thực
sự → **chỉ khởi động khi chủ dự án duyệt** (khớp STATUS.md "ML Gu Engine chưa được phép tự build").

---

## 6. RỦI RO

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| **Chồng lấn với 2 app khác của chủ dự án** (STATUS.md ghi rõ) | Cao | Đây chỉ là ĐỀ XUẤT; không build tới khi duyệt + làm rõ ranh giới sản phẩm |
| Mac 16GB không kham model → treo/giật | Cao | Cấm model local nặng (mục 13–14 chờ duyệt); mọi L2 qua API + degrade |
| Hết NVIDIA free giữa chừng | Vừa | `NvidiaFreeExhausted` → báo UI, giữ L0/L1, không tự đổi provider |
| Từ điển hardcode chặn term mới (`gu.ts:33-44`) | Vừa | Học term workspace (mục 12) thay dần hardcode |
| `mergePalette` so-hex-khít → "màu chủ đạo" ngẫu nhiên | Vừa | Bin LAB (mục 4) |
| Gợi ý sai làm lệch gu sản phẩm | Vừa | Ngưỡng θ + explainable + gu sản phẩm > gu trung bình + không auto-apply |
| Projection-profile sai trên collage/masonry | Thấp | Chỉ dùng cho slide (đã ghi `detect-regions.ts:11-13`); không áp moodboard |
| CORS taint khi đọc ảnh cross-origin | Thấp | `crossOrigin='anonymous'` + bắt `DetectRegionsError` |
| Migration drift (IntegrationAccount tiền lệ) | Vừa | `db push`, KHÔNG `migrate reset`; chờ duyệt trước khi đổi schema |
| Feedback online trôi (drift) trọng số | Thấp | clamp η, sàn/trần trọng số, log hoàn tác, on-device |

---

## 7. Đề nghị quyết định

Xin chủ dự án duyệt **theo từng nhóm**, không all-or-nothing:
1. **Nhóm tất định (mục 1–8, 12)** — đề nghị duyệt để build trước; rủi ro thấp, không AI, không schema.
2. **Nhóm API-nhẹ (mục 9–11)** — duyệt kèm điều kiện có key + luôn degrade.
3. **Nhóm ML nặng (mục 13–14) + migration (15)** — **giữ ở trạng thái CHỜ**, chỉ mở khi làm rõ
   chồng lấn sản phẩm và có phương án GPU (máy render RTX công ty, không phải Mac).
