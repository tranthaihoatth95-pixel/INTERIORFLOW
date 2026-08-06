/**
 * lib/cad/hatch-perf.test.ts — LƯỚI KHÔNG GIAN cho `splitAtIntersections` (PHU q8, 05/08).
 *
 * Nợ kỹ thuật gốc (TECH-DEBT/`SO-KIEM-TONG` §2): `findHatchBoundary` treo >2 phút ở mật độ phòng
 * cao. Nguyên nhân đo được: `splitAtIntersections` so MỌI CẶP đoạn của TOÀN bản vẽ ⇒ O(n²).
 * Số đo trên máy làm phiên này (mặt bằng lưới phòng, mỗi phòng 1 chữ nhật + 2 món đồ):
 *
 *   đoạn biên   TRƯỚC             SAU
 *      8.112    1,02 s            30 ms
 *     21.168    6,33 s            70 ms
 *     43.200   29,6  s           129 ms
 *     76.800   92,4  s           218 ms
 *    145.200   (ngoại suy ~5')   505 ms  ← mức này TRƯỚC ĐÂY không đo nổi trong giới hạn phiên
 *
 * File này khoá HAI điều:
 *  [1] ĐÚNG — bản lưới cho kết quả GIỐNG HỆT bản quét cạn O(n²) (tham số `broadphaseMinSegs` cho
 *      phép ép chạy từng đường: `Infinity` = quét cạn, `0` = luôn dùng lưới).
 *  [2] NHANH — mốc thời gian trần, đủ rộng để không đỏ trên máy yếu nhưng vẫn bắt được nếu ai đó
 *      gỡ mất lưới (bản cũ chậm gấp ~400 lần ở mức này, không cách nào lọt).
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/hatch-perf.test.ts
 */
import { splitAtIntersections, findHatchBoundary, collectBoundarySegments, polygonArea } from './hatch';
import type { Doc, Entity, Pt } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/** Số ngẫu nhiên TẤT ĐỊNH (LCG) — cùng hạt giống thì cùng dữ liệu, test không chớp tắt. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Chuẩn hoá tập đoạn về chuỗi so sánh được (không phụ thuộc thứ tự & chiều đoạn). */
function normalize(segs: [Pt, Pt][]): string[] {
  const r = (v: number) => Math.round(v * 1e6) / 1e6;
  return segs
    .map(([a, b]) => {
      const ka = `${r(a.x)},${r(a.y)}`;
      const kb = `${r(b.x)},${r(b.y)}`;
      return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
    })
    .sort();
}

function sameSegments(a: [Pt, Pt][], b: [Pt, Pt][]): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  return na.length === nb.length && na.every((v, i) => v === nb[i]);
}

/* ───────── [1] ĐÚNG: lưới ≡ quét cạn ───────── */

/** Lưới trực giao dày (giống mặt bằng): dễ sinh giao chữ T + đoạn THẲNG HÀNG chồng lấn. */
function orthoSegments(n: number, seed: number): [Pt, Pt][] {
  const rnd = rng(seed);
  const segs: [Pt, Pt][] = [];
  for (let i = 0; i < n; i++) {
    const x = Math.round(rnd() * 40) * 250;
    const y = Math.round(rnd() * 40) * 250;
    const len = Math.round(1 + rnd() * 6) * 250;
    if (rnd() < 0.5) segs.push([{ x, y }, { x: x + len, y }]);
    else segs.push([{ x, y }, { x, y: y + len }]);
  }
  return segs;
}

/** Đoạn xiên ngẫu nhiên — ép nhánh giao CHÉO thường + đủ loại góc. */
function skewSegments(n: number, seed: number): [Pt, Pt][] {
  const rnd = rng(seed);
  const segs: [Pt, Pt][] = [];
  for (let i = 0; i < n; i++) {
    const x = rnd() * 10000;
    const y = rnd() * 10000;
    segs.push([{ x, y }, { x: x + (rnd() - 0.5) * 3000, y: y + (rnd() - 0.5) * 3000 }]);
  }
  return segs;
}

function testTuongDuong() {
  console.log('\n[1] Lưới không gian cho kết quả GIỐNG HỆT quét cạn O(n²)');
  const bo: [string, [Pt, Pt][]][] = [
    ['lưới trực giao 500 đoạn', orthoSegments(500, 1)],
    ['lưới trực giao 900 đoạn', orthoSegments(900, 7)],
    ['đoạn xiên 600 đoạn', skewSegments(600, 42)],
    ['xiên + trực giao trộn 800 đoạn', [...orthoSegments(400, 3), ...skewSegments(400, 4)]],
  ];
  for (const [label, segs] of bo) {
    const chuaLuoi = splitAtIntersections(segs, Infinity); // ép quét cạn
    const coLuoi = splitAtIntersections(segs, 0); // ép dùng lưới
    ok(`${label}: cùng SỐ đoạn nguyên tử (${chuaLuoi.length})`, chuaLuoi.length === coLuoi.length);
    ok(`${label}: cùng TẬP đoạn nguyên tử`, sameSegments(chuaLuoi, coLuoi));
  }

  // ca biên: rỗng · 1 đoạn · 2 đoạn trùng nhau hoàn toàn · đoạn suy biến (dài 0)
  const bien: [string, [Pt, Pt][]][] = [
    ['rỗng', []],
    ['1 đoạn', [[{ x: 0, y: 0 }, { x: 100, y: 0 }]]],
    ['2 đoạn TRÙNG hệt nhau', [[{ x: 0, y: 0 }, { x: 100, y: 0 }], [{ x: 0, y: 0 }, { x: 100, y: 0 }]]],
    ['đoạn dài 0', [[{ x: 5, y: 5 }, { x: 5, y: 5 }], [{ x: 0, y: 5 }, { x: 10, y: 5 }]]],
    ['thẳng hàng chồng lấn một phần', [[{ x: 0, y: 0 }, { x: 100, y: 0 }], [{ x: 50, y: 0 }, { x: 150, y: 0 }]]],
    ['giao chữ T', [[{ x: 0, y: 0 }, { x: 100, y: 0 }], [{ x: 50, y: 0 }, { x: 50, y: 80 }]]],
  ];
  for (const [label, segs] of bien) {
    ok(`ca biên "${label}": 2 đường cho cùng kết quả`, sameSegments(splitAtIntersections(segs, Infinity), splitAtIntersections(segs, 0)));
  }
}

/* ───────── [2] Dò biên vẫn ĐÚNG khi vượt ngưỡng bật lưới ───────── */

function emptyDoc(): Doc {
  return {
    entities: [],
    layers: [{ id: 'l', name: 'L', color: '#000', visible: true, locked: false }],
  } as unknown as Doc;
}
let uid = 0;
function rect(d: Doc, x0: number, y0: number, x1: number, y1: number) {
  const p = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
  for (let i = 0; i < 4; i++) d.entities.push({ id: `e${uid++}`, type: 'line', layer: 'l', a: p[i], b: p[(i + 1) % 4] } as Entity);
}
/** g×g phòng 4000×3500, mỗi phòng là chữ nhật RIÊNG + `furn` món đồ trong phòng. */
function denseDoc(g: number, furn: number): Doc {
  const d = emptyDoc();
  uid = 0;
  const W = 4000;
  const H = 3500;
  for (let i = 0; i < g; i++) {
    for (let j = 0; j < g; j++) {
      const x = i * W;
      const y = j * H;
      rect(d, x, y, x + W - 200, y + H - 200);
      for (let k = 0; k < furn; k++) {
        const fx = x + 400 + (k % 3) * 900;
        const fy = y + 400 + Math.floor(k / 3) * 700;
        rect(d, fx, fy, fx + 700, fy + 500);
      }
    }
  }
  return d;
}

function testDoBienVanDung() {
  console.log('\n[2] findHatchBoundary vẫn dò ĐÚNG phòng khi đã vượt ngưỡng bật lưới');
  const d = denseDoc(14, 2); // 2.352 đoạn — chắc chắn đi đường lưới
  ok('bộ dữ liệu thật sự vượt ngưỡng lưới (>400 đoạn)', collectBoundarySegments(d).length > 400);

  // bấm vào GÓC TRÊN-PHẢI phòng (0,0), tránh mọi món đồ bên trong → phải ra chính phòng đó
  const poly = findHatchBoundary(d, { x: 3600, y: 3100 });
  ok('dò ra biên (không null)', poly !== null);
  if (poly) {
    ok('là chữ nhật 4 đỉnh', poly.length === 4);
    // phòng 3800×3300 (đã trừ 200 khe tường)
    ok(`diện tích khớp phòng 3800×3300 (đo ${Math.round(polygonArea(poly))})`, Math.abs(polygonArea(poly) - 3800 * 3300) < 1);
  }

  // bấm TRONG món đồ → phải ra chính món đồ (vùng nhỏ nhất chứa điểm), không ra cả phòng
  const inFurn = findHatchBoundary(d, { x: 400 + 350, y: 400 + 250 });
  ok('bấm trong món đồ → trả vùng NHỎ NHẤT (700×500)', inFurn !== null && Math.abs(polygonArea(inFurn) - 700 * 500) < 1);

  // bấm ngoài hẳn bản vẽ → null, không nổ
  ok('bấm ngoài bản vẽ → null', findHatchBoundary(d, { x: -50000, y: -50000 }) === null);
}

/* ───────── [3] NHANH: trần thời gian ───────── */

function testTranThoiGian() {
  console.log('\n[3] Trần thời gian — bản O(n²) cũ chậm gấp ~400 lần, không thể lọt qua');
  const d = denseDoc(42, 2); // 21.168 đoạn — bản cũ đo 6,33 s
  const segs = collectBoundarySegments(d).length;
  const t0 = Date.now();
  findHatchBoundary(d, { x: 3600, y: 3100 });
  const ms = Date.now() - t0;
  console.log(`      (${segs} đoạn biên → ${ms} ms)`);
  ok(`${segs} đoạn xong dưới 3 s (đo ${ms} ms; bản cũ 6.332 ms)`, ms < 3000);

  const d2 = denseDoc(60, 2); // 43.200 đoạn — bản cũ đo 29,6 s
  const segs2 = collectBoundarySegments(d2).length;
  const t1 = Date.now();
  findHatchBoundary(d2, { x: 3600, y: 3100 });
  const ms2 = Date.now() - t1;
  console.log(`      (${segs2} đoạn biên → ${ms2} ms)`);
  ok(`${segs2} đoạn xong dưới 8 s (đo ${ms2} ms; bản cũ 29.565 ms)`, ms2 < 8000);
}

testTuongDuong();
testDoBienVanDung();
testTranThoiGian();
console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
