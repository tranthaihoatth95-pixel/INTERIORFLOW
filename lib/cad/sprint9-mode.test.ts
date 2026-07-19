/**
 * lib/cad/sprint9-mode.test.ts — Sprint 9: toggle Sketch↔Pro (useCadStore.cadMode/setCadMode +
 * PRO_ONLY_TOOLS). Chạy: node_modules/.bin/sucrase-node lib/cad/sprint9-mode.test.ts
 */
import { useCadStore, PRO_ONLY_TOOLS } from './store';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function testDefaultMode() {
  console.log('\n[1] Mặc định là Sketch (đúng triết lý Phase 1, user đã khoá quyết định)');
  ok('cadMode mặc định = sketch', useCadStore.getState().cadMode === 'sketch');
}

function testToggle() {
  console.log('\n[2] setCadMode chuyển qua lại đúng');
  useCadStore.getState().setCadMode('pro');
  ok('chuyển sang pro', useCadStore.getState().cadMode === 'pro');
  useCadStore.getState().setCadMode('sketch');
  ok('chuyển lại sketch', useCadStore.getState().cadMode === 'sketch');
}

function testProToolResetOnSwitchToSketch() {
  console.log('\n[3] Đang ở 1 tool Pro-only mà chuyển về Sketch → tool tự trả về select');
  useCadStore.getState().setCadMode('pro');
  useCadStore.getState().setTool('fillet');
  ok('tool đang là fillet (pro-only)', useCadStore.getState().tool === 'fillet');
  useCadStore.getState().setCadMode('sketch');
  ok('chuyển Sketch → tool tự về select', useCadStore.getState().tool === 'select');

  // Tool KHÔNG phải pro-only (vd line) thì giữ nguyên khi chuyển mode, không bị reset oan.
  useCadStore.getState().setCadMode('pro');
  useCadStore.getState().setTool('line');
  useCadStore.getState().setCadMode('sketch');
  ok('tool sketch-safe (line) KHÔNG bị reset khi chuyển mode', useCadStore.getState().tool === 'line');
}

function testProOnlyToolsSet() {
  console.log('\n[4] PRO_ONLY_TOOLS chứa đúng nhóm công cụ CAD chính xác, KHÔNG chứa công cụ sketch cơ bản');
  const mustBePro: string[] = [
    'offset', 'trim', 'extend', 'fillet', 'chamfer', 'arrayrect', 'arraypolar',
    'scale', 'stretch', 'break', 'join', 'explode', 'lengthen',
    'dimension', 'dimradius', 'dimdiameter', 'dimangular', 'dimcontinue', 'dimbaseline',
    'polyline', 'circle3p', 'arc', 'arccenter', 'polygon', 'ellipse', 'donut', 'spline', 'xline', 'divide',
  ];
  for (const t of mustBePro) {
    ok(`${t} là Pro-only`, PRO_ONLY_TOOLS.has(t as never));
  }
  const mustBeSketch: string[] = ['select', 'line', 'rect', 'circle', 'wall', 'room', 'move', 'copy', 'rotate', 'mirror', 'text', 'measure', 'markup', 'hatch'];
  for (const t of mustBeSketch) {
    ok(`${t} KHÔNG phải Pro-only (luôn hiện ở Sketch)`, !PRO_ONLY_TOOLS.has(t as never));
  }
}

/** Ortho (F8) / Dynamic Input (F12) đã dời từ ref nội bộ CadCanvas LÊN STORE, để cụm nút cảm ứng
 * của Sketch (CadTouchDock) bật/tắt CÙNG trạng thái với phím tắt — trước đó chỉ bàn phím vật lý
 * mới chạm tới được 2 công tắc này. Test khoá đúng phần hợp đồng đó. */
function testTouchToggles() {
  console.log('\n[5] Ortho/Dynamic Input nằm ở store (nút cảm ứng + phím tắt dùng chung trạng thái)');
  const s = useCadStore.getState();
  ok('orthoLock mặc định = tắt (giống thói quen AutoCAD mới mở)', s.orthoLock === false);
  ok('dynInput mặc định = BẬT (HUD số cạnh con trỏ)', s.dynInput === true);

  useCadStore.getState().setOrthoLock(true);
  ok('setOrthoLock(true) → orthoLock bật', useCadStore.getState().orthoLock === true);
  useCadStore.getState().setOrthoLock(false);
  ok('setOrthoLock(false) → orthoLock tắt', useCadStore.getState().orthoLock === false);

  useCadStore.getState().setDynInput(false);
  ok('setDynInput(false) → dynInput tắt', useCadStore.getState().dynInput === false);
  useCadStore.getState().setDynInput(true);
  ok('setDynInput(true) → dynInput bật lại', useCadStore.getState().dynInput === true);

  // 2 công tắc này là thiết lập vẽ, KHÔNG phải công cụ → phải sống qua mọi lần đổi mode,
  // nếu không thì mỗi lần bấm Sketch↔Pro người dùng lại mất trạng thái Ortho đang bật.
  useCadStore.getState().setOrthoLock(true);
  useCadStore.getState().setCadMode('pro');
  useCadStore.getState().setCadMode('sketch');
  ok('orthoLock giữ nguyên khi chuyển Sketch↔Pro', useCadStore.getState().orthoLock === true);
  useCadStore.getState().setOrthoLock(false);
}

testDefaultMode();
testToggle();
testProToolResetOnSwitchToSketch();
testProOnlyToolsSet();
testTouchToggles();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
