/**
 * scripts/bench/bench-3d.ts — ĐO hiệu năng 3D: docToObjScene / resolveGroupGeometry / evalRecipe,
 * phiếu `docs/phieu-giao/hieu-nang-do.md` mục ④.3. ĐO, KHÔNG tối ưu — không sửa code sản phẩm.
 *
 * [1] `docToObjScene(doc)` cho Doc 500/2.000/5.000 entity — tam giác ĐẾM THẬT qua `stats.faces`
 *     (không suy đoán — số này do `ObjBuilder` đếm mỗi `pushTri` lúc dựng, xem `cad-to-obj.ts`).
 * [2] `resolveGroupGeometry` trên các tường mang `ops` 2 bậc (boolean khoét lỗ + arrayLinear lặp,
 *     ~2% tường — xem `gen-doc.ts` OPS_EVERY) — nhóm này chạy CSG thật (`three-bvh-csg`), khác
 *     mọi tường thường (trả thẳng `geometryOf(positions)`, không CSG).
 * [3] `evalRecipe` — MỘT tường đại diện mang `recipe` 10 bước (cố định, không scale theo N — modifier
 *     stack chỉ áp cho cấu kiện đặc biệt, không đại trà; xem lý do chọn trong docstring `gen-doc.ts`).
 *
 * Ba.js (`three`/`three-bvh-csg`) chạy được trong Node không cần WebGL — `BufferGeometry` là thuần
 * toán học, không đụng canvas/GPU (đã được chứng minh: `lib/three/*.test.ts` chạy qua sucrase-node
 * trong `npm test` hiện có, bench này CHỈ tái dùng đúng các hàm đó, không viết đường CSG mới).
 *
 * Tất định: cùng seed `gen-doc.ts` ⇒ cùng Doc + cùng recipe; đo bằng process.hrtime.bigint(),
 * median 5 lần.
 *
 * Chạy: node_modules/.bin/sucrase-node scripts/bench/bench-3d.ts
 */
import { genDoc } from './gen-doc';
import { docToObjScene, type SceneGroup } from '../../lib/three/cad-to-obj';
import { resolveGroupGeometry } from '../../lib/three/build-ops';
import { evalRecipe } from '../../lib/three/build-recipe';
import { timeMs, printTable, fmt, growthFactor } from './bench-util';

const SIZES = [500, 2000, 5000];
const REPS = 5;

interface RowScene { n: number; ms: number; faces: number; verts: number; walls: number; furniture: number; rooms: number; warnings: number; }
interface RowOps { n: number; count: number; totalMs: number; perCallMs: number; triAfter: number; }

const rowsScene: RowScene[] = [];
const rowsOps: RowOps[] = [];
let recipeReport: string[][] | null = null;

console.log('=== BENCH 3D — InteriorFlow (docToObjScene / resolveGroupGeometry / evalRecipe) ===');
console.log('Lệnh chạy lại: node_modules/.bin/sucrase-node scripts/bench/bench-3d.ts\n');

for (const N of SIZES) {
  const { doc, meta } = genDoc(N);

  const tScene = timeMs(() => docToObjScene(doc, { wallHeightMm: 2700 }), REPS);
  const scene = tScene.result;
  rowsScene.push({
    n: meta.actualEntities,
    ms: tScene.medianMs,
    faces: scene.stats.faces,
    verts: scene.stats.verts,
    walls: scene.stats.walls,
    furniture: scene.stats.furniture,
    rooms: scene.stats.rooms,
    warnings: scene.warnings.length,
  });

  // `resolveGroupGeometry` cache theo `entityId` (build-ops.ts `meshCache`, module-private —
  // KHÔNG có API xoá, và phiếu cấm sửa code sản phẩm nên không thêm được). Gọi thẳng cùng group
  // 5 lần liền sẽ ăn cache từ lần 2 (gần như 0ms) ⇒ median bị lệch xuống giả tạo. Vá bằng cách đo
  // ĐÚNG NGHĨA "lần đầu, cache lạnh": mỗi lần lặp CLONE group với `entityId`/`name` DUY NHẤT (khoá
  // cache khác nhau ⇒ luôn tính CSG thật) — median 5 lần khi đó là 5 LẦN TÍNH THẬT, không lẫn cache.
  const opsGroups: SceneGroup[] = scene.groups.filter((g) => g.ops && g.ops.length > 0);
  if (opsGroups.length) {
    const coldTimes: number[] = [];
    let lastGeoms: ReturnType<typeof resolveGroupGeometry>[] = [];
    for (let rep = 0; rep < REPS; rep++) {
      const freshGroups = opsGroups.map((g, gi) => ({ ...g, entityId: `${g.entityId ?? g.name}__rep${rep}_${gi}`, name: `${g.name}__rep${rep}` }));
      const t0 = process.hrtime.bigint();
      lastGeoms = freshGroups.map((g) => resolveGroupGeometry(g));
      const t1 = process.hrtime.bigint();
      coldTimes.push(Number(t1 - t0) / 1e6);
    }
    coldTimes.sort((a, b) => a - b);
    const mid = Math.floor(coldTimes.length / 2);
    const medianMs = coldTimes.length % 2 === 1 ? coldTimes[mid] : (coldTimes[mid - 1] + coldTimes[mid]) / 2;
    const totalTri = lastGeoms.reduce((s, geo) => s + geo.attributes.position.count / 3, 0);
    rowsOps.push({ n: meta.actualEntities, count: opsGroups.length, totalMs: medianMs, perCallMs: medianMs / opsGroups.length, triAfter: totalTri });
  } else {
    rowsOps.push({ n: meta.actualEntities, count: 0, totalMs: 0, perCallMs: 0, triAfter: 0 });
  }

  // [3] evalRecipe — chỉ đo MỘT LẦN, trên tường đại diện của lưới lớn nhất (N=5000) để có nhiều
  // dữ liệu cutter/hình học nhất; không lặp lại theo N (lý do: xem docstring đầu file).
  if (N === 5000) {
    const recipeGroup = scene.groups.find((g) => g.recipe && g.recipe.steps.length > 0);
    if (!recipeGroup) {
      recipeReport = [['— không tìm thấy nhóm mang recipe trong scene (kiểm lại gen-doc.ts OPS_EVERY/lưới quá nhỏ)']];
    } else {
      const baseTri = recipeGroup.positions.length / 9; // 3 số/đỉnh × 3 đỉnh/tam giác
      const tRecipe = timeMs(
        () =>
          evalRecipe(
            { positions: recipeGroup.positions, baseMm: recipeGroup.baseMm, heightMm: recipeGroup.heightMm, opCutters: recipeGroup.opCutters },
            recipeGroup.recipe!.steps,
          ),
        REPS,
      );
      const outTri = tRecipe.result.geometry.attributes.position.count / 3;
      const stepErrCount = Object.keys(tRecipe.result.stepErrors).length;
      recipeReport = [
        ['ms (median 5 lần)', fmt(tRecipe.medianMs)],
        ['tam giác GỐC (trước recipe)', String(Math.round(baseTri))],
        ['tam giác SAU (10 bước)', String(Math.round(outTri))],
        ['hệ số nhân', fmt(outTri / Math.max(baseTri, 1), 1) + '×'],
        ['#bước lỗi (kỳ vọng 0)', String(stepErrCount)],
        ...(stepErrCount ? [['nội dung lỗi', JSON.stringify(tRecipe.result.stepErrors)]] : []),
      ];
    }
  }
}

console.log(`\n[1] docToObjScene (median ${REPS} lần, ms) — tam giác ĐẾM THẬT qua stats.faces`);
printTable(
  ['entity', 'ms', 'faces(tam giác)', 'verts', 'walls', 'furniture', 'rooms', '#warnings'],
  rowsScene.map((r) => [r.n, fmt(r.ms), r.faces, r.verts, r.walls, r.furniture, r.rooms, r.warnings]),
);

const at5000 = rowsScene.find((r) => r.n >= 4000);
if (at5000) {
  const mark = at5000.faces >= 100_000;
  console.log(`\nMốc 100.000 tam giác ở ~5.000 entity (đo thật ${at5000.faces} faces): ${mark ? 'ĐẠT' : 'CHƯA đạt'} qua đường docToObjScene thường (không recipe/ops).`);
}

console.log(`\n[2] resolveGroupGeometry — tường mang ops 2 bậc (boolean subtract + arrayLinear ×3), ~2% tổng số tường`);
printTable(
  ['entity', '#tường có ops', 'tổng ms', 'ms/tường', 'tổng tam giác kết quả'],
  rowsOps.map((r) => [r.n, r.count, fmt(r.totalMs), fmt(r.perCallMs, 3), Math.round(r.triAfter)]),
);

if (recipeReport) {
  console.log(`\n[3] evalRecipe — 1 tường đại diện (Doc N=5000), recipe 10 bước (KHÔNG scale theo N)`);
  printTable(['chỉ số', 'giá trị'], recipeReport);
}

console.log('\n[4] Hệ số tăng trưởng so N (kỳ vọng O(n) ⇒ hệ số ≈1×)');
const growthRows: (string | number)[][] = [];
for (let i = 1; i < rowsScene.length; i++) {
  const a = rowsScene[i - 1];
  const b = rowsScene[i];
  growthRows.push(['docToObjScene', `${a.n}→${b.n}`, `${fmt(b.n / a.n, 2)}×`, fmt(growthFactor(a.n, b.n, a.ms, b.ms), 2) + '×']);
}
for (let i = 1; i < rowsOps.length; i++) {
  const a = rowsOps[i - 1];
  const b = rowsOps[i];
  if (a.totalMs > 0 && b.totalMs > 0) {
    growthRows.push(['resolveGroupGeometry (tổng)', `${a.n}→${b.n}`, `${fmt(b.n / a.n, 2)}×`, fmt(growthFactor(a.n, b.n, a.totalMs, b.totalMs), 2) + '×']);
  }
}
printTable(['hàm', 'N', 'N×', 'hệ số thời gian'], growthRows);
