# docs/ — Mục lục

> File này là điểm bắt đầu khi cần tra tài liệu trong `docs/`. **Đã phân loại đầy đủ**
> (79 file `.md` trong `docs/` + `docs/archive/`, mỗi file gắn 1 trong 4 nhóm bên dưới).

## Chú giải nhóm
- 🟢 **ĐANG HIỆU LỰC** — nguồn tham chiếu đúng hiện tại, dùng được ngay.
- 🔵 **THAM CHIẾU** — nền tảng/audit lịch sử, vẫn đúng nhưng không phải nơi sửa đổi.
- 🟡 **ĐỀ XUẤT CHƯA DUYỆT** — bản nháp/proposal, cần Hoà duyệt trước khi build theo.
- 🔴 **LỖI THỜI** — không còn đúng, giữ làm lịch sử trong `docs/archive/`.

## 🟢 ĐANG HIỆU LỰC

| File | Ghi chú |
|---|---|
| [`IF-FEATURE-SPEC-P1-v2.md`](IF-FEATURE-SPEC-P1-v2.md) | **Spec canonical** — 101 item, đối soát mã nguồn 17/07. Dùng file này khi được giao build tính năng mới. |
| [`IF-FEATURE-UPGRADES.md`](IF-FEATURE-UPGRADES.md) | Nâng cấp tính năng đã có (Basic→Pro→Elite). Đọc khi được giao nâng cấp tính năng cũ. |
| [`IF-PRESENT-SPRINT-PLAN.md`](IF-PRESENT-SPRINT-PLAN.md) | Lộ trình PS-0…PS-11 cho chặng Present — sprint nào đã xong, sprint nào còn mở. |
| [`IF-ARCHITECTURE-BLUEPRINT-v1.md`](IF-ARCHITECTURE-BLUEPRINT-v1.md) | Hiến pháp kiến trúc — lưới phân loại N/P/L, đứng trên mọi spec/sprint plan. |
| [`IF-CORE-SCHEMA.md`](IF-CORE-SCHEMA.md) | Chi tiết kỹ thuật T1 — schema Prisma, quy ước ID, mô hình local-first. |
| [`IF1_IF2_BIGPICTURE.md`](IF1_IF2_BIGPICTURE.md) | Roadmap tổng IF1/IF2. |
| [`APP-MAP.md`](APP-MAP.md) | Bản đồ ứng dụng — route tree, API map, 3-stage handoff (đọc code, không phải kế hoạch). |
| [`IF1-COMPLETION-AUDIT.md`](IF1-COMPLETION-AUDIT.md) | Đối soát mã nguồn thật 26/07 (file:line) — sửa lại các nhãn ✅ sai trong spec/sprint-plan ngày 17/07. Nguồn đúng nhất hiện tại cho trạng thái "đã xong tới đâu". |
| [`CONTENT-RULES.md`](CONTENT-RULES.md) | Luật phân biệt nội dung APP/DEMO/DỰ ÁN — bắt buộc mọi người/agent thêm nội dung phải theo. |
| [`BUILD-WINDOWS.md`](BUILD-WINDOWS.md) | Hướng dẫn build bộ cài `.exe` trên Windows — khớp mô hình phát hành hiện hành (desktop Windows+macOS Pha 1). |
| [`CAD-STANDARDS.md`](CAD-STANDARDS.md) | Kiến trúc data-driven của bộ quy chuẩn TCVN/QCVN/ISO/NFPA — đọc trước khi thêm rule mới. |
| [`CAD-LT.md`](CAD-LT.md) | Bảng tiến độ "tương đương AutoCAD LT" — chi tiết đầy đủ, cập nhật nhất cho TRIM/FILLET/DIMENSION/HATCH (dẫn chiếu từ `CAD-ROADMAP.md`). |
| [`CAD-ROADMAP.md`](CAD-ROADMAP.md) | Phạm vi & roadmap chặng CAD `/cad-editor` — ranh giới với app EFC (CAD chuyên nghiệp tách rời). |
| [`TECHNICAL_GLOSSARY.md`](TECHNICAL_GLOSSARY.md) | Từ điển thuật ngữ kỹ thuật dùng trong code/docs — tra khi gặp thuật ngữ lạ. |
| [`FIGMA-HANDOFF.md`](FIGMA-HANDOFF.md) | Design token THẬT đang chạy (xuất 25/07 từ code) — dùng để dựng Design System/Figma. |
| [`DESIGN-TOKENS.md`](DESIGN-TOKENS.md) | Audit MỨC ĐỘ TUÂN THỦ token (27/07) — khác `FIGMA-HANDOFF.md` (khai báo token): file này đo bao nhiêu chỗ code THẬT SỰ dùng token vs bypass bằng hex/Tailwind rời rạc. ~190 màu chrome sống (mục tiêu 9), font-size 0% qua token, 2 hệ font song song. |
| [`RESEARCH-DWG-LICENSE.md`](RESEARCH-DWG-LICENSE.md) | Phân tích kỹ thuật đường ra cho nghĩa vụ GPL-3.0 của thư viện đọc DWG — nguồn hiện hành thay cho `LICENSE-NOTES.md` (đã lỗi thời). |
| [`INDEX-AI-SPECS.md`](INDEX-AI-SPECS.md) | Chỉ mục lọc mọi tài liệu spec AI rải rác trong repo theo nhóm + trạng thái. |
| [`INTEGRATIONS.md`](INTEGRATIONS.md) | Kiến trúc tầng tích hợp dịch vụ ngoài (OAuth, adapter) + trạng thái từng provider — đọc khi thêm provider mới. |

## 🔵 THAM CHIẾU

| File | Ghi chú |
|---|---|
| [`IF-FEATURE-SPEC-P1.md`](IF-FEATURE-SPEC-P1.md) | Bản cũ của spec Phase 1 — **superseded bởi `IF-FEATURE-SPEC-P1-v2.md`**, giữ làm lịch sử, không dùng để tra trạng thái. |
| [`ARCHITECT-REVIEW.md`](ARCHITECT-REVIEW.md) | Duyệt thiết kế UI thao tác nội bộ 3 chặng (18/07) đối chiếu TTT DS theo tinh thần, không hex cứng. |
| [`AUDIT-BRAND-PII.md`](AUDIT-BRAND-PII.md) | Audit thương hiệu/PII còn sót trong repo (25/07) — báo cáo, không sửa code. |
| [`AUDIT-GESTURES-INPUT.md`](AUDIT-GESTURES-INPUT.md) | Audit cử chỉ/input (chuột·phím·trackpad·cảm ứng) toàn app, 21/07. |
| [`CAD-AI-MECHANISM.md`](CAD-AI-MECHANISM.md) | Nghiên cứu + thiết kế cơ chế "AI mô tả" CAD (11/07). |
| [`CAD-LIBRARY.md`](CAD-LIBRARY.md) | Thư viện block CAD (DXF) độc lập — nguồn dữ liệu & bản quyền. |
| [`CATALOG-STAGE2-RENDERING.md`](CATALOG-STAGE2-RENDERING.md) | Catalog tính năng chặng Rendering (24/07) — lưu ý: có sai sót đã ghi nhận (node ma) trong STATUS.md Nợ kỹ thuật. |
| [`CLOUD-webgpu-pipeline.md`](CLOUD-webgpu-pipeline.md) | Prompt tự-đủ giao việc build pipeline SD WebGPU song song, cô lập. |
| [`DEMO-DWG-FLATTEN.md`](DEMO-DWG-FLATTEN.md) | Verify kết quả DWG block-flatten (24/07), 2 file dự án thật. |
| [`DEMO-DWG-IMPORT.md`](DEMO-DWG-IMPORT.md) | Verify import DWG (24/07) — pipeline chạy thật, render đúng. |
| [`FINAL_ARCHITECTURE_REPORT.md`](FINAL_ARCHITECTURE_REPORT.md) | Báo cáo kiến trúc Sprint 4 (14/07) — lưu ý phần mở đầu gọi IF là "app nội bộ TTT Architects", framing này đã lỗi thời theo LUẬT NỀN TẢNG 24/07 dù nội dung kỹ thuật còn giá trị tham khảo. |
| [`GAP-COLOR-FILL.md`](GAP-COLOR-FILL.md) | Điều tra gap tô mặt bằng "Mapa de Zonas" (24/07) — kết luận NEEDS-UPGRADE. |
| [`GU-PROFILE.md`](GU-PROFILE.md) | DNA thẩm mỹ Hoà học từ Pinterest (11/07) — dữ liệu nền cho Gu Engine. |
| [`HANDOFF-BRIEF.md`](HANDOFF-BRIEF.md) | Brief tư vấn tự-đủ mang sang Claude Project khác (05/07). |
| [`HANDOFF-gop-y-redesign.md`](HANDOFF-gop-y-redesign.md) | Handoff thiết kế lại tính năng "Góp ý" (11/07). |
| [`HUONG-DAN-SU-DUNG.md`](HUONG-DAN-SU-DUNG.md) | Hướng dẫn dùng app cho người không kỹ thuật (14/07) — lưu ý đề "team TTT", framing cũ trước LUẬT NỀN TẢNG. |
| [`IMAGE-SOURCES.md`](IMAGE-SOURCES.md) | Nguồn ảnh dùng được/không dùng được — chốt 25/07. |
| [`LOGIC-AUDIT.md`](LOGIC-AUDIT.md) | Rà soát logic 3 chặng (12/07) — chỉ báo cáo. |
| [`MASTERPLAN-IF-ARCHINOTE.md`](MASTERPLAN-IF-ARCHINOTE.md) | Masterplan hệ sinh thái IF1→IF2 + Archinote (24/07). |
| [`MOODBOARD-STYLE-REFERENCES.md`](MOODBOARD-STYLE-REFERENCES.md) | Tham chiếu gu cho tính năng Moodboard (Phase 2/3 Project Notebook, chưa build). |
| [`MULTI-SHEET-PROPOSAL.md`](MULTI-SHEET-PROPOSAL.md) | Kiến trúc multi-sheet — Pha 1 đã implement, §6 (tear-off/split) để Pha 2. |
| [`PLAN-oneAI-and-nodes.md`](PLAN-oneAI-and-nodes.md) | Kế hoạch oneAI + mở rộng node (05/07) — hợp đồng phân việc song song thời điểm đó. |
| [`PROMPT-MIA-material-tags.md`](PROMPT-MIA-material-tags.md) | Prompt giao việc Material Tag cho Mia (04/07). |
| [`PROMPT-MIA-ui-polish.md`](PROMPT-MIA-ui-polish.md) | Prompt giao việc polish giao diện cho Mia. |
| [`QA-SWEEP-REPORT.md`](QA-SWEEP-REPORT.md) | QA sweep toàn app trước tinh chỉnh UI (11/07) — chỉ báo cáo. |
| [`REFERENCE-QA-AND-GU-ML.md`](REFERENCE-QA-AND-GU-ML.md) | QA thư viện Reference + thiết kế Gu ML Engine (11/07). |
| [`RENDER-NODES.md`](RENDER-NODES.md) | Log node mới + hệ tag + Sketch Studio, branch `feat/render-nodes-ux`. |
| [`RESEARCH-CAD-EXPORT-PLOT.md`](RESEARCH-CAD-EXPORT-PLOT.md) | Audit + đề xuất hệ thống xuất CAD (PNG trong suốt, hộp thoại PLOT) — docs-only. |
| [`RESEARCH-COMFYUI-LESS.md`](RESEARCH-COMFYUI-LESS.md) | Nghiên cứu chạy app không cần ComfyUI local (20/07). |
| [`RESEARCH-MIRO-COMPARISON.md`](RESEARCH-MIRO-COMPARISON.md) | Research Miro + đề xuất cho IF (23/07). |
| [`RESEARCH-MOBILE-DISTRIBUTION.md`](RESEARCH-MOBILE-DISTRIBUTION.md) | Nghiên cứu phân phối 4 nền tảng (20/07) — phần chính sách store vẫn hiệu lực (xác nhận trong `RESEARCH-INSTALLER-4-PLATFORMS.md`). |
| [`SHAPE-SCHEMA.md`](SHAPE-SCHEMA.md) | Hợp đồng dữ liệu Shape Library, Sprint 3 (B1+B2). |
| [`STRATEGY-ai-tiers-and-safety.md`](STRATEGY-ai-tiers-and-safety.md) | Chiến lược mức phụ thuộc AI + an toàn (04/07) — nguyên tắc nền vẫn còn giá trị. |
| [`STRATEGY-competitive-and-unification.md`](STRATEGY-competitive-and-unification.md) | Feature map + so sánh đối thủ + hợp nhất app (05/07). |
| [`UX-AUDIT-HABITS.md`](UX-AUDIT-HABITS.md) | Audit UX theo thói quen phần mềm chuyên dụng, 3 persona (11/07). |

## 🟡 ĐỀ XUẤT CHƯA DUYỆT

| File | Ghi chú |
|---|---|
| [`ML-GU-ENGINE-PROPOSAL.md`](ML-GU-ENGINE-PROPOSAL.md) | Đề xuất ML "Gu Engine" 3 chặng — chưa được phép implement. |
| [`PROPOSAL-LEGEND-SYSTEM.md`](PROPOSAL-LEGEND-SYSTEM.md) | Đề xuất hệ Legend 4 chặng (chú giải/catalog/spec có cấu trúc) — docs-only. |
| [`RESEARCH-ACCESS-CONTROL.md`](RESEARCH-ACCESS-CONTROL.md) | Nghiên cứu phân quyền & cộng tác nhóm — đề xuất, chưa thực thi. |
| [`RESEARCH-CHAT-FULL.md`](RESEARCH-CHAT-FULL.md) | Nghiên cứu Chat Full 3 loại kênh + Supabase Realtime — đề xuất, chưa thực thi. |
| [`RESEARCH-HOME-GALLERY-DASHBOARD.md`](RESEARCH-HOME-GALLERY-DASHBOARD.md) | Nghiên cứu trang Home (Gallery+Dashboard) từ Larkbase — đề xuất, chưa thực thi. |
| [`RESEARCH-INSTALLER-4-PLATFORMS.md`](RESEARCH-INSTALLER-4-PLATFORMS.md) | Kế hoạch 4 bộ cài (đã thu hẹp Windows+macOS) — chờ user duyệt trước khi phóng Sprint build. |
| [`RESEARCH-LIBRARY-UPGRADE.md`](RESEARCH-LIBRARY-UPGRADE.md) | Nâng cấp Thư viện (taxonomy đa tầng, auto-classify) — đề xuất, chưa thực thi. |
| [`RESEARCH-MATERIAL-BRIDGE.md`](RESEARCH-MATERIAL-BRIDGE.md) | Cầu nối Vật liệu Larkbase↔Hatch CAD↔Rendering — đề xuất, chưa thực thi. |
| [`RESEARCH-OFFICE-FILE-INTEROP.md`](RESEARCH-OFFICE-FILE-INTEROP.md) | Mở file Office thật (PPTX/Keynote/Word) + Excel — đề xuất, chưa thực thi. |
| [`RESEARCH-TEAM-COLLABORATION.md`](RESEARCH-TEAM-COLLABORATION.md) | Cộng tác nhóm — comment bất đồng bộ & real-time — đề xuất, chưa thực thi. |
| [`RESEARCH-TECHNICAL-DRAWING-PIPELINE.md`](RESEARCH-TECHNICAL-DRAWING-PIPELINE.md) | Dàn trang bản vẽ kỹ thuật + cầu nối CAD→Presenting — đề xuất, chưa thực thi. |
| [`SPEC-ARCHINOTE-IF-BOUNDARY.md`](SPEC-ARCHINOTE-IF-BOUNDARY.md) | Ranh giới ArchiNote ↔ InteriorFlow — ✅ duyệt 01/08/2026 (CHOT-DUYET-SPEC ·-DOT2). |
| [`SPEC-BRIEF-INTAKE.md`](SPEC-BRIEF-INTAKE.md) | Đề bài → Phương án (brief intake) + chuẩn vận hành thương hiệu (Accor/Marriott…) — ✅ duyệt 01/08/2026 (CHOT-DUYET-SPEC ·-DOT2). |
| [`SPEC-CAD-MODES.md`](SPEC-CAD-MODES.md) | CAD hai chế độ (Sketch↔Pro) — ✅ duyệt 01/08/2026 (CHOT-DUYET-SPEC ·-DOT2). |
| [`SPEC-COLLABORATION.md`](SPEC-COLLABORATION.md) | Cộng tác nhóm (bình luận ngữ cảnh) — ✅ duyệt 01/08/2026 (CHOT-DUYET-SPEC ·-DOT2). |
| [`SPEC-EDITOR-TOOLKIT.md`](SPEC-EDITOR-TOOLKIT.md) | Bộ công cụ editor (deck·graphic·photo·video) — ✅ duyệt 01/08/2026 (CHOT-DUYET-SPEC ·-DOT2). |
| [`SPEC-FILE-MANAGER.md`](SPEC-FILE-MANAGER.md) | File Manager toàn app — ✅ duyệt 01/08/2026 (CHOT-DUYET-SPEC ·-DOT2). |
| [`SPEC-IF-LIBRARY.md`](SPEC-IF-LIBRARY.md) | IF Library (siêu thư viện tài sản/DAM) — ✅ duyệt 01/08/2026 (CHOT-DUYET-SPEC ·-DOT2). |
| [`SPEC-KNOWLEDGE-BASE.md`](SPEC-KNOWLEDGE-BASE.md) | Kệ sách & tri thức (T5) — ✅ duyệt 01/08/2026 (CHOT-DUYET-SPEC ·-DOT2). |
| [`SPEC-MATERIAL-PIPELINE.md`](SPEC-MATERIAL-PIPELINE.md) | Chuỗi vật liệu — ✅ duyệt 01/08/2026 (CHOT-DUYET-SPEC ·-DOT2). |
| [`SPEC-PRESENT-FLOW.md`](SPEC-PRESENT-FLOW.md) | Present Flow & Video (chặng 3) — ✅ duyệt 01/08/2026 (CHOT-DUYET-SPEC ·-DOT2). |
| [`SPEC-PRODUCT-INFRA.md`](SPEC-PRODUCT-INFRA.md) | Hạ tầng sản phẩm — ✅ duyệt 01/08/2026 (CHOT-DUYET-SPEC ·-DOT2). |
| [`SPEC-RENDER-STUDIO.md`](SPEC-RENDER-STUDIO.md) | Render Studio (canvas+node+template) — ✅ duyệt 01/08/2026 (CHOT-DUYET-SPEC ·-DOT2). |
| [`SPEC-SEMANTIC-MODEL.md`](SPEC-SEMANTIC-MODEL.md) | Mô hình ngữ nghĩa 2D (BIM-lite) — ✅ duyệt 01/08/2026 (CHOT-DUYET-SPEC ·-DOT2). |
| [`SPEC-STAGE-0-IDEATION.md`](SPEC-STAGE-0-IDEATION.md) | CHẶNG 0 · Ý tưởng & moodboard — chặng mới phát hiện thiếu 26/07 — ✅ duyệt 01/08/2026 (CHOT-DUYET-SPEC ·-DOT2). |
| [`SPEC-UI-SHELL.md`](SPEC-UI-SHELL.md) | Khung giao diện chung — ✅ duyệt 01/08/2026 (CHOT-DUYET-SPEC ·-DOT2). |
| [`SPEC-VITALS-AI.md`](SPEC-VITALS-AI.md) | Vitals AI — trợ lý AI trong IF — DRAFT v0.1 — vai trò ✅ duyệt 01/08, cơ chế còn draft. |

## 🔴 LỖI THỜI (`docs/archive/`)

| File | Lý do lỗi thời |
|---|---|
| [`archive/LICENSE-NOTES.md`](archive/LICENSE-NOTES.md) | Tự khai "đã hết hiệu lực" (25/07) — miễn trừ GPL-3.0 dựa trên "tool nội bộ, không bán" chết theo định vị global. Xem `RESEARCH-DWG-LICENSE.md`. |
| [`archive/DEPLOY-VERCEL.md`](archive/DEPLOY-VERCEL.md) | Giả định mô hình cloud SaaS (Postgres/Supabase) — bị `IF-CORE-SCHEMA.md` §1D ghi đè bằng quyết định local-first (SQLite, Windows+macOS Pha 1, không cloud). Cùng nhóm với `DEPLOY-CHECKLIST.md` ở root (đã DEPRECATED sẵn). |

## Ghi chú
- 8 file `.md` khác nằm ngoài `docs/` (vd `DEPLOY-CHECKLIST.md` ở root) không thuộc phạm vi mục lục này.
- Phân loại dựa trên bằng chứng thật trong từng file (header + `git log` + cross-reference `grep`), không đoán theo tuổi file — file cũ mà nội dung vẫn đúng thì ở 🔵, không tự động rớt xuống 🔴.
