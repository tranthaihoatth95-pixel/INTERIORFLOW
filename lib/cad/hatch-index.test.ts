/**
 * lib/cad/hatch-index.test.ts — VIỆC 3 (PHU, 05/08): `findHatchBoundary` treo >2 phút ở mật độ cao.
 *
 * NGUYÊN NHÂN ĐO ĐƯỢC (khác với nguyên nhân đã vá trước đó):
 *   - Đã vá trước: `splitAtIntersections` quét O(n²) mọi cặp đoạn → lưới không gian
 *     (`hatch-perf.test.ts`, khoá riêng, KHÔNG lặp lại ở đây).
 *   - CÒN LẠI, vá ở phiên này: `docToObjScene` (`lib/three/cad-to-obj.ts`) gọi
 *     `findHatchBoundary(traceDoc, b.at)` **một lần cho MỖI món đồ nội thất**. Mỗi lời gọi dựng
 *     LẠI toàn bộ phân hoạch mặt phẳng của CÙNG một bản vẽ. Chi phí = N × (cắt giao điểm + dựng
 *     DCEL), trong khi phần phụ thuộc `pick` chỉ là bước cuối.
 *
 * SỐ ĐO THẬT trên máy làm phiên này (mặt bằng lưới phòng, mỗi phòng 1 chữ nhật + 2 món đồ):
 *
 *   lưới     phòng   lần hỏi   đoạn biên   TRƯỚC (N lời gọi)   SAU (dựng 1 + hỏi N)
 *   17×17      289       578       3.468        12,2 s               ~0,2 s
 *   24×24      576     1.152       6.912        42,4 s               ~0,4 s
 *   34×34    1.156     2.312      13.872      ~173 s  ⟵ ">2 phút"    ~1,2 s
 *   42×42    1.764     3.528      21.168      ~353 s                 ~2,4 s
 *
 * File này khoá HAI điều:
 *  [1] ĐÚNG — `buildHatchFaceIndex` + `pickHatchFace` cho kết quả GIỐNG HỆT `findHatchBoundary`
 *      trên MỌI điểm hỏi (nếu lệch thì tối ưu này đã đổi hành vi, không được phép).
 *  [2] NHANH — mốc trần cho đúng hình dạng công việc của `docToObjScene` (N lần hỏi). Bản cũ ở
 *      mức này mất ~173 s nên không cách nào lọt qua trần dưới đây.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/hatch-index.test.ts
 */
import {
  findHatchBoundary,
  collectBoundarySegments,
  buildHatchFaceIndex,
  pickHatchFace,
  polygonArea,
} from './hatch';
import type { Doc, Entity, Pt } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

let uid = 0;
function emptyDoc(): Doc {
  return {
    entities: [],
    layers: [{ id: 'l', name: 'L', color: '#000', visible: true, locked: false }],
  } as unknown as Doc;
}
function rect(d: Doc, x0: number, y0: number, x1: number, y1: number) {
  const p = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
  for (let i = 0; i < 4; i++) {
    d.entities.push({ id: `e${uid++}`, type: 'line', layer: 'l', a: p[i], b: p[(i + 1) % 4] } as Entity);
  }
}

/** g×g phòng 4000×3500, mỗi phòng `furn` món đồ — CÙNG bộ sinh dữ liệu với `hatch-perf.test.ts`.
 * `picks` = tâm từng món đồ, đúng `b.at` mà `docToObjScene` truyền vào. */
function denseDoc(g: number, furn: number): { doc: Doc; picks: Pt[] } {
  const d = emptyDoc();
  uid = 0;
  const W = 4000;
  const H = 3500;
  const picks: Pt[] = [];
  for (let i = 0; i < g; i++) {
    for (let j = 0; j < g; j++) {
      const x = i * W;
      const y = j * H;
      rect(d, x, y, x + W - 200, y + H - 200);
      for (let k = 0; k < furn; k++) {
        const fx = x + 400 + (k % 3) * 900;
        const fy = y + 400 + Math.floor(k / 3) * 700;
        rect(d, fx, fy, fx + 700, fy + 500);
        picks.push({ x: fx + 350, y: fy + 250 });
      }
    }
  }
  return { doc: d, picks };
}

/** Chuỗi so sánh được cho 1 đa giác — không phụ thuộc điểm bắt đầu/chiều quay. */
function polyKey(poly: Pt[] | null): string {
  if (!poly) return 'null';
  const r = (v: number) => Math.round(v * 1e6) / 1e6;
  return poly.map((p) => `${r(p.x)},${r(p.y)}`).sort().join('|');
}

/* ───────── [1] ĐÚNG: chỉ mục ≡ đường cũ, trên MỌI điểm hỏi ───────── */
function testDungHetMoiDiem() {
  console.log('\n[1] buildHatchFaceIndex + pickHatchFace ≡ findHatchBoundary (mọi điểm hỏi)');
  const { doc, picks } = denseDoc(8, 2);
  const idx = buildHatchFaceIndex(collectBoundarySegments(doc));

  let lech = 0;
  for (const p of picks) {
    if (polyKey(pickHatchFace(idx, p)) !== polyKey(findHatchBoundary(doc, p))) lech += 1;
  }
  ok(`${picks.length} điểm trong món đồ: 0 điểm lệch (lệch ${lech})`, lech === 0);

  // Điểm KHÔNG nằm trong món đồ nào: giữa phòng, sát mép, ngoài hẳn bản vẽ, đúng trên cạnh.
  const khac: Pt[] = [
    { x: 3600, y: 3100 },          // góc trống của phòng (0,0)
    { x: -50_000, y: -50_000 },    // ngoài hẳn
    { x: 0, y: 0 },                // đúng đỉnh tường
    { x: 2000, y: 0 },             // đúng trên cạnh dưới
    { x: 4000 * 3 + 1000, y: 3500 * 2 + 1000 }, // trong một phòng khác
  ];
  let lech2 = 0;
  for (const p of khac) {
    if (polyKey(pickHatchFace(idx, p)) !== polyKey(findHatchBoundary(doc, p))) lech2 += 1;
  }
  ok(`5 điểm biên (ngoài bản vẽ · trên đỉnh · trên cạnh · giữa phòng): 0 lệch (lệch ${lech2})`, lech2 === 0);

  // Vẫn giữ đúng ngữ nghĩa "vùng NHỎ NHẤT chứa điểm".
  const trongDo = pickHatchFace(idx, picks[0]);
  ok('bấm trong món đồ → vùng nhỏ nhất 700×500', trongDo !== null && Math.abs(polygonArea(trongDo) - 700 * 500) < 1);
  const trongPhong = pickHatchFace(idx, { x: 3600, y: 3100 });
  ok('bấm chỗ trống trong phòng → cả phòng 3800×3300', trongPhong !== null && Math.abs(polygonArea(trongPhong) - 3800 * 3300) < 1);
}

/* ───────── [2] Ca biên: tập đoạn rỗng / không mặt nào ───────── */
function testCaBien() {
  console.log('\n[2] Ca biên — không được nổ');
  const rong = buildHatchFaceIndex([]);
  ok('tập đoạn rỗng → 0 mặt', rong.faces.length === 0);
  ok('hỏi trên chỉ mục rỗng → null, không throw', pickHatchFace(rong, { x: 0, y: 0 }) === null);

  const hoLung = buildHatchFaceIndex([[{ x: 0, y: 0 }, { x: 100, y: 0 }], [{ x: 100, y: 0 }, { x: 100, y: 100 }]]);
  ok('đường gãy KHÔNG khép kín → 0 mặt', hoLung.faces.length === 0);
  ok('hỏi trong vùng hở → null', pickHatchFace(hoLung, { x: 50, y: 50 }) === null);

  const d = emptyDoc();
  uid = 0;
  rect(d, 0, 0, 1000, 1000);
  const mot = buildHatchFaceIndex(collectBoundarySegments(d));
  ok('1 chữ nhật → đúng 1 mặt', mot.faces.length === 1);
  ok('mỗi mặt có bbox 4 số', mot.bboxes.length === mot.faces.length * 4);
  ok('areas khớp số mặt', mot.areas.length === mot.faces.length);
}

/* ───────── [3] NHANH: đúng hình dạng công việc của docToObjScene ───────── */
function testTranThoiGian() {
  console.log('\n[3] Trần thời gian — N lần hỏi (hình dạng docToObjScene). Bản cũ ~173 s ở mức này.');
  const { doc, picks } = denseDoc(34, 2); // 1.156 phòng · 2.312 lần hỏi · 13.872 đoạn
  const segs = collectBoundarySegments(doc);

  const t0 = Date.now();
  const idx = buildHatchFaceIndex(segs);
  const dung = Date.now() - t0;

  const t1 = Date.now();
  let trung = 0;
  for (const p of picks) if (pickHatchFace(idx, p)) trung += 1;
  const hoi = Date.now() - t1;

  console.log(`      (${segs.length} đoạn · ${picks.length} lần hỏi → dựng ${dung} ms + hỏi ${hoi} ms)`);
  ok(`mọi điểm hỏi đều dò ra phòng (${trung}/${picks.length})`, trung === picks.length);
  ok(`tổng dưới 20 s (đo ${dung + hoi} ms; bản cũ ~173.000 ms)`, dung + hoi < 20_000);
  // Chốt an toàn cho ĐÚNG cái hồi quy cần chặn: nếu ai đó nhét lại `findHatchBoundary` vào vòng
  // lặp thì bước "hỏi" sẽ tự gánh chi phí dựng lại và phình lên gấp hàng trăm lần bước "dựng".
  ok(`bước hỏi RẺ hơn bước dựng ×3 (dựng ${dung} ms · hỏi ${hoi} ms)`, hoi < Math.max(dung * 3, 3_000));
}

testDungHetMoiDiem();
testCaBien();
testTranThoiGian();
console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
