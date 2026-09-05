/**
 * lib/three/obj-scene-to-geometry.test.ts — regression: từ khi SPEC-TANG-DU-LIEU-CAU-KIEN §8 Đ1
 * gán `entityId` cho CẢ Furn_i/Window_i (không chỉ Wall_i), lọc "group nào là tường push-pull"
 * (mode `massing`, `Scene3DViewer.tsx`) PHẢI xét cả `heightMm`, không chỉ `entityId` — nếu không,
 * nội thất/cửa sổ sẽ vừa bị loại khỏi scene tĩnh vừa không lọt vào `buildMassingWalls`, biến mất
 * khỏi màn hình. Chạy: node_modules/.bin/sucrase-node lib/three/obj-scene-to-geometry.test.ts
 */
import type { Scene3DData, SceneGroup } from './cad-to-obj';
import { buildMergedGeometries, buildMassingWalls, buildUnmergedGeometries, isMassingWallGroup } from './obj-scene-to-geometry';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

const wallGroup: SceneGroup = { name: 'Wall_1', colorHex: '#e8e4dc', positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], entityId: 'wall-1', heightMm: 2700 };
const furnGroup: SceneGroup = { name: 'Furn_1_sofa2', colorHex: '#8a6f52', positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], entityId: 'sofa-1' };
const windowGroup: SceneGroup = { name: 'Window_1', colorHex: '#e8e4dc', positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], entityId: 'win-1' };
const floorGroup: SceneGroup = { name: 'Floor', colorHex: '#b08d63', positions: [0, 0, 0, 1, 0, 0, 0, 1, 0] };

const scene: Scene3DData = {
  groups: [wallGroup, furnGroup, windowGroup, floorGroup],
  bboxMm: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 },
  sizeM: { w: 1, d: 1, h: 2.7 },
};

console.log('isMassingWallGroup — CHỈ đúng khi có CẢ entityId VÀ heightMm');
{
  ok('Wall (entityId + heightMm) → true', isMassingWallGroup(wallGroup) === true);
  ok('Furn (entityId, KHÔNG heightMm) → false', isMassingWallGroup(furnGroup) === false);
  ok('Window (entityId, KHÔNG heightMm) → false', isMassingWallGroup(windowGroup) === false);
  ok('Floor (không entityId, không heightMm) → false', isMassingWallGroup(floorGroup) === false);
}

console.log('buildMassingWalls — chỉ tách tường, KHÔNG kéo theo nội thất/cửa sổ dù chúng đã có entityId');
{
  const walls = buildMassingWalls(scene);
  ok('chỉ có đúng 1 massing wall (Wall_1)', walls.length === 1 && walls[0].entityId === 'wall-1');
}

console.log('Scene3DViewer static-scene filter (mô phỏng) — Furn/Window KHÔNG bị loại khi lọc theo isMassingWallGroup');
{
  const staticGroups = scene.groups.filter((g) => !isMassingWallGroup(g));
  ok('static scene giữ Furn + Window + Floor (3 group)', staticGroups.length === 3);
  ok('static scene KHÔNG còn Wall_1', !staticGroups.some((g) => g.name === 'Wall_1'));
  // Bug đã vá: lọc bằng `!g.entityId` (cũ) sẽ SAI — chỉ còn lại đúng Floor (2 group Furn/Window
  // bị loại oan vì nay chúng cũng có entityId). Chốt lại để không tái phạm.
  const staticGroupsOldBuggyWay = scene.groups.filter((g) => !g.entityId);
  ok('(đối chứng) cách lọc CŨ chỉ `!g.entityId` sẽ loại oan Furn+Window — xác nhận đúng là bug đã né', staticGroupsOldBuggyWay.length === 1);
}

console.log('buildMergedGeometries/buildUnmergedGeometries — không throw, không đổi hành vi cũ');
{
  const merged = buildMergedGeometries(scene);
  ok('gộp theo màu — mỗi màu 1 geometry', merged.length === new Set(scene.groups.map((g) => g.colorHex)).size);
  const unmerged = buildUnmergedGeometries(scene);
  ok('unmerged — 1 geometry/group', unmerged.length === scene.groups.length);
}

/* ══════════════ V8c bước 2 — KHOÁ GỘP MANG DANH TÍNH VẬT LIỆU ══════════════
 * Trước bước này khoá gộp là `colorHex` đơn thuần, mà MỌI tường của app dùng chung một hex
 * (`cad-to-obj.ts:244/254/263`) ⇒ hai bức tường không thể mang hai vật liệu khác nhau, dù dữ liệu
 * có khai. Ba ràng buộc dưới đây canh cả hai phía: tách được khi CÓ danh tính, và **không nở thêm
 * draw call nào khi KHÔNG có** — vế sau mới là vế dễ hỏng âm thầm. */
console.log('\nV8c — khoá gộp `colorHex|matId`');
{
  const SOI = 'f77b3a78-f2e3-4b19-b70f-20643c8a6243';
  const OC_CHO = 'e1f4694e-b25c-4dcb-86d4-0c787b69f857';
  const tuong = (i: number, extra: Partial<SceneGroup> = {}): SceneGroup => ({
    name: `Wall_${i}`, colorHex: '#e8e4dc', positions: [0, 0, 0, 1, 0, 0, 1, 1, 0], ...extra,
  });
  const canh = (groups: SceneGroup[]): Scene3DData => ({ groups } as Scene3DData);

  // ① KHÔNG group nào khai danh tính ⇒ số draw call phải Y HỆT trước bước này.
  const khongKhai = buildMergedGeometries(canh([tuong(1), tuong(2), tuong(3)]));
  ok('không ai khai vật liệu ⇒ vẫn gộp còn 1 (không nở draw call)', khongKhai.length === 1);
  ok('không ai khai ⇒ BuiltGroup.matId để trống, không bịa', khongKhai[0].matId === undefined);

  // ② Hai tường CÙNG MÀU nhưng khác vật liệu ⇒ phải tách. Đây là bài toán gốc.
  const khacVatLieu = buildMergedGeometries(canh([
    tuong(1, { specId: `hat-giong:${SOI}` }),
    tuong(2, { specId: `hat-giong:${OC_CHO}` }),
    tuong(3),
  ]));
  ok('cùng màu + khác matId ⇒ tách thành 3 nhóm', khacVatLieu.length === 3);
  ok('nhóm mang đúng matId đã gỡ tiền tố hạt giống', khacVatLieu.some((b) => b.matId === SOI) && khacVatLieu.some((b) => b.matId === OC_CHO));

  // ③ Cùng vật liệu thì vẫn gộp — nếu không, mỗi entity một draw call và cảnh lớn sập FPS.
  const cungVatLieu = buildMergedGeometries(canh([
    tuong(1, { specId: `hat-giong:${SOI}` }),
    tuong(2, { specId: `hat-giong:${SOI}` }),
    tuong(3, { specId: `hat-giong:${SOI.toUpperCase()}` }), // hoa/thường không được tách đôi
  ]));
  ok('cùng matId ⇒ vẫn gộp còn 1 draw call', cungVatLieu.length === 1);

  // ④ `specId` là cuid ProductSpec thật ⇒ KHÔNG suy ra matId được (khai thẳng giới hạn, xem
  //    docstring `matIdCuaNhom`). Nhóm đó phải rơi về màu, KHÔNG được tách theo specId — tách theo
  //    specId là đúng đường nở về ~2000 draw call mà chú thích gốc của hàm cảnh báo.
  const cuid = buildMergedGeometries(canh([
    tuong(1, { specId: 'clx1abc23def45ghi67jkl890' }),
    tuong(2, { specId: 'clx9zyx87wvu65tsr43qpo210' }),
  ]));
  ok('specId dạng cuid ⇒ không tách, gộp còn 1 (không nở draw call)', cuid.length === 1);
  ok('specId dạng cuid ⇒ matId để trống, không giả UUID từ cuid', cuid[0].matId === undefined);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
