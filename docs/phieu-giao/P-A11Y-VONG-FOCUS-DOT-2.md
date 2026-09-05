# PHIẾU · VÒNG FOCUS ĐỢT 2 — 21 lỗ thật còn lại + luật soi theo DÒNG

> **SOẠN SẴN, CHƯA PHÓNG.** Sinh ra từ hai phát hiện ngoài phạm vi của đợt 1
> (`docs/bao-cao-phien/2026-09-04-a11y-vong-focus.md` §7). Đợt 1 đã đóng 8 lỗ; đây là phần còn lại.

## VIỆC 1 — 21 tệp lỗ thật, ngoài `FILES_ALLOWED` của đợt 1
Cơ chế: `style={{ outline: 'none' }}` inline hoặc `outline:none` trong chuỗi CSS ⇒ đo được là
**`0px none`**, mất hẳn vòng focus. Gồm `CommentLayer` · `FlowCanvas` · `ShortcutsPanel` ·
`cad/AiBriefPanel` · `cad/CadCanvas` · `cad/CadEditor` · `TaskBoardScreen` · `three/Viewport3D` …
(danh sách đầy đủ: `npm run soi:thao-tac`).
**Cách sửa đã chứng minh ở đợt 1:** gỡ hẳn, để luật toàn app `globals.css:435` lo — đừng đổi thành
`focus-visible:outline-none` (vẫn giết ring lúc gõ phím). Chỗ nào cha có `overflow:hidden` thì dùng
`.if-focus-inset` (ring TRONG) đã có sẵn.

## VIỆC 2 — chuyển luật soi từ TỆP sang DÒNG
`mauThieu: 'focus-visible'` hiện miễn trừ **cả tệp** nếu tệp có chữ đó ở bất kỳ đâu ⇒ **tệp vừa dựng
ring cho vật A vừa giết ring vật B thì lọt sạch**. Năm ca thật đã đo: `three/ve3d-css.ts:34,105` ·
`library/library-sheet-css.ts:101` · `filemanager/files-mock-css.ts:89` · `dna/inspiration-css.ts:19`.
⇒ Con số 21 là **SÀN, không phải trần**. Luật phải soi theo **occurrence**: mỗi `outline:none` phải có
`:focus-visible` cho **cùng selector**.

## VIỆC 3 — mắt kiểm 6 tệp `render-studio`
10 chỗ đợt 1 gỡ `focus:outline-none` nằm trong panel hẹp. `outline-offset: 2px` vẽ **ra ngoài** phần
tử; cha có `overflow:hidden` thì ring **bị xén**. Worker đợt 1 khai thẳng là **chưa kiểm được** vì
chưa dựng app. Phải mở app thật hoặc bản xem trước Vercel mà nhìn.

## 🔴 RỦI RO HẸN GIỜ — ghi to, đừng để phiên sau đạp phải
24 tệp dùng class `outline-none` trần hiện **KHÔNG** phải lỗ, nhưng chỉ nhờ **THỨ TỰ trong bundle**
(`.outline-none` byte 37.724 · luật focus byte 47.057 — globals đứng sau nên thắng), **không nhờ đặc
hiệu** (cả hai đều 0-1-0). ⇒ **Đảo `@tailwind utilities` xuống cuối `globals.css`, hoặc nâng lên
Tailwind v4** (utilities vào `@layer`, thua mọi thứ ngoài layer) ⇒ **24 tệp đó thành lỗ thật ngay
trong một lần nâng phiên bản.** Ai làm việc đó phải nới mẫu soi trở lại cùng lượt.

## RÀNG BUỘC
Token `var(--stroke-focus)` + `var(--focus-ring)`, **cấm hex, cấm màu tự chế**. Đây là việc **TRỢ
NĂNG**, không phải việc thị giác — cấm đổi bố cục/khoảng cách/bo góc. Không commit, không push.
