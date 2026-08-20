# BÀN GIAO UX/UI · EXPERIENCE SYSTEM — 20/08/2026 (session EXS dừng theo lệnh Hoà)

> Session kế đọc file này + `docs/IF-MOTION-VISUAL-LAW.md` + `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md`
> là đủ ngữ cảnh design. Claude Design project: `b7dc14ba-1752-4821-8fc7-d519f737ac09`, nhóm "Experience System".

## 1 · CANONICAL RULES (đọc, không bàn lại)
- **Geometry**: rect→rounded(chủ đạo)→capsule(compact action)→circle(point/person/status) · token bo `--r-1..4 = 6/10/14/20` + `--r-full` · nested đồng tâm `rInner=rOuter−pad` · from-the-center · morph giữ identity · icon container theo rule → `SPEC-DESIGN-SYSTEM-IF.md §7` + board EXS-L.
- **Sidebar 3 CỤM** (Workspace chung · ba chặng · cá nhân) — vertical islands, 7–9 đích. ĐÈ bản hai-cụm. Code rail 52px ĐÃ SỐNG (`3e1dde3`).
- **Rail 52–56 → Shelf 220–280 → Work Panel 320–440** = ba câu hỏi (đi đâu / có gì / chỉnh sâu), không phải ba cỡ.
- **Spotlight 1 Primary + 1 Secondary** mỗi surface; mọi thứ đều nổi = FAIL.
- **Vitals Aperture** top-edge, Ambient→Peek→Engage, engage MỞ TỪ CHÍNH aperture (đã resolve V3), biết im; voice có transcript + human confirm.
- **Context Intelligence Stack** (phải): 5 lens Selection/Vitals/History/Review/Output · Peek→Inspect→Deep · truth Measured/Verified/Inferred/External/Stale · Go-to-Source · Where-Used · Blast Radius.
- **Master/Compound Capability**: không đổi theo stage, chỉ đổi representation (near-pointer→toolbelt→shelf→inspector→ToolWindow), cùng icon/phím/tên; **Adaptive Toolbelt = working set 4–8**, mờ-kèm-lý-do, quá thì "…".
- **Motion/depth**: nhịp 100-160/140-200/180-260/240-380/300-700ms · depth L0–L4 càng cao càng tạm · 7 verb REVEAL/EXPAND/DOCK/LIFT/RECEDE/TRANSFER/RESUME → `IF-MOTION-VISUAL-LAW.md` (đè dải ms SPEC-APPLE-MOTION, đã đóng dấu).
- **2D/3D/Present laws**: 2D precise-flat "đúng từng mm" · 3D "cubic nét, sang, đơn giản" + object MỌC từ footprint · Present editorial-cinematic, Section Navigator 01/02/03.
- **Auto Grid = capability CỦA PRESENT** (KHÔNG toàn app — đính chính 20/08): select blocks → Layout Ghost mọc từ composition frame → alternatives ‹› → Compare/Apply/Undo, không đè vùng custom.
- **IDFC Library**: một asset một identity nhiều representation · line-grammar map vào 7 nấc mm sẵn có · LOD 0-3 · anchor nghề · Replace giữ context · Override≠Edit-Definition (Where Used + Impact) · "3D unavailable" nói thật.

## 2 · ARTIFACTS DONE (path = `docs/mocks/mock-exs-*.html`, cùng tên trên Claude Design)
| Board | Status |
|---|---|
| A luật vật lý · B sáu khung · C Home H1-H6 · D sidebar 3 độ sâu · E aperture+stack · F flows nghề · G/H/I ref→DS · **J Auto Grid Present v2** · L hình học | **APPROVED** (Hoà pass mắt sáng 20/08) |
| M Motion-Visual Law (luật = chữ Hoà, APPROVED; board = bản treo) | DESIGNED / NEEDS REVIEW nhẹ |
| N chuẩn IDFC · O bộ mẫu 8 asset · P trải nghiệm Library | 🔴 **REJECTED làm ngôn ngữ thị giác sản phẩm** (Hoà bác 20/08 chiều: "đồ vẽ tay + ma trận mẫu vật + minh hoạ kiểu CAD ≠ trải nghiệm cao cấp"). **GIỮ làm THAM CHIẾU KỸ THUẬT NỘI BỘ** — line-grammar/anatomy/anchor/LOD/flow Place-Replace-Override vẫn có giá; CẤM thi công visual theo N/O/P |
| Q Adaptive Toolbelt (dựng cho lane A) | DESIGNED — NEEDS REVIEW; lane A bám CONTRACT đã pass, bố cục chờ mắt |
| ~~K 5-ca toàn app~~ | ĐÃ XOÁ — sai scope, cấm hồi sinh |

Văn bản: `CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` · `IF-MOTION-VISUAL-LAW.md` · `SPEC-DESIGN-SYSTEM-IF.md §7` · `docs/nc/REF-VISUAL-EXS-2026-08-20.md` (R1–R16) — đều đã nối/đóng dấu đúng chỗ, KHÔNG có DS thứ hai.

## 3 · IN PROGRESS (phía code, không phải design)
3 lane MAIN đang chạy: A Visual-Generate+Toolbelt (`lib/capabilities` + toolbar-source + command-icon) · B Image→3D · C Render/Motion + cầu Present. `components/library/**` đang KHOÁ chờ design pass IDFC được chấm.

## 4 · DO NOT REDESIGN
Mọi thứ ở mục 1 + các board APPROVED. Không vẽ lại DS/tokens/typography/accent. Không mở lại: hai-cụm sidebar · Vitals-neo-ngữ-cảnh · Auto-Grid-toàn-app · một-canvas-per-project. Không tạo Tooltip/registry/card system thứ hai.

## 5 · NEXT TASK (Hoà đổi 20/08 chiều — "Real Asset Quality Pass" ĐÃ BÁC, đừng nhặt lại)
**5a · Library hướng MỚI — BA TẦNG quanh NỘI DUNG THẬT** (không thiết kế lại đồ nội thất):
**BROWSE** (editorial, tĩnh, ảnh sản phẩm/3D THẬT to, ít metadata — món đồ là nhân vật chính) →
**OBJECT PASSPORT** (hãng · tên · bộ sưu tập · mã khi có thật · kích thước · vật liệu · CAD · 3D ·
spec · nguồn · đang dùng ở đâu) → **TECHNICAL VERIFY** (plan/front/side/3D · bbox · anchor · slot
vật liệu · nguồn/dẫn xuất · revision). **Ma trận kỹ thuật CHỈ ở tầng 3.** Nội dung: chất lượng cỡ
hãng thật hoặc ghi rõ **PLACEHOLDER** — CẤM bịa thương hiệu giả, CẤM vẽ lại hình sản phẩm cho mock
trông đầy. (Tham chiếu kỹ thuật được phép kế thừa từ N/P: anchor · Replace-giữ-context ·
Override≠Edit-Definition · 2D↔3D identity.)
**5b · Việc thị giác LỚN kế (phiên UX/UI mới): FULL APP EXPERIENCE ATLAS** — MỘT artifact Claude
Design, toàn app trên một trang, 7 nhóm (Entry/Work · Content · Authoring · Review/Intelligence ·
Capability moments · System · States), MỖI khung dán nhãn APPROVED/READY-TO-CODE/IN-PROGRESS/
LEGACY/REJECTED/NEEDS-HOÀ. **Không giấu màn xấu/legacy** — Atlas là bản đối chiếu.
**5c · LUẬT KHUNG GIỜ (Hoà ban 20/08, áp mọi việc thị giác):** checkpoint NHÌN ĐƯỢC trong ~20
phút; ~30 phút Hoà phải trả lời được CÓ/KHÔNG/SỬA; không đạt ⇒ khai **STUCK**, dừng lane, đổi
cách. Hết thời vòng nghiên cứu 1–2 giờ không ra artifact.
**5d · LUẬT CÔNG CỤ:** việc thị giác chưa chốt **CHỈ qua Claude Design** — không để agent
code/nghiên cứu âm thầm thành người thiết kế.

## 6 · FILE / MOCK PATHS
`docs/mocks/mock-exs-{a-luat-vat-ly, b-mot-app-sau-khung, c-home-work-os, d-sidebar-3-do-sau, e-context-stack-vitals, f-flows-nghe, g-ref-ap-ds, h-ref-dot-2, i-moodboard-3d, j-khung-moc, l-hinh-hoc, m-motion-visual-law, n-idfc-chuan-visual, o-idfc-bo-mau, p-idfc-trai-nghiem, q-toolbelt-capability}.html` · luật/chốt như mục 2 · sổ 00-CHOT các dòng 20/08.

## 7 · OPEN HUMAN GATES (5)
1. **Checkpoint đầu của Library 3 tầng** (BROWSE frame đầu tiên, theo luật 20/30 phút) — thay hẳn gate "chấm N/O/P" cũ.
2. **EXS-Q bố cục toolbelt** (lane A đang chạy trên contract, chờ mặt).
3. **Màu nhấn thứ hai: mòng két ↔ mận** (kéo theo quầng presence R5).
4. **Cách hiểu luật "CHỈ qua Claude Design"** cho phiên mới: dựng NATIVE trong Claude Design canvas, hay giữ flow 16/08 (mock HTML trong repo → DesignSync đẩy lên pane)? — bộ EXS hiện tại đi flow 16/08 (khai thật ở PROVENANCE dưới); Hoà chốt một lần cho khỏi lệch.
5. Chi tiết tương tác nhỏ: R2 direct↔proximity · Collage đặt đâu · số-tại-vật · model picker.

## PROVENANCE ARTIFACT (trả lời câu hỏi Hoà 20/08 — sự thật, không suy đoán)
Toàn bộ 16 board EXS là **HTML/SVG do CHÍNH SESSION NÀY tự tay viết** tại `docs/mocks/` (không
subagent nào sinh), rồi **đẩy lên Claude Design project b7dc14ba qua DesignSync**
(finalize_plan → write_files, marker `@dsCard`) — hiện là thẻ thật trên pane. Chúng KHÔNG được
tạo native bên trong canvas Claude Design. Đây đúng flow đã chốt 16/08 ("phiên dựng mock HTML →
đẩy qua DesignSync"); luật mới 5d của Hoà đứng trên — phiên mới theo gate #4.
