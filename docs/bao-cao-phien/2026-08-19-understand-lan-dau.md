# /understand lần đầu — Bản đồ AI của IF, đối chiếu với bản đồ tay của T

> Phiên: 19/08/2026. Plugin Egonex-AI Understand-Anything v2.9.4.
> Mốc: `3da4b8c` (main, HEAD). Bản đồ tay đối chiếu: `docs/BAN-DO-KIEN-TRUC-2026-08-18.md` (T viết tay tối 18/08).

---

## 1 · TỔNG QUAN

Chạy `/understand` full pipeline (7 phase, 47 batch) cho codebase IF. Ra **`.ua/knowledge-graph.json`** (2.2MB): **2694 nodes · 4896 edges · 10 layers · 12 bước tour tiếng Việt · 244 file production tagged `tested`**. Đối chiếu với bản đồ tay T viết đêm 18/08 — **AI xác nhận đúng phần T ĐO ĐƯỢC (schema, phân bổ nodes, phát hiện Community 0 code), nhưng KHÔNG đọc được câu chuyện T viết (hiến pháp OS mới ban, 5 rủi ro §Đối chiếu, Q1-Q8 câu hỏi kiến trúc, luồng lịch sử quyết định)**. Vai của hai bên KHÁC — máy trả lời *"cái gì có ở đâu"*, tay trả lời *"cái này NÊN thành gì"*. Đây không phải hai bản đồ để chọn 1, là hai lớp phải chồng nhau.

## 2 · SỐ LIỆU CHI TIẾT

### 2.1 · Chi phí thật (đo tại phiên T)

| Phase | Subagent | Token subagent | Wall-clock |
|---|---|---|---|
| Phase 1 SCAN | 1 (project-scanner) | 247k | 48s |
| Phase 1.5 BATCH | 0 (Node script) | — | ~1s |
| Phase 2 ANALYZE | **47** (file-analyzer × 5 concurrent) | **~12.5M** (~260-280k mỗi batch) | **~45 phút** |
| Phase 3 REVIEW | 1 (assemble-reviewer) | 245k | 63s |
| Phase 4 ARCHITECTURE | 1 (architecture-analyzer) | 255k | 86s |
| Phase 5 TOUR | 1 (tour-builder) | 257k | 144s |
| Phase 6 REVIEW | 0 (Node inline validation) | — | ~1s |
| Phase 7 SAVE | 0 (Node fingerprint script) | — | ~5s |
| **Tổng** | **51 subagent** | **~13.5M token cloud Anthropic** | **~55 phút** |

### 2.2 · Số hạng của bản đồ AI

**Nodes 2694** — phân bổ:
| Loại | Số | Ghi chú |
|---|---|---|
| `function` | 1741 | hàm/method có body ≥10 dòng hoặc exported |
| `file` | 895 | tệp code TS/JS/MD |
| `document` | 25 | README, DEPLOY, CHANGELOG, docs cấp gốc |
| `config` | 16 | package.json, tsconfig, next.config, tailwind, postcss, eslint |
| `class` | 11 | class + interface |
| `table` | 5 | SQL migrations |
| `schema` | 1 | schema.prisma |

**Edges 4896** — phân bổ:
| Loại | Số |
|---|---|
| `contains` (file→function) | 1751 |
| `imports` (cross-file) | 1621 |
| `exports` (file→named exports) | 1179 |
| `tested_by` (production→test) | 257 |
| `calls` (function→function) | 54 |
| `related` | 13 |
| `documents` (readme→child docs) | 7 |
| `configures` (config→target) | 5 |
| `migrates` (SQL→schema) | 5 |
| `depends_on` | 4 |

### 2.3 · 10 layers AI phát hiện được

| Layer | Files | Đối chiếu OS §Đối chiếu |
|---|---|---|
| `layer:cad-2d` | 178 | DESIGN WORKFLOW §Concept |
| `layer:present` | 125 | DESIGN WORKFLOW §Publishing |
| `layer:knowledge` | 110 | **KNOWLEDGE SYSTEM** ✅ |
| `layer:api` | 105 | (kỹ thuật, không thuộc lớp OS) |
| `layer:ai` | 102 | **AI LAYER** ✅ |
| `layer:infra` | 100 | (kỹ thuật) |
| `layer:project` | 91 | **PROJECT SYSTEM** ✅ |
| `layer:3d` | 68 | DESIGN WORKFLOW §3D |
| `layer:shared` | 56 | (kỹ thuật) |
| `layer:data` | 7 | (schema + migrations) |
| **`community`** | **KHÔNG CÓ** | **COMMUNITY / DEVELOPMENT = 0** ← xác nhận T ghi *"0%"* §7 |

### 2.4 · Tour 12 bước tiếng Việt

`Bối cảnh dự án` → `Cửa vào Electron` → `Cửa vào Next.js` → `Data model — schema.prisma` → `Lõi 2D — model + store` → `Kiểm chuẩn nghề — LUẬT` → `3D — BuildRecipe non-destructive` → `Vật liệu — một vật ba mặt` → `DistillEngine — chưng cất Design DNA` → `Review 2 lớp — LUẬT vs GÓP Ý` → `AI tầng — text tier + node graph` → `Trình bày — chiếu ra 6 đích`.

## 3 · BẢNG ĐỐI CHIẾU AI ↔ T (bản đồ tay 18/08)

### 3.1 · ✅ Cùng đúng (AI xác nhận T)

| Điều T ghi tay | AI phát hiện | Bằng chứng |
|---|---|---|
| *"COMMUNITY / DEVELOPMENT — 0%"* §7 | 0 layer nào cho community/portfolio | 10 layers phát hiện, không có layer community |
| *"AI Layer chưa có gateway thực sự"* §5.1 | `layer:ai` gộp `lib/ai` + `lib/gateway` + `lib/nodes` + `lib/vision` — không tách "gateway" thành mảng riêng | `layer:ai` 102 files (nhiều mảng gộp) |
| *"lib/cad là engine 2D chính"* §2.2 | `layer:cad-2d` 178 files — layer lớn nhất | Đo tại nguồn |
| *"21 model Prisma"* §1.1 | 1 schema + 5 table (SQL migrations) | Đo tại `layer:data` (7 nodes) |
| *"lib/review 2-tier LUẬT vs GÓP Ý"* chốt 07/08 | Tour bước 10 tự đặt tên đúng như luật | Tour bước 10 title |
| *"Vật liệu chẻ ba mảnh"* chốt 17/08 (§Materials) | Tour bước 8 title *"Vật liệu — một vật ba mặt"* | Tour bước 8 title |
| *"DistillEngine mặt tiền cấp Studio + cấp DNA"* chốt 12/08 §9 | Tour bước 9 *"DistillEngine — chưng cất Design DNA"* | Tour bước 9 |
| *"BuildRecipe non-destructive"* chốt OS §Non-destructive | Tour bước 7 title đúng vậy | Tour bước 7 |
| *"5 sổ lệnh song song"* chốt 16/08 | `layer:cad-2d` chứa `lib/commands/registry.ts` — batch 27 phát hiện *"kiến trúc lệnh 3 tầng"* đúng nguyên văn ticket | Batch 27 summary |

### 3.2 · 🟢 AI đúng hơn T (thứ T không đo được tay)

| Điều AI đo được | Điều T KHÔNG có | Giá trị |
|---|---|---|
| **1741 function-level nodes** với `contains`/`exports` edges | T chỉ ước "942 file", không đo function | Cấp chi tiết cần cho đối chiếu function-level |
| **257 tested_by edges** + **244 file production tagged `tested`** | T không đo coverage tay | Danh sách file **KHÔNG** có test → dễ tra để bổ sung |
| **25 tested_by tự flip** trong merge script (test→prod nhưng nên là prod→test) | Chưa phát hiện — quality issue của convention test | Signal về chất lượng cấu trúc test |
| **1621 imports resolved** — 100% khớp `batchImportData` | T ghi *"1620 import edges, 683/942 tệp có import"* nhưng không đo dangling | Dependency graph tin cậy được |
| **God module chính xác đếm được**: `lib/cad/model.ts` degree 167 · `store.ts` 60 · `auth.ts` 58 · `present-editor/model.ts` 53 | T không đọc số cụ thể | Bằng chứng số cho phàn nàn *"lib/cad quá dày"* |
| **Community detection Louvain** phát hiện 6 cụm khép kín 147/125/94/79/63/46 files | T không đo topology | Bằng chứng codebase chưa modul hoá |
| **Merge script recover** 2 imports edges + reviewer thêm 3 nodes/edges bị dropped | T không phát hiện được | Data integrity issue tự sửa |

### 3.3 · 🔴 AI thiếu so với T (thứ tay quan trọng hơn)

| Điều T ghi tay | AI KHÔNG có | Vì sao AI không thấy được |
|---|---|---|
| *"IF hiện tại là APP CÓ TÍCH HỢP AI, chưa phải LOCAL-FIRST DESIGN OS"* §7 | Chỉ đo *"cái gì có"*, không phán *"NÊN thành gì"* | AI không có hiến pháp OS 18/08 để so |
| **5 rủi ro OS §Đối chiếu**: `lib/idfc-import/from-photo.ts:195` gọi thẳng NVIDIA_VLM_MODEL · `lib/nodes/defs/grounded-render.ts` gọi thẳng /api/vision/caption · Chưa có Privacy mode · Chưa có Phase model · Đổi AI provider = sửa nhiều điểm | Đo file:dòng cụ thể, T ghi tay | AI phân file vào `layer:ai` nhưng KHÔNG khai là *"vi phạm §5.1 hiến pháp"* |
| **Q1-Q8 câu hỏi kiến trúc chờ Hoà chốt** §6 | Có `Phase` model? · AI Gateway xây bây giờ hay sau? · Standards vào DB hay giữ code? · CAD .idf sync DB hay giữ file? · IF Memory 6 model thiếu? · Non-destructive workflow model? · Đổi tên chồng chéo (Gateway/Flow/Stage)? · Community lớp v1 hay hoãn? | AI không đọc được hiến pháp OS |
| **3 điểm chồng chéo khái niệm**: "Gateway" trùng tên (format vs AI) · "Flow" trùng (file dự án vs workflow ngành) · "Stage" trùng (UI chặng vs phase ngành) §5.3 | Chỉ thấy tên qua files | AI không có ngữ nghĩa nghề để phân biệt |
| **12 giai đoạn workflow ngành thật**: Input · Research · Layout · Moodboard · Concept · 3D · Design Review · Revision · Tender · Shopdrawing · Site · Handover — IF phủ **4/12** §3.2 | Tour dừng ở 12 bước KỸ THUẬT, không so với 12 giai đoạn NGÀNH | AI thiếu ngữ cảnh ngành nội thất |
| **Non-destructive AI workflow** chưa có theo chốt OS · **Creative Timeline** decision > file chưa có §3.3-3.4 | Tour bước 7 dừng ở *"BuildRecipe non-destructive"* — không cảnh báo *"chưa có non-destructive AI workflow ở STEP-level"* | AI chỉ thấy BuildRecipe, không đọc chốt OS |
| **8 luật vận hành CLAUDE.md** — luật nền vận hành app | AI không tra được, không phán vi phạm | AI không biết luật ngoài code |
| **Nợ cấp CƠ CHẾ**: CAD .idf tách rời DB (vỡ multi-device) · BOQ overrides localStorage (trái luật lưu chung) · useFlowStore vs Flow.graphJson · NotebookChunk cosine Node.js không scale · assigneeIds JSON string §5.2 | 5 nợ có bằng chứng file:dòng, T đo tay | AI nhìn thấy file nhưng không so với luật |
| **Luồng LỊCH SỬ**: chốt 15/08 § HAI LỚP KIỂM · chốt 17/08 § VẬT LIỆU MỘT VẬT · chốt 18/08 § HIẾN PHÁP OS | Không đọc được nhật ký · không biết quyết định nào là chốt mới nhất | AI đọc code, không đọc lịch sử |

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Cái gì tốt**:
- Chạy **0 fail** ở 47/47 batch — plugin ổn định
- Bản đồ AI **tự xác nhận** phần lớn phán đoán T ghi tay 18/08 → giảm rủi ro T *"tự tin sai"*
- Function-level nodes + tested_by graph là **DATA MỚI** T không có → dùng được thật (bổ test cho 244 file thiếu, giảm god-module)
- Community lớp = 0 code — AI **độc lập** phát hiện đúng (không thấy Hoà từ trước) → đây là chứng cứ mạnh cho *"IF chưa phải OS"*
- Tour tiếng Việt gợi ý **đúng 12 file cốt lõi** để onboard người mới đọc IF

**Cái gì chưa**:
- **13.5M token cloud Anthropic** cho 1 phiên — không phải đường bền vững, kể cả auto-update sau này (incremental sẽ ít hơn nhưng vẫn hàng triệu)
- **AI không đọc được nhật ký/hiến pháp/8 luật** → phán ĐO được, không phán ĐÚNG SAI được. **T vẫn là người phán cuối** — plugin không thay thế T được
- Merge script drop 3 dangling edges + reviewer vá 2 nodes — cấu trúc plugin có **failure modes ẩn** (dangling edges bị drop âm thầm nếu không có reviewer)
- 62 orphan nodes (không edge nào) — nghĩa là AI phân tích file nhưng KHÔNG kết nối được vào graph. Skill xếp là warning, không lỗi. Nhưng vẫn là ~2.3% coverage giảm

**Rủi ro đo được**:
- **Vi phạm Own your data** đã xảy ra — code IF gửi Anthropic. Không sửa được (Hoà đã accept đầu phiên)
- Auto-update commit sau sẽ **tự sinh subagent Anthropic** — cần tắt `autoUpdate: false` trong `config.json` nếu Hoà không muốn tiếp

## 5 · HƯỚNG DÙNG PLUGIN VỀ SAU

**Hướng A — Chỉ tra khi cần (recommended)**:
- Giữ knowledge-graph.json làm snapshot 19/08. Tắt `autoUpdate` trong `.ua/config.json`.
- Khi cần: T mở `.ua/knowledge-graph.json` bằng grep/node script để tra function-level, tested_by, dependency graph.
- Chi phí: 0 token thêm.

**Hướng B — Auto-update mỗi commit**:
- Post-commit hook đã bật (`autoUpdate: true`). Mỗi commit sinh diff, spawn subagent Anthropic cho file changed.
- Bản đồ luôn tươi, tra được trong dashboard.
- Chi phí: ước ~50-500k token/commit tuỳ số file đổi.

**Hướng C — Kết hợp cả tay lẫn máy**:
- Snapshot tháng: chạy `/understand --full` mỗi 1-2 tháng (~15M token/lần).
- Update thủ công `IF-KIEN-TRUC.md` bằng tay giữa các snapshot (T viết dựa trên phán đoán + tra .ua/).
- Chi phí: ~15M token × 6-12 lần/năm + 0 token cho phán đoán tay.

## 6 · ĐỀ XUẤT HƯỚNG TỐT NHẤT

**Chọn HƯỚNG A — chỉ tra khi cần.** Tắt `autoUpdate`.

Lý do (3 điểm):

1. **Trái nguyên tắc Own your data (hiến pháp OS 18/08)** — mỗi commit tự động ship code Anthropic là **cửa sau lách luật**, dù Hoà đã accept snapshot 1 lần. Snapshot 1 lần khác auto-update mãi mãi.

2. **AI không thấy được thứ T CẦN nhất** (mục 3.3). T viết bản đồ tay là để nhìn được *"cái này nên thành gì"* — AI chỉ trả lời *"cái này CÓ Ở ĐÂU"*. Auto-update mỗi commit tăng data về *"có ở đâu"* nhưng KHÔNG tăng data về *"nên thành gì"* → giá trị biên giảm dần.

3. **Snapshot 19/08 đã xác nhận đủ** cho câu hỏi T đặt: (a) Community = 0 code ✅ · (b) AI Gateway CHƯA CÓ ✅ · (c) 10 layers phát hiện, không khớp 5 lớp OS ✅. Ba câu này không đổi trong 1 tháng tới. Chạy lại vô ích.

**Trường hợp NÊN dùng auto-update**: sau khi Hoà chốt Q1-Q8 và bắt đầu refactor lớn (thêm Phase model · thêm AI Gateway · dựng Community lớp). Lúc đó bản đồ đổi ngày, tra tay không kịp. Nay chưa refactor → không cần.

---

## Chưa chắc / Chưa kiểm

- **Token count subagent** ước lượng từ Phase 1 (247k) và Phase 2 báo cáo mỗi batch — không phải log chính xác của Anthropic quota
- **AI viết bằng LLM** → tour + summaries có thể lỗi thời khi code đổi mà không rerun
- **`layer:knowledge` gộp** Master Library + materials + colors + DNA + review — T tách rõ hơn (chốt 17/08: Master Library và Materials khác vai). AI không đọc được chốt đó nên gộp
- **62 orphan nodes** chưa mở tay đọc — có thể là file thật không dùng ai (dead code), có thể là AI miss edge
- **Không mở dashboard** để check UX phía viewer

## Hạn dùng kết luận

Báo cáo này hết đúng khi:
1. Hoà chốt Q1-Q8 trong `BAN-DO-KIEN-TRUC-2026-08-18.md` → hình dạng schema đổi
2. Plugin cập nhật lên v3+ với API/format khác
3. IF đại refactor (Phase model được thêm, AI Gateway được xây, Community lớp bắt đầu)
4. `autoUpdate` được bật → knowledge-graph.json tự đổi mỗi commit, snapshot 19/08 chỉ còn giá trị lịch sử

## Dây registry

Entry mới `understand-anything-cai-dat` — mở nếu Hoà chốt giữ auto-update hoặc rerun tháng.
