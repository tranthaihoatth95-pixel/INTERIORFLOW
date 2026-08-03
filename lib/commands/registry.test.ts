/**
 * lib/commands/registry.test.ts — kiểm Sổ lệnh (Trụ 2, SPEC-HA-TANG-UI-IF §2 §5 bước 2).
 *
 * 4 nhóm: [1] đối chiếu alias 1:1 với CAD_COMMANDS (không mất lệnh nào, không bịa alias),
 * [2] parser `when` (==, !=, &&, thiếu key), [3] `cmdsFor` selector (gate Pro đúng theo
 * PRO_ONLY_TOOLS thật), [4] `run()` — spot-check từng KIỂU dispatch (activate thường / arg-
 * preseed / pendingBlock / config-only / action trực tiếp) đối chiếu store thật, KHÔNG mock.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/commands/registry.test.ts
 */
import { COMMANDS, cmdsFor, findByAlias, allAliases, when } from './registry';
import { CAD_COMMANDS } from '../cad/command-aliases';
import { useCadStore, PRO_ONLY_TOOLS } from '../cad/store';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/* ── 1) Đối chiếu alias — không mất lệnh nào, không bịa alias ────────────── */
function testParity() {
  console.log('\n[1] Đối chiếu alias registry ↔ CAD_COMMANDS');

  const sourceAliases = CAD_COMMANDS.map((c) => c.cmd);
  const sourceSet = new Set(sourceAliases);
  const registryAliases = allAliases();
  const registrySet = new Set(registryAliases);

  ok(`số alias khớp (nguồn ${sourceAliases.length}, registry ${registryAliases.length})`, sourceAliases.length === registryAliases.length);
  ok('registry không trùng alias (mỗi alias chỉ 1 CommandDef)', registryAliases.length === registrySet.size);

  const missing = sourceAliases.filter((a) => !registrySet.has(a));
  const invented = registryAliases.filter((a) => !sourceSet.has(a));
  ok(`không thiếu alias nào (thiếu: ${missing.join(',') || 'none'})`, missing.length === 0);
  ok(`không bịa alias nào ngoài CAD_COMMANDS (bịa: ${invented.join(',') || 'none'})`, invented.length === 0);

  ok('mọi CommandDef.id duy nhất', new Set(COMMANDS.map((c) => c.id)).size === COMMANDS.length);
  ok('mọi CommandDef có ít nhất 1 alias', COMMANDS.every((c) => c.aliases.length > 0));
  ok('mọi CommandDef có label [vi,en] không rỗng', COMMANDS.every((c) => c.label[0].length > 0 && c.label[1].length > 0));
  ok('mọi CommandDef có surfaces không rỗng', COMMANDS.every((c) => c.surfaces.length > 0));
}

/* ── 2) Parser `when` — ==, !=, &&, thiếu key ─────────────────────────────── */
function testWhenParser() {
  console.log('\n[2] Parser when() — không eval, chỉ ==/!=/&&');

  ok("'stage==cad' đúng khi stage='cad'", when('stage==cad')({ stage: 'cad' }));
  ok("'stage==cad' sai khi stage='render'", !when('stage==cad')({ stage: 'render' }));
  ok("'stage!=cad' sai khi stage='cad'", !when('stage!=cad')({ stage: 'cad' }));
  ok("'stage!=cad' đúng khi stage='render'", when('stage!=cad')({ stage: 'render' }));

  ok(
    "'stage==cad && mode!=revit' đúng khi cad+sketch",
    when('stage==cad && mode!=revit')({ stage: 'cad', mode: 'sketch' }),
  );
  ok(
    "'stage==cad && mode!=revit' sai khi cad+revit (đúng ví dụ spec Trụ 2)",
    !when('stage==cad && mode!=revit')({ stage: 'cad', mode: 'revit' }),
  );
  ok(
    "'stage==cad && mode!=revit' sai khi render+sketch (mệnh đề đầu fail)",
    !when('stage==cad && mode!=revit')({ stage: 'render', mode: 'sketch' }),
  );

  // key vắng mặt trong ctx → so với 'undefined' (string) — != phải đúng, == phải sai.
  ok("'proToolsAllowed==true' sai khi ctx không có field đó", !when('proToolsAllowed==true')({ stage: 'cad' }));
  ok("'proToolsAllowed!=true' đúng khi ctx không có field đó", when('proToolsAllowed!=true')({ stage: 'cad' }));

  ok('parser ném lỗi rõ ràng khi cú pháp sai (không âm thầm nuốt lỗi)', (() => {
    try { when('stage ~~ cad'); return false; } catch { return true; }
  })());
}

/* ── 3) cmdsFor — gate Pro đúng theo PRO_ONLY_TOOLS thật ──────────────────── */
function testCmdsFor() {
  console.log('\n[3] cmdsFor(ctx) — lọc theo when, gate Pro khớp PRO_ONLY_TOOLS thật');

  const basicOnly = cmdsFor({ stage: 'cad' });
  const withPro = cmdsFor({ stage: 'cad', proToolsAllowed: true });
  const wrongStage = cmdsFor({ stage: 'render' });

  ok('stage khác cad → rỗng (mọi lệnh CAD đều when stage==cad)', wrongStage.length === 0);
  ok('cad + không Pro → CHỨA line (tool cơ bản)', basicOnly.some((c) => c.id === 'cad.draw.line'));
  ok('cad + không Pro → KHÔNG chứa polyline (tool Pro, PRO_ONLY_TOOLS có "polyline")', !basicOnly.some((c) => c.id === 'cad.draw.polyline'));
  ok('cad + proToolsAllowed=true → CHỨA polyline', withPro.some((c) => c.id === 'cad.draw.polyline'));
  ok('cad + proToolsAllowed=true vẫn CHỨA line (Pro là siêu tập, không thay thế cơ bản)', withPro.some((c) => c.id === 'cad.draw.line'));

  // Đối chiếu ĐÚNG danh sách PRO_ONLY_TOOLS thật — mọi CommandDef có gateFor=CAD_PRO phải map
  // sang 1 Tool nằm trong PRO_ONLY_TOOLS, và ngược lại mọi CommandDef gateFor=CAD_BASIC map
  // sang Tool KHÔNG nằm trong đó (trừ door/window/select/undo/redo/delete/zoomextents/polar —
  // các lệnh này không có "tool 1-1" theo nghĩa PRO_ONLY_TOOLS xét, bỏ qua khi so).
  const toolIdOfCommand: Record<string, string | undefined> = {
    'cad.draw.line': 'line', 'cad.draw.polyline': 'polyline', 'cad.draw.rect': 'rect',
    'cad.draw.circle': 'circle', 'cad.draw.circle3p': 'circle3p', 'cad.draw.arc': 'arc',
    'cad.draw.arccenter': 'arccenter', 'cad.draw.text': 'text', 'cad.draw.wall': 'wall',
    'cad.draw.room': 'room', 'cad.draw.polygon': 'polygon', 'cad.draw.ellipse': 'ellipse',
    'cad.draw.donut': 'donut', 'cad.draw.spline': 'spline', 'cad.draw.xline': 'xline',
    'cad.draw.zone': 'zone', 'cad.draw.arrow': 'arrow',
    'cad.dim.linear': 'dimension', 'cad.dim.measure': 'measure', 'cad.dim.radius': 'dimradius',
    'cad.dim.diameter': 'dimdiameter', 'cad.dim.angular': 'dimangular', 'cad.dim.continue': 'dimcontinue',
    'cad.dim.baseline': 'dimbaseline', 'cad.hatch.apply': 'hatch',
    'cad.edit.move': 'move', 'cad.edit.copy': 'copy', 'cad.edit.rotate': 'rotate',
    'cad.edit.mirror': 'mirror', 'cad.edit.offset': 'offset', 'cad.edit.trim': 'trim',
    'cad.edit.extend': 'extend', 'cad.edit.fillet': 'fillet', 'cad.edit.chamfer': 'chamfer',
    'cad.edit.arrayrect': 'arrayrect', 'cad.edit.arraypolar': 'arraypolar', 'cad.edit.scale': 'scale',
    'cad.edit.stretch': 'stretch', 'cad.edit.break': 'break', 'cad.edit.join': 'join',
    'cad.edit.explode': 'explode', 'cad.edit.lengthen': 'lengthen', 'cad.edit.divide': 'divide',
  };
  let gateMismatch = 0;
  for (const cmd of COMMANDS) {
    const toolId = toolIdOfCommand[cmd.id];
    if (!toolId) continue;
    const shouldBePro = PRO_ONLY_TOOLS.has(toolId as never);
    const isGatedPro = cmd.when({ stage: 'cad', proToolsAllowed: false }) === false && cmd.when({ stage: 'cad', proToolsAllowed: true }) === true;
    if (shouldBePro !== isGatedPro) {
      gateMismatch += 1;
      console.log(`    lệch gate: ${cmd.id} (tool=${toolId}) PRO_ONLY_TOOLS=${shouldBePro} nhưng registry gate Pro=${isGatedPro}`);
    }
  }
  ok(`gate Pro của mọi lệnh khớp PRO_ONLY_TOOLS thật (${Object.keys(toolIdOfCommand).length} lệnh đối chiếu)`, gateMismatch === 0);
}

/* ── 4) findByAlias ───────────────────────────────────────────────────────── */
const CAD_CTX = { stage: 'cad' };
const CAD_PRO_CTX = { stage: 'cad', proToolsAllowed: true };

function testFindByAlias() {
  console.log('\n[4] findByAlias — khớp alias thật, không phân biệt hoa/thường đầu vào');

  ok("'L' → cad.draw.line", findByAlias('L', CAD_CTX)?.id === 'cad.draw.line');
  ok("'line' (thường) → cad.draw.line", findByAlias('line', CAD_CTX)?.id === 'cad.draw.line');
  ok("'  W  ' (khoảng trắng thừa) → cad.draw.wall", findByAlias('  W  ', CAD_CTX)?.id === 'cad.draw.wall');
  ok("'DAL' → cad.dim.linear (gộp cùng DIM)", findByAlias('DAL', CAD_PRO_CTX)?.id === 'cad.dim.linear');
  ok("'OFFSET' → cad.edit.offset (gộp cùng O)", findByAlias('OFFSET', CAD_PRO_CTX)?.id === 'cad.edit.offset');
  ok("alias không tồn tại → undefined", findByAlias('KHONGTONTAI', CAD_CTX) === undefined);

  // A1 (phiếu 03/08) — regression đúng cái BUG đã vá: TRƯỚC đây findByAlias khớp alias xong trả
  // về NGAY, không lọc qua `when(ctx)` như `cmdsFor` — gõ 1 alias Pro-only vẫn chạy được ở
  // Sketch mode (proToolsAllowed=false), và alias của lệnh CAD vẫn khớp dù `stage` không phải
  // 'cad' (chặn việc thêm lệnh 3D: 1 alias trùng chữ khai `when: stage==render` sẽ lẫn với CAD).
  ok("'F' (Fillet, Pro-only) → undefined khi stage=cad NHƯNG proToolsAllowed=false (Sketch)", findByAlias('F', { stage: 'cad', proToolsAllowed: false }) === undefined);
  ok("'F' (Fillet, Pro-only) → khớp khi proToolsAllowed=true (Pro mode)", findByAlias('F', CAD_PRO_CTX)?.id === 'cad.edit.fillet');
  ok("'L' (lệnh CAD cơ bản) → undefined khi stage KHÁC 'cad' (render/present)", findByAlias('L', { stage: 'render' }) === undefined);
  ok("'L' → vẫn khớp bình thường khi đúng stage='cad' (không Pro cũng đủ, line không phải Pro-only)", findByAlias('L', CAD_CTX)?.id === 'cad.draw.line');
}

/* ── 5) run() — spot-check từng kiểu dispatch, đối chiếu store thật ───────── */
function testRun() {
  console.log('\n[5] run() — đối chiếu useCadStore thật (không mock)');

  const reset = () => useCadStore.getState().setTool('select');

  reset();
  findByAlias('L', CAD_PRO_CTX)!.run();
  ok("activate thường: 'L' → tool='line'", useCadStore.getState().tool === 'line');

  reset();
  findByAlias('W', CAD_PRO_CTX)!.run({ arg: '250' });
  ok("arg-preseed: 'W 250' → wallThickness=250", useCadStore.getState().wallThickness === 250);
  ok("arg-preseed: 'W 250' → tool='wall'", useCadStore.getState().tool === 'wall');

  reset();
  const wallBefore = useCadStore.getState().wallThickness;
  findByAlias('WALL', CAD_PRO_CTX)!.run(); // không đối số → giữ nguyên wallThickness, chỉ đổi tool
  ok("'WALL' không đối số → wallThickness không đổi", useCadStore.getState().wallThickness === wallBefore);
  ok("'WALL' không đối số → tool='wall'", useCadStore.getState().tool === 'wall');

  reset();
  findByAlias('F', CAD_PRO_CTX)!.run({ arg: '50' });
  ok("'F 50' → filletRadius=50, tool='fillet'", useCadStore.getState().filletRadius === 50 && useCadStore.getState().tool === 'fillet');

  reset();
  findByAlias('CHA', CAD_PRO_CTX)!.run({ arg: '30', arg2: '20' });
  ok("'CHA 30 20' → chamferD1=30, chamferD2=20 (2 giá trị khác nhau)", useCadStore.getState().chamferD1 === 30 && useCadStore.getState().chamferD2 === 20);
  reset();
  findByAlias('CHA', CAD_PRO_CTX)!.run({ arg: '15' });
  ok("'CHA 15' (thiếu arg2) → chamferD1=chamferD2=15 (mirror đúng logic gốc CadEditor.tsx)", useCadStore.getState().chamferD1 === 15 && useCadStore.getState().chamferD2 === 15);

  reset();
  findByAlias('H', CAD_PRO_CTX)!.run({ arg: 'ansi32', arg2: '2.5' });
  ok("'H ansi32 2.5' → hatchPattern=ANSI32 (không phân biệt hoa/thường)", useCadStore.getState().hatchPattern === 'ANSI32');
  ok("'H ansi32 2.5' → hatchScale=2.5", useCadStore.getState().hatchScale === 2.5);

  reset();
  findByAlias('POL', CAD_PRO_CTX)!.run({ arg: '6' });
  ok("'POL 6' → polygonSides=6", useCadStore.getState().polygonSides === 6);

  reset();
  findByAlias('DO', CAD_PRO_CTX)!.run({ arg: '50', arg2: '150' });
  ok("'DO 50 150' → donutInnerR=50, donutOuterR=150", useCadStore.getState().donutInnerR === 50 && useCadStore.getState().donutOuterR === 150);

  reset();
  findByAlias('LEN', CAD_PRO_CTX)!.run({ arg: '100' });
  ok("'LEN 100' → lengthenDelta=100", useCadStore.getState().lengthenDelta === 100);

  // pendingBlock — run() KHÔNG gọi setTool trực tiếp, nhưng setPendingBlock() trong store TỰ
  // đổi tool sang 'block' (store.ts dòng ~611-616, cố ý — cho status-bar phản hồi rõ khi vào
  // chế độ đặt block, xem comment gốc tại đó). Test đối chiếu ĐÚNG hành vi thật này.
  reset();
  findByAlias('D', CAD_PRO_CTX)!.run();
  ok("'D' (door) → pendingBlock='door', tool đổi sang 'block' (side-effect cố ý của store)", useCadStore.getState().pendingBlock === 'door' && useCadStore.getState().tool === 'block');
  findByAlias('WIN', CAD_PRO_CTX)!.run();
  ok("'WIN' → pendingBlock='window'", useCadStore.getState().pendingBlock === 'window');
  useCadStore.getState().setPendingBlock(null);

  // config-only — KHÔNG setTool.
  reset();
  const dimStyleBefore = useCadStore.getState().dimStyle;
  findByAlias('DIMTXT', CAD_PRO_CTX)!.run({ arg: '150' });
  ok("'DIMTXT 150' → dimStyle.textHeight=150, arrowSize/dimScale không đổi", useCadStore.getState().dimStyle.textHeight === 150 && useCadStore.getState().dimStyle.arrowSize === dimStyleBefore.arrowSize);
  ok("'DIMTXT 150' → tool KHÔNG đổi", useCadStore.getState().tool === 'select');
  findByAlias('DIMASZ', CAD_PRO_CTX)!.run({ arg: '90' });
  ok("'DIMASZ 90' → dimStyle.arrowSize=90", useCadStore.getState().dimStyle.arrowSize === 90);
  findByAlias('DIMSCALE', CAD_PRO_CTX)!.run({ arg: '1.5' });
  ok("'DIMSCALE 1.5' → dimStyle.dimScale=1.5", useCadStore.getState().dimStyle.dimScale === 1.5);
  findByAlias('HANGLE', CAD_PRO_CTX)!.run({ arg: '45' });
  ok("'HANGLE 45' → hatchAngle=45", useCadStore.getState().hatchAngle === 45);

  // POLAR — 2 nhánh: có arg → set step + bật; không arg → toggle.
  useCadStore.getState().setPolarTracking(false);
  findByAlias('POLAR', CAD_PRO_CTX)!.run({ arg: '15' });
  ok("'POLAR 15' → polarStep=15, polarTracking=true", useCadStore.getState().polarStep === 15 && useCadStore.getState().polarTracking === true);
  const trackingBefore = useCadStore.getState().polarTracking;
  findByAlias('POLAR', CAD_PRO_CTX)!.run();
  ok("'POLAR' không đối số → toggle polarTracking", useCadStore.getState().polarTracking === !trackingBefore);

  // Action trực tiếp — undo/redo/delete không throw khi gọi trên state trống.
  ok('undo() không throw khi past rỗng', (() => { try { findByAlias('U', CAD_PRO_CTX)!.run(); return true; } catch { return false; } })());
  ok('redo() không throw khi future rỗng', (() => { try { findByAlias('RE', CAD_PRO_CTX)!.run(); return true; } catch { return false; } })());
  ok('delete() không throw khi selection rỗng', (() => { try { findByAlias('E', CAD_PRO_CTX)!.run(); return true; } catch { return false; } })());

  // Zoom Extents — dispatch CustomEvent thật trên window (stub tối thiểu, Node không có window).
  const events: string[] = [];
  (globalThis as { window?: unknown }).window = {
    dispatchEvent: (e: { type: string }) => { events.push(e.type); return true; },
    CustomEvent: (globalThis as { CustomEvent?: unknown }).CustomEvent,
  };
  // CustomEvent cũng không có sẵn trong Node thuần — stub tối thiểu đủ dùng ở đây.
  (globalThis as { CustomEvent?: new (type: string) => { type: string } }).CustomEvent =
    (globalThis as { CustomEvent?: new (type: string) => { type: string } }).CustomEvent ??
    (class { type: string; constructor(type: string) { this.type = type; } } as unknown as new (type: string) => { type: string });
  findByAlias('Z', CAD_PRO_CTX)!.run();
  ok("'Z' → dispatch CustomEvent 'cad:zoom-extents' lên window", events.includes('cad:zoom-extents'));

  reset();
}

testParity();
testWhenParser();
testCmdsFor();
testFindByAlias();
testRun();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
