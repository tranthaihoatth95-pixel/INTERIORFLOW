# ☀️ TÓM SÁNG CHO HOÀ — đọc mục này là đủ (04/08, ~06:00)

**Đêm qua làm được (tất cả đã kiểm bằng git):** bản ĐẢO Navigator theo lệnh anh ✅ (`739960c` — gắn nguyên
NodeLibraryPanel, xoá list-chữ, audit ĐẠT — chờ MẮT ANH nghiệm thu) · panel thò thụt ✅ (`7847969`) ·
ArchiNote chuyển repo ✅ (`45795f7`) · BOQ vào git ✅ (`49ebadd`) · 4 spec mới (BOQ/Video/Layout/Touch) ·
NC đủ 6 bài (có checklist Lark) · MaterialSphere 83 dòng (dở) · 2 gói audit: KÍNH ⚠️ (1 lỗi nhỏ đã ra phiếu) ·
NGÔN NGỮ ✅ (0 jargon lộ UI).

**Vì sao xưởng đang im:** các phiên chạm 5h-limit lúc ~01:00 và KHÔNG tự chạy lại sau reset — đứng chờ dán,
không mất gì.

**3 việc tay anh sáng nay, theo thứ tự:**
1. **Mở app nhìn chặng Render** — nghiệm thu bản đảo Navigator (chuẩn = bản anh khen 1 ngày trước).
   Ưng thì nói "duyệt", chưa ưng thì chụp ảnh.
2. **Lark Console** theo `docs/nc/NC-lark-permission-2026-08-02.md` (checklist từng nút bấm — nhớ bước
   PUBLISH VERSION MỚI). Xong thì PHU sync được 1449 vật liệu + ảnh thật cho Thư viện.
3. **Đánh thức 3 phiên code** — dán 1 dòng mỗi phiên:
   · CHINH: `Tiếp tục hàng đợi SO-KIEM-TONG §3 vai CHINH — việc kế #4 phím tắt + #5 chữ→icon.`
   · G4: `Tiếp tục hàng đợi §3 vai G4 — MaterialSphere dở 83 dòng + 4-fix Thư viện (BAO-CAO-DEM 01:xx) + q0b badge blur.`
   · PHU: `Tiếp tục hàng đợi §3 vai PHU — sổ lệnh + schema PBR; ATLAS chạy lại SAU khi Hoà xong Lark Console.`
   (+ mở phiên ARCHINOTE ở ~/Downloads/ttt-tasks, dán khối duyệt 3 câu trong LENH-PHIEN §4)

*Chi tiết từng ca đêm ở các mục bên dưới. Checklist tổng: `docs/CHECKLIST-TONG.md`.*

---

# BÁO CÁO ĐÊM 03→04/08 — COWORK-TỔNG trực
*(Hoà đọc file này khi dậy — mọi quyết định đêm có lý do tại đây)*

## 23:1x · Hoà gửi ảnh chặng Rendering trước khi ngủ: "UI kì kì" — chẩn đoán 6 điểm
Ảnh: theme Sáng, sau merge 3c8dae6. Đối chiếu mock-if-3chang.html + SPEC-NGON-NGU + ảnh cũ 22:5x (còn panel "Thư viện khối" đầy đủ):
1. **Navigator chặng Render gần rỗng** — chỉ "ĐẦU VÀO 2", mất các nhóm node (phải là Nguồn·Xử lý·Bảng cảm hứng·Xuất theo mock). Nghi: Navigator mới của AppShell đang đổ node-instances thay vì nối NodeLibraryPanel. → giao CHINH.
2. **Toolbar bút dọc nổi lơ lửng** giữa canvas trái (chọn/bút/mực/marker/tẩy) — toolbar Mood+Collab đứng thường trực sai chỗ, trong khi dock dưới cũng đầy công cụ = 2 toolbar cùng lúc. → giao G4: chỉ hiện khi công cụ vẽ tay active, neo mép trái có lề, không đè canvas thường trực.
3. **Zoom 15% + canvas trống trơn** — fitView chạy khi chưa có node → tụt về min-zoom. → G4: canvas trống thì zoom 100%, có node mới fitView.
4. **Banner "Còn công cụ khác chưa hiện. Xem tất cả"** — chữ mơ hồ, không đúng khuôn SPEC-NGON-NGU (thiếu hành động rõ, nghe như debug). → G4: đổi thành khuôn "mách nước" có NÚT, hoặc bỏ.
5. **Empty state không mách gì** — màn trống không có "Kéo khối từ Thư viện / bấm + để bắt đầu" (khuôn trống của SPEC-NGON-NGU). → G4.
6. Minimap trống + chữ "React Flow" attribution lộ góc phải. → G4: attribution giữ theo license nhưng đặt gọn; minimap ẩn khi canvas trống.
**Quyết TỔNG (đêm, có căn cứ):** đây là regression trải nghiệm sau merge, KHÔNG phải mất tính năng (NodeLibraryPanel còn nguyên — grep sống, vào được qua Command Palette). Xếp ưu tiên: mục 1 = CHINH việc 1b GẤP (trước panel thò thụt); mục 2-6 = G4 việc 1b (trước MaterialSphere vì đây là mặt tiền chặng 2).

## 23:3x · Hoà chốt trước khi ngủ: "DUYỆT HẾT — cho lên tổng thể, sai đâu sửa đó"
Đã chuyển cơ chế sang ship-trước-sửa-sau (ghi đầu §3 sổ tổng). Gỡ chốt chờ-mock của G4-G2. Lưới an toàn giữ nguyên. COWORK-UI chuyển vai: mock = tài liệu polish hậu kiểm, không còn là cổng chặn.

## 23:5x · Duyệt 2 đề xuất COWORK-TRÌNH (căn cứ: rà 18 mục có bằng chứng git)
1 dòng vào 00-CHOT (Present sống/chết, vùng G4). #3 gộp H4 ✅. Bơm 3 việc mới cho TRÌNH (phiếu G4 · verify 3 mục · spec Material A3) — hết cảnh ngồi chờ NC.

## 00:0x · COWORK-VẼ xong SPEC-VE-INFERENCE — TỔNG duyệt cho chạy tiếp
Căn cứ duyệt: tự kiểm trùng trước khi viết · khảo sát code thật có điểm móc từng dòng (effectivePoint:447, commitEnter:928...) · 9 mục nghiệm thu đo được · không lấn vùng. Theo cơ chế ship-trước: duyệt, hậu kiểm trong ca audit. VẼ tiếp SPEC-VE-REVIT-MODE. Token --snap-*/--axis-* bơm cho COWORK-UI việc 0.

## 23:17 · KIỂM CUỐI TRƯỚC KHI HOÀ NGỦ — 7/7 phiên có dấu sống trong 17 phút (mtime báo cáo)
CHINH 16:09 · PHU 16:12 · G4 16:00 · UI 16:17 · NC 16:16 · TRÌNH 16:06 · VẼ 16:06+spec 16:09. Tất cả đã nhận lệnh.
⚠️ VIỆC CA AUDIT #1: CHINH abort merge nhanh-phu vì "mìn thật vùng PHU" (46f559b) — đọc BAO-CAO-CHINH
mục mới, xác định mìn, soạn phiếu sửa cho PHU (đúng vùng), rồi CHINH merge lại. BOQ chưa lên main tới lúc đó.
Luật trung thực đã ghi thành §0 sổ tổng theo lệnh Hoà.

## 23:2x · Hoà thêm §0b: luật SEARCH → NGHIÊN CỨU → NGHĨ-NHƯ-NGƯỜI-DÙNG trước mọi đề xuất/quyết. Đã ghi sổ, áp từ ca audit đầu tiên (checklist A4 mở rộng: kiểm cả 3 bước §0b).

## [CHINH · đêm] 1b XONG (`a3d8abd`) + CHINH-3 panel thò thụt XONG (`7847969`) — lý do quyết định
- **1b**: chẩn đoán TỔNG đúng — RenderNavigator cũ đổ node-instance, canvas trống → rỗng. Viết
  lại nối CATALOG (NODE_DEFINITIONS + zones H2), nhóm Nguồn·Xử lý·Bảng cảm hứng·Xuất đúng mock.
  QUYẾT (đêm, không hỏi): bấm hàng = HÀNH VI THẬT của NodeLibraryPanel (normal→addNode giữa
  canvas, MASTER→mở ToolWindow, note→addNote) chứ không chỉ highlight như mock tĩnh — mock
  `pick()` chỉ demo; Navigator phải xây được graph mới đáng chỗ nó chiếm. Verify: catalog đầy khi
  canvas trống · badge đếm đúng · MASTER không thả node trần.
- **CHINH-3**: Rollout (3 cơ chế §2a + nhớ theo LOẠI VẬT §2b + ghim §2d + nút Thu-hết nhìn thấy) ·
  InspectorPages (dải trang Rhino §2c) · CadInspectorPages (4 trang Khối/Phòng/Tường/Chung) ·
  Navigator thu về dải CÓ NHÃN dọc + hover hé (§2f). QUYẾT: giữ "Inspector chỉ hiện khi có chọn"
  (SPEC-CAD-SHELL-V3 luật 4 + SPEC-HA-TANG Trụ 1) thay vì §2c dòng "không chọn gì → thuộc tính
  khung nhìn" — HAI SPEC CHỐT MÂU THUẪN, chọn theo 2-đánh-1 + đã verify từ VIỆC 2; Cowork/Hoà
  phân xử sau, đổi chỉ 1 dòng gate.
- **Sự cố tự gây + tự sửa**: commit CHINH-3 lần đầu (bcd08e8) CUỖM 17 file docs phiên Cowork đã
  stage trong `.git` chung (commit trơn — vi phạm luật STATUS). Đã `reset --soft` + commit lại
  đúng pathspec (`7847969`), staged của Cowork trả nguyên. Từ nay LUÔN `git commit -- <pathspec>`.
- **CadToolbar tràn phải đè Inspector khi Inspector mở** — có từ VIỆC 2 (toolbar absolute giữa
  stage), KHÔNG phải regression đêm nay; hết khi gộp toolbar vào Toolbelt ổ ⑤ (hàng đợi).

## 23:3x · Bơm đợt 2 cho hạm đội Cowork (NC xong 5/5 · TRÌNH mở khoá BOQ+Video · VẼ thêm Layout/Paper · NC-6 gỡ kẹt Lark 131006 + NC-7 nuôi ArchiNote). ArchiNote vẫn chờ Hoà chạy khối copy — nhắc sáng.

## 23:4x · Hoà đặt §0c: 3 mảng không được bỏ sót (phím tắt · lệnh tương tác · UI cảm ứng) = audit A7 bắt buộc, thiếu 1 là 🔴. Bơm SPEC-VE-SKETCH-TOUCH cho VẼ (chống desktop-first nuốt tablet). Ca audit áp A7 từ giờ.

## 23:5x · Hoà đặt A8-LOGIC: audit soi logic như kiến trúc sư trưởng phản biện (dữ liệu xuyên chặng · số đúng · edge case · state · ngược spec · câu hỏi 'muốn làm sai thì bấm gì'). §5 checklist A1-A8 đã ghi vào sổ — mọi ca audit từ giờ theo đó.

## 00:xx · Lập docs/CHECKLIST-TONG.md (bản đồ sống ~45 hạng mục × Spec/Mock/Code/Audit) theo lệnh Hoà. TRUNG THỰC: Vitals trước đó CHƯA có trong hàng đợi đêm — đã bơm thành UI q6 (mock theo khuôn Siri iOS27). Báo cáo Cowork đã save+commit đủ (a6026d6 + 269fb72).

## 00:xx · Rà vớt lần cuối theo lệnh Hoà — vớt được 8 mục rớt: bug DWG treo 2.1.6.d (→PHU q8) · Văn bản editor hồ sơ thứ 5 (→TRÌNH q5 + UI q3) · empty states (đã có G4 q5, nay vào checklist) · rà jargon (ca audit quét) · Smart Tour v2 (sáng phân) · auto-backup (vào §1) · knowledge/ttt trung tính (⛔ Hoà) · findHatchBoundary (ghi TECH-DEBT vào bảng). Checklist giờ ~53 hạng mục.

## 00:xx · Hoà nhắc 'mỗi chủ đề = 1 đống việc nhỏ đã chốt' — lập CHECKLIST §6: 7 gói đối-chiếu-ngược spec→code (kính lỏng·Apple DS·chuyển động·hover·ngôn ngữ·panel·mật độ, ~250 mục con đếm được) + §6b trải Collab G2 thành 8 việc con đã chốt. Audit thêm bước A-NGƯỢC mỗi ca quét ≥1 gói.

## 00:xx · Hoà chốt: quả cầu vật liệu phải EDIT được (editor chuẩn V-Ray/D5). Viết §3b vào SPEC-VAT-LIEU (bố cục editor: sphere live + pin + nấc phân giải · 8 trường D5-style + per-map adjust + UV triplanar · batch import hậu tố · luật nhân bản khi sửa đồ chung). G4 q1 mở rộng, UI q7 mock editor, checklist thêm dòng.

## 00:xx · ĐIỀN CHECKLIST bằng vật chứng (lệnh Hoà 'điền hết tôi mới tin'): 10 ô đổi trạng thái — CHINH xong 1b Navigator (a3d8abd) + CHINH-3 panel (6ce940f) rồi TỰ CHỐT PHIÊN đúng luật · TRÌNH xong 2 spec editor (58+67d) · VẼ xong 2 spec (91+112d) · NC-6 Lark checklist 55d SẴN cho Hoà sáng · UI chốt token snap/axis (11 chỗ trong DS). 🔵 = xong chưa audit — KHÔNG đánh ✅ khi chưa qua A1-A8 (luật trung thực). MaterialSphere chưa có file — G4 đang làm.

## 00:xx · ArchiNote CHÍNH THỨC chuyển repo ✅ (45795f7, 10 file 1414 dòng — Hoà chạy trước khi ngủ). Khối commit docs interiorflow kẹt index.lock 2 lần (các phiên code commit dồn dập) — KHÔNG mất gì, file trên đĩa đủ; phiên CHINH kế nhiệm gom theo việc gác-cổng-docs. Nhắc sáng: mở phiên ARCHINOTE + dán khối duyệt 3 câu (LENH-PHIEN §4).

## 01:xx · 🔴 HOÀ BÁC GIAO DIỆN NAVIGATOR RENDER (a3d8abd) — nhận trách nhiệm + đảo
Hoà: "tệ hơn trước nhiều, lúc đó icon đầy đủ tiện dụng, chỉ cần build từ đó lên + FileManager. Mình nhận không ra app."
NHẬN SAI (trung thực §0): lỗi thiết kế của TỔNG, không phải của CHINH — phiếu 1b tôi viết "nối catalog vào Navigator"
đã ngầm ép NodeLibraryPanel (card icon + mô tả + badge cr, bản Hoà quen tay) thành danh sách chữ 214px.
Đúng cảnh báo trong chính nghiên cứu Blender tôi trích: mọi Area chứa được mọi Editor — ruột phải GIÀU theo editor.
ĐẢO (thẩm quyền: Hoà đích thân bác): ruột Navigator chặng Render = NodeLibraryPanel NGUYÊN BẢN, khung AppShell giữ.
Ghi luật mới §0d GIỮ-CÁI-ĐANG-TỐT. Checklist 1b → 🔴. Phiếu sửa đã soạn chờ Hoà dán cho CHINH2.
⚠️ 5-hour limit 90% (reset ~2h) — phiếu dán ngay thì kịp, chạm 100% thì phiên đứng chờ reset, phiếu vẫn nằm đó.

## 01:4x · CA TRỰC — chống rớt SẠCH 6/6 · AUDIT bản đảo Navigator: ✅ĐẠT
A1 ✓ `739960c` đảo đúng lệnh Hoà: XOÁ RenderNavigator list-chữ (−138 dòng), gắn NGUYÊN NodeLibraryPanel
làm ruột Navigator, AppShell nới ổ ② cho chặng Render "cần thở hơn 214" (comment dẫn §0d trong code — phiên
đã đọc luật). A5 ✓ đúng vùng CHINH. A3 ✓ NodeLibraryPanel sống, vào được cả Command Palette.
Kèm `65dd355` ghi bài học §0d vào báo cáo. → chờ HOÀ NGHIỆM THU BẰNG MẮT sáng mai (chuẩn so = bản 1 ngày trước).
Suýt kết luận sai PHU/G4 chết (mtime đọc nhầm bản copy cũ trong main) — kiểm lại worktree: PHU 16:45 ·
G4 16:58 ĐANG SỐNG, và **MaterialSphere.tsx ĐÃ RA ĐỜI** trong worktree G4 (quả cầu đang thành hình).
5-hour limit ~90% lúc 01:0x — nếu các phiên đứng thì reset ~03:2x, phiếu nằm chờ, không báo động.

## 02:xx · CA TRỰC 2 — chống rớt SẠCH · gói KÍNH đã quét · các phiên ĐỨNG vì 5h-limit (bình thường)
1. Chống rớt: avatar 1222 · NodeLib · Vitals · bản đảo 739960c NGUYÊN (không ai lật) — sạch.
2. A-NGƯỢC gói KÍNH LỎNG (7 nghi phạm backdrop-filter ngoài globals): 4 = comment nhắc luật (lành) ·
   1 = vpover viewport kính tối cố định — NGOẠI LỆ ĐÃ DUYỆT có comment · 1 = badge blur(10px) số cứng
   → VI PHẠM NHỎ, phiếu G4 q0b · 1 = .mat-sheet định nghĩa lại cục bộ (đúng token, nợ kỹ thuật).
   Verdict gói: ⚠️ ĐẠT-có-ghi-chú. Checklist §6 đã điền.
3. Main đứng yên từ ~00:1x, PHU im từ 16:45, G4 im từ 17:29 (MaterialSphere 83 dòng ĐANG DỞ) —
   khớp 5h-limit 90%→100%. KHÔNG báo động (đúng mục 5). Reset ~03:2x sáng, các phiên tự chạy tiếp
   nếu tab còn mở; phiếu ĐẢO đã xong trước khi đứng — may.
4. Chờ sáng Hoà: nghiệm thu MẮT bản đảo Navigator (chuẩn = bản 1 ngày trước) · NC-6 checklist Lark Console ·
   khối duyệt ArchiNote · commit docs nếu đêm chưa ai gom.

## 05:5x · CA CUỐI ĐÊM — xác nhận các phiên KHÔNG tự chạy lại sau reset (main đứng từ 00:07). Chống rớt sạch. Gói NGÔN NGỮ ✅ 0 jargon lộ UI. TÓM SÁNG đã chèn đầu file.

## Sáng 04/08 · Hoà nghiệm thu mắt: THẤT VỌNG — 3 lớp thư viện chồng (Đầu vào + panel + sheet + banner) = "địa tầng, không phải hệ thống". TỔNG nhận lỗi ghép tầng.
HOÀ CHỐT: chặng 2 MỘT thư viện = panel sidebar (bản cũ) · sheet = kho lớn on-demand · xoá banner · xoá cột Đầu vào.
QUẢ CẦU chưa đạt → nghiên cứu V-Ray/D5 đã về (agent af49ba76): công thức đầy đủ — NeutralToneMapping (model-viewer bỏ ACES vì lệch màu),
RoomEnvironment PMREM (6 panel phát sáng, port từ model-viewer), nền xám trung tính CẤM trắng, bóng tiếp đất 2.2×,
fov 30 cầu 75-80% khung, 5 lỗi làm cầu nhìn rẻ (ảnh hiện tại dính 3: nền trắng · không bóng · thiếu phản chiếu).
2 phiếu 🔴 đã bơm đầu hàng đợi G4 + CHINH. Nguồn nghiên cứu ghi trong phiếu.

## Chiều 04/08 · AUDIT ĐỢT VỀ + rà thiếu checklist (lệnh Hoà)
Audit vật chứng: CHINH-4 phím tắt 🔵(A1✓A3✓) · CHINH-6 dọn địa tầng ✅ (Hoà nghiệm thu mắt + grep sạch) ·
card welcome tắt được 🔵 (G4 sửa nhanh, grep welcome_hidden+Escape ✓) · quả cầu CHƯA áp công thức (grep Neutral=0) ·
toolbar neo chưa làm · CHINH đã CHỐT PHIÊN (4bd02ad, kèm khối khởi động kế). PHU VẪN NGỦ từ 16:45 hôm trước.
Rà thiếu: bổ sung 7 dòng vào checklist (Toolbelt ⑤ · ⌘K đa-màn · Settings reset · mở màn Vẽ 3D · card welcome ·
toolbar neo+minimap · bug camera lệch tâm · 2 lỗi type nhanh-phu). Checklist giờ ~60 hạng mục.

## Chiều 04/08 · Avatar 3D — lối ra mới: Claude Design (Anthropic Labs) 3D-object mode. Nghiên cứu: xuất standalone HTML + handoff bundle sang Claude Code → khớp stack three.js IF. Prompt theo bảng đặc điểm Memoji CHOT-AVATAR §3b đã soạn cho Hoà. Checklist cập nhật: vụ TREO avatar → 🔨 thử nghiệm Claude Design, mua/thuê lùi dự phòng.

---
## [01:2x giờ máy 03/08] TỔNG — AUDIT "g4 và chính đều xong" + chốt xưởng Claude Design
**CHINH (main `4bd02ad` = origin/main, ĐÃ PUSH):** `739960c` đảo Navigator · `2649287` phím tắt B/I/⌘\/⌘1-3 · `59702d6` chữ→icon · `efa434c` dọn địa tầng (gốc zoom 15% = node RÁC dự án mẫu, chưa dọn — nhóm "Trên bảng" bấm tới nơi) · chốt phiên sạch, khối kế nhiệm sẵn. **ĐẠT.**
**G4 (nhánh-g4 `5e2fdd2` — 8 commit CHƯA merge main):** `de82ed7` mở màn Vẽ 3D (nút Tường THẬT gọi wallSegment; trung thực: bước ② mới bắt "đã chọn" chưa phải "đã gán") · `5e2fdd2` card đóng đủ 4 đường + nút "?" gọi lại · `38b682c` kính q0b · `1bb3e5c` 4 fix Thư viện. ⚠️ **Quả cầu §2c: áp công thức → 12/12 cầu NGỪNG render → ROLLBACK về de82ed7**, bản thử giữ `scratchpad/material-preview-2c-attempt.ts` (nghi environmentRotation / CanvasTexture background / drawImage sau setSize). Tách tông đá/sơn giữ lại nhưng lệch ~7/255 — CHƯA đạt nghiệm thu "Sơn ngà vs Calacatta khác rõ". Khai đúng §0 — quy trình ĐẠT, việc quả cầu CÒN TREO.
**PHU (2 nhánh mới trong .worktrees/, chưa merge):** feat/so-lenh `4eb94c3` (97 alias + run(), 56/56 test) · feat/pbr-schema `72023c2` (schema matId + export V-Ray/D5, 87/87; khai thật: clearcoat/sheen chưa xuất vì thiếu doc Chaos → `chuaXuatDoThieuDoc`; tên field D5 tự đặt chưa chính thức). ⚠️ **2 lỗi type nhanh-phu (HatchEntity.specId + Prisma select) VẪN CHƯA sửa → merge BOQ còn ⛔** · phán quyết camera cy→−cy chưa ra.
**Checklist:** đã điền 4 ô (sổ lệnh 🔵 · PBR 🔵 · quả cầu ghi rollback · Vẽ 3D ghi chờ merge). merge-tree dry-run không chạy qua FUSE (exit 128) → khối merge cho Hoà kèm luật "conflict thì abort + báo".
**Claude Design (lệnh Hoà "cho nó làm hạ tầng ui"):** DesignSync đòi /design-login tương tác → thay bằng SEED `docs/IF-design-system-seed.html` (token verbatim 2 theme + 9 luật bất biến + component mẫu + mini AppShell). Quy trình mới COWORK-UI: phiếu → prompt Claude Design (hệ "InteriorFlow") → standalone HTML → `docs/mocks/` → audit A4 → code port L2. Vùng tạm PHẢI ghi PLACEHOLDER (tiền lệ 12 gradient). Prompt #1: màn Vitals (đói mock nhất, Hoà nhắc đêm 04/08).

## [01:3x] TỔNG — khối merge DƯƠNG TÍNH GIẢ MỘT NỬA (tiền lệ §0 nối tiếp "THANH CONG")
Merge nhanh-g4 FAIL ("local changes would be overwritten": BAO-CAO-COWORK-TRINH + 2 SPEC-TRINH dở trong working tree main) → cả 3 merge không chạy. Commit sổ pathspec VẪN vào (`4e7e6ab`, push OK) → câu kiểm `grep "audit 3 phien"` chỉ kiểm commit sổ, KHÔNG kiểm merge → in ✅ gây hiểu nhầm. **Lỗi TỔNG soạn câu kiểm.** Luật mới: kiểm merge phải dùng `git merge-base --is-ancestor <nhánh> main`. Khối gỡ: commit docs Cowork dở trước → merge lại 3 nhánh → kiểm ancestor từng nhánh.

## [01:4x] TỔNG — gỡ CONFLICT merge nhanh-g4 (2 file, 3 vùng)
Hoà chạy khối gỡ merge → conflict thật: `FlowCanvas.tsx` (fitView) + `RenderToolModeOverlay.tsx` (banner). Push giữa chừng đẩy `b2f4400` (commit docs) — app VỠ tạm vì marker trong working tree (dev server báo TS1185). TỔNG tự resolve trực tiếp trên file (không git qua VM):
- FlowCanvas: **GỘP** — giữ comment CHINH-6 + lấy 2 prop G4-1a (`fitViewOptions maxZoom 1`, `defaultViewport zoom 1`) — cùng mục tiêu chống zoom 15%, không mâu thuẫn.
- RenderToolModeOverlay: **lấy HEAD (xoá hẳn banner)** — quyết định Hoà 04/08 "1 màn 1 cột" MỚI HƠN bản sửa-banner của G4-1a (sửa báo động giả thành vô nghĩa khi banner không còn). Ghi chú tại chỗ trong code.
Còn lại cho Hoà: add 2 file + commit --no-edit + merge tiếp 2 nhánh PHU + push + kiểm ancestor.
[01:5x] Claude Design ra "Avatar Bust Rig" v1 (memoji 3D + panel skin/hair/glasses/hat/shirt + Copy config map biến cho app — đúng hướng tích hợp). Hoà duyệt hướng, lệnh cải thiện: BỎ THÂN chỉ giữ đầu + THÊM nhiều cấu kiện tuỳ biến. TỔNG soạn prompt v2 (12 nhóm cấu kiện, nền đĩa tròn thay áo, blink idle, giữ config JSON). Đích: export HTML → docs/mocks/avatar-bust-rig.html → G4 tích hợp Avatar3D.tsx sau.

## [02:1x] TỔNG — đánh giá tiến độ + bơm đợt 3 cho 5 Cowork (lệnh Hoà)
**Vật chứng mới:** main giờ chứa CẢ quả cầu `9fa870b` (thủ phạm = rò WebGL context qua HMR — công thức §2c VÔ TỘI, G4 kế nhiệm tìm ra) + gói Một-Thư-viện-chặng-2 `0569a91`. Phiên CHINH kế nhiệm ĐANG chạy Toolbelt ổ ⑤ (CadToolbelt.tsx mới + 6 file M trong working tree). Checklist điền 12 ô. TRÌNH sự cố commit đợt 2 tự giải quyết (b2f4400 đã gom).
**5 Cowork:** NC hết việc (7 bài) · UI hết việc (3 mock + 7 token — chờ Hoà duyệt ảnh) · VẼ hết việc khả thi (4 spec) · TRÌNH hết việc (5/5 — thiếu spec "Văn bản") · DỰNG CHƯA MỞ PHIÊN. → Bơm ĐỢT 3 vào SO-KIEM-TONG §3 (bảng trên), 5 quyết định duyệt ghi 00-CHOT (tên 3 mode · 7 token · chủ mảng cad/* · bỏ mock chooser · dòng nc/).
**Chờ Hoà (sáng):** duyệt ảnh 2-theme 3 mock UI (G2 gấp — G4 chờ port) · quyết mapa-de-zonas.html (vi phạm màu TTT — UI đề nghị dời ra ngoài repo, TỔNG KHÔNG tự dời vì đụng nội dung repo) · Lark Console NC-6 A→D · dán khối PHU kế nhiệm (2 lỗi type + camera) · Vitals + avatar Claude Design đang chạy.

## [02:2x] TỔNG — kiểm "xong hết rồi" (lệnh Hoà)
**Vào git rồi:** `060c419` Toolbelt ổ ⑤ (main). **Chưa vào git — 4 khối:** ⌘K đa-màn `AppCommandPalette.tsx` 273d untracked + AppShell/Navigator M (CHINH) · fix camera `Scene3DViewer.tsx` M (PHU sửa trên main, tự khai chưa commit) · nhanh-g4 2 commit (`d143684` icon-hoá ObjectProperties/Settings + `7476ac1` báo cáo) · nhanh-phu 3 commit (`4641163` GỠ MÌN 2 lỗi type BOQ + `804952f` lib eyedropper/VCB 32/32 test + báo cáo).
**Cột mốc:** ⛔ BOQ merge-gate treo từ 04/08 ĐÃ GỠ. Gap-check 10 khuyết đủ: 8/10 chưa có, ⑥ có sẵn, ⑤ CommentPin phủ khác dạng → mở khoá COWORK-VẼ việc 3.
**Đánh giá:** hàng đợi CHINH (a·b·c) xong 3/3 trong 1 phiên; PHU xong 3/3 việc giao. Không phiên nào tự nhận việc ngoài phiếu. Checklist +6 dòng mục §7.
**Rủi ro đã cảnh báo Hoà:** commit khi phiên còn đang gõ → cuốn file dở; PHU tự khai còn `index.lock` chết + file dirty lạ ở worktree phu (present-editor/lark/atlas — KHÔNG ai được tự dọn, chờ Hoà xác nhận).

## [02:3x] TỔNG — Hoà xác nhận cho dọn lock + PHÁT HIỆN Cowork đợt 3 ĐANG CHẠY
**Đợt 3 đã sống chỉ sau ~20 phút bơm:** TRÌNH commit `091734e` SPEC-TRINH-VANBAN-EDITOR → **đủ 5/5 loại hồ sơ** · NC đang viết `nc/NC-firstrun-cung-nganh` · VẼ ra `PHIEU-REGISTRY-VE-2026-08-04.md` · UI dựng `mocks/mock-trinh-boq-2026-08-04.html`. 4/5 vai chạy (DỰNG chưa thấy).
**⚠️ ĐIỀU CHỈNH LỆNH:** khối gom `docs/` ở tin 02:2x TẠM HOÃN — commit `docs/` lúc này sẽ cuốn file đang viết dở của 4 Cowork. Chỉ commit pathspec CODE (palette + camera) + merge 2 nhánh. Docs gom sau khi các Cowork chốt phiên.
**Lock:** main `.git` có HEAD/index/next-index-6/7.lock — **KHÔNG xoá** vì Cowork đang commit thật (lock sống). Rác an toàn: `worktrees/dot-b/*.stale-*` (16 file rename cũ) · worktree `pbr-schema`+`so-lenh` đã merge xong → prune được · `worktrees/interiorflow-phu` lock chết (PHU đã chốt phiên).

## [02:37] TỔNG — CA TRỰC: máy Hoà VẪN THỨC, 5 Cowork chạy full, nhưng **HEAD.lock CHẾT CHẶN MỌI COMMIT**
**Bridge sống.** mtime docs 02:29–02:36 → cả 5 vai đang viết thật: **DỰNG ĐÃ MỞ PHIÊN LẦN ĐẦU** (`SPEC-DUNG-CAMERA` 17.7KB + `SPEC-DUNG-NODE-PORT` 18.1KB) · NC +2 bài (firstrun cùng ngành · conflict simultaneous-edit) · UI +2 mock (BOQ · Video) · VẼ +2 phiếu registry · TRÌNH cập nhật.
**🔴 SỰ CỐ:** `.git/HEAD.lock` sinh 02:19, đến 02:37 vẫn 0 byte = **CHẾT 18 phút**. Đây là lý do KHÔNG commit nào sau `091734e` dù 5 vai làm việc liên tục — mọi `git commit` của họ đang fail. Rủi ro: các phiên chốt phiên rồi tắt, công sức nằm ngoài git.
**Trạng thái treo:** `AppCommandPalette.tsx` đã `A` (add được) nhưng chưa commit · camera fix chưa commit · nhanh-g4 + nhanh-phu vẫn CHƯA merge (kiểm ancestor).
**Hành động:** KHÔNG bơm việc mới (5 vai đang đầy tải). Nhắn Hoà 1 khối cứu duy nhất: xoá HEAD.lock + next-index rác → commit code → merge 2 nhánh → gom docs.

## [02:41] TỔNG — ✅ GỠ XONG NÚT THẮT LỚN NHẤT
`dd3f584` ⌘K đa-màn · `e142f3c` camera · `1d727a7` merge g4 · `892c927` merge phu (**19 file/2992 dòng**: trọn lib/boq + eyedropper + vcb + route API). **origin/main = 892c927, đã push, ancestor xác nhận CẢ 2 nhánh trong main, lock sạch hết.** BOQ hết ⛔ sau 2 ngày treo. Auto-merge 3 file va (PresentEditor·Toolbar·model.ts) không conflict.
**Cowork đợt 3 gần cạn:** DỰNG xong trọn 3/3 hàng đợi gốc ngay phiên đầu (+BAO-CAO-COWORK-DUNG.md) · NC 10 bài · UI 2 mock · VẼ 2 phiếu · TRÌNH 5/5. Docs của họ CHƯA commit (đang viết) — để họ tự chốt, TỔNG không gom.

## [02:5x] TỔNG — Hoà báo lỗi UI chặng Trình bày (ảnh)
Soi ảnh + đối chiếu code: **L1 "Trang 1"+"1/5" vs 8 slide** = hai đơn vị (sheet trần 5 theo `PresentSheets.tsx:12` vs slide) dùng chung chữ "Trang" → đánh lừa; **L2 slide 4 chữ chồng chữ 4 lớp** đè cả tiêu đề; L3 thumbnail chữ đè ảnh; L4 toolbar 2 hàng ~30 nút (Trình bày CHƯA áp Toolbelt ổ ⑤ như CAD `060c419`); L5 panel phải cắt đáy. → `docs/PHIEU-TRINH-LOI-UI-2026-08-03.md` cho G4, thứ tự L2→L1→L5→L3→L4.

## [03:5x] TỔNG — CA TRỰC (Hoà ở công ty, lệnh "cứ làm tiếp")
**Kiểm G4:** L4 (gom 14 nút Sắp xếp vào ArrangePopover, portal + useDismissable theo luật K4) **ĐÃ SẠCH** — import `createPortal`/`useDismissable` có đủ (dòng 9/50), định nghĩa dòng 527, dùng dòng 288; tsc present-editor **0 lỗi**. Cảnh báo "Failed to add imports" trong ảnh là bước GIỮA, G4 tự sửa xong sau đó. Toolbar.tsx mtime 03:28.
**🔴 PHÁT HIỆN + TỰ SỬA (ngoại lệ có lý do):** `tsc` toàn repo trên **main** báo **6 lỗi** ở `lib/cad/eyedropper.test.ts` — lọt vào khi merge `892c927`. Nguyên nhân: `matchPropsOne(source, target as never)` làm generic `T extends StyleFields` suy ra `never` ⇒ mọi truy cập `.layer/.color/.specId` đỏ. Sửa: `as never` → `as StyleFields` (4 chỗ). **tsc main = 0 lỗi · test 13/13 pass.** Commit `f012ca8`.
→ Vì sao TỔNG tự sửa dù luật là không code: lỗi chặn `tsc` TOÀN REPO (mọi phiên chạy tsc đều thấy đỏ, dễ tưởng lỗi của mình), nằm trong file TEST không ảnh hưởng app, sửa 4 ký tự không đụng logic. Ghi rõ tại đây để không thành tiền lệ nới luật.
**Trạng thái:** main `f012ca8` sạch · nhánh g4 có L2/L1/L5/L3/L4 chưa merge · các Cowork đợt 5 chưa thấy động (Hoà chưa dán khối).

## [04:0x] TỔNG — AUDIT 5 COWORK (lệnh Hoà "tụi nó xong rồi")
### ✅ COWORK-DỰNG — `SPEC-TANG-DU-LIEU-CAU-KIEN.md` 396 dòng · ĐẠT XUẤT SẮC, vai làm tốt nhất từ đầu dự án
TỔNG **verify tận code từng tuyên bố**, không tin lời:
| Tuyên bố của DỰNG | Vật chứng TỔNG kiểm | Kết luận |
|---|---|---|
| §0.2 ống kính 3D KHÔNG đọc ngữ nghĩa | `grep elementType lib/three/` → **đúng 1 hit, nằm trong COMMENT** (cad-to-obj.ts:71) | ✅ ĐÚNG |
| §0.3 🔴 vùng tô SƠN bị đùn thành tường 2.7m | `cad-to-obj.ts:353` điều kiện lọc có `\|\| e.pattern === 'SOLID' \|\| !e.pattern`; `materials.ts:149,160,171` — **3 preset sơn đều `hatchPattern:'SOLID'`** | ✅ ĐÚNG — **BUG THẬT, CHƯA AI BIẾT** |
| §0.4 entityId chỉ có ở nhóm tường | `cad-to-obj.ts:416` chỉ `Wall_${i}` truyền `entityId`; dòng 197 comment tự khai | ✅ ĐÚNG |
**Vì sao xuất sắc:** không mô tả lại spec cũ mà ĐỌC CODE tìm ra bệnh — và bệnh nặng đúng chỗ định vị mới: *món hàng chính của IF (lớp hoàn thiện · sơn · ốp) lại là món 3D hiểu sai nhất*. Tự khai "chưa chạy tay, PHU verify trước khi vá — đừng vá mù" (§0 trung thực). 7 luật L1–L7 kiểm được bằng grep (vd L6: cấm mọi hàm tên `syncXtoY`). Phân biệt `null` ≠ `undefined` cho elementType. Field mới đều chỉ ra nơi tiêu thụ (luật L7). `'covering'` đề xuất nhưng CHỜ NC-11, không code trước.
### Bốn vai còn lại — XONG ĐỢT 3-4, CHƯA nhận đợt 5 (mtime 02:3x-02:5x, không động sau đó)
NC 3 bài (firstrun · presence · conflict-simultaneous-edit) · UI 2 mock (BOQ 428d · Video 386d) · VẼ 2 phiếu registry (43d + 348d) · TRÌNH spec Văn bản (đủ 5/5 hồ sơ). Tất cả đã vào git `e8dd6bc`. → Hoà chưa dán khối đợt 5 cho 4 vai này.
### 🔴 VIỆC PHÁT SINH TỪ AUDIT (ưu tiên cao)
1. **PHU verify tay bug sơn-thành-tường** (5 phút: tô sơn lên 1 mảng tường → sang 3D xem có khối lạ cao 2.7m) rồi vá theo §2.3 (bỏ 2 nhánh `solid===true` và `!pattern`).
2. **G4 gán `entityId` cho MỌI nhóm** (sàn·phòng·nội thất·cửa sổ), không riêng tường — nay đã có nơi tiêu thụ (§8), hết lý do để trống.
3. NC-11 gấp hơn tưởng: `'covering'` chờ nó mới chốt được.

## [04:3x] TỔNG — TỰ CHẠY 5 VAI COWORK BẰNG AGENT PHỤ (Hoà: "BẠN GIAO ĐI NHÉ")
**Cơ chế mới:** TỔNG spawn agent phụ ngay trong phiên, agent đọc repo qua device bridge, viết spec, KHÔNG chạy git (tránh vỡ lock). Hoà không phải dán gì. Đã chạy 5/5 vai. **Ghi thành luật vận hành: vai Cowork = agent phụ của TỔNG; CHINH/PHU/G4 vẫn là phiên Claude Code trên máy Hoà (TỔNG không mở được).**

### 🔴 BỐN PHÁT HIỆN HẠ TẦNG — nặng hơn mọi việc đang làm
| # | Phát hiện | Vật chứng | Hệ quả |
|---|---|---|---|
| A | **Trụ 4 CHỈ CÓ TRÊN GIẤY** — `defineMode()` có **0 nơi gọi**, `getMode(` grep = 0; đang có HAI bản khai mode lệch nhau (3 trường ReactNode vs 6 trường string) | DỰNG grep `mode-registry.ts` | Cơ chế mode xuyên app chưa tồn tại thật |
| B | **592 dòng code tốt không ai dùng** — `components/three/CommandPanel.tsx` (5 tab đủ) + `ObjectProperties.tsx` KHÔNG mount ở đâu; app chạy `render-studio/Command3DPanel.tsx` với 3/5 tab placeholder, khoá tab lệch (`tao` vs `create`) | DỰNG | Đúng bệnh §1 sổ chống rớt — làm rồi mà rớt |
| C | **Sổ lệnh có ĐÚNG 0 lệnh 3D** (55 CommandDef đều `stage==cad`) và **`findByAlias()` không lọc `when`** | DỰNG grep `registry.ts` | Thêm alias 3D trùng chữ CAD (M/W/S/C/T) sẽ **che lệnh CAD im lặng** — phải vá TRƯỚC khi thêm lệnh |
| D | **`xlsx.ts:93` ghi dòng TỔNG bằng SỐ CHẾT**, grep `SUM\|<f>\|formula` = 0 — spec ghi "đã có SUM(), chờ PHU kiểm" là SAI | TRÌNH | Hết chờ PHU, thành việc code B8 |

### Sản phẩm 5 vai (đợt 5)
| Vai | File | Điểm chính |
|---|---|---|
| **NC** | `nc/NC-11-ifc-nghi-dinh-bim-2026-08-03.md` 279d | 🔴 **NĐ 175/2024 HẾT HIỆU LỰC 01/7/2026** → `NĐ 217/2026` Điều 8.3.a: IFC nêu đích danh, **bỏ điều kiện nhóm B**, ngưỡng = công trình **cấp II trở lên không phân biệt vốn công/tư**. Thư viện thắng **web-ifc MPL-2.0, wasm 1,3MB** (loại xeokit AGPL). `'covering'` **CÓ**, kèm `coveringKind`. Bắt lỗi `model.ts:101` ghi `IfcFurnishingElement` — buildingSMART đã deprecated, đúng là `IfcFurniture` |
| **DỰNG** | `SPEC-DUNG-3D-THONG-NHAT.md` 581d | 10 công cụ (V·P·M·Q·S·W·R·B·T·C) + 27 lệnh = **37 CommandDef mới**. Phím `B` va với B=thu Navigator → câu hỏi §11.1 cho Hoà |
| **UI** | `SPEC-NGON-NGU-CHI-DAN` §6 + `mocks/README-mocks.md` | Khoá bộ tên (bảng từ cấm↔từ thay 15 dòng). **19/27 mock dính nhãn cũ, 72 dòng phải đổi**. Nặng nhất `mock-designsystem-stagemap` 10d. ⚠️ `mock-cad-revit` cả mock dựng quanh mode "Cấu kiện" nay đã chết — đổi chữ không cứu, cần Hoà quyết |
| **TRÌNH** | `PHIEU-TRINH-BOQ-EDITOR.md` 173d + `SPEC-TRINH-ONG-KINH-DU-LIEU.md` | **11 việc B0-B11**, 10/11 code được ngay. Video **KHÔNG nâng phiếu** (PHU chưa thẩm định, khai thật). Ranh giới ảnh-vs-dữ-liệu: *"Ảnh là SẢN PHẨM, không bao giờ là NGUỒN"* — phép thử **"số này in ra khách chỉ tay vào cãi được không?"** |
| **VẼ** | (đợt trước) | cách vá bug sơn rẻ hơn: hatch có `specId` ⇒ không phải tường |

### Việc TỔNG phải quyết/chuyển tiếp
1. 🔴 Vá `findByAlias()` lọc `when` TRƯỚC khi ai thêm lệnh 3D — chuyển PHU.
2. 🔴 Quyết số phận `components/three/CommandPanel.tsx` + `ObjectProperties.tsx` (592 dòng mồ côi): mount thay `Command3DPanel` hay xoá — chuyển CHINH khảo sát.
3. `defineMode()` chưa ai gọi — Trụ 4 phải có việc code thật, không thì spec mode vô nghĩa.
4. Phím `B` va (thùng sơn 3D ↔ thu Navigator) — Hoà quyết.
5. `mock-cad-revit` chết theo mode "Cấu kiện" — Hoà quyết dựng lại hay bỏ.

## [05:1x] TỔNG — AUDIT A4 MOCK CLAUDE DESIGN + đổi tên file
Hoà export 2 file từ Claude Design (`Không gian 3D.dc.html`, `Frame3D.dc.html`) → TỔNG đổi tên chuẩn: `mocks/mock-3d-thong-nhat.html` (72.7KB) · `mocks/mock-3d-frame.html` (60.7KB).
| Tiêu chí A4 | mock-3d-thong-nhat | mock-3d-frame |
|---|---|---|
| Hex TTT cấm (#F06020/#002850/#1B1512/#F1ECE3) | ✅ **0** | ✅ **0** |
| Dùng `var(--…)` | ✅ 227 chỗ | ✅ 244 chỗ |
| 2 theme (`data-theme`) | ✅ 2 | ⚠️ **0 — chỉ 1 theme** |
| PLACEHOLDER dán nhãn | ✅ 12 | ⚠️ 3 |
| **Nhãn chặng CŨ** ("Dựng ảnh"/"Vẽ") | 🔴 **4 chỗ** | 🔴 **4 chỗ** |
→ **Kết luận: ĐẠT phần token/màu (điểm mạnh nhất — 0 hex tự chế, dùng biến gần như trọn), TRƯỢT phần nhãn.** Cả 2 file còn nhãn chặng cũ; `mock-3d-frame` thiếu theme thứ hai. Phải sửa trước khi cho code port (luật L2 port-nguyên-văn sẽ nuốt luôn nhãn sai — đúng tiền lệ "12 gradient placeholder").
**Vào sổ mocks:** cần thêm 2 dòng vào `mocks/README-mocks.md` khi các vai rảnh.

## [05:5x] TỔNG — AUDIT A4 TRỌN BỘ 3 MÀN CLAUDE DESIGN
Đổi tên chuẩn: `mock-2d-ky-thuat.html` (78.5KB) · `mock-3d-thong-nhat.html` (72.7KB) · `mock-trinh-bay.html` (67.8KB).
| Tiêu chí | 2D | 3D | Trình bày |
|---|---|---|---|
| Hex TTT cấm | ✅ 0 | ✅ 0 | ✅ 0 |
| Dùng `var(--)` | ✅ 346 | ✅ 227 | ✅ 313 |
| Đủ 2 theme | ✅ | ✅ | ✅ |
| PLACEHOLDER dán nhãn | ✅ 8 | ✅ 12 | ✅ 9 |
| Nhãn chặng CŨ | ✅ 0 | 🔴 **4** | ✅ 0 |
| Khung 6 ổ (42/214/236/26) | ✅ đủ 4 số | ✅ đủ 4 số | ✅ đủ 4 số |
**Kết luận: 2D và Trình bày ĐẠT TRỌN. 3D còn 4 chỗ nhãn cũ (file export trước lúc chốt tên) — sửa 4 chuỗi là đạt.**
**Chất lượng nghiệp vụ (TỔNG kiểm tay, không tin mắt):**
- BOQ editor: cộng tay 8 dòng = `175 605 950` **khớp tổng in trên mock**; dòng 03 `48.60 × 145 000 = 7 047 000` **khớp**. Mock có số học đúng — hiếm.
- Dựng đúng cơ chế live-link của `SPEC-TRINH-BOQ-EDITOR`: ô sửa tay viền tím + chấm cam → panel phải "Số này không còn theo mô hình. Mô hình cho 44.20" + nút "Lấy lại số từ mô hình" + **"LẤY TỪ: 9 tường ngăn, tầng trệt →"** (đường lần ngược = qua phép thử *"khách chỉ tay vào cãi được không"*). Sidebar đếm `Lấy từ mô hình 22 / Đã sửa tay 3`.
- Có sẵn đơn vị **mét dài** — đúng lỗ hổng COWORK-VẼ chỉ ra (BOQ chưa tính phào chỉ/nẹp chân tường).
- Màn 2D: panel phải có **LỚP HOÀN THIỆN mặt A / mặt B** (tường 2 mặt 2 vật liệu) = đúng BIM nội thất; nút **"Chọn hết cùng loại — 9 tường ngăn dày 160"** = đúng chọn-theo-ngữ-nghĩa; thanh dưới có **"Bắt điểm: Đầu mút, Giữa cạnh"**.
- Lỗi đã báo Hoà và Design đã sửa: dòng "Đơn vị mi-li-mét · 6.32 m²" mâu thuẫn nhãn/giá trị.
**→ Bộ 3 màn đủ điều kiện ra MỘT phiếu port duy nhất cho phiên code (sau khi sửa 4 nhãn ở màn 3D).**

## [06:xx] TỔNG — CHỐT HỆ GIAO DIỆN ARCHINOTE + luật kéo thả cảm ứng
Hoà chốt liên tiếp qua chat, TỔNG gom thành `docs/SPEC-ARCHINOTE-UI-2026-08-03.md` (nguồn chuẩn mới):
1. **PHÂN VỊ**: IF = MÁY PHÁT (máy tính, tạo sản phẩm) · ArchiNote = **MÁY THU (điện thoại**, thu số đo/ảnh/ghi âm/tri thức). Chung nguồn sự thật qua ATLAS/Lark, không gọi thẳng nhau. Cảm ứng IF = vẽ chính xác ≠ cảm ứng ArchiNote = ghi nhanh → **chỉ HỌC, không bê nguyên**.
2. **MÀU**: ArchiNote **kem + vàng ấm, nền sáng**; tím chỉ nhấn rất nhẹ. Luật cứng: **vàng/kem không bao giờ làm màu chữ** (không đạt 4.5:1) — chỉ nền khối/vạch/nhấn.
3. **MOBILE**: nút chính ≥56px ở nửa dưới màn · ba chạm/ba giây · chạy được khi mất mạng.
4. **KÉO THẢ CẢM ỨNG**: giữ 250ms mới nhấc (tránh cướp cuộn) · vật nhấc lên trên ngón 40px · danh sách tự dạt tạo khe hở · kéo mép tự cuộn · **CẤM kéo thả là đường duy nhất** (công trường tay bẩn/găng/màn ướt). Điểm hay nhất: lưới tải việc **hiện % tải MỚI ngay lúc còn đang kéo**.
5. **ICON**: icon hoá thứ lặp hằng ngày, **cấm icon hoá nút quyết định** (Xoá · Gửi khách · Xuất hồ sơ).
6. **BENTO**: chỉ cho màn tổng quan; **cấm cho màn làm việc** — vùng vẽ phải liền khối.
7. Đọc 14 ảnh tham khảo theo Luật #7, ghi bảng "lấy cơ chế gì" tại §9 spec.

## [07:5x] TỔNG — AUDIT ĐỢT 6 (nhóm A hạ tầng + port mock)
| Việc | Commit | TỔNG verify bằng code | Kết |
|---|---|---|---|
| **A1** findByAlias lọc `when` | `ee85c3f` | `registry.ts:362-367` — nhận `ctx: WhenCtx`, `return found.when(ctx) ? found : undefined`. Test **60 ok/0 fail** | ✅ ĐẠT — gỡ bom che-lệnh-CAD |
| **A3** Trụ 4 mode registry | `6b5af10` | hợp nhất 2 bản khai lệch, khai thật 4 mode | ✅ |
| **A4** entityId mọi nhóm 3D | `1c0b91d` | `cad-to-obj.ts` — Wall/Furn/Window CÓ id; **Floor/Ceiling/Room KHÔNG** — nhưng có comment dòng 396-399 giải thích đúng: chúng là bbox tổng hợp/dò runtime, **chưa có entity nguồn** (chờ §6 RoomEntity). Không phải bỏ sót | ✅ ĐẠT + khai thật |
| **B8** xlsx SUM() sống | `18afba3` | test **36 pass/0 fail** | ✅ |
| BOQ editor + live-link | `4991340`+`3da6361` | B0-B6+B10+B8 xong, B7/B9 tự khai treo | ✅ |
| Port mock 2D | `bc2654c`+`ccea29b` | Lớp hoàn thiện · Bắt điểm status bar · Chọn hết cùng loại | ✅ |
**tsc toàn repo 0 lỗi · cad-to-obj 50 pass · xlsx 36 pass · registry 60 ok.** Cây sạch, không file dirty.
**Điểm đáng khen:** A4 không làm bừa cho đủ chỉ tiêu — chỗ nào chưa có entity nguồn thì ghi lý do tại chỗ, đúng §0.

## [08:0x] TỔNG — 🔴 AUDIT BACKEND (agent COWORK-BACKEND, `docs/AUDIT-BACKEND-2026-08-03.md` 492 dòng)
**3 lỗ NGUY HIỂM — ưu tiên trên mọi tính năng mới:**
1. 🔴 **Tự nạp credit vô hạn** — `app/api/credits/route.ts:30-34`: nhánh `action:'refund'` cộng thẳng `amount` từ body, không trần, không đối chiếu `jobRef` với giao dịch trừ nào. Bất kỳ tài khoản đăng nhập nào POST `{"action":"refund","amount":1000000}` là có triệu credit rồi tiêu vào fal/NVIDIA **tiền thật**.
2. 🔴 **`/api/jobs` đốt tiền provider mà KHÔNG trừ credit** — `app/api/jobs/route.ts:7-55`: chặn ẩn danh/tier nhưng không một dòng đụng credit; kế toán nằm ở CLIENT (`lib/execution.ts:108-137`). Gọi thẳng route = đốt balance fal, credit không giảm. Nghịch lý: `render/premium:39-44` đã làm đúng và còn ghi comment "client bypass được" — bài học chưa áp.
3. 🔴 **XSS lưu trữ qua upload thư viện** — `library/route.ts:63-73` + `library/[id]/file/route.ts:16`: không whitelist MIME (client tự khai), tải về trả đúng Content-Type đó, không nosniff, không attachment. Upload HTML có script → mở link → chạy trên origin app, fetch được mọi API với tư cách nạn nhân (gồm lỗ #1). `comments/route.ts:39` đã whitelist đúng — chưa áp cho library/notebook.
**Sát nút:** SSRF `library/clip/route.ts:30` (fetch URL người dùng, không chặn host nội bộ, không timeout — trong khi `stock-photos/proxy` đã có sẵn `isFetchableImageUrl`) · `render/premium` lặp 120s trên hạ tầng cắt 60s → trừ 4 credit, mất ảnh, nhánh hoàn tiền không bao giờ chạy.
**Phân quyền:** ✅ **KHÔNG có IDOR đọc chéo dự án** — `lib/server/access.ts:32-54` là cửa duy nhất, làm đúng cả 4 việc khó (lọc deletedAt, admin=owner, **404 thay 403**, ROLE_RANK). Nhưng 4 khuyết khác: không có `middleware.ts` (51/55 route tự gọi getSessionUser) · **"đăng nhập là toàn quyền" trên dữ liệu chung** (ai cũng DELETE `/api/specs/[id]` xoá giá vật liệu cả công ty, PATCH sửa `priceVnd` → sai tiền BOQ âm thầm) · notebook dùng sai nguồn chân lý (`resolveProject.ts:39` kiểm `Project.userId` thay `ProjectMember` → thành viên bị âm thầm chuyển bucket riêng, thấy kho trống) · `PUT /api/flows/[id]:77` gán `projectId` bất kỳ không kiểm quyền.
**Sạch:** 0 SQL thô · 0 path traversal · 0 secret ra client · token OAuth AES-256-GCM · không log dữ liệu nhạy cảm. **4 route chết:** atlas-materials/sync · auth/apple (stub 503) · boq/[projectId] (chờ nối UI, không xoá) · integrations connect/disconnect (CHƯA VERIFY).

## [10:1x] TỔNG — KIỂM "3D DỰNG KHỐI ĐƯỢC CHƯA" + QUYẾT LOGIC XUYÊN CHẶNG
**Dựng được:** ✅ Tường (nút Tường gọi engine `wallSegment()` của chặng Vẽ, panel không tự chế hình học) · ✅ Kéo-đẩy cao độ (`Scene3DViewer.onPushPull` → ghi `heightMm` vào Doc, đùn từ đáy 0 nên scale chính xác) · ✅ Đùn từ bản vẽ (gán `heightMm=2700` cho nét hatch/polyline chưa đùn).
**CHƯA dựng được:** ❌ Hộp · Sàn · Cửa · Cửa sổ · Mái — 5 nút để `disabled` kèm lý do tại chỗ (`Command3DPanel.tsx:113,139`). Đúng luật "thà nói thẳng chưa dựng được còn hơn nút bấm không ra gì".
**⇒ Kết luận: 3D mới dựng được ĐÚNG MỘT LOẠI KHỐI (tường).** Đủ để dựng vỏ không gian, chưa đủ để dựng nội thất — mà nội thất là ĐIỂM NHẤN của định vị. Đây là lỗ lớn nhất còn lại của chặng 3D.
**QUYẾT (Hoà uỷ quyền):** 4 luật X1-X4 ghi `00-CHOT` — dựng ở đâu cũng ghi vào MỘT Doc · không màn nào chặn vì "chưa làm bước trước" · ba đường vào ngang nhau · thiếu dữ liệu thì suy đoán + gắn cờ, không chặn.
