# IF là HỆ ĐIỀU HÀNH CÔNG VIỆC — AI là LỚP THAY THẾ ĐƯỢC

> Hoà chốt 18/08. **Hiến pháp kiến trúc gốc — trên mọi chốt kiến trúc khác.**
> Bản đồ `docs/IF-KIEN-TRUC.md` bổ sung theo, không viết lại từ đầu.

## ⭐ ĐỊNH NGHĨA IF (thay mọi câu định nghĩa cũ)

**KHÔNG PHẢI**: *"AI App for Interior Design."*

**LÀ**: **"InteriorFlow — Local-first Design Operating System. AI chỉ là engine bên trong."**

## ⭐ BỐN NGUYÊN TẮC TRIẾT LÝ KỸ THUẬT

1. **Own your data** — dữ liệu là của người dùng, không thuộc nhà cung cấp.
2. **Own your workflow** — luồng làm việc không bị khoá bởi bất kỳ SaaS/API.
3. **Own your memory** — ký ức app có schema riêng, không lưu theo format của model.
4. **Replace your AI** — model đổi tự do, không phải viết lại app.

Giữ đúng 4 nguyên tắc này — 10 năm nữa AI landscape thay đổi hoàn toàn, IF vẫn là của Hoà, không thành lớp UI trên dịch vụ người khác.

## ⭐ TRIẾT LÝ SÁNG TẠO — MAXIMUM CONTROL, MINIMUM FRICTION

**KHÔNG PHẢI**: maximum automation.
**LÀ**: **maximum control with minimum friction**.

Designer không chỉ quan tâm output đúng/sai. Họ quan tâm **cách đi đến output** — vì ý đồ thiết kế nằm trong quá trình LỰA CHỌN · LOẠI BỎ · ĐIỀU CHỈNH.

**Luật**: AI KHÔNG *"làm thay"*. AI *"làm cùng"* — designer luôn **NHÌN THẤY · CAN THIỆP ĐƯỢC · QUAY LẠI ĐƯỢC**.

### Cấm agent chạy một mạch (black box)

```
❌ SAI:  Bạn: "Làm concept cho lobby" → AGENT [black box…] → "Xong."

✅ ĐÚNG:  BRIEF
          ↓
          [1] Understand  → 👁 Review  ✎ Edit  ✓ Approve
          ↓
          [2] Research     → 23 refs · 👁 xem nguồn · ✎ loại/giữ/thêm
          ↓
          [3] Directions   → A ─── B ─── C  ↑ bạn chọn
          ↓
          [4] Develop      → Material · Form · Color · Narrative ↑ chỉnh được
          ↓
          [5] Generate
          ↓
          [6] Review
          ↓
          OUTPUT
```

Đây là khác biệt lớn giữa **automation software** và **creative software**.

### CONTROL POINTS — 4 mức tự do

```
AUTONOMY ────────────────────────────────
Assist         AI đề xuất → Tôi thực hiện
Collaborate    AI làm → Tôi duyệt từng bước
Delegate       AI tự làm → dừng ở checkpoint
Autopilot      AI tự hoàn thành workflow
```

Không ép mọi người cùng một mức. Người dùng đặt mức **TỪNG GIAI ĐOẠN**.

Ví dụ Creative Director:
- Research → Autopilot
- Documentation → Autopilot
- Moodboard → Collaborate
- Concept → Assist
- Final Design → Human only

Junior khác:
- Research → Collaborate
- Moodboard → Collaborate
- Concept → Collaborate
- Documentation → Delegate

Automation trở thành **biến số do designer kiểm soát**.

### WHY THIS? — AI khai bằng chứng, không chỉ đưa kết quả

Mọi đề xuất AI phải kèm khối *"Why this?"* liệt kê căn cứ + nút **Change reasoning**.

Ví dụ: *"Sử dụng đá limestone màu warm beige."*
```
WHY THIS?
────────────────────────
Design Intent    → Calm / Natural / Timeless
Project req.     → Hospitality 5★
References       → Project A · Project B
Material Library → Limestone #MT-024
Constraints      → Indoor · Budget $$$

[Change reasoning]
```

**Luật cứng**: AI không có quyền đưa đề xuất mà không giải thích được căn cứ từ **IF Memory** (Person · Project · Client · Material · Reference · Standard) và **Design Intent** hiện tại.

## ⭐ HAI BỘ NGUYÊN TẮC SONG SONG

**Hạ tầng**:
- Own your data · Own your workflow · Own your memory · Replace your AI

**Trải nghiệm sáng tạo**:
- **AI proposes** · **Human directs** · **Every decision is visible** · **Every decision is reversible**

Hai bộ ghép lại → IF không cố trở thành *"AI thiết kế thay designer"*. IF trở thành:

> **Một môi trường mà designer có thể điều khiển một đội ngũ AI giống như đang điều khiển team thiết kế — giao việc được, xem tiến độ được, can thiệp giữa chừng được, phản biện được và luôn giữ quyền quyết định cuối cùng.**

## ⭐ TRANSPARENCY HỮU ÍCH ≠ chain-of-thought

Designer KHÔNG cần nhìn nội bộ model. Họ cần:
- **Evidence** — bằng chứng
- **Assumptions** — giả định
- **Design rationale** — lý do thiết kế

...tất cả **kiểm tra được**.

## ⭐ CREATIVE TIMELINE — lịch sử DECISION > lịch sử FILE

Không chỉ *"Version 17"*. Phải là:

```
CONCEPT EVOLUTION
Brief
│
├── Direction A
│   ✕ rejected · "too commercial"
│
├── Direction B
│   ↓ B.1
│   ↓ Client feedback
│   ↓ B.2
│   ↓ Material changed
│   ↓ B.3 ★ APPROVED
│
└── Direction C archived
```

Sau 6 tháng vẫn trả lời được: **"Tại sao thiết kế cuối cùng trở thành như vậy?"** — không chỉ *"đây là file final"*.

**Với ngành thiết kế, lịch sử DECISION đôi khi giá trị hơn lịch sử FILE.**

## ⭐ NON-DESTRUCTIVE AI WORKFLOW

AI làm sai bước 4-5-6 → **KHÔNG** làm lại từ đầu:

```
Step 1 ✓  Step 2 ✓  Step 3 ✓
Step 4 ✕  Step 5 ✕  Step 6 ✕

↶ RETURN TO STEP 4
   "Giữ 1–3. Thay hướng vật liệu ở bước 4."
   ↓
   AI regenerate 4 → 6
```

Rất giống triết lý **layer/history của Photoshop**, áp cho AI process.

## 1 · Nguyên tắc số 1

**IF là hệ điều hành công việc cho thiết kế nội thất. AI chỉ là một lớp trí tuệ có thể thay thế.**

Không phải: *"build một app rồi gắn API AI vào"*.

**Điều kiện sống**: 4 phần đầu (Project · Workflow · Knowledge · Community) phải hoạt động BÌNH THƯỜNG dù toàn bộ AI bị tháo ra.

Ngày nào đó Qwen không phù hợp · Ollama biến mất · OpenAI tăng giá · Anthropic đổi chính sách → IF vẫn quản dự án, deadline, workflow, tài liệu, team, knowledge base bình thường.

AI là *"một nhân viên cực thông minh đang ngồi bên trong IF"*, KHÔNG phải *"IF sống nhờ AI provider"*.

## 2 · Sơ đồ hệ thống

```
INTERIORFLOW
│
├── PROJECT SYSTEM         (bắt buộc — không AI vẫn chạy)
│   ├── Project · Phase · Deadline · Task · Team · File · Review/Approval
│
├── DESIGN WORKFLOW        (bắt buộc — không AI vẫn chạy)
│   ├── Research · Layout · Moodboard · Concept · 3D · Tender · Construction/Handover
│
├── KNOWLEDGE SYSTEM       (bắt buộc — không AI vẫn chạy)
│   ├── Material library · Standards · Company procedures · Past projects
│   ├── Design references · Lessons learned
│
├── COMMUNITY / DEVELOPMENT (bắt buộc — không AI vẫn chạy)
│   ├── Portfolio · Design sharing · Critique · Trends · Skill development
│
└── AI LAYER               (tuỳ chọn — thay được, tháo được)
    ├── Local LLM · Cloud LLM optional · Agents · Search/RAG · Automation
```

## 3 · AI Gateway — cấm phụ thuộc cứng backend

```
             INTERIORFLOW
                  ↓
       INTERIORFLOW AI GATEWAY   ← IF chỉ nói chuyện với chỗ này
                  ↓
   ┌──────────────┼──────────────┐
Local Runtime  Cloud API    Future engine
   Ollama      GPT/Claude    llama.cpp · vLLM
                Gemini · Qwen
```

**IF gửi**: `/chat` · `/search` · `/embed` · `/analyze-project` · `/create-task` · `/review-design`
**Gateway quyết định** backend nào chạy.

## 4 · Privacy mode

```
Privacy mode:  ● Fully Local    ○ Hybrid    ○ Cloud
```

- **Fully Local**: Project files · Staff data · Client data · Drawings · Contracts · Meeting notes · Design library → KHÔNG RA INTERNET. Local model xử toàn bộ.
- **Hybrid**: chỉ tác vụ được cho phép ra cloud (Hoà chốt 18/08):
  - ✓ RA cloud: Search trend Internet · General brainstorming
  - ✕ KHÔNG ra cloud: **Hồ sơ khách hàng · File dự án · Thông tin nhân sự · Budget · Tender**
- **Cloud**: mọi thứ đi cloud.

## 4b · Workflow ngành THẬT (KHÁC Todo/Doing/Done — khác Notion/Monday/ClickUp)

```
INPUT → RESEARCH → LAYOUT → MOODBOARD → CONCEPT → 3D
      → DESIGN REVIEW → REVISION → TENDER → SHOPDRAWING
      → SITE → HANDOVER
```

Mỗi giai đoạn **SINH KNOWLEDGE**. AI quan sát pattern (VD: *"70% project hospitality trễ Concept→3D vì material chưa approve"*) → đề xuất khoá milestone Material Direction Approval trước Concept 3D. Đây là AI **phục vụ workflow thật**, không AI generic.

## 4c · Company Design Intelligence — DATA > MODEL

Sau 5 năm công ty tích luỹ: 500 projects · 50k material records · 20k design comments · 5k client feedback · 3k site issues · 100k drawings · hundreds standards.

IF biến thành **Company Design Intelligence** — designer hỏi:
- *"Dự án resort 5 sao trước đây mình dùng loại gỗ nào cho khu vực pool?"*
- *"Cho tôi những lỗi FF&E hay gặp trong project hospitality."*

AI KHÔNG trả lời generic từ Internet — trả lời từ **lịch sử project của chính công ty**. Đây là dữ liệu mà OpenAI · Autodesk · SaaS nào không sở hữu được nếu giữ local.

**Nguyên tắc**: DATA > MODEL. Model có thể thay. Data + workflow + knowledge graph mới là TÀI SẢN.

## 4d · IF MEMORY — schema riêng, không theo format model

**Cấm**: lưu ký ức theo *ChatGPT memory · Claude memory · Ollama history*.

**Bắt buộc**: có `INTERIORFLOW MEMORY` schema riêng:
```
Person · Project · Client · Material · Supplier · Space
· Design decision · Issue · Feedback · Lesson learned · Standard
```

AI chỉ ĐỌC/GHI qua API. Model Qwen → Llama vẫn đọc được toàn bộ ký ức IF.

## 4e · Hai thế giới — MANAGEMENT ↔ DEVELOPMENT

```
     MANAGEMENT                    DEVELOPMENT
     ──────────                    ───────────
     Project                       Personal Growth
     Resource · Deadline           Portfolio · Community
     Workflow                      Inspiration · Trend
     QA/QC                         Learning · Knowledge
           │                              │
           └──────────┬───────────────────┘
                      ↓
              DESIGN INTELLIGENCE
```

- **Management** = giúp công ty vận hành
- **Development** = giúp designer giỏi lên
- **AI ở giữa** — học từ CẢ HAI

**Ví dụ**: IF biết Hoà → Hospitality Concept Design · 8 projects · Strong storytelling · Weak tender coordination → Development gợi *"3 case study detailing hospitality nên xem"* hoặc *"Project mới phù hợp thử vai Design Lead"*.

⇒ IF thành **career intelligence system**, không chỉ task manager.

## 5 · Hệ quả bắt buộc

1. **Cấm** viết code IF gọi thẳng `openai`/`anthropic`/`ollama` SDK. Mọi lời gọi AI đi qua AI Gateway.
2. **Cấm** tính năng nghiệp vụ đòi AI để hoạt động (vd: quản dự án không mở được vì AI down). AI chỉ **thêm giá trị**, không **là điều kiện**.
3. **Cấm** dữ liệu dự án tự động ra cloud khi Privacy = Fully Local.
4. Gateway phải khai được **backend hiện tại + lý do chọn** (người dùng thấy được).
5. Đổi backend = đổi CẤU HÌNH, không sửa code IF.

## 6 · Đối chiếu với hiện trạng IF (đo 18/08)

| Lớp | Có trong IF? | Vênh với hiến pháp mới |
|---|---|---|
| Project System | ✅ Prisma models đủ (Project · Task · TaskContext · Team qua Review Gate) | Chưa có `Phase` model — hiện phase là chuỗi cứng trong `lib/phases.ts` |
| Design Workflow | 🟡 Chỉ 3 chặng (2D · 3D · Present) — chưa có Research · Moodboard tách riêng · Tender · Construction/Handover | Cần bổ sung sau, chưa đầy đủ workflow ngành |
| Knowledge System | 🟡 Có Material · Standards (lib/cad/standards) · Past projects nhưng chưa gộp thành hệ | Chưa có "Company procedures" · "Lessons learned" · Design references thống nhất |
| Community | ❌ 0 code — hoàn toàn chưa có | Portfolio · Sharing · Critique · Trends là mảng chưa động |
| AI Layer | 🟡 CÓ tách tầng (`lib/ai/text-tier.ts` · providers `nvidia/ollama/fal/comfyui/sd`) NHƯNG chưa có **AI Gateway thực sự** | Gọi thẳng provider ở nhiều chỗ — vi phạm §5.1 |
| Privacy mode | ❌ 0 UI · 0 config | Chưa có |

**5 rủi ro đo được**:
1. `lib/idfc-import/from-photo.ts:195` gọi thẳng `NVIDIA_VLM_MODEL` — cần đi qua Gateway
2. `lib/nodes/defs/grounded-render.ts` gọi thẳng `/api/vision/caption` NVIDIA — nt
3. Chưa có concept "Privacy mode" trong UI/DB
4. Chưa có `Phase` model độc lập
5. AI provider thay = phải sửa code, không phải đổi cấu hình

## 7 · Việc phải làm (chưa xếp thứ tự)

- Thiết kế `AI Gateway` interface — 6 lệnh `/chat` `/search` `/embed` `/analyze-project` `/create-task` `/review-design`
- Refactor mọi chỗ gọi thẳng provider → đi qua Gateway
- Thêm `PrivacyMode` enum + UI toggle
- Bổ sung schema thiếu (Phase model, Research, Moodboard, Tender, Handover, Community)
- Đối chiếu 4 lớp lõi với hiện trạng — dựng bảng "còn thiếu gì" chi tiết
- Nạp memory Anthropic feedback (hiến pháp mới)

## 8 · Hạn dùng

Hiến pháp này **không có hạn dùng**. Đây là tầng gốc, mọi tầng sau là hệ quả. Chỉ HOÀ được lật.
