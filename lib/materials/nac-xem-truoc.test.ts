/**
 * lib/materials/nac-xem-truoc.test.ts — NGƯỠNG BA NẤC SỐNG Ở ĐÂY (V2, 05/09).
 *
 * Bốn khẳng định khoá cứng theo spec §5.5. Ca đắt nhất là ca **32 px PHẢI ĐỎ**: đó đúng là cỡ ô
 * đang chạy trên app hôm nay, nên nếu ca này xanh thì cả hợp đồng vô nghĩa.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/materials/nac-xem-truoc.test.ts
 */
import { nacXemTruoc, LAN_KHAC_KHO, SAN_PX } from './nac-xem-truoc';
import { VAT_LIEU_HAT_GIONG } from './hat-giong';
import type { MaterialPbr } from './schema';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean, detail?: string) {
  if (cond) pass += 1;
  else { fail += 1; console.error('  ✗', name, detail ?? ''); }
}

const SOI = VAT_LIEU_HAT_GIONG[0].pbr;

console.log('BỐN KHẲNG ĐỊNH CỦA SPEC §5.5');
ok('judge @168 px ⇒ ĐẠT', nacXemTruoc(SOI, 'judge', 168).datNguong === true, JSON.stringify(nacXemTruoc(SOI, 'judge', 168)));
ok('judge @32 px ⇒ ĐỎ (đúng cỡ ô đang chạy hôm nay)', nacXemTruoc(SOI, 'judge', 32).datNguong === false);
for (const v of VAT_LIEU_HAT_GIONG) {
  const j = nacXemTruoc(v.pbr, 'judge', 168), i = nacXemTruoc(v.pbr, 'inspect', 168);
  ok(`${v.code}: span(inspect) ≥ ${LAN_KHAC_KHO}× span(judge)`,
    (i.spanMm ?? 0) >= LAN_KHAC_KHO * (j.spanMm ?? Infinity), `${i.spanMm} vs ${j.spanMm}`);
}
const khongKhoi: MaterialPbr = { ...SOI, uvScaleMm: undefined };
ok('thiếu uvScaleMm ⇒ inspect.spanMm null', nacXemTruoc(khongKhoi, 'inspect', 200).spanMm === null);
ok('thiếu uvScaleMm ⇒ có lý do bằng chữ', !!nacXemTruoc(khongKhoi, 'inspect', 200).lyDo);

/* 🔴 05/09 — HAI DÒNG DƯỚI TỪNG GHIM SỐ 1200 VÀO TEST. Khi tầng hạt giống nhận ảnh vân thật,
   `uvScaleMm` đổi sang `{ w: 190, h: 1200 }` (vân trong ảnh chạy theo trục ĐỨNG ⇒ trục đứng là
   chiều DÀI ván, trục ngang là bề RỘNG 190 mm) — và hai dòng đó đỏ, dù hợp đồng không sai một
   li. Ghim DỮ LIỆU vào test đo HỢP ĐỒNG là bắt hợp đồng chịu tội cho một thay đổi dữ liệu.
   ⇒ Suy từ `w` thật; giữ RIÊNG một tripwire cho chính con số đó, để đổi dữ liệu vẫn phải đi qua
   một dòng đỏ có tên, không trôi im lặng. */
const W = SOI.uvScaleMm!.w;
console.log(`SỐ CỦA GỖ SỒI — suy từ uvScaleMm.w THẬT của món đang ship (${W} mm)`);
ok('tripwire: bề rộng tấm ván đang ship = 190 mm', W === 190, String(W));
ok('judge spanMm = 25 (khung soi CHẤT, hằng số của hợp đồng)', nacXemTruoc(SOI, 'judge', 168).spanMm === 25);
ok('judge repeat = 25 / w', Math.abs((nacXemTruoc(SOI, 'judge', 168).repeat ?? 0) - 25 / W) < 1e-9);
ok('inspect spanMm = 1,5 × w', nacXemTruoc(SOI, 'inspect', 168).spanMm === 1.5 * W);
ok('inspect repeat = 1,5', nacXemTruoc(SOI, 'inspect', 168).repeat === 1.5);
ok('inspect vẫn rộng gấp ≥10 lần judge (nếu không, nấc bị KHOÁ)', (nacXemTruoc(SOI, 'inspect', 168).spanMm ?? 0) >= 10 * 25);
ok('hai nấc KHÔNG thể là cùng một ảnh', nacXemTruoc(SOI, 'judge', 168).repeat !== nacXemTruoc(SOI, 'inspect', 168).repeat);

console.log('SÀN PX TỪNG NẤC');
ok('scan @44 ⇒ đạt', nacXemTruoc(SOI, 'scan', 44).datNguong === true);
ok('scan @43 ⇒ đỏ', nacXemTruoc(SOI, 'scan', 43).datNguong === false);
ok('scan KHÔNG khai khổ (không hứa điều chưa hứa)', nacXemTruoc(SOI, 'scan', 44).spanMm === null);
ok('judge @79 ⇒ đỏ vì sàn px', nacXemTruoc(SOI, 'judge', 79).datNguong === false);
ok('sàn scan = 44 · judge = 80', SAN_PX.scan === 44 && SAN_PX.judge === 80);

console.log('CHƯA ĐẠT LÀ PHẢI NÓI ĐƯỢC VÌ SAO — không ô mờ câm');
for (const nac of ['scan', 'judge', 'inspect'] as const) {
  const r = nacXemTruoc(SOI, nac, 10);
  ok(`${nac} chưa đạt ⇒ có lyDo`, r.datNguong === false && !!r.lyDo);
  ok(`${nac} đạt ⇒ lyDo null`, nacXemTruoc(SOI, nac, 400).datNguong === false || nacXemTruoc(SOI, nac, 400).lyDo === null);
}
ok('không có PBR ⇒ đỏ kèm lý do', nacXemTruoc(null, 'judge', 200).lyDo === 'chưa có thông số render cho mã này');
ok('px vô nghĩa (NaN) ⇒ đỏ, không throw', nacXemTruoc(SOI, 'judge', Number.NaN).datNguong === false);

console.log('NẤC TO PHẢI THÊM ĐƯỢC GÌ ĐÓ — vật liệu lặp vân nhỏ thì INSPECT bị KHOÁ');
const gachNho: MaterialPbr = { ...SOI, uvScaleMm: { w: 20, h: 20 } };
const iNho = nacXemTruoc(gachNho, 'inspect', 200);
ok('gạch 20 mm ⇒ inspect khoá', iNho.datNguong === false && iNho.spanMm === null);
ok('và nói rõ vì sao', (iNho.lyDo ?? '').includes('phóng to'), iNho.lyDo ?? '');
ok('nhưng judge của nó vẫn chạy', nacXemTruoc(gachNho, 'judge', 200).datNguong === true);

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
