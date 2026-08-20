# INTERIORFLOW · ARCHITECTURE MAP — bản đồ chính tắc DUY NHẤT

> **Lập 19/08/2026.** Thay `docs/IF-KIEN-TRUC.md` (đã đóng dấu chuyển hướng, giữ làm dấu vết).
>
> **Cặp đôi với `docs/IF-ARCHITECTURE-BLUEPRINT.md` (19/08, sau Reconciliation gate MISSING=0):**
> MAP này = living direction / transition map (nhận direction mới, đổi tag) · BLUEPRINT = kiến trúc
> hiện hành ghép thành hệ thống như thế nào (canonical vocabulary B3 · domain authority B8 · bảng
> KHÔNG-PHẢI-LÀ B20 · YAML machine-readable). Conflict thì ADR thắng cả hai.
> ⚠️ ĐỪNG NHẦM với `IF-ARCHITECTURE-BLUEPRINT-v1.md` (file CŨ KHÁC HẲN — 8 luật vận hành).
>
> **Quyết định T chốt (Hoà lật được):** từ 19/08 chỉ MỘT bản đồ sống là file này. Lý do: hai bản
> đồ song song là đúng cơ chế đã giết `IF-ARCHITECTURE-COMPASS.md` (mồ côi 19 ngày vì con trỏ
> chết) — bản đồ chỉ sống khi mọi con trỏ trỏ về đúng MỘT chỗ.

---

## §0 · CÁCH ĐỌC + BẢNG TRẠNG THÁI

Đây là **bản đồ** (trả lời *"thứ này LÀ GÌ, nằm ĐÂU trong cây"*), không phải nhật ký
(`00-CHOT.md` trả lời *"cái gì được quyết, khi nào"*). Bản đồ **viết lại khi đổi, không cộng dồn**.

**Bộ tag trạng thái dùng trong file này (nhất là §3):**

| Tag | Nghĩa |
|---|---|
| **[CHỐT]** | Hoà đã chốt thành luật (có ghi sổ, đối chiếu được) |
| **[DESIGN DIRECTION]** | định hướng thiết kế từ phiên Hoà + ChatGPT — chưa phải luật đã chốt |
| **[ĐANG CÓ]** | code thật đã có, đã đo (nguồn: FINAL-AUDIT 19/08) |
| **[CHƯA CẮM]** | code có nhưng chưa nối vào đường sống (dây có, chưa cắm điện) |
| **[GAP]** | chưa có code / thiếu primitive |
| **[LEGACY]** | thứ cũ còn sống trong code, chờ thay theo hướng mới |
| **[OPTIONAL ADAPTER]** | đứng ngoài lõi, tháo ra app vẫn chạy đủ |
| **[UNKNOWN]** | chưa đo được, không phán |

Một mục có thể mang 2 tag (vd `[DESIGN DIRECTION][ĐANG CÓ]`).
⛔ **Không nâng [DESIGN DIRECTION] lên [CHỐT] nếu Hoà chưa dùng từ "chốt"** hoặc không đối chiếu
được với chốt đã ghi sổ.

**Đọc kèm (không hút vào đây, chỉ trỏ):**
- `docs/IF-KIEN-TRUC-OS.md` — **hiến pháp kiến trúc gốc** (18/08), đứng TRÊN bản đồ này: IF =
  Local-first Design Operating System · 4 nguyên tắc Own data/workflow/memory · Replace your AI ·
  maximum control minimum friction · control points 4 mức.
- `docs/FINAL-ARCHITECTURE-AUDIT-2026-08-19.md` — phán quyết đóng khám kiến trúc: 5 blocker ·
  build waves 0–5 · 2 luật B-1/B-2.
- `docs/ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md` — 9 ADR (Q1–Q9) đã ACCEPTED.

## §1 · IF LÀ GÌ

**"InteriorFlow — Local-first Design Operating System. AI chỉ là engine bên trong."**
(định nghĩa hiến pháp `IF-KIEN-TRUC-OS.md`, thay mọi câu định nghĩa cũ — KHÔNG phải "AI App for
Interior Design".)

App thiết kế **nội thất**, **local-first**, **trung tính toàn cầu** — không mang thương hiệu studio
nào. Một dự án đi qua **ba chặng**, dùng **một nguồn dữ liệu**, **mọi con số truy được về nguồn đó**.
Hào của IF: **Canva đẹp mà không thật · Revit thật mà không đẹp** — IF đổi vật liệu ở phối cảnh thì
bản vẽ, bảng vật liệu, giá, tiến độ đổi theo, không phải vì có ai đồng bộ mà vì **chỉ có một vật**.

## §2 · BẢN ĐỒ HỆ THỐNG

### 2.1 · Bốn bề mặt, bốn vai — không cái nào giẫm cái nào

> **Canvas là SƠ ĐỒ DÂY CHUYỀN. Cửa sổ là XƯỞNG của một công đoạn. Chặng là KHUNG NHÌN. Sidebar là BẢN ĐỒ.**

| Bề mặt | Trả lời câu hỏi | Đổi theo chặng? |
|---|---|---|
| **Sidebar** | tôi đang ở đâu / đi đâu được | KHÔNG — nó là bản đồ |
| **Canvas** | dây chuyền của tôi trông thế nào | không — một nền duy nhất |
| **Cửa sổ công cụ** | làm gì với thứ trước mặt | CÓ — mỗi cửa sổ một môi trường |
| **Chặng** | tôi nhìn dự án qua ống kính nào | — nó **là** ống kính |

Luật ranh giới: **sidebar không bao giờ đổi nội dung theo chặng; thanh công cụ không bao giờ chứa
lối đi.** Cửa sổ công cụ (`ToolWindow` — code giữ tên này; "master tool" đã KHAI TỬ) = **cụm**
khung môi trường + panel vệ tinh, sống trên canvas, 3 nấc thu/vừa/toàn màn.

### 2.2 · Sidebar — một trục dọc, BA CỤM (⚠️ 20/08 ĐÈ bản HAI CỤM 16-17/08)

> [CHỐT 20/08 — IF EXPERIENCE SYSTEM điều 3+4, `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md`]
> Bản HAI CỤM (XƯỞNG · DỰ ÁN) **SUPERSEDED**. Nội dung "cái gì KHÔNG lên sidebar" bên dưới
> vẫn còn hiệu lực nguyên vẹn.

| Cụm | Gồm | Sống khi |
|---|---|---|
| **Workspace chung** | Dashboard/Home · Bảng việc · Chat/Họp · Files · Thư viện | không cần dự án |
| **Ba chặng** | 2D · 3D · Trình chiếu | chỉ khi đã mở dự án |
| **Cá nhân/hệ thống** | Cá nhân · Cài đặt | luôn |

Ba độ sâu (điều 4): **Rail 52–56px icon-only · Context Shelf 220–280 · Work Panel 320–440
resizable** — ba mức = ba năng lực (định vị · điều hướng · duyệt nội dung, giữ luật "ba nấc là
ba công năng" 16/08). 🟡 DRIFT code chờ thi công: `BE_RONG_NAC = 28/240/320`
(`muc-dieu-huong.ts`) → 52-56 / 220-280 / trần 440.

KHÔNG lên sidebar: Bảng màu (một *bước* trong chọn vật liệu) · Kho vật liệu (một *kệ* trong Thư
viện) · Gallery (mặt tiền tuyển chọn của kệ Ảnh). Files và Thư viện đứng cạnh nhau **có lý do** (2.4).

### 2.3 · Ba chặng — ba ống kính, một nguồn

| | Việc | Mode |
|---|---|---|
| **Thiết kế 2D** | bản vẽ · cấu kiện · hồ sơ kỹ thuật | Sơ phác ↔ Chuyên |
| **Thiết kế 3D** | dựng khối · vật liệu · ánh sáng · render · brainstorm/thảo luận | Node ↔ Vẽ 3D — *một bộ lệnh, hai lối thao tác* |
| **Trình chiếu** | đóng gói: deck · bảng vật liệu · BOQ · văn bản · video | không mode |

Khoá kỹ thuật trong code GIỮ NGUYÊN (`concept`/`render`/`present`, `sketch`/`pro`/`revit`) — chỉ
đổi nhãn hiển thị. **Cấu kiện/BIM nội thất không phải mode, không thuộc chặng nào — là TẦNG DỮ
LIỆU dưới cả ba chặng.** Luật không chặn: vào chặng nào cũng dựng được, dựng ở đâu cũng ghi vào
**một** `Doc`, chặng trống hiện lối làm-được-việc-tại-chỗ.

### 2.4 · Dòng chảy của VẬT — xương sống sản phẩm

```
FILES ──► CỬA SỔ CÔNG CỤ ──► THƯ VIỆN (Master Library) ──► ĐỀ XUẤT ĐÚNG CHỖ
 thô        thêm ĐỊNH NGHĨA     đủ định nghĩa (.idfc)        slot đồ · mảng vật liệu
 dùng chung                                                  ký hiệu 2D · bảng giá
```

- **Files ≠ Thư viện là hai kho ngang hàng** — chúng là **hai TRẠNG THÁI** của cùng một thứ:
  *chưa đủ định nghĩa* ↔ *đã đủ định nghĩa*. Cửa sổ công cụ là thứ đưa vật qua ranh giới
  (*"định nghĩa file = kết quả"*).
- **Files = HAI TẦNG** (Hoà 17/08): tầng ① thư mục hệ thống 5 loại có quyền · tầng ② **Collection+**
  8 gói component (mã `COL-XXX-NNN`) theo LOẠI VẬT — kho nguồn chờ chưng cất. Nghĩa "chợ đầu mối" đã BỎ.
- **Thư viện = Master Library, MỘT cái duy nhất** — hiểu ngữ cảnh và **mang đồ tới**, không phải
  kho để đi tìm. Cùng một `matId`: 2D ký hiệu/hatch · 3D PBR/quả cầu · Trình chiếu bảng + giá.
- **Vật liệu là GỐC** (đồ đạc cũng làm bằng vật liệu) · **màu là một BƯỚC** trong chọn vật liệu ·
  không có "thư viện vật liệu" riêng.

### 2.5 · ĐỒNG BỘ — câu định vị

> **Đồng bộ KHÔNG PHẢI nối hai thứ lại. Đồng bộ là KHÔNG TÁCH chúng ra ngay từ đầu.**

Vật liệu mang cả hai nửa — render được VÀ biết mình là hàng của ai, giá bao nhiêu — nhưng **TRỎ TỚI
bản ghi thương mại, KHÔNG chép giá vào mình** (range giá thuộc kho chung, giá chốt thuộc dự án).
🔴 Hiện trạng: `getMaterial()` (`lib/materials/resolve.ts:52`) trả đủ ba mặt nhưng chưa cắm rộng;
`matId` còn **ba namespace** (blocker ① FINAL-AUDIT) — Wave 0/1 giải.

### 2.6 · Ba nấc = ba CÔNG NĂNG, không phải ba cỡ

Mỗi nấc trả lời MỘT câu hỏi khác; nấc to **thêm một lớp tin**, không phóng to lớp cũ. Cửa nghiệm
thu 2 vế: che nấc to → nấc nhỏ vẫn đứng một mình · nấc to phải có thứ nấc nhỏ KHÔNG THỂ có.
Sidebar 28 = định vị · 240 = điều hướng (+chữ) · 320 = duyệt nội dung (+HÌNH/tình trạng).
Không phải mục nào cũng xứng ba nấc — không có gì để nhìn thì bỏ nấc ba.

### 2.7 · Hệ `.idf` — bốn đuôi sống, một đuôi ma

| Đuôi | Là gì |
|---|---|
| `.idf` | một DỰ ÁN (ví như `.rvt`) — v2, migration thật |
| `.idfp` | một HỒ SƠ Trình chiếu — v1, tự chứa nhất |
| `.idfc` | một NỘI DUNG dùng lại được — "C" = **CONTENT**; vỏ chung + ruột theo `kind` — v3 |
| `.ifpack` | gói SAO LƯU ZIP cả dự án |
| ~~`.idfnotes`~~ | 🔴 MA — 0 code; dựng hoặc khai tử |

Ba ràng buộc `.idfc`: **một chiều** (kho → dự án) · **bản chèn giữ liên kết + đè cục bộ** ·
**ghim phiên bản**. Bốn định dạng hợp lý nhưng cần **một xương sống lưu chung** (phiên bản · nâng
cấp · nhãn nguồn · kiểm toàn vẹn) — nay chỉ `.idfc` có đường nâng cấp thật.

### 2.8 · LƯU Ở ĐÂU — chung ↔ máy

| Loại | Lưu | Vì sao |
|---|---|---|
| **VẬT** (vật liệu · cấu kiện · bản vẽ · deck) | CHUNG | tài sản |
| **CẤU TRÚC VIỆC** (chuỗi công đoạn · dây · vị trí node) | CHUNG | ai mở cũng thấy cùng một dây chuyền |
| **CÁCH BÀY CỦA TÔI** (cỡ kéo tay · nấc · panel thu/mở) | MÁY MÌNH | mỗi người một màn |

**Cách làm cũng là tài sản** — mục Thư viện có phiên bản, dự án chỉ THAM CHIẾU.
🔴 Blocker ③ FINAL-AUDIT: tài sản studio hiện nằm localStorage (idfc · PBR · màu · brand-kit) —
data-loss thật, Wave 0 di dời.

### 2.9 · Từ vựng — ba tầng, luật chống khái niệm ma

NGHỀ (ngành đặt, IF không đổi) · SẢN PHẨM (IF đặt, người dùng thấy) · KỸ THUẬT (chỉ người code
thấy). Một khái niệm được nhiều tên **chỉ khi khác tầng và khai ánh xạ** (`ToolWindow` ↔ *cửa sổ
công cụ* = hợp lệ). Sổ đặt tên cho một thứ → **phải kiểm code đã có tên chưa**; ba con ma đã bắt:
`master tool` · `KB-5` · `.idfnotes`. Chỉ **đối chiếu sổ ↔ code** mới lộ ma — máy soi còn thiếu.

### 2.10 · Cái gì KHÔNG PHẢI cái gì

| Thứ này | không phải | mà là |
|---|---|---|
| Cửa sổ công cụ | thanh công cụ | một môi trường làm việc trên canvas |
| Thư viện | kho để đi tìm | thứ mang đồ tới, hiểu ngữ cảnh |
| Files | chợ đầu mối | phần thô dùng chung, hai tầng |
| Màu | một mục | một bước trong chọn vật liệu |
| Ba nấc | ba cỡ | ba công năng |
| Đồng bộ | nối hai thứ | không tách chúng ra |
| `00-CHOT` | bản đồ | nhật ký — file này mới là bản đồ |
| Lark/ATLAS | hạ tầng lõi | **OPTIONAL EXTERNAL ADAPTER** (chốt 19/08) |

## §3 · 24 DESIGN DIRECTION (phiên Hoà + ChatGPT, 19/08)

> Nguyên văn ý, mỗi mục gắn tag theo bộ §0. [CHỐT] chỉ khi đối chiếu được chốt đã ghi sổ.

| # | Direction | Tag | Căn cứ |
|---|---|---|---|
| 1 | **Chặng = module; workflow = composition.** | **[CHỐT][ĐANG CÓ]** | khớp chốt canvas/cửa sổ/chặng-là-khung-nhìn 16/08 + Gate B đo: workflow không stage-gate cứng, 10 cách dùng coexist |
| 2 | 2D Kỹ thuật chứa professional 2D/BIM capabilities, nhưng 2D master tool không đồng nghĩa toàn chặng. | [DESIGN DIRECTION] | mode Sơ phác↔Chuyên đang có; ranh giới tool ≠ chặng là hướng mới |
| 3 | "Pro mode" không phải kiến trúc; professional depth thuộc từng Master Tool/capability. | [DESIGN DIRECTION][LEGACY] | code hiện còn `cadMode sketch/pro/revit` (giữ khoá kỹ thuật — chỉ nhãn đổi); tái định vị theo capability chưa thi công |
| 4 | Chặng 3D = Design Development Workspace rộng: context · brainstorm/discussion · references · canvas · material/spec exploration · decision · 3D Master Tool · shared Visual Pipeline. | [DESIGN DIRECTION][ĐANG CÓ] (một phần) | Cửa Sổ Thảo Luận chặng 3D đã ship 17/08 (`CuaSoThaoLuan.tsx`); phần decision/pipeline chung chưa đủ |
| 5 | Canvas có thể nhiều board/project; reference canonical data, không sở hữu truth riêng. | [CHỐT 19/08 C4][GAP code] | **Hoà chốt C4 19/08**: Project → nhiều Workspace → mỗi Workspace nhiều Canvas/Board + MỘT Project Flow/Timeline xuyên suốt (graph nối [DESIGN DIRECTION]). Canvas = working surface · Workspace = working context · Project = identity+truth+genealogy. Chi tiết: `IF-ARCHITECTURE-BLUEPRINT.md` B6. Gap code giữ nguyên: `Flow.graphJson` mất-DB-mất-trắng (A-5), node ghi ngược store 2D (B-1) |
| 6 | Sau brainstorm có bước DISTILL → PROJECT DESIGN DNA. | [DESIGN DIRECTION][ĐANG CÓ] (một phần) | ⛔ĐÍNH CHÍNH 19/08 (R9a, DRIFT D2 — trước ghi "2 production caller"): chỉ **1 caller SỐNG tới người dùng** — `DesignDnaCardPanel.tsx:297` (qua `distillDnaFromAssets` → `distill()`), mount `app/projects/[id]/overview/page.tsx:308`; `CuaSoThaoLuan.tsx:182` có code gọi nhưng component **0 mount** (D1) |
| 7 | Project Design DNA: định hướng đã chốt · có cấu trúc · version/provenance · mọi chặng tham chiếu · khác Person/Studio/Client DNA. | [DESIGN DIRECTION][CHƯA CẮM] | DNA card project-scope có; 4-scope + version/provenance = ADR-Q9, xếp Wave 4 (sau Q8) |
| 8 | 2D plan có thể là spatial interface để đặt/đi camera nhất quán. | [DESIGN DIRECTION][ĐANG CÓ] (một phần) | ⛔ĐÍNH CHÍNH 19/08 (R9a, DRIFT D4 — tag [CHƯA CẮM] lỗi thời): `CamPathPanel` (bọc `CamPathPreview`) **ĐÃ mount** trong editor 2D (`CadEditor.tsx:866`, tool campath); phần "camera nhất quán xuyên 2D↔3D" vẫn là hướng |
| 9 | Pattern/hoạ văn là shared capability xuyên 2D/3D/render/spec. | [DESIGN DIRECTION][GAP] | entry `xuong-hoa-van-parametric` mở, chưa thi công |
| 10 | 3D Master Tool sở hữu spatial/geometry/camera editing, không sở hữu toàn design workflow. | [DESIGN DIRECTION] | hệ quả của #4; khớp tinh thần "cửa sổ đóng khung phạm vi" 16/08 |
| 11 | Render = Shared Visual Pipeline, không phải con riêng của 3D. | [DESIGN DIRECTION][GAP] | hiện render sống trong chặng 3D; 2,5 gateway AI song song (B-2) — pipeline chung chờ Wave 2 |
| 12 | ComfyUI = optional execution adapter. | [DESIGN DIRECTION] | ⚠️ hoà giải khi thi công với chốt 15/08 "MỘT bộ lệnh, HAI lối thao tác (node ↔ tool), không bỏ mode nào" — adapter là tầng THI HÀNH, không thay lối thao tác node |
| 13 | Visual Pipeline hỗ trợ continuum FAST → ACCURATE. | [DESIGN DIRECTION][ĐANG CÓ] (một phần) | AiTier/fidelity trong `gateway/capabilities` + định vị Grounded Render (concept) ↔ 3D mode (technical) 13/08 |
| 14 | Movie là first-class output cho interior/architecture/landscape. | [DESIGN DIRECTION][GAP] | Gate C: Video = PARTIAL — có IF_CAMPATH + camera intent, thiếu timeline model |
| 15 | Present = Communication + Review + Issue layer: drawing set / deck / movie / interactive / 4D. | [DESIGN DIRECTION][GAP] | Present 5 loại hồ sơ có spec; Review Gate (11/08) chưa build; issue layer chưa có |
| 16 | Technical export vẫn được làm tại nguồn 2D. | [DESIGN DIRECTION][ĐANG CÓ] | xuất PDF/DXF từ 2D đang chạy; nhất quán chốt 15/08 "con số chỉ đến từ chỗ đo được (CAD/khối dựng)" |
| 17 | Checkpoint/Review/Approval là primitive xuyên workflow. | [DESIGN DIRECTION][GAP] | Gate C-2: decision history ≈ 0. ⛔ĐÍNH CHÍNH 19/08 (R9a, DRIFT D3): `FfeApproval` chỉ là **TS type** (`lib/ffe/sheet.ts:52`) — không persist, 0 caller production đọc/ghi approvals — KHÔNG được tính là mầm primitive; primitive chung = ADR-Q8, Wave 3 |
| 18 | File history ≠ State history ≠ Decision history. | [DESIGN DIRECTION][GAP] | file/version có (`FlowVersion`, `.idf` v2); Decision history chưa tồn tại (Q8) |
| 19 | Present/4D tương lai đối chiếu Expected Design ↔ ArchiNote Field Reality. | [DESIGN DIRECTION][GAP] | ArchiNote chưa code; điều kiện: conflict primitive (D-3) · project id portable (D-4) · Observation model (Wave 5) |
| 20 | ArchiNote dùng shared contracts; Lark không nằm giữa bắt buộc. | **[CHỐT][ĐANG CÓ]** | Hoà chốt 19/08 (Lark = OPTIONAL EXTERNAL ADAPTER, đè câu cũ CLAUDE.md); Gate D đo: Lark removal simulation 0 domain lõi BLOCKED |
| 21 | AI semantic reasoning + deterministic validation; human có control points. | **[CHỐT][ĐANG CÓ]** | luật 8 hiến pháp + chốt 15/08 "kiểm chuẩn = máy, AI chỉ góp ý" (Hoà: *"tôi đồng ý về vụ kiểm chuẩn"*) + Gate C: 0 RED AI authority |
| 22 | AI-generated → human-corrected → selected/rejected → approved → built là learning signal. | [DESIGN DIRECTION][CHƯA CẮM] | 5 signal đã sống rời rạc (pairwise perceptron · BOQ overrides · FfeApproval · cờ verified · FlowVersion) — chuỗi nối qua Q8 chưa có |
| 23 | Shared data/capability ≠ shared ownership. | [DESIGN DIRECTION] | khớp Domain Authority (ADR-Q1) + luật lưu chung↔máy §2.8; chưa thành luật máy kiểm |
| 24 | Update locality: NEW CAPABILITY MUST ENTER THROUGH A CONTRACT · REPLACING A MODULE MUST NOT REQUIRE EDITING UNRELATED MODULES. | [DESIGN DIRECTION] | = 2 luật B-1/B-2 FINAL-AUDIT §24 (wording cuối, đề xuất vào registry); Hoà accept audit, chưa nói "chốt luật" |

**Lý do các mục được nâng [CHỐT]:** #1 khớp Gate B + chốt canvas/cửa sổ 16/08 (chặng = khung nhìn,
môi trường trong cửa sổ) · #20 Hoà chốt trực tiếp 19/08 (ghi trong FINAL-AUDIT §1) · #21 ghép hai
chốt đã ghi sổ (luật 8 + ranh giới kiểm-chuẩn-máy 15/08 Hoà duyệt nguyên văn).

## §4 · TRẠNG THÁI BLOCKER / WAVE

**Kiến trúc ĐÃ ĐÓNG KHÁM 19/08** — không mở audit mới trừ khi có evidence conflict thật.
Chi tiết: `docs/FINAL-ARCHITECTURE-AUDIT-2026-08-19.md`. Tóm 5 blocker:

| # | Blocker | Giải ở |
|---|---|---|
| ① | matId ba namespace (UUID · PBR-sku-upper · BOQ-specId) | Wave 0 |
| ② | 4 nhóm schema khai-chưa-push (`prisma generate` = chết runtime) | Wave 0 (Hoà chạy tay) |
| ③ | tài sản studio trong localStorage | Wave 0 |
| ④ | AI provider coupling 15-20 file / 2,5 gateway | Wave 2 |
| ⑤ | thiếu conflict/merge primitive (`rev` có field, 0 enforcement) | Wave 3 (gộp Q8) |

Waves: **0** data-safety → **1** domain authority + material wiring → **2** boundaries (AI gateway
facade) → **3** decision core (Q7-hẹp + Q8 + Q6) → **4** DNA + Privacy → **5** ArchiNote contracts.

## §5 · LUẬT GIỮ FILE

1. Phần bản đồ (§1–§2) **không tách**, **viết lại khi đổi**, không cộng dồn — thấy nó dài ra là
   dấu hiệu đang biến thành nhật ký.
2. §3 chỉ đổi **tag** khi trạng thái đổi (kèm ngày + căn cứ); không thêm direction mới vào đây
   nếu Hoà chưa đưa — direction mới đi qua phiên Hoà.
3. Chi tiết, lập luận, số đo, bằng chứng → `docs/memory/sessions/<YYYY-MM-DD>/`, không nhét vào đây.
4. **Đổi tên tài liệu nền → sửa MỌI con trỏ ngay lượt đó.** Để lại mẩu chuyển hướng là chưa xong
   việc — mẩu cụt đọc ra như tệp rỗng (đúng cách hai bản đồ trước chết).
5. Bản đồ tự nó không tự kiểm được — cần máy đối chiếu sổ ↔ code (entry `may-doi-chieu-so-code`)
   + `soi:ranh-gioi` (đề xuất FINAL-AUDIT §24).
