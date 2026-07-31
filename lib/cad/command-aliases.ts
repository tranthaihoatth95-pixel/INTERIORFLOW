/**
 * lib/cad/command-aliases.ts — danh mục LỆNH GÕ TAY kiểu AutoCAD (alias chữ → tên lệnh),
 * MỘT NGUỒN DUY NHẤT.
 *
 * Trước 31/07 mảng này sống bên trong `CadEditor.tsx` (riêng cho autocomplete dòng lệnh).
 * Tách ra đây (Sprint "Lộ nền", `7.3.33`) để `lib/shortcuts.ts` — bảng tra phím tắt toàn app —
 * đọc CÙNG mảng này thay vì chép tay ra một bản riêng dễ lệch theo thời gian. `CadEditor.tsx`
 * import lại từ đây (`matchCommands()`), hành vi autocomplete không đổi.
 *
 * KHÔNG nhầm với `lib/cad/commands.ts` (macro hình học wall/room/door/titleBlock…) — 2 file
 * khác mục đích, chỉ trùng chữ "command".
 */
export const CAD_COMMANDS: { cmd: string; label: string }[] = [
  { cmd: 'L', label: 'Đường thẳng' },
  { cmd: 'LINE', label: 'Đường thẳng' },
  { cmd: 'PL', label: 'Polyline' },
  { cmd: 'PLINE', label: 'Polyline' },
  { cmd: 'REC', label: 'Chữ nhật' },
  { cmd: 'RECT', label: 'Chữ nhật' },
  { cmd: 'C', label: 'Đường tròn' },
  { cmd: 'CIRCLE', label: 'Đường tròn' },
  { cmd: 'C3P', label: 'Đường tròn 3-điểm' },
  { cmd: 'CIRCLE3P', label: 'Đường tròn 3-điểm' },
  { cmd: 'A', label: 'Cung tròn (3 điểm)' },
  { cmd: 'ARC', label: 'Cung tròn (3 điểm)' },
  { cmd: 'ARCC', label: 'Cung tròn tâm+góc' },
  { cmd: 'ARCCENTER', label: 'Cung tròn tâm+góc' },
  { cmd: 'M', label: 'Di chuyển' },
  { cmd: 'MOVE', label: 'Di chuyển' },
  { cmd: 'CO', label: 'Sao chép' },
  { cmd: 'COPY', label: 'Sao chép' },
  { cmd: 'RO', label: 'Xoay' },
  { cmd: 'ROTATE', label: 'Xoay' },
  { cmd: 'MI', label: 'Đối xứng' },
  { cmd: 'MIRROR', label: 'Đối xứng' },
  { cmd: 'O', label: 'Offset (O 150)' },
  { cmd: 'OFFSET', label: 'Offset' },
  { cmd: 'DIM', label: 'Ghi kích thước' },
  { cmd: 'DAL', label: 'Kích thước thẳng' },
  { cmd: 'DI', label: 'Đo khoảng cách' },
  { cmd: 'DRA', label: 'Kích thước bán kính' },
  { cmd: 'DDI', label: 'Kích thước đường kính' },
  { cmd: 'DAN', label: 'Kích thước góc' },
  { cmd: 'DCO', label: 'Kích thước nối tiếp' },
  { cmd: 'DBA', label: 'Kích thước baseline' },
  { cmd: 'T', label: 'Chữ' },
  { cmd: 'TEXT', label: 'Chữ' },
  { cmd: 'W', label: 'Tường (W 200)' },
  { cmd: 'WALL', label: 'Tường' },
  { cmd: 'ROOM', label: 'Phòng' },
  { cmd: 'D', label: 'Cửa đi' },
  { cmd: 'DOOR', label: 'Cửa đi' },
  { cmd: 'WIN', label: 'Cửa sổ' },
  { cmd: 'WINDOW', label: 'Cửa sổ' },
  { cmd: 'TR', label: 'Cắt (trim)' },
  { cmd: 'TRIM', label: 'Cắt (trim)' },
  { cmd: 'EX', label: 'Kéo dài (extend)' },
  { cmd: 'EXTEND', label: 'Kéo dài (extend)' },
  { cmd: 'F', label: 'Bo góc (F 50)' },
  { cmd: 'FILLET', label: 'Bo góc' },
  { cmd: 'CHA', label: 'Vát góc (CHA 30 30)' },
  { cmd: 'CHAMFER', label: 'Vát góc' },
  { cmd: 'AR', label: 'Mảng chữ nhật' },
  { cmd: 'ARRAY', label: 'Mảng chữ nhật' },
  { cmd: 'ARP', label: 'Mảng tròn' },
  { cmd: 'ARRAYPOLAR', label: 'Mảng tròn' },
  { cmd: 'SC', label: 'Tỉ lệ (scale)' },
  { cmd: 'SCALE', label: 'Tỉ lệ (scale)' },
  { cmd: 'S', label: 'Kéo giãn (stretch)' },
  { cmd: 'STRETCH', label: 'Kéo giãn (stretch)' },
  { cmd: 'BR', label: 'Ngắt (break)' },
  { cmd: 'BREAK', label: 'Ngắt (break)' },
  { cmd: 'J', label: 'Nối (join)' },
  { cmd: 'JOIN', label: 'Nối (join)' },
  { cmd: 'X', label: 'Phá khối (explode)' },
  { cmd: 'EXPLODE', label: 'Phá khối (explode)' },
  { cmd: 'LEN', label: 'Đổi chiều dài (LEN 100)' },
  { cmd: 'LENGTHEN', label: 'Đổi chiều dài' },
  { cmd: 'DIMTXT', label: 'Cỡ chữ kích thước' },
  { cmd: 'DIMASZ', label: 'Cỡ mũi tên' },
  { cmd: 'DIMSCALE', label: 'Tỉ lệ dim' },
  { cmd: 'H', label: 'Mặt cắt (H ANSI31 20)' },
  { cmd: 'HATCH', label: 'Mặt cắt (hatch)' },
  { cmd: 'HANGLE', label: 'Góc hatch' },
  { cmd: 'POLAR', label: 'Polar tracking' },
  { cmd: 'E', label: 'Xoá' },
  { cmd: 'DEL', label: 'Xoá' },
  { cmd: 'ERASE', label: 'Xoá' },
  { cmd: 'U', label: 'Hoàn tác' },
  { cmd: 'UNDO', label: 'Hoàn tác' },
  { cmd: 'RE', label: 'Làm lại' },
  { cmd: 'REDO', label: 'Làm lại' },
  { cmd: 'EXT', label: 'Zoom Extents' },
  { cmd: 'Z', label: 'Zoom Extents' },
  { cmd: 'SEL', label: 'Chọn' },
  // Sprint 10 — Việc 2/3: Polygon đều · Ellipse · Donut · Spline · Xline · Divide/Measure
  { cmd: 'POL', label: 'Polygon đều (POL 8 = đổi 8 cạnh)' },
  { cmd: 'POLYGON', label: 'Polygon đều' },
  { cmd: 'EL', label: 'Ellipse' },
  { cmd: 'ELLIPSE', label: 'Ellipse' },
  { cmd: 'DO', label: 'Donut (DO 50 150 = trong/ngoài)' },
  { cmd: 'DONUT', label: 'Donut' },
  { cmd: 'SPL', label: 'Spline' },
  { cmd: 'SPLINE', label: 'Spline' },
  { cmd: 'XL', label: 'Xline — đường tham chiếu vô hạn' },
  { cmd: 'XLINE', label: 'Xline' },
  { cmd: 'DIV', label: 'Divide/Measure — click đối tượng rồi nhập' },
  { cmd: 'DIVIDE', label: 'Divide/Measure' },
  // Zone tool (24/07 — GAP-COLOR-FILL N3). KHÔNG dùng 'Z' (Z = Zoom Extents theo thói quen cũ).
  { cmd: 'ZONE', label: 'Zone — tô vùng chức năng mặt bằng' },
  { cmd: 'AW', label: 'Arrow — mũi tên luồng giao thông' },
  { cmd: 'ARROW', label: 'Arrow — mũi tên luồng giao thông' },
];

/**
 * Gom alias cùng nghĩa lại 1 dòng cho bảng tra phím tắt (7.3.33) — "AR · ARRAY" thay vì 2 dòng
 * rời. Thứ tự cmd trong mỗi nhóm giữ nguyên thứ tự khai báo (alias ngắn luôn đứng trước vì khai
 * trước trong `CAD_COMMANDS`).
 */
export function groupedCadCommands(): { cmds: string[]; label: string }[] {
  const byLabel = new Map<string, string[]>();
  for (const { cmd, label } of CAD_COMMANDS) {
    const list = byLabel.get(label);
    if (list) list.push(cmd);
    else byLabel.set(label, [cmd]);
  }
  return Array.from(byLabel, ([label, cmds]) => ({ cmds, label }));
}
