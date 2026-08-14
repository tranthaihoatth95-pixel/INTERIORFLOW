/**
 * lib/idfc-import/part-lock.test.ts — test THUẦN cho PartLock (marker `PartLock`, phiếu
 * `docs/phieu-giao/part-lock-cau-kien.md`).
 * ① buildPartLockFromChuanNet trên fixture "ghế đồ chơi" tổng hợp (4 chân + 2 vòng + mặt ngồi +
 *    tựa lưng + thanh giằng + 3 mảnh lạc) → ĐÚNG số lượng + ĐÚNG tên từng cấu kiện.
 * ② regenerateUnlocked: khoá 1 phần → hash NỘI DUNG (partContentHash) TRƯỚC=SAU tuyệt đối cho
 *    phần khoá, ĐỔI cho phần không khoá — [T6] đo được bằng số, không phải so bằng mắt.
 * ③ deep-clone thật: sửa object trả về không làm bẩn asset gốc.
 * Chạy: node_modules/.bin/sucrase-node lib/idfc-import/part-lock.test.ts
 */
import {
  buildPartLockFromChuanNet,
  partContentHash,
  regenerateUnlocked,
  stableStringify,
  type PartLockAsset,
  type PartLockPart,
} from './part-lock';
import type { Dien, FrameCucBo, LuoiDien, V3 } from './surface-graph';
import type { ChuanNetPart } from './chuan-net';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, extra?: string) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}${extra ? ` · ${extra}` : ''}`); }
}

/* ───────────────────── fixture ghế đồ chơi ───────────────────── */

function frameAt(goc: V3): FrameCucBo {
  return { goc, e1: [1, 0, 0], e2: [0, 0, 1], e3: [0, 1, 0], min: [-1, -1, -1], max: [1, 1, 1], co: [2, 2, 2] };
}
const luoiKhong: LuoiDien = { kieu: 'khong', nu: 0, nv: 0, buoc: 1, soO: 0 };

let nextId = 0;
function fakeDien(o: {
  y: number; z: number; x?: number; loai?: Dien['loai']; pct?: number; nghiVanBongSan?: boolean; mauHex?: string;
}): Dien {
  const id = nextId++;
  return {
    id,
    loai: o.loai ?? 'planar',
    soTri: 10,
    dienTich: (o.pct ?? 1) * 1000,
    dienTichPct: o.pct ?? 1,
    rms: 0.1,
    rmsPct: 0.1,
    thamSo: null,
    frame: frameAt([o.x ?? 0, o.y, o.z]),
    luoi: luoiKhong,
    bien: [[[o.x ?? 0, o.y, o.z], [(o.x ?? 0) + 1, o.y, o.z]]],
    mauHex: o.mauHex ?? '#a0a0a0',
    vatLieu: undefined,
    keBen: [],
    nghiVanBongSan: o.nghiVanBongSan ?? false,
  };
}

function fakeCyl(id: string, centerMm: V3, axis: V3, radiusMm: number, heightMm: number): Extract<ChuanNetPart, { loai: 'cylinder' }> {
  return {
    loai: 'cylinder', id,
    thamSo: { radiusMm, heightMm, centerMm, axis },
    buildOp: { op: 'revolve', profileMm: [], centerXMm: 0, centerYMm: 0, segments: 8 },
    saiSoMm: 0.1, saiSoPct: 0.1, trisTruoc: 100, trisSau: 20,
    kdSrgb: [0.3, 0.2, 0.1], matName: `mat_${id}`,
  };
}
function fakeTorus(id: string, centerMm: V3, axis: V3, rMajorMm: number, rMinorMm: number): Extract<ChuanNetPart, { loai: 'torus' }> {
  return {
    loai: 'torus', id,
    thamSo: { rMajorMm, rMinorMm, centerMm, axis },
    buildOp: { op: 'revolve', profileMm: [], centerXMm: 0, centerYMm: 0, segments: 8 },
    saiSoMm: 0.1, saiSoPct: 0.1, trisTruoc: 100, trisSau: 20,
    kdSrgb: [0.6, 0.6, 0.6], matName: `mat_${id}`,
  };
}

// 4 chân: legTopY=0, legBotY=-200, legSpan=200 → seatMin=-16, stretchMin=-144, stretchMax=-76
const legs = [
  fakeCyl('p1-chan', [100, -100, 100], [0, 1, 0], 10, 200), // phải-trước
  fakeCyl('p2-chan', [100, -100, -100], [0, 1, 0], 10, 200), // phải-sau
  fakeCyl('p3-chan', [-100, -100, 100], [0, 1, 0], 10, 200), // trái-trước
  fakeCyl('p4-chan', [-100, -100, -100], [0, 1, 0], 10, 200), // trái-sau
];
// 2 vòng: ringBotY = 150-50=100 → seatMax = 100+0.11*200=122
const rings = [
  fakeTorus('p6-vong', [-100, 150, 0], [1, 0, 0], 50, 5), // trái
  fakeTorus('p7-vong', [100, 150, 0], [1, 0, 0], 50, 5), // phải
];

const dSeat1 = fakeDien({ y: 50, z: 0, x: 0, loai: 'planar', pct: 3 });
// bien có thêm 1 điểm SÁT đỉnh chân phải-trước (100,0,100) — mô phỏng mép ghế thật tựa lên đầu chân,
// để test lienKet "chân chạm mặt ngồi" có căn cứ hình học chứ không phải điểm rời rạc vô nghĩa.
dSeat1.bien = [[[0, 50, 0], [1, 50, 0], [100, 50, 100]]];
const dSeat2 = fakeDien({ y: 60, z: 20, x: 30, loai: 'freeform', pct: 2 });
const dBack = fakeDien({ y: 200, z: -150, x: 0, loai: 'planar', pct: 4 }); // đỉnh ghế, Z âm → định rearSign=-1
const dStretchBig = fakeDien({ y: -110, z: 0, x: 0, loai: 'freeform', pct: 5 });
const dStretchSmall = fakeDien({ y: -100, z: -10, x: 10, loai: 'freeform', pct: 1 });
const dStretchPlanar = fakeDien({ y: -105, z: 10, x: -10, loai: 'planar', pct: 1 }); // không freeform → không được làm seed
// z GẦN 0 (không cực đoan) — dGap chỉ test "y lọt giữa 2 dải", KHÔNG test lệch Z, tránh kéo lệch
// trung bình Z của topK (dùng để suy rearSign) một cách không chủ ý.
const dGap = fakeDien({ y: -50, z: 5, x: 200, loai: 'freeform', pct: 1 }); // giữa 2 dải, không khớp gì
const dNearLeg = fakeDien({ y: -50, z: 100, x: 100, loai: 'freeform', pct: 1 }); // ĐÚNG trên trục chân phải-trước
const dNearRing = fakeDien({ y: 150, z: 50, x: -100, loai: 'freeform', pct: 1 }); // ĐÚNG trên vòng trái
const dFloor1 = fakeDien({ y: -300, z: 0, x: 0, loai: 'planar', pct: 8, nghiVanBongSan: true });
const dFloor2 = fakeDien({ y: -300, z: 5, x: 0, loai: 'planar', pct: 8, nghiVanBongSan: true });

const dien: Dien[] = [dSeat1, dSeat2, dBack, dStretchBig, dStretchSmall, dStretchPlanar, dGap, dNearLeg, dNearRing, dFloor1, dFloor2];

const asset = buildPartLockFromChuanNet({ dien }, { parts: [...legs, ...rings] });

/* ───────────────────── ① đúng số lượng + đúng tên ───────────────────── */
{
  console.log(`\n${'─'.repeat(60)}\n① buildPartLockFromChuanNet — fixture ghế đồ chơi\n`);
  const byId = new Map(asset.parts.map((p) => [p.id, p]));
  ok('4 chân đặt tên đủ trái/phải × trước/sau', ['chan-phai-truoc', 'chan-phai-sau', 'chan-trai-truoc', 'chan-trai-sau'].every((id) => byId.has(id)),
    asset.parts.filter((p) => p.id.startsWith('chan-')).map((p) => p.id).join(','));
  ok('2 vòng tay đặt tên trái/phải', byId.has('vong-tay-trai') && byId.has('vong-tay-phai'));
  const seat = byId.get('mat-ngoi');
  ok('mat-ngoi tồn tại, gộp ĐÚNG 2 diện [seat1,seat2]', !!seat && seat.geomRef.kind === 'meshSubset' && seat.geomRef.dienIds.length === 2
    && seat.geomRef.dienIds.includes(dSeat1.id) && seat.geomRef.dienIds.includes(dSeat2.id),
    seat && seat.geomRef.kind === 'meshSubset' ? JSON.stringify(seat.geomRef.dienIds) : 'MISSING');
  const back = byId.get('tua-lung');
  ok('tua-lung tồn tại, đúng 1 diện [dBack]', !!back && back.geomRef.kind === 'meshSubset' && back.geomRef.dienIds.length === 1 && back.geomRef.dienIds[0] === dBack.id);
  const str = byId.get('thanh-giang');
  ok('thanh-giang chọn ĐÚNG mảnh freeform LỚN NHẤT (dStretchBig), không phải mảnh nhỏ/không-freeform',
    !!str && str.geomRef.kind === 'meshSubset' && str.geomRef.dienIds.length === 1 && str.geomRef.dienIds[0] === dStretchBig.id,
    str && str.geomRef.kind === 'meshSubset' ? JSON.stringify(str.geomRef.dienIds) : 'MISSING');
  const leftoverIds = new Set(asset.parts.filter((p) => p.id.startsWith('phan-')).flatMap((p) => (p.geomRef.kind === 'meshSubset' ? p.geomRef.dienIds : [])));
  ok('3 mảnh lạc (gap, stretch-nhỏ, stretch-phẳng) → phan-YY, ĐÚNG 3 phần', leftoverIds.size === 3
    && leftoverIds.has(dGap.id) && leftoverIds.has(dStretchSmall.id) && leftoverIds.has(dStretchPlanar.id),
    [...leftoverIds].join(','));
  ok('diện SÁT trục chân/vòng KHÔNG bị đặt tên gì (không phan-YY, không seat/back/stretch)',
    !asset.parts.some((p) => p.geomRef.kind === 'meshSubset' && (p.geomRef.dienIds.includes(dNearLeg.id) || p.geomRef.dienIds.includes(dNearRing.id))));
  ok('bóng sàn (nghiVanBongSan) KHÔNG xuất hiện ở đâu cả',
    !asset.parts.some((p) => p.geomRef.kind === 'meshSubset' && (p.geomRef.dienIds.includes(dFloor1.id) || p.geomRef.dienIds.includes(dFloor2.id))));
  ok('tổng số cấu kiện = 4 chân + 2 vòng + mat-ngoi + tua-lung + thanh-giang + 3 phan-YY = 12',
    asset.parts.length === 12, `thực tế ${asset.parts.length}: ${asset.parts.map((p) => p.id).join(',')}`);
  ok('mọi cấu kiện khởi tạo khoa=false', asset.parts.every((p) => p.khoa === false));
  ok('ghiChu là mảng (kể cả rỗng) — không undefined', Array.isArray(asset.ghiChu));
  ok('lienKet: chân trước-phải PHẢI chạm mat-ngoi hoặc thanh-giang (không rời rạc tuyệt đối)',
    asset.lienKet.some((l) => (l.a === 'chan-phai-truoc' || l.b === 'chan-phai-truoc') && (l.a === 'mat-ngoi' || l.b === 'mat-ngoi' || l.a === 'thanh-giang' || l.b === 'thanh-giang')),
    JSON.stringify(asset.lienKet.filter((l) => l.a === 'chan-phai-truoc' || l.b === 'chan-phai-truoc')));
}

/* ───────────────────── ② khoá bất biến — hash TRƯỚC=SAU ───────────────────── */
{
  console.log(`\n${'─'.repeat(60)}\n② regenerateUnlocked — khoá bất biến (hash đo được)\n`);
  const khoaIds = ['mat-ngoi', 'vong-tay-trai'];
  const hashTruoc = new Map(asset.parts.map((p) => [p.id, partContentHash(p)]));

  const tinhChinh = (p: PartLockPart): PartLockPart => ({ ...p, matHex: '#000000', khoa: false });
  const sau = regenerateUnlocked(asset, khoaIds, tinhChinh);
  const hashSau = new Map(sau.parts.map((p) => [p.id, partContentHash(p)]));

  for (const id of khoaIds) {
    ok(`KHOÁ "${id}": hash TRƯỚC === SAU tuyệt đối`, hashTruoc.get(id) === hashSau.get(id), `${hashTruoc.get(id)} vs ${hashSau.get(id)}`);
    const p = sau.parts.find((x) => x.id === id)!;
    ok(`KHOÁ "${id}": matHex KHÔNG bị tinhChinh đụng vào`, p.matHex !== '#000000', p.matHex);
    ok(`KHOÁ "${id}": cờ khoa ép về true`, p.khoa === true);
  }

  const unlockedSample = asset.parts.find((p) => !khoaIds.includes(p.id))!;
  ok(`KHÔNG khoá "${unlockedSample.id}": hash ĐỔI sau tinhChinh`, hashTruoc.get(unlockedSample.id) !== hashSau.get(unlockedSample.id));
  ok(`KHÔNG khoá "${unlockedSample.id}": matHex đổi đúng theo tinhChinh`, sau.parts.find((p) => p.id === unlockedSample.id)!.matHex === '#000000');

  ok('số lượng cấu kiện giữ nguyên sau tái sinh', sau.parts.length === asset.parts.length);
  ok('lienKet không đổi (chỉ mesh/vật liệu đổi, không đổi topo lắp ghép)', stableStringify(sau.lienKet) === stableStringify(asset.lienKet));
}

/* ───────────────────── ③ deep-clone thật ───────────────────── */
{
  console.log(`\n${'─'.repeat(60)}\n③ deep-clone — không bẩn ngược asset gốc\n`);
  const before = partContentHash(asset.parts.find((p) => p.id === 'mat-ngoi')!);
  const sau = regenerateUnlocked(asset, ['mat-ngoi'], (p) => p);
  const returned = sau.parts.find((p) => p.id === 'mat-ngoi')!;
  if (returned.geomRef.kind === 'meshSubset') returned.geomRef.dienIds.push(9999); // sửa BẢN TRẢ VỀ
  const after = partContentHash(asset.parts.find((p) => p.id === 'mat-ngoi')!); // đọc lại BẢN GỐC
  ok('sửa object trả về KHÔNG làm bẩn asset gốc (deep-clone thật, không chỉ shallow)', before === after, `${before} vs ${after}`);
}

console.log(`\n${pass} pass · ${fail} fail`);
if (fail) process.exit(1);
