/**
 * scripts/proof/tuong-tu-hinh-hoc.ts — ĐO trên bản vẽ nghề thật + vẽ ảnh đối chiếu.
 *
 * Chạy:
 *   node_modules/.bin/sucrase-node scripts/proof/tuong-tu-hinh-hoc.ts "<đường dẫn>.dxf"
 *
 * 🔴 **TỆP NÀY KHÔNG CÒN GIỮ THUẬT TOÁN.** Từ IF-301 (29/08) thuật toán sống ở
 * `lib/cad/tuong-hinh-hoc.ts` — trong MÃ SẢN PHẨM, sau cờ `NEXT_PUBLIC_IF_TUONG_HINH_HOC`, có test
 * riêng. Ở đây chỉ còn: nạp tệp → gọi module → in số đo → vẽ SVG.
 *
 * Vì sao phải gọi module chứ không giữ bản sao (luật 6): bản chép tay ở đây ĐÃ phân kỳ một lần và
 * phân kỳ ấy im lặng — nó đọc `e.pts` trong khi model của IF đặt tên `points`
 * (`model.ts` `PolylineEntity`), nên **bỏ sạch 1.858 cạnh polyline** của tệp đo mà không nổ, không
 * cảnh báo, chỉ ra ít tường hơn. Mọi con số phép thử công bố trước 29/08 đều tính thiếu vì lý do đó.
 *
 * KHÔNG chép tệp DXF khách vào repo (luật cứng 24/07) — truyền đường dẫn, đọc tại chỗ.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { parseDxfEx } from '../../lib/cad/dxf';
import { docDoanThang, nhanDienTuong, TUONG_MAC_DINH } from '../../lib/cad/tuong-hinh-hoc';

const duongDan = process.argv[2];
if (!duongDan) {
  console.error('Thiếu đường dẫn tệp .dxf.\n  sucrase-node scripts/proof/tuong-tu-hinh-hoc.ts "<tệp>.dxf"');
  process.exit(1);
}

const doc = parseDxfEx(readFileSync(duongDan, 'latin1')).doc;
const tenLayer = new Map(doc.layers.map((l) => [l.id, l.name ?? l.id]));

const t0 = Date.now();
const { tuong, doDem } = nhanDienTuong(doc);
const ms = Date.now() - t0;

console.log(`\n${duongDan}`);
console.log(`entity nạp được: ${doc.entities.length}  ·  nét thẳng > ${TUONG_MAC_DINH.minDaiNetMm}mm: ${doDem.netThang}`);
console.log(`\nBỐN BƯỚC ĐỌC NGƯỢC (${ms} ms):`);
console.log(`  ① ĐẢO OFFSET  ${String(doDem.capUngVien).padStart(5)} cặp ứng viên → ${doDem.sauGhepDoi} mảnh (ghép đôi ĐỘC QUYỀN)`);
console.log(`  ② ĐẢO TRIM    ${String(doDem.sauGhepDoi).padStart(5)} mảnh        → ${doDem.sauDaoTrim} tường liền`);
console.log(`  ③ ĐẢO ARRAY   loại ${doDem.loaiBoiArray} vật bước đều → ${doDem.sauDaoArray} còn lại`);
console.log(`  ④ GỘP CHÙM    ${String(doDem.sauDaoArray).padStart(5)} trục        → ${doDem.sauGopChum} tường (BAO NGOÀI)`);
console.log(`\n⇒ TƯỜNG: ${tuong.length}  ·  tổng chiều dài ${(doDem.tongDaiMm / 1000).toFixed(1)} m`);
console.log('   bề dày:', Object.entries(doDem.beDay).sort((a, b) => b[1] - a[1]).slice(0, 8)
  .map(([k, v]) => `${k}mm×${v}`).join(' · '));
{
  const t = new Map<string, number>();
  for (const w of tuong) { const n = tenLayer.get(w.layer) ?? w.layer; t.set(n, (t.get(n) ?? 0) + 1); }
  console.log('   layer: ', [...t].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}×${v}`).join(' · '));
}

/* ── VẼ RA: bản vẽ gốc (nhạt) + tường IF nhận ra (đậm) ── */
const nets = docDoanThang(doc);
let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
for (const s of nets) for (const p of [s.a, s.b]) {
  minx = Math.min(minx, p.x); miny = Math.min(miny, p.y);
  maxx = Math.max(maxx, p.x); maxy = Math.max(maxy, p.y);
}
if (Number.isFinite(minx)) {
  const W = maxx - minx, H = maxy - miny, S = 1600 / Math.max(W, H);
  const X = (x: number) => ((x - minx) * S).toFixed(1);
  const Y = (y: number) => ((maxy - y) * S).toFixed(1);
  const nen = nets.map((s) => `<line x1="${X(s.a.x)}" y1="${Y(s.a.y)}" x2="${X(s.b.x)}" y2="${Y(s.b.y)}"/>`).join('');
  const veTuong = tuong.map((t) =>
    `<line x1="${X(t.ax)}" y1="${Y(t.ay)}" x2="${X(t.bx)}" y2="${Y(t.by)}" stroke-width="${Math.max(1.2, t.d * S)}"/>`).join('');
  const ra = process.argv[3] ?? '/tmp/tuong-nhan-ra.svg';
  writeFileSync(ra,
`<svg xmlns="http://www.w3.org/2000/svg" width="${(W * S).toFixed(0)}" height="${(H * S).toFixed(0)}" viewBox="0 0 ${(W * S).toFixed(0)} ${(H * S).toFixed(0)}">
<rect width="100%" height="100%" fill="#F7F9FA"/>
<g stroke="#C6CFD6" stroke-width="0.7" fill="none">${nen}</g>
<g stroke="#B03528" stroke-linecap="butt" opacity="0.75" fill="none">${veTuong}</g>
</svg>`);
  console.log(`\n🖼  ${ra}  ·  ${(W / 1000).toFixed(1)} × ${(H / 1000).toFixed(1)} m`);
}
