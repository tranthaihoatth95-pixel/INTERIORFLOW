# IF FEATURE TREE — cây phân rã DUY NHẤT của toàn app *(trước gọi IF-MASTER-TREE.md, đổi tên 28/07)*

> **Vai trò file**: nguồn DUY NHẤT cho trạng thái tính năng + Luật Đóng Băng (Phần E). Kiến trúc
> tổng thể + hệ sinh thái `.idf` + lệnh giao diện xem `docs/IF-ARCHITECTURE-COMPASS.md` (trước gọi
> `IF-MASTER-BLUEPRINT.md`). Gom MỌI tính năng đã từng được spec (18 file `SPEC-*.md` +
> `IF-ARCHITECTURE-BLUEPRINT-v1.md` + `IF-FEATURE-SPEC-P1-v2.md` + `IF-PRESENT-SPRINT-PLAN.md` +
> `IF1-COMPLETION-AUDIT.md` + `docs/PLAN-LIBRARY-GATEWAY.md`) thành 1 cây 4 cấp, đánh số, trạng
> thái căn cứ CODE THẬT — không tin lời spec.
>
> **KHÔNG thêm tính năng mới, KHÔNG diễn giải** — chỉ gom và đánh số những gì đã có trong docs.

## Cách đọc file này

```
Cấp 1 = KHỐI        (1. Manager Center · 2. Studio · 3. Library · 4. File Manager ·
                      5. Knowledge · 6. Vitals · 7. Hạ tầng nền)
Cấp 2 = NHÓM         (vd 2.2 Chặng Render)
Cấp 3 = TÍNH NĂNG    (vd 2.2.1 Tool Mode)
Cấp 4 = NHÁNH CON    (vd 2.2.1.a Lưới 6 thẻ việc)
```

Mỗi mục cấp 3/4 có 6 cột: **Mã · Tên · Bậc (N/P/L/?) · Trạng thái · Phụ thuộc · File spec gốc**.

**Trạng thái**: ✅ xong (chạy đúng như spec) · 🟡 một phần (có code thật nhưng thiếu/khác spec) ·
⬜ chưa (không tìm thấy bằng chứng trong code) · ⛔ non-goal (chủ đích không làm) ·
N/A ngoài phạm vi code IF (thuộc ArchiNote — app khác, hoặc thuộc luật/nguyên tắc không phải feature).

**Phương pháp** (khai báo trung thực, không giấu giới hạn):
- Khối **2.1 CAD** (101 item A-G) dùng NGUYÊN kết quả `IF1-COMPLETION-AUDIT.md` §1 (2026-07-26,
  đối soát `file:line` thật, KHÔNG tin tự chấm của `IF-FEATURE-SPEC-P1-v2.md`). Để tránh nhân bản
  101 dòng bằng chứng đã có sẵn ở file đó, cấp 4 ở khối này dừng ở mức NHÓM CON (A1/A2/B1/B2…)
  với trạng thái GỘP (weighted) — muốn xem từng mục con (vd A1.6) tra thẳng file gốc.
- Khối **2.3 Present** dùng nguyên PS-0..PS-11 đã audit ở `IF1-COMPLETION-AUDIT.md` §2, cộng thêm
  chi tiết từ `SPEC-PRESENT-FLOW.md`/`SPEC-STAGE-0-IDEATION.md`/`IF-PRESENT-SPRINT-PLAN.md` do
  agent tự verify code (không trùng phạm vi PS).
- Các khối còn lại (Render/Material/Library/File Manager/Knowledge/Vitals/Infra) do 6 agent song
  song đọc toàn văn spec + tự grep/đọc code xác minh — KHÔNG chỉ chép lời spec.
- Mục thuộc **ArchiNote** (app hiện trường riêng biệt, KHÔNG nằm trong repo IF) được liệt kê vì
  `SPEC-ARCHINOTE-IF-BOUNDARY.md` có mô tả, nhưng đánh dấu **N/A ngoài phạm vi code IF** và KHÔNG
  tính vào 3 bảng tổng cuối file (không công bằng nếu chấm "chưa làm" cho việc chưa từng thuộc
  IF).
- Ngày tổng hợp: **2026-07-28**. Trạng thái các mục KHÔNG có trong 2 audit trên là ảnh chụp
  nhanh (1 lượt agent), không sâu bằng 2 audit chuyên đề — coi là ước lượng có căn cứ, không phải
  tuyệt đối.

---

## 1. MANAGER CENTER

### 1.1 Xác thực & phân quyền

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 1.1.1 | Google OAuth — mở mọi domain (đổi từ chỉ @ttt.vn, 19/07) | N | ✅ | không | `IF-FEATURE-SPEC-P1-v2.md` G3.1, `IF1-COMPLETION-AUDIT.md` §1 G3 |
| 1.1.2 | Admin cấp tay tài khoản ngoài | N | ✅ | không | `IF-FEATURE-SPEC-P1-v2.md` G3.2 |
| 1.1.3 | Grandfather user cũ ngoài domain | N | ⬜ moot (domain-gate đã gỡ hết, không còn gì để "grandfather") | 1.1.1 | `IF-FEATURE-SPEC-P1-v2.md` G3.3 |
| 1.1.4 | Remember Me 30 ngày | N | ✅ | không | `IF-FEATURE-SPEC-P1-v2.md` G3.4 |
| 1.1.5 | Auth tự viết (KHÔNG dùng Clerk/Auth0/Supabase/WorkOS) | — (quyết định có chủ đích, đã QUYẾT Q2b 28/07) | ✅ GIỮ `lib/server/auth.ts` tự viết — không còn "vi phạm" sau khi sửa `SPEC-PRODUCT-INFRA.md` ghi rõ: local-first mà phụ thuộc Clerk/Auth0 (dịch vụ cloud) là tự trói, đi ngược chính luật local-first của app | không | `SPEC-PRODUCT-INFRA.md` (đã sửa 28/07) |
| 1.1.6 | RBAC 5 vai (owner/crea/drafter/bim/viewer) + rank | N | ✅ mạnh hơn kỳ vọng spec (spec chỉ đề xuất 3 vai) | không | `SPEC-PRODUCT-INFRA.md` |
| 1.1.7 | Gate theo chặng (STAGE_OWNER: concept→crea, render→drafter, present→bim) | N | ✅ | 1.1.6 | `SPEC-PRODUCT-INFRA.md` |
| 1.1.8 | API mời/xoá thành viên dự án (chặn xoá owner cuối cùng) | N | ✅ | 1.1.6 | `SPEC-PRODUCT-INFRA.md` |
| 1.1.9 | Ba vai dự bị N (chủ studio/thành viên/khách xem, khách không tải bản gốc) | N | 🟡 thay bằng 5-role chi tiết hơn; riêng "khách xem không tải bản gốc" chưa xác minh gate | 1.1.6 | `SPEC-PRODUCT-INFRA.md` |

### 1.2 Cài đặt sản phẩm

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 1.2.1 | Ngôn ngữ VI/EN (song ngữ, có switcher) | N | ✅ | không | `SPEC-PRODUCT-INFRA.md` |
| 1.2.2 | Đơn vị mm/m | N | 🟡 có field trong store, chưa xác minh UI cài đặt riêng | không | `SPEC-PRODUCT-INFRA.md` |
| 1.2.3 | Phím tắt tuỳ biến (trang cài đặt) | N | ⬜ | không | `SPEC-PRODUCT-INFRA.md` |
| 1.2.4 | Tự lưu (autosave) | N | ✅ | không | `SPEC-PRODUCT-INFRA.md` |
| 1.2.5 | Giao diện sáng/tối | N | ✅ | không | `SPEC-PRODUCT-INFRA.md` |
| 1.2.6 | Mật độ hiển thị + cỡ chữ tuỳ chỉnh | N | ⬜ | không | `SPEC-PRODUCT-INFRA.md` |
| 1.2.7 | Kho model AI (checkpoint/LoRA/ControlNet, desktop) | P | ⬜ (chủ đích — chờ bọc Tauri, spec tự loại) | 7.1 Electron | `SPEC-PRODUCT-INFRA.md` |
| 1.2.8 | Extension/node manager — allowlist + pin version | P | ⬜ | không | `SPEC-PRODUCT-INFRA.md`, `SPEC-RENDER-STUDIO.md` (luật extension) |
| 1.2.9 | Trạng thái hệ thống (GPU/RAM/hàng đợi/dung lượng) | P | 🟡 hàng đợi render có (StatusBar); GPU/RAM/dung lượng chưa (đúng dự kiến — chỉ cần khi có desktop) | 7.1 Electron | `SPEC-PRODUCT-INFRA.md` |
| 1.2.10 | Auto-updater (Electron) | N | ✅ | không | `SPEC-PRODUCT-INFRA.md`, `IF-ARCHITECTURE-BLUEPRINT-v1.md` §1B |

> **1.3 — DỜI sang 2.0.24-2.0.33 (Q4, 28/07)**: Brief-Intake là đầu vào thiết kế (chặng Ý tưởng),
> không phải "quản lý công việc" — mã 1.3.x KHÔNG dùng lại, xem khối 2.0 Ý tưởng.

### 1.4 Ranh giới với ArchiNote (app hiện trường riêng biệt)

> Toàn bộ mục 1.4 mô tả **ArchiNote** — sản phẩm KHÁC, KHÔNG nằm trong repo `interiorflow`. Liệt
> kê vì `SPEC-ARCHINOTE-IF-BOUNDARY.md` định nghĩa hợp đồng dữ liệu giữa 2 app; đánh dấu N/A và
> **KHÔNG tính vào 3 bảng tổng cuối file**.

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 1.4.1 | 2 app không gọi nhau, chỉ cùng đọc/ghi Lark (mô hình) | — | N/A ngoài repo IF | không | `SPEC-ARCHINOTE-IF-BOUNDARY.md` |
| 1.4.2 | Hợp đồng dữ liệu `PROJECT_STATUS` (projectId/stage/%/updatedAt/link) | N | ⬜ **phía IF xác nhận KHÔNG có bridge nào đẩy trạng thái lên Lark** | không | `SPEC-ARCHINOTE-IF-BOUNDARY.md` |
| 1.4.3 | Đo lường & độ tin cậy (LiDAR/Laser BT/tay, metadata mỗi số đo) | N | N/A ngoài repo IF | không | `SPEC-ARCHINOTE-IF-BOUNDARY.md` |
| 1.4.4 | IF hiển thị nét theo nguồn đo (chuẩn/đen vs đứt/cam) | N | ⬜ **phía IF xác nhận KHÔNG có field "nguồn đo" trên entity CAD** | 1.4.3 | `SPEC-ARCHINOTE-IF-BOUNDARY.md` |
| 1.4.5 | 2 trợ lý 1 não (Vitals trả lời "trên bản vẽ này" · ArchiNote trả lời "cái gì/ở đâu") | — | 🟡 phần Vitals có thật (xem khối 6); phần ArchiNote N/A ngoài repo | 6. Vitals | `SPEC-ARCHINOTE-IF-BOUNDARY.md` |
| 1.4.6 | Điều phối người (ai gánh gì, xin/trả người, duyệt 1 chạm) | N | N/A ngoài repo IF | không | `SPEC-ARCHINOTE-IF-BOUNDARY.md` |
| 1.4.7 | 4 việc điện thoại làm (ảnh tại điểm/neo AR/ghi chú/đối chiếu thiếu số) | N/L | N/A ngoài repo IF | không | `SPEC-ARCHINOTE-IF-BOUNDARY.md` |
| 1.4.8 | 4 luật bắt buộc app hiện trường (offline-first/hàng đợi/nén/tự gắn ngữ cảnh) | — | N/A ngoài repo IF | không | `SPEC-ARCHINOTE-IF-BOUNDARY.md` |
| 1.4.9 | Vị trí công trình (bản đồ/chỉ đường/geofence check-in) | N | N/A ngoài repo IF | không | `SPEC-ARCHINOTE-IF-BOUNDARY.md` |
| 1.4.10 | An toàn nhân sự (check-in chủ động, tự xoá 7-30 ngày, SOS) | — | N/A ngoài repo IF | không | `SPEC-ARCHINOTE-IF-BOUNDARY.md` |
| 1.4.11 | Phân tích hiện trạng từ toạ độ (SunCalc: nắng/bóng/gió/khí hậu/view) | N | ⬜ **cả 2 phía đều chưa build** (grep SunCalc/windrose = 0 kết quả) | không | `SPEC-ARCHINOTE-IF-BOUNDARY.md` |
| 1.4.12 | Ghi âm → STT tiếng Việt gắn ảnh/vị trí | N | N/A ngoài repo IF | không | `SPEC-ARCHINOTE-IF-BOUNDARY.md` |
| 1.4.13 | Panorama ghim trên mặt bằng | N/P/L | N/A ngoài repo IF (và IF cũng chưa có phía nhận) | không | `SPEC-ARCHINOTE-IF-BOUNDARY.md` |
| 1.4.14 | Đổi tên "AI Vitat" (ArchiNote) tránh trùng "Vitals" (IF) | — | N/A ngoài repo IF | không | `SPEC-ARCHINOTE-IF-BOUNDARY.md` |

---

## 2. STUDIO (chặng 0→3: Ý tưởng · CAD · Render · Present)

### 2.0 Ý tưởng (Stage 0 Ideation)

> **Route `/projects/[id]/ideation` KHÔNG tồn tại** — toàn bộ 2.0 là ⬜ trừ khi ghi chú khác.
> `lib/phases.ts` hiện chỉ có 3 phase (concept/render/present), chưa có phase "ideation".

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 2.0.1 | Canvas moodboard tự do kiểu Milanote (KHÔNG phải chat/bình luận) | ? | ⬜ — `MoodboardModal.tsx` là engine dựng SẴN 1 ảnh board cố định, KHÁC "canvas vô hạn tự do" spec mô tả | không | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.2 | Board lồng nhau + thả note/link/to-do/cột (lấy của Milanote) | ? | ⬜ | 2.0.1 | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.3 | Chỉ bình luận async, KHÔNG multi-cursor real-time (lấy của Miro có chọn lọc) | ? | ⬜ (chưa có hạ tầng, nhất quán với quyết định chủ đích không làm real-time) | 2.0.1 | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.4 | Tái dùng canvas React Flow (hạ tầng có sẵn từ chặng Render) | ? | 🟡 hạ tầng React Flow có sẵn rộng khắp app, chưa có instance nào phục vụ ideation | 2.0.1 | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.5 | Tái dùng Library + Reference panel | ? | 🟡 tồn tại ở Present/Render, chưa nối vào Stage 0 | 2.0.1, 3. Library | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.6 | Chấm gu 10 trục tự động từ moodboard | P | 🟡 Gu Engine thật có (`lib/gu.ts`), nhưng manual-first (tag tay) không tự động; không thấy "radar 10 trục" trong code | 2.0.1 | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.7 | ATLAS vật liệu — ảnh có mã/giá/NCC | ? | 🟡 hook `photoUrl?` có tên đúng nhưng KHÔNG có field mã/giá/NCC | không | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.8 | Sinh prompt cho Render từ moodboard | L | ⬜ | 2.0.1, 2.2 Render | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.9 | Xuất board thành trang deck Present | P | ⬜ | 2.0.1, 2.3 Present | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.10 | Vật liệu mã+giá từ moodboard → BOQ | L | ⬜ **gộp vào 2.1.9.p (Q6, 28/07) — xem đó, không lặp lại ở đây** | 2.0.7, 2.1.9.p | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.11 | "Thả tim" — 1 thao tác 3 tác dụng (học gu + trích đặc trưng + cộng radar) | ? | ⬜ Perceptron thật có nhưng cho gợi ý template, không phải nút ♥ ảnh cảm hứng chặng 0 | 2.0.1, 2.0.6 | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.12 | Quy trình 3 bước: Trích xuất → Tổ hợp → Diễn giải (mỗi bước truy nguồn) | ? | ⬜ | 2.0.1 | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.13 | Kỹ thuật trích xuất — Canny/Sobel edge detection | N | ⬜ | 2.0.12 | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.14 | Kỹ thuật trích xuất — Posterize/threshold | N | ⬜ | 2.0.12 | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.15 | Kỹ thuật trích xuất — Potrace (contour→SVG) | N | ⬜ | 2.0.13, 2.0.14 | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.16 | Kỹ thuật trích xuất — K-means → palette 6 màu HEX | N | ⬜ | 2.0.12 | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.17 | Kỹ thuật trích xuất — cắt vùng chất liệu cho ATLAS | N | ⬜ | 2.0.12, 2.0.7 | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.18 | SAM tách vùng chính xác hơn (nâng cấp trích xuất) | P | ⬜ | 2.0.13–2.0.17 | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.19 | 6 template dẫn dắt (Site&Context/Local DNA/Element Extraction/Style DNA/Material&Light/Spatial Concept) | ? | ⬜ tất cả 6 | 2.0.12 | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.20 | Tự điền liên template (search dự án → dữ liệu tự chảy) | ? | ⬜ | 2.0.19 | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.21 | Vai trò Vitals ở chặng 0 (hỏi ngược chốt hướng, từ khoá EN, lọc nguồn hạng A-D) | ? | ⬜ (không kiểm sâu — Vitals nói chung thiếu function-calling, xem khối 6) | 6. Vitals | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.22 | Chat trong chặng 0 — quyết định KHÔNG làm (đã có Lark/Zalo) | — | ⛔ chủ đích không làm | không | `SPEC-STAGE-0-IDEATION.md` |
| 2.0.23 | Luật nguồn ảnh — KHÔNG lấy Pinterest, chỉ studio/CC0/AI-sinh/user-nạp | — (luật) | (không kiểm chứng — chính sách pháp lý) | 3.5 Nguồn & giấy phép | `SPEC-STAGE-0-IDEATION.md` |

#### Đề bài & khởi tạo dự án (Brief Intake — DỜI từ khối 1.3, Q4 28/07: đây là đầu vào thiết kế, không phải quản lý công việc)

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 2.0.24 | Đổi tên panel "AI mô tả — Đề bài chi tiết" → "Đề bài → Phương án" | — | ⬜ chưa đổi tên | không | `SPEC-BRIEF-INTAKE.md` |
| 2.0.25 | Luồng 6 bước chuẩn | N/P/L | 🟡 từng phần (①⑤⑥ có, ②③④ chưa) | không | `SPEC-BRIEF-INTAKE.md` |
| 2.0.25.a | ① Nạp hiện trạng (import DXF/DWG hoặc dùng bản vẽ hiện tại) | N | ✅ | không | `SPEC-BRIEF-INTAKE.md` |
| 2.0.25.b | ② Nạp brief thật PDF/Word/email/ảnh (KHÔNG chỉ gõ 1 dòng) | N | ⬜ chỉ có `<textarea>` gõ tay | 2.0.25.a | `SPEC-BRIEF-INTAKE.md` |
| 2.0.25.c | ③ Máy đọc trích + hỏi lại chỗ thiếu (LLM thật, human-in-loop) | N | 🔴 xác nhận vẫn RULE-BASED (từ khoá), code tự comment "chưa phải LLM" | 2.0.25.b | `SPEC-BRIEF-INTAKE.md`, `lib/cad/ai-assist.ts` |
| 2.0.25.d | ④ Chọn loại hình + chuẩn vận hành (Accor/Marriott…) | N | 🟡 tự nhận diện operator có (heuristic), chọn tay brand-standard chưa có UI | 2.0.25.c | `SPEC-BRIEF-INTAKE.md` |
| 2.0.25.e | ⑤ Sinh N phương án kèm căn cứ trích dẫn | N | ✅ sinh 3 phương án; 🟡 căn cứ trích dẫn chỉ có ở tầng quy chuẩn quốc gia, chưa có brand-standard | 2.0.25.d | `SPEC-BRIEF-INTAKE.md` |
| 2.0.25.f | ⑥ Chọn → máy học (Perceptron) | N | ✅ | 2.0.25.e | `SPEC-BRIEF-INTAKE.md` |
| 2.0.26 | Operator/loại hình tự nhận diện (residential/office/f&b/retail/hospitality/clinic) | N | ✅ | không | `SPEC-BRIEF-INTAKE.md`, `IF-FEATURE-SPEC-P1-v2.md` C3.1 |
| 2.0.27 | Chuẩn Accor/Marriott theo tenant — "kệ sách = tủ rỗng", không ship bản quyền mật | N | ⬜ không có cơ chế tủ sách/upload brand-standard theo tenant | 2.0.26 | `SPEC-BRIEF-INTAKE.md` |
| 2.0.28 | Luật trích dẫn mọi gợi ý kèm căn cứ (hạng nguồn A-D) | N | 🟡 có ở tầng TCVN quốc gia (checker tự ghi rõ khi thiếu căn cứ), chưa áp cho brand-standard | 2.0.27 | `SPEC-BRIEF-INTAKE.md`, `SPEC-KNOWLEDGE-BASE.md` |

### 2.1 CAD (Vẽ sơ phác + Pro mode)

> 101 item A-G dùng nguyên trạng thái GỘP từ `IF1-COMPLETION-AUDIT.md` §1 (2026-07-26,
> `file:line` thật). Điểm GỘP = (✅×1 + 🟡×0.5)/Tổng (loại ⛔ non-goal khỏi mẫu số phần trăm).

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 2.1.1 | A — Vẽ sơ phác (24 item: tường/phòng/hình phụ/edit gestures) | N | 🟡 21/24 ≈ 87.5% | không | `IF-FEATURE-SPEC-P1-v2.md` A, `IF1-COMPLETION-AUDIT.md` §1-A |
| 2.1.1.a | A1 Tường & Phòng (8 item) — thủng: A1.6 cột (chỉ qua thư viện phụ), A1.8 tường cong (⬜) | N | 🟡 | không | " |
| 2.1.1.b | A2 Hình vẽ phụ trợ (6 item) — A2.4 đường tự do là click-point, không phải kéo tự do | N | 🟡 5.5/6 | không | " |
| 2.1.1.c | A3 Chỉnh sửa/edit gestures (10 item) | N | ✅ 10/10 | không | " |
| 2.1.1.d | Bộ edit AutoCAD-style (offset/trim/fillet/chamfer/array/scale/stretch/break/join/explode) — gated Pro | N | ✅ xác nhận có thật, không phải stub (675 dòng `modify.ts` + test riêng) | 2.1.8 Sketch↔Pro | " |
| 2.1.2 | B — Thư viện kéo thả (21 item: 41 shape/9 nhóm + tương tác) | N | 🟡 18.5/21 ≈ 88% | không | `IF-FEATURE-SPEC-P1-v2.md` B, `IF1-COMPLETION-AUDIT.md` §1-B |
| 2.1.2.a | B1 Palette nội thất (10 nhóm) | N | ✅ 10/10, khớp đúng 41 shape/9 nhóm | không | " |
| 2.1.2.b | B2 Tương tác shape (drag/snap/resize/info/variant/collision-SAT/clearance/search) | N | ✅ 8/8 | không | " |
| 2.1.2.c | B3 Thư viện mở rộng (custom shape/import DXF block/team sync Drive) — cả 3 chưa thật | N | ⬜/🟡 0.5/3 | không | " |
| 2.1.3 | C — Tự động thông minh (18 item: auto-label/checker/Gu Engine) | N | 🟡 13.5/18 = 75% (audit thấp hơn tự chấm gốc 6-9 điểm%) | không | `IF-FEATURE-SPEC-P1-v2.md` C, `IF1-COMPLETION-AUDIT.md` §1-C |
| 2.1.3.a | C1 Auto-label & dimension (5 item) — room-name chỉ đề xuất, wall-dimension không hover được | N | 🟡 4/5 | không | " |
| 2.1.3.b | C2 TCVN Checker (7 item) — spec tự nhận "Pro đầy đủ", audit KHÔNG xác nhận: không badge thường trực, không nút Apply wizard | N | 🟡 5/7 (5 item chỉ nối 1 phần rule) | không | " |
| 2.1.3.c | C3 Gu Engine & AI Layout (6 item) | N/L | 🟡 4.5/6 | không | " |
| 2.1.4 | D — MEP sơ cấp (12 item: đèn/ổ cắm) | N | 🟡 7/9 ≈ 78% (loại 3 non-goal hộp gen) | không | `IF-FEATURE-SPEC-P1-v2.md` D, `IF1-COMPLETION-AUDIT.md` §1-D |
| 2.1.4.a | D1 Chiếu sáng (5 item) — D1.5 layer đèn riêng KHÔNG có (doc gốc chấm ✅ sai) | N | 🟡 4/5 | không | " |
| 2.1.4.b | D2 Ổ cắm & hộp gen (7 item) — D2.3-2.5 hộp gen ⛔ non-goal chủ đích (không có quy ước DXF tin cậy); D2.7 layer MEP riêng KHÔNG có | N | 🟡 3/4 (loại 3 non-goal) | không | " |
| 2.1.5 | E — Tô vật liệu (5 item: hatch + palette) | N | 🟡 2.5/5 = 50% (nhóm yếu nhất) | không | `IF-FEATURE-SPEC-P1-v2.md` E, `IF1-COMPLETION-AUDIT.md` §1-E |
| 2.1.5.a | E1.1-E1.2 tap-fill + thumbnail procedural texture (đóng gap 17/07) | N | ✅ | không | " |
| 2.1.5.b | E1.3 wall material (qua cơ chế hatch chung, không phải tool riêng) | N | 🟡 | không | " |
| 2.1.5.c | E1.4 Auto-update BOQ | N | ⬜ **gộp vào 2.1.9.p (Q6, 28/07) — xem đó, không lặp lại ở đây** | 2.1.9.p | " |
| 2.1.5.d | E1.5 Design DNA link (vật liệu↔GuProfile) | N | ⬜ | không | " |
| 2.1.6 | F — Xuất bản & chia sẻ (13 item, phần CAD của F2/F3) | N | 🟡 11/13 ≈ 85% | không | `IF-FEATURE-SPEC-P1-v2.md` F, `IF1-COMPLETION-AUDIT.md` §1-F |
| 2.1.6.a | F1 Pipeline IF (CAD→Render, Render→Present, Present→PDF/PPTX, multi-sheet ≤5 tab IDB) | N | ✅ 4/4 | không | " |
| 2.1.6.b | F2 Export (DXF/DWG-GPL-cô-lập, PDF, PNG, .idf CÓ migration path — cập nhật 28/07, khác audit gốc, xem STATUS.md, Share link chỉ luồng Render) | N | ✅/🟡 nâng cấp từ audit gốc — `.idf` migration đã thêm sau 26/07 | 4.7 Gateway | " |
| 2.1.6.c | F3 Cộng tác (PWA ✅ nâng từ 🔜, markup overlay ✅, Drive sync ⬜, photo embed ✅) | N | 🟡 3/4 | 7.4 Collaboration | " |
| 2.1.7 | G — Quản lý (8 item: layer/template/auth) | N | 🟡 5.5/8 ≈ 69% | không | `IF-FEATURE-SPEC-P1-v2.md` G, `IF1-COMPLETION-AUDIT.md` §1-G |
| 2.1.7.a | G1 Layer đơn giản (toggle ✅, preset "Mặt bằng bố trí" ⬜ — 0 bằng chứng) | N | 🟡 1/2 | không | " |
| 2.1.7.b | G2 Template dự án + title block (đọc Brand Kit per-project, không hardcode) | N | ✅ 2/2 | không | " |
| 2.1.7.c | G3 Auth — xem 1.1 Manager Center (không đếm trùng ở đây) | N | (xem 1.1) | 1.1 | " |
| 2.1.8 | Chế độ Sketch↔Pro (mode toggle) | N | ✅ dữ liệu chung 1 `.idf`, chuyển tay không mất | không | `SPEC-CAD-MODES.md` |
| 2.1.8.a | Tự nhận thiết bị (tablet→Sketch, desktop→Pro) + nhớ lựa chọn | N | ⬜ mặc định cứng 'sketch', không gate theo thiết bị | 2.1.8 | `SPEC-CAD-MODES.md` |
| 2.1.8.b | Gate tool theo role+stage (mở rộng gate cũ chỉ theo cadMode) | N | ✅ | 2.1.8, 1.1.6 | `SPEC-CAD-MODES.md` |
| 2.1.8.c | Nhận bút: lực nhấn/nghiêng/chống tì tay | N | ⬜ | không | `SPEC-CAD-MODES.md` |
| 2.1.8.d | Cử chỉ 2 ngón zoom/pan | N | ✅ | không | `SPEC-CAD-MODES.md` |
| 2.1.8.e | Cử chỉ 2/3 ngón chạm = undo/redo | N | ⬜ (chỉ có phím tắt) | 2.1.8.d | `SPEC-CAD-MODES.md` |
| 2.1.8.f | Nhận diện nét vẽ tay tự nắn thẳng | N | ⬜ | không | `SPEC-CAD-MODES.md` |
| 2.1.8.g | Radial menu (giữ lâu hiện tuỳ chọn) | N | ⬜ | không | `SPEC-CAD-MODES.md` |
| 2.1.8.h | Snap dung sai riêng cho ngón tay | N | ⬜ | không | `SPEC-CAD-MODES.md` |
| 2.1.8.i | Touch target ≥44px (Sketch) vs 34px (Pro) — 1 hàm `btnSize(pro)` | N | ✅ | 2.1.8 | `SPEC-CAD-MODES.md` |
| 2.1.8.j | Layout/Paper Space thật (nhiều viewport cùng 1 model) — hiện chỉ có multi-sheet-tab (mỗi tờ = Doc riêng) | N | ⬜ chưa có, chỉ có cơ chế tab riêng biệt thay thế tạm | 2.1.9 Semantic model | `SPEC-CAD-MODES.md`, `SPEC-SEMANTIC-MODEL.md` |
| 2.1.8.k | Xuất bộ hồ sơ — gộp nhiều tờ thành 1 PDF có mục lục | N | ✅ done (checklist 6 bước đủ, 30/07) — `buildSheetSetPdf()`/`exportSheetSetPdf()` (`lib/cad/pdf.ts`): trang 1 mục lục (số tờ·tên·khổ·tỉ lệ) + mỗi tờ 1 trang, TÔN TRỌNG `paperKey`/`printScale` riêng từng tờ (mỗi trang `addPage([pw,ph], orientation)` riêng, không ép chung 1 khổ) + bookmark PDF thật (`pdf.outline.add`, Outline PlugIn lõi jsPDF, không thêm dependency). Nối vào IOMenu chặng CAD cạnh `.idf` (`CadEditor.tsx`) qua CustomEvent `cad:sheetset-pdf-export-request` — CÙNG pattern bắc cầu đã dùng cho `.idf`/`.ifpack` (`CadSheets.tsx` giữ `sheets[]`, `CadEditor.tsx` không giữ). Luật #9 (≥300dpi): KHÔNG áp dụng — hàm này 100% vector (dùng lại `drawEntityPdf`, 0 `addImage()` trong file, đã grep xác nhận), Luật #9 chỉ áp cho export RASTER (`docs/LUAT-300DPI-2026-07-29.md`) nên không có nhánh "báo dpi" — không phải bỏ sót. 13/13 test mới (`pdf-sheetset.test.ts`) — 3 tờ khác khổ → 4 trang đúng khổ + đúng bookmark; 0 tờ → 1 trang mục lục không crash. ⚠️ Lệch nhẹ so với brief: test dùng khổ **A1/A2/A3** thay vì "A2/A3/A4" — `PaperKey` (`model.ts:490`) chỉ có 3 giá trị này, KHÔNG có 'A4', xác nhận 30/07. Sửa kèm doc drift `docs/MULTI-SHEET-PROPOSAL.md` §7 ("không persist qua reload" — sai, đã persist IndexedDB từ J-3 Sprint 2). | không | `SPEC-CAD-MODES.md` |
| 2.1.9 | Semantic model (ngữ nghĩa gắn trên hình học, không phải mô hình nặng kiểu Revit) | N | ✅ đúng định vị (`elementType?` additive) | không | `SPEC-SEMANTIC-MODEL.md` |
| 2.1.9.a | Một model nhiều bản chiếu (view-filter, không phải file riêng) | N | 🟡 hiện là tab=Doc riêng, chưa phải view-filter thật | 2.1.8.j | `SPEC-SEMANTIC-MODEL.md` |
| 2.1.9.b | Luật chỉ thêm ngữ nghĩa khi đã có nơi tiêu thụ (chống mô hình hoá quá mức) | — (nguyên tắc) | ✅ tinh thần additive-only xác nhận trong code | không | `SPEC-SEMANTIC-MODEL.md` |
| 2.1.9.c | Wall/Room/Zone có ngữ nghĩa sống — CHỈ Zone đạt (group thật), Wall/Room chỉ suy luận tạm | N | 🟡 (M1-b gate, xem `IF1-COMPLETION-AUDIT.md` §3b) | không | `SPEC-SEMANTIC-MODEL.md`, `IF1-COMPLETION-AUDIT.md` §3 |
| 2.1.9.d | ⭐ Luật §8 — LLM ra ý định, CODE tính toạ độ (LLM không viết x/y) | N | 🟡 đúng khung (`layoutToEntities` tách khỏi `parseDescription`) nhưng `parseDescription` là stub rule-based, chưa có LLM thật | không | `SPEC-SEMANTIC-MODEL.md` §8, `lib/cad/ai-assist.ts` |
| 2.1.9.e | 4 lớp bắt buộc: LLM→ý định · SOLVER→toạ độ · VALIDATOR→kiểm+tự sửa 3 vòng · RENDERER→vẽ+nhãn | N | 🟡 Lớp 1 stub · Lớp 2 có (`aabbOverlap`) · Lớp 3 KHÔNG có vòng tự-sửa (chỉ check 1 lần rồi bỏ, khớp nợ kỹ thuật STATUS.md) · Lớp 4 dimension liên kết ✅, label-tránh-đè ⬜ | 2.1.9.d | `SPEC-SEMANTIC-MODEL.md` §8 |
| 2.1.9.f | Chuỗi kích thước liên kết (associative dimension, không nhận số gõ tay) | N | ✅ `DimEntity` luôn tính lại từ hình học | không | `SPEC-SEMANTIC-MODEL.md` |
| 2.1.9.g | Đặt nhãn tránh đè (label collision avoidance) | N | ⬜ | 2.1.9.e | `SPEC-SEMANTIC-MODEL.md` |
| 2.1.9.h | Solver ràng buộc đặt nội thất (áp tường/giữa 2 vật/lối đi ≥900mm/không chồng) | N | 🟡 áp tường+không chồng có; lối đi ≥900mm chưa xác minh enforce | 2.1.9.e | `SPEC-SEMANTIC-MODEL.md` |
| 2.1.9.i | Vùng tô: màu (hiển thị) ≠ vật liệu (dữ liệu matId→hãng/mã/giá) — 4 chế độ hiển thị chung dữ liệu | N | ⬜ chỉ 1 kiểu vẽ hatch, chưa có 4-chế-độ. ✅ **CHỐT 30/07 (`docs/REVIEW-SPEC-BOQ-LARK-2026-07-30.md` §2③)** — câu hỏi "matId nối vào đâu" trả lời: **BẢNG RIÊNG**. `MaterialDef` (`lib/cad/materials.ts`, dùng để VẼ TEXTURE — `material-texture.ts`) CHỈ thêm 1 field neo `atlasRecordId?: string`; Giá/Đơn vị/Hao hụt/Quy cách/Mã thay thế → bảng Prisma riêng `AtlasMaterial` (cache từ ATLAS Lark). Lý do: texture đổi theo thiết kế, giá đổi theo NCC — 2 nhịp sống khác nhau, KHÔNG trộn vào `MaterialDef`. Quyết định này mở khoá `2.1.9.p` (BOQ) — xem đó. | 4.7, 2.2.9 Material Pipeline | `SPEC-SEMANTIC-MODEL.md` |
| 2.1.9.j | `tiling size (mm)` bắt buộc cho vùng vật liệu | N | ⬜ | 2.1.9.i | `SPEC-SEMANTIC-MODEL.md` |
| 2.1.9.k | BOQ tự sinh từ vùng tô (diện tích×matId→m²×đơn giá+hao hụt) | N | ⬜ **gộp vào 2.1.9.p (Q6, 28/07) — xem đó, không lặp lại ở đây** | 2.1.9.p | `SPEC-SEMANTIC-MODEL.md` |
| 2.1.9.l | Present — style chữ/màu dùng chung toàn deck (shared styles) | N | ✅ `theme-roles.ts` remap thật | 2.3 Present | `SPEC-SEMANTIC-MODEL.md` |
| 2.1.9.m | Present — master page (mọi trang cùng loại đổi 1 lượt) | N | 🟡 tên hằng số có thể đã đổi, cần xác nhận | 2.1.9.l | `SPEC-SEMANTIC-MODEL.md` |
| 2.1.9.n | Present — liên kết sống về CAD (sửa bản vẽ → deck tự cập nhật) — moat | L | ⬜ `linked-assets.ts` có tên gợi ý nhưng chưa xác minh live-update thật | 2.1.9.a | `SPEC-SEMANTIC-MODEL.md` |
| 2.1.9.o | L6 công thức lumen đọc reflectance vật liệu | P | 🟡 xem 2.2.9 Material Pipeline (trùng, không đếm 2 lần) | 2.2.9 | `SPEC-SEMANTIC-MODEL.md` |
| 2.1.9.p | ⭐ BOQ (Bill of Quantity) — SÁNG KIẾN GỘP DUY NHẤT (Q6, 28/07) | N | ⬜ **0 dòng code toàn repo** (xác nhận lại 28/07). ✅ **"matId nối vào đâu" ĐÃ CHỐT 30/07** — xem `2.1.9.i` (bảng riêng `AtlasMaterial` + `MaterialDef.atlasRecordId`). Câu hỏi "có làm không" **vẫn CHỜ Hoà quyết** — groundwork (`2.1.9.q`) làm trước, engine BOQ thật (bảng dưới) chưa greenlight. **Kiến trúc khoá sẵn khi làm** (`docs/REVIEW-SPEC-BOQ-LARK-2026-07-30.md` §8 ƯU TIÊN 3, không phải việc code riêng — ghi chú cho lượt sau): BOQ = **`lib/cad/schedule.ts` MỞ RỘNG**, không phải module mới (đã có `ScheduleRow{key,label,count,w,h,block,specId,ids}`+`ELEMENT_TYPE_LABELS`, thêm nhánh diện tích/chiều dài/thể tích vào đúng engine đó). Chuỗi 5 bước bắt buộc `qty_geom→qty_design→qty_exec→qty_order→amount`, `Decimal(12,4)` nội bộ không làm tròn giữa chừng, `qty_order` luôn CEILING. `boqToEntities()` theo đúng Q-L3 như `scheduleToEntities()` — entity THƯỜNG + nút "Cập nhật lại", KHÔNG object sống. | 2.1.9.i (✅ chốt matId 30/07 — không còn chặn cứng); 2.1.9.q (groundwork hình học — polygonPerimeter + trừ lỗ mở) | `SPEC-SEMANTIC-MODEL.md`, `SPEC-MATERIAL-PIPELINE.md`, `SPEC-STAGE-0-IDEATION.md`, `IF-FEATURE-SPEC-P1-v2.md` E1.4 — **gộp 4 chỗ trước đây rải rác: 2.1.5.c (E1.4 CAD) · 2.1.9.k (semantic model) · 2.2.29.f (material pipeline) · 2.0.10 (ý tưởng/moodboard) — không lặp lại mô tả ở 4 chỗ đó nữa, chỉ trỏ về đây.** |
| 2.1.9.q | Groundwork đo bóc hình học cho BOQ — `polygonPerimeter(poly, edgeMask?)` (`hatch.ts`, cùng phong cách `polygonArea`, `edgeMask` vì "nẹp cạnh chỉ lấy cạnh biên") + trừ lỗ mở Đường A (entity `ElementType.door`/`.window` đã phân loại nằm trong polygon, ngưỡng m² vào CONFIG không hard-code) | N | ⬜ chưa có — cấp mã 30/07 (`docs/REVIEW-SPEC-BOQ-LARK-2026-07-30.md` §2①②, gộp 2 việc cùng file `lib/cad/hatch.ts` thành 1 mã theo yêu cầu Hoà — không tách `.r` riêng để khỏi xé lại `2.1.9.p` vừa gộp) | 2.1.9.p (BOQ dùng nó) | `docs/REVIEW-SPEC-BOQ-LARK-2026-07-30.md` §2 |
| 2.1.10 | Editor toolkit — luật "một năng lực, hai lối vào" (Lối Tay + Lối AI gọi CÙNG hàm) | N | 🟡 Lối Tay từng phần có, Lối AI gọi cùng hàm (function-calling) KHÔNG có | 6.7 Vitals function-calling | `SPEC-EDITOR-TOOLKIT.md` |
| 2.1.10.a | Thứ tự bắt buộc: năng lực→nút→AI gọi hàm | N | 🟡 bước 1-2 từng phần, bước 3 chưa | 2.1.10 | `SPEC-EDITOR-TOOLKIT.md`, `IF-ARCHITECTURE-BLUEPRINT-v1.md` §8 luật 7 |
| 2.1.10.b | AI thất bại phải nói thẳng + liệt kê lối thay thế | N | ⬜ | 2.1.10 | `SPEC-EDITOR-TOOLKIT.md` |
| 2.1.10.c | Một canvas engine dùng chung Deck/Graphic/Photo (chỉ Video khác biệt thật) | N | 🟡 kiến trúc 1-engine có cho Deck; Graphic/Photo chưa xác minh cùng engine | không | `SPEC-EDITOR-TOOLKIT.md` |
| 2.1.10.d | Nguyên tắc dùng lib mã nguồn mở (Fabric/Konva/tldraw/Remotion/FFmpeg.wasm) thay tự viết engine | N | ⬜ chưa áp dụng — `package.json` không có các lib này, Present tự viết canvas engine riêng | không | `SPEC-EDITOR-TOOLKIT.md` |

### 2.2 Render

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 2.2.1 | Hai mặt phẳng làm việc (canvas ảnh/mask + node graph ẩn dưới) | N | ✅ | không | `SPEC-RENDER-STUDIO.md` §1 |
| 2.2.2 | Tool Mode — 3 tầng cách nhìn (VIỆC B, 28/07) | N | ✅ | không | `SPEC-RENDER-STUDIO.md` §1B, §6B |
| 2.2.2.a | Tầng 1 — lưới 6 thẻ việc, MẶC ĐỊNH khi vào chặng | N | ✅ | không | " |
| 2.2.2.b | Tầng 2 — form 2 cột (ẢNH GỐC/KẾT QUẢ), tham số động từ node registry thật | N | ✅ | 2.2.2.a | " |
| 2.2.2.c | Tầng 3 — "Mở canvas" = node graph cũ nguyên vẹn, không mất state | N | ✅ | 2.2.2.b | " |
| 2.2.2.d | canvas-handoff cho node cần input thứ 2 (thẻ "Sửa một mảng" chỉ dựng node rồi mở canvas) | N | ✅ | 2.2.2.c | " |
| 2.2.2.e | Nhớ lựa chọn người dùng (persist view+card localStorage) | N | ✅ | không | " |
| 2.2.2.f | Ngưỡng thiết bị ≤7 inch — ép Tool Mode | N | 🟡 xấp xỉ bằng CSS px 700, không phải kích thước vật lý thật, chưa test máy thật | 2.2.2.a | " |
| 2.2.2.g | Rail trái — nhãn chữ luôn hiện (sửa lỗi gốc #2) | N | ⬜ chưa sửa | không | `SPEC-RENDER-STUDIO.md` §1B, `docs/UI-SYSTEM-AUDIT.md` |
| 2.2.3 | 6 công đoạn ComfyUI ẩn/lộ (Load/Preprocess/Conditioning/Sampling/Post/Output) | ? | 🟡 ngầm định qua thiết kế params, không có phân loại tường minh | không | `SPEC-RENDER-STUDIO.md` §2 |
| 2.2.4 | Bảng chuyển ngữ núm (ControlNet weight/denoise/IPAdapter/steps/IC-Light/upscale) | N | 🟡 5/6 núm có tương đương gần đúng (tên/khoảng lệch spec); "Bám ảnh mẫu IPAdapter" và "Độ kỹ steps" hoàn toàn chưa lộ ra | không | `SPEC-RENDER-STUDIO.md` §3 |
| 2.2.5 | Flow "Sửa một mảng trên ảnh có sẵn" (thả ảnh→mask→scribble→reference→render) | N | 🟡 có mask+inpaint+SAM, thiếu scribble ControlNet riêng + input reference thứ 2 | không | `SPEC-RENDER-STUDIO.md` §4 |
| 2.2.5.a | Cảnh báo color match sau inpaint | N | ⬜ | 2.2.5 | " |
| 2.2.5.b | Cảnh báo crop+viền đệm rồi dán lại (crop & stitch) | N | ⬜ (có crop/composite tổng quát, không phải cơ chế tự động này) | 2.2.5 | " |
| 2.2.5.c | Cảnh báo ControlNet không tự sửa phối cảnh | ? | ⬜ | 2.2.5 | " |
| 2.2.6 | Bộ công cụ canvas bậc N (mask+tẩy, biên mềm, chọn vùng, layer, undo, so sánh Trước/Sau) | N | 🟡 phần lớn có, "thả reference" chưa rõ | không | `SPEC-RENDER-STUDIO.md` §5 |
| 2.2.7 | Bộ công cụ canvas bậc P (SAM chọn vùng ✅, rembg ✅, vẽ nét bám phối cảnh ⬜, color match ⬜) | P | 🟡 2/4 | 2.2.6 | `SPEC-RENDER-STUDIO.md` §5 |
| 2.2.8 | Bộ công cụ canvas bậc L (mask từ CAD biết tường W-01, reference tự đề xuất theo gu, 4 biến thể) | L | ⬜ | 2.2.7, 2.1.9 CAD semantic | `SPEC-RENDER-STUDIO.md` §5 |
| 2.2.9 | Hệ template — mỗi thẻ = workflow.json+manifest+preview+inputs+knobs+requires | ? | 🟡 `TaskCard` đơn giản hoá, thiếu file riêng + trường `requires` | 2.2.2 | `SPEC-RENDER-STUDIO.md` §6 |
| 2.2.9.a | Preview thẻ mức 1 — crossfade 2 ảnh hover | N | 🟡 hiện chia đôi ảnh tĩnh, không crossfade hover | 2.2.9 | " |
| 2.2.9.b | Preview thẻ mức 2 — clip ngắn WebM/MP4 | N | ⬜ | 2.2.9.a | " |
| 2.2.9.c | Preview thẻ mức 3 — thanh trượt so sánh | N | ⬜ (có node `util.compare` ở tầng node graph, chưa lộ ra Tool Mode) | 2.2.9.a, 2.2.9.b | " |
| 2.2.10 | 6 thẻ cho bản N — xem chi tiết 2.2.2 | N | ✅ | 2.2.2 | `SPEC-RENDER-STUDIO.md` §6 |
| 2.2.11 | Kho thẻ — bộ lọc Chặng/Nhóm việc/Chạy ở đâu/Sort | ? | ⬜ chỉ có lưới 6 thẻ cố định | 2.2.13 (3 tab) | `SPEC-RENDER-STUDIO.md` §6 |
| 2.2.12 | Bộ ảnh mẫu chuẩn 7 cảnh "Atelier Nord" | ? | 🟡 chỉ 1 cặp thật (sketch-in/out), chưa đủ 7 cảnh | không | `SPEC-RENDER-STUDIO.md` §6 |
| 2.2.13 | Luật extension/custom node — allowlist/pin version/kiểm requires | ? | ⬜ | 1.2.8 | `SPEC-RENDER-STUDIO.md` §6 |
| 2.2.14 | 6B Ba khái niệm Node/Thẻ/Flow — "Flow" (chuỗi nhiều tool) chưa lưu được thành đơn vị riêng | ? | 🟡 | không | `SPEC-RENDER-STUDIO.md` §6B |
| 2.2.15 | 6B Ba tab kho thẻ "Của IF/Cộng đồng/Của tôi" | P | ⬜ | 2.2.11 | `SPEC-RENDER-STUDIO.md` §6B |
| 2.2.16 | 6B Tool "Đọc gu từ ảnh khách" (Style Writer) — 1 trong 3 tool đắt nhất | L | 🟡 Gu Engine đã nối vào node AI thật, nhưng chưa có UI "5 ảnh Pinterest" trong Tool Mode | 2.2.15 | `SPEC-RENDER-STUDIO.md` §6B |
| 2.2.17 | 6B Tool "Đổi góc phối cảnh" (Shot Explorer) — moat, hình học 3D thuần | L | 🟡 hạ tầng camera+extrude ĐÃ CÓ (`three.camera`/`three.cad2fbx`) nhưng chưa lộ ra Tool Mode card | 2.2.24 (pull tường) | `SPEC-RENDER-STUDIO.md` §6B |
| 2.2.18 | 6B Tool "Lưới vật liệu/moodboard" (Grid Architect) — gắn mã/giá/NCC từng ô | L | 🟡 lưới moodboard thật có, chưa gắn mã vật liệu/giá/NCC | 5. Knowledge ATLAS | `SPEC-RENDER-STUDIO.md` §6B |
| 2.2.19 | 6B Tool "Đặt món nội thất vào phòng" (Mockup) | P | 🟡 có composite tổng quát, không phải tool chuyên biệt | không | `SPEC-RENDER-STUDIO.md` §6B |
| 2.2.20 | 6B Tool "Ghép clip→video deck" (Stringout Creator) | P | 🟡 sinh video đơn lẻ có, ghép nhiều clip thành deck chưa | không | `SPEC-RENDER-STUDIO.md` §6B |
| 2.2.21 | 6B Tool "Kịch bản video thuyết trình" (Storyboard Studio) | ? | ⬜ | không | `SPEC-RENDER-STUDIO.md` §6B |
| 2.2.22 | 6B nhóm tool KHÔNG lấy (Character X-Ray/Weirdcore/Video Granulator/pixelBento/Shader) | — | ⛔ đúng chủ đích | không | `SPEC-RENDER-STUDIO.md` §6B |
| 2.2.23 | ⭐6C Sinh diện đồ nội thất bằng suy luận hình học (trục đối xứng→ranh giới→smart mirror→nắn phối cảnh) | L | ⬜ thuần tài liệu 28/07, chưa code | 2.2.24 (furnitureextract có sẵn làm input) | `SPEC-RENDER-STUDIO.md` §6C |
| 2.2.23.a | 4a Tìm trục đối xứng (máy đề xuất + người kéo chỉnh) | L | ⬜ | 2.2.23 | " |
| 2.2.23.b | 4b Mặt phẳng cắt thấy/khuất (silhouette boundary constraint) | L | ⬜ | 2.2.23.a | " |
| 2.2.23.c | 4c Smart Mirror (soi gương phần thấy sang khuất) | L | ⬜ | 2.2.23.a, 2.2.23.b | " |
| 2.2.23.d | 4d Nắn phối cảnh trước khi gương (perspective rectification) | L | ⬜ | 2.2.23.a-c | " |
| 2.2.23.e | Phát hiện đồ KHÔNG đối xứng → tắt smart mirror | L | ⬜ | 2.2.23.c | " |
| 2.2.23.f | Diện mặt sau — 3 tầng (để trống/tra kho/AI nội suy có phí) | L | ⬜ | 2.2.23.g | " |
| 2.2.23.g | Kho nhớ hình dáng — bảng `FurnitureShapeMemory` (đề xuất, chưa migrate) | L | ⬜ | không | " |
| 2.2.23.h | Embedding CLIP-style (nvidia/nvclip) cho kho nhớ | L | ⬜ (đề xuất, hạ tầng NIM có sẵn cho text embedding, chưa dùng cho ảnh) | 2.2.23.g | " |
| 2.2.23.i | So khớp cosine similarity (tái dùng `lib/notebook/similarity.ts`) | L | ⬜ hàm có sẵn, chưa có lời gọi từ ngữ cảnh furniture-shape | 2.2.23.h | " |
| 2.2.24 | Chuỗi 2D→3D→Render (4 khúc) | N | 🟡 3/5 khúc chính có | không | `SPEC-RENDER-STUDIO.md` §7 |
| 2.2.24.a | ① MB tô vật liệu (ngữ nghĩa) | N | ✅ | không | " |
| 2.2.24.b | ② Pull tường→khối 3D (extrude hình học thuần, DCEL) | N | ✅ | không | " |
| 2.2.24.c | ③ Grey-box→phối cảnh (ControlNet Depth) | N | ✅ | 2.2.24.b | " |
| 2.2.24.d | ④a Diagram luồng giao thông (vector từ semantic model, 0 credit) | L | ⬜ | 2.1.9 CAD semantic model (T3/T4 CHƯA LÀM) | " |
| 2.2.24.e | ④b Video người đi lại — chủ đích dùng D5 ngoài IF | — | ⛔ đúng chủ đích | không | " |
| 2.2.25 | Tutorial 3 tầng — 5 coachmark lần đầu vào chặng | N | ⬜ chỉ có hạ tầng coachmark chung, CHƯA đăng ký coachmark nào cho Render | không | `SPEC-RENDER-STUDIO.md` §8 |
| 2.2.26 | Tutorial — 1 dòng gợi ý + ảnh Trước/Sau mỗi thẻ | N | 🟡 có desc 1 dòng, thiếu ảnh thật cho 5/6 thẻ | 2.2.10 | `SPEC-RENDER-STUDIO.md` §8 |
| 2.2.27 | Tutorial — nút "Mở nâng cao" lối xuống node graph | N | ✅ | 2.2.2.c | `SPEC-RENDER-STUDIO.md` §8 |
| 2.2.28 | Xuất — tự động gắn `img_` id → Library | N | ✅ | 3. Library | `SPEC-RENDER-STUDIO.md` §2 |

#### 2.2.29 Material Pipeline

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 2.2.29 | Một mã vật liệu, BỐN mặt (nhận dạng/CAD/AI/PBR) | N | 🟡 mặt "nhận dạng" gần đủ qua `ProductSpec`; CAD rời rạc; AI/PBR chưa có field nào | không | `SPEC-MATERIAL-PIPELINE.md` |
| 2.2.29.a | `ProductSpec` API + UI Legend/Schedule | ? | ✅ | không | " |
| 2.2.29.b | Chuỗi giá trị "vẽ một lần, năm nơi dùng" (CAD/AI/V-Ray-D5/BOQ/Present) | ? | 🟡 CAD ✅, AI Render 🟡 (prompt thủ công), V-Ray/D5 ⬜, BOQ ⬜ | 2.2.29 | " |
| 2.2.29.c | Vùng tô vật liệu (material zone) khác tô màu — đổi mã tự đổi callout/BOQ | N | ⬜ chỉ có hatch pattern/scale/angle, chưa có material-zone thật | 2.1.9.i | " |
| 2.2.29.d | 4 chế độ hiển thị (Kỹ thuật/Trình bày/Ảnh thật/Phân tích, 1 dữ liệu) | N | ⬜ chỉ 1 kiểu vẽ | 2.2.29.c | " |
| 2.2.29.e | Trường bắt buộc `tiling size (mm)` | N | ⬜ (trùng 2.1.9.j) | 2.2.29.c | " |
| 2.2.29.f | Vùng tô tự biết diện tích → callout/legend/BOQ/prompt AI/V-Ray-D5 tự sinh | N | 🟡 tính diện tích có (dùng cho 3D extrude); phần BOQ **gộp vào 2.1.9.p (Q6, 28/07)** — phần callout/legend/V-Ray-D5 còn lại vẫn ⬜ ở đây | 2.2.29.c, 2.1.9.p (phần BOQ) | " |
| 2.2.30 | L6 chiếu sáng — 3 mức | N/P/L | 🟡 | 2.1.9.o | `SPEC-MATERIAL-PIPELINE.md` §4 |
| 2.2.30.a | Mức 1 hình học (vị trí đèn/vùng phủ) — 0 credit | N | 🟡 có `suggestLightGridPositions` (MEP suggest) nhưng khác khung "diagram trình bày" | 2.2.30 | " |
| 2.2.30.b | Mức 2 công thức lumen E=(Φ×n×UF×MF)/A + reflectance vật liệu | P | 🟡 có công thức NGƯỢC chiều (lux mục tiêu→số đèn) trong `mep-suggest.ts`, không đọc reflectance | 2.2.30.a | " |
| 2.2.30.c | Mức 3 mô phỏng vật lý — chủ đích để V-Ray/D5/Dialux | — | ⛔ đúng chủ đích | không | " |
| 2.2.30.d | Mặt bằng chiếu sáng (lighting plan SVG/Canvas, quầng sáng, 0 credit) | N | ⬜ | 2.2.30.e | " |
| 2.2.30.e | Đối tượng "đèn" có ngữ nghĩa (vị trí/loại/quang thông) — điều kiện tiên quyết | N | ⬜ chưa có entity ngữ nghĩa, chỉ có gợi ý tính toán không lưu | 2.1.9 CAD semantic (T3/T4 CHƯA LÀM) | " |
| 2.2.31 | PBR chuẩn chung (MaterialX/glTF) cho V-Ray & D5 | N | ⬜ | 2.2.29 | `SPEC-MATERIAL-PIPELINE.md` §5 |
| 2.2.31.a | Xuất V-Ray (.vrmat) | N | ⬜ | 2.2.31 | " |
| 2.2.31.b | Xuất D5 (thư viện D5/glTF) | N | ⬜ | 2.2.31 | " |
| 2.2.31.c | Xuất SketchUp/3ds Max | N | ⬜ | 2.2.31 | " |
| 2.2.32 | Nguồn map hợp pháp — trường nguồn+giấy phép trong schema | N | ⬜ chỉ có comment, không phải field schema | không | `SPEC-MATERIAL-PIPELINE.md` |
| 2.2.33 | Bậc N — duyệt kho/xem trước/gán bề mặt CAD/xuất V-Ray-D5 (KHÔNG xây node editor vật liệu) | N | 🟡 duyệt+gán ✅, xuất ⬜ | 2.2.29 | `SPEC-MATERIAL-PIPELINE.md` §6 |
| 2.2.34 | Bậc P — chỉnh nhanh màu/bóng/tiling + tự sinh prompt AI từ mã vật liệu | P | 🟡 chỉnh màu ✅, bóng/tiling ⬜, prompt AI hiện thủ công không tự tra ATLAS | 2.2.33 | `SPEC-MATERIAL-PIPELINE.md` §6 |
| 2.2.35 | Bậc L — mini node graph trộn 2 vật liệu (chỉ khi người thật đòi) | L | ⬜ (đúng chủ đích, chưa có yêu cầu) | 2.2.34 | `SPEC-MATERIAL-PIPELINE.md` §6 |
| 2.2.36 | Lộ trình — chốt schema 4 mặt (T1) | N | 🟡 | 2.2.29 | `SPEC-MATERIAL-PIPELINE.md` §7 |
| 2.2.37 | Lộ trình — nhập ATLAS Vol.3 Lark Base (30-50 vật liệu) | N | ⬜ chỉ 13 preset thủ công, không gắn `larkRecordId` | 2.2.36 | `SPEC-MATERIAL-PIPELINE.md` §7 |

#### 2.2.60-2.2.85 — SPEC TỔNG Cowork 29/07 (Sprint 1-6, dán 30/07)

> Nguồn: `docs/SPEC-TONG-COWORK-2026-07-29.md` §3-§8 + `docs/TICKET-FONT-MONO-NODE-2026-07-29.md`.
> Đã kiểm trùng trước khi dán (xem cảnh báo cuối file "PHẦN E" — batch này xác nhận KHÔNG trùng mã
> có sẵn, đây chính là đợt dán riêng đã hẹn). **Bậc N** cho toàn batch là suy luận hợp lý (spec gốc
> không tự gán N/P/L cho các mã Sprint) — trừ `2.3.60` ghi rõ là suy luận riêng.
>
> **Thứ tự phụ thuộc ĐÃ CHỐT** (Sprint 3, `docs/SPEC-TONG-COWORK-2026-07-29.md` §3 ①-⑤, dùng đúng mã
> hiện có trong cây — không dùng mã cũ sai `7.23`):
> **`2.2.77` → `2.2.69` (gộp chung commit với `2.2.85`) → `2.2.65` → `2.2.78` → `7.1.18` → phần còn
> lại** (⑥⑦ trong §3: `2.2.70/71/79/80/81`, `2.2.72`, `2.2.66/67`, `2.3.61`, `2.2.84` — các mục này
> phụ thuộc `7.1.18` xong trước, thứ tự riêng giữa chúng KHÔNG bắt buộc).
>
> **Không dán trong đợt này** (ngoài phạm vi yêu cầu 30/07, còn ở `SPEC-TONG-COWORK-2026-07-29.md`
> §3 chờ đợt sau): `2.2.62`-`2.2.64` (Backlog — PBR/đóng gói đa góc nhìn, khuyến nghị KHÔNG làm) ·
> `2.2.73`-`2.2.74` (Sprint 6 — Gallery công thức/chia sẻ `.ifpack`).

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 2.2.60 | Sửa tràn khung thanh đầu (Header) — gộp Thêm vào canvas/Mở tệp/Xuất thành 1 menu "Tệp", priority+ overflow giữ Chạy flow+avatar cố định bên phải | N | ✅ done (checklist 6 bước đủ) — commit `57124b3`, browser-verify thật 1024/1183/1440px | không | `docs/SPEC-TONG-COWORK-2026-07-29.md` §4.1 |
| 2.2.61 | Dời `AiTierMenu` khỏi Header sang trang Cài đặt, Header chỉ còn 1 chấm trạng thái nhỏ | N | ✅ done (checklist 6 bước đủ) — commit `57124b3` (`components/settings/AiDependencySettings.tsx` mới, `app/settings/page.tsx` mới, `Header.tsx` chỉ còn `<AiStatusDot/>`) | 2.2.60 (cùng file `Header.tsx`, chung 1 commit) | `docs/SPEC-TONG-COWORK-2026-07-29.md` §4.2 |
| 2.2.61.a | Gỡ picker AI tier trùng khỏi `MobileMenu.tsx` (bỏ sót khi làm `2.2.61`, phát hiện 30/07 — vi phạm Luật #6 Đồng Bộ, một cấu hình hai mặt tiền), thay bằng dòng dẫn sang `/settings` | N | ✅ done (checklist 6 bước đủ) — commit `77224dc`, `TierRow()` (bảng 4 tầng+engine/runtime thật) → `TierLinkRow()` (tên tier + `AiStatusDot` + link), browser-verify thật ở viewport 375px xác nhận href `/settings` | 2.2.61 | `docs/TICKET-SETTINGS-GOM-CAU-HINH-2026-07-29.md` |
| 2.2.65 | `lib/products.ts` — một danh mục sản phẩm đầu ra dùng chung chặng 2+3 (6 sản phẩm: board concept/bộ ảnh phương án/hồ sơ khách/spec sheet/bảng vật liệu/ảnh in khổ lớn) | N | ⬜ `lib/products.ts` KHÔNG tồn tại (xác nhận `ls` 30/07) | 2.2.69 (thứ tự Sprint 3 ②→③ đã chốt) | `docs/SPEC-TONG-COWORK-2026-07-29.md` §5.4 |
| 2.2.66 | `loadDemoFlow()` đổi từ thay thế toàn bộ canvas → merge theo điểm thả (cộng offset toạ độ) | N | ⬜ `store.ts:656 loadDemoFlow` hiện vẫn thay thế toàn bộ canvas, chưa có logic merge-theo-offset | 7.1.18 (phần "còn lại" ⑦, xem ghi chú thứ tự trên) | `docs/SPEC-TONG-COWORK-2026-07-29.md` §5.5 |
| 2.2.67 | 3 trạng thái thẻ trong gói combo (Cần import/Cần điền chữ/Đã đủ chỉ Start) + nút "▶ Chạy cả gói" | N | ⬜ `TaskCard` (`lib/render-studio/task-cards.ts:14`) chưa có field trạng thái 3 loại này, không có nút chạy cả gói | 2.2.66 | `docs/SPEC-TONG-COWORK-2026-07-29.md` §5.5 |
| 2.2.68 | Nâng `out.board` — nhúng `AdjustPanel`, chọn định dạng PNG/JPG/PDF/WebP + DPI + khổ giấy, bỏ giới hạn 4 ảnh | N | 🟡 node `out.board` có sẵn (`lib/nodes/registry.ts:952-953 'Export Board'`) nhưng chưa nhúng `AdjustPanel`/chưa chọn DPI-khổ/còn giới hạn 4 ảnh | 2.2.67 | `docs/SPEC-TONG-COWORK-2026-07-29.md` §5.5 |
| 2.2.69 | Quy chuẩn thoại 5 luật (Việt dẫn·Anh theo ngăn bằng `·`, `→` cho biến đổi 2 vế cùng ngôn ngữ, bỏ ngoặc giải thích, cấm tiếng lóng, tên=việc người dùng làm) áp cho 45 node + 4 tên nhóm | N | 🟡 **hạ từ ✅ xuống — 30/07, Hoà xác nhận** (checklist 6 bước KHÔNG đủ cho phần "4 tên nhóm"). ĐÃ XONG: 45/45 node title đổi theo 5 luật (commit `74cf4c5`, `lib/nodes/registry.ts`+`lib/nodes/defs/*.ts`) + `CATEGORY_META` 6 nhãn dịch Việt dẫn·Anh theo (`lib/types.ts`). **CHƯA XONG**: phần "4 tên nhóm" (Ý TƯỞNG·Ideate/DỰNG·Build/SỬA·Refine/XUẤT·Deliver, §6.1) — hoãn tới `2.2.71` vì đó là nơi tiêu thụ thật (chưa có trường `group` nào đọc tên này, đặt tên trước = mồ côi, phạm luật 2.1.9.b) | 2.2.77 (✅, chung commit); 2.2.71 (phần "4 tên nhóm" còn lại) | `docs/SPEC-TONG-COWORK-2026-07-29.md` §6.3 |
| 2.2.70 | Hệ minh hoạ nét — 45 bìa SVG inline (`stroke-width:1.5`, không gradient/bóng/icon mua sẵn), ưu tiên 24 thẻ hay dùng | N | ⬜ 0 kết quả `stroke-width` trong `lib/render-studio/` — chưa có bộ SVG bìa nét riêng cho thẻ node | 7.1.18 (phần "còn lại") | `docs/SPEC-TONG-COWORK-2026-07-29.md` §6.2 |
| 2.2.71 | 4 nhóm (Ý tưởng·Dựng·Sửa·Xuất) thêm trường `group` song song `category` cũ + bố cục cross (4 ô góc quanh 1 ô phong cách giữa) | N | ⬜ `lib/types.ts` chưa có `group?:` trên node def (xác nhận grep 0 kết quả), chưa có UI cross. ⚠️ **CẢNH BÁO tự sinh 2 hệ phân loại song song** (30/07, sau khi `2.2.69` dịch `CATEGORY_META`): app giờ đã lộ RA NGƯỜI DÙNG 6 category theo máy (Đầu vào/Sinh ảnh AI/Sửa ảnh AI/Slide trình bày/Tiện ích/Xuất — CommandPalette + NodeLibraryPanel) SONG SONG với ý định 4 nhóm theo nghề của mã này (Ý tưởng/Dựng/Sửa/Xuất — Tool Mode). Khi làm `2.2.71` PHẢI CHỐT 1 trong 2 làm phân loại CHÍNH hiện cho người dùng (đề xuất: 4 nhóm theo nghề chính, 6 category lùi thành nhãn phụ/lọc kỹ thuật ẩn) — không để cả 2 cùng lộ song song, người dùng sẽ không hiểu "nhóm" nào là thật | 7.1.18 (phần "còn lại") | `docs/SPEC-TONG-COWORK-2026-07-29.md` §6.1 |
| 2.2.72 | Lộ `three.cad2fbx` (CAD→3D, 0 credit, đã tất định) + `three.camera` (đổi góc phối cảnh) ra mặt tiền Tool Mode | N | ⬜ 2 node có thật (`lib/nodes/defs/render-v2.ts:203-237`) nhưng KHÔNG có trong `lib/render-studio/task-cards.ts` (xác nhận grep 0 kết quả) — đúng phát hiện §1.2 "đang vô hình" | 2.2.24 (pull tường, đã ✅); 7.1.18 (phần "còn lại") | `docs/SPEC-TONG-COWORK-2026-07-29.md` §1.2, §5 Sprint 3 ⑦ |
| 2.2.75 | `lib/imaging.ts composeBoard()` board 2480×1754→**4961×3508** (A3 300dpi thật) + sửa chú thích sai "A4 300dpi-ish" | N | ✅ done (checklist 6 bước đủ) — commit `573e314`, browser-verify canvas layout tỉ lệ đúng | không | `docs/SPEC-TONG-COWORK-2026-07-29.md` §1.6, §3 Sprint 1 |
| 2.2.76 | Tự chèn `ai.upscale` ×4 vào đường xuất in + hiện dpi thật + mở khoá 2 nút "In 300dpi" đang khoá | N | ⬜ 2 nút vẫn `disabled:true` (`components/studio/RenderIOMenus.tsx:152`, `components/present-editor/Toolbar.tsx:143` — `disabledReason` "ảnh render hiện ~116dpi") | 2.2.82 (cùng luật 9 ≥300dpi) | `docs/SPEC-TONG-COWORK-2026-07-29.md` §1.6, §3 Sprint 6 |
| 2.2.77 | ⭐ Bịt 2 lỗ rò dữ liệu Tool Mode (đổi thẻ mất ảnh + canvas→Tool Mode lờ graph đang có) + test luật "chuyển giao diện không xoá dữ liệu" | N | ✅ done (checklist 6 bước đủ) — commit `e82b46d`, 11/11 test (`lib/render-studio/tool-mode-graph.test.ts` 4, `graph-pattern.test.ts` 7) + browser-verify qua `__flowStore`: đổi thẻ giữ nguyên node ảnh, chỉ thay node AI | không (làm TRƯỚC mọi việc UI khác — Sprint 3 ①) | `docs/SPEC-TONG-COWORK-2026-07-29.md` §5.1 |
| 2.2.78 | Mở rộng `ParamDef`: thêm `span?: 1\|2\|4` · `group?: string` · `advanced?: boolean`, gán cho 45 node | N | ⬜ `lib/types.ts` `ParamDef` hiện chỉ có 9 `kind` (text/select/slider/image/mask/annotate/sketch/smartmask/corners), không có 3 trường này (xác nhận grep 0 kết quả) | 2.2.65 (thứ tự Sprint 3 ③→④ đã chốt) | `docs/SPEC-TONG-COWORK-2026-07-29.md` §5.2 |
| 2.2.79 | Renderer Tool Mode 3 dải màn (<8" 1 cột / 8"-laptop 2 cột / desktop 3 cột — dải màn ≠ lựa chọn giao diện, 2 trục độc lập) | N | 🟡 mới có gate nhị phân `useIsSmallScreenForCanvas()` (`lib/render-studio/tool-mode-ui.ts:114`, ngưỡng CSS 700px) khoá/mở Node Mode — chưa có renderer 3-dải/3-cột thật | 7.1.18 (phần "còn lại") | `docs/SPEC-TONG-COWORK-2026-07-29.md` §5.2 |
| 2.2.80 | Pill nổi switch "▦ Bảng việc ⇄ ⁂ Canvas" (liquid-glass, góc dưới-trái, phím `⌘\`), thay 2 điều khiển rời hiện có | N | ⬜ hiện vẫn 2 điều khiển rời: link "Mở canvas (nâng cao) →" (`ToolModeHome.tsx`) và nút "Mở canvas ▾" (`ToolModeForm.tsx:227`) — chưa gộp thành pill | 7.1.18 (phần "còn lại") | `docs/SPEC-TONG-COWORK-2026-07-29.md` §5.3 |
| 2.2.81 | 11 phím/chuột Node Mode (Space kéo màn · lăn zoom · ⇧1 vừa màn · kéo khoanh+⇧click chọn nhiều · Delete · ⌘D nhân bản · ⌘Z/⌘⇧Z · ⌘↵/⌘⇧↵ chạy node/flow · Tab/chuột phải thêm node · ⌘\\ đổi giao diện) | N | ⬜ 0 kết quả `onKeyDown`/`keydown` trong `components/render-studio/` — chưa có bộ phím tắt riêng Node Mode | 7.1.18 (phần "còn lại") | `docs/SPEC-TONG-COWORK-2026-07-29.md` §5.2 |
| 2.2.82 | Preflight chặng 2 — mở rộng cơ chế `Violation`/`severity` (§1.4) sang Render, thêm SSIM/LPIPS đo lệch bố cục so ảnh gốc | N | ⬜ `lib/standards/` dùng chung (đề xuất ở `7.1.18`) chưa tồn tại; 0 kết quả SSIM/LPIPS toàn repo | 7.1.18 | `docs/SPEC-TONG-COWORK-2026-07-29.md` §7.5 |
| 2.2.83 | Preflight — tích hợp vào nút Xuất (`IOMenu`), không panel riêng, có nút "Xuất kèm lỗi" cho trường hợp cố ý | N | ⬜ chưa có (phụ thuộc `2.2.82` chưa có cơ chế preflight nào để tích hợp) — **⚠️ nguồn `§7.5` chỉ liệt kê chung tiêu đề `2.3.63/2.2.82/2.2.83` cho CÙNG 1 đoạn mô tả, không tách rõ nội dung riêng của `2.2.83`; dòng này = suy luận hợp lý (tách phần "tích hợp UI xuất" khỏi phần "tính luật" của `2.2.82`) — CẦN Hoà xác nhận lại ranh giới đúng, không tự chốt** | 2.2.82 | `docs/SPEC-TONG-COWORK-2026-07-29.md` §7.5 |
| 2.2.84 | Vitals visual mới — 2 electron cuộn nhau + cung hở, 5 trạng thái, 3 cỡ, xoắn thiên hà, chữ bụi sáng (thay `VitalsIcon.tsx` cam-navy hiện tại) | N | ⬜ `components/studio/VitalsIcon.tsx` vẫn 67 dòng bản cũ (xác nhận `wc -l` 30/07) — mockup chạy thật đã có sẵn ở `if-vitals-visual.html`, chưa chuyển vào component thật | 7.1.18 (phần "còn lại") | `docs/SPEC-TONG-COWORK-2026-07-29.md` §8 |
| 2.2.85 | Bỏ font mono ở nhãn node (icon+chữ, giữ `tabular-nums` cho số/toạ độ/mã), quét đồng bộ 9 file | N | ✅ done (checklist 6 bước đủ) — commit `74cf4c5`, xác nhận `grep` 30/07 0 kết quả `ui-monospace`/`fontFamily` mono còn lại trong `InteriorNode.tsx` | 2.2.69 — gộp CHUNG 1 COMMIT với `2.2.69` (Luật Đồng Bộ #6 — đổi tên node xong mà chưa bỏ mono thì dấu tiếng Việt vỡ ngay giữa dòng, xem `docs/TICKET-FONT-MONO-NODE-2026-07-29.md` §2②) | `docs/TICKET-FONT-MONO-NODE-2026-07-29.md` |
| 2.2.86 | "Chạy flow" rời khỏi headbar → pill nổi đáy-giữa canvas (liquid-glass, dùng lại pattern `CadToolbar.tsx`), nhãn theo vùng chọn (không chọn/1 node/N node), hiện giá `~N credit` trước khi chạy, **vỏ nút = tín hiệu trạng thái** (tô đặc=có việc / ghost=đã cập nhật / spinner=đang chạy), cấm bấm-mà-im-lặng, node 0-credit tất định tự chạy khi input đổi (debounce 300ms) | N | ⬜ chưa có — cấp mã 30/07 (`docs/TICKET-CHAY-FLOW-KHONG-GHIM-BAR-2026-07-30.md`). Lỗi UX thật đã xác nhận trong code: `lib/execution.ts:92-94` cache `inputHash` không đổi thì `return true` NGAY, im lặng — nút không phân biệt được "không có gì để chạy"/"chạy ra y hệt"/"hỏng". Hạ tầng dùng lại (đã có sẵn, không viết engine mới): `runNode(nodeId)` (`execution.ts:185`), `def.creditCost` (`execution.ts:102`), `inputHash` (`execution.ts:92-94`) | 7.3.31 (✅ — làm cùng file `AppChrome.tsx`, xoá nút khỏi bar là 1 phần "cụm phải bớt phần tử có/không theo chặng" mà 7.3.31 cần); KHÔNG đổi `--accent` (token chính thức 27/07, có ghi chép WCAG 4.89:1); KHÔNG thêm Render Queue mới (đã có Tasks+AiStatusDot) | `docs/TICKET-CHAY-FLOW-KHONG-GHIM-BAR-2026-07-30.md` |

### 2.3 Present

> PS-0..PS-11 dùng nguyên trạng thái đã audit ở `IF1-COMPLETION-AUDIT.md` §2.

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 2.3.1 | Mô hình 4 bước NẠP→MÁY DÀN→BẠN SỬA→XUẤT (vòng lặp tổng) | ? | 🟡 các mảnh rời rạc có, luồng 4-bước liền mạch cấp toàn-deck chưa | không | `SPEC-PRESENT-FLOW.md` |
| 2.3.1.a | Luật 1 — một lúc một việc (panel wizard thu lại sau khi xong) | ? | 🟡 đúng phạm vi 1 panel (`LayoutShelf`), chưa toàn app | 2.3.1 | " |
| 2.3.1.b | Luật 2 — đề xuất NHIỀU không đề xuất MỘT (3 phương án + học) | ? | 🟡 đúng ở cấp 1 slide (Perceptron), chưa cấp toàn deck | 2.3.1 | " |
| 2.3.1.c | ⭐ Luật 3 — sửa tay không mất đề xuất (pin/khoá giữ khi "Đề xuất lại") | ? | ⬜ không tìm thấy hàm "Đề xuất lại"/regenerate nào | 2.3.1 | " |
| 2.3.1.d | Luật 4 — nói rõ máy vừa làm gì (1 dòng giải thích) | ? | 🟡 chỉ ở bước phân tích ảnh reference, chưa toàn luồng | 2.3.1 | " |
| 2.3.1.e | Luật ràng buộc — AI chỉ CHỌN trong template đã duyệt (constrained, không tự sáng tác) | ? | ✅ `suggest.ts` deterministic đúng | không | " |
| 2.3.2 | Cây dàn bài 3 cấp (CHƯƠNG→TRANG) panel trái | ? | ⬜ chỉ có sắp xếp slide phẳng 1 cấp (SlideSorter), không có khái niệm "chương" | không | `SPEC-PRESENT-FLOW.md` |
| 2.3.3 | Dàn bài mẫu theo loại hồ sơ (Concept proposal/Design development/Material board) | ? | ⬜ 0 định nghĩa loại hồ sơ trong code | 2.3.2 | `SPEC-PRESENT-FLOW.md` |
| 2.3.4 | Luồng Present mới 6 bước (①chọn loại hồ sơ→⑥xuất) | ? | 🟡 ②⑥ có, ③ có bản nhẹ (parse text), ①④⑤ thiếu — khớp tự đánh giá của spec | 2.3.2, 2.3.3, 2.3.1.c | `SPEC-PRESENT-FLOW.md` |
| 2.3.5 | PS-0 Audit & verify điểm mờ (gate) | Gate | ✅ done | không | `IF-PRESENT-SPRINT-PLAN.md`, `IF1-COMPLETION-AUDIT.md` §2 |
| 2.3.6 | PS-1 Brand Kit bền vững + áp lại theme cả deck | 🔴 Cao | ✅ done | 2.3.5 | " |
| 2.3.7 | PS-2 Lưu template tự tạo + thư viện team | 🟠 Cao-vừa | ✅ done | 2.3.6 | " |
| 2.3.8 | PS-3 Round-trip photo-editor ↔ slide + tài sản liên kết | 🟡 Vừa | ✅ done | 2.3.5, 2.3.6 | " |
| 2.3.9 | PS-4 Đa khổ board A3/A4 ngoài 16:9 (chỉ khổ MÀN HÌNH, không hứa in 300dpi) | 🟡 Vừa | ✅ done (5 preset thống nhất qua `stage-presets.ts`) | 2.3.5 | " |
| 2.3.10 | PS-5 Share deck + version có tên | 🟠 Cao-vừa | ⬜ not-started (chỉ có route share cho Render/graphJson) | hạ tầng share/auth | " |
| 2.3.11 | PS-6 Comment/ghi chú khách trên slide (pin toạ độ % + thread) | 🟠 Cao-vừa | ⬜ not-started (`CommentLayer.tsx` là công cụ dev nội bộ, không phải feature khách) | 2.3.10 | " |
| 2.3.12 | PS-7 Photo-editor phím tắt kiểu Photoshop | 🟡 Vừa | ✅ done | PS-3 (chặn cứng) | " |
| 2.3.13 | PS-8 AI khởi thảo outline deck | 🟠 Cao-vừa | 🟡 partial (chỉ sinh 1 field/lần, không phải outline cả deck) | 2.3.6 | " |
| 2.3.14 | PS-9 Bảng deck (quản lý nhiều deck, đổi khoá theo deckId) | 🟠 Cao-vừa | ⬜ not-started (Dashboard chưa có mục "Deck Present") | không | " |
| 2.3.15 | PS-10 Thư viện tài sản (gộp Gallery/Reference) | 🟡 Vừa-thấp | ⬜ not-started (4 hệ tách biệt, trùng NT1 khối 3) | 3. Library NT1 | " |
| 2.3.16 | PS-11 Mẫu hồ sơ hành chánh 1 trang A4 | 🟡 Vừa | ⬜ not-started (thiếu `ElementKind='table'`) | 2.3.9 (khổ A4) | " |
| 2.3.17 | Video — TTS đọc note thuyết trình | N | ⬜ | không | `SPEC-PRESENT-FLOW.md` §3 |
| 2.3.18 | Video — Deck→video thuyết trình (dựng phim thuần, 0 credit, giá trị cao nhất) | N | ⬜ | 2.3.9 | " |
| 2.3.19 | Video — Ken Burns/parallax 2.5D từ ảnh render | N/P | ⬜ | 2.3.18 | " |
| 2.3.20 | Video — Image-to-video b-roll nhỏ (rèm bay, nắng chuyển, hạn chế dùng) | P | ⬜ | 2.3.18 | " |
| 2.3.21 | Video — Text-to-video sinh cả không gian | — | ⛔ chủ đích LOẠI (méo hình học) | không | " |
| 2.3.22 | Video — Fly-through phối cảnh AI | — | ⛔ chủ đích LOẠI (dùng D5 thay) | không | " |
| 2.3.23 | Animated Layout ⭐ loại 1 — vẽ dần theo lớp (ưu tiên #1, rẻ nhất) | ? | ⬜ | 2.1 CAD layer hệ (nền có sẵn) | `SPEC-PRESENT-FLOW.md` §4 |
| 2.3.24 | Animated Layout loại 2 — zoom vào từng khu vực | ? | ⬜ | 2.3.23 | " |
| 2.3.25 | Animated Layout loại 3 — luồng giao thông (moat, cần semantic) | ? | ⬜ | 2.1.9 CAD semantic (T3/T4 CHƯA LÀM) | " |
| 2.3.26 | Animated Layout loại 4 — chuyển phương án A↔B (morph) | ? | ⬜ | 2.3.23 | " |
| 2.3.27 | Animated Layout loại 5 — ngày↔đêm (đổi màu+reflectance theo giờ) | ? | ⬜ | 2.2.30.b (L6 reflectance) | " |
| 2.3.28 | Ba đường ra 1 nguồn (GIF/MP4 social · slide động khi trình chiếu · clip video hậu kỳ) | ? | ⬜ | 2.3.23-27 | " |
> **2.3.29-2.3.43 — SỬA 28/07 sau khi khám `docs/AUDIT-EDITOR-TOOLKIT.md` (VIỆC 1)**: trạng thái
> dưới đây đã chính xác hoá theo `file:dòng` thật, thay cho ước lượng thô của lượt agent trước.

| 2.3.29 | Editor toolkit Deck — text tracking/leading/tràn viền (outline) | N | ✅ đủ dùng — hệ `TextFx` trưởng thành nhất trong toolkit (`lib/present-editor/text-fx.ts`, đồng bộ 3 nơi vẽ chữ) | 2.1.10.c | `SPEC-EDITOR-TOOLKIT.md`, `docs/AUDIT-EDITOR-TOOLKIT.md` |
| 2.3.30 | Editor toolkit Deck — bo góc ảnh + crop trong khung | N | ✅ đủ dùng (`ImageElement.radius`+`crop`, UI kéo-thả thật ở `ImageEditor.tsx`) — nhưng **mask ảnh theo hình tuỳ ý KHÔNG có** (chỉ chữ nhật+bo góc, không mask hình tự do) | 2.1.10.c | `SPEC-EDITOR-TOOLKIT.md`, `docs/AUDIT-EDITOR-TOOLKIT.md` |
| 2.3.31 | Editor toolkit Deck — gradient+overlay+opacity | N | 🟡 hỗn hợp: opacity ✅ đủ dùng (mọi loại) · gradient CHỈ đủ cho chữ (màu thật qua `TextGradient`), shape chỉ có mặt nạ độ-mờ (không phải màu), ảnh KHÔNG có gradient nào · overlay (lớp phủ riêng) hoàn toàn CHƯA có | 2.3.30 | `SPEC-EDITOR-TOOLKIT.md`, `docs/AUDIT-EDITOR-TOOLKIT.md` |
| 2.3.32 | Editor toolkit Deck — align/distribute/khoá tỉ lệ | N | 🟡 align+distribute ✅ đủ dùng (`lib/present-editor/align.ts`, có test riêng) · khoá tỉ lệ khi resize ⬜ hoàn toàn không có | 2.1.10.c | `SPEC-EDITOR-TOOLKIT.md`, `docs/AUDIT-EDITOR-TOOLKIT.md` |
| 2.3.33 | Editor toolkit Deck — layer thứ tự/nhóm/khoá/ẩn | N | 🟡 3/4 đủ dùng (thứ tự kéo-thả·khoá·ẩn, `LayerPanel.tsx`) · nhóm (group nhiều phần tử) ⬜ hoàn toàn chưa có, không có `groupId` trong model | 2.1.10.c | `SPEC-EDITOR-TOOLKIT.md`, `docs/AUDIT-EDITOR-TOOLKIT.md` |
| 2.3.34 | Editor toolkit Deck — đường kẻ/mũi tên/khung | N | 🟡 (ngoài phạm vi audit 19 món chi tiết — giữ ước lượng cũ) | 2.1.10.c | `SPEC-EDITOR-TOOLKIT.md` |
| 2.3.35 | Editor toolkit Deck — nhân bản có căn (smart duplicate) | N | 🟡 CÓ nhưng thô — `duplicateElement()` chỉ dời chéo cố định 2%/2%, KHÔNG phải smart-align-duplicate thật (nâng từ ⬜→🟡 sau khám) | 2.1.10.c | `SPEC-EDITOR-TOOLKIT.md`, `docs/AUDIT-EDITOR-TOOLKIT.md` |
| 2.3.36 | Editor toolkit Deck — pattern theo kích thước thật, xuất tile PNG/SVG (moat) | P/L | ⬜ xác nhận lại — 0 bằng chứng (`tiling`/`realWorldScale`/`mmPerTile` = 0 kết quả grep) | 2.3.30 | `SPEC-EDITOR-TOOLKIT.md`, `docs/AUDIT-EDITOR-TOOLKIT.md` |
| 2.3.37 | Editor toolkit Deck — blend mode | N | 🟡 CHỈ có cho TEXT (`TextFx.blend`, `mixBlendMode` ở `Element.tsx`) — ảnh/shape KHÔNG có (sửa từ "✅ khác spec" → chính xác hơn sau khám) | 2.3.31 | `SPEC-EDITOR-TOOLKIT.md`, `docs/AUDIT-EDITOR-TOOLKIT.md` |
| 2.3.38 | Editor toolkit Deck — đổ bóng | N | 🟡 CHỈ có cho text (`TextShadowLayer[]`, nhiều lớp, chất lượng tốt) — ảnh/shape KHÔNG có field shadow nào | 2.3.37 | `SPEC-EDITOR-TOOLKIT.md`, `docs/AUDIT-EDITOR-TOOLKIT.md` |
| 2.3.38.a | Editor toolkit Deck — làm mờ (blur filter trên nội dung) | N | ⬜ hoàn toàn chưa có — chỉ có `blur` là bán-kính-của-bóng-đổ (không phải filter độc lập) và 1 `backdropFilter` chrome của modal (không phải công cụ cho user) | 2.3.38 | `docs/AUDIT-EDITOR-TOOLKIT.md` |
| 2.3.39 | Editor toolkit Deck — dải palette tự sinh từ ảnh | N | ⬜ | không | `SPEC-EDITOR-TOOLKIT.md` |
| 2.3.40 | Editor toolkit Deck — bảng số liệu đơn giản | N | ⬜ (trùng PS-11 thiếu ElementKind='table', xác nhận lại) | 2.3.16 | `SPEC-EDITOR-TOOLKIT.md`, `docs/AUDIT-EDITOR-TOOLKIT.md` |
| 2.3.41 | Editor toolkit Zoning — khối màu bán trong suốt (diagram công năng) | N | ⬜ | không | `SPEC-EDITOR-TOOLKIT.md` |
| 2.3.42 | Editor toolkit Photo — crop/xoay/lật/thẳng chân trời | N | 🟡 hỗn hợp: crop ✅ đủ dùng (Present `ImageEditor.tsx`) · xoay = **field chết** (`Frame.rotation` tồn tại, ĐƯỢC render, nhưng KHÔNG có UI/gesture nào từng set khác 0) · lật (flip/mirror) ⬜ **KHÔNG CÓ ở cả Present LẪN Photo-editor** — bất ngờ cho tool marketing "gần Photoshop" | 2.3.30 | `SPEC-EDITOR-TOOLKIT.md`, `docs/AUDIT-EDITOR-TOOLKIT.md` |
| 2.3.43 | Editor toolkit Photo — sáng/tương phản/nhiệt độ/bão hoà | N | **SỬA LỚN sau khám**: Present 🟡 thô sơ (4 field CSS filter đơn giản) · **Photo-editor ✅ đủ dùng** (`AdjustPanel.tsx` — exposure/brightness/contrast/saturation/temp/tint/levels/gamma/hue/**curve editor**, non-destructive, có preset) — trước ghi ⬜ chung cho cả 2 là SAI, Photo-editor thật ra mạnh | không | `SPEC-EDITOR-TOOLKIT.md`, `docs/AUDIT-EDITOR-TOOLKIT.md` |
| 2.3.44 | Editor toolkit Photo — xoá nền+inpaint | N | 🟡 (có ở Render, chưa nối Photo-editor) | 2.2 Render | `SPEC-EDITOR-TOOLKIT.md` |
> **[v2] 2.3.45-2.3.52 — DỜI HẲN (Q5, 28/07)**: Present bậc N mới ~44% (Bảng tổng 1) — làm nhánh L
> (video/film) khi N chặng đó chưa xong là VI PHẠM luật 1 (`IF-ARCHITECTURE-BLUEPRINT-v1.md` §8:
> "Không xây L khi N chặng đó chưa ✅"). Giữ mã để không mất dấu, nhưng đóng băng — KHÔNG code cho
> tới khi Present N đạt ngưỡng đủ (chưa định số cụ thể, cần quyết riêng khi tới lúc).

| 2.3.45 [v2] | Editor toolkit Video — mức 2 CapCut-like (timeline 3-4 track) | L | ⬜ DỜI HẲN — chờ Present N xong (`remotion` không có trong package.json) | 2.1.10.c | `SPEC-EDITOR-TOOLKIT.md` |
| 2.3.46 [v2] | Editor toolkit Video — kiến trúc Timeline-là-JSON + Remotion render | L | ⬜ DỜI HẲN | 2.3.45 | `SPEC-EDITOR-TOOLKIT.md` |
| 2.3.47 [v2] | Editor toolkit Video — render GPU máy user (Electron, 0 credit, riêng tư) | L | ⬜ DỜI HẲN | 2.3.45, 1.2.10 Electron | `SPEC-EDITOR-TOOLKIT.md` |
| 2.3.48 [v2] | Editor toolkit Film — kịch bản (brief+gu→LLM narrative) | L | ⬜ DỜI HẲN | không | `SPEC-EDITOR-TOOLKIT.md` |
| 2.3.49 [v2] | Editor toolkit Film — storyboard từ dự án thật (moat) | L | ⬜ DỜI HẲN | 2.3.48 | `SPEC-EDITOR-TOOLKIT.md` |
| 2.3.50 [v2] | Editor toolkit Film — camera path vẽ trên CAD → xuất D5/Unreal (moat) | L | ⬜ DỜI HẲN | 2.3.49, 2.2.17 (đổi góc phối cảnh) | `SPEC-EDITOR-TOOLKIT.md` |
| 2.3.51 [v2] | Editor toolkit Film — animatic nháp (ảnh+Ken Burns+nhạc+lời) | L | ⬜ DỜI HẲN | 2.3.50 | `SPEC-EDITOR-TOOLKIT.md` |
| 2.3.52 [v2] | Editor toolkit Film — xuất D5/Unreal kèm camera path+kịch bản+vật liệu | L | ⬜ DỜI HẲN | 2.3.50 | `SPEC-EDITOR-TOOLKIT.md` |
| 2.3.53 | LOẠI có chủ đích — AI chọn template theo nội dung (giữ deterministic) | — | ⛔ đúng chủ đích | không | `IF-PRESENT-SPRINT-PLAN.md` |
| 2.3.54 | LOẠI có chủ đích — Auto-deck 1-click không người duyệt | — | ⛔ đúng chủ đích | không | `IF-PRESENT-SPRINT-PLAN.md` |
| 2.3.55 | LOẠI có chủ đích — Generative-fill/inpaint trong Present (thuộc Render) | — | ⛔ đúng chủ đích (redirect sang 2.2 Render) | 2.2 Render | `IF-PRESENT-SPRINT-PLAN.md` |
| 2.3.56 | LOẠI có chủ đích — Design system hình thức đầy đủ (Storybook/governance) | — | 🟡 phần token nhẹ đã có (`DECK_STANDARDS`), phần đầy đủ chốt LOẠI | 2.3.7 | `IF-PRESENT-SPRINT-PLAN.md` |
| 2.3.57 | HOÃN — Element bảng trong Present (redirect `du-toan-noi-that`) | — | ⬜ (trùng PS-11) | 2.3.16 | `IF-PRESENT-SPRINT-PLAN.md` |

#### 2.3.58-2.3.63 — SPEC TỔNG Cowork 29/07 (Sprint 2/6, dán 30/07)

> Nguồn + luật kiểm trùng/thứ tự chốt: xem ghi chú đầu mục "2.2.60-2.2.85" ở khối 2.2 Render trên.

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 2.3.58 | Gộp Photo-editor vào Present — bỏ round-trip tab mới+localStorage, nhúng `AdjustPanel`/`LayersPanel` làm panel phụ cùng app-shell | N | ⬜ hiện vẫn route riêng: `app/projects/[id]/photo/page.tsx` (`PhotoEditorScreen`) mở qua `window.open(...,'_blank')` từ nút "Chỉnh ảnh nâng cao" trong Present; `app/photo-editor/page.tsx` giữ làm redirect route cũ | không | `docs/SPEC-TONG-COWORK-2026-07-29.md` §3 Sprint 2 |
| 2.3.59 | Tách `GenerateFlow` khỏi tab "Mẫu" thành lối vào riêng cấp toolbar | N | ⬜ `<GenerateFlow>` hiện nhúng thẳng trong `components/present-editor/LayoutShelf.tsx:314`, không phải lối vào riêng | không | `docs/SPEC-TONG-COWORK-2026-07-29.md` §3 Sprint 2 |
| 2.3.60 | Catalogue→template→batch export | P (suy luận riêng — spec không tự gán bậc cho mã này) | ⬜ SPEC CHƯA VIẾT (đúng kế hoạch — Sprint 2 chỉ yêu cầu viết SPEC, CODE dời sang Sprint 7); 0 kết quả `catalogue`/`batchExport` toàn repo | không | `docs/SPEC-TONG-COWORK-2026-07-29.md` §3 Sprint 2+7 |
| 2.3.61 | Màn chọn đầu chặng 3 — component dùng chung `StageEntryScreen` (6 ô: 16:9·A4 ngang/dọc·A3 ngang/dọc·Kho mẫu), tự nhận khổ khi vào từ ▶ Chạy flow | N | ⬜ `StageEntryScreen` không tồn tại; khổ hiện chọn qua nút trên toolbar (`Toolbar.tsx:198` khu vực khổ trình bày), không phải màn chọn đầu chặng | 3.31 (Kho mẫu, đã dán — xem khối 3 Library) | `docs/SPEC-TONG-COWORK-2026-07-29.md` §5.6 |
| 2.3.62 | Tách sân khấu làm-việc / sân khấu xuất ở Present | N | ⬜ chưa xác minh cơ chế tách 2 sân khấu trong code hiện có — cần đọc thêm `docs/AUDIT-PRESENT-UX-2026-07-29.md` (chưa nhận vào repo, xem STATUS.md "Chờ USER quyết") | 2.3.61 | `docs/SPEC-TONG-COWORK-2026-07-29.md` §3 Sprint 6 |
| 2.3.63 | Preflight chặng 3 — mở rộng cơ chế `Violation`/`severity` (§1.4) sang Present (dpi/placeholder chưa điền/chữ tràn khung/ảnh méo tỉ lệ/font chưa nhúng) | N | ⬜ cùng hiện trạng `2.2.82` — `lib/standards/` dùng chung chưa tồn tại | 7.1.18, 2.2.82 (dùng chung 1 engine chấm chuẩn) | `docs/SPEC-TONG-COWORK-2026-07-29.md` §7.5 |

---

## 3. LIBRARY

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 3.1 | Trang duyệt riêng `/library` (mặt tiền độc lập) | ? | ⬜ chỉ có `/library/ingest`, không có `/library` browse | không | `SPEC-IF-LIBRARY.md` |
| 3.2 | Nối đường vào UI cho `/library/ingest` | ? | ⬜ route tồn tại, không có link nào trỏ vào | không | `SPEC-IF-LIBRARY.md` |
| 3.3 | Một panel dùng chung cho cả 3 chặng (NT1) | ? | ⬜ thực tế **4 hệ tách biệt** (LibraryPanel/LibraryBrowser/LibraryPickerModal/block-library-demo) | 3.7 NT1 | `SPEC-IF-LIBRARY.md`, `PLAN-LIBRARY-GATEWAY.md` NT1 |
| 3.4 | Xương sống chung `LibraryAsset` (id/projectId/type/nguồn+giấy phép/thẻ/guProfileRef/trendStatus/reviewBy/thống kê dùng) | ? | 🟡 thiếu `type`, `guProfileRef`, `trendStatus`, `reviewBy`, thống kê lượt dùng | không | `SPEC-IF-LIBRARY.md` |
| 3.5 | Nhóm Ảnh (phòng/phong cách/palette/ánh sáng/10 trục gu) | N/P/L | 🟡 `img_` id + palette có, "10 trục gu theo ảnh" không có field | 3.4 | `SPEC-IF-LIBRARY.md` |
| 3.6 | Nhóm Block CAD/Detail (hạng mục/kích thước/layer/tỉ lệ/đơn vị) | ? | 🟡 `block-library.ts` có cấu trúc đúng nhưng chỉ chạy ở trang demo riêng, chưa nối CAD chính | 3.4 | `SPEC-IF-LIBRARY.md` |
| 3.7 | Nhóm Vật liệu (mã/hãng/bề mặt/màu/giá/NCC/ảnh thật) | N/P | 🟡 `photoUrl?` hook có, chờ ATLAS thật | 2.2.29 Material Pipeline | `SPEC-IF-LIBRARY.md` |
| 3.8 | Nhóm Excel (dự toán/khái toán/danh mục) | ? | ⬜ | 3.6 (pha 3) | `SPEC-IF-LIBRARY.md` |
| 3.9 | Nhóm Doc/biểu mẫu | ? | ⬜ | 3.8 | `SPEC-IF-LIBRARY.md` |
| 3.10 | Nhóm Template thuyết trình | N | ✅ | không | `SPEC-IF-LIBRARY.md` |
| 3.11 | Nhóm SVG/icon | ? | ⬜ | không | `SPEC-IF-LIBRARY.md` |
| 3.12 | Nhóm Font (họ chữ/VI/giấy phép thương mại/weight) | ? | 🟡 hardcode 1 font mặc định, chưa phải nhóm asset quản lý qua Library | không | `SPEC-IF-LIBRARY.md` |
| 3.13 | Tìm kiếm một ô, máy tự đoán ý (ưu tiên loại theo câu hỏi) | P | 🟡 fuzzy VI-EN+màu có, suy luận loại theo câu hỏi chưa | 3.16 (embedding) | `SPEC-IF-LIBRARY.md` |
| 3.14 | Bộ lọc mặt (faceted search) + xếp hạng theo ngữ cảnh/gu dự án | P | ⬜ | 3.13 | `SPEC-IF-LIBRARY.md` |
| 3.15 | Kinh tế credit — AI vision đọc 1 lần → lưu thẻ+vector → tìm sau 0 credit | P | ⬜ | 3.17 | `SPEC-IF-LIBRARY.md` |
| 3.16 | Tầng 1 tự phân loại — suy từ ngữ cảnh/đuôi file/EXIF, 0 credit | N | 🟡 `lib/gateway/detect.ts` (NT2, 28/07) giải quyết 1 phần "đuôi file", EXIF/ArchiNote chưa | 4.7 Gateway | `SPEC-IF-LIBRARY.md` |
| 3.17 | Tầng 2 — AI vision đọc 1 lần → thẻ+vector embedding | P | ⬜ | 3.16 | `SPEC-IF-LIBRARY.md` |
| 3.18 | Luật bắt buộc — thẻ AI phải hiện khác thẻ người (nhạt màu/✨) | N | ⬜ | 3.17 | `SPEC-IF-LIBRARY.md` |
| 3.19 | Tầng 3 — học từ hành vi dùng thật (đẩy lên/chìm/gợi ý bộ đôi) | L | ⬜ chưa có trường thống kê lượt dùng | 3.17 | `SPEC-IF-LIBRARY.md` |
| 3.20 | Nguồn & giấy phép bắt buộc lưu | N | 🟡 chỉ áp cho stock-photo Present, chưa có field chung trong `LibraryAsset` | không | `SPEC-IF-LIBRARY.md` |
| 3.21 | Nguồn ảnh hợp pháp — Unsplash/Openverse (thiếu Pexels dù spec liệt kê) | N | 🟡 | 3.20 | `SPEC-IF-LIBRARY.md` |
| 3.22 | Bậc N — upload/thẻ tay/tìm theo thẻ/bộ sưu tập/chèn thẳng/preview hover | N | 🟡 thiếu "bộ sưu tập" (collection) riêng | không | `SPEC-IF-LIBRARY.md` |
| 3.23 | Bậc P — tự gắn thẻ AI vision + tìm bằng câu chữ (semantic search) | P | ⬜ | 3.17 | `SPEC-IF-LIBRARY.md` |
| 3.24 | Bậc L — chấm 10 trục gu/ảnh, tự đẩy ảnh hợp gu, học dùng thật, tem xu hướng | L | ⬜ | 3.19 | `SPEC-IF-LIBRARY.md` |
| 3.25 | Lộ trình Pha 1-4 (Ảnh+Vật liệu+Template → Block CAD → Excel+Doc → SVG+Font) | N→L | 🟡 Pha 1 phần lớn có, Pha 2-4 chưa mở khoá thật | 3.5-3.12 | `SPEC-IF-LIBRARY.md` |
| 3.26 | Local-first — file `uploads/` trên đĩa, DB chỉ giữ path | N | ✅ | không | `SPEC-IF-LIBRARY.md` |
| 3.27 | Local-first — sync metadata trước, file nặng tải lazy sau (Pha 2) | ? | ⬜ chưa có sync đa thiết bị (`lastEditedDevice` luôn null) | 3.26 | `SPEC-IF-LIBRARY.md` |
| 3.28 | Cây thư mục thật theo dự án trên đĩa | N | ⬜ | không | `SPEC-FILE-MANAGER.md` (trùng 4.1, không đếm 2 lần — xem khối 4) |
| 3.29 | Nguồn ArchiNote qua Lark — bánh đà tri thức 2 trợ lý | L | N/A ngoài repo IF | không | `SPEC-KNOWLEDGE-BASE.md` (liên quan Library qua Reference) |

### 3.30 NT1 — Gộp thư viện thành 1 (`PLAN-LIBRARY-GATEWAY.md`, dời sau)

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 3.30.a | Gộp 3(→4) UI thành 1 panel dùng chung, bỏ popover `[+]` | ? | ⬜ dời sau — popover `[+]` "Nạp vào thư viện" vẫn còn nguyên | 4.7 NT2 (route cần panel mới) | `PLAN-LIBRARY-GATEWAY.md` NT1 |
| 3.30.b | Gộp `/library/ingest` thành 1 CHẾ ĐỘ trong panel (thay route riêng) | ? | ⬜ | 3.30.a | `PLAN-LIBRARY-GATEWAY.md` NT1 |
| 3.30.c | Gộp block/furniture CAD vào cùng 1 model `LibraryAsset` (Q4: 1 model chung + trường `type`) | L | ⬜ schema hiện KHÔNG có trường `type`, block CAD vẫn ở file JSON tĩnh riêng | 3.30.a | `PLAN-LIBRARY-GATEWAY.md` NT1 |

> *Lưu ý đánh số khối 3 (29/07, `docs/CHOT-SO-MA-2026-07-29.md` §A): `3.1`–`3.29` là mã phẳng;
> `3.30` là **mục** (NT1) có con `.a/.b/.c`; `3.31` trở đi tiếp tục đánh phẳng.*

| 3.31 | Ô thứ 6 "Kho mẫu" ở màn chọn đầu chặng 3 + lọc Library theo nhóm Template (đề xuất 29/07, mã cũ đề xuất sai `3.30`) | N | ⬜ chưa code — `StagePresetPanel.tsx` có 5 khổ nhưng không có ô "Kho mẫu" | 2.3.61 (màn chọn đầu chặng 3, khối Present) | `docs/SPEC-TONG-COWORK-2026-07-29.md` §5.6 |
| 3.32 | Nội dung kho mẫu đợt 1 — 4 nhóm × 6 mẫu (Hồ sơ thiết kế · Văn phòng/Giấy tờ · Tem nhãn/Bảng mẫu · Trình bày) | N | ⬜ chưa có mẫu nào; nhóm "Tem nhãn·Bảng mẫu" là sáng kiến riêng ngành nội thất, không app trình bày nào có | 3.31 | `docs/SPEC-TONG-COWORK-2026-07-29.md` §5.6 |

---

## 4. FILE MANAGER / GATEWAY

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 4.1 | Cây thư mục thật theo dự án trên đĩa (`~/InteriorFlow/Projects/...`) | N | ⬜ (= NT5-FOLDERTREE-REAL, không đếm trùng 3.28) | không | `SPEC-FILE-MANAGER.md`, `PLAN-LIBRARY-GATEWAY.md` NT5 |
| 4.2 | Đặt tên file đọc được (`Nord-phongkhach-v3.jpg`), id chỉ trong metadata | N | 🟡 `img_` id có, nhưng file trên đĩa vẫn tên ngẫu nhiên (mục tiêu "mở Finder vẫn hiểu" chưa đạt) | 4.1 | `SPEC-FILE-MANAGER.md` |
| 4.3 | Watch folder — thả file vào `01-input/` → tự nhận & phân loại | N/P | ⬜ | 4.1, 3.16 | `SPEC-FILE-MANAGER.md` |
| 4.4 | Vòng đời file (nháp→chính thức→lưu trữ, tự dọn file tạm sau N ngày) | ? | ⬜ | 4.1 | `SPEC-FILE-MANAGER.md` |
| 4.5 | Bảng dung lượng (dự án nào nặng, cái gì xoá được) | ? | ⬜ | 4.1 | `SPEC-FILE-MANAGER.md` |
| 4.6 | Sao lưu + đóng gói `.ifpack` — tự backup định kỳ | N | ✅ done (checklist 6 bước đủ, 30/07) — `lib/cad/auto-backup.ts` mới: `setInterval` 10 phút + trigger mỗi lần autosave IDB ghi xong (`onSaved`, app không có nút "Lưu tay" riêng), ghi ra thư mục thứ 2 do người dùng chọn 1 lần (File System Access API, `chooseBackupFolder()` — nút "Bật backup tự động" trong menu Xuất CAD), giữ đúng 5 bản gần nhất (`namesToPrune()`, 6/6 test `auto-backup.test.ts`). Browser-verify thật (OPFS thay dialog OS không tự động hoá được): ghi file `.ifpack` thật (ZIP hợp lệ xác nhận qua magic byte `PK`), sửa bản vẽ → prune tự động giữ đúng 5/5, xoá đúng 2 file cũ nhất khi dư | không | `SPEC-FILE-MANAGER.md` |
| 4.7 | Nhấp đúp file `.idf` từ Finder mở app | N | ⬜ | 4.1 | `SPEC-FILE-MANAGER.md` |
| 4.8 | Ba tầng + phân quyền đĩa (`Projects/` đọc-ghi · `Knowledge/` khoá đọc · `_System/` khoá) | N | ⬜ | 4.1 | `SPEC-FILE-MANAGER.md` |
| 4.9 | Khoá `Knowledge/` chỉ đọc (bảo vệ quy chuẩn cho Vitals) | N | ⬜ | 4.8 | `SPEC-FILE-MANAGER.md` |
| 4.10 | Đường một chiều — `01-input/`→gắn thẻ→"CHỜ DUYỆT"→người duyệt→lên kệ | N | ⬜ (trừ ngoại lệ nội dung IF tự sinh, cũng ⬜ vì chưa có cờ phân biệt nguồn) | 4.3 | `SPEC-FILE-MANAGER.md` |
| 4.11 | Phân biệt kiến trúc Library (cửa hàng) vs File Manager (chợ đầu mối) | — (nguyên tắc) | 🟡 hiện gộp lẫn (Library dùng Prisma+/uploads phẳng, chưa có cấu trúc đĩa riêng để phân biệt) | 4.1 | `SPEC-FILE-MANAGER.md` |
| 4.12 | Lộ trình Pha 1 — cây thư mục+quy ước tên+`.idf` mở từ Finder | N | ⬜ (tổng hợp 4.1+4.2+4.7, cả 3 chưa xong) | 4.1, 4.2, 4.7 | `SPEC-FILE-MANAGER.md` |
| 4.13 | Lộ trình Pha 2 — backup tự động + `.ifpack` (làm sớm) | N | ✅ xong cùng `4.6` (30/07) — xem bằng chứng ở dòng đó, không lặp lại | 4.6 (✅) | `SPEC-FILE-MANAGER.md` |
| 4.14 | Lộ trình Pha 3 — watch folder → tự phân loại vào Library | N/P | ⬜ | 4.12, 3.3 (NT1) | `SPEC-FILE-MANAGER.md` |
| 4.15 | Lộ trình Pha 4 — vòng đời file · bảng dung lượng | ? | ⬜ | 4.14 | `SPEC-FILE-MANAGER.md` |
| 4.16 | Nhận diện định dạng từ đuôi+magic byte (NT2, 28/07) | N | ✅ commit `bfd5fe9` | không | `PLAN-LIBRARY-GATEWAY.md` NT2 |
| 4.17 | Bảng ánh xạ định dạng→đích (NT2, 28/07) | N | ✅ commit `bfd5fe9` | 4.16 | `PLAN-LIBRARY-GATEWAY.md` NT2 |
| 4.18 | Nối Gateway vào `IOMenu.tsx` (thay danh sách cứng bằng 1 nút "Mở tệp") | N | ⬜ **chưa nối UI**, đợi NT1 xong (đúng scope đã chốt) | 3.30.a (NT1) | `PLAN-LIBRARY-GATEWAY.md` NT2 |
| 4.19 | Render — chuột phải trên canvas mở menu nạp nhanh (NT3, 28/07) | N | ✅ commit `9a52f83` | không | `PLAN-LIBRARY-GATEWAY.md` NT3 |
| 4.20 | CAD — chuột phải theo quy ước OS (nền trống/trên đối tượng) (NT3, 28/07) | N | ✅ commit `9a52f83` | không | `PLAN-LIBRARY-GATEWAY.md` NT3 |
| 4.21 | Di động — chạm giữ = chuột phải | N | ⬜ (việc riêng, không tự động có kèm) | 4.19, 4.20 | `PLAN-LIBRARY-GATEWAY.md` NT3 |
| 4.22 | `diskPath?`/`diskPathMissing?` trong `ImageElement` (NT4 pha 1, 28/07) | N | ✅ commit `1f637ba` | không | `PLAN-LIBRARY-GATEWAY.md` NT4 |
| 4.23 | Nút "Cập nhật liên kết" (NT4 pha 1, 28/07) | N | ✅ commit `1f637ba` | 4.22 | `PLAN-LIBRARY-GATEWAY.md` NT4 |
| 4.24 | Watch nền tự động — pha 2, CHỈ Electron desktop | P/L | ⬜ | 4.23, 1.2.10 Electron | `PLAN-LIBRARY-GATEWAY.md` NT4 |
| 4.25 | Adapter theo pha 1-3 (DXF/ảnh/text → PPTX/PDF/XLSX → PDF-scan/IFC/audio) | ? | 🟡 pha 1 (đuôi+magic byte) có qua NT2; pha 2-3 chưa | 4.16 | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §5B |
| 4.26 | Đường ra đối xứng — mọi export qua cùng cổng, gắn id+metadata | N | 🟡 export DXF nhúng metadata IF có; chưa xác nhận MỌI export đi qua 1 cổng thống nhất | 4.16 | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §5B |
| 4.27 | Luật cổng 3 điều (không parser ghi thẳng T1 · định dạng chưa có adapter lưu kho+nhãn chờ · thi công theo pha) | — (luật) | 🟡 điều 1 đúng tinh thần qua `lib/gateway/detect.ts`+`route.ts`; điều 2/3 chưa xác minh | 4.16 | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §5B |

---

## 5. KNOWLEDGE (Não tri thức T5)

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 5.1 | Luật vàng — không trích dẫn thì không có con số | P | ⬜ chỉ là hướng dẫn prompt tự do, không có validate/enforce | không | `SPEC-KNOWLEDGE-BASE.md` |
| 5.2 | Phân hạng nguồn A-D (Pháp lý/Chuẩn ngành/Kinh nghiệm/Tham khảo) | P | ⬜ `RagSourceHit` không có field hạng | không | `SPEC-KNOWLEDGE-BASE.md` |
| 5.3 | Tra đúng đoạn — bảng biểu xử lý riêng, giữ ảnh khi không chắc | P | ⬜ bóc text tuyến tính, không phát hiện bảng | không | `SPEC-KNOWLEDGE-BASE.md` |
| 5.4 | Trích đúng số — article-level chunking (cắt theo điều khoản) | P | 🟡 trái ngược spec — hiện cắt theo ~500 từ, KHÔNG theo điều/mục | không | `SPEC-KNOWLEDGE-BASE.md` |
| 5.5 | Không trộn nguồn — trend clock 🟢🟡🔴 trên tri thức | P | ⬜ không có field `trendStatus`/version trong schema notebook | 7.6 Trend clock | `SPEC-KNOWLEDGE-BASE.md` |
| 5.6 | Metadata bắt buộc mỗi mảnh tri thức (tên chuẩn/số hiệu/năm/điều/trang/hạng/trendStatus/nguồn/tenantId) | P | ⬜ `NotebookChunk` chỉ có `notebookId/sourceId/page/content/embedding` | 5.2, 5.5 | `SPEC-KNOWLEDGE-BASE.md` |
| 5.7 | Click-to-locate — mọi số trả lời click ra trang gốc | P | 🟡 checker CAD có field `source` text tự do, KHÔNG có link/click-to-jump thật | không | `SPEC-KNOWLEDGE-BASE.md` |
| 5.8 | Bản quyền ship — QCVN/TCVN ship được, Neufert/sách hãng KHÔNG ship | — (chính sách) | ⬜ không có cơ chế phân biệt nguồn-được-ship trong pipeline | không | `SPEC-KNOWLEDGE-BASE.md` |
| 5.9 | Kệ sách = tủ rỗng (mỗi studio tự nạp sách riêng) | P | 🟡 có cơ chế nạp nguồn per-project, chưa có "kệ chuẩn ngành" riêng biệt với hạng/trend | 5.2 | `SPEC-KNOWLEDGE-BASE.md` |
| 5.10 | Nguồn nạp từ ArchiNote qua Lark Base (bánh đà 2 trợ lý) | L | N/A ngoài repo IF | 1.4 ArchiNote | `SPEC-KNOWLEDGE-BASE.md` |
| 5.11 | Hạ tầng RAG hiện có (chunk/embed/extract/similarity/rag.ts + test) | P | ✅ tồn tại đầy đủ file, hoạt động (dùng cho NotebookLM full) | không | `SPEC-VITALS-AI.md` Nhóm 3 |
| 5.12 | Auto-smart 2 chế độ grounded/general (`mode = hits.length>0`) | P | ✅ | 5.11 | `SPEC-VITALS-AI.md` Nhóm 3 |
| 5.13 | Luật trích dẫn `[n]` trong prompt grounded — cấm bịa số ngoài phạm vi | P | ✅ (ở tầng prompt, không có validate cứng) | 5.11 | `SPEC-VITALS-AI.md` Nhóm 3 |
| 5.14 | General mode có prefix cảnh báo "[General mode · không có nguồn]" | P | ✅ | 5.11 | `SPEC-VITALS-AI.md` Nhóm 3 |
| 5.15 | Không key embed vẫn không vỡ (`NoEmbedProviderError` bắt gọn) | P | ✅ | 5.11 | `SPEC-VITALS-AI.md` Nhóm 3 |

---

## 6. VITALS (AI đồng hành)

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 6.1 | Vai ① Tra cứu có nguồn (trả lời kèm trích dẫn, click ra trang gốc) | ? | 🟡 có API RAG trả `sources` (NotebookLM full), KHÔNG có click-ra-trang-gốc thật; popover chặng KHÔNG dùng RAG | 5.11, 5.7 | `SPEC-VITALS-ROLE.md` §1 |
| 6.2 | Vai ② Dẫn đường (biết đang ở đâu/thiếu gì/bước kế) | ? | ⬜ Vitals hoàn toàn passive, không phát hiện thiếu dữ liệu | không | `SPEC-VITALS-ROLE.md` §1 |
| 6.3 | Vai ③ Làm thay việc lặp (function-calling, "Tô sàn gỗ sồi"→`applyMaterial()`) | L | ⬜ 0 kết quả grep function-calling toàn repo | 2.1.10 Editor toolkit (tầng năng lực) — CHẶN CỨNG, tự spec ghi rõ | `SPEC-VITALS-ROLE.md` §1, `SPEC-VITALS-AI.md` Nhóm 4 |
| 6.4 | Giao diện hình dạng A — Nhúm (dot, icon status bar mặc định) | N | 🟡 icon pill có, KHÔNG có "chấm sáng khi có gợi ý mới" | 6.2 (cần trước để có gì mà nhấp nháy) | `SPEC-VITALS-ROLE.md` §2 |
| 6.5 | Giao diện hình dạng B — Dải (bar, hover 150ms/⌘J/kéo xuống, nở ô nhập + 2-3 gợi ý) | N | 🟡 phần nở-ô-nhập ĐÃ CÓ đúng 150ms/⌘J (VIỆC A, 28/07); phần "2-3 gợi ý theo ngữ cảnh" HOÀN TOÀN CHƯA | 6.9 (payload selection) | `SPEC-VITALS-ROLE.md` §2 |
| 6.6 | Giao diện hình dạng C — Tấm (panel bên phải, việc dài, lịch sử+dẫn chứng) | ? | ⬜ popover hiện tại là 380px neo góc, không phải panel cố định bên phải | không | `SPEC-VITALS-ROLE.md` §2, §5 mục 5 |
| 6.7 | Ngữ cảnh — selection-aware (đây là phần đáng giá nhất còn thiếu, tự spec nhận) | P | ⬜ payload thật chỉ `{messages, stage, brand}` | không | `SPEC-VITALS-ROLE.md` §3 |
| 6.8 | Bảng gợi ý sẵn theo đối tượng (CAD phòng/tường, Render ảnh/thẻ, Present slide, Ý tưởng moodboard, Thư viện vật liệu — 2-3 nút mỗi loại) | P | ⬜ | 6.7 | `SPEC-VITALS-ROLE.md` §3 |
| 6.9 | Payload bổ sung `{selection: {type, id, props}}` | P | ⬜ | không | `SPEC-VITALS-ROLE.md` §3 |
| 6.10 | 3 luật chống phiền toái — luật 1: không tự bật, chỉ nhấp nháy khi có gợi ý đáng giá | ? | ⬜ | 6.2, 6.4 | `SPEC-VITALS-ROLE.md` §4 |
| 6.11 | 3 luật chống phiền toái — luật 2: không biết thì nói không biết + chỉ đường | ? | 🟡 phần "không biết" có ở RAG; "chỉ đường" (vd ArchiNote) không có trong prompt | 5.11 | `SPEC-VITALS-ROLE.md` §4 |
| 6.12 | 3 luật chống phiền toái — luật 3: mọi con số phải có trích dẫn | ? | ⬜ (trùng 5.1, chỉ thật ở NotebookLM full, không ở popover chặng) | 5.1 | `SPEC-VITALS-ROLE.md` §4 |
| 6.13 | §5 mục 1 — Vitals vào status bar (hình dạng A+B), bỏ nút nổi | N (NHỎ) | ✅ ĐẦY ĐỦ — mount cả 3 chặng, nút nổi cũ đã gỡ, `anchor:'gesture'|'statusbar'` không xung đột | không | `SPEC-VITALS-ROLE.md` §5.1 |
| 6.14 | §5 mục 2 — gợi ý theo chặng, 3 nút sẵn mỗi chặng | N (NHỎ) | ⬜ | 6.13 | `SPEC-VITALS-ROLE.md` §5.2 |
| 6.15 | §5 mục 3 — selection-aware payload + gợi ý theo đối tượng | P (VỪA) | ⬜ (trùng 6.7-6.9) | 6.13 | `SPEC-VITALS-ROLE.md` §5.3 |
| 6.16 | §5 mục 4 — trích dẫn nguồn ở MỌI điểm gọi (không chỉ NotebookLM full) | P (VỪA) | 🟡 một nửa có (NotebookLM full), popover chặng chưa | 5.11, 5.1 | `SPEC-VITALS-ROLE.md` §5.4 |
| 6.17 | §5 mục 5 — hình dạng C (panel) cho việc dài | P (VỪA) | ⬜ (trùng 6.6) | 6.13 | `SPEC-VITALS-ROLE.md` §5.5 |
| 6.18 | §5 mục 6 — vai ③ function-calling | L (LỚN) | ⬜ (trùng 6.3) | "chờ tầng năng lực" — CHẶN CỨNG | `SPEC-VITALS-ROLE.md` §5.6 |
| 6.19 | Ambient orb — cử chỉ 2 tầng kéo xuống (slop→vitals 28px→notebook-full 120px) | N | ✅ | không | `SPEC-VITALS-AI.md` Nhóm 1 |
| 6.20 | Handle hairline + tooltip onboarding (idle→active, khoá hint_seen/first_done) | N | ✅ | 6.19 | `SPEC-VITALS-AI.md` Nhóm 1 |
| 6.21 | Pre-mount panel chống motion khưng | N | ✅ | 6.19 | `SPEC-VITALS-AI.md` Nhóm 1 |
| 6.22 | Thanh Vitals luôn hiện ở Gallery (`VitalsChatBubble`, KHÔNG dùng StatusBar) | N | ✅ (kiến trúc riêng, ngoài phạm vi 6.13) | không | `SPEC-VITALS-AI.md` Nhóm 1 |
| 6.23 | Visual "orb" giọt kính (SVG drip/breathing) | N | ⬜ cố ý bỏ (23/07, theo yêu cầu user) | không | `SPEC-VITALS-AI.md` Nhóm 1 |
| 6.24 | Phím tắt ⌘J mở Vitals | N | ✅ (nay neo vào StatusBar, khác doc gốc ghi ⬜) | 6.13 | `SPEC-VITALS-AI.md` Nhóm 1 |
| 6.25 | Canvas copilot — context theo chặng (`ChatStage` đổi prompt) | P | ✅ | không | `SPEC-VITALS-AI.md` Nhóm 2 |
| 6.26 | Client gửi kèm `stage`, backend pick prompt theo stage | P | ✅ | 6.25 | `SPEC-VITALS-AI.md` Nhóm 2 |
| 6.27 | Endpoint `/api/ai-assist-chat` không biết `projectId` | P | ⬜ (nợ xác nhận, không nối dữ liệu dự án) | không | `SPEC-VITALS-AI.md` Nhóm 2 |
| 6.28 | Popover Vitals ở chặng KHÔNG dùng RAG (khác NotebookLM full) | P | 🟡 (đúng, là nợ đã biết) | 5.11 | `SPEC-VITALS-AI.md` Nhóm 3 |
| 6.29 | Voice input (giọng nói) | L | ⬜ | 5.11 (đường nguồn) | `SPEC-VITALS-AI.md` Nhóm 5 |
| 6.30 | Kéo ảnh reference vào chat (multimodal) | P | ⬜ | 5.11 | `SPEC-VITALS-AI.md` Nhóm 5 |
| 6.31 | Audio overview (podcast tóm tắt, TTS 2 giọng) | L | ⬜ | 5.11, provider TTS | `SPEC-VITALS-AI.md` Nhóm 6 |
| 6.32 | Nguyên tắc trung tính — gỡ đuôi "gu TTT" khỏi system prompt | P | ✅ (de-ttt commit đã có) | không | `SPEC-VITALS-AI.md` |
| 6.33 | Nguyên tắc trung tính — bơm Brand Kit thật per-project vào prompt | P | ✅ | không | `SPEC-VITALS-AI.md` |
| 6.34 | Nguyên tắc trung tính — GuProfile CHƯA bơm (cố ý, tránh trộn gu dự án khác) | P | ⬜ cố ý | Reference cần `projectId` (chưa có) | `SPEC-VITALS-AI.md` |

---

## 7. HẠ TẦNG NỀN

### 7.1 Kiến trúc nền tảng

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 7.1.1 | Kiến trúc 6 tầng T0-T5 (hạ tầng→lõi mã chung→động cơ→tính năng→giao diện→não tri thức) | — (mô hình) | ✅ mô tả đúng thực trạng code (dùng làm khung phân loại cho file này) | không | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §1 |
| 7.1.2 | Web app bọc Electron (KHÔNG Tauri) — mở khoá file thật/GPU local/offline | N | ✅ `electron/main.js` 451 dòng, auto-updater thật | không | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §1B |
| 7.1.3 | Adapter layer bắt buộc cho đọc/ghi file + gọi render (không gọi thẳng API trình duyệt) | — (ràng buộc) | 🟡 chưa xác minh toàn bộ điểm chạm đã qua adapter | 7.1.2 | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §1B |
| 7.1.4 | Local-first + đồng bộ (dữ liệu ở máy, cloud là bản sao) | — (mô hình) | ✅ SQLite+Prisma+uploads/ đúng hướng | không | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §1B-2 |
| 7.1.5 | 5 ràng buộc local-first — id=cuid | N | ✅ 16/16 model đạt | không | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §1B-2 |
| 7.1.6 | 5 ràng buộc local-first — `updatedAt`+`rev` | N | 🟡 (theo audit 24/07: updatedAt 3/16, rev 0/16 — cần re-check, có thể đã tăng sau NT/StatusBar work) | không | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §1B-2 |
| 7.1.7 | 5 ràng buộc local-first — xoá mềm `deletedAt` | N | 🟡 (theo audit 24/07: 0/16 tại thời điểm đó; `Project`/`ProjectMember`/`LibraryAsset`/`Flow` nay đã có `deletedAt` theo các đoạn code đã đọc trong phiên này — cần audit lại số chính xác) | không | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §1B-2 |
| 7.1.8 | 5 ràng buộc local-first — ghi `deviceId`/người sửa | N | ⬜ `lastEditedDevice` luôn null (nợ kỹ thuật xác nhận trong STATUS.md) | không | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §1B-2 |
| 7.1.9 | 5 ràng buộc local-first — tách file khỏi DB (DB giữ path) | N | ✅ | không | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §1B-2 |
| 7.1.10 | Sync 3 pha (nay local thuần → 1 chiều share → 2 chiều nhiều máy) | — (lộ trình) | 🟡 đang ở pha 1 | 7.1.6-7.1.8 | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §1B-2 |
| 7.1.11 | Thang bậc N-P-L — cơ chế phân loại tính năng (dùng xuyên suốt file này) | — (mô hình) | ✅ | không | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §2 |
| 7.1.12 | Hộ chiếu tính năng (6 trường bắt buộc trước khi code) | — (quy trình) | (không phải feature code, là quy trình làm việc) | không | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §3 |
| 7.1.13 | 5 moat L1-L5 (Checker TCVN+wizard · Gu Engine 10 trục · CAD→Render giữ layout · Layout ML Nhận/Bỏ · Chuỗi vật liệu CAD→BOQ→Present) | L | 🟡 L1 ✅ · L2 ✅ · L3 🟡 (khung xong, chờ compute) · L4 ✅ · L5 🟡 (hook chờ ATLAS) | 2.1, 2.2, 2.3 (rải theo chặng) | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §6 |
| 7.1.14 | Danh sách backfill N — gói "CAD cảm giác tay" (7 mục A1.1…A4.1) | N | 🟡 (xem 2.1.1, 2.1.1.a — vẫn còn thủng theo audit gốc) | 2.1.1 | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §7 |
| 7.1.15 | 8 luật vận hành (không xây L khi N chưa ✅ · hộ chiếu bắt buộc · sprint tách bậc · ⛔-list ghi sổ · output-có-id · human-in-loop 4 luật · năng lực-trước-AI · LLM-không-ghi-hình-học) | — (luật) | (quy trình, không chấm trạng thái code) | không | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §8 |
| 7.1.16 | IF Gateway 5B — xem khối 4 File Manager (không đếm trùng) | N | (xem 4.16-4.27) | 4. File Manager | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §5B |
| 7.1.17 | Dây chuyền vận hành — hợp đồng I/O từng chặng (0 Đề bài→1 CAD→2 Render→3 Present→4 Phản hồi) | — (mô hình) | 🟡 luật "output không id = mồ côi" đã áp cho ảnh (`img_`), chưa toàn bộ pipeline | không | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §5 |
| 7.1.18 | Nâng `Violation`/`Severity`/`registry` từ `lib/cad/standards/` → `lib/standards/` dùng chung cho cả 3 chặng (chấm chuẩn trước khi xuất, đề xuất 29/07, mã cũ đề xuất sai `7.23`) | N | ⬜ chưa nâng cấp — hiện chỉ chặng 1 dùng | 2.1.4 (Standards Checker chặng 1); 2.2.78 (thứ tự Sprint 3 ④→⑤ đã chốt, xem ghi chú đầu mục "2.2.60-2.2.85" khối 2.2 Render) | `docs/SPEC-TONG-COWORK-2026-07-29.md` §7.5 |
| 7.1.19 | Lark provider — Wiki `app_token` resolution: `resolveWikiAppToken()` (`GET /open-apis/wiki/v2/spaces/get_node?token={node_token}&obj_type=wiki` → đọc `obj_token`, cache) + tách 3 biến `LARK_ATLAS_NODE_TOKEN`/`LARK_ATLAS_APP_TOKEN`/`LARK_WORK_APP_TOKEN`, giữ tương thích `LARK_BASE_APP_TOKEN` | N | ⬜ chưa có — `lib/integrations/providers/lark.ts` hiện 0 dòng về wiki (grep xác nhận 30/07), chỉ 1 `LARK_BASE_APP_TOKEN`. **Lý do cần**: ATLAS Material Library nằm trong Lark **Wiki**, không phải Drive base thường — `node_token` (deep link) ≠ `app_token` (gọi bitable API), phải giải qua endpoint trên rồi cache, KHÔNG suy ra từ nhau (nhầm lẫn này tốn nửa ngày để tìm nếu không ghi rõ) | không | `docs/REVIEW-SPEC-BOQ-LARK-2026-07-30.md` §3 |
| 7.1.20 | ⭐ Gộp hệ ngưỡng bề rộng màn hình — `lib/breakpoints.ts` (hằng `BP` = 640/768/1024/1280/1536, KHÔNG đổi giá trị Tailwind — 70 chỗ đang dùng) làm nguồn duy nhất, kéo 5 ngưỡng tự viết rải rác (700/900/720/520/1100, không khớp mốc nào) về đúng `BP` | N | ✅ done (checklist 6 bước đủ, 30/07) — `lib/breakpoints.ts` mới (`BP` + `isNarrowerThan()` + hook `useBreakpoint()`). Sửa 5 chỗ: `tool-mode-ui.ts:112` (700→`BP.md`) · `notebook/page.tsx:193` (900→`BP.lg`, styled-jsx interpolate) · `foldable.css` ×2 (520→640, 720→768, plain CSS không import được JS — giữ số khớp tay) · `globals.css:1065` (1100→1279, chọn `BP.xl` không phải `BP.lg` vì dải 1024-1279 tự nó đã là "ngân sách bề rộng CHẶT", nhãn phụ nên ẩn suốt dải đó). Grep toàn repo xác nhận không sót ngưỡng lẻ nào khác (matchMedia còn lại đều là feature query khác, không phải width). Ghi **Luật #10** (tiêu chuẩn nghề không hỏi) và **Luật #11** (nguồn `BP` duy nhất + giao thức verify 5 mốc **640·768·1024·1180·1440**, 1180 bắt buộc) vào PHẦN E. Khảo dải 1024-1279 (bước 4, chỉ liệt kê chưa sửa): `AppChrome.tsx` cụm phải `hidden...sm:flex` nhảy thẳng ẩn→đủ desktop từ 640px, chưa test riêng 640-1023; `ToolModeForm.tsx:138` `gridTemplateColumns:'1fr 1fr'` cứng, KHÔNG có breakpoint nào — 2 cột ẢNH GỐC+KẾT QUẢ sẽ chật trên điện thoại/tablet hẹp. `ToolModeHome.tsx` KHÔNG phải lỗi — dùng `auto-fill,minmax(220px,1fr)` tự co giãn, không cần breakpoint. | không | `docs/VERIFY-7.3.31.md` (nguồn phát hiện), Luật #10/#11 PHẦN E |

### 7.2 Trend clock & hội đồng giả định (5C)

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 7.2.1 | Đồng hồ xu hướng — `review_by`+`trend_status` 🟢🟡🔴 trên bản ghi T5 + hộ chiếu tính năng | — | ⬜ (trùng 5.5, không đếm 2 lần) | 5.5 | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §5C |
| 7.2.2 | Tác nhân quét (trend scout) — LLM+web search định kỳ cập nhật `TREND_WATCH` | L | ⬜ | 7.2.1 | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §5C |
| 7.2.3 | Hội đồng giả định (synthetic panel) — persona 10-trục Q&A sơ khảo trước khách thật | L | ⬜ | 5.2 (hạng nguồn), 6.7 (selection) | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §5C |
| 7.2.4 | Luật chống buồng vang — nhãn `nguồn:synthetic`, không trộn với thật, veto-only | — (luật) | ⬜ (chưa có gì để áp luật lên, vì 7.2.3 chưa xây) | 7.2.3 | `IF-ARCHITECTURE-BLUEPRINT-v1.md` §5C |

### 7.3 Khung giao diện & điều hướng

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 7.3.1 | 4 lớp không lẫn (Studio·Dự án·Chặng·Tác vụ, mỗi màn biết mình ở lớp nào) | N | 🟡 nền `lib/scope.ts` (2 scope global/project) có, nhưng KHÔNG hiển thị tường minh 4 lớp cho người dùng | không | `SPEC-NAVIGATION-MODEL.md` §1 |
| 7.3.2 | Khung cố định: thanh chặng trên · canvas giữa · panel phải · **StatusBar đáy** · rail trái | N | 🟡 (StatusBar ✅ mới xong 28/07 — MẢNH DUY NHẤT của diagram thực sự mới; breadcrumb "[Dự án▾]" ở thanh chặng CHƯA có; rail trái 4-mục chưa xác minh đủ) | 6.13 (StatusBar) | `SPEC-NAVIGATION-MODEL.md` §2 |
| 7.3.3 | Ngoại lệ duy nhất — Trình chiếu toàn màn hình ẩn hết, Esc để về | N | ✅ (StatusBar tự ẩn qua `usePlayStatus`/`presentModeOpen`) | 7.3.2 | `SPEC-NAVIGATION-MODEL.md` §2 |
| 7.3.4 | "Ý tưởng" là 1 chặng riêng trước CAD (4 luồng chuẩn) | N | ⬜ `lib/phases.ts` chỉ có 3 phase, chưa có phase "ideation" riêng | 2.0 Ý tưởng | `SPEC-NAVIGATION-MODEL.md` §3 |
| 7.3.5 | Luồng A — dự án mới từ đầu (Dashboard→Ý tưởng→CAD→Render→Present) | N | 🟡 3/4 chặng độc lập tồn tại, luồng liền mạch qua "Ý tưởng" chưa khớp vì 7.3.4 chưa có | 7.3.4 | `SPEC-NAVIGATION-MODEL.md` §3 |
| 7.3.6 | Luồng B — Render không cần CAD (ngắn nhất) | N | 🟡 Tool Mode "Sửa một mảng" hiện vẫn cần mở canvas vẽ mask tay, chưa liền mạch độc lập hoàn toàn | 2.2.2 | `SPEC-NAVIGATION-MODEL.md` §3 |
| 7.3.7 | Luồng C — hồ sơ mới từ bản vẽ cũ (Present tự lấy bản vẽ+ảnh có sẵn theo loại hồ sơ) | N | ⬜ | 2.3.3 | `SPEC-NAVIGATION-MODEL.md` §3 |
| 7.3.8 | Luồng D — từ hiện trường về (ArchiNote đo/chụp→Lark→IF có sẵn số đo) | N | ⬜ phía IF không có import Lark measurement nào | 1.4 ArchiNote | `SPEC-NAVIGATION-MODEL.md` §3 |
| 7.3.9 | Phân loại hiển thị theo ngữ cảnh (ngữ cảnh/dự án/thói quen) | N/P/L | ⬜ chưa đủ bằng chứng, cần audit riêng từng panel | không | `SPEC-NAVIGATION-MODEL.md` §4 |
| 7.3.10 | Ba loại panel phân biệt (công cụ rail · thuộc tính phải · hộp thoại giữa) | N | 🟡 cấu trúc tồn tại, chưa xác minh phân biệt nghiêm ngặt | không | `SPEC-NAVIGATION-MODEL.md` §5 |
| 7.3.11 | Luật đặt nút theo vị trí (thanh chặng/canvas toolbar/rail/status bar mỗi nơi 1 việc) | N | ✅ (StudioBar + StatusBar đúng luật) | 7.3.2 | `SPEC-NAVIGATION-MODEL.md` §6 |
| 7.3.12 | Bức tranh tổng 3 hệ — ArchiNote↔IF↔ATLAS không gọi nhau, chỉ cùng đọc/ghi Lark | — | ⬜ không tìm thấy bridge PROJECT_STATUS nào (trùng 1.4.2) | 1.4.2 | `SPEC-NAVIGATION-MODEL.md` §7 |
| 7.3.13 | Ray icon 4 chặng (CAD·Render·Present·Library), panel trượt | N | 🟡 rail hiện là panel công cụ chung, KHÔNG phải "4 ray = 4 chặng"; chặng thật do StageSwitcher đảm nhiệm | không | `SPEC-UI-SHELL.md` |
| 7.3.14 | Tab như trình duyệt — mở nhiều bản vẽ/dự án song song | N | ⬜ | không | `SPEC-UI-SHELL.md` |
| 7.3.15 | Mỗi chặng 1 nút chính nổi bật (Kiểm chuẩn/Render/Xuất deck) | N | ✅ | không | `SPEC-UI-SHELL.md` |
| 7.3.16 | Điều khiển canvas nổi góc (zoom+minimap) | N | 🟡 chưa xác minh minimap riêng | không | `SPEC-UI-SHELL.md` |
| 7.3.17 | Trạng thái thường trực (hàng đợi·lưu·lỗi quy chuẩn) | N | ✅ (trùng StatusBar 6.13, không đếm 2 lần) | 6.13 | `SPEC-UI-SHELL.md` |
| 7.3.18 | Lỗi dạng thẻ nổi, không chặn màn hình (toast) | N | 🟡 chưa xác minh đủ | không | `SPEC-UI-SHELL.md` |
| 7.3.19 | Khung breadcrumb dự án + tab bản vẽ trên thanh chặng | N | 🟡 (trùng 7.3.2, không đếm 2 lần) | 7.3.2 | `SPEC-UI-SHELL.md` |
| 7.3.20 | Luật canvas 4 trạng thái (rảnh/đã chọn toolbar nổi/đang kéo ẩn hết/đang sửa chữ) | N | 🟡 spec tự ghi rõ lỗi Present hiện tại "chọn chữ để dời mà toolbar vẫn đè" — CHƯA đúng luật | không | `SPEC-UI-SHELL.md` |
| 7.3.21 | Command palette Cmd/Ctrl+K — 1 ô tìm dự án/deck/bản vẽ/vật liệu/ảnh/lệnh/công cụ/quy chuẩn | N | 🟡 có Cmd+K thật nhưng phạm vi CHỈ gồm hành động canvas+node, KHÔNG tìm được dự án/deck/vật liệu/ảnh/quy chuẩn | không | `SPEC-UI-SHELL.md` |
| 7.3.22 | Gợi ý ngữ cảnh 3 mức (lọc theo chặng/gợi ý tại chỗ/chủ động nhắc, tắt được và nhớ) | N/P | ⬜ chưa đủ bằng chứng | không | `SPEC-UI-SHELL.md` |
| 7.3.23 | Lỗi trả lời 2 câu (chuyện gì xảy ra · giờ bấm gì) | N | ⬜ chưa xác minh chuẩn hoá | không | `SPEC-UI-SHELL.md` |
| 7.3.24 | Empty state bắt buộc — 2 nút mời gọi + tour | N | 🟡 hệ onboarding tồn tại, chưa khớp đúng "2 nút" | không | `SPEC-UI-SHELL.md` |
| 7.3.25 | Phân nhóm theo việc thiết kế, không theo kiến trúc phần mềm | N | 🟡 Command Palette vẫn dùng nhãn kỹ thuật (INPUT/AI_GENERATE…) ở tầng category-order, có thể đã Việt hoá ở label hiển thị | 7.3.21 | `SPEC-UI-SHELL.md` |
| 7.3.26 | "Giấy vuông vỏ bo" — Present giữ `border-radius:0`, UI khác giữ bo góc | N | ✅ | không | `SPEC-UI-SHELL.md` |
| 7.3.27 | Lấp đầy tầng 3 chỉ dẫn — nối 45 `description` node có sẵn vào `coachmarkSeen` (đề xuất 29/07, mã cũ đề xuất sai `7.20`) | N | ⬜ `COACHMARKS` hiện chỉ 1 mục (`'selectMove'`) trong 45 node | không | `docs/SPEC-TONG-COWORK-2026-07-29.md` §7.1 |
| 7.3.28 | Tầng 4 chỉ dẫn — kích hoạt theo hành vi (dừng ≥8s · lỗi 2 lần liên tiếp · thả sai định dạng · mở node lần đầu) (mã cũ đề xuất sai `7.21`) | N | ⬜ chưa có, chỉ có kích hoạt "lần đầu nhìn thấy X" | 7.3.27 | `docs/SPEC-TONG-COWORK-2026-07-29.md` §7.1 |
| 7.3.29 | Tầng 5 chỉ dẫn — Vitals trả lời "làm sao để…", đọc `IF-FEATURE-TREE.md` + 45 description (mã cũ đề xuất sai `7.22`) | N | ⬜ | 7.3.27 | `docs/SPEC-TONG-COWORK-2026-07-29.md` §7.1 |
| 7.3.30 | Dựng `/settings` 4 nhóm (Tài khoản·Giao diện·AI·Trải nghiệm): thêm link "Ảnh đại diện" (bỏ `/settings/avatar` mồ côi) · gỡ ngôn ngữ+"xem lại hướng dẫn" khỏi MoreMenu/MobileMenu, dời vào Giao diện/Trải nghiệm · **giữ credits ở MoreMenu** (trạng thái xem) | N | ✅ done (checklist 6 bước đủ) — commit theo sau `74cf4c5`: `app/settings/page.tsx` 4 nhóm (`AccountSettings`/`AppearanceSettings`/`AiDependencySettings`/`ExperienceSettings` mới), `Header.tsx`+`MobileMenu.tsx` gỡ Ngôn ngữ+"Xem lại hướng dẫn", thêm link "Cài đặt". Browser-verify thật 1440px+375px: đủ 4 nhóm, MobileMenu/MoreMenu xác nhận qua DOM không còn Ngôn ngữ/hướng dẫn. 🔄 **CẬP NHẬT 30/07 sau `7.3.31` mở rộng**: nhận định "GIỮ CẢ 2 nút theme vì khác route" ở dòng này đã ĐÚNG tại thời điểm viết (Header.tsx/StudioBar.tsx còn là 2 component riêng), nhưng `7.3.31` sau đó HỢP NHẤT 2 component thành `AppChrome.tsx` dùng chung — hệ quả tất yếu là theme giờ CHỈ CÒN 1 nút (trong `MoreMenu()`, mọi route). Ghi chú "đừng xoá lại 1 trong 2 nút" ở đây KHÔNG CÒN ÁP DỤNG — lý do giữ 2 cái (khác route, khác component) đã mất khi 2 component gộp làm 1. `CommandPalette.tsx` vẫn giữ nguyên, không đổi. | 2.2.61.a (✅) | `docs/TICKET-SETTINGS-GOM-CAU-HINH-2026-07-29.md` §5 |

| 7.3.31 | ⭐ **NÂNG PHẠM VI 30/07**: không chỉ sửa 3 nút chặng nhảy vị trí — HỢP NHẤT lớp APP CHROME: `Header.tsx` (route `/`, mount ở `HomeScreen`) + `StudioBar.tsx` (mount ở `CadStageScreen`/`PresentStageScreen`/`PhotoEditorScreen`) → **1 component `AppChrome.tsx` duy nhất**, slot theo chặng qua prop `active: 'render'|'cad'|'present'|'photo'` | N | ✅ done (checklist 6 bước đủ, 30/07). **Phần nhảy vị trí (bản gốc, 3 nguồn)**: ① `fontWeight` 600 active/500 inactive đổi bề rộng chữ ② nhãn CAD tự đổi độ dài theo `cadStage` (xác nhận là code chết — `setStage()` 0 lần gọi ở UI thật, `cadStage` luôn `'sketch'`; KHÔNG di chuyển gì sang `CadToolbar` `ModeSwitch` như ticket gốc đề xuất, vì đó là `cadMode` Sketch↔Pro — khác hẳn `cadStage` giai đoạn bàn giao IF2 mà ticket nhầm lẫn) ③ nhãn micro `· {label}` trùng lặp thông tin với pill → cả 3 bịt bằng `.stage-btn::before{content:attr(data-label)}` (`app/globals.css`) chiếm sẵn bề rộng theo bản CHỮ ĐẬM RỘNG NHẤT. **Phần hợp nhất (mở rộng)**: `AppChrome.tsx` mới (~370 dòng) + `AppChromeTypes.ts` (tách `type AppChromeActive` tránh vòng lặp import) + `lib/studio/stage-nav.ts` mới (gộp `PhaseSwitcher.onPick` của Header cũ + `go()` của StudioBar cũ thành 1 hàm `pickStage()`); `Header.tsx`+`StudioBar.tsx` xoá hẳn (xác nhận grep 0 import còn lại trước khi xoá). Slot riêng chặng (không di chuyển đi đâu — đúng thiết kế, không phải thiếu): "Chạy flow"+Tệp/AiStatusDot chỉ `active==='render'` (Render không có toolbar tài liệu riêng nào khác để dời vào — xem `2.2.86` sắp dời tiếp "Chạy flow" ra khỏi bar này), `photoContext` chỉ `active==='photo'`, `data-if-deselect-zone` chỉ khi `active!=='render'`. KHÔNG gộp toolbar TÀI LIỆU của `CadEditor.tsx`/`PresentEditor`'s `Toolbar.tsx`/`PhotoToolbar.tsx` — lớp khác (thuộc bản vẽ/deck/ảnh đang mở). **2 lỗi thật sửa kèm (không phải gap)**: `SessionWatch` trước chỉ ở `StudioBar` (route `/` không báo hết phiên) → nay universal 4 route; không route nào ngoài `/` có đường tới `/settings` → `MoreMenu` (kèm link Cài đặt + theme) nay universal. `MobileMenu.tsx` nhận thêm prop `active`, `PhaseRow` đổi sang gọi `pickStage()` qua router thay vì `setWorkspace()` trực tiếp (bug: đổi state không đổi URL ngoài route render). Theme toggle: chỉ còn 1 nút (trong `MoreMenu()`), xem cập nhật ở `7.3.30`. Browser-verify thật: `getBoundingClientRect()` của `.if-dock` ở **CẢ 4 route** (`/`, `/cad`, `/present`, `/photo` — `/photo` qua tab mới, đúng cách người dùng thật vào route này) **× 2 breakpoint (1183/1440px)** — left **giống hệt 254.203125px cả 8/8 lần đo** (0px jitter), width lệch tối đa 0.28px (dưới ngưỡng ≤0.5px). `UserChip`/"Cài đặt"/`SessionWatch`/theme xác nhận có mặt ở cả 4 route (boolean DOM). `tsc --noEmit` sạch, ESLint sạch, 102/102 test sucrase-node pass. **Nợ kỹ thuật phát hiện (không phải regression của việc này)**: overlap Tệp↔Chạy flow ở 1024px — pre-existing từ `Header.tsx` cũ (comment gốc dòng 45-52 xác nhận cố ý không dùng `overflow-hidden` vì cắt popover con), ghi vào `docs/TECH-DEBT.md`, tự hết khi `2.2.86` dời "Chạy flow" khỏi bar. | không | `docs/TICKET-STAGE-SWITCHER-NHAY-2026-07-30.md` |

### 7.4 Cộng tác (Collaboration)

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 7.4.1 | Bình luận gắn vào đối tượng (ghim đúng vị trí trên ảnh/slide/CAD, KHÔNG phải chat rời) | N | ⬜ **không có model `Comment` nào trong Prisma gắn projectId+object id** | không | `SPEC-COLLABORATION.md` |
| 7.4.2 | Luật ranh giới — chat GẮN NGỮ CẢNH DỰ ÁN được phép, chat CHUNG kiểu Slack/tán gẫu (lặp Lark/Zalo) thì không | — (luật, đã QUYẾT Q2a 28/07) | ✅ GIỮ `ChatPanel.tsx` — không còn vi phạm sau khi sửa lại `SPEC-COLLABORATION.md` làm rõ ranh giới (luật cấm nhắm tới tán gẫu chung, không nhắm ChatPanel gắn theo dự án/flow hiện có) | không | `SPEC-COLLABORATION.md` (đã sửa 28/07) |
| 7.4.3 | Trả lời theo luồng (threaded reply) + đánh dấu đã xử lý | N | 🟡 CHỈ tồn tại ở `CommentLayer.tsx` (công cụ dev nội bộ, không phải sản phẩm) — có "resolved", KHÔNG có threaded reply | 7.4.1 | `SPEC-COLLABORATION.md` |
| 7.4.4 | @nhắc tên → gửi thông báo | N | ⬜ | 7.4.1 | `SPEC-COLLABORATION.md` |
| 7.4.5 | "Việc của tôi" — gom bình luận nhắc mình xuyên mọi dự án | N | ⬜ | 7.4.1, 7.4.4 | `SPEC-COLLABORATION.md` |
| 7.4.6 | Bình luận mang `projectId`+id đối tượng (luật "không id = mồ côi") | N | ⬜ (không có model Comment để mang) | 7.4.1 | `SPEC-COLLABORATION.md` |
| 7.4.7 | Khách comment qua link không cần tài khoản, phiên bản có tên, so sánh v1↔v2 | P | ⬜ share link chỉ xem read-only Render, KHÔNG comment được | 7.4.1, 2.3.10 (PS-5) | `SPEC-COLLABORATION.md` |
| 7.4.8 | Bình luận → `FeedbackRecord` nạp về T5 ("bài học dự án") | L | ⬜ | 7.4.1 | `SPEC-COLLABORATION.md` |
| 7.4.9 | Sync bình luận nhẹ lên Lark/cloud (pha 2) | N | ⬜ (không có gì để sync) | 7.4.1 | `SPEC-COLLABORATION.md` |
| 7.4.10 | Live cursor + presence thời gian thực trên canvas (KHÔNG spec trong SPEC-COLLABORATION.md, code đã vượt trước) | — | ✅ THẬT, hoạt động — `lib/collabStore.ts` poll 900ms + `LiveCursors.tsx`+`PresenceBar.tsx`, mount trong `FlowCanvas.tsx` | không | (không có spec — code vượt trước tài liệu) |
| 7.4.11 | Chốt A/B `LiveCursors` — con trỏ hứa đồng bộ mà `nodes`/`edges`/`params` không hề đồng bộ, lỗi tin cậy (đề xuất 29/07, mã cũ đề xuất sai `7.24`) | N | ⬜ chưa chốt — phương án A **được duyệt** (`docs/CHOT-SO-MA-2026-07-29.md` §D): tạm ẩn `LiveCursors`, giữ `PresenceBar` | 7.4.10 | `docs/SPEC-TONG-COWORK-2026-07-29.md` §7.4 |
| 7.4.12 | Khoá mềm "ai đang mở dự án này" — đọc `lastSeenAt`, báo trước khi 2 người cùng sửa, KHÔNG khoá cứng (mã cũ đề xuất sai `7.26`) | N | ⬜ | không | `docs/SPEC-TONG-COWORK-2026-07-29.md` §7.4 |
| 7.4.13 | CRDT Yjs đồng bộ graph/slide thật — CHỈ làm khi 7.4.1+7.4.3+7.4.6 (ghim góp ý) và 7.4.12 (khoá mềm) đã dùng thật mà vẫn thiếu (mã cũ đề xuất sai `7.27`) | L | ⬜ (đúng chủ đích, không phải nợ) | 7.4.1, 7.4.12 | `docs/SPEC-TONG-COWORK-2026-07-29.md` §7.4 |

> **29/07 (`docs/CHOT-SO-MA-2026-07-29.md` §C)** — "Ghim góp ý" mà SPEC-TỔNG đề xuất mã mới `7.25`
> **KHÔNG cần mã mới**: đã nằm sẵn ở `7.4.1`+`7.4.3`+`7.4.6` ngay trên, có spec gốc
> `SPEC-COLLABORATION.md`, chỉ chưa xây. Phát hiện quan trọng: `7.4.1` (giá trị nghề hạng 1, có
> spec) vẫn ⬜, trong khi `7.4.10` Live cursor (giá trị hạng 3, KHÔNG có spec) lại ✅ đã xây — đúng
> hiện tượng "xây nhầm thứ rẻ, bỏ thứ đắt" mà Luật #6 Đồng Bộ muốn chặn.

### 7.5 Nền tảng vận hành khác

| Mã | Tên | Bậc | Trạng thái | Phụ thuộc | File spec gốc |
|---|---|---|---|---|---|
| 7.5.1 | Kho model AI/extension manager — xem 1.2.7-1.2.8 (không đếm trùng) | P | (xem 1.2.7-1.2.8) | 1.2 | `SPEC-PRODUCT-INFRA.md` |

---

## BẢNG TỔNG 1 — ĐẾM THEO KHỐI

> Loại các mục **N/A ngoài repo IF** (toàn bộ 1.4, phần ArchiNote của 5.10/1.4.5/7.3.8/7.3.12) và
> các mục **— (luật/nguyên tắc/quy trình, không phải feature code)** khỏi mẫu số phần trăm.
> Mục **⛔ non-goal chủ đích** giữ trong "Tổng" nhưng loại khỏi mẫu số % (không tính là gap).
> 2.1 CAD tính theo trọng số item gốc (101 item, không phải theo dòng cấp 3/4 rút gọn ở trên).

| Khối | Tổng mục (cấp 3+4, đã trừ N/A/luật) | ✅ | 🟡 | ⬜ | ⛔ | % (loại ⛔) |
|---|---|---|---|---|---|---|
| 1. Manager Center | 30 | 11 | 8 | 11 | 0 | (11+4)/30 ≈ 50% |
| 2.0 Ý tưởng | 22 | 0 | 4 | 17 | 1 | 2/21 ≈ 9.5% |
| 2.1 CAD (101 item gốc + 33 mục bổ sung mode/semantic/toolkit) | 134 | 70 | 39 | 22 | 3 | (70+19.5)/131 ≈ 68% |
| 2.2 Render + Material | 66 | 20 | 30 | 15 | 1 | (20+15)/65 ≈ 54% |
| 2.3 Present | 57 | 15 | 17 | 21 | 4 | (15+8.5)/53 ≈ 44% |
| 3. Library | 32 | 4 | 15 | 13 | 0 | (4+7.5)/32 ≈ 36% |
| 4. File Manager/Gateway | 27 | 6 | 5 | 16 | 0 | (6+2.5)/27 ≈ 31% |
| 5. Knowledge | 15 | 5 | 3 | 7 | 0 | (5+1.5)/15 ≈ 43% |
| 6. Vitals | 34 | 12 | 8 | 14 | 0 | (12+4)/34 ≈ 47% |
| 7. Hạ tầng nền | 44 | 12 | 15 | 15 | 0 | (12+7.5)/42 ≈ 46% |
| **TỔNG (loại N/A ArchiNote + luật)** | **461** | **155** | **144** | **151** | **9** | **(155+72)/452 ≈ 50%** |

*(Đếm bằng tay từ bảng trên — có thể lệch ±5-10 mục do một số dòng "trùng, xem khối X" không đếm 2 lần theo chủ đích; coi là ước lượng, không phải số tuyệt đối. Khối 2.1 CAD nặng nhất vì kế thừa nguyên 101-item audit — các khối khác mỏng hơn vì mới audit 1 lượt.)*

---

## BẢNG TỔNG 2 — CÂY PHỤ THUỘC (chỉ quan hệ CHẶN)

| Mục bị chặn | Bị chặn bởi | Loại chặn |
|---|---|---|
| 6.3, 6.18 Vitals vai ③ function-calling | 2.1.10 Tầng năng lực (luật 7 "năng lực→nút→AI") CHƯA dựng | Chặn cứng — tự spec ghi rõ |
| 2.1.9.d/e AI sinh layout thật (LLM ý định) | Chưa cắm LLM thật vào `ai-assist.ts::parseDescription` (còn stub rule-based) | Chặn cứng |
| 1.3.2.c Brief-intake hỏi lại chỗ thiếu | Cùng gốc — chưa có LLM thật, cùng file `ai-assist.ts` | Chặn cứng (chung nguyên nhân với dòng trên) |
| 2.2.24.d Diagram luồng giao thông | 2.1.9.c Semantic model Wall/Room (T3/T4, STATUS.md xác nhận CHƯA LÀM) | Chặn cứng |
| 2.3.25 Animated Layout luồng giao thông | 2.1.9.c Semantic model (cùng lý do) | Chặn cứng |
| 2.2.30.d Mặt bằng chiếu sáng | 2.2.30.e Đối tượng "đèn" có ngữ nghĩa (chưa có entity) | Chặn cứng |
| 2.3.27 Animated Layout ngày↔đêm | 2.2.30.b L6 reflectance vật liệu (chưa đọc) | Chặn cứng |
| 4.18 Nối Gateway vào IOMenu | 3.30.a NT1 gộp panel thư viện (CHỜ, đã chốt trong PLAN) | Chặn cứng — tự PLAN ghi rõ |
| 4.14 Watch folder tự phân loại | 4.1 Cây thư mục thật + 3.30.a NT1 | Chặn cứng |
| 3.30.c Gộp block/furniture 1 model | 3.30.a Gộp panel thư viện | Phụ thuộc trình tự |
| 2.2.23 (6C sinh diện) toàn nhánh a-i | Node `ai.furnitureextract` làm input (đã có) + nhau (4a→4b→4c→4d tuần tự) | Phụ thuộc trình tự nội bộ |
| 7.2.3 Hội đồng giả định | 5.2 Phân hạng nguồn A-D (persona cần checklist TRỤ/NHÃ + hạng nguồn — TRỤ = tên mới của KIÊN, đổi 28/07) | Phụ thuộc dữ liệu |
| 6.7-6.9, 6.15 Selection-aware Vitals | Không phụ thuộc kỹ thuật cứng nào — chỉ chưa làm | Không chặn, chỉ chưa ưu tiên |
2.1.9.p ⭐ BOQ (gộp DUY NHẤT, Q6 28/07 — thay cho 4 chỗ cũ 2.1.5.c/2.1.9.k/2.2.29.f/2.0.10) | 2.1.9.i Vùng tô vật liệu (material-zone) CHƯA có field `matId` liên kết | Chặn cứng — `STATUS.md` xác nhận 0 dòng code |
| 2.3.16, 2.3.40, 2.3.57 Element bảng trong Present (3 nơi trùng) | `ElementKind` chưa có `'table'` | Chặn cứng |
| 2.3.11 PS-6 Comment khách trên slide | 2.3.10 PS-5 Share deck (cần route EditorDeck trước) | Chặn cứng |
| 7.4.4, 7.4.5 @nhắc tên, Việc của tôi | 7.4.1 Bình luận gắn đối tượng (model Comment chưa tồn tại) | Chặn cứng |

---

## BẢNG TỔNG 3 — "LÀM ĐƯỢC NGAY" (⬜ mà mọi phụ thuộc đã ✅, xếp rẻ×tác động)

| # | Mã | Tên | Vì sao rẻ | Tác động |
|---|---|---|---|---|
| 1 | 4.18 | Nối Gateway (`lib/gateway/route.ts`) vào `IOMenu.tsx` | Logic đã ✅ (NT2 xong), chỉ còn nối UI — nhưng **BỊ CHẶN bởi NT1** theo chính PLAN đã chốt, xem Bảng 2 | Cao — 1 nút "Mở tệp" thay toàn bộ danh sách định dạng cứng |
| 2 | 6.14 | Vitals §5 mục 2 — 3 nút gợi ý sẵn mỗi chặng (KHÔNG cần selection, chỉ cần biết `stage` — đã có) | Rẻ — chỉ cần bảng tĩnh 3 câu/chặng, không cần payload mới | Trung bình-cao — giảm "màn hình trắng không biết hỏi gì" |
| 3 | 2.2.9.a | Preview thẻ mức 1 — crossfade hover đúng nghĩa (hiện đang chia đôi ảnh tĩnh) | Rẻ — thuần CSS, ảnh before/after đã có sẵn cho 1 thẻ | Trung bình — dạy bằng kết quả đúng tinh thần spec |
| 4 | 7.3.24 | Empty state 2 nút mời gọi + tour (hệ onboarding đã có, chỉ cần đúng layout) | Rẻ — ghép lại UI có sẵn | Trung bình |
| 5 | 4.2 | Đặt tên file đọc được trong `/uploads` (không cần cây thư mục thật trước, chỉ đổi tên file lưu) | Rẻ — không cần 4.1 nếu chỉ đổi tên file phẳng | Trung bình — "mở Finder vẫn hiểu" |
| 6 | 3.21 | Thêm nguồn Pexels vào `StockPhotoPicker.tsx` (Unsplash/Openverse đã có, thiếu đúng 1 nguồn spec liệt kê) | Rất rẻ — thêm 1 provider theo pattern có sẵn | Thấp-trung bình |
| 7 | 1.3.1 | Đổi tên panel "AI mô tả — Đề bài chi tiết" → "Đề bài → Phương án" | Rất rẻ — đổi 1 chuỗi text | Thấp (rõ ràng hoá, không đổi hành vi) |
| 8 | 7.3.13 | Rail trái — nhãn chữ luôn hiện (sửa lỗi gốc #2, đã nằm trong `UI-SYSTEM-AUDIT.md`) | Rẻ — thêm label/tooltip delay ngắn cho icon có sẵn | Trung bình — chặn "phải đoán icon" |
| 9 | 2.2.11 | Kho thẻ — bộ lọc theo Chặng/Nhóm việc (6 thẻ hiện có đã đủ dữ liệu để lọc) | Rẻ — chỉ cần UI filter trên dữ liệu tĩnh đã có | Thấp (chỉ có 6 thẻ, lợi ích tăng khi kho thẻ lớn hơn — xem 2.2.15) |
| 10 | 4.6 | `.ifpack` tự backup định kỳ (hàm `buildIfpack()` đã có, chỉ cần `setInterval`/lịch) | Rẻ-trung bình — không cần hạ tầng cron phức tạp cho bản desktop | Cao — chống mất dữ liệu, đã ghi "Size: MEDIUM" ở `IF1-COMPLETION-AUDIT.md` §4 |

---

## CẦN HOÀ QUYẾT

> **CẬP NHẬT 28/07 — 6/7 mục đã QUYẾT** (KHÁM TRƯỚC, QUYẾT SAU — xem PHẦN E). Giữ nguyên số cũ để
> truy vết, đánh dấu ✅ QUYẾT + trỏ tới nơi ghi quyết định. Chỉ còn mục 6 CHƯA quyết.

1. ✅ **QUYẾT (VIỆC 1, khám `docs/AUDIT-EDITOR-TOOLKIT.md`)** — doc/code lệch ở Editor Toolkit
   Deck KHÔNG phải lệch nhị phân ✅/⬜ như agent trước ước lượng thô, mà là hỗn hợp theo từng món
   con (vd 2.3.30: bo góc+crop ✅, mask ⬜; 2.3.31: opacity ✅, gradient chỉ đủ cho chữ, overlay ⬜).
   Đã sửa chính xác vào từng dòng 2.3.29-2.3.43 ở trên, tham chiếu `docs/AUDIT-EDITOR-TOOLKIT.md`.

2. ✅ **QUYẾT (Q2a + Q2b, 28/07)**:
   - **Q2a — GIỮ `ChatPanel.tsx`.** Không phải vi phạm luật cấm chat-chung — luật đó nhắm "chat
     CHUNG kiểu Slack" (tán gẫu, không gắn ngữ cảnh), còn `ChatPanel` gắn theo dự án/flow đang mở.
     Đã sửa `SPEC-COLLABORATION.md` mục 1 ghi rõ ranh giới. Xem dòng 7.4.2 ở trên.
   - **Q2b — GIỮ `lib/server/auth.ts` tự viết.** Quyết định có chủ đích vì local-first (phụ thuộc
     Clerk/Auth0/Supabase/WorkOS = tự trói 1 điểm cloud bắt buộc ở lớp T0), không phải nợ kỹ thuật.
     Đã sửa `SPEC-PRODUCT-INFRA.md` mục 2, bỏ khuyến nghị cũ. Xem dòng 1.1.5 ở trên.

3. ✅ **QUYẾT (Q3, 28/07)** — đúng, NT5 và Pha-1 File Manager là MỘT việc (cây thư mục thật
   `~/InteriorFlow/Projects/...`). Giữ gộp làm 1 mục (4.1), không tách lại.

4. ✅ **QUYẾT (Q4, 28/07)** — giữ tên "Manager Center" cho khối 1. Brief-Intake (cũ 1.3.x) đã
   TÁCH sang khối **2.0 Ý tưởng** (mã mới 2.0.24-2.0.28) vì bản chất là đầu vào thiết kế, không
   phải "quản lý công việc" — xem ghi chú tại vị trí cũ 1.3 và mục 2.0 ở trên.

5. ✅ **QUYẾT (Q5, 28/07)** — DỜI HẲN "Video mức 2" (2.3.45-2.3.47) + "Film pre-pro"
   (2.3.48-2.3.52), đánh dấu `[v2]` trong cây. Lý do: Present bậc N mới ~44% (Bảng tổng 1), làm
   nhánh L (video/film) khi N chưa xong là VI PHẠM luật 1. Đóng băng tới khi Present N đạt ngưỡng
   đủ (chưa định số — quyết riêng khi tới lúc). Xem blockquote trước dòng 2.3.45 ở trên.

6. ✅ **QUYẾT (Q7, 28/07, qua Cowork)** — 2.2.16-2.2.21 (6B ba tool đắt nhất + 3 tool khác): **làm
   tiếp**, KHÔNG dời. Điều kiện đi kèm (Hoà đặt ra, đúng thứ tự Luật Đóng Băng #5 KHÁM→QUYẾT→SPEC→
   CODE — quyết "làm hay không" xong rồi, còn bước KHÁM vẫn phải làm trước khi sang SPEC/CODE):
   **trước khi code, phải review lại TOÀN BỘ tool của chặng Render** (không chỉ riêng 3 tool đắt
   nhất), nghiên cứu kỹ, để ra sản phẩm có chất lượng và hệ thống — không code vá từng tool rời rạc.
   Việc kế tiếp: 1 vòng KHÁM (audit toàn bộ `SPEC-RENDER-STUDIO.md` §6B đối chiếu code thật, giống
   cách đã làm với `AUDIT-EDITOR-TOOLKIT.md`) trước khi viết SPEC chi tiết cho 3 tool này.

7. ✅ **QUYẾT (Q6, 28/07)** — gộp BOQ (Bill of Quantity) thành MỘT sáng kiến duy nhất, mã
   `2.1.9.p`, gỡ 4 chỗ rải rác cũ (2.1.5.c/2.1.9.k/2.2.29.f/2.0.10 nay chỉ trỏ về đây). Mở khoá:
   matId trên MaterialDef/vùng hatch → tính m²×đơn giá+hao hụt → bảng BOQ xuất được → callout/
   legend Present tự đọc theo → (xa hơn) vật liệu mã+giá từ moodboard chặng Ý tưởng. Xem dòng
   2.1.9.p và Bảng tổng 2 ở trên.

---

## PHẦN E — LUẬT ĐÓNG BĂNG *(chốt 28/07, VIỆC 3)*

1. **Tính năng không có mã trong cây này → KHÔNG code.** Mọi task giao (cho Claude, cho Ben, cho
   agent bất kỳ) phải trỏ về đúng 1 mã (vd `2.3.30`) đã tồn tại trong `IF-MASTER-TREE.md`.
2. **Ý mới → `docs/IDEAS-BACKLOG.md`, KHÔNG chen vào cây.** Áp dụng cho cả Ben lẫn Hoà. Ý tưởng
   nảy ra giữa lúc làm việc khác không được gắn mã và code ngay — ghi vào backlog, chờ đến mốc
   mở rộng cây (luật 3).
3. **Cây chỉ mở rộng khi KẾT THÚC một pha**, không mở giữa chừng. Không thêm mục cấp 3/4 mới vào
   `IF-MASTER-TREE.md` khi đang giữa 1 sprint đang chạy.
   ⚠️ **Ngoại lệ khẩn cấp (thêm 28/07 — theo yêu cầu "flexible" của Hoà, thay cho bỏ hẳn luật này):**
   được mở giữa chừng CHỈ KHI (a) việc mới là blocker chặn ship thật (an toàn dữ liệu/pháp lý/bảo
   mật), hoặc (b) chi phí trễ tới hết pha lớn hơn hẳn chi phí phá nhịp. Khi rơi vào (a)/(b): **1
   người (Hoà) quyết trong 1 dòng log** — không họp, không sửa lại toàn cây, chỉ thêm 1 dòng mới
   gắn nhãn `[NGOẠI LỆ ĐIỀU 3 — khẩn cấp]` kèm lý do. Việc thường (không khẩn) vẫn chờ hết pha.
4. **Cột "Code" (Trạng thái thật trong CODE) là sự thật duy nhất.** Spec nói "đã xong" mà code
   chưa có thì vẫn ghi ⬜ — không nâng trạng thái theo lời spec hay lời báo cáo, phải tự verify.
5. ⭐ **THỨ TỰ BẮT BUỘC: KHÁM → QUYẾT → SPEC → CODE.** Không spec hoá từ mô tả suông — mọi spec
   mới phải dựa trên bằng chứng khám thật (file:dòng), mọi quyết định phải có trước khi sửa spec,
   mọi code phải có sau khi spec đã chốt. Ví dụ áp dụng đúng luật này: VIỆC 1/2/3 của phiên 28/07
   (khám `AUDIT-EDITOR-TOOLKIT.md` trước → Hoà quyết Q2a-Q6 → sửa `SPEC-COLLABORATION.md`/
   `SPEC-PRODUCT-INFRA.md` → chưa code gì, đúng thứ tự).

> **5 luật trên (28/07) giữ nguyên làm LỊCH SỬ, không xoá — nhưng đã lỗi thời một phần.** Đọc
> khối "v3, gộp 3 lần sửa" ngay dưới đây là ĐỦ, không cần dò lại luật nào ở trên còn hiệu lực.

# PHẦN E — Luật vận hành, trạng thái hiện tại (v3, gộp 3 lần sửa cùng ngày 29/07/2026)

> Bản GỘP thay cho việc phải đọc 3 file rời (bãi bỏ → sửa lại giữ #4/#5 → thêm #6/#7). Dán đè
> nguyên khối này vào `docs/IF-FEATURE-TREE.md` PHẦN E, giữ nguyên 5 luật gốc (28/07) bên trên làm
> lịch sử, không xoá — khối này là bản cập nhật mới nhất, đọc khối này là đủ.

---

## Trạng thái từng luật

1. ~~Mã bắt buộc trước khi code~~ — **BÃI BỎ** (29/07).
2. ~~Ý mới phải qua `IDEAS-BACKLOG.md` trước~~ — **BÃI BỎ** (29/07).
3. ~~Cây chỉ mở rộng khi hết pha~~ — **BÃI BỎ** (29/07).
4. **Cột "Code" là sự thật duy nhất** — **GIỮ, LUẬT CỨNG.** Mọi trạng thái "đã xong" phải đối
   chiếu code thật (`file:dòng`), không tin lời spec/báo cáo cũ.
5. **Thứ tự: KHÁM → TƯ VẤN → SPEC → CODE** — **GIỮ, đã đổi "QUYẾT" → "TƯ VẤN"** (29/07). Vẫn khám
   code thật trước, vẫn có bước tư vấn hướng đi trước khi viết SPEC — nhưng không còn là cổng chặn
   cứng bắt Hoà phải ra quyết định bằng lời rồi mới đi tiếp.

## Luật MỚI thêm 29/07 — áp dụng vào đúng bước TƯ VẤN của luật #5

**6 · Luật Đồng Bộ** — trong bước TƯ VẤN, nếu tính năng đang bàn **gần giống**, hoặc **là hệ quả/
tiền đề của nhau** với 1 tính năng đã có (hoặc đang bàn song song) → PHẢI chủ động đề xuất GỘP
cho Hoà, không để 2 tính năng gần nhau tồn tại rời rạc, tách biệt. Đúng tinh thần "gộp gia phả"
Hoà đã yêu cầu nhiều lần trong nhật ký (mục 43: "ko bỏ, đề xuất gộp gia phả — mạnh hơn") — không
cắt bớt tính năng, mà hệ thống hoá cho gọn.

**7 · Luật đọc ảnh — 2 lớp giá trị** — khi Hoà gửi ảnh tham khảo, bước TƯ VẤN phải tách rõ:

| Lớp | Hỏi gì | Ví dụ |
|---|---|---|
| (a) Giá trị TÍNH NĂNG | Ảnh gợi ý CHỨC NĂNG/LUỒNG làm việc nào? | Ảnh ArcSite → gợi ý luồng vẽ tường+kéo thả cửa+bảng dimension |
| (b) Giá trị GIAO DIỆN | Ảnh gợi ý PHONG CÁCH/BỐ CỤC/THẨM MỸ nào? | Ảnh ArcSite → toolbar dày đặc icon, không phải phong cách tối giản IF đang theo |

Rồi phải tư vấn rõ 2 câu riêng: **NÊN LẤY gì** cho IF/IDF (khớp bản sắc, khớp bậc N/P/L đang làm),
**NÊN TRÁNH gì** (không hợp bản sắc IF — vd tím `#6a57f5`/nhịp Apple đã chốt, khác hẳn phong cách
ảnh tham khảo; hoặc IF đã có cách làm tốt hơn; hoặc thuộc sản phẩm khác không nên bắt chước máy
móc). Không gộp chung 2 lớp thành 1 nhận định mơ hồ kiểu "giống ArcSite" — phải tách rõ lấy tính
năng hay lấy giao diện, hay cả hai, hay không cái nào.

---

*Cowork, 29/07/2026. Nếu hiểu sai phần nào trong yêu cầu gốc (đặc biệt đoạn "LUẬT ĐỘC ẢNH USES
GỬI"), Hoà sửa lại — đây là diễn giải tốt nhất của Cowork từ câu gõ nhanh.*

---

## Luật MỚI thêm 29/07 (đợt 2, `docs/SPEC-TONG-COWORK-2026-07-29.md` §2) — 8a/8b/9

**8a · Checklist 6 bước = định nghĩa "xong"** — **BÀN → APPROVE → CODE → XÁC NHẬN → COMMIT → GIT.**
Thiếu bước nào thì ghi 🟡 trong cột trạng thái, **không được ghi ✅**. Áp cho mọi dòng trong
`IF-FEATURE-TREE.md` từ nay — kể cả dòng đã ghi ✅ trước 29/07, nếu soát lại thiếu bước nào (vd
CODE xong nhưng chưa COMMIT/GIT) thì hạ xuống 🟡 khi phát hiện, không giữ ✅ theo quán tính.

**8b · Luật xếp hàng gia phả** — mỗi tính năng mới khi đưa vào cây: ① gắn mã đúng khối (theo cấu
trúc 4 cấp đã có, KHÔNG tự chế quy ước số mới — xem cảnh báo trùng mã bên dưới) ② **kiểm tra phụ
thuộc** — làm sớm có phải đập đi làm lại không (đối chiếu Bảng Tổng 2 — cây phụ thuộc) ③ xếp vào
đúng sprint theo độ ưu tiên; **SPEC và CODE được phép ở 2 sprint khác nhau** (viết SPEC trước,
CODE sau, không bắt buộc làm liền tay).

**9 · Luật ≥300 dpi** — mọi sản phẩm **giao khách hoặc in** phải đạt ≥300dpi ở khổ đích: A3
≥4961×3508 · A4 ≥3508×2480 · A5 ≥2480×1754. Sản phẩm chỉ xem màn hình (16:9) được miễn **nhưng
phải ghi nhãn "độ phân giải màn hình"**. Nút xuất phải **hiện dpi thật** của kết quả; không đạt
ngưỡng thì **không im lặng xuất bừa, cũng không khoá cứng chặn xuất** — báo đúng con số và mời
người dùng nâng cấp (vd chạy `ai.upscale`) trước khi quyết định xuất hay không.

> ✅ **CẢNH BÁO TRÙNG/LỆCH MÃ — ĐÃ GIẢI QUYẾT (29/07, `docs/CHOT-SO-MA-2026-07-29.md`).** Claude
> Code phát hiện 2 điểm lệch khi đối chiếu `SPEC-TONG-COWORK-2026-07-29.md` với cây này (đúng luật
> "kiểm tra trùng mã trước khi dán"); Cowork xác nhận cả 2 là lỗi đặt số của Cowork, đã chốt số mới
> và Claude Code đã dán vào đúng vị trí:
> 1. `3.30`/`3.31` (trùng `3.30.a/b/c` NT1) → đổi thành **`3.31`/`3.32`** (dòng ngay trên, khối 3).
> 2. `7.20`-`7.27` (lệch quy ước 4 cấp) → đổi thành **`7.1.18`, `7.3.27`-`7.3.29`, `7.4.11`-`7.4.13`**
>    (đã dán vào đúng nhóm trong khối 7). Riêng `7.25` (Ghim góp ý) **không cần mã mới** — phát
>    hiện thêm: đã có sẵn `7.4.1`+`7.4.3`+`7.4.6` với spec gốc, chỉ chưa xây (xem ghi chú ở khối
>    7.4). `2.2.60`-`2.2.85`/`2.3.58`-`2.3.63` xác nhận không trùng — **ĐÃ DÁN vào cây 30/07** (xem
>    khối 2.2 Render mục "2.2.60-2.2.85" và khối 2.3 Present mục "2.3.58-2.3.63"), gồm cả `2.2.85`
>    (bổ sung, từ `docs/TICKET-FONT-MONO-NODE-2026-07-29.md`, không có trong `SPEC-TONG` gốc). Loại
>    trừ có chủ đích khỏi đợt dán: `2.2.62`-`2.2.64`, `2.2.73`-`2.2.74` (ngoài phạm vi yêu cầu 30/07).

## Luật MỚI thêm 30/07 — 10/11

**10 · Luật tiêu chuẩn nghề — không hỏi** (Hoà chốt 30/07, khi sửa va chạm `CadTouchDock`):
Thứ thuộc TIÊU CHUẨN nghề (ISO · TCVN · Apple HIG · WCAG · chuẩn responsive phổ thông…) thì TRA
CHUẨN rồi LÀM ĐÚNG CHUẨN — KHÔNG HỎI. Chỉ hỏi khi là quyết định SẢN PHẨM (làm hay không, thứ tự
ưu tiên, đánh đổi). Đã áp dụng: khổ giấy ISO 216/5457 (`2.1.8.m`), thang ưu tiên nhường chỗ
PatternFly priority+ (`7.3.31` phần vá cuối), hệ ngưỡng breakpoint (`7.1.20`, luật 11 dưới đây).

**11 · Luật ngưỡng màn hình DUY NHẤT** (`7.1.20`, 30/07) — mọi ngưỡng bề rộng responsive trong JS
PHẢI đọc từ `lib/breakpoints.ts` (hằng `BP`), KHÔNG tự viết số px rời. CSS thuần (không import
được JS) giữ số khớp tay với `BP`, ghi rõ trong comment tại chỗ dùng. 4 dải chính thức: <640 điện
thoại · 640–1023 tablet 8-11" · 1024–1279 laptop 13"/cửa sổ không full (ngân sách bề rộng CHẶT) ·
≥1280 desktop đầy đủ.

**Giao thức VERIFY responsive — áp cho MỌI ticket giao diện từ 30/07, không riêng ticket phát
sinh luật này**: đo bằng số ở ĐỦ 5 mốc — **640 · 768 · 1024 · 1180 · 1440**. **1180 BẮT BUỘC** —
bề rộng Hoà THẬT SỰ chạy hàng ngày (cửa sổ không full trên MacBook), nằm giữa `lg`(1024) và
`xl`(1280), đúng dải "ngân sách bề rộng CHẶT" nơi loạt lỗi layout gần đây lộ ra
(`docs/VERIFY-7.3.31.md` — overlap 1024px vá xong nhưng đợt đầu chỉ đo 1024/1183/1440, không có
1180 chính thức trong luật lúc đó). Test riêng ở 1024/1440 KHÔNG bắt được lỗi ở dải giữa.

---

*v1.4 · 2026-07-29 (Cowork, dán theo yêu cầu Hoà) · PHẦN E gộp bản v3: luật 1-3 (28/07) BÃI BỎ,
luật 4-5 GIỮ (luật 5 đổi "QUYẾT"→"TƯ VẤN" — bỏ cổng chặn cứng bắt Hoà ra quyết định bằng lời),
thêm luật 6 (Đồng Bộ — chủ động đề xuất gộp tính năng gần nhau/hệ quả của nhau) và luật 7 (đọc
ảnh tham khảo phải tách 2 lớp giá trị: tính năng vs giao diện, nói rõ nên lấy gì/tránh gì). 5 luật
gốc 28/07 giữ nguyên bên trên làm lịch sử, không xoá.*
*v1.3 · 2026-07-28 (Cowork) · File đổi tên thành `IF-FEATURE-TREE.md` (thay `IF-MASTER-TREE.md` —
hết trùng chữ "MASTER" với file kiến trúc, nay đổi tên `IF-ARCHITECTURE-COMPASS.md`). Đồng thời:
(1) mục 7.2.3 đổi KIÊN → TRỤ, khớp quyết định đổi tên persona (xem `QUY_TRINH_SPIRAL_v1.md` mục 5).
(2) CẦN HOÀ QUYẾT #6 đã chốt (Q7) — làm tiếp 3 tool đắt nhất, nhưng phải KHÁM (review toàn bộ tool
Render + nghiên cứu kỹ) trước khi SPEC/CODE, đúng luật E5.*
*v1.2 · 2026-07-28 (Cowork) · Hoà duyệt "tiến hành" sau audit doc-sprawl: (1) thêm ngoại lệ khẩn
cấp vào luật E3 — thay cho phương án bỏ hẳn "Luật Đóng Băng", giữ 4/5 luật nguyên vẹn (đã đánh giá
tốt, không sửa) + làm linh hoạt đúng 1 điều cứng nhất. (2) `IF-MASTER-BLUEPRINT.md` đã gỡ Phần C
(cây tính năng trùng mã) và Phần E (Luật Đóng Băng trùng nội dung) — từ nay **file này là nguồn
DUY NHẤT** cho trạng thái tính năng + Luật Đóng Băng, Blueprint chỉ trỏ sang đây. Xem
`docs/HANDOFF-COWORK-2026-07-28.md` để biết đầy đủ lý do + việc còn lại cần Claude Code làm.*
*v1.1 · 2026-07-28 tối · VIỆC 1/2/3: khám editor toolkit (`docs/AUDIT-EDITOR-TOOLKIT.md`) → sửa
chính xác dòng 2.3.29-2.3.43 · ghi quyết Q2a-Q6 (chat/auth/NT5/Manager Center/video-film/BOQ) ·
cập nhật CẦN HOÀ QUYẾT (6/7 đã quyết, 1 còn mở) · thêm PHẦN E Luật Đóng Băng. Theo đúng thứ tự
KHÁM → QUYẾT → SPEC → CODE (luật E5) — phiên này dừng ở SPEC, chưa code.*
*v1.0 · 2026-07-28 · Tổng hợp từ 22 file spec (18 `SPEC-*.md` + `IF-ARCHITECTURE-BLUEPRINT-v1.md`
+ `IF-FEATURE-SPEC-P1-v2.md` + `IF-PRESENT-SPRINT-PLAN.md` + `IF1-COMPLETION-AUDIT.md`) +
`docs/PLAN-LIBRARY-GATEWAY.md`, do Claude tổng hợp qua 6 agent song song đọc toàn văn + tự grep/
đọc code xác minh, cộng 3 file đọc trực tiếp (blueprint/feature-spec/completion-audit). KHÔNG
thêm tính năng mới ngoài những gì đã spec.*
