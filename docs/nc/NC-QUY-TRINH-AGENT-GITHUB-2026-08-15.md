# NC · Quy trình AI-agent-driven development trên GitHub — đối chiếu với IF

> Agent: RG1 (nghiên cứu, không code). Phạm vi: QUY TRÌNH + CÔNG CỤ + CẤU TRÚC REPO — KHÔNG đụng
> mảng "nghiệm thu bằng mắt cho người không biết code" (đó là RG2). Ngày: 15-16/08/2026.
> Phương pháp: WebSearch + WebFetch (không có quyền `gh`/git trong phiên này). Mọi số sao là
> ảnh chụp tại thời điểm nghiên cứu, dao động ngày này qua ngày khác — xem HẠN DÙNG cuối file.

---

## 1 · Tổng quan

Tìm được **3 khung quy trình lớn, đang sống, hàng chục nghìn sao** (`github/spec-kit`,
`bmad-code-org/BMAD-METHOD`, `Fission-AI/OpenSpec`) cùng giải một bài toán gốc giống IF: **con
người ra ý định bằng lời, AI-agent viết code, cần một cơ chế chặn để ý định không bị hiểu sai mà
không ai bắt được.** Cách họ giải: bắt buộc một **tài liệu "hiến pháp"** đứng trước mọi spec
(giống `TRIET-LY-IF.md` của IF), một **chuỗi gate tuần tự** specify→plan→tasks→implement (giống
khuôn phiếu giao việc của T), và ngày càng nhiều dự án gắn thêm **cổng CI đọc spec, chặn merge
khi lệch** (giống `soi:frontier`/`soi:hinh-hoc`/`soi:thao-tac` của IF). Điểm IF THIẾU rõ nhất so
với cả ba: **không có yêu cầu AI tự khai "tôi vừa tự động làm gì, mức giám sát nào" ngay trong
commit** — spec-kit bắt buộc trailer `Assisted-by:` cho việc này, IF chỉ có báo cáo cuối phiên
(dễ quên, không gắn vào từng commit).

---

## 2 · Chi tiết từng mục (A→E theo đề bài)

### A · Khung quy trình phát triển bằng AI agent đang dùng thật

| Khung | Sao (thời điểm đo) | Giấy phép | Còn sống? | Bắt buộc bước gì | Vai trò | Cổng duyệt |
|---|---|---|---|---|---|---|
| **[github/spec-kit](https://github.com/github/spec-kit)** | ~120–129K, dao động mạnh trong tháng, xem HẠN DÙNG (star-history ghi 120.2K 14/07; gstars.dev ghi 129.2K khi RG1 kiểm) | MIT | Có — hoạt động rất tích cực, "công cụ dev tăng nhanh nhất GitHub tháng 6-7/2026" (nguồn: dailyaiworld.com) | `/speckit.constitution` → `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`, có thêm `/speckit.analyze` (soi chéo spec↔plan↔task) và `/speckit.checklist` | Người: viết constitution + duyệt spec. Agent: sinh plan/task/code theo spec đã duyệt | `/speckit.analyze` chặn khi spec-plan-task lệch nhau trước khi cho `/implement` chạy |
| **[bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)** | ~51.9K (nguồn WebFetch trang repo) | MIT | Có — từ ~37K (tháng 2) lên ~49-52K (tháng 6-8/2026), tăng nhanh | Không có lệnh CLI cố định như spec-kit; dùng **12+ persona agent** (PM, Architect, UX, Dev, QA…) thảo luận nhiều-agent trước khi code, mỗi persona giữ một góc chuyên môn | Người: "giữ quyền quyết định những gì quan trọng" (nguyên văn: *"keep making the decisions that matter"*) — KHÔNG giao phán đoán cho agent | Không có gate máy cứng công khai trong tài liệu đọc được; có module doanh nghiệp "BMad Test Architect" cho QA, nhưng nội dung gate cụ thể RG1 KHÔNG kiểm chứng được — CHƯA CHẮC |
| **[Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)** | ~54–64.6K tuỳ nguồn (dao động lớn trong 1 tháng — số liệu KHÔNG ổn định, xem HẠN DÙNG) | Không xác nhận được license cụ thể trong lần fetch này — CHƯA KIỂM | Có — ra mắt 08/2025, bản ổn định v1.0 | `propose → apply → archive`, đơn vị làm việc là **"delta spec"** (chỉ đặc tả PHẦN THAY ĐỔI, không viết lại toàn bộ spec) | Người + AI cùng thống nhất spec TRƯỚC khi có dòng code nào | Bước `apply` chỉ chạy sau khi delta spec được duyệt; archive hoá lại làm lịch sử |
| **AGENTS.md ([agentsmd/agents.md](https://github.com/agentsmd/agents.md))** | ~23.7K | MIT | Có | Không phải pipeline — là QUY ƯỚC 1 FILE: "Dev environment tips · Testing instructions · PR instructions" | Không phân vai — chỉ là bản HDSD cho agent trước khi bắt tay việc | Không có gate riêng; gate nằm ở CI/test mà file này TRỎ tới |
| **[humanlayer/12-factor-agents](https://github.com/humanlayer/12-factor-agents)** | ~25.1K (star-history), ~23.5K (nguồn khác cùng kỳ) | Không kiểm license lần fetch này — CHƯA KIỂM | Có | Không phải pipeline, là 12 NGUYÊN TẮC kỹ thuật (giống 12-factor app cũ) cho việc build agent-software đáng tin — không phải quy trình DUYỆT, mà quy trình VIẾT AGENT | — | — |

### B · Repo THẬT dùng quy trình đó ở quy mô lớn (không phải repo mẫu)

Nguồn: bài "6 AGENTS.md Examples From Real Production Repos" (ssojet.com) — RG1 fetch trực
tiếp, số sao trong bài, KHÔNG tự kiểm chứng lại từng repo — xem HẠN DÙNG.

| Repo | Sao | Cách họ chia vai trong AGENTS.md |
|---|---|---|
| `openai/codex` | ~92.6K | Luật lint chặt (bắt buộc match-statement không được có wildcard arm) + khoá cứng: agent KHÔNG được sửa biến môi trường của sandbox |
| `getsentry/sentry` | ~44.1K | Chốt "AGENTS.md là NGUỒN SỰ THẬT DUY NHẤT cho chỉ dẫn agent" — cấm lệch ra CLAUDE.md/Cursor rules riêng (đúng bài học `docs/00-CHOT.md` của IF: một sổ mục lục, không phân mảnh) |
| `apache/airflow` | ~45.9K | Cấm agent chạy pytest trực tiếp trên host — bắt buộc qua tool `breeze` đóng gói sẵn (cách li môi trường, tránh agent phá máy thật) |
| `temporalio/temporal` | ~21.1K | Gán agent vai "lập trình viên có kinh nghiệm" + **bắt buộc review trước khi implement** — gần nhất với cơ chế T/V của IF (duyệt kiến trúc trước khi cho code chạy) |
| `cloudflare/workers-sdk` | ~4.2K | Luật đầu tiên: "dùng pnpm — never npm/yarn" — bảo vệ lockfile monorepo khỏi agent dùng nhầm tool |
| `coder/coder` | ~13.6K | Luật hành vi/giọng điệu: cấm câu xu nịnh kiểu "You're absolutely right!", bắt buộc xin phép trước khi phá luật nào |

**Điểm chung 6 repo**: KHÔNG repo nào tạo ra bộ máy nặng như spec-kit — tất cả chỉ có MỘT file
AGENTS.md ngắn, tập trung vào **luật cấm cụ thể + trỏ vào CI có sẵn**, không phải quy trình
nhiều bước. Đây là bằng chứng thực chiến: dự án lớn thật KHÔNG cần pipeline 5 bước, chỉ cần
luật rõ + cổng máy chặn.

### C · Cấu trúc tài liệu điều khiển agent — so sánh các quy ước

| Kiểu | Đại diện | Ưu điểm quan sát được | Nhược điểm quan sát được |
|---|---|---|---|
| **1 file lớn duy nhất** ("constitution") | `spec-kit/memory/constitution.md` | Một nguồn, không phân mảnh; các Điều IV-VI cố ý để trống cho từng dự án tự điền — ĐÚNG khuôn `docs/00-CHOT.md` của IF (mục lục 1 dòng/quyết định) | Dự án lớn (spec-kit khuyến nghị) vẫn phải kèm spec RIÊNG cho từng feature — 1 file không đủ ở quy mô lớn |
| **1 file nhỏ, thẳng vào việc** (AGENTS.md kiểu sentry/coder) | 6 repo ở mục B | Ngắn, đọc hết trong 1 phút, agent không "quên phần cuối" (đối chiếu với ghi chú tìm được trong nghiên cứu CLAUDE.md: *"trên 80 dòng, Claude bắt đầu bỏ qua phần sau; HumanLayer giữ dưới 60 dòng"* — nguồn: rosmur.github.io) | Không đủ chỗ cho lý do "vì sao" — chỉ có luật, không có bối cảnh quyết định (thiếu phần mà `docs/00-CHOT.md` của IF làm tốt: "quyết định này giải quyết gì") |
| **Nhiều file nhỏ theo thư mục** (`docs/adr/NNNN-*.md`, "ADR") | Quy ước ADR cổ điển, nay có bản "tối ưu cho agent đọc" (nguồn: actual.ai/blog/agent-optimized-adrs) | Mỗi quyết định 1 file, 5 mục cố định (Title/Status/Context/Decision/Consequences) → agent tra được ĐÚNG quyết định cần, không phải đọc cả sổ | Không có cơ chế nào tự kiểm "quyết định trong ADR có khớp code hiện tại" — dễ ADR nói một đằng, code chạy một nẻo, không ai phát hiện (đây CHÍNH LÀ bệnh mà `docs/00-CHOT.md` ghi rõ: *"01/08 Cowork ba lần thiết kế lại thứ đã có sẵn vì không thấy chúng"*) |
| **Spec riêng cho từng tính năng + registry máy đọc** | `PRD-driven-context-engineering` (mattgierhart, 193 sao — nhỏ, KHÔNG phải bằng chứng quy mô lớn) | `SoT/` (Source of Truth) chia theo LOẠI quyết định, mỗi mục 1 ID duy nhất; `readiness.json` tự chấm "đã đủ để sang giai đoạn kế chưa" — gần giống `frontier-registry.mjs` của IF | Repo nhỏ, chưa có bằng chứng dùng ở quy mô lớn — CHƯA KIỂM ngoài README |

**Bằng chứng "cái nào hiệu quả"**: KHÔNG tìm được số liệu định lượng đáng tin (vd. "giảm X% lỗi
hiểu sai") cho bất kỳ cấu trúc nào — mọi tuyên bố hiệu quả trong các nguồn trên là tự thuật của
tác giả repo, không phải nghiên cứu độc lập. Bằng chứng gián tiếp mạnh nhất: **6 repo hàng chục
nghìn sao ở mục B đều chọn "1 file nhỏ" chứ không chọn constitution nặng** — cho thấy ở quy mô
production thật, đơn giản thắng.

### D · Cổng chặn tự động (CI/lint/test-từ-spec)

| Cơ chế | Repo/nguồn | Làm gì | So với IF |
|---|---|---|---|
| **CI Guard** (extension cộng đồng cho spec-kit) | speckit-community.github.io/extensions/ci-guard, tác giả Quratulain-bilal, MIT, "cập nhật 4 tháng trước" tại thời điểm RG1 tra — **không rõ còn được bảo trì tích cực** | 5 lệnh: `ci.check` (soi spec↔code↔test), `ci.report` (ma trận truy vết requirement→code→test, chỉ ra khoảng trống), `ci.gate` (cấu hình `.speckit-ci.yml`, 3 mức strict/moderate/relaxed), `ci.drift` (lệch 2 chiều spec↔code), `ci.badge` | **Gần như song sinh** với `soi:frontier` (registry máy-đọc + báo lệch 2 chiều) — khác biệt: CI Guard chặn ở **merge** (CI pipeline), `soi:frontier` chặn ở **đầu phiên** (exit 1 trước khi bàn việc mới). IF KHÔNG có bước chặn ở merge/CI thật — vì IF chưa có CI pipeline (`grep` chưa xác nhận `.github/workflows` — CHƯA KIỂM trong phiên này, ngoài phạm vi RG1) |
| **Drift gate — "Spec Growth Engine"** (bài nghiên cứu arxiv 2606.27045, KHÔNG phải repo có sao — là paper) | arxiv.org/html/2606.27045 | AST-parse code → gắn tag `@implements`/`@verifies` nối vào `status/devgraph.json`, đo `architecture_conformance`; drift-gate là **điều kiện chặn merge** | Ý tưởng "gắn tag code↔spec rồi máy tự đo % khớp" IF CHƯA CÓ — `soi:frontier` hiện dựa trên grep chuỗi trong registry, không phải AST/tag hai chiều thật sự nối vào từng dòng code |
| **Requirement→test traceability tự sinh** | mô tả chung trong nhiều nguồn SDD (kinde.com, augmentcode.com) | "Tiêu chí nghiệm thu = input trực tiếp để sinh test" — executable spec chạy như BDD scenario, build fail nếu code không khớp | IF có `CHUAN-DAU-RA-NGHE.md` (checklist nhị phân, export-checks marker `CHUAN_DAU_RA`) — **cùng tinh thần**, nhưng IF's gate là do người tick tay + máy chặn xuất file, KHÔNG sinh test tự động từ spec |
| **`Assisted-by:` trailer bắt buộc trong mọi commit** | `github/spec-kit/AGENTS.md` (RG1 fetch trực tiếp) | Mọi commit AI-agent viết phải ghi `Assisted-by: <tên agent> (model: <tên>, autonomous/supervised)`; cấm "đẩy commit đơn tác giả che giấu việc agent viết"; cấm claim "đã đọc hiểu" cho thay đổi tự động | **IF KHÔNG CÓ** cơ chế này ở cấp commit — chỉ có báo cáo phiên rời (`docs/bao-cao-phien/`), dễ thất lạc, không gắn cứng vào git history nên không tra ngược được "commit này T tự quyết hay Hoà duyệt" |

### E · Bảng so sánh thẳng với IF

| | IF ĐÃ CÓ | Họ có mà IF THIẾU | IF có mà họ không có |
|---|---|---|---|
| Sổ luật nền | `CLAUDE.md` + `TRIET-LY-IF.md` (đóng vai constitution.md) | — | IF: luật nền GẮN TRỰC TIẾP với triết lý sản phẩm (T0-T8, 7 cấm kỵ) — spec-kit's constitution chỉ để trống Điều IV-VI cho dự án tự điền, không có sẵn khung triết lý |
| Sổ mục lục quyết định | `docs/00-CHOT.md` (1 dòng/quyết định, chống đọc lại toàn bộ docs) | ADR "agent-optimized" (Title/Status/Context/Decision/Consequences, MỖI quyết định 1 file riêng, có ID tra ngược) | `00-CHOT.md` gom NHIỀU quyết định vào 1 file dài dần — đến 200 dòng phải cắt; ADR chia nhỏ theo file nên không có trần cứng |
| Registry máy-đọc theo dõi tính năng | `scripts/frontier-registry.mjs` + `soi:frontier` (đếm xong-máy/xong-mắt, gợi ý group-by theo vai) | CI Guard's traceability MATRIX (requirement→code→test, độ phủ %) và Spec Growth Engine's `@implements`/`@verifies` tag nối THẲNG vào dòng code (không phải chỉ registry mô tả bằng lời) | IF: `soi:frontier` đã phân loại theo VAI (MVP/Kết nối/Đỡ) và tự gợi nhóm — CHƯA thấy công cụ nào ở A-D có tính năng "gợi nhóm theo vai" này |
| Cổng duyệt người trước khi code | Vai T (điều phối) + agent V (kiểm chéo) + "xong-máy ≠ xong-mắt" | spec-kit: `/speckit.analyze` là gate MÁY, không phải người, chạy TRƯỚC khi cho `/implement`; nhiều repo lớn (temporal) ghi rõ "pre-implementation review" là bước bắt buộc trong AGENTS.md — tức là NGƯỜI review đứng NGAY SAU khi có plan, TRƯỚC khi agent viết code | IF's cổng duyệt hiện đa số nằm ở CUỐI (nghiệm thu mắt sau khi code xong) — ít cổng duyệt Ở GIỮA (sau khi có plan/spec, trước khi cho code chạy) |
| Khai báo mức tự động của AI trong lịch sử | Không có — chỉ báo cáo phiên rời | `Assisted-by:` trailer bắt buộc mỗi commit (spec-kit) | — |
| Chặn ở CI/merge thật | Không có CI pipeline xác nhận | Hầu hết framework lớn (spec-kit + CI Guard, Spec Growth Engine) đặt gate ở BƯỚC MERGE, không chỉ đầu phiên | `soi:frontier` chạy ĐẦU PHIÊN — sớm hơn CI (bắt lỗi trước khi bắt đầu, không phải sau khi code xong mới chặn) — đây có thể là **điểm mạnh của IF**, không phải điểm yếu, vì Hoà không code nên "chặn ở PR" không có ý nghĩa (không có PR review flow người-người) |

---

## 3 · Tổng kết lại vấn đề

Bức tranh chung: **hoàn cảnh của IF (một người không biết code, ra ý định bằng lời, AI viết hết,
cần cơ chế chặn hiểu-sai) không phải hiếm — nó là chính xác bài toán mà `spec-kit`, `OpenSpec`,
`BMAD-METHOD` đang giải ở quy mô hàng chục nghìn người dùng.** Cấu trúc của IF (constitution +
sổ mục lục quyết định + registry máy đọc + vai điều phối T) đã đi ĐÚNG hướng mà 3 khung lớn nhất
đều chọn — không phải phát minh lại bánh xe theo hướng sai. Nhưng có MỘT khoảng trống lặp lại ở
cả 3 khung LỚN lẫn 6 repo THẬT ở mục B mà IF chưa có: **gắn trạng thái "ai duyệt, agent tự động
tới đâu" vào TỪNG COMMIT** (không chỉ báo cáo cuối phiên) — đây là chỗ rẻ nhất để bê về, vì chỉ
là quy ước format commit message, không cần code mới.

---

## 4 · Đánh giá khách quan

**Tốt (kiểm chứng được):**
- spec-kit, BMAD, OpenSpec đều MIT, đang sống rất mạnh (không phải trend đã tắt) — đối chiếu an toàn.
- 6 repo thật ở mục B (openai/codex, sentry, airflow, temporal, cloudflare, coder) là bằng chứng
  **KHÔNG PHẢI lý thuyết** — đây là cách các đội hàng chục-hàng trăm kỹ sư thật đang giới hạn agent.
- Phát hiện `Assisted-by:` trailer là cụ thể, trích được nguyên văn, dễ áp dụng ngay.

**Chưa chắc / rủi ro của chính nghiên cứu này:**
- Số sao dao động lớn giữa các nguồn cùng kỳ (spec-kit: 111K→129K trong 2 tháng; OpenSpec:
  54K→64.6K "trong 1 tháng" theo chính 1 nguồn) — RG1 KHÔNG có quyền gọi GitHub API thật trong
  phiên này (không có `gh`/curl được cấp), toàn bộ số liệu qua WebSearch/WebFetch — có thể đã bị
  cache cũ hoặc mô hình fetch "làm tròn/nhớ nhầm". Coi mọi số sao trong file này là **ước lượng
  bậc-độ-lớn** (order of magnitude), KHÔNG phải số chính xác ngày hôm nay.
- License của OpenSpec và 12-factor-agents: RG1 KHÔNG xác nhận được qua các lần fetch — cần tự
  kiểm nếu định bê nguyên văn cấu trúc (MIT thường an toàn để tham khảo ý tưởng, nhưng nếu định
  COPY nguyên file mẫu thì phải xác nhận license trước).
- CI Guard (mục D) là extension CỘNG ĐỒNG, không phải chính chủ spec-kit, "cập nhật 4 tháng
  trước" — rủi ro dự án chết, không nên coi là bằng chứng "một công cụ CI Guard trưởng thành đang
  chạy ở nhiều nơi", chỉ nên coi là Ý TƯỞNG đã có người thử.
- BMAD-METHOD: RG1 KHÔNG lấy được mô tả cụ thể "quality gate" hoạt động ra sao (trang repo không
  lộ chi tiết, chỉ nhắc chung chung) — phần này trong bảng mục A đã đánh dấu CHƯA CHẮC, đừng coi
  là đã kiểm chứng.
- Không tìm được bằng chứng ĐỊNH LƯỢNG (số liệu nghiên cứu độc lập, không phải tự thuật của tác
  giả) cho câu hỏi "cấu trúc tài liệu nào hiệu quả hơn" — kết luận ở mục C dựa trên suy luận gián
  tiếp (6 repo lớn chọn file nhỏ), không phải số đo trực tiếp.

---

## 5 · Hướng xử lý nhiều góc độ

**Hướng A — Bê nguyên `Assisted-by:` trailer + pre-implementation review làm gate giữa (rẻ, nhanh).**
- Làm: mọi commit T/agent tạo thêm dòng cuối message `Assisted-by: <tên agent> (mode: autonomous/
  supervised)`; thêm một bước "T trình bảng-tính-năng-3-cấp cho Hoà duyệt TRƯỚC khi giao việc
  code" (IF đã có §2b HOP-DONG-PHOI-HOP-T — chỉ cần THI HÀNH nghiêm, không cần xây gì mới).
- Ưu: 0 chi phí code, chỉ là kỷ luật viết commit + kỷ luật quy trình đã có sẵn trong hợp đồng.
- Nhược: không tự động chặn — vẫn dựa vào con người/agent NHỚ làm, giống mọi luật "phải nhớ" khác
  trong CLAUDE.md hiện tại (rủi ro giống các luật khác: bị quên khi context dài).

**Hướng B — Xây "Spec Growth Engine"-kiểu drift gate: tag `@implements`/`@verifies` nối thẳng
dòng code với registry, thay vì registry chỉ mô tả bằng lời (như hiện tại).**
- Làm: nâng `frontier-registry.mjs` từ "grep chuỗi mô tả" lên "đọc comment tag chuẩn hoá trong
  code, đối chiếu tự động, báo % khớp" — gần với cách CI Guard làm traceability matrix.
- Ưu: bắt được lệch tinh vi hơn (không chỉ "có/không có bằng chứng" mà "bao nhiêu % khớp").
- Nhược: là việc XÂY MỚI có kích thước, không nhỏ — cần T lập kế hoạch riêng, không phải việc
  1 phiên; rủi ro trùng lặp với engine đã có (`soi:frontier` đã làm gần đúng việc này ở mức thô).

**Hướng C — Không đổi gì, chỉ dùng bảng so sánh này làm tài liệu tham chiếu khi có nghi ngờ
"mình đang làm đúng không" trong tương lai.**
- Ưu: 0 rủi ro, 0 chi phí.
- Nhược: bỏ lỡ một cải tiến rẻ (Hướng A) đang nằm sẵn trên bàn.

---

## 6 · Đề xuất hướng tốt nhất

**Hướng A trước, Hướng B để dành.** Lý do: `Assisted-by:` trailer giải ĐÚNG vấn đề Hoà nêu trong
bài giao việc ("Hoà nói bằng lời → T hiểu sai → không ai bắt được vì Hoà không đọc được code")
— khi mỗi commit tự khai rõ "T tự quyết (autonomous)" hay "làm theo lệnh cụ thể của Hoà
(supervised)", sau này lật lại lịch sử git là thấy ngay CHỖ NÀO T đã tự suy diễn quá tay, không
cần đọc code, chỉ cần đọc git log — đúng tinh thần "Hoà không đọc được code nhưng có thể đọc
được NHÃN". Hướng B (drift-gate AST thật) là nâng cấp đúng hướng NHƯNG tốn công hơn nhiều so với
lợi ích tức thời, nên xếp sau — đưa vào hàng đợi cho T cân nhắc khi `soi:frontier` bắt đầu bị
"báo sai vì grep chuỗi không đủ chính xác" (dấu hiệu để biết lúc nào cần nâng lên Hướng B).

---

## CHƯA CHẮC / CHƯA KIỂM (gom lại)
- Toàn bộ số sao GitHub trong file này: ước lượng bậc-độ-lớn, không phải số real-time chính xác
  (không có quyền gọi GitHub API trực tiếp trong phiên này).
- License chính xác của OpenSpec và 12-factor-agents.
- Nội dung gate cụ thể của BMAD-METHOD (trang repo không lộ chi tiết).
- Độ sống/chết thật của extension "CI Guard" — chỉ biết "cập nhật 4 tháng trước" tại thời điểm tra.
- IF có hay không có CI pipeline (`.github/workflows`) — ngoài phạm vi RG1 (không grep code trong
  nhiệm vụ nghiên cứu thuần), chỉ suy đoán "chưa có" từ bối cảnh mô tả trong bài giao việc.

## HẠN DÙNG KẾT LUẬN
Đọc lại và tự kiểm sao/hoạt động của 3 khung chính (spec-kit, BMAD-METHOD, OpenSpec) nếu dùng báo
cáo này **sau 3 tháng kể từ 16/08/2026** — số sao trong hệ sinh thái spec-driven-development đang
tăng/giảm nhanh (bằng chứng: OpenSpec tự thân đã dao động 54K→64.6K trong khoảng 1 tháng theo các
nguồn khác nhau), một khung có thể đã đổi hướng hoặc bị thay thế bởi khung mới hơn.
