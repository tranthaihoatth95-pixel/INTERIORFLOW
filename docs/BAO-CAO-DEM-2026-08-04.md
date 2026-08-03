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
