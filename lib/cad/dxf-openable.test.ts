/**
 * lib/cad/dxf-openable.test.ts — CHỐT CHẶN G-M1-18: file DXF do IF ghi ra phải MỞ ĐƯỢC bằng phần
 * mềm CAD khác, không chỉ bằng parser của chính IF.
 * Chạy: `node_modules/.bin/sucrase-node lib/cad/dxf-openable.test.ts`
 *
 * ⚠️ ĐỌC TRƯỚC KHI SỬA: test này KHÔNG phải bằng chứng gốc. Bằng chứng gốc là chạy `ezdxf` (bộ đọc
 * DXF độc lập, Python) trên file thật — kết quả 06/08 sau khi vá:
 *
 *   file  msp   INSERT  định-nghĩa-block  hình sau khi BUNG block  lỗi audit
 *   F1    975    457      29                12.274                  0
 *   F2    735    383      31                11.775                  0
 *   F3    805    378      29                10.085                  0
 *   F4    720    372      28                 9.891                  0
 *   F5    717    371      30                10.035                  0
 *   F6    146     91      25                 2.984                  0
 *
 * Cột "sau khi bung block" khớp TUYỆT ĐỐI với số entity trong `Doc` ⇒ người nhận bản vẽ thấy đủ
 * hình, và thấy chúng dưới dạng KHỐI thật (đó là điều G-M1-07 hứa mà trước đây chỉ chứng minh
 * được bằng chính parser của IF — lập luận vòng tròn).
 *
 * Trước khi vá: **6/6 file hỏng**, cả chế độ cứu hộ của `ezdxf` cũng bó tay. Hai nguyên nhân, cô
 * lập bằng file tối thiểu một-entity:
 *   1. `LWPOLYLINE` thiếu `100 AcDbPolyline` → `DXFStructureError`
 *   2. `HATCH` thiếu `100 AcDbHatch` → `IndexError` (bộ đọc đòi đủ 3 lớp con)
 * LINE · CIRCLE · ARC · TEXT · DIMENSION mở sạch dù không có dấu lớp con — nên KHÔNG đụng tới
 * chúng (xem docstring `writePoly` trong `dxf.ts`).
 *
 * File .ts này khoá phần kiểm được bằng TypeScript thuần: **dấu lớp con có mặt, đúng thứ tự**.
 * `ezdxf` là công cụ Python, không chạy trong `npm test` được — nên nếu bạn đổi bộ ghi DXF, hãy
 * chạy lại bằng tay và cập nhật bảng trên.
 */

import { exportDxf, parseDxf } from './dxf';
import type { Doc, Entity, Layer } from './model';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean, extra = '') {
  if (cond) { pass += 1; console.log(`  ok  - ${name}`); }
  else { fail += 1; console.log(`  FAIL - ${name}${extra ? ` — ${extra}` : ''}`); }
}

const layers: Layer[] = [{ id: 'L1', name: 'A-Wall', color: '#ffffff', visible: true, locked: false }];
const doc = (entities: Entity[]): Doc => ({ entities, layers });
const PTS = [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 800 }];

/** Cắt chuỗi DXF thành các record `[kind, [ [code, value], … ] ]` — đọc thứ tự group code THẬT. */
function records(dxf: string): { kind: string; codes: [number, string][] }[] {
  const raw = dxf.split(/\r?\n/);
  const out: { kind: string; codes: [number, string][] }[] = [];
  for (let i = 0; i + 1 < raw.length; i += 2) {
    const code = parseInt(raw[i].trim(), 10);
    const val = raw[i + 1];
    if (code === 0) out.push({ kind: val.trim(), codes: [] });
    else if (out.length) out[out.length - 1].codes.push([code, val]);
  }
  return out;
}
const firstOf = (dxf: string, kind: string) => records(dxf).find((r) => r.kind === kind);
/** Vị trí của group code trong record (−1 = không có). */
const at = (r: { codes: [number, string][] }, code: number, val?: string) =>
  r.codes.findIndex(([c, v]) => c === code && (val === undefined || v.trim() === val));

console.log('\n[1] LWPOLYLINE — đủ 2 dấu lớp con, ĐÚNG THỨ TỰ');
{
  const dxf = exportDxf(doc([{ id: 'e1', type: 'polyline', layer: 'L1', points: PTS, closed: true }]));
  const r = firstOf(dxf, 'LWPOLYLINE');
  ok('có ghi LWPOLYLINE', !!r);
  if (r) {
    const ent = at(r, 100, 'AcDbEntity');
    const poly = at(r, 100, 'AcDbPolyline');
    const lay = at(r, 8);
    const count = at(r, 90);
    ok('có 100 AcDbEntity', ent >= 0, JSON.stringify(r.codes.slice(0, 4)));
    ok('có 100 AcDbPolyline', poly >= 0);
    ok('AcDbEntity đứng TRƯỚC layer (8)', ent >= 0 && ent < lay, `${ent} < ${lay}`);
    ok('AcDbPolyline đứng TRƯỚC số đỉnh (90) — chỗ bộ đọc dò dữ liệu đỉnh', poly >= 0 && poly < count, `${poly} < ${count}`);
    ok('hai dấu KHÔNG đảo nhau', ent < poly, `${ent} < ${poly}`);
  }
}

console.log('\n[2] HATCH có pattern — đủ AcDbEntity + AcDbHatch');
{
  const dxf = exportDxf(doc([{ id: 'e2', type: 'hatch', layer: 'L1', points: PTS, pattern: 'ANSI31' }]));
  const r = firstOf(dxf, 'HATCH');
  ok('có ghi HATCH', !!r);
  if (r) {
    const ent = at(r, 100, 'AcDbEntity');
    const hat = at(r, 100, 'AcDbHatch');
    ok('có 100 AcDbEntity', ent >= 0);
    ok('có 100 AcDbHatch', hat >= 0);
    ok('AcDbEntity trước, AcDbHatch sau', ent >= 0 && ent < hat, `${ent} < ${hat}`);
    ok('AcDbHatch đứng TRƯỚC tên pattern (2)', hat >= 0 && hat < at(r, 2), `${hat} < ${at(r, 2)}`);
  }
}

console.log('\n[3] HATCH tô đặc KHÔNG pattern — G-M1-14: nay ra HATCH thật (SOLID), đủ dấu lớp con');
{
  // TRƯỚC 07/08 ca này khoá "hatch solid không pattern → LWPOLYLINE" — chính hành vi làm poché
  // tường chết ở vòng xuất→nhập (G-M1-14: mảng tô quay về polyline, mất neo). Nay hatch SOLID đi
  // đường HATCH thật với pattern 'SOLID'; điều file test này canh (đủ dấu lớp con) vẫn phải đúng.
  const dxf = exportDxf(doc([{ id: 'e3', type: 'hatch', layer: 'L1', points: PTS, solid: true }]));
  const r = firstOf(dxf, 'HATCH');
  ok('ghi ra bằng HATCH thật (không còn rơi về LWPOLYLINE)', !!r);
  ok('đủ 2 dấu lớp con AcDbEntity + AcDbHatch', !!r && at(r, 100, 'AcDbEntity') >= 0 && at(r, 100, 'AcDbHatch') >= 0);
  ok('tên pattern là SOLID', !!r && at(r, 2, 'SOLID') >= 0);
}

console.log('\n[4] Dấu lớp con KHÔNG phá parser của chính IF (round-trip vẫn nguyên)');
{
  const src = doc([
    { id: 'e1', type: 'polyline', layer: 'L1', points: PTS, closed: true },
    { id: 'e2', type: 'hatch', layer: 'L1', points: PTS, pattern: 'ANSI31' },
    { id: 'e3', type: 'line', layer: 'L1', a: { x: 0, y: 0 }, b: { x: 100, y: 0 } },
  ]);
  const back = parseDxf(exportDxf(src));
  const kinds = (d: Doc) => d.entities.map((e) => e.type).sort().join(',');
  ok('đủ 3 hình', back.entities.length === 3, String(back.entities.length));
  ok('đúng từng loại', kinds(back) === kinds(src), `${kinds(back)} vs ${kinds(src)}`);
  const pl = back.entities.find((e) => e.type === 'polyline') as Extract<Entity, { type: 'polyline' }> | undefined;
  ok('đủ 3 đỉnh, không nuốt đỉnh nào', pl?.points.length === 3, String(pl?.points.length));
  ok('giữ cờ đóng', pl?.closed === true);
}

console.log('\n[5] Các entity KHÔNG đụng tới — chứng minh bản vá đúng phạm vi');
{
  const dxf = exportDxf(doc([
    { id: 'e1', type: 'line', layer: 'L1', a: { x: 0, y: 0 }, b: { x: 100, y: 0 } },
    { id: 'e2', type: 'circle', layer: 'L1', c: { x: 0, y: 0 }, r: 50 },
    { id: 'e3', type: 'text', layer: 'L1', at: { x: 0, y: 0 }, text: 'A', h: 250 },
  ]));
  for (const k of ['LINE', 'CIRCLE', 'TEXT']) {
    const r = firstOf(dxf, k);
    ok(`${k} giữ nguyên, không thêm dấu lớp con (đo được: bộ đọc chuẩn vẫn mở sạch)`, !!r && at(r, 100) < 0);
  }
}

console.log(`\ndxf-openable.test.ts — ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
