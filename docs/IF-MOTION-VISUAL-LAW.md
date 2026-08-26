# IF · MOTION & VISUAL LAW — Hoà chốt 20/08/2026

> **Vai trò**: bộ luật motion + visual cho TOÀN IF — main stages + supporting stages. Mục tiêu:
> *mỗi stage có cá tính riêng, nhưng vẫn rõ ràng là cùng một hệ sản phẩm.*
> **Vị trí trong hệ DS**: đây là phần LUẬT VẬN ĐỘNG của MỘT Design System duy nhất — nối vào
> `SPEC-DESIGN-SYSTEM-IF.md` §3/§7, đứng cùng `CHOT-EXPERIENCE-SYSTEM-2026-08-20.md`.
> Nhịp số ms ở §0 **ĐÈ** dải cũ của `SPEC-APPLE-MOTION-MATERIAL.md` (02/08) khi hai bên vênh.
> Board: `EXS-M` (Claude Design). Toàn văn Hoà giữ nguyên; phần ĐỐI CHIẾU của phiên ghi ở cuối.

---

## 0 · Luật chung toàn hệ

**Một Design System, nhiều density — không nhiều style.**

Hình học chủ đạo: rectangle → rounded rectangle → capsule → circle.

Mọi surface mở ra phải **nở từ nguồn của nó, không teleport**: icon → capsule · capsule → panel ·
card → inspector · Vitals aperture → peek → engage · selection → contextual tools ·
content blocks → Auto Grid layout.

Motion luôn phải trả lời được: **"cái gì vừa xảy ra, từ đâu, và đi đâu."**

**Nhịp motion mặc định:**
- hover / press: ~100–160ms
- tooltip / capsule / contextual reveal: ~140–200ms
- shelf / inspector: ~180–260ms
- stage/context transition: ~240–380ms
- layout morph / Auto Grid: 300–700ms tuỳ độ phức tạp

Không bounce vô nghĩa. Không spring quá mức. Không animation làm chậm thao tác nghề.
Luôn có Reduced Motion.

## I · 3 STAGE CHÍNH — AUTHORING ENVIRONMENTS

### 1 · 2D KỸ THUẬT — "Tôi làm đúng từng mm."
**Visual character**: Precise · flat-first · measured · quiet — bàn vẽ chuyên nghiệp hiện đại,
không phải dashboard. Primary: canvas/drawing truth · Secondary: active tool + selection +
numeric/property context.
**Visual**: nền canvas sạch, contrast vừa đủ · đường/snap/dimension/anchor rõ · depth ít hơn 3D ·
left rail mặc định compact · toolbar nhẹ · right panel gọn kỹ thuật · semantic color CHỈ cho
active/warning/selection/truth state. **Không card-heavy trong canvas.**
**Motion** (ngắn, chính xác): select → bounding box gần như tức thì · drag → ghost vị trí cũ +
preview mới · numeric field mọc gần thao tác · confirm → snap settle nhẹ · undo → object quay về
có continuity · library block drag từ shelf vào canvas, không teleport.
**Tool**: near-pointer `Move · Rotate · Replace · Material · Comment`; sâu hơn = Inspector/ToolWindow.

### 2 · 3D THIẾT KẾ — "Tôi đang chạm và tạo không gian."
**Visual character**: Spatial · tactile · layered · immersive but controlled. Primary: viewport ·
Secondary: selection/scene/material/modifier/camera.
**Visual**: viewport ưu tiên tuyệt đối · panel nổi depth rõ hơn 2D · contextual surface có thể
translucent nhẹ · material/scene/camera dùng VISUAL hơn chữ · BuildRecipe stack là một visual
object thật · **không dark sci-fi**.
**Motion** (được phép sâu hơn): selected lift bằng outline/depth · tool palette xuất hiện TỪ
selection · ToolWindow dock/pin/collapse · modifier hover → preview before/after · material apply
→ transition mềm lên object · **2D→3D handoff: object MỌC LÊN từ footprint/semantic source** ·
camera move giữ spatial continuity. Không cut scene đột ngột nếu không cần.

### 3 · PRESENT — "Tôi đang kể chuyện bằng nội dung thiết kế."
**Visual character**: Editorial · composed · cinematic · spacious. Primary: story/output canvas ·
Secondary: source/layout/review/release.
**Visual**: spacing lớn hơn · text lớn hơn · hierarchy ảnh mạnh hơn · Section Navigator `01/02/03`
· source/revision indicator nhỏ mà rõ · ít control thường trực.
**Motion** (thiên composition): section chuyển có continuity · block rearrange bằng morph ·
**Auto Grid không "pop result" mà HÌNH THÀNH** · source preview expand từ content · compare =
crossfade/split/morph tuỳ content · stale báo nhẹ, không phá story canvas.
**Auto Grid** (capability riêng của Present): Select blocks → Auto Grid → Layout Ghost → semantic
rearrange → alternatives → Apply/Compare/Undo. Ghost grid xuất hiện từ composition frame; cell
split/merge/resize có continuity; hero rõ; nội dung đổ vào SAU cấu trúc.

## II · STAGE / SURFACE PHỤ

### HOME — "Đây là bàn làm việc của tôi."
Roomy · personalized · calm · alive — orchestration surface, không phải stage nghề. Spotlight:
Resume. Visual: modular · bento có kiểm soát · image-rich đúng chỗ · khoảng thở · widget có
hierarchy · personalization trong guardrail DS. Motion: widget hover lift nhẹ · rearrange snap
grid · mode switch không reload toàn bộ · Resume mở TỪ card → đúng context · widget đổi thì
morph, không nhảy loạn.

### FILES / REFERENCE / LIBRARY — "Tôi đang tìm, hiểu và tái sử dụng nội dung thật."
Browseable · visual-first · source-aware; được image-heavy hơn stage khác: gallery/masonry ·
collection shelf · filter chips · semantic asset cards · provenance/usage state · where-used ·
promote state. Reference được tối/immersive hơn nhưng shell vẫn cùng DS. Motion: upload →
progress card có state · understand/promote → semantic transition · drag asset → target highlight
· asset card → inspect MỞ TỪ card · Replace → shelf lọc cùng semantic type · filter → reflow mềm.

### REVIEW / DECISION — "Tôi luôn biết mình đang nói về cái gì."
Anchored · contextual · accountable — không phải màn chat. Primary: thing being reviewed ·
Secondary: issue/comment/decision. Visual: review layer cạnh/trên source · anchor rõ · comment
không che content · **decision state mạnh hơn conversation state** · stale/unresolved/accepted có
semantic treatment. Motion: hover issue → source highlight · click comment → focus đúng entity ·
decision → state transition rõ · Go to Source giữ spatial context · resolve → collapse nhẹ.

### VITALS — "IF đang hiểu, nhưng không làm phiền."
Ambient intelligence, sống ở top edge, ba mức Ambient→Peek→Engage. Visual: aperture như được
"CẮT" vào shell · mức 1 cực ít chữ · mức 2 chỉ 1–3 insight · mức 3 mới sâu · voice có
waveform/transcript gọn. Motion: hover/focus → aperture hạ xuống nhẹ · selection đổi → content
morph · engage mở TỪ CHÍNH aperture · voice pulse/listening · không có gì đáng nói → thu lại, im.

### PROJECT / WORKSPACE — Identity + continuity, không phải dashboard KPI.
Hiện: project identity · active workspace/context · recent stage · review/task signal · resume.
Motion: Project → Workspace → Stage giữ breadcrumb/context nhẹ — không reload kiểu sang app khác.

### PROFILE / SETTINGS / CREDITS — Quiet · personal · secondary (cụm 3 sidebar).
Không cạnh tranh với work. Motion: rail → personal shelf · settings mở từ profile cluster ·
credits ring nhỏ gọn · appearance preview trước apply nếu cần.

## III · LUẬT SPOTLIGHT
Mỗi surface: **1 Primary + 1 Secondary**, còn lại tertiary. Mọi thứ đều nổi bật = FAIL.
2D: canvas > selection · 3D: viewport > contextual tool · Present: story > source/review ·
Review: source > discussion · Home: Resume > attention · Library: content > filter ·
Vitals: insight > actions.

## IV · LUẬT DEPTH
Chung toàn IF: **L0** canvas/workspace · **L1** persistent cards/shelves · **L2** active
contextual tool/inspector · **L3** popover/Vitals Peek/floating tool · **L4** focused modal khi
thật cần. Không random shadow. **Depth càng cao → càng tạm thời và càng tập trung.**

## V · LUẬT TOOL / MASTER CAPABILITY
Master Capability **không đổi theo stage — chỉ đổi representation**: Near Pointer → Adaptive
Toolbelt → Context Shelf → Inspector → Deep ToolWindow. Giữ cùng identity: icon family ·
shortcut · naming · interaction grammar. `Replace` ở 2D và 3D không được trông như hai chức năng
không liên quan.

## VI · LUẬT "UI SỐNG"
Mọi thứ tương tác được đều có phản hồi, **mức phản hồi theo tần suất**: dùng liên tục → rất nhẹ ·
contextual → rõ hơn · có hậu quả → mạnh hơn · AI/system → cho biết hệ thống đang làm gì.
Không cần mọi card đều bay lên. **"Alive" ≠ "animated everywhere".**

## VII · LUẬT HÌNH HỌC
Rectangles define space. Rounded rectangles define surfaces. Capsules define compact action/mode.
Circles define point/person/status. Expansion từ tâm/source. Nested radius quan hệ với parent.
Không blob, không organic card tuỳ hứng, không mỗi stage một radius.

## VIII · LUẬT CHUYỂN STAGE
Không page-transition kiểu website. Stage transition = **workspace đổi chế độ, không phải mở app
khác**. 2D→3D: shell giữ nguyên · stage cluster active chuyển · canvas/viewport morph · context
strip giữ project/space · selection/source liên quan được preserve · toolbar đổi working set.
3D→Present: shell giữ · camera/view có thể thành source content · Present mở như CONTINUATION
của work, không reset mental map.

## IX · CÂU LUẬT CHỐT CHO CLAUDE DESIGN (dán nguyên văn khi dựng màn)

> Every primary and secondary stage in InteriorFlow must feel like a different working mode of
> the same spatial operating system, not a different application. Visual identity comes from
> density, spotlight and content behavior — never from inventing a new design language. Motion
> must preserve source, direction and context. Surfaces expand from where they originate, retain
> identity while changing depth, and collapse back predictably. Primary content always wins over
> chrome. The system is calm when idle, responsive when touched, intelligent when context demands
> it, and almost invisible when the professional user is in flow.

---

## ĐỐI CHIẾU CỦA PHIÊN (không thuộc toàn văn chốt)

| Luật cũ | Quan hệ |
|---|---|
| `SPEC-APPLE-MOTION-MATERIAL.md` (02/08): <200ms bấm · 300–500ms chuyển trang · 3 preset spring | Nhịp §0 CHI TIẾT HƠN và **THẮNG khi vênh** (stage transition 240–380 thay 300–500). Các phần khác của file cũ (Siri §4b, nguyên tắc stagger, reduce-motion) còn hiệu lực — đã đóng dấu tại chỗ. |
| `SPEC-HOVER-FOCUS-IDF.md` | Còn hiệu lực nguyên (hover 100–160ms khớp bảng tra cũ; luật cấm-scale-toolbar giữ). |
| Token `--dur-fast .18s / --dur-base .32s` (globals.css) | Đủ cho 2 dải giữa; dải hover 100–160 + stage 240–380 + morph 300–700 → khi thi công thêm token `--dur-*` mới theo VAI TRÒ, không gõ số tại chỗ dùng. DRIFT khai sẵn, chưa đổi code. |
| EXS-A depth ladder / spotlight / motion verbs · EXS-L hình học | Board = bản vẽ của đúng luật này; §IV/§III/§VII là bản chữ chính thức. |
| Chốt "cubic nét, sang, đơn giản" (Vẽ 3D) + R16 | Nằm trong I.2 — không vênh. |
| `LUAT-GIAO-DIEN-BAT-BUOC` · NT-1..18 · KB-1..4 · §2c/§2d | Đứng nguyên; law này là tầng VẬN ĐỘNG bổ sung. |
