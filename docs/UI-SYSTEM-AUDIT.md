# UI System Audit — popover/shell/empty-state/lỗi/canvas 4-trạng-thái (2026-07-27)

> **Phạm vi**: audit READ-ONLY, không sửa code. Mọi dòng dưới đây đọc trực tiếp từ mã nguồn thật
> (`file:line`), không đoán. Item nào không xác minh được bằng code → không liệt kê.
>
> **Bối cảnh đã biết trước khi audit** (không tính là phát hiện mới):
> - `components/ui/Popover.tsx` (mới thêm phiên này) đã làm ĐÚNG — đo viewport + lật hướng +
>   portal `document.body`. Hiện CHỈ dùng ở đúng 1 chỗ: menu chuột phải ảnh trong
>   `components/present-editor/EditorCanvas.tsx:383-441`.
> - `app/library/ingest/page.tsx` đã có nút "← Quay lại" (sửa phiên này).
> - Cặp nút "Nhập"→"Mở tệp", Render "Tải lên"→"Thêm vào canvas" đã đổi tên, KHÔNG liệt lại.
> - `LibraryPanel.tsx` "Upload" vs "Nạp vào thư viện" đã được chủ dự án biết và CHỦ Ý giữ tách
>   (khác chức năng thật), chờ quyết định — chỉ nhắc lại ngắn gọn, không tính là phát hiện mới.
>
> Quy ước mức độ: 🔴 chặn dùng · 🟡 gây khó chịu · ⚪ nhỏ/hiếm gặp.

---

## 1) Popover/dropdown/tooltip KHÔNG có edge-flip

`Popover.tsx` là giải pháp đúng nhưng mới phủ ĐÚNG 1 điểm dùng chuột phải. Mọi menu/dropdown
khác trong app vẫn là code tự chế `position:'absolute'` neo `top:'calc(100%+Npx)'` +
`left/right:0`, không đo `window.innerWidth/innerHeight`, không lật hướng.

| Vị trí | Vấn đề | Mức độ |
|---|---|---|
| `components/ui/IOMenu.tsx:140-164` (menu định dạng Nhập/Xuất) và `:166-186` (toast kết quả) | `position:'absolute', top:'calc(100% + 6px)', [side]:0` — không đo viewport. Dùng ở CẢ 3 CHẶNG (CAD/Render/Present) + Header — nút Xuất nằm sát mép phải màn hình hẹp sẽ bị cắt mục cuối menu. Chính comment `CadEditor.tsx:2128-2131` đã ghi nhận một biến thể của lỗi này (menu bị scroll-container cắt) và né bằng cách bỏ `overflowX`, KHÔNG sửa gốc (thiếu edge-flip thật). | 🟡 |
| `components/ui/MenuButton.tsx:95-115` (menu gộp nhóm toolbar) | Y hệt pattern trên — `position:'absolute'` + `[align]:0`, không lật hướng. Dùng để gom nhóm toolbar CAD/Present. | 🟡 |
| `components/Header.tsx:237` (`MoreMenu`, nút "Thêm" trên Header — mọi chặng) | `className="... absolute right-0 top-9 z-40 w-56 ..."` cố định, không đo viewport. Header xuất hiện ở CẢ 3 chặng nên đây là điểm chạm cao. | 🟡 |
| `components/Header.tsx:542` (`AiTierMenu`, badge "AI · mức") | `absolute left-0 top-8 w-72` — cùng lỗi, rủi ro thấp hơn vì neo trái gần đầu header. | ⚪ |
| `components/TasksDropdown.tsx:27` | `absolute right-0 top-full z-50 mt-2 w-80` — không lật hướng. | 🟡 |
| `components/LibraryPanel.tsx:141` (panel `[+]` vừa dựng lại phiên này — auto-classify/tag/Upload/"Nạp vào thư viện") | `absolute right-0 top-full z-30 mt-1.5 w-64` — không đo viewport; panel Reference thường nằm sát mép phải màn hình, dễ bị cắt đúng lúc mới sửa xong UI này. | 🟡 |
| `components/notebook/NotebookSourcesSidebar.tsx:331-345` (menu ⋯ mỗi nguồn) | `position:'absolute', right:6, top:32` cố định — item ở gần đáy danh sách cuộn sẽ mở menu tràn xuống dưới viewport/khung cuộn, không lật lên. | 🟡 |
| `components/cad/MaterialPalette.tsx:216-229` (preview hover vật liệu) | `position:'absolute', right:'calc(100% + 10px)', top:0` — mở SANG TRÁI cố định. Panel vật liệu thường đặt sát cạnh trái màn hình ⇒ preview dễ tràn ra ngoài viewport bên trái, không có phương án lật. | 🟡 |
| `components/studio/StageSwitcher.tsx:355-374` (tooltip onboarding "↓ Kéo xuống để hỏi Vitals") | `position:'absolute', left:'50%', top:'calc(100%+18px)', whiteSpace:'nowrap'` — không clamp ngang; chỉ hiện 1 lần đầu nên rủi ro thấp. | ⚪ |
| `components/ui/Tooltip.tsx` | Có clamp ngang thật (`lib/ui/tooltip-position.ts` `clampHorizontalOffset`) — NHƯNG hướng trên/dưới (`side`) là prop cố định do nơi gọi truyền vào, không tự đo và lật khi cạnh trên/dưới thiếu chỗ. | ⚪ |

**Đối chứng làm ĐÚNG** (không phải lỗi, ghi lại để so sánh): `components/present-editor/TextToolbar.tsx:104-139` tự đo `getBoundingClientRect()` và dịch `dx` để không tràn viewport ngang — một cách làm thủ công riêng, KHÔNG dùng `Popover.tsx`, nhưng hiệu quả tương đương cho trục ngang (trục dọc thì dựa vào prop `below` được tính từ nơi gọi, xem mục 6).

---

## 2) Màn hình thiếu back button/breadcrumb hoặc phá khung app

| Vị trí | Vấn đề | Mức độ |
|---|---|---|
| `app/settings/avatar/page.tsx:44-86` | `<main>` tự chế toàn bộ (không Rail/Header), KHÔNG có nút quay lại/breadcrumb nào. Đường thoát DUY NHẤT là bấm "Lưu" (`router.push('/')` dòng 38) — user vào xem rồi đổi ý không muốn lưu phải dùng nút Back trình duyệt. | 🟡 |
| `app/projects/[id]/notebook/page.tsx:35-80` | CÓ nút "← Quay lại" (`router.back()`) nhưng tự dựng `<header>` riêng (dòng 46-80) thay vì sống trong khung app dùng chung (Rail+Header) — vi phạm ghi chú `docs/SPEC-UI-SHELL.md §4`: "mọi panel mới phải nằm trong khung, không tự chế layout riêng". Chrome khác hẳn 3 chặng chính (nút back bo góc 2px thay vì 8-10px như `overview/page.tsx`). | 🟡 |
| `app/demo-resort/page.tsx` (241 dòng) + `components/cad-library/BlockLibraryDemo.tsx` (route `app/cad-library-demo/page.tsx`) | Cả hai route dev-only (`NEXT_PUBLIC_DEMO=true`, tự `redirect('/')` ở production) đều KHÔNG có nút back/breadcrumb nào — full-screen tự chế. Rủi ro thấp vì không lộ ra UI thật, nhưng dev bật cờ để test sẽ bị kẹt (chỉ Back trình duyệt). | ⚪ |
| `app/share/[token]/page.tsx:38-49` | Không có back button — nhưng ĐÚNG Ý ĐỒ: trang khách xem chia sẻ read-only, không đăng nhập, không thuộc app shell. Không tính là lỗi. | — (không phải finding) |

**Đối chứng làm ĐÚNG**: `app/projects/[id]/overview/page.tsx:99-139` có cả nút "← Về Thư viện" LẪN breadcrumb `InteriorFlow / Dự án` — mẫu tốt hơn `notebook/page.tsx` dù cả hai đều tự chế header riêng thay vì dùng Header.tsx chung.

---

## 3) Cặp nút/nhãn còn trùng nghĩa (ngoài 2 cặp đã xử lý phiên trước)

| Vị trí | Vấn đề | Mức độ |
|---|---|---|
| `components/present-editor/PresentSheets.tsx:284` (`addLabel="Thêm trang trình bày"`) vs `components/present-editor/SlideStrip.tsx:160` / `components/present-editor/SlideSorter.tsx:354` (`"Thêm slide"`) | Hai nút ở HAI TẦNG khác nhau: "Thêm trang trình bày" = thêm 1 **sheet/tab mới** (cả bộ deck riêng, xem `SheetTabBar`), "Thêm slide" = thêm 1 **trang bên trong deck đang mở**. Nhưng "trang trình bày" và "slide" đọc lên NGHE GIỐNG HỆT NHAU với người dùng không rành thuật ngữ — trong khi nhãn mặc định của `SheetTabBar.tsx:48` vốn là "Thêm sheet" (rõ ràng, phân biệt được với "slide"), Present lại tự đổi thành nhãn dễ nhầm. Đối chứng: `components/cad/CadSheets.tsx:471` dùng `addLabel="Thêm bản vẽ"` — rõ ràng, không đụng "slide" nào ở tầng dưới. | 🟡 |
| `components/LibraryPanel.tsx:130` "Thêm ảnh vào thư viện" (`[+]`) → nút con `:228` "Upload" vs `:237` "Nạp vào thư viện" | Đã biết, đang chờ quyết định sản phẩm (ghi trong STATUS.md) — nhắc lại để không lạc mất giữa 2 tài liệu, KHÔNG tính là phát hiện mới. | — |

Không tìm thấy cặp trùng nghĩa mới nào khác đủ rõ ràng để liệt kê (đã rà `Lưu/Xuất/Tải xuống/Chèn/Thêm/Đóng/Huỷ/Sửa/Xoá/Gỡ` trên toàn `components/`) — các nhãn còn lại đều có `sub`/tooltip phân biệt rõ (vd 3 định dạng Xuất ở `Toolbar.tsx:134-136` đều có dòng mô tả khác nhau).

---

## 4) Màn hình thiếu empty state có lối đi tiếp

| Vị trí | Vấn đề | Mức độ |
|---|---|---|
| `components/cad/CadCanvas.tsx` (toàn bộ 3212 dòng) | Grep `entities.length` trên file = **0 kết quả**. Không có bất kỳ empty-state nào cho bản vẽ CAD trống — user mới mở dự án CAD lần đầu chỉ thấy lưới caro + toolbar, không có gợi ý "vẽ tường đầu tiên" / demo mẫu. | 🟡 |
| `components/home/HomeScreen.tsx:597-599` | `<StageIntroCard stage="render" .../>` — CHỈ gắn cho chặng `render`, dù comment ngay dòng 585 ghi "Cả 3 chặng đều là canvas node". CAD và Present không có thẻ giới thiệu lần-đầu tương đương. | 🟡 |

**Đối chứng làm ĐÚNG** (đã kiểm tra, KHÔNG phải lỗi — nêu để không bị hiểu lầm là bỏ sót):
`components/FlowCanvas.tsx:365-387` (Render, "Canvas trống" + gợi ý Node Library + `DemoLauncher`),
`components/LibraryPanel.tsx:268-271` ("Trống — upload ảnh…, kéo thả ra canvas"),
`components/notebook/NotebookSourcesSidebar.tsx:268-272` ("Chưa có nguồn nào"),
`components/notebook/NotebookChatPanel.tsx:187-210` (empty state có CTA trỏ đúng cột trái khi chưa có nguồn) — cả 4 chỗ này đều đạt yêu cầu "empty state có lối đi tiếp".

---

## 5) Lỗi hiển thị dạng kỹ thuật thô (vi phạm `SPEC-UI-SHELL.md §3`)

| Vị trí | Vấn đề | Mức độ |
|---|---|---|
| `components/nodes/NodeExtras.tsx:324` | `setMsg(body.error ?? \`Convert FBX lỗi (HTTP ${res.status}).\`)` — lộ thẳng mã HTTP ra UI khi server không trả `error`. | 🔴 |
| `components/dashboard/ProjectMembersPanel.tsx:78` | `setError((await r.json().catch(() => null))?.error ?? \`Lỗi ${r.status}\`)` — cùng lỗi, hiện trực tiếp ở `:121`. | 🔴 |
| `components/dashboard/ProjectMembersPanel.tsx:57,63` | `throw new Error(... ?? String(r.status))` rồi `setError(e.message === '404' ? '...' : e.message)` — CHỈ xử lý riêng mã 404; mọi mã khác (500, 403, 401…) hiện thẳng số HTTP thô, không có "giờ bấm gì". | 🔴 |
| `components/studio/RenderIOMenus.tsx:52,74` | `flash(false, \`Lỗi xuất PDF/PPTX: ${err.message}\`)` — nối thẳng exception nội bộ của lib xuất file (jsPDF/pptxgenjs) vào thông báo, 1 câu kỹ thuật, không có câu "giờ bấm gì". | 🟡 |
| `components/cad/CadEditor.tsx:277` | `setStatus(\`Không đọc được "${f.name}": ${err.message}\`)` — lỗi parser DWG/DXF thô nối thẳng vào status bar, không hướng dẫn bước tiếp theo. | 🟡 |
| `components/entry/LoginForm.tsx:131`, `components/LoginScreen.tsx:81` | `setError(err instanceof Error ? err.message : String(err))` — CHỈ rơi vào nhánh này khi lỗi mạng/không phản hồi JSON (đường lỗi chính từ server đã có `body.error` tử tế). Mức độ thấp hơn vì hiếm gặp. | ⚪ |
| `components/smartselect/SmartSelectModal.tsx:316`, `components/cad-library/BlockLibraryDemo.tsx:55,183` | Cùng pattern `err.message`/`String(err)` thô — nhưng modal chọn vùng ít gặp lỗi mạng, và `BlockLibraryDemo` là route dev-only. | ⚪ |

---

## 6) Vi phạm luật canvas 4 trạng thái (`SPEC-UI-SHELL.md §2B`)

Spec đã tự nêu 1 lỗi đã biết ở Present ("chọn chữ để dời mà toolbar vẫn nằm đè") — xác minh bằng
code cho thấy lỗi này **vẫn còn nguyên**, và gốc rễ thật ra rộng hơn phạm vi 1 bug đã nêu.

| Vị trí | Vấn đề | Mức độ |
|---|---|---|
| `components/present-editor/EditorCanvas.tsx:169-174` (`soleTextEl`) + `:518-534` (`<TextToolbar>`) | `soleTextEl` chỉ tắt khi `editing` (đang sửa chữ) hoặc bỏ chọn — trong lúc KÉO DI CHUYỂN text đang chọn (không phải sửa chữ, không đổi `selectedIds`), biến này vẫn `truthy` ⇒ `<TextToolbar>` tiếp tục render đè lên khung chữ suốt quá trình kéo. **Xác nhận: đúng như spec đã ghi, chưa sửa.** | 🔴 |
| `components/present-editor/PresentEditor.tsx:1427` (`<Toolbar>`) và `:1742` (`<Inspector>`) | Rộng hơn lỗi trên: `<Toolbar>` (thanh trên) render KHÔNG điều kiện, `<Inspector>` (panel phải) chỉ điều kiện theo `ed.slide` tồn tại — KHÔNG có bất kỳ điều kiện nào theo trạng thái đang kéo/resize/xoay. Nghĩa là mọi thao tác di chuyển/resize/xoay BẤT KỲ đối tượng nào (không riêng text) đều giữ nguyên toolbar + Inspector, vi phạm luật "ẩn toàn bộ toolbar/panel không liên quan" ở diện rộng hơn phần spec đã nêu. | 🟡 |
| `components/present-editor/EditorCanvas.tsx` + `Element.tsx` toàn bộ | Grep `dragging\|isDragging\|guideLine\|snapGuide\|alignGuide\|liveMeasure` trên cả 2 file = **0 kết quả**. Không tồn tại state "đang kéo" nào được truyền lên để ẩn UI, VÀ cũng không có đường căn (alignment guide)/số đo real-time nào được vẽ trong lúc kéo — nửa sau của luật ("chỉ hiện đường căn + số đo") chưa được xây, không phải chỉ "còn sót 1 chỗ". | 🟡 |
| `components/cad/CadCanvas.tsx` (3212 dòng) | Grep `dragging\|isDragging\|moveRef\|dragRef` = **0 kết quả** — cùng khoảng trống kiến trúc như Present: không có state nào ẩn `CadToolbar` (pill nổi cố định `CadToolbar.tsx:216-239`) hay các palette đang mở (`MaterialPalette`/`ZonePanel`/`HistoryPanel`/`SchedulePanel`) khi đang kéo grip di chuyển/resize 1 entity. Mức độ thấp hơn Present vì CAD không có toolbar theo-ngữ-cảnh nằm ĐÈ trực tiếp lên vật đang chọn (chỉ là panel tĩnh xung quanh), nhưng vẫn vi phạm câu chữ của luật. | 🟡 |
| `components/FlowCanvas.tsx:296` | `onNodeDragStart={() => snapshot()}` — hook kéo node CHỈ dùng để lưu undo-snapshot, không có tác dụng ẩn UI nào. Mọi panel đang mở (`NodeLibraryPanel`/`LibraryPanel`/`ChatPanel`…) giữ nguyên trong lúc kéo node. | ⚪ |

---

## Kết luận — 5 việc nên sửa TRƯỚC, xếp theo (rẻ × tác động)

1. **Sửa 4 chỗ lộ mã HTTP thô** (`nodes/NodeExtras.tsx:324`, `dashboard/ProjectMembersPanel.tsx:57,63,78`) — rẻ nhất trong danh sách (đổi vài dòng string fallback thành câu tiếng Việt tử tế), nhưng là kiểu lỗi "trông như app hỏng" dễ gặp nhất vì nằm ở đường lỗi mặc định (fallback) — bất kỳ lỗi mạng/server nào không trả đúng field `error` đều rơi vào đây.
2. **Cho `IOMenu.tsx`/`MenuButton.tsx` dùng lại logic đo-viewport của `Popover.tsx` đã có sẵn** — không cần thiết kế gì mới, chỉ tái dùng 1 component đã viết đúng trong phiên này; vì 2 component này dùng ở CẢ 3 CHẶNG + Header, sửa 1 chỗ lan toả toàn app — tỉ lệ (công sức)/(số màn hình được lợi) tốt nhất trong danh sách.
3. **Thêm empty-state cho CAD trống**, copy nguyên mẫu đã chạy tốt ở `FlowCanvas.tsx:365-387` (Render) — không phải nghĩ nội dung mới, chỉ chuyển pattern đã có sẵn trong chính repo sang CAD.
4. **Gắn `<StageIntroCard>` cho `stage="cad"` và `stage="present"`** — component đã tồn tại và chạy được cho Render, chỉ cần thêm 2 điểm gọi + soạn nội dung tương ứng, không phải xây từ đầu.
5. **Ẩn `<Toolbar>`/`<Inspector>` của Present khi đang kéo/resize/xoay** (`PresentEditor.tsx:1427,1742` + `EditorCanvas.tsx:169-174`) — xếp cuối vì tốn công hơn 4 việc trên (phải thêm state "đang thao tác" xuyên suốt `Element.tsx` → `EditorCanvas.tsx` → `PresentEditor.tsx`, không tái dùng được gì có sẵn), nhưng đây là bug DUY NHẤT đã được đặt tên thẳng trong `SPEC-UI-SHELL.md §2B` — để lâu sẽ tiếp tục là ví dụ "app không chuyên nghiệp" dễ bị soi nhất khi demo chặng Presenting.
