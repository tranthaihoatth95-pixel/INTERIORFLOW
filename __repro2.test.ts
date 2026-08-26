import type { Doc, HatchEntity, Pt } from './lib/cad/model';
import { entityBox } from './lib/cad/model';
import { cutHoleInWall } from './lib/cad/commands';
import { docToObjScene, toScene3DData } from './lib/three/cad-to-obj';
import { resolveSceneGroupGeometry } from './lib/three/build-recipe';

function mkWall(id: string, points: Pt[], extra: Partial<HatchEntity> = {}): HatchEntity {
  return { id, type: 'hatch', layer: 'l-wall', points, solid: true, heightMm: 2700, elementType: 'wall', ...extra } as HatchEntity;
}

const cases: Record<string, HatchEntity> = {
  'ngang 4000x200': mkWall('w', [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 200 }, { x: 0, y: 200 }]),
  'dọc 200x4000': mkWall('w', [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 4000 }, { x: 0, y: 4000 }]),
  'vuông 3000x3000': mkWall('w', [{ x: 0, y: 0 }, { x: 3000, y: 0 }, { x: 3000, y: 3000 }, { x: 0, y: 3000 }]),
  'chéo 45 độ': mkWall('w', [{ x: 0, y: 0 }, { x: 3000, y: 3000 }, { x: 2860, y: 3140 }, { x: -140, y: 140 }]),
  'chữ L': mkWall('w', [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 200 }, { x: 200, y: 200 }, { x: 200, y: 4000 }, { x: 0, y: 4000 }]),
  'nhỏ 800x100': mkWall('w', [{ x: 0, y: 0 }, { x: 800, y: 0 }, { x: 800, y: 100 }, { x: 0, y: 100 }]),
  'ngược chiều kim đồng hồ đảo': mkWall('w', [{ x: 0, y: 200 }, { x: 4000, y: 200 }, { x: 4000, y: 0 }, { x: 0, y: 0 }]),
  'cao 1200 = đúng cao cutter': mkWall('w', [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 200 }, { x: 0, y: 200 }], { heightMm: 2000 }),
};

for (const [label, wall] of Object.entries(cases)) {
  const doc = { units: 'mm', layers: [{ id: 'l-wall', name: 'TUONG', color: '#888', visible: true }], entities: [wall] } as unknown as Doc;
  const box = entityBox(wall);
  const spanX = box.maxX - box.minX;
  const spanY = box.maxY - box.minY;
  const cx = (box.minX + box.maxX) / 2;
  const cy = (box.minY + box.maxY) / 2;
  const thinIsX = spanX <= spanY;
  const along = Math.min(600, (thinIsX ? spanY : spanX) * 0.5) || 400;
  const w = thinIsX ? spanX + 40 : along;
  const h = thinIsX ? along : spanY + 40;
  const { cutter, updatedWall } = cutHoleInWall(wall, { x: cx - w / 2, y: cy - h / 2, w, h, heightMm: 1200 }, 'subtract');
  const doc2 = { ...doc, entities: [updatedWall, cutter] } as Doc;
  const gB = toScene3DData(docToObjScene(doc)).groups.find((g) => g.name.startsWith('Wall_'))!;
  const gA = toScene3DData(docToObjScene(doc2)).groups.find((g) => g.name.startsWith('Wall_'))!;
  let tB = -1, tA = -1, err = '';
  try { tB = resolveSceneGroupGeometry(gB).attributes.position.count / 3; } catch (e) { err = 'B:' + (e as Error).message; }
  try { tA = resolveSceneGroupGeometry(gA).attributes.position.count / 3; } catch (e) { err = 'A:' + (e as Error).message; }
  const cut = gA.opCutters ? Object.values(gA.opCutters)[0]?.length ?? 0 : 0;
  console.log(`${tB === tA || err ? 'XX' : 'ok'}  ${label.padEnd(28)} tris ${tB}->${tA}  cutterLen=${cut} ${err}`);
}
