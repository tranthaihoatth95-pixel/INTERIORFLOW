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

- [10/08 Hoà chốt] Chiếu sáng là workspace trong 3D Thiết kế, dùng chung `Doc.lighting`: layout ↔ phối cảnh realtime ↔ Vitals/BOQ; lux trước IES/LDT phải ghi rõ là ước tính.

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
| MỘT thư viện chặng 2 [Hoà chốt 04/08 sáng] | Panel "Thư viện khối" sidebar là cửa DUY NHẤT (node+vật liệu+template, browse kiểu D5) · sheet Thư viện = kho lớn mở từ nút đáy, không tự bung, không banner · cột "Đầu vào" xoá, gộp thành nhóm "Trên bảng" đầu panel · quả cầu làm lại theo công thức V-Ray/D5 (NeutralToneMapping · nền xám · bóng tiếp đất · fov 30) |
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
| `CHOT-ELEMENT-MATERIAL-INTELLIGENCE-2026-08-10.md` | ⭐ Ảnh→Element/MaterialSpec nháp · tái dùng single-view metrology đã có · measured/inferred/verified · đổi `specId` hai chiều có impact preview, nuôi 2D·3D·BOQ·MB·MĐ·Present |

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

[10/08 Hoà chốt] Hình minh hoạ toàn app: ưu tiên ảnh/khung hình **đúng nội dung → điện ảnh → quiet luxury** (ánh sáng ngày/đêm, vật liệu, không gian, storyboard…); màn trống không để trắng khi có thể minh hoạ. Cửa vào Trình bày (bước 4 flow 0→3) = thư viện mẫu, thẻ **＋ Tạo hồ sơ trống** luôn ở cuối, tạo ngay không qua form.
[10/08 Hoà chốt] Master Library có 2 mặt: trang tổng là gallery/collection; trong mỗi chặng là sidebar hai nấc tự lọc theo ngữ cảnh + nút nhập từ Kho chung. Slide/BOQ/Văn bản/Video/Ảnh dùng chung bộ thao tác (chọn·biến đổi·cắt/mask·diện mạo·chữ·sắp xếp·asset·undo/export); phần đặc thù ở Smart Tool ngữ cảnh + Vitals, không tách thành editor/route riêng.
[03/08 01:2x] Claude Design = xưởng mock chính của COWORK-UI (Hoà: "tương tự với giao diện, hãy cho nó làm hạ tầng ui đi"). Seed: docs/IF-design-system-seed.html. Mock từ app vẫn qua audit A4; vùng tạm ghi PLACEHOLDER; HTML tay chỉ khi app trượt 2 vòng.
[03/08 02:0x TỔNG duyệt] Tên hiển thị 3 mode chặng Vẽ: **Phác · Kỹ thuật · Cấu kiện** (Sketch/Pro/Revit = tên nội bộ — đề xuất COWORK-UI).
[03/08 02:0x TỔNG duyệt] SPEC-DESIGN-SYSTEM-IF §6: 7 token --snap-*/--axis-* 2 theme, không màu mới — CHINH nạp globals.css · PHU đổi fallback drawSnap.
[03/08 02:0x TỔNG chốt] Chủ mảng components/cad/*: UI shell (CadEditor·CadToolbar·CadTouchDock·CadStageScreen) = CHINH · engine (CadCanvas·CadSheets·tools) = PHU. Đóng nghi vấn lặp lần 3 của COWORK-VẼ.
[03/08 02:0x TỔNG chốt] Màn chọn 5 hồ sơ: BỎ mock (mock-present-chooser không tồn tại) — G4 code thẳng theo PHIEU-PRESENT-G4. CamPathPreview wire (NC-1 §3.6) = vùng G4.
[03/08 02:0x TỔNG] docs/nc/ = 7 bài NC (5 đợt 1 + NC-lark-permission + NC-pm-studio-nho).
[03/08 Hoà chốt trực tiếp] TÊN 3 CHẶNG: **Vẽ · Dựng ảnh · Trình bày** (bỏ Rendering/Presenting tiếng Anh). "2 IF" = 2 CHẾ ĐỘ dùng: Sơ phác ↔ Kỹ thuật chuyên sâu. BIM của IF = **BIM NỘI THẤT** (kiến trúc là phụ) + theo **chuẩn IFC/QĐ 258**. Mode 3D chặng 2: **KHÔNG chia mode**, một giao diện thống nhất chắt điểm sáng SketchUp+3ds Max+Revit; Cấu kiện ở chặng 1. Chi tiết: docs/CHOT-TEN-CHANG-MODE-2026-08-03.md
[03/08 vòng 2] BỘ TÊN CHÍNH THỨC: app **InteriorFlow** (giữ) · 3 chặng **Vẽ · Dựng · Trình bày** (bỏ chữ "ảnh" vì chặng 2 có cả 3D + video) · 3 chế độ chặng Vẽ **Sơ phác · Kỹ thuật · Nội thất** (thay "Cấu kiện"/"BIM" — đúng định vị BIM nội thất). Khoá kỹ thuật sketch/pro/revit GIỮ NGUYÊN trong code (đổi = vỡ persist). Chi tiết + đính chính: docs/CHOT-TEN-CHANG-MODE-2026-08-03.md §PHỤ LỤC.
[03/08 CHỐT TÊN — vòng cuối, Hoà gật] BỘ TÊN CHÍNH THỨC: app **InteriorFlow** · 3 chặng **2D Kỹ thuật · 3D Thiết kế · Trình bày** (rút gọn header: 2D · 3D · Trình bày) · mode chặng 1 **Sơ phác ↔ Kỹ thuật** (Kỹ thuật có 3D-CAD) · mode chặng 2 **Node ↔ 3D** · chặng 3 không mode. **Cấu kiện/BIM nội thất KHÔNG phải mode, không thuộc chặng nào — là TẦNG DỮ LIỆU nằm dưới cả ba chặng.** Khoá kỹ thuật trong code GIỮ NGUYÊN (sketch/pro/revit, concept/render/present) — chỉ đổi nhãn hiển thị, đổi khoá là vỡ persist.
[03/08 CHỐT TÊN — VÒNG CUỐI, Hoà gật] BỘ TÊN CHÍNH THỨC: app **InteriorFlow** · 3 chặng **2D Kỹ thuật · 3D Thiết kế · Trình bày** (rút gọn header: 2D · 3D · Trình bày) · mode chặng 1 **Sơ phác ↔ Kỹ thuật** (Kỹ thuật có 3D-CAD) · mode chặng 2 **Node ↔ 3D** · chặng 3 KHÔNG mode. **Cấu kiện/BIM nội thất KHÔNG phải mode, không thuộc chặng nào — là TẦNG DỮ LIỆU nằm dưới cả ba chặng.** Khoá kỹ thuật trong code GIỮ NGUYÊN (sketch/pro/revit · concept/render/present) — chỉ đổi nhãn hiển thị; đổi khoá = vỡ persist.
[03/08 Hoà chốt] **HAI APP HAI NHIỆT ĐỘ MÀU** — InteriorFlow = tím lạnh #6a57f5 (công cụ kỹ thuật, nền tối mặc định). **ArchiNote = KEM + VÀNG ẤM chủ đạo, nền sáng mặc định** (cảm giác sổ tay/tri thức); **tím CHỈ dùng làm nhấn rất nhẹ** để nhận ra cùng nhà. Cho phép màu chuyển (gradient) và kính lỏng nhưng phải TINH TẾ. Luật tương phản: vàng/kem KHÔNG bao giờ dùng làm màu CHỮ trên nền sáng — chỉ làm nền khối/nhấn/vạch; chữ luôn dùng mực đậm đạt ≥4.5:1.
[03/08 Hoà chốt — PHÂN VỊ HAI APP] **InteriorFlow = MÁY PHÁT, chạy trên MÁY TÍNH/TABLET** — tạo ra sản phẩm (bản vẽ · mô hình · ảnh · hồ sơ), phiên làm việc dài, nhiều cửa sổ, chuột+bút. **ArchiNote = MÁY THU, chạy trên ĐIỆN THOẠI là chính** — thu vào dữ liệu thật (số đo · ảnh hiện trường · ghi âm · ghi chú · tri thức từ sách), dùng đứng, một tay, ngoài công trường, mạng yếu. Cùng nhà · khác mục đích · bổ trợ nhau · **CHUNG MỘT NGUỒN SỰ THẬT** (qua ATLAS/Lark, không gọi thẳng nhau). ⚠️ Cơ chế cảm ứng nghiên cứu cho tablet IF chỉ **HỌC**, KHÔNG bê nguyên sang ArchiNote — IF cảm ứng là để VẼ chính xác; ArchiNote cảm ứng là để GHI NHANH.
[03/08 ĐÍNH CHÍNH — Hoà nói rõ] Câu "BIM nội thất là CHÍNH, kiến trúc là PHỤ" ghi sáng nay **DIỄN ĐẠT SAI Ý**. Đúng là: **NỘI THẤT LÀ ĐIỂM NHẤN — chỗ IF đầu tư sâu hơn thiên hạ (lớp hoàn thiện · tủ bếp · trần · sàn lát · vật liệu), vì đó là chỗ Revit/ArchiCAD làm dở nhất. KHÔNG có nghĩa kiến trúc giảm quan trọng** — tường, cửa, sàn, mặt cắt, hồ sơ kỹ thuật vẫn làm đủ và làm đúng chuẩn. Tên **ArchiNote GIỮ NGUYÊN** (Hoà: "mình thích archinote"). ⚠️ Phiên sau KHÔNG được lấy câu "kiến trúc là phụ" làm cớ cắt tính năng kiến trúc.
[03/08 TỔNG QUYẾT — Hoà uỷ quyền "logic xuyên chặng khối xuyên chặng thì bạn quyết"] **VÀO CHẶNG NÀO CŨNG DỰNG ĐƯỢC — KHÔNG CHẶN AI.** Hoà: *"IF linh hoạt nên không cấm người dùng chạy chặng riêng được"*.
**Luật X1 — DỰNG Ở ĐÂU CŨNG GHI VÀO MỘT DOC.** Dựng khối ở chặng 3D KHÔNG sinh "model 3D" riêng; nó ghi thẳng vào `Doc` như mọi thao tác ở 2D. Tường dựng trong 3D ⇒ sinh entity 2D tương ứng (hatch poché / wallChain) + `heightMm`. Hệ quả bắt buộc: người dùng tạt ngang vào 3D dựng cả căn, mở chặng 2D thấy **mặt bằng tự có sẵn** — không phải "xuất sang". Đây chính là thế mạnh chung-một-nguồn (K1), không đối thủ nào có.
**Luật X2 — KHÔNG MÀN NÀO ĐƯỢC CHẶN VÌ "CHƯA LÀM BƯỚC TRƯỚC".** Cấm mọi thông báo kiểu *"sang chặng 2D vẽ rồi quay lại"*. Chặng nào trống thì hiện **empty state LÀM ĐƯỢC VIỆC TẠI CHỖ** (mẫu đã có: `Render3DModeSkeleton` — 2 nút "Đùn từ bản vẽ" + "Dựng khối đầu tiên").
**Luật X3 — BA ĐƯỜNG VÀO NGANG NHAU**, không đường nào là "đường chính": ① vẽ 2D → đùn lên 3D ② dựng thẳng khối trong 3D → mặt bằng tự sinh ③ vào thẳng chặng 3 từ ảnh/ý tưởng (không cần mô hình).
**Luật X4 — THIẾU DỮ LIỆU THÌ SUY, KHÔNG CHẶN.** Dựng ở 3D mà chưa khai `elementType` ⇒ suy đoán + gắn cờ `inferred` (K3), KHÔNG bắt người dùng khai trước mới cho dựng.
[03/08 🔴 ĐÍNH CHÍNH — Hoà BÁC đề xuất của TỔNG] Câu "KHÔNG lấy modifier stack của Max / boolean / mesh chi tiết" trong `CHOT-TEN-CHANG-MODE §5` **SAI, HUỶ BỎ**. Hoà: *"dựng nội thất mà không có mấy cái đó là vứt"*. Lý do TỔNG sai: nghĩ AI vẽ ảnh cuối nên khỏi cần dựng sâu — quên rằng **đồ nội thất mới là thứ hình phức tạp nhất** (chân bàn tiện, tay vịn cầu thang, phào chỉ, nan chớp, gờ chỉ tủ). **PHẢI CÓ đủ gia phả lệnh dựng hình**, xem `SPEC-DUNG-BO-LENH-3D` (§ bảng 6 tầng). Camera cũng phải đạt mức V-Ray (tiêu cự mm · chỉnh đứng 2 điểm tụ · DOF · safe frame · tỉ lệ khung · đường quay) — *"cái đó rất cần cho góc nhìn, view, video"*.
[03/08 Hoà đặt LUẬT §9 THIẾT KẾ TRƯỚC — TÍNH NĂNG FILL SAU] Nghiên cứu xong phải **vẽ ngay lên giao diện** (kể cả phần chưa code, để `disabled` kèm lý do), tính năng điền vào sau. Giao diện = **cây gia phả nhìn thấy được** của toàn bộ tính năng ⇒ chống bỏ sót ở cấp nhìn-thấy-được, mạnh hơn checklist trong file. Mỗi ô trống trên giao diện = 1 dòng CHECKLIST-TONG, khớp 1-1. **Cấm nút giả bấm không ra gì. Cấm xoá ô trống cho gọn mắt** — ô trống là bằng chứng còn việc. Chi tiết: `00-BAT-DAU-DOC-DAY.md §9`.

---

## CHỐT 07/08 — Thư viện: bố cục tấm (phương án A)

**Bối cảnh, có số:** mock vẽ 3 cột `kệ 214 + lưới 1fr + thông số 236`, nhưng tấm chốt rộng
**720px** ⇒ `720 − 186 − 236 = 298px` cho lưới (~2 thẻ/hàng). Ba cột **không sống chung được**
ở 720. Nguồn: `M-APPLY-A-OUT.md` §A3.2 điểm 6 + §A3.3.

### Hoà chốt: **PHƯƠNG ÁN A**
| | |
|---|---|
| Bề rộng tấm | **giữ 720px** — đúng chốt 05/08 "card rời", không nới |
| Cột thông số | **chỉ hiện khi ĐANG CHỌN món**, trượt vào từ phải |
| Lưới lúc duyệt | 534px (~4 thẻ/hàng) |
| Lưới lúc chọn | 298px (~2 thẻ/hàng) |
| Cột kệ | **214px** (mock mới) — 186 chỉ là số chép từ `mock-if-3chang.html` cũ (`library-sheet-css.ts:4-6` tự khai "port nguyên văn"), KHÔNG phải chốt của Hoà |

**Lý do chọn A, ghi lại để phiên sau không mở lại:**
1. *Duyệt* và *so thông số* là hai động tác khác nhau, khác lúc — không cần chung một khung nhìn.
2. B (nới 960) trả giá lớn để đổi lấy **4px**: lưới 538 so với 534 của A lúc duyệt, mà tấm
   chiếm 67% màn 1440 ⇒ thôi là "card rời", trái chốt 05/08.
3. C (đưa thông số ra panel phải) phá ngữ cảnh — mắt phải nhảy ra/vào mỗi lần so một mẫu.

### ⚠️ ĐIỀU KIỆN KÈM THEO — A chỉ đúng nếu chuyển cảnh ÊM
Cột thông số vào/ra phải **trượt ngang 180–220ms**, lưới co giãn theo, **không giật, không bật cụp**.
Bật cụp thì người dùng thấy "màn hình tự đổi ý" — lúc đó B mới hơn. Nhánh
`prefers-reduced-motion` thì hiện thẳng, không trượt.

⇒ `G-A-05` (mock cãi chốt) phần **bề rộng + cột kệ** ĐÓNG. Phần còn lại của A3.6
(cột thông số chưa có dữ liệu thật, nhám/bóng ở kho khác) vẫn treo — việc khác.

### Bổ sung 07/08 — "card rời" nghĩa là NỔI LÊN TẠI CHỖ, không trượt từ đáy
Hoà minh hoạ bằng màn *Phiên bản hồ sơ*: các thẻ "Bản 04 / 03 / 02" **nổi rời, hở cả 4 mép**.

**Kiểm code hiện tại** (`components/library/library-sheet-css.ts`) — mới đúng một nửa:
| Điểm | Nay | Đạt? |
|---|---|---|
| Bo 4 góc `--radius-lg` (`:59`) | có | ✅ |
| Hở đáy `bottom: calc(14px + safe-area)` (`:57`) | có | ✅ |
| `transform-origin: 50% 100%` (`:61`) | gốc phóng ở **mép dưới** | ❌ |
| `translate(-50%, calc(100% + 14px…)) → translate(-50%,0)` (`:62,64`) | **trượt cả thân từ dưới màn lên** | ❌ |

Chú thích `:46` tự khai *"Trước: dính đáy (bottom:0), chỉ bo 2 góc trên"* ⇒ đã bỏ dính, nhưng
**giữ nguyên cách vào của ngăn kéo**. Hình rời mà chuyển động vẫn bò từ đáy ⇒ mắt vẫn đọc ra
"ngăn kéo", không phải "thẻ nổi".

**Chốt cách vào:**
```
transform-origin: 50% 50%
đóng:  translate(-50%, 10px) scale(.97)
mở:    translate(-50%, 0)    scale(1)
200ms cubic-bezier(.32,.72,0,1)   ← giữ nguyên đường cong đang dùng
```
Nhích **10px**, không nhích cả chiều cao tấm. Tấm xuất hiện ĐÚNG CHỖ nó sẽ đứng, chỉ nảy nhẹ.
Giữ scrim tối nền sau (đã có, `:41`). `prefers-reduced-motion` ⇒ hiện thẳng, bỏ transform.

⚠️ Không dùng animate `opacity` trên tấm (luật G1) — chỉ `transform`.
⇒ Việc CODE, mảng `components/library` (`3·apply-node`). Ghi vào phiếu vòng 2.

**Vì sao KHÔNG dính đáy — lý do, để phiên sau không "sửa lại cho tiện tay":**
Sheet dính đáy là ngôn ngữ của **điện thoại** — nó dán vào cạnh dưới vì đó là vùng ngón cái với tới.
Apple cũng bỏ dính từ iOS 15 (sheet thành card thụt vào, bo 4 góc). Trên **macOS thì chưa bao giờ
dính**: Save panel · Preferences · Quick Look đều nổi giữa màn.
IF chạy **Electron trên desktop** — chuột không có "vùng ngón cái" ⇒ không có cớ dán cạnh dưới,
mà dán thì thành thanh chắn hết chiều ngang. ⇒ **Nổi giữa là đúng cho desktop.**
Nếu sau này có bản chạm/tablet, đó là quyết định RIÊNG, phải mở lại chốt này — không tự suy ra.

### [07/08 Hoà chốt] ARCHINOTE HOÃN — dồn sức cho IF
> *"archinote chưa code. xử if trước"*

ArchiNote chưa có dòng code nào ⇒ **không nằm trong đợt 2–6**, không thiết kế trước cho nó,
không thêm field "để dành". `G-M9-02` `G-M9-03` hạ xuống ⚪ hoãn (sổ còn 58 đỏ).

**Cửa cho ArchiNote đã chừa sẵn, miễn phí:** `ExternalRef.system` (`schema.prisma:485`) là chuỗi
tự do, cố ý KHÔNG enum. Sau này ArchiNote nối vào chỉ là thêm `system='archinote'` — 0 sửa lõi,
0 migrate. Đó là lợi ích của luật §0v (lõi không mang tên nhà cung cấp) đã trả trước rồi.
⇒ Làm thêm gì cho ArchiNote lúc này là **nợ kỹ thuật cho một thứ chưa tồn tại**.

---

## [07/08 Hoà chốt] ĐỊNH NGHĨA BA CHẶNG — bản cuối, thay mọi mô tả trước

### Tên chuẩn (song ngữ)
| # | Việt | Anh | ID trong code (GIỮ NGUYÊN) |
|---|---|---|---|
| ① | **Thiết kế 2D** | **2D Design** | `concept` |
| ② | **Thiết kế 3D** | **3D Design** | `render` |
| ③ | **Trình chiếu** | **Presenting** | `present` |

⚠️ ID `concept` / `render` / `present` **KHÔNG đổi** — đổi ID là vỡ localStorage, route, DB.
Chỉ đổi NHÃN hiển thị. (Cùng luật đã áp lần đổi tên 04/08, `lib/phases.ts:28-32`.)

### Ranh giới từng chặng — ai làm gì

**① Thiết kế 2D · 2D Design** — có **HAI MODE bên trong**:
| Mode | Việt | Anh | Làm gì |
|---|---|---|---|
| `sketch` | Sơ phác | Sketch mode | vẽ nhanh, phác ý, không ràng buộc |
| `pro` | Chuyên | Pro mode | vẽ kỹ thuật — **bao gồm luôn Revit**: mọi thứ **2D của Revit** tương tác Ở ĐÂY |

**② Thiết kế 3D · 3D Design**
- Mọi thứ **3D của Revit** đẩy sang chặng này
- **Dựng khối** — tinh thần 3ds Max
- Có **render**, và có **mode 3D dựng**

**③ Trình chiếu · Presenting**
- Nơi **trình bày những gì hai chặng kia đã làm**. Không sản xuất mới, chỉ đóng gói.

### 🔴 LỖI NHÃN ĐANG CÓ — phải sửa
Thanh chặng hiện hiển thị **"Thiết kế 2D · Sơ phác"** — **gộp tên CHẶNG với tên MODE vào một nút.**
Sai cấu trúc: "Thiết kế 2D" là CHẶNG, "Sơ phác/Chuyên" là MODE **bên trong** chặng đó.
⇒ Nút chặng chỉ được ghi **"Thiết kế 2D"**. Mode chọn ở chỗ khác (đã có sẵn dải
`Sơ phác · Kỹ thuật · Nội thất` ở thanh công cụ dưới — nhìn thấy trên màn 11:40).
⇒ dòng sổ `G-M15-02`.

### Ba mô tả `tagline` hiện tại cũng cần rà lại theo chốt này
| Chặng | tagline hiện (`lib/phases.ts`) | khớp chốt? |
|---|---|---|
| `concept:36` | *"Import CAD 2D · vẽ sơ phác · bố trí furniture"* | thiếu **Revit 2D** và thiếu khái niệm **2 mode** |
| `render:51` | *"Clay → photoreal · chỉnh cục bộ"* | thiếu **Revit 3D** và **dựng khối** |
| `present:88` | *"Slide · board · spec vật liệu"* | ✅ khớp |

### ⚠️ ĐỐI CHIẾU với `docs/IF1_IF2_BIGPICTURE.md` (19-20/07) — LỆCH 4 CHỖ

**🔴 Lệch 1 — HAI BỘ "3 CHẶNG" KHÁC NHAU, CÙNG MỘT CHỮ.** Bẫy từ vựng nặng nhất.
| Nguồn | "3 chặng" nghĩa là gì |
|---|---|
| `IF1_IF2_BIGPICTURE.md:41-48` | 3 chặng của **IF2**: ① CAD kỹ thuật ② BIM/IFC 4.0 ③ Viewer 3D web + clash/section-cut |
| **Chốt 07/08 (bản này)** | 3 chặng của **IF**: ① Thiết kế 2D ② Thiết kế 3D ③ Trình chiếu |
⇒ Phiên nào đọc BIGPICTURE trước sẽ hiểu "chặng 3" = Viewer 3D, không phải Trình chiếu.
**Từ nay: "chặng" CHỈ dùng cho bộ ①②③ của chốt này.** Bộ của IF2 phải gọi là **"mảng IF2"**,
không được gọi là chặng. Ai gặp chữ "chặng" trong file cũ phải đọc lại ngữ cảnh, đừng suy ra.

**🔴 Lệch 2 — mode: người dùng CHỌN hay app TỰ ĐỔI?**
`BIGPICTURE:22-25` ghi: *"Người dùng KHÔNG tự chọn mode bằng tay — tự động theo role + stage
(auto mode-switch, not user-toggled)"*.
Nhưng màn hình thật 11:40 **có dải cho người dùng bấm**: `Sơ phác · Kỹ thuật · Nội thất`
(thanh công cụ dưới, `components/cad/`). Và chốt 07/08 nói Thiết kế 2D **có 2 mode** — hàm ý chọn được.
⇒ **Trái ngược trực tiếp. Cần Hoà chốt lại** — xem mục hỏi cuối.

**🟡 Lệch 3 — 3ds Max**
`BIGPICTURE:57-59`: *"dùng Blender (free) + Cycles thay 3ds Max/V-Ray… Không xây 'app 3ds Max' riêng"*.
Chốt 07/08: *"dựng khối giống 3D max"*.
⇒ Đọc là **giống về CÁCH THAO TÁC dựng khối**, KHÔNG phải xây lại 3ds Max. Nhân lõi vẫn Blender.
Ghi rõ ở đây để phiên sau không hiểu thành "làm app 3ds Max".

**🟡 Lệch 4 — Revit chưa có chỗ trong BIGPICTURE**
BIGPICTURE nhắc "Revit" đúng **1 lần**, không giao vai trò. Chốt 07/08 giao rõ:
Revit **2D** → chặng ①(mode Chuyên) · Revit **3D** → chặng ②.
⇒ BIGPICTURE cần bổ sung, hoặc đánh dấu là bản cũ.

### ✅ [07/08 Hoà chốt] MODE: **NGƯỜI DÙNG TỰ BẤM CHỌN**
> *"người dùng tự bấm chọn."* · *"ở thiết kế 3D cũng vậy"*

**Áp cho CẢ HAI chặng có mode:**
| Chặng | Mode | Ai đổi |
|---|---|---|
| ① Thiết kế 2D | Sơ phác · Chuyên (gồm Revit 2D) | **người dùng bấm** |
| ② Thiết kế 3D | Dựng khối · Render | **người dùng bấm** |

⇒ `IF1_IF2_BIGPICTURE.md:22-25` — *"Người dùng KHÔNG tự chọn mode bằng tay — tự động theo
role + stage (auto mode-switch, not user-toggled)"* — **BỊ HUỶ**, đó là bản 20/07.
Vai trò (`role`) vẫn dùng cho **quyền hạn** (ai được sửa gì), KHÔNG dùng để **đổi mode thay người dùng**.

**Code hiện tại đã ĐÚNG hướng** — không cần đại phẫu:
`lib/cad/store.ts:155-159` `shouldShowProTools(role, stage, cadMode)`:
```
:156  if (cadMode === 'pro' || cadMode === 'revit') return true;   ← người dùng bấm, THẮNG trước
:157  if (role === 'owner') return true;
:158  return (role==='drafter'||role==='bim') && (stage==='technical'||stage==='bim');
```
Dòng `:156` đặt TRƯỚC hai dòng role ⇒ lựa chọn thủ công luôn được ưu tiên. Đúng chốt.
Comment ở `:156` gọi nó là *"override thủ công (backward-compat)"* — **sai chữ**: nay nó là
**đường CHÍNH**, không phải override. Sửa comment. ⇒ `G-M15-05`.

### 🔴 [07/08 Hoà chốt] BỎ CHỮ "CAD" KHỎI MỌI NHÃN NGƯỜI DÙNG THẤY
> *"có cad là sai thôi"*

"CAD" là từ nghề của dân kỹ thuật, không phải ngôn ngữ sản phẩm. Nhãn phải là **Thiết kế 2D**.

⚠️ **CHỈ đổi NHÃN. TUYỆT ĐỐI không đổi tên code** — `lib/cad/` · `components/cad/` ·
`useCadStore` · `CadMode` · route `/projects/[id]/cad` · khoá localStorage **GIỮ NGUYÊN**.
Đổi tên kỹ thuật là vỡ route, vỡ localStorage, vỡ DB — không đáng.

**14 chỗ hiển thị chữ CAD, đã grep** (`G-M15-06`):
| File:dòng | Chuỗi |
|---|---|
| `lib/phases.ts:37` | blurb *"mở/vẽ CAD"* |
| `components/present-editor/PresentEditor.tsx:337` | `'Bản vẽ CAD · CAD Layout'` |
| `components/render-studio/ModeSwitchCell.tsx:33` | *"khối đùn từ bản vẽ CAD"* |
| `components/LibraryPanel.tsx:25` | `'CAD / Sketch'` |
| `lib/library/types.ts:86` | `cad: { label: 'CAD' }` |
| `lib/refingest.ts:45` | `label: 'CAD / Bản vẽ'` |
| `lib/library/shelves.ts:155` | *"Dự toán live-link CAD"* |
| `app/library/ingest/page.tsx:16,291` | badge `'CAD'` + *"…/ Excel / CAD vào đây"* |
| `components/settings/GuModelSettings.tsx:130,131` | *"gợi ý bố trí CAD"* / *"CAD layout suggestions"* |
| `lib/nodes/registry.ts:210` | *"sketch hoặc CAD export"* |
| `lib/nodes/defs/render-v2.ts:292` | *"CAD→OBJ extrude"* |

> ⚖️ Cân nhắc: vài chỗ nói về **định dạng tệp** (DWG/DXF) thì chữ "CAD" vẫn đúng nghĩa —
> vd `app/library/ingest` (kéo-thả tệp CAD), `lib/refingest.ts` (phân loại tệp).
> Chỗ nào chỉ **CHẶNG LÀM VIỆC** thì bắt buộc đổi thành "Thiết kế 2D".
> Phiên sửa phải phân loại từng dòng, KHÔNG thay thế hàng loạt.

---

## [07/08 Hoà chốt] `.idfc` — ĐƠN VỊ CẤU KIỆN + GỘP THƯ VIỆN VỀ MỘT TẤM

### ① Format `.idfc` — một tệp = MỘT CẤU KIỆN
| | Phạm vi | Ví von |
|---|---|---|
| `.idf` | **một DỰ ÁN** — mặt bằng, tầng, mọi bản chèn | Revit `.rvt` |
| **`.idfc`** | **một CẤU KIỆN** — dùng lại được ở mọi dự án | Revit `.rfa` |

**KHÔNG phá luật `10a` "cấm đẻ format thứ hai"** — câu đó nhắm vào *ArchiNote đẻ schema riêng
cho cùng một dự án*. `.idf` và `.idfc` là **hai CẤP ĐỘ** của cùng một hệ, không phải hai format
cho cùng một thứ.

### Vì sao cần — hiện một cấu kiện đang bị CHẺ LÀM ĐÔI (đo 07/08)
| Phần | Ở đâu | Có gì | Thiếu gì |
|---|---|---|---|
| Hình học | `public/cad-library/manifest.json` — **54 block `.dxf`**, 12 nhóm | nét vẽ | **0 dữ liệu** — không mã, giá, vật liệu |
| Tham số | `lib/cad/workstation-clusters.ts` — `CLUSTER_SPECS` **20 mục** | kích thước | **không lưu ra tệp được** (sinh trong code) |
| Dữ liệu | `model ProductSpec` (DB) — kind · name · brand · sku · vendor · w/d/hUp · materials · finishes | dữ liệu | **0 hình học** |

⇒ Ghế trong `ProductSpec` và ghế trong `.dxf` là **hai thứ khác nhau, không sợi dây nào nối**.
Đó là gốc của `G-A-01` (*"chọn vật liệu xong không dùng được"*).
**`.idfc` gói cả ba lại làm một.**

### ② Gộp THƯ VIỆN về MỘT TẤM DUY NHẤT
Hiện có **năm** khái niệm rời nhau (đo 07/08):
| Nơi | dòng | test | Là gì |
|---|---|---|---|
| `lib/library/` | 795 | 1 | *"Master Library / Kệ — KHÔNG lộ ra UI"* (`types.ts:15`) |
| `components/library/` | 1.599 | **0** | tấm Thư viện mới (`LibrarySheet`) |
| `components/LibraryPanel.tsx` | — | 0 | panel cũ |
| `components/NodeLibraryPanel.tsx` | — | 0 | thư viện **node** |
| `components/cad-library/` | 318 | **0** | tự khai *"DEMO độc lập"* (`BlockLibraryDemo.tsx:2`) |

**Chốt: gộp HẾT về một tấm**, chia kệ theo loại — **Cấu kiện · Vật liệu · Node · Ảnh tham chiếu**.
Khớp `docs/SPEC-STAGE-LIBRARIES.md` (kệ theo chặng, chốt 02/08).
⇒ `G-M16-01` · `G-M16-02`

### ③ [07/08 Hoà chốt — BỔ SUNG QUAN TRỌNG] `.idfc` GÓI ĐỦ CẢ BA CHẶNG + GIÁ + TIẾN ĐỘ
> *"nó gói luôn cả 3D của món đó nữa… mỗi chặng thông tin của idfc đều có thể hiểu:
> chặng 1 CAD/Revit, chặng 2 3D render, chặng 3 giá"*
> *"thay đổi 1 thứ trong cấu kiện là các chặng update theo kèm giá và tiến độ"*

**Đây là luật K1 áp XUỐNG CẤP CẤU KIỆN.** K1 nói ba chặng là ba ống kính soi vào MỘT nguồn.
`.idfc` làm đúng thế ở quy mô một món: **một cấu kiện = một nguồn, ba chặng đọc ba mặt của nó.**

```
                    ┌──────────  MỘT tệp .idfc  ──────────┐
                    │   ghế / tủ / thiết bị vệ sinh …     │
                    └───────────────┬─────────────────────┘
        ┌───────────────────────────┼───────────────────────────┐
   ① Thiết kế 2D              ② Thiết kế 3D               ③ Trình chiếu
   ký hiệu · block CAD        khối 3D · vật liệu PBR       giá · thông số
   dữ liệu Revit-style        để render                    bày cho khách
        └───────────────────────────┼───────────────────────────┘
                    SỬA MỘT CHỖ ⇒ CẢ BA CẬP NHẬT
                    kéo theo:  💰 GIÁ    📅 TIẾN ĐỘ
```

#### Ba mặt của một `.idfc`
| Chặng | `.idfc` cấp gì | Code ĐÃ CÓ (đo 07/08) | Thiếu |
|---|---|---|---|
| ① Thiết kế 2D | ký hiệu 2D · block CAD · dữ liệu kiểu Revit | 54 block `public/cad-library/*.dxf` · `lib/cad/block-library.ts` · `library-item-resolve.ts` | không mang dữ liệu |
| ② Thiết kế 3D | khối 3D · vật liệu PBR · để render | `lib/three/cad-to-obj.ts` (2D→3D extrude) · `csg.ts` · `lighting.ts` · `lib/materials/pbr-from-category.ts` (`inferPbrFromCategory`) · `export-d5.ts` · `export-vray.ts` | 3D suy từ mặt bằng, KHÔNG gắn vào cấu kiện |
| ③ Trình chiếu | giá · thông số bày cho khách | `ProductSpec.priceVnd` (Decimal, số thật) · `priceNote` (text) · `wastagePercent` | không nối từ bản chèn ngược về |
| **Tiến độ** | mỗi cấu kiện gắn việc & mốc | 🔴 **KHÔNG có model nào** — chỉ `LarkTaskRef` (mirror hệ ngoài, chỉ đọc) | **thiếu hẳn** |

#### Luồng lan truyền — điểm ăn tiền của sản phẩm
Đổi vật liệu ghế từ sồi sang óc chó ⇒ **một thao tác, năm nơi tự đổi**:
```
.idfc (ghế)  ─┬─→ ① bản vẽ 2D    ký hiệu vật liệu · ghi chú đổi theo
              ├─→ ② phối cảnh 3D  PBR đổi ⇒ render ra gỗ óc chó
              ├─→ ③ hồ sơ khách   thông số + ảnh đổi theo
              ├─→ 💰 BOQ/dự toán  đơn giá đổi ⇒ tổng tiền tự tính lại
              └─→ 📅 tiến độ      đổi vật liệu ⇒ đổi thời gian đặt hàng/thi công
```
> Ví von: hôm nay đổi vật liệu ghế thì phải sửa bản vẽ, sửa file 3D, sửa bảng giá, báo lại tiến độ
> — **bốn nơi, bốn lần, và luôn sót một chỗ**. `.idfc` biến bốn lần thành **một lần**.
> Đây là thứ Revit·SketchUp·D5 KHÔNG có (họ phải xuất–nhập giữa các app).

#### ⚠️ Ba ràng buộc kỹ thuật
1. **Một chiều, không hai chiều.** `.idfc` → các chặng. Chặng KHÔNG ghi ngược vào `.idfc` gốc
   (sửa ghế ở dự án A không được đổi ghế mẫu của cả kho). Muốn đổi mẫu gốc phải vào Thư viện,
   có xác nhận. Luật KS3 (duyệt từng phần) + KS4 (lùi được).
2. **Bản chèn giữ liên kết + giữ ĐÈ cục bộ.** Dự án này muốn ghế cao 450 thay vì 420 ⇒ ghi đè
   tại bản chèn, KHÔNG đổi `.idfc`. Dùng `srcInsertId` đã có (`model.ts`, G-M1-06/07/18 đã đóng).
3. **Tiến độ phụ thuộc `model Task`** — chưa có (`G-M10-01`, phiếu P1). ⇒ **`.idfc` làm trước
   phần ①②③ + giá; phần tiến độ nối SAU khi P1 xong.** Đừng chặn nhau.

⇒ `G-M16-03` · `G-M16-04`

#### ⚠️ BỔ SUNG 07/08 — `.idfc` áp cho CẢ BA LOẠI, và VẬT LIỆU là gốc
Hoà chốt: *"logic vật liệu → sử dụng trong thư viện — đây là nguồn vật liệu chung… đổi 1 vật liệu
→ các dữ kiện khác đổi theo, tương tự furniture và Fit-out cũng vậy"*.

| Loại | Gói gì |
|---|---|
| **Vật liệu** | thông số kỹ thuật · texture (PBR) · đặc tính · nhà cung cấp · giá · kỹ thuật thi công |
| **Furniture** | y như trên + hình học + tham số |
| **Fit-out** | y như trên |
⇒ **Vật liệu là GỐC** — furniture cũng làm bằng vật liệu, nên sửa vật liệu là furniture đổi theo.

**🔴 Hiện trạng đo 07/08 — vật liệu bị chẻ BA, không mảnh nào biết mảnh nào** (`G-M17-01`):
| Mảnh | Ở đâu | Có | Thiếu |
|---|---|---|---|
| THỊ GIÁC | `lib/materials/schema.ts` `MaterialPbr` | 14 thông số PBR chuẩn glTF | 0 giá · 0 NCC · 0 thi công |
| THƯƠNG MẠI | `ProductSpec` (DB) | vendor·supplierId·priceVnd·wastagePercent·packagingSpec | 0 thông số render |
| 2D | `lib/cad/materials.ts:29` `MaterialDef` | hatch·color·tones | **0 khoá nối ProductSpec** |
`grep "ProductSpec" lib/materials/*.ts` = **2 dòng COMMENT, 0 code nối**.

⚠️ **Luật 2.1.9.i (30/07) cố ý tách hai bên — và nó CÓ LÝ**: render engine không cần biết giá;
giá đổi hằng ngày còn texture thì không. ⇒ **Cách sửa KHÔNG phải nhồi giá vào PBR.**
Cách đúng: **thêm KHOÁ NỐI** để một cấu kiện `.idfc` trỏ được tới cả ba mảnh.
Ba mảnh giữ nguyên vai trò, chỉ thêm dây.

---

## [07/08 chiều — TỔNG quyết, Hoà uỷ quyền] TẤM THƯ VIỆN: NỚI 960px + BA NẤC CỠ THẺ

> Hoà: *"card bị nhỏ, cảm giác quá bó hẹp không cần thiết"* · *"nghiên cứu app tương tự → bạn quyết"*

### Đo hiện trạng 07/08 (`components/library/library-sheet-css.ts`)
```
tấm      min(720px, 100vw−24px)   :61
cột kệ   214px                     :97
padding  12px 14px                 :134
lưới     minmax(122px,1fr) gap 11  :135
```
⇒ lưới còn **478px** ⇒ `478 ÷ (122+11)` ≈ 3,5 ⇒ **3 cột, thẻ ~141px**.
Ảnh xem trước ~141×80px — quá nhỏ để phân biệt vân gỗ sồi với óc chó.

### Tra ngành — D5 Render và Blender ĐỀU có núm chỉnh cỡ thẻ
Không app nào cố định một cỡ. Lý do: cùng một thư viện, lúc cần **lướt nhanh 40 món**,
lúc cần **soi kỹ một vân**. ⇒ Sáng nay tôi chốt sai hướng: đi tìm *một cỡ đúng*,
trong khi ngành để **người dùng tự chỉnh**.

### ✅ QUYẾT ĐỊNH
**① Nới tấm 720 → 960px.** Mock gốc vẽ 980. Số 720 là TỔNG tự hạ sáng 07/08 vì tưởng cột
thông số chiếm chỗ thường trực — nhưng cột đó CHỈ hiện khi chọn món (chốt phương án A),
nên lúc duyệt tấm rộng được. Lưới: 478 → **718px**.
⚠️ Giữ `min(…, 100vw−24px)` — màn hẹp vẫn không tràn.

**② BA NẤC CỠ THẺ** — người dùng bấm chọn, NHỚ lựa chọn (localStorage):
| Nấc | `minmax` | Cột (lưới 718) | Dùng khi |
|---|---|---|---|
| Nhỏ | 122px | 5 | lướt nhanh, biết mình tìm gì |
| **Vừa** ⭐ mặc định | **168px** | **4** | cân bằng |
| Lớn | 232px | 3 | soi vân, chọn vật liệu |
Mặc định **Vừa**: ảnh ~168×95 — đủ phân biệt vân. Cỡ 141px hiện tại thì không.

**③ Nấc LỚN hiện thêm kích thước `w×d×h`** — chốt 07/08 nói dân thiết kế cần con số này
trước tiên. Thẻ nhỏ không đủ chỗ; thẻ lớn thì có.

### Không đổi
· cột kệ **214px** (chốt sáng 07/08) · tấm nổi giữa, KHÔNG dính đáy ·
· cột thông số CHỈ hiện khi đang chọn món, trượt vào từ phải ·
· chuyển cảnh 180–220ms, êm
⇒ `G-M19-01`

---

## Chốt 07/08 (tối) — CHẶNG 3 & giới hạn đầu ra

Hoà chốt trực tiếp, **đảo ngược một số chốt cũ**. Chốt cũ nào trái với dưới đây đều HẾT HIỆU LỰC.

### 1. BỎ giới hạn "gói trong ≤5 sheet" — ở TẤT CẢ các chặng
Nguyên văn: *"bỏ vụ gói trong 5 sheet ở tất cả các chặng, ko gói nữa"*.
`docs/IF-PRESENT-STAGE-SPEC.md` mở đầu bằng *"xuất PDF/PPTX/PNG, gói trong ≤5 sheet"* — **hết hiệu lực**.
Hồ sơ nội thất thật có bao nhiêu trang thì ra bấy nhiêu; số trang do NỘI DUNG quyết định, không do
một con số đặt sẵn. Mọi chỗ trong code/spec còn ép trần 5 phải gỡ.

### 2. LÀM auto-deck 1 click — người duyệt cuối + sửa được
Nguyên văn: *"chốt làm auto-deck 1 click - người duyệt cuối + edit"*.
⚠️ **Đảo ngược** mục ⛔ KHÔNG LÀM trong `IF-PRESENT-STAGE-SPEC.md` (*"auto-deck-from-nothing 1-click
(Magic Design không người duyệt)"*). Lý do chốt cũ là "không người duyệt"; nay có **người duyệt cuối
+ sửa tự do** nên rào đó không còn. Human-in-the-loop giữ nguyên — máy dựng xong, người xem và sửa,
KHÔNG tự xuất bản.

### 3. BỎ giới hạn 25 template
Nguyên văn: *"25 template kia ko nên giới hạn trong 25 - bỏ giới hạn"*.
Template là kho mở, người dùng tự thêm/tự lưu (nối với gap "lưu template tự tạo" đã ghi trong spec).

### 4. Bố cục TỰ CHUYỂN khổ — A3/A4, ngang/dọc — **ĐANG BỊ LỖI**
Nguyên văn: *"BỐ CỤC AUTO CHUYỂN ĐỔI TỪ A3 A4, NGANG DỌC V.V.... ĐANG BỊ LỖI"*.
Đây là BÁO LỖI, không phải yêu cầu tính năng mới — Hoà đã thấy nó chạy sai. Phải đo và sửa.

### 5. Giải mâu thuẫn dàn trang ↔ chiếu đa đích — LÀM CẢ HAI
Nguyên văn: *"giải mâu thuẫn dàn trang - chiếu đa đích, cái nào cũng hay"*.
Hai hướng KHÔNG loại trừ nhau: `.idf` là cây cú pháp (nguồn sự thật), chặng 3 chiếu nó ra nhiều đích
(PDF · PPTX · XLSX · MP4 · bản in), và **trình dàn trang là MỘT trong các đích đó** — đích duy nhất
cho người sửa tay. Xem `docs/TU-VAN-CHANG-3-VA-IF2-2026-07-30.md`.

### 6. Đào lại nghiên cứu video editor đã chốt
`docs/SPEC-TRINH-VIDEO-EDITOR.md` — cần đọc lại và nối vào bức tranh chặng 3 mới.

---

## Chốt 07/08 (tối, tiếp) — TRIẾT LÝ NỀN CỦA TOÀN APP

### 7. ⭐ CẢ APP LÀ PIPELINE CÓ NGƯỜI TRONG VÒNG LẶP — luật nền, đứng trên mọi luật khác

Hoà chốt nguyên văn:
> *"Thật ra cả tổng app đều là những FLOW lớn nhỏ được thiết kế dạng PIPELINE có human-in-loop.
> AI đóng vai trò LINH HOẠT trong chuỗi — có khi tạo nội dung cho người duyệt, có khi tham vấn
> cho người tạo nội dung. Nhưng ĐÍCH ĐẾN thì phải cho NGƯỜI EDIT ĐƯỢC để không bị động."*

Ba hệ quả bắt buộc, áp cho MỌI tính năng từ nay:

**① AI có hai vai, không cố định vai nào:**
   · *người sản xuất* — máy dựng trước, người duyệt và sửa (auto-deck, gợi ý bố cục, suy loại cấu kiện)
   · *người tham vấn* — người dựng, máy góp ý (kiểm chuẩn, cảnh báo lệch, gợi ý vật liệu)
   Cùng một tính năng có thể đổi vai tuỳ ngữ cảnh. KHÔNG ép một vai cứng cho cả app.

**② ĐÍCH ĐẾN PHẢI SỬA ĐƯỢC — đây là luật cứng, không có ngoại lệ.**
   Mọi thứ máy sinh ra ở bước cuối phải mở ra sửa được bằng tay. Xuất ra file chết
   (người dùng không sửa được, phải quay lại làm lại từ đầu) = **BỊ ĐỘNG** = sai thiết kế.
   Áp cụ thể: PPTX xuất ra chữ phải sửa được (đã có) · MP4 phải mở lại trong trình dựng
   (spec video §1) · bảng tính phải sửa ô · bản in phải chỉnh trang · deck phải kéo thả lại.

**③ Không bước nào được là hộp đen một chiều.** Mỗi bước trong chuỗi phải có: xem trước ·
   sửa · lùi lại. Trái luật này là trái §KS3 (duyệt từng phần) + §KS4 (lùi được) đã chốt.

### 8. Chặng 3 = ĐA ĐÍCH, không phải chỉ deck ảnh — **và việc này ĐÃ SPEC, đang bị HOÃN**
Hoà: *"đâu phải chỉ present hình ảnh, còn video, pptx, trình chiếu HTML, bảng tính…"*
⚠️ Đo 07/08: **5 loại hồ sơ ĐÃ CHỐT VÀ ĐỦ SPEC** — Deck · Bảng vật liệu A3 · BOQ · Văn bản · Video
(`docs/BAO-CAO-COWORK-TRINH.md:3,61,66`). Màn chọn loại là **H4**, đang **HOÃN theo chỉ đạo cũ**
(`802f808` *"hết chuỗi H, H4 hoãn"*). ⇒ Việc cần làm KHÔNG phải thiết kế mới, mà là **BỎ HOÃN H4**
và dựng màn chọn đích đến. Bổ sung so với spec cũ: **trình chiếu HTML** (loại thứ 6, chưa có spec).

### 9. Logo IF màu tím là SAI
Hoà chốt 07/08. Cần bộ nhận diện riêng cho InteriorFlow, KHÔNG dùng màu accent tím của giao diện
làm logo. 🔶 CHỜ HOÀ cấp hướng màu/hình thay thế.

### 10. Tay cầm thu/mở panel của chặng Trình chiếu = MẪU CHUNG cho toàn app
Hoà chốt 07/08: *"thanh này ở chặng presenting làm rất tốt nên áp dụng cho toàn hệ thống có thiết kế tương tự"*.

**Mẫu:** dải dọc mảnh sát mép panel, giữa có mũi tên `›` / `‹`. Bấm là panel thu vào / mở ra.
Ưu điểm khiến nó đáng nhân bản: chiếm gần như 0 diện tích khi không dùng · vị trí đoán được
(luôn ở mép panel) · một cú bấm, không menu · thu rồi vẫn thấy tay cầm để mở lại (không "mất tích").

**Áp cho mọi panel bên trong app.** Đo 07/08 — hiện rất lệch:
| Vùng | file có cơ chế thu/mở |
|---|---|
| `components/library/` | **0/7** ⚠️ tấm Thư viện, panel to nhất |
| `components/cad/` | 2/20 |
| `components/render-studio/` | 2/18 |
| `components/studio/` | 3/31 |
| `components/nodes/` | 5/10 |
| `components/dashboard/` | 1/2 |

⇒ Việc: tách tay cầm thành **một component dùng chung** (không chép code 6 lần), rồi lắp vào mọi
panel bên. Trạng thái thu/mở phải **nhớ được** giữa các phiên làm việc.

---

## Chốt 07/08 (khuya) — ⭐ MỌI THỨ TRONG THƯ VIỆN ĐỀU LÀ `.idfc`

Hoà chốt nguyên văn:
> *"Theo mình tất cả đều là idfc thì hợp lý hơn, gom gọn gàng lại và phân loại rõ ra. Mỗi một mẫu
> trong thư viện kể cả video hay template đều ở dạng cấu kiện hết. Như vậy mới liên kết mật thiết
> với nhau, và đúng tinh thần dữ liệu linh hoạt."*

⚠️ **Đảo ngược cách làm hiện tại**: mỗi kệ đang có định dạng riêng, cơ chế riêng.

### 11.1 · Vì sao
Gom về một định dạng thì **mọi cơ chế chung chỉ viết MỘT lần**: version + bảng nâng cấp · phạm vi
(chung/studio/dự án/chặng) · thumbnail · tìm kiếm · "đưa lên kệ" · quyền · nhập/xuất.
Hiện mỗi kệ tự làm lấy — đó là lý do kệ Mẫu trang không có thumbnail thật còn kệ Vật liệu thì có.
Và **liên kết chéo** mới là phần đắt nhất: mẫu trang tham chiếu vật liệu · video tham chiếu cấu kiện
· bộ nhận diện dùng chung cả hồ sơ. Khác định dạng thì không tham chiếu chéo được.

### 11.2 · Cấu trúc — VỎ CHUNG + RUỘT THEO LOẠI (bắt buộc)
⛔ **KHÔNG làm thành một interface phẳng với mọi trường optional.** `IdfcFile` hiện bắt buộc có
`geom2d`; mẫu video không có hình học 2D. Nhét hết vào một kiểu rồi để optional ⇒ kiểu 40 trường mà
mỗi loại dùng 5, máy không kiểm được gì, mọi hàm phải `if (x.geom2d)` khắp nơi.

```
IdfcFile
├── meta        ← VỎ CHUNG, mọi loại đều có
│   id · tên · mã · kind · phạm vi · thẻ · phòng? · người tạo · ngày
├── body        ← RUỘT, đổi theo kind (discriminated union)
│   component  → geom2d · geom3d? · params?
│   material   → pbr · hatch2d?
│   page       → slide            (mẫu trang · bảng vật liệu A3 · biểu mẫu dự toán)
│   video      → shots · nhạc?
│   doc        → template văn bản
│   asset      → ảnh tham chiếu
│   brandkit   → logo · màu · font
├── commerce?   ← giá, chỉ loại nào bán được
└── progress?   ← tiến độ, chờ `model Task` (P1)
```
Vỏ chung ⇒ tính năng chung viết một lần. Ruột theo loại ⇒ máy vẫn kiểm được "video KHÔNG được có
`geom2d`". Đây là discriminated union — cách TypeScript làm đúng cho ca này.

### 11.3 · Ba điểm Hoà đã gật (07/08)
**① `geom2d` chuyển từ bắt buộc → vào `body`.** Đây là ĐỔI CẤU TRÚC FILE. `IDFC_MIGRATIONS`
(`lib/cad/idfc.ts`) hiện RỖNG ở v1 — đây là lần đầu phải dùng nó thật. Không phải đổi một dòng.
Phải có hàm nâng v1→v2 + test round-trip cho file cũ.

**② Chữ "C" trong `.idfc` đọc là CONTENT, không còn là Component.** Vì video và văn bản cũng là
`.idfc`. Giữ nguyên phần mở rộng tệp (đã quen, đã có code), chỉ định nghĩa lại nghĩa trong sổ này
để phiên sau không cãi.

**③ Sidebar Thư viện gộp lại, chia theo `kind`.** Nhóm "Cấu kiện (.idfc)" riêng biệt BIẾN MẤT —
vì mọi thứ đều là nó. Bốn nhóm hiện tại (CẤU KIỆN · VẬT LIỆU · ẢNH THAM CHIẾU · MẪU & HỒ SƠ)
thay bằng danh sách theo `kind`.

### 11.4 · Hai trục phân loại — độc lập, KHÔNG trộn
**Trục ① LOẠI (`kind`) — *nó là cái gì*.** Dùng cho thumbnail · lọc · bảng khối lượng · chia thầu:
| kind | Việt | Gồm | Ai thi công |
|---|---|---|---|
| `material` | Vật liệu hoàn thiện | gỗ · đá · sơn · vải · kim loại · kính · gạch | thầu hoàn thiện |
| `furniture` | Đồ rời | bàn · ghế · sofa · giường · tủ rời | mua sẵn / đặt xưởng |
| `millwork` | Đồ mộc đóng | tủ bếp · tủ áo âm tường · kệ liền tường · quầy · vách gỗ | xưởng mộc, đo tại chỗ |
| `fitout` | Chi tiết hoàn thiện | phào chỉ · nẹp · ốp tường · trần thả · tay nắm | thầu hoàn thiện |
| `fixture` | Thiết bị cố định | đèn · thiết bị vệ sinh · vòi · bếp · điều hoà | thầu M&E |
| `soft` | Đồ vải | rèm · thảm · gối · ga | mua riêng |
| `page` · `video` · `doc` · `asset` · `brandkit` | (mẫu & hồ sơ) | — | — |
Sáu loại đầu đúng cách hồ sơ nội thất **chia thầu** — mỗi loại một nhà thầu, một dòng hợp đồng,
một cách báo giá. Không phải chia cho đẹp.

**Trục ② PHÒNG — *dùng ở đâu*.** Giữ `BlockGroup` 10 nhóm. ĐỘC LẬP với trục ①: một cái đèn
(`fixture`) dùng ở cả phòng khách lẫn phòng ngủ.

Ba việc chỉ làm được khi TÁCH hai trục: **lọc chéo** ("đồ mộc đóng ở bếp") · **bảng khối lượng theo
thầu** (gom `millwork` gửi xưởng mộc) · **thumbnail đúng bản chất** (đồ mộc đóng vẽ CÓ TƯỜNG phía
sau vì nó dính tường · đồ rời vẽ đứng tự do · chi tiết hoàn thiện vẽ MẶT CẮT — ba cách vẽ khác nhau).

---

## Chốt 07/08 (khuya, tiếp) — KHUNG KIỂM BA CHẶNG

### 12 · HAI LỚP KIỂM, TUYỆT ĐỐI KHÔNG TRỘN
Hoà nêu 07/08: muốn kiểm thêm *"đúng concept chưa · đèn đúng phối cảnh chưa"* ở chặng 2D,
*"logic câu chuyện · kẽ hở · thẩm mỹ · bố cục"* ở chặng 2 và 3.

| | **LỚP LUẬT** (đang có) | **LỚP GÓP Ý** (thêm) |
|---|---|---|
| Ví dụ | cửa thoát ≥800mm · hành lang ≥1200mm | bố cục lệch · ánh sáng không hợp |
| Kết quả | đúng/sai, có số | *"theo nghề thì thường…"* |
| Chạy 10 lần | giống nhau | mỗi lần một khác |
| Dẫn nguồn | ✅ điều khoản | ⚠️ chỉ thông lệ |
| Sai thì | có thể không nghiệm thu được | ý kiến, có thể cố ý |
| Ai chạy | máy thuần, 0đ | AI |

⛔ **Trộn hai lớp là hỏng cả hai.** App nói *"thiếu lối thoát hiểm"* và *"màu hơi lỗi mốt"* cùng
giọng đỏ ⇒ người dùng học cách bỏ qua CẢ HAI. `CHOT-TACH-AI-VA-CHINH-TAY.md` §1 đã ghi:
*"AI đoán, chỉnh tay chắc chắn — trộn hai thứ vào cùng một chỗ là lừa người dùng."*
⇒ **Cùng một bảng, KHÁC DẤU**: luật → đỏ/vàng + dẫn điều khoản + nút sửa;
góp ý → dấu Magic tím + glyph Vitals + chữ "gợi ý" + **không bao giờ chặn**.

### 12.1 · Khung chung `lib/review/` cho cả ba chặng
Không viết thêm luật (đã có 3.074 dòng / 11 bộ ở `lib/cad/standards/`). Chỉ dựng khung:
`types.ts` (Finding: lớp · mục · nguồn · vị trí · cách sửa) · `luat/` cắm bộ luật theo chặng ·
`gopy/` lớp AI. Một khung ⇒ một cách hiện, một cách sửa, MỘT CHỖ NGỒI cố định (4 luật chỗ ngồi).

### 12.2 · Luật đo được thêm cho chặng 3D — KHÔNG cần AI
đèn khớp bóng đổ (thuần hình học) · độ rọi theo công năng (`vn-lighting.ts` đã có, chưa nối 3D)
· khối hở/mặt không kín.

### 12.3 · Ba cấm cho lớp góp ý
① **KHÔNG chấm điểm.** *"Bố cục 7/10"* vô nghĩa, người dùng sẽ cãi. Phải là CÂU QUAN SÁT
   cụ thể, nói được lý do, sửa được ngay.
② **KHÔNG nói xu hướng** trong đợt đầu — xu hướng đổi theo năm, mọi bảng xu hướng đều có chủ
   sở hữu (IF vừa dọn Pantone đúng vì chuyện này). Muốn nói phải DẪN NGUỒN công bố công khai.
③ **KHÔNG bao giờ chặn** — góp ý không được ngăn xuất file, giao hồ sơ.

### 12.4 · Góp ý về concept CHẶN BỞI màn đề bài
Máy không biết *"đúng concept chưa"* nếu không ai khai concept. Kiểm concept = **so với ĐỀ BÀI
đã ghi**, không phải so với "cái đẹp chung chung". Màn đề bài đang là panel lọt trong màn vẽ
(`G-M5-11`) ⇒ **làm màn đề bài trước, rồi mới làm góp ý concept.**
[08/08 Hoà chốt — THUẬT NGỮ LỆNH DỰNG HÌNH GIỮ TIẾNG ANH] Array·Bevel·Chamfer·Loft·Sweep·Revolve·Mirror·Fillet·Offset·Extrude·Boolean là thuật ngữ nghề quốc tế (dân 3ds Max/SketchUp đọc là hiểu, IF là sản phẩm global — dịch VI bắt họ dịch ngược trong đầu). Cách hiện: nút ghi TÊN ANH dòng chính + dòng nhỏ giải thích tiếng Việt (vd "Array / lặp khối theo lưới"). RANH GIỚI: CHỈ áp cho tên LỆNH DỰNG HÌNH — tên chặng (Thiết kế 2D/3D/Trình chiếu), điều hướng, trạng thái, câu giải thích vẫn VI/EN theo ngôn ngữ giao diện. Mẫu áp đầu tiên: mục Array ở Command3DPanel tab Sửa + dòng nhập nhanh Viewport3D (nhánh feat/p14-build-ops-ui).
[08/08 — TỔNG quyết theo uỷ quyền Hoà "vấn đề kỹ thuật bạn quyết"] **DWG §11d chốt HƯỚNG (a)**: nhánh timeout tự động cũng BỎ RƠI worker đang cày như đường Huỷ (terminate giữa convertEx treo cứng tab, §11c tái hiện 3 lần; hồ mồ côi trần 2 con giữ nguyên; worker rảnh vẫn terminate) — code `lib/cad/dwg-map.ts` + test [1] `dwg-import.test.ts` đã đổi theo, 32/32 pass. GPL-3.0 libredwg: Hoà chốt "trước mắt công cụ nội bộ (không conveying = không kích hoạt nghĩa vụ GPL), phát hành tính sau" — lộ trình khi phát hành đã nghiên cứu sẵn ở `RESEARCH-DWG-LICENSE.md` (ngắn hạn A+D server-parse + DXF, dài hạn ODA khi IF2 cần GHI DWG); cổng chặn phát hành giữ nguyên LICENSE-NOTES §7. Dọn lịch sử git: script `scripts/don-git-lich-su.sh` soạn sẵn, CHỈ chạy lúc yên tĩnh đủ 4 điều kiện đầu file.
[08/08 — ĐÍNH CHÍNH mục 9 "Logo IF màu tím SAI, CHỜ HOÀ"] Logo IF ĐÃ CÓ ĐỦ từ trước, mục 9 lỗi thời: mark "|F" 3 biến thể `components/entry/IFLogo.tsx` (19/07, currentColor INK/CREAM, cấm accent) đã mount header AppChrome + LoginScreen + trang share; icon Electron + icon-192/512 đã là |F; tài liệu hoá đầy đủ ở `docs/mocks/if-design-system.pdf` ("InteriorFlow — Design System v1", lưới 44×44, path SVG, luật NÊN/KHÔNG NÊN, 2 tầng màu BRAND/PRODUCT). Vết tím CUỐI CÙNG là `public/apple-touch-icon.png` (bản 05/07 gradient tím) — 08/08 đã thay bằng |F resize từ icon-512. Mục 9 ĐÓNG.
[08/08 — chốt lượt p3c ĐÓNG + duyệt đề xuất entityId] Phiên p3c bàn giao xong (ReviewPanel 3 chặng, số đo DOM thật, merge `aa8002a`); server 3012 dừng, worktree + nhánh p3c đã dọn đủ 4 điều kiện. **Duyệt đề xuất p3c: thêm `entityId?` (optional) vào hợp đồng `Violation` lib/review** để chặng 2D select được đối tượng lỗi thay vì chỉ zoom — additive, làm ở phiếu review kế tiếp. 3 treo nhỏ p3c bàn giao lại: gốc rễ Prisma không tự nạp .env trong worktree · nhảy-tới chặng deck (chờ p12 mở cửa đọc slides) · ảnh theme tối ReviewPanel. Worktree `.worktrees/p3-mock` (nhánh `feat/p3-mock-doi-chieu`) đã DỰNG LẠI + npm install — dán phiếu `DAN-VAO-p3.md` là chạy.
[08/08 — xử báo cáo p13 vòng 4 + chốt lượt phiên Thư viện] ① Phiên Thư viện chốt lượt: 4 file (specLinks gán tay · badge Tham số · OUT) đã KIỂM ĐỘC LẬP (101 test + tsc 0 + browser 3000 sau khi phiên điều phối dọn 5 server rác/.next hỏng) và COMMIT. ② Câu hỏi p13 "thêm kind `preset`?": **DUYỆT thêm ở v3** — kệ "Preset dựng ảnh" đã là kệ THẬT 5 mục trên UI (có nơi tiêu thụ, đúng kỷ luật SPEC-SEMANTIC-MODEL §3); map `asset` chỉ là tạm, làm khi mở phiếu .idfc kế. ③ Luật mới theo đề nghị p13 (suýt-sự-cố stash): **CẤM `git stash`/`checkout`/`reset` trong working tree nhiều phiên chung** — muốn đo HEAD thì dùng `git show HEAD:path` hoặc worktree riêng. ④ Ghi nhận vận hành: 1 thư mục repo hôm nay từng gánh 5 server node (3000+3001+65040+52579+61120+61642 rơi rớt từ các lượt preview) làm `.next` hỏng, route 200→404→500 xen kẽ — đúng bệnh §0aa; đã dọn về ĐÚNG 1 server/thư mục (3000 chính · 3007 p7). Phiên nào xong lượt PHẢI preview_stop server mình mở.
[08/08 — 42 SPEC ĐÃ ĐỐI CHIẾU XONG] 4 agent đọc tay toàn bộ 42 spec văn xuôi ↔ code, kết quả gom `docs/DOI-CHIEU-42-SPEC-2026-08-08.md`: 14 kho-chưa-mở (đòn bẩy #1 = mở `BuildOp` union model.ts:449 → 9 hàm build-ops sống · #2 = client gửi docContext cho Vitals — engine server sẵn) · 12 chỗ spec NÓI SAI hiện trạng (EDITOR-TOOLKIT/GANTT-DATA/3D-CORE/MATERIAL-PIPELINE... đã lỗi thời — ĐỌC SỔ NÀY TRƯỚC KHI TIN SPEC) · 2 mâu thuẫn chờ Hoà (ChatMessage không projectId trái SPEC-COLLAB §1 · Neufert đang ship trái SPEC-KNOWLEDGE §5). soi-that.mjs vá lần 2 (nơi gọi cùng file) → 26✅/0🟡/5❌ đều giải thích xong. Cùng phiên: 3 agent code đã commit (openingsWidthOnBoundary T4 · dải mode 2D về 2 nút · Violation.entityId).

[10/08 — CHỐT HỆ PHÍM TẮT TOÀN APP] IF là app nghề nghiệp: mọi lệnh **đã chạy được** phải có
đường bàn phím thật và được tra từ một nguồn chung; tooltip, bảng `⌘/` và bảng lệnh `⌘K` không
được khai lệch hành vi. Ưu tiên quy ước nghề/OS quen thuộc; không kích hoạt khi đang nhập chữ;
không cướp tổ hợp OS/trình duyệt nếu nền web không chặn đáng tin cậy. Lệnh chưa đủ điều kiện chạy
phải hiện mờ kèm lý do, không gán phím giả. Mốc đầu: `⌘P`/`Ctrl+P` mở preview/xuất PDF Paper.

[10/08 — CHỐT DESIGN DNA + CAMERA INTENT] Design DNA trích hình thái/motif có nguồn, tách khỏi
Material Intelligence; Camera Intent luôn bung thành polyline/keyframe sửa được và chỉ xác nhận va
chạm sau khi kiểm scene thật. Xem `docs/CHOT-DESIGN-DNA-CAMERA-2026-08-10.md`.

[11/08 Hoà chốt — HỆ TÊN CẤP LÕI + TẦNG WORKSPACE] Cây hệ thống: CẤP 0 Nền (Desktop Electron = bản CHUẨN full · Web = cổng kết nối · Touch = LỚP thao tác, không phải bản riêng) → CẤP 0.5 WORKSPACE (cấp app: Tổng quan·Dự án&Flow·Files·Master Library·Bảng việc/Lịch/Gantt·Chat — cấp chặng: 2D Sơ phác/Chuyên/Paper · 3D Node/3D/Chiếu sáng/Render Studio · Trình chiếu 6 loại hồ sơ) → CẤP 1 tám hệ xuyên app: **Một Nguồn (DocCore) · Hợp đồng 4 câu (FeatureContract: tính năng phải khai Đọc gì·Ghi gì·Để lại công thức gì·Ai ăn theo) · Ánh Sáng Trạng Thái (LightState: LightArc tiến độ/LightRing focus/LightPulse cảnh báo — ánh sáng CHỈ mang nghĩa trạng thái, cấm trang trí, tuân G1/G9/reduce-motion) · Nấc Suy Nghĩ (ThinkDial 4 nấc Vitals: Trả nhanh/Cân bằng/Nghĩ sâu/Nghiên cứu — 4 tổ hợp engine đã có) · Công Thức Khối (BuildRecipe: BuildOp thành stack non-destructive) · Lắp Trước Dựng Sau (LibraryFirst) · Bắt Điểm Hợp Nhất (SnapCore 2D↔3D) · Undo Trước Hỏi Sau (confirm chỉ khi không undo được)** → CẤP 2 bốn mặt nhập lệnh cùng MỘT registry (Dòng lệnh+VCB desktop · Đĩa lệnh chạm-giữ touch · Dải số nổi touch · HotkeyMap) → CẤP 3 tool theo chặng. **Dây Việc–Ngữ Cảnh (TaskContext Link)**: Task thêm {stage, workspaceId?, entityId?} additive — bấm việc nhảy đúng workspace/đối tượng, từ workspace tạo việc tự gắn ngữ cảnh; đây là chỗ pipeline và task-lẻ gặp nhau. Bản tư vấn đầy đủ + bảng quan hệ + mâu thuẫn: `docs/TU-VAN-LOI-LUONG-2026-08-11.md`.
[11/08 đề xuất chờ Hoà gật] "Thẻ gu" đổi tên **Thẻ DNA Thiết kế (Design DNA Card)** — hợp nhất với chốt Design DNA 10/08, sang + global; N thẻ/dự án (mỗi phương án một DNA). Nghiên cứu 3 lớp người dùng + bảng IF-làm/KTS-làm/% tiết kiệm (ước tính theo cơ chế, đo thật khi R1): `docs/NC-KTS-SANPHAM-IF-2026-08-11.md`.
[11/08 Hoà đặt bài → CƠ CHẾ CHỐNG QUÊN FRONTIER] Sổ giấy mục theo thời gian — chỉ máy kiểm mới không quên. Từ nay: **`npm run soi:frontier` ĐẦU MỖI PHIÊN** (scripts/soi-frontier.mjs + frontier-registry.mjs) — registry máy-đọc-được liệt kê mọi frontier theo đợt/hệ, grep code thật, BÁO ĐỎ 2 chiều (khai xong mà bằng chứng mất = regress · khai chưa mà code có = sổ quên) và exit 1 chặn bàn-việc-mới khi còn lệch. KỶ LUẬT: chốt tính năng mới = thêm 1 entry registry NGAY LÚC CHỐT, trước khi code — chốt không vào registry coi như chưa chốt. Phát chạy đầu tiên đã bắt 3 lệch (2 regex ẩu tự vá, 1 đúng: Material A3 dùng symbol thường). Trạng thái 11/08: 5 xong · 17 chờ · 0 lệch.
[11/08 Hoà đặt bài → LUẬT CỨNG CHUẨN ĐẦU RA NGHỀ] Lần đầu MỞ FILE ĐẦU RA bằng mắt (layout.pdf): engine đủ giải phẫu bản vẽ nghề nhưng trượt vì chữ đè hình · tỷ lệ lẻ "1:47" · khung tên lộ jargon — kiểm code không bắt được loại lỗi này. Lập `docs/CHUAN-DAU-RA-NGHE.md`: checklist NHỊ PHÂN theo chuẩn ngành (ISO 128/216, dãy tỷ lệ chuẩn, khung tên 9 ô, nhãn né hình, dim ngoài hình, 300dpi, BOQ có nguồn giá, PPTX chữ sửa được, 0 placeholder) + cơ chế 2 tầng (máy chặn lúc xuất qua export-checks marker CHUAN_DAU_RA · mắt người tick checklist). **LUẬT NGHIỆM THU MỚI: frontier sinh file xuất được thì nghiệm thu = MỞ FILE ĐẦU RA soi theo chuẩn — tsc/test/screenshot KHÔNG đủ.** 4 entry mới trong frontier-registry (label-ne-hinh · ty-le-chuan · khung-ten-sach · chuan-dau-ra-gate).
[11/08 tối — Hoà đặt bài + Cowork nắn vật lý] ① "Nén thông minh nhẹ file không giảm chất lượng" là bất khả về vật lý — cơ chế THẬT thay thế: **Smart Ingest** = bản gốc bất biến (File Manager, luật B4) + proxy lossy chỉ để hiển thị (xuất/in luôn về gốc → chất lượng cuối không mất) + bộ định tuyến trích xuất theo yêu cầu (nâng GATEWAY B3 + refingest.ts sẵn có, mọi định dạng bỏ vào được). ② **Hồ Sơ Công Ty (Company DNA Pack)**: 4 ngăn quy trình·quy định·gu studio·thư viện riêng — app đọc THAM CHIẾU không nhúng cứng (mô hình Brand Kit/_studio nâng cấp công ty). ③ **Nhãn nguồn DataOrigin** (app-core/studio/project/demo) trên mọi bản ghi = CONTENT-RULES máy-đọc-được; "reset về trung tính" thành MỘT lệnh xoá theo nhãn. Cả 3 vào frontier-registry đợt 2. CHUAN-DAU-RA-NGHE là LUẬT (không gọi "tiêu chuẩn"). Agent NC danh mục sản phẩm 6 vai × 4 mảng ngành đang chạy → docs/NC-SAN-PHAM-6-VAI-2026-08-11.md.
[11/08 đêm — Hoà phê "app studio không có sản phẩm đặc trưng" → CHỐT HERO OUTPUT] Sản phẩm đặc trưng IF = **BỘ HỒ SƠ KỂ CHUYỆN KHÔNG GIAN (Story Set)** — hồ sơ dự án "đọc như tạp chí quiet-luxury, mọi con số truy về một nguồn", 6 chương: bìa editorial serif-kem (ref #1) → DNA board (Thẻ DNA 8 lớp) → câu chuyện không gian (ambient tint ref #5) → hình ảnh điện ảnh (eye-level·ánh sáng kể giờ) → vật liệu như tạp chí (A3 + quả cầu) → phụ lục sự thật (bản vẽ đúng LUẬT + BOQ nguồn giá). Định vị: Canva đẹp-không-thật, Revit thật-không-đẹp — IF đổi vật liệu chương 4 thì chương 5-6 tự đổi. SÀN = LUẬT chuẩn đầu ra (máy chặn) · TOẢ SÁNG = typography editorial + ambient tint + ánh sáng giờ + chữ ký DNA từng dự án + nhịp kể + motion spring. 6 nguyên tắc thao tác flow-state: nguyên-liệu-trong-tầm-mắt · thử-sai-rẻ · so-cạnh-nhau · không-đứt-mạch · máy-giữ-đúng-người-giữ-đẹp · mọi-nháp-là-tài-sản. Entry `story-set` vào frontier đợt 1.
[11/08 đêm — Hoà đặt bài 5 chủ đề cấp toàn app] Lập `docs/PHIEU-CHONG-RUI-RO-5-CHU-DE.md` — khuôn PHIẾU 5 Ô (định nghĩa khoá · tiêu chí 4 trục công năng/thẩm mỹ/sáng tạo/ấn tượng · KỊCH BẢN NGHIỆM THU làm-theo-trên-app-thật · tuần tự bước · dây máy id registry). 5 phiếu: Workspace "bàn theo việc" · 2D "bản vẽ sống" · 3D "không gian đứng dậy" · Thư viện "cửa hàng có gia phả" · Collaborate "làm chung một sự thật". Story Set giữ nguyên là hero output. NÓI THẲNG trong phiếu: Collaborate là phiếu XÂY MỚI (~2 phiên), kịch bản CĐT-iPad hiện không chạy được — 4 phiếu kia nền thật. +2 entry registry (comment-neo-doi-tuong · khach-qua-link).
[11/08 khuya — Hoà giao batch chat/khởi tạo/họp] 3 agent chạy: mock chat nhóm NotebookLM (nguồn trái·luồng giữa·chưng cất phải, toggle AI, avatar dãy màu/trắng-đen, card Smart Transfer trong chat) · spec Bảng khởi tạo dự án (Plan-Task-Timeline, quản lý phân quyền + chủ trì gắn thẻ, NEO RBAC 5 vai sẵn) · đối chiếu logic chặng 2-3 HANDOFF-CODEX vs code. **Logic họp chốt: MỘT BUỔI HỌP BA DÒNG CHẢY** — bản ghi → nháp biên bản theo biểu mẫu kho chuẩn → CHỦ TRÌ DUYỆT (cửa human duy nhất) → ①quyết định vào nhật ký + mail ②việc mới vào Bảng việc kèm TaskContext ③thay đổi dữ kiện thành PHIẾU ĐIỀU CHỈNH gắn ĐỐI TƯỢNG (định tuyến theo entity, không đoán chặng — workspace chứa entity tự hiện badge, bấm nghe lại 20s audio gốc). NÓI THẲNG: không tự xây engine video call (WebRTC/TURN = nặng, không phải lõi) — IF làm chủ phần SAU cuộc gọi; meeting-distill phụ thuộc editor Văn bản + Company DNA Pack nên xếp Đợt 3. +4 entry registry.
[11/08 khuya — Hoà chốt lại Collaborate] **CĐT KHÔNG vào hệ comment** — luồng khách giữ truyền thống (xong → mail → ban bệ trình sếp họ → phản hồi về, chủ trì nhập lại). Tính năng thật = **CỔNG DUYỆT NỘI BỘ (Review Gate)**: chủ trì set mốc time → Vitals tự push thông báo + deep-link cho sếp/bộ phận liên quan → rơi đúng trang canvas, chế độ xem+note (không sửa) → note ghim vị trí, nhập gõ hoặc voice-to-text → note tự gom thành CHECKLIST chỉnh sửa, designer tick (tick = xong/thành việc) → checklist sạch mới xuất gửi mail. Phiếu 5 đính chính (kịch bản CĐT-iPad HUỶ), registry: gỡ khach-qua-link, thay review-gate.
[12/08 Hoà chê — HÌNH HỌC TOÀN APP] Đường nét/bo góc không đồng bộ từ cấp hệ thống tới chi tiết; luật §2d (bo đồng tâm trong = ngoài − đệm, hình sau là hệ quả hình trước như Apple) ĐÃ CHỐT nhưng app vi phạm rải rác. Việc: thang radius token + hàm concentric + SCRIPT SOI MÁY (soi-hinh-hoc, cùng họ soi-frontier) + audit toàn bộ mock Claude Design + sửa. Kèm: khôi phục card kính lỏng viền gradient chạy màu chặng render (Hoà: "rất đẹp") — tái sinh dạng ánh sáng CÓ NGHĨA (chạy khi đang render), không trang trí tĩnh. 2 entry: hinh-hoc-dong-tam · card-kinh-gradient.
[12/08 Hoà giao 5 ref Siri mới] **Vitals 3 CẤP WINDOW học visual Siri mới nhất** (nâng khuôn §4b SPEC-APPLE-MOTION thành chuẩn thị giác): ① pill/thẻ kết quả kính nhỏ tại chỗ ② thẻ hội thoại nổi giữa màn ③ trang phiên đầy đủ nền tối/be — kèm bài học "Reduce Bright Effects" (kính phải có nấc giảm chói, độ đọc thắng). **Trang canvas tone BE hoặc XÁM-ĐEN đơn giản; nội dung CHỌN ĐƯỢC hover là nổi gradient KEM ấm** (ref Tanj) — ánh sáng có nghĩa khả-tương-tác, không áp chrome/toolbar. REF-VISUAL #14-15 + 2 entry registry (vitals-3-window · hover-gradient-kem).
[12/08 Hoà gật 3 + giao mô hình T] ① Thang bo DUYỆT: 6/10/14/20 + --r-full 999 + rInner=max(4,rOuter−pad) (concentric chỉ khi pad≤8) — entry hinh-hoc-ap-thang thi hành. ② Dọn rơi rớt: drop 2 stash cũ, xoá fix/quality-pipeline; GIỮ fix/hatch-t-junction → entry hatch-t-junction-cay-lai (đợt 2). ③ Neufert tách GÓI ngoài repo (đợt 3) + **cùng cơ chế cho HỆ MÀU HÃNG: Pantone·Jotun·Dulux thành gói nạp** (color-system-packs — app trung tính, studio tự nạp catalog, map matId, DataOrigin nhãn). ④ **GALLERY = kho ảnh tuyển LIÊN NGÀNH** (kiến trúc·nội thất·cảnh quan·graphic·art; phân nhóm + bộ sưu tập xu hướng CÓ NGUỒN; chống thói quen search web/Pinterest ảnh rác; là MẶT TIỀN tuyển chọn của kệ Ảnh & tài sản — không đẻ kho mới; NUÔI Thẻ DNA/moodboard/Story Set) → **Home ĐỔI NGỮ NGHĨA thành TỔNG QUAN DỰ ÁN**: card = tên + quy mô (ProjectProfile) + start + dãy avatar PresenceRow online/offline + click nhảy STAGE ĐANG DỞ (lastStage). ⑤ **MÔ HÌNH ĐIỀU PHỐI T** thành văn bản vận hành `docs/HOP-DONG-PHOI-HOP-T.md`: Hoà nói "chốt" → T plan (bảng 5 cột: tên global · giải quyết gì · gia phả · cấp chặng · liên chặng) + entry registry ngay → hợp đồng giao việc khuôn 8 ô → agent lưu báo cáo về docs/bao-cao-phien/ → T audit (mở file đầu ra) → PHIÊN V RIÊNG kiểm chứng báo cáo → tổng kết; kết phiên soi:frontier + soi:hinh-hoc 0 lệch.
[12/08 Hoà bổ sung hợp đồng T] T = NGƯỜI GÁC KIẾN TRÚC cấp toàn app/workspace, có NGHĨA VỤ CẢNH BÁO khi bất kỳ trụ cốt lõi nào không đi đủ chuỗi định hướng→spec→code→đấu nối→nghiệm thu. HOP-DONG-PHOI-HOP-T §6: BẢNG SỨC KHOẺ 8 TRỤ (nền dữ liệu · đấu nối · luồng nghiệp vụ · giao diện/DS · chất lượng đầu ra · vận hành/an toàn · hiệu năng · tri thức ngành) + 5 KIỂU LỆCH CẤM (lõi dày tính năng lẻ tẻ không dây · lý thuyết nhiều dùng không được · cái gì cũng có không cái nào trọn · UI về đích code 0 dòng · code/UI đầy mà backend/đấu nối không). Cuối mỗi đợt T tổng kết 8 trụ no/đói kèm bằng chứng; trụ đói 2 đợt liên tiếp = đỏ, đợt kế bù trước khi nhận chủ đề mới.
[12/08 Hoà bổ sung quy trình chuyên môn T] HOP-DONG-PHOI-HOP-T thêm §2b + §7: ① mọi plan tóm về BẢNG TÍNH NĂNG 3 CẤP (Đ đơn lệnh chính xác · F flow/pipeline cấp chặng · L liên chặng) đủ cột phả hệ/painpoint/benchmark-đối-thủ/ĐỌC-NUÔI/registry-id; ② nguyên tắc: đối thủ có thì IF có nhưng hơn ở hiểu-sâu-ngành + một-nguồn + NHÓM LỆNH ĐÓNG GÓI (2 tầng: pro gọi lệnh đơn, người mới dùng gói — cùng 1 registry); chung thì GIỐNG HỆT, riêng thì SÂU TUỲ BIẾN; cử chỉ đa thiết bị/ngữ cảnh chung một đặc trưng ngành; mỗi đợt SONG SONG ≥1 việc giàu cốt lõi + ≥1 việc nhìn-thấy-được và cái nhìn thấy PHẢI nối cốt lõi; ③ VÒNG KHÉP KÍN: Hoà chỉ 3 chạm (chốt · duyệt bảng plan · duyệt mắt tại Cửa) — T xuất HỢP ĐỒNG DÁN-ĐƯỢC vào docs/phieu-giao/<id>.md tự chứa đủ ngữ cảnh, agent V kiểm liên phiên tự chạy sau mỗi đợt xuất MỘT bản đánh giá + định hướng trình Hoà, máy canh nền tự cảnh báo không đợi hỏi.
[12/08 Hoà duyệt 5 nâng cấp + 2 cơ chế mô hình T] ①xong-MÁY ≠ xong-MẮT: soi-frontier tách 2 trạng thái, dòng tổng hiện NỢ NGHIỆM THU MẮT (hiện 23), Cửa chỉ đóng khi nợ mắt = 0, có phiên duyệt-mắt-gộp ②PHẢN BIỆN TRƯỚC CHỐT: chốt lớn phải kèm lập-luận-chống mạnh nhất + chi phí cơ hội ③V đếm 3 số/đợt (lệch·chu kỳ·làm lại) ④vòng người dùng thật TTT trước Cửa B ⑤backup offsite (entry) ⑥**CHỐNG LỆCH ĐỊNH NGHĨA**: soi-tu-dien.mjs — từ điển chuẩn máy-đọc, chốt tên = thêm entry từ điển ngay; phát đầu bắt 81 chỗ nhãn lệch ⑦**TỔNG QUAN ĐỒNG BỘ** (HOP-DONG §9): T nhận diện cơ chế tương đồng build↔sản phẩm để học chéo — 5 đẳng cấu đã ghi (Sổ Frontier↔Drawing Register "SỔ DỰ ÁN SỐNG" · hợp đồng 8 ô↔TaskContext · V↔Review Gate · xong-máy/mắt↔WIP/Checked/Approved ISO 19650 · Phiếu 5 Ô↔nghiệm thu bàn giao).
[12/08 Hoà chốt phân tầng T] T = tầng KIẾN TRÚC XUYÊN CHẶNG (workspace·xương sống·giá trị·quy trình·luật·mọi việc cấp L — tự thiết kế hợp đồng interface rồi cắt mảnh Đ/F xuống luồng; nhiệm vụ tuyến tính, đợt sau là hệ quả đợt trước). Sub-agent trần = CẤP CHẶNG/LUỒNG, chạm biên liên chặng thì dừng + đề xuất lên T. Mọi báo cáo T (và sub-agent trong phạm vi mình) theo KHUÔN 2 GIÁ TRỊ: ①kiến trúc app ②vận hành-sử dụng + giá trị IF — mỗi lớp phân loại [tính năng]+[giao diện]. HOP-DONG §1c.
[12/08 Hoà đặt cơ chế PHÂN LOẠI VAI → thành máy] Mỗi entry registry mang `vai`: ⭐MVP (lõi khác biệt — tập trung highlight) · 🔗KẾT NỐI (dây chung) · 🧰ĐỠ (support). soi-frontier đếm % từng vai + tự cảnh báo khi MVP đói hơn support (anti-pattern #3). Bản đọc đầu: MVP 65% · Kết nối 29% · Đỡ 30% — trọng tâm đang ĐÚNG. Luật đóng gói: ≥3 entry cùng vai + cùng hệ → group-by thành một phiếu/nhóm lệnh chung. HOP-DONG §2b.5.
[12/08 Hoà áp cơ chế phân loại VÀO IF] ① smart-ingest nâng thành XUẤT NHẬP ĐA ĐỊNH DẠNG CƯỠNG CHẾ: nhập bất kỳ → nền tự chuyển + nén proxy tối ưu môi trường IF (gốc bất biến, xuất/in về gốc) → xuất đa đích. ② Entry mới ⭐auto-define: intelligent core TỰ định nghĩa/phân loại cấu kiện (thay KTS nhập parametric tay) với cờ 3 nấc measured/inferred/verified + HUMAN-IN-LOOP 2 CHIỀU (máy suy→người xác nhận · người nhập→máy kiểm) — mở rộng cơ chế spotlight-theo-ngữ-cảnh của Master Library sang các chặng. Đẳng cấu §9: cơ chế định nghĩa+phân loại của quy trình build (registry/vai) áp sang sản phẩm.
[12/08 Hoà khép vòng cơ chế phân loại → MÁY GỢI NHÓM] soi-frontier thêm khối GROUP-BY GỢI Ý: ≥3 việc chờ cùng hệ×vai → máy đề xuất gộp phiếu/chung engine lõi (máy gợi theo trục thuộc tính, đẳng cấu NGỮ NGHĨA do T phán §9). Phát đầu gợi 5 cụm, T phán 3 đẳng cấu thật: ① dna-card + auto-define + company-dna-pack = MỘT ENGINE CHƯNG CẤT chung (trích dữ liệu có nguồn → cấu trúc → cờ measured/inferred/verified → người duyệt — 3 mặt tiền: gu dự án · cấu kiện · quy trình công ty) ② focus-entity + tao-viec-tu-day + activity-feed + chat-project + comment-neo = MỘT ENGINE NEO NGỮ CẢNH (entity-anchor + deep-link + notify — 5 mặt tiền) ③ smart-ingest + nhan-nguon-reset + neufert-tach + dwg-tach = MỘT HỆ GÓI & NHÃN NGUỒN (pack + DataOrigin + chuyển đổi nền). Khi mở phiếu các cụm này: viết engine MỘT LẦN, các mặt tiền gọi vào — đúng luật "một cỗ máy nhiều mặt tiền".
[13/08 Hoà chốt] ① ĐỢT GIAO DIỆN THỐNG NHẤT — luồng thao tác chung tối ưu lại, cái thừa bỏ. KIỂM 13/08: vỏ chung ĐÃ có (AppShell thay StageShell cả 5 màn) + 4/5 token mật độ đã nằm globals.css:105 ⇒ đợt này làm phần CÒN THIẾU: PanelHandle tay cầm thu/mở dùng chung (chốt 07/08 mục 10) · hoàn thiện --pad-card/--fs-ui + áp · radius v2 (hàng đợi 442) · 77 từ điển mocks · hotkey-registry (entry mở, thi công đợt sau). ② HOME = "DÒNG STUDIO" hướng TỔNG QUAN: dashboard widget LIVE cuộn dọc 2 trang — trang 1 lời chào app + Vitals + card dự án; trang 2 fit-1-màn: biểu đồ + thông tin tổng quát TỪ CÁC CHẶNG + ghi chú nhanh + tin tức studio + lịch/mốc; tiêu chí cảm nhận "MUỐN TRỞ VỀ" (NC bổ sung cơ chế thú vị: docs/nc/NC-HOME-CAM-NHAN + NC delight 13/08); widget thiếu dữ liệu TỰ ẨN, không chồng chức năng workspace sâu, KHÔNG schema mới ở v1 (mốc đọc từ Task/ProjectProfile, ghi chú JSON per-user).
[13/08 Hoà chốt v3 Home] BỎ cuộn 2 trang — HOME = BENTO GRID MỘT MÀN: mỗi thẻ là WIDGET ĐỘNG, nhiều cử chỉ tương tác (hover tilt/lift theo SPEC-HOVER-FOCUS, hover gradient kem cho phần tử chọn được, kéo-thả ghi chú neo vào dự án, giữ Tab bung lớp dữ liệu, reduce-motion thắng); thêm widget sáng tạo dữ-liệu-thật: Đồng hồ ánh sáng (cung mặt trời theo giờ — đúng nghề ánh-sáng-kể-giờ) · Vật liệu của tuần (từ kho matId) · Ảnh đẹp tuần này (render mới/được ghim). Nền ánh-sáng-theo-giờ + lời chào + Vitals pill + các widget v2 GIỮ, xếp lại vào ô bento.
[13/08 Hoà chốt] SMART CONVERT — mở rộng smart-ingest: mọi định dạng tĩnh nhập IF hướng tới bản EDITABLE tách lớp sẵn, theo BẬC THANG trung thực (T phản biện đã nêu, Hoà nhận khuôn): bậc 1 tất định PDF-vector → deck IF 3 lớp Nền·Ảnh·Chữ (chữ thật từ PDF, unpdf sẵn có) → xuất PPTX đường sẵn; bậc 2 OCR+tách khối AI cờ inferred (Cắt nền BiRefNet làm chân); gốc bất biến theo luật smart-ingest, bản chuyển đổi là DẪN XUẤT có provenance. "PDF→PPTX" = PDF → deck IF sửa được → PPTX, không đẻ đường ngoài luật một-nguồn. Thi công bậc 1 ngay (entry smart-convert-pdf) phục vụ vòng người-dùng-thật #1 (deck NamLong).
[13/08 Hoà đặt bài → SPEC GROUNDED RENDER] Bệnh AI trộn-toàn-cục làm render chung chung → thuật toán "render bám ý": ①đọc KHUNG hình học ảnh trọng tâm (tiêu cự·điểm tụ·chân trời — single-view-metrology CÓ SẴN) ②wire-color định danh MẢNG cấp pixel (BiRefNet/idmask sẵn + SAM2) ③đọc ảnh tham khảo ra PHIẾU 4 CẤP (tổng thể→trần tường sàn→vật liệu→chi tiết) máy TRÌNH RA cho KTS duyệt trước khi áp ④BẢNG ÁNH XẠ mảng↔mảng + NÚM mức bám từng mảng, máy đề xuất theo trọng số 70% chuẩn ngành + 20% Thẻ DNA KTS + 10% gu CĐT/dự án ⑤SINH TỪNG MẢNG qua mask cứng (không trộn toàn cục) ⑥pass thống nhất ánh sáng + máy kiểm khoá-sắc-độ. KTS kéo-thả đường BÁM PHỐI CẢNH giới hạn vùng áp. ĐỊNH VỊ THÀNH LUẬT: Grounded Render = CONCEPT trình CĐT, không giá trị technical; technical = mode Dựng khối 3D — sứ mệnh 2 mode chặng 2. Bậc v0 tuần này (mask bán tự động + inpaint mảng + fix bug F2 node render). Spec: docs/SPEC-GROUNDED-RENDER-2026-08-13.md
[13/08 Hoà chốt GROUNDED RENDER + review đồng bộ] Spec docs/SPEC-GROUNDED-RENDER-2026-08-13.md CHỐT (entry grounded-render, v0 tuần này + fix F2 node render guidance/image_size). Review toàn app ra 5 ENGINE CHUNG phải đồng bộ (docs/REVIEW-DONG-BO-CO-CHE-2026-08-13.md, đã vào HOP-DONG §9 thành luật soi): ProposalSheet (mọi đề xuất máy → 1 khuôn phiếu duyệt: DistillEngine·MaterialImpact·Scaffolder·phiếu-4-cấp·auto-define·meeting-distill) · RegionId (mảng ảnh ↔ entityId/matId — ảnh từ scene IF thì mask = CHIẾU ENTITY không cần SAM, lợi thế một-nguồn) · khuôn NÚM-STACK (BuildRecipe ↔ bảng ánh xạ mảng ↔ ThinkDial, tái dùng UI BuildRecipeSection) · PostGate (CHUAN_DAU_RA ↔ kiểm sắc độ B6, cắm lib/review) · SuggestBlend 70/20/10 có gia phả nguồn. Luật: tính năng mới rơi vào khuôn mà tự chế riêng = vi phạm đồng bộ, T chặn ở bước plan.
[13/08 Hoà CHỐT plan 4 phiên nền móng + P1 THI HÀNH XONG] Chuỗi hệ quả: P1 TRIET-LY-IF.md (đã ban hành — cây T0-T8 · trục N1 human-centric-sáng-tạo-lai-kỹ-thuật với 7 CẤM KỴ · trục N2 đơn-giản-ngoài-sâu-trong-học-từ-nghề · 6 điều hành Đ1-Đ6 gồm: nhìn-vào-trong-trước, ánh-xạ-2-giá-trị, ghim-cứng-vai-agent; mã điều khoản trích được, nối dây khuôn phiếu §3 + khuôn plan §2b, entry triet-ly-if) → P2 nhịp review tổng→chi tiết + luật phân loại + thẻ vai (HOP-DONG) → P3 Hệ Luật Thao Tác (kho + soi:thao-tac + 7 cấm kỵ làm tội danh) → P4 Gói Hồ Sơ Sống v0 (ZIP + viewer HTML tự chứa + ruột chuẩn + manifest đa kênh — né chết-định-dạng bằng 3 tầng thoái lui; dogfood ST5). Sứ mệnh Claude: build IF theo triết lý người tạo định nghĩa. Song song mỗi phiên vẫn ≥1 việc nhìn-thấy: duyệt phác Home v5 · fix F2 · Grounded Render v0.
[13/08 chiều — 3 văn bản nền đã ban hành + 2 đề xuất TREO CHỜ HOÀ] ①ĐÃ COMMIT: docs/BAN-THIET-KE-HE-THONG-IF (16 mục ship-được: IF 3✅·10🟡·3❌ a11y/telemetry/observability; cơ chế đồng bộ chọn: FeatureContract máy hoá = P5, IF-RNA v0 MaterialPbr = P6 — CHƯA mở entry, chờ Hoà chốt lộ trình P5-P6) + docs/DOI-CHIEU-3-TRUONG-PHAI (5 điểm chung Google/Apple/creative trùng khít T0-N2; đường IF = hiểu-sâu-nghề + một-nguồn + gói-tác-vụ-2-tầng; 3 cảnh báo đỏ: băng thông duyệt mắt Hoà là tài nguyên khan hiếm nhất · học đích-đến không học trình-tự Adobe · TRIET-LY = chốt nền hiếm đổi, 00-CHOT = nhật ký thi công). ②TREO CHỜ HOÀ PHÁN: KIẾN TRÚC TOOL 3 LỚP (thanh chung luôn hiện 1-2 hàng · gói tác vụ group-by người dùng chọn · master node = mini-tool sâu cửa sổ to; chặng 2 CHỈ 2 môi trường Canvas+Vẽ 3D, không sheet mới; mọi sản xuất nội dung sáng tạo = master node chặng 2) — điểm cần phán: video DỰNG về chặng 2 master node (thay chốt 02/08 tầng② ở chặng 3) hay giữ chặng 3? T đọc là chặng-3-chỉ-còn-đóng-gói-trình-bày, CHƯA ghi thành luật. Chốt xong mở entry kien-truc-tool-3-lop.
[13/08 Hoà PHÁN — hết treo, thành luật] ① VIDEO: toàn bộ quá trình TẠO + DỰNG video ở CHẶNG 2 (master node); chặng 3 CHỈ TRÌNH CHIẾU phim linh hoạt + tinh chỉnh filter nhẹ — THAY chốt 02/08 tầng② (dựng ở chặng 3 hết hiệu lực). ② KIẾN TRÚC TOOL 3 LỚP thành luật (entry kien-truc-tool-3-lop): thanh CHUNG luôn hiện 1-2 hàng (việc app thiết kế nào cũng có) · gói tác vụ GROUP-BY người dùng chọn (1 dòng + icon trong canvas) · MASTER NODE = mini-tool cửa sổ to ôm nội dung, nút/thanh kéo/bảng thông số tối ưu RẤT SÂU per tác vụ; chặng 2 CHỈ 2 môi trường Canvas+Vẽ 3D, không sheet/stage mới; mọi SẢN XUẤT nội dung sáng tạo (ảnh·video·moodboard·spec·bảng thống kê·vật liệu — chuẩn "đẹp + định hướng tốt") = master node chặng 2, làm tiền đề technical (3D mode · bản vẽ · deck · BOQ). ③ BRAINSTORM/COLLAB chặng 2 cùng logic: form mẫu lập luận có sẵn + pick từ gallery/thư viện + tự sketch/note → hình thức đầu ra = MOODBOARD/STORYLINE dự án = component cấp full-giá-trị-thẩm-mỹ — chính là THẺ GU (Thẻ DNA) của dự án; ảnh/video minh hoạ deck thì master editor chặng 2 xử tiếp. ④ ⭐LUẬT DÀN Ý CHỜ SẴN (entry dan-y-cho-san — painpoint thật: KTS take-note "present cần mấy trang, trang nào nói gì" xong QUÊN, rơi rớt): mọi ý ĐÃ CHỐT với sếp ở chặng 2 (storyline·moodboard·thẻ DNA·notes) được máy GÓI thành DÀN Ý DECK chờ sẵn ở chặng 3 — số trang + mỗi trang nói gì + asset minh hoạ + ánh xạ Brand Kit, mở Trình chiếu là khung hồ sơ đứng đợi; cơ chế = mặt tiền thứ 4 của DistillEngine + trình qua ProposalSheet (người duyệt dàn ý trước khi dựng).
[14/08 Hoà lệnh "kết nối MCP cho Claude Design làm đi"] ĐÃ NỐI DesignSync ↔ claude.ai/design: project MỚI "InteriorFlow · Design System" (id b7dc14ba-1752-4821-8fc7-d519f737ac09, tài khoản Hoà, trung tính — KHÔNG dùng 4 project cũ tháng 7) · đã đẩy docs/IF-design-system-seed.html (token thật globals.css, marker @dsCard) làm nền. QUY TRÌNH từ nay: mock mới (khung-mot-khuon, KB-1..5) dựng trong docs/mocks/ rồi DesignSync write_files lên project này — Hoà duyệt mắt trong pane Design System của claude.ai/design; mock vẫn là nguồn sự thật trong repo (luật QUY TRÌNH DESIGN 02/08), Claude Design là XƯỞNG + nơi duyệt.
[14/08 Hoà giao quyền "tổng kiến trúc sư quản lý và kiểm hết tất cả những gì cấu thành IF"] DUYỆT NT-1..18 + KB-1..4 THÀNH HIẾN PHÁP GIAO DIỆN — không còn "CHỜ HOÀ DUYỆT", T duyệt bằng quyền được giao vì cả hai bản đã tự kiểm chứng chặt (chưng cất 43+50+19 ảnh CỦA CHÍNH HOÀ, đối chiếu top-tier có nguồn URL, T audit đạt). `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` (NT-1..18, mục 6 xếp hạng 8 lệch L1-L8) + `docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` (P1-P7 có nguồn, kiến trúc 3 tầng ①chung ②group-by ③cử chỉ, KB-1..4) = CHUẨN NGHIỆM THU cho mọi UI từ nay, thay cho cảm tính. **Đối chiếu chéo với khung `design-critique` chính chủ Anthropic (5 trục: ấn tượng đầu·usability·hierarchy·consistency·accessibility) phát hiện 1 lỗ NT-1..18 chưa phủ sâu: ACCESSIBILITY — chỉ NT-16 chạm sơ (nấc giảm chói kính), trùng đúng lỗ ❌ "a11y audit" đã ghi ở STATUS.md — gộp a11y vào đợt sửa UI này, không tách riêng nữa.** Thứ tự thi hành theo mục 6 NT-doc: **L1 (🔴 nặng nhất, đúng phàn nàn "khó dùng") — 3 chặng 3 khuôn thanh công cụ khác nhau** (2D chip ngang · Present chip wrap 4 hàng · 3D dock capsule) → hợp nhất theo KB-1, lấy dock capsule 3D làm GỐC. Kế tiếp L2 (hotkey-registry+⌘K chưa thi công) · L3 (Files/Thư viện empty-state thô). Cắt hẳn `intro-day-chuyen` khỏi hàng đợi hiện tại — Hoà chốt làm SAU khi app xong, không lăn tăn nữa.
[14/08 Hoà chốt] MIRROR ĐỐI XỨNG cho chuan-net (entry `mirror-doi-xung-chuan-net`) — Hoà tự phân tích đúng gốc bệnh "khối chết" bằng lời trước khi biết code đã bắt được y hệt ca đó hôm nay (`chuan-net.ts:952`, torus tay vịn bị annularity check từ chối). Trục đối xứng hiện CHỈ dùng để TỪ CHỐI fit, chưa dùng để CHỦ ĐỘNG SINH — thêm bước mirror-completion: dò mặt phẳng đối xứng qua PCA trên tâm các part cùng loại, phần fit chắc hơn (RMS thấp) làm gốc, mirror sang phần đối xứng thay vì giải 2 bên độc lập rồi cộng dồn sai số. Kèm 2 hướng liên quan chưa build: multi-photo visual hull (tuỳ chọn, cần >1 ảnh góc) · độ tin cậy mỗi nét nạp thẳng vào cờ 3 nấc PartLock ngay lúc trích nét (thay vì suy ngược từ RMS sau khi fit xong).
[14/08 T quyết theo uỷ quyền Hoà "tuỳ bạn quyết"] SLOT FURNITURE Ở CHẶNG 3D (entry `furniture-slot-set`): chốt hướng **A — Revit-style** — KTS tự đánh dấu slot đặt đồ (placeholder nhẹ, entity RIÊNG, KHÔNG thêm field vào `RoomEntity` — chỉ đọc `boundary`+`roomKind` sẵn có) ngay ở chặng 2D; chặng 3D đọc số slot + Thẻ DNA dự án → **mặt tiền thứ 5 của DistillEngine**: MỘT DANH SÁCH DỌC hiện đủ cả bộ fur khớp DNA cùng lúc (không phải next/prev từng món), màu/vật liệu đồng bộ theo bộ, cho tuỳ chỉnh từng món, chọn là tự đặt đúng slot — không cần click. **Vì sao KHÔNG chọn B** (tự suy toàn bộ số lượng+vị trí từ mô tả, không đánh dấu tay): B trùng đúng cơ chế "AI mô tả" đang sống ở cửa chặng 1 — đã nhiều vòng vá (`QA-SWEEP-REPORT.md` fix `83e8d38` "quá thận trọng") vẫn còn kêu "vẽ sai/bố cục nhảy" (`UX-AUDIT-HABITS.md`), và ĐÃ có spec riêng chờ làm lại chưa xong (`SPEC-BRIEF-INTAKE.md` → đổi thành "Đề bài → Phương án", `IF-FEATURE-TREE.md` mục 2.0.24 vẫn ⬜). A không phụ thuộc B nên làm được ngay; B để dành nâng cấp SAU khi "Đề bài → Phương án" ra bản mới — furniture-slot ăn theo được luôn, không xây hai lần.
[15/08 T chốt theo uỷ quyền Hoà "này thuộc phạm vi chốt của bạn"] XỬ BẢN TƯ VẤN VAI VẬN HÀNH (`TU-VAN-PROMPT-VAI-TU-VAN-VAN-HANH.md`, cowork-nghiên cứu). T kiểm chứng từng khẳng định TRƯỚC khi nhận — **NHẬN 4, BÁC 2, SỬA HƯỚNG 1**.
· ✅ NHẬN — 3 ô vá khuôn phiếu (đã thi hành, HOP-DONG §3): **⓪ TIỀN ĐỀ** (agent phải xác nhận/bác bỏ giả định của phiếu trước khi làm; bác thì DỪNG — làm đúng một phiếu sai vẫn là hỏng việc) · **⑦b CHƯA CHẮC/CHƯA KIỂM** bắt buộc, trống cũng phải ghi · **⑦c HẠN DÙNG KẾT LUẬN**. Ba lỗ này khuôn 8 ô cũ KHÔNG có, và cả ba đều đẻ ra "trả lời mù" — thứ trôi qua audit dễ nhất.
· ✅ NHẬN — **gộp `CLAUDE.md` ↔ `AGENTS.md` về MỘT NGUỒN** (đã thi hành: AGENTS.md = symlink). Hai bản đã bắt đầu phân kỳ thật: bản AGENTS ghi sai `.Codex/launch.json`. **Cấm dựng lại bản sao thứ hai của luật nền.**
· ✅ NHẬN — 3 ý thật sự mới, không có gì tương đương trong hệ: `claimKeys` chống va chạm phạm vi giữa agent song song · một-cửa-ghi-vào-kho · chiều thời gian trên tri thức (`effectiveFrom`/`supersededBy`). → entry `claim-keys-va-cham` · `kho-mot-cua-han-dung`.
· ✅ NHẬN — trần kích thước kho: `docs/` đo thật **674 file · 32MB** (bản tư vấn ghi 400 file, đếm thiếu 274); `BAO-CAO-PHU` 252K · `CHANGELOG` 220K · `00-CHOT` 112K. → entry `tran-kich-thuoc-kho`.
· ⛔ **BÁC — "khởi tạo SIM-LEDGER"**. Nó là sổ của quy trình SPIRAL (28/07) **đã chết**, và bản sống của cơ chế đó ta CÓ RỒI: frontier-registry + `docs/bao-cao-phien/` + `soi:contract` + agent V. Làm nó là đúng tội N8 "đề xuất lại thứ đã có" — chính tội bản tư vấn cảnh báo ở đầu bài. **Phiên sau đọc SPIRAL rồi định khởi tạo SIM-LEDGER: DỪNG, đọc dòng này.**
· ⛔ **BÁC — đẻ agent thứ 6 ("vai tư vấn tổ chức & vận hành")**. Vai đó trùng **V** (§2 bước 7) vốn đã chạy thật lần đầu 15/08 (nhánh 04, cứu T khỏi một báo-sai về vẽ tường). Cần gì thêm thì **nạp vào V**, không đẻ con mới — SPIRAL mục 5 đã trả giá một lần cho đúng bài này (KIẾN đụng KIÊN, phải đổi tên).
· 🔧 SỬA HƯỚNG — bản tư vấn đối chiếu vai mới với `AGENTKIENIFARCHITECT.md` (file KHÔNG có trong repo, nó tự khai); đối tượng đúng phải là **V**.
· 🔴 GỐC BỆNH ĐÃ VÁ: bản tư vấn audit SPIRAL như thể đang chạy — đếm được **0 lần** nhắc HOP-DONG-T/TRIET-LY/frontier/soi/V, và ngược lại STATUS/00-CHOT/HOP-DONG/TRIET-LY nhắc SPIRAL **0 lần**. Hai hệ không biết nhau tồn tại. ⇒ đã **đóng dấu ⛔LỖI THỜI lên đầu `QUY_TRINH_SPIRAL_v1.md`** + bảng ánh xạ 4 cơ chế cũ→mới. Luật rút ra: **văn bản quy trình bị thay PHẢI đóng dấu tại chỗ, không im lặng bỏ hoang** — file hoang mà đọc như đang sống là bẫy cho mọi người/agent sau.
· ⚠️ Bản tư vấn có 1 chỗ BỊA phải ghi lại: nó nói "luật `verified` cần ≥2 nguồn độc lập trong registry.ts". Mở `lib/cad/standards/registry.ts:9` — luật thật là verified=true khi tra được từ **một** nguồn kiểm chứng được. Mối lo của nó (một-nguồn-lưu ≠ ngừng-đối-chiếu) vẫn đúng, nhưng bằng chứng thì tô thêm — nhắc vì đây là bài học chung: **phê bình đúng vẫn phải trích đúng dòng.**
[15/08 Hoà đặt bài — KIẾN TRÚC LỆNH 3 TẦNG, ticket `docs/TICKET-KIEN-TRUC-LENH-3-TANG.md`] Hoà: *"sử dụng chung những tool chung như nhau, còn lại gói tool thành 1 nhóm lệnh — giống thư mục Apple chứa group icon"* + Blender (*"phần chung hay xài hiện trên toolbar, phần chuyên sâu bọc trong window tool mini làm bảng lệnh tuỳ chỉnh; trục phải là edit tuỳ biến sâu hoặc create điều mới"*) + Photoshop (*"chủ yếu tập trung vào nhóm lệnh"*) + *"nhóm tool chính dùng chung cho TẤT CẢ editor sáng tạo, BAO GỒM CẢ VẼ 3D, vì các editor này thực chất đều có lệnh 2D 3D tương ứng"* + *"chặng 2: render mode và vẽ 3D mode quy về 1 — 1 thì thao tác ComfyUI, 1 thì giao diện tool truyền thống"*.
· 🔴 ĐO ĐƯỢC — GỐC BỆNH "3 chặng như 3 app" KHÔNG phải bo góc mà là **5 SỔ LỆNH SONG SONG**: `lib/commands/registry.ts` 55 CommandDef/97 alias (chỉ AppCommandPalette đọc) · CadToolbar 10 mảng tự khai · ToolDock3D 6 nhóm + 16 phím gõ cứng · present Toolbar tự khai · CommandPalette THỨ HAI đọc NODE_DEFINITIONS (mount song song ở HomeScreen:724 lẫn AppShell:185). `grep "lib/commands"` trong cả 3 toolbar = **0**. Phân kỳ thật: Xoay RO/RO/**Q** · Chép CO/CO/**D** · Đo DI/DI/**T** · Chọn Esc/**V** ⇒ học phím ở 2D sang 3D bấm sai — CHI PHÍ HỌC LẠI, không phải chuyện thẩm mỹ.
· PHƯƠNG ÁN: **một sổ lệnh, nhiều mặt tiền** — nâng `lib/commands/registry.ts` (KHÔNG viết registry mới) thêm `stages` + `icon` + `runFor{cad2d,model3d,graphic}`; toolbar thôi sở hữu danh sách, chỉ ĐỌC. Tầng ① ≤9 lệnh chung GIỐNG HỆT 3 chặng · tầng ② nhóm lệnh 2 khuôn theo tần suất (**PS** cho nhóm dùng liên tục: mặt ô = lệnh vừa dùng, bấm là chạy, tam giác xổ · **iOS folder** cho nhóm tra thỉnh thoảng: lưới 2×2, bấm là mở) · tầng ③ **mini window "Chỉnh lệnh vừa chạy"** (= Blender F9 Adjust Last Operation, **IF CHƯA CÓ**, giá trị cao nhất) + trục phải giữ đúng vai N-panel (Inspector edit sâu · BuildRecipe create/stack — ĐÃ CÓ, chỉ nối).
· MỘT LỆNH NHIỀU BỘ THI HÀNH: cùng động tác nghề tồn tại ở mọi editor, chỉ khác vật bị tác động ⇒ cùng id/nhãn/icon/phím, khác `run`. Bảng đối chiếu lộ ra **lỗ trống thật: 3D THIẾU Đối xứng và Lặp-lưới** — hai lệnh dựng nội thất dùng liên tục (4 chân ghế, dãy tủ, nan chớp), trùng đúng chỗ `mirror-doi-xung-chuan-net` vừa làm ở tầng thuật toán mà tầng LỆNH chưa có nút.
· LỘ TRÌNH B1 nâng CommandDef + hợp nhất phím phân kỳ (đổi tay quen: Q→RO·D→CO·T→DI) → B2 toolbar đọc registry, xoá danh sách cũ + bỏ bảng ⌘K thứ hai → B3 nhóm lệnh → B4 mini window + trục phải → B5 gộp bộ tool mọi editor sáng tạo & đối chiếu Node↔3D gộp lệnh cùng bản chất.
· KHÔNG đẻ entry thứ tư: thi công qua `hotkey-registry` (lõi) + `kien-truc-tool-3-lop` (3 tầng) + `toolbar-mot-khuon` (vỏ nút, XONG 15/08 `96a3913`).
· ⚠️ T ĐỌC Ý mục "chặng 2 quy về 1" là **một bộ lệnh, hai lối thao tác** (node-graph ComfyUI ↔ tool truyền thống), KHÔNG phải bỏ một mode — bỏ mode sẽ đụng chốt 13/08 "chặng 2 chỉ Canvas + Vẽ 3D". **Hoà xác nhận lại nếu T đọc sai.**
· Kèm entry mới `xuong-hoa-van-parametric` (Hoà nêu như ví dụ dựng chuyên sâu): hoa văn tham số → in giấy dán tường ≥300dpi + matId render 3D + hatch 2D + BOQ m²→cuộn; lõi tái dùng BuildRecipe + IF-RNA + Design DNA, thi công SAU B1-B2.
[15/08 Hoà chốt — RANH GIỚI ID-TRÊN-PHỐI-CẢNH vs CON SỐ, + 2 luật mới] Trả lời câu T hỏi về khối lượng từ ảnh:
· **GÁN ID Ở BƯỚC PHỐI CẢNH CHỈ PHỤC VỤ TRÌNH BÀY/THẨM MỸ, KHÔNG PHỤC VỤ CON SỐ.** Nguyên văn Hoà: *"gắn id ở bước này chỉ để tạo sinh những giá trị nội dung hệ quả cùng hệ phục vụ cho nhu cầu trình bày, thẩm mỹ deck"* — biết id/texture này là vật liệu nào và ĐANG NẰM ĐÂU trong phối cảnh ⇒ tự gom thành **nhóm spec + nhóm bảng vật liệu**. Yêu cầu hình thức: các mẫu **xếp chồng đè lên nhau, có bố cục đầy đủ**, trỏ vào mẫu nào **hiện thông tin mẫu đó**; và **bảng mẫu THẬT lúc nộp phải y chang bố cục đó** (bản trên màn = bản nộp, không dựng hai lần).
· **CON SỐ CHỈ ĐẾN TỪ CHỖ ĐO ĐƯỢC**: *"giá trị ước tính đúng sai con số thì phải tạo sinh từ chặng CAD/Revit hoặc có thông từ khối được dựng và đo lường trong IF"*. ⇒ ĐÓNG hướng đo m² từ ảnh phẳng (T đã nêu sai số lớn). Ảnh chỉ mang ID ĐỊNH TÍNH.
· **LUẬT BOQ (Hoà chốt)**: *"BOQ chỉ lấy giá trị chính xác đến từ con số, muốn gì thì người edit chỉnh theo ý mình sau."* ⇒ BOQ KHÔNG nhận số ước tính, không cột "tạm tính", không cờ độ tin cậy — chỉ số đo được; phần còn lại là việc của người sửa tay. ✅ Cơ chế sửa tay ĐÃ CÓ SẴN: `lib/present-editor/boq-overrides.ts` (khoá theo `matId`, lưu IndexedDB, `lib/boq/model.ts:55-57`) — không phải xây mới.
· 🆕 **ĐƠN VỊ ĐO + TỈ LỆ PHẢI CHỈNH ĐƯỢC Ở CẤP TOÀN APP** (Hoà nhắc 15/08). Đo hiện trạng: **KHÔNG CÓ** — `unitSystem`/metric-imperial grep 0; mm gõ cứng rải rác (vd `chuan-net.ts:1202` `donVi:'mm'`); tỉ lệ chỉ tồn tại ở khung tên/xuất PDF ('1:50' `export-checks`) và nút "Tỉ lệ" trong thanh 2D, KHÔNG có cài đặt cấp app (`components/settings/` có 7 màn, không màn nào về đơn vị). ⇒ entry mới `don-vi-ty-le-toan-app`.
· Bối cảnh đầy đủ + bằng chứng file:dòng: `docs/TICKET-MASTER-TOOL-VA-DINH-DANH.md` §0/§2.
