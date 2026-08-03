/**
 * lib/commands/registry.ts — SỔ LỆNH (Trụ 2, docs/SPEC-HA-TANG-UI-IF.md §2 "MỘT SỔ LỆNH →
 * SÁU MẶT HIỆN"). PHU §3 mục 3.
 *
 * GOM GÌ, GOM THẾ NÀO — đọc kỹ trước khi sửa:
 * - Nguồn dữ liệu: `lib/cad/command-aliases.ts` (CAD_COMMANDS — 97 alias, 55 "nhóm phát lệnh"
 *   thật sự khác nhau khi gộp theo HÀNH VI PHÁT LỆNH chứ không theo label hiển thị — vd 'O' và
 *   'OFFSET' có label khác nhau trong command-aliases.ts ("Offset (O 150)" vs "Offset") nhưng
 *   CÙNG một dispatch (setTool('offset')) nên ở đây gộp làm 1 CommandDef, 2 alias).
 * - Nguồn hành vi phát lệnh: đọc trực tiếp từ `run()` (map object, KHÔNG phải switch/case) trong
 *   components/cad/CadEditor.tsx dòng ~1579-1739 — đã xác nhận MỌI dispatch ở đó gọi thẳng
 *   `useCadStore.getState().<action>()`, không có state cục bộ nào của CadEditor cả. Vì vậy
 *   registry này KHÔNG cần "ctx" build từ component React nào — gọi được từ bất kỳ đâu (dock,
 *   menu, phím tắt, LLM) miễn import được store.
 * - KHÔNG gom `lib/cad/commands.ts` (macro hình học wall/room/door/titleBlock…) vào ĐÂY theo
 *   nghĩa đen "nhập nội dung file". Đã xác minh: `run()` trong CadEditor.tsx CHỈ gọi
 *   `setTool('wall')`/`setTool('room')`/`setPendingBlock('door'|'window')` — các macro thật ở
 *   commands.ts (wallChain/roomRect/placeBlock…) được CadCanvas.tsx gọi SAU, khi người dùng
 *   click trên canvas lúc tool đang active — một tầng thấp hơn, không liên quan gì đến việc
 *   MỘT LỆNH → SÁU MẶT HIỆN mà Trụ 2 giải quyết. command-aliases.ts tự cảnh báo đúng điều này
 *   (xem docstring file đó) — merge-theo-nghĩa-đen sẽ trộn 2 tầng trừu tượng khác nhau, sai.
 *   "Gom" ở đây nghĩa là: MỘT nguồn khai báo duy nhất thay cho 2 nơi rời rạc (mảng
 *   CAD_COMMANDS tĩnh + object `map` lặp lại logic dispatch bên trong CadEditor.tsx).
 * - `lib/cad/command-aliases.ts` VẪN GIỮ NGUYÊN, KHÔNG xoá/sửa — `ShortcutsPanel.tsx` và
 *   `lib/shortcuts.ts` (`cadTypedCommandGroups()`) vẫn đọc từ đó, hành vi hiển thị hiện tại
 *   không đổi. registry.ts là lớp MỚI, cộng thêm, cho các mặt hiện MỚI (dock/palette/
 *   contextmenu/llm) — CadEditor.tsx's `run()` CHƯA bị đổi để gọi registry (việc đó là bước
 *   sau, tách riêng để tránh vỡ hành vi status-bar đang chạy tốt — xem TODO cuối file).
 *
 * `when` — parser nhỏ, KHÔNG eval (đúng yêu cầu spec): chỉ đọc biểu thức dạng
 * `KEY==VALUE`/`KEY!=VALUE` nối bằng `&&`, so trên `WhenCtx`. Toàn bộ lệnh CAD ở đây đều cần
 * `stage==cad`; lệnh nào có tool nằm trong `PRO_ONLY_TOOLS` (lib/cad/store.ts) thì thêm
 * `proToolsAllowed==true` — cờ này do NƠI GỌI tính sẵn qua `shouldShowProTools(role,stage,
 * cadMode)` rồi truyền vào `WhenCtx`, registry KHÔNG tự tính (tránh phụ thuộc ngược vào
 * CadRole/CadStage — 2 khái niệm "vai trò/chặng dự án" không liên quan trực tiếp lệnh CAD).
 *
 * `key` — CHỈ điền cho lệnh thật sự có phím tắt toàn cục hôm nay (đối chiếu lib/shortcuts.ts):
 * Hoàn tác/Làm lại/Xoá/Zoom-Extents. Các lệnh vẽ/biến đổi (L, W, F, TRIM…) KHÔNG có phím tắt
 * trực tiếp — chỉ gõ được ở status-bar (xác nhận: lib/shortcuts.ts dòng 14-16 nói rõ lệnh gõ
 * tay CAD không khai ở đó). Đặc biệt: phím 'F' rời (không gõ) = Zoom Extents (đã có từ trước,
 * xem comment gốc ở CadEditor.tsx dòng ~1704), còn gõ "F"+Enter ở ô lệnh = FILLET — 2 nghĩa
 * khác nhau theo 2 MẶT HIỆN khác nhau, KHÔNG được gán `key:['F']` cho lệnh Fillet kẻo đụng.
 *
 * `icon` — CHƯA điền (không có trong phạm vi việc này — UI dock/palette thật chưa tồn tại,
 * chọn icon là quyết định thiết kế của người làm UI, không phải việc của registry dữ liệu).
 *
 * `surfaces` — chỉ khai `'statusbar'` (mọi lệnh, hành vi ĐÃ có) + `'shortcut'` (đúng 4 lệnh có
 * phím thật ở trên). KHÔNG tự gán `'dock'/'palette'/'contextmenu'` cho lệnh nào — chưa có UI
 * nào tiêu thụ các mặt đó, gán bừa là bịa việc ngoài phạm vi "gom tài sản đã có".
 */

// Import TƯƠNG ĐỐI (không dùng alias '@/') — theo đúng quy ước lib/* THUẦN test bằng sucrase-
// node (xem lib/boq/compute.ts, lib/cad/if2-nen.test.ts): alias '@/' chỉ resolve được qua
// bundler Next.js, không resolve trong `node_modules/.bin/sucrase-node` chạy trực tiếp.
import type { Tool } from '../cad/store';
import { useCadStore, PRO_ONLY_TOOLS } from '../cad/store';
import type { HatchPattern } from '../cad/model';
import { CAD_COMMANDS } from '../cad/command-aliases';

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Kiểu dữ liệu
// ─────────────────────────────────────────────────────────────────────────────────────────────

export type Surface = 'statusbar' | 'shortcut' | 'dock' | 'palette' | 'contextmenu' | 'llm';

/** Token phím — cùng quy ước KeyToken của lib/shortcuts.ts ('mod'/'shift' dịch theo nền tảng
 * lúc render, token khác hiển thị y nguyên). Không import trực tiếp từ shortcuts.ts để tránh
 * phụ thuộc ngược (shortcuts.ts đã import ngược lại command-aliases.ts) — khai lại kiểu tương
 * đương, rẻ hơn refactor vòng phụ thuộc trong việc này. */
export type KeyToken = 'mod' | 'shift' | string;

/** Ngữ cảnh cho parser `when` — tối thiểu, mở rộng được. `stage` = Trụ 1 (cad/render/present),
 * `mode` = Trụ 4 con của stage đó (với CAD: CadMode 'sketch'|'pro'|'revit'). `proToolsAllowed`
 * do nơi gọi tính sẵn qua shouldShowProTools(), xem docstring đầu file. */
export interface WhenCtx {
  stage: string;
  mode?: string;
  proToolsAllowed?: boolean;
}

/** Đối số gõ tay theo sau lệnh (kiểu AutoCAD, vd "O 150" → arg="150"). Optional vì dock/palette/
 * shortcut gọi lệnh không có đối số. */
export interface RunArgs {
  arg?: string;
  arg2?: string;
}

export interface CommandDef {
  id: string;
  /** [tiếng Việt, English] — spec §2 Trụ 2. */
  label: [string, string];
  /** Chỉ điền khi có phím tắt toàn cục THẬT (đối chiếu lib/shortcuts.ts) — xem docstring. */
  key?: KeyToken[];
  /** Alias gõ tay — HOA, khớp nguyên văn CAD_COMMANDS[].cmd. */
  aliases: string[];
  when: (ctx: WhenCtx) => boolean;
  /** `<bucket>@<thứ tự>` — bucket khớp CadCommandGroup gốc (xem GROUP_SLUG), thứ tự giữ đúng
   * thứ tự khai báo trong CAD_COMMANDS (thứ tự đó vốn đã có ý nghĩa — lệnh cơ bản khai trước,
   * xem gợi ý lỗi "Thử L, PL, REC, C, A, W, ROOM, D, WIN, M, CO, RO, MI, O, DIM, T, E, U." ở
   * CadEditor.tsx). */
  group: string;
  surfaces: Surface[];
  run: (args?: RunArgs) => void;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Parser `when` — nhỏ, không eval. Chỉ hỗ trợ KEY==VALUE / KEY!=VALUE nối bằng &&.
// ─────────────────────────────────────────────────────────────────────────────────────────────

type Clause = { key: keyof WhenCtx; op: '==' | '!='; value: string };

/** Parse 1 lần lúc khai báo (không parse lại mỗi lần gọi `matches`) — biểu thức là string literal
 * cố định trong file này nên an toàn parse eager. */
function parseWhen(expr: string): Clause[] {
  return expr
    .split('&&')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^(\w+)\s*(==|!=)\s*(\S+)$/);
      if (!m) throw new Error(`when-parser: không đọc được mệnh đề "${part}" (chỉ hỗ trợ KEY==VALUE / KEY!=VALUE)`);
      return { key: m[1] as keyof WhenCtx, op: m[2] as '==' | '!=', value: m[3] };
    });
}

function evalClauses(clauses: Clause[], ctx: WhenCtx): boolean {
  return clauses.every(({ key, op, value }) => {
    const actual = ctx[key];
    const actualStr = actual === undefined ? 'undefined' : String(actual);
    return op === '==' ? actualStr === value : actualStr !== value;
  });
}

/** `when('stage==cad && proToolsAllowed==true')` → hàm predicate, dùng trực tiếp làm
 * `CommandDef.when`. Export để test parser độc lập (registry.test.ts) — dữ liệu COMMANDS thật
 * hiện chỉ dùng `==`, chưa có case `!=` nào, nên phải test qua `when()` trực tiếp mới phủ hết
 * cú pháp parser hỗ trợ. */
export function when(expr: string): (ctx: WhenCtx) => boolean {
  const clauses = parseWhen(expr);
  return (ctx: WhenCtx) => evalClauses(clauses, ctx);
}

const CAD_BASIC = when('stage==cad');
const CAD_PRO = when('stage==cad && proToolsAllowed==true');

/** Chọn CAD_PRO nếu toolId thuộc PRO_ONLY_TOOLS (lib/cad/store.ts), ngược lại CAD_BASIC — tránh
 * gõ tay đúng/sai cho từng dòng, một nguồn duy nhất (PRO_ONLY_TOOLS) quyết định. */
function gateFor(toolId: Tool): (ctx: WhenCtx) => boolean {
  return PRO_ONLY_TOOLS.has(toolId) ? CAD_PRO : CAD_BASIC;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Helper phát lệnh — mirror CHÍNH XÁC logic trong CadEditor.tsx run()'s map (dòng ~1586-1733),
// chỉ đổi chỗ đọc `arg`/`arg2` từ closure sang tham số `RunArgs`.
// ─────────────────────────────────────────────────────────────────────────────────────────────

const store = () => useCadStore.getState();

const num = (s: string | undefined): number | undefined => {
  if (!s) return undefined;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
};

/** Lệnh chỉ activate tool, không đọc đối số — đa số lệnh vẽ/biến đổi cơ bản. */
function activate(toolId: Tool): (args?: RunArgs) => void {
  return () => store().setTool(toolId);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Sổ lệnh — 55 CommandDef, gom đủ 97 alias của CAD_COMMANDS (xem commands.parity.test.ts).
// Thứ tự nhóm theo CadCommandGroup gốc: Vẽ · Kích thước & mặt cắt · Biến đổi · Nhìn · Chọn-xoá-
// hoàn tác — thứ tự trong nhóm giữ đúng thứ tự khai trong CAD_COMMANDS.
// ─────────────────────────────────────────────────────────────────────────────────────────────

// Test đối chiếu 1:1 với CAD_COMMANDS (không mất lệnh nào): lib/commands/registry.test.ts —
// chạy `node_modules/.bin/sucrase-node lib/commands/registry.test.ts`.
export const COMMANDS: CommandDef[] = [
  // ── Vẽ ──────────────────────────────────────────────────────────────────────────────────
  { id: 'cad.draw.line', label: ['Đường thẳng', 'Line'], aliases: ['L', 'LINE'], when: gateFor('line'), group: 'draw@1', surfaces: ['statusbar'], run: activate('line') },
  { id: 'cad.draw.polyline', label: ['Polyline', 'Polyline'], aliases: ['PL', 'PLINE'], when: gateFor('polyline'), group: 'draw@2', surfaces: ['statusbar'], run: activate('polyline') },
  { id: 'cad.draw.rect', label: ['Chữ nhật', 'Rectangle'], aliases: ['REC', 'RECT'], when: gateFor('rect'), group: 'draw@3', surfaces: ['statusbar'], run: activate('rect') },
  { id: 'cad.draw.circle', label: ['Đường tròn', 'Circle'], aliases: ['C', 'CIRCLE'], when: gateFor('circle'), group: 'draw@4', surfaces: ['statusbar'], run: activate('circle') },
  { id: 'cad.draw.circle3p', label: ['Đường tròn 3-điểm', 'Circle (3-point)'], aliases: ['C3P', 'CIRCLE3P'], when: gateFor('circle3p'), group: 'draw@5', surfaces: ['statusbar'], run: activate('circle3p') },
  { id: 'cad.draw.arc', label: ['Cung tròn (3 điểm)', 'Arc (3-point)'], aliases: ['A', 'ARC'], when: gateFor('arc'), group: 'draw@6', surfaces: ['statusbar'], run: activate('arc') },
  { id: 'cad.draw.arccenter', label: ['Cung tròn tâm+góc', 'Arc (center+angle)'], aliases: ['ARCC', 'ARCCENTER'], when: gateFor('arccenter'), group: 'draw@7', surfaces: ['statusbar'], run: activate('arccenter') },
  { id: 'cad.draw.text', label: ['Chữ', 'Text'], aliases: ['T', 'TEXT'], when: gateFor('text'), group: 'draw@8', surfaces: ['statusbar'], run: activate('text') },
  {
    id: 'cad.draw.wall', label: ['Tường (W 200)', 'Wall (W 200)'], aliases: ['W', 'WALL'], when: gateFor('wall'), group: 'draw@9', surfaces: ['statusbar'],
    run: (args = {}) => {
      const t = num(args.arg);
      if (t !== undefined) store().setWallThickness(t);
      store().setTool('wall');
    },
  },
  { id: 'cad.draw.room', label: ['Phòng', 'Room'], aliases: ['ROOM'], when: gateFor('room'), group: 'draw@10', surfaces: ['statusbar'], run: activate('room') },
  // D/DOOR, WIN/WINDOW: KHÔNG setTool — dùng setPendingBlock (khác cơ chế, xem CadEditor.tsx
  // comment gốc dòng ~608-611: "đi thẳng qua đây, KHÔNG qua setTool").
  { id: 'cad.draw.door', label: ['Cửa đi', 'Door'], aliases: ['D', 'DOOR'], when: CAD_BASIC, group: 'draw@11', surfaces: ['statusbar'], run: () => store().setPendingBlock('door') },
  { id: 'cad.draw.window', label: ['Cửa sổ', 'Window'], aliases: ['WIN', 'WINDOW'], when: CAD_BASIC, group: 'draw@12', surfaces: ['statusbar'], run: () => store().setPendingBlock('window') },
  {
    id: 'cad.draw.polygon', label: ['Polygon đều (POL 8 = đổi 8 cạnh)', 'Regular polygon (POL 8 = 8 sides)'], aliases: ['POL', 'POLYGON'], when: gateFor('polygon'), group: 'draw@13', surfaces: ['statusbar'],
    run: (args = {}) => {
      const n = num(args.arg);
      if (n !== undefined) store().setPolygonSides(n);
      store().setTool('polygon');
    },
  },
  { id: 'cad.draw.ellipse', label: ['Ellipse', 'Ellipse'], aliases: ['EL', 'ELLIPSE'], when: gateFor('ellipse'), group: 'draw@14', surfaces: ['statusbar'], run: activate('ellipse') },
  {
    id: 'cad.draw.donut', label: ['Donut (DO 50 150 = trong/ngoài)', 'Donut (DO 50 150 = inner/outer)'], aliases: ['DO', 'DONUT'], when: gateFor('donut'), group: 'draw@15', surfaces: ['statusbar'],
    run: (args = {}) => {
      const inner = num(args.arg);
      const outer = num(args.arg2);
      if (inner !== undefined && outer !== undefined) store().setDonutRadii(inner, outer);
      store().setTool('donut');
    },
  },
  { id: 'cad.draw.spline', label: ['Spline', 'Spline'], aliases: ['SPL', 'SPLINE'], when: gateFor('spline'), group: 'draw@16', surfaces: ['statusbar'], run: activate('spline') },
  { id: 'cad.draw.xline', label: ['Xline — đường tham chiếu vô hạn', 'Xline — infinite construction line'], aliases: ['XL', 'XLINE'], when: gateFor('xline'), group: 'draw@17', surfaces: ['statusbar'], run: activate('xline') },
  { id: 'cad.draw.zone', label: ['Zone — tô vùng chức năng mặt bằng', 'Zone — functional area fill'], aliases: ['ZONE'], when: gateFor('zone'), group: 'draw@18', surfaces: ['statusbar'], run: activate('zone') },
  { id: 'cad.draw.arrow', label: ['Arrow — mũi tên luồng giao thông', 'Arrow — circulation flow'], aliases: ['AW', 'ARROW'], when: gateFor('arrow'), group: 'draw@19', surfaces: ['statusbar'], run: activate('arrow') },

  // ── Kích thước & mặt cắt ────────────────────────────────────────────────────────────────
  // DIM + DAL: 2 label khác nhau trong CAD_COMMANDS ("Ghi kích thước"/"Kích thước thẳng") nhưng
  // CÙNG dispatch setTool('dimension') — gộp 1 CommandDef, 2 alias (xem docstring đầu file).
  { id: 'cad.dim.linear', label: ['Ghi kích thước', 'Dimension'], aliases: ['DIM', 'DAL'], when: gateFor('dimension'), group: 'dim@1', surfaces: ['statusbar'], run: activate('dimension') },
  { id: 'cad.dim.measure', label: ['Đo khoảng cách', 'Measure distance'], aliases: ['DI'], when: gateFor('measure'), group: 'dim@2', surfaces: ['statusbar'], run: activate('measure') },
  { id: 'cad.dim.radius', label: ['Kích thước bán kính', 'Radius dimension'], aliases: ['DRA'], when: gateFor('dimradius'), group: 'dim@3', surfaces: ['statusbar'], run: activate('dimradius') },
  { id: 'cad.dim.diameter', label: ['Kích thước đường kính', 'Diameter dimension'], aliases: ['DDI'], when: gateFor('dimdiameter'), group: 'dim@4', surfaces: ['statusbar'], run: activate('dimdiameter') },
  { id: 'cad.dim.angular', label: ['Kích thước góc', 'Angular dimension'], aliases: ['DAN'], when: gateFor('dimangular'), group: 'dim@5', surfaces: ['statusbar'], run: activate('dimangular') },
  { id: 'cad.dim.continue', label: ['Kích thước nối tiếp', 'Continue dimension'], aliases: ['DCO'], when: gateFor('dimcontinue'), group: 'dim@6', surfaces: ['statusbar'], run: activate('dimcontinue') },
  { id: 'cad.dim.baseline', label: ['Kích thước baseline', 'Baseline dimension'], aliases: ['DBA'], when: gateFor('dimbaseline'), group: 'dim@7', surfaces: ['statusbar'], run: activate('dimbaseline') },
  // DIMTXT/DIMASZ/DIMSCALE: KHÔNG setTool — chỉnh DimStyle trực tiếp, chỉ có ý nghĩa khi gõ kèm
  // số (vd "DIMTXT 150"), không đổi gì nếu gọi không đối số → không hợp dock/palette (không có
  // chỗ nhập số), chỉ khai 'statusbar'.
  {
    id: 'cad.dim.textsize', label: ['Cỡ chữ kích thước', 'Dimension text size'], aliases: ['DIMTXT'], when: CAD_BASIC, group: 'dim@8', surfaces: ['statusbar'],
    run: (args = {}) => { const n = num(args.arg); if (n !== undefined) store().setDimStyle({ textHeight: n }); },
  },
  {
    id: 'cad.dim.arrowsize', label: ['Cỡ mũi tên', 'Dimension arrow size'], aliases: ['DIMASZ'], when: CAD_BASIC, group: 'dim@9', surfaces: ['statusbar'],
    run: (args = {}) => { const n = num(args.arg); if (n !== undefined) store().setDimStyle({ arrowSize: n }); },
  },
  {
    id: 'cad.dim.scale', label: ['Tỉ lệ dim', 'Dimension scale'], aliases: ['DIMSCALE'], when: CAD_BASIC, group: 'dim@10', surfaces: ['statusbar'],
    run: (args = {}) => { const n = num(args.arg); if (n !== undefined) store().setDimStyle({ dimScale: n }); },
  },
  {
    id: 'cad.hatch.apply', label: ['Mặt cắt (H ANSI31 20)', 'Hatch (H ANSI31 20)'], aliases: ['H', 'HATCH'], when: gateFor('hatch'), group: 'dim@11', surfaces: ['statusbar'],
    run: (args = {}) => {
      const patterns: HatchPattern[] = ['SOLID', 'ANSI31', 'ANSI32', 'ANSI37', 'DOTS'];
      const found = patterns.find((p) => p === args.arg?.toUpperCase());
      if (found) store().setHatchPattern(found);
      const scale = num(args.arg2);
      if (scale !== undefined) store().setHatchScale(scale);
      store().setTool('hatch');
    },
  },
  {
    id: 'cad.hatch.angle', label: ['Góc hatch', 'Hatch angle'], aliases: ['HANGLE'], when: CAD_BASIC, group: 'dim@12', surfaces: ['statusbar'],
    run: (args = {}) => { const n = num(args.arg); if (n !== undefined) store().setHatchAngle(n); },
  },

  // ── Biến đổi ────────────────────────────────────────────────────────────────────────────
  { id: 'cad.edit.move', label: ['Di chuyển', 'Move'], aliases: ['M', 'MOVE'], when: gateFor('move'), group: 'edit@1', surfaces: ['statusbar'], run: activate('move') },
  { id: 'cad.edit.copy', label: ['Sao chép', 'Copy'], aliases: ['CO', 'COPY'], when: gateFor('copy'), group: 'edit@2', surfaces: ['statusbar'], run: activate('copy') },
  { id: 'cad.edit.rotate', label: ['Xoay', 'Rotate'], aliases: ['RO', 'ROTATE'], when: gateFor('rotate'), group: 'edit@3', surfaces: ['statusbar'], run: activate('rotate') },
  { id: 'cad.edit.mirror', label: ['Đối xứng', 'Mirror'], aliases: ['MI', 'MIRROR'], when: gateFor('mirror'), group: 'edit@4', surfaces: ['statusbar'], run: activate('mirror') },
  {
    id: 'cad.edit.offset', label: ['Offset (O 150)', 'Offset (O 150)'], aliases: ['O', 'OFFSET'], when: gateFor('offset'), group: 'edit@5', surfaces: ['statusbar'],
    run: (args = {}) => {
      const d = num(args.arg);
      if (d !== undefined) store().setOffsetDist(d);
      store().setTool('offset');
    },
  },
  { id: 'cad.edit.trim', label: ['Cắt (trim)', 'Trim'], aliases: ['TR', 'TRIM'], when: gateFor('trim'), group: 'edit@6', surfaces: ['statusbar'], run: activate('trim') },
  { id: 'cad.edit.extend', label: ['Kéo dài (extend)', 'Extend'], aliases: ['EX', 'EXTEND'], when: gateFor('extend'), group: 'edit@7', surfaces: ['statusbar'], run: activate('extend') },
  {
    id: 'cad.edit.fillet', label: ['Bo góc (F 50)', 'Fillet (F 50)'], aliases: ['F', 'FILLET'], when: gateFor('fillet'), group: 'edit@8', surfaces: ['statusbar'],
    // Cảnh báo: KHÔNG gán key:['F'] — phím 'F' rời (không gõ) đã là Zoom Extents (xem
    // cad.view.zoomextents + docstring đầu file).
    run: (args = {}) => {
      const r = num(args.arg);
      if (r !== undefined) store().setFilletRadius(r);
      store().setTool('fillet');
    },
  },
  {
    id: 'cad.edit.chamfer', label: ['Vát góc (CHA 30 30)', 'Chamfer (CHA 30 30)'], aliases: ['CHA', 'CHAMFER'], when: gateFor('chamfer'), group: 'edit@9', surfaces: ['statusbar'],
    run: (args = {}) => {
      const d1 = num(args.arg);
      const d2 = num(args.arg2) ?? d1;
      if (d1 !== undefined) store().setChamferDist(d1, d2 ?? d1);
      store().setTool('chamfer');
    },
  },
  { id: 'cad.edit.arrayrect', label: ['Mảng chữ nhật', 'Rectangular array'], aliases: ['AR', 'ARRAY'], when: gateFor('arrayrect'), group: 'edit@10', surfaces: ['statusbar'], run: activate('arrayrect') },
  { id: 'cad.edit.arraypolar', label: ['Mảng tròn', 'Polar array'], aliases: ['ARP', 'ARRAYPOLAR'], when: gateFor('arraypolar'), group: 'edit@11', surfaces: ['statusbar'], run: activate('arraypolar') },
  { id: 'cad.edit.scale', label: ['Tỉ lệ (scale)', 'Scale'], aliases: ['SC', 'SCALE'], when: gateFor('scale'), group: 'edit@12', surfaces: ['statusbar'], run: activate('scale') },
  { id: 'cad.edit.stretch', label: ['Kéo giãn (stretch)', 'Stretch'], aliases: ['S', 'STRETCH'], when: gateFor('stretch'), group: 'edit@13', surfaces: ['statusbar'], run: activate('stretch') },
  { id: 'cad.edit.break', label: ['Ngắt (break)', 'Break'], aliases: ['BR', 'BREAK'], when: gateFor('break'), group: 'edit@14', surfaces: ['statusbar'], run: activate('break') },
  { id: 'cad.edit.join', label: ['Nối (join)', 'Join'], aliases: ['J', 'JOIN'], when: gateFor('join'), group: 'edit@15', surfaces: ['statusbar'], run: activate('join') },
  { id: 'cad.edit.explode', label: ['Phá khối (explode)', 'Explode'], aliases: ['X', 'EXPLODE'], when: gateFor('explode'), group: 'edit@16', surfaces: ['statusbar'], run: activate('explode') },
  {
    id: 'cad.edit.lengthen', label: ['Đổi chiều dài (LEN 100)', 'Lengthen (LEN 100)'], aliases: ['LEN', 'LENGTHEN'], when: gateFor('lengthen'), group: 'edit@17', surfaces: ['statusbar'],
    run: (args = {}) => {
      const d = num(args.arg);
      if (d !== undefined) store().setLengthenDelta(d);
      store().setTool('lengthen');
    },
  },
  { id: 'cad.edit.divide', label: ['Divide/Measure — click đối tượng rồi nhập', 'Divide/Measure — click object then enter N'], aliases: ['DIV', 'DIVIDE'], when: gateFor('divide'), group: 'edit@18', surfaces: ['statusbar'], run: activate('divide') },

  // ── Nhìn ────────────────────────────────────────────────────────────────────────────────
  {
    id: 'cad.view.polar', label: ['Polar tracking', 'Polar tracking'], aliases: ['POLAR'], when: CAD_BASIC, group: 'view@1', surfaces: ['statusbar'],
    run: (args = {}) => {
      const step = num(args.arg);
      if (step !== undefined) {
        store().setPolarStep(step);
        store().setPolarTracking(true);
      } else {
        store().setPolarTracking(!store().polarTracking);
      }
    },
  },
  {
    id: 'cad.view.zoomextents', label: ['Zoom Extents', 'Zoom extents'], aliases: ['EXT', 'Z'], key: ['F'], when: CAD_BASIC, group: 'view@2', surfaces: ['statusbar', 'shortcut'],
    run: () => window.dispatchEvent(new CustomEvent('cad:zoom-extents')),
  },

  // ── Chọn, xoá, hoàn tác ─────────────────────────────────────────────────────────────────
  { id: 'cad.sel.select', label: ['Chọn', 'Select'], aliases: ['SEL'], when: CAD_BASIC, group: 'sel@1', surfaces: ['statusbar'], run: activate('select') },
  { id: 'cad.sel.delete', label: ['Xoá', 'Delete'], aliases: ['E', 'DEL', 'ERASE'], key: ['Delete'], when: CAD_BASIC, group: 'sel@2', surfaces: ['statusbar', 'shortcut'], run: () => store().deleteSelected() },
  { id: 'cad.sel.undo', label: ['Hoàn tác', 'Undo'], aliases: ['U', 'UNDO'], key: ['mod', 'Z'], when: CAD_BASIC, group: 'sel@3', surfaces: ['statusbar', 'shortcut'], run: () => store().undo() },
  { id: 'cad.sel.redo', label: ['Làm lại', 'Redo'], aliases: ['RE', 'REDO'], key: ['mod', 'shift', 'Z'], when: CAD_BASIC, group: 'sel@4', surfaces: ['statusbar', 'shortcut'], run: () => store().redo() },
];

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Selector cho các mặt hiện — spec §2 Trụ 2 gọi đây là `cmdsFor(ctx)`.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** Lệnh khớp `ctx` hiện tại, lọc theo `when`. Dùng chung cho mọi mặt — mặt nào cần thêm lọc theo
 * `surfaces` thì tự `.filter(c => c.surfaces.includes('dock'))` phía sau, KHÔNG nhân bản logic
 * when ở đây (một nguồn duy nhất). */
export function cmdsFor(ctx: WhenCtx): CommandDef[] {
  return COMMANDS.filter((c) => c.when(ctx));
}

/** Tra theo alias gõ tay (HOA) — dùng thay `matchCommands()`/map cũ trong CadEditor.tsx khi
 * bước sau nối registry vào status-bar thật.
 *
 * `ctx` là tham số BẮT BUỘC (A1, phiếu 03/08) — TRƯỚC đây hàm này khớp alias xong trả về
 * NGAY, không lọc qua `cmd.when(ctx)` như `cmdsFor()` đã làm đúng. Hệ quả: gõ 1 alias Pro-only
 * (vd 'F'/Fillet, 'OFFSET') vẫn chạy được dù đang ở Sketch mode (`proToolsAllowed=false`) —
 * đúng lỗ hổng chặn việc thêm LỆNH 3D: khi sổ lệnh có thêm entry `when: stage==render`, gõ 1
 * alias trùng chữ ở màn 2D (stage==cad) đáng lẽ phải KHÔNG khớp thì vẫn lọt qua vì hàm chưa hề
 * nhìn tới `ctx`. Bắt buộc `ctx` (không phải optional) để không ai vô tình gọi lại kiểu cũ —
 * mọi lời gọi PHẢI tự hỏi "đang ở ngữ cảnh nào" trước khi tra alias, giống `cmdsFor(ctx)`. */
export function findByAlias(raw: string, ctx: WhenCtx): CommandDef | undefined {
  const c = raw.trim().toUpperCase();
  const found = COMMANDS.find((cmd) => cmd.aliases.includes(c));
  if (!found) return undefined;
  return found.when(ctx) ? found : undefined;
}

/** Toàn bộ alias đã khai — dùng cho test đối chiếu 1:1 với CAD_COMMANDS (không mất lệnh nào). */
export function allAliases(): string[] {
  return COMMANDS.flatMap((c) => c.aliases);
}

// Tự-kiểm khi module nạp (dev-time, rẻ) — KHÔNG throw ra ngoài module (tránh vỡ import ở nơi
// khác nếu có sai sót nhỏ), chỉ cảnh báo console; test thật ở commands.parity.test.ts.
if (process.env.NODE_ENV !== 'production') {
  const sourceCount = CAD_COMMANDS.length;
  const registryCount = allAliases().length;
  if (sourceCount !== registryCount) {
    // eslint-disable-next-line no-console
    console.warn(
      `[lib/commands/registry] LỆCH SỐ ALIAS: CAD_COMMANDS có ${sourceCount}, registry gom ${registryCount}. ` +
        'Chạy lib/commands/registry.test.ts để biết chính xác alias nào thiếu/thừa.',
    );
  }
}

/**
 * TODO (bước sau, KHÔNG thuộc việc này — chỉ ghi lại để không quên):
 * 1. Nối CadEditor.tsx's run() gọi `findByAlias()` + `.run({arg,arg2})` thay vì tự giữ `map`
 *    object riêng — xoá trùng lặp logic dispatch. Rủi ro: phải test kỹ KHÔNG đổi hành vi status-
 *    bar hiện tại (autocomplete, gợi ý lỗi "Lệnh không rõ…" liệt kê alias).
 * 2. Khi có UI dock/palette/contextmenu thật (SPEC-HA-TANG-UI-IF §5 bước 4-5), gán `surfaces`
 *    + `icon` cho từng lệnh theo quyết định thiết kế của Hoà — KHÔNG đoán ở đây.
 * 3. `WhenCtx.stage`/`mode` hiện chưa có nơi gọi thật nào truyền vào (AppShell/Trụ 1 chưa xây) —
 *    khi xây, nhớ đối chiếu giá trị 'cad'/'render'/'present' cho khớp Trụ 1 thật, không tự đặt
 *    tên khác.
 */
