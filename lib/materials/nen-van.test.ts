/**
 * lib/materials/nen-van.test.ts — canh V5: **ba nấc chi tiết là ba công năng, không phải ba cỡ**.
 *
 * Hai khẳng định đắt nhất, cả hai đều là điều đã bị làm sai một lần rồi:
 *  ① nấc JUDGE **không được khai khổ** (vân procedural chưa hiệu chuẩn theo mm ⇒ vẽ thước là
 *    nói dối), còn INSPECT thì phải khai — nếu cả hai giống nhau thì V5 lại thành "ảnh phóng to".
 *  ② tấm vân nguồn **không bao giờ vượt trần** — cửa vào ca `AdPreviewGenerator` của Revit.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/materials/nen-van.test.ts
 */
import { nenVanNac, thuocMm, docKhoMm, TRAN_TILE_PX, SAN_TILE_PX } from './nen-van';
import { nacXemTruoc } from './nac-xem-truoc';
import type { MaterialPbr } from './schema';

let pass = 0, fail = 0;
function ok(name: string, cond: boolean, detail?: string) {
  if (cond) pass += 1; else { fail += 1; console.error('  ✗', name, detail ?? ''); }
}

/** Đúng thông số vật liệu hạt giống đang ship (`hat-giong.ts`) — không dựng số giả. */
const SOI: MaterialPbr = { baseColor: '#b98a54', roughness: 0.6, metallic: 0, uvScaleMm: { w: 1200, h: 190 }, typeId: 'go' };

console.log('BA NẤC CHI TIẾT KHÁC NHAU Ở LOẠI THÔNG TIN, KHÔNG Ở CỠ');
const bandRong = 400;
const nScan = nenVanNac('scan', nacXemTruoc(SOI, 'scan', 44), 44)!;
const nJudge = nenVanNac('judge', nacXemTruoc(SOI, 'judge', 168), bandRong)!;
const nInspect = nenVanNac('inspect', nacXemTruoc(SOI, 'inspect', 168), bandRong)!;
ok('cả ba nấc đều dựng được với vật liệu ship sẵn', !!nScan && !!nJudge && !!nInspect);
ok('SCAN không khai khổ', nScan.khaiKho === false);
ok('JUDGE KHÔNG khai khổ — vân procedural chưa hiệu chuẩn mm', nJudge.khaiKho === false);
ok('INSPECT khai khổ', nInspect.khaiKho === true);
ok('chỉ INSPECT lát lặp (mạch nối là thông tin của riêng nấc này)',
  nScan.lapNen === 'no-repeat' && nJudge.lapNen === 'no-repeat' && nInspect.lapNen === 'repeat');
ok('INSPECT không dùng cover — cover là mất tỉ lệ', !nInspect.coNen.includes('cover') && nInspect.coNen.includes('px'));

console.log('INSPECT LÁT ĐÚNG SỐ — 1200 mm lặp trong khung 1800 mm ⇒ tấm vẽ rộng 2/3 khung');
const kqI = nacXemTruoc(SOI, 'inspect', 168);
ok('khung soi = 1,5 module = 1800 mm', kqI.spanMm === 1800, String(kqI.spanMm));
ok('lặp 1,5 lần', Math.abs((kqI.repeat ?? 0) - 1.5) < 1e-9, String(kqI.repeat));
ok('bề rộng tấm vẽ = 400 / 1,5 ≈ 267 px', nInspect.coNen.startsWith('267px'), nInspect.coNen);
ok('không khai tỉ lệ ⇒ chiều cao "auto", không bịa một khổ vuông', nInspect.coNen.endsWith(' auto'), nInspect.coNen);

console.log('VÁN 1200×190 PHẢI RA MẠCH NGANG — tỉ lệ thật, không tấm vuông');
const nVan = nenVanNac('inspect', kqI, bandRong, 190 / 1200)!;
ok('tấm vẽ 267 × 42 px (đúng 190/1200)', nVan.coNen === '267px 42px', nVan.coNen);
ok('tỉ lệ 0 hoặc âm ⇒ về auto, không chia cho rác',
  nenVanNac('inspect', kqI, bandRong, 0)!.coNen.endsWith(' auto'));

console.log('TRẦN CHI PHÍ — khung to cỡ nào tấm vân cũng không nổ');
for (const rong of [400, 1200, 4000]) {
  const n = nenVanNac('judge', nacXemTruoc(SOI, 'judge', 168), rong)!;
  ok(`khung ${rong}px ⇒ tấm ≤ ${TRAN_TILE_PX}`, n.canhTile <= TRAN_TILE_PX, String(n.canhTile));
  ok(`khung ${rong}px ⇒ tấm ≥ ${SAN_TILE_PX}`, n.canhTile >= SAN_TILE_PX, String(n.canhTile));
}
ok('INSPECT khung rất hẹp vẫn không tụt dưới sàn',
  (nenVanNac('inspect', kqI, 60)!).canhTile >= SAN_TILE_PX);
for (const rong of [401, 403, 418, 419, 997]) {
  const n = nenVanNac('inspect', kqI, rong)!;
  ok(`khung ${rong}px ⇒ cạnh tấm ${n.canhTile} chia hết cho 4 (cỡ lẻ từng cho ra tấm đen)`, n.canhTile % 4 === 0);
}

console.log('NẤC CHƯA ĐỨNG ĐƯỢC ⇒ TRẢ NULL, KHÔNG LÁT BỪA');
ok('ô 32 px ở JUDGE (ca hôm nay) ⇒ null', nenVanNac('judge', nacXemTruoc(SOI, 'judge', 32), 400) === null);
const khongUv: MaterialPbr = { baseColor: '#b98a54', typeId: 'go' };
ok('thiếu uvScaleMm ⇒ INSPECT null, không lấy khổ mặc định',
  nenVanNac('inspect', nacXemTruoc(khongUv, 'inspect', 168), 400) === null);
ok('không có PBR ⇒ null', nenVanNac('judge', nacXemTruoc(null, 'judge', 168), 400) === null);

console.log('THƯỚC mm — 4..10 khoảng, bước quen mắt bản vẽ');
for (const span of [25, 190, 1800, 3000, 12000]) {
  const t = thuocMm(span)!;
  const soKhoang = span / t.buocMm;
  ok(`span ${span} ⇒ ${soKhoang.toFixed(1)} khoảng, trong [3,10]`, soKhoang >= 3 && soKhoang <= 10, `bước=${t.buocMm}`);
  ok(`span ${span} ⇒ mốc đầu là 0`, t.mocMm[0] === 0);
  ok(`span ${span} ⇒ mốc cuối không vượt khung`, t.mocMm[t.mocMm.length - 1] <= span + 1e-9);
}
ok('span vô nghĩa ⇒ null', thuocMm(0) === null && thuocMm(-5) === null);

console.log('ĐỌC KHỔ — luôn có đơn vị, không bao giờ số trần');
ok('1800 ⇒ "1,8 m"', docKhoMm(1800) === '1,8 m', docKhoMm(1800));
ok('25 ⇒ "25 mm"', docKhoMm(25) === '25 mm', docKhoMm(25));
ok('1200 ⇒ "1,2 m"', docKhoMm(1200) === '1,2 m', docKhoMm(1200));
ok('0 ⇒ "—", không bịa số', docKhoMm(0) === '—');

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
