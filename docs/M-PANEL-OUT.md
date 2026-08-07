# M-PANEL-OUT — báo cáo phiên p3b (07/08, tay cầm thu/mở panel dùng chung)

Chốt sản phẩm (Hoà 07/08): nhân bản mẫu dải thu/mở của chặng Trình chiếu cho toàn hệ.
Sở hữu: `components/ui/` (component mới) + panel bên các màn. Không đụng `lib/cad` `lib/boq`
`lib/materials` `prisma` — tuân thủ (mọi sửa nằm ở `components/`).

## VIỆC 1 — MỘT component dùng chung: `components/ui/PanelFlank.tsx` (MỚI, ~200 dòng)

Chép HÀNH VI từ `PresentEditor.tsx` (đọc `panelEdgeStripStyle`/`panelToggleBtnStyle`/
`LS_INSPECTOR_OPEN`, KHÔNG chép code):
- Dải dọc mảnh **14px** sát mép panel, giữa có mũi tên ‹/› (lucide ChevronLeft/Right), bấm là
  thu/mở. Thu rồi **VẪN CÒN dải** để mở lại — không "mất tích".
- API: `side` trái/phải (quyết định chiều mũi tên) · `storageKey` nhớ RIÊNG TỪNG PANEL (tiền tố
  `if.panelflank.`) · `label` cho aria/title ("Thu kệ thư viện"/"Mở kệ thư viện") · `hotkey`
  optional 1 ký tự (guard ô nhập liệu; nơi mount tự chọn phím không va — §4e SPEC-PANEL-ROLLOUT) ·
  `defaultOpen`.
- A11y: `aria-expanded` + `aria-controls` (id sinh bằng `useId`) + `aria-label` động.
- Đọc localStorage SAU mount (không đọc trong initializer — tránh hydration mismatch SSR/CSR,
  cùng cách PresentEditor xử lý). Ghi/đọc đều `try/catch` **có ghi lý do trong comment** (K5:
  Safari riêng tư/iframe/quota — mất trí nhớ giữa phiên là hệ quả chấp nhận được, không văng lỗi).
- Export phụ **`FlankStrip`** — dải trình bày THUẦN (side/open/onClick/label/hotkey) cho nơi ĐÃ
  có state đóng/mở riêng (AppShell quản `inspectorHidden` + phím I sẵn) dùng cùng hình hài mà
  không double-manage state. Đây là cách "không chép tay 6 lần" mà vẫn không phá state có sẵn.
- Hover style tái dùng class `.pe-panel-toggle` CÓ SẴN trong `app/globals.css:657` (không thêm CSS).

## VIỆC 2 — lắp vào panel bên (theo thứ tự mức đau brief)

| # | Vùng | Đã lắp | Chi tiết |
|---|---|---|---|
| ① | `components/library/` | ✅ | `LibrarySheet.tsx` — cột kệ 214px (panel TO NHẤT, đo 0/7) bọc `<PanelFlank side="left" storageKey="library.shelf">`; `.libbody` là flex-row sẵn (`library-sheet-css.ts:103`) nên lắp không đổi layout |
| ② | `components/studio/` | ✅ | `AppShell.tsx` — sửa bẫy "mất tích" THẬT: ẩn Inspector bằng phím I xong KHÔNG còn tay cầm nào trên màn (chỉ ai nhớ phím mới mở lại). Nay `inspector && inspectorHidden` ⇒ hiện `FlankStrip` 14px mép phải. KHÔNG đụng hành vi "không có vật chọn thì ẩn HẲN" (lúc đó dải là nút bấm-không-ra-gì, phạm §9) |
| ③ | `components/cad/` | ✅ (qua ②, không lắp thêm) | Panel bên thường trực của màn 2D đi QUA AppShell: Navigator (đã có phím B + dải thu riêng của `Navigator.tsx` §2f) · Inspector (nay có FlankStrip ②). Các panel còn lại trong `CadEditor` (AiBriefPanel · PlanPresentPanel · CamPathControlPanel · RevitSummaryPanel) là OVERLAY NỔI có nút đóng/mở riêng — khác mẫu "dải sát mép panel", ép PanelFlank vào là sai ngữ nghĩa (không phải panel bên). Ghi rõ để TỔNG không đếm là "sót" |
| ④ | `components/render-studio/` | ✅ | `Render3DModeSkeleton.tsx` — bọc `Command3DPanel` (sidebar 6 tab, 256px) bằng `<PanelFlank side="left" storageKey="render3d.command-panel">` |
| ⑤ | `components/nodes/` | ⬜ khảo sát, không lắp | Panel bên của chặng Node = `NodeLibraryPanel` sống trong Navigator (đã có B + dải thu của Navigator). 5/10 file đã có cơ chế riêng theo số đo brief; các file còn lại (MacroShelf/GroupOverlay/…) là overlay trên canvas, không phải panel bên |
| ⑥ | `components/dashboard/` | ⬜ khảo sát, không lắp | `LarkPanels`/`ProjectMembersPanel` là SECTION bên trong overlay Dashboard (mount `AppShell:160`), không phải panel bên có mép — không có chỗ cho dải dọc |
| — | `GalleryPanel.tsx` (root) | ⬜ không lắp | Có nút ✕ đóng + mở lại qua menu — pattern on/off overlay, không "mất tích"; đổi sang flank là đổi thiết kế, ngoài chốt |

## VIỆC 3 — nhớ trạng thái
Trong chính `PanelFlank` (không phải từng nơi tự chế): key riêng từng panel
(`if.panelflank.library.shelf` · `if.panelflank.render3d.command-panel` · …), try/catch có lý do.
AppShell Inspector (②) GIỮ hành vi cũ (không persist `inspectorHidden` — ẩn là trạng thái phiên,
gắn với "đang chọn vật", persist nó sẽ làm người dùng tưởng mất Inspector vĩnh viễn).

## VERIFY — `tsc` sạch · browser BỊ CHẶN MÔI TRƯỜNG (CHƯA VERIFY, nói thẳng theo N5/N6)
- `npx tsc --noEmit -p .` → **0 lỗi** (chạy 2 lần xác nhận).
- 🔴 **Browser verify KHÔNG làm được trong phiên này** — chuỗi sự kiện, đo đủ trước khi kết luận:
  1. Thư mục repo đang có DUY NHẤT 1 dev server (cổng 3000, CỦA PHIÊN KHÁC).
  2. Server đó đã chết bệnh §0aa: MỌI route trả 500 `Cannot read properties of undefined
     (reading 'call')` từ `.next/server/webpack-runtime.js` (curl xác nhận, không phải lỗi code —
     tsc toàn repo sạch; đúng nguyên văn triệu chứng §0aa "nhiều npm run dev ghi chung .next").
  3. Gỡ theo §0aa (tắt hết → `rm -rf .next` → mở lại MỘT server) → lệnh `pkill` bị classifier
     quyền CHẶN (đúng — không được tắt server phiên khác).
  4. Mở server riêng phiên này (`preview_start` interiorflow-p2/3002) → CŨNG bị chặn quyền.
  ⇒ Không còn đường verify browser hợp lệ. **Ảnh 2 trạng thái + chứng minh nhớ-qua-reload CHƯA
  CÓ** — theo N6 thì VIỆC 2/3 chưa được tính "xong", chỉ "code xong + tsc sạch".

### Khối lệnh cho Hoà (§0k — dán 1 mạch ở terminal, sửa dứt bệnh §0aa rồi verify hộ 2 phút):
```bash
pkill -f "next dev"; sleep 2; cd ~/Downloads/interiorflow && rm -rf .next && npm run dev
```
✔ xong khi: `✓ Ready` — rồi mở `http://127.0.0.1:3000`, làm 4 bước:
1. Mở Thư viện (phím L) → thấy dải mảnh có ‹ sát mép phải cột kệ → bấm → kệ thu còn dải › → bấm lại nở ra.
2. Sang Thiết kế 3D mode Vẽ 3D → dải ‹ sát mép phải bảng lệnh → thu/mở tương tự.
3. Chọn 1 khối → bấm phím I (ẩn Inspector) → mép phải màn còn dải ‹ 14px → bấm mở lại được.
4. Thu kệ Thư viện → RELOAD trang → mở lại Thư viện → kệ VẪN THU (nhớ localStorage).

## §V7 — đã xong · còn treo · CHƯA VERIFY
- ✅ Đã xong (code): 1 component mới `PanelFlank` (+`FlankStrip`) · 3 điểm lắp thật (LibrarySheet
  kệ 214px · AppShell inspector-hidden strip · Render3DModeSkeleton bảng lệnh 3D) · nhớ trạng thái
  theo TỪNG panel · tsc 0 lỗi. File sửa: `components/library/LibrarySheet.tsx` ·
  `components/studio/AppShell.tsx` · `components/render-studio/Render3DModeSkeleton.tsx`. File
  mới: `components/ui/PanelFlank.tsx` · `docs/M-PANEL-OUT.md`.
- ⬜ Còn treo: ⑤ nodes / ⑥ dashboard — khảo sát xong, KHÔNG có panel bên đúng mẫu để lắp (lý do
  từng dòng ở bảng trên); nếu TỔNG/Hoà muốn đổi cả overlay (GalleryPanel…) sang mẫu flank thì đó
  là quyết định thiết kế mới, chờ chốt.
- 🔴 CHƯA VERIFY: toàn bộ phần browser (ảnh 2 trạng thái × 3 điểm lắp + reload nhớ trạng thái) —
  bị chặn bởi server hỏng §0aa của phiên khác + classifier không cho dựng/tắt server. Khối lệnh
  sửa 1 dòng ở trên, Hoà chạy là verify được ngay.
- V6: KHÔNG commit.
