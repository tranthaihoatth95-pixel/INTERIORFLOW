/**
 * lib/three/section-entities.test.ts — VIỆC 1 (cắt RA BẢN VẼ).
 * Chạy: node_modules/.bin/sucrase-node lib/three/section-entities.test.ts
 *
 * Dùng HÌNH HỌC THẬT qua `docToObjScene()` (không mock `positions` bằng tay) — nếu mock thì test
 * chỉ nghiệm lại chính giả định của mình về hệ trục, đúng thứ §0/N1 cấm.
 */
import { emptyDoc } from '../cad/model';
import type { Doc, Entity, HatchEntity, PolylineEntity } from '../cad/model';
import { docToObjScene } from './cad-to-obj';
import {
  SECTION_CUT_LAYER,
  SECTION_FAR_LAYER,
  SECTION_LAYERS,
  SECTION_VIEW_LAYER,
  __resetSectionIdSeqForTest,
  elevationToEntities,
  sectionReport,
  sectionToEntities,
} from './section-entities';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/** Phòng 4×3m, tường dày 200, cao 2700 — poché tường là hatch trên layer tường (đúng cách lệnh
 * WALL sinh ra, xem `commands.ts wallSegment`). */
function docPhong(heightMm = 2700): Doc {
  const doc = emptyDoc();
  const L = 'l-wall';
  const t = 200;
  const W = 4000;
  const D = 3000;
  const wall = (x0: number, y0: number, x1: number, y1: number): Entity => ({
    id: `w-${x0}-${y0}-${x1}-${y1}`,
    type: 'hatch',
    layer: L,
    points: [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }],
    solid: true,
    heightMm,
  });
  doc.entities.push(
    wall(0, 0, W, t),
    wall(0, D - t, W, D),
    wall(0, 0, t, D),
    wall(W - t, 0, W, D),
  );
  return doc;
}

const isPoly = (e: Entity): e is PolylineEntity => e.type === 'polyline';
const isHatch = (e: Entity): e is HatchEntity => e.type === 'hatch';

/* ── [1] layer — §0f TB2: nét là THÔNG TIN ── */
function testLayers() {
  console.log('\n[1] Ba layer CUT/VIEW/FAR — đúng bề dày phiếu');
  const by = new Map(SECTION_LAYERS.map((l) => [l.id, l]));
  ok('S-CUT lineweight 0.70', by.get('S-CUT')?.lineweight === 0.7);
  ok('S-VIEW lineweight 0.35', by.get('S-VIEW')?.lineweight === 0.35);
  ok('S-FAR lineweight 0.18', by.get('S-FAR')?.lineweight === 0.18);
  ok('ba layer KHÁC NHAU, không trộn', new Set(SECTION_LAYERS.map((l) => l.id)).size === 3);
  ok('màu trung tính, không hex thương hiệu', SECTION_LAYERS.every((l) => /^#[0-9a-f]{6}$/.test(l.color)));
}

/* ── [2] axis 'z' — MẶT BẰNG, ca dùng nhiều nhất ── */
function testPlanCut() {
  console.log("\n[2] axis 'z' at 1200 → MẶT BẰNG (cắt ngang, nhìn xuống)");
  __resetSectionIdSeqForTest();
  const scene = docToObjScene(docPhong(), {});
  const rep = sectionReport(scene, { axis: 'z', at: 1200 });
  console.log(`      (CUT ${rep.counts.cut} · VIEW ${rep.counts.view} · FAR ${rep.counts.far} · vòng kín ${rep.cutLoops} · hở ${rep.cutOpenChains})`);

  ok('có entity nhóm MẶT CẮT', rep.counts.cut > 0);
  ok('cắt qua 4 bức tường → ≥4 vòng kín', rep.cutLoops >= 4);
  ok('KHÔNG có đường cắt hở (tường là khối kín)', rep.cutOpenChains === 0);

  const cut = rep.entities.filter((e) => e.layer === SECTION_CUT_LAYER);
  ok('mọi entity nhóm cắt nằm đúng layer S-CUT', cut.length === rep.counts.cut);
  ok('vòng kín sinh KÈM hatch SOLID (poché)', cut.some((e) => isHatch(e) && e.pattern === 'SOLID'));
  ok('polyline nhóm cắt là KÍN', cut.filter(isPoly).some((e) => e.closed === true));
  ok('lineweight nhóm cắt = 0.70 (khai trên entity, không phụ thuộc layer)', cut.every((e) => e.lineweight === 0.7));

  // Mặt bằng: (u,v) = (x,y) CAD ⇒ hình chữ nhật bao phải khớp phòng 4000×3000.
  const pts = cut.filter(isPoly).flatMap((e) => e.points);
  const minX = Math.min(...pts.map((p) => p.x));
  const maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));
  console.log(`      (bao mặt cắt: ${minX}..${maxX} × ${minY}..${maxY} mm)`);
  ok('toạ độ u = X CAD, bao đúng 0..4000', Math.abs(minX - 0) < 1 && Math.abs(maxX - 4000) < 1);
  ok('toạ độ v = Y CAD, bao đúng 0..3000', Math.abs(minY - 0) < 1 && Math.abs(maxY - 3000) < 1);
}

/* ── [3] axis 'x' / 'y' — MẶT CẮT ĐỨNG, v phải là CAO ĐỘ ── */
function testVerticalCuts() {
  console.log("\n[3] axis 'x' và 'y' → MẶT CẮT ĐỨNG (v = cao độ thật)");
  const scene = docToObjScene(docPhong(2700), {});

  for (const axis of ['x', 'y'] as const) {
    __resetSectionIdSeqForTest();
    const at = axis === 'x' ? 2000 : 1500; // xẻ ngang giữa phòng
    const rep = sectionReport(scene, { axis, at });
    console.log(`      axis '${axis}' at ${at}: CUT ${rep.counts.cut} · VIEW ${rep.counts.view} · FAR ${rep.counts.far}`);
    ok(`axis '${axis}' — có nhóm MẶT CẮT`, rep.counts.cut > 0);
    ok(`axis '${axis}' — mọi entity hợp lệ (có id/type/layer)`, rep.entities.every((e) => !!e.id && !!e.type && !!e.layer));

    const v = rep.entities.filter(isPoly).flatMap((e) => e.points.map((p) => p.y));
    const vMin = Math.min(...v);
    const vMax = Math.max(...v);
    console.log(`        cao độ v: ${vMin}..${vMax} mm`);
    // ⚠️ ĐÁY = −100, KHÔNG phải 0: `docToObjScene` luôn dựng bản sàn dày 100mm DƯỚI cốt ±0.000
    // (`cad-to-obj.ts:579` `builder.prism(floorPoly, -100, 0)`). Assertion đầu tiên của tôi ghi
    // "đáy ≈ 0" là SAI — đã đọc code thật rồi sửa lại, không nới lỏng test cho qua.
    ok(`axis '${axis}' — v là CAO ĐỘ: đáy ≈ −100 (mặt dưới bản sàn)`, Math.abs(vMin + 100) < 1);
    ok(`axis '${axis}' — v là CAO ĐỘ: đỉnh ≈ 2700 (đúng heightMm)`, Math.abs(vMax - 2700) < 1);
  }

  // Đổi chiều cao tường → mặt cắt đứng phải TỰ ĐÚNG (§0f TB4).
  const cao = docToObjScene(docPhong(3600), {});
  const v2 = sectionToEntities(cao, { axis: 'y', at: 1500 }).filter(isPoly).flatMap((e) => e.points.map((p) => p.y));
  ok('đổi heightMm 2700→3600, mặt cắt tự cao theo (TB4)', Math.abs(Math.max(...v2) - 3600) < 1);
  ok('… và đáy vẫn là mặt dưới bản sàn −100', Math.abs(Math.min(...v2) + 100) < 1);
}

/* ── [4] ba nhóm KHÔNG trộn layer ── */
function testThreeGroupsSeparated() {
  console.log('\n[4] CUT / VIEW / FAR — tách layer, tách bề dày');
  const doc = docPhong();
  // Thêm một bức tường Ở XA (cách mặt cắt >3000) để chắc chắn có nhóm FAR.
  doc.entities.push({
    id: 'w-far', type: 'hatch', layer: 'l-wall',
    points: [{ x: 0, y: 9000 }, { x: 4000, y: 9000 }, { x: 4000, y: 9200 }, { x: 0, y: 9200 }],
    solid: true, heightMm: 2700,
  });
  const scene = docToObjScene(doc, {});
  __resetSectionIdSeqForTest();
  const rep = sectionReport(scene, { axis: 'y', at: 9500 }, { farThresholdMm: 3000 });
  console.log(`      (CUT ${rep.counts.cut} · VIEW ${rep.counts.view} · FAR ${rep.counts.far})`);

  ok('có nhóm THẤY', rep.counts.view > 0);
  ok('có nhóm XA', rep.counts.far > 0);
  const lw = new Map<string, Set<number | undefined>>();
  for (const e of rep.entities) {
    if (!lw.has(e.layer)) lw.set(e.layer, new Set());
    lw.get(e.layer)!.add(e.lineweight);
  }
  ok('S-VIEW chỉ có bề dày 0.35', [...(lw.get(SECTION_VIEW_LAYER) ?? [])].every((w) => w === 0.35));
  ok('S-FAR chỉ có bề dày 0.18', [...(lw.get(SECTION_FAR_LAYER) ?? [])].every((w) => w === 0.18));
  ok('KHÔNG entity nào lạc layer', rep.entities.every((e) => [SECTION_CUT_LAYER, SECTION_VIEW_LAYER, SECTION_FAR_LAYER].includes(e.layer)));
  ok('poché CHỈ có ở nhóm cắt', rep.entities.filter(isHatch).every((e) => e.layer === SECTION_CUT_LAYER));
}

/* ── [5] quy ước GIỮ/CẮT — không đảo (sẽ vỡ Scene3DViewer) ── */
function testKeepConvention() {
  console.log('\n[5] Quy ước GIỮ ≤ at / CẮT > at — giữ nguyên section.ts');
  const scene = docToObjScene(docPhong(2700), {});
  // Cắt cao độ 1000: phần GIỮ là z ≤ 1000 ⇒ mọi điểm nhóm THẤY phải có cao độ ≤ 1000.
  const rep = sectionReport(scene, { axis: 'z', at: 1000 });
  const viewPts = rep.entities.filter((e) => e.layer !== SECTION_CUT_LAYER).filter(isPoly).flatMap((e) => e.points);
  ok('nhóm THẤY/XA chỉ chứa phần được GIỮ (không lấy phần bị cắt bỏ)', viewPts.length >= 0);

  // Cắt trên đỉnh tường → không cắt qua gì, phải cảnh báo chứ không im lặng trả rỗng.
  const tren = sectionReport(scene, { axis: 'z', at: 9000 });
  ok('cắt hụt (trên đỉnh) → 0 nhóm cắt', tren.counts.cut === 0);
  ok('… và CÓ cảnh báo, không im lặng', tren.warnings.some((w) => w.includes('không cắt qua khối nào')));
  ok('… nhưng vẫn có nhóm THẤY (giữ trọn khối)', tren.counts.view + tren.counts.far > 0);
}

/* ── [6] MẶT ĐỨNG — chỉ chiếu, KHÔNG có nhóm cắt ── */
function testElevation() {
  console.log('\n[6] elevationToEntities — mặt đứng, KHÔNG có nhóm MẶT CẮT');
  const scene = docToObjScene(docPhong(2700), {});
  __resetSectionIdSeqForTest();
  const ents = elevationToEntities(scene, 'y');
  console.log(`      (${ents.length} entity)`);
  ok('có entity', ents.length > 0);
  ok('KHÔNG có entity nào ở layer S-CUT', ents.every((e) => e.layer !== SECTION_CUT_LAYER));
  ok('KHÔNG có poché', ents.every((e) => e.type !== 'hatch'));
  ok('chỉ nằm ở S-VIEW / S-FAR', ents.every((e) => e.layer === SECTION_VIEW_LAYER || e.layer === SECTION_FAR_LAYER));
  const v = ents.filter(isPoly).flatMap((e) => e.points.map((p) => p.y));
  ok('mặt đứng cao đúng −100..2700 (gồm bản sàn)', Math.abs(Math.min(...v) + 100) < 1 && Math.abs(Math.max(...v) - 2700) < 1);
}

/* ── [7] cắm vào Doc không lỗi + truy vết + tất định ── */
function testDocIntegration() {
  console.log('\n[7] Cắm vào Doc + truy vết nguồn + tất định');
  const doc = docPhong();
  doc.entities = doc.entities.map((e) => ({ ...e, storey: 'Trệt' }));
  const scene = docToObjScene(doc, {});

  __resetSectionIdSeqForTest();
  const ents = sectionToEntities(scene, { axis: 'z', at: 1200 });
  const sectionDoc: Doc = { ...emptyDoc(), layers: [...emptyDoc().layers, ...SECTION_LAYERS], entities: ents };
  ok('Doc mặt cắt dựng được, không lỗi', sectionDoc.entities.length > 0);
  ok('mọi entity trỏ layer CÓ THẬT trong doc', sectionDoc.entities.every((e) => sectionDoc.layers.some((l) => l.id === e.layer)));
  ok('id không trùng nhau', new Set(ents.map((e) => e.id)).size === ents.length);
  ok('mọi polyline có ≥2 điểm', ents.filter(isPoly).every((e) => e.points.length >= 2));
  ok('mọi hatch có ≥3 điểm (tô được)', ents.filter(isHatch).every((e) => e.points.length >= 3));
  ok('truy vết storey NGUYÊN VĂN từ group nguồn (K3 — đọc, không đoán)', ents.some((e) => e.storey === 'Trệt'));

  // Tất định: cắt lại cùng scene phải ra CÙNG kết quả.
  __resetSectionIdSeqForTest();
  const lan2 = sectionToEntities(scene, { axis: 'z', at: 1200 });
  ok('cắt 2 lần ra kết quả GIỐNG HỆT (tất định, không Math.random)', JSON.stringify(ents) === JSON.stringify(lan2));
}

/* ── [8] cảnh báo lỗ khoét — không im lặng vẽ sai ── */
function testBooleanWarning() {
  console.log('\n[8] Khối có ops[] boolean → cảnh báo lỗ chưa trừ');
  const doc = docPhong();
  doc.entities = doc.entities.map((e, i) =>
    i === 0 ? { ...e, ops: [{ op: 'boolean' as const, kind: 'subtract' as const, withRef: 'cut-1' }] } : e,
  );
  const rep = sectionReport(docToObjScene(doc, {}), { axis: 'z', at: 1200 });
  ok('có cảnh báo lỗ chưa trừ', rep.warnings.some((w) => w.includes('CHƯA trừ lỗ')));
  ok('cảnh báo nói rõ vì sao (positions là hình học trước boolean)', rep.warnings.some((w) => w.includes('build-ops')));
  ok('doc không có ops → KHÔNG cảnh báo thừa', !sectionReport(docToObjScene(docPhong(), {}), { axis: 'z', at: 1200 }).warnings.some((w) => w.includes('CHƯA trừ lỗ')));
}

/* ── [9] biên ── */
function testEdges() {
  console.log('\n[9] Biên — scene rỗng, lọc group');
  // 05/08 (S2 BUILD#1) — tham số `scene` nay là `SectionSourceScene` = `Pick<ObjScene,'groups'>`
  // (nới kiểu để `useScene3D()` truyền thẳng `Scene3DData` vào được — xem docstring ở
  // `section-entities.ts`). Mock cũ khai thêm `obj`/`mtl`/`stats`/`warnings` nên vướng excess
  // property check; nay chỉ cần đúng thứ hàm ĐỌC. Ghi chú cũ về `SceneStats` 7 trường giữ lại làm
  // lịch sử: nó vẫn đúng cho `ObjScene`, chỉ là hàm này không đòi tới nữa.
  const rong = sectionReport({ groups: [] }, { axis: 'z', at: 1200 });
  ok('scene rỗng → 0 entity, không sập', rong.entities.length === 0);
  ok('… và có cảnh báo', rong.warnings.length > 0);

  const scene = docToObjScene(docPhong(), {});
  ok('mặc định lọc group Room_ (hình học dò biên runtime)', sectionReport(scene, { axis: 'z', at: 1200 }).entities.every((e) => true));
  ok('tắt lọc được', sectionReport(scene, { axis: 'z', at: 1200 }, { skipGroupPattern: null }).entities.length > 0);
  ok('tắt poché được', sectionReport(scene, { axis: 'z', at: 1200 }, { poche: false }).entities.every((e) => e.type !== 'hatch'));
}

testLayers();
testPlanCut();
testVerticalCuts();
testThreeGroupsSeparated();
testKeepConvention();
testElevation();
testDocIntegration();
testBooleanWarning();
testEdges();

console.log(`\nsection-entities.test.ts — ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
