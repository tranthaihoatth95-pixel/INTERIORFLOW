/**
 * lib/scope-core.test.ts — chạy: node_modules/.bin/sucrase-node lib/scope-core.test.ts
 */
import assert from 'node:assert';
import {
  parseScope,
  pickStableRouteId,
  parseStageRoute,
  stageRoutePath,
  stageSegmentForPhase,
  resolveFlowForRouteId,
  storeMatchesRouteId,
  isStageSegment,
  LEGACY_STAGE_ROUTE,
} from './scope-core';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
}

// ── parseScope ───────────────────────────────────────────────────────────────
test('global khi pathname rỗng/null', () => {
  assert.deepStrictEqual(parseScope(null), { scope: 'global', projectId: null });
  assert.deepStrictEqual(parseScope(''), { scope: 'global', projectId: null });
  assert.deepStrictEqual(parseScope('/'), { scope: 'global', projectId: null });
});

test('global cho route không phải /projects', () => {
  assert.strictEqual(parseScope('/cad-editor').scope, 'global');
  assert.strictEqual(parseScope('/settings/avatar').scope, 'global');
  assert.strictEqual(parseScope('/present').scope, 'global');
});

test('project + id cho /projects/[id] và các sub-route', () => {
  assert.deepStrictEqual(parseScope('/projects/abc123'), { scope: 'project', projectId: 'abc123' });
  assert.deepStrictEqual(parseScope('/projects/abc123/overview'), { scope: 'project', projectId: 'abc123' });
  assert.deepStrictEqual(parseScope('/projects/abc123/notebook'), { scope: 'project', projectId: 'abc123' });
});

test('bỏ query/hash, giải mã id', () => {
  assert.strictEqual(parseScope('/projects/xyz?tab=1').projectId, 'xyz');
  assert.strictEqual(parseScope('/projects/xyz#top').projectId, 'xyz');
  assert.strictEqual(parseScope('/projects/a%20b').projectId, 'a b');
});

test('/projects không có id → global (không vỡ)', () => {
  assert.strictEqual(parseScope('/projects').scope, 'global');
  assert.strictEqual(parseScope('/projects/').scope, 'global');
});

// ── pickStableRouteId ────────────────────────────────────────────────────────
test('ưu tiên Project.id, rồi Flow.id, rồi fallback', () => {
  assert.strictEqual(pickStableRouteId('proj1', 'flow1'), 'proj1');
  assert.strictEqual(pickStableRouteId(null, 'flow1'), 'flow1');
  assert.strictEqual(pickStableRouteId(null, null), 'default');
  assert.strictEqual(pickStableRouteId(undefined, undefined, 'fb'), 'fb');
  assert.strictEqual(pickStableRouteId('', ''), 'default'); // chuỗi rỗng không phải id
});

// ══ Task #21 (ĐỔ NỀN 1B) — chặng dưới /projects/[id]/… ══════════════════════

// ── stageRoutePath / parseStageRoute (khứ hồi) ───────────────────────────────
test('stageRoutePath dựng đúng đường dẫn 4 chặng', () => {
  assert.strictEqual(stageRoutePath('p1', 'cad'), '/projects/p1/cad');
  assert.strictEqual(stageRoutePath('p1', 'render'), '/projects/p1/render');
  assert.strictEqual(stageRoutePath('p1', 'present'), '/projects/p1/present');
  assert.strictEqual(stageRoutePath('p1', 'photo'), '/projects/p1/photo');
  assert.strictEqual(stageRoutePath('a b', 'cad'), '/projects/a%20b/cad'); // id lạ được encode
});

test('parseStageRoute bóc đúng { projectId, stage }', () => {
  assert.deepStrictEqual(parseStageRoute('/projects/p1/cad'), { projectId: 'p1', stage: 'cad' });
  assert.deepStrictEqual(parseStageRoute('/projects/p1/render?x=1'), { projectId: 'p1', stage: 'render' });
  assert.deepStrictEqual(parseStageRoute('/projects/a%20b/photo'), { projectId: 'a b', stage: 'photo' });
});

test('parseStageRoute null cho route KHÔNG phải chặng scope dự án', () => {
  assert.strictEqual(parseStageRoute('/projects/p1/overview'), null);
  assert.strictEqual(parseStageRoute('/projects/p1/notebook'), null);
  assert.strictEqual(parseStageRoute('/projects/p1'), null);
  assert.strictEqual(parseStageRoute('/cad-editor'), null); // route cũ, không phải scope
  assert.strictEqual(parseStageRoute('/'), null);
  assert.strictEqual(parseStageRoute(null), null);
});

test('khứ hồi stageRoutePath → parseStageRoute giữ nguyên id (kể cả ký tự lạ)', () => {
  for (const id of ['p1', 'cku8x9', 'a b', 'dự-án/1']) {
    // encode ở stageRoutePath + decode ở parseStageRoute phải khôi phục NGUYÊN VĂN id
    assert.deepStrictEqual(parseStageRoute(stageRoutePath(id, 'present')), {
      projectId: id,
      stage: 'present',
    });
  }
});

test('isStageSegment + LEGACY_STAGE_ROUTE khớp bộ 4 chặng', () => {
  assert.ok(isStageSegment('cad') && isStageSegment('render'));
  assert.ok(!isStageSegment('overview') && !isStageSegment('') && !isStageSegment(null));
  assert.strictEqual(LEGACY_STAGE_ROUTE.cad, '/cad-editor');
  assert.strictEqual(LEGACY_STAGE_ROUTE.render, '/');
  assert.strictEqual(LEGACY_STAGE_ROUTE.present, '/present-editor');
  assert.strictEqual(LEGACY_STAGE_ROUTE.photo, '/photo-editor');
});

test("stageSegmentForPhase: 'concept' → 'cad' (id phase cũ giữ nguyên)", () => {
  assert.strictEqual(stageSegmentForPhase('concept'), 'cad');
  assert.strictEqual(stageSegmentForPhase('render'), 'render');
  assert.strictEqual(stageSegmentForPhase('present'), 'present');
});

// ── resolveFlowForRouteId — CHỐNG LẪN DỮ LIỆU GIỮA 2 DỰ ÁN ───────────────────
const FLOWS = [
  { id: 'fA1', projectId: 'pA' },
  { id: 'fA2', projectId: 'pA' },
  { id: 'fB1', projectId: 'pB' },
  { id: 'fSolo', projectId: null },
];

test('routeId = Project.id → flow của ĐÚNG dự án đó', () => {
  assert.strictEqual(resolveFlowForRouteId('pA', FLOWS), 'fA1');
  assert.strictEqual(resolveFlowForRouteId('pB', FLOWS), 'fB1');
});

test('routeId = Flow.id (flow chưa gán dự án) → chính flow đó', () => {
  assert.strictEqual(resolveFlowForRouteId('fSolo', FLOWS), 'fSolo');
  assert.strictEqual(resolveFlowForRouteId('fA2', FLOWS), 'fA2');
});

test('id lạ / rỗng / danh sách trống → null (caller phải DỌN canvas, không giữ dự án cũ)', () => {
  assert.strictEqual(resolveFlowForRouteId('không-tồn-tại', FLOWS), null);
  assert.strictEqual(resolveFlowForRouteId('', FLOWS), null);
  assert.strictEqual(resolveFlowForRouteId('pA', []), null);
});

test('ưu tiên khớp DỰ ÁN trước khớp Flow.id (id dự án không bị flow cùng tên chiếm)', () => {
  const tricky = [
    { id: 'x', projectId: null },
    { id: 'fX', projectId: 'x' },
  ];
  assert.strictEqual(resolveFlowForRouteId('x', tricky), 'fX');
});

// ── storeMatchesRouteId — bỏ qua vòng đồng bộ khi đã đúng dự án ──────────────
test('khớp qua currentProjectId hoặc currentFlowId', () => {
  assert.ok(storeMatchesRouteId('pA', 'pA', 'fA1'));
  assert.ok(storeMatchesRouteId('fSolo', null, 'fSolo'));
  assert.ok(!storeMatchesRouteId('pB', 'pA', 'fA1')); // dự án khác → PHẢI đồng bộ lại
  assert.ok(!storeMatchesRouteId('pA', null, null)); // store rỗng → PHẢI nạp
  assert.ok(!storeMatchesRouteId('', null, null));
});

console.log(`\n${passed} passed`);
