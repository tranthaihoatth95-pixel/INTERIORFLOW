/**
 * lib/cad/hit-test-long-vung-to.test.ts — KHOÁ LUẬT CHỌN "BẤM GIỮA LÒNG VÙNG TÔ" (04/09).
 *
 * VÌ SAO CÓ TỆP NÀY: đo trên app thật cho thấy bấm vào GIỮA LÒNG một vùng tô thì
 * `hitTest` trả null (trục phải ghi "Chưa chọn đối tượng nào"), bấm vào BIÊN thì chọn được —
 * `hitTest` chỉ có phép đo khoảng cách tới đường biên, không có phép kiểm điểm-trong-đa-giác.
 * Mọi công cụ vẽ/CAD đều cho bấm vào lòng vùng tô đặc; bắt người dùng quây khung là bắt họ học
 * một luật riêng của IF.
 *
 * ⚠️ Phần đắt nhất của luật KHÔNG phải "bấm lòng thì chọn được" mà là **THỨ TỰ ƯU TIÊN**: vùng
 * tô không được ăn mất cú bấm vào vật nằm trên nó. Ca [3] và [4] khoá đúng chỗ đó — chúng là
 * lý do bài này tồn tại, không phải ca [1].
 *
 * ⚠️ Ca `SOLID` dựng THẬT (ca [2]), không suy từ mã: lượt trước chỉ đọc code thấy `hatch` đi
 * chung một nhánh cho `solid` và không-`solid` rồi kết luận, đó là lời khai chứ không phải phép
 * đo.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/hit-test-long-vung-to.test.ts
 */
import { hitTest } from './query';
import type { Doc, HatchEntity, LineEntity, Layer } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const LAY = 'l0';
const layers: Layer[] = [{ id: LAY, name: '0', color: '#fff', visible: true, locked: false }];
const TOL = 20; // dung sai hit-test (mm) — vùng tô dưới đây rộng hàng nghìn mm nên không lẫn

function doc(entities: Doc['entities']): Doc {
  return { units: 'mm', layers, entities } as unknown as Doc;
}

/** Vùng tô vuông [x0,y0]–[x1,y1]. `pattern` để trống = dữ liệu cũ (poché tường), coi như SOLID. */
function hatch(id: string, x0: number, y0: number, x1: number, y1: number, extra: Partial<HatchEntity> = {}): HatchEntity {
  return {
    id, type: 'hatch', layer: LAY,
    points: [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }],
    ...extra,
  } as HatchEntity;
}

function line(id: string, ax: number, ay: number, bx: number, by: number): LineEntity {
  return { id, type: 'line', layer: LAY, a: { x: ax, y: ay }, b: { x: bx, y: by } };
}

/* ── [1] BÀI GỐC — lòng vs biên ─────────────────────────────────────────────────────────────── */
function ca1() {
  console.log('\n[1] Bấm giữa LÒNG một vùng tô');
  const d = doc([hatch('h1', 0, 0, 4000, 3000)]);
  const giua = { x: 2000, y: 1500 };
  const bien = { x: 2000, y: 0 };

  ok('CŨ (không bật cờ) — lòng vẫn KHÔNG chọn được: luật cũ nguyên vẹn cho các lệnh sửa hình',
    hitTest(d, giua, TOL) === null);
  ok('MỚI — bấm giữa lòng chọn được vùng tô', hitTest(d, giua, TOL, { pickInsideFill: true }) === 'h1');
  ok('biên vẫn chọn được ở CẢ HAI đường (không phá hành vi cũ)',
    hitTest(d, bien, TOL) === 'h1' && hitTest(d, bien, TOL, { pickInsideFill: true }) === 'h1');
  ok('bấm NGOÀI vùng tô vẫn trả null ⇒ vẫn bỏ chọn được',
    hitTest(d, { x: 9000, y: 9000 }, TOL, { pickInsideFill: true }) === null);
}

/* ── [2] SOLID DỰNG THẬT ────────────────────────────────────────────────────────────────────── */
function ca2() {
  console.log('\n[2] Ba dạng vùng tô — SOLID tường minh · pattern gạch · dữ liệu cũ không khai');
  const giua = { x: 2000, y: 1500 };
  const solid = doc([hatch('s', 0, 0, 4000, 3000, { pattern: 'SOLID', solid: true })]);
  const ansi = doc([hatch('a', 0, 0, 4000, 3000, { pattern: 'ANSI31', patternScale: 1 })]);
  const cu = doc([hatch('c', 0, 0, 4000, 3000)]); // không `pattern`, không `solid` — poché tường cũ

  ok('SOLID (khai tường minh) — bấm giữa lòng chọn được', hitTest(solid, giua, TOL, { pickInsideFill: true }) === 's');
  ok('ANSI31 (nét gạch) — bấm giữa lòng cũng chọn được', hitTest(ansi, giua, TOL, { pickInsideFill: true }) === 'a');
  ok('dữ liệu cũ (thiếu cả pattern lẫn solid) — vẫn chọn được', hitTest(cu, giua, TOL, { pickInsideFill: true }) === 'c');
}

/* ── [3] VÙNG TÔ PHỦ LÊN VẬT KHÁC — chỗ dễ hỏng nhất ────────────────────────────────────────── */
function ca3() {
  console.log('\n[3] Vùng tô LỚN phủ lên vật khác — bấm trúng vật thì phải ra VẬT, không ra nền');
  const d = doc([
    hatch('nen', 0, 0, 10000, 8000),      // nền to, khai TRƯỚC (vẽ dưới)
    line('duong', 1000, 4000, 9000, 4000), // đường nằm trong lòng nền
  ]);
  ok('bấm ĐÚNG lên đường trong lòng nền → chọn ĐƯỜNG', hitTest(d, { x: 5000, y: 4000 }, TOL, { pickInsideFill: true }) === 'duong');
  ok('bấm gần đường (trong dung sai) vẫn ra ĐƯỜNG', hitTest(d, { x: 5000, y: 4010 }, TOL, { pickInsideFill: true }) === 'duong');
  ok('bấm chỗ TRỐNG trong lòng nền → mới ra nền', hitTest(d, { x: 5000, y: 1000 }, TOL, { pickInsideFill: true }) === 'nen');
}

/* ── [4] VÙNG TÔ LỒNG NHAU ──────────────────────────────────────────────────────────────────── */
function ca4() {
  console.log('\n[4] Vùng tô LỒNG nhau — lấy vùng TRONG CÙNG (diện tích nhỏ nhất)');
  const d = doc([
    hatch('to', 0, 0, 10000, 8000),
    hatch('nho', 3000, 3000, 5000, 5000),
  ]);
  ok('bấm trong vùng nhỏ → chọn vùng NHỎ (cùng luật pickHatchFace §4)',
    hitTest(d, { x: 4000, y: 4000 }, TOL, { pickInsideFill: true }) === 'nho');
  ok('bấm ngoài vùng nhỏ nhưng trong vùng to → chọn vùng TO',
    hitTest(d, { x: 8000, y: 7000 }, TOL, { pickInsideFill: true }) === 'to');

  // Hai vùng CHỒNG KHÍT — bằng diện tích thì cái vẽ SAU (đứng trên) thắng.
  const khit = doc([hatch('duoi', 0, 0, 4000, 3000), hatch('tren', 0, 0, 4000, 3000)]);
  ok('hai vùng chồng khít → chọn cái được VẼ SAU (đứng trên)',
    hitTest(khit, { x: 2000, y: 1500 }, TOL, { pickInsideFill: true }) === 'tren');
}

/* ── [5] LỚP ẨN / KHOÁ ──────────────────────────────────────────────────────────────────────── */
function ca5() {
  console.log('\n[5] Lớp ẩn hoặc khoá — lòng vùng tô KHÔNG được chọn (như biên)');
  const anLayers: Layer[] = [{ id: 'lx', name: 'ẩn', color: '#fff', visible: false, locked: false }];
  const khoaLayers: Layer[] = [{ id: 'lx', name: 'khoá', color: '#fff', visible: true, locked: true }];
  const h = { ...hatch('h', 0, 0, 4000, 3000), layer: 'lx' } as HatchEntity;
  const an = { units: 'mm', layers: anLayers, entities: [h] } as unknown as Doc;
  const khoa = { units: 'mm', layers: khoaLayers, entities: [h] } as unknown as Doc;
  ok('lớp ẩn → null', hitTest(an, { x: 2000, y: 1500 }, TOL, { pickInsideFill: true }) === null);
  ok('lớp khoá → null', hitTest(khoa, { x: 2000, y: 1500 }, TOL, { pickInsideFill: true }) === null);
}

/* ── [6] ĐA GIÁC KHÔNG LỒI + biên suy biến ──────────────────────────────────────────────────── */
function ca6() {
  console.log('\n[6] Đa giác chữ L (không lồi) + vùng tô suy biến < 3 đỉnh');
  const L: HatchEntity = {
    id: 'L', type: 'hatch', layer: LAY,
    points: [
      { x: 0, y: 0 }, { x: 6000, y: 0 }, { x: 6000, y: 2000 },
      { x: 2000, y: 2000 }, { x: 2000, y: 6000 }, { x: 0, y: 6000 },
    ],
  } as HatchEntity;
  const d = doc([L]);
  ok('điểm trong nhánh ngang của chữ L → chọn được', hitTest(d, { x: 4000, y: 1000 }, TOL, { pickInsideFill: true }) === 'L');
  ok('điểm trong nhánh dọc của chữ L → chọn được', hitTest(d, { x: 1000, y: 4000 }, TOL, { pickInsideFill: true }) === 'L');
  ok('điểm ở góc LÕM (ngoài chữ L, trong khung bao) → null, KHÔNG bắt theo khung bao',
    hitTest(d, { x: 4000, y: 4000 }, TOL, { pickInsideFill: true }) === null);

  const suyBien = doc([{ id: 'z', type: 'hatch', layer: LAY, points: [{ x: 0, y: 0 }, { x: 100, y: 0 }] } as HatchEntity]);
  ok('vùng tô 2 đỉnh (dữ liệu hỏng) → không sập, trả null ở lòng', hitTest(suyBien, { x: 50, y: 50 }, TOL, { pickInsideFill: true }) === null);
}

ca1();
ca2();
ca3();
ca4();
ca5();
ca6();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
