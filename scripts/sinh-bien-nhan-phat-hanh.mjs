#!/usr/bin/env node
/**
 * sinh-bien-nhan-phat-hanh.mjs — SBOM + BIÊN NHẬN cho bộ cài (30/08, phiếu HO-20260829110917).
 *
 * VÌ SAO: nhãn "quét sạch GPL" hiện dựa vào MỘT lệnh grep (soi-giay-phep-phat-hanh.mjs).
 * Quét sạch ≠ có biên nhận. Muốn bán ra cần ba thứ CHẠY LẠI ĐƯỢC:
 *   ① SBOM        — danh mục thành phần (CycloneDX 1.5, từ license-checker-rseidelsohn có sẵn)
 *   ② biên nhận artifact  — băm từng tệp + băm tổng, commit, working-tree bẩn hay sạch, giờ sinh
 *   ③ biên nhận giấy phép — giấy phép từng gói, ai kiểm, kiểm bằng gì, kết quả cổng GPL
 *
 * CHẠY:
 *   node scripts/sinh-bien-nhan-phat-hanh.mjs           # sinh 3 tệp vào dist-installer/bien-nhan/
 *   node scripts/sinh-bien-nhan-phat-hanh.mjs --kiem    # băm lại artifact, so với biên nhận cũ
 *                                                       #   → exit 1 nếu artifact đã đổi
 *
 * Đầu ra nằm CẠNH artifact (dist-installer/ đã gitignore) — biên nhận đi theo bản dựng,
 * không đi theo git. Máy này được nối vào electron:build/pack (chạy NGAY SAU electron-builder,
 * nên commit ghi trong biên nhận đúng là commit vừa dựng).
 *
 * ⚠️ TRUNG THỰC VỀ THỜI ĐIỂM: nếu chạy tay TRÊN MỘT ARTIFACT CŨ, trường `commit` là commit
 * LÚC SINH BIÊN NHẬN, không chắc là commit lúc dựng — nên biên nhận luôn ghi kèm mtime của
 * artifact và cờ `sinhSauDung` để người đọc tự thấy khoảng cách.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const goc = process.cwd();
const kiem = process.argv.includes('--kiem');

/* ── tìm artifact ─────────────────────────────────────────────────────────── */
const UNG_VIEN = [
  'dist-installer/mac-arm64/InteriorFlow.app',
  'dist-installer/win-unpacked',
  'dist-installer/mac/InteriorFlow.app',
];
const artifact = UNG_VIEN.map((p) => join(goc, p)).find(existsSync);
if (!artifact) {
  console.error('⛔ Không thấy artifact trong dist-installer/ — dựng trước rồi hãy sinh biên nhận.');
  process.exit(1);
}
const artifactTuongDoi = relative(goc, artifact);
const thuMucRa = join(goc, 'dist-installer', 'bien-nhan');

/* ── băm artifact: từng tệp sha256, rồi băm tổng trên manifest ────────────── */
function bamArtifact(dir) {
  const tep = [];
  const quet = (d) => {
    let muc;
    try { muc = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of muc.sort((a, b) => a.name.localeCompare(b.name))) {
      const p = join(d, e.name);
      if (e.isSymbolicLink()) continue; // .app đầy symlink vòng — như soi-giay-phep
      if (e.isDirectory()) { quet(p); continue; }
      if (!e.isFile()) continue;
      const noi = readFileSync(p);
      tep.push({
        duong: relative(dir, p),
        byte: noi.length,
        sha256: createHash('sha256').update(noi).digest('hex'),
      });
    }
  };
  quet(dir);
  const bamTong = createHash('sha256')
    .update(tep.map((t) => `${t.sha256}  ${t.duong}\n`).join(''))
    .digest('hex');
  return { tep, bamTong, soTep: tep.length, tongByte: tep.reduce((s, t) => s + t.byte, 0) };
}

/* ── chế độ --kiem: so hiện trạng với biên nhận đã ghi ────────────────────── */
if (kiem) {
  const duongBN = join(thuMucRa, 'bien-nhan-artifact.json');
  if (!existsSync(duongBN)) {
    console.error('⛔ --kiem nhưng chưa có', relative(goc, duongBN), '— sinh trước đã.');
    process.exit(1);
  }
  const cu = JSON.parse(readFileSync(duongBN, 'utf8'));
  const nay = bamArtifact(artifact);
  if (nay.bamTong === cu.bamTong && nay.soTep === cu.soTep) {
    console.log(`✅ KIỂM BIÊN NHẬN — artifact khớp: ${nay.soTep} tệp, sha256 tổng ${nay.bamTong.slice(0, 16)}…`);
    process.exit(0);
  }
  console.error('⛔ KIỂM BIÊN NHẬN — ARTIFACT ĐÃ ĐỔI so với biên nhận:');
  console.error(`   số tệp   ${cu.soTep} → ${nay.soTep}`);
  console.error(`   băm tổng ${cu.bamTong.slice(0, 16)}… → ${nay.bamTong.slice(0, 16)}…`);
  const cuMap = new Map(cu.tep.map((t) => [t.duong, t.sha256]));
  let neu = 0;
  for (const t of nay.tep) {
    if (cuMap.get(t.duong) !== t.sha256 && neu < 10) { console.error(`   · lệch: ${t.duong}`); neu++; }
    cuMap.delete(t.duong);
  }
  for (const d of [...cuMap.keys()].slice(0, 10 - neu)) console.error(`   · mất: ${d}`);
  process.exit(1);
}

/* ── sinh ─────────────────────────────────────────────────────────────────── */
mkdirSync(thuMucRa, { recursive: true });
const chay = (cmd, args) => execFileSync(cmd, args, { cwd: goc, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const pkg = JSON.parse(readFileSync(join(goc, 'package.json'), 'utf8'));
const commit = chay('git', ['rev-parse', 'HEAD']).trim();
const ban = chay('git', ['status', '--porcelain']).trim();
const soDirty = ban ? ban.split('\n').length : 0;
const luc = new Date().toISOString();
const mtimeArtifact = statSync(artifact).mtime.toISOString();
// artifact dựng TRƯỚC lúc sinh quá 10 phút ⇒ không dám nói commit này là commit dựng
const sinhSauDung = Date.now() - statSync(artifact).mtime.getTime() < 10 * 60 * 1000;

console.log('① Băm artifact', artifactTuongDoi, '…');
const bam = bamArtifact(artifact);

console.log('② Đọc giấy phép production qua license-checker-rseidelsohn …');
const rawLic = chay('node', ['node_modules/.bin/license-checker-rseidelsohn', '--production', '--json']);
const licenses = JSON.parse(rawLic);

// gói bị loại khỏi bộ cài theo build.files (cùng luật khớp tiền tố với soi-giay-phep)
const loaiTru = (pkg.build?.files ?? []).filter((x) => typeof x === 'string' && x.startsWith('!'));
const daLoaiTru = (duong) =>
  loaiTru.some((m) => {
    const tienTo = m.slice(1).split('*')[0];
    return tienTo.length >= 2 && duong.startsWith(tienTo);
  });

console.log('③ Chạy cổng GPL soi-giay-phep-phat-hanh --chan …');
let congGPL;
try {
  const out = chay('node', ['scripts/soi-giay-phep-phat-hanh.mjs', '--chan']);
  congGPL = { exit: 0, ketQua: 'PASS', dong: out.trim().split('\n').slice(0, 3) };
} catch (e) {
  congGPL = { exit: e.status ?? 1, ketQua: 'FAIL', dong: String(e.stdout ?? e.message).trim().split('\n').slice(0, 12) };
}

/* — ① SBOM CycloneDX 1.5 — */
const components = Object.entries(licenses)
  .filter(([id]) => !id.startsWith(`${pkg.name}@`))
  .map(([id, info]) => {
    const at = id.lastIndexOf('@');
    const name = id.slice(0, at);
    const version = id.slice(at + 1);
    const loai = daLoaiTru(`node_modules/${name}`) ? 'true' : 'false';
    return {
      type: 'library',
      name,
      version,
      purl: `pkg:npm/${name.replace('@', '%40')}@${version}`,
      licenses: [{ license: { name: info.licenses ?? 'UNKNOWN' } }],
      properties: [{ name: 'if:loai-khoi-bo-cai', value: loai }],
    };
  });
const sbom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  version: 1,
  metadata: {
    timestamp: luc,
    component: { type: 'application', name: pkg.name, version: pkg.version },
    properties: [
      { name: 'if:commit', value: commit },
      { name: 'if:artifact', value: artifactTuongDoi },
      { name: 'if:cong-cu', value: 'license-checker-rseidelsohn --production --json' },
    ],
  },
  components,
};
writeFileSync(join(thuMucRa, 'sbom.cdx.json'), JSON.stringify(sbom, null, 2));

/* — ② biên nhận artifact — */
writeFileSync(
  join(thuMucRa, 'bien-nhan-artifact.json'),
  JSON.stringify(
    {
      artifact: artifactTuongDoi,
      bamTong: bam.bamTong,
      soTep: bam.soTep,
      tongByte: bam.tongByte,
      commit,
      workingTreeDirty: soDirty,
      lucSinhBienNhan: luc,
      mtimeArtifact,
      sinhSauDung,
      ghiChu: sinhSauDung
        ? 'Biên nhận sinh trong vòng 10 phút sau khi artifact đổi — commit ở trên là commit lúc dựng.'
        : '⚠️ Artifact dựng TRƯỚC lúc sinh biên nhận — commit ở trên là commit LÚC SINH, KHÔNG chắc là commit lúc dựng.',
      tep: bam.tep,
    },
    null,
    2,
  ),
);

/* — ③ biên nhận giấy phép — */
const demTheoGP = {};
for (const c of components) {
  const gp = c.licenses[0].license.name;
  demTheoGP[gp] = (demTheoGP[gp] ?? 0) + 1;
}
writeFileSync(
  join(thuMucRa, 'bien-nhan-giay-phep.json'),
  JSON.stringify(
    {
      lucKiem: luc,
      commit,
      nguoiKiem: 'máy — scripts/sinh-bien-nhan-phat-hanh.mjs',
      congCu: {
        'license-checker-rseidelsohn': pkg.devDependencies?.['license-checker-rseidelsohn'] ?? 'UNKNOWN',
        'soi-giay-phep-phat-hanh.mjs': 'bản soi RUỘT tệp, không trần độ sâu (sửa 29/08)',
      },
      congGPL,
      tongGoiProduction: components.length,
      demTheoGiayPhep: demTheoGP,
      goiLoaiKhoiBoCai: components
        .filter((c) => c.properties[0].value === 'true')
        .map((c) => `${c.name}@${c.version} (${c.licenses[0].license.name})`),
      ghiChu:
        'Giấy phép đọc từ package.json từng gói qua license-checker. Gói "loại khỏi bộ cài" vẫn nằm trong cây nguồn (dev/test cần) nhưng build.files chặn không cho vào artifact — cổng GPL ở trên xác nhận bằng cách quét RUỘT artifact thật.',
    },
    null,
    2,
  ),
);

console.log(`\n✅ Đã sinh 3 biên nhận vào ${relative(goc, thuMucRa)}/`);
console.log(`   sbom.cdx.json            — ${components.length} gói production`);
console.log(`   bien-nhan-artifact.json  — ${bam.soTep} tệp · ${(bam.tongByte / 1024 / 1024).toFixed(1)} MB · sha256 ${bam.bamTong.slice(0, 16)}…`);
console.log(`   bien-nhan-giay-phep.json — cổng GPL: ${congGPL.ketQua} · dirty: ${soDirty} tệp`);
if (!sinhSauDung) console.log('   ⚠️ Artifact cũ hơn 10 phút — commit trong biên nhận KHÔNG chắc là commit dựng.');
