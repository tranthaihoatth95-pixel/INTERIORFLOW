/**
 * lib/three/lighting.test.ts — VIỆC 4 (lighting core).
 * Chạy: node_modules/.bin/sucrase-node lib/three/lighting.test.ts
 *
 * ⚠️ NGUYÊN TẮC KIỂM (§0/N1 — "báo cáo không phải bằng chứng"): KHÔNG tự nghiệm bằng chính công
 * thức vừa viết. Mọi mốc dưới đây là **sự kiện thiên văn độc lập, tra được ở bất kỳ niên lịch nào**:
 *   · xích vĩ ±23,44° tại 2 chí · ~0° tại 2 phân
 *   · phương trình thời gian ≈ −14,2 phút ~11/02 · ≈ +16,4 phút ~03/11 (hai cực trị kinh điển)
 *   · cao độ mặt trời lúc trưa = 90 − |vĩ độ − xích vĩ| (hình học cầu thuần tuý)
 *   · Bắc bán cầu: phương vị TĂNG dần trong ngày (Đông → Nam → Tây)
 *   · Nam bán cầu mùa hè: mặt trời qua phía BẮC lúc trưa
 * Sai số cho phép đặt theo sai số công bố của bộ công thức NOAA (~±0,1°) + độ lệch thời điểm chí/
 * phân trong ngày (chí/phân rơi vào giờ nào trong ngày thì xích vĩ lệch chút ít).
 */
import { emptyDoc } from '../cad/model';
import type { Doc, Level } from '../cad/model';
import {
  DEFAULT_SUN,
  buildLightRig,
  estimateLightingQuick,
  julianDayFromMs,
  kelvinToHex,
  kelvinToRgb,
  sunDirectionCad,
  sunFromDateTime,
  sunLightFromDateTime,
  type RoomLight,
} from './lighting';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

// Hà Nội — dùng làm ca chuẩn vì đây là nơi studio thật đang vẽ.
const HN = { lat: 21.0285, lng: 105.8542 };
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

/** Quét từng phút tìm giờ có cao độ lớn nhất (trưa mặt trời) — cách đo ĐỘC LẬP, không dùng công
 * thức trưa của NOAA để tự nghiệm chính nó. */
function solarNoon(lat: number, lng: number, date: Date): { hour: number; altitudeDeg: number; azimuthDeg: number } {
  let best = { hour: 0, altitudeDeg: -999, azimuthDeg: 0 };
  for (let m = 0; m < 24 * 60; m++) {
    const h = m / 60;
    const p = sunFromDateTime(lat, lng, date, h);
    if (p.altitudeDeg > best.altitudeDeg) best = { hour: h, altitudeDeg: p.altitudeDeg, azimuthDeg: p.azimuthDeg };
  }
  return best;
}

/* ── [1] Julian Day — mốc tra được ── */
function testJulianDay() {
  console.log('\n[1] Julian Day — đối chiếu mốc chuẩn');
  ok('1970-01-01T00:00Z = JD 2440587.5', julianDayFromMs(0) === 2440587.5);
  ok('2000-01-01T12:00Z = JD 2451545.0 (J2000.0)', julianDayFromMs(Date.UTC(2000, 0, 1, 12)) === 2451545);
  ok('cách nhau 1 ngày = JD chênh đúng 1', julianDayFromMs(Date.UTC(2026, 5, 22)) - julianDayFromMs(Date.UTC(2026, 5, 21)) === 1);
}

/* ── [2] XÍCH VĨ tại 2 chí / 2 phân — sự kiện thiên văn độc lập ── */
function testDeclination() {
  console.log('\n[2] Xích vĩ — 2 chí ±23,44° · 2 phân ~0°');
  const jun = sunFromDateTime(HN.lat, HN.lng, utc(2026, 6, 21), 12).declinationDeg;
  const dec = sunFromDateTime(HN.lat, HN.lng, utc(2026, 12, 21), 12).declinationDeg;
  const mar = sunFromDateTime(HN.lat, HN.lng, utc(2026, 3, 20), 12).declinationDeg;
  const sep = sunFromDateTime(HN.lat, HN.lng, utc(2026, 9, 23), 12).declinationDeg;
  console.log(`      (đo được: hạ chí ${jun.toFixed(3)}° · đông chí ${dec.toFixed(3)}° · xuân phân ${mar.toFixed(3)}° · thu phân ${sep.toFixed(3)}°)`);
  ok('hạ chí 21/06 ≈ +23,44°', near(jun, 23.44, 0.1));
  ok('đông chí 21/12 ≈ −23,44°', near(dec, -23.44, 0.1));
  ok('xuân phân 20/03 ≈ 0°', near(mar, 0, 0.5));
  ok('thu phân 23/09 ≈ 0°', near(sep, 0, 0.5));
  ok('KHÔNG BAO GIỜ vượt ±23,45° (giới hạn độ nghiêng trục Trái Đất)', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].every((m) => Math.abs(sunFromDateTime(HN.lat, HN.lng, utc(2026, m, 15), 12).declinationDeg) <= 23.45));
}

/* ── [3] PHƯƠNG TRÌNH THỜI GIAN — 2 cực trị kinh điển ── */
function testEquationOfTime() {
  console.log('\n[3] Phương trình thời gian — cực tiểu ~11/02 và cực đại ~03/11');
  const feb = sunFromDateTime(HN.lat, HN.lng, utc(2026, 2, 11), 12).equationOfTimeMin;
  const nov = sunFromDateTime(HN.lat, HN.lng, utc(2026, 11, 3), 12).equationOfTimeMin;
  console.log(`      (đo được: 11/02 = ${feb.toFixed(2)} phút · 03/11 = ${nov.toFixed(2)} phút)`);
  ok('11/02 ≈ −14,2 phút (đồng hồ mặt trời CHẬM nhất)', near(feb, -14.2, 0.6));
  ok('03/11 ≈ +16,4 phút (đồng hồ mặt trời NHANH nhất)', near(nov, 16.4, 0.6));
  ok('biên độ cả năm nằm trong −17..+17 phút', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].every((m) => Math.abs(sunFromDateTime(HN.lat, HN.lng, utc(2026, m, 10), 12).equationOfTimeMin) < 17));
}

/* ── [4] CAO ĐỘ TRƯA = 90 − |vĩ độ − xích vĩ| (hình học cầu, độc lập với NOAA) ── */
function testNoonAltitude() {
  console.log('\n[4] Cao độ lúc trưa khớp công thức hình học 90 − |φ − δ|');
  for (const [nhan, d] of [['xuân phân', utc(2026, 3, 20)], ['hạ chí', utc(2026, 6, 21)], ['đông chí', utc(2026, 12, 21)]] as [string, Date][]) {
    const noon = solarNoon(HN.lat, HN.lng, d);
    const decl = sunFromDateTime(HN.lat, HN.lng, d, noon.hour).declinationDeg;
    const lyThuyet = 90 - Math.abs(HN.lat - decl);
    console.log(`      ${nhan}: trưa ${noon.hour.toFixed(2)}h · đo ${noon.altitudeDeg.toFixed(2)}° · lý thuyết ${lyThuyet.toFixed(2)}°`);
    ok(`${nhan} — cao độ trưa khớp lý thuyết (±0,1°)`, near(noon.altitudeDeg, lyThuyet, 0.1));
    ok(`${nhan} — trưa mặt trời rơi vào khoảng 11h30–12h30 giờ VN`, noon.hour > 11.3 && noon.hour < 12.7);
  }
  // Con số cụ thể mà kiến trúc sư có thể tự kiểm bằng tay:
  ok('Hà Nội đông chí: nắng trưa ~45,5° (bóng đổ dài nhất năm)', near(solarNoon(HN.lat, HN.lng, utc(2026, 12, 21)).altitudeDeg, 45.53, 0.15));
  ok('Hà Nội hạ chí: nắng trưa ~87,6° (gần thẳng đỉnh đầu)', near(solarNoon(HN.lat, HN.lng, utc(2026, 6, 21)).altitudeDeg, 87.59, 0.15));
}

/* ── [5] NGHIỆM THU PHIẾU: đổi giờ → azimuth đổi ĐÚNG CHIỀU ── */
function testAzimuthDirection() {
  console.log('\n[5] NGHIỆM THU — đổi giờ thì phương vị đổi đúng chiều (Đông → Nam → Tây)');
  const d = utc(2026, 12, 21); // đông chí: mặt trời chắc chắn ở phía NAM tại Hà Nội, không mơ hồ
  const gio = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  const az = gio.map((h) => sunFromDateTime(HN.lat, HN.lng, d, h).azimuthDeg);
  console.log(`      (phương vị 7h→16h: ${az.map((a) => a.toFixed(0)).join(' → ')})`);
  ok('phương vị TĂNG đơn điệu suốt cả ngày (không nhảy lùi)', az.every((a, i) => i === 0 || a > az[i - 1]));
  ok('sáng 7h ở phía ĐÔNG-NAM (110°–130°)', az[0] > 110 && az[0] < 130);
  ok('trưa 12h ở phía NAM (~180°, sai lệch <8°)', near(az[5], 180, 8));
  ok('chiều 16h ở phía TÂY-NAM (230°–250°)', az[9] > 230 && az[9] < 250);

  // Hạ chí Hà Nội: xích vĩ 23,44° > vĩ độ 21,03° ⇒ trưa mặt trời qua phía BẮC. Đây là hiện tượng
  // THẬT của vùng nhiệt đới (bóng đổ về phía Nam giữa trưa) — bẫy kinh điển làm lệch 180° hướng nắng.
  const trua = solarNoon(HN.lat, HN.lng, utc(2026, 6, 21));
  ok('hạ chí Hà Nội — trưa mặt trời ở phía BẮC (az gần 0/360), không phải Nam', trua.azimuthDeg < 20 || trua.azimuthDeg > 340);

  // Nam bán cầu: Sydney tháng 12 là mùa hè, trưa mặt trời ở phía BẮC.
  const syd = solarNoon(-33.8688, 151.2093, utc(2026, 12, 21));
  console.log(`      (Sydney 21/12: trưa ${syd.hour.toFixed(2)}h · cao độ ${syd.altitudeDeg.toFixed(1)}° · az ${syd.azimuthDeg.toFixed(0)}°)`);
  ok('Sydney 21/12 — trưa mặt trời phía BẮC (az gần 0/360)', syd.azimuthDeg < 20 || syd.azimuthDeg > 340);
  ok('Sydney 21/12 — cao độ trưa ≈ 90−|−33,87−(−23,44)| ≈ 79,6°', near(syd.altitudeDeg, 79.57, 0.2));
}

/* ── [6] mọc/lặn + múi giờ ── */
function testHorizonAndTz() {
  console.log('\n[6] Mọc/lặn + suy múi giờ theo kinh độ');
  const d = utc(2026, 3, 20); // xuân phân: ngày ≈ đêm ở mọi vĩ độ
  let soPhutCoNang = 0;
  for (let m = 0; m < 24 * 60; m++) if (sunFromDateTime(HN.lat, HN.lng, d, m / 60).altitudeDeg > 0) soPhutCoNang++;
  const gioNang = soPhutCoNang / 60;
  console.log(`      (độ dài ngày xuân phân tại Hà Nội: ${gioNang.toFixed(2)} giờ)`);
  ok('xuân phân — độ dài ngày ≈ 12 giờ (±10 phút)', near(gioNang, 12, 0.17));

  ok('nửa đêm — mặt trời DƯỚI chân trời (altitude âm)', sunFromDateTime(HN.lat, HN.lng, d, 0).altitudeDeg < 0);
  ok('kinh độ 105,85° → tự suy múi giờ UTC+7', sunFromDateTime(HN.lat, HN.lng, d, 12).tzOffsetHours === 7);
  ok('kinh độ 0° (Greenwich) → UTC+0', sunFromDateTime(51.48, 0, d, 12).tzOffsetHours === 0);
  ok('kinh độ ÂM (New York −74) → UTC−5', sunFromDateTime(40.71, -74, d, 12).tzOffsetHours === -5);
  ok('truyền tay tzOffsetHours thì THẮNG suy đoán', sunFromDateTime(HN.lat, HN.lng, d, 12, 9).tzOffsetHours === 9);
  // Cùng một khoảnh khắc tuyệt đối, khai bằng 2 múi giờ khác nhau → PHẢI ra cùng vị trí mặt trời.
  const a = sunFromDateTime(HN.lat, HN.lng, d, 12, 7);
  const b = sunFromDateTime(HN.lat, HN.lng, d, 14, 9);
  ok('12h ở UTC+7 và 14h ở UTC+9 là CÙNG khoảnh khắc → cùng kết quả', near(a.azimuthDeg, b.azimuthDeg, 1e-9) && near(a.altitudeDeg, b.altitudeDeg, 1e-9));

  // Cực: không được trả NaN.
  const cuc = sunFromDateTime(90, 0, utc(2026, 6, 21), 12);
  ok('tại Bắc Cực không trả NaN', Number.isFinite(cuc.azimuthDeg) && Number.isFinite(cuc.altitudeDeg));
  ok('Bắc Cực hạ chí — mặt trời TRÊN chân trời (đêm trắng)', cuc.altitudeDeg > 0);
}

/* ── [7] vector hướng nắng — đúng quy ước trục, không lệch gương/90° ── */
function testDirection() {
  console.log('\n[7] sunDirectionCad — quy ước trục (x Đông · y Bắc · z lên)');
  const bac = sunDirectionCad({ azimuthDeg: 0, altitudeDeg: 0 });
  const dong = sunDirectionCad({ azimuthDeg: 90, altitudeDeg: 0 });
  const nam = sunDirectionCad({ azimuthDeg: 180, altitudeDeg: 0 });
  const tay = sunDirectionCad({ azimuthDeg: 270, altitudeDeg: 0 });
  ok('az 0° = BẮC = +y', near(bac.y, 1, 1e-9) && near(bac.x, 0, 1e-9));
  ok('az 90° = ĐÔNG = +x', near(dong.x, 1, 1e-9) && near(dong.y, 0, 1e-9));
  ok('az 180° = NAM = −y', near(nam.y, -1, 1e-9));
  ok('az 270° = TÂY = −x', near(tay.x, -1, 1e-9));
  ok('altitude 90° = thẳng đỉnh đầu = +z', near(sunDirectionCad({ azimuthDeg: 0, altitudeDeg: 90 }).z, 1, 1e-9));
  ok('altitude 45° — z và độ dài ngang bằng nhau', near(sunDirectionCad({ azimuthDeg: 90, altitudeDeg: 45 }).z, Math.SQRT1_2, 1e-9));
  ok('luôn là vector ĐƠN VỊ', [0, 37, 90, 180, 260, 359].every((a) => {
    const v = sunDirectionCad({ azimuthDeg: a, altitudeDeg: 30 });
    return near(Math.hypot(v.x, v.y, v.z), 1, 1e-9);
  }));
}

/* ── [8] Kelvin → màu ── */
function testKelvin() {
  console.log('\n[8] kelvinToRgb — xu hướng đúng (ấm đỏ · lạnh xanh)');
  const nen = kelvinToRgb(2700);
  const trua = kelvinToRgb(5500);
  const lanh = kelvinToRgb(9000);
  ok('2700K (đèn sợi đốt) — đỏ trội hơn xanh dương rõ rệt', nen.r > nen.b + 60);
  ok('5500K (nắng trưa) — 3 kênh gần cân bằng', Math.max(trua.r, trua.g, trua.b) - Math.min(trua.r, trua.g, trua.b) < 60);
  ok('9000K — xanh dương ≥ đỏ', lanh.b >= lanh.r);
  ok('kênh đỏ giảm đơn điệu khi K tăng', kelvinToRgb(2000).r >= kelvinToRgb(6500).r && kelvinToRgb(6500).r >= kelvinToRgb(12000).r);
  ok('mọi kênh nằm trong 0..255', [1000, 2700, 5500, 40000, 99999].every((k) => {
    const c = kelvinToRgb(k);
    return [c.r, c.g, c.b].every((v) => v >= 0 && v <= 255 && Number.isInteger(v));
  }));
  ok('kelvinToHex ra đúng dạng #rrggbb', /^#[0-9a-f]{6}$/.test(kelvinToHex(3000)));
}

/* ── [9] buildLightRig — DỮ LIỆU, không object three ── */
function testRigBasics() {
  console.log('\n[9] buildLightRig — Doc chưa cấu hình đèn vẫn chạy');
  const rig = buildLightRig(emptyDoc());
  ok('không sập khi Doc.lighting undefined', !!rig.sun && !!rig.sky);
  ok('dùng đúng bộ mặc định', rig.sun.intensity === DEFAULT_SUN.intensity && rig.sun.colorK === DEFAULT_SUN.colorK);
  ok('0 đèn phòng', rig.rooms.length === 0);
  ok('không cảnh báo giả', rig.warnings.length === 0);
  ok('KHÔNG trả object three (chỉ dữ liệu thuần, JSON hoá được)', typeof JSON.stringify(rig) === 'string');
  ok('mặt trời mặc định TRÊN chân trời', rig.sun.belowHorizon === false);
  ok('có màu hex suy từ Kelvin', /^#[0-9a-f]{6}$/.test(rig.sun.colorHex));

  // Hoán trục: hướng CAD (x,y,z) → three (x, z, −y).
  const d = rig.sun.directionCad;
  ok('directionThree hoán trục đúng (x, z, −y)', rig.sun.directionThree[0] === d.x && rig.sun.directionThree[1] === d.z && rig.sun.directionThree[2] === -d.y);

  const dem: Doc = { ...emptyDoc(), lighting: { sun: { ...DEFAULT_SUN, altitudeDeg: -10 }, sky: { intensity: 1, rotationDeg: 0 }, rooms: [] } };
  ok('mặt trời dưới chân trời → cờ belowHorizon + cảnh báo', buildLightRig(dem).sun.belowHorizon === true && buildLightRig(dem).warnings.length === 1);
  ok('KHÔNG tự ép intensity về 0 (để tầng viewer quyết)', buildLightRig(dem).sun.intensity === DEFAULT_SUN.intensity);
}

/* ── [10] NGHIỆM THU PHIẾU: đèn có levelId thì z đúng ── */
function testRoomLightLevels() {
  console.log('\n[10] NGHIỆM THU — đèn gắn tầng thì cao độ z đúng');
  const levels: Level[] = [
    { id: 'lv-gf', name: 'Trệt', elevationMm: 0, order: 0 },
    { id: 'lv-1', name: 'Lầu 1', elevationMm: 3600, order: 1 },
    { id: 'lv-2', name: 'Lầu 2', elevationMm: 7200, order: 2 },
  ];
  const den = (id: string, levelId?: string): RoomLight => ({
    id, kind: 'ceiling', posMm: { x: 1000, y: 2000, z: 2700 }, lumens: 1200, colorK: 3000, ...(levelId ? { levelId } : {}),
  });
  const doc: Doc = {
    ...emptyDoc(), levels,
    lighting: {
      sun: DEFAULT_SUN, sky: { intensity: 1, rotationDeg: 0 },
      rooms: [den('d-gf', 'lv-gf'), den('d-1', 'lv-1'), den('d-2', 'lv-2'), den('d-roi'), { ...den('d-spot', 'lv-1'), kind: 'spot', targetMm: { x: 1000, y: 2000, z: 0 } }],
    },
  };
  const rig = buildLightRig(doc);
  const by = new Map(rig.rooms.map((r) => [r.id, r]));

  ok('đèn tầng trệt: z = 0 + 2700', by.get('d-gf')!.posCadMm.z === 2700);
  ok('đèn lầu 1: z = 3600 + 2700 = 6300', by.get('d-1')!.posCadMm.z === 6300);
  ok('đèn lầu 2: z = 7200 + 2700 = 9900', by.get('d-2')!.posCadMm.z === 9900);
  ok('đèn KHÔNG gắn tầng: z giữ nguyên 2700 (tuyệt đối)', by.get('d-roi')!.posCadMm.z === 2700);
  ok('x/y KHÔNG bị đụng', by.get('d-1')!.posCadMm.x === 1000 && by.get('d-1')!.posCadMm.y === 2000);
  ok('ghi lại cao độ tầng đã cộng', by.get('d-1')!.levelElevationMm === 3600);
  ok('đèn không gắn tầng → không có levelElevationMm', by.get('d-roi')!.levelElevationMm === undefined);

  // Đích rọi phải nâng theo tầng — nếu không, đèn lầu 1 rọi xuống sàn tầng trệt.
  ok('ĐÍCH RỌI cũng nâng theo tầng (3600 + 0)', by.get('d-spot')!.targetCadMm!.z === 3600);
  ok('đèn không có targetMm → không mọc field target', by.get('d-gf')!.targetCadMm === undefined);

  // Đổi cao độ tầng → đèn đi theo (cùng luật với cấu kiện, VIỆC 2).
  const nangTang: Doc = { ...doc, levels: levels.map((l) => (l.id === 'lv-1' ? { ...l, elevationMm: 4200 } : l)) };
  ok('đổi cao độ Lầu 1 (3600→4200) → đèn lầu 1 lên 6900', buildLightRig(nangTang).rooms.find((r) => r.id === 'd-1')!.posCadMm.z === 6900);
  ok('… đèn tầng khác ĐỨNG YÊN', buildLightRig(nangTang).rooms.find((r) => r.id === 'd-2')!.posCadMm.z === 9900);

  // Toạ độ three: mm→m + hoán trục (x, z, −y).
  const t = by.get('d-1')!.posThreeM;
  ok('posThreeM = mm→m + hoán trục (1, 6.3, −2)', t[0] === 1 && t[1] === 6.3 && t[2] === -2);

  // Quang thông → candela đẳng hướng.
  ok('candela đẳng hướng = lm/4π (1200 lm ≈ 95,49 cd)', near(by.get('d-gf')!.candelaIsotropic, 1200 / (4 * Math.PI), 1e-9));
}

/* ── [11] biên: tầng mồ côi, lumens xấu ── */
function testRigEdges() {
  console.log('\n[11] biên — tầng mồ côi + quang thông ≤ 0');
  const doc: Doc = {
    ...emptyDoc(),
    levels: [{ id: 'lv-gf', name: 'Trệt', elevationMm: 0, order: 0 }],
    lighting: {
      sun: DEFAULT_SUN, sky: { intensity: 1, rotationDeg: 0 },
      rooms: [
        { id: 'mo-coi', kind: 'ceiling', posMm: { x: 0, y: 0, z: 2700 }, lumens: 800, colorK: 3000, levelId: 'lv-da-xoa' },
        { id: 'tat', kind: 'strip', posMm: { x: 0, y: 0, z: 100 }, lumens: 0, colorK: 3000 },
      ],
    },
  };
  const rig = buildLightRig(doc);
  ok('tầng mồ côi KHÔNG làm sập', rig.rooms.length === 2);
  ok('giữ nguyên z tương đối, KHÔNG âm thầm thả xuống sàn', rig.rooms[0].posCadMm.z === 2700);
  ok('có cảnh báo nêu đúng tên đèn + id tầng', rig.warnings.some((w) => w.includes('mo-coi') && w.includes('lv-da-xoa')));
  ok('lumens = 0 → cảnh báo không phát sáng', rig.warnings.some((w) => w.includes('tat')));
  ok('levelElevationMm undefined khi tầng mồ côi', rig.rooms[0].levelElevationMm === undefined);
  ok('Doc sạch → 0 cảnh báo', buildLightRig(emptyDoc()).warnings.length === 0);
}

/* ── [12] sunLightFromDateTime — giữ núm chỉnh của người dùng ── */
function testSunLightFromDateTime() {
  console.log('\n[12] sunLightFromDateTime — chỉ đổi hướng, giữ intensity/colorK');
  const base = { azimuthDeg: 0, altitudeDeg: 0, intensity: 2.5, colorK: 4200 };
  const out = sunLightFromDateTime(base, HN.lat, HN.lng, utc(2026, 12, 21), 12);
  ok('giữ nguyên intensity người dùng chỉnh', out.intensity === 2.5);
  ok('giữ nguyên colorK người dùng chỉnh', out.colorK === 4200);
  ok('cập nhật hướng theo ngày giờ thật', near(out.azimuthDeg, 180, 8) && out.altitudeDeg > 40);
}

/* ── [13] Lighting quick estimate — phản hồi UI, KHÔNG phải báo cáo IES/LDT ── */
function testQuickEstimate() {
  console.log('\n[13] lighting quick estimate — lux tiền kiểm');
  const rig = buildLightRig({
    ...emptyDoc(),
    lighting: {
      sun: DEFAULT_SUN,
      sky: { intensity: 1, rotationDeg: 0 },
      rooms: [
        { id: 'a', kind: 'ceiling', posMm: { x: 0, y: 0, z: 2700 }, lumens: 1000, colorK: 3000 },
        { id: 'b', kind: 'ceiling', posMm: { x: 1000, y: 0, z: 2700 }, lumens: 1000, colorK: 3000 },
      ],
    },
  });
  const estimate = estimateLightingQuick(rig, 10);
  ok('tổng quang thông đúng', estimate.totalLumens === 2000);
  ok('độ rọi = lm × 0.62 / diện tích', estimate.estimatedLux === 124);
  ok('2 đèn có tín hiệu đồng đều', estimate.uniformity !== null && estimate.uniformity > 0);
  const missing = estimateLightingQuick(buildLightRig(emptyDoc()), 10);
  ok('không đèn → không bịa lux/đồng đều', missing.estimatedLux === null && missing.uniformity === null);
}

testJulianDay();
testDeclination();
testEquationOfTime();
testNoonAltitude();
testAzimuthDirection();
testHorizonAndTz();
testDirection();
testKelvin();
testRigBasics();
testRoomLightLevels();
testRigEdges();
testSunLightFromDateTime();
testQuickEstimate();

console.log(`\nlighting.test.ts — ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
