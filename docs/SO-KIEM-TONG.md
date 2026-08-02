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
| BOQ engine (compute·xlsx·cache·from-project) | `lib/boq/` trong WORKTREE phu | 🔴 **CHƯA VÀO GIT** (03/08 kiểm: nhánh nhanh-phu không có commit boq — khối "XONG" không thành; file chỉ nằm trên đĩa) | `git log --all --oneline \| grep -i boq` |
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

## §3 · PHIẾU GIAO VIỆC ĐANG MỞ (dán 1 dòng là phiên tự đọc)

**CHINH** — dán: `Đọc docs/SO-KIEM-TONG.md §2-3 rồi làm phần CHINH.`
1. Xong AppShell 6 ổ (đang dở) — kèm khối bổ sung: `/files` `/settings` bọc AppShell, xoá `LeftRail.tsx` khi 0 tham chiếu, nghiệm thu 5 màn giống hệt header/Navigator/đáy.
2. Panel thò thụt theo `SPEC-PANEL-ROLLOUT-IDF`: rollout (tiêu đề=toggle · grip ⠿ kéo thứ tự, bóng mờ+vạch accent · chuột phải Mở hết/Thu hết/Solo/Đặt lại) · nhớ theo LOẠI VẬT không theo sub-mode · ghim · thu về dải mỏng CÓ NHÃN hover hé (kiểu 3ds Max Minimize, CẤM auto-hide) · Inspector = dải trang kiểu Rhino.
3. Phím tắt toàn app theo `SPEC-PANEL-ROLLOUT-IDF` §4 (⌘K·L·B·I·⌘\·⌘1-3 · xử va phím L: chặng Vẽ L=đường, Thư viện=⇧L).

**PHU** — dán: `Đọc docs/SO-KIEM-TONG.md §2-3 rồi làm phần PHU.`
1. ATLAS sync thật (token đã sửa i-HOA — kiểm rồi chạy; vẫn 131006 thì DỪNG báo 1 dòng).
2. Sổ lệnh `lib/commands/registry.ts` (Trụ 2 SPEC-HA-TANG-UI-IF — khối đã giao, giữ nguyên).
3. MỚI — schema matId+PBR theo `SPEC-VAT-LIEU-PBR-IF` §1+§4: mở rộng `lib/cad/materials.ts` (thêm cột, không phá cũ) · `lib/materials/export-vray.ts` + `export-d5.ts` thuần hàm + test theo bảng dịch · ATLAS map: PBR suy từ Danh mục (ghi rõ là suy đoán).
4. MỚI — kiểm khuyết CAD `SPEC-LENH-VE-IF` §4: grep xác nhận từng mục thiếu ①-⑩, ghi vào báo cáo cái nào ĐÃ có sẵn, rồi làm phần LIB của ①② (eyedropper thuộc tính · VCB gõ-số-sau nhận 3x và /3) — UI để CHINH/G4 nối.

**G4** — dán: `Đọc docs/SO-KIEM-TONG.md §2-3 rồi làm phần G4.`
1. Mode Vẽ 3D (khối đã giao: CommandPanel·Viewport3D·ObjectProperties — mock `mock-if-ve3d.html`).
2. MỚI — quả cầu vật liệu theo `SPEC-VAT-LIEU-PBR-IF` §2: `MaterialSphere.tsx` (three.js sphere + RoomEnvironment PMREM dùng chung + cache PNG theo hash) · gắn vào Thư viện sheet mode Vẽ 3D + tab Vật liệu CommandPanel · 3 cảnh Cầu/Sàn/Vải tự chọn theo danh mục · lưới dùng 25%, chi tiết 100%.
3. Sau đó: Mood+Collab G2 theo ticket (presence · mời · sticky/comment/reaction · share roles — tính năng Hoà lo mất, nó nằm ở đây).

**ARCHINOTE** — dán: `Đọc docs/SO-KIEM-TONG.md §2-3 (bản trong ttt-tasks) rồi làm phần ARCHINOTE.` — khối duyệt 3 câu ở `LENH-PHIEN-2026-08-03.md` §4 vẫn nguyên hiệu lực.

## §4 · LUẬT THAY PHIÊN (mọi phiên, mọi vai)
1. Mở phiên: đọc `SO-KIEM-TONG.md` → `00-CHOT.md` → `BAO-CAO-<mảng>.md` của mình. 3 file, đúng thứ tự.
2. Trước khi làm gì: `git log --all --oneline -- <path>` — việc có thể đã xong (bài học 3D-2 giao trùng 03/08).
3. Chỉ sửa trong mảng §2. Buộc phải chạm mảng khác → DỪNG, ghi vào báo cáo.
4. Chốt phiên ~85% context: cập nhật `BAO-CAO-<mảng>` + nếu tính năng mới thành hình thì THÊM DÒNG vào §1 sổ này + commit + push.
5. Cowork trực ca: kiểm §1 (chống rớt) trước, việc mới sau.

---
*Cowork lập 03/08/2026 theo lệnh Hoà. File này là hợp đồng giữa các phiên — sửa §2 phải qua Hoà.*
