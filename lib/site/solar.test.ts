import assert from 'node:assert';
import { mocLan, muiGioTuKinhDo, ngayTrongNam, phutThanhHHMM, tomTatMatTroi, viTriMatTroi } from './solar';

let pass = 0;
function test(name: string, fn: () => void) {
  fn();
  pass++;
  console.log(`  ✓ ${name}`);
}

const HN = { lat: 21.0285, lng: 105.8542, tz: 420 };

test('ngày trong năm: 01/01=1 · 31/12/2026=365 · 29/02/2024 nhuận=60', () => {
  assert.strictEqual(ngayTrongNam({ y: 2026, m: 1, d: 1 }), 1);
  assert.strictEqual(ngayTrongNam({ y: 2026, m: 12, d: 31 }), 365);
  assert.strictEqual(ngayTrongNam({ y: 2024, m: 2, d: 29 }), 60);
});

test('Hà Nội 21/06: mọc ~05:15, lặn ~18:40 (±15 phút so almanac), ngày dài >13h', () => {
  const m = mocLan(HN.lat, HN.lng, { y: 2026, m: 6, d: 21 }, HN.tz);
  assert.ok(m.binhMinhPhut !== null && Math.abs(m.binhMinhPhut - (5 * 60 + 15)) <= 15, `mọc ${phutThanhHHMM(m.binhMinhPhut)}`);
  assert.ok(m.hoangHonPhut !== null && Math.abs(m.hoangHonPhut - (18 * 60 + 40)) <= 15, `lặn ${phutThanhHHMM(m.hoangHonPhut)}`);
  assert.ok(m.hoangHonPhut! - m.binhMinhPhut! > 13 * 60);
});

test('độ cao giữa trưa = 90 − |lat − xích vĩ| (Hà Nội 21/06 ≈ 87.6°)', () => {
  const m = mocLan(HN.lat, HN.lng, { y: 2026, m: 6, d: 21 }, HN.tz);
  assert.ok(Math.abs(m.doCaoGiuaTruaDo - 87.6) < 0.5, String(m.doCaoGiuaTruaDo));
});

test('xích đạo xuân phân: ngày ~12h07 (khúc xạ), phương vị mọc ≈ 90°', () => {
  const m = mocLan(0, 0, { y: 2026, m: 3, d: 20 }, 0);
  const dai = m.hoangHonPhut! - m.binhMinhPhut!;
  assert.ok(Math.abs(dai - 727) < 6, String(dai));
  const v = viTriMatTroi(0, 0, { y: 2026, m: 3, d: 20 }, m.binhMinhPhut! / 60, 0);
  assert.ok(Math.abs(v.phuongViDo - 90) < 3, String(v.phuongViDo));
});

test('Bắc bán cầu mùa hè: mặt trời mọc lệch Đông-Bắc (<90°), lặn lệch Tây-Bắc (>270°)', () => {
  const s = tomTatMatTroi(HN.lat, HN.lng, { y: 2026, m: 6, d: 21 }, HN.tz);
  assert.ok(s.phuongViBinhMinhDo !== null && s.phuongViBinhMinhDo < 90 && s.phuongViBinhMinhDo > 50, String(s.phuongViBinhMinhDo));
  assert.ok(s.phuongViHoangHonDo !== null && s.phuongViHoangHonDo > 270 && s.phuongViHoangHonDo < 310, String(s.phuongViHoangHonDo));
  assert.strictEqual(s.muiGioUocTinh, false);
  // Hà Nội 21/06: xích vĩ 23.45° > vĩ độ 21.03° ⇒ giữa trưa mặt trời ở phía BẮC (phương vị ~0/360)
  assert.ok(s.phuongViGiuaTruaDo > 330 || s.phuongViGiuaTruaDo < 30, String(s.phuongViGiuaTruaDo));
  const dongHN = tomTatMatTroi(HN.lat, HN.lng, { y: 2026, m: 12, d: 21 }, HN.tz);
  assert.ok(Math.abs(dongHN.phuongViGiuaTruaDo - 180) < 10, String(dongHN.phuongViGiuaTruaDo));
});

test('vùng cực mùa hè: không mọc/lặn → null, không NaN, không throw', () => {
  const s = tomTatMatTroi(78.2, 15.6, { y: 2026, m: 6, d: 21 }, 120);
  assert.strictEqual(s.binhMinh, null);
  assert.strictEqual(s.hoangHon, null);
  assert.strictEqual(s.doDaiNgayPhut, null);
  assert.ok(Number.isFinite(s.doCaoGiuaTruaDo));
});

test('Nam bán cầu: "chí hè" là 21/12 (độ cao giữa trưa chí hè > chí đông)', () => {
  const s = tomTatMatTroi(-33.87, 151.21, { y: 2026, m: 3, d: 1 }, 600);
  assert.ok(s.chiHe.doCaoGiuaTruaDo > s.chiDong.doCaoGiuaTruaDo);
});

test('thiếu múi giờ → ước từ kinh độ, gắn cờ muiGioUocTinh', () => {
  assert.strictEqual(muiGioTuKinhDo(105.85), 420);
  assert.strictEqual(muiGioTuKinhDo(-74), -300);
  const s = tomTatMatTroi(HN.lat, HN.lng, { y: 2026, m: 6, d: 21 }, undefined);
  assert.strictEqual(s.muiGioUocTinh, true);
  assert.strictEqual(s.muiGioPhut, 420);
});

test('phutThanhHHMM: 0→00:00 · 1439→23:59 · 1500→01:00 (quay vòng) · null→null', () => {
  assert.strictEqual(phutThanhHHMM(0), '00:00');
  assert.strictEqual(phutThanhHHMM(1439), '23:59');
  assert.strictEqual(phutThanhHHMM(1500), '01:00');
  assert.strictEqual(phutThanhHHMM(null), null);
});

console.log(`solar: ${pass} pass`);
