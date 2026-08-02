# TICKET — SỬA KÍNH LỎNG/MỜ (P6c · code phụ)

> Hoà báo 02/08: "mấy cái kính lỏng bị lỗi". Cowork chẩn từ code (worktree, commit hiện tại):

## K1 · TextToolbar.tsx — kính pill nhấp nháy mất blur khi ẩn/hiện (regression P5)
- **Gốc:** `opacity: hidden?0:1` + `transition` đặt ở WRAPPER cha (~dòng 205). Tổ tiên có
  `opacity<1` tạo **backdrop root cô lập** (spec filter-effects-2) → trong 80–150ms fade,
  `backdrop-filter` của `pillWrap` không lấy được nền sau → blur chết/xám bệt, nhìn như kính hỏng.
- **Sửa:** wrapper CHỈ giữ `pointerEvents`; chuyển `opacity` + `transition` xuống CHÍNH các
  element kính (`pillWrap`, `noteStyle`, và ColorPopover nếu đang hiện) — self-opacity KHÔNG
  cô lập backdrop của chính nó. Truyền `hidden` xuống hoặc merge style tại chỗ render.
- Giữ nguyên timing 80ms ẩn / 150ms hiện (chống nhấp nháy quanh ngưỡng 4px — đúng ý P5).

## K2 · ColorPopover — cùng cơ chế K1 + rủi ro clip
- Xác nhận popover là SIBLING của pill trong wrapper (không nằm trong `overflowX:auto` của pill).
  Nếu đang lồng trong pill → dời ra wrapper (kính lồng kính = blur chết + bị scroll-clip).
- Áp cùng fix opacity như K1.

## K3 · ImageEditor.tsx:176 — thiếu WebkitBackdropFilter
- Thêm `WebkitBackdropFilter: 'blur(6px)'` cạnh `backdropFilter` — tablet Safari/iPad (ngữ cảnh
  chính của Hoà) hiện KHÔNG blur, overlay chỉ còn màng tối phẳng.

## Điều kiện xong
- Kéo phần tử liên tục: pill fade mượt, **blur còn nguyên trong lúc fade** (không nháy xám).
- Mở ColorPopover khi toolbar đang hiện → kính đúng, không bị clip.
- tsc/eslint/npm test sạch · verify browser (kéo thả thật) · 1 commit riêng `fix(present): P6c kinh long`.
- Ghi khối lệnh commit vào BAO-CAO-PHU.md cho Hoà chạy tay (git sandbox gãy).

*Cowork chẩn + ghi 02/08/2026. Nguồn quy tắc: SPEC-DESIGN-SYSTEM-IF §2b (kính lỏng/mờ là ngôn ngữ bề mặt chuẩn — sửa cho đúng nền).*
