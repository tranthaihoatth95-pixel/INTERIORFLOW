# 00 · SỔ CHỐT — đọc file này ở ĐẦU MỖI PHIÊN

> **Mục đích:** `docs/` có **160+ file · 8,9 MB**. Đọc hết là chết context. File này là **sổ mục lục
> 1 dòng/quyết định** — đọc nó rồi mới mở đúng file cần.
>
> **Vì sao phải có:** `STATUS.md` theo dõi **việc đang chạy**, không theo dõi **điều đã chốt**.
> Ngày 01/08 Cowork ba lần thiết kế lại thứ đã có sẵn vì không thấy chúng. Lỗi hệ thống, không
> phải lỗi trí nhớ.
>
> **Luật giữ file nhỏ:** mỗi mục **đúng 1 dòng**. Trần cứng **200 dòng**. Đầy thì cắt mục cũ đã
> thành code, đừng nới dài.

**Thứ tự đọc đầu phiên:** `CLAUDE.md` → `STATUS.md` → **file này** → chỉ mở file thật cần.

---

## ✅ ĐÃ CHỐT — coi như luật, không bàn lại

> ⭐ **NGUYÊN TẮC GIAI ĐOẠN MỚI (Hoà chốt 01/08):** hệ IDF đã ĐỊNH HÌNH ĐỦ — chat nhóm, lập việc,
> 3 chặng × 2 mode, ArchiNote, ATLAS, Vitals, siêu thư viện, chợ đầu mối (File Manager) ↔ cửa hàng
> (Library). Từ nay **ĐI SÂU từng tính năng: giữ cái đắt giá, giải đúng nỗi đau hiện tại; cái thừa
> để sau. NGỪNG mở rộng phạm vi mới.**

| File | Chốt điều gì |
|---|---|
| `CHOT-COWORK-2026-07-30.md` | **Sổ append-only** — quyết định chốt xong ghi vào, không sửa dòng cũ |
| `CHOT-DUYET-SPEC-2026-08-01.md` | ⭐ **Vòng duyệt 7 spec 01/08** — CAD song song-kế thừa · Present 3 phương án + khoá giữ · dàn bài linh hoạt · **video 6 bậc** · ranh giới uỷ quyền Hoà↔Cowork |
| `CHOT-DUYET-SPEC-DOT2-2026-08-01.md` | ⭐ **Đợt 2 — đóng 13/14 nhãn còn lại**: IF chính thức **4 chặng (0→3)** · duyệt hướng 4 spec tính năng · **ArchiNote CŨNG trung tính** (Hoà lật đề xuất E2.2) · chỉ còn `SPEC-SEMANTIC-MODEL` treo chờ Hoà tự đọc |
| `SPEC-VIDEO-MAT-BANG.md` | Spec bậc 1·2·4 video 0-credit — layer `IF_CAMPATH`, không EntityType mới, tầm mắt người 1650 |
| `TICKET-GALLERY-TOGGLE-2026-08-01.md` | Gallery Home: **toggle carousel 3D ↔ grid** ghi đè J-4c (>8 dự án), nhớ lựa chọn, reduce-motion thắng tất cả |
| `TICKET-PRESENT-UI-GON-2026-08-01.md` | Present UI: **bỏ vệt scrim sau chữ** (đổi sang chọn màu chữ tương phản + picker ≤2 click) · **toolbar trên đầy tay** (lộ align/z-order/group + đồ E) — code phụ P6, Hoà chốt kèm ảnh |
| `CHOT-HUONG-3D-2026-08-01.md` | ⭐⭐ **Hướng 3D + vai trò hệ IDF (bản cuối)**: IF = MỘT sản phẩm, **giữ luồng chặng 0→3, IF1/IF2 = TẦNG năng lực cắt NGANG chặng — vận hành bằng **cơ chế Sketch/Pro mode đã có, KHÔNG hệ phân quyền mới**** — chặng 1 nhận cả cấu kiện Revit-style (B2) · chặng 2 + vẽ khối 3D (B1, nguồn vẫn là Doc chặng 1) + IFC/va chạm (B3-B4) · chặng 3 + **đích chiếu công trường** (tablet cắt lớp = đích thứ 5 của hàm chiếu) = BIM thoát Autodesk, không phá gì đã xây · ArchiNote = máy THU · ATLAS = chỉ-đọc |
| `CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md` | Chặng 3 nghèo edit tay → **GIỮ engine, xây 4 nguyên liệu**: E1 group · E2 mask ảnh (rẻ nhất) · E3 lớp phủ fill · E4 filter. Bảng số liệu chờ BOQ, pattern chờ L5. Code phụ làm sau VIỆC 5 |
| `SPEC-3D-CORE.md` | ⭐ **Hạ tầng 3D lõi** — 3 tầng (dữ liệu ✅ có sẵn `docToObjScene` / viewer three.js MỘT component / chụp PNG·depth) · 4 nơi tiêu thụ (video 2-b · Đổi góc · Công trường cắt lớp · D5 handoff) · xám trơn không PBR · thi công 3D-1→6 SAU V2 (3D-5 push-pull = B1 thang BIM) |
| `CHOT-VIDEO-2-TANG-2026-08-02.md` ⭐ | **Video 2 tầng (Hoà chốt 02/08)**: **① Sinh phim** (đường cam+camera→footage) ở **IF2 chặng 2** chung vẽ 3D; D5/Chaos = tùy chọn render photoreal trong chặng 2 (cửa bậc 5). **② Dựng = chặng 3 Present, chỉ edit CapCut**, không giữ scene 3D riêng (luật một-nguồn) |
| `NGHIEN-CUU-QUY-TRINH-RENDER-2026-08-01.md` | ✅ Hoà duyệt hướng **cả 6 đề xuất render**: nháp→chốt · đổi giờ sau render (LightMix IF) · không khí từ ảnh khách · render vùng · bookmark góc máy (chờ V2) · hàng đợi |
| `CHOT-RENDER-TOOL-WINDOW-2026-08-01.md` | ⭐ **LẬT §1B Render Studio**: bỏ màn tool mode riêng — **tool window = subgraph node phóng to**, tab 8 tool + ghim, tối đa 3 window, ≤7in phóng toàn màn · **kính là VỎ không là RUỘT** · đóng luôn bug 2.2.92 (xoá overlay) · mock: `mocks/tool-window-sketch2photo.html` · **điều khiển tay 2B: BẬC THANG 4 nấc + khoá giữ vùng + seed khoá** |
| `SPEC-MODE-PER-STAGE.md` ⭐⭐ | **KIẾN TRÚC GIAO DIỆN HẠ TẦNG (Hoà chốt 02/08)** — §1 **mode mỗi chặng = đổi CẢ shell** (CAD: Sketch↔Pro↔Revit · Render: Render+Mood+Collab↔Vẽ 3D · Present: 5 loại hồ sơ); §2 **sidebar 3 vùng node** (① Mood+Collab kiểu Miro · ② node MASTER phải mở tool window ra sản phẩm mới node tiếp · ③ node thường inline); §3 **hạ tầng XUYÊN 3 chặng**: File Manager (chợ đầu mối) + Master Library (cửa hàng, chứa Thư viện Template); §4 Present 5 loại: Deck·Material board·Bảng tính/BOQ·Word biểu mẫu·Video. **Tool = NODE side trái, kéo thả xổ ra window — KHÔNG tab ngang** |
| `TICKET-UI-HATANG-2026-08-02.md` 🔴 | **LÀM TRƯỚC tính năng lẻ** — H1 useStageMode+<ModeShell> · H2 sidebar 3 vùng (phân loại kỹ ~30 node) · H3 tool=node→window bỏ tab ngang + đóng bug 2.2.92 · H4 Present chọn 5 loại. Additive, không đập engine, verify browser |
| `TICKET-CHANG2-BUILD-2026-08-02.md` 🔴 | **TICKET CHỐT build UI chặng 2** — thứ tự: H1-H3 (đang) → G1 bottom bar → G2 Mood+Collab canvas → G3 Vẽ 3D (Command Panel + Scene Objects) → H4 Present → G4 kệ (chờ 3 câu) → G5 pattern nâng (turn-into·command bar LLM). Additive·verify browser·tránh present-editor |
| `TICKET-FIX-KINH-LONG-2026-08-02.md` (worktree phụ) 🔴 | **Sửa kính lỏng (P6c)**: K1 opacity+transition ở wrapper cha cô lập backdrop→blur chết khi fade (chuyển xuống chính element kính) · K2 ColorPopover cùng cơ chế · K3 ImageEditor thiếu Webkit prefix (tablet không blur). **Bài học: fade kính = self-opacity, KHÔNG fade cha** |
| `TICKET-FIX-KINH-HEADER-2026-08-02.md` 🔴 | **K4 kính lồng kính (code chính)**: dropdown mat-panel là CON của mat-header (cùng kính) → backdrop root chặn blur → menu xuyên thấu. Sửa: PORTAL dropdown ra body. **Luật mới: panel kính nổi PHẢI portal, không lồng trong chrome kính** — áp mọi popover về sau |
| `SPEC-CHANG2-UI-2MODE.md` ⭐ | **UI chặng 2 · 2 mode (Hoà chốt 02/08)**: hạ tầng UI giữ (top·rail·**thanh zoom/pan dưới**), gạt mode chỉ đổi **canvas + sidebar**. **Render+Mood+Collab** = canvas Miro (tablet+bút · presence on/off+mời · swatch matId · share Viewer/Commenter/Editor · sticky/comment/frame-theo-phòng · **mindmap = 1 tuỳ chọn**) + Node Library. **Vẽ 3D** = viewport (trục toạ+ViewCube+gizmo) + Command Panel kiểu Max (Tạo·Sửa·Vật liệu·Camera·Hiện). Spine chung: rail·tìm·Thư viện(matId)·File Manager·presence. Vật liệu V-Ray/D5/IF hợp nhất matId |
| `NGHIEN-CUU-NODE-CANVAS-DOITHU-2026-08-02.md` | **Học đối thủ node-canvas** (Flora·Weavy·Krea·ComfyUI) → 12 pattern áp IF. Top 3 mới: **command bar LLM ra lệnh** · **"Turn into"** (render→upscale→video) · **Scene Objects+Object Properties** (Vẽ 3D). ✅ Vẽ 3D CHỐT qua mock. Bỏ: neon-cyber·thống kê phù phiếm·ComfyUI rối |
| `SPEC-STAGE-LIBRARIES.md` ⭐ | **Kệ Thư viện theo chặng**: 1 Master Library, kệ **tự lọc theo chặng**. C1 CAD (khung tên·ký hiệu·template phòng·hatch). C2 Render (**nhiều form lập luận**·moodboard·preset·pipeline·V-Ray/D5/IF mtl). C3 Present (5 template hồ sơ). Kệ chung: vật liệu·Brand Kit·asset·theme. Cơ chế: kéo=instantiate·áp=preset·publish=template mới. ⛔ **3 câu treo**: danh sách form · phạm vi template · ai publish |
| `SPEC-DESIGN-SYSTEM-IF.md` ⭐ | **Design System IF (Hoà giao 02/08)**: token màu (1 accent #6a57f5·màu loại·trục 3D·badge phạm vi) · bo góc 6/9/12/16 · **motion spring, reduce-motion thắng** · component chung (node card·tool window·toolbar bút·presence·mode toggle·zoom bar·gizmo·swatch·inspector) |
| `SPEC-NGON-NGU-CHI-DAN.md` ⭐ | **Hệ ngôn ngữ chỉ dẫn (Hoà chốt 02/08)**: 5 luật viết (hành động trước · CẤM jargon nội bộ lộ UI · ≤12 từ · luôn kèm NÚT · giọng tự nhiên) · 4 khuôn thông điệp (trống/mách nước/nhắc/lỗi) · **TỪ ĐIỂN nội bộ→người dùng** (node=khối · Node MASTER=công cụ · flow=bảng làm việc…) · chuỗi qua i18n · test 3-giây |
| `REF-VISUAL-2026-08-02.md` | **10 ref visual Hoà giao** chưng cất → component: nav capsule bubble (#9→shell) · upload glass+empty state (#10·#6→File Manager) · ambient tint thẻ ảnh (#5) · timeline lime layout (#7→Video ②) · 2-pane trước/sau (#8→tool window) · chữ sáng dần+voice capsule KHÔNG orb (#4→Vitals LM) · card stack NEOM (#2→Gallery) |
| `LUAT-GIAO-DIEN-BAT-BUOC.md` ⛔⛔ | **LUẬT CỨNG Hoà lập 02/08 sau 3 lần chê xấu** — L1 NGHIÊN CỨU TRƯỚC (ls docs/mocks + grep repo, nêu rõ đã kiểm gì) · L2 không hứa suông · L3 mock là hợp đồng (2 theme+lucide+biến) · L4 cấm tự chế màu/kích thước · L5 nghiệm thu ảnh đủ 2 theme · L6 tài sản đã làm phải tái dùng (avatar 3D!) · L7 sai thì làm lại. **Ràng buộc CẢ Cowork lẫn Claude Code** |
| `SPEC-APPLE-MOTION-MATERIAL.md` ⭐ | **Thẩm mỹ + chuyển cảnh Apple (nghiên cứu THẬT, có nguồn 02/08)** — ⚠️ **iOS 27 đã TỰ SỬA Liquid Glass vì khó đọc** (frosted toolbar quay lại · thanh trượt chỉnh độ kính · bo góc nhất quán) ⇒ kính là gia vị, đọc được TRƯỚC. Số cụ thể: <200ms bấm · 300-500ms chuyển trang · 3 preset spring smooth/snappy/bouncy (0.5s, bounce 0/.15/.3) · 4 nguyên tắc (liên tục không gian · phân lớp chiều sâu · hướng nhất quán · stagger 30-60ms) · công thức mở/đóng/crossfade/toast/hover · reduced-motion thắng · **§4b SIRI iOS 27 = khuôn cho Vitals LM** (pill nhỏ→thẻ kết quả trong suốt→vuốt thành hội thoại→trang riêng lưới phiên cũ + ＋; nhập giọng/chữ/ảnh; KHÔNG chatbot toàn màn, KHÔNG orb) |
| `SPEC-HOVER-FOCUS-IDF.md` ⭐ | **Trỏ vào thì gì xảy ra — hover/focus/press TOÀN HỆ IDF (nghiên cứu WWDC25, 02/08)**. Trả lời Hoà: **KHÔNG zoom mọi thứ** — scale chỉ cho vật NHỎ/ĐƠN LẺ; nút toolbar·hàng list·ảnh lớn thì CẤM scale. 3 kiểu: tức thì/trễ/**ramp** (ease-in→spring pop, Apple khuyên). Bảng tra 9 loại phần tử × hover/press/selected có số ms + scale cụ thể (thẻ 1.02+lift 2px 200ms · chip 1.04 · nút chỉ đổi nền 120ms). 8 luật chung (vào chậm ra nhanh, chữ không nhảy, bàn phím = chuột, tablet không giấu sau hover) + mã mẫu CSS |
| `SPEC-MAT-DO-CON-TRO.md` ⭐ | **Mật độ & con trỏ — desktop vs cảm ứng (03/08, ĐÃ CHỐT §5)**. Đo thật: nút rail 42 vs 44 lệch nhau, CTA 48px, `max-width:1440px` bỏ trống màn 27". Nhưng **vấn đề thật không phải kích cỡ**: `grep` → 0 kết quả `onContextMenu`/`shiftKey`/`onKeyDown` — thiếu hẳn từ vựng chuột+bàn phím (chuột phải, shift-click, marquee, mũi tên, type-ahead, kéo file từ Finder). Chốt: **1 thiết kế, 5 token đổi theo con trỏ** (`--tap/--row/--gap/--pad-card/--fs-ui`), desktop = mặc định, cảm ứng = override qua `(hover:none) and (pointer:coarse)` — tái dùng điều kiện đã có ở `globals.css:1030` |
| `SO-KIEM-TONG.md` ⭐⭐ | **SỔ KIỂM TỔNG (luật Hoà 03/08: thay phiên phải đọc, không rớt ngữ cảnh, không mất tính năng)**. §1 sổ chống rớt ~20 tính năng kèm lệnh kiểm · §2 phân mảng CHINH=vỏ app / PHU=lib engine / G4=editor / COWORK=chỉ quản lý KHÔNG code · §3 phiếu giao việc đang mở · §4 luật thay phiên. Mọi phiên đọc file này TRƯỚC TIÊN |
| `HAM-DOI-COWORK.md` ⭐ | **Hạm đội Cowork (Hoà duyệt 03/08)**: 6 vai — TỔNG (điều phối, phiên này) · NC (nghiên cứu, sở hữu docs/nc/) · UI (mock, sở hữu docs/mocks/) · VẼ · DỰNG · TRÌNH (spec nghiệp vụ từng chặng). Luật chung: Cowork KHÔNG code, mock đúng token, append-only, tự chốt phiên 85%. Mỗi vai có hàng đợi 3-5 việc sẵn |
| ⚡ Ship-trước-sửa-sau | **Hoà chốt 04/08 đêm**: bỏ vòng chờ mock/duyệt-trước cho việc UI — dựng thẳng theo spec, hậu kiểm trên app thật, sai đâu sửa đó. Giữ nguyên lưới đỡ: trung tính · token · vùng mảng · chống rớt · nghiệm thu |
| Present sống/chết [TỔNG quyết đêm 04/08] | COWORK-TRÌNH rà 18 mục bằng git: **8 chết** (E-sprint P1-P5 đã giết 5/6 toolkit audit + P6a + P6b-b1 — nay mới đánh dấu) · **7 sống** (nặng nhất photo-editor 4 tầng #2, AI-lẫn-tay #3, P6b-b2 cụm Hiệu ứng, flip per-element) · 3 verify. Phần sống gom phiếu Present mới, vùng **G4** (nhãn 'code phụ' trong ticket cũ lỗi thời theo §2). #3 GỘP vào H4 khi làm màn chọn hồ sơ — tránh thiết kế 2 lần |
| `SPEC-PANEL-ROLLOUT-IDF.md` ⭐ | **Panel thò thụt + ít chữ + phím tắt (03/08)**. Nghiên cứu 3dsMax/Blender/Rhino/SketchUp: rollout tiêu đề=toggle + grip ⠿ kéo thứ tự · nhớ theo LOẠI VẬT không theo sub-mode (lỗi 3dsMax) · Inspector = dải trang kiểu Rhino · ghim · CẤM auto-hide (bị chửi nhất cả 4 app), thu về dải mỏng có nhãn · bảng thay chữ→icon · phím tắt toàn hệ + xử va phím L |
| `SPEC-VAT-LIEU-PBR-IF.md` ⭐ | **Vật liệu PBR + QUẢ CẦU xem trước (Hoà chốt 03/08)**. matId = PBR metal/rough chuẩn glTF (khớp D5+Enscape, V-Ray dịch qua Use Roughness/Metalness 0-1/Fresnel IOR) · quả cầu = three.js sphere + RoomEnvironment PMREM, cache PNG · 3 cảnh Cầu/Sàn/Vải theo danh mục · tạo vật liệu theo template kiểu D5 (~8 trường, không phải ~40 của V-Ray) |
| `SPEC-LENH-VE-IF.md` ⭐ | **Bộ lệnh vẽ — tầm nhìn: tay SketchUp · não Revit · xương AutoCAD (03/08)**. Port nguyên: inference màu+khoá Shift/mũi tên · gõ số SAU thao tác (3x, /3) · push/pull double-click lặp + đẩy xuyên khoét lỗ · tường location line + nối tự sạch MỘT kiểu · cửa là con tường (Space đảo chiều) · room tự nhận biên · type/instance · 12 lệnh AutoCAD xếp hạng · kiểm khuyết ①-⑩ |
| `SPEC-CAD-SHELL-V3.md` ⭐ | **Vỏ app chặng Vẽ — bản tinh gọn (Hoà chốt 03/08)**. Hoà chê rail "lèo tèo" → v1 dày như AutoCAD → Hoà chê "rối rắm, muốn như Apple tư duy". Nghiên cứu 3 nguồn (Figma UI3 · Apple HIG Sidebars · thói quen layer của designer nội thất) → chốt: **BỎ rail icon** (HIG không có khái niệm này; Keynote/Final Cut đều 1 sidebar CÓ CHỮ) · 1 sidebar = 1 việc (Lớp) · **Layer State ở đỉnh** (thứ dân AutoCAD dùng mỗi ngày) · bản vẽ = tab ngang · **inspector chỉ hiện khi có chọn** · 7 công cụ ở dock kính DƯỚI (Figma UI3) thay toolbar 20 icon trên. Phần tử nhìn thấy 55→26. Vật mẫu `mocks/mock-cad-shell-v3.html` chép nguyên văn token globals.css |
| `CHOT-AVATAR-MEMOJI-2026-08-02.md` ⭐ | **Avatar đổi hướng (Hoà chốt 02/08)**: BỎ "búp bê nỉ" (xoá feTurbulence/DisplacementMap) → **mặt người kiểu Memoji** (da mịn gradient mềm, không viền đậm, tóc là khối mượt, tỉ lệ gần người). Rail: avatar **44px = đúng cỡ nút**, cùng trục; **gom ⚙ + ⋯ vào MENU AVATAR** (bỏ nút rời rạc). Trang đổi avatar: **thumbnail vẽ thật + tab icon**, CẤM số "1..16"/chữ suông |
| `CHOT-AVATAR-3D-BLENDER-2026-08-02.md` ⭐⭐ | **ĐƯỜNG RA cho avatar (02/08 chiều)**: đã cài `bpy` Blender 5.0.1 headless trong sandbox, render thử 3 vòng — **CHẠY ĐƯỢC, ra chất 3D thật** (volume · subsurface da · mũi nhô có bóng · 3 đèn studio). Đúng cách Apple/OPPO: hoạ sĩ render mảnh → app xếp lớp, chất đến từ RENDER không từ code. Việc render là **một lần lúc build**, app chạy chỉ hiện ảnh → nhẹ hơn SVG hiện tại |
| `CHOT-INTRO-VIDEO-2026-08-02.md` 🔴 | **BỎ intro code (998 dòng), thay bằng VIDEO Google Flow** — Hoà xem thật: bố cục clipart bay rải, 3 màn hình giống hệt cho 3 chặng (vô nghĩa), song ngữ nhồi, **trọn bộ màu TTT + 6 ảnh render dự án khách `/detech`** (18 file·22MB track git, dùng 35 chỗ/3 file). Thay = 1 video 8s + 1 dòng chữ + nút Bỏ qua. Kèm: gỡ /detech khỏi 3 file + git rm --cached + filter-repo trước phát hành |
| `SPEC-APP-SHELL-CHUNG.md` ⭐⭐ | **Khung xương chung 3 chặng (02/08)** — lệch nặng nhất: **rail chỉ có ở Rendering**. Thừa phải cắt: 2 nút "Đưa sang…" (trùng segmented) · avatar 2 nơi · ⌂/⋯ (gom vào avatar) · nhãn "—01/—02" vô nghĩa. Giải: **`<StageShell>` dùng chung** (header·rail·inspector·zoom·Vitals), mỗi chặng chỉ truyền 3 slot (toolbar·inspector·bottomExtra). **FIGMA nguồn thiết kế**: file `InteriorFlow · Design System` (y421AJBWVpqGVvJ3vTn2wO) — 43 primitives + 12 semantic 2 chế độ Sáng/Tối (scopes + code syntax `var(--x)`) + trang `Shell · 3 chặng`. **Vitals nâng cấp** thành thanh trạng thái sống: nghỉ→đang chạy (còn X giây)→cảnh báo (thiếu matId)→bấm mở LM→presence |
| **QUY TRÌNH DESIGN (Hoà chốt 02/08)** | Cowork = design owner, Hoà duyệt bằng mắt — **mock HTML pixel trong `docs/mocks/` = NGUỒN SỰ THẬT giao diện**; phiên code LÀM GIỐNG HỆT mock, không sáng tác. Chữ mô tả chỉ là phụ. Màn nào chưa có mock → Cowork dựng mock trước, code sau. **LUẬT GIAO DIỆN (Hoà chốt 02/08 chiều, sau 3 lần chê xấu):**
①**Cowork LÀM giao diện, phiên code CHỈ PORT** — port nguyên văn markup+CSS, cấm diễn dịch/vẽ lại bằng mắt.
②**Mock phải đủ CẢ 2 THEME + icon lucide thật + biến màu**, không giao bản nửa vời (mock chỉ-sáng là nguyên nhân /settings tối hỏng).
③**Màu qua CSS var app, cấm hardcode hex**; kích thước px cố định trong container 1440, cấm 1fr/vw phình theo màn (§2e).
④Nghiệm thu **PIXEL-DIFF 1440×900, lệch >4px = chưa đạt**, phải chụp đủ sáng+tối.
⑤Xấu = **làm lại**, không vá (bài học 2 lần: code từ chữ ra sai linh hồn, chép bằng mắt ra "xấu quắt") |
| (bổ sung) `SPEC-DESIGN-SYSTEM-IF` **§2c LUẬT CHỐNG NGÔ NGHÊ** | Hoà chê bottom bar 02/08 → 5 luật: một-khối-một-bóng · nhịp 44/34/15/5, bo 14/9 · 1 bộ icon · trạng thái = màu nền · tabular-nums. Bottom bar: **Hoà CHỐT B + HÌNH HỌC APPLE** — switch "Vẽ 3D" CÙNG khối bar; thang shape vuông→bo→capsule→tròn, **bo đồng tâm** (trong = ngoài − đệm): bar capsule 44/r22 đệm 5 → nút 34/r17 → track 22/r11 → núm tròn 18 (§2d design system). **§5: triết lý áp XUYÊN SẢN PHẨM — cả template/deck/Magic/board/hồ sơ app sinh ra, §2c = cửa nghiệm thu mọi output thiết kế kể cả AI sinh** |
| `CHOT-VITALS-LM-CHAT-2026-08-02.md` ⭐ | **Vitals LM chat (Hoà chốt 02/08)**: CẢ HAI — thread **AI riêng** (grounded RAG trích nguồn) + **@AI trong channel nhóm** (multiplayer, chỉ nói khi được gọi, nhận diện glyph riêng). Design note: **Apple HIG · kính lỏng/mờ Liquid Glass · toàn bộ motion spring** (SPEC-DESIGN-SYSTEM-IF §2b) |
| `CHOT-FILEMANAGER-SETTINGS-2026-08-02.md` 📝 | **Gom File Manager + Cài đặt chung (Hoà note 02/08)** — 1 khu: đổi avatar (kiểu Apple/Oppo)·đổi theme·thư mục trỏ (mounted)·hình nền·… **Mới NOTE, chưa thiết kế** — design sau |
| `RANG-BUOC-IF2-CHO-IF1.md` | ⭐ **7 ràng buộc IF1 không được phá** để IF2 rẻ — `elementType`/`storey` luôn optional · XDATA round-trip sống · chặng 3 không hardcode đích · ảnh gắn CẤU KIỆN. **Spec IF2 thật chờ đủ 3 điều kiện** (IF1 ship · ATLAS chạy · ArchiNote có dữ liệu) |
| `CHOT-TACH-AI-VA-CHINH-TAY.md` | Tách AI bằng **dấu + truy vết**, không bằng vị trí · từ khoá **"Magic"** · ba trục Khổ/Bố cục/Nhận diện · cấm chữ "tự động" |
| `CHOT-BRAND-KIT-2026-08-01.md` | Brand Kit thuộc **DỰ ÁN**; `_studio/` chỉ là mẫu đọc một chiều |
| `QUYET-DINH-HA-TANG-2026-07-31.md` | Đĩa là nguồn sự thật (①B) · cây thư mục (②) · Gu→Prisma (③C) · FlowVersion đổi cò (④C) · desktop-first 1024/1440 |
| `CHOT-HUONG-SAU-DEMO-2026-07-31.md` | 2 điểm Hoà nêu sau demo → hàng đợi có thứ tự |
| `CHOT-SO-MA-2026-07-29.md` | Quy ước cấp mã · chỉ Claude Code được ghi vào cây |
| `LUAT-300DPI-2026-07-29.md` | Mọi sản phẩm chất lượng **≥ 300dpi** |
| `LUAT-CHU-VIET-7.1.23-2026-07-31.md` | Chữ Việt: dấu chồng mang nghĩa · cấm hoa toàn phần, `line-height < 1.5`, tracking âm |
| `LUAT-COWORK-TU-KIEM.md` | Luật **14a–14t** cho Cowork — nhãn nguồn · hạn dùng (cả ảnh) · kiểm ở đích · **ghi đúng điều Hoà chốt** · luật DB |
| `CONTENT-RULES.md` | Nội dung app thật · demo · dự án khách **không được trộn** |
| `AUDIT-BRAND-PII.md` | **LUẬT TRUNG TÍNH** — IF là sản phẩm bán ra. Danh sách chuỗi phải dọn |
| `SPEC-VITALS-VISUAL.md` | Glyph Vitals: cầu kính + electron, **số hạt là kênh thông tin**, 1 accent `#6a57f5` |

### Bảy spec gỡ nhãn `[CẦN HOÀ DUYỆT]` ngày 01/08

| File | Ai duyệt |
|---|---|
| `SPEC-PRESENT-FLOW` · `SPEC-CAD-MODES` | **Hoà** |
| `SPEC-PRODUCT-INFRA` · `SPEC-VITALS-ROLE` · `SPEC-UI-SHELL` · `SPEC-NAVIGATION-MODEL` | **Cowork** (Hoà uỷ quyền phần thuần kỹ thuật) |
| `SPEC-VITALS-AI` | vai trò đã duyệt · **cơ chế còn draft** |

---

## 📐 SPEC ĐÃ ỔN ĐỊNH — tra khi cần, không đọc mặc định

`SPEC-TONG-COWORK-2026-07-29` (46 KB) · `SPEC-ARCHINOTE-DETAIL-v1` · `SPEC-ARCHINOTE-IF-BOUNDARY` ·
`SPEC-RENDER-STUDIO` · `SPEC-EDITOR-TOOLKIT` · `SPEC-IF-LIBRARY` · `SPEC-MATERIAL-PIPELINE` ·
`SPEC-SEMANTIC-MODEL` · `SPEC-THU-VIEN-D-2026-07-30` · `SPEC-COLLABORATION` · `SPEC-FILE-MANAGER` ·
`SPEC-KNOWLEDGE-BASE` · `SPEC-BRIEF-INTAKE` · `SPEC-STAGE-0-IDEATION` ·
`CHUAN-THIET-KE-v7.6-NGUON` (chuẩn nội thất v7.6, 8 mục, ISO 128)

✅ **Vòng duyệt 01/08 ĐÓNG TRỌN — repo sạch nhãn 100%**: đợt 1 (7 file) + đợt 2 (13 file) +
`SPEC-SEMANTIC-MODEL` (Hoà tự đọc, duyệt cuối ngày — kèm lời nhắc kỷ luật §3: *ngữ nghĩa chỉ thêm
khi có nơi tiêu thụ*). README mục lục đã thay 16 dòng nhãn lỗi thời bằng dòng duyệt.

---

## 🔧 THỨ ĐÃ TỒN TẠI TRONG CODE — kiểm trước khi định "làm mới"

Trước khi thiết kế bất cứ gì: `ls docs/` + grep tên chủ đề + grep tên component.

| Tưởng chưa có | Thật ra đã có |
|---|---|
| Trình đổi avatar | `components/avatar/AvatarBuilder.tsx` (311) + `AvatarRenderer.tsx` (1271) + route `/settings/avatar` |
| Glyph Vitals | `components/studio/VitalsIcon.tsx` (67) — **còn bản cũ 21/07**, gradient cam→navy ngoài hệ màu |
| Chuẩn nội thất | `docs/CHUAN-THIET-KE-v7.6-NGUON.md` + `lib/vision/single-view-metrology.ts` (958 dòng) |
| Hạ tầng đóng lớp | `lib/useDismissable.ts` — 1 họ sự kiện `pointerdown` pha bắt toàn app |
| Đảo nguồn sự thật | `lib/disk-sync.ts` — `resolveSourceOfTruth()` thuần, có test |
| Bộ dàn trang Present | `LayoutShelf.tsx` (825) — `TemplatePicker.tsx` đã xoá (A2) |

⚠️ **Hai con số dễ lẫn**: metrology dùng **tầm mắt máy ảnh 1500–1600** (mặc định 1550);
đường cam video dùng **tầm mắt người ~1650**. Hai việc khác nhau.

---

## 📌 CÂU HỎI ĐANG ĐỂ NGỎ

| Câu | Ai quyết |
|---|---|
| ~~136 MB trong `dev.db` là gì?~~ **ĐÃ ĐO (B3) + ĐÃ VACUUM 01/08**: dev.db 137 MB→**12 MB**, freelist 0, integrity ok, không mất bản ghi nào | ✅ XONG |
| Brand Kit đảo nguồn — phải đổi hình dạng `brand-kit.json` trước | code phụ VIỆC 5 đang làm |
| GPL-3.0 của `@mlightcad/libredwg-web` — `licenseNotes` UNRESOLVED | **Hoà**, trước khi phát hành |
| `/library/ingest` tràn full màn + placeholder có tên khách — sửa 1 lần được cả 2 | code phụ VIỆC 4 |
| ✅ VIỆC 5 brand-kit ĐÃ commit main (`0a35697`, 02/08) — 2 commit trùng tên vô hại trên main** (bản sửa còn stage, lệnh đưa 2 lần chưa chạy — lock chặn) — chặn C6 + merge nhanh-phu | **Hoà** chạy 1 lệnh trên máy thật |
| ✅ **merge `nhanh-phu`→main sẽ 3-way SẠCH** — E-sprint KHÔNG đụng brand-kit (verify grep=0), VIỆC 5 chỉ đụng brand-kit* → git tự lấy đúng cả hai, không conflict | khi cả 2 phiên xong |
| Gap: `CamPathPreview`+`CamPathControlPanel` (V2.1) CHƯA wire vào `/cad-editor` — sẵn sàng nhưng chưa dùng được | hàng đợi code chính (D5) |
| **Viết lại lịch sử git** (`filter-repo`) để xoá dấu vết TTT ở các commit cũ | **Hoà**, chỉ làm **ngay trước khi giao repo ra ngoài** |

### ✅ Dọn trung tính 01/08 — Hoà duyệt cả ba

| Thứ | Xử lý | Về đâu |
|---|---|---|
| `knowledge/ttt-design-system/` (16 KB) — readme có tên khách thật | **dời hẳn ra ngoài repo** + gitignore (commit `96b5f1e`) | `~/Downloads/_TTT-BRAND/` |
| `docs/files.zip` — 11 instruction của agent, tài sản cá nhân | **gỡ khỏi git + dời ra** | `~/Downloads/_CLAUDE-AGENTS/` |
| 21 ảnh · 8,9 MB trong `docs/` | **gỡ ảnh, giữ `report.md`** | `~/Downloads/_IF-ANH-DEMO/` |

⚠️ `@ttt.vn` trong auth **KHÔNG phải khoá domain** — chỉ là comment chính sách cũ đã bỏ 19/07.
`isValidAccountEmail()` nhận **mọi domain**. Chữ cần dọn, chức năng không sai.

---

## ⛔ LUẬT VẬN HÀNH — học từ sự cố thật

1. **KHÔNG chạy `prisma db push` / `migrate` / `VACUUM` / `git merge` qua sandbox.** FUSE
   không cho khoá file POSIX (đã chứng minh). Soạn lệnh sẵn, Hoà chạy trên máy thật.
2. **Sao lưu SQLite bằng `sqlite3 dev.db ".backup 'ten'"`**, không dùng `cp`.
3. **Gặp sự cố DB: DỪNG, đừng tự chữa.** Đừng xoá journal — đó là cuốn sổ hoàn tác.
4. Trong `device_bash`, `~` = thư mục phiên sandbox, **không phải máy Hoà**. Luôn dùng `/mnt/`.

---

*Cowork lập 01/08/2026. Thêm quyết định mới thì thêm **1 dòng** — đừng để nó chỉ nằm trong chat,
chat bị nén là mất.*
