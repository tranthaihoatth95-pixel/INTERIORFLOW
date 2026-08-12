/**
 * scripts/bench/bench-2d.ts — ĐO hiệu năng 2D trên Doc lớn (500/2.000/5.000 entity), phiếu
 * `docs/phieu-giao/hieu-nang-do.md` mục ④.2. ĐO, KHÔNG tối ưu — không sửa code sản phẩm.
 *
 * Đo 4 việc:
 *  [1] round-trip `exportIdf`/`importIdf` (parse/serialize Doc lớn).
 *  [2] `findHatchBoundary` (đường lệnh H — dựng+hỏi MỖI lần bấm) so với đường ĐÃ VÁ 05/08
 *      (`buildHatchFaceIndex` dựng 1 lần + `pickHatchFace` hỏi N lần, xem `hatch-index.test.ts`) —
 *      kiểm tra vá cũ còn đứng vững trên Doc MỚI (hỗn hợp nhiều loại entity hơn `denseDoc()`, có cả
 *      RoomEntity/DimEntity góp thêm đoạn biên — `collectBoundarySegments` không loại chúng).
 *  [3] `hitTest` — quét N điểm tất định trên lưới, mô phỏng rê chuột/click chọn liên tục.
 *  [4] `detectRooms` — đường vòng lặp findRoomLabels + buildHatchFaceIndex, chạy trên Doc đã có
 *      sẵn RoomEntity (idempotent — proposals phải = 0, alreadyRooms = số phòng).
 *
 * Tất định: cùng seed `gen-doc.ts` ⇒ cùng Doc; đo bằng process.hrtime.bigint(), median 5 lần.
 *
 * Chạy: node_modules/.bin/sucrase-node scripts/bench/bench-2d.ts
 */
import { genDoc, gridBboxMm, type GenDocMeta } from './gen-doc';
import { exportIdf, importIdf } from '../../lib/cad/idf';
import { findHatchBoundary, collectBoundarySegments, buildHatchFaceIndex, pickHatchFace } from '../../lib/cad/hatch';
import { hitTest } from '../../lib/cad/query';
import { detectRooms } from '../../lib/cad/room';
import type { Doc, Pt } from '../../lib/cad/model';
import { timeMs, printTable, fmt, growthFactor } from './bench-util';

const SIZES = [500, 2000, 5000];
const REPS = 5;
const N_QUERY = 200; // #điểm hỏi tất định cho hitTest
/** Đường "CŨ" (dựng+hỏi MỖI lần gọi `findHatchBoundary`) tốn ~vài chục ms/lần gọi trên bản vẽ
 * dày (đã đo ở `hatch-index.test.ts`: 173s cho 2.312 lần gọi ≈ 75ms/lần trên ~13.9k đoạn biên).
 * Gọi ĐỦ số lần thật (bằng số nội thất, ~1.100 ở N=5.000) × 5 lần lặp sẽ mất HÀNG PHÚT chỉ để đo
 * lại một điều ĐÃ CHỨNG MINH (không phải mục tiêu phiếu này — mục tiêu là đo ĐƯỜNG THẬT app đang
 * chạy, đường CŨ chỉ để đối chiếu). Quyết định (mơ hồ → chọn đơn giản nhất): đo đường CŨ trên MẪU
 * CỐ ĐỊNH `N_OLD_SAMPLE` lần gọi (đo THẬT, không suy đoán per-call), rồi NHÂN RA cho đủ số lần gọi
 * thật của N đó — phần nhân ra LUÔN ghi rõ "suy ra" trong bảng, không trộn với số đo thật. */
const N_OLD_SAMPLE = 24;

/** mulberry32 riêng cho điểm hỏi — seed KHÁC seed sinh Doc để không trùng lặp cơ học. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeQueryPoints(meta: GenDocMeta, n: number): Pt[] {
  const rand = mulberry32(777);
  const box = gridBboxMm(meta);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    pts.push({
      x: box.minX + rand() * (box.maxX - box.minX),
      y: box.minY + rand() * (box.maxY - box.minY),
    });
  }
  return pts;
}

interface Row1 { n: number; exportMs: number; importMs: number; kb: number; }
interface Row2 {
  n: number;
  fullQueries: number;
  oldSampleN: number;
  oldSampleMs: number;
  oldPerCallMs: number;
  oldExtrapolatedMs: number;
  buildMs: number;
  queryMs: number;
}
interface Row3 { n: number; queries: number; totalMs: number; hits: number; }
interface Row4 { n: number; ms: number; proposals: number; already: number; unresolved: number; }

const r1: Row1[] = [];
const r2: Row2[] = [];
const r3: Row3[] = [];
const r4: Row4[] = [];

console.log('=== BENCH 2D — InteriorFlow (Doc lớn, tất định, seed cố định) ===');
console.log(`Lệnh chạy lại: node_modules/.bin/sucrase-node scripts/bench/bench-2d.ts\n`);

for (const N of SIZES) {
  const { doc, meta } = genDoc(N);
  console.log(
    `--- N mục tiêu=${N} → thực tế ${meta.actualEntities} entity ` +
      `(lưới ${meta.cols}×${meta.rows}=${meta.rooms} phòng · tường ${meta.wallHatches} · block ${meta.blocks} · dim ${meta.dims} · text ${meta.texts} · cutter ${meta.cutters}) ---`,
  );

  // [1] round-trip
  const tExport = timeMs(() => exportIdf([{ id: 's1', name: 'Sheet 1', doc }]), REPS);
  const json = tExport.result;
  const tImport = timeMs(() => importIdf(json), REPS);
  if (!tImport.result) throw new Error('importIdf trả null — round-trip hỏng, dừng bench');
  if (tImport.result.sheets[0].doc.entities.length !== doc.entities.length) {
    throw new Error(`round-trip MẤT entity: ${doc.entities.length} → ${tImport.result.sheets[0].doc.entities.length}`);
  }
  r1.push({ n: meta.actualEntities, exportMs: tExport.medianMs, importMs: tImport.medianMs, kb: json.length / 1024 });

  // [2] findHatchBoundary — đường CŨ (dựng+hỏi mỗi lần) so với đường ĐÃ VÁ (dựng 1 + hỏi N)
  const picks: Pt[] = doc.entities.filter((e) => e.type === 'block').map((e) => (e as { at: Pt }).at);
  const oldSample = picks.slice(0, Math.min(N_OLD_SAMPLE, picks.length));
  const tOld = timeMs(() => {
    let found = 0;
    for (const p of oldSample) if (findHatchBoundary(doc, p)) found += 1;
    return found;
  }, REPS);
  const oldPerCallMs = tOld.medianMs / oldSample.length;

  const tBuild = timeMs(() => buildHatchFaceIndex(collectBoundarySegments(doc)), REPS);
  const idx = tBuild.result;
  const tQuery = timeMs(() => {
    let found = 0;
    for (const p of picks) if (pickHatchFace(idx, p)) found += 1;
    return found;
  }, REPS);
  r2.push({
    n: meta.actualEntities,
    fullQueries: picks.length,
    oldSampleN: oldSample.length,
    oldSampleMs: tOld.medianMs,
    oldPerCallMs,
    oldExtrapolatedMs: oldPerCallMs * picks.length,
    buildMs: tBuild.medianMs,
    queryMs: tQuery.medianMs,
  });

  // [3] hitTest
  const queryPts = makeQueryPoints(meta, N_QUERY);
  const tHit = timeMs(() => {
    let hits = 0;
    for (const p of queryPts) if (hitTest(doc, p, 50)) hits += 1;
    return hits;
  }, REPS);
  r3.push({ n: meta.actualEntities, queries: N_QUERY, totalMs: tHit.medianMs, hits: tHit.result });

  // [4] detectRooms (idempotent — Doc đã có RoomEntity cho mọi phòng)
  const tDetect = timeMs(() => detectRooms(doc), REPS);
  r4.push({
    n: meta.actualEntities,
    ms: tDetect.medianMs,
    proposals: tDetect.result.proposals.length,
    already: tDetect.result.alreadyRooms,
    unresolved: tDetect.result.unresolved.length,
  });
}

console.log(`\n[1] Round-trip exportIdf → importIdf (median ${REPS} lần, ms)`);
printTable(
  ['entity', 'export ms', 'import ms', 'tổng ms', 'JSON (KB)'],
  r1.map((r) => [r.n, fmt(r.exportMs), fmt(r.importMs), fmt(r.exportMs + r.importMs), fmt(r.kb, 0)]),
);

console.log(
  `\n[2] findHatchBoundary — đường CŨ (dựng+hỏi MỖI lần, lệnh H) đo trên mẫu ${N_OLD_SAMPLE} lần gọi (ĐO THẬT) rồi` +
    ` NHÂN RA (SUY RA, ghi rõ) cho đủ #hỏi thật; so với đường ĐÃ VÁ (dựng 1 lần + hỏi ĐỦ #hỏi thật, ĐO THẬT toàn bộ)`,
);
printTable(
  ['entity', '#hỏi thật', 'CŨ ms/lần (đo)', 'CŨ tổng SUY RA (ms)', 'VÁ dựng ms (đo)', 'VÁ hỏi ms (đo)', 'VÁ tổng ms (đo)', 'lần nhanh hơn (suy ra ÷ đo)'],
  r2.map((r) => [
    r.n,
    r.fullQueries,
    fmt(r.oldPerCallMs, 3),
    fmt(r.oldExtrapolatedMs),
    fmt(r.buildMs),
    fmt(r.queryMs),
    fmt(r.buildMs + r.queryMs),
    fmt(r.oldExtrapolatedMs / Math.max(r.buildMs + r.queryMs, 1e-6), 1) + '×',
  ]),
);

console.log(`\n[3] hitTest — ${N_QUERY} điểm tất định/lần (median ${REPS} lần, ms)`);
printTable(
  ['entity', '#hỏi', 'tổng ms', 'µs/hỏi', 'hits'],
  r3.map((r) => [r.n, r.queries, fmt(r.totalMs), fmt((r.totalMs / r.queries) * 1000, 1), r.hits]),
);

console.log(`\n[4] detectRooms (findRoomLabels + buildHatchFaceIndex, idempotent — proposals kỳ vọng 0)`);
printTable(
  ['entity', 'ms', 'proposals', 'alreadyRooms', 'unresolved'],
  r4.map((r) => [r.n, fmt(r.ms), r.proposals, r.already, r.unresolved]),
);

console.log('\n[5] Hệ số tăng trưởng so N (kỳ vọng O(n) ⇒ hệ số ≈1×; > ~1.5× là nghi phạm phi tuyến)');
const growthRows: (string | number)[][] = [];
function pushGrowth(label: string, series: { n: number; ms: number }[]) {
  for (let i = 1; i < series.length; i++) {
    const a = series[i - 1];
    const b = series[i];
    growthRows.push([label, `${a.n}→${b.n}`, `${fmt(b.n / a.n, 2)}×`, fmt(growthFactor(a.n, b.n, a.ms, b.ms), 2) + '×']);
  }
}
pushGrowth('round-trip (export+import)', r1.map((r) => ({ n: r.n, ms: r.exportMs + r.importMs })));
pushGrowth('findHatchBoundary (đường VÁ, dựng+hỏi, ĐO THẬT)', r2.map((r) => ({ n: r.n, ms: r.buildMs + r.queryMs })));
pushGrowth('findHatchBoundary (CŨ, ms/lần gọi — ĐO THẬT trên mẫu)', r2.map((r) => ({ n: r.n, ms: r.oldPerCallMs })));
pushGrowth('hitTest', r3.map((r) => ({ n: r.n, ms: r.totalMs })));
pushGrowth('detectRooms', r4.map((r) => ({ n: r.n, ms: r.ms })));
printTable(['hàm', 'N', 'N×', 'hệ số thời gian'], growthRows);
