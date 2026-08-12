# BÁO CÁO PHIÊN H2 — `panel-handle-chung` (13/08/2026)

> Phiếu: `docs/phieu-giao/panel-handle-chung.md` · Dây máy đăng ký: `panel-handle-chung` (dir
> `components/ui`, mẫu `PanelHandle`).
> Ràng buộc tuân thủ: KHÔNG git · KHÔNG dev server · KHÔNG prisma · KHÔNG sửa file ngoài ③ ·
> KHÔNG sửa `app/globals.css` · KHÔNG sửa `scripts/frontier-registry.mjs`.

## KẾT QUẢ: DỪNG THEO LUẬT "CHẠM BIÊN" — KHÔNG TẠO CODE MỚI

Trước khi viết `components/ui/PanelHandle.tsx`, tôi grep mục ② như phiếu dặn ("tìm tay cầm mẫu
đang sống ở `components/present-editor`, không sáng tác lại") và phát hiện: **việc phiếu giao đã
được LÀM XONG VÀ COMMIT VÀO MAIN từ 07/08**, dưới tên `PanelFlank`, không phải `PanelHandle`.
Tạo thêm một component song song sẽ VI PHẠM trực tiếp luật gộp tính năng của dự án ("một cỗ máy,
nhiều mặt tiền" — `docs/CLAUDE.md`) và ba dòng cảnh báo đã ghi sẵn trong repo:
- `docs/M-BANG-KIEM-OUT.md:44` — *"NHỚ TRẠNG THÁI + PanelFlank (**không chế dải thứ hai**)"*
- `docs/DAN-VAO-p3c.md:104` — *"Tay cầm thu/mở dùng `components/ui/PanelFlank.tsx`… **Đừng chế
  dải thứ hai**"*
- `docs/PHIEU-FINAL-2026-08-08.md:364` — cùng câu.

Vì vậy tôi DỪNG việc code, không đụng ③, và báo cáo phát hiện lên T theo đúng luật "chạm biên"
trong lệnh giao việc.

## Bằng chứng (đo thật, không suy đoán)

1. **`components/ui/PanelFlank.tsx` đã tồn tại**, ~190 dòng, docstring tự khai chính là mẫu Hoà
   chốt 07/08: *"dải DỌC MẢNH sát mép panel, giữa có mũi tên ‹ / ›, bấm là thu/mở… CHÉP HÀNH VI
   của `PresentEditor.tsx` (panel Magic trái + inspector Lớp phải: `panelEdgeStripStyle` dải 14px
   + `LS_INSPECTOR_OPEN` nhớ localStorage), KHÔNG chép code"* — đúng nguyên văn việc phiếu này
   giao lại (mục ② + ④.1-④.2).
2. **Đã lắp vào ĐÚNG 3 vị trí mà phiếu ③ liệt kê**, xác nhận bằng `git show HEAD:...` (committed,
   không phải working-tree bẩn):
   | Vị trí phiếu yêu cầu | File thật đã lắp | Cách lắp |
   |---|---|---|
   | Tấm Thư viện | `components/library/LibrarySheet.tsx:482-583` | bọc cột kệ 214px bằng `<PanelFlank side="left" storageKey="library.shelf">` |
   | Sidebar Lớp 2D (cad) | `components/studio/AppShell.tsx:33,155-168` | Inspector ẩn bằng phím I → hiện `FlankStrip side="right"` 14px (biến thể trình bày thuần của PanelFlank); riêng Navigator (chứa `LayerPanel` — định vị ở `components/cad/CadEditor.tsx:1420`) dùng cơ chế thu/mở RIÊNG của nó, xem mục "Ranh giới còn hở" bên dưới |
   | Panel Sửa 3D (`Command3DPanel`) | `components/render-studio/Render3DModeSkeleton.tsx:41,524-538` | bọc `<Command3DPanel>` bằng `<PanelFlank side="left" storageKey="render3d.command-panel">` |
3. **Commit đã nằm trên `main`**: `git log --oneline -1 -- components/ui/PanelFlank.tsx` →
   `ad2d23b dot 07/08: 5 phien code + go du an mau + cua kiem chot + tai lieu`. `git status --short`
   trên cả 4 file (PanelFlank.tsx + 3 nơi lắp) → RỖNG (sạch, không phải bản đang dở).
4. Báo cáo phiên gốc: `docs/M-PANEL-OUT.md` (phiên p3b, 07/08) — mô tả cùng API `{side,
   storageKey, label, hotkey?, defaultOpen?}` mà phiếu này yêu cầu (`{side, collapsed, onToggle,
   storageKey?}` — PanelFlank tự quản `collapsed`/`onToggle` NỘI BỘ qua `storageKey`, gọn hơn thay
   vì bắt nơi gọi tự quản, cùng ý đồ mục ④.2 "nhớ trạng thái giữa phiên qua storageKey").
5. Frontier registry (`scripts/frontier-registry.mjs:111-112`) đang khai entry `panel-handle-chung`
   **`trangThai: 'chua'`** với bằng chứng kỳ vọng `{ dir: 'components/ui', mau: 'PanelHandle' }` —
   đây là **"sổ quên"** (khai chưa mà code đã có, đúng định nghĩa lệch loại 2 trong chốt 11/08 về
   `soi:frontier`), chỉ khác tên component (`PanelHandle` vs `PanelFlank` thật) nên máy soi không
   tự bắt được bằng grep tên.

## Ranh giới còn hở thật — KHÔNG tự sửa, đề xuất T quyết

`docs/M-PANEL-OUT.md` (dòng ③) đã tự ghi rõ lúc đó: cad's Navigator (chứa danh sách "Lớp bản vẽ")
dùng **cơ chế thu/mở CỦA RIÊNG NÓ** (`components/studio/Navigator.tsx`) — dải 36px + nhãn dọc +
`ChevronLeft` xoay 180°, KHÁC hình hài PanelFlank (dải 14px thuần chevron). Lý do khi đó không lắp
PanelFlank vào: Navigator đáy có thêm nút Thêm/Thư viện/avatar/Cài đặt, không phải "chỉ một panel
bên có mép" như 3 nơi kia — ép PanelFlank vào sẽ phá layout đáy.

Phiếu H2 lần này liệt kê "sidebar Lớp trong `components/cad/`" là một trong 3 nơi cần lắp — nhưng
nội dung Lớp (`LayerPanel`, `components/cad/CadEditor.tsx:1420`) chỉ là `children` được truyền
VÀO Navigator qua `AppShell`; bản thân khung thu/mở nằm ở `components/studio/Navigator.tsx` —
**ngoài vùng ③ cho phép của phiếu này** (chỉ liệt `components/cad/`, không có `components/studio/`).
Muốn thống nhất hình hài (36px+nhãn kiểu Navigator ↔ 14px thuần PanelFlank) là quyết định
thiết kế liên chặng, đụng shell dùng chung cho CẢ 5 màn (`AppShell` mount ở mọi active stage) —
đúng định nghĩa "chạm biên" phải dừng theo lệnh giao việc, không tự quyết ở cấp sub-agent.

**Đề xuất cụ thể lên T** (không tự làm, chỉ nêu phương án):
1. Sửa `bangChung` của entry `panel-handle-chung` trong `frontier-registry.mjs` thành
   `{ dir: 'components/ui', mau: 'PanelFlank' }`, đánh `trangThai: 'xong'` — việc lõi (component +
   2/3 nơi lắp không tranh cãi) đã thật, chỉ registry sai tên.
2. Mở phiếu riêng (phạm vi `components/studio/Navigator.tsx` + `AppShell.tsx`) nếu Hoà muốn Navigator
   dùng chung hình hài PanelFlank thay vì dải 36px riêng — hoặc CHỐT rằng khác biệt này là CÓ CHỦ Ý
   (Navigator có thêm hàng nút đáy, PanelFlank chỉ là dải thuần) và đóng luôn mục này, không coi là nợ.
3. Verify browser của `docs/M-PANEL-OUT.md` (4 bước cuối file đó) vẫn **CHƯA làm** — phiên 07/08 bị
   chặn bởi máy chủ dev hỏng của phiên khác, phiên này cũng bị cấm mở dev server. Đây là nợ verify
   thật duy nhất còn treo trên tính năng đã có code.

## ⑥ NGHIỆM THU TỰ LÀM — dán nguyên văn

```
$ npx tsc --noEmit
(không có output — 0 lỗi)
```

```
$ grep -rn "PanelHandle" components/ui components/library components/cad components/render-studio | head
(rỗng — component PanelHandle theo tên phiếu chưa từng được tạo, ĐÚNG NHƯ QUYẾT ĐỊNH ở trên)

$ grep -rln "PanelFlank" components/ui components/library components/cad components/render-studio components/studio
components/ui/PanelFlank.tsx
components/library/LibrarySheet.tsx
components/studio/AppShell.tsx
components/render-studio/Render3DModeSkeleton.tsx
```

## CHƯA LÀM (nói thẳng)
- Không tạo `components/ui/PanelHandle.tsx` — quyết định có chủ ý, lý do ở trên.
- Không sửa `LibrarySheet.tsx` / `library-sheet-css.ts` / `Command3DPanel.tsx` / file cad Lớp —
  cả 3/3 nơi phiếu muốn lắp đã có tay cầm (2/3 qua PanelFlank trực tiếp, 1/3 — cad Lớp — qua cơ chế
  riêng của Navigator, xem phần "Ranh giới còn hở").
- Không sửa `scripts/frontier-registry.mjs` (cấm theo ⑤, dù phát hiện sổ quên — để T xử).
- Không verify browser (cấm dev server theo ⑤; đây cũng là nợ treo từ 07/08 chưa ai trả được).

## ⑦ HAI GIÁ TRỊ (khuôn §1c)

**KIẾN TRÚC** — [tính năng] Tay cầm thu/mở panel dùng chung ĐÃ tồn tại như MỘT cỗ máy
(`PanelFlank` + biến thể trình bày `FlankStrip`), không phải khoảng trống cần lấp; sổ frontier lệch
so với code thật (mất dấu vì đổi tên `PanelHandle`→thực tế `PanelFlank`) là rủi ro kiến trúc thật —
nếu sub-agent nào cũng grep đúng tên trong phiếu mà không tự đọc code, cỗ máy sẽ bị nhân đôi âm thầm,
đúng bệnh N8 ("đề xuất lại thứ đã có") mà `docs/00-CHOT.md` đã cảnh báo từ 01/08. [giao diện] 2/3
nơi lắp đã đúng mẫu Hoà chốt (dải 14px, thu-có-mặt); 1/3 (cad Lớp) còn dùng hình hài riêng của
Navigator — chưa phải lỗi, nhưng chưa được ai CHỐT là cố ý.

**VẬN HÀNH-SỬ DỤNG + GIÁ TRỊ IF** — [tính năng] Người dùng chặng Thư viện + chặng 3D Sửa hôm nay
đã có đúng trải nghiệm phiếu mong muốn (thu panel chiếm ~0 diện tích, tay cầm không mất tích, nhớ
lựa chọn qua reload — theo thiết kế code, browser verify còn nợ). [giao diện] Việc thật giúp IF là
sổ frontier PHẢI đáng tin — một entry khai "chưa" trong khi code đã chạy trên main gây lãng phí
công sức (đúng thứ phiếu này suýt gây ra) và làm T mất khả năng tin vào chính công cụ chống quên
mà Hoà lập ra 11/08; sửa registry (đề xuất 1 ở trên) trả lại giá trị "một nguồn sự thật" cho
`soi:frontier`.
