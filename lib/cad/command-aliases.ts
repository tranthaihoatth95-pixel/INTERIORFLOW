/**
 * lib/cad/command-aliases.ts — danh mục LỆNH GÕ TAY kiểu AutoCAD (alias chữ → tên lệnh),
 * MỘT NGUỒN DUY NHẤT.
 *
 * Trước 31/07 mảng này sống bên trong `CadEditor.tsx` (riêng cho autocomplete dòng lệnh).
 * Tách ra đây (Sprint "Lộ nền", `7.3.33`) để `lib/shortcuts.ts` — bảng tra phím tắt toàn app —
 * đọc CÙNG mảng này thay vì chép tay ra một bản riêng dễ lệch theo thời gian. `CadEditor.tsx`
 * import lại từ đây (`matchCommands()`), hành vi autocomplete không đổi.
 *
 * `group` (thêm khi làm `ShortcutsPanel.tsx` theo mẫu Hoà gửi) — CHỈ để hiển thị 2-cột trong
 * bảng tra, không ảnh hưởng autocomplete (`matchCommands()` không đọc field này).
 *
 * KHÔNG nhầm với `lib/cad/commands.ts` (macro hình học wall/room/door/titleBlock…) — 2 file
 * khác mục đích, chỉ trùng chữ "command".
 */
export type CadCommandGroup = 'Vẽ' | 'Kích thước & mặt cắt' | 'Biến đổi' | 'Nhìn' | 'Chọn, xoá, hoàn tác';

export const CAD_COMMANDS: { cmd: string; label: string; group: CadCommandGroup }[] = [
  { cmd: 'L', label: 'Đường thẳng', group: 'Vẽ' },
  { cmd: 'LINE', label: 'Đường thẳng', group: 'Vẽ' },
  { cmd: 'PL', label: 'Polyline', group: 'Vẽ' },
  { cmd: 'PLINE', label: 'Polyline', group: 'Vẽ' },
  { cmd: 'REC', label: 'Chữ nhật', group: 'Vẽ' },
  { cmd: 'RECT', label: 'Chữ nhật', group: 'Vẽ' },
  { cmd: 'C', label: 'Đường tròn', group: 'Vẽ' },
  { cmd: 'CIRCLE', label: 'Đường tròn', group: 'Vẽ' },
  { cmd: 'C3P', label: 'Đường tròn 3-điểm', group: 'Vẽ' },
  { cmd: 'CIRCLE3P', label: 'Đường tròn 3-điểm', group: 'Vẽ' },
  { cmd: 'A', label: 'Cung tròn (3 điểm)', group: 'Vẽ' },
  { cmd: 'ARC', label: 'Cung tròn (3 điểm)', group: 'Vẽ' },
  { cmd: 'ARCC', label: 'Cung tròn tâm+góc', group: 'Vẽ' },
  { cmd: 'ARCCENTER', label: 'Cung tròn tâm+góc', group: 'Vẽ' },
  { cmd: 'M', label: 'Di chuyển', group: 'Biến đổi' },
  { cmd: 'MOVE', label: 'Di chuyển', group: 'Biến đổi' },
  { cmd: 'CO', label: 'Sao chép', group: 'Biến đổi' },
  { cmd: 'COPY', label: 'Sao chép', group: 'Biến đổi' },
  { cmd: 'RO', label: 'Xoay', group: 'Biến đổi' },
  { cmd: 'ROTATE', label: 'Xoay', group: 'Biến đổi' },
  { cmd: 'MI', label: 'Đối xứng', group: 'Biến đổi' },
  { cmd: 'MIRROR', label: 'Đối xứng', group: 'Biến đổi' },
  { cmd: 'O', label: 'Offset (O 150)', group: 'Biến đổi' },
  { cmd: 'OFFSET', label: 'Offset', group: 'Biến đổi' },
  { cmd: 'DIM', label: 'Ghi kích thước', group: 'Kích thước & mặt cắt' },
  { cmd: 'DAL', label: 'Kích thước thẳng', group: 'Kích thước & mặt cắt' },
  { cmd: 'DI', label: 'Đo khoảng cách', group: 'Kích thước & mặt cắt' },
  { cmd: 'DRA', label: 'Kích thước bán kính', group: 'Kích thước & mặt cắt' },
  { cmd: 'DDI', label: 'Kích thước đường kính', group: 'Kích thước & mặt cắt' },
  { cmd: 'DAN', label: 'Kích thước góc', group: 'Kích thước & mặt cắt' },
  { cmd: 'DCO', label: 'Kích thước nối tiếp', group: 'Kích thước & mặt cắt' },
  { cmd: 'DBA', label: 'Kích thước baseline', group: 'Kích thước & mặt cắt' },
  { cmd: 'T', label: 'Chữ', group: 'Vẽ' },
  { cmd: 'TEXT', label: 'Chữ', group: 'Vẽ' },
  { cmd: 'W', label: 'Tường (W 200)', group: 'Vẽ' },
  { cmd: 'WALL', label: 'Tường', group: 'Vẽ' },
  { cmd: 'ROOM', label: 'Phòng', group: 'Vẽ' },
  { cmd: 'D', label: 'Cửa đi', group: 'Vẽ' },
  { cmd: 'DOOR', label: 'Cửa đi', group: 'Vẽ' },
  { cmd: 'WIN', label: 'Cửa sổ', group: 'Vẽ' },
  { cmd: 'WINDOW', label: 'Cửa sổ', group: 'Vẽ' },
  { cmd: 'TR', label: 'Cắt (trim)', group: 'Biến đổi' },
  { cmd: 'TRIM', label: 'Cắt (trim)', group: 'Biến đổi' },
  { cmd: 'EX', label: 'Kéo dài (extend)', group: 'Biến đổi' },
  { cmd: 'EXTEND', label: 'Kéo dài (extend)', group: 'Biến đổi' },
  { cmd: 'F', label: 'Bo góc (F 50)', group: 'Biến đổi' },
  { cmd: 'FILLET', label: 'Bo góc', group: 'Biến đổi' },
  { cmd: 'CHA', label: 'Vát góc (CHA 30 30)', group: 'Biến đổi' },
  { cmd: 'CHAMFER', label: 'Vát góc', group: 'Biến đổi' },
  { cmd: 'AR', label: 'Mảng chữ nhật', group: 'Biến đổi' },
  { cmd: 'ARRAY', label: 'Mảng chữ nhật', group: 'Biến đổi' },
  { cmd: 'ARP', label: 'Mảng tròn', group: 'Biến đổi' },
  { cmd: 'ARRAYPOLAR', label: 'Mảng tròn', group: 'Biến đổi' },
  { cmd: 'SC', label: 'Tỉ lệ (scale)', group: 'Biến đổi' },
  { cmd: 'SCALE', label: 'Tỉ lệ (scale)', group: 'Biến đổi' },
  { cmd: 'S', label: 'Kéo giãn (stretch)', group: 'Biến đổi' },
  { cmd: 'STRETCH', label: 'Kéo giãn (stretch)', group: 'Biến đổi' },
  { cmd: 'BR', label: 'Ngắt (break)', group: 'Biến đổi' },
  { cmd: 'BREAK', label: 'Ngắt (break)', group: 'Biến đổi' },
  { cmd: 'J', label: 'Nối (join)', group: 'Biến đổi' },
  { cmd: 'JOIN', label: 'Nối (join)', group: 'Biến đổi' },
  { cmd: 'X', label: 'Phá khối (explode)', group: 'Biến đổi' },
  { cmd: 'EXPLODE', label: 'Phá khối (explode)', group: 'Biến đổi' },
  { cmd: 'LEN', label: 'Đổi chiều dài (LEN 100)', group: 'Biến đổi' },
  { cmd: 'LENGTHEN', label: 'Đổi chiều dài', group: 'Biến đổi' },
  // Chỉnh lệnh vừa chạy (B4, Blender F9) — mở/focus mặt tiền chỉnh lại tham số của Dời/Chép/Xoay/Offset/Tường vừa chốt.
  { cmd: 'ADJ', label: 'Chỉnh lệnh vừa chạy (F9)', group: 'Biến đổi' },
  { cmd: 'ADJUST', label: 'Chỉnh lệnh vừa chạy', group: 'Biến đổi' },
  { cmd: 'DIMTXT', label: 'Cỡ chữ kích thước', group: 'Kích thước & mặt cắt' },
  { cmd: 'DIMASZ', label: 'Cỡ mũi tên', group: 'Kích thước & mặt cắt' },
  { cmd: 'DIMSCALE', label: 'Tỉ lệ dim', group: 'Kích thước & mặt cắt' },
  { cmd: 'H', label: 'Mặt cắt (H ANSI31 20)', group: 'Kích thước & mặt cắt' },
  { cmd: 'HATCH', label: 'Mặt cắt (hatch)', group: 'Kích thước & mặt cắt' },
  { cmd: 'HANGLE', label: 'Góc hatch', group: 'Kích thước & mặt cắt' },
  { cmd: 'POLAR', label: 'Polar tracking', group: 'Nhìn' },
  { cmd: 'E', label: 'Xoá', group: 'Chọn, xoá, hoàn tác' },
  { cmd: 'DEL', label: 'Xoá', group: 'Chọn, xoá, hoàn tác' },
  { cmd: 'ERASE', label: 'Xoá', group: 'Chọn, xoá, hoàn tác' },
  { cmd: 'U', label: 'Hoàn tác', group: 'Chọn, xoá, hoàn tác' },
  { cmd: 'UNDO', label: 'Hoàn tác', group: 'Chọn, xoá, hoàn tác' },
  { cmd: 'RE', label: 'Làm lại', group: 'Chọn, xoá, hoàn tác' },
  { cmd: 'REDO', label: 'Làm lại', group: 'Chọn, xoá, hoàn tác' },
  { cmd: 'EXT', label: 'Zoom Extents', group: 'Nhìn' },
  { cmd: 'Z', label: 'Zoom Extents', group: 'Nhìn' },
  { cmd: 'SEL', label: 'Chọn', group: 'Chọn, xoá, hoàn tác' },
  // Sprint 10 — Việc 2/3: Polygon đều · Ellipse · Donut · Spline · Xline · Divide/Measure
  { cmd: 'POL', label: 'Polygon đều (POL 8 = đổi 8 cạnh)', group: 'Vẽ' },
  { cmd: 'POLYGON', label: 'Polygon đều', group: 'Vẽ' },
  { cmd: 'EL', label: 'Ellipse', group: 'Vẽ' },
  { cmd: 'ELLIPSE', label: 'Ellipse', group: 'Vẽ' },
  { cmd: 'DO', label: 'Donut (DO 50 150 = trong/ngoài)', group: 'Vẽ' },
  { cmd: 'DONUT', label: 'Donut', group: 'Vẽ' },
  { cmd: 'SPL', label: 'Spline', group: 'Vẽ' },
  { cmd: 'SPLINE', label: 'Spline', group: 'Vẽ' },
  { cmd: 'XL', label: 'Xline — đường tham chiếu vô hạn', group: 'Vẽ' },
  { cmd: 'XLINE', label: 'Xline', group: 'Vẽ' },
  { cmd: 'DIV', label: 'Divide/Measure — click đối tượng rồi nhập', group: 'Biến đổi' },
  { cmd: 'DIVIDE', label: 'Divide/Measure', group: 'Biến đổi' },
  // Zone tool (24/07 — GAP-COLOR-FILL N3). KHÔNG dùng 'Z' (Z = Zoom Extents theo thói quen cũ).
  { cmd: 'ZONE', label: 'Zone — tô vùng chức năng mặt bằng', group: 'Vẽ' },
  { cmd: 'AW', label: 'Arrow — mũi tên luồng giao thông', group: 'Vẽ' },
  { cmd: 'ARROW', label: 'Arrow — mũi tên luồng giao thông', group: 'Vẽ' },
];

/**
 * Gom alias cùng nghĩa lại 1 dòng cho bảng tra phím tắt (7.3.33) — "AR · ARRAY" thay vì 2 dòng
 * rời. Thứ tự cmd trong mỗi nhóm giữ nguyên thứ tự khai báo (alias ngắn luôn đứng trước vì khai
 * trước trong `CAD_COMMANDS`). `group` lấy từ entry ĐẦU TIÊN của mỗi label (alias cùng label
 * luôn cùng group — xác nhận bằng test).
 */
export function groupedCadCommands(): { cmds: string[]; label: string; group: CadCommandGroup }[] {
  const byLabel = new Map<string, { cmds: string[]; label: string; group: CadCommandGroup }>();
  for (const { cmd, label, group } of CAD_COMMANDS) {
    const entry = byLabel.get(label);
    if (entry) entry.cmds.push(cmd);
    else byLabel.set(label, { cmds: [cmd], label, group });
  }
  return Array.from(byLabel.values());
}

/** Gom theo 5 nhóm hiển thị (Vẽ/Kích thước & mặt cắt/Biến đổi/Nhìn/Chọn·xoá·hoàn tác) cho
 * `ShortcutsPanel.tsx` — thứ tự nhóm cố định, khớp bản mẫu Hoà gửi 31/07. */
export function groupedCadCommandsByCategory(): { group: CadCommandGroup; items: { cmds: string[]; label: string }[] }[] {
  const order: CadCommandGroup[] = ['Vẽ', 'Kích thước & mặt cắt', 'Biến đổi', 'Nhìn', 'Chọn, xoá, hoàn tác'];
  const flat = groupedCadCommands();
  return order
    .map((group) => ({ group, items: flat.filter((f) => f.group === group).map(({ cmds, label }) => ({ cmds, label })) }))
    .filter((g) => g.items.length > 0);
}
