# SỔ KIỂM TỔNG — HỆ IDF
**Luật Hoà 03/08 (nguyên văn):** *"Mỗi lần thay phiên bạn phải đọc cho tôi, không được rớt một ngữ cảnh nào,
không được mất mát một tính năng nào đã gây dựng. Đó là luật."*
**Cách dùng:** phiên MỚI nào (Cowork hay Code) cũng đọc file này TRƯỚC TIÊN. Cowork trực ca đọc §1 mỗi ca —
tính năng nào mất khỏi UI/code mà không có quyết định ghi ở `00-CHOT.md` = **BÁO ĐỘNG, không phải "chắc ai đó xoá có lý do".**
Append-only: chỉ thêm dòng, đổi trạng thái có ngày; không xoá dòng.

---

## §1 · SỔ CHỐNG RỚT — tính năng đã gây dựng (kiểm được bằng lệnh)

| Tính năng | Ở đâu | Trạng thái | Lệnh kiểm nhanh |
|---|---|---|---|
| Avatar SVG — **đã đổi hướng Memoji** (`83127a1` bỏ chất nỉ, volume gradient; 03/08) | `components/avatar/AvatarRenderer.tsx` | ✅ sống, 1222 dòng | `wc -l` ≈1222 · `git log -3 -- <file>` |
| Trang đổi avatar theo mock v2 | `app/settings/avatar/` | ✅ `88566c6` | mở `/settings/avatar` |
| Vitals (bong bóng + chat) | `components/studio/VitalsChatBubble.tsx` + StatusBar | ✅ sống | grep Vitals StatusBar |
| **Mood+Collab: node moodboard/gu/ghi chú** | sidebar chặng 2 (`NodeLibraryPanel`) | ✅ sống (ảnh Hoà 03/08) | mở Rendering, khu MOOD+CỘNG TÁC |
| **Presence online/offline · mời(+) · sticky/comment/reaction · share Viewer/Commenter/Editor** | — | ⬜ **CHƯA BUILD** — là bước **G2** ticket CHANG2. KHÔNG PHẢI MẤT | `grep -n "G2" docs/TICKET-CHANG2-BUILD-2026-08-02.md` |
| 3D viewer 5 mode (orbit·campath·depth/lineart·section·walk) | `lib/three/*`, `Scene3DViewer` | ✅ `d9eea9b d7dff63 4c81469 87c2e78 2881c32` | `git log --oneline -- lib/three/capture.ts` |
| captureSequence streaming + AbortSignal | `lib/three/capture.ts` | ✅ `57ed9b8` | test capture |
| BOQ engine (compute·xlsx·cache·from-project·model·route) | `49ebadd` trên **nhanh-phu**, đã push origin | ✅ vào git 03/08 tối (12 file, 1322 dòng) — chờ merge main | grep "feat(boq)" trong git log --all |
| ATLAS↔Lark client + map + sync route | `lib/lark/*`, `app/api/atlas-materials/sync/` | 🟡 code xong, chặn 131006/token i-HOA | chạy sync |
| File Manager thật (list/upload/real-fs/inspector) | `components/filemanager/*`, `lib/filemanager/real-fs.ts` | ✅ merge `12223cf` | mở `/files` |
| Settings + hình nền canvas áp thật | `app/settings/*` + `CanvasWallpaper` trong `app/layout.tsx` | ✅ đã wire `e6edcf1` | đổi hình nền → reload cứng |
| Thư viện = MỘT sheet (trang /library khai tử) | `a73c658` trên **nhanh-g4, CHƯA merge** | 🟡 chờ merge (main đã xoá StageShell → cần luật xử mount) | `git log nhanh-g4 -1 -- components/library/LibrarySheet.tsx` |
| Mode Vẽ 3D: CommandPanel·Viewport3D·ObjectProperties | `20e935d f6868e7 245b96b` trên **nhanh-g4** | 🟡 xong, chờ merge | `git log nhanh-g4 -3` |
| AppShell 6 ổ phủ CẢ 5 màn, LeftRail + StageShell ĐÃ XOÁ | `9fe8be8 3a92170` | ✅ (nút Thư viện chờ nối sheet sau merge g4) | grep LeftRail = 0 |
| Intro trung tính (hết màu/ảnh TTT) | `components/intro/*` | ✅ `63cc673` | grep detech/F06020 intro |
| Layer State + lớp/nét/ẩn/khoá chặng Vẽ | sidebar CAD | ✅ (ảnh Hoà) | mở CAD |
| CAD: L·PL·REC·C·ROOM·dim·hatch·block 46·DXF/DWG·zone·AI-assist | `lib/cad/*` | ✅ | `npm test -- cad` |
| Kính lỏng K1-K4 + luật portal | `globals.css` + spec | ✅ | — |
| Tooltip tĩnh cảm ứng | `globals.css:1030` | ✅ | — |
| Gallery/Notebook/Login/Journey/Smart Tour | các nhánh đã merge | ✅ | mở app |
| Panel thò thụt: Rollout (tiêu đề/grip/chuột phải/ghim/nhớ theo LOẠI VẬT) + InspectorPages Rhino + dải thu gọn CÓ NHÃN | `components/studio/Rollout.tsx`·`InspectorPages.tsx`·`CadInspectorPages.tsx` | ✅ `7847969` (04/08 đêm) | chọn entity CAD → Inspector; thu Navigator |
| **Điều còn TREO chờ Hoà** | avatar 3D (mua/thuê/Blender) · Google Flow video intro · quyền Wiki Lark · dọn `public/detech` 22MB | ⏳ | `00-CHOT.md` |

## §2 · PHÂN MẢNG — mỗi phiên một vùng, không ai đụng ai (Hoà duyệt 03/08)

| Phiên | Mảng SỞ HỮU | Vùng file | Cấm đụng |
|---|---|---|---|
| **CHINH** | Vỏ app & hạ tầng UI: AppShell 6 ổ · Navigator · dock · sổ lệnh UI · panel thò thụt (rollout/grip/ghim) · theme | `components/studio/*` · `app/globals.css` · `app/layout.tsx` | filemanager · library · three · boq · lark |
| **PHU** | Lõi dữ liệu & engine: sổ lệnh lib · schema matId+PBR · export V-Ray/D5 · BOQ · ATLAS/Lark · 3D core | `lib/*` (commands·schema·materials·boq·lark·three·cad) | components/* trừ khi spec bắt |
| **G4** | Editor trong ổ: Thư viện sheet + quả cầu vật liệu · CommandPanel/Viewport3D/ObjectProperties (Vẽ 3D) · File Manager · Mood+Collab G2 · Present editors | `components/library|filemanager|three|nodes|present-editor` · `app/files|settings|library` | components/studio · lib của PHU |
| **ARCHINOTE** | App ArchiNote (repo `ttt-tasks`) | toàn repo đó | mọi repo IF |
| **COWORK (tôi)** | **KHÔNG code, KHÔNG dựng mock nữa (lệnh Hoà 03/08).** Chỉ: nghiên cứu · spec · chốt · giao việc · kiểm chọn lọc · trực ca · sổ này | `docs/*` | mọi code |
Mock từ nay: Cowork viết **đặc tả mock bằng chữ** trong phiếu giao việc → phiên nhận mảng tự dựng mock trong `docs/mocks/` → Hoà duyệt ảnh → mới port vào app.

## §3 · HÀNG ĐỢI TỰ CHẠY (cập nhật 03/08 tối — Cowork TỔNG bơm mỗi ca)

**⚡ CƠ CHẾ SHIP-TRƯỚC-SỬA-SAU (Hoà chốt 04/08 đêm: "duyệt hết, cứ cho lên tổng thể, sai đâu sửa đó"):** việc UI không còn chờ mock/duyệt-trước — dựng thẳng theo spec + token, Hoà hậu kiểm trên app thật, lệch thì sửa tại chỗ + ghi sổ. VẪN GIỮ NGUYÊN: luật trung tính · token globals.css · vùng mảng §2 · chống rớt §1 · nghiệm thu tsc/test/DOM/2-theme (vì ship nhanh chỉ an toàn khi lưới đỡ còn nguyên).

**CHẾ ĐỘ TỰ CHẠY (Hoà kích hoạt 1 lần/phiên):** xong 1 việc → commit + cập nhật `BAO-CAO-<mảng>` →
đọc lại mục của mình dưới đây → lấy việc KẾ TIẾP theo thứ tự → lặp. Việc nào ghi ⛔ hoặc "chờ X"
mà X chưa xong thì BỎ QUA sang việc sau. Cạn hàng đợi → ghi "HẾT VIỆC <giờ>" vào báo cáo + chốt phiên.
CẤM bịa việc ngoài hàng đợi. CẤM chạm vùng phiên khác (§2).

### CHINH
1. **Merge nhanh-g4 RỒI nhanh-phu vào main** (nhanh-phu = BOQ `49ebadd`, sạch, toàn file mới — không mìn). Mìn của nhanh-g4: nhanh-g4 mount `<LibrarySheet/>` vào `StageShell.tsx` — main ĐÃ XOÁ file đó.
   Xử: nhận hết code G4 (library/ + three/), mount chuyển sang ổ overlay dùng chung của AppShell (tự thêm ổ nếu chưa có).
   Sau merge: nút "Thư viện" (`Navigator.tsx:130`) MỞ SHEET ở cả 5 màn. Verify 5 màn + Esc + deep-link `/library`.
1b. 🔥 GẤP (đêm 04/08): Navigator chặng Render gần RỖNG sau merge — chỉ hiện ĐẦU VÀO, mất nhóm Nguồn·Xử lý·Bảng·Xuất. Nối nguồn dữ liệu NodeLibraryPanel vào Navigator theo mock-if-3chang (sidebar render). Verify cả 3 chặng Navigator có nội dung đúng.
2. Xử `app/dev-bench-3d-2/` untracked: xoá hoặc commit đúng chỗ, ghi lý do 1 dòng.
3. Panel thò thụt theo `SPEC-PANEL-ROLLOUT-IDF`: rollout (tiêu đề=toggle · grip ⠿ kéo, bóng mờ + vạch accent ·
   chuột phải Mở hết/Thu hết/Solo/Đặt lại · nút Thu-hết NHÌN THẤY ĐƯỢC) · nhớ theo LOẠI VẬT không theo sub-mode ·
   ghim · thu về dải mỏng CÓ NHÃN hover hé (CẤM auto-hide) · Inspector = dải trang kiểu Rhino.
4. Phím tắt toàn app `SPEC-PANEL-ROLLOUT-IDF` §4: ⌘K palette (nối `CommandPalette.tsx` có sẵn) · L/B/I/⌘\ ·
   ⌘1-3 · xử va phím L (chặng Vẽ: L=đường, Thư viện=⇧L). Nếu PHU chưa xong registry thì làm khung phím trước, TODO nối sau.
5b. Mỗi lần chốt phiên: quét `docs/` untracked (BAO-CAO-COWORK-*, spec mới) → commit gộp `docs: gom bao cao cowork` — các phiên Cowork chat không chạy git được, CHINH là người gác cổng docs.
6. Bảng thay chữ→icon `SPEC-PANEL-ROLLOUT-IDF` §3 áp vào Inspector + Settings (icon bật/tắt, chấm màu trạng thái,
   chip engine IF/V-Ray/D5, icon xích đứt --warning). Mỗi icon có tooltip + phím tắt.

### PHU (làm hết thì lấy tiếp 6-7)
1. ✅ ĐÃ XONG 03/08 tối — BOQ vào git (`49ebadd` nhanh-phu, đã push). Bỏ qua, sang mục 2.
2. ATLAS sync thật: kiểm token `Ejk6wjIXoi` (i HOA) trong .env.local → chạy sync 1449 bản ghi → sửa
   `ATLAS_FIELD_NAMES` theo 8 cột thật → test lại → nối BOQ. Vẫn 131006 → DỪNG, báo 1 dòng (việc Lark Console của Hoà).
3. Sổ lệnh `lib/commands/registry.ts` (Trụ 2 `SPEC-HA-TANG-UI-IF`): {id,label vi/en,icon,key,aliases,when,group,surfaces,run} ·
   parser `when` nhỏ không eval · `cmdsFor(ctx)` · dock=disabled giữ chỗ, menu/palette=ẩn · test selector + parser ·
   gom `lib/cad/commands.ts` + `command-aliases.ts`, không mất lệnh nào (đếm trước/sau).
4. Schema matId+PBR theo `SPEC-VAT-LIEU-PBR-IF` §1+§4: mở rộng `lib/cad/materials.ts` (thêm cột không phá cũ) ·
   `lib/materials/export-vray.ts` + `export-d5.ts` thuần hàm + test theo bảng dịch · ATLAS map PBR suy từ Danh mục (ghi rõ suy đoán).
5. Kiểm khuyết CAD `SPEC-LENH-VE-IF` §4: grep từng mục ①-⑩ ghi có/chưa vào báo cáo → làm phần LIB của
   ① eyedropper thuộc tính và ② VCB gõ-số-sau (nhận `3x` `/3`) — UI để CHINH/G4 nối.
6. LIB tiếp `SPEC-LENH-VE-IF` §4: ③ đường gióng thước dây (guide store + snap) · ⑥ chia đều N dọc path — thuần lib + test.
7. Nối `lib/boq/from-project` vào Doc thật của FlowCanvas (cầu glue thuần, UI để G4).

### G4 (làm hết thì lấy tiếp 4-5)
1a. 🔥 GẤP (đêm 04/08, xem BAO-CAO-DEM mục 23:1x): sửa 5 lỗi UI chặng Render — toolbar bút chỉ hiện khi active · canvas trống zoom 100% không fitView · banner 'Còn công cụ khác' đổi khuôn mách-nước-có-nút hoặc bỏ · empty state có chỉ dẫn + NÚT · minimap ẩn khi trống, attribution React Flow đặt gọn đúng license.
1. Quả cầu vật liệu `SPEC-VAT-LIEU-PBR-IF` §2: `components/three/MaterialSphere.tsx` — three.js sphere +
   RoomEnvironment PMREM DÙNG CHUNG + cache PNG theo hash(params) · 3 cảnh Cầu/Sàn/Vải tự chọn theo danh mục ·
   lưới 25% chi tiết 100% · gắn vào Thư viện sheet (mode Vẽ 3D) + tab Vật liệu CommandPanel.
2. (chờ CHINH merge xong) Verify Vẽ 3D sống trên main: CommandPanel/Viewport3D/ObjectProperties render trong AppShell
   cả 2 theme, đo DOM, bàn phím. Lệch thì sửa trong vùng mình.
3. Mood+Collab G2 TRỌN GÓI (lệnh Hoà 04/08: ship thẳng, sai đâu sửa đó): lib/collab/ (presence store · share roles Viewer/Commenter/Editor · comment anchor) + UI dựng LUÔN theo ticket G2 + SPEC-HOVER + token thật. Mock COWORK-UI về sau = tài liệu đối chiếu để polish, KHÔNG phải cổng chặn.

4. Port `docs/mocks/mock-present-chooser.html` thành màn chọn 5 loại hồ sơ (H4) — trong AppShell, đúng token, 2 theme. GỘP #3 tách-lối-vào-AI theo phiếu PHIEU-PRESENT-G4 của COWORK-TRÌNH (TỔNG duyệt đêm 04/08).
5. Empty state toàn app theo `SPEC-NGON-NGU-CHI-DAN` khuôn "trống" (luôn có NÚT): canvas 3 chặng · /files · Thư viện · Trình bày.

### COWORK-UI (bơm đêm 04/08)
0. ƯU TIÊN NHANH: chốt giá trị 6 token `--snap-*`/`--axis-*` (theo SPEC-VE-INFERENCE §2 của COWORK-VẼ) vào `SPEC-DESIGN-SYSTEM-IF` — đủ 2 theme, đối chiếu bảng màu inference SketchUp (xanh lá endpoint · lam midpoint · đỏ trục X...) nhưng phải hoà với accent tím của IF, tránh trùng màu trạng thái --success/--warning. Code đang dùng var() có fallback nên không ai chờ — nhưng chốt sớm tránh nợ.

### COWORK-TRÌNH (bơm đêm 04/08 — không chờ NC nữa)
1. Viết `docs/PHIEU-PRESENT-G4.md`: gom 7 mục sống thành phiếu code chi tiết cho G4 (đặc tả từng mục + nghiệm thu + thứ tự; #3 đánh dấu GỘP-H4). Chính bạn vừa rà nên viết rẻ nhất.
2. Verify 3 mục 🟡 bằng ĐỌC CODE (picker ≤2 click · export bake · ảnh Hoà khoanh): kết luận được thì kết luận, cần browser thật thì ghi thành mục nghiệm thu trong phiếu G4.
3. Viết `SPEC-TRINH-MATERIAL-A3.md`: editor Bảng vật liệu A3 (loại hồ sơ #2) — lưới ô, nhãn (tên·mã·giá·NCC từ 8 cột ATLAS đã biết), khổ in A3, nguồn matId. KHÔNG cần chờ NC.
4. Việc 1·2 cũ (BOQ/Video editor spec) vẫn chờ NC-2/NC-3 — khi NC về thì làm tiếp.

### ARCHINOTE (repo ttt-tasks)
1. ⛔ chờ Hoà chạy khối copy 9 spec (`LENH-PHIEN-2026-08-03.md` §4). Có docs/ rồi thì: duyệt 3 câu như khối cũ, làm 1+2, báo cáo.

## §0 · LUẬT TRUNG THỰC (Hoà đặt 04/08 — đứng trên mọi luật khác)
Mọi phiên, mọi vai — **kể cả COWORK-TỔNG, không ngoại lệ**: báo đúng sự thật kể cả khi xấu. Số là số đo được, không phải số đẹp.
Chưa verify thì ghi "chưa verify", không claim xong. Sai thì ghi nhận sai + nguyên nhân + cách sửa
— không giấu, không tô hồng, không đổ lỗi vòng vo. Verdict audit không nể nang.
Tiền lệ phải nhớ: khối commit "THANH CONG" dương tính giả (03/08) · giao trùng việc 3D-2 đã xong ·
STATUS.md ghi sai "chưa bắt đầu". Cả ba đều do TIN CHỮ mà không KIỂM — kiểm bằng lệnh, rồi mới nói.

## §0b · LUẬT NGHIÊN CỨU TRƯỚC KHI QUYẾT (Hoà đặt 04/08 — áp cho MỌI đề xuất & quyết định)
Áp cho MỌI Claude trong hệ — Cowork lẫn Code, kể cả TỔNG. Trước khi đề xuất hay quyết bất kỳ điều gì chạm giao diện/tính năng, PHẢI qua 3 bước:
1. **SEARCH** — grep/git kiểm hiện trạng code + đọc spec/00-CHOT liên quan (điều đã chốt là luật).
2. **NGHIÊN CỨU** — tra cách app đầu ngành giải bài này (đúng chuẩn 5 bài đã có: doc chính hãng
   + than phiền cộng đồng + số liệu, KHÔNG marketing). Đã có bài trong docs/nc/ hoặc spec thì đọc lại,
   chưa có thì làm/đặt COWORK-NC.
3. **NGHĨ NHƯ NGƯỜI DÙNG THẬT** — dân thiết kế · graphic · kiến trúc sư · kỹ sư · nội thất:
   muscle memory họ mang theo (AutoCAD gõ lệnh · SketchUp push-pull · Photoshop layer · Figma frame),
   họ làm việc bằng chuột+phím tắt cả ngày, mắt nghề soi từng px, ghét học lại từ đầu, cần số chính xác
   mm/m²/₫. Câu hỏi bắt buộc trước khi chốt: *"một designer 10 năm nghề mở màn này lên có thấy QUEN
   TAY và CHUYÊN NGHIỆP không, hay thấy đồ chơi?"*
Đề xuất không đủ 3 bước → audit đánh 🔴 trả về làm lại. Tiền lệ: rail "lèo tèo" rồi lại "rối rắm"
(03/08) — cả hai lần đều do thiếu bước 2-3 trước khi dựng.

## §4a · UỶ QUYỀN ĐÊM 03→04/08 (Hoà chốt trước khi ngủ)
COWORK-TỔNG được **quyết thay Hoà** trong đêm với điều kiện Hoà đặt (nguyên văn): *"trước khi quyết định
nhớ search kỹ, đọc sổ luật"* — tức mỗi quyết định phải (a) grep/git kiểm hiện trạng, (b) đối chiếu
`00-CHOT` + spec liên quan, (c) ghi lý do vào `BAO-CAO-DEM-2026-08-04.md`.
**Không được quyết dù có uỷ quyền:** chuyện tiền (mua avatar, thuê, credit) · xoá dữ liệu/file người dùng ·
lật quyết định Hoà đã đích thân chốt (chỉ được treo + ghi câu hỏi cho sáng mai).

## §4 · LUẬT THAY PHIÊN (mọi phiên, mọi vai)
1. Mở phiên: đọc `SO-KIEM-TONG.md` → `00-CHOT.md` → `BAO-CAO-<mảng>.md` của mình. 3 file, đúng thứ tự.
2. Trước khi làm gì: `git log --all --oneline -- <path>` — việc có thể đã xong (bài học 3D-2 giao trùng 03/08).
3. Chỉ sửa trong mảng §2. Buộc phải chạm mảng khác → DỪNG, ghi vào báo cáo.
4. Chốt phiên ~85% context: cập nhật `BAO-CAO-<mảng>` + nếu tính năng mới thành hình thì THÊM DÒNG vào §1 sổ này + commit + push.
5. Cowork trực ca: kiểm §1 (chống rớt) trước, việc mới sau.

---
*Cowork lập 03/08/2026 theo lệnh Hoà. File này là hợp đồng giữa các phiên — sửa §2 phải qua Hoà.*
