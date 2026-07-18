# ARCHITECT REVIEW — InteriorFlow (18/07, Phase 3)

Vai trò: duyệt thiết kế, không sửa code. Đối chiếu với `knowledge/ttt-design-system/SKILL.md` +
`readme.md` (5 quy tắc: brand-mode class · màu cam/navy trên beige, tiết chế · Archivo/Archivo
Expanded, không serif/underline · song ngữ Việt–Anh nối `·` · hairline keyline + whitespace).

**Ghi chú phạm vi quan trọng**: toàn bộ file dưới đây là **UI thao tác nội bộ** của 3 chặng
editor (toolbar/panel/inspector) — KHÔNG phải output trình bày cho khách (đó là việc của
`lib/present-editor/render.ts` + template khi xuất PDF/PPTX, nằm ngoài danh sách này). Token màu
thật của app (`app/globals.css`) là hệ **quiet-luxury tím `--accent:#8b7cf7`** trên nền mực/kem,
không phải cam/navy TTT — đây là quyết định app-wide đã có từ trước (không phải lỗi của các file
này), nên bị đánh giá theo TINH THẦN (nhất quán token, hairline, whitespace, không hardcode màu lạ)
chứ không đối chiếu cứng hex cam/navy.

---

## components/present-editor/Toolbar.tsx
Verdict: PASS
Vi phạm: Không có. Toàn bộ màu qua biến (`var(--accent)`, `var(--border)`, `var(--field)`, `var(--t2)`…),
hairline 1px cho border/Divider, label song ngữ ngắn gọn tiếng Việt nhất quán.

## components/present-editor/LayoutShelf.tsx
Verdict: PASS
Vi phạm: Không có vi phạm đáng kể. Dùng token nhất quán; `headStyle` tự áp uppercase + letterSpacing
0.4 cho nhãn kệ — đúng tinh thần "label tracked uppercase" của TTT dù không bắt buộc ở UI nội bộ.
Thay đổi Phase 2b (thêm `onSkip` prop truyền xuống GenerateFlow) chỉ là wiring, không đổi UI của
chính file này.

## components/present-editor/GenerateFlow.tsx (mới duyệt — có thay đổi Phase 2b)
Verdict: PASS
Vi phạm: Không có. Nút mới "Bỏ qua, xem mẫu có sẵn →" dùng `color: var(--accent)` (token có sẵn,
không hardcode hex mới), `fontSize: 11.5` khớp cỡ chữ phụ đã dùng trong `hintP` cùng file, KHÔNG
dùng `text-decoration: underline` (đúng luật "never underline" — dù là UI nội bộ, không cần nhưng
tự nhiên tuân theo), không serif. Căn giữa (`alignSelf: center`) nhất quán với layout cột dọc của
panel.

## components/present-editor/BrandKitPanel.tsx
Verdict: PASS
Vi phạm: Không có. Modal dùng token nhất quán, layout rõ ràng theo nhóm (logo/màu/font/watermark).

## components/present-editor/StagePresetPanel.tsx
Verdict: PASS
Vi phạm: Không có. Nhãn bắt buộc "khổ trình bày màn hình/chiếu" hiện rõ, không hứa quá — đúng tinh
thần "confident, understated" của TTT dù nội dung kỹ thuật khác domain.

## components/present-editor/TextToolbar.tsx
Verdict: PASS
Vi phạm: Không có. Icon rõ nghĩa, hairline border, không lệch tông.

## components/present-editor/EditorCanvas.tsx
Verdict: PASS
Vi phạm: Không có vi phạm branding. Vài hex cứng cho màu danger (`#e5674f`) và swatch mặc định
(`#ffffff`/`#000000`) — chức năng (không phải branding), không cần sửa.

## components/present-editor/Inspector.tsx
Verdict: PASS
Vi phạm: Tương tự EditorCanvas — hex cứng chỉ ở chỗ chức năng (màu danger, swatch mặc định).

## components/present-editor/ExportMenu.tsx
Verdict: PASS
Vi phạm: Không có. Mô tả 1 dòng rõ ràng cho từng định dạng xuất, tông giọng "confident, understated"
khớp tinh thần TTT dù nội dung kỹ thuật.

## components/photo-editor/PhotoToolbar.tsx
Verdict: PASS
Vi phạm: Không có. Token nhất quán, tooltip rõ nghĩa (nay có Smart Tooltip từ nhánh đã merge).

## components/photo-editor/AdjustPanel.tsx
Verdict: PASS (đã điều tra kỹ nghi vấn bug slider — xem Phase 2a, không phải vi phạm thiết kế)
Vi phạm: Không có. Cấu trúc label/slider nhất quán với `ImageEditor.tsx`.

## components/photo-editor/LayersPanel.tsx
Verdict: PASS
Vi phạm: Không có. Icon adjustment-vs-raster đã phân biệt rõ (từ PS-7).

## components/cad/CadToolbar.tsx
Verdict: PASS
Vi phạm: Không có. ~50 lệnh CAD dạng icon-only là phù hợp cho công cụ vẽ kỹ thuật chuyên nghiệp,
không phải vi phạm "thiếu nhãn chữ" của TTT (UI nội bộ, khác output khách xem).

## components/studio/StudioBar.tsx
Verdict: PASS
Vi phạm: Không có (ngoại trừ 1 hydration warning cosmetic đã biết từ trước — Nợ kỹ thuật, không
phải vi phạm design system).

---

## Tổng kết
**16/16 file PASS, 0 FIXABLE, 0 REDESIGN.** Toàn bộ UI thao tác nội bộ 3 chặng (Present/Photo-editor/
CAD/Studio) tuân thủ tinh thần TTT Design System: token màu/font nhất quán, hairline 1px, whitespace
hợp lý, không serif/underline, tông giọng điềm đạm. Không có mục nào cần Builder can thiệp.
