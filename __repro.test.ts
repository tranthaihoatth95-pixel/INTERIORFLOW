/** repro tạm — chạy đúng đường của nút "Khoét hốc" trong Object3DInspector */
import type { Doc, HatchEntity } from './lib/cad/model';
import { entityBox } from './lib/cad/model';
import { cutHoleInWall } from './lib/cad/commands';
import { docToObjScene } from './lib/three/cad-to-obj';
import { resolveSceneGroupGeometry } from './lib/three/build-recipe';

const wall: HatchEntity = {
  id: 'wall-1',
  type: 'hatch',
  layer: 'l-wall',
  points: [
    { x: 0, y: 0 },
    { x: 4000, y: 0 },
    { x: 4000, y: 200 },
    { x: 0, y: 200 },
  ],
  solid: true,
  heightMm: 2700,
  elementType: 'wall',
};

const doc: Doc = {
  units: 'mm',
  layers: [{ id: 'l-wall', name: 'TUONG', color: '#888', visible: true }],
  entities: [wall],
} as unknown as Doc;

// ĐÚNG phép tính trong CutHoleAction
const box = entityBox(wall);
const spanX = box.maxX - box.minX;
const spanY = box.maxY - box.minY;
const cx = (box.minX + box.maxX) / 2;
const cy = (box.minY + box.maxY) / 2;
const thinIsX = spanX <= spanY;
const along = Math.min(600, (thinIsX ? spanY : spanX) * 0.5) || 400;
const w = thinIsX ? spanX + 40 : along;
const h = thinIsX ? along : spanY + 40;
console.log('cutter opts', { x: cx - w / 2, y: cy - h / 2, w, h, heightMm: 1200 });

const { cutter, updatedWall } = cutHoleInWall(wall, { x: cx - w / 2, y: cy - h / 2, w, h, heightMm: 1200 }, 'subtract');
const doc2: Doc = { ...doc, entities: [updatedWall, cutter] };

const before = docToObjScene(doc);
const after = docToObjScene(doc2);
const gB = before.groups.find((g) => g.name.startsWith('Wall_'))!;
const gA = after.groups.find((g) => g.name.startsWith('Wall_'))!;
console.log('before group ops', gB.ops, 'cutters', gB.opCutters && Object.keys(gB.opCutters));
console.log('after  group ops', JSON.stringify(gA.ops), 'cutters', gA.opCutters && Object.keys(gA.opCutters), 'cutterLen', gA.opCutters && Object.values(gA.opCutters)[0]?.length);
console.log('after warnings', after.warnings);

const geomB = resolveSceneGroupGeometry(gB);
const geomA = resolveSceneGroupGeometry(gA);
console.log('tris before', geomB.attributes.position.count / 3, 'tris after', geomA.attributes.position.count / 3);
