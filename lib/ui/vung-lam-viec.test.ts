/**
 * lib/ui/vung-lam-viec.test.ts — khoá luật NEO THEO TÂM VÙNG LÀM VIỆC.
 * Chạy: `node_modules/.bin/sucrase-node lib/ui/vung-lam-viec.test.ts`
 *
 * Ca 1 là ca chính: đổi nấc sidebar thì **tâm phải đi theo canvas**, không đứng yên theo cửa sổ.
 * Ca 4 khoá bậc thang nhường: đầu đề nhường TRƯỚC, neo đứng yên, chỉ chạm biên mới dịch.
 */

import { viTriO, viTriTamXo, KHE_O, type DoVungLamViec } from './vung-lam-viec';

let sai = 0;
const ok = (dieu: boolean, ten: string) => {
  if (!dieu) {
    sai += 1;
    console.error('✗', ten);
  }
};

const KHUNG = 1440;
const O_RONG = 132;
/** Ba nấc cột trái đang có thật: rail · thềm · bảng. */
const NAC = { rail: 52, them: 240, bang: 320 };
const dung = (trai: number, phaiChiem = 0): DoVungLamViec => ({
  trai,
  rong: KHUNG - trai - phaiChiem,
  khungRong: KHUNG,
  oRong: O_RONG,
  cumPhaiTrai: 1180,
  cumTraiPhai: 300,
});

/* 1 — TÂM ĐI THEO CANVAS, không theo cửa sổ */
{
  const r = { rail: viTriO(dung(NAC.rail)), them: viTriO(dung(NAC.them)), bang: viTriO(dung(NAC.bang)) };
  ok(r.rail.tam === Math.round(NAC.rail + (KHUNG - NAC.rail) / 2), `rail: tâm ${r.rail.tam}`);
  ok(r.them.tam === Math.round(NAC.them + (KHUNG - NAC.them) / 2), `thềm: tâm ${r.them.tam}`);
  ok(r.bang.tam === Math.round(NAC.bang + (KHUNG - NAC.bang) / 2), `bảng: tâm ${r.bang.tam}`);
  ok(r.rail.tam < r.them.tam && r.them.tam < r.bang.tam, 'cột trái rộng ra ⇒ tâm dời sang phải');
  ok(r.bang.tam - r.rail.tam === Math.round((NAC.bang - NAC.rail) / 2), 'dời đúng NỬA phần cột trái nở thêm');
  // và KHÔNG cái nào bằng tâm cửa sổ — nếu bằng thì luật này chưa chạy
  ok(r.them.tam !== KHUNG / 2, 'tâm vùng làm việc ≠ tâm cửa sổ');
}

/* 2 — inspector phải mọc ra ⇒ tâm dời sang TRÁI */
{
  const khong = viTriO(dung(NAC.them));
  const co = viTriO({ ...dung(NAC.them, 320), cumPhaiTrai: 1180 });
  ok(co.tam < khong.tam, 'mở inspector phải ⇒ tâm dời sang trái');
}

/* 3 — Peek rơi xuống với KHE HỞ = 0, và cùng tâm với ổ */
{
  const o = viTriO(dung(NAC.them));
  const DAY_HEADER = 42;
  const t = viTriTamXo({ tam: o.tam, day: DAY_HEADER }, 268, KHUNG);
  ok(t.tren === DAY_HEADER, `khe hở neo↔Peek phải = 0 (tren=${t.tren}, day ổ=${DAY_HEADER})`);
  ok(Math.abs(t.trai + 134 - o.tam) < 1, 'Peek cùng tâm với ổ');
}

/* 4 — BẬC THANG NHƯỜNG: ① đầu đề nhường trước · ② neo đứng yên · ④ chỉ chạm biên mới dịch */
{
  const rong = viTriO(dung(NAC.them));
  ok(!rong.daDich, 'màn rộng: neo KHÔNG dịch');

  // cụm phải-trên lấn vào ⇒ ổ chạm biên ⇒ mới được dịch
  const chat = viTriO({ ...dung(NAC.them), cumPhaiTrai: 700 });
  ok(chat.daDich, 'chật thật thì mới dịch');
  ok(chat.trai + O_RONG + KHE_O <= 700, 'dịch rồi vẫn KHÔNG chạm cụm phải-trên');

  // đầu đề dài ⇒ phải nhường TRƯỚC khi ổ phải nhúc nhích
  const dauDeDai = viTriO({ ...dung(NAC.them), cumTraiPhai: 900 });
  ok(dauDeDai.phaiNhuongDauDe, '① đầu đề dài ⇒ báo phải nén/cắt');
  ok(!dauDeDai.daDich, '② đầu đề dài KHÔNG được làm neo Vitals dịch đi');
  ok(dauDeDai.tranCumTrai === rong.tranCumTrai, 'trần cụm trái không đổi vì đầu đề dài');
}

/* 5 — không bao giờ tràn mép trái, kể cả khung rất hẹp */
{
  const hep = viTriO({ trai: 0, rong: 360, khungRong: 360, oRong: O_RONG, cumPhaiTrai: 200, cumTraiPhai: 100 });
  ok(hep.trai >= KHE_O, `khung hẹp: trai=${hep.trai} phải ≥ ${KHE_O}`);
}

if (sai > 0) {
  console.error(`\n${sai} khẳng định hỏng`);
  process.exit(1);
}
console.log('vung-lam-viec.test.ts — OK');
