/**
 * lib/three/cad-to-obj-levels.test.ts — VIỆC 1 (S2 BUILD#1, 05/08): `computeHeights()` đã NỐI vào
 * đường dựng khối.
 *
 * TRƯỚC PHIÊN NÀY: `cad-to-obj.ts:637` là `builder.prism(h.points, 0, wallH)` — hằng số 0. Tức mọi
 * cấu kiện đứng ở cốt ±0.000 bất kể khai `Level`/`baseConstraint` gì ⇒ nhà nhiều tầng chồng lên
 * nhau. `lib/cad/levels.ts` đã tính đúng đáy/đỉnh từ lâu (test `levels.test.ts` 75/75) nhưng
 * `grep computeHeights lib/three/cad-to-obj.ts` = 0 dòng.
 *
 * File riêng (không nhét vào `cad-to-obj.test.ts`) để 1 fail CŨ đã biết ở đó — "group nội thất
 * mang đúng entityId" — không lẫn với kết quả việc này.
 *
 * §0h — dữ liệu HƯ CẤU hoàn toàn: 1 phòng 4×3m, tầng 2 ở cốt 3300. Không số liệu dự án khách nào.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/three/cad-to-obj-levels.test.ts
 */
import type { Doc, Entity, Level } from '../cad/model';
import { DEFAULT_LAYERS } from '../cad/model';
import { wallChain } from '../cad/commands';
import { docToObjScene, type SceneGroup } from './cad-to-obj';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const CORNERS = [
  { x: 0, y: 0 },
  { x: 4000, y: 0 },
  { x: 4000, y: 3000 },
  { x: 0, y: 3000 },
];
const OPTS = { wallHeightMm: 2700, theme: 'warm' as const };

function baseDoc(extra: Entity[] = [], levels?: Level[]): Doc {
  return {
    entities: [...wallChain(CORNERS, 200, 'l-wall', true), ...extra],
    layers: DEFAULT_LAYERS.map((l) => ({ ...l })),
    ...(levels ? { levels } : {}),
  };
}

/** min/max cao độ (three.y, mét) của 1 group — đọc từ hình học THẬT, không tin metadata. */
function yRange(g: SceneGroup): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 1; i < g.positions.length; i += 3) {
    const v = g.positions[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max };
}
const walls = (d: Doc) => docToObjScene(d, OPTS).groups.filter((g) => g.name.startsWith('Wall_'));

/* ───────── [1] TƯƠNG THÍCH NGƯỢC — doc chưa khai tầng phải ra Y HỆT trước ───────── */
console.log('[1] Doc KHÔNG có Level — mọi thứ vẫn đứng cốt 0 (không đổi một pixel)');
{
  const ws = walls(baseDoc());
  ok('có dựng được tường', ws.length > 0);
  ok('đáy mọi tường = 0.000m', ws.every((g) => Math.abs(yRange(g).min) < 1e-9));
  ok('đỉnh mọi tường = 2.700m (mặc định scene)', ws.every((g) => Math.abs(yRange(g).max - 2.7) < 1e-9));
  ok('KHÔNG ghi baseMm khi đứng cốt 0 (không làm phình group bản vẽ 1 tầng)', ws.every((g) => g.baseMm === undefined));
  ok('scene không cảnh báo gì thêm', !docToObjScene(baseDoc(), OPTS).warnings.some((w) => w.includes('tầng')));
}

/* ───────── [2] CÓ TẦNG — tường lên đúng cốt ───────── */
console.log('\n[2] Tường gắn Level cốt 3300 — đứng ĐÚNG tầng 2, không nằm dưới đất');
{
  const levels: Level[] = [
    { id: 'lv-gf', name: 'Trệt', elevationMm: 0, order: 0 },
    { id: 'lv-l1', name: 'Lầu 1', elevationMm: 3300, order: 1 },
  ];
  const doc = baseDoc([], levels);
  // ⚠️ `wallChain` trả XEN KẼ hatch(poché) + polyline(nét) — chia theo chỉ số chẵn/lẻ là trúng
  // ĐÚNG 4 hatch, tức cả 4 tường lên lầu 1 và không còn tường nào ở trệt để so. Phải chia theo
  // thứ tự HATCH (chỉ hatch mới thành `Wall_i`, xem `wallHatches` trong cad-to-obj.ts).
  let hatchSeen = 0;
  const ents = doc.entities.map((e) => {
    if (e.type !== 'hatch') return e;
    hatchSeen += 1;
    return hatchSeen <= 2 ? { ...e, levelId: 'lv-l1' } : e; // 2 tường lên lầu, 2 tường ở trệt
  });
  const ws = walls({ ...doc, entities: ents });

  const tren = ws.filter((g) => (g.baseMm ?? 0) > 0);
  const duoi = ws.filter((g) => (g.baseMm ?? 0) === 0);
  ok('có tường ở CẢ hai cốt trong cùng 1 scene', tren.length > 0 && duoi.length > 0);
  ok('tường lầu 1: đáy = 3.300m', tren.every((g) => Math.abs(yRange(g).min - 3.3) < 1e-9));
  ok('tường lầu 1: đỉnh = 3.300 + 2.700 = 6.000m', tren.every((g) => Math.abs(yRange(g).max - 6.0) < 1e-9));
  ok('tường trệt KHÔNG bị đẩy theo — vẫn đáy 0', duoi.every((g) => Math.abs(yRange(g).min) < 1e-9));
  ok('group lầu 1 mang baseMm = 3300 (nơi tiêu thụ: push-pull Scene3DViewer)', tren.every((g) => g.baseMm === 3300));
  ok('heightMm vẫn là CHIỀU CAO, không phải cao độ đỉnh', tren.every((g) => g.heightMm === 2700));
}

/* ───────── [3] baseConstraint — cốt tầng + độ lệch ───────── */
console.log('\n[3] baseConstraint (tầng + offset) — cộng đủ cả hai, không nuốt offset');
{
  const levels: Level[] = [{ id: 'lv-l1', name: 'Lầu 1', elevationMm: 3300, order: 1 }];
  const doc = baseDoc([], levels);
  const ents = doc.entities.map((e) => ({ ...e, baseConstraint: { levelId: 'lv-l1', offsetMm: 150 } }));
  const ws = walls({ ...doc, entities: ents });
  ok('đáy = 3300 + 150 = 3.450m', ws.every((g) => Math.abs(yRange(g).min - 3.45) < 1e-9));
  ok('baseMm ghi đúng 3450', ws.every((g) => g.baseMm === 3450));
}

/* ───────── [4] TẦNG ĐÃ XOÁ (danglingLevelIds) — KHÔNG nuốt ───────── */
console.log('\n[4] Cấu kiện trỏ vào tầng đã xoá — dựng ở cốt lùi + CẢNH BÁO (không im lặng)');
{
  const doc = baseDoc([], [{ id: 'lv-gf', name: 'Trệt', elevationMm: 0, order: 0 }]);
  const ents = doc.entities.map((e) => ({ ...e, levelId: 'lv-DA-XOA' }));
  const scene = docToObjScene({ ...doc, entities: ents }, OPTS);
  const ws = scene.groups.filter((g) => g.name.startsWith('Wall_'));

  ok('VẪN dựng được (không sập, không mất tường)', ws.length > 0);
  ok('lùi về cốt 0 theo bậc lùi của computeHeights', ws.every((g) => Math.abs(yRange(g).min) < 1e-9));
  const w = scene.warnings.filter((x) => x.includes('tầng đã xoá'));
  ok('CÓ cảnh báo đẩy lên UI', w.length > 0);
  ok('cảnh báo nêu đích danh id tầng hỏng', w.every((x) => x.includes('lv-DA-XOA')));
  ok('cảnh báo nói rõ đã dựng ở cốt nào', w.every((x) => x.includes('cốt 0mm')));
}

/* ───────── [5] SUY BIẾN — đỉnh thấp hơn đáy ───────── */
console.log('\n[5] Tầng đỉnh THẤP HƠN tầng đáy — không dựng khối lộn ngược, phải nói thật');
{
  const levels: Level[] = [
    { id: 'lv-cao', name: 'Cao', elevationMm: 3300, order: 1 },
    { id: 'lv-thap', name: 'Thấp', elevationMm: 1000, order: 0 },
  ];
  const doc = baseDoc([], levels);
  const ents = doc.entities.map((e) => ({
    ...e,
    baseConstraint: { levelId: 'lv-cao', offsetMm: 0 },
    topConstraint: { levelId: 'lv-thap', offsetMm: 0 },
  }));
  const scene = docToObjScene({ ...doc, entities: ents }, OPTS);
  const ws = scene.groups.filter((g) => g.name.startsWith('Wall_'));

  ok('KHÔNG có khối chiều cao âm (đỉnh luôn > đáy)', ws.every((g) => yRange(g).max > yRange(g).min));
  ok('rơi về cao mặc định 2700 (3.300 → 6.000m)', ws.every((g) => Math.abs(yRange(g).max - yRange(g).min - 2.7) < 1e-9));
  ok('CÓ cảnh báo suy biến', scene.warnings.some((x) => x.includes('thấp hơn hoặc bằng tầng đáy')));
}

/* ───────── [6] NỘI THẤT theo tầng ───────── */
console.log('\n[6] Nội thất trên tầng 2 — đứng trên sàn tầng đó, không rơi xuống trệt');
{
  const levels: Level[] = [{ id: 'lv-l1', name: 'Lầu 1', elevationMm: 3300, order: 1 }];
  const sofa: Entity = { id: 'b1', type: 'block', layer: 'l-furniture', block: 'sofa2', at: { x: 1200, y: 800 }, rot: 0, sx: 1, sy: 1, levelId: 'lv-l1' };
  const scene = docToObjScene(baseDoc([sofa], levels), OPTS);
  const furn = scene.groups.filter((g) => g.name.startsWith('Furn_'));
  ok('có group nội thất', furn.length === 1);
  ok('đáy đồ = 3.300m (đứng trên sàn lầu 1)', furn.every((g) => Math.abs(yRange(g).min - 3.3) < 1e-9));
  ok('CHIỀU CAO đồ giữ nguyên theo loại, không bị kéo tới cốt tầng', furn.every((g) => yRange(g).max - yRange(g).min > 0.1 && yRange(g).max - yRange(g).min < 2));

  // đồ KHÔNG gắn tầng trong CÙNG doc vẫn ở cốt 0 — không bị "lây" cốt của cái khác
  const sofa0: Entity = { ...sofa, id: 'b2', at: { x: 2600, y: 900 }, levelId: undefined };
  const scene2 = docToObjScene(baseDoc([sofa, sofa0], levels), OPTS);
  const f2 = scene2.groups.filter((g) => g.name.startsWith('Furn_'));
  ok('đồ chưa gắn tầng vẫn nằm cốt 0 (không suy đoán lây — K3)', f2.some((g) => Math.abs(yRange(g).min) < 1e-9));
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
