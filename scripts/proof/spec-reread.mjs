/**
 * scripts/proof/spec-reread.mjs — runtime proof cho W1-5 (`IF-SPEC-REREAD-001`):
 * **đường ĐỌC** của lát cắt "Ảnh → Spec". `GET /api/asset-representation?assetId=…`
 *
 * Bề mặt được chứng minh: chính cái route mà `components/ui/SoSpecDaLuu.tsx` gọi, với đúng
 * hình dạng dữ liệu mà component đó đọc.
 *
 * ⚠️ CỔNG HARNESS (F-15) ở CA 0: cookie đúc phải mở được một route CÓ XÁC THỰC. Cổng đỏ ⇒ thoát
 *    1 NGAY, cấm in ĐẠT cho ca sau. Máy soi rỗng vẫn báo xanh — đã trả giá.
 * ⚠️ LUẬT F-17 (khẳng định phải có chủ thể): trước mọi khẳng định về NỘI DUNG một trường, có ca
 *    khẳng định trường đó TỒN TẠI và ĐÚNG KIỂU (CA 3, CA 6). Và nhóm ca có ca **mong THẤY**
 *    (CA 4/5/6/7/9) chứ không chỉ ca "không thấy" (CA 8) — ống chưa nối cũng "khoá".
 *
 * Chạy:  node scripts/proof/spec-reread.mjs
 */

import { spawn } from 'child_process';
import { SignJWT } from 'jose';
import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TAG = `__proof_spec_${Date.now()}`;
const KIND = 'spec-from-image'; // = KIND_SPEC của lib/capabilities/anh-thanh-spec.ts
const PORT = 3031;

// `.env` — NHỚ BÓC CẶP NHÁY quanh giá trị (khuôn library-file-scope.mjs).
const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [
      l.slice(0, l.indexOf('=')).trim(),
      l.slice(l.indexOf('=') + 1).trim().replace(/^(['"])([\s\S]*)\1$/, '$2'),
    ]),
);
if (!env.AUTH_SECRET) throw new Error('Không đọc được AUTH_SECRET — dừng.');

const cookie = async (sub) =>
  `if_session=${await new SignJWT({ sub })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(env.AUTH_SECRET))}`;

const ket = [];
function ca(ten, mong, got) {
  const dat = JSON.stringify(mong) === JSON.stringify(got);
  ket.push({ ten, dat });
  console.log(`${dat ? '  ok  ' : ' KHÔNG '} ${ten} — mong ${JSON.stringify(mong)}, nhận ${JSON.stringify(got)}`);
  return dat;
}

const servers = [];
async function dungServer(port) {
  const p = spawn('npx', ['next', 'dev', '-p', String(port)], { env: process.env, stdio: 'ignore' });
  servers.push(p);
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/api/comments`);
      if (r.status === 401 || r.status === 200) return `http://127.0.0.1:${port}`;
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Server ${port} không lên`);
}

/** Gọi đúng như component gọi. Trả cả mã lẫn thân — để ca soi được TRƯỜNG, không chỉ mã. */
async function doc(base, assetId, c) {
  const res = await fetch(`${base}/api/asset-representation?assetId=${encodeURIComponent(assetId)}`, {
    headers: c ? { cookie: c } : {},
    redirect: 'manual',
  });
  const body = await res.json().catch(() => null);
  return { ma: res.status, body };
}

async function main() {
  console.log('# W1-5 · GET /api/asset-representation · runtime proof (đường ĐỌC spec)\n');

  const nguoi = await prisma.user.create({
    data: { email: `${TAG}@proof.local`, name: `${TAG}_nguoi`, passwordHash: 'x' },
  });
  const c = await cookie(nguoi.id);

  const mkAsset = (hau) =>
    prisma.libraryAsset.create({
      data: { userId: nguoi.id, name: `${TAG} ${hau}`, path: `${TAG}-${hau}.png`, mime: 'image/png', category: 'proof' },
    });
  const [anhCoSpec, anhTrong, anhXoaMem] = await Promise.all([mkAsset('co'), mkAsset('trong'), mkAsset('xoa')]);

  const prov = (doiTuong, mm, flag, canCu) =>
    JSON.stringify({
      nangLuc: 'image-to-3d',
      doiTuong,
      phuongPhap: 'hộp bao từ ảnh',
      doTin: 42,
      kichThuoc: [
        { ten: 'Rộng', mm, flag, canCu, flagMay: 'inferred', canCuMay: 'image-estimate', xuatXu: 'ước lượng từ ảnh', basis: 'bbox' },
      ],
      boq: { duoc: flag === 'verified', lyDo: 'proof', xuatXu: [] },
      vatLieu: null,
      sanPham: { ten: 'Chưa rõ', mucSuThat: 'chuaRo' },
      chuaRo: ['Chống cháy'],
    });

  // Hai bản cho CÙNG một asset ⇒ phải ra chuỗi phiên bản, mới nhất trước.
  const cu = await prisma.assetRepresentation.create({
    data: {
      assetId: anhCoSpec.id, kind: KIND, payloadRef: `if:image-to-3d/${TAG}-cu`,
      truthLevel: 'inferred', provenance: prov(`${TAG} ghế cũ`, 600, 'inferred', 'image-estimate'),
      verifiedBy: null, createdBy: nguoi.id, createdAt: new Date(Date.now() - 60_000),
    },
  });
  const moi = await prisma.assetRepresentation.create({
    data: {
      assetId: anhCoSpec.id, kind: KIND, payloadRef: `if:image-to-3d/${TAG}-moi`,
      truthLevel: 'verified', provenance: prov(`${TAG} ghế mới`, 640, 'verified', 'human-override'),
      verifiedBy: `${TAG}_nguoi`, verifiedAt: new Date(), createdBy: nguoi.id,
    },
  });
  // Bản XOÁ MỀM trên cùng asset — không được lọt.
  const daXoa = await prisma.assetRepresentation.create({
    data: {
      assetId: anhCoSpec.id, kind: KIND, payloadRef: `if:image-to-3d/${TAG}-xoa`,
      truthLevel: 'inferred', provenance: prov(`${TAG} ghế đã xoá`, 500, 'inferred', 'image-estimate'),
      createdBy: nguoi.id, deletedAt: new Date(),
    },
  });
  // Asset chỉ có một bản đã xoá mềm ⇒ danh sách rỗng, KHÔNG phải lỗi.
  await prisma.assetRepresentation.create({
    data: {
      assetId: anhXoaMem.id, kind: KIND, payloadRef: `if:image-to-3d/${TAG}-x2`,
      truthLevel: 'inferred', provenance: '', createdBy: nguoi.id, deletedAt: new Date(),
    },
  });

  const base = await dungServer(PORT);

  // ── CA 0 · CỔNG HARNESS ────────────────────────────────────────────────────
  const cong = ca(
    'CA 0 · HARNESS: cookie đúc mở được /api/comments (có xác thực)',
    200,
    (await fetch(`${base}/api/comments`, { headers: { cookie: c } })).status,
  );
  if (!cong) throw new Error('HARNESS ĐỎ — dừng, không báo ĐẠT cho ca nào sau.');

  // ── CA 1 · không phiên ─────────────────────────────────────────────────────
  ca('CA 1 · không phiên → 401', 401, (await doc(base, anhCoSpec.id)).ma);

  // ── CA 2 · asset chưa có bản ghi nào → danh sách RỖNG, không phải lỗi ───────
  const rong = await doc(base, anhTrong.id, c);
  ca('CA 2 · asset chưa có bản ghi → 200 + mảng rỗng (KHÔNG phải lỗi)', [200, true, 0], [
    rong.ma,
    Array.isArray(rong.body?.representations),
    rong.body?.representations?.length ?? -1,
  ]);

  // ── CA 3 · F-17: TRƯỜNG tồn tại và đúng kiểu, TRƯỚC mọi khẳng định nội dung ─
  const co = await doc(base, anhCoSpec.id, c);
  const ds = co.body?.representations;
  ca('CA 3 · F-17: `representations` tồn tại và là mảng', [200, true], [co.ma, Array.isArray(ds)]);
  if (!Array.isArray(ds)) throw new Error('Không có mảng `representations` — mọi ca sau sẽ là khẳng định trên undefined.');

  // ── CA 4 · MONG THẤY: đủ 2 bản sống ────────────────────────────────────────
  ca('CA 4 · 2 bản sống của cùng asset → trả đủ 2', 2, ds.length);

  // ── CA 5 · thứ tự: mới nhất TRƯỚC ──────────────────────────────────────────
  ca('CA 5 · chuỗi phiên bản, mới nhất trước', [moi.id, cu.id], ds.map((r) => r.id));

  // ── CA 6 · F-17: các trường tờ spec tồn tại + đúng kiểu ─────────────────────
  const d0 = ds[0] ?? {};
  ca(
    'CA 6 · F-17: bản mới nhất có đủ trường đúng kiểu (kind/payloadRef/truthLevel/provenance/verifiedBy/verifiedAt/deletedAt)',
    ['string', 'string', 'string', 'string', 'string', 'string', 'object'],
    [
      typeof d0.kind, typeof d0.payloadRef, typeof d0.truthLevel, typeof d0.provenance,
      typeof d0.verifiedBy, typeof d0.verifiedAt, typeof d0.deletedAt, // deletedAt null ⇒ 'object'
    ],
  );

  // ── CA 7 · MONG THẤY: người ký đúng, và provenance dựng lại được tờ spec ────
  let boc = null;
  try { boc = JSON.parse(d0.provenance); } catch {}
  ca(
    'CA 7 · `verified` hiện đúng người ký + provenance bóc ra đúng số/cờ đã lưu',
    [KIND, 'verified', `${TAG}_nguoi`, true, `${TAG} ghế mới`, 640, 'verified', 'human-override'],
    [
      d0.kind, d0.truthLevel, d0.verifiedBy, typeof d0.verifiedAt === 'string' && !Number.isNaN(Date.parse(d0.verifiedAt)),
      boc?.doiTuong, boc?.kichThuoc?.[0]?.mm, boc?.kichThuoc?.[0]?.flag, boc?.kichThuoc?.[0]?.canCu,
    ],
  );

  // ── CA 8 · bản xoá mềm KHÔNG lọt ───────────────────────────────────────────
  ca('CA 8 · bản xoá mềm không lọt vào danh sách', false, ds.some((r) => r.id === daXoa.id));

  // ── CA 9 · asset chỉ có bản đã xoá → rỗng, KHÔNG phải lỗi ──────────────────
  const chiXoa = await doc(base, anhXoaMem.id, c);
  ca('CA 9 · asset chỉ còn bản đã xoá → 200 + mảng rỗng (phân biệt với 401/lỗi)', [200, true, 0], [
    chiXoa.ma,
    Array.isArray(chiXoa.body?.representations),
    chiXoa.body?.representations?.length ?? -1,
  ]);

  // ── CA 10 · bản ghi CÓ nhưng trường rỗng vẫn phải trả về, không bị nuốt ─────
  const rongTruong = await prisma.assetRepresentation.create({
    data: {
      assetId: anhTrong.id, kind: KIND, payloadRef: '', truthLevel: 'inferred',
      provenance: '', createdBy: nguoi.id,
    },
  });
  const r10 = await doc(base, anhTrong.id, c);
  ca(
    'CA 10 · bản ghi có nhưng provenance rỗng → VẪN trả về (≠ "chưa có bản ghi")',
    [200, 1, rongTruong.id, ''],
    [r10.ma, r10.body?.representations?.length ?? -1, r10.body?.representations?.[0]?.id, r10.body?.representations?.[0]?.provenance],
  );

  // ── CA 11 · thiếu assetId → 400, khác hẳn 401 và khác hẳn rỗng ─────────────
  ca('CA 11 · thiếu assetId → 400 (không nhầm với rỗng)', 400,
    (await fetch(`${base}/api/asset-representation`, { headers: { cookie: c } })).status);
}

async function don() {
  for (const s of servers) s.kill();
  const assets = await prisma.libraryAsset.findMany({ where: { name: { contains: TAG } }, select: { id: true } });
  await prisma.assetRepresentation.deleteMany({ where: { assetId: { in: assets.map((a) => a.id) } } });
  await prisma.libraryAsset.deleteMany({ where: { name: { contains: TAG } } });
  const n = await prisma.user.deleteMany({ where: { name: { contains: TAG } } });
  console.log(`\n  (đã xoá ${n.count} user + ${assets.length} asset + mọi biểu diễn gắn thẻ ${TAG})`);
}

main()
  .catch((e) => {
    console.error(e.message);
    ket.push({ ten: 'CHẠY ĐƯỢC', dat: false });
  })
  .finally(async () => {
    await don().catch((e) => console.error('DỌN THẤT BẠI:', e.message));
    await prisma.$disconnect();
    const fail = ket.filter((k) => !k.dat);
    console.log(`\n${ket.length - fail.length}/${ket.length} ĐẠT`);
    process.exit(fail.length ? 1 : 0);
  });
