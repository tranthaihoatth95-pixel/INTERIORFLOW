# Báo cáo phiên — R4-L1 · Tool3DBar tràn ngang khi tool ≥5 ô số (19/08)

Lane UX/UI · HEAD `c7f3ac8` (main, ⓪b PASS) · finding gốc: `docs/bao-cao-phien/2026-08-19-W1-browser-verify-r4-r8.md`.

## ① Tiền đề (⓪)
**XÁC NHẬN ĐÚNG, bằng đọc code tại nguồn** — `Tool3DBar.tsx` bản mang diff R4 (ToolbarBar/ToolbarChip, KHÔNG revert):
- Div định vị (dòng ~235 cũ) có `whiteSpace: 'nowrap'` và **không có `max-width` nào** ⇒ bar một-capsule nở theo nội dung.
- Tool `line` có **6 ô số** (không phải 5 — nhiều hơn cả finding); cộng tiêu đề + chip Áp dụng + dòng nhắc ⇒ ~915px, viewport 3D ~678px @1440×900 ⇒ tràn hai bên, dòng nhắc "Enter áp · Esc huỷ · Space về Chọn" văng khỏi màn.
- B25 LOOK INSIDE: bệnh nowrap có từ TRƯỚC R4 (vỏ tự vẽ cũ cũng nowrap) — R4 chỉ đổi vỏ, không gây bệnh.

## ② Việc đã làm
**Một file duy nhất: `components/render-studio/Tool3DBar.tsx`** (đúng scope ghi).

Hướng chọn + lý do (phiếu cho tự chọn, khai lý do):
- **KHÔNG thể** "wrap trong vỏ capsule": `ToolbarBar` khoá cứng `height: var(--tap-lg)` và spread `...style` TRƯỚC hình dạng (hợp đồng "hình dạng tuyệt đối không cho ghi đè" — `ToolbarChip.tsx:199-216`). Wrap bên trong = nội dung tràn ra ngoài nền capsule 44px. Sửa khuôn = đổi cả 3 chặng = CẤM theo phiếu.
- **Chọn: chia bar thành CÁC CAPSULE ToolbarBar nhỏ trong container flex-wrap**:
  1. Capsule tiêu đề tool.
  2. Ô số chia nhóm **≤3 ô/capsule** (line 6 ô → 2 capsule; rect 5 ô → 2; circle/move ≤4 → tối đa 2; rotate 1 ô → 1). Cỡ 3 giữ mỗi capsule dưới ~400px — lọt viewport hẹp nhất đã đo (~678px) kể cả bản EN.
  3. Capsule cuối: chip **Áp dụng + Sep + dòng nhắc** — dòng nhắc là phần tử trong capsule, KHÔNG bao giờ văng mất (luật "người dùng luôn biết đường ra").
  - Nhánh `needsSel` (cảnh báo chưa chọn khối) và `ruler` (số đo): capsule tiêu đề + capsule (thông điệp + Sep + dòng nhắc).
- Container: `display:flex; flexWrap:wrap; justifyContent:center; gap:6; width:max-content; maxWidth:calc(100% - 24px)` — containing block là wrapper `position:relative; flex:1` của viewport (`Render3DModeSkeleton.tsx:542`) ⇒ maxWidth theo đúng bề rộng viewport 3D. Neo `bottom: bottomPx` nên khi wrap bar **nở LÊN TRÊN**, không đè `ToolDock3D` bên dưới.
- `whiteSpace:nowrap` GIỮ (chống gãy chữ giữa nhãn) — flex-wrap không bị nó ảnh hưởng, wrap chỉ xảy ra ở cấp capsule.
- **CSS thuần, 0 JS đo đạc, 0 animation mới** (đúng ràng buộc phiếu). Khuôn KB-1 giữ nguyên: mọi mảnh vẫn là ToolbarBar capsule 44/r-full, bo §2d tự đồng tâm; ô số vẫn `RADIUS.full`.
- Hành vi GIỮ NGUYÊN 100%: phím tắt, focus ô đầu (`firstInputRef` chuyển sang `ci===0 && i===0` — vẫn là ô đầu tiên), `barRef.contains` vẫn phủ mọi capsule (barRef ở container ngoài), applyRef, undo.

⛔ KHÔNG đụng: ToolbarChip.tsx/ToolbarBar · globals.css · `--accent*`. KHÔNG git add/commit.

## ③ Nghiệm thu
- `npx tsc --noEmit`: **file này 0 lỗi**. Repo có ĐÚNG 1 lỗi ở `components/present-editor/Toolbar.tsx:610` — file của lane khác đang sửa dở trong working tree (comment R9a chèn giữa object literal nuốt `icon:`), có TRƯỚC phiên này, ngoài scope nên không sửa (xem ⑦b).
- `node_modules/.bin/sucrase-node lib/render-studio/tool3d.test.ts`: **34 pass · 0 fail** (logic thuần không đổi).
- **BROWSER-PENDING** — kịch bản verify cho phiên browser:
  1. Mở 3D Design @1440×900 (panel phải mở để viewport ~678px), bấm tool **L (Đường)** — tool nặng nhất, 6 ô số.
  2. KỲ VỌNG: bar hiện thành các capsule xếp 2–3 hàng, **không capsule nào tràn mép viewport**, canh giữa, nở lên trên không đè dock.
  3. Dòng nhắc "Enter áp · Esc huỷ · Space về Chọn" **đọc được trọn** trong capsule cuối.
  4. Gõ số ngay (ô đầu tự focus) → Enter → khối dựng, về Chọn. Esc/Space vẫn thoát. Ctrl+Z lùi được.
  5. Lặp với **R (Chữ nhật)** 5 ô; kiểm cả bản EN (nhãn dài hơn). Viewport rộng (đóng panel): capsule dồn về một hàng.

## ④ Ngoài phạm vi, KHÔNG làm
- Lỗi syntax `present-editor/Toolbar.tsx:610` (lane R9a) — báo MAIN, không sửa hộ.
- Khuôn ToolbarBar không forward ref / không cho nhiều hàng — nếu về sau nhiều bar cần wrap, đáng cân nhắc nâng khuôn MỘT chỗ (quyết định cấp liên chặng, thuộc T).

## ⑤ Mock/giao diện
Không dựng mock mới — đây là sửa hành vi layout của component thật theo khuôn ĐÃ duyệt (KB-1/§2d); hình dạng từng mảnh không đổi so với bản R4 đã lên Claude Design.

## ⑥ Bàn giao
File sửa: `components/render-studio/Tool3DBar.tsx` (docstring + phần render). Chưa commit (đúng luật phiếu).

## ⑦b CHƯA CHẮC / CHƯA KIỂM
- **Chưa chạy app thật một dòng nào** (phiếu cấm lái browser) — mọi con số bề rộng (~400px/capsule, ~678px viewport) là TÍNH từ font 11px + đo của W1, không phải đo trên màn. Rủi ro còn: bản EN nhãn dài bất thường có thể đẩy một capsule 3-ô vượt 678px ở viewport hẹp hơn nữa (panel phụ mở thêm) — khi đó capsule đó bị maxWidth kẹp và chữ trong nó có thể bị cắt (nowrap). Chỉ browser thật trả lời được.
- Nhiều hàng capsule làm bar CAO hơn (2–3 × 44px + gap) — `bottomPx` 130/264 tính cho bar 1 hàng; chưa kiểm bằng mắt xem 3 hàng @dock mở rộng có chạm mép trên của vùng nào không.
- tsc "pass" là pass CHO FILE NÀY — exit code toàn repo đỏ vì lỗi có sẵn của lane khác (đã khai ở ③).
- Chưa thử trình đọc màn hình; aria-label từng ô giữ nguyên nên suy là không thoái lui, nhưng là suy.

## ⑦c HẠN DÙNG KẾT LUẬN
- Kết luận "capsule 3-ô lọt viewport" gắn với viewport ~678px @1440×900 và font 11px hiện tại — đổi mật độ token (`--fs-ui`) hoặc thêm panel chiếm chỗ thì phải đo lại.
- Nếu khuôn ToolbarBar sau này mở cửa multi-row/forward-ref, cách chia-capsule ở đây nên xét gộp lại một capsule wrap — đừng giữ hai cơ chế song song.
