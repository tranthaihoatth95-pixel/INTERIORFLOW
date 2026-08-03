/**
 * lib/boq/cache.test.ts — BOQ v2 Việc 2 (02/08): LIÊN KẾT SỐNG (`computeBoqCached`) — sửa Doc thì
 * BOQ phải tính lại đúng số; không sửa thì KHÔNG tính lại thừa (`hit: true`). Chạy:
 *   node_modules/.bin/sucrase-node lib/boq/cache.test.ts
 */
import {
  computeBoqCached,
  invalidateBoqCache,
  boqFingerprint,
  __clearAllBoqCacheForTest,
} from './cache';
import { emptyDoc, type Doc, type HatchEntity } from '../cad/model';
import type { MaterialSpecLite } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

let seq = 0;
/** Giống hệt `rectHatch()` ở `compute.test.ts` (không import chéo giữa 2 file test — mỗi file tự
 * chứa fixture của mình, đúng quy ước hiện có của repo, xem `compute.test.ts`/`xlsx.test.ts`). */
function rectHatch(
  wMm: number,
  dMm: number,
  extra?: Partial<HatchEntity>,
  at: { x: number; y: number } = { x: 0, y: 0 },
): HatchEntity {
  seq += 1;
  return {
    id: `h${seq}`,
    type: 'hatch',
    layer: 'l-floor',
    solid: true,
    points: [
      { x: at.x, y: at.y },
      { x: at.x + wMm, y: at.y },
      { x: at.x + wMm, y: at.y + dMm },
      { x: at.x, y: at.y + dMm },
    ],
    ...extra,
  };
}

function docWith(...ents: HatchEntity[]): Doc {
  const doc = emptyDoc();
  doc.entities.push(...ents);
  return doc;
}

const SAN_GO: MaterialSpecLite = {
  id: 'spec-san-go',
  name: 'Sàn gỗ công nghiệp',
  vendor: 'An Cường',
  sku: 'AC-SG-08',
  unit: 'm2',
  priceVnd: 300_000,
  wastagePercent: 5,
};

/* ═══ [1] gọi 2 lần, Doc/specs KHÔNG đổi → lần 2 hit:true, KHÔNG tính lại, kết quả y hệt ═══ */
console.log('\n[1] gọi 2 lần không đổi gì → hit:true, dùng lại kết quả cũ');
{
  __clearAllBoqCacheForTest();
  const h = rectHatch(2000, 3000, { specId: SAN_GO.id }); // 6m²
  const doc = docWith(h);

  const first = computeBoqCached('du-an-A', doc, [SAN_GO]);
  ok('lần đầu hit:false (chưa từng tính)', first.hit === false);
  ok('lần đầu ra đúng 1 dòng 6m²', first.result.rows.length === 1 && first.result.rows[0]?.m2 === 6);

  const second = computeBoqCached('du-an-A', doc, [SAN_GO]);
  ok('lần 2 hit:true (fingerprint không đổi)', second.hit === true);
  ok('lần 2 trả CÙNG object result (không tính lại)', second.result === first.result);
}

/* ═══ [2] sửa Doc (đổi diện tích vùng tô — kéo dài 1 cạnh) → phải tính lại đúng số mới ═══ */
console.log('\n[2] sửa diện tích vùng tô → hit:false, số ĐÚNG theo Doc mới');
{
  __clearAllBoqCacheForTest();
  const h = rectHatch(2000, 3000, { specId: SAN_GO.id }); // 6m²
  const doc = docWith(h);
  const before = computeBoqCached('du-an-B', doc, [SAN_GO]);
  ok('trước khi sửa: 6m²', before.result.rows[0]?.m2 === 6);

  // "sửa bản vẽ" — đổi points của CHÍNH entity đang có trong doc (giống thao tác kéo tay chỉnh
  // hình trên canvas thật, không tạo Doc mới hoàn toàn) thành 2000×5000 = 10m².
  const hatch = doc.entities.find((e): e is HatchEntity => e.type === 'hatch')!;
  hatch.points = [
    { x: 0, y: 0 },
    { x: 2000, y: 0 },
    { x: 2000, y: 5000 },
    { x: 0, y: 5000 },
  ];

  const after = computeBoqCached('du-an-B', doc, [SAN_GO]);
  ok('sau khi sửa: hit:false (fingerprint đổi vì points đổi)', after.hit === false);
  ok('sau khi sửa: m² ĐÚNG số mới (10, không phải 6 cũ)', after.result.rows[0]?.m2 === 10);
}

/* ═══ [3] đổi specId của vùng tô (gán lại vật liệu khác) → cũng phải tính lại ═══ */
console.log('\n[3] đổi specId vùng tô sang vật liệu khác → hit:false, matId đổi đúng');
{
  __clearAllBoqCacheForTest();
  const GACH: MaterialSpecLite = {
    id: 'spec-gach', name: 'Gạch ceramic', vendor: 'Viglacera', sku: 'VG-01',
    unit: 'm2', priceVnd: 200_000, wastagePercent: 0,
  };
  const h = rectHatch(2000, 2000, { specId: SAN_GO.id }); // 4m², ban đầu Sàn gỗ
  const doc = docWith(h);
  const before = computeBoqCached('du-an-C', doc, [SAN_GO, GACH]);
  ok('trước: matId = spec-san-go', before.result.rows[0]?.matId === 'spec-san-go');

  const hatch = doc.entities.find((e): e is HatchEntity => e.type === 'hatch')!;
  hatch.specId = GACH.id; // gán lại vật liệu — mô phỏng người dùng đổi vùng tô sang gạch

  const after = computeBoqCached('du-an-C', doc, [SAN_GO, GACH]);
  ok('sau: hit:false', after.hit === false);
  ok('sau: matId ĐÃ đổi sang spec-gach', after.result.rows[0]?.matId === 'spec-gach');
  ok('sau: thành tiền tính theo giá GẠCH mới (4×200.000=800.000, không phải giá sàn gỗ cũ)',
    after.result.rows[0]?.thanhTien === 800_000);
}

/* ═══ [4] Doc KHÔNG đổi nhưng đơn giá ProductSpec đổi (vd ATLAS sync lại) → vẫn phải tính lại ═══ */
console.log('\n[4] Doc không đổi, ĐƠN GIÁ vật liệu đổi (vd sync ATLAS lại) → hit:false');
{
  __clearAllBoqCacheForTest();
  const h = rectHatch(2000, 2000, { specId: SAN_GO.id }); // 4m²
  const doc = docWith(h);
  const before = computeBoqCached('du-an-D', doc, [SAN_GO]);
  ok('trước: đơn giá 300.000', before.result.rows[0]?.donGia === 300_000);

  const specDaTangGia: MaterialSpecLite = { ...SAN_GO, priceVnd: 350_000 }; // giá mới, Doc y nguyên
  const after = computeBoqCached('du-an-D', doc, [specDaTangGia]);
  ok('sau: hit:false (specsFingerprint đổi dù Doc không đổi 1 nét nào)', after.hit === false);
  ok('sau: đơn giá ĐÃ cập nhật 350.000', after.result.rows[0]?.donGia === 350_000);
}

/* ═══ [5] invalidateBoqCache → lần gọi kế tiếp PHẢI tính lại dù Doc/specs KHÔNG đổi gì ═══ */
console.log('\n[5] invalidateBoqCache rồi gọi lại với Doc/specs Y NGUYÊN → vẫn hit:false');
{
  __clearAllBoqCacheForTest();
  const h = rectHatch(2000, 2000, { specId: SAN_GO.id });
  const doc = docWith(h);
  const first = computeBoqCached('du-an-E', doc, [SAN_GO]);
  const second = computeBoqCached('du-an-E', doc, [SAN_GO]);
  ok('trước invalidate: hit:true (đúng như ca [1])', second.hit === true);

  invalidateBoqCache('du-an-E');
  const third = computeBoqCached('du-an-E', doc, [SAN_GO]);
  ok('sau invalidate: hit:false dù Doc/specs không đổi gì', third.hit === false);
  ok('kết quả VẪN đúng số (10 → không, 4m²)', third.result.rows[0]?.m2 === 4);
  ok('nhưng KHÔNG phải cùng object với first (đã tính lại thật)', third.result !== first.result);
}

/* ═══ [6] 2 cacheKey khác nhau (2 dự án) hoàn toàn ĐỘC LẬP — sửa dự án A không đụng cache dự án B ═══ */
console.log('\n[6] 2 cacheKey độc lập — sửa dự án A không làm dự án B tính lại nhầm');
{
  __clearAllBoqCacheForTest();
  const hA = rectHatch(2000, 2000, { specId: SAN_GO.id }); // 4m²
  const docA = docWith(hA);
  const hB = rectHatch(3000, 3000, { specId: SAN_GO.id }); // 9m²
  const docB = docWith(hB);

  computeBoqCached('proj-A', docA, [SAN_GO]);
  const bFirst = computeBoqCached('proj-B', docB, [SAN_GO]);

  // sửa doc A — không đụng gì tới doc B/key B
  const hatchA = docA.entities.find((e): e is HatchEntity => e.type === 'hatch')!;
  hatchA.points = [{ x: 0, y: 0 }, { x: 5000, y: 0 }, { x: 5000, y: 5000 }, { x: 0, y: 5000 }]; // 25m²
  computeBoqCached('proj-A', docA, [SAN_GO]);

  const bSecond = computeBoqCached('proj-B', docB, [SAN_GO]);
  ok('dự án B vẫn hit:true (không bị ảnh hưởng bởi sửa dự án A)', bSecond.hit === true);
  ok('dự án B vẫn 9m² y nguyên', bSecond.result.rows[0]?.m2 === 9);
  ok('dự án B trả cùng object result như lần đầu', bSecond.result === bFirst.result);
}

/* ═══ [7] boqFingerprint CỐ Ý bỏ qua field không ảnh hưởng số (đúng §4 "màu ≠ vật liệu") ═══ */
console.log('\n[7] boqFingerprint bỏ qua color/pattern/opacity — chỉ đổi hiển thị KHÔNG kích hoạt tính lại');
{
  __clearAllBoqCacheForTest();
  const h = rectHatch(2000, 2000, { specId: SAN_GO.id, pattern: 'SOLID', opacity: 0.9 });
  const doc = docWith(h);
  const fpBefore = boqFingerprint(doc);
  const first = computeBoqCached('du-an-F', doc, [SAN_GO]);

  const hatch = doc.entities.find((e): e is HatchEntity => e.type === 'hatch')!;
  hatch.pattern = 'ANSI31'; // đổi PATTERN hiển thị — KHÔNG phải diện tích/vật liệu
  hatch.opacity = 0.4; // đổi độ mờ hiển thị — cũng không ảnh hưởng số

  const fpAfter = boqFingerprint(doc);
  ok('fingerprint KHÔNG đổi khi chỉ đổi pattern/opacity', fpBefore === fpAfter);

  const second = computeBoqCached('du-an-F', doc, [SAN_GO]);
  ok('vẫn hit:true — đổi màu/pattern KHÔNG kích hoạt tính lại vô ích', second.hit === true);
  ok('trả cùng object result như trước', second.result === first.result);
}

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
